import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { PARKING_PRICE, priceText } from '../config'

/**
 * Encart sous les outils et modèles gratuits : ce que Bailio fait de plus, le prix, et l'inscription. Bouton bleu :
 * le jaune reste réservé au bouton « Créer mon bail » de l'en-tête (une seule action principale jaune par écran).
 */
export function SignupCta({ text }: { text?: string }) {
  return (
    <aside aria-label="Bailio" className="fold fold--ear" style={{ marginTop: 40, background: BAI.sky, color: BAI.ink, borderRadius: 24, padding: 'clamp(20px, 4vw, 28px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <strong style={{ fontSize: 20, lineHeight: 1.3 }}>Bailio le fait pour vous, sans erreur</strong>
      <span style={{ fontSize: 16, lineHeight: 1.5 }}>{text ?? 'Bail conforme, signature en ligne, quittances, relances et rappels : tout se prépare seul, avec les bonnes dates et les bons montants.'}</span>
      <span style={{ fontSize: 15 }}>
        Premier mois offert, sans carte bancaire. Ensuite {priceText()}, {PARKING_PRICE} pour un garage, tout compris.
      </span>
      <Link to="/commencer" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', minHeight: 52, padding: '0 26px', borderRadius: 999, background: BAI.owner, color: BAI.surface, fontWeight: 600, textDecoration: 'none' }}>
        Créer mon bail gratuit
      </Link>
    </aside>
  )
}
