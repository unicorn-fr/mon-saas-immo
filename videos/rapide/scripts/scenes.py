"""Générateur de scènes des films « rapides » (même grammaire que l1…l11 et k1…k6, écrits à la main).

Chaque scène est décrite par un dict ; `render(scene_id, w, h, dur, spec)` renvoie le HTML d'une sous-composition
HyperFrames. Types : hook (pilule où l'on tape, puis aplat qui frappe), words (typographie géante), phone (téléphone 3D
d'où sortent des morceaux d'interface, pastilles, quittances, curseur), ring (anneau de téléphones), logo (temps fort),
end (logo, accroche, pilule « bailio.fr » et bouton cliqué). Toutes les positions sont en pixels du format visé.
"""
import json

BG = {
    'night': '<div class="k-night"><div class="k-glow b" id="{p}-g1" style="left:{g1x}px;top:{g1y}px;width:{gs}px;height:{gs}px"></div>'
             '<div class="k-glow c" id="{p}-g2" style="left:{g2x}px;top:{g2y}px;width:{gs2}px;height:{gs2}px"></div></div>',
    'cream': '', 'blue': '', 'caramel': '',
}
BGCOL = {'night': '#1a1a2e', 'cream': '#faf7f2', 'blue': '#1a3270', 'caramel': '#c4976a'}
CURSOR = ('<svg class="k-cursor" id="{id}" width="{s}" height="{s2}" viewBox="0 0 76 96"><path d="M6 6 L6 78 L24 62 L36 90 L50 84 '
          'L38 57 L62 57 Z" fill="#1a1a2e" stroke="#faf7f2" stroke-width="5" stroke-linejoin="round" /></svg>')


def js(v):
    return json.dumps(v, ensure_ascii=False)


def enter(sel, how, t, d=0.22):
    """Entrée d'un élément : slam (frappe), L/R/U/D (fouet depuis un côté), fade (flou seul)."""
    off = {'L': '{x:-700}', 'R': '{x:700}', 'U': '{y:-500}', 'D': '{y:500}'}
    if how == 'slam':
        return (f"tl.fromTo({js(sel)}, {{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }}, {{ scale: 1, opacity: 1, filter: 'blur(0px)', "
                f"duration: {d}, ease: 'expo.out' }}, {t});")
    if how in off:
        k = 'x' if how in 'LR' else 'y'
        v = {'L': -700, 'R': 700, 'U': -500, 'D': 500}[how]
        return (f"tl.fromTo({js(sel)}, {{ {k}: {v}, opacity: 0, filter: 'blur(20px)' }}, {{ {k}: 0, opacity: 1, filter: 'blur(0px)', "
                f"duration: {d}, ease: 'expo.out' }}, {t});")
    return (f"tl.fromTo({js(sel)}, {{ opacity: 0, filter: 'blur(14px)' }}, {{ opacity: 1, filter: 'blur(0px)', duration: {d}, "
            f"ease: 'expo.out' }}, {t});")


def exit_(how, t, w, h, sel='#{p}-all'):
    if how == 'whipL':
        return f"tl.to('{sel}', {{ x: -{w + 100}, filter: 'blur(30px)', duration: 0.24, ease: 'power3.in' }}, {t});"
    if how == 'whipR':
        return f"tl.to('{sel}', {{ x: {w + 100}, filter: 'blur(30px)', duration: 0.24, ease: 'power3.in' }}, {t});"
    if how == 'whipU':
        return f"tl.to('{sel}', {{ y: -{h + 200}, filter: 'blur(28px)', duration: 0.24, ease: 'power3.in' }}, {t});"
    if how == 'zoom':
        return f"tl.to('{sel}', {{ scale: 2.6, opacity: 0, filter: 'blur(30px)', duration: 0.3, ease: 'power3.in' }}, {t});"
    if how == 'shrink':
        return f"tl.to('{sel}', {{ scale: 0.15, opacity: 0, filter: 'blur(20px)', duration: 0.24, ease: 'power3.in' }}, {t});"
    if how and how.startswith('flood:'):
        return f"tl.fromTo('#{{p}}-flood', {{ scaleY: 0 }}, {{ scaleY: 1, duration: 0.24, ease: 'power3.inOut' }}, {t});"
    return ''


