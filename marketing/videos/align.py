import json,re,sys,difflib,unicodedata
d,script=sys.argv[1],open(sys.argv[2]).read()
chunks=json.load(open(f'{d}/mots.json'))['chunks']
wh=[]
for c in chunks:
  t=c['text'].strip(); s,e=c['timestamp']
  if (t.startswith("'") or t.startswith('-') or t.startswith('.')) and wh: wh[-1]['t']+=t; wh[-1]['e']=e; continue
  if t=='%' and wh: wh[-1]['t']+=' %'; continue
  wh.append({'t':t,'s':s,'e':e})
norm=lambda x: re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFD',x.lower()).encode('ascii','ignore').decode())
raw=[w for w in re.split(r'\s+',script.replace('’',"'")) if w]
sw=[]
for w in raw:
  if re.fullmatch(r'[?:!;%€]+',w) and sw: sw[-1]+='\u202f'+w
  else: sw.append(w)
# les nombres écrits en lettres / chiffres : on compare sur la forme normalisée, sinon interpolation
A=[norm(w) for w in sw]; B=[norm(w['t']) for w in wh]
sm=difflib.SequenceMatcher(None,A,B,autojunk=False)
times=[None]*len(sw)
for a,b,n in sm.get_matching_blocks():
  for k in range(n): times[a+k]=(wh[b+k]['s'],wh[b+k]['e'])
# interpolation des mots non retrouvés
known=[i for i,x in enumerate(times) if x]
for i in range(len(sw)):
  if times[i] is None:
    p=max([k for k in known if k<i],default=None); q=min([k for k in known if k>i],default=None)
    ps=times[p][1] if p is not None else 0; qs=times[q][0] if q is not None else ps+0.4
    span=[k for k in range((p if p is not None else -1)+1,(q if q is not None else len(sw)))]
    j=span.index(i); step=(qs-ps)/(len(span)+0)
    times[i]=(ps+j*step, ps+(j+1)*step)
words=[{'t':w.replace("'",'’'),'s':round(times[i][0],3),'e':round(times[i][1],3)} for i,w in enumerate(sw)]
groups=[];cur=[]
for w in words:
  cur.append(w)
  if len(cur)>=3 or re.search(r'[.,:?!]$',w['t']):
    groups.append({'s':cur[0]['s'],'e':cur[-1]['e'],'words':[x['t'] for x in cur],'ws':[x['s'] for x in cur]}); cur=[]
if cur: groups.append({'s':cur[0]['s'],'e':cur[-1]['e'],'words':[x['t'] for x in cur],'ws':[x['s'] for x in cur]})
open(f'{d}/data.js','w').write('window.WORDS='+json.dumps(words,ensure_ascii=False)+';window.CAPTIONS='+json.dumps(groups,ensure_ascii=False))
print(d, sum(1 for x in sm.get_matching_blocks() for _ in range(x[2])),'/',len(sw),'mots calés')
