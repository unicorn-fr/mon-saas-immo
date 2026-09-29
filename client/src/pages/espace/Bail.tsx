import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { EspaceLayout } from '../../components/EspaceLayout'
import { Button, Notice, Spinner, display, inputStyle, overline } from '../../components/ui'
import { api, ApiError, downloadPdf, openPdfFrom, pdfUrl, printPdf } from '../../lib/api'
import { dateFr, euros, typeLabel } from '../../lib/lease'
import type { LeaseDetails, ReminderType } from '../../lib/types'

const LABELS: Record<ReminderType, string> = {
  RENT_RECEIPT: 'Loyer et quittance',
  INSURANCE: "Attestation d'assurance",
  RENT_REVISION: 'Révision du loyer',
  LEASE_END: 'Fin du bail : date pour décider',
  INVENTORY_ENTRY: "État des lieux d'entrée",
}

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="stack" style={{ gap: 2, padding: '14px 0', borderTop: `1px solid ${BAI.dividerSoft}` }}>
      <span style={{ fontSize: 13, color: BAI.inkSoft }}>{label}</span>
      <span style={{ fontSize: 17, fontWeight: 600 }}>{value}</span>
    </div>
  )
}

export default function Bail() {
  const { id } = useParams()
  const [lease, setLease] = useState<LeaseDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const now = new Date()
  const [period, setPeriod] = useState(`${now.getFullYear()}-${now.getMonth() + 1}`)

  useEffect(() => {
    api<LeaseDetails>(`/leases/${id}`)
      .then(setLease)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Bail introuvable.'))
  }, [id])

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Document indisponible.')
    } finally {
      setBusy(null)
    }
  }

  if (!lease) return <EspaceLayout>{error ? <Notice tone="warning">{error}</Notice> : <Spinner size={28} />}</EspaceLayout>

  const leasePdf = () => pdfUrl(`/leases/${lease.id}/lease.pdf`)
  // Mois proposés : du mois prochain aux 12 derniers, jamais avant l'entrée du locataire.
  const periods = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1 - i, 1)
    return { value: `${d.getFullYear()}-${d.getMonth() + 1}`, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, end: new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0)) }
  }).filter((p) => p.end >= new Date(lease.startDate))
  const selected = periods.some((p) => p.value === period) ? period : (periods[0]?.value ?? period)
  const [py, pm] = selected.split('-').map(Number)

  return (
    <EspaceLayout>
      <div className="stack" style={{ gap: 40 }}>
        <div className="stack" style={{ gap: 8 }}>
          <Link to="/espace" style={{ fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>← Aujourd'hui</Link>
          <h1 style={display('clamp(34px, 4.5vw, 48px)')}>{lease.property.address}</h1>
          <p style={{ margin: 0, fontSize: 17, color: BAI.inkMid }}>
            {typeLabel(lease.type)}{lease.status === 'IMPORTED' ? ' · bail signé importé' : ''}
          </p>
        </div>

        <section className="grid-2" style={{ gap: '0 32px' }} aria-label="Le bail">
          <Fact label={lease.tenants.length > 1 ? 'Locataires' : 'Locataire'} value={lease.tenants.map((t) => `${t.firstName} ${t.lastName}`).join(', ')} />
          <Fact label="Loyer" value={`${euros(lease.rentCents)} + ${euros(lease.chargesCents)} de charges`} />
          <Fact label="Début du bail" value={dateFr(lease.startDate)} />
          <Fact label="Fin de la période en cours" value={dateFr(lease.endDate)} />
          <Fact label="Dépôt de garantie" value={euros(lease.depositCents)} />
          <Fact label="Paiement" value={`Le ${lease.paymentDay} de chaque mois`} />
          {lease.guarantor ? <Fact label="Garant" value={`${lease.guarantor.firstName} ${lease.guarantor.lastName}`} /> : null}
          {lease.property.dpeClass ? <Fact label="Classe énergie" value={`Classe ${lease.property.dpeClass}`} /> : null}
        </section>

        <section className="stack" style={{ gap: 14 }}>
          <h2 style={{ ...overline, margin: 0 }}>Le bail</h2>
          <div className="col-md" style={{ display: 'flex', gap: 12 }}>
            <Button height={52} loading={busy === 'print'} onClick={() => void run('print', async () => printPdf(await leasePdf()))}>Imprimer</Button>
            <Button height={52} variant="outline" loading={busy === 'open'} onClick={() => void run('open', () => openPdfFrom(leasePdf))}>Ouvrir</Button>
            <Button height={52} variant="outline" loading={busy === 'dl'} onClick={() => void run('dl', async () => downloadPdf(await leasePdf(), 'bail.pdf'))}>Télécharger</Button>
          </div>
        </section>

        <section className="stack" style={{ gap: 14 }}>
          <h2 style={{ ...overline, margin: 0 }}>Quittances</h2>
          <div className="col-md" style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div className="stack" style={{ gap: 8, flex: 1, maxWidth: 320 }}>
              <label htmlFor="period" style={{ fontSize: 15, fontWeight: 600 }}>Mois</label>
              <select id="period" value={selected} onChange={(e) => setPeriod(e.target.value)} style={{ ...inputStyle(), height: 52, fontSize: 16, appearance: 'auto' }}>
                {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <Button height={52} loading={busy === 'q'} onClick={() => void run('q', async () => downloadPdf(await pdfUrl(`/leases/${lease.id}/receipts/${py}/${pm}.pdf`), `quittance-${py}-${String(pm).padStart(2, '0')}.pdf`))}>
              Télécharger la quittance
            </Button>
          </div>
          <span style={{ fontSize: 14, color: BAI.inkSoft }}>Une quittance ne se donne que pour un loyer payé en entier. Elle est gratuite pour le locataire.</span>
        </section>

        {lease.reminders.length ? (
          <section className="stack" style={{ gap: 12 }}>
            <h2 style={{ ...overline, margin: 0 }}>Prochaines échéances</h2>
            <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {lease.reminders.map((r) => (
                <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderTop: `1px solid ${BAI.dividerSoft}`, fontSize: 15 }}>
                  <span>{LABELS[r.type]}</span>
                  <span style={{ color: BAI.inkSoft, whiteSpace: 'nowrap' }}>{dateFr(r.dueDate)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {error ? <Notice tone="warning">{error}</Notice> : null}
      </div>
    </EspaceLayout>
  )
}