def text_block(p, i, tx):
    """Bloc de texte : {html, x, y, w, size, cls, color, align, at, how, words:[t…] (mot à mot), out}."""
    st = (f"position:absolute;left:{tx.get('x', 0)}px;top:{tx['y']}px;width:{tx.get('w', 2560)}px;font-size:{tx['size']}px;"
          f"color:{tx.get('color', '#faf7f2')};text-align:{tx.get('align', 'left')};")
    if tx.get('shadow'):
        st += 'text-shadow:0 16px 80px rgba(10,10,30,.85);'
    html = f'<div id="{p}-t{i}" class="{tx.get("cls", "k-punch")}" style="{st}" data-layout-allow-overlap>{tx["html"]}</div>'
    code = []
    if tx.get('words'):
        code.append(f"document.querySelectorAll('#{p}-t{i} span').forEach((s) => s.style.display = 'inline-block');")
        for k, t in enumerate(tx['words']):
            code.append(f"tl.fromTo(document.querySelectorAll('#{p}-t{i} span')[{k}], {{ opacity: 0, y: 60, filter: 'blur(12px)' }}, "
                        f"{{ opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.15, ease: 'expo.out' }}, {t});")
    else:
        code.append(enter(f'#{p}-t{i}', tx.get('how', 'slam'), tx['at']))
    if tx.get('out') is not None:
        code.append(f"tl.to('#{p}-t{i}', {{ opacity: 0, filter: 'blur(14px)', duration: 0.12, ease: 'power3.in' }}, {tx['out']});")
    return html, code


