# Direction artistique « Midi » (octobre 2026)

## Pour qui, pour quoi

Bailio sert le **propriétaire bailleur particulier** qui loue lui-même un, deux ou dix logements, souvent après 45 ans, souvent sans connaissance juridique. Il veut un bail juste, des papiers en ordre et ne rien oublier. Il n'y a pas d'espace locataire.

Ce qu'il doit ressentir : **c'est sérieux, c'est clair, c'est fait pour moi.** Ni la froideur d'un logiciel de gestion, ni le clinquant d'une start-up.

## L'idée

> Sur Bailio, **le coin replié d'une page de bail** devient **le module de toutes les compositions**.

Le bail est la feuille autour de laquelle tout tourne. Chaque bloc important (accroche, fiche calculée, ticket, offre) est une page : grands coins arrondis, un coin replié en haut à droite. C'est la signature visuelle de Bailio, présente dans le logo, sur l'accueil et dans le favicon.

Le décor vient de Montpellier, ville de Bailio : la pierre claire des façades, le bleu canard des persiennes, le laurier-rose des avenues, le vert des oliviers et des pins. Les photos sont celles de la ville (fournies par l'éditeur).

## Ce que nous avons pris d'une grande charte de l'immobilier (et ce que nous n'avons pas pris)

Repris comme **principes** :
- fond blanc dominant, beaucoup d'air, aplats de couleur unie, aucun dégradé ni ombre lourde ;
- une couleur signature foncée pour l'action, un accent vif rare, plusieurs aplats pour varier les sections ;
- un système de modules : photo dans un module arrondi, bloc de couleur posé **en bas** par-dessus, jamais en haut ; sur téléphone, le bloc passe sous la photo, collé aux bords ;
- un duo de polices : une linéale pour tout, un serif pour les accroches courtes, avec un mot ou une ligne en italique ;
- boutons en pilule, une seule action principale par écran ;
- pictos filaires, trait fin, bouts arrondis ; coche dans une pastille à la place des puces ;
- règles de contraste strictes et logo en couleurs seulement sur fond clair.

**Non repris** : aucune de ses couleurs, ni ses polices, ni sa forme (le biais du toit de son logo), ni ses capitales espacées sur les boutons, ni son logo, son nom ou son slogan.

## Couleurs (`client/src/constants/bailio-tokens.ts`)

| Rôle | Token | Valeur | Usage |
|---|---|---|---|
| Fond de page | `bg` | `#f4f4f0` pierre claire | espace propriétaire, tunnel |
| Surface | `surface` | `#ffffff` | cartes, accueil, pages publiques |
| Encre | `ink` | `#16201e` | texte, titres |
| Signature | `owner` | `#0f5257` bleu canard | action principale, liens, pastilles |
| Survol | `ownerHover` | `#0a3a3e` | |
| Nuit | `night` | `#0d2a2c` canard nuit | menu latéral, blocs sombres, pied de page |
| Accent | `accent` | `#f59bb4` laurier-rose | **seulement sur fond sombre** (mot en italique, bouton « Ajouter ») |
| Accent sur clair | `accentInk` | `#a3264d` framboise | mot en italique sur fond clair, étiquettes « à faire » |
| Validé | `green` | `#3b6a1d` olive | |
| Aplats | `pistache` `#d6e29c`, `rose` `#f8c9d5` | | sections et cartes, texte `ink` ou `owner` |
| Erreur | `error` | `#b42318` | le rouge ne sert qu'aux erreurs |

Contrastes mesurés (WCAG 2.1) : encre sur pierre 15,1:1 ; blanc sur canard 8,9:1 ; canard sur pierre 8,1:1 ; framboise sur blanc 7,1:1 ; laurier-rose sur nuit 7,4:1 ; encre sur pistache 12,1:1, sur rose 11,4:1 ; olive sur blanc 6,4:1 ; `inkSoft` sur pierre 6,2:1 ; bord des champs 3,9:1. Laurier-rose sur canard : 4,3:1, réservé aux grands titres (≥ 3:1).

Interdits : texte blanc sur pistache, rose ou laurier-rose ; laurier-rose sur fond clair ; logo en couleurs sur un aplat de couleur.

## Typographies (servies par le site, aucune requête à Google)

- **Figtree** 400 à 700 : texte, boutons, champs, intertitres. Lisible, ronde, chaleureuse. 16 px minimum pour le texte courant.
- **Fraunces** (axe « SOFT » pour des empattements arrondis) 500 : titres, accroches courtes, chiffres clés (`display()`, `components/ui.tsx`). Jamais pour le texte courant. Un mot ou une ligne d'une accroche peut passer en italique avec `<em>` (framboise sur fond clair, laurier-rose sur fond sombre), une fois par écran au plus.

## Formes

- Cartes : rayon 24 px (`BAI.radius`) ; champs : 60 px de haut, rayon 14 px ; boutons et étiquettes : pilule.
- Module « page de bail » : classes `.fold` (coin replié de 28 px), `.fold--lg` (grand coin), `.fold--ear` (revers du pli), `.fold--left` (coin gauche) dans `client/src/styles.css`. Un à trois modules par écran.

## Logo

`components/Logo.tsx` : la page au coin replié (canard, revers laurier-rose, deux lignes de texte) puis « Bailio » en Fraunces. Version horizontale partout. En couleurs sur fond clair, en blanc (`onDark`) sur un aplat sombre. Marge libre autour : la hauteur d'une capitale.

## Photos

Photos réelles de Montpellier (`client/public/accueil/`, `credits.json`). Aucun visuel créé par IA. À trouver pour aller plus loin (libres de droits, sans pose de banque d'images) :
- un propriétaire qui remet les clés à un locataire, sur le pas d'une porte du centre ancien ;
- des persiennes vertes ou bleues sur une façade de pierre, en plan serré ;
- une table de cuisine avec un bail papier, des clés et un téléphone ;
- un petit immeuble de village du Midi, ciel bleu (pour varier au-delà de Montpellier) ;
- un garage ou un box fermé, rue calme (pour l'onglet « Garage »).

## Hors de cette refonte

Les PDF (bail, quittances, courriers) gardent leur mise en page : ce sont des documents juridiques, leur présentation suit le contrat type.
