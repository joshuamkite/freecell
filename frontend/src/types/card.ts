export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'ace' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'jack' | 'queen' | 'king';

export interface Card {
    suit: Suit;
    rank: Rank;
    id: string; // Unique identifier for the card
}

export type CardColor = 'red' | 'black';

// Helper to get card color
export function getCardColor(suit: Suit): CardColor {
    return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

// Helper to get rank value (Ace=1, Jack=11, Queen=12, King=13)
export function getRankValue(rank: Rank): number {
    const rankValues: Record<Rank, number> = {
        'ace': 1,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 6,
        '7': 7,
        '8': 8,
        '9': 9,
        '10': 10,
        'jack': 11,
        'queen': 12,
        'king': 13,
    };
    return rankValues[rank];
}

// Helper to create card ID
export function createCardId(suit: Suit, rank: Rank): string {
    return `${rank}_of_${suit}`;
}

// Helper to get card image filename
export function getCardImagePath(card: Card): string {
    return `/cards/English_pattern_${card.rank}_of_${card.suit}.svg`;
}
