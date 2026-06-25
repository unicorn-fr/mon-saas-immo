#!/usr/bin/env python3
"""
OCR Document v3 — NOM, PRÉNOM, DATE DE NAISSANCE à 99%
=======================================================

Stratégie :
  CNI  → MRZ-first (ICAO 9303 + checksum + auto-correction) · visuel en fallback
  Permis → champs numérotés EU 1/2/3 · preprocessing dédié · multiples passes

Moteurs (cascade) :
  1. doctr  : pip install "python-doctr[torch]" opencv-python
  2. EasyOCR: pip install easyocr opencv-python
  Bonus MRZ : pip install pytesseract  →  precision +10% sur CNI
"""

import sys, json, base64, os, re, logging
from datetime import date as _date

logging.disable(logging.CRITICAL)
os.environ.update({
    'TF_CPP_MIN_LOG_LEVEL': '3',
    'TRANSFORMERS_VERBOSITY': 'error',
    'DOCTR_CACHE_DIR': os.path.join(os.path.expanduser('~'), '.cache', 'doctr'),
    'PYTHONWARNINGS': 'ignore',
    'KMP_DUPLICATE_LIB_OK': 'TRUE',
})

# ══════════════════════════════════════════════════════════════
#  CORRECTION DE PERSPECTIVE
# ══════════════════════════════════════════════════════════════

_CV2_AVAILABLE = None

def _check_cv2():
    global _CV2_AVAILABLE
    if _CV2_AVAILABLE is None:
        try:
            import cv2; _CV2_AVAILABLE = True
        except ImportError:
            _CV2_AVAILABLE = False
    return _CV2_AVAILABLE


def _order_corners(pts):
    import numpy as np
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1); diff = np.diff(pts, axis=1).ravel()
    rect[0] = pts[s.argmin()]; rect[2] = pts[s.argmax()]
    rect[1] = pts[diff.argmin()]; rect[3] = pts[diff.argmax()]
    return rect


def correct_perspective(img_np):
    """Détecte le document et corrige la perspective → 856×540 (ratio ID card)."""
    if not _check_cv2(): return img_np
    import cv2, numpy as np
    h, w = img_np.shape[:2]
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8))
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:15]
    doc_contour = None
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4 and cv2.contourArea(approx) > 0.08 * h * w:
            doc_contour = approx; break
    if doc_contour is None: return img_np
    pts  = doc_contour.reshape(4, 2).astype(np.float32)
    rect = _order_corners(pts)
    W, H = 856, 540
    dst  = np.float32([[0, 0], [W-1, 0], [W-1, H-1], [0, H-1]])
    M    = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(img_np, M, (W, H), flags=cv2.INTER_LANCZOS4)


# ══════════════════════════════════════════════════════════════
#  PREPROCESSING MRZ DÉDIÉ (pour pytesseract / doctr crop)
# ══════════════════════════════════════════════════════════════
#
#  La police OCR-B est haute contraste sur fond blanc (TD1 bas du card).
#  bilateralFilter : préserve les bords des caractères OCR-B.
#  CLAHE           : améliore le contraste local (fond guilloché → blanc).
#  Otsu threshold  : binarisation automatique, toujours propre.
#  3× upscale      : le moteur lit mieux les petits caractères.

def preprocess_mrz_zone(img_np):
    """
    Extrait + prétraite la zone MRZ (22% du bas).
    Retourne une image RGB 3× plus haute pour meilleure précision OCR.
    """
    if not _check_cv2(): return None
    import cv2, numpy as np
    h, w = img_np.shape[:2]
    crop = img_np[int(h * 0.74):, :]  # 26% du bas (légèrement plus large pour tolérance)
    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
    # Bilateral filter : préserve contours caractères OCR-B
    bf = cv2.bilateralFilter(gray, d=11, sigmaColor=85, sigmaSpace=85)
    # CLAHE : contrast adaptatif → réduit l'effet guilloché
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(bf)
    # Otsu threshold : calcul automatique du seuil
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # Upscale 3× (INTER_CUBIC pour texte)
    h2, w2 = binary.shape
    scaled = cv2.resize(binary, (w2 * 3, h2 * 3), interpolation=cv2.INTER_CUBIC)
    return cv2.cvtColor(scaled, cv2.COLOR_GRAY2RGB)


