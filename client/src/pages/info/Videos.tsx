import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Monitor, Smartphone } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import Footer from '../../components/layout/Footer'

const VIDEOS = [
  {
    id: 'showcase4k',
    label: 'Showcase 3D + Voix off — 4K',
    format: '4K UHD — 3840×2160',
    duration: '62 secondes',
    size: '22 MB',
    src: '/videos/bailio-showcase-4k.mp4',
    icon: <Monitor size={18} />,
    badge: '4K',
    description: 'Résolution maximale 3840×2160. Téléphone 3D, browser tilt, cartes flottantes, voix off française, light sweep, scanlines. Idéal YouTube 4K.',
  },
  {
    id: 'main4k',
    label: 'Branding cinématique — 4K',
    format: '4K UHD — 3840×2160',
    duration: '62 secondes',
    size: '25 MB',
    src: '/videos/bailio-main-4k.mp4',
    icon: <Monitor size={18} />,
    badge: '4K',
    description: 'Motion design éditorial en 4K UHD — logo SVG, typographie Cormorant, transitions spring, orbes et particules à pleine résolution.',
  },
  {
    id: 'showcase',
    label: 'Showcase 3D + Voix off — 1080p',
    format: '16:9 — 1920×1080',
    duration: '62 secondes',
    size: '10 MB',
    src: '/videos/bailio-showcase.mp4',
    icon: <Monitor size={18} />,
    badge: null,
    description: 'Version 1080p — preview rapide ou export réseaux sociaux standard.',
  },
  {
    id: 'vertical',
    label: 'TikTok / Instagram Reels',
    format: '9:16 — 1080×1920',
    duration: '30 secondes',
    size: '4.5 MB',
    src: '/videos/bailio-vertical.mp4',
    icon: <Smartphone size={18} />,
    badge: null,
    description: 'Format vertical optimisé mobile — "Disponible maintenant", 0 € de frais, lien en bio.',
  },
]

export default function Videos() {
  const [active, setActive] = useState<string>('youtube')
  const current = VIDEOS.find(v => v.id === active)!

  return (
    <Layout>
      <div style={{ minHeight: '100vh', background: BAI.bgBase, fontFamily: BAI.fontBody }}>

        {/* Hero */}
        <section style={{ background: '#0a0d1a', padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,48px) clamp(40px,6vw,60px)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Link
              to="/"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: BAI.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', marginBottom: 32 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              <ArrowLeft size={14} /> Retour à l'accueil
            </Link>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 10px' }}>
              Ressources
            </p>
            <h1 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(32px,6vw,52px)', color: '#ffffff', margin: '8px 0 12px', lineHeight: 1.1 }}>
              Vidéos & tutoriels
            </h1>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 15, color: 'rgba(255,255,255,0.55)', maxWidth: 520, lineHeight: 1.6, margin: 0 }}>
              Motion design professionnel — rendues avec Remotion. Prêtes à publier sur YouTube, LinkedIn, TikTok et Instagram.
            </p>
          </div>
        </section>

        {/* Content */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(16px,5vw,40px) 80px' }}>

          {/* Tab selector */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            {VIDEOS.map(v => (
              <button
                key={v.id}
                onClick={() => setActive(v.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: BAI.radius,
                  border: `1px solid ${active === v.id ? BAI.caramel : BAI.border}`,
                  background: active === v.id ? `${BAI.caramel}12` : BAI.bgSurface,
                  color: active === v.id ? BAI.caramel : BAI.inkMid,
                  fontFamily: BAI.fontBody, fontSize: 14, fontWeight: active === v.id ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {v.icon}
                {v.label}
                {v.badge && (
                  <span style={{ background: BAI.caramel, color: '#fff', fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 6px', letterSpacing: '0.06em' }}>
                    {v.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Video player */}
          <div style={{ background: BAI.night, borderRadius: 16, overflow: 'hidden', marginBottom: 24, position: 'relative' }}>
            <video
              key={current.src}
              controls
              autoPlay={false}
              preload="none"
              playsInline
              style={{
                width: '100%',
                display: 'block',
                maxHeight: 580,
                objectFit: 'contain',
                background: BAI.night,
              }}
            >
              <source src={current.src} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
            {/* Badge résolution */}
            {current.badge && (
              <div style={{
                position: 'absolute', top: 14, right: 14,
                background: BAI.caramel, color: '#fff',
                fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
                borderRadius: 6, padding: '3px 10px', letterSpacing: '0.08em',
              }}>
                {current.badge}
              </div>
            )}
          </div>

          {/* Meta + download */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 20,
            background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
            borderRadius: 12, padding: '20px 24px',
          }}>
            <div>
              <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: BAI.ink, margin: '0 0 6px' }}>
                {current.label}
              </h2>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: '0 0 8px', lineHeight: 1.6 }}>
                {current.description}
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Format', value: current.format },
                  { label: 'Durée', value: current.duration },
                  { label: 'Taille', value: current.size },
                  { label: 'Codec', value: 'H.264 MP4' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>{label}</span>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={current.src}
              download
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: BAI.night, color: '#fff', textDecoration: 'none',
                borderRadius: BAI.radius, padding: '12px 24px',
                fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600,
                flexShrink: 0, transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Download size={16} /> Télécharger MP4
            </a>
          </div>

          {/* Both videos quick access */}
          <div style={{ marginTop: 40 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, marginBottom: 16 }}>Toutes les vidéos</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px,100%), 1fr))', gap: 14 }}>
              {VIDEOS.map(v => (
                <div
                  key={v.id}
                  onClick={() => setActive(v.id)}
                  style={{
                    background: BAI.bgSurface,
                    border: `1px solid ${active === v.id ? BAI.caramel : BAI.border}`,
                    borderRadius: 10, padding: '16px',
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = BAI.caramel)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = active === v.id ? BAI.caramel : BAI.border)}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: `${BAI.caramel}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BAI.caramel, flexShrink: 0 }}>
                    {v.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink, margin: '0 0 2px' }}>{v.label}</p>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: 0 }}>{v.format} · {v.duration} · {v.size}</p>
                  </div>
                  <a
                    href={v.src}
                    download
                    onClick={e => e.stopPropagation()}
                    style={{ marginLeft: 'auto', color: BAI.inkFaint, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.color = BAI.caramel }}
                    onMouseLeave={e => { e.currentTarget.style.color = BAI.inkFaint }}
                  >
                    <Download size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </Layout>
  )
}
