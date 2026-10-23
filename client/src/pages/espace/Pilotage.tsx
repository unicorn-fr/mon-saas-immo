import { Navigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { display } from '../../components/ui'
import { Callout, Card, LoadError, Loader, PageHead, useLoad } from '../../components/kit'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { dateNum } from '../../lib/format'

interface Metrics {
  generatedAt: string
  totals: Array<{ key: string; label: string; value: number; hint: string }>
  funnel: Array<{ label: string; users: number; percent: number }>
  weeks: Array<{ week: string; signups: number; signedLeases: number; activeUsers: number }>
  notMeasured: string[]
}

/**
 * Pilotage (réservé aux adresses autorisées sur le serveur) : les chiffres qui disent si Bailio sert vraiment.
 * Uniquement des nombres, calculés depuis la base, sans aucun traceur.
 */
export default function Pilotage() {
  const { user } = useAuth()
  const { data, error, loading, reload } = useLoad(() => api<Metrics>('/admin/metrics'), [])
  if (user && !user.admin) return <Navigate to="/espace" replace />
  const th = { padding: '8px', fontWeight: 600 } as const
  const td = { padding: '8px', fontVariantNumeric: 'tabular-nums' } as const
  return (
    <AppShell>
      <PageHead title="Pilotage" sub="Les chiffres de Bailio, réservés à vous. Les comptes du pilotage ne sont pas comptés." />
      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : (
        <>
          <div className="grid-3" style={{ gap: 16 }}>
            {data.totals.map((t) => (
              <Card key={t.key} pad={20}>
                <span style={display(40, { lineHeight: 1 })}>{t.value.toLocaleString('fr-FR')}</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{t.label}</span>
                <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>{t.hint}</span>
              </Card>
            ))}
          </div>

          <Card title={<h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Du compte au premier loyer</h2>}>
            <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Part des comptes qui ont franchi chaque étape. C’est ici que l’on voit où les propriétaires s’arrêtent.</span>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.funnel.map((f) => (
                <li key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15 }}>
                    <span style={{ fontWeight: 600 }}>{f.label}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {f.users.toLocaleString('fr-FR')} · {f.percent} %
                    </span>
                  </span>
                  <span aria-hidden style={{ height: 10, borderRadius: 5, background: BAI.dividerSoft, overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${f.percent}%`, background: BAI.owner, borderRadius: 5 }} />
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          <Card title={<h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Semaine par semaine</h2>}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 480 }}>
                <caption style={{ textAlign: 'left', fontSize: 14, color: BAI.inkMid, padding: '4px 0 8px' }}>Les 8 dernières semaines, du lundi au dimanche.</caption>
                <thead>
                  <tr style={{ textAlign: 'right', color: BAI.inkSoft }}>
                    <th scope="col" style={{ ...th, textAlign: 'left' }}>Semaine du</th>
                    <th scope="col" style={th}>Inscriptions</th>
                    <th scope="col" style={th}>Baux signés</th>
                    <th scope="col" style={th}>Propriétaires venus</th>
                  </tr>
                </thead>
                <tbody>
                  {data.weeks.map((w) => (
                    <tr key={w.week} style={{ textAlign: 'right', borderTop: `1px solid ${BAI.dividerSoft}` }}>
                      <th scope="row" style={{ ...th, textAlign: 'left' }}>{dateNum(w.week)}</th>
                      <td style={td}>{w.signups}</td>
                      <td style={td}>{w.signedLeases}</td>
                      <td style={td}>{w.activeUsers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>
              « Propriétaires venus » compte la dernière visite connue de chaque appareil : une personne venue plusieurs semaines de suite n’apparaît que dans la plus récente.
            </span>
          </Card>

          <Callout tone="info" title="Ce qui n’est pas mesuré">
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.notMeasured.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </Callout>
          <span style={{ fontSize: 13, color: BAI.inkSoft }}>Calculé le {new Date(data.generatedAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}.</span>
        </>
      )}
    </AppShell>
  )
}
