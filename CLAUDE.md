# CLAUDE.md — Bailio

> Bailio repart de zéro (septembre 2026). La maquette de référence est `docs/maquette/bailio-refonte-proprietaire.html`.
> Produit : le bail et le suivi locatif du **propriétaire bailleur particulier**. Pas d'espace locataire.

## Stack

| Couche | Techno |
|---|---|
| Client | React 19, Vite 7, TypeScript strict, React Router 7 (`client/`) |
| État | Contextes légers : `lib/auth.tsx` (session), `lib/draft.tsx` (brouillon du tunnel, enregistrement auto) |
| Style | Styles inline avec les tokens `BAI` ; `src/styles.css` pour la mise en page responsive uniquement |
| API | Express 5 + TypeScript (ESM), Zod 4 (`server/`) |
| Base | Prisma 6 + PostgreSQL, **migrations versionnées** (`prisma migrate`) |
| PDF | `@react-pdf/renderer`, côté serveur (`server/src/pdf/`) |
| Emails | SMTP authentifié de la messagerie Ionos de bailio.fr, port 587 (`lib/email.ts`, nouvel essai après une erreur passagère), sinon affichage dans les logs. Le VPS Lite ne peut pas envoyer seul (port 25 sortant fermé par Infomaniak). DNS : SPF `include:_spf-eu.ionos.com`, DKIM `s1-ionos`/`s2-ionos`, DMARC. `/health` indique le service utilisé (`email: smtp`, `resend` ou `none`). Resend (États-Unis) reste en secours tant que le SMTP n'est pas renseigné sur le VPS ; à retirer ensuite (code, dépendance, ligne de `/confidentialite`, DNS `resend._domainkey` et `send`) |
| Auth | Sans mot de passe : lien magique par email uniquement. Session = jeton aléatoire (empreinte en base), en-tête `Authorization: Bearer`, fermée après 30 jours sans activité. Appareils connectés visibles et déconnectables dans « Mon compte ». Export des données et suppression du compte confirmés par un code à 6 chiffres envoyé par email (`ActionCode`) |
| Import de baux | Sur le serveur uniquement : Tesseract (OCR, `fra`) + poppler + `sharp` (redressement, éclairage), puis règles (`services/import/parse.ts`). Aucune donnée envoyée à un service d'IA |
| Hébergement | Site : Vercel (bailio.fr), qui relaie `/api` vers `api.bailio.eu`. API + PostgreSQL + Caddy (HTTPS) : VPS Infomaniak (`deploy/vps`), mis à jour automatiquement toutes les 5 minutes depuis la branche `production` (`auto-update.sh`), que GitHub Actions avance seulement quand tous les tests passent sur `main` (`.github/workflows/ci.yml`). Vercel publie aussi la branche `production` (réglage « Production Branch »). Dépendances : Dependabot chaque semaine (`.github/dependabot.yml`), `npm audit` en CI. Version en ligne : `https://api.bailio.eu/health` |

## Règles de design (maquette)

