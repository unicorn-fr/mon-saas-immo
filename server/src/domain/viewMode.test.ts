import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { effectiveViewMode, isViewMode, suggestViewMode } from './viewMode.js'

describe('vue du tableau de bord', () => {
  it('propose la vue selon le nombre de logements', () => {
    assert.equal(suggestViewMode(0), 'SIMPLE')
    assert.equal(suggestViewMode(2), 'SIMPLE')
    assert.equal(suggestViewMode(3), 'PORTFOLIO')
    assert.equal(suggestViewMode(20), 'PORTFOLIO')
    assert.equal(suggestViewMode(21), 'LARGE')
  })
  it('plusieurs structures : au moins la vue par logement', () => {
    assert.equal(suggestViewMode(2, 3), 'PORTFOLIO')
    assert.equal(suggestViewMode(2, 2), 'SIMPLE')
  })
  it('garde le choix du propriétaire, ignore une valeur inconnue', () => {
    assert.equal(effectiveViewMode('AGENCY', 1), 'AGENCY')
    assert.equal(effectiveViewMode('SIMPLE', 40), 'SIMPLE')
    assert.equal(effectiveViewMode('AUTRE', 40), 'LARGE')
    assert.equal(effectiveViewMode(null, 5), 'PORTFOLIO')
    assert.equal(isViewMode('PORTFOLIO'), true)
    assert.equal(isViewMode(3), false)
  })
})
