import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { display } from '../../components/ui'
import { Btn, Callout, Crumbs, LoadError, Loader, Pill, TextLink, useLoad, useToast } from '../../components/kit'
import { Check } from '../../components/Icons'
import { api } from '../../lib/api'
import { dateNum } from '../../lib/format'

type Kind = 'DEPARTURE' | 'UNPAID' | 'SALE' | 'PROBLEM'

const SITUATIONS: Array<{ kind: Kind; title: string; text: string }> = [
  { kind: 'DEPARTURE', title: 'Mon locataire part', text: 'Congé reçu, état des lieux de sortie, départ, solde de tout compte.' },
  { kind: 'UNPAID', title: 'Mon locataire ne paie pas', text: 'Relance, mise en demeure, garant, commissaire de justice.' },
  { kind: 'SALE', title: 'Je veux vendre ou reprendre', text: 'La bonne date pour donner congé, ou vendre avec le locataire en place.' },
  { kind: 'PROBLEM', title: 'Un problème dans le logement', text: 'Dégradations, voisinage, assurance, chaudière, détecteurs.' },
]

interface LeaseRow {
  id: string
  status: string
  tenantName: string
  property: { name: string }
}

/** « Que se passe-t-il ? » : on part de la situation, Bailio enchaîne les bons documents. */
export default function Situations() {
  const navigate = useNavigate()
  const { data, error, loading, reload } = useLoad(() => api<LeaseRow[]>('/leases'))
  const [kind, setKind] = useState<Kind | null>(null)
  const leases = (data ?? []).filter((l) => l.status === 'ACTIVE' || (kind === 'DEPARTURE' && l.status === 'ENDED'))

  const pick = (k: Kind) => {
    const list = (data ?? []).filter((l) => l.status === 'ACTIVE' || (k === 'DEPARTURE' && l.status === 'ENDED'))
    if (list.length === 1) navigate(`/espace/baux/${list[0].id}/parcours/${k}`)
    else setKind(k)
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(38px, 5vw, 52px)')}>Que se passe-t-il ?</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid }}>Choisissez la situation : Bailio vous donne les étapes dans l’ordre, avec les dates limites et les documents déjà remplis.</span>
      </div>
      {loading && !data ? (
        <Loader />
      ) : error ? (
        <LoadError message={error} retry={reload} />
      ) : !(data ?? []).some((l) => l.status === 'ACTIVE' || l.status === 'ENDED') ? (
        <Callout tone="tip" title="Aucun bail signé pour l’instant">
          Les parcours s’appuient sur un bail en cours. <TextLink to="/espace/baux/nouveau" style={{ fontSize: 13 }}>Créer un bail</TextLink> ou <TextLink to="/importer" style={{ fontSize: 13 }}>importer un bail signé</TextLink>.
        </Callout>
      ) : (
        <>
          <div className="grid-2" style={{ gap: 16 }}>
            {SITUATIONS.map((s) => (
              <button
                key={s.kind}
                type="button"
                onClick={() => pick(s.kind)}
                aria-pressed={kind === s.kind}
                style={{ textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', color: BAI.ink, background: BAI.surface, border: kind === s.kind ? `2px solid ${BAI.owner}` : `1px solid ${BAI.divider}`, borderRadius: 20, padding: 'clamp(20px, 3vw, 28px)', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <span style={{ fontSize: 20, fontWeight: 700 }}>{s.title}</span>
                <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>{s.text}</span>
              </button>
            ))}
          </div>
          {kind && leases.length > 1 ? (
            <section style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 20, padding: 'clamp(18px, 3vw, 26px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>Pour quel bail ?</span>
              {leases.map((l) => (
                <Link key={l.id} to={`/espace/baux/${l.id}/parcours/${kind}`} style={{ textDecoration: 'none', color: BAI.ink, display: 'flex', justifyContent: 'space-between', gap: 12, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10, fontSize: 15 }}>
                  <span style={{ fontWeight: 600 }}>{l.tenantName}</span>
                  <span style={{ color: BAI.inkSoft }}>{l.property.name}</span>
                </Link>
              ))}
            </section>
          ) : null}
        </>
      )}
    </AppShell>
  )
}

type StepStatus = 'DONE' | 'TODO' | 'LATER' | 'OPTIONAL' | 'NA'
interface Step {
  key: string
  title: string
  text: string
  status: StepStatus
  due?: string | null
  doneAt?: string | null
  action: { type: 'LETTER'; letter: string } | { type: 'INVENTORY' } | { type: 'END_LEASE' } | { type: 'MANUAL' } | { type: 'NONE' }
}
interface JourneyView {
  kind: Kind
  title: string
  intro: string
  alert?: string | null
  steps: Step[]
  lease: { id: string; tenantName: string; address: string }
}

const STATUS: Record<StepStatus, { label: string; tone: 'green' | 'owner' | 'muted' | 'caramel' }> = {
  DONE: { label: 'Fait', tone: 'green' },
  TODO: { label: 'À faire', tone: 'owner' },
  LATER: { label: 'Plus tard', tone: 'muted' },
  OPTIONAL: { label: 'Si besoin', tone: 'caramel' },
  NA: { label: 'Pas nécessaire', tone: 'muted' },
}

/** Un parcours : les étapes dans l'ordre, chacune ouvre le bon document déjà rempli. */
export function Parcours() {
  const { id = '', kind = 'DEPARTURE' } = useParams()
  const toast = useToast()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useLoad(() => api<JourneyView>(`/leases/${id}/journeys/${kind}`), [id, kind])
  const open = (s: Step) => {
    if (s.action.type === 'LETTER') navigate(`/espace/baux/${id}/courriers?type=${s.action.letter}`)
    if (s.action.type === 'INVENTORY') navigate(`/espace/baux/${id}/etat-des-lieux?type=EXIT`)
    if (s.action.type === 'END_LEASE') navigate(`/espace/baux/${id}?depart=1`)
  }
  const mark = async (s: Step, done: boolean) => {
    try {
      await api(`/leases/${id}/journeys/${kind}/${s.key}/done`, { method: 'POST', body: { done } })
      reload()
    } catch (e) {
      toast.error(e)
    }
  }
  const next = data?.steps.find((s) => s.status === 'TODO')

  return (
    <AppShell>
      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : (
        <>
          <Crumbs items={[{ label: 'Que se passe-t-il ?', to: '/espace/situations' }, { label: data.lease.tenantName || 'Bail', to: `/espace/baux/${id}` }, { label: data.title }]} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 style={display('clamp(34px, 5vw, 48px)')}>{data.title}</h1>
            <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>{data.intro}</span>
          </div>
          {data.alert ? <Callout tone="warn">{data.alert}</Callout> : null}
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.steps.map((s, i) => {
              const st = STATUS[s.status]
              const isNext = s === next
              const muted = s.status === 'NA' || s.status === 'LATER'
              return (
                <li key={s.key} style={{ background: s.status === 'NA' ? BAI.bg : BAI.surface, border: isNext ? `2px solid ${BAI.owner}` : s.status === 'NA' ? `1px dashed ${BAI.dashed}` : `1px solid ${BAI.divider}`, borderRadius: 18, padding: 'clamp(16px, 3vw, 22px)', display: 'flex', gap: 16 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 15, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, ...(s.status === 'DONE' ? { background: BAI.greenLight } : isNext ? { background: BAI.owner, color: BAI.surface } : { border: `1.5px solid ${BAI.dashed}`, color: BAI.inkSoft }) }}>
                    {s.status === 'DONE' ? <Check size={16} /> : i + 1}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: muted ? BAI.inkMid : BAI.ink }}>{s.title}</span>
                      <Pill tone={st.tone}>{s.status === 'DONE' && s.doneAt ? `Fait le ${dateNum(s.doneAt)}` : st.label}</Pill>
                    </div>
                    <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>{s.text}</span>
                    {s.due && s.status !== 'DONE' && s.status !== 'NA' ? <span style={{ fontSize: 14, fontWeight: 600, color: BAI.caramelInk }}>Au plus tard le {dateNum(s.due)}</span> : null}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 2 }}>
                      {s.action.type === 'MANUAL' ? (
                        s.status === 'DONE' ? (
                          <TextLink style={{ fontSize: 14 }} onClick={() => void mark(s, false)}>
                            Ce n’est pas encore fait
                          </TextLink>
                        ) : s.status === 'TODO' ? (
                          <Btn size="sm" variant={isNext ? 'primary' : 'outline'} onClick={() => void mark(s, true)}>
                            C’est fait
                          </Btn>
                        ) : null
                      ) : s.action.type !== 'NONE' && s.status !== 'NA' ? (
                        <Btn size="sm" variant={isNext ? 'primary' : 'outline'} onClick={() => open(s)}>
                          {s.status === 'DONE' ? 'Revoir' : s.action.type === 'LETTER' ? 'Préparer le document' : s.action.type === 'INVENTORY' ? 'Faire l’état des lieux' : 'Enregistrer le départ'}
                        </Btn>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
          <span style={{ fontSize: 14, color: BAI.inkSoft }}>Chaque document enregistré coche l’étape automatiquement. Tout est rangé dans vos documents.</span>
        </>
      )}
    </AppShell>
  )
}
