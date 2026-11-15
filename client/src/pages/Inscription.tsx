import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '@fontsource-variable/bricolage-grotesque/wght.css'
import { DA2 } from '../constants/bailio-tokens'
import { EmailSuggestion } from '../components/EmailSuggestion'
import { MailLinks } from '../components/MailLinks'
import { useQuestion } from '../components/Questions'
import { Building, Calculator, Check, Clock, Key, Scale, Shield, Chart } from '../components/Icons'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { safePath } from '../lib/safePath'

/**
 * Inscription en questions, une par écran, comme on remplit un dossier avec quelqu'un : qui vous êtes, ce que vous
 * attendez, votre parc, votre outil actuel, comment vous nous avez connus, puis vos coordonnées. Les réponses partent
 * avec le lien de connexion et s'appliquent à la création du compte (`server/src/domain/onboarding.ts`) : vue du
 * tableau de bord, profil du bailleur, import du fichier à la première connexion. Rien n'est gardé dans le navigateur.
 * Dans la nouvelle direction « Tombée du jour » (`DA2`) : fond lin, titres en Newsreader, plaque « bailio » bleue.
 */

type Role = 'OWNER' | 'AGENCY' | 'TENANT'
type Goal = 'TIME' | 'COMPLIANCE' | 'RENTS' | 'FINANCES' | 'TAXES'
type Homes = 'ONE' | 'TWO' | 'FEW' | 'MANY' | 'LOTS'
type Tool = 'NONE' | 'SPREADSHEET' | 'QALIMO' | 'RENTILA' | 'SOFTWARE' | 'AGENCY'
type Source = 'SEARCH' | 'SOCIAL' | 'TIKTOK' | 'YOUTUBE' | 'LINKEDIN' | 'WORD_OF_MOUTH' | 'AI' | 'OTHER'

const COUNT = 6
const STEPS = [
  { label: 'Votre profil', from: 1 },
  { label: 'Vos attentes', from: 2 },
  { label: 'Vos logements', from: 3 },
  { label: 'Vos informations', from: 6 },
]

const ROLES: Array<{ value: Role; title: string; text: string; icon: ReactNode; tag?: string }> = [
  { value: 'OWNER', title: 'Je suis propriétaire', text: 'Je loue un ou plusieurs biens et je veux m’en occuper simplement.', icon: <Building />, tag: 'Premier mois offert' },
  { value: 'AGENCY', title: 'Je gère pour d’autres', text: 'Agence, mandataire ou gestionnaire de plusieurs propriétaires.', icon: <Chart size={26} /> },
  { value: 'TENANT', title: 'Je suis locataire', text: 'Mon propriétaire utilise Bailio : quittances, assurance, signalements.', icon: <Key /> },
]
const GOALS: Array<{ value: Goal; title: string; text: string; icon: ReactNode }> = [
  { value: 'TIME', title: 'Gagner du temps', text: 'Quittances, relances et loyers suivis tout seuls.', icon: <Clock /> },
  { value: 'COMPLIANCE', title: 'Être en règle', text: 'Bail conforme, révisions et diagnostics à jour.', icon: <Scale /> },
  { value: 'RENTS', title: 'Sécuriser mes loyers', text: 'Voir les retards tout de suite, agir sans stress.', icon: <Shield /> },
  { value: 'FINANCES', title: 'Piloter mes finances', text: 'Rentabilité, dépenses et trésorerie d’un coup d’œil.', icon: <Chart size={26} /> },
  { value: 'TAXES', title: 'Déclarer mes revenus', text: 'Les cases à recopier, sans prise de tête.', icon: <Calculator /> },
]
/** Ce que le tableau de bord met en avant selon le nombre de logements (mêmes seuils que le serveur). */
const VIEW_OF: Record<Homes, string> = {
  ONE: 'Tout l’essentiel sur un seul écran.',
  TWO: 'Chaque bail suivi à part, rien ne se mélange.',
  FEW: 'Les chiffres du mois en tête, les retards en premier.',
  MANY: 'Relances et quittances groupées, en un clic.',
  LOTS: 'Patrimoine, exports et structures d’abord.',
}
const MAX_HOMES = 50
const homesOf = (n: number): Homes => (n <= 1 ? 'ONE' : n === 2 ? 'TWO' : n <= 9 ? 'FEW' : n <= 20 ? 'MANY' : 'LOTS')
const homesLabel = (n: number) => (n >= MAX_HOMES ? `${MAX_HOMES} logements et plus` : `${n} logement${n > 1 ? 's' : ''}`)
const TOOLS: Array<{ value: Tool; title: string; text: string }> = [
  { value: 'NONE', title: 'Je commence', text: 'Premier bail ou premier logement.' },
  { value: 'SPREADSHEET', title: 'Un tableur', text: 'Excel, Google Sheets, papier.' },
  { value: 'QALIMO', title: 'Qalimo', text: 'Vous importez votre export.' },
  { value: 'RENTILA', title: 'Rentila', text: 'Vous importez votre export.' },
  { value: 'SOFTWARE', title: 'Un autre logiciel', text: 'Vous importez votre fichier.' },
  { value: 'AGENCY', title: 'Une agence', text: 'Vous reprenez la main.' },
]
const SOURCES: Array<{ value: Source; label: string }> = [
  { value: 'SEARCH', label: 'Google ou un moteur de recherche' },
  { value: 'AI', label: 'Une IA (ChatGPT, Claude…)' },
  { value: 'SOCIAL', label: 'Instagram ou Facebook' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'WORD_OF_MOUTH', label: 'Bouche à oreille' },
  { value: 'OTHER', label: 'Autre' },
]

