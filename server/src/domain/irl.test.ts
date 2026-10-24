import { test } from 'node:test'
import assert from 'node:assert/strict'
import { KNOWN_IRL, withKnown } from '../lib/irl.js'

test('IRL : valeurs de secours cohérentes avec les variations publiées par l’INSEE', () => {
  const v = (q: string) => KNOWN_IRL.find((p) => p.quarter === q)!.value
  // Variation sur un an publiée : +1,57 % au 3e trimestre 2026, +1,15 % au 2e, +0,87 % au 3e trimestre 2025.
  assert.equal(Math.round((v('2026-Q3') / v('2025-Q3') - 1) * 10_000) / 100, 1.57)
  assert.equal(Math.round((v('2026-Q2') / v('2025-Q2') - 1) * 10_000) / 100, 1.15)
  assert.equal(Math.round((v('2025-Q3') / v('2024-Q3') - 1) * 10_000) / 100, 0.87)
  // Trimestres tous différents, du plus récent au plus ancien.
  assert.deepEqual(KNOWN_IRL.map((p) => p.quarter), [...new Set(KNOWN_IRL.map((p) => p.quarter))].sort().reverse())
})

test('IRL : la base l’emporte sur les valeurs connues, un trimestre plus récent passe en tête', () => {
  const merged = withKnown([{ quarter: '2026-Q4', value: 148.9, publishedAt: null }, { quarter: '2026-Q3', value: 148.06, publishedAt: '2026-10-16' }])
  assert.equal(merged[0].quarter, '2026-Q4')
  assert.equal(merged.length, KNOWN_IRL.length + 1)
  assert.equal(withKnown([])[0].quarter, '2026-Q3')
})
