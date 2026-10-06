import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { ExpenseModal } from '../../components/ExpenseModal'
import { display } from '../../components/ui'
import { Btn, Card, LoadError, Loader, PageHead, Pill, TextLink, useLoad, useToast } from '../../components/kit'
import { api, downloadPdf, pdfUrl } from '../../lib/api'
import { MONTHS_SHORT_CAP, eurosCents, monthName } from '../../lib/format'
import type { Expense, MoneyView } from '../../lib/space'

/** Loyers encaissés et dépenses de l'année. Maquette « Argent ». */
export default function Argent() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data, error, loading, reload } = useLoad(() => api<MoneyView>(`/money?year=${year}`), [year])
  const [edit, setEdit] = useState<Expense | null>(null)
  const [open, setOpen] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const exportYear = async () => {
    try {
      downloadPdf(await pdfUrl(`/money/export?year=${year}`), `bailio-${year}.csv`)
    } catch (e) {
      toast.error(e)
    }
  }

  return (
    <AppShell>
      <PageHead
        title="Argent"
        sub={
          <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            Loyers encaissés et dépenses de vos logements, année
            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
              <YearButton label="Année précédente" onClick={() => setYear(year - 1)}>
                ‹
              </YearButton>
              <strong>{year}</strong>
              <YearButton label="Année suivante" onClick={() => setYear(year + 1)} disabled={year >= new Date().getFullYear()}>
                ›
              </YearButton>
            </span>
          </span>
        }
        actions={
          <Btn
            onClick={() => {
              setEdit(null)
              setOpen(true)
            }}
          >
            Ajouter une dépense
          </Btn>
        }
      />
      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : (
        <>
          <div className="grid-3" style={{ gap: 20 }}>
            <Total label="Loyers encaissés" value={eurosCents(data.incomeCents)} />
            <Total label="Dépenses" value={eurosCents(data.expensesCents)} />
            <Total label="Reste" value={eurosCents(data.netCents)} dark />
          </div>
          <nav aria-label="Outils" className="grid-4" style={{ gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {[
              { to: '/espace/argent/releve', title: 'Relevé bancaire', text: 'Retrouver les loyers reçus' },
              { to: '/espace/argent/declaration', title: 'Déclaration', text: 'Les montants à déclarer' },
              { to: '/espace/argent/bilan', title: 'Bilan', text: 'Résultat par logement' },
              { to: '/espace/argent/repartir', title: 'Répartir', text: 'Une dépense de l’immeuble' },
            ].map((t) => (
              <Link key={t.to} to={t.to} style={{ textDecoration: 'none', color: BAI.ink, background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: BAI.owner }}>{t.title}</span>
                <span style={{ fontSize: 13, color: BAI.inkMid }}>{t.text}</span>
              </Link>
            ))}
            <button type="button" onClick={() => void exportYear()} style={{ textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', color: BAI.ink, background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: BAI.owner }}>Exporter l’année</span>
              <span style={{ fontSize: 13, color: BAI.inkMid }}>Tableau pour votre comptable</span>
            </button>
          </nav>
          <div className="split-aside" style={{ gap: 24 }}>
            <Card title="Loyers encaissés par mois" style={{ flex: '1 1 0', gap: 18 }}>
              <Chart data={data} />
              <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{explain(data)}</span>
            </Card>
            <Expenses
              data={data}
              onOpen={async (e) => {
                if (e.status === 'TO_VERIFY') return navigate(`/espace/argent/factures/${e.id}`)
                setEdit(e)
                setOpen(true)
              }}
            />
          </div>
        </>
      )}
      <ExpenseModal open={open} onClose={() => setOpen(false)} onSaved={reload} expense={edit} />
    </AppShell>
  )
}

function YearButton({ children, onClick, label, disabled }: { children: string; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled} style={{ width: 30, height: 30, borderRadius: 15, border: `1px solid ${BAI.border}`, background: BAI.surface, color: BAI.ink, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, fontSize: 18, lineHeight: 1 }}>
      {children}
    </button>
  )
}

function Total({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div style={{ background: dark ? BAI.night : BAI.surface, border: dark ? 'none' : `1px solid ${BAI.divider}`, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 14, color: dark ? BAI.onDarkMuted : BAI.inkSoft }}>{label}</span>
      <span style={display('clamp(34px, 4vw, 44px)', { color: dark ? BAI.caramel : BAI.ink })}>{value}</span>
    </div>
  )
}

function Chart({ data }: { data: MoneyView }) {
  const max = Math.max(1, ...data.byMonth.map((m) => Math.max(m.receivedCents, m.expectedCents)))
  return (
    <div>
      <div role="img" aria-label="Loyers encaissés par mois" style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 'clamp(4px, 1.2vw, 14px)', borderBottom: `1px solid ${BAI.divider}` }}>
        {data.byMonth.map((m) => {
          const h = m.receivedCents ? Math.max(6, Math.round((m.receivedCents / max) * 160)) : 4
          return <div key={m.month} title={`${monthName(m.month, true)} : ${eurosCents(m.receivedCents)}`} style={{ flex: '1 1 0', height: h, background: m.receivedCents ? BAI.owner : BAI.border, borderRadius: m.receivedCents ? '6px 6px 0 0' : 0 }} />
        })}
      </div>
      <div style={{ display: 'flex', gap: 'clamp(4px, 1.2vw, 14px)', fontSize: 12, color: BAI.inkSoft, textAlign: 'center', paddingTop: 8 }}>
        {MONTHS_SHORT_CAP.map((m) => (
          <span key={m} style={{ flex: '1 1 0', overflow: 'hidden' }}>
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Une phrase simple sur les mois où il manque des loyers. */
function explain(d: MoneyView): string {
  const now = new Date()
  const past = d.byMonth.filter((m) => d.year < now.getFullYear() || m.month <= now.getMonth() + 1)
  const short = past.filter((m) => m.expectedCents > 0 && m.receivedCents < m.expectedCents)
  if (!past.some((m) => m.expectedCents > 0)) return 'Les loyers encaissés apparaîtront ici, mois par mois.'
  if (!short.length) return 'Tous les loyers attendus ont été encaissés.'
  const names = short.map((m) => monthName(m.month))
  const missing = short.reduce((a, m) => a + m.expectedCents - m.receivedCents, 0)
  return `${names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}` : names[0]} : ${eurosCents(missing)} de loyers attendus ne sont pas encore enregistrés.`
}

function Expenses({ data, onOpen }: { data: MoneyView; onOpen: (e: Expense) => void }) {
  const [all, setAll] = useState(false)
  const list = all ? data.expenses : data.expenses.slice(0, 5)
  return (
    <Card title="Dernières dépenses" style={{ width: '100%', maxWidth: 420, flexShrink: 0 }} action={<TextLink to="/espace/argent/facture" style={{ fontSize: 14 }}>Facture en photo</TextLink>}>
      {list.length ? (
        list.map((e) => (
          <button key={e.id} type="button" onClick={() => onOpen(e)} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '12px 0 0', borderTop: `1px solid ${BAI.dividerSoft}`, background: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', color: BAI.ink }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{e.description || e.vendor}</span>
              <span style={{ fontSize: 13, color: BAI.inkSoft }}>
                {[e.propertyName, e.recoverableCents ? `dont ${eurosCents(e.recoverableCents)} récupérables` : e.categoryLabel].filter(Boolean).join(' · ')}
              </span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{eurosCents(e.amountCents)}</span>
              {e.status === 'TO_VERIFY' ? <Pill tone="green">À vérifier</Pill> : null}
            </span>
          </button>
        ))
      ) : (
        <span style={{ fontSize: 15, color: BAI.inkMid }}>Aucune dépense cette année.</span>
      )}
      {data.expenses.length > 5 ? (
        <TextLink onClick={() => setAll(!all)} style={{ fontSize: 14 }}>
          {all ? 'Voir moins' : 'Voir toutes les dépenses'}
        </TextLink>
      ) : null}
    </Card>
  )
}
