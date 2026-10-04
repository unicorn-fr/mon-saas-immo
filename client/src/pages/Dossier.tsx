import { ThirdPartyNotice } from '../components/DataNotice'
import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Logo } from '../components/Logo'
import { Fields } from '../components/FlowLayout'
import { Btn, Callout, Card, Chips, Input, LoadError, Loader, Money, Pill, TextLink, useLoad, useToast } from '../components/kit'
import { Spinner, display } from '../components/ui'
import { api } from '../lib/api'
import { SITUATION_LABEL, type Situation } from '../lib/contract'

type Person = Record<string, string | number | null | Array<Record<string, string | null>>>
interface View {
  landlord: string
  property: string | null
  guarantee: 'CAUTION' | 'VISALE' | 'GLI' | 'NONE' | null
  tenant: Person
  guarantor: Person | null
  documents: Record<string, boolean>
  guarantorDocuments: Record<string, boolean> | null
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
        {loading && !v ? (
          <Loader />
        ) : error || !v ? (
          <LoadError message={error ?? 'Ce lien n’est plus actif.'} retry={reload} />
        ) : done ? (
          <Card>
            <h1 style={display('clamp(32px, 5vw, 44px)')}>Merci.</h1>
            <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>{v.landlord} est prévenu. {v.missing.length ? `Il reste ${v.missing.length} élément${v.missing.length > 1 ? 's' : ''} : vous pouvez revenir sur ce lien pour les ajouter.` : 'Votre dossier est complet.'}</span>
          </Card>
        ) : (
          <>
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
            <DocsCard title="Vos justificatifs" code={code} who="TENANT" status={v.documents} labels={v.labels} onSaved={setView} />
            {v.guarantor ? (
              <>
                <GuarantorCard key="guarantor" code={code} person={v.guarantor} onSaved={setView} />
                <DocsCard title="Justificatifs de votre garant" code={code} who="GUARANTOR" status={v.guarantorDocuments ?? {}} labels={v.labels} onSaved={setView} />
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
        , le service de l’État. Vos pièces y sont vérifiées une fois pour toutes ; collez ensuite le lien de partage de votre dossier plus bas. Sinon, prenez vos pièces en photo ou en PDF. Pour éviter qu’elles soient réutilisées, ajoutez-y un filigrane avec{' '}
        <a href={FILIGRANE_FACILE} target="_blank" rel="noreferrer">
          Filigrane Facile
        </a>{' '}
        (service de l’État, gratuit).
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
      <Input label="Adresse actuelle" value={str('currentAddress')} onChange={(val) => setK('currentAddress', val)} />
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
      <Input label="Adresse" value={str('address')} onChange={(val) => setK('address', val)} />
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

function DocsCard({ title, code, who, status, labels, onSaved }: { title: string; code: string; who: 'TENANT' | 'GUARANTOR'; status: Record<string, boolean>; labels: Record<string, string>; onSaved: (v: View) => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const send = async (category: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    form.append('category', category)
    form.append('who', who)
    setBusy(category)
    try {
      onSaved(await api<View>(`/dossier/${encodeURIComponent(code)}/document`, { method: 'POST', form, timeout: 90_000 }))
      toast.show('Justificatif reçu.')
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(null)
    }
  }
  return (
    <Section title={title}>
      {Object.keys(labels).map((k) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10 }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{labels[k]}</span>
            <span style={{ fontSize: 13, color: BAI.inkSoft }}>{DOC_HINTS[k]}</span>
          </span>
          {status[k] ? (
            <Pill tone="green">Reçu</Pill>
          ) : (
            <label style={{ color: BAI.owner, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
              {busy === k ? <Spinner size={14} /> : null}
              Ajouter
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                aria-label={`${labels[k]} (${who === 'GUARANTOR' ? 'garant' : 'locataire'})`}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) void send(k, file)
                }}
              />
            </label>
          )}
        </div>
      ))}
    </Section>
  )
}
