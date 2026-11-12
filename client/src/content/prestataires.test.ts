import { describe, expect, it } from 'vitest'
import { PARTENAIRES, matchesService, quoteRequest } from './prestataires'

describe('prestataires', () => {
  it('aucun partenaire inventé', () => expect(PARTENAIRES).toEqual([]))
  it('reconnaît un contact du carnet par son métier, sans accents ni majuscules', () => {
    expect(matchesService({ trade: 'Entreprise de MÉNAGE', name: 'Net Pro' }, 'MENAGE')).toBe(true)
    expect(matchesService({ trade: 'Plombier', name: 'Dupont' }, 'MENAGE')).toBe(false)
    expect(matchesService({ trade: null, name: 'Studio Photo Exemple' }, 'PHOTO')).toBe(true)
  })
  it('demande de devis : le logement, sans le locataire', () => {
    const q = quoteRequest('PHOTO', { kindLabel: 'Appartement', address: '1 rue Exemple', city: 'Lyon', surface: 42, rooms: 2 })
    expect(q.subject).toBe('Demande de devis : photographe')
    expect(q.body).toContain('- Appartement, 42 m², 2 pièces\n- 1 rue Exemple, Lyon')
    expect(quoteRequest('MENAGE', { kindLabel: 'Studio', address: '2 quai Exemple, 34200 Sète', city: 'Sète', surface: null, rooms: null }).body).toContain('- 2 quai Exemple, 34200 Sète\n')
  })
})
