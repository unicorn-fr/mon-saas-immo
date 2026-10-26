# Préparer le dépôt de la déclaration (fiche « Préparer votre dépôt »)

> Code : `server/src/domain/taxFiling.ts` (testé dans `taxFiling.test.ts`), PDF `server/src/pdf/taxFiling.tsx`,
> `GET /money/tax` (champs `filing` et `contacts`), `GET /money/tax/fiche.pdf?year=`, carte « Préparer votre dépôt »
> de `/espace/argent/declaration`. Test de bout en bout : `e2e/tests/33-fiche-depot.test.mjs`.
> Bailio ne dépose rien. Statut : **Vérifié** (source officielle relue le 19 octobre 2026) ou **À vérifier**.
> Les sites officiels ne sont pas joignables depuis l'environnement de développement : les vérifications ont été faites
> par la recherche web, sur les pages impots.gouv.fr, service-public.gouv.fr et BOFiP citées.

## Situations et ce que la fiche indique

| Situation | Formulaire, case | Date | Statut |
|---|---|---|---|
| Vide, micro-foncier | 2042, case 4BE, loyers hors charges ; 30 % retirés par l'administration | Déclaration en ligne selon le département (`DECLARATION_DATES`) | Vérifié |
| Vide, réel | 2044 (lignes 211 à 250), report 4BA / 4BB / 4BC ; option pour trois ans, globale, par le simple dépôt de la 2044 | idem | Vérifié (BOFiP BOI-RFPI-DECLA-10) |
| Meublé, micro-BIC | 2042-C-PRO, « Revenus des locations meublées non professionnelles », case 5NI (5OI) | idem | Vérifié |
| Meublé, réel | Liasse 2031 (et 2033) en ligne, puis 5NA / 5NY ; option au plus tard à la date de dépôt de la déclaration de l'année précédente | 2e jour ouvré de mai + 15 jours (`resultDeadline`) | Vérifié (BOI-BIC-DECLA-10-30) |
| Début en meublé | Déclaration de début d'activité sur le guichet unique de l'INPI dans les 15 jours, SIRET ; CFE : 1447-C-SD | CFE avant le 31 décembre de la première année | Vérifié (impots.gouv.fr, FAQ LMNP mars 2026) ; délai de la notice 1447-C 2026 À vérifier |
| CFE | Avis dans l'espace professionnel, paiement au 15 décembre, exonération sous 5 000 € de recettes | | Vérifié |
| Occupation | « Gérer mes biens immobiliers », dès que l'occupant change, au plus tard le 30 juin ; 150 € par local (CGI art. 1770 terdecies) ; papier 1208-OD-SD | | Vérifié |
| SCI à l'IR | Espace professionnel (SIREN, code d'activation par courrier), « Déclarer » puis « Revenus SCI non soumises IS », 2072-S en mode simplifié ; associés : 4BA ou paragraphe 110 de la 2044 | `resultDeadline` | Vérifié |
| Société à l'IR, IS | 2031 ou 2065 + liasse par l'expert-comptable (EDI) | `resultDeadline` | Vérifié dans son principe |

## Cases à recopier et formulaires pré-remplis (octobre 2026)

> Code : `server/src/domain/taxForms.ts` (`copyPlan`, testé dans `taxForms.test.ts`), `server/src/services/taxForms.ts`
> (formulaires officiels remplis, testé dans `src/pdf/officialForms.test.ts`), fichiers vierges dans `server/assets/forms`,
> `GET /money/tax` (champs `copy` et `forms`), `GET /money/tax/2044.pdf?year=`, `GET /money/tax/1447-c-sd.pdf?propertyId=`.

