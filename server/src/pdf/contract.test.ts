import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { renderContractPdf } from './contract.js'
import { SAMPLE_CONTRACT } from './sample.js'

/** Le bail suit les rubriques du contrat type du décret n° 2015-587 (annexes 1 et 2), dans l'ordre. */
const hasPoppler = (() => {
  try {
    execFileSync('pdftotext', ['-v'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

async function text(c: typeof SAMPLE_CONTRACT): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'bail-'))
  try {
    writeFileSync(join(dir, 'b.pdf'), await renderContractPdf(c))
    execFileSync('pdftotext', ['-l', '8', join(dir, 'b.pdf'), join(dir, 'b.txt')])
    return readFileSync(join(dir, 'b.txt'), 'utf8').replace(/\s+/g, ' ')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const RUBRICS = ['I. DÉSIGNATION DES PARTIES', 'II. OBJET DU CONTRAT', 'III. DATE DE PRISE D’EFFET ET DURÉE DU CONTRAT', 'IV. CONDITIONS FINANCIÈRES', 'V. TRAVAUX', 'VI. GARANTIES', 'VII. CLAUSE DE SOLIDARITÉ', 'VIII. CLAUSE RÉSOLUTOIRE', 'IX. HONORAIRES DE LOCATION', 'X. AUTRES CONDITIONS PARTICULIÈRES', 'XI. ANNEXES']

test('bail vide : rubriques I à XI du contrat type, dans l’ordre, et mentions de 2024', { skip: !hasPoppler && 'pdftotext absent', timeout: 60_000 }, async () => {
  const c = { ...SAMPLE_CONTRACT, property: { ...SAMPLE_CONTRACT.property, diagnostics: { ...SAMPLE_CONTRACT.property.diagnostics, dpe: { class: 'D' as const, costMin: 1100, costMax: 1550, costYear: 2023 } } } }
  const t = await text(c)
  let at = -1
  for (const r of RUBRICS) {
    const i = t.indexOf(r)
    assert.ok(i > at, `rubrique manquante ou dans le désordre : ${r}`)
    at = i
  }
  assert.match(t, /A N N E X E 1 CONTRAT DE LOCATION logement nu Soumis au titre Ier de la loi/)
  assert.match(t, /G\. Dépenses énergétiques \(pour information\).*entre 1100 € et 1550 € par an.*l’année 2023/)
  assert.match(t, /à compter du 1er janvier 2025, le niveau de performance minimal du logement correspond à la classe F du DPE/)
  assert.match(t, /Identifiant fiscal du logement/)
  assert.doesNotMatch(t, /D’UNE PART|ENTRE LES SOUSSIGNÉS/)
})

test('bail meublé : annexe 2, lettres propres au meublé, inventaire', { skip: !hasPoppler && 'pdftotext absent', timeout: 60_000 }, async () => {
  const c = { ...SAMPLE_CONTRACT, property: { ...SAMPLE_CONTRACT.property, furnished: true }, terms: { ...SAMPLE_CONTRACT.terms, kind: 'MEUBLE' as const } }
  const t = await text(c)
  assert.match(t, /A N N E X E 2 CONTRAT DE LOCATION logement meublé Soumis au titre Ier bis/)
  assert.match(t, /D\. Modalités de paiement/)
  assert.match(t, /F\. Dépenses énergétiques/)
  assert.match(t, /inventaire et état détaillé du mobilier/)
  assert.match(t, /reconduit tacitement pour un an/)
})

test('clause résolutoire pour impayés et dépôt non versé toujours présente (loi n° 2023-668)', { skip: !hasPoppler && 'pdftotext absent', timeout: 60_000 }, async () => {
  const c = { ...SAMPLE_CONTRACT, terms: { ...SAMPLE_CONTRACT.terms, clauses: { resolutoire: false, custom: [] } } }
  const t = await text(c)
  assert.match(t, /VIII\. CLAUSE RÉSOLUTOIRE Le présent contrat sera résilié de plein droit : – six semaines après un commandement de payer/)
  assert.doesNotMatch(t, /à défaut de souscription d’une assurance des risques locatifs/)
})
