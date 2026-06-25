#!/usr/bin/env python3
"""
doctr OCR + Extracteur Spatial de Champs
=========================================
Les cartes d'identité et permis de conduire ont une mise en page NORMALISÉE par la loi.
Au lieu de chercher des patterns dans du texte brut, on localise chaque champ
par sa POSITION relative sur le document (coordonnées normalisées 0.0 → 1.0).

Architecture :
  1. doctr → words[] avec géométrie + confiance (coordonnées normalisées)
  2. extract_permis_fields() → trouve les numéros de champs "1." "2." "3." "4a." etc.
  3. extract_cni_fields()    → trouve les labels "NOM" "PRÉNOMS" "NÉ(E) LE" + MRZ
  4. Validation par type     → date DD.MM.YYYY, nom A-ZÁÉÈÊ, numéro alphanumérique

Installation : pip install "python-doctr[torch]"
"""

import sys
import json
import base64
import os
import re
import logging

logging.disable(logging.CRITICAL)
os.environ.update({
    'TF_CPP_MIN_LOG_LEVEL': '3',
    'TRANSFORMERS_VERBOSITY': 'error',
    'DOCTR_CACHE_DIR': os.path.join(os.path.expanduser('~'), '.cache', 'doctr'),
    'PYTHONWARNINGS': 'ignore',
})


# ══════════════════════════════════════════════════════════════
#  MODÈLE
# ══════════════════════════════════════════════════════════════

def load_model():
    from doctr.models import ocr_predictor
    return ocr_predictor(
        det_arch='db_resnet50',
        reco_arch='crnn_mobilenet_v3_large',
        pretrained=True,
        assume_straight_pages=True,
        export_as_straight_boxes=True,
    )


# ══════════════════════════════════════════════════════════════
#  HELPERS GÉOMÉTRIQUES
# ══════════════════════════════════════════════════════════════

def cy(word):
    """Centre vertical du mot (0.0 → 1.0)."""
    return (word['geometry'][0][1] + word['geometry'][1][1]) / 2

def cx(word):
    """Centre horizontal du mot."""
    return (word['geometry'][0][0] + word['geometry'][1][0]) / 2

def x1(word): return word['geometry'][0][0]
def x2(word): return word['geometry'][1][0]
def y1(word): return word['geometry'][0][1]
def y2(word): return word['geometry'][1][1]

def words_on_same_line(w1, w2, tol=0.035):
    return abs(cy(w1) - cy(w2)) < tol

def words_to_right(anchor, words, max_gap=0.55, line_tol=0.035):
    """Mots situés à droite de l'ancre sur la même ligne, triés par x."""
    return sorted(
        [w for w in words
         if w is not anchor
         and words_on_same_line(anchor, w, line_tol)
         and x1(w) >= x2(anchor) - 0.01
         and x1(w) <= x2(anchor) + max_gap],
        key=lambda w: x1(w)
    )

def words_below(anchor, words, max_dy=0.12, x_range=0.55):
    """Mots situés juste en dessous de l'ancre, dans la même colonne."""
    ax_center = cx(anchor)
    return sorted(
        [w for w in words
         if w is not anchor
         and y1(w) > y2(anchor) - 0.01
         and y1(w) - y2(anchor) < max_dy
         and abs(cx(w) - ax_center) < x_range],
        key=lambda w: (cy(w), cx(w))
    )

def best_text(word_list, min_conf=0.45):
    """Concatène les mots d'une liste en filtrant les mots de faible confiance."""
    return ' '.join(w['text'] for w in word_list if w['confidence'] >= min_conf).strip()


# ══════════════════════════════════════════════════════════════
#  PARSERS DE CHAMPS
# ══════════════════════════════════════════════════════════════

