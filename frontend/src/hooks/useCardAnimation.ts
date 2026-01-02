import { useState } from 'react';
import type { GameState } from '../types/gameState';
import type { Card as CardType } from '../types/card';
import { canMoveToTableau, canMoveToFoundation } from '../game/freecellLogic';
import {
    LAST_ITEM_INDEX_OFFSET,
    TABLEAU_CARD_OVERLAP,
} from '../constants';

/**
 * Animation state structure
 */
interface AnimatingCards {
    cards: CardType[];
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
    onComplete: () => void;
}

/**
 * Custom hook for managing card animations
 *
 * Provides functions to animate card movements between piles, get card positions,
 * and perform moves. This hook handles the visual animation while delegating
 * state updates to the provided callback.
 *
 * Note: Currently uses document.querySelector for DOM lookups. Session 3 will
 * refactor to use React refs for better performance and React idioms.
 *
 * @param gameState - Current game state
 * @param updateGameStateImmediate - Function to update state immediately (with auto-play)
 * @returns Object containing animation state and movement functions
 */
export function useCardAnimation(
    gameState: GameState,
    updateGameStateImmediate: (newState: GameState, skipAutoPlay?: boolean) => void
) {
    // Animation state
    const [animatingCards, setAnimatingCards] = useState<AnimatingCards | null>(null);

    /**
     * Helper function to get card element position
     */
    const getCardPosition = (cardId: string): { x: number; y: number } | null => {
        const element = document.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement;
        if (!element) return null;

        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top
        };
    };

    /**
     * Helper to get the destination element position (uses current DOM state, not future state)
     */
    const getDestinationPosition = (
        toPile: 'tableau' | 'freecell' | 'foundation',
        toIndex: number
    ): { x: number; y: number } | null => {
        if (toPile === 'foundation') {
            // Find the foundation cell
            const foundationCells = document.querySelectorAll('.foundation-hearts, .foundation-diamonds, .foundation-clubs, .foundation-spades');
            const targetCell = foundationCells[toIndex] as HTMLElement;
            if (!targetCell) return null;

            const rect = targetCell.getBoundingClientRect();
            return { x: rect.left, y: rect.top };
        } else if (toPile === 'freecell') {
            // Find the free cell
            const freeCells = document.querySelectorAll('.free-cells .cell');
            const targetCell = freeCells[toIndex] as HTMLElement;
            if (!targetCell) return null;

            const rect = targetCell.getBoundingClientRect();
            return { x: rect.left, y: rect.top };
        } else {
            // Tableau column - find the current last card in DOM
            const tableauColumns = document.querySelectorAll('.tableau-column');
            const targetColumn = tableauColumns[toIndex] as HTMLElement;
            if (!targetColumn) return null;

            // Look for cards in this column
            const cards = targetColumn.querySelectorAll('.card');
            if (cards.length > 0) {
                // Get the last card's position
                const lastCard = cards[cards.length - LAST_ITEM_INDEX_OFFSET] as HTMLElement;
                const rect = lastCard.getBoundingClientRect();

                // Calculate the position for the new card (below the last one)
                const cardHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-height') || '140');
                return {
                    x: rect.left,
                    y: rect.top + cardHeight * (1 - TABLEAU_CARD_OVERLAP)
                };
            } else {
                // Empty column - get the placeholder position
                const placeholder = targetColumn.querySelector('.card-placeholder') as HTMLElement;
                if (!placeholder) return null;

                const rect = placeholder.getBoundingClientRect();
                return { x: rect.left, y: rect.top };
            }
        }
    };

    /**
     * Perform an animated move
     */
    const animateMove = (
        fromPile: 'tableau' | 'freecell' | 'foundation',
        fromIndex: number,
        toPile: 'tableau' | 'freecell' | 'foundation',
        toIndex: number,
        onAnimationComplete?: () => void,
        sourceState?: GameState  // Optional source state for auto-play
    ) => {
        const stateToUse = sourceState || gameState;

        // Get the card being moved
        let cardToMove: CardType;
        let cardId: string;

        if (fromPile === 'freecell') {
            const card = stateToUse.freeCells[fromIndex];
            if (!card) {
                onAnimationComplete?.();
                return;
            }
            cardToMove = card;
            cardId = card.id;
        } else if (fromPile === 'foundation') {
            const suit = ['hearts', 'diamonds', 'clubs', 'spades'][fromIndex] as keyof typeof stateToUse.foundations;
            const foundation = stateToUse.foundations[suit];
            if (foundation.length === 0) {
                onAnimationComplete?.();
                return;
            }
            cardToMove = foundation[foundation.length - LAST_ITEM_INDEX_OFFSET];
            cardId = cardToMove.id;
        } else {
            // Tableau
            const column = stateToUse.tableau[fromIndex];
            if (column.length === 0) {
                onAnimationComplete?.();
                return;
            }
            cardToMove = column[column.length - LAST_ITEM_INDEX_OFFSET];
            cardId = cardToMove.id;
        }

        // Get start position
        const startPos = getCardPosition(cardId);
        if (!startPos) {
            // Can't animate - just do the move immediately
            const newState = performMove(gameState, fromPile, fromIndex, toPile, toIndex);
            if (newState) {
                updateGameStateImmediate(newState);
            }
            onAnimationComplete?.();
            return;
        }

        // Perform the move to get the new state
        const newState = performMove(stateToUse, fromPile, fromIndex, toPile, toIndex);
        if (!newState) {
            onAnimationComplete?.();
            return; // Invalid move
        }

        // Get end position based on current DOM state
        const endPos = getDestinationPosition(toPile, toIndex);
        if (!endPos) {
            // Can't get end position - just update immediately
            updateGameStateImmediate(newState);
            onAnimationComplete?.();
            return;
        }

        // Start the animation
        setAnimatingCards({
            cards: [cardToMove],
            startPos,
            endPos,
            onComplete: () => {
                setAnimatingCards(null);
                updateGameStateImmediate(newState);
                onAnimationComplete?.();
            }
        });
    };

    /**
     * Perform a move without animation (returns new state or null if invalid)
     */
    const performMove = (
        state: GameState,
        fromPile: 'tableau' | 'freecell' | 'foundation',
        fromIndex: number,
        toPile: 'tableau' | 'freecell' | 'foundation',
        toIndex: number
    ): GameState | null => {
        // Deep copy the game state
        const newState: GameState = {
            ...state,
            tableau: state.tableau.map(col => [...col]),
            freeCells: [...state.freeCells],
            foundations: {
                hearts: [...state.foundations.hearts],
                diamonds: [...state.foundations.diamonds],
                clubs: [...state.foundations.clubs],
                spades: [...state.foundations.spades],
            },
        };

        // Get the card being moved
        let cardToMove: CardType | null = null;

        if (fromPile === 'freecell') {
            cardToMove = newState.freeCells[fromIndex];
            if (!cardToMove) return null;
        } else if (fromPile === 'foundation') {
            const suit = ['hearts', 'diamonds', 'clubs', 'spades'][fromIndex] as keyof typeof newState.foundations;
            const foundation = newState.foundations[suit];
            if (foundation.length === 0) return null;
            cardToMove = foundation[foundation.length - LAST_ITEM_INDEX_OFFSET];
        } else {
            // Tableau
            const column = newState.tableau[fromIndex];
            if (column.length === 0) return null;
            cardToMove = column[column.length - LAST_ITEM_INDEX_OFFSET];
        }

        if (!cardToMove) return null;

        // Check if move is valid
        let isValid = false;

        if (toPile === 'foundation') {
            const suit = ['hearts', 'diamonds', 'clubs', 'spades'][toIndex] as keyof typeof newState.foundations;
            isValid = canMoveToFoundation(cardToMove, newState.foundations[suit]);
            if (isValid) {
                // Remove from source
                if (fromPile === 'freecell') {
                    newState.freeCells[fromIndex] = null;
                } else if (fromPile === 'foundation') {
                    const fromSuit = ['hearts', 'diamonds', 'clubs', 'spades'][fromIndex] as keyof typeof newState.foundations;
                    newState.foundations[fromSuit] = newState.foundations[fromSuit].slice(0, -LAST_ITEM_INDEX_OFFSET);
                } else {
                    newState.tableau[fromIndex] = newState.tableau[fromIndex].slice(0, -LAST_ITEM_INDEX_OFFSET);
                }
                // Add to foundation
                newState.foundations[suit] = [...newState.foundations[suit], cardToMove];
            }
        } else if (toPile === 'tableau') {
            isValid = canMoveToTableau(cardToMove, newState.tableau[toIndex]);
            if (isValid) {
                // Remove from source
                if (fromPile === 'freecell') {
                    newState.freeCells[fromIndex] = null;
                } else if (fromPile === 'foundation') {
                    const fromSuit = ['hearts', 'diamonds', 'clubs', 'spades'][fromIndex] as keyof typeof newState.foundations;
                    newState.foundations[fromSuit] = newState.foundations[fromSuit].slice(0, -LAST_ITEM_INDEX_OFFSET);
                } else {
                    newState.tableau[fromIndex] = newState.tableau[fromIndex].slice(0, -LAST_ITEM_INDEX_OFFSET);
                }
                // Add to tableau
                newState.tableau[toIndex] = [...newState.tableau[toIndex], cardToMove];
            }
        } else if (toPile === 'freecell') {
            isValid = newState.freeCells[toIndex] === null;
            if (isValid) {
                // Remove from source
                if (fromPile === 'freecell') {
                    newState.freeCells[fromIndex] = null;
                } else if (fromPile === 'foundation') {
                    const fromSuit = ['hearts', 'diamonds', 'clubs', 'spades'][fromIndex] as keyof typeof newState.foundations;
                    newState.foundations[fromSuit] = newState.foundations[fromSuit].slice(0, -LAST_ITEM_INDEX_OFFSET);
                } else {
                    newState.tableau[fromIndex] = newState.tableau[fromIndex].slice(0, -LAST_ITEM_INDEX_OFFSET);
                }
                // Add to free cell
                newState.freeCells[toIndex] = cardToMove;
            }
        }

        return isValid ? newState : null;
    };

    /**
     * Helper to detect which card moved between states (for auto-play animation)
     */
    const detectAutoPlayMove = (oldState: GameState, newState: GameState): {
        fromPile: 'tableau' | 'freecell';
        fromIndex: number;
        toPile: 'foundation';
        toIndex: number;
    } | null => {
        // Check free cells
        for (let i = 0; i < oldState.freeCells.length; i++) {
            const oldCard = oldState.freeCells[i];
            const newCard = newState.freeCells[i];
            if (oldCard && !newCard) {
                // A card was removed from this free cell
                // Find which foundation gained it
                const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
                for (let j = 0; j < suits.length; j++) {
                    const suit = suits[j];
                    if (newState.foundations[suit].length > oldState.foundations[suit].length) {
                        const addedCard = newState.foundations[suit][newState.foundations[suit].length - LAST_ITEM_INDEX_OFFSET];
                        if (addedCard.id === oldCard.id) {
                            return {
                                fromPile: 'freecell',
                                fromIndex: i,
                                toPile: 'foundation',
                                toIndex: j
                            };
                        }
                    }
                }
            }
        }

        // Check tableau columns
        for (let col = 0; col < oldState.tableau.length; col++) {
            const oldColumn = oldState.tableau[col];
            const newColumn = newState.tableau[col];

            if (oldColumn.length > newColumn.length) {
                const movedCard = oldColumn[oldColumn.length - LAST_ITEM_INDEX_OFFSET];
                // Find which foundation gained this card
                const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
                for (let j = 0; j < suits.length; j++) {
                    const suit = suits[j];
                    if (newState.foundations[suit].length > oldState.foundations[suit].length) {
                        const addedCard = newState.foundations[suit][newState.foundations[suit].length - LAST_ITEM_INDEX_OFFSET];
                        if (addedCard.id === movedCard.id) {
                            return {
                                fromPile: 'tableau',
                                fromIndex: col,
                                toPile: 'foundation',
                                toIndex: j
                            };
                        }
                    }
                }
            }
        }

        return null;
    };

    return {
        animatingCards,
        animateMove,
        performMove,
        detectAutoPlayMove,
    };
}
