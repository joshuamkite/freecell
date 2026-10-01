import { describe, expect, it } from 'vitest'
import type { Card, Rank, Suit } from '../types/card'
import { createCardId } from '../types/card'
import type { GameState } from '../types/gameState'
import {
  canMoveCardSequence,
  canMoveToFoundation,
  canMoveToTableau,
  checkWin,
  createDeck,
  dealCards,
  getAutoMovableCards,
  getMaxMovableCards,
} from './freecellLogic'
import { msReferenceDeals } from './msReferenceDeals'

const c = (rank: Rank, suit: Suit): Card => ({
  rank,
  suit,
  id: createCardId(suit, rank),
})

const ranks: Rank[] = [
  'ace',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'jack',
  'queen',
  'king',
]

const emptyState = (): GameState => ({
  tableau: [[], [], [], [], [], [], [], []],
  freeCells: [null, null, null, null],
  foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
  gameNumber: 1,
  moveHistory: [],
  isWon: false,
})

const fullSuit = (suit: Suit) => ranks.map((r) => c(r, suit))

const rankShort = (r: Rank) =>
  ({ ace: 'A', '10': 'T', jack: 'J', queen: 'Q', king: 'K' })[r as string] ?? r
const short = (card: Card) => rankShort(card.rank) + card.suit[0].toUpperCase()

describe('createDeck', () => {
  it('has 52 unique cards', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(52)
    expect(new Set(deck.map((d) => d.id)).size).toBe(52)
  })
})

describe('dealCards', () => {
  it('deals 7,7,7,7,6,6,6,6 cards with empty cells and foundations', () => {
    const state = dealCards(1)
    expect(state.tableau.map((col) => col.length)).toEqual([
      7, 7, 7, 7, 6, 6, 6, 6,
    ])
    expect(state.freeCells).toEqual([null, null, null, null])
    expect(Object.values(state.foundations).flat()).toHaveLength(0)
    expect(state.gameNumber).toBe(1)
    expect(state.isWon).toBe(false)
  })

  it('uses every card exactly once', () => {
    const ids = dealCards(12345)
      .tableau.flat()
      .map((d) => d.id)
    expect(new Set(ids).size).toBe(52)
  })

  it.each(Object.entries(msReferenceDeals))(
    'matches the Microsoft FreeCell layout for game %s',
    (game, rows) => {
      const { tableau } = dealCards(Number(game))
      const actual = rows.map((_, row) =>
        tableau
          .filter((col) => col.length > row)
          .map((col) => short(col[row]))
          .join(' '),
      )
      expect(actual).toEqual(rows)
    },
  )
})

describe('canMoveToTableau', () => {
  it('allows any card on an empty column', () => {
    expect(canMoveToTableau(c('king', 'hearts'), [])).toBe(true)
  })

  it('requires descending rank and alternating colour', () => {
    const target = [c('8', 'spades')]
    expect(canMoveToTableau(c('7', 'hearts'), target)).toBe(true)
    expect(canMoveToTableau(c('7', 'clubs'), target)).toBe(false)
    expect(canMoveToTableau(c('6', 'hearts'), target)).toBe(false)
    expect(canMoveToTableau(c('9', 'hearts'), target)).toBe(false)
  })
})

describe('canMoveToFoundation', () => {
  it('only accepts an ace on an empty foundation', () => {
    expect(canMoveToFoundation(c('ace', 'hearts'), [])).toBe(true)
    expect(canMoveToFoundation(c('2', 'hearts'), [])).toBe(false)
  })

  it('requires same suit and next rank', () => {
    const f = [c('ace', 'hearts')]
    expect(canMoveToFoundation(c('2', 'hearts'), f)).toBe(true)
    expect(canMoveToFoundation(c('2', 'spades'), f)).toBe(false)
    expect(canMoveToFoundation(c('3', 'hearts'), f)).toBe(false)
  })
})

describe('getMaxMovableCards', () => {
  it('follows (1 + freecells) * 2^columns', () => {
    expect(getMaxMovableCards(4, 0)).toBe(5)
    expect(getMaxMovableCards(0, 0)).toBe(1)
    expect(getMaxMovableCards(2, 1)).toBe(6)
    expect(getMaxMovableCards(4, 2)).toBe(20)
  })

  it('excludes the target column when it is empty', () => {
    expect(getMaxMovableCards(2, 1, true)).toBe(3)
    expect(getMaxMovableCards(2, 0, true)).toBe(3)
  })
})

describe('canMoveCardSequence', () => {
  const sequence = [c('9', 'spades'), c('8', 'hearts'), c('7', 'clubs')]

  it('accepts a valid sequence within capacity', () => {
    const state = emptyState()
    state.tableau[0] = sequence
    expect(canMoveCardSequence(sequence, 0, state)).toBe(true)
  })

  it('rejects a sequence that is not alternating/descending', () => {
    const bad = [c('9', 'spades'), c('8', 'clubs')]
    const state = emptyState()
    state.tableau[0] = bad
    expect(canMoveCardSequence(bad, 0, state)).toBe(false)
  })

  it('rejects a sequence larger than free cells allow', () => {
    const state = emptyState()
    state.tableau[0] = sequence
    state.freeCells = [c('2', 'clubs'), c('3', 'clubs'), c('4', 'clubs'), null]
    state.tableau[1] = [c('king', 'hearts')]
    for (let i = 2; i < 8; i++) state.tableau[i] = [c('king', 'spades')]
    // 1 empty cell, no empty columns -> max 2 cards
    expect(canMoveCardSequence(sequence, 0, state)).toBe(false)
    expect(canMoveCardSequence(sequence, 1, state)).toBe(true)
  })
})

describe('checkWin', () => {
  it('is false for a fresh deal', () => {
    expect(checkWin(dealCards(1))).toBe(false)
  })

  it('is true when all foundations are complete', () => {
    const state = emptyState()
    state.foundations = {
      hearts: fullSuit('hearts'),
      diamonds: fullSuit('diamonds'),
      clubs: fullSuit('clubs'),
      spades: fullSuit('spades'),
    }
    expect(checkWin(state)).toBe(true)
    state.foundations.spades.pop()
    expect(checkWin(state)).toBe(false)
  })
})

describe('getAutoMovableCards', () => {
  it('auto-moves aces and 2s from tableau and free cells', () => {
    const state = emptyState()
    state.tableau[0] = [c('5', 'clubs'), c('ace', 'hearts')]
    state.freeCells[0] = c('ace', 'spades')
    const moved = getAutoMovableCards(state).map((m) => m.card.id)
    expect(moved).toEqual(['ace_of_hearts', 'ace_of_spades'])
  })

  it('does not auto-move a card that may still be needed in the tableau', () => {
    const state = emptyState()
    state.foundations.hearts = [c('ace', 'hearts'), c('2', 'hearts')]
    // 3♥ is playable but black foundations are empty (min 0 -> max rank 2)
    state.tableau[0] = [c('3', 'hearts')]
    expect(getAutoMovableCards(state)).toEqual([])
  })

  it('auto-moves once opposite colours are close enough behind', () => {
    const state = emptyState()
    state.foundations.hearts = [c('ace', 'hearts'), c('2', 'hearts')]
    state.foundations.clubs = [c('ace', 'clubs')]
    state.foundations.spades = [c('ace', 'spades')]
    state.tableau[0] = [c('3', 'hearts')]
    expect(getAutoMovableCards(state).map((m) => m.card.id)).toEqual([
      '3_of_hearts',
    ])
  })
})
