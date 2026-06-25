"""
OCR API — FastAPI service pour extraction MRZ + texte CNI/Permis/Passeport.

Architecture :
  - Écoute sur http://127.0.0.1:5001 (port passé en argv[1])
  - GET  /health  → {"status": "ok"}
  - POST /scan    → {"image": "<base64>", "docType": "CNI|PERMIS_CONDUIRE|PASSEPORT"}

Cascade :
  A. fastmrz   (confidence 92) — MRZ ICAO TD1/TD3
  B. pytesseract MRZ fallback  — crop + upscale + whitelist
  C. PaddleOCR                 — texte full + labels structurés

Démarre sans erreur si paddleocr/fastmrz non installés (try/except).
"""

import sys
import base64
import logging
import re
import io
from typing import Optional

import numpy as np
import cv2
from PIL import Image
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

logging.basicConfig(stream=sys.stderr, level=logging.INFO, format="[ocr_api] %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ─── Import facultatifs ────────────────────────────────────────────────────────

try:
    from fastmrz import FastMRZ
    _fastmrz = FastMRZ()
    log.info("fastmrz chargé")
except Exception as e:
    _fastmrz = None
    log.warning("fastmrz non disponible: %s", e)

try:
    import pytesseract
    _pytesseract = pytesseract
    log.info("pytesseract chargé")
except Exception as e:
    _pytesseract = None
    log.warning("pytesseract non disponible: %s", e)

_paddle_ocr = None

def _load_paddle():
    global _paddle_ocr
    if _paddle_ocr is not None:
        return _paddle_ocr
    try:
        from paddleocr import PaddleOCR
        _paddle_ocr = PaddleOCR(use_angle_cls=True, lang='fr', show_log=False)
        log.info("PaddleOCR chargé")
    except Exception as e:
        log.warning("PaddleOCR non disponible: %s", e)
        _paddle_ocr = False  # marqué False = essai fait, non dispo
    return _paddle_ocr

# Pré-charge PaddleOCR au démarrage (non bloquant — erreur silencieuse)
try:
    _load_paddle()
except Exception:
    pass

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _yymmdd(s: str) -> Optional[str]:
    """Convertit YYMMDD → YYYY-MM-DD. YY < 30 → 20YY, sinon 19YY."""
    if not s or not re.match(r'^\d{6}$', s):
        return None
    yy, mm, dd = int(s[:2]), s[2:4], s[4:6]
    yyyy = f"20{s[:2]:>02}" if yy < 30 else f"19{s[:2]:>02}"
    return f"{yyyy}-{mm}-{dd}"


def _norm_date(s: str) -> Optional[str]:
    """DD.MM.YYYY ou DD/MM/YYYY → YYYY-MM-DD."""
    m = re.match(r'(\d{1,2})[./\-](\d{2})[./\-](\d{4})', s)
    if not m:
        return None
    dd, mm, yyyy = m.group(1).zfill(2), m.group(2), m.group(3)
    return f"{yyyy}-{mm}-{dd}"


def capitalize_first(s: str) -> str:
    """Premier token, premier char majuscule, reste minuscule."""
    if not s:
        return s
    token = s.strip().split()[0] if s.strip() else s
    return token[0].upper() + token[1:].lower()


def deskew(img: np.ndarray) -> np.ndarray:
    """Correction légère d'inclinaison via minAreaRect. Seulement si angle > 0.5°."""
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img.copy()
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) < 50:
            return img
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = 90 + angle
        if abs(angle) < 0.5:
            return img
        (h, w) = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC,
                                  borderMode=cv2.BORDER_REPLICATE)
        return rotated
    except Exception as e:
        log.warning("deskew error: %s", e)
        return img


