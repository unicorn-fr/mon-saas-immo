import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CHARGES_BLOCKS, REPAIRS_BLOCKS } from '../pdf/annexes-text.js'
import { letterContent, letterSchema, type LetterInput } from './letters.js'

const ctx = { tenantName: 'Monsieur Thomas Leroy', propertyAddress: '12 chemin des Vignes, Pézenas', kind: 'VIDE' as const, landlordName: 'Madame Claire Dubois', landlordAddress: '8 rue Foch, Montpellier', leaseStart: '2025-10-01', guarantor: { name: 'Monsieur Benoît Leroy', solidaire: true } }
const text = (l: LetterInput, c = ctx) => letterContent(letterSchema.parse(l), c).paragraphs.join(' ')

test('solde de tout compte : dépôt − retenues − loyers dus ± charges − provision', () => {
  const c = letterContent(letterSchema.parse({ type: 'DEPOSIT_RETURN', depositCents: 100000, keysDate: '2026-09-30', conform: true, deductions: [{ label: 'Trous', justification: 'Devis', amountCents: 10000 }], unpaidCents: 30000, chargesBalanceCents: -5000, heldCents: 20000 }), ctx)
  assert.deepEqual(c.computed?.[0], { label: 'À restituer', cents: 45000 })
  assert.match(c.paragraphs.join(' '), /30 octobre 2026/) // un mois après la remise des clés
  assert.match(c.paragraphs.join(' '), /approbation définitive des comptes/)
  const owed = letterContent(letterSchema.parse({ type: 'DEPOSIT_RETURN', depositCents: 50000, keysDate: '2026-09-30', conform: false, deductions: [], unpaidCents: 80000 }), ctx)
  assert.deepEqual(owed.computed?.[0], { label: 'Reste dû par le locataire', cents: 30000 })
})

test('appel à la caution : solidaire ou simple', () => {
  const l: LetterInput = { type: 'GUARANTOR_CALL', amountCents: 168000, periods: ['août 2026'], delayDays: 15, commandDate: '2026-09-20' }
  assert.match(text(l), /caution solidaire/)
  assert.match(text(l), /20 septembre 2026/)
  assert.match(text(l, { ...ctx, guarantor: { name: 'X', solidaire: false } }), /caution simple/)
})

test('attestations et formulaire : mise en page et mentions', () => {
  const att = letterContent(letterSchema.parse({ type: 'RENT_CERTIFICATE', since: '2025-10-01', rentCents: 78000, chargesCents: 6000 }), ctx)
  assert.equal(att.form, 'ATTESTATION')
  assert.match(att.paragraphs.join(' '), /840 € par mois \(huit cent quarante euros\)/)
  const consent = letterContent(letterSchema.parse({ type: 'E_RECEIPT_CONSENT', email: 'thomas@example.fr' }), ctx)
  assert.equal(consent.form, 'TENANT_FORM')
  assert.match(consent.paragraphs.join(' '), /article 21/)
  assert.match(text({ type: 'DEPOSIT_RECEIPT', amountCents: 78000, receivedDate: '2025-10-01', method: 'virement' }), /sept cent quatre-vingts euros/)
  assert.match(text({ type: 'SMOKE_DETECTOR', count: 2 }), /2 détecteurs/)
})

test('préavis d’un mois sans justificatif : fin à trois mois', () => {
  assert.match(text({ type: 'SHORT_NOTICE_PROOF', receivedDate: '2026-10-05', reason: 'mutation' }), /5 janvier 2027/)
})

test('trouble, dégradations, chaudière, vente du logement : textes de loi cités', () => {
  assert.match(text({ type: 'NUISANCE', facts: 'musique forte après 22 heures', delayDays: 8 }), /article 6-1/)
  assert.match(text({ type: 'DAMAGE_REPAIR', items: [{ label: 'porte fendue' }], delayDays: 30 }), /87-712/)
  assert.match(text({ type: 'BOILER', lastServiceDate: null }), /2009-649/)
  assert.match(text({ type: 'OWNER_CHANGE', newOwnerName: 'M. Martin', newOwnerAddress: 'Lyon', effectiveDate: '2026-11-01' }), /1743/)
})

test('annexes officielles complètes (décrets 87-712 et 87-713)', () => {
  const h = (b: typeof REPAIRS_BLOCKS) => b.filter((x) => x.t === 'h').map((x) => (x.t === 'h' ? x.n : ''))
  assert.deepEqual(h(REPAIRS_BLOCKS), ['I', 'II', 'III', 'IV', 'V', 'VI'])
  assert.deepEqual(h(CHARGES_BLOCKS), ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'])
  const all = CHARGES_BLOCKS.map((b) => ('x' in b ? b.x : '')).join(' ')
  assert.match(all, /L\. 35-5 du code de la santé publique/)
  assert.match(all, /Taxe ou redevance d'enlèvement des ordures ménagères/)
})
