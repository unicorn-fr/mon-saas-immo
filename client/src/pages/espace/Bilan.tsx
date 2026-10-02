import { useRef, useState } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { display } from '../../components/ui'
import { Card, Chips, Crumbs, LoadError, Loader, Money, TextLink, useLoad, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { eurosCents } from '../../lib/format'

interface Report {
  id: string
  name: string
  rentCents: number
  chargesCents: number
  expensesCents: number
  byCategory: Record<string, number>
  netCents: number
  occupiedMonths: number
  unpaidCents: number
  grossYield: number | null
  forecast: { year: number; rentCents: number; chargesCents: number; expensesCents: number; netCents: number }
}
interface ReportView {
  year: number
  properties: Report[]
  purchases: Record<string, { priceCents?: number | null; date?: string | null } | null>
}

const CATEGORY: Record<string, string> = { REPAIR: 'Réparations', MAINTENANCE: 'Entretien', TAX: 'Taxe foncière et impôts', COPRO: 'Copropriété', INSURANCE: 'Assurance', OTHER: 'Autres' }
const thisYear = new Date().getFullYear()

/** Bilan de l'année et prévision de la suivante, logement par logement. */
export default function Bilan() {
  const [year, setYear] = useState(thisYear)
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api<ReportView>(`/money/report?year=${year}`), [year])
  const timers = useRef<Record<string, number>>({})
  const savePrice = (id: string, priceCents: number | null) => {
    window.clearTimeout(timers.current[id])
    timers.current[id] = window.setTimeout(() => {
      api(`/properties/${id}/purchase`, { method: 'PUT', body: { priceCents } })
        .then(() => reload())
        .catch((e) => toast.error(e))
    }, 700)
  }
  const total = (f: (r: Report) => number) => (data?.properties ?? []).reduce((a, r) => a + f(r), 0)

  return (
    <AppShell>
      <Crumbs items={[{ label: 'Argent', to: '/espace/argent' }, { label: 'Bilan' }]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(34px, 5vw, 48px)')}>Bilan de vos logements</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid }}>Ce que chaque logement vous a rapporté, et ce qu’il devrait rapporter l’an prochain.</span>
      </div>
      <Chips legend="Année" value={year} onChange={setYear} options={[thisYear - 2, thisYear - 1, thisYear].map((y) => ({ value: y, label: String(y) }))} />
      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : !data.properties.length ? (
        <Card>
          <span style={{ fontSize: 17, fontWeight: 600 }}>Aucun logement pour l’instant.</span>
          <TextLink to="/espace/logements/nouveau">Ajouter un logement</TextLink>
        </Card>
      ) : (
        <>
          <div className="grid-3" style={{ gap: 14 }}>
            <Stat label={`Encaissé en ${year}`} value={eurosCents(total((r) => r.rentCents + r.chargesCents))} />
            <Stat label="Dépenses payées" value={eurosCents(total((r) => r.rentCents + r.chargesCents - r.netCents))} />
            <Stat label="Résultat" value={eurosCents(total((r) => r.netCents))} strong />
          </div>
          {data.properties.map((r) => (
            <Card key={r.id} title={r.name}>
              <div className="split-aside" style={{ gap: 24 }}>
                <div className="grow" style={{ gap: 8 }}>
                  <Row label="Loyers encaissés (hors charges)" value={eurosCents(r.rentCents)} />
                  <Row label="Charges encaissées" value={eurosCents(r.chargesCents)} />
                  {Object.entries(r.byCategory).map(([k, v]) => (
                    <Row key={k} label={CATEGORY[k] ?? k} value={`- ${eurosCents(v)}`} />
                  ))}
                  <Row label="Résultat de l’année" value={eurosCents(r.netCents)} strong />
                  <span style={{ fontSize: 14, color: BAI.inkSoft }}>
                    Loué {r.occupiedMonths} mois sur 12
                    {r.unpaidCents ? ` · ${eurosCents(r.unpaidCents)} de loyers attendus non reçus` : ''}
                  </span>
                </div>
                <div className="aside" style={{ width: 340, gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Prévision {r.forecast.year}</span>
                  <Row label="Loyers attendus" value={eurosCents(r.forecast.rentCents)} />
                  <Row label="Dépenses (comme cette année)" value={`- ${eurosCents(r.forecast.expensesCents)}`} />
                  <Row label="Résultat prévu" value={eurosCents(r.forecast.netCents)} strong />
                  <Money label="Prix d’achat du logement" cents={data.purchases[r.id]?.priceCents ?? null} onChange={(c) => savePrice(r.id, c)} hint={r.grossYield !== null ? `Rendement brut : ${String(r.grossYield).replace('.', ',')} % par an.` : 'Facultatif : pour calculer le rendement brut.'} />
                </div>
              </div>
            </Card>
          ))}
          <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>Sommes encaissées et payées dans l’année. La prévision suppose que les baux en cours continuent et que les dépenses restent les mêmes. Pour la déclaration d’impôts, utilisez la page « Déclaration de revenus ».</span>
        </>
      )}
    </AppShell>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15, fontWeight: strong ? 700 : 400, borderTop: strong ? `1px solid ${BAI.divider}` : 'none', paddingTop: strong ? 8 : 0 }}>
      <span style={{ color: strong ? BAI.ink : BAI.inkMid }}>{label}</span>
      <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ background: strong ? BAI.night : BAI.surface, color: strong ? BAI.surface : BAI.ink, border: `1px solid ${BAI.divider}`, borderRadius: 18, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 14, color: strong ? BAI.onDark : BAI.inkSoft }}>{label}</span>
      <span style={{ fontSize: 24, fontWeight: 700 }}>{value}</span>
    </div>
  )
}
