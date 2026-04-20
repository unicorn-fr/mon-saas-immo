import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check, ChevronLeft, ChevronRight, Home, Building2,
  Warehouse, Layers, Box, BedDouble, Car, Store,
  MapPin, Loader2, Info,
} from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { ImageUpload } from '../../components/property/ImageUpload'
import { Layout } from '../../components/layout/Layout'
import { celebrateBig } from '../../utils/celebrate'
import type { CreatePropertyInput, PropertyType } from '../../types/property.types'
import { AMENITIES } from '../../types/property.types'
import { BAI } from '../../constants/bailio-tokens'

// ─── Maison tokens ────────────────────────────────────────────────────────────

const DRAFT_KEY = 'create_property_wizard_v1'

const STEPS = [
  { label: 'Type',     title: 'Quel type de bien ?' },
  { label: 'Adresse',  title: 'Où se situe le bien ?' },
  { label: 'Descriptif', title: 'Caractéristiques' },
  { label: 'DPE',      title: 'Performance énergétique' },
  { label: 'Prix',     title: 'Loyer et disponibilité' },
  { label: 'Médias',   title: 'Photos et description' },
]

type ExtendedType = PropertyType | 'CHAMBRE' | 'PARKING' | 'LOCAL_COMMERCIAL'

const TYPE_CARDS: { value: ExtendedType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'APARTMENT', label: 'Appartement', icon: <Building2 size={26} />, desc: 'T1 au T5+' },
  { value: 'HOUSE',     label: 'Maison',      icon: <Home size={26} />,      desc: 'Individuelle' },
  { value: 'STUDIO',    label: 'Studio',      icon: <Box size={26} />,       desc: 'Pièce unique' },
  { value: 'DUPLEX',    label: 'Duplex',      icon: <Layers size={26} />,    desc: 'Deux niveaux' },
  { value: 'LOFT',      label: 'Loft',        icon: <Warehouse size={26} />, desc: 'Espace ouvert' },
  { value: 'CHAMBRE',   label: 'Chambre',     icon: <BedDouble size={26} />, desc: 'Colocation' },
  { value: 'PARKING',   label: 'Parking',     icon: <Car size={26} />,       desc: 'Box / place' },
  { value: 'LOCAL_COMMERCIAL', label: 'Local commercial', icon: <Store size={26} />, desc: 'Boutique, bureau' },
]

const DPE_CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const
type DpeClass = typeof DPE_CLASSES[number]
const DPE_COLORS: Record<DpeClass, string> = {
  A: '#00b050', B: '#92d050', C: '#ffff00', D: '#ffc000', E: '#ff9000', F: '#ff0000', G: '#c00000',
}
const DPE_MAX_KWH: Record<DpeClass, string> = {
  A: '≤ 50', B: '51–90', C: '91–150', D: '151–230', E: '231–330', F: '331–450', G: '> 450',
}

interface WizardState {
  propertyType: ExtendedType | ''
  furnished: boolean
  address: string
  city: string
  postalCode: string
  latitude: number | undefined
  longitude: number | undefined
  surface: string
  bedrooms: number
  bathrooms: number
  floor: string
  totalFloors: string
  amenities: string[]
  hasParking: boolean
  hasBalcony: boolean
  hasElevator: boolean
  hasGarden: boolean
  dpeClass: DpeClass | ''
  dpeValue: string
  gesClass: DpeClass | ''
  gesValue: string
  price: string
  charges: string
  deposit: string
  availableFrom: string
  visitDuration: number
  images: string[]
  description: string
}

const INITIAL: WizardState = {
  propertyType: '', furnished: false,
  address: '', city: '', postalCode: '', latitude: undefined, longitude: undefined,
  surface: '', bedrooms: 1, bathrooms: 1, floor: '', totalFloors: '',
  amenities: [], hasParking: false, hasBalcony: false, hasElevator: false, hasGarden: false,
  dpeClass: '', dpeValue: '', gesClass: '', gesValue: '',
  price: '', charges: '', deposit: '', availableFrom: '', visitDuration: 30,
  images: [], description: '',
}