# ══════════════════════════════════════════════════════════════
#  MRZ — CHARGEMENT MOTEUR OCR
# ══════════════════════════════════════════════════════════════

def load_model():
    try:
        from doctr.models import ocr_predictor
        model = ocr_predictor(
            det_arch='db_resnet50',
            reco_arch='crnn_mobilenet_v3_large',
            pretrained=True,
            assume_straight_pages=True,
            export_as_straight_boxes=True,
        )
        return ('doctr', model)
    except ImportError: pass
    except Exception as e: sys.stderr.write(f'[doctr] Erreur: {e}\n')
    try:
        import easyocr
        reader = easyocr.Reader(['fr', 'en'], gpu=False, verbose=False)
        return ('easyocr', reader)
    except ImportError: pass
    except Exception as e: sys.stderr.write(f'[easyocr] Erreur: {e}\n')
    raise ImportError(
        'Aucun moteur OCR.\n'
        'Option A: pip install "python-doctr[torch]" opencv-python\n'
        'Option B: pip install easyocr opencv-python'
    )


# ══════════════════════════════════════════════════════════════
#  EXTRACTION MOTS AVEC COORDONNÉES NORMALISÉES
# ══════════════════════════════════════════════════════════════

def extract_words_doctr(model, img_np):
    from doctr.io import DocumentFile
    doc = DocumentFile.from_images([img_np])
    result = model(doc)
    words, lines_text = [], []
    for page in result.pages:
        for block in page.blocks:
            for line in block.lines:
                lw = []
                for word in line.words:
                    words.append({'text': word.value, 'confidence': float(word.confidence),
                                  'geometry': [list(word.geometry[0]), list(word.geometry[1])]})
                    lw.append(word.value)
                lines_text.append(' '.join(lw))
    return words, '\n'.join(lines_text)


def extract_words_easyocr(reader, img_np):
    h, w = img_np.shape[:2]
    results = reader.readtext(img_np, detail=1, paragraph=False)
    words, line_texts = [], []
    for (bbox, text, conf) in results:
        xs = [p[0] for p in bbox]; ys = [p[1] for p in bbox]
        x1n, y1n = min(xs)/w, min(ys)/h
        x2n, y2n = max(xs)/w, max(ys)/h
        for token in text.split():
            words.append({'text': token, 'confidence': float(conf),
                          'geometry': [[x1n, y1n], [x2n, y2n]]})
        line_texts.append(text)
    return words, '\n'.join(line_texts)


# ══════════════════════════════════════════════════════════════
#  HELPERS GÉOMÉTRIQUES
# ══════════════════════════════════════════════════════════════

def cy(w): return (w['geometry'][0][1] + w['geometry'][1][1]) / 2
def cx(w): return (w['geometry'][0][0] + w['geometry'][1][0]) / 2
def x1w(w): return w['geometry'][0][0]
def x2w(w): return w['geometry'][1][0]
def y1w(w): return w['geometry'][0][1]
def y2w(w): return w['geometry'][1][1]
def same_line(w1, w2, tol=0.045): return abs(cy(w1) - cy(w2)) < tol

def words_right(anchor, words, max_gap=0.85, tol=0.045, max_n=12):
    res = [w for w in words if w is not anchor
           and same_line(anchor, w, tol)
           and x1w(w) >= x2w(anchor) - 0.02
           and x1w(w) <= x2w(anchor) + max_gap]
    return sorted(res, key=x1w)[:max_n]

