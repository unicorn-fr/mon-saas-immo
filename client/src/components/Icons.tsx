import { BAI } from '../constants/bailio-tokens'

interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
}

const base = (size: number, color: string, sw: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: sw,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  style: { flexShrink: 0 },
})

export const Check = ({ size = 16, color = BAI.green, strokeWidth = 2.4 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M20 6 9 17l-5-5" /></svg>
)
export const Cross = ({ size = 18, color = BAI.error, strokeWidth = 2.4 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M6 6l12 12M18 6 6 18" /></svg>
)
export const Pin = ({ size = 22, color = BAI.inkSoft, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
)
export const DocIcon = ({ size = 32, color = BAI.owner, strokeWidth = 1.7 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4" /><path d="M9 13h6M9 17h4" /></svg>
)
export const EuroIcon = ({ size = 32, color = BAI.owner, strokeWidth = 1.7 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M17 6.5A7 7 0 1 0 17 17.5" /><path d="M4 10h9M4 14h9" /></svg>
)
export const Bell = ({ size = 32, color = BAI.owner, strokeWidth = 1.7 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
)
export const Camera = ({ size = 32, color = BAI.owner, strokeWidth = 1.7 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
)
export const House = ({ size = 56, color = BAI.owner, strokeWidth = 1.4 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M3 21h18" /><path d="M5 21V8l7-5 7 5v13" /><path d="M10 21v-5h4v5" /></svg>
)
export const Sofa = ({ size = 56, color = BAI.owner, strokeWidth = 1.4 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M4 18v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" /><path d="M2 18h20v2H2z" /><path d="M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" /></svg>
)
export const Upload = ({ size = 28, color = BAI.owner, strokeWidth = 1.7 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v4h16v-4" /></svg>
)
export const Google = ({ size = 20, color = BAI.ink }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2" />
    <path d="M12 12h8" stroke={color} strokeWidth="2" />
  </svg>
)
