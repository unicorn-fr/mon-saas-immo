/**
 * DocumentIntelligence.ts — v4.0
 * Moteur de classification documentaire par ancrage textuel et sémantique.
 *
 * Innovations v4.0 vs UniversalScraper v3 :
 *  - Scoring par PROXIMITÉ spatiale : les mots-clés proches les uns des autres
 *    (même page, même zone) reçoivent un score plein ; dispersés → crédit partiel.
 *  - Marqueurs de CERTITUDE à 100 % : token MRZ "<<<<<", "IDFRA", "garantie visale"
 *    → classification immédiate sans calcul de score.
 *  - Forensique METADATA PDF : lecture des 10 Ko d'en-tête du fichier pour détecter
 *    Producer/Creator suspects (Canva, Photoshop, iLovePDF…) sans serveur.
 *  - needsConfirmation : true si confiance 40–69 % → UX de confirmation.
 *  - ZERO caméra, ZERO photo, ZERO sortie navigateur.
 */

import { luhnSiret } from './validateDocumentIntegrity'

// ─── Types publics ──────────────────────────────────────────────────────────────

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
    | 'suspect_metadata'
  severity: 'low' | 'medium' | 'high'
  message: string
}

export interface PdfMetadata {
  producer?: string
  creator?: string
  isSuspect: boolean
  suspectReason?: string
}

export interface IntelligenceResult {
  docFamily: DocFamily
  /** Assigned by DossierLocatif via assignDocTypeSlot after confirmation */
  docType: string | null
  confidence: number              // 0–100
  certaintyTokenFound: string | null  // ex: "<<<<<<", "idfra"
  matchedGroups: string[]         // labels of matching anchor groups
  keywords: string[]              // all matched anchors + bonuses
  extractedData: ExtractedData
  fraudSignals: FraudSignal[]
  pdfMetadata: PdfMetadata
  rawText: string                 // first 3000 chars
  hasQrCode: boolean
  ocrUsed: boolean
  scanMs: number
  /** true when 40 ≤ confidence < 70 → ask user "is this correct?" */
  needsConfirmation: boolean
}

export type ScanProgress = (phase: 'pdf' | 'ocr' | 'qr' | 'done', pct: number) => void

// ─── Internal types ─────────────────────────────────────────────────────────────

interface AnchorGroup {
  /** Human-readable label for UI and debug */
  label: string
  /** ALL keywords must be present for the group to match */
  primary: string[]
  /** Each matched keyword adds +5 pts bonus */
  secondary: string[]
  /**
   * Maximum character distance between primary anchors.
   * 0 = no proximity check (anywhere in document is fine).
   * Typical values: 800 (same block), 2000 (same section), 4000 (same page).
   */
  proximityChars: number
  /** Base confidence when all primary anchors are present & proximate */
  baseWeight: number
}

interface DocProfile {
  family: DocFamily
  /** Anchor groups, ORed: first group to match wins */
  anchorGroups: AnchorGroup[]
  /**
   * If ANY of these tokens appear in text → confidence = 100 immediately.
   * Use only for unambiguous machine-readable markers (MRZ, certified strings).
   */
  certaintyTokens: string[]
  /** Whether SIRET Luhn check should run for this family */
  requireSiretLuhn?: boolean
  /** Whether absence of 2D-Doc QR code is a fraud signal */
  requireQrForFraud?: boolean
}

// ─── Document Profiles ──────────────────────────────────────────────────────────

