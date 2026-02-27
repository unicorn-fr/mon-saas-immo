/**
 * UniversalScraper.ts — v3.0
 * Moteur universel de classification documentaire.
 * Remplace SmartDocumentScanner avec une logique OR-of-ANDs pour couvrir
 * les cas particuliers : alternance, apprentissage, Visale, titre de séjour.
 *
 * Aucune donnée ne quitte le navigateur — tout s'exécute localement.
 */

import { luhnSiret } from './validateDocumentIntegrity'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type DocFamily =
  | 'BULLETIN'
  | 'REVENUS_FISCAUX'
  | 'IDENTITE'
  | 'DOMICILE'
  | 'EMPLOI'
  | 'GARANTIE'
  | 'BANCAIRE'
  | 'LOGEMENT'
  | 'UNKNOWN'

export interface ExtractedData {
  siret?: string
  netSalary?: number
  grossSalary?: number
  salaryRatio?: number
  fiscalRef?: number
  employerName?: string
  ibanPrefix?: string
  dates?: string[]
}

export interface FraudSignal {
  type:
    | 'keyword_mismatch'
    | 'siret_invalid'
    | 'salary_ratio_anomaly'
    | 'no_2ddoc'
    | 'empty_text'
    | 'salary_inconsistency'
  severity: 'low' | 'medium' | 'high'
  message: string
}

export interface UniversalScanResult {
  /** Broad family: 'BULLETIN', 'IDENTITE', etc. */
  docFamily: DocFamily
  /** Specific slot to fill in the dossier (BULLETIN_1, CNI, …) */
  docType: string | null
  confidence: number        // 0–100
  keywords: string[]        // keywords that triggered classification
  extractedData: ExtractedData
  fraudSignals: FraudSignal[]
  rawText: string           // first 3000 chars
  hasQrCode: boolean
  ocrUsed: boolean
  scanMs: number
}

export type ScanProgress = (phase: 'pdf' | 'ocr' | 'qr' | 'done', pct: number) => void

// ─── Classification Rules (OR-of-ANDs) ────────────────────────────────────────
// For each family, `requiredSets` is an array of keyword sets.
// Classification succeeds if ANY set has ALL its keywords present in the text.
// This solves the alternance false-negative: a standard bulletin needs
// ['net à payer','cotisations'] but an apprentice bulletin may only have
// ['net à payer','apprenti'] — both are valid required sets.

interface ClassRule {
  family: DocFamily
  /** Each inner array = one required set (all must match). Outer = OR. */
  requiredSets: string[][]
  /** Bonus keywords — each adds +6 pts to confidence */
  supportive: string[]
  /** Base confidence when a requiredSet matches */
  baseScore: number
}

