import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addMonths, durationMonths, formatDateFr, formatEuros, leaseEndDate, leaseInputSchema, maxDepositCents, parseIsoDate, toIsoDate } from './lease.js'
import { computeReminders } from '../services/reminders.js'
import { landlordFor, resumptionAllowed, sharesTotal, structureEffects, structureFromProfile, structureName, defaultTaxRegime } from './structure.js'
import { leaseDurationMonths } from './rules.js'

const base = {
  type: 'UNFURNISHED' as const,
  property: { address: '3 place de la Comédie 34000 Montpellier', surface: 65, rooms: 3 },
  landlord: { firstName: 'Claire', lastName: 'Dubois', address: '5 rue de la Loge 34000 Montpellier' },
  tenants: [{ firstName: 'Sophie', lastName: 'Leroy' }],
  rent: { rentCents: 85_000, chargesCents: 5_000, startDate: '2026-10-01', paymentDay: 5 },
}

test('durée légale : 3 ans en vide, 1 an en meublé', () => {
  assert.equal(durationMonths('UNFURNISHED'), 36)
  assert.equal(durationMonths('FURNISHED'), 12)
})

test('dépôt de garantie maximum : 1 mois en vide, 2 mois en meublé', () => {
  assert.equal(maxDepositCents('UNFURNISHED', 85_000), 85_000)
  assert.equal(maxDepositCents('FURNISHED', 60_000), 120_000)
})

test('un dépôt au-dessus du plafond est refusé, sauf pour un bail déjà signé importé', () => {
  const tooHigh = { ...base, rent: { ...base.rent, depositCents: 170_000 } }
  assert.equal(leaseInputSchema.safeParse(tooHigh).success, false)
  assert.equal(leaseInputSchema.safeParse({ ...tooHigh, source: 'import' }).success, true)
})

test('fin de bail : la veille de la date anniversaire', () => {
  assert.equal(toIsoDate(leaseEndDate(parseIsoDate('2026-10-01'), 36)), '2029-09-30')
  assert.equal(toIsoDate(leaseEndDate(parseIsoDate('2026-01-31'), 12)), '2027-01-30')
})

test('ajout de mois sans débordement en fin de mois', () => {
  assert.equal(toIsoDate(addMonths(parseIsoDate('2026-01-31'), 1)), '2026-02-28')
})

test('formats français', () => {
  assert.equal(formatEuros(123_450), '1 234,50 €')
  assert.equal(formatEuros(93_500), '935 €')
  assert.equal(formatDateFr(parseIsoDate('2026-10-01')), '1er octobre 2026')
})

test('échéances calculées pour un bail vide qui démarre plus tard', () => {
  const start = new Date(Date.UTC(new Date().getUTCFullYear() + 1, 2, 1)) // 1er mars de l'an prochain
  const reminders = computeReminders({ id: 'l1', userId: 'u1', type: 'UNFURNISHED', status: 'ACTIVE', startDate: start, durationMonths: 36, paymentDay: 5 })
  const types = reminders.map((r) => r.type)
  assert.ok(types.includes('INVENTORY_ENTRY'))
  assert.ok(types.includes('INSURANCE'))
  assert.ok(types.filter((t) => t === 'RENT_RECEIPT').length >= 1)
  // Aucune quittance avant l'entrée du locataire.
  for (const r of reminders.filter((x) => x.type === 'RENT_RECEIPT')) assert.ok(new Date(r.dueDate) >= start)
  // Fin de bail : rappel 7 mois avant l'échéance (congé du bailleur : 6 mois en vide).
  const end = reminders.find((r) => r.type === 'LEASE_END')
  assert.equal(toIsoDate(new Date(end!.dueDate)), toIsoDate(addMonths(addMonths(start, 36), -7)))
})

// ── Structures qui détiennent les logements (docs/fiscalite/structures.md) ─────────────────────────

const person = { kind: 'PERSON' as const, civility: 'MADAME' as const, firstNames: 'Claire', lastName: 'Dubois', address: '5 rue de la Loge', payment: { holder: 'Claire Dubois', iban: 'FR76 1111' } }

