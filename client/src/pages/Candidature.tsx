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
  const [busy, setBusy] = useState(false)
  const set = (patch: Partial<typeof f>) => setF({ ...f, ...patch })

  const send = async () => {
    if (!f.firstNames.trim() || !f.lastName.trim() || !f.email.trim()) return toast.show('Indiquez vos nom, prénom et email.', 'error')
    if (!f.situation || !f.guarantee || f.monthlyIncomeCents === null) return toast.show('Indiquez votre situation, vos revenus et votre garantie.', 'error')
    if (!f.consent) return toast.show('Cochez la case pour envoyer votre candidature.', 'error')
    setBusy(true)
    try {
      await api(`/candidature/${encodeURIComponent(code)}`, {
        method: 'POST',
        body: { ...f, guarantor: f.guarantee === 'CAUTION' ? f.guarantor : null, moveInDate: f.moveInDate || null, dossierFacileUrl: f.dossierFacileUrl.trim() || null },
      })
      setSent(true)
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
                <Input label="Téléphone" value={f.phone} onChange={(v) => set({ phone: v })} autoComplete="tel" inputMode="tel" />
              </Fields>
              <Input label="Adresse actuelle" value={f.currentAddress} onChange={(v) => set({ currentAddress: v })} autoComplete="street-address" />
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
              <Input label="Date d’entrée souhaitée" type="date" value={f.moveInDate} onChange={(v) => set({ moveInDate: v })} />
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
                Ne joignez aucun document ici. Constituez votre dossier sur DossierFacile, le service gratuit de l’État qui vérifie vos pièces, puis collez le lien de partage ci-dessous.
              </span>
              <Input label="Lien de votre DossierFacile" value={f.dossierFacileUrl} onChange={(v) => set({ dossierFacileUrl: v })} placeholder="https://locataire.dossierfacile.logement.gouv.fr/…" hint="Facultatif, mais il accélère beaucoup la réponse." />
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
              <Check checked={f.consent} onChange={(v) => set({ consent: v })} label="J’accepte que ces informations soient transmises au propriétaire pour étudier ma candidature." sub="Elles sont effacées au plus tard trois mois après leur envoi." />
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
