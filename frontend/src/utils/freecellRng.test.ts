import { describe, expect, it } from 'vitest'
import { shuffleFreeCellDeck } from './freecellRng'

const deck = Array.from({ length: 52 }, (_, i) => i)

describe('shuffleFreeCellDeck', () => {
  it('is deterministic for a given deal number', () => {
    expect(shuffleFreeCellDeck(deck, 164)).toEqual(
      shuffleFreeCellDeck(deck, 164),
    )
  })

  it('returns a permutation of the input without mutating it', () => {
    const input = [...deck]
    const result = shuffleFreeCellDeck(input, 1)
    expect(input).toEqual(deck)
    expect([...result].sort((a, b) => a - b)).toEqual(deck)
  })

  it('produces different orders for different deals', () => {
    expect(shuffleFreeCellDeck(deck, 1)).not.toEqual(
      shuffleFreeCellDeck(deck, 2),
    )
  })

  it('handles deal numbers at or above 2^31', () => {
    const result = shuffleFreeCellDeck(deck, 0x80000001)
    expect([...result].sort((a, b) => a - b)).toEqual(deck)
  })
})
