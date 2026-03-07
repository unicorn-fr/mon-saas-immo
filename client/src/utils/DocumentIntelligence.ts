/**
 * DocumentIntelligence.ts — v6.0 "Version définitive"
 * Moteur de classification documentaire par ancrage textuel et sémantique.
 *
 * Innovations v6.0 :
 *  - Marqueurs de page "--- PAGE N ---" dans extractPdfText → split recto/verso
 *    CNI fonctionnel même pour les PDF natifs (pas uniquement les PDF scannés).
 *  - Profil BULLETIN étendu : net versé, rémunération nette, micro-entreprise.
 *  - Profil IDENTITE : tokens de certitude supplémentaires (id<fra, idfrax<, idfrx<).
 *  - Profil DOMICILE : ajout attestation hébergement gratuit.
 *  - extractFields : amélioration du parsing employeur (stratégie 3 niveaux).
 *  - Seuil confirmation UX à 90 % : ≥90% → confirmation simple, <90% → picker.
 *  - Extraction profonde : date/ville naissance, numéro CNI, NS masqué,
 *    visa Visale, période bulletin, garant, CAF, ARE, pension, validité.
 *  - Scoring par PROXIMITÉ spatiale.
 *  - Marqueurs de CERTITUDE à 100 % : MRZ, "garantie visale"…
 *  - Forensique METADATA PDF : détection d'outils suspects.
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
  // v6 — enriched extraction
  firstName?: string       // prénom (domicile / identité)
  lastName?: string        // nom de famille
  address?: string         // adresse postale extraite
  issuerName?: string      // émetteur (EDF, Orange, etc.)
  documentDate?: string    // date du document
  visaleAmount?: number    // loyer maximum garanti Visale (€/mois)
  visaleDuration?: string  // ex. "24 mois"
  contractType?: string    // CDI / CDD / Intérim / Alternance
  // v7 — deep document extraction
  birthDate?: string          // date de naissance (DD/MM/YYYY)
  birthCity?: string          // ville de naissance
  nationality?: string        // nationalité (code ou texte)
  documentNumber?: string     // numéro CNI / passeport / titre séjour
  documentExpiry?: string     // date de validité du document (DD/MM/YYYY)
  nationalNumber?: string     // numéro de sécurité sociale (partiellement masqué)
  visaNumber?: string         // numéro de visa Visale
  bulletinPeriod?: string     // période du bulletin (ex: "mars 2025")
  guarantorLastName?: string  // nom du garant (acte de cautionnement)
  guarantorFirstName?: string // prénom du garant
  guarantorAddress?: string   // adresse du garant
  cafAmount?: number          // montant allocation CAF
  areAmount?: number          // montant allocation chômage (ARE)
  pensionAmount?: number      // montant pension retraite
  rentAmount?: number         // montant loyer (quittance)
  loanAmount?: number         // montant échéance crédit (relevé bancaire)
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

// ─── Multi-Signal types ──────────────────────────────────────────────────────────

export interface SignalDetail {
  family: DocFamily
  score: number          // 0–100
  source: 'text' | 'filename' | 'structure'
  matched: string        // human-readable reason
}

export interface MultiSignalResult extends IntelligenceResult {
  pageCount: number        // nombre de pages (PDF) — utile pour détecter recto/verso CNI
  signals: {
    text:        SignalDetail
    filename:    SignalDetail | null
    structure:   SignalDetail | null
    fusion:      'certain' | 'text_dominant' | 'consensus' | 'filename_override' | 'unknown'
    fusionBonus: number   // extra pts added to final score
  }
}

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
      {
        label: 'Bulletin simplifié — rémunération nette',
        primary: ['rémunération nette', 'siret'],
        secondary: ['bulletin', 'période', 'employeur', 'brut', 'net'],
        proximityChars: 3000,
        baseWeight: 68,
      },
      {
        label: 'Bulletin auto-entrepreneur — déclaration',
        primary: ['net à payer', 'auto-entrepreneur'],
        secondary: ['urssaf', 'siret', 'chiffre d\'affaires', 'période', 'brut'],
        proximityChars: 4000,
        baseWeight: 66,
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
    // marqueurs de certitude absolus pour Visale
    certaintyTokens: ['garantie visale', 'visale.fr', "visa pour le logement et l'emploi"],
    anchorGroups: [
      {
        label: 'Attestation Visale — certifiée',
        primary: ['garantie visale', 'action logement'],
        secondary: ['bailleur', 'loyer', 'visa', 'certifié', 'cautionnement', 'locataire', 'loyer maximum'],
        proximityChars: 4000,
        baseWeight: 92,
      },
      {
        label: 'Visale — numéro de visa + locataire',
        primary: ['n° de visa', 'locataire'],
        secondary: ['action logement', 'cautionnement', 'franchises', 'dégradation', 'visale'],
        proximityChars: 3000,
        baseWeight: 88,
      },
      {
        label: 'Visale — visa locataire',
        primary: ['visa', 'locataire'],
        secondary: ['action logement', 'garantie', 'loyer', 'bailleur', 'durée'],
        proximityChars: 3000,
        baseWeight: 82,
      },
      {
        label: 'Cautionnement Action Logement',
        primary: ['cautionnement', 'action logement'],
        secondary: ['bailleur', 'visa', 'dégradation', 'loyer impayé'],
        proximityChars: 2000,
        baseWeight: 82,
      },
    ],
  },

  // ── Cautionnement solidaire (profil séparé) ───────────────────────────────────
  {
    family: 'GARANTIE',
    certaintyTokens: ['acte de caution solidaire', 'cautionnement solidaire'],
    anchorGroups: [
      {
        label: 'Acte de cautionnement solidaire',
        primary: ['cautionnement solidaire', 'garant'],
        secondary: ['bailleur', 'loyer impayé', 'solidaire', 'engagement', 'locataire', 'charges'],
        proximityChars: 4000,
        baseWeight: 82,
      },
      {
        label: 'Lettre de caution personnelle',
        primary: ['se porte caution', 'garant'],
        secondary: ['loyer', 'impayé', 'bail', 'locataire', 'bailleur'],
        proximityChars: 4000,
        baseWeight: 74,
      },
      {
        label: 'Attestation garant personne physique',
        primary: ['je me porte garant', 'loyer'],
        secondary: ['locataire', 'bailleur', 'solidaire', 'engagement', 'revenu'],
        proximityChars: 3000,
        baseWeight: 70,
      },
      {
        label: "Attestation sur l'honneur — garant",
        primary: ["j'atteste", 'garant'],
        secondary: ['caution', 'loyer', 'revenu', 'locataire', 'bail'],
        proximityChars: 3000,
        baseWeight: 66,
      },
    ],
  },

  // ── Loca-Pass / Action Logement ───────────────────────────────────────────────
  {
    family: 'GARANTIE',
    certaintyTokens: ['loca-pass', 'action logement'],
    anchorGroups: [
      {
        label: 'Loca-Pass / Action Logement',
        primary: ['loca-pass', 'action logement'],
        secondary: ['dépôt de garantie', 'avance', 'logement', 'bailleur'],
        proximityChars: 4000,
        baseWeight: 86,
      },
    ],
  },

  // ── Carte Nationale d'Identité ────────────────────────────────────────────────
  {
    family: 'IDENTITE',
    // MRZ zone de la CNI française — marqueur machine à 100%
    // Variantes OCR fréquentes : espaces injectés entre les lettres, remplacements de '<'
    certaintyTokens: [
      '<<<<<<<<<<<<<<<', '<<<<<<<<<<<<<<', 'idfra', 'idfrax', 'idfrx',
      'id<fra', 'idfrax<', 'idfrx<', 'id fra', 'id<fr',  // erreurs OCR courantes
    ],
    anchorGroups: [
      {
        label: "CNI — Carte Nationale d'Identité (complète)",
        primary: ["carte nationale d'identité", 'nationalité'],
        secondary: ['valable jusqu', 'commune', 'lieu de naissance', 'nom', 'prénom', 'sexe', 'naissance'],
        proximityChars: 2000,
        baseWeight: 85,
      },
      {
        label: 'CNI — République + nom/prénom',
        primary: ['république française', 'nom'],
        secondary: ['nationalité française', 'sexe', 'taille', 'lieu de naissance', 'prénom', 'né', 'naissance'],
        proximityChars: 2000,
        baseWeight: 78,
      },
      {
        label: 'CNI — nouvelle génération 2021+ (naissance+sexe)',
        primary: ['naissance', 'sexe'],
        secondary: ['prénom', 'né', 'taille', 'nationalité', 'nom', 'carte nationale', 'française'],
        proximityChars: 1500,
        baseWeight: 72,
      },
      {
        label: 'CNI — OCR partiel (né le + prénom)',
        primary: ['né le', 'prénom'],
        secondary: ['nom', 'nationalité', 'taille', 'commune', 'france', 'sexe'],
        proximityChars: 2500,
        baseWeight: 68,
      },
      {
        label: 'CNI — OCR verso (valable + nom)',
        primary: ['valable', 'nom'],
        secondary: ['prénom', 'nationalité', 'né', 'commune', 'france'],
        proximityChars: 2000,
        baseWeight: 65,
      },
      {
        label: 'CNI — nouvelle 2021 (taille + naissance)',
        primary: ['taille', 'naissance'],
        secondary: ['cm', 'sexe', 'prénom', 'nationalité', 'française'],
        proximityChars: 1500,
        baseWeight: 70,
      },
      {
        label: 'CNI — MRZ verso partiel (adresse + signature)',
        primary: ['adresse', 'signature'],
        secondary: ['titulaire', 'côté', 'verso', 'carte', 'nationale'],
        proximityChars: 2000,
        baseWeight: 62,
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

  // ── Justificatif de domicile — Facture énergie ────────────────────────────────
  {
    family: 'DOMICILE',
    certaintyTokens: ['edf.fr', 'engie.fr', 'totalenergies.com', 'direct-energie.com', 'ekwateur.fr'],
    anchorGroups: [
      {
        label: 'Facture électricité (EDF / Engie / Total)',
        primary: ['électricité', 'consommation'],
        secondary: ['edf', 'engie', 'total', 'kwh', 'point de livraison', 'pdl', 'abonnement', 'facture', 'puissance'],
        proximityChars: 5000,
        baseWeight: 80,
      },
      {
        label: 'Facture énergie — électricité ou gaz',
        primary: ['facture', 'consommation'],
        secondary: ['kwh', 'électricité', 'gaz naturel', 'compteur', 'point de livraison', 'pdl'],
        proximityChars: 4000,
        baseWeight: 74,
      },
      {
        label: 'Facture gaz naturel',
        primary: ['gaz naturel', 'consommation'],
        secondary: ['kwh', 'm³', 'pce', 'grdf', 'abonnement', 'énergie'],
        proximityChars: 5000,
        baseWeight: 78,
      },
    ],
  },

  // ── Justificatif de domicile — Facture télécom ────────────────────────────────
  {
    family: 'DOMICILE',
    certaintyTokens: ['orange.fr', 'free.fr', 'sfr.fr', 'bouyguestelecom.fr', 'sosh.fr', 'red-by-sfr.fr'],
    anchorGroups: [
      {
        label: 'Facture télécom (Orange / Free / SFR / Bouygues)',
        primary: ['abonnement', 'facture'],
        secondary: ['orange', 'free', 'sfr', 'bouygues', 'numéro de ligne', "numéro d'abonné", 'forfait', 'mobile', 'internet', 'fibre', 'opérateur'],
        proximityChars: 5000,
        baseWeight: 76,
      },
      {
        label: 'Facture internet / fibre optique',
        primary: ['facture', 'internet'],
        secondary: ['fibre', 'adsl', 'abonnement', 'débit', 'box', 'routeur'],
        proximityChars: 4000,
        baseWeight: 70,
      },
    ],
  },

  // ── Justificatif de domicile — Facture eau ────────────────────────────────────
  {
    family: 'DOMICILE',
    certaintyTokens: ['saur.com', 'veolia.fr', 'suez.com'],
    anchorGroups: [
      {
        label: 'Facture eau (Veolia / Saur / Suez)',
        primary: ['eau', 'consommation'],
        secondary: ['m³', 'compteur', 'suez', 'veolia', 'saur', 'syndicat des eaux', 'relevé'],
        proximityChars: 5000,
        baseWeight: 74,
      },
      {
        label: "Quittance d'eau",
        primary: ["quittance d'eau"],
        secondary: ['consommation', 'm³', 'relevé', 'compteur'],
        proximityChars: 0,
        baseWeight: 76,
      },
    ],
  },

  // ── Justificatif de domicile — Taxe habitation / foncière ────────────────────
  {
    family: 'DOMICILE',
    certaintyTokens: [],
    anchorGroups: [
      {
        label: "Taxe d'habitation",
        primary: ["taxe d'habitation"],
        secondary: ['impôt', 'commune', 'période', 'local', 'direction générale', 'trésor public'],
        proximityChars: 0,
        baseWeight: 82,
      },
      {
        label: 'Taxe foncière',
        primary: ['taxe foncière'],
        secondary: ['impôt', 'commune', 'cadastre', 'direction générale'],
        proximityChars: 0,
        baseWeight: 80,
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

  // ── CAF — Attestation allocations familiales ───────────────────────────────────
  {
    family: 'REVENUS_FISCAUX',
    certaintyTokens: ['caf.fr', 'allocations familiales'],
    anchorGroups: [
      {
        label: 'Attestation CAF / allocations familiales',
        primary: ['allocations familiales', 'caf'],
        secondary: ['allocataire', 'montant', 'bénéficiaire', 'prestation', 'versement'],
        proximityChars: 3000,
        baseWeight: 80,
      },
      {
        label: 'Notification CAF prestations',
        primary: ['caisse d\'allocations familiales'],
        secondary: ['prestation', 'allocataire', 'montant', 'bénéficiaire'],
        proximityChars: 0,
        baseWeight: 78,
      },
    ],
  },

  // ── France Travail / Pôle Emploi ───────────────────────────────────────────────
  {
    family: 'REVENUS_FISCAUX',
    certaintyTokens: ['france travail', 'pole-emploi.fr'],
    anchorGroups: [
      {
        label: 'ARE / Allocation chômage France Travail',
        primary: ['allocation chômage'],
        secondary: ['are', 'indemnité', 'demandeur emploi', 'ouverture droits', 'france travail'],
        proximityChars: 3000,
        baseWeight: 78,
      },
      {
        label: 'Notification Pôle Emploi ARE',
        primary: ["allocation d'aide au retour à l'emploi"],
        secondary: ['are', 'indemnité', 'demandeur', 'durée'],
        proximityChars: 0,
        baseWeight: 76,
      },
    ],
  },

  // ── Pension de retraite ────────────────────────────────────────────────────────
  {
    family: 'REVENUS_FISCAUX',
    certaintyTokens: ['caisse nationale retraite', 'cnav.fr', 'carsat'],
    anchorGroups: [
      {
        label: 'Pension de retraite CNAV / CARSAT',
        primary: ['pension de retraite', 'retraité'],
        secondary: ['cnav', 'carsat', 'montant pension', 'arrco', 'agirc', 'trimestre'],
        proximityChars: 3000,
        baseWeight: 76,
      },
      {
        label: 'Relevé de pension retraite',
        primary: ['pension', 'retraite'],
        secondary: ['montant', 'versement', 'liquidation', 'bénéficiaire', 'mensuel'],
        proximityChars: 2000,
        baseWeight: 68,
      },
    ],
  },

  // ── Retraite complémentaire AGIRC-ARRCO ────────────────────────────────────────
  {
    family: 'REVENUS_FISCAUX',
    certaintyTokens: ['agirc-arrco'],
    anchorGroups: [
      {
        label: 'Retraite complémentaire AGIRC-ARRCO',
        primary: ['retraite complémentaire', 'agirc-arrco'],
        secondary: ['points', 'trimestre', 'pension', 'bénéficiaire', 'montant'],
        proximityChars: 3000,
        baseWeight: 74,
      },
    ],
  },

  // ── Auto-entrepreneur / BNC / BIC ──────────────────────────────────────────────
  {
    family: 'REVENUS_FISCAUX',
    certaintyTokens: ['auto-entrepreneur'],
    anchorGroups: [
      {
        label: 'Déclaration auto-entrepreneur chiffre d\'affaires',
        primary: ['chiffre d\'affaires', 'auto-entrepreneur'],
        secondary: ['urssaf', 'bénéfice', 'déclaration', 'bnc', 'bic', 'micro'],
        proximityChars: 4000,
        baseWeight: 72,
      },
      {
        label: 'Avis URSSAF auto-entrepreneur',
        primary: ['auto-entrepreneur', 'urssaf'],
        secondary: ['cotisations', 'chiffre d\'affaires', 'déclaration', 'trimestriel'],
        proximityChars: 3000,
        baseWeight: 70,
      },
    ],
  },

  // ── Invalidité / AAH ───────────────────────────────────────────────────────────
  {
    family: 'REVENUS_FISCAUX',
    certaintyTokens: ['allocation adulte handicapé', 'aah'],
    anchorGroups: [
      {
        label: 'AAH / Allocation Adulte Handicapé',
        primary: ['allocation adulte handicapé'],
        secondary: ['mdph', 'invalidité', 'pension', 'bénéficiaire', 'montant'],
        proximityChars: 0,
        baseWeight: 76,
      },
      {
        label: 'Pension d\'invalidité',
        primary: ['pension d\'invalidité'],
        secondary: ['invalidité', 'sécurité sociale', 'montant', 'versement'],
        proximityChars: 0,
        baseWeight: 72,
      },
    ],
  },

  // ── RIB explicite ──────────────────────────────────────────────────────────────
  {
    family: 'BANCAIRE',
    certaintyTokens: ['relevé d\'identité bancaire'],
    anchorGroups: [
      {
        label: 'RIB — Relevé d\'Identité Bancaire',
        primary: ['iban', 'bic', 'titulaire'],
        secondary: ['banque', 'code banque', 'code guichet', 'numéro compte', 'domiciliation'],
        proximityChars: 2000,
        baseWeight: 82,
      },
    ],
  },

  // ── Justificatif de domicile — Attestation d'hébergement ─────────────────────
  {
    family: 'DOMICILE',
    certaintyTokens: [],
    anchorGroups: [
      {
        label: "Attestation d'hébergement à titre gratuit",
        primary: ['hébergement', "j'atteste"],
        secondary: ['logement', 'domicile', 'à titre gratuit', 'héberge', 'habite', 'résidence', 'adresse'],
        proximityChars: 3000,
        baseWeight: 70,
      },
      {
        label: "Attestation hébergement — attestation + domicile",
        primary: ['attestation', 'hébergement'],
        secondary: ['domicile', 'à titre gratuit', 'héberge', 'logement', 'résidence'],
        proximityChars: 2000,
        baseWeight: 66,
      },
      {
        label: "Attestation sur l'honneur domicile",
        primary: ["atteste sur l'honneur", 'domicile'],
        secondary: ['hébergement', 'résidence', 'adresse', 'logement'],
        proximityChars: 3000,
        baseWeight: 64,
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

/** Normalise une année à 2 ou 4 chiffres → toujours 4 chiffres */
function normalizeYear(y: string): string {
  if (y.length === 4) return y
  const n = parseInt(y, 10)
  return n <= 30 ? `20${y.padStart(2, '0')}` : `19${y.padStart(2, '0')}`
}

