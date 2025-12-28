// Test the TypeScript implementation
import { createDeck } from './src/game/freecellLogic';
import { shuffleFreeCellDeck } from './src/utils/freecellRng';

const deck = createDeck();
console.log("Initial deck (first 8 cards):");
for (let i = 0; i < 8; i++) {
    const card = deck[i];
    console.log(`  ${i}: ${card.rank} of ${card.suit}`);
}

const shuffled = shuffleFreeCellDeck(deck, 164);

console.log("\n=== Game #164 (TypeScript implementation) ===");
let cardIndex = 0;
for (let col = 0; col < 8; col++) {
    const cardsInCol = col < 4 ? 7 : 6;
    const cards = [];
    for (let row = 0; row < cardsInCol; row++) {
        const card = shuffled[cardIndex++];
        const suitSymbols = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
        const rankSymbols = {
            ace: 'A', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6',
            '7': '7', '8': '8', '9': '9', '10': '10', jack: 'J', queen: 'Q', king: 'K'
        };
        cards.push(rankSymbols[card.rank] + suitSymbols[card.suit]);
    }
    console.log(`Column ${col + 1}: ${cards.join(' ')}`);
}
