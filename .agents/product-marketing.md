# Product Marketing Context

Document version: v1
Lu par toutes les skills marketing (`.claude/skills/`). Tiré du code et de CLAUDE.md : ce qui est écrit ici existe vraiment dans Bailio.

## Product Overview

- **Bailio** (https://bailio.fr) : le bail et le suivi locatif du propriétaire bailleur particulier, en France.
- Bail conforme au contrat type (décret n° 2015-587, rédaction du 6 juillet 2026), vide, meublé ou garage ; signature électronique ; états des lieux d'entrée et de sortie comparés ; quittances automatiques ; révision du loyer (IRL) ; courriers prêts (relance, congé, dépôt de garantie) ; annonce et candidats (pièces filigranées contre les fausses annonces) ; aide à la déclaration des revenus fonciers (cases à recopier, 2044 pré-remplie) ; rappels des échéances.
- Prix : premier bail gratuit, sans carte bancaire ; suivi 9,99 € par mois, sans engagement, offert pendant le lancement (`client/src/config.ts`, à vérifier avant chaque publication).
- Données hébergées en Suisse (Infomaniak), aucun cookie, aucune publicité, aucune donnée envoyée à un service d'IA.

## Target Audience

- Propriétaires particuliers qui louent eux-mêmes 1 à 5 logements, sans agence (pour économiser les frais de gestion, 6 à 10 % des loyers en agence en général).
- Nouveaux bailleurs (premier investissement locatif, héritage, logement gardé après un déménagement) qui ont peur de « mal faire ».
- Investisseurs en location meublée (LMNP) perdus dans la fiscalité.

## Personas

B2C : pas de comité d'achat. Le propriétaire décide seul (parfois avec son conjoint ou ses co-indivisaires).

## Problems & Pain Points

- Peur de l'erreur juridique : bail non conforme, dépôt de garantie trop élevé, congé envoyé trop tard, logement F ou G loué alors qu'il est interdit.
- Paperasse répétitive : quittances chaque mois, révision du loyer, relances.
- Impayés et litiges à la sortie (dépôt de garantie, dégradations, usure normale).
- Déclaration des revenus fonciers incompréhensible (micro-foncier, réel, 2044, LMNP).
- Arnaques aux fausses annonces avec de vrais documents volés.

## Competitive Landscape

- Agences immobilières (gestion locative payante en pourcentage des loyers).
- Logiciels de gestion locative en ligne pour particuliers (plusieurs acteurs français, à analyser avec la skill competitor-profiling avant toute comparaison publique).
- Modèles de bail gratuits téléchargés et tableurs faits maison.
Règle : jamais de comparaison chiffrée ou nominative publiée sans source vérifiée et datée.

## Differentiation

- Les règles de la loi sont vérifiées par le site (dépôt maximum, durée, DPE, encadrement des loyers, diagnostics expirés) : le propriétaire ne peut pas se tromper sans être prévenu.
- Une question à la fois, zéro jargon, vouvoiement.
- Rien à ressaisir : chaque information sert partout.
- Respect de la vie privée : sans cookie, données en Suisse, pièces des candidats filigranées.

## Objections

- « C'est compliqué, je ne suis pas à l'aise avec l'informatique » → une question à la fois, premier bail gratuit sans carte.
- « Un modèle gratuit suffit » → le modèle ne vérifie rien (DPE, plafonds, délais) et ne fait ni quittances ni rappels.
- « Mes données ? » → Suisse, sans cookie, sans IA, sans publicité.

## Switching Dynamics

- Déclencheurs : nouveau locataire, fin de bail, impayé, période de déclaration (avril à juin), révision annuelle, nouvelle loi (DPE, encadrement).
- Habitude : tableur, agence, papier. Peur : perdre du temps à tout ressaisir (d'où l'import d'un bail signé).

## Customer Language

« mon locataire ne paie plus », « je loue mon appartement », « bail meublé ou vide », « caution » (pour dépôt de garantie), « état des lieux », « quittance de loyer », « augmenter le loyer », « congé pour vendre », « LMNP », « déclarer mes loyers ».

## Brand Voice

- Français, vouvoiement, phrases courtes, bienveillant et rassurant, jamais moralisateur.
- Tout terme juridique expliqué en une ligne. Pas d'anglicismes inutiles, pas de jargon technique.
- Social : direct, concret, une règle par vidéo, chiffres exacts et sourcés (service-public.fr, Légifrance).

## Proof Points

- Règles codées et testées (loi n° 89-462 du 6 juillet 1989, décret n° 2015-587).
- Guides sourcés : https://bailio.fr/guides.
- Pas encore de témoignages publiés : n'en inventer aucun.

## Goals

- Objectif : 1 000 abonnés sur chaque réseau d'ici fin janvier 2027 (TikTok, Instagram, Facebook, YouTube et Shorts, LinkedIn, X, Pinterest).
- Trafic : visites de bailio.fr par réseau (`utm_source`, page Pilotage) ; conversion : comptes créés et baux commencés.

## Paid Ads (optional)

Aucune publicité payante pour l'instant.

## Learnings

À compléter chaque semaine par l'analyse des statistiques (ce qui marche, ce qui ne marche pas, avec les chiffres).

## Changelog

- v1 (2026-10-30) — Contexte initial, tiré du code et de CLAUDE.md.
