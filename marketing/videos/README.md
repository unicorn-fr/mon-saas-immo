# Vidéos de Bailio : la semaine en automatique

Chaque dimanche, une tâche programmée prépare les vidéos de la semaine suivante, les envoie au propriétaire du compte
pour validation, puis les programme après son accord. **Rien n'est publié sans un « ok » écrit.**

## Ce qui est produit chaque semaine

- **7 vidéos verticales** (1080 × 1920, 20 à 40 s), une par jour du lundi au dimanche, publiées à 13 h (Paris) sur
  YouTube Shorts, Facebook et Instagram (TikTok dès que le compte est branché dans n8n).
- **1 vidéo YouTube** au format paysage (1920 × 1080, 3 à 6 min), le samedi à 10 h : le sujet le plus fort de la
  semaine traité en entier.
- Pour chaque sujet, un **guide écrit** sur bailio.fr (`client/src/content/guides.ts`, règles de CLAUDE.md).

Style : direction artistique du site (`kit.js`, `kit.css` : aplats bleu nuit, bleu, crème, pêche, orange réservé au
geste principal, contours épais, Fraunces et Figtree, logo de novembre 2026). Pas de visage généré par IA, pas de
voix clonée : voix de la bibliothèque ElevenLabs, énergique.

## Étapes (dimanche)

1. **Sujets.** Lire `sujets.md` : jamais un sujet déjà publié (même angle). Chercher sur Internet ce qui fait parler
   les propriétaires cette semaine (actualité du logement, nouvelles lois, dates fiscales, questions fréquentes sur
   les forums et les réseaux, tendances de format). Choisir 7 sujets courts + 1 sujet long, en suivant les piliers de
   `.claude/skills/bailio-marketing/SKILL.md`.
2. **Vérification.** Chaque règle citée vérifiée le jour même sur service-public.fr ou Légifrance ; noter la source
   et la date. Un doute = la phrase ne sort pas.
3. **Scripts.** Accroche dans les 2 premières secondes (question, erreur, chiffre), une seule idée, un exemple
   chiffré, fin « Abonnez-vous » puis « Le guide complet est sur bailio.fr ». Vouvoiement, phrases courtes.
4. **Voix.** ElevenLabs (`creative_generate_speech`), modèle `eleven_v4`, voix de la bibliothèque énergique (la même
   toute la semaine), balises d'intention (`[excited]`) avec parcimonie. **Une seule prise** (`generations_count: 1`)
   pour ménager les crédits ; ne jamais relancer une génération pour « réessayer ». Télécharger en `voix.wav`.
5. **Horodatage.** `python3 transcrire.py voix.wav mots.json` (Whisper local, gratuit ; première fois :
   `python3 -m venv venv && venv/bin/pip install -r requirements.txt`), puis `python3 align.py <dossier> script.txt`
   qui écrit `data.js` (mots et sous-titres).
6. **Scènes.** Une page HTML par vidéo, sur le modèle de `exemples/` : `window.DURATION`, `window.SCENES` (un
   changement de plan toutes les 3 à 5 s, calé sur les mots avec `W('mot')`), fin commune `endScene(...)`.
   YouTube : `<html class="paysage">` et positions adaptées (`capTop`).
7. **Rendu.** `node render.cjs page.html images/ 0,3,8,15` pour quelques images de contrôle (les regarder), puis
   `node render.cjs page.html images/ full`.
8. **Son.** `python3 mix.py voix.wav musique/piste-N.mp3 <durée> "<débuts des scènes>" son.wav` (pistes libres de
   droits du dossier, en rotation).
9. **Montage.** `ffmpeg -framerate 30 -i images/%05d.jpg -i son.wav -c:v libx264 -crf 26 -preset slow
   -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart -shortest sortie.mp4`. **10 Mo au plus** (n8n est limité
   en mémoire) : monter le `crf` si besoin.
10. **Textes.** Un fichier `textes/<nom>.json` par vidéo (titre et description YouTube avec lien marqué
    `?utm_source=youtube&utm_medium=social&utm_campaign=<nom>`, texte Facebook terminé par une question, légende
    Instagram avec 3 à 5 hashtags).
11. **Guides.** Écrire les guides de la semaine dans `client/src/content/guides.ts`, PR, tests, fusion, en ligne.
12. **Validation.** Envoyer au propriétaire du compte toutes les vidéos (fichiers dans la session) avec, pour
    chacune, le jour, l'heure et l'accroche ; notification sur le téléphone. Attendre sa réponse.
13. **Programmation, après l'accord seulement.** Écrire `semaine.json` (vidéos acceptées seulement) puis
    `python3 publier.py semaine.json --essai` et, si tout répond, `python3 publier.py semaine.json`. Une vidéo
    refusée est corrigée selon sa remarque et renvoyée, ou abandonnée.
14. **Journal.** Ajouter chaque vidéo programmée à « Publiés » de `sujets.md` (date, sujet, format, source) et
    retirer l'idée utilisée ; commit.

## Coûts

- Rendu, transcription, montage : gratuits (sur la machine).
- Voix : environ 1 crédit ElevenLabs par caractère du script. Une semaine ≈ 7 × 500 + 1 × 4 000 ≈ 7 500 à 10 000
  crédits. Surveiller le solde ; si le forfait ne suffit pas, raccourcir la vidéo YouTube ou passer au forfait
  supérieur, après accord.

## Accès

Variables d'environnement seulement : `BAILIO_RESEAUX_USER`, `BAILIO_RESEAUX_PASSWORD`, `BAILIO_N8N_API_KEY`.
Jamais de secret dans le dépôt ni dans un message.
