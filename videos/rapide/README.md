# Films « rapides » de Bailio (HyperFrames)

Seconde série, faite pour arrêter le pouce : coupes sur le temps (124 BPM), typographie géante, téléphones en 3D
dont sortent les vrais écrans du logiciel. Aucun élément de la page d'accueil du site : seulement le logiciel
(captures de `videos/public/ecrans/`, découpes `assets/ecrans/part-*.png`), ses polices (Cormorant Garamond italique,
DM Sans) et ses couleurs (nuit #1a1a2e, crème #faf7f2, bleu #1a3270, caramel #c4976a, vert #1b5e3b).

| Fichier rendu | Format | Durée | Pour |
|---|---|---|---|
| `videos/out/bailio-rapide-1440p.mp4` | 2560×1440, 30 i/s, 18 Mb/s | 36 s | YouTube (pré-roll, Shorts horizontaux), LinkedIn, X |
| `videos/out/bailio-rapide-pub-9x16.mp4` | 1080×1920, 30 i/s, 12 Mb/s | 15,5 s | Reels, TikTok, Shorts, publicités Meta et TikTok |

Son mesuré à −14 LUFS. `videos/out/` n'est pas versionné.

## Grammaire reprise des références

- Pilule en verre où l'on tape, puis bouton qui apparaît et qu'on clique (vidéo « waitlist » Sanctum).
- Fond nuit avec deux lueurs, anneaux qui s'ouvrent sur le temps fort (vidéo « Spark »).
- Téléphones qui tournent en 3D, éléments d'interface qui en sortent, anneau de téléphones (vidéo Phantom).
- Coupes franches sur aplat (« STOP. » caramel), fouets, plongée dans le logo.

## Découpage (YouTube)

| s | Voix | Image |
|---|---|---|
| 0–2,2 | Propriétaire ? Stop. | « Propriétaire ? » tapé dans la pilule ; coupe sur « STOP. » caramel, musique coupée |
| 2,2–8,7 | Fini les modèles… les quittances à la main… les dates oubliées. | « Fini » + un .docx, une quittance manuscrite, un calendrier, barrés sur le temps |
| 8,7–10,2 | Voici Bailio. | temps fort : la musique entre, flash crème, anneaux, logo |
| 10,2–13,4 | Cinq minutes de questions. Un bail conforme à la loi. | « 5 min », téléphone : question vide/meublé puis bail signé |
| 13,4–16,3 | Signé en ligne. Par chacun, sans compte. | Bailleur, Locataire, Garant sortent du téléphone |
| 16,3–19,2 | Chaque mois, la quittance part. Toute seule. | interrupteur « Quittance automatique », quittances en éventail |
| 19,2–21,8 | Le loyer n'arrive pas ? La relance est prête. | carte « Loyer en retard », clic sur « Relire la relance » |
| 21,8–24 | La révision du loyer ? Calculée. | typographie seule |
| 24–26,3 | L'état des lieux ? Sur votre téléphone. | étape « Faire l'état des lieux d'entrée » |
| 26,3–29,5 | Vous louez. Bailio s'occupe du reste. | anneau de dix téléphones |
| 29,5–36 | Premier bail offert. Sur bailio.fr. | logo, pilule « bailio.fr », clic sur « Créer mon bail » |

## Fabriquer

```bash
cd videos/rapide
python3 scripts/assemble.py      # index.html et court/index.html
npx hyperframes@0.8.192 check
npx hyperframes@0.8.192 render -o ../out/raw-rapide-yt.mp4 --fps 30 --video-bitrate 18M
(cd court && npx hyperframes@0.8.192 render -o ../../out/raw-rapide-court.mp4 --fps 30 --video-bitrate 12M)
ffmpeg -i ../out/raw-rapide-yt.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -movflags +faststart ../out/bailio-rapide-1440p.mp4
```

- Voix : ElevenLabs, voix « Paul K — French Ad & Trailer Voice », modèle eleven_v4 (`assets/voix/*-a.mp3`, normalisées
  en `*.wav`, transcriptions `*.words.json`).
- Rythme : ElevenLabs Sound Effects v2, boucle de 30 s à 124 BPM (`assets/musique/beat-b.mp3`) ; `bed-long.wav`
  l'étouffe pendant le « problème », le coupe sur « Stop » et le libère sur « Voici Bailio ».
- Bruitages : Pixabay et studio vidéo (`assets/sfx/CREDITS.md`).
