/**
 * Guides publics de bailio.fr (/guides) : un article écrit par vidéo publiée, pour être trouvé dans Google.
 * Chaque règle citée est vérifiée sur une source officielle, indiquée en fin d'article (« Vérifié le »).
 * Texte simple seulement (pas de HTML) : vouvoiement, phrases courtes, tout terme juridique expliqué.
 * Nouvel article : en tête de la liste (le plus récent d'abord). Sitemap et llms.txt le reprennent seuls (vite.config.ts).
 */

export type GuideBlock =
  | { h: string }
  | { p: string }
  | { list: string[] }
  /** Encadré « À retenir ». */
  | { note: string }

export interface Guide {
  slug: string
  title: string
  /** Une phrase, reprise dans la liste des guides et la description de la page. */
  description: string
  /** Date de publication, AAAA-MM-JJ. */
  date: string
  blocks: GuideBlock[]
  sources: Array<{ label: string; url: string; checked: string }>
}

export const GUIDES: Guide[] = [
  {
    slug: 'conge-du-proprietaire',
    title: 'Donner congé à son locataire : délais et motifs',
    description: 'Quand et pourquoi un propriétaire peut mettre fin au bail, et comment envoyer la lettre pour qu’elle soit valable.',
    date: '2026-10-29',
    blocks: [
      { p: 'Le congé est la lettre par laquelle vous annoncez à votre locataire que vous ne renouvelez pas le bail. Il se prépare longtemps à l’avance : envoyé trop tard, il n’est pas valable et le bail continue.' },
      { h: 'À quelle date ?' },
      { p: 'Vous ne pouvez donner congé que pour la fin du bail, appelée l’échéance. Pour une location vide, la durée habituelle est de 3 ans ; pour une location meublée, d’un an.' },
      { list: ['Location vide : votre locataire doit recevoir la lettre au moins 6 mois avant l’échéance.', 'Location meublée : au moins 3 mois avant l’échéance.'] },
      { p: 'Le délai se compte à partir du jour où votre locataire reçoit la lettre, pas du jour où vous l’envoyez. Prévoyez donc une marge de quelques semaines.' },
      { h: 'Pour quel motif ?' },
      { p: 'Le congé doit toujours donner son motif. Il n’en existe que trois :' },
      { list: ['Vendre le logement libre. Pour une location vide, votre locataire peut alors l’acheter en priorité : c’est son droit de préemption.', 'Reprendre le logement pour y habiter, ou pour y loger un proche (conjoint, enfant, parent…).', 'Un motif légitime et sérieux, par exemple des loyers impayés à répétition ou des troubles graves.'] },
      { p: 'Si vous venez d’acheter un logement déjà loué, des règles particulières s’appliquent : selon la date d’achat, le congé ne peut parfois être donné que pour la fin du bail suivant.' },
      { h: 'Comment l’envoyer ?' },
      { p: 'Un simple email ne suffit pas, même si votre locataire répond qu’il a bien reçu. Trois moyens sont valables :' },
      { list: ['La lettre recommandée avec accusé de réception.', 'L’acte de commissaire de justice (anciennement huissier).', 'La remise en main propre, contre une signature de votre locataire.'] },
      { p: 'La lettre est adressée à chaque signataire du bail. Pour une vente ou une reprise d’un logement vide, la notice d’information officielle doit être jointe à la lettre.' },
      { note: 'Dans Bailio, le courrier de congé est prêt à envoyer : il reprend la date de fin du bail et le motif, et joint la notice officielle quand elle est obligatoire.' },
    ],
    sources: [
      { label: 'Service-public.fr : préavis et formalités du congé donné par le propriétaire', url: 'https://www.service-public.fr/particuliers/vosdroits/F929', checked: '29 octobre 2026' },
    ],
  },
  {
    slug: 'depot-de-garantie',
    title: 'Le dépôt de garantie : combien demander et quand le rendre',
    description: 'Le montant maximum en location vide et meublée, les retenues possibles et le délai pour le rendre au locataire.',
    date: '2026-10-29',
    blocks: [
      { p: 'Le dépôt de garantie est la somme que votre locataire vous verse à la signature du bail. Vous la gardez pendant toute la location, pour couvrir un éventuel loyer impayé ou des dégâts. On l’appelle souvent « caution », à tort : la caution est la personne qui se porte garante.' },
      { h: 'Combien demander ?' },
      { list: ['Location vide : 1 mois de loyer hors charges au plus.', 'Location meublée : 2 mois de loyer hors charges au plus.'] },
      { p: 'Le montant est écrit dans le bail. Il ne peut pas augmenter pendant la location, ni quand le bail est renouvelé. Si le loyer se paie par trimestre d’avance, aucun dépôt ne peut être demandé.' },
      { h: 'Quand le rendre ?' },
      { p: 'Le délai part du jour où votre locataire vous rend les clés. Il dépend de l’état des lieux de sortie, comparé à celui d’entrée :' },
      { list: ['État des lieux de sortie identique à l’entrée : 1 mois au plus.', 'Différences constatées : 2 mois au plus.'] },
      { p: 'En copropriété, vous pouvez garder jusqu’à 20 % du dépôt en attendant les comptes annuels de l’immeuble, puis rendre le solde dans le mois qui suit leur approbation.' },
      { h: 'Que pouvez-vous retenir ?' },
      { p: 'Seulement ce que votre locataire vous doit encore : un loyer ou des charges impayés, ou des réparations dues à un mauvais entretien. Chaque retenue se justifie, par exemple avec les états des lieux, des photos, un devis ou une facture. L’usure normale du logement, elle, ne se retient jamais.' },
      { h: 'Et en cas de retard ?' },
      { p: 'Rendu trop tard, le dépôt est augmenté de 10 % du loyer mensuel hors charges pour chaque mois de retard commencé. Exemple : pour un loyer de 700 € et 2 mois de retard, vous devez 140 € en plus. Cette pénalité ne s’applique pas si votre locataire ne vous a pas donné sa nouvelle adresse en rendant les clés.' },
      { note: 'Dans Bailio, l’état des lieux de sortie se compare seul à celui d’entrée, et le solde de tout compte calcule la date limite et les retenues justifiées.' },
    ],
    sources: [
      { label: 'Service-public.fr : dépôt de garantie dans un bail d’habitation', url: 'https://www.service-public.fr/particuliers/vosdroits/F31269', checked: '29 octobre 2026' },
    ],
  },
]

export const guidePath = (g: Pick<Guide, 'slug'>) => `/guides/${g.slug}`
