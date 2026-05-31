/**
 * Pixel-accurate Bailio UI mockups rendered inside Remotion.
 * These replicate the real site's look for use in video demos.
 */
import { B } from './tokens'

/* ─── Browser chrome wrapper ────────────────────────────────────────────── */
export function BrowserFrame({
  children, width = 1200, height = 720, url = 'bailio.fr',
}: {
  children: React.ReactNode; width?: number; height?: number; url?: string
}) {
  return (
    <div style={{
      width, height,
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 40px 120px rgba(0,0,0,0.55), 0 8px 32px rgba(0,0,0,0.30)',
      background: '#1e1e1e',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Chrome bar */}
      <div style={{ height: 44, background: '#2a2a2a', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', flexShrink: 0 }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57','#febc2e','#28c840'].map((c,i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
          ))}
        </div>
        {/* URL bar */}
        <div style={{
          flex: 1, maxWidth: 460, height: 28, margin: '0 auto',
          background: '#3a3a3a', borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontSize: 13, color: '#aaa', fontFamily: B.body, letterSpacing: '0.01em' }}>
            bailio.fr
          </span>
        </div>
      </div>
      {/* Page content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  )
}

/* ─── Phone frame ───────────────────────────────────────────────────────── */
export function PhoneFrame({
  children, width = 375, height = 812,
}: {
  children: React.ReactNode; width?: number; height?: number
}) {
  return (
    <div style={{
      width: width + 24, height: height + 56,
      borderRadius: 52,
      background: '#141414',
      boxShadow: '0 50px 140px rgba(0,0,0,0.60), inset 0 0 0 2px #333, 0 0 0 3px #1a1a1a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      padding: '12px 12px 16px',
      position: 'relative',
    }}>
      {/* Notch */}
      <div style={{ width: 120, height: 30, background: '#141414', borderRadius: '0 0 20px 20px', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2a2a2a' }} />
        <div style={{ width: 60, height: 6, borderRadius: 4, background: '#2a2a2a' }} />
      </div>
      {/* Screen */}
      <div style={{ width, height, borderRadius: 44, overflow: 'hidden', marginTop: 20 }}>
        {children}
      </div>
    </div>
  )
}

/* ─── Bailio Home page mockup ───────────────────────────────────────────── */
export function BailioHomeMockup({ scale = 1 }: { scale?: number }) {
  return (
    <div style={{ width: 1280, height: 800, background: B.night, transform: `scale(${scale})`, transformOrigin: 'top left', overflow: 'hidden' }}>
      {/* Nav bar */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 24, color: '#fff' }}>bailio<span style={{ color: B.caramel }}>.</span></span>
        <div style={{ display: 'flex', gap: 28, background: 'rgba(255,255,255,0.07)', borderRadius: 50, padding: '6px 16px', border: '1px solid rgba(255,255,255,0.12)' }}>
          {['Location','Propriétaires','Estimer','Guide'].map(l => (
            <span key={l} style={{ fontFamily: B.body, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{l}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ padding: '8px 18px', borderRadius: 40, background: B.night, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)', fontFamily: B.body, fontSize: 13 }}>Se connecter</div>
          <div style={{ padding: '8px 18px', borderRadius: 40, background: B.caramel, color: '#fff', fontFamily: B.body, fontSize: 13, fontWeight: 600 }}>Déposer une annonce</div>
        </div>
      </div>
      {/* Hero */}
      <div style={{ padding: '52px 80px 40px', position: 'relative' }}>
        <div style={{ position: 'absolute', right: -40, top: -60, width: 500, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,151,106,0.25) 0%, transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <p style={{ fontFamily: B.body, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: B.caramel, marginBottom: 10 }}>Nouvelle façon de louer</p>
        <h1 style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 52, color: '#fff', margin: '0 0 10px', lineHeight: 1.1 }}>Trouvez votre prochain logement.</h1>
        <p style={{ fontFamily: B.body, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '0 0 28px' }}>Annonces entre particuliers · 0 € de frais d'agence</p>
        {/* Search bar */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '8px 8px 8px 16px', alignItems: 'center', maxWidth: 640 }}>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>🔍</span>
          <span style={{ flex: 1, fontFamily: B.body, fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Ville, code postal...</span>
          <div style={{ padding: '9px 18px', background: B.caramel, borderRadius: 10, fontFamily: B.body, fontSize: 13, fontWeight: 600, color: '#fff' }}>Rechercher</div>
        </div>
      </div>
      {/* Property cards */}
      <div style={{ display: 'flex', gap: 20, padding: '0 80px' }}>
        {[
          { price: '1 200 €', rooms: '3 pièces · 65 m²', city: 'Paris 11e', img: '#2a3a5a' },
          { price: '850 €', rooms: '2 pièces · 42 m²', city: 'Lyon 3e', img: '#2a4a3a' },
          { price: '1 650 €', rooms: '4 pièces · 90 m²', city: 'Bordeaux', img: '#4a3a2a' },
        ].map((card, i) => (
          <div key={i} style={{ flex: 1, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
            <div style={{ height: 140, background: card.img, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.9)', borderRadius: 6, padding: '3px 8px', fontFamily: B.body, fontSize: 11, fontWeight: 600, color: B.night }}>Particulier</div>
            </div>
            <div style={{ padding: 14 }}>
              <p style={{ fontFamily: B.body, fontSize: 18, fontWeight: 700, color: B.night, margin: '0 0 4px' }}>{card.price}<span style={{ fontSize: 12, fontWeight: 400, color: '#888' }}>/mois CC</span></p>
              <p style={{ fontFamily: B.body, fontSize: 12, color: '#666', margin: '0 0 4px' }}>{card.rooms}</p>
              <p style={{ fontFamily: B.body, fontSize: 12, color: '#999', margin: 0 }}>📍 {card.city}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Bailio Dashboard mockup ───────────────────────────────────────────── */
export function BailioDashboardMockup({ scale = 1 }: { scale?: number }) {
  return (
    <div style={{ width: 1280, height: 800, background: B.bgMuted, transform: `scale(${scale})`, transformOrigin: 'top left', display: 'flex', overflow: 'hidden', fontFamily: B.body }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: B.night, display: 'flex', flexDirection: 'column', padding: '24px 0', gap: 2 }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
          <span style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: B.caramel }}>bailio</span>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Espace propriétaire</p>
        </div>
        {[
          { label: 'Mes annonces', active: true },
          { label: 'Candidatures', badge: 3 },
          { label: 'Visites', },
          { label: 'Messages', badge: 1 },
          { label: 'Contrats & Baux' },
          { label: 'Quittances' },
        ].map(({ label, active, badge }) => (
          <div key={label} style={{ padding: '9px 13px', margin: '1px 8px', borderRadius: 8, background: active ? 'rgba(196,151,106,0.15)' : 'transparent', borderLeft: active ? `3px solid ${B.caramel}` : '3px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: active ? '#fff' : 'rgba(255,255,255,0.60)', fontWeight: active ? 600 : 400 }}>{label}</span>
            {badge && <span style={{ background: B.caramel, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>{badge}</span>}
          </div>
        ))}
      </div>
      {/* Main content */}
      <div style={{ flex: 1, padding: '32px 36px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: B.caramel, margin: '0 0 4px' }}>Tableau de bord</p>
            <h2 style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: B.night, margin: 0 }}>Mes annonces</h2>
          </div>
          <div style={{ padding: '10px 20px', background: B.night, borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600 }}>+ Nouvelle annonce</div>
        </div>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Biens actifs', val: '2', color: '#1b5e3b', bg: '#edf7f2' },
            { label: 'Candidatures', val: '8', color: '#1a3270', bg: '#eaf0fb' },
            { label: 'Visites planif.', val: '3', color: B.caramel, bg: '#fdf5ec' },
          ].map(({ label, val, color, bg }) => (
            <div key={label} style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '16px 20px', border: '1px solid #e4e1db' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#9e9b96', margin: '0 0 8px' }}>{label}</p>
              <p style={{ fontSize: 32, fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, color, margin: 0 }}>{val}</p>
            </div>
          ))}
        </div>
        {/* Property cards */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { title: '3P — Paris 11e', price: '1 200 €/mois', status: 'Loué', statusColor: '#1b5e3b', statusBg: '#edf7f2' },
            { title: '2P — Lyon 3e', price: '850 €/mois', status: 'Disponible', statusColor: B.caramel, statusBg: '#fdf5ec' },
          ].map(({ title, price, status, statusColor, statusBg }) => (
            <div key={title} style={{ flex: 1, background: '#fff', borderRadius: 10, border: '1px solid #e4e1db', overflow: 'hidden' }}>
              <div style={{ height: 100, background: '#e4e1db' }} />
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ fontFamily: B.display, fontStyle: 'italic', fontSize: 17, fontWeight: 700, color: B.night, margin: '0 0 4px' }}>{title}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusBg, padding: '2px 8px', borderRadius: 4 }}>{status}</span>
                </div>
                <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
