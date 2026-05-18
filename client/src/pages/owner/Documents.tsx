import { useState, useEffect } from 'react'
import { pdf, Document, Page, Text, StyleSheet } from '@react-pdf/renderer'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import {
  FileText, Download, Copy, Check, AlertTriangle, TrendingUp,
  UserX, Wrench, Key, FileCheck, ChevronDown, ChevronUp, Send,
  Loader2, Users, ShieldAlert, Scale, Home, ReceiptText, Building2,
  ClipboardList, Hammer, Bell, ArrowLeftRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '../../services/api.service'
import { useAuth } from '../../hooks/useAuth'
import type { Contract } from '../../types/contract.types'

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

// ─── Template data ────────────────────────────────────────────────────────────
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
  {
    id: 'relance-1',
    title: '1ère relance loyer impayé',
    category: 'Impayés',
    description: 'Rappel amiable pour un loyer en retard',
    icon: AlertTriangle,
    color: '#92400e',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du locataire]

Objet : Rappel de loyer impayé

Madame, Monsieur,

Je me permets de vous contacter au sujet du loyer du mois de [MOIS ANNÉE] concernant votre logement situé au [ADRESSE DU BIEN].

À ce jour, je n'ai pas reçu le règlement de la somme de [MONTANT] euros correspondant à votre loyer charges comprises.

Je vous serais reconnaissant(e) de bien vouloir procéder au règlement de cette somme dans les meilleurs délais.

Si vous rencontrez des difficultés passagères, n'hésitez pas à me contacter afin que nous trouvions ensemble une solution amiable.

Dans l'attente d'une régularisation rapide de votre situation, je reste à votre disposition.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'relance-2',
    title: '2ème relance loyer impayé',
    category: 'Impayés',
    description: 'Mise en demeure formelle de payer',
    icon: AlertTriangle,
    color: BAI.error,
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du locataire]

Objet : MISE EN DEMEURE — Loyer(s) impayé(s)

Madame, Monsieur,

Malgré ma précédente lettre de rappel en date du [DATE RELANCE 1], je constate que le(s) loyer(s) suivant(s) demeure(nt) impayé(s) :

- Loyer de [MOIS 1] : [MONTANT] €
- Loyer de [MOIS 2] : [MONTANT] € (le cas échéant)
TOTAL DÛ : [MONTANT TOTAL] €

Par la présente, je vous mets en demeure de régulariser cette situation dans un délai de HUIT (8) JOURS à compter de la réception de ce courrier.

À défaut de règlement dans ce délai, je me verrai contraint(e) de faire appel à un huissier de justice et d'engager une procédure judiciaire pour obtenir votre expulsion et le recouvrement des sommes dues, conformément aux dispositions de la loi du 6 juillet 1989.

Recevez, Madame, Monsieur, mes salutations distinguées.

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'revision-loyer',
    title: 'Lettre de révision de loyer',
    category: 'Loyer',
    description: "Notification d'augmentation selon l'IRL",
    icon: TrendingUp,
    color: '#1a3270',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement loué]

Objet : Révision annuelle du loyer

Madame, Monsieur,

Conformément aux dispositions de l'article 17-1 de la loi n° 89-462 du 6 juillet 1989 et à la clause de révision prévue dans notre contrat de bail en date du [DATE DU BAIL], je vous informe de la révision annuelle de votre loyer.

La révision est effectuée sur la base de l'Indice de Référence des Loyers (IRL) publié par l'INSEE :

• IRL du trimestre de référence prévu au bail : [IRL DE RÉFÉRENCE (ex: 3e trimestre 2023)]
• IRL du dernier trimestre publié : [NOUVEL IRL]
• Ancien loyer hors charges : [ANCIEN LOYER] €
• Nouveau loyer calculé : [ANCIEN LOYER] × [NOUVEL IRL] / [IRL RÉFÉRENCE] = [NOUVEAU LOYER] €

À compter du [DATE D'APPLICATION], votre nouveau loyer mensuel hors charges sera de [NOUVEAU LOYER] euros.

Le montant des charges reste inchangé à [MONTANT CHARGES] euros.

Votre nouveau loyer charges comprises sera donc de [NOUVEAU LOYER + CHARGES] euros.

Je reste à votre disposition pour tout renseignement complémentaire.

Cordialement,

[Votre Prénom Nom]`,
  },
  {
    id: 'conge-bailleur',
    title: 'Congé donné par le bailleur',
    category: 'Fin de bail',
    description: 'Reprise du logement pour habiter ou vendre',
    icon: UserX,
    color: '#6b21a8',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement]

Objet : Congé pour [REPRISE POUR HABITER / VENTE / MOTIF LÉGITIME ET SÉRIEUX]

Madame, Monsieur,

Par la présente lettre recommandée avec accusé de réception, je vous notifie votre congé pour le logement que vous occupez situé au [ADRESSE COMPLÈTE DU BIEN], conformément aux dispositions de l'article 15 de la loi du 6 juillet 1989.

[CHOISIR LE MOTIF APPROPRIÉ :]

MOTIF 1 — REPRISE POUR HABITER :
Ce congé est motivé par la reprise du logement pour y habiter personnellement / pour y loger [mon/ma conjoint(e), mon/ma partenaire pacsé(e), mes ascendants/descendants], [PRÉNOM NOM], qui se trouve dans la nécessité de se loger.

MOTIF 2 — VENTE :
Ce congé est motivé par la vente du logement. En vertu de l'article 15-II de la loi du 6 juillet 1989, vous bénéficiez d'un droit de préemption. Le prix de vente est fixé à [PRIX] euros. Vous disposez d'un délai de deux mois à compter de la réception de ce congé pour exercer ce droit.

Le bail prenant fin le [DATE DE FIN DU BAIL], vous devrez libérer les lieux au plus tard à cette date.

Je vous rappelle que votre préavis est de SIX (6) MOIS pour un logement loué vide, ou TROIS (3) MOIS pour un logement loué meublé.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Votre Prénom Nom]`,
  },
  {
    id: 'etat-lieux-sortie',
    title: 'Convocation état des lieux de sortie',
    category: 'État des lieux',
    description: "Planification de l'état des lieux de sortie",
    icon: Key,
    color: '#0e7490',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement]

