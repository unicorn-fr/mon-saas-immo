import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Euro, Home, Calculator, Info, ArrowLeft,
  TrendingDown, Minus, CheckCircle, AlertTriangle, XCircle,
} from 'lucide-react'
import { Layout } from '../components/layout/Layout'

// ─── Engine ──────────────────────────────────────────────────────────────────

interface Inputs {
  acquisitionPrice: number
  notaryFees: number
  monthlyRent: number
  annualCharges: number
  propertyTax: number
  vacancyRate: number
  loanAmount: number
  loanRate: number
  loanDuration: number
  taxRate: number
}

interface Results {
  totalInvestment: number
  annualRentEffective: number
  grossYield: number
  netYieldBeforeTax: number
  netYieldAfterTax: number
  monthlyPayment: number
  monthlyCashflow: number
  annualCashflow: number
  roi10y: number
  breakEvenYears: number
}

function engine(inp: Inputs): Results {
  const totalInvestment = inp.acquisitionPrice * (1 + inp.notaryFees / 100)
  const annualRentGross = inp.monthlyRent * 12
  const annualRentEffective = annualRentGross * (1 - inp.vacancyRate / 100)

  const grossYield = (annualRentEffective / totalInvestment) * 100

  const annualNetBeforeTax = annualRentEffective - inp.annualCharges - inp.propertyTax
  const netYieldBeforeTax = (annualNetBeforeTax / totalInvestment) * 100

  const tax = Math.max(0, annualNetBeforeTax * (inp.taxRate / 100))
  const annualNetAfterTax = annualNetBeforeTax - tax
  const netYieldAfterTax = (annualNetAfterTax / totalInvestment) * 100

  let monthlyPayment = 0
  if (inp.loanAmount > 0 && inp.loanRate > 0 && inp.loanDuration > 0) {
    const r = inp.loanRate / 100 / 12
    const n = inp.loanDuration * 12
    monthlyPayment = inp.loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  }

  const monthlyChargesShare = (inp.annualCharges + inp.propertyTax) / 12
  const monthlyCashflow = inp.monthlyRent * (1 - inp.vacancyRate / 100) - monthlyPayment - monthlyChargesShare
  const annualCashflow = monthlyCashflow * 12

  const equity = inp.acquisitionPrice - inp.loanAmount
  const roi10y = equity > 0 ? ((annualNetAfterTax * 10) / equity) * 100 : 0

  const breakEvenYears = annualNetAfterTax > 0
    ? Math.ceil((totalInvestment - inp.loanAmount) / annualNetAfterTax)
    : Infinity

  return {
    totalInvestment,
    annualRentEffective,
    grossYield,
    netYieldBeforeTax,
    netYieldAfterTax,
    monthlyPayment,
    monthlyCashflow,
    annualCashflow,
    roi10y,
    breakEvenYears,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function yieldColor(pct: number) {
  if (pct >= 6) return '#059669'
  if (pct >= 4) return '#d97706'
  return '#dc2626'
}

function yieldBg(pct: number): React.CSSProperties {
  if (pct >= 6) return { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }
  if (pct >= 4) return { backgroundColor: '#fffbeb', borderColor: '#fde68a' }
  return { backgroundColor: '#fef2f2', borderColor: '#fecaca' }
}

function YieldIcon({ pct }: { pct: number }) {
  if (pct >= 6) return <CheckCircle className="w-5 h-5" style={{ color: '#059669' }} />
  if (pct >= 4) return <AlertTriangle className="w-5 h-5" style={{ color: '#d97706' }} />
  return <XCircle className="w-5 h-5" style={{ color: '#dc2626' }} />
}

function CashflowIcon({ cf }: { cf: number }) {
  if (cf > 0) return <TrendingUp className="w-5 h-5 text-emerald-600" />
  if (cf === 0) return <Minus className="w-5 h-5 text-slate-400" />
  return <TrendingDown className="w-5 h-5 text-red-500" />
}

// ─── Input Row ────────────────────────────────────────────────────────────────

function InputRow({
  label, hint, value, onChange, suffix = '€', min = 0, step = 1000, max,
}: {
  label: string; hint?: string; value: number; onChange: (v: number) => void
  suffix?: string; min?: number; step?: number; max?: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <label className="text-sm font-medium text-[#1d1d1f]">{label}</label>
        {hint && (
          <span title={hint}>
            <Info className="w-3.5 h-3.5 cursor-help text-[#86868b]" />
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          min={min}
          step={step}
          max={max}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full pr-10 px-3 py-2.5 rounded-xl border border-[#d2d2d7] text-[#1d1d1f] text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none text-[#86868b]">
          {suffix}
        </span>
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color = '#1d1d1f', style: cardStyle, icon,
}: {
  label: string; value: string; sub?: string; color?: string; style?: React.CSSProperties
  icon?: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-1"
      style={{ backgroundColor: '#ffffff', borderColor: '#d2d2d7', ...cardStyle }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-[#86868b]">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-extrabold tracking-tight" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-[#86868b]">{sub}</p>}
    </div>
  )
}

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT: Inputs = {
  acquisitionPrice: 200000,
  notaryFees: 7.5,
  monthlyRent: 900,
  annualCharges: 1800,
  propertyTax: 1200,
  vacancyRate: 5,
  loanAmount: 160000,
  loanRate: 3.5,
  loanDuration: 20,
  taxRate: 30,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Calculateur() {
  const [inp, setInp] = useState<Inputs>(DEFAULT)
  const set = (key: keyof Inputs) => (v: number) => setInp((p) => ({ ...p, [key]: v }))

  const res = useMemo(() => engine(inp), [inp])

  const cashflowColor = res.monthlyCashflow > 0 ? '#059669' : res.monthlyCashflow < 0 ? '#dc2626' : '#86868b'

  return (
    <Layout>
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
        style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}
      >

        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm mb-4 hover:opacity-80 transition-opacity text-[#86868b]"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#e8f0fe' }}
            >
              <Calculator className="w-6 h-6 text-[#007AFF]" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1d1d1f]">
                Calculateur de Rentabilité
              </h1>
              <p className="text-sm mt-0.5 text-[#515154]">
                Évaluez la performance locative de n'importe quel bien en quelques secondes.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── LEFT: Inputs ───────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Acquisition */}
            <section
              className="rounded-2xl border border-[#d2d2d7] p-5 space-y-4 bg-white"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <h2 className="font-semibold text-sm flex items-center gap-2 text-[#1d1d1f]">
                <Home className="w-4 h-4 text-[#007AFF]" /> Acquisition
              </h2>
              <InputRow label="Prix d'achat" value={inp.acquisitionPrice} onChange={set('acquisitionPrice')} step={5000} />
              <InputRow label="Frais de notaire" value={inp.notaryFees} onChange={set('notaryFees')} suffix="%" step={0.1} min={0} max={15} hint="Environ 7-8% dans l'ancien, 2-3% dans le neuf." />
            </section>

            {/* Revenus */}
            <section
              className="rounded-2xl border border-[#d2d2d7] p-5 space-y-4 bg-white"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <h2 className="font-semibold text-sm flex items-center gap-2 text-[#1d1d1f]">
                <Euro className="w-4 h-4 text-emerald-500" /> Revenus locatifs
              </h2>
              <InputRow label="Loyer mensuel" value={inp.monthlyRent} onChange={set('monthlyRent')} step={50} hint="Loyer hors charges." />
              <InputRow label="Taux de vacance" value={inp.vacancyRate} onChange={set('vacancyRate')} suffix="%" step={1} min={0} max={50} hint="Durée moyenne sans locataire en % de l'année." />
            </section>

            {/* Charges */}
            <section
              className="rounded-2xl border border-[#d2d2d7] p-5 space-y-4 bg-white"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <h2 className="font-semibold text-sm flex items-center gap-2 text-[#1d1d1f]">
                <TrendingDown className="w-4 h-4 text-amber-500" /> Charges annuelles
              </h2>
              <InputRow label="Charges diverses" value={inp.annualCharges} onChange={set('annualCharges')} hint="Copropriété, assurance PNO, entretien." />
              <InputRow label="Taxe foncière" value={inp.propertyTax} onChange={set('propertyTax')} />
              <InputRow label="Taux d'imposition" value={inp.taxRate} onChange={set('taxRate')} suffix="%" step={1} min={0} max={65} hint="Votre tranche marginale d'imposition (TMI)." />
            </section>

            {/* Financement */}
            <section
              className="rounded-2xl border border-[#d2d2d7] p-5 space-y-4 bg-white"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <h2 className="font-semibold text-sm flex items-center gap-2 text-[#1d1d1f]">
                <TrendingUp className="w-4 h-4 text-[#007AFF]" /> Financement
                <span className="text-xs font-normal text-[#86868b]">(optionnel)</span>
              </h2>
              <InputRow label="Montant emprunté" value={inp.loanAmount} onChange={set('loanAmount')} step={5000} />
              <InputRow label="Taux annuel" value={inp.loanRate} onChange={set('loanRate')} suffix="%" step={0.1} min={0} max={10} />
              <InputRow label="Durée" value={inp.loanDuration} onChange={set('loanDuration')} suffix="ans" step={1} min={1} max={30} />
            </section>
          </div>

          {/* ── RIGHT: Results ─────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Summary banner */}
            <div
              className="rounded-2xl p-5 text-white"
              style={{ backgroundColor: '#1d1d1f' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Synthèse de l'investissement</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Investissement total</p>
                  <p className="text-2xl font-extrabold">{fmt(res.totalInvestment, 0)} €</p>
                  <p className="text-xs text-slate-500 mt-0.5">Prix + frais de notaire</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Loyer annuel effectif</p>
                  <p className="text-2xl font-extrabold">{fmt(res.annualRentEffective, 0)} €</p>
                  <p className="text-xs text-slate-500 mt-0.5">Après vacance locative</p>
                </div>
              </div>
            </div>

            {/* Yields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <KpiCard
                label="Rentabilité brute"
                value={`${fmt(res.grossYield)} %`}
                sub="Formule Loi ALUR"
                color={yieldColor(res.grossYield)}
                style={yieldBg(res.grossYield)}
                icon={<YieldIcon pct={res.grossYield} />}
              />
              <KpiCard
                label="Rentabilité nette"
                value={`${fmt(res.netYieldBeforeTax)} %`}
                sub="Avant impôts"
                color={yieldColor(res.netYieldBeforeTax)}
                style={yieldBg(res.netYieldBeforeTax)}
                icon={<YieldIcon pct={res.netYieldBeforeTax} />}
              />
              <KpiCard
                label="Rentabilité nette nette"
                value={`${fmt(res.netYieldAfterTax)} %`}
                sub={`Après TMI ${inp.taxRate}%`}
                color={yieldColor(res.netYieldAfterTax)}
                style={yieldBg(res.netYieldAfterTax)}
                icon={<YieldIcon pct={res.netYieldAfterTax} />}
              />
            </div>

            {/* Cashflow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className="rounded-2xl border border-[#d2d2d7] p-5 bg-white"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#86868b]">
                    Cash-flow mensuel
                  </p>
                  <CashflowIcon cf={res.monthlyCashflow} />
                </div>
                <p className="text-3xl font-extrabold" style={{ color: cashflowColor }}>
                  {res.monthlyCashflow >= 0 ? '+' : ''}{fmt(res.monthlyCashflow)} €
                </p>
                <p className="text-xs mt-1 text-[#86868b]">
                  Mensualité crédit : {fmt(res.monthlyPayment)} €/mois
                </p>
                <div className="mt-3 pt-3 border-t border-[#d2d2d7]">
                  <p className="text-sm font-medium text-[#515154]">
                    Cash-flow annuel :
                    <span className="ml-2 font-bold" style={{ color: cashflowColor }}>
                      {res.annualCashflow >= 0 ? '+' : ''}{fmt(res.annualCashflow, 0)} €
                    </span>
                  </p>
                </div>
              </div>

              <div
                className="rounded-2xl border border-[#d2d2d7] p-5 bg-white"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide mb-3 text-[#86868b]">
                  Horizon temporel
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[#515154]">Point mort</p>
                    <p className="text-xl font-bold text-[#1d1d1f]">
                      {res.breakEvenYears === Infinity ? '∞' : `${res.breakEvenYears} ans`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#515154]">ROI sur 10 ans</p>
                    <p
                      className="text-xl font-bold"
                      style={{ color: res.roi10y >= 50 ? '#059669' : res.roi10y >= 20 ? '#d97706' : '#dc2626' }}
                    >
                      {fmt(res.roi10y, 1)} %
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulas reference */}
            <div
              className="rounded-2xl border border-[#d2d2d7] p-4"
              style={{ backgroundColor: '#f5f5f7' }}
            >
              <p className="text-xs font-semibold mb-2 text-[#515154]">
                Formules utilisées
              </p>
              <div className="space-y-1 text-xs font-mono text-[#86868b]">
                <p>Brute = (Loyer × 12 × (1 − vacance)) / Investissement total × 100</p>
                <p>Nette = (Brute − charges − taxe foncière) / Investissement total × 100</p>
                <p>Cash-flow = Loyer effectif − Mensualité − Charges mensualisées</p>
              </div>
            </div>

            {/* Interpretation guide */}
            <div
              className="rounded-2xl border border-[#d2d2d7] p-4 space-y-2 bg-white"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <p className="text-xs font-semibold text-[#515154]">
                Guide d'interprétation
              </p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-[#515154]">≥ 6 % — Excellent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-[#515154]">4–6 % — Correct</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-[#515154]">{'< 4 %'} — Faible</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  )
}
