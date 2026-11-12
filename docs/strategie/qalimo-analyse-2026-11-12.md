# Qalimo : analyse du site public (relevé du 12 novembre 2026)

Pages publiques seulement, lues avec Chromium (1440 × 900 et 390 × 844) et curl. robots.txt respecté (seuls `/wp-admin/` et `/telechargement/` sont fermés). Une page à la fois, quatre secondes d'écart. Aucune connexion, aucun compte, aucune page de l'application. Aucun texte long recopié.

Convention : `[/page/ · 12/11/2026]` veut dire « adresse sous https://www.qalimo.fr, relevée le 12 novembre 2026 ». Sans balise, toute la section vient de la page de son titre.

Complète : `docs/strategie/qalimo-2026-11.md` (relevé du 6 novembre) et `docs/strategie/prix-2026-11.md`.

## Résumé en 10 lignes

1. Aucun prix n'a changé depuis le relevé du 11 novembre : 4,90 € par bien jusqu'à 7 biens, 34,30 € par mois de 7 à 40, 49 € par an pour un bien, options à l'acte identiques [/tarif/ · 12/11/2026].
2. Les contradictions entre `/tarif/` et `/cgv/` sont toujours là : paliers (25 biens, 79,90 €), signature « à partir de 2,00 € », assurances moins chères dans les CGV [/cgv/ · 12/11/2026].
3. L'essai : « aucun débit », mais le moyen de paiement est demandé. Les CGV disent que le paiement se fait à la souscription [/tarif/, /cgv/ · 12/11/2026].
4. Qalimo vend la même promesse partout : « tout automatisé », 6 500 bailleurs, 369 avis, ancien huissier, support 7j/7 [/ · 12/11/2026].
5. L'accueil est très animé (démonstration collante en 9 étapes, six automatismes, calendrier avant/après, maquettes qui bougent), codé à la main par-dessus Elementor, avec `prefers-reduced-motion` respecté [/ · 12/11/2026].
6. Les pages fonctionnalité et solution suivent un même gabarit : 11 à 13 titres, 4 à 5 boutons identiques vers la même page de connexion, 1 300 à 1 700 mots [/synchronisation-bancaire/, /gestion-locative-sci/ · 12/11/2026].
7. Le poids est élevé : 2,4 à 3,7 Mo par page, 1 Mo de HTML sur l'accueil, accueil de 33 000 px de haut sur téléphone [/ · 12/11/2026].
8. Leur espace locataire public oblige le candidat à créer un compte et ne prend pas les pièces du garant [/candidature/ · 12/11/2026].
9. Leurs outils gratuits servent à capter des adresses email (simulateur : résultat après un code reçu par email) [/simulateur-rentabilite/ · 12/11/2026].
10. Faiblesses à exploiter : prix 40 % au-dessus de Bailio, options payantes malgré « 0 option payante », cartes de confiance auto-référencées, pas de filigrane ni de contrôle de bail illégal relevés, page d'accueil lourde et longue.

## Prix : ce qui a changé depuis le relevé du 11 novembre

| Élément | Relevé du 11 nov. | Relevé du 12 nov. | Changement |
|---|---|---|---|
| 1 à 7 biens | 4,90 € par bien et par mois | 4,90 € [/tarif/] | aucun |
| 7 à 40 biens | 34,30 € par mois | 34,30 € par mois, 343 € par an [/tarif/] | aucun |
| Au-delà de 40 biens | sur devis | sur devis [/tarif/] | aucun |
| Annuel | 2 mois offerts, 49 € pour 1 bien | 49 € par an, « soit 4,08 € par mois » [/ · /tarif/] | aucun |
| Signature électronique | 2,90 € | 2,90 € ; packs 7,80 / 11,50 / 20 € [/tarif/] | aucun |
| Recommandé AR | 8,50 € | 8,50 € [/tarif/] | aucun |
| Liasse LMNP ou SCI à l'IS | dès 399 € | 399 € le premier bien, 149 € par bien en plus [/tarif/] | aucun |
| Assurance loyers impayés | 2,75 % | 2,75 % du loyer charges comprises [/tarif/] | aucun |
| Protection juridique | 69 € par an | 69 € par an [/tarif/] | aucun |
| Page mise à jour le | 25 octobre 2026 | 25 octobre 2026 [/tarif/] | aucun |
| Agences (Qalimo Pro) | dès 50 € HT par mois | dès 50 € HT par mois [/tarif/] | aucun |

Ce qui diffère entre les pages elles-mêmes (relevé du 12 novembre) :

