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
  notaryFees: number          // % du prix
  monthlyRent: number
  annualCharges: number       // copro + assurance + entretien
  propertyTax: number         // taxe foncière
  vacancyRate: number         // % taux de vacance
  loanAmount: number
  loanRate: number            // %
  loanDuration: number        // années
  taxRate: number             // TMI en %
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

  // Rentabilité brute (sur investissement total)
  const grossYield = (annualRentEffective / totalInvestment) * 100

  // Revenu net avant impôt
  const annualNetBeforeTax = annualRentEffective - inp.annualCharges - inp.propertyTax
  const netYieldBeforeTax = (annualNetBeforeTax / totalInvestment) * 100

  // Impôt sur revenus fonciers
  const tax = Math.max(0, annualNetBeforeTax * (inp.taxRate / 100))
  const annualNetAfterTax = annualNetBeforeTax - tax
  const netYieldAfterTax = (annualNetAfterTax / totalInvestment) * 100

  // Mensualité crédit
  let monthlyPayment = 0
  if (inp.loanAmount > 0 && inp.loanRate > 0 && inp.loanDuration > 0) {
    const r = inp.loanRate / 100 / 12
    const n = inp.loanDuration * 12
    monthlyPayment = inp.loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  }

  // Cash-flow mensuel
  const monthlyChargesShare = (inp.annualCharges + inp.propertyTax) / 12
  const monthlyCashflow = inp.monthlyRent * (1 - inp.vacancyRate / 100) - monthlyPayment - monthlyChargesShare
  const annualCashflow = monthlyCashflow * 12

  // ROI sur 10 ans (capital + revenus nets cumulés)
  const equity = inp.acquisitionPrice - inp.loanAmount
  const roi10y = equity > 0 ? ((annualNetAfterTax * 10) / equity) * 100 : 0

  // Point mort (années)
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
  if (pct >= 6) return 'text-emerald-600'
  if (pct >= 4) return 'text-amber-500'
  return 'text-red-500'
}

