import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Euro, Home, Info, ArrowLeft,
  TrendingDown, Minus, CheckCircle, AlertTriangle, XCircle,
} from 'lucide-react'
import { Layout } from '../components/layout/Layout'

// ─── Maison tokens ────────────────────────────────────────────────────────────

const M = {
  bg: '#fafaf8', surface: '#ffffff', muted: '#f4f2ee', inputBg: '#f8f7f4',
  ink: '#0d0c0a', inkMid: '#5a5754', inkFaint: '#9e9b96',
  night: '#1a1a2e', caramel: '#c4976a', caramelLight: '#fdf5ec',
  owner: '#1a3270', ownerLight: '#eaf0fb',
  tenant: '#1b5e3b', tenantLight: '#edf7f2',
  border: '#e4e1db',
  danger: '#9b1c1c', dangerBg: '#fef2f2',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

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
  if (pct >= 6) return M.tenant
  if (pct >= 4) return M.caramel
  return M.danger
}

function yieldBg(pct: number): React.CSSProperties {
  if (pct >= 6) return { backgroundColor: M.tenantLight, borderColor: '#a7d7b8' }
  if (pct >= 4) return { backgroundColor: M.caramelLight, borderColor: '#e8c99a' }
  return { backgroundColor: M.dangerBg, borderColor: '#f8b4b4' }
}

function YieldIcon({ pct }: { pct: number }) {
  if (pct >= 6) return <CheckCircle className="w-5 h-5" style={{ color: M.tenant }} />
  if (pct >= 4) return <AlertTriangle className="w-5 h-5" style={{ color: M.caramel }} />
  return <XCircle className="w-5 h-5" style={{ color: M.danger }} />
}

function CashflowIcon({ cf }: { cf: number }) {
  if (cf > 0) return <TrendingUp className="w-5 h-5" style={{ color: M.tenant }} />
  if (cf === 0) return <Minus className="w-5 h-5" style={{ color: M.inkFaint }} />
  return <TrendingDown className="w-5 h-5" style={{ color: M.danger }} />
}

// ─── Input Row ────────────────────────────────────────────────────────────────

