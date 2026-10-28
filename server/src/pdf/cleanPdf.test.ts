import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PDFDocument, PDFName, PDFString } from 'pdf-lib'
import { cleanPdf } from '../services/watermark.js'

/**
 * Un PDF envoyé par un tiers est redessiné page par page : le fichier gardé ne contient que des images. Ici un PDF
 * piégé (JavaScript lancé à l'ouverture, pièce jointe, lien qui lance un programme) en ressort sans rien de tout cela.
 */
test('PDF piégé : JavaScript, pièce jointe et lancement retirés, pages gardées', async () => {
  const doc = await PDFDocument.create()
  doc.addPage([595, 842]).drawText('Bulletin de salaire', { x: 50, y: 760 })
  doc.addPage([595, 842])
  await doc.attach(Buffer.from('MZ programme'), 'virus.exe', { mimeType: 'application/octet-stream' })
  const js = doc.context.obj({ Type: 'Action', S: 'JavaScript', JS: PDFString.of('app.alert("piege")') })
  doc.catalog.set(PDFName.of('OpenAction'), doc.context.register(js))
  const launch = doc.context.obj({ Type: 'Action', S: 'Launch', F: PDFString.of('cmd.exe') })
  doc.catalog.set(PDFName.of('AA'), doc.context.obj({ WC: doc.context.register(launch) }))
  const trapped = Buffer.from(await doc.save({ useObjectStreams: false }))
  assert.match(trapped.toString('latin1'), /JavaScript/)

  const clean = await cleanPdf(trapped, 'Uniquement pour louer un logement à Sète · 28/10/2026 · Bailio')
  const raw = clean.toString('latin1')
  for (const bad of ['/JavaScript', '/JS', '/OpenAction', '/Launch', '/EmbeddedFile', '/AA', 'virus.exe', '/URI', '/AcroForm']) assert.ok(!raw.includes(bad), `${bad} encore présent`)
  const out = await PDFDocument.load(clean)
  assert.equal(out.getPageCount(), 2)
  assert.equal(Math.round(out.getPage(0).getWidth()), 595)
})

test('PDF illisible ou trop long : refusé avec une explication', async () => {
  await assert.rejects(cleanPdf(Buffer.from('%PDF-1.4\n%%EOF\n')), /ne peut pas être lu/)
  const long = await PDFDocument.create()
  for (let i = 0; i < 13; i++) long.addPage([200, 200])
  await assert.rejects(cleanPdf(Buffer.from(await long.save())), /plus de 12 pages/)
})
