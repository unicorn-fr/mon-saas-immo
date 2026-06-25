#!/usr/bin/env python3
"""
OCR Document — Pipeline multi-moteur avec extracteur spatial
=============================================================

Moteurs (cascade automatique) :
  1. doctr  (pip install "python-doctr[torch]")   ← le modèle Mindee open source
  2. EasyOCR (pip install easyocr)                ← CRAFT + CRNN, très robuste
  Arrêt si aucun n'est disponible.

Étapes de traitement :
  1. OpenCV perspective correction  (pip install opencv-python)  ← OBLIGATOIRE pour l'incohérence
  2. OCR multi-moteur → words[] avec coordonnées normalisées 0-1 + confiance
  3. Extraction spatiale :
       - Permis : numéros de champ EU "1." "2." "3." "4a." "4b." "4c." "5."
       - CNI    : labels "NOM" "PRÉNOM" "NÉ(E) LE" + MRZ (y > 0.72)
  4. Règles métier :
       - Champ 2 → PREMIER prénom uniquement (pas tous les prénoms)
       - Champ 3 → date de naissance + lieu sur la même ligne ou en dessous
       - Confiance par champ → rejetés si < 0.50

Subprocess persistant : modèle chargé une fois, réutilisé sur stdin/stdout.
"""

import sys
import json
import base64
import os
import re
import logging
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
#  CORRECTION DE PERSPECTIVE (OpenCV)
# ══════════════════════════════════════════════════════════════

_CV2_AVAILABLE = None

def _check_cv2():
    global _CV2_AVAILABLE
    if _CV2_AVAILABLE is None:
        try:
            import cv2
            _CV2_AVAILABLE = True
        except ImportError:
            _CV2_AVAILABLE = False
            sys.stderr.write('[doctr] OpenCV non disponible — correction perspective désactivée\n')
    return _CV2_AVAILABLE


def _order_corners(pts):
    """Top-left, top-right, bottom-right, bottom-left."""
    import numpy as np
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1).ravel()
    rect[0] = pts[s.argmin()]
    rect[2] = pts[s.argmax()]
    rect[1] = pts[diff.argmin()]
    rect[3] = pts[diff.argmax()]
    return rect


def correct_perspective(img_np):
    """
    Détecte les bords du document et corrige la perspective via homographie.
    Retourne l'image corrigée ou l'originale si détection échoue.
    Standard carte ID : 85.6 × 54 mm → ratio 1.586:1.
    """
    if not _check_cv2():
        return img_np

    import cv2
    import numpy as np

    h, w = img_np.shape[:2]
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 60, 180)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8))

    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]

    doc_contour = None
    min_area = 0.10 * h * w  # Le document doit couvrir au moins 10% de l'image
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4 and cv2.contourArea(approx) > min_area:
            doc_contour = approx
            break

    if doc_contour is None:
        return img_np

    pts = doc_contour.reshape(4, 2).astype(np.float32)
    rect = _order_corners(pts)

    # Dimensions sortie : ratio ID card standard
    W, H = 856, 540
    dst = np.float32([[0, 0], [W - 1, 0], [W - 1, H - 1], [0, H - 1]])
    M = cv2.getPerspectiveTransform(rect, dst)
    corrected = cv2.warpPerspective(img_np, M, (W, H), flags=cv2.INTER_LANCZOS4)
    return corrected


# ══════════════════════════════════════════════════════════════
#  CHARGEMENT DU MOTEUR OCR
# ══════════════════════════════════════════════════════════════

