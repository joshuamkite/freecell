import { useEffect } from 'react';
import type { RefObject } from 'react';
import {
    BOARD_PADDING_DESKTOP_PX,
    BOARD_PADDING_TABLET_PX,
    BOARD_PADDING_MOBILE_PX,
    CARD_GAP_DESKTOP_PX,
    CARD_GAP_TABLET_PX,
    CARD_GAP_MOBILE_PX,
    GAME_WIDTH_PERCENT,
    CARD_MIN_WIDTH_PX,
    CARD_ASPECT_RATIO,
    MOBILE_BREAKPOINT_PX,
    TABLET_BREAKPOINT_PX,
    TABLEAU_COLUMN_COUNT,
    TABLEAU_GAPS,
} from '../constants';

/**
 * Custom hook for calculating and setting responsive card dimensions
 * 
 * Calculates card width and height based on viewport size, then sets
 * CSS custom properties on the game board element. Also handles window
 * resize events to recalculate dimensions.
 * 
 * @param gameBoardRef - Reference to the game board container element
 * @param gameAreaRef - Reference to the game area element
 */
export function useCardDimensions(
    gameBoardRef: RefObject<HTMLDivElement | null>,
    gameAreaRef: RefObject<HTMLDivElement | null>
) {
    useEffect(() => {
        const calculateCardDimensions = () => {
            if (!gameBoardRef.current || !gameAreaRef.current) return;

            // Determine board padding based on screen size (matches CSS media queries)
            let boardPadding = BOARD_PADDING_DESKTOP_PX; // Desktop default
            if (window.innerWidth <= MOBILE_BREAKPOINT_PX) {
                boardPadding = BOARD_PADDING_MOBILE_PX;
            } else if (window.innerWidth <= TABLET_BREAKPOINT_PX) {
                boardPadding = BOARD_PADDING_TABLET_PX;
            }

            // Desktop game width: This value controls how wide the game appears (0.6 = 60%, 0.7 = 70%, etc.)
            const gameWidthPercent = GAME_WIDTH_PERCENT;

            const viewportWidth = window.innerWidth - (boardPadding * 2);
            const availableWidth = viewportWidth * gameWidthPercent;

            // Determine gap based on screen size (matches CSS media queries)
            let cardGap = CARD_GAP_DESKTOP_PX; // Desktop default
            if (window.innerWidth <= MOBILE_BREAKPOINT_PX) {
                cardGap = CARD_GAP_MOBILE_PX;
            } else if (window.innerWidth <= TABLET_BREAKPOINT_PX) {
                cardGap = CARD_GAP_TABLET_PX;
            }

            // FreeCell: 8 columns in tableau
            const tableauItems = TABLEAU_COLUMN_COUNT;
            const tableauGaps = TABLEAU_GAPS;

            // Calculate card width to fill available space
            let cardWidth = (availableWidth - (tableauGaps * cardGap)) / tableauItems;

            // Set reasonable bounds (minimum 60px)
            const minWidth = CARD_MIN_WIDTH_PX;
            cardWidth = Math.max(minWidth, cardWidth);

            // Maintain 5:7 aspect ratio (width:height)
            const cardHeight = cardWidth * CARD_ASPECT_RATIO;

            // Set CSS custom properties
            gameBoardRef.current.style.setProperty('--card-width', `${cardWidth}px`);
            gameBoardRef.current.style.setProperty('--card-height', `${cardHeight}px`);
            gameBoardRef.current.style.setProperty('--card-gap', `${cardGap}px`);
            gameBoardRef.current.style.setProperty('--board-padding', `${boardPadding}px`);
            gameBoardRef.current.style.setProperty('--max-game-width', `${gameWidthPercent * 100}%`);
        };

        calculateCardDimensions();

        // Recalculate on window resize
        const handleResize = () => {
            calculateCardDimensions();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [gameBoardRef, gameAreaRef]);
}
