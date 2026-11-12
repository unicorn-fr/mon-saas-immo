import { useEffect, useState } from 'react'
import { AppWindow } from './AppWindow'

/**
 * Haut de l'accueil : la vraie interface (capture d'« Aujourd'hui », compte d'exemple) dans une fenêtre de navigateur,
 * et à côté le fil de ce que Bailio vient de faire, une ligne de plus toutes les 2,8 s (skill taste : sur un logiciel,
 * le produit lui-même en haut de page, jamais une illustration). Exemple fictif, dit comme tel. Si l'appareil demande
 * moins d'animations, les trois dernières lignes restent affichées, sans mouvement.
 */
const EVENTS: Array<{ title: string; detail: string; paid?: boolean }> = [
  { title: 'Loyer reçu', detail: 'T3 Montpellier · quittance envoyée', paid: true },
  { title: 'Bail prêt à signer', detail: 'T2 Nîmes · vérifié avant envoi' },
  { title: 'Relance partie', detail: 'Studio Sète · 3 jours de retard' },
  { title: 'Assurance reçue', detail: 'T3 Montpellier · valable jusqu’en 2027', paid: true },
  { title: 'Loyer révisé', detail: 'Studio Sète · IRL du 2e trimestre' },
  { title: 'Candidat solide', detail: 'T2 Nîmes · dossier complet' },
]

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function HeroProduct() {
  const [step, setStep] = useState(() => (reduced() ? EVENTS.length : 1))
  useEffect(() => {
    if (reduced()) return
    const id = window.setInterval(() => setStep((s) => (s >= EVENTS.length ? 1 : s + 1)), 2800)
    return () => window.clearInterval(id)
  }, [])
  const recent = EVENTS.slice(Math.max(0, step - 3), step).reverse()
  return (
    <div className="hero-product">
      <AppWindow img="today" eager alt="Écran « Aujourd’hui » de Bailio : loyers du mois, un loyer en retard avec la relance prête, les raccourcis et l’agenda" />
      <div className="hero-feed">
        <p className="hero-feed-tag">Exemple · en ce moment</p>
        <div role="log" aria-live="off" aria-label="Ce que Bailio vient de faire (exemple)">
          <ol>
            {recent.map((e, i) => (
              <li key={`${e.title}-${e.detail}`} className={i === 0 ? 'hero-feed-new' : undefined}>
                <span className={e.paid ? 'hero-feed-dot hero-feed-dot--paid' : 'hero-feed-dot'} aria-hidden />
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