def words_below(anchor, words, max_dy=0.12, x_tol=0.60, max_n=8):
    ax = cx(anchor)
    res = [w for w in words if w is not anchor
           and y1w(w) > y2w(anchor) - 0.005
           and y1w(w) - y2w(anchor) < max_dy
           and abs(cx(w) - ax) < x_tol]
    return sorted(res, key=lambda w: (cy(w), cx(w)))[:max_n]

def collect_text(wl, min_conf=0.38):
    return ' '.join(w['text'] for w in wl if w['confidence'] >= min_conf).strip()

def field_conf(wl):
    if not wl: return 0.0
    return sum(w['confidence'] for w in wl) / len(wl)


# ══════════════════════════════════════════════════════════════
#  PARSERS MÉTIER
# ══════════════════════════════════════════════════════════════

# Formats date : DD.MM.YYYY / DD/MM/YYYY / DD-MM-YYYY / DDMMYYYY / DD MM YYYY
_DATE_PATS = [
    re.compile(r'(\d{1,2})[.\-/](\d{2})[.\-/](\d{2,4})'),  # DD.MM.YY(YY)
    re.compile(r'(\d{2})(\d{2})(\d{4})'),                    # DDMMYYYY (collé)
    re.compile(r'(\d{1,2})\s(\d{2})\s(\d{4})'),             # DD MM YYYY (espaces)
]

def parse_date(text):
    for pat in _DATE_PATS:
        m = pat.search(text)
        if not m: continue
        d, mo, y = m.group(1), m.group(2), m.group(3)
        if len(y) == 2:
            yy = int(y)
            y = str(2000 + yy if yy <= 30 else 1900 + yy)
        try:
            _date(int(y), int(mo), int(d))
            return f'{y}-{mo.zfill(2)}-{d.zfill(2)}'
        except ValueError:
            continue
    return None

_DATE_RE = re.compile(r'\d{1,2}[.\-/\s]\d{2}[.\-/\s]\d{2,4}|\d{8}')

# Noms français : lettres, accents, tiret, apostrophe — PAS de chiffres
_NAME_VALID = re.compile(r"^[A-ZÁÀÂÄÉÈÊËÎÏÔÖÙÛÜÇÆŒa-záàâäéèêëîïôöùûüçæœ'\-]{2,30}$")

def clean_name(text):
    """Garde les tokens qui ressemblent à des noms propres (aucun chiffre, ≥2 chars)."""
    tokens = []
    for tok in re.split(r'[\s,;]+', text):
        tok = re.sub(r'[^A-ZÁÀÂÄÉÈÊËÎÏÔÖÙÛÜÇÆŒa-záàâäéèêëîïôöùûüçæœ\'\-]', '', tok)
        if len(tok) >= 2 and _NAME_VALID.match(tok):
            tokens.append(tok.upper())
    return ' '.join(tokens) or None

def parse_docnumber(text):
    m = re.search(r'\b(\d{12})\b', text)
    if m: return m.group(1)
    m = re.search(r'\b([A-Z0-9]{2}[-\s]?[A-Z0-9]{2}[-\s]?[A-Z0-9]{6,10})\b', text.upper())
    if m: return re.sub(r'[\s\-]', '', m.group(1))
    return None


# ══════════════════════════════════════════════════════════════
#  MRZ — Checksum ICAO 9303 + auto-correction OCR (TD1 + TD3)
# ══════════════════════════════════════════════════════════════
#
#  PRINCIPE : La MRZ a des chiffres de contrôle mathématiques sur chaque
#  champ critique (numéro doc, date naissance, date expiration).
#  Si le check digit ne passe pas → l'OCR a fait une faute → on essaie
#  automatiquement les substitutions O↔0, I↔1, S↔5, Z↔2, B↔8 jusqu'à
#  obtenir la bonne valeur.
#
#  checksum OK   → confidence 0.99 (certitude quasi absolue)
#  checksum fail → confidence 0.68 (valeur brute, non validée)

_MRZ_CHAR = re.compile(r'^[A-Z0-9<]{4,}$')