const PROFILES: DocProfile[] = [
  // ── Bulletin de salaire (toutes variantes, incl. alternance) ─────────────────
  {
    family: 'BULLETIN',
    certaintyTokens: [],
    requireSiretLuhn: true,
    anchorGroups: [
      {
        label: 'Bulletin standard (cotisations)',
        primary: ['net à payer', 'cotisations'],
        secondary: ['employeur', 'siret', 'urssaf', 'brut', 'période', 'heures', 'bulletin de paie'],
        proximityChars: 4000,
        baseWeight: 78,
      },
      {
        label: 'Bulletin simplifié (brut)',
        primary: ['net à payer', 'brut'],
        secondary: ['employeur', 'siret', 'période', 'bulletin', 'fiche de paie'],
        proximityChars: 3000,
        baseWeight: 70,
      },
      {
        // ← FIX clé : alternance/apprentissage sans "cotisations"
        label: 'Bulletin apprentissage / alternance',
        primary: ['net à payer', 'apprenti'],
        secondary: ['cfa', 'apprentissage', 'contrat', 'siret', 'alternant', 'employeur'],
        proximityChars: 4000,
        baseWeight: 76,
      },
      {
        label: 'Bulletin contrat alternance (alternant)',
        primary: ['net à payer', 'alternance'],
        secondary: ['employeur', 'siret', 'alternant', 'cfa', 'brut'],
        proximityChars: 4000,
        baseWeight: 75,
      },
      {
        label: 'Bulletin stagiaire',
        primary: ['net à payer', 'stagiaire'],
        secondary: ['stage', 'gratification', 'convention', 'siret'],
        proximityChars: 3000,
        baseWeight: 68,
      },
      {
        label: 'Gratification de stage conventionné',
        primary: ['gratification', 'stage'],
        secondary: ['période', 'convention', 'net', 'mensuel'],
        proximityChars: 2000,
        baseWeight: 65,
      },
      {
        label: 'Rémunération apprentissage (sans net)',
        primary: ['rémunération', 'apprentissage'],
        secondary: ['cfa', 'employeur', 'contrat', 'siret', 'alternant'],
        proximityChars: 3000,
        baseWeight: 65,
      },
      {
        label: 'Net versé (micro-entreprise)',
        primary: ['net versé', 'employeur'],
        secondary: ['siret', 'bulletin', 'salarié', 'brut'],
        proximityChars: 3000,
        baseWeight: 64,
      },
    ],
  },

  // ── Avis d'imposition DGFIP ───────────────────────────────────────────────────
  {
    family: 'REVENUS_FISCAUX',
    certaintyTokens: ['dgfip.fr'],
    requireQrForFraud: true,
    anchorGroups: [
      {
        label: 'Avis imposition — RFR + N° fiscal',
        primary: ['revenu fiscal de référence', 'n° fiscal'],
        secondary: ['foyer fiscal', 'imposition', 'situation', 'finances publiques', 'direction générale'],
        proximityChars: 5000,
        baseWeight: 82,
      },
      {
        label: "Avis d'imposition DGFIP",
        primary: ["avis d'imposition", 'dgfip'],
        secondary: ['impôt sur le revenu', 'revenu fiscal', 'foyer', 'finances publiques'],
        proximityChars: 4000,
        baseWeight: 78,
      },
      {
        label: "Avis d'imposition + N° fiscal",
        primary: ["avis d'imposition", 'n° fiscal'],
        secondary: ['revenu fiscal', 'finances publiques', 'situation'],
        proximityChars: 4000,
        baseWeight: 74,
      },
      {
        label: 'Avis de non-imposition',
        primary: ['avis de non-imposition'],
        secondary: ['revenu fiscal', 'n° fiscal', 'foyer', 'finances publiques'],
        proximityChars: 0,
        baseWeight: 80,
      },
    ],
  },

  // ── Garantie Visale / Action Logement ─────────────────────────────────────────
  {
    family: 'GARANTIE',
    // "garantie visale" = marqueur de certitude absolu
    certaintyTokens: ['garantie visale'],
    anchorGroups: [
      {
        label: 'Garantie Visale + Action Logement',
        primary: ['garantie visale', 'action logement'],
        secondary: ['bailleur', 'loyer', 'visa', 'certifié', 'cautionnement'],
        proximityChars: 3000,
        baseWeight: 92,
      },
      {
        label: "Visale — N° de visa + locataire",
        primary: ['n° de visa', 'locataire'],
        secondary: ['action logement', 'cautionnement', 'franchises', 'dégradation'],
        proximityChars: 3000,
        baseWeight: 86,
      },
      {
        label: 'Cautionnement Action Logement',
        primary: ['cautionnement', 'action logement'],
        secondary: ['bailleur', 'visa', 'dégradation', 'loyer impayé'],
        proximityChars: 2000,
        baseWeight: 82,
      },
      {
        label: 'Acte de cautionnement solidaire',
        primary: ['cautionnement solidaire', 'garant'],
        secondary: ['bailleur', 'loyer impayé', 'solidaire', 'engagement', 'locataire'],
        proximityChars: 3000,
        baseWeight: 66,
      },
      {
        label: 'Attestation de garant personnel',
        primary: ['je me porte garant', 'loyer'],
        secondary: ['locataire', 'bailleur', 'solidaire', 'engagement'],
        proximityChars: 2000,
        baseWeight: 62,
      },
    ],
  },

  // ── Carte Nationale d'Identité ────────────────────────────────────────────────
  {
    family: 'IDENTITE',
    // MRZ zone de la CNI française — marqueur machine à 100%
    certaintyTokens: ['<<<<<<<<<<<<<<<', 'idfra', 'idfrax', 'idfrx'],
    anchorGroups: [
      {
        label: "CNI — Carte Nationale d'Identité",
        primary: ["carte nationale d'identité", 'nationalité'],
        secondary: ['valable jusqu', 'commune', 'lieu de naissance', 'nom', 'prénom', 'sexe'],
        proximityChars: 1500,
        baseWeight: 82,
      },
      {
        label: 'CNI — marqueurs standards',
        primary: ['république française', 'carte'],
        secondary: ['nationalité française', 'sexe', 'taille', 'lieu de naissance', 'prénom'],
        proximityChars: 1000,
        baseWeight: 72,
      },
      {
        label: 'CNI — nouvelle génération (sexe+carte)',
        primary: ['carte nationale', 'sexe'],
        secondary: ['prénom', 'né', 'taille', 'nationalité', 'nom'],
        proximityChars: 1000,
        baseWeight: 68,
      },
    ],
  },

  // ── Passeport ─────────────────────────────────────────────────────────────────
  {
    family: 'IDENTITE',
    // MRZ zone du passeport français
    certaintyTokens: ['p<fra', 'p<<fra'],
    anchorGroups: [
      {
        label: 'Passeport français',
        primary: ['passeport', 'nationalité'],
        secondary: ['lieu de naissance', 'autorité', 'biométrique', 'date de naissance', 'prénom'],
        proximityChars: 1500,
        baseWeight: 76,
      },
      {
        label: 'Passeport (anglais/bilingue)',
        primary: ['passport', 'nationality'],
        secondary: ['birth', 'authority', 'biometric', 'given names'],
        proximityChars: 1500,
        baseWeight: 72,
      },
      {
        label: 'Passeport — date naissance',
        primary: ['passeport', 'date de naissance'],
        secondary: ['biométrique', 'autorité', 'lieu de naissance'],
        proximityChars: 1200,
        baseWeight: 70,
      },
    ],
  },

  // ── Titre de séjour (distinct de CNI) ────────────────────────────────────────
  {
    family: 'IDENTITE',
    certaintyTokens: ['titre de séjour', 'carte de résident'],
    anchorGroups: [
      {
        label: 'Titre de séjour',
        primary: ['titre de séjour'],
        secondary: ['préfecture', 'étranger', 'nationalité', 'durée', 'préfet', 'validité'],
        proximityChars: 0,
        baseWeight: 82,
      },
      {
        label: 'Carte de résident',
        primary: ['carte de résident'],
        secondary: ['préfecture', 'étranger', 'nationalité', 'durée'],
        proximityChars: 0,
        baseWeight: 82,
      },
      {
        label: 'Récépissé de séjour',
        primary: ['récépissé', 'séjour'],
        secondary: ['préfecture', 'autorisation', 'étrangers', 'durée'],
        proximityChars: 1500,
        baseWeight: 72,
      },
    ],
  },

  // ── Justificatif de domicile ───────────────────────────────────────────────────
  {
    family: 'DOMICILE',
    certaintyTokens: [],
    anchorGroups: [
      {
        label: 'Facture énergie (EDF, gaz, eau)',
        primary: ['facture', 'consommation'],
        secondary: ['kwh', 'kw', 'm³', 'électricité', 'gaz', 'eau', 'compteur', 'point de livraison'],
        proximityChars: 2000,
        baseWeight: 66,
      },
      {
        label: 'Facture opérateur télécom',
        primary: ['facture', 'abonnement'],
        secondary: ['téléphone', 'internet', 'free', 'sfr', 'orange', 'bouygues', 'adresse', 'numéro de ligne'],
        proximityChars: 2000,
        baseWeight: 62,
      },
      {
        label: "Taxe d'habitation",
        primary: ["taxe d'habitation"],
        secondary: ['impôt', 'commune', 'période', 'local'],
        proximityChars: 0,
        baseWeight: 70,
      },
      {
        label: 'Taxe foncière',
        primary: ['avis de taxe foncière'],
        secondary: ['impôt', 'commune', 'cadastre'],
        proximityChars: 0,
        baseWeight: 70,
      },
      {
        label: "Quittance d'eau",
        primary: ["quittance d'eau"],
        secondary: ['consommation', 'm³', 'relevé'],
        proximityChars: 0,
        baseWeight: 72,
      },
    ],
  },

  // ── Contrat de travail ────────────────────────────────────────────────────────
  {
    family: 'EMPLOI',
    certaintyTokens: [],
    anchorGroups: [
      {
        label: 'CDI (Contrat à Durée Indéterminée)',
        primary: ['contrat à durée indéterminée'],
        secondary: ['employeur', 'salarié', 'rémunération', "période d'essai", 'temps plein', 'temps partiel'],
        proximityChars: 0,
        baseWeight: 74,
      },
      {
        label: 'CDD (Contrat à Durée Déterminée)',
        primary: ['contrat à durée déterminée'],
        secondary: ['employeur', 'salarié', 'durée', 'terme', 'renouvellement', 'motif'],
        proximityChars: 0,
        baseWeight: 74,
      },
      {
        label: 'CDI — mentions courtes',
        primary: ['cdi', 'salarié', 'rémunération'],
        secondary: ['employeur', 'poste', 'lieu', 'convention collective', 'temps'],
        proximityChars: 2000,
        baseWeight: 68,
      },
      {
        label: 'CDD — mentions courtes',
        primary: ['cdd', 'salarié', 'durée'],
        secondary: ['employeur', 'terme', 'motif', 'renouvellement'],
        proximityChars: 2000,
        baseWeight: 68,
      },
      {
        label: "Contrat d'apprentissage",
        primary: ["contrat d'apprentissage", 'employeur'],
        secondary: ['cfa', 'apprenti', 'alternant', 'rémunération', 'formation'],
        proximityChars: 3000,
        baseWeight: 72,
      },
      {
        label: 'Contrat de professionnalisation',
        primary: ['contrat de professionnalisation'],
        secondary: ['employeur', 'salarié', 'rémunération', 'alternance', 'formation'],
        proximityChars: 0,
        baseWeight: 72,
      },
    ],
  },

  // ── Attestation employeur ──────────────────────────────────────────────────────
  {
    family: 'EMPLOI',
    certaintyTokens: [],
    anchorGroups: [
      {
        label: "Attestation d'emploi formelle",
        primary: ["date d'embauche", 'employeur'],
        secondary: ['cdi', 'cdd', 'rémunération', 'salarié', 'poste', 'attestation'],
        proximityChars: 3000,
        baseWeight: 66,
      },
      {
        label: 'Attestation certifiant emploi',
        primary: ['certifie que', 'salarié', 'poste'],
        secondary: ['employeur', 'cdi', 'rémunération', 'responsable'],
        proximityChars: 2000,
        baseWeight: 62,
      },
    ],
  },

  // ── Kbis / Extrait SIRET ───────────────────────────────────────────────────────
  {
    family: 'EMPLOI',
    certaintyTokens: ['extrait kbis'],
    anchorGroups: [
      {
        label: 'Extrait Kbis',
        primary: ['extrait kbis'],
        secondary: ['greffe', 'siren', 'activité', 'rcs', 'immatriculée', 'siret'],
        proximityChars: 0,
        baseWeight: 78,
      },
      {
        label: 'Registre national des entreprises',
        primary: ['registre du commerce', 'siret'],
        secondary: ['greffe', 'activité', 'rcs', 'siren'],
        proximityChars: 4000,
        baseWeight: 72,
      },
    ],
  },

  // ── Relevé bancaire ───────────────────────────────────────────────────────────
  {
    family: 'BANCAIRE',
    certaintyTokens: [],
    anchorGroups: [
      {
        label: 'Relevé de compte',
        primary: ['relevé de compte', 'solde'],
        secondary: ['bic', 'iban', 'crédit', 'débit', 'virement', 'prélèvement', 'agence'],
        proximityChars: 5000,
        baseWeight: 74,
      },
      {
        label: 'Extrait de compte IBAN',
        primary: ['extrait de compte', 'iban'],
        secondary: ['solde', 'débit', 'crédit', 'banque', 'bic'],
        proximityChars: 4000,
        baseWeight: 70,
      },
      {
        label: 'Relevé bancaire débit/crédit',
        primary: ['relevé bancaire', 'débit'],
        secondary: ['solde', 'iban', 'bic', 'virement'],
        proximityChars: 3000,
        baseWeight: 68,
      },
      {
        label: 'Solde + IBAN',
        primary: ['solde au', 'iban'],
        secondary: ['débit', 'crédit', 'agence', 'bic'],
        proximityChars: 3000,
        baseWeight: 66,
      },
    ],
  },

  // ── Quittance de loyer ────────────────────────────────────────────────────────
  {
    family: 'LOGEMENT',
    certaintyTokens: ['quittance de loyer'],
    anchorGroups: [
      {
        label: 'Quittance de loyer',
        primary: ['quittance de loyer'],
        secondary: ['bailleur', 'locataire', 'charges', 'période', 'montant'],
        proximityChars: 0,
        baseWeight: 82,
      },
      {
        label: 'Quittance bailleur–locataire',
        primary: ['quittance', 'bailleur', 'locataire'],
        secondary: ['loyer', 'charges', 'période', 'montant', 'bail'],
        proximityChars: 2000,
        baseWeight: 74,
      },
      {
        label: 'Reçu de loyer',
        primary: ['reçu de loyer'],
        secondary: ['bailleur', 'locataire', 'montant', 'charges'],
        proximityChars: 0,
        baseWeight: 72,
      },
    ],
  },

  // ── Assurance habitation ───────────────────────────────────────────────────────
  {
    family: 'LOGEMENT',
    certaintyTokens: [],
    anchorGroups: [
      {
        label: "Attestation d'assurance habitation",
        primary: ["attestation d'assurance", 'habitation'],
        secondary: ['garantie', 'sinistre', 'locataire', 'prime', 'contrat'],
        proximityChars: 2000,
        baseWeight: 74,
      },
      {
        label: 'Multirisque habitation',
        primary: ['multirisque habitation'],
        secondary: ['assurance', 'garantie', 'sinistre', 'prime'],
        proximityChars: 0,
        baseWeight: 72,
      },
      {
        label: 'Risques locatifs',
        primary: ['assurances', 'risques locatifs'],
        secondary: ['habitation', 'garantie', 'locataire', 'sinistre'],
        proximityChars: 1500,
        baseWeight: 70,
      },
    ],
  },

  // ── Attestation de bon paiement ────────────────────────────────────────────────
  {
    family: 'LOGEMENT',
    certaintyTokens: [],
    anchorGroups: [
      {
        label: 'Attestation bonne tenue des loyers',
        primary: ['bonne tenue', 'loyer'],
        secondary: ['propriétaire', 'bail', 'locataire', 'régulièrement', 'charges'],
        proximityChars: 2000,
        baseWeight: 70,
      },
      {
        label: 'Attestation de paiement locataire',
        primary: ['attestation de paiement', 'locataire'],
        secondary: ['loyer', 'bail', 'propriétaire', 'charges'],
        proximityChars: 2000,
        baseWeight: 70,
      },
    ],
  },
]

