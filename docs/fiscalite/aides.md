# Aides et dispositifs pour le propriétaire bailleur

Vérifié en octobre 2026. Chaque ligne indique « Vérifié » (lu sur la source officielle) ou « À vérifier ».
Règles codées dans `server/src/domain/aids.ts` (testé dans `aids.test.ts`). Bailio oriente : la décision revient
à l'organisme, et les simulateurs officiels font foi.

## Visale (Action Logement)

Source : service-public.gouv.fr, fiche F33453 (mise à jour le 23 janvier 2026).

| Règle | Statut |
|---|---|
| Garantie gratuite : loyers impayés pendant les 3 premières années du bail (nouvelle demande ensuite) | Vérifié |
| Dégradations locatives : au plus 2 mois de loyer et charges inscrits dans le bail | Vérifié |
| Locataire de 30 ans ou moins : éligible quelle que soit sa situation (étudiant, alternant, salarié…) | Vérifié |
| Plus de 30 ans : salarié du privé embauché ou muté depuis moins de 6 mois, ou salaire net ≤ 1 710 € par mois, ou promesse d'embauche de moins de 3 mois ; saisonniers | Vérifié |
| Loyer charges comprises garanti : 1 940 € en Île-de-France, 1 575 € dans les agglomérations de plus de 100 000 habitants, 1 365 € ailleurs | Vérifié (commune exacte : simulateur visale.fr) |
| Loyer au plus égal à la moitié des ressources du locataire (étudiants : règles propres) | Vérifié |
| Visa obtenu par le locataire avant la signature du bail ; pas de caution en plus | Vérifié |
| Locataire hors de la famille du bailleur (grands-parents, parents, enfants) | Vérifié |
| Agglomérations de plus de 100 000 habitants : liste non codée, Bailio indique « à vérifier » entre 1 365 € et 1 575 € | À vérifier |

## Rénovation énergétique

Source : Anah, « Les aides financières en 2026 », édition septembre 2026 (p. 11-19 et 39-40).

| Règle | Statut |
|---|---|
| MaPrimeRénov' rénovation d'ampleur : logement E, F ou G, plus de 15 ans, métropole, résidence principale | Vérifié |
| Gain d'au moins 2 classes, au moins 2 gestes d'isolation, Mon Accompagnateur Rénov' obligatoire | Vérifié |
| Rendez-vous France Rénov' obligatoire avant la demande ; demande avant les travaux | Vérifié |
| Bailleur : louer en résidence principale dans l'année et pendant 6 ans (1/6 de l'aide remboursé par année manquante) ; aide déduite d'une éventuelle hausse de loyer | Vérifié |
| Personnes morales (SCI, sociétés) et nus-propriétaires exclus de MaPrimeRénov' | Vérifié |
| Maison individuelle, depuis le 1er septembre 2026 : plus de chauffage au gaz ou au fioul conservé | Vérifié (non codé) |
| MaPrimeRénov' par geste : chauffage décarboné, ouvert aux bailleurs personnes physiques | Vérifié |
| Éco-prêt à taux zéro : jusqu'à 50 000 €, 20 ans au plus pour une rénovation globale ou MaPrimeRénov' ; société civile à l'IR avec un associé personne physique éligible | Vérifié |
| Montants de MaPrimeRénov' selon les revenus du foyer : non calculés par Bailio (simulateur France Rénov') | À vérifier |

## Loc'Avantages

Source : même guide Anah, p. 28-29.

| Règle | Statut |
|---|---|
| Réduction d'impôt de 15 % à 65 % des revenus bruts du logement, selon le niveau de loyer (Loc1, Loc2, Loc3) et l'intermédiation | Vérifié |
| Jusqu'au 31 décembre 2027 (`LOC_AVANTAGES_END`) | Vérifié |
| Location vide, en résidence principale, à un locataire aux ressources modestes hors de la famille, loyer plafonné par commune | Vérifié |
| Convention avec l'Anah pour 6 ans | Vérifié |
| Étiquette énergie : E au moins sans travaux, D après travaux aidés | Vérifié |
| Plafonds de loyer et de ressources : simulateur, non codés | À vérifier |

## Aide au logement versée au bailleur (tiers payant)

Source : CAF, « Guide du bailleur » et pages bailleurs des CAF.

| Règle | Statut |
|---|---|
| APL versée directement au bailleur ; allocation de logement aussi, à sa demande | Vérifié |
| Le bailleur déduit l'aide du loyer demandé au locataire | Vérifié |
| Impayé constitué : 3 mois de suite sans la part du locataire, ou dette égale à 2 mois de loyer et charges ; à signaler à la CAF dans les 3 mois | Vérifié |
| Signaler le départ du locataire ; rembourser ce qui a été versé à tort | Vérifié |
| Montant de l'aide sur les quittances : non géré par Bailio pour l'instant | À faire |
