import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  FolderOpen,
  SendHorizonal,
  FileText,
  Home,
  ClipboardList,
  Calendar,
  MessageSquare,
  MapPin,
  ChevronRight,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { BAI } from '../../constants/bailio-tokens'
import { useAuthStore } from '../../store/authStore'
import { apiClient } from '../../services/api.service'

// ── Constants ──────────────────────────────────────────────────────────────────

const HERO_BG = '#0a0d1a'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 10,
  padding: '12px 16px',
  color: '#ffffff',
  fontSize: 15,
  fontFamily: BAI.fontBody,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const inputWithIconStyle: React.CSSProperties = {
  ...inputStyle,
  paddingLeft: 44,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontFamily: BAI.fontBody,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.50)',
  marginBottom: 8,
}

// ── Tour feature cards ─────────────────────────────────────────────────────────

interface FeatureCard {
  icon: React.ElementType
  title: string
  description: string
}

const TENANT_FEATURES: FeatureCard[] = [
  {
    icon: Search,
    title: 'Rechercher un logement',
    description: 'Filtrez par ville, prix, surface et type de bien.',
  },
  {
    icon: FolderOpen,
    title: 'Gérer ton dossier locatif',
    description: 'Centralise pièces d\'identité, revenus et garanties.',
  },
  {
    icon: SendHorizonal,
    title: 'Suivre tes candidatures',
    description: 'Suis l\'avancement de chaque demande en temps réel.',
  },
  {
    icon: FileText,
    title: 'Signer ton bail en ligne',
    description: 'Signature électronique légale eIDAS directement sur la plateforme.',
  },
]

const OWNER_FEATURES: FeatureCard[] = [
  {
    icon: Home,
    title: 'Publier vos annonces',
    description: 'Créez des annonces complètes avec photos et description.',
  },
  {
    icon: ClipboardList,
    title: 'Gérer vos candidatures',
    description: 'Recevez et traitez les dossiers locataires facilement.',
  },
  {
    icon: Calendar,
    title: 'Suivre vos contrats',
    description: 'Baux, états des lieux et signatures au même endroit.',
  },
  {
    icon: MessageSquare,
    title: 'Messagerie propriétaire',
    description: 'Communiquez avec vos locataires en toute simplicité.',
  },
]

