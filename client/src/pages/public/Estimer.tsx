import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { TrendingUp, ChevronRight, BarChart3, Home, MapPin } from 'lucide-react'

// ─── Liste des villes françaises pour autocomplete ────────────────────────────
const FRENCH_CITIES = [
  'Ajaccio','Amiens','Angers','Annecy','Antibes','Argenteuil','Aix-en-Provence',
  'Avignon','Besançon','Bordeaux','Boulogne-Billancourt','Brest','Caen','Cannes',
  'Clermont-Ferrand','Colmar','Dijon','Dunkerque','Fort-de-France','Grenoble',
  'La Rochelle','Le Havre','Le Mans','Lens','Limoges','Lille','Lyon','Marseille',
  'Metz','Montpellier','Mulhouse','Nancy','Nantes','Nice','Nîmes','Orléans',
  'Paris','Pau','Perpignan','Poitiers','Reims','Rennes','Rouen','Saint-Denis',
  'Saint-Étienne','Strasbourg','Toulon','Toulouse','Tours','Troyes','Valenciennes',
  'Versailles','Villeurbanne','Massy','Nanterre','Courbevoie','Rueil-Malmaison',
  'Montreuil','Créteil','Aulnay-sous-Bois','Vitry-sur-Seine','Champigny-sur-Marne',
  'Asnières-sur-Seine','Colombes','Roubaix','Tourcoing','Mérignac','Pessac',
  'Talence','Bruges','Bègles','Villenave-d\'Ornon','Cenon','Lormont',
]

function CityAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleInput = (v: string) => {
    onChange(v)
    if (v.trim().length >= 1) {
      const q = v.trim().toLowerCase()
      const matches = FRENCH_CITIES.filter(c => c.toLowerCase().startsWith(q)).slice(0, 6)
      setSuggestions(matches)
      setOpen(matches.length > 0)
    } else {
      setSuggestions([])
      setOpen(false)
    }
  }

  const select = (city: string) => {
    onChange(city)
    setSuggestions([])
    setOpen(false)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <MapPin size={14} color={BAI.inkFaint} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={value}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
          placeholder="Ex : Paris, Lyon, Bordeaux…"
          autoComplete="off"
          style={{
            width: '100%',
            background: BAI.bgInput,
            border: `1px solid ${open ? BAI.caramel : BAI.border}`,
            borderRadius: open ? '10px 10px 0 0' : BAI.radius,
            padding: '11px 14px 11px 36px',
            fontFamily: BAI.fontBody,
            fontSize: 14,
            color: BAI.ink,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
        />
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: BAI.bgSurface,
          border: `1px solid ${BAI.caramel}`,
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          overflow: 'hidden',
          boxShadow: BAI.shadowLg,
        }}>
          {suggestions.map((city, i) => (
            <button
              key={city}
              onMouseDown={() => select(city)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: i < suggestions.length - 1 ? `1px solid ${BAI.border}` : 'none',
                fontFamily: BAI.fontBody, fontSize: 14,
                color: BAI.ink, cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <MapPin size={12} color={BAI.caramel} style={{ flexShrink: 0 }} />
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Types & logique d'estimation ────────────────────────────────────────────

interface EstimForm {
  type: 'APPARTEMENT' | 'MAISON' | 'STUDIO' | 'LOFT'
  city: string
  surface: number
  rooms: number
  floor: '0' | '1-2' | '3-5' | '6+'
  furnished: boolean
  hasParking: boolean
  hasBalcony: boolean
  hasElevator: boolean
  hasGarden: boolean
  dpe: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | ''
}

const PRIX_BASE: Record<string, number> = {
  'paris': 28, 'lyon': 14, 'marseille': 12, 'bordeaux': 16,
  'toulouse': 13, 'nantes': 13, 'nice': 18, 'strasbourg': 12,
  'rennes': 13, 'montpellier': 14, 'lille': 12, 'grenoble': 11,
}

function estimerLoyer(form: EstimForm): { min: number; mid: number; max: number } | null {
  if (!form.city || form.surface < 1) return null
  const cityKey = form.city.toLowerCase().trim()
  const base = PRIX_BASE[cityKey] ?? 11

  let prix = base * form.surface
  if (form.type === 'STUDIO') prix *= 1.1
  if (form.type === 'LOFT') prix *= 1.15
  if (form.furnished) prix *= 1.1
  if (form.floor === '6+') prix *= 1.05
  if (form.floor === '0') prix *= 0.95
  if (form.hasParking) prix += base * 10
  if (form.hasBalcony) prix *= 1.03
  if (form.hasGarden) prix *= 1.05
  if (form.hasElevator && form.floor !== '0') prix *= 1.02
  if (form.dpe === 'A' || form.dpe === 'B') prix *= 1.02
  if (form.dpe === 'F' || form.dpe === 'G') prix *= 0.95

  return { min: Math.round(prix * 0.85), mid: Math.round(prix), max: Math.round(prix * 1.15) }
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function ToggleBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? BAI.night : BAI.bgSurface,
        color: active ? '#fff' : BAI.inkMid,
        border: `1px solid ${active ? BAI.night : BAI.border}`,
        borderRadius: BAI.radius,
        padding: '10px 16px',
        fontFamily: BAI.fontBody,
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: BAI.transition,
        minHeight: 44,
      }}
    >
      {label}
    </button>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 10 }}>
      {children}
    </p>
  )
}

