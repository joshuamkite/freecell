// Check our deals against the classic Microsoft FreeCell reference layouts
// (see frontend/src/game/msReferenceDeals.ts for the data and its source).
//
// Game numbers map to the same layouts as the original Windows game, so a
// game number is portable between this app and Microsoft FreeCell.
//
// Run from the frontend directory: bun ../dev_tooling/test-canonical.ts
// (The same references are enforced by `bun run test`.)
import { dealCards } from '../frontend/src/game/freecellLogic'
import { msReferenceDeals } from '../frontend/src/game/msReferenceDeals'

const rankShort: Record<string, string> = {
  ace: 'A', '10': 'T', jack: 'J', queen: 'Q', king: 'K',
}

let failed = false
for (const [game, rows] of Object.entries(msReferenceDeals)) {
  const { tableau } = dealCards(Number(game))
  const actual = rows.map((_, row) =>
    tableau
      .filter((col) => col.length > row)
      .map((col) => {
        const card = col[row]
        return (rankShort[card.rank] ?? card.rank) + card.suit[0].toUpperCase()
      })
      .join(' '),
  )
  const ok = rows.every((line, i) => line === actual[i])
  console.log(`Game #${game}: ${ok ? 'OK' : 'MISMATCH'}`)
  if (!ok) {
    failed = true
    rows.forEach((line, i) => {
      console.log(`  Row ${i + 1} expected: ${line}`)
      console.log(`  Row ${i + 1} actual  : ${actual[i]}`)
    })
  }
}
process.exit(failed ? 1 : 0)
