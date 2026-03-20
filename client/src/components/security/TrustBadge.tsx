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
    bg: '#f4f2ee',
    border: '#e4e1db',
    text: '#5a5754',
    dot: '#9e9b96',
  },
  basic: {
    label: 'Basique',
    icon: <Shield className="w-3 h-3" />,
    bg: '#fdf5ec',
    border: '#f3c99a',
    text: '#92400e',
    dot: '#c4976a',
  },
  verified: {
    label: 'Vérifié',
    icon: <ShieldCheck className="w-3 h-3" />,
    bg: '#eaf0fb',
    border: '#b8ccf0',
    text: '#1a3270',
    dot: '#1a3270',
  },
  premium: {
    label: 'Premium',
    icon: <Star className="w-3 h-3" />,
    bg: '#edf7f2',
    border: '#9fd4ba',
    text: '#1b5e3b',
    dot: '#1b5e3b',
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
