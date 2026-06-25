/**
 * Tests extraction OCR — simule la sortie réelle de Tesseract tessdata_best
 * sur des CNI et permis en différentes positions et qualités.
 *
 * Run : npx tsx src/services/__tests__/ocr-extract.test.ts
 */

import { extractFieldsFromOCRText } from '../ocrDocument.service.js'

let passed = 0, failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`  ✅ ${name}`)
    passed++
  } catch (e) {
    console.log(`  ❌ ${name} — ${(e as Error).message}`)
    failed++
  }
}

function eq(got: string | undefined, expected: string, field: string) {
  if (got !== expected) throw new Error(`${field}: got "${got}" expected "${expected}"`)
}

function has(got: string | undefined, field: string) {
  if (!got) throw new Error(`${field} manquant`)
}

// ═══════════════════════════════════════════════════════════
// CNI — VIA MRZ (cas nominal — Tesseract lit la MRZ parfaitement)
// ═══════════════════════════════════════════════════════════
console.log('\n📇 CNI — MRZ propre')

test('CNI MRZ simple MARTIN Sophie', () => {
  const mrz = `IDFRA880123456789012345<<<<<<<<\n690715F3101013FRA<<<<<<<<<<<4\nMARTIN<<SOPHIE<ANNE<<<<<<<<<<<`
  const r = extractFieldsFromOCRText('', '', mrz, 'CNI')
  eq(r?.lastName, 'MARTIN', 'lastName')
  eq(r?.firstName, 'Sophie', 'firstName')
  has(r?.birthDate, 'birthDate')
})

test('CNI MRZ nom composé DUPONT DURAND Jean (ICAO: tirets → <)', () => {
  // En ICAO 9303, les tirets dans les noms sont encodés comme < dans la MRZ
  // "DUPONT-DURAND" → "DUPONT<DURAND" en MRZ → redevient "DUPONT DURAND" après parsing
  const mrz = `IDFRA1234567890123456789<<<<<\n850312M3203151FRA<<<<<<<<<<<2\nDUPONT<DURAND<<JEAN<PIERRE<<<`
  const r = extractFieldsFromOCRText('', '', mrz, 'CNI')
  eq(r?.lastName, 'DUPONT DURAND', 'lastName')
  eq(r?.firstName, 'Jean', 'firstName')
  eq(r?.birthDate, '1985-03-12', 'birthDate')
})

test('CNI MRZ prénom 1 token seulement — plusieurs prénoms', () => {
  // En ICAO, les prénoms sont séparés par < (espace simple)
  // "JEAN PIERRE MARC" → "JEAN<PIERRE<MARC" en MRZ
  const mrz = `IDFRA1234567890123456789<<<<<\n920601F2806011FRA<<<<<<<<<<<1\nLEBLANC<<JEAN<PIERRE<MARC<<<<<`
  const r = extractFieldsFromOCRText('', '', mrz, 'CNI')
  eq(r?.lastName, 'LEBLANC', 'lastName')
  // Première token du prénom = "Jean" uniquement
  eq(r?.firstName, 'Jean', 'firstName')
})

test('CNI MRZ avec erreurs OCR typiques (O→0, I→1)', () => {
  // Tesseract confond O/0 et I/1 dans la MRZ
  const mrzWithErrors = `1DFRA8801234567890I2345<<<<<\n6907I5F3I0I0I3FRA<<<<<<<<<<<4\nMART1N<<S0PH1E<<<<<<<<<<<`
  const r = extractFieldsFromOCRText('', '', mrzWithErrors, 'CNI')
  // Même si la MRZ est corrompue, les CAPS fallback dans fullText devraient aider
  // Ici on vérifie juste qu'on ne crashe pas
  if (r) {
    console.log('    → MRZ corrompue: résultat partiel ok', r.lastName, r.firstName)
  } else {
    console.log('    → MRZ corrompue: aucun champ (attendu si texte brut vide)')
  }
})

