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
| Emails | SMTP (Ionos) ou Resend (`lib/email.ts`), sinon affichage dans les logs |
| Auth | Sans mot de passe : lien magique par email uniquement. Session = jeton aléatoire (empreinte en base), en-tête `Authorization: Bearer`, fermée après 30 jours sans activité. Appareils connectés visibles et déconnectables dans « Mon compte ». Export des données et suppression du compte confirmés par un code à 6 chiffres envoyé par email (`ActionCode`) |
| Import de baux | Sur le serveur uniquement : Tesseract (OCR, `fra`) + poppler + `sharp` (redressement, éclairage), puis règles (`services/import/parse.ts`). Aucune donnée envoyée à un service d'IA |
| Hébergement | Site : Vercel (bailio.fr), qui relaie `/api` vers `api.bailio.eu`. API + PostgreSQL + Caddy (HTTPS) : VPS Infomaniak (`deploy/vps`), mis à jour automatiquement toutes les 5 minutes depuis la branche `production` (`auto-update.sh`), que GitHub Actions avance seulement quand tous les tests passent sur `main` (`.github/workflows/ci.yml`). Vercel publie aussi la branche `production` (réglage « Production Branch »). Dépendances : Dependabot chaque semaine (`.github/dependabot.yml`), `npm audit` en CI. Version en ligne : `https://api.bailio.eu/health` |

## Règles de design (maquette)

- Toute couleur vient de `BAI` (`client/src/constants/bailio-tokens.ts`). Aucune couleur hexadécimale dans les composants.
- Titres : Cormorant Garamond, italique, 700 (`display()` dans `components/ui.tsx`). Corps : DM Sans.
- Fond crème `BAI.bg`, encre `BAI.ink`, action principale bleu `BAI.owner`, accent `BAI.caramel`, validé `BAI.green`.
- Une seule action principale par écran. Champs de 60 px de haut, rayon 14 px.
- Mobile d'abord : `clamp()` pour les tailles, classes `.col-md`, `.hide-md`, `.grid-*` pour les ruptures.

## Rédaction

- Tout en français, on **vouvoie** le propriétaire, phrases courtes, zéro jargon technique.
- Tout terme juridique est expliqué en une ligne.

## Règles juridiques (loi n° 89-462 du 6 juillet 1989)

Elles sont codées dans `server/src/domain/lease.ts` (et reprises pour l'affichage dans `client/src/lib/lease.ts`) :
- durée : 3 ans en vide (bailleur personne physique), 1 an en meublé ;
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

## Aide à la déclaration des revenus

`domain/tax.ts` (testé dans `tax.test.ts`), page `/espace/argent/declaration` : loyers encaissés et dépenses de l'année civile. Vide : micro-foncier (≤ 15 000 €, abattement 30 %, case 4BE) ou réel (2044, lignes 211 à 250) ; meublé : micro-BIC (≤ 77 700 €, abattement 50 %, case 5ND). Intérêts d'emprunt, honoraires et régularisation des provisions de copropriété (ligne 230) saisis par année, gardés dans la fiche du logement (`tax`). Travaux de construction ou d'agrandissement (catégorie `EXTENSION`) jamais déduits, signalés pour la plus-value. Déficit foncier (`foncierDeficit`) : part hors intérêts imputable sur le revenu global dans la limite de 10 700 € (case 4BC), reste reporté (case 4BD) ; plafond porté jusqu'à 21 400 € à hauteur des travaux classés « Rénovation énergétique » (`ENERGY_RENOVATION`, logement E, F ou G vers A à D, dépenses payées de 2023 à 2027 selon la loi de finances pour 2026, à vérifier). Échéances fiscales dans « Prochaines échéances » : déclaration de revenus (fin mai), occupation des logements sur impots.gouv avant le 1er juillet après un changement de locataire, CFE du meublé le 15 décembre. Seuils et dates vérifiés sur service-public.gouv.fr (F1991, F32744) : à revoir à chaque loi de finances. Meublé au régime réel (amortissements, liasse 2031) non géré : renvoi vers un expert-comptable.

## Parcours guidés « Que se passe-t-il ? »

`server/src/domain/journeys.ts` (testé dans `journeys.test.ts`) : départ du locataire, impayé, vente ou reprise, problème dans le logement. L'état de chaque étape est déduit des courriers enregistrés, des états des lieux et des faits du bail ; seules les démarches faites hors de Bailio (commandement de payer) se cochent à la main. Pages : `/espace/situations` et `/espace/baux/:id/parcours/:kind`. Les tâches d'« Aujourd'hui » (départ, solde de tout compte, chaudière) sont déduites de la même façon.

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
- Conservation (`services/retention.ts`, tâche quotidienne) : justificatifs du locataire et du garant effacés 3 ans après la fin du dernier bail, photo de signature 5 ans après (à vérifier avec le référentiel CNIL « gestion locative »).
- Régularisation des charges au prorata des jours d'occupation (`occupancyShare`, `occupiedFrom`/`occupiedTo` repris du bail) ; solde de tout compte majoré de 10 % du loyer mensuel par mois de retard commencé après la date limite (`depositLatePenalty`, art. 22).
- Après l'envoi d'un lien par email : boutons vers la messagerie (`lib/mail.ts`, `components/MailLinks.tsx`). Annonce : liens de dépôt Leboncoin, SeLoger, PAP, Facebook Marketplace.

## Lien du locataire

`routes/tenantLink.ts`, page publique `/locataire/:code` (colonne `Lease.tenantCode`) : sans compte, le locataire envoie son attestation d'assurance (fiches des locataires et rappel mis à jour), l'attestation d'entretien de la chaudière (bail et fiche du logement) et donne ou retire son accord pour la quittance par email (art. 21, avec la date). Les fichiers rejoignent les documents du bail (`meta.from = 'TENANT'`). Côté propriétaire : carte « Documents du locataire » sur la page du bail, et tâches d'« Aujourd'hui » (assurance, chaudière) qui envoient le lien.

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
