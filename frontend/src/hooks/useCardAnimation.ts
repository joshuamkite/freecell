import { useState } from 'react';
import type { RefObject } from 'react';
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
 * Uses React refs for DOM element lookups instead of document.querySelector
 * for better performance and React idioms.
 *
 * @param gameState - Current game state
 * @param updateGameStateImmediate - Function to update state immediately (with auto-play)
 * @param cardRefs - Map of card IDs to their DOM elements
 * @param freeCellRefs - Array of free cell DOM elements
 * @param foundationRefs - Array of foundation DOM elements
 * @param tableauColumnRefs - Array of tableau column DOM elements
 * @returns Object containing animation state and movement functions
 */
export function useCardAnimation(
    gameState: GameState,
    updateGameStateImmediate: (newState: GameState, skipAutoPlay?: boolean) => void,
    cardRefs: RefObject<Map<string, HTMLDivElement>>,
    freeCellRefs: RefObject<(HTMLDivElement | null)[]>,
    foundationRefs: RefObject<(HTMLDivElement | null)[]>,
    tableauColumnRefs: RefObject<(HTMLDivElement | null)[]>
) {
    // Animation state
    const [animatingCards, setAnimatingCards] = useState<AnimatingCards | null>(null);

    /**
     * Helper function to get card element position
     */
    const getCardPosition = (cardId: string): { x: number; y: number } | null => {
        const element = cardRefs.current?.get(cardId);
        if (!element) return null;

        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top
        };
    };

    /**
     * Helper to get the destination element position (uses current DOM state, not future state)
     * Accepts pre-computed cardHeight to avoid repeated getComputedStyle calls
     */
    const getDestinationPosition = (
        toPile: 'tableau' | 'freecell' | 'foundation',
        toIndex: number,
        cardHeight: number
    ): { x: number; y: number } | null => {
        if (toPile === 'foundation') {
            // Find the foundation cell using ref
            const targetCell = foundationRefs.current?.[toIndex];
            if (!targetCell) return null;

            const rect = targetCell.getBoundingClientRect();
            return { x: rect.left, y: rect.top };
        } else if (toPile === 'freecell') {
            // Find the free cell using ref
            const targetCell = freeCellRefs.current?.[toIndex];
            if (!targetCell) return null;

            const rect = targetCell.getBoundingClientRect();
            return { x: rect.left, y: rect.top };
        } else {
            // Tableau column - find the current last card in DOM
            const targetColumn = tableauColumnRefs.current?.[toIndex];
            if (!targetColumn) return null;

            // Look for cards in this column
            const cards = targetColumn.querySelectorAll('.card');
            if (cards.length > 0) {
                // Get the last card's position
                const lastCard = cards[cards.length - LAST_ITEM_INDEX_OFFSET] as HTMLElement;
                const rect = lastCard.getBoundingClientRect();

                // Calculate the position for the new card (below the last one)
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

        // Batch all DOM reads together to avoid layout thrashing
        const startPos = getCardPosition(cardId);
        const cardHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-height') || '140');
        const endPos = getDestinationPosition(toPile, toIndex, cardHeight);

        if (!startPos || !endPos) {
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
