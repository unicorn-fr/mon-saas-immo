# Direction artistique « Midi » (octobre 2026)

## Pour qui, pour quoi

Bailio sert le **propriétaire bailleur particulier** qui loue lui-même un, deux ou dix logements, souvent après 45 ans, souvent sans connaissance juridique. Il veut un bail juste, des papiers en ordre et ne rien oublier. Il n'y a pas d'espace locataire.

Ce qu'il doit ressentir : **c'est sérieux, c'est clair, c'est fait pour moi.** Ni la froideur d'un logiciel de gestion, ni le clinquant d'une start-up.

## L'idée

> Sur Bailio, **le coin replié d'une page de bail** devient **le module de toutes les compositions**.

Le bail est la feuille autour de laquelle tout tourne. Chaque bloc important (accroche, fiche calculée, ticket, offre) est une page : grands coins arrondis, un coin replié en haut à droite. C'est la signature visuelle de Bailio, présente dans le logo, sur l'accueil et dans le favicon.

Le décor vient de Montpellier, ville de Bailio : les photos sont celles de la ville (fournies par l'éditeur).

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

## Couleurs : palette « Confiance et élan » (`client/src/constants/bailio-tokens.ts`)

### Pourquoi ces couleurs (ce que dit la recherche)

- **La couleur pèse dans le premier jugement.** Selon la revue de Singh (*Management Decision*, 2006), on se fait une idée d'un produit en 90 secondes et la couleur compte pour 62 à 90 % de cette impression (chiffre repris d'études antérieures, à prendre comme un ordre de grandeur).
- **Bleu = compétence.** Labrecque et Milne (*Journal of the Academy of Marketing Science*, 2012, « Exciting red and competent blue ») associent le bleu à la compétence et le rouge à l'excitation. Pour un outil qui rédige un bail et gère de l'argent, la compétence est le premier trait à montrer.
- **Sobre = confiance.** Une étude sur 1 995 personnes et des sites de banque et d'assurance a trouvé que les couleurs ternes inspirent plus confiance que les couleurs vives. D'où un bleu profond et peu saturé pour la marque, et un fond gris bleuté très clair plutôt que du blanc éclatant partout.
- **Le bouton doit se détacher, pas être « de la bonne couleur ».** Le célèbre test du bouton rouge (+21 %) s'explique surtout par l'effet d'isolement (Von Restorff) : le bouton était la seule chose rouge d'une page verte. Ce qui fait cliquer, c'est le contraste avec le reste de la page. Sur un site bleu, l'action principale est donc **orange** (couleur complémentaire du bleu, associée à l'enthousiasme et à la chaleur), et c'est la **seule** chose orange de l'écran.
- **Vert = c'est fait.** Code universel du « validé », gardé pour les étapes terminées.
- **Rouge = erreur, et rien d'autre.**

Limites : la plupart des affirmations « telle couleur fait vendre » des blogs ne s'appuient sur aucune étude. Seuls le contraste du bouton et la sobriété pour la confiance reposent sur des données sérieuses. À terme, mesurer les clics sur « Créer mon bail » avec la mesure d'audience maison.

Sources : [Singh, 2006](https://www.emeraldinsight.com/doi/abs/10.1108/00251740610673332) ; [Labrecque et Milne, 2012](https://colab.ws/articles/10.1007/s11747-010-0245-y) ; [couleur et confiance en banque et assurance](https://www.asiainsurancereview.com/Magazine/ReadMagazineArticle?aid=39963) ; [effet d'isolement et couleur du bouton](https://atticusli.com/blog/posts/cta-button-ab-tests-why-button-color-tests-are-worthless/) ; [contraste plutôt que teinte](https://www.clickguard.com/blog/call-to-action-colors-for-landing-pages/).

### La palette

| Rôle | Token | Valeur | Usage |
|---|---|---|---|
| Fond de page | `bg` | `#f5f7fa` gris bleuté | espace propriétaire, tunnel |
| Surface | `surface` | `#ffffff` | cartes, accueil, pages publiques |
| Encre | `ink` | `#16233f` | texte, titres |
| Marque | `owner` | `#1f4396` bleu confiance | liens, sélection, pastilles, progression, grands blocs |
| Action | `cta` | `#ff8a3d` orange, texte `ctaInk` `#0f1f3d` | **le** bouton principal, un par écran |
| Nuit | `night` | `#0f1f3d` | menu latéral, blocs sombres, pied de page |
| Accent | `accent` / `accentInk` / `accentSoft` | `#ff8a3d` / `#c2410c` / `#ffb27a` | mot en italique : orange sur fond sombre, orange foncé sur fond clair, orange clair sur bloc bleu |
| Validé | `green` | `#1f7a4a` | |
| Aplats | `sky` `#dbe7fb`, `peach` `#fde4cf` | | sections et cartes, texte `ink` ou `owner` |
| Erreur | `error` | `#c11f2b` | uniquement les erreurs |

Contrastes mesurés (WCAG 2.1) : encre sur fond 14,5:1 ; blanc sur bleu 9,1:1 ; bleu nuit sur orange 7:1 ; bleu sur fond 8,5:1 ; orange foncé sur blanc 5,2:1 ; orange sur nuit 7:1 ; orange clair sur bleu 5,2:1 ; vert sur blanc 5,3:1 ; `inkSoft` sur blanc 5,9:1 ; bord des champs 3,5:1.

Interdits : texte blanc sur orange (2,4:1, illisible) ; deux boutons orange sur le même écran ; logo en couleurs sur un aplat de couleur.

## Typographies (servies par le site, aucune requête à Google)

- **Figtree** 400 à 700 : texte, boutons, champs, intertitres. Lisible, ronde, chaleureuse. 16 px minimum pour le texte courant.
- **Fraunces** (axe « SOFT » pour des empattements arrondis) 500 : titres, accroches courtes, chiffres clés (`display()`, `components/ui.tsx`). Jamais pour le texte courant. Un mot ou une ligne d'une accroche peut passer en italique avec `<em>` (orange foncé sur fond clair, orange sur fond sombre, orange clair sur bloc bleu), une fois par écran au plus.

## Formes

- Cartes : rayon 24 px (`BAI.radius`) ; champs : 60 px de haut, rayon 14 px ; boutons et étiquettes : pilule.
- Module « page de bail » : classes `.fold` (coin replié de 28 px), `.fold--lg` (grand coin), `.fold--ear` (revers du pli), `.fold--left` (coin gauche) dans `client/src/styles.css`. Un à trois modules par écran.

## Logo

`components/Logo.tsx` : la page au coin replié (bleu, revers orange, deux lignes de texte) puis « Bailio » en Fraunces. Version horizontale partout. En couleurs sur fond clair, en blanc (`onDark`) sur un aplat sombre. Marge libre autour : la hauteur d'une capitale.

## Photos

Photos réelles de Montpellier (`client/public/accueil/`, `credits.json`). Aucun visuel créé par IA. À trouver pour aller plus loin (libres de droits, sans pose de banque d'images) :
- un propriétaire qui remet les clés à un locataire, sur le pas d'une porte du centre ancien ;
- des persiennes vertes ou bleues sur une façade de pierre, en plan serré ;
- une table de cuisine avec un bail papier, des clés et un téléphone ;
- un petit immeuble de village du Midi, ciel bleu (pour varier au-delà de Montpellier) ;
- un garage ou un box fermé, rue calme (pour l'onglet « Garage »).

## Hors de cette refonte

Les PDF (bail, quittances, courriers) gardent leur mise en page : ce sont des documents juridiques, leur présentation suit le contrat type.
