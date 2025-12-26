/**
 * Microsoft FreeCell RNG Implementation
 * 
 * This implements the Linear Congruential Generator (LCG) used in 
 * Microsoft's original FreeCell game, which allows for reproducible
 * deals numbered 1 through 1,000,000.
 * 
 * Algorithm: seed = (seed * 214013 + 2531011) & 0x7FFFFFFF
 */

export class FreeCellRNG {
    private seed: number;

    constructor(gameNumber: number) {
        // Initialize with game number
        this.seed = gameNumber;
    }

    /**
     * Generate next random number
     * Uses Microsoft's LCG algorithm
     */
    next(): number {
        this.seed = ((this.seed * 214013 + 2531011) & 0x7FFFFFFF) >>> 0;
        return this.seed;
    }

    /**
     * Generate random number in range [0, max)
     */
    nextInRange(max: number): number {
        return this.next() % max;
    }

    /**
     * Reset RNG with new game number
     */
    reset(gameNumber: number): void {
        this.seed = gameNumber;
    }

    /**
     * Get current seed value
     */
    getSeed(): number {
        return this.seed;
    }
}

/**
 * Shuffle array using Microsoft FreeCell algorithm
 * Note: The original Microsoft FreeCell shuffles from end to beginning
 */
export function shuffleFreeCellDeck<T>(array: T[], gameNumber: number): T[] {
    const result = [...array];
    const rng = new FreeCellRNG(gameNumber);

    // Shuffle from end to beginning (Microsoft FreeCell style)
    for (let i = result.length - 1; i > 0; i--) {
        const j = rng.nextInRange(i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}
