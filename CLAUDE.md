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
- bail : contrat type du décret n° 2015-587 (annexe 1 vide, annexe 2 meublé) ; quittance : article 21.
Toute modification de ces règles s'accompagne d'un test dans `server/src/domain/lease.test.ts`.

Textes officiels reproduits **à l'identique** (ne jamais les reformuler, seulement la mise en page) :
- notice d'information de l'arrêté du 29 mai 2015 modifié (`server/src/pdf/notice-text.ts`), jointe à la fin de chaque bail et publique sur `/api/notice-information.pdf` ;
- notice de l'arrêté du 13 décembre 2017 et article 15, II, alinéas 1 à 5 (`server/src/pdf/notice-conge-text.ts`), joints au congé pour vendre ou reprendre un logement vide.
- listes des réparations locatives (décret 87-712) et des charges récupérables (décret 87-713) (`server/src/pdf/annexes-text.ts`), publiques sur `/api/reparations-locatives.pdf` et `/api/charges-recuperables.pdf`.
Tests : `server/src/domain/notices.test.ts`, `server/src/domain/letters.test.ts`.

## Ne jamais faire ressaisir

Chaque information saisie est enregistrée et réutilisée :
- courriers : la saisie en cours est gardée automatiquement (`lease.data.letterDrafts`), et les faits utiles d'un courrier enregistré sont retenus avec le bail (`tenantNotice`, `depositReceivedAt`, `boilerServiceDate`…) puis repris par les courriers suivants ;
- état des lieux de sortie : nouvelle adresse du locataire et date de remise des clés reprises dans sa fiche et le solde de tout compte ;
- toute écriture dans `lease.data` relit les données juste avant (`patchLeaseData`) pour ne rien effacer.

## Mise en location

- Annonce (`domain/ad.ts`, `/espace/logements/:id/annonce`) : mentions obligatoires (loyer charges comprises par mois, charges, dépôt, surface, classes DPE, dépenses d'énergie estimées, « Logement à consommation énergétique excessive » en F et G). Réglages gardés dans la fiche du logement (`ad`), repris du dernier bail (`services/ad.ts`).
- Candidats (`domain/candidates.ts`, `routes/candidates.ts`, table `Candidate`) : lien public `/candidature/:code`, sans compte ni pièce jointe (DossierFacile). « Choisir ce candidat » crée la fiche du locataire et efface la candidature ; les autres sont effacées après 90 jours (tâche quotidienne). Pièces autorisées : décret 2015-1437 ; interdites : art. 22-2.

## Aide à la déclaration des revenus

`domain/tax.ts` (testé dans `tax.test.ts`), page `/espace/argent/declaration` : loyers encaissés et dépenses de l'année civile. Vide : micro-foncier (≤ 15 000 €, abattement 30 %, case 4BE) ou réel (2044, lignes 211 à 250) ; meublé : micro-BIC (≤ 77 700 €, abattement 50 %, case 5ND). Intérêts d'emprunt et honoraires saisis par année, gardés dans la fiche du logement (`tax`). Seuils vérifiés sur service-public.gouv.fr (F1991, F32744) : à revoir à chaque loi de finances.

## Parcours guidés « Que se passe-t-il ? »

`server/src/domain/journeys.ts` (testé dans `journeys.test.ts`) : départ du locataire, impayé, vente ou reprise, problème dans le logement. L'état de chaque étape est déduit des courriers enregistrés, des états des lieux et des faits du bail ; seules les démarches faites hors de Bailio (commandement de payer) se cochent à la main. Pages : `/espace/situations` et `/espace/baux/:id/parcours/:kind`. Les tâches d'« Aujourd'hui » (départ, solde de tout compte, chaudière) sont déduites de la même façon.

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
