/**
 * fiscalCalculator.ts
 * Fonctions de calcul fiscal immobilier français.
 * Détermine le régime applicable et pré-remplit les cases des formulaires.
 */

import type { WizardResult } from '../data/fiscalWizardConfig'

// ─── Input answers ────────────────────────────────────────────────────────────

export interface WizardAnswers {
  // Étape 1 — Mode de détention
  holdingMode: 'NOM_PROPRE' | 'SCI' | 'INDIVISION' | 'DEMEMBREMENT'

  // Nom propre — type de location
  locationType?: 'NU' | 'MEUBLE'

  // Location nue (régime foncier)
  loyersBruts?: number
  opteRegimeReel?: boolean
  interetsEmprunt?: number
  travaux?: number
  chargesCopro?: number
  assurances?: number
  fraisGestion?: number
  taxeFonciere?: number
  autresCharges?: number

  // Location meublée (BIC)
  recettesMeublees?: number
  meubleeType?: 'CLASSIQUE' | 'TOURISME_CLASSE' | 'CHAMBRE_HOTES'
  /** Calculé en amont : recettes > 23 000 € ET recettes > 50% revenus pro totaux */
  isLMP?: boolean
  /** Revenus professionnels totaux du foyer fiscal (pour test LMP) */
  revenusTotauxProfessionnels?: number
  regimeMeuble?: 'MICRO' | 'REEL'
  valeurBien?: number
  dureeAmortissementBien?: number
  valeurMobilier?: number
  dureeAmortissementMobilier?: number

  // SCI
  sciRegime?: 'IR' | 'IS'
  sciType?: 'SIMPLE' | 'COMPLEXE'
  sciRevenusBruts?: number
  sciCharges?: number
  sciInterets?: number
  nombreAssocies?: number
  /** Quote-part de l'associé déclarant, en pourcentage (ex. 50 pour 50%) */
  quotePart?: number

  // SCI IS
  resultatFiscalSCI?: number
  dividendesDistribues?: number

  // Indivision
  nombreIndivisaires?: number
  /** Quote-part de l'indivisaire déclarant, en pourcentage */
  quotePartIndivision?: number
  mandataireDesigne?: boolean

  // Démembrement
  demembrementRole?: 'USUFRUITIER' | 'NU_PROPRIETAIRE'
}

// ─── Output ───────────────────────────────────────────────────────────────────

