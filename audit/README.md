# Audit de Bailio : mode d'emploi

Ce dossier réunit l'audit complet du site (fonctionnement, facilité d'utilisation, sécurité) et l'outil de test manuel.

| Fichier | Contenu |
|---|---|
| `AUDIT_PLAN.md` | Cartographie : arbre de navigation, rôles, liens, formulaires, parcours complets |
| `inventaire.md` | Chaque bouton, lien, champ, onglet et fenêtre, page par page (généré depuis le code) |
| `AUDIT_RAPPORT.md` | Rapport : résumé, anomalies par gravité et par appareil, corrections, points à valider |
| `resultats-tests.md` | Tableau de tous les éléments testés automatiquement (généré) |
| `anomalies/` | Captures d'écran des anomalies, nommées `appareil--page-element.jpg` |
| `dashboard-test.html` | Tableau de bord des tests manuels (un seul fichier, s'ouvre sans serveur) |

## Relancer les tests automatiques

Tout se passe **en local**, sur une base de test : jamais sur la production. Aucun vrai email ne part
(l'API locale, sans SMTP, écrit les emails dans son journal).

```bash
# 1. Base PostgreSQL de test, API et site locaux (voir e2e/README.md)
npm --prefix server run db:migrate
# Sans accès à internet, l'IRL de l'INSEE est remplacé par des valeurs de test :
NODE_OPTIONS="--import $PWD/tests/audit/insee-stub.mjs" RATE_LIMIT_SCALE=50 npm --prefix server run dev > /tmp/bailio-api.log 2>&1 &
npm --prefix client run dev &

# 2. Données de test (propriétaire, bail signé, liens publics), puis les tests
node tests/audit/seed.mjs
node tests/audit/pages.mjs          # chaque page × 12 appareils : affichage, liens et boutons cliqués, mise en page, accessibilité
node tests/audit/parcours.mjs       # parcours complets et formulaires (vides, invalides, longs, accents, emojis)
node tests/audit/liens-externes.mjs # chaque lien externe répond
node tests/audit/dashboard.mjs      # le tableau de bord manuel fonctionne
node tests/audit/rapport.mjs        # regroupe les résultats dans audit/resultats-tests.md
node tests/audit/inventaire.mjs > audit/inventaire.md
```

Options : `AUDIT_DEVICES=iphone-portrait,chrome-1366` (seulement ces appareils), `AUDIT_ROUTES=/espace/argent`
(seulement ces pages), `AUDIT_CLICKS=0` (sans cliquer liens et boutons, plus rapide), `CHROMIUM_PATH` (navigateur déjà installé).

Les 12 configurations : iPhone portrait et paysage, Android portrait et paysage, iPad portrait et paysage,
Chrome, Firefox et Safari en 1366 et 1920 px. Si WebKit (Safari) ou Firefox ne sont pas installés
(`npx --prefix e2e playwright install webkit firefox`), Chromium imite l'appareil (taille, écran tactile,
navigateur annoncé) et le rapport le signale.

Les parcours métier complets restent dans `e2e/` (`npm --prefix e2e test`).

## Le tableau de bord manuel

Ouvrez `audit/dashboard-test.html` dans un navigateur (sur téléphone : envoyez-vous le fichier, puis ouvrez-le
avec Safari ou Chrome). Le mode d'emploi est en haut de la page. À la fin, « Exporter mes retours » télécharge
`retours-test.json` (à transmettre) et `retours-test.md` (lisible).

## Étape 5 : quand vous me rendez `retours-test.json`

Déposez le fichier dans `audit/` (ou collez son contenu dans la conversation), puis demandez :
« voici mes retours, applique l'étape 5 ». Voici ce que je ferai, dans cet ordre :

1. **Lire tous les retours** : chaque test marqué *Bug* ou *À améliorer*, sur chaque appareil, avec son commentaire et
   sa capture, et chaque remarque libre. Je vous présente d'abord **la liste de ce que je vais corriger, classée par
   gravité** (Bloquant, Majeur, Mineur, Cosmétique), avec l'appareil concerné.
2. **Corriger** chaque bug et chaque modification demandée, en suivant les règles de l'étape 3 :
   - d'abord ce qui empêche d'aller au bout d'un parcours ;
   - une correction = un commit avec un message clair ;
   - après chaque correction, les tests concernés sont relancés sur les 12 configurations ;
   - **tout changement de design, de fonctionnalité ou de texte important vous est d'abord soumis** : je l'applique
     seulement après votre accord.
3. **Relancer tous les tests automatiques** (`pages.mjs`, `parcours.mjs`, `liens-externes.mjs`, `dashboard.mjs`, puis
   la suite `e2e/`) sur tous les appareils, et mettre à jour `AUDIT_RAPPORT.md` (colonne « Corrigé / Vérifié »).
4. **Mettre à jour le tableau de bord** :
   - ajout de tests pour toute nouvelle fonctionnalité ;
   - chaque test corrigé repasse en *Pas testé* pour l'appareil concerné, pour que vous le revérifiiez. Concrètement,
     je produis un fichier `retours-test.json` mis à jour (vos autres réponses gardées) que vous importez avec le
     bouton « Importer » (choix « Remplacer »), ou je vous indique les numéros à refaire. Les tests sont retrouvés par
     leur titre si leur numéro change.
5. **Récapitulatif** : ce qui a été corrigé (avec les commits), ce qui attend votre validation, et la liste précise
   des tests à refaire, par appareil.

Pour me faciliter le travail : un commentaire par problème, la page concernée, ce que vous attendiez, et une capture
quand c'est visuel.