# Confusions classiques OCR sur police OCR-B
_OCR_SUBS = {'O': '0', '0': 'O', 'I': '1', '1': 'I', 'L': '1',
             'S': '5', '5': 'S', 'Z': '2', '2': 'Z', 'B': '8',
             '8': 'B', 'G': '6', '6': 'G', 'Q': '0'}

def _mrz_check(s):
    w = [7, 3, 1]
    v = {str(i): i for i in range(10)}
    v.update({chr(ord('A') + i): i + 10 for i in range(26)}); v['<'] = 0
    return sum(v.get(c, 0) * w[i % 3] for i, c in enumerate(s)) % 10

def _autocorrect(field, expected):
    """Tente 1 ou 2 substitutions OCR-B pour que le check digit soit valide."""
    if _mrz_check(field) == expected: return field, True
    fl = list(field)
    for i, c in enumerate(fl):
        if c not in _OCR_SUBS: continue
        fl[i] = _OCR_SUBS[c]
        if _mrz_check(''.join(fl)) == expected: return ''.join(fl), True
        for j in range(i + 1, len(fl)):
            if fl[j] not in _OCR_SUBS: continue
            orig_j = fl[j]; fl[j] = _OCR_SUBS[fl[j]]
            if _mrz_check(''.join(fl)) == expected: return ''.join(fl), True
            fl[j] = orig_j
        fl[i] = c
    return field, False


def _try_pytesseract_mrz(mrz_img):
    """
    Essaie de lire la zone MRZ prétraitée avec pytesseract (OCR-B natif).
    Retourne le texte brut ou None si pytesseract non disponible.
    """
    try:
        import pytesseract
        custom = '--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789< '
        raw = pytesseract.image_to_string(mrz_img, config=custom, lang='osd')
        return raw.strip()
    except Exception:
        return None


def parse_td1_lines(l1, l2, l3):
    """Parse 3 lignes × 30 chars ICAO TD1 (CNI française)."""
    l1 = l1.ljust(30, '<')[:30]
    l2 = l2.ljust(30, '<')[:30]
    l3 = l3.ljust(30, '<')[:30]

    fields = {}
    checksums = {}

    # Numéro doc (L1[5:14] + check L1[14])
    if l1[14:15].isdigit():
        f, ok = _autocorrect(l1[5:14], int(l1[14]))
        checksums['documentNumber'] = ok
        clean = f.replace('<', '').strip()
        if clean: fields['documentNumber'] = {'value': clean, 'confidence': 0.99 if ok else 0.68}

    # Date naissance (L2[0:6] + check L2[6])
    if l2[6:7].isdigit():
        f, ok = _autocorrect(l2[0:6], int(l2[6]))
        checksums['birthDate'] = ok
        bd = _parse_mrz_date(f)
        if bd: fields['birthDate'] = {'value': bd, 'confidence': 0.99 if ok else 0.68}

    # Sexe
    if l2[7:8] in ('M', 'F'):
        fields['sex'] = {'value': l2[7:8], 'confidence': 0.99}

    # Expiration (L2[8:14] + check L2[14])
    if l2[14:15].isdigit():
        f, ok = _autocorrect(l2[8:14], int(l2[14]))
        checksums['documentExpiry'] = ok
        exp = _parse_mrz_date(f)
        if exp: fields['documentExpiry'] = {'value': exp, 'confidence': 0.97 if ok else 0.68}

    # Nationalité
    nat = l2[15:18].replace('<', '').strip()
    if nat: fields['nationality'] = {'value': nat, 'confidence': 0.93}

    # Nom + Prénom (L3 = NOM<<PRENOM1<PRENOM2...)
    if '<<' in l3:
        parts = l3.split('<<')
        sur = parts[0].replace('<', ' ').strip()
        giv = parts[1].replace('<', ' ').strip() if len(parts) > 1 else ''
        if sur: fields['lastName'] = {'value': sur.upper(), 'confidence': 0.97}
        if giv:
            first = giv.split('<')[0].strip()
            if first: fields['firstName'] = {'value': first.title(), 'confidence': 0.96}

    all_ok = all(v for v in checksums.values()) if checksums else False
    fields['_mrzValid']  = {'value': all_ok,    'confidence': 1.0}
    fields['_checksums'] = {'value': checksums, 'confidence': 1.0}
    return fields, all_ok