export interface FiscalCalculation {
  result: WizardResult
  year: number
  summary: {
    revenusBruts: number
    chargesDeductibles: number
    interetsEmprunt: number
    revenuNet: number
    /** Abattement forfaitaire (micro-foncier 30%, micro-BIC 50% ou 71%) */
    abattement?: number
    baseImposable: number
  }
  /** Pré-remplissage formulaire 2044 (régime réel foncier, SCI IR, indivision) */
  form2044?: {
    /** Ligne 110 — Recettes brutes */
    ligne110: number
    /** Ligne 220 — Total des charges déductibles */
    ligne220: number
    /** Ligne 420 — Intérêts d'emprunt */
    ligne420: number
    /** Ligne 430 — Primes d'assurance */
    ligne430: number
    /** Ligne 440 — Autres charges (travaux, copro, gestion, taxe foncière…) */
    ligne440: number
    /** Ligne 240 — Résultat net (positif = bénéfice, négatif = déficit) */
    ligne240: number
  }
  /** Pré-remplissage formulaire 2042 principal */
  form2042?: {
    /** Case 4BA — Revenu net foncier (bénéfice) */
    case4BA?: number
    /** Case 4BC — Déficit foncier imputable sur revenu global */
    case4BC?: number
    /** Case 4BE — Revenus bruts micro-foncier */
    case4BE?: number
  }
  /** Pré-remplissage formulaire 2042-C-PRO */
  form2042CPRO?: {
    /** Cases 5ND/5OD/5PD — Recettes LMNP micro-BIC classique */
    case5ND?: number
    /** Cases 5NG/5OG/5PG — Recettes LMNP micro-BIC tourisme classé */
    case5NG?: number
    /** Case 5NA — Résultat net LMNP réel */
    case5NA?: number
  }
  /** Détail des amortissements (LMNP/LMP réel) */
  amortissements?: {
    /** Amortissement annuel du bien immobilier */
    bien: number
    /** Amortissement annuel du mobilier */
    mobilier: number
    /** Total amortissements annuels */
    total: number
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Calcule l'IS dû par une SCI à l'IS (taux réduit 15% jusqu'à 42 500 €, 25% au-delà). */
function computeIS(resultat: number): number {
  if (resultat <= 0) return 0
  if (resultat <= 42500) return Math.round(resultat * 0.15)
  return Math.round(42500 * 0.15 + (resultat - 42500) * 0.25)
}

// ─── computeResult ────────────────────────────────────────────────────────────

/**
 * Détermine le régime fiscal applicable à partir des réponses du wizard.
 * Aucun effet de bord — fonction pure.
 */
export function computeResult(answers: WizardAnswers): WizardResult {
  const { holdingMode } = answers

  if (holdingMode === 'DEMEMBREMENT') {
    return answers.demembrementRole === 'USUFRUITIER'
      ? 'DEMEM_USUFRUITIER'
      : 'DEMEM_NU_PROPRIO'
  }

  if (holdingMode === 'SCI') {
    return answers.sciRegime === 'IS' ? 'SCI_IS' : 'SCI_IR'
  }

  if (holdingMode === 'INDIVISION') {
    return 'INDIVISION'
  }

  // NOM_PROPRE ────────────────────────────────────────────────────────────────

  if (answers.locationType === 'NU') {
    const bruts = answers.loyersBruts ?? 0
    // Micro-foncier : revenus < 15 000 € ET pas d'option pour le réel
    if (bruts < 15000 && !answers.opteRegimeReel) {
      return 'MICRO_FONCIER'
    }
    return 'REEL_FONCIER'
  }

  // MEUBLE ────────────────────────────────────────────────────────────────────
  const recettes = answers.recettesMeublees ?? 0
  const totalPro = answers.revenusTotauxProfessionnels ?? 0
  // LMP : recettes > 23 000 € ET recettes > 50% des revenus professionnels du foyer
  const isLMP = recettes > 23000 && recettes > totalPro * 0.5

  if (isLMP) return 'LMP_REEL'

  if (answers.regimeMeuble === 'REEL') return 'LMNP_REEL'

  if (answers.meubleeType === 'TOURISME_CLASSE') return 'LMNP_MICRO_TOURISME'

  return 'LMNP_MICRO_CLASSIQUE'
}

// ─── calculateFiscal ─────────────────────────────────────────────────────────

/**
 * Calcule les montants fiscaux et pré-remplit les cases des formulaires
 * en fonction des réponses du wizard et de l'année fiscale.
 */
export function calculateFiscal(answers: WizardAnswers, year: number): FiscalCalculation {
  const result = computeResult(answers)

  // ── Micro-foncier ──────────────────────────────────────────────────────────
  if (result === 'MICRO_FONCIER') {
    const bruts = answers.loyersBruts ?? 0
    const abattement = Math.round(bruts * 0.3)
    const net = bruts - abattement
    return {
      result,
      year,
      summary: {
        revenusBruts: bruts,
        chargesDeductibles: abattement,
        interetsEmprunt: 0,
        revenuNet: net,
        abattement,
        baseImposable: net,
      },
      form2042: { case4BE: bruts },
    }
  }

  // ── Régime réel foncier (+ usufruitier démembrement) ───────────────────────
  if (result === 'REEL_FONCIER' || result === 'DEMEM_USUFRUITIER') {
    const ligne110 = answers.loyersBruts ?? 0
    const ligne420 = answers.interetsEmprunt ?? 0
    const ligne430 = answers.assurances ?? 0
    const ligne440 =
      (answers.travaux ?? 0) +
      (answers.chargesCopro ?? 0) +
      (answers.fraisGestion ?? 0) +
      (answers.taxeFonciere ?? 0) +
      (answers.autresCharges ?? 0)
    const ligne220 = ligne420 + ligne430 + ligne440
    const ligne240 = ligne110 - ligne220
    return {
      result,
      year,
      summary: {
        revenusBruts: ligne110,
        chargesDeductibles: ligne220,
        interetsEmprunt: ligne420,
        revenuNet: ligne240,
        baseImposable: Math.max(0, ligne240),
      },
      form2044: { ligne110, ligne220, ligne420, ligne430, ligne440, ligne240 },
      form2042:
        ligne240 >= 0
          ? { case4BA: ligne240 }
          : { case4BC: Math.abs(ligne240) },
    }
  }

  // ── LMNP micro-BIC classique ───────────────────────────────────────────────
  if (result === 'LMNP_MICRO_CLASSIQUE') {
    const recettes = answers.recettesMeublees ?? 0
    const abattement = Math.round(recettes * 0.5)
    const net = recettes - abattement
    return {
      result,
      year,
      summary: {
        revenusBruts: recettes,
        chargesDeductibles: abattement,
        interetsEmprunt: 0,
        revenuNet: net,
        abattement,
        baseImposable: net,
      },
      form2042CPRO: { case5ND: recettes },
    }
  }

  // ── LMNP micro-BIC tourisme classé ────────────────────────────────────────
  if (result === 'LMNP_MICRO_TOURISME') {
    const recettes = answers.recettesMeublees ?? 0
    const abattement = Math.round(recettes * 0.71)
    const net = recettes - abattement
    return {
      result,
      year,
      summary: {
        revenusBruts: recettes,
        chargesDeductibles: abattement,
        interetsEmprunt: 0,
        revenuNet: net,
        abattement,
        baseImposable: net,
      },
      form2042CPRO: { case5NG: recettes },
    }
  }

  // ── LMNP / LMP réel ───────────────────────────────────────────────────────
  if (result === 'LMNP_REEL' || result === 'LMP_REEL') {
    const recettes = answers.recettesMeublees ?? 0
    const amortBien =
      answers.valeurBien != null && answers.dureeAmortissementBien != null
        ? Math.round(answers.valeurBien / answers.dureeAmortissementBien)
        : 0
    const amortMobilier =
      answers.valeurMobilier != null && answers.dureeAmortissementMobilier != null
        ? Math.round(answers.valeurMobilier / answers.dureeAmortissementMobilier)
        : 0
    const totalAmort = amortBien + amortMobilier
    const chargesExploitation =
      (answers.interetsEmprunt ?? 0) +
      (answers.assurances ?? 0) +
      (answers.chargesCopro ?? 0) +
      (answers.fraisGestion ?? 0) +
      (answers.autresCharges ?? 0)
    const totalCharges = chargesExploitation + totalAmort
    const net = recettes - totalCharges
    return {
      result,
      year,
      summary: {
        revenusBruts: recettes,
        chargesDeductibles: totalCharges,
        interetsEmprunt: answers.interetsEmprunt ?? 0,
        revenuNet: net,
        baseImposable: Math.max(0, net),
      },
      amortissements: { bien: amortBien, mobilier: amortMobilier, total: totalAmort },
      form2042CPRO: { case5NA: net },
    }
  }

  // ── SCI IR + Indivision ───────────────────────────────────────────────────
  if (result === 'SCI_IR' || result === 'INDIVISION') {
    const bruts = answers.sciRevenusBruts ?? answers.loyersBruts ?? 0
    const charges = answers.sciCharges ?? 0
    const interets = answers.sciInterets ?? answers.interetsEmprunt ?? 0
    const net = bruts - charges - interets
    const quotePartPct =
      (answers.quotePart ?? answers.quotePartIndivision ?? 100) / 100
    const netQuotePart = Math.round(net * quotePartPct)
    return {
      result,
      year,
      summary: {
        revenusBruts: bruts,
        chargesDeductibles: charges + interets,
        interetsEmprunt: interets,
        revenuNet: net,
        baseImposable: Math.max(0, netQuotePart),
      },
      form2044: {
        ligne110: bruts,
        ligne220: charges + interets,
        ligne420: interets,
        ligne430: 0,
        ligne440: charges,
        ligne240: net,
      },
      form2042:
        netQuotePart >= 0
          ? { case4BA: netQuotePart }
          : { case4BC: Math.abs(netQuotePart) },
    }
  }

  // ── SCI IS ────────────────────────────────────────────────────────────────
  if (result === 'SCI_IS') {
    const resultat = answers.resultatFiscalSCI ?? 0
    const is = computeIS(resultat)
    return {
      result,
      year,
      summary: {
        revenusBruts: resultat,
        chargesDeductibles: is,
        interetsEmprunt: 0,
        revenuNet: resultat - is,
        baseImposable: resultat,
      },
    }
  }

  // ── Nu-propriétaire (aucun revenu à déclarer) ─────────────────────────────
  return {
    result,
    year,
    summary: {
      revenusBruts: 0,
      chargesDeductibles: 0,
      interetsEmprunt: 0,
      revenuNet: 0,
      baseImposable: 0,
    },
  }
}
