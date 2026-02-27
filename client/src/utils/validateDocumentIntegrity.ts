/**
 * validateDocumentIntegrity.ts
 * Client-side document anti-fraud engine.
 * Performs structural checks WITHOUT OCR — pure JS/browser APIs.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrustCheck {
  id: string
  label: string
  passed: boolean | 'na'  // 'na' = not applicable for this docType
  detail?: string
}

export interface IntegrityResult {
  trustScore: number         // 0 – 100
  level: 'green' | 'orange' | 'red'
  checks: TrustCheck[]
  flags: string[]            // human-readable warning messages
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** docTypes for which salary-specific checks are run */
const SALARY_TYPES = new Set(['BULLETIN_1', 'BULLETIN_2', 'BULLETIN_3', 'DERNIER_BULLETIN'])
/** docTypes for which tax-notice checks are run */
const TAX_TYPES = new Set(['AVIS_IMPOSITION_1', 'AVIS_IMPOSITION_2'])
/** Sensitive doc types that need extra checks */
const SENSITIVE_TYPES = new Set([...SALARY_TYPES, ...TAX_TYPES])

const SUSPICIOUS_PRODUCERS = ['photoshop', 'canva', 'ilovepdf', 'wondershare', 'pdfelement', 'inkscape edit']

const MIME_BY_EXT: Record<string, string[]> = {
  pdf:  ['application/pdf'],
  jpg:  ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png:  ['image/png'],
  webp: ['image/webp'],
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Luhn algorithm adapted for 14-digit SIRET numbers.
 * Returns true if the SIRET checksum is valid.
 */
export function luhnSiret(siret: string): boolean {
  const digits = siret.replace(/\s/g, '')
  if (!/^\d{14}$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 14; i++) {
    let n = parseInt(digits[i], 10)
    // Double odd-position digits (0-indexed, so positions 0,2,4… in normal Luhn)
    if (i % 2 === 0) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  }
  return sum % 10 === 0
}

/**
 * French NIR (Numéro de Sécurité Sociale) format validation.
 * 15-digit string: sex + year + month + dept + birth order + key
 */
export function validateNIR(nir: string): { valid: boolean; reason?: string } {
  const digits = nir.replace(/[\s\-]/g, '')
  if (digits.length !== 15) return { valid: false, reason: 'Longueur incorrecte (15 chiffres attendus)' }
  if (!/^\d+$/.test(digits)) return { valid: false, reason: 'Doit contenir uniquement des chiffres' }

  const sex = parseInt(digits[0], 10)
  if (sex !== 1 && sex !== 2) return { valid: false, reason: 'Premier chiffre doit être 1 (homme) ou 2 (femme)' }

  const month = parseInt(digits.slice(3, 5), 10)
  // Allow 01-12, and special Corse codes 62-63
  const validMonth = (month >= 1 && month <= 12) || month === 62 || month === 63
  if (!validMonth) return { valid: false, reason: 'Mois de naissance invalide (01-12 ou 62-63 Corse)' }

  // Validate NIR key: (97 - (NIR_13_digits mod 97)) === last_2_digits
  const nir13 = BigInt(digits.slice(0, 13))
  const key = parseInt(digits.slice(13, 15), 10)
  const expectedKey = Number(97n - (nir13 % 97n))
  if (key !== expectedKey) return { valid: false, reason: 'Clé de contrôle incorrecte — numéro incohérent' }

  return { valid: true }
}

/**
 * Smart filename auto-classifier.
 * Returns a docType or null if no match found.
 */
const AUTO_CLASSIFY_KEYWORDS: Array<{ docType: string; keywords: string[] }> = [
  { docType: 'BULLETIN_1',          keywords: ['salaire', 'bulletin', 'paie', 'payslip', 'paye', 'fiche'] },
  { docType: 'AVIS_IMPOSITION_1',   keywords: ['impot', 'imposition', 'avis', 'fiscal', 'dgfip', 'impôt'] },
  { docType: 'CNI',                 keywords: ['cni', 'identite', 'carte_identite', 'recto'] },
  { docType: 'PASSEPORT',           keywords: ['passeport', 'passport'] },
  { docType: 'JUSTIFICATIF_DOMICILE', keywords: ['domicile', 'edf', 'gaz', 'eau', 'electricite', 'taxe', 'justificatif'] },
  { docType: 'CONTRAT_TRAVAIL',     keywords: ['contrat', 'cdi', 'cdd', 'emploi', 'embauche'] },
  { docType: 'ATTESTATION_EMPLOYEUR', keywords: ['attestation_emploi', 'attestation_employeur', 'attestation_travail'] },
  { docType: 'KBIS_SIRET',          keywords: ['kbis', 'siret', 'entreprise', 'autoentrepreneur'] },
  { docType: 'QUITTANCE_1',         keywords: ['quittance', 'loyer', 'rent', 'quittances'] },
  { docType: 'ATTESTATION_VISALE',  keywords: ['visale', 'action_logement', 'actionlogement'] },
  { docType: 'RELEVE_BANCAIRE',     keywords: ['releve', 'bancaire', 'banque', 'compte', 'relevé'] },
]

export function autoClassifyFilename(filename: string): string | null {
  const lower = filename.toLowerCase().replace(/[\s\-\.]/g, '_')
  for (const { docType, keywords } of AUTO_CLASSIFY_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return docType
  }
  return null
}

// ─── PDF Header Check ─────────────────────────────────────────────────────────

/**
 * Reads first 4096 bytes of a file as latin1 text and searches for
 * suspicious PDF producer/creator metadata markers.
 */
async function checkPdfProducer(file: File): Promise<{ suspicious: boolean; found?: string }> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { suspicious: false }
  }
  try {
    const slice = file.slice(0, 4096)
    const buffer = await slice.arrayBuffer()
    // Read as latin1 to preserve all byte values
    const text = new TextDecoder('latin1').decode(buffer).toLowerCase()
    for (const marker of SUSPICIOUS_PRODUCERS) {
      if (text.includes(marker)) return { suspicious: true, found: marker }
    }
    return { suspicious: false }
  } catch {
    return { suspicious: false } // fail open
  }
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

