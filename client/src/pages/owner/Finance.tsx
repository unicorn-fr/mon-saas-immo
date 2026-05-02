import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { useFinanceStore } from '../../store/financeStore'
import { usePropertyStore } from '../../store/propertyStore'
import {
  EXPENSE_CATEGORY_LABELS,
  ExpenseCategory,
  CreateExpenseInput,
} from '../../types/finance.types'
import { apiClient } from '../../services/api.service'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  PlusCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  Building2,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Search,
  ExternalLink,
} from 'lucide-react'
import { financeService, MarketAnalysis } from '../../services/finance.service'

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
  '05': 'Mai', '06': 'Juin', '07': 'Juil', '08': 'Aoû',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
}

function formatMonth(m: string): string {
  const [year, month] = m.split('-')
  return `${MONTH_LABELS[month] ?? month} ${year.slice(2)}`
}

function formatEuro(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

// ── Tax regime advisor ────────────────────────────────────────────────────────

interface TaxAdvice {
  regime: string
  color: string
  description: string
  link: boolean
}

function getTaxAdvice(totalRevenue: number, isFurnished: boolean): TaxAdvice {
  if (isFurnished) {
    if (totalRevenue < 77700) {
      return {
        regime: 'LMNP Micro-BIC',
        color: BAI.owner,
        description: `Vos revenus meublés (${formatEuro(totalRevenue)}) sont sous le seuil de 77 700 €/an. Le régime micro-BIC avec abattement forfaitaire de 50 % est recommandé.`,
        link: true,
      }
    }
    return {
      regime: 'LMNP Réel',
      color: BAI.caramel,
      description: `Au-delà de 77 700 €/an, le régime réel LMNP vous permet de déduire toutes vos charges réelles et amortissements.`,
      link: true,
    }
  }
  if (totalRevenue < 15000) {
    return {
      regime: 'Micro-foncier',
      color: BAI.owner,
      description: `Vos revenus fonciers (${formatEuro(totalRevenue)}) sont sous le seuil de 15 000 €/an. Le micro-foncier avec abattement de 30 % simplifie votre déclaration.`,
      link: false,
    }
  }
  return {
    regime: 'Régime réel',
    color: BAI.caramel,
    description: `Au-delà de 15 000 €/an, le régime réel vous permet de déduire toutes vos charges (travaux, intérêts d'emprunt, taxes...) pour optimiser votre imposition.`,
    link: true,
  }
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: `1px solid ${BAI.border}`,
  background: BAI.bgMuted,
  fontFamily: BAI.fontBody,
  fontSize: 14,
  color: BAI.ink,
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontFamily: BAI.fontBody,
  fontSize: 12,
  fontWeight: 600,
  color: BAI.inkMid,
  display: 'block',
  marginBottom: 4,
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string
  value: string
  sub?: string
  positive?: boolean
}) {
  const valueColor =
    positive === false ? BAI.error : positive === true ? BAI.tenant : BAI.ink

  return (
    <div
      style={{
        background: BAI.bgSurface,
        border: `1px solid ${BAI.border}`,
        borderRadius: 12,
        padding: '20px 24px',
        flex: 1,
        minWidth: 180,
      }}
    >
      <p
        style={{
          fontFamily: BAI.fontBody,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: BAI.inkFaint,
          margin: '0 0 8px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: BAI.fontDisplay,
          fontSize: 28,
          fontWeight: 700,
          fontStyle: 'italic',
          color: valueColor,
          margin: 0,
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{
            fontFamily: BAI.fontBody,
            fontSize: 12,
            color: BAI.inkFaint,
            margin: '4px 0 0',
          }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ActiveTab = 'summary' | 'expenses' | 'loans' | 'market'

const INITIAL_EXPENSE_FORM: CreateExpenseInput = {
  propertyId: '',
  category: 'AUTRE',
  description: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
}

interface LoanFormState {
  propertyId: string
  bankName: string
  totalAmount: number
  monthlyPayment: number
  interestRate: number
  durationMonths: number
  startDate: string
}

const INITIAL_LOAN_FORM: LoanFormState = {
  propertyId: '',
  bankName: '',
  totalAmount: 0,
  monthlyPayment: 0,
  interestRate: 0,
  durationMonths: 240,
  startDate: '',
}

export default function Finance() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showLoanForm, setShowLoanForm] = useState<string | null>(null)
  const [citySearch, setCitySearch] = useState('')
  const [cityResult, setCityResult] = useState<{ city: string; avgRentM2: number; minRentM2: number; maxRentM2: number; encadrement: boolean; label: string; sourceUrl?: string; sourceName?: string } | null>(null)
  const [citySearchLoading, setCitySearchLoading] = useState(false)
  const [citySearchTimer, setCitySearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [citySuggestions, setCitySuggestions] = useState<Array<{ label: string; city: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [expenseForm, setExpenseForm] = useState<CreateExpenseInput>(INITIAL_EXPENSE_FORM)
  const [loanForm, setLoanForm] = useState<LoanFormState>(INITIAL_LOAN_FORM)
  const [marketAnalyses, setMarketAnalyses] = useState<Record<string, MarketAnalysis>>({})
  const [marketLoading, setMarketLoading] = useState(false)

  const {
    summary,
    expenses,
    loans,
    isLoading,
    fetchSummary,
    fetchExpenses,
    fetchLoans,
    createExpense,
    deleteExpense,
    saveLoan,
  } = useFinanceStore()

  const { myProperties, fetchMyProperties } = usePropertyStore()

  useEffect(() => {
    fetchSummary()
    fetchExpenses()
    fetchLoans()
    fetchMyProperties()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTab !== 'market' || myProperties.length === 0) return
    const toFetch = myProperties.filter((p) => !marketAnalyses[p.id])
    if (toFetch.length === 0) return
    setMarketLoading(true)
    Promise.allSettled(
      toFetch.map((p) => financeService.getMarketAnalysis(p.id).then((a) => ({ id: p.id, a })))
    ).then((results) => {
      const next: Record<string, MarketAnalysis> = { ...marketAnalyses }
      results.forEach((r) => { if (r.status === 'fulfilled') next[r.value.id] = r.value.a })
      setMarketAnalyses(next)
      setMarketLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, myProperties])

  async function fetchMarketForCity(cityName: string, label: string) {
    setCitySearchLoading(true)
    setShowSuggestions(false)
    try {
      const res = await apiClient.get<{ success: boolean; data: { market: { avgRentM2: number; minRentM2: number; maxRentM2: number; encadrement: boolean; label: string; sourceUrl?: string; sourceName?: string } | null } }>(
        `/finances/city-market?city=${encodeURIComponent(cityName)}`
      )
      if (res.data.data.market) setCityResult({ city: cityName, ...res.data.data.market, label: res.data.data.market.label || label })
      else setCityResult(null)
    } catch { setCityResult(null) }
    finally { setCitySearchLoading(false) }
  }

  function handleCitySearch(val: string) {
    setCitySearch(val)
    setCityResult(null)
    setCitySuggestions([])
    if (citySearchTimer) clearTimeout(citySearchTimer)
    if (!val.trim() || val.trim().length < 2) { setShowSuggestions(false); return }
    const t = setTimeout(async () => {
      try {
        // BAN API: autocomplete all French communes
        const banRes = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(val.trim())}&type=municipality&limit=6&autocomplete=1`
        )
        const banData = await banRes.json() as {
          features?: Array<{ properties?: { label?: string; city?: string; name?: string; postcode?: string } }>
        }
        const suggestions = (banData.features ?? []).map(f => ({
          label: [f.properties?.label ?? f.properties?.city ?? f.properties?.name, f.properties?.postcode].filter(Boolean).join(' '),
          city: f.properties?.city ?? f.properties?.name ?? '',
        })).filter(s => s.city)
        setCitySuggestions(suggestions)
        setShowSuggestions(suggestions.length > 0)
      } catch { /* silent */ }
    }, 250)
    setCitySearchTimer(t)
  }

  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createExpense(expenseForm)
      setShowExpenseForm(false)
      setExpenseForm(INITIAL_EXPENSE_FORM)
      fetchSummary()
    } catch {
      // toast shown in store
    }
  }

  async function handleSaveLoan(e: React.FormEvent) {
    e.preventDefault()
    try {
      await saveLoan({
        ...loanForm,
        totalAmount: Number(loanForm.totalAmount),
        monthlyPayment: Number(loanForm.monthlyPayment),
        interestRate: Number(loanForm.interestRate),
        durationMonths: Number(loanForm.durationMonths),
      })
      setShowLoanForm(null)
    } catch {
      // toast shown in store
    }
  }

  const taxAdvice = summary ? getTaxAdvice(summary.totalRevenue, false) : null

  const chartData = (summary?.cashFlowByMonth ?? []).map((m) => ({
    name: formatMonth(m.month),
    Revenus: Math.round(m.revenue),
    Dépenses: Math.round(m.expenses),
    Net: Math.round(m.net),
  }))

  function TabPill({ id, label }: { id: ActiveTab; label: string }) {
    const active = activeTab === id
    return (
      <button
        onClick={() => setActiveTab(id)}
        style={{
          fontFamily: BAI.fontBody,
          fontSize: 13,
          fontWeight: 600,
          padding: '8px 20px',
          borderRadius: 999,
          border: active ? 'none' : `1px solid ${BAI.border}`,
          background: active ? BAI.night : 'transparent',
          color: active ? '#fff' : BAI.inkMid,
          cursor: 'pointer',
          transition: 'all 0.15s',
          minHeight: 44,
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,4vw,32px) clamp(16px,3vw,20px)' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontFamily: BAI.fontBody,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: BAI.caramel,
              margin: '0 0 6px',
            }}
          >
            Propriétaire
          </p>
          <h1
            style={{
              fontFamily: BAI.fontDisplay,
              fontSize: 'clamp(28px,5vw,38px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: BAI.ink,
              margin: 0,
            }}
          >
            Finances
          </h1>
          <p
            style={{
              fontFamily: BAI.fontBody,
              fontSize: 14,
              color: BAI.inkMid,
              margin: '8px 0 0',
            }}
          >
            Suivi de vos revenus, dépenses et rentabilité
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          <TabPill id="summary" label="Résumé & Graphiques" />
          <TabPill id="expenses" label="Dépenses" />
          <TabPill id="loans" label="Emprunts" />
          <TabPill id="market" label="Marché & Loyers" />
        </div>

        {/* ── TAB: SUMMARY ── */}
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* KPIs row 1 */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <KpiCard
                label="Revenus 12 mois"
                value={summary ? formatEuro(summary.totalRevenue) : '—'}
                sub="Loyers encaissés"
                positive={true}
              />
              <KpiCard
                label="Dépenses 12 mois"
                value={summary ? formatEuro(summary.totalExpenses) : '—'}
                sub="Charges & travaux"
                positive={false}
              />
              <KpiCard
                label="Cash-flow net annuel"
                value={summary ? formatEuro(summary.netCashFlow) : '—'}
                sub={summary ? (summary.netCashFlow >= 0 ? '✓ Rentabilité positive' : '⚠ Déficit à surveiller') : undefined}
                positive={summary ? summary.netCashFlow >= 0 : undefined}
              />
              <KpiCard
                label="Taux d'occupation"
                value={summary ? `${summary.occupancyRate}%` : '—'}
                sub={summary ? (summary.occupancyRate >= 90 ? '✓ Excellent' : summary.occupancyRate >= 70 ? 'Correct' : '⚠ Vacance élevée') : undefined}
                positive={summary ? summary.occupancyRate >= 80 : undefined}
              />
            </div>

            {/* KPIs row 2 — rendements */}
            {summary && myProperties.length > 0 && (() => {
              const totalRentAnnual = summary.totalRevenue
              const totalLoanAnnual = summary.totalLoanMonthly * 12
              const grossYield = myProperties.reduce((acc, p) => acc + p.price, 0) > 0
                ? ((totalRentAnnual / myProperties.reduce((acc, p) => acc + p.price, 0)) * 100)
                : 0
              const netYield = myProperties.reduce((acc, p) => acc + p.price, 0) > 0
                ? (((totalRentAnnual - summary.totalExpenses - totalLoanAnnual) / myProperties.reduce((acc, p) => acc + p.price, 0)) * 100)
                : 0
              const monthlyLoanCover = summary.totalLoanMonthly > 0
                ? ((summary.totalRevenue / 12) / summary.totalLoanMonthly * 100)
                : null
              return (
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <KpiCard
                    label="Rendement brut"
                    value={grossYield > 0 ? `${grossYield.toFixed(2)}%` : '—'}
                    sub="Loyers / valeur du parc"
                    positive={grossYield >= 4}
                  />
                  <KpiCard
                    label="Rendement net"
                    value={netYield > 0 ? `${netYield.toFixed(2)}%` : '—'}
                    sub="Après charges & emprunts"
                    positive={netYield >= 2}
                  />
                  <KpiCard
                    label="Remboursement / mois"
                    value={formatEuro(summary.totalLoanMonthly)}
                    sub="Total emprunts actifs"
                  />
                  {monthlyLoanCover !== null && (
                    <KpiCard
                      label="Couverture emprunt"
                      value={`${Math.round(monthlyLoanCover)}%`}
                      sub="Loyers / mensualités"
                      positive={monthlyLoanCover >= 110}
                    />
                  )}
                </div>
              )
            })()}

            {/* Area chart */}
            <div
              style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 12,
                padding: 24,
              }}
            >
              <p
                style={{
                  fontFamily: BAI.fontBody,
                  fontSize: 13,
                  fontWeight: 700,
                  color: BAI.ink,
                  margin: '0 0 20px',
                  letterSpacing: '0.02em',
                }}
              >
                Flux financiers — 12 derniers mois
              </p>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BAI.owner} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={BAI.owner} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BAI.caramel} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={BAI.caramel} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={BAI.border} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontFamily: BAI.fontBody, fontSize: 11, fill: BAI.inkFaint }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k€`}
                      tick={{ fontFamily: BAI.fontBody, fontSize: 11, fill: BAI.inkFaint }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        background: BAI.bgSurface,
                        border: `1px solid ${BAI.border}`,
                        borderRadius: 8,
                        fontFamily: BAI.fontBody,
                        fontSize: 12,
                      }}
                      formatter={(v: number | undefined) => v != null ? formatEuro(v) : ''}
                    />
                    <Legend
                      wrapperStyle={{ fontFamily: BAI.fontBody, fontSize: 12, paddingTop: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Revenus"
                      stroke={BAI.owner}
                      fill="url(#gradRevenue)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="Dépenses"
                      stroke={BAI.caramel}
                      fill="url(#gradExpenses)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    height: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: BAI.inkFaint,
                    fontFamily: BAI.fontBody,
                    fontSize: 14,
                  }}
                >
                  {isLoading ? 'Chargement...' : 'Aucune donnée disponible pour le moment'}
                </div>
              )}
            </div>

            {/* Bar chart: revenus vs dépenses par mois */}
            {chartData.length > 0 && (
              <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: 24 }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.ink, margin: '0 0 20px', letterSpacing: '0.02em' }}>
                  Revenus vs Dépenses — mensuel
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke={BAI.border} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontFamily: BAI.fontBody, fontSize: 11, fill: BAI.inkFaint }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k€`} tick={{ fontFamily: BAI.fontBody, fontSize: 11, fill: BAI.inkFaint }} axisLine={false} tickLine={false} width={45} />
                    <Tooltip
                      contentStyle={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 8, fontFamily: BAI.fontBody, fontSize: 12 }}
                      formatter={(v: number | undefined) => v != null ? formatEuro(v) : ''}
                    />
                    <Legend wrapperStyle={{ fontFamily: BAI.fontBody, fontSize: 12, paddingTop: 12 }} />
                    <Bar dataKey="Revenus" fill={BAI.owner} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Dépenses" fill={BAI.caramel} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tax advice + Market prices */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

              {/* Tax advice */}
              {taxAdvice && (
                <div
                  style={{
                    flex: 1,
                    minWidth: 280,
                    background: BAI.bgSurface,
                    border: `1px solid ${BAI.border}`,
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Info style={{ width: 16, height: 16, color: BAI.caramel }} />
                    <p
                      style={{
                        fontFamily: BAI.fontBody,
                        fontSize: 13,
                        fontWeight: 700,
                        color: BAI.ink,
                        margin: 0,
                      }}
                    >
                      Conseil fiscal
                    </p>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 12px',
                      borderRadius: 999,
                      background: `${taxAdvice.color}18`,
                      border: `1px solid ${taxAdvice.color}40`,
                      fontFamily: BAI.fontBody,
                      fontSize: 12,
                      fontWeight: 700,
                      color: taxAdvice.color,
                      marginBottom: 10,
                    }}
                  >
                    {taxAdvice.regime}
                  </span>
                  <p
                    style={{
                      fontFamily: BAI.fontBody,
                      fontSize: 13,
                      color: BAI.inkMid,
                      margin: '0 0 12px',
                      lineHeight: 1.5,
                    }}
                  >
                    {taxAdvice.description}
                  </p>
                  {taxAdvice.link && (
                    <a
                      href="/owner/rentabilite"
                      style={{
                        fontFamily: BAI.fontBody,
                        fontSize: 12,
                        color: BAI.caramel,
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      → Simuler ma rentabilité complète
                    </a>
                  )}
                </div>
              )}

              {/* Market prices */}
              <div
                style={{
                  flex: 1,
                  minWidth: 300,
                  background: BAI.bgSurface,
                  border: `1px solid ${BAI.border}`,
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Building2 style={{ width: 18, height: 18, color: BAI.caramel }} />
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 700, color: BAI.ink, margin: 0 }}>
                      Marché locatif
                    </p>
                  </div>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: BAI.ownerLight,
                    border: `1px solid ${BAI.ownerBorder}`,
                    fontFamily: BAI.fontBody,
                    fontSize: 10,
                    fontWeight: 700,
                    color: BAI.owner,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>
                    Données officielles
                  </span>
                </div>

                {/* Always-visible encadrement links */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  <a
                    href="https://www.encadrementdesloyers.gouv.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${BAI.ownerBorder}`, background: BAI.ownerLight, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.owner }}
                  >
                    <ExternalLink style={{ width: 12, height: 12 }} />
                    Vérifier l'encadrement des loyers
                  </a>
                  <a
                    href="https://www.anil.org/outils/simulateurs-en-ligne/estimer-votre-loyer/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgMuted, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid }}
                  >
                    <ExternalLink style={{ width: 12, height: 12 }} />
                    Simulateur ANIL
                  </a>
                </div>

                {/* Search input with autocomplete */}
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <Search style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 15, height: 15, color: BAI.inkFaint, pointerEvents: 'none',
                  }} />
                  <input
                    placeholder="Saisissez une ville ou village français..."
                    value={citySearch}
                    onChange={(e) => handleCitySearch(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onFocus={() => citySuggestions.length > 0 && setShowSuggestions(true)}
                    style={{ ...inputStyle, paddingLeft: 36, fontSize: 14 }}
                  />
                  {/* Suggestions dropdown */}
                  {showSuggestions && citySuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                      background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 8,
                      boxShadow: BAI.shadowMd, marginTop: 4, overflow: 'hidden',
                    }}>
                      {citySuggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={() => {
                            setCitySearch(s.label)
                            setCitySuggestions([])
                            setShowSuggestions(false)
                            fetchMarketForCity(s.city, s.label)
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '10px 14px', border: 'none',
                            borderBottom: i < citySuggestions.length - 1 ? `1px solid ${BAI.border}` : 'none',
                            background: 'transparent', cursor: 'pointer', textAlign: 'left',
                            fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <MapPin style={{ width: 13, height: 13, color: BAI.caramel, flexShrink: 0 }} />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {citySearchLoading && (
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, margin: '0 0 12px' }}>Recherche en cours...</p>
                )}
                {!citySearchLoading && citySearch.length >= 2 && !cityResult && !showSuggestions && (
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, margin: '0 0 12px' }}>
                    Aucune donnée disponible pour « {citySearch} »
                  </p>
                )}

                {cityResult && (() => {
                  const furnishedFactor = 1.18
                  const avgFurnished = Math.round(cityResult.avgRentM2 * furnishedFactor * 10) / 10
                  const minFurnished = Math.round(cityResult.minRentM2 * furnishedFactor * 10) / 10
                  const maxFurnished = Math.round(cityResult.maxRentM2 * furnishedFactor * 10) / 10
                  return (
                    <div>
                      {/* City name */}
                      <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 10px' }}>
                        {cityResult.label}
                      </p>

                      {/* Encadrement badge */}
                      {cityResult.encadrement && (
                        <div style={{ marginBottom: 12 }}>
                          <a
                            href={cityResult.sourceUrl ?? 'https://www.encadrementdesloyers.gouv.fr/'}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.owner }}
                          >
                            <CheckCircle2 style={{ width: 13, height: 13 }} />
                            Encadrement des loyers actif — voir le détail
                            <ExternalLink style={{ width: 11, height: 11 }} />
                          </a>
                        </div>
                      )}

                      {/* Non-meublé row */}
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.inkFaint, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Non meublé</p>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        {[
                          { label: 'Min', value: cityResult.minRentM2, highlight: false },
                          { label: 'Moyen', value: cityResult.avgRentM2, highlight: true },
                          { label: 'Max', value: cityResult.maxRentM2, highlight: false },
                        ].map(item => (
                          <div key={item.label} style={{ flex: item.highlight ? 1.4 : 1, textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: item.highlight ? BAI.ownerLight : BAI.bgMuted, border: item.highlight ? `2px solid ${BAI.ownerBorder}` : `1px solid ${BAI.border}` }}>
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, color: item.highlight ? BAI.owner : BAI.inkFaint, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</p>
                            <p style={{ fontFamily: BAI.fontDisplay, fontSize: item.highlight ? 28 : 18, fontWeight: 700, fontStyle: 'italic', color: item.highlight ? BAI.owner : BAI.inkMid, margin: '0 0 2px', lineHeight: 1 }}>{item.value}</p>
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: item.highlight ? BAI.owner : BAI.inkFaint, margin: 0 }}>€/m²</p>
                          </div>
                        ))}
                      </div>

                      {/* Meublé row */}
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.inkFaint, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Meublé <span style={{ color: BAI.caramel, fontSize: 10, fontWeight: 600, textTransform: 'none' }}>(+18% estimé)</span></p>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        {[
                          { label: 'Min', value: minFurnished, highlight: false },
                          { label: 'Moyen', value: avgFurnished, highlight: true },
                          { label: 'Max', value: maxFurnished, highlight: false },
                        ].map(item => (
                          <div key={item.label} style={{ flex: item.highlight ? 1.4 : 1, textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: item.highlight ? BAI.caramelLight : BAI.bgMuted, border: item.highlight ? `2px solid ${BAI.caramelBorder}` : `1px solid ${BAI.border}` }}>
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, color: item.highlight ? BAI.caramel : BAI.inkFaint, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</p>
                            <p style={{ fontFamily: BAI.fontDisplay, fontSize: item.highlight ? 28 : 18, fontWeight: 700, fontStyle: 'italic', color: item.highlight ? BAI.caramel : BAI.inkMid, margin: '0 0 2px', lineHeight: 1 }}>{item.value}</p>
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: item.highlight ? BAI.caramel : BAI.inkFaint, margin: 0 }}>€/m²</p>
                          </div>
                        ))}
                      </div>

                      {/* Exemples concrets */}
                      <div style={{ padding: '12px 14px', borderRadius: 10, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, marginBottom: 14 }}>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.inkMid, margin: '0 0 6px' }}>Exemples pour {cityResult.label}</p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {[30, 50, 70].map(surf => (
                            <div key={surf} style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.ink }}>
                              <span style={{ fontWeight: 700 }}>{surf} m²</span>
                              {' : '}
                              <span style={{ color: BAI.owner }}>{Math.round(cityResult.avgRentM2 * surf).toLocaleString('fr-FR')} €</span>
                              {' / '}
                              <span style={{ color: BAI.caramel }}>{Math.round(avgFurnished * surf).toLocaleString('fr-FR')} €</span>
                              <span style={{ color: BAI.inkFaint, fontSize: 10 }}> meublé</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Source links */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Info style={{ width: 13, height: 13, color: BAI.inkFaint, flexShrink: 0 }} />
                        <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>Sources :</span>
                        {cityResult.sourceUrl && (
                          <a href={cityResult.sourceUrl} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: BAI.fontBody, fontSize: 12, color: BAI.owner, textDecoration: 'underline' }}>
                            {cityResult.sourceName ?? 'Données officielles'}
                            <ExternalLink style={{ width: 10, height: 10 }} />
                          </a>
                        )}
                        <a href="https://www.clameur.fr/" target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, textDecoration: 'underline' }}>
                          CLAMEUR <ExternalLink style={{ width: 10, height: 10 }} />
                        </a>
                        <a href="https://www.meilleursagents.com/" target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, textDecoration: 'underline' }}>
                          MeilleursAgents <ExternalLink style={{ width: 10, height: 10 }} />
                        </a>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: EXPENSES ── */}
        {activeTab === 'expenses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Add button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowExpenseForm((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: BAI.night,
                  color: '#fff',
                  fontFamily: BAI.fontBody,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                <PlusCircle style={{ width: 16, height: 16 }} />
                Ajouter une dépense
                {showExpenseForm ? (
                  <ChevronUp style={{ width: 14, height: 14 }} />
                ) : (
                  <ChevronDown style={{ width: 14, height: 14 }} />
                )}
              </button>
            </div>

            {/* Expense form */}
            {showExpenseForm && (
              <form
                onSubmit={handleCreateExpense}
                style={{
                  background: BAI.bgSurface,
                  border: `1px solid ${BAI.border}`,
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <p
                  style={{
                    fontFamily: BAI.fontBody,
                    fontSize: 14,
                    fontWeight: 700,
                    color: BAI.ink,
                    margin: '0 0 16px',
                  }}
                >
                  Nouvelle dépense
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                  }}
                >
                  <div>
                    <label style={labelStyle}>Bien concerné</label>
                    <select
                      value={expenseForm.propertyId}
                      onChange={(e) =>
                        setExpenseForm((f) => ({ ...f, propertyId: e.target.value }))
                      }
                      style={inputStyle}
                      required
                    >
                      <option value="">Sélectionner...</option>
                      {myProperties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Catégorie</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) =>
                        setExpenseForm((f) => ({
                          ...f,
                          category: e.target.value as ExpenseCategory,
                        }))
                      }
                      style={inputStyle}
                    >
                      {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <input
                      value={expenseForm.description}
                      onChange={(e) =>
                        setExpenseForm((f) => ({ ...f, description: e.target.value }))
                      }
                      style={inputStyle}
                      placeholder="Ex: Remplacement chaudière"
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Montant (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={expenseForm.amount}
                      onChange={(e) =>
                        setExpenseForm((f) => ({ ...f, amount: Number(e.target.value) }))
                      }
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Date</label>
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) =>
                        setExpenseForm((f) => ({ ...f, date: e.target.value }))
                      }
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginTop: 16,
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowExpenseForm(false)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 8,
                      border: `1px solid ${BAI.border}`,
                      background: 'transparent',
                      fontFamily: BAI.fontBody,
                      fontSize: 13,
                      color: BAI.inkMid,
                      cursor: 'pointer',
                      minHeight: 44,
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 8,
                      border: 'none',
                      background: BAI.night,
                      color: '#fff',
                      fontFamily: BAI.fontBody,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: 44,
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            )}

            {/* Expenses list */}
            <div
              style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {expenses.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: BAI.inkFaint,
                    fontFamily: BAI.fontBody,
                    fontSize: 14,
                  }}
                >
                  {isLoading ? 'Chargement...' : 'Aucune dépense enregistrée'}
                </div>
              ) : (
                expenses.map((expense, i) => (
                  <div
                    key={expense.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 20px',
                      borderBottom:
                        i < expenses.length - 1 ? `1px solid ${BAI.border}` : 'none',
                    }}
                  >
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: `${BAI.caramel}18`,
                        border: `1px solid ${BAI.caramel}30`,
                        fontFamily: BAI.fontBody,
                        fontSize: 11,
                        fontWeight: 600,
                        color: BAI.caramel,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {EXPENSE_CATEGORY_LABELS[expense.category]}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 13,
                          fontWeight: 600,
                          color: BAI.ink,
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {expense.description}
                      </p>
                      <p
                        style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 11,
                          color: BAI.inkFaint,
                          margin: '2px 0 0',
                        }}
                      >
                        {expense.property?.title} · {new Date(expense.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span
                      style={{
                        fontFamily: BAI.fontDisplay,
                        fontSize: 18,
                        fontWeight: 700,
                        color: BAI.error,
                        whiteSpace: 'nowrap',
                        fontStyle: 'italic',
                      }}
                    >
                      −{formatEuro(expense.amount)}
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm('Supprimer cette dépense ?')) {
                          deleteExpense(expense.id)
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        color: BAI.inkFaint,
                        minWidth: 44,
                        minHeight: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB: LOANS ── */}
        {activeTab === 'loans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {myProperties.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: BAI.inkFaint,
                  fontFamily: BAI.fontBody,
                  fontSize: 14,
                }}
              >
                {isLoading ? 'Chargement...' : 'Aucun bien enregistré'}
              </div>
            ) : (
              myProperties.map((property) => {
                const loan = loans.find((l) => l.propertyId === property.id)
                const isEditing = showLoanForm === property.id

                let progressPct = 0
                let monthsElapsed = 0
                if (loan) {
                  const start = new Date(loan.startDate)
                  const now = new Date()
                  monthsElapsed = Math.max(
                    0,
                    (now.getFullYear() - start.getFullYear()) * 12 +
                      now.getMonth() -
                      start.getMonth(),
                  )
                  progressPct = Math.min(
                    100,
                    Math.round((monthsElapsed / loan.durationMonths) * 100),
                  )
                }

                return (
                  <div
                    key={property.id}
                    style={{
                      background: BAI.bgSurface,
                      border: `1px solid ${BAI.border}`,
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    {/* Property header row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: loan && !isEditing ? 16 : isEditing ? 0 : 0,
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontFamily: BAI.fontBody,
                            fontSize: 14,
                            fontWeight: 700,
                            color: BAI.ink,
                            margin: 0,
                          }}
                        >
                          {property.title}
                        </p>
                        <p
                          style={{
                            fontFamily: BAI.fontBody,
                            fontSize: 12,
                            color: BAI.inkFaint,
                            margin: '2px 0 0',
                          }}
                        >
                          {property.city}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setShowLoanForm(null)
                          } else {
                            setShowLoanForm(property.id)
                            if (loan) {
                              setLoanForm({
                                propertyId: property.id,
                                bankName: loan.bankName ?? '',
                                totalAmount: loan.totalAmount,
                                monthlyPayment: loan.monthlyPayment,
                                interestRate: loan.interestRate,
                                durationMonths: loan.durationMonths,
                                startDate: loan.startDate.split('T')[0],
                              })
                            } else {
                              setLoanForm({ ...INITIAL_LOAN_FORM, propertyId: property.id })
                            }
                          }
                        }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 8,
                          border: `1px solid ${BAI.border}`,
                          background: 'transparent',
                          fontFamily: BAI.fontBody,
                          fontSize: 12,
                          fontWeight: 600,
                          color: BAI.inkMid,
                          cursor: 'pointer',
                          minHeight: 44,
                        }}
                      >
                        {isEditing ? 'Annuler' : loan ? 'Modifier' : '+ Ajouter un emprunt'}
                      </button>
                    </div>

                    {/* Loan detail (read mode) */}
                    {loan && !isEditing && (
                      <>
                        <div
                          style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}
                        >
                          <div>
                            <p
                              style={{
                                fontFamily: BAI.fontBody,
                                fontSize: 11,
                                color: BAI.inkFaint,
                                margin: 0,
                              }}
                            >
                              Mensualité
                            </p>
                            <p
                              style={{
                                fontFamily: BAI.fontDisplay,
                                fontSize: 22,
                                fontWeight: 700,
                                color: BAI.ink,
                                margin: '2px 0 0',
                                fontStyle: 'italic',
                              }}
                            >
                              {formatEuro(loan.monthlyPayment)}
                            </p>
                          </div>
                          <div>
                            <p
                              style={{
                                fontFamily: BAI.fontBody,
                                fontSize: 11,
                                color: BAI.inkFaint,
                                margin: 0,
                              }}
                            >
                              Capital emprunté
                            </p>
                            <p
                              style={{
                                fontFamily: BAI.fontDisplay,
                                fontSize: 22,
                                fontWeight: 700,
                                color: BAI.ink,
                                margin: '2px 0 0',
                                fontStyle: 'italic',
                              }}
                            >
                              {formatEuro(loan.totalAmount)}
                            </p>
                          </div>
                          <div>
                            <p
                              style={{
                                fontFamily: BAI.fontBody,
                                fontSize: 11,
                                color: BAI.inkFaint,
                                margin: 0,
                              }}
                            >
                              Taux
                            </p>
                            <p
                              style={{
                                fontFamily: BAI.fontDisplay,
                                fontSize: 22,
                                fontWeight: 700,
                                color: BAI.ink,
                                margin: '2px 0 0',
                                fontStyle: 'italic',
                              }}
                            >
                              {loan.interestRate}%
                            </p>
                          </div>
                          <div>
                            <p
                              style={{
                                fontFamily: BAI.fontBody,
                                fontSize: 11,
                                color: BAI.inkFaint,
                                margin: 0,
                              }}
                            >
                              Durée
                            </p>
                            <p
                              style={{
                                fontFamily: BAI.fontDisplay,
                                fontSize: 22,
                                fontWeight: 700,
                                color: BAI.ink,
                                margin: '2px 0 0',
                                fontStyle: 'italic',
                              }}
                            >
                              {Math.round(loan.durationMonths / 12)} ans
                            </p>
                          </div>
                          {loan.bankName && (
                            <div>
                              <p
                                style={{
                                  fontFamily: BAI.fontBody,
                                  fontSize: 11,
                                  color: BAI.inkFaint,
                                  margin: 0,
                                }}
                              >
                                Banque
                              </p>
                              <p
                                style={{
                                  fontFamily: BAI.fontBody,
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: BAI.ink,
                                  margin: '2px 0 0',
                                }}
                              >
                                {loan.bankName}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Progress bar */}
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: BAI.fontBody,
                                fontSize: 11,
                                color: BAI.inkFaint,
                              }}
                            >
                              {monthsElapsed} mois écoulés
                            </span>
                            <span
                              style={{
                                fontFamily: BAI.fontBody,
                                fontSize: 11,
                                color: BAI.inkFaint,
                              }}
                            >
                              {loan.durationMonths - monthsElapsed} mois restants
                            </span>
                          </div>
                          <div
                            style={{
                              height: 6,
                              background: BAI.bgMuted,
                              borderRadius: 999,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${progressPct}%`,
                                background: BAI.owner,
                                borderRadius: 999,
                                transition: 'width 0.6s ease',
                              }}
                            />
                          </div>
                          <p
                            style={{
                              fontFamily: BAI.fontBody,
                              fontSize: 11,
                              color: BAI.inkFaint,
                              margin: '4px 0 0',
                              textAlign: 'right',
                            }}
                          >
                            {progressPct}% remboursé
                          </p>
                        </div>
                      </>
                    )}

                    {/* Loan edit form */}
                    {isEditing && (
                      <form onSubmit={handleSaveLoan} style={{ marginTop: 16 }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: 12,
                          }}
                        >
                          <div>
                            <label style={labelStyle}>Banque (optionnel)</label>
                            <input
                              value={loanForm.bankName}
                              onChange={(e) =>
                                setLoanForm((f) => ({ ...f, bankName: e.target.value }))
                              }
                              style={inputStyle}
                              placeholder="Ex: Crédit Agricole"
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Capital emprunté (€)</label>
                            <input
                              type="number"
                              min={0}
                              value={loanForm.totalAmount}
                              onChange={(e) =>
                                setLoanForm((f) => ({
                                  ...f,
                                  totalAmount: Number(e.target.value),
                                }))
                              }
                              style={inputStyle}
                              required
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Mensualité (€)</label>
                            <input
                              type="number"
                              min={0}
                              value={loanForm.monthlyPayment}
                              onChange={(e) =>
                                setLoanForm((f) => ({
                                  ...f,
                                  monthlyPayment: Number(e.target.value),
                                }))
                              }
                              style={inputStyle}
                              required
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Taux d'intérêt (%)</label>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={loanForm.interestRate}
                              onChange={(e) =>
                                setLoanForm((f) => ({
                                  ...f,
                                  interestRate: Number(e.target.value),
                                }))
                              }
                              style={inputStyle}
                              required
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Durée (mois)</label>
                            <input
                              type="number"
                              min={1}
                              value={loanForm.durationMonths}
                              onChange={(e) =>
                                setLoanForm((f) => ({
                                  ...f,
                                  durationMonths: Number(e.target.value),
                                }))
                              }
                              style={inputStyle}
                              required
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Date de début</label>
                            <input
                              type="date"
                              value={loanForm.startDate}
                              onChange={(e) =>
                                setLoanForm((f) => ({ ...f, startDate: e.target.value }))
                              }
                              style={inputStyle}
                              required
                            />
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: 10,
                            marginTop: 14,
                            justifyContent: 'flex-end',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setShowLoanForm(null)}
                            style={{
                              padding: '9px 18px',
                              borderRadius: 8,
                              border: `1px solid ${BAI.border}`,
                              background: 'transparent',
                              fontFamily: BAI.fontBody,
                              fontSize: 13,
                              color: BAI.inkMid,
                              cursor: 'pointer',
                              minHeight: 44,
                            }}
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                              padding: '9px 20px',
                              borderRadius: 8,
                              border: 'none',
                              background: BAI.night,
                              color: '#fff',
                              fontFamily: BAI.fontBody,
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: 'pointer',
                              minHeight: 44,
                              opacity: isLoading ? 0.7 : 1,
                            }}
                          >
                            Enregistrer
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
        {/* ── TAB: MARKET ── */}
        {activeTab === 'market' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {myProperties.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint }}>
                Aucun bien enregistré
              </div>
            )}

            {myProperties.map((property) => {
              const analysis = marketAnalyses[property.id]

              // Verdict simple
              const verdict = !analysis ? null
                : analysis.vsMarket === 'above' ? { label: `Loyer au-dessus du marché (+${analysis.vsMarketPct}%)`, color: BAI.tenant, icon: <TrendingUp style={{ width: 16, height: 16 }} /> }
                : analysis.vsMarket === 'below' ? { label: `Loyer en dessous du marché (${analysis.vsMarketPct}%)`, color: BAI.caramel, icon: <TrendingDown style={{ width: 16, height: 16 }} /> }
                : { label: 'Loyer dans la moyenne du marché', color: BAI.inkMid, icon: <Minus style={{ width: 16, height: 16 }} /> }

              const encAlert = analysis?.encadrementStatus === 'above_limit'

              return (
                <div key={property.id} style={{ background: BAI.bgSurface, border: `1px solid ${encAlert ? BAI.error : BAI.border}`, borderRadius: 12, padding: 20 }}>

                  {/* Top row: bien + verdict */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                    <div>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: BAI.ink, margin: 0 }}>{property.title}</p>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '2px 0 0' }}>{property.city} · {property.surface} m²</p>
                    </div>
                    {verdict && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: `${verdict.color}12`, border: `1px solid ${verdict.color}30`, fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: verdict.color }}>
                        {verdict.icon} {verdict.label}
                      </span>
                    )}
                    {!analysis && (
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                        {marketLoading ? 'Analyse en cours...' : '—'}
                      </span>
                    )}
                  </div>

                  {analysis && (
                    <>
                      {/* 3 chiffres essentiels */}
                      <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${BAI.border}`, marginBottom: 14 }}>
                        {[
                          { label: 'Votre loyer', value: `${analysis.rentPerM2.toFixed(1)} €/m²`, highlight: true },
                          { label: 'Moyenne marché', value: analysis.market ? `${analysis.market.avgRentM2.toFixed(1)} €/m²` : '—', highlight: false },
                          { label: 'Fourchette', value: analysis.market ? `${analysis.market.minRentM2}–${analysis.market.maxRentM2} €/m²` : '—', highlight: false },
                        ].map((item, i, arr) => (
                          <div key={item.label} style={{ flex: 1, padding: '12px 16px', background: item.highlight ? `${BAI.owner}08` : BAI.bgSurface, borderRight: i < arr.length - 1 ? `1px solid ${BAI.border}` : 'none' }}>
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '0 0 4px' }}>{item.label}</p>
                            <p style={{ fontFamily: BAI.fontDisplay, fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: item.highlight ? BAI.owner : BAI.ink, margin: 0 }}>{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Encadrement alert ou info */}
                      {analysis.encadrementStatus !== 'not_applicable' && analysis.encadrementStatus !== 'unknown' && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, background: encAlert ? BAI.errorLight : `${BAI.tenant}0a`, border: `1px solid ${encAlert ? '#fca5a5' : `${BAI.tenant}30`}`, marginBottom: 12 }}>
                          {encAlert
                            ? <AlertTriangle style={{ width: 15, height: 15, color: BAI.error, flexShrink: 0, marginTop: 1 }} />
                            : <CheckCircle2 style={{ width: 15, height: 15, color: BAI.tenant, flexShrink: 0, marginTop: 1 }} />
                          }
                          <div>
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: encAlert ? BAI.error : BAI.tenant, margin: '0 0 2px' }}>
                              {encAlert ? 'Loyer au-dessus du plafond légal' : 'Conforme à l\'encadrement des loyers'}
                            </p>
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: 0 }}>
                              {analysis.encadrementInfo}
                              {analysis.encadrementRef && ` · Réf. ${analysis.encadrementRef} €/m²`}
                              {analysis.encadrementMaj && ` · Plafond majoré ${analysis.encadrementMaj} €/m²`}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Conseil en 1 ligne */}
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: 0, lineHeight: 1.6 }}>
                        <strong style={{ color: BAI.ink }}>Conseil · </strong>{analysis.advice}
                      </p>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </Layout>
  )
}
