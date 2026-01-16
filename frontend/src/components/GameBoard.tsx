import { useState, useEffect, useRef } from 'react';
import type { Card as CardType } from '../types/card';
import { Card } from './Card';
import { AnimatedCard } from './AnimatedCard';
import { VictoryAnimation } from './VictoryAnimation';
import { LicenseModal } from './LicenseModal';
import { canMoveToFoundation } from '../game/freecellLogic';
import { checkWin } from '../game/freecellLogic';
import {
    useGameState,
    useCardDimensions,
    useCardAnimation,
    useAutoPlay,
    useDragAndDrop,
    useGameNumber,
} from '../hooks';
import {
    MAX_GAME_NUMBER,
    MIN_GAME_NUMBER,
    VICTORY_ANIMATION_DELAY_MS,
    LAST_ITEM_INDEX_OFFSET,
} from '../constants';
import './GameBoard.css';

export function GameBoard() {
    // Current game number (the actual game being played)
    const [currentGameNumber, setCurrentGameNumber] = useState(() =>
        Math.floor(Math.random() * MAX_GAME_NUMBER) + MIN_GAME_NUMBER
    );

    const [selectedCard, setSelectedCard] = useState<{ card: CardType; location: { type: string; index: number } } | null>(null);
    const [showVictory, setShowVictory] = useState(false);
    const [showLicense, setShowLicense] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showMoreHelp, setShowMoreHelp] = useState(false);
    const gameBoardRef = useRef<HTMLDivElement>(null);
    const gameAreaRef = useRef<HTMLDivElement>(null);

    // Refs for card position lookups (replacing document.querySelector)
    const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const freeCellRefs = useRef<(HTMLDivElement | null)[]>([]);
    const foundationRefs = useRef<(HTMLDivElement | null)[]>([]);
    const tableauColumnRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Ref to hold the triggerAutoPlay function (for circular dependency resolution)
    const triggerAutoPlayRef = useRef<((newState: typeof gameState) => void) | null>(null);

    // Game state management hook
    const {
        gameState,
        gameStateRef,
        history,
        dispatch,
        updateGameState: baseUpdateGameState,
        undo: baseUndo,
        startNewGame: baseStartNewGame,
    } = useGameState(currentGameNumber);

    // Card dimension calculation hook
    useCardDimensions(gameBoardRef, gameAreaRef);

    // Card animation hook
    const {
        animatingCards,
        animateMove,
        detectAutoPlayMove,
    } = useCardAnimation(
        gameState,
        (newState: typeof gameState, skipAutoPlay = false) => {
            dispatch({ type: 'UPDATE_STATE', newState });
            if (!skipAutoPlay && triggerAutoPlayRef.current) {
                triggerAutoPlayRef.current(newState);
            }
        },
        cardRefs,
        freeCellRefs,
        foundationRefs,
        tableauColumnRefs
    );

    // Auto-play hook
    const { triggerAutoPlay } = useAutoPlay(
        gameStateRef,
        animateMove,
        detectAutoPlayMove,
        dispatch
    );

    // Store triggerAutoPlay in ref for use in animation callback
    useEffect(() => {
        triggerAutoPlayRef.current = triggerAutoPlay;
    }, [triggerAutoPlay]);

    // Wrap updateGameState to include auto-play
    const updateGameState = (newState: typeof gameState) => {
        baseUpdateGameState(newState);
        triggerAutoPlay(newState);
    };

    // Drag and drop hook
    const {
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDrop,
        isCardDragging,
        tryMove,
    } = useDragAndDrop(gameState, updateGameState);

    // Wrapped functions to update currentGameNumber
    const startNewGame = (num: number, skipWarning = false) => {
        // Warn if game is in progress (has history and not won)
        if (!skipWarning && history.length > 0 && !checkWin(gameState)) {
            const confirmed = window.confirm(
                'Starting a new game will lose your current progress. Are you sure?'
            );
            if (!confirmed) return;
        }

        baseStartNewGame(num);
        setCurrentGameNumber(num);
        setSelectedCard(null);
        setShowVictory(false);
    };

    const undo = () => {
        baseUndo();
        setSelectedCard(null);
    };

    // Game number input hook
    const {
        inputValue,
        handleGameNumberChange,
        getButtonLabel,
        handleButtonClick,
    } = useGameNumber(currentGameNumber, gameState, history, startNewGame);

    // Click and double-click handlers (not extracted into hooks)
    const handleCardClick = (card: CardType, location: { type: string; index: number }) => {
        if (selectedCard) {
            // Allow clicking on any card in a column to move selected card there
            // This is especially important for mobile where cards overlap heavily
            tryMove(selectedCard, location);
            setSelectedCard(null);
        } else {
            // Select this card (but for tableau, only allow selecting the top card)
            if (location.type === 'tableau') {
                const column = gameState.tableau[location.index];
                if (column[column.length - LAST_ITEM_INDEX_OFFSET]?.id === card.id) {
                    setSelectedCard({ card, location });
                }
            } else {
                setSelectedCard({ card, location });
            }
        }
    };

    const handleDoubleClick = (card: CardType, location: { type: string; index: number }) => {
        // Try to auto-move: first to foundation, then to free cell if from tableau
        // Deep copy the game state
        const newState = {
            ...gameState,
            tableau: gameState.tableau.map(col => [...col]),
            freeCells: [...gameState.freeCells],
            foundations: {
                hearts: [...gameState.foundations.hearts],
                diamonds: [...gameState.foundations.diamonds],
                clubs: [...gameState.foundations.clubs],
                spades: [...gameState.foundations.spades],
            },
        };
        let moved = false;

        // Try foundation first
        if (canMoveToFoundation(card, newState.foundations[card.suit])) {
            if (location.type === 'tableau') {
                const column = [...newState.tableau[location.index]];
                if (column[column.length - LAST_ITEM_INDEX_OFFSET]?.id === card.id) {
                    column.pop();
                    newState.tableau[location.index] = column;
                    newState.foundations[card.suit] = [...newState.foundations[card.suit], card];
                    moved = true;
                }
            } else if (location.type === 'freecell') {
                if (newState.freeCells[location.index]?.id === card.id) {
                    newState.freeCells[location.index] = null;
                    newState.foundations[card.suit] = [...newState.foundations[card.suit], card];
                    moved = true;
                }
            }
        }

        // If couldn't move to foundation and from tableau, try moving to free cell
        if (!moved && location.type === 'tableau') {
            const column = [...newState.tableau[location.index]];
            if (column[column.length - LAST_ITEM_INDEX_OFFSET]?.id === card.id) {
                // Find first empty free cell
                const emptyFreeCellIndex = newState.freeCells.findIndex(cell => cell === null);
                if (emptyFreeCellIndex !== -1) {
                    column.pop();
                    newState.tableau[location.index] = column;
                    newState.freeCells[emptyFreeCellIndex] = card;
                    moved = true;
                }
            }
        }

        if (moved) {
            updateGameState(newState);
            setSelectedCard(null);
        }
    };

    // Warn before leaving page if game is in progress
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Only warn if game is in progress (has history and not won)
            if (history.length > 0 && !checkWin(gameState)) {
                e.preventDefault();
                // Modern browsers require returnValue to be set
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [history.length, gameState]);

    // Check for win condition
    useEffect(() => {
        if (checkWin(gameState)) {
            setTimeout(() => {
                setShowVictory(true);
            }, VICTORY_ANIMATION_DELAY_MS);
        }
    }, [gameState]);

    return (
        <div className="game-board" ref={gameBoardRef}>
            <div className="game-header">
                <h1>FreeCell</h1>

                <div className="game-stats">
                    <span>Moves: {history.length}</span>
                </div>

                <div className="game-controls">
                    <button onClick={undo} disabled={history.length === 0}>Undo</button>
                    <label>
                        Game #:
                        <input
                            type="number"
                            min={MIN_GAME_NUMBER.toString()}
                            max={MAX_GAME_NUMBER.toString()}
                            value={inputValue}
                            onChange={(e) => handleGameNumberChange(e.target.value)}
                            className={parseInt(inputValue) === currentGameNumber ? 'game-number-match' : ''}
                        />
                    </label>
                    <button onClick={handleButtonClick}>
                        {getButtonLabel()}
                    </button>
                </div>
            </div>

            <div className="game-area" ref={gameAreaRef}>
                {/* Free Cells and Foundations */}
                <div className="top-area">
                    <div className="free-cells">
                        <div className="cell-row">
                            {gameState.freeCells.map((card, index) => (
                                <div
                                    key={index}
                                    ref={el => { freeCellRefs.current[index] = el; }}
                                    className="cell"
                                    onClick={() => {
                                        if (card) {
                                            handleCardClick(card, { type: 'freecell', index });
                                        } else if (selectedCard) {
                                            tryMove(selectedCard, { type: 'freecell', index });
                                        }
                                    }}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, { type: 'freecell', index })}
                                >
                                    {card ? (
                                        <Card
                                            card={card}
                                            draggable={true}
                                            onDragStart={(e) => handleDragStart(e, card, { type: 'freecell', index })}
                                            onDragEnd={handleDragEnd}
                                            onDoubleClick={() => handleDoubleClick(card, { type: 'freecell', index })}
                                            className={`${selectedCard?.card.id === card.id ? 'selected' : ''} ${isCardDragging(card) ? 'dragging' : ''}`}
                                            cardRef={el => {
                                                if (el) cardRefs.current.set(card.id, el);
                                                else cardRefs.current.delete(card.id);
                                            }}
                                        />
                                    ) : (
                                        <div className="card-placeholder"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="foundations">
                        <div className="cell-row">
                            {(['hearts', 'diamonds', 'clubs', 'spades'] as const).map((suit, index) => {
                                const cards = gameState.foundations[suit];
                                const topCard = cards[cards.length - LAST_ITEM_INDEX_OFFSET];
                                return (
                                    <div
                                        key={suit}
                                        ref={el => { foundationRefs.current[index] = el; }}
                                        className={`cell foundation-${suit}`}
                                        onClick={() => {
                                            if (topCard) {
                                                handleCardClick(topCard, { type: 'foundation', index });
                                            } else if (selectedCard) {
                                                tryMove(selectedCard, { type: 'foundation', index });
                                            }
                                        }}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, { type: 'foundation', index })}
                                    >
                                        {topCard ? (
                                            <Card
                                                card={topCard}
                                                draggable={true}
                                                onDragStart={(e) => handleDragStart(e, topCard, { type: 'foundation', index })}
                                                onDragEnd={handleDragEnd}
                                                onDoubleClick={() => handleDoubleClick(topCard, { type: 'foundation', index })}
                                                className={`${selectedCard?.card.id === topCard.id ? 'selected' : ''} ${isCardDragging(topCard) ? 'dragging' : ''}`}
                                                cardRef={el => {
                                                    if (el) cardRefs.current.set(topCard.id, el);
                                                    else cardRefs.current.delete(topCard.id);
                                                }}
                                            />
                                        ) : (
                                            <div className="card-placeholder"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Tableau */}
                <div className="tableau">
                    {gameState.tableau.map((column, columnIndex) => (
                        <div
                            key={columnIndex}
                            ref={el => { tableauColumnRefs.current[columnIndex] = el; }}
                            className="tableau-column"
                        >
                            <div
                                className="column-drop-zone"
                                onClick={() => selectedCard && tryMove(selectedCard, { type: 'tableau', index: columnIndex })}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, { type: 'tableau', index: columnIndex })}
                            >
                                {column.length === 0 && <div className="card-placeholder"></div>}
                                {column.map((card, cardIndex) => (
                                    <Card
                                        key={card.id}
                                        card={card}
                                        draggable={cardIndex === column.length - LAST_ITEM_INDEX_OFFSET}
                                        onDragStart={(e) => handleDragStart(e, card, { type: 'tableau', index: columnIndex })}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleCardClick(card, { type: 'tableau', index: columnIndex })}
                                        onDoubleClick={() => cardIndex === column.length - LAST_ITEM_INDEX_OFFSET && handleDoubleClick(card, { type: 'tableau', index: columnIndex })}
                                        className={`${selectedCard?.card.id === card.id ? 'selected' : ''} ${isCardDragging(card) ? 'dragging' : ''}`}
                                        style={{
                                            marginTop: cardIndex === 0 ? '0' : `calc(var(--card-height, 140px) * -0.75)`
                                        }}
                                        cardRef={el => {
                                            if (el) cardRefs.current.set(card.id, el);
                                            else cardRefs.current.delete(card.id);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="game-footer">
                <div className="footer-buttons">
                    <button
                        onClick={() => setShowHelp(true)}
                        className="footer-button"
                    >
                        How to Play
                    </button>
                    <a
                        href="https://www.joshuakite.co.uk/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-button"
                    >
                        Visit my Website
                    </a>
                    <button
                        onClick={() => setShowLicense(true)}
                        className="footer-button"
                    >
                        View Licences
                    </button>
                    <a
                        href="https://github.com/joshuamkite/freecell"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-button"
                    >
                        View Source
                    </a>
                </div>
            </footer>

            {showVictory && <VictoryAnimation onClose={() => setShowVictory(false)} />}

            {showLicense && (
                <LicenseModal onClose={() => setShowLicense(false)} />
            )}

            {/* How to Play Modal */}
            {showHelp && (
                <div className="help-overlay">
                    <div className="help-modal">
                        <button className="help-close" onClick={() => setShowHelp(false)}>× Close</button>
                        <h2>How to Play</h2>

                        <div className="help-content">
                            <section className="help-section">
                                <p>Move all cards to the four foundation piles, building each suit from Ace to King.</p>
                                <p><strong>Free Cells:</strong> Use the four free cells to temporarily store single cards.</p>
                                <p><strong>Tableau:</strong> Build down in alternating colors (red on black, black on red).</p>

                                <button
                                    className="expand-help-button"
                                    onClick={() => setShowMoreHelp(!showMoreHelp)}
                                >
                                    {showMoreHelp ? '▼ Hide Details' : '▶ Show Details'}
                                </button>

                                {showMoreHelp && (
                                    <div className="help-details">
                                        <h3>Objective</h3>
                                        <p>Build all four foundation piles from Ace to King, one for each suit (Hearts, Diamonds, Clubs, Spades).</p>

                                        <h3>Free Cells</h3>
                                        <ul>
                                            <li>Four free cells in the top-left for temporary card storage</li>
                                            <li>Each free cell can hold only one card at a time</li>
                                            <li>Strategic use of free cells is key to winning</li>
                                        </ul>

                                        <h3>Tableau Rules</h3>
                                        <ul>
                                            <li>Build down in alternating colors</li>
                                            <li>Only the top card of each column can be moved</li>
                                            <li>Any card can be placed on an empty column</li>
                                            <li>Double-click a card to auto-move it to a foundation</li>
                                        </ul>

                                        <h3>Foundation Rules</h3>
                                        <ul>
                                            <li>Build up by suit from Ace to King</li>
                                            <li>Cards are automatically moved when safe</li>
                                        </ul>

                                        <h3>Tips</h3>
                                        <ul>
                                            <li>Keep free cells open as long as possible</li>
                                            <li>Plan several moves ahead before committing</li>
                                            <li>Empty tableau columns are very valuable</li>
                                            <li>Use Undo to try different strategies</li>
                                        </ul>
                                    </div>
                                )}
                            </section>
                        </div>

                        <button className="btn-help-close" onClick={() => setShowHelp(false)}>
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            {animatingCards && (
                <AnimatedCard
                    cards={animatingCards.cards}
                    startPos={animatingCards.startPos}
                    endPos={animatingCards.endPos}
                    onComplete={animatingCards.onComplete}
                />
            )}
        </div>
    );
}
