"""Assemble les deux films Bailio : index.html (YouTube 2560×1440) et court/index.html (9:16, 1080×1920).

`court/` est un second projet HyperFrames qui partage assets/ et compositions/ par liens symboliques.

Chaque film = ses scènes (compositions/), la voix off découpée en phrases (assets/voix/*.wav, ElevenLabs,
voix « Clémence »), la nappe en boucle et les bruitages calés sur leur pic (mesuré avec `hyperframes audio`).
Usage : python3 scripts/assemble.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Pic de chaque bruitage (s) et durée utile (s).
PEAK = {'whoosh.mp3': .162, 'whoosh.wav': .32, 'whoosh2.wav': .452, 'whoosh-cinematic.mp3': 2.503, 'click.mp3': .073,
        'key-press.mp3': .076, 'pop.mp3': .12, 'pop.wav': .004, 'riser.mp3': 3.472, 'impact-bass-1.mp3': .073, 'typing.mp3': .457}
DUR = {'whoosh.mp3': .57, 'whoosh.wav': .7, 'whoosh2.wav': .9, 'whoosh-cinematic.mp3': 4.3, 'click.mp3': .37,
       'key-press.mp3': .43, 'pop.mp3': .6, 'pop.wav': .09, 'riser.mp3': 3.6, 'impact-bass-1.mp3': 2.1, 'typing.mp3': 1.5}

FILMS = {
    'index.html': {
        'w': 2560, 'h': 1440, 'total': 77.0, 'voice': 'assets/voix/yt.wav', 'music_volume': 0.2,
        'label': 'version YouTube 2560×1440',
        'scenes': [('s1', 's1-facade', 0, 5.2), ('s2', 's2-paperasse', 5.2, 10.2), ('s3', 's3-revelation', 15.4, 5.0),
                   ('s4', 's4-calcul', 20.4, 8.4), ('s5', 's5-annonce', 28.8, 6.8), ('s6', 's6-signature', 35.6, 7.8),
                   ('s7', 's7-chaque-mois', 43.4, 11.0), ('s8', 's8-montre', 54.4, 6.2), ('s9', 's9-confiance', 60.6, 5.8),
                   ('s10', 's10-fin', 66.4, 10.6)],
        # (début dans le fichier de voix, fin, début dans le film) : coupes au milieu des silences.
        'vo': [(0.00, 2.85, 0.5), (2.85, 10.75, 5.6), (10.75, 14.45, 15.9), (14.45, 19.75, 21.0), (19.75, 25.40, 29.2),
               (25.40, 32.20, 35.9), (32.20, 41.80, 43.6), (41.80, 45.75, 54.7), (45.75, 50.90, 60.8), (50.90, 53.00, 66.6),
               (53.00, 57.32, 69.4)],
        # (instant du choc à l'image, fichier, volume)
        'sfx': [(4.5, 'whoosh.mp3', .5), (11.35, 'whoosh.wav', .45), (14.75, 'whoosh2.wav', .6), (15.45, 'pop.mp3', .5),
                (15.9, 'whoosh.mp3', .4), (21.35, 'click.mp3', .7), (21.52, 'key-press.mp3', .5), (21.67, 'key-press.mp3', .5),
                (21.82, 'key-press.mp3', .5), (26.72, 'click.mp3', .7), (28.45, 'whoosh.wav', .5), (29.15, 'whoosh2.wav', .35),
                (30.05, 'pop.mp3', .45), (30.83, 'pop.wav', .6), (31.65, 'pop.wav', .6), (32.42, 'pop.wav', .6),
                (38.6, 'pop.wav', .45), (39.23, 'pop.wav', .45), (39.95, 'pop.wav', .45), (42.95, 'whoosh.mp3', .5),
                (46.4, 'whoosh-cinematic.mp3', .55), (48.3, 'whoosh.wav', .4), (53.95, 'whoosh2.wav', .55),
                (54.5, 'whoosh.mp3', .4), (54.85, 'typing.mp3', .35), (56.25, 'typing.mp3', .3), (56.97, 'pop.mp3', .55),
                (60.62, 'whoosh.wav', .45), (62.98, 'whoosh.mp3', .35), (67.7, 'pop.mp3', .5), (69.46, 'riser.mp3', .45),
                (69.46, 'impact-bass-1.mp3', .6), (72.96, 'click.mp3', .75)],
    },
    'court/index.html': {
        'w': 1080, 'h': 1920, 'total': 22.0, 'voice': 'assets/voix/short.wav', 'music_volume': 0.22,
        'label': 'version courte 1080×1920 (réseaux sociaux)', 'deco': True,
        'scenes': [('v1', 'v1-accroche', 0, 2.6), ('v2', 'v2-papiers', 2.6, 3.4), ('v3', 'v3-annonce', 6.0, 1.6),
                   ('v4', 'v4-signature', 7.6, 2.6), ('v5', 'v5-quittances', 10.2, 3.4), ('v6', 'v6-fin', 13.6, 8.4)],
        'vo': [(0.00, 1.65, 0.3), (1.65, 4.35, 2.6), (4.35, 5.25, 6.0), (5.25, 7.00, 7.6), (7.00, 9.25, 10.2), (9.25, 13.0, 13.8)],
        'sfx': [(2.3, 'whoosh.mp3', .5), (2.75, 'whoosh.wav', .4), (6.25, 'whoosh2.wav', .35), (6.75, 'pop.wav', .6),
                (6.9, 'pop.wav', .6), (7.05, 'pop.wav', .6), (8.43, 'pop.wav', .45), (8.78, 'pop.wav', .45), (9.13, 'pop.wav', .45),
                (9.9, 'whoosh.mp3', .45), (10.5, 'whoosh-cinematic.mp3', .5), (13.3, 'whoosh2.wav', .55), (14.85, 'pop.mp3', .55),
                (16.1, 'riser.mp3', .4), (16.1, 'impact-bass-1.mp3', .55), (17.88, 'click.mp3', .75)],
    },
}

LOOP = 16.032  # durée de assets/musique/boucle.wav


def facades(w):
    """Frise de façades au trait, très pâle, pour le bas du format vertical (zone des boutons des applications)."""
    parts, x = [], 30
    for i, (bw, top, cols) in enumerate([(240, 1520, 3), (300, 1460, 4), (230, 1560, 3), (250, 1500, 3)]):
        p = [f'M{x} 1920 V{top} H{x + bw} V1920', f'M{x - 12} {top} H{x + bw + 12}',
             f'M{x + 6} {top} L{x + 30} {top - 60} H{x + bw - 30} L{x + bw - 6} {top}']
        gap = bw / cols
        for c in range(cols):
            for r in range(3):
                wx, wy = x + c * gap + gap * 0.28, top + 40 + r * 120
                p.append(f'M{wx:.0f} {wy} h{gap * 0.44:.0f} v80 h-{gap * 0.44:.0f} Z')
            p.append(f'M{x + c * gap + gap * 0.18:.0f} {top + 130} h{gap * 0.64:.0f}')
        parts.append(' '.join(p))
        x += bw + 18
    d = ' '.join(parts)
    return (f'      <svg id="deco" class="clip" data-start="3.1" data-duration="18.9" data-track-index="2" '
            f'style="position:absolute;left:0;top:0;width:{w}px;height:1920px;z-index:5;pointer-events:none" '
            f'viewBox="0 0 {w} 1920" data-layout-ignore><path d="{d}" fill="none" stroke="#C9C8C1" stroke-width="3" '
            f'stroke-linejoin="round" /></svg>')


def build(name, f):
    w, h, total = f['w'], f['h'], f['total']
    out = []
    for sid, src, st, d in f['scenes']:
        out.append(f'      <div id="{sid}" data-composition-id="{sid}" data-composition-src="compositions/{src}.html" data-start="{st}" '
                   f'data-duration="{d}"\n        data-track-index="1" data-track-kind="graphics" data-width="{w}" data-height="{h}"></div>')
    for i, (a, b, s) in enumerate(f['vo']):
        out.append(f'      <audio id="vo{i + 1}" class="clip" src="{f["voice"]}" data-start="{s}" data-media-start="{a}" '
                   f'data-duration="{round(b - a, 2)}" data-track-index="10" data-volume="1"></audio>')
    m, k = 0.0, 0
    while m < total - 0.01:
        d = min(LOOP, total - m)
        extra = (' data-fade-in="0.4"' if k == 0 else '') + (' data-fade-out="2"' if m + d >= total - 0.01 else '')
        out.append(f'      <audio id="mus{k + 1}" class="clip" src="assets/musique/boucle.wav" data-start="{round(m, 3)}" '
                   f'data-duration="{round(d, 3)}" data-track-index="11" data-volume="{f["music_volume"]}"{extra}></audio>')
        m += LOOP
        k += 1
    for i, (t, fx, v) in enumerate(f['sfx']):
        # Le son arrive une image après l'image (la montée, elle, culmine exactement sur le choc).
        s = t - PEAK[fx] + (0 if fx == 'riser.mp3' else 0.033)
        out.append(f'      <audio id="fx{i + 1}" class="clip" src="assets/sfx/{fx}" data-start="{round(max(s, 0), 3)}" '
                   f'data-duration="{DUR[fx]}" data-track-index="{12 + i % 4}" data-volume="{v}"></audio>')
    if f.get('deco'):
        out.insert(len(f['scenes']), facades(w))
    body = '\n'.join(out)
    html = f'''<!doctype html>
<html lang="fr" data-resolution="custom">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={w}, height={h}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: {w}px; height: {h}px; overflow: hidden; background: #E8E8E3; }}
      #root {{ position: relative; width: 100%; height: 100%; }}
    </style>
  </head>
  <body>
    <!-- Bailio : film de présentation, {f["label"]}. Découpage : SPEC.md. Généré par scripts/assemble.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="{w}" data-height="{h}">
{body}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});
      if (document.getElementById('deco')) tl.fromTo('#deco path', {{ opacity: 0 }}, {{ opacity: 1, duration: 0.6, ease: 'power2.out' }}, 3.1);
      window.__timelines['main'] = tl;
    </script>
  </body>
</html>
'''
    (ROOT / name).write_text(html)


if __name__ == '__main__':
    for name, f in FILMS.items():
        build(name, f)
        print('écrit', name)