/**
 * Runs all applicable integrity checks on a file.
 * Returns an IntegrityResult with a 0-100 Trust Score.
 *
 * Note: checks involving financial ratios, dates, SIRET, NIR, and
 * 2D-Doc presence are displayed as user-confirmable checklists
 * (since client-side OCR is not available). The actual validation
 * of those is done via UserConfirmChecks which the UI collects.
 */
export async function validateDocumentIntegrity(
  file: File,
  docType: string,
  userConfirms: Record<string, boolean> = {},
): Promise<IntegrityResult> {
  const checks: TrustCheck[] = []
  const flags: string[] = []

  // ── Check 1: Non-empty file ────────────────────────────────────────────────
  const nonEmpty = file.size > 0
  checks.push({
    id: 'size_nonzero',
    label: 'Fichier non vide',
    passed: nonEmpty,
    detail: nonEmpty ? `${(file.size / 1024).toFixed(0)} Ko` : 'Le fichier est vide (0 octet)',
  })
  if (!nonEmpty) flags.push('Le fichier est vide — il ne peut pas être analysé.')

  // ── Check 2: MIME ↔ extension coherence ────────────────────────────────────
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const expectedMimes = MIME_BY_EXT[ext] ?? []
  const mimeOk = expectedMimes.length === 0 || expectedMimes.includes(file.type)
  checks.push({
    id: 'mime_ext',
    label: 'Extension ↔ type MIME cohérents',
    passed: mimeOk,
    detail: mimeOk
      ? `${file.type} (${ext})`
      : `Extension ".${ext}" incompatible avec le type MIME déclaré "${file.type}"`,
  })
  if (!mimeOk) flags.push('Le type du fichier ne correspond pas à son extension — possible renommage suspect.')

  // ── Check 3: PDF producer / anti-modification ──────────────────────────────
  const { suspicious, found } = await checkPdfProducer(file)
  checks.push({
    id: 'pdf_producer',
    label: 'Aucune modification logicielle détectée',
    passed: !suspicious,
    detail: suspicious
      ? `Logiciel suspect détecté dans les métadonnées : "${found}"`
      : 'Aucun éditeur de document suspect détecté',
  })
  if (suspicious) flags.push(`Suspicion de modification numérique — métadonnées PDF mentionnent "${found}".`)

  // ── Check 4 (SENSITIVE only): Date non périmée (user-confirm) ──────────────
  if (SENSITIVE_TYPES.has(docType)) {
    const dateConfirmed = userConfirms['date_recent'] ?? false
    checks.push({
      id: 'date_recent',
      label: 'Document daté de moins de 4 mois',
      passed: dateConfirmed,
      detail: dateConfirmed
        ? 'Confirmé par le locataire'
        : 'En attente de confirmation — vérifiez la date du document',
    })
    if (!dateConfirmed) flags.push('La date du document doit être confirmée inférieure à 4 mois.')
  } else {
    checks.push({ id: 'date_recent', label: 'Date du document', passed: 'na' })
  }

  // ── Check 5 (SALARY only): Ratio Net/Brut [0.72–0.82] (user-confirm) ───────
  if (SALARY_TYPES.has(docType)) {
    const ratioOk = userConfirms['salary_ratio'] ?? false
    checks.push({
      id: 'salary_ratio',
      label: 'Ratio Net/Brut entre 72 % et 82 %',
      passed: ratioOk,
      detail: ratioOk
        ? 'Cohérence financière confirmée'
        : 'Vérifiez que Net à Payer ÷ Salaire Brut ∈ [0.72 – 0.82]',
    })
    if (!ratioOk) flags.push('Ratio Net/Brut non confirmé — vérifiez la cohérence des montants.')

    const siretInput = (userConfirms['siret_value'] as unknown as string) ?? ''
    if (siretInput) {
      const siretOk = luhnSiret(siretInput)
      checks.push({
        id: 'siret_luhn',
        label: 'SIRET employeur valide (algorithme Luhn)',
        passed: siretOk,
        detail: siretOk ? `SIRET ${siretInput} — checksum valide` : `SIRET ${siretInput} — checksum invalide (mathématiquement faux)`,
      })
      if (!siretOk) flags.push('Le SIRET de l\'employeur ne passe pas le test de Luhn — numéro inexistant.')
    } else {
      checks.push({ id: 'siret_luhn', label: 'SIRET employeur (Luhn)', passed: 'na', detail: 'Non renseigné' })
    }

    const nirInput = (userConfirms['nir_value'] as unknown as string) ?? ''
    if (nirInput) {
      const nirResult = validateNIR(nirInput)
      checks.push({
        id: 'nss_format',
        label: 'Numéro de Sécurité Sociale cohérent',
        passed: nirResult.valid,
        detail: nirResult.valid ? 'NIR valide' : nirResult.reason,
      })
      if (!nirResult.valid) flags.push(`NIR invalide : ${nirResult.reason}`)
    } else {
      checks.push({ id: 'nss_format', label: 'Numéro de Sécurité Sociale (NIR)', passed: 'na', detail: 'Non renseigné' })
    }
  } else {
    checks.push({ id: 'salary_ratio', label: 'Ratio Net/Brut', passed: 'na' })
    checks.push({ id: 'siret_luhn', label: 'SIRET employeur', passed: 'na' })
    checks.push({ id: 'nss_format', label: 'NIR', passed: 'na' })
  }

  // ── Check 6 (TAX only): Présence filigrane RF / 2D-Doc (user-confirm) ──────
  if (TAX_TYPES.has(docType)) {
    const twoDDocOk = userConfirms['2ddoc_rf'] ?? false
    checks.push({
      id: '2ddoc_prompt',
      label: 'Filigrane "RF" / 2D-Doc présent',
      passed: twoDDocOk,
      detail: twoDDocOk
        ? 'Authenticité DGFIP confirmée'
        : 'Vérifiez la présence du QR code 2D-Doc ou du filigrane "RF" sur le document',
    })
    if (!twoDDocOk) flags.push('Le filigrane "RF" (République Française) doit être visible sur l\'avis d\'imposition.')
  } else {
    checks.push({ id: '2ddoc_prompt', label: 'Filigrane RF / 2D-Doc', passed: 'na' })
  }

  // ── Score calculation ──────────────────────────────────────────────────────
  // Only count checks that are actually applicable (passed !== 'na')
  const applicable = checks.filter((c) => c.passed !== 'na')
  const passed = applicable.filter((c) => c.passed === true).length
  const trustScore = applicable.length > 0 ? Math.round((passed / applicable.length) * 100) : 100

  const level: IntegrityResult['level'] =
    trustScore >= 80 ? 'green' :
    trustScore >= 50 ? 'orange' :
    'red'

  return { trustScore, level, checks, flags }
}

// ─── Export individual utilities for testing ──────────────────────────────────

export { SALARY_TYPES, TAX_TYPES, SENSITIVE_TYPES, AUTO_CLASSIFY_KEYWORDS }
