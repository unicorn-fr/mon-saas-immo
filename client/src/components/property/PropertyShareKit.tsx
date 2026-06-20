import { useState, useCallback, useEffect } from 'react'
import { Copy, Check, Share2, ExternalLink, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { propertyService } from '../../services/property.service'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KitResult { leboncoin: string; facebook: string; pap: string; whatsapp: string }
interface SyndicationRecord {
  id: string; platform: string; status: string; externalUrl: string | null
  syncedAt: string | null; lastError: string | null
}

interface Props { propertyId: string; propertyTitle?: string }

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'leboncoin', label: 'LeBonCoin', color: '#e75114' },
  { id: 'facebook',  label: 'Facebook Marketplace', color: '#1877f2' },
  { id: 'pap',       label: 'PAP.fr', color: '#1a3270' },
  { id: 'whatsapp',  label: 'WhatsApp / SMS', color: '#25d366' },
] as const

const SYNDICATION_PLATFORMS = [
  { id: 'leboncoin', label: 'LeBonCoin',          color: '#e75114' },
  { id: 'facebook',  label: 'Facebook Marketplace', color: '#1877f2' },
  { id: 'pap',       label: 'PAP.fr',             color: '#1a3270' },
  { id: 'seloger',   label: 'SeLoger',             color: '#00a4b4' },
] as const

// ─── Token palette ────────────────────────────────────────────────────────────

const T = {
  bg:          '#fafaf8',
  surface:     '#ffffff',
  muted:       '#f4f2ee',
  ink:         '#0d0c0a',
  inkMid:      '#5a5754',
  inkFaint:    '#9e9b96',
  border:      '#e4e1db',
  caramel:     '#c4976a',
  caramelLight:'#fdf5ec',
  night:       '#1a1a2e',
  tenant:      '#1b5e3b',
  tenantLight: '#edf7f2',
  tenantBorder:'#9fd4ba',
  danger:      '#9b1c1c',
  dangerLight: '#fef2f2',
  warning:     '#92400e',
  warningLight:'#fdf5ec',
  body:        "'DM Sans', system-ui, sans-serif",
  display:     "'Cormorant Garamond', Georgia, serif",
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'PUBLISHED': return { background: T.tenantLight, border: `1px solid ${T.tenantBorder}`, color: T.tenant }
    case 'FAILED':    return { background: T.dangerLight,  border: '1px solid #fca5a5', color: T.danger }
    case 'PAUSED':    return { background: T.warningLight, border: '1px solid #f3c99a', color: T.warning }
    default:          return { background: T.muted,        border: `1px solid ${T.border}`, color: T.inkFaint }
  }
}

