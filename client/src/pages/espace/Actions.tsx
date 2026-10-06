import { useState } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Btn, Callout, Card, Check, Crumbs, LoadError, Loader, Pill, TextLink, errorMessage, useLoad, useToast } from '../../components/kit'
import { display } from '../../components/ui'
import { api } from '../../lib/api'
import { openDoc } from '../../lib/docs'

type Kind = 'INSURANCE' | 'UNPAID' | 'REVISION' | 'RECEIPTS'
interface Row {
  leaseId: string
  propertyName: string
  tenantName: string
  detail: string
  blocked: string | null
  amountCents?: number
  period?: string
}
interface BulkView {
  groups: Record<Kind, Row[]>
}
type Defaults = { letter: Record<string, unknown>; note: string | null }

const GROUPS: Record<Kind, { title: string; why: string; button: (n: number) => string; done: string; letter?: 'REMINDER' | 'REVISION' }> = {
  UNPAID: {
    title: 'Relancer les loyers impayés',
    why: 'Une relance amiable, polie et courte, part par email à chaque locataire en retard. Relisez-la avant l’envoi.',
    button: (n) => `Envoyer ${n} relance${n > 1 ? 's' : ''}`,
    done: 'Relance envoyée',
    letter: 'REMINDER',
  },
  INSURANCE: {
    title: 'Demander les attestations d’assurance',
    why: 'Le locataire doit justifier de son assurance chaque année, à votre demande. Il reçoit un lien pour envoyer son attestation, sans compte.',
    button: (n) => `Envoyer le lien à ${n} locataire${n > 1 ? 's' : ''}`,
    done: 'Lien envoyé',
  },
  REVISION: {
    title: 'Réviser les loyers',
    why: 'La lettre calcule le nouveau loyer avec l’indice de référence des loyers (IRL) et part par email. Le nouveau loyer s’applique ensuite tout seul à sa date.',
    button: (n) => `Envoyer ${n} lettre${n > 1 ? 's' : ''} de révision`,
    done: 'Lettre envoyée',
    letter: 'REVISION',
  },
  RECEIPTS: {
    title: 'Envoyer les quittances',
    why: 'Les quittances des loyers reçus ce mois-ci et le mois dernier qui ne sont pas encore parties.',
    button: (n) => `Envoyer ${n} quittance${n > 1 ? 's' : ''}`,
    done: 'Quittance envoyée',
  },
}
const ORDER: Kind[] = ['UNPAID', 'INSURANCE', 'REVISION', 'RECEIPTS']
const key = (r: Row) => `${r.leaseId}:${r.period ?? ''}`

/**
 * Actions groupées : un groupe ouvert à la fois, la liste des baux concernés (tous cochés sauf ceux qui ne peuvent pas
 * partir), relecture possible, un seul bouton. Chaque envoi passe par le même chemin que l'envoi à l'unité.
 */
