import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Card, Crumbs, Line, LoadError, Loader, Pill, TextLink, useLoad } from '../../components/kit'
import { display } from '../../components/ui'
import { api } from '../../lib/api'
import { eurosCents } from '../../lib/format'

interface Alert {
  kind: string
  propertyId: string
  title: string
  text: string
  level: 1 | 2 | 3
}
interface Row {
  id: string
  name: string
  structureName: string | null
  rented: boolean
  tenantName: string | null
  rentCents: number
  chargesCents: number
  netCents: number
  alertCount: number
}
interface PortfolioView {
  totals: { properties: number; rented: number; monthlyRentCents: number; monthlyLoanCents: number; monthlyExpensesCents: number; monthlyNetCents: number; unpaidCents: number; grossYield: number | null }
  alerts: Alert[]
  rows: Row[]
}

const SHOWN = 3

/**
 * Tableau de bord de tous les logements (server/src/domain/portfolio.ts) : l'essentiel du mois, puis ce qui demande
 * votre attention (trois points d'abord), puis chaque logement en une ligne.
 */
export default function Patrimoine() {
  const { data, error, reload } = useLoad(() => api<PortfolioView>('/portfolio'))
  const [all, setAll] = useState(false)
  if (error) return <AppShell><LoadError message={error} retry={reload} /></AppShell>
  if (!data) return <AppShell><Loader /></AppShell>
  const t = data.totals
  const names = Object.fromEntries(data.rows.map((r) => [r.id, r.name]))
  const alerts = all ? data.alerts : data.alerts.slice(0, SHOWN)
  return (
    <AppShell>
      <Crumbs items={[{ label: 'Logements', to: '/espace/logements' }, { label: 'Tableau de bord' }]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(34px, 5vw, 48px)')}>Tableau de bord</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>
          {t.properties} logement{t.properties > 1 ? 's' : ''}, dont {t.rented} loué{t.rented > 1 ? 's' : ''}. Chaque mois, avant impôt.
        </span>
      </div>

      <Card dark title="Chaque mois" style={{ gap: 12 }}>
        <Line dark label="Loyers et charges attendus" value={eurosCents(t.monthlyRentCents)} />
        {t.monthlyLoanCents ? <Line dark label="Crédits et assurances" value={`- ${eurosCents(t.monthlyLoanCents)}`} /> : null}
        {t.monthlyExpensesCents ? <Line dark label="Dépenses (moyenne sur 12 mois)" value={`- ${eurosCents(t.monthlyExpensesCents)}`} /> : null}
        <Line dark strong border label={t.monthlyNetCents >= 0 ? 'Il vous reste' : 'Vous ajoutez de votre poche'} value={eurosCents(Math.abs(t.monthlyNetCents))} />
        {t.grossYield !== null ? <span style={{ fontSize: 13, color: BAI.surface }}>Rendement brut des logements loués : {t.grossYield.toLocaleString('fr-FR')} % par an.</span> : null}
      </Card>

      <Card title={<h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>À surveiller</h2>}>
        {data.alerts.length ? (
          <>
            {alerts.map((a, i) => (
              <Link key={`${a.propertyId}-${a.kind}-${i}`} to={`/espace/logements/${a.propertyId}`} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 0 0', borderTop: i ? `1px solid ${BAI.dividerSoft}` : 'none', textDecoration: 'none', color: BAI.ink }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{a.title}</span>
                  <Pill tone={a.level === 1 ? 'error' : a.level === 2 ? 'caramel' : 'owner'}>{names[a.propertyId]}</Pill>
                </span>
                <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.45 }}>{a.text}</span>
              </Link>
            ))}
            {data.alerts.length > SHOWN ? (
              <TextLink onClick={() => setAll(!all)} style={{ fontSize: 15, alignSelf: 'flex-start' }}>
                {all ? 'Voir moins' : `Voir les ${data.alerts.length - SHOWN} autres`}
              </TextLink>
            ) : null}
          </>
        ) : (
          <span style={{ fontSize: 15, color: BAI.inkMid }}>Rien à signaler : loyers à jour, diagnostics valables, aucun bail à échéance proche.</span>
        )}
      </Card>

      <Card title={<h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>Vos logements</h2>}>
        {data.rows.map((r, i) => (
          <Link key={r.id} to={`/espace/logements/${r.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0 0', borderTop: i ? `1px solid ${BAI.dividerSoft}` : 'none', textDecoration: 'none', color: BAI.ink }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{r.name}</span>
              <span style={{ fontSize: 13, color: BAI.inkSoft }}>{[r.rented ? (r.tenantName ? `Loué à ${r.tenantName}` : 'Loué') : 'Libre', r.structureName].filter(Boolean).join(' · ')}</span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
              {r.rented ? <span style={{ fontSize: 15, fontWeight: 700 }}>{eurosCents(r.rentCents + r.chargesCents)} / mois</span> : null}
              {r.rented || r.netCents < 0 ? <span style={{ fontSize: 13, color: r.netCents < 0 ? BAI.error : BAI.inkSoft }}>{r.netCents >= 0 ? `reste ${eurosCents(r.netCents)}` : `coûte ${eurosCents(-r.netCents)} par mois`}</span> : null}
            </span>
          </Link>
        ))}
      </Card>
    </AppShell>
  )
}
