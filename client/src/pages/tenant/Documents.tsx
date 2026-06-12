import { useState } from 'react'
import { pdf, Document, Page, Text, StyleSheet } from '@react-pdf/renderer'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import {
  FileText, Download, Copy, Check, AlertTriangle, Scale,
  Key, ChevronDown, ChevronUp, Hammer, ShieldCheck,
  ReceiptText, Bell, ClipboardList, Home, ArrowLeftRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'

// ─── PDF styles ──────────────────────────────────────────────────────────────
const pdfStyles = StyleSheet.create({
  page: {
    padding: 65,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  header: { fontSize: 7, textAlign: 'right', color: '#999999', marginBottom: 40 },
  title: { fontSize: 13, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  body: { lineHeight: 1.8 },
  footer: { fontSize: 7, textAlign: 'right', color: '#999999', position: 'absolute', bottom: 30, right: 65 },
})

const LetterPDF = ({ content, title }: { content: string; title: string }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <Text style={pdfStyles.header}>bailio.fr</Text>
      <Text style={pdfStyles.title}>{title}</Text>
      <Text style={pdfStyles.body}>{content}</Text>
      <Text style={pdfStyles.footer}>bailio.fr</Text>
    </Page>
  </Document>
)

// ─── Template data ─────────────────────────────────────────────────────────
interface LetterTemplate {
  id: string
  title: string
  category: string
  description: string
  icon: React.ElementType
  color: string
  content: string
}

const LETTERS: LetterTemplate[] = [
  // ── RÉSILIATION ─────────────────────────────────────────────────────────────
  {
    id: 'resil-1mois',
    title: 'Préavis de départ — 1 mois',
    category: 'Résiliation',
    description: 'Résiliation avec préavis réduit (zone tendue, mutation, chômage, santé...)',
    icon: Key,
    color: BAI.tenant,
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du propriétaire / Agence]
[Adresse du propriétaire]

Objet : Résiliation du bail avec préavis d'un mois — Logement situé au [ADRESSE DU BIEN]

Madame, Monsieur,

Par la présente lettre recommandée avec accusé de réception, je vous notifie ma décision de résilier le bail portant sur le logement que j'occupe situé au [ADRESSE COMPLÈTE DU BIEN], que je loue depuis le [DATE D'ENTRÉE DANS LES LIEUX].

Conformément à l'article 15-I de la loi n° 89-462 du 6 juillet 1989, je bénéficie d'un préavis réduit à UN (1) MOIS pour le motif suivant :

☑ Logement situé en zone d'urbanisation continue de plus de 50 000 habitants (zone tendue)
☐ Obtention d'un premier emploi / perte d'emploi / nouvel emploi consécutif à une perte d'emploi
☐ Mutation professionnelle
☐ État de santé justifiant un changement de domicile (certificat médical joint)
☐ Bénéficiaire du RSA ou de l'AAH
☐ Attribution d'un logement social

[JOINDRE LE JUSTIFICATIF CORRESPONDANT]

Mon départ effectif est prévu pour le [DATE DE FIN DU PRÉAVIS].

Je vous propose de convenir ensemble d'une date pour l'état des lieux de sortie et la remise des clés avant cette échéance.

Je vous remercie de me confirmer réception du présent courrier.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'resil-3mois',
    title: 'Préavis de départ — 3 mois',
    category: 'Résiliation',
    description: 'Résiliation classique d\'un bail vide (préavis 3 mois)',
    icon: Key,
    color: BAI.tenant,
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du propriétaire / Agence]
[Adresse du propriétaire]

Objet : Résiliation du contrat de bail — Logement situé au [ADRESSE DU BIEN]

Madame, Monsieur,

Par la présente lettre recommandée avec accusé de réception, je vous notifie ma décision de résilier le contrat de bail portant sur le logement que j'occupe situé au [ADRESSE COMPLÈTE DU BIEN], que je loue depuis le [DATE D'ENTRÉE DANS LES LIEUX].

Conformément à l'article 15-I de la loi n° 89-462 du 6 juillet 1989, je respecte un délai de préavis de TROIS (3) MOIS à compter de la réception du présent courrier.

Mon départ effectif est donc prévu pour le [DATE DE FIN DU PRÉAVIS].

Je me tiens à votre disposition pour organiser l'état des lieux de sortie et la remise des clés à une date convenant aux deux parties, avant ou à l'échéance de mon préavis.

Je vous rappelle que le dépôt de garantie d'un montant de [MONTANT DU DÉPÔT] € devra m'être restitué dans un délai d'un mois (si l'état des lieux de sortie est conforme) ou de deux mois à compter de la remise des clés.

