/**
 * DocumentViewerModal — Visionneuse sécurisée pour le locataire (self-view)
 *
 * Utilisée quand le locataire visualise ses propres documents depuis DossierLocatif.
 * Pas de filigrane propriétaire, mais même protection :
 *  - fetch authentifié via Bearer token
 *  - Ctrl+S / Ctrl+P / clic droit bloqués
 *  - jamais target="_blank"
 *  - animation de révélation fluide
 */
import { useEffect, useState, useRef, useCallback } from 'react'
import { X, FileText, Loader2, AlertCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { apiClient } from '../../services/api.service'
import { BAI } from '../../constants/bailio-tokens'

interface DocumentViewerModalProps {
  fileUrl: string
  fileName: string
  onClose: () => void
}

export function DocumentViewerModal({ fileUrl, fileName, onClose }: DocumentViewerModalProps) {
  const [blobUrl,  setBlobUrl]  = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [zoom, setZoom] = useState(1)
  const imgRef = useRef<HTMLDivElement>(null)

  const isPdf = mimeType.includes('pdf') || /\.pdf$/i.test(fileName)

  // ── Fetch authentifié ────────────────────────────────────────────────────
  useEffect(() => {
    let objectUrl: string | null = null

    const load = async () => {
      try {
        // All paths go through apiClient (Axios) so the token refresh fires automatically.
        // Routing:
        //   /api/v1/…  → strip prefix, call apiClient directly
        //   /api/…     → strip versioned prefix
        //   https://…  → proxy via /documents/proxy so auth header is sent
        //   /uploads/… → proxy via /documents/proxy
        const relativePath = fileUrl.startsWith('/api/v1/')
          ? fileUrl.slice('/api/v1'.length)
          : fileUrl.startsWith('/api/')
            ? fileUrl.replace(/^\/api\/v\d+/, '')
            : `/documents/proxy?path=${encodeURIComponent(fileUrl)}`

        const axiosRes = await apiClient.get<Blob>(relativePath, {
          responseType: 'blob',
          timeout: 30000,
        })
        const blob = axiosRes.data
        const contentType = axiosRes.headers['content-type'] || ''

        setMimeType((blob as Blob).type || contentType)
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
        setTimeout(() => setRevealed(true), 80)
      } catch (e: unknown) {
        let msg = 'Impossible de charger le document'
        if (e instanceof Error) {
          if (e.message.includes('404') || e.message.includes('introuvable')) {
            msg = 'Fichier introuvable — le serveur a peut-être redémarré. Veuillez réuploader ce document.'
          } else if (e.message.includes('403') || e.message.includes('401')) {
            msg = 'Accès refusé — votre session a peut-être expiré. Reconnectez-vous.'
          } else {
            msg = e.message
          }
        }
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [fileUrl])

  // ── Blocage raccourcis ───────────────────────────────────────────────────
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && ['s', 'p', 'u'].includes(e.key.toLowerCase())) e.preventDefault()
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', block, true)
    return () => document.removeEventListener('keydown', block, true)
  }, [onClose])

  // ── Zoom molette ─────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    if (isPdf) return
    e.preventDefault()
    setZoom(z => Math.min(4, Math.max(0.5, z - e.deltaY * 0.001)))
  }, [isPdf])

  useEffect(() => {
    const el = imgRef.current
    if (!el || isPdf) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel, isPdf])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        background: 'rgba(13,12,10,0.58)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        userSelect: 'none',
        animation: 'dvmFadeIn 0.18s ease',
      }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`
        @keyframes dvmFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @media print { .dvm-shell { display: none !important; } }
      `}</style>

      <div
        className="dvm-shell w-full"
        style={{
          maxWidth: 960,
          background: BAI.bgSurface,
          border: `1px solid ${BAI.border}`,
          borderRadius: 14,
          boxShadow: '0 12px 48px rgba(13,12,10,0.26)',
          height: '92dvh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          transform: revealed ? 'scale(1)' : 'scale(0.97)',
          opacity: revealed || loading ? 1 : 0,
          transition: 'transform 0.22s ease, opacity 0.22s ease',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          background: BAI.tenant,
          padding: '11px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText style={{ width: 15, height: 15, color: '#ffffff' }} />
            </div>
            <div>
              <p style={{ color: '#ffffff', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", margin: 0 }}>
                {fileName}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: "'DM Sans',sans-serif", margin: 0 }}>
                Mon dossier · consultation sécurisée
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Zoom controls — images only */}
            {!isPdf && !loading && !error && blobUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[
                  { icon: <ZoomOut style={{ width: 12, height: 12 }} />, action: () => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2))), title: 'Dézoomer' },
                  { icon: <span style={{ fontSize: 11, fontWeight: 600, minWidth: 34, textAlign: 'center' as const }}>{Math.round(zoom * 100)}%</span>, action: undefined, title: undefined },
                  { icon: <ZoomIn style={{ width: 12, height: 12 }} />, action: () => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2))), title: 'Zoomer' },
                  { icon: <Maximize2 style={{ width: 11, height: 11 }} />, action: () => setZoom(1), title: 'Réinitialiser' },
                ].map((ctrl, i) => (
                  ctrl.action ? (
                    <button key={i} onClick={ctrl.action} title={ctrl.title}
                      style={{
                        width: 26, height: 26, borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.25)',
                        background: 'rgba(255,255,255,0.12)',
                        color: '#ffffff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      {ctrl.icon}
                    </button>
                  ) : (
                    <span key={i} style={{ color: 'rgba(255,255,255,0.8)', fontFamily: "'DM Sans',sans-serif" }}>
                      {ctrl.icon}
                    </span>
                  )
                ))}
              </div>
            )}
            <button onClick={onClose}
              style={{
                padding: 7, background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, cursor: 'pointer', color: '#ffffff',
                display: 'flex', alignItems: 'center',
              }}>
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>

        {/* ── Zone de visualisation ───────────────────────────────────────── */}
        <div
          style={{ flex: 1, position: 'relative', overflow: 'hidden', background: BAI.bgMuted }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <Loader2 style={{ width: 28, height: 28, color: BAI.tenant }} className="animate-spin" />
              <p style={{ fontSize: 13, color: BAI.inkFaint, fontFamily: "'DM Sans',sans-serif" }}>
                Chargement…
              </p>
            </div>
          )}

          {error && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32,
            }}>
              <AlertCircle style={{ width: 40, height: 40, color: '#9b1c1c', opacity: 0.5 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, fontFamily: "'DM Sans',sans-serif", textAlign: 'center' }}>
                Document non disponible
              </p>
              <p style={{ fontSize: 12, color: BAI.inkFaint, fontFamily: "'DM Sans',sans-serif", textAlign: 'center', maxWidth: 320 }}>
                {error}
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: `1px solid ${BAI.border}`,
                  background: BAI.bgSurface, color: BAI.inkFaint, fontSize: 13,
                  fontFamily: "'DM Sans',sans-serif", cursor: 'pointer',
                }}
              >
                Fermer
              </button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            isPdf ? (
              <embed
                src={blobUrl}
                type="application/pdf"
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  border: 'none', display: 'block',
                  opacity: revealed ? 1 : 0,
                  transition: 'opacity 0.25s ease',
                }}
              />
            ) : (
              <div
                ref={imgRef}
                style={{
                  position: 'absolute', inset: 0,
                  overflow: 'auto',
                  display: 'flex',
                  alignItems: zoom <= 1 ? 'center' : 'flex-start',
                  justifyContent: zoom <= 1 ? 'center' : 'flex-start',
                  cursor: zoom > 1 ? 'grab' : 'default',
                  padding: zoom > 1 ? 24 : 16,
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <img
                  src={blobUrl}
                  alt={fileName}
                  draggable={false}
                  style={{
                    maxWidth: zoom <= 1 ? '100%' : 'none',
                    maxHeight: zoom <= 1 ? '100%' : 'none',
                    width: zoom > 1 ? `${zoom * 100}%` : undefined,
                    objectFit: 'contain',
                    userSelect: 'none',
                    transform: zoom <= 1 ? `scale(${zoom})` : undefined,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease, opacity 0.25s ease',
                    display: 'block',
                    opacity: revealed ? 1 : 0,
                    borderRadius: 6,
                    boxShadow: '0 2px 12px rgba(13,12,10,0.12)',
                  }}
                />
              </div>
            )
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: '7px 16px',
          background: BAI.tenantLight,
          borderTop: `1px solid ${BAI.tenantBorder}`,
          flexShrink: 0,
        }}>
          <p style={{ fontSize: 10, color: BAI.tenant, fontFamily: "'DM Sans',sans-serif", textAlign: 'center', margin: 0 }}>
            Document confidentiel · Accès sécurisé · Impression et téléchargement désactivés
          </p>
        </div>
      </div>
    </div>
  )
}
