/**
 * WaitlistAdmin — Dashboard interne de gestion de la waitlist Bailio
 * Accès : /admin/waitlist?secret=<VITE_ADMIN_SECRET>
 * Protection côté client + Bearer token sur toutes les API calls
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'}/waitlist`
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET ?? ''
const LAUNCH_MODE = import.meta.env.VITE_LAUNCH_MODE ?? 'live'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  total: number
  earlyAccessTaken: number
  earlyAccessRemaining: number
  notifiedCount: number
  thisWeek: number
  lastWeek: number
  growthRate: number
  signupsByDay: { day: string; count: number }[]
}

interface Entry {
  id: string
  email: string
  position: number
  isEarlyAccess: boolean
  notifiedAt: string | null
  createdAt: string
}

interface ListData {
  entries: Entry[]
  total: number
  page: number
  pages: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(secret: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e4e1db',
        borderRadius: 8,
        padding: '16px 20px',
      }}
    >
      <p style={{ margin: 0, fontSize: 11, color: '#9e9b96', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 700, color: '#0d0c0a', fontFamily: 'monospace' }}>
        {value}
      </p>
      {sub && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9e9b96' }}>{sub}</p>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WaitlistAdmin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const secret = searchParams.get('secret') ?? ''

  // Auth check
  useEffect(() => {
    if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
      navigate('/', { replace: true })
    }
  }, [secret, navigate])

  const [stats, setStats] = useState<Stats | null>(null)
  const [listData, setListData] = useState<ListData | null>(null)
  const [page, setPage] = useState(1)
  const [statsError, setStatsError] = useState('')
  const [listError, setListError] = useState('')

  // Action states
  const [addEmail, setAddEmail] = useState('')
  const [addStatus, setAddStatus] = useState('')
  const [notifyStatus, setNotifyStatus] = useState('')
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [confirmNotify, setConfirmNotify] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/stats`, { headers: authHeaders(secret) })
      const d = await r.json()
      if (d.success) setStats(d.data)
      else setStatsError(d.message)
    } catch {
      setStatsError('Impossible de charger les statistiques')
    }
  }, [secret])

  const fetchList = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/list?page=${page}&limit=20`, { headers: authHeaders(secret) })
      const d = await r.json()
      if (d.success) setListData(d.data)
      else setListError(d.message)
    } catch {
      setListError('Impossible de charger la liste')
    }
  }, [secret, page])

  useEffect(() => {
    if (secret === ADMIN_SECRET && ADMIN_SECRET) {
      fetchStats()
    }
  }, [fetchStats, secret])

  useEffect(() => {
    if (secret === ADMIN_SECRET && ADMIN_SECRET) {
      fetchList()
    }
  }, [fetchList, secret])

  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) return null

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addEmail.trim()) return
    setAddStatus('Ajout en cours...')
    try {
      const r = await fetch(`${API}/admin/add`, {
        method: 'POST',
        headers: authHeaders(secret),
        body: JSON.stringify({ email: addEmail.trim() }),
      })
      const d = await r.json()
      if (d.success) {
        setAddStatus(
          d.data.alreadyRegistered
            ? `Déjà inscrit (position #${d.data.position})`
            : `Ajouté — position #${d.data.position}`,
        )
        setAddEmail('')
        fetchStats()
        fetchList()
      } else {
        setAddStatus(`Erreur : ${d.message}`)
      }
    } catch {
      setAddStatus('Erreur réseau')
    }
    setTimeout(() => setAddStatus(''), 4000)
  }

  async function handleDelete(id: string) {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      return
    }
    setDeletingId(id)
    try {
      await fetch(`${API}/admin/${id}`, { method: 'DELETE', headers: authHeaders(secret) })
      setDeleteConfirm(null)
      fetchStats()
      fetchList()
    } catch {
      alert('Erreur lors de la suppression')
    }
    setDeletingId(null)
  }

  async function handleNotifyAll() {
    if (!confirmNotify) {
      setConfirmNotify(true)
      return
    }
    setNotifyLoading(true)
    setConfirmNotify(false)
    try {
      const r = await fetch(`${API}/notify-all`, { method: 'POST', headers: authHeaders(secret) })
      const d = await r.json()
      setNotifyStatus(d.message ?? `${d.data?.sent} envoyé(s), ${d.data?.errors} erreur(s)`)
      fetchStats()
    } catch {
      setNotifyStatus('Erreur réseau')
    }
    setNotifyLoading(false)
  }

  function handleExport() {
    const url = `${API}/admin/export`
    const a = document.createElement('a')
    a.href = url
    a.download = 'waitlist.csv'
    // Attach bearer via fetch + blob since <a> can't set headers
    fetch(url, { headers: authHeaders(secret) })
      .then((r) => r.blob())
      .then((blob) => {
        a.href = URL.createObjectURL(blob)
        a.click()
        URL.revokeObjectURL(a.href)
      })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const growthLabel =
    stats
      ? stats.growthRate > 0
        ? `+${stats.growthRate}% vs semaine dernière`
        : stats.growthRate < 0
          ? `${stats.growthRate}% vs semaine dernière`
          : '= vs semaine dernière'
      : ''

  const maxDayCount = stats
    ? Math.max(...stats.signupsByDay.map((d) => d.count), 1)
    : 1

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#fafaf8',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 14,
        color: '#0d0c0a',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#1a1a2e',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Bailio
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>/</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Admin Waitlist</span>
        </div>
        <span
          style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 12,
            background: LAUNCH_MODE === 'waitlist' ? '#92400e' : '#1b5e3b',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          MODE: {LAUNCH_MODE.toUpperCase()}
        </span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>

        {/* Launch mode notice */}
        {LAUNCH_MODE === 'waitlist' && (
          <div
            style={{
              background: '#fdf5ec',
              border: '1px solid #f3c99a',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 24,
              fontSize: 13,
              color: '#92400e',
            }}
          >
            <strong>Mode waitlist actif.</strong> Pour passer en mode live, changez{' '}
            <code style={{ background: '#fff3e0', padding: '1px 5px', borderRadius: 3 }}>LAUNCH_MODE=live</code> dans vos
            variables d'environnement Vercel et redéployez.
          </div>
        )}

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>Statistiques</h2>
        {statsError && <p style={{ color: '#9b1c1c', marginBottom: 16 }}>{statsError}</p>}

        {stats ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <StatCard label="Total inscrits" value={stats.total} />
              <StatCard
                label="Early Access pris"
                value={`${stats.earlyAccessTaken} / 150`}
                sub={`${stats.earlyAccessRemaining} restante(s)`}
              />
              <StatCard label="Notifiés" value={stats.notifiedCount} />
              <StatCard
                label="Cette semaine"
                value={stats.thisWeek}
                sub={growthLabel}
              />
              <StatCard label="Semaine préc." value={stats.lastWeek} />
            </div>

            {/* Sparkline table — 14 days */}
            {stats.signupsByDay.length > 0 && (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e4e1db',
                  borderRadius: 8,
                  padding: '16px 20px',
                  marginBottom: 28,
                }}
              >
                <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: '#9e9b96', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Inscriptions — 14 derniers jours
                </p>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60 }}>
                  {stats.signupsByDay.map((d) => (
                    <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 9, color: '#9e9b96' }}>{d.count}</span>
                      <div
                        style={{
                          width: '100%',
                          height: `${Math.round((d.count / maxDayCount) * 40) + 4}px`,
                          background: '#1a1a2e',
                          borderRadius: 2,
                          minHeight: 4,
                        }}
                        title={`${d.day} : ${d.count} inscription(s)`}
                      />
                      <span style={{ fontSize: 8, color: '#ccc9c3', transform: 'rotate(-40deg)', transformOrigin: 'top center', whiteSpace: 'nowrap' }}>
                        {d.day.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ color: '#9e9b96' }}>Chargement...</p>
        )}

        {/* ── Actions ────────────────────────────────────────────────────── */}
        <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>Actions</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {/* Notify all */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e4e1db',
              borderRadius: 8,
              padding: '16px 20px',
            }}
          >
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Email de lancement</p>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9e9b96' }}>
              Envoie l'email de lancement à tous les inscrits non encore notifiés.
            </p>
            {confirmNotify && (
              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#9b1c1c', fontWeight: 600 }}>
                Cette action est irréversible. Confirmer ?
              </p>
            )}
            {notifyStatus && (
              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#1b5e3b' }}>{notifyStatus}</p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleNotifyAll}
                disabled={notifyLoading}
                style={{
                  padding: '8px 16px',
                  background: confirmNotify ? '#9b1c1c' : '#1a1a2e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: notifyLoading ? 'not-allowed' : 'pointer',
                  opacity: notifyLoading ? 0.6 : 1,
                }}
              >
                {notifyLoading ? 'Envoi...' : confirmNotify ? 'Oui, envoyer' : 'Envoyer les emails'}
              </button>
              {confirmNotify && (
                <button
                  onClick={() => setConfirmNotify(false)}
                  style={{
                    padding: '8px 14px',
                    background: 'transparent',
                    color: '#5a5754',
                    border: '1px solid #e4e1db',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
              )}
            </div>
          </div>

          {/* Manual add */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e4e1db',
              borderRadius: 8,
              padding: '16px 20px',
            }}
          >
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Ajouter manuellement</p>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="email@exemple.fr"
                required
                style={{
                  padding: '8px 12px',
                  background: '#f8f7f4',
                  border: '1px solid #e4e1db',
                  borderRadius: 6,
                  fontSize: 13,
                  outline: 'none',
                  color: '#0d0c0a',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  background: '#1a1a2e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                Ajouter
              </button>
              {addStatus && (
                <p style={{ margin: 0, fontSize: 12, color: addStatus.startsWith('Erreur') ? '#9b1c1c' : '#1b5e3b' }}>
                  {addStatus}
                </p>
              )}
            </form>
          </div>

          {/* Export */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e4e1db',
              borderRadius: 8,
              padding: '16px 20px',
            }}
          >
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Export CSV</p>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9e9b96' }}>
              Télécharge tous les emails avec leur position et statut.
            </p>
            <button
              onClick={handleExport}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#1a1a2e',
                border: '1px solid #1a1a2e',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Exporter (CSV)
            </button>
          </div>
        </div>

        {/* ── List ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            Inscrits {listData ? `(${listData.total})` : ''}
          </h2>
          {listData && listData.pages > 1 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={pagerBtn(page === 1)}
              >
                ← Préc.
              </button>
              <span style={{ color: '#9e9b96' }}>
                {page} / {listData.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(listData.pages, p + 1))}
                disabled={page === listData.pages}
                style={pagerBtn(page === listData.pages)}
              >
                Suiv. →
              </button>
            </div>
          )}
        </div>

        {listError && <p style={{ color: '#9b1c1c' }}>{listError}</p>}

        {listData ? (
          <div style={{ background: '#fff', border: '1px solid #e4e1db', borderRadius: 8, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f4f2ee', textAlign: 'left' }}>
                  {['#', 'Email', "Date d'inscription", 'Early Access', 'Notifié', 'Action'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 14px',
                        fontWeight: 600,
                        color: '#5a5754',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid #e4e1db',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listData.entries.map((entry, i) => (
                  <tr
                    key={entry.id}
                    style={{ borderBottom: i < listData.entries.length - 1 ? '1px solid #f4f2ee' : 'none' }}
                  >
                    <td style={tdStyle}>{entry.position}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#1a1a2e' }}>{entry.email}</td>
                    <td style={{ ...tdStyle, color: '#9e9b96', whiteSpace: 'nowrap' }}>{fmtDate(entry.createdAt)}</td>
                    <td style={tdStyle}>
                      {entry.isEarlyAccess ? (
                        <span style={badge('#fdf5ec', '#92400e')}>Early</span>
                      ) : (
                        <span style={{ color: '#ccc9c3' }}>—</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {entry.notifiedAt ? (
                        <span style={badge('#edf7f2', '#1b5e3b')}>Oui</span>
                      ) : (
                        <span style={{ color: '#ccc9c3' }}>Non</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        style={{
                          padding: '4px 10px',
                          background: deleteConfirm === entry.id ? '#9b1c1c' : 'transparent',
                          color: deleteConfirm === entry.id ? '#fff' : '#9b1c1c',
                          border: `1px solid ${deleteConfirm === entry.id ? '#9b1c1c' : '#fca5a5'}`,
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        {deleteConfirm === entry.id ? 'Confirmer' : 'Supprimer'}
                      </button>
                      {deleteConfirm === entry.id && (
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          style={{
                            marginLeft: 6,
                            padding: '4px 10px',
                            background: 'transparent',
                            color: '#9e9b96',
                            border: '1px solid #e4e1db',
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#9e9b96' }}>Chargement...</p>
        )}

        <p style={{ marginTop: 32, fontSize: 11, color: '#ccc9c3', textAlign: 'center' }}>
          Bailio Admin — usage interne uniquement
        </p>
      </div>
    </div>
  )
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  verticalAlign: 'middle',
}

function badge(bg: string, color: string): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '2px 8px',
    background: bg,
    color,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 600,
  }
}

function pagerBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: '5px 12px',
    background: 'transparent',
    border: '1px solid #e4e1db',
    borderRadius: 5,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    fontSize: 13,
    color: '#5a5754',
  }
}
