"""Programme la semaine validée : YouTube et Facebook (date de publication chez eux), Instagram (programme du circuit n8n).

Usage : python3 publier.py semaine.json [--essai]

semaine.json :
{ "videos": [
  { "date": "2026-11-10", "heure": "13:00", "nom": "depot-garantie", "type": "vertical", "fichier": "sortie/depot.mp4", "textes": "textes/depot.json" },
  { "date": "2026-11-14", "heure": "10:00", "nom": "bail-meuble", "type": "youtube", "fichier": "sortie/bail-meuble.mp4", "textes": "textes/bail-meuble.json" } ] }

textes/*.json : comme publier une vidéo du circuit n8n (youtube.title/description/tags, facebook.description, instagram.caption,
x.text) ; « synthetic »: true dans youtube si un personnage généré par IA apparaît.
Accès : variables d'environnement BAILIO_RESEAUX_USER, BAILIO_RESEAUX_PASSWORD, BAILIO_N8N_API_KEY (jamais dans le dépôt).
Vidéo de plus de 12 Mo : la compresser d'abord (n8n est limité à 768 Mo de mémoire sur le serveur).
"""
import json, os, re, subprocess, sys, tempfile
from datetime import datetime
from zoneinfo import ZoneInfo

N8N = 'https://reseaux.bailio.fr'
IG_WORKFLOW = '21G7zupIbzMx9Kkv'       # « Bailio : Instagram programmé »
CHOIX = 'Choisir la vidéo du jour'
essai = '--essai' in sys.argv
semaine = json.load(open(sys.argv[1]))
base = os.path.dirname(os.path.abspath(sys.argv[1]))
auth = f"{os.environ.get('BAILIO_RESEAUX_USER', 'bailio')}:{os.environ['BAILIO_RESEAUX_PASSWORD']}"
key = os.environ['BAILIO_N8N_API_KEY']

def curl(*args):
  r = subprocess.run(['curl', '-s', '-m', '1500', '-u', auth, *args], capture_output=True, text=True)
  return r.stdout

ig = []
for v in semaine['videos']:
  quand = datetime.fromisoformat(f"{v['date']}T{v.get('heure', '13:00')}:00").replace(tzinfo=ZoneInfo('Europe/Paris'))
  data = json.load(open(os.path.join(base, v['textes'])))
  data.update({'mode': 'test' if essai else 'publier', 'schedule': quand.isoformat(), 'reseaux': ['youtube', 'facebook'] if v['type'] == 'vertical' else ['youtube']})
  with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as t: json.dump(data, t, ensure_ascii=False)
  fichier = os.path.join(base, v['fichier'])
  if os.path.getsize(fichier) > 12_000_000: sys.exit(f"{v['nom']} : fichier trop lourd ({os.path.getsize(fichier)} octets), le compresser d'abord.")
  out = curl('-F', f'video=@{fichier};type=video/mp4', '-F', f'data=<{t.name}', f'{N8N}/webhook/bailio-publier')
  try: res = json.loads(out)
  except Exception: sys.exit(f"{v['nom']} : réponse inattendue de n8n : {out[:300]}")
  yt, fb = res.get('youtube') or {}, res.get('facebook') or {}
  print(f"{v['nom']} ({quand:%d/%m %H:%M}) : YouTube {yt.get('id')} {yt.get('statut')} | Facebook {fb.get('id')} statut {fb.get('statut')}")
  if v['type'] == 'vertical' and fb.get('id'):
    ig.append({'date': v['date'], 'nom': v['nom'], 'fbVideo': fb['id'], 'caption': data.get('instagram', {}).get('caption', '')})

if ig and not essai:
  # Programme Instagram : ajouté au code du nœud « Choisir la vidéo du jour » du circuit n8n.
  h = ['-H', f'X-N8N-API-KEY: {key}']
  wf = json.loads(curl(*h, f'{N8N}/api/v1/workflows/{IG_WORKFLOW}'))
  node = next(n for n in wf['nodes'] if n['name'] == CHOIX)
  code = node['parameters']['jsCode']
  m = re.search(r'const PROGRAMME = (\[.*?\]);\n', code, re.S)
  ancien = [e for e in json.loads(m.group(1)) if e['date'] not in {x['date'] for x in ig}]
  prog = sorted(ancien + ig, key=lambda e: e['date'])
  node['parameters']['jsCode'] = code.replace(m.group(0), f'const PROGRAMME = {json.dumps(prog, ensure_ascii=False)};\n')
  body = {k: wf[k] for k in ('name', 'nodes', 'connections', 'settings')}
  with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as t: json.dump(body, t, ensure_ascii=False)
  curl(*h, '-X', 'POST', f'{N8N}/api/v1/workflows/{IG_WORKFLOW}/deactivate')
  r = curl(*h, '-H', 'Content-Type: application/json', '-X', 'PUT', f'{N8N}/api/v1/workflows/{IG_WORKFLOW}', '-d', f'@{t.name}')
  curl(*h, '-X', 'POST', f'{N8N}/api/v1/workflows/{IG_WORKFLOW}/activate')
  print('Instagram : programme mis à jour,', len(prog), 'dates :', ', '.join(e['date'] for e in prog))
