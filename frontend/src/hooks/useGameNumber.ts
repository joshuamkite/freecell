import { useState, useRef, useEffect } from 'react';
import type { GameState } from '../types/gameState';
import { checkWin } from '../game/freecellLogic';
import {
    MIN_GAME_NUMBER,
    MAX_GAME_NUMBER,
    GAME_NUMBER_REVERT_TIMER_MS,
} from '../constants';

/**
 * Custom hook for managing game number input with auto-revert timer
 * 
 * Provides smart game number input with visual feedback:
 * - Green background when number matches current game
 * - Black background when typing different number
 * - Auto-reverts to current game number after 20 seconds if not applied
 * - Dynamic button: "New Game" vs "Set Deal"
 * 
 * @param currentGameNumber - The currently active game number
 * @param gameState - Current game state (for checking win condition)
 * @param history - Move history (for checking if game is in progress)
 * @param startNewGame - Function to start a new game with given number
 * @returns Object containing input value, handlers, and button logic
 */
export function useGameNumber(
    currentGameNumber: number,
    gameState: GameState,
    history: GameState[],
    startNewGame: (num: number, skipWarning?: boolean) => void
) {
    // Input value (what the user has typed)
    const [inputValue, setInputValue] = useState(() => currentGameNumber.toString());
    const revertTimerRef = useRef<number | null>(null);

    // Update input value when current game number changes
    useEffect(() => {
        setInputValue(currentGameNumber.toString());
    }, [currentGameNumber]);

    /**
     * Handle changes to the game number input field
     */
    const handleGameNumberChange = (value: string) => {
        setInputValue(value);

        // Clear existing revert timer
        if (revertTimerRef.current) {
            clearTimeout(revertTimerRef.current);
            revertTimerRef.current = null;
        }

        const num = parseInt(value) || MIN_GAME_NUMBER;
        const clampedNum = Math.max(MIN_GAME_NUMBER, Math.min(MAX_GAME_NUMBER, num));

        // Only start timer if the input differs from current game
        if (clampedNum !== currentGameNumber) {
            // Start 20-second timer to revert
            revertTimerRef.current = window.setTimeout(() => {
                setInputValue(currentGameNumber.toString());
                revertTimerRef.current = null;
            }, GAME_NUMBER_REVERT_TIMER_MS);
        }
    };

    /**
     * Apply the game number from the input field
     */
    const applyGameNumber = () => {
        // Warn if game is in progress (has history and not won)
        if (history.length > 0 && !checkWin(gameState)) {
            const confirmed = window.confirm(
                'Changing to a different game will lose your current progress. Are you sure?'
            );
            if (!confirmed) return;
        }

        const num = parseInt(inputValue) || MIN_GAME_NUMBER;
        const clampedNum = Math.max(MIN_GAME_NUMBER, Math.min(MAX_GAME_NUMBER, num));
        startNewGame(clampedNum, true); // skipWarning = true since we already confirmed
    };

    /**
     * Get the button label based on whether input matches current game
     */
    const getButtonLabel = (): string => {
        return parseInt(inputValue) === currentGameNumber ? 'New Game' : 'Set Deal';
    };

    /**
     * Handle button click - either new random game or apply selected game
     */
    const handleButtonClick = () => {
        const num = parseInt(inputValue) || MIN_GAME_NUMBER;
        const clampedNum = Math.max(MIN_GAME_NUMBER, Math.min(MAX_GAME_NUMBER, num));

        if (clampedNum === currentGameNumber) {
            // If already on current game, generate random new game
            const randomNum = Math.floor(Math.random() * MAX_GAME_NUMBER) + MIN_GAME_NUMBER;
            startNewGame(randomNum, false);
        } else {
            // Apply the selected game number
            applyGameNumber();
        }
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (revertTimerRef.current) {
                clearTimeout(revertTimerRef.current);
            }
        };
    }, []);

    return {
        inputValue,
        handleGameNumberChange,
        applyGameNumber,
        getButtonLabel,
        handleButtonClick,
    };
}
