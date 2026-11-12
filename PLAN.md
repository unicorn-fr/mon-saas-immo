# Refonte de Bailio : plan (12 novembre 2026)

Objectif : rendre Bailio au moins aussi efficace que Qalimo pour un propriétaire, sans rien lui copier, avec une identité plus chaleureuse et plus humaine, qui reste sérieuse. L'avancement est suivi dans `PROGRESS.md`.

Règles tenues tout du long :
- aucun texte, aucune image, aucun code ni aucune mise en page repris de Qalimo ;
- aucune preuve sociale inventée (repères « À REMPLIR PAR ENZO ») ;
- aucun document présenté comme « validé juridiquement » : sources citées, relecture par un professionnel indiquée ;
- démo avec des données visiblement fictives ;
- aucun compte créé chez un tiers, aucune clé de production saisie ;
- aucun envoi, aucune mise en ligne sans l'accord d'Enzo.

## 1. Audit rapide

Ce que Bailio fait déjà mieux que Qalimo : les règles de la loi de 1989 sont codées et testées (DPE, plafonds, zones tendues, diagnostics), l'aide à la déclaration va jusqu'aux formulaires officiels remplis, l'état des lieux de sortie est comparé à l'entrée, et les pièces des candidats sont protégées.

Ce qui manque ou est plus faible :
- **Identité :** encore générique (bleu, orange, serif avec un mot en italique, le tic des sites générés). Les visiteurs survolent, mais l'accueil reste chargé en phrases.
- **Tableau de bord :** une seule vue, qui ne change pas selon qu'on gère un logement ou trente.
- **Pages publiques :** pas de page « Avis », pas de page d'entrée pour les locataires, pas de CGV distinctes (le prix est dans `/prix-et-remboursement`).
- **Services tiers :** codés en dur ou absents, sans interface commune ni mode simulé.
- **Côté locataire :** lien sans compte qui fait l'essentiel, mais pas de préavis en ligne ni d'aide au déménagement.
- **Absents :** prestataires (photo, ménage…), fil d'actualité du logement, lien entre l'emprunt et la rentabilité dans le tableau de bord.

Qalimo, d'après ses pages publiques et sa vidéo de démonstration (analyse détaillée : `docs/strategie/qalimo-2026-11.md`, `docs/strategie/qalimo-analyse-2026-11-12.md`) :
- tableau de bord à priorités ;
- colocation à la chambre ;
- documents avec date d'expiration ;
- note de confiance des candidats ;
- fiche du locataire à onglets ;
- automatismes par locataire ;
- banque synchronisée ;
- personnalisation (logo, modèles d'emails) ;
- connecteur IA ;
- plusieurs profils de bailleur.

## 2. Direction artistique : « Maison habitée »

L'idée : une location réussie, c'est une maison où quelqu'un vit bien et un propriétaire tranquille. Le signe de Bailio est **la fenêtre allumée**, un rond jaune soleil dans une maison vert forêt. On le retrouve dans le logo, le point du i, les bonnes nouvelles (loyer reçu) et le bouton de l'action principale.

- **Couleurs :**
  - vert forêt `#163C34` pour les aplats sombres et le logo ;
  - vert sauge `#2F6A58` pour la marque (liens, sélection) ;
  - fond brume `#EEF3EF`, papier blanc ;
  - jaune soleil `#FFC444`, réservé à l'action principale avec un texte forêt (7,6:1) ;
  - pêche et corail pour les illustrations et les personnes ;
  - rouge seulement pour les erreurs.
  - Fini le couple bleu et orange et le fond crème.
- **Polices :**
  - Bricolage Grotesque pour les titres et les chiffres : grotesque avec du caractère, un peu de main dans les courbes ;
  - Atkinson Hyperlegible Next pour le texte : conçue pour la lisibilité, utile à des lecteurs pressés ou âgés.
  - Les deux sont servies par le site, sans service tiers.
- **Mots-clés :** plus d'italique en accroche. Un mot-clé par écran est souligné d'un trait de feutre soleil.
- **Formes :** maison aux angles doux. On garde le coin replié de la page de bail, une forme propre à Bailio, et le rayon de 24 px pour les cartes.
- **Mouvement :** peu d'animations, mais orchestrées.
  - Les fenêtres de l'immeuble de l'accueil s'allument une à une quand une tâche se règle.
  - Les chiffres défilent.
  - Les écrans réels se jouent avec un curseur.
  - Rien ne bouge si l'appareil demande moins d'animations ; aucune animation sur le texte principal (LCP).
- **Ton :** phrases de moins de 15 mots dans les zones clés, verbes d'action, chiffres concrets. On vouvoie, sans jargon.
- **À éviter :**
  - l'étiquette en majuscules au-dessus des titres ;
  - la numérotation 01, 02 quand ce n'est pas une vraie suite ;
  - toutes les cartes identiques ;
  - le même fondu sur chaque section.

## 3. Architecture des pages publiques

Pages existantes, gardées et habillées : accueil, `/fonctionnalites` et une page par fonctionnalité, `/bail/:type`, `/gestion-locative/:profil`, `/tarifs`, `/guides`, `/modeles`, `/simulateurs/*`, `/demo`, `/changer-pour-bailio`, `/a-propos`, `/contact`, pages légales.

À ajouter :
- **`/avis` :** méthode (vrais avis, mot pour mot, avec accord écrit), bloc vide « À REMPLIR PAR ENZO » tant qu'il n'y a pas d'avis.
- **`/locataire` :** page d'entrée du locataire (son lien, ce qu'il peut faire, sans compte), qui renvoie vers le lien reçu par email.
- **`/cgv` :** conditions générales de vente tirées de `/prix-et-remboursement`, à faire relire par un juriste.
- Référencement : chaque nouvelle page dans `PUBLIC_PAGES`, `PAGE_META`, `llms.txt`, plan du site et mesure d'audience.

