import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Guidage : chaque étape de la mise en location apparaît dans « Aujourd'hui » et sur la page du logement. */
let browser
before(async () => (browser = await launch()))
after(() => browser?.close())

test('connexion : bouton vers la messagerie de l’adresse saisie', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/connexion`)
  await page.getByLabel('Email').fill(`marie.${Date.now()}@gmail.com`)
  await page.getByRole('button', { name: 'Recevoir mon lien de connexion' }).click()
  await page.getByText('Regardez vos emails.').waitFor()
  assert.match(await page.getByRole('link', { name: 'Ouvrir Gmail' }).getAttribute('href'), /^https:\/\/mail\.google\.com\//)
  await page.getByRole('link', { name: 'Orange' }).waitFor()
  await page.getByRole('link', { name: 'Outlook, Hotmail' }).waitFor()
  await shot(page, 'connexion-messageries')
  await ctx.close()
  assert.deepEqual(errors, [])
})

test('logement sans DPE : finaliser la fiche, annonce, candidatures, locataire ; puis relire et faire signer', async () => {
  const { token } = await newAccount()
  const p = await api('/properties', { method: 'POST', token, body: { label: 'T2 Lodève', address: '3 rue Neuve, 34700 Lodève', postalCode: '34700', city: 'Lodève', habitat: 'COLLECTIVE', legalRegime: 'MONO', furnished: false, constructionPeriod: '1975_1989', surface: 48, rooms: 2, heating: { mode: 'INDIVIDUAL', energy: 'ELECTRIC' }, hotWater: { mode: 'INDIVIDUAL' }, equipments: ['kitchen', 'smokeDetector'], tv: 'COLLECTIVE', internet: 'FIBER', smokeDetectors: 1 } })
  const today = await api('/today', { token })
  const steps = today.tasks.filter((t) => t.type === 'STEP' && t.propertyId === p.id)
  assert.deepEqual(steps.map((t) => t.step.key), ['PROPERTY', 'AD', 'CANDIDATES', 'TENANT'])
  assert.match(steps[0].text, /classe énergie du DPE/)

  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace`)
  await page.getByText('Compléter la fiche du logement').first().waitFor()
  await page.getByText('Publier une annonce').waitFor()
  await shot(page, 'aujourdhui-guidage')
  // Annonce écartée : elle disparaît d'« Aujourd'hui »
  await page.locator('article', { hasText: 'Publier une annonce' }).getByRole('button', { name: 'Je n’en ai pas besoin' }).click()
  await page.getByText('C’est noté.').waitFor()
  await page.getByText('Publier une annonce').waitFor({ state: 'detached' })
  // Page du logement : toutes les étapes dans l'ordre
  await page.goto(`${BASE}/espace/logements/${p.id}`)
  await page.getByText('Mise en location, étape par étape').waitFor()
  await page.getByRole('link', { name: 'Compléter la fiche' }).waitFor()
  await shot(page, 'logement-etapes')
  await ctx.close()
  assert.deepEqual(errors, [])

  // Bail prêt : relire, puis faire signer
  const { token: t2 } = await newAccount()
  const { leaseId, propertyId } = await completeLease(t2)
  const keys = async () => (await api('/today', { token: t2 })).tasks.filter((t) => t.type === 'STEP' && t.propertyId === propertyId).map((t) => t.step.key)
  assert.ok((await keys()).includes('CHECK'))
  const ctx2 = await signedInContext(browser, t2)
  const page2 = await ctx2.newPage()
  watch(page2, errors)
  await page2.goto(`${BASE}/espace/baux/${leaseId}`)
  await page2.getByRole('button', { name: 'J’ai relu, tout est juste' }).click()
  await page2.getByText('Relisez le bail avant de l’envoyer').waitFor({ state: 'detached' })
  await ctx2.close()
  const after = await keys()
  assert.ok(!after.includes('CHECK'))
  assert.ok(after.includes('SIGN'))
  assert.deepEqual(errors, [])
})

test('dossier du logement : ce qui manque, ajout du titre de propriété', async () => {
  const { token } = await newAccount()
  const { propertyId, leaseId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const before = await api(`/properties/${propertyId}/binder`, { token })
  assert.ok(before.missing > 0)
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/logements/${propertyId}?onglet=binder`)
  await page.getByText('Titre de propriété (acte notarié)').waitFor()
  await page.getByText('Règlement de copropriété').waitFor()
  await page.getByLabel('Ajouter : Titre de propriété (acte notarié)').setInputFiles(new URL('../fixtures/selfie.jpg', import.meta.url).pathname)
  await page.getByText('Document rangé dans le dossier du logement.').waitFor()
  await shot(page, 'dossier-logement')
  await ctx.close()
  const after = await api(`/properties/${propertyId}/binder`, { token })
  assert.equal(after.sections[0].items.find((x) => x.key === 'deed').state, 'OK')
  assert.equal(after.missing, before.missing - 1)
  assert.deepEqual(errors, [])
})
