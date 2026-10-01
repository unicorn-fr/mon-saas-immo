import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { ApiError } from '../lib/api'
import { centsToInput, parseEuros } from '../lib/format'
import { Spinner, display } from './ui'

/**
 * Composants de l'espace propriétaire, repris de la maquette : cartes blanches à bord crème,
 * étiquettes arrondies, boutons de 44 à 60 px, champs de 50 px, encadrés d'information.
 */

// ── Mise en page ─────────────────────────────────────────────────────────────

export function Card({ title, action, children, style, dark, pad = 24, id }: { title?: ReactNode; action?: ReactNode; children?: ReactNode; style?: CSSProperties; dark?: boolean; pad?: number; id?: string }) {
  return (
    <section
      id={id}
      style={{
        background: dark ? BAI.night : BAI.surface,
        border: dark ? 'none' : `1px solid ${BAI.divider}`,
        color: dark ? BAI.surface : BAI.ink,
        borderRadius: 20,
        padding: `clamp(18px, 3vw, ${pad}px)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        minWidth: 0,
        ...style,
      }}
    >
      {title || action ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          {typeof title === 'string' ? (
            dark ? <h2 style={display(26, { color: BAI.surface })}>{title}</h2> : <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h2>
          ) : (
            title
          )}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function PageHead({ title, sub, actions, over }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; over?: ReactNode }) {
  return (
    <div className="col-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        {over ? <span style={{ fontSize: 15, color: BAI.inkSoft }}>{over}</span> : null}
        <h1 style={display('clamp(38px, 5vw, 52px)', { overflowWrap: 'anywhere' })}>{title}</h1>
        {sub ? <span style={{ fontSize: 16, color: BAI.inkMid }}>{sub}</span> : null}
      </div>
      {actions ? (
        <div className="wrap-md" style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export function Crumbs({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav aria-label="Fil d'Ariane" style={{ fontSize: 14, color: BAI.inkSoft, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', gap: 6 }}>
          {i > 0 ? <span aria-hidden>/</span> : null}
          {it.to ? (
            <Link to={it.to} style={{ textDecoration: 'none', fontWeight: 600 }}>
              {it.label}
            </Link>
          ) : (
            <span>{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

/** Ligne « intitulé … valeur ». */
export function Line({ label, value, tone, dark, strong, border }: { label: ReactNode; value: ReactNode; tone?: 'green' | 'error' | 'caramel'; dark?: boolean; strong?: boolean; border?: boolean }) {
  const color = tone === 'green' ? BAI.green : tone === 'error' ? BAI.error : tone === 'caramel' ? BAI.caramel : dark ? BAI.surface : BAI.ink
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 15, ...(border ? { borderTop: `1px solid ${dark ? BAI.nightLine : BAI.dividerSoft}`, paddingTop: 12 } : {}) }}>
      <span style={{ color: dark ? BAI.onDarkMuted : BAI.inkSoft }}>{label}</span>
      <span style={{ fontWeight: strong ? 700 : 600, color, textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</span>
    </div>
  )
}

export type Tone = 'error' | 'owner' | 'caramel' | 'green' | 'ink' | 'muted'

const PILL: Record<Tone, { color: string; bg: string }> = {
  error: { color: BAI.error, bg: BAI.errorTint },
  owner: { color: BAI.owner, bg: BAI.ownerTint },
  caramel: { color: BAI.caramelDark, bg: BAI.caramelLight },
  green: { color: BAI.green, bg: BAI.greenLight },
  ink: { color: BAI.ink, bg: BAI.inkTint },
  muted: { color: BAI.inkSoft, bg: BAI.dividerSoft },
}

export function Pill({ tone = 'owner', children, style }: { tone?: Tone; children: ReactNode; style?: CSSProperties }) {
  const p = PILL[tone]
  return <span style={{ fontSize: 12, fontWeight: 700, color: p.color, background: p.bg, padding: '5px 10px', borderRadius: 999, whiteSpace: 'nowrap', alignSelf: 'flex-start', ...style }}>{children}</span>
}

export const toneColor = (tone: string | undefined) => (tone === 'green' ? BAI.green : tone === 'error' ? BAI.error : tone === 'caramel' ? BAI.caramelInk : tone === 'owner' ? BAI.owner : BAI.inkSoft)

export function Avatar({ text, size = 40, dark }: { text: string; size?: number; dark?: boolean }) {
  return (
    <span aria-hidden style={{ width: size, height: size, borderRadius: size / 2, flexShrink: 0, background: dark ? BAI.nightSoft : BAI.ownerTint, color: dark ? BAI.caramel : BAI.owner, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.36 }}>
      {text}
    </span>
  )
}

export function Progress({ percent, height = 6 }: { percent: number; height?: number }) {
  return (
    <div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} style={{ height, background: BAI.divider, borderRadius: height / 2, display: 'flex', overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, percent))}%`, background: percent >= 100 ? BAI.green : BAI.owner, borderRadius: height / 2, transition: 'width .3s' }} />
    </div>
  )
}

