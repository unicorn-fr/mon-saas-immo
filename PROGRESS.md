# Avancement de la refonte

Plan : `PLAN.md`. Rien n'est envoyé sur GitHub ni mis en ligne sans l'accord d'Enzo. Tout est sur la branche locale `claude/fervent-archimedes-chcxly`.

| Lot | État | Notes |
|---|---|---|
| Audit et plan | Fait | `PLAN.md`, `docs/strategie/fournisseurs-2026-11.md`, `docs/strategie/qalimo-analyse-2026-11-12.md` |
| L1 Design system v2 | Fait | Couleurs, polices (Bricolage Grotesque, Atkinson Hyperlegible Next), logo « fenêtre allumée », icônes, emails, plus d'italique ni d'étiquettes en capitales ; `docs/design/direction-artistique.md` |
| L2 Accueil | Fait | Immeuble vivant, prix selon le nombre de logements, de 20 à 13 sections |
| L3 Tableau de bord adaptatif | Fait | Question à la première connexion, vues Simple, Par logement, Patrimoine, Gestion pour d'autres ; migration locale `user_view_mode` |
| L4 Services tiers | Fait (simulé) | `server/src/providers/` : banque, signature, recommandé, paiement, annonces ; adaptateurs réels à écrire après les contrats |
| L5 Pages publiques | Fait | `/avis`, `/espace-locataire`, `/cgv` |
| L6 Fonctionnalités en plus | Fait | Fil d'actualité, prestataires, aide au départ du locataire ; emprunt déjà relié à la rentabilité |
| Captures et vidéo | Fait | `marketing/captures/fonctionnalites.mjs` refait les captures ; vidéo rendue à nouveau |
| Revue finale | Fait | Étiquette au-dessus du titre de `/fonctionnalites` retirée |

## Vérifications

- Tests unitaires : serveur 240, site 32, tous verts. Types : OK.
- Parcours dans le navigateur relancés : 01, 08, 12, 16 (accessibilité), 35 (garage), 45, 46, 47, 51, 52. Tous verts après correction.
- Pas relancée : la suite complète des 53 parcours (à faire avant tout envoi).

## Décisions en attente (Enzo)

- Prix : option B par défaut (3,49 € / 34,90 €), À VALIDER (`PLAN.md`, partie 8).
- Envoi sur GitHub et mise en ligne : la migration `user_view_mode` (ajout d'une colonne, sans perte) passera en production au démarrage.
- Agences : mandats et relevés de gérance (loi Hoguet, carte professionnelle) avant tout développement.
- Fournisseurs à souscrire : voir le rapport final et `server/.env.example`.