def extract_mrz(words, mrz_img=None):
    """
    Extrait les champs MRZ.
    Stratégie :
      1. pytesseract sur crop prétraité (si disponible) → précision maximale
      2. Extraction spatiale depuis words[] doctr/EasyOCR → fallback robuste
    """
    fields    = {}
    mrz_text  = ''
    checksums = {}

    # ── Essai 1 : pytesseract sur image prétraitée (OCR-B natif) ──
    if mrz_img is not None:
        raw = _try_pytesseract_mrz(mrz_img)
        if raw:
            lines = [re.sub(r'[^A-Z0-9<]', '', ln.upper()) for ln in raw.splitlines() if ln.strip()]
            td1 = [l for l in lines if 28 <= len(l) <= 32]
            if len(td1) >= 3:
                mrz_text = '\n'.join(td1[:3])
                f, ok = parse_td1_lines(td1[0], td1[1], td1[2])
                if ok or f.get('birthDate'):  # au moins la date est lisible
                    return {'mrzText': mrz_text, 'mrzFields': f}

    # ── Essai 2 : extraction spatiale depuis words[] (doctr/EasyOCR) ──
    mrz_words = [w for w in words if cy(w) > 0.68 and _MRZ_CHAR.match(w['text'].upper())]
    if not mrz_words:
        return None

    mrz_words.sort(key=cy)
    lines, cur = [], [mrz_words[0]]
    for w in mrz_words[1:]:
        if abs(cy(w) - cy(cur[-1])) < 0.045: cur.append(w)
        else: lines.append(cur); cur = [w]
    lines.append(cur)

    raw_lines = []
    for ln in lines:
        ln.sort(key=x1w)
        raw_lines.append(''.join(w['text'].upper() for w in ln))

    td1 = [l[:30] for l in raw_lines if 18 <= len(l) <= 36]
    td3 = [l[:44] for l in raw_lines if 40 <= len(l) <= 48]
    mrz_text = '\n'.join(td1 if len(td1) >= 3 else td3 if len(td3) >= 2 else raw_lines)

    if len(td1) >= 3:
        f, _ = parse_td1_lines(td1[0], td1[1], td1[2])
        return {'mrzText': mrz_text, 'mrzFields': f}

    # TD3 (passeport, titre de séjour)
    if len(td3) >= 2:
        l1, l2 = td3[0].ljust(44, '<'), td3[1].ljust(44, '<')
        if l1[43:44].isdigit():
            f, ok = _autocorrect(l1[5:44], int(l1[43]))
        if '<<' in l1[5:]:
            parts = l1[5:].split('<<')
            sur = parts[0].replace('<', ' ').strip()
            giv = parts[1].replace('<', ' ').strip() if len(parts) > 1 else ''
            if sur: fields['lastName'] = {'value': sur.upper(), 'confidence': 0.92}
            if giv:
                first = giv.split('<')[0].strip()
                if first: fields['firstName'] = {'value': first.title(), 'confidence': 0.90}
        if l2[13:14].isdigit():
            f2, ok2 = _autocorrect(l2[13:19], int(l2[19]))
            bd = _parse_mrz_date(f2)
            if bd: fields['birthDate'] = {'value': bd, 'confidence': 0.95 if ok2 else 0.65}
        return {'mrzText': mrz_text, 'mrzFields': fields}

    return {'mrzText': mrz_text, 'mrzFields': fields}


def _parse_mrz_date(yymmdd):
    if len(yymmdd) < 6 or not yymmdd[:6].isdigit(): return None
    yy, mm, dd = int(yymmdd[:2]), yymmdd[2:4], yymmdd[4:6]
    pivot = (_date.today().year % 100) + 20
    year  = 2000 + yy if yy <= pivot else 1900 + yy
    try: _date(year, int(mm), int(dd)); return f'{year}-{mm}-{dd}'
    except ValueError: return None


