import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Logo } from '../components/Logo'
import { SelfieCapture, SignaturePad } from '../components/media'
import { Guide } from '../components/Sources'
import { Btn, Callout, Card, Check, Input, LoadError, Loader, useLoad, useToast } from '../components/kit'
import { display } from '../components/ui'
import { api, openPdfFrom, pdfUrl } from '../lib/api'
import { EIDAS, GUIDES } from '../lib/sources'

interface SignView {
  role: 'LANDLORD' | 'TENANT' | 'GUARANTOR'
  roleLabel: string
  name: string
  email: string
  document: string
  landlord: string
  property: string
  mention: string
  codeVerified: boolean
  photoAt: string | null
  signedAt: string | null
  completed: boolean
  others: Array<{ roleLabel: string; name: string; signed: boolean }>
}

/** Page de signature électronique, ouverte depuis le lien reçu par email (sans compte). */
export default function Signer() {
  const { token = '' } = useParams()
  const base = `/esign/${encodeURIComponent(token)}`
  const { data, error, loading, reload } = useLoad(() => api<SignView>(base), [token])
  const toast = useToast()
  const [read, setRead] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [mention, setMention] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [noPhoto, setNoPhoto] = useState(false)
  const pdf = `/api${base}/document.pdf`
  // Le document est affiché depuis une copie locale (blob) : le site interdit d'intégrer ses propres pages en cadre.
  const [blob, setBlob] = useState<string | null>(null)
  useEffect(() => {
    let url: string | null = null
    pdfUrl(`${base}/document.pdf`)
      .then((u) => setBlob((url = u)))
      .catch(() => setBlob(null))
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [base])

  if (loading && !data) return <Shell><Loader /></Shell>
  if (error || !data) return <Shell><LoadError message={error ?? ''} retry={reload} /></Shell>
  const guarantor = data.role === 'GUARANTOR'

  if (data.signedAt) {
    return (
      <Shell>
        <Card>
          <h1 style={display('clamp(32px, 5vw, 44px)')}>C’est signé.</h1>
          <p style={{ margin: 0, fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>
            Merci. Votre signature a été enregistrée le {new Date(data.signedAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}.{' '}
            {data.completed ? 'Toutes les parties ont signé : votre exemplaire signé vous a été envoyé par email.' : 'Dès que tout le monde aura signé, vous recevrez votre exemplaire signé par email.'}
          </p>
          {data.completed ? (
            <div>
              <Btn href={`${pdf}?download=1`}>Télécharger le document signé</Btn>
            </div>
          ) : null}
          <Others others={data.others} />
        </Card>
      </Shell>
    )
  }

  const sendCode = async () => {
    const r = await api<{ sentTo: string }>(`${base}/code`, { method: 'POST' })
    setSent(r.sentTo)
    toast.show(`Code envoyé à ${r.sentTo}.`)
  }
  const verify = async () => {
    await api(`${base}/verify`, { method: 'POST', body: { code } })
    toast.show('Identité confirmée.')
    reload()
  }
  const sign = async () => {
    if (!image) return toast.show('Dessinez votre signature dans le cadre.', 'error')
    await api(`${base}/sign`, { method: 'POST', body: { mention, image, consent, noPhoto: !data.photoAt && noPhoto } })
    reload()
  }

  return (
    <Shell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.caramelInk }}>Signature électronique</span>
        <h1 style={display('clamp(32px, 5vw, 46px)')}>{data.document}</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>
          {data.landlord} vous invite à signer, en tant que {data.roleLabel.toLowerCase()}, {guarantor ? 'l’acte de cautionnement du bail' : 'le bail'} du logement situé {data.property}.
        </span>
      </div>

      <Step n={1} title="Relisez le document" done={read}>
        <p style={{ margin: 0, fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Prenez le temps de tout lire, annexes comprises. Vous pouvez aussi le télécharger pour le garder.</p>
        <div className="hide-md" style={{ border: `1px solid ${BAI.divider}`, borderRadius: 14, overflow: 'hidden', height: 520 }}>
          {blob ? <iframe title={data.document} src={blob} style={{ width: '100%', height: '100%', border: 0 }} /> : <Loader />}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn variant="outline" onClick={() => openPdfFrom(() => pdfUrl(`${base}/document.pdf`)).catch(toast.error)}>Ouvrir le document</Btn>
          <Btn variant="outline" href={`${pdf}?download=1`}>Télécharger</Btn>
        </div>
        <Check checked={read} onChange={setRead} label="J’ai lu le document en entier." />
      </Step>

      <Step n={2} title="Confirmez votre identité" done={data.codeVerified} disabled={!read}>
        {data.codeVerified ? (
          <span style={{ fontSize: 15, color: BAI.green, fontWeight: 600 }}>Identité confirmée par le code reçu à {data.email}.</span>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Nous envoyons un code à six chiffres à votre adresse {data.email}. Il prouve que c’est bien vous qui signez.</p>
            <div>
              <Btn variant={sent ? 'outline' : 'primary'} onClick={() => sendCode().catch(toast.error)} disabled={!read}>
                {sent ? 'Renvoyer un code' : 'Recevoir mon code'}
              </Btn>
            </div>
            {sent ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Input label="Code reçu par email" value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} style={{ maxWidth: 220 }} />
                <Btn onClick={() => verify().catch(toast.error)} disabled={code.length !== 6} style={{ height: 60 }}>
                  Valider
                </Btn>
              </div>
            ) : null}
          </>
        )}
      </Step>

      <Step n={3} title="Prenez-vous en photo (facultatif)" done={Boolean(data.photoAt) || noPhoto} disabled={!data.codeVerified}>
        <p style={{ margin: 0, fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>
          Une photo de votre visage, prise maintenant. Elle est datée à la seconde par notre serveur et jointe au certificat de preuve : elle montre que c’est bien vous qui signez. Elle n’est visible que des signataires du bail. Elle est facultative.
        </p>
        {data.codeVerified ? (
          <SelfieCapture
            value={photo}
            onPhoto={async (dataUrl) => {
              await api(`${base}/photo`, { method: 'POST', body: { photo: dataUrl } })
              setPhoto(dataUrl)
              toast.show('Photo enregistrée.')
              reload()
            }}
          />
        ) : null}
        {data.codeVerified && !data.photoAt ? <Check checked={noPhoto} onChange={setNoPhoto} label="Signer sans photo" sub="C’est possible : le certificat indiquera que vous avez choisi de signer sans photo." /> : null}
        {data.photoAt ? <span style={{ fontSize: 14, color: BAI.green, fontWeight: 600 }}>Photo enregistrée le {new Date(data.photoAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'medium' })}.</span> : null}
      </Step>

      <Step n={4} title={guarantor ? 'Recopiez la mention de caution' : 'Recopiez la mention'} disabled={!data.codeVerified}>
        <p style={{ margin: 0, fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>
          {guarantor
            ? 'La loi exige que la caution écrive elle-même cette mention (article 2297 du Code civil). Tapez-la entièrement : le copier-coller est désactivé.'
            : 'Elle montre que vous avez lu le contrat et que vous l’acceptez.'}
        </p>
        <div style={{ background: BAI.bg, border: `1px solid ${BAI.divider}`, borderRadius: 12, padding: '12px 14px', fontSize: 15, lineHeight: 1.55, fontStyle: 'italic' }}>« {data.mention} »</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Votre mention</span>
          <textarea
            value={mention}
            onChange={(e) => setMention(e.target.value)}
            onPaste={guarantor ? (e) => e.preventDefault() : undefined}
            onDrop={guarantor ? (e) => e.preventDefault() : undefined}
            rows={guarantor ? 7 : 1}
            disabled={!data.codeVerified}
            style={{ border: `1.5px solid ${BAI.borderStrong}`, borderRadius: 14, padding: '14px 16px', fontSize: 16, lineHeight: 1.5, fontFamily: 'inherit', background: BAI.surface, color: BAI.ink, resize: 'vertical', minHeight: 60 }}
          />
        </label>
      </Step>

      <Step n={5} title="Signez" disabled={!data.codeVerified || (!data.photoAt && !noPhoto)}>
        {data.codeVerified ? <SignaturePad value={image} onChange={setImage} label="Signez avec le doigt ou la souris" /> : null}
        <Check
          checked={consent}
          onChange={setConsent}
          label="J’accepte de signer ce document électroniquement."
          sub="Ma signature électronique a la même valeur qu’une signature à la main. La date, l’heure, mon adresse IP, le code vérifié et, le cas échéant, ma photo sont conservés comme preuve."
        />
        <div>
          <Btn size="lg" onClick={() => sign().catch(toast.error)} disabled={!data.codeVerified || (!data.photoAt && !noPhoto) || !consent || !mention.trim() || !image}>
            Signer le document
          </Btn>
        </div>
      </Step>

      <Others others={data.others} />

      <Card title="Est-ce que c’est légal ?">
        <p style={{ margin: 0, fontSize: 14, color: BAI.inkMid, lineHeight: 1.55 }}>
          Oui. Un écrit électronique a la même valeur qu’un écrit sur papier (Code civil, article 1366), et la signature électronique est valable dès lors qu’elle identifie la personne qui
          signe et garantit son lien avec le document (article 1367). Votre identité est vérifiée par un code envoyé à votre adresse et par une photo datée, le document est figé par son
          empreinte numérique, et un certificat de preuve est joint au document signé.
        </p>
        <div style={{ display: 'flex', gap: '4px 16px', flexWrap: 'wrap' }}>
          <Guide to="signature" />
          <a href={EIDAS} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: BAI.owner, textDecoration: 'none' }}>
            Règlement européen eIDAS <span aria-hidden>↗</span>
          </a>
          <a href={GUIDES.caution.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: BAI.owner, textDecoration: 'none' }}>
            {guarantor ? 'La caution du locataire' : 'Rédaction du bail'} <span aria-hidden>↗</span>
          </a>
        </div>
      </Card>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: BAI.bg }}>
      <header style={{ padding: '18px clamp(16px, 4vw, 40px)', borderBottom: `1px solid ${BAI.divider}`, background: BAI.surface }}>
        <Logo to={null} />
      </header>
      <main style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) 16px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</main>
    </div>
  )
}

function Step({ n, title, done, disabled, children }: { n: number; title: string; done?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <section style={{ background: disabled ? BAI.bg : BAI.surface, border: disabled ? `1px dashed ${BAI.dashed}` : `1px solid ${BAI.divider}`, borderRadius: 20, padding: 'clamp(18px, 3vw, 26px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 30, height: 30, borderRadius: 15, background: done ? BAI.green : BAI.night, color: BAI.surface, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{done ? '✓' : n}</span>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Others({ others }: { others: SignView['others'] }) {
  if (!others.length) return null
  return (
    <Callout tone="info" title="Les autres signataires">
      {others.map((o) => `${o.name} (${o.roleLabel.toLowerCase()}) : ${o.signed ? 'a signé' : 'en attente'}`).join(' · ')}
    </Callout>
  )
}