interface Answers {
  role?: Role
  goals: Goal[]
  homes: Homes
  homeCount: number
  tool?: Tool
  source?: Source
  firstName: string
  lastName: string
  email: string
  phone: string
}

const IMPORT_TOOLS: Tool[] = ['SPREADSHEET', 'QALIMO', 'RENTILA', 'SOFTWARE']

/** La plaque « bailio » de la nouvelle direction : tuile bleue, filet blanc, nom en Bricolage Grotesque. */
export function Plaque({ size = 22 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', background: DA2.blue, borderRadius: size * 0.55, padding: 4, boxShadow: '0 10px 30px -12px rgba(0, 0, 0, 0.55)' }}>
      <span style={{ border: `2px solid ${DA2.white}`, borderRadius: size * 0.42, padding: `${size * 0.22}px ${size * 0.62}px ${size * 0.27}px`, font: `800 ${size}px/1 ${DA2.brand}`, letterSpacing: '-0.03em', color: DA2.white }}>bailio</span>
    </span>
  )
}

const serif = (size: string, extra: CSSProperties = {}): CSSProperties => ({ margin: 0, font: `300 ${size}/1.04 ${DA2.serif}`, letterSpacing: '-0.03em', color: DA2.ink, textWrap: 'balance', fontVariationSettings: '"opsz" 60', ...extra } as CSSProperties)
const em: CSSProperties = { fontStyle: 'italic', color: DA2.sky }
const linkBtn: CSSProperties = { background: 'none', border: 'none', padding: '14px 4px', font: `600 16px/1 ${DA2.sans}`, color: DA2.sky, cursor: 'pointer' }

/** Une question : compteur, barre qui se remplit, titre en serif, réponses, puis Retour / Passer / bouton plein. */
function Screen({ q, title, hint, children, onBack, onNext, skip, nextLabel = 'Continuer', busy, footer }: { q: number; title: ReactNode; hint?: ReactNode; children: ReactNode; onBack?: () => void; onNext?: () => void; skip?: () => void; nextLabel?: string; busy?: boolean; footer?: ReactNode }) {
  return (
    <form
      data-question
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (!busy) onNext?.()
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ font: `400 15px/1 ${DA2.serif}`, color: DA2.sunInk, fontVariantNumeric: 'lining-nums' }}>
          {q} sur {COUNT}
        </span>
        <span role="progressbar" aria-label="Progression" aria-valuemin={0} aria-valuemax={COUNT} aria-valuenow={q} style={{ flexGrow: 1, height: 2, background: DA2.line, borderRadius: 2, overflow: 'hidden' }}>
          <span style={{ display: 'block', width: `${(q / COUNT) * 100}%`, height: '100%', background: DA2.ink, transition: 'width .5s cubic-bezier(.2,.8,.2,1)' }} />
        </span>
      </div>
      <h1 tabIndex={-1} style={serif('clamp(36px, 4.6vw, 56px)', { outline: 'none' })}>
        {title}
      </h1>
      {hint ? <p style={{ margin: '-6px 0 0', fontSize: 17, color: DA2.mid, lineHeight: 1.5 }}>{hint}</p> : null}
      {children}
      {onBack || onNext || skip ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingTop: 4 }}>
          {onBack ? (
            <button type="button" onClick={onBack} style={linkBtn}>
              Retour
            </button>
          ) : (
            <span />
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {skip ? (
              <button type="button" onClick={skip} style={linkBtn}>
                Passer
              </button>
            ) : null}
            {onNext ? (
              <button type="submit" disabled={busy} className="su-btn" style={{ background: DA2.ink, color: DA2.white, minHeight: 56, padding: '0 30px', borderRadius: 12, font: `600 16px/1 ${DA2.sans}`, border: 'none', cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Envoi…' : nextLabel}
              </button>
            ) : null}
          </span>
        </div>
      ) : null}
      {footer}
    </form>
  )
}