const RULES: ClassRule[] = [
  // ── Bulletin de salaire (toutes variantes) ──────────────────────────────────
  {
    family: 'BULLETIN',
    requiredSets: [
      ['net à payer', 'cotisations'],              // salarié standard
      ['net à payer', 'brut'],                     // bulletin simplifié
      ['net à payer', 'apprenti'],                 // apprentissage (✓ alternance fix)
      ['net à payer', 'alternance'],               // contrat alternance
      ['net à payer', 'stagiaire'],                // stage conventionné
      ['net versé', 'employeur'],                  // variante micro-entreprise
      ['gratification', 'stage', 'période'],       // gratification de stage
      ['rémunération', 'apprentissage'],           // apprenti sans "net à payer"
    ],
    supportive: [
      'employeur', 'siret', 'période', 'urssaf', 'heures', 'primes',
      'cumul annuel', 'brut imposable', 'net imposable', 'cfa',
      'bulletin de paie', 'bulletin de salaire', 'fiche de paie',
    ],
    baseScore: 70,
  },

  // ── Avis d'imposition DGFIP ──────────────────────────────────────────────────
  {
    family: 'REVENUS_FISCAUX',
    requiredSets: [
      ['revenu fiscal de référence'],
      ['avis d\'imposition', 'n° fiscal'],
      ['avis d\'imposition', 'dgfip'],
      ['impôt sur le revenu', 'revenu fiscal'],
    ],
    supportive: [
      'foyer fiscal', 'situation de famille', 'finances publiques',
      'direction générale', 'numéro fiscal', 'non-imposition',
      'avis de non-imposition', 'tresor public',
    ],
    baseScore: 75,
  },

  // ── Garantie Visale / Action Logement ────────────────────────────────────────
  {
    family: 'GARANTIE',
    requiredSets: [
      ['garantie visale'],
      ['action logement', 'visa'],
      ['n° de visa', 'locataire'],
      ['cautionnement', 'action logement'],
      ['visale', 'bailleur'],
    ],
    supportive: [
      'loyer impayé', 'dégradation', 'franchises', 'caution',
      'certifié', 'numéro de visa',
    ],
    baseScore: 80,
  },

  // ── Acte de cautionnement (garant hors Visale) ───────────────────────────────
  {
    family: 'GARANTIE',
    requiredSets: [
      ['acte de cautionnement', 'garant'],
      ['cautionnement solidaire', 'garant'],
      ['je me porte garant', 'loyer'],
    ],
    supportive: ['bailleur', 'loyer impayé', 'solidaire', 'engagement'],
    baseScore: 65,
  },

  // ── Carte Nationale d'Identité ───────────────────────────────────────────────
  {
    family: 'IDENTITE',
    requiredSets: [
      ['carte nationale d\'identité'],
      ['république française', 'nationalité française', 'carte'],
      ['cni', 'nationalité', 'date de naissance'],
    ],
    supportive: ['valable jusqu', 'lieu de naissance', 'nom', 'prénom', 'commune'],
    baseScore: 75,
  },

  // ── Passeport ────────────────────────────────────────────────────────────────
  {
    family: 'IDENTITE',
    requiredSets: [
      ['passeport', 'nationalité'],
      ['passport', 'nationality'],
      ['passeport', 'date de naissance'],
    ],
    supportive: ['mrz', 'lieu de naissance', 'autorité', 'biométrique'],
    baseScore: 70,
  },

  // ── Titre de séjour (fix: ne plus classer en CNI) ────────────────────────────
  {
    family: 'IDENTITE',
    requiredSets: [
      ['titre de séjour'],
      ['carte de résident'],
      ['préfecture', 'étranger', 'autorisation'],
      ['récépissé', 'prefecture', 'séjour'],
    ],
    supportive: ['minf', 'nationalité', 'durée de validité', 'préfet'],
    baseScore: 72,
  },

  // ── Justificatif de domicile ─────────────────────────────────────────────────
  {
    family: 'DOMICILE',
    requiredSets: [
      ['facture', 'consommation'],
      ['quittance d\'eau'],
      ['relevé de consommation'],
      ['facture', 'abonnement', 'adresse'],
      ['edf', 'facture'],
      ['taxe d\'habitation'],
      ['avis de taxe foncière'],
      ['free', 'bouygues', 'sfr', 'orange', 'facture'],
    ],
    supportive: [
      'kw', 'kwh', 'm³', 'téléphone', 'internet', 'eau', 'gaz',
      'électricité', 'compteur', 'point de livraison',
    ],
    baseScore: 60,
  },

  // ── Contrat de travail ───────────────────────────────────────────────────────
  {
    family: 'EMPLOI',
    requiredSets: [
      ['contrat de travail', 'employeur'],
      ['contrat à durée indéterminée'],
      ['contrat à durée déterminée'],
      ['cdi', 'salarié', 'rémunération'],
      ['cdd', 'salarié', 'durée'],
      ['contrat d\'apprentissage', 'employeur'],
      ['contrat de professionnalisation'],
    ],
    supportive: [
      'période d\'essai', 'durée du travail', 'convention collective',
      'lieu de travail', 'embauche', 'poste', 'temps plein', 'temps partiel',
    ],
    baseScore: 65,
  },

  // ── Attestation employeur ────────────────────────────────────────────────────
  {
    family: 'EMPLOI',
    requiredSets: [
      ['attestation', "date d'embauche", 'employeur'],
      ['attestation d\'emploi', 'salaire'],
      ['certifie que', 'salarié', 'poste'],
    ],
    supportive: ['cdi', 'cdd', 'rémunération', 'responsable'],
    baseScore: 60,
  },

  // ── Kbis / SIRET ─────────────────────────────────────────────────────────────
  {
    family: 'EMPLOI',
    requiredSets: [
      ['extrait kbis'],
      ['registre du commerce', 'siret'],
      ['registre national des entreprises'],
    ],
    supportive: ['greffe', 'siren', 'activité', 'rcs', 'immatriculée'],
    baseScore: 70,
  },

  // ── Relevé bancaire ──────────────────────────────────────────────────────────
  {
    family: 'BANCAIRE',
    requiredSets: [
      ['relevé de compte', 'solde'],
      ['extrait de compte', 'iban'],
      ['relevé bancaire', 'débit'],
      ['solde au', 'iban'],
      ['virement', 'solde', 'banque'],
    ],
    supportive: ['bic', 'crédit', 'prélèvement', 'virement', 'découvert', 'agence'],
    baseScore: 65,
  },

  // ── Quittance de loyer ───────────────────────────────────────────────────────
  {
    family: 'LOGEMENT',
    requiredSets: [
      ['quittance de loyer'],
      ['quittance', 'bailleur', 'locataire'],
      ['reçu de loyer'],
    ],
    supportive: ['charges', 'période', 'montant', 'bail'],
    baseScore: 70,
  },

  // ── Attestation de bon paiement ───────────────────────────────────────────────
  {
    family: 'LOGEMENT',
    requiredSets: [
      ['attestation', 'bonne tenue', 'loyer'],
      ['certifie que', 'loyers', 'régulièrement'],
      ['attestation de paiement', 'locataire'],
    ],
    supportive: ['propriétaire', 'bail', 'loyer', 'charges'],
    baseScore: 60,
  },

  // ── Assurance habitation ──────────────────────────────────────────────────────
  {
    family: 'LOGEMENT',
    requiredSets: [
      ['attestation d\'assurance', 'habitation'],
      ['multirisque habitation'],
      ['assurance habitation', 'locataire'],
      ['assurances', 'risques locatifs'],
    ],
    supportive: ['garantie', 'sinistre', 'contrat d\'assurance', 'prime'],
    baseScore: 65,
  },
]

