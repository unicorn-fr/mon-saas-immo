import { useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { TrendingUp, Calculator, ChevronDown } from 'lucide-react'

// ── IRL DATA (INSEE - trimestres récents) ────────────────────────────────────
const IRL_DATA: Record<string, number> = {
  '2024-T3': 145.28,
  '2024-T2': 144.59,
  '2024-T1': 143.46,
  '2023-T4': 142.06,
  '2023-T3': 140.59,
  '2023-T2': 139.57,
  '2023-T1': 138.64,
  '2022-T4': 136.27,
  '2022-T3': 135.84,
  '2022-T2': 133.93,
  '2022-T1': 131.67,
  '2021-T4': 129.38,
  '2021-T3': 128.47,
  '2021-T2': 127.77,
  '2021-T1': 127.22,
}

const IRL_QUARTERS = Object.keys(IRL_DATA).sort().reverse()

// ── Shared components ─────────────────────────────────────────────────────────
function Card({ children, title, icon: Icon, color }: { children: React.ReactNode; title: string; icon: React.ElementType; color: string }) {
  return (
    <div style={{
      background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
      borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.04)',
      marginBottom: 24,
    }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 20, fontWeight: 700, color: BAI.ink, margin: 0 }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: '24px' }}>
        {children}
      </div>
    </div>
  )
}

function InputRow({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '4px 0 0' }}>{hint}</p>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: `1px solid ${BAI.border}`, borderRadius: 8,
  fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink,
  background: BAI.bgBase, outline: 'none', boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none', cursor: 'pointer',
}

function ResultBox({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight ? `${BAI.caramel}10` : BAI.bgMuted,
      border: `1px solid ${highlight ? BAI.caramel + '40' : BAI.border}`,
      borderRadius: 10, padding: '14px 18px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid }}>{label}</span>
      <span style={{ fontFamily: BAI.fontBody, fontSize: highlight ? 20 : 15, fontWeight: 700, color: highlight ? BAI.caramel : BAI.ink }}>
        {value}
      </span>
    </div>
  )
}

// ── Tool 1: Révision de loyer IRL ─────────────────────────────────────────────
function RevisionIRL() {
  const [currentRent, setCurrentRent] = useState('')
  const [refQuarter, setRefQuarter] = useState(IRL_QUARTERS[4] ?? '')
  const [newQuarter, setNewQuarter] = useState(IRL_QUARTERS[0] ?? '')

  const irlRef = IRL_DATA[refQuarter] ?? 0
  const irlNew = IRL_DATA[newQuarter] ?? 0
  const rent = parseFloat(currentRent) || 0
  const newRent = irlRef > 0 ? (rent * irlNew) / irlRef : 0
  const diff = newRent - rent
  const pct = rent > 0 ? (diff / rent) * 100 : 0
  const canCalculate = rent > 0 && irlRef > 0 && irlNew > 0

  return (
    <Card title="Révision de loyer (IRL)" icon={TrendingUp} color="#1a3270">
      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, marginBottom: 20, lineHeight: 1.6 }}>
        Calculez le nouveau loyer selon l'Indice de Référence des Loyers publié par l'INSEE. La révision est plafonnée à la variation de l'IRL entre le trimestre de référence du bail et le dernier IRL publié.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <InputRow label="Loyer actuel (€ HC)">
          <input type="number" min="0" step="1" value={currentRent}
            onChange={e => setCurrentRent(e.target.value)}
            placeholder="Ex: 800" style={inputStyle} />
        </InputRow>
        <InputRow label="IRL de référence (bail)" hint={`Valeur : ${irlRef}`}>
          <div style={{ position: 'relative' }}>
            <select value={refQuarter} onChange={e => setRefQuarter(e.target.value)} style={selectStyle}>
              {IRL_QUARTERS.map(q => <option key={q} value={q}>{q} — {IRL_DATA[q]}</option>)}
            </select>
            <ChevronDown className="w-4 h-4" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: BAI.inkFaint, pointerEvents: 'none' }} />
          </div>
        </InputRow>
        <InputRow label="Nouvel IRL (dernier publié)" hint={`Valeur : ${irlNew}`}>
          <div style={{ position: 'relative' }}>
            <select value={newQuarter} onChange={e => setNewQuarter(e.target.value)} style={selectStyle}>
              {IRL_QUARTERS.map(q => <option key={q} value={q}>{q} — {IRL_DATA[q]}</option>)}
            </select>
            <ChevronDown className="w-4 h-4" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: BAI.inkFaint, pointerEvents: 'none' }} />
          </div>
        </InputRow>
      </div>

      {canCalculate && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 8 }}>
          <ResultBox label="Loyer actuel" value={`${rent.toFixed(2)} €`} />
          <ResultBox label={`Variation IRL (+${pct.toFixed(2)}%)`} value={`+${diff.toFixed(2)} €`} />
          <ResultBox label="Nouveau loyer" value={`${newRent.toFixed(2)} €`} highlight />
        </div>
      )}
    </Card>
  )
}

