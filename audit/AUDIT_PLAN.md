# Bailio — Cartographie complète (étape 1)

> Établie à partir du code (`client/src/App.tsx`, pages, composants) le 18 octobre 2026.
> Le détail de chaque bouton, lien, champ, onglet et fenêtre, page par page, est dans
> [`inventaire.md`](inventaire.md) (généré par `node tests/audit/inventaire.mjs`, à relancer après chaque évolution).

## 1. États utilisateur et droits

| État | Comment on y entre | Ce qu'il voit | Garde-fou |
|---|---|---|---|
| **Visiteur** | Arrivée sur le site | Accueil, tunnel « Créer mon bail », import, connexion/inscription, pages légales, 404 | Toute page `/espace/*`, `/edl/:id`, `/bienvenue/:id` redirige vers `/connexion` (`RequireAuth`, `App.tsx`) puis revient à la page demandée après connexion |
| **Propriétaire connecté** | Lien magique reçu par email (`/connexion/lien?jeton=…`) | Tout l'espace `/espace/*` | Jeton de session (`bailio.session`), fermé après 30 jours sans activité |
| **Associé / co-propriétaire** (invité) | `/invitation/:token` puis connexion avec l'adresse invitée | Espace du propriétaire, bandeau « Espace de … », tout sauf supprimer, créer un logement, compte, structures | `routeDenied` + `scopeQuery` côté serveur |
| **Comptable** (invité) | idem | Espace du propriétaire en lecture seule | idem (toute écriture refusée) |
| **Intervenant** (invité) | idem | Uniquement `/espace/partage` (adresse, accès, contact du locataire, interventions) | `AppShell` redirige toute autre page vers `/espace/partage` |
| **Locataire** (sans compte) | Lien `/locataire/:code` | Assurance, chaudière, accord quittance email, signalement, complément d'état des lieux | Code du bail, fermé à la fin du bail |
| **Locataire qui complète son dossier** | Lien `/dossier/:code` (30 jours) | Formulaire de son dossier + garant + pièces | Code du locataire |
| **Candidat** (sans compte) | Lien `/candidature/:code` | Formulaire de candidature + pièces | Code de l'annonce |
| **Signataire** (locataire, garant, bailleur) | Lien `/signer/:token` | Lecture du document, code email, photo facultative, signature | Jeton de signature + code à 6 chiffres |

## 2. Arbre de navigation

