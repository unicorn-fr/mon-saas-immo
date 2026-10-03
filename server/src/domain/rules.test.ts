import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  allowedChargesModes,
  cautionAllowed,
  contractEndDate,
  diagnosticsFor,
  energyRentalWarning,
  feeCapsCents,
  firstPayment,
  forbiddenClauseReasons,
  landlordNoticeMonthsFor,
  leaseDurationMonths,
  maxDepositFor,
  rentControlLikely,
  rentRevisionAllowed,
  rentalForbidden,
  rentIssues,
} from './rules.js'
import { toIsoDate } from './lease.js'

test('durée : 3 ans (particulier, SCI familiale), 6 ans (société, SCI non familiale), durée réduite, meublé, étudiant, mobilité', () => {
  assert.equal(leaseDurationMonths('VIDE', { kind: 'PERSON' }), 36)
  assert.equal(leaseDurationMonths('VIDE', { kind: 'SCI', sciFamily: true }), 36)
  assert.equal(leaseDurationMonths('VIDE', { kind: 'SCI', sciFamily: false }), 72)
  assert.equal(leaseDurationMonths('VIDE', { kind: 'COMPANY' }), 72)
  assert.equal(leaseDurationMonths('VIDE', { kind: 'PERSON' }, { reduced: { enabled: true }, durationMonths: 18 }), 18)
  assert.equal(leaseDurationMonths('VIDE', { kind: 'PERSON' }, { reduced: { enabled: true }, durationMonths: 6 }), 12, 'au moins un an')
  assert.equal(leaseDurationMonths('VIDE', { kind: 'COMPANY' }, { reduced: { enabled: true }, durationMonths: 18 }), 72, 'réservée aux personnes physiques')
  assert.equal(leaseDurationMonths('MEUBLE', { kind: 'PERSON' }), 12)
  assert.equal(leaseDurationMonths('ETUDIANT', { kind: 'PERSON' }), 9)
  assert.equal(leaseDurationMonths('MOBILITE', { kind: 'PERSON' }, { durationMonths: 4 }), 4)
  assert.equal(leaseDurationMonths('MOBILITE', { kind: 'PERSON' }, { durationMonths: 14 }), 10)
})

test('dépôt de garantie : 1 mois en vide, 2 mois en meublé, interdit en bail mobilité', () => {
  assert.equal(maxDepositFor('VIDE', 93500), 93500)
  assert.equal(maxDepositFor('MEUBLE', 50000), 100000)
  assert.equal(maxDepositFor('ETUDIANT', 50000), 100000)
  assert.equal(maxDepositFor('MOBILITE', 50000), 0)
})

test('préavis du bailleur : 6 mois en vide, 3 en meublé, aucun congé en mobilité ou étudiant', () => {
  assert.equal(landlordNoticeMonthsFor('VIDE'), 6)
  assert.equal(landlordNoticeMonthsFor('MEUBLE'), 3)
  assert.equal(landlordNoticeMonthsFor('MOBILITE'), null)
  assert.equal(landlordNoticeMonthsFor('ETUDIANT'), null)
})

test('charges : forfait interdit en vide hors colocation, seul autorisé en mobilité', () => {
  assert.deepEqual(allowedChargesModes('VIDE', false), ['PROVISION', 'PERIODIC'])
  assert.ok(allowedChargesModes('VIDE', true).includes('FORFAIT'))
  assert.ok(allowedChargesModes('MEUBLE', false).includes('FORFAIT'))
  assert.deepEqual(allowedChargesModes('MOBILITE', false), ['FORFAIT'])
})

test('DPE : révision bloquée en F et G, location interdite en G', () => {
  assert.equal(rentRevisionAllowed('D'), true)
  assert.equal(rentRevisionAllowed('F'), false)
  assert.equal(rentRevisionAllowed('G'), false)
  assert.match(energyRentalWarning('G', new Date('2026-09-30')) ?? '', /ne peut plus être loué/)
  assert.match(energyRentalWarning('F', new Date('2026-09-30')) ?? '', /2028/)
  assert.equal(energyRentalWarning('C', new Date('2026-09-30')), null)
})

test('diagnostics : plomb avant 1949, amiante avant juillet 1997, gaz seulement avec une installation de gaz', () => {
  const old = diagnosticsFor({ constructionPeriod: 'BEFORE_1949', heating: { energy: 'GAS' } })
  assert.equal(old.find((d) => d.key === 'lead')?.required, true)
  assert.equal(old.find((d) => d.key === 'asbestos')?.required, true)
  assert.equal(old.find((d) => d.key === 'gas')?.required, true)
  const recent = diagnosticsFor({ constructionPeriod: 'AFTER_2005', heating: { energy: 'ELECTRIC' } })
  assert.equal(recent.find((d) => d.key === 'lead')?.required, false)
  assert.equal(recent.find((d) => d.key === 'asbestos')?.required, false)
  assert.equal(recent.find((d) => d.key === 'gas')?.required, false)
  assert.equal(recent.find((d) => d.key === 'dpe')?.required, true)
  assert.equal(recent.find((d) => d.key === 'erp')?.required, true)
})

