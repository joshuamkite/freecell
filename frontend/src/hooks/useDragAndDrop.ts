import { useState, useEffect, useRef, useCallback } from 'react';
import type { Card as CardType } from '../types/card';
import type { GameState } from '../types/gameState';
import { canMoveToTableau, canMoveToFoundation } from '../game/freecellLogic';
import {
    LAST_ITEM_INDEX_OFFSET,
    TRANSPARENT_PIXEL_DATA_URI,
    INVALID_DRAG_COORDINATE,
} from '../constants';

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
 * Drag overlay state for custom drag preview
 */
interface DragOverlayState {
    card: CardType;
    x: number;
    y: number;
}

/**
 * Custom hook for drag-and-drop card interactions
 *
 * Uses a custom drag overlay instead of the browser's native drag preview
 * for smoother, more reliable drag behavior on desktop.
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
    const [dragOverlay, setDragOverlay] = useState<DragOverlayState | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);

    // Track drag position globally and clear on end
    useEffect(() => {
        if (!dragOverlay) return;

        const handleGlobalDrag = (e: DragEvent) => {
            // Update overlay position directly via ref for smooth performance
            if (overlayRef.current && e.clientX !== INVALID_DRAG_COORDINATE && e.clientY !== INVALID_DRAG_COORDINATE) {
                overlayRef.current.style.left = `${e.clientX}px`;
                overlayRef.current.style.top = `${e.clientY}px`;
            }
        };

        const handleGlobalEnd = () => {
            setDragOverlay(null);
            setDraggedCard(null);
        };

        document.addEventListener('drag', handleGlobalDrag);
        document.addEventListener('dragend', handleGlobalEnd);
        document.addEventListener('mouseup', handleGlobalEnd);

        return () => {
            document.removeEventListener('drag', handleGlobalDrag);
            document.removeEventListener('dragend', handleGlobalEnd);
            document.removeEventListener('mouseup', handleGlobalEnd);
        };
    }, [dragOverlay]);

    /**
     * Handle drag start event
     */
    const handleDragStart = (e: React.DragEvent, card: CardType, location: CardLocation) => {
        setDraggedCard({ card, location });
        e.dataTransfer.effectAllowed = 'move';

        // Use custom drag overlay instead of browser's native preview
        const transparentImg = new Image();
        transparentImg.src = TRANSPARENT_PIXEL_DATA_URI;
        e.dataTransfer.setDragImage(transparentImg, 0, 0);

        setDragOverlay({
            card,
            x: e.clientX,
            y: e.clientY
        });
    };

    // handleDrag is now handled by the global drag listener in useEffect
    const handleDrag = useCallback(() => {
        // Position updates handled by document-level drag listener for better coverage
    }, []);

    /**
     * Handle drag end event
     */
    const handleDragEnd = () => {
        // Always clear both dragged card and overlay states
        setDraggedCard(null);
        setDragOverlay(null);
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
            setDragOverlay(null); // Ensure overlay is cleared on drop
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
        dragOverlay,
        overlayRef,
        handleDragStart,
        handleDrag,
        handleDragEnd,
        handleDragOver,
        handleDrop,
        isCardDragging,
        tryMove,
    };
}
