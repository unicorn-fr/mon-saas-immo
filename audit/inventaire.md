# Inventaire automatique des éléments interactifs

Généré par `tests/audit/inventaire.mjs` à partir du code (`client/src`). Sert de liste de contrôle : chaque élément est couvert par un test automatique ou par le tableau de bord manuel.

## components/AppShell.tsx
- **Liens** : `/espace/partage`, `/espace`, `/espace/compte`, `/espace/locataires`
- **Boutons** : Revenir à mon espace · <Plus / Ajouter · <Plus size=… strokeWidth=… / · <span style=…} …</span <span style=…} …</span
- **Fenêtres (modales)** : Ajouter
- **Éléments nommés (aria-label)** : Navigation principale · Locataires · Mon compte · Ajouter

## components/Binder.tsx
- **Boutons** : Ouvrir

## components/DataNotice.tsx
- **Liens** : `/conditions`, `/confidentialite`, `mailto:${CONTACT_EMAIL}`

## components/ErrorBoundary.tsx
- **Boutons** : Recharger la page

## components/ExpenseModal.tsx
- **Boutons** : Supprimer · Annuler
- **Champs** : Artisan ou fournisseur · Montant TTC · Description · Date · Catégorie · Logement · Dont charges récupérables
- **Choix / onglets / filtres** : Réparation, travaux · Entretien · Rénovation énergétique (logement E, F ou G vers A à D) · Construction ou agrandissement (non déductible) · Impôt, taxe foncière · Copropriété · Assurance · Autre

## components/FlowLayout.tsx
- **Liens** : `#${stepIds?.[s.key] ?? s.key}`
- **Boutons** : Retour · … color=… / : null} …
- **Éléments nommés (aria-label)** : Étapes

## components/Interventions.tsx
- **Boutons** : + Nouvelle · Supprimer · Enregistrer
- **Champs** : Objet · Où en est-on ? · Artisan · Nom de l’artisan · Téléphone · Coût · C’était
- **Choix / onglets / filtres** : Une réparation · De l’entretien

## components/LoanCard.tsx
- **Boutons** : Ajouter · Détail

## components/MailLinks.tsx
- **Liens** : `message://`

## components/Missing.tsx
- **Boutons** : Compléter

## components/PaymentModal.tsx
- **Boutons** : Enregistrer · Enregistrer et envoyer …
- **Champs** : Mois concerné · Montant reçu · Date de réception
- **Fenêtres (modales)** : Loyer reçu

## components/SaveLater.tsx
- **Boutons** : Enregistrer et terminer plus tard · Envoyer le lien

## components/SiteChrome.tsx
- **Liens** : `/#tarifs`, `/espace`, `/connexion`, `/commencer`
- **Éléments nommés (aria-label)** : Menu · Liens légaux

## components/StructurePicker.tsx
- **Liens** : `/espace/structures/${current.id}`
- **Boutons** : <span style=…} Propriétaire</span <span style=…} …</span · Enregistrer · Changer · Voir la structure
- **Champs** : À qui appartient ce logement ? · Nom de la société · Forme (facultatif) · Un nom pour vous y retrouver (facultatif)

## components/TenantDossier.tsx
- **Liens** : `https://cfsmsp.impots.gouv.fr/secavis/`
- **Boutons** : Vérifier maintenant · Courrier à imprimer · Terminé · Voir le fichier · Conforme · À corriger
- **Fenêtres (modales)** : Vérifier le dossier

## components/TenantLink.tsx
- **Boutons** : Envoyer par email · Copier le lien · Désactiver le lien · Créer le lien

## components/TunnelLayout.tsx
- **Boutons** : … / : null} …
- **Éléments nommés (aria-label)** : Progression

## components/UploadModal.tsx
- **Boutons** : Annuler · Ajouter
- **Champs** : Type de document · Diagnostic · Nom du document · Logement
- **Choix / onglets / filtres** : Autre document · Diagnostic · Facture · Performance énergétique (DPE) · État des risques (ERP) · Électricité · Gaz · Plomb (CREP) · Amiante · Bruit (aérodrome)
- **Fenêtres (modales)** : Ajouter un document

## components/Wizard.tsx
- **Boutons** : Retour · Annuler · Passer cette étape

## components/kit.tsx
- **Boutons** : … color="currentColor" / : icon} … · Réessayer
- **Éléments nommés (aria-label)** : Fermer

## components/media.tsx
- **Boutons** : Effacer · Prendre la photo · Utiliser la caméra de l’ordinateur
- **Éléments nommés (aria-label)** : Code à scanner avec le téléphone · Retirer la photo · Aperçu de la caméra · Prendre une photo de vous

## components/ui.tsx
- **Boutons** : … …
- **Éléments nommés (aria-label)** : Chargement

