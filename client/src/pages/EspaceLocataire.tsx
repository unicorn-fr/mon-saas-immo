import { ThirdPartyNotice } from '../components/DataNotice'
import { useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Logo } from '../components/Logo'
import { Fields } from '../components/FlowLayout'
import { Btn, Callout, Card, Check, Chips, Input, LoadError, Loader, Pill, TextArea, useLoad, useToast } from '../components/kit'
import { Wizard } from '../components/Wizard'
import { display } from '../components/ui'
import { api } from '../lib/api'
import { dateNum } from '../lib/format'

interface LinkInfo {
  property: string
  landlord: string
  tenants: string[]
  boiler: boolean
  insurance: { insurer: string | null; expiresAt: string; at: string } | null
  boilerDone: { date: string; at: string } | null
  eReceipt: { email: string; at: string } | null
  email: string
  issueChoices: Array<{ value: string; label: string; advice: string | null; alwaysUrgent: boolean }>
  issues: Array<{ id: string; title: string; status: 'TODO' | 'PLANNED' | 'DONE'; progress: string; reportedAt: string }>
}

/**
 * Lien remis au locataire par son bailleur, sans compte : problème à signaler (et son suivi), attestation d'assurance,
 * entretien de la chaudière, accord pour recevoir les quittances par email. Tout est enregistré avec le bail du propriétaire.
 */
export default function EspaceLocataire() {
  const { code = '' } = useParams()
  const { data, error, loading, reload } = useLoad(() => api<LinkInfo>(`/locataire/${encodeURIComponent(code)}`), [code])
  // Pendant un signalement, rien d'autre à l'écran.
  const [reporting, setReporting] = useState(false)
  return (
    <div style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink }}>
      <header style={{ padding: '20px clamp(16px, 4vw, 40px)', borderBottom: `1px solid ${BAI.divider}`, background: BAI.surface }}>
        <Logo />
      </header>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) 16px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading && !data ? (
          <Loader />
        ) : error || !data ? (
          <LoadError message={error ?? 'Ce lien n’est plus actif.'} retry={reload} />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, color: BAI.inkSoft }}>{data.property}</span>
              <h1 style={display('clamp(32px, 5vw, 46px)')}>Votre location</h1>
              <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>
                Signalez un problème ou envoyez vos documents à {data.landlord}, sans créer de compte : tout lui parvient directement.
              </span>
            </div>
            <Issues code={code} info={data} onDone={reload} open={reporting} setOpen={setReporting} />
            {reporting ? null : (
              <>
                <Insurance code={code} info={data} onDone={reload} />
                {data.boiler ? <Boiler code={code} info={data} onDone={reload} /> : null}
                <EReceipt code={code} info={data} onDone={reload} />
              </>
            )}
            <ThirdPartyNotice landlord={data.landlord} purpose="la gestion de votre location (problèmes signalés, assurance, entretien, quittances)" keep="Elles sont gardées avec le bail, pendant la location puis trois ans." />
          </>
        )}
      </main>
    </div>
  )
}

function Section({ title, done, why, children, doneLabel = 'Envoyé' }: { title: string; done: ReactNode; why: string; children: ReactNode; doneLabel?: string }) {
  return (
    <Card title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 12 }}><h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>{done ? <Pill tone="green">{doneLabel}</Pill> : null}</div>}>
      <span style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.5 }}>{why}</span>
      {done ? <span style={{ fontSize: 15, color: BAI.inkMid }}>{done}</span> : null}
      {children}
    </Card>
  )
}

