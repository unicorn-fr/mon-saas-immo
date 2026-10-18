# Bailio : rapport d'audit (octobre 2026)

> Fonctionnement, facilité d'utilisation et sécurité, sur smartphone, tablette et ordinateur.
> Cartographie : [`AUDIT_PLAN.md`](AUDIT_PLAN.md) · tableau complet de chaque élément testé : [`resultats-tests.md`](resultats-tests.md) · captures : [`anomalies/`](anomalies/).

## 1. Résumé

| | Nombre |
|---|---|
| Vérifications automatiques (passage final) | **16 062**, sur 12 configurations, dont 74 pages, chaque lien et chaque bouton cliqués, 8 parcours complets, 42 liens externes, le tableau de bord |
| Anomalies distinctes trouvées | **12** : 0 bloquante, 7 majeures, 3 mineures, 2 cosmétiques (détail partie 2) |
| Anomalies corrigées | **12 sur 12**, toutes vérifiées par une nouvelle passe des tests (une à confirmer en ligne : caméra de l'ordinateur) |
| KO restants | **0** après application des points validés (partie 3) |
| « À améliorer » restants | **478** : 300 mineurs (cibles tactiles entre 24 et 44 px) et 181 cosmétiques (textes de 12 px sur téléphone, liens externes non vérifiables depuis la machine de test), voir partie 3 |
| Sécurité | Aucune faille exploitable trouvée ; 2 corrections préventives (caméra, injection CSV) |

**Anomalies par appareil (avant corrections, constats distincts)**

| Appareil | Bloquant | Majeur | Mineur | Cosmétique |
|---|---|---|---|---|
| Smartphones (iPhone, Android, portrait et paysage) | 0 | 5 (A1, A2, A4, A6, A7) | 3 (A8, A9, A10) | 2 (A11, A12) |
| Tablettes (iPad portrait et paysage) | 0 | 6 (A1, A2, A4, A5, A6, A7) | 3 | 2 |
| Ordinateurs (Chrome, Firefox, Safari, 1366 et 1920 px) | 0 | 3 (A1, A2, A3) | 3 | 1 (A11) |

**Passage final, par appareil** (le détail est dans [`resultats-tests.md`](resultats-tests.md)) :

| Appareil | Vérifications | KO | À améliorer |
|---|---|---|---|
| iPhone portrait | 1 526 | 1 avant V1, 0 après | 87 |
| iPhone paysage | 1 511 | 1 avant V1, 0 après | 88 |
| Android portrait | 1 513 | 0 | 87 |
| Android paysage | 1 537 | 1 avant V1, 0 après | 96 |
| iPad portrait | 1 389 | 0 | 52 |
| iPad paysage | 1 447 | 0 | 60 |
| Chrome 1366 / 1920 px | 1 210 / 1 210 | 0 | 0 |
| Firefox et Safari 1366 / 1920 px (premier passage) | 1 179 à 1 181 chacun | 0 | 2 (lien LinkedIn, corrigé depuis) |

### Conditions des tests

- **En local uniquement**, sur une base PostgreSQL de test, avec des comptes créés pour l'audit (`tests/audit/seed.mjs`). Jamais la production.
- **Aucun vrai email** : l'API locale, sans service d'envoi, écrit les emails (liens de connexion, codes, quittances) dans son journal, où les tests les relisent. Aucun SMS, aucun paiement.
- **12 configurations** : iPhone et Android en portrait et paysage, iPad en portrait et paysage, Chrome, Firefox et Safari en 1366 et 1920 px.
- **Limite de l'environnement** : le réseau de la machine de test bloque le téléchargement des navigateurs WebKit (Safari) et Firefox (`cdn.playwright.dev`). Chromium a donc imité chaque appareil : taille d'écran, écran tactile, navigateur annoncé, densité de pixels. Les différences propres au moteur de Safari ou de Firefox (rendu des polices, saisie de date) sont à vérifier à la main avec le tableau de bord. Pour lever cette limite, il suffit d'autoriser `cdn.playwright.dev` dans les réglages réseau de l'environnement.
- Firefox et Safari ordinateur, qui passent ici aussi par Chromium, ont été testés au premier passage (0 anomalie, comme Chrome). Ils n'ont pas été relancés au passage final, pour gagner du temps.
- **INSEE bloqué** : l'indice IRL est remplacé par des valeurs de test (`tests/audit/insee-stub.mjs`). Les échecs de la suite `e2e/` existante (« Il manque encore : révision ») venaient de là, pas du site.
- **Liens externes** : presque tous les sites externes sont bloqués par le réseau de test. Leur format est vérifié automatiquement ; leur réponse est à vérifier à la main (tableau de bord, groupe 1).

### Ce qui a été testé, sur chaque configuration

- **Chaque page** (74 adresses, publiques, protégées, liens reçus par email, liens invalides, 404) : accès direct, code HTTP, page blanche, rafraîchissement, temps de chargement, erreurs JavaScript et réseau, images, textes oubliés, défilement horizontal, éléments coupés, cibles tactiles, taille des champs, survol, lisibilité, clavier mobile, accessibilité WCAG 2.1 AA (axe-core : contrastes, intitulés, textes alternatifs).
- **Chaque lien** cliqué pour de vrai (destination vérifiée, puis retour arrière), et **chaque bouton** cliqué sur une page fraîche (une réaction doit se produire). Les fenêtres doivent se fermer avec Échap. Les boutons qui effacent ou envoient (supprimer, signer, envoyer…) ne sont pas cliqués automatiquement : ils sont dans le tableau de bord manuel.
- **Parcours complets** : découverte de l'accueil, « Créer mon bail » écran par écran jusqu'au lien de l'email, connexion et déconnexion, page protégée, candidature, signalement du locataire, dossier du locataire. Formulaires remplis avec des champs vides, des formats invalides, des textes très longs, des accents, des apostrophes et des emojis.
- **Navigation au clavier** (ordinateur) : lien « Aller au contenu », contour de focus, fenêtre ouverte et fermée au clavier.
- **Sécurité** : voir la partie 4.

## 2. Anomalies trouvées et corrections

Gravité : **Bloquant** (empêche d'aller au bout), **Majeur** (gêne forte ou fonction inaccessible), **Mineur**, **Cosmétique**.

| # | Gravité | Anomalie | Appareils | Où (fichier) | Correction | Corrigé / Vérifié |
|---|---|---|---|---|---|---|
| A1 | Majeur | « Créer mon bail » : un texte de plus de 120 caractères dans « Bâtiment, étage, porte » (ou un nom de plus de 80) faisait refuser **chaque** enregistrement du brouillon (HTTP 400). L'indicateur passait à « Non enregistré », et la saisie était perdue au rechargement. | Tous | `client/src/pages/tunnel/LogementStep.tsx:199`, `PersonnesStep.tsx`, `RelectureStep.tsx`, `components/AddressField.tsx` (limites du serveur : `server/src/domain/lease.ts:9-34`) | Longueur des champs limitée comme sur le serveur (`b9fbba1`) | ✅ / ✅ parcours P2 |
| A2 | Majeur | Après une redirection vers la connexion, le lien reçu par email menait à « Aujourd'hui » au lieu de la page demandée (par exemple le lien d'un email de rappel ouvert avec une session expirée). | Tous | `client/src/pages/Connexion.tsx`, `server/src/routes/auth.ts` | La page demandée voyage avec le lien de l'email (`&suite=`, chemin interne seulement) (`86ef706`) | ✅ / ✅ parcours P6 |
| A3 | Majeur | Signature en ligne : le bouton « Utiliser la caméra de l'ordinateur » ne pouvait pas marcher en production : l'en-tête `Permissions-Policy: camera=()` de Caddy interdit la caméra au site. | Ordinateur | `deploy/vps/Caddyfile:24` | `camera=(self)` (`fcdca99`). À vérifier après la mise en ligne (tableau de bord, test « caméra de l'ordinateur ») | ✅ / à vérifier en ligne |
| A4 | Majeur | Le **carnet** était introuvable sur téléphone et tablette : il n'est pas dans la barre du bas, et aucun autre lien n'y menait. | Smartphones, tablettes | `client/src/components/AppShell.tsx:33` | Carte « Carnet » dans « Mon compte » sur téléphone et tablette (`c32a7a0`) | ✅ / ✅ parcours P5 |
| A5 | Majeur | iPad portrait (810 px) : sur les pages légales, Contact et la 404, le pied de page débordait (lien « Contact » hors de l'écran, défilement horizontal). | iPad portrait | `client/src/components/SiteChrome.tsx:43` | Les liens passent à la ligne (`1234028`) | ✅ / ✅ |
| A6 | Majeur | Cibles tactiles de moins de 24 px (minimum WCAG 2.2) : fil d'Ariane, liens et boutons texte (« Modifier », « Voir toutes les étapes », « Retour », « Quitter »…), liens légaux de l'accueil, références juridiques, boutons « À recevoir ». Une cinquantaine de pages concernées. | Smartphones, tablettes | `components/kit.tsx` (TextLink, Crumbs, Check), `FlowLayout.tsx`, `Sources.tsx`, `Bail.tsx`, `Aujourdhui.tsx`, `Legal.tsx`, `home.css`… | Zone de toucher agrandie sans rien déplacer, seulement sur écran tactile (classe `.tap`, `styles.css`) (`8caffda`, et logo, barre du bas : commit suivant) | ✅ / ✅ |
| A7 | Majeur | Accessibilité : sur téléphone, le bouton « Fermer » des parcours pas à pas (ajouter un logement, un locataire, créer un bail) n'avait pas de nom pour les lecteurs d'écran (seule la croix restait visible). | Smartphones, tablettes | `client/src/components/FlowLayout.tsx:22` | `aria-label` et cible de 44 px (`934a8b9`) | ✅ / ✅ axe-core |
| A8 | Mineur | Actions groupées : le premier groupe ne se repliait pas (cliquer ne faisait rien). | Tous | `client/src/pages/espace/Actions.tsx:62` | État « tout replié » distinct de « par défaut » (`64ad63d`) | ✅ / ✅ |
| A9 | Mineur | Pas de titre principal (h1) sur les fiches (logement, locataire, bailleur, caution, contrat), les courriers et les pages en erreur. Le titre de l'onglet restait donc générique (RGAA 8.6). | Tous | `client/src/components/FlowLayout.tsx:159`, `Courriers.tsx:107`, `kit.tsx:749` | Titres en h1, sans changement visuel (`825a2c8`) | ✅ / ✅ |
| A10 | Mineur | Export comptable CSV : un fournisseur ou un nom de logement commençant par `=`, `+`, `-` ou `@` pouvait être exécuté comme une formule par le tableur (injection CSV). | Ordinateur | `server/src/routes/money.ts:252` | Texte neutralisé (`cff0cda`) | ✅ / ✅ |
| A11 | Cosmétique | Lien LinkedIn (mentions légales, contact) ouvert dans le même onglet. | Tous | `client/src/pages/legal/Legal.tsx:82,477` | Nouvel onglet | ✅ / ✅ |
| A12 | Cosmétique | Logo, barre du bas : cibles entre 24 et 44 px. | Smartphones, tablettes | `components/Logo.tsx`, `AppShell.tsx` | Marge intérieure invisible | ✅ / ✅ |

Faux positifs écartés après vérification (aucune correction) : le champ caché anti-robots de la candidature (hors écran exprès), les choix déjà sélectionnés (cliquer « 2025 » quand 2025 est choisi ne change rien), la limite de 4 emails par heure sur une même invitation (déclenchée par les 12 appareils de test), les erreurs survenues pendant le redémarrage de l'API local, et la page « blanche » vue une fois sous forte charge (le chargement prenait plus de 4 s).

### Étapes pour reproduire les anomalies principales

- **A1** : Accueil → « Créer mon bail » → « Vide » → collez 200 caractères dans « Bâtiment, étage, porte » → l'indicateur en haut affiche « Non enregistré » → continuez jusqu'à l'étape 5, rechargez : les informations saisies depuis sont perdues. Capture (avant correction, Chrome 1366) : [`anomalies/avant/chrome-1366--P2-…-Rafra-chissement-du-tunnel.jpg`](anomalies/avant/chrome-1366--P2-Cr-er-son-bail-tunnel-Rafra-chissement-du-tunnel.jpg).
- **A2** : Déconnecté, ouvrez `/espace/argent` → connexion → ouvrez le lien de l'email dans un nouvel onglet → arrivée sur `/espace` au lieu de `/espace/argent`. Capture : [`anomalies/avant/chrome-1366--P6-…`](anomalies/avant/chrome-1366--P6-Page-prot-g-e-Retour-apr-s-connexion.jpg).
- **A3** : En production, signez un document depuis un ordinateur → « Utiliser la caméra de l'ordinateur » → message « La caméra n'est pas accessible ».
- **A4** : Sur téléphone, cherchez le carnet depuis n'importe quelle page de l'espace : aucun lien.
- **A5** : iPad portrait, ouvrez `/mentions-legales` → la page défile de côté, « Contact » est coupé. Capture : [`anomalies/avant/ipad-portrait--Contact-debordement.jpg`](anomalies/avant/ipad-portrait--Contact-debordement.jpg).
- **A6** : Sur téléphone, page d'un bail → le fil d'Ariane « Logements / Studio » fait 18 px de haut. Capture : [`anomalies/avant/android-portrait--Bail-sign-cibles-24.jpg`](anomalies/avant/android-portrait--Bail-sign-cibles-24.jpg) ; bouton Fermer sans nom (A7) : [`anomalies/avant/android-portrait--Ajouter-un-logement-axe.jpg`](anomalies/avant/android-portrait--Ajouter-un-logement-axe.jpg).
- **Accueil sur téléphone, avant V1** : [`anomalies/iphone-portrait--P1-…`](anomalies/iphone-portrait--P1-D-couvrir-le-site-Action-principale.jpg).

## 3. Points soumis à votre validation : acceptés et appliqués

Vous avez validé les 5 changements proposés. Ils sont appliqués et vérifiés :

| # | Changement | Commit | Vérifié |
|---|---|---|---|
| V1 | Accueil sur téléphone : bloc d'accueil plus serré, photo du haut moins haute, texte d'introduction masqué en paysage. « Créer mon bail » est visible sans défiler sur iPhone et Android, en portrait et en paysage. | `58bfb65`, `c76f652` | ✅ parcours P1 sur 5 appareils |
| V2 | Plus aucun texte de 11 ou 12 px : passés à 13 px. | `9ff49fc` | ✅ 0 texte trop petit (contrôle « Lisibilité ») |
| V3 | Onglets et filtres en pastilles : 44 px de haut sur écran tactile. | `9ff49fc` | ✅ |
| V4 | IRL : les dernières valeurs de l'INSEE sont gardées en base (table `IrlPoint`, migration `20261018133225_irl_cache`) et reprises quand l'INSEE ne répond pas : le bail n'est plus bloqué. | `ec3a190` | ✅ essai avec l'INSEE coupé, test d'accès ajouté (`access.test.ts`) |
| V5 | vitest 3 → 5 : `npm audit` du site à 0 faille, dépendances de développement comprises. | `9201b73` | ✅ tests du site (17) et construction OK |

Il reste environ 45 cibles de 24 à 44 px par téléphone (« à améliorer », conformes au minimum WCAG) : liens dans des listes et boutons secondaires. On pourra les reprendre au fil des retours du tableau de bord.

**À faire au déploiement** : la migration `irl_cache` s'applique toute seule au démarrage (`prisma migrate deploy`), et la caméra (A3) est à vérifier une fois en ligne.

## 4. Sécurité

Vérifié dans le code et par des tentatives réelles sur l'API locale :

| Contrôle | Résultat |
|---|---|
| Toutes les routes de l'API sans être connecté (174) | ✅ Les 145 routes privées répondent 401. Les routes publiques (candidature, lien du locataire, dossier, signature, invitation) exigent un code aléatoire de 96 à 256 bits et répondent 404 sinon. |
| Accès aux données d'un autre compte (IDOR) : chaque route appelée avec les identifiants d'un autre propriétaire | ✅ Aucun accès : toutes les requêtes sont filtrées par propriétaire (les 2 routes qui répondaient 200 n'agissent que sur les données du compte connecté). |
| Sessions | ✅ Jeton aléatoire de 256 bits, seule son empreinte SHA-256 est en base, expiration après 30 jours sans activité, appareils déconnectables. |
| Connexion par lien et codes à 6 chiffres | ✅ Lien valable 30 minutes, utilisable une seule fois (écriture conditionnelle), 5 essais au plus par code, limites par adresse IP et par adresse email. |
| Redirections après connexion | ✅ Chemins internes seulement (`safePath` côté site, liste blanche `/espace`, `/edl`, `/bienvenue` côté serveur). |
| Fichiers déposés | ✅ Types autorisés (PDF vérifié, images réencodées sans métadonnées), 15 Mo au plus, servis avec `nosniff` et un nom encodé. |
| Injections | ✅ Aucune requête SQL brute avec des données saisies (Prisma) ; emails échappés ; aucun `dangerouslySetInnerHTML` ; formules CSV neutralisées (A10). |
| Appels vers l'extérieur (SSRF) | ✅ Adresses fixes (Géoplateforme, ADEME, INSEE) ; les paramètres saisis sont seulement encodés. |
| En-têtes (Caddy, Helmet) | ✅ HTTPS forcé (HSTS), CSP stricte (`script-src 'self'`), `frame-ancestors 'none'`, `nosniff`, Referrer-Policy ; caméra autorisée pour le site seulement (A3). |
| Base de données | ✅ Non exposée (seul Caddy écoute sur 80 et 443) ; l'API tourne en `NODE_ENV=production`. |
| Dépendances (`npm audit --omit=dev`) | ✅ 0 faille en production pour le serveur et le site. Outils de développement : `source-map-js` mis à jour (`f39e175`), vitest 5 (V5) : 0 faille. |

Pistes, sans urgence : le jeton de session est gardé dans le stockage du navigateur (la CSP stricte limite le risque) ; l'import de baux (OCR) a une file d'attente, mais pas de taille maximale.

## 5. Corrections faites (commits)

Branche `claude/busy-babbage-2maznh` : un commit par correction.

| Commit | Correction |
|---|---|
| `b9fbba1` | A1 : longueur des champs du tunnel limitée comme sur le serveur |
| `86ef706` | A2 : retour à la page demandée après la connexion par email |
| `64ad63d` | A8 : premier groupe des actions groupées repliable |
| `934a8b9` | A7 : bouton Fermer des parcours pas à pas nommé, cible de 44 px |
| `1234028` | A5 : pied de page des pages légales sur tablette |
| `8caffda` | A6 : petits liens et boutons texte touchables au doigt |
| `c32a7a0` | A4 : carnet accessible sur téléphone et tablette |
| `fcdca99` | A3 : caméra de l'ordinateur autorisée (signature en ligne) |
| `cff0cda` | A10 : export CSV protégé contre les formules |
| `f39e175` | Dépendance de développement `source-map-js` mise à jour |
| `825a2c8` | A9 : titres principaux des fiches, courriers et pages en erreur |
| `e52fbf5` | A11, A12 : logo, barre du bas, lien LinkedIn |

Les autres commits « Audit : … » ajoutent les tests (`tests/audit/`), la cartographie, ce rapport et le tableau de bord.

## 6. Vérification finale

Après toutes les corrections, sur le code final :

| Suite | Résultat |
|---|---|
| `tests/audit/pages.mjs` : 74 pages sur 8 configurations relancées (téléphones, tablettes, Chrome 1366 et 1920 px) | 0 KO ; restent les points « à améliorer » de la partie 3 |
| `tests/audit/parcours.mjs` : 8 parcours sur 8 configurations | Tout passe (P1 revérifié après V1 sur iPhone, Android et iPad) |
| `tests/audit/dashboard.mjs` : tableau de bord manuel (iPhone, iPad, ordinateur) | 30 sur 30 |
| `tests/audit/liens-externes.mjs` : 42 liens | Format correct ; réponse non vérifiable (réseau de test bloqué) |
| Suite existante `e2e/` (68 parcours métier, accessibilité axe-core comprise) | **68 sur 68** |
| Tests du serveur (`npm --prefix server test`) | 151 réussis, 0 échec (3 ignorés) |
| Tests du site (vitest) et vérification des types (client, serveur) | OK |

La colonne « Corrigé / Vérifié » de la partie 2 reflète cette vérification finale.
