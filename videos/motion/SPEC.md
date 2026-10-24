# SPEC — Bailio, film de présentation

GOAL:    le propriétaire qui loue lui-même comprend en une minute que Bailio prépare chaque papier, selon la loi,
         et que le premier bail est offert ; il retient « le bail juste, du premier coup » et bailio.fr.
OUTPUT:  HyperFrames. YouTube `index.html` 2560×1440 ; court `short.html` 1080×1920 ; 30 fps.
TIME:    YouTube 77 s × 30 = 2310 images ; court 22 s × 30 = 660 images. La voix off est l'horloge ;
         nappe `boucle-1` (≈115 bpm, boucle de 16 s) sous la voix à 0,14.
LOOK:    les règles du site bailio.fr, pas une palette inventée.
         - fonds : pierre #E8E8E3 (monde principal), encre #181715 (la paperasse, « Tout le dossier »),
           bleu #1A3270 (« montre en main »), photos de Montpellier du site (plein cadre ou panneau droit) ;
         - encre #181715 pour tout ce qui se lit sur clair, #E8E8E3 sur foncé, #55544E pour le secondaire ;
         - accent bleu #1A3270 : un mot par titre (« juste », « déjà calculé »), les valeurs calculées, le bouton ;
         - caramel #C4976A : seulement le point du logo, qui sert de fil conducteur (iris, curseur) ;
         - titres Young Serif 400, 150–200 px (10–14 % de la hauteur), interlettrage −1 % ; mots héros jusqu'à 520 px ;
           texte Source Serif 4 400/600, 40–64 px ; étiquettes DM Sans 600, 32–40 px ;
         - matière : cartes papier du site (#FBFBF8, bord 2 px #DCDCD6, rayon 10 px, ombre 0 30 px 80 px à 16 %),
           agrandies ×1,8 ; trait d'encre 3 px pour la façade et les signatures ; aucun grain, aucune lueur.
OBJECTS: façade d'immeuble (toit mansardé, lucarnes, balcons filants, porte cochère) ; feuille raturée ; quittance
         (« QUITTANCE DE LOYER », mois, 780,00 €, « Envoyée à Léa ») ; calendrier ; contrat type (rubriques I à XI,
         trois cadres de signature) ; ticket de caisse à bord dentelé ; curseur flèche noire cerclée de blanc (70 px).
MOTION:  arrivée expo.out / power4.out 0,5–0,8 s ; caméra et aplats power2.inOut 0,4–0,6 s ; sortie power3.in,
         40 % plus courte ; ressort damping ≈0,75 (back.out(1.4)) seulement sur position et échelle ;
         mots à 0,07 s d'écart, lignes de liste à 0,06 s ; un titre posé ne bouge plus.
SHOTS (YouTube, secondes du film) :
  s1  0–5,2     façade dessinée au trait puis photo rue Foch ; « Vous louez vous-même. » ; sortie : la photo
                envahit le cadre et passe à l'encre.
  s2  5,2–15,4  monde encre : « Le bail » + feuille raturée → « Les règles » (années qui défilent) →
                « Les quittances » (pile de 12) → « Les dates » (calendrier cerclé) ; balayage en souffle.
  s3  15,4–20,4 point caramel → iris sur la pierre ; logo « Bailio. » ; « prépare chaque papier… » ; « Selon la loi. »
  s4  20,4–28,8 carte « Bail vide, déjà calculé. » : 780 tapé, durée, dépôt, préavis posés sur la voix ; clic
                « Meublé » : les valeurs roulent ; volet encre depuis la droite.
  s5  28,8–35,6 « Tout le dossier. » ; carte Annonce prête ; Leboncoin, SeLoger, PAP sur la voix ; mentions soulignées.
  s6  35,6–43,4 contrat type : rubriques I→XI ; Bailleur, Locataire, Garant signent au trait ; « Sans compte. »
  s7  43,4–54,4 « Chaque mois, » mois qui roulent ; anneau 3D de 12 quittances (grand moment) ; l'anneau se range
                dans « Aujourd'hui » : quittance envoyée, 780 € → 791 €, assurance, relance ; fouet vers le haut.
  s8  54,4–60,6 monde bleu : ticket qui s'imprime, 5 + 2 + 3 + 30 min, total « 40 min ».
  s9  60,6–66,4 Peyrou plein cadre « Le loyer arrive chez vous. » ; pierre « Vos données restent en Suisse. »
  s10 66,4–77   « Premier bail 0 € » ; point caramel, logo, « Le bail juste, du premier coup. », bouton cliqué,
                bailio.fr, tenu 4 s.
SHOTS (court) : v1 0–2,6 accroche à la pastille photo ; v2 2,6–6 logo et papiers qui roulent ; v3 6–7,6 annonce ;
                v4 7,6–10,2 signatures ; v5 10,2–13,6 anneau de quittances ; v6 13,6–22 0 € puis fin.
BANNED:  fond nuit avec petits objets flottants ; lueur, néon, particules ; dégradés violets, cartes en verre ;
         tout centré ; tout en fondu-montée ; titres qui dérivent ; trois cartes en ligne ; logo dans un coin ;
         faux tableau de bord (seulement les cartes du site) ; anneaux de clic ; chiffres inventés.
QA:      0 s (vignette lisible) ; 3 s (photo révélée) ; 12 s (paperasse au pic) ; 17 s (logo) ; 26 s (bail calculé) ;
         33 s (annonce) ; 41 s (trois signatures) ; 47 s (anneau) ; 52 s (quatre lignes) ; 58 s (40 min) ;
         64 s (Suisse) ; 74 s (fin). Court : 0, 1,5, 4, 7, 9, 12, 15, 20 s.