// ─── DocType slot assignment (family → specific slot) ─────────────────────────

/**
 * Given a detected family and a set of already-assigned docTypes,
 * returns the next available slot (e.g., BULLETIN_1 → BULLETIN_2 → BULLETIN_3).
 */
export function assignDocTypeSlot(
  family: DocFamily,
  alreadyAssigned: Set<string>,
  keywords: string[],
): string | null {
  const lower = keywords.join(' ').toLowerCase()

  switch (family) {
    case 'BULLETIN': {
      // Distinguish dernier bulletin from M1/M2/M3 by keyword
      if (lower.includes('dernier') && !alreadyAssigned.has('DERNIER_BULLETIN'))
        return 'DERNIER_BULLETIN'
      for (const slot of ['BULLETIN_1', 'BULLETIN_2', 'BULLETIN_3', 'DERNIER_BULLETIN']) {
        if (!alreadyAssigned.has(slot)) return slot
      }
      return 'BULLETIN_1'
    }
    case 'REVENUS_FISCAUX': {
      for (const slot of ['AVIS_IMPOSITION_1', 'AVIS_IMPOSITION_2']) {
        if (!alreadyAssigned.has(slot)) return slot
      }
      return 'AVIS_IMPOSITION_1'
    }
    case 'IDENTITE': {
      if (lower.includes('passeport') || lower.includes('passport')) return 'PASSEPORT'
      if (lower.includes('titre de séjour') || lower.includes('résident') || lower.includes('prefecture'))
        return 'TITRE_SEJOUR'
      return 'CNI'
    }
    case 'DOMICILE':
      return 'JUSTIFICATIF_DOMICILE'
    case 'EMPLOI': {
      if (lower.includes('kbis') || lower.includes('registre du commerce')) return 'KBIS_SIRET'
      if (lower.includes('attestation') && lower.includes('emploi')) return 'ATTESTATION_EMPLOYEUR'
      if (lower.includes('attestation') && lower.includes('salarié')) return 'ATTESTATION_EMPLOYEUR'
      return 'CONTRAT_TRAVAIL'
    }
    case 'GARANTIE': {
      if (
        lower.includes('visale') ||
        lower.includes('action logement') ||
        lower.includes('n° de visa')
      ) return 'ATTESTATION_VISALE'
      return 'ACTE_CAUTION'
    }
    case 'BANCAIRE':
      return 'RELEVE_BANCAIRE'
    case 'LOGEMENT': {
      if (lower.includes('assurance') || lower.includes('multirisque')) return 'ASSURANCE_HABITATION'
      if (lower.includes('bonne tenue') || lower.includes('régulièrement') || lower.includes('attestation de paiement'))
        return 'ATTESTATION_PAIEMENT'
      for (const slot of ['QUITTANCE_1', 'QUITTANCE_2', 'QUITTANCE_3']) {
        if (!alreadyAssigned.has(slot)) return slot
      }
      return 'QUITTANCE_1'
    }
    default:
      return null
  }
}