DATE_PATTERNS = [
    r'(\d{2})[./\-](\d{2})[./\-](\d{4})',  # DD.MM.YYYY / DD/MM/YYYY
    r'(\d{2})[./\-](\d{2})[./\-](\d{2})',  # DD.MM.YY
    r'(\d{4})[./\-](\d{2})[./\-](\d{2})',  # YYYY-MM-DD
]

def parse_date(text):
    """Extrait et normalise une date → YYYY-MM-DD."""
    for pat in DATE_PATTERNS:
        m = re.search(pat, text)
        if m:
            g = m.groups()
            if len(g[0]) == 4:           # YYYY-MM-DD
                return f'{g[0]}-{g[1]}-{g[2]}'
            elif len(g[2]) == 2:         # DD.MM.YY
                yy = int(g[2])
                year = 2000 + yy if yy <= 30 else 1900 + yy
                return f'{year}-{g[1]}-{g[0]}'
            else:                        # DD.MM.YYYY
                return f'{g[2]}-{g[1]}-{g[0]}'
    return None

NAME_ALLOWED = re.compile(r"^[A-ZÁÀÂÄÉÈÊËÎÏÔÖÙÛÜÇÆŒ\-\s']{2,35}$", re.IGNORECASE)

def clean_name(text):
    """Nettoie un nom/prénom : supprime les caractères invalides."""
    # Supprime les tokens qui ressemblent à des artefacts OCR
    tokens = []
    for tok in text.split():
        tok_clean = re.sub(r'[^A-ZÁÀÂÄÉÈÊËÎÏÔÖÙÛÜÇÆŒa-záàâäéèêëîïôöùûüçæœ\-\']', '', tok)
        if len(tok_clean) >= 2 and NAME_ALLOWED.match(tok_clean):
            tokens.append(tok_clean.upper())
    return ' '.join(tokens) if tokens else None

def parse_docnumber(text):
    """Extrait un numéro de document alphanumérique."""
    # Numéro CNI : 12 chiffres
    m = re.search(r'\b(\d{12})\b', text)
    if m: return m.group(1)
    # Numéro permis français : format XX-XX-XXXXXX-XX ou alphanumérique
    m = re.search(r'\b([A-Z0-9]{2,4}[-\s]?[A-Z0-9]{2,4}[-\s]?[A-Z0-9]{4,8})\b', text.upper())
    if m: return re.sub(r'[\s\-]', '', m.group(1))
    # Alphanumérique 6-20 chars
    m = re.search(r'\b([A-Z0-9]{6,20})\b', text.upper())
    if m: return m.group(1)
    return None


# ══════════════════════════════════════════════════════════════
#  MRZ — Zone de Lecture Automatique (bas du document)
# ══════════════════════════════════════════════════════════════

MRZ_CHAR = re.compile(r'^[A-Z0-9<]{6,}$')

