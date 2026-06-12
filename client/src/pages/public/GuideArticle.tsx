import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Tag, ChevronRight, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ArticleMeta {
  slug: string
  title: string
  description: string
  tag: string
  tagColor: { bg: string; color: string; border: string }
  readTime: number
  role: 'tenant' | 'owner'
  image: string
  updatedAt: string
}

interface ArticleContent {
  intro: string
  sections: Section[]
}

interface Section {
  type: 'h2' | 'h3' | 'p' | 'tip' | 'warning' | 'info' | 'checklist' | 'numbered' | 'quote'
  content?: string
  items?: string[]
}

// ─── Metadata catalogue ────────────────────────────────────────────────────────

const ARTICLES_META: ArticleMeta[] = [
  {
    slug: 'dossier-locatif-solide',
    title: 'Comment rédiger un dossier locatif solide',
    description: 'Les pièces indispensables, les erreurs à éviter et les conseils pour maximiser vos chances face à des dizaines de candidats.',
    tag: 'DOSSIER', readTime: 5, role: 'tenant',
    tagColor: { bg: BAI.tenantLight, color: BAI.tenant, border: BAI.tenantBorder },
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Janvier 2026',
  },
  {
    slug: 'comprendre-bail-loi',
    title: 'Comprendre le bail : tout ce que dit la loi',
    description: 'Durée, dépôt de garantie, préavis, charges — décryptage complet des clauses du contrat de location selon la loi ALUR.',
    tag: 'JURIDIQUE', readTime: 8, role: 'tenant',
    tagColor: { bg: '#eaf0fb', color: BAI.owner, border: BAI.ownerBorder },
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Février 2026',
  },
  {
    slug: 'visite-appartement-questions',
    title: 'Visite appartement : 20 questions à poser',
    description: 'Ne repartez jamais sans avoir posé ces questions clés sur les charges, le voisinage, les travaux et l\'état général.',
    tag: 'VISITE', readTime: 4, role: 'tenant',
    tagColor: { bg: BAI.caramelLight, color: BAI.caramel, border: BAI.caramelBorder },
    image: 'https://images.unsplash.com/photo-1560185127-6a73e90fe72b?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Mars 2026',
  },
  {
    slug: 'droits-locataire',
    title: 'Droits du locataire : ce que vous devez savoir',
    description: 'De la décence du logement à l\'obligation d\'entretien du propriétaire, connaissez vos droits pour vous protéger.',
    tag: 'DROITS', readTime: 6, role: 'tenant',
    tagColor: { bg: BAI.tenantLight, color: BAI.tenant, border: BAI.tenantBorder },
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Février 2026',
  },
  {
    slug: 'demenagement-checklist',
    title: 'Déménagement : checklist complète',
    description: 'Changement d\'adresse, résiliation d\'abonnements, état des lieux de sortie… Tout ce qu\'il faut faire, dans l\'ordre.',
    tag: 'PRATIQUE', readTime: 7, role: 'tenant',
    tagColor: { bg: BAI.bgMuted, color: BAI.inkMid, border: BAI.border },
    image: 'https://images.unsplash.com/photo-1558618591-fcd9c832d0e7?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Janvier 2026',
  },
  {
    slug: 'loyer-charges-comprises',
    title: 'Loyer charges comprises : bien comprendre',
    description: 'Charges forfaitaires ou réelles ? Quelles charges sont récupérables ? Comment contester une régularisation ?',
    tag: 'FINANCES', readTime: 5, role: 'tenant',
    tagColor: { bg: BAI.caramelLight, color: BAI.caramel, border: BAI.caramelBorder },
    image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Mars 2026',
  },
  {
    slug: 'fixer-bon-loyer',
    title: 'Fixer le bon loyer pour son bien',
    description: 'Méthodes de calcul, zones tendues, encadrement des loyers : comment trouver le juste prix pour louer vite et bien.',
    tag: 'LOYER', readTime: 6, role: 'owner',
    tagColor: { bg: BAI.ownerLight, color: BAI.owner, border: BAI.ownerBorder },
    image: 'https://images.unsplash.com/photo-1560184611-ff3e53f00b79?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Février 2026',
  },
  {
    slug: 'choisir-locataire-criteres',
    title: 'Choisir son locataire : critères légaux',
    description: 'Les règles anti-discrimination à respecter, les revenus exigibles, et comment évaluer la solvabilité sans prendre de risques.',
    tag: 'SÉLECTION', readTime: 5, role: 'owner',
    tagColor: { bg: BAI.ownerLight, color: BAI.owner, border: BAI.ownerBorder },
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Mars 2026',
  },
  {
    slug: 'rediger-annonce-attire',
    title: 'Rédiger une annonce qui attire',
    description: 'Photos, description, informations clés — les techniques des professionnels pour générer un maximum de visites qualifiées.',
    tag: 'ANNONCE', readTime: 4, role: 'owner',
    tagColor: { bg: BAI.caramelLight, color: BAI.caramel, border: BAI.caramelBorder },
    image: 'https://images.unsplash.com/photo-1484154253962-cc48de97c795?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Janvier 2026',
  },
  {
    slug: 'fiscalite-locative',
    title: 'Comprendre la fiscalité locative',
    description: 'Régime micro-foncier vs réel, déficit foncier, LMNP : optimisez votre déclaration et réduisez votre imposition légalement.',
    tag: 'FISCALITÉ', readTime: 10, role: 'owner',
    tagColor: { bg: '#fdf5ec', color: BAI.caramel, border: BAI.caramelBorder },
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Avril 2026',
  },
  {
    slug: 'etat-des-lieux',
    title: 'État des lieux : tout faire correctement',
    description: 'Entrée et sortie, photos, désaccords, délais de restitution du dépôt — le guide complet pour éviter les litiges.',
    tag: 'EDL', readTime: 7, role: 'owner',
    tagColor: { bg: BAI.ownerLight, color: BAI.owner, border: BAI.ownerBorder },
    image: 'https://images.unsplash.com/photo-1560440021-33f9b867899d?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Février 2026',
  },
  {
    slug: 'charges-recuperables',
    title: 'Charges récupérables : la liste complète',
    description: 'Eau, gardiennage, ascenseur, espaces verts — ce que vous pouvez légalement récupérer auprès de votre locataire.',
    tag: 'CHARGES', readTime: 6, role: 'owner',
    tagColor: { bg: BAI.bgMuted, color: BAI.inkMid, border: BAI.border },
    image: 'https://images.unsplash.com/photo-1486428816718-2bd1d40c56e7?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Mars 2026',
  },
]

// ─── Article content ───────────────────────────────────────────────────────────