// ─── Étape 1 ──────────────────────────────────────────────────────────────────

function Step1({ form, setForm }: { form: EstimForm; setForm: (f: EstimForm) => void }) {
  const types: EstimForm['type'][] = ['APPARTEMENT', 'MAISON', 'STUDIO', 'LOFT']
  const rooms = [1, 2, 3, 4, 5]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Type de bien */}
      <div>
        <SectionTitle>Type de bien</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {types.map(t => (
            <ToggleBtn key={t} label={t.charAt(0) + t.slice(1).toLowerCase()} active={form.type === t} onClick={() => setForm({ ...form, type: t })} />
          ))}
        </div>
      </div>

      {/* Ville */}
      <div>
        <SectionTitle>Ville</SectionTitle>
        <CityAutocomplete value={form.city} onChange={v => setForm({ ...form, city: v })} />
      </div>

      {/* Surface */}
      <div>
        <SectionTitle>Surface : {form.surface} m²</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min={15}
            max={200}
            value={form.surface}
            onChange={e => setForm({ ...form, surface: Number(e.target.value) })}
            style={{ flex: 1, accentColor: BAI.caramel }}
          />
          <input
            type="number"
            min={15}
            max={200}
            value={form.surface}
            onChange={e => setForm({ ...form, surface: Math.min(200, Math.max(15, Number(e.target.value))) })}
            style={{
              width: 72,
              background: BAI.bgInput,
              border: `1px solid ${BAI.border}`,
              borderRadius: BAI.radius,
              padding: '8px 10px',
              fontFamily: BAI.fontBody,
              fontSize: 14,
              color: BAI.ink,
              outline: 'none',
              textAlign: 'center',
            }}
          />
        </div>
      </div>

      {/* Nombre de pièces */}
      <div>
        <SectionTitle>Nombre de pièces</SectionTitle>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rooms.map(r => (
            <ToggleBtn key={r} label={r === 5 ? '5+' : String(r)} active={form.rooms === r} onClick={() => setForm({ ...form, rooms: r })} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Étape 2 ──────────────────────────────────────────────────────────────────

function Step2({ form, setForm }: { form: EstimForm; setForm: (f: EstimForm) => void }) {
  const floors: { val: EstimForm['floor']; label: string }[] = [
    { val: '0', label: 'RDC' }, { val: '1-2', label: '1-2' }, { val: '3-5', label: '3-5' }, { val: '6+', label: '6+' },
  ]
  const dpeGrades: EstimForm['dpe'][] = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  const dpeColors: Record<string, string> = { A: '#1b5e3b', B: '#2d8a4f', C: '#7abf3b', D: '#f0c419', E: '#f08019', F: '#e03030', G: '#9b1c1c' }

  const checkboxes: { key: keyof EstimForm; label: string }[] = [
    { key: 'hasParking', label: 'Parking' },
    { key: 'hasBalcony', label: 'Balcon / Terrasse' },
    { key: 'hasElevator', label: 'Ascenseur' },
    { key: 'hasGarden', label: 'Jardin' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Étage */}
      <div>
        <SectionTitle>Étage</SectionTitle>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {floors.map(f => (
            <ToggleBtn key={f.val} label={f.label} active={form.floor === f.val} onClick={() => setForm({ ...form, floor: f.val })} />
          ))}
        </div>
      </div>

      {/* Meublé */}
      <div>
        <SectionTitle>Meublé</SectionTitle>
        <div style={{ display: 'flex', gap: 8 }}>
          <ToggleBtn label="Non meublé" active={!form.furnished} onClick={() => setForm({ ...form, furnished: false })} />
          <ToggleBtn label="Meublé" active={form.furnished} onClick={() => setForm({ ...form, furnished: true })} />
        </div>
      </div>

      {/* Équipements */}
      <div>
        <SectionTitle>Équipements</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {checkboxes.map(cb => {
            const isActive = form[cb.key] as boolean
            return (
              <button
                key={cb.key}
                onClick={() => setForm({ ...form, [cb.key]: !isActive })}
                style={{
                  background: isActive ? BAI.caramelLight : BAI.bgSurface,
                  color: isActive ? BAI.caramel : BAI.inkMid,
                  border: `1px solid ${isActive ? BAI.caramelBorder : BAI.border}`,
                  borderRadius: BAI.radius,
                  padding: '10px 16px',
                  fontFamily: BAI.fontBody,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: BAI.transition,
                  minHeight: 44,
                }}
              >
                {cb.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* DPE */}
      <div>
        <SectionTitle>DPE (Diagnostic de Performance Énergétique)</SectionTitle>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {dpeGrades.map(g => (
            <button
              key={g}
              onClick={() => setForm({ ...form, dpe: form.dpe === g ? '' : g })}
              style={{
                width: 44,
                height: 44,
                background: form.dpe === g ? dpeColors[g] : BAI.bgSurface,
                color: form.dpe === g ? '#fff' : dpeColors[g],
                border: `2px solid ${dpeColors[g]}`,
                borderRadius: BAI.radius,
                fontFamily: BAI.fontBody,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: BAI.transition,
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Résultat ─────────────────────────────────────────────────────────────────

function EstimResult({ result, form }: { result: { min: number; mid: number; max: number }; form: EstimForm }) {
  const navigate = useNavigate()
  const cityKey = form.city.toLowerCase().trim()
  const prixM2 = PRIX_BASE[cityKey] ?? 11

  const range = result.max - result.min
  const midPct = range > 0 ? Math.round(((result.mid - result.min) / range) * 100) : 50

  return (
    <div style={{
      background: BAI.bgSurface,
      border: `1px solid ${BAI.border}`,
      borderRadius: BAI.radiusLg,
      padding: 'clamp(24px, 3vw, 36px)',
      boxShadow: BAI.shadowMd,
      maxWidth: 520,
      margin: '0 auto',
    }}>
      {/* Fourchette */}
      <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: BAI.caramel, textAlign: 'center', marginBottom: 8 }}>
        Estimation du loyer
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>Min.</p>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 18, fontWeight: 600, color: BAI.inkMid }}>{result.min}€</p>
        </div>
        <div style={{ textAlign: 'center', paddingBottom: 4 }}>
          <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(36px, 5vw, 48px)', fontWeight: 700, fontStyle: 'italic', color: BAI.caramel, lineHeight: 1 }}>
            {result.mid}€
          </p>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>/ mois</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>Max.</p>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 18, fontWeight: 600, color: BAI.inkMid }}>{result.max}€</p>
        </div>
      </div>

      {/* Barre visuelle min/mid/max */}
      <div style={{ margin: '16px 0', background: BAI.bgMuted, borderRadius: 8, height: 8, position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: 0, top: 0, height: '100%',
          width: '100%',
          background: `linear-gradient(to right, ${BAI.caramelLight}, ${BAI.caramel}, ${BAI.caramelLight})`,
          borderRadius: 8,
        }} />
        <div style={{
          position: 'absolute',
          left: `${midPct}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 16,
          height: 16,
          background: BAI.caramel,
          border: '2px solid #fff',
          borderRadius: '50%',
          boxShadow: BAI.shadowSm,
        }} />
      </div>

      {/* Prix m² */}
      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, textAlign: 'center', marginBottom: 4 }}>
        Prix moyen à <strong>{form.city}</strong> : <strong>{prixM2}€/m²/mois</strong>
      </p>
      <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, textAlign: 'center', marginBottom: 24 }}>
        Estimation indicative basée sur les prix moyens du marché 2026.
      </p>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate(`/search?city=${encodeURIComponent(form.city)}&minPrice=${result.min}&maxPrice=${result.max}`)}
          style={{
            flex: 1,
            background: BAI.night,
            color: '#fff',
            border: 'none',
            borderRadius: BAI.radius,
            padding: '12px 16px',
            fontFamily: BAI.fontBody,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          Voir les annonces dans cette fourchette
        </button>
        <button
          onClick={() => navigate('/register?role=OWNER')}
          style={{
            flex: 1,
            background: BAI.bgSurface,
            color: BAI.ink,
            border: `1px solid ${BAI.border}`,
            borderRadius: BAI.radius,
            padding: '12px 16px',
            fontFamily: BAI.fontBody,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          Publier mon annonce
        </button>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

const DEFAULT_FORM: EstimForm = {
  type: 'APPARTEMENT',
  city: '',
  surface: 45,
  rooms: 2,
  floor: '1-2',
  furnished: false,
  hasParking: false,
  hasBalcony: false,
  hasElevator: false,
  hasGarden: false,
  dpe: '',
}

export default function Estimer() {
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<EstimForm>(DEFAULT_FORM)
  const [result, setResult] = useState<{ min: number; mid: number; max: number } | null>(null)

  const handleSubmit = () => {
    const r = estimerLoyer(form)
    setResult(r)
  }

  const handleReset = () => {
    setResult(null)
    setStep(1)
    setForm(DEFAULT_FORM)
  }

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody }}>

        {/* Hero */}
        <div style={{ background: BAI.night, padding: 'clamp(40px, 6vw, 72px) clamp(16px, 5vw, 48px)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
            <BarChart3 size={20} style={{ color: BAI.caramel }} />
          </div>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 12 }}>
            Outil d'estimation
          </p>
          <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px, 4.5vw, 42px)', fontWeight: 700, fontStyle: 'italic', color: '#fff', marginBottom: 10, lineHeight: 1.2 }}>
            Estimez votre loyer
          </h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 'clamp(13px, 1.4vw, 15px)', color: 'rgba(255,255,255,0.6)', maxWidth: 460, margin: '0 auto' }}>
            Combien coûte votre appartement ? Obtenez une estimation gratuite basée sur les prix du marché.
          </p>
        </div>

        {/* Contenu */}
        <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(32px, 5vw, 56px) clamp(16px, 4vw, 24px)' }}>

          {result ? (
            <div>
              <EstimResult result={result} form={form} />
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button
                  onClick={handleReset}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: BAI.fontBody,
                    fontSize: 13,
                    color: BAI.inkMid,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Faire une nouvelle estimation
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: BAI.radiusLg,
              padding: 'clamp(24px, 3vw, 36px)',
              boxShadow: BAI.shadowMd,
            }}>
              {/* Indicateur d'étapes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                {([1, 2] as const).map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {i > 0 && <ChevronRight size={14} style={{ color: BAI.border }} />}
                    <div
                      onClick={() => s < step && setStep(s)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: s < step ? 'pointer' : 'default',
                      }}
                    >
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: step === s ? BAI.caramel : step > s ? BAI.tenantLight : BAI.bgMuted,
                        color: step === s ? '#fff' : step > s ? BAI.tenant : BAI.inkFaint,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: BAI.fontBody,
                        flexShrink: 0,
                      }}>
                        {s}
                      </div>
                      <span style={{
                        fontFamily: BAI.fontBody,
                        fontSize: 12,
                        fontWeight: step === s ? 600 : 400,
                        color: step === s ? BAI.ink : BAI.inkFaint,
                      }}>
                        {s === 1 ? 'Caractéristiques' : 'Détails'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulaire */}
              {step === 1 ? (
                <Step1 form={form} setForm={setForm} />
              ) : (
                <Step2 form={form} setForm={setForm} />
              )}

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: `1px solid ${BAI.border}` }}>
                {step > 1 ? (
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      background: 'none',
                      border: `1px solid ${BAI.border}`,
                      borderRadius: BAI.radius,
                      padding: '10px 20px',
                      fontFamily: BAI.fontBody,
                      fontSize: 13,
                      color: BAI.inkMid,
                      cursor: 'pointer',
                      minHeight: 44,
                    }}
                  >
                    Retour
                  </button>
                ) : <div />}

                {step === 1 ? (
                  <button
                    onClick={() => setStep(2)}
                    disabled={!form.city || form.surface < 1}
                    style={{
                      background: (!form.city || form.surface < 1) ? BAI.bgMuted : BAI.night,
                      color: (!form.city || form.surface < 1) ? BAI.inkFaint : '#fff',
                      border: 'none',
                      borderRadius: BAI.radius,
                      padding: '10px 24px',
                      fontFamily: BAI.fontBody,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: (!form.city || form.surface < 1) ? 'not-allowed' : 'pointer',
                      minHeight: 44,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Étape suivante <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    style={{
                      background: BAI.caramel,
                      color: '#fff',
                      border: 'none',
                      borderRadius: BAI.radius,
                      padding: '10px 24px',
                      fontFamily: BAI.fontBody,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: 44,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <TrendingUp size={14} /> Estimer mon loyer
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Info disclaimer */}
          {!result && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Home size={11} /> Estimation 100% gratuite · Sans engagement · Données marché 2026
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