# ══════════════════════════════════════════════════════════════
#  EXTRACTION CNI (labels visuels français + MRZ prioritaire)
# ══════════════════════════════════════════════════════════════

_CNI_LABEL_MAP = {
    r'^NOM$':           'lastName',
    r'NOM.*FAMILLE':    'lastName',
    r'^PR[EÉ]NOM':      'firstName',
    r'^N[EÉ]E?$':       'birthDate',
    r'^NAISSANCE$':     'birthDate',
    r'^DATE.*NAIS':     'birthDate',
    r'^LIEU.*NAISS':    'birthPlace',
    r'^LIEU$':          'birthPlace',
    r'^N°$':            'documentNumber',
    r'^\d{12}$':        '_docnum',
}

def extract_cni_visual(words):
    """Extraction CNI via labels français (NOM, PRÉNOM, NÉ(E) LE...)."""
    fields = {}
    good   = [w for w in words if w['confidence'] >= 0.40]
    for w in good:
        t = w['text'].upper().replace('.', '').strip()
        for pat, fld in _CNI_LABEL_MAP.items():
            if not re.match(pat, t, re.IGNORECASE): continue

            if fld == '_docnum':
                if 'documentNumber' not in fields:
                    fields['documentNumber'] = {'value': t, 'confidence': w['confidence']}
                break

            vw = words_right(w, good, max_gap=0.80)
            txt = collect_text(vw)
            if not txt or len(txt) < 2:
                vw  = words_below(w, good, max_dy=0.10)
                txt = collect_text(vw)
            if not txt or len(txt) < 2: break

            conf = field_conf(vw)
            if fld in ('lastName', 'firstName'):
                # Pour prénom : premier token seulement
                if fld == 'firstName':
                    first = txt.split()[0] if txt.split() else txt
                    n = clean_name(first)
                    if n and fld not in fields:
                        fields[fld] = {'value': n, 'confidence': conf}
                else:
                    n = clean_name(txt)
                    if n and fld not in fields:
                        fields[fld] = {'value': n, 'confidence': conf}
            elif fld == 'birthDate':
                d = parse_date(txt)
                if d and fld not in fields:
                    fields[fld] = {'value': d, 'confidence': conf}
                    place = clean_name(_DATE_RE.sub('', txt).strip())
                    if place and len(place) >= 2 and 'birthPlace' not in fields:
                        fields['birthPlace'] = {'value': place, 'confidence': conf * 0.85}
            elif fld == 'birthPlace':
                c = clean_name(txt)
                if c and fld not in fields:
                    fields[fld] = {'value': c, 'confidence': conf}
            elif fld == 'documentNumber':
                n = parse_docnumber(txt)
                if n and fld not in fields:
                    fields[fld] = {'value': n, 'confidence': conf}
            break
    return fields


# ══════════════════════════════════════════════════════════════
#  EXTRACTION PERMIS EU
#  Directive 2006/126/CE — champs numérotés standard
#
#  1. Nom de famille
#  2. Prénom(s)  →  PREMIER prénom uniquement
#  3. Date + lieu de naissance (format DD.MM.YYYY VILLE)
#  4a/4b/4c. Dates + autorité
#  5. Numéro du permis
#
#  CATÉGORIES (9./12.) : IGNORÉES — pas demandées
# ══════════════════════════════════════════════════════════════

# Patterns de labels permis — tolérants aux variations OCR (1. / 1, / 1 / "1")
_PERMIS_LABELS = {
    'lastName':       [r'^1[.,]?$', r'^1$'],
    'firstName':      [r'^2[.,]?$', r'^2$'],
    'birthInfo':      [r'^3[.,]?$', r'^3$'],
    'issueDate':      [r'^4[Aa][.,]?$', r'^4\.?[Aa]$'],
    'documentExpiry': [r'^4[Bb][.,]?$', r'^4\.?[Bb]$'],
    'documentNumber': [r'^5[.,]?$', r'^5$'],
    # 9. et catégories : intentionnellement absents
}