const ARTICLES_CONTENT: Record<string, ArticleContent> = {
  'dossier-locatif-solide': {
    intro: 'Dans les grandes villes, un appartement attractif peut recevoir plusieurs dizaines de candidatures en quelques jours. Votre dossier est votre unique vitrine : il doit être irréprochable, complet et bien présenté pour retenir l\'attention d\'un propriétaire débordé.',
    sections: [
      { type: 'h2', content: 'Les pièces obligatoires selon la loi' },
      { type: 'p', content: 'La loi Alur de 2014 encadre strictement les documents qu\'un propriétaire peut exiger. Tout document non prévu par décret est illégal. Voici ce que vous pouvez légalement fournir :' },
      { type: 'checklist', items: [
        'Pièce d\'identité en cours de validité (carte nationale, passeport, titre de séjour)',
        'Justificatif de domicile actuel (quittance de loyer ou attestation d\'hébergement)',
        '3 derniers bulletins de salaire (ou bilans comptables si indépendant)',
        '2 derniers avis d\'imposition',
        'Contrat de travail ou promesse d\'embauche',
        'Justificatif de toutes autres ressources (APL, pension alimentaire…)',
      ]},
      { type: 'warning', content: 'Un propriétaire ne peut pas vous demander votre relevé de compte bancaire, votre dossier médical, votre casier judiciaire, une photo de vous, ni votre carte Vitale. Refusez toute demande de ce type : elle est illégale.' },
      { type: 'h2', content: 'Le garant : quand et comment l\'inclure' },
      { type: 'p', content: 'Si vos revenus sont inférieurs à 3 fois le loyer charges comprises (ratio standard du marché), un garant physique renforce considérablement votre dossier. Ce peut être un parent, un proche ou un garant professionnel (Visale, garantie bancaire).' },
      { type: 'info', content: 'La garantie Visale proposée par Action Logement est gratuite pour les moins de 30 ans ou les salariés en mobilité professionnelle. Elle couvre jusqu\'à 36 mois d\'impayés.' },
      { type: 'h2', content: 'Les erreurs qui font rejeter un dossier' },
      { type: 'numbered', items: [
        'Documents illisibles ou mal numérisés — scannez à plat, 150 dpi minimum, fichiers PDF propres',
        'Dossier incomplet — relancez le propriétaire si une pièce vous manque temporairement',
        'Incohérences entre les documents (adresse différente, prénom abrégé) — expliquez-les dans un mot d\'accompagnement',
        'Revenus non justifiés — si vous êtes auto-entrepreneur, fournissez l\'attestation URSSAF et les 3 derniers relevés de CA',
        'Garant sans ses propres justificatifs — son dossier doit être aussi complet que le vôtre',
      ]},
      { type: 'h2', content: 'Comment se démarquer positivement' },
      { type: 'p', content: 'Au-delà des pièces réglementaires, une lettre de motivation personnalisée fait une vraie différence. En 5 à 8 lignes, présentez votre situation, la raison de votre déménagement, votre stabilité professionnelle et votre soin apporté aux logements précédents.' },
      { type: 'tip', content: 'Mentionnez si vous êtes non-fumeur, sans animal de compagnie, ou si vous occupez peu le logement (télétravail partiel). Ces détails rassurent les propriétaires.' },
      { type: 'h2', content: 'Dossier numérique vs papier' },
      { type: 'p', content: 'Aujourd\'hui, la grande majorité des échanges se font en ligne. Préparez un PDF unique et bien nommé (NomPrenom_Dossier_Location.pdf) contenant tous vos documents dans l\'ordre : identité, domicile, revenus, contrat de travail, avis d\'imposition, garant. Un dossier prêt à l\'envoi en un clic vous donnera une longueur d\'avance.' },
    ],
  },

  'comprendre-bail-loi': {
    intro: 'Le contrat de location est le document central de votre relation bailleur-locataire. Signé pour plusieurs années, il régit vos droits et obligations. Voici ce que la loi ALUR (2014) et ses décrets d\'application imposent concrètement.',
    sections: [
      { type: 'h2', content: 'La durée du bail' },
      { type: 'p', content: 'Pour une location vide (non meublée), la durée minimale est de 3 ans si le bailleur est une personne physique (particulier), et de 6 ans si c\'est une personne morale (SCI, société). Pour une location meublée, la durée minimale est de 1 an (ou 9 mois pour les étudiants avec bail mobilité).' },
      { type: 'info', content: 'Le bail se renouvelle automatiquement aux mêmes conditions à son terme, sauf si le propriétaire envoie un congé pour vente, reprise ou motif légitime, dans les délais réglementaires.' },
      { type: 'h2', content: 'Le dépôt de garantie' },
      { type: 'checklist', items: [
        'Location vide : maximum 1 mois de loyer hors charges',
        'Location meublée : maximum 2 mois de loyer hors charges',
        'Délai de restitution : 1 mois si l\'état des lieux de sortie est conforme, 2 mois si des retenues sont opérées',
        'Retard de restitution : pénalité de 10% du loyer mensuel par mois de retard',
        'Intérêts : le dépôt ne porte pas d\'intérêts au profit du locataire',
      ]},
      { type: 'h2', content: 'Le préavis de départ' },
      { type: 'p', content: 'Pour quitter un logement, vous devez respecter un préavis de 3 mois pour une location vide, et 1 mois pour une location meublée. Ce délai est réduit à 1 mois dans les zones tendues (Paris, Lyon, Marseille, Bordeaux, etc.) pour les locations vides.' },
      { type: 'tip', content: 'Le préavis est également réduit à 1 mois en cas de perte d\'emploi, mutation professionnelle, premier emploi, état de santé justifiant un changement de domicile, ou bénéfice du RSA ou AAH.' },
      { type: 'h2', content: 'Les clauses abusives à repérer' },
      { type: 'warning', content: 'Certaines clauses fréquemment glissées dans les baux sont réputées non écrites (sans effet) selon l\'article 4 de la loi du 6 juillet 1989.' },
      { type: 'numbered', items: [
        'Clause interdisant d\'avoir des animaux de compagnie (invalide, sauf pour les animaux dangereux)',
        'Clause interdisant la résiliation à tout moment (vous pouvez partir avec préavis)',
        'Clause imposant une assurance spécifique (vous pouvez choisir librement votre assureur)',
        'Clause de solidarité entre colocataires après le départ de l\'un d\'eux (limitée à 6 mois)',
        'Clause prévoyant une résiliation automatique en cas de non-paiement sans décision de justice',
        'Clause imposant un prélèvement automatique obligatoire',
      ]},
      { type: 'h2', content: 'La révision annuelle du loyer' },
      { type: 'p', content: 'Le loyer ne peut être révisé qu\'une fois par an, à la date anniversaire du bail, et uniquement si une clause de révision est prévue. La hausse est plafonnée à l\'Indice de Référence des Loyers (IRL), publié trimestriellement par l\'INSEE. En zone tendue, des règles supplémentaires d\'encadrement s\'appliquent.' },
      { type: 'h2', content: 'Les charges locatives' },
      { type: 'p', content: 'Les charges récupérables sont listées de manière limitative par décret (décret n°87-713 du 26 août 1987). Elles couvrent principalement : entretien des parties communes, eau froide et chaude collective, chauffage collectif, ascenseur, espaces verts, gardiennage. Vous êtes en droit de demander les justificatifs de charges chaque année.' },
    ],
  },

  'visite-appartement-questions': {
    intro: 'Une visite dure en moyenne 20 à 30 minutes. C\'est peu pour évaluer un logement où vous vivrez peut-être plusieurs années. Préparez ces 20 questions avant de sonner à la porte — elles vous éviteront de mauvaises surprises.',
    sections: [
      { type: 'h2', content: 'Sur les charges et les coûts réels' },
      { type: 'numbered', items: [
        'Quel est le montant exact des charges mensuelles, et sont-elles forfaitaires ou réelles ?',
        'Quel était le montant de la dernière régularisation de charges (en plus ou en moins) ?',
        'Quel est le montant moyen des factures d\'énergie ? (EDF/Engie selon mode de chauffage)',
        'Y a-t-il une taxe d\'ordures ménagères ? Est-elle incluse dans les charges ?',
        'Quelle est la performance énergétique du logement (DPE) ? (lettre A à G)',
      ]},
      { type: 'tip', content: 'Un logement classé F ou G sera soumis à des restrictions de location dès 2028 (loi Climat). Vérifiez le DPE avant de vous engager : des travaux pourraient être imposés au propriétaire.' },
      { type: 'h2', content: 'Sur l\'état du logement' },
      { type: 'numbered', items: [
        '6. Y a-t-il des traces d\'humidité, de moisissures ou d\'infiltrations ?',
        '7. Depuis quand le logement est-il vacant ? (long délai = signal d\'alerte)',
        '8. Y a-t-il eu des travaux récents ? Quels travaux sont prévus dans la copropriété ?',
        '9. Les fenêtres sont-elles en double vitrage ? De quelle année date l\'installation ?',
        '10. Le chauffage est-il individuel ou collectif ? Peut-on régler la température ?',
      ]},
      { type: 'h2', content: 'Sur le voisinage et l\'immeuble' },
      { type: 'numbered', items: [
        '11. Qui sont les voisins directs (famille, étudiant, personne âgée) ?',
        '12. Y a-t-il des nuisances sonores connues (restaurant, bar, école à proximité) ?',
        '13. À quelle heure passent les éboueurs ? Y a-t-il des conteneurs devant l\'immeuble ?',
        '14. Y a-t-il un digicode, une gardienne ou un interphone ? Fonctionne-t-il ?',
        '15. Quelle est la situation de la copropriété ? Y a-t-il des procédures en cours ?',
      ]},
      { type: 'h2', content: 'Sur le bail et les conditions' },
      { type: 'numbered', items: [
        '16. Quelle est la date de disponibilité exacte ?',
        '17. Acceptez-vous les animaux ? Avez-vous des exigences particulières ?',
        '18. Quel est le délai pour obtenir une réponse une fois le dossier déposé ?',
        '19. Les meubles (si meublé) sont-ils inclus dans l\'inventaire du bail ?',
        '20. Avez-vous des projets de vente à court ou moyen terme ?',
      ]},
      { type: 'warning', content: 'Si le propriétaire refuse de répondre à des questions légitimes comme le montant des charges ou la date du dernier DPE, c\'est un signal d\'alarme. Ces informations doivent légalement figurer dans l\'annonce ou être communiquées à la visite.' },
      { type: 'h2', content: 'Ce que vous devez observer vous-même' },
      { type: 'checklist', items: [
        'Tester tous les robinets et la pression de l\'eau',
        'Vérifier les prises électriques et les interrupteurs',
        'Ouvrir les placards et vérifier l\'état des cloisons',
        'Tester la connexion mobile (signal 4G/5G dans les pièces)',
        'Observer depuis la fenêtre l\'environnement immédiat (bâtiment voisin, lumière, vis-à-vis)',
        'Vérifier le fonctionnement du chauffage et de l\'eau chaude',
      ]},
    ],
  },

  'droits-locataire': {
    intro: 'Locataire, vous n\'êtes pas sans défense. La loi du 6 juillet 1989 et la loi ALUR de 2014 vous accordent des protections solides, que beaucoup de locataires ignorent. Voici les droits essentiels à connaître pour vous protéger au quotidien.',
    sections: [
      { type: 'h2', content: 'Le droit à un logement décent' },
      { type: 'p', content: 'Votre propriétaire est légalement tenu de vous louer un logement décent. Le logement doit respecter des critères précis fixés par le décret du 30 janvier 2002 : superficie minimale (9m² avec 2,20m de hauteur), absence de risque pour la sécurité physique, absence d\'animaux nuisibles, alimentation en eau potable, évacuation des eaux usées, chauffage fonctionnel, et éclairage naturel.' },
      { type: 'warning', content: 'Si votre logement ne remplit pas ces critères, vous pouvez envoyer une mise en demeure au propriétaire par lettre recommandée. En cas d\'inaction, saisir le tribunal judiciaire ou la CAF (qui peut suspendre l\'APL au propriétaire jusqu\'à réalisation des travaux).' },
      { type: 'h2', content: 'Le droit à la tranquillité : l\'inviolabilité du domicile' },
      { type: 'p', content: 'Votre propriétaire ne peut pas entrer dans le logement sans votre accord, même pour y effectuer des réparations. Il doit obtenir votre autorisation préalable, sauf urgence absolue (risque vital, sinistre). Les visites doivent être convenues à l\'avance à une heure raisonnable.' },
      { type: 'info', content: 'Exception : lors d\'une mise en vente ou re-location, le propriétaire peut faire visiter le logement avec votre accord, 2 heures par jour maximum aux jours ouvrables, sauf accord différent avec vous.' },
      { type: 'h2', content: 'Le droit à la jouissance paisible' },
      { type: 'p', content: 'Si des travaux sont réalisés dans le logement par le propriétaire, et qu\'ils durent plus de 21 jours consécutifs, vous avez droit à une réduction de loyer proportionnelle à la durée et à la gêne occasionnée. Si les travaux rendent le logement inhabitable, vous pouvez demander sa résiliation judiciaire.' },
      { type: 'h2', content: 'La protection contre l\'expulsion' },
      { type: 'checklist', items: [
        'Aucune expulsion sans décision de justice rendue par le tribunal judiciaire',
        'Aucune expulsion sans signification par huissier avec délai de 2 mois minimum',
        'Aucune expulsion pendant la trêve hivernale (du 1er novembre au 31 mars)',
        'Relogement obligatoire proposé par la commune si la personne est sans solution',
        'Vous pouvez demander des délais au juge (jusqu\'à 3 ans en cas de bonne foi)',
      ]},
      { type: 'h2', content: 'Le droit de sous-louer (encadré)' },
      { type: 'p', content: 'Vous ne pouvez sous-louer tout ou partie du logement qu\'avec l\'accord écrit de votre propriétaire. Sans cet accord, la sous-location est illégale et peut justifier une résiliation du bail. Avec accord, le loyer de sous-location ne peut pas dépasser celui que vous payez vous-même.' },
      { type: 'h2', content: 'Le droit de contester le loyer' },
      { type: 'p', content: 'En zone tendue, si votre loyer dépasse le loyer de référence majoré fixé par préfet, vous pouvez saisir la Commission Départementale de Conciliation (CDC) pour obtenir une diminution. Cette démarche est gratuite et préalable à toute action judiciaire.' },
      { type: 'tip', content: 'Conservez TOUS vos échanges avec votre propriétaire (SMS, emails, courriers). En cas de litige, la preuve écrite est déterminante. Envoyez toujours vos demandes importantes par lettre recommandée avec accusé de réception.' },
    ],
  },

  'demenagement-checklist': {
    intro: 'Un déménagement mal préparé génère des complications pendant des semaines — factures qui arrivent à l\'ancienne adresse, abonnements non résiliés, caution retenue. Suivez cette checklist chronologique pour ne rien oublier.',
    sections: [
      { type: 'h2', content: '2 mois avant le départ' },
      { type: 'checklist', items: [
        'Envoyer votre préavis au propriétaire par lettre recommandée avec AR (délai selon zone)',
        'Choisir votre déménageur ou réserver un utilitaire',
        'Commencer à faire des cartons en commençant par les affaires peu utilisées',
        'Demander des devis de déménagement (au moins 3)',
        'Prévoir votre nouveau bail ou compromis de vente',
      ]},
      { type: 'h2', content: '1 mois avant le départ' },
      { type: 'checklist', items: [
        'Déclarer votre changement d\'adresse sur service-public.fr (redirige le courrier 1 an)',
        'Prévenir votre employeur pour le bulletin de paie',
        'Informer votre banque et mettre à jour vos coordonnées',
        'Contacter EDF/Engie pour la résiliation et le transfert de contrat',
        'Prévenir votre fournisseur d\'accès Internet (résiliation avec ou sans portabilité)',
        'Prévenir votre assureur habitation (résiliation ou avenant d\'adresse)',
        'Informer la CAF, la CPAM, Pôle Emploi si besoin',
        'Prévenir votre mutuelle',
        'Prévenir vos abonnements (presse, streaming, livraison)',
      ]},
      { type: 'h2', content: 'La semaine du déménagement' },
      { type: 'checklist', items: [
        'Relever les compteurs (eau, électricité, gaz) le jour du départ',
        'Prendre des photos de chaque pièce avant de rendre les clés',
        'Réaliser l\'état des lieux de sortie avec le propriétaire (ou huissier)',
        'Récupérer le document signé de l\'état des lieux de sortie',
        'Rendre toutes les clés, badges, télécommandes, cartes de parking',
        'Vider et nettoyer tous les espaces (cave, grenier, parking inclus)',
        'Demander une attestation de restitution des clés',
      ]},
      { type: 'warning', content: 'Ne partez jamais sans un état des lieux de sortie signé des deux parties. Sans ce document, vous ne pouvez pas contester les éventuelles retenues sur caution. Si le propriétaire refuse de le faire, faites-le établir par huissier.' },
      { type: 'h2', content: 'Après le déménagement : récupérer la caution' },
      { type: 'p', content: 'Le propriétaire dispose de 1 mois (si EDL conforme) ou 2 mois (si retenues) pour rembourser votre dépôt de garantie. Il doit vous envoyer un justificatif pour chaque retenue (devis ou facture).' },
      { type: 'numbered', items: [
        'Vérifiez que les retenues correspondent à des dommages constatés dans l\'EDL de sortie',
        'Distinguez usure normale (non déductible) des dégradations (déductibles)',
        'Si vous contestez : envoyez un courrier RAR dans les 2 mois après réception du décompte',
        'En cas de désaccord persistant : saisir la CDC (gratuit) puis le tribunal judiciaire',
        'Après le délai légal sans remboursement : le propriétaire doit 10% du loyer par mois de retard',
      ]},
      { type: 'tip', content: 'Photographiez l\'état de chaque mur, sol, équipement à l\'entrée ET à la sortie. Datez vos photos automatiquement avec votre smartphone. Ces images constituent une preuve incontestable en cas de litige.' },
    ],
  },

  'loyer-charges-comprises': {
    intro: 'Le loyer "charges comprises" (CC) est partout dans les annonces, mais que recouvre-t-il exactement ? Et surtout, que peut-on vous demander de payer au-delà ? Décryptage pour éviter les mauvaises surprises en fin d\'année.',
    sections: [
      { type: 'h2', content: 'Loyer HC vs CC : la différence fondamentale' },
      { type: 'p', content: 'Le loyer hors charges (HC) est la part pure du loyer. Les charges sont les dépenses liées à l\'usage de l\'immeuble : entretien des parties communes, eau froide collective, gardiennage, ascenseur, espaces verts, chauffage collectif, etc. Le loyer charges comprises (CC) additionne les deux.' },
      { type: 'info', content: 'Pour comparer deux annonces, comparez toujours le loyer HC + une estimation réelle des charges, pas uniquement le CC affiché. Une provision de charges basse peut masquer une régularisation lourde en fin d\'année.' },
      { type: 'h2', content: 'Charges forfaitaires vs charges réelles' },
      { type: 'p', content: 'En location meublée, les charges peuvent être forfaitaires : le montant est fixe, pas de régularisation, aucun justificatif exigible. En location vide, les charges sont obligatoirement des provisions sur charges réelles : le propriétaire estime vos charges chaque mois, puis régularise une fois par an en fonction des dépenses réelles de l\'immeuble.' },
      { type: 'checklist', items: [
        'Provisions > dépenses réelles → vous recevez un remboursement',
        'Provisions < dépenses réelles → vous devez payer le complément',
        'Le propriétaire doit vous fournir un décompte détaillé 1 mois avant la régularisation',
        'Vous avez le droit de consulter les pièces justificatives pendant 6 mois après envoi du décompte',
        'Délai de prescription pour réclamer une régularisation : 3 ans',
      ]},
      { type: 'h2', content: 'Ce que le propriétaire peut récupérer' },
      { type: 'p', content: 'Les charges récupérables sont listées de manière limitative par le décret n°87-713 du 26 août 1987. Parmi elles : eau froide et chaude collective, entretien des parties communes, chauffage collectif, ascenseur, taxe d\'enlèvement des ordures ménagères (TEOM), gardiennage partiel.' },
      { type: 'warning', content: 'Les charges NON récupérables que le propriétaire ne peut pas vous facturer : gros travaux de structure (ravalement, toiture), remplacement de chaudière collective vétuste, assurance de l\'immeuble, frais de gestion de l\'agence, taxe foncière.' },
      { type: 'h2', content: 'Comment contester une régularisation' },
      { type: 'numbered', items: [
        'Demandez les justificatifs : relevés de charges, contrats de prestataires, factures',
        'Vérifiez que les postes facturés figurent bien dans le décret de 1987',
        'Comparez le montant qui vous est imputé à votre quote-part (selon la clé de répartition)',
        'Si vous constatez une anomalie, envoyez un courrier RAR dans les 6 mois du décompte',
        'En cas de désaccord persistant, saisir la CDC puis le tribunal judiciaire',
      ]},
      { type: 'tip', content: 'Conservez vos avis d\'écheance et vos quittances de loyer pendant toute la durée du bail et 3 ans après le départ. Ces documents font foi en cas de contestation de régularisation tardive.' },
    ],
  },

  'fixer-bon-loyer': {
    intro: 'Un loyer trop élevé laisse le logement vacant des semaines et génère plus de pertes qu\'un loyer ajusté. Un loyer trop bas sous-évalue votre patrimoine. Voici les méthodes pour trouver le juste prix, et les règles légales à connaître.',
    sections: [
      { type: 'h2', content: 'La méthode comparative (la plus fiable)' },
      { type: 'p', content: 'La méthode la plus simple est d\'observer les loyers pratiqués pour des biens similaires dans votre quartier : même surface, même standing, mêmes équipements. Consultez les annonces actives sur les plateformes, et filtrez celles déjà louées ou retirées pour avoir une idée des prix qui "fonctionnent" réellement.' },
      { type: 'checklist', items: [
        'Superficie (m² habitables — balcon et cave ne comptent pas)',
        'Étage et présence d\'ascenseur',
        'Exposition et luminosité',
        'État général et année de rénovation',
        'Équipements (cuisine équipée, parking, cave, digicode)',
        'Distance des transports et commerces',
      ]},
      { type: 'h2', content: 'L\'encadrement des loyers en zone tendue' },
      { type: 'p', content: 'Dans les communes en zone tendue (Paris, Lille, Lyon, Bordeaux, Montpellier, Grenoble, Strasbourg et d\'autres), un dispositif d\'encadrement plafonne les loyers à un loyer de référence majoré. Ce loyer de référence est fixé par arrêté préfectoral et varie selon le quartier, la surface, l\'époque de construction et le nombre de pièces.' },
      { type: 'warning', content: 'En zone tendue, dépasser le loyer de référence majoré expose à une amende de 5 000 € (personne physique) ou 15 000 € (personne morale). Le locataire peut en outre demander une réduction de loyer devant le tribunal.' },
      { type: 'h2', content: 'La règle des 3x le loyer : vérité et nuances' },
      { type: 'p', content: 'La règle informelle veut que le propriétaire exige des revenus égaux à 3 fois le loyer. Ce seuil n\'est pas légalement imposé — c\'est une pratique du marché. Pour un loyer de 900€ CC, cela correspond à 2 700€ nets mensuels. En dehors de Paris, la règle est souvent appliquée plus souplement, surtout si le dossier est solide.' },
      { type: 'h2', content: 'Ajuster en fonction des saisons' },
      { type: 'p', content: 'Le marché locatif est saisonnier. Septembre-octobre et janvier-février sont les périodes les plus actives (rentrée, nouvelle année). Publiez à ces moments pour maximiser votre audience. En été et fin décembre, les candidatures sont rares — soit vous attendez, soit vous consentez un loyer légèrement plus attractif pour ne pas laisser le bien vacant.' },
      { type: 'tip', content: 'Chaque mois de vacance locative représente 1/12e de vos revenus annuels perdus. Un loyer 5% en dessous du marché pour trouver un bon locataire rapidement est souvent plus rentable qu\'un loyer optimal avec 6 semaines de vacance.' },
      { type: 'h2', content: 'La révision annuelle : anticipez-la' },
      { type: 'p', content: 'Prévoyez toujours une clause de révision dans le bail. Elle vous permet d\'ajuster le loyer chaque année selon l\'Indice de Référence des Loyers (IRL). Sans cette clause, aucune révision n\'est possible. La révision doit être demandée dans l\'année suivant son terme — passé ce délai, vous perdez le droit de réviser pour l\'année écoulée.' },
    ],
  },

  'choisir-locataire-criteres': {
    intro: 'Choisir son locataire est un droit, mais pas sans limites. La loi encadre strictement les critères de sélection pour éviter toute discrimination. Voici comment évaluer la solvabilité d\'un candidat légalement et efficacement.',
    sections: [
      { type: 'h2', content: 'Les critères légaux de sélection' },
      { type: 'p', content: 'Vous pouvez légitimement sélectionner un locataire sur la base de sa capacité financière à payer le loyer. Sont autorisés : revenus, garanties (garant, assurance), stabilité professionnelle, et les documents prévus par la liste légale.' },
      { type: 'warning', content: 'La loi du 6 juillet 1989 interdit formellement de refuser un candidat en raison de son origine, prénom, adresse, orientation sexuelle, situation de famille, état de grossesse, handicap, opinions politiques ou syndicales, religion, appartenance à une ethnie, nationalité, ou parce qu\'il est bénéficiaire d\'APL.' },
      { type: 'h2', content: 'Évaluer la solvabilité : le ratio revenus/loyer' },
      { type: 'p', content: 'La règle des 3x le loyer est la plus courante. Elle est un indicateur, pas une obligation légale. Un candidat avec 2,8x le loyer mais un CDI dans une grande entreprise peut être plus fiable qu\'un candidat à 3,5x avec des revenus variables.' },
      { type: 'checklist', items: [
        'CDI ou fonctionnaire : stabilité maximale, critère solide',
        'CDD ou intérimaire : vérifiez la continuité des contrats et l\'ancienneté dans le secteur',
        'Indépendant/auto-entrepreneur : demandez 2 ans de bilans ou relevés de CA',
        'Retraité : revenus stables — la règle des 3x peut être assouplie',
        'Étudiant sans revenus : un garant solide (parent avec revenus ≥ 4x le loyer) est indispensable',
      ]},
      { type: 'h2', content: 'La garantie : personne physique ou Visale ?' },
      { type: 'p', content: 'Si le candidat propose un garant physique, demandez un dossier complet (pièce d\'identité, avis d\'imposition, 3 bulletins de salaire). Assurez-vous que ses revenus couvrent au moins 3x le loyer. La garantie Visale (Action Logement) est une alternative solide : elle est gratuite pour vous et couvre les impayés jusqu\'à 36 mois.' },
      { type: 'info', content: 'Vous ne pouvez pas cumuler une garantie Visale et une garantie physique (sauf si l\'un des candidats est étudiant ou apprenti). C\'est légalement interdit depuis la loi Elan.' },
      { type: 'h2', content: 'Comment départager plusieurs bons dossiers' },
      { type: 'numbered', items: [
        'Priorité au dossier le plus complet et le mieux présenté',
        'Stabilité professionnelle sur les revenus bruts (préférez un CDI à 2 500€ à un free-lance à 3 500€)',
        'Cohérence du projet : locataire qui déménage pour un emploi vs situation instable',
        'Lettre de motivation sincère et personnalisée (signe de sérieux)',
        'Références de précédents propriétaires (si disponibles)',
      ]},
      { type: 'tip', content: 'N\'hésitez pas à appeler le précédent propriétaire dont le nom figure sur les quittances de loyer fournies. Un simple coup de fil de 2 minutes peut révéler des informations décisives sur le comportement passé du locataire.' },
    ],
  },

  'rediger-annonce-attire': {
    intro: 'Une annonce avec de bonnes photos et une description bien rédigée génère 3 fois plus de contacts qu\'une annonce bâclée. Voici les techniques des professionnels de l\'immobilier pour mettre votre bien en valeur et attirer des candidats qualifiés.',
    sections: [
      { type: 'h2', content: 'Les photos : la première impression qui compte' },
      { type: 'p', content: 'Les photos sont le premier filtre. Un candidat passera moins de 3 secondes sur votre annonce si les photos sont sombres ou mal cadrées. Investissez du temps dans cette étape : c\'est elle qui décide si on clique ou non.' },
      { type: 'checklist', items: [
        'Photographiez en journée avec lumière naturelle maximale',
        'Rangez et dépersonnalisez le logement avant de photographier',
        'Commencez par la pièce de vie principale (salon ou cuisine ouverte)',
        'Incluez une photo de chaque pièce, même petite',
        'Photographiez depuis l\'angle le plus large (coin de la pièce)',
        'Ajoutez une photo de la façade de l\'immeuble et du quartier',
        'En cas de vue dégagée ou terrasse, c\'est votre atout n°1 — mettez-le en avant',
      ]},
      { type: 'tip', content: 'Évitez les photos de nuit, les miroirs qui révèlent le photographe, les photos en portrait (vertical) — préférez le mode paysage. Pas besoin d\'appareil photo professionnel : un smartphone récent en mode portrait et bonne lumière suffit.' },
      { type: 'h2', content: 'Le titre : concis et factuel' },
      { type: 'p', content: 'Un bon titre doit contenir les informations clés que les candidats filtrent : surface, type, localisation, équipement différenciant. Évitez les superlatifs vides ("magnifique", "exceptionnel") au profit de faits.' },
      { type: 'info', content: 'Exemples de titres efficaces : "T2 40m² lumineux – métro Voltaire – cave" / "Studio meublé 28m² – Haussmannien – charges comprises" / "3 pièces 65m² avec balcon – quartier Montmartre"' },
      { type: 'h2', content: 'La description : structurée et honnête' },
      { type: 'p', content: 'Rédigez votre description en 3 parties : d\'abord le logement (surface, pièces, équipements), ensuite l\'immeuble et les prestations, enfin le quartier et les transports. Soyez précis sur les charges, le type de chauffage et la présence d\'un parking ou cave.' },
      { type: 'numbered', items: [
        'Surface habitable exacte en m² (pas approximative)',
        'Nombre de pièces et leur usage',
        'Équipements cuisine, salle de bain, rangements',
        'Type de chauffage (électrique, gaz, collectif)',
        'Étage et présence d\'ascenseur',
        'Exposition et luminosité',
        'Charges et ce qu\'elles incluent',
        'Transports et commerces à proximité (distances précises)',
      ]},
      { type: 'h2', content: 'Ce qu\'il faut afficher obligatoirement' },
      { type: 'warning', content: 'La loi impose d\'indiquer dans l\'annonce : le loyer mensuel et les charges, le montant du dépôt de garantie, la surface habitable en m², la classe énergie (DPE) et le montant estimé des factures d\'énergie. Une annonce sans ces informations est non-conforme.' },
    ],
  },

  'fiscalite-locative': {
    intro: 'Les revenus locatifs sont imposés, mais pas de la même manière selon votre statut et le régime fiscal choisi. Bien comprendre ces mécanismes peut légalement diviser votre facture fiscale par deux. Tour d\'horizon complet des options disponibles.',
    sections: [
      { type: 'h2', content: 'Location vide : micro-foncier ou régime réel ?' },
      { type: 'p', content: 'Si vos revenus locatifs annuels sont inférieurs à 15 000€, vous êtes automatiquement au régime micro-foncier : 30% d\'abattement forfaitaire sur les loyers perçus, sans avoir à justifier vos charges. Au-delà de 15 000€, ou si vous le souhaitez en dessous, vous pouvez opter pour le régime réel.' },
      { type: 'info', content: 'Régime réel = vous déduisez les charges réelles (travaux, intérêts d\'emprunt, assurance, taxe foncière, frais de gestion). Si vos charges dépassent 30% des loyers, le régime réel est plus avantageux. L\'option est irrévocable pendant 3 ans.' },
      { type: 'h2', content: 'Le déficit foncier : un levier puissant' },
      { type: 'p', content: 'En régime réel, si vos charges (hors intérêts d\'emprunt) dépassent vos loyers, vous générez un déficit foncier. Ce déficit est déductible de votre revenu global jusqu\'à 10 700€ par an, ce qui réduit votre impôt sur le revenu global. Le surplus est reportable sur les revenus fonciers des 10 années suivantes.' },
      { type: 'checklist', items: [
        'Travaux de réparation, entretien et amélioration (pas construction ou agrandissement)',
        'Primes d\'assurance (PNO, garantie loyers impayés)',
        'Taxe foncière (hors TEOM en zone tendue)',
        'Intérêts d\'emprunt (uniquement déductibles des revenus fonciers, pas du revenu global)',
        'Frais de gestion locative ou d\'agence',
        'Honoraires comptables liés aux revenus fonciers',
      ]},
      { type: 'h2', content: 'LMNP : location meublée non professionnelle' },
      { type: 'p', content: 'Si vous louez un bien meublé (avec liste minimale d\'équipements imposée), vos revenus sont des Bénéfices Industriels et Commerciaux (BIC), pas des revenus fonciers. Le régime micro-BIC offre 50% d\'abattement forfaitaire. Le régime réel vous permet en plus d\'amortir le bien et le mobilier — souvent la solution la plus optimisée.' },
      { type: 'tip', content: 'L\'amortissement LMNP est le mécanisme le plus puissant : vous déduisez chaque année une fraction du prix du bien (sur 25-40 ans) et du mobilier (sur 5-10 ans), sans dépense réelle. Résultat : des revenus locatifs quasiment non imposés pendant 10-20 ans.' },
      { type: 'h2', content: 'Les prélèvements sociaux' },
      { type: 'p', content: 'En plus de l\'IR, vos revenus fonciers sont soumis aux prélèvements sociaux à 17,2% (dont CSG 9,2% et CRDS 0,5%). Ces prélèvements s\'appliquent sur le revenu net imposable, après abattement ou déduction des charges selon le régime choisi.' },
      { type: 'h2', content: 'SCI : quand ça vaut le coup' },
      { type: 'p', content: 'La Société Civile Immobilière (SCI) à l\'IR n\'offre pas d\'avantage fiscal particulier pour un particulier seul, mais facilite la transmission du patrimoine (abattements donation, démembrement) et simplifie la gestion multi-propriétaires. La SCI à l\'IS permet l\'amortissement mais crée une imposition à la revente (sur la plus-value comptable).' },
      { type: 'warning', content: 'La fiscalité locative est un domaine complexe qui évolue chaque année (lois de finances). Pour les patrimoines significatifs, consultez un expert-comptable spécialisé immobilier ou un notaire. Les économies réalisées avec une optimisation professionnelle dépassent largement les honoraires.' },
    ],
  },

  'etat-des-lieux': {
    intro: 'L\'état des lieux est le document clé de votre relation bailleur-locataire. Bien réalisé à l\'entrée, il vous protège à la sortie. Bâclé, il ouvre la porte aux litiges sur le dépôt de garantie. Mode d\'emploi complet.',
    sections: [
      { type: 'h2', content: 'L\'état des lieux d\'entrée : soyez méticuleux' },
      { type: 'p', content: 'L\'état des lieux d\'entrée doit être réalisé contradictoirement (en présence des deux parties) le jour de la remise des clés, ou au plus tard lors de la prise de possession. Il doit décrire précisément l\'état de chaque élément du logement.' },
      { type: 'checklist', items: [
        'Vérifiez chaque pièce dans l\'ordre : séjour, chambre(s), cuisine, salle de bain, WC, dégagements',
        'Notez l\'état des murs (traces, taches, trous), sols (rayures, usure) et plafonds (fissures)',
        'Testez chaque équipement : volets, serrures, robinets, chasse d\'eau, VMC',
        'Relevez les compteurs (eau, gaz, électricité) et notez les valeurs',
        'Photographiez systématiquement chaque anomalie notée',
        'Listez tous les équipements fournis (électroménager, luminaires, meubles si meublé)',
        'Ne signez pas sous pression : prenez le temps qu\'il faut',
      ]},
      { type: 'tip', content: 'En cas de désaccord sur un point, notez-le explicitement dans l\'EDL : "le locataire conteste l\'état du parquet". Un document signé avec réserves vaut mieux qu\'un document refusé.' },
      { type: 'h2', content: 'Que faire si l\'état des lieux révèle des défauts à l\'entrée ?' },
      { type: 'p', content: 'Si vous constatez des défauts non mentionnés dans l\'état des lieux après votre installation (humidité apparue après chauffage, tache invisible sous la moquette…), vous avez 10 jours après la remise des clés pour compléter l\'état des lieux d\'entrée par lettre RAR.' },
      { type: 'info', content: 'Pour les problèmes de chauffage, ce délai est étendu au premier mois de la période de chauffe si l\'entrée se fait hors saison.' },
      { type: 'h2', content: 'L\'état des lieux de sortie : enjeux financiers' },
      { type: 'p', content: 'L\'état des lieux de sortie est comparé avec celui d\'entrée pour identifier les dégradations imputables au locataire. La distinction essentielle est celle entre l\'usure normale (non déductible du dépôt) et les dégradations (déductibles).' },
      { type: 'numbered', items: [
        'Usure normale : peinture jaunie avec le temps, parquet légèrement terni, joints de salle de bain usés',
        'Dégradation : trou dans le mur, tache brûlée sur le parquet, vitre cassée, moisissures par manque de ventilation',
        'La grille de vétusté (si prévue au bail) plafonne les retenues selon l\'ancienneté des revêtements',
        'Sans grille, le juge apprécie au cas par cas selon l\'ancienneté des éléments',
      ]},
      { type: 'h2', content: 'En cas de désaccord à la sortie' },
      { type: 'p', content: 'Si le propriétaire retient une partie du dépôt sans justificatif ou pour une usure normale, contestez par courrier RAR dans les 2 mois. Joignez vos photos comparatives entrée/sortie. En cas d\'échec, saisissez la Commission Départementale de Conciliation (gratuit) avant tout recours judiciaire.' },
      { type: 'warning', content: 'Si le propriétaire ne se présente pas à l\'état des lieux de sortie et ne mandate personne, envoyez-lui une mise en demeure par RAR. Sans EDL de sortie signé, il perd le droit de retenir quoi que ce soit sur le dépôt de garantie.' },
    ],
  },

  'charges-recuperables': {
    intro: 'En tant que propriétaire, vous pouvez récupérer sur votre locataire uniquement les charges listées par le décret du 26 août 1987. Cette liste est limitative : toute charge hors liste reste à votre charge. Voici ce que vous pouvez légalement refacturer.',
    sections: [
      { type: 'h2', content: 'Les grandes catégories de charges récupérables' },
      { type: 'p', content: 'Le décret n°87-713 du 26 août 1987 établit la liste exhaustive des charges locatives récupérables. Elle couvre 6 grandes catégories : ascenseurs et monte-charge, eau froide et chaude, chauffage collectif, parties communes intérieures, espaces extérieurs et hygiène, et taxes et redevances.' },
      { type: 'h2', content: '1. Eau froide, eau chaude et chauffage collectif' },
      { type: 'checklist', items: [
        'Eau froide : consommation collective, entretien des installations, location compteurs',
        'Eau chaude sanitaire collective : consommation + entretien de la chaudière collective',
        'Chauffage collectif : combustible, exploitation et entretien de la chaufferie',
        'Robinets thermostatiques : achat et pose inclus',
        'Purges, vidanges, réglages de saison',
      ]},
      { type: 'h2', content: '2. Ascenseurs et monte-charge' },
      { type: 'checklist', items: [
        'Électricité de l\'ascenseur',
        'Fournitures nécessaires à l\'entretien et au fonctionnement',
        'Contrat d\'entretien préventif (hors grosses réparations)',
        'Petites réparations consécutives à l\'usure normale (non grosses pièces)',
        'Frais de visite de contrôle obligatoire',
      ]},
      { type: 'h2', content: '3. Parties communes intérieures' },
      { type: 'checklist', items: [
        'Électricité des parties communes (couloirs, caves, parkings)',
        'Produits d\'entretien et matériel de nettoyage',
        'Rémunération du personnel d\'entretien (sauf si déjà dans charges gardien)',
        'Entretien des tapis et moquettes des parties communes',
        'Peinture des parties communes si dégradation locative',
      ]},
      { type: 'h2', content: '4. Espaces extérieurs et espaces verts' },
      { type: 'checklist', items: [
        'Entretien des allées, cours, parkings (balayage, arrosage)',
        'Entretien des espaces verts (tonte, taille, désherbage)',
        'Entretien des aires de jeux et mobilier urbain commun',
        'Arrosage et produits d\'entretien des espaces verts',
      ]},
      { type: 'h2', content: '5. Taxes récupérables' },
      { type: 'p', content: 'Deux taxes sont récupérables sur le locataire : la Taxe d\'Enlèvement des Ordures Ménagères (TEOM), qui figure sur votre avis de taxe foncière, et la redevance d\'assainissement si elle existe dans votre commune.' },
      { type: 'warning', content: 'La taxe foncière en elle-même n\'est PAS récupérable. Seule la TEOM (ligne distincte sur l\'avis) l\'est. Erreur fréquente : répercuter la totalité de la taxe foncière sur le locataire. C\'est illégal.' },
      { type: 'h2', content: 'Ce que vous ne pouvez PAS récupérer' },
      { type: 'numbered', items: [
        'Gros travaux de structure : ravalement, réfection de toiture, remplacement de chaudière vétuste',
        'Assurance de l\'immeuble ou PNO (assurance propriétaire non-occupant)',
        'Honoraires d\'agence ou de gestion locative',
        'Frais de procédure judiciaire contre le locataire',
        'Remplacement de l\'ascenseur (mais entretien courant oui)',
        'Taxe foncière (hors TEOM)',
      ]},
      { type: 'tip', content: 'Chaque année, envoyez à votre locataire un décompte détaillé par poste de charges accompagné des justificatifs. Ce geste de transparence évite les contestations et instaure une relation de confiance durable.' },
    ],
  },
}

