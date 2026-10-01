import { describe, expect, it } from 'vitest'
import { centsToInput, euros, parseEuros, plural } from './format'
import { maxDepositCents } from './lease'
import { safePath } from './safePath'

describe('montants (en centimes)', () => {
  it('affiche les euros à la française', () => {
    // Espaces insécables : le montant et le symbole ne sont jamais séparés en fin de ligne.
    const plain = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ')
    expect(plain(euros(93500))).toBe('935 €')
    expect(plain(euros(123456))).toBe('1 234,56 €')
    expect(euros(null)).toBe('')
  })
  it('lit une saisie libre', () => {
    expect(parseEuros('935,50')).toBe(93550)
    expect(parseEuros('1 200 €')).toBe(120000)
    expect(parseEuros('')).toBeUndefined()
    expect(parseEuros('-3')).toBeUndefined()
    expect(centsToInput(93550)).toBe('935,5')
  })
  it('dépôt de garantie maximum : 1 mois en vide, 2 mois en meublé', () => {
    expect(maxDepositCents('UNFURNISHED', 80000)).toBe(80000)
    expect(maxDepositCents('FURNISHED', 80000)).toBe(160000)
  })
  it('pluriels', () => {
    expect(plural(1, 'action')).toBe('1 action')
    expect(plural(3, 'action')).toBe('3 actions')
  })
})

describe('retour après connexion', () => {
  it('n’accepte que des chemins internes', () => {
    expect(safePath('/espace/baux/1')).toBe('/espace/baux/1')
    expect(safePath('//pirate.example')).toBeNull()
    expect(safePath('https://pirate.example')).toBeNull()
    expect(safePath('/\\pirate.example')).toBeNull()
    expect(safePath(null)).toBeNull()
  })
})
