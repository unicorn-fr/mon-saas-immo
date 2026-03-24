/**
 * OnboardingModal — Guide de bienvenue personnalisé par rôle
 * Affiché une seule fois (localStorage) au premier accès au dashboard.
 */
import { useState, useEffect } from 'react'
import {
  X, Home, FileText, Search,
  AlertTriangle, CheckCircle, ChevronRight, ChevronLeft,
  Star, Users, Lock,
} from 'lucide-react'

const M = {
  bg:         '#fafaf8',
  surface:    '#ffffff',
  muted:      '#f4f2ee',
  ink:        '#0d0c0a',
  inkMid:     '#5a5754',
  inkFaint:   '#9e9b96',
  night:      '#1a1a2e',
  owner:      '#1a3270',
  ownerL:     '#eaf0fb',
  ownerB:     '#b8ccf0',
  tenant:     '#1b5e3b',
  tenantL:    '#edf7f2',
  tenantB:    '#9fd4ba',
  caramel:    '#c4976a',
  caramelL:   '#fdf5ec',
  border:     '#e4e1db',
  danger:     '#9b1c1c',
  dangerBg:   '#fef2f2',
  dangerB:    '#fca5a5',
  body:       "'DM Sans', system-ui, sans-serif",
  display:    "'Cormorant Garamond', Georgia, serif",
}

interface Step {
  icon: React.ReactNode
  title: string
  subtitle?: string
  body: React.ReactNode
}

function ownerSteps(): Step[] {
  return [
    {
      icon: <Star style={{ width: 28, height: 28, color: M.caramel }} />,
      title: 'Bienvenue sur Bailio',
      subtitle: 'La plateforme de mise en relation locative',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: M.inkMid, fontFamily: M.body, lineHeight: 1.6, margin: 0 }}>
            Bailio vous permet de <strong style={{ color: M.ink }}>publier vos biens</strong>, filtrer les candidatures et gérer vos locations en toute sérénité.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Publiez une annonce en moins de 5 minutes',
              'Recevez et filtrez les dossiers locataires',
              'Signez les contrats électroniquement',
              'Centralisez tous vos documents',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle style={{ width: 15, height: 15, color: M.caramel, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: M.inkMid, fontFamily: M.body }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: <Home style={{ width: 28, height: 28, color: M.owner }} />,
      title: 'Publier une annonce',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 14, color: M.inkMid, fontFamily: M.body, lineHeight: 1.6, margin: 0 }}>
            Depuis votre tableau de bord, cliquez sur <strong style={{ color: M.ink }}>"Nouveau bien"</strong> pour ajouter votre propriété avec photos, description et critères de location.
          </p>
          <div style={{ background: M.ownerL, border: `1px solid ${M.ownerB}`, borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 12, color: M.owner, fontFamily: M.body, margin: 0, fontWeight: 600 }}>
              Conseil
            </p>
            <p style={{ fontSize: 12, color: M.owner, fontFamily: M.body, margin: '4px 0 0 0', opacity: 0.85 }}>
              Ajoutez au moins 5 photos de qualité pour multiplier les candidatures par 3.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: <Users style={{ width: 28, height: 28, color: M.owner }} />,
      title: 'Gérer les candidatures',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 14, color: M.inkMid, fontFamily: M.body, lineHeight: 1.6, margin: 0 }}>
            Chaque candidat vous soumet un <strong style={{ color: M.ink }}>dossier locataire complet</strong> (pièce d'identité, justificatifs de revenus, garanties). Consultez-les en toute sécurité.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Score de solvabilité automatique par l\'IA',
              'Visualisation sécurisée des documents (filigrane)',
              'Messagerie intégrée avec chaque candidat',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: M.owner, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: M.inkMid, fontFamily: M.body }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: <AlertTriangle style={{ width: 28, height: 28, color: M.danger }} />,
      title: 'Charte de bonne conduite',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 14, color: M.inkMid, fontFamily: M.body, lineHeight: 1.6, margin: 0 }}>
            Bailio repose sur la <strong style={{ color: M.ink }}>confiance mutuelle</strong> entre propriétaires et locataires. Nous exigeons honnêteté et bienveillance de tous.
          </p>
          <div style={{ background: M.dangerBg, border: `1px solid ${M.dangerB}`, borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12 }}>
            <AlertTriangle style={{ width: 18, height: 18, color: M.danger, flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: M.danger, fontFamily: M.body, margin: '0 0 4px 0' }}>
                Avertissement strict
              </p>
              <p style={{ fontSize: 12, color: M.danger, fontFamily: M.body, margin: 0, lineHeight: 1.6 }}>
                Toute tentative d'arnaque, d'usurpation d'identité ou de demande de paiement hors plateforme entraînera un <strong>bannissement définitif</strong> et un signalement aux autorités compétentes.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ]
}

