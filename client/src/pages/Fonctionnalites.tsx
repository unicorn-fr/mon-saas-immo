import { Fragment, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { display } from '../components/ui'
import { SiteFooter, SiteHeader } from '../components/SiteChrome'
import { SignupCta } from '../components/SignupCta'
import { priceText } from '../config'
import { FEATURES, featurePath, type Feature } from '../content/fonctionnalites'

/** « Titre [en italique] » : la partie entre crochets passe en <em>, une fois par écran. */
function Title({ text }: { text: string }) {
  const parts = text.split(/\[|\]/)
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <em key={i}>{p}</em> : <Fragment key={i}>{p}</Fragment>))}
    </>
  )
}

/** Capture d'écran dans un cadre de téléphone (images 780 × 1560, ou page de PDF). */
function Phone({ img, alt, doc = false, width = 300 }: { img: string; alt: string; doc?: boolean; width?: number }) {
  return (
    <div
      style={{
        width: `min(${width}px, 100%)`,
        borderRadius: doc ? 16 : 36,
        border: `${doc ? 1 : 7}px solid ${doc ? BAI.borderStrong : BAI.night}`,
        overflow: 'hidden',
        background: BAI.surface,
        aspectRatio: doc ? '909 / 900' : '1 / 2',
        flexShrink: 0,
      }}
    >
      <img src={`/fonctionnalites/${img}.webp`} alt={alt} width={780} height={doc ? 772 : 1560} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
    </div>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BAI.surface }}>
      <SiteHeader />
      <main id="contenu" className="container" style={{ flex: 1, maxWidth: 1080, paddingTop: 'clamp(32px, 6vw, 56px)', paddingBottom: 96, color: BAI.inkMid, fontSize: 17, lineHeight: 1.6 }}>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

const blueButton = { display: 'inline-flex', alignItems: 'center', minHeight: 56, padding: '0 28px', borderRadius: 999, background: BAI.owner, color: BAI.surface, fontWeight: 600, textDecoration: 'none' } as const
const h2 = { margin: '0 0 16px', fontSize: 'clamp(24px, 3vw, 30px)', fontWeight: 700, color: BAI.ink, lineHeight: 1.25 } as const

/** /fonctionnalites : toutes les fonctionnalités, chacune avec sa capture. */
export function FonctionnalitesList() {
  return (
    <Shell>
      <h1 style={display('clamp(40px, 7vw, 64px)', { margin: '0 0 16px', maxWidth: 760 })}>
        Tout ce que Bailio fait <em>pour vous</em>
      </h1>
      <p style={{ margin: '0 0 40px', fontSize: 19, maxWidth: 680 }}>
        Du bail à la déclaration d’impôts, pour {priceText()}, tout compris. Captures de l’application, données d’exemple.
      </p>
      <ul className="grid-3" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 20 }}>
        {FEATURES.map((f) => (
          <li key={f.slug}>
            <Link to={featurePath(f.slug)} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BAI.bg, borderRadius: 24, overflow: 'hidden', textDecoration: 'none', color: BAI.ink }}>
              <span style={{ display: 'block', height: 220, overflow: 'hidden', background: BAI.sky, padding: '20px 20px 0' }}>
                <img src={`/fonctionnalites/${f.img}.webp`} alt="" width={780} height={1560} loading="lazy" decoding="async" style={{ width: '70%', height: 'auto', margin: '0 auto', display: 'block', borderRadius: '20px 20px 0 0', border: `5px solid ${BAI.night}`, borderBottom: 'none' }} />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 20 }}>
                <strong style={{ fontSize: 20 }}>{f.name}</strong>
                <span style={{ color: BAI.inkMid, fontSize: 16, lineHeight: 1.5 }}>{f.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p style={{ margin: '40px 0 0', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <Link to="/demo" style={blueButton}>
          Essayer la démo, sans compte
        </Link>
        <Link to="/changer-pour-bailio">Vous utilisez déjà un autre outil ?</Link>
      </p>
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
    <Shell>
      <nav aria-label="Fil d’Ariane" style={{ fontSize: 15, marginBottom: 20 }}>
        <Link to="/fonctionnalites">Fonctionnalités</Link> <span aria-hidden>/</span> {f.name}
      </nav>
      <section className="col-md" style={{ display: 'flex', gap: 'clamp(28px, 6vw, 72px)', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={display('clamp(38px, 6vw, 60px)', { margin: '0 0 20px' })}>
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
        <Phone img={f.img} alt={f.alt} />
      </section>

      <section aria-labelledby="etapes" style={{ marginTop: 'clamp(56px, 9vw, 96px)' }}>
        <h2 id="etapes" style={h2}>
          Comment ça marche
        </h2>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {f.steps.map((s, i) => (
            <li key={s.title} className="col-md" style={{ display: 'flex', gap: 24, alignItems: 'center', background: BAI.bg, borderRadius: 24, padding: 'clamp(20px, 3vw, 28px)' }}>
              <span style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1 }}>
                <span aria-hidden style={{ width: 36, height: 36, borderRadius: 18, background: BAI.owner, color: BAI.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <strong style={{ color: BAI.ink, fontSize: 19 }}>{s.title}</strong>
                  <span>{s.text}</span>
                </span>
              </span>
              {s.img ? <Phone img={s.img} alt={s.alt ?? ''} doc={s.img === 'contrat-pdf'} width={s.img === 'contrat-pdf' ? 360 : 220} /> : null}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="verifie" style={{ marginTop: 56 }}>
        <div className="fold fold--ear" style={{ background: BAI.sky, color: BAI.ink, borderRadius: 24, padding: 'clamp(20px, 4vw, 32px)' }}>
          <h2 id="verifie" style={{ ...h2, fontSize: 22 }}>
            Ce que Bailio vérifie pour vous
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {f.checks.map((c) => (
              <li key={c}>
                <span aria-hidden>✓ </span>
                {c}
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