Je vous remercie de me confirmer la bonne réception de ce courrier.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'resil-meuble-1mois',
    title: 'Préavis de départ — bail meublé (1 mois)',
    category: 'Résiliation',
    description: 'Résiliation d\'un bail meublé (préavis légal d\'un mois)',
    icon: Key,
    color: BAI.tenant,
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du propriétaire / Agence]
[Adresse du propriétaire]

Objet : Résiliation du bail meublé — Logement situé au [ADRESSE DU BIEN]

Madame, Monsieur,

Par la présente lettre recommandée avec accusé de réception, je vous notifie ma décision de résilier le contrat de location meublée portant sur le logement situé au [ADRESSE COMPLÈTE DU BIEN].

Conformément aux dispositions de l'article 25-8 de la loi n° 89-462 du 6 juillet 1989, je bénéficie d'un délai de préavis d'UN (1) MOIS pour la résiliation d'un bail de logement meublé.

Le préavis commençant à courir à compter de la réception du présent courrier, mon départ effectif est prévu pour le [DATE DE FIN DU PRÉAVIS].

Je vous propose de fixer ensemble la date de l'état des lieux de sortie et de remise des clés.

Le dépôt de garantie d'un montant de [MONTANT] € devra m'être restitué dans le délai légal d'un mois (si l'état des lieux de sortie est conforme à l'état d'entrée) ou de deux mois dans le cas contraire.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'resil-mutation',
    title: 'Préavis réduit — mutation professionnelle',
    category: 'Résiliation',
    description: 'Résiliation avec justificatif de mutation ou perte d\'emploi (1 mois)',
    icon: ArrowLeftRight,
    color: BAI.tenant,
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du propriétaire / Agence]
[Adresse du propriétaire]

Objet : Résiliation du bail avec préavis réduit — Mutation professionnelle

Madame, Monsieur,

Par la présente lettre recommandée avec accusé de réception, je vous notifie ma décision de résilier le contrat de bail portant sur le logement situé au [ADRESSE COMPLÈTE DU BIEN].