function tenantSteps(): Step[] {
  return [
    {
      icon: <Star style={{ width: 28, height: 28, color: M.caramel }} />,
      title: 'Bienvenue sur Bailio',
      subtitle: 'Trouvez votre logement en toute confiance',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: M.inkMid, fontFamily: M.body, lineHeight: 1.6, margin: 0 }}>
            Bailio vous met en relation directe avec des propriétaires sérieux. Préparez votre dossier une fois et postulez à autant d'annonces que vous souhaitez.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Dossier locataire centralisé et sécurisé',
              'Candidatures illimitées en un clic',
              'Suivi en temps réel de vos demandes',
              'Messagerie directe avec les propriétaires',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle style={{ width: 15, height: 15, color: M.caramel, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: M.inkMid, fontFamily: M.body }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: <FileText style={{ width: 28, height: 28, color: M.tenant }} />,
      title: 'Préparez votre dossier',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 14, color: M.inkMid, fontFamily: M.body, lineHeight: 1.6, margin: 0 }}>
            Depuis <strong style={{ color: M.ink }}>"Mon Dossier"</strong> dans le menu, téléversez vos documents une seule fois : pièce d'identité, bulletins de salaire, avis d'imposition.
          </p>
          <div style={{ background: M.tenantL, border: `1px solid ${M.tenantB}`, borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 12, color: M.tenant, fontFamily: M.body, margin: 0, fontWeight: 600 }}>
              Conseil
            </p>
            <p style={{ fontSize: 12, color: M.tenant, fontFamily: M.body, margin: '4px 0 0 0', opacity: 0.85 }}>
              Un dossier complet augmente vos chances d'acceptation de 70%. Ajoutez vos 3 derniers bulletins de salaire.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: <Search style={{ width: 28, height: 28, color: M.tenant }} />,
      title: 'Postuler à une annonce',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 14, color: M.inkMid, fontFamily: M.body, lineHeight: 1.6, margin: 0 }}>
            Parcourez les annonces et cliquez sur <strong style={{ color: M.ink }}>"Candidater"</strong>. Votre dossier est transmis automatiquement. Vous pouvez suivre l'état de chaque candidature depuis votre tableau de bord.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Candidature envoyée en 1 clic',
              'Statut : En attente → Accepté / Refusé',
              'Notification email à chaque changement',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: M.tenant, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: M.inkMid, fontFamily: M.body }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: <AlertTriangle style={{ width: 28, height: 28, color: M.danger }} />,
      title: 'Charte de bonne conduite',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 14, color: M.inkMid, fontFamily: M.body, lineHeight: 1.6, margin: 0 }}>
            Bailio repose sur la <strong style={{ color: M.ink }}>confiance mutuelle</strong>. Vos documents sont vérifiés et votre identité doit être réelle.
          </p>
          <div style={{ background: M.dangerBg, border: `1px solid ${M.dangerB}`, borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12 }}>
            <AlertTriangle style={{ width: 18, height: 18, color: M.danger, flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: M.danger, fontFamily: M.body, margin: '0 0 4px 0' }}>
                Avertissement strict
              </p>
              <p style={{ fontSize: 12, color: M.danger, fontFamily: M.body, margin: 0, lineHeight: 1.6 }}>
                Toute tentative d'arnaque, d'usurpation d'identité ou de fraude documentaire entraînera un <strong>bannissement définitif</strong> et un signalement aux autorités compétentes.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ]
}

interface OnboardingModalProps {
  userId: string
  role: 'OWNER' | 'TENANT'
  onClose: () => void
}

export function OnboardingModal({ userId, role, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const [closing, setClosing] = useState(false)

  const steps = role === 'OWNER' ? ownerSteps() : tenantSteps()
  const current = steps[step]
  const isLast = step === steps.length - 1
  const accent = role === 'OWNER' ? M.owner : M.tenant
  const accentL = role === 'OWNER' ? M.ownerL : M.tenantL

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => {
      localStorage.setItem(`bailio_onboarding_v1_${userId}`, '1')
      onClose()
    }, 200)
  }

  const handleNext = () => {
    if (isLast) { handleClose(); return }
    setStep(s => s + 1)
  }

  // Fermeture Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(13,12,10,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        opacity: closing ? 0 : 1,
        transition: 'opacity 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        style={{
          width: '100%', maxWidth: 460,
          background: M.surface,
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(13,12,10,0.18)',
          overflow: 'hidden',
          transform: closing ? 'scale(0.96)' : 'scale(1)',
          transition: 'transform 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{
          background: accent,
          padding: '20px 22px 18px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {current.icon}
            </div>
            <div>
              <p style={{ fontSize: 11, fontFamily: M.body, color: 'rgba(255,255,255,0.6)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                {role === 'OWNER' ? 'Guide Propriétaire' : 'Guide Locataire'} · {step + 1}/{steps.length}
              </p>
              <p style={{ fontSize: 18, fontFamily: M.display, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: '3px 0 0' }}>
                {current.title}
              </p>
              {current.subtitle && (
                <p style={{ fontSize: 12, fontFamily: M.body, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>
                  {current.subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              padding: 6, background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
              display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: accentL }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / steps.length) * 100}%`,
            background: accent,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Body */}
        <div style={{ padding: '22px 22px 18px' }}>
          {current.body}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px 20px',
          borderTop: `1px solid ${M.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? 20 : 7, height: 7,
                  borderRadius: 4,
                  border: 'none', cursor: 'pointer',
                  background: i === step ? accent : M.border,
                  transition: 'all 0.25s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '8px 14px', borderRadius: 8,
                  border: `1px solid ${M.border}`,
                  background: M.surface, color: M.inkMid,
                  fontSize: 13, cursor: 'pointer', fontFamily: M.body,
                }}
              >
                <ChevronLeft style={{ width: 14, height: 14 }} />
                Précédent
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: accent, color: '#ffffff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: M.body,
              }}
            >
              {isLast ? (
                <>
                  <Lock style={{ width: 13, height: 13 }} />
                  J'ai compris, commencer
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook — retourne true si l'onboarding doit être affiché
 */
export function useOnboarding(userId: string | undefined) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!userId) return
    const key = `bailio_onboarding_v1_${userId}`
    if (!localStorage.getItem(key)) {
      // Petit délai pour laisser le dashboard s'afficher d'abord
      const t = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(t)
    }
  }, [userId])

  const dismiss = () => {
    if (userId) localStorage.setItem(`bailio_onboarding_v1_${userId}`, '1')
    setShow(false)
  }

  return { show, dismiss }
}
