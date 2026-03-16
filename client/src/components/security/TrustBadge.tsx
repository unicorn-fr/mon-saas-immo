/**
 * TrustBadge — Affiche le niveau de confiance d'un utilisateur (propriétaire).
 *
 * Score  0–29 : Non vérifié (gris)
 * Score 30–59 : Basique       (amber)
 * Score 60–79 : Vérifié       (blue)
 * Score 80–100: Premium       (emerald)
 *
 * Badge supplémentaire si isVerifiedOwner (propriété prouvée).
 */

import { ShieldCheck, ShieldAlert, Shield, Star } from 'lucide-react'

interface TrustBadgeProps {
  trustScore: number
  isVerifiedOwner?: boolean
  isBanned?: boolean
  size?: 'sm' | 'md' | 'lg'
  showScore?: boolean
}

type Tier = 'banned' | 'unverified' | 'basic' | 'verified' | 'premium'

function getTier(score: number, isBanned?: boolean): Tier {
  if (isBanned) return 'banned'
  if (score >= 80) return 'premium'
  if (score >= 60) return 'verified'
  if (score >= 30) return 'basic'
  return 'unverified'
}

const TIER_CONFIG: Record<Tier, {
  label: string
  icon: React.ReactNode
  bg: string
  border: string
  text: string
  dot: string
}> = {
  banned: {
    label: 'Suspendu',
    icon: <ShieldAlert className="w-3 h-3" />,
    bg: '#fef2f2',
    border: '#fecaca',
    text: '#dc2626',
    dot: '#dc2626',
  },
  unverified: {
    label: 'Non vérifié',
    icon: <Shield className="w-3 h-3" />,
    bg: '#f8fafc',
    border: '#e2e8f0',
    text: '#64748b',
    dot: '#94a3b8',
  },
  basic: {
    label: 'Basique',
    icon: <Shield className="w-3 h-3" />,
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#b45309',
    dot: '#f59e0b',
  },
  verified: {
    label: 'Vérifié',
    icon: <ShieldCheck className="w-3 h-3" />,
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1d4ed8',
    dot: '#3b82f6',
  },
  premium: {
    label: 'Premium',
    icon: <Star className="w-3 h-3" />,
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#065f46',
    dot: '#10b981',
  },
}

const SIZE = {
  sm: { text: '10px', px: '6px', py: '2px', gap: '4px', iconSize: '10px' },
  md: { text: '11px', px: '8px', py: '3px', gap: '5px', iconSize: '12px' },
  lg: { text: '12px', px: '10px', py: '4px', gap: '6px', iconSize: '14px' },
}

export function TrustBadge({
  trustScore,
  isVerifiedOwner = false,
  isBanned = false,
  size = 'md',
  showScore = false,
}: TrustBadgeProps) {
  const tier = getTier(trustScore, isBanned)
  const cfg = TIER_CONFIG[tier]
  const sz = SIZE[size]

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {/* Main badge */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: sz.gap,
          padding: `${sz.py} ${sz.px}`,
          borderRadius: '999px',
          border: `1px solid ${cfg.border}`,
          background: cfg.bg,
          color: cfg.text,
          fontSize: sz.text,
          fontWeight: 600,
          lineHeight: 1,
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: cfg.dot,
            flexShrink: 0,
          }}
        />
        {cfg.icon}
        {cfg.label}
        {showScore && (
          <span style={{ opacity: 0.7 }}>— {trustScore}/100</span>
        )}
      </span>

      {/* "Propriété vérifiée" extra chip */}
      {isVerifiedOwner && !isBanned && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: `${sz.py} ${sz.px}`,
            borderRadius: '999px',
            border: '1px solid #a7f3d0',
            background: '#ecfdf5',
            color: '#065f46',
            fontSize: sz.text,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          <ShieldCheck style={{ width: sz.iconSize, height: sz.iconSize }} />
          Propriété vérifiée
        </span>
      )}
    </span>
  )
}