## pages/Bienvenue.tsx
- **Liens** : `/espace`, `/espace/baux/${lease.id}/etat-des-lieux`
- **Boutons** : Voir le brouillon · Imprimer le bail · Activer le suivi

## pages/Candidature.tsx
- **Liens** : `https://www.dossierfacile.logement.gouv.fr/`
- **Boutons** : Envoyer ma candidature
- **Champs** : Civilité · Prénom · Nom · Email · Téléphone · Adresse actuelle · Situation professionnelle · Revenus nets du foyer, par mois · Personnes qui vivront dans le logement · Date d’entrée souhaitée · Garantie · Prénom du garant · Nom du garant · Lien de votre DossierFacile · Message
- **Choix / onglets / filtres** : Madame · Monsieur · Salarié · Indépendant · Étudiant · Apprenti ou alternant · Retraité · Autre situation · Une personne se porte caution · Garantie Visale · Assurance loyers impayés · Pas de garant

## pages/Connexion.tsx
- **Liens** : `/connexion`, `/inscription`
- **Boutons** : recommencez · Recevoir un nouveau lien
- **Champs** : Email

## pages/Dossier.tsx
- **Liens** : `https://www.visale.fr/`
- **Boutons** : J’ai terminé · + Ajouter une personne qui signera aussi le bail · Enregistrer
- **Champs** : Prénom(s) · Nom de naissance · Nom d’usage (facultatif) · Date de naissance · Lieu de naissance · Email · Téléphone · Adresse actuelle · Situation professionnelle · Employeur, établissement ou activité · Métier ou formation · Revenus nets par mois · Vous vivrez dans le logement · Prénom de l’autre personne au bail · Nom · Qui se porte garant pour vous ? · Numéro du visa Visale · Lien de partage de votre DossierFacile (facultatif) · Adresse · Lien avec vous · Employeur ou activité
- **Choix / onglets / filtres** : Madame · Monsieur · Seul · En couple ou en famille · En colocation · Une personne (parent, ami…) · Visale (garantie gratuite de l’État) · Pas de garant

## pages/Edl.tsx
- **Liens** : `/espace/baux/${inv.lease.id}`
- **Boutons** : Retour · Commencer · Continuer · Ouvrir … · Passer aux clés · <span style=…} …</span <Pill tone=… …</Pill · <span style=…} Mobilier</span <Pill tone=… …</Pill · + Ajouter une pièce · Terminer le mobilier · Passer aux signatures · + Ajouter une clé ou un badge · Terminer et créer le PDF · Ouvrir le PDF · Retour au bail · Faire le point sur les dégradations · Ajouter une remarque · + Ajouter un élément · Retirer cette pièce · Envoyer le refus · Annuler · Ajouter à l’état des lieux · Refuser
- **Champs** : Date · Heure · Index relevé · Numéro du compteur (facultatif) · Dernier entretien de la chaudière · Nouvelle adresse du locataire · Remarques générales (facultatif) · Remarque · Pourquoi refusez-vous ?

## pages/EspaceLocataire.tsx
- **Boutons** : Envoyer l’attestation · Retirer mon accord · Donner mon accord · Retirer · Compléter l’état des lieux
- **Champs** : Assureur · Valable jusqu’au · Date de l’entretien · Votre email · J’accepte de recevoir mes quittances de loyer par email. · Où ? (facultatif) · Ce qui se passe · C’est urgent · Ce qui n’est pas dans l’état des lieux
- **Éléments nommés (aria-label)** : Vos signalements · Vos demandes

## pages/Home.tsx
- **Liens** : `/commencer`, `/importer`, `#tarifs`, `/espace`, `/connexion`, `/contact`, `mailto:${CONTACT_EMAIL}`
- **Éléments nommés (aria-label)** : Aperçu d’une annonce prête à publier sur Leboncoin, SeLoger et PAP · Aperçu d’un bail signé en ligne par le bailleur, le locataire et le garant · Menu · Type de location · Montpellier en images · Tarif · Pied de page

## pages/Importer.tsx
- **Liens** : `/commencer`, `/confidentialite`
- **Boutons** : Retirer · Lire mon bail

## pages/Invitation.tsx
- **Boutons** : Accepter l’invitation · Recevoir mon lien de connexion

## pages/Reprendre.tsx
- **Liens** : `/commencer`
- **Boutons** : Recommencer mon bail

## pages/Signer.tsx
- **Liens** : `${pdf}?download=1`, `signature`
- **Boutons** : Télécharger le document signé · Ouvrir le document · Télécharger · Valider · Signer le document
- **Champs** : J’ai lu le document en entier. · Code reçu par email · Signer sans photo · J’accepte de signer ce document électroniquement.

