import { Fragment, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { display } from '../components/ui'
import { SiteFooter, SiteHeader } from '../components/SiteChrome'
import { SignupCta } from '../components/SignupCta'
import { AppWindow } from '../components/AppWindow'
import { ProductTour } from '../components/ProductTour'
import { priceText } from '../config'
import { SolutionLinks } from './Solutions'
import { CALLBACK_PROMISE } from '../content/inclus'
import { FEATURES, PROFILES, SECTIONS, SHOWCASE, featurePath, type Feature } from '../content/fonctionnalites'

/** « Titre [en italique] » : la partie entre crochets passe en <em>, une fois par écran. */
function Title({ text }: { text: string }) {
  const parts = text.split(/\[|\]/)
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <em key={i}>{p}</em> : <Fragment key={i}>{p}</Fragment>))}
    </>
  )
}

function Shell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BAI.surface }}>
      <SiteHeader />
      <main id="contenu" className="container" style={{ flex: 1, maxWidth: wide ? 1240 : 1080, paddingTop: 'clamp(24px, 5vw, 48px)', paddingBottom: 96, color: BAI.inkMid, fontSize: 17, lineHeight: 1.6 }}>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

const blueButton = { display: 'inline-flex', alignItems: 'center', minHeight: 56, padding: '0 28px', borderRadius: 999, background: BAI.owner, color: BAI.surface, fontWeight: 600, textDecoration: 'none' } as const
const outlineButton = { display: 'inline-flex', alignItems: 'center', minHeight: 56, padding: '0 26px', borderRadius: 999, border: `1.5px solid ${BAI.borderStrong}`, color: BAI.ink, fontWeight: 600, textDecoration: 'none' } as const
const h2 = { margin: '0 0 16px', fontSize: 'clamp(26px, 3.4vw, 36px)', fontWeight: 700, color: BAI.ink, lineHeight: 1.2 } as const
const pill = { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: BAI.owner, background: BAI.sky, borderRadius: 999, padding: '4px 14px' } as const

/** Pastille « ✓ » d'une ligne de liste (icône décorative). */
function Check() {
  return (
    <span aria-hidden style={{ width: 28, height: 28, borderRadius: 9, background: BAI.sky, color: BAI.owner, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: 15 }}>
      ✓
    </span>
  )
}

/** Vitrine : les écrans de l'application qui défilent seuls, la zone utile montrée par le curseur. */
function Showcase() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      <ProductTour steps={SHOWCASE} />
      <p style={{ margin: 0, fontSize: 14, textAlign: 'center' }}>Capture de l’application sur ordinateur, compte d’exemple.</p>
    </div>
  )
}

