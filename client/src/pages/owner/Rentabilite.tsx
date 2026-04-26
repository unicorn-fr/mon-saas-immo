import { useState, useMemo } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { Layout } from '../../components/layout/Layout'
import {
  Home, Euro, Calendar, Percent,
  ChevronDown, ChevronUp, Info, Calculator, Landmark,
} from 'lucide-react'

// ─── Maison Design Tokens ─────────────────────────────────────────────────────


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

    // Amortissement année 1
    const amort1 = s.avecPret ? calcAmortissement(s.montantPret, s.tauxPret, s.dureePret, 1) : { interets: 0, capital: 0, solde: s.montantPret }
    const interetsAnnee1 = amort1.interets
    const capitalRestant = amort1.solde

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

  function upd<K extends keyof State>(key: K, value: State[K]) {
    setS(prev => ({ ...prev, [key]: value }))
  }

  const regimesDisponibles = REGIMES.filter(r => {
    if (s.typeInvestisseur === 'sci') return r.forSCI !== false
    return !r.forSCI
  })

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Page Header */}
          <div className="mb-8">
            <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: '6px' }}>
              Propriétaire
            </p>
            <h1 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(32px,5vw,44px)', color: BAI.ink, lineHeight: 1.1, marginBottom: '8px' }}>
              Simulateur de rentabilité
            </h1>
            <p style={{ fontSize: '14px', color: BAI.inkMid, maxWidth: '560px' }}>
              Calculez votre rendement net, votre cash-flow, vos impôts et le moment où votre prêt sera remboursé — en tenant compte de votre situation fiscale.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

            {/* ── Formulaire ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-5">

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

              {/* Disclaimer */}
              <p style={{ fontSize: '11px', color: BAI.inkFaint, lineHeight: 1.6, padding: '0 4px' }}>
                Les résultats sont des estimations indicatives. Consultez un conseiller fiscal pour une analyse personnalisée.
              </p>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