```
/                                   Accueil (public)
├── #tarifs                         ancre « Tarif »
├── Onglets « Type de location » (vide / meublé / garage) + champ loyer (simulation)
├── /commencer                      Tunnel « Créer mon bail » (6 étapes, brouillon enregistré)
│   ├── /commencer                  1. Type (vide, meublé, garage…)
│   ├── /commencer/logement         2. Logement (adresse, surface, pièces, étage, période, chauffage, eau chaude)
│   ├── /commencer/personnes        3. Personnes (bailleur, locataires, colocataires, garants)
│   ├── /commencer/loyer            4. Loyer (loyer, charges, dépôt, jour de paiement)
│   ├── /commencer/relecture        5. Relecture (modifier chaque bloc, aperçu du bail)
│   └── /commencer/recevoir         6. Recevoir (email → lien magique → /bienvenue/:leaseId)
├── /reprendre?brouillon=…          Reprendre un brouillon reçu par email (sinon message « lien expiré »)
├── /importer                       Importer un bail déjà signé (photo/PDF, OCR sur le serveur)
├── /connexion                      Connexion par lien magique
│   └── /connexion/lien?jeton=…     Vérification du lien (succès → /espace ou page demandée ; échec → « Recevoir un nouveau lien »)
├── /inscription                    Création d'espace par lien magique (vaut acceptation des CGU)
├── /invitation/:token              Accepter un accès partagé
├── /signer/:token                  Signature électronique
├── /candidature/:code              Candidature à une annonce
├── /locataire/:code                Lien du locataire
├── /dossier/:code                  Dossier à compléter par le locataire
├── /mentions-legales  /conditions  /confidentialite  /cookies  /prix-et-remboursement  /accessibilite  /contact
├── /robots.txt  /sitemap.xml  /llms.txt  (générés)   /api/notice-information.pdf  /api/reparations-locatives.pdf  /api/charges-recuperables.pdf
├── *                               Page 404 « Page introuvable »
│
└── Espace propriétaire (connexion obligatoire)
    ├── Menu : ordinateur = barre latérale sombre ; mobile = en-tête (Locataires, Mon compte) + barre du bas (Aujourd'hui, Logements, [+ Ajouter], Documents, Argent)
    ├── Fenêtre « Ajouter » : logement · locataire · bail · facture · document · bail déjà signé
    ├── /bienvenue/:leaseId          Après le tunnel : brouillon, imprimer, activer le suivi
    ├── /espace                      Aujourd'hui (tâches du jour, prochaines échéances, logements, actions groupées)
    │   ├── /espace/actions          Actions groupées (relances, assurances, révisions, quittances)
    │   └── /espace/situations       « Que se passe-t-il ? » → /espace/baux/:id/parcours/:kind (DEPARTURE, UNPAID, SALE, ISSUE)
    ├── /espace/logements            Logements (regroupés par immeuble, lien « Répartir une dépense »)
    │   ├── /espace/logements/nouveau        Ajouter un logement (étapes nommées ; ?id=&etape= reprise ; ?retour=bail|locataire)
    │   ├── /espace/patrimoine               Tableau de bord des logements
    │   └── /espace/logements/:id            Logement — onglets : Vue d'ensemble · Dossier du logement · Bail et locataire · Travaux et dépenses · Diagnostics · États des lieux (?onglet=…&intervention=…)
    │       ├── /fiche (#diagnostics)        Fiche du logement
    │       ├── /annonce                     Annonce (mentions obligatoires, IA, liens Leboncoin/SeLoger/PAP/Facebook)
    │       ├── /candidats                   Candidats (lien public, note, choisir/écarter/effacer)
    │       ├── /emprunt                     Emprunts et trésorerie
    │       └── /aides                       Aides et dispositifs
    ├── /espace/locataires           Locataires
    │   ├── /espace/locataires/nouveau       Ajouter un locataire (ou « il le remplit lui-même »)
    │   └── /espace/locataires/:id           Locataire
    │       ├── /fiche (#guarantee)          Fiche du locataire
    │       └── /caution                     Acte de caution
    ├── /espace/baux/nouveau         Créer un bail (?logement=&locataire=)
    │   └── /espace/baux/:id                 Bail (relecture, signature en ligne, paiements, quittances, quittance auto, départ…)
    │       ├── /contrat (#rent)             Contrat (toutes les rubriques du contrat type, clauses)
    │       ├── /courriers (?type=…)         Courriers (≈ 25 modèles, aperçu PDF, envoi email)
    │       ├── /etat-des-lieux (?type=EXIT) État des lieux → /edl/:id (saisie pièce par pièce, signatures, PDF)
    │       ├── /degradations                Récapitulatif des dégradations
    │       └── /parcours/:kind              Parcours guidé
    ├── /espace/documents (?type=, ?ajouter=1)  Documents (filtres Tous, Baux, Quittances, États des lieux, Factures, Diagnostics, Courriers, Autres)
    ├── /espace/argent               Argent (loyers, dépenses, export)
    │   ├── /facture (?logement=)            Facture en photo
    │   ├── /factures/:id                    Vérifier une facture lue
    │   ├── /releve                          Relevé bancaire CSV/OFX
    │   ├── /declaration                     Aide à la déclaration
    │   ├── /bilan                           Bilan par logement
    │   └── /repartir (?logements=)          Répartir une dépense de l'immeuble
    ├── /espace/carnet               Carnet de contacts
    ├── /espace/compte               Mon compte (profil, structures, accès, appareils, export, corbeille, suppression, déconnexion)
    │   ├── /profil (?retour=)               Profil du bailleur
    │   └── /acces                           Accès partagés
    ├── /espace/structures (/:id)    Structures (SCI, indivision…)
    ├── /espace/corbeille            Corbeille (restaurer, effacer)
    └── /espace/partage              Vue de l'intervenant
```

### Redirections et cas particuliers
- `RequireAuth` : page protégée sans session → `/connexion` (avec `state.from`), retour à la page après connexion.
- `/connexion` et `/inscription` déjà connecté → `/espace` (ou `state.from`).
- Tunnel : étape ouverte sans brouillon suffisant → `/commencer` (`navigate('/commencer', { replace: true })`).
- `/connexion/lien` réussi → `/bienvenue/:leaseId` (si un bail vient du tunnel), sinon `/espace` ou l'espace partagé.
- Intervenant → toute page de l'espace renvoie vers `/espace/partage`.
- Lien interne mal formé (`?retour=`) filtré par `safePath`.
- Erreur de chargement du code (site mis à jour pendant la visite) → rechargement unique (`recoverOnce`).
- Erreur d'affichage → `ErrorBoundary` « Recharger la page ».

