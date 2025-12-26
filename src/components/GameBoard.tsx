import { useState, useEffect, useRef, useReducer } from 'react';
import type { GameState } from '../types/gameState';
import type { Card as CardType } from '../types/card';
import { getRankValue } from '../types/card';
import { Card } from './Card';
import { VictoryAnimation } from './VictoryAnimation';
import { dealCards, canMoveToTableau, canMoveToFoundation, checkWin } from '../game/freecellLogic';
import './GameBoard.css';

// Reducer for managing game state and history together
type GameAction =
    | { type: 'UPDATE_STATE'; newState: GameState }
    | { type: 'UNDO' }
    | { type: 'NEW_GAME'; initialState: GameState };

interface GameReducerState {
    current: GameState;
    history: GameState[];
}

function gameReducer(state: GameReducerState, action: GameAction): GameReducerState {
    switch (action.type) {
        case 'UPDATE_STATE':
            return {
                current: action.newState,
                history: [...state.history, state.current],
            };
        case 'UNDO':
            if (state.history.length === 0) return state;
            return {
                current: state.history[state.history.length - 1],
                history: state.history.slice(0, -1),
            };
        case 'NEW_GAME':
            return {
                current: action.initialState,
                history: [],
            };
        default:
            return state;
    }
}

export function GameBoard() {
    const [gameNumber, setGameNumber] = useState(() => Math.floor(Math.random() * 1000000) + 1);
    const [gameReducerState, dispatch] = useReducer(gameReducer, { current: dealCards(gameNumber), history: [] });
    const gameState = gameReducerState.current;
    const history = gameReducerState.history;

    const [selectedCard, setSelectedCard] = useState<{ card: CardType; location: { type: string; index: number } } | null>(null);
    const [draggedCard, setDraggedCard] = useState<{ card: CardType; location: { type: string; index: number } } | null>(null);
    const [showVictory, setShowVictory] = useState(false);
    const autoPlayTimeoutRef = useRef<number | null>(null);

    // Helper to update game state and save to history
    const updateGameState = (newState: GameState) => {
        dispatch({ type: 'UPDATE_STATE', newState });
    };

    const newGame = (num: number) => {
        dispatch({ type: 'NEW_GAME', initialState: dealCards(num) });
        setGameNumber(num);
        setSelectedCard(null);
        setDraggedCard(null);
        setShowVictory(false);
    };

    const undo = () => {
        dispatch({ type: 'UNDO' });
        setSelectedCard(null);
    };

    // Check for win condition
    useEffect(() => {
        if (checkWin(gameState)) {
            setTimeout(() => {
                setShowVictory(true);
            }, 500);
        }
    }, [gameState]);

    // Auto-play: automatically move cards to foundations when safe
    useEffect(() => {
        if (autoPlayTimeoutRef.current) {
            clearTimeout(autoPlayTimeoutRef.current);
        }

        autoPlayTimeoutRef.current = window.setTimeout(() => {
            // Deep copy the game state
            const newState: GameState = {
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

            // Helper: Get the minimum rank in opposite color foundations
            const getMinOppositeColorRank = (suit: string): number => {
                const isRed = suit === 'hearts' || suit === 'diamonds';
                const oppositeSuits = isRed
                    ? ['clubs', 'spades']
                    : ['hearts', 'diamonds'];

                return Math.min(
                    newState.foundations[oppositeSuits[0] as keyof typeof newState.foundations].length,
                    newState.foundations[oppositeSuits[1] as keyof typeof newState.foundations].length
                );
            };

            // A card is safe to auto-move if its rank is at most 2 higher than
            // the minimum rank of opposite color foundations
            const isSafeToAutoMove = (card: CardType): boolean => {
                const cardRankValue = getRankValue(card.rank);
                const currentFoundationRank = newState.foundations[card.suit].length;
                const minOppositeRank = getMinOppositeColorRank(card.suit);
                return cardRankValue === currentFoundationRank + 1 &&
                    cardRankValue <= minOppositeRank + 2;
            };

            // Try to move from free cells first
            for (let i = 0; i < newState.freeCells.length && !moved; i++) {
                const card = newState.freeCells[i];
                if (card && canMoveToFoundation(card, newState.foundations[card.suit]) && isSafeToAutoMove(card)) {
                    newState.freeCells[i] = null;
                    newState.foundations[card.suit] = [...newState.foundations[card.suit], card];
                    moved = true;
                    break;
                }
            }

            // Try to move from tableau columns
            if (!moved) {
                for (let i = 0; i < newState.tableau.length && !moved; i++) {
                    const column = newState.tableau[i];
                    if (column.length > 0) {
                        const card = column[column.length - 1];
                        if (canMoveToFoundation(card, newState.foundations[card.suit]) && isSafeToAutoMove(card)) {
                            const newColumn = [...column];
                            newColumn.pop();
                            newState.tableau[i] = newColumn;
                            newState.foundations[card.suit] = [...newState.foundations[card.suit], card];
                            moved = true;
                            break;
                        }
                    }
                }
            }

            if (moved) {
                updateGameState(newState);
            }
        }, 800); // Delay to make auto-play moves visible

        return () => {
            if (autoPlayTimeoutRef.current) {
                clearTimeout(autoPlayTimeoutRef.current);
            }
        };
    }, [gameState]);

    const handleCardClick = (card: CardType, location: { type: string; index: number }) => {
        if (selectedCard) {
            // Try to move selected card to clicked location
            tryMove(selectedCard, location);
            setSelectedCard(null);
        } else {
            // Select this card
            setSelectedCard({ card, location });
        }
    };

    const handleDoubleClick = (card: CardType, location: { type: string; index: number }) => {
        // Try to auto-move: first to foundation, then to free cell if from tableau
        // Deep copy the game state
        const newState: GameState = {
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
                if (column[column.length - 1]?.id === card.id) {
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
            if (column[column.length - 1]?.id === card.id) {
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

    const handleDragStart = (e: React.DragEvent, card: CardType, location: { type: string; index: number }) => {
        setDraggedCard({ card, location });
        e.dataTransfer.effectAllowed = 'move';
        // Add a slight delay to prevent drag image from showing
        setTimeout(() => {
            const target = e.target as HTMLElement;
            target.style.opacity = '0.5';
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.target as HTMLElement;
        target.style.opacity = '1';
        setDraggedCard(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, location: { type: string; index: number }) => {
        e.preventDefault();
        if (draggedCard) {
            tryMove(draggedCard, location);
            setDraggedCard(null);
        }
    };

    const tryMove = (
        from: { card: CardType; location: { type: string; index: number } },
        to: { type: string; index: number }
    ) => {
        // Deep copy the game state
        const newState: GameState = {
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

        // Move to tableau
        if (to.type === 'tableau') {
            const targetColumn = [...newState.tableau[to.index]];

            if (canMoveToTableau(from.card, targetColumn)) {
                // Remove from source
                if (from.location.type === 'tableau') {
                    const sourceColumn = [...newState.tableau[from.location.index]];
                    if (sourceColumn[sourceColumn.length - 1]?.id === from.card.id) {
                        sourceColumn.pop();
                        newState.tableau[from.location.index] = sourceColumn;
                        moved = true;
                    }
                } else if (from.location.type === 'freecell') {
                    if (newState.freeCells[from.location.index]?.id === from.card.id) {
                        newState.freeCells[from.location.index] = null;
                        moved = true;
                    }
                }

                if (moved) {
                    targetColumn.push(from.card);
                    newState.tableau[to.index] = targetColumn;
                }
            }
        }

        // Move to free cell
        if (to.type === 'freecell' && !moved) {
            if (newState.freeCells[to.index] === null) {
                // Remove from source
                if (from.location.type === 'tableau') {
                    const sourceColumn = [...newState.tableau[from.location.index]];
                    if (sourceColumn[sourceColumn.length - 1]?.id === from.card.id) {
                        sourceColumn.pop();
                        newState.tableau[from.location.index] = sourceColumn;
                        newState.freeCells[to.index] = from.card;
                        moved = true;
                    }
                }
            }
        }

        // Move to foundation
        if (to.type === 'foundation' && !moved) {
            const suit = ['hearts', 'diamonds', 'clubs', 'spades'][to.index] as keyof typeof newState.foundations;

            if (canMoveToFoundation(from.card, newState.foundations[suit])) {
                // Remove from source
                if (from.location.type === 'tableau') {
                    const sourceColumn = [...newState.tableau[from.location.index]];
                    if (sourceColumn[sourceColumn.length - 1]?.id === from.card.id) {
                        sourceColumn.pop();
                        newState.tableau[from.location.index] = sourceColumn;
                        moved = true;
                    }
                } else if (from.location.type === 'freecell') {
                    if (newState.freeCells[from.location.index]?.id === from.card.id) {
                        newState.freeCells[from.location.index] = null;
                        moved = true;
                    }
                }

                if (moved) {
                    newState.foundations[suit] = [...newState.foundations[suit], from.card];
                }
            }
        }

        if (moved) {
            updateGameState(newState);
        }
    };

    return (
        <div className="game-board">
            <div className="game-header">
                <h1>FreeCell</h1>

                <div className="undo-controls">
                    <button onClick={undo} disabled={history.length === 0}>Undo</button>
                </div>

                <div className="game-controls">
                    <button onClick={() => {
                        const randomNum = Math.floor(Math.random() * 1000000) + 1;
                        newGame(randomNum);
                    }}>New Game</button>
                    <label>
                        Game #:
                        <input
                            type="number"
                            min="1"
                            max="1000000"
                            value={gameNumber}
                            onChange={(e) => {
                                const num = parseInt(e.target.value) || 1;
                                setGameNumber(Math.max(1, Math.min(1000000, num)));
                            }}
                        />
                    </label>
                    <button onClick={() => newGame(gameNumber)}>Play Game #</button>
                </div>
            </div>

            <div className="game-area">
                {/* Free Cells and Foundations */}
                <div className="top-area">
                    <div className="free-cells">
                        <div className="cell-row">
                            {gameState.freeCells.map((card, index) => (
                                <div
                                    key={index}
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
                                            className={selectedCard?.card.id === card.id ? 'selected' : ''}
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
                                const topCard = cards[cards.length - 1];
                                return (
                                    <div
                                        key={suit}
                                        className={`cell foundation-${suit}`}
                                        onClick={() => selectedCard && tryMove(selectedCard, { type: 'foundation', index })}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, { type: 'foundation', index })}
                                    >
                                        {topCard ? (
                                            <Card card={topCard} />
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
                        <div key={columnIndex} className="tableau-column">
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
                                        draggable={cardIndex === column.length - 1}
                                        onDragStart={(e) => handleDragStart(e, card, { type: 'tableau', index: columnIndex })}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => cardIndex === column.length - 1 && handleCardClick(card, { type: 'tableau', index: columnIndex })}
                                        onDoubleClick={() => cardIndex === column.length - 1 && handleDoubleClick(card, { type: 'tableau', index: columnIndex })}
                                        className={selectedCard?.card.id === card.id ? 'selected' : ''}
                                        style={{ marginTop: cardIndex === 0 ? '0' : '-110px' }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="game-footer">
                <p>
                    Card images by Byron Knoll,{' '}
                    <a
                        href="https://commons.wikimedia.org/wiki/Category:SVG_English_pattern_playing_cards"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Wikimedia Commons
                    </a>
                    {' '}(Public Domain)
                </p>
            </footer>

            {showVictory && <VictoryAnimation />}
        </div>
    );
}