def load_model():
    """
    Charge le meilleur moteur OCR disponible.
    Retourne (engine_name, model_object).
    """
    # ── Essai 1 : doctr (modèle Mindee, le meilleur pour les documents) ──
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
    except ImportError:
        pass
    except Exception as e:
        sys.stderr.write(f'[doctr] Erreur chargement: {e}\n')

    # ── Essai 2 : EasyOCR (CRAFT + CRNN, excellent sur documents) ──
    try:
        import easyocr
        # fr = français, en = anglais (pour les numéros et champs EU standard)
        reader = easyocr.Reader(['fr', 'en'], gpu=False, verbose=False)
        return ('easyocr', reader)
    except ImportError:
        pass
    except Exception as e:
        sys.stderr.write(f'[easyocr] Erreur chargement: {e}\n')

    raise ImportError(
        'Aucun moteur OCR installé.\n'
        'Option A (recommandée) : pip install "python-doctr[torch]" opencv-python\n'
        'Option B              : pip install easyocr opencv-python'
    )


# ══════════════════════════════════════════════════════════════
#  EXTRACTION DES MOTS AVEC COORDONNÉES NORMALISÉES
# ══════════════════════════════════════════════════════════════

def extract_words_doctr(model, img_np):
    """Retourne words[] normalisés depuis doctr."""
    import numpy as np
    from doctr.io import DocumentFile

    doc = DocumentFile.from_images([img_np])
    result = model(doc)

    words = []
    lines_text = []
    for page in result.pages:
        for block in page.blocks:
            for line in block.lines:
                line_words = []
                for word in line.words:
                    words.append({
                        'text':       word.value,
                        'confidence': float(word.confidence),
                        'geometry':   [list(word.geometry[0]), list(word.geometry[1])],
                    })
                    line_words.append(word.value)
                lines_text.append(' '.join(line_words))
    return words, '\n'.join(lines_text)


def extract_words_easyocr(reader, img_np):
    """Retourne words[] normalisés depuis EasyOCR."""
    h, w = img_np.shape[:2]
    results = reader.readtext(img_np, detail=1, paragraph=False)

    words = []
    line_texts = []
    for (bbox, text, conf) in results:
        # bbox EasyOCR = [[x1,y1],[x2,y1],[x2,y2],[x1,y2]] pixels
        xs = [p[0] for p in bbox]
        ys = [p[1] for p in bbox]
        x1n, y1n = min(xs) / w, min(ys) / h
        x2n, y2n = max(xs) / w, max(ys) / h
        # Découpe les tokens du texte (EasyOCR retourne parfois des phrases)
        for token in text.split():
            words.append({
                'text':       token,
                'confidence': float(conf),
                'geometry':   [[x1n, y1n], [x2n, y2n]],
            })
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

def same_line(w1, w2, tol=0.040):
    return abs(cy(w1) - cy(w2)) < tol

def words_right(anchor, words, max_gap=0.65, tol=0.040, max_n=8):
    """Mots à droite de l'ancre sur la même ligne (triés par x)."""
    res = [w for w in words
           if w is not anchor
           and same_line(anchor, w, tol)
           and x1w(w) >= x2w(anchor) - 0.015
           and x1w(w) <= x2w(anchor) + max_gap]
    return sorted(res, key=x1w)[:max_n]

def words_below(anchor, words, max_dy=0.10, x_tol=0.50, max_n=6):
    """Mots directement en dessous de l'ancre."""
    ax = cx(anchor)
    res = [w for w in words
           if w is not anchor
           and y1w(w) > y2w(anchor) - 0.005
           and y1w(w) - y2w(anchor) < max_dy
           and abs(cx(w) - ax) < x_tol]
    return sorted(res, key=lambda w: (cy(w), cx(w)))[:max_n]

def collect_text(word_list, min_conf=0.40):
    return ' '.join(w['text'] for w in word_list if w['confidence'] >= min_conf).strip()

def field_conf(word_list):
    if not word_list: return 0.0
    return sum(w['confidence'] for w in word_list) / len(word_list)


# ══════════════════════════════════════════════════════════════
#  PARSERS MÉTIER
# ══════════════════════════════════════════════════════════════

_DATE_RE = re.compile(r'(\d{2})[./\-](\d{2})[./\-](\d{2,4})')

