import { useState, useMemo, useEffect } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { PremiumGate } from '../../components/billing/PremiumGate'
import {
  Home, Euro, Calendar, Percent,
  ChevronDown, ChevronUp, Info, Calculator, Landmark,
} from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { useAuth } from '../../hooks/useAuth'

// ─── Shared light-area styles ─────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: BAI.bgSurface,
  border: `1px solid ${BAI.border}`,
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
}

const inputStyle: React.CSSProperties = {
  background: BAI.bgInput,
  border: `1px solid ${BAI.border}`,
  borderRadius: '8px',
  padding: '0.6rem 1rem',
  color: BAI.ink,
  fontSize: '16px',
  outline: 'none',
  width: '100%',
  fontFamily: BAI.fontBody,
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: BAI.inkFaint,
  marginBottom: '6px',
  display: 'block',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type RegimeImpot = 'micro_foncier' | 'reel' | 'lmnp_micro' | 'lmnp_reel' | 'sci_ir' | 'sci_is'
type TypeInvestisseur = 'particulier' | 'sci'

interface State {
  // Bien
  prixAchat: number
  fraisNotaire: number        // % du prix
  fraisAgence: number         // € fixe
  travauxAchat: number
  // Loyer
  loyerMensuel: number
  chargesLocataires: number   // charges récupérables
  tauxVacance: number         // % mois vides par an
  // Prêt
  avecPret: boolean
  montantPret: number
  tauxPret: number            // % annuel
  dureePret: number           // années
  dateDebutPret: string      // 'YYYY-MM-DD' ou ''
  fraisDossierPret: number
  assurancePret: number       // €/mois
  // Charges annuelles
  taxeFonciere: number
  chargesCopro: number        // charges non récupérables/an
  assurancePNO: number        // PNO annuel
  fraisGestion: number        // % des loyers ou 0
  entretienAnnuel: number
  // Fiscal
  typeInvestisseur: TypeInvestisseur
  trancheImposition: number   // TMI %
  regimeImpot: RegimeImpot
  // SCI IS spécifique
  tauxIS: number              // 15% ou 25%
}

const DEFAULT: State = {
  prixAchat: 200000,
  fraisNotaire: 7.5,
  fraisAgence: 0,
  travauxAchat: 0,
  loyerMensuel: 900,
  chargesLocataires: 80,
  tauxVacance: 5,
  avecPret: true,
  montantPret: 180000,
  tauxPret: 3.5,
  dureePret: 20,
  dateDebutPret: '',
  fraisDossierPret: 1000,
  assurancePret: 50,
  chargesCopro: 1200,
  taxeFonciere: 800,
  assurancePNO: 180,
  fraisGestion: 0,
  entretienAnnuel: 500,
  typeInvestisseur: 'particulier',
  trancheImposition: 30,
  regimeImpot: 'micro_foncier',
  tauxIS: 15,
}

// ─── Calculation engine ───────────────────────────────────────────────────────

function calcMensualitePret(montant: number, tauxAnnuel: number, dureeAns: number): number {
  if (!montant || !tauxAnnuel || !dureeAns) return 0
  const r = tauxAnnuel / 100 / 12
  const n = dureeAns * 12
  if (r === 0) return montant / n
  return (montant * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function calcAmortissement(montant: number, tauxAnnuel: number, dureeAns: number, anneeN: number) {
  // Retourne { capitalRestant, interetsPaiesAnnee, capitalRembourseAnnee }
  const r = tauxAnnuel / 100 / 12
  const n = dureeAns * 12
  const mensualite = calcMensualitePret(montant, tauxAnnuel, dureeAns)
  let solde = montant
  let interets = 0
  let capital = 0
  for (let mois = 1; mois <= n; mois++) {
    const interetsMois = solde * r
    const capitalMois = mensualite - interetsMois
    const annee = Math.ceil(mois / 12)
    if (annee === anneeN) { interets += interetsMois; capital += capitalMois }
    solde -= capitalMois
    if (solde < 0) solde = 0
  }
  return { interets, capital, solde: Math.max(0, solde) }
}

function useCalculs(s: State) {
  return useMemo(() => {
    const investissementTotal = s.prixAchat * (1 + s.fraisNotaire / 100) + s.fraisAgence + s.travauxAchat + (s.avecPret ? s.fraisDossierPret : 0)
    const apportPersonnel = s.avecPret ? investissementTotal - s.montantPret : investissementTotal

    const loyerBrutAnnuel = s.loyerMensuel * 12 * (1 - s.tauxVacance / 100)
    const revenusBruts = loyerBrutAnnuel // hors charges récupérables pour impôts

    const mensualitePret = calcMensualitePret(s.montantPret, s.tauxPret, s.dureePret)
    const assurancePretAnnuelle = s.assurancePret * 12
    const coutCreditTotal = s.avecPret ? mensualitePret * s.dureePret * 12 + assurancePretAnnuelle * s.dureePret - s.montantPret : 0

    // Charges annuelles hors prêt
    const chargesAnnuelles = s.taxeFonciere + s.chargesCopro + s.assurancePNO + (s.fraisGestion / 100) * revenusBruts + s.entretienAnnuel

    // Année actuelle du prêt (basée sur dateDebutPret ou année 1 par défaut)
    const anneeActuelle = s.avecPret && s.dateDebutPret
      ? Math.max(1, Math.min(Math.ceil((Date.now() - new Date(s.dateDebutPret).getTime()) / (365.25 * 24 * 3600 * 1000)), s.dureePret))
      : 1

    // Amortissement à l'année actuelle
    const amortN = s.avecPret ? calcAmortissement(s.montantPret, s.tauxPret, s.dureePret, anneeActuelle) : { interets: 0, capital: 0, solde: s.montantPret }
    const interetsAnnee1 = amortN.interets
    const capitalRestant = amortN.solde
    const capitalRembourse = s.montantPret - capitalRestant
    const anneeActuelleOut = anneeActuelle
    const progressionRemboursement = s.montantPret > 0 ? (capitalRembourse / s.montantPret) * 100 : 0

    // ── Calcul fiscal ──────────────────────────────────────────────────────────

    let impotAnnuel = 0
    let baseImposable = 0
    let detailImpot = ''

    if (s.regimeImpot === 'micro_foncier') {
      // Abattement 30%
      baseImposable = revenusBruts * 0.70
      const IR = baseImposable * (s.trancheImposition / 100)
      const PS = baseImposable * 0.172
      impotAnnuel = IR + PS
      detailImpot = `Base : ${fmt(baseImposable)} € (abattement 30%) · IR ${s.trancheImposition}% + PS 17,2%`
    } else if (s.regimeImpot === 'reel') {
      baseImposable = revenusBruts - chargesAnnuelles - interetsAnnee1 - assurancePretAnnuelle
      if (baseImposable < 0) baseImposable = 0
      const IR = baseImposable * (s.trancheImposition / 100)
      const PS = baseImposable * 0.172
      impotAnnuel = IR + PS
      detailImpot = `Base : ${fmt(baseImposable)} € (revenus − charges − intérêts) · IR ${s.trancheImposition}% + PS 17,2%`
    } else if (s.regimeImpot === 'lmnp_micro') {
      // Abattement 50%
      baseImposable = revenusBruts * 0.50
      const IR = baseImposable * (s.trancheImposition / 100)
      const PS = baseImposable * 0.172
      impotAnnuel = IR + PS
      detailImpot = `Base : ${fmt(baseImposable)} € (abattement 50% LMNP) · IR ${s.trancheImposition}% + PS 17,2%`
    } else if (s.regimeImpot === 'lmnp_reel') {
      // LMNP réel : amortissement du bien + charges
      const amortissementBien = s.prixAchat / 25 // 25 ans pour le bâti
      baseImposable = revenusBruts - chargesAnnuelles - interetsAnnee1 - assurancePretAnnuelle - amortissementBien
      if (baseImposable < 0) baseImposable = 0
      impotAnnuel = baseImposable === 0 ? 0 : baseImposable * ((s.trancheImposition + 17.2) / 100)
      detailImpot = `Base : ${fmt(baseImposable)} € (après amortissement ${fmt(amortissementBien)} €) · souvent nul`
    } else if (s.regimeImpot === 'sci_ir') {
      baseImposable = revenusBruts - chargesAnnuelles - interetsAnnee1 - assurancePretAnnuelle
      if (baseImposable < 0) baseImposable = 0
      const IR = baseImposable * (s.trancheImposition / 100)
      const PS = baseImposable * 0.172
      impotAnnuel = IR + PS
      detailImpot = `SCI à l'IR : base ${fmt(baseImposable)} € · IR ${s.trancheImposition}% + PS 17,2%`
    } else if (s.regimeImpot === 'sci_is') {
      // IS : bénéfice = revenus - charges - intérêts - amortissement
      const amortissement = s.prixAchat / 25
      const resultatAvantIS = revenusBruts - chargesAnnuelles - interetsAnnee1 - assurancePretAnnuelle - amortissement
      const benefice = Math.max(0, resultatAvantIS)
      impotAnnuel = benefice * (s.tauxIS / 100)
      detailImpot = `SCI à l'IS : bénéfice ${fmt(benefice)} € · IS ${s.tauxIS}%`
    }

    // ── Cash-flow ──────────────────────────────────────────────────────────────

    const coutMensuelPret = s.avecPret ? mensualitePret + s.assurancePret : 0
    const chargesMensuelles = chargesAnnuelles / 12
    const impotMensuel = impotAnnuel / 12
    const cashflowMensuelBrut = s.loyerMensuel - coutMensuelPret - chargesMensuelles
    const cashflowMensuelNet = cashflowMensuelBrut - impotMensuel

    const cashflowAnnuelBrut = cashflowMensuelBrut * 12
    const cashflowAnnuelNet = cashflowMensuelNet * 12

    // ── Rendements ─────────────────────────────────────────────────────────────

    const rendementBrut = (revenusBruts / investissementTotal) * 100
    const rendementNet = ((revenusBruts - chargesAnnuelles) / investissementTotal) * 100
    const rendementNetNet = ((revenusBruts - chargesAnnuelles - impotAnnuel) / investissementTotal) * 100

    // ── Fin du prêt ────────────────────────────────────────────────────────────

    const datefinPret = s.avecPret
      ? new Date(Date.now() + s.dureePret * 365.25 * 24 * 3600 * 1000)
      : null

    const cashflowApresRemboursement = s.avecPret
      ? s.loyerMensuel - chargesMensuelles - impotMensuel
      : cashflowMensuelNet

    // Gain net cumulé sur durée du prêt
    const gainNetCumule = cashflowAnnuelNet * s.dureePret

    return {
      investissementTotal,
      apportPersonnel,
      loyerBrutAnnuel,
      revenusBruts,
      chargesAnnuelles,
      mensualitePret,
      assurancePretAnnuelle,
      coutCreditTotal,
      interetsAnnee1,
      capitalRestant,
      capitalRembourse,
      anneeActuelleOut,
      progressionRemboursement,
      impotAnnuel,
      baseImposable,
      detailImpot,
      coutMensuelPret,
      chargesMensuelles,
      impotMensuel,
      cashflowMensuelBrut,
      cashflowMensuelNet,
      cashflowAnnuelBrut,
      cashflowAnnuelNet,
      rendementBrut,
      rendementNet,
      rendementNetNet,
      datefinPret,
      cashflowApresRemboursement,
      gainNetCumule,
    }
  }, [s])
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR')
}

function fmtDec(n: number, d = 2): string {
  return n.toFixed(d).replace('.', ',')
}

function NumInput({
  label, value, onChange, unit = '€', min = 0, step = 100, hint
}: {
  label: string; value: number; onChange: (v: number) => void
  unit?: string; min?: number; step?: number; hint?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div className="relative flex items-center">
        <input
          type="number"
          value={value || ''}
          min={min}
          step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{ ...inputStyle, paddingRight: unit.length > 1 ? '3.5rem' : '2.5rem' }}
          onFocus={e => { e.currentTarget.style.borderColor = BAI.night }}
          onBlur={e => { e.currentTarget.style.borderColor = BAI.border }}
        />
        <span style={{ position: 'absolute', right: '0.75rem', fontSize: '12px', color: BAI.inkFaint, pointerEvents: 'none' }}>
          {unit}
        </span>
      </div>
      {hint && <p style={{ fontSize: '11px', color: BAI.inkFaint, marginTop: '3px' }}>{hint}</p>}
    </div>
  )
}

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={cardStyle}>
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: BAI.caramel }}>{icon}</span>
          <span style={{ fontFamily: BAI.fontDisplay, fontWeight: 700, fontSize: '18px', color: BAI.ink }}>{title}</span>
        </div>
        {open ? <ChevronUp size={16} style={{ color: BAI.inkFaint }} /> : <ChevronDown size={16} style={{ color: BAI.inkFaint }} />}
      </button>
      {open && <div className="mt-4 flex flex-col gap-4">{children}</div>}
    </div>
  )
}

