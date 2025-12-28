// Exact copy of macroxue shuffle algorithm
function shuffle_deck(deal_num) {
    var deck = [...Array(52).keys()];
    var seed = deal_num;
    for (var i = 0; i < deck.length; ++i) {
        var cards_left = deck.length - i;
        seed = (seed * 214013 + 2531011) & 0xffffffff;
        var rand = (seed >> 16) & 0x7fff;
        var rect = deal_num < 0x80000000 ? rand % cards_left : (rand | 0x8000) % cards_left;
        [deck[rect], deck[cards_left - 1]] = [deck[cards_left - 1], deck[rect]];
    }
    return deck.reverse();
}

function cardToString(card) {
    // card encoding: suit = card & 3, rank = card >> 2
    // suits: 0=spades, 1=hearts, 2=diamonds, 3=clubs
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suit = card & 3;
    const rank = card >> 2;
    return ranks[rank] + suits[suit];
}

console.log("=== Game #164 (macroxue exact algorithm) ===");
const deck = shuffle_deck(164);

let cardIndex = 0;
for (let col = 0; col < 8; col++) {
    const cardsInCol = col < 4 ? 7 : 6;
    const cards = [];
    for (let row = 0; row < cardsInCol; row++) {
        cards.push(cardToString(deck[cardIndex++]));
    }
    console.log(`Column ${col + 1}: ${cards.join(' ')}`);
}