## pages/espace/AccesPartages.tsx
- **Boutons** : Inviter quelqu’un · Retirer l’accès · Quitter · Ouvrir
- **Champs** : Email

## pages/espace/Actions.tsx
- **Boutons** : <span style=…} …</span <Pill tone="owner" …</Pill · Relire la lettre

## pages/espace/Aides.tsx
- **Boutons** : <span style=…} …</span <Pill tone=… …</Pill

## pages/espace/Annonce.tsx
- **Liens** : `/espace/logements/${id}/candidats`, `/espace/logements/${id}/fiche#diagnostics`
- **Boutons** : Copier l’annonce · Ensuite : le message avec votre lien de candidature, à envoyer aux personnes intéressées · Compléter la fiche du logement · Copier la consigne · Utiliser ce texte
- **Champs** : Loyer hors charges, par mois · Charges, par mois · Les charges sont · Dépôt de garantie · Disponible à partir du · Honoraires du mandataire à la charge du locataire (TTC) · Dont complément de loyer (zone d’encadrement) · Titre · Description · Ce que vous aimez dans ce logement (facultatif) · Réponse de l’IA
- **Choix / onglets / filtres** : Une provision, régularisée chaque année · Un forfait
- **Éléments nommés (aria-label)** : Consigne pour l’IA

## pages/espace/Argent.tsx
- **Liens** : `/espace/argent/facture`
- **Boutons** : Ajouter une dépense · <span style=…} Exporter l’année</span <span style=…} Tableau pour votre comptable</span · Facture en photo
- **Éléments nommés (aria-label)** : Outils · Loyers encaissés par mois

## pages/espace/Aujourdhui.tsx
- **Liens** : `/espace/situations`, `/espace/actions`, `/espace/logements`, `/espace/logements/${p.id}`, `/espace/logements/nouveau`, `/espace/argent/factures/${t.expenseId}`, `/importer`
- **Boutons** : Que se passe-t-il ? · Tout voir · Ajouter un logement · Vérifier · Activer les rappels

## pages/espace/Bail.tsx
- **Liens** : `/espace/baux/${l.id}/contrat`, `/espace/baux/${l.id}/contrat#rent`, `/espace/baux/${l.id}/courriers?type=REMINDER`, `/espace/baux/${l.id}/courriers`, `/espace/situations`, `/espace/baux/${l.id}/courriers?type=NOTICE_TO_LEAVE`, `/espace/baux/${l.id}/courriers?type=DEPOSIT_RETURN`, `/espace/locataires/${x.id}`, `/espace/locataires/${g.tenantId}/caution`
- **Boutons** : Compléter le bail · Repasser en préparation · Corriger le loyer · Ouvrir le bail · (`/leases/$…/checked`, …)))} J’ai relu, tout est juste · Télécharger le PDF · L’envoyer à … par email · Modifier une information · …` : act.label} · … pièces`} · Loyer reçu · Envoyer une demande de paiement · Rétablir l’envoi · Le loyer n’est pas arrivé · (`/leases/$…/receipts/$…/send`, …) toast.show(`Envoyé à $….`) })} Envoyer · Annuler · Avis d’échéance de … · Ouvrir · Imprimer · Télécharger · Enregistrer le départ du locataire · Supprimer ce bail en préparation · Pas encore · Oui, c’est signé · Enregistrer le départ · Le préparer
- **Champs** : Date de remise des clés · Nouvelle adresse du locataire
- **Fenêtres (modales)** : Départ du locataire

## pages/espace/Bilan.tsx
- **Liens** : `/espace/logements/nouveau`
- **Boutons** : Ajouter un logement
- **Champs** : Année · Prix d’achat du logement

## pages/espace/Candidats.tsx
- **Liens** : `/espace/logements/${id}/annonce`
- **Boutons** : Choisir ce candidat · Retenir · Écarter · Effacer · Copier le lien · Fermer le lien · Créer le lien · Rédiger l’annonce · Copier le message · Revenir au message proposé
- **Champs** : Message

## pages/espace/Carnet.tsx
- **Boutons** : Ajouter un contact · Modifier · Retirer · Enregistrer
- **Champs** : Type · Nom · Métier · Téléphone · Email · Adresse · Note

## pages/espace/Compte.tsx
- **Liens** : `/espace/compte/profil`, `/espace/structures`, `/espace/compte/acces`, `/espace/corbeille`
- **Boutons** : Profil complet · Vos structures · Gérer · Tout exporter · Corbeille · Supprimer mon compte · Se déconnecter · Annuler · Recevoir mon code · Renvoyer un code · Déconnecter · Déconnecter tous les autres appareils
- **Champs** : Prénom · Nom · Adresse · Code postal · Ville · Code reçu par email

## pages/espace/Corbeille.tsx
- **Boutons** : Restaurer · Effacer

