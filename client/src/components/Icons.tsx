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
export const Plus = ({ size = 18, color = 'currentColor', strokeWidth = 2.2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M12 5v14M5 12h14" /></svg>
)
export const Sun = ({ size = 22, color = 'currentColor', strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /></svg>
)
export const Home = ({ size = 22, color = 'currentColor', strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /></svg>
)
export const Page = ({ size = 22, color = 'currentColor', strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4" /></svg>
)
export const Euro = ({ size = 22, color = 'currentColor', strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M17 6.5A7 7 0 1 0 17 17.5" /><path d="M4 10h9M4 14h9" /></svg>
)
export const People = ({ size = 22, color = 'currentColor', strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></svg>
)
export const Close = ({ size = 18, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M6 6l12 12M18 6 6 18" /></svg>
)
export const ChevronRight = ({ size = 18, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="m9 6 6 6-6 6" /></svg>
)
export const ArrowLeft = ({ size = 18, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
)
export const Printer = ({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M6 9V3h12v6" /><path d="M6 18H4v-7h16v7h-2" /><path d="M6 14h12v7H6z" /></svg>
)
export const Download = ({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M4 20h16" /></svg>
)
export const Mail = ({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M3 6h18v12H3z" /><path d="m3 7 9 6 9-6" /></svg>
)
export const Pencil = ({ size = 20, color = 'currentColor', strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><path d="M4 20h4L20 8l-4-4L4 16z" /></svg>
)
export const Circle = ({ size = 18, color = BAI.dashed, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, color, strokeWidth)}><circle cx="12" cy="12" r="8" /></svg>
)