def parse_date(text):
    """DD.MM.YYYY → YYYY-MM-DD. Retourne None si pas de date."""
    m = _DATE_RE.search(text)
    if not m: return None
    d, mo, y = m.group(1), m.group(2), m.group(3)
    if len(y) == 2:
        yy = int(y)
        y = str(2000 + yy if yy <= 30 else 1900 + yy)
    try:
        _date(int(y), int(mo), int(d))
        return f'{y}-{mo.zfill(2)}-{d.zfill(2)}'
    except ValueError:
        return None

_NAME_OK = re.compile(r"^[A-ZÁÀÂÄÉÈÊËÎÏÔÖÙÛÜÇÆŒ\-']{2,}$", re.IGNORECASE)

def clean_name(text):
    """Garde uniquement les tokens qui ressemblent à un nom propre."""
    tokens = []
    for tok in text.split():
        tok = re.sub(r'[^A-ZÁÀÂÄÉÈÊËÎÏÔÖÙÛÜÇÆŒa-záàâäéèêëîïôöùûüçæœ\-\']', '', tok)
        if len(tok) >= 2 and _NAME_OK.match(tok):
            tokens.append(tok.upper())
    return ' '.join(tokens) or None

def parse_docnumber(text):
    m = re.search(r'\b(\d{12})\b', text)
    if m: return m.group(1)
    m = re.search(r'\b([A-Z0-9]{2}[-\s]?[A-Z0-9]{2}[-\s]?[A-Z0-9]{6,10})\b', text.upper())
    if m: return re.sub(r'[\s\-]', '', m.group(1))
    m = re.search(r'\b([A-Z0-9]{6,20})\b', text.upper())
    if m: return m.group(1)
    return None


# ══════════════════════════════════════════════════════════════
#  MRZ — Checksum ICAO + auto-correction OCR
# ══════════════════════════════════════════════════════════════
#
#  La MRZ ICAO 9303 a des check digits sur chaque champ critique.
#  Si le checksum échoue → l'OCR a fait une erreur → on substitue
#  les caractères ambigus (O↔0, I↔1, S↔5, Z↔2, B↔8) jusqu'à ce
#  que le chiffre de contrôle soit valide.
#  Résultat : confiance 0.97 si checksum OK, 0.70 sinon.

_MRZ_CHAR = re.compile(r'^[A-Z0-9<]{5,}$')

_OCR_SUBS = {'O': '0', '0': 'O', 'I': '1', '1': 'I', 'L': '1',
             'S': '5', '5': 'S', 'Z': '2', '2': 'Z', 'B': '8',
             '8': 'B', 'G': '6', '6': 'G', 'Q': '0', 'D': '0'}

def _mrz_check(s):
    """Chiffre de contrôle ICAO 9303 §4.9."""
    w = [7, 3, 1]
    v = {str(i): i for i in range(10)}
    v.update({chr(ord('A') + i): i + 10 for i in range(26)}); v['<'] = 0
    return sum(v.get(c, 0) * w[i % 3] for i, c in enumerate(s)) % 10

def _autocorrect(field, expected):
    """Corrige jusqu'à 2 caractères ambigus pour que le check digit passe."""
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