test('structure : le bail suit la structure du logement (3 ans en nom propre ou SCI familiale, 6 ans pour une société)', () => {
  assert.equal(leaseDurationMonths('VIDE', landlordFor(person, { kind: 'PERSON' })), 36)
  assert.equal(leaseDurationMonths('VIDE', landlordFor(person, { kind: 'COUPLE' })), 36)
  assert.equal(leaseDurationMonths('VIDE', landlordFor(person, { kind: 'SCI', sciFamily: true })), 36)
  assert.equal(leaseDurationMonths('VIDE', landlordFor(person, { kind: 'SCI', sciFamily: false })), 72)
  assert.equal(leaseDurationMonths('VIDE', landlordFor(person, { kind: 'COMPANY', company: { name: 'Les Tilleuls', form: 'SARL de famille' } })), 72)
  assert.equal(leaseDurationMonths('MEUBLE', landlordFor(person, { kind: 'COMPANY' })), 12)
  // Durée réduite (1 à 3 ans) refusée à une société
  assert.equal(leaseDurationMonths('VIDE', landlordFor(person, { kind: 'SCI' }), { reduced: { enabled: true }, durationMonths: 18 }), 72)
})

test('structure : congé pour reprise réservé aux personnes et à la SCI familiale (art. 13 et 15)', () => {
  assert.equal(resumptionAllowed(landlordFor(person, { kind: 'PERSON' })), true)
  assert.equal(resumptionAllowed(landlordFor(person, { kind: 'COUPLE' })), true)
  assert.equal(resumptionAllowed(landlordFor(person, { kind: 'SCI', sciFamily: true })), true)
  assert.equal(resumptionAllowed(landlordFor(person, { kind: 'SCI' })), false)
  assert.equal(resumptionAllowed(landlordFor(person, { kind: 'COMPANY' })), false)
  assert.ok(structureEffects({ kind: 'SCI', sciFamily: true }).some((x) => x.includes('associé')))
  assert.ok(structureEffects({ kind: 'COMPANY' }).some((x) => x.includes('6 ans')))
})

test('structure : identité et signature du profil, société et compte de la structure', () => {
  const l = landlordFor(person, { kind: 'SCI', company: { name: 'Les Tilleuls', form: 'SCI', seat: '2 rue Haute' }, payment: { holder: 'SCI Les Tilleuls', iban: 'FR76 2222' } })
  assert.equal(l.kind, 'SCI')
  assert.equal(l.lastName, 'Dubois')
  assert.equal(l.company?.name, 'Les Tilleuls')
  assert.equal(l.payment?.iban, 'FR76 2222')
  // Sans compte propre à la structure : celui du profil
  assert.equal(landlordFor(person, { kind: 'PERSON' }).payment?.iban, 'FR76 1111')
  // Sans structure : le profil tel quel (comptes d'avant les structures)
  assert.deepEqual(landlordFor(person, null), person)
  // Une structure « en mon nom » efface une ancienne société du profil
  assert.equal(landlordFor({ ...person, kind: 'SCI', company: { name: 'Ancienne' } }, { kind: 'PERSON' }).company, null)
})

test('structure : première structure reprise du profil, nom et régime fiscal', () => {
  assert.deepEqual(structureFromProfile({}), { kind: 'PERSON', taxRegime: 'IR' })
  const sci = structureFromProfile({ kind: 'SCI', sciFamily: true, company: { name: 'Les Tilleuls', form: 'SCI' } })
  assert.equal(sci.sciFamily, true)
  assert.equal(structureName(sci), 'SCI Les Tilleuls')
  assert.equal(structureName({ kind: 'PERSON' }), 'En mon nom')
  assert.equal(structureName({ kind: 'PERSON', name: 'Studio de Sète' }), 'Studio de Sète')
  assert.equal(defaultTaxRegime({ kind: 'SCI' }), 'IR')
  assert.equal(defaultTaxRegime({ kind: 'COMPANY', company: { form: 'SAS' } }), 'IS')
  assert.equal(defaultTaxRegime({ kind: 'COMPANY', company: { form: 'SARL de famille' } }), 'IR')
})

test('structure : parts des associés', () => {
  assert.deepEqual(sharesTotal({ associates: [{ name: 'A', sharePct: 50 }, { name: 'B', sharePct: 50 }] }), { total: 100, complete: true })
  assert.deepEqual(sharesTotal({ associates: [{ name: 'A', sharePct: 33.33 }, { name: 'B', sharePct: 33.33 }, { name: 'C', sharePct: 33.34 }] }), { total: 100, complete: true })
  assert.deepEqual(sharesTotal({ associates: [{ name: 'A', sharePct: 60 }] }), { total: 60, complete: false })
  assert.deepEqual(sharesTotal({}), { total: 0, complete: false })
})

test('garage loué seul : durée du contrat, quelle que soit la structure (Code civil)', () => {
  assert.equal(leaseDurationMonths('PARKING', { kind: 'PERSON' }), 12)
  assert.equal(leaseDurationMonths('PARKING', { kind: 'COMPANY' }), 12)
  assert.equal(leaseDurationMonths('PARKING', { kind: 'SCI', sciFamily: false }, { durationMonths: 36 }), 36)
})