Objet : Convocation à l'état des lieux de sortie

Madame, Monsieur,

Suite à votre préavis de départ, je vous contacte afin d'organiser l'état des lieux de sortie de votre logement situé au [ADRESSE DU BIEN].

Je vous propose de nous retrouver le [DATE] à [HEURE] pour procéder ensemble à cet état des lieux contradictoire.

Lors de cette visite, vous devrez me remettre :
• L'ensemble des clés et badges d'accès
• Les documents liés au logement (notices, garanties, etc.)

Le dépôt de garantie d'un montant de [MONTANT] euros vous sera restitué dans un délai d'UN (1) MOIS si l'état des lieux de sortie est conforme à l'état des lieux d'entrée, ou de DEUX (2) MOIS dans le cas contraire, après déduction des sommes dues.

Merci de me confirmer ce rendez-vous dans les plus brefs délais ou de me proposer une autre date si celle-ci ne vous convient pas.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'travaux-bailleur',
    title: 'Notification de travaux',
    category: 'Travaux',
    description: 'Information du locataire sur des travaux à venir',
    icon: Wrench,
    color: BAI.caramel,
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement]

Objet : Information — Travaux dans votre logement / dans l'immeuble

Madame, Monsieur,

Je vous informe que des travaux [DE RÉNOVATION / D'ENTRETIEN / D'AMÉLIORATION / NÉCESSAIRES À LA CONSERVATION DU LOGEMENT] vont être réalisés dans votre logement / dans les parties communes de l'immeuble.

Nature des travaux : [DESCRIPTION DES TRAVAUX]

Ces travaux débuteront le [DATE DE DÉBUT] et se termineront le [DATE DE FIN ESTIMÉE], soit une durée de [DURÉE] jours ouvrés.

Les intervenants seront présents aux horaires suivants : [HORAIRES, ex: du lundi au vendredi, de 8h à 17h].

Conformément à l'article 7 de la loi du 6 juillet 1989, vous êtes tenu(e) de laisser accès à votre logement pour la réalisation de ces travaux.

[SI DURÉE > 21 JOURS :] Ces travaux étant d'une durée supérieure à 21 jours, vous pourrez, conformément à l'article 1724 du Code civil, demander une réduction de loyer proportionnelle à la durée et à la nature des travaux.

Je reste à votre disposition pour toute question.

Cordialement,

[Votre Prénom Nom]
[Téléphone]`,
  },
  {
    id: 'quittance-manuelle',
    title: 'Reçu de paiement de loyer',
    category: 'Loyer',
    description: 'Quittance simple à compléter manuellement',
    icon: FileCheck,
    color: '#1b5e3b',
    content: `QUITTANCE DE LOYER

Je soussigné(e), [Prénom Nom du propriétaire], demeurant au [Adresse du propriétaire],

déclare avoir reçu de [Prénom Nom du locataire],

la somme de [MONTANT EN LETTRES] euros ([MONTANT EN CHIFFRES] €)

pour le paiement du loyer et des charges du logement situé au :
[ADRESSE COMPLÈTE DU BIEN LOUÉ]

Pour la période du 1er au [DERNIER JOUR] [MOIS] [ANNÉE]

Détail :
• Loyer hors charges : [MONTANT LOYER] €
• Charges : [MONTANT CHARGES] €
• TOTAL : [MONTANT TOTAL] €

Fait à [Ville], le [DATE]

Signature du bailleur :

_______________________
[Prénom Nom du propriétaire]

