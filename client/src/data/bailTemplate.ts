/**
 * Template du Bail d'Habitation - Loi ALUR
 * Conforme a la Loi n°89-462 du 6 juillet 1989 modifiee par la Loi ALUR du 24 mars 2014
 * et au decret n°2015-587 du 29 mai 2015 (contrat type)
 *
 * Variables entre {{doubles_accolades}} a remplacer dynamiquement
 */

export interface BailVariable {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  source?: 'owner' | 'tenant' | 'property' | 'contract' | 'manual'
  options?: string[]
  required: boolean
}

export const BAIL_VARIABLES: BailVariable[] = [
  // Bailleur
  { key: 'nom_bailleur', label: 'Nom du bailleur', type: 'text', source: 'owner', required: true },
  { key: 'prenom_bailleur', label: 'Prenom du bailleur', type: 'text', source: 'owner', required: true },
  { key: 'adresse_bailleur', label: 'Adresse du bailleur', type: 'text', source: 'manual', required: true },
  { key: 'email_bailleur', label: 'Email du bailleur', type: 'text', source: 'owner', required: true },
  { key: 'telephone_bailleur', label: 'Telephone du bailleur', type: 'text', source: 'owner', required: false },

  // Locataire
  { key: 'nom_locataire', label: 'Nom du locataire', type: 'text', source: 'tenant', required: true },
  { key: 'prenom_locataire', label: 'Prenom du locataire', type: 'text', source: 'tenant', required: true },
  { key: 'adresse_locataire', label: 'Adresse actuelle du locataire', type: 'text', source: 'manual', required: false },
  { key: 'email_locataire', label: 'Email du locataire', type: 'text', source: 'tenant', required: true },
  { key: 'telephone_locataire', label: 'Telephone du locataire', type: 'text', source: 'tenant', required: false },

  // Bien
  { key: 'adresse_bien', label: 'Adresse du bien', type: 'text', source: 'property', required: true },
  { key: 'code_postal', label: 'Code postal', type: 'text', source: 'property', required: true },
  { key: 'ville', label: 'Ville', type: 'text', source: 'property', required: true },
  { key: 'type_logement', label: 'Type de logement', type: 'select', source: 'property', required: true, options: ['Appartement', 'Maison', 'Studio', 'Duplex', 'Loft'] },
  { key: 'surface_habitable', label: 'Surface habitable (m2)', type: 'number', source: 'property', required: true },
  { key: 'nombre_pieces', label: 'Nombre de pieces principales', type: 'number', source: 'property', required: true },
  { key: 'nombre_chambres', label: 'Nombre de chambres', type: 'number', source: 'property', required: true },
  { key: 'etage', label: 'Etage', type: 'text', source: 'property', required: false },
  { key: 'meuble', label: 'Meuble ou non meuble', type: 'select', source: 'property', required: true, options: ['Non meuble (vide)', 'Meuble'] },
  { key: 'annexes', label: 'Annexes (cave, parking, etc.)', type: 'text', source: 'manual', required: false },
  { key: 'equipements', label: 'Equipements du logement', type: 'text', source: 'manual', required: false },

  // Dates et duree
  { key: 'date_debut', label: 'Date de prise d\'effet', type: 'date', source: 'contract', required: true },
  { key: 'date_fin', label: 'Date de fin du bail', type: 'date', source: 'contract', required: true },
  { key: 'duree_bail', label: 'Duree du bail (en annees)', type: 'number', source: 'contract', required: true },

  // Financier
  { key: 'loyer_hc', label: 'Loyer mensuel hors charges (EUR)', type: 'number', source: 'contract', required: true },
  { key: 'charges_mensuelles', label: 'Provision pour charges (EUR)', type: 'number', source: 'contract', required: false },
  { key: 'loyer_total', label: 'Loyer total charges comprises (EUR)', type: 'number', source: 'contract', required: true },
  { key: 'depot_garantie', label: 'Depot de garantie (EUR)', type: 'number', source: 'contract', required: true },
  { key: 'mode_paiement', label: 'Mode de paiement', type: 'select', source: 'contract', required: true, options: ['Virement bancaire', 'Prelevement automatique', 'Cheque', 'Especes'] },
  { key: 'jour_paiement', label: 'Jour de paiement', type: 'number', source: 'contract', required: true },

  // Divers
  { key: 'date_signature', label: 'Date de signature', type: 'date', source: 'manual', required: true },
  { key: 'lieu_signature', label: 'Lieu de signature', type: 'text', source: 'property', required: true },
]

