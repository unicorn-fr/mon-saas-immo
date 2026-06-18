/**
 * fiscalWizardConfig.ts
 * Configuration du wizard fiscal immobilier français.
 * Définit les types, les résultats possibles et les formulaires associés.
 */

// ─── Enums / Union types ──────────────────────────────────────────────────────

export type HoldingMode = 'NOM_PROPRE' | 'SCI' | 'INDIVISION' | 'DEMEMBREMENT'
export type LocationType = 'NU' | 'MEUBLE'
export type RegimeNU = 'MICRO_FONCIER' | 'REEL_FONCIER'
export type RegimeMeuble = 'LMNP_MICRO' | 'LMNP_MICRO_TOURISME' | 'LMNP_REEL' | 'LMP_REEL'
export type MeubleeType = 'CLASSIQUE' | 'TOURISME_CLASSE' | 'CHAMBRE_HOTES'
export type SciRegime = 'IR' | 'IS'
export type SciType = 'SIMPLE' | 'COMPLEXE'
export type DemembrementRole = 'USUFRUITIER' | 'NU_PROPRIETAIRE'

export type WizardResult =
  | 'MICRO_FONCIER'
  | 'REEL_FONCIER'
  | 'LMNP_MICRO_CLASSIQUE'
  | 'LMNP_MICRO_TOURISME'
  | 'LMNP_REEL'
  | 'LMP_REEL'
  | 'SCI_IR'
  | 'SCI_IS'
  | 'INDIVISION'
  | 'DEMEM_USUFRUITIER'
  | 'DEMEM_NU_PROPRIO'

// ─── Form requirement ─────────────────────────────────────────────────────────

export interface FormRequirement {
  /** Code officiel du formulaire — ex. "2044", "2042-C-PRO" */
  code: string
  /** Libellé court — ex. "Déclaration des revenus fonciers" */
  label: string
  /** Case ou section à renseigner — ex. "Case 4BA — Revenu net foncier" */
  section?: string
  /** Description de ce qui doit être rempli */
  description: string
  /** true = formulaire principal, false = annexe ou report */
  isPrimary: boolean
}

// ─── Result config ────────────────────────────────────────────────────────────

export interface WizardResultConfig {
  result: WizardResult
  /** Libellé affiché dans l'interface — ex. "Revenus fonciers — Régime Réel" */
  label: string
  /** Intitulé court utilisé dans l'en-tête PDF */
  regime: string
  /** Liste ordonnée des formulaires à remplir */
  forms: FormRequirement[]
  /** Conseil fiscal court (1-2 phrases) */
  advice: string
  /** Avertissement complémentaire facultatif */
  disclaimer?: string
}

// ─── Result configs ───────────────────────────────────────────────────────────