// ─── PDF Metadata Forensics ─────────────────────────────────────────────────────

const SUSPECT_PRODUCERS = [
  'canva',
  'photoshop',
  'illustrator',
  'ilovepdf',
  'wondershare',
  'sejda',
  'smallpdf',
  'snagit',
  'paint.net',
  'pdfzorro',
  'pdfescape',
  'pdf24',
  'web2pdf',
]

async function analyzePdfMetadata(file: File): Promise<PdfMetadata> {
  if (!file.name.toLowerCase().endsWith('.pdf') && !file.type.includes('pdf')) {
    return { isSuspect: false }
  }
  try {
    const chunk = await file.slice(0, 10240).arrayBuffer()
    const text = new TextDecoder('latin1').decode(chunk)

    const producerM = text.match(/\/Producer\s*\(([^)]{1,250})\)/)
    const creatorM  = text.match(/\/Creator\s*\(([^)]{1,250})\)/)
    const producer = producerM?.[1]?.trim()
    const creator  = creatorM?.[1]?.trim()
    const combined = `${producer ?? ''} ${creator ?? ''}`.toLowerCase()

    for (const tool of SUSPECT_PRODUCERS) {
      if (combined.includes(tool)) {
        return {
          producer,
          creator,
          isSuspect: true,
          suspectReason: `Document produit ou modifié via "${tool}" — outil graphique non attendu pour un document officiel.`,
        }
      }
    }
    return { producer, creator, isSuspect: false }
  } catch {
    return { isSuspect: false }
  }
}