// ── Boutons ──────────────────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'outline' | 'ghost' | 'dark' | 'caramel' | 'danger' | 'light'

const BTN: Record<BtnVariant, CSSProperties> = {
  primary: { background: BAI.owner, color: BAI.surface, border: `1.5px solid ${BAI.owner}` },
  outline: { background: BAI.surface, color: BAI.owner, border: `1.5px solid ${BAI.ownerBorder}` },
  ghost: { background: 'transparent', color: BAI.inkMid, border: '1.5px solid transparent' },
  dark: { background: BAI.night, color: BAI.surface, border: `1.5px solid ${BAI.night}` },
  caramel: { background: BAI.caramel, color: BAI.night, border: `1.5px solid ${BAI.caramel}` },
  danger: { background: BAI.surface, color: BAI.error, border: `1.5px solid ${BAI.errorTint}` },
  light: { background: 'transparent', color: BAI.surface, border: `1.5px solid ${BAI.nightLine}` },
}

interface BtnProps {
  children: ReactNode
  variant?: BtnVariant
  size?: 'sm' | 'md' | 'lg'
  to?: string
  href?: string
  /** Lien externe ou document : ouvert dans un nouvel onglet. */
  newTab?: boolean
  onClick?: () => unknown
  loading?: boolean
  disabled?: boolean
  full?: boolean
  type?: 'button' | 'submit'
  style?: CSSProperties
  title?: string
  icon?: ReactNode
}

export function btnStyle(variant: BtnVariant = 'primary', size: 'sm' | 'md' | 'lg' = 'md', full = false): CSSProperties {
  const dims = size === 'lg' ? { height: 60, padding: '0 32px', borderRadius: 14, fontSize: 17 } : size === 'sm' ? { height: 38, padding: '0 14px', borderRadius: 10, fontSize: 14 } : { minHeight: 46, padding: '10px 18px', borderRadius: 10, fontSize: 15 }
  return {
    ...dims,
    ...BTN[variant],
    fontFamily: 'inherit',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    width: full ? '100%' : undefined,
    boxSizing: 'border-box',
    cursor: 'pointer',
  }
}

