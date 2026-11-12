# Direction artistique « Maison habitée » (novembre 2026)

Remplace la direction « Midi » (octobre 2026 : bleu, orange, Fraunces et Figtree).

## Pour qui, pour quoi

Bailio sert le **propriétaire bailleur particulier** qui loue lui-même un, deux ou trente logements, souvent après 45 ans, souvent sans connaissance juridique. Il ne lit pas : il survole. Il veut un bail juste, des papiers en ordre et ne rien oublier.

Ce qu'il doit ressentir : **c'est sérieux, c'est chaleureux, quelqu'un s'occupe de moi.** Ni la froideur d'un logiciel de gestion, ni le clinquant d'une start-up, ni l'esthétique générique des sites générés (fond crème, serif avec un mot en italique, étiquettes en capitales, cartes toutes pareilles).

## L'idée : la fenêtre allumée

Une location réussie, c'est une maison où quelqu'un vit bien, et un propriétaire tranquille. Le signe de Bailio est **la fenêtre allumée** : un rond jaune soleil dans une maison vert forêt.

On le retrouve dans le logo, au point du i, sur le bouton de l'action principale (seul élément jaune de l'écran) et sur ce qui vient d'arriver de bon (un loyer reçu, une quittance partie). Sur l'accueil, l'immeuble s'allume fenêtre par fenêtre quand une tâche se règle.

On garde de la direction précédente ce qui était propre à Bailio : **le coin replié de la page de bail** (`.fold`) sur les blocs importants, et les vraies photos de Montpellier.

## Couleurs (`client/src/constants/bailio-tokens.ts`)

Les noms des clés n'ont pas changé (`owner` = marque, `cta` = action principale, `night` = aplat sombre) : toute l'application a changé d'un coup.

| Rôle | Token | Valeur | Usage |
|---|---|---|---|
| Fond « brume » | `bg` | `#eef3ef` | espace propriétaire, tunnel |
| Papier | `surface` | `#ffffff` | cartes, accueil, pages publiques |
| Encre | `ink` | `#13241f` | texte, titres |
| Forêt | `night` | `#163c34` | menu latéral, blocs sombres, pied de page, logo, texte des boutons soleil |
| Sauge (marque) | `owner` | `#2f6a58` | liens, sélection, pastilles, progression |
| Soleil (action) | `cta` / `accent` | `#ffc444`, texte `ctaInk` `#163c34` | **le** bouton principal, un par écran ; mot souligné au feutre ; accent sur fond forêt |
| Ambre | `accentInk` | `#8a5a00` | accent en texte sur fond clair |
| Validé | `green` | `#1e7a4f` | |
| Aplats | `sky` « mousse » `#dcebdf`, `peach` `#ffe3d3` | | sections et cartes, texte `ink` |
| Corail | `coral` / `coralInk` | `#e8664a` / `#b63e25` | illustrations et personnes seulement ; `coralInk` en texte |
| Erreur | `error` | `#c11f2b` | uniquement les erreurs |

Pourquoi :
- **Vert profond = calme et durable.** C'est la couleur des volets et des jardins, et elle est rare chez les logiciels de gestion, qui sont presque tous bleus. Un vert sombre et peu saturé garde le sérieux qu'apportait le bleu ; les couleurs ternes inspirent plus confiance que les vives (étude sur des sites de banque et d'assurance citée dans la version précédente).
- **Jaune soleil = chaleur, et un bouton qui se détache.** Ce qui fait cliquer, c'est le contraste du bouton avec le reste de la page (effet d'isolement), pas sa teinte. Sur une page verte et blanche, le seul jaune attire l'œil, et le texte forêt dessus reste très lisible (7,6:1).
- **Pêche et corail = l'humain.** Ils réchauffent les illustrations et les personnes, sans jamais servir pour une action.

Contrastes mesurés (WCAG 2.1) :