## pages/espace/Courriers.tsx
- **Liens** : `/espace/baux/${id}`, `/espace/documents`, `/espace/baux/${lease.id}`, `/espace/documents?type=LETTERS`
- **Boutons** : Retour au bail · Ouvrir l’avis d’échéance · Enregistrer et envoyer · Enregistrer le paiement · Voir … · Repartir des valeurs proposées par Bailio · Aperçu · Enregistrer … · Ouvrir le PDF · Retirer · + Ajouter une dégradation · + Ajouter une charge · + Ajouter une retenue · Voir les courriers envoyés
- **Champs** : Courrier · Document · Locataire · Période · Montant reçu · Date de réception · Date d’expiration de l’attestation actuelle · Date de réception de la lettre de congé · Motif indiqué par le locataire · Troubles constatés · Dates ou période · Délai pour faire cesser (jours) · Numéro de contrat · Date du sinistre · Nature du sinistre · Circonstances · Dommages constatés · Travaux réalisés · Date de l’intervention · Numéro de facture ou de devis · Problèmes constatés · Délai pour reprendre les travaux (jours) · Date du dernier entretien connu · Date de réception du congé · Motif invoqué par le locataire · Locataire depuis le · Loyer hors charges · Charges · Date du versement · Moyen de paiement · Nouveau propriétaire · Date de la vente · Adresse du nouveau propriétaire · Comment payer le loyer désormais · Nombre de détecteurs · Installés le · Email du locataire · Email · Adresse postale · Délai pour réparer (jours) · Date de révision · Loyer actuel hors charges · Trimestre de référence · IRL de référence · Trimestre publié un an après · Nouvel IRL publié par l’INSEE · Année · Provisions versées sur l’année · Nature de la charge · Montant réel · Fin du contrat · Motif · Fin du bail · Prix de vente demandé · Conditions de la vente · Bénéficiaire de la reprise · Lien avec vous · Adresse du bénéficiaire · Caractère réel et sérieux de la reprise · Motif (par exemple : manquements répétés du locataire) · Dépôt versé · Date de remise des clés · Justificatif · Montant · Loyers et charges restant dus · Charges à régulariser (au prorata) · Ces charges sont · Provision gardée jusqu’à l’approbation des comptes de l’immeuble · Montant dû · Échéances concernées · Délai accordé au garant (jours) · Commandement de payer délivré le · Délai accordé (jours) · Étape
- **Choix / onglets / filtres** : Quittance · Révision · Charges · Attestation de loyer · Quittance par email · Impayés · Assurance · Entretien chaudière · Dégradations · Trouble de voisinage · Détecteurs de fumée · Reçu du dépôt · Vente du logement loué · Donner congé · Congé du locataire · Préavis d’un mois · Solde de tout compte · Sinistre : votre assureur · Réclamation à un artisan · Reçu de paiement partiel · Avis d’échéance · Dégât des eaux · Incendie · Vol ou cambriolage · Tempête ou intempéries · Bris de glace · Autre · Dues par le locataire · À rembourser au locataire · Relance amiable · Mise en demeure · Appel à la caution · Commandement de payer
- **Éléments nommés (aria-label)** : Courriers

## pages/espace/Declaration.tsx
- **Liens** : `impotsVide`, `impotsMeuble`, `/espace/argent`
- **Boutons** : Les rattacher
- **Champs** : Année des revenus · Intérêts, assurance et frais d’emprunt (ligne 250) · Honoraires et frais de gestion (ligne 221) · Régularisation des provisions de copropriété de l’an dernier (ligne 230) · Prix d’achat (frais de notaire compris) · Date d’achat ou de première location · Part du terrain dans le prix (%) · Valeur du mobilier · Amortissements reportés des années précédentes

## pages/espace/Degradations.tsx
- **Boutons** : Préparer l’état des lieux de sortie · Retour à la liste · Préparer le solde de tout compte · Commencer · Voir le récapitulatif (PDF)
- **Champs** : C’est · Coût de la réparation · Justificatif · Part due à l’usure (facultatif) · Votre commentaire (facultatif)

## pages/espace/Documents.tsx
- **Boutons** : Ajouter un document · <span style=…} …</span <span style=…} …</span · Ouvrir · Télécharger · Imprimer · Envoyer · Supprimer · Créer un bail
- **Choix / onglets / filtres** : Tous · Baux · Quittances · États des lieux · Factures · Diagnostics · Courriers · Autres

## pages/espace/ESign.tsx
- **Liens** : `signature`
- **Boutons** : Signer maintenant · Annuler la signature en ligne · Signer en ligne