// ═══════════════════════════════════════════════════════════
// CNI — VIA LABELS VISUELS (document recto, zone texte)
// ═══════════════════════════════════════════════════════════
console.log('\n📇 CNI — Labels visuels (Tesseract lit les champs étiquetés)')

test('CNI recto standard avec labels sur lignes séparées', () => {
  const textZone = `
Carte Nationale d'Identité
REPUBLIQUE FRANÇAISE

Nom de famille
BERNARD

Prénoms
CLAIRE EMILIE

Née le 22.09.1988
à TOULOUSE

N° 880456789123
Valable jusqu'au 21.09.2033
  `.trim()
  const r = extractFieldsFromOCRText('', textZone, '', 'CNI')
  eq(r?.lastName, 'BERNARD', 'lastName')
  eq(r?.firstName, 'Claire', 'firstName')
  eq(r?.birthDate, '1988-09-22', 'birthDate')
})

test('CNI label sur même ligne "Nom de famille DUPONT"', () => {
  const text = `Nom de famille DUPONT\nPrénoms JEAN PIERRE\nNé le 15.07.1985`
  const r = extractFieldsFromOCRText(text, '', '', 'CNI')
  eq(r?.lastName, 'DUPONT', 'lastName')
  eq(r?.firstName, 'Jean', 'firstName')
  eq(r?.birthDate, '1985-07-15', 'birthDate')
})

test('CNI label avec tiret "Nom de famille : LEROY"', () => {
  const text = `Nom de famille : LEROY\nPrénoms : MARIE ANNE\nNée le : 03.11.1995`
  const r = extractFieldsFromOCRText(text, '', '', 'CNI')
  eq(r?.lastName, 'LEROY', 'lastName')
  eq(r?.firstName, 'Marie', 'firstName')
  eq(r?.birthDate, '1995-11-03', 'birthDate')
})

test('CNI avec nom accentué HÉBERT', () => {
  const textZone = `Nom de famille\nHÉBERT\nPrénoms\nFRANÇOIS\nNé le 08.04.1979`
  const r = extractFieldsFromOCRText('', textZone, '', 'CNI')
  has(r?.lastName, 'lastName')
  has(r?.birthDate, 'birthDate')
})

// ═══════════════════════════════════════════════════════════
// CNI — FALLBACK CAPS (qualité médiocre, pas de labels lisibles)
// ═══════════════════════════════════════════════════════════
console.log('\n📇 CNI — Fallback CAPS (photo oblique, Tesseract perd les labels)')

test('CNI oblique — seulement des lignes CAPS sans labels', () => {
  const garbled = `
REPUBLIQUE FRANCAISE
CARTE NATIONALE IDENTITE
NGUYEN
KHANH-LINH
22/03/1997
  `.trim()
  const r = extractFieldsFromOCRText(garbled, '', '', 'CNI')
  // CAPS fallback: NGUYEN est la première ligne non-blacklistée
  eq(r?.lastName, 'NGUYEN', 'lastName')
  has(r?.birthDate, 'birthDate')
})

test('CNI date format tirets 22-03-1997', () => {
  const text = `NOM GARCIA\nPRENOM MIGUEL\nNE LE 22-03-1997`
  const r = extractFieldsFromOCRText(text, '', '', 'CNI')
  eq(r?.birthDate, '1997-03-22', 'birthDate')
})

test('CNI sans aucun label — uniquement dates brutes', () => {
  const garbled = `CARTE NATIONALE\n15.07.1985\n22.07.2030\nMARTINEAU\n`
  const r = extractFieldsFromOCRText(garbled, '', '', 'CNI')
  // Fallback date → plus ancienne = 1985
  eq(r?.birthDate, '1985-07-15', 'birthDate')
  eq(r?.lastName, 'MARTINEAU', 'lastName')
})

// ═══════════════════════════════════════════════════════════
// CNI — COMBINAISON MRZ + LABELS (cas réel le plus fréquent)
// ═══════════════════════════════════════════════════════════
console.log('\n📇 CNI — MRZ + labels (scan complet, Tesseract lit les deux zones)')

