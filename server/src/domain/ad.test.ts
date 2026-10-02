import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildAd } from './ad.js'
import type { PropertyFile } from './contract.js'

const flat: PropertyFile = { habitat: 'COLLECTIVE', furnished: false, rooms: 2, surface: 42.5, city: 'Montpellier', postalCode: '34000', diagnostics: { dpe: { class: 'D', ges: 'C', costMin: 900, costMax: 1300, costYear: 2023 } } }

test('annonce : loyer charges comprises par mois, charges, dépôt, surface, DPE et dépenses d’énergie', () => {
  const ad = buildAd(flat, { rentCents: 70000, chargesCents: 5000, chargesMode: 'PROVISION', depositCents: 70000 })
  assert.equal(ad.title, 'Appartement 2 pièces 42,5 m² à Montpellier')
  assert.match(ad.text, /Loyer : 750 € par mois charges comprises, dont 50 € de charges \(provision, avec régularisation annuelle\)/)
  assert.match(ad.text, /Dépôt de garantie : 700 €/)
  assert.match(ad.text, /Classe énergie : D\. Classe climat : C\./)
  assert.match(ad.text, /entre 900 € et 1\s?300 € par an\. Prix moyens des énergies indexés au 1er janvier 2023/)
  assert.ok(ad.checks.every((c) => c.ok))
  assert.deepEqual(ad.warnings, [])
})

test('annonce : passoire énergétique, dépôt trop élevé, encadrement des loyers', () => {
  const ad = buildAd({ ...flat, diagnostics: { dpe: { class: 'F', ges: 'F' } }, market: { tense: true, refRentMaxCentsM2: 1500 } }, { rentCents: 70000, chargesCents: 0, depositCents: 140000 })
  assert.match(ad.text, /Logement à consommation énergétique excessive\./)
  assert.match(ad.text, /Loyer de référence majoré : 15 € par m²/)
  assert.ok(ad.warnings.some((w) => /un mois de loyer/.test(w)))
  assert.ok(ad.warnings.some((w) => /référence majoré/.test(w)))
  assert.equal(ad.checks.find((c) => c.label.startsWith('Dépenses'))?.ok, false)
  // Meublé : deux mois de dépôt autorisés
  assert.ok(!buildAd({ ...flat, furnished: true }, { rentCents: 70000, chargesCents: 0, depositCents: 140000 }).warnings.some((w) => /dépôt/.test(w)))
})
