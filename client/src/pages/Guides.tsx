import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BAI, DA2 } from '../constants/bailio-tokens'
import { SiteFooter, SiteHeader } from '../components/SiteChrome'
import { SignupCta } from '../components/SignupCta'
import { GUIDES, RUBRIQUES, coverOf, guidePath, readingMinutes, rubriqueOf, type Guide, type GuideBlock, type Rubrique } from '../content/guides'
import { NotFound } from './legal/Legal'

/**
 * « Actualités » : le journal du propriétaire (/actualites). À la une, l'article le plus récent en grand ; puis tous
 * les autres en cartes datées, avec leur rubrique et leur photo d'illustration ; filtre par rubrique gardé dans
 * l'adresse (?rubrique=). Chaque article (/guides/:slug) se lit comme un article de presse : rubrique, date, temps de
 * lecture, titre, chapô, photo, texte, sources vérifiées.
 */
const dateLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const today = () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** Description de la page pour les moteurs de recherche, remise comme avant en quittant la page. */
export function useDescription(text: string) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) return
    const before = meta.content
    meta.content = text
    return () => {
      meta.content = before
    }
  }, [text])
}

const serif = (size: string) => ({ font: `400 ${size}/1.08 ${DA2.serif}`, letterSpacing: '-0.02em', color: DA2.ink, margin: 0 }) as const

function Meta({ g }: { g: Guide }) {
  return (
    <p style={{ margin: 0, fontSize: 13.5, color: BAI.inkSoft, display: 'flex', flexWrap: 'wrap', gap: '4px 10px', alignItems: 'center' }}>
      <span style={{ fontWeight: 700, color: BAI.accentInk, textTransform: 'none' }}>{rubriqueOf(g)}</span>
      <span aria-hidden>·</span>
      <time dateTime={g.date}>{dateLabel(g.date)}</time>
      <span aria-hidden>·</span>
      <span>{readingMinutes(g)} min de lecture</span>
    </p>
  )
}

function Card({ g }: { g: Guide }) {
  return (
    <li className="jr-card">
      <Link to={guidePath(g)} className="jr-link">
        <img src={coverOf(g)} alt="" loading="lazy" className="jr-img" />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 4px 4px' }}>
          <Meta g={g} />
          <span style={serif('22px')}>{g.title}</span>
        </span>
      </Link>
    </li>
  )
}

export function GuidesList() {
  useDescription('Le journal du propriétaire bailleur : bail, loyer, impayés, logement, impôts. Chaque article est daté et vérifié sur une source officielle.')
  const [params, setParams] = useSearchParams()
  const rub = RUBRIQUES.find((r) => r === params.get('rubrique')) ?? null
  const list = rub ? GUIDES.filter((g) => rubriqueOf(g) === rub) : GUIDES
  const [une, ...rest] = list
  const pick = (r: Rubrique | null) => setParams(r ? { rubrique: r } : {}, { replace: true })
  return (
    <div className="pub" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: DA2.linen }}>
      <SiteHeader />
      <main id="contenu" className="container" style={{ flex: 1, width: '100%', boxSizing: 'border-box', paddingTop: 'clamp(20px, 3vw, 40px)', paddingBottom: 96 }}>
        <header style={{ borderBottom: `2px solid ${DA2.ink}`, paddingBottom: 14, marginBottom: 18, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={serif('clamp(40px, 6vw, 72px)')}>Actualités</h1>
          <p style={{ margin: 0, fontSize: 14, color: BAI.inkSoft, textTransform: 'capitalize' }}>{today()}</p>
        </header>
        <nav aria-label="Rubriques" className="jr-rubs">
          {[null, ...RUBRIQUES].map((r) => (
            <button key={r ?? 'tout'} type="button" aria-pressed={rub === r} onClick={() => pick(r)} className="jr-rub">
              {r ?? 'Tout'}
            </button>
          ))}
        </nav>
        {une ? (
          <article className="jr-une">
            <Link to={guidePath(une)} className="jr-une-link">
              <img src={coverOf(une)} alt="" className="jr-une-img" />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: DA2.ink, background: DA2.sun, borderRadius: 999, padding: '4px 10px', alignSelf: 'flex-start' }}>À la une</span>
                <Meta g={une} />
                <span style={serif('clamp(30px, 3.6vw, 46px)')}>{une.title}</span>
                <span style={{ fontSize: 17, lineHeight: 1.5, color: BAI.inkMid }}>{une.description}</span>
              </span>
            </Link>
          </article>
        ) : null}
        <h2 style={{ ...serif('26px'), margin: '40px 0 16px', paddingTop: 14, borderTop: `1px solid ${BAI.border}` }}>{rub ? `Rubrique ${rub}` : 'Tous les articles'}</h2>
        <ul className="jr-grid">
          {rest.map((g) => (
            <Card key={g.slug} g={g} />
          ))}
        </ul>
        <p style={{ margin: '32px 0 0', fontSize: 14, color: BAI.inkSoft }}>Chaque règle est vérifiée sur une source officielle, citée à la fin de l’article avec sa date de vérification.</p>
      </main>
      <SiteFooter />
    </div>
  )
}

