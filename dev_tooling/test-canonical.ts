// Test our implementation matches the canonical Rosetta Code algorithm
import { createDeck, dealCards } from './src/game/freecellLogic';
import type { Card } from './src/types/card';

function cardToString(card: Card): string {
    const suitSymbols = { clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠' };
    const rankSymbols: Record<string, string> = {
        'ace': 'A', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
        '8': '8', '9': '9', '10': '10', 'jack': 'J', 'queen': 'Q', 'king': 'K'
    };
    return rankSymbols[card.rank] + suitSymbols[card.suit];
}

console.log("=== Game #164 ===");
const gameState = dealCards(164);

for (let col = 0; col < 8; col++) {
    const cards = gameState.tableau[col].map(cardToString);
    console.log(`Column ${col + 1}: ${cards.join(' ')}`);
}

console.log("\n=== Expected from https://freecellgamesolutions.com/fcs/?game=164 ===");
console.log("Column 1: 4♦ 2♥ 9♠ 6♣ 10♠ 8♠ 3♥");
console.log("Column 2: 6♠ Q♣ 8♥ 8♣ 6♥ 7♥ J♦");
console.log("Column 3: 2♠ 8♦ 10♦ 4♣ 10♥ 3♣ 7♣");
console.log("Column 4: 4♥ A♠ 4♦ Q♦ 10♣ 5♠ 4♠");
console.log("Column 5: 3♠ A♦ A♣ J♣ Q♥ 9♥");
console.log("Column 6: K♣ 2♣ 3♦ K♦ Q♠ A♥");
console.log("Column 7: 5♣ 9♣ K♠ K♥ 5♦ 7♠");
console.log("Column 8: 7♦ 5♥ J♠ 9♦ 2♦ J♥");