// ── Tool 2: Régularisation des charges ───────────────────────────────────────
function RegularisationCharges() {
  const [provisions, setProvisions] = useState('')
  const [reel, setReel] = useState('')

  const p = parseFloat(provisions) || 0
  const r = parseFloat(reel) || 0
  const diff = r - p
  const canCalc = p > 0 && r > 0

  return (
    <Card title="Régularisation des charges" icon={Calculator} color={BAI.caramel}>
      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, marginBottom: 20, lineHeight: 1.6 }}>
        Calculez la régularisation annuelle des charges locatives. Si les charges réelles dépassent les provisions, le locataire vous doit la différence. Dans le cas inverse, vous lui remboursez le trop-perçu.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, maxWidth: 560 }}>
        <InputRow label="Provisions payées sur l'année (€)" hint="Total des charges mensuelles versées">
          <input type="number" min="0" step="1" value={provisions}
            onChange={e => setProvisions(e.target.value)}
            placeholder="Ex: 1200" style={inputStyle} />
        </InputRow>
        <InputRow label="Charges réelles (€)" hint="Total des charges effectives de l'année">
          <input type="number" min="0" step="1" value={reel}
            onChange={e => setReel(e.target.value)}
            placeholder="Ex: 1450" style={inputStyle} />
        </InputRow>
      </div>

      {canCalc && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 8 }}>
          <ResultBox label="Provisions versées" value={`${p.toFixed(2)} €`} />
          <ResultBox label="Charges réelles" value={`${r.toFixed(2)} €`} />
          <ResultBox
            label={diff > 0 ? 'Complément à réclamer' : diff < 0 ? 'Trop-perçu à rembourser' : 'Équilibre'}
            value={`${diff > 0 ? '+' : ''}${diff.toFixed(2)} €`}
            highlight
          />
        </div>
      )}
      {canCalc && (
        <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, marginTop: 12, padding: '10px 14px', background: BAI.bgMuted, borderRadius: 8 }}>
          {diff > 0
            ? `Le locataire vous doit ${diff.toFixed(2)} € de complément de charges. Vous pouvez l'appeler en une fois ou l'étaler sur les prochains mois.`
            : diff < 0
            ? `Vous devez rembourser ${Math.abs(diff).toFixed(2)} € au locataire (trop-perçu de charges). Ce remboursement doit intervenir dans un délai raisonnable.`
            : 'Les provisions sont parfaitement calibrées par rapport aux charges réelles.'}
        </p>
      )}
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Outils() {
  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', padding: 'clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 4px' }}>
              Outils du bailleur
            </p>
            <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 4px', lineHeight: 1.15 }}>
              Calculateurs
            </h1>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
              Outils de gestion locative pour vous simplifier la vie
            </p>
          </div>

          <RevisionIRL />
          <RegularisationCharges />
        </div>
      </div>
    </Layout>
  )
}
