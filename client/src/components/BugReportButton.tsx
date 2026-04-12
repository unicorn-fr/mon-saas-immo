/**
 * BugReportButton — Bouton flottant bas-droit pour signaler un bug
 */
import { useState, useRef } from 'react'
import { Bug, X, Send, Loader2, CheckCircle, Paperclip } from 'lucide-react'
import { apiClient as api } from '../services/api.service'
import toast from 'react-hot-toast'

const M = {
  surface:  '#ffffff',
  muted:    '#f4f2ee',
  ink:      '#0d0c0a',
  inkMid:   '#5a5754',
  inkFaint: '#9e9b96',
  night:    '#1a1a2e',
  caramel:  '#c4976a',
  border:   '#e4e1db',
  body:     "'DM Sans', system-ui, sans-serif",
  display:  "'Cormorant Garamond', Georgia, serif",
}

const BUG_TYPES = [
  { value: 'ui', label: 'Problème d\'affichage' },
  { value: 'error', label: 'Erreur / crash' },
  { value: 'performance', label: 'Lenteur' },
  { value: 'feature', label: 'Fonctionnalité cassée' },
  { value: 'other', label: 'Autre' },
]

export function BugReportButton() {
  const [open, setOpen] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', type: 'error' })
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setForm({ title: '', description: '', type: 'error' })
    setScreenshot(null)
    setSent(false)
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(reset, 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) return

    setSending(true)
    try {
      const body = new FormData()
      body.append('title', form.title.trim())
      body.append('description', form.description.trim())
      body.append('type', form.type)
      body.append('url', window.location.href)
      body.append('userAgent', navigator.userAgent)
      if (screenshot) body.append('screenshot', screenshot)

      await api.post('/bugs', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSent(true)
      toast.success('Bug signalé — merci pour votre aide !')
      setTimeout(handleClose, 2000)
    } catch {
      toast.error('Impossible d\'envoyer le rapport. Réessayez.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        title="Signaler un bug"
        style={{
          position: 'fixed', bottom: 24, right: 24,
          zIndex: 8000,
          display: 'flex', alignItems: 'center', gap: hovering ? 8 : 0,
          padding: hovering ? '10px 16px' : '10px',
          background: M.night,
          border: 'none', borderRadius: 99,
          cursor: 'pointer', color: '#ffffff',
          boxShadow: '0 4px 16px rgba(13,12,10,0.22)',
          transition: 'all 0.22s ease',
          overflow: 'hidden',
          maxWidth: hovering ? 180 : 40,
          whiteSpace: 'nowrap',
        }}
        aria-label="Signaler un bug"
      >
        <Bug style={{ width: 17, height: 17, flexShrink: 0 }} />
        <span style={{
          fontSize: 13, fontWeight: 500, fontFamily: M.body,
          opacity: hovering ? 1 : 0,
          maxWidth: hovering ? 120 : 0,
          transition: 'all 0.22s ease',
          overflow: 'hidden',
        }}>
          Signaler un bug
        </span>
      </button>

      {/* Overlay modal */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 8100,
            background: 'rgba(13,12,10,0.5)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
            padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div style={{
            width: '100%', maxWidth: 400,
            background: M.surface,
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(13,12,10,0.2)',
            overflow: 'hidden',
            animation: 'slideUp 0.2s ease',
          }}>
            <style>{`
              @keyframes slideUp {
                from { transform: translateY(16px); opacity: 0; }
                to   { transform: translateY(0);    opacity: 1; }
              }
            `}</style>

            {/* Header */}
            <div style={{
              background: M.night, padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bug style={{ width: 16, height: 16, color: M.caramel }} />
                <span style={{ fontSize: 15, fontFamily: M.display, fontWeight: 700, fontStyle: 'italic', color: '#ffffff' }}>
                  Signaler un bug
                </span>
              </div>
              <button
                onClick={handleClose}
                style={{
                  padding: 5, background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 7, cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
                  display: 'flex',
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {sent ? (
              <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <CheckCircle style={{ width: 40, height: 40, color: '#1b5e3b' }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: M.ink, fontFamily: M.body, margin: 0, textAlign: 'center' }}>
                  Rapport envoyé !
                </p>
                <p style={{ fontSize: 13, color: M.inkFaint, fontFamily: M.body, margin: 0, textAlign: 'center' }}>
                  Merci de nous aider à améliorer Bailio.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Type */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: M.inkFaint, fontFamily: M.body, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                    Type de problème
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {BUG_TYPES.map(bt => (
                      <button
                        key={bt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, type: bt.value }))}
                        style={{
                          padding: '5px 10px', borderRadius: 99, fontSize: 12,
                          fontFamily: M.body, cursor: 'pointer', border: '1px solid',
                          borderColor: form.type === bt.value ? M.night : M.border,
                          background: form.type === bt.value ? M.night : M.surface,
                          color: form.type === bt.value ? '#ffffff' : M.inkMid,
                          transition: 'all 0.15s',
                        }}
                      >
                        {bt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: M.inkFaint, fontFamily: M.body, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ex: La page contrats ne charge pas"
                    required
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: `1px solid ${M.border}`, background: M.muted,
                      fontSize: 13, color: M.ink, fontFamily: M.body, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: M.inkFaint, fontFamily: M.body, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                    Description *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Décrivez ce qui s'est passé, les étapes pour reproduire le problème…"
                    required
                    rows={3}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: `1px solid ${M.border}`, background: M.muted,
                      fontSize: 13, color: M.ink, fontFamily: M.body, outline: 'none',
                      resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Screenshot */}
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => setScreenshot(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '7px 12px', borderRadius: 8,
                      border: `1px dashed ${screenshot ? '#1b5e3b' : M.border}`,
                      background: screenshot ? '#edf7f2' : M.surface,
                      color: screenshot ? '#1b5e3b' : M.inkFaint,
                      fontSize: 12, fontFamily: M.body, cursor: 'pointer',
                    }}
                  >
                    <Paperclip style={{ width: 13, height: 13 }} />
                    {screenshot ? screenshot.name : 'Joindre une capture (optionnel)'}
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={sending || !form.title.trim() || !form.description.trim()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '10px 18px', borderRadius: 9, border: 'none',
                    background: !form.title.trim() || !form.description.trim() ? M.border : M.night,
                    color: !form.title.trim() || !form.description.trim() ? M.inkFaint : '#ffffff',
                    fontSize: 13, fontWeight: 600, fontFamily: M.body,
                    cursor: sending || !form.title.trim() || !form.description.trim() ? 'not-allowed' : 'pointer',
                    marginTop: 4,
                  }}
                >
                  {sending ? (
                    <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> Envoi…</>
                  ) : (
                    <><Send style={{ width: 14, height: 14 }} /> Envoyer le rapport</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