/** Champ de saisie : intitulé, 60 px de haut, bord lisible, message relié à la question. */
function Field({ label, value, onChange, error, hint, type = 'text', autoComplete, inputMode }: { label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; type?: string; autoComplete?: string; inputMode?: 'email' | 'tel' | 'text' }) {
  const id = useId()
  const note = error ?? hint
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label htmlFor={id} style={{ font: `600 15px/1.2 ${DA2.sans}`, color: DA2.ink }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={note ? `${id}-n` : undefined}
        className="su-input"
        style={{ height: 60, padding: '0 18px', borderRadius: 12, border: `1.5px solid ${error ? DA2.error : DA2.lineStrong}`, background: DA2.paper, color: DA2.ink, font: `400 17px/1 ${DA2.sans}` }}
      />
      {note ? (
        <span id={`${id}-n`} style={{ fontSize: 14, color: error ? DA2.error : DA2.soft }}>
          {note}
        </span>
      ) : null}
    </div>
  )
}

/** Grande carte de choix : icône, titre, une ligne ; pastille cochée quand elle est choisie. */
function Card({ i, selected, onClick, title, text, icon, tag, multi }: { i: number; selected: boolean; onClick: () => void; title: string; text?: string; icon?: ReactNode; tag?: string; multi?: boolean }) {
  return (
    <button
      type="button"
      className="su-card"
      aria-pressed={selected}
      onClick={onClick}
      style={{
        ['--i' as string]: i,
        position: 'relative',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: icon ? '20px 54px 20px 22px' : '18px 50px 18px 20px',
        minHeight: 64,
        borderRadius: 18,
        border: `1.5px solid ${selected ? DA2.ink : DA2.line}`,
        background: selected ? DA2.paper : DA2.white,
        boxShadow: selected ? DA2.shadow : 'none',
        color: DA2.ink,
        fontFamily: DA2.sans,
        cursor: 'pointer',
      } as CSSProperties}
    >
      {icon ? <span style={{ color: DA2.sky, display: 'flex' }}>{icon}</span> : null}
      <span style={{ font: `400 22px/1.15 ${DA2.serif}`, letterSpacing: '-0.01em' }}>{title}</span>
      {text ? <span style={{ fontSize: 14, color: DA2.mid, lineHeight: 1.45 }}>{text}</span> : null}
      {tag ? <span style={{ alignSelf: 'flex-start', marginTop: 4, fontSize: 13, fontWeight: 600, color: DA2.sunInk, background: DA2.sunTint, borderRadius: 999, padding: '4px 10px' }}>{tag}</span> : null}
      <span aria-hidden style={{ position: 'absolute', top: 18, right: 18, width: 24, height: 24, borderRadius: multi ? 7 : 999, border: selected ? 'none' : `1.5px solid ${DA2.lineStrong}`, background: selected ? DA2.ink : DA2.white, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {selected ? (
          <span className="su-tick" style={{ display: 'flex' }}>
            <Check size={14} color={DA2.white} strokeWidth={3} />
          </span>
        ) : null}
      </span>
    </button>
  )
}

/** Une petite maison dessinée trait par trait ; celles déjà là ne rejouent pas leur apparition. */
function House({ i }: { i: number }) {
  return (
    <svg className="su-house" viewBox="0 0 24 24" width="26" height="26" aria-hidden style={{ ['--i' as string]: i % 10 } as CSSProperties}>
      <path pathLength={1} d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5" fill="none" stroke={DA2.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect className="su-house-win" x="10.6" y="10.4" width="2.8" height="2.6" rx=".4" fill={DA2.sun} />
    </svg>
  )
}

/**
 * Nombre de logements au curseur : le chiffre exact en grand (il glisse à chaque changement), une maison par
 * logement qui se dessine, et ce que le tableau de bord mettra en avant. − et + pour ajuster d'un logement.
 */
function HomesSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const shown = Math.min(value, 20)
  const pct = ((value - 1) / (MAX_HOMES - 1)) * 100
  const step = (d: number) => onChange(Math.min(MAX_HOMES, Math.max(1, value + d)))
  const round: CSSProperties = { width: 48, height: 48, borderRadius: 999, border: `1.5px solid ${DA2.lineStrong}`, background: DA2.white, color: DA2.ink, font: `400 24px/1 ${DA2.sans}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, background: DA2.white, border: `1px solid ${DA2.line}`, borderRadius: 22, padding: 'clamp(20px, 3vw, 32px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <button type="button" className="su-btn" style={round} onClick={() => step(-1)} disabled={value <= 1} aria-label="Un logement de moins">
          −
        </button>
        <div aria-hidden style={{ display: 'flex', alignItems: 'baseline', gap: 12, overflow: 'hidden' }}>
          <span key={value} className="su-num" style={{ font: `300 clamp(64px, 9vw, 96px)/1 ${DA2.serif}`, letterSpacing: '-0.04em', color: DA2.ink, fontVariantNumeric: 'lining-nums tabular-nums' }}>
            {value}
            {value >= MAX_HOMES ? '+' : ''}
          </span>
          <span style={{ font: `400 22px/1 ${DA2.serif}`, color: DA2.mid }}>logement{value > 1 ? 's' : ''}</span>
        </div>
        <button type="button" className="su-btn" style={round} onClick={() => step(1)} disabled={value >= MAX_HOMES} aria-label="Un logement de plus">
          +
        </button>
      </div>
      <input
        type="range"
        className="su-range"
        min={1}
        max={MAX_HOMES}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Nombre de logements"
        aria-valuetext={homesLabel(value)}
        style={{ ['--p' as string]: `${pct}%` } as CSSProperties}
      />
      <div style={{ position: 'relative', height: 16, fontSize: 13, color: DA2.soft, marginTop: -12, margin: '-12px 15px 0' }} aria-hidden>
        {[1, 10, 20, 30, 40, MAX_HOMES].map((n) => (
          <button
            key={n}
            type="button"
            tabIndex={-1}
            onClick={() => onChange(n)}
            style={{ position: 'absolute', left: `${((n - 1) / (MAX_HOMES - 1)) * 100}%`, transform: 'translateX(-50%)', background: 'none', border: 'none', padding: 0, font: 'inherit', color: value === n ? DA2.ink : DA2.soft, fontWeight: value === n ? 700 : 400, cursor: 'pointer' }}
          >
            {n === MAX_HOMES ? `${n}+` : n}
          </button>
        ))}
      </div>
      <div aria-hidden style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 64, alignContent: 'flex-start' }}>
        {Array.from({ length: shown }, (_, i) => (
          <House key={i} i={i} />
        ))}
        {value > 20 ? (
          <span key="plus" className="su-num" style={{ alignSelf: 'center', font: `400 18px/1 ${DA2.serif}`, color: DA2.sunInk, marginLeft: 6 }}>
            {value >= MAX_HOMES ? 'et plus encore' : `et ${value - 20} de plus`}
          </span>
        ) : null}
      </div>
      <p key={homesOf(value)} className="su-num" role="status" style={{ margin: 0, fontSize: 16, color: DA2.mid, borderTop: `1px solid ${DA2.line}`, paddingTop: 16 }}>
        <strong style={{ color: DA2.ink, fontWeight: 600 }}>Votre tableau de bord : </strong>
        {VIEW_OF[homesOf(value)]}
      </p>
    </div>
  )
}

/** Colonne bleu nuit : la plaque, la promesse, les quatre étapes allumées au fil des réponses, ce que vous avez dit. */
function Side({ q, chips }: { q: number; chips: string[] }) {
  return (
    <aside className="auth-side su-side" style={{ width: 'min(520px, 38vw)', background: DA2.night, color: DA2.white, boxSizing: 'border-box', padding: 'clamp(24px, 4vw, 48px) clamp(20px, 4vw, 56px)', display: 'flex', flexDirection: 'column', gap: 40, position: 'relative', overflow: 'hidden' }}>
      <Link to="/" aria-label="Bailio, retour à l’accueil" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
        <Plaque />
      </Link>
      <div className="hide-md" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
        <div style={serif('clamp(34px, 3.4vw, 50px)', { color: DA2.white })}>
          Une fenêtre de plus <em style={{ fontStyle: 'italic', color: DA2.sun }}>s’allume</em>.
        </div>
        <p style={{ margin: 0, fontSize: 16, color: DA2.onNight }}>Premier mois offert, sans carte bancaire.</p>
      </div>
      <ol className="hide-md" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {STEPS.map((s, i) => {
          const next = STEPS[i + 1]?.from ?? COUNT + 1
          const done = q >= next
          const current = q >= s.from && q < next
          return (
            <li key={s.label} style={{ display: 'flex', gap: 16, minHeight: 58 }}>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className={current ? 'su-lamp' : undefined} style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done || current ? DA2.sun : 'transparent', border: done || current ? 'none' : `1.5px solid ${DA2.nightLine}`, transition: 'background-color .4s ease' }}>
                  {done ? (
                    <span className="su-tick" style={{ display: 'flex' }}>
                      <Check size={14} color={DA2.night} strokeWidth={3} />
                    </span>
                  ) : null}
                </span>
                {i < STEPS.length - 1 ? (
                  <span style={{ flexGrow: 1, width: 1.5, background: DA2.nightLine, margin: '4px 0', position: 'relative', overflow: 'hidden' }}>
                    {done ? <span className="su-rail" style={{ position: 'absolute', inset: 0, background: DA2.sun }} /> : null}
                  </span>
                ) : null}
              </span>
              <span style={{ fontSize: 16, fontWeight: current ? 600 : 400, color: done || current ? DA2.white : DA2.onNightSoft, paddingTop: 3 }}>{s.label}</span>
            </li>
          )
        })}
      </ol>
      {chips.length ? (
        <div className="hide-md" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} aria-label="Vos réponses">
          {chips.map((c) => (
            <span key={c} className="su-chip" style={{ fontSize: 13, color: DA2.onNight, border: `1px solid ${DA2.nightLine}`, borderRadius: 999, padding: '6px 12px' }}>
              {c}
            </span>
          ))}
        </div>
      ) : null}
      <div className="hide-md" style={{ marginTop: 'auto', fontSize: 13, color: DA2.onNightSoft }}>Vos données dorment en Suisse. Jamais revendues.</div>
    </aside>
  )
}

export default function Inscription() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { from?: string } | null }
  const { q, go, next, prev } = useQuestion(COUNT)
  const [a, setA] = useState<Answers>({ goals: [], homes: 'ONE', homeCount: 1, firstName: '', lastName: '', email: '', phone: '' })
  const [tenant, setTenant] = useState(false)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<'firstName' | 'lastName' | 'email' | 'phone' | 'form', string>>>({})
  // Sens de la marche, pour que la question glisse du bon côté.
  const last = useRef(q)
  const dir = q >= last.current ? 1 : -1
  useEffect(() => {
    last.current = q
  }, [q])

  useEffect(() => {
    if (user) navigate(safePath(state?.from) ?? '/espace', { replace: true })
  }, [user, navigate, state])
  // Page rechargée au milieu : les réponses ne sont gardées nulle part, on repart du début.
  useEffect(() => {
    if (q > 1 && !a.role) go(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (patch: Partial<Answers>) => setA((cur) => ({ ...cur, ...patch }))
  const pick = (patch: Partial<Answers>) => {
    set(patch)
    // Laisse voir la coche avant de passer à la suite.
    window.setTimeout(next, 220)
  }

  const chips = [
    a.role === 'OWNER' ? 'Propriétaire' : a.role === 'AGENCY' ? 'Gestion pour d’autres' : null,
    ...(q > 2 ? a.goals.map((g) => GOALS.find((x) => x.value === g)!.title) : []),
    q > 3 ? homesLabel(a.homeCount) : null,
    a.tool ? (a.tool === 'NONE' ? 'Je commence' : `Aujourd’hui : ${TOOLS.find((x) => x.value === a.tool)!.title}`) : null,
  ].filter((x): x is string => Boolean(x))

  const submit = async () => {
    const e: typeof errors = {}
    if (!a.firstName.trim()) e.firstName = 'Indiquez votre prénom.'
    if (!a.lastName.trim()) e.lastName = 'Indiquez votre nom.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim())) e.email = 'Indiquez une adresse email valide.'
    if (a.phone.trim() && !/^[+\d][\d\s().-]{7,}$/.test(a.phone.trim())) e.phone = 'Ce numéro semble incomplet.'
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-question] [aria-invalid="true"]')?.focus())
      return
    }
    setBusy(true)
    try {
      await api('/auth/magic-link', {
        method: 'POST',
        body: {
          email: a.email.trim(),
          signup: true,
          next: safePath(state?.from) ?? undefined,
          answers: { role: a.role, goals: a.goals, homes: a.homes, homeCount: a.homeCount, tool: a.tool, source: a.source, firstName: a.firstName.trim(), lastName: a.lastName.trim(), phone: a.phone.trim() || undefined },
        },
      })
      setSent(true)
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'Envoi impossible. Réessayez dans un instant.' })
    } finally {
      setBusy(false)
    }
  }

  let body: ReactNode
  if (sent) {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 style={serif('clamp(38px, 4.6vw, 56px)')}>
          Regardez vos <em style={em}>emails</em>.
        </h1>
        <p style={{ margin: 0, fontSize: 17, color: DA2.mid, lineHeight: 1.55 }}>
          {a.firstName.trim()}, le lien qui ouvre votre espace vient de partir vers {a.email.trim()}. Il est valable 30 minutes.
          {a.tool && IMPORT_TOOLS.includes(a.tool) ? ' Vous arriverez directement sur l’import de votre fichier.' : ''}
        </p>
        <MailLinks email={a.email.trim()} />
        <span style={{ fontSize: 14, color: DA2.soft }}>
          Mauvaise adresse ?{' '}
          <button type="button" onClick={() => setSent(false)} style={{ ...linkBtn, padding: 0, fontSize: 14 }}>
            Corrigez-la
          </button>
          .
        </span>
      </div>
    )
  } else if (tenant) {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 style={serif('clamp(36px, 4.4vw, 52px)')}>
          Pas besoin de <em style={em}>compte</em>.
        </h1>
        <p style={{ margin: 0, fontSize: 17, color: DA2.mid, lineHeight: 1.55 }}>Votre propriétaire vous envoie un lien personnel. Il suffit pour tout faire, sans mot de passe.</p>
        <Link to="/espace-locataire" style={{ fontSize: 17, fontWeight: 600, color: DA2.sky }}>
          Ce que vous pouvez faire avec votre lien
        </Link>
        <button type="button" onClick={() => setTenant(false)} style={{ ...linkBtn, alignSelf: 'flex-start', padding: '12px 0' }}>
          Retour
        </button>
      </div>
    )
  } else if (q === 1) {
    body = (
      <Screen q={1} title={<>Créez votre <em style={em}>espace</em>.</>} hint="Pour commencer, vous êtes…">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} role="group" aria-label="Vous êtes">
          {ROLES.map((r, i) => (
            <Card key={r.value} i={i} selected={a.role === r.value} onClick={() => (r.value === 'TENANT' ? setTenant(true) : pick({ role: r.value }))} title={r.title} text={r.text} icon={r.icon} tag={r.tag} />
          ))}
        </div>
      </Screen>
    )
  } else if (q === 2) {
    body = (
      <Screen q={2} title={<>Qu’attendez-vous <em style={em}>de Bailio</em> ?</>} hint="Plusieurs réponses possibles." onBack={prev} onNext={next} skip={a.goals.length ? undefined : next}>
        <div className="su-grid" role="group" aria-label="Vos attentes">
          {GOALS.map((g, i) => {
            const on = a.goals.includes(g.value)
            return <Card key={g.value} i={i} multi selected={on} onClick={() => set({ goals: on ? a.goals.filter((x) => x !== g.value) : [...a.goals, g.value] })} title={g.title} text={g.text} icon={g.icon} />
          })}
        </div>
      </Screen>
    )
  } else if (q === 3) {
    body = (
      <Screen q={3} title={<>Combien de logements <em style={em}>{a.role === 'AGENCY' ? 'gérez-vous' : 'louez-vous'}</em> ?</>} hint="Garages compris. Glissez jusqu’au bon chiffre." onBack={prev} onNext={next}>
        <HomesSlider value={a.homeCount} onChange={(n) => set({ homeCount: n, homes: homesOf(n) })} />
      </Screen>
    )
  } else if (q === 4) {
    body = (
      <Screen q={4} title={<>Comment gérez-vous <em style={em}>aujourd’hui</em> ?</>} hint="Vous venez d’un logiciel ? Votre fichier s’importe, rien à ressaisir." onBack={prev}>
        <div className="su-grid" role="group" aria-label="Votre outil actuel">
          {TOOLS.map((t, i) => (
            <Card key={t.value} i={i} selected={a.tool === t.value} onClick={() => pick({ tool: t.value })} title={t.title} text={t.text} />
          ))}
        </div>
      </Screen>
    )
  } else if (q === 5) {
    body = (
      <Screen q={5} title={<>Comment avez-vous <em style={em}>connu Bailio</em> ?</>} onBack={prev} skip={next}>
        <div className="su-grid" role="group" aria-label="Comment avez-vous connu Bailio">
          {SOURCES.map((s, i) => (
            <Card key={s.value} i={i} selected={a.source === s.value} onClick={() => pick({ source: s.value })} title={s.label} />
          ))}
        </div>
      </Screen>
    )
  } else {
    body = (
      <Screen
        q={6}
        title={<>Dernière étape, <em style={em}>vos informations</em>.</>}
        hint="Pas de mot de passe : un lien arrive par email."
        onBack={prev}
        onNext={() => void submit()}
        nextLabel="Créer mon espace"
        busy={busy}
        footer={
          <p style={{ margin: 0, fontSize: 13, color: DA2.soft, lineHeight: 1.55 }}>
            En cliquant sur « Créer mon espace », vous acceptez les <Link to="/conditions" style={{ color: DA2.sky }}>conditions d’utilisation</Link>. Nom et téléphone remplissent votre profil
            de bailleur ; vos réponses adaptent votre espace. Jamais de publicité, jamais revendu. Voir <Link to="/confidentialite" style={{ color: DA2.sky }}>Confidentialité</Link>.
          </p>
        }
      >
        <div className="su-two">
          <Field label="Prénom" autoComplete="given-name" value={a.firstName} onChange={(v) => set({ firstName: v })} error={errors.firstName} />
          <Field label="Nom" autoComplete="family-name" value={a.lastName} onChange={(v) => set({ lastName: v })} error={errors.lastName} />
        </div>
        <Field label="Email" type="email" autoComplete="email" inputMode="email" value={a.email} onChange={(v) => set({ email: v })} error={errors.email} />
        <EmailSuggestion email={a.email} onPick={(v) => set({ email: v })} />
        <Field
          label="Téléphone (facultatif)"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={a.phone}
          onChange={(v) => set({ phone: v })}
          error={errors.phone}
          hint={a.tool && IMPORT_TOOLS.includes(a.tool) ? 'Pour vous aider à reprendre vos données, si besoin.' : 'Repris sur vos quittances et vos courriers.'}
        />
        {errors.form ? (
          <p role="alert" style={{ margin: 0, padding: '14px 16px', borderRadius: 12, background: DA2.sunTint, color: DA2.ink, fontSize: 15 }}>
            {errors.form}
          </p>
        ) : null}
      </Screen>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: DA2.linen, color: DA2.ink, fontFamily: DA2.sans, display: 'flex' }} className="col-md">
      <Side q={sent ? COUNT + 1 : q} chips={sent || tenant ? [] : chips} />
      <main id="contenu" style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 'clamp(28px, 7vh, 88px) 20px 56px' }}>
        <div key={sent ? 'sent' : tenant ? 'tenant' : q} className="su-q" style={{ ['--dir' as string]: dir, width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 } as CSSProperties}>
          {body}
          {q === 1 && !sent && !tenant ? (
            <div style={{ fontSize: 15, color: DA2.mid }}>
              Déjà inscrit ? <Link to="/connexion" style={{ fontWeight: 600, color: DA2.sky }}>Se connecter</Link>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
