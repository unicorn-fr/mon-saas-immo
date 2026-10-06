import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Card, Crumbs, LoadError, Loader, Pill, useLoad } from '../../components/kit'
import { display } from '../../components/ui'
import { api } from '../../lib/api'

type AidStatus = 'LIKELY' | 'CHECK' | 'NOT' | 'INFO'
interface Aid {
  key: string
  title: string
  status: AidStatus
  summary: string
  reasons: string[]
  steps: string[]
  links: Array<{ label: string; url: string }>
}
interface AidsView {
  propertyName: string
  aids: Aid[]
}

const STATUS: Record<AidStatus, { label: string; tone: 'green' | 'owner' | 'caramel' | 'muted' }> = {
  LIKELY: { label: 'Semble possible', tone: 'green' },
  CHECK: { label: 'À vérifier', tone: 'caramel' },
  INFO: { label: 'Bon à savoir', tone: 'owner' },
  NOT: { label: 'Ne s’applique pas', tone: 'muted' },
}

/**
 * Aides et dispositifs du logement (server/src/domain/aids.ts) : ce qui semble ouvert d'abord, une aide ouverte à la
 * fois, avec le pourquoi, les démarches et le lien officiel. Bailio oriente ; l'organisme décide.
 */
export default function Aides() {
  const { id = '' } = useParams()
  const { data, error, reload } = useLoad(() => api<AidsView>(`/properties/${id}/aids`), [id])
  const [open, setOpen] = useState<string | null>(null)
  if (error) return <AppShell><LoadError message={error} retry={reload} /></AppShell>
  if (!data) return <AppShell><Loader /></AppShell>
  const first = open ?? data.aids.find((a) => a.status === 'LIKELY')?.key ?? null
  return (
    <AppShell>
      <Crumbs items={[{ label: 'Logements', to: '/espace/logements' }, { label: data.propertyName, to: `/espace/logements/${id}` }, { label: 'Aides' }]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(34px, 5vw, 48px)')}>Aides et dispositifs</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>D’après la fiche du logement et celle de votre locataire. Bailio vous oriente ; l’organisme décide.</span>
      </div>
      {data.aids.map((a) => {
        const expanded = first === a.key
        return (
          <Card key={a.key}>
            <h2 style={{ margin: 0 }}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? '' : a.key)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', color: BAI.ink }}
              >
                <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{a.title}</span>
                <Pill tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Pill>
              </button>
            </h2>
            {expanded ? (
              <>
                <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>{a.summary}</span>
                {a.reasons.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.caramelInk }}>Pour votre logement</span>
                    {a.reasons.map((r) => (
                      <span key={r} style={{ fontSize: 15, lineHeight: 1.5 }}>
                        {r}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.caramelInk }}>Comment faire</span>
                  <ol style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.6 }}>
                    {a.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                </div>
                <div style={{ display: 'flex', gap: '8px 20px', flexWrap: 'wrap' }}>
                  {a.links.map((l) => (
                    <a key={l.url + l.label} href={l.url} target="_blank" rel="noreferrer" style={{ fontSize: 15, fontWeight: 600, color: BAI.owner }}>
                      {l.label}
                    </a>
                  ))}
                </div>
              </>
            ) : null}
          </Card>
        )
      })}
    </AppShell>
  )
}