/** Bouton ou lien. Une action asynchrone affiche un indicateur et ne peut pas être lancée deux fois. */
export function Btn({ children, variant = 'primary', size = 'md', to, href, newTab, onClick, loading, disabled, full, type = 'button', style, title, icon }: BtnProps) {
  const [busy, setBusy] = useState(false)
  const s = { ...btnStyle(variant, size, full), ...style }
  if (to) {
    return (
      <Link to={to} style={s} title={title}>
        {icon}
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} style={s} title={title} {...(newTab ? { target: '_blank', rel: 'noreferrer' } : {})}>
        {icon}
        {children}
      </a>
    )
  }
  const running = loading || busy
  return (
    <button
      type={type}
      title={title}
      disabled={disabled || running}
      aria-busy={running || undefined}
      onClick={async () => {
        if (!onClick) return
        const r = onClick()
        if (r instanceof Promise) {
          setBusy(true)
          try {
            await r
          } finally {
            setBusy(false)
          }
        }
      }}
      style={{ ...s, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {running ? <Spinner size={16} color="currentColor" /> : icon}
      {children}
    </button>
  )
}

/** Lien texte bleu, gras, sans soulignement. */
export function TextLink({ to, onClick, children, style }: { to?: string; onClick?: () => void; children: ReactNode; style?: CSSProperties }) {
  const s: CSSProperties = { fontSize: 15, fontWeight: 600, color: BAI.owner, textDecoration: 'none', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', ...style }
  return to ? (
    <Link to={to} style={s}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} style={s}>
      {children}
    </button>
  )
}

// ── Encadrés ─────────────────────────────────────────────────────────────────

const CALLOUT = {
  info: { bg: BAI.ownerTint, stroke: BAI.owner, path: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></> },
  tip: { bg: BAI.caramelLight, stroke: BAI.caramelInk, path: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" /></> },
  warn: { bg: BAI.errorTint, stroke: BAI.error, path: <><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></> },
  ok: { bg: BAI.greenLight, stroke: BAI.green, path: <path d="M20 6 9 17l-5-5" /> },
} as const

export function Callout({ tone = 'info', title, children }: { tone?: keyof typeof CALLOUT; title?: ReactNode; children?: ReactNode }) {
  const c = CALLOUT[tone]
  return (
    <div role={tone === 'warn' ? 'note' : undefined} style={{ background: c.bg, borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, color: BAI.ink }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
        {c.path}
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {title ? <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span> : null}
        {children ? <span style={{ fontSize: title ? 13 : 14, color: title ? BAI.inkSoft : BAI.ink }}>{children}</span> : null}
      </div>
    </div>
  )
}

/** Bloc sombre « Calculé par Bailio » : ce que Bailio a déduit, ligne par ligne. */
export function Computed({ title = 'Calculé par Bailio', rows }: { title?: string; rows: Array<[ReactNode, ReactNode]> }) {
  return (
    <div style={{ background: BAI.night, borderRadius: 14, padding: '14px 18px 6px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.caramel, paddingBottom: 8 }}>{title}</div>
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '9px 0', borderTop: `1px solid ${BAI.nightLine}`, fontSize: 14 }}>
          <span style={{ color: BAI.onDarkMuted }}>{k}</span>
          <span style={{ color: BAI.surface, fontWeight: 600, textAlign: 'right' }}>{v}</span>
        </div>
      ))}
    </div>
  )
}

/** Encadré « Bailio sait déjà » des parcours pas à pas. */
export function Known({ title = 'Bailio sait déjà', items }: { title?: string; items: ReactNode[] }) {
  if (!items.length) return null
  return (
    <div style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {title ? <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.caramelInk }}>{title}</span> : null}
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, lineHeight: 1.45 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BAI.green} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span>{it}</span>
        </div>
      ))}
    </div>
  )
}

// ── Champs ───────────────────────────────────────────────────────────────────

export const fieldStyle = (big = false, invalid = false): CSSProperties => ({
  height: big ? 58 : 50,
  boxSizing: 'border-box',
  border: `1.5px solid ${invalid ? BAI.error : BAI.borderStrong}`,
  borderRadius: big ? 14 : 12,
  padding: big ? '0 18px' : '0 14px',
  fontFamily: 'inherit',
  fontSize: big ? 17 : 16,
  background: BAI.surface,
  color: BAI.ink,
  width: '100%',
  minWidth: 0,
})

interface FieldShell {
  label: ReactNode
  hint?: ReactNode
  error?: string | null
  big?: boolean
  style?: CSSProperties
}

function Shell({ label, hint, error, big, style, id, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 0', minWidth: 0, ...style }}>
      <label htmlFor={id} style={{ fontSize: big ? 15 : 14, fontWeight: 600 }}>
        {label}
      </label>
      {children}
      {error ? (
        <span role="alert" style={{ fontSize: 13, color: BAI.error }}>
          {error}
        </span>
      ) : hint ? (
        <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>{hint}</span>
      ) : null}
    </div>
  )
}

