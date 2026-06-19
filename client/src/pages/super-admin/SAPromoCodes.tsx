import { useEffect, useState } from 'react'
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Users, Loader2, X, Check } from 'lucide-react'
import { apiClient } from '../../services/api.service'
import toast from 'react-hot-toast'

type PlanType = 'SOLO' | 'PRO' | 'EXPERT'

interface PromoCode {
  id: string
  code: string
  planGranted: PlanType
  durationDays: number | null
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  isActive: boolean
  note: string | null
  createdAt: string
  redemptions: Array<{
    user: { email: string; firstName: string; lastName: string }
    redeemedAt: string
    planExpires: string | null
  }>
}

const PLAN_COLORS: Record<PlanType, string> = {
  SOLO: '#c4976a',
  PRO: '#1a3270',
  EXPERT: '#1b5e3b',
}

const inp: React.CSSProperties = {
  background: '#0d1526', border: '1px solid #1a2744', borderRadius: 8,
  color: '#e2e8f0', fontSize: 13, padding: '9px 12px',
  fontFamily: 'DM Sans, system-ui, sans-serif', outline: 'none', width: '100%',
}

const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.45)', marginBottom: 5, display: 'block',
  fontFamily: 'DM Sans, system-ui, sans-serif',
}

export default function SAPromoCodes() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const [form, setForm] = useState({
    code: '',
    planGranted: 'PRO' as PlanType,
    durationDays: '',
    maxUses: '',
    expiresAt: '',
    note: '',
  })
  const [creating, setCreating] = useState(false)

  const fetchCodes = async () => {
    try {
      const res = await apiClient.get<PromoCode[]>('/super-admin/promo-codes')
      setCodes(Array.isArray(res.data) ? res.data : (res.data as { data: PromoCode[] }).data ?? [])
    } catch {
      toast.error('Impossible de charger les codes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCodes() }, [])

  const handleCreate = async () => {
    if (!form.code.trim()) { toast.error('Code requis'); return }
    setCreating(true)
    try {
      await apiClient.post('/super-admin/promo-codes', {
        code: form.code.trim().toUpperCase(),
        planGranted: form.planGranted,
        durationDays: form.durationDays ? Number(form.durationDays) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
        note: form.note || null,
      })
      toast.success(`Code "${form.code.toUpperCase()}" créé`)
      setForm({ code: '', planGranted: 'PRO', durationDays: '', maxUses: '', expiresAt: '', note: '' })
      setShowForm(false)
      fetchCodes()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur'
      toast.error(msg)
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await apiClient.patch(`/super-admin/promo-codes/${id}`, { isActive: !current })
      setCodes(c => c.map(x => x.id === id ? { ...x, isActive: !current } : x))
    } catch { toast.error('Erreur') }
  }

  const deleteCode = async (id: string, code: string) => {
    if (!window.confirm(`Supprimer le code "${code}" ?`)) return
    try {
      await apiClient.delete(`/super-admin/promo-codes/${id}`)
      setCodes(c => c.filter(x => x.id !== id))
      toast.success('Code supprimé')
    } catch { toast.error('Erreur') }
  }

  return (
    <div style={{ padding: 'clamp(20px,3vw,32px)', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(196,151,106,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={18} color="#c4976a" />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c4976a', margin: 0 }}>Super Admin</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>Codes Promo</h1>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#c4976a', color: '#fff', border: 'none',
            borderRadius: 9, padding: '10px 18px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Annuler' : 'Nouveau code'}
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div style={{ background: '#0d1526', border: '1px solid #1a2744', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', margin: '0 0 18px' }}>Créer un code</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
            <div>
              <span style={label}>Code *</span>
              <input style={{ ...inp, letterSpacing: '0.08em', fontWeight: 700 }} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="BAILIO2026" />
            </div>
            <div>
              <span style={label}>Plan accordé *</span>
              <select style={inp} value={form.planGranted} onChange={e => setForm(f => ({ ...f, planGranted: e.target.value as PlanType }))}>
                <option value="SOLO">SOLO</option>
                <option value="PRO">PRO</option>
                <option value="EXPERT">EXPERT</option>
              </select>
            </div>
            <div>
              <span style={label}>Durée (jours) — vide = permanent</span>
              <input style={inp} type="number" min={1} value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))} placeholder="30" />
            </div>
            <div>
              <span style={label}>Max utilisations — vide = illimité</span>
              <input style={inp} type="number" min={1} value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="1" />
            </div>
            <div>
              <span style={label}>Expiration du code</span>
              <input style={inp} type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
            <div>
              <span style={label}>Note interne</span>
              <input style={inp} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Accès offert à..." />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#c4976a', color: '#fff', border: 'none',
              borderRadius: 9, padding: '10px 20px',
              fontSize: 13, fontWeight: 600, cursor: creating ? 'wait' : 'pointer',
              opacity: creating ? 0.7 : 1,
            }}
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Créer le code
          </button>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={28} color="#c4976a" className="animate-spin" />
        </div>
      ) : codes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
          Aucun code promo. Créez-en un ci-dessus.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {codes.map(code => (
            <div key={code.id} style={{ background: '#0d1526', border: `1px solid ${expanded === code.id ? '#1a2744' : '#151f38'}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Row */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', flexWrap: 'wrap' }}
                onClick={() => setExpanded(expanded === code.id ? null : code.id)}
              >
                {/* Code badge */}
                <span style={{
                  fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.08em', padding: '4px 10px', borderRadius: 6,
                  background: code.isActive ? 'rgba(196,151,106,0.15)' : 'rgba(255,255,255,0.05)',
                  color: code.isActive ? '#c4976a' : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${code.isActive ? 'rgba(196,151,106,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  textDecoration: code.isActive ? 'none' : 'line-through',
                }}>
                  {code.code}
                </span>

                {/* Plan badge */}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                  background: PLAN_COLORS[code.planGranted] + '22',
                  color: PLAN_COLORS[code.planGranted],
                  border: `1px solid ${PLAN_COLORS[code.planGranted]}44`,
                }}>
                  {code.planGranted}
                </span>

                {/* Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                  <Users size={13} />
                  <span>{code.usedCount}{code.maxUses ? `/${code.maxUses}` : ''} utilisation{code.usedCount !== 1 ? 's' : ''}</span>
                </div>

                {code.durationDays && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{code.durationDays}j</span>
                )}
                {!code.durationDays && (
                  <span style={{ fontSize: 11, color: 'rgba(155,212,186,0.7)' }}>Permanent</span>
                )}

                {code.note && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {code.note}
                  </span>
                )}

                {/* Actions */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => toggleActive(code.id, code.isActive)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: code.isActive ? '#4ade80' : 'rgba(255,255,255,0.25)', display: 'flex' }}
                    title={code.isActive ? 'Désactiver' : 'Activer'}
                  >
                    {code.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button
                    onClick={() => deleteCode(code.id, code.code)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,80,80,0.5)', display: 'flex' }}
                    title="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Expanded — liste des utilisateurs */}
              {expanded === code.id && (
                <div style={{ borderTop: '1px solid #1a2744', padding: '14px 18px' }}>
                  {code.redemptions.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Aucune utilisation pour l'instant.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 6px' }}>Utilisateurs ({code.redemptions.length})</p>
                      {code.redemptions.map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                            {r.user.firstName} {r.user.lastName}
                          </span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{r.user.email}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                            {new Date(r.redeemedAt).toLocaleDateString('fr-FR')}
                          </span>
                          {r.planExpires && (
                            <span style={{ fontSize: 11, color: '#c4976a' }}>
                              jusqu'au {new Date(r.planExpires).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                          {!r.planExpires && (
                            <span style={{ fontSize: 11, color: '#4ade80' }}>permanent</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
