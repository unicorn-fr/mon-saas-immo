/**
 * ReportUserModal — Modale de signalement d'un utilisateur suspect.
 * Accessible depuis ApplicationManagement (prop → tenant) et ChatWindow.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Loader2, CheckCircle2 } from 'lucide-react'
import { shareApi } from '../../services/dossierService'
import toast from 'react-hot-toast'

const REASONS = [
  { value: 'FAKE_LISTING',   label: '🏠 Annonce fictive / logement inexistant' },
  { value: 'DATA_THEFT',     label: '🪪 Collecte abusive de données personnelles' },
  { value: 'FAKE_DOCUMENTS', label: '📄 Faux documents fournis' },
  { value: 'HARASSMENT',     label: '⚠️ Harcèlement ou comportement abusif' },
  { value: 'SCAM',           label: '💸 Tentative d\'arnaque / demande d\'argent' },
  { value: 'OTHER',          label: '🔍 Autre motif' },
] as const

interface Props {
  targetId: string
  targetName: string
  isOpen: boolean
  onClose: () => void
}

export function ReportUserModal({ targetId, targetName, isOpen, onClose }: Props) {
  const [reason, setReason] = useState<string>('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!reason) { toast.error('Veuillez sélectionner un motif'); return }
    setLoading(true)
    try {
      await shareApi.reportUser(targetId, reason, details || undefined)
      setDone(true)
    } catch {
      toast.error('Erreur lors du signalement')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setDetails('')
    setDone(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            }}
          >
            {done ? (
              /* ─── Confirmation ─── */
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: '#ecfdf5', margin: '0 auto 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2 style={{ width: 32, height: 32, color: '#10b981' }} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0d0c0a', margin: '0 0 12px' }}>
                  Signalement enregistré
                </h2>
                <p style={{ color: '#5a5754', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
                  Notre équipe va examiner ce signalement dans les 48h. Merci de contribuer à la sécurité de la plateforme.
                </p>
                <button
                  onClick={handleClose}
                  style={{
                    background: '#0d0c0a', color: '#ffffff',
                    border: 'none', borderRadius: '12px',
                    padding: '12px 32px', fontWeight: 600, fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Fermer
                </button>
              </div>
            ) : (
              /* ─── Form ─── */
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '12px',
                      background: '#fef2f2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <AlertTriangle style={{ width: 20, height: 20, color: '#dc2626' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0d0c0a', margin: 0 }}>
                        Signaler un utilisateur
                      </h2>
                      <p style={{ fontSize: '13px', color: '#9e9b96', margin: '2px 0 0' }}>
                        {targetName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    style={{
                      background: '#fafaf8', border: '1px solid #e2e8f0',
                      borderRadius: '8px', padding: '6px', cursor: 'pointer', lineHeight: 0,
                    }}
                  >
                    <X style={{ width: 16, height: 16, color: '#64748b' }} />
                  </button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0d0c0a', margin: '0 0 8px' }}>
                    Motif du signalement <span style={{ color: '#ef4444' }}>*</span>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {REASONS.map((r) => (
                      <label
                        key={r.value}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                          border: `1px solid ${reason === r.value ? '#fca5a5' : '#e4e1db'}`,
                          background: reason === r.value ? '#fef2f2' : '#fafaf8',
                          transition: 'all 0.12s',
                        }}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={r.value}
                          checked={reason === r.value}
                          onChange={() => setReason(r.value)}
                          style={{ accentColor: '#dc2626' }}
                        />
                        <span style={{ fontSize: '13px', color: '#0d0c0a' }}>{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0d0c0a', margin: '0 0 6px' }}>
                    Précisions (optionnel)
                  </p>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Décrivez ce qui s'est passé…"
                    rows={3}
                    maxLength={500}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 12px', borderRadius: '10px',
                      border: '1px solid #e2e8f0', resize: 'none',
                      fontSize: '13px', color: '#0d0c0a', background: '#ffffff',
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{
                  padding: '12px 14px', borderRadius: '10px',
                  background: '#fffbeb', border: '1px solid #fde68a',
                  marginBottom: '20px',
                }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#92400e', lineHeight: 1.5 }}>
                    ⚠️ Les faux signalements entraînent des sanctions. Notre équipe examine chaque dossier individuellement.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleClose}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '12px',
                      border: '1px solid #e2e8f0', background: '#fafaf8',
                      color: '#5a5754', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !reason}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '12px',
                      border: 'none', background: loading || !reason ? '#fca5a5' : '#dc2626',
                      color: '#ffffff', fontWeight: 600, fontSize: '14px',
                      cursor: loading || !reason ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    {loading && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
                    Signaler
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
