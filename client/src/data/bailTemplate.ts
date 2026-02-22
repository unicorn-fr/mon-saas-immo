/**
 * Template du Bail d'Habitation - Loi ALUR
 * Conforme a la Loi n°89-462 du 6 juillet 1989 modifiee par la Loi ALUR du 24 mars 2014
 * et au decret n°2015-587 du 29 mai 2015 (contrat type)
 * Conforme au decret n°2016-382 du 30 mars 2016 (etat des lieux)
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
  { key: 'qualite_bailleur', label: 'Qualite du bailleur', type: 'select', source: 'manual', required: false, options: ['Proprietaire', 'Mandataire du proprietaire', 'Usufruitier'] },

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
  { key: 'surface_habitable', label: 'Surface habitable loi Boutin (m2)', type: 'number', source: 'property', required: true },
  { key: 'nombre_pieces', label: 'Nombre de pieces principales', type: 'number', source: 'property', required: true },
  { key: 'nombre_chambres', label: 'Nombre de chambres', type: 'number', source: 'property', required: true },
  { key: 'etage', label: 'Etage', type: 'text', source: 'property', required: false },
  { key: 'meuble', label: 'Meuble ou non meuble', type: 'select', source: 'property', required: true, options: ['Non meuble (vide)', 'Meuble'] },
  { key: 'regime_juridique', label: 'Regime de copropriete', type: 'select', source: 'manual', required: false, options: ['Copropriete', 'Monopropriete', 'Non applicable'] },
  { key: 'annexes', label: 'Annexes (cave, parking, etc.)', type: 'text', source: 'manual', required: false },
  { key: 'equipements', label: 'Equipements du logement', type: 'text', source: 'manual', required: false },
  { key: 'classe_energie', label: 'Classe energetique (DPE)', type: 'select', source: 'manual', required: false, options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
  { key: 'ges', label: 'Classe GES', type: 'select', source: 'manual', required: false, options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },

  // Dates et duree
  { key: 'date_debut', label: 'Date de prise d\'effet', type: 'date', source: 'contract', required: true },
  { key: 'date_fin', label: 'Date de fin du bail', type: 'date', source: 'contract', required: true },
  { key: 'duree_bail', label: 'Duree du bail', type: 'text', source: 'contract', required: true },

  // Financier
  { key: 'loyer_hc', label: 'Loyer mensuel hors charges (EUR)', type: 'number', source: 'contract', required: true },
  { key: 'charges_mensuelles', label: 'Provision pour charges (EUR)', type: 'number', source: 'contract', required: false },
  { key: 'loyer_total', label: 'Loyer total charges comprises (EUR)', type: 'number', source: 'contract', required: true },
  { key: 'depot_garantie', label: 'Depot de garantie (EUR)', type: 'number', source: 'contract', required: true },
  { key: 'mode_paiement', label: 'Mode de paiement', type: 'select', source: 'contract', required: true, options: ['Virement bancaire', 'Prelevement automatique', 'Cheque', 'Especes'] },
  { key: 'jour_paiement', label: 'Jour de paiement', type: 'number', source: 'contract', required: true },
  { key: 'irl_trimestre', label: 'Trimestre IRL de reference', type: 'select', source: 'manual', required: false, options: ['1er trimestre', '2eme trimestre', '3eme trimestre', '4eme trimestre'] },
  { key: 'irl_annee', label: 'Annee IRL de reference', type: 'number', source: 'manual', required: false },
  { key: 'irl_valeur', label: 'Valeur IRL de reference', type: 'number', source: 'manual', required: false },

  // Zone tendue
  { key: 'zone_tendue', label: 'Zone tendue (encadrement des loyers)', type: 'select', source: 'manual', required: false, options: ['Oui', 'Non'] },
  { key: 'loyer_reference', label: 'Loyer de reference (zone tendue)', type: 'number', source: 'manual', required: false },
  { key: 'loyer_reference_majore', label: 'Loyer de reference majore (zone tendue)', type: 'number', source: 'manual', required: false },
  { key: 'complement_loyer', label: 'Complement de loyer (le cas echeant)', type: 'number', source: 'manual', required: false },

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
  const durationMs = endDate.getTime() - startDate.getTime()
  const durationYears = Math.round(durationMs / (365.25 * 24 * 60 * 60 * 1000))
  const isMeuble = contract.property?.furnished || false

  const typeMap: Record<string, string> = {
    APARTMENT: 'Appartement',
    HOUSE: 'Maison',
    STUDIO: 'Studio',
    DUPLEX: 'Duplex',
    LOFT: 'Loft',
  }

  const dureeBail = isMeuble
    ? `1 an (bail meuble - art. 25-4 loi 89-462)`
    : `3 ans (bail non meuble - art. 10 loi 89-462)`

  return {
    nom_bailleur: contract.owner?.lastName || '',
    prenom_bailleur: contract.owner?.firstName || '',
    adresse_bailleur: content.adresseBailleur || '',
    email_bailleur: contract.owner?.email || '',
    telephone_bailleur: contract.owner?.phone || '',
    qualite_bailleur: content.qualiteBailleur || 'Proprietaire',

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
    etage: content.etage || 'Non precise',
    meuble: isMeuble ? 'Meuble' : 'Non meuble (vide)',
    regime_juridique: content.regimeJuridique || 'Copropriete',
    annexes: content.annexes || 'Neant',
    equipements: content.equipements || 'Voir inventaire annexe',
    classe_energie: content.classeEnergie || 'Non communique',
    ges: content.ges || 'Non communique',

    date_debut: startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    date_fin: endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    duree_bail: String(durationYears || (isMeuble ? 1 : 3)),

    loyer_hc: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contract.monthlyRent),
    charges_mensuelles: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contract.charges || 0),
    loyer_total: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contract.monthlyRent + (contract.charges || 0)),
    depot_garantie: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contract.deposit || 0),
    mode_paiement: content.paymentMethod || 'Virement bancaire',
    jour_paiement: content.paymentDay || '5',
    irl_trimestre: content.irlTrimestre || '2eme trimestre',
    irl_annee: content.irlAnnee || String(new Date().getFullYear()),
    irl_valeur: content.irlValeur || 'voir publication INSEE',

    zone_tendue: content.zoneTendue || 'Non',
    loyer_reference: content.loyerReference || 'N/A',
    loyer_reference_majore: content.loyerReferenceMajore || 'N/A',
    complement_loyer: content.complementLoyer || '0',

    date_signature: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    lieu_signature: contract.property?.city || '',
    duree_texte: dureeBail,
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
 * Conforme au decret n°2015-587 du 29 mai 2015 (contrat type reglementaire)
 */