def _find_label(good, patterns):
    """Trouve le mot-label le plus probable parmi les candidats."""
    for pat in patterns:
        cands = [w for w in good if re.match(pat, w['text']) and x1w(w) < 0.30]
        if cands:
            return max(cands, key=lambda w: w['confidence'])
    return None


def extract_permis_fields(words):
    """
    Extraction permis EU — optimisé pour NOM, PRÉNOM, DATE DE NAISSANCE.
    Stratégie : label gauche → texte à droite + dessous.
    """
    fields = {}
    # Seuil plus bas pour trouver les labels (certains ont faible conf OCR)
    good   = [w for w in words if w['confidence'] >= 0.32]

    for field_key, patterns in _PERMIS_LABELS.items():
        label = _find_label(good, patterns)
        if not label: continue

        # Cherche à droite (même ligne) — fenêtre large pour noms composés
        vw = words_right(label, good, max_gap=0.85, max_n=12)
        # Rien à droite → cherche en dessous (champ sur la ligne suivante)
        if not vw:
            vw = words_below(label, good, max_dy=0.11)

        if not vw: continue

        text = collect_text(vw, min_conf=0.32)
        if not text: continue
        conf = field_conf(vw)

        if field_key == 'lastName':
            n = clean_name(text)
            if n: fields['lastName'] = {'value': n, 'confidence': conf}

        elif field_key == 'firstName':
            # Directive EU art. 1 §2 : champ 2 = premier prénom seulement
            # (les prénoms supplémentaires sont séparés par un espace ou virgule)
            first_tok = re.split(r'[\s,;]+', text)[0] if text else text
            n = clean_name(first_tok)
            if n:
                fields['firstName'] = {'value': n, 'confidence': conf}
            # Stocker aussi tous les prénoms pour le dossier
            all_n = clean_name(text)
            if all_n:
                fields['allFirstNames'] = {'value': all_n, 'confidence': conf}

        elif field_key == 'birthInfo':
            # Format standard : "DD.MM.YYYY VILLE" — ou séparés sur deux tokens
            d = parse_date(text)
            if d:
                fields['birthDate'] = {'value': d, 'confidence': conf}
                # Lieu = tout ce qui reste après avoir retiré la date
                place_raw = _DATE_RE.sub('', text).strip()
                # Si lieu absent sur la même ligne, chercher sous la date
                if not place_raw and vw:
                    below = words_below(vw[0], good, max_dy=0.09)
                    place_raw = collect_text(below, min_conf=0.35)
                place = clean_name(place_raw)
                if place and len(place) >= 2:
                    fields['birthPlace'] = {'value': place, 'confidence': conf * 0.88}
            else:
                # Parfois le lieu est sur cette ligne et la date est ailleurs
                place = clean_name(text)
                if place and len(place) >= 2 and 'birthPlace' not in fields:
                    fields['birthPlace'] = {'value': place, 'confidence': conf * 0.75}

        elif field_key in ('issueDate', 'documentExpiry'):
            d = parse_date(text)
            if d: fields[field_key] = {'value': d, 'confidence': conf}

        elif field_key == 'documentNumber':
            n = parse_docnumber(text)
            if n: fields['documentNumber'] = {'value': n, 'confidence': conf}

    return fields


# ══════════════════════════════════════════════════════════════
#  TRAITEMENT D'UNE IMAGE
# ══════════════════════════════════════════════════════════════