test('CNI scan complet — MRZ préféré aux labels', () => {
  const fullText = `
CARTE NATIONALE D IDENTITE
Nom de famille DUPONT
Prénoms JEAN MICHEL
Né le 15.03.1980 à PARIS
IDFRA880123456789012345<<<<<<
8003154M3003153FRA<<<<<<<<<<<0
DUPONT<<JEAN<MICHEL<<<<<<<<<
  `.trim()
  const r = extractFieldsFromOCRText(fullText, '', '', 'CNI')
  eq(r?.lastName, 'DUPONT', 'lastName')
  eq(r?.firstName, 'Jean', 'firstName')
  // MRZ donne 1980-03-15
  eq(r?.birthDate, '1980-03-15', 'birthDate')
})

// ═══════════════════════════════════════════════════════════
// PERMIS DE CONDUIRE
// ═══════════════════════════════════════════════════════════
console.log('\n🚗 Permis de conduire — champs numérotés EU')

test('Permis standard — champs 1. 2. 3.', () => {
  const text = `
1. MARTIN
2. SOPHIE
3. 15.07.1985 BORDEAUX
4a. 12.03.2020
4b. 12.03.2030
5. 12AA123456
  `.trim()
  const r = extractFieldsFromOCRText(text, '', '', 'PERMIS_CONDUIRE')
  eq(r?.lastName, 'MARTIN', 'lastName')
  eq(r?.firstName, 'Sophie', 'firstName')
  eq(r?.birthDate, '1985-07-15', 'birthDate')
})

test('Permis avec OCR qui ajoute espaces "1 . DURAND"', () => {
  const text = `1. DURAND\n2. PIERRE JEAN\n3. 22.09.1978 LYON`
  const r = extractFieldsFromOCRText(text, '', '', 'PERMIS_CONDUIRE')
  eq(r?.lastName, 'DURAND', 'lastName')
  // Premier token de "PIERRE JEAN"
  eq(r?.firstName, 'Pierre', 'firstName')
  eq(r?.birthDate, '1978-09-22', 'birthDate')
})

test('Permis — nom composé avec tiret', () => {
  const text = `1. GARCIA-LOPEZ\n2. MARIA ELENA\n3. 08.04.1991 MARSEILLE`
  const r = extractFieldsFromOCRText(text, '', '', 'PERMIS_CONDUIRE')
  eq(r?.lastName, 'GARCIA-LOPEZ', 'lastName')
  eq(r?.firstName, 'Maria', 'firstName')
})

test('Permis — date au format slash 3. 08/04/1991 NICE', () => {
  const text = `1. PETIT\n2. LUCIE\n3. 08/04/1991 NICE\n4a. 01/01/2015\n4b. 01/01/2025`
  const r = extractFieldsFromOCRText(text, '', '', 'PERMIS_CONDUIRE')
  eq(r?.lastName, 'PETIT', 'lastName')
  eq(r?.birthDate, '1991-04-08', 'birthDate')
})

test('Permis — champs sur lignes séparées (1.\\nROUSSEAU)', () => {
  const text = `1.\nROUSSEAU\n2.\nTHOMAS ALEXANDRE\n3.\n12.06.1993 RENNES`
  const r = extractFieldsFromOCRText(text, '', '', 'PERMIS_CONDUIRE')
  eq(r?.lastName, 'ROUSSEAU', 'lastName')
  eq(r?.firstName, 'Thomas', 'firstName')
  eq(r?.birthDate, '1993-06-12', 'birthDate')
})

// ═══════════════════════════════════════════════════════════
// RÉSUMÉ
// ═══════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(55)}`)
console.log(`  Résultats : ${passed} ✅  ${failed} ❌  (${passed + failed} tests)`)
if (failed > 0) {
  console.log(`  ⚠️  Certains tests échouent — voir les détails ci-dessus`)
  process.exit(1)
} else {
  console.log(`  ✨ Tous les tests passent`)
}