---
Cette quittance ne vaut pas reçu définitif en cas de paiement par chèque.`,
  },
  {
    id: 'demande-document',
    title: 'Demande de documents au locataire',
    category: 'Dossier',
    description: 'Réclamation de pièces justificatives manquantes',
    icon: FileText,
    color: BAI.inkMid,
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du candidat/locataire]
[Adresse]

Objet : Demande de documents complémentaires

Madame, Monsieur,

Suite à votre candidature / dans le cadre de la constitution de votre dossier locataire pour le logement situé au [ADRESSE DU BIEN], je souhaite vous demander les documents suivants qui n'ont pas encore été transmis :

☐ Pièce d'identité en cours de validité (recto/verso)
☐ 3 derniers bulletins de salaire
☐ Dernier avis d'imposition
☐ Justificatif de domicile actuel (moins de 3 mois)
☐ Contrat de travail (CDI / CDD / autre)
☐ Attestation employeur
☐ [AUTRE DOCUMENT]

Merci de bien vouloir me transmettre ces pièces dans un délai de [DÉLAI] jours par email à [VOTRE EMAIL] ou en les déposant directement sur la plateforme Bailio.

Sans retour de votre part dans ce délai, je me verrai dans l'obligation d'étudier d'autres candidatures.

Restant disponible pour tout renseignement complémentaire,

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },

  // ── CAUTION & GARANTIE ───────────────────────────────────────────────────────
  {
    id: 'appel-caution',
    title: 'Appel à la caution',
    category: 'Caution',
    description: 'Mise en demeure du garant en cas de défaillance du locataire',
    icon: ShieldAlert,
    color: '#7c3aed',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du garant]
[Adresse du garant]

Objet : Mise en demeure — Appel en garantie

Madame, Monsieur,

Je me permets de vous contacter en votre qualité de caution solidaire du locataire [Prénom Nom du locataire], occupant le logement situé au [ADRESSE DU BIEN].

En vertu de l'acte de cautionnement solidaire signé le [DATE DE L'ACTE DE CAUTION], vous vous êtes engagé(e) à répondre solidairement des obligations locatives de ce dernier.

Or, à ce jour, [Prénom Nom du locataire] accuse un retard de paiement portant sur les loyers suivants :

- Loyer de [MOIS 1] : [MONTANT] €
- Loyer de [MOIS 2] : [MONTANT] € (le cas échéant)
TOTAL DÛ : [MONTANT TOTAL] €

Malgré mes relances auprès du locataire, demeurées sans effet, je me vois dans l'obligation de vous mettre en demeure de régler la somme de [MONTANT TOTAL] € dans un délai de QUINZE (15) JOURS à compter de la réception de la présente.

À défaut de règlement dans ce délai, je me verrai contraint(e) d'engager toutes voies de recours à l'encontre de votre débiteur principal et de votre personne conjointement.

Je reste à votre disposition pour tout renseignement.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'recu-depot-garantie',
    title: 'Reçu du dépôt de garantie',
    category: 'Caution',
    description: 'Attestation de réception du dépôt de garantie à la remise des clés',
    icon: ReceiptText,
    color: '#1b5e3b',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

REÇU DU DÉPÔT DE GARANTIE

Je soussigné(e), [Votre Prénom Nom], propriétaire bailleur,

Atteste avoir reçu de [Prénom Nom du locataire],

La somme de [MONTANT EN CHIFFRES] euros ([MONTANT EN LETTRES] €),

À titre de dépôt de garantie pour le logement situé au [ADRESSE COMPLÈTE DU BIEN].

Ce dépôt de garantie représente [UN / DEUX] mois de loyer hors charges, conformément au contrat de bail conclu le [DATE DU BAIL].

Cette somme sera restituée dans les conditions et délais prévus par la loi du 6 juillet 1989, déduction faite, le cas échéant, des sommes dues par le locataire au titre des dégradations ou loyers impayés constatés à la fin du bail.

Fait à [Ville], le [DATE]

Signature du bailleur :

_______________________
[Votre Prénom Nom]`,
  },
  {
    id: 'remboursement-depot',
    title: 'Remboursement dépôt de garantie (avec retenue)',
    category: 'Caution',
    description: 'Restitution partielle du dépôt de garantie avec justification des retenues',
    icon: ArrowLeftRight,
    color: '#92400e',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du locataire]
[Nouvelle adresse du locataire]

Objet : Restitution du dépôt de garantie — Logement situé au [ADRESSE DU BIEN]

Madame, Monsieur,

Suite à la fin de votre bail et à la remise des clés intervenue le [DATE DE REMISE DES CLÉS], je vous restitue le dépôt de garantie déduction faite des sommes suivantes, justifiées par les pièces jointes au présent courrier :

DÉPÔT DE GARANTIE INITIAL : [MONTANT INITIAL] €

RETENUES OPÉRÉES :
- [Motif 1 — ex: Remplacement de [équipement] endommagé] : [MONTANT] €
- [Motif 2 — ex: Loyer/charges du mois de [mois] impayé] : [MONTANT] €
- [Motif 3] : [MONTANT] €
TOTAL DES RETENUES : [TOTAL RETENUES] €

SOMME RESTITUÉE : [MONTANT INITIAL - TOTAL RETENUES] €

[Si solde négatif :] Le dépôt de garantie étant insuffisant pour couvrir l'ensemble des sommes dues, je vous adresse une facture complémentaire de [COMPLÉMENT] € dont je vous demande le règlement dans les meilleurs délais.

Vous trouverez ci-joint les devis et factures justifiant les retenues opérées.

Cordialement,

[Votre Prénom Nom]`,
  },

  // ── CONGÉS ────────────────────────────────────────────────────────────────────
  {
    id: 'conge-habiter',
    title: 'Congé pour reprise personnelle',
    category: 'Fin de bail',
    description: 'Notification de congé pour habiter le logement (art. 15 loi 89-462)',
    icon: Home,
    color: '#1a3270',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement]

Objet : Congé pour reprise — Article 15 de la loi du 6 juillet 1989

Madame, Monsieur,

Par la présente lettre recommandée avec accusé de réception, je vous notifie le congé du logement que vous occupez situé au [ADRESSE COMPLÈTE DU BIEN], conformément à l'article 15 de la loi n° 89-462 du 6 juillet 1989.

Ce congé est motivé par la reprise du logement à des fins d'occupation personnelle. Le logement sera destiné à être habité par [moi-même / mon conjoint(e) / ma conjointe / mon/ma partenaire de PACS / mon ascendant(e) / mon descendant(e)], [PRÉNOM NOM], qui se trouve dans la nécessité de se loger à titre de résidence principale.

Votre bail arrivant à échéance le [DATE D'ÉCHÉANCE DU BAIL], ce congé prendra effet à cette date. Vous disposez d'un préavis de SIX (6) MOIS pour un logement loué vide, ou TROIS (3) MOIS pour un logement meublé, à compter de la réception du présent courrier.

Vous devrez libérer les lieux et remettre les clés au plus tard le [DATE DE LIBÉRATION].

Je reste à votre disposition pour organiser l'état des lieux de sortie à une date convenant aux deux parties.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Votre Prénom Nom]`,
  },
  {
    id: 'conge-vendre',
    title: 'Congé pour vendre',
    category: 'Fin de bail',
    description: 'Notification de vente avec droit de préemption du locataire (art. 15-II)',
    icon: Building2,
    color: '#6b21a8',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement]