## pages/espace/Emprunt.tsx
- **Boutons** : Ajouter mon emprunt · Ajouter un autre emprunt · Modifier · Retirer
- **Champs** : Montant emprunté · Taux annuel, hors assurance · Durée, en mois · Date de la première mensualité · Assurance emprunteur, par mois (facultatif) · Frais de dossier et de garantie (facultatif) · Un nom pour ce prêt (facultatif)

## pages/espace/EtatDesLieux.tsx
- **Liens** : `/espace/baux/${l.id}`, `/edl/${inv.id}`
- **Boutons** : Retour au bail · Ouvrir le PDF

## pages/espace/Facture.tsx
- **Liens** : `/espace/argent`, `/espace`
- **Boutons** : Retour · Saisir à la main · Valider et ranger · Ce n’est pas une facture
- **Champs** : Artisan ou fournisseur · Montant TTC · Date · Logement · Description · Catégorie
- **Choix / onglets / filtres** : Réparation, travaux · Entretien · Impôt, taxe foncière · Copropriété · Assurance · Autre

## pages/espace/Locataire.tsx
- **Liens** : `/espace/baux/${lease.id}/courriers`, `/espace/baux/nouveau?locataire=${t.id}${t.propertyId ? `, `/espace/locataires/${t.id}/fiche`, `/espace/locataires/${t.id}/caution`, `/espace/locataires/${t.id}/fiche#guarantee`, `/espace/logements/${h.id}`, `/espace/baux/${h.leaseId}`, `/espace/baux/${lease.id}`, `/espace/baux/${lease.id}/etat-des-lieux`, `/espace/baux/${lease.id}#paiements`
- **Boutons** : Envoyer un document · Loyer reçu · Créer son bail · Modifier · Acte de caution · Indiquer la garantie · Ajouter · Supprimer ce locataire · Voir le bail · État des lieux · Tout voir · Compléter la fiche

## pages/espace/Locataires.tsx
- **Liens** : `/espace/locataires/nouveau`, `/espace/locataires/${t.id}`
- **Boutons** : Ajouter un locataire

## pages/espace/Logement.tsx
- **Liens** : `/espace/baux/${lease.id}`, `/espace/baux/nouveau?logement=${p.id}`, `/espace/baux/${l.id}/courriers`, `/espace/locataires/${t.id}`, `/espace/locataires/nouveau?logement=${p.id}`, `/espace/argent/facture?logement=${p.id}`, `/espace/logements/${p.id}/fiche#diagnostics`, `/edl/${i.id}`, `/espace/baux/${lease.id}/etat-des-lieux`
- **Boutons** : Créer un document · Voir le bail · Créer un bail · Quittances et courriers · + Ajouter un locataire · Créer un nouveau bail · Ajouter une facture en photo · Saisir une dépense · Renseigner dans la fiche · Joindre · Ouvrir le PDF · Reprendre · Lancer un état des lieux · <span style=…} …</span <span style=…} …</span
- **Choix / onglets / filtres** : Vue d’ensemble · Dossier du logement · Bail et locataire · Travaux et dépenses · Diagnostics · États des lieux
- **Fenêtres (modales)** : Créer un document

## pages/espace/Logements.tsx
- **Liens** : `/espace/structures`, `/espace/logements/nouveau`, `/espace/patrimoine`, `/espace/logements/${p.id}`
- **Boutons** : Vos structures · Ajouter un logement

## pages/espace/Partage.tsx
- **Boutons** : Revenir à mon espace