def preprocess_full(img: np.ndarray) -> np.ndarray:
    """Grayscale + CLAHE(2.0) + sharpen."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img.copy()
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(enhanced, -1, kernel)
    return sharpened


def preprocess_mrz(img: np.ndarray) -> np.ndarray:
    """Crop bas 22%, grayscale + Otsu + resize x3."""
    h, w = img.shape[:2]
    top = int(h * 0.78)
    crop = img[top:, :]
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop.copy()
    _, bw = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    upscaled = cv2.resize(bw, (bw.shape[1] * 3, bw.shape[0] * 3), interpolation=cv2.INTER_CUBIC)
    return upscaled


def parse_mrz_lines(lines: list) -> dict:
    """
    Parse TD1 (3 lignes CNI) ou TD3 (2 lignes passeport).
    Retourne un dict avec les champs extraits.
    """
    result = {}
    mrz_pat = re.compile(r'^[A-Z0-9<]{25,36}$')
    clean = [l.replace(' ', '').upper() for l in lines if mrz_pat.match(l.replace(' ', '').upper())]

    if len(clean) >= 3:
        # TD1 — 3 lignes (CNI française)
        l1, l2, l3 = clean[0], clean[1], clean[2]
        # Ligne 3 contient NOM<<PRENOM
        if '<<' in l3:
            parts = l3.split('<<')
            raw_last = parts[0].replace('<', ' ').strip()
            raw_first = parts[1].replace('<', ' ').strip().split()[0] if len(parts) > 1 else ''
            if len(raw_last) >= 2:
                result['lastName'] = raw_last
            if len(raw_first) >= 2:
                result['firstName'] = capitalize_first(raw_first)
        # Ligne 2 : pos 0-5 = birthdate, 7 = sex, 8-13 = expiry
        if len(l2) >= 14:
            bd = _yymmdd(l2[0:6])
            if bd:
                result['birthDate'] = bd
            sex = l2[7] if len(l2) > 7 else ''
            if sex in ('M', 'F'):
                result['sex'] = sex
            exp = _yymmdd(l2[8:14])
            if exp:
                result['documentExpiry'] = exp

    elif len(clean) >= 2:
        # TD3 — 2 lignes (passeport)
        l1, l2 = clean[0], clean[1]
        # Ligne 1 : pos 5+ contient NOM<<PRENOM
        if len(l1) > 5 and '<<' in l1[5:]:
            name_part = l1[5:]
            parts = name_part.split('<<')
            raw_last = parts[0].replace('<', ' ').strip()
            raw_first = parts[1].replace('<', ' ').strip().split()[0] if len(parts) > 1 else ''
            if len(raw_last) >= 2:
                result['lastName'] = raw_last
            if len(raw_first) >= 2:
                result['firstName'] = capitalize_first(raw_first)
        # Ligne 2 : pos 13-18 = birthdate, 20 = sex, 21-26 = expiry
        if len(l2) >= 27:
            bd = _yymmdd(l2[13:19])
            if bd:
                result['birthDate'] = bd
            sex = l2[20] if len(l2) > 20 else ''
            if sex in ('M', 'F'):
                result['sex'] = sex
            exp = _yymmdd(l2[21:27])
            if exp:
                result['documentExpiry'] = exp

    return result


# ─── FastAPI ──────────────────────────────────────────────────────────────────

app = FastAPI(title="Bailio OCR API")


class ScanRequest(BaseModel):
    image: str        # base64 JPEG
    docType: str      # CNI | PERMIS_CONDUIRE | PASSEPORT


class ScanResponse(BaseModel):
    lastName:       Optional[str] = None
    firstName:      Optional[str] = None
    birthDate:      Optional[str] = None
    birthPlace:     Optional[str] = None
    documentNumber: Optional[str] = None
    documentExpiry: Optional[str] = None
    nationality:    Optional[str] = None
    sex:            Optional[str] = None
    confidence:     int = 0
    engine:         str = "none"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/scan", response_model=ScanResponse)
def scan(req: ScanRequest):
    # 1. Décode base64 → numpy array
    try:
        img_bytes = base64.b64decode(req.image)
        arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("imdecode returned None")
    except Exception as e:
        log.error("Décodage image: %s", e)
        return ScanResponse()

    # 2. Resize si > 1800px
    h, w = img.shape[:2]
    max_dim = max(h, w)
    if max_dim > 1800:
        scale = 1800 / max_dim
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    # 3. Deskew
    img = deskew(img)

    doc_type = req.docType  # CNI | PERMIS_CONDUIRE | PASSEPORT

    result: dict = {}
    engine_parts: list = []

    # ── A. fastmrz ────────────────────────────────────────────────────────────
    if _fastmrz is not None:
        try:
            # fastmrz attend un ndarray BGR
            mrz_data = _fastmrz.get_mrz(img, raw=False)
            if mrz_data and isinstance(mrz_data, dict):
                surname   = mrz_data.get('surname') or mrz_data.get('last_name') or ''
                given     = mrz_data.get('given_names') or mrz_data.get('first_name') or ''
                birth     = mrz_data.get('date_of_birth') or mrz_data.get('birth_date') or ''
                expiry    = mrz_data.get('expiry_date') or mrz_data.get('date_of_expiry') or ''
                sex       = mrz_data.get('sex') or ''
                nat       = mrz_data.get('nationality') or ''
                doc_num   = mrz_data.get('document_number') or mrz_data.get('id_number') or ''

                if surname and len(str(surname).strip()) >= 2:
                    result['lastName'] = str(surname).strip().upper()
                if given and len(str(given).strip()) >= 2:
                    result['firstName'] = capitalize_first(str(given))
                if birth:
                    # fastmrz peut retourner YYMMDD ou YYYY-MM-DD
                    b = str(birth).strip()
                    result['birthDate'] = _yymmdd(b) if re.match(r'^\d{6}$', b) else b
                if expiry:
                    e = str(expiry).strip()
                    result['documentExpiry'] = _yymmdd(e) if re.match(r'^\d{6}$', e) else e
                if sex in ('M', 'F'):
                    result['sex'] = sex
                if nat:
                    result['nationality'] = str(nat).strip().upper()[:3]
                if doc_num:
                    result['documentNumber'] = str(doc_num).strip().replace(' ', '')

                if result.get('lastName') or result.get('firstName') or result.get('birthDate'):
                    engine_parts.append('fastmrz')
                    log.info("fastmrz OK: %s %s", result.get('lastName'), result.get('birthDate'))
        except Exception as e:
            log.warning("fastmrz error: %s", e)

    # ── B. pytesseract MRZ fallback ───────────────────────────────────────────
    if _pytesseract is not None and not (result.get('lastName') and result.get('birthDate')):
        try:
            mrz_img = preprocess_mrz(img)
            # pytesseract attend une image PIL ou ndarray
            pil_mrz = Image.fromarray(mrz_img)
            tess_config = '--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<'
            raw_text = _pytesseract.image_to_string(pil_mrz, config=tess_config)
            lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
            parsed = parse_mrz_lines(lines)
            if parsed:
                # Merge — ne remplace que si champ absent
                for k, v in parsed.items():
                    if k not in result or not result[k]:
                        result[k] = v
                engine_parts.append('pytesseract-mrz')
                log.info("pytesseract MRZ: %s", parsed)
        except Exception as e:
            log.warning("pytesseract MRZ error: %s", e)

    # ── C. PaddleOCR ─────────────────────────────────────────────────────────
    paddle = _load_paddle()
    if paddle and paddle is not False:
        try:
            full_img = preprocess_full(img)
            # PaddleOCR attend BGR (3 channels) ou grayscale
            if len(full_img.shape) == 2:
                full_img_3ch = cv2.cvtColor(full_img, cv2.COLOR_GRAY2BGR)
            else:
                full_img_3ch = full_img
            ocr_result = paddle.ocr(full_img_3ch, cls=True)
            # Aplatit la liste de résultats
            texts = []
            if ocr_result:
                for page in ocr_result:
                    if page:
                        for line in page:
                            if line and len(line) >= 2 and line[1]:
                                txt = line[1][0] if isinstance(line[1], (list, tuple)) else str(line[1])
                                texts.append(txt.strip())
            full_text = '\n'.join(texts)

            if doc_type == 'PERMIS_CONDUIRE':
                # Champs numérotés 1. 2. 3.
                if not result.get('lastName'):
                    m = re.search(r'1[.\)]\s*([A-ZÁÉÈÊÀÙÎÏÔÛÇ\-\' ]{2,35})', full_text, re.IGNORECASE)
                    if m:
                        result['lastName'] = m.group(1).strip().upper()
                if not result.get('firstName'):
                    m = re.search(r'2[.\)]\s*([A-ZÁÉÈÊÀÙÎÏÔÛÇa-záéèêàùîïôûç\-\']{2,35})', full_text, re.IGNORECASE)
                    if m:
                        result['firstName'] = capitalize_first(m.group(1).strip())
                if not result.get('birthDate'):
                    m = re.search(r'3[.\)]\s*(\d{2}[./\-]\d{2}[./\-]\d{4})', full_text, re.IGNORECASE)
                    if m:
                        result['birthDate'] = _norm_date(m.group(1))
            else:
                # CNI — labels textuels
                if not result.get('lastName'):
                    m = re.search(r'Nom\s+(?:de\s+famille)?[:\s]+([A-ZÁÉÈÊÀÙÎÏÔÛÇ\-\']{2,35})', full_text, re.IGNORECASE)
                    if m:
                        result['lastName'] = m.group(1).strip().upper()
                if not result.get('firstName'):
                    m = re.search(r'Pr[ée]noms?[:\s]+([A-ZÁÉÈÊÀÙÎÏÔÛÇa-záéèêàùîïôûç\-\']{2,35})', full_text, re.IGNORECASE)
                    if m:
                        result['firstName'] = capitalize_first(m.group(1).strip())
                if not result.get('birthDate'):
                    m = re.search(r'N[ée]e?\s*(?:le)?[:\s]+(\d{1,2}[./\-]\d{2}[./\-]\d{4})', full_text, re.IGNORECASE)
                    if m:
                        result['birthDate'] = _norm_date(m.group(1))

                # Lieu de naissance
                if not result.get('birthPlace'):
                    m = re.search(r'(?:Lieu|[Àa])\s+([A-ZÁÉÈÊÀÙÎÏÔÛÇ][a-záéèêàùîïôûç\-\' ]{2,30})', full_text)
                    if m:
                        result['birthPlace'] = m.group(1).strip()

            # Fallback CAPS si pas de nom
            if not result.get('lastName'):
                BLACKLIST = {
                    'FRANCE', 'REPUBLIQUE', 'NATIONALE', 'IDENTITE', 'CARTE',
                    'EUROPEENNE', 'NOM', 'PRENOM', 'PRENOMS', 'NAISSANCE', 'DATE',
                    'SEXE', 'NATIONALITE', 'VALIDITE', 'DELIVREE', 'AUTORITE',
                    'PERMIS', 'CONDUIRE', 'CATEGORIE',
                }
                for line in texts:
                    stripped = line.strip()
                    if re.match(r'^[A-ZÁÉÈÊÀÙÎÏÔÛÇ\-\' ]{2,35}$', stripped) and stripped == stripped.upper():
                        word = stripped.split()[0] if stripped.split() else ''
                        if len(word) >= 2 and word not in BLACKLIST:
                            result['lastName'] = stripped
                            break

            if result.get('lastName') or result.get('firstName') or result.get('birthDate'):
                engine_parts.append('paddleocr')
                log.info("PaddleOCR OK: %s %s", result.get('lastName'), result.get('birthDate'))
        except Exception as e:
            log.warning("PaddleOCR error: %s", e)

    # ── Correction firstName : premier token uniquement ───────────────────────
    if result.get('firstName'):
        result['firstName'] = capitalize_first(result['firstName'])

    # ── Résolution ambiguïté dates (naissance vs expiry) ─────────────────────
    # Si les deux dates existent et semblent proches → plus ancienne = naissance
    if result.get('birthDate') and result.get('documentExpiry'):
        try:
            bd = result['birthDate']
            exp = result['documentExpiry']
            if bd > exp:  # YYYY-MM-DD comparison — si naissance > expiry, swap
                result['birthDate'], result['documentExpiry'] = exp, bd
        except Exception:
            pass

    # ── Confiance ────────────────────────────────────────────────────────────
    confidence = 0
    if 'fastmrz' in engine_parts:
        confidence = 92
    elif 'pytesseract-mrz' in engine_parts:
        confidence = 75
    elif 'paddleocr' in engine_parts:
        confidence = 65

    engine_str = '+'.join(engine_parts) if engine_parts else 'none'

    return ScanResponse(
        lastName       = result.get('lastName'),
        firstName      = result.get('firstName'),
        birthDate      = result.get('birthDate'),
        birthPlace     = result.get('birthPlace'),
        documentNumber = result.get('documentNumber'),
        documentExpiry = result.get('documentExpiry'),
        nationality    = result.get('nationality'),
        sex            = result.get('sex'),
        confidence     = confidence,
        engine         = engine_str,
    )


# ─── Entrypoint ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
    log.info("Démarrage sur 127.0.0.1:%d", port)
    uvicorn.run(app, host='127.0.0.1', port=port, log_level='warning')