Objet : Congé pour vente — Article 15-II de la loi du 6 juillet 1989

Madame, Monsieur,

Par la présente lettre recommandée avec accusé de réception, je vous notifie le congé du logement que vous occupez situé au [ADRESSE COMPLÈTE DU BIEN], conformément aux dispositions de l'article 15-II de la loi n° 89-462 du 6 juillet 1989.

Ce congé est motivé par la mise en vente du logement et de ses dépendances.

En application de la loi précitée, ce congé vaut offre de vente à votre profit. Le prix de vente est fixé à [PRIX EN CHIFFRES] euros ([PRIX EN LETTRES]), avec les conditions suivantes : [PRÉCISER LES CONDITIONS DE PAIEMENT].

Vous disposez d'un délai de DEUX (2) MOIS à compter de la réception du présent courrier pour faire connaître votre décision. Si vous souhaitez acquérir le bien, vous devrez réaliser la vente dans les deux mois suivant votre acceptation (quatre mois en cas de recours à un prêt immobilier).

À défaut de réponse de votre part dans ce délai, l'offre deviendra caduque.

Votre bail arrivant à échéance le [DATE D'ÉCHÉANCE], vous devrez libérer les lieux au plus tard le [DATE DE LIBÉRATION], soit à l'issue d'un préavis de SIX (6) MOIS.

Sont reproduits ci-après les cinq premiers alinéas de l'article 15-II de la loi du 6 juillet 1989, conformément aux obligations légales.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Votre Prénom Nom]`,
  },
  {
    id: 'conge-motif-serieux',
    title: 'Congé pour motif légitime et sérieux',
    category: 'Fin de bail',
    description: 'Résiliation pour manquement grave aux obligations locatives',
    icon: Scale,
    color: BAI.error,
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement]

Objet : Congé pour motif légitime et sérieux — Article 15 de la loi du 6 juillet 1989

Madame, Monsieur,

Par la présente lettre recommandée avec accusé de réception, je vous notifie le congé du logement que vous occupez situé au [ADRESSE COMPLÈTE DU BIEN], conformément à l'article 15 de la loi n° 89-462 du 6 juillet 1989.

Ce congé est fondé sur un motif légitime et sérieux tenant aux manquements suivants à vos obligations contractuelles :

[DÉTAILLER LES MANQUEMENTS, ex :]
- Non-paiement répété des loyers aux échéances convenues, malgré les relances effectuées en date du [DATE] et du [DATE]
- Troubles de voisinage persistants signalés par [PRÉCISER]
- Sous-location non autorisée constatée le [DATE]
- Dégradations importantes du logement constatées lors de la visite du [DATE]

Votre bail arrivant à échéance le [DATE D'ÉCHÉANCE DU BAIL], ce congé prendra effet à cette date. Vous devrez libérer les lieux au plus tard le [DATE DE LIBÉRATION], dans le respect d'un préavis de SIX (6) MOIS pour un logement vide, ou TROIS (3) MOIS pour un logement meublé.

Je vous rappelle que vous êtes tenu(e) de restituer le logement dans l'état dans lequel il vous a été remis, conformément à l'état des lieux d'entrée.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Votre Prénom Nom]`,
  },

  // ── ATTESTATIONS ──────────────────────────────────────────────────────────────
  {
    id: 'attestation-loyer',
    title: 'Attestation de loyer',
    category: 'Attestations',
    description: "Attestation pour le locataire (CAF, employeur, banque...)",
    icon: FileCheck,
    color: '#0e7490',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

ATTESTATION DE LOYER

Je soussigné(e), [Votre Prénom Nom], agissant en qualité de propriétaire bailleur,

Certifie sur l'honneur que [Prénom Nom du locataire] est locataire du logement situé au [ADRESSE COMPLÈTE DU BIEN] depuis le [DATE D'ENTRÉE DANS LES LIEUX].

Détail du loyer en vigueur :
• Loyer mensuel hors charges : [MONTANT LOYER HC] €
• Charges locatives : [MONTANT CHARGES] €
• TOTAL MENSUEL CHARGES COMPRISES : [MONTANT TOTAL] €

Le locataire est à jour de ses paiements au [DATE] : ☑ OUI  ☐ NON
[Si NON : montant de la dette — [MONTANT DETTE] €]

Cette attestation est délivrée à la demande de l'intéressé(e) pour servir et valoir ce que de droit.

Fait à [Ville], le [DATE]

Signature du bailleur :

