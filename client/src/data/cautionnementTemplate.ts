/**
 * Template Acte de Cautionnement Solidaire
 * Conforme aux articles 2288 et suivants du Code civil
 * et a l'article 22-1 de la Loi n°89-462 du 6 juillet 1989
 */

export interface CautionnementVariable {
  key: string
  label: string
  type: 'text' | 'number' | 'date'
  required: boolean
}

export const CAUTIONNEMENT_VARIABLES: CautionnementVariable[] = [
  { key: 'nom_caution', label: 'Nom de la caution', type: 'text', required: true },
  { key: 'prenom_caution', label: 'Prenom de la caution', type: 'text', required: true },
  { key: 'date_naissance_caution', label: 'Date de naissance de la caution', type: 'date', required: true },
  { key: 'lieu_naissance_caution', label: 'Lieu de naissance de la caution', type: 'text', required: true },
  { key: 'adresse_caution', label: 'Adresse de la caution', type: 'text', required: true },

  { key: 'nom_locataire', label: 'Nom du locataire', type: 'text', required: true },
  { key: 'prenom_locataire', label: 'Prenom du locataire', type: 'text', required: true },

  { key: 'nom_bailleur', label: 'Nom du bailleur', type: 'text', required: true },
  { key: 'prenom_bailleur', label: 'Prenom du bailleur', type: 'text', required: true },
  { key: 'adresse_bailleur', label: 'Adresse du bailleur', type: 'text', required: true },

  { key: 'adresse_bien', label: 'Adresse du bien loue', type: 'text', required: true },
  { key: 'ville_bien', label: 'Ville du bien loue', type: 'text', required: true },

  { key: 'date_debut_bail', label: 'Date de debut du bail', type: 'date', required: true },
  { key: 'duree_bail', label: 'Duree du bail (en annees)', type: 'number', required: true },

  { key: 'loyer_hc', label: 'Loyer mensuel hors charges (EUR)', type: 'number', required: true },
  { key: 'charges_mensuelles', label: 'Charges mensuelles (EUR)', type: 'number', required: false },
  { key: 'loyer_total', label: 'Loyer total charges comprises (EUR)', type: 'number', required: true },

  { key: 'montant_max_cautionnement', label: 'Montant maximum du cautionnement (EUR)', type: 'number', required: true },
  { key: 'duree_cautionnement', label: 'Duree du cautionnement', type: 'text', required: true },

  { key: 'date_signature', label: 'Date de signature', type: 'date', required: true },
  { key: 'lieu_signature', label: 'Lieu de signature', type: 'text', required: true },
]

export const CAUTIONNEMENT_TEMPLATE = `ACTE DE CAUTIONNEMENT SOLIDAIRE

Conforme aux articles 2288 et suivants du Code civil
et a l'article 22-1 de la Loi n°89-462 du 6 juillet 1989 (modifiee par la Loi ALUR)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENTRE LES SOUSSIGNES :

LA CAUTION :
Nom : {{nom_caution}}
Prenom : {{prenom_caution}}
Ne(e) le {{date_naissance_caution}} a {{lieu_naissance_caution}}
Demeurant : {{adresse_caution}}

Ci-apres denomme(e) "la Caution"

ET

LE BAILLEUR :
{{prenom_bailleur}} {{nom_bailleur}}
Demeurant : {{adresse_bailleur}}

Ci-apres denomme "le Bailleur"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJET

Le present acte a pour objet l'engagement de caution solidaire de la Caution envers le Bailleur pour garantir les obligations de :

LE LOCATAIRE :
{{prenom_locataire}} {{nom_locataire}}

Ci-apres denomme "le Locataire"

au titre du contrat de bail portant sur le logement situe :
{{adresse_bien}}, {{ville_bien}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESIGNATION DU BAIL GARANTI

Le present cautionnement est consenti en garantie du bail conclu entre le Bailleur et le Locataire :
- Date de prise d'effet : {{date_debut_bail}}
- Duree du bail : {{duree_bail}} an(s)
- Loyer mensuel hors charges : {{loyer_hc}}
- Charges mensuelles : {{charges_mensuelles}}
- Total mensuel : {{loyer_total}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ETENDUE DE L'ENGAGEMENT

La Caution s'engage solidairement avec le Locataire au paiement de l'integralite des sommes dues au Bailleur au titre du bail susvise, comprenant :
- Le loyer et ses revisions
- Les charges locatives et leur regularisation
- Les interets et penalites de retard
- Les indemnites d'occupation
- Les frais de remise en etat
- Les eventuels frais de procedure

Le montant maximum de l'engagement de la Caution est fixe a : {{montant_max_cautionnement}}.

La duree de l'engagement est de : {{duree_cautionnement}}.

En application de l'article 22-1 de la loi du 6 juillet 1989, lorsque le cautionnement est a duree indeterminee, la caution peut le resilier unilateralement. La resiliation prend effet au terme du bail, qu'il s'agisse du premier terme ou d'un terme de reconduction.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CARACTERE SOLIDAIRE

Le present cautionnement est consenti a titre solidaire. La Caution renonce expressement au benefice de discussion prevu a l'article 2298 du Code civil et au benefice de division prevu a l'article 2303 du Code civil.

En consequence, le Bailleur pourra poursuivre directement la Caution sans avoir prealablement exerce de poursuites contre le Locataire, et ce pour la totalite des sommes dues.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFORMATION DE LA CAUTION

Conformement a l'article 22-2 de la loi du 6 juillet 1989, le Bailleur est tenu d'informer la Caution :
- De tout impaye du Locataire, des le premier mois d'impaye
- Du montant du loyer, de son eventuelle revision et du montant des charges
- De tout evenement susceptible d'augmenter les obligations de la Caution

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MENTION MANUSCRITE OBLIGATOIRE
(Article 22-1 de la loi du 6 juillet 1989)

La Caution doit reproduire de sa main la mention suivante :

"Je, soussigne(e) {{prenom_caution}} {{nom_caution}}, ne(e) le {{date_naissance_caution}} a {{lieu_naissance_caution}}, declare me porter caution solidaire de {{prenom_locataire}} {{nom_locataire}} pour le paiement du loyer, des charges et de leurs accessoires, ainsi que des eventuelles penalites ou interets de retard au titre du bail portant sur le logement situe {{adresse_bien}}, {{ville_bien}}.

Je m'engage a payer les sommes dues en cas de defaillance du locataire dans la limite de {{montant_max_cautionnement}} et pour la duree de {{duree_cautionnement}}.

Je declare avoir pris connaissance de l'article 22-1 de la loi du 6 juillet 1989 reproduit ci-apres, et de la portee de mon engagement."

Article 22-1 de la loi du 6 juillet 1989 (extrait) :
"Le cautionnement ne peut pas etre demande par un bailleur qui a souscrit une assurance, ou toute autre forme de garantie, garantissant les obligations locatives du locataire, sauf en cas de logement loue a un etudiant ou un apprenti. Si le bailleur est une personne morale autre qu'une societe civile constituee exclusivement entre parents et allies jusqu'au quatrieme degre inclus, le cautionnement ne peut etre demande que s'il est apporte par un des organismes dont la liste est fixee par decret en Conseil d'Etat."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fait a {{lieu_signature}}, le {{date_signature}}
En deux exemplaires originaux, dont un pour la Caution

La Caution                          Le Bailleur
(mention "Lu et approuve,           (signature)
bon pour cautionnement solidaire"
+ signature)
`

export default CAUTIONNEMENT_TEMPLATE
