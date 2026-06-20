import { useState, useEffect } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { TrendingUp, Calculator, ChevronDown, Share2, Zap, AlertCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../services/api.service'
import { propertyService } from '../../services/property.service'
import { PropertyShareKit } from '../../components/property/PropertyShareKit'
import type { Property } from '../../types/property.types'

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
  const [irlData, setIrlData] = useState<Record<string, number>>(IRL_DATA)
  const [irlLive, setIrlLive] = useState(false)
  const irlQuarters = Object.keys(irlData).sort().reverse()

  useEffect(() => {
    apiClient.get('/irl/current')
      .then(res => {
        const items = res.data.data as Array<{ period: string; value: number }>
        if (Array.isArray(items) && items.length > 0) {
          const map: Record<string, number> = {}
          items.forEach(({ period, value }) => { map[period] = value })
          setIrlData(map)
          setIrlLive(true)
        }
      })
      .catch(() => { /* fallback — keep hardcoded data */ })
  }, [])

  const [currentRent, setCurrentRent] = useState('')
  const [refQuarter, setRefQuarter] = useState(irlQuarters[4] ?? '')
  const [newQuarter, setNewQuarter] = useState(irlQuarters[0] ?? '')

  const irlRef = irlData[refQuarter] ?? 0
  const irlNew = irlData[newQuarter] ?? 0
  const rent = parseFloat(currentRent) || 0
  const newRent = irlRef > 0 ? (rent * irlNew) / irlRef : 0
  const diff = newRent - rent
  const pct = rent > 0 ? (diff / rent) * 100 : 0
  const canCalculate = rent > 0 && irlRef > 0 && irlNew > 0

  return (
    <Card title="Révision de loyer (IRL)" icon={TrendingUp} color="#1a3270">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600,
          color: irlLive ? BAI.tenant : BAI.inkFaint,
          padding: '2px 8px', borderRadius: 20,
          background: irlLive ? BAI.tenantLight : BAI.bgMuted,
          border: `1px solid ${irlLive ? BAI.tenantBorder : BAI.border}`,
        }}>
          {irlLive ? '(live INSEE)' : '(données 2024)'}
        </span>
      </div>
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
              {irlQuarters.map(q => <option key={q} value={q}>{q} — {irlData[q]}</option>)}
            </select>
            <ChevronDown className="w-4 h-4" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: BAI.inkFaint, pointerEvents: 'none' }} />
          </div>
        </InputRow>
        <InputRow label="Nouvel IRL (dernier publié)" hint={`Valeur : ${irlNew}`}>
          <div style={{ position: 'relative' }}>
            <select value={newQuarter} onChange={e => setNewQuarter(e.target.value)} style={selectStyle}>
              {irlQuarters.map(q => <option key={q} value={q}>{q} — {irlData[q]}</option>)}
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