export function Input({ label, hint, error, big, style, value, onChange, type = 'text', placeholder, suffix, autoComplete, inputMode, maxLength, disabled, onBlur, autoFocus, list }: FieldShell & { value: string | number | null | undefined; onChange: (v: string) => void; type?: string; placeholder?: string; suffix?: string; autoComplete?: string; inputMode?: 'numeric' | 'decimal' | 'email' | 'tel' | 'text'; maxLength?: number; disabled?: boolean; onBlur?: () => void; autoFocus?: boolean; list?: string }) {
  const id = useId()
  return (
    <Shell id={id} label={label} hint={hint} error={error} big={big} style={style}>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={type}
          value={value ?? ''}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          disabled={disabled}
          autoFocus={autoFocus}
          list={list}
          aria-invalid={Boolean(error) || undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          style={{ ...fieldStyle(big, Boolean(error)), paddingRight: suffix ? 44 : undefined, opacity: disabled ? 0.6 : 1 }}
        />
        {suffix ? <span aria-hidden style={{ position: 'absolute', right: 14, top: 0, bottom: 0, display: 'flex', alignItems: 'center', color: BAI.inkSoft, fontSize: 16 }}>{suffix}</span> : null}
      </div>
    </Shell>
  )
}

/** Montant en euros, stocké en centimes. */
export function Money({ label, hint, error, big, style, cents, onChange, placeholder }: FieldShell & { cents: number | null | undefined; onChange: (c: number | null) => void; placeholder?: string }) {
  const [text, setText] = useState(cents === null || cents === undefined ? '' : centsToInput(cents))
  const last = useRef(cents)
  useEffect(() => {
    if (cents !== last.current) {
      last.current = cents
      setText(cents === null || cents === undefined ? '' : centsToInput(cents))
    }
  }, [cents])
  return (
    <Input
      label={label}
      hint={hint}
      error={error}
      big={big}
      style={style}
      value={text}
      inputMode="decimal"
      suffix="€"
      placeholder={placeholder}
      onChange={(v) => {
        setText(v)
        const c = parseEuros(v) ?? null
        last.current = c
        onChange(c)
      }}
    />
  )
}

export function NumberField({ label, hint, error, big, style, value, onChange, suffix, step }: FieldShell & { value: number | null | undefined; onChange: (n: number | null) => void; suffix?: string; step?: 'int' | 'decimal' }) {
  const [text, setText] = useState(value === null || value === undefined ? '' : String(value).replace('.', ','))
  const last = useRef(value)
  useEffect(() => {
    if (value !== last.current) {
      last.current = value
      setText(value === null || value === undefined ? '' : String(value).replace('.', ','))
    }
  }, [value])
  return (
    <Input
      label={label}
      hint={hint}
      error={error}
      big={big}
      style={style}
      value={text}
      suffix={suffix}
      inputMode={step === 'decimal' ? 'decimal' : 'numeric'}
      onChange={(v) => {
        setText(v)
        const clean = v.replace(/\s/g, '').replace(',', '.')
        const n = clean === '' ? null : Number(clean)
        const out = n === null || !Number.isFinite(n) ? null : step === 'decimal' ? n : Math.round(n)
        last.current = out
        onChange(out)
      }}
    />
  )
}

export function Select<T extends string>({ label, hint, error, big, style, value, onChange, options, placeholder }: FieldShell & { value: T | null | undefined; onChange: (v: T) => void; options: Array<{ value: T; label: string }>; placeholder?: string }) {
  const id = useId()
  return (
    <Shell id={id} label={label} hint={hint} error={error} big={big} style={style}>
      <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value as T)} style={{ ...fieldStyle(big, Boolean(error)), appearance: 'auto' }}>
        {placeholder !== undefined || !value ? <option value="">{placeholder ?? 'Choisir'}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Shell>
  )
}

export function TextArea({ label, hint, error, style, value, onChange, rows = 3, placeholder, maxLength }: FieldShell & { value: string | null | undefined; onChange: (v: string) => void; rows?: number; placeholder?: string; maxLength?: number }) {
  const id = useId()
  return (
    <Shell id={id} label={label} hint={hint} error={error} style={style}>
      <textarea id={id} value={value ?? ''} rows={rows} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} style={{ ...fieldStyle(), height: 'auto', padding: '12px 14px', lineHeight: 1.5, resize: 'vertical' }} />
    </Shell>
  )
}

