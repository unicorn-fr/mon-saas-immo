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

## Corrigé après validation (22 octobre 2026)

Tous les points ont été validés puis corrigés. Test : `e2e/tests/35-corrections-audit.test.mjs`.

| # | Constat (persona) | Correction |
|---|---|---|
| A | Email mal tapé impossible à corriger après l'envoi (Paul) | « Ce n'est pas la bonne adresse ? Modifier mon adresse » sous le message du tunnel (`RecevoirStep.tsx`) |
| B | Garage absent du tunnel (Lucas) | Onglet « Garage » de l'accueil et lien « Je loue un garage, un box ou une place » du tunnel → création de l'espace, puis « Ajouter un logement » avec le garage déjà choisi (`ADD_PARKING_PATH`, `?nature=parking`) |
| C | Faute de frappe dans l'email (Paul) | « Vouliez-vous dire …@gmail.com ? » sous le champ, calculé sur l'appareil (`suggestEmail`, `lib/mail.ts`, testé ; `EmailSuggestion`), dans le tunnel et la connexion |
| D | Surface de 4,5 m² sans alerte (Paul) | Alerte sans blocage sous 9 m² : décent seulement si le volume atteint 20 m³ (`smallSurfaceWarning`, `lib/lease.ts`, testé), dans le tunnel et « Ajouter un logement » |
| E | Erreur corrigée encore affichée (Paul) | L'erreur d'une réponse disparaît dès qu'elle est corrigée (logement, personnes, loyer) |
| F | Erreurs des questions à choix non reliées (Sophie) | Curseur sur la première réponse à donner (`focusFirstError`), message relié à sa question (`aria-describedby`) |
| G | Petits liens au téléphone (Karim) | Ils avaient déjà la zone de toucher agrandie sur écran tactile (`.tap`), que le navigateur simulé ignorait ; ajoutée aux trois boutons « Modifier » du loyer et à « recommencez » ; le script d'audit en tient compte |
| H | Cases à cocher de 18 px (Emma) | Cases de 24 px (`Check`, `kit.tsx`) |
| I | Nom très long (Bruno) | Les noms étaient déjà limités à 80 caractères (champ et serveur) ; les aperçus du bail coupent maintenant les mots trop longs |
| J | Page d'import sans lecture automatique (Jean-Pierre) | L'introduction ne promet plus la lecture quand seule la saisie est proposée |
| K | Jargon sur l'accueil (Aïcha) | Une ligne sous le calcul : dépôt de garantie, préavis, zone tendue ; « quittance (le reçu du loyer) » et « indice officiel (IRL) » dans « Tout le dossier » |

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
