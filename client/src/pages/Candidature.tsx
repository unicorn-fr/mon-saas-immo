import { ThirdPartyNotice } from '../components/DataNotice'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Logo } from '../components/Logo'
import { Fields } from '../components/FlowLayout'
import { Btn, Callout, Card, Check, Chips, Input, LoadError, Loader, Money, NumberField, Select, TextArea, useLoad, useToast } from '../components/kit'
import { display } from '../components/ui'
import { api } from '../lib/api'

interface Offer {
  title: string
  text: string
  rentWithChargesCents: number | null
  allowedDocuments: Array<{ title: string; items: string[] }>
  requestedDocs: Array<{ key: string; label: string }>
  guarantorDocs: boolean
}

type Situation = 'EMPLOYEE' | 'SELF_EMPLOYED' | 'STUDENT' | 'APPRENTICE' | 'RETIRED' | 'OTHER'
type Guarantee = 'CAUTION' | 'VISALE' | 'GLI' | 'NONE'

/**
 * Candidature à un logement, depuis le lien partagé par le propriétaire. Sans compte et sans pièce jointe :
 * les justificatifs restent dans DossierFacile, le dossier de location de l'État.
 */
export default function Candidature() {
  const { code = '' } = useParams()
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api<Offer>(`/candidature/${encodeURIComponent(code)}`), [code])
  const [f, setF] = useState({
    civility: null as 'MADAME' | 'MONSIEUR' | null,
    firstNames: '',
    lastName: '',
    email: '',
    phone: '',
    currentAddress: '',
    situation: null as Situation | null,
    monthlyIncomeCents: null as number | null,
    occupants: 1 as number | null,
    guarantee: null as Guarantee | null,
    guarantor: { firstNames: '', lastName: '', email: '' },
    moveInDate: '',
    dossierFacileUrl: '',
    message: '',
    consent: false,
    website: '',
  })
  const [sent, setSent] = useState(false)
  // Après l'envoi : dépôt des pièces demandées, avec le jeton remis par le serveur.
  const [upload, setUpload] = useState<{ candidateId: string; uploadToken: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (patch: Partial<typeof f>) => setF({ ...f, ...patch })

  const send = async () => {
    if (!f.firstNames.trim() || !f.lastName.trim() || !f.email.trim()) return toast.show('Indiquez vos nom, prénom et email.', 'error')
    if (!f.situation || !f.guarantee || f.monthlyIncomeCents === null) return toast.show('Indiquez votre situation, vos revenus et votre garantie.', 'error')
    if (!f.consent) return toast.show('Cochez la case pour envoyer votre candidature.', 'error')
    setBusy(true)
    try {
      const r = await api<{ candidateId?: string; uploadToken?: string }>(`/candidature/${encodeURIComponent(code)}`, {
        method: 'POST',
        body: { ...f, guarantor: f.guarantee === 'CAUTION' ? f.guarantor : null, moveInDate: f.moveInDate || null, dossierFacileUrl: f.dossierFacileUrl.trim() || null },
      })
      if (r.candidateId && r.uploadToken && data?.requestedDocs.length) setUpload({ candidateId: r.candidateId, uploadToken: r.uploadToken })
      else setSent(true)
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink }}>
      <header style={{ padding: '20px clamp(16px, 4vw, 40px)', borderBottom: `1px solid ${BAI.divider}`, background: BAI.surface }}>
        <Logo />
      </header>
      <main style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) 16px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading && !data ? (
          <Loader />
        ) : error || !data ? (
          <LoadError message={error ?? 'Ce lien de candidature n’est plus actif.'} retry={reload} />
        ) : upload && !sent ? (
          <UploadDocs code={code} upload={upload} docs={data.requestedDocs} guarantor={f.guarantee === 'CAUTION' && data.guarantorDocs} onDone={() => setSent(true)} />
        ) : sent ? (
          <Card>
            <h1 style={display('clamp(32px, 5vw, 44px)')}>Candidature envoyée.</h1>
            <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>Le propriétaire a bien reçu votre candidature. S’il la retient, il vous contactera directement par email ou par téléphone.</span>
          </Card>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, color: BAI.inkSoft }}>Candidature</span>
              <h1 style={display('clamp(32px, 5vw, 46px)')}>{data.title}</h1>
            </div>
            <Card title="L’annonce">
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.6, color: BAI.inkMid }}>{data.text}</div>
            </Card>
            <Card title="Vous">
              <Chips legend="Civilité" value={f.civility} onChange={(v) => set({ civility: v })} options={[{ value: 'MADAME', label: 'Madame' }, { value: 'MONSIEUR', label: 'Monsieur' }]} />
              <Fields>
                <Input label="Prénom" value={f.firstNames} onChange={(v) => set({ firstNames: v })} autoComplete="given-name" />
                <Input label="Nom" value={f.lastName} onChange={(v) => set({ lastName: v })} autoComplete="family-name" />
              </Fields>
              <Fields>
                <Input label="Email" type="email" value={f.email} onChange={(v) => set({ email: v })} autoComplete="email" inputMode="email" />
                <Input label="Téléphone" hint="Facultatif." value={f.phone} onChange={(v) => set({ phone: v })} autoComplete="tel" inputMode="tel" />
              </Fields>
              <Input label="Adresse actuelle" hint="Facultatif." value={f.currentAddress} onChange={(v) => set({ currentAddress: v })} autoComplete="street-address" />
              <Select
                label="Situation professionnelle"
                value={f.situation}
                onChange={(v) => set({ situation: v })}
                options={[
                  { value: 'EMPLOYEE', label: 'Salarié' },
                  { value: 'SELF_EMPLOYED', label: 'Indépendant' },
                  { value: 'STUDENT', label: 'Étudiant' },
                  { value: 'APPRENTICE', label: 'Apprenti ou alternant' },
                  { value: 'RETIRED', label: 'Retraité' },
                  { value: 'OTHER', label: 'Autre situation' },
                ]}
              />
              <Fields>
                <Money label="Revenus nets du foyer, par mois" cents={f.monthlyIncomeCents} onChange={(c) => set({ monthlyIncomeCents: c })} />
                <NumberField label="Personnes qui vivront dans le logement" value={f.occupants} onChange={(v) => set({ occupants: v })} />
              </Fields>
              <Input label="Date d’entrée souhaitée" hint="Facultatif." type="date" value={f.moveInDate} onChange={(v) => set({ moveInDate: v })} />
            </Card>
            <Card title="Votre garantie">
              <Chips
                legend="Garantie"
                value={f.guarantee}
                onChange={(v) => set({ guarantee: v })}
                options={[
                  { value: 'CAUTION', label: 'Une personne se porte caution' },
                  { value: 'VISALE', label: 'Garantie Visale' },
                  { value: 'GLI', label: 'Assurance loyers impayés' },
                  { value: 'NONE', label: 'Pas de garant' },
                ]}
              />
              {f.guarantee === 'CAUTION' ? (
                <Fields>
                  <Input label="Prénom du garant" value={f.guarantor.firstNames} onChange={(v) => set({ guarantor: { ...f.guarantor, firstNames: v } })} />
                  <Input label="Nom du garant" value={f.guarantor.lastName} onChange={(v) => set({ guarantor: { ...f.guarantor, lastName: v } })} />
                </Fields>
              ) : null}
              {f.guarantee === 'VISALE' ? <span style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.5 }}>Visale est une garantie gratuite d’Action Logement, pour les moins de 31 ans et de nombreux salariés : visale.fr.</span> : null}
            </Card>
            <Card title="Vos justificatifs">
              <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.55 }}>
                Juste après l’envoi, vous pourrez déposer les pièces demandées : {data.requestedDocs.map((d) => d.label.toLowerCase()).join(', ')}. Vous avez un DossierFacile, le dossier gratuit de l’État ? Collez aussi son lien de partage.
              </span>
              <Input label="Lien de votre DossierFacile" value={f.dossierFacileUrl} onChange={(v) => set({ dossierFacileUrl: v })} placeholder="https://locataire.dossierfacile.logement.gouv.fr/…" hint="Facultatif, mais il accélère beaucoup la réponse." />
              <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>
                Pas encore de DossierFacile ? C’est gratuit, fait par l’État, et vos pièces y sont vérifiées une fois pour toutes.{' '}
                <a href="https://www.dossierfacile.logement.gouv.fr/" target="_blank" rel="noreferrer" style={{ color: BAI.owner, fontWeight: 600 }}>
                  Créer mon DossierFacile
                </a>
              </span>
              <details style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.55 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: BAI.ink }}>Les seules pièces qu’un propriétaire peut vous demander</summary>
                {data.allowedDocuments.map((g) => (
                  <div key={g.title} style={{ marginTop: 10 }}>
                    <strong>{g.title}</strong>
                    <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                      {g.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </details>
            </Card>
            <Card title="Un message pour le propriétaire">
              <TextArea label="Message" value={f.message} onChange={(v) => set({ message: v })} rows={4} hint="Facultatif." />
              {/* Champ invisible : les robots le remplissent, pas les personnes. */}
              <input tabIndex={-1} autoComplete="off" aria-hidden value={f.website} onChange={(e) => set({ website: e.target.value })} style={{ position: 'absolute', left: -9999, width: 1, height: 1 }} />
              <Check checked={f.consent} onChange={(v) => set({ consent: v })} label="J’ai compris que ces informations sont transmises au propriétaire pour étudier ma candidature." />
              <ThirdPartyNotice purpose="étudier votre candidature à la location de ce logement" keep="Si votre candidature n’est pas retenue, elles sont effacées, pièces comprises, au plus tard trois mois après leur envoi." />
            </Card>
            <Callout tone="tip">Le propriétaire ne peut pas vous demander de photo, de relevés bancaires, de carte Vitale ni de chèque de réservation. La loi interdit aussi toute discrimination.</Callout>
            <div>
              <Btn onClick={() => void send()} disabled={busy}>
                Envoyer ma candidature
              </Btn>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

/** Dépôt des pièces demandées par le propriétaire, après l'envoi de la candidature. */
function UploadDocs({ code, upload, docs, guarantor, onDone }: { code: string; upload: { candidateId: string; uploadToken: string }; docs: Array<{ key: string; label: string }>; guarantor: boolean; onDone: () => void }) {
  const toast = useToast()
  const [done, setDone] = useState<string[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const send = async (category: string, who: 'TENANT' | 'GUARANTOR', file: File) => {
    const form = new FormData()
    form.append('file', file)
    form.append('candidateId', upload.candidateId)
    form.append('token', upload.uploadToken)
    form.append('category', category)
    form.append('who', who)
    setBusy(`${who}-${category}`)
    try {
      await api(`/candidature/${encodeURIComponent(code)}/document`, { method: 'POST', form, timeout: 90_000 })
      setDone((d) => [...d, `${who}-${category}`])
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(null)
    }
  }
  const rows = (who: 'TENANT' | 'GUARANTOR') =>
    docs.map((d) => {
      const k = `${who}-${d.key}`
      return (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{d.label}</span>
          {done.includes(k) ? (
            <span style={{ fontSize: 14, fontWeight: 600, color: BAI.green }}>Reçu</span>
          ) : (
            <label style={{ color: BAI.owner, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {busy === k ? 'Envoi…' : 'Ajouter'}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                aria-label={`${d.label} (${who === 'GUARANTOR' ? 'garant' : 'vous'})`}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) void send(d.key, who, file)
                }}
              />
            </label>
          )}
        </div>
      )
    })
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(32px, 5vw, 44px)')}>Candidature envoyée.</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>Dernière étape : déposez les pièces demandées par le propriétaire (photo ou PDF). Vous pouvez masquer les informations inutiles à leur vérification.</span>
      </div>
      <Card title="Vos pièces">{rows('TENANT')}</Card>
      {guarantor ? <Card title="Les pièces de votre garant">{rows('GUARANTOR')}</Card> : null}
      <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>Elles ne sont visibles que du propriétaire et sont effacées au plus tard trois mois après votre candidature si elle n’est pas retenue.</span>
      <div>
        <Btn onClick={onDone}>{done.length ? 'Terminer' : 'Terminer sans pièce'}</Btn>
      </div>
    </>
  )
}
