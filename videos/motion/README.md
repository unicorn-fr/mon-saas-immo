# Film de présentation de Bailio (motion design, HyperFrames)

Deux films faits uniquement en HTML + GSAP, rendus par [HyperFrames](https://hyperframes.heygen.com) :

| Fichier rendu | Format | Durée | Pour |
|---|---|---|---|
| `videos/out/bailio-presentation-1440p.mp4` | 2560×1440, 30 i/s, 16 Mb/s | 77 s | YouTube, site, LinkedIn |
| `videos/out/bailio-pub-9x16.mp4` | 1080×1920, 30 i/s, 12 Mb/s | 22 s | Reels, TikTok, Shorts, publicités Meta |

Son mesuré à −14 LUFS (pic −1,5 dBTP). `videos/out/` n'est pas versionné : on refabrique les MP4 avec les commandes ci-dessous.

## Ce que racontent les films

Un seul logement (le « T2 Écusson » de l'accueil de bailio.fr, 780 €, locataire Léa) traverse le film :
façade dessinée → la paperasse qui s'empile → le point caramel du logo ouvre le monde Bailio → loyer tapé et bail
calculé (vide puis meublé) → annonce prête (Leboncoin, SeLoger, PAP) → contrat type et trois signatures →
anneau de quittances « toute seule » → « Aujourd'hui » (quittance, révision IRL, assurance, relance) →
ticket « 40 min » → loyer versé directement, données en Suisse → premier bail 0 € → logo, « Le bail juste, du
premier coup. », bouton « Créer mon bail gratuit », bailio.fr.

Tout vient du site : textes, chiffres (780 €, 791 €, 5 + 2 + 3 + 30 min, 0 €), photos de Montpellier, polices
(Young Serif, Source Serif 4, DM Sans), couleurs (pierre #E8E8E3, encre #181715, bleu #1A3270, caramel #C4976A).
Découpage plan par plan : `SPEC.md`. Les trois pistes envisagées : `STORYLINES.md`. Relecture : `REVIEW.md`.

## Fabriquer

```bash
cd videos/motion
python3 scripts/assemble.py                     # écrit index.html et court/index.html (scènes, voix, musique, bruitages)
npx hyperframes@0.8.192 check                  # contrôle (contrat, mise en page, contraste, lisibilité)
npx hyperframes@0.8.192 preview --background   # aperçu modifiable dans le navigateur
npx hyperframes@0.8.192 render -o ../out/raw-yt.mp4 --fps 30 --video-bitrate 16M
(cd court && npx hyperframes@0.8.192 render -o ../../out/raw-court.mp4 --fps 30 --video-bitrate 12M)
# son à −14 LUFS pour YouTube et les réseaux :
ffmpeg -i ../out/raw-yt.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -movflags +faststart ../out/bailio-presentation-1440p.mp4
```

`court/` est un second projet HyperFrames (le format vertical) qui partage `assets/` et `compositions/` par liens
symboliques.

## Fichiers

- `compositions/s1…s10-*.html` : les 10 scènes du film YouTube ; `compositions/v1…v6-*.html` : les 6 scènes du court.
- `assets/voix/` : voix off ElevenLabs (voix « Clémence - Advertising », modèle eleven_v4), `*-a.mp3` d'origine,
  `*.wav` normalisés à −16 LUFS, `*.words.json` transcription mot à mot (whisper local) qui cale chaque animation
  sur le mot dit. Pour changer le texte : régénérer la voix, transcrire (`npx hyperframes transcribe … --language fr`),
  puis reprendre les coupes `vo` de `scripts/assemble.py` et les instants des scènes.
- `assets/musique/boucle.wav` : la nappe de `videos/public/musique/boucle-1.mp3`, normalisée.
- `assets/sfx/` : bruitages (Pixabay, licence libre, `CREDITS.md`) et ceux du studio vidéo.
- `assets/photos/` : photos de l'accueil du site (fournies par le propriétaire du site).
- `assets/logo/` : logos de `videos/marque/logo/` ; `bailio-mot*.svg` = le mot sans le point, pour animer le point à part.