def render(p, w, h, dur, s):
    t = s['type']
    bg = s.get('bg', 'night')
    css = [f"#root {{ position: absolute; inset: 0; overflow: hidden; background: {BGCOL[bg]}; }}",
           f"#{p}-all {{ position: absolute; inset: 0; }}",
           f"#{p}-stage {{ position: absolute; inset: 0; perspective: {2400 if w > h else 2200}px; }}"]
    back = BG[bg].format(p=p, g1x=s.get('g1', (-500, -600))[0], g1y=s.get('g1', (-500, -600))[1], gs=int(max(w, h) * 0.7),
                         g2x=s.get('g2', (w - 900, h - 700))[0], g2y=s.get('g2', (w - 900, h - 700))[1], gs2=int(max(w, h) * 0.6))
    body, code = [], []
    if bg == 'night':
        code.append(f"tl.fromTo('#{p}-g1', {{ x: 0 }}, {{ x: {int(w * 0.15)}, duration: {dur}, ease: 'none' }}, 0);")
        code.append(f"tl.fromTo('#{p}-g2', {{ y: 0 }}, {{ y: -{int(h * 0.15)}, duration: {dur}, ease: 'none' }}, 0);")
    elif s.get('glow'):
        gx, gy, gsz = s['glow']
        back = f'<div class="k-glow c" id="{p}-g1" style="left:{gx}px;top:{gy}px;width:{gsz}px;height:{gsz}px;opacity:.6"></div>'
        code.append(f"tl.fromTo('#{p}-g1', {{ x: 0 }}, {{ x: -{int(w * 0.15)}, duration: {dur}, ease: 'none' }}, 0);")

    if t == 'hook':
        px, py, pw, ph = s['pill']
        fs = s.get('size', 120)
        chars = ''.join(f'<span>{c}</span>' for c in s['text'])
        css += [f"#{p}-pill {{ left:{px}px; top:{py}px; width:{pw}px; height:{ph}px; }}",
                f"#{p}-tx {{ position:absolute; left:{int(ph * 0.42)}px; top:0; height:{ph - 6}px; line-height:{ph - 6}px; font-size:{fs}px; color:#faf7f2; white-space:nowrap; }}",
                f"#{p}-tx span {{ display:none; }} #{p}-tx span:first-child {{ display:inline; }}",
                f"#{p}-car {{ display:inline-block; width:{max(5, fs // 18)}px; height:{int(fs * 0.95)}px; background:#faf7f2; vertical-align:-{fs // 9}px; margin-left:8px; }}"]
        body.append(f'<div class="k-glass" id="{p}-pill"><div id="{p}-tx" class="k-ui">{chars}<i id="{p}-car"></i></div></div>')
        code.append(f"tl.fromTo('#{p}-pill', {{ scale: 0.93 }}, {{ scale: 1.04, duration: {s['type_end'] + 0.4}, ease: 'power2.out' }}, 0);")
        n = len(s['text'])
        step = (s['type_end'] - s['type_at']) / max(1, n - 1)
        code.append(f"const ch = document.querySelectorAll('#{p}-tx span'); for (let i = 1; i < ch.length; i++) tl.set(ch[i], {{ display: 'inline' }}, {s['type_at']} + i * {step:.3f});")
        for k, tt in enumerate(s.get('blink', [])):
            code.append(f"tl.set('#{p}-car', {{ opacity: {1 if k % 2 else 0} }}, {tt});")
        if s.get('slam'):
            sl = s['slam']
            css.append(f"#{p}-sl {{ position:absolute; inset:0; background:{BGCOL[sl.get('bg', 'caramel')]}; opacity:0; }}")
            css.append(f"#{p}-sw {{ position:absolute; left:0; width:{w}px; top:{sl['y']}px; text-align:center; font-size:{sl['size']}px; color:{sl.get('color', '#1a1a2e')}; }}")
            body.append(f'<div id="{p}-sl"><div id="{p}-sw" class="{sl.get("cls", "k-punch")}">{sl["html"]}</div></div>')
            code += [f"tl.set('#{p}-sl', {{ opacity: 1 }}, {sl['at']});", f"tl.set('#{p}-n', {{ opacity: 0 }}, {sl['at']});",
                     f"tl.fromTo('#{p}-sw', {{ scale: 1.55, filter: 'blur(14px)' }}, {{ scale: 1, filter: 'blur(0px)', duration: 0.14, ease: 'expo.out' }}, {sl['at']});",
                     f"[-16, 12, -7, 4, 0].forEach((x, i) => tl.to('#{p}-sw', {{ x, duration: 0.035, ease: 'none' }}, {sl['at'] + 0.14} + i * 0.035));"]
        back = f'<div id="{p}-n" style="position:absolute;inset:0">{back}'
        body = [back, *body[:1], '</div>', *body[1:]]
        back = ''

    for i, tx in enumerate(s.get('texts', [])):
        hb, cb = text_block(p, i, tx)
        body.append(hb)
        code += cb

    if t == 'phone':
        body.append(f'<div id="{p}-stage" data-layout-allow-overlap data-layout-allow-overflow>')
        if s.get('typed'):
            ty = s['typed']
            chars = ''.join(f'<span>{c}</span>' for c in ty['text'])
            css += [f"#{p}-tp {{ left:{ty['x']}px; top:{ty['y']}px; width:{ty['w']}px; height:{ty['h']}px; }}",
                f"#{p}-tpx {{ position:absolute; left:{int(ty['h'] * 0.4)}px; top:0; height:{ty['h'] - 6}px; line-height:{ty['h'] - 6}px; font-size:{ty['size']}px; color:#faf7f2; white-space:nowrap; }}",
                f"#{p}-tpx span {{ display:none; }}"]
            body.append(f'<div class="k-glass" id="{p}-tp"><div id="{p}-tpx" class="k-ui">{chars}</div></div>')
            code.append(f"tl.fromTo('#{p}-tp', {{ scaleX: 0.15, opacity: 0 }}, {{ scaleX: 1, opacity: 1, duration: 0.35, ease: 'expo.out' }}, {ty['at'] - 0.25});")
            n = len(ty['text']); step = (ty['end'] - ty['at']) / max(1, n - 1)
            code.append(f"document.querySelectorAll('#{p}-tpx span').forEach((c, i) => tl.set(c, {{ display: 'inline' }}, {ty['at']} + i * {step:.3f}));")
        if s.get('phone'):
            ph = s['phone']
            x, y, pw = ph['x'], ph['y'], ph['w']
            phh = int(pw * 2532 / 1170 * 0.94 / 0.972)
            imgs = ''.join(f'<img id="{p}-i{k}" src="assets/ecrans/{im}.png" alt="" style="object-position:50% {ph.get("pos", [0] * 9)[k] if isinstance(ph.get("pos"), list) else 0}%" />'
                         for k, im in enumerate(ph['screens']))
            css.append(f"#{p}-ph {{ left:{x}px; top:{y}px; width:{pw}px; height:{phh}px; }}")
            body.append(f'<div class="k-phone" id="{p}-ph"><div class="scr">{imgs}</div><div class="isl"></div></div>')
            fr = ph.get('from', 'D')
            start = {'D': f'y: {h + 200}, rotationX: 25', 'U': f'y: -{h + 200}, rotationX: -25', 'L': f'x: -{w}, rotationY: -50', 'R': f'x: {w}, rotationY: 50'}[fr]
            code.append(f"tl.fromTo('#{p}-ph', {{ {start}, rotationZ: {ph.get('rz', 12)} }}, {{ x: 0, y: 0, rotationX: {ph.get('rx', 6)}, rotationY: {ph.get('ry', -16)}, rotationZ: 0, duration: 0.48, ease: 'expo.out' }}, {ph.get('at', 0)});")
            code.append(f"tl.to('#{p}-ph', {{ rotationY: {ph.get('ry2', 8)}, duration: {dur - 0.5}, ease: 'none' }}, {ph.get('at', 0) + 0.48});")
            for k, sw in enumerate(ph.get('swaps', []), start=1):
                code.append(f"tl.set('#{p}-i{k}', {{ opacity: 0 }}, 0); tl.to('#{p}-i{k}', {{ opacity: 1, duration: 0.12, ease: 'none' }}, {sw});")
        for k, pa in enumerate(s.get('parts', [])):
            css.append(f"#{p}-pa{k} {{ left:{pa['x']}px; top:{pa['y']}px; width:{pa['w']}px; }}")
            body.append(f'<div class="k-part" id="{p}-pa{k}"><img src="assets/ecrans/part-{pa["img"]}.png" alt="" /></div>')
            dx = pa.get('dx', 500)
            code.append(f"tl.fromTo('#{p}-pa{k}', {{ x: {dx}, y: {pa.get('dy', 60)}, scale: 0.4, rotationY: {-30 if dx > 0 else 30}, opacity: 0 }}, "
                        f"{{ x: 0, y: 0, scale: 1, rotationY: {pa.get('ry', -6)}, opacity: 1, duration: 0.45, ease: 'expo.out' }}, {pa['at']});")
            if pa.get('out') is not None:
                code.append(f"tl.to('#{p}-pa{k}', {{ y: {h + 200}, rotation: 10, filter: 'blur(18px)', duration: 0.22, ease: 'power3.in' }}, {pa['out']});")
        for k, c in enumerate(s.get('chips', [])):
            body.append(f'<div class="k-chip" id="{p}-c{k}" style="left:{c["x"]}px;top:{c["y"]}px;font-size:{c.get("size", 64)}px"><i style="width:{c.get("size", 64)}px;height:{c.get("size", 64)}px"></i>{c["text"]}</div>')
            code.append(f"tl.fromTo('#{p}-c{k}', {{ x: {c.get('dx', 500)}, scale: 0.3, opacity: 0 }}, {{ x: 0, scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' }}, {c['at']});")
        if s.get('fan'):
            fa = s['fan']
            css.append(f".{p}-q {{ position:absolute; left:{fa['x']}px; top:{fa['y']}px; width:{fa['cw']}px; border-radius:24px; background:#faf7f2; padding:{fa['cw'] // 12}px {fa['cw'] // 11}px; box-shadow:0 30px 70px rgba(0,0,0,.45); }}"
                       f".{p}-q b {{ display:block; font-size:{fa['cw'] // 8}px; color:#1a1a2e; }} .{p}-q span {{ display:block; margin-top:4px; font-size:{fa['cw'] // 10}px; color:#45455a; }}"
                       f".{p}-q em {{ display:flex; align-items:center; gap:10px; margin-top:10px; font-style:normal; font-size:{fa['cw'] // 11}px; color:#1b5e3b; font-weight:700; }}"
                       f".{p}-q em i {{ width:{fa['cw'] // 11}px; height:{fa['cw'] // 11}px; border-radius:50%; background:#1b5e3b; }}")
            for k, (lab, sub, ok, (tx_, ty_, rot)) in enumerate(fa['items']):
                body.append(f'<div class="{p}-q k-ui" id="{p}-q{k}"><b class="k-punch">{lab}</b><span>{sub}</span><em><i></i>{ok}</em></div>')
                code.append(f"tl.fromTo('#{p}-q{k}', {{ x: 0, y: 0, scale: 0.3, opacity: 0, rotation: 0 }}, {{ x: {tx_}, y: {ty_}, scale: {fa.get('scale', 1.2)}, opacity: 1, rotation: {rot}, duration: 0.55, ease: 'expo.out' }}, {fa['at'] + k * fa.get('step', 0.13)});")
        body.append('</div>')
        if s.get('cursor'):
            cu = s['cursor']
            body.append(CURSOR.format(id=f'{p}-cur', s=cu.get('size', 96), s2=int(cu.get('size', 96) * 1.25)))
            code += [f"tl.fromTo('#{p}-cur', {{ x: {w + 60}, y: {h + 60} }}, {{ x: {cu['x']}, y: {cu['y']}, duration: 0.4, ease: 'expo.out' }}, {cu['at']});",
                     f"tl.to('#{p}-cur', {{ scale: 0.85, duration: 0.06, yoyo: true, repeat: 1, ease: 'power2.out' }}, {cu['click']});"]
            if cu.get('press') is not None:
                code.append(f"tl.to('#{p}-pa{cu['press']}', {{ scale: 0.975, duration: 0.06, yoyo: true, repeat: 1, ease: 'power2.out' }}, {cu['click'] + 0.01});")

    if t == 'words' and s.get('check'):
        ck = s['check']
        body.append(f'<svg id="{p}-ok" viewBox="0 0 44 44" style="position:absolute;left:{ck["x"]}px;top:{ck["y"]}px;width:{ck["s"]}px;height:{ck["s"]}px"><circle cx="22" cy="22" r="20" fill="#1b5e3b" /><path id="{p}-tick" d="M12 23 L19 30 L32 15" fill="none" stroke="#faf7f2" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" /></svg>')
        code += [enter(f'#{p}-ok', 'slam', ck['at'], 0.2), f"tl.to('#{p}-tick', {{ strokeDashoffset: 0, duration: 0.2, ease: 'power2.out' }}, {ck['at'] + 0.08});"]

    if t == 'ring':
        css += [f"#{p}-ring {{ position:absolute; left:{w // 2}px; top:{h // 2}px; width:0; height:0; transform-style:preserve-3d; }}",
                f"#{p}-ring .k-phone {{ left:-{s['pw'] // 2}px; top:-{int(s['pw'] * 1.047)}px; width:{s['pw']}px; height:{int(s['pw'] * 2.093)}px; }}",
                f"#{p}-scrim {{ position:absolute; left:{int(w * 0.1)}px; top:{int(h * 0.2)}px; width:{int(w * 0.8)}px; height:{int(h * 0.6)}px; border-radius:50%; background:radial-gradient(ellipse, rgba(26,26,46,.92) 0%, rgba(26,26,46,.75) 45%, rgba(26,26,46,0) 72%); opacity:0; }}"]
        phones = ''.join(f'<div class="k-phone" style="transform:rotateY({k * 36}deg) translateZ({s["r"]}px)"><div class="scr"><img src="assets/ecrans/{im}.png" alt="" /></div><div class="isl"></div></div>'
                         for k, im in enumerate(s['screens']))
        body.insert(0, f'<div id="{p}-stage" data-layout-allow-overlap data-layout-allow-overflow><div id="{p}-ring">{phones}</div></div><div id="{p}-scrim"></div>')
        code += [f"tl.fromTo('#{p}-ring', {{ rotationY: 70, rotationX: -8, z: -{s['r'] * 2} }}, {{ rotationY: -160, z: -{int(s['r'] * 0.8)}, duration: {dur}, ease: 'power2.inOut' }}, 0);",
                 f"tl.to('#{p}-scrim', {{ opacity: 1, duration: 0.2 }}, 0.05);"]

    if t == 'logo':
        lw = s['lw']
        css += [f".{p}-ring {{ position:absolute; left:{w // 2}px; top:{s['ly'] + int(lw * 0.18)}px; width:{lw // 2}px; height:{lw // 2}px; margin:-{lw // 4}px 0 0 -{lw // 4}px; border-radius:50%; }}"]
        body += [f'<div class="{p}-ring" id="{p}-r1" style="border:{lw // 50}px solid #c4976a"></div><div class="{p}-ring" id="{p}-r2" style="border:{lw // 90}px solid #1a3270"></div>',
                 f'<div id="{p}-logo" style="position:absolute;left:{(w - lw) // 2}px;top:{s["ly"]}px;width:{lw}px;height:{int(lw * 0.3618)}px"><img src="assets/logo/bailio-logo.svg" alt="Bailio" style="width:100%;height:100%;display:block" /></div>']
        code += [f"tl.fromTo('#{p}-r1', {{ scale: 0.1, opacity: 1 }}, {{ scale: 4.2, opacity: 0, duration: 0.7, ease: 'expo.out' }}, {s['at'] - 0.04});",
                 f"tl.fromTo('#{p}-r2', {{ scale: 0.1, opacity: 1 }}, {{ scale: 3.2, opacity: 0, duration: 0.8, ease: 'expo.out' }}, {s['at'] + 0.02});",
                 f"tl.fromTo('#{p}-logo', {{ scale: 1.7, opacity: 0, filter: 'blur(24px)' }}, {{ scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.24, ease: 'expo.out' }}, {s['at']});",
                 f"[-12, 9, -5, 0].forEach((x, i) => tl.to('#{p}-logo', {{ x, duration: 0.03, ease: 'none' }}, {s['at'] + 0.25} + i * 0.03));"]

    if t == 'end':
        lw, (px, py, pw, phh) = s['lw'], s['pill']
        fs = s['url_size']
        chars = ''.join(f'<span>{c}</span>' for c in 'bailio.fr')
        css += [f"#{p}-pill {{ left:{px}px; top:{py}px; width:{pw}px; height:{phh}px; }}",
                f"#{p}-url {{ position:absolute; left:{int(phh * 0.4)}px; top:0; height:{phh - 6}px; line-height:{phh - 6}px; font-size:{fs}px; color:#1a1a2e; white-space:nowrap; }}",
                f"#{p}-url span {{ display:none; }} #{p}-url span:first-child {{ display:inline; }}",
                f"#{p}-car {{ display:inline-block; width:6px; height:{int(fs * 0.95)}px; background:#1a1a2e; vertical-align:-{fs // 8}px; margin-left:6px; }}",
                f"#{p}-btn {{ position:absolute; right:{phh // 9}px; top:{phh // 9}px; height:{phh - 2 * (phh // 9) - 6}px; border-radius:999px; background:#1a3270; color:#faf7f2; font-size:{s['btn_size']}px; line-height:{phh - 2 * (phh // 9) - 6}px; padding:0 {s['btn_size']}px; white-space:nowrap; }}"]
        body += [f'<div id="{p}-logo" style="position:absolute;left:{(w - lw) // 2}px;top:{s["ly"]}px;width:{lw}px;height:{int(lw * 0.3618)}px"><img src="assets/logo/bailio-logo.svg" alt="Bailio" style="width:100%;height:100%;display:block" /></div>',
                 f'<div class="k-pill" id="{p}-pill"><div id="{p}-url" class="k-ui">{chars}<i id="{p}-car"></i></div><div id="{p}-btn" class="k-punch">Créer mon bail</div></div>',
                 CURSOR.format(id=f'{p}-cur', s=s.get('cs', 96), s2=int(s.get('cs', 96) * 1.25))]
        a = s['url_at']
        code += [enter(f'#{p}-logo', 'slam', s.get('logo_at', 0.0), 0.24),
                 f"tl.fromTo('#{p}-pill', {{ scaleX: 0.14, opacity: 0 }}, {{ scaleX: 1, opacity: 1, duration: 0.4, ease: 'expo.out' }}, {a - 0.2});",
                 f"const ch = document.querySelectorAll('#{p}-url span'); tl.set(ch[0], {{ opacity: 0 }}, 0); tl.set(ch[0], {{ opacity: 1 }}, {a}); for (let i = 1; i < ch.length; i++) tl.set(ch[i], {{ display: 'inline' }}, {a} + i * 0.07);",
                 f"tl.fromTo('#{p}-btn', {{ scale: 0.2, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(1.6)', transformOrigin: '100% 50%' }}, {a + 0.8});",
                 f"tl.fromTo('#{p}-cur', {{ x: {w + 60}, y: {h + 60} }}, {{ x: {s['cur'][0]}, y: {s['cur'][1]}, duration: 0.45, ease: 'expo.out' }}, {a + 1.0});",
                 f"tl.to('#{p}-cur', {{ scale: 0.85, duration: 0.06, yoyo: true, repeat: 1, ease: 'power2.out' }}, {a + 1.5});",
                 f"tl.to('#{p}-btn', {{ scale: 0.95, backgroundColor: '#0f1f4a', duration: 0.07, yoyo: true, repeat: 1, ease: 'power2.out' }}, {a + 1.51});",
                 f"[{', '.join(str(round(a + 2 + k * 0.4, 2)) for k in range(int((dur - a - 2) / 0.4)))}].forEach((t, i) => tl.set('#{p}-car', {{ opacity: i % 2 ? 1 : 0 }}, t));"]

    flood = ''
    if s.get('exit', '').startswith('flood:'):
        flood = f'<div id="{p}-flood" style="position:absolute;inset:0;background:{BGCOL[s["exit"][6:]]};transform-origin:50% 100%;transform:scaleY(0)"></div>'
    if s.get('exit'):
        code.append(exit_(s['exit'], s['exit_at'], w, h).replace('{p}', p))
    inner = '\n      '.join(body)
    script = '\n      '.join(code)
    return f'''<template>
  <style>
    {chr(10).join('    ' + c for c in css).strip()}
  </style>
  <div id="root" data-composition-id="{p}" data-width="{w}" data-height="{h}">
    {back}
    <div id="{p}-all">
      {inner}
    </div>
    {flood}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      {script}
      window.__timelines['{p}'] = tl;
    }})();
  </script>
</template>
'''