// ─── Proximity Scoring ──────────────────────────────────────────────────────────

/**
 * Scores an AnchorGroup against the document text.
 *
 * Algorithm:
 *  1. Build a position list for each primary anchor (all occurrences in text).
 *  2. If any anchor is absent → score 0.
 *  3. If proximityChars = 0 → all-present is sufficient (baseWeight).
 *  4. Otherwise: iterate combinations of positions (one per anchor) to find
 *     one where max_position − min_position ≤ proximityChars.
 *     • Proximate match  → baseWeight (full score).
 *     • Non-proximate    → 60% of baseWeight (partial credit).
 *  5. Each matching secondary keyword adds +5 pts (capped at 100).
 */
function scoreGroup(text: string, group: AnchorGroup): { score: number; found: string[] } {
  const lower = text.toLowerCase()

  // Collect positions for each primary anchor
  const positionLists: number[][] = []
  for (const anchor of group.primary) {
    const positions: number[] = []
    let idx = lower.indexOf(anchor)
    while (idx !== -1) {
      positions.push(idx)
      idx = lower.indexOf(anchor, idx + anchor.length)
    }
    if (positions.length === 0) return { score: 0, found: [] }
    positionLists.push(positions)
  }

  let proximate = false
  if (group.proximityChars === 0) {
    proximate = true
  } else {
    // Recursive combination check — fast in practice (k^n where k≤5, n≤3)
    const check = (i: number, lo: number, hi: number): boolean => {
      if (i === positionLists.length) return hi - lo <= group.proximityChars
      for (const p of positionLists[i]) {
        if (check(i + 1, Math.min(lo, p), Math.max(hi, p))) return true
      }
      return false
    }
    proximate = check(0, Infinity, -Infinity)
  }

  const base = proximate ? group.baseWeight : Math.round(group.baseWeight * 0.6)
  const found = [...group.primary]
  let bonus = 0
  for (const kw of group.secondary) {
    if (lower.includes(kw)) {
      bonus += 5
      found.push(kw)
    }
  }
  return { score: Math.min(100, base + bonus), found }
}