// ─── Sous-composants de rendu ──────────────────────────────────────────────────

function RenderSection({ section }: { section: Section }) {
  switch (section.type) {
    case 'h2':
      return (
        <h2 style={{
          fontFamily: BAI.fontDisplay,
          fontSize: 'clamp(20px, 3vw, 26px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: BAI.ink,
          marginTop: 40,
          marginBottom: 14,
          lineHeight: 1.25,
          paddingBottom: 10,
          borderBottom: `2px solid ${BAI.border}`,
        }}>
          {section.content}
        </h2>
      )

    case 'h3':
      return (
        <h3 style={{
          fontFamily: BAI.fontDisplay,
          fontSize: 'clamp(17px, 2.5vw, 21px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: BAI.ink,
          marginTop: 24,
          marginBottom: 10,
          lineHeight: 1.3,
        }}>
          {section.content}
        </h3>
      )

    case 'p':
      return (
        <p style={{
          fontFamily: BAI.fontBody,
          fontSize: 'clamp(14px, 1.6vw, 16px)',
          color: BAI.inkMid,
          lineHeight: 1.75,
          marginBottom: 16,
        }}>
          {section.content}
        </p>
      )

    case 'tip':
      return (
        <div style={{
          background: BAI.tenantLight,
          border: `1px solid ${BAI.tenantBorder}`,
          borderLeft: `4px solid ${BAI.tenant}`,
          borderRadius: '0 8px 8px 0',
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}>
          <CheckCircle size={18} style={{ color: BAI.tenant, flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, lineHeight: 1.65, margin: 0 }}>
            <strong>Conseil : </strong>{section.content}
          </p>
        </div>
      )

    case 'warning':
      return (
        <div style={{
          background: BAI.errorLight,
          border: `1px solid #fca5a5`,
          borderLeft: `4px solid ${BAI.error}`,
          borderRadius: '0 8px 8px 0',
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}>
          <AlertCircle size={18} style={{ color: BAI.error, flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, lineHeight: 1.65, margin: 0 }}>
            <strong>Attention : </strong>{section.content}
          </p>
        </div>
      )

    case 'info':
      return (
        <div style={{
          background: BAI.caramelLight,
          border: `1px solid ${BAI.caramelBorder}`,
          borderLeft: `4px solid ${BAI.caramel}`,
          borderRadius: '0 8px 8px 0',
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}>
          <Info size={18} style={{ color: BAI.caramel, flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, lineHeight: 1.65, margin: 0 }}>
            {section.content}
          </p>
        </div>
      )

    case 'checklist':
      return (
        <ul style={{ margin: '0 0 20px 0', padding: 0, listStyle: 'none' }}>
          {section.items?.map((item, i) => (
            <li key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '8px 0',
              borderBottom: `1px solid ${BAI.border}`,
              fontFamily: BAI.fontBody,
              fontSize: 'clamp(13px, 1.5vw, 15px)',
              color: BAI.inkMid,
              lineHeight: 1.6,
            }}>
              <div style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: BAI.caramelLight,
                border: `1px solid ${BAI.caramelBorder}`,
                flexShrink: 0,
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: BAI.caramel }} />
              </div>
              {item}
            </li>
          ))}
        </ul>
      )

    case 'numbered':
      return (
        <ol style={{ margin: '0 0 20px 0', padding: 0, listStyle: 'none', counterReset: 'step' }}>
          {section.items?.map((item, i) => (
            <li key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: '10px 0',
              borderBottom: `1px solid ${BAI.border}`,
              fontFamily: BAI.fontBody,
              fontSize: 'clamp(13px, 1.5vw, 15px)',
              color: BAI.inkMid,
              lineHeight: 1.6,
            }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: BAI.night,
                color: '#fff',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: BAI.fontBody,
                marginTop: 1,
              }}>
                {i + 1}
              </div>
              {item}
            </li>
          ))}
        </ol>
      )

    default:
      return null
  }
}