// ── Main component ─────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const navigate = useNavigate()

  const isTenant = user?.role === 'TENANT'
  const totalSteps = 4

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const goNext = () => {
    if (step < totalSteps - 1) {
      setDirection(1)
      setStep(s => s + 1)
    }
  }

  const goPrev = () => {
    if (step > 0) {
      setDirection(-1)
      setStep(s => s - 1)
    }
  }

  const finish = async (skipToSearch = false) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await apiClient.patch('/auth/profile', {
        firstName: firstName.trim() || user?.firstName,
        lastName: lastName.trim() || user?.lastName,
        city: city.trim() || undefined,
        onboardingCompleted: true,
      })
      // The API returns { success, data: { user } }
      const updatedUser = res.data?.data?.user ?? res.data?.data
      if (updatedUser && user) {
        setUser({
          ...user,
          firstName: firstName.trim() || user.firstName,
          lastName: lastName.trim() || user.lastName,
          city: city.trim() || user.city,
          onboardingCompleted: true,
        })
      }
      if (skipToSearch) {
        navigate(isTenant ? '/search' : '/properties/new')
      } else {
        navigate(isTenant ? '/search' : '/properties/new')
      }
    } catch {
      toast.error('Impossible de sauvegarder vos préférences.')
      // Still close wizard on error — don't block the user
      if (user) {
        setUser({ ...user, onboardingCompleted: true })
      }
      navigate(isTenant ? '/dashboard/tenant' : '/dashboard/owner')
    } finally {
      setIsSubmitting(false)
    }
  }

  const skip = () => {
    // Close wizard immediately, then persist in background
    if (user) setUser({ ...user, onboardingCompleted: true })
    apiClient.patch('/auth/profile', { onboardingCompleted: true }).catch(() => {})
  }

  const progressPct = ((step + 1) / totalSteps) * 100

  const features = isTenant ? TENANT_FEATURES : OWNER_FEATURES

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: HERO_BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Subtle noise texture overlay */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
          opacity: 0.6,
        }}
      />

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            background: BAI.caramel,
            transformOrigin: 'left',
          }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Skip / close button */}
      <button
        onClick={skip}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.35)',
          cursor: 'pointer',
          fontSize: 13,
          fontFamily: BAI.fontBody,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: 8,
          transition: 'color 0.15s',
          minHeight: 44,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)' }}
      >
        <X size={15} />
        Passer
      </button>

      {/* Step counter */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          fontSize: 12,
          fontFamily: BAI.fontBody,
          color: 'rgba(255,255,255,0.30)',
          letterSpacing: '0.08em',
        }}
      >
        {step + 1} / {totalSteps}
      </div>

      {/* Main content area */}
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          padding: '0 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            {step === 0 && (
              <StepWelcome
                isTenant={isTenant}
                firstName={firstName}
                lastName={lastName}
                onFirstName={setFirstName}
                onLastName={setLastName}
                onNext={goNext}
              />
            )}
            {step === 1 && (
              <StepLocation
                isTenant={isTenant}
                city={city}
                onCity={setCity}
                onNext={goNext}
                onBack={goPrev}
              />
            )}
            {step === 2 && (
              <StepTour
                isTenant={isTenant}
                features={features}
                onNext={goNext}
                onBack={goPrev}
              />
            )}
            {step === 3 && (
              <StepCTA
                isTenant={isTenant}
                firstName={firstName}
                isSubmitting={isSubmitting}
                onFinish={() => finish(false)}
                onBack={goPrev}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Step 1 — Welcome ───────────────────────────────────────────────────────────

interface StepWelcomeProps {
  isTenant: boolean
  firstName: string
  lastName: string
  onFirstName: (v: string) => void
  onLastName: (v: string) => void
  onNext: () => void
}

function StepWelcome({ isTenant, firstName, lastName, onFirstName, onLastName, onNext }: StepWelcomeProps) {
  return (
    <div>
      {/* Overline */}
      <p style={{
        fontFamily: BAI.fontBody,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: BAI.caramel,
        margin: '0 0 12px',
      }}>
        Bienvenue
      </p>

      {/* Title */}
      <h1 style={{
        fontFamily: BAI.fontDisplay,
        fontSize: 'clamp(32px, 6vw, 46px)',
        fontWeight: 700,
        fontStyle: 'italic',
        color: '#ffffff',
        margin: '0 0 12px',
        lineHeight: 1.1,
      }}>
        Bienvenue sur Bailio !
      </h1>

      {/* Subtitle */}
      <p style={{
        fontFamily: BAI.fontBody,
        fontSize: 15,
        color: 'rgba(255,255,255,0.55)',
        margin: '0 0 36px',
        lineHeight: 1.6,
      }}>
        {isTenant
          ? 'Trouvons ton prochain logement.'
          : 'Gérez votre bien en toute sérénité.'}
      </p>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        <div>
          <label style={labelStyle}>Prénom</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="Marie"
            value={firstName}
            onChange={e => onFirstName(e.target.value)}
            autoComplete="given-name"
            onFocus={e => { e.currentTarget.style.borderColor = BAI.caramel }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
          />
        </div>
        <div>
          <label style={labelStyle}>Nom de famille</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="Martin"
            value={lastName}
            onChange={e => onLastName(e.target.value)}
            autoComplete="family-name"
            onFocus={e => { e.currentTarget.style.borderColor = BAI.caramel }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
          />
        </div>
      </div>

      {/* CTA */}
      <NextButton label="Suivant" onNext={onNext} />
    </div>
  )
}

// ── Step 2 — Location ──────────────────────────────────────────────────────────

interface StepLocationProps {
  isTenant: boolean
  city: string
  onCity: (v: string) => void
  onNext: () => void
  onBack: () => void
}

function StepLocation({ isTenant, city, onCity, onNext, onBack }: StepLocationProps) {
  return (
    <div>
      <p style={{
        fontFamily: BAI.fontBody,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: BAI.caramel,
        margin: '0 0 12px',
      }}>
        Localisation
      </p>

      <h2 style={{
        fontFamily: BAI.fontDisplay,
        fontSize: 'clamp(26px, 5vw, 38px)',
        fontWeight: 700,
        fontStyle: 'italic',
        color: '#ffffff',
        margin: '0 0 8px',
        lineHeight: 1.15,
      }}>
        {isTenant ? 'Où habites-tu actuellement ?' : 'Dans quelle ville se situe votre bien ?'}
      </h2>

      <p style={{
        fontFamily: BAI.fontBody,
        fontSize: 14,
        color: 'rgba(255,255,255,0.45)',
        margin: '0 0 32px',
      }}>
        {isTenant
          ? 'On t\'affichera les biens près de chez toi.'
          : 'Cela permettra de classer votre bien dans la bonne zone.'}
      </p>

      <div style={{ marginBottom: 32 }}>
        <label style={labelStyle}>Ville</label>
        <div style={{ position: 'relative' }}>
          <MapPin
            size={16}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.40)',
              pointerEvents: 'none',
            }}
          />
          <input
            style={inputWithIconStyle}
            type="text"
            placeholder={isTenant ? 'Paris, Lyon, Bordeaux…' : 'Paris, Lyon, Marseille…'}
            value={city}
            onChange={e => onCity(e.target.value)}
            autoComplete="address-level2"
            onFocus={e => { e.currentTarget.style.borderColor = BAI.caramel }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <BackButton onBack={onBack} />
        <NextButton label="Suivant" onNext={onNext} />
      </div>
    </div>
  )
}

// ── Step 3 — Tour ──────────────────────────────────────────────────────────────

interface StepTourProps {
  isTenant: boolean
  features: FeatureCard[]
  onNext: () => void
  onBack: () => void
}

function StepTour({ isTenant, features, onNext, onBack }: StepTourProps) {
  return (
    <div>
      <p style={{
        fontFamily: BAI.fontBody,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: BAI.caramel,
        margin: '0 0 12px',
      }}>
        Tour de la plateforme
      </p>

      <h2 style={{
        fontFamily: BAI.fontDisplay,
        fontSize: 'clamp(24px, 4.5vw, 36px)',
        fontWeight: 700,
        fontStyle: 'italic',
        color: '#ffffff',
        margin: '0 0 6px',
        lineHeight: 1.15,
      }}>
        Voici ce que vous pouvez faire avec Bailio
      </h2>

      <p style={{
        fontFamily: BAI.fontBody,
        fontSize: 14,
        color: 'rgba(255,255,255,0.40)',
        margin: '0 0 24px',
      }}>
        {isTenant ? 'Tout ce dont tu as besoin pour trouver ton logement.' : 'Tout ce dont vous avez besoin pour gérer vos biens.'}
      </p>

      {/* Feature cards with stagger */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {features.map((feat, i) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.25, ease: 'easeOut' }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <feat.icon size={18} style={{ color: BAI.caramel }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                margin: '0 0 2px',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: BAI.fontBody,
                color: '#ffffff',
              }}>
                {feat.title}
              </p>
              <p style={{
                margin: 0,
                fontSize: 12,
                fontFamily: BAI.fontBody,
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.4,
              }}>
                {feat.description}
              </p>
            </div>
            <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <BackButton onBack={onBack} />
        <NextButton label="Suivant" onNext={onNext} />
      </div>
    </div>
  )
}

// ── Step 4 — CTA ───────────────────────────────────────────────────────────────

interface StepCTAProps {
  isTenant: boolean
  firstName: string
  isSubmitting: boolean
  onFinish: () => void
  onBack: () => void
}

function StepCTA({ isTenant, firstName, isSubmitting, onFinish, onBack }: StepCTAProps) {
  const displayName = firstName.trim() ? firstName.trim() : null

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Emoji / icon circle */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 14 }}
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: `${BAI.caramel}22`,
          border: `2px solid ${BAI.caramel}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}
      >
        <span style={{ fontSize: 32 }} role="img" aria-label="partying face">
          {isTenant ? '🏠' : '🔑'}
        </span>
      </motion.div>

      <p style={{
        fontFamily: BAI.fontBody,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: BAI.caramel,
        margin: '0 0 10px',
      }}>
        C'est parti !
      </p>

      <h2 style={{
        fontFamily: BAI.fontDisplay,
        fontSize: 'clamp(28px, 5vw, 40px)',
        fontWeight: 700,
        fontStyle: 'italic',
        color: '#ffffff',
        margin: '0 0 14px',
        lineHeight: 1.1,
      }}>
        {displayName ? `${displayName}, tu es prêt${isTenant ? '(e)' : ''} !` : (isTenant ? 'Tu es prêt(e) !' : 'Vous êtes prêt(e) !')}
      </h2>

      <p style={{
        fontFamily: BAI.fontBody,
        fontSize: 15,
        color: 'rgba(255,255,255,0.50)',
        margin: '0 0 36px',
        lineHeight: 1.65,
      }}>
        {isTenant
          ? 'Ton dossier, tes candidatures et tes visites sont à portée de main.'
          : 'Vos annonces, vos locataires et vos contrats sont centralisés ici.'}
      </p>

      <button
        onClick={onFinish}
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: '14px 24px',
          borderRadius: 12,
          background: BAI.caramel,
          border: 'none',
          color: '#ffffff',
          fontSize: 15,
          fontFamily: BAI.fontBody,
          fontWeight: 700,
          cursor: isSubmitting ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 50,
          opacity: isSubmitting ? 0.7 : 1,
          transition: 'opacity 0.15s, transform 0.1s',
          marginBottom: 16,
        }}
        onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88' }}
        onMouseLeave={e => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
      >
        {isSubmitting ? (
          'Sauvegarde…'
        ) : (
          <>
            {isTenant ? 'Commencer la recherche' : 'Ajouter mon premier bien'}
            <ChevronRight size={17} />
          </>
        )}
      </button>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <BackButton onBack={onBack} />
      </div>
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function NextButton({ label, onNext }: { label: string; onNext: () => void }) {
  return (
    <button
      onClick={onNext}
      style={{
        flex: 1,
        padding: '13px 20px',
        borderRadius: 10,
        background: BAI.caramel,
        border: 'none',
        color: '#ffffff',
        fontSize: 14,
        fontFamily: BAI.fontBody,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 46,
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
    >
      {label}
      <ChevronRight size={15} />
    </button>
  )
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      style={{
        padding: '13px 18px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.55)',
        fontSize: 14,
        fontFamily: BAI.fontBody,
        fontWeight: 500,
        cursor: 'pointer',
        minHeight: 46,
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        const btn = e.currentTarget as HTMLButtonElement
        btn.style.background = 'rgba(255,255,255,0.10)'
        btn.style.color = 'rgba(255,255,255,0.80)'
      }}
      onMouseLeave={e => {
        const btn = e.currentTarget as HTMLButtonElement
        btn.style.background = 'rgba(255,255,255,0.06)'
        btn.style.color = 'rgba(255,255,255,0.55)'
      }}
    >
      ← Retour
    </button>
  )
}