## 3. Liens externes et liens spéciaux

| Lien | Où |
|---|---|
| `mailto:contact@bailio.fr` | Accueil (pied de page), pages légales, `DataNotice` |
| `tel:…` (téléphone du locataire, d'un contact) | Fiche locataire, carnet, vue intervenant |
| `message://` et webmails (Gmail, Outlook, Yahoo, Orange, SFR, Free, Bbox, La Poste, Proton, iCloud, GMX) | Après l'envoi d'un lien (`MailLinks`) |
| https://www.linkedin.com/in/enzo-mercier/ | Mentions légales, Contact |
| https://www.service-public.gouv.fr/simulateur/calcul/zones-tendues · /F947 · /particuliers/vosdroits | Contrat, création du bail, fiche logement, sources |
| https://errial.georisques.gouv.fr/ | Ajouter un logement, fiche logement (état des risques) |
| https://www.visale.fr/ · https://www.dossierfacile.logement.gouv.fr/ · https://locataire.dossierfacile.logement.gouv.fr/ | Dossier, candidature, aides |
| https://cfsmsp.impots.gouv.fr/secavis/ · https://filigrane.beta.gouv.fr/ | Vérification du dossier locataire |
| https://www.leboncoin.fr/deposer-une-annonce · https://www.seloger.com/depot-annonce/location · https://www.pap.fr/publier-annonce/location/ · https://www.facebook.com/marketplace/create/rental | Annonce |
| https://chatgpt.com/ · https://claude.ai/ · https://gemini.google.com/ · https://chat.mistral.ai/ | Annonce (rédaction avec une IA) |
| https://www.legifrance.gouv.fr · https://eur-lex.europa.eu/… (eIDAS) | Sources, signature |
| impots.gouv (`impotsVide`, `impotsMeuble`) | Déclaration |

Aucun lien vers un réseau social autre que LinkedIn. Pas de lien vers la plateforme RLL (fermée).

## 4. Éléments cliquables récurrents

- **Menus** : en-tête public (Tarif, Se connecter / Mon espace, Créer mon bail), pied de page légal, menu de l'espace (latéral / barre du bas), bouton « + Ajouter » (fenêtre), lien « Aller au contenu ».
- **Fenêtres (modales)** : Ajouter, Loyer reçu, Départ du locataire, Créer un document, Ajouter un document, Dépense, Vérifier le dossier, Refus de complément, confirmations (suppression de compte, déconnexion des appareils). Fermeture par « × », Échap, clic sur le fond.
- **Onglets / filtres** : onglets du logement, filtres des documents, choix du type de location (accueil), choix du courrier, années (déclaration, bilan), clés de répartition.
- **Accordéons** : FAQ de l'accueil, aides (« une ouverte à la fois »), actions groupées (« un groupe ouvert à la fois »), « Voir les étapes faites » (parcours de mise en location).
- **Carrousel** : bande de photos « Montpellier en images » (défilement horizontal au doigt / clavier).
- **Pagination / tri** : aucune pagination ; listes triées par le serveur (urgentes d'abord, candidats classés par note).

## 5. Formulaires (champs, validations, messages)

| Formulaire | Champs principaux | Validations / messages |
|---|---|---|
| Connexion / Inscription | Email | « Indiquez une adresse email valide. » ; succès « Regardez vos emails. » + boutons messagerie ; « recommencez » |
| Tunnel (6 étapes) | Type, adresse (autocomplétion), surface, pièces, étage, période, chauffage, eau chaude ; civilité, prénom, nom, adresses ; loyer, charges, dépôt (≤ plafond légal), jour ; email | Bouton « Continuer » bloqué tant que l'étape n'est pas complète ; dépôt plafonné (« Revenir au maximum ») |
| Importer un bail | Fichiers (photo, PDF) | Formats acceptés, retrait de fichier, lecture OCR |
| Ajouter un logement | ≈ 60 champs répartis en étapes | Étapes « Passer cette étape », « il manque… » |
| Ajouter un locataire / Dossier locataire | Identité, naissance, coordonnées, situation, revenus, garant, justificatifs | Champs facultatifs marqués, pièces autorisées |
| Créer un bail / Contrat | Dates, durée, loyer, charges, paiement, zone tendue, encadrement, clauses | Blocage tant que les informations primordiales manquent ; plafonds légaux |
| Candidature | Identité, situation, revenus, occupants, date, garantie, message, pièces | Email, champs requis |
| Signature | Lecture, code email, photo, accord | Code à 6 chiffres |
| Lien du locataire | Assurance, chaudière, accord quittance, signalement (3 écrans), complément d'EDL | Photos ≤ 3 / ≤ 5, délais |
| Courriers | ≈ 25 modèles avec leurs champs | Aperçu PDF, enregistrement, envoi |
| État des lieux | Pièces, éléments, compteurs, clés, signatures | PDF |
| Argent | Dépense, facture photo, relevé CSV/OFX, déclaration, emprunt, répartition | Montants en euros |
| Compte | Profil, code à 6 chiffres (export, suppression) | Code reçu par email |
| Carnet, structures, accès partagés | Contacts, associés, email d'invitation | — |

## 6. Parcours complets

| # | Parcours | Étapes |
|---|---|---|
| P1 | **Découvrir et trouver le prix** | Accueil → « Tarif » → section tarifs → FAQ → pied de page → pages légales → retour |
| P2 | **Créer son bail sans compte (action principale)** | Accueil → « Créer mon bail » → Type → Logement → Personnes → Loyer → Relecture → Recevoir (email) → email (lien) → `/connexion/lien` → `/bienvenue/:id` → « Activer le suivi » → `/espace` |
| P3 | **Reprendre un brouillon** | Tunnel commencé → fermer → lien « reprendre » (email) → `/reprendre?brouillon=` → étape où l'on s'était arrêté |
| P4 | **Inscription directe** | `/inscription` → email → lien → `/espace` vide (« Ajouter un logement ») |
| P5 | **Connexion / déconnexion** | `/connexion` → email → lien → `/espace` → Mon compte → « Se déconnecter » → accueil ; lien expiré → « Recevoir un nouveau lien » (pas de mot de passe, donc pas de « mot de passe oublié ») |
| P6 | **Page protégée sans être connecté** | URL `/espace/logements` → `/connexion` → connexion → retour à `/espace/logements` |
| P7 | **Logement → locataire → bail → signature** | Ajouter un logement → Ajouter un locataire → Créer un bail → Relire → Signature en ligne (locataire, garant, bailleur) → bail signé |
| P8 | **Le locataire complète son dossier** | Fiche locataire → « Le demander par email » → `/dossier/:code` → « J'ai terminé » → propriétaire valide (`Vérifier le dossier`) |
| P9 | **Mise en location** | Logement → Annonce → Copier → Candidats (lien) → `/candidature/:code` → candidature → « Choisir ce candidat » → fiche locataire |
| P10 | **Suivi mensuel** | Loyer reçu → quittance envoyée ; relevé bancaire → rapprochement → validation ; quittance automatique |
| P11 | **Courrier** | Bail → Courriers → choisir un modèle → remplir → Aperçu → Enregistrer et envoyer |
| P12 | **État des lieux d'entrée / sortie** | Bail → État des lieux → `/edl/:id` → pièces → compteurs → clés → signatures → PDF ; sortie comparée → dégradations → solde de tout compte |
| P13 | **Le locataire signale un problème** | `/locataire/:code` → Signaler → type → description → photos → envoi → propriétaire : tâche « Aujourd'hui » → intervention |
| P14 | **Facture en photo** | « + Ajouter » → Facture → photo → vérifier → « Valider et ranger » |
| P15 | **Déclaration des revenus** | Argent → Déclaration → année → montants → cases à reporter |
| P16 | **Accès partagé** | Mon compte → Accès → Inviter → email → `/invitation/:token` → connexion → espace partagé → « Revenir à mon espace » |
| P17 | **Situation « Que se passe-t-il ? »** | Situations → départ / impayé / vente / problème → étapes guidées → courriers |
| P18 | **Garage loué seul** | Ajouter un logement « garage » → bail garage (7 étapes) → contrat propre |
| P19 | **Export et suppression du compte** | Mon compte → Tout exporter (code email) → Supprimer mon compte (code email) |
| P20 | **Corbeille** | Supprimer une dépense / un document → Corbeille → Restaurer |

## 7. Correspondance avec les tests

- Tests automatiques existants : `e2e/tests/01…32` (parcours métier complets, accessibilité axe-core).
- Tests de l'audit multi-appareils : `tests/audit/` (voir `tests/audit/README.md`).
- Tests manuels : `audit/dashboard-test.html`.
