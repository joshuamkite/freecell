// Test our deal for game #164
// Reference solution shows first column should start with: 4♦

function shuffleFreeCellDeck(gameNumber) {
    // Create deck: 0-51 where card = (rank << 2) + suit
    // suits: 0=spades, 1=hearts, 2=diamonds, 3=clubs  
    // ranks: 0=A, 1=2, ..., 12=K
    const deck = Array.from({ length: 52 }, (_, i) => i);

    let seed = gameNumber;

    // Try shuffling BACKWARD (from 51 down to 1)
    for (let i = 51; i > 0; i--) {
        // Update seed
        seed = ((seed * 214013 + 2531011) & 0xFFFFFFFF) >>> 0;

        // Extract random value
        const rand = (seed >> 16) & 0x7FFF;

        // Calculate position
        const j = rand % (i + 1);

        // Swap
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // No reverse
    return deck;
}

function cardToString(card) {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suit = card & 3;
    const rank = card >> 2;
    return ranks[rank] + suits[suit];
}

// Test game #1 - well-known Microsoft FreeCell game
console.log("=== Game #1 (Microsoft FreeCell) ===");
let deck = shuffleFreeCellDeck(1);
let cardIndex = 0;
for (let col = 0; col < 8; col++) {
    const cardsInCol = col < 4 ? 7 : 6;
    const cards = [];
    for (let row = 0; row < cardsInCol; row++) {
        cards.push(cardToString(deck[cardIndex++]));
    }
    console.log(`Column ${col + 1}: ${cards.join(' ')}`);
}

console.log("\n=== Game #617 ===");
deck = shuffleFreeCellDeck(617);
cardIndex = 0;
for (let col = 0; col < 8; col++) {
    const cardsInCol = col < 4 ? 7 : 6;
    const cards = [];
    for (let row = 0; row < cardsInCol; row++) {
        cards.push(cardToString(deck[cardIndex++]));
    }
    console.log(`Column ${col + 1}: ${cards.join(' ')}`);
}

console.log("\n=== Game #164 ===");
deck = shuffleFreeCellDeck(164);
cardIndex = 0;
for (let col = 0; col < 8; col++) {
    const cardsInCol = col < 4 ? 7 : 6;
    const cards = [];
    for (let row = 0; row < cardsInCol; row++) {
        cards.push(cardToString(deck[cardIndex++]));
    }
    console.log(`Column ${col + 1}: ${cards.join(' ')}`);
}