| Élément | Source relue | Statut |
|---|---|---|
| 2044 : lignes 211 à 263 par immeuble (8 colonnes), totaux E, F, G, I ; 420 résultat ; 431 à 442 répartition du déficit | Formulaire et notice 2044 de 2026 (revenus 2025), impots.gouv.fr, fichiers `2044_5483.pdf` et `2044_5487.pdf` | Vérifié |
| Déficit : 4BC = part imputable sur le revenu global (ligne 436 ou 441) ; 4BB = part reportée de l'année (ligne 439 ou 442) ; 4BD = déficits antérieurs (ligne 451) | Notice 2044 de 2026, paragraphes 430 à 450 | Vérifié, corrige l'ancienne mention « 4BD » |
| 2042-C-PRO : micro-BIC « autres locations meublées » 5NI / 5OI / 5PI ; tourisme classé 5NG ; non classé 5NH ; réel 5NA, déficit 5NY | Brochure pratique IR 2026, page « 2042 C PRO » | Vérifié |
| Plafond micro-BIC : 77 700 € (revenus 2025), 83 600 € (revenus 2026 à 2028) | BOFiP (revalorisation triennale, loi de finances pour 2026) | Vérifié par la recherche, à revoir en 2029 |
| Montants en euros entiers (« N'inscrivez pas les centimes ») | Formulaire 2044 | Vérifié |
| 1447-C-SD (CFE 2027, création en 2026) : champs a1 (département), a2 (commune), a5 (nom), a6 (activité), a7 (adresse), a8 (adresse de l'avis), a9 (SIRET, 14 chiffres), a10 (NACE, 5 caractères : 6820A), cac2 (création d'établissement), date1, b14 (recettes estimées), c1 à c11 (le bien), cac8 n° 1 (propriétaire), cac11 n° 3 (autre local loué meublé) | Formulaire `1447-c-sd_5568.pdf`, champs relevés un à un | Vérifié ; le SIRET reste à saisir par le propriétaire |
| 2044 pré-remplie : écrite aux coordonnées des cases (formulaire sans champs) | Relevé sur l'édition 2026 | À refaire à chaque nouvelle édition (avril) |

Gestion par une agence : le propriétaire déclare lui-même ; loyers bruts (avant honoraires) ligne 211 ou case 4BE, honoraires de gestion ligne 221 (« rémunérations, honoraires et commissions versées à un tiers », formulaire 2044). Vérifié sur le libellé de la ligne 221.

## Contacts

| Contact | Statut |
|---|---|
| Pas d'adresse email publique : messagerie sécurisée de l'espace particulier ou professionnel | Vérifié |
| 0 809 401 401, particuliers, lundi au vendredi 8 h 30 à 19 h, service gratuit + prix d'un appel | Vérifié (impots.gouv.fr/contacts) |
| 0 806 807 807, numéro national des entreprises depuis le 8 octobre 2026 | Vérifié (impots.gouv.fr/contacts) |
| 0 809 400 210, assistance technique de l'espace professionnel (horaires différents selon les pages) | Vérifié ; horaires À vérifier |

## Liens (`LINKS`, tous en https sur impots.gouv.fr ou procedures.inpi.fr, testé)

- https://www.impots.gouv.fr/particulier/les-locations-meublees
- https://www.impots.gouv.fr/particulier/les-regimes-dimposition
- https://www.impots.gouv.fr/particulier/questions/si-je-mets-en-location-un-meuble-dois-je-minscrire-au-greffe-du-tribunal-de
- https://www.impots.gouv.fr/sites/default/files/media/1_metier/5_international/actualite/faq-lmnp-03_2026.pdf
- https://www.impots.gouv.fr/formulaire/1447-c-sd/declaration-initiale-de-cotisation-fonciere-des-entreprises
- https://www.impots.gouv.fr/formulaire/1208-od-sd/declaration-doccupation-des-locaux-par-le-proprietaire
- https://www.impots.gouv.fr/professionnel/questions/comment-declarer-les-resultats-de-ma-sci
- https://www.impots.gouv.fr/sites/default/files/media/1_metier/1_particulier/EV/5_patrimoine_logement/550_invest_location_nue/teledeclaration_sci-pas_a_pas.pdf
- https://www.impots.gouv.fr/contacts
- https://procedures.inpi.fr/

## À revoir chaque année

- Dates de la déclaration en ligne (`DECLARATION_DATES`, `fiscalCalendar.ts`) dès leur publication en avril.
- Liens des notices millésimées (2044, 2072-S, 2072-C) : l'adresse change chaque année.
- Seuils (15 000 €, 77 700 € puis 83 600 €, 23 000 €, 5 000 € de CFE) à chaque loi de finances.
- Fichiers vierges de `server/assets/forms` (2044, 1447-C-SD) et coordonnées de la 2044 dans `services/taxForms.ts` dès la nouvelle édition.
