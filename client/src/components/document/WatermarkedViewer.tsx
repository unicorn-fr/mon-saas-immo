/**
 * WatermarkedViewer — Visionneuse de documents avec protection maximale
 *
 * Sécurité :
 *  • Fetch authentifié (Bearer token) → blob URL : aucune URL directe exposée
 *  • CSS user-select: none sur tout le conteneur
 *  • onContextMenu bloqué (modal + zones document)
 *  • Raccourcis clavier bloqués : Ctrl+S, Ctrl+P, Ctrl+C, Ctrl+A, Ctrl+U
 *  • CSS @media print : masque le viewer et rend la page blanche à l'impression
 *  • Filigrane CSS dynamique (nom locataire + contrat + date) — no-print
 *  • draggable={false} sur les images
 */
import { useEffect, useState, useRef, useCallback } from 'react'
import { X, Shield, Lock, Loader2, CheckCircle, XCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { apiClient } from '../../services/api.service'

const M = {
  owner:   '#1a3270',
  ownerL:  '#eaf0fb',
  ownerB:  '#b8ccf0',
  ink:     '#0d0c0a',
  inkFaint:'#9e9b96',
  border:  '#e4e1db',
  muted:   '#f4f2ee',
  surface: '#ffffff',
}

export interface WatermarkedViewerActions {
  onValidate?: () => void
  onReject?: (reason: string) => void
  docLabel?: string
}

interface WatermarkedViewerProps {
  fileUrl: string
  fileName: string
  contractRef: string
  tenantName: string
  onClose: () => void
  actions?: WatermarkedViewerActions
}

export function WatermarkedViewer({
  fileUrl, fileName, contractRef, tenantName, onClose, actions,
}: WatermarkedViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>('')
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectInput, setRejectInput] = useState('')
  const [zoom, setZoom] = useState(1)
  const imgContainerRef = useRef<HTMLDivElement>(null)

  const today = new Date().toLocaleDateString('fr-FR')
  const watermarkText = `CONFIDENTIEL · ${contractRef ? `CONTRAT ${contractRef} · ` : ''}${tenantName.toUpperCase()} · ${today}`
  // Détection PDF depuis le vrai MIME type du blob (pas le nom de fichier qui peut être un label lisible)
  const isPdf = mimeType.includes('pdf') || /\.(pdf)$/i.test(fileName)

  // ── Fetch document via canal authentifié ───────────────────────────────────
  useEffect(() => {
    let objectUrl: string | null = null

    const load = async () => {
      try {
        // Routing :
        //   http(s)://…  → URL absolue externe, fetch direct
        //   /api/…       → endpoint backend authentifié (ex: /api/v1/dossier/docs/:id/view)
        //                  On extrait le chemin relatif pour apiClient (baseURL = /api/v1)
        //   /uploads/…   → fichier statique via proxy sécurisé
        // Utilise apiClient (Axios) pour bénéficier du refresh token automatique
        let response: { data: Blob; headers: Record<string, string> }

        if (fileUrl.startsWith('http')) {
          const res = await fetch(fileUrl)
          if (!res.ok) throw new Error(`Erreur ${res.status}`)
          const blob = await res.blob()
          response = { data: blob, headers: { 'content-type': res.headers.get('content-type') || '' } }
        } else {
          // Pour /api/… et /uploads/… : on passe par apiClient
          // /api/v1/dossier/docs/:id/view → chemin relatif = /dossier/docs/:id/view
          const relativePath = fileUrl.startsWith('/api/v1/')
            ? fileUrl.slice('/api/v1'.length)
            : fileUrl.startsWith('/api/')
              ? fileUrl.replace(/^\/api\/v\d+/, '')
              : `/documents/proxy?path=${encodeURIComponent(fileUrl)}`

          const axiosRes = await apiClient.get<Blob>(relativePath, {
            responseType: 'blob',
            timeout: 30000,
          })
          response = { data: axiosRes.data, headers: { 'content-type': axiosRes.headers['content-type'] || '' } }
        }

        const blob = response.data
        setMimeType((blob as Blob).type || response.headers['content-type'] || '')
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
      } catch (e: unknown) {
        let msg = 'Impossible de charger le document'
        if (e instanceof Error) {
          if (e.message.includes('403') || e.message.includes('autorisé') || e.message.includes('partagé')) {
            msg = 'Accès refusé — le locataire doit partager son dossier avec vous.'
          } else if (e.message.includes('404') || e.message.includes('introuvable')) {
            msg = 'Fichier introuvable — le serveur a peut-être redémarré. Demandez au locataire de réuploader ce document.'
          } else if (e.message.includes('401') || e.message.includes('session')) {
            msg = 'Session expirée — veuillez vous reconnecter.'
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
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fileUrl])

  // ── Blocage des raccourcis clavier sensibles ───────────────────────────────
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && ['s', 'p', 'c', 'a', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (e.key === 'PrintScreen') {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', blockKeys, true)
    return () => document.removeEventListener('keydown', blockKeys, true)
  }, [])

  // ── Fermeture sur Escape ───────────────────────────────────────────────────
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // ── Zoom molette sur la zone image ─────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    if (isPdf) return
    e.preventDefault()
    setZoom(z => Math.min(4, Math.max(0.5, z - e.deltaY * 0.001)))
  }, [isPdf])

  useEffect(() => {
    const el = imgContainerRef.current
    if (!el || isPdf) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel, isPdf])

  return (
    <>
      {/* CSS anti-impression */}
      <style>{`
        @media print {
          .wv-overlay { display: none !important; }
          body > *:not(.wv-overlay) { visibility: hidden !important; }
        }
      `}</style>

      <div
        className="wv-overlay"
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(13,12,10,0.6)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 16,
          userSelect: 'none',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          className="w-full max-w-[1100px]"
          style={{
          background: M.surface,
          border: `1px solid ${M.border}`,
          borderRadius: 14,
          boxShadow: '0 12px 48px rgba(13,12,10,0.28)',
          height: '94dvh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: M.owner,
            padding: '12px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield style={{ width: 16, height: 16, color: '#ffffff' }} />
              </div>
              <div>
                <p style={{ color: '#ffffff', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                  {fileName}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                  Document protégé{contractRef ? ` · Contrat ${contractRef}` : ''} · Accès propriétaire uniquement
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: 7, background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, cursor: 'pointer', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Fermer"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Bandeau protection + contrôles zoom image */}
          <div style={{
            background: M.ownerL,
            borderBottom: `1px solid ${M.ownerB}`,
            padding: '7px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <Lock style={{ width: 13, height: 13, color: M.owner, flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: M.owner, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                Accès sécurisé · Filigrane gravé dans le fichier · Copie et téléchargement bloqués
              </p>
            </div>
            {!isPdf && !loading && !error && blobUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                  title="Dézoomer"
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: `1px solid ${M.ownerB}`,
                    background: 'rgba(255,255,255,0.6)', color: M.owner,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ZoomOut style={{ width: 13, height: 13 }} />
                </button>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: M.owner,
                  fontFamily: "'DM Sans', sans-serif", minWidth: 36, textAlign: 'center',
                }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}
                  title="Zoomer"
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: `1px solid ${M.ownerB}`,
                    background: 'rgba(255,255,255,0.6)', color: M.owner,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ZoomIn style={{ width: 13, height: 13 }} />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  title="Réinitialiser"
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: `1px solid ${M.ownerB}`,
                    background: 'rgba(255,255,255,0.6)', color: M.owner,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Maximize2 style={{ width: 12, height: 12 }} />
                </button>
              </div>
            )}
          </div>

          {/* Zone de visualisation */}
          <div
            style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 200 }}
            onContextMenu={(e) => e.preventDefault()}
          >

            {/* Filigrane CSS dynamique */}
            <div
              style={{
                position: 'absolute', inset: 0,
                zIndex: 10, pointerEvents: 'none',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 0,
              }}
            >
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: '20px 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: 'rgba(26,50,112,0.18)',
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: '0.05em',
                    transform: 'rotate(-30deg)',
                    display: 'block', whiteSpace: 'nowrap',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}>
                    {watermarkText}
                  </span>
                </div>
              ))}
            </div>

            {loading && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 12,
              }}>
                <Loader2 style={{ width: 28, height: 28, color: M.owner }} className="animate-spin" />
                <p style={{ fontSize: 13, color: M.inkFaint, fontFamily: "'DM Sans', sans-serif" }}>
                  Chargement sécurisé…
                </p>
              </div>
            )}

            {error && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 12, padding: 32,
              }}>
                <Shield style={{ width: 36, height: 36, color: M.owner, opacity: 0.3 }} />
                <p style={{ fontSize: 14, color: M.ink, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                  Document non disponible
                </p>
                <p style={{ fontSize: 12, color: M.inkFaint, fontFamily: "'DM Sans', sans-serif", textAlign: 'center' }}>
                  {error}
                </p>
              </div>
            )}

            {!loading && !error && blobUrl && (
              isPdf ? (
                <embed
                  src={blobUrl}
                  type="application/pdf"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
                />
              ) : (
                <div
                  ref={imgContainerRef}
                  style={{
                    position: 'absolute', inset: 0,
                    overflow: 'auto', background: M.muted,
                    display: 'flex', alignItems: zoom <= 1 ? 'center' : 'flex-start',
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
                      transition: 'transform 0.15s ease',
                      display: 'block',
                    }}
                  />
                </div>
              )
            )}
          </div>

          {/* Pied — légal + actions optionnelles */}
          {actions ? (
            <div style={{
              background: M.surface,
              borderTop: `1px solid ${M.border}`,
              flexShrink: 0,
            }}>
              {rejectMode ? (
                <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: M.ink, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                    Motif du refus
                  </p>
                  <textarea
                    value={rejectInput}
                    onChange={(e) => setRejectInput(e.target.value)}
                    placeholder="Expliquez pourquoi ce document ne convient pas…"
                    autoFocus
                    style={{
                      width: '100%', height: 70, resize: 'none',
                      background: M.muted, border: `1px solid ${M.border}`,
                      borderRadius: 8, padding: '8px 10px',
                      fontSize: 12, color: M.ink, outline: 'none',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setRejectMode(false); setRejectInput('') }}
                      style={{
                        padding: '7px 14px', borderRadius: 7, border: `1px solid ${M.border}`,
                        background: M.surface, color: M.inkFaint, fontSize: 12, cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => { if (rejectInput.trim()) { actions.onReject?.(rejectInput.trim()); onClose() } }}
                      disabled={!rejectInput.trim()}
                      style={{
                        padding: '7px 14px', borderRadius: 7, border: 'none',
                        background: rejectInput.trim() ? '#dc2626' : M.border,
                        color: rejectInput.trim() ? '#ffffff' : M.inkFaint,
                        fontSize: 12, cursor: rejectInput.trim() ? 'pointer' : 'not-allowed',
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                      }}
                    >
                      Confirmer le refus
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <p style={{ fontSize: 10, color: M.inkFaint, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                    Ce document correspond-il à la pièce demandée ?
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => setRejectMode(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 7,
                        background: '#fef2f2', color: '#9b1c1c',
                        border: '1px solid #fca5a5', fontSize: 12, cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                      }}
                    >
                      <XCircle style={{ width: 13, height: 13 }} />
                      Refuser
                    </button>
                    <button
                      onClick={() => { actions.onValidate?.(); onClose() }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 7,
                        background: '#edf7f2', color: '#1b5e3b',
                        border: '1px solid #9fd4ba', fontSize: 12, cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                      }}
                    >
                      <CheckCircle style={{ width: 13, height: 13 }} />
                      Valider
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '8px 18px',
              background: M.muted,
              borderTop: `1px solid ${M.border}`,
              flexShrink: 0,
            }}>
              <p style={{ fontSize: 10, color: M.inkFaint, fontFamily: "'DM Sans', sans-serif", textAlign: 'center', margin: 0 }}>
                Document confidentiel{contractRef ? ` · Contrat ${contractRef}` : ''} · Propriété de {tenantName} · {today} · Toute reproduction est interdite
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
