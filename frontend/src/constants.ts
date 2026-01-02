/**
 * Constants for FreeCell Solitaire Game
 * 
 * This file contains all magic numbers and configuration values extracted from the codebase.
 * Centralizing these values makes the code more maintainable and easier to adjust.
 */

// ============================================================================
// GAME CONFIGURATION
// ============================================================================

/**
 * Maximum valid game number for FreeCell (matches Microsoft FreeCell RNG range)
 */
export const MAX_GAME_NUMBER = 1_000_000;

/**
 * Minimum valid game number for FreeCell
 */
export const MIN_GAME_NUMBER = 1;

/**
 * Time in milliseconds before reverting game number input to current game
 * User has 20 seconds to apply a new game number before it auto-reverts
 */
export const GAME_NUMBER_REVERT_TIMER_MS = 20_000;

/**
 * Number of tableau columns in FreeCell
 */
export const TABLEAU_COLUMN_COUNT = 8;

/**
 * Number of free cells available for temporary card storage
 */
export const FREE_CELL_COUNT = 4;

/**
 * Number of foundation piles (one per suit)
 */
export const FOUNDATION_COUNT = 4;

// ============================================================================
// LAYOUT & DIMENSIONS
// ============================================================================

/**
 * Board padding in pixels for desktop screens (> 768px)
 */
export const BOARD_PADDING_DESKTOP_PX = 20;

/**
 * Board padding in pixels for tablet screens (481-768px)
 */
export const BOARD_PADDING_TABLET_PX = 8;

/**
 * Board padding in pixels for mobile screens (≤ 480px)
 */
export const BOARD_PADDING_MOBILE_PX = 5;

/**
 * Gap between cards in pixels for desktop screens
 */
export const CARD_GAP_DESKTOP_PX = 10;

/**
 * Gap between cards in pixels for tablet screens
 */
export const CARD_GAP_TABLET_PX = 5;

/**
 * Gap between cards in pixels for mobile screens
 */
export const CARD_GAP_MOBILE_PX = 3;

/**
 * Game area width as percentage of viewport (0.65 = 65%)
 * Adjust this to make the game wider or narrower on desktop
 */
export const GAME_WIDTH_PERCENT = 0.65;

/**
 * Minimum card width in pixels to ensure readability on small screens
 */
export const CARD_MIN_WIDTH_PX = 60;

/**
 * Card aspect ratio multiplier (width * 1.4 = height)
 * Represents standard playing card proportions (5:7 ratio)
 */
export const CARD_ASPECT_RATIO = 1.4;

/**
 * Overlap percentage for tableau cards (0.75 = 75% overlap, 25% visible)
 * Lower values show more of each card, higher values save vertical space
 */
export const TABLEAU_CARD_OVERLAP = 0.75;

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

/**
 * Screen width in pixels below which mobile layout is used
 */
export const MOBILE_BREAKPOINT_PX = 480;

/**
 * Screen width in pixels below which tablet layout is used
 */
export const TABLET_BREAKPOINT_PX = 768;

// ============================================================================
// ANIMATION & TIMING
// ============================================================================

/**
 * Delay in milliseconds between auto-play card animations
 * Allows users to see each card move to foundations
 */
export const AUTO_PLAY_DELAY_MS = 700;

/**
 * Delay in milliseconds before showing victory animation after win
 * Gives the final animation time to complete
 */
export const VICTORY_ANIMATION_DELAY_MS = 500;

// ============================================================================
// AUTO-PLAY LOGIC
// ============================================================================

/**
 * Safe rank offset for auto-move to foundations
 * A card is safe to auto-move if its rank is at most 2 higher than
 * the minimum rank of opposite color foundations
 * 
 * Example: If black foundations are at 3, red cards up to 5 are safe to auto-move
 */
export const AUTO_MOVE_SAFE_RANK_OFFSET = 2;

// ============================================================================
// ARRAY & INDEX OPERATIONS
// ============================================================================

/**
 * Offset to get the last item in an array (array.length - 1)
 * Used frequently when accessing the top card of a pile
 */
export const LAST_ITEM_INDEX_OFFSET = 1;

/**
 * Number of gaps between tableau columns (columns - 1)
 * Used in card dimension calculations
 */
export const TABLEAU_GAPS = TABLEAU_COLUMN_COUNT - 1;
