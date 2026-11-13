import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { SimplePage } from '../components/SiteChrome'
import { LAUNCH_OFFER } from '../config'
import { CALLBACK_PROMISE, INCLUS } from '../content/inclus'

const STEPS = [
  { title: 'Tous vos logements et locataires d’un coup, depuis un fichier Excel ou CSV', text: 'Exportez la liste de votre ancien outil ou de votre tableur : Bailio reconnaît les colonnes, vous vérifiez, tout est ajouté. Rien à ressaisir.' },
  { title: 'Votre bail en photo', text: 'Photo ou PDF du bail signé : Bailio lit le locataire, le loyer, les charges, le dépôt et les dates. Vous vérifiez.' },
  { title: 'Le suivi repart seul', text: 'Quittances, révision du loyer, rappels d’assurance et échéances reprennent à partir d’aujourd’hui.' },
  { title: 'Vos anciens papiers rangés', text: 'Déposez états des lieux, diagnostics et quittances passées dans le dossier du logement.' },
]

/**
 * « Changer pour Bailio » : pour le propriétaire qui utilise déjà un logiciel, un tableur ou une agence. Enlève la peur
 * de tout ressaisir : un bail en photo, le suivi repart, et un rappel le jour même pour le faire ensemble.
 */
export function Changer() {
  return (
    <SimplePage title="Changer pour Bailio">
      <p style={{ margin: '-16px 0 28px', fontSize: 18 }}>Vous gérez déjà vos locations avec un autre outil ? Tout passe dans Bailio en 10 minutes par logement, sans rien ressaisir.</p>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STEPS.map((s, i) => (
          <li key={s.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: BAI.bg, borderRadius: 24, padding: 'clamp(18px, 3vw, 24px)' }}>
            <span aria-hidden style={{ width: 36, height: 36, borderRadius: 18, background: BAI.owner, color: BAI.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
              {i + 1}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <strong style={{ color: BAI.ink, fontSize: 18 }}>{s.title}</strong>
              <span>{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <p style={{ margin: '28px 0 0' }}>
        <Link to="/importer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 56, padding: '0 28px', borderRadius: BAI.radiusBtn, boxShadow: BAI.ctaShadow, background: BAI.owner, color: BAI.surface, fontWeight: 600, textDecoration: 'none' }}>
          Importer mon bail
        </Link>
      </p>
      <h2 style={{ margin: '40px 0 12px', fontSize: 22, fontWeight: 700, color: BAI.ink }}>On le fait avec vous</h2>
      <p style={{ margin: 0 }}>
        Plusieurs logements, des fichiers partout ? {CALLBACK_PROMISE} Nous faisons la reprise avec vous, au téléphone. <Link to="/contact">Être rappelé</Link>
      </p>
      <h2 style={{ margin: '40px 0 12px', fontSize: 22, fontWeight: 700, color: BAI.ink }}>Un seul prix, tout compris</h2>
      <ul className="fold fold--ear" style={{ margin: 0, listStyle: 'none', background: BAI.sky, color: BAI.ink, borderRadius: 24, padding: 'clamp(20px, 4vw, 28px)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {INCLUS.map((x) => (
          <li key={x}>
            <span aria-hidden>✓ </span>
            {x}
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 16 }}>
        Aucune option payante en plus. {LAUNCH_OFFER}, sans engagement. Vous exportez tout en un clic si vous partez.
      </p>
    </SimplePage>
  )
}
