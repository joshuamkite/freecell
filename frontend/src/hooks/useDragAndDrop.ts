import { useState } from 'react';
import type { Card as CardType } from '../types/card';
import type { GameState } from '../types/gameState';
import { canMoveToTableau, canMoveToFoundation } from '../game/freecellLogic';
import { LAST_ITEM_INDEX_OFFSET } from '../constants';

/**
 * Location information for a card
 */
interface CardLocation {
    type: string;
    index: number;
}

/**
 * Dragged card state
 */
interface DraggedCardState {
    card: CardType;
    location: CardLocation;
}

/**
 * Custom hook for drag-and-drop card interactions
 * 
 * Manages the drag-and-drop state and provides handlers for all drag events.
 * Also provides a function to check if a specific card is being dragged.
 * 
 * @param gameState - Current game state
 * @param updateGameState - Function to update game state after a successful move
 * @returns Object containing drag state and event handlers
 */
export function useDragAndDrop(
    gameState: GameState,
    updateGameState: (newState: GameState) => void
) {
    const [draggedCard, setDraggedCard] = useState<DraggedCardState | null>(null);

    /**
     * Handle drag start event
     */
    const handleDragStart = (e: React.DragEvent, card: CardType, location: CardLocation) => {
        setDraggedCard({ card, location });
        e.dataTransfer.effectAllowed = 'move';
        // Add a slight delay to prevent drag image from showing
        setTimeout(() => {
            const target = e.target as HTMLElement;
            target.style.opacity = '0.5';
        }, 0);
    };

    /**
     * Handle drag end event
     */
    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.target as HTMLElement;
        target.style.opacity = '1';
        setDraggedCard(null);
    };

    /**
     * Handle drag over event (required to allow drop)
     */
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    /**
     * Handle drop event
     */
    const handleDrop = (e: React.DragEvent, location: CardLocation) => {
        e.preventDefault();
        if (draggedCard) {
            tryMove(draggedCard, location);
            setDraggedCard(null);
        }
    };

    /**
     * Attempt to move a card from one location to another
     */
    const tryMove = (
        from: { card: CardType; location: CardLocation },
        to: CardLocation
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
                    if (sourceColumn[sourceColumn.length - LAST_ITEM_INDEX_OFFSET]?.id === from.card.id) {
                        sourceColumn.pop();
                        newState.tableau[from.location.index] = sourceColumn;
                        moved = true;
                    }
                } else if (from.location.type === 'freecell') {
                    if (newState.freeCells[from.location.index]?.id === from.card.id) {
                        newState.freeCells[from.location.index] = null;
                        moved = true;
                    }
                } else if (from.location.type === 'foundation') {
                    const suit = ['hearts', 'diamonds', 'clubs', 'spades'][from.location.index] as keyof typeof newState.foundations;
                    const foundation = newState.foundations[suit];
                    if (foundation[foundation.length - LAST_ITEM_INDEX_OFFSET]?.id === from.card.id) {
                        const newFoundation = [...foundation];
                        newFoundation.pop();
                        newState.foundations[suit] = newFoundation;
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
                    if (sourceColumn[sourceColumn.length - LAST_ITEM_INDEX_OFFSET]?.id === from.card.id) {
                        sourceColumn.pop();
                        newState.tableau[from.location.index] = sourceColumn;
                        newState.freeCells[to.index] = from.card;
                        moved = true;
                    }
                } else if (from.location.type === 'foundation') {
                    const suit = ['hearts', 'diamonds', 'clubs', 'spades'][from.location.index] as keyof typeof newState.foundations;
                    const foundation = newState.foundations[suit];
                    if (foundation[foundation.length - LAST_ITEM_INDEX_OFFSET]?.id === from.card.id) {
                        const newFoundation = [...foundation];
                        newFoundation.pop();
                        newState.foundations[suit] = newFoundation;
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
                    if (sourceColumn[sourceColumn.length - LAST_ITEM_INDEX_OFFSET]?.id === from.card.id) {
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

    /**
     * Check if a specific card is currently being dragged
     */
    const isCardDragging = (card: CardType): boolean => {
        if (!draggedCard) return false;
        return draggedCard.card.id === card.id;
    };

    return {
        draggedCard,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDrop,
        isCardDragging,
        tryMove,
    };
}