## pages/espace/Patrimoine.tsx
- **Liens** : `/espace/logements/${a.propertyId}`, `/espace/logements/${r.id}`
- **Boutons** : … autres`}

## pages/espace/Releve.tsx
- **Liens** : `/espace/argent`
- **Boutons** : Enregistrer … loyer… · Retour à l’argent
- **Éléments nommés (aria-label)** : Fichier du relevé bancaire

## pages/espace/Repartir.tsx
- **Liens** : `/espace/argent`
- **Boutons** : Retour à Argent
- **Champs** : Fournisseur · Description (facultatif) · Nature · Date · Montant total · Dont part récupérable sur les locataires (facultatif) · Comment répartir ?
- **Choix / onglets / filtres** : Selon la surface · Selon les tantièmes · Parts égales

## pages/espace/Situations.tsx
- **Liens** : `/espace/baux/nouveau`, `/importer`, `/espace/baux/${l.id}/parcours/${kind}`
- **Boutons** : Créer un bail · importer un bail signé · <span style=…} …</span <span style=…} …</span · Ce n’est pas encore fait · C’est fait

## pages/espace/Structures.tsx
- **Liens** : `/espace/structures/${s.id}`, `/espace/logements/${p.id}`
- **Boutons** : Ajouter une structure · Modifier · Ajouter un propriétaire · Retirer le dernier · Ajouter … · Retirer la dernière ligne · Supprimer cette structure · <span style=…} <span style=…} …</span …} …</span : null} </span <span style=…} …</span · Enregistrer
- **Champs** : Le logement est détenu · Nom pour vous y retrouver (facultatif) · Prénoms · Nom · Dénomination · Forme · Numéro SIREN (facultatif) · Siège social · Représentée par · En qualité de · Régime fiscal · Part · Titulaire (facultatif) · IBAN (facultatif)

## pages/espace/fiches/ActeCaution.tsx
- **Boutons** : Aperçu de l’acte
- **Champs** : Civilité · Nom · Prénoms · Date de naissance · Lieu de naissance · Lien avec le locataire · Email · Adresse · Téléphone · Caution · Durée de l’engagement · Jusqu’au · Montant maximum garanti · Le garant signe · Date de signature (une fois signé)
- **Choix / onglets / filtres** : Madame · Monsieur · Solidaire · Simple · Durée déterminée · Durée indéterminée · Sur papier, avec le bail · Électroniquement

## pages/espace/fiches/Contrat.tsx
- **Liens** : `/espace/baux/${id}`, `/espace/compte/profil?retour=/espace/baux/${id}/contrat`, `/espace/locataires/${x.id}/fiche`, `/espace/logements/${view.property.id}/fiche`, `https://www.service-public.gouv.fr/simulateur/calcul/zones-tendues`, `https://www.service-public.gouv.fr/particuliers/vosdroits/F947`
- **Boutons** : Retour au bail · Annuler la signature et modifier · Aperçu du bail · Modifier le profil du bailleur · Fiche de … · Aucuns travaux · 1 } })} Garder les clauses conseillées · Voir le bail complet · Retirer · + Ajouter une clause
- **Champs** : Quel contrat ? · Colocation · Honoraires du locataire (visite, dossier, bail) · Honoraires de l’état des lieux · Date de prise d’effet · Durée · Motif du bail mobilité · Durée réduite (1 an minimum) pour raison familiale ou professionnelle ? · Durée en mois (12 à 35) · Événement précis qui justifie la durée réduite · Préavis, pour vous et pour le locataire · Loyer mensuel hors charges · Paiement · Le · Mode de paiement · Lieu de paiement · Zone tendue · Encadrement des loyers · Loyer de référence (€/m²) · Loyer de référence majoré (€/m²) · Complément de loyer · Justification du complément · Le logement était-il loué dans les 18 derniers mois ? · Dernier loyer versé · Date du dernier versement · Date de la dernière révision · Pourquoi le loyer est-il plus élevé que celui du locataire précédent ? · Réviser le loyer chaque année ? · Date de révision (jour et mois) · Indice de référence · Mode de paiement des charges · Montant mensuel · Travaux réalisés depuis le dernier bail · Majoration de loyer pour travaux d’amélioration · Diminution de loyer pour travaux du locataire · Contribution du locataire aux économies d’énergie ? · Travaux réalisés · Montant demandé · Fait à · Signature
- **Choix / onglets / filtres** : À échoir (en début de mois) · À terme échu (en fin de mois) · Virement · Chèque · Espèces · Autre · IRL du 1er trimestre · IRL du 2e trimestre · IRL du 3e trimestre · IRL du 4e trimestre · Sur papier · Électronique

## pages/espace/fiches/FicheBailleur.tsx
- **Liens** : `/espace/structures`
- **Boutons** : …)` : 'Vos structures'}
- **Champs** : Civilité · Nom · Prénoms · Nom d’usage (facultatif) · Nom de naissance (facultatif) · Date de naissance · Lieu de naissance · Adresse · Code postal · Ville · Email · Téléphone · Un agent ou un administrateur de biens intervient · Nom du mandataire · Adresse du mandataire · Numéro de carte professionnelle · Délivrée par · Titulaire du compte · IBAN
- **Choix / onglets / filtres** : Madame · Monsieur

## pages/espace/fiches/FicheLocataire.tsx
- **Liens** : `/espace/locataires/${id}/caution`
- **Boutons** : + Un autre colocataire · Compléter l’acte de caution…` : ''} · <Pill tone=… …</Pill · Voir
- **Champs** : Civilité · Nom · Prénoms · Nom d’usage (facultatif) · Date de naissance · Lieu de naissance · Email · Téléphone · Adresse actuelle · Situation · Métier ou formation · Revenus nets par mois · Quelle garantie ? · Numéro de visa Visale · Lien DossierFacile (facultatif) · Prénoms du garant · Nom du garant · Assureur · Échéance de l’attestation · Nouvelle adresse · Document fourni
- **Choix / onglets / filtres** : Madame · Monsieur · En couple · En colocation · Une personne se porte caution · Garantie Visale · Assurance loyers impayés (propriétaire) · Aucune