export const RESULT_CONFIGS: Record<WizardResult, WizardResultConfig> = {

  MICRO_FONCIER: {
    result: 'MICRO_FONCIER',
    label: 'Revenus fonciers — Micro-foncier',
    regime: 'Micro-foncier (abattement 30%)',
    forms: [
      {
        code: '2042',
        label: 'Déclaration des revenus',
        section: 'Case 4BE — Revenus fonciers bruts',
        description: "Reporter vos loyers bruts. L'abattement de 30% est calculé automatiquement.",
        isPrimary: true,
      },
    ],
    advice:
      "Le micro-foncier s'applique automatiquement si vos revenus bruts sont inférieurs à 15 000 €. Simple mais vous ne pouvez pas déduire vos charges réelles.",
  },

  REEL_FONCIER: {
    result: 'REEL_FONCIER',
    label: 'Revenus fonciers — Régime Réel',
    regime: 'Régime réel foncier',
    forms: [
      {
        code: '2044',
        label: 'Déclaration des revenus fonciers',
        section: 'Lignes 110 à 240',
        description: 'Détailler loyers, charges et emprunts bien par bien.',
        isPrimary: true,
      },
      {
        code: '2042',
        label: 'Déclaration des revenus',
        section: 'Case 4BA (bénéfice) ou 4BC (déficit)',
        description: 'Reporter le résultat net de la 2044.',
        isPrimary: false,
      },
    ],
    advice:
      "Le régime réel est obligatoire au-delà de 15 000 € de revenus. Il permet de déduire toutes les charges réelles, y compris les intérêts d'emprunt et les travaux.",
  },

  LMNP_MICRO_CLASSIQUE: {
    result: 'LMNP_MICRO_CLASSIQUE',
    label: 'LMNP — Micro-BIC (meublé classique)',
    regime: 'LMNP Micro-BIC 50%',
    forms: [
      {
        code: '2042-C-PRO',
        label: 'Revenus non professionnels BIC',
        section: 'Cases 5ND / 5OD / 5PD',
        description: "Reporter vos recettes brutes. L'abattement de 50% est automatique.",
        isPrimary: true,
      },
    ],
    advice:
      'Abattement forfaitaire de 50% sur vos recettes brutes. Avantageux si vos charges réelles sont inférieures à 50%.',
  },

  LMNP_MICRO_TOURISME: {
    result: 'LMNP_MICRO_TOURISME',
    label: 'LMNP — Micro-BIC (meublé de tourisme classé)',
    regime: 'LMNP Micro-BIC 71% (tourisme classé)',
    forms: [
      {
        code: '2042-C-PRO',
        label: 'Revenus non professionnels BIC',
        section: 'Cases 5NG / 5OG / 5PG',
        description: 'Reporter vos recettes brutes de meublé de tourisme classé.',
        isPrimary: true,
      },
    ],
    advice:
      "Abattement exceptionnel de 71% pour les meublés de tourisme classés. Vérifiez votre classement Atout France.",
  },

  LMNP_REEL: {
    result: 'LMNP_REEL',
    label: 'LMNP — Régime Réel',
    regime: 'LMNP Réel (liasse BIC)',
    forms: [
      {
        code: '2031',
        label: 'BIC — Déclaration de résultats',
        section: 'Liasse fiscale complète',
        description: 'À déposer électroniquement avant le 20 mai. Nécessite un expert-comptable.',
        isPrimary: true,
      },
      {
        code: '2033',
        label: 'BIC — Bilan simplifié',
        section: 'Annexes A à G',
        description: 'Bilan + compte de résultat simplifié, amortissements.',
        isPrimary: true,
      },
      {
        code: '2042-C-PRO',
        label: 'Revenus non professionnels BIC',
        section: 'Case 5NA — Résultat LMNP réel',
        description: 'Reporter le résultat net (ou déficit) du formulaire 2031.',
        isPrimary: false,
      },
    ],
    advice:
      "Le régime réel permet de déduire tous les amortissements (bien, mobilier) et les charges réelles. Souvent très avantageux sur les premières années.",
  },

  LMP_REEL: {
    result: 'LMP_REEL',
    label: 'LMP — Régime Réel (Loueur Meublé Professionnel)',
    regime: 'LMP Réel (BIC professionnel)',
    forms: [
      {
        code: '2031',
        label: 'BIC — Déclaration de résultats',
        section: 'Liasse fiscale complète',
        description: 'À déposer électroniquement avant le 20 mai. Nécessite un expert-comptable.',
        isPrimary: true,
      },
      {
        code: '2033',
        label: 'BIC — Bilan simplifié',
        section: 'Annexes A à G',
        description: 'Bilan + compte de résultat simplifié, amortissements.',
        isPrimary: true,
      },
      {
        code: '2042',
        label: 'Déclaration des revenus',
        section: 'Case 5KP / 5LP / 5MP',
        description: 'Reporter le résultat net BIC professionnel.',
        isPrimary: false,
      },
    ],
    advice:
      "Statut LMP : les déficits sont imputables sur votre revenu global. Cotisations sociales TNS obligatoires (DSI). Consultez un expert-comptable.",
    disclaimer:
      "Le statut LMP est conditionné à deux critères cumulatifs : recettes > 23 000 € ET recettes supérieures à 50% de vos revenus professionnels totaux.",
  },

  SCI_IR: {
    result: 'SCI_IR',
    label: "SCI à l'IR — Société Civile Immobilière",
    regime: "SCI à l'IR (revenus fonciers)",
    forms: [
      {
        code: '2072-S',
        label: "SCI — Déclaration à l'IR (simplifiée)",
        section: 'Revenus et charges par bien',
        description:
          "La SCI déclare les revenus. Chaque associé reporte sa quote-part sur sa 2042.",
        isPrimary: true,
      },
      {
        code: '2042',
        label: 'Déclaration des revenus (par associé)',
        section: "Case 4BA — Quote-part des revenus SCI",
        description: 'Chaque associé déclare sa part au prorata de ses droits.',
        isPrimary: false,
      },
    ],
    advice:
      "En SCI à l'IR, chaque associé est imposé sur sa quote-part des bénéfices, même s'ils ne sont pas distribués.",
  },

  SCI_IS: {
    result: 'SCI_IS',
    label: "SCI à l'IS — Société Civile Immobilière",
    regime: "SCI à l'IS (impôt sur les sociétés)",
    forms: [
      {
        code: '2065',
        label: 'IS — Déclaration de résultats',
        description: "Déclaration de résultat de la SCI à l'IS.",
        isPrimary: true,
      },
      {
        code: '2050-2059',
        label: 'IS — Liasse fiscale',
        description: 'Comptes annuels, bilan, compte de résultat, annexes.',
        isPrimary: true,
      },
    ],
    advice:
      "La SCI à l'IS permet les amortissements mais les distributions de dividendes sont doublement taxées (IS + IR). Adaptée aux patrimoines importants.",
    disclaimer:
      "Taux IS : 15% jusqu'à 42 500 € de bénéfice, 25% au-delà. La cession du bien génère une plus-value professionnelle (pas le régime des particuliers).",
  },

  INDIVISION: {
    result: 'INDIVISION',
    label: 'Indivision',
    regime: 'Indivision (régime foncier)',
    forms: [
      {
        code: '2041-E',
        label: 'Indivision — Désignation du mandataire',
        description: 'Un seul indivisaire dépose la déclaration pour tous.',
        isPrimary: true,
      },
      {
        code: '2044',
        label: 'Revenus fonciers',
        section: 'Lignes 110 à 240 (total)',
        description: "Déclarer les revenus et charges globaux de l'indivision.",
        isPrimary: true,
      },
      {
        code: '2042',
        label: 'Déclaration des revenus (par indivisaire)',
        section: 'Case 4BA — Quote-part',
        description: 'Chaque indivisaire déclare sa quote-part.',
        isPrimary: false,
      },
    ],
    advice:
      "L'indivision nécessite la désignation d'un mandataire commun (formulaire 2041-E) pour la déclaration centralisée.",
  },

  DEMEM_USUFRUITIER: {
    result: 'DEMEM_USUFRUITIER',
    label: 'Démembrement — Usufruitier',
    regime: 'Démembrement (usufruitier)',
    forms: [
      {
        code: '2044',
        label: 'Déclaration des revenus fonciers',
        section: 'Lignes 110 à 240',
        description: 'Détailler loyers, charges et emprunts bien par bien.',
        isPrimary: true,
      },
      {
        code: '2042',
        label: 'Déclaration des revenus',
        section: 'Case 4BA (bénéfice) ou 4BC (déficit)',
        description: 'Reporter le résultat net de la 2044.',
        isPrimary: false,
      },
    ],
    advice:
      "En tant qu'usufruitier, vous déclarez 100% des revenus fonciers du bien démembré, comme un propriétaire classique.",
  },

  DEMEM_NU_PROPRIO: {
    result: 'DEMEM_NU_PROPRIO',
    label: 'Démembrement — Nu-propriétaire',
    regime: 'Démembrement (nu-propriétaire)',
    forms: [],
    advice:
      "Le nu-propriétaire ne déclare pas de revenus fonciers. Seules les charges de gros travaux (art. 156 CGI) peuvent être déductibles dans certains cas.",
    disclaimer:
      "La déductibilité des travaux du nu-propriétaire reste soumise à des conditions strictes. Consultez un conseiller fiscal.",
  },
}
