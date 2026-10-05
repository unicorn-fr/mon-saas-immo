import { BAI } from '../../constants/bailio-tokens'
import { Card, Empty, LoadError, Loader, Pill, TextLink, useLoad } from '../../components/kit'
import { display } from '../../components/ui'
import { api } from '../../lib/api'
import { dateNum } from '../../lib/format'
import { getSpace, switchSpace } from '../../lib/shared'

interface SharedView {
  ownerName: string
  ownerPhone: string | null
  properties: Array<{ id: string; name: string; address: string; access: string | null; tenants: Array<{ name: string; phone: string | null }>; interventions: Array<{ id: string; title: string; description: string | null; status: string; date: string | null }> }>
}

const STATUS: Record<string, { label: string; tone: 'caramel' | 'owner' | 'green' }> = { TODO: { label: 'À organiser', tone: 'caramel' }, PLANNED: { label: 'Prévue', tone: 'owner' }, DONE: { label: 'Terminée', tone: 'green' } }

/** Intervenant : le logement, le contact du locataire et les interventions. Rien d'autre (données minimales). */
export default function Partage() {
  const space = getSpace()
  const { data, error, loading, reload } = useLoad(() => api<SharedView>('/shared/view'))
  return (
    <main id="contenu" tabIndex={-1} style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink, padding: 'clamp(24px, 5vw, 56px) 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: BAI.ink }}>Bailio</span>
        {loading && !data ? (
          <Loader />
        ) : error || !data ? (
          <LoadError message={error ?? ''} retry={reload} />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h1 style={display('clamp(32px, 5vw, 44px)')}>Intervention</h1>
              <span style={{ fontSize: 16, color: BAI.inkMid }}>
                Pour {data.ownerName}
                {data.ownerPhone ? `, ${data.ownerPhone}` : ''}.
              </span>
            </div>
            {data.properties.map((p) => (
              <Card key={p.id} title={<h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{p.name}</h2>}>
                <span style={{ fontSize: 16 }}>{p.address}</span>
                {p.access ? <span style={{ fontSize: 15, color: BAI.inkMid }}>Accès : {p.access}</span> : null}
                {p.tenants.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Occupant</span>
                    {p.tenants.map((t) => (
                      <span key={t.name} style={{ fontSize: 15 }}>
                        {t.name}
                        {t.phone ? (
                          <>
                            {' · '}
                            <a href={`tel:${t.phone.replace(/\s/g, '')}`} style={{ color: BAI.owner, fontWeight: 600 }}>
                              {t.phone}
                            </a>
                          </>
                        ) : null}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Interventions</span>
                  {p.interventions.length ? (
                    p.interventions.map((i) => (
                      <div key={i.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 15 }}>{i.title}</strong>
                          <Pill tone={STATUS[i.status]?.tone ?? 'owner'}>{STATUS[i.status]?.label ?? i.status}</Pill>
                          {i.date ? <span style={{ fontSize: 14, color: BAI.inkMid }}>{dateNum(i.date)}</span> : null}
                        </span>
                        {i.description ? <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{i.description}</span> : null}
                      </div>
                    ))
                  ) : (
                    <Empty title="Aucune intervention pour l’instant." />
                  )}
                </div>
              </Card>
            ))}
          </>
        )}
        {space ? (
          <TextLink onClick={() => switchSpace(null)} style={{ fontSize: 15 }}>
            Revenir à mon espace
          </TextLink>
        ) : null}
      </div>
    </main>
  )
}
