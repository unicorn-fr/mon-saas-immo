# Charte graphique de Bailio

Planche complète : `charte.png`. Logos en vecteurs (SVG, utilisables à toute taille, pour l'imprimeur comme pour le
web) : dossier `logo/`. Tout se régénère : `node videos/scripts/logo.mjs` puis `node videos/scripts/marque.mjs`.

## L'idée : le toit

Le « b » de Bailio est une maison : un toit caramel se pose sur sa panse, le fût de la lettre fait cheminée.
Dans le mot « bailio », les points des deux i sont deux petits toits. Le toit (un chevron) est la signature de la
marque : on le retrouve en puce, en accent au-dessus d'une icône et en trame de fond.

## Logo

| Fichier | Usage |
|---|---|
| `logo/bailio-logo.svg` | Logo principal (monogramme + nom), sur fond clair |
| `logo/bailio-logo-blanc.svg` | Sur fond bleu ou photo sombre |
| `logo/bailio-monogramme.svg` | Seul, dans un carré bleu : photo de profil, icône d'application, favicon |
| `logo/bailio-monogramme-creme.svg` | Variante sur fond crème |
| `logo/bailio-monogramme-nu.svg` | Sans fond, pour poser sur un visuel |
| `logo/bailio-logotype*.svg` | Le nom seul (bleu, blanc, encre) |

- Zone de protection : autour du logo, laissez au moins la hauteur du « b » libre.
- Taille minimale : 24 px de haut pour le monogramme, 80 px de large pour le logo complet.
- Ne pas : changer les couleurs, déformer, ajouter une ombre, poser le logo bleu sur un fond foncé.

## Couleurs

| Nom | Code | Rôle |
|---|---|---|
| Bleu Bailio | #1A3270 | Couleur principale : logo, boutons, grands aplats |
| Encre | #1A1A2E | Titres et texte |
| Caramel | #C4976A | Le toit et les accents (jamais pour un texte sur fond clair : prendre #8A5F36) |
| Crème | #FAF7F2 | Fond des visuels |
| Bleu clair | #EEF1F8 | Pastilles d'icônes, encarts |
| Blanc | #FFFFFF | Cartes, texte sur bleu |

Ce sont les couleurs du site (client/src/constants/bailio-tokens.ts) : la marque et le produit se ressemblent.

## Typographie

- **Outfit Bold** pour les titres : courts, affirmatifs, sans point d'exclamation (licence OFL, `public/fonts`).
- **DM Sans** pour le texte, les chiffres, les boutons et les mentions (police du site).

## Icônes

Lucide (lucide.dev, licence ISC) : trait arrondi, en bleu sur une pastille bleu clair, ou en blanc sur un disque
bleu. Une icône par idée, jamais de couleurs multiples.

## Visuels

- Fond crème, beaucoup d'air, un seul message par visuel, le bleu en aplat pour l'élément principal.
- Un seul toit caramel par élément (accent ou puce), la trame de toits en fond très discret.
- Captures du site dans un téléphone sombre, jamais déformées.

## Sur le site

Le site utilise encore l'ancien favicon (« B » italique). Passer au nouveau monogramme (favicon, icône de
l'application, en-tête) change le design du site : à faire après votre accord.