/** Extrait le nom d'employeur depuis les lignes juste avant le SIRET */
function extractEmployerNearSiret(text: string): string | undefined {
  const siretIdx = text.search(/\b\d{3}[\s.]?\d{3}[\s.]?\d{3}[\s.]?\d{5}\b/)
  if (siretIdx < 20) return undefined
  const before = text.slice(0, siretIdx)
  const lines = before.split('\n')
    .map(l => l.trim())
    .filter(l => l.length >= 3 && l.length <= 80)
    .filter(l => /[A-Za-zÀ-ÿ]{2}/.test(l))       // doit avoir des lettres
    .filter(l => !/^\d/.test(l))                   // ne commence pas par un chiffre
    .filter(l => !/\b\d{5}\b/.test(l))             // pas de code postal = pas une adresse
    .filter(l => !/^(?:siret|siren|n°|tél|tel|email|http|www)/i.test(l))

  // chercher en remontant depuis le SIRET: on prend la 1ère ligne plausible
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    // exclure les lignes qui ressemblent à des étiquettes de champs
    if (/^(?:employeur|société|raison|établissement|nom|prénom|adresse|période|mois|bulletin|date|code|service|catégorie)/i.test(line)) continue
    // doit avoir au moins 3 caractères alphabétiques consécutifs
    if (/[A-Za-zÀ-ÿ]{3}/.test(line)) return line.slice(0, 60)
  }
  return undefined
}

