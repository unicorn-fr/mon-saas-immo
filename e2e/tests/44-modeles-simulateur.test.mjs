import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, launch, watch } from '../lib.mjs'

/** Pages publiques pour Google : modèles de lettres à copier et simulateur de révision du loyer, une question à la fois. */
test('modèles gratuits et simulateur de révision du loyer', async () => {
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  watch(page, errors)

  await page.goto(`${BASE}/modeles`)
  await page.getByRole('heading', { level: 1, name: 'Modèles de lettres gratuits' }).waitFor()
  await page.getByRole('link', { name: /Mise en demeure de payer le loyer/ }).click()
  await page.getByText('Je vous mets en demeure de régler cette somme').waitFor()
  await page.getByRole('button', { name: 'Copier la lettre' }).waitFor()
  assert.match(await page.title(), /Mise en demeure/)

  // Simulateur : DPE, loyer, trimestre, puis le résultat avec la formule.
  await page.goto(`${BASE}/simulateurs/revision-loyer`)
  await page.getByText('Question 1 sur 3').waitFor()
  await page.getByRole('button', { name: /De A à E/ }).click()
  await page.getByText('Question 2 sur 3').waitFor()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByText('Indiquez un loyer entre 10 € et 20 000 €.').waitFor()
  await page.getByLabel('Loyer hors charges, en euros par mois').fill('800')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('button', { name: '3e trimestre' }).click()
  // Dernier IRL du 3e trimestre ÷ celui de l'année d'avant (812,57 € avec l'indice publié en octobre 2026).
  await page.getByRole('heading', { name: /Nouveau loyer : \d/ }).waitFor()
  await page.getByText(/800,00\s€ × \d+(,\d+)? ÷ \d+(,\d+)? =/).waitFor()

  // Logement F ou G : révision interdite.
  await page.getByRole('button', { name: 'Faire un autre calcul' }).click()
  await page.getByRole('button', { name: 'F ou G' }).click()
  await page.getByRole('heading', { name: 'La révision est interdite' }).waitFor()
  await browser.close()
  assert.deepEqual(errors, [])
})

test('outils gratuits : date limite du congé et DPE (métropole, outre-mer)', async () => {
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/simulateurs/date-conge-bailleur`)
  await page.getByRole('button', { name: /Vide/ }).click()
  await page.getByLabel('Date de fin du bail').fill('2029-09-30')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('heading', { name: 'À recevoir au plus tard le 30 mars 2029' }).waitFor()

  await page.goto(`${BASE}/simulateurs/dpe-location`)
  await page.getByRole('button', { name: 'En France métropolitaine' }).click()
  await page.getByRole('button', { name: 'G', exact: true }).click()
  await page.getByRole('heading', { name: /Classe G : location interdite depuis le 1 janvier 2025|Classe G : location interdite depuis le 1er janvier 2025/ }).waitFor()
  await page.getByRole('button', { name: 'Faire un autre calcul' }).click()
  await page.getByRole('button', { name: /Guadeloupe/ }).click()
  await page.getByRole('button', { name: 'G', exact: true }).click()
  await page.getByRole('heading', { name: /Classe G : louable jusqu’au 31 décembre 2027/ }).waitFor()
  await browser.close()
  assert.deepEqual(errors, [])
})

test('outils gratuits : préavis du locataire, dépôt de garantie, micro-foncier ou réel', async () => {
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/simulateurs/preavis-locataire`)
  await page.getByRole('button', { name: /Vide/ }).click()
  await page.getByRole('button', { name: 'Oui, un mois' }).click()
  await page.getByLabel('Date de réception du congé').fill('2027-01-31')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('heading', { name: 'Fin du préavis : le 28 février 2027' }).waitFor()

  await page.goto(`${BASE}/simulateurs/depot-de-garantie`)
  await page.getByLabel('Date de remise des clés').fill('2030-03-15')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('button', { name: 'Non, il y a des différences' }).click()
  await page.getByLabel('Loyer hors charges, en euros par mois').fill('700')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('heading', { name: 'À rendre au plus tard le 15 mai 2030' }).waitFor()

  await page.goto(`${BASE}/simulateurs/micro-foncier-ou-reel`)
  await page.getByLabel('Loyers de l’année, en euros').fill('9600')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByLabel('Charges déductibles de l’année, en euros').fill('4500')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('heading', { name: 'Le régime réel est le plus avantageux' }).waitFor()
  await browser.close()
  assert.deepEqual(errors, [])
})

test('outils gratuits : rentabilité locative et pièce autorisée', async () => {
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/simulateurs/rentabilite-locative`)
  await page.getByText('Question 1 sur 6').waitFor()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByText('Indiquez un prix d’au moins 1 000 €.').waitFor()
  await page.getByLabel('Prix d’achat, en euros').fill('100000')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByLabel('Frais de notaire, en euros').fill('8000')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('button', { name: 'Passer' }).click() // travaux facultatifs
  await page.getByLabel('Loyer hors charges, en euros par mois').fill('500')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByLabel('Charges non récupérables par an, en euros').fill('600')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByLabel('Taxe foncière par an, en euros').fill('900')
  await page.getByRole('button', { name: 'Continuer' }).click()
  // Brut : 6 000 ÷ 100 000 = 6,00 % ; net : (6 000 − 600 − 900) ÷ 108 000 = 4,17 %.
  await page.getByRole('heading', { name: /Rendement brut 6,00 %, net de charges 4,17 %/ }).waitFor()
  await page.getByText(/Avant impôt, sans emprunt/).waitFor()

  await page.goto(`${BASE}/simulateurs/piece-autorisee`)
  await page.getByRole('button', { name: /Le locataire/ }).click()
  await page.getByRole('button', { name: 'Carte Vitale' }).click()
  await page.getByRole('heading', { name: /Interdite : carte Vitale/ }).waitFor()
  await page.getByText(/3 000 € d’amende/).waitFor()
  await page.getByRole('button', { name: 'Vérifier une autre pièce' }).click()
  await page.getByRole('button', { name: 'Sa caution' }).click()
  await page.getByRole('button', { name: /Facture d’eau/ }).click()
  await page.getByRole('heading', { name: /Autorisée : facture d’eau/ }).waitFor()
  await page.getByRole('button', { name: 'Vérifier une autre pièce' }).click()
  await page.getByRole('button', { name: /Le locataire/ }).click()
  await page.getByRole('button', { name: /Facture d’eau/ }).click()
  await page.getByRole('heading', { name: /Interdite : facture d’eau/ }).waitFor()

  // Nouveaux modèles : quittance, avis d'échéance, attestation.
  await page.goto(`${BASE}/modeles/quittance-de-loyer`)
  await page.getByText('et lui en donne quittance').waitFor()
  await page.getByRole('button', { name: 'Copier la lettre' }).waitFor()
  await page.goto(`${BASE}/modeles/avis-echeance-loyer`)
  await page.getByText('Total à payer').waitFor()
  await page.goto(`${BASE}/modeles/attestation-paiement-loyers`)
  await page.getByText('est à jour du paiement de ses loyers').waitFor()
  await browser.close()
  assert.deepEqual(errors, [])
})
