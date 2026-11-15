import { describe, expect, it } from 'vitest'
import { billCents, CAP_MAX_HOMES } from './config'

/** Tarif public de Qalimo lu le 15 novembre 2026 (qalimo.fr/tarif) : 4,90 € par bien et par mois (49 € par an) de 1 à 7,
 * forfait de 34,30 € par mois (343 € par an) de 7 à 40. Bailio doit toujours coûter moins. */
const qalimo = (n: number, yearly: boolean) => (yearly ? (n <= 7 ? n * 4900 : 34300) : n <= 7 ? n * 490 : 3430)

describe('prix de Bailio', () => {
  it('reste moins cher que Qalimo de 1 à 40 biens, au mois et à l’année', () => {
    for (let n = 1; n <= CAP_MAX_HOMES; n++) {
      for (const yearly of [false, true]) {
        const bailio = billCents(n, 0, yearly)
        expect(bailio, `${n} logements, ${yearly ? 'an' : 'mois'}`).not.toBeNull()
        expect(bailio!).toBeLessThan(qalimo(n, yearly))
      }
    }
  })
  it('applique le prix par logement puis le plafond', () => {
    expect(billCents(2, 0, false)).toBe(698)
    expect(billCents(2, 1, true)).toBe(2 * 3490 + 12 * 149)
    expect(billCents(8, 0, false)).toBe(2792)
    expect(billCents(9, 0, false)).toBe(2990)
    expect(billCents(40, 0, true)).toBe(29900)
  })
  it('passe sur devis au-delà de 40 biens', () => {
    expect(billCents(41, 0, false)).toBeNull()
    expect(billCents(30, 11, true)).toBeNull()
  })
})
