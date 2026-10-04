import { useState } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { display } from '../../components/ui'
import { Btn, Callout, Card, Check, Crumbs, Pill, TextLink, useToast, type Tone } from '../../components/kit'
import { api } from '../../lib/api'
import { eurosCents } from '../../lib/format'

interface Match {
  leaseId: string
  label: string
  period: string
  dueCents: number
  amountCents: number
  receivedAt: string
  bankLabel: string
  level: 'SURE' | 'LIKELY' | 'CHECK'
  reason: string
  partial: boolean
  receiptAuto: boolean
}
interface Result {
  credits: number
  from: string
  to: string
  matches: Match[]
}

const LEVEL: Record<Match['level'], { label: string; tone: Tone }> = {
  SURE: { label: 'Reconnu', tone: 'green' },
  LIKELY: { label: 'Probable', tone: 'owner' },
  CHECK: { label: 'À vérifier', tone: 'caramel' },
}
const fr = (d: string) => d.split('-').reverse().join('/')
const month = (p: string) => {
  const [y, m] = p.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}
const key = (m: Match) => `${m.leaseId}:${m.period}`

/**
 * Loyers reçus repérés sur le relevé de compte : le propriétaire dépose le fichier téléchargé depuis sa banque,
 * Bailio reconnaît les loyers, un clic les enregistre et fait les quittances.
 */
export default function Releve() {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [chosen, setChosen] = useState<Set<string>>(new Set())
  const [done, setDone] = useState<{ count: number; sent: number } | null>(null)

  const read = async (file: File) => {
    setBusy(true)
    setDone(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const r = await api<Result>('/bank/statement', { method: 'POST', form })
      setResult(r)
      setChosen(new Set(r.matches.filter((m) => m.level !== 'CHECK').map(key)))
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!result) return
    const items = result.matches.filter((m) => chosen.has(key(m))).map((m) => ({ leaseId: m.leaseId, period: m.period, amountCents: m.amountCents, receivedAt: m.receivedAt }))
    if (!items.length) return
    setBusy(true)
    try {
      const r = await api<{ results: Array<{ sentTo: string[] | null }> }>('/bank/confirm', { method: 'POST', body: { items } })
      setDone({ count: r.results.length, sent: r.results.filter((x) => x.sentTo?.length).length })
      setResult(null)
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <Crumbs items={[{ label: 'Argent', to: '/espace/argent' }, { label: 'Relevé bancaire' }]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(34px, 5vw, 48px)')}>Vos loyers reçus, en un clic</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>
          Déposez le relevé du compte où vous recevez vos loyers : Bailio reconnaît les virements de vos locataires, enregistre les loyers et prépare les quittances.
        </span>
      </div>

      {done ? (
        <Callout tone="tip" title={`${done.count} loyer${done.count > 1 ? 's' : ''} enregistré${done.count > 1 ? 's' : ''}.`}>
          Les quittances sont rangées avec chaque bail.{done.sent ? ` ${done.sent} envoyée${done.sent > 1 ? 's' : ''} automatiquement par email.` : ''}
        </Callout>
      ) : null}

      <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>1. Téléchargez votre relevé</h2>}>
        <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 15, lineHeight: 1.5, color: BAI.inkMid }}>
          <li>Ouvrez l’espace en ligne de votre banque, sur ordinateur, puis le compte qui reçoit les loyers.</li>
          <li>Cherchez « Télécharger », « Exporter » ou « Historique des opérations ».</li>
          <li>Choisissez le format <strong>CSV</strong> (ou « tableur », « Excel ») ou <strong>OFX</strong> (« Money », « Quicken »), sur le dernier mois ou plus.</li>
        </ol>
      </Card>

      <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>2. Déposez-le ici</h2>}>
        <label className="drop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 16px', border: `2px dashed ${BAI.borderStrong}`, borderRadius: 18, background: BAI.bg, cursor: busy ? 'wait' : 'pointer', textAlign: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 600 }}>{busy ? 'Lecture en cours…' : 'Choisir le fichier du relevé'}</span>
          <span style={{ fontSize: 14, color: BAI.inkSoft }}>CSV ou OFX. Lu sur notre serveur, jamais enregistré : seuls les loyers que vous validez sont gardés.</span>
          <input
            type="file"
            accept=".csv,.ofx,.qfx,.txt,text/csv"
            disabled={busy}
            className="sr-only"
            aria-label="Fichier du relevé bancaire"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void read(f)
            }}
          />
        </label>
      </Card>

      {result ? (
        <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>3. Vérifiez et enregistrez</h2>}>
          <span style={{ fontSize: 15, color: BAI.inkMid }}>
            {result.credits} versement{result.credits > 1 ? 's' : ''} reçu{result.credits > 1 ? 's' : ''} du {fr(result.from)} au {fr(result.to)} ; {result.matches.length} loyer{result.matches.length > 1 ? 's' : ''} reconnu{result.matches.length > 1 ? 's' : ''}.
          </span>
          {result.matches.length ? (
            <>
              {result.matches.map((m) => (
                <div key={key(m)} style={{ borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Check
                    checked={chosen.has(key(m))}
                    onChange={(v) => {
                      const next = new Set(chosen)
                      if (v) next.add(key(m))
                      else next.delete(key(m))
                      setChosen(next)
                    }}
                    label={
                      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <strong>{m.label}</strong> · loyer de {month(m.period)} · {eurosCents(m.amountCents)}
                        {m.partial ? ` sur ${eurosCents(m.dueCents)}` : ''} <Pill tone={LEVEL[m.level].tone}>{LEVEL[m.level].label}</Pill>
                      </span>
                    }
                    sub={`Reçu le ${fr(m.receivedAt)} : « ${m.bankLabel} ». ${m.reason}${m.receiptAuto ? ' La quittance partira automatiquement par email.' : ''}`}
                  />
                </div>
              ))}
              <div>
                <Btn onClick={() => void confirm()} disabled={busy || !chosen.size} loading={busy}>
                  Enregistrer {chosen.size} loyer{chosen.size > 1 ? 's' : ''}
                </Btn>
              </div>
            </>
          ) : (
            <Callout tone="info">Aucun loyer en attente ne correspond à ce relevé. Vérifiez la période choisie, ou enregistrez le loyer à la main depuis la page du bail.</Callout>
          )}
        </Card>
      ) : null}

      <span style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.5 }}>
        Avec la « Quittance automatique » activée sur la page du bail, un loyer enregistré ici fait partir sa quittance tout de suite.{' '}
        <TextLink to="/espace/argent" style={{ fontSize: 14 }}>
          Retour à l’argent
        </TextLink>
      </span>
    </AppShell>
  )
}