// ── Tool 3: Kit de Diffusion ──────────────────────────────────────────────────
function KitDiffusion() {
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    propertyService.getMyProperties().then(res => {
      setProperties(res.properties)
      if (res.properties.length > 0) setSelectedId(res.properties[0].id)
    }).catch(() => {})
  }, [])

  const selected = properties.find(p => p.id === selectedId)

  return (
    <Card title="Kit de Diffusion" icon={Share2} color={BAI.owner}>
      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, marginBottom: 20, lineHeight: 1.6 }}>
        Exportez vos annonces en texte formaté pour LeBonCoin, Facebook Marketplace, PAP.fr et WhatsApp. Activez aussi la diffusion automatique dès que le partenariat API est ouvert.
      </p>

      {properties.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', background: BAI.bgMuted, borderRadius: 10 }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint, margin: 0 }}>
            Aucun bien trouvé.{' '}
            <Link to="/owner/properties/new" style={{ color: BAI.caramel, fontWeight: 600 }}>
              Publiez votre premier bien →
            </Link>
          </p>
        </div>
      ) : (
        <>
          {/* Property selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, display: 'block', marginBottom: 6 }}>
              Sélectionner un bien
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                style={{ ...selectStyle, maxWidth: 480 }}
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.title} — {p.city}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: BAI.inkFaint, pointerEvents: 'none' }} />
            </div>
          </div>

          {selected && (
            <PropertyShareKit propertyId={selected.id} propertyTitle={selected.title} />
          )}
        </>
      )}
    </Card>
  )
}

// ── Tool 4: Conseiller IA ─────────────────────────────────────────────────────
function ConseillerIA() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    propertyService.getMyProperties().then(res => {
      setProperties(res.properties)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return null

  // Rule-based contextual advice (no API key exposed)
  const now = Date.now()
  const advices: Array<{ icon: React.ElementType; title: string; desc: string; to?: string; color: string; bg: string; border: string }> = []

  const drafts = properties.filter(p => p.status === 'DRAFT')
  if (drafts.length > 0) {
    advices.push({
      icon: AlertCircle,
      title: `${drafts.length} annonce${drafts.length > 1 ? 's' : ''} en brouillon`,
      desc: `"${drafts[0].title}"${drafts.length > 1 ? ` et ${drafts.length - 1} autre${drafts.length > 2 ? 's' : ''}` : ''} — publiez pour recevoir des candidatures.`,
      to: '/owner/properties',
      color: BAI.caramel, bg: '#fdf5ec', border: 'rgba(196,151,106,0.3)',
    })
  }

  const oldPublished = properties.filter(p => p.status === 'AVAILABLE' && now - new Date(p.createdAt).getTime() > 14 * 86400000)
  if (oldPublished.length > 0) {
    advices.push({
      icon: TrendingUp,
      title: `Annonce sans candidature depuis +14j`,
      desc: `"${oldPublished[0].title}" — révisez le loyer ou enrichissez les photos pour attirer plus de candidats.`,
      to: `/owner/properties/${oldPublished[0].id}/edit`,
      color: '#92400e', bg: '#fdf5ec', border: '#f3c99a',
    })
  }

  const currentMonth = new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
  if (properties.some(p => p.status === 'OCCUPIED')) {
    advices.push({
      icon: Zap,
      title: `Quittances de ${currentMonth}`,
      desc: `Générez les quittances du mois pour vos biens loués. Vos locataires peuvent les télécharger depuis leur espace.`,
      to: '/owner/quittances',
      color: BAI.owner, bg: BAI.ownerLight, border: BAI.ownerBorder,
    })
  }

  if (advices.length === 0) {
    advices.push({
      icon: Zap,
      title: 'Tout est en ordre',
      desc: 'Aucune action urgente détectée. Continuez à gérer vos biens sereinement.',
      color: BAI.tenant, bg: BAI.tenantLight, border: BAI.tenantBorder,
    })
  }

  return (
    <Card title="Conseiller IA" icon={Zap} color={BAI.caramel}>
      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, marginBottom: 20, lineHeight: 1.6 }}>
        Conseils personnalisés basés sur l'état de vos biens et candidatures.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {advices.slice(0, 3).map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '14px 16px', borderRadius: 10,
            background: a.bg, border: `1px solid ${a.border}`,
          }}>
            <a.icon size={16} style={{ color: a.color, flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: a.color, margin: '0 0 2px' }}>
                {a.title}
              </p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: 0, lineHeight: 1.6 }}>
                {a.desc}
              </p>
            </div>
            {a.to && (
              <Link to={a.to} style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: a.color, marginTop: 2 }}>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Outils() {
  return (
    <>      <div>

        {/* === DARK HERO === */}
        <div style={{ background: '#0a0d1a', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px) clamp(32px,5vw,56px)' }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, margin: 0 }}>
            OUTILS DU BAILLEUR
          </p>
          <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,42px)', fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: '6px 0 8px', lineHeight: 1.1 }}>
            Calculateurs
          </h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Outils de gestion locative pour vous simplifier la vie.
          </p>

          {/* Glass tool cards */}
          <div className="flex flex-wrap gap-3" style={{ marginTop: 28 }}>
            {[
              { n: '1', label: 'Révision IRL' },
              { n: '2', label: 'Régularisation charges' },
              { n: '3', label: 'Kit de diffusion' },
              { n: '4', label: 'Conseiller IA' },
            ].map(({ n, label }) => (
              <div key={n} style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: 16, padding: '16px 24px', minWidth: 160,
              }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                  Outil {n}
                </p>
                <p style={{ fontFamily: BAI.fontDisplay, fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* === LIGHT CONTENT === */}
        <div style={{ background: BAI.bgBase, minHeight: '60vh', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <RevisionIRL />
            <RegularisationCharges />
            <KitDiffusion />
            <ConseillerIA />
          </div>
        </div>

      </div>
    </>  )
}
