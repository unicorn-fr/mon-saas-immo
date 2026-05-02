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
  FileText,
  BarChart2,
} from 'lucide-react'
import { financeService, MarketAnalysis } from '../../services/finance.service'
import toast from 'react-hot-toast'

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
  '05': 'Mai', '06': 'Juin', '07': 'Juil', '08': 'Aoû',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
}

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function formatMonth(m: string): string {
  const [year, month] = m.split('-')
  return `${MONTH_LABELS[month] ?? month} ${year.slice(2)}`
}

function formatEuro(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

// ── Fiscal Advisor ────────────────────────────────────────────────────────────

interface FiscalResult {
  recommended: string
  description: string
  savings: number | null
  steps: string[]
  links: { label: string; url: string }[]
}

interface FiscalForm {
  hasSociety: 'non' | 'sci_ir' | 'sci_is' | 'sarl_sas' | 'autre'
  currentRegime: 'unknown' | 'micro_foncier' | 'reel' | 'micro_bic' | 'bic_reel' | 'is'
  annualRevenue: number
  realCharges: number
  isFurnished: boolean
}

function computeFiscalAdvice(form: FiscalForm): FiscalResult {
  const { hasSociety, annualRevenue, realCharges, isFurnished } = form

  if (hasSociety === 'sci_is' || hasSociety === 'sarl_sas') {
    return {
      recommended: 'IS (Impôt sur les Sociétés)',
      description: "Votre structure en société est soumise à l'IS. Vous pouvez amortir le bien immobilier et déduire toutes vos charges.",
      savings: null,
      steps: [
        'Tenir une comptabilité en partie double',
        'Déduire les amortissements (bien + travaux)',
        'Distribuer les dividendes avec optimisation',
        'Consulter un expert-comptable pour la liasse fiscale',
      ],
      links: [
        { label: 'Régime IS — impots.gouv.fr', url: 'https://www.impots.gouv.fr/professionnel/limposition-des-benefices' },
        { label: 'URSSAF — obligations sociales', url: 'https://www.urssaf.fr/portail/home.html' },
      ],
    }
  }

  if (isFurnished) {
    const microBicTax = (annualRevenue * 0.5) * 0.30
    const reelTax = Math.max(0, annualRevenue - realCharges) * 0.30
    const savings = microBicTax > reelTax ? Math.round(microBicTax - reelTax) : null

    if (annualRevenue > 77700) {
      return {
        recommended: 'LMNP Réel',
        description: `Vos revenus meublés (${annualRevenue.toLocaleString('fr-FR')} €) dépassent 77 700 €. Le régime BIC réel s'impose, avec déduction de toutes vos charges et amortissements du bien.`,
        savings,
        steps: [
          'Tenir un livre de comptes',
          'Amortir le bien sur 20-30 ans',
          "Déduire intérêts d'emprunt, travaux, assurance",
          'Déclarer via formulaire 2031',
        ],
        links: [
          { label: 'LMNP Réel — service-public.fr', url: 'https://www.service-public.fr/particuliers/vosdroits/F32744' },
          { label: 'Simulateur LMNP — anil.org', url: 'https://www.anil.org/outils/simulateurs-en-ligne/lmnp/' },
        ],
      }
    }

    return {
      recommended: realCharges > annualRevenue * 0.5 ? 'LMNP Réel (BIC réel)' : 'LMNP Micro-BIC',
      description: realCharges > annualRevenue * 0.5
        ? `Vos charges réelles (${realCharges.toLocaleString('fr-FR')} €) dépassent 50% des revenus. Le BIC réel vous permet de déduire plus que l'abattement forfaitaire de 50%.`
        : `Avec ${annualRevenue.toLocaleString('fr-FR')} € de revenus et l'abattement de 50%, le Micro-BIC est le régime le plus simple et souvent optimal.`,
      savings,
      steps: realCharges > annualRevenue * 0.5
        ? ['Déclarer au BIC réel (formulaire 2031)', 'Tenir un livre de comptes', 'Déduire charges + amortissements']
        : ['Déclarer revenus en case 5ND (formulaire 2042 C-PRO)', 'Abattement automatique de 50%', 'Aucune comptabilité complexe requise'],
      links: [
        { label: 'LMNP — impots.gouv.fr', url: 'https://www.impots.gouv.fr/particulier/les-revenus-des-locations-meublees' },
        { label: 'LMNP — service-public.fr', url: 'https://www.service-public.fr/particuliers/vosdroits/F32744' },
        { label: 'Centre des Impôts — déclarer votre LMNP', url: 'https://www.impots.gouv.fr/particulier/declarer-vos-revenus-en-ligne' },
      ],
    }
  }

  // Non meublé
  if (annualRevenue > 15000) {
    return {
      recommended: 'Régime Réel Foncier',
      description: `Vos revenus fonciers (${annualRevenue.toLocaleString('fr-FR')} €) dépassent 15 000 €. Le régime réel est obligatoire. Vous pouvez déduire toutes vos charges réelles.`,
      savings: realCharges > annualRevenue * 0.3 ? Math.round((realCharges - annualRevenue * 0.3) * 0.30) : null,
      steps: [
        'Remplir le formulaire 2044 (déclaration de revenus fonciers)',
        "Déduire : travaux, assurance, taxe foncière, intérêts d'emprunt",
        'Reporter le résultat en case 4BA sur la 2042',
      ],
      links: [
        { label: 'Revenus fonciers réel — impots.gouv.fr', url: 'https://www.impots.gouv.fr/particulier/les-revenus-fonciers' },
        { label: 'Formulaire 2044 — impots.gouv.fr', url: 'https://www.impots.gouv.fr/sites/default/files/formulaires/2044/2024/2044_3671.pdf' },
      ],
    }
  }

  const microTax = (annualRevenue * 0.7) * 0.30
  const reelTaxNm = Math.max(0, annualRevenue - realCharges) * 0.30
  return {
    recommended: realCharges > annualRevenue * 0.3 ? 'Régime Réel Foncier' : 'Micro-foncier',
    description: realCharges > annualRevenue * 0.3
      ? `Vos charges réelles (${realCharges.toLocaleString('fr-FR')} €) sont supérieures à l'abattement de 30%. Optez pour le régime réel pour payer moins d'impôts.`
      : `Avec ${annualRevenue.toLocaleString('fr-FR')} € de revenus et des charges limitées, le micro-foncier (abattement de 30%) est simple et optimal.`,
    savings: microTax > reelTaxNm ? Math.round(microTax - reelTaxNm) : null,
    steps: realCharges > annualRevenue * 0.3
      ? ['Opter pour le régime réel (formulaire 2044)', 'Lister et justifier toutes vos charges', 'Signaler l\'option au fisc avant le 1er février']
      : ['Déclarer en case 4BE (formulaire 2042)', 'Abattement forfaitaire de 30% appliqué automatiquement', 'Pas de comptabilité requise'],
    links: [
      { label: 'Micro-foncier — service-public.fr', url: 'https://www.service-public.fr/particuliers/vosdroits/F1714' },
      { label: 'Revenus fonciers — impots.gouv.fr', url: 'https://www.impots.gouv.fr/particulier/les-revenus-fonciers' },
      { label: 'Simulateur impôts — impots.gouv.fr', url: 'https://www.impots.gouv.fr/particulier/outils/simulateur-ir' },
    ],
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

// ── Page ──────────────────────────────────────────────────────────────────────

type ActiveTab = 'summary' | 'expenses' | 'loans' | 'market' | 'receipts' | 'fiscal'

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

  // New state for receipts & fiscal tabs
  const [paymentsByContract, setPaymentsByContract] = useState<Record<string, any[]>>({})
  const [receiptsLoading, setReceiptsLoading] = useState(false)
  const [paymentSettings, setPaymentSettings] = useState<Record<string, { dayOfMonth: number; autoSend: boolean }>>({})
  const [fiscalForm, setFiscalForm] = useState<FiscalForm>({
    hasSociety: 'non',
    currentRegime: 'unknown',
    annualRevenue: 0,
    realCharges: 0,
    isFurnished: false,
  })
  const [fiscalResult, setFiscalResult] = useState<FiscalResult | null>(null)

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

  // Receipts tab: fetch payments grouped by contract
  useEffect(() => {
    if (activeTab !== 'receipts') return
    setReceiptsLoading(true)
    apiClient.get<{ success: boolean; data: { payments: any[] } }>('/payments/by-owner')
      .then((res) => {
        const payments: any[] = res.data?.data?.payments ?? []
        const grouped: Record<string, any[]> = {}
        payments.forEach((p) => {
          const cid = p.contractId ?? 'unknown'
          if (!grouped[cid]) grouped[cid] = []
          grouped[cid].push(p)
        })
        setPaymentsByContract(grouped)
      })
      .catch(() => { /* silent */ })
      .finally(() => setReceiptsLoading(false))
  }, [activeTab])

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

  async function handleMarkPaid(paymentId: string) {
    try {
      await apiClient.put(`/payments/${paymentId}/mark-paid`)
      toast.success('Paiement marqué comme reçu')
      // Refresh
      const res = await apiClient.get<{ success: boolean; data: { payments: any[] } }>('/payments/by-owner')
      const payments: any[] = res.data?.data?.payments ?? []
      const grouped: Record<string, any[]> = {}
      payments.forEach((p) => {
        const cid = p.contractId ?? 'unknown'
        if (!grouped[cid]) grouped[cid] = []
        grouped[cid].push(p)
      })
      setPaymentsByContract(grouped)
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  async function handleSendReceipt(paymentId: string) {
    try {
      await apiClient.post(`/payments/${paymentId}/send-email`)
      toast.success('Quittance envoyée par email')
    } catch {
      toast.error("Erreur lors de l'envoi de la quittance")
    }
  }

  async function handleGeneratePayment(contractId: string) {
    const now = new Date()
    try {
      await apiClient.post('/payments/generate', {
        contractId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      })
      toast.success('Quittance générée')
      // Refresh
      const res = await apiClient.get<{ success: boolean; data: { payments: any[] } }>('/payments/by-owner')
      const payments: any[] = res.data?.data?.payments ?? []
      const grouped: Record<string, any[]> = {}
      payments.forEach((p) => {
        const cid = p.contractId ?? 'unknown'
        if (!grouped[cid]) grouped[cid] = []
        grouped[cid].push(p)
      })
      setPaymentsByContract(grouped)
    } catch {
      toast.error('Erreur lors de la génération')
    }
  }

  async function handleSaveSettings(contractId: string) {
    const settings = paymentSettings[contractId]
    if (!settings) return
    try {
      await apiClient.put(`/payments/settings/${contractId}`, settings)
      toast.success('Paramètres enregistrés')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

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

  // Glassmorphism KPI card style
  const glassKpiStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(228,225,219,0.6)',
    borderRadius: 16,
    padding: '24px 28px',
    boxShadow: '0 4px 24px rgba(13,12,10,0.06)',
    flex: 1,
    minWidth: 200,
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
          <TabPill id="receipts" label="Quittances" />
          <TabPill id="fiscal" label="Conseil Fiscal" />
        </div>

        {/* ── TAB: SUMMARY ── */}
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* 3 Glassmorphism KPI cards */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* Revenue 12 mois */}
              <div style={glassKpiStyle}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 8px' }}>
                  Revenus 12 mois
                </p>
                <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px,4vw,32px)', fontWeight: 700, fontStyle: 'italic', color: BAI.owner, margin: 0, lineHeight: 1 }}>
                  {summary ? formatEuro(summary.totalRevenue) : '—'}
                </p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '6px 0 0' }}>
                  Loyers encaissés
                </p>
              </div>

              {/* Cash-flow net */}
              <div style={glassKpiStyle}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 8px' }}>
                  Cash-flow net
                </p>
                <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px,4vw,32px)', fontWeight: 700, fontStyle: 'italic', color: summary ? (summary.netCashFlow >= 0 ? BAI.tenant : BAI.error) : BAI.ink, margin: 0, lineHeight: 1 }}>
                  {summary ? formatEuro(summary.netCashFlow) : '—'}
                </p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '6px 0 0' }}>
                  {summary ? (summary.netCashFlow >= 0 ? 'Rentabilité positive' : 'Déficit à surveiller') : 'Après charges & emprunts'}
                </p>
              </div>

              {/* Taux d'occupation */}
              <div style={glassKpiStyle}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 8px' }}>
                  Taux d'occupation
                </p>
                <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px,4vw,32px)', fontWeight: 700, fontStyle: 'italic', color: summary ? (summary.occupancyRate >= 80 ? BAI.tenant : BAI.caramel) : BAI.ink, margin: 0, lineHeight: 1 }}>
                  {summary ? `${summary.occupancyRate}%` : '—'}
                </p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '6px 0 0' }}>
                  {summary ? (summary.occupancyRate >= 90 ? 'Excellent' : summary.occupancyRate >= 70 ? 'Correct' : 'Vacance élevée') : 'Biens loués / parc total'}
                </p>
              </div>
            </div>

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

            {/* Market locatif widget */}
            <div
              style={{
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
                      {/* Votre loyer */}
                      <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${BAI.border}`, marginBottom: 14 }}>
                        <div style={{ flex: 1, padding: '12px 16px', background: `${BAI.owner}08`, borderRight: `1px solid ${BAI.border}` }}>
                          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '0 0 4px' }}>Votre loyer</p>
                          <p style={{ fontFamily: BAI.fontDisplay, fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: BAI.owner, margin: 0 }}>{analysis.rentPerM2.toFixed(1)} €/m²</p>
                        </div>
                        {analysis.market ? (() => {
                          const f = 1.18
                          const avgM = Math.round(analysis.market.avgRentM2 * f * 10) / 10
                          const minM = Math.round(analysis.market.minRentM2 * f * 10) / 10
                          const maxM = Math.round(analysis.market.maxRentM2 * f * 10) / 10
                          return (
                            <>
                              <div style={{ flex: 2, padding: '12px 16px' }}>
                                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.inkFaint, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 6px' }}>Non meublé</p>
                                <div style={{ display: 'flex', gap: 16 }}>
                                  {[
                                    { label: 'Min', value: analysis.market!.minRentM2 },
                                    { label: 'Moy', value: analysis.market!.avgRentM2 },
                                    { label: 'Max', value: analysis.market!.maxRentM2 },
                                  ].map(item => (
                                    <div key={item.label}>
                                      <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: BAI.inkFaint, margin: '0 0 2px' }}>{item.label}</p>
                                      <p style={{ fontFamily: BAI.fontDisplay, fontSize: 18, fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0 }}>{item.value.toFixed(1)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div style={{ flex: 2, padding: '12px 16px', borderLeft: `1px solid ${BAI.border}`, background: `${BAI.caramel}06` }}>
                                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.caramel, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 6px' }}>Meublé (+18 %)</p>
                                <div style={{ display: 'flex', gap: 16 }}>
                                  {[
                                    { label: 'Min', value: minM },
                                    { label: 'Moy', value: avgM },
                                    { label: 'Max', value: maxM },
                                  ].map(item => (
                                    <div key={item.label}>
                                      <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: BAI.inkFaint, margin: '0 0 2px' }}>{item.label}</p>
                                      <p style={{ fontFamily: BAI.fontDisplay, fontSize: 18, fontWeight: 700, fontStyle: 'italic', color: BAI.caramel, margin: 0 }}>{item.value.toFixed(1)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )
                        })() : (
                          <div style={{ flex: 2, padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, margin: 0 }}>Données marché non disponibles pour cette ville</p>
                          </div>
                        )}
                      </div>

                      {/* Source ANIL */}
                      {analysis.market?.sourceUrl && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                          <Info style={{ width: 13, height: 13, color: BAI.inkFaint, flexShrink: 0 }} />
                          <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>Source :</span>
                          <a href={analysis.market.sourceUrl} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: BAI.fontBody, fontSize: 12, color: BAI.owner, textDecoration: 'underline' }}>
                            {analysis.market.sourceName ?? 'Données officielles'}
                            <ExternalLink style={{ width: 10, height: 10 }} />
                          </a>
                          {analysis.market.nbObs !== undefined && analysis.market.nbObs < 30 && (
                            <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>· {analysis.market.nbObs} observations (données limitées)</span>
                          )}
                        </div>
                      )}

                      {/* Encadrement links */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                        <a href="https://www.encadrementdesloyers.gouv.fr/" target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: `1px solid ${BAI.ownerBorder}`, background: BAI.ownerLight, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.owner }}>
                          <ExternalLink style={{ width: 11, height: 11 }} />
                          Vérifier l'encadrement des loyers
                        </a>
                        {(() => {
                          const ENCADREMENT_LINKS: Record<string, { label: string; url: string }> = {
                            'paris': { label: 'Encadrement Paris', url: 'https://www.paris.fr/encadrementdesloyers' },
                            'lille': { label: 'Encadrement Lille', url: 'https://www.encadrementdesloyers.gouv.fr/' },
                            'hellemmes': { label: 'Encadrement Hellemmes', url: 'https://www.encadrementdesloyers.gouv.fr/' },
                            'loos': { label: 'Encadrement Loos', url: 'https://www.encadrementdesloyers.gouv.fr/' },
                            'lyon': { label: 'Encadrement Lyon Métropole', url: 'https://www.grandlyon.com/services/encadrement-des-loyers.html' },
                            'bordeaux': { label: 'Encadrement Bordeaux', url: 'https://www.bordeaux-metropole.fr/Missions/Logement-habitat/Encadrement-des-loyers' },
                            'montpellier': { label: 'Encadrement Montpellier', url: 'https://www.encadrementdesloyers.gouv.fr/' },
                            'strasbourg': { label: 'Encadrement Strasbourg', url: 'https://www.encadrementdesloyers.gouv.fr/' },
                            'grenoble': { label: 'Encadrement Grenoble', url: 'https://www.encadrementdesloyers.gouv.fr/' },
                            'bayonne': { label: 'Encadrement Pays Basque', url: 'https://www.encadrementdesloyers.gouv.fr/' },
                            'biarritz': { label: 'Encadrement Pays Basque', url: 'https://www.encadrementdesloyers.gouv.fr/' },
                            'anglet': { label: 'Encadrement Pays Basque', url: 'https://www.encadrementdesloyers.gouv.fr/' },
                          }
                          const cityKey = (analysis.market?.city ?? property.city ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                          const cityLink = ENCADREMENT_LINKS[cityKey]
                          return cityLink ? (
                            <a href={cityLink.url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgMuted, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid }}>
                              <ExternalLink style={{ width: 11, height: 11 }} />
                              {cityLink.label}
                            </a>
                          ) : null
                        })()}
                      </div>

                      {/* Note for large cities */}
                      {(() => {
                        const largeCities = ['paris', 'lyon', 'marseille', 'bordeaux', 'montpellier', 'strasbourg', 'nantes', 'toulouse', 'nice', 'grenoble']
                        const cityNorm = (analysis.market?.city ?? property.city ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                        return largeCities.some(c => cityNorm.includes(c)) ? (
                          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '0 0 12px', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                            <Info style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
                            Dans les grandes villes, les prix varient significativement selon le quartier. Consultez les sources officielles pour votre adresse exacte.
                          </p>
                        ) : null
                      })()}

                      {/* Encadrement alert ou info */}
                      {analysis.encadrementStatus !== 'not_applicable' && analysis.encadrementStatus !== 'unknown' && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, background: encAlert ? BAI.errorLight : `${BAI.tenant}0a`, border: `1px solid ${encAlert ? '#fca5a5' : `${BAI.tenant}30`}`, marginBottom: 12 }}>
                          {encAlert
                            ? <AlertTriangle style={{ width: 15, height: 15, color: BAI.error, flexShrink: 0, marginTop: 1 }} />
                            : <CheckCircle2 style={{ width: 15, height: 15, color: BAI.tenant, flexShrink: 0, marginTop: 1 }} />
                          }
                          <div>
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: encAlert ? BAI.error : BAI.tenant, margin: '0 0 2px' }}>
                              {encAlert ? 'Loyer au-dessus du plafond légal' : "Conforme à l'encadrement des loyers"}
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

        {/* ── TAB: RECEIPTS ── */}
        {activeTab === 'receipts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header overline */}
            <div>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 6px' }}>
                Gestion locative
              </p>
              <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 8px' }}>
                Quittances de loyer
              </h2>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
                Suivez les loyers encaissés et envoyez les quittances à vos locataires.
              </p>
            </div>

            {/* Quick link to contracts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}` }}>
              <FileText style={{ width: 18, height: 18, color: BAI.owner, flexShrink: 0 }} />
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.owner, margin: 0, flex: 1 }}>
                La gestion complète des contrats est disponible sur la page Contrats.
              </p>
              <a
                href="/dashboard/owner/contracts"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: BAI.owner, color: '#fff', textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, minHeight: 40 }}
              >
                Voir les contrats
                <ExternalLink style={{ width: 13, height: 13 }} />
              </a>
            </div>

            {receiptsLoading ? (
              <div style={{ textAlign: 'center', padding: 48, color: BAI.inkFaint, fontFamily: BAI.fontBody, fontSize: 14 }}>
                Chargement des paiements...
              </div>
            ) : myProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: BAI.inkFaint, fontFamily: BAI.fontBody, fontSize: 14 }}>
                Aucun bien enregistré
              </div>
            ) : Object.keys(paymentsByContract).length === 0 ? (
              <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint, margin: '0 0 16px' }}>
                  Aucun paiement enregistré pour le moment.
                </p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, margin: 0 }}>
                  Les quittances apparaîtront ici une fois vos contrats actifs.
                </p>
              </div>
            ) : (
              Object.entries(paymentsByContract).map(([contractId, payments]) => {
                const firstPayment = payments[0]
                const contractTitle = firstPayment?.contract?.property?.title ?? 'Contrat'
                const tenantName = [firstPayment?.contract?.tenant?.firstName, firstPayment?.contract?.tenant?.lastName].filter(Boolean).join(' ') || firstPayment?.contract?.tenantId || 'Locataire'
                const monthlyRent = firstPayment?.amount ?? 0
                const settings = paymentSettings[contractId] ?? { dayOfMonth: 1, autoSend: false }

                const now = new Date()
                const currentMonthLabel = `${MONTH_NAMES_FR[now.getMonth()]} ${now.getFullYear()}`

                return (
                  <div key={contractId} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, overflow: 'hidden' }}>
                    {/* Contract header */}
                    <div style={{ padding: '18px 24px', borderBottom: `1px solid ${BAI.border}`, background: BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 700, color: BAI.ink, margin: '0 0 4px' }}>{contractTitle}</p>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: 0 }}>
                          {tenantName} · {formatEuro(monthlyRent)}/mois
                        </p>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: 999, background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`, fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.tenant }}>
                        {payments.length} paiement{payments.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Settings row */}
                    <div style={{ padding: '14px 24px', borderBottom: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, margin: 0 }}>Jour d'échéance :</p>
                      <select
                        value={settings.dayOfMonth}
                        onChange={(e) => setPaymentSettings(prev => ({
                          ...prev,
                          [contractId]: { ...settings, dayOfMonth: Number(e.target.value) },
                        }))}
                        style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: 13 }}
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>Le {d} du mois</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleSaveSettings(contractId)}
                        style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: 'transparent', fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.inkMid, cursor: 'pointer', minHeight: 36 }}
                      >
                        Sauvegarder
                      </button>
                    </div>

                    {/* Payments table */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: BAI.bgMuted }}>
                            {['Mois', 'Montant', 'Statut', 'Actions'].map(h => (
                              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.inkFaint, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment, idx) => {
                            const isPending = payment.status === 'PENDING'
                            const isPaid = payment.status === 'PAID'
                            const paymentDate = payment.dueDate ? new Date(payment.dueDate) : null
                            const monthLabel = paymentDate ? `${MONTH_NAMES_FR[paymentDate.getMonth()]} ${paymentDate.getFullYear()}` : '—'

                            return (
                              <tr key={payment.id} style={{ borderBottom: idx < payments.length - 1 ? `1px solid ${BAI.border}` : 'none' }}>
                                <td style={{ padding: '12px 16px', fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink }}>{monthLabel}</td>
                                <td style={{ padding: '12px 16px', fontFamily: BAI.fontDisplay, fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: BAI.ink }}>
                                  {formatEuro(payment.amount)}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <span style={{
                                    padding: '3px 10px', borderRadius: 999,
                                    background: isPaid ? BAI.tenantLight : isPending ? BAI.caramelLight : BAI.bgMuted,
                                    border: `1px solid ${isPaid ? BAI.tenantBorder : isPending ? BAI.caramelBorder : BAI.border}`,
                                    fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
                                    color: isPaid ? BAI.tenant : isPending ? BAI.caramel : BAI.inkMid,
                                  }}>
                                    {isPaid ? 'Payé' : isPending ? 'En attente' : payment.status}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {isPending && (
                                      <button
                                        onClick={() => handleMarkPaid(payment.id)}
                                        style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: BAI.tenant, color: '#fff', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, cursor: 'pointer', minHeight: 32 }}
                                      >
                                        Marquer payé
                                      </button>
                                    )}
                                    {isPaid && (
                                      <>
                                        <button
                                          onClick={() => handleSendReceipt(payment.id)}
                                          style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${BAI.ownerBorder}`, background: BAI.ownerLight, color: BAI.owner, fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, cursor: 'pointer', minHeight: 32 }}
                                        >
                                          Envoyer quittance
                                        </button>
                                        <a
                                          href={`/api/v1/payments/${payment.id}/receipt`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 7, border: `1px solid ${BAI.border}`, background: BAI.bgMuted, color: BAI.inkMid, fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, textDecoration: 'none', minHeight: 32 }}
                                        >
                                          Télécharger
                                        </a>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Generate button */}
                    <div style={{ padding: '14px 24px', borderTop: `1px solid ${BAI.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleGeneratePayment(contractId)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 9, border: 'none', background: BAI.night, color: '#fff', fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}
                      >
                        <FileText style={{ width: 15, height: 15 }} />
                        Générer quittance — {currentMonthLabel}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── TAB: FISCAL ── */}
        {activeTab === 'fiscal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Form card */}
            <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: 'clamp(20px,4vw,32px)' }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 6px' }}>
                Outil personnalisé
              </p>
              <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 8px' }}>
                Optimisation fiscale
              </h2>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: '0 0 28px', lineHeight: 1.6 }}>
                Renseignez votre situation pour obtenir une recommandation de régime fiscal adaptée à votre patrimoine locatif.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>

                {/* Société */}
                <div>
                  <label style={labelStyle}>Avez-vous créé une société ?</label>
                  <select
                    value={fiscalForm.hasSociety}
                    onChange={(e) => setFiscalForm(f => ({ ...f, hasSociety: e.target.value as FiscalForm['hasSociety'] }))}
                    style={inputStyle}
                  >
                    <option value="non">Non (location en nom propre)</option>
                    <option value="sci_ir">SCI à l'IR</option>
                    <option value="sci_is">SCI à l'IS</option>
                    <option value="sarl_sas">SARL / SAS</option>
                    <option value="autre">Autre structure</option>
                  </select>
                </div>

                {/* Régime actuel */}
                <div>
                  <label style={labelStyle}>Régime fiscal actuel ?</label>
                  <select
                    value={fiscalForm.currentRegime}
                    onChange={(e) => setFiscalForm(f => ({ ...f, currentRegime: e.target.value as FiscalForm['currentRegime'] }))}
                    style={inputStyle}
                  >
                    <option value="unknown">Je ne sais pas encore</option>
                    <option value="micro_foncier">Micro-foncier (30 % abatt.)</option>
                    <option value="reel">Foncier réel</option>
                    <option value="micro_bic">Micro-BIC (50 % abatt.)</option>
                    <option value="bic_reel">BIC réel (amortissements)</option>
                    <option value="is">IS (société)</option>
                  </select>
                </div>

                {/* Revenus annuels */}
                <div>
                  <label style={labelStyle}>Revenus locatifs annuels estimés (€)</label>
                  <input
                    type="number"
                    min={0}
                    value={fiscalForm.annualRevenue || ''}
                    onChange={(e) => setFiscalForm(f => ({ ...f, annualRevenue: Number(e.target.value) }))}
                    placeholder="Ex: 12000"
                    style={inputStyle}
                  />
                </div>

                {/* Charges réelles */}
                <div>
                  <label style={labelStyle}>Charges réelles estimées (€)</label>
                  <input
                    type="number"
                    min={0}
                    value={fiscalForm.realCharges || ''}
                    onChange={(e) => setFiscalForm(f => ({ ...f, realCharges: Number(e.target.value) }))}
                    placeholder="Ex: 3500 — travaux, intérêts, frais gestion..."
                    style={inputStyle}
                  />
                </div>

                {/* Type de location */}
                <div>
                  <label style={labelStyle}>Type de location</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { value: false, label: 'Non meublé' },
                      { value: true, label: 'Meublé' },
                    ].map(opt => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => setFiscalForm(f => ({ ...f, isFurnished: opt.value }))}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: `2px solid ${fiscalForm.isFurnished === opt.value ? BAI.night : BAI.border}`,
                          background: fiscalForm.isFurnished === opt.value ? BAI.night : 'transparent',
                          color: fiscalForm.isFurnished === opt.value ? '#fff' : BAI.inkMid,
                          fontFamily: BAI.fontBody,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          minHeight: 44,
                          transition: 'all 0.15s',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Analyze button */}
              <div style={{ marginTop: 28 }}>
                <button
                  onClick={() => {
                    if (fiscalForm.annualRevenue <= 0) {
                      toast.error('Veuillez saisir vos revenus locatifs')
                      return
                    }
                    setFiscalResult(computeFiscalAdvice(fiscalForm))
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 28px',
                    borderRadius: 10,
                    border: 'none',
                    background: BAI.night,
                    color: '#fff',
                    fontFamily: BAI.fontBody,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    minHeight: 48,
                  }}
                >
                  <BarChart2 style={{ width: 18, height: 18 }} />
                  Analyser mon régime
                </button>
              </div>
            </div>

            {/* Results card */}
            {fiscalResult && (
              <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, overflow: 'hidden' }}>
                {/* Recommended regime header */}
                <div style={{ padding: '20px 28px', background: BAI.ownerLight, borderBottom: `1px solid ${BAI.ownerBorder}`, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <CheckCircle2 style={{ width: 22, height: 22, color: BAI.owner, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.owner, margin: '0 0 4px' }}>
                      Régime recommandé
                    </p>
                    <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, fontStyle: 'italic', color: BAI.owner, margin: 0 }}>
                      {fiscalResult.recommended}
                    </p>
                  </div>
                </div>

                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Description */}
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0, lineHeight: 1.7 }}>
                    {fiscalResult.description}
                  </p>

                  {/* Savings box */}
                  {fiscalResult.savings !== null && (
                    <div style={{ padding: '16px 20px', borderRadius: 12, background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <TrendingUp style={{ width: 20, height: 20, color: BAI.tenant, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.tenant, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Économie potentielle estimée
                        </p>
                        <p style={{ fontFamily: BAI.fontDisplay, fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: BAI.tenant, margin: 0 }}>
                          {fiscalResult.savings.toLocaleString('fr-FR')} € / an
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  <div>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.ink, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
                      Étapes recommandées
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {fiscalResult.steps.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.owner }}>
                            {idx + 1}
                          </span>
                          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: '2px 0 0', lineHeight: 1.6 }}>
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Links */}
                  <div>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.ink, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                      Ressources officielles
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {fiscalResult.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 999, border: `1px solid ${BAI.ownerBorder}`, background: BAI.ownerLight, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.owner }}
                        >
                          {link.label}
                          <ExternalLink style={{ width: 11, height: 11 }} />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div style={{ padding: '12px 16px', borderRadius: 10, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Info style={{ width: 14, height: 14, color: BAI.inkFaint, flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: 0, lineHeight: 1.6 }}>
                      Ces estimations sont indicatives et basées sur des taux moyens. Consultez un expert-comptable ou un conseiller fiscal pour un conseil personnalisé adapté à votre situation précise.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  )
}
