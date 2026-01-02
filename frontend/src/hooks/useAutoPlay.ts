import type { RefObject, Dispatch } from 'react';
import type { GameState } from '../types/gameState';
import type { Card as CardType } from '../types/card';
import { getRankValue } from '../types/card';
import { canMoveToFoundation, checkWin } from '../game/freecellLogic';
import {
    MIN_GAME_NUMBER,
    AUTO_MOVE_SAFE_RANK_OFFSET,
    AUTO_PLAY_DELAY_MS,
    LAST_ITEM_INDEX_OFFSET,
} from '../constants';

/**
 * Type for the game action dispatch function
 */
type GameAction =
    | { type: 'UPDATE_STATE'; newState: GameState }
    | { type: 'UNDO' }
    | { type: 'NEW_GAME'; initialState: GameState };

/**
 * Custom hook for auto-play functionality
 * 
 * Automatically moves safe cards to foundations after each manual move.
 * A card is considered "safe" if its rank is at most 2 higher than the minimum
 * rank of opposite color foundations, preventing situations where you might
 * need the card later.
 * 
 * @param gameStateRef - Ref to current game state for immediate access
 * @param animateMove - Function to animate a card movement
 * @param detectAutoPlayMove - Function to detect which card moved between states
 * @param dispatch - Dispatch function for game state updates
 * @returns Object containing the triggerAutoPlay function
 */
export function useAutoPlay(
    gameStateRef: RefObject<GameState>,
    animateMove: (
        fromPile: 'tableau' | 'freecell' | 'foundation',
        fromIndex: number,
        toPile: 'tableau' | 'freecell' | 'foundation',
        toIndex: number,
        onAnimationComplete?: () => void,
        sourceState?: GameState
    ) => void,
    detectAutoPlayMove: (oldState: GameState, newState: GameState) => {
        fromPile: 'tableau' | 'freecell';
        fromIndex: number;
        toPile: 'foundation';
        toIndex: number;
    } | null,
    dispatch: Dispatch<GameAction>
) {
    /**
     * Try to auto-play a single card (returns new state if moved, or same state if not)
     */
    const tryAutoPlaySingleCard = (state: GameState): GameState => {
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

        /**
         * Helper: Get the minimum rank in opposite color foundations
         */
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

        /**
         * A card is safe to auto-move if its rank is at most 2 higher than
         * the minimum rank of opposite color foundations
         */
        const isSafeToAutoMove = (card: CardType): boolean => {
            const cardRankValue = getRankValue(card.rank);
            const currentFoundationRank = newState.foundations[card.suit].length;
            const minOppositeRank = getMinOppositeColorRank(card.suit);
            return cardRankValue === currentFoundationRank + MIN_GAME_NUMBER &&
                cardRankValue <= minOppositeRank + AUTO_MOVE_SAFE_RANK_OFFSET;
        };

        // Try to move from free cells first
        for (let i = 0; i < newState.freeCells.length; i++) {
            const card = newState.freeCells[i];
            if (card && canMoveToFoundation(card, newState.foundations[card.suit]) && isSafeToAutoMove(card)) {
                newState.freeCells[i] = null;
                newState.foundations[card.suit] = [...newState.foundations[card.suit], card];
                return newState;
            }
        }

        // Try to move from tableau columns
        for (let i = 0; i < newState.tableau.length; i++) {
            const column = newState.tableau[i];
            if (column.length > 0) {
                const card = column[column.length - LAST_ITEM_INDEX_OFFSET];
                if (canMoveToFoundation(card, newState.foundations[card.suit]) && isSafeToAutoMove(card)) {
                    const newColumn = [...column];
                    newColumn.pop();
                    newState.tableau[i] = newColumn;
                    newState.foundations[card.suit] = [...newState.foundations[card.suit], card];
                    return newState;
                }
            }
        }

        return state; // No move made
    };

    /**
     * Trigger auto-play sequence after a manual move
     */
    const triggerAutoPlay = (newState: GameState) => {
        // Auto-play: automatically move safe cards to foundations one at a time
        if (!checkWin(newState)) {
            // Recursive function to move cards one at a time with delays
            const autoPlayRecursive = () => {
                setTimeout(() => {
                    // Get current state from the ref (always latest)
                    const currentState = gameStateRef.current;
                    const nextState = tryAutoPlaySingleCard(currentState);
                    if (nextState !== currentState) {
                        // A card was moved, detect which one
                        const move = detectAutoPlayMove(currentState, nextState);
                        if (move) {
                            // Animate from current DOM state to new state
                            animateMove(
                                move.fromPile,
                                move.fromIndex,
                                move.toPile,
                                move.toIndex,
                                () => {
                                    // Continue auto-play after animation
                                    autoPlayRecursive();
                                },
                                currentState  // Pass the current state so it knows which cards to look for
                            );
                        } else {
                            // Couldn't detect move, just update state
                            dispatch({ type: 'UPDATE_STATE', newState: nextState });
                            autoPlayRecursive();
                        }
                    }
                    // If no card was moved, stop recursing
                }, AUTO_PLAY_DELAY_MS);
            };

            autoPlayRecursive();
        }
    };

    return {
        triggerAutoPlay,
    };
}