function extractFields(text: string): ExtractedData {
  const lower = text.toLowerCase()
  const data: ExtractedData = {}

  // ── SIRET: 14 chiffres ──────────────────────────────────────────────────────
  const siretM = text.match(/\b(\d{3}[\s.]?\d{3}[\s.]?\d{3}[\s.]?\d{5})\b/)
  if (siretM) data.siret = siretM[1].replace(/[\s.]/g, '')

  // ── Net à payer ──────────────────────────────────────────────────────────────
  const netPatterns = [
    /net\s+[àa]\s+payer\s*[:\-]?\s*(\d[\d\s\u00a0]{0,8}[,.]?\d{0,2})/i,
    /net\s+vers[eé]\s*[:\-]?\s*(\d[\d\s\u00a0]{0,8}[,.]?\d{0,2})/i,
    /montant\s+net\s*[:\-]?\s*(\d[\d\s\u00a0]{0,8}[,.]?\d{0,2})/i,
  ]
  for (const pat of netPatterns) {
    const m = lower.match(pat)
    if (m) {
      const v = parseFloat(m[1].replace(/[\s\u00a0]/g, '').replace(',', '.'))
      if (v > 50 && v < 100000) { data.netSalary = v; break }
    }
  }

  // ── Salaire brut ─────────────────────────────────────────────────────────────
  const grossPatterns = [
    /(?:salaire|r[eé]mun[eé]ration)\s+brut(?:\s+total)?\s*[:\-]?\s*(\d[\d\s\u00a0]{0,8}[,.]?\d{0,2})/i,
    /brut\s+total\s*[:\-]?\s*(\d[\d\s\u00a0]{0,8}[,.]?\d{0,2})/i,
    /total\s+brut\s*[:\-]?\s*(\d[\d\s\u00a0]{0,8}[,.]?\d{0,2})/i,
  ]
  for (const pat of grossPatterns) {
    const m = lower.match(pat)
    if (m) {
      const v = parseFloat(m[1].replace(/[\s\u00a0]/g, '').replace(',', '.'))
      if (v > 50 && v < 100000) { data.grossSalary = v; break }
    }
  }
  if (data.netSalary && data.grossSalary && data.grossSalary > 0)
    data.salaryRatio = data.netSalary / data.grossSalary

  // ── Revenu Fiscal de Référence ───────────────────────────────────────────────
  const rfrM = lower.match(/revenu\s+fiscal\s+de\s+r[eé]f[eé]rence\D{0,30}(\d[\d\s]{1,9}[,.]?\d{0,2})/)
  if (rfrM) data.fiscalRef = parseFloat(rfrM[1].replace(/\s/g, '').replace(',', '.'))

  // ── IBAN prefix ──────────────────────────────────────────────────────────────
  const ibanM = text.match(/\bFR\d{2}[\s\-]?\d{4}[\s\-]?\d{4}/)
  if (ibanM) data.ibanPrefix = ibanM[0].replace(/[\s\-]/g, '').slice(0, 12) + '…'

  // ── Dates JJ/MM/AAAA ─────────────────────────────────────────────────────────
  const dates = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/g)
  if (dates) data.dates = [...new Set(dates)].slice(0, 8)

  // ── Émetteur connu (factures domicile / télécom) ─────────────────────────────
  const KNOWN_ISSUERS = [
    'EDF', 'Engie', 'Orange', 'Free', 'SFR', 'Bouygues', 'Sosh',
    'Veolia', 'Saur', 'Suez', 'TotalEnergies', 'Total Energies',
    'GrDF', 'Direct Énergie', 'Eni', 'Vattenfall', 'Ekwateur',
    'La Poste', 'SNCF', 'Darty', 'Fnac',
  ]
  for (const issuer of KNOWN_ISSUERS) {
    if (lower.includes(issuer.toLowerCase())) {
      data.issuerName = issuer; break
    }
  }

  // ── Adresse postale ──────────────────────────────────────────────────────────
  // Supporte majuscules ET minuscules et formats sans virgule
  if (!data.address) {
    const addrPatterns = [
      // Minuscules avec virgule: "2 rue Jacques Prévert, 01500 Ambérieu"
      /\b\d{1,4}[\s,]+(?:rue|avenue|boulevard|impasse|allée|chemin|place|route|voie|passage|résidence|cité|square|cours|hameau)[^,\n]{3,60},?\s+\d{5}\s+[A-Za-zÀ-ÿ\-\s]{2,35}/i,
      // Majuscules sans virgule: "2 RUE JACQUES PREVERT 01500 AMBERIEU EN BUGEY"
      /\b\d{1,4}\s+(?:RUE|AVENUE|BOULEVARD|IMPASSE|ALLEE|CHEMIN|PLACE|ROUTE|VOIE|PASSAGE|RESIDENCE|CITE|SQUARE)[^,\n\d]{3,55}\s+\d{5}\s+[A-Z][A-Z\s\-]{2,35}/,
    ]
    for (const pat of addrPatterns) {
      const m = text.match(pat)
      if (m) { data.address = m[0].replace(/\s+/g, ' ').trim().slice(0, 120); break }
    }
  }

  // ── Nom / Prénom (documents domicile / RIB) ──────────────────────────────────
  if (!data.firstName && !data.lastName) {
    const nameM = text.match(
      /(?:M\.\s*|Mme\.?\s*|Monsieur\s+|Madame\s+|Titulaire\s*:?\s*|Client(?:e)?\s*:?\s*)([A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-ZÉÈÀÊÂÛÙÎÔÆŒa-zéèàêâûùîôæœ\-]+(?:\s+[A-ZÉÈÀÊÂÛÙÎÔÆŒa-zéèàêâûùîôæœ\-]+){1,3})/,
    )
    if (nameM) {
      const parts = nameM[1].trim().split(/\s+/)
      if (parts.length >= 2) { data.lastName = parts[0]; data.firstName = parts.slice(1).join(' ') }
      else data.lastName = parts[0]
    }
  }

  // ── Visale — loyer maximum garanti ───────────────────────────────────────────
  const visaleM = lower.match(/loyer\s+(?:maximum\s+)?garanti[^€\d]{0,25}(\d[\d\s\u00a0,.]{0,8})\s*€/)
  if (visaleM) {
    const v = parseFloat(visaleM[1].replace(/[\s\u00a0]/g, '').replace(',', '.'))
    if (v > 0 && v < 10000) data.visaleAmount = v
  }

  // ── Visale — durée ───────────────────────────────────────────────────────────
  const dureeM = lower.match(/dur[eé]e[^mois\d]{0,15}(\d{1,3})\s*mois/)
  if (dureeM) data.visaleDuration = `${dureeM[1]} mois`

  // ── Type de contrat ───────────────────────────────────────────────────────────
  if (/contrat\s+[àa]\s+dur[eé]e\s+ind[eé]termin[eé]e/i.test(text)) data.contractType = 'CDI'
  else if (/\bcdi\b/i.test(text) && /contrat|emploi|salarié/i.test(text)) data.contractType = 'CDI'
  else if (/contrat\s+[àa]\s+dur[eé]e\s+d[eé]termin[eé]e/i.test(text)) data.contractType = 'CDD'
  else if (/\bcdd\b/i.test(text) && /contrat|emploi|salarié/i.test(text)) data.contractType = 'CDD'
  else if (/int[eé]rim/i.test(text)) data.contractType = 'Intérim'
  else if (/contrat\s+d['']apprentissage/i.test(text) || (/alternance/i.test(text) && /contrat/i.test(text))) data.contractType = 'Alternance'

  // ── Nom employeur — v8 — stratégie multi-niveau ──────────────────────────────
  // Stratégie 1: label début de ligne (pas après "par l'", "de l'", "pour l'")
  if (!data.employerName) {
    const empLineM = text.match(
      /^(?:employeur|société|raison\s+sociale|établissement|ets)\s*[:\-]?\s*(.{3,60}?)$/im
    )
    if (empLineM) {
      const candidate = empLineM[1].trim()
      // Rejeter si c'est une phrase longue (vraisemblablement pas un nom d'entreprise)
      if (candidate.split(/\s+/).length <= 8 && !/(?:par|pour|de)\s+l['']/i.test(candidate)) {
        data.employerName = candidate.slice(0, 60)
      }
    }
  }
  // Stratégie 2: texte dans les N lignes avant le SIRET (le plus fiable)
  if (!data.employerName && data.siret) {
    data.employerName = extractEmployerNearSiret(text)
  }
  // Stratégie 3: en-tête du document (300 premiers caractères)
  if (!data.employerName) {
    const header = text.slice(0, 350)
    const headerM = header.match(/^([A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-Za-zÀ-ÿ\s\-&.']{4,60})\s*$/m)
    if (headerM) {
      const candidate = headerM[1].trim()
      if (!/(?:date|période|salarié|contrat|siret|tél|adresse)/i.test(candidate)) {
        data.employerName = candidate.slice(0, 60)
      }
    }
  }

  // ── Facture / Domicile — données structurées ──────────────────────────────────
  // Émetteur EDF-style : "Facture EDF" / "ORANGE SA" / mention en en-tête
  // Nom du titulaire : "Titulaire du contrat : M. Jean DUPONT" / "Client : Mme Marie MARTIN"
  // Montant TTC : "Montant TTC : 87,45 €" / "Total à payer 87,45 €"
  // Numéro de client / référence abonné
  if (!data.issuerName) {
    // Détection plus large : 1ère ligne du doc souvent = nom de l'émetteur
    const firstLines = text.split('\n').slice(0, 6).map(l => l.trim()).filter(l => l.length > 2)
    for (const line of firstLines) {
      // Si la ligne ressemble à un nom d'entreprise connue (capitalisée, sans chiffres dominants)
      if (/^[A-ZÉÈÀÊÂ][A-Za-zÀ-ÿ0-9\s\-&.,']{3,50}$/.test(line) && !/^\d{2}\//.test(line)) {
        const KNOWN_BRANDS = ['EDF', 'Engie', 'Orange', 'Free', 'SFR', 'Bouygues', 'Sosh', 'Veolia',
          'Saur', 'Suez', 'GrDF', 'Total', 'La Poste', 'SNCF', 'Gaz', 'Eau', 'Lyonnaise',
          'Eni', 'Vattenfall', 'GRDF', 'Chronopost', 'DHL', 'UPS', 'Colis']
        if (KNOWN_BRANDS.some(b => line.toLowerCase().includes(b.toLowerCase()))) {
          data.issuerName = line.slice(0, 60)
          break
        }
      }
    }
  }

  // Montant TTC facture / montant à payer
  if (!data.rentAmount) {
    const ttcPatterns = [
      /(?:montant\s+ttc|total\s+ttc|total\s+[àa]\s+payer|montant\s+[àa]\s+payer|net\s+[àa]\s+payer)\s*[:\-]?\s*(\d[\d\s\u00a0]*[,.]?\d{0,2})\s*€/i,
      /(?:solde\s+[àa]\s+payer|reste\s+[àa]\s+payer|montant\s+total)\s*[:\-]?\s*(\d[\d\s\u00a0]*[,.]?\d{0,2})\s*€/i,
    ]
    for (const pat of ttcPatterns) {
      const m = lower.match(pat)
      if (m) {
        const v = parseFloat(m[1].replace(/[\s\u00a0]/g, '').replace(',', '.'))
        if (v > 0 && v < 50000) { data.rentAmount = v; break }
      }
    }
  }

  // Référence client / numéro abonné / numéro de client
  // Utile pour les justificatifs de domicile
  const refClientM = text.match(
    /(?:r[eé]f[eé]rence\s+client|n[°º]\s+(?:de\s+)?client|num[eé]ro\s+(?:d[''])?abonn[eé]|compte\s+client)\s*[:\-]?\s*([A-Z0-9\-\/]{4,20})/i
  )
  if (refClientM) {
    // On le stocke comme partie de l'adresse si pas déjà prise
    // (réutilisé par SignalBreakdown pour affichage)
  }

  // Salarié (nom de l'employé dans le bulletin — qui reçoit le virement)
  if (!data.firstName && !data.lastName) {
    const salariePats = [
      /(?:salari[eé]|employ[eé]|nom\s+du\s+salari[eé])\s*[:\-]?\s*(?:M\.?\s*|Mme\.?\s*)?([A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-Za-zÀ-ÿ\-]+(?:\s+[A-ZÉÈÀÊÂÛÙÎÔÆŒa-zÀ-ÿ\-]+){1,3})/i,
      /^(?:M\.|Mme\.?)\s+([A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-Za-zÀ-ÿ\-]+(?:\s+[A-ZÉÈÀÊÂÛÙÎÔÆŒa-zÀ-ÿ\-]+){1,3})$/m,
    ]
    for (const pat of salariePats) {
      const m = text.match(pat)
      if (m) {
        const parts = m[1].trim().split(/\s+/)
        // Convention bulletin FR : NOM Prénom ou Prénom NOM — on prend tout
        if (parts.length >= 2) { data.lastName = parts[0]; data.firstName = parts.slice(1).join(' ') }
        else data.lastName = parts[0]
        break
      }
    }
  }

  // ── v7 — Deep document extraction ────────────────────────────────────────────

  // ── CNI — Nom de famille ─────────────────────────────────────────────────────
  if (!data.lastName) {
    const cniLastPats = [
      // Libellé sur même ligne ou ligne suivante (OCR layout variable)
      /^(?:NOM|Nom)\s+(?:DE\s+NAISSANCE\s+)?:?\s*([A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-ZÉÈÀÊÂÛÙÎÔÆŒ\-\s]{1,40})$/m,
      /^(?:NOM|Nom)\s*\n\s*([A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-ZÉÈÀÊÂÛÙÎÔÆŒ\-\s]{1,40})$/m,
      /^(?:nom\s+de\s+naissance|nom\s+de\s+famille)\s*:?\s*([A-ZÀ-ÿ][A-ZÀ-ÿ\s\-]{1,40})$/im,
      // Nouvelle CNI 2021 — champs sans étiquette : "DURANT" seul sur une ligne tout caps
      // (avant les prénoms en mixed case ou avant la date de naissance)
      /^([A-ZÉÈÀÊÂÛÙÎÔÆŒ]{2,25}(?:\s[A-ZÉÈÀÊÂÛÙÎÔÆŒ]{2,25})*)$(?=\n.{2,40}\n\d{2}\/\d{2})/m,
      // Surname:  ou Name: labels anglais
      /(?:surname|family\s+name|last\s+name)\s*[:\-]?\s*([A-ZÉÈÀÊÂÛÙÎÔÆŒA-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]{1,40})/i,
      // MRZ extrait: NOM<<PRENOM → séparer sur <<
      /([A-Z]{2,30})<<[A-Z<]{2,}/,
    ]
    for (const pat of cniLastPats) {
      const m = text.match(pat)
      if (m) { data.lastName = m[1].trim().replace(/\s{2,}/g, ' '); break }
    }
  }

  // ── CNI — Prénom(s) ──────────────────────────────────────────────────────────
  if (!data.firstName) {
    const cniFirstPats = [
      /^(?:PR[EÉ]NOMS?|Pr[eé]noms?)\s*\(?s?\)?\s*:?\s*([A-ZÉÈÀÊÂÛÙÎÔA-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]{1,50})$/m,
      /^(?:PRÉNOM\(S\)|PR[EÉ]NOM\(S\))\s*\n\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]{1,50})$/m,
      // Nouvelle CNI 2021 : prénom en mixed case après le nom tout caps
      /^([A-ZÉÈÀÊÂÛÙÎÔÆŒ]{2,25}(?:\s[A-ZÉÈÀÊÂÛÙÎÔÆŒ]{2,25})*)\n([A-Z][a-zéèàêâûùîôæœ][A-Za-zÀ-ÿ\s\-]{1,40})/m,
      // given name: / first name: label anglais
      /(?:given\s+name|first\s+name|prenom)\s*[:\-]?\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]{1,40})/i,
      // MRZ: après << des prénoms
      /[A-Z]{2,30}<<([A-Z]{2,20})(?:<|$)/,
    ]
    for (const pat of cniFirstPats) {
      const m = text.match(pat)
      // Pour le pattern prénom après nom (groupe 2), utiliser le bon groupe
      const captured = m?.[2] ?? m?.[1]
      if (captured) {
        data.firstName = captured.trim().replace(/[<_]/g, ' ').trim().replace(/\s{2,}/g, ' ').split(/\s+/)[0]
        // Si le pattern groupe 2 a aussi capturé le lastName, l'utiliser
        if (m?.[2] && !data.lastName && m?.[1]) {
          data.lastName = m[1].trim()
        }
        break
      }
    }
  }

  // ── Date de naissance ─────────────────────────────────────────────────────────
  // Accepte années 2 ou 4 chiffres, formats avec séparateurs variés
  const MONTHS_FR: Record<string, string> = {
    janv: '01', jan: '01', févr: '02', feb: '02', fev: '02', mars: '03', avr: '04',
    mai: '05', juin: '06', juil: '07', juill: '07', août: '08', aout: '08', aou: '08',
    sept: '09', sep: '09', oct: '10', nov: '11', déc: '12', dec: '12',
  }
  const birthPatterns = [
    /n[eé]e?\s+le\s+(\d{1,2})[\s\/\.\-](\d{1,2})[\s\/\.\-](\d{2,4})/i,
    /(?:date\s+(?:et\s+lieu\s+)?de\s+naissance|naissance)\s*:?\s*(\d{1,2})[\s\/\.\-](\d{1,2})[\s\/\.\-](\d{2,4})/i,
    // MRZ: JJMMAA en position 29-34 de ligne TD1/3
    /(?:^|[<\s])(\d{2})(\d{2})(\d{2})[MF<](?:\d{6}|[A-Z0-9<]{6})/m,
    /dob\s*:?\s*(\d{1,2})[\s\/\.\-](\d{1,2})[\s\/\.\-](\d{2,4})/i,
    /birth(?:\s+date)?\s*:?\s*(\d{1,2})[\s\/\.\-](\d{1,2})[\s\/\.\-](\d{2,4})/i,
  ]
  for (const pat of birthPatterns) {
    const m = text.match(pat)
    if (m) {
      const d = m[1].padStart(2, '0')
      const mo = m[2].padStart(2, '0')
      const y = normalizeYear(m[3])
      // Sanity: mois 01-12, jour 01-31
      if (parseInt(mo) >= 1 && parseInt(mo) <= 12 && parseInt(d) >= 1 && parseInt(d) <= 31) {
        data.birthDate = `${d}/${mo}/${y}`;  break
      }
    }
  }
  // Fallback: "né le 1 jan 1990" (nom de mois)
  if (!data.birthDate) {
    const mAbbr = text.match(/n[eé]e?\s+le\s+(\d{1,2})\s+([a-zéûîôâùèà]{3,7})\.?\s+(\d{2,4})/i)
    if (mAbbr) {
      const key = mAbbr[2].toLowerCase()
        .replace(/[éêë]/g,'e').replace(/[àâ]/g,'a').replace(/[ûü]/g,'u')
      const mo = MONTHS_FR[key] ?? MONTHS_FR[key.slice(0, 4)] ?? MONTHS_FR[key.slice(0, 3)]
      if (mo) data.birthDate = `${mAbbr[1].padStart(2,'0')}/${mo}/${normalizeYear(mAbbr[3])}`
    }
  }

  // ── Ville de naissance ────────────────────────────────────────────────────────
  const birthCityPatterns: RegExp[] = [
    // "né le DD/MM/YYYY à PARIS" ou "né le DD MM YYYY à PARIS"
    /n[eé]e?\s+le\s+\d{1,2}[\s\/\.\-]\d{1,2}[\s\/\.\-]\d{2,4}\s+[àa]\s+([A-ZÉÈÀÊÂÛÙÎÔÆŒA-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]{2,50}?)(?:\n|$|,|\()/m,
    // "NAISSANCE DD MM YYYY CITY" — CNI nouvelle génération
    /(?:NAISSANCE|naissance)\s+\d{1,2}[\s\/\.\-]\d{1,2}[\s\/\.\-]\d{2,4}\s+([A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-Z\s\-]{2,40}?)(?:\n|$|,)/m,
    // Label standard
    /lieu\s+de\s+naissance\s*:?\s*([A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-Za-zÀ-ÿ\s\-]{2,40})/i,
    /commune\s+de\s+naissance\s*:?\s*([A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-Za-zÀ-ÿ\s\-]{2,40})/i,
    /place\s+of\s+birth\s*:?\s*([A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-Za-zÀ-ÿ\s\-]{2,40})/i,
    // MRZ TD1 ligne 3 — derniers tokens peuvent être la ville
    /^([A-Z][A-Z\s]{2,25})<+$/m,
  ]
  for (const pat of birthCityPatterns) {
    const m = text.match(pat)
    if (m) {
      const city = m[1].trim().replace(/[<_]/g, '').replace(/\s+/g, ' ').slice(0, 50)
      if (city.length >= 2 && city.length <= 50 && !/^\d/.test(city) &&
          !/^(?:FRANCE|CARTE|VALABLE|NATIONAL|IDENTITE|REPUBLIQUE)/i.test(city)) {
        data.birthCity = city; break
      }
    }
  }

  // ── Numéro CNI / Passeport / Titre de séjour ──────────────────────────────────
  const docNumPatterns = [
    /(?:n[°º]\s*(?:de\s+)?(?:la\s+)?carte|num[eé]ro\s+(?:de\s+)?carte)\s*:?\s*([A-Z0-9]{7,12})/i,
    /(?:n[°º]\s*(?:de\s+)?passeport|passeport\s+n[°º])\s*:?\s*([A-Z0-9]{7,9})/i,
    /document\s+n[°º]\s*:?\s*([A-Z0-9]{8,14})/i,
    // CNI ancienne: 12 chiffres
    /\b(\d{12})\b/,
    // CNI nouvelle 2021+: 2 lettres + 7 chiffres
    /(?:^|\s)([A-Z]{2}[0-9]{7})\b/m,
    /\b([0-9A-Z]{9})\b(?=\D{0,20}(?:passeport|passport|carte))/i,
  ]
  for (const pat of docNumPatterns) {
    const m = text.match(pat)
    if (m) { data.documentNumber = m[1]; break }
  }

  // ── Date de validité du document ──────────────────────────────────────────────
  const expiryPatterns = [
    /(?:valable\s+jusqu['']au|valide\s+jusqu['']au|expire\s+le|expiry|date\s+de\s+fin\s+de\s+validit[eé])\s*:?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
    /(?:validit[eé]|valid\s+until)\s*:?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/i,
    /valable\s+(?:jusqu['']au\s+)?(\d{1,2})[\s\/\.\-](\d{1,2})[\s\/\.\-](\d{4})/i,
  ]
  for (const pat of expiryPatterns) {
    const m = text.match(pat)
    if (m) {
      if (m[3]) data.documentExpiry = `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[3]}`
      else data.documentExpiry = m[1].replace(/[.\-]/g, '/')
      break
    }
  }

  // ── Nationalité ───────────────────────────────────────────────────────────────
  if (!data.nationality) {
    if (/nationalit[eé]\s*:?\s*fran[cç]aise/i.test(text) || /nationalit[eé]\s*:?\s*FRA\b/.test(text)
        || /\bFRANCE\b/.test(text) && /\bIDFRA\b/.test(text)) {
      data.nationality = 'FRA'
    } else {
      const natM = text.match(/nationalit[eé]\s*:?\s*([A-ZÉÈÀÊA-Za-zÀ-ÿ]{3,20})/i)
      if (natM) data.nationality = natM[1].trim()
    }
  }

  // ── Numéro de sécurité sociale (masqué partiellement) ─────────────────────────
  const nssM = text.match(/\b([12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3})\s?\d{2}\b/)
  if (nssM) {
    const raw = nssM[1].replace(/\s/g, '')
    data.nationalNumber = `${raw.slice(0, 7)}••••••`
  }

  // ── Période du bulletin de salaire ───────────────────────────────────────────
  const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  for (const month of MONTHS) {
    const pat = new RegExp(`(?:p[eé]riode?|mois|bulletin|paie)\\s*[:\\-]?\\s*(?:du\\s+)?(?:\\d{1,2}\\s+)?${month}\\s+(20\\d{2})`, 'i')
    const m = text.match(pat)
    if (m) { data.bulletinPeriod = `${month} ${m[1]}`; break }
    const m2 = text.match(new RegExp(`\\b${month}\\s+(20\\d{2})\\b`, 'i'))
    if (m2) { data.bulletinPeriod = `${month} ${m2[1]}`; break }
  }
  if (!data.bulletinPeriod) {
    const periodM = lower.match(/(?:p[eé]riode?|paie|salaire)[^0-9]{0,20}(0[1-9]|1[0-2])\s*[/\-]\s*(20\d{2})/)
    if (periodM) {
      const monthNum = parseInt(periodM[1], 10)
      data.bulletinPeriod = `${MONTHS[monthNum - 1]} ${periodM[2]}`
    }
  }

  // ── Numéro de visa Visale ─────────────────────────────────────────────────────
  const visaNumM = text.match(/(?:n[°º]\s*de\s*visa|visa\s+n[°º]|num[eé]ro\s+visa)\s*:?\s*([A-Z0-9\-]{6,25})/i)
  if (visaNumM) data.visaNumber = visaNumM[1]
  if (!data.visaNumber) {
    const visaFallM = text.match(/\b([A-Z]{2}[0-9]{8,12})\b/)
    if (visaFallM && lower.includes('visale')) data.visaNumber = visaFallM[1]
  }

  // ── Garant — nom, prénom, adresse ─────────────────────────────────────────────
  const guarantorPatterns = [
    /(?:garant\s*:?\s*|se\s+porte\s+garant\s*:?\s*|caution\s*:?\s*)(?:M\.?\s*|Mme\.?\s*|Monsieur\s+|Madame\s+)?([A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-Za-zÀ-ÿ\-]+(?:\s+[A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-Za-zÀ-ÿ\-]+){1,3})/,
    /(?:soussign[eé]e?)\s*(?:M\.?\s*|Mme\.?\s*|Monsieur\s+|Madame\s+)?([A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-Za-zÀ-ÿ\-]+(?:\s+[A-ZÉÈÀÊÂÛÙÎÔÆŒ][A-Za-zÀ-ÿ\-]+){1,3})/i,
  ]
  for (const pat of guarantorPatterns) {
    const m = text.match(pat)
    if (m) {
      const parts = m[1].trim().split(/\s+/)
      if (parts.length >= 2) { data.guarantorLastName = parts[0]; data.guarantorFirstName = parts.slice(1).join(' ') }
      else data.guarantorLastName = parts[0]
      break
    }
  }
  if (data.guarantorLastName) {
    const garAddrM = text.match(
      /(?:demeurant|domicili[eé]|r[eé]side)\s+(?:[àa]\s+)?(\d{1,4}[,\s]+(?:rue|avenue|boulevard|allée|chemin|place|impasse|route|RUE|AVENUE|BOULEVARD)[^,\n]{3,60},?\s+\d{5}\s+[A-Za-zÀ-ÿ\s\-]{2,30})/i,
    )
    if (garAddrM) data.guarantorAddress = garAddrM[1].replace(/\s+/g, ' ').trim().slice(0, 120)
  }

  // ── Montant CAF ───────────────────────────────────────────────────────────────
  const cafPatterns = [
    /(?:allocations?\s+familiales?|caf|aide\s+au\s+logement|apl|als|alf)\D{0,30}(\d[\d\s]*[,.]?\d{0,2})\s*€/i,
    /montant\s+(?:de\s+)?(?:vos\s+)?(?:prestations?|allocations?)\D{0,20}(\d[\d\s]*[,.]?\d{0,2})\s*€/i,
  ]
  for (const pat of cafPatterns) {
    const m = lower.match(pat)
    if (m) {
      const v = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'))
      if (v > 0 && v < 10000) { data.cafAmount = v; break }
    }
  }

  // ── Montant ARE ──────────────────────────────────────────────────────────────
  const arePatterns = [
    /(?:allocation\s+d['']aide\s+au\s+retour|are|allocation\s+ch[oô]mage)\D{0,30}(\d[\d\s]*[,.]?\d{0,2})\s*€/i,
    /montant\s+(?:de\s+l[''])?are\D{0,20}(\d[\d\s]*[,.]?\d{0,2})\s*€/i,
    /journali[eè]re\s+brute\D{0,20}(\d[\d\s]*[,.]?\d{0,2})\s*€/i,
  ]
  for (const pat of arePatterns) {
    const m = lower.match(pat)
    if (m) {
      const v = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'))
      if (v > 0 && v < 20000) { data.areAmount = v; break }
    }
  }

  // ── Montant pension retraite ──────────────────────────────────────────────────
  const pensionPatterns = [
    /(?:pension\s+de\s+retraite|montant\s+(?:de\s+)?(?:la\s+)?pension)\D{0,30}(\d[\d\s]*[,.]?\d{0,2})\s*€/i,
    /retraite\D{0,30}montant\D{0,20}(\d[\d\s]*[,.]?\d{0,2})\s*€/i,
  ]
  for (const pat of pensionPatterns) {
    const m = lower.match(pat)
    if (m) {
      const v = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'))
      if (v > 0 && v < 20000) { data.pensionAmount = v; break }
    }
  }

  // ── Montant loyer (quittance) ─────────────────────────────────────────────────
  const rentM = lower.match(/(?:loyer|montant\s+total)\D{0,20}(\d[\d\s]*[,.]?\d{0,2})\s*€/)
  if (rentM && lower.includes('quittance')) {
    const v = parseFloat(rentM[1].replace(/\s/g, '').replace(',', '.'))
    if (v > 0 && v < 20000) data.rentAmount = v
  }

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

/**
 * Extraction PDF avec reconstruction du layout par position (x,y).
 * Technique : on regroupe les items texte par ligne (y ± 3px) et on les trie
 * par x croissant pour reconstituer l'ordre de lecture correct.
 * Résultat : bien meilleure structure pour les regex (étiquettes + valeurs alignées).
 */
async function extractPdfText(file: File): Promise<{ text: string; pageCount: number }> {
  try {
    const pdfjs = await getPdfjs()
    const ab = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: ab }).promise
    const pageCount = pdf.numPages
    let fullText = ''

    for (let p = 1; p <= Math.min(pageCount, 5); p++) {
      const page    = await pdf.getPage(p)
      const content = await page.getTextContent()
      const items   = content.items as Array<{ str: string; transform: number[] }>

      // Séparateur de page — permet au split recto/verso de fonctionner même
      // pour les PDF natifs (pas seulement les PDF-images OCR).
      if (p > 1) fullText += `\n--- PAGE ${p} ---\n`

      if (items.length === 0) continue

      // Groupe par ligne (y arrondi à 3px près)
      const lineMap = new Map<number, Array<{ x: number; text: string }>>()
      for (const item of items) {
        if (!item.str.trim()) continue
        const x    = item.transform[4]
        const y    = item.transform[5]
        const lineY = Math.round(y / 3) * 3
        if (!lineMap.has(lineY)) lineMap.set(lineY, [])
        lineMap.get(lineY)!.push({ x, text: item.str })
      }

      // Tri des lignes y décroissant (PDF coords: y=0 en bas)
      const sortedYs = [...lineMap.keys()].sort((a, b) => b - a)
      for (const y of sortedYs) {
        const line = lineMap.get(y)!.sort((a, b) => a.x - b.x)
        const lineText = line.map(i => i.text).join(' ').trim()
        if (lineText) fullText += lineText + '\n'
      }
      fullText += '\n'
      if (fullText.length > 12000) break
    }
    return { text: fullText.trim(), pageCount }
  } catch {
    return { text: '', pageCount: 0 }
  }
}

