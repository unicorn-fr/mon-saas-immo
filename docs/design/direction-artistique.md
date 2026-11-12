# Direction artistique « Feuille et stylo » (novembre 2026)

Remplace « Maison habitée » (vert et jaune, refusée par Enzo le 12 novembre 2026) et « Midi » (bleu, orange, Fraunces).
Choisie par Enzo parmi trois palettes de la skill taste (design-taste-frontend, Leonxlnx/taste-skill, licence MIT, lue
en entier) faites pour le logiciel et la finance, sur fond clair.

## L'idée

Bailio ressemble à un bail bien tenu : une feuille blanche, une encre noire, et un seul bleu « stylo bille » pour ce qui
se signe, se clique ou se suit. Rien d'autre ne porte de couleur, sauf le vert « payé » et le rouge des erreurs. Le
niveau visé est celui de figma.com et x.ai (skill taste) : on dit ce que c'est, on montre le vrai produit.

## Couleurs (`client/src/constants/bailio-tokens.ts`, palette `white-link-blue` de la skill)

| Rôle | Token | Valeur |
|---|---|---|
| Feuille | `surface` | `#ffffff` (accueil, pages publiques, cartes) |
| Fond de l'espace | `bg` | `#f4f4f4` |
| Encre | `ink` | `#111111` |
| Texte secondaire | `inkSoft` | `#5f5f5f` |
| Aplat sombre | `night` | `#111111` (menu latéral, bande inversée, pied de page) |
| Bleu stylo | `owner`, `cta`, `accentInk` | `#1a4be0`, texte blanc dessus ; survol `#143bb3` |
| Bleu sur fond sombre | `accent` | `#8fb0ff` |
| Payé | `green` | `#1a7f45` |
| Erreur | `error` | `#c11f2b` |
| Bords | `border`, `borderStrong` | `#e4e4e4`, `#8a8a8a` (champs, 3,45:1) |

Contrastes mesurés (WCAG 2.1) :

| Couple | Contraste |
|---|---|
| Encre sur blanc | 18,9:1 |
| Blanc sur bleu | 6,7:1 |
| Bleu sur fond `#f4f4f4` | 6,1:1 |
| `inkSoft` sur fond | 5,8:1 |
| Gris des titres `#6b6b6b` sur blanc | 5,3:1 |
| Bleu clair sur encre | 8,8:1 |
| Vert sur blanc | 5,0:1 |
| Bord des champs | 3,45:1 |

Règles :
- **Un seul bouton plein bleu par écran,** l'action principale. Les autres boutons sont en contour, encre sur blanc avec un bord gris, ou noirs (`dark`) pour une action forte secondaire.
- **Pas de violet,** pas de dégradé, pas d'ombre lourde (une ombre douce seulement sous la fenêtre du produit et les cartes flottantes).

## Typographie

**Instrument Sans** (variable, servie par le site avec `@fontsource-variable/instrument-sans`, licence OFL), pour les titres et le texte. La skill la range dans les polices du logiciel de productivité (« précise, amicale, calme »).
- **Titres :** graisse 500 et approche serrée, -0,032 em en général, -0,036 em en très grand.
- **Texte :** 400 ; 500 ou 600 pour les boutons, les étiquettes et le gras.
- **Jamais 700 ni 800** en titre.

**Accroche :** la seconde moitié d'un titre passe en gris (`<em>`, couleur `#6b6b6b`, sans italique) et doit faire une phrase à elle seule. C'est la manière de la skill : « La gestion locative des propriétaires, *sans agence.* »

## Formes

Rayons « soft » de la skill :
- cartes 20 px (`BAI.radius`) ;
- champs 12 px (`radiusField`), 60 px de haut ;
- boutons 10 px (`radiusBtn`), 8 px en petit ;
- étiquettes en pilule.

Le coin replié (`.fold`) reste disponible pour un bloc important, sans en abuser.

## Le haut de l'accueil

Sur un logiciel, la skill demande de montrer le produit lui-même, jamais une illustration. On y trouve donc :
- la vraie capture d'« Aujourd'hui » dans une fenêtre de navigateur (`components/HeroProduct.tsx`) ;
- un fil de ce que Bailio vient de faire, une ligne de plus toutes les 2,8 s, dit « Exemple ».

Le titre nomme la catégorie et l'acheteur, puis un fait concret (le prix) sur le premier écran.

## Mouvement

- **Animé :** le fil du haut de page, la visite des écrans (`ProductTour`), les nombres qui défilent et, au survol, des boutons qui changent de teinte.
- **Jamais :** de fondu sur chaque section ni d'inclinaison.
- **Si l'appareil demande moins d'animations,** tout s'arrête et reste visible.

## Logo

`components/Logo.tsx` : une maison à l'encre aux angles doux, dont la fenêtre ronde est le bleu stylo, puis « bailio » en Instrument Sans 600 (-0,04 em). Le point du i est la même fenêtre bleue.
- **Sur fond sombre :** maison et nom clairs, fenêtre bleue.
- **Fichiers :** `favicon.svg`, `favicon.ico`, `favicon-96.png` et `apple-touch-icon.png` (maison sur blanc).

## Captures et vidéo

- **Captures :** vraies captures d'un compte d'exemple aux données fictives, refaites par `marketing/captures/fonctionnalites.mjs` (il affiche aussi les zones mises en avant à reporter dans les contenus).
- **Vidéo :** `marketing/videos/demo/demo.html`, rendue par `render.cjs`.

## Hors de cette refonte

Les PDF (bail, quittances, courriers) gardent leur mise en page : ce sont des documents juridiques.
