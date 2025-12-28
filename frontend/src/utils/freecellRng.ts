/**
 * Microsoft FreeCell RNG Implementation
 *
 * Based on https://github.com/macroxue/freecell
 * Matches the exact algorithm used by freecellgamesolutions.com
 */

/**
 * Shuffle deck using Microsoft FreeCell algorithm
 * Uses forward iteration with reverse at the end
 */
export function shuffleFreeCellDeck<T>(array: T[], dealNum: number): T[] {
    const deck = [...array];
    let seed = dealNum;

    // Shuffle forward from i=0 to i=51
    for (let i = 0; i < deck.length; i++) {
        const cardsLeft = deck.length - i;

        // Update seed using Microsoft's LCG
        seed = ((seed * 214013 + 2531011) & 0xffffffff) >>> 0;

        // Extract random value from high-order bits
        const rand = (seed >> 16) & 0x7fff;

        // Calculate position - special handling for large deal numbers
        const rect = dealNum < 0x80000000
            ? rand % cardsLeft
            : (rand | 0x8000) % cardsLeft;

        // Swap deck[rect] with deck[cardsLeft - 1]
        [deck[rect], deck[cardsLeft - 1]] = [deck[cardsLeft - 1], deck[rect]];
    }

    // Reverse the deck to get final order
    return deck.reverse();
}
