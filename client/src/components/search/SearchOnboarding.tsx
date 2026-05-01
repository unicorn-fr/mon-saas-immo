import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Map, Heart, X, ChevronRight } from 'lucide-react'

const STEPS = [
  {
    icon: Sparkles,
    color: '#c4976a',
    colorLight: '#fdf5ec',
    title: 'Recherche IA',
    description: "Décris ton logement idéal en une phrase. L'IA comprend ta demande et filtre instantanément tous les biens disponibles.",
    example: '"T2 Lyon centre, moins de 800€, avec parking"',
  },
  {
    icon: Map,
    color: '#1a3270',
    colorLight: '#eaf0fb',
    title: 'Explore la carte',
    description: 'Visualise tous les biens sur une carte interactive. Zoome sur un quartier, clique sur un bien pour voir ses détails.',
    example: null,
  },
  {
    icon: Heart,
    color: '#1b5e3b',
    colorLight: '#edf7f2',
    title: 'Mode Swipe ❤️',
    description: 'Sur mobile, glisse à droite pour sauvegarder un bien dans tes favoris. Glisse à gauche pour passer au suivant.',
    example: null,
  },
]

interface Props { onClose: () => void }

export function SearchOnboarding({ onClose }: Props) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(13,12,10,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          style={{
            width: '100%', maxWidth: 480, background: '#fff',
            borderRadius: '24px 24px 0 0', padding: '28px 24px 40px',
            boxShadow: '0 -8px 40px rgba(13,12,10,0.12)',
          }}
        >
          {/* Close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X style={{ width: 18, height: 18, color: '#9e9b96' }} />
            </button>
          </div>

          {/* Icon */}
          <div style={{ width: 64, height: 64, borderRadius: 18, background: current.colorLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Icon style={{ width: 28, height: 28, color: current.color }} />
          </div>

          {/* Step indicator */}
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: current.color, marginBottom: 8 }}>
            {step + 1} / {STEPS.length}
          </p>

          {/* Title */}
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: '#0d0c0a', margin: '0 0 12px' }}>
            {current.title}
          </h2>

          {/* Description */}
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 15, color: '#5a5754', lineHeight: 1.6, margin: 0 }}>
            {current.description}
          </p>

          {/* Example */}
          {current.example && (
            <p style={{ marginTop: 12, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: '#9e9b96', fontStyle: 'italic', background: '#f4f2ee', padding: '8px 12px', borderRadius: 8 }}>
              {current.example}
            </p>
          )}

          {/* Dots */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 24, marginBottom: 20 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 999, background: i === step ? current.color : '#e4e1db', transition: 'all 0.25s' }} />
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => isLast ? onClose() : setStep(s => s + 1)}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: '#1a1a2e', color: '#fff',
              fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 15,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isLast ? 'Commencer à explorer' : 'Suivant'}
            {!isLast && <ChevronRight style={{ width: 18, height: 18 }} />}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