function statusLabel(status: string) {
  return { PUBLISHED: 'Publié', FAILED: 'Échec', PAUSED: 'En attente', DRAFT: 'Brouillon' }[status] ?? status
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertyShareKit({ propertyId, propertyTitle }: Props) {
  const [activeTab, setActiveTab] = useState<'textes' | 'syndication'>('textes')
  const [kit, setKit] = useState<KitResult | null>(null)
  const [kitLoading, setKitLoading] = useState(false)
  const [syndications, setSyndications] = useState<SyndicationRecord[]>([])
  const [syndicLoading, setSyndicLoading] = useState(false)
  const [syndicatingPlatforms, setSyndicatingPlatforms] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const fetchKit = useCallback(async () => {
    setKitLoading(true)
    try {
      const result = await propertyService.getPropertyKit(propertyId)
      setKit(result)
    } catch {
      toast.error('Impossible de générer les textes')
    } finally {
      setKitLoading(false)
    }
  }, [propertyId])

  const fetchSyndications = useCallback(async () => {
    setSyndicLoading(true)
    try {
      const data = await propertyService.getSyndications(propertyId)
      setSyndications(data)
    } catch {
      // silently fail — empty list
    } finally {
      setSyndicLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    if (activeTab === 'textes' && !kit) fetchKit()
    if (activeTab === 'syndication') fetchSyndications()
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = (platformId: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(platformId)
      toast.success('Texte copié !')
      setTimeout(() => setCopied(null), 2000)
    }).catch(() => toast.error('Impossible de copier'))
  }

  const handleSyndicate = async (platform: string) => {
    setSyndicatingPlatforms(prev => [...prev, platform])
    try {
      await propertyService.syndicateProperty(propertyId, [platform])
      await fetchSyndications()
      toast.success(`Annonce ${statusLabel('DRAFT')} sur ${platform}`)
    } catch {
      toast.error('Erreur lors de la diffusion')
    } finally {
      setSyndicatingPlatforms(prev => prev.filter(p => p !== platform))
    }
  }

  const cardStyle: React.CSSProperties = {
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
    boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
  }

  return (
    <div style={{ fontFamily: T.body }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontFamily: T.body, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 4px' }}>
          Diffusion
        </p>
        <h3 style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 700, fontSize: 24, color: T.ink, margin: '0 0 4px' }}>
          Kit de diffusion{propertyTitle ? ` — ${propertyTitle}` : ''}
        </h3>
        <p style={{ fontFamily: T.body, fontSize: 13, color: T.inkMid, margin: 0 }}>
          Copiez vos textes formatés ou activez la diffusion automatique vers les plateformes.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: T.muted, borderRadius: 10, padding: 4 }}>
        {(['textes', 'syndication'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: T.body, fontSize: 13, fontWeight: 600,
              background: activeTab === tab ? T.surface : 'transparent',
              color: activeTab === tab ? T.ink : T.inkFaint,
              boxShadow: activeTab === tab ? '0 1px 4px rgba(13,12,10,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'textes' ? 'Textes prêts' : 'Syndication'}
          </button>
        ))}
      </div>

      {/* ── Tab: Textes ── */}
      {activeTab === 'textes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!kit && (
            <div style={{ textAlign: 'center', padding: '32px 20px', ...cardStyle }}>
              <Share2 style={{ width: 32, height: 32, color: T.caramel, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: T.inkMid, margin: '0 0 16px' }}>
                Générez automatiquement vos textes d'annonce formatés pour chaque plateforme.
              </p>
              <button
                onClick={fetchKit}
                disabled={kitLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 9, border: 'none',
                  background: T.night, color: '#fff',
                  fontFamily: T.body, fontSize: 14, fontWeight: 600,
                  cursor: kitLoading ? 'wait' : 'pointer', opacity: kitLoading ? 0.7 : 1,
                }}
              >
                {kitLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={15} />}
                {kitLoading ? 'Génération...' : 'Générer les textes'}
              </button>
            </div>
          )}

          {kit && PLATFORMS.map(p => {
            const text = kit[p.id as keyof KitResult]
            const isCopied = copied === p.id
            return (
              <div key={p.id} style={cardStyle}>
                {/* Platform header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: T.body, fontSize: 14, fontWeight: 600, color: T.ink }}>{p.label}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(p.id, text)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 7, border: `1px solid ${T.border}`,
                      background: isCopied ? T.tenantLight : T.surface,
                      color: isCopied ? T.tenant : T.inkMid,
                      fontFamily: T.body, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    {isCopied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
                {/* Text */}
                <textarea
                  readOnly
                  value={text}
                  rows={7}
                  style={{
                    width: '100%', padding: '14px 16px', border: 'none', outline: 'none',
                    background: T.muted, fontFamily: T.body, fontSize: 12, color: T.inkMid,
                    resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.65,
                    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
                  }}
                />
              </div>
            )
          })}

          {kit && (
            <button
              onClick={fetchKit}
              disabled={kitLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.surface, color: T.inkMid,
                fontFamily: T.body, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} />
              Régénérer
            </button>
          )}
        </div>
      )}

      {/* ── Tab: Syndication ── */}
      {activeTab === 'syndication' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Info banner */}
          <div style={{ padding: '12px 14px', borderRadius: 10, background: T.caramelLight, border: `1px solid rgba(196,151,106,0.3)`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertCircle size={14} style={{ color: T.caramel, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontFamily: T.body, fontSize: 12, color: T.warning, margin: 0, lineHeight: 1.6 }}>
              La diffusion automatique est en attente de partenariat API avec les plateformes. En attendant, utilisez l'onglet "Textes prêts" pour publier manuellement.
            </p>
          </div>

          {syndicLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <Loader2 size={22} style={{ color: T.caramel, animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SYNDICATION_PLATFORMS.map(p => {
                const rec = syndications.find(s => s.platform === p.id)
                const isSyndicating = syndicatingPlatforms.includes(p.id)
                return (
                  <div key={p.id} style={{ ...cardStyle, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Color dot */}
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    {/* Platform name */}
                    <span style={{ fontFamily: T.body, fontSize: 14, fontWeight: 600, color: T.ink, flex: 1 }}>{p.label}</span>
                    {/* External link */}
                    {rec?.externalUrl && (
                      <a href={rec.externalUrl} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.caramel, textDecoration: 'none' }}>
                        <ExternalLink size={11} />Voir
                      </a>
                    )}
                    {/* Status badge */}
                    {rec && (
                      <span style={{ fontFamily: T.body, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, ...statusStyle(rec.status) }}>
                        {statusLabel(rec.status)}
                      </span>
                    )}
                    {/* Action button */}
                    <button
                      onClick={() => handleSyndicate(p.id)}
                      disabled={isSyndicating}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                        padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.border}`,
                        background: T.surface, color: T.inkMid,
                        fontFamily: T.body, fontSize: 12, fontWeight: 600, cursor: isSyndicating ? 'wait' : 'pointer',
                        opacity: isSyndicating ? 0.6 : 1,
                      }}
                    >
                      {isSyndicating ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Share2 size={11} />}
                      {rec ? 'Resync' : 'Publier'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
