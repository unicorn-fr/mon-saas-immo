import { useEffect, useState } from 'react'
import { BAI } from '../constants/bailio-tokens'

/**
 * « Immeuble vivant » (accueil) : un petit immeuble dessiné dont chaque fenêtre s'allume quand Bailio règle une tâche
 * de son logement, avec la notification de ce qui vient de se passer. Exemple fictif, affiché comme tel.
 * Une notification toutes les 2,6 s ; si l'appareil demande moins d'animations, tout est allumé et les trois dernières
 * notifications restent affichées, sans mouvement. Décor : aria-hidden, sauf la liste des notifications (role="log").
 */
const EVENTS: Array<{ w: number; title: string; detail: string }> = [
  { w: 4, title: 'Loyer reçu', detail: 'Appartement 2B · quittance envoyée' },
  { w: 0, title: 'Bail prêt à signer', detail: 'Appartement 4A · vérifié avant envoi' },
  { w: 7, title: 'Relance partie', detail: 'Appartement 1C · 3 jours de retard' },
  { w: 2, title: 'Assurance reçue', detail: 'Appartement 3A · valable jusqu’en 2027' },
  { w: 5, title: 'Loyer révisé', detail: 'Appartement 3C · IRL du 2e trimestre' },
  { w: 1, title: 'Candidat solide', detail: 'Appartement 4B · dossier complet' },
  { w: 8, title: 'État des lieux signé', detail: 'Appartement 1A · 42 photos' },
  { w: 3, title: 'Loyer reçu', detail: 'Appartement 2A · quittance envoyée' },
  { w: 6, title: 'Chaudière entretenue', detail: 'Appartement 2C · attestation rangée' },
]

const COLS = [62, 122, 182]
const ROWS = [78, 152, 226]

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function LivingBuilding() {
  const [step, setStep] = useState(() => (reduced() ? EVENTS.length : 1))

  useEffect(() => {
    if (reduced()) return
    const id = window.setInterval(() => setStep((s) => (s >= EVENTS.length + 2 ? 1 : s + 1)), 2600)
    return () => window.clearInterval(id)
  }, [])

  const shown = Math.min(step, EVENTS.length)
  const lit = new Set(EVENTS.slice(0, shown).map((e) => e.w))
  const recent = EVENTS.slice(Math.max(0, shown - 3), shown).reverse()

  return (
    <div className="living">
      <svg className="living-svg" viewBox="0 0 244 330" aria-hidden focusable="false">
        {/* Soleil derrière l'immeuble, sol, immeuble aux angles doux et toit en pente */}
        <circle cx="206" cy="58" r="30" fill={BAI.accentLight} />
        <rect x="0" y="312" width="244" height="18" rx="9" fill={BAI.sky} />
        <path d="M30 70 L122 22 L214 70 Z" fill={BAI.owner} strokeLinejoin="round" stroke={BAI.owner} strokeWidth="10" />
        <rect x="26" y="56" width="192" height="260" rx="16" fill={BAI.night} />
        {ROWS.map((y, r) =>
          COLS.map((x, c) => {
            const i = r * 3 + c
            const on = lit.has(i)
            return (
              <g key={i}>
                <rect x={x - 22} y={y - 2} width="44" height="52" rx="22" fill={on ? BAI.cta : BAI.nightActive} style={{ transition: 'fill .6s ease' }} />
                {on ? <rect x={x - 22} y={y - 2} width="44" height="52" rx="22" fill="none" stroke={BAI.accentSoft} strokeWidth="2" className="living-glow" /> : null}
              </g>
            )
          }),
        )}
        {/* Porte et petit jardin */}
        <rect x="104" y="270" width="36" height="46" rx="18" fill={BAI.owner} />
        <circle cx="132" cy="294" r="2.6" fill={BAI.cta} />
        <circle cx="18" cy="300" r="16" fill={BAI.owner} />
        <circle cx="228" cy="296" r="20" fill={BAI.owner} />
      </svg>
      <div className="living-feed">
        <p className="living-tag">Exemple : un immeuble de 9 logements</p>
        <div role="log" aria-live="off" aria-label="Ce que Bailio vient de faire (exemple)">
          <ol>
          {recent.map((e, i) => (
            <li key={`${e.title}-${e.detail}`} className={i === 0 ? 'living-new' : undefined}>
              <span className="living-dot" aria-hidden />
              <span>
                <strong>{e.title}</strong>
                <span>{e.detail}</span>
              </span>
            </li>
          ))}
        </ol>
        </div>
      </div>
    </div>
  )
}