// ─── Image preprocessing ──────────────────────────────────────────────────────────

/**
 * Améliore une image avant OCR :
 *  1. Upscale (×2 min, ×4 max) pour avoir au moins 300dpi équivalents
 *  2. Conversion en niveaux de gris (méthode luminosité)
 *  3. Étirement de contraste (min-max stretch)
 *  4. Légère accentuation (unsharp-mask simplifié)
 *
 * Inspiré de : github.com/naptha/tesseract.js#image-preprocessing
 * et github.com/rembrandtreyes/document-preprocessing
 */
async function enhanceImageForOcr(blob: Blob): Promise<Blob> {
  try {
    const img    = await createImageBitmap(blob)
    const minDim = Math.min(img.width, img.height)
    // Upscale pour atteindre ~1800px minimum (optimal Tesseract)
    const scale  = Math.min(4, Math.max(1, Math.ceil(1800 / minDim)))

    const canvas  = document.createElement('canvas')
    canvas.width  = img.width  * scale
    canvas.height = img.height * scale
    const ctx     = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data      = imageData.data
    const n         = data.length

    // Passe 1 : niveaux de gris (luminosité ITU-R BT.601)
    const gray = new Uint8Array(n / 4)
    for (let i = 0; i < n; i += 4) {
      gray[i >> 2] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    }

    // Passe 2 : étirement de contraste (p2 – p98)
    const sorted  = gray.slice().sort((a, b) => a - b)
    const p2      = sorted[Math.floor(sorted.length * 0.02)]
    const p98     = sorted[Math.floor(sorted.length * 0.98)]
    const range   = p98 - p2 || 1
    const stretched = new Uint8Array(gray.length)
    for (let i = 0; i < gray.length; i++) {
      stretched[i] = Math.min(255, Math.max(0, Math.round(((gray[i] - p2) / range) * 255)))
    }

    // Passe 3 : unsharp-mask simplifié (amount 0.6, kernel 1-pixel)
    // Approximation rapide : pixel = clamp(2*orig - blurred)
    const w2 = canvas.width
    const sharpened = new Uint8Array(stretched.length)
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < w2; x++) {
        const idx  = y * w2 + x
        const self = stretched[idx]
        // Moyenne des 4 voisins (box-blur approximation)
        const left  = x > 0             ? stretched[idx - 1]  : self
        const right = x < w2 - 1        ? stretched[idx + 1]  : self
        const up    = y > 0             ? stretched[idx - w2] : self
        const down  = y < canvas.height - 1 ? stretched[idx + w2] : self
        const blur  = Math.round((left + right + up + down) / 4)
        sharpened[idx] = Math.min(255, Math.max(0, Math.round(self + 0.6 * (self - blur))))
      }
    }

    // Réinjecter dans imageData
    for (let i = 0; i < n; i += 4) {
      const v      = sharpened[i >> 2]
      data[i]      = v
      data[i + 1]  = v
      data[i + 2]  = v
      data[i + 3]  = 255
    }
    ctx.putImageData(imageData, 0, 0)
    return new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png')
    )
  } catch {
    return blob  // fallback: retourner l'original
  }
}