def extract_mrz(words):
    mrz_words = [w for w in words if cy(w) > 0.70 and _MRZ_CHAR.match(w['text'].upper())]
    if not mrz_words: return None

    mrz_words.sort(key=cy)
    lines, cur = [], [mrz_words[0]]
    for w in mrz_words[1:]:
        if abs(cy(w) - cy(cur[-1])) < 0.04: cur.append(w)
        else: lines.append(cur); cur = [w]
    lines.append(cur)

    raw_lines = []
    for ln in lines:
        ln.sort(key=x1w)
        raw_lines.append(''.join(w['text'].upper() for w in ln))

    td1 = [l[:30] for l in raw_lines if 20 <= len(l) <= 36]
    td3 = [l[:44] for l in raw_lines if 40 <= len(l) <= 48]
    mrz_text = '\n'.join(td1 if len(td1) >= 3 else td3 if len(td3) >= 2 else raw_lines)

    fields = {}
    checksums = {}

    if len(td1) >= 3:
        l1 = td1[0].ljust(30, '<')
        l2 = td1[1].ljust(30, '<')
        l3 = td1[2].ljust(30, '<')

        # Numéro doc (L1 5-14 + check L1[14])
        if l1[14:15].isdigit():
            f, ok = _autocorrect(l1[5:14], int(l1[14]))
            checksums['documentNumber'] = ok
            clean = f.replace('<', '').strip()
            if clean: fields['documentNumber'] = {'value': clean, 'confidence': 0.97 if ok else 0.72}

        # Date naissance (L2 0-6 + check L2[6])
        if l2[6:7].isdigit():
            f, ok = _autocorrect(l2[0:6], int(l2[6]))
            checksums['birthDate'] = ok
            bd = _parse_mrz_date(f)
            if bd: fields['birthDate'] = {'value': bd, 'confidence': 0.98 if ok else 0.70}

        # Sexe (L2[7])
        sex = l2[7:8]
        if sex in ('M', 'F'): fields['sex'] = {'value': sex, 'confidence': 0.99}

        # Expiration (L2 8-14 + check L2[14])
        if l2[14:15].isdigit():
            f, ok = _autocorrect(l2[8:14], int(l2[14]))
            checksums['documentExpiry'] = ok
            exp = _parse_mrz_date(f)
            if exp: fields['documentExpiry'] = {'value': exp, 'confidence': 0.96 if ok else 0.70}

        # Nationalité (L2 15-18)
        nat = l2[15:18].replace('<', '').strip()
        if nat: fields['nationality'] = {'value': nat, 'confidence': 0.92}

        # Nom + Prénom (L3)
        if '<<' in l3:
            parts = l3.split('<<')
            sur = parts[0].replace('<', ' ').strip()
            giv = parts[1].replace('<', ' ').strip() if len(parts) > 1 else ''
            if sur: fields['lastName']  = {'value': sur.upper(), 'confidence': 0.95}
            if giv:
                first = giv.split('<')[0].strip().title()
                if first: fields['firstName'] = {'value': first, 'confidence': 0.94}

        all_ok = all(v for v in checksums.values()) if checksums else False
        fields['_mrzValid']    = {'value': all_ok,     'confidence': 1.0}
        fields['_checksums']   = {'value': checksums,  'confidence': 1.0}

    return {'mrzText': mrz_text, 'mrzFields': fields}


def _parse_mrz_date(yymmdd):
    if len(yymmdd) < 6 or not yymmdd[:6].isdigit(): return None
    yy, mm, dd = int(yymmdd[:2]), yymmdd[2:4], yymmdd[4:6]
    pivot = (_date.today().year % 100) + 20
    year = 2000 + yy if yy <= pivot else 1900 + yy
    try: _date(year, int(mm), int(dd)); return f'{year}-{mm}-{dd}'
    except ValueError: return None


# ══════════════════════════════════════════════════════════════
#  EXTRACTION PERMIS EU (champs numérotés 1. 2. 3. 4a. 4b. 4c. 5.)
# ══════════════════════════════════════════════════════════════
#
#  Norme EU permis de conduire (directive 2006/126/CE) :
#    1.  Nom de famille
#    2.  Prénom(s)          → on prend uniquement le PREMIER prénom
#    3.  Date et lieu de naissance   "DD.MM.YYYY VILLE"
#    4a. Date de délivrance
#    4b. Date d'expiration
#    4c. Autorité délivrante
#    5.  Numéro du permis
#    9.  Catégorie(s)