def extract_mrz(words):
    """
    Extrait et parse le MRZ depuis les mots du bas du document (y > 0.72).
    Retourne un dict {mrzText, fields} ou None.
    """
    # Mots MRZ = alphabet OCR-B (A-Z, 0-9, <) dans la zone inférieure
    mrz_words = [w for w in words if cy(w) > 0.72 and MRZ_CHAR.match(w['text'])]
    if not mrz_words:
        return None

    # Groupe par ligne (y similaire)
    mrz_words.sort(key=lambda w: cy(w))
    lines = []
    current = [mrz_words[0]]
    for w in mrz_words[1:]:
        if abs(cy(w) - cy(current[-1])) < 0.04:
            current.append(w)
        else:
            lines.append(current)
            current = [w]
    lines.append(current)

    # Chaque ligne = tokens triés par x concaténés sans espace
    mrz_lines = []
    for line in lines:
        line.sort(key=lambda w: x1(w))
        mrz_lines.append(''.join(w['text'] for w in line))

    # TD1 (CNI) = 3 lignes × 30 chars
    td1 = [l[:30] for l in mrz_lines if 20 <= len(l) <= 36]
    # TD3 (Passeport) = 2 lignes × 44 chars
    td3 = [l[:44] for l in mrz_lines if 40 <= len(l) <= 48]

    mrz_text = '\n'.join(td1 if len(td1) >= 3 else td3 if len(td3) >= 2 else mrz_lines)

    # Parse MRZ TD1 (CNI)
    fields = {}
    if len(td1) >= 3:
        line1, line2, line3 = td1[0].ljust(30, '<'), td1[1].ljust(30, '<'), td1[2].ljust(30, '<')

        # Ligne 1 : IDFRA + doc number (5-14) + check
        if line1.startswith('ID'):
            doc_raw = line1[5:14].replace('<', '').strip()
            if doc_raw: fields['documentNumber'] = {'value': doc_raw, 'confidence': 0.90}

        # Ligne 2 : date naissance (1-6) + check + sexe (7) + expiry (8-13) + check + nationalité (15-17)
        bd_raw = line2[0:6]
        bd = parse_mrz_date(bd_raw)
        if bd: fields['birthDate'] = {'value': bd, 'confidence': 0.92}

        sex = line2[7:8]
        if sex in ('M', 'F'): fields['sex'] = {'value': sex, 'confidence': 0.95}

        exp_raw = line2[8:14]
        exp = parse_mrz_date(exp_raw)
        if exp: fields['documentExpiry'] = {'value': exp, 'confidence': 0.90}

        nat = line2[15:18].replace('<', '').strip()
        if nat: fields['nationality'] = {'value': nat, 'confidence': 0.88}

        # Ligne 3 : nom << prénoms
        name_part = line3
        if '<<' in name_part:
            parts = name_part.split('<<')
            sur = parts[0].replace('<', ' ').strip()
            giv = parts[1].replace('<', ' ').strip() if len(parts) > 1 else ''
            if sur: fields['lastName']  = {'value': sur.upper(), 'confidence': 0.92}
            if giv: fields['firstName'] = {'value': giv.title(), 'confidence': 0.90}

    return {'mrzText': mrz_text, 'mrzFields': fields}


def parse_mrz_date(yymmdd):
    """Date MRZ YYMMDD → YYYY-MM-DD avec convention ICAO (pivot +20 ans)."""
    if len(yymmdd) < 6 or not yymmdd[:6].isdigit():
        return None
    yy, mm, dd = int(yymmdd[:2]), yymmdd[2:4], yymmdd[4:6]
    from datetime import date
    pivot = (date.today().year % 100) + 20
    year = 2000 + yy if yy <= pivot else 1900 + yy
    try:
        date(year, int(mm), int(dd))  # validation
        return f'{year}-{mm}-{dd}'
    except ValueError:
        return None


# ══════════════════════════════════════════════════════════════
#  EXTRACTION CNI — Carte Nationale d'Identité française
# ══════════════════════════════════════════════════════════════

CNI_LABEL_MAP = {
    # Patterns regex → field name
    r'^NOM$':        'lastName',
    r'^FAMILLE$':    'lastName',
    r'NOM.*FAMILLE': 'lastName',
    r'^PR[EÉ]NOM':   'firstName',
    r'^GIVEN':       'firstName',
    r'^N[EÉ][E]?\b': 'birthDate',       # NÉ / NÉE / NE
    r'^NAISSANCE$':  'birthDate',
    r'^DATE.*NAIS':  'birthDate',
    r'^LIEU':        'birthPlace',
    r'^N°$':         'documentNumber',
    r'^\d{12}$':     '_docnum_raw',     # le numéro LUI-MÊME s'il est reconnu directement
}