## 4. Accueil refait

L'accueil est fait pour être survolé. De haut en bas :
1. **Immeuble vivant :**
   - à gauche, une promesse en 6 mots et le bouton soleil ;
   - à droite, un immeuble dessiné dont les fenêtres s'allument au rythme de notifications réelles de l'application (« Loyer reçu · quittance envoyée », « Bail prêt à signer »).
2. **Le temps rendu :** une horloge de l'année qui se remplit des démarches que Bailio fait à votre place, chiffrées.
3. **Visite des écrans :** captures réelles qui défilent au rythme de la lecture, une phrase par écran.
4. **Automatismes en mini-écrans :** quittance, relance, révision, présentés comme des interrupteurs qu'on peut actionner.
5. **Tout ce que fait Bailio**, filtrable par moment : mettre en location, encaisser, gérer, déclarer.
6. **Prix :** un curseur pour le nombre de logements, le prix calculé, et la comparaison avec une agence.
7. **Avis**, seulement s'il y en a de vrais. **Questions fréquentes** repliées.

## 5. Tableau de bord adaptatif

Les mêmes composants pour tout le monde ; c'est la disposition qui change. À la première connexion, une question : « Combien de logements louez-vous ? » (1 ou 2, de 3 à 20, plus de 20, je suis une agence). La réponse est gardée dans le profil et se change dans « Mon compte » et en haut d'« Aujourd'hui ».
- **1 ou 2 logements :** « Aujourd'hui » simplifié, avec la prochaine chose à faire en grand, le loyer du mois et les raccourcis.
- **De 3 à 20 :** tuiles du mois, alertes, rentabilité par logement, lien vers les actions groupées.
- **Plus de 20 et structures :**
  - filtre par structure et par immeuble ;
  - vue du patrimoine en premier ;
  - exports et actions groupées en avant.
- **Agence :** rôles, mandats, relevés de gérance et vue par propriétaire. C'est un chantier lourd, qui touche au modèle de données et à la loi Hoguet (carte professionnelle). Il est préparé (choix de la vue, modèle « mandant » documenté), mais n'est pas livré dans ce lot sans l'avis d'Enzo.

## 6. Fonctionnalités, par impact et par coût

