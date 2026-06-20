import { useState, useEffect, useCallback } from 'react'
import { Bell, Trash2, Plus, X, Search, Loader } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BAI } from '../../constants/bailio-tokens'
import { apiClient } from '../../services/api.service'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SearchAlert {
  id: string
  name: string
  city: string | null
  type: string | null
  minPrice: number | null
  maxPrice: number | null
  minSurface: number | null
  rooms: number | null
  furnished: boolean | null
  active: boolean
  newCount: number
  createdAt: string
  lastNotifiedAt: string | null
}

interface AlertForm {
  name: string
  city: string
  type: string
  minPrice: string
  maxPrice: string
  minSurface: string
  rooms: string
  furnished: boolean
}

const EMPTY_FORM: AlertForm = { name: '', city: '', type: '', minPrice: '', maxPrice: '', minSurface: '', rooms: '', furnished: false }

const TYPE_LABELS: Record<string, string> = {
  '': 'Tous types',
  APARTMENT: 'Appartement',
  HOUSE: 'Maison',
  STUDIO: 'Studio',
  DUPLEX: 'Duplex',
  LOFT: 'Loft',
}

// ─── Helper : construire l'URL de recherche depuis une alerte ─────────────────
function buildSearchUrl(alert: SearchAlert): string {
  const params = new URLSearchParams()
  if (alert.city)     params.set('city', alert.city)
  if (alert.type)     params.set('type', alert.type)
  if (alert.minPrice) params.set('minPrice', String(alert.minPrice))
  if (alert.maxPrice) params.set('maxPrice', String(alert.maxPrice))
  return `/search?${params.toString()}`
}

