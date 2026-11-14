import assert from 'node:assert/strict'
import { test } from 'node:test'
import { landlordFor } from '../domain/structure.js'
import { renderReceiptPdf } from './receipt.js'
import { renderLetterPdf } from './letter.js'

// Carré bleu de 4 × 4 en PNG : assez pour vérifier qu'il est intégré au document.
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEklEQVR4nGNgoBpgQGMwYlgFAAFKAAkPjnDVAAAAAElFTkSuQmCC'

test('logo : celui de la structure passe devant celui du compte, sinon celui du compte', () => {
  assert.equal(landlordFor({ lastName: 'Dupont', logo: PNG }, { kind: 'PERSON' }).logo, PNG)
  assert.equal(landlordFor({ lastName: 'Dupont', logo: PNG }, { kind: 'SCI', logo: 'data:image/png;base64,AAAA' }).logo, 'data:image/png;base64,AAAA')
})

test('logo : quittance et courrier se produisent avec et sans logo', async () => {
  const base = { kind: 'RECEIPT' as const, tenants: [{ firstNames: 'Lucas', lastName: 'Garnier' }], propertyAddress: '1 rue A, 34000 Montpellier', year: 2026, month: 11, rentCents: 50000, chargesCents: 5000, chargesLabel: 'Provision pour charges', paidCents: 55000, paidOn: new Date('2026-11-05') }
  const plain = await renderReceiptPdf({ ...base, landlord: { lastName: 'Dupont', firstNames: 'Claire' } })
  const withLogo = await renderReceiptPdf({ ...base, landlord: { lastName: 'Dupont', firstNames: 'Claire', logo: PNG } })
  assert.ok(withLogo.length > plain.length, 'le logo est intégré au PDF')
  const letter = await renderLetterPdf({ content: { subject: 'Test', paragraphs: ['Bonjour.'] }, landlord: { lastName: 'Dupont', logo: PNG }, recipient: { name: 'Lucas Garnier' } } as never)
  assert.ok(letter.subarray(0, 4).toString() === '%PDF')
})