def extract_cni_fields(words):
    """
    Extraction spatiale des champs CNI.
    Stratégie : trouver les mots-étiquettes, puis récupérer les mots à droite/en dessous.
    """
    fields = {}

    # Mots avec confiance raisonnable
    confident_words = [w for w in words if w['confidence'] >= 0.45]

    for w in confident_words:
        t = w['text'].upper().replace('.', '').strip()

        for pat, field in CNI_LABEL_MAP.items():
            if not re.match(pat, t, re.IGNORECASE):
                continue

            # Numéro raw → directement le champ
            if field == '_docnum_raw':
                if 'documentNumber' not in fields:
                    fields['documentNumber'] = {'value': t, 'confidence': w['confidence']}
                break

            # Cherche la valeur à droite en premier
            value_words = words_to_right(w, confident_words, max_gap=0.60)
            value_text = best_text(value_words)

            # Si rien à droite, cherche en dessous
            if not value_text or len(value_text) < 2:
                value_words = words_below(w, confident_words, max_dy=0.09)
                value_text = best_text(value_words)

            if not value_text or len(value_text) < 2:
                break

            conf = sum(v['confidence'] for v in value_words) / len(value_words) if value_words else 0.5

            if field in ('lastName', 'firstName'):
                cleaned = clean_name(value_text)
                if cleaned and field not in fields:
                    fields[field] = {'value': cleaned, 'confidence': conf}

            elif field == 'birthDate':
                d = parse_date(value_text)
                if d and 'birthDate' not in fields:
                    fields['birthDate'] = {'value': d, 'confidence': conf}

            elif field == 'birthPlace':
                cleaned = value_text.strip().upper()
                if cleaned and 'birthPlace' not in fields:
                    fields['birthPlace'] = {'value': cleaned, 'confidence': conf}

            elif field == 'documentNumber':
                n = parse_docnumber(value_text)
                if n and 'documentNumber' not in fields:
                    fields['documentNumber'] = {'value': n, 'confidence': conf}
            break

    return fields


# ══════════════════════════════════════════════════════════════
#  EXTRACTION PERMIS — Norme EU (champs numérotés)
# ══════════════════════════════════════════════════════════════

PERMIS_FIELD_NUMBERS = {
    'lastName':      [r'^1[.,]?$'],
    'firstName':     [r'^2[.,]?$'],
    'birthDate':     [r'^3[.,]?$'],
    'issueDate':     [r'^4[Aa][.,]?$'],
    'documentExpiry':[r'^4[Bb][.,]?$'],
    'authority':     [r'^4[Cc][.,]?$'],
    'documentNumber':[r'^5[.,]?$'],
    'categories':    [r'^9[.,]?$', r'^12[.,]?$'],
}

def extract_permis_fields(words):
    """
    Extraction spatiale des champs permis de conduire EU.
    Stratégie : trouver les numéros de champ "1." "2." "3." "4a." etc.
    Ces numéros sont IMPRIMÉS sur toutes les cartes EU — très fiable.
    """
    fields = {}
    confident_words = [w for w in words if w['confidence'] >= 0.40]

    for field, patterns in PERMIS_FIELD_NUMBERS.items():
        # Cherche le mot-numéro
        label = None
        for pat in patterns:
            candidates = [w for w in confident_words if re.match(pat, w['text'])]
            if candidates:
                label = max(candidates, key=lambda w: w['confidence'])
                break
        if not label:
            continue

        # Valeur = mots à droite sur la même ligne
        value_words = words_to_right(label, confident_words, max_gap=0.70)
        if not value_words:
            # Ou juste en dessous
            value_words = words_below(label, confident_words, max_dy=0.07)

        if not value_words:
            continue

        value_text = best_text(value_words)
        if not value_text:
            continue

        conf = sum(v['confidence'] for v in value_words) / len(value_words)

        if field in ('lastName', 'firstName'):
            cleaned = clean_name(value_text)
            if cleaned:
                fields[field] = {'value': cleaned, 'confidence': conf}

        elif field in ('birthDate', 'issueDate', 'documentExpiry'):
            d = parse_date(value_text)
            if d:
                fields[field] = {'value': d, 'confidence': conf}

        elif field == 'documentNumber':
            n = parse_docnumber(value_text)
            if n:
                fields[field] = {'value': n, 'confidence': conf}

        elif field == 'categories':
            # Format: "B" "AM" "B96" etc.
            cats = re.findall(r'\b([A-D][A-Z0-9]{0,2}(?:\d+)?)\b', value_text.upper())
            if cats:
                fields['categories'] = {'value': cats, 'confidence': conf}
        else:
            fields[field] = {'value': value_text.strip(), 'confidence': conf}

    return fields