_______________________
[Votre Prénom Nom]`,
  },
  {
    id: 'accord-dematerialisation',
    title: "Accord dématérialisation des quittances",
    category: 'Attestations',
    description: "Convention pour l'envoi des quittances par voie électronique",
    icon: FileText,
    color: BAI.inkMid,
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement]

Objet : Accord pour la transmission dématérialisée des quittances de loyer

Madame, Monsieur,

Conformément aux dispositions de la loi n° 89-462 du 6 juillet 1989 et dans un souci de simplification administrative, je vous propose de vous adresser vos quittances de loyer mensuelles par voie électronique, à l'adresse email suivante : [EMAIL DU LOCATAIRE].

Cette transmission dématérialisée présente les avantages suivants :
• Réception immédiate à chaque début de mois
• Conservation numérique sécurisée
• Accès disponible depuis votre espace Bailio

Si vous acceptez cette modalité de transmission, je vous invite à me retourner le présent document signé, ou à confirmer votre accord par email.

Vous conservez à tout moment la possibilité de revenir à une transmission papier sur simple demande de votre part.

Cordialement,

[Votre Prénom Nom]

---

✂ À retourner signé au bailleur

Je soussigné(e), [Prénom Nom du locataire], locataire du logement situé au [ADRESSE DU BIEN], accepte de recevoir mes quittances de loyer par voie électronique à l'adresse : [EMAIL DU LOCATAIRE].

Fait à [Ville], le [DATE]          Signature : _______________`,
  },

  // ── CONTENTIEUX ───────────────────────────────────────────────────────────────
  {
    id: 'reparation-degradations',
    title: 'Demande de réparation — dégradations',
    category: 'Contentieux',
    description: 'Mise en demeure du locataire de réparer les dégradations constatées',
    icon: Hammer,
    color: BAI.error,
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement]

Objet : Demande de remise en état — Dégradations locatives

Madame, Monsieur,

À l'occasion de [ma visite du logement / l'état des lieux de sortie] réalisée le [DATE], j'ai constaté les dégradations suivantes dans le logement situé au [ADRESSE DU BIEN], qui excèdent la simple usure normale résultant d'un usage conforme :

[LISTER LES DÉGRADATIONS :]
1. [Description de la dégradation 1 — pièce, équipement concerné]
2. [Description de la dégradation 2]
3. [Description de la dégradation 3]

Conformément à l'article 7 de la loi du 6 juillet 1989, vous êtes tenu(e) de répondre des dégradations et pertes survenues pendant la durée du contrat, sauf si vous pouvez prouver qu'elles ont eu lieu par cas de force majeure, par la faute du bailleur ou par le fait d'un tiers.

Je vous demande, par la présente, de procéder à la remise en état du logement dans un délai de [DÉLAI] jours à compter de la réception de ce courrier, ou de me régler la somme estimée à [MONTANT ESTIMÉ] euros correspondant au coût de remise en état.