- Essai. `/tarif/` : l'essai « démarre une fois la formule choisie et le moyen de paiement renseigné », aucun débit pendant 30 jours. L'accueil dit : « Rien n'est débité pendant l'essai » [/tarif/, / · 12/11/2026]. Les CGV disent seulement que l'essai dure 30 jours dès la création du compte, et que le paiement se fait à la souscription [/cgv/, articles 3 et 8 · 12/11/2026].
- Garantie « satisfait ou remboursé » de 6 mois, « sans condition » sur `/tarif/`. Dans les CGV, les signatures et envois postaux en sont exclus [/tarif/, /cgv/ art. 6 · 12/11/2026].
- Paliers des CGV : un à six biens au prix unitaire, de 7 à 25 biens 34,30 € par mois, au-delà de 25 biens 79,90 € par mois ou 799 € par an. Sur `/tarif/` : forfait de 7 à 40 biens, devis au-delà [/cgv/ art. 7, /tarif/ · 12/11/2026].
- Options dans les CGV : signature « à partir de 2,00 € », PJ « à partir de 59 € », assurance propriétaire non occupant « à partir de 79 € », dépannage d'urgence « à partir de 5 € par mois », immatriculation LMNP 199 €, création de SCI 1 999 € [/cgv/ · 12/11/2026]. `/tarif/` ne montre pas ces deux derniers.
- « Acompte acquis » : les CGV disent que l'acompte versé à la commande ne se rembourse pas (hors force majeure). Cela contredit « remboursé sans condition » [/cgv/ art. 5 et 6 · 12/11/2026].
- Reconduction tacite dans les CGV (avec rappel de l'article L215-1), malgré « sans engagement » partout [/cgv/ art. 5, /tarif/ · 12/11/2026].
- « Tout est inclus, 0 option payante » (accueil), alors que quatre services sont payants à l'acte [/, /tarif/ · 12/11/2026].

Comparaison avec Bailio (calcul à partir de `config.ts` : 3,49 € par logement et par mois, 34,90 € par an) :

- Qalimo coûte 40 % de plus au bien (4,90 / 3,49) en mensuel comme en annuel (49 / 34,90).
- Attention : à partir de 10 logements, le forfait de Qalimo (34,30 €) devient moins cher que Bailio (10 × 3,49 = 34,90 €). Bailio reste devant jusqu'à 9 logements. Point à surveiller pour les propriétaires de plus de 9 biens.

## Liste exacte des fonctionnalités annoncées sur /fonctionnalites/ (titres seulement)

Relevé du 12 novembre 2026, [/fonctionnalites/].

Six parties numérotées, puis 18 cartes :

1. Mettre en location : Baux conformes ; Candidatures locataires ; État des lieux sur mobile ; Signature électronique.
2. Encaisser les loyers : Synchronisation bancaire ; Quittances automatiques ; Relances d'impayés ; Suivi des loyers.
3. Gérer le bail : Révision du loyer ; Régularisation des charges ; Plus de 50 modèles ; Colocations, immeubles et locaux.
4. Comptabilité et fiscalité : Catégorisation automatique ; SCI et LMNP ; Aide à la déclaration.
5. Automatiser : Automatisations personnalisables ; Facturation électronique ; Connecteur IA et API.
6. Sécurité et accompagnement : six pastilles (Hébergement en France, Support 7j/7, Migration offerte, Conçu par un commissaire de justice, Sans engagement, Essai de 30 jours).

La liste de l'accueil est plus longue : 22 cartes filtrables (Synchronisation bancaire ; Quittances automatiques ; Avis d'échéance ; Relances impayés ; Révision du loyer (IRL) ; Facturation électronique ; Contrats de location ; Candidatures locataires ; État des lieux numérique ; Signature électronique ; Espace locataire ; Modèles validés par un ancien huissier ; Rappels d'assurance ; Courriers juridiques ; Recommandé en ligne ; Données sécurisées ; Multi-profils bailleurs ; Pilotage et rentabilité ; Fiscalité et déclarations ; Export de vos données ; Intelligence artificielle ; Support humain 7j/7) [/ · 12/11/2026].

Ce qui n'est pas dans ces listes : filigrane des pièces, contrôle du bail contre la loi, comparaison d'état des lieux d'entrée et de sortie, import de bail par photo, CFE pré-remplie, tunnel sans compte.

## Mesures de poids et de vitesse (Chromium sans cache, une passe, relevé du 12 novembre 2026)

Réserve : une seule mesure par page, depuis un réseau de travail relayé. Les valeurs servent à comparer, pas à citer.

| Page | Poids bureau | Requêtes | Fin du chargement | LCP bureau | Poids mobile | LCP mobile | Hauteur mobile | Mots |
|---|---|---|---|---|---|---|---|---|
| / | 3,1 Mo | 30 | 3,1 s | 2,0 s | 2,9 Mo | 0,9 s | 33 468 px | 3 879 |
| /fonctionnalites/ | 2,7 Mo | 24 | 2,0 s | 1,5 s | 2,6 Mo | 0,7 s | 14 730 px | 1 308 |
| /tarif/ | 2,9 Mo | 22 | 4,3 s | 3,3 s | 2,9 Mo | 0,6 s | 19 095 px | 1 757 |
| /logiciel-quittance-de-loyer/ | 3,0 Mo | 26 | 2,1 s | 0,7 s | 2,9 Mo | 0,8 s | 17 407 px | 1 476 |
| /synchronisation-bancaire/ | 3,0 Mo | 25 | 2,5 s | 1,6 s | 2,9 Mo | 0,6 s | 17 362 px | 1 440 |
| /gestion-locative-particulier/ | 3,0 Mo | 23 | 1,4 s | 1,3 s | 2,9 Mo | 0,6 s | 16 793 px | 1 690 |
| /gestion-locative-sci/ | 2,9 Mo | 22 | 1,3 s | 1,2 s | 2,8 Mo | 0,9 s | 16 288 px | 1 569 |
| /guides/ | 2,9 Mo | 19 | 1,3 s | 0,6 s | 2,9 Mo | 0,6 s | 31 124 px | 2 657 |
| /modele/ | 3,6 Mo | 21 | 1,6 s | 0,9 s | 3,6 Mo | 0,7 s | 27 159 px | 1 763 |
| /simulateur-rentabilite/ | 3,1 Mo | 19 | 1,6 s | 0,7 s | 3,1 Mo | 0,6 s | 18 046 px | 2 165 |
| /avis-qalimo/ | 2,4 Mo | 20 | 1,3 s | 0,6 s | 2,4 Mo | 0,9 s | 10 378 px | 3 008 |
| /a-propos/ | 2,6 Mo | 24 | 2,1 s | 1,4 s | 2,5 Mo | 0,6 s | 16 014 px | 1 433 |
| /candidature/ | 2,4 Mo | 16 | 1,1 s | 0,6 s | 2,4 Mo | 0,5 s | 7 994 px | 674 |

Lecture : aucune page n'a de défilement horizontal sur téléphone. Le plancher est de 2,4 Mo par page (le même bloc de scripts et de feuilles de style partout). La page d'accueil pèse près de 1 Mo de HTML brut (curl, 12/11/2026). Les LCP restent corrects, sauf `/tarif/` (3,3 s sur cette passe, la plus lente).

Technique visible dans le HTML (accueil, 12/11/2026) : WordPress avec Elementor et WP Rocket, Crisp (chat), Google Tag Manager, pixel Facebook (PixelYourSite), LinkedIn, Trustpilot. Aucun bandeau de consentement visible sur la capture du haut de l'accueil.

## Accueil : https://www.qalimo.fr/

Relevé du 12 novembre 2026.

### Structure, section par section

1. En-tête : méga-menus Produit, Solutions, Ressources, plus Tarifs, Avis, Espace Locataire ; boutons « Se connecter » (contour) et « Essai gratuit » (plein). Sur 1440 px, « Espace Locataire » passe sur une seconde ligne (capture du 12/11/2026).
2. Héros : pastille de confiance (369 avis, 6 500 bailleurs), titre de 15 mots, paragraphe de 40 mots, deux boutons (essai ; démo de 9 minutes qui mène à YouTube), ligne de réassurance (30 jours, prix, sans engagement), trois cartes flottantes « en direct » (loyer reçu, quittance envoyée, relance J+3).
3. Bandeau « recommandé par » : six noms (dont Simloc, voir plus bas) et une mention « Logiciel n°1 ».
4. Quatre chiffres : 6 500 bailleurs ; 4,9/5 Trustpilot (165 avis) ; 5/5 Google (204 avis) ; 10 minutes pour démarrer.
5. « En bref » : un résumé étiqueté en huit lignes (ce que ça résout, comment, pour qui, prix, essai, qui, pourquoi, confiance). Écrit pour être repris tel quel par les moteurs et les IA.
6. « Le problème » : un calendrier de douze mois avec compteur 294 actions à la main contre 7 avec Qalimo, bascule « Sans / Avec », légende, détail au survol d'un jour, six lignes de détail.
7. « La plateforme » : démonstration collante en neuf étapes (voir animations), une barre de neuf onglets, texte à gauche (titre, deux lignes, trois coches), capture dans une fenêtre de navigateur à droite avec bulles.
8. Bandeau d'appel intermédiaire (« Prêt à laisser Qalimo travailler ? ») avec le bouton d'essai.
9. « Six automatismes » : seconde section collante (environ 5 000 px de haut), un panneau par automatisme avec maquette (banque, quittance, calendrier J+3 à J+15, bail, état des lieux, comptabilité).
10. « Et tout le reste » : 22 cartes avec filtres (Tout 22, Loyers 6, Louer 5, Protéger 5, Piloter 6) et la mention « 0 option payante ».
11. « Six raisons » : six blocs numérotés avec un mot-clé en pastille chacun, puis un encadré honnête « Ce que Qalimo ne fait pas » (pas de mandat, pas de visites).
12. Section « ancien huissier » : bandeau de texte défilant, trois chiffres (10 ans, plus de 1 000 litiges), citation signée en style de tampon.
13. Équipe : deux cofondateurs, équipe support.
14. Avis : note, rangées de cartes courtes qui défilent, puis quatre témoignages vidéo (Nice, Lyon, Paris, Lille).
15. Tarifs : curseur de nombre de biens, bascule mensuel/annuel, trois formules, bouton d'essai, quatre garanties, liste « à la carte ».
16. « Pour chaque profil » : huit pastilles-liens (Particuliers, LMNP, SCI, Investisseurs, Meublé, Colocation, Parkings, Agences).
17. Comparatif : Qalimo contre agence contre tableur (147 € contre 2 160 € par an pour 3 biens).
18. « Opérationnel en 10 minutes » : trois étapes, avec un champ email et le bouton « Créer mon compte ».
19. Guide de choix : six critères en 250 mots environ.
20. FAQ : 15 questions repliées.
21. Appel final : titre, phrase, bouton d'essai, bouton « Parler à un conseiller », quatre pastilles de réassurance. Pied de page (liens, email, téléphone, rendez-vous Calendly).

Longueur : 3 879 mots, environ 29 000 px sur ordinateur, 33 500 px sur téléphone. 16 titres de niveau 2.

### Animations

- Chargement : dérives lentes des fonds (images CSS `qlzDrift`, 16 à 22 s), grille de points, cartes flottantes qui flottent en boucle (`qhFloat`, 6 s), points « En direct » qui pulsent (1,8 s), balayage de brillance (`qhSheen`), curseur clignotant, cachet qui tourne (40 s), colonnes d'avis qui défilent (`qhCol`, 38 à 46 s) [/ · 12/11/2026].
- Défilement : sections collantes (trois conteneurs collants), révélations par IntersectionObserver (11 occurrences dans les scripts en ligne), apparition des blocs, démonstration en neuf étapes avec compteur « 01 / 09 », flèches précédent/suivant, indication « Faites défiler pour avancer », bulles d'explication avec cible qui pulse.
- Survol et souris : 11 écouteurs `mousemove` (inclinaison 3D du montage produit, `rotateX`, perspective). Détail d'un jour du calendrier au survol.
- Temps : `requestAnimationFrame` (35 occurrences) et `setInterval` (7), qui pilotent les auto-rotations et les compteurs.
- Bibliothèques : pas de GSAP, pas de CountUp, pas de ScrollTrigger détectés. Des traces de « lottie » et de « swiper » existent, mais viennent des fichiers Elementor ; aucun lecteur Lottie ni carrousel Swiper actif dans la page (un seul `canvas`, classe `fx-cv`). Le mouvement est du code maison (préfixes `qh`, `qlz`, `qf`) sur Elementor et WP Rocket.
- `prefers-reduced-motion` : 4 règles dans les feuilles de style, une mention dans les scripts. Avec la préférence activée, plus aucun élément n'est animé en CSS (mesuré : 0 sur l'accueil).
- Limite de mon relevé : la bascule d'étape de la démonstration collante n'a pas avancé quand j'ai sauté de position en position (reste sur « 01 / 09 » à onze hauteurs). Le déclenchement exact (molette, progression douce ou temps) n'est donc pas confirmé. Les compteurs 294 / 0 / 100 étaient déjà à leur valeur finale au moment de l'échantillonnage.