// ─── Articles connexes ─────────────────────────────────────────────────────────

function RelatedArticles({ current }: { current: ArticleMeta }) {
  const navigate = useNavigate()
  const related = ARTICLES_META.filter(a => a.slug !== current.slug && a.role === current.role).slice(0, 3)

  return (
    <div style={{
      background: BAI.bgMuted,
      borderTop: `1px solid ${BAI.border}`,
      padding: 'clamp(32px, 5vw, 56px) clamp(16px, 5vw, 48px)',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <p style={{
          fontFamily: BAI.fontBody,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: BAI.caramel,
          marginBottom: 6,
        }}>
          Continuer la lecture
        </p>
        <h2 style={{
          fontFamily: BAI.fontDisplay,
          fontSize: 'clamp(20px, 3vw, 26px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: BAI.ink,
          marginBottom: 24,
        }}>
          Articles connexes
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))',
          gap: 16,
        }}>
          {related.map(article => (
            <div
              key={article.slug}
              onClick={() => navigate(`/guide/${article.slug}`)}
              style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 10,
                padding: 16,
                cursor: 'pointer',
                transition: BAI.transition,
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = BAI.caramel
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = BAI.shadowMd
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = BAI.border
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
              }}
            >
              <span style={{
                display: 'inline-block',
                background: article.tagColor.bg,
                color: article.tagColor.color,
                border: `1px solid ${article.tagColor.border}`,
                borderRadius: 4,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.10em',
                padding: '2px 7px',
                fontFamily: BAI.fontBody,
                marginBottom: 8,
              }}>
                {article.tag}
              </span>
              <p style={{
                fontFamily: BAI.fontDisplay,
                fontSize: 15,
                fontWeight: 700,
                fontStyle: 'italic',
                color: BAI.ink,
                lineHeight: 1.35,
                margin: '0 0 8px',
              }}>
                {article.title}
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: BAI.fontBody,
                  fontSize: 11,
                  color: BAI.inkFaint,
                }}>
                  <Clock size={11} />
                  {article.readTime} min
                </span>
                <ChevronRight size={14} style={{ color: BAI.caramel }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page article ──────────────────────────────────────────────────────────────

export default function GuideArticle() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const meta = ARTICLES_META.find(a => a.slug === slug)
  const content = slug ? ARTICLES_CONTENT[slug] : undefined

  if (!meta || !content) {
    return (
      <Layout>
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily: BAI.fontBody,
          color: BAI.inkMid,
          padding: '40px 16px',
        }}>
          <p style={{ fontSize: 14 }}>Article introuvable.</p>
          <button
            onClick={() => navigate('/guide')}
            style={{
              background: BAI.night,
              color: '#fff',
              border: 'none',
              borderRadius: BAI.radius,
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: BAI.fontBody,
            }}
          >
            Retour au guide
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh' }}>

        {/* Hero image + overlay */}
        <div style={{ position: 'relative', height: 'clamp(260px, 45vw, 420px)', overflow: 'hidden' }}>
          <img
            src={meta.image}
            alt={meta.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(15,12,26,0.35) 0%, rgba(15,12,26,0.72) 100%)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 'clamp(20px, 4vw, 40px) clamp(16px, 5vw, 48px)',
            maxWidth: 920,
            margin: '0 auto',
          }}>
            {/* Back link */}
            <Link
              to="/guide"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: BAI.fontBody,
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                marginBottom: 16,
                transition: BAI.transition,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >
              <ArrowLeft size={14} />
              Guide Bailio
            </Link>

            {/* Tag + read time — glass style */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.10em',
                padding: '5px 12px',
                fontFamily: BAI.fontBody,
                color: '#ffffff',
              }}>
                <Tag size={9} style={{ display: 'inline', marginRight: 4 }} />
                {meta.tag}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: 8,
                padding: '5px 12px',
                fontFamily: BAI.fontBody,
                fontSize: 12,
                color: 'rgba(255,255,255,0.8)',
              }}>
                <Clock size={12} />
                {meta.readTime} min de lecture
              </span>
              <span style={{
                fontFamily: BAI.fontBody,
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
              }}>
                Mis à jour : {meta.updatedAt}
              </span>
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: BAI.fontDisplay,
              fontSize: 'clamp(22px, 4.5vw, 38px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#ffffff',
              lineHeight: 1.2,
              margin: 0,
              maxWidth: 700,
            }}>
              {meta.title}
            </h1>
          </div>
        </div>

        {/* Article body */}
        <div style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: 'clamp(28px, 5vw, 56px) clamp(16px, 5vw, 40px)',
        }}>

          {/* Intro */}
          <p style={{
            fontFamily: BAI.fontBody,
            fontSize: 'clamp(15px, 1.8vw, 17px)',
            color: BAI.ink,
            lineHeight: 1.75,
            fontWeight: 500,
            marginBottom: 32,
            paddingBottom: 28,
            borderBottom: `2px solid ${BAI.border}`,
          }}>
            {content.intro}
          </p>

          {/* Sections */}
          {content.sections.map((section, i) => (
            <RenderSection key={i} section={section} />
          ))}

          {/* CTA bas d'article */}
          <div style={{
            marginTop: 48,
            padding: 28,
            background: BAI.night,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'flex-start',
          }}>
            <p style={{
              fontFamily: BAI.fontDisplay,
              fontSize: 'clamp(18px, 3vw, 22px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#ffffff',
              margin: 0,
            }}>
              {meta.role === 'tenant'
                ? 'Prêt à trouver votre prochain logement ?'
                : 'Gérez vos biens simplement avec Bailio'}
            </p>
            <p style={{
              fontFamily: BAI.fontBody,
              fontSize: 13,
              color: 'rgba(255,255,255,0.6)',
              margin: 0,
            }}>
              {meta.role === 'tenant'
                ? 'Consultez les annonces de particuliers sans frais d\'agence.'
                : 'Publiez votre annonce, gérez vos candidatures et vos contrats en ligne.'}
            </p>
            <button
              onClick={() => navigate(meta.role === 'tenant' ? '/search' : '/register?role=OWNER')}
              style={{
                background: BAI.caramel,
                color: '#fff',
                border: 'none',
                borderRadius: BAI.radius,
                padding: '11px 22px',
                fontFamily: BAI.fontBody,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              {meta.role === 'tenant' ? 'Voir les annonces' : 'Publier gratuitement'}
            </button>
          </div>
        </div>

        <RelatedArticles current={meta} />
      </div>
    </Layout>
  )
}