function InputRow({
  label, hint, value, onChange, suffix = '€', min = 0, step = 1000, max,
}: {
  label: string; hint?: string; value: number; onChange: (v: number) => void
  suffix?: string; min?: number; step?: number; max?: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label
          style={{
            fontFamily: M.body,
            fontSize: '12px',
            fontWeight: 500,
            color: M.inkFaint,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </label>
        {hint && (
          <span title={hint}>
            <Info className="w-3.5 h-3.5 cursor-help" style={{ color: M.inkFaint }} />
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
          style={{
            width: '100%',
            paddingRight: '40px',
            paddingLeft: '12px',
            paddingTop: '10px',
            paddingBottom: '10px',
            borderRadius: '8px',
            border: `1px solid ${M.border}`,
            backgroundColor: M.inputBg,
            color: M.ink,
            fontFamily: M.body,
            fontSize: '14px',
            fontWeight: 500,
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = M.night
            e.currentTarget.style.boxShadow = `0 0 0 3px rgba(26,26,46,0.08)`
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = M.border
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ fontFamily: M.body, fontSize: '13px', color: M.inkFaint }}
        >
          {suffix}
        </span>
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color = M.ink, style: cardStyle, icon,
}: {
  label: string; value: string; sub?: string; color?: string; style?: React.CSSProperties
  icon?: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col gap-1"
      style={{
        backgroundColor: M.surface,
        border: `1px solid ${M.border}`,
        borderRadius: '10px',
        padding: '16px',
        ...cardStyle,
      }}
    >
      <div className="flex items-center justify-between">
        <p
          style={{
            fontFamily: M.body,
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: M.inkFaint,
          }}
        >
          {label}
        </p>
        {icon}
      </div>
      <p
        style={{
          fontFamily: M.display,
          fontSize: '44px',
          fontWeight: 600,
          color,
          lineHeight: 1,
          marginTop: '4px',
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontFamily: M.body, fontSize: '12px', color: M.inkFaint, marginTop: '2px' }}>
          {sub}
        </p>
      )}
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

// ─── Section wrapper ──────────────────────────────────────────────────────────

function InputSection({ icon, title, note, children }: {
  icon: React.ReactNode; title: string; note?: string; children: React.ReactNode
}) {
  return (
    <section
      style={{
        backgroundColor: M.surface,
        border: `1px solid ${M.border}`,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(13,12,10,0.04)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 style={{ fontFamily: M.body, fontSize: '13px', fontWeight: 600, color: M.ink }}>
          {title}
        </h2>
        {note && (
          <span style={{ fontFamily: M.body, fontSize: '12px', color: M.inkFaint }}>
            {note}
          </span>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Calculateur() {
  const [inp, setInp] = useState<Inputs>(DEFAULT)
  const set = (key: keyof Inputs) => (v: number) => setInp((p) => ({ ...p, [key]: v }))

  const res = useMemo(() => engine(inp), [inp])

  const cashflowColor = res.monthlyCashflow > 0 ? M.tenant : res.monthlyCashflow < 0 ? M.danger : M.inkFaint

  return (
    <Layout>
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
        style={{ fontFamily: M.body, backgroundColor: M.bg }}
      >

        {/* Header */}
        <div className="mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ fontFamily: M.body, fontSize: '13px', color: M.inkFaint, marginBottom: '20px', display: 'inline-flex' }}
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>

          <p
            style={{
              fontFamily: M.body,
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: M.caramel,
              marginBottom: '8px',
            }}
          >
            Outil
          </p>
          <h1
            style={{
              fontFamily: M.display,
              fontStyle: 'italic',
              fontSize: '40px',
              fontWeight: 600,
              color: M.ink,
              lineHeight: 1.15,
            }}
          >
            Calculateur de Rentabilité
          </h1>
          <p
            style={{
              fontFamily: M.body,
              fontSize: '15px',
              color: M.inkMid,
              marginTop: '8px',
            }}
          >
            Évaluez la performance locative de n'importe quel bien en quelques secondes.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── LEFT: Inputs ───────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            <InputSection
              icon={<Home className="w-4 h-4" style={{ color: M.owner }} />}
              title="Acquisition"
            >
              <InputRow label="Prix d'achat" value={inp.acquisitionPrice} onChange={set('acquisitionPrice')} step={5000} />
              <InputRow label="Frais de notaire" value={inp.notaryFees} onChange={set('notaryFees')} suffix="%" step={0.1} min={0} max={15} hint="Environ 7-8% dans l'ancien, 2-3% dans le neuf." />
            </InputSection>

            <InputSection
              icon={<Euro className="w-4 h-4" style={{ color: M.tenant }} />}
              title="Revenus locatifs"
            >
              <InputRow label="Loyer mensuel" value={inp.monthlyRent} onChange={set('monthlyRent')} step={50} hint="Loyer hors charges." />
              <InputRow label="Taux de vacance" value={inp.vacancyRate} onChange={set('vacancyRate')} suffix="%" step={1} min={0} max={50} hint="Durée moyenne sans locataire en % de l'année." />
            </InputSection>

            <InputSection
              icon={<TrendingDown className="w-4 h-4" style={{ color: M.caramel }} />}
              title="Charges annuelles"
            >
              <InputRow label="Charges diverses" value={inp.annualCharges} onChange={set('annualCharges')} hint="Copropriété, assurance PNO, entretien." />
              <InputRow label="Taxe foncière" value={inp.propertyTax} onChange={set('propertyTax')} />
              <InputRow label="Taux d'imposition" value={inp.taxRate} onChange={set('taxRate')} suffix="%" step={1} min={0} max={65} hint="Votre tranche marginale d'imposition (TMI)." />
            </InputSection>

            <InputSection
              icon={<TrendingUp className="w-4 h-4" style={{ color: M.owner }} />}
              title="Financement"
              note="(optionnel)"
            >
              <InputRow label="Montant emprunté" value={inp.loanAmount} onChange={set('loanAmount')} step={5000} />
              <InputRow label="Taux annuel" value={inp.loanRate} onChange={set('loanRate')} suffix="%" step={0.1} min={0} max={10} />
              <InputRow label="Durée" value={inp.loanDuration} onChange={set('loanDuration')} suffix="ans" step={1} min={1} max={30} />
            </InputSection>
          </div>

          {/* ── RIGHT: Results ─────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Summary banner */}
            <div
              style={{
                backgroundColor: M.night,
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <p
                style={{
                  fontFamily: M.body,
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                  marginBottom: '16px',
                }}
              >
                Synthèse de l'investissement
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p style={{ fontFamily: M.body, fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                    Investissement total
                  </p>
                  <p
                    style={{
                      fontFamily: M.display,
                      fontSize: '32px',
                      fontWeight: 600,
                      color: '#ffffff',
                      lineHeight: 1,
                    }}
                  >
                    {fmt(res.totalInvestment, 0)} €
                  </p>
                  <p style={{ fontFamily: M.body, fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                    Prix + frais de notaire
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: M.body, fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                    Loyer annuel effectif
                  </p>
                  <p
                    style={{
                      fontFamily: M.display,
                      fontSize: '32px',
                      fontWeight: 600,
                      color: '#ffffff',
                      lineHeight: 1,
                    }}
                  >
                    {fmt(res.annualRentEffective, 0)} €
                  </p>
                  <p style={{ fontFamily: M.body, fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                    Après vacance locative
                  </p>
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
                style={{
                  backgroundColor: M.surface,
                  border: `1px solid ${M.border}`,
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(13,12,10,0.04)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p
                    style={{
                      fontFamily: M.body,
                      fontSize: '11px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: M.inkFaint,
                    }}
                  >
                    Cash-flow mensuel
                  </p>
                  <CashflowIcon cf={res.monthlyCashflow} />
                </div>
                <p
                  style={{
                    fontFamily: M.display,
                    fontSize: '44px',
                    fontWeight: 600,
                    color: cashflowColor,
                    lineHeight: 1,
                  }}
                >
                  {res.monthlyCashflow >= 0 ? '+' : ''}{fmt(res.monthlyCashflow)} €
                </p>
                <p style={{ fontFamily: M.body, fontSize: '12px', color: M.inkFaint, marginTop: '6px' }}>
                  Mensualité crédit : {fmt(res.monthlyPayment)} €/mois
                </p>
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${M.border}`,
                  }}
                >
                  <p style={{ fontFamily: M.body, fontSize: '13px', color: M.inkMid }}>
                    Cash-flow annuel :
                    <span
                      style={{
                        marginLeft: '8px',
                        fontWeight: 700,
                        color: cashflowColor,
                      }}
                    >
                      {res.annualCashflow >= 0 ? '+' : ''}{fmt(res.annualCashflow, 0)} €
                    </span>
                  </p>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: M.surface,
                  border: `1px solid ${M.border}`,
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(13,12,10,0.04)',
                }}
              >
                <p
                  style={{
                    fontFamily: M.body,
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: M.inkFaint,
                    marginBottom: '16px',
                  }}
                >
                  Horizon temporel
                </p>
                <div className="space-y-4">
                  <div>
                    <p style={{ fontFamily: M.body, fontSize: '13px', color: M.inkMid, marginBottom: '2px' }}>
                      Point mort
                    </p>
                    <p
                      style={{
                        fontFamily: M.display,
                        fontSize: '32px',
                        fontWeight: 600,
                        color: M.owner,
                        lineHeight: 1,
                      }}
                    >
                      {res.breakEvenYears === Infinity ? '∞' : `${res.breakEvenYears} ans`}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: M.body, fontSize: '13px', color: M.inkMid, marginBottom: '2px' }}>
                      ROI sur 10 ans
                    </p>
                    <p
                      style={{
                        fontFamily: M.display,
                        fontSize: '32px',
                        fontWeight: 600,
                        color: res.roi10y >= 50 ? M.tenant : res.roi10y >= 20 ? M.caramel : M.danger,
                        lineHeight: 1,
                      }}
                    >
                      {fmt(res.roi10y, 1)} %
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulas reference */}
            <div
              style={{
                backgroundColor: M.muted,
                border: `1px solid ${M.border}`,
                borderRadius: '10px',
                padding: '16px 20px',
              }}
            >
              <p
                style={{
                  fontFamily: M.body,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: M.inkMid,
                  marginBottom: '8px',
                }}
              >
                Formules utilisées
              </p>
              <div className="space-y-1.5" style={{ fontFamily: 'monospace', fontSize: '11px', color: M.inkFaint }}>
                <p>Brute = (Loyer × 12 × (1 − vacance)) / Investissement total × 100</p>
                <p>Nette = (Brute − charges − taxe foncière) / Investissement total × 100</p>
                <p>Cash-flow = Loyer effectif − Mensualité − Charges mensualisées</p>
              </div>
            </div>

            {/* Interpretation guide */}
            <div
              style={{
                backgroundColor: M.surface,
                border: `1px solid ${M.border}`,
                borderRadius: '10px',
                padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(13,12,10,0.04)',
              }}
            >
              <p
                style={{
                  fontFamily: M.body,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: M.inkMid,
                  marginBottom: '12px',
                }}
              >
                Guide d'interprétation
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-1.5">
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: M.tenant,
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontFamily: M.body, fontSize: '12px', color: M.inkMid }}>≥ 6 % — Excellent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: M.caramel,
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontFamily: M.body, fontSize: '12px', color: M.inkMid }}>4–6 % — Correct</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: M.danger,
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontFamily: M.body, fontSize: '12px', color: M.inkMid }}>{'< 4 %'} — Faible</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  )
}