/**
 * Resoud les variables du bail a partir des donnees du contrat
 */
export function resolveBailVariables(contract: {
  owner?: { firstName: string; lastName: string; email: string; phone?: string }
  tenant?: { firstName: string; lastName: string; email: string; phone?: string }
  property?: { title: string; address: string; city: string; postalCode: string; type?: string; surface?: number; bedrooms?: number; bathrooms?: number; furnished?: boolean }
  startDate: string
  endDate: string
  monthlyRent: number
  charges?: number
  deposit?: number
  content?: Record<string, any>
}): Record<string, string> {
  const content = contract.content || {}
  const startDate = new Date(contract.startDate)
  const endDate = new Date(contract.endDate)
  const durationYears = Math.round((endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

  const typeMap: Record<string, string> = {
    APARTMENT: 'Appartement',
    HOUSE: 'Maison',
    STUDIO: 'Studio',
    DUPLEX: 'Duplex',
    LOFT: 'Loft',
  }

  return {
    nom_bailleur: contract.owner?.lastName || '',
    prenom_bailleur: contract.owner?.firstName || '',
    adresse_bailleur: content.adresseBailleur || '',
    email_bailleur: contract.owner?.email || '',
    telephone_bailleur: contract.owner?.phone || '',

    nom_locataire: contract.tenant?.lastName || '',
    prenom_locataire: contract.tenant?.firstName || '',
    adresse_locataire: content.adresseLocataire || '',
    email_locataire: contract.tenant?.email || '',
    telephone_locataire: contract.tenant?.phone || '',

    adresse_bien: contract.property?.address || '',
    code_postal: contract.property?.postalCode || '',
    ville: contract.property?.city || '',
    type_logement: typeMap[contract.property?.type || ''] || contract.property?.type || '',
    surface_habitable: String(contract.property?.surface || ''),
    nombre_pieces: String((contract.property?.bedrooms || 0) + 1),
    nombre_chambres: String(contract.property?.bedrooms || ''),
    etage: content.etage || '',
    meuble: contract.property?.furnished ? 'Meuble' : 'Non meuble (vide)',
    annexes: content.annexes || 'Neant',
    equipements: content.equipements || '',

    date_debut: startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    date_fin: endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    duree_bail: String(durationYears || 3),

    loyer_hc: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contract.monthlyRent),
    charges_mensuelles: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contract.charges || 0),
    loyer_total: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contract.monthlyRent + (contract.charges || 0)),
    depot_garantie: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contract.deposit || 0),
    mode_paiement: content.paymentMethod || 'Virement bancaire',
    jour_paiement: content.paymentDay || '5',

    date_signature: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    lieu_signature: contract.property?.city || '',
  }
}

/**
 * Remplace les variables dans un texte template
 */
export function interpolateTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match
  })
}

/**
 * Template complet du bail d'habitation - Loi ALUR
 * Conforme au contrat type annexe au decret n°2015-587
 */