// ─── Certainty Token Check ──────────────────────────────────────────────────────

function checkCertaintyTokens(text: string, tokens: string[]): string | null {
  const lower = text.toLowerCase()
  for (const token of tokens) {
    if (lower.includes(token)) return token
  }
  return null
}

// ─── Classification ─────────────────────────────────────────────────────────────

function classifyDocument(text: string): {
  family: DocFamily
  score: number
  certaintyToken: string | null
  matchedGroups: string[]
  keywords: string[]
} {
  let bestFamily: DocFamily = 'UNKNOWN'
  let bestScore = 0
  let bestGroups: string[] = []
  let bestKeywords: string[] = []
  let certaintyToken: string | null = null

  for (const profile of PROFILES) {
    // Priority 1: certainty token → instant 100%
    const ct = checkCertaintyTokens(text, profile.certaintyTokens)
    if (ct) {
      certaintyToken = ct
      bestFamily = profile.family
      bestScore = 100
      bestGroups = ['Marqueur de certitude']
      bestKeywords = [ct]
      break
    }

    // Priority 2: anchor group scoring (OR: best group wins across all profiles)
    for (const group of profile.anchorGroups) {
      const { score, found } = scoreGroup(text, group)
      if (score > bestScore) {
        bestScore = score
        bestFamily = profile.family
        bestGroups = [group.label]
        bestKeywords = found
      }
    }
  }

  return {
    family: bestFamily,
    score: bestScore,
    certaintyToken,
    matchedGroups: bestGroups,
    keywords: bestKeywords,
  }
}

