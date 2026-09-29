import { forwardRef, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'

export const display = (size: number | string, extra: CSSProperties = {}): CSSProperties => ({
  margin: 0,
  fontFamily: BAI.fontDisplay,
  fontStyle: 'italic',
  fontWeight: 700,
  fontSize: size,
  lineHeight: 1.02,
  color: BAI.ink,
  ...extra,
})

export const overline: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: BAI.caramelInk,
}

type Variant = 'primary' | 'dark' | 'outline' | 'light' | 'caramel' | 'ghost'

const variants: Record<Variant, CSSProperties> = {
  primary: { background: BAI.owner, color: BAI.surface, border: `1.5px solid ${BAI.owner}` },
  dark: { background: BAI.night, color: BAI.surface, border: `1.5px solid ${BAI.night}` },
  outline: { background: 'transparent', color: BAI.owner, border: `1.5px solid ${BAI.ownerBorder}` },
  light: { background: BAI.surface, color: BAI.ink, border: `1.5px solid ${BAI.borderStrong}` },
  caramel: { background: BAI.caramel, color: BAI.night, border: `1.5px solid ${BAI.caramel}` },
  ghost: { background: 'transparent', color: BAI.owner, border: '1.5px solid transparent', padding: '0 4px' },
}

interface ButtonStyleOptions {
  variant?: Variant
  height?: number
  full?: boolean
}

export function buttonStyle({ variant = 'primary', height = 60, full = false }: ButtonStyleOptions = {}): CSSProperties {
  return {
    height,
    padding: '0 32px',
    borderRadius: 14,
    fontWeight: 600,
    fontSize: height >= 60 ? 17 : 16,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    width: full ? '100%' : undefined,
    ...variants[variant],
  }
}

export function Button({
  children,
  variant,
  height,
  full,
  loading,
  disabled,
  type = 'button',
  onClick,
  style,
}: ButtonStyleOptions & { children: ReactNode; loading?: boolean; disabled?: boolean; type?: 'button' | 'submit'; onClick?: () => void; style?: CSSProperties }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={{ ...buttonStyle({ variant, height, full }), opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {loading ? <Spinner color="currentColor" /> : null}
      {children}
    </button>
  )
}

export function ButtonLink({ to, children, variant, height, full, style }: ButtonStyleOptions & { to: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <Link to={to} style={{ ...buttonStyle({ variant, height, full }), ...style }}>
      {children}
    </Link>
  )
}

export function Spinner({ size = 18, color = BAI.owner }: { size?: number; color?: string }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}`, borderTopColor: 'transparent', display: 'inline-block', animation: 'bailio-spin 0.7s linear infinite', opacity: 0.8 }}
    />
  )
}

export const inputStyle = (invalid = false): CSSProperties => ({
  height: 60,
  width: '100%',
  border: `1.5px solid ${invalid ? BAI.error : BAI.borderStrong}`,
  borderRadius: 14,
  padding: '0 18px',
  fontSize: 18,
  background: BAI.surface,
  color: BAI.ink,
})

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: ReactNode
  error?: string
  suffix?: string
}

export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField({ label, hint, error, suffix, id, style, ...rest }, ref) {
  const inputId = id ?? rest.name
  return (
    <div className="stack" style={{ gap: 8, flex: '1 1 0', minWidth: 0, ...style }}>
      <label htmlFor={inputId} style={{ fontSize: 15, fontWeight: 600 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          style={{ ...inputStyle(Boolean(error)), paddingRight: suffix ? 52 : 18 }}
          {...rest}
        />
        {suffix ? (
          <span aria-hidden style={{ position: 'absolute', right: 18, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontSize: 18, color: BAI.inkSoft }}>
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <span id={`${inputId}-error`} role="alert" style={{ fontSize: 14, color: BAI.error }}>
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} style={{ fontSize: 14, color: BAI.inkSoft }}>
          {hint}
        </span>
      ) : null}
    </div>
  )
})

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'success' | 'warning'; children: ReactNode }) {
  const palette = {
    info: { bg: BAI.ownerLight, border: BAI.ownerBorder, color: BAI.ink },
    success: { bg: BAI.greenLight, border: BAI.greenLight, color: BAI.ink },
    warning: { bg: BAI.errorLight, border: BAI.error, color: BAI.ink },
  }[tone]
  return (
    <div role={tone === 'warning' ? 'alert' : undefined} style={{ background: palette.bg, border: `1px solid ${palette.border}`, color: palette.color, borderRadius: 16, padding: '16px 20px', fontSize: 15, lineHeight: 1.5 }}>
      {children}
    </div>
  )
}
