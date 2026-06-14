import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Tag, ChevronRight, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { useSEO } from '../../hooks/useSEO'

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

interface Section {
  type: 'h2' | 'h3' | 'p' | 'tip' | 'warning' | 'info' | 'checklist' | 'numbered' | 'quote'
  content?: string
  items?: string[]
}

interface ArticleContent {
  intro: string
  sections: Section[]
  tips: string[]
  conclusion: string
  jsonLd: object
}

// ─── Metadata catalogue ────────────────────────────────────────────────────────

const ARTICLES_META: ArticleMeta[] = [
  {
    slug: 'dossier-locatif-solide',
    title: 'Comment rédiger un dossier locatif solide',
    description: 'Pièces justificatives, erreurs à éviter, conseils pour maximiser vos chances. Le guide complet pour constituer un dossier locatif solide.',
    tag: 'DOSSIER', readTime: 5, role: 'tenant',
    tagColor: { bg: BAI.tenantLight, color: BAI.tenant, border: BAI.tenantBorder },
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Janvier 2026',
  },
  {
    slug: 'comprendre-bail-loi',
    title: 'Comprendre le bail de location : guide complet loi ALUR',
    description: 'Durée du bail, dépôt de garantie, préavis, charges récupérables, révision du loyer — décryptage complet du contrat de location selon la loi ALUR.',
    tag: 'JURIDIQUE', readTime: 8, role: 'tenant',
    tagColor: { bg: BAI.ownerLight, color: BAI.owner, border: BAI.ownerBorder },
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Février 2026',
  },
  {
    slug: 'visite-appartement-questions',
    title: 'Visite appartement : 20 questions à poser au propriétaire',
    description: "Ne repartez jamais sans avoir posé ces questions clés sur les charges, le voisinage, les travaux et l'état général du logement.",
    tag: 'VISITE', readTime: 4, role: 'tenant',
    tagColor: { bg: BAI.caramelLight, color: BAI.caramel, border: BAI.caramelBorder },
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Mars 2026',
  },
  {
    slug: 'droits-locataire',
    title: 'Droits du locataire : tout ce que vous devez savoir',
    description: "De la décence du logement à l'inviolabilité du domicile, connaissez vos droits légaux pour vous protéger au quotidien en tant que locataire.",
    tag: 'DROITS', readTime: 6, role: 'tenant',
    tagColor: { bg: BAI.tenantLight, color: BAI.tenant, border: BAI.tenantBorder },
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Février 2026',
  },
  {
    slug: 'demenagement-checklist',
    title: 'Déménagement : la checklist complète 2025',
    description: "Changement d'adresse, résiliation d'abonnements, état des lieux de sortie, récupération du dépôt de garantie — tout dans l'ordre chronologique.",
    tag: 'PRATIQUE', readTime: 7, role: 'tenant',
    tagColor: { bg: BAI.bgMuted, color: BAI.inkMid, border: BAI.border },
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Janvier 2026',
  },
  {
    slug: 'loyer-charges-comprises',
    title: 'Loyer charges comprises (CC) vs hors charges (HC) : guide complet',
    description: 'Charges forfaitaires ou réelles, liste légale des charges récupérables, régularisation annuelle — tout comprendre sur le loyer charges comprises.',
    tag: 'FINANCES', readTime: 5, role: 'tenant',
    tagColor: { bg: BAI.caramelLight, color: BAI.caramel, border: BAI.caramelBorder },
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Mars 2026',
  },
  {
    slug: 'fixer-bon-loyer',
    title: 'Fixer le bon loyer pour son bien en 2025',
    description: "Zones tendues, encadrement des loyers, prix au m² par ville, critères valorisants — la méthode complète pour fixer un loyer légal et attractif.",
    tag: 'LOYER', readTime: 6, role: 'owner',
    tagColor: { bg: BAI.ownerLight, color: BAI.owner, border: BAI.ownerBorder },
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Février 2026',
  },
  {
    slug: 'choisir-locataire-criteres',
    title: 'Comment choisir son locataire : critères légaux et conseils',
    description: 'Revenus, garanties, discrimination interdite, documents illégaux à ne pas demander — comment sélectionner votre locataire en toute légalité.',
    tag: 'SÉLECTION', readTime: 5, role: 'owner',
    tagColor: { bg: BAI.ownerLight, color: BAI.owner, border: BAI.ownerBorder },
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Mars 2026',
  },
  {
    slug: 'rediger-annonce-attire',
    title: 'Rédiger une annonce de location qui attire des locataires',
    description: "Photos, titre accrocheur, description structurée, mentions légales obligatoires — les techniques des professionnels pour maximiser les visites qualifiées.",
    tag: 'ANNONCE', readTime: 4, role: 'owner',
    tagColor: { bg: BAI.caramelLight, color: BAI.caramel, border: BAI.caramelBorder },
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Janvier 2026',
  },
  {
    slug: 'fiscalite-locative',
    title: 'Fiscalité locative 2025 : micro-foncier, réel, LMNP',
    description: 'Régime micro-foncier, régime réel, déficit foncier, LMNP, SCI — comment optimiser légalement votre déclaration de revenus locatifs en 2025.',
    tag: 'FISCALITÉ', readTime: 10, role: 'owner',
    tagColor: { bg: BAI.caramelLight, color: BAI.caramel, border: BAI.caramelBorder },
    image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Avril 2026',
  },
  {
    slug: 'etat-des-lieux',
    title: 'État des lieux : guide complet entrée et sortie',
    description: "Comment réaliser un état des lieux rigoureux, gérer les désaccords, distinguer vétusté et dégradation, et récupérer son dépôt de garantie.",
    tag: 'EDL', readTime: 7, role: 'owner',
    tagColor: { bg: BAI.ownerLight, color: BAI.owner, border: BAI.ownerBorder },
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Février 2026',
  },
  {
    slug: 'charges-recuperables',
    title: 'Charges récupérables : liste complète et légale 2025',
    description: "Décret du 26 août 1987, eau, ascenseur, parties communes, espaces verts, taxes — la liste exhaustive des charges que vous pouvez légalement récupérer.",
    tag: 'CHARGES', readTime: 6, role: 'owner',
    tagColor: { bg: BAI.bgMuted, color: BAI.inkMid, border: BAI.border },
    image: 'https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=1400&q=80',
    updatedAt: 'Mars 2026',
  },
]

// ─── Article content ───────────────────────────────────────────────────────────

