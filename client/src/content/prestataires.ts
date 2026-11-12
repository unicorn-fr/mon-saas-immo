/**
 * Prestataires pour mettre en location et entretenir un logement. Bailio ne touche aucune commission.
 * `PARTENAIRES` : prestataires choisis par Bailio. À REMPLIR PAR ENZO : vide tant qu'aucun accord écrit n'est signé
 * (nom, zone, prix, contact). Jamais de prestataire inventé. Tant que la liste est vide, la page propose vos contacts
 * du carnet et une demande de devis prête à envoyer.
 */
export type ServiceKey = 'PHOTO' | 'VIDEO' | 'STAGING' | 'MENAGE' | 'JARDIN'

export const SERVICES: Array<{ key: ServiceKey; title: string; when: string; words: string[] }> = [
  { key: 'PHOTO', title: 'Photographe', when: 'Avant de publier l’annonce : la photo fait cliquer.', words: ['photo'] },
  { key: 'VIDEO', title: 'Vidéo et visite virtuelle', when: 'Pour les candidats qui habitent loin.', words: ['video', 'vidéo', 'visite'] },
  { key: 'STAGING', title: 'Home staging et rangement', when: 'Pour un logement vide ou chargé, avant les photos.', words: ['staging', 'rangement', 'deco', 'déco'] },
  { key: 'MENAGE', title: 'Ménage', when: 'Entre deux locataires, après l’état des lieux de sortie.', words: ['menage', 'ménage', 'nettoyage', 'entretien'] },
  { key: 'JARDIN', title: 'Jardinier', when: 'Entretien courant ou remise en état du jardin.', words: ['jardin', 'paysag'] },
]

export interface Partner {
  service: ServiceKey
  name: string
  area: string
  price: string
  email: string
}

export const PARTENAIRES: Partner[] = []

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Un contact du carnet correspond à un service si son métier ou son nom en contient un mot-clé. */
export function matchesService(contact: { trade: string | null; name: string }, key: ServiceKey): boolean {
  const s = SERVICES.find((x) => x.key === key)!
  const hay = norm(`${contact.trade ?? ''} ${contact.name}`)
  return s.words.some((w) => hay.includes(norm(w)))
}

/** Demande de devis prête à envoyer : ce que le prestataire doit savoir, sans le nom du locataire. */
export function quoteRequest(service: ServiceKey, p: { kindLabel: string; address: string; city: string | null; surface: number | null; rooms: number | null }): { subject: string; body: string } {
  const s = SERVICES.find((x) => x.key === service)!
  const what = [p.kindLabel, p.surface ? `${p.surface} m²` : null, p.rooms ? `${p.rooms} pièce${p.rooms > 1 ? 's' : ''}` : null].filter(Boolean).join(', ')
  return {
    subject: `Demande de devis : ${s.title.toLowerCase()}`,
    body: `Bonjour,\n\nPourriez-vous m’envoyer un devis (${s.title.toLowerCase()}) pour ce logement :\n- ${what}\n- ${p.address}${p.city && !norm(p.address).includes(norm(p.city)) ? `, ${p.city}` : ''}\n\nVos disponibilités et votre prix m’aideront à décider.\n\nMerci,`,
  }
}