// ─── Image OCR ───────────────────────────────────────────────────────────────────

/**
 * OCR image avec prétraitement automatique.
 * Langues : fra + eng (nécessaire pour le MRZ : A-Z + chiffres + '<').
 * OEM 3 (LSTM) + PSM auto pour les documents mixtes.
 */
async function extractImageText(file: File, onPct?: (n: number) => void): Promise<string> {
  try {
    const { createWorker } = await import('tesseract.js')
    const w = await createWorker(['fra', 'eng'], 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') onPct?.(Math.round(m.progress * 100))
      },
    })

    // Prétraitement : améliore la lisibilité avant OCR
    const enhanced = await enhanceImageForOcr(file)
    const { data } = await w.recognize(enhanced)
    await w.terminate()
    return data.text
  } catch {
    return ''
  }
}

/**
 * OCR de chaque page d'un PDF sans couche texte (photos CNI, scans).
 * Chaque page est rendue à 3.5× (≈250 dpi), prétraitée, puis reconnue par Tesseract.
 * Technique identique à celle utilisée par github.com/nicholasgasior/ocr-pdf et
 * github.com/tesseract-ocr/tesseract (best-practices: 300dpi minimum).
 */
async function extractPdfPagesOcr(
  file: File,
  pageCount: number,
  onPct?: (n: number) => void,
): Promise<string> {
  try {
    const pdfjs = await getPdfjs()
    const ab    = await file.arrayBuffer()
    const pdf   = await pdfjs.getDocument({ data: ab }).promise
    const maxPg = Math.min(pageCount || pdf.numPages, 4)

    const { createWorker } = await import('tesseract.js')
    const w = await createWorker(['fra', 'eng'], 1, {
      logger: () => { /* silenced — progress tracked per page */ },
    })

    let allText = ''
    for (let i = 1; i <= maxPg; i++) {
      onPct?.(Math.round(((i - 1) / maxPg) * 80))
      const page   = await pdf.getPage(i)
      const vp     = page.getViewport({ scale: 3.5 })  // ~252dpi optimal Tesseract
      const canvas = document.createElement('canvas')
      canvas.width  = vp.width
      canvas.height = vp.height
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx as CanvasRenderingContext2D, viewport: vp, canvas }).promise

      // Prétraitement de l'image avant OCR
      const rawBlob      = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'))
      const enhancedBlob = await enhanceImageForOcr(rawBlob)

      const { data } = await w.recognize(enhancedBlob)
      allText += `\n--- PAGE ${i} ---\n` + data.text
      onPct?.(Math.round((i / maxPg) * 80))
    }

    await w.terminate()
    return allText.trim()
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
): Promise<IntelligenceResult & { _pageCount: number }> {
  const t0 = Date.now()
  const isPdf  = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')
  const isImage = file.type.startsWith('image/')
  let rawText  = ''
  let ocrUsed  = false
  let _pageCount = 0

  if (isPdf) {
    onProgress?.('pdf', 10)
    const extracted = await extractPdfText(file)
    rawText    = extracted.text
    _pageCount = extracted.pageCount
    onProgress?.('pdf', 50)

    // PDF image-only (scans de CNI, etc.) → OCR page par page
    if (rawText.replace(/\s/g, '').length < 200) {
      ocrUsed = true
      onProgress?.('ocr', 10)
      rawText = await extractPdfPagesOcr(file, _pageCount, (pct) => onProgress?.('ocr', pct))
      onProgress?.('ocr', 95)
    } else {
      onProgress?.('pdf', 90)
    }
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

  // ── Enrichissement MRZ pour les documents d'identité ──────────────────────────
  // Si le document est classé IDENTITE (ou que le texte contient une MRZ potentielle),
  // on parse la MRZ via cheminfo/mrz pour récupérer nom, prénom, date de naissance,
  // nationalité, numéro de document, expiration.
  // Inspiré de github.com/cheminfo/mrz (supporte TD1, TD3, FRENCH_NATIONAL_ID).
  if (family === 'IDENTITE' || rawText.includes('<<')) {
    try {
      const { parseMrz } = await import('./IdentityMatcher')
      const mrzResult = parseMrz(rawText)
      if (mrzResult) {
        const { surname, givenNames, birthDate, nationality, cardNumber, expiryDate } = mrzResult
        // N'écraser que si non déjà extrait par les regex OCR
        if (!extractedData.lastName  && surname)              extractedData.lastName  = surname
        if (!extractedData.firstName && givenNames?.length)   extractedData.firstName = givenNames[0]
        if (!extractedData.birthDate && birthDate)            extractedData.birthDate = birthDate
        if (!extractedData.nationality && nationality)        extractedData.nationality = nationality
        if (!extractedData.documentNumber && cardNumber)      extractedData.documentNumber = cardNumber
        if (!extractedData.documentExpiry && expiryDate)      extractedData.documentExpiry = expiryDate
      }
    } catch { /* IdentityMatcher optionnel */ }
  }

  const matchedProfile  = PROFILES.find((p) => p.family === family)
  const requireQrForFraud = matchedProfile?.requireQrForFraud ?? false

  const signals = buildFraudSignals(rawText, family, extractedData, hasQrCode, pdfMetadata, requireQrForFraud)

  const highCount     = signals.filter((s) => s.severity === 'high').length
  const medCount      = signals.filter((s) => s.severity === 'medium').length
  const adjustedScore = Math.max(0, score - highCount * 18 - medCount * 7)
  const finalScore    = pdfMetadata.isSuspect ? Math.max(0, adjustedScore - 20) : adjustedScore
  const needsConfirmation = family !== 'UNKNOWN' && finalScore >= 40 && finalScore < 70

  onProgress?.('done', 100)

  // Conserver davantage de texte pour les CNI multi-pages
  // (recto + verso = ~2 pages → besoin de ~4000 chars pour que le split PAGE N fonctionne)
  const rawTextMaxLen = family === 'IDENTITE' || _pageCount >= 2 ? 6000 : 3000

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
    rawText: rawText.slice(0, rawTextMaxLen),
    hasQrCode,
    ocrUsed,
    scanMs: Date.now() - t0,
    needsConfirmation,
    _pageCount,
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

// ─── Training — Apprentissage par correction utilisateur ─────────────────────────

const TRAINING_KEY = 'dossier_ai_training_v1'

/** Sauvegarde la correction de l'utilisateur pour entraîner les prochaines classifications. */
export function saveTrainingCorrection(filename: string, correctedFamily: DocFamily): void {
  const key = normalizeTrainingKey(filename)
  if (!key || key.length < 4) return
  try {
    const store = getTrainingStore()
    store[key] = correctedFamily
    localStorage.setItem(TRAINING_KEY, JSON.stringify(store))
  } catch { /* localStorage peut être désactivé (mode privé) */ }
}

function getTrainingStore(): Record<string, DocFamily> {
  try { return JSON.parse(localStorage.getItem(TRAINING_KEY) ?? '{}') } catch { return {} }
}

function normalizeTrainingKey(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\.(pdf|jpg|jpeg|png|webp)$/i, '')
    .replace(/[_\-.\d]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
}

// ─── Multi-Signal Engine ──────────────────────────────────────────────────────────

const FILENAME_SIGNALS: Array<{ patterns: string[]; family: DocFamily; score: number; label: string }> = [
  { patterns: ['bulletin', 'salaire', 'paie', 'payslip', 'fiche paie', 'fiche de paie'],                                                    family: 'BULLETIN',        score: 75, label: 'mot-clé bulletin' },
  { patterns: ['impot', 'imposition', 'avis fiscal', 'dgfip', 'revenu fiscal'],                                                              family: 'REVENUS_FISCAUX', score: 75, label: 'mot-clé impôt' },
  { patterns: ['cni', 'identite', 'carte identite', 'carte id', 'passeport', 'titre sejour', 'recto', 'verso', 'piece identite', 'id card'], family: 'IDENTITE',        score: 72, label: "mot-clé identité" },
  { patterns: ['contrat', 'cdi', 'cdd', 'embauche', 'kbis', 'attestation emploi', 'attestation travail'],                                   family: 'EMPLOI',          score: 70, label: 'mot-clé emploi' },
  { patterns: ['quittance', 'loyer', 'bail', 'assurance habitation'],                                                                        family: 'LOGEMENT',        score: 70, label: 'mot-clé logement' },
  { patterns: ['visale', 'caution', 'garant', 'garantie', 'cautionnement', 'loca pass', 'locapass'],                                        family: 'GARANTIE',        score: 72, label: 'mot-clé garantie' },
  { patterns: ['domicile', 'facture', 'edf', 'engie', 'orange', 'free', 'sfr', 'bouygues', 'telecom', 'eau', 'taxe habitation'],            family: 'DOMICILE',        score: 68, label: 'mot-clé domicile' },
  { patterns: ['rib', 'iban', 'releve compte', 'releve bancaire', 'bancaire'],                                                               family: 'BANCAIRE',        score: 68, label: 'mot-clé banque' },
  { patterns: ['caf', 'allocation', 'chomage', 'retraite', 'pension', 'pole emploi', 'france travail'],                                     family: 'REVENUS_FISCAUX', score: 65, label: 'mot-clé revenus sociaux' },
]

function filenameSignal(filename: string): SignalDetail | null {
  const lower = filename.toLowerCase().replace(/[_\-.]/g, ' ')

  // Training bias — les corrections utilisateur ont la priorité absolue
  const trainingStore = getTrainingStore()
  const nKey = normalizeTrainingKey(filename)
  for (const [k, family] of Object.entries(trainingStore)) {
    if (nKey.length >= 4 && k.length >= 4 && (nKey.includes(k) || k.includes(nKey))) {
      return { family: family as DocFamily, score: 85, source: 'filename', matched: 'apprentissage utilisateur' }
    }
  }

  for (const { patterns, family, score, label } of FILENAME_SIGNALS) {
    if (patterns.some((p) => lower.includes(p)))
      return { family, score, source: 'filename', matched: label }
  }
  return null
}

function structureSignal(file: File, pageCount: number): SignalDetail | null {
  const sizeMb = file.size / (1024 * 1024)
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf')

  if (isPdf && pageCount === 2 && sizeMb < 2.0)
    return { family: 'IDENTITE', score: 45, source: 'structure', matched: 'PDF 2 pages <2Mo → CNI probable' }
  if (isPdf && pageCount <= 2 && sizeMb > 0.05 && sizeMb < 1.0)
    return { family: 'BULLETIN', score: 40, source: 'structure', matched: 'PDF 1-2 pages 50Ko–1Mo → bulletin probable' }
  if (isPdf && pageCount >= 2 && pageCount <= 5 && sizeMb > 0.2)
    return { family: 'REVENUS_FISCAUX', score: 35, source: 'structure', matched: 'PDF 2-5 pages >200Ko → avis imposition probable' }
  if (isPdf && pageCount > 5)
    return { family: 'EMPLOI', score: 35, source: 'structure', matched: 'PDF >5 pages → contrat probable' }
  if (!isPdf && sizeMb < 0.5)
    return { family: 'IDENTITE', score: 40, source: 'structure', matched: 'image <500Ko → pièce identité probable' }
  return null
}

/**
 * Multi-signal intelligence fusion.
 *
 * Combines three independent signals:
 *   • text     (50-80%) — proximity-anchored scoring from document content
 *   • filename (15-25%) — keyword match on the file name
 *   • structure(10-20%) — page count + file size heuristics
 *
 * Fusion rules (priority order):
 *   R1 — certainty token → 100%, ignore others
 *   R2 — text ≥ 70 → text dominant, +5 bonus if filename agrees
 *   R3 — text 40-69 + filename same family → consensus, +15 pts
 *   R4 — text 40-69 + filename different → keep text
 *   R5 — text < 40 + filename → filename override (family = filename, score = max)
 *   R6 — text < 40, no filename → unknown
 *   R7 — all 3 signals agree on same family → extra +10
 */
export async function runMultiSignalIntelligence(
  file: File,
  onProgress?: ScanProgress,
): Promise<MultiSignalResult> {
  const base = await runIntelligence(file, onProgress)
  const { _pageCount, ...baseResult } = base

  const fnSig  = filenameSignal(file.name)
  const strSig = structureSignal(file, _pageCount)

  const textSig: SignalDetail = {
    family:  base.docFamily,
    score:   base.confidence,
    source:  'text',
    matched: base.matchedGroups[0] ?? 'analyse textuelle',
  }

  // Short-circuit: certainty token
  if (base.certaintyTokenFound) {
    return {
      ...baseResult,
      pageCount: _pageCount,
      signals: { text: textSig, filename: fnSig, structure: strSig, fusion: 'certain', fusionBonus: 0 },
    }
  }

  let finalFamily = base.docFamily
  let finalScore  = base.confidence
  let fusion: MultiSignalResult['signals']['fusion'] = 'unknown'
  let fusionBonus = 0

  const fnAgrees  = fnSig  && fnSig.family  === base.docFamily
  const strAgrees = strSig && strSig.family === base.docFamily

  if (base.confidence >= 70) {
    // R2 — text dominant
    fusion = 'text_dominant'
    if (fnAgrees) { fusionBonus = 5 }
  } else if (base.confidence >= 40) {
    if (fnAgrees) {
      // R3 — consensus boost
      fusion = 'consensus'
      fusionBonus = 15
    } else {
      // R4 — text wins despite disagreement
      fusion = 'text_dominant'
    }
  } else {
    // R5 / R6
    if (fnSig) {
      fusion = 'filename_override'
      finalFamily = fnSig.family
      finalScore  = Math.max(base.confidence, Math.round(fnSig.score * 0.8))
    } else {
      fusion = 'unknown'
    }
  }

  // R7 — triple agreement bonus
  if (fnAgrees && strAgrees && base.confidence > 0) fusionBonus += 10

  finalScore = Math.min(100, finalScore + fusionBonus)

  return {
    ...baseResult,
    pageCount:          _pageCount,
    docFamily:          finalFamily,
    confidence:         finalScore,
    needsConfirmation:  finalFamily !== 'UNKNOWN' && finalScore >= 40 && finalScore < 70,
    signals: { text: textSig, filename: fnSig, structure: strSig, fusion, fusionBonus },
  }
}

/**
 * Rend chaque page d'un PDF en PNG Blob à haute résolution (3.5× ≈ 252 dpi).
 * Utilisé pour le split recto/verso d'une CNI en PDF 2 pages.
 */
export async function splitPdfToPageImages(file: File): Promise<Blob[]> {
  const pdfjs = await getPdfjs()
  const ab    = await file.arrayBuffer()
  const pdf   = await pdfjs.getDocument({ data: ab }).promise
  const blobs: Blob[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page   = await pdf.getPage(i)
    const vp     = page.getViewport({ scale: 3.5 })
    const canvas = document.createElement('canvas')
    canvas.width  = vp.width
    canvas.height = vp.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx as CanvasRenderingContext2D, viewport: vp, canvas }).promise
    const rawBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'))
    // Applique le même pipeline d'amélioration image que l'OCR
    const enhanced = await enhanceImageForOcr(rawBlob)
    blobs.push(enhanced)
  }
  return blobs
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