// ─── Field Extraction ────────────────────────────────────────────────────────────

function extractFields(text: string): ExtractedData {
  const lower = text.toLowerCase()
  const data: ExtractedData = {}

  // SIRET: 14 digits
  const siretM = text.match(/\b(\d{3}[\s.]?\d{3}[\s.]?\d{3}[\s.]?\d{5})\b/)
  if (siretM) data.siret = siretM[1].replace(/[\s.]/g, '')

  // Net à payer
  const netM = lower.match(/net\s+[àa]\s+payer\D{0,20}(\d[\d\s]{1,8}[,.]?\d{0,2})/)
  if (netM) {
    const v = parseFloat(netM[1].replace(/\s/g, '').replace(',', '.'))
    if (v > 100 && v < 100000) data.netSalary = v
  }
  // Net versé (fallback)
  if (!data.netSalary) {
    const netV = lower.match(/net\s+vers[eé]\D{0,20}(\d[\d\s]{1,8}[,.]?\d{0,2})/)
    if (netV) {
      const v = parseFloat(netV[1].replace(/\s/g, '').replace(',', '.'))
      if (v > 100 && v < 100000) data.netSalary = v
    }
  }

  // Salaire brut
  const grossM = lower.match(/salaire\s+brut\D{0,20}(\d[\d\s]{1,8}[,.]?\d{0,2})/)
  if (grossM) {
    const v = parseFloat(grossM[1].replace(/\s/g, '').replace(',', '.'))
    if (v > 100 && v < 100000) data.grossSalary = v
  }
  if (data.netSalary && data.grossSalary && data.grossSalary > 0)
    data.salaryRatio = data.netSalary / data.grossSalary

  // Revenu Fiscal de Référence
  const rfrM = lower.match(/revenu\s+fiscal\s+de\s+r[eé]f[eé]rence\D{0,30}(\d[\d\s]{1,9}[,.]?\d{0,2})/)
  if (rfrM) data.fiscalRef = parseFloat(rfrM[1].replace(/\s/g, '').replace(',', '.'))

  // IBAN prefix
  const ibanM = text.match(/\bFR\d{2}\s*\d{4}\s*\d{4}/)
  if (ibanM) data.ibanPrefix = ibanM[0].replace(/\s/g, '').slice(0, 12) + '…'

  // Dates JJ/MM/AAAA
  const dates = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/g)
  if (dates) data.dates = [...new Set(dates)].slice(0, 8)

  return data
}

