import { ThirdPartyNotice } from '../components/DataNotice'
import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Logo } from '../components/Logo'
import { Fields } from '../components/FlowLayout'
import { Btn, Callout, Card, Chips, Input, LoadError, Loader, Money, TextLink, useLoad, useToast, AddressInput } from '../components/kit'
import { display } from '../components/ui'
import { api } from '../lib/api'
import { PublicPhoto } from '../components/media'
import { DocFilesRow, type DocFile } from '../components/DocFiles'
import { Choices, QuestionScreen, useQuestion } from '../components/Questions'
import { SITUATION_LABEL, type Situation } from '../lib/contract'

type Person = Record<string, string | number | null | Array<Record<string, string | null>>>
interface View {
  landlord: string
  property: string | null
  /** Le logement a une photo (la première de sa fiche). */
  hasPhoto?: boolean
  guarantee: 'CAUTION' | 'VISALE' | 'GLI' | 'NONE' | null
  tenant: Person
  guarantor: Person | null
  documents: Record<string, boolean>
  guarantorDocuments: Record<string, boolean> | null
  /** Fichiers déjà reçus pour chaque pièce (plusieurs possibles). */
  files?: Record<string, DocFile[]>
  guarantorFiles?: Record<string, DocFile[]> | null
  /** Fichiers attendus d'habitude (3 bulletins de salaire). */
  suggested?: Record<string, number>
  labels: Record<string, string>
  missing: Array<{ key: string; label: string; who: 'TENANT' | 'GUARANTOR'; kind: 'INFO' | 'DOCUMENT' }>
}

const DOC_HINTS: Record<string, string> = {
  identity: 'Carte d’identité, passeport ou titre de séjour',
  home: 'Quittances de loyer, attestation d’hébergement ou taxe foncière',
  activity: 'Contrat de travail, carte d’étudiant, extrait Kbis…',
  taxNotice: 'Dernier ou avant-dernier avis d’imposition ou de non-imposition',
  income: 'Trois derniers bulletins de salaire, bourse, pension, allocations…',
}

/**
 * Dossier du locataire, depuis le lien envoyé par son futur bailleur : sans compte, il complète ses informations
 * (et celles de son garant) et dépose les pièces que la loi autorise à demander. Tout arrive dans sa fiche.
 */