- Toute couleur vient de `BAI` (`client/src/constants/bailio-tokens.ts`). Aucune couleur hexadécimale dans les composants.
- Titres : Cormorant Garamond, italique, 700 (`display()` dans `components/ui.tsx`). Corps : DM Sans.
- Fond crème `BAI.bg`, encre `BAI.ink`, action principale bleu `BAI.owner`, accent `BAI.caramel`, validé `BAI.green`.
- Une seule action principale par écran. Champs de 60 px de haut, rayon 14 px.
- Mobile d'abord : `clamp()` pour les tailles, classes `.col-md`, `.hide-md`, `.grid-*` pour les ruptures.
- Accessibilité (RGAA 4.1 / WCAG 2.1 AA), contrôlée par axe-core sur toutes les pages (`e2e/tests/16-accessibilite.test.mjs`) :
  - texte ≥ 4,5:1 : `BAI.caramel` seulement sur fond sombre (`night`), sur fond clair `BAI.caramelInk` ;
  - bord des champs et boutons à choix `BAI.borderStrong` (≥ 3:1) ;
  - jamais d'`opacity` pour estomper un texte (étape verrouillée : fond `BAI.bg` et bord pointillé) ; seuls les boutons et champs désactivés peuvent l'être ;
  - chaque champ a un intitulé (`hideLabel` pour les lignes répétées d'une liste) ; chaque image un `alt` ; icônes `aria-hidden` ;
  - lien « Aller au contenu » (`SkipLink`, `App.tsx`) et contour de focus bleu cerclé de crème (`styles.css`).

## Pages légales (`client/src/pages/legal/Legal.tsx`)

- `/mentions-legales` (LCEN art. 6-III : coordonnées de l'éditeur dans `EDITOR`, `config.ts`, affichées dès qu'elles sont renseignées), `/conditions` (CGU, acceptées à la création de l'espace), `/confidentialite` (RGPD art. 13 : bases légales, prestataires et garanties, durées, droits), `/cookies`, `/prix-et-remboursement` (rétractation 14 jours L221-18, remboursement L221-24, résiliation en ligne L215-1-1), `/accessibilite`.
- Aucun cookie ni traceur : seul le stockage strictement nécessaire (`bailio.session`, `bailio.draft`, `bailio.boot`, `bailio.recover`, `bailio.space`), exempté de consentement (loi 78-17 art. 82) : pas de bandeau. Tout nouvel outil tiers (mesure d'audience, police, script externe) exige d'abord un consentement et une mise à jour de `/cookies`.
- Avant toute offre payante : désigner un médiateur de la consommation (`MEDIATOR`, `config.ts`, L612-1), ajouter le bouton de résiliation et de rétractation dans « Mon compte ». Plus de lien vers la plateforme européenne RLL (fermée le 20 juillet 2025).
- Tout nouveau prestataire ou nouvelle donnée collectée : mettre à jour les tableaux de `/confidentialite` et la date `UPDATED`.
- Chaque page a son titre d'onglet, repris de son h1 (`PageTitle`, `App.tsx`).
- Information au moment de la collecte (RGPD art. 13, `components/DataNotice.tsx`) : `AccountNotice` sous chaque création d'espace (vaut acceptation des CGU), `ThirdPartyNotice` sous les formulaires du locataire, du candidat et du signataire (propriétaire responsable, Bailio sous-traitant, durée, droits). Tout nouveau formulaire public en reçoit une. Champs non indispensables marqués « Facultatif ».
- Conservation (`domain/retention.ts`, testé) : justificatifs du locataire et du garant gardés pendant tout le bail, propriétaire prévenu par email 7 jours avant, effacés 30 jours après la fin (`purgeDocsAfterLease`) ; dossier réduit au nom et à l'email 3 ans après la fin du bail (`purgeAfterLease`) ou 3 mois après sa dernière modification s'il n'a jamais eu de bail (`purgeWithoutLease`), tâche quotidienne.
- Agents d'IA et moteurs : `robots.txt` (liens privés exclus), `sitemap.xml` et `llms.txt` générés par `vite.config.ts` (prix repris de `config.ts`) ; `<noscript>` descriptif dans `index.html`. Nouvelle page publique : l'ajouter à `PUBLIC_PAGES` et à `llms.txt`.

## Rédaction

- Tout en français, on **vouvoie** le propriétaire, phrases courtes, zéro jargon technique.
- Tout terme juridique est expliqué en une ligne.

## Règles juridiques (loi n° 89-462 du 6 juillet 1989)

Elles sont codées dans `server/src/domain/lease.ts` (et reprises pour l'affichage dans `client/src/lib/lease.ts`) :
- durée : 3 ans en vide (personne physique ou SCI familiale), 6 ans pour une autre personne morale, 1 an en meublé (`leaseDurationMonths`, `domain/rules.ts`) ; congé pour reprise refusé à une personne morale, SCI familiale au profit d'un associé seulement (`resumptionAllowed`, `domain/structure.ts`) ;
- dépôt de garantie maximum : 1 mois de loyer hors charges en vide, 2 mois en meublé ;
- congé du bailleur : 6 mois avant l'échéance en vide, 3 mois en meublé ;
- logement interdit à la location selon le DPE (`rentalForbidden`, `domain/rules.ts`) : G depuis le 1er janvier 2025, F au 1er janvier 2028, E au 1er janvier 2034 ; création et signature du bail refusées, étape « Créer le bail » bloquée avec le motif ;
- plafonds du loyer d'un nouveau bail (`rentIssues`, `domain/rules.ts`), vérifiés avant la signature (signature refusée, alerte dans le bail) : encadrement (loyer de base ≤ loyer de référence majoré × surface), complément seulement en zone encadrée et jamais en F ou G, loyer ≤ celui du locataire précédent en F ou G, et en zone tendue sauf motif (`previous.increaseReason`, repris dans le bail). Zone tendue et encadrement d'après les listes officielles des communes (`isTenseZone`, `rentControlFor`, données dans `domain/data/`) : 1 430 communes « zone tendue » (catégorie 1 du zonage TLV, décret n° 2013-392 modifié le 22 décembre 2025, fichier du ministère sur data.gouv.fr ; les communes « touristiques » ne comptent pas pour la loi de 1989) et 68 communes encadrées (dont 8 de Grenoble-Alpes Métropole en partie seulement). Reprises dans la fiche du logement si le propriétaire n'a rien indiqué, et dans le bail. Encadrement désactivé après le 24 novembre 2026 (fin de l'expérimentation) sauf prolongation : mettre à jour `RENT_CONTROL_END` si une loi la prolonge, et les listes à chaque nouveau décret ;
- diagnostics (`diagnosticValidUntil`, `expiredDiagnostics`) : DPE de 2013 à 2017 plus valables depuis le 1er janvier 2023, de 2018 au 30 juin 2021 depuis le 1er janvier 2025, sinon 10 ans ; état des risques 6 mois ; électricité, gaz et plomb 6 ans. Un diagnostic expiré bloque la signature, apparaît dans « Compléter la fiche du logement » et dans le dossier du logement. Les fichiers déposés (`Document` de type DIAGNOSTIC) sont joints à la fin du PDF du bail (`renderLeasePdf`, `services/annexes.ts`, pdf-lib), y compris le document signé en ligne ;
- bail : contrat type du décret n° 2015-587 (annexe 1 vide, annexe 2 meublé, version en vigueur depuis le 1er janvier 2024) ; quittance : article 21.
- le PDF du bail (`server/src/pdf/contract.tsx`) reprend les rubriques I à XI du contrat type, dans l'ordre et avec leurs intitulés (dont « Dépenses énergétiques » et le rappel des critères de décence) ; les clauses licites ajoutées vont dans la rubrique X. Aucune mise en forme ni formulation reprise d'un bail fourni par un utilisateur. Test : `server/src/pdf/contract.test.ts`.
Toute modification de ces règles s'accompagne d'un test dans `server/src/domain/lease.test.ts`.

Textes officiels reproduits **à l'identique** (ne jamais les reformuler, seulement la mise en page) :
- notice d'information de l'arrêté du 29 mai 2015 modifié (`server/src/pdf/notice-text.ts`), jointe à la fin de chaque bail et publique sur `/api/notice-information.pdf` ;
- notice de l'arrêté du 13 décembre 2017 et article 15, II, alinéas 1 à 5 (`server/src/pdf/notice-conge-text.ts`), joints au congé pour vendre ou reprendre un logement vide.
- listes des réparations locatives (décret 87-712) et des charges récupérables (décret 87-713) (`server/src/pdf/annexes-text.ts`), publiques sur `/api/reparations-locatives.pdf` et `/api/charges-recuperables.pdf`.
Tests : `server/src/domain/notices.test.ts`, `server/src/domain/letters.test.ts`.

## Ne jamais faire ressaisir

Chaque information saisie est enregistrée et réutilisée :
- courriers : la saisie en cours est gardée automatiquement (`lease.data.letterDrafts`), et les faits utiles d'un courrier enregistré sont retenus avec le bail (`tenantNotice`, `depositReceivedAt`, `boilerServiceDate`…) puis repris par les courriers suivants ;
- état des lieux : aucune grille de vétusté annoncée par défaut (elle se convient entre les parties et se joint au bail) ;
- état des lieux de sortie : nouvelle adresse du locataire et date de remise des clés reprises dans sa fiche et le solde de tout compte ;
- état des lieux de sortie comparé à l'entrée (décret n° 2016-382, art. 3 ; `domain/inventoryCompare.ts`, testé) : sous chaque élément, état, remarque et photos de l'entrée (rapprochement par pièce et élément, sans accents ni majuscules), évolution « Identique », « Meilleur », « À regarder » (plus abîmé, pas forcément à la charge du locataire), « Nouveau » ; compteurs avec index d'entrée et consommation ; PDF de sortie à colonnes Entrée / Sortie / Évolution et section « Évolutions depuis l'entrée » (`worseItems`). Test : `e2e/tests/25-sortie-comparee.test.mjs` ;
- récapitulatif des dégradations (`domain/damage.ts`, testé ; `services/damage.ts` ; page `/espace/baux/:id/degradations`, `GET/PUT /leases/:id/damages`, PDF `/leases/:id/damages.pdf`) : un élément plus abîmé qu'à l'entrée à la fois, photos d'entrée et de sortie, « usure normale » (jamais retenue, art. 7) ou « dégradation » avec coût, justificatif obligatoire (art. 22), part d'usure facultative et commentaire ; décisions gardées dans `lease.data.damageReview`. Retenues reprises dans le solde de tout compte (`damageDeductions`), délai de restitution de deux mois si la sortie n'est pas conforme (`depositDeadline`, tâche « Dépôt de garantie »). Test : `e2e/tests/26-degradations.test.mjs` ;
- historique des loyers (`lease.data.rentHistory`, `domain/rentHistory.ts`, testé) : chaque montant avec sa date d'effet (signature, révision, avenant). Le loyer d'un mois est celui en vigueur à son échéance (`amountsForPeriod`) : quittances, loyers attendus, impayés, provisions de la régularisation et aide fiscale l'utilisent. Une révision prend effet à sa date (`Lease.rentCents` suit chaque jour, `runDailyReminders`), garde `lastRevisionDate` et met à jour le loyer de la fiche du logement ;
- nouveau bail : loyer du locataire précédent, date du dernier versement, date de la dernière révision et travaux faits depuis son départ (interventions terminées) repris automatiquement ;
- toute écriture dans `lease.data` relit les données juste avant (`patchLeaseData`) pour ne rien effacer.
- bail signé : le PDF du bail reste la copie figée (`contractFor`), mais quittances, courriers, états des lieux et envois utilisent `liveContract` (coordonnées actuelles des fiches : email ajouté après la signature, nouvelle adresse, adresse, IBAN et signature du bailleur) ;
- attestation d'assurance saisie (fiche ou lien du locataire) : les rappels suivent sa date de fin (`alignInsuranceReminders`) ; syndic de la fiche du logement ajouté au carnet ; lien du locataire fermé à la fin du bail.

## Mise en location

- Annonce (`domain/ad.ts`, `/espace/logements/:id/annonce`) : mentions obligatoires (loyer charges comprises par mois, charges, dépôt, surface, classes DPE, dépenses d'énergie estimées, « Logement à consommation énergétique excessive » en F et G). Réglages gardés dans la fiche du logement (`ad`), repris du dernier bail (`services/ad.ts`).
- Honoraires dans l'annonce : « pas de frais d'agence » seulement sans mandataire ; avec un mandataire (profil `agent.enabled`), honoraires TTC à la charge du locataire exigés (`ad.tenantFeesCents`).
- Rédaction avec une IA (`adPrompt`, `parseAiAd`) : consigne prête à copier, tirée de la fiche (sans adresse exacte ni nom, sans montants ni DPE, ajoutés ensuite comme mentions obligatoires) ; le propriétaire colle la réponse (`POST /properties/:id/ad/paste`) ou écrit lui-même. Bailio n'appelle aucune IA.
- Candidats (`domain/candidates.ts`, `routes/candidates.ts`, table `Candidate`) : lien public `/candidature/:code` à coller sur Leboncoin, SeLoger… (message prêt à copier sur la page Candidats), sans compte. Pièces demandées choisies par le propriétaire (`ad.requestedDocs`, `ad.guarantorDocs`), déposées après l'envoi (`/candidature/:code/document`, jeton de 24 h). « Choisir ce candidat » crée la fiche du locataire (pièces reprises, `source: 'TENANT'`, à vérifier) et efface la candidature ; les autres sont effacées avec leurs pièces après 90 jours (tâche quotidienne). Pièces autorisées : décret 2015-1437 ; interdites : art. 22-2.

## Loyers reçus et quittances automatiques

- Relevé bancaire (`/espace/argent/releve`, `routes/bank.ts`) : le propriétaire dépose le CSV ou l'OFX de sa banque ; lu en mémoire (`domain/bankStatement.ts`), jamais enregistré ; rapproché des loyers attendus (`domain/rentMatch.ts`, testé : montant attendu à 1 € près, 20 jours avant à 45 jours après l'échéance, nom du locataire ou du garant dans le libellé ; « À vérifier » si partiel ou ambigu, non coché). Validation : `POST /bank/confirm` → `recordPayment` (`routes/leases.ts`), le même chemin que la saisie à la main.
- Quittance automatique, **active par défaut** (`receiptAutoOn` : seul `lease.data.receiptAuto === false` la coupe ; `PUT /leases/:id/receipt-auto`, interrupteur sur la page du bail ; `domain/autoReceipt.ts`, testé ; `services/autoReceipts.ts`, tâche quotidienne). Le propriétaire n'agit que si le loyer n'arrive pas : 7 jours après l'échéance (`paymentDay` du bail), le loyer est noté reçu à l'échéance et la quittance part par email (`recordPayment` → `sendReceipt`, accord du locataire respecté, art. 21). Propriétaire prévenu par email 3 jours avant (`receiptWarned`) et tâche « Quittance automatique » dans « Aujourd'hui » : « Le loyer n'est pas arrivé » (ou « Il est arrivé : envoyer maintenant ») (`POST /leases/:id/receipt-hold`, `receiptHold`), puis relance (`REMINDER`). Premier mois au prorata (entrée après l'échéance) jamais automatique ; pas de rattrapage au-delà de 10 jours. Un loyer enregistré à la main ou depuis le relevé fait partir sa quittance tout de suite. Envois gardés dans `lease.data.receiptsSent`. Test : `e2e/tests/18-quittance-auto.test.mjs`.
- Connexion bancaire directe (DSP2, lecture seule) : à brancher sur ce même rapprochement quand la société existera. GoCardless Bank Account Data n'accepte plus de nouveaux clients (juillet 2025) ; candidats : Powens ou Bridge (français, agréés ACPR), Enable Banking, Yapily.

## Aide à la déclaration des revenus

`domain/tax.ts` (testé dans `tax.test.ts`), page `/espace/argent/declaration` : loyers encaissés et dépenses de l'année civile. Vide : micro-foncier (≤ 15 000 €, abattement 30 %, case 4BE) ou réel (2044, lignes 211 à 250) ; meublé : micro-BIC (≤ 77 700 €, abattement 50 %, case 5NI, 5OI pour le second déclarant ; au réel, résultat case 5NA ou 5NY ; brochure pratique IR 2026). Intérêts d'emprunt, honoraires et régularisation des provisions de copropriété (ligne 230) saisis par année, gardés dans la fiche du logement (`tax`). Travaux de construction ou d'agrandissement (catégorie `EXTENSION`) jamais déduits, signalés pour la plus-value. Déficit foncier (`foncierDeficit`) : part hors intérêts imputable sur le revenu global dans la limite de 10 700 € (case 4BC), reste reporté (case 4BD) ; plafond porté jusqu'à 21 400 € à hauteur des travaux classés « Rénovation énergétique » (`ENERGY_RENOVATION`, logement E, F ou G vers A à D, dépenses payées de 2023 à 2027 selon la loi de finances pour 2026, à vérifier). Échéances fiscales dans « Prochaines échéances » (`domain/fiscalCalendar.ts`, testé) : date limite de la déclaration en ligne selon le département du bailleur, pour les années vérifiées sur impots.gouv.fr (`DECLARATION_DATES` : 2026 inscrite, à compléter chaque printemps ; sinon « fin mai, à confirmer ») ; déclaration d'occupation (« Gérer mes biens immobiliers ») avant le 1er juillet si l'occupant a changé entre le 2 janvier de l'an dernier et le 1er janvier, et dès qu'un occupant change (30 derniers jours) ; CFE du meublé le 15 décembre. Seuils et dates vérifiés sur service-public.gouv.fr (F1991, F32744) : à revoir à chaque loi de finances. Meublé au régime réel : estimation comparée au micro-BIC (`domain/lmnp.ts`, testé) avec amortissements simplifiés (logement hors terrain sur 30 ans au prorata de l'année d'achat, mobilier 7 ans, travaux d'amélioration 15 ans), limités au résultat (art. 39 C, reste reporté sans limite) ; part du terrain et mobilier gardés dans la fiche (`lmnp`), amortissements reportés saisis par année (`tax[année].lmnpCarriedCents`). La liasse 2031 reste à faire avec un expert-comptable ou un logiciel agréé.

Par structure (`domain/structureTax.ts`, testé dans `structureTax.test.ts`) : la déclaration personnelle ne reprend que les logements détenus en nom propre ou à plusieurs ; chaque SCI ou société reçoit sa fiche « aide à vérifier » (`structures` de `GET /money/tax`) : SCI à l'IR → 2072-S/C en ligne, part de chaque associé (case 4BA de la 2042 s'il n'a que des parts, paragraphe 110 de la 2044 s'il loue aussi en direct, pas de micro-foncier ; notice 2044 de 2026) ; société à l'IR (SARL de famille) → 2031 ; IS → 2065 et liasse 2033 avec l'expert-comptable. Date limite (`resultDeadline`) : 2e jour ouvré après le 1er mai (jours fériés de mai, Pâques calculé), + 15 jours en ligne (impots.gouv : échéance du 05/05/26). Bailio ne dépose rien.

## Emprunt et trésorerie

`domain/loan.ts` (testé dans `loan.test.ts`), page `/espace/logements/:id/emprunt`, carte sur la page du logement (`LoanCard`) : emprunts gardés dans la fiche du logement (`loans`, 5 au plus), taux fixe et mensualités constantes (taux mensuel = taux annuel / 12), assurance mensuelle fixe, estimation (le tableau de la banque fait foi). Ligne 250 de la 2044 (notice 2044 de 2026) : intérêts + assurance emprunteur + frais (dossier, garantie, courtage, comptés l'année de signature, par défaut un mois avant la première mensualité) payés dans l'année ; repris par l'aide à la déclaration (`withLoans`, `routes/money.ts`) tant que le propriétaire n'a pas saisi le montant de sa banque (`tax[année].loanInterestCents`), et dans les charges du meublé au réel. Trésorerie du mois (`GET /properties/:id/loans`) : loyer et charges (bail en cours, sinon loyer de la fiche) − mensualité − assurance − moyenne mensuelle des dépenses des 12 derniers mois, avant impôt.

## Parcours guidés « Que se passe-t-il ? »

`server/src/domain/journeys.ts` (testé dans `journeys.test.ts`) : départ du locataire, impayé, vente ou reprise, problème dans le logement. L'état de chaque étape est déduit des courriers enregistrés, des états des lieux et des faits du bail ; seules les démarches faites hors de Bailio (commandement de payer) se cochent à la main. Pages : `/espace/situations` et `/espace/baux/:id/parcours/:kind`. Les tâches d'« Aujourd'hui » (départ, solde de tout compte, chaudière) sont déduites de la même façon.

## Structures qui détiennent les logements

Fiches juridiques et fiscales vérifiées : `docs/fiscalite/structures.md` (« Vérifié » ou « À vérifier » ligne par ligne, sources). Table `Structure` (`domain/structure.ts`, testé dans `lease.test.ts` ; `routes/structures.ts`, pages `/espace/structures` et `/espace/structures/:id`) : en mon nom, à plusieurs (couple, indivision), SCI (familiale ou non), autre société ; régime fiscal (IR, IS), associés et parts, SIREN, compte qui reçoit les loyers. Chaque logement a sa structure (`Property.structureId`), choisie à sa création (`StructurePicker`, « Créer une nouvelle structure » sur place) et modifiable depuis sa page (`OwnerCard`). La première est créée à partir du profil (`ensureStructures`) et reçoit les logements sans structure. Le bailleur d'un bail = profil (identité, coordonnées, signature) + structure (nature, société, co-propriétaires, IBAN) : `landlordOf` (`services/contract.ts`). Un bail signé garde le bailleur de sa signature ; les baux en préparation suivent la structure (durée recalculée). Le profil du bailleur ne porte plus la nature du bailleur.

## Accès partagés

Table `Access` (`routes/access.ts`, page `/espace/compte/acces`, invitation publique `/invitation/:token`) : le propriétaire invite par email un associé ou co-propriétaire (tout sauf supprimer, créer un logement, toucher au compte ou aux structures), un comptable (lecture seule) ou un intervenant (un logement : adresse, accès, contact du locataire, interventions, `GET /shared/view`, page `/espace/partage`). L'invité accepte en se connectant avec l'adresse invitée (lien magique, `LoginToken.accessId`) ; accès retirable à tout moment (`revokedAt`), l'invité peut aussi le quitter. Espace partagé = en-tête `X-Bailio-Space` (client : `lib/shared.ts`, stockage `bailio.space`, bandeau dans `AppShell`) ; ignoré pour le compte lui-même (`SELF_PATHS`). Deux verrous, refus par défaut, testés dans `domain/access.test.ts` : `routeDenied` (méthode et adresse selon le rôle, `services/session.ts`) et `scopeQuery`, appliqué à **toute** requête en base par l'extension Prisma de `db.ts` (`accessScope`, AsyncLocalStorage) : chaque table filtrée sur les logements, baux et locataires partagés ; corbeille, accès, sessions et compte du propriétaire refusés. Nouvelle table liée à un logement : l'ajouter à `scopeQuery` (sinon elle est refusée dans les espaces partagés). Test : `e2e/tests/21-acces.test.mjs`.

## Parcours dans l'ordre : logement, locataire, bail

- « Ajouter un logement » (`AjoutLogement.tsx`, étapes nommées, copropriété et mobilier seulement s'ils s'appliquent) demande tout ce que la rubrique II du contrat type, les diagnostics et le mobilier exigent ; « il manque… » côté serveur : `propertyLeaseMissing` (`domain/checklist.ts`).
- « Ajouter un locataire » (`AjoutLocataire.tsx`) : identité, naissance, coordonnées, situation et revenus, garant (identité, engagement, montant, durée), 5 justificatifs autorisés (dont l'avis d'imposition), pour lui et son garant. Ce qui manque (`domain/tenantFile.ts`, `tenantMissing`) se demande au locataire par email ou par courrier (`routes/tenantForm.ts`) : lien sans compte `/dossier/:code` (colonne `Tenant.formCode`, 30 jours), il complète lui-même, tout arrive dans sa fiche.
- « Créer un bail » refuse d'avancer tant que les informations **primordiales** du logement (`leaseMissing` de la fiche) puis du locataire (`tenantLeaseMissing`) manquent, avec le lien vers l'étape à compléter ou la demande au locataire. Chaque manque a un `level` (`domain/checklist.ts`) : `ESSENTIAL` bloque la création et la signature (`essential()`), `RECOMMENDED` laisse une ligne à compléter dans le bail.
- Ce que le locataire envoie (lien `/dossier/:code`) est marqué à vérifier (`Tenant.data.review`, pièces `source: 'TENANT'`) : le propriétaire valide ou demande une correction (`/tenants/:id/review`, `applyReview`).
- Le locataire remplit, depuis son lien, les mêmes informations que le propriétaire dans « Ajouter un locataire » (`TENANT_EDITABLE`, `GUARANTOR_EDITABLE` : foyer, colocataires, garantie, garant, lien DossierFacile `dossierFacileUrl`) ; « Mon locataire le remplit lui-même » crée la fiche avec son seul email et envoie le lien.
- Loyer saisi une fois dans la fiche du logement (`rent` : loyer, charges, mode, dépôt, jour de paiement ; étape « Loyer » d'« Ajouter un logement ») : repris par l'annonce (`services/ad.ts`) et par le bail créé (`POST /leases`, dans les limites de la loi) ; changé dans l'annonce ou un bail en préparation, il est retenu dans la fiche (`rememberRent`, `services/rent.ts`). Date d'entrée par défaut : disponibilité de l'annonce.
- Un locataire peut être lié à plusieurs logements (`tenantHomes` : un par logement, bail le plus récent) ; le bail réunit la fiche du logement et celle du locataire.
- Formulaire du début (tunnel public) : civilité, étage et porte, type d'habitat, régime juridique, période de construction, chauffage et eau chaude, mode des charges.
- Clause résolutoire (rubrique VIII) : toujours présente pour le loyer, les charges et le dépôt (loi n° 2023-668) ; l'option ne fait que l'étendre à l'assurance et aux troubles de voisinage.

## Guidage et dossier du logement

- Mise en location (`domain/rental.ts`, testé dans `rental.test.ts` ; `services/rental.ts`) : fiche du logement, annonce et candidatures (facultatives, `skippedSteps`), locataire (fiche, lien, vérification), bail, relecture (`lease.data.checkedAt`), signature, état des lieux d'entrée, dépôt, assurance, premier loyer. État déduit des données ; chaque étape à faire devient une tâche `STEP` d'« Aujourd'hui » et la page du logement affiche le parcours (`components/Journey.tsx`).
- Dossier du logement (`domain/binder.ts`, testé ; onglet « Dossier du logement ») : documents à avoir et à garder, ce qui manque, durée de conservation (service-public F19134, loi de 1989 art. 7-1). Dépôt via `POST /documents` avec `binder`.
- Signature en ligne : photo du signataire facultative (`POST /esign/:token/photo`, ou « Signer sans photo » indiqué dans le certificat), réencodée par `sharp` sans métadonnées, horodatée par le serveur, empreinte SHA-256, dans le certificat (`pdf/certificate.tsx`).
- Conservation (`services/retention.ts`, tâche quotidienne), selon le référentiel CNIL « gestion locative » (délibération n° 2021-057, gestion directe) : justificatifs du locataire et du garant effacés 30 jours après la fin du dernier bail (prévenance 7 jours avant) ; 3 ans après, informations devenues inutiles (revenus, situation, naissance, téléphone, garant hors identité) et photo de signature effacés ; restent le nom et l'email (`Tenant.data.purgedAt`). Candidats non retenus : 3 mois.
- Régularisation des charges au prorata des jours d'occupation (`occupancyShare`, `occupiedFrom`/`occupiedTo` repris du bail) ; solde de tout compte majoré de 10 % du loyer mensuel par mois de retard commencé après la date limite (`depositLatePenalty`, art. 22).
- Après l'envoi d'un lien par email : boutons vers la messagerie (`lib/mail.ts`, `components/MailLinks.tsx`). Annonce : liens de dépôt Leboncoin, SeLoger, PAP, Facebook Marketplace.

## Lien du locataire

`routes/tenantLink.ts`, page publique `/locataire/:code` (colonne `Lease.tenantCode`) : sans compte, le locataire envoie son attestation d'assurance (fiches des locataires et rappel mis à jour), l'attestation d'entretien de la chaudière (bail et fiche du logement) et donne ou retire son accord pour la quittance par email (art. 21, avec la date). Les fichiers rejoignent les documents du bail (`meta.from = 'TENANT'`). Côté propriétaire : carte « Documents du locataire » sur la page du bail, et tâches d'« Aujourd'hui » (assurance, chaudière) qui envoient le lien.

Signaler un problème (`domain/issues.ts`, testé dans `issues.test.ts` ; `POST /locataire/:code/issues`) : assistant en trois écrans (type, description, photos facultatives, 3 au plus), geste immédiat affiché (fuite, gaz avec Urgence sécurité gaz GRDF 0 800 47 33 33, électricité), fuite et gaz toujours urgents. Le signalement devient une intervention « à organiser » du logement (`Intervention.source = 'TENANT'`, `data` : catégorie, lieu, urgence, bail, photos rangées avec le logement, pas dans la fiche du locataire). Propriétaire prévenu par email et tâche `ISSUE` en tête d'« Aujourd'hui » (urgentes d'abord), qui ouvre la fiche de l'intervention (`?onglet=expenses&intervention=`). Date prévue ou fin : le locataire est prévenu par email s'il est coché (`notifyTenant`), et voit l'avancement sur son lien, sans l'artisan ni le coût (`issueProgress`). Test : `e2e/tests/23-signalement.test.mjs`.

Compléter l'état des lieux d'entrée (loi de 1989, art. 3-2 ; `complementWindow`, `domain/inventory.ts`, testé dans `inventory.test.ts`) : depuis son lien, le locataire demande un ajout dans les 10 jours qui suivent l'état des lieux signé, ou pour le chauffage pendant la première année (la loi dit « premier mois de la période de chauffe », sans date) : texte et 5 photos au plus (`POST /locataire/:code/inventory-complement`, gardées dans `Inventory.data.complements`). Propriétaire prévenu par email et tâche `INVENTORY_COMPLEMENT` ; il répond sur l'écran de l'état des lieux (`/edl/:id`, `POST /inventories/:id/complements/:cid`) : accepté, le complément entre dans une nouvelle version du PDF envoyée aux deux ; refusé, motif obligatoire, envoyé au locataire avec son recours (commission départementale de conciliation, gratuite). Photo d'ensemble par pièce (`rooms[].photoIds`) ; chaque photo du PDF porte sa date d'ajout sur le serveur (`fileDates`). Test : `e2e/tests/24-etat-des-lieux.test.mjs`.

## Courriers à un tiers

Déclaration de sinistre à l'assureur et réclamation à un artisan (`THIRD_PARTY_LETTERS`) : destinataire repris du carnet (ou ajouté au carnet à l'enregistrement), numéro de contrat gardé dans la fiche du logement (`ownerInsurance`), réclamation pré-remplie avec la dernière intervention terminée. L'envoi par email part au bon destinataire (`emailLetter` : garant pour l'appel à la caution, tiers pour ces courriers, locataire sinon).

## Bilan, carnet, corbeille

- Bilan par logement (`domain/report.ts`, testé) : `/espace/argent/bilan`, loyers, dépenses, résultat ; prix d'achat gardé dans la fiche (`purchase`) pour le rendement brut.
- Carnet (`routes/contacts.ts`, `/espace/carnet`) : un contact saisi une fois sert dans toutes les interventions. Une intervention terminée avec un coût crée (ou met à jour) sa dépense ; une intervention prévue apparaît dans « Aujourd'hui ».
- Corbeille (`services/trash.ts`, `/espace/corbeille`) : toute suppression (dépense, document, locataire, bail en préparation, contact, intervention) passe par `toTrash` ; restauration à l'identique pendant 30 jours, puis effacement par la tâche quotidienne. Nouvelle suppression : passer par `toTrash`.
- Immeubles : sur « Logements », les logements à la même adresse (et même ville) sont regroupés.

## Base de données

- Montants en **centimes** (`Int`).
- Nouvelle colonne ou table : `npm --prefix server run db:migrate -- --name <nom>` en local, puis commit de la migration.
- En production, `prisma migrate deploy` au démarrage. **Jamais** de `db push --accept-data-loss`.
- Toute migration qui supprime une colonne ou une table se fait uniquement après accord explicite.

## Patterns

```ts
// API : réponse standard
res.json({ success: true, data })
throw new HttpError(404, 'Bail introuvable.')   // message en français, affiché tel quel

// Client
const lease = await api<LeaseDetails>(`/leases/${id}`)
const url = await pdfUrl(`/leases/${id}/lease.pdf`)   // PDF protégé → URL locale
```

## Commandes

```bash
npm run install:all # server/ et client/ ont chacun leur package-lock.json
npm run dev          # API :5000 + site :5173
npm run typecheck    # client + serveur
npm test             # serveur (règles, OCR) + site (vitest)
npm run build
npm --prefix e2e test  # parcours complets dans un navigateur (API et site lancés en local, voir e2e/README.md)
```
