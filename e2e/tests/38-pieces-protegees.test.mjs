import assert from 'node:assert/strict'
import { test } from 'node:test'
import { API, BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/**
 * Pièces protégées contre les fausses annonces : filigrane sur chaque justificatif (l'original n'est jamais gardé),
 * pièces d'un candidat cachées au propriétaire jusqu'à ce qu'il confirme la visite, photo du logement montrée au candidat.
 */
const PHOTO = new URL('../fixtures/selfie.jpg', import.meta.url).pathname

async function upload(path, fields, file) {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.append(k, v)
  form.append(file.field ?? 'file', new Blob([file.buffer], { type: file.type }), file.name)
  const r = await fetch(`${API}${path}`, { method: 'POST', body: form })
  const j = await r.json()
  if (!r.ok) throw new Error(`${path} → ${r.status} ${j.message ?? ''}`)
  return j.data
}

test('candidat : filigrane, pièces cachées jusqu’à la visite, retrait', async () => {
  const fs = await import('node:fs')
  const jpg = fs.readFileSync(PHOTO)
  const { token } = await newAccount()
  const { propertyId } = await completeLease(token)
  // Photo du logement, reprise sur la page du candidat.
  const form = new FormData()
  form.append('files', new Blob([jpg], { type: 'image/jpeg' }), 'salon.jpg')
  const [photo] = (await (await fetch(`${API}/files`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })).json()).data
  await api(`/properties/${propertyId}`, { method: 'PUT', token, body: { photos: [photo.id] } })
  const { applyCode } = await api(`/properties/${propertyId}/apply-link`, { method: 'POST', token, body: { open: true } })
  assert.equal((await api(`/candidature/${applyCode}`)).hasPhoto, true)
  assert.equal((await fetch(`${API}/candidature/${applyCode}/photo`)).headers.get('content-type'), 'image/jpeg')

  const sent = await api(`/candidature/${applyCode}`, { method: 'POST', body: { firstNames: 'Léa', lastName: 'Martin', email: 'lea.martin@example.fr', situation: 'EMPLOYEE', monthlyIncomeCents: 240000, guarantee: 'VISALE', consent: true } })
  await upload(`/candidature/${applyCode}/document`, { candidateId: sent.candidateId, token: sent.uploadToken, category: 'identity', who: 'TENANT' }, { buffer: jpg, type: 'image/jpeg', name: 'cni.jpg' })
  // Un PDF illisible est refusé avec une explication.
  await assert.rejects(upload(`/candidature/${applyCode}/document`, { candidateId: sent.candidateId, token: sent.uploadToken, category: 'identity', who: 'TENANT' }, { buffer: Buffer.from('%PDF-1.4\n%%EOF\n'), type: 'application/pdf', name: 'abime.pdf' }), /400 Ce PDF ne peut pas être lu/)

  // Avant la visite : rien à ouvrir.
  const before = (await api(`/properties/${propertyId}/candidates`, { token })).candidates[0]
  assert.equal(before.docsLocked, true)
  assert.equal(before.documents[0].fileId, null)
  // Le propriétaire redemande la confirmation : une fois par jour au plus ; le premier lien reste valable.
  assert.equal((await api(`/candidates/${before.id}/visit-request`, { method: 'POST', token })).sent, true)
  await assert.rejects(api(`/candidates/${before.id}/visit-request`, { method: 'POST', token }), /429/)

  const browser = await launch()
  const errors = []
  const ctx = await signedInContext(browser, token)
  const owner = await ctx.newPage()
  watch(owner, errors)
  owner.setDefaultTimeout(15000)
  await owner.goto(`${BASE}/espace/logements/${propertyId}/candidats`)
  await owner.getByText(/Elles s’ouvrent dès que le candidat confirme avoir visité le logement/).waitFor()
  await owner.getByRole('link', { name: 'service de vérification des impôts' }).waitFor()
  assert.equal(await owner.getByRole('button', { name: 'Choisir ce candidat' }).count(), 0)
  await shot(owner, 'candidats-pieces-cachees')

  // Le candidat ouvre son suivi : photo du logement, conseils, confirmation de la visite.
  const visitor = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const cand = await visitor.newPage()
  watch(cand, errors)
  cand.setDefaultTimeout(15000)
  await cand.goto(`${BASE}/suivi-candidature/${sent.followToken}`)
  await cand.getByAltText(/Photo du logement/).waitFor()
  await cand.getByText('Vos pièces sont protégées').waitFor()
  await cand.getByText('J’ai visité ce logement ou rencontré son propriétaire en personne.').click()
  await cand.getByRole('button', { name: 'Confirmer la visite' }).click()
  await cand.getByText(/Visite confirmée le/).waitFor()
  await shot(cand, 'suivi-candidature-confirme')

  // Après la visite : la pièce s'ouvre, avec son filigrane (jamais l'original).
  const after = (await api(`/properties/${propertyId}/candidates`, { token })).candidates[0]
  assert.equal(after.docsLocked, false)
  assert.ok(after.documents[0].fileId)
  const file = await fetch(`${API}/files/${after.documents[0].fileId}`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(file.status, 200)
  assert.notDeepEqual(Buffer.from(await file.arrayBuffer()), jpg)
  await owner.reload()
  await owner.getByText(/Visite confirmée le/).waitFor()
  await owner.getByRole('button', { name: 'Choisir ce candidat' }).waitFor()

  // Un autre candidat retire sa candidature : effacée tout de suite, le lien ne marche plus.
  const other = await api(`/candidature/${applyCode}`, { method: 'POST', body: { firstNames: 'Paul', lastName: 'Durand', email: 'paul.durand@example.fr', situation: 'STUDENT', monthlyIncomeCents: 90000, guarantee: 'CAUTION', guarantor: { firstNames: 'Anne', lastName: 'Durand', email: 'anne@example.fr' }, consent: true } })
  await api(`/suivi-candidature/${other.followToken}`, { method: 'DELETE' })
  assert.equal((await fetch(`${API}/suivi-candidature/${other.followToken}`)).status, 404)
  assert.equal((await api(`/properties/${propertyId}/candidates`, { token })).candidates.length, 1)
  await browser.close()
  assert.deepEqual(errors, [])
})

test('locataire : photo du logement sur son dossier, pièce filigranée', async () => {
  const fs = await import('node:fs')
  const jpg = fs.readFileSync(PHOTO)
  const { token } = await newAccount()
  const { propertyId } = await completeLease(token)
  const form = new FormData()
  form.append('files', new Blob([jpg], { type: 'image/jpeg' }), 'salon.jpg')
  const [photo] = (await (await fetch(`${API}/files`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })).json()).data
  await api(`/properties/${propertyId}`, { method: 'PUT', token, body: { photos: [photo.id] } })
  const t = await api('/tenants', { method: 'POST', token, body: { propertyId, email: `dossier+${Date.now()}@example.fr`, guarantee: 'NONE' } })
  const { url } = await api(`/tenants/${t.id}/request`, { method: 'POST', token, body: { send: false } })
  const code = new URL(url).pathname.split('/').pop()
  assert.equal((await api(`/dossier/${code}`)).hasPhoto, true)
  await upload(`/dossier/${code}/document`, { category: 'identity', who: 'TENANT' }, { buffer: jpg, type: 'image/jpeg', name: 'cni.jpg' })
  const doc = (await api(`/tenants/${t.id}`, { token })).file.documents.find((d) => d.category === 'identity')
  const stored = Buffer.from(await (await fetch(`${API}/files/${doc.fileId}`, { headers: { Authorization: `Bearer ${token}` } })).arrayBuffer())
  assert.notDeepEqual(stored, jpg)
  const browser = await launch()
  const page = await browser.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/dossier/${code}`)
  await page.getByAltText(/Photo du logement/).waitFor()
  await page.getByRole('button', { name: 'Tout voir et corriger' }).click()
  await page.getByText(/Bailio y ajoute un filigrane/).waitFor()
  await shot(page, 'dossier-photo')
  await browser.close()
  assert.deepEqual(errors, [])
})

test('plusieurs fichiers par pièce (trois bulletins de salaire) et PDF piégé nettoyé', async () => {
  const fs = await import('node:fs')
  const jpg = fs.readFileSync(PHOTO)
  const { token } = await newAccount()
  const { propertyId } = await completeLease(token)
  const t = await api('/tenants', { method: 'POST', token, body: { propertyId, email: `bulletins+${Date.now()}@example.fr`, guarantee: 'NONE' } })
  const { url } = await api(`/tenants/${t.id}/request`, { method: 'POST', token, body: { send: false } })
  const code = new URL(url).pathname.split('/').pop()

  // PDF piégé : du JavaScript lancé à l'ouverture. Le fichier gardé n'en contient plus.
  const trapped = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R/OpenAction 4 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\n4 0 obj<</Type/Action/S/JavaScript/JS(app.alert(1))>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n')
  await upload(`/dossier/${code}/document`, { category: 'taxNotice', who: 'TENANT' }, { buffer: trapped, type: 'application/pdf', name: 'avis.pdf' })
  const avis = (await api(`/tenants/${t.id}`, { token })).file.documents.find((d) => d.category === 'taxNotice')
  const kept = Buffer.from(await (await fetch(`${API}/files/${avis.fileId}`, { headers: { Authorization: `Bearer ${token}` } })).arrayBuffer()).toString('latin1')
  assert.ok(kept.startsWith('%PDF'))
  assert.ok(!kept.includes('JavaScript') && !kept.includes('OpenAction'), 'JavaScript retiré')

  const browser = await launch()
  const page = await browser.newPage()
  const errors = []
  watch(page, errors)
  page.setDefaultTimeout(20000)
  await page.goto(`${BASE}/dossier/${code}`)
  await page.getByRole('button', { name: 'Tout voir et corriger' }).click()
  const input = page.getByLabel('Justificatifs de ressources (locataire)')
  // Deux bulletins d'un coup, puis le troisième : rien n'est remplacé.
  const slip = (n) => ({ name: `bulletin-${n}.jpg`, mimeType: 'image/jpeg', buffer: jpg })
  await input.setInputFiles([slip(1), slip(2)])
  await page.getByText('2 sur 3').waitFor()
  await page.getByText('Ajoutez le dernier, un par un ou tous ensemble.').waitFor()
  await page.getByLabel('Justificatifs de ressources (locataire)').setInputFiles([slip(3)])
  await page.getByText('Reçu, 3 fichiers').waitFor()
  await shot(page, 'dossier-trois-bulletins')
  // Un mauvais fichier se retire.
  await page.getByRole('button', { name: 'Retirer bulletin-2.jpg' }).click()
  await page.getByText('2 sur 3').waitFor()
  const income = (await api(`/tenants/${t.id}`, { token })).file.documents.filter((d) => d.category === 'income')
  assert.deepEqual(income.map((d) => d.label), ['bulletin-1.jpg', 'bulletin-3.jpg'])
  // Le propriétaire vérifie la pièce en une fois, avec ses deux fichiers.
  const review = await api(`/tenants/${t.id}/review`, { token })
  const item = review.find((r) => r.key === 'doc.income')
  assert.equal(item.fileIds.length, 2)
  assert.match(item.label, /2 fichiers/)
  await browser.close()
  assert.deepEqual(errors, [])
})
