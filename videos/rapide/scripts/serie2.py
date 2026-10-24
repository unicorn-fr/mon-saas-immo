"""Série 2 des films rapides : « Votre logement est vide ? » et « Lundi matin », chacun en 16:9 et en 9:16.

Les scènes sont décrites ici et rendues par scenes.py ; les bruitages sont déduits des apparitions (souffle à chaque
changement de scène, petit choc quand un élément sort du téléphone, clic du curseur, montée et impact sur le logo).
Usage : python3 scripts/serie2.py   → compositions/{a,b,c,d}*.html et vide/, vide-court/, lundi/, lundi-court/
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))
import assemble  # noqa: E402
import scenes  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
W, H = 2560, 1440
VW, VH = 1080, 1920


def t(html, y, size, at=None, x=150, w=None, cls='k-punch', color='#faf7f2', align='left', how='slam', words=None, out=None, shadow=False, ww=W):
    d = dict(html=html, y=y, size=size, x=x, w=w or (ww - x - 60 if align == 'left' else ww), cls=cls, color=color, align=align, how=how, out=out, shadow=shadow)
    if align == 'center':
        d['x'] = 0
        d['w'] = ww
    if words:
        d['words'] = words
    else:
        d['at'] = at
    return d


def spans(text):
    return ' '.join(f'<span>{w}</span>' for w in text.split(' '))


INK, CREAM, CAR, BLUE, CARI = '#1a1a2e', '#faf7f2', '#c4976a', '#1a3270', '#8a5f36'
END16 = dict(type='end', bg='cream', glow=(1500, 500, 1600), lw=900, ly=170, pill=(530, 900, 1500, 200), url_size=100, btn_size=62, cur=(1978, 1048))
END9 = dict(type='end', bg='cream', glow=(200, 900, 1300), lw=760, ly=330, pill=(60, 1080, 960, 170), url_size=78, btn_size=50, cur=(960, 1210), cs=84)
DOSSIERS = [('Dossier', 'Camille R.', 'Pièces déposées'), ('Dossier', 'Hugo B.', 'Pièces déposées'), ('Dossier', 'Inès T.', 'Pièces déposées'), ('Dossier', 'Léo M.', 'Pièces déposées')]
MOIS = ['novembre', 'décembre', 'janvier', 'février', 'mars', 'avril']

# ------------------------------------------------------------------ « Votre logement est vide ? » — 16:9
A = [
    ('a1', 0.0, 1.72, dict(type='hook', bg='night', pill=(430, 600, 1700, 240), size=118, text='Votre logement est vide ?', type_at=0.32, type_end=1.25,
                           exit='flood:caramel', exit_at=1.5)),
    ('a2', 1.72, 3.03, dict(type='words', bg='caramel', texts=[
        t('Chaque mois', 260, 230, 0.02, color=INK), t('sans locataire,', 560, 170, 0.8, cls='k-serif', color=INK),
        t('un loyer perdu.', 820, 230, 2.0, color=INK)], exit='zoom', exit_at=2.72)),
    ('a3', 4.75, 3.05, dict(type='logo', bg='cream', lw=1300, ly=520, at=0.47, texts=[
        t('Avec', 330, 110, 0.2, color=INK, align='center'),
        t(spans('étape par étape.'), 1080, 150, cls='k-serif', color=BLUE, align='center', words=[1.93, 2.24, 2.49])], exit='zoom', exit_at=2.8)),
    ('a4', 7.8, 4.4, dict(type='phone', bg='night', phone=dict(x=1840, y=134, w=560, screens=['tunnel-type', 'annonce'], swaps=[1.75], ry=-18, ry2=-6),
                          parts=[dict(img='meuble', x=1150, y=520, w=720, at=0.55, out=1.6), dict(img='annonce-tete', x=1150, y=300, w=860, at=1.85),
                                 dict(img='loyer', x=1150, y=700, w=760, at=2.85)],
                          texts=[t('Décrivez-le<br />une fois.', 230, 210, 0.05, out=1.68), t('Annonce<br />prête.', 230, 190, 1.8),
                                 t('Mentions<br />obligatoires<br />comprises.', 760, 120, 2.78, cls='k-serif', color=CAR, w=850)],
                          exit='whipL', exit_at=4.15)),
    ('a5', 12.2, 2.9, dict(type='phone', bg='cream', phone=dict(x=1880, y=134, w=560, screens=['annonce'], from_='R', ry=18, ry2=8),
                           chips=[dict(text='Leboncoin', x=170, y=700, at=1.05, size=80, dx=-400), dict(text='SeLoger', x=170, y=920, at=1.76, size=80, dx=-400),
                                  dict(text='PAP', x=170, y=1140, at=2.43, size=80, dx=-400)],
                           texts=[t('Copiez.', 230, 300, 0.12, color=INK), t('Publiez où vous voulez.', 520, 90, 0.5, cls='k-ui', color='#45455a')],
                           exit='whipU', exit_at=2.65)),
    ('a6', 15.1, 3.0, dict(type='phone', bg='night', typed=dict(x=1300, y=240, w=1180, h=150, size=56, text='bailio.fr/candidature/studio-sete', at=0.5, end=1.5),
                           fan=dict(x=1600, y=520, cw=400, at=1.25, step=0.16, scale=1.15,
                                    items=[(a, b, c, pos) for (a, b, c), pos in zip(DOSSIERS, [(-420, 80, -8), (60, 40, 6), (-360, 420, 5), (120, 400, -6)])]),
                           texts=[t('Les candidats', 230, 170, 0.3), t('envoient leur dossier<br />par un simple lien.', 560, 120, 1.3, cls='k-serif', color=CAR, w=1000)],
                           exit='zoom', exit_at=2.72)),
    ('a7', 18.1, 3.7, dict(type='phone', bg='blue', glow=(1300, -400, 1800), phone=dict(x=170, y=134, w=560, screens=['bail'], from_='L', ry=22, ry2=10),
                           parts=[dict(img='signe', x=900, y=520, w=940, at=1.4, dx=-500, ry=6)],
                           texts=[t('Vous choisissez.', 140, 190, 0.1, x=900), t('Le bail reprend tout,<br />sans rien ressaisir.', 900, 130, 1.25, x=905, cls='k-serif', color=CAR, w=1600)],
                           exit='whipL', exit_at=3.45)),
    ('a8', 21.8, 2.8, dict(type='phone', bg='cream', phone=dict(x=1880, y=134, w=560, screens=['logement'], ry=18, ry2=6),
                           chips=[dict(text='Bailleur', x=1180, y=230, at=0.55, size=64), dict(text='Locataire', x=1180, y=420, at=0.8, size=64)],
                           parts=[dict(img='edl', x=1120, y=640, w=920, at=1.35)],
                           texts=[t('Signature<br />en ligne.', 230, 210, 0.16, color=INK), t('État des lieux,<br />sur votre téléphone.', 800, 120, 1.3, cls='k-serif', color=BLUE, w=950)],
                           exit='whipU', exit_at=2.55)),
    ('a9', 24.6, 3.7, dict(type='ring', bg='night', pw=420, r=1150, screens=['logement', 'annonce', 'bail', 'aujourdhui', 'tunnel-type', 'courriers', 'argent', 'logement', 'annonce', 'bail'],
                           texts=[t('Chaque étape,', 330, 230, 0.48, align='center', shadow=True), t('dans l’ordre.', 610, 210, 1.52, cls='k-serif', color=CAR, align='center', shadow=True),
                                  t('Aucune oubliée.', 900, 150, 2.28, align='center', shadow=True)],
                           exit='flood:cream', exit_at=3.45)),
    ('a10', 28.3, 6.2, dict(END16, url_at=1.96, logo_at=0.0, texts=[t('<span>Premier</span> <span>bail</span> <span style="color:#1a3270">offert.</span>', 590, 150, color=INK, align='center', words=[0.2, 0.62, 1.04])])),
]

# ------------------------------------------------------------------ « Lundi matin » — 16:9
B = [
    ('b1', 0.0, 1.45, dict(type='hook', bg='night', pill=(630, 600, 1300, 240), size=124, text='Lundi matin.', type_at=0.34, type_end=0.9,
                           exit='flood:cream', exit_at=1.22)),
    ('b2', 1.45, 1.5, dict(type='logo', bg='cream', lw=1300, ly=560, at=0.82, texts=[t('Vous ouvrez', 340, 120, 0.05, color=INK, align='center')], exit='zoom', exit_at=1.25)),
    ('b3', 2.95, 2.45, dict(type='phone', bg='night', phone=dict(x=1880, y=134, w=560, screens=['aujourdhui'], ry=-16, ry2=-4),
                            parts=[dict(img='bonjour', x=1260, y=300, w=1000, at=0.3)],
                            texts=[t('4 actions', 230, 230, 0.24), t('cette semaine.', 600, 150, 1.19, cls='k-serif', color=CREAM),
                                   t('Déjà préparées.', 830, 170, 1.79, cls='k-serif', color=CAR)], exit='whipL', exit_at=2.2)),
    ('b4', 5.4, 3.0, dict(type='phone', bg='blue', glow=(1200, -400, 1800), phone=dict(x=170, y=134, w=560, screens=['aujourdhui'], from_='L', ry=22, ry2=10),
                          parts=[dict(img='retard', x=900, y=250, w=980, at=0.3, dx=-650, ry=6)],
                          cursor=dict(x=1160, y=770, at=1.9, click=2.3, press=0),
                          texts=[t('Un loyer en retard ?', 70, 116, 0.14, x=900), t('La relance est <b style="color:#c4976a;font-weight:700">écrite.</b>', 1120, 150, 1.74, x=905, cls='k-serif')],
                          exit='whipU', exit_at=2.75)),
    ('b5', 8.4, 2.2, dict(type='phone', bg='night', phone=dict(x=1320, y=134, w=560, screens=['bail'], pos=[62], ry=-14, ry2=12),
                          parts=[dict(img='quittance-auto', x=470, y=420, w=820, at=0.4, dx=900)],
                          fan=dict(x=1420, y=600, cw=380, at=0.9, step=0.12, scale=1.25,
                                   items=[('Quittance', m, 'Envoyée', (620 + (k % 3) * 110, -560 + k * 180, -12 + (k % 4) * 7)) for k, m in enumerate(MOIS)]),
                          texts=[t('Une quittance ?', 150, 140, 0.24), t('Elle part<br />toute seule.', 960, 150, 1.4, cls='k-serif', color=CAR, w=1100)],
                          exit='flood:cream', exit_at=1.96)),
    ('b6', 10.6, 5.8, dict(type='phone', bg='cream', phone=dict(x=1880, y=134, w=560, screens=['courriers'], ry=18, ry2=6),
                           parts=[dict(img='courrier', x=1250, y=360, w=760, at=0.4)],
                           cursor=dict(x=1434, y=890, at=0.9, click=1.3, press=0),
                           texts=[t('Un reçu,', 160, 120, 0.07, color=INK), t('un avis d’échéance,', 320, 120, 1.08, color=INK), t('un congé ?', 480, 120, 2.5, color=INK),
                                  t('Le courrier est rédigé.', 820, 140, 3.07, cls='k-serif', color=BLUE, w=950), t('Selon la loi.', 1100, 110, 4.7, color=CARI)],
                           exit='whipL', exit_at=5.55)),
    ('b7', 16.4, 3.8, dict(type='phone', bg='night', phone=dict(x=1880, y=134, w=560, screens=['aujourdhui'], ry=-16, ry2=-4),
                           parts=[dict(img='bonjour', x=1000, y=300, w=1100, at=0.3)],
                           cursor=dict(x=1550, y=749, at=0.6, click=0.95, press=0),
                           texts=[t('Une<br />question ?', 200, 190, 0.14, w=900), t('« Que se passe-t-il ? »<br />vous guide, pas à pas.', 760, 120, 2.1, cls='k-serif', color=CAR, w=1700)],
                           exit='zoom', exit_at=3.55)),
    ('b8', 20.2, 3.2, dict(type='words', bg='caramel', texts=[t('Fini les tableurs.', 300, 200, 0.34, color=INK, align='center'),
                                                              t('Fini les rappels<br />dans l’agenda.', 620, 200, 1.5, color=INK, align='center')], exit='zoom', exit_at=2.95)),
    ('b9', 23.4, 2.6, dict(type='ring', bg='night', pw=420, r=1150, screens=['aujourdhui', 'bail', 'courriers', 'argent', 'logement', 'annonce', 'tunnel-type', 'aujourdhui', 'courriers', 'bail'],
                           texts=[t('Juste vos logements.', 420, 200, 0.14, align='center', shadow=True), t('Et votre temps.', 700, 230, 1.37, cls='k-serif', color=CAR, align='center', shadow=True)],
                           exit='flood:cream', exit_at=2.35)),
    ('b10', 26.0, 7.0, dict(END16, url_at=2.6, logo_at=0.0, texts=[t('<span>Premier</span> <span>bail</span> <span style="color:#1a3270">offert.</span>', 590, 150, color=INK, align='center', words=[0.43, 1.0, 1.5])])),
]


def tv(*a, **k):
    k.setdefault('ww', VW)
    k.setdefault('align', 'center')
    return t(*a, **k)


# ------------------------------------------------------------------ « Votre logement est vide ? » — 9:16
C = [
    ('c1', 0.0, 1.45, dict(type='hook', bg='night', pill=(50, 760, 980, 170), size=70, text='Votre logement est vide ?', type_at=0.06, type_end=0.95, exit='flood:cream', exit_at=1.22)),
    ('c2', 1.45, 2.5, dict(type='logo', bg='cream', lw=760, ly=420, at=0.07, texts=[tv('vous guide,', 820, 120, 0.86, cls='k-serif', color=BLUE),
                                                                                   tv('étape par étape.', 980, 120, 1.45, color=INK)], exit='zoom', exit_at=2.25)),
    ('c3', 3.95, 3.35, dict(type='phone', bg='night', phone=dict(x=350, y=600, w=380, screens=['annonce'], ry=-12, ry2=10),
                            parts=[dict(img='annonce-tete', x=80, y=700, w=920, at=0.4, dy=120, dx=0, out=1.62)],
                            fan=dict(x=390, y=860, cw=320, at=2.0, step=0.14, scale=1.1,
                                     items=[(a, b, c, pos) for (a, b, c), pos in zip(DOSSIERS, [(-300, -160, -10), (300, -100, 8), (-320, 200, 6), (300, 260, -6)])]),
                            texts=[tv('L’annonce', 200, 150, 0.29, out=1.6), tv('est prête.', 370, 160, 0.98, cls='k-serif', color=CAR, out=1.6),
                                   tv('Les candidats', 200, 130, 1.73), tv('arrivent par un lien.', 360, 120, 2.5, cls='k-serif', color=CAR)],
                            exit='whipL', exit_at=3.1)),
    ('c4', 7.3, 1.8, dict(type='phone', bg='cream', phone=dict(x=350, y=540, w=380, screens=['bail'], ry=-10, ry2=8),
                          chips=[dict(text='Bailleur', x=60, y=640, at=0.9, size=58), dict(text='Locataire', x=520, y=880, at=1.1, size=58, dx=-400),
                                 dict(text='Garant', x=100, y=1110, at=1.3, size=58)],
                          texts=[tv('Le bail', 200, 150, 0.14, color=INK), tv('se signe en ligne.', 370, 130, 0.74, cls='k-serif', color=BLUE)],
                          exit='whipU', exit_at=1.58)),
    ('c5', 9.1, 5.9, dict(END9, url_at=1.63, logo_at=0.0, texts=[tv(spans('Premier bail') + '<br /><span style="color:#1a3270">offert.</span>', 740, 130, color=INK, words=[0.13, 0.7, 1.02])])),
]

# ------------------------------------------------------------------ « Lundi matin » — 9:16
D = [
    ('d1', 0.0, 1.2, dict(type='hook', bg='night', pill=(140, 760, 800, 170), size=84, text='Lundi matin.', type_at=0.08, type_end=0.55, exit='zoom', exit_at=0.98)),
    ('d2', 1.2, 2.2, dict(type='phone', bg='night', phone=dict(x=350, y=620, w=380, screens=['aujourdhui'], ry=-12, ry2=10),
                          parts=[dict(img='bonjour', x=60, y=700, w=960, at=0.3, dx=0, dy=150)],
                          texts=[tv('4 actions', 190, 220, 0.08), tv('déjà préparées.', 430, 140, 1.1, cls='k-serif', color=CAR)], exit='whipL', exit_at=1.98)),
    ('d3', 3.4, 2.0, dict(type='phone', bg='blue', glow=(200, 800, 1400), phone=dict(x=350, y=600, w=380, screens=['aujourdhui'], from_='L', ry=12, ry2=4),
                          parts=[dict(img='retard', x=90, y=780, w=900, at=0.35, dx=0, dy=150)], cursor=dict(x=330, y=1255, at=1.1, click=1.5, size=84, press=0),
                          texts=[tv('La relance :', 200, 140, 0.18), tv('écrite.', 370, 200, 1.38, cls='k-serif', color=CAR)], exit='whipU', exit_at=1.78)),
    ('d4', 5.4, 2.0, dict(type='phone', bg='night', phone=dict(x=350, y=380, w=380, screens=['bail'], pos=[62], ry=-8, ry2=8),
                          fan=dict(x=400, y=700, cw=300, at=0.45, step=0.1, scale=1.15,
                                   items=[('Quittance', m, 'Envoyée', p) for m, p in zip(MOIS, [(-330, -300, -14), (330, -250, 12), (-350, -60, -8), (340, -10, 10), (-310, 170, -12), (320, 210, 14)])]),
                          texts=[tv('La quittance :', 190, 130, 0.18), tv('envoyée.', 1150, 200, 1.38, cls='k-serif', color=CAR)], exit='whipR', exit_at=1.78)),
    ('d5', 7.4, 2.1, dict(type='phone', bg='cream', phone=dict(x=350, y=620, w=380, screens=['courriers'], ry=-10, ry2=8),
                          parts=[dict(img='courrier', x=80, y=780, w=920, at=0.4, dx=0, dy=150)],
                          texts=[tv('Le courrier :', 200, 140, 0.18, color=INK), tv('rédigé.', 370, 200, 1.46, cls='k-serif', color=BLUE)], exit='zoom', exit_at=1.85)),
    ('d6', 9.5, 6.0, dict(END9, url_at=2.54, logo_at=0.08, texts=[tv(spans('Premier bail') + '<br /><span style="color:#1a3270">offert.</span>', 740, 130, color=INK, words=[0.75, 1.48, 1.9])])),
]

FILMS = {
    'vide/index.html': dict(w=W, h=H, total=34.5, scenes=A, voice='assets/voix/vide-long.wav', bed='assets/musique/bed-vide-long.wav',
                            vo=[(0.0, 4.40, 0.3), (4.40, 27.55, 4.815), (27.55, 30.88, 28.345)], label='« Votre logement est vide ? », YouTube 2560×1440'),
    'lundi/index.html': dict(w=W, h=H, total=33.0, scenes=B, voice='assets/voix/lundi-long.wav', bed='assets/musique/bed-lundi-long.wav',
                             vo=[(0.0, 2.45, 0.3), (2.45, 25.3, 2.95), (25.3, 28.88, 26.2)], label='« Lundi matin », YouTube 2560×1440'),
    'vide-court/index.html': dict(w=VW, h=VH, total=15.0, scenes=C, voice='assets/voix/vide-court.wav', bed='assets/musique/bed-vide-court.wav',
                                  vo=[(0.0, 12.24, 0.04)], label='« Votre logement est vide ? », 9:16'),
    'lundi-court/index.html': dict(w=VW, h=VH, total=15.5, scenes=D, voice='assets/voix/lundi-court.wav', bed='assets/musique/bed-lundi-court.wav',
                                   vo=[(0.0, 13.84, 0.04)], label='« Lundi matin », 9:16'),
}

WHOOSH = ['whoosh.mp3', 'whoosh.wav', 'whoosh2.wav']


def sfx_for(scs):
    """Bruitages déduits des apparitions : (instant, fichier, volume)."""
    out = []
    for i, (sid, st, d, s) in enumerate(scs):
        if i:
            out.append((st + 0.02, WHOOSH[i % 3], 0.45))
        ty = s['type']
        if ty == 'hook':
            out.append((st + s['type_at'], 'typing.mp3', 0.3))
        if ty == 'logo':
            out += [(st + s['at'], 'riser.mp3', 0.45), (st + s['at'], 'impact-bass-1.mp3', 0.7)]
        for pa in s.get('parts', []):
            out.append((st + pa['at'] + 0.1, 'pop.mp3', 0.45))
        for c in s.get('chips', []):
            out.append((st + c['at'] + 0.1, 'pop.wav', 0.6))
        if s.get('fan'):
            out.append((st + s['fan']['at'] + 0.4, 'whoosh-cinematic.mp3', 0.45))
        if s.get('typed'):
            out.append((st + s['typed']['at'], 'typing.mp3', 0.3))
        if s.get('cursor'):
            out.append((st + s['cursor']['click'], 'click.mp3', 0.8))
        if ty == 'end':
            a = s['url_at']
            out += [(st + a, 'typing.mp3', 0.35), (st + a + 0.85, 'pop.mp3', 0.55), (st + a + 1.5, 'click.mp3', 0.8)]
    return sorted((round(x, 3), f, v) for x, f, v in out)


def main():
    for name, f in FILMS.items():
        d = ROOT / name.split('/')[0]
        d.mkdir(exist_ok=True)
        for link in ('assets', 'compositions'):
            if not (d / link).exists():
                os.symlink(f'../{link}', d / link)
        (d / 'hyperframes.json').write_text((ROOT / 'hyperframes.json').read_text())
        names = []
        for sid, st, dur, spec in f['scenes']:
            spec = dict(spec)
            if 'phone' in spec and 'from_' in spec['phone']:
                spec['phone'] = dict(spec['phone'], **{'from': spec['phone']['from_']})
            (ROOT / 'compositions' / f'{sid}.html').write_text(scenes.render(sid, f['w'], f['h'], dur, spec))
            names.append((sid, sid, st, dur))
        film = dict(w=f['w'], h=f['h'], total=f['total'], voice=f['voice'], bed=f['bed'], label=f['label'], scenes=names, vo=f['vo'],
                    sfx=sfx_for(f['scenes']))
        assemble.build(name, film)
        print('écrit', name, len(names), 'scènes')


if __name__ == '__main__':
    main()