export const BAIL_TEMPLATE = `CONTRAT DE LOCATION - BAIL D'HABITATION
Usage de residence principale
Conforme a la loi n°89-462 du 6 juillet 1989 modifiee par la loi ALUR du 24 mars 2014
Decret n°2015-587 du 29 mai 2015 (contrat type)
Type de bail : {{meuble}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 1 - DESIGNATION DES PARTIES

LE BAILLEUR :
Nom et prenom : {{prenom_bailleur}} {{nom_bailleur}}
Qualite : {{qualite_bailleur}}
Adresse : {{adresse_bailleur}}
Email : {{email_bailleur}}
Telephone : {{telephone_bailleur}}

LE LOCATAIRE :
Nom et prenom : {{prenom_locataire}} {{nom_locataire}}
Adresse actuelle avant entree dans les lieux : {{adresse_locataire}}
Email : {{email_locataire}}
Telephone : {{telephone_locataire}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 2 - OBJET ET DESIGNATION DES LOCAUX

Le present contrat a pour objet la location, a usage exclusif de residence principale du locataire, du logement ci-apres decrit, conformement a la loi n°89-462 du 6 juillet 1989.

2.1 - Localisation
Adresse : {{adresse_bien}}
Code postal : {{code_postal}}
Ville : {{ville}}

2.2 - Description du logement
Type d'habitat : {{type_logement}}
Regime juridique de l'immeuble : {{regime_juridique}}
Surface habitable (loi Boutin, art. 1 decret 87-149) : {{surface_habitable}} m2
Nombre de pieces principales : {{nombre_pieces}}
Dont nombre de chambres : {{nombre_chambres}}
Etage : {{etage}}
Annee de construction : a preciser dans l'etat des lieux

2.3 - Parties privatives et annexes
{{annexes}}

2.4 - Equipements et elements de confort
{{equipements}}

2.5 - Performance energetique (DPE - decret n°2002-120 du 30 janvier 2002)
Classe energetique : {{classe_energie}}
Classe GES : {{ges}}
Note : Le locataire est informe que le logement dont la classe energetique est F ou G est considere comme une "passoire thermique".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 3 - DATE DE PRISE D'EFFET ET DUREE DU CONTRAT

3.1 - Duree et prise d'effet
Le present bail prend effet le {{date_debut}} pour une duree de {{duree_bail}} an(s), jusqu'au {{date_fin}}.

Pour les logements NON MEUBLES (vides) :
- La duree minimale est de 3 ans (bailleur personne physique) ou 6 ans (bailleur personne morale)
- Le bail est reconduit tacitement pour la meme duree a son expiration, sauf conge regulierement delivre

Pour les logements MEUBLES :
- La duree minimale est de 1 an (9 mois pour les etudiants)
- Le bail est reconduit tacitement d'annee en annee a son expiration, sauf conge regulierement delivre

3.2 - Conge du locataire (article 15 loi 89-462)
Le locataire peut donner conge a tout moment, en respectant un delai de preavis de :
- 3 mois pour un logement non meuble (preavis de droit commun)
- 1 mois pour un logement non meuble en zone tendue ou cas particuliers : mutation professionnelle, perte d'emploi involontaire, premier emploi, etat de sante justifiant un changement de domicile, RSA ou AAH
- 1 mois pour un logement meuble
Le conge doit etre notifie par lettre recommandee avec avis de reception, par acte d'huissier de justice ou par remise en main propre contre recepisse ou emargement.

3.3 - Conge du bailleur (article 15 loi 89-462)
Le bailleur peut donner conge uniquement pour l'un des motifs suivants, avec un preavis de 6 mois avant le terme du bail :
a) Pour reprendre le logement pour y habiter lui-meme ou pour y loger un proche
b) Pour vendre le logement (le locataire beneficie d'un droit de preemption)
c) Pour motif legitime et serieux (notamment inexecution par le locataire de ses obligations)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 4 - CONDITIONS FINANCIERES

4.1 - Loyer
Le loyer mensuel est fixe a {{loyer_hc}} (hors charges).
Le loyer est payable a terme a echoir, le {{jour_paiement}} de chaque mois calendaire, par {{mode_paiement}}.

4.2 - Encadrement des loyers (loi ALUR, article 17)
Zone tendue : {{zone_tendue}}
Loyer de reference pour la zone : {{loyer_reference}} / m2 / mois
Loyer de reference majore (+20%) : {{loyer_reference_majore}} / m2 / mois
Complement de loyer (justifie par des caracteristiques exceptionnelles) : {{complement_loyer}}
Si le bien est situe dans une zone soumise a l'encadrement des loyers, le loyer ne peut exceder le loyer de reference majore fixe par arrete prefectoral.

4.3 - Revision annuelle du loyer (article 17-1 loi 89-462)
Le loyer est revise chaque annee a la date anniversaire du bail, en fonction de la variation de l'Indice de Reference des Loyers (IRL) publie trimestriellement par l'INSEE.
Indice IRL de reference : {{irl_trimestre}} {{irl_annee}} (valeur : {{irl_valeur}})
Formule : Loyer renouvele = Loyer actuel x (Nouvel IRL / Ancien IRL)
La revision ne peut intervenir que si le bailleur en fait la demande. Elle n'est pas automatique. Elle ne peut avoir d'effet retroactif au-dela d'un an.

4.4 - Charges locatives
Les provisions pour charges recuperables sont fixees a {{charges_mensuelles}} par mois.
Le montant total du au terme de chaque echeance : {{loyer_total}} (loyer + charges).

Les charges recuperables comprennent (decret n°87-713 du 26 aout 1987) :
- Ascenseurs et monte-charge (electricite, entretien, petites reparations)
- Eau froide, eau chaude, chauffage collectif
- Installations individuelles (chauffe-eau, robinets, joints, abonnements)
- Entretien des parties communes (eclairage, nettoyage, espaces verts)
- Taxes et redevances (taxe d'enlevement des ordures menageres, taxe de balayage)

Une regularisation annuelle est effectuee sur la base des depenses reelles. Le bailleur transmet au locataire un decompte par nature de charges au minimum un mois avant la regularisation, et tient les justificatifs a disposition pendant 6 mois.

4.5 - Depot de garantie (article 22 loi 89-462)
A la signature du present bail, le locataire verse un depot de garantie d'un montant de {{depot_garantie}}.
- Pour un logement non meuble, le depot de garantie ne peut exceder 1 mois de loyer hors charges
- Pour un logement meuble, le depot de garantie ne peut exceder 2 mois de loyer hors charges
Le depot de garantie ne produit pas d'interets au benefice du locataire.

Restitution : Le bailleur dispose de :
- 1 mois a compter de la remise des cles si l'etat des lieux de sortie est conforme a l'etat des lieux d'entree
- 2 mois en cas de differences constatees entre les deux etats des lieux
En cas de retard de restitution, le depot de garantie est majore de 10% du loyer mensuel hors charges par mois de retard commence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 5 - CLAUSE RESOLUTOIRE (article 24 loi 89-462)

Le present bail sera resilie de plein droit, apres avoir ete constate par le juge :
a) A defaut de paiement du loyer ou des charges locatives a leur terme
b) A defaut de paiement du depot de garantie lors de la remise des cles
c) En cas de non-souscription d'une assurance habitation : 1 mois apres un commandement reste infructueux
d) En cas de troubles de voisinage constates par une decision de justice passee en force de chose jugee

La clause resolutoire ne peut jouer qu'apres un commandement de payer vise par le commissaire de justice (huissier) et reste infructueux a l'expiration d'un delai de 2 mois.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 6 - OBLIGATIONS DU BAILLEUR (article 6 loi 89-462)

Le bailleur est tenu :
a) De delivrer un logement decent, ne laissant pas apparaitre de risques manifestes pouvant porter atteinte a la securite physique ou a la sante, remplissant les criteres du decret n°2002-120 du 30 janvier 2002
b) D'assurer au locataire la jouissance paisible du logement et de le garantir des vices ou defauts de nature a y faire obstacle
c) D'entretenir les locaux en etat de servir a l'usage prevu et d'y faire toutes les reparations autres que locatives
d) De ne pas s'opposer aux amenagements realises par le locataire des lors qu'ils ne constituent pas une transformation
e) De remettre gratuitement une quittance de loyer sur simple demande du locataire
f) De mettre a disposition les documents permettant l'etablissement des charges (decomptes, contrats, etc.)
g) D'informer le locataire de tout projet de vente ou de mise en copropriete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 7 - OBLIGATIONS DU LOCATAIRE (article 7 loi 89-462)

Le locataire est tenu :
a) De payer le loyer et les charges locatives aux termes convenus
b) D'user paisiblement des locaux loues suivant la destination prevue au contrat
c) De repondre des degradations et pertes qui surviennent pendant la duree du contrat, sauf cas de force majeure, negligence du bailleur ou fait d'un tiers
d) De prendre a sa charge l'entretien courant du logement et les menues reparations (decret n°87-712 du 26 aout 1987)
e) De souscrire une assurance risques locatifs (incendie, degats des eaux, etc.) et d'en justifier lors de la remise des cles, puis chaque annee a la demande du bailleur
f) De ne pas transformer les locaux et equipements sans l'accord ecrit du bailleur
g) De laisser executer dans les lieux loues les travaux d'amelioration, de mise en conformite ou d'urgence
h) De ne pas ceder le bail ni sous-louer le logement sans l'accord ecrit du bailleur et sans que le loyer de sous-location n'excede celui verse par le locataire principal
i) D'aviser immediatement le bailleur de tout sinistre ou deterioration survenant dans les locaux

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 8 - ASSURANCE HABITATION (obligatoire)

Le locataire est dans l'obligation de souscrire une assurance habitation couvrant au minimum les risques locatifs (incendie, explosion, dommages des eaux). Cette assurance doit etre en cours de validite :
- A la remise des cles (justificatif a fournir au bailleur)
- Chaque annee a la date d'anniversaire du bail (attestation a transmettre au bailleur)

En cas de defaut d'assurance, le bailleur peut, apres mise en demeure restee infructueuse pendant 1 mois, souscrire une assurance pour le compte du locataire et en recuperer le cout (art. 7 loi 89-462).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 9 - ETAT DES LIEUX (article 3-2 loi 89-462 et decret n°2016-382)

Un etat des lieux d'entree contradictoire est etabli a la remise des cles, selon le modele reglementaire fixe par le decret n°2016-382 du 30 mars 2016. Il doit etre signe par les deux parties.

Un etat des lieux de sortie est etabli lors de la restitution des cles, dans les memes conditions. Les differences constatees entre l'etat d'entree et de sortie, imputables au locataire, pourront etre deduites du depot de garantie.

L'usure normale et vetuste du logement n'est pas a la charge du locataire. La grille de vetuste applicable peut etre etablie contradictoirement par les parties.

En cas d'impossibilite de proceder contradictoirement, chaque partie peut faire appel a un commissaire de justice dont les honoraires sont partages par moitie.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 10 - SOLIDARITE ET INDIVISIBILITE

En cas de pluralite de locataires, ceux-ci sont tenus solidairement et indivisiblement de toutes les obligations nees du present bail, notamment du paiement du loyer, des charges et des reparations locatives.

La solidarite d'un locataire qui a donne conge cesse lors de l'entree dans les lieux d'un nouveau locataire ou, a defaut, au terme d'un delai de 6 mois suivant la date d'effet du conge (art. 8-1 loi 89-462, mod. loi ALUR).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 11 - TRAITEMENT DES LITIGES ET DISPOSITIFS D'AIDE

En cas de litige relatif au present bail, les parties doivent, prealablement a toute saisine judiciaire, tenter une conciliation ou une mediation. Elles peuvent notamment saisir :
- La Commission Departementale de Conciliation (CDC) competente pour les litiges entre bailleur et locataire
- Le juge des contentieux de la protection du tribunal judiciaire

Tout manquement aux obligations legales peut etre sanctionne conformement aux dispositions de la loi n°89-462 du 6 juillet 1989.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 12 - ANNEXES OBLIGATOIRES (article 3 loi 89-462)

Les documents suivants doivent imperativement etre annexes au present bail pour qu'il soit valide :

OBLIGATOIRES POUR TOUS LES BAUX :
[ ] Notice d'information relative aux droits et obligations des locataires et des bailleurs
    (arrete du 29 mai 2015)
[ ] Etat des lieux d'entree (contradictoire, art. 3-2 loi 89-462)
[ ] Etat des risques et pollutions - ERP (decret n°2005-134, mis a jour tous les 6 mois)
[ ] Diagnostic de performance energetique - DPE (valable 10 ans)

SELON L'AGE DE L'IMMEUBLE :
[ ] Constat de risque d'exposition au plomb - CREP (immeubles d'avant 1949, valable 1 an si positif)
[ ] Diagnostic electricite (installations electriques de plus de 15 ans, valable 6 ans)
[ ] Diagnostic gaz (installations de gaz de plus de 15 ans, valable 6 ans)
[ ] Diagnostic amiante (immeubles dont le permis de construire est anterieur au 1er juillet 1997)

SELON LA SITUATION GEOGRAPHIQUE :
[ ] Diagnostic bruit (zone de bruit liee a un aeroport, port ou voie ferree)

POUR LES LOGEMENTS MEUBLES :
[ ] Inventaire et etat du mobilier (contradictoire, signe par les deux parties)
[ ] Liste detaillee des meubles et equipements mis a disposition

EN ZONE SOUMISE A L'ENCADREMENT DES LOYERS :
[ ] Information sur le loyer de reference et le loyer de reference majore
[ ] Justification du complement de loyer (le cas echeant)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 13 - CLAUSES INTERDITES ET ABUSIVES (article 4 loi 89-462)

AVERTISSEMENT - Les clauses suivantes sont reputees non ecrites et n'ont aucune valeur juridique :

- Interdire au locataire d'heberger des personnes ne vivant pas habituellement avec lui
- Obliger le locataire a souscrire une assurance aupres d'une compagnie designee par le bailleur
- Imposer des frais de quittance ou d'etablissement d'etat des lieux
- Facturer des frais de relance ou de prise en compte d'un paiement tardif
- Prevoir des frais de revision du loyer, de renouvellement du bail ou d'indexation de loyer non prevus par la loi
- Stipuler des penalites de retard pour le locataire superieures a 1% du loyer mensuel HC par mois de retard
- Interdire la detention d'animaux de compagnie (sauf animaux dangereux - loi du 6 janvier 1999)
- Prevoir la responsabilite collective des locataires en cas de degradation d'une partie commune
- Exiger le paiement du loyer par prelevement automatique comme unique modalite
- Interdire les travaux d'adaptation au handicap
- Fixer le montant du depot de garantie au-dela des plafonds legaux (1 ou 2 mois de loyer HC)
- Prevoir que le locataire aura la charge de reparations incombant au bailleur
- Imposer l'accord du bailleur pour recevoir des soins a domicile
- Faire payer au locataire des charges non recuperables (ex. : taxe fonciere, honoraires de gestion)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 14 - SIGNATURE ELECTRONIQUE

Les parties reconnaissent expressement que le present contrat peut etre signe electroniquement.
La signature electronique apposee sur le present document est valide conformement a :
- L'article 1366 du Code civil : "L'ecrit sous forme electronique est admis en preuve au meme titre que l'ecrit sur support papier"
- L'article 1367 du Code civil : "La signature necessaire a la perfection d'un acte juridique identifie son auteur"
- Le reglement eIDAS (UE n°910/2014) relatif a l'identification electronique et aux services de confiance pour les transactions electroniques au sein du marche interieur

Chaque signature est associee a un horodatage, une adresse IP et un condensat (hash SHA-256) du document au moment de la signature, constituant une preuve electronique opposable aux tiers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 15 - DISPOSITIONS DIVERSES

Election de domicile :
- Le bailleur elu au domicile indique en tete des presentes
- Le locataire elu au domicile des lieux loues

Loi applicable et juridiction competente :
Le present bail est soumis a la loi francaise. Tout litige non resolu amiablement sera porte devant le tribunal judiciaire du lieu de situation du bien loue.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fait a {{lieu_signature}}, le {{date_signature}}
En deux exemplaires originaux, dont un remis a chacune des parties.

LE BAILLEUR                              LE LOCATAIRE
(Signature precedee de la mention        (Signature precedee de la mention
"Lu et approuve - Bon pour accord")     "Lu et approuve - Bon pour accord")
`

export default BAIL_TEMPLATE