// ─── PDF Text Extraction ───────────────────────────────────────────────────────

let pdfjsCache: typeof import('pdfjs-dist') | null = null

async function getPdfjs() {
  if (pdfjsCache) return pdfjsCache
  const lib = await import('pdfjs-dist')
  lib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).href
  pdfjsCache = lib
  return lib
}

async function extractPdfText(file: File): Promise<string> {
  try {
    const pdfjs = await getPdfjs()
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    let text = ''
    const maxPages = Math.min(pdf.numPages, 5)
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((it: Record<string, unknown>) => (it as { str: string }).str).join(' ') + '\n'
      if (text.length > 8000) break
    }
    return text
  } catch {
    return ''
  }
}

// ─── Image OCR ────────────────────────────────────────────────────────────────

async function extractImageText(file: File, onPct?: (n: number) => void): Promise<string> {
  try {
    const { createWorker } = await import('tesseract.js')
    const w = await createWorker('fra', 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') onPct?.(Math.round(m.progress * 100))
      },
    })
    const { data } = await w.recognize(file)
    await w.terminate()
    return data.text
  } catch {
    return ''
  }
}

// ─── QR Code / 2D-Doc Detection ────────────────────────────────────────────────

async function detectQr(file: File): Promise<boolean> {
  try {
    const { default: jsQR } = await import('jsqr')
    let imageData: ImageData | null = null
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const pdfjs = await getPdfjs()
      const ab = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: ab }).promise
      const page = await pdf.getPage(1)
      const vp = page.getViewport({ scale: 2.5 })
      const canvas = document.createElement('canvas')
      canvas.width = vp.width
      canvas.height = vp.height
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx as CanvasRenderingContext2D, viewport: vp, canvas }).promise
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    } else if (file.type.startsWith('image/')) {
      const img = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }
    return imageData ? jsQR(imageData.data, imageData.width, imageData.height) !== null : false
  } catch {
    return false
  }
}

// ─── Classification Engine ─────────────────────────────────────────────────────

function classify(text: string): {
  family: DocFamily
  score: number
  matchedKeywords: string[]
  matchedRule: ClassRule | null
} {
  const lower = text.toLowerCase()
  let bestFamily: DocFamily = 'UNKNOWN'
  let bestScore = 0
  let bestKeywords: string[] = []
  let bestRule: ClassRule | null = null

  for (const rule of RULES) {
    // Try each required set (OR logic)
    let setScore = 0
    let setKeywords: string[] = []
    let anySetMatched = false

    for (const set of rule.requiredSets) {
      const allPresent = set.every((kw) => lower.includes(kw))
      if (allPresent) {
        anySetMatched = true
        setScore = rule.baseScore
        setKeywords = [...set]
        break
      }
    }

    if (!anySetMatched) continue

    // Add supportive keyword bonus
    for (const kw of rule.supportive) {
      if (lower.includes(kw)) {
        setScore += 6
        setKeywords.push(kw)
      }
    }
    setScore = Math.min(100, setScore)

    if (setScore > bestScore) {
      bestScore = setScore
      bestFamily = rule.family
      bestKeywords = setKeywords
      bestRule = rule
    }
  }

  return { family: bestFamily, score: bestScore, matchedKeywords: bestKeywords, matchedRule: bestRule }
}

// ─── Field Extraction ─────────────────────────────────────────────────────────

