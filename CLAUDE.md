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
| Emails | Resend (`lib/email.ts`), sinon affichage dans les logs |
| Auth | Sans mot de passe : lien magique par email, ou Google. Session = jeton aléatoire (empreinte en base), en-tête `Authorization: Bearer` |
| IA | `@anthropic-ai/sdk`, lecture des baux importés (`services/importLease.ts`) |

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

## Base de données

- Montants en **centimes** (`Int`).
- Nouvelle colonne ou table : `npm run db:migrate --workspace server -- --name <nom>` en local, puis commit de la migration.
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
npm run dev          # API :5000 + site :5173
npm run typecheck    # client + serveur
npm test --workspace server
npm run build
```