En application de l'article 15-I de la loi n° 89-462 du 6 juillet 1989, je bénéficie d'un délai de préavis réduit à UN (1) MOIS en raison de [ma mutation professionnelle / la perte de mon emploi / l'obtention d'un nouvel emploi consécutif à une perte d'emploi].

Vous trouverez ci-joint le justificatif correspondant : [LETTRE DE MUTATION / ATTESTATION EMPLOYEUR / JUSTIFICATIF PÔLE EMPLOI].

Mon départ effectif est donc prévu pour le [DATE DE FIN DU PRÉAVIS].

Je reste à votre disposition pour organiser l'état des lieux de sortie avant cette date.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },

  // ── CONTESTATIONS ───────────────────────────────────────────────────────────
  {
    id: 'contestation-charges',
    title: 'Contestation des charges locatives',
    category: 'Contestations',
    description: 'Demande de régularisation ou de justification des charges récupérables',
    icon: Scale,
    color: '#7c3aed',
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du propriétaire / Agence]
[Adresse du propriétaire]

Objet : Contestation des charges locatives — Demande de décompte justificatif

Madame, Monsieur,

Je suis locataire du logement situé au [ADRESSE DU BIEN] depuis le [DATE D'ENTRÉE] et vous verse mensuellement une provision sur charges de [MONTANT DES CHARGES] €.

Conformément aux articles 23 et 23-2 de la loi du 6 juillet 1989 et au décret n° 87-713 du 26 août 1987, les charges locatives récupérées doivent correspondre aux dépenses effectivement engagées et ne peuvent porter que sur les postes limitativement énumérés par ce décret.

Or, à ce jour [CHOISIR LE MOTIF] :
• Je n'ai pas reçu de décompte de charges pour [l'année / les années] [PRÉCISER]
• Le décompte reçu comporte des postes qui ne figurent pas dans la liste des charges récupérables
• La régularisation annuelle fait apparaître un écart injustifié de [MONTANT] €

Je vous demande de bien vouloir m'adresser dans un délai d'UN (1) MOIS :
• Le décompte détaillé des charges par nature de dépenses
• Les justificatifs correspondants (factures, contrats d'entretien, relevés de compteurs)
• La copie des contrats passés avec les prestataires si applicable

À défaut de réponse satisfaisante dans ce délai, je me verrai contraint(e) de saisir la Commission Départementale de Conciliation.

Cordialement,

[Votre Prénom Nom]`,
  },
  {
    id: 'contestation-augmentation-loyer',
    title: 'Contestation d\'une augmentation de loyer',
    category: 'Contestations',
    description: 'Opposition à une révision de loyer non conforme à l\'IRL ou illégale',
    icon: AlertTriangle,
    color: BAI.error,
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du propriétaire / Agence]
[Adresse du propriétaire]

Objet : Contestation de la révision du loyer notifiée le [DATE DE LA NOTIFICATION]

Madame, Monsieur,

J'accuse réception de votre courrier du [DATE] m'informant d'une révision de mon loyer qui passerait de [ANCIEN MONTANT] € à [NOUVEAU MONTANT] €.

Après vérification, je me vois dans l'obligation de contester cette révision pour les raisons suivantes :

[CHOISIR LE(S) MOTIF(S) APPLICABLE(S) :]
• Le délai légal de prescription d'UN (1) AN pour la révision du loyer n'a pas été respecté — la révision aurait dû intervenir le [DATE] au plus tard
• L'indice de référence des loyers (IRL) appliqué est erroné : l'IRL du [TRIMESTRE PRÉVU AU BAIL] [ANNÉE] est de [VALEUR IRL CORRECTE] et non de [VALEUR ERRONÉE APPLIQUÉE]
• Aucune clause de révision n'est prévue dans notre contrat de bail du [DATE DU BAIL]
• Le logement est situé en zone d'encadrement des loyers et le montant demandé dépasse le loyer de référence majoré fixé à [MONTANT PLAFOND] €

Je vous demande donc de maintenir mon loyer au montant actuel de [MONTANT ACTUEL] € et de me confirmer votre accord par écrit.

À défaut, je saisirai la Commission Départementale de Conciliation et les autorités compétentes.

Cordialement,

[Votre Prénom Nom]`,
  },
  {
    id: 'contestation-reparation',
    title: 'Contestation d\'une retenue sur dépôt de garantie',
    category: 'Contestations',
    description: 'Opposition à une retenue injustifiée sur le dépôt de garantie',
    icon: Scale,
    color: '#7c3aed',
    content: `[Votre Prénom Nom]
[Nouvelle adresse]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du propriétaire / Agence]
[Adresse du propriétaire]

Objet : Contestation des retenues sur le dépôt de garantie — Logement situé au [ADRESSE DU BIEN]

Madame, Monsieur,

J'ai quitté le logement situé au [ADRESSE DU BIEN] le [DATE DE DÉPART] et vous ai remis les clés ce même jour. L'état des lieux de sortie a été réalisé le [DATE DE L'ÉTAT DES LIEUX].

Vous m'avez restitué le [DATE] / adressé un courrier le [DATE] m'informant d'une retenue de [MONTANT DES RETENUES] € sur mon dépôt de garantie de [MONTANT INITIAL] €, invoquant les motifs suivants : [LISTE DES MOTIFS RETENUS PAR LE PROPRIÉTAIRE].

Je conteste ces retenues pour les raisons suivantes :

[DÉTAILLER LES CONTESTATIONS :]
• [La dégradation invoquée (ex: rayure sur parquet) était déjà présente à mon entrée dans les lieux et figure à l'état des lieux d'entrée du [DATE] — cf. page [X]]
• [L'usure normale de [équipement] sur [X] années d'occupation ne saurait être mise à ma charge conformément à la loi]
• [Le devis produit est excessif au regard des prix du marché : je produis un contre-devis de [MONTANT] €]

Je vous demande de me restituer la somme de [MONTANT CONTESTÉ] € dans un délai de QUINZE (15) JOURS.

À défaut, je saisirai la Commission Départementale de Conciliation, puis le tribunal d'instance.

Cordialement,

[Votre Prénom Nom]`,
  },

  // ── DEMANDES ────────────────────────────────────────────────────────────────
  {
    id: 'demande-reparation',
    title: 'Demande de réparation au propriétaire',
    category: 'Demandes',
    description: 'Signalement d\'un équipement défectueux à la charge du bailleur',
    icon: Hammer,
    color: '#0e7490',
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du propriétaire / Agence]
[Adresse du propriétaire]

Objet : Demande de réparation — [DESCRIPTION COURTE DU PROBLÈME]

Madame, Monsieur,

Je suis locataire du logement situé au [ADRESSE DU BIEN] depuis le [DATE D'ENTRÉE DANS LES LIEUX].

Je vous informe que [DÉCRIRE L'ÉQUIPEMENT OU LA PARTIE DU LOGEMENT CONCERNÉE] est [en panne / défectueux(se) / dégradé(e)] dans les conditions suivantes : [DÉCRIRE LE PROBLÈME EN DÉTAIL].

Cette situation est apparue le [DATE D'APPARITION DU PROBLÈME].

Conformément à l'article 6 de la loi n° 89-462 du 6 juillet 1989, il vous appartient en tant que bailleur d'entretenir le logement en bon état et d'effectuer les réparations autres que locatives. Cette réparation ne fait pas partie des réparations locatives listées par le décret n° 87-712 du 26 août 1987 et incombe donc bien à votre charge.

[SI URGENCE :] Cette situation présente un caractère d'urgence car [PRÉCISER : risque pour la sécurité, insalubrité, etc.]. Je vous demande une intervention dans les plus brefs délais.

Je vous saurais gré de bien vouloir mandater un professionnel pour remédier à cette situation dans un délai de [DÉLAI EN JOURS] jours à compter de la réception de ce courrier.

À défaut, je me verrai contraint(e) d'engager les démarches légales appropriées.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'demande-restitution-depot',
    title: 'Demande de restitution du dépôt de garantie',
    category: 'Demandes',
    description: 'Mise en demeure de restituer le dépôt de garantie hors délai',
    icon: ReceiptText,
    color: '#92400e',
    content: `[Votre Prénom Nom]
[Nouvelle adresse]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du propriétaire / Agence]
[Adresse du propriétaire]

Objet : Mise en demeure — Restitution du dépôt de garantie

Madame, Monsieur,

J'ai quitté le logement situé au [ADRESSE DU BIEN] le [DATE DE DÉPART], suite à la remise des clés et à l'état des lieux de sortie réalisé contradictoirement le [DATE DE L'ÉTAT DES LIEUX].

La comparaison entre l'état des lieux d'entrée et de sortie démontre que j'ai restitué le logement dans un état conforme, sans dégradation au-delà de l'usure normale.

Conformément à l'article 22 de la loi du 6 juillet 1989, le dépôt de garantie de [MONTANT] € devait m'être restitué dans un délai d'UN (1) MOIS à compter de la remise des clés, soit au plus tard le [DATE LIMITE LÉGALE].

Or, à ce jour, je n'ai toujours pas reçu ce remboursement, malgré [mon courrier du [DATE] / mes relances téléphoniques].

Je vous mets en demeure, par la présente, de me restituer la somme de [MONTANT] €, majorée des intérêts au taux légal courant depuis la date d'expiration du délai de restitution, dans un délai de HUIT (8) JOURS.

À défaut, je saisirai sans délai supplémentaire la Commission Départementale de Conciliation, puis le tribunal judiciaire compétent.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'demande-travaux-autorisation',
    title: "Demande d'autorisation de travaux",
    category: 'Demandes',
    description: 'Demande d\'autorisation au bailleur pour réaliser des travaux d\'aménagement',
    icon: Hammer,
    color: '#0e7490',
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du propriétaire / Agence]
[Adresse du propriétaire]

Objet : Demande d'autorisation de travaux d'aménagement

Madame, Monsieur,

En ma qualité de locataire du logement situé au [ADRESSE DU BIEN] depuis le [DATE D'ENTRÉE], je me permets de solliciter votre autorisation pour réaliser les travaux d'aménagement suivants :

Nature des travaux envisagés :
[DÉCRIRE PRÉCISÉMENT LES TRAVAUX :]
• [Ex : Pose de tablettes murales dans la cuisine]
• [Ex : Remplacement du mitigeur de la salle de bains]
• [Ex : Peinture des murs du séjour (couleur : [PRÉCISER])]
• [Ex : Installation d'une tringle à rideaux]

Ces aménagements ont pour but [PRÉCISER L'OBJECTIF : améliorer le confort, personnaliser l'espace, etc.] et ne constituent pas des transformations affectant la structure du logement.

Les travaux seront réalisés [par moi-même / par un professionnel qualifié] et n'engendreront aucun dommage pour le logement. À mon départ, je m'engage à [remettre les lieux en l'état initial / vous proposer de conserver ces aménagements à titre gratuit si vous le souhaitez].

Je reste à votre disposition pour tout renseignement complémentaire et vous saurais gré de me confirmer votre accord par écrit.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'demande-remboursement-taxe-ordures',
    title: 'Demande de remboursement — taxe ordures ménagères',
    category: 'Demandes',
    description: 'Demande de remboursement de la TEOM payée directement par le locataire',
    icon: FileText,
    color: BAI.inkMid,
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du propriétaire / Agence]
[Adresse du propriétaire]

Objet : Demande de remboursement de la taxe d'enlèvement des ordures ménagères (TEOM)

Madame, Monsieur,

En ma qualité de locataire du logement situé au [ADRESSE DU BIEN], je me permets de vous adresser la présente au sujet de la taxe d'enlèvement des ordures ménagères (TEOM).

Conformément à l'article 23 de la loi du 6 juillet 1989, la TEOM constitue une charge récupérable à la charge du locataire, que le propriétaire est en droit de me demander de régler.

Or, [CHOISIR LA SITUATION] :
• La TEOM incluse dans mes charges (provision mensuelle) a fait l'objet d'une double facturation lors de la régularisation annuelle
• J'ai acquitté directement auprès de la collectivité la somme de [MONTANT] € au titre de la TEOM pour l'année [ANNÉE], dont je vous demande le remboursement

Je vous transmets ci-joint [l'avis de taxe foncière faisant apparaître le montant TEOM / le justificatif de paiement direct].

Je vous serais reconnaissant(e) de bien vouloir régulariser ce point et de me rembourser la somme de [MONTANT] € dans un délai de TRENTE (30) JOURS.

Cordialement,

[Votre Prénom Nom]`,
  },
  {
    id: 'demande-decompte-charges',
    title: 'Demande de décompte détaillé des charges',
    category: 'Demandes',
    description: 'Demande au bailleur de fournir le justificatif annuel des charges',
    icon: ClipboardList,
    color: '#0e7490',
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du propriétaire / Agence]
[Adresse du propriétaire]

Objet : Demande de décompte justificatif des charges locatives — Année [ANNÉE]

Madame, Monsieur,

Je suis locataire du logement situé au [ADRESSE DU BIEN] et vous règle chaque mois une provision sur charges de [MONTANT] €.

Conformément à l'article 23 de la loi n° 89-462 du 6 juillet 1989, vous êtes tenu(e) de me communiquer, un mois avant toute régularisation, le décompte des charges par nature, ainsi que le mode de répartition entre les locataires le cas échéant.

Or, à ce jour, je n'ai pas reçu le décompte justificatif des charges pour l'exercice [ANNÉE / PÉRIODE].

Je vous demande de bien vouloir me transmettre dans les meilleurs délais :
• Le décompte détaillé des charges par poste (entretien, eau, chauffage, ascenseur, etc.)
• Les justificatifs correspondants (factures, contrats de maintenance, relevés)
• Le calcul de la part me revenant si l'immeuble comporte plusieurs logements
• L'éventuelle régularisation à opérer (solde dû ou crédit à restituer)

Je vous rappelle que ces documents doivent être mis à ma disposition pendant SIX (6) MOIS après l'envoi du décompte.

Dans l'attente de votre réponse, je vous adresse mes cordiales salutations.

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },

  // ── SINISTRES ───────────────────────────────────────────────────────────────
  {
    id: 'declaration-sinistre',
    title: 'Déclaration de sinistre à l\'assureur',
    category: 'Sinistres',
    description: 'Déclaration d\'un sinistre (dégât des eaux, incendie, vol...) à votre assurance',
    icon: ShieldCheck,
    color: BAI.error,
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Nom de la compagnie d'assurance]
[Adresse de la compagnie]

Objet : Déclaration de sinistre — Police n° [NUMÉRO DE POLICE] / Contrat n° [NUMÉRO DE CONTRAT]

Madame, Monsieur,

Je vous informe qu'un sinistre est survenu dans mon logement situé au [ADRESSE COMPLÈTE DU BIEN], le [DATE DU SINISTRE] à [HEURE APPROXIMATIVE].

Nature du sinistre : [DÉGÂT DES EAUX / INCENDIE / CAMBRIOLAGE / TEMPÊTE / AUTRE]

Description des circonstances :
[DÉCRIRE PRÉCISÉMENT LES CIRCONSTANCES : comment le sinistre s'est produit, son étendue, les dommages constatés]

Dommages constatés :
[LISTER LES BIENS ET ÉQUIPEMENTS ENDOMMAGÉS OU DÉTRUITS :]
• [Bien 1 — description — valeur estimée]
• [Bien 2 — description — valeur estimée]
• [Dégâts matériels au logement : DÉCRIRE]

[Si dégât des eaux :] L'origine du sinistre semble provenir de [l'appartement du dessus / une canalisation / PRÉCISER]. J'ai immédiatement prévenu [le propriétaire / le syndic / le voisin concerné].

Vous trouverez ci-joint : [photographies des dommages / liste des biens détruits / factures d'achat / constats amiables signés].

Je reste à votre disposition pour toute démarche complémentaire et pour la prise de rendez-vous avec votre expert.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'declaration-sinistre-tardif',
    title: 'Déclaration de sinistre — tardive',
    category: 'Sinistres',
    description: 'Déclaration d\'un sinistre après le délai réglementaire avec justification',
    icon: Bell,
    color: '#92400e',
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Nom de la compagnie d'assurance]
[Adresse de la compagnie]

Objet : Déclaration de sinistre hors délai — Police n° [NUMÉRO] — Demande de dérogation

Madame, Monsieur,

Je vous adresse la présente au sujet d'un sinistre survenu dans mon logement situé au [ADRESSE DU BIEN] le [DATE DU SINISTRE].

Je reconnais que cette déclaration intervient hors du délai légal de [2 / 5] jours ouvrés prévu par les conditions générales de votre contrat. Je vous fais part des circonstances exceptionnelles qui m'ont empêché(e) de vous contacter dans les délais impartis :

[PRÉCISER LES RAISONS : hospitalisation, absence à l'étranger, découverte tardive du sinistre, cas de force majeure, etc.]

Je vous assure que ce retard n'a pas eu d'incidence sur l'étendue des dommages, qui n'ont pas évolué depuis la survenue du sinistre.

[DÉCRIRE LE SINISTRE ET LES DOMMAGES CONSTATÉS]

Je sollicite votre bienveillance pour accepter cette déclaration malgré son caractère tardif, en application du principe selon lequel la déchéance pour déclaration tardive ne s'applique qu'en cas de préjudice pour l'assureur.

Je reste à votre disposition pour tout complément d'information.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },

  // ── ATTESTATIONS ────────────────────────────────────────────────────────────
  {
    id: 'attestation-hebergement',
    title: "Attestation d'hébergement",
    category: 'Attestations',
    description: "Attestation certifiant héberger une personne à titre gratuit",
    icon: Home,
    color: '#1a3270',
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

[Ville], le [DATE]

ATTESTATION D'HÉBERGEMENT

Je soussigné(e), [Votre Prénom Nom], né(e) le [VOTRE DATE DE NAISSANCE] à [VOTRE LIEU DE NAISSANCE], demeurant au [ADRESSE COMPLÈTE DU LOGEMENT],

Certifie sur l'honneur héberger à mon domicile à titre gratuit :

[Prénom Nom de la personne hébergée]
Né(e) le [DATE DE NAISSANCE] à [LIEU DE NAISSANCE]
Nationalité : [NATIONALITÉ]

et ce depuis le [DATE DE DÉBUT D'HÉBERGEMENT].

Je certifie que cette personne réside effectivement à l'adresse précitée et que j'assume l'entière responsabilité de cet hébergement.

Je suis conscient(e) que toute fausse déclaration m'exposerait aux sanctions prévues par la loi.

Pièces jointes :
☐ Copie de ma pièce d'identité en cours de validité
☐ Justificatif de domicile à mon nom (moins de 3 mois)

Fait à [Ville], le [DATE], pour servir et valoir ce que de droit.

Signature :

_______________________
[Votre Prénom Nom]`,
  },
  {
    id: 'preavi-preavis-reduit-justificatif',
    title: 'Demande de justificatif pour préavis d\'un mois',
    category: 'Attestations',
    description: 'Demande de document au bailleur confirmant l\'éligibilité au préavis réduit',
    icon: FileText,
    color: BAI.inkMid,
    content: `[Votre Prénom Nom]
[Adresse du logement]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du propriétaire / Agence]
[Adresse du propriétaire]

Objet : Demande de confirmation — Éligibilité au préavis réduit d'un mois

Madame, Monsieur,

Je suis locataire du logement situé au [ADRESSE DU BIEN] et envisage de quitter ce logement prochainement.

Je souhaite bénéficier du préavis réduit à UN (1) MOIS prévu à l'article 15-I de la loi n° 89-462 du 6 juillet 1989, au titre de [PRÉCISER LE MOTIF : zone tendue / mutation professionnelle / perte d'emploi / état de santé / attribution d'un logement social / bénéficiaire RSA ou AAH].

Afin de constituer mon dossier de départ et de m'assurer que toutes les conditions sont réunies, je vous serais reconnaissant(e) de bien vouloir me confirmer :

1. Que le logement est bien situé en zone d'urbanisation continue de plus de 50 000 habitants (zone tendue) [SI APPLICABLE]
2. Que vous acceptez le motif de préavis réduit que je vous indique
3. La date limite à laquelle mon courrier de préavis doit vous parvenir pour une sortie effective le [DATE SOUHAITÉE]

Dans l'attente de votre réponse, je vous adresse mes cordiales salutations.

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
]

const CATEGORIES = ['Tous', ...Array.from(new Set(LETTERS.map(l => l.category)))]

// ─── Main component ──────────────────────────────────────────────────────────
export default function TenantDocuments() {
  const { user } = useAuth()

  const [activeCategory, setActiveCategory] = useState('Tous')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const tenantName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : ''

  const fillTemplate = (content: string): string => {
    let result = content
    if (tenantName) result = result.replace(/\[Votre Prénom Nom\]/g, tenantName)
    return result
  }

  const filtered =
    activeCategory === 'Tous' ? LETTERS : LETTERS.filter(l => l.category === activeCategory)

  const handleCopy = (letter: LetterTemplate) => {
    navigator.clipboard.writeText(fillTemplate(letter.content))
    setCopied(letter.id)
    toast.success('Texte copié dans le presse-papiers')
    setTimeout(() => setCopied(null), 2500)
  }

  const handleDownloadPDF = async (letter: LetterTemplate) => {
    setDownloadingId(letter.id)
    try {
      const blob = await pdf(
        <LetterPDF content={fillTemplate(letter.content)} title={letter.title} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${letter.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF téléchargé')
    } catch {
      toast.error('Erreur lors de la génération du PDF')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <Layout>
      {/* ── Hero sombre Hyperbeat ── */}
      <div style={{ background: '#0a0d1a', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px) clamp(32px,5vw,56px)' }}>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, margin: 0 }}>
          LOCATAIRE
        </p>
        <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,42px)', fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: '6px 0 8px', lineHeight: 1.1 }}>
          Mes Courriers Types
        </h1>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
          Modèles de lettres prêts à l'emploi — copiez, personnalisez et téléchargez en PDF
        </p>
        <div className="flex flex-wrap gap-3" style={{ marginTop: 28 }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 16, padding: '16px 24px', minWidth: 130 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>MODÈLES</p>
            <p style={{ fontFamily: BAI.fontDisplay, fontSize: 36, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1 }}>
              {LETTERS.length}
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 16, padding: '16px 24px', minWidth: 130 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>CATÉGORIES</p>
            <p style={{ fontFamily: BAI.fontDisplay, fontSize: 36, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1 }}>
              {CATEGORIES.length - 1}
            </p>
          </div>
        </div>
      </div>

      <div style={{ background: BAI.bgBase, minHeight: '60vh', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>

          {/* Info banner */}
          <div style={{
            background: BAI.tenantLight,
            border: `1px solid ${BAI.tenantBorder}`,
            borderRadius: 10, padding: '14px 18px', marginBottom: 28,
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <ShieldCheck style={{ color: BAI.tenant, width: 18, height: 18, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink, margin: 0, lineHeight: 1.6 }}>
              Ces modèles de courriers sont conformes à la législation française (loi n° 89-462 du 6 juillet 1989).
              Personnalisez les zones entre crochets <strong>[…]</strong> avant envoi.
              Pour les lettres recommandées, conservez l'accusé de réception.
            </p>
          </div>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '7px 16px', borderRadius: 20, minHeight: 36,
                  border: activeCategory === cat
                    ? `1.5px solid ${BAI.night}`
                    : `1.5px solid ${BAI.border}`,
                  background: activeCategory === cat ? BAI.night : BAI.bgSurface,
                  color: activeCategory === cat ? '#ffffff' : BAI.inkMid,
                  fontFamily: BAI.fontBody, fontSize: 13,
                  fontWeight: activeCategory === cat ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Letters list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(letter => {
              const Icon = letter.icon
              const isExpanded = expanded === letter.id
              const isDownloading = downloadingId === letter.id

              return (
                <div
                  key={letter.id}
                  style={{
                    background: BAI.bgSurface,
                    border: `1px solid ${BAI.border}`,
                    borderRadius: 12, overflow: 'hidden',
                    boxShadow: '0 1px 2px rgba(13,12,10,0.04)',
                  }}
                >
                  {/* Card header */}
                  <div
                    onClick={() => setExpanded(isExpanded ? null : letter.id)}
                    style={{
                      padding: 'clamp(14px, 2vw, 18px) 20px',
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      cursor: 'pointer',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: `${letter.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon style={{ color: letter.color, width: 18, height: 18 }} />
                    </div>

                    {/* Title + description */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 15, color: BAI.ink }}>
                          {letter.title}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: `${letter.color}12`, color: letter.color,
                          whiteSpace: 'nowrap',
                        }}>
                          {letter.category}
                        </span>
                      </div>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: '2px 0 0' }}>
                        {letter.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Copy */}
                      <button
                        onClick={() => handleCopy(letter)}
                        title="Copier le texte"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '7px 11px', borderRadius: 8, minHeight: 36,
                          border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
                          fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 500,
                          color: copied === letter.id ? BAI.tenant : BAI.inkMid,
                          cursor: 'pointer',
                        }}
                      >
                        {copied === letter.id
                          ? <><Check style={{ width: 13, height: 13 }} /> Copié</>
                          : <><Copy style={{ width: 13, height: 13 }} /> Copier</>
                        }
                      </button>

                      {/* PDF */}
                      <button
                        onClick={() => handleDownloadPDF(letter)}
                        disabled={isDownloading}
                        title="Télécharger en PDF"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '7px 11px', borderRadius: 8, minHeight: 36,
                          border: `1px solid ${BAI.caramel}30`,
                          background: `${BAI.caramel}08`,
                          fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 500,
                          color: BAI.caramel, cursor: isDownloading ? 'wait' : 'pointer',
                          opacity: isDownloading ? 0.7 : 1,
                        }}
                      >
                        <Download style={{ width: 13, height: 13 }} />
                        {isDownloading ? 'PDF…' : 'PDF'}
                      </button>

                      {/* Expand/collapse chevron */}
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: BAI.bgMuted, cursor: 'pointer',
                      }}
                        onClick={e => { e.stopPropagation(); setExpanded(isExpanded ? null : letter.id) }}
                      >
                        {isExpanded
                          ? <ChevronUp style={{ width: 14, height: 14, color: BAI.inkMid }} />
                          : <ChevronDown style={{ width: 14, height: 14, color: BAI.inkMid }} />
                        }
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{
                      borderTop: `1px solid ${BAI.border}`,
                      padding: '20px 24px',
                      background: BAI.bgBase,
                    }}>
                      <pre style={{
                        fontFamily: 'monospace', fontSize: 12, color: BAI.ink,
                        whiteSpace: 'pre-wrap', lineHeight: 1.8,
                        margin: 0, background: BAI.bgSurface,
                        border: `1px solid ${BAI.border}`,
                        borderRadius: 8, padding: '16px 20px',
                      }}>
                        {fillTemplate(letter.content)}
                      </pre>

                      <p style={{
                        fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint,
                        margin: '12px 0 0',
                      }}>
                        Remplacez toutes les zones entre <strong>[crochets]</strong> par vos informations personnelles avant d'envoyer ce courrier.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </Layout>
  )
}