À défaut, je procéderai à ces réparations à vos frais et engagerai toutes voies de recours pour obtenir remboursement.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Votre Prénom Nom]`,
  },
  {
    id: 'contestation-facture-prestataire',
    title: 'Contestation de facture prestataire',
    category: 'Contentieux',
    description: 'Contestation d\'une facture abusive ou non conforme au devis',
    icon: AlertTriangle,
    color: '#92400e',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Nom de l'entreprise prestataire]
[Adresse du prestataire]

Objet : Contestation de la facture n° [NUMÉRO DE FACTURE] du [DATE DE LA FACTURE]

Madame, Monsieur,

J'ai bien reçu votre facture n° [NUMÉRO] d'un montant de [MONTANT FACTURÉ] € relative à [DESCRIPTION DES TRAVAUX/PRESTATIONS] réalisés dans mon bien situé au [ADRESSE DU BIEN].

Après vérification, je constate que cette facture ne correspond pas aux conditions initialement acceptées pour les raisons suivantes :

[PRÉCISER LES MOTIFS :]
• Le devis accepté le [DATE DU DEVIS] s'élevait à [MONTANT DU DEVIS] € — soit un dépassement injustifié de [ÉCART] €
• [Les travaux suivants n'ont pas été réalisés / ont été réalisés de façon incomplète] : [DÉTAIL]
• [Des postes supplémentaires ont été facturés sans accord préalable de ma part]

En conséquence, je conteste le montant de cette facture et vous propose de régler la somme de [MONTANT ACCEPTÉ] €, correspondant aux prestations effectivement réalisées et conformes au devis.

Je vous invite à me faire parvenir une facture rectificative dans un délai de QUINZE (15) JOURS. À défaut, je me verrai contraint(e) de saisir les autorités compétentes.

Cordialement,

[Votre Prénom Nom]`,
  },
  {
    id: 'litige-retard-travaux',
    title: 'Litige — retard de travaux',
    category: 'Contentieux',
    description: 'Mise en demeure d\'un artisan pour dépassement du délai convenu',
    icon: Wrench,
    color: '#92400e',
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

Lettre recommandée avec accusé de réception

[Ville], le [DATE]

[Nom de l'entreprise]
[Adresse de l'entreprise]

Objet : Mise en demeure — Retard dans l'exécution des travaux

Madame, Monsieur,

Suite au devis accepté le [DATE DU DEVIS] pour la réalisation de [DESCRIPTION DES TRAVAUX] dans mon bien situé au [ADRESSE DU BIEN], vos équipes devaient intervenir du [DATE DÉBUT PRÉVUE] au [DATE FIN PRÉVUE].

Or, à ce jour, les travaux [n'ont pas débuté / ne sont pas achevés / présentent les malfaçons suivantes : DÉTAIL].

Ce retard me cause un préjudice direct [logement inoccupé / locataire pénalisé / loyers perdus] depuis le [DATE], représentant une perte évaluée à [MONTANT] €.

Je vous mets en demeure par la présente d'achever les travaux conformément au devis dans un délai de [DÉLAI] JOURS à compter de la réception de ce courrier.

Passé ce délai, je me réserve le droit :
• De faire appel à une autre entreprise pour finaliser les travaux à vos frais
• De déduire les pénalités de retard de votre règlement
• D'engager toute procédure judiciaire en réparation du préjudice subi

Cordialement,

[Votre Prénom Nom]`,
  },

  // ── GESTION ───────────────────────────────────────────────────────────────────
  {
    id: 'notification-changement-proprio',
    title: 'Notification de changement de propriétaire',
    category: 'Gestion',
    description: 'Information du locataire suite à la vente du bien',
    icon: Bell,
    color: BAI.owner,
    content: `[Nouveau propriétaire — Prénom Nom]
[Adresse du nouveau propriétaire]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du locataire]
[Adresse du logement]

Objet : Notification de changement de propriétaire — Logement situé au [ADRESSE DU BIEN]

Madame, Monsieur,

Je me permets de vous informer qu'à compter du [DATE DE TRANSFERT DE PROPRIÉTÉ], j'ai acquis le logement que vous occupez situé au [ADRESSE COMPLÈTE DU BIEN].

Par conséquent, je suis désormais votre nouveau bailleur. Votre contrat de bail est maintenu sans modification dans tous ses termes et conditions, conformément aux dispositions de l'article 1743 du Code civil.

À compter de cette date, vos loyers devront être réglés à l'ordre de [Votre Prénom Nom / NOM DE LA SOCIÉTÉ] et adressés à :

[NOM DU NOUVEAU PROPRIÉTAIRE / SOCIÉTÉ DE GESTION]
[Adresse de règlement]
[IBAN si virement] : [IBAN]

Je vous confirme que votre dépôt de garantie d'un montant de [MONTANT DU DÉPÔT] € a bien été transféré dans le cadre de cette transaction.

Je reste à votre disposition pour toute question et vous souhaite une bonne continuation dans votre logement.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
  {
    id: 'checklist-sortie',
    title: 'Checklist remise des clés',
    category: 'Gestion',
    description: 'Document récapitulatif pour l\'état des lieux de sortie et remise des clés',
    icon: ClipboardList,
    color: '#0e7490',
    content: `CHECKLIST ÉTAT DES LIEUX DE SORTIE ET REMISE DES CLÉS

Logement situé au : [ADRESSE DU BIEN]
Locataire sortant : [Prénom Nom du locataire]
Date de l'état des lieux : [DATE]
Heure : [HEURE]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÉS ET ACCÈS REMIS
☐ Clés de la porte d'entrée : [NOMBRE] clé(s)
☐ Clés de la boîte aux lettres : [NOMBRE] clé(s)
☐ Badges/télécommandes de garage : [NOMBRE]
☐ Vignette interphone : ☐ OUI  ☐ NON
☐ Clés de cave/débarras : [NOMBRE]
☐ Autres : [PRÉCISER]

COMPTEURS RELEVÉS À LA SORTIE
☐ Électricité — Index : [INDEX]
☐ Gaz — Index : [INDEX]
☐ Eau froide — Index : [INDEX]
☐ Eau chaude — Index : [INDEX]

DOCUMENTS REMIS PAR LE LOCATAIRE
☐ Attestation d'assurance habitation (résiliation)
☐ Justificatif de changement d'adresse
☐ Coordonnées pour restitution du dépôt de garantie

NOTES ET OBSERVATIONS
[ESPACE POUR COMMENTAIRES]

SIGNATURES
Propriétaire : _____________________    Date : [DATE]
Locataire : _____________________       Date : [DATE]`,
  },
  {
    id: 'prolongation-bail-deces',
    title: 'Prolongation de bail suite à un décès',
    category: 'Gestion',
    description: 'Information sur le maintien du bail au profit des proches du locataire décédé',
    icon: FileText,
    color: BAI.inkMid,
    content: `[Votre Prénom Nom]
[Votre Adresse]
[Code Postal Ville]

[Ville], le [DATE]

[Prénom Nom du bénéficiaire du transfert]
[Adresse du logement]

Objet : Transmission du bail suite au décès de [Prénom Nom du locataire décédé]

Madame, Monsieur,

Je vous adresse mes sincères condoléances suite au décès de [Prénom Nom du locataire] survenu le [DATE DU DÉCÈS].

En application de l'article 14 de la loi n° 89-462 du 6 juillet 1989, le bail consenti à [Prénom Nom du locataire] pour le logement situé au [ADRESSE DU BIEN] est de plein droit transféré à votre bénéfice en votre qualité de [conjoint(e) survivant(e) / partenaire de PACS / concubin(e) notoire / ascendant(e) / descendant(e) / personne à charge].

Le contrat se poursuit dans les mêmes conditions jusqu'à son terme naturel. Vos obligations et droits sont identiques à ceux qui prévalaient pour le locataire initial.

Je vous invite à me confirmer :
• Votre intention de poursuivre ce bail : ☐ OUI  ☐ NON
• Vos nouvelles coordonnées si différentes
• Votre RIB pour la mise à jour du mandat de prélèvement le cas échéant

Restant à votre disposition pour toute formalité complémentaire.

Cordialement,

[Votre Prénom Nom]
[Téléphone]
[Email]`,
  },
]

const CATEGORIES = ['Tous', ...Array.from(new Set(LETTERS.map(l => l.category)))]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateFr(d: Date = new Date()): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fillTemplate(
  content: string,
  contract: Contract | null,
  ownerName: string,
): string {
  if (!contract) return content

  const tenant = contract.tenant
  const property = contract.property
  const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName}` : null
  const tenantAddress = property
    ? `${property.address}, ${property.postalCode} ${property.city}`
    : null
  const propertyAddress = property
    ? `${property.address}, ${property.postalCode} ${property.city}`
    : null
  const city = property?.city ?? null
  const today = formatDateFr()
  const totalRent =
    (contract.monthlyRent ?? 0) + (contract.charges ?? 0)
  const rentStr = totalRent > 0 ? `${totalRent} €` : null

  const replacements: Array<[RegExp, string | null]> = [
    [/\[Prénom Nom du locataire\]/g, tenantName],
    [/\[Prénom Nom du candidat\/locataire\]/g, tenantName],
    [/\[Adresse du locataire\]/g, tenantAddress],
    [/\[Adresse du logement loué\]/g, propertyAddress],
    [/\[Adresse du logement\]/g, propertyAddress],
    [/\[Adresse du bien\]/g, propertyAddress],
    [/\[ADRESSE DU BIEN\]/g, propertyAddress],
    [/\[ADRESSE COMPLÈTE DU BIEN\]/g, propertyAddress],
    [/\[ADRESSE COMPLÈTE DU BIEN LOUÉ\]/g, propertyAddress],
    [/\[MONTANT\]/g, rentStr],
    [/\[DATE\]/g, today],
    [/\[Ville\]/g, city],
    [/\[Votre Prénom Nom\]/g, ownerName || null],
    [/\[Prénom Nom du propriétaire\]/g, ownerName || null],
  ]

  let result = content
  for (const [pattern, value] of replacements) {
    if (value) result = result.replace(pattern, value)
  }
  return result
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Documents() {
  const { user } = useAuth()

  // Contracts fetch
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loadingContracts, setLoadingContracts] = useState(true)
  const [selectedContractId, setSelectedContractId] = useState<string>('')

  // UI state
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchContracts = async () => {
      setLoadingContracts(true)
      try {
        // Inclure ACTIVE et COMPLETED (les deux ont les deux signatures)
        const res = await apiClient.get('/contracts?status=ACTIVE')
        const activeContracts = (res.data.data?.contracts ?? []) as Contract[]
        const res2 = await apiClient.get('/contracts?status=COMPLETED')
        const completedContracts = (res2.data.data?.contracts ?? []) as Contract[]
        setContracts([...activeContracts, ...completedContracts])
      } catch {
        toast.error('Impossible de charger les contrats actifs')
        setContracts([])
      } finally {
        setLoadingContracts(false)
      }
    }
    fetchContracts()
  }, [])

  const selectedContract = contracts.find(c => c.id === selectedContractId) ?? null
  const ownerName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : ''

  const filtered =
    activeCategory === 'Tous' ? LETTERS : LETTERS.filter(l => l.category === activeCategory)

  // ── Actions ────────────────────────────────────────────────────────────────
  const getFilledContent = (letter: LetterTemplate) =>
    fillTemplate(letter.content, selectedContract, ownerName)

  const handleCopy = (letter: LetterTemplate) => {
    navigator.clipboard.writeText(getFilledContent(letter))
    setCopied(letter.id)
    toast.success('Texte copié dans le presse-papiers')
    setTimeout(() => setCopied(null), 2500)
  }

  const handleDownloadPDF = async (letter: LetterTemplate) => {
    setDownloadingId(letter.id)
    try {
      const filledContent = getFilledContent(letter)
      const blob = await pdf(
        <LetterPDF content={filledContent} title={letter.title} />
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

  const handleSendEmail = async (letter: LetterTemplate) => {
    if (!selectedContract || !selectedContract.tenant) {
      toast.error('Sélectionnez d\'abord un locataire')
      return
    }
    const tenant = selectedContract.tenant
    const tenantDisplayName = `${tenant.firstName} ${tenant.lastName}`
    setSendingId(letter.id)
    try {
      const filledContent = getFilledContent(letter)
      await apiClient.post('/documents/send-letter', {
        to: tenant.email,
        subject: letter.title,
        content: filledContent,
        tenantName: tenantDisplayName,
      })
      toast.success(`Email envoyé à ${tenantDisplayName}`)
    } catch {
      toast.error('Erreur lors de l\'envoi de l\'email')
    } finally {
      setSendingId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', padding: 'clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>

          {/* Page header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: BAI.caramel, margin: '0 0 4px',
            }}>
              Administration
            </p>
            <h1 style={{
              fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px, 4vw, 40px)',
              fontWeight: 700, fontStyle: 'italic', color: BAI.ink,
              margin: '0 0 4px', lineHeight: 1.15,
            }}>
              Documents & Courriers
            </h1>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
              Lettres type prêtes à l'emploi — sélectionnez un locataire pour pré-remplir automatiquement
            </p>
          </div>

          {/* Tenant selector */}
          <div style={{
            background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
            borderRadius: 12, padding: '20px 24px', marginBottom: 28,
            boxShadow: BAI.shadowMd,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: BAI.ownerLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users style={{ color: BAI.owner, width: 16, height: 16 }} />
              </div>
              <span style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, color: BAI.ink }}>
                Locataire cible
              </span>
              {selectedContract && (
                <span style={{
                  marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                  padding: '3px 10px', borderRadius: 20,
                  background: BAI.tenantLight, color: BAI.tenant,
                  border: `1px solid ${BAI.tenantBorder}`,
                }}>
                  Pré-remplissage actif
                </span>
              )}
            </div>

            {loadingContracts ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                <Loader2
                  style={{ color: BAI.inkFaint, width: 16, height: 16, animation: 'spin 1s linear infinite' }}
                />
                <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint }}>
                  Chargement des contrats…
                </span>
              </div>
            ) : contracts.length === 0 ? (
              <div style={{
                padding: '14px 16px', borderRadius: 8,
                background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
              }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: 0 }}>
                  Aucun locataire actif. Créez d'abord un contrat et activez-le pour utiliser le pré-remplissage.
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedContractId}
                  onChange={e => setSelectedContractId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 40px 10px 14px',
                    borderRadius: 8, border: `1px solid ${BAI.border}`,
                    background: BAI.bgInput, color: selectedContractId ? BAI.ink : BAI.inkFaint,
                    fontFamily: BAI.fontBody, fontSize: 14,
                    appearance: 'none', cursor: 'pointer',
                    minHeight: 44, outline: 'none',
                  }}
                >
                  <option value="" style={{ color: BAI.inkFaint }}>
                    Choisir un locataire...
                  </option>
                  {contracts.map(c => {
                    const t = c.tenant
                    const p = c.property
                    const label = t
                      ? `${t.firstName} ${t.lastName}${p ? ` — ${p.address}` : ''}`
                      : c.id
                    return (
                      <option key={c.id} value={c.id}>
                        {label}
                      </option>
                    )
                  })}
                </select>
                <ChevronDown
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: BAI.inkFaint, width: 16, height: 16, pointerEvents: 'none',
                  }}
                />
              </div>
            )}

            {selectedContract && (
              <div style={{
                marginTop: 12, padding: '10px 14px', borderRadius: 8,
                background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
                display: 'flex', gap: 16, flexWrap: 'wrap',
              }}>
                {[
                  { label: 'Locataire', value: selectedContract.tenant ? `${selectedContract.tenant.firstName} ${selectedContract.tenant.lastName}` : '—' },
                  { label: 'Bien', value: selectedContract.property ? `${selectedContract.property.address}, ${selectedContract.property.city}` : '—' },
                  { label: 'Loyer CC', value: `${(selectedContract.monthlyRent ?? 0) + (selectedContract.charges ?? 0)} €` },
                ].map(item => (
                  <div key={item.label}>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.tenant, fontWeight: 600, display: 'block' }}>
                      {item.label}
                    </span>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
              const isSending = sendingId === letter.id
              const filledContent = getFilledContent(letter)

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
                        <span style={{
                          fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 15, color: BAI.ink,
                        }}>
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
                      <p style={{
                        fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: '2px 0 0',
                      }}>
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
                          ? <Check style={{ color: BAI.tenant, width: 14, height: 14 }} />
                          : <Copy style={{ width: 14, height: 14 }} />
                        }
                        Copier
                      </button>

                      {/* Download PDF */}
                      <button
                        onClick={() => handleDownloadPDF(letter)}
                        disabled={isDownloading}
                        title="Télécharger en PDF"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '7px 11px', borderRadius: 8, minHeight: 36,
                          border: `1px solid ${BAI.border}`,
                          background: BAI.night, color: '#ffffff',
                          fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                          cursor: isDownloading ? 'not-allowed' : 'pointer',
                          opacity: isDownloading ? 0.7 : 1,
                        }}
                      >
                        {isDownloading
                          ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                          : <Download style={{ width: 14, height: 14 }} />
                        }
                        PDF
                      </button>

                      {/* Send email */}
                      <button
                        onClick={() => handleSendEmail(letter)}
                        disabled={isSending}
                        title={selectedContract ? 'Envoyer par email au locataire' : 'Sélectionnez un locataire'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '7px 11px', borderRadius: 8, minHeight: 36,
                          border: `1px solid ${selectedContract ? BAI.ownerBorder : BAI.border}`,
                          background: selectedContract ? BAI.ownerLight : BAI.bgMuted,
                          color: selectedContract ? BAI.owner : BAI.inkFaint,
                          fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                          cursor: isSending ? 'not-allowed' : 'pointer',
                          opacity: isSending ? 0.7 : 1,
                        }}
                      >
                        {isSending
                          ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                          : <Send style={{ width: 14, height: 14 }} />
                        }
                        Email
                      </button>

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : letter.id)}
                        title={isExpanded ? 'Réduire' : 'Voir le contenu'}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 36, height: 36, borderRadius: 8,
                          border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
                          color: BAI.inkMid, cursor: 'pointer',
                        }}
                      >
                        {isExpanded
                          ? <ChevronUp style={{ width: 16, height: 16 }} />
                          : <ChevronDown style={{ width: 16, height: 16 }} />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Expanded preview */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${BAI.border}`, padding: '0 20px 20px' }}>
                      <pre style={{
                        fontFamily: BAI.fontBody, fontSize: 13,
                        color: BAI.ink, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                        background: BAI.bgMuted, borderRadius: 8,
                        padding: '16px 20px', marginTop: 16,
                        border: `1px solid ${BAI.border}`,
                        maxHeight: 420, overflowY: 'auto',
                      }}>
                        {filledContent}
                      </pre>
                      <p style={{
                        fontFamily: BAI.fontBody, fontSize: 11,
                        color: selectedContract ? BAI.tenant : BAI.inkFaint,
                        marginTop: 8,
                      }}>
                        {selectedContract
                          ? 'Les champs reconnus ont été pré-remplis automatiquement. Complétez les champs entre [crochets] restants avant d\'envoyer.'
                          : 'Sélectionnez un locataire en haut pour pré-remplir automatiquement les champs entre [crochets].'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </div>

      {/* Spinner keyframe — injected once */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
