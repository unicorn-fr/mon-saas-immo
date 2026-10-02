import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ART_15_II_FIRST_FIVE, CONGE_NOTICE_BLOCKS } from '../pdf/notice-conge-text.js'
import { NOTICE_BLOCKS, NOTICE_FOOTNOTES } from '../pdf/notice-text.js'
import { letterContent, tenantNoticeEnd, tenantNoticeMonths } from './letters.js'

const headings = (blocks: typeof NOTICE_BLOCKS) => blocks.flatMap((b) => (b.t === 'h' ? [b.n] : []))

test('notice du bail : texte en vigueur complet (arrêté du 29 mai 2015 modifié en 2023)', () => {
  const h = headings(NOTICE_BLOCKS)
  // Sections ajoutées ou renumérotées par l'arrêté du 16 février 2023
  for (const n of ['1.3.1.1', '1.5', '2.3', '3.2.2', '4', '5.4.1.2', '5.5', '5.6', '6']) assert.ok(h.includes(n), `section ${n} absente`)
  const text = NOTICE_BLOCKS.map((b) => ('x' in b ? b.x : '')).join(' ')
  assert.match(text, /^Préambule Le régime de droit commun des baux d'habitation/)
  assert.match(text, /exempt de toute infestation d'espèces nuisibles et parasites/)
  assert.match(text, /entre la classe A et la classe D/)
  assert.ok(NOTICE_BLOCKS.some((b) => b.t === 'table'), 'tableau des échéances de décence énergétique')
  assert.equal(NOTICE_FOOTNOTES.length, 14)
})

test('notice du congé : texte de l’arrêté du 13 décembre 2017, version tribunal judiciaire', () => {
  const h = headings(CONGE_NOTICE_BLOCKS)
  for (const n of ['1-4', '1-6-1', '2-1-5', '2-2-3', '2-2-4-4', '3-3-2-2', '4']) assert.ok(h.includes(n), `section ${n} absente`)
  const text = CONGE_NOTICE_BLOCKS.map((b) => ('x' in b ? b.x : '')).join(' ')
  assert.doesNotMatch(text, /tribunal d'instance/)
  assert.match(text, /tribunal judiciaire dans le ressort duquel se situe le logement/)
})

test('congé pour vendre un logement vide : prix, désignation, art. 15 II reproduit, notice jointe', () => {
  const c = letterContent({ type: 'NOTICE_TO_LEAVE', reason: 'SALE', leaseEnd: '2027-09-30', priceCents: 24500000 }, { tenantName: 'M. Leroy', propertyAddress: '12 chemin des Vignes', kind: 'VIDE', premises: 'maison individuelle de 88 m²' })
  const text = c.paragraphs.join(' ')
  assert.match(text, /245 000/)
  assert.match(text, /deux cent quarante-cinq mille euros/)
  assert.match(text, /maison individuelle de 88 m²/)
  assert.equal(c.quote?.paragraphs.length, 5)
  assert.deepEqual(c.quote?.paragraphs, ART_15_II_FIRST_FIVE)
  assert.equal(c.appendNotice, 'CONGE')
  assert.equal(c.recommended, true)
})

test('congé pour reprise d’un logement vide : bénéficiaire, lien, motif, notice jointe', () => {
  const c = letterContent(
    { type: 'NOTICE_TO_LEAVE', reason: 'RESUMPTION', leaseEnd: '2027-09-30', beneficiary: { name: 'Julie Dubois', link: 'fille du bailleur', address: '3 rue Haute, Lyon' }, justification: 'Elle commence ses études à Montpellier.' },
    { tenantName: 'M. Leroy', propertyAddress: '12 chemin des Vignes', kind: 'VIDE' },
  )
  const text = c.paragraphs.join(' ')
  for (const s of ['Julie Dubois', 'fille du bailleur', '3 rue Haute, Lyon', 'réel et sérieux']) assert.ok(text.includes(s), s)
  assert.equal(c.appendNotice, 'CONGE')
  assert.equal(c.quote, undefined)
})

test('congé en meublé : pas d’offre de vente au locataire, pas de notice (art. 25-8)', () => {
  const c = letterContent({ type: 'NOTICE_TO_LEAVE', reason: 'SALE', leaseEnd: '2027-09-30', priceCents: 15000000 }, { tenantName: 'M. Leroy', propertyAddress: 'Agde', kind: 'MEUBLE' })
  assert.doesNotMatch(c.paragraphs.join(' '), /offre de vente/)
  assert.equal(c.quote, undefined)
  assert.equal(c.appendNotice, undefined)
  const legit = letterContent({ type: 'NOTICE_TO_LEAVE', reason: 'LEGITIMATE', leaseEnd: '2027-09-30', justification: 'Retards de paiement répétés' }, { tenantName: 'M. Leroy', propertyAddress: 'Agde', kind: 'VIDE' })
  assert.equal(legit.appendNotice, undefined)
})

test('préavis du locataire : 3 mois en vide, 1 mois réduit ou en meublé, fin de mois (CPC art. 641)', () => {
  assert.equal(tenantNoticeMonths('VIDE', false), 3)
  assert.equal(tenantNoticeMonths('VIDE', true), 1)
  assert.equal(tenantNoticeMonths('MEUBLE', false), 1)
  assert.equal(tenantNoticeEnd('2026-03-15', 3).toISOString().slice(0, 10), '2026-06-15')
  assert.equal(tenantNoticeEnd('2027-01-31', 1).toISOString().slice(0, 10), '2027-02-28')
  assert.equal(tenantNoticeEnd('2028-01-31', 1).toISOString().slice(0, 10), '2028-02-29')
  const c = letterContent({ type: 'TENANT_NOTICE', receivedDate: '2026-10-05', reduced: true, reducedReason: 'logement situé en zone tendue' }, { tenantName: 'M. Leroy', propertyAddress: 'Montpellier', kind: 'VIDE' })
  assert.match(c.paragraphs.join(' '), /réduit à un mois \(logement situé en zone tendue\) : il prend fin le 5 novembre 2026/)
})