### Parcours de conversion

- Dix liens vers la page de connexion de l'application, avec un paramètre de provenance : « Essai gratuit » (en-tête), « Démarrer l'essai gratuit » (quatre fois), « Démarrer mon essai gratuit de 30 jours », « Essayer 30 jours », « Démarrer gratuitement » (deux fois).
- Secondaires : « Voir la démo · 9 min » (YouTube, quitte le site), « Prendre rendez-vous » (Calendly), « Nous contacter », « Parler à un conseiller », champ email « Créer mon compte ».
- Une seule destination pour tous les boutons d'essai : la même page de connexion. Pas de tunnel différent selon le profil [/ · 12/11/2026].

### Ce qui marche pour quelqu'un qui ne lit pas

- Chiffres en gros : 6 500, 4,9/5, 5/5, 10 min, 294 contre 7.
- Un seul prix répété (4,90 €) dans le héros, la barre, le tarif, la comparaison.
- Visuels : vraies captures de l'application dans une fenêtre de navigateur, bulles qui pointent le chiffre utile.
- Preuve sociale en continu : avis qui défilent, vidéos, logos.
- Résumé « En bref » : on comprend tout en huit lignes.
- Honnêteté ciblée : encadré « ce que Qalimo ne fait pas ».

### Faiblesses visibles