test('premier loyer au prorata en cas d’entrée en cours de mois', () => {
  assert.deepEqual(firstPayment('2026-10-01', 93500, 4000), { fullMonth: true, days: 31, daysInMonth: 31, rentCents: 93500, chargesCents: 4000 })
  const mid = firstPayment('2026-09-16', 90000, 6000)
  assert.equal(mid.days, 15)
  assert.equal(mid.rentCents, 45000)
  assert.equal(mid.chargesCents, 3000)
})

test('fin du bail : la veille de la date anniversaire', () => {
  assert.equal(toIsoDate(contractEndDate('2026-10-01', 36)), '2029-09-30')
  assert.equal(toIsoDate(contractEndDate('2026-09-15', 9)), '2027-06-14')
})

test('encadrement des loyers : communes connues', () => {
  assert.equal(rentControlLikely('75111'), true)
  assert.equal(rentControlLikely('34172'), true)
  assert.equal(rentControlLikely('34199'), false)
})

test('honoraires : plafonds par m²', () => {
  assert.deepEqual(feeCapsCents(40, 'TENSE'), { visitFileLease: 40000, inventory: 12000 })
  assert.deepEqual(feeCapsCents(40, 'OTHER'), { visitFileLease: 32000, inventory: 12000 })
})

test('clauses interdites détectées, clauses licites acceptées', () => {
  assert.equal(forbiddenClauseReasons('Les animaux sont interdits dans le logement.').length, 1)
  assert.equal(forbiddenClauseReasons('Le locataire paiera par prélèvement automatique.').length, 1)
  assert.equal(forbiddenClauseReasons('Tout retard entraînera une pénalité de 10 %.').length, 1)
  assert.equal(forbiddenClauseReasons('Il est interdit d’héberger des amis plus de 3 jours.').length, 1)
  assert.equal(forbiddenClauseReasons('Les frais d’état des lieux sont facturés 150 €.').length, 1)
  assert.deepEqual(forbiddenClauseReasons('Le locataire entretient le jardin et taille la haie une fois par an.'), [])
  assert.deepEqual(forbiddenClauseReasons('Le locataire fait ramoner la cheminée chaque année.'), [])
})

test('caution et assurance loyers impayés : cumul interdit sauf étudiant ou apprenti', () => {
  assert.equal(cautionAllowed('CAUTION', 'EMPLOYEE', true), false)
  assert.equal(cautionAllowed('CAUTION', 'STUDENT', true), true)
  assert.equal(cautionAllowed('CAUTION', 'EMPLOYEE', false), true)
})

test('montants en toutes lettres', async () => {
  const { eurosInWords, integerInWords } = await import('./words.js')
  assert.equal(eurosInWords(78000), 'sept cent quatre-vingts euros')
  assert.equal(eurosInWords(93500), 'neuf cent trente-cinq euros')
  assert.equal(eurosInWords(125050), 'mille deux cent cinquante euros et cinquante centimes')
  assert.equal(integerInWords(71), 'soixante et onze')
  assert.equal(integerInWords(81), 'quatre-vingt-un')
  assert.equal(integerInWords(91), 'quatre-vingt-onze')
  assert.equal(integerInWords(200), 'deux cents')
  assert.equal(integerInWords(201), 'deux cent un')
  assert.equal(integerInWords(80000), 'quatre-vingt mille')
  assert.equal(integerInWords(21), 'vingt et un')
  assert.equal(eurosInWords(100), 'un euro')
})

test('courriers : loyer révisé à l’IRL, échéance de restitution du dépôt, régularisation', async () => {
  const { revisedRent, depositDeadline, letterContent } = await import('./letters.js')
  assert.equal(revisedRent(72000, 145.47, 148.37), 73435)
  assert.equal(toIsoDate(depositDeadline('2026-09-30', true)), '2026-10-30')
  assert.equal(toIsoDate(depositDeadline('2026-09-30', false)), '2026-11-30')
  const reg = letterContent({ type: 'CHARGES', year: 2026, provisionsCents: 72000, lines: [{ label: 'Ordures ménagères', amountCents: 18600 }, { label: 'Parties communes', amountCents: 31200 }, { label: 'Eau froide', amountCents: 24800 }] }, { tenantName: 'Thomas Martin', propertyAddress: '14 rue des Lilas' })
  assert.deepEqual(reg.computed, [{ label: 'Reste à payer par le locataire', cents: 2600 }])
  const dep = letterContent({ type: 'DEPOSIT_RETURN', depositCents: 90000, keysDate: '2026-08-31', conform: false, deductions: [{ label: 'Trous', justification: 'Devis', amountCents: 8500 }, { label: 'Hotte', justification: 'Facture', amountCents: 3000 }] }, { tenantName: 'Marc Petit', propertyAddress: 'Pézenas' })
  assert.equal(dep.computed?.[0].cents, 78500)
})

