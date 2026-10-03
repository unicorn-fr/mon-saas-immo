import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adPrompt, buildAd, parseAiAd } from './ad.js'
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

test('consigne pour une IA : description du bien seulement, sans adresse ni montants', () => {
  const p: PropertyFile = { ...flat, address: '12 rue des Lilas', equipments: ['kitchen', 'shower'], annexes: ['balcony'], heating: { mode: 'INDIVIDUAL', energy: 'GAS' } }
  const prompt = adPrompt(p, { rentCents: 70000, highlights: 'Très lumineux' })
  assert.match(prompt, /Appartement non meublé/)
  assert.match(prompt, /Surface habitable : 42,5 m²/)
  assert.match(prompt, /cuisine équipée, douche/)
  assert.match(prompt, /Chauffage individuel au gaz/)
  assert.match(prompt, /Points forts indiqués par le propriétaire : Très lumineux/)
  assert.match(prompt, /N’inventez rien/)
  assert.match(prompt, /la loi l’interdit/)
  assert.ok(!prompt.includes('rue des Lilas'))
  assert.ok(!prompt.includes('700'))
})

test('texte collé depuis une IA : titre séparé, mise en forme retirée', () => {
  const r = parseAiAd('**Titre : « Bel appartement lumineux »**\n\n## Description\nUn séjour **clair**.\n\n\n- Balcon')
  assert.equal(r.title, 'Bel appartement lumineux')
  assert.equal(r.description, 'Un séjour clair.\n\nBalcon')
  assert.deepEqual(parseAiAd('Juste un texte.'), { title: null, description: 'Juste un texte.' })
})

test('annonce : honoraires du mandataire au lieu de « pas de frais d’agence »', () => {
  const s = { rentCents: 70000, chargesCents: 5000, depositCents: 70000 }
  assert.match(buildAd(flat, s).text, /pas de frais d’agence/)
  const agent = buildAd(flat, s, { agent: true })
  assert.ok(!/pas de frais d’agence/.test(agent.text))
  assert.ok(agent.checks.some((c) => c.label === 'Honoraires à la charge du locataire' && !c.ok))
  assert.match(buildAd(flat, { ...s, tenantFeesCents: 45000 }, { agent: true }).text, /Honoraires à la charge du locataire : 450 € TTC/)
})
