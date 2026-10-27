/**
 * Sous quelle forme les logements sont détenus, et ce que cela change pour l'impôt : en nom propre, à plusieurs, SCI à
 * l'impôt sur le revenu ou à l'impôt sur les sociétés, SARL de famille, EURL, SAS, SASU ou SARL à l'impôt sur les
 * sociétés. Le micro (micro-foncier, micro-BIC) n'existe que pour certaines formes ; une société à l'IS déclare
 * toujours au réel. Sources (octobre 2026) : docs/fiscalite/structures.md et docs/fiscalite/declaration.md (CGI art. 50-0,
 * 8, 206, 239, 239 bis AA, 239 bis AB ; réponse ministérielle n° 11036 sur l'EURL, loi Sapin II du 9 décembre 2016).
 */

export type HoldingForm = 'PERSON' | 'COUPLE' | 'SCI_IR' | 'SCI_IS' | 'SARL_FAMILLE' | 'EURL_IR' | 'COMPANY_IS' | 'COMPANY_IR'

export interface HoldingRules {
  /** Nom de la forme, en clair. */
  label: string
  tax: 'IR' | 'IS'
  /** Le micro est-il possible ? YES : oui ; NO : non, réel obligatoire ; CONDITIONS : sous conditions. */
  micro: 'YES' | 'NO' | 'CONDITIONS'
  /** Comment le résultat est imposé, en une phrase. */
  how: string
  /** Ce qui se dépose, et où. */
  forms: string
  /** Ce qu'il faut savoir. */
  note: string
}

export const HOLDING_RULES: Record<HoldingForm, HoldingRules> = {
  PERSON: {
    label: 'En votre nom',
    tax: 'IR',
    micro: 'YES',
    how: 'Les loyers s’ajoutent à vos revenus. Location vide : micro-foncier ou réel. Meublé : micro-BIC ou réel.',
    forms: 'Votre déclaration de revenus en ligne, avec la 2044 ou la 2042-C-PRO selon le cas.',
    note: 'La forme la plus simple : Bailio vous guide case par case.',
  },
  COUPLE: {
    label: 'À plusieurs (couple, indivision)',
    tax: 'IR',
    micro: 'YES',
    how: 'Comme en votre nom. Mariés ou pacsés : une seule déclaration pour le foyer. En indivision : chacun déclare sa part.',
    forms: 'La déclaration de revenus de chaque foyer, avec la 2044 ou la 2042-C-PRO.',
    note: 'Les dépenses se partagent dans la même proportion que les loyers.',
  },
  SCI_IR: {
    label: 'SCI à l’impôt sur le revenu',
    tax: 'IR',
    micro: 'NO',
    how: 'La SCI calcule un résultat foncier au réel ; chaque associé déclare sa part avec ses autres revenus.',
    forms: 'La SCI dépose la 2072 depuis son espace professionnel ; chaque associé reporte sa part (case 4BA ou 2044).',
    note: 'Un associé qui n’a que des parts de SCI n’a pas droit au micro-foncier. Une SCI qui loue en meublé de façon habituelle risque l’impôt sur les sociétés.',
  },
  SCI_IS: {
    label: 'SCI à l’impôt sur les sociétés',
    tax: 'IS',
    micro: 'NO',
    how: 'La SCI paie elle-même l’impôt sur son bénéfice, après amortissement du bien. Les associés ne sont imposés que sur ce qu’ils se versent.',
    forms: 'Déclaration 2065 et liasse 2033, par l’expert-comptable, depuis l’espace professionnel.',
    note: 'À la vente, la plus-value se calcule sur la valeur amortie : elle est souvent plus lourde qu’en nom propre.',
  },
  SARL_FAMILLE: {
    label: 'SARL de famille',
    tax: 'IR',
    micro: 'NO',
    how: 'Location meublée : bénéfice calculé au réel par la société, puis imposé chez chaque associé avec ses revenus.',
    forms: 'Liasse 2031 par l’expert-comptable ; chaque associé reporte sa part sur la 2042-C-PRO.',
    note: 'Le micro-BIC est fermé aux sociétés : réel obligatoire. Associés de la même famille (ligne directe, frères et sœurs, conjoints).',
  },
  EURL_IR: {
    label: 'EURL à l’impôt sur le revenu',
    tax: 'IR',
    micro: 'CONDITIONS',
    how: 'Le bénéfice est imposé chez l’associé unique, comme s’il louait en son nom.',
    forms: 'Au micro : la case 5NI de la 2042-C-PRO. Au réel : liasse 2031, puis la 2042-C-PRO.',
    note: 'Le micro-BIC est possible si l’associé unique est une personne physique et le gérant (loi Sapin II). Sinon, réel.',
  },
  COMPANY_IS: {
    label: 'Société à l’impôt sur les sociétés (SAS, SASU, SARL, EURL)',
    tax: 'IS',
    micro: 'NO',
    how: 'La société paie l’impôt sur son bénéfice (taux réduit de 15 % sur une première tranche pour une petite société, 25 % au-delà), après amortissement du bien.',
    forms: 'Déclaration 2065 et liasse 2033 (ou 2050), par l’expert-comptable, depuis l’espace professionnel.',
    note: 'Les associés ne sont imposés que sur les dividendes ou la rémunération qu’ils perçoivent. Plus-value calculée sur la valeur amortie à la vente.',
  },
  COMPANY_IR: {
    label: 'Société à l’impôt sur le revenu (option)',
    tax: 'IR',
    micro: 'NO',
    how: 'Le bénéfice est imposé chez les associés, au réel.',
    forms: 'Liasse 2031 par l’expert-comptable ; chaque associé reporte sa part sur la 2042-C-PRO.',
    note: 'Pour une SAS, une SASU ou une SARL, l’option pour l’impôt sur le revenu ne dure que cinq ans, et seulement pour une jeune société.',
  },
}

/** La forme d'une structure, d'après sa nature, son régime fiscal et la forme de la société (texte libre). */
export function holdingForm(s: { kind?: string | null; taxRegime?: 'IR' | 'IS' | null; companyForm?: string | null }): HoldingForm {
  if (s.kind === 'COUPLE') return 'COUPLE'
  if (s.kind === 'SCI') return s.taxRegime === 'IS' ? 'SCI_IS' : 'SCI_IR'
  if (s.kind !== 'COMPANY') return 'PERSON'
  const form = (s.companyForm ?? '').toLowerCase()
  if (s.taxRegime === 'IS') return 'COMPANY_IS'
  if (/famil/.test(form)) return 'SARL_FAMILLE'
  if (/eurl/.test(form)) return 'EURL_IR'
  // Une société sans régime indiqué est à l'impôt sur les sociétés, sauf la SARL de famille et l'EURL.
  return s.taxRegime === 'IR' ? 'COMPANY_IR' : 'COMPANY_IS'
}

/** Formes proposées pour une société (liste de saisie de la fiche de la structure). */
export const COMPANY_FORMS = ['SARL de famille', 'SARL', 'EURL', 'SAS', 'SASU', 'SCI']

/** Toutes les formes, dans l'ordre où on les présente pour comparer. */
export const HOLDING_ORDER: HoldingForm[] = ['PERSON', 'COUPLE', 'SCI_IR', 'SCI_IS', 'SARL_FAMILLE', 'EURL_IR', 'COMPANY_IS']
