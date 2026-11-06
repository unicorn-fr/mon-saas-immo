"""Convertit docs/legal/notice-2026.txt (texte officiel, une ligne par paragraphe) en server/src/pdf/notice-text-2026.ts.
Le texte n'est jamais modifié : seule sa structure (titres, listes, tableaux, notes) est reconnue."""
import json, re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
lines = [l.rstrip('\n') for l in (root / 'docs/legal/notice-2026.txt').read_text(encoding='utf-8').splitlines()]
blocks, notes = [], []
NOT_SUB = ("C'est ", 'Il ', 'Le ', 'La ', 'Les ', 'Dans ', 'Ce ', 'Cette ', 'Pour ', 'A ', 'Au ', 'En ', 'Lorsque ', 'Si ', 'Un ', 'Une ', 'Sont ', 'Des ', 'Afin ')
for l in lines:
    if not l.strip() or l.startswith('##'):
        continue
    if l == '[[TABLE_METRO]]':
        blocks.append({'t': 'table', 'k': 'metro'}); continue
    if l == '[[TABLE_DOM]]':
        blocks.append({'t': 'table', 'k': 'dom'}); continue
    if l == 'Préambule':
        blocks.append({'t': 'h', 'n': '', 'x': l, 'lvl': 1}); continue
    m = re.match(r'^\((\d+)\) (.+)$', l)
    if m:
        notes.append([m.group(1), m.group(2)]); continue
    m = re.match(r'^(\d+(?:\.\d+)*)\.\s(.+)$', l)
    if m and not l.endswith((';', '.')) and len(l) < 130:
        n = m.group(1)
        blocks.append({'t': 'h', 'n': n, 'x': m.group(2), 'lvl': min(4, n.count('.') + 1)}); continue
    if l.startswith('- '):
        blocks.append({'t': 'li', 'x': l[2:]}); continue
    if l.endswith(':') and len(l) <= 90 and not l.startswith(NOT_SUB) and not re.match(r'^[ab]\) ', l) and ' : ' not in l[:-2]:
        blocks.append({'t': 'sub', 'x': l}); continue
    blocks.append({'t': 'p', 'x': l})
out = root / 'server/src/pdf/notice-text-2026.ts'
body = ',\n'.join('  ' + json.dumps(b, ensure_ascii=False) for b in blocks)
fn = ',\n'.join('  ' + json.dumps(n, ensure_ascii=False) for n in notes)
APP = 'Application aux nouveaux contrats de location et aux renouvellements ou reconductions tacites de contrats.'
REF25 = 'Article 160, loi n° 2021-1104 du 22 août 2021 ; article 6, loi n° 89-462 du 6 juillet 1989 (version en vigueur au 1er janvier 2025)'
metro = [['1er janvier 2023', 'Consommation en énergie finale < 450 kWhEF/m2/an', 'Article 17, loi n° 2019-1147 du 8 novembre 2019 ; article 6, loi n° 89-462 du 6 juillet 1989 (version en vigueur au 1er janvier 2023) ; décret n° 2021-19 du 11 janvier 2021', APP],
         ['1er janvier 2025', 'Classe DPE F', REF25, APP], ['1er janvier 2028', 'Classe DPE E', REF25, APP], ['1er janvier 2034', 'Classe DPE D', REF25, APP]]
dom = [['1er janvier 2028', 'Classe DPE F', REF25, APP], ['1er janvier 2031', 'Classe DPE E', REF25, APP]]
cols = ['Echéance', 'Critère ou niveau de performance énergétique minimal', 'Textes de référence', 'Application']
out.write_text(f'''/**
 * Notice d'information annexée aux contrats de location de logement à usage de résidence principale : annexe de l'arrêté
 * du 29 mai 2015, dans sa rédaction issue de l'arrêté du 9 octobre 2026 (NOR VLOL2619452A, JO du 17 octobre 2026), pour
 * les contrats conclus ou renouvelés depuis le 18 octobre 2026 (art. 2). Texte reproduit à l'identique : ne pas reformuler.
 * Généré par scripts/notice-2026.py depuis docs/legal/notice-2026.txt ; seule la mise en page est propre à Bailio.
 */
import type {{ NoticeBlock }} from './notice-text.js'

export const NOTICE_2026_REFERENCE = 'Arrêté du 29 mai 2015 modifié par l’arrêté du 9 octobre 2026'
/** Date d'entrée en vigueur : contrats conclus ou renouvelés à compter de ce jour. */
export const NOTICE_2026_FROM = '2026-10-18'

/** Version de la notice à joindre à un bail conclu (ou renouvelé) à cette date ; sans date (bail en préparation), la version en vigueur. */
export const leaseNoticeVersion = (concludedOn?: string | null, today = new Date().toISOString().slice(0, 10)): '2023' | '2026' => ((concludedOn ?? today) >= NOTICE_2026_FROM ? '2026' : '2023')

/** Tableaux des échéances de décence énergétique : France métropolitaine, puis Guadeloupe, Martinique, Guyane, La Réunion et Mayotte. */
export const NOTICE_2026_TABLES = {{
  columns: {json.dumps(cols, ensure_ascii=False)},
  metro: {json.dumps(metro, ensure_ascii=False)},
  dom: {json.dumps(dom, ensure_ascii=False)},
}}

export const NOTICE_2026_BLOCKS: NoticeBlock[] = [
{body},
]

export const NOTICE_2026_FOOTNOTES: [string, string][] = [
{fn},
]
''', encoding='utf-8')
print(len(blocks), 'blocs,', len(notes), 'notes,', sum(1 for b in blocks if b['t']=='h'), 'titres')
