import type { ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { SimplePage } from '../components/SiteChrome'
import { SignupCta } from '../components/SignupCta'
import { LAUNCH_OFFER, FOUNDER_LINKEDIN, priceDetail } from '../config'
import { TRUST } from '../content/accueil'
import { ABOUT_FAQ, BAUX, founderName, PROFILS, SOLUTIONS, solutionPath, type Solution, type SolutionBlock } from '../content/solutions'
import { useDescription } from './Guides'

const card = { background: BAI.bg, borderRadius: 24, padding: 'clamp(18px, 3vw, 24px)' } as const
const h2 = { margin: '36px 0 12px', fontSize: 22, fontWeight: 700, color: BAI.ink, lineHeight: 1.3 } as const
const blueButton = { display: 'inline-flex', alignItems: 'center', minHeight: 56, padding: '0 28px', borderRadius: BAI.radiusBtn, boxShadow: BAI.ctaShadow, background: BAI.owner, color: BAI.surface, fontWeight: 600, textDecoration: 'none' } as const
const pill = { display: 'inline-flex', minHeight: 44, alignItems: 'center', padding: '0 18px', borderRadius: 999, border: `1px solid ${BAI.borderStrong}`, color: BAI.ink, textDecoration: 'none' } as const

function Faq({ items }: { items: Array<[string, string]> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(([q, a]) => (
        <details key={q} style={{ ...card, padding: '16px 20px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: BAI.ink, minHeight: 28 }}>{q}</summary>
          <p style={{ margin: '10px 0 0' }}>{a}</p>
        </details>
      ))}
    </div>
  )
}

function Trust() {
  return (
    <ul aria-label="Nos engagements" style={{ listStyle: 'none', margin: '40px 0 0', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
      {TRUST.map((t) => (
        <li key={t.title} style={{ ...card, padding: '16px 20px' }}>
          <strong style={{ display: 'block', color: BAI.ink }}>{t.title}</strong>
          <span style={{ fontSize: 15 }}>{t.text}</span>
        </li>
      ))}
    </ul>
  )
}

function Block({ block }: { block: SolutionBlock }): ReactNode {
  if ('h' in block) return <h2 style={h2}>{block.h}</h2>
  if ('list' in block)
    return (
      <ul style={{ margin: '0 0 16px', paddingLeft: 22 }}>
        {block.list.map((item) => (
          <li key={item} style={{ marginBottom: 6 }}>
            {item}
          </li>
        ))}
      </ul>
    )
  if ('note' in block)
    return (
      <p className="fold fold--ear" style={{ margin: '28px 0', background: BAI.sky, color: BAI.ink, padding: 'clamp(18px, 3vw, 24px)' }}>
        <strong>À retenir : </strong>
        {block.note}
      </p>
    )
  if ('steps' in block)
    return (
      <ol style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {block.steps.map((s, i) => (
          <li key={s.title} style={{ ...card, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span aria-hidden style={{ width: 32, height: 32, borderRadius: 999, background: BAI.sky, color: BAI.owner, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
              {i + 1}
            </span>
            <span>
              <strong style={{ display: 'block', color: BAI.ink }}>{s.title}</strong>
              {s.text}
            </span>
          </li>
        ))}
      </ol>
    )
  if ('price' in block)
    return (
      <>
        <h2 style={h2}>Le prix</h2>
        <p style={{ margin: '0 0 16px' }}>
          {priceDetail()}, tout compris. {LAUNCH_OFFER}, sans carte bancaire. <Link to="/tarifs">Calculer mon prix</Link>
        </p>
      </>
    )
  return <p style={{ margin: '0 0 16px' }}>{block.p}</p>
}

function Sources({ items }: { items: Solution['sources'] }) {
  return (
    <>
      <h2 style={{ ...h2, fontSize: 18 }}>Sources</h2>
      <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15 }}>
        {items.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>{' '}
            (vérifié le {s.checked})
          </li>
        ))}
      </ul>
    </>
  )
}

function Page({ s }: { s: Solution }) {
  useDescription(s.description)
  const group = s.kind === 'bail' ? BAUX : PROFILS
  const others = group.filter((o) => o.slug !== s.slug)
  return (
    <SimplePage title={s.title}>
      <p style={{ margin: '-8px 0 24px' }}>{s.lead}</p>
      <p style={{ margin: '0 0 32px' }}>
        <Link to={s.cta.to} state={s.cta.state} style={blueButton}>
          {s.cta.label}
        </Link>
      </p>
      <aside aria-labelledby="essentiel" className="fold fold--ear" style={{ background: BAI.sky, color: BAI.ink, borderRadius: 24, padding: 'clamp(20px, 4vw, 28px)' }}>
        <h2 id="essentiel" style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700 }}>
          {s.kind === 'bail' ? 'L’essentiel' : 'Ce qui s’applique à vous, en bref'}
        </h2>
        <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {s.facts.map(([k, v]) => (
            <div key={k}>
              <dt style={{ fontWeight: 700 }}>{k}</dt>
              <dd style={{ margin: 0 }}>{v}</dd>
            </div>
          ))}
        </dl>
      </aside>
      <article>
        {s.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </article>
      <h2 style={h2}>Questions</h2>
      <Faq items={s.faq} />
      <h2 style={h2}>Pages utiles</h2>
      <ul style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {s.links.map((l) => (
          <li key={l.to}>
            <Link to={l.to}>{l.label}</Link>
          </li>
        ))}
      </ul>
      <Sources items={s.sources} />
      <p style={{ marginTop: 20, fontSize: 15 }}>Cette page donne les règles générales. Elle ne remplace pas un conseil juridique adapté à votre situation.</p>
      <SignupCta />
      <nav aria-label={s.kind === 'bail' ? 'Les autres types de bail' : 'Les autres profils'} style={{ marginTop: 40 }}>
        <h2 style={{ ...h2, fontSize: 18, marginTop: 0 }}>{s.kind === 'bail' ? 'Les autres types de bail' : 'Les autres profils'}</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {others.map((o) => (
            <li key={o.slug}>
              <Link to={solutionPath(o)} style={pill}>
                {o.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {s.kind === 'profil' ? <Trust /> : null}
    </SimplePage>
  )
}

/** /bail/:slug et /gestion-locative/:slug : une page par type de bail et par profil de propriétaire. */
export function SolutionPage({ kind }: { kind: Solution['kind'] }) {
  const { slug } = useParams()
  const s = SOLUTIONS.find((x) => x.slug === slug && x.kind === kind)
  return s ? <Page s={s} /> : <Navigate to="/" replace />
}

/** Petite liste « Par type de bail » et « Par profil », sur /fonctionnalites et /tarifs. */
export function SolutionLinks() {
  const list = (items: Solution[], label: string) => (
    <nav aria-label={label}>
      <h2 style={{ ...h2, fontSize: 18, marginTop: 0 }}>{label}</h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {items.map((o) => (
          <li key={o.slug}>
            <Link to={solutionPath(o)} style={pill}>
              {o.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
  return (
    <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {list(BAUX, 'Par type de bail')}
      {list(PROFILS, 'Par profil')}
    </div>
  )
}

const PRINCIPLES = [
  { title: 'Simplifier', text: 'Un parcours une question à la fois, sans compte pour préparer un premier bail, et des pages courtes. Vous saisissez chaque information une seule fois : Bailio la réutilise partout.' },
  { title: 'Automatiser', text: 'Les quittances partent dès que le loyer est noté reçu, les relances d’impayés à vos dates si vous les activez, et les rappels des échéances (révision, assurance, diagnostics) arrivent à temps.' },
  { title: 'Sécuriser', text: 'Les règles de la loi sont contrôlées avant la signature : plafond du loyer, DPE, diagnostics. Les données sont hébergées en Suisse, sans aucun traceur.' },
  { title: 'Accompagner', text: 'Les démarches sont guidées pas à pas : départ du locataire, impayé, vente, déclaration des revenus. Un rappel vous est promis le jour même, du lundi au vendredi, si vous préférez en parler.' },
]

/** /a-propos : pourquoi Bailio existe, comment il est fait, qui l'a créé, ses principes. */
export function APropos() {
  useDescription('Bailio aide les propriétaires bailleurs particuliers à faire un bail conforme et à suivre leur location. Pourquoi, comment, et qui est derrière.')
  return (
    <SimplePage title="À propos de Bailio">
      <h2 style={{ ...h2, marginTop: 0 }}>Pourquoi Bailio existe</h2>
      <p>La location a beaucoup de règles : durée, plafond du loyer, dépôt de garantie, diagnostics, congé. Elles changent, et une erreur peut coûter cher. Bailio est fait pour le propriétaire bailleur particulier qui veut un bail conforme et un suivi simple, sans passer par une agence et sans tableur.</p>
      <p>Bailio ne s’adresse qu’au propriétaire : il n’y a pas d’espace locataire.</p>

      <h2 style={h2}>Comment il est fait</h2>
      <ul style={{ margin: '0 0 16px', paddingLeft: 22 }}>
        <li style={{ marginBottom: 6 }}>Les règles de la loi du 6 juillet 1989 sont codées dans le logiciel et chacune est testée.</li>
        <li style={{ marginBottom: 6 }}>Les textes officiels (notice d’information, listes de réparations et de charges) sont reproduits à l’identique, jamais reformulés.</li>
        <li style={{ marginBottom: 6 }}>Les données sont hébergées en Suisse, chez Infomaniak. Aucune donnée n’est envoyée à un service d’IA.</li>
        <li style={{ marginBottom: 6 }}>Aucun cookie, aucun traceur publicitaire : pas de bandeau à accepter.</li>
        <li style={{ marginBottom: 6 }}>Les règles expliquées sur le site citent leur source officielle et la date de vérification.</li>
      </ul>
      <p>
        Pour le détail : <Link to="/securite">sécurité</Link>, <Link to="/confidentialite">confidentialité</Link> et <Link to="/fonctionnalites">fonctionnalités</Link>.
      </p>

      <h2 style={h2}>Le fondateur</h2>
      <p>
        Bailio a été créé par {founderName()}.{' '}
        <a href={FOUNDER_LINKEDIN} target="_blank" rel="noopener noreferrer">
          Son profil LinkedIn
        </a>
        .
      </p>

      <h2 style={h2}>Quatre principes</h2>
      <ul className="grid-2" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 12 }}>
        {PRINCIPLES.map((p) => (
          <li key={p.title} style={card}>
            <strong style={{ display: 'block', color: BAI.ink, fontSize: 19, marginBottom: 6 }}>{p.title}</strong>
            {p.text}
          </li>
        ))}
      </ul>

      <h2 style={h2}>Questions</h2>
      <Faq items={ABOUT_FAQ} />
      <p style={{ marginTop: 16 }}>
        <Link to="/contact">Contacter Bailio</Link>
      </p>
      <SignupCta />
      <Trust />
    </SimplePage>
  )
}
