import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import sharp from 'sharp'
import { renderLeasePdf } from '../../pdf/lease.js'
import type { LeaseInput } from '../../domain/lease.js'
import { extractLease, toArchivedFile, type UploadedFile } from '../importLease.js'
import { ocrAvailable } from './ocr.js'

/**
 * Lecture de bout en bout : un bail est imprimé, « photographié » (page penchée, floue, sombre,
 * compressée, une page tournée d'un quart de tour), puis relu. Nécessite Tesseract (fra) et poppler-utils,
 * installés dans l'image Docker du serveur ; ignoré sur un poste où ils ne sont pas installés.
 */

const lease: LeaseInput = {
  type: 'UNFURNISHED',
  property: { address: '12 Rue de la Loge 34000 Montpellier', surface: 42.5, rooms: 2, dpeClass: 'D' },
  landlord: { firstName: 'Jean', lastName: 'Dupont', address: '8 avenue Foch 75116 Paris' },
  tenants: [{ firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@example.fr' }, { firstName: 'Paul', lastName: 'Bernard' }],
  guarantor: null,
  rent: { rentCents: 78000, chargesCents: 6000, depositCents: 78000, startDate: '2026-10-01', paymentDay: 5 },
  source: 'tunnel',
  irl: null,
}

const available = await ocrAvailable()

async function photos(): Promise<UploadedFile[]> {
  const dir = mkdtempSync(join(tmpdir(), 'bailio-test-'))
  try {
    writeFileSync(join(dir, 'bail.pdf'), await renderLeasePdf(lease))
    execFileSync('pdftoppm', ['-r', '200', '-gray', '-png', join(dir, 'bail.pdf'), join(dir, 'pg')])
    const angles = [1.8, -2.4, 90, 0.7]
    const pages = readdirSync(dir).filter((f) => f.startsWith('pg')).sort()
    return Promise.all(
      pages.map(async (f, i) => ({
        buffer: await sharp(readFileSync(join(dir, f)))
          .rotate(angles[i % angles.length], { background: '#cfc8bb' })
          .blur(0.7)
          .modulate({ brightness: 0.88 })
          .jpeg({ quality: 60 })
          .toBuffer(),
        mimetype: 'image/jpeg',
        originalname: f,
      })),
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function assertLease(x: Awaited<ReturnType<typeof extractLease>>) {
  assert.equal(x.type, 'UNFURNISHED')
  assert.deepEqual(x.landlord, { firstName: 'Jean', lastName: 'Dupont', address: '8 avenue Foch 75116 Paris' })
  assert.deepEqual(x.tenants.map((t) => `${t.firstName} ${t.lastName}`), ['Marie Martin', 'Paul Bernard'])
  assert.equal(x.tenants[0].email, 'marie.martin@example.fr')
  assert.equal(x.property.address, '12 Rue de la Loge 34000 Montpellier')
  assert.equal(x.property.surface, 42.5)
  assert.equal(x.property.rooms, 2)
  assert.equal(x.property.dpeClass, 'D')
  assert.deepEqual(x.rent, { rentEuros: 780, chargesEuros: 60, depositEuros: 780, startDate: '2026-10-01', paymentDay: 5 })
}

test('photos du bail (penchées, floues, une page tournée)', { skip: !available && 'Tesseract non installé', timeout: 300_000 }, async () => {
  assertLease(await extractLease(await photos()))
})

test('PDF scanné (images seules)', { skip: !available && 'Tesseract non installé', timeout: 300_000 }, async () => {
  const scan = await toArchivedFile(await photos())
  assertLease(await extractLease([{ buffer: scan.file, mimetype: 'application/pdf', originalname: 'scan.pdf' }]))
})

test('PDF tapé (texte)', { skip: !available && 'Outils PDF non installés', timeout: 60_000 }, async () => {
  const pdf = await renderLeasePdf(lease)
  assertLease(await extractLease([{ buffer: pdf, mimetype: 'application/pdf', originalname: 'bail.pdf' }]))
})
