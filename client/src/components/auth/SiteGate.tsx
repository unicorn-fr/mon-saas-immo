/**
 * SiteGate — Verrou complet du site en mode waitlist.
 *
 * Bloque TOUTES les routes sauf "/" jusqu'à la saisie du mot de passe.
 * Le déverrouillage est stocké en sessionStorage (dure jusqu'à fermeture du navigateur).
 *
 * Config Vercel (Environment Variables) :
 *   VITE_SITE_PASSWORD=votre-mot-de-passe-secret
 *
 * Accès rapide via URL (pour bookmarker) :
 *   https://bailio.fr/login?pass=votre-mot-de-passe-secret
 */
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD ?? ''
const SESSION_KEY = 'bailio_site_unlocked'

export function isSiteUnlocked(): boolean {
  if (import.meta.env.VITE_LAUNCH_MODE !== 'waitlist') return true
  return sessionStorage.getItem(SESSION_KEY) === 'true'
}

interface SiteGateProps {
  onUnlock: () => void
}

const GATE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
*, *::before, *::after { box-sizing: border-box; }

@keyframes gateOrbDrift {
  0%,100% { transform:translate(0,0) scale(1); }
  50%      { transform:translate(14px,-10px) scale(1.05); }
}
@keyframes gateFadeIn {
  from { opacity:0; transform:translateY(16px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes gateShake {
  0%,100% { transform:translateX(0); }
  15%     { transform:translateX(-6px); }
  30%     { transform:translateX(6px); }
  45%     { transform:translateX(-4px); }
  60%     { transform:translateX(4px); }
  75%     { transform:translateX(-2px); }
}

.gate-card {
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(44px) saturate(1.7);
  -webkit-backdrop-filter: blur(44px) saturate(1.7);
  border: 1px solid rgba(255,255,255,0.90);
  border-top: 1px solid rgba(255,255,255,1);
  border-radius: 22px;
  box-shadow:
    0 8px 48px rgba(26,50,112,0.10),
    0 2px 16px rgba(26,50,112,0.06),
    0 1px 0 rgba(255,255,255,0.9) inset;
  animation: gateFadeIn .55s cubic-bezier(.22,1,.36,1) both;
}
.gate-card.shake {
  animation: gateShake .45s ease;
}
.gate-input {
  width: 100%;
  background: rgba(26,50,112,0.04);
  border: 1.5px solid rgba(26,50,112,0.14);
  border-radius: 9px;
  outline: none;
  padding: 12px 14px;
  font-size: 15px;
  color: #1a3270;
  font-family: 'DM Sans', system-ui, sans-serif;
  letter-spacing: 0.06em;
  transition: border-color .25s, background .25s;
  -webkit-appearance: none;
}
.gate-input:focus {
  border-color: rgba(196,151,106,0.75);
  background: rgba(196,151,106,0.04);
}
.gate-input.error {
  border-color: rgba(155,28,28,0.55) !important;
  background: rgba(155,28,28,0.04) !important;
  animation: gateShake .45s ease;
}
.gate-btn {
  width: 100%;
  padding: 13px 24px;
  background: #1a3270;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: .01em;
  transition: background .2s, box-shadow .2s, opacity .2s;
  box-shadow: 0 4px 20px rgba(26,50,112,0.26);
}
.gate-btn:hover:not(:disabled) {
  background: #142560;
  box-shadow: 0 6px 28px rgba(26,50,112,0.36);
}
.gate-btn:disabled { opacity: .4; cursor: default; box-shadow: none; }
`

export function SiteGate({ onUnlock }: SiteGateProps) {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [searchParams] = useSearchParams()

  // Auto-unlock via URL ?pass=... (pour bookmarker l'URL d'accès)
  useEffect(() => {
    const passParam = searchParams.get('pass')
    if (SITE_PASSWORD && passParam === SITE_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      onUnlock()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!pwd || loading) return
    setLoading(true)
    setError(false)

    // Délai intentionnel — anti-brute-force + UX
    setTimeout(() => {
      if (SITE_PASSWORD && pwd === SITE_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, 'true')
        onUnlock()
      } else {
        setError(true)
        setLoading(false)
        setPwd('')
        triggerShake()
      }
    }, 480)
  }

  return (
    <>
      <style>{GATE_CSS}</style>

      <div style={{
        minHeight: '100vh',
        background: '#fafaf8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient orbs */}
        <div style={{ position: 'fixed', top: '-12%', left: '-6%', width: 380, height: 380, borderRadius: '50%', background: 'rgba(196,151,106,0.18)', filter: 'blur(80px)', animation: 'gateOrbDrift 9s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(26,50,112,0.11)', filter: 'blur(80px)', animation: 'gateOrbDrift 11s ease-in-out 2s infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', top: '40%', right: '10%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(27,94,59,0.09)', filter: 'blur(70px)', animation: 'gateOrbDrift 13s ease-in-out 1s infinite', pointerEvents: 'none' }} />

        <div className={`gate-card${shake ? ' shake' : ''}`} style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 400,
          padding: 'clamp(32px,6vw,48px) clamp(28px,6vw,44px)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 32, color: '#1a3270', letterSpacing: '-0.01em', lineHeight: 1 }}>
              Bailio<span style={{ color: '#c4976a' }}>.</span>
            </span>
          </div>

          {/* Lock icon + title */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(26,50,112,0.07)', border: '1px solid rgba(26,50,112,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a3270" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>

            <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 24, color: '#1a3270', margin: '0 0 8px', textAlign: 'center', lineHeight: 1.2 }}>
              Accès restreint
            </h1>
            <p style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, color: 'rgba(26,50,112,0.42)', margin: 0, textAlign: 'center', lineHeight: 1.65 }}>
              Zone réservée à l'équipe Bailio.<br />
              Entrez le mot de passe pour continuer.
            </p>
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: 'rgba(26,50,112,0.07)', marginBottom: 24 }} />

          {/* Form */}
          <form onSubmit={submit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 9.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(26,50,112,0.38)', marginBottom: 8 }}>
                Mot de passe
              </label>
              <input
                className={`gate-input${error ? ' error' : ''}`}
                type="password"
                value={pwd}
                onChange={e => { setPwd(e.target.value); setError(false) }}
                placeholder="••••••••••••"
                autoFocus
                autoComplete="current-password"
              />
              {error && (
                <p style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, color: '#9b1c1c', margin: '7px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Mot de passe incorrect. Réessayez.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!pwd || loading}
              className="gate-btn"
            >
              {loading
                ? <span style={{ letterSpacing: '0.35em', fontSize: 18 }}>···</span>
                : 'Accéder au site →'
              }
            </button>
          </form>

          {/* Footer hint */}
          <p style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 11, color: 'rgba(26,50,112,0.20)', textAlign: 'center', marginTop: 22, lineHeight: 1.6 }}>
            Bailio · Plateforme immobilière · Lancement juin 2026
          </p>
        </div>
      </div>
    </>
  )
}
