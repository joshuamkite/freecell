import type { Card } from './card';

export interface GameState {
    // 8 tableau columns
    tableau: Card[][];

    // 4 free cells
    freeCells: (Card | null)[];

    // 4 foundations (one per suit)
    foundations: {
        hearts: Card[];
        diamonds: Card[];
        clubs: Card[];
        spades: Card[];
    };

    // Game number (for reproducible deals)
    gameNumber: number;

    // Move history for undo functionality
    moveHistory: Move[];

    // Game status
    isWon: boolean;
}

export type MoveType = 'tableau-to-tableau' | 'tableau-to-foundation' | 'tableau-to-freecell' |
    'freecell-to-tableau' | 'freecell-to-foundation' | 'foundation-to-tableau';

export interface Move {
    type: MoveType;
    card: Card;
    from: Location;
    to: Location;
}

export interface Location {
    type: 'tableau' | 'freecell' | 'foundation';
    index: number; // For tableau and freecells, suit index for foundations
}

export interface DragState {
    isDragging: boolean;
    card: Card | null;
    sourceLocation: Location | null;
    cards: Card[]; // Multiple cards if moving a sequence
}