PERMIS_NUMS = {
    'lastName':       [r'^1[.,]?$'],
    'firstName':      [r'^2[.,]?$'],
    'birthInfo':      [r'^3[.,]?$'],          # date + lieu sur une ligne ou deux
    'issueDate':      [r'^4[Aa][.,]?$'],
    'documentExpiry': [r'^4[Bb][.,]?$'],
    'authority':      [r'^4[Cc][.,]?$'],
    'documentNumber': [r'^5[.,]?$'],
    'categories':     [r'^9[.,]?$', r'^12[.,]?$'],
}

def extract_permis_fields(words):
    fields = {}
    good = [w for w in words if w['confidence'] >= 0.38]

    for field_key, patterns in PERMIS_NUMS.items():
        # Cherche le mot-numéro
        label = None
        for pat in patterns:
            candidates = [w for w in good if re.match(pat, w['text'])]
            if candidates:
                label = max(candidates, key=lambda w: w['confidence'])
                break
        if not label: continue

        # Valeurs à droite (même ligne)
        vw = words_right(label, good, max_gap=0.72)

        # Si rien à droite → cherche en dessous (champ sur la ligne suivante)
        if not vw:
            vw = words_below(label, good, max_dy=0.09)

        if not vw: continue

        text = collect_text(vw)
        conf = field_conf(vw)

        if field_key == 'lastName':
            n = clean_name(text)
            if n: fields['lastName'] = {'value': n, 'confidence': conf}

        elif field_key == 'firstName':
            # RÈGLE : premier prénom uniquement
            first_token = text.split()[0] if text.split() else ''
            n = clean_name(first_token)
            if n: fields['firstName'] = {'value': n, 'confidence': conf}
            # Stocker tous les prénoms dans un champ secondaire
            all_names = clean_name(text)
            if all_names: fields['allFirstNames'] = {'value': all_names, 'confidence': conf}

        elif field_key == 'birthInfo':
            # RÈGLE : date de naissance + lieu sur la même ligne "DD.MM.YYYY VILLE"
            d = parse_date(text)
            if d:
                fields['birthDate'] = {'value': d, 'confidence': conf}
            # Lieu = texte après la date (même ligne)
            place_text = _DATE_RE.sub('', text).strip()
            # Si lieu vide, chercher les mots juste en dessous de la date
            if not place_text and vw:
                below = words_below(vw[0], good, max_dy=0.08)
                place_text = collect_text(below)
            place = clean_name(place_text)
            if place and len(place) >= 2:
                fields['birthPlace'] = {'value': place, 'confidence': conf * 0.88}

        elif field_key in ('issueDate', 'documentExpiry'):
            d = parse_date(text)
            if d: fields[field_key] = {'value': d, 'confidence': conf}

        elif field_key == 'documentNumber':
            n = parse_docnumber(text)
            if n: fields['documentNumber'] = {'value': n, 'confidence': conf}

        elif field_key == 'authority':
            fields['authority'] = {'value': text.strip(), 'confidence': conf}

        elif field_key == 'categories':
            cats = re.findall(r'\b(A[M12]?|B[E196]?|C1?E?|D1?E?)\b', text.upper())
            if cats: fields['categories'] = {'value': list(dict.fromkeys(cats)), 'confidence': conf}

    return fields


# ══════════════════════════════════════════════════════════════
#  EXTRACTION CNI (labels français + MRZ)
# ══════════════════════════════════════════════════════════════

_CNI_LABELS = {
    r'^NOM$':         'lastName',
    r'NOM.*FAMILLE':  'lastName',
    r'^PR[EÉ]NOM':    'firstName',
    r'^N[EÉ]E?\b':    'birthDate',
    r'^NAISSANCE$':   'birthDate',
    r'^DATE.*NAIS':   'birthDate',
    r'^LIEU':         'birthPlace',
    r'^N°$':          'documentNumber',
    r'^\d{12}$':      '_docnum',
}