# ══════════════════════════════════════════════════════════════
#  TRAITEMENT D'UNE IMAGE
# ══════════════════════════════════════════════════════════════

def process_image(model, b64_image: str, doc_type: str) -> dict:
    import numpy as np
    from PIL import Image
    from io import BytesIO
    from doctr.io import DocumentFile

    img = Image.open(BytesIO(base64.b64decode(b64_image))).convert('RGB')
    doc = DocumentFile.from_images([np.array(img)])
    result = model(doc)

    # Collecte tous les mots avec positions et confiance
    all_words = []
    full_lines = []

    for page in result.pages:
        for block in page.blocks:
            for line in block.lines:
                line_words = []
                for word in line.words:
                    word_data = {
                        'text':       word.value,
                        'confidence': float(word.confidence),
                        'geometry':   [list(word.geometry[0]), list(word.geometry[1])],
                    }
                    all_words.append(word_data)
                    line_words.append(word.value)
                full_lines.append(' '.join(line_words))

    full_text = '\n'.join(full_lines)

    # Confiance globale (uniquement mots avec conf > 0.45)
    good_words = [w for w in all_words if w['confidence'] > 0.45]
    avg_conf = round(sum(w['confidence'] for w in good_words) / len(good_words) * 100) if good_words else 0

    # Extraction MRZ
    mrz_result = extract_mrz(all_words)
    mrz_text   = mrz_result['mrzText']    if mrz_result else ''
    mrz_fields = mrz_result['mrzFields']  if mrz_result else {}

    # Extraction spatiale des champs visuels
    if doc_type == 'PERMIS_CONDUIRE':
        visual_fields = extract_permis_fields(all_words)
    else:
        visual_fields = extract_cni_fields(all_words)

    # Fusion : MRZ prioritaire (plus fiable) sur les champs visuels
    merged_fields = {}
    all_field_names = set(visual_fields.keys()) | set(mrz_fields.keys())
    for fname in all_field_names:
        if fname in mrz_fields:
            merged_fields[fname] = mrz_fields[fname]
        elif fname in visual_fields:
            merged_fields[fname] = visual_fields[fname]

    # Zone texte (droite, sans photo) : x > 0.35, y < 0.80
    text_zone = sorted(
        [w for w in all_words if w['confidence'] > 0.45 and x1(w) > 0.35 and y1(w) < 0.80],
        key=lambda w: (round(cy(w) / 0.05), x1(w))
    )
    text_zone_text = ' '.join(w['text'] for w in text_zone)

    return {
        'fullText':      full_text,
        'textZoneText':  text_zone_text,
        'mrzText':       mrz_text,
        'confidence':    avg_conf,
        'engine':        'doctr',
        'fields':        merged_fields,   # champs structurés avec confiance par champ
    }


# ══════════════════════════════════════════════════════════════
#  SUBPROCESS PERSISTANT
# ══════════════════════════════════════════════════════════════

def main():
    try:
        model = load_model()
        sys.stdout.write(json.dumps({'ready': True, 'engine': 'doctr'}) + '\n')
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
        if not raw_line:
            continue
        try:
            req    = json.loads(raw_line)
            result = process_image(model, req['image'], req.get('docType', 'CNI'))
            sys.stdout.write(json.dumps(result) + '\n')
            sys.stdout.flush()
        except Exception as e:
            sys.stdout.write(json.dumps({'error': 'processing_failed', 'message': str(e)}) + '\n')
            sys.stdout.flush()


if __name__ == '__main__':
    main()
