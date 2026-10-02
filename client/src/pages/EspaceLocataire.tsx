import { useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Logo } from '../components/Logo'
import { Fields } from '../components/FlowLayout'
import { Btn, Card, Check, Input, LoadError, Loader, Pill, useLoad, useToast } from '../components/kit'
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
}

/**
 * Lien remis au locataire par son bailleur, sans compte : attestation d'assurance, entretien de la chaudière,
 * accord pour recevoir les quittances par email. Tout est enregistré avec le bail du propriétaire.
 */
export default function EspaceLocataire() {
  const { code = '' } = useParams()
  const { data, error, loading, reload } = useLoad(() => api<LinkInfo>(`/locataire/${encodeURIComponent(code)}`), [code])
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
              <h1 style={display('clamp(32px, 5vw, 46px)')}>Vos documents de location</h1>
              <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>
                {data.landlord} vous demande ces documents. Envoyez-les ici, sans créer de compte : ils lui parviennent directement.
              </span>
            </div>
            <Insurance code={code} info={data} onDone={reload} />
            {data.boiler ? <Boiler code={code} info={data} onDone={reload} /> : null}
            <EReceipt code={code} info={data} onDone={reload} />
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