def extract_cni_fields(words):
    fields = {}
    good = [w for w in words if w['confidence'] >= 0.42]

    for w in good:
        t = w['text'].upper().replace('.', '').strip()
        for pat, fld in _CNI_LABELS.items():
            if not re.match(pat, t, re.IGNORECASE): continue

            if fld == '_docnum':
                if 'documentNumber' not in fields:
                    fields['documentNumber'] = {'value': t, 'confidence': w['confidence']}
                break

            vw = words_right(w, good)
            text = collect_text(vw)
            if not text or len(text) < 2:
                vw = words_below(w, good, max_dy=0.08)
                text = collect_text(vw)
            if not text or len(text) < 2: break

            conf = field_conf(vw)

            if fld in ('lastName', 'firstName'):
                if fld == 'firstName':
                    # RÈGLE : premier prénom uniquement
                    first = text.split()[0] if text.split() else text
                    n = clean_name(first)
                    if n and fld not in fields:
                        fields[fld] = {'value': n, 'confidence': conf}
                else:
                    n = clean_name(text)
                    if n and fld not in fields:
                        fields[fld] = {'value': n, 'confidence': conf}
            elif fld == 'birthDate':
                d = parse_date(text)
                if d and fld not in fields:
                    fields[fld] = {'value': d, 'confidence': conf}
                    # Lieu = texte après la date
                    place = clean_name(_DATE_RE.sub('', text).strip())
                    if place and len(place) >= 2 and 'birthPlace' not in fields:
                        fields['birthPlace'] = {'value': place, 'confidence': conf * 0.85}
            elif fld == 'birthPlace':
                c = clean_name(text)
                if c and fld not in fields:
                    fields[fld] = {'value': c, 'confidence': conf}
            elif fld == 'documentNumber':
                n = parse_docnumber(text)
                if n and fld not in fields:
                    fields[fld] = {'value': n, 'confidence': conf}
            break

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

    # ── 1. Correction de perspective (OpenCV) ──
    img_np = correct_perspective(img_np)

    # ── 2. OCR → words[] normalisés ──
    if engine_name == 'doctr':
        words, full_text = extract_words_doctr(model, img_np)
    else:
        words, full_text = extract_words_easyocr(model, img_np)

    # ── 3. Confiance globale (mots > 0.45) ──
    good = [w for w in words if w['confidence'] > 0.45]
    avg_conf = round(sum(w['confidence'] for w in good) / len(good) * 100) if good else 0

    # ── 4. MRZ ──
    mrz_result = extract_mrz(words)
    mrz_text   = mrz_result['mrzText']   if mrz_result else ''
    mrz_fields = mrz_result['mrzFields'] if mrz_result else {}

    # ── 5. Extraction spatiale des champs visuels ──
    if doc_type == 'PERMIS_CONDUIRE':
        visual_fields = extract_permis_fields(words)
    else:
        visual_fields = extract_cni_fields(words)

    # ── 6. Fusion MRZ > champs visuels (MRZ = source de vérité) ──
    merged = {}
    for k in set(visual_fields) | set(mrz_fields):
        merged[k] = mrz_fields[k] if k in mrz_fields else visual_fields[k]

    # Zone texte (x > 0.35, y < 0.80, conf > 0.45)
    zone_words = sorted(
        [w for w in words if w['confidence'] > 0.45 and x1w(w) > 0.35 and y1w(w) < 0.80],
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
#  SUBPROCESS PERSISTANT
# ══════════════════════════════════════════════════════════════

def main():
    try:
        engine_name, model = load_model()
        cv2_status = 'avec correction perspective' if _check_cv2() else 'sans OpenCV'
        sys.stdout.write(json.dumps({'ready': True, 'engine': engine_name, 'info': cv2_status}) + '\n')
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
            sys.stdout.write(json.dumps({'error': 'processing_failed', 'message': str(e)}) + '\n')
            sys.stdout.flush()


if __name__ == '__main__':
    main()
