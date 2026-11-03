"""Horodatage mot à mot de la voix off, sur la machine (Whisper local, gratuit), au format attendu par align.py.
Usage : python3 transcrire.py voix.wav mots.json   (première fois : pip install faster-whisper)"""
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel
model = WhisperModel('small', device='cpu', compute_type='int8')
# Audio décodé par ffmpeg (16 kHz mono) : évite les écarts de version de la bibliothèque de lecture.
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
segments, _ = model.transcribe(audio, language='fr', word_timestamps=True, vad_filter=False)
chunks = [{'timestamp': [round(w.start, 2), round(w.end, 2)], 'text': ' ' + w.word.strip()} for s in segments for w in s.words]
json.dump({'chunks': chunks}, open(sys.argv[2], 'w'), ensure_ascii=False)
print(len(chunks), 'mots')