// ─── Fraud Signals ───────────────────────────────────────────────────────────────

function buildFraudSignals(
  text: string,
  family: DocFamily,
  data: ExtractedData,
  hasQr: boolean,
  metadata: PdfMetadata,
  requireQrForFraud: boolean,
): FraudSignal[] {
  const signals: FraudSignal[] = []

  // 1. Metadata forensics (Canva, Photoshop…)
  if (metadata.isSuspect) {
    signals.push({
      type: 'suspect_metadata',
      severity: 'high',
      message: metadata.suspectReason!,
    })
  }

  // 2. Empty / image-only text
  if (text.trim().length < 60) {
    signals.push({
      type: 'empty_text',
      severity: 'medium',
      message: 'Texte insuffisant — image faible résolution ou PDF sans couche texte. Vérification partielle uniquement.',
    })
  }

  // 3. SIRET Luhn validity
  if (data.siret && !luhnSiret(data.siret)) {
    signals.push({
      type: 'siret_invalid',
      severity: 'high',
      message: `SIRET ${data.siret} mathématiquement invalide — numéro d'entreprise inexistant.`,
    })
  }

  // 4. Salary ratio anomaly (bulletin only)
  if (data.salaryRatio !== undefined && family === 'BULLETIN') {
    const r = data.salaryRatio
    if (r < 0.65 || r > 0.95) {
      signals.push({
        type: 'salary_ratio_anomaly',
        severity: r < 0.50 || r > 1.05 ? 'high' : 'medium',
        message: `Ratio Net/Brut de ${(r * 100).toFixed(1)} % hors norme (72–82 %). Structure salariale inhabituelle.`,
      })
    }
  }

  // 5. 2D-Doc QR absent on tax documents
  if (requireQrForFraud && !hasQr && family === 'REVENUS_FISCAUX') {
    signals.push({
      type: 'no_2ddoc',
      severity: 'medium',
      message: "Aucun QR code 2D-Doc DGFIP détecté. Les avis d'imposition officiels comportent systématiquement ce code.",
    })
  }

  return signals
}

