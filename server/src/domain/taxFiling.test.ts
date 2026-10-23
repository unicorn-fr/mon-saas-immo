import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CONTACTS, LINKS, filingGuides, personalDeadline, type FilingInput } from './taxFiling.js'
import { renderTaxFilingPdf } from '../pdf/taxFiling.js'

const base: FilingInput = { year: 2025, postalCode: '75011', vide: null, meuble: null, furnishedStart: false, occupancy: false, structures: [] }
const ids = (i: Partial<FilingInput>) => filingGuides({ ...base, ...i }).map((g) => (g.alternative ? `(${g.id})` : g.id))

test('fiche de dépôt : la bonne fiche selon le régime, l’autre en second si elle est permise', () => {
  assert.deepEqual(ids({}), [])
  assert.deepEqual(ids({ vide: { regime: 'MICRO', microAllowed: true } }), ['VIDE_MICRO', '(VIDE_REEL)'])
  assert.deepEqual(ids({ vide: { regime: 'REAL', microAllowed: true } }), ['VIDE_REEL', '(VIDE_MICRO)'])
  // Plus de 15 000 € de loyers : le réel seulement.
  assert.deepEqual(ids({ vide: { regime: 'REAL', microAllowed: false } }), ['VIDE_REEL'])
  assert.deepEqual(ids({ meuble: { regime: 'MICRO', microAllowed: true }, furnishedStart: true }), ['MEUBLE_DEBUT', 'MEUBLE_MICRO', '(MEUBLE_REEL)'])
  assert.deepEqual(ids({ occupancy: true, structures: [{ name: 'SCI Foch', kind: 'SCI_IR' }, { name: 'SAS', kind: 'IS' }, { name: 'Moi', kind: 'PERSONAL' }] }), ['SCI_IR', 'IS', 'OCCUPATION'])
})

test('fiche de dépôt : formulaires, cases et dates', () => {
  const [micro] = filingGuides({ ...base, vide: { regime: 'MICRO', microAllowed: true } })
  assert.match(micro.steps.map((s) => s.title).join(' '), /4BE/)
  // Revenus 2025 : déclaration en ligne jusqu'au 4 juin 2026 à Paris (départements 55 à 976), 21 mai dans l'Ain.
  assert.equal(micro.deadline, personalDeadline(2025, '75011'))
  assert.match(personalDeadline(2025, '75011'), /4 juin 2026/)
  assert.match(personalDeadline(2025, '01000'), /21 mai 2026/)
  // Année pas encore publiée : date indicative.
  assert.match(personalDeadline(2026, '75011'), /fin mai ou début juin 2027/)
  const [meuble] = filingGuides({ ...base, meuble: { regime: 'MICRO', microAllowed: false } })
  assert.match(meuble.steps.map((s) => `${s.title} ${s.detail}`).join(' '), /5NI/)
  const [reel] = filingGuides({ ...base, meuble: { regime: 'REAL', microAllowed: false } })
  assert.match(reel.steps.map((s) => s.detail).join(' '), /5NA.*5NY/)
  // Liasse 2031 et 2072 des revenus 2025 : 20 mai 2026 en ligne (5 mai + 15 jours).
  assert.match(reel.deadline ?? '', /20 mai 2026/)
  const [sci] = filingGuides({ ...base, structures: [{ name: 'SCI Foch', kind: 'SCI_IR' }] })
  assert.equal(sci.structure, 'SCI Foch')
  assert.match(sci.steps.map((s) => s.title).join(' '), /2072-S/)
  assert.match(sci.steps.map((s) => s.detail).join(' '), /4BA/)
  const [debut] = filingGuides({ ...base, furnishedStart: true })
  assert.match(debut.deadline ?? '', /15 jours.*31 décembre 2025/)
  assert.ok(debut.steps.some((s) => s.link?.url === LINKS.inpi.url) && debut.steps.some((s) => s.link?.url === LINKS.cfe.url))
  const [occ] = filingGuides({ ...base, occupancy: true })
  assert.match(occ.watch.join(' '), /150 €/)
})

test('fiche de dépôt : liens officiels en https, contacts sans adresse email inventée', () => {
  for (const l of Object.values(LINKS)) assert.match(l.url, /^https:\/\/(www\.impots\.gouv\.fr|procedures\.inpi\.fr)\//)
  assert.ok(CONTACTS.some((c) => c.value === '0 809 401 401'))
  assert.ok(!CONTACTS.some((c) => /@/.test(c.value)))
})

test('fiche de dépôt : le PDF se fabrique', async () => {
  const guides = filingGuides({ ...base, vide: { regime: 'REAL', microAllowed: true }, meuble: { regime: 'MICRO', microAllowed: true }, furnishedStart: true, occupancy: true, structures: [{ name: 'SCI Foch', kind: 'SCI_IR' }] })
  const pdf = await renderTaxFilingPdf({
    year: 2025,
    owner: 'Claire Martin',
    empty: { grossRentCents: 960_000, microAllowed: true, microTaxableCents: 672_000, realResultCents: 500_000, better: 'REAL' },
    furnished: { receiptsCents: 600_000, microAllowed: true, microTaxableCents: 300_000 },
    lmnp: null,
    properties: [{ name: 'Studio Foch', furnished: false, lines: [{ line: '211', label: 'Loyers bruts', cents: 960_000 }], resultCents: 500_000 }],
    structures: [{ name: 'SCI Foch', properties: ['T2 Voltaire'], sheet: { title: 'SCI à l’impôt sur le revenu', steps: [{ title: 'La SCI déclare', lines: [{ label: 'Loyers', cents: 100_000 }] }], shares: [{ name: 'Claire', pct: 50, resultCents: 40_000 }] } }],
    guides,
    contacts: CONTACTS,
  })
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF')
  assert.ok(pdf.length > 10_000)
})
