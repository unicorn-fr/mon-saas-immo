import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, launch, watch } from '../lib.mjs'

/** Pages « solutions » : type de bail, profil de propriétaire, À propos, sans débordement à 360 px. */
test('solutions : page de bail, page profil, à propos', async () => {
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } })
  const errors = []
  watch(page, errors)
  const noOverflow = async (path) => {
    const w = await page.evaluate(() => document.documentElement.scrollWidth)
    assert.ok(w <= 360, `${path} déborde à 360 px (${w})`)
  }
  try {
    // Page de bail : titre, l'essentiel, une question ouverte, bouton vers le tunnel.
    await page.goto(`${BASE}/bail/location-vide`)
    await page.getByRole('heading', { level: 1, name: /Bail de location vide/ }).waitFor()
    assert.match(await page.title(), /Bail de location vide/)
    await page.getByRole('heading', { level: 2, name: 'L’essentiel' }).waitFor()
    await page.getByText('1 mois de loyer hors charges au plus').first().waitFor()
    await page.getByText('Quel dépôt de garantie puis-je demander ?').click()
    await page.getByText(/Si le loyer est payé par trimestre, aucun dépôt/).waitFor()
    await noOverflow('/bail/location-vide')
    await page.getByRole('link', { name: 'Créer mon bail gratuit' }).first().click()
    await page.waitForURL(/\/commencer/)

    // Garage : le bouton mène à la création de l'espace avec le garage déjà choisi.
    await page.goto(`${BASE}/bail/garage-parking`)
    await page.getByRole('heading', { level: 1, name: /garage, box ou place/i }).waitFor()
    await page.getByRole('link', { name: 'Créer mon contrat de garage' }).click()
    await page.waitForURL(/\/inscription/)

    // Page profil : prix repris de la configuration, bloc de confiance.
    await page.goto(`${BASE}/gestion-locative/lmnp`)
    await page.getByRole('heading', { level: 1, name: /loueur en meublé non professionnel/ }).waitFor()
    await page.getByRole('heading', { level: 2, name: 'Le prix' }).waitFor()
    await page.getByText(/3,49 € par logement et par mois/).first().waitFor()
    await page.getByText('Hébergé en Suisse').waitFor()
    await noOverflow('/gestion-locative/lmnp')

    // Autres pages : toutes s'affichent sans débordement.
    for (const path of ['/bail/location-meublee', '/bail/bail-etudiant', '/bail/bail-mobilite', '/bail/colocation', '/gestion-locative/particulier', '/gestion-locative/sci']) {
      await page.goto(`${BASE}${path}`)
      await page.getByRole('heading', { level: 1 }).waitFor()
      await noOverflow(path)
    }

    // Inconnu : retour à l'accueil.
    await page.goto(`${BASE}/bail/inconnu`)
    await page.waitForURL(`${BASE}/`)

    // À propos : fondateur et lien LinkedIn, question ouverte.
    await page.goto(`${BASE}/a-propos`)
    await page.getByRole('heading', { level: 1, name: 'À propos de Bailio' }).waitFor()
    await page.getByRole('link', { name: /profil LinkedIn/ }).waitFor()
    await page.getByText('Bailio encaisse-t-il mes loyers ?').click()
    await page.getByText(/Non\. Les loyers arrivent directement sur votre compte/).waitFor()
    await noOverflow('/a-propos')

    // Listes sur la page Tarifs.
    await page.goto(`${BASE}/tarifs`)
    await page.getByRole('navigation', { name: 'Par type de bail' }).getByRole('link', { name: 'Colocation' }).click()
    await page.getByRole('heading', { level: 1, name: /colocation/i }).waitFor()
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
})
