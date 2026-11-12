import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { SimplePage } from '../components/SiteChrome'
import { CONTACT_EMAIL } from '../config'
import { AVIS } from '../content/avis'
import { useDescription } from './Guides'

const h2: CSSProperties = { margin: '36px 0 12px', fontSize: 22, fontWeight: 700, color: BAI.ink }
const card: CSSProperties = { background: BAI.bg, borderRadius: 18, padding: '18px 20px', color: BAI.inkMid, lineHeight: 1.5 }

/**
 * /avis : uniquement de vrais avis, mot pour mot, avec l'accord écrit de leur auteur (content/avis.ts). Tant qu'il n'y en
 * a pas, la page le dit franchement et explique comment Bailio les recueillera. Aucune note moyenne, aucun nombre inventé.
 */
export function AvisPage() {
  useDescription('Les avis des propriétaires qui utilisent Bailio : de vrais avis, recopiés mot pour mot, avec l’accord de leur auteur.')
  return (
    <SimplePage title="Avis des propriétaires">
      {AVIS.length ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
          {AVIS.map((a) => (
            <li key={a.name + a.date} style={card}>
              <blockquote style={{ margin: 0, fontSize: 18, color: BAI.ink }}>« {a.text} »</blockquote>
              <p style={{ margin: '10px 0 0', fontSize: 15 }}>
                <strong>{a.name}</strong>, {a.role}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: 18, color: BAI.ink }}>Bailio est tout jeune : pas encore d’avis publié. Nous préférons une page vide à un faux avis.</p>
      )}
      <h2 style={h2}>Comment nous publions un avis</h2>
      <ul style={{ margin: 0, paddingLeft: 22, lineHeight: 1.6 }}>
        <li>Seulement un propriétaire qui utilise vraiment Bailio.</li>
        <li>Son texte, mot pour mot, sans retouche.</li>
        <li>Avec son accord écrit pour le publier sous ce nom.</li>
        <li>Les avis négatifs sont publiés comme les autres.</li>
        <li>Aucun avis acheté ni échangé contre une remise.</li>
      </ul>
      <h2 style={h2}>Vous utilisez Bailio ?</h2>
      <p>
        Dites-nous ce qui marche et ce qui manque : <a href={`mailto:${CONTACT_EMAIL}?subject=Mon%20avis%20sur%20Bailio`}>{CONTACT_EMAIL}</a>. Nous vous demanderons votre accord avant toute publication.
      </p>
    </SimplePage>
  )
}

/**
 * /espace-locataire : la porte d'entrée du locataire. Pas de compte : il passe par le lien personnel que son propriétaire
 * lui envoie par email (/locataire/:code, /dossier/:code, /candidature/:code). Cette page dit ce qu'il peut y faire.
 */
const TENANT_THINGS: Array<{ title: string; text: string }> = [
  { title: 'Déposer votre dossier', text: 'Pièces autorisées seulement, protégées par un filigrane.' },
  { title: 'Signer le bail', text: 'En ligne, sur téléphone ou ordinateur.' },
  { title: 'Envoyer votre assurance', text: 'Une photo ou un PDF suffit.' },
  { title: 'Recevoir vos quittances', text: 'Par email, chaque mois, si vous le souhaitez.' },
  { title: 'Signaler une panne', text: 'Fuite, électricité, casse : le geste à faire tout de suite, puis le propriétaire est prévenu.' },
  { title: 'Compléter l’état des lieux', text: 'Dans les 10 jours après l’entrée.' },
]

export function EspaceLocatairePublic() {
  useDescription('Locataire d’un propriétaire qui utilise Bailio : déposez votre dossier, signez le bail, envoyez votre assurance et signalez une panne, sans créer de compte.')
  return (
    <SimplePage title="Espace locataire">
      <p style={{ fontSize: 19, color: BAI.ink }}>Pas de compte à créer. Tout passe par le lien que votre propriétaire vous envoie par email.</p>
      <ul className="grid-2" style={{ listStyle: 'none', margin: '24px 0 0', padding: 0, gap: 12 }}>
        {TENANT_THINGS.map((t) => (
          <li key={t.title} style={card}>
            <strong style={{ display: 'block', color: BAI.ink, fontSize: 18, marginBottom: 4 }}>{t.title}</strong>
            {t.text}
          </li>
        ))}
      </ul>
      <h2 style={h2}>Vous n’avez pas reçu de lien ?</h2>
      <p>Demandez-le à votre propriétaire : lui seul peut l’envoyer. Pensez à regarder vos courriers indésirables.</p>
      <h2 style={h2}>Une urgence gaz ?</h2>
      <p>
        Sortez du logement, n’actionnez aucun interrupteur et appelez Urgence sécurité gaz : <a href="tel:0800473333">0 800 47 33 33</a> (GRDF, gratuit, 24 h sur 24).
      </p>
      <h2 style={h2}>Vos données</h2>
      <p>
        Votre propriétaire est responsable de vos données ; Bailio les héberge pour lui. Détail sur la page <Link to="/confidentialite">Confidentialité</Link>.
      </p>
    </SimplePage>
  )
}