## pages/espace/fiches/FicheLogement.tsx
- **Liens** : `https://errial.georisques.gouv.fr/`, `https://www.service-public.gouv.fr/simulateur/calcul/zones-tendues`
- **Boutons** : Aucune annexe · Aucune · Joindre · Retirer · + Ajouter une pièce · + Ajouter un élément
- **Champs** : Adresse · Code postal · Ville · Nom pour le reconnaître · Type d’emplacement · La place est · Numéro (facultatif) · Niveau (facultatif) · Surface en m² (facultatif) · Numéro de lot de copropriété (facultatif) · Accès (facultatif) · Clés, badges ou télécommandes remis (facultatif) · Loyer hors charges, par mois · Charges, par mois · Les charges sont · Dépôt de garantie · Jour de paiement du loyer · Bâtiment · Escalier, étage, porte · Identifiant fiscal du logement · Votre commune exige-t-elle un « permis de louer » ? · Numéro de l’autorisation · Date de l’autorisation · Type d’habitat · Régime juridique de l’immeuble · Le logement est loué · Destination · Servitude de résidence principale · Syndic · Quote-part de charges · Numéro de lot · Période de construction · Permis de construire délivré avant le 1er juillet 1997 ? · Surface habitable · Nombre de pièces principales · Chauffage · Énergie · Eau chaude sanitaire · Appareil · Dernier entretien · Répartition de la consommation de chauffage · Répartition de la consommation d’eau chaude · Autres équipements · Détecteurs de fumée installés · Clés et moyens d’accès remis · Numéro de garage ou de place · Superficie du jardin · Réception de la télévision · Accès à internet · Classe énergie (DPE) · Classe climat (GES) · Date du DPE · Numéro ADEME du DPE · Dépenses d’énergie estimées, minimum (€ par an) · Maximum (€ par an) · Année des prix · Installation de gaz · Installation électrique de plus de 15 ans · Date · La commune est en zone tendue · Pièce · Niveau · Remarque · Élément · Nombre · État
- **Choix / onglets / filtres** : Une provision, régularisée chaque année · Un forfait · Immeuble collectif · Maison individuelle · Monopropriété · Copropriété · Habitation uniquement · Habitation et usage professionnel · Individuel · Collectif · Individuelle · Collective · Antenne individuelle · Antenne collective · Câble · Satellite · Aucune · Fibre · ADSL · Aucun raccordement

## pages/espace/parcours/AjoutLocataire.tsx
- **Liens** : `/espace/locataires/${id}`, `/espace/logements/nouveau?retour=locataire`
- **Boutons** : Voir sa fiche · + Un autre logement · + Un autre colocataire · Courrier à imprimer
- **Champs** : Email du locataire · Prénom (facultatif) · Nom (facultatif) · Prénom(s) · Nom de naissance · Nom d’usage (facultatif) · Date de naissance · Lieu de naissance · Email · Téléphone · Adresse actuelle · Situation professionnelle · Métier ou formation · Revenus nets par mois · Prénom · Nom · Numéro de visa Visale · Adresse · Lien avec le locataire · Type de caution · Montant maximum garanti · Durée de l’engagement · Engagement jusqu’au
- **Choix / onglets / filtres** : Madame · Monsieur · En couple · En colocation · Solidaire · Simple · Jusqu’à une date · Sans date de fin

## pages/espace/parcours/AjoutLogement.tsx
- **Liens** : `https://errial.georisques.gouv.fr/`
- **Boutons** : Passer cette étape · Retirer · + Ajouter une pièce · Ajouter le PDF
- **Champs** : Vous louez · Adresse · Bâtiment, étage, porte · Un nom pour le reconnaître (facultatif) · Type d’emplacement · La place est · Numéro (facultatif) · Niveau (facultatif) · Accès (facultatif) · Clés, badges ou télécommandes remis (facultatif) · Il sera loué · Usage · Le logement est réservé à la résidence principale par le plan local d’urbanisme ? · Identifiant fiscal du logement · La commune impose une autorisation avant de louer (« permis de louer ») ? · Numéro de l’autorisation · Date de l’autorisation · Syndic · Numéro de lot · Quote-part des parties communes · Période de construction · Permis de construire délivré avant le 1er juillet 1997 ? · Surface habitable · Pièces principales · Nombre exact de pièces principales · Le chauffage est · Il fonctionne à · Appareil de chauffage · Comment la consommation de chauffage est-elle répartie ? · Date du dernier entretien de la chaudière · L’eau chaude est · Comment la consommation d’eau chaude est-elle répartie ? · Numéro de garage, de place ou de cave · Superficie du jardin · Autres équipements · Détecteurs de fumée · Clés et badges remis · Télévision · Internet · Classe énergie (DPE) · Classe climat (gaz à effet de serre) · Date du DPE · Numéro du DPE · Entre (€ par an) · Et (€ par an) · Prix de l’année · L’installation électrique a plus de 15 ans ? · Le logement a une installation de gaz ? · L’installation de gaz a plus de 15 ans ? · Le logement est dans une zone de bruit d’aéroport ? · Date du diagnostic · Loyer hors charges, par mois · Charges, par mois · Les charges sont · Dépôt de garantie · Jour de paiement du loyer
- **Choix / onglets / filtres** : Un logement · Un garage, un box ou une place · Habitation seulement · Habitation et activité professionnelle · Individuel · Collectif · Individuelle · Collective · Antenne individuelle · Antenne collective · Câble · Satellite · Aucune · Fibre raccordée · ADSL (ligne téléphonique) · Aucun raccordement · Une provision, régularisée chaque année · Un forfait