| Lot | Fonctionnalité | Impact | Coût |
|---|---|---|---|
| L4 | Interface commune des fournisseurs (banque, signature, recommandé, email, paiement, annonces) avec mode simulé | Fort (prépare tout) | Moyen |
| L6a | Fil d'actualité du logement (ce qui s'est passé, du plus récent au plus ancien, tiré des données existantes) | Fort | Faible |
| L6b | Emprunt relié à la rentabilité dans le tableau de bord (cash-flow après crédit, par logement) | Moyen | Faible |
| L6c | Côté locataire : préavis en ligne depuis son lien (date de fin calculée, accusé au propriétaire), aide au déménagement (liste de tâches) et aide en cas de panne (déjà : signalement) | Fort | Moyen |
| L6d | Prestataires (photo, vidéo, home staging, ménage, jardin) : annuaire tenu par Bailio, demande de devis par email, sans commission tant que le cadre n'est pas posé | Moyen | Moyen |
| L6e | Colocation à la chambre (loyer et bail par chambre) | Moyen | Fort, à part |
| L6f | Personnalisation (logo du bailleur sur les PDF, modèles d'emails) | Moyen | Moyen |

Diffusion automatique sur Leboncoin, SeLoger et Bien'ici : **impossible pour un particulier**. Les flux sont réservés aux professionnels (étude `docs/strategie/fournisseurs-2026-11.md`). On garde l'annonce à copier et les liens de dépôt ; l'interface « annonces » est prête pour un multidiffuseur le jour où la société aura le statut voulu.

## 7. Fournisseurs (étude complète : `docs/strategie/fournisseurs-2026-11.md`)

| Besoin | Choix conseillé | Autre option | Coût |
|---|---|---|---|
| Banque (DSP2, lecture seule) | Import CSV/OFX maintenant, puis Powens ou Bridge | Enable Banking | Sur devis : viser ≤ 0,70 € par compte et par mois |
| Signature | Signature maison (en place) | Docusign API (41 £/mois pour 40 enveloppes) ; Yousign sur devis | 0 € |
| Recommandé électronique | AR24 | Recommandé papier en ligne | 3,99 € HT l'envoi, à l'acte |
| Emails | SMTP Infomaniak (en place) | Scaleway TEM (0,25 € les 1 000) | Inclus ; attention à 300 logements et plus (limite par jour) |
| Paiement de l'abonnement | Stripe | Paddle / Lemon Squeezy (trop chers sur 3,49 €) | ≈ 0,33 € par mois et par logement, 1 à 3 % à l'année |
| Diffusion des annonces | Annonce à copier (en place) | Multidiffuseur pro, impossible sans statut | — |

Chaque fournisseur passe par une interface (`server/src/providers/`) avec un mode simulé par défaut. Le vrai fournisseur ne s'active que si ses clés sont dans `.env` sur le serveur ; rien dans git.

## 8. Prix (À VALIDER PAR ENZO)

Coût des tiers par logement et par mois : environ 0,07 € avec la signature maison, puis 0,33 € de Stripe au mois. Le VPS est un coût fixe. Qalimo est à 4,90 €.

| Option | Prix | Pour | Contre |
|---|---|---|---|
| A. Plus bas | 2,99 € par logement et par mois, 29,90 € par an | Écart net avec Qalimo | Stripe prend 11 % au mois, marge mince avant 300 logements |
| **B. Par défaut** | **3,49 € par mois, 34,90 € par an (2 mois offerts), garage 1,49 €** | Déjà affiché, 29 % sous Qalimo, l'offre annuelle absorbe les frais | — |
| C. Paliers | 3,49 € pour les 3 premiers, puis 2,49 € à partir du 4e | Attire les 3 à 20 logements | Plus difficile à expliquer |

La page Tarifs garde B, avec les montants marqués « À VALIDER PAR ENZO » dans `config.ts` (commentaire) et dans le rapport.

## 9. Ordre de travail

1. **L1 Design system v2 :** couleurs, polices, logo, icônes, direction artistique écrite, règles de `CLAUDE.md`, contrôle d'accessibilité.
2. **L2 Accueil refait.**
3. **L3 Tableau de bord adaptatif**, avec la question de la première connexion.
4. **L4 Interface des fournisseurs**, avec modes simulés.
5. **L5 Pages manquantes :** Avis, Locataire, CGV.
6. **L6 Fonctionnalités en plus**, dans l'ordre du tableau.
7. **Revue critique finale** de la direction artistique, puis rapport à Enzo.

Chaque lot : construction, vérification des types, tests du domaine, captures sur ordinateur et téléphone, axe-core. Un commit local par étape, sans envoi ni mise en ligne avant l'accord d'Enzo.
