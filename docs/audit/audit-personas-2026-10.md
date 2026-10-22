# Audit par personas — octobre 2026

14 profils ont parcouru Bailio dans un vrai navigateur (Chromium, Playwright), en local, sur la base de test.
Aucun email réel n'est parti (sans SMTP, les liens restent dans le journal de l'API), aucune donnée de production touchée.

Rejouer : `CHROMIUM_PATH=/opt/pw-browsers/chromium node e2e/audit/personas.mjs [numéros]` (API et site lancés comme pour `npm --prefix e2e test`).
Captures et constats bruts : `e2e/audit/resultats/` (non versionné).

## Méthode

Tirée de la liste [awesome-testing](https://github.com/TheJambo/awesome-testing) :

- **Chartes d'exploration** (*Explore It!*, E. Hendrickson) : chaque persona a une mission et une façon de se comporter (pressé, maladroit, malicieux…), pas un script « chemin heureux ».
- **Utilisabilité** (*Don't Make Me Think*, S. Krug) : est-ce qu'on comprend sans réfléchir quoi faire, et comment se rattraper d'une erreur ?
- **Accessibilité** (WAVE, axe-core) : axe-core WCAG 2.0, 2.1 et 2.2 AA sur chaque écran visité, plus des contrôles manuels au clavier.
- **Contrôles automatiques** (inspirés de qmax-mcp) : erreurs JavaScript et console, erreurs serveur, débordement horizontal, cibles tactiles, requêtes vers des tiers, cookies, en-têtes de sécurité.

Chaque constat a été **revérifié à la main** ; les fausses alertes du premier passage ont été retirées (voir la fin du document).

## Le panel

| # | Persona | Ce qu'elle fait |
|---|---|---|
| 1 | Monique, 68 ans, retraitée, zoom 200 % | Tunnel complet jusqu'à l'espace, écran de 640 px |
| 2 | Karim, 34 ans, tout sur iPhone SE | Tunnel meublé au téléphone, puis l'espace |
| 3 | Sophie, 45 ans, aveugle | Clavier seul, lecteur d'écran (états, erreurs, focus) |
| 4 | Thomas, 29 ans, pressé | Double-clics, retour arrière, rechargement, lien ouvert deux fois |
| 5 | Paul, 52 ans, se trompe souvent | Valeurs absurdes, email mal tapé |
| 6 | Hélène, 57 ans, SCI familiale, 8 logements | Pages lourdes : logements, tableau de bord, déclaration, actions |
| 7 | Lucas, 41 ans, un garage seulement | Accueil « Garage » → tunnel |
| 8 | Nadia, 38 ans, juriste | Traceurs, stockage, pages légales, export et suppression |
| 9 | Jean-Pierre, 63 ans, bail déjà signé | Import d'un bail |
| 10 | Emma, 24 ans, la locataire | Lien du locataire et signalement au téléphone |
| 11 | Marc, 47 ans, 3G à la campagne | Lenteur, coupure réseau pendant la saisie |
| 12 | Aïcha, 31 ans, français langue seconde | Navigateur en anglais, traduction, jargon |
| 13 | Bruno, 26 ans, curieux et malicieux | Données d'un autre compte, injection de code, textes géants, rafales |
| 14 | Claire, 50 ans, revient après 3 semaines | Connexion, adresse inconnue, lien abîmé |

## Ce qui marche bien

- **Aucune erreur JavaScript, aucune erreur serveur** sur les 14 parcours.
- **Accessibilité** : aucune violation axe-core (WCAG 2.2 AA) sur les écrans visités, au bureau, au téléphone et en zoom 200 %. Boutons à choix annoncés (`aria-pressed`), questions regroupées (`fieldset`), lien d'évitement en premier, contour de focus visible.
- **Rien ne se perd** : rechargement, retour arrière, coupure réseau (« Non enregistré » s'affiche) : la saisie revient.
- **Doubles clics sans effet** : un seul brouillon, un seul email.
- **Sécurité** : baux, logements, PDF d'un autre compte, faux espace partagé et pilotage refusés ; HTML et scripts dans les noms affichés comme du texte ; faux lien magique refusé ; en-têtes de sécurité présents.
- **Vie privée** : zéro cookie, zéro requête vers un tiers de l'accueil à la fin du tunnel, stockage limité aux clés déclarées ; export et suppression du compte présents.
- **Connexion** : ne révèle pas si une adresse a un compte ; lien déjà utilisé → message clair et bouton « Recevoir un nouveau lien ».
- **Navigateur en anglais** : « 780.50 » compris comme 780,50 €.
- **Poids réel du site** (build de production) : environ 133 Ko de scripts compressés et quelques polices pour l'accueil, soit 3 à 4 s en 3G lente.

## Corrigé pendant l'audit

1. **Lien de connexion abîmé** (copié à moitié depuis l'email) : le message technique « Trop petit : chaîne de caractères doit avoir >=10 caractères » s'affichait. Il reçoit maintenant le message d'un lien expiré, déjà existant (`server/src/routes/auth.ts`).

## À valider avant de corriger

Ces points touchent au design, à une fonctionnalité ou à un texte : rien n'est modifié sans votre accord.

| # | Gravité | Constat (persona) | Proposition |
|---|---|---|---|
| A | Majeur | **Email mal tapé, impossible à corriger** (Paul) : après « Continuer mon bail », l'adresse s'affiche mais il n'y a ni champ ni bouton pour la changer. Seul un rechargement fait revenir le champ, et personne ne le devine. Le bail attend dans un brouillon que le propriétaire ne retrouvera pas. | Ajouter sous le message « Ce n'est pas la bonne adresse ? Modifier », comme le « recommencez » de la page de connexion. |
| B | Majeur | **Garage absent du tunnel** (Lucas) : l'accueil propose l'onglet « Garage » puis « Créer ce bail », qui mène à « Vide / Meublé » sans choix garage. | Soit un 3e choix « Un garage, un box ou une place » dans le tunnel, soit envoyer ce bouton vers la création de compte, puis « Ajouter un logement ». |
| C | Mineur | **Faute de frappe dans l'email** (Paul) : « @gmial.com », « @hotmial.fr »… acceptés sans remarque. | Suggestion « Vouliez-vous dire gmail.com ? » pour les grands fournisseurs (liste fixe, rien d'envoyé à un tiers). |
| D | Mineur | **Surface de 4,5 m²** acceptée jusqu'au bail sans alerte (Paul). Un logement décent fait au moins 9 m² et 20 m³ (décret n° 2002-120). | Alerte, sans blocage : « En dessous de 9 m², le logement n'est pas décent : il ne peut pas être loué comme résidence principale. » |
| E | Mineur | **Erreur corrigée encore affichée** (Paul) : le message rouge reste tant qu'on n'a pas recliqué sur « Continuer ». | Effacer le message d'un champ dès qu'on le modifie. |
| F | Mineur | **Erreurs des questions à choix** (Sophie) : annoncées toutes ensemble à l'envoi (7 alertes d'un coup), puis le focus reste sur « Continuer ». | Placer le focus sur la première question en erreur et relier chaque message à sa question (`aria-describedby`). |
| G | Mineur | **Petits liens au téléphone** (Karim) : « Modifier », « Voir toutes les étapes », « Tout voir », « Gérer », « Ouvrir », « Donner mon avis » font 17 à 20 px de haut (WCAG 2.5.8 conseille 24 px). | Un peu de marge intérieure sur `TextLink` seul (pas dans une phrase). |
| H | Mineur | **Cases à cocher de 18 px** sur le lien du locataire (Emma). | Agrandir la zone cliquable à 24 px (la case peut rester visuellement de 18 px). |
| I | Mineur | **Nom très long** (Bruno) : un prénom de 500 lettres sans espace fait déborder l'aperçu du bail sur la relecture. Les champs n'ont pas de longueur maximale. | Limiter les noms à 100 caractères et couper les mots trop longs dans l'aperçu. |
| J | Mineur | **Page d'import sans lecture automatique** (Jean-Pierre) : quand la lecture n'est pas disponible, l'introduction dit toujours « Bailio lit le bail et remplit tout ». | Adapter l'introduction quand seule la saisie est proposée. |
| K | Info | **Jargon** (Aïcha) : IRL, DPE, dépôt de garantie, préavis, quittance, zone tendue apparaissent sur l'accueil. | Vérifier que chacun est expliqué en une ligne (règle « Rédaction » de CLAUDE.md). |

## Non testé ici (limites de l'environnement)

- **Lecture automatique des baux** (Tesseract absent de ce conteneur) et **recherche d'adresse** (data.geopf.fr inaccessible) : à tester sur le VPS.
- **En-têtes de Caddy** en production (seule l'API locale est contrôlée) : `curl -I https://bailio.fr` à faire une fois.
- **Vrais emails** (délivrabilité, indésirables) et **vrais téléphones** (Safari iOS, Android).
- Rien ne remplace **5 vrais propriétaires** observés 20 minutes chacun : ce panel trouve les pièges mécaniques, pas les incompréhensions de fond.

## Fausses alertes retirées après vérification

- « Loyer négatif accepté » : le signe moins est supprimé à la frappe, « -50 » devient 50 €.
- « Pas de bouton de création de structure » : il existe (« Ajouter une structure ») ; le script regardait avant l'affichage.
- « Accueil à 53 s en 3G » : mesuré sur le serveur de développement (7 Mo non compressés) ; le site réel pèse environ 20 fois moins.
- « Importer : aucun champ de fichier » : normal ici, la lecture n'est pas disponible dans ce conteneur (voir J).
