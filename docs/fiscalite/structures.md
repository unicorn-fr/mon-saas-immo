# Fiches juridiques et fiscales par structure (étape 0)

> Base de l'étape 1 (structures de détention) et de l'étape 4 (aide à la déclaration par structure).
> Bailio ne dépose rien : il prépare une fiche « aide à vérifier », le propriétaire reste responsable de sa déclaration.
> Statut de chaque ligne : **Vérifié** (source officielle relue en octobre 2026) ou **À vérifier** (à relire avant d'être codé).

## 1. Règles du bail selon le bailleur (loi n° 89-462 du 6 juillet 1989)

| Bailleur | Bail vide | Bail meublé | Congé pour reprise (habiter) | Statut |
|---|---|---|---|---|
| Personne seule, couple, indivision de personnes | 3 ans minimum (art. 10) ; 1 à 3 ans si événement familial ou professionnel précis (art. 11) | 1 an (art. 25-7), 9 mois étudiant | Oui, au profit du bailleur, de son conjoint, partenaire de Pacs, concubin notoire, ascendants, descendants (art. 15) | Vérifié |
| SCI familiale (associés parents et alliés jusqu'au 4e degré inclus) | 3 ans, comme un particulier (art. 13) | 1 an | Oui, mais **seulement au profit d'un associé** (Cass., appliqué strictement) | Vérifié |
| SCI non familiale, SARL, SAS, autre personne morale | **6 ans** minimum (art. 10), pas de durée réduite | 1 an | **Non** : congé seulement pour vendre ou motif légitime et sérieux | Vérifié |
| Usufruitier et nu-propriétaire (démembrement) | Le bail est consenti par l'usufruitier ; durée selon sa nature (personne ou société) | idem | Selon l'usufruitier | À vérifier |

Délais de congé du bailleur : 6 mois avant l'échéance en vide, 3 mois en meublé (déjà codé).
Dépôt de garantie rendu sous 1 mois si l'état des lieux de sortie est conforme à l'entrée, 2 mois sinon, à compter de la remise des clés ; 10 % du loyer mensuel hors charges par mois de retard commencé (art. 22). Vérifié.

Déjà dans le code : `isLegalPerson`, `leaseDurationMonths` (`server/src/domain/rules.ts`), profil `kind` = PERSON, COUPLE, SCI (+ `sciFamily`), COMPANY. Écart relevé : le tunnel public (`services/leases.ts`) prend toujours 3 ans ; sans effet aujourd'hui (le tunnel ne crée que des baux de particuliers), à aligner à l'étape 1.

Sources :
- ANIL, durée du bail : https://www.anil.org/faq/details/quelle-est-la-duree-du-bail/
- ANIL, congé pour reprise d'une SCI familiale (associés uniquement) : https://www.anil.org/documentation-experte/analyses-juridiques-jurisprudence/jurisprudence/jurisprudence-2005/loi-de-89-/-conge-pour-reprise-/sci-/-beneficiaires-/-associes-uniquement-/-ascendant/
- Service-public, dépôt de garantie : https://www.service-public.gouv.fr/particuliers/vosdroits/F39713/0 et /F39713/1
- Service-public, congé du bailleur : https://www.service-public.gouv.fr/particuliers/vosdroits/F929

## 2. Fiscalité par structure

### 2.1 En nom propre, location vide (revenus fonciers)

| Régime | Condition | Où déclarer | Statut |
|---|---|---|---|
| Micro-foncier | Loyers bruts du foyer ≤ 15 000 €, abattement 30 % | 2042, case 4BE | Vérifié (déjà codé) |
| Réel | Sur option (3 ans) ou obligatoire au-delà de 15 000 € | 2044, lignes 211 à 250, report 4BA / 4BB / 4BC / 4BD | Vérifié (déjà codé) |
| Déficit foncier | 10 700 € sur le revenu global (21 400 € pour la rénovation énergétique 2023-2027), reste reporté 10 ans | 4BC, 4BD | Vérifié (déjà codé) |

Source : service-public F1991 ; brochure pratique IR 2026 (impots.gouv.fr).

### 2.2 En nom propre, location meublée (BIC)

| Régime | Condition | Où déclarer | Statut |
|---|---|---|---|
| Micro-BIC, location longue durée | Recettes ≤ 77 700 €, abattement 50 % (minimum 305 €) | 2042-C-PRO, **case 5NI** (5OI second déclarant, 5PI personne à charge) | Vérifié, corrigé le 5 octobre 2026 (avant : 5ND, faux) |
| Micro-BIC, meublé de tourisme non classé | Recettes ≤ 15 000 €, abattement 30 % | 5NH | Vérifié (hors périmètre aujourd'hui) |
| Micro-BIC, meublé de tourisme classé, chambres d'hôtes | | 5NG | Vérifié (hors périmètre aujourd'hui) |
| Réel (LMNP) | Sur option, ou obligatoire après deux années de suite au-delà du seuil | Liasse 2031 + 2033 (expert-comptable ou logiciel agréé), résultat en **5NA** (bénéfice) ou **5NY** (déficit) | Vérifié |
| Déficit LMNP | Imputable seulement sur les bénéfices de location meublée, pendant 10 ans | 5GA à 5GJ (déficits antérieurs) | Vérifié |
| LMP (professionnel) | Recettes meublées du foyer > 23 000 € **et** supérieures aux autres revenus d'activité du foyer (CGI art. 155, IV) ; affiliation à la sécurité sociale des indépendants au-delà de 23 000 € | Mêmes formulaires, déficit imputable sur le revenu global | Vérifié (critères) ; régime social détaillé À vérifier |

Source : brochure pratique IR 2026, chapitre « Revenus non salariaux » (impots.gouv.fr) ; service-public F32744.

### 2.3 Indivision et couple

- Indivision : pas de déclaration propre. Chaque indivisaire déclare **sa quote-part** des loyers et des charges (2044 ou micro-foncier ; en meublé, sa part en BIC). Vérifié.
- Couple marié ou pacsé : une seule déclaration du foyer ; les seuils (15 000 €, 77 700 €, 23 000 €) s'apprécient pour le foyer. Vérifié.
- Indivision en meublé : chaque indivisaire est loueur en meublé pour sa part. À vérifier (règles d'option au réel par indivisaire).

### 2.4 SCI à l'impôt sur le revenu (location vide)

- La SCI dépose la **2072-S-SD** (simplifiée) ou **2072-C-SD** (complète) ; elle indique la part de chaque associé. Vérifié.
- Chaque associé reporte sa part sur sa **2044** (revenus fonciers). Vérifié.
- Micro-foncier pour un associé : seulement s'il possède aussi en direct au moins un logement loué nu ; le plafond de 15 000 € porte sur l'ensemble de ses revenus fonciers bruts (BOFiP BOI-RFPI-DECLA-10). Vérifié.
- Date limite : 2e jour ouvré après le 1er mai, plus 15 jours en ligne (impots.gouv.fr). Vérifié pour 2026 ; à reprendre chaque année.
- Une SCI à l'IR qui loue en meublé de façon habituelle devient passible de l'IS. À vérifier (seuil de tolérance de 10 % des recettes).

### 2.5 SCI ou société à l'impôt sur les sociétés

- Déclaration de résultat **2065** avec la liasse (2033 au régime simplifié). Vérifié.
- Amortissement du bâtiment, impôt sur les sociétés sur le bénéfice ; les associés ne déclarent que les dividendes reçus. Vérifié dans son principe ; taux de l'IS et plus-value à la vente À vérifier avant tout calcul.
- Bailio : fiche de synthèse seulement (loyers, charges, intérêts par année), la liasse reste à l'expert-comptable.

### 2.6 SARL de famille

- Option pour l'impôt sur le revenu sans limite de durée (CGI art. 239 bis AA) ; activité de location meublée en BIC. Vérifié.
- La société dépose la 2031 ; chaque associé reporte sa part en BIC (5NA / 5NY). À vérifier (cases exactes pour un associé).

### 2.7 Démembrement (usufruit et nue-propriété)

- L'usufruitier perçoit les loyers et les déclare ; le nu-propriétaire peut déduire certains gros travaux qu'il paie. À vérifier entièrement avant de coder.

## 3. Dispositifs fiscaux, à ajouter « par-dessus » une structure

| Dispositif | Ce qu'il change | Statut |
|---|---|---|
| Statut du bailleur privé (« Jeanbrun ») | Amortissement de 3,5 % à 5,5 % par an, location nue, logement collectif, engagement de 9 ans, du 21 février 2026 au 31 décembre 2028 | À revérifier (texte d'application et cases) |
| Loc'Avantages | Réduction d'impôt contre un loyer plafonné et une convention avec l'Anah, jusqu'au 31 décembre 2027 | À vérifier |
| Pinel, Denormandie | Réduction d'impôt pour les engagements en cours | À vérifier |

## 4. Ce que l'étape 1 en tirera

- Fiche « Structure » : nom, type (personne seule, couple, indivision, SCI familiale, SCI, SARL de famille, autre société), régime (IR, IS), associés et parts, SIREN.
- Chaque logement appartient à une structure (liste déroulante à la création, ou « Créer une nouvelle structure ») ; la première est créée à l'inscription à partir du profil actuel.
- Le bail reprend le bailleur de la structure : durée (3 ou 6 ans), congé pour reprise permis ou non, mention dans le PDF.
- Tests : `lease.test.ts` (durées, congé), puis `tax.test.ts` par structure à l'étape 4.
