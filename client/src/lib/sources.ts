/**
 * Sources officielles : chaque règle citée dans Bailio renvoie vers le texte (Légifrance)
 * ou la fiche pratique de l'administration (service-public.gouv.fr).
 * Tous les liens ont été relevés sur les pages de service-public.gouv.fr qui les citent.
 */

const LEGI = 'https://www.legifrance.gouv.fr'
const SP = 'https://www.service-public.gouv.fr/particuliers/vosdroits'

/** Loi n° 89-462 du 6 juillet 1989, article par article. */
const LOI_1989: Record<string, string> = {
  '1': 'LEGIARTI000028806595',
  '2': 'LEGIARTI000037669833',
  '3': 'LEGIARTI000039369598',
  '3-1': 'LEGIARTI000028806589',
  '3-2': 'LEGIARTI000031009767',
  '3-3': 'LEGIARTI000043978254',
  '4': 'LEGIARTI000028806566',
  '5': 'LEGIARTI000037670711',
  '6': 'LEGIARTI000037670751',
  '7': 'LEGIARTI000038834730',
  '7-1': 'LEGIARTI000028777184',
  '8': 'LEGIARTI000028806569',
  '8-1': 'LEGIARTI000038834725',
  '9': 'LEGIARTI000006475079',
  '10': 'LEGIARTI000028806675',
  '11': 'LEGIARTI000028806673',
  '14': 'LEGIARTI000006475111',
  '15': 'LEGIARTI000047900030',
  '17': 'LEGIARTI000037670690',
  '17-1': 'LEGIARTI000028778231',
  '17-2': 'LEGIARTI000037670687',
  '18': 'LEGIARTI000039369552',
  '20-1': 'LEGIARTI000038834686',
  '21': 'LEGIARTI000028806698',
  '22': 'LEGIARTI000028806696',
  '22-1': 'LEGIARTI000037670657',
  '22-2': 'LEGIARTI000028806691',
  '23': 'LEGIARTI000041587263',
  '24': 'LEGIARTI000038834673',
  '25-3': 'LEGIARTI000042120923',
  '25-4': 'LEGIARTI000028779183',
  '25-5': 'LEGIARTI000028779185',
  '25-6': 'LEGIARTI000028779187',
  '25-8': 'LEGIARTI000031009719',
  '25-9': 'LEGIARTI000043977076',
  '25-12': 'LEGIARTI000042120921',
  '25-13': 'LEGIARTI000037649090',
}
export const LOI_1989_TEXT = `${LEGI}/loda/id/JORFTEXT000000509310/`
export const law = (art: string) => (LOI_1989[art] ? `${LEGI}/loda/article_lc/${LOI_1989[art]}/` : LOI_1989_TEXT)

/** Code civil : seuls les articles dont le lien a été vérifié. */
const CODE_CIVIL: Record<string, string> = {
  '1367': `${LEGI}/codes/article_lc/LEGIARTI000032042456`,
  '1366': `${LEGI}/codes/article_lc/LEGIARTI000032042461`,
  '1375': `${LEGI}/codes/article_lc/LEGIARTI000032042416/`,
  '1174': `${LEGI}/codes/id/LEGISCTA000032008860`,
  '1724': `${LEGI}/codes/article_lc/LEGIARTI000028806598/`,
  '1731': `${LEGI}/codes/article_lc/LEGIARTI000006442883/`,
  '1751': `${LEGI}/codes/article_lc/LEGIARTI000028806626/`,
  '2297': `${LEGI}/codes/section_lc/LEGITEXT000006070721/LEGISCTA000006136563/`,
}

/** Décrets et autres textes, par numéro. */
const DECRETS: Record<string, string> = {
  '2015-587': `${LEGI}/loda/id/JORFTEXT000030649868/`,
  '87-713': `${LEGI}/loda/id/LEGITEXT000006066149/`,
  '87-712': `${LEGI}/loda/id/LEGITEXT000006066148`,
  '2015-1437': `${LEGI}/loda/id/JORFTEXT000031444493`,
  '2015-981': `${LEGI}/loda/id/JORFTEXT000030967884/`,
  '2002-120': `${LEGI}/loda/id/JORFTEXT000000217471/`,
  '2016-382': `${LEGI}/loda/id/JORFTEXT000032320564/`,
  '2016-1104': `${LEGI}/loda/id/JORFTEXT000033026422`,
  '2016-1105': `${LEGI}/loda/id/JORFTEXT000033026442`,
  '2017-1416': `${LEGI}/loda/id/JORFTEXT000035676246`,
  '2018-347': `${LEGI}/jorf/id/JORFTEXT000036896852/`,
}
export const decree = (n: string) => DECRETS[n]

/** Règlement européen eIDAS (signature électronique). */
export const EIDAS = 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014R0910'

