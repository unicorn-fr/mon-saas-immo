import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ageAt, aidsFor, housingAid, locAvantagesAid, renovationAid, visaleAid, type AidInput } from './aids.js'

const base: AidInput = { today: '2026-10-06', dpe: 'D', furnished: false, department: '34', constructionPeriod: '1975_1989', company: false, rentCents: 60000, chargesCents: 5000, leaseDraft: true, leaseActive: false, tenant: null }

test('Visale : 30 ans ou moins, ou salarié à 1 710 € nets au plus ; plafonds de loyer ; avant la signature', () => {
  assert.equal(ageAt('1996-10-07', '2026-10-06'), 29)
  assert.equal(ageAt('1996-10-06', '2026-10-06'), 30)
  assert.equal(visaleAid({ ...base, tenant: { birthDate: '1996-10-06', situation: 'STUDENT' } }).status, 'LIKELY')
  assert.equal(visaleAid({ ...base, tenant: { birthDate: '1980-01-01', situation: 'EMPLOYEE', monthlyIncomeCents: 171_000 } }).status, 'LIKELY')
  assert.equal(visaleAid({ ...base, tenant: { birthDate: '1980-01-01', situation: 'EMPLOYEE', monthlyIncomeCents: 250_000 } }).status, 'CHECK')
  assert.equal(visaleAid({ ...base, tenant: { birthDate: '1980-01-01', situation: 'RETIRED' } }).status, 'NOT')
  // Loyer charges comprises : 1 940 € en Île-de-France, 1 575 € dans les grandes agglomérations, 1 365 € ailleurs
  assert.equal(visaleAid({ ...base, rentCents: 150_000, chargesCents: 10_000, tenant: { birthDate: '2000-01-01', situation: 'STUDENT' } }).status, 'NOT')
  assert.equal(visaleAid({ ...base, department: '75', rentCents: 150_000, chargesCents: 10_000, tenant: { birthDate: '2000-01-01', situation: 'STUDENT' } }).status, 'LIKELY')
  assert.equal(visaleAid({ ...base, rentCents: 140_000, chargesCents: 0, tenant: { birthDate: '2000-01-01', situation: 'STUDENT' } }).status, 'CHECK')
  // Loyer au plus la moitié des ressources
  assert.equal(visaleAid({ ...base, tenant: { birthDate: '2000-01-01', situation: 'EMPLOYEE', monthlyIncomeCents: 120_000 } }).status, 'NOT')
  // Bail déjà signé : seulement bon à savoir
  assert.equal(visaleAid({ ...base, leaseDraft: false, leaseActive: true, tenant: { birthDate: '2000-01-01' } }).status, 'INFO')
})

test('rénovation : MaPrimeRénov’ d’ampleur pour E, F, G ; personnes morales exclues', () => {
  assert.equal(renovationAid({ ...base, dpe: 'F' }).status, 'LIKELY')
  assert.match(renovationAid({ ...base, dpe: 'F' }).reasons.join(' '), /1er janvier 2028/)
  assert.equal(renovationAid({ ...base, dpe: 'C' }).status, 'INFO')
  assert.equal(renovationAid({ ...base, dpe: 'G', company: true }).status, 'CHECK')
  assert.match(renovationAid({ ...base, dpe: 'G', company: true }).reasons.join(' '), /personnes morales/)
})

test('Loc’Avantages : location vide, DPE E au moins, jusqu’au 31 décembre 2027', () => {
  assert.equal(locAvantagesAid(base).status, 'CHECK')
  assert.equal(locAvantagesAid({ ...base, furnished: true }).status, 'NOT')
  assert.equal(locAvantagesAid({ ...base, dpe: 'F' }).status, 'NOT')
  assert.equal(locAvantagesAid({ ...base, today: '2028-01-01' }).status, 'NOT')
})

test('aides : ordre d’affichage et aide au logement', () => {
  assert.equal(housingAid({ ...base, leaseDraft: false, leaseActive: false }).status, 'NOT')
  const list = aidsFor({ ...base, dpe: 'F', tenant: { birthDate: '2001-05-05', situation: 'STUDENT' } })
  assert.deepEqual(list.map((a) => a.status), ['LIKELY', 'LIKELY', 'INFO', 'NOT'])
})
