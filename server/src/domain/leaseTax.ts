/**
 * « Déclarer ce bail aux impôts » : ce qu'il faut faire dès qu'un locataire arrive ou part, sans attendre le printemps.
 * - Déclaration d'occupation (« Biens immobiliers » sur impots.gouv.fr, CGI art. 1418) : tout changement d'occupant,
 *   au plus tard le 30 juin de l'année suivante ; 150 € par logement en cas d'oubli (CGI art. 1770 terdecies).
 * - Première location meublée en nom propre : déclaration de début d'activité sur le guichet unique de l'INPI dans les
 *   15 jours (SIRET), puis déclaration initiale de CFE (1447-C-SD) avant le 31 décembre.
 * Sources : docs/fiscalite/declaration.md. Un garage loué seul n'est pas concerné ici (pas un logement).
 */

export interface LeaseTaxInput {
  mode: 'ARRIVAL' | 'DEPARTURE'
  /** Date d'entrée (arrivée) ou de sortie (départ), AAAA-MM-JJ. */
  date: string
  furnished: boolean
  /** Premier bail meublé du propriétaire en nom propre : formalités de début d'activité. */
  firstFurnished: boolean
  /** Logement d'une SCI ou d'une société : elle déclare depuis son espace professionnel. */
  company: boolean
  address: string
  /** Identifiant fiscal du logement (numéro invariant, sur l'avis de taxe foncière). */
  fiscalId?: string | null
  tenants: string[]
  done: Partial<Record<LeaseTaxItemId, string>>
}

export type LeaseTaxItemId = 'occupancy' | 'inpi' | 'cfe'

export interface LeaseTaxItem {
  id: LeaseTaxItemId
  title: string
  why: string
  deadline: string
  steps: string[]
  copy: Array<{ label: string; value: string }>
  link: { label: string; url: string }
  /** Formulaire pré-rempli par Bailio. */
  form?: 'CFE'
  doneAt: string | null
}

const fr = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}
const slash = (iso: string) => iso.split('-').reverse().join('/')
const plusDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)

export function leaseTaxItems(i: LeaseTaxInput): LeaseTaxItem[] {
  const year = Number(i.date.slice(0, 4))
  const space = i.company ? 'l’espace professionnel de la société' : 'votre espace particulier'
  const who = i.tenants.join(', ') || 'votre locataire'
  const arrival = i.mode === 'ARRIVAL'
  const items: LeaseTaxItem[] = [
    {
      id: 'occupancy',
      title: arrival ? `Signaler l’arrivée de ${who}` : `Signaler le départ de ${who}`,
      why: 'Les impôts tiennent la liste des occupants de chaque logement. Chaque changement se déclare : un oubli coûte 150 € par logement.',
      deadline: `Dès maintenant, et au plus tard le 30 juin ${year + 1}.`,
      steps: [
        `Connectez-vous à ${space} sur impots.gouv.fr.`,
        'Ouvrez « Biens immobiliers », puis choisissez ce logement (son adresse ou son identifiant fiscal ci-dessous).',
        arrival
          ? 'Déclarez l’occupation : loué, avec le nom du locataire et sa date d’entrée.'
          : 'Déclarez la fin de l’occupation à la date de sortie : logement vacant, ou le nom du nouveau locataire s’il est déjà là.',
        'Validez. Rien d’autre à envoyer.',
      ],
      copy: [
        { label: 'Adresse du logement', value: i.address },
        ...(i.fiscalId ? [{ label: 'Identifiant fiscal du logement', value: i.fiscalId }] : []),
        { label: arrival ? 'Locataire' : 'Locataire sortant', value: who },
        { label: arrival ? 'Date d’entrée' : 'Date de sortie', value: slash(i.date) },
      ],
      link: { label: i.company ? 'Espace professionnel' : 'Espace particulier', url: i.company ? 'https://www.impots.gouv.fr/professionnel' : 'https://www.impots.gouv.fr/accueil' },
      doneAt: i.done.occupancy ?? null,
    },
  ]
  if (arrival && i.furnished && i.firstFurnished && !i.company) {
    items.push(
      {
        id: 'inpi',
        title: 'Déclarer le début de votre activité de loueur en meublé',
        why: 'Louer meublé est une activité commerciale, même pour un seul logement : elle s’enregistre une fois. Vous recevez un numéro SIRET.',
        deadline: `Dans les 15 jours qui suivent le début de la location, soit avant le ${fr(plusDays(i.date, 15))}.`,
        steps: [
          'Créez un compte sur le guichet unique de l’INPI (gratuit).',
          '« Créer une entreprise », entrepreneur individuel, activité : location meublée non professionnelle.',
          'Indiquez l’adresse du logement et la date de début ci-dessous. Le régime micro-BIC s’applique par défaut.',
          'Votre SIRET arrive par courrier ou par email sous quelques semaines : notez-le ci-dessous, Bailio s’en sert ensuite.',
        ],
        copy: [
          { label: 'Adresse du logement', value: i.address },
          { label: 'Date de début de l’activité', value: slash(i.date) },
          { label: 'Activité', value: 'Location de logement meublé (loueur en meublé non professionnel)' },
        ],
        link: { label: 'Guichet unique de l’INPI', url: 'https://procedures.inpi.fr/' },
        doneAt: i.done.inpi ?? null,
      },
      {
        id: 'cfe',
        title: 'Envoyer la déclaration initiale de CFE (1447-C-SD)',
        why: 'La cotisation foncière des entreprises vise aussi la location meublée. Déclarée à temps, elle n’est pas due la première année, et pas du tout sous 5 000 € de recettes par an.',
        deadline: `Avant le 31 décembre ${year}.`,
        steps: [
          'Téléchargez la déclaration pré-remplie par Bailio : SIRET, lieu, date et signature y sont si vous les avez donnés.',
          'Relisez-la, puis envoyez-la au service des impôts des entreprises du lieu du logement : par la messagerie de l’espace professionnel, ou par courrier.',
        ],
        copy: [],
        link: { label: 'Le formulaire sur impots.gouv.fr', url: 'https://www.impots.gouv.fr/formulaire/1447-c-sd/declaration-initiale-de-cotisation-fonciere-des-entreprises' },
        form: 'CFE',
        doneAt: i.done.cfe ?? null,
      },
    )
  }
  return items
}

/** Arrivée ou départ à déclarer pour ce bail : null si rien n'est à faire (garage, ou bail trop ancien pour être signalé). */
export function leaseTaxMode(l: { status: string; startDate: string; endDate: string; housing: boolean }, today: string): 'ARRIVAL' | 'DEPARTURE' | null {
  if (!l.housing || l.status === 'DRAFT') return null
  const recent = (d: string) => d <= plusDays(today, 30) && d >= plusDays(today, -120)
  if (l.status === 'ENDED') return recent(l.endDate) && l.endDate <= today ? 'DEPARTURE' : null
  return recent(l.startDate) ? 'ARRIVAL' : null
}