function loadDraft(): WizardState {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) return { ...INITIAL, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return INITIAL
}

// ─── Sub-components (module level to avoid remount on re-render) ──────────────

function Counter({
  value, min = 0, max = 20, onChange,
}: { value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      border: `1px solid ${BAI.border}`, borderRadius: 8, overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={{
          background: BAI.bgMuted, border: 'none', cursor: value <= min ? 'not-allowed' : 'pointer',
          padding: '6px 14px', fontSize: 18, color: value <= min ? BAI.inkFaint : BAI.ink, lineHeight: 1,
        }}
      >−</button>
      <span style={{
        padding: '6px 18px', minWidth: 40, textAlign: 'center',
        fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: 15, fontWeight: 600,
        color: BAI.ink, background: BAI.bgSurface,
      }}>{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={{
          background: BAI.bgMuted, border: 'none', cursor: value >= max ? 'not-allowed' : 'pointer',
          padding: '6px 14px', fontSize: 18, color: value >= max ? BAI.inkFaint : BAI.ink, lineHeight: 1,
        }}
      >+</button>
    </div>
  )
}

function DpeGauge({
  label, selected, onSelect,
}: { label: string; selected: DpeClass | ''; onSelect: (c: DpeClass) => void }) {
  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 600, color: BAI.inkMid, marginBottom: 10 }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {DPE_CLASSES.map((cls, i) => {
          const isSelected = selected === cls
          const barW = 100 - i * 8
          return (
            <button
              key={cls}
              type="button"
              onClick={() => onSelect(cls)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div style={{
                width: `${barW}%`, minWidth: 64,
                background: DPE_COLORS[cls],
                color: cls === 'C' ? '#444' : cls === 'B' ? '#333' : '#fff',
                padding: '4px 10px', borderRadius: 4,
                fontFamily: 'DM Sans, system-ui', fontSize: 13, fontWeight: 700,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: `3px solid ${isSelected ? BAI.ink : 'transparent'}`,
                transition: 'border-color 0.15s',
              }}>
                <span>{cls}</span>
                <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.85 }}>{DPE_MAX_KWH[cls]}</span>
              </div>
              {isSelected && <Check size={14} color={BAI.owner} strokeWidth={3} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main wizard component ────────────────────────────────────────────────────

interface BanFeature {
  properties: { label: string; city: string; postcode: string }
  geometry: { coordinates: [number, number] }
}

export default function CreatePropertyWizard() {
  const navigate = useNavigate()
  const { createProperty, isLoading, isUploadingImages } = useProperties()
  const [step, setStep] = useState(0)
  const [state, setState] = useState<WizardState>(loadDraft)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banQuery, setBanQuery] = useState(loadDraft().address || '')
  const [banResults, setBanResults] = useState<BanFeature[]>([])
  const [banLoading, setBanLoading] = useState(false)
  const banTimer = useRef<ReturnType<typeof setTimeout>>()

  // Save draft on each state change
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state))
  }, [state])

  const update = useCallback((patch: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  // BAN address autocomplete
  useEffect(() => {
    if (banQuery.length < 3) { setBanResults([]); return }
    clearTimeout(banTimer.current)
    banTimer.current = setTimeout(async () => {
      setBanLoading(true)
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(banQuery)}&limit=6&type=housenumber`
        )
        const json = await res.json()
        setBanResults(json.features || [])
      } catch { setBanResults([]) }
      finally { setBanLoading(false) }
    }, 300)
    return () => clearTimeout(banTimer.current)
  }, [banQuery])

  function selectBan(feat: BanFeature) {
    const p = feat.properties
    const [lng, lat] = feat.geometry.coordinates
    update({ address: p.label, city: p.city, postalCode: p.postcode, latitude: lat, longitude: lng })
    setBanQuery(p.label)
    setBanResults([])
  }

  function toggleAmenity(val: string) {
    setState(prev => ({
      ...prev,
      amenities: prev.amenities.includes(val)
        ? prev.amenities.filter(a => a !== val)
        : [...prev.amenities, val],
    }))
  }

  function toggleFeature(key: 'hasParking' | 'hasBalcony' | 'hasElevator' | 'hasGarden') {
    setState(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function validate(s: number): boolean {
    const e: Record<string, string> = {}
    if (s === 0 && !state.propertyType) e.propertyType = 'Sélectionnez un type de bien'
    if (s === 1) {
      if (!state.address.trim()) e.address = 'Adresse requise'
      if (!state.city.trim()) e.city = 'Ville requise'
      if (!state.postalCode.trim()) e.postalCode = 'Code postal requis'
    }
    if (s === 2) {
      if (!state.surface || Number(state.surface) <= 0) e.surface = 'Surface requise'
    }
    if (s === 4) {
      if (!state.price || Number(state.price) <= 0) e.price = 'Loyer requis'
    }
    if (s === 5) {
      if (!state.description.trim()) e.description = 'Description requise'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() {
    if (!validate(step)) return
    setStep(s => Math.min(STEPS.length - 1, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function back() {
    setStep(s => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    if (!validate(5)) return

    const amenitiesAll = [...state.amenities]
    if (state.dpeClass) amenitiesAll.push(`dpe_class:${state.dpeClass}`)
    if (state.dpeValue) amenitiesAll.push(`dpe_value:${state.dpeValue}`)
    if (state.gesClass) amenitiesAll.push(`ges_class:${state.gesClass}`)
    if (state.gesValue) amenitiesAll.push(`ges_value:${state.gesValue}`)

    const LABEL: Record<string, string> = {
      APARTMENT: 'Appartement', HOUSE: 'Maison', STUDIO: 'Studio',
      DUPLEX: 'Duplex', LOFT: 'Loft', CHAMBRE: 'Chambre',
      PARKING: 'Parking', LOCAL_COMMERCIAL: 'Local commercial',
    }

    // Map extended types to valid DB enum values
    const typeMap: Record<string, PropertyType> = {
      APARTMENT: 'APARTMENT', HOUSE: 'HOUSE', STUDIO: 'STUDIO',
      DUPLEX: 'DUPLEX', LOFT: 'LOFT',
      CHAMBRE: 'STUDIO', PARKING: 'APARTMENT', LOCAL_COMMERCIAL: 'APARTMENT',
    }

    const input: CreatePropertyInput = {
      title: `${LABEL[state.propertyType as string] ?? 'Bien'} – ${state.city}`,
      description: state.description,
      type: typeMap[state.propertyType as string] ?? 'APARTMENT',
      address: state.address,
      city: state.city,
      postalCode: state.postalCode,
      latitude: state.latitude,
      longitude: state.longitude,
      surface: Number(state.surface),
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      floor: state.floor ? Number(state.floor) : undefined,
      totalFloors: state.totalFloors ? Number(state.totalFloors) : undefined,
      furnished: state.furnished,
      price: Number(state.price),
      charges: state.charges ? Number(state.charges) : undefined,
      deposit: state.deposit ? Number(state.deposit) : undefined,
      images: state.images,
      hasParking: state.hasParking,
      hasBalcony: state.hasBalcony,
      hasElevator: state.hasElevator,
      hasGarden: state.hasGarden,
      amenities: amenitiesAll,
      availableFrom: state.availableFrom || undefined,
      visitDuration: state.visitDuration,
    }

    try {
      await createProperty(input)
      localStorage.removeItem(DRAFT_KEY)
      celebrateBig()
      navigate('/dashboard/owner')
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Erreur lors de la création' })
    }
  }

  // ─── Styles ──────────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    background: '#f8f7f4', border: `1px solid ${BAI.border}`, borderRadius: 8,
    padding: '0.625rem 1rem', fontFamily: 'DM Sans, system-ui, sans-serif',
    fontSize: 15, color: BAI.ink, outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 500, color: BAI.inkMid, display: 'block', marginBottom: 6,
  }

  const progress = (step / (STEPS.length - 1)) * 100

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', paddingBottom: 80 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 1rem' }}>

          {/* Page header */}
          <div style={{ paddingTop: 40, paddingBottom: 28, textAlign: 'center' }}>
            <p style={{
              fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 8,
            }}>Publier un bien</p>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 36,
              fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0,
            }}>{STEPS[step].title}</h1>
          </div>

          {/* Progress stepper */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              {STEPS.map((_s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { if (i < step) setStep(i) }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    background: 'none', border: 'none', cursor: i < step ? 'pointer' : 'default', padding: 0,
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: i <= step ? BAI.owner : BAI.bgMuted,
                    border: `2px solid ${i <= step ? BAI.owner : BAI.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {i < step
                      ? <Check size={13} color="#fff" strokeWidth={3} />
                      : <span style={{ fontSize: 11, fontWeight: 700, color: i === step ? '#fff' : BAI.inkFaint }}>{i + 1}</span>
                    }
                  </div>
                </button>
              ))}
            </div>
            <div style={{ height: 4, background: BAI.border, borderRadius: 2 }}>
              <div style={{
                height: '100%', background: BAI.owner, borderRadius: 2,
                width: `${progress}%`, transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              {STEPS.map((s, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 500,
                  color: i === step ? BAI.owner : i < step ? BAI.inkMid : BAI.inkFaint,
                }}>{s.label}</span>
              ))}
            </div>
          </div>

          {/* Step card */}
          <div style={{
            background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16,
            padding: '2rem', boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
          }}>

            {/* ── Step 0: Type ─────────────────────────────────────────────── */}
            {step === 0 && (
              <div>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24,
                }}>
                  {TYPE_CARDS.map(card => {
                    const sel = state.propertyType === card.value
                    return (
                      <button
                        key={card.value}
                        type="button"
                        onClick={() => update({ propertyType: card.value })}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          justifyContent: 'center', gap: 6, padding: '1rem 0.5rem',
                          background: sel ? BAI.ownerLight : BAI.bgSurface,
                          border: `2px solid ${sel ? BAI.owner : BAI.border}`,
                          borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ color: sel ? BAI.owner : BAI.inkMid }}>{card.icon}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 600, color: sel ? BAI.owner : BAI.ink,
                          textAlign: 'center', fontFamily: 'DM Sans, system-ui',
                        }}>{card.label}</span>
                        <span style={{ fontSize: 10, color: BAI.inkFaint, textAlign: 'center' }}>{card.desc}</span>
                      </button>
                    )
                  })}
                </div>
                {errors.propertyType && (
                  <p style={{ color: BAI.error, fontSize: 13, marginBottom: 16 }}>{errors.propertyType}</p>
                )}
                <div style={{ borderTop: `1px solid ${BAI.border}`, paddingTop: 20 }}>
                  <p style={{ ...labelStyle, marginBottom: 12 }}>Type de location</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[{ v: false, l: 'Vide' }, { v: true, l: 'Meublé' }].map(({ v, l }) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => update({ furnished: v })}
                        style={{
                          flex: 1, padding: '0.75rem',
                          border: `2px solid ${state.furnished === v ? BAI.owner : BAI.border}`,
                          background: state.furnished === v ? BAI.ownerLight : BAI.bgSurface,
                          borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans',
                          fontSize: 14, fontWeight: 600,
                          color: state.furnished === v ? BAI.owner : BAI.inkMid,
                          transition: 'all 0.15s',
                        }}
                      >{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 1: Adresse ──────────────────────────────────────────── */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ position: 'relative' }}>
                  <label style={labelStyle}>Adresse complète *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      value={banQuery}
                      onChange={e => setBanQuery(e.target.value)}
                      placeholder="Ex: 12 rue de la Paix, Paris"
                      style={{ ...inputStyle, paddingLeft: 40 }}
                    />
                    {banLoading
                      ? <Loader2 size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: BAI.inkFaint }} />
                      : <MapPin size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: BAI.inkFaint }} />
                    }
                  </div>
                  {banResults.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                      background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 10,
                      boxShadow: '0 4px 20px rgba(13,12,10,0.12)', marginTop: 4, overflow: 'hidden',
                    }}>
                      {banResults.map((feat, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectBan(feat)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            textAlign: 'left', padding: '10px 14px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'DM Sans', fontSize: 14, color: BAI.ink,
                            borderBottom: i < banResults.length - 1 ? `1px solid ${BAI.border}` : 'none',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <MapPin size={13} style={{ color: BAI.inkFaint, flexShrink: 0 }} />
                          {feat.properties.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.address && <p style={{ color: BAI.error, fontSize: 13, marginTop: 4 }}>{errors.address}</p>}
                </div>

                {state.address && (
                  <div style={{
                    background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`,
                    borderRadius: 10, padding: '12px 14px',
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: BAI.owner, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Adresse sélectionnée</p>
                    <p style={{ fontSize: 14, color: BAI.ink, margin: 0 }}>{state.address}</p>
                    {state.latitude && (
                      <p style={{ fontSize: 12, color: BAI.inkFaint, marginTop: 4 }}>
                        GPS : {state.latitude.toFixed(5)}, {state.longitude?.toFixed(5)}
                      </p>
                    )}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Ville *</label>
                    <input
                      value={state.city}
                      onChange={e => update({ city: e.target.value })}
                      style={inputStyle} placeholder="Paris"
                    />
                    {errors.city && <p style={{ color: BAI.error, fontSize: 13, marginTop: 4 }}>{errors.city}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Code postal *</label>
                    <input
                      value={state.postalCode}
                      onChange={e => update({ postalCode: e.target.value })}
                      style={inputStyle} placeholder="75001"
                    />
                    {errors.postalCode && <p style={{ color: BAI.error, fontSize: 13, marginTop: 4 }}>{errors.postalCode}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Descriptif ───────────────────────────────────────── */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={labelStyle}>Surface habitable (m²) *</label>
                  <input
                    type="number" min="5"
                    value={state.surface}
                    onChange={e => update({ surface: e.target.value })}
                    style={{ ...inputStyle, maxWidth: 160 }} placeholder="45"
                  />
                  {errors.surface && <p style={{ color: BAI.error, fontSize: 13, marginTop: 4 }}>{errors.surface}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                  {([
                    { label: 'Chambres', key: 'bedrooms' as const },
                    { label: 'Salles de bain', key: 'bathrooms' as const },
                  ] as const).map(({ label, key }) => (
                    <div key={key}>
                      <label style={{ ...labelStyle, marginBottom: 10 }}>{label}</label>
                      <Counter
                        value={state[key]}
                        onChange={v => update({ [key]: v })}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={labelStyle}>Étage</label>
                    <input
                      type="number" min="0"
                      value={state.floor}
                      onChange={e => update({ floor: e.target.value })}
                      style={{ ...inputStyle, maxWidth: 100 }} placeholder="3"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Nb. d'étages total</label>
                    <input
                      type="number" min="1"
                      value={state.totalFloors}
                      onChange={e => update({ totalFloors: e.target.value })}
                      style={{ ...inputStyle, maxWidth: 100 }} placeholder="6"
                    />
                  </div>
                </div>

                <div>
                  <p style={{ ...labelStyle, marginBottom: 12 }}>Caractéristiques principales</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {([
                      { k: 'hasParking', l: 'Parking' },
                      { k: 'hasBalcony', l: 'Balcon' },
                      { k: 'hasElevator', l: 'Ascenseur' },
                      { k: 'hasGarden', l: 'Jardin' },
                    ] as const).map(({ k, l }) => {
                      const active = state[k]
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => toggleFeature(k)}
                          style={{
                            padding: '6px 14px', borderRadius: 20,
                            border: `1.5px solid ${active ? BAI.owner : BAI.border}`,
                            background: active ? BAI.ownerLight : BAI.bgSurface,
                            cursor: 'pointer', fontSize: 13, fontWeight: 500,
                            color: active ? BAI.owner : BAI.inkMid, transition: 'all 0.15s',
                          }}
                        >{active ? '✓ ' : ''}{l}</button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p style={{ ...labelStyle, marginBottom: 12 }}>Équipements inclus</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {AMENITIES.map(am => {
                      const active = state.amenities.includes(am.value)
                      return (
                        <button
                          key={am.value}
                          type="button"
                          onClick={() => toggleAmenity(am.value)}
                          style={{
                            padding: '7px 10px', borderRadius: 8,
                            border: `1.5px solid ${active ? BAI.owner : BAI.border}`,
                            background: active ? BAI.ownerLight : BAI.bgSurface,
                            cursor: 'pointer', fontSize: 12, fontWeight: 500,
                            color: active ? BAI.owner : BAI.inkMid,
                            textAlign: 'left', transition: 'all 0.15s',
                          }}
                        >{active ? '✓ ' : ''}{am.label}</button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: DPE ──────────────────────────────────────────────── */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                <p style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.6, margin: 0 }}>
                  Le DPE est obligatoire depuis 2021 pour tout logement mis en location. Il évalue la consommation d'énergie et l'impact climatique du bien.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                  <div>
                    <DpeGauge
                      label="Classe énergie (DPE)"
                      selected={state.dpeClass}
                      onSelect={c => update({ dpeClass: c })}
                    />
                    {state.dpeClass && (
                      <div style={{ marginTop: 14 }}>
                        <label style={labelStyle}>Consommation (kWh/m²/an)</label>
                        <input
                          type="number" min="0"
                          value={state.dpeValue}
                          onChange={e => update({ dpeValue: e.target.value })}
                          style={{ ...inputStyle, maxWidth: 140 }} placeholder="Ex: 120"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <DpeGauge
                      label="Classe GES (émissions CO₂)"
                      selected={state.gesClass}
                      onSelect={c => update({ gesClass: c })}
                    />
                    {state.gesClass && (
                      <div style={{ marginTop: 14 }}>
                        <label style={labelStyle}>Émissions (kgCO₂/m²/an)</label>
                        <input
                          type="number" min="0"
                          value={state.gesValue}
                          onChange={e => update({ gesValue: e.target.value })}
                          style={{ ...inputStyle, maxWidth: 140 }} placeholder="Ex: 25"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  background: BAI.caramelLight, border: '1px solid #f3c99a',
                  borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10,
                }}>
                  <Info size={16} style={{ color: BAI.caramel, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                    Cette étape est optionnelle à ce stade. Vous pourrez renseigner ces informations après publication dans les détails du bien.
                  </p>
                </div>
              </div>
            )}

            {/* ── Step 4: Prix ─────────────────────────────────────────────── */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Loyer mensuel (€) *</label>
                  <input
                    type="number" min="0"
                    value={state.price}
                    onChange={e => {
                      const p = e.target.value
                      update({ price: p, deposit: state.deposit || (Number(p) > 0 ? String(Number(p) * 2) : '') })
                    }}
                    style={{ ...inputStyle, maxWidth: 200 }} placeholder="900"
                  />
                  {errors.price && <p style={{ color: BAI.error, fontSize: 13, marginTop: 4 }}>{errors.price}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Charges mensuelles (€)</label>
                    <input
                      type="number" min="0"
                      value={state.charges}
                      onChange={e => update({ charges: e.target.value })}
                      style={inputStyle} placeholder="80"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Dépôt de garantie (€)
                      {state.price && <span style={{ color: BAI.inkFaint, fontWeight: 400, marginLeft: 6, fontSize: 12 }}>= {Number(state.price) * 2} € (2 mois)</span>}
                    </label>
                    <input
                      type="number" min="0"
                      value={state.deposit}
                      onChange={e => update({ deposit: e.target.value })}
                      style={inputStyle} placeholder="1800"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Disponible à partir du</label>
                    <input
                      type="date"
                      value={state.availableFrom}
                      onChange={e => update({ availableFrom: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Durée des visites</label>
                    <select
                      value={state.visitDuration}
                      onChange={e => update({ visitDuration: Number(e.target.value) })}
                      style={inputStyle}
                    >
                      {[15, 20, 30, 45, 60, 90].map(d => (
                        <option key={d} value={d}>{d < 60 ? `${d} min` : `${d / 60}h`}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {state.price && Number(state.price) > 0 && (
                  <div style={{
                    background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`,
                    borderRadius: 10, padding: '14px 16px',
                  }}>
                    <p style={{
                      fontSize: 11, fontWeight: 700, color: BAI.owner, marginBottom: 12,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>Récapitulatif financier</p>
                    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: 12, color: BAI.inkMid, marginBottom: 2 }}>Loyer charges comprises</p>
                        <p style={{ fontSize: 22, fontWeight: 700, color: BAI.ink }}>
                          {(Number(state.price) + Number(state.charges || 0)).toLocaleString('fr-FR')} €/mois
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, color: BAI.inkMid, marginBottom: 2 }}>1er versement total</p>
                        <p style={{ fontSize: 22, fontWeight: 700, color: BAI.ink }}>
                          {(Number(state.price) + Number(state.charges || 0) + Number(state.deposit || 0)).toLocaleString('fr-FR')} €
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 5: Médias ───────────────────────────────────────────── */}
            {step === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={labelStyle}>Photos du bien</label>
                  <p style={{ fontSize: 13, color: BAI.inkFaint, marginBottom: 12, marginTop: 0 }}>
                    Ajoutez jusqu'à 10 photos. Les bonnes photos multiplient les contacts par 3.
                  </p>
                  <ImageUpload
                    images={state.images}
                    onImagesChange={imgs => update({ images: imgs })}
                    maxImages={10}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <label style={labelStyle}>Description *</label>
                    <span style={{ fontSize: 12, color: state.description.length > 1800 ? BAI.error : BAI.inkFaint }}>
                      {state.description.length}/2000
                    </span>
                  </div>
                  <textarea
                    value={state.description}
                    onChange={e => update({ description: e.target.value })}
                    maxLength={2000}
                    rows={7}
                    placeholder="Décrivez le bien : luminosité, orientations, environnement, transports, état général, travaux récents…"
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  />
                  {errors.description && <p style={{ color: BAI.error, fontSize: 13, marginTop: 4 }}>{errors.description}</p>}
                </div>

                {errors.general && (
                  <div style={{ background: BAI.errorLight, border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ fontSize: 14, color: BAI.error, margin: 0 }}>{errors.general}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, gap: 12 }}>
            <button
              type="button"
              onClick={step > 0 ? back : () => navigate(-1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '0.75rem 1.25rem',
                background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 10,
                fontFamily: 'DM Sans', fontSize: 14, fontWeight: 500, color: BAI.inkMid, cursor: 'pointer',
              }}
            >
              <ChevronLeft size={16} /> {step > 0 ? 'Retour' : 'Annuler'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: BAI.inkFaint }}>Brouillon sauvegardé</span>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '0.75rem 1.5rem',
                    background: BAI.owner, border: 'none', borderRadius: 10,
                    fontFamily: 'DM Sans', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer',
                  }}
                >
                  Suivant <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={isLoading || isUploadingImages}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1.75rem',
                    background: (isLoading || isUploadingImages) ? BAI.borderStrong : BAI.owner, border: 'none', borderRadius: 10,
                    fontFamily: 'DM Sans', fontSize: 14, fontWeight: 600, color: '#fff',
                    cursor: (isLoading || isUploadingImages) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {(isLoading || isUploadingImages) ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {isUploadingImages ? 'Upload en cours…' : isLoading ? 'Publication…' : 'Publier le bien'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