function extractFields(text: string): ExtractedData {
  const lower = text.toLowerCase()
  const data: ExtractedData = {}

  // SIRET: 14 digits (with optional space separators)
  const siretM = text.match(/\b(\d{3}[\s.]?\d{3}[\s.]?\d{3}[\s.]?\d{5})\b/)
  if (siretM) data.siret = siretM[1].replace(/[\s.]/g, '')

  // Net salary
  const netM = lower.match(/net\s+[àa]\s+payer\D{0,20}(\d[\d\s]{1,8}[,.]?\d{0,2})/)
  if (netM) {
    const v = parseFloat(netM[1].replace(/\s/g, '').replace(',', '.'))
    if (v > 100 && v < 100000) data.netSalary = v
  }

  // Also handle "net versé"
  if (!data.netSalary) {
    const netV = lower.match(/net\s+vers[eé]\D{0,20}(\d[\d\s]{1,8}[,.]?\d{0,2})/)
    if (netV) {
      const v = parseFloat(netV[1].replace(/\s/g, '').replace(',', '.'))
      if (v > 100 && v < 100000) data.netSalary = v
    }
  }

  // Gross salary
  const grossM = lower.match(/salaire\s+brut\D{0,20}(\d[\d\s]{1,8}[,.]?\d{0,2})/)
  if (grossM) {
    const v = parseFloat(grossM[1].replace(/\s/g, '').replace(',', '.'))
    if (v > 100 && v < 100000) data.grossSalary = v
  }

  if (data.netSalary && data.grossSalary && data.grossSalary > 0)
    data.salaryRatio = data.netSalary / data.grossSalary

  // RFR (revenu fiscal de référence)
  const rfrM = lower.match(/revenu\s+fiscal\s+de\s+r[eé]f[eé]rence\D{0,30}(\d[\d\s]{1,9}[,.]?\d{0,2})/)
  if (rfrM) data.fiscalRef = parseFloat(rfrM[1].replace(/\s/g, '').replace(',', '.'))

  // IBAN prefix
  const ibanM = text.match(/\bFR\d{2}\s*\d{4}\s*\d{4}/)
  if (ibanM) data.ibanPrefix = ibanM[0].replace(/\s/g, '').slice(0, 12) + '…'

  // Dates
  const dates = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/g)
  if (dates) data.dates = [...new Set(dates)].slice(0, 8)

  return data
}

// ─── Fraud Signals ────────────────────────────────────────────────────────────

function buildFraudSignals(
  text: string,
  _detectedFamily: DocFamily,
  providedDocType: string,
  data: ExtractedData,
  hasQr: boolean,
): FraudSignal[] {
  const signals: FraudSignal[] = []

  if (text.trim().length < 60) {
    signals.push({
      type: 'empty_text',
      severity: 'medium',
      message: 'Le document semble être une image à faible résolution ou un PDF sans couche texte — vérification partielle uniquement.',
    })
  }

  if (data.siret && !luhnSiret(data.siret)) {
    signals.push({
      type: 'siret_invalid',
      severity: 'high',
      message: `Le numéro SIRET extrait (${data.siret}) est mathématiquement invalide — ce numéro d'entreprise n'existe pas.`,
    })
  }

  if (data.salaryRatio !== undefined) {
    const r = data.salaryRatio
    if (r < 0.65 || r > 0.95) {
      signals.push({
        type: 'salary_ratio_anomaly',
        severity: r < 0.50 || r > 1.05 ? 'high' : 'medium',
        message: `Ratio Net/Brut de ${(r * 100).toFixed(1)} % en dehors de la norme (72–82 %) — structure salariale inhabituelle.`,
      })
    }
  }

  const TAX_TYPES = new Set(['AVIS_IMPOSITION_1', 'AVIS_IMPOSITION_2'])
  if (TAX_TYPES.has(providedDocType) && !hasQr) {
    signals.push({
      type: 'no_2ddoc',
      severity: 'medium',
      message: "Aucun QR code 2D-Doc détecté. Les avis d'imposition officiels DGFIP comportent systématiquement ce code.",
    })
  }

  return signals
}

// ─── Cross-Salary Coherence Check ─────────────────────────────────────────────

/**
 * Compares Net à Payer across multiple bulletin scans.
 * Returns human-readable warning strings if inconsistencies are found.
 */
export function crossCheckSalaries(scans: UniversalScanResult[]): string[] {
  const warnings: string[] = []
  const bulletins = scans.filter((s) => s.docFamily === 'BULLETIN')

  // 1. Net salary variance
  const nets = bulletins
    .map((s) => s.extractedData.netSalary)
    .filter((v): v is number => v !== undefined && v > 0)

  if (nets.length >= 2) {
    const max = Math.max(...nets)
    const min = Math.min(...nets)
    const variance = ((max - min) / max) * 100
    if (variance > 30) {
      warnings.push(
        `Variation de ${variance.toFixed(0)} % entre vos bulletins de salaire (${min.toLocaleString('fr-FR')} € – ${max.toLocaleString('fr-FR')} €). Vérifiez la cohérence ou expliquez la différence (prime, chômage partiel…).`,
      )
    }
  }

  // 2. SIRET coherence across bulletins
  const sirets = bulletins
    .map((s) => s.extractedData.siret)
    .filter((v): v is string => !!v)
  const uniqueSirets = [...new Set(sirets)]
  if (uniqueSirets.length > 1) {
    warnings.push(
      `Incohérence SIRET entre bulletins : ${uniqueSirets.join(' / ')}. Tous les bulletins doivent provenir du même employeur.`,
    )
  }

  return warnings
}