## pages/espace/parcours/CreationBail.tsx
- **Liens** : `/espace/logements/nouveau?retour=bail`, `/espace/locataires/nouveau${propertyId ? `, `/espace/compte/profil?retour=${encodeURIComponent(`, `https://www.service-public.gouv.fr/simulateur/calcul/zones-tendues`, `/espace/baux/${lease.id}/contrat`, `/espace/locataires/nouveau?id=${tenantId}&etape=${step}${propertyId ? `
- **Boutons** : + Un autre logement · Compléter le logement · + Ajouter un locataire · Compléter mon profil · Compléter le contrat · Voir l’aperçu · Imprimer · Retirer cette clause · + Ajouter une clause à vous · Compléter · Le demander par email · Courrier à imprimer
- **Champs** : Date d’entrée · Durée du bail mobilité · Le locataire est en · Durée du contrat · Préavis pour y mettre fin · Loyer hors charges · Charges · Les charges sont · Payé au plus tard le · Moyen de paiement · Le loyer se paie · Précisez le moyen et le lieu de paiement · Dépôt de garantie · La commune est-elle en zone tendue ? · Le logement est soumis à l’encadrement des loyers ? · Loyer de référence (€/m²) · Loyer de référence majoré (€/m²) · Complément de loyer (facultatif) · Ce qui justifie le complément de loyer · Son dernier loyer · Date de son dernier loyer · Date de la dernière révision de son loyer · Travaux faits depuis le dernier bail · Travaux d’amélioration prévus pendant le bail, avec hausse de loyer (facultatif) · Travaux faits par le locataire en échange d’une baisse de loyer (facultatif) · Fait à · Signature
- **Choix / onglets / filtres** : Virement · Chèque · Espèces (contre reçu) · Autre · D’avance (à échoir) · À la fin du mois (à terme échu) · Sur papier · Électronique

## pages/legal/Legal.tsx
- **Liens** : `mailto:${CONTACT_EMAIL}`, `/conditions`, `/confidentialite`, `/cookies`, `/prix-et-remboursement`, `/accessibilite`, `/mentions-legales`

## pages/tunnel/LogementStep.tsx
- **Champs** : Adresse · Surface habitable · Nombre exact · Bâtiment, étage, porte (facultatif)
- **Choix / onglets / filtres** : Un appartement · Une maison · Oui · Non · Avant 1949 · 1949 à 1974 · 1975 à 1989 · 1990 à 2005 · Depuis 2005 · Individuel · Collectif (pour tout l’immeuble) · Électricité · Gaz · Pompe à chaleur · Fioul · Bois · Réseau de chaleur · Individuelle · Collective

## pages/tunnel/LoyerStep.tsx
- **Boutons** : Modifier · Revenir au maximum
- **Champs** : Loyer hors charges · Charges
- **Éléments nommés (aria-label)** : Les charges sont · Montant du dépôt de garantie · Jour de paiement

## pages/tunnel/PersonnesStep.tsx
- **Boutons** : Retirer · + Un colocataire · + Un garant · + Ajouter un colocataire ou un garant
- **Champs** : Prénom · Nom · Votre adresse · Son adresse
- **Éléments nommés (aria-label)** : Civilité

## pages/tunnel/RecevoirStep.tsx
- **Champs** : Votre email

## pages/tunnel/RelectureStep.tsx
- **Liens** : `/commencer/personnes`
- **Boutons** : Modifier · Enregistrer · Annuler · 0} onClick=… style=…} Voir le bail complet
- **Champs** : Adresse · Surface · Pièces principales · Prénom · Nom · Votre adresse · Email · Loyer hors charges · Charges · Dépôt de garantie · Jour de paiement
- **Éléments nommés (aria-label)** : Aperçu du bail

## pages/tunnel/TypeStep.tsx
- **Liens** : `/importer`
- **Boutons** : <span className="hide-md" …</span <span style=…} …</span <span style=…} …</span