const ARTICLES_CONTENT: Record<string, ArticleContent> = {

  'dossier-locatif-solide': {
    intro: "Dans les grandes villes, un propriétaire peut recevoir plus de 30 dossiers pour un seul logement attractif. Votre dossier est votre unique vitrine avant la visite : il doit être complet, clair et bien présenté pour retenir l'attention en quelques secondes.",
    sections: [
      { type: 'h2', content: 'Les pièces obligatoires selon la loi' },
      { type: 'p', content: "La loi ALUR de 2014 encadre strictement la liste des documents qu'un propriétaire peut légalement exiger. Tout document hors liste est illégal. Voici ce que vous pouvez — et devez — fournir :" },
      { type: 'checklist', items: [
        "Pièce d'identité en cours de validité (carte nationale d'identité, passeport, titre de séjour valide)",
        "Justificatif de domicile actuel (3 dernières quittances de loyer ou attestation d'hébergement chez un tiers)",
        "3 derniers bulletins de salaire (ou bilans comptables pour les indépendants, relevés de CA pour auto-entrepreneurs)",
        "2 derniers avis d'imposition (ou de non-imposition) — page de garde suffisante",
        "Contrat de travail en CDI, CDD, ou promesse d'embauche signée",
        "Justificatifs de toutes autres ressources : APL, pension alimentaire, revenus de placements",
      ]},
      { type: 'warning', content: "Un propriétaire ne peut pas légalement vous demander votre relevé de compte bancaire complet, votre dossier médical, votre casier judiciaire, une photo de vous, votre carte Vitale ou une attestation de bonne tenue de compte. Refusez ces demandes : elles sont illégales et passibles de sanctions." },
      { type: 'h2', content: "La règle des 33% : comprendre le ratio revenus/loyer" },
      { type: 'p', content: "La règle informelle du marché exige que le loyer charges comprises ne dépasse pas 33% de vos revenus nets mensuels. Pour un loyer de 900 € CC, vous devez justifier d'environ 2 700 € nets par mois. Ce seuil n'est pas légalement imposé mais constitue la pratique dominante." },
      { type: 'info', content: "Si vos revenus sont inférieurs au seuil des 3× le loyer, un garant solide peut compenser. La garantie Visale (Action Logement) est gratuite pour les moins de 30 ans et les salariés en mobilité professionnelle — elle couvre jusqu'à 36 mois d'impayés." },
      { type: 'h2', content: "Garant ou caution : vos options" },
      { type: 'p', content: "Si vous ne réunissez pas les revenus requis seul, plusieurs solutions existent. Un garant physique (parent, proche) dont les revenus couvrent au moins 3 à 4 fois le loyer reste la solution la plus courante. La garantie Visale (gratuite) s'adresse aux moins de 30 ans et aux salariés précaires. La garantie bancaire Crédit Logement ou une caution d'entreprise fonctionnent aussi pour les profils cadres." },
      { type: 'h2', content: "Les erreurs qui font rejeter un dossier" },
      { type: 'numbered', items: [
        "Documents illisibles ou mal numérisés — scannez à plat, en PDF, résolution minimale 150 dpi",
        "Dossier incomplet — un seul document manquant suffit à faire pencher la balance vers un autre candidat",
        "Incohérences entre pièces (adresse différente, prénom abrégé différemment) — expliquez-les dans un mot d'accompagnement",
        "Revenus non justifiables en totalité — si vous êtes auto-entrepreneur, fournissez l'attestation URSSAF en plus des relevés de CA",
        "Garant sans son propre dossier complet — son dossier doit être aussi solide que le vôtre",
      ]},
      { type: 'h2', content: "Se démarquer : la lettre de motivation" },
      { type: 'p', content: "En 5 à 8 lignes, présentez votre situation (emploi, stabilité), la raison de votre déménagement et votre profil de locataire sérieux. Mentionnez si vous êtes non-fumeur, sans animal, peu présent (télétravail hors logement). Ces détails simples rassurent un propriétaire particulier." },
      { type: 'tip', content: "Préparez un PDF unique nommé NomPrenom_DossierLocation.pdf avec tous vos documents dans l'ordre : identité, domicile, revenus, contrat de travail, avis d'imposition, dossier garant. Un dossier prêt à l'envoi en un clic vous donnera systématiquement une longueur d'avance." },
    ],
    tips: [
      "Numérisez tous vos documents en HD avant même de commencer à chercher",
      "Préparez un PDF unique et organisé — un dossier par candidature rallonge les délais",
      "Utilisez Visale si vous avez moins de 30 ans — c'est gratuit et très rassurant pour les propriétaires",
      "Écrivez une lettre de motivation courte, personnalisée et sincère",
      "Vérifiez que les infos sont cohérentes entre tous vos documents avant envoi",
    ],
    conclusion: "Un bon dossier locatif se prépare avant de chercher, pas pendant. Anticipez, numérisez et organisez. En zones tendues, la réactivité est aussi importante que la qualité du dossier : soyez prêt à transmettre en moins d'une heure après une visite.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'Comment rédiger un dossier locatif solide',
      'description': 'Pièces justificatives, erreurs à éviter, conseils pour maximiser vos chances. Le guide complet pour constituer un dossier locatif solide.',
      'image': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
      'author': { '@type': 'Organization', 'name': 'Bailio' },
      'publisher': { '@type': 'Organization', 'name': 'Bailio', 'url': 'https://bailio.fr' },
      'datePublished': '2025-01-15',
      'dateModified': '2026-01-10',
      'mainEntityOfPage': { '@type': 'WebPage', '@id': 'https://bailio.fr/guide/dossier-locatif-solide' },
    },
  },

  'comprendre-bail-loi': {
    intro: "Le contrat de location est le document qui régit votre relation avec votre propriétaire pour 1 à 6 ans. Signé, il engage les deux parties. Avant de parapher, voici ce que la loi ALUR impose concrètement et ce que vous devez impérativement vérifier.",
    sections: [
      { type: 'h2', content: 'Durée du bail : vide ou meublé ?' },
      { type: 'p', content: "Pour une location vide (non meublée), la durée minimale légale est de 3 ans si le bailleur est un particulier, et 6 ans si c'est une personne morale (SCI, entreprise). Pour une location meublée, la durée est de 1 an renouvelable (ou 9 mois pour les étudiants avec bail mobilité non reconductible). À l'échéance, le bail se renouvelle automatiquement aux mêmes conditions si aucune des parties n'y met fin." },
      { type: 'h2', content: 'Le dépôt de garantie : règles strictes' },
      { type: 'checklist', items: [
        "Location vide : plafonné à 1 mois de loyer hors charges",
        "Location meublée : plafonné à 2 mois de loyer hors charges",
        "Délai de restitution : 1 mois si l'état des lieux de sortie est identique à l'entrée",
        "Délai de restitution : 2 mois si des retenues sont effectuées (avec justificatifs)",
        "Retard de restitution : pénalité de 10% du loyer mensuel par mois de retard",
        "Le dépôt ne produit pas d'intérêts au profit du locataire",
      ]},
      { type: 'h2', content: 'Le préavis : combien de temps avant de partir ?' },
      { type: 'p', content: "En location vide, le préavis légal est de 3 mois. Il est réduit à 1 mois en zone tendue (Paris, Lyon, Bordeaux, Marseille, Montpellier, Strasbourg, Lille, Grenoble et de nombreuses communes listées par décret). En location meublée, le préavis est toujours de 1 mois." },
      { type: 'info', content: "Le préavis est également réduit à 1 mois (même hors zone tendue) en cas de : perte d'emploi involontaire, mutation professionnelle, premier emploi, état de santé justifiant un changement de logement, attribution d'un logement social, ou bénéfice du RSA/AAH." },
      { type: 'h2', content: 'Les clauses abusives à repérer absolument' },
      { type: 'warning', content: "Ces clauses sont fréquemment insérées dans des baux types non mis à jour. Elles sont réputées non écrites (sans effet juridique) selon l'article 4 de la loi du 6 juillet 1989 — vous n'avez pas à les respecter." },
      { type: 'numbered', items: [
        "Clause interdisant les animaux de compagnie (invalide — sauf pour les animaux classés dangereux)",
        "Clause interdisant la résiliation avant le terme (vous pouvez toujours partir avec préavis)",
        "Clause imposant une assurance habitation auprès d'un assureur précis",
        "Clause prévoyant une résiliation automatique pour non-paiement sans décision de justice",
        "Clause imposant un prélèvement automatique obligatoire comme seul mode de paiement",
        "Clause rendant le locataire responsable de toutes réparations sans distinction",
      ]},
      { type: 'h2', content: 'La révision annuelle du loyer (IRL)' },
      { type: 'p', content: "Le loyer ne peut être révisé qu'une fois par an, à la date anniversaire du bail, et uniquement si une clause de révision est prévue au contrat. La hausse est plafonnée à l'Indice de Référence des Loyers (IRL) publié trimestriellement par l'INSEE. En zone tendue, l'encadrement des loyers s'ajoute à cette règle." },
      { type: 'h2', content: 'Les charges locatives : ce que dit la loi' },
      { type: 'p', content: "Les charges récupérables sont listées de manière limitative par le décret n°87-713 du 26 août 1987. Elles couvrent principalement l'entretien des parties communes, l'eau froide et chaude collective, le chauffage collectif, l'ascenseur, les espaces verts et le gardiennage partiel. Vous êtes en droit de demander les justificatifs de charges chaque année." },
      { type: 'tip', content: "Avant de signer, lisez le bail avec un exemplaire de la loi du 6 juillet 1989 sous les yeux. Si une clause vous semble étrange, demandez des explications par écrit. Un bail mal rédigé peut se retourner contre le propriétaire comme contre vous." },
    ],
    tips: [
      "Vérifiez la durée du bail et assurez-vous qu'elle correspond à vos projets",
      "Contrôlez le montant du dépôt de garantie : 1 mois HC en vide, 2 mois HC en meublé maximum",
      "Repérez les clauses abusives et signalez-les avant signature",
      "Notez la date anniversaire du bail pour anticiper les révisions de loyer",
      "Demandez les 3 derniers décomptes de charges pour évaluer les provisions mensuelles",
    ],
    conclusion: "Le bail est un contrat qui protège les deux parties — à condition qu'il soit conforme à la loi. Ne signez jamais sous pression. Si vous avez un doute sur une clause, consultez gratuitement une ADIL (Agence Départementale d'Information sur le Logement) avant de parapher.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'Comprendre le bail de location : guide complet loi ALUR',
      'description': 'Durée du bail, dépôt de garantie, préavis, charges récupérables — décryptage complet du contrat de location selon la loi ALUR.',
      'image': 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1200&q=80',
      'author': { '@type': 'Organization', 'name': 'Bailio' },
      'publisher': { '@type': 'Organization', 'name': 'Bailio', 'url': 'https://bailio.fr' },
      'datePublished': '2025-02-01',
      'dateModified': '2026-02-15',
      'mainEntityOfPage': { '@type': 'WebPage', '@id': 'https://bailio.fr/guide/comprendre-bail-loi' },
    },
  },

  'visite-appartement-questions': {
    intro: "Une visite dure en moyenne 20 à 30 minutes. C'est peu pour évaluer un logement où vous vivrez potentiellement plusieurs années. Préparez ces 20 questions avant de sonner à la porte — elles vous éviteront les mauvaises surprises qui coûtent cher.",
    sections: [
      { type: 'h2', content: 'Charges et coûts réels : questions 1 à 5' },
      { type: 'numbered', items: [
        "Quel est le montant exact des charges mensuelles, et sont-elles forfaitaires ou des provisions sur charges réelles ?",
        "Quel était le montant de la dernière régularisation de charges — en plus ou en moins ?",
        "Quel est le montant moyen des factures d'énergie mensuelles (électricité, gaz) ?",
        "La taxe d'enlèvement des ordures ménagères (TEOM) est-elle incluse dans les charges ?",
        "Quelle est la classe énergie du logement (lettre DPE de A à G) et le montant annuel estimé de la facture ?",
      ]},
      { type: 'tip', content: "Un logement classé F ou G sera soumis à une interdiction de location à partir de 2028 (loi Climat et Résilience). Vérifiez le DPE avant tout engagement : une lettre G signifie une facture d'énergie souvent supérieure à 200 €/mois pour 50 m²." },
      { type: 'h2', content: "État du logement : questions 6 à 10" },
      { type: 'numbered', items: [
        "Y a-t-il des traces d'humidité, de moisissures ou d'infiltrations (plafond, murs, sous les fenêtres) ?",
        "Depuis combien de temps le logement est-il vacant ? Un délai long est souvent révélateur d'un problème.",
        "Des travaux ont-ils été réalisés récemment ? Des travaux importants sont-ils prévus dans la copropriété ?",
        "Les fenêtres sont-elles en double vitrage ? De quelle année date la dernière rénovation thermique ?",
        "Le chauffage est-il individuel (vous maîtrisez) ou collectif (dates de chauffe imposées) ?",
      ]},
      { type: 'h2', content: "Voisinage et immeuble : questions 11 à 15" },
      { type: 'numbered', items: [
        "Qui sont les voisins directs (famille avec enfants, étudiant, personnes âgées) ?",
        "Y a-t-il des nuisances sonores connues à proximité (bar, restaurant, école, rue passante) ?",
        "L'immeuble dispose-t-il d'un digicode, d'un gardien, d'un interphone fonctionnel ?",
        "La copropriété est-elle en bonne santé financière ? Y a-t-il des procédures judiciaires en cours ?",
        "Quels sont les résultats du dernier procès-verbal d'assemblée générale de copropriété ?",
      ]},
      { type: 'h2', content: "Bail et conditions pratiques : questions 16 à 20" },
      { type: 'numbered', items: [
        "Quelle est la date de disponibilité exacte du logement ?",
        "Les animaux de compagnie sont-ils acceptés (un refus est légalement invalide, sauf animaux dangereux) ?",
        "Quel est le délai moyen de réponse une fois le dossier déposé ?",
        "Si meublé : les meubles listés dans le bail correspondent-ils bien à ce qui est présent ?",
        "Avez-vous des projets de vente ou de reprise du logement dans les 3 prochaines années ?",
      ]},
      { type: 'warning', content: "Si le propriétaire refuse de répondre à des questions légitimes comme le montant des charges ou la classe DPE, c'est un signal d'alarme. Ces informations doivent légalement figurer dans l'annonce — leur absence est une infraction." },
      { type: 'h2', content: 'Ce que vous devez observer et tester vous-même' },
      { type: 'checklist', items: [
        "Tester tous les robinets : débit d'eau froide et chaude, pression suffisante",
        "Vérifier les prises électriques et les interrupteurs dans chaque pièce",
        "Ouvrir les placards, regarder sous l'évier et derrière les meubles fixés",
        "Tester la connexion mobile (signal 4G/5G) dans le salon et la chambre principale",
        "Observer l'environnement depuis chaque fenêtre : lumière, vis-à-vis, circulation",
        "Vérifier l'état du parquet, des plinthes, des joints de salle de bain",
      ]},
    ],
    tips: [
      "Venez avec une checklist papier et cochez chaque point pendant la visite",
      "Photographiez les éventuels défauts visibles avec votre smartphone, datés automatiquement",
      "Demandez à visiter à différentes heures si possible (matin et soir)",
      "Renseignez-vous sur les transports en commun à pied depuis l'immeuble",
      "Interrogez un voisin dans la cage d'escalier si l'occasion se présente",
    ],
    conclusion: "Une visite bien préparée vous protège contre les déceptions post-emménagement. Plus vous posez de questions précises, plus vous obtenez une image réaliste du logement et de la relation future avec le propriétaire. Un propriétaire qui répond avec transparence est un propriétaire avec qui la location se passera bien.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'Visite appartement : 20 questions à poser au propriétaire',
      'description': "Ne repartez jamais sans avoir posé ces questions clés sur les charges, le voisinage, les travaux et l'état général du logement.",
      'image': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'author': { '@type': 'Organization', 'name': 'Bailio' },
      'publisher': { '@type': 'Organization', 'name': 'Bailio', 'url': 'https://bailio.fr' },
      'datePublished': '2025-03-01',
      'dateModified': '2026-03-10',
      'mainEntityOfPage': { '@type': 'WebPage', '@id': 'https://bailio.fr/guide/visite-appartement-questions' },
    },
  },

  'droits-locataire': {
    intro: "Locataire, vous n'êtes pas sans défense. La loi du 6 juillet 1989 et la loi ALUR vous accordent des protections solides — que beaucoup ignorent et que peu exercent. Voici les droits essentiels à connaître pour vous protéger au quotidien.",
    sections: [
      { type: 'h2', content: 'Le droit à un logement décent' },
      { type: 'p', content: "Votre propriétaire est légalement tenu de vous louer un logement décent. Le décret du 30 janvier 2002 liste les critères précis : superficie minimale (9 m² avec une hauteur de 2,20 m sous plafond), absence de risque pour la sécurité physique (installation électrique conforme, pas de plomb accessible ni d'amiante friable), alimentation en eau potable, évacuation des eaux usées, chauffage fonctionnel permettant d'atteindre 18°C, et éclairage naturel suffisant dans les pièces principales." },
      { type: 'warning', content: "Si votre logement ne remplit pas ces critères de décence, envoyez une mise en demeure par lettre recommandée avec accusé de réception. En cas d'inaction sous 2 mois, vous pouvez saisir le tribunal judiciaire ou la CAF — qui peut suspendre l'APL au propriétaire jusqu'à ce que les travaux soient réalisés." },
      { type: 'h2', content: "Le droit à la tranquillité : inviolabilité du domicile" },
      { type: 'p', content: "Votre propriétaire ne peut pas entrer dans le logement sans votre accord explicite et préalable, même pour réaliser des réparations urgentes (sauf risque vital immédiat ou sinistre). Toute intrusion non autorisée constitue une violation de domicile, passible de sanctions pénales. Les visites pour travaux ou inspections doivent être convenues avec vous à l'avance, à des horaires raisonnables." },
      { type: 'info', content: "Exception légale : lors d'une mise en vente ou d'une re-location du logement, le propriétaire peut organiser des visites avec votre accord, dans la limite de 2 heures par jour aux jours ouvrables, sauf accord contraire entre vous." },
      { type: 'h2', content: 'Le droit à la jouissance paisible : travaux et gêne' },
      { type: 'p', content: "Si des travaux sont réalisés dans le logement par le propriétaire et qu'ils durent plus de 21 jours consécutifs, vous avez droit à une réduction de loyer proportionnelle à la durée et à la gêne occasionnée. Si les travaux rendent le logement temporairement inhabitable, le bail peut être suspendu ou résilié à votre initiative." },
      { type: 'h2', content: 'La protection contre les expulsions abusives' },
      { type: 'checklist', items: [
        "Aucune expulsion ne peut avoir lieu sans décision de justice rendue par le tribunal judiciaire",
        "La décision doit être signifiée par huissier avec un délai minimum de 2 mois pour quitter les lieux",
        "La trêve hivernale (du 1er novembre au 31 mars) interdit toute expulsion, même suite à un jugement",
        "Le juge peut accorder des délais supplémentaires jusqu'à 3 ans en cas de bonne foi avérée",
        "En cas de relogement impossible, la commune est tenue de proposer une solution d'hébergement",
      ]},
      { type: 'h2', content: 'Le droit de contester votre loyer (zones tendues)' },
      { type: 'p', content: "En zone tendue (Paris, Lyon, Bordeaux, Montpellier, Grenoble, Strasbourg, Lille…), si votre loyer dépasse le loyer de référence majoré fixé par arrêté préfectoral, vous pouvez saisir la Commission Départementale de Conciliation (CDC) pour obtenir une baisse. Cette démarche est entièrement gratuite et obligatoire avant tout recours judiciaire." },
      { type: 'h2', content: 'Le droit à la quittance de loyer' },
      { type: 'p', content: "À chaque paiement, vous avez le droit d'obtenir gratuitement une quittance de loyer. Le propriétaire ne peut pas vous facturer ce service. La quittance est la preuve de votre paiement — conservez-les pendant toute la durée du bail et 3 ans après votre départ." },
      { type: 'tip', content: "Conservez TOUS vos échanges avec votre propriétaire (SMS, emails, courriers). En cas de litige, la preuve écrite est déterminante. Envoyez toujours vos demandes importantes par lettre recommandée avec accusé de réception pour sécuriser juridiquement vos démarches." },
    ],
    tips: [
      "Exigez une quittance de loyer à chaque paiement — c'est votre droit et c'est gratuit",
      "Conservez tous vos échanges écrits avec votre propriétaire pendant et après la location",
      "En cas de logement indécent, contactez l'ADIL de votre département (gratuit)",
      "Vérifiez votre loyer sur l'observatoire des loyers si vous êtes en zone tendue",
      "La trêve hivernale vous protège du 1er novembre au 31 mars — même en cas d'impayés",
    ],
    conclusion: "Connaître vos droits n'est pas une posture défensive — c'est la base d'une relation locative saine. Un locataire informé est un locataire qui sait quand négocier, quand agir et quand saisir les bonnes autorités. En cas de doute, les ADIL proposent des consultations juridiques gratuites dans toute la France.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'Droits du locataire : tout ce que vous devez savoir',
      'description': "De la décence du logement à l'inviolabilité du domicile, connaissez vos droits légaux pour vous protéger au quotidien en tant que locataire.",
      'image': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
      'author': { '@type': 'Organization', 'name': 'Bailio' },
      'publisher': { '@type': 'Organization', 'name': 'Bailio', 'url': 'https://bailio.fr' },
      'datePublished': '2025-02-10',
      'dateModified': '2026-02-20',
      'mainEntityOfPage': { '@type': 'WebPage', '@id': 'https://bailio.fr/guide/droits-locataire' },
    },
  },

  'demenagement-checklist': {
    intro: "Un déménagement mal préparé génère des complications pendant des semaines : factures envoyées à l'ancienne adresse, abonnements oubliés, caution retenue faute d'état des lieux. Suivez cette checklist chronologique pour ne rien oublier et partir l'esprit serein.",
    sections: [
      { type: 'h2', content: '2 mois avant le départ' },
      { type: 'checklist', items: [
        "Envoyer votre préavis au propriétaire par lettre recommandée avec accusé de réception (3 mois en vide / 1 mois en meublé ou zone tendue)",
        "Demander des devis à au moins 3 déménageurs et comparer les garanties",
        "Réserver un camion utilitaire si vous déménagez seul",
        "Commencer à faire des cartons en partant des affaires les moins utilisées",
        "Vérifier si votre immeuble actuel et le nouveau nécessitent une réservation de monte-meuble",
      ]},
      { type: 'h2', content: '1 mois avant le départ' },
      { type: 'checklist', items: [
        "Déclarer votre changement d'adresse sur service-public.fr (redirection courrier 1 an)",
        "Prévenir votre employeur pour la mise à jour de vos bulletins de salaire",
        "Informer votre banque et mettre à jour votre adresse de domiciliation",
        "Contacter votre fournisseur d'énergie (EDF, Engie, TotalEnergies) pour transfert ou résiliation",
        "Résilier ou transférer votre abonnement Internet (délai de résiliation : 10 à 30 jours selon opérateur)",
        "Modifier votre contrat d'assurance habitation (avenant d'adresse ou résiliation)",
        "Informer la CAF, la CPAM, Pôle Emploi/France Travail et votre mutuelle",
        "Mettre à jour votre adresse sur vos abonnements (presse, streaming, livraison)",
      ]},
      { type: 'h2', content: 'La semaine du déménagement' },
      { type: 'checklist', items: [
        "Finir tous les cartons et les étiqueter par pièce de destination",
        "Défrosting du congélateur 24h avant le départ",
        "Relever les compteurs (eau, électricité, gaz) avec photos le jour J",
        "Réaliser l'état des lieux de sortie contradictoirement avec le propriétaire ou son mandataire",
        "Récupérer le document d'état des lieux signé par les deux parties",
        "Rendre toutes les clés, badges, télécommandes et cartes de parking",
        "Vider et nettoyer caves, greniers et parking loués",
      ]},
      { type: 'warning', content: "Ne partez jamais sans un état des lieux de sortie signé par les deux parties. Sans ce document, vous ne pouvez pas contester les retenues sur caution. Si le propriétaire ne se présente pas, faites-le constater par huissier (frais partagés)." },
      { type: 'h2', content: 'Après le déménagement : récupérer votre dépôt de garantie' },
      { type: 'p', content: "Le propriétaire dispose de 1 mois pour restituer le dépôt si l'EDL de sortie est identique à l'entrée, ou 2 mois s'il opère des retenues. Chaque retenue doit être justifiée par un devis ou une facture." },
      { type: 'numbered', items: [
        "Vérifiez que les retenues correspondent à des dégradations constatées dans l'EDL de sortie — pas à de l'usure normale",
        "Distinguez usure normale (non déductible) et dégradation (déductible) en vous aidant de la grille de vétusté",
        "Si vous contestez une retenue, envoyez un courrier recommandé avec AR dans les 2 mois",
        "En cas de désaccord persistant, saisir la Commission Départementale de Conciliation (gratuit)",
        "Après le délai légal sans remboursement, le propriétaire doit 10% du loyer mensuel par mois de retard",
      ]},
      { type: 'tip', content: "Photographiez l'état de chaque mur, sol et équipement à l'entrée ET à la sortie. Datez vos photos automatiquement avec votre smartphone. Ces images constituent une preuve incontestable en cas de litige sur le dépôt de garantie." },
    ],
    tips: [
      "Commencez à préparer vos cartons 3 semaines avant — jamais la veille",
      "La redirection de courrier (La Poste) peut sauver des documents importants pendant 6 mois",
      "Photographiez le logement intégralement le jour de l'EDL de sortie",
      "Récupérez toujours le double signé de l'état des lieux avant de remettre les clés",
      "Notez dans votre agenda la date limite de restitution du dépôt de garantie",
    ],
    conclusion: "Le déménagement est un moment de transition intense. Une organisation chronologique rigoureuse évite 90% des problèmes post-départ. La récupération de votre dépôt de garantie dépend presque entièrement de la qualité de votre état des lieux de sortie — ne le bâclez jamais.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'Déménagement : la checklist complète 2025',
      'description': "Changement d'adresse, résiliation d'abonnements, état des lieux de sortie — tout dans l'ordre chronologique.",
      'image': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
      'author': { '@type': 'Organization', 'name': 'Bailio' },
      'publisher': { '@type': 'Organization', 'name': 'Bailio', 'url': 'https://bailio.fr' },
      'datePublished': '2025-01-20',
      'dateModified': '2026-01-15',
      'mainEntityOfPage': { '@type': 'WebPage', '@id': 'https://bailio.fr/guide/demenagement-checklist' },
    },
  },

  'loyer-charges-comprises': {
    intro: "Le sigle \"CC\" est omniprésent dans les annonces, mais ce qu'il recouvre réellement varie d'un bien à l'autre. Comprendre la différence entre loyer hors charges et charges comprises — et surtout ce que le propriétaire peut légalement vous facturer — vous évitera des surprises en fin d'année.",
    sections: [
      { type: 'h2', content: 'HC vs CC : la différence fondamentale' },
      { type: 'p', content: "Le loyer hors charges (HC) est la part nette de la location. Les charges locatives sont les dépenses liées à l'usage de l'immeuble et de ses équipements communs : eau, ascenseur, parties communes, espaces verts, gardiennage. Le loyer charges comprises (CC) = loyer HC + provision sur charges (ou forfait charges en meublé)." },
      { type: 'info', content: "Pour comparer deux annonces, comparez le loyer HC ou estimez les charges réelles. Une annonce à 800€ CC avec 150€ de charges réelles représente 650€ HC — soit moins qu'une annonce à 700€ CC avec des charges très faibles." },
      { type: 'h2', content: 'Charges forfaitaires vs charges réelles' },
      { type: 'p', content: "En location meublée, les charges sont généralement forfaitaires : montant fixe, pas de régularisation annuelle, aucun justificatif exigible par le locataire. En location vide, les charges sont obligatoirement des provisions sur charges réelles : le propriétaire collecte une avance mensuelle et régularise une fois par an selon les dépenses effectives de l'immeuble." },
      { type: 'checklist', items: [
        "Provisions > dépenses réelles → le propriétaire vous rembourse la différence",
        "Provisions < dépenses réelles → vous payez un complément",
        "Le propriétaire doit vous fournir un décompte détaillé au moins 1 mois avant la régularisation",
        "Vous avez le droit de consulter les pièces justificatives pendant 6 mois après envoi du décompte",
        "Délai de prescription pour réclamer une régularisation : 3 ans",
      ]},
      { type: 'h2', content: 'Liste légale des charges récupérables' },
      { type: 'p', content: "Le décret n°87-713 du 26 août 1987 liste de manière exhaustive les charges que le propriétaire peut récupérer. Parmi les principales : eau froide et chaude collective, entretien des parties communes (nettoyage, fournitures), chauffage collectif, électricité des communs, ascenseur (entretien courant), espaces verts, gardiennage (75% maximum de la rémunération), taxe d'enlèvement des ordures ménagères (TEOM)." },
      { type: 'warning', content: "Charges NON récupérables que le propriétaire ne peut jamais vous facturer : ravalement de façade, réfection de toiture, remplacement de chaudière collective vétuste, assurance de l'immeuble, frais de gestion d'agence, taxe foncière (hors ligne TEOM), frais de procédure judiciaire." },
      { type: 'h2', content: 'Comment contester une régularisation' },
      { type: 'numbered', items: [
        "Demandez les justificatifs complets : relevés de consommation, contrats d'entretien, factures",
        "Vérifiez que tous les postes facturés figurent bien dans le décret du 26 août 1987",
        "Contrôlez votre quote-part selon la clé de répartition indiquée dans votre bail",
        "En cas d'anomalie, envoyez un courrier recommandé avec AR dans les 6 mois du décompte",
        "Si le désaccord persiste, saisir la Commission Départementale de Conciliation (gratuit, avant tout recours judiciaire)",
      ]},
      { type: 'tip', content: "Conservez vos avis d'échéance et quittances pendant toute la durée du bail et 3 ans après le départ. En cas de régularisation tardive contestée, ces documents font foi pour établir ce que vous avez déjà payé." },
    ],
    tips: [
      "Demandez les 3 derniers décomptes de charges réels avant de signer le bail",
      "Vérifiez que les provisions mensuelles sont cohérentes avec les charges réelles passées",
      "Exigez les justificatifs si la régularisation vous semble anormalement élevée",
      "En meublé, les charges forfaitaires vous protègent des régularisations surprises",
      "Notez la date de régularisation annuelle prévue dans votre bail",
    ],
    conclusion: "Les charges locatives sont souvent sous-estimées par les candidats lors de la recherche. Un loyer CC attractif peut cacher des provisions trop basses et une régularisation douloureuse en fin d'année. Demandez toujours les décomptes des 3 dernières années avant de vous engager.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'Loyer charges comprises (CC) vs hors charges (HC) : guide complet',
      'description': 'Charges forfaitaires ou réelles, liste légale, régularisation annuelle — tout comprendre sur le loyer charges comprises.',
      'image': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
      'author': { '@type': 'Organization', 'name': 'Bailio' },
      'publisher': { '@type': 'Organization', 'name': 'Bailio', 'url': 'https://bailio.fr' },
      'datePublished': '2025-03-05',
      'dateModified': '2026-03-01',
      'mainEntityOfPage': { '@type': 'WebPage', '@id': 'https://bailio.fr/guide/loyer-charges-comprises' },
    },
  },

  'fixer-bon-loyer': {
    intro: "Un loyer trop élevé laisse votre bien vacant et génère plus de pertes qu'un loyer ajusté. Un loyer trop bas sous-évalue votre patrimoine. Voici les méthodes concrètes pour trouver le juste prix, en respectant la loi.",
    sections: [
      { type: 'h2', content: 'La méthode comparative : la plus fiable' },
      { type: 'p', content: "Observez les loyers pratiqués pour des biens similaires dans votre quartier — même surface habitable, même standing, mêmes équipements. Comparez sur les plateformes d'annonces actives, et identifiez les biens déjà loués ou retirés rapidement pour évaluer les prix qui « fonctionnent » vraiment sur le marché local." },
      { type: 'checklist', items: [
        "Surface habitable en m² (balcons, terrasses non couverts et caves ne comptent pas dans la surface Carrez)",
        "Étage et présence d'un ascenseur fonctionnel",
        "Exposition (sud/ouest = prime de 5 à 10%) et luminosité",
        "État général et année de la dernière rénovation",
        "Équipements différenciants : cuisine équipée, parking, cave, digicode, gardien",
        "Distance à pied des transports en commun et des commerces essentiels",
      ]},
      { type: 'h2', content: "L'encadrement des loyers en zone tendue" },
      { type: 'p', content: "Dans les communes en zone tendue — Paris, Lille, Lyon, Bordeaux, Montpellier, Grenoble, Strasbourg, et de nombreuses communes de banlieue parisienne — un plafond réglementaire s'impose. Le loyer de référence majoré est fixé par arrêté préfectoral et varie selon le quartier, la surface, l'époque de construction du bâtiment et le nombre de pièces." },
      { type: 'warning', content: "Dépasser le loyer de référence majoré expose à une amende de 5 000 € pour un particulier et 15 000 € pour une personne morale. Le locataire peut en outre demander une réduction de loyer devant le tribunal judiciaire sans délai de prescription." },
      { type: 'h2', content: 'Prix au m² indicatifs par grande ville (2025)' },
      { type: 'checklist', items: [
        "Paris intra-muros : 28 à 40 €/m² selon arrondissement (encadrement obligatoire)",
        "Lyon 1er-6ème : 15 à 20 €/m² (encadrement en vigueur)",
        "Bordeaux centre : 13 à 17 €/m² (encadrement en vigueur)",
        "Montpellier : 12 à 16 €/m² (encadrement en vigueur)",
        "Nantes, Rennes, Strasbourg : 11 à 15 €/m²",
        "Villes moyennes : 7 à 12 €/m² selon attractivité et localisation",
      ]},
      { type: 'h2', content: 'La saisonnalité du marché locatif' },
      { type: 'p', content: "Le marché locatif est fortement saisonnier. Septembre-octobre et janvier-février sont les périodes les plus actives. Publiez votre annonce à ces moments pour maximiser la visibilité et le nombre de candidatures. En été ou fin décembre, les candidatures se raréfient — soit vous patientez, soit vous consentez un loyer légèrement plus attractif pour éviter les vacances locatives prolongées." },
      { type: 'tip', content: "Chaque mois de vacance locative représente 1/12e de vos revenus annuels perdus. Un loyer 5% en dessous du marché, pour trouver un bon locataire rapidement, est souvent plus rentable qu'un loyer optimal avec 6 semaines de vacance et les frais de re-location associés." },
      { type: 'h2', content: 'La révision annuelle : anticipez-la dans le bail' },
      { type: 'p', content: "Prévoyez systématiquement une clause de révision indexée sur l'Indice de Référence des Loyers (IRL) publié par l'INSEE. Sans cette clause, aucune révision n'est possible — votre loyer reste figé jusqu'à la fin du bail. La révision doit être demandée dans l'année suivant son terme, sous peine de perdre le droit de réviser pour l'année écoulée." },
    ],
    tips: [
      "Consultez l'observatoire local des loyers (OLAP à Paris, observatoires régionaux) pour les références officielles",
      "Vérifiez si votre commune est en zone tendue sur le site du gouvernement avant de fixer le loyer",
      "Intégrez une clause de révision IRL dans le bail pour ne pas bloquer vos revenus",
      "Un bien vacant 2 mois rapporte moins qu'un bien 5% moins cher loué toute l'année",
      "Documentez les équipements et la rénovation pour justifier un complément de loyer en zone tendue",
    ],
    conclusion: "Fixer le bon loyer est un exercice d'équilibre : trop haut et vous perdez du temps, trop bas et vous perdez de l'argent. Appuyez-vous sur les données de marché locales, respectez les plafonds légaux en zone tendue, et pensez à la durée : un bon locataire qui reste 5 ans vaut bien un léger ajustement de loyer à la baisse.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'Fixer le bon loyer pour son bien en 2025',
      'description': "Zones tendues, encadrement des loyers, prix au m² par ville — la méthode complète pour fixer un loyer légal et attractif.",
      'image': 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
      'author': { '@type': 'Organization', 'name': 'Bailio' },
      'publisher': { '@type': 'Organization', 'name': 'Bailio', 'url': 'https://bailio.fr' },
      'datePublished': '2025-02-15',
      'dateModified': '2026-02-10',
      'mainEntityOfPage': { '@type': 'WebPage', '@id': 'https://bailio.fr/guide/fixer-bon-loyer' },
    },
  },

  'choisir-locataire-criteres': {
    intro: "Choisir son locataire est un droit, mais pas sans limites. La loi encadre strictement les critères autorisés pour éviter toute discrimination — et les sanctions sont lourdes. Voici comment évaluer efficacement la solvabilité d'un candidat tout en restant dans la légalité.",
    sections: [
      { type: 'h2', content: "Discrimination : ce qui est strictement interdit" },
      { type: 'warning', content: "La loi du 6 juillet 1989 et la loi Mériaux interdisent formellement de refuser un candidat en raison de : son origine, son prénom, son adresse, son orientation sexuelle ou identité de genre, sa situation de famille, une grossesse, un handicap, ses opinions politiques ou religieuses, son appartenance à une ethnie ou nationalité, ou parce qu'il perçoit des aides sociales (APL, RSA). Ces refus sont passibles de 3 ans d'emprisonnement et 45 000 € d'amende." },
      { type: 'h2', content: 'Documents légaux à demander, documents interdits' },
      { type: 'p', content: "La liste des pièces que vous pouvez légalement demander est fixée par décret (liste limitative). Toute demande hors liste est illégale et vous expose à des sanctions." },
      { type: 'checklist', items: [
        "Autorisé : pièce d'identité, justificatif de domicile, bulletins de salaire, avis d'imposition, contrat de travail",
        "Autorisé : dossier complet du garant avec les mêmes pièces",
        "INTERDIT : relevé de compte bancaire complet ou partiel",
        "INTERDIT : carte Vitale ou dossier médical",
        "INTERDIT : extrait de casier judiciaire",
        "INTERDIT : photographie du candidat",
        "INTERDIT : attestation de bonne tenue de compte bancaire",
      ]},
      { type: 'h2', content: "Évaluer la solvabilité : le ratio et ses nuances" },
      { type: 'p', content: "La règle informelle des 3× le loyer (revenus nets ≥ 3× le loyer CC) est un indicateur, pas une obligation légale. Un candidat en CDI avec 2,7× le loyer peut être bien plus fiable qu'un indépendant avec 3,5× mais des revenus variables. Analysez la stabilité et la régularité, pas uniquement le montant brut." },
      { type: 'checklist', items: [
        "CDI ou fonctionnaire : stabilité maximale — critère le plus solide",
        "CDD ou intérimaire : vérifiez la continuité des contrats sur 2 ans et le secteur d'activité",
        "Indépendant / auto-entrepreneur : demandez 2 à 3 ans de bilans ou relevés de CA mensuels",
        "Retraité : revenus fixes et pérennes — la règle des 3× peut être assouplie",
        "Étudiant sans revenus propres : un garant solvable (revenus ≥ 4× le loyer) est indispensable",
      ]},
      { type: 'h2', content: "Garant physique ou Visale : que choisir ?" },
      { type: 'p', content: "Si le candidat propose un garant physique (parent, proche), exigez un dossier complet identique au sien. Vérifiez que les revenus du garant couvrent au moins 3 à 4 fois le loyer. La garantie Visale (Action Logement) est une alternative solide et gratuite pour vous : elle couvre jusqu'à 36 mois d'impayés sans procédure. À privilégier pour les jeunes locataires." },
      { type: 'info', content: "Vous ne pouvez pas cumuler une garantie Visale avec une caution physique pour le même locataire (sauf si le locataire est étudiant ou apprenti). La loi ELAN l'interdit depuis 2018 pour éviter une double couverture disproportionnée." },
      { type: 'h2', content: "Départager plusieurs bons dossiers" },
      { type: 'numbered', items: [
        "Priorité au dossier le plus complet et le mieux organisé — signe de sérieux",
        "Stabilité professionnelle sur les revenus bruts : CDI > CDD > indépendant",
        "Cohérence du projet de vie : déménagement motivé (emploi, famille) vs situation instable",
        "Lettre de motivation personnalisée et sincère (revient souvent comme critère décisif)",
        "Références de précédents propriétaires disponibles sur les quittances fournies",
      ]},
      { type: 'tip', content: "N'hésitez pas à appeler le précédent propriétaire dont le nom figure sur les quittances fournies. Un appel de 2 minutes peut révéler des informations précieuses : paiement à l'heure, entretien du logement, relationnel." },
    ],
    tips: [
      "Utilisez une grille d'évaluation identique pour tous les candidats — gage de légalité et d'équité",
      "Ne demandez jamais de documents hors liste légale — même avec le consentement du candidat",
      "Visale est gratuit pour vous et couvre 36 mois d'impayés — pensez-y pour les profils atypiques",
      "Appelez le précédent propriétaire : c'est la meilleure vérification que vous puissiez faire",
      "Gardez une trace écrite de votre processus de sélection en cas de contestation ultérieure",
    ],
    conclusion: "Le bon locataire n'est pas nécessairement celui qui gagne le plus — c'est celui dont la situation est stable, le dossier honnête et le profil adapté à votre bien. Un processus de sélection rigoureux mais légal vous protège à long terme bien mieux que des critères discriminatoires qui exposent à des poursuites.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'Comment choisir son locataire : critères légaux et conseils',
      'description': 'Revenus, garanties, discrimination interdite, documents illégaux — comment sélectionner votre locataire en toute légalité.',
      'image': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
      'author': { '@type': 'Organization', 'name': 'Bailio' },
      'publisher': { '@type': 'Organization', 'name': 'Bailio', 'url': 'https://bailio.fr' },
      'datePublished': '2025-03-10',
      'dateModified': '2026-03-05',
      'mainEntityOfPage': { '@type': 'WebPage', '@id': 'https://bailio.fr/guide/choisir-locataire-criteres' },
    },
  },

  'rediger-annonce-attire': {
    intro: "Une annonce avec de bonnes photos et une description structurée génère trois fois plus de contacts qualifiés qu'une annonce bâclée. Voici les techniques des professionnels de l'immobilier pour mettre votre bien en valeur et attirer des candidats sérieux.",
    sections: [
      { type: 'h2', content: "Les photos : la première impression décisive" },
      { type: 'p', content: "Un candidat passe moins de 3 secondes sur une annonce dont les photos sont sombres ou mal cadrées. C'est la première chose qu'il voit, avant même de lire le prix. Investissez du temps dans cette étape — c'est elle qui décide si on clique ou non." },
      { type: 'checklist', items: [
        "Photographiez en journée avec un maximum de lumière naturelle — ouvrez tous les volets",
        "Rangez et dépersonnalisez entièrement le logement (retirez photos personnelles, objets épars)",
        "Commencez par la pièce de vie principale (salon ou cuisine ouverte) — votre meilleure vitrine",
        "Incluez une photo de chaque pièce, même petite — les candidats veulent tout voir",
        "Photographiez depuis l'angle le plus large, depuis un coin de pièce",
        "Ajoutez une photo de la façade de l'immeuble et du quartier",
        "Terrasse, balcon, vue dégagée : mettez ces atouts en avant en première ou deuxième photo",
        "Minimum 8 photos pour un appartement — idéalement 12 à 15 pour un logement plus grand",
      ]},
      { type: 'tip', content: "Évitez les photos de nuit, les miroirs qui révèlent le photographe, et les photos en format portrait (vertical). Un smartphone récent en mode paysage avec une bonne lumière naturelle surpasse souvent un reflex mal utilisé. Pas besoin d'investir dans un appareil photo professionnel." },
      { type: 'h2', content: "Le titre : concis, factuel et filtrant" },
      { type: 'p', content: "Un bon titre contient les informations que les candidats filtrent en priorité : type de bien, surface, localisation précise, équipement différenciant. Évitez les superlatifs vides (magnifique, exceptionnel, rare) qui n'apportent aucune information concrète." },
      { type: 'info', content: "Exemples de titres efficaces : « T2 42 m² lumineux – métro Voltaire – cave » / « Studio meublé 28 m² Haussmannien – charges comprises » / « 3 pièces 68 m² avec balcon – quartier Montmartre – DPE C »" },
      { type: 'h2', content: "La description : structurée en 3 parties" },
      { type: 'numbered', items: [
        "Le logement : surface exacte en m², nombre et usage des pièces, équipements cuisine et salle de bain, type de chauffage, étage et ascenseur, exposition",
        "L'immeuble et ses prestations : parking, cave, digicode, interphone, gardien, DPE et classe énergie",
        "Le quartier et les transports : distances précises à pied jusqu'aux stations de métro/tram/bus, commerces, écoles, parcs",
      ]},
      { type: 'h2', content: "Mentions légales obligatoires dans l'annonce" },
      { type: 'warning', content: "La loi impose d'afficher dans l'annonce : le loyer mensuel et les charges (en précisant si charges forfaitaires ou provisions), le montant du dépôt de garantie, la surface habitable en m² (loi Boutin), la classe énergie (DPE) et le montant estimé annuel de la facture d'énergie. Une annonce sans ces informations est non-conforme et peut être retirée." },
      { type: 'h2', content: "Diffusion : où publier pour maximiser la portée ?" },
      { type: 'p', content: "Publiez simultanément sur plusieurs plateformes pour maximiser la visibilité. Bailio permet de gérer candidatures et visites directement, sans frais d'agence. Leboncoin, SeLoger et PAP restent les trois plateformes les plus consultées. En zone tendue, une bonne annonce sur Bailio génère des demandes de visite en moins de 24 heures." },
    ],
    tips: [
      "Prenez vos photos le matin entre 9h et 11h pour une lumière naturelle optimale",
      "Relisez votre annonce à voix haute — les fautes de frappe dissuadent les candidats sérieux",
      "Mettez à jour l'annonce si le bien est disponible depuis plus de 3 semaines (baisse de loyer ou nouvelles photos)",
      "Répondez aux demandes dans les 4 heures — les bons candidats candidatent souvent plusieurs biens en parallèle",
      "Mentionnez si les animaux sont acceptés — cela élargit le pool de candidats sans risque légal",
    ],
    conclusion: "Une excellente annonce vous fait économiser du temps et des semaines de vacance locative. Elle filtre naturellement les candidats non qualifiés et attire ceux qui correspondent réellement à votre bien. Investissez une heure supplémentaire sur vos photos et votre description — le retour est immédiat.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'Rédiger une annonce de location qui attire des locataires',
      'description': "Photos, titre accrocheur, description structurée, mentions légales — les techniques des professionnels pour maximiser les visites qualifiées.",
      'image': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
      'author': { '@type': 'Organization', 'name': 'Bailio' },
      'publisher': { '@type': 'Organization', 'name': 'Bailio', 'url': 'https://bailio.fr' },
      'datePublished': '2025-01-25',
      'dateModified': '2026-01-20',
      'mainEntityOfPage': { '@type': 'WebPage', '@id': 'https://bailio.fr/guide/rediger-annonce-attire' },
    },
  },

  'fiscalite-locative': {
    intro: "Les revenus locatifs sont imposés — mais pas de la même façon selon votre statut et le régime choisi. Bien comprendre ces mécanismes peut légalement réduire votre facture fiscale de moitié. Tour d'horizon complet des options disponibles en 2025.",
    sections: [
      { type: 'h2', content: "Location vide : micro-foncier ou régime réel ?" },
      { type: 'p', content: "Si vos revenus fonciers annuels bruts sont inférieurs à 15 000 €, vous êtes automatiquement au régime micro-foncier : abattement forfaitaire de 30% sur les loyers perçus, sans avoir à justifier vos charges réelles. Simple mais pas toujours optimal. Au-delà de 15 000 €, ou si vous l'estimez plus avantageux, vous optez pour le régime réel." },
      { type: 'info', content: "Régime réel = vous déduisez les charges réelles : travaux (réparation, entretien), intérêts d'emprunt, assurance PNO, taxe foncière, frais de gestion. Si vos charges dépassent 30% des loyers, le régime réel est plus avantageux. L'option est irrévocable pour 3 ans." },
      { type: 'h2', content: "Le déficit foncier : un levier fiscal puissant" },
      { type: 'p', content: "En régime réel, si vos charges (hors intérêts d'emprunt) dépassent vos loyers bruts, vous générez un déficit foncier. Ce déficit est déductible de votre revenu global jusqu'à 10 700 € par an (depuis la loi de finances 2023, ce plafond est temporairement porté à 21 400 € pour les logements énergivores rénovés). Le surplus est reportable sur les revenus fonciers des 10 années suivantes." },
      { type: 'checklist', items: [
        "Travaux de réparation, d'entretien et d'amélioration (pas construction ni agrandissement)",
        "Primes d'assurance : PNO (propriétaire non-occupant), garantie loyers impayés (GLI)",
        "Taxe foncière (hors part TEOM récupérable sur le locataire)",
        "Intérêts d'emprunt (déductibles uniquement des revenus fonciers, pas du revenu global)",
        "Frais de gestion locative ou d'agence immobilière",
        "Honoraires comptables liés à la gestion des revenus fonciers",
      ]},
      { type: 'h2', content: "LMNP : la location meublée non professionnelle" },
      { type: 'p', content: "Si vous louez un bien meublé (liste minimale d'équipements imposée par décret depuis 2015), vos revenus sont des Bénéfices Industriels et Commerciaux (BIC), pas des revenus fonciers. Le régime micro-BIC offre 50% d'abattement forfaitaire. Le régime réel LMNP permet en plus d'amortir le bien et le mobilier — c'est souvent la solution la plus optimisée pour les patrimoines moyens." },
      { type: 'tip', content: "L'amortissement LMNP est le mécanisme fiscal le plus puissant en immobilier locatif. Vous déduisez chaque année une fraction du prix du bien (sur 25 à 40 ans selon les composants) et du mobilier (5 à 10 ans), sans dépense réelle. Résultat habituel : des revenus locatifs nets d'impôt pendant 10 à 20 ans." },
      { type: 'h2', content: "Les prélèvements sociaux" },
      { type: 'p', content: "En plus de l'impôt sur le revenu, vos revenus fonciers ou BIC sont soumis aux prélèvements sociaux à 17,2% (CSG 9,2%, CRDS 0,5%, et autres). Ces prélèvements s'appliquent sur le revenu net imposable, après abattement ou déduction des charges selon le régime choisi." },
      { type: 'h2', content: "SCI : avantages et pièges" },
      { type: 'p', content: "La Société Civile Immobilière (SCI) à l'IR n'offre pas d'avantage fiscal particulier pour un investisseur solo, mais facilite la transmission patrimoniale (abattements donation, démembrement) et simplifie la gestion multi-propriétaires. La SCI à l'IS permet l'amortissement mais crée une imposition renforcée à la revente sur la plus-value comptable." },
      { type: 'warning', content: "La fiscalité locative évolue chaque année avec les lois de finances. Les règles sur le LMNP ont été modifiées plusieurs fois depuis 2023. Pour un patrimoine significatif (au-delà de 2 biens), une consultation avec un expert-comptable spécialisé immobilier est fortement recommandée — les économies réalisées dépassent largement les honoraires." },
    ],
    tips: [
      "Comparez systématiquement micro-foncier et régime réel avant votre déclaration",
      "En LMNP régime réel, faites appel à un expert-comptable pour maximiser les amortissements",
      "Le déficit foncier est particulièrement puissant si vous avez des revenus fonciers d'autres biens",
      "Conservez toutes vos factures de travaux — elles sont déductibles sur l'année de paiement",
      "Consultez un conseiller fiscal avant de passer en LMNP ou de créer une SCI",
    ],
    conclusion: "La fiscalité locative offre de réels leviers d'optimisation légale — à condition de choisir le bon régime dès le départ. Le passage du micro-foncier au réel ou du nu au meublé peut radicalement changer votre imposition. Une heure de consultation avec un expert-comptable spécialisé peut générer des années d'économies.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'Fiscalité locative 2025 : micro-foncier, réel, LMNP',
      'description': 'Régime micro-foncier, régime réel, déficit foncier, LMNP — comment optimiser légalement votre déclaration de revenus locatifs.',
      'image': 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80',
      'author': { '@type': 'Organization', 'name': 'Bailio' },
      'publisher': { '@type': 'Organization', 'name': 'Bailio', 'url': 'https://bailio.fr' },
      'datePublished': '2025-04-01',
      'dateModified': '2026-04-10',
      'mainEntityOfPage': { '@type': 'WebPage', '@id': 'https://bailio.fr/guide/fiscalite-locative' },
    },
  },

  'etat-des-lieux': {
    intro: "L'état des lieux est le document pivot de votre relation bailleur-locataire. Bien réalisé à l'entrée, il vous protège — propriétaire comme locataire — à la sortie. Bâclé, il ouvre la porte aux litiges les plus coûteux sur le dépôt de garantie. Mode d'emploi complet.",
    sections: [
      { type: 'h2', content: "EDL d'entrée : la rigueur paie à la sortie" },
      { type: 'p', content: "L'état des lieux d'entrée doit être réalisé contradictoirement — en présence des deux parties (ou de leurs mandataires) — le jour de la remise des clés, ou au plus tard lors de la prise de possession réelle. Il décrit précisément l'état de chaque élément du logement au moment de l'entrée." },
      { type: 'checklist', items: [
        "Parcourir chaque pièce dans l'ordre : séjour, chambres, cuisine, salle de bain, WC, couloir, cave, parking",
        "Décrire l'état des murs (traces, taches, trous, peinture), sols (rayures, taches, usure) et plafonds (fissures, traces)",
        "Tester chaque équipement : volets, serrures, robinets, chasse d'eau, VMC, interphone",
        "Relever les compteurs (eau, gaz, électricité) et noter les index précis",
        "Photographier chaque anomalie notée — photo datée sur smartphone",
        "Lister l'ensemble du mobilier et équipements fournis si meublé",
        "Ne pas signer sous pression : prendre le temps qu'il faut",
      ]},
      { type: 'tip', content: "Si vous êtes en désaccord sur un point lors de l'EDL d'entrée, notez-le explicitement : « le locataire conteste l'état du parquet de la chambre ». Un document signé avec réserves vaut bien mieux qu'un document refusé ou signé à contrecœur." },
      { type: 'h2', content: "Les 10 jours après la remise des clés" },
      { type: 'p', content: "Si vous constatez des défauts non mentionnés dans l'EDL après votre installation (humidité apparue au premier chauffage, tache cachée sous un meuble…), vous disposez de 10 jours calendaires après la remise des clés pour compléter l'état des lieux d'entrée par lettre RAR au propriétaire. Pour les problèmes de chauffage, ce délai est étendu au premier mois de la période de chauffe." },
      { type: 'h2', content: "EDL de sortie : les enjeux financiers" },
      { type: 'p', content: "L'état des lieux de sortie est comparé au document d'entrée pour identifier les dégradations imputables au locataire. La distinction fondamentale à faire est celle entre usure normale (non déductible) et dégradation réelle (déductible du dépôt de garantie)." },
      { type: 'numbered', items: [
        "Usure normale non imputable : peinture jaunie par le temps, parquet légèrement terni, joints de salle de bain usés, moquette comprimée aux passages",
        "Dégradation imputable : trou dans le mur, tache brûlée sur le parquet, vitre cassée, moisissures dues au manque d'aération, papier peint arraché",
        "La grille de vétusté (si jointe au bail) plafonne les retenues selon l'ancienneté des revêtements",
        "Sans grille de vétusté, le juge apprécie au cas par cas en tenant compte de l'ancienneté constatée",
      ]},
      { type: 'h2', content: "Désaccord à la sortie : que faire ?" },
      { type: 'p', content: "Si le propriétaire retient une partie du dépôt sans justificatif, ou pour une usure normale, contestez par courrier RAR dans les 2 mois suivant la réception du décompte. Joignez vos photos comparatives entrée/sortie. En cas d'échec, saisir la Commission Départementale de Conciliation (CDC) est gratuit et préalable obligatoire avant tout recours judiciaire." },
      { type: 'warning', content: "Si le propriétaire ne se présente pas à l'état des lieux de sortie et ne mandate personne, envoyez-lui une mise en demeure par RAR. Sans EDL de sortie contradictoire, il perd le droit de procéder à quelque retenue que ce soit sur le dépôt de garantie." },
    ],
    tips: [
      "Réalisez l'EDL d'entrée à la même heure et dans les mêmes conditions de lumière que la visite",
      "Photographiez systématiquement chaque anomalie, même minime — les photos sont datées automatiquement",
      "Joignez une grille de vétusté au bail pour sécuriser les deux parties sur les retenues à la sortie",
      "Conservez une copie numérique et papier de l'EDL d'entrée pendant toute la durée du bail",
      "Réalisez un EDL de sortie même si le locataire part à l'amiable — c'est une obligation légale",
    ],
    conclusion: "Un état des lieux rigoureux est le meilleur investissement de temps que vous puissiez faire en tant que propriétaire ou locataire. Il définit clairement les responsabilités de chacun et évite des mois de litige. Traitez-le comme un document juridique — parce que c'en est un.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'État des lieux : guide complet entrée et sortie',
      'description': "Comment réaliser un état des lieux rigoureux, gérer les désaccords et récupérer son dépôt de garantie.",
      'image': 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
      'author': { '@type': 'Organization', 'name': 'Bailio' },
      'publisher': { '@type': 'Organization', 'name': 'Bailio', 'url': 'https://bailio.fr' },
      'datePublished': '2025-02-20',
      'dateModified': '2026-02-15',
      'mainEntityOfPage': { '@type': 'WebPage', '@id': 'https://bailio.fr/guide/etat-des-lieux' },
    },
  },

  'charges-recuperables': {
    intro: "En tant que propriétaire, vous ne pouvez refacturer à votre locataire que les charges expressément listées par le décret du 26 août 1987. Cette liste est limitative — toute charge hors liste reste à votre charge exclusive. Voici ce que vous pouvez légalement récupérer.",
    sections: [
      { type: 'h2', content: "Le cadre légal : le décret de 1987" },
      { type: 'p', content: "Le décret n°87-713 du 26 août 1987 établit la liste exhaustive des charges locatives récupérables. Il couvre 6 grandes catégories : ascenseurs et monte-charge, eau froide et chaude, chauffage collectif, parties communes intérieures, espaces extérieurs, et taxes et redevances. Toute charge hors de ces catégories ne peut pas être imputée au locataire, même si elle est mentionnée dans le bail — une telle clause serait réputée non écrite." },
      { type: 'h2', content: "1. Eau froide, eau chaude et chauffage collectif" },
      { type: 'checklist', items: [
        "Eau froide : consommation collective des parties communes, entretien des installations, location de compteurs",
        "Eau chaude sanitaire collective : consommation + entretien de la chaudière ou du système solaire",
        "Chauffage collectif : combustible, exploitation et entretien de la chaufferie, robinets thermostatiques",
        "Purges, vidanges et réglages saisonniers des installations",
        "Compteurs divisionnaires : location et relevé de compteurs individuels",
      ]},
      { type: 'h2', content: "2. Ascenseurs et monte-charge" },
      { type: 'checklist', items: [
        "Électricité consommée par l'ascenseur",
        "Fournitures nécessaires à l'entretien courant et au fonctionnement",
        "Contrat d'entretien préventif (hors remplacement de pièces importantes)",
        "Petites réparations dues à l'usure normale d'utilisation",
        "Frais de visite de contrôle obligatoire (tous les 6 mois)",
      ]},
      { type: 'h2', content: "3. Parties communes intérieures" },
      { type: 'checklist', items: [
        "Électricité des parties communes (couloirs, halls, caves, parkings, local poubelles)",
        "Produits d'entretien ménager et matériel de nettoyage",
        "Rémunération du personnel d'entretien ménager (si distinct du gardien)",
        "Entretien et nettoyage des tapis et moquettes des parties communes",
        "Entretien des équipements collectifs : interphone, digicode, boîtes aux lettres",
      ]},
      { type: 'h2', content: "4. Espaces extérieurs et espaces verts" },
      { type: 'checklist', items: [
        "Entretien des allées, cours et parkings : balayage, arrosage, désherbage",
        "Tonte des pelouses, taille des haies et arbustes, désherbage des massifs",
        "Entretien des aires de jeux et du mobilier extérieur commun",
        "Produits phytosanitaires et engrais pour les espaces verts",
      ]},
      { type: 'h2', content: "5. Gardiennage" },
      { type: 'p', content: "Si votre immeuble dispose d'un gardien ou d'un employé d'immeuble qui assure à la fois des missions de gardiennage et d'entretien des parties communes, vous pouvez récupérer 75% de sa rémunération charges comprises sur votre locataire. Si le gardien effectue uniquement du gardiennage (sans entretien), ce taux est ramené à 40%." },
      { type: 'h2', content: "6. Taxes récupérables" },
      { type: 'p', content: "Seules deux taxes sont légalement récupérables : la Taxe d'Enlèvement des Ordures Ménagères (TEOM), qui figure sur une ligne distincte de votre avis de taxe foncière, et la redevance d'assainissement collectif si elle existe dans votre commune." },
      { type: 'warning', content: "La taxe foncière en elle-même N'EST PAS récupérable sur le locataire. Seule la ligne TEOM de cet avis l'est. C'est l'une des erreurs les plus fréquentes : des propriétaires répercutent la totalité de la taxe foncière. C'est illégal." },
      { type: 'h2', content: "Ce que vous ne pouvez PAS récupérer" },
      { type: 'numbered', items: [
        "Gros travaux de structure : ravalement de façade, réfection de toiture, remplacement de chaudière collective vétuste",
        "Assurance de l'immeuble ou PNO (propriétaire non-occupant)",
        "Honoraires d'agence immobilière ou de gestion locative",
        "Frais de procédure judiciaire liés au locataire",
        "Remplacement complet de l'ascenseur (mais son entretien courant oui)",
        "Taxe foncière (hors ligne TEOM distincte)",
      ]},
      { type: 'tip', content: "Chaque année, envoyez à votre locataire un décompte détaillé par poste de charges accompagné des justificatifs correspondants. Ce geste de transparence prévient les contestations et instaure une relation de confiance durable sur toute la durée de la location." },
    ],
    tips: [
      "Conservez toutes les factures de charges pendant 3 ans pour justifier vos régularisations",
      "Envoyez le décompte annuel au moins 1 mois avant la régularisation",
      "Vérifiez le décret de 1987 avant d'ajouter un nouveau poste de charges",
      "Ne facturez jamais la taxe foncière — seule la ligne TEOM est récupérable",
      "En cas de doute, consultez l'ADIL de votre département gratuitement",
    ],
    conclusion: "Respecter scrupuleusement la liste des charges récupérables vous protège contre des contestations qui peuvent aboutir à des remboursements forcés avec intérêts. La transparence dans la gestion des charges est aussi l'un des meilleurs moyens de fidéliser un bon locataire.",
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'Charges récupérables : liste complète et légale 2025',
      'description': "Décret du 26 août 1987, eau, ascenseur, parties communes, taxes — la liste exhaustive des charges légalement récupérables sur votre locataire.",
      'image': 'https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=1200&q=80',
      'author': { '@type': 'Organization', 'name': 'Bailio' },
      'publisher': { '@type': 'Organization', 'name': 'Bailio', 'url': 'https://bailio.fr' },
      'datePublished': '2025-03-15',
      'dateModified': '2026-03-10',
      'mainEntityOfPage': { '@type': 'WebPage', '@id': 'https://bailio.fr/guide/charges-recuperables' },
    },
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
          lineHeight: 1.78,
          marginBottom: 18,
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
              gap: 12,
              padding: '9px 0',
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
        <ol style={{ margin: '0 0 20px 0', padding: 0, listStyle: 'none' }}>
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
      padding: 'clamp(36px, 5vw, 60px) clamp(16px, 5vw, 48px)',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <p style={{
          fontFamily: BAI.fontBody,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
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
                textTransform: 'uppercase' as const,
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

  useSEO({
    title: meta
      ? `${meta.title} | Bailio`
      : 'Guide | Bailio',
    description: meta?.description ?? 'Guide complet sur la location immobilière par Bailio.',
    canonical: slug ? `https://bailio.fr/guide/${slug}` : 'https://bailio.fr/guide',
    ogImage: meta?.image,
    type: 'article',
    jsonLd: content?.jsonLd,
  })

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
              minHeight: 44,
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

        {/* Hero */}
        <div style={{ position: 'relative', background: '#0a0d1a', overflow: 'hidden' }}>
          <img
            src={meta.image}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: 0.28,
              pointerEvents: 'none',
            }}
          />
          <div style={{
            position: 'relative',
            zIndex: 1,
            padding: 'clamp(40px, 7vw, 72px) clamp(16px, 5vw, 48px) clamp(32px, 5vw, 56px)',
            maxWidth: 860,
            margin: '0 auto',
          }}>
            {/* Breadcrumb SEO */}
            <nav aria-label="Fil d'Ariane" style={{ marginBottom: 20 }}>
              <ol style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: 0,
                margin: 0,
                listStyle: 'none',
                flexWrap: 'wrap',
              }}>
                <li>
                  <Link
                    to="/"
                    style={{
                      fontFamily: BAI.fontBody,
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.5)',
                      textDecoration: 'none',
                    }}
                  >
                    Accueil
                  </Link>
                </li>
                <li style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>›</li>
                <li>
                  <Link
                    to="/guide"
                    style={{
                      fontFamily: BAI.fontBody,
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.5)',
                      textDecoration: 'none',
                    }}
                  >
                    Guide
                  </Link>
                </li>
                <li style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>›</li>
                <li>
                  <span style={{
                    fontFamily: BAI.fontBody,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.75)',
                  }}>
                    {meta.title}
                  </span>
                </li>
              </ol>
            </nav>

            {/* Back link */}
            <Link
              to="/guide"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: BAI.fontBody,
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
                textDecoration: 'none',
                marginBottom: 20,
                transition: BAI.transition,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            >
              <ArrowLeft size={14} />
              Retour au guide
            </Link>

            {/* Tag + meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
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
                textTransform: 'uppercase' as const,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}>
                <Tag size={9} />
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
                color: 'rgba(255,255,255,0.75)',
              }}>
                <Clock size={12} />
                {meta.readTime} min de lecture
              </span>
              <span style={{
                fontFamily: BAI.fontBody,
                fontSize: 12,
                color: 'rgba(255,255,255,0.38)',
              }}>
                Mis à jour : {meta.updatedAt}
              </span>
            </div>

            {/* Title H1 */}
            <h1 style={{
              fontFamily: BAI.fontDisplay,
              fontSize: 'clamp(24px, 4.5vw, 42px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#ffffff',
              lineHeight: 1.18,
              margin: '0 0 16px',
              maxWidth: 720,
            }}>
              {meta.title}
            </h1>

            {/* Description */}
            <p style={{
              fontFamily: BAI.fontBody,
              fontSize: 'clamp(14px, 1.5vw, 16px)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.6,
              margin: 0,
              maxWidth: 620,
            }}>
              {meta.description}
            </p>
          </div>
        </div>

        {/* Article body */}
        <div style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: 'clamp(32px, 5vw, 60px) clamp(16px, 5vw, 40px)',
        }}>
          {/* Intro */}
          <p style={{
            fontFamily: BAI.fontBody,
            fontSize: 'clamp(15px, 1.8vw, 17px)',
            color: BAI.ink,
            lineHeight: 1.78,
            fontWeight: 500,
            marginBottom: 36,
            paddingBottom: 30,
            borderBottom: `2px solid ${BAI.border}`,
          }}>
            {content.intro}
          </p>

          {/* Sections */}
          {content.sections.map((section, i) => (
            <RenderSection key={i} section={section} />
          ))}

          {/* Tips à retenir */}
          {content.tips.length > 0 && (
            <div style={{
              marginTop: 48,
              background: BAI.bgMuted,
              border: `1px solid ${BAI.border}`,
              borderRadius: 12,
              padding: '24px 28px',
            }}>
              <p style={{
                fontFamily: BAI.fontBody,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: BAI.caramel,
                marginBottom: 12,
              }}>
                À retenir
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {content.tips.map((tip, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontFamily: BAI.fontBody,
                    fontSize: 14,
                    color: BAI.inkMid,
                    lineHeight: 1.55,
                  }}>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: BAI.caramel,
                      flexShrink: 0,
                      marginTop: 6,
                    }} />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conclusion */}
          <p style={{
            fontFamily: BAI.fontBody,
            fontSize: 'clamp(14px, 1.6vw, 16px)',
            color: BAI.inkMid,
            lineHeight: 1.78,
            fontStyle: 'italic',
            marginTop: 36,
            paddingTop: 28,
            borderTop: `1px solid ${BAI.border}`,
          }}>
            {content.conclusion}
          </p>

          {/* CTA bas d'article */}
          <div style={{
            marginTop: 48,
            padding: '28px 32px',
            background: BAI.night,
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'flex-start',
          }}>
            <p style={{
              fontFamily: BAI.fontDisplay,
              fontSize: 'clamp(18px, 3vw, 24px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.25,
            }}>
              {meta.role === 'tenant'
                ? 'Prêt à trouver votre prochain logement ?'
                : 'Gérez vos biens simplement avec Bailio'}
            </p>
            <p style={{
              fontFamily: BAI.fontBody,
              fontSize: 13,
              color: 'rgba(255,255,255,0.58)',
              margin: 0,
              lineHeight: 1.55,
            }}>
              {meta.role === 'tenant'
                ? "Consultez des milliers d'annonces de particuliers, sans frais d'agence."
                : 'Publiez votre annonce, gérez candidatures, visites et contrats — tout en ligne.'}
            </p>
            <button
              onClick={() => navigate(meta.role === 'tenant' ? '/search' : '/register?role=OWNER')}
              style={{
                background: BAI.caramel,
                color: '#fff',
                border: 'none',
                borderRadius: BAI.radius,
                padding: '12px 24px',
                fontFamily: BAI.fontBody,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 4,
                minHeight: 44,
                transition: BAI.transition,
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
