#!/usr/bin/env python3
"""
doctr OCR — le modèle open source de Mindee (MIT License).
C'est exactement le même modèle derrière l'API Mindee payante.

Modèles :
  Détection  : db_resnet50     (trouve les régions de texte)
  Reco       : crnn_mobilenet_v3_large  (lit les caractères)

Mode : subprocess persistant (modèle chargé une fois, réutilisé)
  - Lit des requêtes JSON sur stdin  ({"image": "<base64>", "docType": "CNI"})
  - Écrit des réponses JSON sur stdout ({"fullText": "...", "confidence": 90})

Installation :
  pip install "python-doctr[torch]"     # avec PyTorch (recommandé)
  pip install "python-doctr[tf]"         # avec TensorFlow
  pip install python-doctr onnxruntime  # sans DL framework (plus léger)
"""

import sys
import json
import base64
import os
import logging

# Silence tous les logs DL (PyTorch / TF / doctr)
logging.disable(logging.CRITICAL)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'
os.environ['DOCTR_CACHE_DIR'] = os.path.join(os.path.expanduser('~'), '.cache', 'doctr')


def load_model():
    from doctr.models import ocr_predictor
    # db_resnet50 : détection haute précision (texte dense, petits caractères)
    # crnn_mobilenet_v3_large : reconnaissance — meilleur compromis précision/vitesse
    # assume_straight_pages : CNI et permis sont toujours rectilignes (pas de skew)
    model = ocr_predictor(
        det_arch='db_resnet50',
        reco_arch='crnn_mobilenet_v3_large',
        pretrained=True,
        assume_straight_pages=True,
        export_as_straight_boxes=True,
    )
    return model


def extract_mrz_lines(words_with_positions):
    """
    Identifie les lignes MRZ (OCR-B, bas du document).
    Une ligne MRZ = séquence de tokens avec uniquement des lettres majuscules, chiffres et <
    positionnée dans le tiers inférieur du document (y > 0.70).
    """
    MRZ_RE = __import__('re').compile(r'^[A-Z0-9<]{5,}$')
    mrz_candidates = []
    for w in words_with_positions:
        # geometry = [[x1, y1], [x2, y2]] normalisé 0-1
        geo = w.get('geometry', [[0, 0], [0, 0]])
        y_center = (geo[0][1] + geo[1][1]) / 2
        if y_center > 0.70 and MRZ_RE.match(w['text']):
            mrz_candidates.append(w)

    if not mrz_candidates:
        return ''

    # Groupe par ligne (y proche)
    mrz_candidates.sort(key=lambda w: w['geometry'][0][1])
    lines = []
    current_line = [mrz_candidates[0]]
    for w in mrz_candidates[1:]:
        if abs(w['geometry'][0][1] - current_line[-1]['geometry'][0][1]) < 0.04:
            current_line.append(w)
        else:
            lines.append(current_line)
            current_line = [w]
    lines.append(current_line)

    # Trie chaque ligne par x
    mrz_text_lines = []
    for line in lines:
        line.sort(key=lambda w: w['geometry'][0][0])
        mrz_text_lines.append(''.join(w['text'] for w in line))

    return '\n'.join(mrz_text_lines)


def process_image(model, b64_image: str, doc_type: str) -> dict:
    import numpy as np
    from PIL import Image
    from io import BytesIO
    from doctr.io import DocumentFile

    img = Image.open(BytesIO(base64.b64decode(b64_image))).convert('RGB')
    img_np = np.array(img)

    doc = DocumentFile.from_images([img_np])
    result = model(doc)

    # Extraction structurée : lignes + mots avec positions
    full_lines = []
    all_words = []
    words_with_positions = []

    for page in result.pages:
        for block in page.blocks:
            for line in block.lines:
                line_words = []
                for word in line.words:
                    line_words.append(word.value)
                    all_words.append({'text': word.value, 'confidence': word.confidence})
                    words_with_positions.append({
                        'text': word.value,
                        'confidence': word.confidence,
                        'geometry': [list(word.geometry[0]), list(word.geometry[1])],
                    })
                full_lines.append(' '.join(line_words))

    full_text = '\n'.join(full_lines)
    confidences = [w['confidence'] for w in all_words]
    avg_conf = round(sum(confidences) / len(confidences) * 100) if confidences else 0

    # Extraction zone MRZ (partie inférieure — OCR-B)
    mrz_text = extract_mrz_lines(words_with_positions)

    # Zone texte : mots dans la partie supérieure-droite (sans la photo)
    # x > 0.35 et y < 0.80
    text_zone_words = [
        w for w in words_with_positions
        if w['geometry'][0][0] > 0.35 and w['geometry'][0][1] < 0.80
    ]
    text_zone_words.sort(key=lambda w: (round(w['geometry'][0][1] / 0.05), w['geometry'][0][0]))
    text_zone_text = ' '.join(w['text'] for w in text_zone_words)

    return {
        'fullText': full_text,
        'textZoneText': text_zone_text,
        'mrzText': mrz_text,
        'confidence': avg_conf,
        'engine': 'doctr',
    }


def main():
    # Chargement du modèle (une seule fois au démarrage)
    try:
        model = load_model()
        # Signal "prêt" au processus Node.js
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

    # Boucle persistante : une requête JSON par ligne stdin → réponse JSON sur stdout
    for raw_line in sys.stdin:
        raw_line = raw_line.strip()
        if not raw_line:
            continue
        try:
            req = json.loads(raw_line)
            result = process_image(model, req['image'], req.get('docType', 'CNI'))
            sys.stdout.write(json.dumps(result) + '\n')
            sys.stdout.flush()
        except Exception as e:
            sys.stdout.write(json.dumps({'error': 'processing_failed', 'message': str(e)}) + '\n')
            sys.stdout.flush()


if __name__ == '__main__':
    main()