function Block({ block }: { block: GuideBlock }) {
  if ('h' in block) return <h2 style={{ ...serif('28px'), margin: '40px 0 12px' }}>{block.h}</h2>
  if ('list' in block)
    return (
      <ul style={{ margin: '0 0 18px', paddingLeft: 22 }}>
        {block.list.map((item) => (
          <li key={item} style={{ marginBottom: 6 }}>
            {item}
          </li>
        ))}
      </ul>
    )
  if ('note' in block)
    return (
      <p style={{ margin: '28px 0', background: DA2.sunTint, color: DA2.ink, borderLeft: `4px solid ${DA2.sun}`, borderRadius: 14, padding: 'clamp(16px, 3vw, 22px)' }}>
        <strong>À retenir : </strong>
        {block.note}
      </p>
    )
  return <p style={{ margin: '0 0 18px' }}>{block.p}</p>
}

function Article({ guide }: { guide: Guide }) {
  useDescription(guide.description)
  const others = GUIDES.filter((g) => g.slug !== guide.slug && rubriqueOf(g) === rubriqueOf(guide)).concat(GUIDES.filter((g) => g.slug !== guide.slug && rubriqueOf(g) !== rubriqueOf(guide))).slice(0, 3)
  return (
    <div className="pub" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: DA2.linen }}>
      <SiteHeader />
      <main id="contenu" className="container" style={{ flex: 1, width: '100%', boxSizing: 'border-box', paddingTop: 'clamp(20px, 3vw, 40px)', paddingBottom: 96 }}>
        <article className="jr-article">
          <p style={{ margin: '0 0 14px', fontSize: 14 }}>
            <Link to="/actualites">Actualités</Link>
            <span aria-hidden> › </span>
            <Link to={`/actualites?rubrique=${encodeURIComponent(rubriqueOf(guide))}`}>{rubriqueOf(guide)}</Link>
          </p>
          <Meta g={guide} />
          <h1 style={{ ...serif('clamp(36px, 5vw, 58px)'), margin: '12px 0 16px' }}>{guide.title}</h1>
          <p style={{ margin: '0 0 24px', fontSize: 20, lineHeight: 1.5, color: BAI.inkMid }}>{guide.description}</p>
          <img src={coverOf(guide)} alt="" className="jr-hero" />
          <div className="jr-body">
            {guide.blocks.map((b, i) => (
              <Block key={i} block={b} />
            ))}
            <h2 style={{ ...serif('22px'), margin: '40px 0 10px' }}>Sources</h2>
            <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15 }}>
              {guide.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>{' '}
                  (vérifié le {s.checked})
                </li>
              ))}
            </ul>
            <p style={{ marginTop: 16, fontSize: 14, color: BAI.inkSoft }}>Cet article donne les règles générales. Il ne remplace pas un conseil juridique adapté à votre situation.</p>
            <SignupCta />
          </div>
        </article>
        {others.length ? (
          <section aria-labelledby="jr-autres" style={{ marginTop: 56, paddingTop: 14, borderTop: `2px solid ${DA2.ink}` }}>
            <h2 id="jr-autres" style={{ ...serif('26px'), margin: '0 0 16px' }}>
              À lire aussi
            </h2>
            <ul className="jr-grid">
              {others.map((g) => (
                <Card key={g.slug} g={g} />
              ))}
            </ul>
            <p style={{ marginTop: 20 }}>
              <Link to="/actualites">Toutes les actualités</Link>
            </p>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}

export function GuideArticle() {
  const { slug } = useParams()
  const guide = GUIDES.find((g) => g.slug === slug)
  return guide ? <Article guide={guide} /> : <NotFound />
}