/** /fonctionnalites : tout Bailio, en écrans réels, du bail à la déclaration. */
export function FonctionnalitesList() {
  return (
    <Shell wide>
      <section className="col-md" style={{ display: 'flex', gap: 'clamp(28px, 5vw, 64px)', alignItems: 'center' }}>
        <div style={{ flex: '0 1 440px', minWidth: 0 }}>
          <h1 style={display('clamp(38px, 5.4vw, 60px)', { margin: '0 0 20px' })}>
            Tout Bailio, du bail à la <em>déclaration</em>
          </h1>
          <p style={{ margin: '0 0 28px', fontSize: 19 }}>Bail conforme, signature, quittances, relances, état des lieux et impôts : tout ce qu’il faut pour louer seul, dans une seule application.</p>
          <p style={{ margin: '0 0 24px', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link to="/demo" style={blueButton}>
              Essayer la démo
            </Link>
            <a href="/#tarifs" style={outlineButton}>
              Voir le prix
            </a>
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15 }}>
            <li>✓ {priceText()}, tout compris</li>
            <li>✓ Signature en ligne incluse, sans engagement</li>
            <li>✓ {CALLBACK_PROMISE}</li>
          </ul>
        </div>
        <div style={{ flex: '1 1 0', minWidth: 0, width: '100%' }}>
          <Showcase />
        </div>
      </section>

      <nav aria-label="Parties de la page" style={{ position: 'sticky', top: 0, zIndex: 2, background: BAI.surface, margin: 'clamp(40px, 6vw, 64px) 0 0', padding: '12px 0', borderBottom: `1px solid ${BAI.border}`, overflowX: 'auto' }}>
        <ul style={{ display: 'flex', gap: 8, margin: 0, padding: 0, listStyle: 'none', whiteSpace: 'nowrap' }}>
          {[...SECTIONS.map((s) => ({ id: s.id, title: s.title })), { id: 'pour-qui', title: 'Pour qui' }].map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 16px', borderRadius: 999, border: `1px solid ${BAI.borderStrong}`, color: BAI.ink, textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {SECTIONS.map((s, n) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-titre`} style={{ scrollMarginTop: 80, paddingTop: 'clamp(48px, 7vw, 88px)' }}>
          <p style={{ margin: '0 0 8px', color: BAI.owner, fontWeight: 600, fontSize: 15 }}>
            <span aria-hidden>— </span>
            {n + 1}. {s.title}
          </p>
          <div className="col-md" style={{ display: 'flex', gap: 'clamp(28px, 5vw, 56px)', alignItems: 'flex-start', flexDirection: n % 2 ? 'row-reverse' : 'row' }}>
            <div style={{ flex: '0 1 420px', minWidth: 0 }}>
              <h2 id={`${s.id}-titre`} style={h2}>
                {s.title}
              </h2>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {s.items.map((it) => (
                  <li key={it.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Check />
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <strong style={{ color: BAI.ink }}>{it.title}</strong>
                      <span style={{ fontSize: 16, lineHeight: 1.5 }}>{it.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p style={{ margin: '20px 0 0', display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: 15, fontWeight: 600 }}>
                {s.links.map((slug) => {
                  const f = FEATURES.find((x) => x.slug === slug)
                  return f ? (
                    <Link key={slug} to={featurePath(slug)}>
                      {f.name} <span aria-hidden>→</span>
                    </Link>
                  ) : null
                })}
              </p>
            </div>
            <div style={{ flex: '1 1 0', minWidth: 0, width: '100%' }}>
              <AppWindow img={s.img} alt={s.alt} />
            </div>
          </div>
        </section>
      ))}

      <section id="pour-qui" aria-labelledby="pour-qui-titre" style={{ scrollMarginTop: 80, paddingTop: 'clamp(48px, 7vw, 88px)' }}>
        <h2 id="pour-qui-titre" style={h2}>
          Pour qui ?
        </h2>
        <ul className="grid-4" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 16 }}>
          {PROFILES.map((p) => (
            <li key={p.title} style={{ display: 'flex', flexDirection: 'column', gap: 8, background: BAI.bg, borderRadius: 24, padding: 22 }}>
              <span style={{ ...pill, alignSelf: 'flex-start', fontSize: 13 }}>{p.tag}</span>
              <strong style={{ color: BAI.ink, fontSize: 19 }}>{p.title}</strong>
              <span style={{ fontSize: 16, lineHeight: 1.5, flex: 1 }}>{p.text}</span>
              <Link to={p.to} style={{ fontWeight: 600, fontSize: 15 }}>
                Découvrir <span aria-hidden>→</span>
                <span className="sr-only"> : {p.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SolutionLinks />

      <div style={{ maxWidth: 800, marginTop: 24 }}>
        <SignupCta />
      </div>
    </Shell>
  )
}

/** /fonctionnalites/:slug : une fonctionnalité, montrée avec de vraies captures. */
export function FonctionnaliteArticle() {
  const { slug } = useParams()
  const f = FEATURES.find((x) => x.slug === slug)
  if (!f) return <Navigate to="/fonctionnalites" replace />
  return <Article f={f} />
}

function Article({ f }: { f: Feature }) {
  const others = FEATURES.filter((x) => x.slug !== f.slug)
  return (
    <Shell wide>
      <nav aria-label="Fil d’Ariane" style={{ fontSize: 15, marginBottom: 20 }}>
        <Link to="/fonctionnalites">Fonctionnalités</Link> <span aria-hidden>/</span> {f.name}
      </nav>
      <section className="col-md" style={{ display: 'flex', gap: 'clamp(28px, 5vw, 64px)', alignItems: 'center' }}>
        <div style={{ flex: '0 1 440px', minWidth: 0 }}>
          <h1 style={display('clamp(36px, 5vw, 56px)', { margin: '0 0 20px' })}>
            <Title text={f.title} />
          </h1>
          <p style={{ margin: '0 0 28px', fontSize: 19 }}>{f.lead}</p>
          <p style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <Link to="/demo" style={blueButton}>
              Essayer la démo
            </Link>
            <span style={{ fontSize: 15 }}>Compris dans {priceText()}</span>
          </p>
        </div>
        <div style={{ flex: '1 1 0', minWidth: 0, width: '100%' }}>
          <AppWindow img={f.img} alt={f.alt} spot={f.spot} eager />
        </div>
      </section>

      <section aria-labelledby="etapes" style={{ marginTop: 'clamp(56px, 8vw, 96px)' }}>
        <h2 id="etapes" style={h2}>
          Comment ça marche
        </h2>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {f.steps.map((s, i) => (
            <li key={s.title} className="col-md" style={{ display: 'flex', gap: 'clamp(20px, 4vw, 40px)', alignItems: 'center', background: BAI.bg, borderRadius: 24, padding: 'clamp(20px, 3vw, 32px)' }}>
              <span style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: '1 1 0', minWidth: 0 }}>
                <span aria-hidden style={{ width: 36, height: 36, borderRadius: 18, background: BAI.owner, color: BAI.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <strong style={{ color: BAI.ink, fontSize: 19 }}>{s.title}</strong>
                  <span>{s.text}</span>
                </span>
              </span>
              {s.img ? (
                <span style={{ flex: '1.4 1 0', minWidth: 0, width: '100%' }}>
                  {s.img === 'contrat-pdf' ? (
                    <img src="/fonctionnalites/contrat-pdf.webp" alt={s.alt ?? ''} width={780} height={772} loading="lazy" decoding="async" style={{ width: '100%', maxWidth: 520, height: 'auto', display: 'block', margin: '0 auto', borderRadius: 12, border: `1px solid ${BAI.borderStrong}` }} />
                  ) : (
                    <AppWindow img={s.img} alt={s.alt ?? ''} />
                  )}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="verifie" style={{ marginTop: 56 }}>
        <div className="fold fold--ear" style={{ background: BAI.sky, color: BAI.ink, borderRadius: 24, padding: 'clamp(20px, 4vw, 32px)' }}>
          <h2 id="verifie" style={{ ...h2, fontSize: 22 }}>
            Ce que Bailio vérifie pour vous
          </h2>
          <ul className="grid-2" style={{ margin: 0, padding: 0, listStyle: 'none', gap: 10 }}>
            {f.checks.map((c) => (
              <li key={c} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Check />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="questions" style={{ marginTop: 56, maxWidth: 800 }}>
        <h2 id="questions" style={h2}>
          Vos questions
        </h2>
        {f.faq.map((x) => (
          <details key={x.q} style={{ borderBottom: `1px solid ${BAI.border}`, padding: '14px 0' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, color: BAI.ink }}>{x.q}</summary>
            <p style={{ margin: '10px 0 0' }}>{x.a}</p>
          </details>
        ))}
      </section>

      {f.links.length ? (
        <section aria-labelledby="pour-aller-plus-loin" style={{ marginTop: 48, maxWidth: 800 }}>
          <h2 id="pour-aller-plus-loin" style={{ ...h2, fontSize: 22 }}>
            Pour aller plus loin, gratuitement
          </h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {f.links.map((l) => (
              <li key={l.to}>
                <Link to={l.to}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div style={{ maxWidth: 800 }}>
        <SignupCta text={`${f.name}, et tout le reste : bail, quittances, relances, état des lieux et impôts.`} />
      </div>

      <nav aria-label="Autres fonctionnalités" style={{ marginTop: 48 }}>
        <h2 style={{ ...h2, fontSize: 20 }}>Les autres fonctionnalités</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {others.map((o) => (
            <li key={o.slug}>
              <Link to={featurePath(o.slug)} style={{ display: 'inline-flex', minHeight: 44, alignItems: 'center', padding: '0 18px', borderRadius: 999, border: `1px solid ${BAI.borderStrong}`, color: BAI.ink, textDecoration: 'none' }}>
                {o.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Shell>
  )
}