export default function Dossier() {
  const { code = '' } = useParams()
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api<View>(`/dossier/${encodeURIComponent(code)}`), [code])
  const [view, setView] = useState<View | null>(null)
  const [done, setDone] = useState(false)
  // Par défaut, un parcours guidé : seulement ce qui manque, une question à la fois. « Tout voir » ouvre le dossier entier.
  // Choisi une fois, à l'ouverture : le parcours guidé reste ouvert jusqu'au bout, même quand plus rien ne manque.
  const [mode, setMode] = useState<'guided' | 'all' | null>(null)
  useEffect(() => {
    if (data && mode === null) setMode(data.missing.length ? 'guided' : 'all')
  }, [data, mode])
  useEffect(() => setView(data), [data])
  const v = view ?? data
  const finish = async () => {
    try {
      await api(`/dossier/${encodeURIComponent(code)}/done`, { method: 'POST' })
      setDone(true)
    } catch (e) {
      toast.error(e)
    }
  }
  return (
    <div style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink }}>
      <header style={{ padding: '20px clamp(16px, 4vw, 40px)', borderBottom: `1px solid ${BAI.divider}`, background: BAI.surface }}>
        <Logo />
      </header>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) 16px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {(loading && !v) || (v && mode === null) ? (
          <Loader />
        ) : error || !v ? (
          <LoadError message={error ?? 'Ce lien n’est plus actif.'} retry={reload} />
        ) : done ? (
          <Card>
            <h1 style={display('clamp(32px, 5vw, 44px)')}>Merci.</h1>
            <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>{v.landlord} est prévenu. {v.missing.length ? `Il reste ${v.missing.length} élément${v.missing.length > 1 ? 's' : ''} : vous pouvez revenir sur ce lien pour les ajouter.` : 'Votre dossier est complet.'}</span>
          </Card>
        ) : mode === 'guided' ? (
          <GuidedDossier code={code} v={v} onSaved={setView} onAll={() => setMode('all')} onFinish={() => void finish()} />
        ) : (
          <>
            {v.hasPhoto ? <PublicPhoto src={`/api/dossier/${encodeURIComponent(code)}/photo`} alt={v.property ? `Photo du logement : ${v.property}` : 'Photo du logement'} /> : null}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {v.property ? <span style={{ fontSize: 14, color: BAI.inkSoft }}>{v.property}</span> : null}
              <h1 style={display('clamp(32px, 5vw, 46px)')}>Votre dossier de location</h1>
              <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>
                {v.landlord} prépare votre bail. Complétez ce qui manque : chaque information est enregistrée dès que vous cliquez sur « Enregistrer ». Aucun compte n’est nécessaire.
              </span>
            </div>
            <HowTo hasGuarantor={Boolean(v.guarantor)} />
            {v.missing.length ? (
              <Callout tone="info">
                Il manque : {v.missing.slice(0, 8).map((m) => m.label.toLowerCase()).join(', ')}
                {v.missing.length > 8 ? '…' : '.'}
              </Callout>
            ) : (
              <Callout tone="tip">Votre dossier est complet. Vous pouvez encore corriger une information.</Callout>
            )}
            <TenantCard code={code} person={v.tenant} onSaved={setView} />
            <DocsCard title="Vos justificatifs" code={code} who="TENANT" status={v.documents} files={v.files ?? {}} suggested={v.suggested ?? {}} labels={v.labels} onSaved={setView} />
            {v.guarantor ? (
              <>
                <GuarantorCard key="guarantor" code={code} person={v.guarantor} onSaved={setView} />
                <DocsCard title="Justificatifs de votre garant" code={code} who="GUARANTOR" status={v.guarantorDocuments ?? {}} files={v.guarantorFiles ?? {}} suggested={v.suggested ?? {}} labels={v.labels} onSaved={setView} />
              </>
            ) : null}
            <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>
              Ces pièces sont celles que la loi autorise à demander (décret n° 2015-1437). Vous pouvez masquer sur vos documents les informations inutiles à leur vérification. Elles ne sont visibles que de votre bailleur.
            </span>
            <ThirdPartyNotice landlord={v.landlord} purpose="préparer votre bail et vérifier votre dossier" keep="Les justificatifs sont gardés pendant toute la location et effacés 30 jours après sa fin ; vos autres informations sont réduites à vos nom et email trois ans après. Si aucun bail n’est préparé avec vous, les justificatifs et les informations autres que vos nom et email sont effacés trois mois après la dernière modification." />
            <Btn onClick={() => void finish()} style={{ alignSelf: 'flex-start' }}>
              J’ai terminé
            </Btn>
          </>
        )}
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>}>{children}</Card>
}

type Val = string | number | null | Array<Record<string, string | null>>
const DOSSIER_FACILE = 'https://www.dossierfacile.logement.gouv.fr/'
const FILIGRANE_FACILE = 'https://filigrane.beta.gouv.fr/'

/** Mode d'emploi, étape par étape, pour un locataire qui découvre le lien. */
function HowTo({ hasGuarantor }: { hasGuarantor: boolean }) {
  const steps: Array<[string, ReactNode]> = [
    [
      'Préparez vos justificatifs',
      <>
        Le plus simple : créez gratuitement votre dossier sur{' '}
        <a href={DOSSIER_FACILE} target="_blank" rel="noreferrer">
          DossierFacile
        </a>
        , le service de l’État. Vos pièces y sont vérifiées une fois pour toutes ; collez ensuite le lien de partage de votre dossier plus bas. Sinon, prenez vos pièces en photo ou en PDF : Bailio y ajoute un filigrane (« Uniquement pour louer un logement à… », avec la date), comme{' '}
        <a href={FILIGRANE_FACILE} target="_blank" rel="noreferrer">
          Filigrane Facile
        </a>
        , le service de l’État. Seule la copie filigranée est gardée : elle ne peut pas resservir ailleurs.
      </>,
    ],
    ['Remplissez la rubrique « Vous »', 'Identité, coordonnées, situation et revenus. Cliquez sur « Enregistrer » : rien n’est perdu si vous revenez plus tard.'],
    ['Déposez vos justificatifs', 'Une pièce par ligne, en photo ou en PDF. Vous pouvez masquer les informations inutiles (numéro de sécurité sociale, montants sans rapport…).'],
    ...(hasGuarantor ? ([['Ajoutez votre garant', 'Ses coordonnées, son engagement et ses justificatifs, de la même façon.']] as Array<[string, ReactNode]>) : []),
    ['Cliquez sur « J’ai terminé »', 'Votre futur bailleur est prévenu. Il vérifie votre dossier et vous écrit si une pièce est à corriger.'],
  ]
  return (
    <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Comment faire</h2>}>
      <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map(([title, text]) => (
          <li key={title} style={{ fontSize: 15, lineHeight: 1.5, color: BAI.inkMid }}>
            <strong style={{ color: BAI.ink }}>{title}.</strong> {text}
          </li>
        ))}
      </ol>
      <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>Ce lien est personnel et valable 30 jours : ne le transférez pas. Vos informations ne sont visibles que de votre bailleur.</span>
    </Card>
  )
}