// ─── PDF Text Extraction ─────────────────────────────────────────────────────────

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
    const ab = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: ab }).promise
    let text = ''
    const maxPages = Math.min(pdf.numPages, 5)
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((it) => (it as { str: string }).str).join(' ') + '\n'
      if (text.length > 8000) break
    }
    return text
  } catch {
    return ''
  }
}

// ─── Image OCR ───────────────────────────────────────────────────────────────────

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

// ─── QR / 2D-Doc Detection ───────────────────────────────────────────────────────

async function detectQr(file: File): Promise<boolean> {
  try {
    const { default: jsQR } = await import('jsqr')
    let imageData: ImageData | null = null
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf')
    if (isPdf) {
      const pdfjs = await getPdfjs()
      const ab = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: ab }).promise
      const page = await pdf.getPage(1)
      const vp = page.getViewport({ scale: 2.5 })
      const canvas = document.createElement('canvas')
      canvas.width = vp.width; canvas.height = vp.height
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

// ─── Main Entry Point ────────────────────────────────────────────────────────────

export async function runIntelligence(
  file: File,
  onProgress?: ScanProgress,
): Promise<IntelligenceResult> {
  const t0 = Date.now()
  const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')
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
  const [hasQrCode, pdfMetadata] = await Promise.all([
    detectQr(file),
    analyzePdfMetadata(file),
  ])
  onProgress?.('qr', 100)

  const { family, score, certaintyToken, matchedGroups, keywords } = classifyDocument(rawText)
  const extractedData = extractFields(rawText)
  const matchedProfile = PROFILES.find((p) => p.family === family)
  const requireQrForFraud = matchedProfile?.requireQrForFraud ?? false

  const signals = buildFraudSignals(rawText, family, extractedData, hasQrCode, pdfMetadata, requireQrForFraud)

  const highCount = signals.filter((s) => s.severity === 'high').length
  const medCount  = signals.filter((s) => s.severity === 'medium').length
  const adjustedScore = Math.max(0, score - highCount * 18 - medCount * 7)
  // Extra penalty for suspect metadata
  const finalScore = pdfMetadata.isSuspect ? Math.max(0, adjustedScore - 20) : adjustedScore

  const needsConfirmation = family !== 'UNKNOWN' && finalScore >= 40 && finalScore < 70

  onProgress?.('done', 100)

  return {
    docFamily: family,
    docType: null,
    confidence: finalScore,
    certaintyTokenFound: certaintyToken,
    matchedGroups,
    keywords,
    extractedData,
    fraudSignals: signals,
    pdfMetadata,
    rawText: rawText.slice(0, 3000),
    hasQrCode,
    ocrUsed,
    scanMs: Date.now() - t0,
    needsConfirmation,
  }
}

// ─── Cross-document salary coherence ────────────────────────────────────────────

export function crossCheckSalaries(scans: IntelligenceResult[]): string[] {
  const warnings: string[] = []
  const bulletins = scans.filter((s) => s.docFamily === 'BULLETIN')

  const nets = bulletins
    .map((s) => s.extractedData.netSalary)
    .filter((v): v is number => v !== undefined && v > 0)

  if (nets.length >= 2) {
    const max = Math.max(...nets)
    const min = Math.min(...nets)
    const variance = ((max - min) / max) * 100
    if (variance > 30) {
      warnings.push(
        `Variation de ${variance.toFixed(0)} % entre vos bulletins (${min.toLocaleString('fr-FR')} € – ${max.toLocaleString('fr-FR')} €). Vérifiez la cohérence.`,
      )
    }
  }

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

// ─── Test-friendly exports ────────────────────────────────────────────────────
// (allows unit tests to classify raw text without browser APIs)

export {
  classifyDocument as classifyText,
  scoreGroup as scoreAnchorGroup,
  extractFields as extractFieldsFromText,
}

// ─── Exported helpers (used by DossierLocatif) ──────────────────────────────────

export { FAMILY_LABELS, FAMILY_COLORS, assignDocTypeSlot } from './UniversalScraper'
