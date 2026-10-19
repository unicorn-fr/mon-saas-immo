# Studio vidéo de Bailio

Vidéos verticales (1080×1920, TikTok, Reels, Shorts) en motion design aux couleurs de Bailio, avec une voix off
française et des sous-titres intégrés. Tout est fabriqué par du code : aucun montage à la main, aucun visage.

- **Remotion** (React → MP4) : scènes animées dans `src/scenes/` (typographie animée, téléphone avec les vraies pages
  du site, logo, liste, appel à l'action, volets de transition, sous-titres mot à mot).
- **Voix off** : ElevenLabs si `ELEVENLABS_API_KEY` est défini (voix naturelle, mots horodatés pour des sous-titres
  exacts ; `ELEVENLABS_VOICE_ID` pour choisir la voix ; `api.elevenlabs.io` doit être autorisé par le réseau), sinon
  Piper, synthèse libre et hors ligne (voix « siwis », licence CC BY 4.0).
- **Montage** : transitions fouettées, zoom traversant et cercle (`src/transitions.tsx`), textes révélés par masque,
  caméra qui pousse, grain et vignettage (`src/fx.tsx`), bruitages (`public/sfx/`), sous-titres façon réseaux sociaux
  (`src/captions.tsx`). `node scripts/apercu.mjs <id> 30 90 150` : planche d'images sans tout fabriquer.
- **Flèche guide** (`src/guide.tsx`) : un seul curseur pour toute la vidéo ; il se pose sur l'élément important de
  chaque scène, clique, puis file en arc vers la scène suivante pendant la transition (point d'arrivée :
  `guideStop`, `src/scenes/Scenes.tsx`).
- **Cartes flottantes** (verre dépoli) : `notifs` (emails qui descendent sur le téléphone) et `carte` (montant qui
  défile ou barre d'étapes) dans une scène `ecran`.
- **Son** : bruitages ElevenLabs dans `public/sfx/` (souffles, clic, notification), nappe en boucle `musique` dans
  `public/musique/`, son final normalisé à -14 LUFS par `rendu.mjs`.
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

## Voix enregistrée sur le site d'ElevenLabs

Sans accès à l'API : collez le texte des scènes (une phrase par paragraphe, une courte pause entre chaque) sur
elevenlabs.io, téléchargez le MP3, puis :

```bash
node videos/scripts/import-voix.mjs presentation voix.mp3 [mots.json] [--scene N]   # une piste par scène
node videos/scripts/rendu.mjs presentation
```

`mots.json` : la transcription horodatée d'ElevenLabs (Speech to Text) de ce même fichier. Avec elle, la coupure
tombe exactement entre deux phrases et les sous-titres suivent la voix au mot près ; sans elle, découpe aux silences.
Avec le connecteur ElevenLabs de Claude, il suffit de demander : Claude génère la voix, la transcrit et lance l'import.

## Ajouter une vidéo

Copiez `src/videos/presentation.json`, changez les scènes (`mots`, `grand`, `logo`, `ecran`, `liste`, `fin`),
ajoutez-la dans `src/Root.tsx`, puis lancez `voix.mjs` et `rendu.mjs`. Le mot « Bailio » est prononcé « Baïlio »
(règle dans `scripts/voix.mjs`). `sousTitre` remplace le texte affiché quand la voix lit autrement (« bailio point f r »).

## Chaque semaine

Demandez à Claude Code : « Fais les 7 vidéos de la semaine » (thèmes facultatifs). Il écrit les scripts, fabrique les
MP4 et les légendes dans `out/`. Vous les regardez, puis vous les programmez : TikTok (planificateur intégré),
Instagram (Meta Business Suite), YouTube Shorts (YouTube Studio). Ajoutez une musique tendance dans l'application.
