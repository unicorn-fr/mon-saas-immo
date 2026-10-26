import type { TaxSummary } from './tax.js'

/**
 * Déclarer sans rien recalculer : pour chaque formulaire, les cases à remplir dans l'ordre de la déclaration en ligne,
 * avec le montant en euros entiers (les formulaires n'acceptent pas les centimes), prêt à copier.
 * Sources (relues en octobre 2026) : notice de la 2044 de 2026 (lignes 211 à 263, 420 à 451 ; déficit : 4BC pour la part
 * imputable sur le revenu global, 4BB pour la part reportée, 4BD pour les déficits des années précédentes), brochure
 * pratique IR 2026, page de la 2042-C-PRO (micro-BIC « autres locations meublées » : 5NI, 5OI, 5PI ; réel : 5NA, 5NY).
 * Bailio prépare ; le propriétaire vérifie et déclare lui-même sur impots.gouv.fr.
 */

export interface CopyEntry {
  /** Case ou ligne du formulaire (« 4BE », « 211 »), ou repère (« Immeuble 1 »). */
  box: string
  label: string
  /** Montant à saisir, en centimes (affiché et copié en euros entiers). */
  cents?: number
  /** Texte à saisir (adresse…) quand ce n'est pas un montant. */
  text?: string
  hint?: string
}

export interface CopyGroup {
  id: 'VIDE_MICRO' | 'VIDE_2044' | 'VIDE_2042' | 'MEUBLE_MICRO' | 'MEUBLE_REEL'
  form: '2042' | '2044' | '2042-C-PRO'
  title: string
  /** Ce qu'il faut cocher ou ouvrir avant de saisir, dans l'ordre. */
  steps: string[]
  entries: CopyEntry[]
  note?: string
}

export interface CopyPlanInput {
  year: number
  summary: TaxSummary
  /** Adresse de chaque logement (colonne « immeuble » de la 2044). */
  addresses: Record<string, string>
  /** Meublé au réel : estimation de Bailio (le résultat de la liasse 2031 fait foi). */
  lmnp: { better: 'MICRO' | 'REAL'; taxableCents: number; deficitCents: number } | null
}

/** Euros entiers, arrondis au plus proche (les formulaires de l'administration n'ont pas de centimes). */
export const wholeEuros = (cents: number) => Math.round(cents / 100)

const OPEN = 'Connectez-vous à votre espace particulier sur impots.gouv.fr, puis « Déclarer mes revenus ».'

export function copyPlan(i: CopyPlanInput): CopyGroup[] {
  const groups: CopyGroup[] = []
  const empty = i.summary.empty
  if (empty) {
    const micro = empty.microAllowed && empty.better !== 'REAL'
    if (micro) {
      groups.push({
        id: 'VIDE_MICRO',
        form: '2042',
        title: 'Location vide : micro-foncier',
        steps: [OPEN, 'À l’étape « Revenus et charges », cochez « Revenus fonciers ».', 'À l’étape suivante, remplissez la case ci-dessous. L’abattement de 30 % est calculé par l’administration.'],
        entries: [{ box: '4BE', label: 'Loyers bruts encaissés, hors charges, de tous vos logements loués vides', cents: empty.grossRentCents }],
      })
    } else {
      const props = i.summary.properties.filter((p) => !p.furnished)
      const entries: CopyEntry[] = []
      props.forEach((p, k) => {
        entries.push({ box: `Immeuble ${k + 1}`, label: p.name, text: i.addresses[p.id] ?? p.name, hint: 'Une colonne par logement, dans le même ordre.' })
        for (const l of p.lines) {
          const cents = l.line === '230' ? -l.cents : l.cents
          if (l.line !== '211' && !cents) continue
          entries.push({ box: l.line, label: l.label, cents, hint: l.line === '230' ? 'Se retranche des frais : saisissez le montant sans signe.' : undefined })
        }
      })
      groups.push({
        id: 'VIDE_2044',
        form: '2044',
        title: 'Location vide : déclaration des revenus fonciers 2044',
        steps: [OPEN, 'À l’étape « Revenus et charges », cochez « Revenus fonciers », puis la déclaration 2044 (régime réel).', 'Remplissez une colonne par logement avec les lignes ci-dessous. Les totaux et le résultat se calculent seuls.'],
        entries,
        note: 'Remplir une 2044 alors que vos loyers ne dépassent pas 15 000 € vaut choix du régime réel pour trois ans.',
      })
      const result = empty.realResultCents
      const report: CopyEntry[] =
        result >= 0
          ? [{ box: '4BA', label: 'Revenu foncier imposable (bénéfice de la 2044, ligne 420)', cents: result }]
          : [
              { box: '4BC', label: 'Déficit imputable sur le revenu global (2044, ligne 436 ou 441)', cents: empty.deficit?.globalCents ?? 0 },
              { box: '4BB', label: 'Déficit à reporter sur vos revenus fonciers des dix années suivantes (2044, ligne 439 ou 442)', cents: empty.deficit?.carriedCents ?? 0 },
            ].filter((e) => e.cents)
      groups.push({
        id: 'VIDE_2042',
        form: '2042',
        title: 'Report sur la déclaration 2042',
        steps: ['Une fois la 2044 validée, ces cases se remplissent seules sur la 2042 : vérifiez qu’elles portent bien ces montants.'],
        entries: report,
        note: 'Case 4BD : déficits fonciers des années précédentes pas encore déduits. Vous les trouvez colonne C de votre 2044 de l’an dernier.',
      })
    }
  }
  const furnished = i.summary.furnished
  if (furnished) {
    const real = !furnished.microAllowed || i.lmnp?.better === 'REAL'
    const open = 'À l’étape « Revenus et charges », cochez la rubrique des locations meublées non professionnelles (déclaration complémentaire 2042-C-PRO).'
    groups.push(
      real
        ? {
            id: 'MEUBLE_REEL',
            form: '2042-C-PRO',
            title: 'Location meublée : régime réel',
            steps: [OPEN, open, 'Reportez le résultat de votre liasse 2031, établie par votre expert-comptable ou un logiciel agréé.'],
            entries: [
              i.lmnp && i.lmnp.taxableCents > 0
                ? { box: '5NA', label: 'Bénéfice imposable (estimation de Bailio : la liasse 2031 fait foi)', cents: i.lmnp.taxableCents, hint: '5OA pour le second déclarant.' }
                : { box: '5NY', label: 'Déficit (estimation de Bailio : la liasse 2031 fait foi)', cents: i.lmnp?.deficitCents ?? 0, hint: '5OY pour le second déclarant. Sans déficit, la case reste vide.' },
            ],
          }
        : {
            id: 'MEUBLE_MICRO',
            form: '2042-C-PRO',
            title: 'Location meublée : micro-BIC',
            steps: [OPEN, open, 'Remplissez la case ci-dessous, sans rien retirer : l’abattement de 50 % est calculé par l’administration.'],
            entries: [{ box: '5NI', label: 'Recettes brutes de l’année, charges comprises (« autres locations meublées »)', cents: furnished.receiptsCents, hint: '5OI si le logement est au nom du second déclarant, 5PI pour une personne à charge.' }],
          },
    )
  }
  return groups
}