// ─── Main Scanner ──────────────────────────────────────────────────────────────

export async function scanDocument(
  file: File,
  onProgress?: ScanProgress,
): Promise<UniversalScanResult> {
  const t0 = Date.now()
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const isImage = file.type.startsWith('image/')
  let rawText = ''
  let ocrUsed = false

  if (isPdf) {
    onProgress?.('pdf', 15)
    rawText = await extractPdfText(file)
    onProgress?.('pdf', 70)
  } else if (isImage) {
    ocrUsed = true
    rawText = await extractImageText(file, (pct) => onProgress?.('ocr', pct))
    onProgress?.('ocr', 95)
  }

  onProgress?.('qr', 5)
  const hasQrCode = await detectQr(file)
  onProgress?.('qr', 100)

  const { family, score, matchedKeywords } = classify(rawText)
  const extractedData = extractFields(rawText)

  // docType will be assigned by the caller (DossierLocatif) using assignDocTypeSlot
  // so it can take already-assigned slots into account
  const fraudSignals = buildFraudSignals(rawText, family, '', extractedData, hasQrCode)

  const highCount = fraudSignals.filter((s) => s.severity === 'high').length
  const medCount = fraudSignals.filter((s) => s.severity === 'medium').length
  const adjustedScore = Math.max(0, score - highCount * 18 - medCount * 7)

  onProgress?.('done', 100)

  return {
    docFamily: family,
    docType: null, // set by caller
    confidence: adjustedScore,
    keywords: matchedKeywords,
    extractedData,
    fraudSignals,
    rawText: rawText.slice(0, 3000),
    hasQrCode,
    ocrUsed,
    scanMs: Date.now() - t0,
  }
}

// ─── Proof-of-life ────────────────────────────────────────────────────────────

const POL_OBJECTS = [
  'une fourchette',
  'une cuillère',
  'un stylo bille',
  'un livre fermé',
  'une tasse ou mug',
  'un trousseau de clés',
  'une télécommande',
  "une bouteille d'eau",
  'un crayon de papier',
  'des ciseaux',
  'un carnet',
  'une montre',
]

export function generateProofOfLifeObject(): string {
  return POL_OBJECTS[Math.floor(Math.random() * POL_OBJECTS.length)]
}

// ─── Human-readable labels ─────────────────────────────────────────────────────

export const FAMILY_LABELS: Record<DocFamily, string> = {
  BULLETIN:       'Bulletin de Salaire',
  REVENUS_FISCAUX: "Avis d'Imposition",
  IDENTITE:       'Pièce d\'Identité',
  DOMICILE:       'Justificatif de Domicile',
  EMPLOI:         'Document Emploi',
  GARANTIE:       'Garantie / Caution',
  BANCAIRE:       'Relevé Bancaire',
  LOGEMENT:       'Document Logement',
  UNKNOWN:        'Document non reconnu',
}

export const FAMILY_COLORS: Record<DocFamily, { bg: string; text: string; border: string }> = {
  BULLETIN:        { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  REVENUS_FISCAUX: { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200' },
  IDENTITE:        { bg: 'bg-cyan-100',    text: 'text-cyan-700',    border: 'border-cyan-200' },
  DOMICILE:        { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200' },
  EMPLOI:          { bg: 'bg-violet-100',  text: 'text-violet-700',  border: 'border-violet-200' },
  GARANTIE:        { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  BANCAIRE:        { bg: 'bg-indigo-100',  text: 'text-indigo-700',  border: 'border-indigo-200' },
  LOGEMENT:        { bg: 'bg-teal-100',    text: 'text-teal-700',    border: 'border-teal-200' },
  UNKNOWN:         { bg: 'bg-slate-100',   text: 'text-slate-500',   border: 'border-slate-200' },
}
