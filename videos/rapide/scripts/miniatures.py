"""Miniatures YouTube (2560×1440, exportées en 1280×720) et couvertures des versions courtes (1080×1920).

Chaque visuel est une scène fixe HyperFrames, assemblée dans miniatures/ (16:9) et miniatures-court/ (9:16) ;
`npx hyperframes snapshot` en tire les images. Règles : 2 à 4 mots lisibles à la taille d'une vignette, un aplat de
couleur franc, un vrai écran du logiciel, une question ou une promesse.
Usage : python3 scripts/miniatures.py
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INK, CREAM, CAR, BLUE, NIGHT, GREEN = '#1a1a2e', '#faf7f2', '#c4976a', '#1a3270', '#1a1a2e', '#1b5e3b'


def phone(x, y, w, screen, rot='rotateY(-16deg) rotateZ(5deg)', pos=0):
    h = int(w * 2532 / 1170 * 0.94 / 0.972)
    return (f'<div class="k-phone" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;transform:perspective(2400px) {rot}">'
            f'<div class="scr"><img src="assets/ecrans/{screen}.png" alt="" style="object-position:50% {pos}%" /></div><div class="isl"></div></div>')


def part(img, x, y, w, rot='rotate(-3deg)'):
    return f'<div class="k-part" style="left:{x}px;top:{y}px;width:{w}px;transform:{rot};box-shadow:0 50px 120px rgba(10,10,30,.55)"><img src="assets/ecrans/part-{img}.png" alt="" /></div>'


def chip(text, x, y, size, bg='#ffffff', fg=INK, check=True, rot=0):
    ic = f'<i style="width:{size}px;height:{size}px"></i>' if check else ''
    return (f'<div class="k-chip" style="left:{x}px;top:{y}px;font-size:{size}px;background:{bg};color:{fg};transform:rotate({rot}deg);'
            f'padding:{size // 3}px {size // 1.6}px {size // 3}px {size // 2.4}px">{ic}{text}</div>')


def txt(html, x, y, size, color, cls='k-punch', w=2400, align='left', extra=''):
    return (f'<div class="{cls}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;font-size:{size}px;color:{color};'
            f'text-align:{align};{extra}" data-layout-allow-overlap>{html}</div>')


def quit(x, y, w, month, rot):
    return (f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;border-radius:26px;background:#faf7f2;padding:{w // 12}px {w // 11}px;'
            f'box-shadow:0 40px 90px rgba(0,0,0,.5);transform:rotate({rot}deg)" class="k-ui"><b class="k-punch" style="display:block;font-size:{w // 7}px;color:{INK}">Quittance</b>'
            f'<span style="display:block;font-size:{w // 9}px;color:#45455a">{month}</span><em style="display:flex;align-items:center;gap:12px;margin-top:10px;font-style:normal;'
            f'font-size:{w // 10}px;color:{GREEN};font-weight:700"><i style="display:inline-block;width:{w // 10}px;height:{w // 10}px;border-radius:50%;background:{GREEN}"></i>Envoyée</em></div>')


def dossier(x, y, w, name, rot):
    return (f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;border-radius:26px;background:#faf7f2;padding:{w // 12}px {w // 11}px;'
            f'box-shadow:0 40px 90px rgba(0,0,0,.5);transform:rotate({rot}deg)" class="k-ui"><b class="k-punch" style="display:block;font-size:{w // 7}px;color:{INK}">Dossier</b>'
            f'<span style="display:block;font-size:{w // 9}px;color:#45455a">{name}</span><em style="display:flex;align-items:center;gap:12px;margin-top:10px;font-style:normal;'
            f'font-size:{w // 10}px;color:{GREEN};font-weight:700"><i style="display:inline-block;width:{w // 10}px;height:{w // 10}px;border-radius:50%;background:{GREEN}"></i>Complet</em></div>')


def glows(w, h):
    return (f'<div class="k-night"><div class="k-glow b" style="left:-500px;top:-600px;width:{int(w * .75)}px;height:{int(w * .75)}px"></div>'
            f'<div class="k-glow c" style="left:{w - 900}px;top:{h - 800}px;width:{int(w * .6)}px;height:{int(w * .6)}px"></div></div>')


LOGO = '<img src="assets/logo/{f}.svg" alt="Bailio" style="position:absolute;left:{x}px;top:{y}px;width:{w}px" />'
SHADOW = 'text-shadow:0 14px 0 rgba(26,26,46,.18);'

# --------------------------------------------------------------------------- 16:9
W, H = 2560, 1440
THUMBS = {
    # La présentation (motion/) : « Vos locations, sans la paperasse. » (accroche du site).
    'presentation': ('cream', [
        txt('SANS', 110, 120, 380, INK), txt('PAPERASSE.', 110, 470, 300, BLUE, extra='letter-spacing:-0.045em'),
        chip('Bail conforme à la loi', 130, 900, 96), chip('Quittances automatiques', 130, 1110, 96),
        phone(1830, 150, 600, 'bail', 'rotateY(-18deg) rotateZ(6deg)'),
        quit(1540, 760, 430, 'novembre', -10), quit(1640, 1010, 430, 'décembre', 6)]),
    # « Propriétaire ? Stop. »
    'rapide': ('caramel', [
        txt('STOP.', 90, 60, 720, INK, extra='letter-spacing:-0.06em'),
        txt('Votre bail<br />en 5 min', 120, 820, 200, CREAM, extra='line-height:0.98;text-shadow:0 10px 40px rgba(26,26,46,.45)'),
        phone(1880, 120, 600, 'aujourdhui', 'rotateY(-20deg) rotateZ(7deg)'),
        part('retard', 1270, 660, 900, 'rotate(-5deg)'),
        chip('Relance prête', 1520, 1250, 84, rot=-3)]),
    # « Votre logement est vide ? »
    'vide': ('night', [
        txt('LOGEMENT', 110, 110, 280, CREAM, extra='letter-spacing:-0.05em'),
        txt('VIDE ?', 100, 380, 560, CAR, extra='letter-spacing:-0.05em'),
        chip('Louez-le étape par étape', 130, 1050, 100),
        phone(1920, 140, 580, 'annonce', 'rotateY(-18deg) rotateZ(6deg)'),
        dossier(1620, 170, 400, 'Camille R.', -9), dossier(1700, 520, 400, 'Hugo B.', 5), dossier(1600, 870, 400, 'Inès T.', -4)]),
    # « Lundi matin »
    'lundi': ('blue', [
        txt('LUNDI', 110, 90, 420, CREAM, extra='letter-spacing:-0.05em'),
        txt('MATIN :', 110, 450, 300, CREAM, extra='letter-spacing:-0.05em'),
        txt('tout est prêt.', 120, 800, 260, CAR, cls='k-serif'),
        chip('4 actions déjà préparées', 130, 1170, 88),
        phone(1900, 140, 580, 'aujourdhui', 'rotateY(-18deg) rotateZ(6deg)'),
        part('bonjour', 1300, 560, 1000, 'rotate(-4deg)')]),
}

# --------------------------------------------------------------------------- 9:16 (couvertures des versions courtes)
VW, VH = 1080, 1920
COVERS = {
    'presentation': ('cream', [
        txt('SANS', 0, 200, 300, INK, w=VW, align='center'), txt('PAPERASSE.', 0, 480, 190, BLUE, w=VW, align='center', extra='letter-spacing:-0.045em'),
        phone(330, 760, 420, 'bail', 'rotateY(-12deg) rotateZ(4deg)'), quit(90, 900, 360, 'novembre', -10), quit(650, 1080, 360, 'décembre', 8)]),
    'rapide': ('caramel', [
        txt('STOP.', 0, 190, 380, INK, w=VW, align='center', extra='letter-spacing:-0.06em'),
        txt('Votre bail en 5 min', 0, 600, 96, CREAM, w=VW, align='center', extra='text-shadow:0 8px 30px rgba(26,26,46,.45)'),
        phone(340, 780, 400, 'aujourdhui', 'rotateY(-12deg) rotateZ(5deg)'), part('retard', 70, 900, 940, 'rotate(-4deg)')]),
    'vide': ('night', [
        txt('LOGEMENT', 0, 200, 190, CREAM, w=VW, align='center', extra='letter-spacing:-0.05em'),
        txt('VIDE ?', 0, 390, 320, CAR, w=VW, align='center', extra='letter-spacing:-0.05em'),
        phone(340, 780, 400, 'annonce', 'rotateY(-12deg) rotateZ(5deg)'),
        dossier(60, 860, 360, 'Camille R.', -9), dossier(660, 1000, 360, 'Hugo B.', 7)]),
    'lundi': ('blue', [
        txt('LUNDI MATIN :', 0, 200, 150, CREAM, w=VW, align='center', extra='letter-spacing:-0.05em'),
        txt('tout est prêt.', 0, 400, 170, CAR, cls='k-serif', w=VW, align='center'),
        phone(340, 780, 400, 'aujourdhui', 'rotateY(-12deg) rotateZ(5deg)'), part('bonjour', 60, 900, 960, 'rotate(-4deg)')]),
}

BGC = {'cream': CREAM, 'caramel': CAR, 'night': NIGHT, 'blue': BLUE}


def scene(sid, w, h, bg, items):
    back = glows(w, h) if bg == 'night' else (f'<div class="k-glow c" style="left:{w - 1200}px;top:{h - 900}px;width:{int(w * .55)}px;height:{int(w * .55)}px;opacity:.5"></div>' if bg in ('blue', 'cream') else '')
    return f'''<template>
  <style>
    #root {{ position: absolute; inset: 0; overflow: hidden; background: {BGC[bg]}; }}
  </style>
  <div id="root" data-composition-id="{sid}" data-width="{w}" data-height="{h}">
    {back}
    {chr(10).join('    ' + i for i in items).strip()}
  </div>
  <script>
    window.__timelines['{sid}'] = gsap.timeline({{ paused: true }});
  </script>
</template>
'''


def project(dirname, w, h, defs, prefix):
    d = ROOT / dirname
    d.mkdir(exist_ok=True)
    for link in ('assets', 'compositions'):
        if not (d / link).exists():
            os.symlink(f'../{link}', d / link)
    (d / 'hyperframes.json').write_text((ROOT / 'hyperframes.json').read_text())
    hosts = []
    for k, (name, (bg, items)) in enumerate(defs.items()):
        sid = f'{prefix}-{name}'
        (ROOT / 'compositions' / f'{sid}.html').write_text(scene(sid, w, h, bg, items))
        hosts.append(f'      <div id="{sid}" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" data-start="{k}" data-duration="1" '
                     f'data-track-index="1" data-track-kind="graphics" data-width="{w}" data-height="{h}"></div>')
    (d / 'index.html').write_text(f'''<!doctype html>
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
    <!-- Miniatures Bailio : une image par seconde ({", ".join(defs)}). Généré par scripts/miniatures.py. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{len(defs)}" data-width="{w}" data-height="{h}">
{chr(10).join(hosts)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines['main'] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
''')
    print('écrit', dirname, list(defs))


if __name__ == '__main__':
    project('miniatures', W, H, THUMBS, 'm')
    project('miniatures-court', VW, VH, COVERS, 'mc')