function yieldBg(pct: number) {
  if (pct >= 6) return 'bg-emerald-50 border-emerald-200'
  if (pct >= 4) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

function YieldIcon({ pct }: { pct: number }) {
  if (pct >= 6) return <CheckCircle className="w-5 h-5 text-emerald-600" />
  if (pct >= 4) return <AlertTriangle className="w-5 h-5 text-amber-500" />
  return <XCircle className="w-5 h-5 text-red-500" />
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
        <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</label>
        {hint && (
          <span title={hint}>
            <Info className="w-3.5 h-3.5 cursor-help" style={{ color: 'var(--text-tertiary)' }} />
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
          className="input pr-10 w-full"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none"
          style={{ color: 'var(--text-tertiary)' }}>
          {suffix}
        </span>
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, colorClass = '', bgClass = '', icon,
}: {
  label: string; value: string; sub?: string; colorClass?: string; bgClass?: string
  icon?: React.ReactNode
}) {
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-1 ${bgClass}`}
      style={!bgClass ? { backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' } : undefined}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
        {icon}
      </div>
      <p className={`text-2xl font-extrabold tracking-tight ${colorClass}`}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>}
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

  const cashflowColor = res.monthlyCashflow > 0 ? 'text-emerald-600' : res.monthlyCashflow < 0 ? 'text-red-500' : 'text-slate-500'

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm mb-4 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-tertiary)' }}>
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #06b6d4 100%)' }}>
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Calculateur de Rentabilité
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Évaluez la performance locative de n'importe quel bien en quelques secondes.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── LEFT: Inputs ───────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Acquisition */}
            <section className="rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Home className="w-4 h-4 text-blue-500" /> Acquisition
              </h2>
              <InputRow label="Prix d'achat" value={inp.acquisitionPrice} onChange={set('acquisitionPrice')} step={5000} />
              <InputRow label="Frais de notaire" value={inp.notaryFees} onChange={set('notaryFees')} suffix="%" step={0.1} min={0} max={15} hint="Environ 7-8% dans l'ancien, 2-3% dans le neuf." />
            </section>

            {/* Revenus */}
            <section className="rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Euro className="w-4 h-4 text-emerald-500" /> Revenus locatifs
              </h2>
              <InputRow label="Loyer mensuel" value={inp.monthlyRent} onChange={set('monthlyRent')} step={50} hint="Loyer hors charges." />
              <InputRow label="Taux de vacance" value={inp.vacancyRate} onChange={set('vacancyRate')} suffix="%" step={1} min={0} max={50} hint="Durée moyenne sans locataire en % de l'année." />
            </section>

            {/* Charges */}
            <section className="rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <TrendingDown className="w-4 h-4 text-amber-500" /> Charges annuelles
              </h2>
              <InputRow label="Charges diverses" value={inp.annualCharges} onChange={set('annualCharges')} hint="Copropriété, assurance PNO, entretien." />
              <InputRow label="Taxe foncière" value={inp.propertyTax} onChange={set('propertyTax')} />
              <InputRow label="Taux d'imposition" value={inp.taxRate} onChange={set('taxRate')} suffix="%" step={1} min={0} max={65} hint="Votre tranche marginale d'imposition (TMI)." />
            </section>

            {/* Financement */}
            <section className="rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <TrendingUp className="w-4 h-4 text-violet-500" /> Financement
                <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>(optionnel)</span>
              </h2>
              <InputRow label="Montant emprunté" value={inp.loanAmount} onChange={set('loanAmount')} step={5000} />
              <InputRow label="Taux annuel" value={inp.loanRate} onChange={set('loanRate')} suffix="%" step={0.1} min={0} max={10} />
              <InputRow label="Durée" value={inp.loanDuration} onChange={set('loanDuration')} suffix="ans" step={1} min={1} max={30} />
            </section>
          </div>

          {/* ── RIGHT: Results ─────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Summary banner */}
            <div className="rounded-2xl p-5 text-white"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
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
                colorClass={yieldColor(res.grossYield)}
                bgClass={`rounded-2xl border p-4 flex flex-col gap-1 ${yieldBg(res.grossYield)}`}
                icon={<YieldIcon pct={res.grossYield} />}
              />
              <KpiCard
                label="Rentabilité nette"
                value={`${fmt(res.netYieldBeforeTax)} %`}
                sub="Avant impôts"
                colorClass={yieldColor(res.netYieldBeforeTax)}
                bgClass={`rounded-2xl border p-4 flex flex-col gap-1 ${yieldBg(res.netYieldBeforeTax)}`}
                icon={<YieldIcon pct={res.netYieldBeforeTax} />}
              />
              <KpiCard
                label="Rentabilité nette nette"
                value={`${fmt(res.netYieldAfterTax)} %`}
                sub={`Après TMI ${inp.taxRate}%`}
                colorClass={yieldColor(res.netYieldAfterTax)}
                bgClass={`rounded-2xl border p-4 flex flex-col gap-1 ${yieldBg(res.netYieldAfterTax)}`}
                icon={<YieldIcon pct={res.netYieldAfterTax} />}
              />
            </div>

            {/* Cashflow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border p-5"
                style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                    Cash-flow mensuel
                  </p>
                  <CashflowIcon cf={res.monthlyCashflow} />
                </div>
                <p className={`text-3xl font-extrabold ${cashflowColor}`}>
                  {res.monthlyCashflow >= 0 ? '+' : ''}{fmt(res.monthlyCashflow)} €
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Mensualité crédit : {fmt(res.monthlyPayment)} €/mois
                </p>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Cash-flow annuel :
                    <span className={`ml-2 font-bold ${cashflowColor}`}>
                      {res.annualCashflow >= 0 ? '+' : ''}{fmt(res.annualCashflow, 0)} €
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border p-5"
                style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  Horizon temporel
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Point mort</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {res.breakEvenYears === Infinity ? '∞' : `${res.breakEvenYears} ans`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>ROI sur 10 ans</p>
                    <p className={`text-xl font-bold ${res.roi10y >= 50 ? 'text-emerald-600' : res.roi10y >= 20 ? 'text-amber-500' : 'text-red-500'}`}>
                      {fmt(res.roi10y, 1)} %
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulas reference */}
            <div className="rounded-2xl border p-4"
              style={{ backgroundColor: 'var(--surface-subtle)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Formules utilisées
              </p>
              <div className="space-y-1 text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                <p>Brute = (Loyer × 12 × (1 − vacance)) / Investissement total × 100</p>
                <p>Nette = (Brute − charges − taxe foncière) / Investissement total × 100</p>
                <p>Cash-flow = Loyer effectif − Mensualité − Charges mensualisées</p>
              </div>
            </div>

            {/* Interpretation guide */}
            <div className="rounded-2xl border p-4 space-y-2"
              style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Guide d'interprétation
              </p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span style={{ color: 'var(--text-secondary)' }}>≥ 6 % — Excellent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <span style={{ color: 'var(--text-secondary)' }}>4–6 % — Correct</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span style={{ color: 'var(--text-secondary)' }}>{'< 4 %'} — Faible</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  )
}
