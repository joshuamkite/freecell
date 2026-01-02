import { useReducer, useRef, useEffect } from 'react';
import type { GameState } from '../types/gameState';
import { dealCards } from '../game/freecellLogic';
import { LAST_ITEM_INDEX_OFFSET } from '../constants';

/**
 * Action types for the game state reducer
 */
type GameAction =
    | { type: 'UPDATE_STATE'; newState: GameState }
    | { type: 'UNDO' }
    | { type: 'NEW_GAME'; initialState: GameState };

/**
 * Internal state structure combining current game state and history
 */
interface GameReducerState {
    current: GameState;
    history: GameState[];
}

/**
 * Reducer function for managing game state and history
 */
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
                current: state.history[state.history.length - LAST_ITEM_INDEX_OFFSET],
                history: state.history.slice(0, -LAST_ITEM_INDEX_OFFSET),
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

/**
 * Custom hook for managing game state with undo history
 * 
 * @param initialGameNumber - The initial game number to start with
 * @returns Object containing game state, history, and state management functions
 */
export function useGameState(initialGameNumber: number) {
    const [gameReducerState, dispatch] = useReducer(gameReducer, {
        current: dealCards(initialGameNumber),
        history: []
    });

    const gameState = gameReducerState.current;
    const history = gameReducerState.history;

    // Keep ref in sync with current state for immediate access
    const gameStateRef = useRef<GameState>(gameState);

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    /**
     * Update game state and add current state to history
     */
    const updateGameState = (newState: GameState) => {
        dispatch({ type: 'UPDATE_STATE', newState });
    };

    /**
     * Undo the last move by reverting to previous state
     */
    const undo = () => {
        dispatch({ type: 'UNDO' });
    };

    /**
     * Start a new game with the given deal number
     */
    const startNewGame = (gameNumber: number) => {
        dispatch({ type: 'NEW_GAME', initialState: dealCards(gameNumber) });
    };

    return {
        gameState,
        gameStateRef,
        history,
        dispatch,
        updateGameState,
        undo,
        startNewGame,
    };
}