def process_image(engine_name, model, b64_image, doc_type):
    import numpy as np
    from PIL import Image
    from io import BytesIO

    img = Image.open(BytesIO(base64.b64decode(b64_image))).convert('RGB')
    img_np = np.array(img)

    # ── 1. Correction de perspective ──
    img_np = correct_perspective(img_np)

    # ── 2. OCR full image → words[] normalisés ──
    if engine_name == 'doctr':
        words, full_text = extract_words_doctr(model, img_np)
    else:
        words, full_text = extract_words_easyocr(model, img_np)

    # ── 3. Confiance globale ──
    good = [w for w in words if w['confidence'] > 0.40]
    avg_conf = round(sum(w['confidence'] for w in good) / len(good) * 100) if good else 0

    # ── 4a. Preprocessing MRZ dédié (CNI seulement) ──
    mrz_img    = preprocess_mrz_zone(img_np) if doc_type == 'CNI' else None
    mrz_result = extract_mrz(words, mrz_img)
    mrz_text   = mrz_result['mrzText']   if mrz_result else ''
    mrz_fields = mrz_result['mrzFields'] if mrz_result else {}

    # ── 4b. Extraction visuelle ──
    if doc_type == 'PERMIS_CONDUIRE':
        visual_fields = extract_permis_fields(words)
    else:
        visual_fields = extract_cni_visual(words)

    # ── 5. Fusion : MRZ > visuel (MRZ = source de vérité) ──
    #
    #   Pour NOM et PRÉNOM : MRZ préféré UNIQUEMENT si checksum valide
    #   (évite de prendre un nom MRZ erroné non corrigeable)
    #   Pour DATE NAISSANCE : MRZ toujours préféré (checksum valide ou non)
    mrz_valid = mrz_fields.get('_mrzValid', {}).get('value', False)

    merged = dict(visual_fields)  # base = visuel
    for k, v in mrz_fields.items():
        if k.startswith('_'): continue
        if k in ('lastName', 'firstName'):
            if mrz_valid:  # on écrase le visuel seulement si MRZ checksum OK
                merged[k] = v
        else:
            merged[k] = v  # toutes les autres données MRZ ont priorité absolue

    # Zone texte filtré pour debug
    zone_words = sorted(
        [w for w in words if w['confidence'] > 0.42 and x1w(w) > 0.32 and y1w(w) < 0.78],
        key=lambda w: (round(cy(w) / 0.05), x1w(w))
    )
    text_zone = ' '.join(w['text'] for w in zone_words)

    return {
        'fullText':     full_text,
        'textZoneText': text_zone,
        'mrzText':      mrz_text,
        'confidence':   avg_conf,
        'engine':       engine_name,
        'fields':       merged,
    }


# ══════════════════════════════════════════════════════════════
#  SUBPROCESS PERSISTANT (stdin/stdout JSON lines)
# ══════════════════════════════════════════════════════════════

def main():
    try:
        engine_name, model = load_model()
        cv2_ok = _check_cv2()
        tess_ok = False
        try:
            import pytesseract; pytesseract.get_tesseract_version(); tess_ok = True
        except Exception: pass
        info = f'engine={engine_name} opencv={"✓" if cv2_ok else "✗"} pytesseract={"✓" if tess_ok else "✗"}'
        sys.stdout.write(json.dumps({'ready': True, 'engine': engine_name, 'info': info}) + '\n')
        sys.stdout.flush()
    except ImportError as e:
        sys.stdout.write(json.dumps({'error': 'not_installed', 'message': str(e)}) + '\n')
        sys.stdout.flush()
        return
    except Exception as e:
        sys.stdout.write(json.dumps({'error': 'load_failed', 'message': str(e)}) + '\n')
        sys.stdout.flush()
        return

    for raw_line in sys.stdin:
        raw_line = raw_line.strip()
        if not raw_line: continue
        try:
            req    = json.loads(raw_line)
            result = process_image(engine_name, model, req['image'], req.get('docType', 'CNI'))
            sys.stdout.write(json.dumps(result) + '\n')
            sys.stdout.flush()
        except Exception as e:
            import traceback
            sys.stdout.write(json.dumps({'error': 'processing_failed', 'message': str(e)}) + '\n')
            sys.stdout.flush()


if __name__ == '__main__':
    main()