/** Choix par boutons (un seul, ou plusieurs avec multi). */
export function Chips<T extends string | number | boolean>({ legend, options, value, onChange, big, hint }: { legend?: ReactNode; options: Array<{ value: T; label: ReactNode }>; value: T | null | undefined; onChange: (v: T) => void; big?: boolean; hint?: ReactNode }) {
  return (
    <fieldset style={{ margin: 0, padding: 0, border: 'none', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      {legend ? <legend style={{ fontSize: big ? 15 : 14, fontWeight: 600, padding: 0, marginBottom: 8 }}>{legend}</legend> : null}
      <div style={{ display: 'flex', gap: big ? 10 : 8, flexWrap: 'wrap' }}>
        {options.map((o) => (
          <ChipButton key={String(o.value)} pressed={value === o.value} onClick={() => onChange(o.value)} big={big}>
            {o.label}
          </ChipButton>
        ))}
      </div>
      {hint ? <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>{hint}</span> : null}
    </fieldset>
  )
}

export function MultiChips<T extends string>({ legend, options, value, onChange, hint }: { legend?: ReactNode; options: Array<{ value: T; label: ReactNode }>; value: T[] | null | undefined; onChange: (v: T[]) => void; hint?: ReactNode }) {
  const set = new Set(value ?? [])
  return (
    <fieldset style={{ margin: 0, padding: 0, border: 'none', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      {legend ? <legend style={{ fontSize: 14, fontWeight: 600, padding: 0, marginBottom: 8 }}>{legend}</legend> : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map((o) => (
          <ChipButton
            key={o.value}
            pressed={set.has(o.value)}
            onClick={() => {
              const next = new Set(set)
              if (next.has(o.value)) next.delete(o.value)
              else next.add(o.value)
              onChange(options.map((x) => x.value).filter((v) => next.has(v)))
            }}
          >
            {o.label}
          </ChipButton>
        ))}
      </div>
      {hint ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>{hint}</span> : null}
    </fieldset>
  )
}

export function ChipButton({ pressed, onClick, children, big }: { pressed: boolean; onClick: () => void; children: ReactNode; big?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      style={{
        minHeight: big ? 52 : 44,
        padding: big ? '0 22px' : '0 16px',
        border: pressed ? `2px solid ${BAI.owner}` : `1.5px solid ${BAI.borderStrong}`,
        background: pressed ? BAI.ownerLight : BAI.surface,
        color: pressed ? BAI.owner : BAI.ink,
        fontFamily: 'inherit',
        fontSize: big ? 16 : 15,
        fontWeight: pressed ? 700 : 500,
        borderRadius: big ? 12 : 10,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

/** Grande carte à choisir (parcours pas à pas). */
export function ChoiceCard({ selected, onClick, title, sub, badge, column }: { selected: boolean; onClick: () => void; title: ReactNode; sub?: ReactNode; badge?: ReactNode; column?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      style={{
        textAlign: 'left',
        border: `2px solid ${selected ? BAI.owner : BAI.border}`,
        background: selected ? BAI.ownerLight : BAI.surface,
        borderRadius: 18,
        padding: '20px 22px',
        fontFamily: 'inherit',
        color: BAI.ink,
        display: 'flex',
        flexDirection: column ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: column ? 'flex-start' : 'center',
        gap: column ? 6 : 12,
        cursor: 'pointer',
        width: '100%',
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ fontSize: column ? 20 : 18, fontWeight: 700 }}>{title}</span>
        {sub ? <span style={{ fontSize: column ? 15 : 14, color: BAI.inkMid, lineHeight: 1.45 }}>{sub}</span> : null}
      </span>
      {badge}
    </button>
  )
}

export function Toggle({ checked, onChange, label, sub, disabled, border = true }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; sub?: ReactNode; disabled?: boolean; border?: boolean }) {
  return (
    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, padding: '16px 0', borderTop: border ? `1px solid ${BAI.dividerSoft}` : 'none', opacity: disabled ? 0.55 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{label}</span>
        {sub ? <span style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.45 }}>{sub}</span> : null}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden style={{ width: 52, height: 30, borderRadius: 15, background: checked ? BAI.owner : BAI.borderStrong, display: 'flex', alignItems: 'center', padding: 3, boxSizing: 'border-box', justifyContent: checked ? 'flex-end' : 'flex-start', flexShrink: 0, transition: 'background .15s' }}>
        <span style={{ width: 24, height: 24, borderRadius: 12, background: BAI.surface }} />
      </span>
    </label>
  )
}

export function Check({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; sub?: ReactNode }) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, cursor: 'pointer', lineHeight: 1.4 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2, accentColor: BAI.owner }} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span>{label}</span>
        {sub ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>{sub}</span> : null}
      </span>
    </label>
  )
}

export function Radio({ checked, onChange, label, name }: { checked: boolean; onChange: () => void; label: ReactNode; name: string }) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15, cursor: 'pointer' }}>
      <input type="radio" name={name} checked={checked} onChange={onChange} style={{ width: 18, height: 18, accentColor: BAI.owner }} />
      {label}
    </label>
  )
}

