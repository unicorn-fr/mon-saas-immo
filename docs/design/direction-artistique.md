# Direction artistique « Bleu clair » (13 novembre 2026)

Remplace « Feuille et stylo » (Instrument Sans, encre noire, titres gris), jugée trop éloignée des logiciels du marché par
Enzo le 13 novembre 2026 : « je veux que tu fasses comme Qalimo ». On reprend l'allure générale des logiciels de gestion
locative (fond bleuté, bleu franc, titres gras bleu nuit, menu bleu dans l'espace, bande de chiffres bleu nuit) sans
recopier ni texte, ni image, ni logo, ni code de Qalimo. Aucun chiffre ni avis inventé : la bande de chiffres ne montre
que des faits de Bailio (prix, nombre de modèles et d'outils gratuits, tirés du code).

## Couleurs (`client/src/constants/bailio-tokens.ts`)

| Rôle | Token | Valeur |
|---|---|---|
| Feuille | `surface` | `#ffffff` |
| Fond de l'espace et des sections | `bg` | `#f4f7fd` (bleuté) |
| Encre | `ink` | `#0d1b3e` (bleu nuit) |
| Texte secondaire | `inkSoft` | `#56637f` |
| Aplat sombre | `night` | `#0b1638` (bande des chiffres, pied de page) |
| Bleu | `owner`, `cta`, `accentInk` | `#2563eb`, texte blanc dessus ; survol `#1d4ed8` |
| Menu de l'espace | `side`, `sideActive` | `#2563eb`, entrée en cours `#1a46c9`, texte blanc |
| Bleu sur fond sombre | `accent` | `#8fb4ff` |
| Payé | `green` | `#17753f` |
| Erreur | `error` | `#c11f2b` |
| Bords | `border`, `borderStrong` | `#e2e8f4`, `#8590ab` (champs, 3:1 au moins) |

Contrastes (WCAG 2.1 AA, contrôlés par axe-core, test 16) : blanc sur bleu 5,2:1 ; blanc sur l'entrée en cours du menu
7,3:1 ; bleu sur `ownerLight` et `ownerTint` 4,6:1 au moins ; encre sur blanc 16:1 ; `inkSoft` sur le fond 5,6:1.

Règles :
- **Un seul bouton plein bleu par écran,** l'action principale, avec une ombre bleutée. Les autres en contour blanc, bord fin.
- **Dégradés permis seulement** pour les halos du haut de l'accueil et la bande bleu nuit ; jamais sur un texte ni un bouton.
- Pas de violet ; le rouge ne sert qu'aux erreurs et aux retards.

## Typographie

**Inter** (variable, `@fontsource-variable/inter`, licence OFL, servie par le site).
- **Titres :** 700 (`display()`), 800 pour le titre de l'accueil et les grands chiffres ; approche serrée (-0,03 à -0,04 em).
- **Texte :** 400 ; 500 ou 600 pour les liens du menu, boutons et étiquettes.
- **Accroche :** la seconde moitié d'un titre passe en bleu (`<em>`, sans italique) et fait une phrase à elle seule.

## Formes

Cartes 18 px (`BAI.radius`), blanches à bord fin `#e2e8f4` et ombre douce ; champs 12 px, 60 px de haut ; boutons 10 px.

## Le haut de l'accueil

Fond bleuté avec halos doux et trame de points qui s'efface vers le bas ; pastille blanche à point bleu ; titre gras bleu
nuit, fin en bleu ; une ligne ; bouton bleu et « Voir la vidéo » blanc à icône bleue ; ligne de faits. Dessous, le vrai
produit dans une fenêtre de navigateur, deux cartes flottantes (« exemple ») qui ondulent doucement, puis la bande bleu
nuit des chiffres (`Stats`, `Home.tsx`). En-tête translucide.

## L'espace du propriétaire

- **Menu latéral bleu** (`components/AppShell.tsx`) : fond `side`, texte blanc, une icône par entrée, entrée en cours plus
  foncée et en gras, bouton « Ajouter » blanc à texte bleu, logo en tuile blanche (`Logo onBlue`).
- **Fond bleuté**, cartes blanches ; tuiles du mois avec pastille à icône à droite ; actions en cartes compactes ;
  raccourcis en puces ; titres de page de 26 à 34 px.

## Mouvement

Le fil du haut de page, les cartes flottantes, la visite des écrans, les nombres qui défilent, les mini-écrans des
automatismes. Animations de position, jamais de transparence sur un texte (contraste). Si l'appareil demande moins
d'animations, tout s'arrête et reste visible.

## Logo

`components/Logo.tsx` : tuile bleue arrondie portant un « b » blanc dont la hampe est taillée en pente de toit, puis
« bailio » en Inter 700 (-0,045 em). Sur fond sombre la tuile reste bleue ; sur le menu bleu (`onBlue`), tuile blanche
et « b » bleu. Favicon et icône de téléphone inchangés.

## Captures et vidéo

Captures d'un compte d'exemple refaites par `marketing/captures/fonctionnalites.mjs` ; vidéo `marketing/videos/demo/`.
Les PDF (bail, quittances, courriers) gardent leur mise en page : ce sont des documents juridiques.
