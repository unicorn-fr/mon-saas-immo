# Bailio : rapport d'audit (octobre 2026)

> Fonctionnement, facilité d'utilisation et sécurité, sur smartphone, tablette et ordinateur.
> Cartographie : [`AUDIT_PLAN.md`](AUDIT_PLAN.md) · tableau complet de chaque élément testé : [`resultats-tests.md`](resultats-tests.md) · captures : [`anomalies/`](anomalies/).

## 1. Résumé

__RESUME__

### Conditions des tests

- **En local uniquement**, sur une base PostgreSQL de test, avec des comptes créés pour l'audit (`tests/audit/seed.mjs`). Jamais la production.
- **Aucun vrai email** : l'API locale, sans service d'envoi, écrit les emails (liens de connexion, codes, quittances) dans son journal, où les tests les relisent. Aucun SMS, aucun paiement.
- **12 configurations** : iPhone et Android en portrait et paysage, iPad en portrait et paysage, Chrome, Firefox et Safari en 1366 et 1920 px.
- **Limite de l'environnement** : le réseau de la machine de test bloque le téléchargement des navigateurs WebKit (Safari) et Firefox (`cdn.playwright.dev`). Chromium a donc imité chaque appareil : taille d'écran, écran tactile, navigateur annoncé, densité de pixels. Les différences propres au moteur de Safari ou de Firefox (rendu des polices, saisie de date) sont à vérifier à la main avec le tableau de bord. Pour lever cette limite, il suffit d'autoriser `cdn.playwright.dev` dans les réglages réseau de l'environnement.
- Firefox et Safari ordinateur, qui passent ici aussi par Chromium, ont été testés au premier passage (0 anomalie, comme Chrome). Ils n'ont pas été relancés au passage final, pour gagner du temps.
- **INSEE bloqué** : l'indice IRL est remplacé par des valeurs de test (`tests/audit/insee-stub.mjs`). Les échecs de la suite `e2e/` existante (« Il manque encore : révision ») venaient de là, pas du site.
- **Liens externes** : presque tous les sites externes sont bloqués par le réseau de test. Leur format est vérifié automatiquement ; leur réponse est à vérifier à la main (tableau de bord, groupe 1).

### Ce qui a été testé, sur chaque configuration

- **Chaque page** (77 adresses, publiques, protégées, liens reçus par email, liens invalides, 404) : accès direct, code HTTP, page blanche, rafraîchissement, temps de chargement, erreurs JavaScript et réseau, images, textes oubliés, défilement horizontal, éléments coupés, cibles tactiles, taille des champs, survol, lisibilité, clavier mobile, accessibilité WCAG 2.1 AA (axe-core : contrastes, intitulés, textes alternatifs).
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

- **A1** : Accueil → « Créer mon bail » → « Vide » → collez 200 caractères dans « Bâtiment, étage, porte » → l'indicateur en haut affiche « Non enregistré » → continuez jusqu'à l'étape 5, rechargez : les informations saisies depuis sont perdues. Capture : [`anomalies/`](anomalies/) (iPhone, étape 5).
- **A2** : Déconnecté, ouvrez `/espace/argent` → connexion → ouvrez le lien de l'email dans un nouvel onglet → arrivée sur `/espace` au lieu de `/espace/argent`.
- **A3** : En production, signez un document depuis un ordinateur → « Utiliser la caméra de l'ordinateur » → message « La caméra n'est pas accessible ».
- **A4** : Sur téléphone, cherchez le carnet depuis n'importe quelle page de l'espace : aucun lien.
- **A5** : iPad portrait, ouvrez `/mentions-legales` → la page défile de côté, « Contact » est coupé.
- **A6** : Sur téléphone, page d'un bail → le fil d'Ariane « Logements / Studio » fait 18 px de haut.

## 3. Points en attente de votre validation

Ces changements touchent le design ou une fonctionnalité. Je ne les ai pas appliqués :

1. **Accueil sur téléphone** : le bouton « Créer mon bail » est juste sous le bas de l'écran (iPhone portrait : 677 px pour 664 px visibles ; téléphones en paysage : nettement plus bas). Proposition : le remonter (texte d'introduction plus court) ou ajouter « Créer mon bail » dans l'en-tête de l'accueil sur téléphone.
2. **Textes de 12 px** sur téléphone (pastilles, mentions sous les champs, dates). Ils sont lisibles et contrastés, mais en dessous des 16 px demandés pour le corps du texte. Proposition : passer les textes de 12 px à 13-14 px. C'est un changement de style global.
3. **Cibles de 24 à 44 px** encore présentes (onglets, filtres en pastilles de « Documents », onglets du logement). Elles respectent le minimum WCAG (24 px), mais pas les 44 px idéaux. Les agrandir change leur apparence (pastilles plus hautes).
4. **IRL quand l'INSEE ne répond pas** : le bail est créé sans trimestre de référence, et la signature est refusée (« Il manque encore : révision ») jusqu'à ce que le propriétaire le choisisse dans le contrat. Proposition : garder en base le dernier IRL connu et le proposer automatiquement.
5. **Outil de test du site (vitest)** : `npm audit` signale une faille critique dans `tinypool`, utilisé seulement pour lancer les tests en développement, jamais en production. La correction demande une version majeure de vitest (3 → 5). Je propose de la faire dans une modification à part.

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
| Dépendances (`npm audit --omit=dev`) | ✅ 0 faille en production pour le serveur et le site. Outils de développement : `source-map-js` mis à jour (`f39e175`) ; vitest, voir point 3.5. |

Pistes, sans urgence : le jeton de session est gardé dans le stockage du navigateur (la CSP stricte limite le risque) ; l'import de baux (OCR) a une file d'attente, mais pas de taille maximale.

## 5. Corrections faites (commits)

Branche `claude/busy-babbage-2maznh` : un commit par correction.

__COMMITS__

## 6. Vérification finale

__FINAL__
