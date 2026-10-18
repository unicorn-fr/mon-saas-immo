# Studio vidéo de Bailio

Vidéos verticales (1080×1920, TikTok, Reels, Shorts) en motion design aux couleurs de Bailio, avec une voix off
française et des sous-titres intégrés. Tout est fabriqué par du code : aucun montage à la main, aucun visage.

- **Remotion** (React → MP4) : scènes animées dans `src/scenes/` (typographie animée, téléphone avec les vraies pages
  du site, logo, liste, appel à l'action, volets de transition, sous-titres mot à mot).
- **Piper** : synthèse vocale libre et hors ligne, voix française « siwis » (licence CC BY 4.0).
- **Une vidéo = un fichier** `src/videos/<id>.json` : la liste des scènes, le texte de la voix off et la légende à
  publier.

## Fabriquer une vidéo

```bash
npm --prefix videos install
# Piper et la voix française (une fois), dans videos/.outils/piper :
mkdir -p videos/.outils/piper && cd videos/.outils/piper
curl -sSL https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz | tar xz
curl -sSL https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-fr-siwis-medium.tar.gz | tar xz
cd -

node videos/scripts/ecrans.mjs          # captures du site (API et site locaux lancés, voir audit/README.md)
node videos/scripts/voix.mjs presentation   # voix off de chaque scène
node videos/scripts/rendu.mjs presentation  # → videos/out/presentation.mp4 et presentation.txt (légende)
npm --prefix videos run studio          # aperçu en direct dans le navigateur, pour régler les animations
```

`CHROMIUM_PATH` : navigateur « headless shell » déjà installé (sinon Remotion le télécharge).

## Ajouter une vidéo

Copiez `src/videos/presentation.json`, changez les scènes (`mots`, `grand`, `logo`, `ecran`, `liste`, `fin`),
ajoutez-la dans `src/Root.tsx`, puis lancez `voix.mjs` et `rendu.mjs`. Le mot « Bailio » est prononcé « Baïlio »
(règle dans `scripts/voix.mjs`). `sousTitre` remplace le texte affiché quand la voix lit autrement (« bailio point f r »).

## Chaque semaine

Demandez à Claude Code : « Fais les 7 vidéos de la semaine » (thèmes facultatifs). Il écrit les scripts, fabrique les
MP4 et les légendes dans `out/`. Vous les regardez, puis vous les programmez : TikTok (planificateur intégré),
Instagram (Meta Business Suite), YouTube Shorts (YouTube Studio). Ajoutez une musique tendance dans l'application.
