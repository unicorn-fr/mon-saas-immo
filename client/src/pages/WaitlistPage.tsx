import React, { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const LAUNCH_DATE = new Date('2026-06-04T00:00:00Z')

// ─── Static data ──────────────────────────────────────────────────────────────

const CONF_COLORS = ['#c4976a', '#ffffff', '#eaf0fb', '#9fd4ba', '#e4e1db', '#fdf5ec']
const PARTICLES = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  x: (i / 90) * 100 + Math.sin(i * 1.5) * 4,
  w: i % 3 === 2 ? (5 + (i % 7) * 1.5) * 2.4 : 5 + (i % 7) * 1.5,
  h: i % 3 === 2 ? (5 + (i % 7) * 1.5) * 0.4 : 5 + (i % 7) * 1.5,
  color: CONF_COLORS[i % CONF_COLORS.length],
  round: i % 3 === 1,
  dur: 2200 + (i % 11) * 250,
  delay: (i % 13) * 120,
  drift: Math.sin(i * 0.7) * 80,
}))

// Ambient orbs — calibrated for dark dusk bg
const ORBS = [
  { size: 520, top: '-14%', left: '-8%',  color: 'rgba(196,151,106,0.18)', dur: 14, delay: 0 },
  { size: 380, top: '55%',  left: '-6%',  color: 'rgba(26,50,112,0.28)',   dur: 18, delay: 3 },
  { size: 600, top: '-18%', left: '58%',  color: 'rgba(26,26,46,0.55)',    dur: 12, delay: 1 },
  { size: 260, top: '65%',  left: '75%',  color: 'rgba(196,151,106,0.22)', dur: 16, delay: 4 },
  { size: 440, top: '35%',  left: '35%',  color: 'rgba(27,94,59,0.10)',    dur: 20, delay: 1.5 },
  { size: 200, top: '20%',  left: '80%',  color: 'rgba(196,151,106,0.12)', dur: 22, delay: 2 },
]

type Win = [number, number, boolean, boolean, boolean]

const LEFT_WINS: Win[] = [
  [12, 7,  false, true,  false],
  [42, 7,  true,  false, true ],
  [68, 7,  false, false, false],
  [12, 21, true,  false, false],
  [42, 21, false, true,  false],
  [68, 21, true,  false, false],
  [12, 36, false, false, false],
  [42, 36, true,  false, true ],
  [68, 36, false, true,  false],
  [12, 51, true,  false, false],
  [42, 51, false, false, false],
  [68, 51, true,  false, false],
]

const RIGHT_WINS: Win[] = [
  [12, 9,  true,  false, false],
  [42, 9,  false, true,  false],
  [68, 9,  true,  false, true ],
  [12, 23, false, true,  false],
  [42, 23, true,  false, false],
  [68, 23, false, false, false],
  [12, 38, true,  false, true ],
  [42, 38, false, true,  false],
  [68, 38, true,  false, false],
  [12, 53, false, false, false],
  [42, 53, true,  false, false],
  [68, 53, false, true,  false],
]

const BIRDS: [number, number, number, number, number][] = [
  [7,  5, 24, 0,    0.28],
  [12, 4, 31, -8,   0.22],
  [5,  6, 19, -14,  0.24],
  [10, 3, 38, -22,  0.18],
]

const CLOUDS = [
  { top: 3,  w: 130, h: 48, blur: 12, op: 0.28, dur: 42, delay: 0 },
  { top: 8,  w: 90,  h: 34, blur: 9,  op: 0.22, dur: 56, delay: -16 },
  { top: 1,  w: 180, h: 62, blur: 16, op: 0.18, dur: 68, delay: -30 },
]

const IVY: [number, number, number, number, number, number][] = [
  [5,  20, 10, -20, 3.2, 0],
  [12, 38, 8,  15,  2.8, 0.4],
  [2,  55, 11, -35, 3.6, 0.8],
  [15, 70, 7,  25,  2.5, 0.2],
  [6,  85, 10, -10, 3.0, 0.6],
  [18, 100,8,  40,  2.7, 0.9],
  [3,  118,12, -28, 3.4, 0.3],
  [14, 133,7,  18,  2.9, 0.7],
  [8,  150,9,  -42, 3.1, 0.1],
  [20, 165,6,  30,  2.6, 0.5],
]

const FEATURES = [
  {
    title: 'Dossiers vérifiés par IA',
    desc: 'Analyse automatique des justificatifs en quelques secondes. Score de solvabilité instantané.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(196,151,106,0.9)" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    accent: 'rgba(196,151,106,0.9)',
  },
  {
    title: 'Signature eIDAS',
    desc: 'Bail et état des lieux signés en ligne, valeur juridique garantie par la réglementation européenne.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(180,204,240,0.9)" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
    accent: 'rgba(180,204,240,0.9)',
  },
  {
    title: 'Paiements automatiques',
    desc: 'Loyers encaissés chaque mois, quittances générées et envoyées sans intervention.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(159,212,186,0.9)" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    accent: 'rgba(159,212,186,0.9)',
  },
]

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }

/* ── Glass design tokens ──────────────────────────────────────────────── */
:root {
  --glass-bg:        rgba(255,255,255,0.07);
  --glass-bg-hover:  rgba(255,255,255,0.11);
  --glass-bg-heavy:  rgba(255,255,255,0.12);
  --glass-border:    rgba(255,255,255,0.14);
  --glass-border-top:rgba(255,255,255,0.24);
  --glass-shadow:    0 8px 48px rgba(0,0,0,0.35), 0 2px 16px rgba(0,0,0,0.20);
  --glass-shadow-lg: 0 24px 80px rgba(0,0,0,0.45), 0 8px 32px rgba(0,0,0,0.25);
  --glass-blur:      blur(32px) saturate(180%);
  --glass-blur-sm:   blur(16px) saturate(160%);

  --dusk-bg:   #0d1628;
  --dusk-mid:  #111d35;
  --dusk-warm: #1c1508;
  --caramel:   #c4976a;
  --cream:     rgba(255,252,245,0.94);
  --cream-mid: rgba(255,252,245,0.55);
  --cream-faint:rgba(255,252,245,0.28);
  --owner-glow:rgba(180,204,240,0.85);
  --tenant-glow:rgba(159,212,186,0.85);
}

