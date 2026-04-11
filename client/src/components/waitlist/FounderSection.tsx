import { useEffect, useRef, useState } from 'react'

interface FounderSectionProps {
  photo?: string
}

export default function FounderSection({ photo }: FounderSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect() }
    }, { threshold: 0.10 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      style={{
        background: 'var(--c-surface)',
        padding: 'clamp(48px,7vw,80px) clamp(16px,5vw,64px)',
        opacity:   inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(24px)',
        transition: 'opacity .65s ease, transform .65s ease',
      }}
    >
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--c-accent)', margin: '0 0 28px',
        }}>
          Pourquoi j'ai lancé Bailio
        </p>

        <div style={{
          display: 'flex',
          gap: 'clamp(20px,4vw,40px)',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}>
          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            {photo ? (
              <img
                src={photo}
                alt="Enzo, fondateur de Bailio"
                style={{
                  width: 64, height: 64, borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--c-primary-border)',
                }}
              />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--c-primary-light)',
                border: '2px solid var(--c-primary-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontStyle: 'italic',
                  fontWeight: 700, fontSize: 22, color: 'var(--c-primary)',
                }}>E</span>
              </div>
            )}
            <div style={{
              marginTop: 8, textAlign: 'center',
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
              color: 'var(--c-ink)',
            }}>Enzo</div>
            <div style={{
              textAlign: 'center',
              fontFamily: 'var(--font-body)', fontSize: 10,
              color: 'var(--c-ink-faint)',
            }}>Fondateur</div>
          </div>

          {/* Prose */}
          <div style={{ flex: '1 1 280px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--c-ink-mid)', lineHeight: 1.80, margin: '0 0 14px' }}>
              J'ai lancé Bailio à 20 ans depuis ma chambre d'étudiant.
              Pas par ambition démesurée — par frustration.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--c-ink-mid)', lineHeight: 1.80, margin: '0 0 14px' }}>
              Mes parents galèrent à louer leur appartement. Des dossiers perdus.
              Une agence qui prend 15&nbsp;%. Des emails sans réponse pendant des semaines.
              Et de l'autre côté, des locataires qui passent des mois à chercher
              sans jamais savoir pourquoi leur dossier est refusé.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--c-ink-mid)', lineHeight: 1.80, margin: '0 0 14px' }}>
              J'ai regardé ce marché et je me suis dit : tout ça peut être mieux.
              Pas révolutionné — juste mieux. Plus honnête. Plus rapide. Moins cher pour tout le monde.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--c-ink-mid)', lineHeight: 1.80, margin: '0 0 14px' }}>
              Alors j'ai construit Bailio. Un outil qui fait le travail à ta place —
              sans te facturer le travail d'une agence.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--c-ink)', lineHeight: 1.80, margin: 0, fontWeight: 500 }}>
              Si tu es là, c'est que tu cherches exactement ça. Bienvenue.
            </p>

            {/* Signature */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginTop: 22, paddingTop: 18,
              borderTop: '1px solid var(--c-border)',
            }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontStyle: 'italic',
                fontWeight: 600, fontSize: 15, color: 'var(--c-primary)',
              }}>
                Enzo —
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--c-ink-faint)' }}>
                20 ans, fondateur de Bailio
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