// ─── Composant toggle ─────────────────────────────────────────────────────────
function Toggle({ active, onChange, loading }: { active: boolean; onChange: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      title={active ? 'Désactiver l\'alerte' : 'Activer l\'alerte'}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: active ? BAI.tenant : BAI.border,
        border: 'none', cursor: loading ? 'default' : 'pointer',
        position: 'relative', transition: 'background 0.2s', padding: 0,
        opacity: loading ? 0.6 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: active ? 23 : 3, width: 18, height: 18,
        borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function SearchAlerts() {
  const [alerts, setAlerts] = useState<SearchAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AlertForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Chargement initial ──────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: { alerts: SearchAlert[] } }>('/alerts')
      setAlerts(res.data.data.alerts)
    } catch {
      toast.error('Impossible de charger vos alertes.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  // ── Créer une alerte ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim() || null,
        type: form.type || null,
        minPrice: form.minPrice ? Number(form.minPrice) : null,
        maxPrice: form.maxPrice ? Number(form.maxPrice) : null,
        minSurface: form.minSurface ? Number(form.minSurface) : null,
        rooms: form.rooms ? Number(form.rooms) : null,
        furnished: form.furnished || null,
      }
      const res = await apiClient.post<{ data: { alert: SearchAlert } }>('/alerts', payload)
      setAlerts(prev => [res.data.data.alert, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
      toast.success('Alerte créée ! Vous serez notifié par email.')
    } catch {
      toast.error('Impossible de créer l\'alerte.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Activer / désactiver ────────────────────────────────────────────────────
  const handleToggle = async (alert: SearchAlert) => {
    setTogglingId(alert.id)
    try {
      const res = await apiClient.put<{ data: { alert: SearchAlert } }>(`/alerts/${alert.id}`, { active: !alert.active })
      setAlerts(prev => prev.map(a => a.id === alert.id ? res.data.data.alert : a))
    } catch {
      toast.error('Impossible de modifier l\'alerte.')
    } finally {
      setTogglingId(null)
    }
  }

  // ── Supprimer ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await apiClient.delete(`/alerts/${id}`)
      setAlerts(prev => prev.filter(a => a.id !== id))
      toast.success('Alerte supprimée.')
    } catch {
      toast.error('Impossible de supprimer l\'alerte.')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Marquer comme vus ───────────────────────────────────────────────────────
  const handleMarkSeen = async (id: string) => {
    try {
      await apiClient.post(`/alerts/${id}/mark-seen`)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, newCount: 0 } : a))
    } catch { /* silencieux */ }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${BAI.border}`, background: BAI.bgInput,
    fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, outline: 'none',
  }

  const activeCount = alerts.filter(a => a.active).length

  return (
    <>
      {/* ── Hero sombre ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#0a0d1a', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px) clamp(32px,5vw,56px)' }}>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, margin: 0 }}>
          Locataire
        </p>
        <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,42px)', fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: '6px 0 8px', lineHeight: 1.1 }}>
          Mes alertes de recherche
        </h1>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
          Recevez un email dès qu'un bien correspondant à vos critères est publié.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
          {[
            { label: 'Alertes actives', value: activeCount },
            { label: 'Total', value: alerts.length },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 16, padding: '16px 24px', minWidth: 120 }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontFamily: BAI.fontDisplay, fontSize: 36, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Corps ──────────────────────────────────────────────────────────── */}
      <div style={{ background: BAI.bgBase, minHeight: '60vh' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,5vw,32px)' }}>

          {/* Bouton créer */}
          <button
            onClick={() => setShowForm(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: BAI.night, color: '#fff',
              fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', marginBottom: showForm ? 16 : 28,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Annuler' : 'Créer une alerte'}
          </button>

          {/* Formulaire */}
          {showForm && (
            <form onSubmit={handleSubmit} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: 24, marginBottom: 28, boxShadow: BAI.shadowMd }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.inkMid, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Nouvelle alerte
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>Nom de l'alerte *</label>
                  <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex. Studio Paris centre" style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>Ville</label>
                  <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Paris, Lyon…" style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>Type de bien</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>Budget min (€)</label>
                  <input type="number" min={0} value={form.minPrice} onChange={e => setForm(f => ({ ...f, minPrice: e.target.value }))} placeholder="300" style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>Budget max (€)</label>
                  <input type="number" min={0} value={form.maxPrice} onChange={e => setForm(f => ({ ...f, maxPrice: e.target.value }))} placeholder="1 200" style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>Surface min (m²)</label>
                  <input type="number" min={0} value={form.minSurface} onChange={e => setForm(f => ({ ...f, minSurface: e.target.value }))} placeholder="25" style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>Pièces min</label>
                  <select value={form.rooms} onChange={e => setForm(f => ({ ...f, rooms: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Peu importe</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} pièce{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
                  <input type="checkbox" id="furnished" checked={form.furnished} onChange={e => setForm(f => ({ ...f, furnished: e.target.checked }))} style={{ width: 16, height: 16, accentColor: BAI.caramel, cursor: 'pointer' }} />
                  <label htmlFor="furnished" style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink, cursor: 'pointer' }}>Meublé uniquement</label>
                </div>
              </div>

              <button
                type="submit" disabled={submitting}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: BAI.caramel, color: '#fff', fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {submitting && <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                {submitting ? 'Création…' : 'Créer l\'alerte'}
              </button>
            </form>
          )}

          {/* Chargement */}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
              <Loader size={28} color={BAI.inkFaint} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {/* État vide */}
          {!isLoading && alerts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '72px 0', color: BAI.inkFaint }}>
              <Bell size={44} style={{ opacity: 0.18, margin: '0 auto 16px', display: 'block', color: BAI.inkFaint }} />
              <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 22, color: BAI.inkMid, marginBottom: 8 }}>Aucune alerte</p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint, marginBottom: 24, lineHeight: 1.6 }}>
                Créez une alerte pour recevoir un email<br />dès qu'un bien correspondant est publié.
              </p>
              <button onClick={() => setShowForm(true)} style={{ background: BAI.night, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Créer ma première alerte
              </button>
            </div>
          )}

          {/* Liste des alertes */}
          {!isLoading && alerts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  style={{
                    background: BAI.bgSurface,
                    border: `1px solid ${alert.newCount > 0 ? BAI.caramel : BAI.border}`,
                    borderRadius: 12, padding: '16px 20px',
                    boxShadow: BAI.shadowMd,
                    opacity: alert.active ? 1 : 0.55,
                    transition: 'opacity 0.2s, border-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    {/* Infos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        <p style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, color: BAI.ink, margin: 0 }}>
                          {alert.name}
                        </p>
                        {alert.newCount > 0 && (
                          <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.caramel, background: BAI.caramelLight, padding: '2px 8px', borderRadius: 20 }}>
                            {alert.newCount} nouveau{alert.newCount > 1 ? 'x' : ''}
                          </span>
                        )}
                      </div>

                      {/* Chips filtres */}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                        {alert.city && (
                          <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkMid, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 5, padding: '2px 7px' }}>
                            📍 {alert.city}
                          </span>
                        )}
                        {alert.type && (
                          <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkMid, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 5, padding: '2px 7px' }}>
                            {TYPE_LABELS[alert.type] ?? alert.type}
                          </span>
                        )}
                        {(alert.minPrice != null || alert.maxPrice != null) && (
                          <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkMid, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 5, padding: '2px 7px' }}>
                            {alert.minPrice ? `${alert.minPrice} €` : ''}
                            {alert.minPrice && alert.maxPrice ? ' – ' : ''}
                            {alert.maxPrice ? `${alert.maxPrice} €` : ''}
                          </span>
                        )}
                        {alert.furnished && (
                          <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkMid, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 5, padding: '2px 7px' }}>
                            Meublé
                          </span>
                        )}
                      </div>

                      {/* Lien recherche */}
                      {alert.newCount > 0 ? (
                        <Link
                          to={buildSearchUrl(alert)}
                          onClick={() => handleMarkSeen(alert.id)}
                          style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.caramel, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                        >
                          <Search size={12} /> Voir les {alert.newCount} nouveau{alert.newCount > 1 ? 'x' : ''} bien{alert.newCount > 1 ? 's' : ''}
                        </Link>
                      ) : (
                        <Link
                          to={buildSearchUrl(alert)}
                          style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                        >
                          <Search size={12} /> Voir les biens correspondants
                        </Link>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <Toggle
                        active={alert.active}
                        onChange={() => handleToggle(alert)}
                        loading={togglingId === alert.id}
                      />
                      <button
                        onClick={() => handleDelete(alert.id)}
                        disabled={deletingId === alert.id}
                        title="Supprimer"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 34, height: 34, borderRadius: 7,
                          border: `1px solid ${BAI.border}`, background: 'transparent',
                          cursor: deletingId === alert.id ? 'default' : 'pointer',
                          color: BAI.inkFaint, transition: 'all 0.15s',
                          opacity: deletingId === alert.id ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = BAI.errorLight; el.style.color = BAI.error; el.style.borderColor = BAI.error }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = ''; el.style.color = BAI.inkFaint; el.style.borderColor = BAI.border }}
                      >
                        {deletingId === alert.id
                          ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