/** Enregistrement d'une partie du dossier : seules les valeurs remplies sont envoyées. */
function useSave(code: string, who: 'tenant' | 'guarantor', onSaved: (v: View) => void) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const save = async (p: Person) => {
    setBusy(true)
    try {
      const body = Object.fromEntries(Object.entries(p).filter(([, val]) => val !== null && val !== ''))
      onSaved(await api<View>(`/dossier/${encodeURIComponent(code)}`, { method: 'POST', body: { [who]: body } }))
      toast.show('Enregistré.')
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  return { busy, save }
}

const Sub = ({ children }: { children: ReactNode }) => <span style={{ fontSize: 15, fontWeight: 700, paddingTop: 6 }}>{children}</span>

/**
 * Le locataire remplit exactement ce que son bailleur remplirait dans « Ajouter un locataire » :
 * identité, naissance, coordonnées, situation, foyer, garantie. Ce qu'il remplit, le bailleur n'a pas à le saisir.
 */
function TenantCard({ code, person, onSaved }: { code: string; person: Person; onSaved: (v: View) => void }) {
  const [p, setP] = useState<Person>(person)
  const { busy, save } = useSave(code, 'tenant', onSaved)
  const str = (k: string) => (typeof p[k] === 'string' ? (p[k] as string) : '')
  const setK = (k: string, val: Val) => setP({ ...p, [k]: val as never })
  const co = (Array.isArray(p.coTenants) ? p.coTenants : []) as Array<Record<string, string | null>>
  return (
    <Section title="Vous">
      <Sub>Identité</Sub>
      <Chips value={(p.civility as 'MADAME' | 'MONSIEUR' | null) ?? null} onChange={(val) => setK('civility', val)} options={[{ value: 'MADAME', label: 'Madame' }, { value: 'MONSIEUR', label: 'Monsieur' }]} />
      <Fields>
        <Input label="Prénom(s)" value={str('firstNames')} onChange={(val) => setK('firstNames', val)} hint="Comme sur votre pièce d’identité." />
        <Input label="Nom de naissance" value={str('lastName')} onChange={(val) => setK('lastName', val)} />
      </Fields>
      <Input label="Nom d’usage (facultatif)" value={str('usageName')} onChange={(val) => setK('usageName', val)} hint="Par exemple votre nom d’époux ou d’épouse." />
      <Sub>Naissance</Sub>
      <Fields>
        <Input label="Date de naissance" type="date" value={str('birthDate')} onChange={(val) => setK('birthDate', val || null)} />
        <Input label="Lieu de naissance" value={str('birthPlace')} onChange={(val) => setK('birthPlace', val)} placeholder="Ville (et pays si à l’étranger)" />
      </Fields>
      <Sub>Coordonnées</Sub>
      <Fields>
        <Input label="Email" type="email" inputMode="email" value={str('email')} onChange={(val) => setK('email', val)} />
        <Input label="Téléphone" type="tel" inputMode="tel" value={str('phone')} onChange={(val) => setK('phone', val)} />
      </Fields>
      <AddressInput label="Adresse actuelle" value={str('currentAddress')} onChange={(val) => setK('currentAddress', val)} />
      <Sub>Situation</Sub>
      <Chips legend="Situation professionnelle" value={(p.situation as Situation | null) ?? null} onChange={(val) => setK('situation', val)} options={(Object.keys(SITUATION_LABEL) as Situation[]).map((k) => ({ value: k, label: SITUATION_LABEL[k] }))} />
      <Fields>
        <Input label="Employeur, établissement ou activité" value={str('employer')} onChange={(val) => setK('employer', val)} />
        <Input label="Métier ou formation" value={str('occupation')} onChange={(val) => setK('occupation', val)} />
      </Fields>
      <Money label="Revenus nets par mois" cents={typeof p.monthlyIncomeCents === 'number' ? p.monthlyIncomeCents : null} onChange={(c) => setK('monthlyIncomeCents', c)} hint="Salaires, bourses, allocations…" />
      <Sub>Votre foyer</Sub>
      <Chips legend="Vous vivrez dans le logement" value={(p.living as 'ALONE' | 'COUPLE' | 'COLOCATION' | null) ?? null} onChange={(val) => setK('living', val)} options={[{ value: 'ALONE', label: 'Seul' }, { value: 'COUPLE', label: 'En couple ou en famille' }, { value: 'COLOCATION', label: 'En colocation' }]} />
      {p.living === 'COUPLE' || p.living === 'COLOCATION' ? (
        <>
          {co.map((c, i) => (
            <Fields key={i}>
              <Input label="Prénom de l’autre personne au bail" value={c.firstNames ?? ''} onChange={(val) => setK('coTenants', co.map((x, j) => (j === i ? { ...x, firstNames: val } : x)))} />
              <Input label="Nom" value={c.lastName ?? ''} onChange={(val) => setK('coTenants', co.map((x, j) => (j === i ? { ...x, lastName: val } : x)))} />
            </Fields>
          ))}
          {co.length < 5 ? (
            <TextLink onClick={() => setK('coTenants', [...co, { firstNames: '', lastName: '' }])} style={{ fontSize: 14 }}>
              + Ajouter une personne qui signera aussi le bail
            </TextLink>
          ) : null}
        </>
      ) : null}
      <Sub>Garantie</Sub>
      {p.guarantee === 'GLI' ? (
        <span style={{ fontSize: 15, color: BAI.inkMid }}>Votre bailleur a souscrit une assurance loyers impayés : pas besoin de garant.</span>
      ) : (
        <Chips
          legend="Qui se porte garant pour vous ?"
          value={(p.guarantee as 'CAUTION' | 'VISALE' | 'NONE' | null) ?? null}
          onChange={(val) => setK('guarantee', val)}
          options={[
            { value: 'CAUTION', label: 'Une personne (parent, ami…)' },
            { value: 'VISALE', label: 'Visale (garantie gratuite de l’État)' },
            { value: 'NONE', label: 'Pas de garant' },
          ]}
          hint={<>Visale : gratuit pour les moins de 31 ans et de nombreux salariés. <a href="https://www.visale.fr/" target="_blank" rel="noreferrer">visale.fr</a></>}
        />
      )}
      {p.guarantee === 'VISALE' ? <Input label="Numéro du visa Visale" value={str('visaleNumber')} onChange={(val) => setK('visaleNumber', val)} /> : null}
      <Sub>DossierFacile</Sub>
      <Input label="Lien de partage de votre DossierFacile (facultatif)" value={str('dossierFacileUrl')} onChange={(val) => setK('dossierFacileUrl', val.trim())} placeholder="https://locataire.dossierfacile.logement.gouv.fr/…" hint={<>Le dossier gratuit de l’État : vos pièces y sont vérifiées une fois pour toutes. <a href={DOSSIER_FACILE} target="_blank" rel="noreferrer">Créer mon DossierFacile</a></>} />
      <Btn variant="outline" onClick={() => void save(p)} loading={busy} style={{ alignSelf: 'flex-start' }}>
        Enregistrer
      </Btn>
    </Section>
  )
}

function GuarantorCard({ code, person, onSaved }: { code: string; person: Person; onSaved: (v: View) => void }) {
  const [p, setP] = useState<Person>(person)
  const { busy, save } = useSave(code, 'guarantor', onSaved)
  const str = (k: string) => (typeof p[k] === 'string' ? (p[k] as string) : '')
  const setK = (k: string, val: string | number | null) => setP({ ...p, [k]: val })
  return (
    <Section title="Votre garant">
      <Chips value={(p.civility as 'MADAME' | 'MONSIEUR' | null) ?? null} onChange={(val) => setK('civility', val)} options={[{ value: 'MADAME', label: 'Madame' }, { value: 'MONSIEUR', label: 'Monsieur' }]} />
      <Fields>
        <Input label="Prénom(s)" value={str('firstNames')} onChange={(val) => setK('firstNames', val)} />
        <Input label="Nom" value={str('lastName')} onChange={(val) => setK('lastName', val)} />
      </Fields>
      <Fields>
        <Input label="Date de naissance" type="date" value={str('birthDate')} onChange={(val) => setK('birthDate', val || null)} />
        <Input label="Lieu de naissance" value={str('birthPlace')} onChange={(val) => setK('birthPlace', val)} />
      </Fields>
      <AddressInput label="Adresse" value={str('address')} onChange={(val) => setK('address', val)} />
      <Fields>
        <Input label="Email" type="email" inputMode="email" value={str('email')} onChange={(val) => setK('email', val)} hint="Pour signer l’acte de caution en ligne." />
        <Input label="Téléphone" type="tel" inputMode="tel" value={str('phone')} onChange={(val) => setK('phone', val)} />
      </Fields>
      <Input label="Lien avec vous" value={str('link')} onChange={(val) => setK('link', val)} placeholder="Père, mère, ami…" />
      <Chips legend="Situation professionnelle" value={(p.situation as Situation | null) ?? null} onChange={(val) => setK('situation', val)} options={(Object.keys(SITUATION_LABEL) as Situation[]).map((k) => ({ value: k, label: SITUATION_LABEL[k] }))} />
      <Fields>
        <Input label="Employeur ou activité" value={str('employer')} onChange={(val) => setK('employer', val)} />
        <Money label="Revenus nets par mois" cents={typeof p.monthlyIncomeCents === 'number' ? p.monthlyIncomeCents : null} onChange={(c) => setK('monthlyIncomeCents', c)} />
      </Fields>
      <Btn variant="outline" onClick={() => void save(p)} loading={busy} style={{ alignSelf: 'flex-start' }}>
        Enregistrer
      </Btn>
    </Section>
  )
}

function DocsCard({ title, code, who, status, files, suggested, labels, onSaved }: { title: string; code: string; who: 'TENANT' | 'GUARANTOR'; status: Record<string, boolean>; files: Record<string, DocFile[]>; suggested: Record<string, number>; labels: Record<string, string>; onSaved: (v: View) => void }) {
  const toast = useToast()
  const base = `/dossier/${encodeURIComponent(code)}/document`
  // Chaque fichier choisi s'ajoute aux précédents (trois bulletins de salaire : un par un ou tous ensemble).
  const add = async (category: string, list: File[]) => {
    let done = 0
    for (const file of list) {
      const form = new FormData()
      form.append('file', file)
      form.append('category', category)
      form.append('who', who)
      try {
        onSaved(await api<View>(base, { method: 'POST', form, timeout: 90_000 }))
        done++
      } catch (e) {
        toast.error(e)
        break
      }
    }
    if (done) toast.show(done > 1 ? `${done} fichiers reçus.` : 'Justificatif reçu.')
  }
  const remove = async (file: DocFile) => {
    try {
      onSaved(await api<View>(`${base}/${file.id}?who=${who}`, { method: 'DELETE' }))
    } catch (e) {
      toast.error(e)
    }
  }
  return (
    <Section title={title}>
      {Object.keys(labels).map((k) => (
        <DocFilesRow
          key={k}
          label={labels[k]}
          hint={DOC_HINTS[k]}
          files={files[k] ?? []}
          suggested={suggested[k]}
          received={status[k]}
          inputLabel={`${labels[k]} (${who === 'GUARANTOR' ? 'garant' : 'locataire'})`}
          onAdd={(list) => add(k, list)}
          onRemove={remove}
        />
      ))}
    </Section>
  )
}

type Missing = View['missing'][number]

/** Écrans du parcours guidé, d'après ce qui manque à l'ouverture (la liste ne bouge plus pendant qu'on répond). */
function guidedSteps(missing: Missing[]): string[] {
  const has = (...keys: string[]) => missing.some((m) => keys.includes(m.key))
  const steps: string[] = []
  if (has('civility', 'name')) steps.push('name')
  if (has('birthDate', 'birthPlace')) steps.push('birth')
  if (has('email', 'phone')) steps.push('contact')
  if (has('currentAddress')) steps.push('address')
  if (has('situation')) steps.push('situation', 'income')
  if (has('visaleNumber')) steps.push('visale')
  if (missing.some((m) => m.kind === 'DOCUMENT' && m.who === 'TENANT')) steps.push('docs')
  if (has('guarantor.name')) steps.push('g.name')
  if (has('guarantor.birth')) steps.push('g.birth')
  if (has('guarantor.address')) steps.push('g.address')
  if (has('guarantor.contact')) steps.push('g.contact')
  if (missing.some((m) => m.kind === 'DOCUMENT' && m.who === 'GUARANTOR')) steps.push('g.docs')
  return [...steps, 'end']
}

/**
 * Dossier guidé : une question par écran, seulement pour ce qui manque. Chaque réponse est enregistrée dès
 * « Continuer » ; « Passer » laisse une question pour plus tard. Les justificatifs : un écran par personne.
 */
function GuidedDossier({ code, v, onSaved, onAll, onFinish }: { code: string; v: View; onSaved: (v: View) => void; onAll: () => void; onFinish: () => void }) {
  const toast = useToast()
  const [started, setStarted] = useState(false)
  const [steps] = useState(() => guidedSteps(v.missing))
  const [t, setT] = useState<Person>(v.tenant)
  const [g, setG] = useState<Person>(v.guarantor ?? {})
  const [busy, setBusy] = useState(false)
  const { q, go } = useQuestion(steps.length)
  const id = steps[q - 1]
  const count = steps.length
  const str = (p: Person, k: string) => (typeof p[k] === 'string' ? (p[k] as string) : '')
  const forward = () => go(q + 1)
  const back = q > 1 ? () => go(q - 1) : () => setStarted(false)

  /** Enregistre les réponses de l'écran (seules les valeurs remplies), puis passe à la suivante. */
  const save = async (who: 'tenant' | 'guarantor', keys: string[]) => {
    const src = who === 'tenant' ? t : g
    const body = Object.fromEntries(keys.map((k) => [k, src[k]]).filter(([, val]) => val !== null && val !== undefined && val !== ''))
    if (!Object.keys(body).length) return forward()
    setBusy(true)
    try {
      onSaved(await api<View>(`/dossier/${encodeURIComponent(code)}`, { method: 'POST', body: { [who]: body } }))
      forward()
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  if (!started)
    return (
      <>
        {v.hasPhoto ? <PublicPhoto src={`/api/dossier/${encodeURIComponent(code)}/photo`} alt={v.property ? `Photo du logement : ${v.property}` : 'Photo du logement'} /> : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {v.property ? <span style={{ fontSize: 14, color: BAI.inkSoft }}>{v.property}</span> : null}
          <h1 style={display('clamp(32px, 5vw, 46px)')}>Votre dossier de location</h1>
          <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>
            {v.landlord} prépare votre bail. Il manque {v.missing.length} élément{v.missing.length > 1 ? 's' : ''} : quelques questions courtes, une à la fois. Tout est enregistré au fur et à mesure, sans compte.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <Btn onClick={() => setStarted(true)}>Commencer</Btn>
          <TextLink onClick={onAll} style={{ fontSize: 15 }}>
            Tout voir et corriger
          </TextLink>
        </div>
      </>
    )

  const base = { q, count, onBack: back, busy }
  const situations = (Object.keys(SITUATION_LABEL) as Situation[]).map((k) => ({ value: k, label: SITUATION_LABEL[k] }))
  switch (id) {
    case 'name':
      return (
        <QuestionScreen {...base} title="Comment vous appelez-vous ?" hint="Comme sur votre pièce d’identité." onNext={() => void save('tenant', ['civility', 'firstNames', 'lastName'])} skip={forward}>
          <Chips value={(t.civility as 'MADAME' | 'MONSIEUR' | null) ?? null} onChange={(val) => setT({ ...t, civility: val })} options={[{ value: 'MADAME', label: 'Madame' }, { value: 'MONSIEUR', label: 'Monsieur' }]} />
          <Fields>
            <Input label="Prénom(s)" value={str(t, 'firstNames')} onChange={(val) => setT({ ...t, firstNames: val })} />
            <Input label="Nom de naissance" value={str(t, 'lastName')} onChange={(val) => setT({ ...t, lastName: val })} />
          </Fields>
        </QuestionScreen>
      )
    case 'birth':
      return (
        <QuestionScreen {...base} title="Où et quand êtes-vous né(e) ?" onNext={() => void save('tenant', ['birthDate', 'birthPlace'])} skip={forward}>
          <Fields>
            <Input label="Date de naissance" type="date" value={str(t, 'birthDate')} onChange={(val) => setT({ ...t, birthDate: val || null })} />
            <Input label="Lieu de naissance" value={str(t, 'birthPlace')} onChange={(val) => setT({ ...t, birthPlace: val })} placeholder="Ville (et pays si à l’étranger)" />
          </Fields>
        </QuestionScreen>
      )
    case 'contact':
      return (
        <QuestionScreen {...base} title="Comment vous joindre ?" onNext={() => void save('tenant', ['email', 'phone'])} skip={forward}>
          <Input label="Email" type="email" inputMode="email" value={str(t, 'email')} onChange={(val) => setT({ ...t, email: val })} />
          <Input label="Téléphone" type="tel" inputMode="tel" value={str(t, 'phone')} onChange={(val) => setT({ ...t, phone: val })} />
        </QuestionScreen>
      )
    case 'address':
      return (
        <QuestionScreen {...base} title="Où habitez-vous aujourd’hui ?" onNext={() => void save('tenant', ['currentAddress'])} skip={forward}>
          <AddressInput label="Adresse actuelle" value={str(t, 'currentAddress')} onChange={(val) => setT({ ...t, currentAddress: val })} />
        </QuestionScreen>
      )
    case 'situation':
      return (
        <QuestionScreen {...base} title="Votre situation professionnelle ?" hideNext skip={forward}>
          <Choices
            legend="Situation professionnelle"
            value={(t.situation as Situation | null) ?? null}
            options={situations}
            onPick={(val) => {
              const next = { ...t, situation: val }
              setT(next)
              setBusy(true)
              api<View>(`/dossier/${encodeURIComponent(code)}`, { method: 'POST', body: { tenant: { situation: val } } })
                .then((res) => {
                  onSaved(res)
                  forward()
                })
                .catch(toast.error)
                .finally(() => setBusy(false))
            }}
          />
        </QuestionScreen>
      )
    case 'income':
      return (
        <QuestionScreen {...base} title="Où travaillez-vous, et combien gagnez-vous ?" hint="Revenus nets par mois : salaires, bourses, allocations…" onNext={() => void save('tenant', ['employer', 'occupation', 'monthlyIncomeCents'])} skip={forward}>
          <Input label="Employeur, établissement ou activité" value={str(t, 'employer')} onChange={(val) => setT({ ...t, employer: val })} />
          <Money label="Revenus nets par mois" cents={typeof t.monthlyIncomeCents === 'number' ? t.monthlyIncomeCents : null} onChange={(c) => setT({ ...t, monthlyIncomeCents: c })} />
        </QuestionScreen>
      )
    case 'visale':
      return (
        <QuestionScreen {...base} title="Votre numéro de visa Visale ?" hint={<>Il figure sur votre visa, sur <a href="https://www.visale.fr/" target="_blank" rel="noreferrer">visale.fr</a>.</>} onNext={() => void save('tenant', ['visaleNumber'])} skip={forward}>
          <Input label="Numéro du visa Visale" value={str(t, 'visaleNumber')} onChange={(val) => setT({ ...t, visaleNumber: val })} />
        </QuestionScreen>
      )
    case 'docs':
    case 'g.docs': {
      const who = id === 'docs' ? 'TENANT' : 'GUARANTOR'
      const wanted = v.missing.filter((m) => m.kind === 'DOCUMENT' && m.who === who).map((m) => m.key.split('.').pop()!)
      return (
        <QuestionScreen {...base} title={who === 'TENANT' ? 'Vos justificatifs' : 'Les justificatifs de votre garant'} hint="En photo ou en PDF, plusieurs fichiers par pièce si besoin (trois bulletins de salaire, recto et verso…). Bailio y ajoute un filigrane (« Uniquement pour louer un logement à… », avec la date) : la copie gardée ne peut pas resservir ailleurs." onNext={forward}>
          <DocRows code={code} who={who} keys={wanted.length ? wanted : Object.keys(v.labels)} v={v} onSaved={onSaved} />
        </QuestionScreen>
      )
    }
    case 'g.name':
      return (
        <QuestionScreen {...base} title="Qui est votre garant ?" onNext={() => void save('guarantor', ['civility', 'firstNames', 'lastName'])} skip={forward}>
          <Chips value={(g.civility as 'MADAME' | 'MONSIEUR' | null) ?? null} onChange={(val) => setG({ ...g, civility: val })} options={[{ value: 'MADAME', label: 'Madame' }, { value: 'MONSIEUR', label: 'Monsieur' }]} />
          <Fields>
            <Input label="Prénom(s) du garant" value={str(g, 'firstNames')} onChange={(val) => setG({ ...g, firstNames: val })} />
            <Input label="Nom du garant" value={str(g, 'lastName')} onChange={(val) => setG({ ...g, lastName: val })} />
          </Fields>
        </QuestionScreen>
      )
    case 'g.birth':
      return (
        <QuestionScreen {...base} title="Où et quand votre garant est-il né ?" onNext={() => void save('guarantor', ['birthDate', 'birthPlace'])} skip={forward}>
          <Fields>
            <Input label="Date de naissance du garant" type="date" value={str(g, 'birthDate')} onChange={(val) => setG({ ...g, birthDate: val || null })} />
            <Input label="Lieu de naissance du garant" value={str(g, 'birthPlace')} onChange={(val) => setG({ ...g, birthPlace: val })} />
          </Fields>
        </QuestionScreen>
      )
    case 'g.address':
      return (
        <QuestionScreen {...base} title="Où habite votre garant ?" onNext={() => void save('guarantor', ['address'])} skip={forward}>
          <AddressInput label="Adresse du garant" value={str(g, 'address')} onChange={(val) => setG({ ...g, address: val })} />
        </QuestionScreen>
      )
    case 'g.contact':
      return (
        <QuestionScreen {...base} title="Comment joindre votre garant ?" hint="Son email lui permet de signer l’acte de caution en ligne." onNext={() => void save('guarantor', ['email', 'phone'])} skip={forward}>
          <Input label="Email du garant" type="email" inputMode="email" value={str(g, 'email')} onChange={(val) => setG({ ...g, email: val })} />
          <Input label="Téléphone du garant" type="tel" inputMode="tel" value={str(g, 'phone')} onChange={(val) => setG({ ...g, phone: val })} />
        </QuestionScreen>
      )
    default:
      return (
        <QuestionScreen
          {...base}
          title={v.missing.length ? 'C’est presque fini' : 'Votre dossier est complet'}
          hint={v.missing.length ? `Il reste ${v.missing.length} élément${v.missing.length > 1 ? 's' : ''} : vous pourrez revenir sur ce lien pour les ajouter.` : `Prévenez ${v.landlord} : il vérifie votre dossier et vous écrit si une pièce est à corriger.`}
          nextLabel="J’ai terminé"
          onNext={onFinish}
          footer={
            <>
              <TextLink onClick={onAll} style={{ fontSize: 15 }}>
                Tout voir et corriger
              </TextLink>
              <ThirdPartyNotice landlord={v.landlord} purpose="préparer votre bail et vérifier votre dossier" keep="Les justificatifs sont gardés pendant toute la location et effacés 30 jours après sa fin ; vos autres informations sont réduites à vos nom et email trois ans après. Si aucun bail n’est préparé avec vous, les justificatifs et les informations autres que vos nom et email sont effacés trois mois après la dernière modification." />
            </>
          }
        />
      )
  }
}

/** Lignes de justificatifs d'une personne, avec plusieurs fichiers par pièce (le même envoi que « Tout voir »). */
function DocRows({ code, who, keys, v, onSaved }: { code: string; who: 'TENANT' | 'GUARANTOR'; keys: string[]; v: View; onSaved: (v: View) => void }) {
  const toast = useToast()
  const base = `/dossier/${encodeURIComponent(code)}/document`
  const files = (who === 'TENANT' ? v.files : v.guarantorFiles) ?? {}
  const status = (who === 'TENANT' ? v.documents : v.guarantorDocuments) ?? {}
  const add = async (category: string, list: File[]) => {
    for (const file of list) {
      const form = new FormData()
      form.append('file', file)
      form.append('category', category)
      form.append('who', who)
      try {
        onSaved(await api<View>(base, { method: 'POST', form, timeout: 90_000 }))
      } catch (e) {
        toast.error(e)
        break
      }
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {keys.map((k) => (
        <DocFilesRow
          key={k}
          label={v.labels[k]}
          hint={DOC_HINTS[k]}
          files={files[k] ?? []}
          suggested={v.suggested?.[k]}
          received={status[k]}
          inputLabel={`${v.labels[k]} (${who === 'GUARANTOR' ? 'garant' : 'locataire'})`}
          onAdd={(list) => add(k, list)}
          onRemove={async (f) => {
            try {
              onSaved(await api<View>(`${base}/${f.id}?who=${who}`, { method: 'DELETE' }))
            } catch (e) {
              toast.error(e)
            }
          }}
        />
      ))}
    </div>
  )
}