- Page très longue (33 500 px sur téléphone, environ 40 écrans) et lourde (3,1 Mo, HTML de 1 Mo).
- Beaucoup de texte sous les animations : 3 879 mots.
- Incohérence : « 0 option payante » contre quatre services payants, « sans engagement » contre reconduction tacite dans les CGV.
- « Recommandé par » : Simloc est le simulateur créé avant Qalimo par un des fondateurs [/a-propos/ · 12/11/2026]. Ce n'est pas une recommandation indépendante.
- Vocabulaire flottant : « ancien huissier » et « commissaire de justice » sur la même page.
- Les mêmes six ou sept boutons à la même adresse : aucune façon de choisir son parcours.
- Images de capture floues sur la démonstration (basse résolution constatée sur la capture d'écran du 12/11/2026).

## /fonctionnalites/

Relevé du 12 novembre 2026, [/fonctionnalites/].

### Structure

1. Héros : titre de 18 mots, paragraphe de 35 mots, deux boutons (essai, tarifs), trois pastilles, capture du tableau de bord avec quatre bulles numérotées.
2. Barre d'ancres collante : Louer, Encaisser, Gérer le bail, Comptabilité, Automatiser, Sécurité, Pour qui.
3. Six parties numérotées de 1 à 6, chacune : titre, phrase d'accroche, quatre cartes (un titre et une phrase), onglets sur la capture (trois ou quatre), capture dans une fenêtre de navigateur.
4. Six pastilles « Sécurité et accompagnement ».
5. « Pour qui » : six cartes de profil avec lien « Découvrir ».
6. « Qalimo face aux autres solutions » : six liens de comparatif (Rentila, BailFacile, Smartloc, GérerSeul, Monsieur Hugo, agence) plus le comparatif général.
7. FAQ de six questions. Appel final avec deux boutons.

1 308 mots, 10 titres de niveau 2, 8 images.

### Animations

Pages secondaires : même socle que l'accueil. Révélations au défilement (4 éléments « invisibles » avant apparition), onglets sur les captures, bulles numérotées. `prefers-reduced-motion` présent (4 règles). Pas de démonstration collante de neuf étapes détectée sur cette page.

### Conversion

Cinq liens vers la connexion : « Essayer Qalimo 30 jours » (deux fois), « Démarrer gratuitement », « Essai gratuit » (en-tête), plus « Voir les tarifs » (deux fois).

### Pourquoi ça marche sans lecture

Les six parties suivent l'ordre du travail du bailleur (louer, encaisser, gérer, déclarer). Les cartes tiennent en une phrase. Les captures sont réelles.

### Faiblesses

La page répète ce que l'accueil dit déjà. La signature est présentée comme « option » dans la partie 1 alors que l'accueil dit « tout inclus ». Pas de démonstration manipulable.

## /tarif/

Relevé du 12 novembre 2026, [/tarif/].

### Structure

1. Héros : titre, phrase, boutons « Essayer Qalimo 30 jours » et « Voir les formules », quatre pastilles de preuve (4,9/5, 6 500 bailleurs, support 7j/7), auteur et date (« Mis à jour le 25 octobre 2026 »).
2. Barre d'ancres : Formules, Simulateur, Inclus, Options, Face à une agence, Garanties, Avis, FAQ.
3. Quatre chiffres de confiance.
4. Trois formules en cartes, bascule mensuel/annuel : À l'unité, Forfait (« le plus choisi au-delà de 7 biens »), Sur mesure. Un exemple chiffré par carte.
5. Encart Qalimo Pro (agences).
6. Calculateur à curseur (nombre de biens), avec liste de ce qui est inclus.
7. « Ce qui est inclus » : six blocs de listes (une quarantaine de lignes).
8. « Ce qui est en option » : quatre blocs (signature, recommandé, comptabilité fiscale, assurances), prix affichés.
9. Écart avec une agence : 49 € contre 768 € par an pour un bien à 800 €, soit « 719 € d'économie ».
10. Garantie 6 mois, migration offerte en quatre étapes.
11. Avis : 369 avis, thèmes comptés (« simplicité 65 avis », « recommandation 51 »…), trois citations courtes.
12. FAQ de onze questions. Liens vers guides. Appel final.

1 757 mots, 22 requêtes.

### Animations

Curseur de nombre de biens qui met à jour la formule, le prix annuel et le prix mensuel en direct. Bascule mensuel/annuel. Révélations au défilement. `prefers-reduced-motion` : 5 règles.

### Conversion

Huit liens vers la connexion (« Essayer 30 jours » sur chacune des trois formules, « Essayer Qalimo 30 jours » en haut et en bas, « Démarrer gratuitement »), plus « Voir les formules » (ancre) et « Découvrir Qalimo Pro ».

### Pourquoi ça marche sans lecture

Trois cartes, un prix par carte, un curseur, un exemple chiffré, une comparaison avec l'agence en gros chiffres.

### Faiblesses

- Contradictions avec les CGV (voir plus haut).
- Le texte « tout est inclus » est suivi de quatre services payants.
- La carte « Sur mesure » renvoie vers un chat de compte ou un téléphone : pas de prix.
- Page la plus lente de mon relevé : 4,3 s de chargement, LCP 3,3 s.
- Les assurances sont vendues avec un numéro ORIAS affiché (courtier) : c'est un point de confiance, mais aussi un autre métier que le logiciel.

## /logiciel-quittance-de-loyer/ (page fonctionnalité)

Relevé du 12 novembre 2026, [/logiciel-quittance-de-loyer/].

### Structure

1. Héros : titre, accroche, deux boutons, preuve, auteur (« Par Nicolas Thomas ») et date, capture avec trois bulles.
2. Barre d'ancres : L'essentiel, Quittance ou reçu, Les règles, Étapes, Modèle ou logiciel, Avec Qalimo, Avis, FAQ.
3. Quatre chiffres : 0 € pour le locataire, 8 jours d'avis d'échéance, 3 ans pour agir, 1 clic.
4. Outil gratuit « Quittance ou reçu : faites le test » : deux curseurs (loyer, charges) et un curseur du montant reçu, résultat en direct.
5. Tableau de la loi (article 21) : cinq lignes.
6. Mode d'emploi en quatre étapes.
7. Tableau comparatif Qalimo contre modèle Word (cinq lignes).
8. Trois sections « Avec Qalimo » (quittance, avis d'échéance, facture pour baux pros) avec capture.
9. Quatre arguments de confiance, avis, FAQ, guides, appel final.

1 476 mots, 13 titres de niveau 2.

### Animations

Révélations au défilement, curseurs interactifs, compteur de chiffres, onglets de capture. `prefers-reduced-motion` : 5 règles.

### Conversion

Cinq liens (« Essayer Qalimo 30 jours », « Démarrer gratuitement », en-tête, plus « Voir les tarifs »). Aucun lien vers le générateur de quittance gratuit en bouton, seulement dans une phrase.

### Efficacité sans lecture

Quatre gros chiffres, un test interactif, un tableau de loi lisible d'un coup d'œil.

### Faiblesses

Le gabarit est identique à celui des autres pages : seuls les mots changent. Après le test gratuit, aucun bouton « ouvrir dans l'application » ne prend le montant saisi.

## /synchronisation-bancaire/ (page fonctionnalité)

Relevé du 12 novembre 2026, [/synchronisation-bancaire/].

### Structure

Même gabarit que la quittance : héros avec capture et trois bulles, ancres, quatre chiffres (mise à jour chaque jour ; comptes illimités ; reconnexion tous les 3 à 6 mois ; 0 virement émis), démonstration « vos opérations du jour » avec bouton « Rejouer » et cinq lignes de relevé fictives, tableau « comment Qalimo reconnaît vos virements » (six lignes : libellé, mot-clé, homonymes, répartition, aides au logement, dépenses), note de lecture seule (partenaire Linxo, filiale du Crédit Agricole), mode d'emploi en quatre étapes, comparatif synchronisation / saisie manuelle, trois blocs « Avec Qalimo », confiance, avis, FAQ.

1 440 mots, 13 titres de niveau 2.

### Animations

La démonstration des opérations rejoue des lignes de relevé qui sont rapprochées l'une après l'autre (bouton « Rejouer »). C'est le seul vrai « produit en action » de ces pages. `prefers-reduced-motion` : 6 règles.

### Conversion

Cinq liens vers la connexion et vers les tarifs, mêmes textes que partout.

### Efficacité sans lecture

Le tableau fictif montre le cas qui fait peur (nom marital, virement groupé, CAF) et sa règle.

### Faiblesses

- Reconnexion de la banque tous les 3 à 6 mois : une contrainte, dite en petit.
- La synchronisation est « facultative » : la saisie manuelle fonctionne aussi, ce qui affaiblit l'argument « zéro clic ».
- Ni la liste des banques, ni le délai de remontée par banque ne sont donnés.

## /gestion-locative-particulier/ (page solution)

Relevé du 12 novembre 2026, [/gestion-locative-particulier/].

### Structure

Héros avec capture ; ancres (Votre profil, Louer, Encaisser, Déclarer, Avis, Prix, FAQ) ; « ce qui s'applique à vous » en deux colonnes (location nue : micro-foncier 15 000 €, bail de 3 ans ; meublée : micro-BIC 83 600 €, bail d'un an) avec un encadré « À savoir » ; trois parties numérotées (louer, encaisser, réviser et déclarer) avec trois cartes et une capture chacune ; arguments, avis ; bloc « 49 € par an, au lieu d'une commission » ; texte de référencement « ce qu'un logiciel doit tenir pour vous » ; FAQ ; guides ; appel final. 1 690 mots.

### Animations et conversion

Mêmes que les pages fonctionnalité. Cinq boutons vers la connexion et les tarifs, avec les mêmes libellés.

### Efficacité sans lecture

Le prix est dans le titre de page (« 49 € par an ») et dans un bloc. Deux colonnes nu/meublé donnent les chiffres de la loi sans phrase.

### Faiblesses

Pas de simulateur ni de démonstration propre au particulier. Le régime fiscal est expliqué, mais rien ne le calcule sur cette page.

## /gestion-locative-sci/ (page solution)

Relevé du 12 novembre 2026, [/gestion-locative-sci/].

### Structure

Héros avec capture « profils bailleurs » ; ancres (IR ou IS, Plusieurs SCI, Associés, Comptabilité, Avis, Prix, FAQ) ; deux colonnes SCI à l'IR et SCI à l'IS ; trois parties (un profil par SCI, associés avec droits, comptabilité par SCI avec liasse payante) ; arguments, avis ; bloc de prix (« un tarif au bien, pas à la société ») ; texte sur la 2072 ; FAQ ; appel final. 1 569 mots.

### Animations et conversion

Mêmes que les autres pages solution. Cinq boutons vers la connexion et les tarifs.

### Efficacité sans lecture

Le tableau IR contre IS tient en dix lignes. Le message « un seul compte pour plusieurs SCI » est clair.

### Faiblesses

La déclaration de SCI à l'IS est payante (399 € puis 149 € par bien), ce qui contredit en partie « tout est inclus ». Un avertissement dit que meubler dans une SCI à l'IR peut faire passer à l'IS : c'est utile, mais renvoie vers un conseil externe.

## /guides/

Relevé du 12 novembre 2026, [/guides/].

### Structure

1. Héros : compteur « 142 guides », titre, phrase, auteur (Nicolas Thomas) et date (octobre 2026).
2. Frise « Étape 1 sur 6 » : Mettre en location (24 guides), Loyer et charges (11), Travaux et entretien (5), Fin de bail (17), Impayés et procédure (14), Fiscalité (9).
3. Deux séries : « Locataire ou propriétaire ? » (40) et « Les bases du bail » (18), puis « Locations particulières » (4). Total 142.
4. Cartes de guides, chacune avec une étiquette de type (Guide, Calculateur, Test, Simulateur, Parcours, Outil, Checklist, Modèle annoté, Recherche par commune) et « Lire le guide ».
5. FAQ. Appel final « La règle dans le guide, le suivi dans Qalimo ».

2 657 mots, 15 000 px sur ordinateur, 31 000 px sur téléphone.

### Animations et conversion

Révélations au défilement, filtres de la frise. Quatre boutons : essai (deux fois), « Les modèles de documents », « Démarrer gratuitement ». Le lien vers le produit est discret : le guide est la porte d'entrée.

### Efficacité sans lecture

Les étiquettes de type (Calculateur, Test, Parcours) disent d'un coup si c'est lu ou fait. L'ordre suit la vie du bail.

### Faiblesses

142 guides, c'est une avance que Bailio ne peut pas rattraper en volume. Mais la page est un mur de cartes : 31 000 px sur téléphone, peu de hiérarchie entre les guides les plus utiles et les autres.

## /modele/

Relevé du 12 novembre 2026, [/modele/].

### Structure

1. Héros : « 50+ », « 52 fiches », Word et PDF, deux boutons (« Compléter en ligne », « Voir les modèles »), preuve (369 avis).
2. Bloc de crédibilité : auteur, sources (loi de 1989 et décrets), date de dernière mise à jour (novembre 2026).
3. Six catégories avec nombre de modèles : contrats de bail (douze, du logement nu à la saisonnière), annexes et avenants, états des lieux et inventaire, caution et garant, congés, quittances et courriers.
4. Cartes de modèle (« Page guide dédiée », description d'une phrase, « Accéder au modèle »). Une charte de colocation « créer gratuitement ».
5. FAQ, guides les plus lus.

1 763 mots, 27 000 px sur téléphone, 3,6 Mo (page la plus lourde).

### Animations et conversion

13 éléments à révélation (le plus haut de mes pages hors simulateur). Boutons : « Compléter en ligne » (connexion), « Accéder au modèle » (pages dédiées), « Télécharger », « Démarrer l'essai gratuit ». Cinq formulaires détectés (onze champs) : je n'ai pas vérifié si le téléchargement demande un email.

### Efficacité sans lecture

Catégories nommées par moment de la vie du bail. Liens vers le texte officiel (Légifrance).

### Faiblesses

Les modèles gratuits en Word aident à faire sans logiciel. Le bouton « Compléter en ligne » mène vers la connexion et non vers le modèle rempli.

## /simulateur-rentabilite/

Relevé du 12 novembre 2026, [/simulateur-rentabilite/].

### Structure

Héros avec aperçu de résultat (rendement net 4,2 %, cash-flow +38 €, rendement brut 6,5 %, meilleur régime), quatre pastilles (6 régimes, 3 rendements, 2 min, PDF), formulaire en cinq blocs (bien, financement, revenus, charges annuelles, fiscalité, 37 champs), résultats après validation de l'email, longs textes de référencement (brut, net, net-net, exemple chiffré, cash-flow, quel régime, bon rendement en 2026), quatre étapes, FAQ. 2 165 mots.

### Animations et conversion

20 éléments à révélation. Boutons : « Calculer ma rentabilité », « Recevoir mon code », « Voir ma simulation », « Télécharger ma simulation (PDF) », « Activer l'alerte », « Refaire une simulation ». L'essai n'arrive qu'en fin de parcours.

### Efficacité sans lecture

Un aperçu chiffré dans le héros. Un résultat en PDF.

### Faiblesses

Le résultat est caché derrière un code reçu par email : friction, mais aussi collecte d'adresses. Le formulaire est très long (37 champs). L'outil est celui de Simloc (« Propulsé par Qalimo », « un outil bâti sur des dossiers réels » : texte d'origine de l'autre marque du fondateur).

## /avis-qalimo/

Relevé du 12 novembre 2026, [/avis-qalimo/].

### Structure

Héros : titre, note, deux boutons ; deux cartes de plateforme (Google 5,0 avec 204 avis, Trustpilot 4,9 avec 165 avis) ; deux citations en tête ; « mur des avis » (cartes mot pour mot, avec prénom, plateforme et mois) ; témoignages vidéo ; thèmes qui reviennent ; « où vérifier » (liens vers les plateformes) ; « comment nous traitons les avis » ; FAQ ; appel final. 3 008 mots, 6 700 px sur ordinateur.

### Animations et conversion

Défilement de cartes en rangées, révélations. Cinq boutons : essai (deux fois), vidéos, tarifs, « Démarrer gratuitement ». « Aucun débit pendant l'essai » repris ici.

### Efficacité sans lecture

Gros chiffres de note, citations courtes de trois à dix mots, noms des plateformes.

### Faiblesses

- Presque tous les avis cités sont à 5 étoiles ; la page `/tarif/` dit même que tous les avis Trustpilot des douze derniers mois sont à 5 [/tarif/ · 12/11/2026]. Un lecteur méfiant le remarque.
- Sur 204 avis Google, 185 ont un texte (dit sur `/tarif/`). Le chiffre de 369 mélange les deux plateformes.
- Une partie des témoignages date de janvier 2026 ; la plupart d'août et septembre.

## /a-propos/

Relevé du 12 novembre 2026, [/a-propos/].

### Structure

Héros (titre, phrase de mission, deux boutons, capture, date « Mis à jour le 27 octobre 2026 ») ; ancres ; quatre chiffres ; histoire en citation et trois paragraphes ; deux fondateurs (Nicolas, ancien huissier ; Théophile, ingénieur et investisseur, créateur de Simloc) ; mission (« copilote de gestion locative ») ; arguments ; quatre garanties durables ; avis ; FAQ ; appel final. 1 433 mots.

### Animations et conversion

Mêmes que les pages solution. Cinq boutons (essai, tarifs).

### Efficacité sans lecture

Le chiffre « plus de 1 000 litiges » et la citation en ouverture portent tout le récit.

### Faiblesses

Le récit repose sur une seule personne (le juriste). L'équipe n'est pas nommée au-delà des deux fondateurs. Les 6 500 bailleurs ne sont pas détaillés (une phrase cite des communes et des SCI).

## /candidature/ (espace locataire public)

Relevé du 12 novembre 2026, [/candidature/]. Sans aucune saisie : je n'ai entré aucun numéro de bien.

### Structure

Héros « Déposez votre dossier de location, en quelques minutes » avec un champ « numéro de bien » et le bouton « Valider » ; message qui dit que le numéro est obligatoire (donné par le propriétaire ou lu sur l'annonce, par exemple sur Leboncoin) ; maquette de dossier (pièce d'identité, justificatif de domicile, activité, ressources) ; quatre pastilles (gratuit, 100 % en ligne, données protégées, hébergées en France) ; quatre étapes (numéro, création de compte, dossier, propriétaire informé) ; listes des informations et des justificatifs à préparer (décret n° 2015-1437) ; liste des pièces interdites (dix lignes) ; FAQ de cinq questions ; appel final. 674 mots, 8 000 px sur téléphone (la plus courte de mes pages).

### Animations et conversion

Révélations sobres, pas de démonstration. Boutons : « Valider », « Saisir mon numéro de bien », « Démarrer gratuitement », « Essai gratuit » (en-tête). Un candidat n'a aucune raison de devenir client : la page ne parle presque pas du produit.

### Efficacité sans lecture

Un seul champ en haut, la liste des pièces autorisées et interdites en puces.

### Faiblesses

- Le candidat doit créer un compte locataire pour déposer son dossier (étape 2).
- Le dossier du garant n'est pas pris : les justificatifs de la caution sont à envoyer « en dehors de la plateforme » [/candidature/ · 12/11/2026].
- Pas de mention de filigrane ni de suivi pour retirer sa candidature.
- Le candidat doit connaître un numéro de bien : sans lien direct d'annonce, la porte reste fermée.

## Principes à reprendre (sans copier la forme)

1. **Un « En bref » étiqueté en tête de l'accueil** : ce que ça résout, comment, pour qui, prix, essai, confiance [/ · 12/11/2026]. Bailio peut l'écrire avec ses propres mots et ses propres étiquettes. Il sert aux moteurs, aux IA et aux lecteurs pressés.
2. **Un avant/après chiffré** (294 actions contre 7) [/ · 12/11/2026]. Bailio a ses propres chiffres : démarches par an (`Yearly`) à relier à un exemple sourcé.
3. **Une démonstration pas à pas avec bulles** sur de vraies captures [/ · 12/11/2026]. Bailio a déjà `ProductTour` ; garder la règle : un mouvement par étape, toujours coupé si l'appareil demande moins d'animations.
4. **Un outil gratuit dans chaque page fonctionnelle** (le test « quittance ou reçu ») [/logiciel-quittance-de-loyer/ · 12/11/2026]. À faire sans email obligatoire : c'est un avantage de Bailio.
5. **Un tableau « avec/sans le logiciel » par page** (modèle Word contre logiciel, saisie manuelle contre synchronisation) [/synchronisation-bancaire/ · 12/11/2026]. Il répond à l'objection la plus courante.
6. **Le prix dans le titre de page** (« 49 € par an ») sur la page particulier [/gestion-locative-particulier/ · 12/11/2026].
7. **Un exemple chiffré sous chaque formule** (« 3 biens, 14,70 € par mois ») et un calculateur à curseur [/tarif/ · 12/11/2026]. Bailio a déjà un calcul par logements et garages.
8. **La comparaison avec l'agence en euros**, avec l'hypothèse écrite en dessous [/tarif/ · 12/11/2026].
9. **Un encadré « ce que le produit ne fait pas »** [/ · 12/11/2026]. C'est honnête et rassurant. Bailio l'a déjà (« Ce que Bailio ne fait pas »).
10. **L'auteur et la date de mise à jour sur chaque page** [/tarif/, /a-propos/ · 12/11/2026].
11. **Des étiquettes de type sur les cartes de guides** (Calculateur, Test, Parcours) [/guides/ · 12/11/2026]. Facilite le tri par un lecteur pressé.
12. **Une barre d'ancres collante** par page longue [/tarif/, /fonctionnalites/ · 12/11/2026].
13. **Une page de preuves classée par thèmes** (ce qui revient dans les avis) [/avis-qalimo/ · 12/11/2026]. Seulement avec de vrais avis et l'accord écrit de leurs auteurs, comme l'impose `CLAUDE.md`.
14. **Des chiffres de la loi en tableau de dix lignes** [/gestion-locative-sci/ · 12/11/2026].

À ne pas reprendre : le curseur qui défile en rangées d'avis, l'inclinaison 3D, la longueur de la page d'accueil, le chat externe et les traceurs.

## Faiblesses à exploiter

1. **Le prix.** 4,90 € contre 3,49 € par bien et par mois, 49 € contre 34,90 € par an [/tarif/ · 12/11/2026]. Attention : au-delà de 9 logements, leur forfait est moins cher en euros ; cibler les propriétaires de 1 à 9 biens.
2. **« Tout est inclus » contre quatre services payants** : signature 2,90 € le document, recommandé 8,50 €, liasse dès 399 €, assurances [/, /tarif/ · 12/11/2026]. Bailio doit tenir ce qu'il promet : ne présenter comme inclus que ce qui l'est vraiment (`INCLUS`, `content/inclus.ts`).
3. **Des CGV qui contredisent les pages** : paliers, prix, « acompte acquis », reconduction tacite [/cgv/, /tarif/ · 12/11/2026]. Bailio : une seule version des prix, reprise de `config.ts`.
4. **Essai avec moyen de paiement demandé** [/tarif/ · 12/11/2026]. Bailio : les outils gratuits et la démo sans compte [/demo], sans carte.
5. **Un candidat obligé de créer un compte, sans dossier de garant** [/candidature/ · 12/11/2026]. Bailio : lien sans compte, pièces du garant, filigrane, suivi de candidature.
6. **Aucun filigrane, aucun contrôle de bail illégal, aucun état des lieux comparé relevé** sur ces pages [/fonctionnalites/, /candidature/ · 12/11/2026]. Bailio les a et peut les montrer en une capture chacun.
7. **Pas d'import de bail en photo** dans la liste des 18 cartes [/fonctionnalites/ · 12/11/2026].
8. **Outils gratuits derrière un email** (simulateur) [/simulateur-rentabilite/ · 12/11/2026]. Bailio : résultat tout de suite, sans email.
9. **Reconnexion bancaire tous les 3 à 6 mois**, partenaire Linxo [/synchronisation-bancaire/ · 12/11/2026]. Bailio : relevé déposé à la main aujourd'hui, mais sans reconnexion ni partenaire.
10. **Poids et longueur** : 2,4 à 3,7 Mo par page, accueil de 33 000 px sur téléphone, HTML de 1 Mo [/ · 12/11/2026]. Bailio peut tenir en une fraction de ce poids.
11. **Traceurs** : Google Tag Manager, pixel Facebook, LinkedIn, Crisp [/ · 12/11/2026]. Bailio : aucun cookie ni traceur, mesure maison. À dire sur la page `/cookies` et dans la comparaison.
12. **Confiance auto-référencée** : « recommandé par » inclut Simloc, créé par un fondateur [/, /a-propos/ · 12/11/2026] ; avis presque tous à 5 étoiles [/tarif/, /avis-qalimo/ · 12/11/2026]. Bailio : n'afficher que de vrais avis avec accord écrit.
13. **Mots flottants** : « huissier » et « commissaire de justice » côte à côte [/ · 12/11/2026].
14. **Gabarit uniforme** : onze à treize titres identiques d'une page à l'autre, mêmes boutons, même destination [/synchronisation-bancaire/, /logiciel-quittance-de-loyer/ · 12/11/2026]. Peu de choix du parcours : Bailio peut proposer un début adapté au type de bail (vide, meublé, garage).
15. **Barre de navigation qui passe sur deux lignes à 1440 px** (capture du 12/11/2026).

## Limites de ce relevé

- Je n'ai ouvert ni la page de connexion, ni l'application, ni la démonstration YouTube.
- Pas de saisie dans les formulaires publics (candidature, simulateur, modèles).
- La mécanique exacte de la bascule d'étape de la démonstration collante n'est pas confirmée.
- Les mesures de vitesse viennent d'une seule passe.
- Les chiffres de confiance (6 500 bailleurs, 369 avis, 4,9/5) sont ceux du site : non vérifiés.
