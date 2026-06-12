// TODO: brancher sur GET /api/v1/alerts quand disponible
import { useState } from 'react'
import { Bell, Trash2, Plus, X } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { Layout } from '../../components/layout/Layout'

interface Alert {
  id: string
  name: string
  city: string
  type: string
  minPrice: number | ''
  maxPrice: number | ''
  active: boolean
  newCount: number
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  '': 'Tous types',
  APARTMENT: 'Appartement',
  HOUSE: 'Maison',
  STUDIO: 'Studio',
  DUPLEX: 'Duplex',
}

const INITIAL_ALERTS: Alert[] = [
  { id: '1', name: 'Studio Paris 500-800€', city: 'Paris', type: 'STUDIO', minPrice: 500, maxPrice: 800, active: true, newCount: 3, createdAt: new Date().toISOString() },
  { id: '2', name: 'Appartement Lyon', city: 'Lyon', type: 'APARTMENT', minPrice: 600, maxPrice: 1200, active: true, newCount: 0, createdAt: new Date().toISOString() },
]

export default function SearchAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', city: '', type: '', minPrice: '', maxPrice: '' })

  const handleToggle = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a))
  }

  const handleDelete = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const newAlert: Alert = {
      id: Date.now().toString(),
      name: form.name.trim(),
      city: form.city.trim(),
      type: form.type,
      minPrice: form.minPrice ? Number(form.minPrice) : '',
      maxPrice: form.maxPrice ? Number(form.maxPrice) : '',
      active: true,
      newCount: 0,
      createdAt: new Date().toISOString(),
    }
    setAlerts(prev => [newAlert, ...prev])
    setForm({ name: '', city: '', type: '', minPrice: '', maxPrice: '' })
    setShowForm(false)
  }

  return (
    <Layout>
      {/* ── Hero sombre Hyperbeat ── */}
      <div style={{ background: '#0a0d1a', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px) clamp(32px,5vw,56px)' }}>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, margin: 0 }}>
          LOCATAIRE
        </p>
        <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,42px)', fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: '6px 0 8px', lineHeight: 1.1 }}>
          Mes alertes de recherche
        </h1>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
          Soyez informé en temps réel des nouvelles annonces correspondant à vos critères.
        </p>
        <div className="flex flex-wrap gap-3" style={{ marginTop: 28 }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 16, padding: '16px 24px', minWidth: 130 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>ALERTES ACTIVES</p>
            <p style={{ fontFamily: BAI.fontDisplay, fontSize: 36, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1 }}>
              {alerts.filter(a => a.active).length}
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 16, padding: '16px 24px', minWidth: 130 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>TOTAL</p>
            <p style={{ fontFamily: BAI.fontDisplay, fontSize: 36, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1 }}>
              {alerts.length}
            </p>
          </div>
        </div>
      </div>

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
            cursor: 'pointer', marginBottom: showForm ? 16 : 32,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Annuler' : 'Créer une alerte'}
        </button>

        {/* Formulaire inline */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: 24, marginBottom: 32, boxShadow: BAI.shadowMd }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.ink, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nouvelle alerte</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              {/* Nom */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>Nom de l'alerte *</label>
                <input
                  type="text" required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex. Studio Paris centre"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgInput, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, outline: 'none' }}
                />
              </div>
              {/* Ville */}
              <div>
                <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>Ville</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Paris, Lyon…"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgInput, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, outline: 'none' }}
                />
              </div>
              {/* Type */}
              <div>
                <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>Type de bien</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgInput, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, cursor: 'pointer', outline: 'none' }}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {/* Budget min */}
              <div>
                <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>Budget min (€)</label>
                <input
                  type="number" min={0}
                  value={form.minPrice}
                  onChange={e => setForm(f => ({ ...f, minPrice: e.target.value }))}
                  placeholder="300"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgInput, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, outline: 'none' }}
                />
              </div>
              {/* Budget max */}
              <div>
                <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>Budget max (€)</label>
                <input
                  type="number" min={0}
                  value={form.maxPrice}
                  onChange={e => setForm(f => ({ ...f, maxPrice: e.target.value }))}
                  placeholder="1200"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgInput, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, outline: 'none' }}
                />
              </div>
            </div>
            <button type="submit" style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: BAI.caramel, color: '#fff', fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
              Créer l'alerte
            </button>
          </form>
        )}

        {/* État vide */}
        {alerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: BAI.inkFaint }}>
            <Bell size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block', color: BAI.inkFaint }} />
            <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 22, color: BAI.inkMid, marginBottom: 8 }}>Aucune alerte</p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint, marginBottom: 24 }}>Créez votre première alerte pour ne manquer aucune annonce.</p>
            <button onClick={() => setShowForm(true)}
              style={{ background: BAI.night, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Créer ma première alerte
            </button>
          </div>
        )}

        {/* Liste des alertes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.map(alert => (
            <div key={alert.id} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '18px 20px', boxShadow: BAI.shadowMd, opacity: alert.active ? 1 : 0.6, transition: 'opacity 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <p style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 15, color: BAI.ink, margin: 0 }}>{alert.name}</p>
                    {alert.newCount > 0 && (
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.caramel, background: BAI.caramelLight, padding: '2px 8px', borderRadius: 12 }}>
                        {alert.newCount} nouveau{alert.newCount > 1 ? 'x' : ''} bien{alert.newCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {/* Chips filtres */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {alert.city && (
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 6, padding: '3px 8px' }}>
                        {alert.city}
                      </span>
                    )}
                    {alert.type && (
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 6, padding: '3px 8px' }}>
                        {TYPE_LABELS[alert.type] ?? alert.type}
                      </span>
                    )}
                    {(alert.minPrice !== '' || alert.maxPrice !== '') && (
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 6, padding: '3px 8px' }}>
                        {alert.minPrice !== '' ? `${alert.minPrice}€` : ''}
                        {alert.minPrice !== '' && alert.maxPrice !== '' ? ' – ' : ''}
                        {alert.maxPrice !== '' ? `${alert.maxPrice}€` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(alert.id)}
                    title={alert.active ? 'Désactiver' : 'Activer'}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: alert.active ? BAI.tenant : BAI.border,
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', padding: 0,
                    }}>
                    <span style={{ position: 'absolute', top: 3, left: alert.active ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                  {/* Supprimer */}
                  <button
                    onClick={() => handleDelete(alert.id)}
                    title="Supprimer l'alerte"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: `1px solid ${BAI.border}`, background: 'transparent', cursor: 'pointer', color: BAI.inkFaint, transition: 'all 0.15s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = BAI.errorLight; el.style.color = BAI.error; el.style.borderColor = BAI.error }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = ''; el.style.color = BAI.inkFaint; el.style.borderColor = BAI.border }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
      </div>
    </Layout>
  )
}