export const BAIL_TEMPLATE = `CONTRAT DE LOCATION
Bail d'habitation - Residence principale

Loi n°89-462 du 6 juillet 1989 modifiee par la Loi ALUR du 24 mars 2014
Decret n°2015-587 du 29 mai 2015 relatif aux contrats types de location

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I. DESIGNATION DES PARTIES

LE BAILLEUR :
Nom : {{nom_bailleur}}
Prenom : {{prenom_bailleur}}
Adresse : {{adresse_bailleur}}
Email : {{email_bailleur}}
Telephone : {{telephone_bailleur}}

LE LOCATAIRE :
Nom : {{nom_locataire}}
Prenom : {{prenom_locataire}}
Adresse actuelle : {{adresse_locataire}}
Email : {{email_locataire}}
Telephone : {{telephone_locataire}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

II. OBJET DU CONTRAT

Le present contrat a pour objet la location du logement decrit ci-apres, a usage de residence principale du locataire, conformement aux dispositions de la loi n°89-462 du 6 juillet 1989.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

III. DESIGNATION DES LOCAUX

Localisation du logement :
- Adresse : {{adresse_bien}}
- Code postal : {{code_postal}}
- Ville : {{ville}}

Description du logement :
- Type d'habitat : {{type_logement}}
- Regime juridique : {{meuble}}
- Surface habitable : {{surface_habitable}} m2 (loi Boutin)
- Nombre de pieces principales : {{nombre_pieces}}
- Nombre de chambres : {{nombre_chambres}}
- Etage : {{etage}}

Annexes :
{{annexes}}

Equipements :
{{equipements}}

Le logement fait partie d'un immeuble dont la date de construction, les elements d'equipement et de confort sont precises dans l'etat des lieux etabli contradictoirement entre les parties.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IV. DATE DE PRISE D'EFFET ET DUREE DU CONTRAT

Le present bail est consenti et accepte pour une duree de {{duree_bail}} an(s), a compter du {{date_debut}}, et jusqu'au {{date_fin}}.

A defaut de conge delivre par l'une ou l'autre des parties dans les conditions legales, le bail est reconduit tacitement pour la meme duree.

Le delai de preavis applicable au locataire est de :
- 3 mois pour les logements non meubles (reduit a 1 mois en zone tendue, mutation professionnelle, perte d'emploi, premier emploi, RSA, AAH, etat de sante)
- 1 mois pour les logements meubles

Le conge doit etre notifie par lettre recommandee avec avis de reception, par acte de commissaire de justice, ou par remise en main propre contre emargement ou recepisse.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

V. CONDITIONS FINANCIERES

1. Loyer

Le loyer mensuel est fixe a {{loyer_hc}} hors charges.

Le loyer est payable a terme a echoir, le {{jour_paiement}} de chaque mois, par {{mode_paiement}}.

Le loyer pourra etre revise chaque annee a la date anniversaire du contrat, en fonction de la variation de l'Indice de Reference des Loyers (IRL) publie par l'INSEE, dans les conditions prevues par l'article 17-1 de la loi du 6 juillet 1989.

2. Charges locatives

Les charges locatives (provisions pour charges recuperables) sont fixees a {{charges_mensuelles}} par mois.

Les charges sont recuperables conformement au decret n°87-713 du 26 aout 1987 et comprennent notamment :
- Les depenses relatives a l'entretien courant et aux menues reparations des equipements communs
- Les depenses relatives aux services lies a l'usage des locaux
- Les impositions et taxes relatives aux services dont le locataire profite directement

Une regularisation annuelle des charges est effectuee. Le bailleur transmet au locataire le decompte par nature de charges un mois avant la regularisation.

3. Total mensuel

Le montant total mensuel du par le locataire s'eleve a {{loyer_total}} (loyer + charges).

4. Depot de garantie

A la signature du bail, le locataire verse au bailleur un depot de garantie d'un montant de {{depot_garantie}}.

Ce depot de garantie ne peut exceder :
- 1 mois de loyer hors charges pour les locations nues
- 2 mois de loyer hors charges pour les locations meublees

Il est restitue dans un delai maximal de :
- 1 mois a compter de la restitution des cles si l'etat des lieux de sortie est conforme a l'etat des lieux d'entree
- 2 mois en cas de differences constatees

A defaut de restitution dans les delais, le depot de garantie restant du produit des interets au taux legal au profit du locataire (majoration de 10% du loyer mensuel HC par mois de retard commence).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VI. CLAUSE RESOLUTOIRE

A defaut de paiement du loyer ou des charges aux termes convenus, et deux mois apres un commandement de payer demeure infructueux, le bail sera resilie de plein droit si le locataire ne s'est pas acquitte de sa dette locative.

De meme, le bail sera resilie de plein droit :
- A defaut d'assurance habitation, un mois apres un commandement demeure infructueux
- En cas de troubles de voisinage constates par une decision de justice

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VII. OBLIGATIONS DU BAILLEUR

Le bailleur est tenu des obligations suivantes (articles 6 et 6-1 de la loi du 6 juillet 1989) :
a) Delivrer au locataire un logement decet et en bon etat d'usage et de reparations
b) Assurer au locataire la jouissance paisible du logement
c) Entretenir les locaux en etat de servir a l'usage prevu
d) Effectuer les reparations autres que locatives necessaires au maintien en etat du logement
e) Ne pas s'opposer aux amenagements realises par le locataire des lors qu'ils ne constituent pas une transformation
f) Remettre au locataire les quittances de loyer gratuitement
g) Transmettre les documents d'information obligatoires (notice, diagnostics techniques)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VIII. OBLIGATIONS DU LOCATAIRE

Le locataire est tenu des obligations suivantes (articles 7 et 7-1 de la loi du 6 juillet 1989) :
a) Payer le loyer et les charges aux termes convenus
b) User paisiblement des locaux loues
c) Repondre des degradations et pertes survenant pendant la duree du contrat
d) Prendre en charge l'entretien courant du logement et les menues reparations (decret n°87-712 du 26 aout 1987)
e) Souscrire et maintenir une assurance habitation couvrant les risques locatifs et en justifier aupres du bailleur
f) Ne pas transformer les locaux sans l'accord ecrit du bailleur
g) Laisser executer les travaux d'amelioration des parties communes ou privatives necessaires
h) Ne pas ceder le bail ni sous-louer sans l'accord ecrit du bailleur

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IX. ETAT DES LIEUX

Un etat des lieux d'entree est etabli contradictoirement par les parties lors de la remise des cles, conformement a l'article 3-2 de la loi du 6 juillet 1989 et au decret n°2016-382 du 30 mars 2016.

Un etat des lieux de sortie est etabli dans les memes conditions lors de la restitution des cles.

En cas de desaccord, les parties peuvent faire appel a un commissaire de justice dont les frais sont partages par moitie.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

X. DIAGNOSTICS TECHNIQUES

Les diagnostics techniques suivants sont annexes au present bail :
- Diagnostic de performance energetique (DPE)
- Constat de risque d'exposition au plomb (CREP) pour les immeubles d'avant 1949
- Etat des risques et pollutions (ERP)
- Diagnostic bruit (proximite aeroport)
- Diagnostic electrique et gaz (installations de plus de 15 ans)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

XI. SOLIDARITE ET INDIVISIBILITE

En cas de pluralite de locataires, ceux-ci sont tenus solidairement et indivisiblement de l'ensemble des obligations du present bail, notamment du paiement du loyer et des charges.

Cette solidarite prend fin, pour le locataire qui donne conge, a l'expiration du delai de preavis et au plus tard 6 mois apres la date d'effet du conge (loi ALUR).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

XII. ELECTION DE DOMICILE

Pour l'execution des presentes, les parties font election de domicile :
- Le bailleur : a l'adresse indiquee en tete des presentes
- Le locataire : dans les lieux loues

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fait a {{lieu_signature}}, le {{date_signature}}
En deux exemplaires originaux

Le Bailleur                         Le Locataire
(signature precedee de la           (signature precedee de la
mention "Lu et approuve")           mention "Lu et approuve")
`

export default BAIL_TEMPLATE
