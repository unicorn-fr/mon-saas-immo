import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CHARGES_BLOCKS, REPAIRS_BLOCKS } from '../pdf/annexes-text.js'
import { letterAllowed, letterContent, letterSchema, tenantNoticeMonths, type LetterInput } from './letters.js'

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

test('sinistre et réclamation à un artisan : destinataire tiers, textes de loi cités', () => {
  const claim = letterContent(
    letterSchema.parse({ type: 'INSURANCE_CLAIM', recipient: { name: 'MAIF', address: '200 avenue Salvador Allende, Niort' }, policyNumber: 'PNO-1234', eventDate: '2026-09-20', cause: 'WATER', circumstances: 'fuite du ballon d’eau chaude.', damages: 'plafond de la salle de bains taché' }),
    ctx,
  )
  assert.match(claim.subject, /contrat n° PNO-1234/)
  assert.match(claim.paragraphs[0], /dégât des eaux.*20 septembre 2026.*12 chemin des Vignes/)
  assert.match(claim.paragraphs[1], /ballon d’eau chaude\.$/)
  assert.ok(claim.paragraphs.some((p) => /L\. 113-2 du code des assurances/.test(p)))
  const contractor = letterContent(letterSchema.parse({ type: 'CONTRACTOR_CLAIM', recipient: { name: 'Plomberie Martin' }, work: 'remplacement du mitigeur', workDate: '2026-09-02', problems: 'fuite au raccord', delayDays: 15 }), ctx)
  assert.match(contractor.paragraphs[0], /le 2 septembre 2026.*remplacement du mitigeur/)
  assert.match(contractor.paragraphs[2], /15 jours/)
  assert.ok(contractor.paragraphs.some((p) => /article 1344.*article 1222/.test(p)))
  assert.throws(() => letterSchema.parse({ type: 'CONTRACTOR_CLAIM', recipient: { name: '' }, work: 'x', problems: 'y' }))
})

test('régularisation des charges au prorata de l’occupation, majoration du dépôt rendu en retard', async () => {
  const { occupancyShare, depositLatePenalty, depositDeadline, letterContent } = await import('./letters.js')
  assert.deepEqual(occupancyShare(2025, '2025-07-01', null), { share: 184 / 365, days: 184, yearDays: 365 })
  assert.equal(occupancyShare(2025, '2024-01-01', '2026-01-01').days, 365)
  const deadline = depositDeadline('2026-03-10', true) // 10 avril
  assert.deepEqual(depositLatePenalty(deadline, '2026-04-10', 60000), { months: 0, cents: 0 })
  assert.deepEqual(depositLatePenalty(deadline, '2026-04-11', 60000), { months: 1, cents: 6000 })
  assert.deepEqual(depositLatePenalty(deadline, '2026-06-12', 60000), { months: 3, cents: 18000 })
  const ctx = { tenantName: 'Lucas Garnier', propertyAddress: '14 quai de Bosc, Sète' }
  const charges = letterContent({ type: 'CHARGES', year: 2025, lines: [{ label: 'Eau froide', amountCents: 36500 }], provisionsCents: 10000, occupiedFrom: '2025-07-01', occupiedTo: null }, ctx as never)
  assert.ok(charges.paragraphs.some((p) => /184 jours sur 365/.test(p)))
  assert.equal(charges.computed?.[0].cents, Math.round(36500 * 184 / 365) - 10000)
})

test('garage loué seul : courriers du contrat, sans la loi de 1989', () => {
  const g = { ...ctx, kind: 'PARKING' as const, noticeMonths: 2, premises: 'Box fermé n° 12, 3 rue Foch' }
  const conge = text({ type: 'NOTICE_TO_LEAVE', reason: 'SALE', leaseEnd: '2027-09-30' }, g)
  assert.match(conge, /ne le reconduis pas/)
  assert.match(conge, /préavis de 2 mois/)
  assert.doesNotMatch(conge, /89-462|offre de vente/)
  const notice = letterContent(letterSchema.parse({ type: 'NOTICE_TO_LEAVE', reason: 'SALE', leaseEnd: '2027-09-30' }), g)
  assert.equal(notice.appendNotice, undefined)
  assert.equal(tenantNoticeMonths('PARKING', false, 2), 2)
  assert.equal(tenantNoticeMonths('PARKING', false), 1)
  assert.match(text({ type: 'TENANT_NOTICE', receivedDate: '2026-10-05', reduced: false }, g), /prend fin le 5 décembre 2026/)
  // Dépôt : un mois après la remise des clés, sans majoration de l'article 22.
  const back = letterContent(letterSchema.parse({ type: 'DEPOSIT_RETURN', depositCents: 10000, keysDate: '2026-09-30', conform: false, deductions: [], writtenOn: '2027-03-01', monthlyRentCents: 10000 }), g)
  assert.deepEqual(back.computed?.[0], { label: 'À restituer', cents: 10000 })
  assert.match(back.paragraphs.join(' '), /30 octobre 2026/)
  assert.doesNotMatch(back.paragraphs.join(' '), /article 22|89-462/)
  assert.match(text({ type: 'DAMAGE_REPAIR', items: [{ label: 'Porte enfoncée' }], delayDays: 15 }, g), /article 1732 du Code civil/)
  assert.doesNotMatch(text({ type: 'FORMAL_NOTICE', amountCents: 10000, periods: ['septembre 2026'] }, g), /FSL|ADIL/)
  assert.equal(letterAllowed('BOILER', 'PARKING'), false)
  assert.equal(letterAllowed('SMOKE_DETECTOR', 'PARKING'), false)
  assert.equal(letterAllowed('CHARGES', 'PARKING'), true)
  assert.equal(letterAllowed('REVISION', 'PARKING'), true)
  assert.equal(letterAllowed('BOILER', 'VIDE'), true)
})
