"""Assemble les deux films « rapides » de Bailio : index.html (YouTube 2560×1440) et court/index.html (9:16, 1080×1920).

Montage sur la grille du rythme (124 BPM : un temps = 0,4839 s, premier temps à 0,05 s, `beat(n)`) : le « Stop » et
l'arrivée de Bailio tombent sur un temps. Voix « Paul K » (ElevenLabs), rythme généré (ElevenLabs, effets sonores),
bruitages calés sur leur pic. `court/` partage assets/ et compositions/ par liens symboliques.
Usage : python3 scripts/assemble.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def beat(n):
    return round(0.05 + n * 60 / 124, 3)


PEAK = {'whoosh.mp3': .162, 'whoosh.wav': .32, 'whoosh2.wav': .452, 'whoosh-cinematic.mp3': 2.503, 'click.mp3': .073,
        'key-press.mp3': .076, 'pop.mp3': .12, 'pop.wav': .004, 'riser.mp3': 3.472, 'impact-bass-1.mp3': .073,
        'typing.mp3': .457, 'impact.wav': .001}
DUR = {'whoosh.mp3': .57, 'whoosh.wav': .7, 'whoosh2.wav': .9, 'whoosh-cinematic.mp3': 4.3, 'click.mp3': .37,
       'key-press.mp3': .43, 'pop.mp3': .6, 'pop.wav': .09, 'riser.mp3': 3.6, 'impact-bass-1.mp3': 2.1, 'typing.mp3': 1.5,
       'impact.wav': .35}

FILMS = {
    'index.html': {
        'w': 2560, 'h': 1440, 'total': 36.0, 'voice': 'assets/voix/long.wav', 'bed': 'assets/musique/bed-long.wav',
        'label': 'version rapide YouTube 2560×1440',
        'scenes': [('l1', 'l1-stop', 0, 2.25), ('l2', 'l2-fini', 2.25, 6.45), ('l3', 'l3-voici', 8.7, 1.45),
                   ('l4', 'l4-cinq', 10.15, 3.25), ('l5', 'l5-signe', 13.4, 2.9), ('l6', 'l6-quittance', 16.3, 2.9),
                   ('l7', 'l7-relance', 19.2, 2.55), ('l8', 'l8-revision', 21.75, 2.2), ('l9', 'l9-edl', 23.95, 2.35),
                   ('l10', 'l10-reste', 26.3, 3.15), ('l11', 'l11-fin', 29.45, 6.55)],
        # (début dans le fichier de voix, fin, début dans le film)
        'vo': [(0.0, 8.10, 0.33), (8.10, 28.40, 8.59), (28.40, 31.6, 29.47)],
        'sfx': [(0.36, 'typing.mp3', .3), (1.50, 'impact-bass-1.mp3', .8), (2.27, 'whoosh.mp3', .5), (4.15, 'impact.wav', .6),
                (4.87, 'whoosh.wav', .45), (6.25, 'impact.wav', .6), (6.65, 'whoosh2.wav', .45), (7.85, 'impact.wav', .6),
                (8.76, 'riser.mp3', .5), (8.76, 'impact-bass-1.mp3', .7), (10.17, 'whoosh.mp3', .5), (10.75, 'pop.mp3', .5),
                (11.8, 'pop.mp3', .5), (13.42, 'whoosh.wav', .5), (14.7, 'pop.wav', .6), (15.05, 'pop.wav', .6),
                (15.4, 'pop.wav', .6), (16.32, 'whoosh2.wav', .45), (17.6, 'whoosh-cinematic.mp3', .5), (18.42, 'impact.wav', .6),
                (19.22, 'whoosh.mp3', .5), (20.6, 'click.mp3', .8), (21.77, 'whoosh.wav', .5), (23.23, 'impact-bass-1.mp3', .55),
                (23.97, 'whoosh2.wav', .45), (25.1, 'pop.mp3', .5), (26.6, 'whoosh-cinematic.mp3', .5), (29.47, 'whoosh.mp3', .45),
                (30.9, 'typing.mp3', .35), (31.75, 'pop.mp3', .55), (32.45, 'click.mp3', .8)],
    },
    'court/index.html': {
        'w': 1080, 'h': 1920, 'total': 15.5, 'voice': 'assets/voix/court.wav', 'bed': 'assets/musique/bed-court.wav',
        'label': 'version rapide 1080×1920 (réseaux sociaux)',
        'scenes': [('k1', 'k1-stop', 0, 2.1), ('k2', 'k2-bail', 2.1, 2.2), ('k3', 'k3-signe', 4.3, 1.15),
                   ('k4', 'k4-quittances', 5.45, 1.85), ('k5', 'k5-relance', 7.3, 1.4), ('k6', 'k6-fin', 8.7, 6.8)],
        'vo': [(0.0, 12.72, 0.06)],
        'sfx': [(0.09, 'typing.mp3', .3), (1.16, 'impact-bass-1.mp3', .8), (2.12, 'whoosh.mp3', .5), (3.4, 'pop.mp3', .55),
                (4.32, 'whoosh.wav', .5), (4.7, 'pop.wav', .6), (4.95, 'pop.wav', .6), (5.2, 'pop.wav', .6),
                (6.0, 'whoosh-cinematic.mp3', .5), (7.32, 'whoosh2.wav', .45), (8.0, 'click.mp3', .8), (8.76, 'riser.mp3', .5),
                (8.76, 'impact-bass-1.mp3', .7), (11.1, 'typing.mp3', .35), (11.9, 'pop.mp3', .55), (12.6, 'click.mp3', .8)],
    },
}


def build(name, f):
    w, h, total = f['w'], f['h'], f['total']
    out = []
    for sid, src, st, d in f['scenes']:
        out.append(f'      <div id="{sid}" data-composition-id="{sid}" data-composition-src="compositions/{src}.html" data-start="{st}" '
                   f'data-duration="{d}"\n        data-track-index="1" data-track-kind="graphics" data-width="{w}" data-height="{h}"></div>')
    for i, (a, b, s) in enumerate(f['vo']):
        out.append(f'      <audio id="vo{i + 1}" class="clip" src="{f["voice"]}" data-start="{s}" data-media-start="{a}" '
                   f'data-duration="{round(b - a, 2)}" data-track-index="10" data-volume="1"></audio>')
    out.append(f'      <audio id="bed" class="clip" src="{f["bed"]}" data-start="0" data-duration="{total}" data-track-index="11" data-volume="0.3"></audio>')
    for i, (t, fx, v) in enumerate(f['sfx']):
        s = t - PEAK[fx] + (0 if fx == 'riser.mp3' else 0.033)
        out.append(f'      <audio id="fx{i + 1}" class="clip" src="assets/sfx/{fx}" data-start="{round(max(s, 0), 3)}" '
                   f'data-duration="{DUR[fx]}" data-track-index="{12 + i % 4}" data-volume="{v}"></audio>')
    body = '\n'.join(out)
    html = f'''<!doctype html>
<html lang="fr" data-resolution="custom">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={w}, height={h}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <link rel="stylesheet" href="assets/kit.css" />
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: {w}px; height: {h}px; overflow: hidden; background: #1a1a2e; }}
      #root {{ position: relative; width: 100%; height: 100%; }}
    </style>
  </head>
  <body>
    <!-- Bailio : film rapide, {f["label"]}. Découpage : SPEC.md. Généré par scripts/assemble.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="{w}" data-height="{h}">
{body}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines['main'] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
'''
    (ROOT / name).write_text(html)


if __name__ == '__main__':
    for name, f in FILMS.items():
        build(name, f)
        print('écrit', name)
