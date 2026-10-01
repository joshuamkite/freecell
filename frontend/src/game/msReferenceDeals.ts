/**
 * Reference deals from the classic Microsoft FreeCell.
 *
 * Rows are in dealing order (across the 8 columns, then down), T = 10.
 * Games 1 and 617 are from https://rosettacode.org/wiki/Deal_cards_for_FreeCell;
 * the rest are from freecellgamesolutions.com (see below).
 * Game #11982 is the only unsolvable deal in the original 32,000.
 */
export const msReferenceDeals: Record<number, string[]> = {
  1: [
    'JD 2D 9H JC 5D 7H 7C 5H',
    'KD KC 9S 5S AD QC KH 3H',
    '2S KS 9D QD JS AS AH 3C',
    '4C 5C TS QH 4H AC 4D 7S',
    '3S TD 4S TH 8H 2C JH 7D',
    '6D 8S 8D QS 6C 3D 8C TC',
    '6S 9C 2H 6H',
  ],
  617: [
    '7D AD 5C 3S 5S 8C 2D AH',
    'TD 7S QD AC 6D 8H AS KH',
    'TH QC 3H 9D 6S 8D 3D TC',
    'KD 5H 9S 3C 8S 7H 4D JS',
    '4C QS 9C 9H 7C 6H 2C 2S',
    '4S TS 2H 5D JC 6C JH QH',
    'JD KS KC 4H',
  ],
  // Games below are from https://freecellgamesolutions.com/fcs/?game=N, which
  // agrees with Rosetta Code on games 1 and 617. Game 11982 is the famous
  // unsolvable deal; 32000 is the last of the original Microsoft deals and
  // 1000000 the last of the extended range.
  164: [
    'AH 5D JH AC QD QS 3D 8D',
    'AS TD KC 4H TH 8S 2C 2D',
    '5S JS 7S 8H TS 4C 9D JC',
    'AD 2H KH KS 9S 9H QC JD',
    '5H TC 3C 9C 7C 4S 7H 4D',
    '2S 6C KD 8C 3H 3S 7D 5C',
    '6S 6H 6D QH',
  ],
  2: [
    'QD QC KC 3C 4C 2C KD 5C',
    '4D JD JS 6H QS 6D 2D 9C',
    'TD JC 8C 6C 8S 4S 5D QH',
    '7S 9D KS 7C 6S 4H AC 8H',
    'AH 9S TC 2S 3S TS 9H 2H',
    '3H AD 7H 3D 5H 8D KH 7D',
    'AS 5S TH JH',
  ],
  11982: [
    'AH AS 4H AC 2D 6S TS JS',
    '3D 3H QS QC 8S 7H AD KS',
    'KD 6H 5S 4D 9H JH 9S 3C',
    'JC 5D 5C 8C 9D TD KH 7C',
    '6C 2C TH QH 6D TC 4S 7S',
    'JD 7D 8H 9C 2H QD 4C 5H',
    'KC 8D 2S 3S',
  ],
  32000: [
    'QD 8D QS 4H 2C JC 2D TH',
    '3S JD 7C 9D KD 5C 5D 6D',
    '8C 9H 5S 4C 5H AC KS 7H',
    'JH 7D 6S 9C 3C 9S TD QH',
    '3D 7S 2H AD AS JS KH 8S',
    '6H 8H TS 6C 4D QC KC 4S',
    'TC 2S 3H AH',
  ],
  1000000: [
    '2D 6H 6S TH JC 3C 4D TD',
    '9C 3D 7D 7C QC AC 2S 4C',
    'KD 5H 5D QH JH 6C 9H KS',
    'JD 7S QD 8D 2H AD 5C 8C',
    '3H 4S 3S KC KH 9D 7H 8S',
    'TC AS 6D 8H 2C QS 5S JS',
    'TS AH 9S 4H',
  ],
}