/** Fiches pratiques de l'administration, par sujet. */
export const GUIDES = {
  bail: { url: `${SP}/F920`, label: 'Rédaction du bail d’habitation' },
  meuble: { url: `${SP}/F1165`, label: 'Logement vide ou meublé : les différences' },
  meubleRegles: { url: `${SP}/F2315`, label: 'Les règles de la location meublée' },
  mobilite: { url: `${SP}/F34759`, label: 'Les règles du bail mobilité' },
  clauses: { url: `${SP}/F1686`, label: 'Les clauses interdites dans un bail' },
  decence: { url: `${SP}/F2042`, label: 'Le logement décent' },
  diagnostics: { url: `${SP}/F33463`, label: 'Les diagnostics à fournir au locataire' },
  dpe: { url: `${SP}/F16096`, label: 'Le diagnostic de performance énergétique' },
  documents: { url: `${SP}/F2066`, label: 'Les documents remis par le propriétaire' },
  justificatifs: { url: `${SP}/F1169`, label: 'Les justificatifs que vous pouvez demander' },
  loyer: { url: `${SP}/F1310`, label: 'Le montant du loyer' },
  encadrement: { url: `${SP}/F1314`, label: 'L’encadrement des loyers en zone tendue' },
  complement: { url: `${SP}/F34401`, label: 'Le complément de loyer' },
  revision: { url: `${SP}/F1311`, label: 'La révision du loyer' },
  irl: { url: `${SP}/F13723`, label: 'L’indice de référence des loyers (IRL)' },
  paiement: { url: `${SP}/F34396`, label: 'Le paiement du loyer' },
  quittance: { url: `${SP}/F35247`, label: 'La quittance de loyer' },
  charges: { url: `${SP}/F947`, label: 'Les charges récupérables' },
  depot: { url: `${SP}/F31269`, label: 'Le dépôt de garantie' },
  caution: { url: `${SP}/F31267`, label: 'La caution du locataire' },
  visale: { url: `${SP}/F33453`, label: 'La garantie Visale' },
  assurance: { url: `${SP}/F31300`, label: 'L’assurance habitation du locataire' },
  edlEntree: { url: `${SP}/F31270`, label: 'L’état des lieux d’entrée' },
  edlSortie: { url: `${SP}/F33671`, label: 'L’état des lieux de sortie' },
  reparations: { url: `${SP}/F31697`, label: 'Les réparations à la charge du locataire' },
  travaux: { url: `${SP}/F31699`, label: 'Les travaux à la charge du propriétaire' },
  conge: { url: `${SP}/F929`, label: 'Le congé donné par le propriétaire' },
  congeLocataire: { url: `${SP}/F1168`, label: 'Le congé donné par le locataire' },
  impayes: { url: `${SP}/F31272`, label: 'Loyers impayés et expulsion' },
  retard: { url: `${SP}/F2889`, label: 'Les frais de retard de paiement' },
  colocation: { url: `${SP}/F34661`, label: 'Les règles de la colocation' },
  couple: { url: `${SP}/F1159`, label: 'Un couple marié locataire' },
  cles: { url: `${SP}/F12244`, label: 'Garder un double des clés' },
  agence: { url: `${SP}/F375`, label: 'Les frais d’agence' },
  zonesTendues: { url: 'https://www.service-public.gouv.fr/simulateur/calcul/zones-tendues', label: 'Vérifier si une commune est en zone tendue' },
  contratType: { url: DECRETS['2015-587'], label: 'Le contrat type (décret n° 2015-587)' },
  signature: { url: CODE_CIVIL['1367'], label: 'La signature électronique (Code civil, art. 1367)' },
} as const
export type GuideKey = keyof typeof GUIDES

export interface CitePart {
  text: string
  url?: string
}

/**
 * Découpe une référence écrite en clair (« loi n° 89-462 du 6 juillet 1989, art. 3 et 10 ;
 * Code civil, art. 2297 ») en morceaux, avec un lien sur chaque article ou texte connu.
 */
export function citeParts(reference: string): CitePart[] {
  const out: CitePart[] = []
  reference.split(/(\s;\s)/).forEach((clause) => {
    if (clause === ' ; ') return out.push({ text: clause })
    const civil = /code civil/i.test(clause)
    const decreeNum = clause.match(/décret n°\s?([\d-]+)/i)?.[1]
    if (/contrat type/i.test(clause) || (decreeNum && !/89-462/.test(clause))) {
      return out.push({ text: clause, url: decree(decreeNum ?? '2015-587') })
    }
    const at = clause.search(/art\.\s/)
    if (at < 0) return out.push({ text: clause, url: /89-462/.test(clause) ? LOI_1989_TEXT : undefined })
    out.push({ text: clause.slice(0, at), url: civil ? undefined : LOI_1989_TEXT })
    const rest = clause.slice(at)
    let last = 0
    for (const m of rest.matchAll(/\d+(?:-\d+)?/g)) {
      const i = m.index ?? 0
      if (i > last) out.push({ text: rest.slice(last, i) })
      const url = civil ? CODE_CIVIL[m[0]] : LOI_1989[m[0]] ? law(m[0]) : undefined
      out.push({ text: m[0], url })
      last = i + m[0].length
    }
    if (last < rest.length) {
      const tail = rest.slice(last)
      const d = tail.match(/décret n°\s?([\d-]+)/i)?.[1]
      out.push({ text: tail, url: d ? decree(d) : undefined })
    }
  })
  return out.filter((p) => p.text)
}
