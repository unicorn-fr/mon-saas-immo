/**
 * BailioLogo — icône carrée #1a1a2e · "B" italic Cormorant · barre caramel
 * variant="onDark" : fond blanc crème, B navy (pour panneaux sombres)
 */
interface Props {
  size?: number
  variant?: 'default' | 'onDark'
  style?: React.CSSProperties
}

export function BailioLogo({ size = 36, variant = 'default', style }: Props) {
  const bgColor  = variant === 'onDark' ? 'rgba(255,255,255,0.92)' : '#1a1a2e'
  const bColor   = variant === 'onDark' ? '#1a1a2e' : '#ffffff'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, ...style }}
    >
      <rect width="40" height="40" rx="8" fill={bgColor} />
      <text
        x="20"
        y="28"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="26"
        fontWeight="700"
        fontStyle="italic"
        fill={bColor}
        textAnchor="middle"
      >
        B
      </text>
      <rect x="13" y="32.5" width="14" height="2.5" rx="1.25" fill="#c4976a" />
    </svg>
  )
}
