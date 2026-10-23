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
  audience: Audience
}

interface Audience {
  visits7: number
  visits30: number
  homeViews30: number
  sources: Array<{ source: string; visits: number; percent: number }>
  landings: Array<{ path: string; visits: number }>
  tunnel: Array<{ path: string; label: string; views: number; percent: number }>
  weeks: Array<{ week: string; visits: number }>
}

const PAGE_LABEL: Record<string, string> = {
  '/': 'Accueil',
  '/commencer': 'Créer mon bail (début)',
  '/importer': 'Importer un bail',
  '/connexion': 'Connexion',
  '/inscription': 'Créer mon espace',
  '/reprendre': 'Reprendre mon bail',
  '/securite': 'Sécurité',
  '/contact': 'Contact',
  '/prix-et-remboursement': 'Prix et remboursement',
}
const pageLabel = (path: string) => PAGE_LABEL[path] ?? path

/** Barre horizontale avec son libellé et sa valeur (provenances, parcours, entonnoir). */
function Bar({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <li style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15 }}>
        <span style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{label}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</span>
      </span>
      <span aria-hidden style={{ height: 10, borderRadius: 5, background: BAI.dividerSoft, overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: `${percent}%`, background: BAI.owner, borderRadius: 5 }} />
      </span>
    </li>
  )
}

const barList = { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 } as const
const h2 = { margin: 0, fontSize: 20, fontWeight: 700 } as const
const note = { fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 } as const

/**
 * Pilotage (réservé aux adresses autorisées sur le serveur) : les chiffres qui disent si Bailio sert vraiment.
 * Uniquement des nombres, calculés depuis la base, sans cookie ni traceur (visites : compteurs anonymes par jour).
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
          <h2 style={{ ...h2, marginTop: 8 }}>Visiteurs du site</h2>
          <div className="grid-3" style={{ gap: 16 }}>
            {[
              { label: 'Visites cette semaine', value: data.audience.visits7, hint: 'Arrivées sur bailio.fr ces 7 derniers jours' },
              { label: 'Visites ce mois-ci', value: data.audience.visits30, hint: 'Arrivées sur bailio.fr ces 30 derniers jours' },
              { label: 'Vues de l’accueil', value: data.audience.homeViews30, hint: 'Première page de bailio.fr, ces 30 derniers jours' },
            ].map((t) => (
              <Card key={t.label} pad={20}>
                <span style={display(40, { lineHeight: 1 })}>{t.value.toLocaleString('fr-FR')}</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{t.label}</span>
                <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>{t.hint}</span>
              </Card>
            ))}
          </div>

          <Card title={<h2 style={h2}>D’où viennent les visiteurs</h2>}>
            <span style={note}>Site d’où arrivent les visiteurs, ces 30 derniers jours. « Accès direct » : adresse tapée, favori ou lien ouvert depuis une application.</span>
            {data.audience.sources.length === 0 ? (
              <span style={note}>Aucune visite comptée pour l’instant.</span>
            ) : (
              <ol style={barList}>
                {data.audience.sources.map((s) => (
                  <Bar key={s.source} label={s.source} value={`${s.visits.toLocaleString('fr-FR')} · ${s.percent} %`} percent={s.percent} />
                ))}
              </ol>
            )}
            {data.audience.landings.length > 0 && (
              <span style={note}>
                Pages d’arrivée : {data.audience.landings.map((l) => `${pageLabel(l.path)} (${l.visits.toLocaleString('fr-FR')})`).join(', ')}.
              </span>
            )}
            <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>
              Pour savoir ce que rapporte un lien que vous partagez (annonce, réseau, email), ajoutez-y un nom : bailio.fr/?utm_source=leboncoin. Il apparaîtra ici sous ce nom.
            </span>
          </Card>

          <Card title={<h2 style={h2}>De l’accueil au bail</h2>}>
            <span style={note}>Pages vues ces 30 derniers jours, par rapport aux vues de l’accueil. C’est ici que l’on voit où les visiteurs s’arrêtent avant de laisser leur email.</span>
            <ol style={barList}>
              {data.audience.tunnel.map((t) => (
                <Bar key={t.path} label={t.label} value={`${t.views.toLocaleString('fr-FR')} · ${t.percent} %`} percent={t.percent} />
              ))}
            </ol>
          </Card>

          <h2 style={{ ...h2, marginTop: 8 }}>Propriétaires inscrits</h2>
          <div className="grid-3" style={{ gap: 16 }}>
            {data.totals.map((t) => (
              <Card key={t.key} pad={20}>
                <span style={display(40, { lineHeight: 1 })}>{t.value.toLocaleString('fr-FR')}</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{t.label}</span>
                <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>{t.hint}</span>
              </Card>
            ))}
          </div>

          <Card title={<h2 style={h2}>Du compte au premier loyer</h2>}>
            <span style={note}>Part des comptes qui ont franchi chaque étape. C’est ici que l’on voit où les propriétaires s’arrêtent.</span>
            <ol style={barList}>
              {data.funnel.map((f) => (
                <Bar key={f.label} label={f.label} value={`${f.users.toLocaleString('fr-FR')} · ${f.percent} %`} percent={f.percent} />
              ))}
            </ol>
          </Card>

          <Card title={<h2 style={h2}>Semaine par semaine</h2>}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 540 }}>
                <caption style={{ textAlign: 'left', fontSize: 14, color: BAI.inkMid, padding: '4px 0 8px' }}>Les 8 dernières semaines, du lundi au dimanche.</caption>
                <thead>
                  <tr style={{ textAlign: 'right', color: BAI.inkSoft }}>
                    <th scope="col" style={{ ...th, textAlign: 'left' }}>Semaine du</th>
                    <th scope="col" style={th}>Visites</th>
                    <th scope="col" style={th}>Inscriptions</th>
                    <th scope="col" style={th}>Baux signés</th>
                    <th scope="col" style={th}>Propriétaires venus</th>
                  </tr>
                </thead>
                <tbody>
                  {data.weeks.map((w) => (
                    <tr key={w.week} style={{ textAlign: 'right', borderTop: `1px solid ${BAI.dividerSoft}` }}>
                      <th scope="row" style={{ ...th, textAlign: 'left' }}>{dateNum(w.week)}</th>
                      <td style={td}>{data.audience.weeks.find((a) => a.week === w.week)?.visits ?? 0}</td>
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
