import type { Card, Suit, Rank } from '../types/card';
import type { GameState } from '../types/gameState';
import { createCardId, getCardColor, getRankValue } from '../types/card';
import { shuffleFreeCellDeck } from '../utils/freecellRng';

/**
 * Create a standard 52-card deck
 * Microsoft FreeCell order: card_index = rank * 4 + suit
 * Where suit: 0=clubs, 1=diamonds, 2=hearts, 3=spades (CDHS order)
 * And rank: 0=ace, 1=2, ..., 12=king
 */
export function createDeck(): Card[] {
    const suits: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
    const ranks: Rank[] = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];

    const deck: Card[] = [];
    // Microsoft FreeCell order: ranks first, then suits (SHDC)
    for (const rank of ranks) {
        for (const suit of suits) {
            deck.push({
                suit,
                rank,
                id: createCardId(suit, rank),
            });
        }
    }

    return deck;
}

/**
 * Deal cards for a new FreeCell game
 * - First 4 columns get 7 cards each
 * - Last 4 columns get 6 cards each
 */
export function dealCards(gameNumber: number): GameState {
    // Create and shuffle deck
    const deck = createDeck();
    const shuffledDeck = shuffleFreeCellDeck(deck, gameNumber);

    // Initialize game state
    const tableau: Card[][] = [[], [], [], [], [], [], [], []];
    const freeCells: (Card | null)[] = [null, null, null, null];
    const foundations = {
        hearts: [],
        diamonds: [],
        clubs: [],
        spades: [],
    };

    // Deal cards to tableau in row-major order (across columns first, then down)
    // First 4 columns get 7 cards, last 4 get 6 cards
    let cardIndex = 0;
    for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 8; col++) {
            // Last 4 columns only get 6 cards (skip row 6)
            if (row === 6 && col >= 4) {
                continue;
            }
            tableau[col].push(shuffledDeck[cardIndex++]);
        }
    }

    return {
        tableau,
        freeCells,
        foundations,
        gameNumber,
        moveHistory: [],
        isWon: false,
    };
}

/**
 * Check if a card can be moved to a tableau column
 */
export function canMoveToTableau(card: Card, targetColumn: Card[]): boolean {
    // Can always move to empty column
    if (targetColumn.length === 0) {
        return true;
    }

    // Get the bottom card of target column
    const targetCard = targetColumn[targetColumn.length - 1];

    // Must be descending rank and alternating color
    const cardValue = getRankValue(card.rank);
    const targetValue = getRankValue(targetCard.rank);

    return (
        cardValue === targetValue - 1 &&
        getCardColor(card.suit) !== getCardColor(targetCard.suit)
    );
}

/**
 * Check if a card can be moved to a foundation
 */
export function canMoveToFoundation(card: Card, foundation: Card[]): boolean {
    // Ace goes on empty foundation
    if (foundation.length === 0) {
        return card.rank === 'ace';
    }

    // Must be same suit and next in sequence
    const topCard = foundation[foundation.length - 1];
    const cardValue = getRankValue(card.rank);
    const topValue = getRankValue(topCard.rank);

    return (
        card.suit === topCard.suit &&
        cardValue === topValue + 1
    );
}

/**
 * Calculate maximum number of cards that can be moved as a sequence
 * This depends on the number of empty free cells and empty tableau columns
 */
export function getMaxMovableCards(
    emptyFreeCells: number,
    emptyColumns: number,
    excludeTargetColumn: boolean = false
): number {
    // Formula: (1 + number of empty freecells) * 2^(number of empty columns)
    // If moving to an empty column, subtract 1 from empty columns count
    const effectiveEmptyColumns = excludeTargetColumn ? Math.max(0, emptyColumns - 1) : emptyColumns;
    return (1 + emptyFreeCells) * Math.pow(2, effectiveEmptyColumns);
}

/**
 * Check if a sequence of cards from a tableau column can be moved
 */
export function canMoveCardSequence(
    sourceColumn: Card[],
    startIndex: number,
    gameState: GameState
): boolean {
    // Get the cards to move
    const cardsToMove = sourceColumn.slice(startIndex);

    // Check if cards form a valid descending sequence with alternating colors
    for (let i = 0; i < cardsToMove.length - 1; i++) {
        const current = cardsToMove[i];
        const next = cardsToMove[i + 1];

        if (!canMoveToTableau(next, [current])) {
            return false;
        }
    }

    // Check if we have enough empty cells/columns to move this many cards
    const emptyFreeCells = gameState.freeCells.filter(cell => cell === null).length;
    const emptyColumns = gameState.tableau.filter(col => col.length === 0).length;
    const maxMovable = getMaxMovableCards(emptyFreeCells, emptyColumns, true);

    return cardsToMove.length <= maxMovable;
}

/**
 * Check if the game is won
 */
export function checkWin(gameState: GameState): boolean {
    // Game is won when all foundations have 13 cards
    return (
        gameState.foundations.hearts.length === 13 &&
        gameState.foundations.diamonds.length === 13 &&
        gameState.foundations.clubs.length === 13 &&
        gameState.foundations.spades.length === 13
    );
}

/**
 * Auto-move cards to foundations if safe
 * A card is safe to auto-move if both opposite-color suits are at least 2 ranks lower
 */
export function getAutoMovableCards(gameState: GameState): { card: Card; suit: Suit }[] {
    const autoMovable: { card: Card; suit: Suit }[] = [];

    // Check minimum rank in opposite color foundations
    const redMin = Math.min(
        gameState.foundations.hearts.length,
        gameState.foundations.diamonds.length
    );
    const blackMin = Math.min(
        gameState.foundations.clubs.length,
        gameState.foundations.spades.length
    );

    // Helper to check if card can be auto-moved
    const canAutoMove = (card: Card): boolean => {
        const cardValue = getRankValue(card.rank);
        const cardColor = getCardColor(card.suit);
        const oppositeMin = cardColor === 'red' ? blackMin : redMin;

        // Can auto-move if opposite colors are at most 2 behind
        return cardValue <= oppositeMin + 2;
    };

    // Check tableau columns
    for (const column of gameState.tableau) {
        if (column.length > 0) {
            const card = column[column.length - 1];
            if (canMoveToFoundation(card, gameState.foundations[card.suit]) && canAutoMove(card)) {
                autoMovable.push({ card, suit: card.suit });
            }
        }
    }

    // Check free cells
    for (const card of gameState.freeCells) {
        if (card && canMoveToFoundation(card, gameState.foundations[card.suit]) && canAutoMove(card)) {
            autoMovable.push({ card, suit: card.suit });
        }
    }

    return autoMovable;
}