test('logement interdit à la location : G depuis 2025, F en 2028, E en 2034', () => {
  assert.match(rentalForbidden('G', new Date('2026-10-03')) ?? '', /1er janvier 2025/)
  assert.equal(rentalForbidden('G', new Date('2024-12-31')), null)
  assert.equal(rentalForbidden('F', new Date('2027-12-31')), null)
  assert.match(rentalForbidden('F', new Date('2028-01-01')) ?? '', /1er janvier 2028/)
  assert.equal(rentalForbidden('E', new Date('2033-12-31')), null)
  assert.match(rentalForbidden('E', new Date('2034-01-01')) ?? '', /2034/)
  assert.equal(rentalForbidden('D', new Date('2040-01-01')), null)
  assert.equal(rentalForbidden(null), null)
})

test('plafonds du loyer : encadrement, complément, logement F ou G, zone tendue', () => {
  const codes = (x: Parameters<typeof rentIssues>[0]) => rentIssues(x).map((i) => i.code)
  // Encadrement : 25 €/m² × 30 m² = 750 € de loyer de base au plus
  assert.deepEqual(codes({ rentCents: 75000, surface: 30, zone: { control: true, refRentMaxCentsM2: 2500 } }), [])
  assert.deepEqual(codes({ rentCents: 80000, surface: 30, zone: { control: true, refRentMaxCentsM2: 2500 } }), ['CEILING'])
  assert.deepEqual(codes({ rentCents: 80000, surface: 30, zone: { control: true, refRentMaxCentsM2: 2500, complementCents: 5000 } }), [])
  assert.deepEqual(codes({ rentCents: 80000, surface: 30, dpe: 'F', zone: { control: true, refRentMaxCentsM2: 2500, complementCents: 5000 } }), ['COMPLEMENT_ENERGY'])
  assert.deepEqual(codes({ rentCents: 80000, zone: { complementCents: 5000 } }), ['COMPLEMENT_NO_CONTROL'])
  // Relocation
  const prev = { rentedWithin18Months: true, lastRentCents: 70000 }
  assert.deepEqual(codes({ rentCents: 72000, zone: { tense: true }, previous: prev }), ['RELET_TENSE'])
  assert.deepEqual(codes({ rentCents: 72000, zone: { tense: true }, previous: { ...prev, increaseReason: 'Révision de 2025 non appliquée' } }), [])
  assert.deepEqual(codes({ rentCents: 72000, zone: { tense: false }, previous: prev }), [])
  assert.deepEqual(codes({ rentCents: 72000, dpe: 'G', zone: { tense: false }, previous: { ...prev, increaseReason: 'Travaux' } }), ['RELET_ENERGY'])
  assert.deepEqual(codes({ rentCents: 70000, dpe: 'G', previous: prev }), [])
  assert.deepEqual(codes({ rentCents: 72000, zone: { tense: true }, previous: { rentedWithin18Months: false, lastRentCents: 70000 } }), [])
})

test('validité des diagnostics : anciens DPE, état des risques de 6 mois, électricité et gaz 6 ans', async () => {
  const { diagnosticValidUntil, expiredDiagnostics } = await import('./rules.js')
  assert.equal(diagnosticValidUntil('dpe', '2016-05-10'), '2022-12-31')
  assert.equal(diagnosticValidUntil('dpe', '2020-03-01'), '2024-12-31')
  assert.equal(diagnosticValidUntil('dpe', '2022-03-01'), '2032-03-01')
  assert.equal(diagnosticValidUntil('erp', '2026-05-01'), '2026-11-01')
  assert.equal(diagnosticValidUntil('electricity', '2021-01-15'), '2027-01-15')
  assert.equal(diagnosticValidUntil('asbestos', '1999-01-01'), null)
  assert.equal(diagnosticValidUntil('dpe', null), null)
  const p = { constructionPeriod: '1990_2005' as const, diagnostics: { dpe: { class: 'D' as const, date: '2019-06-01' }, erp: { date: '2026-01-10' } } }
  assert.deepEqual(expiredDiagnostics(p, new Date('2026-10-03')).map((d) => d.key), ['dpe', 'erp'])
})