function FilePick({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  return (
    <label style={{ border: `1.5px dashed ${BAI.dashed}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', background: BAI.bg }}>
      <span style={{ fontSize: 16, fontWeight: 600 }}>{file ? file.name : 'Choisir une photo ou un PDF'}</span>
      <span style={{ fontSize: 13, color: BAI.inkSoft }}>{file ? `${Math.round(file.size / 1024)} Ko` : 'Photo prise avec le téléphone, ou PDF. 15 Mo au maximum.'}</span>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" onChange={(e) => onChange(e.target.files?.[0] ?? null)} className="sr-only" />
    </label>
  )
}

function Insurance({ code, info, onDone }: { code: string; info: LinkInfo; onDone: () => void }) {
  const toast = useToast()
  const [insurer, setInsurer] = useState(info.insurance?.insurer ?? '')
  const [expiresAt, setExpiresAt] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const send = async () => {
    if (!file || !expiresAt) return toast.show('Ajoutez l’attestation et sa date de fin.', 'error')
    const form = new FormData()
    form.append('file', file)
    form.append('expiresAt', expiresAt)
    if (insurer.trim()) form.append('insurer', insurer.trim())
    setBusy(true)
    try {
      await api(`/locataire/${encodeURIComponent(code)}/insurance`, { method: 'POST', form, timeout: 90_000 })
      toast.show('Attestation envoyée. Merci.')
      setFile(null)
      setExpiresAt('')
      onDone()
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Section
      title="Attestation d’assurance habitation"
      why="La loi oblige le locataire à assurer le logement contre les risques locatifs (dégât des eaux, incendie) et à en justifier chaque année."
      done={info.insurance ? `Reçue le ${dateNum(info.insurance.at)}, valable jusqu’au ${dateNum(info.insurance.expiresAt)}.` : null}
    >
      <FilePick file={file} onChange={setFile} />
      <Fields>
        <Input label="Assureur" value={insurer} onChange={setInsurer} placeholder="Nom de votre assurance" />
        <Input label="Valable jusqu’au" type="date" value={expiresAt} onChange={setExpiresAt} />
      </Fields>
      <Btn variant={info.insurance ? 'outline' : 'primary'} onClick={() => void send()} loading={busy} style={{ alignSelf: 'flex-start' }}>
        {info.insurance ? 'Envoyer la nouvelle attestation' : 'Envoyer l’attestation'}
      </Btn>
    </Section>
  )
}

function Boiler({ code, info, onDone }: { code: string; info: LinkInfo; onDone: () => void }) {
  const toast = useToast()
  const [date, setDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const send = async () => {
    if (!file || !date) return toast.show('Ajoutez l’attestation et la date de l’entretien.', 'error')
    const form = new FormData()
    form.append('file', file)
    form.append('date', date)
    setBusy(true)
    try {
      await api(`/locataire/${encodeURIComponent(code)}/boiler`, { method: 'POST', form, timeout: 90_000 })
      toast.show('Attestation envoyée. Merci.')
      setFile(null)
      setDate('')
      onDone()
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Section
      title="Entretien de la chaudière"
      why="L’entretien de la chaudière est obligatoire chaque année et à la charge du locataire. Le professionnel vous remet une attestation."
      done={info.boilerDone ? `Entretien du ${dateNum(info.boilerDone.date)}, attestation reçue le ${dateNum(info.boilerDone.at)}.` : null}
    >
      <FilePick file={file} onChange={setFile} />
      <Input label="Date de l’entretien" type="date" value={date} onChange={setDate} />
      <Btn variant={info.boilerDone ? 'outline' : 'primary'} onClick={() => void send()} loading={busy} style={{ alignSelf: 'flex-start' }}>
        Envoyer l’attestation
      </Btn>
    </Section>
  )
}

function EReceipt({ code, info, onDone }: { code: string; info: LinkInfo; onDone: () => void }) {
  const toast = useToast()
  const [email, setEmail] = useState(info.eReceipt?.email ?? info.email)
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const send = async (accept: boolean) => {
    if (accept && (!email.trim() || !agree)) return toast.show('Indiquez votre email et cochez la case.', 'error')
    setBusy(true)
    try {
      await api(`/locataire/${encodeURIComponent(code)}/e-receipt`, { method: 'POST', body: accept ? { accept, email: email.trim() } : { accept } })
      toast.show(accept ? 'C’est noté : vos quittances arriveront par email.' : 'C’est noté : vos quittances ne vous seront plus envoyées par email.')
      setAgree(false)
      onDone()
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Section
      title="Quittances par email"
      why="La quittance prouve que vous avez payé votre loyer. Votre bailleur peut vous l’envoyer par email seulement si vous êtes d’accord. Vous pouvez changer d’avis à tout moment, ici."
      doneLabel="Accord donné"
      done={info.eReceipt ? `Accord donné le ${dateNum(info.eReceipt.at)}, pour ${info.eReceipt.email}.` : null}
    >
      {info.eReceipt ? (
        <Btn variant="outline" onClick={() => void send(false)} loading={busy} style={{ alignSelf: 'flex-start' }}>
          Retirer mon accord
        </Btn>
      ) : (
        <>
          <Input label="Votre email" type="email" value={email} onChange={setEmail} inputMode="email" autoComplete="email" />
          <Check checked={agree} onChange={setAgree} label="J’accepte de recevoir mes quittances de loyer par email." />
          <Btn onClick={() => void send(true)} loading={busy} style={{ alignSelf: 'flex-start' }}>
            Donner mon accord
          </Btn>
        </>
      )}
    </Section>
  )
}

/** Signaler un problème : une question par écran, puis le suivi de chaque signalement. */
function Issues({ code, info, onDone, open, setOpen }: { code: string; info: LinkInfo; onDone: () => void; open: boolean; setOpen: (v: boolean) => void }) {
  const toast = useToast()
  const [category, setCategory] = useState<string | null>(null)
  const [where, setWhere] = useState('')
  const [description, setDescription] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<{ advice: string | null } | null>(null)
  const choice = info.issueChoices.find((c) => c.value === category)

  const reset = () => {
    setOpen(false)
    setCategory(null)
    setWhere('')
    setDescription('')
    setUrgent(false)
    setPhotos([])
  }
  const send = async () => {
    if (!category) return
    const form = new FormData()
    form.append('category', category)
    if (where.trim()) form.append('where', where.trim())
    form.append('description', description.trim())
    form.append('urgent', String(urgent))
    for (const f of photos) form.append('photos', f)
    setBusy(true)
    try {
      const r = await api<{ advice: string | null }>(`/locataire/${encodeURIComponent(code)}/issues`, { method: 'POST', form, timeout: 90_000 })
      setSent({ advice: r.advice })
      reset()
      onDone()
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Un problème dans le logement ?</h2>}>
      {open ? (
        <Wizard
          onCancel={reset}
          busy={busy}
          finishLabel="Envoyer le signalement"
          onFinish={() => void send()}
          steps={[
            {
              key: 'what',
              title: 'Quel est le problème ?',
              content: <Chips options={info.issueChoices.map((c) => ({ value: c.value, label: c.label }))} value={category} onChange={setCategory} />,
              validate: () => (category ? null : 'Choisissez le type de problème.'),
            },
            {
              key: 'describe',
              title: 'Décrivez-le en quelques mots',
              content: (
                <>
                  {choice?.advice ? <Callout tone="warn" title="À faire tout de suite">{choice.advice}</Callout> : null}
                  <Input label="Où ? (facultatif)" value={where} onChange={setWhere} placeholder="Salle de bain, cuisine…" maxLength={80} />
                  <TextArea label="Ce qui se passe" value={description} onChange={setDescription} placeholder="Depuis quand, ce que vous avez constaté…" maxLength={2000} rows={4} />
                  {choice?.alwaysUrgent ? null : <Check checked={urgent} onChange={setUrgent} label="C’est urgent" sub="Le logement est inutilisable, ou le problème s’aggrave vite." />}
                </>
              ),
              validate: () => (description.trim().length >= 5 ? null : 'Décrivez le problème en quelques mots.'),
            },
            {
              key: 'photos',
              title: 'Ajoutez des photos',
              note: 'Une photo aide votre bailleur à envoyer le bon artisan. Trois au maximum.',
              optional: true,
              content: <Photos files={photos} onChange={setPhotos} />,
            },
          ]}
        />
      ) : (
        <>
          {sent ? (
            <Callout tone={sent.advice ? 'warn' : 'ok'} title="Signalement envoyé à votre bailleur">
              {sent.advice ?? 'Vous suivrez ici la date de l’intervention.'}
            </Callout>
          ) : (
            <span style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.5 }}>Une fuite, une panne, une serrure qui ferme mal : prévenez votre bailleur ici, avec une photo si vous le pouvez.</span>
          )}
          <Btn variant={sent ? 'outline' : 'primary'} onClick={() => { setSent(null); setOpen(true) }} style={{ alignSelf: 'flex-start' }}>
            {sent ? 'Signaler un autre problème' : 'Signaler un problème'}
          </Btn>
        </>
      )}
      {info.issues.length && !open ? (
        <ul aria-label="Vos signalements" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {info.issues.map((i) => (
            <li key={i.id} style={{ borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{i.title}</span>
                <span style={{ fontSize: 13, color: BAI.inkSoft }}>Signalé le {dateNum(i.reportedAt)}</span>
              </span>
              <Pill tone={i.status === 'DONE' ? 'green' : i.status === 'PLANNED' ? 'owner' : 'caramel'}>{i.progress}</Pill>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  )
}

function Photos({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {files.map((f, n) => (
        <div key={`${f.name}-${n}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 15 }}>
          <span>{f.name}</span>
          <Btn variant="ghost" onClick={() => onChange(files.filter((_, k) => k !== n))}>
            Retirer
          </Btn>
        </div>
      ))}
      {files.length < 3 ? (
        <label style={{ border: `1.5px dashed ${BAI.dashed}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', background: BAI.bg }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{files.length ? 'Ajouter une autre photo' : 'Prendre ou choisir une photo'}</span>
          <span style={{ fontSize: 13, color: BAI.inkSoft }}>JPEG, PNG ou HEIC, 15 Mo au maximum.</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange([...files, f]); e.target.value = '' }} className="sr-only" />
        </label>
      ) : null}
    </div>
  )
}
