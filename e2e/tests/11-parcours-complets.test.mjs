import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { BASE, api, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Parcours complets : tout ce que le bail exige est demandé dans l'ordre, une étape à la fois. */
let browser
before(async () => (browser = await launch()))
after(() => browser?.close())

const next = (page) => page.getByRole('button', { name: /^(Continuer|Enregistrer le logement)$/ }).click()

test('ajouter un logement : appartement meublé en copropriété, toutes les mentions du bail demandées', async () => {
  const { token } = await newAccount()
  const ctx = await signedInContext(browser, token, { width: 390, height: 844 })
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/logements/nouveau`)
  // Adresse
  await page.getByLabel('Adresse', { exact: true }).fill('7 rue des Remparts, 34200 Sète')
  await page.getByLabel('Bâtiment, étage, porte').fill('2e étage, porte droite')
  await next(page)
  // Type de location : on ne peut pas passer sans répondre
  await page.getByText('Un appartement').click()
  await page.getByRole('button', { name: 'Meublé', exact: true }).click()
  await page.getByLabel('Identifiant fiscal du logement').fill('341234567890')
  await page.getByRole('button', { name: 'Non', exact: true }).click()
  await shot(page, 'parcours-logement-type')
  await next(page)
  // Copropriété (proposée car en copropriété)
  await page.getByLabel('Syndic').fill('Cabinet Lagarde')
  await page.getByLabel('Numéro de lot').fill('12')
  await page.getByLabel('Quote-part des parties communes').fill('245 / 10 000es')
  await next(page)
  // Construction et pièces
  await next(page)
  await page.getByText('Indiquez la période de construction').waitFor()
  await page.getByRole('button', { name: /1975/ }).click()
  await page.getByLabel('Surface habitable').fill('31')
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByText('Composition du logement').waitFor()
  await next(page)
  // Chauffage collectif : la répartition est exigée
  await page.getByRole('button', { name: 'Collectif', exact: true }).click()
  await page.getByRole('button', { name: 'Gaz', exact: true }).click()
  await page.getByRole('button', { name: 'Collective', exact: true }).click()
  await next(page)
  await page.getByText('Chauffage collectif : indiquez comment la consommation est répartie').waitFor()
  await page.getByLabel('Comment la consommation de chauffage est-elle répartie ?').fill('Selon les tantièmes de copropriété')
  await page.getByLabel('Comment la consommation d’eau chaude est-elle répartie ?').fill('Selon un compteur individuel')
  await next(page)
  // Annexes
  await page.getByRole('button', { name: 'Cave', exact: true }).click()
  await page.getByRole('button', { name: 'Ascenseur', exact: true }).click()
  await next(page)
  // Équipements
  await page.getByRole('button', { name: 'Plaques de cuisson', exact: true }).click()
  await page.getByLabel('Détecteurs de fumée').fill('1')
  await page.getByRole('button', { name: 'Antenne collective', exact: true }).click()
  await page.getByRole('button', { name: 'Fibre raccordée', exact: true }).click()
  await next(page)
  // Mobilier (proposé car meublé)
  await page.getByText('Les meubles obligatoires').waitFor()
  await next(page)
  // Diagnostics
  await page.getByRole('button', { name: 'D', exact: true }).first().click()
  await page.getByLabel('Entre (€ par an)').fill('620')
  await page.getByLabel('Et (€ par an)').fill('880')
  await page.getByLabel('Prix de l’année').fill('2023')
  await shot(page, 'parcours-logement-diagnostics')
  await next(page)
  // Photos : facultatif
  await page.getByRole('button', { name: 'Enregistrer le logement' }).click()
  await page.waitForURL(/\/espace\/logements\/[0-9a-f-]{36}$/)
  const id = page.url().split('/').pop()
  await ctx.close()
  assert.deepEqual(errors, [])
  const p = await api(`/properties/${id}`, { token })
  assert.equal(p.file.fiscalId, '341234567890')
  assert.equal(p.file.copro.syndic, 'Cabinet Lagarde')
  assert.equal(p.file.heating.split, 'Selon les tantièmes de copropriété')
  assert.equal(p.file.diagnostics.dpe.costMax, 880)
  assert.equal(p.file.tv, 'COLLECTIVE')
  assert.ok(p.file.roomList.length >= 3)
  assert.ok((await api('/contacts', { token })).some((c) => c.kind === 'SYNDIC' && c.name === 'Cabinet Lagarde'))
})

const pdf = (name) => ({ name, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n') })

test('ajouter un locataire : ce qui manque est demandé par email, le locataire complète son dossier sans compte', async () => {
  const { token } = await newAccount()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/locataires/nouveau`)
  await page.getByRole('button', { name: 'Madame', exact: true }).click()
  await page.getByLabel('Prénom(s)').fill('Inès')
  await page.getByLabel('Nom de naissance').fill('Roche')
  await next(page)
  await next(page) // naissance : inconnue, demandée plus tard
  const email = `ines+${Date.now()}@example.fr`
  await page.getByLabel('Email').fill(email)
  await next(page)
  await page.getByRole('button', { name: 'Salarié', exact: true }).click()
  await page.getByLabel('Employeur ou activité').fill('Clinique du Parc')
  await page.getByLabel('Revenus nets par mois').fill('2100')
  await next(page)
  await page.getByRole('button', { name: 'Seule', exact: true }).click()
  await next(page)
  await page.getByText('Oui', { exact: true }).click()
  await next(page)
  // Le garant : le nom suffit pour continuer, le reste viendra du locataire
  await page.getByLabel('Prénom(s)').fill('Marc')
  await page.getByLabel('Nom', { exact: true }).fill('Roche')
  await page.getByLabel('Montant maximum garanti').fill('15000')
  await next(page)
  await next(page) // justificatifs : aucun pour l'instant
  await page.getByText('Il manque encore quelques éléments').waitFor()
  await page.getByText('Date de naissance', { exact: false }).first().waitFor()
  await shot(page, 'parcours-locataire-manque')
  await page.getByRole('button', { name: 'Demander par email' }).click()
  await page.getByText(`Demande envoyée à ${email}.`).waitFor()
  const tenantId = new URL(page.url()).searchParams.get('id')
  await ctx.close()
  assert.deepEqual(errors, [])

  // Le locataire, depuis le lien
  const { link } = await api(`/tenants/${tenantId}/missing`, { token })
  const code = link.url.split('/').pop()
  const tctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const tp = await tctx.newPage()
  const terrors = []
  watch(tp, terrors)
  await tp.goto(`${BASE}/dossier/${code}`)
  await tp.getByRole('heading', { name: 'Votre dossier de location' }).waitFor()
  const me = tp.locator('section').filter({ has: tp.getByRole('heading', { name: 'Vous', exact: true }) })
  await me.getByLabel('Date de naissance').fill('1994-02-03')
  await me.getByLabel('Lieu de naissance').fill('Montpellier')
  await me.getByLabel('Téléphone').fill('06 11 22 33 44')
  await me.getByLabel('Adresse actuelle').fill('9 rue Saint-Guilhem, 34000 Montpellier')
  await me.getByRole('button', { name: 'Enregistrer' }).click()
  await tp.getByText('Enregistré.').first().waitFor()
  await tp.getByLabel('Pièce d’identité (locataire)').setInputFiles(pdf('cni.pdf'))
  await tp.getByText('Justificatif reçu.').first().waitFor()
  await tp.getByLabel('Dernier avis d’imposition (garant)').setInputFiles(pdf('avis.pdf'))
  await tp.getByText('Justificatif reçu.').first().waitFor()
  await shot(tp, 'dossier-locataire')
  await tp.getByRole('button', { name: 'J’ai terminé' }).click()
  await tp.getByRole('heading', { name: 'Merci.' }).waitFor()
  await tctx.close()
  assert.deepEqual(terrors, [])

  const t = await api(`/tenants/${tenantId}`, { token })
  assert.equal(t.file.birthPlace, 'Montpellier')
  assert.equal(t.file.employer, 'Clinique du Parc')
  assert.equal(t.file.monthlyIncomeCents, 210000)
  assert.ok(t.file.documents.some((d) => d.category === 'identity' && d.received))
  assert.ok(t.file.guarantor.documents.some((d) => d.category === 'taxNotice' && d.received))
  assert.equal(t.file.guarantor.maxCents, 1500000)
  const after = await api(`/tenants/${tenantId}/missing`, { token })
  assert.ok(!after.missing.some((m) => m.key === 'birthDate' || m.key === 'doc.identity'))
  // Le courrier pour un locataire sans email
  const r = await fetch(`http://localhost:5000/api/tenants/${tenantId}/request.pdf`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(r.headers.get('content-type'), 'application/pdf')
})

test('créer un bail : logement complet d’abord, puis locataire complet, puis les conditions', async () => {
  const { token } = await newAccount()
  const p = await api('/properties', { method: 'POST', token, body: { address: '4 rue Neuve, 34200 Sète', habitat: 'COLLECTIVE', legalRegime: 'MONO', furnished: false } })
  const t = await api('/tenants', { method: 'POST', token, body: { civility: 'MONSIEUR', firstNames: 'Paul', lastName: 'Vidal', email: `paul+${Date.now()}@example.fr`, propertyId: p.id, guarantee: 'NONE' } })
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/baux/nouveau?logement=${p.id}`)
  await page.getByText('Le logement doit être complet avant le bail').waitFor()
  await page.getByText(/identifiant fiscal du logement/).waitFor()
  await next(page)
  await page.getByText('Complétez d’abord le logement').waitFor()
  // Le logement est complété (comme par le parcours), puis on revient au bail.
  await api(`/properties/${p.id}`, {
    method: 'PUT',
    token,
    body: {
      fiscalId: '341234567891', constructionPeriod: 'AFTER_2005', surface: 40, rooms: 2, roomList: [{ name: 'Séjour' }, { name: 'Chambre' }],
      heating: { mode: 'INDIVIDUAL', energy: 'ELECTRIC' }, hotWater: { mode: 'INDIVIDUAL' }, equipments: ['kitchen'], smokeDetectors: 1, tv: 'COLLECTIVE', internet: 'FIBER',
      diagnostics: { dpe: { class: 'C', costMin: 500, costMax: 700, costYear: 2023 }, erp: { date: '2026-09-01' }, electricity: { installOver15: false }, gas: { hasGas: false } },
    },
  })
  await page.reload()
  await page.getByText('Le logement doit être complet avant le bail').waitFor({ state: 'detached' }).catch(() => undefined)
  assert.equal(await page.getByText('Le logement doit être complet avant le bail').count(), 0)
  await next(page)
  // Locataire : sa naissance manque, on peut la lui demander
  await page.getByText('Pour le bail, il manque pour Paul Vidal').waitFor()
  await page.getByText('Le demander par email').waitFor()
  await shot(page, 'parcours-bail-locataire-incomplet')
  await next(page)
  await page.getByText('Complétez d’abord ce qui manque au locataire').waitFor()
  await api(`/tenants/${t.id}`, { method: 'PUT', token, body: { birthDate: '1990-01-15', birthPlace: 'Béziers' } })
  await page.reload()
  await next(page)
  // Conditions : le bail est créé, on arrive à « Bailio a presque tout »
  await page.getByText('Bailio a presque tout.').waitFor()
  await ctx.close()
  assert.deepEqual(errors, [])
})