export default function Actions() {
  const toast = useToast()
  const { data, error, reload } = useLoad(() => api<BulkView>('/bulk'))
  const [open, setOpen] = useState<Kind | null>(null)
  const [skipped, setSkipped] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, { ok: boolean; text: string }>>({})
  const [busy, setBusy] = useState(false)
  if (error) return <AppShell><LoadError message={error} retry={reload} /></AppShell>
  if (!data) return <AppShell><Loader /></AppShell>

  const available = ORDER.filter((k) => data.groups[k].length)
  const current = open ?? available[0] ?? null

  const letterFor = async (kind: Kind, r: Row): Promise<Record<string, unknown>> => {
    const d = await api<Defaults>(`/leases/${r.leaseId}/letters/defaults/${GROUPS[kind].letter}`)
    if (kind === 'REVISION' && d.note) throw new Error(d.note)
    return d.letter
  }
  const sendOne = async (kind: Kind, r: Row) => {
    if (kind === 'INSURANCE') {
      await api(`/leases/${r.leaseId}/tenant-link`, { method: 'POST', body: { open: true } })
      await api(`/leases/${r.leaseId}/tenant-link/send`, { method: 'POST' })
    } else if (kind === 'RECEIPTS') {
      await api(`/leases/${r.leaseId}/receipts/${r.period}/send`, { method: 'POST' })
    } else {
      const saved = await api<{ documentId: string }>(`/leases/${r.leaseId}/letters`, { method: 'POST', body: await letterFor(kind, r) })
      await api(`/documents/${saved.documentId}/send`, { method: 'POST' })
    }
  }
  const run = async (kind: Kind) => {
    const rows = data.groups[kind].filter((r) => !r.blocked && !skipped[key(r)] && !results[key(r)]?.ok)
    setBusy(true)
    let sent = 0
    for (const r of rows) {
      try {
        await sendOne(kind, r)
        sent++
        setResults((x) => ({ ...x, [key(r)]: { ok: true, text: GROUPS[kind].done } }))
      } catch (e) {
        setResults((x) => ({ ...x, [key(r)]: { ok: false, text: errorMessage(e) } }))
      }
    }
    setBusy(false)
    toast.show(sent === rows.length ? `C’est fait : ${sent} envoi${sent > 1 ? 's' : ''}.` : `${sent} sur ${rows.length} envoyé${sent > 1 ? 's' : ''}. Regardez les lignes en rouge.`, sent === rows.length ? 'ok' : 'error')
  }

  return (
    <AppShell>
      <Crumbs items={[{ label: 'Aujourd’hui', to: '/espace' }, { label: 'Actions groupées' }]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(34px, 5vw, 48px)')}>Actions groupées</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>Ce qui se fait en une fois pour tous vos logements. Vous relisez la liste, puis un seul bouton.</span>
      </div>
      {!available.length ? <Callout tone="ok">Rien à faire en groupe aujourd’hui : relances, assurances, révisions et quittances sont à jour.</Callout> : null}
      {available.map((kind) => {
        const g = GROUPS[kind]
        const rows = data.groups[kind]
        const expanded = current === kind
        const ready = rows.filter((r) => !r.blocked && !skipped[key(r)] && !results[key(r)]?.ok)
        return (
          <Card key={kind}>
            <h2 style={{ margin: 0 }}>
              <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : kind)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', color: BAI.ink }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>{g.title}</span>
                <Pill tone="owner">{rows.length}</Pill>
              </button>
            </h2>
            {expanded ? (
              <>
                <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>{g.why}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rows.map((r) => {
                    const k = key(r)
                    const res = results[k]
                    return (
                      <div key={k} style={{ borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {r.blocked || res ? (
                          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 15, fontWeight: 600 }}>
                              {r.tenantName} · {r.propertyName}
                            </span>
                            <span style={{ fontSize: 13, color: BAI.inkSoft }}>{r.detail}</span>
                          </span>
                        ) : (
                          <Check checked={!skipped[k]} onChange={(v) => setSkipped((x) => ({ ...x, [k]: !v }))} label={`${r.tenantName} · ${r.propertyName}`} sub={r.detail} />
                        )}
                        <span style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                          {res ? <Pill tone={res.ok ? 'green' : 'error'}>{res.ok ? res.text : 'Non envoyé'}</Pill> : null}
                          {g.letter && !r.blocked && !res?.ok ? (
                            <TextLink style={{ fontSize: 14 }} onClick={() => void letterFor(kind, r).then((letter) => openDoc(`/leases/${r.leaseId}/letters/preview`, { method: 'POST', body: letter })).catch(toast.error)}>
                              Relire la lettre
                            </TextLink>
                          ) : null}
                        </span>
                        {r.blocked ? <span style={{ width: '100%', fontSize: 13, color: BAI.caramelInk }}>{r.blocked}</span> : null}
                        {res && !res.ok ? <span style={{ width: '100%', fontSize: 13, color: BAI.error }}>{res.text}</span> : null}
                      </div>
                    )
                  })}
                </div>
                {ready.length ? (
                  <div>
                    <Btn onClick={() => void run(kind)} loading={busy}>
                      {g.button(ready.length)}
                    </Btn>
                  </div>
                ) : null}
              </>
            ) : null}
          </Card>
        )
      })}
    </AppShell>
  )
}