/* ── Keyframes ────────────────────────────────────────────────────────── */
@keyframes wUp {
  from { opacity:0; transform:translateY(22px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes fIn {
  from { opacity:0; }
  to   { opacity:1; }
}
@keyframes cfFall {
  0%   { opacity:1; transform:translateY(0) rotate(0deg) translateX(0); }
  100% { opacity:0; transform:translateY(110vh) rotate(740deg) translateX(var(--d,0px)); }
}
@keyframes drawCircle {
  from { stroke-dashoffset:283; }
  to   { stroke-dashoffset:0; }
}
@keyframes drawCheck {
  from { stroke-dashoffset:60; }
  to   { stroke-dashoffset:0; }
}
@keyframes popIn {
  0%   { opacity:0; transform:scale(0.82) translateY(10px); }
  65%  { transform:scale(1.04); }
  100% { opacity:1; transform:scale(1) translateY(0); }
}
@keyframes slideUp {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes orbDrift {
  0%,100% { transform:translate(0,0) scale(1); }
  33%     { transform:translate(22px,-18px) scale(1.08); }
  66%     { transform:translate(-16px,20px) scale(0.92); }
}
@keyframes arrowPulse {
  0%,100% { transform:translateX(0); }
  50%     { transform:translateX(6px); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes glassShimmer {
  0%,100% { border-color: rgba(255,255,255,0.14); }
  50%     { border-color: rgba(255,255,255,0.28); }
}
@keyframes floatCard {
  0%,100% { transform:translateY(0px); }
  50%     { transform:translateY(-6px); }
}
@keyframes pulseGlow {
  0%,100% { box-shadow: 0 0 16px rgba(196,151,106,0.25); }
  50%     { box-shadow: 0 0 32px rgba(196,151,106,0.45), 0 0 64px rgba(196,151,106,0.15); }
}

/* ── Ruelle animations ────────────────────────────────────────────────── */
@keyframes lampGlow {
  0%,100% { box-shadow: 0 0 8px 4px rgba(255,210,110,0.55), 0 0 28px 12px rgba(255,200,90,0.22); opacity:.92; }
  50%     { box-shadow: 0 0 16px 8px rgba(255,225,140,0.72), 0 0 52px 22px rgba(255,210,110,0.30); opacity:1; }
}
@keyframes lampFlicker {
  0%,86%,88%,91%,93%,100% { opacity:1; }
  87%  { opacity:0.82; }
  89%  { opacity:1; }
  92%  { opacity:0.88; }
}
@keyframes groundGlow {
  0%,100% { opacity:.32; transform:translateX(-50%) scaleX(1); }
  50%     { opacity:.52; transform:translateX(-50%) scaleX(1.22); }
}
@keyframes winFlicker {
  0%,100% { opacity:.80; }
  25%     { opacity:.95; }
  60%     { opacity:.68; }
  80%     { opacity:.88; }
}
@keyframes curtainSway {
  0%,100% { transform:skewX(0deg) scaleX(1); }
  50%     { transform:skewX(1.6deg) scaleX(1.04); }
}
@keyframes smokeRise {
  0%   { transform:translateY(0) scale(1);   opacity:.45; }
  50%  { transform:translateY(-18px) scale(1.6); opacity:.25; }
  100% { transform:translateY(-36px) scale(2.4); opacity:0; }
}
@keyframes birdFly {
  from { transform:translateX(-120px); }
  to   { transform:translateX(calc(100vw + 120px)); }
}
@keyframes cloudDrift {
  from { transform:translateX(-320px); }
  to   { transform:translateX(calc(100vw + 320px)); }
}
@keyframes ivySway {
  0%,100% { transform:rotate(var(--r,0deg)) scale(1); }
  50%     { transform:rotate(calc(var(--r,0deg) + 6deg)) scale(1.05); }
}

/* ── Scroll reveal ────────────────────────────────────────────────────── */
.bail-reveal {
  opacity:0; transform:translateY(32px);
  transition:opacity .75s ease, transform .75s ease;
}
.bail-reveal.vis { opacity:1; transform:translateY(0); }
.bail-d1 { transition-delay:.08s!important; }
.bail-d2 { transition-delay:.20s!important; }
.bail-d3 { transition-delay:.34s!important; }
.bail-d4 { transition-delay:.50s!important; }

/* ── Glass card — core ────────────────────────────────────────────────── */
.glass-card {
  background: var(--glass-bg-heavy);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-top-color: var(--glass-border-top);
  border-radius: 24px;
  box-shadow: var(--glass-shadow);
  animation: glassShimmer 8s ease-in-out infinite;
}

/* ── Glass mini cards ─────────────────────────────────────────────────── */
.glass-mini {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  border: 1px solid var(--glass-border);
  border-top-color: rgba(255,255,255,0.18);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.10);
  transition: background .25s, transform .25s, box-shadow .25s;
}
.glass-mini:hover {
  background: var(--glass-bg-hover);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.15);
}

/* ── Underline inputs (dark glass) ───────────────────────────────────── */
.bail-inp {
  background: transparent;
  border: none;
  border-bottom: 1.5px solid rgba(255,255,255,0.18);
  outline: none;
  width: 100%;
  padding: 10px 0 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  color: rgba(255,252,245,0.92);
  transition: border-color .3s;
  -webkit-appearance: none;
}
.bail-inp::placeholder { color: rgba(255,252,245,0.22); }
.bail-inp:focus { border-bottom-color: rgba(196,151,106,0.75); }
.bail-grp { position: relative; margin-bottom: 22px; }
.bail-lbl {
  display: block;
  font-family: 'DM Sans', sans-serif;
  font-size: 9.5px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(255,252,245,0.30); margin-bottom: 2px;
}
.bail-bar {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 1.5px; background: #c4976a;
  transform: scaleX(0); transform-origin: left;
  transition: transform .35s ease;
}
.bail-grp:focus-within .bail-bar { transform: scaleX(1); }

/* ── CTA button — caramel shimmer ────────────────────────────────────── */
.bail-cta {
  width: 100%; padding: 15px 24px;
  background: linear-gradient(90deg, #b8865c 0%, #c4976a 35%, #dab07a 50%, #c4976a 65%, #b8865c 100%);
  background-size: 200% auto;
  color: #fff;
  border: none; border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 600;
  cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  gap: 10px; letter-spacing: .02em;
  transition: background-position .6s ease, box-shadow .25s, opacity .25s;
  box-shadow: 0 4px 24px rgba(196,151,106,0.32), 0 1px 0 rgba(255,255,255,0.10) inset;
  animation: pulseGlow 3.5s ease-in-out infinite;
}
.bail-cta:hover:not(:disabled) {
  background-position: right center;
  box-shadow: 0 8px 36px rgba(196,151,106,0.45), 0 1px 0 rgba(255,255,255,0.12) inset;
}
.bail-cta:disabled { opacity: .32; cursor: default; box-shadow: none; animation: none; }
.bail-cta:not(:disabled) { animation: shimmer 2.8s linear infinite, pulseGlow 3.5s ease-in-out infinite; }

/* ── Social cards ─────────────────────────────────────────────────────── */
.soc-card {
  display: flex; align-items: center; gap: 14px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  border: 1px solid var(--glass-border);
  border-top-color: rgba(255,255,255,0.18);
  border-radius: 14px; padding: 16px 20px;
  text-decoration: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.20);
  transition: transform .22s ease, box-shadow .22s ease, background .22s ease;
  min-width: 180px; flex: 1 1 180px;
}
.soc-card:hover {
  transform: translateY(-4px);
  background: var(--glass-bg-hover);
  box-shadow: 0 12px 40px rgba(0,0,0,0.30);
}

/* ── Birds & clouds ──────────────────────────────────────────────────── */
.ruelle-bird, .ruelle-cloud { display: none; }
@media (min-width: 640px) {
  .ruelle-bird  { display: block; }
  .ruelle-cloud { display: block; }
}

/* ── Separator line ──────────────────────────────────────────────────── */
.glass-sep {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
}

/* ── Number unit ─────────────────────────────────────────────────────── */
.cd-unit {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  padding: 8px 12px;
  text-align: center;
  min-width: 52px;
}
`

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useCountdown(target: Date) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    function calc() {
      const diff = Math.max(0, target.getTime() - Date.now())
      setT({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) })
    }
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id)
  }, [target])
  return t
}

// ─── Components ───────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {PARTICLES.map(p => (
        <div key={p.id} style={{ position: 'absolute', top: -20, left: `${p.x}%`, width: p.w, height: p.h, background: p.color, borderRadius: p.round ? '50%' : '1px', animation: `cfFall ${p.dur}ms ease-in ${p.delay}ms forwards`, '--d': `${p.drift}px` } as React.CSSProperties} />
      ))}
    </div>
  )
}

function BailioWordmark({ fontSize = 22, light = false }: { fontSize?: number; light?: boolean }) {
  return (
    <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize, color: light ? 'rgba(255,252,245,0.92)' : '#1a3270', letterSpacing: '-0.01em', lineHeight: 1 }}>
      Bailio<span style={{ color: '#c4976a' }}>.</span>
    </span>
  )
}

function CDUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="cd-unit">
      <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(18px,3vw,26px)', color: 'rgba(255,252,245,0.95)', lineHeight: 1 }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 8, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(255,252,245,0.30)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function SuccessBlock({ isEarlyAccess, alreadyRegistered, firstName }: { isEarlyAccess: boolean; alreadyRegistered: boolean; firstName: string }) {
  return (
    <div style={{ animation: 'slideUp .5s ease forwards' }}>
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ marginBottom: 16 }}>
        <circle cx="26" cy="26" r="24" stroke="#9fd4ba" strokeWidth="2.5" strokeDasharray="283" strokeDashoffset="283"
          style={{ animation: 'drawCircle .8s ease .1s forwards' }} />
        <polyline points="14,27 21,34 38,18" stroke="#9fd4ba" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset="60"
          style={{ animation: 'drawCheck .45s ease .9s forwards' }} />
      </svg>
      <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3.5vw,34px)', color: 'rgba(255,252,245,0.95)', margin: '0 0 10px', lineHeight: 1.2 }}>
        {alreadyRegistered ? 'Déjà inscrit !' : firstName ? `Bienvenue, ${firstName} !` : 'Vous êtes sur la liste !'}
      </h2>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: 'rgba(255,252,245,0.45)', lineHeight: 1.75, margin: '0 0 18px' }}>
        {alreadyRegistered ? 'Cette adresse est déjà enregistrée. Vous serez parmi les premiers prévenus.' : "Inscription confirmée. Un email de bienvenue vient d'être envoyé."}
      </p>
      {isEarlyAccess && !alreadyRegistered && (
        <div style={{ animation: 'popIn .5s cubic-bezier(.34,1.56,.64,1) 1.4s both', background: 'rgba(196,151,106,0.12)', border: '1px solid rgba(196,151,106,0.30)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c4976a', flexShrink: 0, marginTop: 3, boxShadow: '0 0 10px rgba(196,151,106,.6)' }} />
          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#c4976a', marginBottom: 4 }}>Early Access · 150 premiers</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(255,252,245,0.55)', lineHeight: 1.55 }}>
              <strong style={{ color: 'rgba(255,252,245,0.88)' }}>1 mois offert</strong> sur le plan Pro au lancement. Aucune action requise.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Ruelle Montpellier — dusk version ───────────────────────────────────────
function RuelleMontpellier() {
  const bW = 'clamp(80px,25vw,320px)'

  function WindowEl({ xf, yf, lit, shut, flicker, delay }: { xf: number; yf: number; lit: boolean; shut: boolean; flicker: boolean; delay: number }) {
    return (
      <div style={{
        position: 'absolute', left: `${xf}%`, top: `${yf}%`,
        width: '17%', height: 0, paddingBottom: '25%',
        border: '1.5px solid rgba(90,65,30,0.45)',
        background: lit ? 'rgba(252,222,138,0.88)' : 'rgba(60,45,25,0.35)',
        overflow: 'hidden',
        animation: flicker ? `winFlicker ${3 + delay * 0.6}s ease-in-out ${delay * 0.8}s infinite` : 'none',
      }}>
        {shut && <>
          <div style={{ position: 'absolute', inset: 0, left: 0, width: '50%', background: 'rgba(28,55,36,0.95)', borderRight: '0.5px solid rgba(18,42,28,0.5)' }}>
            {[20,42,64,82].map(p => <div key={p} style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, height: 1, background: 'rgba(18,42,28,0.35)' }} />)}
          </div>
          <div style={{ position: 'absolute', inset: 0, right: 0, left: '50%', background: 'rgba(28,55,36,0.95)' }}>
            {[20,42,64,82].map(p => <div key={p} style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, height: 1, background: 'rgba(18,42,28,0.35)' }} />)}
          </div>
        </>}
        {!shut && <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: '52%', height: 1, background: 'rgba(90,65,30,0.25)' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(90,65,30,0.25)' }} />
          {lit && <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '20%', background: 'rgba(255,238,190,0.45)', animation: `curtainSway ${5 + delay}s ease-in-out ${delay * 0.5}s infinite` }} />}
        </>}
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>

      {/* Dusk sky — deep violet amber gradient */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '65%', background: 'linear-gradient(180deg, rgba(18,8,32,0.60) 0%, rgba(62,28,8,0.28) 45%, transparent 100%)' }} />

      {/* Drifting clouds — lighter against dark sky */}
      {CLOUDS.map((c, i) => (
        <div key={i} className="ruelle-cloud" style={{
          position: 'absolute', top: `${c.top}%`, left: -c.w - 20,
          width: c.w, height: c.h,
          borderRadius: '50%',
          background: `rgba(200,185,165,${c.op})`,
          filter: `blur(${c.blur}px)`,
          animation: `cloudDrift ${c.dur}s linear ${c.delay}s infinite`,
          zIndex: 0,
        }} />
      ))}

      {/* Birds */}
      {BIRDS.map(([top, sz, dur, delay, op], i) => (
        <div key={i} className="ruelle-bird" style={{
          position: 'absolute', top: `${top}%`, left: -120,
          animation: `birdFly ${dur}s linear ${delay}s infinite`,
          zIndex: 5,
        }}>
          <div style={{ position: 'absolute', left: 0, width: sz * 2.2, height: sz * 0.9, borderTop: `${Math.max(1, sz * 0.35)}px solid rgba(200,185,165,${op})`, borderRadius: '50% 0 0 0' }} />
          <div style={{ position: 'absolute', left: sz * 2.2, width: sz * 2.2, height: sz * 0.9, borderTop: `${Math.max(1, sz * 0.35)}px solid rgba(200,185,165,${op})`, borderRadius: '0 50% 0 0' }} />
        </div>
      ))}

      {/* ══════════ LEFT BUILDING ══════════ */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: bW,
        background: 'linear-gradient(108deg, #4a3c28 0%, #5c4e34 50%, #6e6048 100%)',
        opacity: 0.90,
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(180deg,transparent 0,transparent 28px,rgba(20,14,4,0.38) 28px,rgba(20,14,4,0.38) 29.5px),repeating-linear-gradient(90deg,transparent 0,transparent 38px,rgba(20,14,4,0.22) 38px,rgba(20,14,4,0.22) 39.5px)` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.25) 0%, transparent 55%)' }} />
        {LEFT_WINS.map(([xf, yf, lit, shut, flicker], idx) => (
          <WindowEl key={idx} xf={xf} yf={yf} lit={lit} shut={shut} flicker={flicker} delay={idx * 0.7} />
        ))}
        <div style={{ position: 'absolute', left: '8%', right: '10%', top: '28%', height: 20, borderTop: '2.5px solid rgba(0,0,0,0.7)', borderLeft: '2px solid rgba(0,0,0,0.55)', borderRight: '2px solid rgba(0,0,0,0.55)' }}>
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(i + 0.5) * (100 / 11)}%`, width: 1.5, background: 'rgba(0,0,0,0.48)' }}>
              <div style={{ position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'rgba(0,0,0,0.52)' }} />
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: '30%', right: '8%', top: '43%', height: 16, borderTop: '2px solid rgba(0,0,0,0.58)', borderLeft: '1.5px solid rgba(0,0,0,0.46)', borderRight: '1.5px solid rgba(0,0,0,0.46)' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(i + 0.5) * 12.5}%`, width: 1.5, background: 'rgba(0,0,0,0.38)' }} />
          ))}
        </div>
        {[[20, 22], [55, 16], [72, 20]].map(([x, h], i) => (
          <div key={i} style={{ position: 'absolute', top: -h, left: `${x}%`, width: 10, height: h, background: 'rgba(30,20,8,0.80)', border: '1px solid rgba(0,0,0,0.4)', borderBottom: 'none' }}>
            <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, borderRadius: '50%', background: 'rgba(160,145,120,0.55)', animation: `smokeRise ${3.2 + i * 0.8}s ease-out ${i * 1.1}s infinite` }} />
            <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, borderRadius: '50%', background: 'rgba(160,145,120,0.35)', animation: `smokeRise ${3.2 + i * 0.8}s ease-out ${i * 1.1 + 1.6}s infinite` }} />
          </div>
        ))}
        <div style={{ position: 'absolute', top: 0, left: '-2%', right: '-2%', height: 10, background: 'rgba(20,12,4,0.75)', borderBottom: '2px solid rgba(0,0,0,0.45)' }} />
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.25)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '20%', width: '25%', height: '10%', background: 'rgba(0,0,0,0.55)', borderRadius: '50% 50% 0 0 / 80% 80% 0 0', border: '1.5px solid rgba(0,0,0,0.4)', borderBottom: 'none' }}>
          <div style={{ position: 'absolute', inset: '5px 6px 0', background: 'rgba(0,0,0,0.75)', borderRadius: '50% 50% 0 0 / 80% 80% 0 0' }} />
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '18%', background: 'linear-gradient(90deg,transparent,rgba(13,22,40,0.65))' }} />
      </div>

      {/* ══════════ RIGHT BUILDING ══════════ */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: bW,
        background: 'linear-gradient(252deg, #3e3020 0%, #504030 50%, #625248 100%)',
        opacity: 0.88,
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(180deg,transparent 0,transparent 30px,rgba(0,0,0,0.35) 30px,rgba(0,0,0,0.35) 31.5px),repeating-linear-gradient(90deg,transparent 0,transparent 42px,rgba(0,0,0,0.20) 42px,rgba(0,0,0,0.20) 43.5px)` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(225deg, rgba(0,0,0,0.20) 0%, transparent 55%)' }} />
        {RIGHT_WINS.map(([xf, yf, lit, shut, flicker], idx) => (
          <WindowEl key={idx} xf={xf} yf={yf} lit={lit} shut={shut} flicker={flicker} delay={idx * 0.5 + 1.2} />
        ))}
        <div style={{ position: 'absolute', left: '10%', right: '8%', top: '32%', height: 20, borderTop: '2.5px solid rgba(0,0,0,0.68)', borderLeft: '2px solid rgba(0,0,0,0.55)', borderRight: '2px solid rgba(0,0,0,0.55)' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(i + 0.5) * 10}%`, width: 1.5, background: 'rgba(0,0,0,0.45)' }}>
              <div style={{ position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'rgba(0,0,0,0.52)' }} />
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: '8%', right: '28%', top: '46%', height: 16, borderTop: '2px solid rgba(0,0,0,0.60)', borderLeft: '1.5px solid rgba(0,0,0,0.46)', borderRight: '1.5px solid rgba(0,0,0,0.46)' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(i + 0.5) * (100 / 7)}%`, width: 1.5, background: 'rgba(0,0,0,0.38)' }} />
          ))}
        </div>
        <div style={{ position: 'absolute', top: '18%', left: 0, width: '24%', zIndex: 2 }}>
          {IVY.map(([xf, yPx, sz, rot, , swayDly], i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${xf}%`, top: yPx,
              width: sz, height: sz,
              background: i % 3 === 0 ? 'rgba(30,65,36,0.75)' : i % 3 === 1 ? 'rgba(42,80,46,0.70)' : 'rgba(22,52,28,0.68)',
              borderRadius: '50% 0 50% 0',
              '--r': `${rot}deg`,
              transform: `rotate(${rot}deg)`,
              animation: `ivySway ${3.2 + swayDly}s ease-in-out ${swayDly}s infinite`,
            } as React.CSSProperties} />
          ))}
          <div style={{ position: 'absolute', left: '10%', top: 0, bottom: 0, width: 1.5, background: 'rgba(28,58,32,0.45)', borderRadius: 2 }} />
        </div>
        {[[30, 18], [60, 24], [80, 15]].map(([x, h], i) => (
          <div key={i} style={{ position: 'absolute', top: -h, left: `${x}%`, width: 9, height: h, background: 'rgba(28,18,6,0.78)', border: '1px solid rgba(0,0,0,0.38)', borderBottom: 'none' }}>
            <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, borderRadius: '50%', background: 'rgba(160,145,120,0.50)', animation: `smokeRise ${3.5 + i * 0.7}s ease-out ${i * 0.9 + 0.5}s infinite` }} />
            <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, borderRadius: '50%', background: 'rgba(160,145,120,0.32)', animation: `smokeRise ${3.5 + i * 0.7}s ease-out ${i * 0.9 + 2.2}s infinite` }} />
          </div>
        ))}
        <div style={{ position: 'absolute', top: 0, left: '-2%', right: '-2%', height: 10, background: 'rgba(18,10,4,0.78)', borderBottom: '2px solid rgba(0,0,0,0.42)' }} />
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.22)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '30%', height: '11%', border: '2px solid rgba(0,0,0,0.52)', borderBottom: 'none', borderRadius: '50% 50% 0 0 / 80% 80% 0 0' }}>
          <div style={{ position: 'absolute', inset: '5px 8px 0', background: 'rgba(0,0,0,0.72)', borderRadius: '50% 50% 0 0 / 80% 80% 0 0' }} />
          <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', width: 15, height: 10, background: 'rgba(120,100,65,0.85)', border: '1px solid rgba(0,0,0,0.42)' }} />
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '18%', background: 'linear-gradient(270deg,transparent,rgba(13,22,40,0.60))' }} />
      </div>

      {/* ══════════ COBBLESTONE ══════════ */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '16%', background: '#3a2e1c', backgroundImage: `repeating-linear-gradient(180deg,transparent 0,transparent 13px,rgba(0,0,0,0.45) 13px,rgba(0,0,0,0.45) 14.5px),repeating-linear-gradient(90deg,transparent 0,transparent 21px,rgba(0,0,0,0.30) 21px,rgba(0,0,0,0.30) 22.5px)`, opacity: 0.80 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(196,151,106,0.18) 0%,transparent 52%)' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '20%', background: 'rgba(0,0,0,0.20)', borderLeft: '1px solid rgba(0,0,0,0.25)', borderRight: '1px solid rgba(0,0,0,0.25)' }} />
        {[15, 35, 62, 78].map((x, i) => (
          <div key={i} style={{ position: 'absolute', left: `${x}%`, top: '28%', width: 28, height: 12, background: 'rgba(80,65,42,0.45)', borderRadius: 2, border: '0.5px solid rgba(0,0,0,0.25)' }} />
        ))}
      </div>

      {/* ══════════ STREET LAMP ══════════ */}
      <div style={{ position: 'absolute', bottom: '16%', left: bW, transform: 'translateX(clamp(6px,1.5vw,18px))', zIndex: 3 }}>
        <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', width: 22, height: 16, background: 'linear-gradient(180deg,rgba(20,12,4,0.85),rgba(12,8,2,0.80))', borderRadius: '3px 3px 0 0', boxShadow: '0 3px 8px rgba(0,0,0,0.40)' }} />
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', width: 5, height: 158, background: 'linear-gradient(90deg,rgba(20,12,4,0.60) 0%,rgba(40,28,8,0.88) 28%,rgba(48,32,10,0.85) 50%,rgba(32,20,5,0.75) 75%,rgba(18,10,2,0.58) 100%)', borderRadius: '3px 3px 0 0', boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.08)' }}>
          {[28, 68, 118].map((y, i) => (
            <div key={i} style={{ position: 'absolute', top: y, left: -3, width: 11, height: 5, background: 'rgba(20,12,4,0.90)', borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.40)' }} />
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 148, left: 'calc(50% - 1px)', width: 52, height: 32, borderTop: '4.5px solid rgba(24,14,4,0.85)', borderRight: '4.5px solid rgba(24,14,4,0.85)', borderRadius: '0 22px 0 0' }} />
        <div style={{ position: 'absolute', bottom: 176, left: 'calc(50% + 46px)', width: 8, height: 8, borderRadius: '50%', border: '3px solid rgba(24,14,4,0.80)', background: 'transparent' }} />
        <div style={{ position: 'absolute', bottom: 172, left: 'calc(50% + 38px)' }}>
          <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 2, height: 6, background: 'rgba(20,12,4,0.70)' }} />
          <div style={{ width: 28, height: 9, background: 'linear-gradient(180deg,rgba(18,10,4,0.92),rgba(28,18,6,0.85))', borderRadius: '5px 5px 0 0', margin: '0 auto', boxShadow: '0 -2px 5px rgba(0,0,0,0.30)' }} />
          <div style={{ width: 24, height: 38, margin: '0 auto', position: 'relative', background: 'rgba(255,222,130,0.20)', border: '1.5px solid rgba(18,10,4,0.80)', overflow: 'hidden', boxShadow: `inset 0 0 16px 5px rgba(255,210,100,0.72), 0 0 28px 12px rgba(255,200,90,0.48), 0 0 70px 28px rgba(255,195,80,0.25)`, animation: 'lampFlicker 7s ease-in-out infinite' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33%', width: 1, background: 'rgba(18,10,4,0.40)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66%', width: 1, background: 'rgba(18,10,4,0.40)' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '42%', height: 1, background: 'rgba(18,10,4,0.32)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,245,200,0.22) 0%,transparent 60%)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'rgba(255,252,210,0.99)', boxShadow: '0 0 8px 4px rgba(255,230,140,0.80)', animation: 'lampGlow 2.8s ease-in-out infinite' }} />
            </div>
          </div>
          <div style={{ width: 24, height: 6, margin: '0 auto', background: 'rgba(18,10,4,0.85)', borderRadius: '0 0 3px 3px' }} />
          <div style={{ width: 0, height: 0, margin: '0 auto', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '10px solid rgba(18,10,4,0.78)' }} />
          <div style={{ position: 'absolute', top: '100%', marginTop: 12, left: '50%', transform: 'translateX(-50%)', width: 120, height: 30, background: 'radial-gradient(ellipse at 50% 0%, rgba(255,215,110,0.42) 0%, transparent 68%)', animation: 'groundGlow 3s ease-in-out infinite' }} />
        </div>
      </div>

      {/* Far arch */}
      <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 'clamp(38px,6.5vw,78px)', zIndex: 2 }}>
        <div style={{ position: 'relative', paddingBottom: '140%', border: '2px solid rgba(80,65,40,0.55)', borderBottom: 'none', borderRadius: '50% 50% 0 0 / 55% 55% 0 0', background: 'rgba(40,28,12,0.65)' }}>
          <div style={{ position: 'absolute', inset: '6px 7px 0', background: 'rgba(25,18,6,0.78)', borderRadius: '50% 50% 0 0 / 55% 55% 0 0' }} />
          <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', width: 16, height: 12, background: 'rgba(80,65,40,0.82)', border: '1.5px solid rgba(80,65,40,0.50)' }} />
        </div>
        <div style={{ height: '14%', minHeight: 6, border: '2px solid rgba(80,65,40,0.45)', borderTop: 'none', background: 'rgba(32,22,8,0.60)' }} />
      </div>

      {/* Bottom fade — matches dark bg */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%', background: 'linear-gradient(to top, #0d1628 0%, transparent 100%)', zIndex: 4 }} />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WaitlistPage() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [userType, setUserType] = useState<'owner' | 'tenant' | ''>('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isEarlyAccess, setIsEarlyAccess] = useState(false)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const cd = useCountdown(LAUNCH_DATE)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/waitlist/count`).then(r => r.json()).then(d => { if (d.success) setTotalCount(d.data.total) }).catch(() => {})
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target) } }), { threshold: 0.12 })
    document.querySelectorAll('.bail-reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!emailValid || loading) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/waitlist/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim().toLowerCase(), firstName: firstName.trim() || undefined, userType: userType || undefined }) })
      const d = await res.json()
      if (d.success) {
        setIsEarlyAccess(d.data.isEarlyAccess); setAlreadyRegistered(d.data.alreadyRegistered); setSuccess(true)
        if (!d.data.alreadyRegistered) { setTotalCount(c => c + 1); setConfetti(true); setTimeout(() => setConfetti(false), 4500) }
      }
    } catch { /* silent */ } finally { setLoading(false) }
  }

  // Dusk background gradient
  const duskBg = 'linear-gradient(160deg, #0a1020 0%, #0d1628 25%, #1a1010 55%, #1a1a2e 100%)'
  const sectionDark  = 'rgba(0,0,0,0.25)'
  const sectionLight = 'rgba(255,255,255,0.03)'

  return (
    <>
      <style>{CSS}</style>
      <Confetti active={confetti} />

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,5vw,48px)',
        background: scrolled ? 'rgba(10,16,32,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        transition: 'background .4s, border-color .4s',
      }}>
        <BailioWordmark fontSize={20} light />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#9fd4ba', boxShadow: '0 0 6px rgba(159,212,186,.7)' }} />
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,252,245,0.38)' }}>Liste d'attente ouverte</span>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100svh', background: duskBg, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(72px,10vw,100px) clamp(16px,4vw,40px) 56px' }}>

        {/* Ambient orbs */}
        {ORBS.map((o, i) => (
          <div key={i} style={{ position: 'absolute', top: o.top, left: o.left, width: o.size, height: o.size, borderRadius: '50%', background: o.color, filter: 'blur(90px)', animation: `orbDrift ${o.dur}s ease-in-out ${o.delay}s infinite`, pointerEvents: 'none', zIndex: 0 }} />
        ))}

        <RuelleMontpellier />

        {/* Ghost watermark */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 2, overflow: 'hidden' }}>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(130px,20vw,280px)', color: 'transparent', WebkitTextStroke: '1px rgba(255,252,245,0.025)', lineHeight: 1, userSelect: 'none', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Bailio.</span>
        </div>

        {/* ── Glass form card ── */}
        <div className="glass-card" style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: 500,
          padding: 'clamp(28px,5vw,48px) clamp(24px,5vw,44px)',
          animation: 'fIn .9s ease .1s both, floatCard 8s ease-in-out 2s infinite',
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <BailioWordmark fontSize={26} light />
            {/* Social proof badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(159,212,186,0.10)', border: '1px solid rgba(159,212,186,0.22)', borderRadius: 20, padding: '5px 12px' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#9fd4ba', boxShadow: '0 0 5px rgba(159,212,186,.8)' }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(159,212,186,0.85)' }}>
                {totalCount > 0 ? `${totalCount.toLocaleString('fr-FR')} inscrits` : 'Liste d'attente'}
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(30px,4.5vw,46px)', lineHeight: 1.08, margin: '0 0 4px' }}>
            {['La', 'location'].map((w, i) => (
              <span key={i} style={{ display: 'inline-block', marginRight: '0.22em', opacity: 0, color: 'rgba(255,252,245,0.96)', animation: `wUp .55s cubic-bezier(.22,1,.36,1) ${0.35 + i * 0.12}s forwards` }}>{w}</span>
            ))}
            <br />
            {['sans', 'agence.'].map((w, i) => (
              <span key={i} style={{ display: 'inline-block', marginRight: '0.22em', color: '#c4976a', opacity: 0, animation: `wUp .55s cubic-bezier(.22,1,.36,1) ${0.60 + i * 0.12}s forwards` }}>{w}</span>
            ))}
          </h1>

          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: 'rgba(255,252,245,0.40)', lineHeight: 1.72, margin: '12px 0 0', opacity: 0, animation: 'fIn .7s ease 1.0s forwards' }}>
            Dossiers IA · Bail eIDAS · Paiements automatiques. La première plateforme de location 100% sans agence.
          </p>

          {/* Countdown */}
          <div style={{ display: 'flex', gap: 'clamp(8px,2vw,14px)', padding: '18px 0', marginTop: 18, opacity: 0, animation: 'fIn .7s ease 1.2s forwards', alignItems: 'center' }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,252,245,0.22)', flexShrink: 0 }}>Lancement</div>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <CDUnit value={cd.days} label="Jours" />
            <CDUnit value={cd.hours} label="Heures" />
            <CDUnit value={cd.minutes} label="Min" />
            <CDUnit value={cd.seconds} label="Sec" />
          </div>

          <div className="glass-sep" style={{ margin: '4px 0 20px' }} />

          {/* Form or success */}
          <div style={{ opacity: 0, animation: 'fIn .7s ease 1.4s forwards' }}>
            {!success ? (
              <form onSubmit={submit}>
                <div className="bail-grp">
                  <label className="bail-lbl">Prénom (optionnel)</label>
                  <input className="bail-inp" type="text" placeholder="Thomas" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
                  <div className="bail-bar" />
                </div>
                <div className="bail-grp">
                  <label className="bail-lbl">Adresse email</label>
                  <input className="bail-inp" type="email" placeholder="thomas@exemple.fr" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                  <div className="bail-bar" />
                </div>

                {/* User type toggle */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
                  {[{ val: 'owner', label: 'Propriétaire' }, { val: 'tenant', label: 'Locataire' }].map(({ val, label }) => (
                    <button key={val} type="button"
                      onClick={() => setUserType(userType === val as any ? '' : val as any)}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8,
                        fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', transition: 'all .2s',
                        background: userType === val ? (val === 'owner' ? 'rgba(180,204,240,0.15)' : 'rgba(159,212,186,0.15)') : 'transparent',
                        border: `1px solid ${userType === val ? (val === 'owner' ? 'rgba(180,204,240,0.40)' : 'rgba(159,212,186,0.40)') : 'rgba(255,255,255,0.12)'}`,
                        color: userType === val ? (val === 'owner' ? 'rgba(180,204,240,0.92)' : 'rgba(159,212,186,0.92)') : 'rgba(255,252,245,0.38)',
                      }}
                    >{label}</button>
                  ))}
                </div>

                <button type="submit" disabled={loading || !emailValid} className="bail-cta" style={{ opacity: !emailValid && !loading ? 0.45 : 1 }}>
                  {loading
                    ? <span style={{ letterSpacing: '0.4em', fontSize: 18 }}>···</span>
                    : <><span>Rejoindre la liste</span> <span style={{ display: 'inline-block', animation: emailValid ? 'arrowPulse 1.4s ease-in-out infinite' : 'none' }}>→</span></>
                  }
                </button>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10.5, color: 'rgba(255,252,245,0.20)', margin: '10px 0 0', textAlign: 'center' }}>
                  Gratuit · Aucune carte · Désabonnement en un clic
                </p>
              </form>
            ) : (
              <SuccessBlock isEarlyAccess={isEarlyAccess} alreadyRegistered={alreadyRegistered} firstName={firstName} />
            )}
          </div>

          {/* Trust micro-stats */}
          <div className="glass-sep" style={{ margin: '20px 0 16px' }} />
          <div style={{ display: 'flex' }}>
            {[{ val: '0 €', label: 'Commission' }, { val: '< 2 min', label: 'Dossier' }, { val: 'eIDAS', label: '100% légal' }].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 15, color: '#c4976a', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, color: 'rgba(255,252,245,0.28)', marginTop: 3, letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(to top, #0d1628 0%, transparent 100%)', pointerEvents: 'none', zIndex: 5 }} />
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: duskBg, backgroundImage: `linear-gradient(${sectionLight}, ${sectionLight})`, padding: 'clamp(56px,9vw,104px) clamp(16px,5vw,64px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="bail-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(40px,6vw,68px)' }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(196,151,106,0.55)', margin: '0 0 14px' }}>Comment ça marche</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4.5vw,48px)', color: 'rgba(255,252,245,0.92)', margin: 0 }}>Simple. Rapide. Légal.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'clamp(32px,5vw,52px)' }}>
            {[
              { n: '1', title: 'Publiez votre bien', desc: 'Annonce professionnelle en 5 minutes. Photos, description, loyer — depuis votre téléphone.' },
              { n: '2', title: 'Sélectionnez', desc: 'Dossiers vérifiés par IA, scoring automatique, bail eIDAS en ligne. Zéro paperasse.' },
              { n: '3', title: 'Gérez sereinement', desc: "Loyers encaissés, quittances générées, messagerie archivée. Bailio s'occupe du reste." },
            ].map((step, i) => (
              <div key={i} className={`bail-reveal bail-d${i + 1}`} style={{ position: 'relative' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(80px,12vw,116px)', color: 'rgba(196,151,106,0.06)', lineHeight: 1, position: 'absolute', top: -18, left: -6, zIndex: 0, userSelect: 'none' }}>{step.n}</div>
                <div style={{ position: 'relative', zIndex: 1, paddingTop: 40 }}>
                  <div style={{ width: 24, height: 2, background: '#c4976a', marginBottom: 14, opacity: 0.7 }} />
                  <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, fontSize: 21, color: 'rgba(255,252,245,0.90)', margin: '0 0 9px', lineHeight: 1.3 }}>{step.title}</h3>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: 'rgba(255,252,245,0.38)', lineHeight: 1.72, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES — glass grid ── */}
      <section style={{ background: duskBg, backgroundImage: `linear-gradient(${sectionDark}, ${sectionDark})`, padding: 'clamp(44px,7vw,68px) clamp(16px,5vw,64px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="bail-reveal" style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(196,151,106,0.55)', margin: '0 0 12px' }}>Fonctionnalités</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px,4vw,40px)', color: 'rgba(255,252,245,0.90)', margin: 0 }}>Tout ce dont vous avez besoin.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className={`glass-mini bail-reveal bail-d${i % 3 + 1}`} style={{ padding: '24px 22px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{f.icon}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, fontSize: 18, color: 'rgba(255,252,245,0.90)', marginBottom: 8, lineHeight: 1.3 }}>{f.title}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(255,252,245,0.38)', lineHeight: 1.65 }}>{f.desc}</div>
                <div style={{ marginTop: 16, height: 1, background: `linear-gradient(90deg, ${f.accent.replace('0.9', '0.25')}, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUDIENCE CARDS ── */}
      <section style={{ background: duskBg, backgroundImage: `linear-gradient(${sectionLight}, ${sectionLight})`, padding: 'clamp(48px,8vw,80px) clamp(16px,5vw,64px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 }}>

          {/* Owner card */}
          <div className="bail-reveal glass-mini" style={{ padding: 'clamp(28px,4vw,40px)', position: 'relative', overflow: 'hidden', borderColor: 'rgba(180,204,240,0.18)' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(26,50,112,0.22)', filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(180,204,240,0.70)', marginBottom: 6 }}>Propriétaires</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 24, color: 'rgba(255,252,245,0.92)', marginBottom: 24, lineHeight: 1.2 }}>Vous gérez votre bien</div>
            {['Publiez sans agence ni commission', 'Dossiers locataires vérifiés par IA', 'Bail signé électroniquement (eIDAS)', 'Loyers encaissés automatiquement', 'Interface mobile, zéro paperasse'].map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(180,204,240,0.70)', flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(255,252,245,0.48)' }}>{it}</span>
              </div>
            ))}
          </div>

          {/* Tenant card */}
          <div className="bail-reveal bail-d1 glass-mini" style={{ padding: 'clamp(28px,4vw,40px)', position: 'relative', overflow: 'hidden', borderColor: 'rgba(159,212,186,0.18)' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(27,94,59,0.18)', filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(159,212,186,0.70)', marginBottom: 6 }}>Locataires</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 24, color: 'rgba(255,252,245,0.92)', marginBottom: 24, lineHeight: 1.2 }}>Vous cherchez un logement</div>
            {['Dossier constitué en moins de 2 min', 'Zéro commission à votre charge', 'Justificatifs vérifiés, signature sécurisée', 'Quittances automatiques chaque mois', 'Messagerie directe avec le propriétaire'].map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(159,212,186,0.70)', flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(255,252,245,0.48)' }}>{it}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LA PROMESSE ── */}
      <section style={{ background: duskBg, backgroundImage: `linear-gradient(${sectionDark}, ${sectionDark})`, padding: 'clamp(48px,8vw,80px) clamp(16px,5vw,64px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="bail-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,56px)' }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(196,151,106,0.55)', margin: '0 0 14px' }}>La promesse Bailio</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px,4vw,44px)', color: 'rgba(255,252,245,0.92)', margin: 0 }}>La location telle qu'elle devrait être.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 2 }}>
            {[
              { n: '01', title: 'Zéro intermédiaire', body: 'Pas d\'agence, pas de frais cachés. Propriétaire et locataire se trouvent directement, en toute transparence.' },
              { n: '02', title: 'Tout est légal', body: 'Chaque étape — dossier, bail, paiement — respecte le cadre juridique français et européen. Aucun risque.', accent: true },
              { n: '03', title: 'Depuis votre téléphone', body: "Publiez, sélectionnez, signez et encaissez sans jamais ouvrir un ordinateur. Bailio est mobile-first." },
            ].map((item, i) => (
              <div key={i} className={`bail-reveal bail-d${i + 1}`} style={{
                background: item.accent ? 'rgba(196,151,106,0.08)' : 'rgba(255,255,255,0.03)',
                border: '1px solid',
                borderColor: item.accent ? 'rgba(196,151,106,0.20)' : 'rgba(255,255,255,0.07)',
                padding: 'clamp(24px,4vw,36px)',
              }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(196,151,106,0.55)', marginBottom: 18 }}>{item.n}</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(20px,2.5vw,26px)', color: 'rgba(255,252,245,0.90)', margin: '0 0 12px', lineHeight: 1.2 }}>{item.title}</h3>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: 'rgba(255,252,245,0.38)', lineHeight: 1.72, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL ── */}
      <section style={{ background: duskBg, backgroundImage: `linear-gradient(${sectionLight}, ${sectionLight})`, padding: 'clamp(40px,6vw,64px) clamp(16px,5vw,64px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div className="bail-reveal">
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(196,151,106,0.55)', margin: '0 0 10px' }}>Suivez l'aventure</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3.5vw,36px)', color: 'rgba(255,252,245,0.90)', margin: '0 0 32px' }}>Restez au courant du lancement.</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {[
                { href: 'https://instagram.com/bailio.fr', handle: '@bailio.fr', desc: 'Coulisses du lancement', color: '#e1306c', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0"/></svg> },
                { href: 'https://facebook.com/bailio.immobilier', handle: 'Bailio Immobilier', desc: 'Actualités & nouveautés', color: '#1877f2', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.428c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg> },
                { href: 'https://twitter.com/bailiofr', handle: '@bailiofr', desc: 'Actualités produit', color: 'rgba(255,252,245,0.75)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                { href: 'https://linkedin.com/company/bailio', handle: 'Bailio', desc: 'Vision & immobilier', color: '#0a66c2', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className={`soc-card bail-reveal bail-d${(i % 4) + 1}`}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, color: 'rgba(255,252,245,0.85)', lineHeight: 1.2 }}>{s.handle}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11.5, color: 'rgba(255,252,245,0.30)', marginTop: 2 }}>{s.desc}</div>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="2" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#080e1c', borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(20px,4vw,32px) clamp(16px,5vw,48px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <BailioWordmark fontSize={18} light />
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(255,252,245,0.18)', margin: 0 }}>© 2026 Bailio. Tous droits réservés.</p>
        </div>
      </footer>
    </>
  )
}
