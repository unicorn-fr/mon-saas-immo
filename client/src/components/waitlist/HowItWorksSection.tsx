import { useState, useEffect, useRef } from 'react'

type Tab = 'proprietaires' | 'locataires'

interface StepData {
  title: string
  desc: string
}

const STEPS: Record<Tab, StepData[]> = {
  proprietaires: [
    {
      title: 'Publie ton annonce',
      desc: "Crée ton annonce en quelques minutes. Bailio la diffuse automatiquement. Pas besoin de passer par une agence ou de payer un photographe.",
    },
    {
      title: 'Sélectionne ton locataire',
      desc: "Reçois les candidatures avec dossiers vérifiés. Score de solvabilité, justificatifs analysés. Tu choisis en un clic.",
    },
    {
      title: 'Signe et encaisse',
      desc: "Le bail se signe en ligne. Les loyers tombent chaque mois. Les quittances partent automatiquement. Tu n'as plus rien à faire.",
    },
  ],
  locataires: [
    {
      title: 'Monte ton dossier',
      desc: "Télécharge tes justificatifs une seule fois. On les vérifie et on te génère un dossier propre, prêt à envoyer. Ça prend moins de 2 minutes.",
    },
    {
      title: 'Postule aux annonces',
      desc: "Envoie ton dossier vérifié aux propriétaires en un clic. Pas de commission. Pas de frais cachés.",
    },
    {
      title: 'Signe en ligne',
      desc: "Le bail se signe directement depuis Bailio. Valeur légale garantie. Ta quittance arrive chaque mois, automatiquement.",
    },
  ],
}

const TAB_COLOR: Record<Tab, string> = {
  proprietaires: 'var(--c-accent)',
  locataires:    'var(--c-accent)',
}
const TAB_LIGHT: Record<Tab, string> = {
  proprietaires: 'var(--c-accent-light)',
  locataires:    'var(--c-accent-light)',
}
const TAB_BORDER: Record<Tab, string> = {
  proprietaires: 'rgba(196,151,106,0.40)',
  locataires:    'rgba(196,151,106,0.40)',
}

export default function HowItWorksSection() {
  const [tab, setTab]     = useState<Tab>('proprietaires')
  const [fading, setFading] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect() }
    }, { threshold: 0.10 })
    if (sectionRef.current) io.observe(sectionRef.current)
    return () => io.disconnect()
  }, [])

  function switchTab(next: Tab) {
    if (next === tab || fading) return
    setFading(true)
    setTimeout(() => { setTab(next); setFading(false) }, 220)
  }

  const steps     = STEPS[tab]
  const accent    = TAB_COLOR[tab]
  const accentLight = TAB_LIGHT[tab]

  return (
    <section
      ref={sectionRef}
      style={{
        background: 'var(--c-bg)',
        padding: 'clamp(56px,9vw,96px) clamp(16px,5vw,64px)',
        opacity:   inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(24px)',
        transition: 'opacity .65s ease, transform .65s ease',
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(32px,5vw,48px)' }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 10.5, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--c-accent)', margin: '0 0 12px',
          }}>
            Comment ça marche ?
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4.5vw,44px)', color: 'var(--c-ink)', margin: 0,
          }}>
            Trois étapes. Pas une de plus.
          </h2>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div
          role="tablist"
          aria-label="Choisir le profil"
          style={{
            display: 'flex', gap: 8,
            justifyContent: 'center',
            marginBottom: 'clamp(32px,5vw,48px)',
          }}
        >
          {(['proprietaires', 'locataires'] as Tab[]).map((t) => {
            const active = tab === t
            return (
              <button
                key={t}
                role="tab"
                aria-selected={active}
                onClick={() => switchTab(t)}
                style={{
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                  padding: '9px 24px', borderRadius: 999,
                  cursor: 'pointer', transition: 'all .18s',
                  background: active ? TAB_LIGHT[t] : 'transparent',
                  border: `1.5px solid ${active ? TAB_BORDER[t] : 'var(--c-border)'}`,
                  color: active ? TAB_COLOR[t] : 'var(--c-ink-mid)',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${TAB_COLOR[t]}30` }}
                onBlur={(e)  => { e.currentTarget.style.boxShadow = 'none' }}
              >
                {t === 'proprietaires' ? 'Propriétaires' : 'Locataires'}
              </button>
            )
          })}
        </div>

        {/* ── Steps ──────────────────────────────────────────────── */}
        <div
          role="tabpanel"
          style={{
            opacity:   fading ? 0 : 1,
            transform: fading ? 'translateY(6px)' : 'none',
            transition: 'opacity .22s ease, transform .22s ease',
          }}
        >
          <ol
            style={{
              listStyle: 'none', margin: 0, padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'clamp(12px,2vw,20px)',
            }}
          >
            {steps.map((step, i) => (
              <li
                key={`${tab}-${i}`}
                style={{
                  opacity:   fading ? 0 : 1,
                  transform: fading ? 'translateY(8px)' : 'none',
                  transition: `opacity .28s ${i * 0.09}s ease, transform .28s ${i * 0.09}s ease`,
                  background: 'var(--c-surface)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 14,
                  padding: 'clamp(20px,3vw,28px)',
                  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
                  display: 'flex', flexDirection: 'column', gap: 14,
                }}
              >
                {/* Numéro */}
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: accentLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontStyle: 'italic',
                    fontWeight: 700, fontSize: 20, color: accent, lineHeight: 1,
                  }}>
                    {i + 1}
                  </span>
                </div>

                {/* Contenu */}
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18,
                    color: 'var(--c-ink)', marginBottom: 8, lineHeight: 1.3,
                  }}>
                    {step.title}
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 13.5,
                    color: 'var(--c-ink-mid)', lineHeight: 1.65,
                    margin: 0,
                  }}>
                    {step.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

      </div>
    </section>
  )
}