| Couple | Contraste |
|---|---|
| Encre sur blanc | 16,2:1 |
| Encre sur brume | 14,4:1 |
| `inkSoft` sur blanc | 7,1:1 |
| `inkSoft` sur brume | 6,3:1 |
| Sauge sur blanc | 6,3:1 |
| Sauge sur brume | 5,6:1 |
| Blanc sur sauge | 6,3:1 |
| Forêt sur soleil | 7,6:1 |
| Soleil sur forêt | 7,6:1 |
| Ambre sur blanc | 5,9:1 |
| Ambre sur `accentLight` | 5,3:1 |
| `onDark` sur forêt | 9,7:1 |
| `onDarkMuted` sur forêt | 7,2:1 |
| Vert validé sur blanc | 5,3:1 |
| Corail foncé sur blanc | 5,7:1 |
| Sauge sur mousse | 5,1:1 |
| Encre sur soleil (mot souligné) | 10,2:1 |
| Bord des champs | 3,5:1 |

Interdits :
- texte blanc sur jaune ;
- jaune en texte sur fond clair (utiliser `accentInk`) ;
- deux boutons jaunes sur le même écran ;
- logo en couleurs sur un aplat de couleur ;
- dégradés et ombres lourdes.

## Typographies (servies par le site, `@fontsource-variable`, aucune requête à Google)

- **Bricolage Grotesque** (variable, 650 à 800) : titres, chiffres clés, nom de la marque (`display()`, `components/ui.tsx`). Une grotesque avec du caractère : ses courbes ont un peu de main, sans fantaisie. Approche serrée (-0,03 em) pour les grands titres.
- **Atkinson Hyperlegible Next** (variable) : tout le reste. Conçue par le Braille Institute pour que chaque lettre se distingue (I, l, 1 ; O, 0), elle aide les lecteurs pressés et les yeux fatigués. 16 px minimum.
- **Mot-clé** : plus d'italique. `<em>` dans un titre souligne le mot d'un trait de feutre soleil (`styles.css`), une fois par écran au plus ; sur fond forêt, le mot passe en soleil.

## Écrire pour des gens qui survolent

- Dans les zones clés (titres, boutons, débuts de section), moins de 15 mots par phrase.
- Un verbe d'action, un chiffre concret.
- Pas d'étiquette en capitales au-dessus des titres.
- Pas de numérotation 01, 02 sauf pour une vraie suite d'étapes.
- Pas de « A · B » ni de flèche décorative.

## Formes

- Cartes : rayon 24 px (`BAI.radius`) ; champs : 60 px de haut, rayon 14 px ; boutons et étiquettes : pilule.
- Module « page de bail » : `.fold`, `.fold--lg`, `.fold--ear`, `.fold--left` dans `client/src/styles.css`. Un à trois modules par écran.
- Toutes les cartes ne se ressemblent pas : alterner aplats, photos, mini-écrans réels et listes.

## Mouvement

Peu d'animations, mais orchestrées, et toutes coupées si l'appareil demande moins d'animations :
- fenêtres qui s'allument (accueil) ;
- nombres qui défilent (`CountUp`) ;
- écrans réels joués avec un curseur (`ProductTour`) ;
- apparition `panel-in` d'un panneau.

Jamais d'animation sur le titre principal (il doit s'afficher tout de suite) ni de fondu identique sur chaque section.

## Logo

`components/Logo.tsx` (novembre 2026) :
- **Dessin :** une maison vert forêt aux angles doux (rayon 4 sur une grille de 24, toit à 40°) avec une fenêtre ronde allumée, jaune soleil (diamètre 6, centrée à 13,5). Puis « bailio » en Bricolage Grotesque gras, minuscules, le point du i remplacé par la même fenêtre allumée.
- **Couleurs :** en couleurs sur fond clair ; `onDark` (maison et nom brume, fenêtre soleil) sur un aplat forêt.
- **Fichiers :** favicon `client/public/favicon.svg`, `favicon.ico`, `favicon-96.png`, icône de téléphone `apple-touch-icon.png` (maison sur fond brume).
- **Taille :** lisible dès 16 px.
- **Marge libre :** la hauteur d'une capitale.

## Photos

Photos réelles de Montpellier (`client/public/accueil/`, `credits.json`). Aucun visuel créé par IA. Les écrans montrés sont de vraies captures d'un compte d'exemple (`client/public/fonctionnalites/`), à refaire quand l'application change.

## Hors de cette refonte

Les PDF (bail, quittances, courriers) gardent leur mise en page : ce sont des documents juridiques, leur présentation suit le contrat type. Les emails prennent les nouvelles couleurs (`server/src/lib/email.ts`).