function KPI({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  const color = positive === undefined ? BAI.ink : positive ? BAI.tenant : BAI.error
  return (
    <div style={{ background: BAI.bgMuted, borderRadius: '10px', padding: '1rem', border: `1px solid ${BAI.border}` }}>
      <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: '4px' }}>{label}</p>
      <p style={{ fontFamily: BAI.fontDisplay, fontWeight: 700, fontStyle: 'italic', fontSize: '22px', color, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: BAI.inkMid, marginTop: '3px' }}>{sub}</p>}
    </div>
  )
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <Info
        size={12}
        style={{ color: BAI.inkFaint, cursor: 'help', marginLeft: 4 }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <span style={{
          position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
          background: BAI.night, color: '#fff', fontSize: '11px', padding: '6px 10px',
          borderRadius: '6px', whiteSpace: 'pre-wrap', zIndex: 10, maxWidth: '220px',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}

const REGIMES: { value: RegimeImpot; label: string; desc: string; forSCI?: boolean }[] = [
  { value: 'micro_foncier', label: 'Micro-foncier', desc: 'Abattement forfaitaire 30%. Revenus < 15 000 €/an. Location nue.' },
  { value: 'reel', label: 'Réel (foncier)', desc: 'Déduction charges réelles + intérêts. Location nue.' },
  { value: 'lmnp_micro', label: 'LMNP Micro-BIC', desc: 'Meublé. Abattement 50%. Revenus < 77 700 €.' },
  { value: 'lmnp_reel', label: 'LMNP Réel', desc: 'Meublé. Amortissement du bien — souvent 0 impôt.' },
  { value: 'sci_ir', label: 'SCI à l\'IR', desc: 'Transparence fiscale. Régime foncier standard.', forSCI: true },
  { value: 'sci_is', label: 'SCI à l\'IS', desc: 'IS 15% (< 42 500 €) ou 25%. Amortissement du bien.', forSCI: true },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Rentabilite() {
  const [s, setS] = useState<State>(DEFAULT)
  const c = useCalculs(s)

  const { user } = useAuth()
  const { myProperties, fetchMyProperties } = useProperties()
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  // Charger les biens du propriétaire
  useEffect(() => {
    fetchMyProperties()
  }, [])

  // Persistance localStorage — chargement
  useEffect(() => {
    if (!user?.id) return
    try {
      const key = `bailio_rentabilite_${user.id}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<State>
        setS(prev => ({ ...prev, ...parsed }))
      }
    } catch {}
  }, [user?.id])

  // Persistance localStorage — sauvegarde
  useEffect(() => {
    if (!user?.id) return
    try {
      localStorage.setItem(`bailio_rentabilite_${user.id}`, JSON.stringify(s))
    } catch {}
  }, [s, user?.id])

  function upd<K extends keyof State>(key: K, value: State[K]) {
    setS(prev => ({ ...prev, [key]: value }))
  }

  const regimesDisponibles = REGIMES.filter(r => {
    if (s.typeInvestisseur === 'sci') return r.forSCI !== false
    return !r.forSCI
  })

  return (
    <>      <div style={{ fontFamily: BAI.fontBody }}>

        {/* === DARK HERO === */}
        <div style={{ background: '#0a0d1a', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px) clamp(32px,5vw,56px)' }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, margin: 0 }}>
            PROPRIÉTAIRE
          </p>
          <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,42px)', fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: '6px 0 8px', lineHeight: 1.1 }}>
            Simulateur de rentabilité
          </h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Calculez votre rendement net, cash-flow et impôts selon votre situation fiscale.
          </p>

          {/* Glass KPI cards */}
          <div className="flex flex-wrap gap-3" style={{ marginTop: 28 }}>
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.13)',
              borderRadius: 16, padding: '16px 24px', minWidth: 130,
            }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                Rendement brut
              </p>
              <p style={{ fontFamily: BAI.fontDisplay, fontSize: 36, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1 }}>
                {fmtDec(c.rendementBrut)} %
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.13)',
              borderRadius: 16, padding: '16px 24px', minWidth: 130,
            }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                Rendement net
              </p>
              <p style={{ fontFamily: BAI.fontDisplay, fontSize: 36, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1 }}>
                {fmtDec(c.rendementNet)} %
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.13)',
              borderRadius: 16, padding: '16px 24px', minWidth: 150,
            }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                Cash-flow net/mois
              </p>
              <p style={{
                fontFamily: BAI.fontDisplay, fontSize: 36, fontWeight: 700, fontStyle: 'italic',
                color: c.cashflowMensuelNet >= 0 ? 'rgba(159,212,186,1)' : 'rgba(252,165,165,1)',
                margin: 0, lineHeight: 1,
              }}>
                {c.cashflowMensuelNet >= 0 ? '+' : ''}{fmt(c.cashflowMensuelNet)} €
              </p>
            </div>
          </div>
        </div>

        {/* === LIGHT CONTENT === */}
        <PremiumGate
          requiredPlan="PRO"
          title="Analytics & Rentabilité"
          description="Visualisez la performance de votre patrimoine immobilier : TRI, rendement net, évolution des loyers, taux d'occupation. Disponible à partir du plan Pro."
        >
        <div style={{ background: BAI.bgBase, minHeight: '60vh', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px)' }}>
          <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

            {/* ── Formulaire ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-5">

              {/* ── Sélection d'un bien existant ─────────────────────────────────────── */}
              {myProperties.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(196,151,106,0.08) 0%, rgba(196,151,106,0.03) 100%)',
                  border: `1px solid ${BAI.caramelBorder}`,
                  borderRadius: 12,
                  padding: '16px 20px',
                }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 12px' }}>
                    Préremplir depuis un de vos biens
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSelectedPropertyId(null)}
                      style={{
                        padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: !selectedPropertyId ? BAI.night : BAI.bgSurface,
                        color: !selectedPropertyId ? '#fff' : BAI.inkMid,
                        border: `1px solid ${!selectedPropertyId ? BAI.night : BAI.border}`,
                        fontFamily: BAI.fontBody, transition: 'all 0.15s',
                      }}
                    >
                      Mode manuel
                    </button>
                    {myProperties.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPropertyId(p.id)
                          setS(prev => ({
                            ...prev,
                            loyerMensuel: Number(p.price) || prev.loyerMensuel,
                          }))
                        }}
                        style={{
                          padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          background: selectedPropertyId === p.id ? BAI.caramel : BAI.bgSurface,
                          color: selectedPropertyId === p.id ? '#fff' : BAI.ink,
                          border: `1px solid ${selectedPropertyId === p.id ? BAI.caramel : BAI.border}`,
                          fontFamily: BAI.fontBody, transition: 'all 0.15s',
                        }}
                      >
                        {p.title} · {Number(p.price).toLocaleString('fr-FR')} €/mois
                      </button>
                    ))}
                  </div>
                  {selectedPropertyId && (
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.caramel, margin: '8px 0 0' }}>
                      Loyer prérempli. Renseignez le prix d'achat et les autres paramètres manuellement.
                    </p>
                  )}
                </div>
              )}

              {/* Bien */}
              <Section title="Le bien" icon={<Home size={16} />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumInput label="Prix d'achat" value={s.prixAchat} onChange={v => upd('prixAchat', v)} step={5000} />
                  <NumInput label="Frais de notaire" value={s.fraisNotaire} onChange={v => upd('fraisNotaire', v)} unit="%" min={0} step={0.1} hint="~7,5% dans l'ancien, ~3% dans le neuf" />
                  <NumInput label="Frais d'agence achat" value={s.fraisAgence} onChange={v => upd('fraisAgence', v)} hint="0 si achat entre particuliers" />
                  <NumInput label="Travaux à l'achat" value={s.travauxAchat} onChange={v => upd('travauxAchat', v)} />
                </div>
              </Section>

              {/* Loyer */}
              <Section title="Loyer & occupation" icon={<Euro size={16} />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumInput label="Loyer mensuel (hors charges)" value={s.loyerMensuel} onChange={v => upd('loyerMensuel', v)} step={50} />
                  <NumInput label="Charges locataires (récupérables)" value={s.chargesLocataires} onChange={v => upd('chargesLocataires', v)} step={10} hint="Eau, chauffage collectif, etc." />
                  <NumInput label="Taux de vacance" value={s.tauxVacance} onChange={v => upd('tauxVacance', v)} unit="%" min={0} step={0.5} hint="Moyenne nationale : ~5%" />
                </div>
              </Section>

              {/* Prêt */}
              <Section title="Financement" icon={<Landmark size={16} />}>
                <div className="flex items-center gap-3 mb-2">
                  <label style={{ fontSize: '14px', color: BAI.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={s.avecPret} onChange={e => upd('avecPret', e.target.checked)} style={{ width: 16, height: 16, accentColor: BAI.night }} />
                    Financement avec prêt immobilier
                  </label>
                </div>
                {s.avecPret && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <NumInput label="Montant emprunté" value={s.montantPret} onChange={v => upd('montantPret', v)} step={5000} />
                    <NumInput label="Taux d'intérêt" value={s.tauxPret} onChange={v => upd('tauxPret', v)} unit="%" min={0} step={0.05} />
                    <NumInput label="Durée" value={s.dureePret} onChange={v => upd('dureePret', Math.min(30, Math.max(1, v)))} unit="ans" min={1} step={1} />
                    <NumInput label="Frais de dossier" value={s.fraisDossierPret} onChange={v => upd('fraisDossierPret', v)} step={100} />
                    <NumInput label="Assurance emprunteur" value={s.assurancePret} onChange={v => upd('assurancePret', v)} unit="€/mois" step={5} hint="ADI : ~0,30–0,60% du capital" />
                  </div>
                )}
                {s.avecPret && c.mensualitePret > 0 && (
                  <div style={{ background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, borderRadius: '8px', padding: '10px 14px' }}>
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                      <span style={{ fontSize: '13px', color: BAI.inkMid }}>
                        Mensualité (hors assurance) : <strong style={{ color: BAI.owner }}>{fmt(c.mensualitePret)} €/mois</strong>
                      </span>
                      <span style={{ fontSize: '13px', color: BAI.inkMid }}>
                        Total avec assurance : <strong style={{ color: BAI.owner }}>{fmt(c.mensualitePret + s.assurancePret)} €/mois</strong>
                      </span>
                      <span style={{ fontSize: '13px', color: BAI.inkMid }}>
                        Coût total du crédit : <strong style={{ color: BAI.owner }}>{fmt(c.coutCreditTotal)} €</strong>
                      </span>
                    </div>
                  </div>
                )}
                {s.avecPret && (
                  <div>
                    <label style={labelStyle}>Date de début du prêt</label>
                    <input
                      type="date"
                      value={s.dateDebutPret}
                      onChange={e => upd('dateDebutPret', e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                      style={{ ...inputStyle }}
                      onFocus={e => { e.currentTarget.style.borderColor = BAI.night }}
                      onBlur={e => { e.currentTarget.style.borderColor = BAI.border }}
                    />
                    <p style={{ fontSize: '11px', color: BAI.inkFaint, marginTop: '3px' }}>
                      Renseigner pour voir le capital actuel remboursé
                    </p>
                  </div>
                )}
              </Section>

              {/* Charges */}
              <Section title="Charges annuelles" icon={<Calculator size={16} />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumInput label="Taxe foncière" value={s.taxeFonciere} onChange={v => upd('taxeFonciere', v)} step={50} />
                  <NumInput label="Charges de copropriété (non récupérables)" value={s.chargesCopro} onChange={v => upd('chargesCopro', v)} step={100} />
                  <NumInput label="Assurance PNO" value={s.assurancePNO} onChange={v => upd('assurancePNO', v)} step={10} hint="Propriétaire Non Occupant" />
                  <NumInput label="Frais de gestion" value={s.fraisGestion} onChange={v => upd('fraisGestion', v)} unit="%" min={0} step={0.5} hint="0 si gestion directe, ~7–10% si agence" />
                  <NumInput label="Entretien & imprévus" value={s.entretienAnnuel} onChange={v => upd('entretienAnnuel', v)} step={100} hint="Prévoir ~1% de la valeur/an" />
                </div>
              </Section>

              {/* Fiscalité */}
              <Section title="Fiscalité" icon={<Percent size={16} />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Type d'investisseur</label>
                    <div className="flex gap-2">
                      {[
                        { val: 'particulier' as TypeInvestisseur, label: 'Particulier' },
                        { val: 'sci' as TypeInvestisseur, label: 'Via SCI' },
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => {
                            upd('typeInvestisseur', opt.val)
                            upd('regimeImpot', opt.val === 'sci' ? 'sci_ir' : 'micro_foncier')
                          }}
                          style={{
                            flex: 1, padding: '7px 12px', borderRadius: '7px',
                            fontFamily: BAI.fontBody, fontSize: '13px', cursor: 'pointer',
                            background: s.typeInvestisseur === opt.val ? BAI.night : BAI.bgMuted,
                            color: s.typeInvestisseur === opt.val ? '#ffffff' : BAI.inkMid,
                            border: `1px solid ${s.typeInvestisseur === opt.val ? BAI.night : BAI.border}`,
                            transition: 'all 0.15s',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Tranche marginale d'imposition (TMI) <Tooltip text="Appliquez votre TMI pour estimer l'impôt sur le revenu locatif." /></label>
                    <select
                      value={s.trancheImposition}
                      onChange={e => upd('trancheImposition', Number(e.target.value))}
                      style={{ ...inputStyle }}
                    >
                      {[0, 11, 30, 41, 45].map(t => (
                        <option key={t} value={t}>{t} %</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Régime fiscal</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {regimesDisponibles.map(r => (
                      <button
                        key={r.value}
                        onClick={() => upd('regimeImpot', r.value)}
                        className="text-left"
                        style={{
                          padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                          border: `1px solid ${s.regimeImpot === r.value ? BAI.caramel : BAI.border}`,
                          background: s.regimeImpot === r.value ? BAI.caramelLight : BAI.bgSurface,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 600, color: s.regimeImpot === r.value ? BAI.caramel : BAI.ink }}>{r.label}</div>
                        <div style={{ fontSize: '11px', color: BAI.inkFaint, marginTop: '2px', lineHeight: 1.4 }}>{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {(s.regimeImpot === 'sci_is') && (
                  <div>
                    <label style={labelStyle}>Taux IS</label>
                    <div className="flex gap-2">
                      {[{ val: 15, label: '15% (< 42 500 €)' }, { val: 25, label: '25%' }].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => upd('tauxIS', opt.val)}
                          style={{
                            flex: 1, padding: '7px 12px', borderRadius: '7px',
                            fontFamily: BAI.fontBody, fontSize: '13px', cursor: 'pointer',
                            background: s.tauxIS === opt.val ? BAI.night : BAI.bgMuted,
                            color: s.tauxIS === opt.val ? '#ffffff' : BAI.inkMid,
                            border: `1px solid ${s.tauxIS === opt.val ? BAI.night : BAI.border}`,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Section>

            </div>

            {/* ── Résultats (sticky) ─────────────────────────────────────── */}
            <div className="flex flex-col gap-4" style={{ alignSelf: 'start', position: 'sticky', top: '80px' }}>

              {/* Investissement */}
              <div style={cardStyle}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: '12px' }}>Investissement total</p>
                <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '32px', color: BAI.ink, lineHeight: 1, marginBottom: '4px' }}>
                  {fmt(c.investissementTotal)} €
                </p>
                {s.avecPret && (
                  <p style={{ fontSize: '13px', color: BAI.inkMid }}>
                    dont apport : <strong>{fmt(c.apportPersonnel)} €</strong>
                  </p>
                )}
              </div>

              {/* Rendements */}
              <div style={cardStyle}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: '12px' }}>Rendements</p>
                <div className="flex flex-col gap-3">
                  <KPI label="Rendement brut" value={`${fmtDec(c.rendementBrut)} %`} />
                  <KPI label="Rendement net (avant impôt)" value={`${fmtDec(c.rendementNet)} %`} positive={c.rendementNet >= 3} />
                  <KPI label="Rendement net net (après impôt)" value={`${fmtDec(c.rendementNetNet)} %`} positive={c.rendementNetNet >= 2} />
                </div>
              </div>

              {/* Cash-flow */}
              <div style={cardStyle}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: '12px' }}>Cash-flow mensuel</p>
                <div className="flex flex-col gap-3">
                  <KPI
                    label="Cash-flow brut (avant impôt)"
                    value={`${c.cashflowMensuelBrut >= 0 ? '+' : ''}${fmt(c.cashflowMensuelBrut)} €/mois`}
                    sub={`${c.cashflowAnnuelBrut >= 0 ? '+' : ''}${fmt(c.cashflowAnnuelBrut)} €/an`}
                    positive={c.cashflowMensuelBrut >= 0}
                  />
                  <KPI
                    label="Cash-flow net net (après impôt)"
                    value={`${c.cashflowMensuelNet >= 0 ? '+' : ''}${fmt(c.cashflowMensuelNet)} €/mois`}
                    sub={`${c.cashflowAnnuelNet >= 0 ? '+' : ''}${fmt(c.cashflowAnnuelNet)} €/an`}
                    positive={c.cashflowMensuelNet >= 0}
                  />
                </div>
              </div>

              {/* Impôts */}
              <div style={cardStyle}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: '12px' }}>Fiscalité annuelle</p>
                <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '26px', color: c.impotAnnuel === 0 ? BAI.tenant : BAI.ink, lineHeight: 1, marginBottom: '4px' }}>
                  {fmt(c.impotAnnuel)} €/an
                </p>
                <p style={{ fontSize: '11px', color: BAI.inkFaint, lineHeight: 1.5 }}>{c.detailImpot}</p>
              </div>

              {/* Fin du prêt */}
              {s.avecPret && c.datefinPret && (
                <div style={{ ...cardStyle, background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} style={{ color: BAI.owner }} />
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.owner }}>Fin du prêt</p>
                  </div>
                  <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '22px', color: BAI.owner }}>
                    {c.datefinPret.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                  <p style={{ fontSize: '12px', color: BAI.inkMid, marginTop: '4px' }}>
                    Capital restant dû (an 1) : {fmt(c.capitalRestant)} €
                  </p>
                  <div style={{ height: 1, background: BAI.ownerBorder, margin: '12px 0' }} />
                  <p style={{ fontSize: '13px', color: BAI.inkMid }}>
                    Après remboursement, cash-flow estimé :
                  </p>
                  <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: '20px', color: c.cashflowApresRemboursement >= 0 ? BAI.tenant : BAI.error, marginTop: '2px' }}>
                    {c.cashflowApresRemboursement >= 0 ? '+' : ''}{fmt(c.cashflowApresRemboursement)} €/mois
                  </p>
                  <p style={{ fontSize: '11px', color: BAI.inkFaint, marginTop: '4px' }}>
                    Gain net cumulé sur {s.dureePret} ans : {c.gainNetCumule >= 0 ? '+' : ''}{fmt(c.gainNetCumule)} €
                  </p>
                </div>
              )}

              {/* ── Barre de performance rentabilité ────────────────────────── */}
              <div style={{ ...cardStyle, overflow: 'hidden' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: '14px' }}>
                  Performance du bien
                </p>
                {(['brut', 'net', 'netnet'] as const).map((type) => {
                  const val = type === 'brut' ? c.rendementBrut : type === 'net' ? c.rendementNet : c.rendementNetNet
                  const label = type === 'brut' ? 'Brut' : type === 'net' ? 'Net' : 'Net-net'
                  const color = val >= 7 ? BAI.tenant : val >= 5 ? BAI.caramel : val >= 3 ? '#f59e0b' : BAI.error
                  const pct = Math.min(100, Math.max(0, (val / 10) * 100))
                  return (
                    <div key={type} style={{ marginBottom: type === 'netnet' ? 0 : 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid }}>{label}</span>
                        <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 14, fontWeight: 700, color }}>{fmtDec(val)} %</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: BAI.bgMuted, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${color}aa, ${color})`,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BAI.border}` }}>
                  {[{ l: '< 3%', c: BAI.error }, { l: '3–5%', c: '#f59e0b' }, { l: '5–7%', c: BAI.caramel }, { l: '> 7%', c: BAI.tenant }].map(({ l, c: col }) => (
                    <span key={l} style={{ fontSize: 10, color: col, fontFamily: BAI.fontBody, fontWeight: 600 }}>{l}</span>
                  ))}
                </div>
              </div>

              {/* ── Suivi remboursement prêt ──────────────────────────────────── */}
              {s.avecPret && s.montantPret > 0 && (
                <div style={{ ...cardStyle, background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}` }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.owner, marginBottom: '14px' }}>
                    Remboursement du crédit
                    {c.anneeActuelleOut > 1 && s.dateDebutPret && (
                      <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10, color: BAI.inkMid }}>
                        — An {c.anneeActuelleOut} / {s.dureePret}
                      </span>
                    )}
                  </p>
                  {/* Barre de remboursement */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid }}>Capital remboursé</span>
                      <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 14, fontWeight: 700, color: BAI.owner }}>
                        {fmt(c.capitalRembourse)} €
                      </span>
                    </div>
                    <div style={{ height: 10, borderRadius: 5, background: 'rgba(26,50,112,0.12)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 5,
                        width: `${c.progressionRemboursement}%`,
                        background: `linear-gradient(90deg, ${BAI.ownerBorder}, ${BAI.owner})`,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: BAI.inkFaint, fontFamily: BAI.fontBody }}>0 €</span>
                      <span style={{ fontSize: 11, color: BAI.owner, fontFamily: BAI.fontBody, fontWeight: 600 }}>
                        {Math.round(c.progressionRemboursement)} % remboursé
                      </span>
                      <span style={{ fontSize: 11, color: BAI.inkFaint, fontFamily: BAI.fontBody }}>{fmt(s.montantPret)} €</span>
                    </div>
                  </div>
                  {/* Capital restant */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${BAI.ownerBorder}` }}>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid }}>Capital restant dû</span>
                    <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 16, fontWeight: 700, color: BAI.owner }}>
                      {fmt(c.capitalRestant)} €
                    </span>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <p style={{ fontSize: '11px', color: BAI.inkFaint, lineHeight: 1.6, padding: '0 4px' }}>
                Les résultats sont des estimations indicatives. Consultez un conseiller fiscal pour une analyse personnalisée.
              </p>

            </div>
          </div>
          </div>
        </div>
        </PremiumGate>

      </div>
    </>  )
}