// ── Onglets ──────────────────────────────────────────────────────────────────

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: Array<{ value: T; label: string }>; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="tabs" style={{ display: 'flex', gap: 28, borderBottom: `1px solid ${BAI.border}`, fontSize: 15, overflowX: 'auto' }}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={t.value === value}
          onClick={() => onChange(t.value)}
          style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap', padding: '0 0 12px', color: t.value === value ? BAI.ink : BAI.inkMid, fontWeight: t.value === value ? 700 : 500, borderBottom: `2px solid ${t.value === value ? BAI.ink : 'transparent'}`, marginBottom: -1 }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Filtres en pastilles (Documents). */
export function Filters<T extends string>({ items, value, onChange }: { items: Array<{ value: T; label: string }>; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          aria-pressed={it.value === value}
          onClick={() => onChange(it.value)}
          style={{ border: `1.5px solid ${it.value === value ? BAI.night : BAI.border}`, background: it.value === value ? BAI.night : BAI.surface, color: it.value === value ? BAI.surface : BAI.ink, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, padding: '8px 14px', borderRadius: 999, cursor: 'pointer' }}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

// ── Fenêtre et messages ──────────────────────────────────────────────────────

export function Modal({ open, onClose, title, children, actions, width = 560 }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; actions?: ReactNode; width?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    setTimeout(() => ref.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus(), 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: BAI.overlay, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} style={{ background: BAI.surface, borderRadius: 20, width: '100%', maxWidth: width, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', padding: 'clamp(20px, 4vw, 28px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <h2 style={display(30)}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" style={{ border: 'none', background: 'none', padding: 6, cursor: 'pointer', color: BAI.inkSoft }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {children}
        {actions ? (
          <div className="col-md" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}

interface ToastState {
  show: (message: string, tone?: 'ok' | 'error') => void
  error: (err: unknown) => void
}
const ToastContext = createContext<ToastState | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; tone: 'ok' | 'error'; id: number } | null>(null)
  const show = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => setMsg({ text, tone, id: Date.now() }), [])
  const error = useCallback((err: unknown) => show(errorMessage(err), 'error'), [show])
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), msg.tone === 'error' ? 6000 : 3500)
    return () => clearTimeout(t)
  }, [msg])
  return (
    <ToastContext.Provider value={{ show, error }}>
      {children}
      <div aria-live="polite" className="toast-wrap" style={{ position: 'fixed', left: 16, right: 16, display: 'flex', justifyContent: 'center', zIndex: 60, pointerEvents: 'none' }}>
        {msg ? (
          <div key={msg.id} role={msg.tone === 'error' ? 'alert' : 'status'} style={{ background: msg.tone === 'error' ? BAI.error : BAI.night, color: BAI.surface, padding: '14px 20px', borderRadius: 14, fontSize: 15, fontWeight: 500, maxWidth: 520, lineHeight: 1.45, pointerEvents: 'auto' }}>
            {msg.text}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastState {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast hors ToastProvider')
  return ctx
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error && err.message) return err.message
  return 'Une erreur est survenue.'
}

// ── Chargement des données ───────────────────────────────────────────────────

export function useLoad<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const loadRef = useRef(load)
  loadRef.current = load
  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    loadRef
      .current()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(errorMessage(e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, setData, error, loading, reload }
}

export function Loader({ label = 'Chargement' }: { label?: string }) {
  return (
    <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }} aria-label={label}>
      <Spinner size={28} />
    </div>
  )
}

export function LoadError({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <Card>
      <Callout tone="warn" title="Impossible d’afficher cette page">
        {message}
      </Callout>
      {retry ? (
        <div>
          <Btn variant="outline" onClick={retry}>
            Réessayer
          </Btn>
        </div>
      ) : null}
    </Card>
  )
}

export function Empty({ title, text, action }: { title: string; text?: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ background: BAI.surface, border: `1.5px dashed ${BAI.dashed}`, borderRadius: 20, padding: 'clamp(24px, 4vw, 40px)', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <h2 style={display(30)}>{title}</h2>
      {text ? <p style={{ margin: 0, fontSize: 16, color: BAI.inkMid, lineHeight: 1.5, maxWidth: 560 }}>{text}</p> : null}
      {action}
    </div>
  )
}

/** Liste de documents de base pour le haut d'une page : « 3 logements · 2 loués ». */
export function Stat({ value, label, accent }: { value: ReactNode; label: string; accent?: boolean }) {
  return (
    <div className="stat" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={display(40, { lineHeight: 1, color: accent ? BAI.caramel : BAI.surface })}>{value}</span>
      <span style={{ fontSize: 14, color: BAI.onDarkMuted }}>{label}</span>
    </div>
  )
}
