import { AccountNotice } from '../components/DataNotice'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { safePath } from '../lib/safePath'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Callout, Input } from '../components/kit'
import { MailLinks } from '../components/MailLinks'
import { Button, Spinner, display } from '../components/ui'
import { switchSpace, type SharedSpace } from '../lib/shared'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { User } from '../lib/types'

interface Session {
  sessionToken: string
  user: User
  leaseId: string | null
  space?: SharedSpace | null
}


/** Écran partagé de la connexion et de l'inscription (maquettes « Connexion » et « Inscription directe »). */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink, display: 'flex' }} className="col-md">
      <div className="auth-side" style={{ width: 'min(600px, 42vw)', background: BAI.night, boxSizing: 'border-box', padding: 'clamp(28px, 4vw, 48px) clamp(24px, 5vw, 72px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 32 }}>
        <Link to="/" style={{ textDecoration: 'none', fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 30, color: BAI.caramel }}>
          Bailio
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={display('clamp(38px, 4vw, 56px)', { lineHeight: 1, color: BAI.surface })}>Vos locations, sans la paperasse.</div>
          <div style={{ fontSize: 17, color: BAI.onDark }}>Bail, quittances, rappels, factures.</div>
        </div>
        <div style={{ fontSize: 13, color: BAI.onDarkMuted }}>Vos données sont hébergées en Suisse et ne sont jamais revendues.</div>
      </div>
      <main style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 20px' }}>
        <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 22 }}>{children}</div>
      </main>
    </div>
  )
}

function MagicLinkForm({ signup }: { signup: boolean }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { from?: string } | null }
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) navigate(safePath(state?.from) ?? '/espace', { replace: true })
  }, [user, navigate, state])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Indiquez une adresse email valide.')
    setLoading(true)
    try {
      await api('/auth/magic-link', { method: 'POST', body: { email: email.trim(), signup } })
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Envoi impossible.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <>
        <h1 style={display('clamp(38px, 4vw, 48px)')}>Regardez vos emails.</h1>
        <p style={{ margin: 0, fontSize: 17, color: BAI.inkMid, lineHeight: 1.55 }}>
          {signup ? `Un lien pour ouvrir votre espace vient de partir vers ${email}.` : `Si un espace Bailio existe avec ${email}, un lien de connexion vient de partir.`} Il est valable 30 minutes.
        </p>
        <MailLinks email={email} />
        <span style={{ fontSize: 14, color: BAI.inkSoft }}>Rien reçu ? Regardez dans les indésirables, ou <button type="button" onClick={() => setSent(false)} style={{ background: 'none', border: 'none', padding: 0, color: BAI.owner, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>recommencez</button>.</span>
      </>
    )
  }

  return (
    <>
      <h1 style={display('clamp(38px, 4vw, 48px)')}>{signup ? 'Créez votre espace.' : 'Bon retour.'}</h1>
      <p style={{ margin: 0, fontSize: 17, color: BAI.inkMid }}>{signup ? 'Gratuit, sans carte bancaire, sans mot de passe.' : 'Pas de mot de passe : nous vous envoyons un lien de connexion par email.'}</p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
        <Input big label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={setEmail} autoFocus />
        {error ? <Callout tone="warn">{error}</Callout> : null}
        <Button type="submit" full loading={loading} height={58}>
          {signup ? 'Créer mon espace' : 'Recevoir mon lien de connexion'}
        </Button>
        {signup ? <AccountNotice action="Créer mon espace" /> : null}
      </form>
      <div style={{ fontSize: 15, color: BAI.inkMid, textAlign: 'center' }}>
        {signup ? (
          <>
            Déjà inscrit ? <Link to="/connexion" style={{ fontWeight: 600 }}>Se connecter</Link>
          </>
        ) : (
          <>
            Pas encore de compte ? <Link to="/inscription" style={{ fontWeight: 600 }}>Créer mon espace</Link>
          </>
        )}
      </div>
    </>
  )
}

export default function Connexion() {
  return (
    <AuthLayout>
      <MagicLinkForm signup={false} />
    </AuthLayout>
  )
}

export function Inscription() {
  return (
    <AuthLayout>
      <MagicLinkForm signup />
    </AuthLayout>
  )
}

/** Arrivée depuis le lien reçu par email (ou le QR code de l'état des lieux). */
export function ConnexionLien() {
  const [params] = useSearchParams()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const once = useRef(false)

  useEffect(() => {
    if (once.current) return
    once.current = true
    const token = params.get('jeton')
    if (!token) {
      setError('Ce lien est incomplet.')
      return
    }
    api<Session>('/auth/magic-link/verify', { method: 'POST', body: { token } })
      .then((s) => {
        signIn(s.sessionToken, s.user)
        // Lien venu d'une invitation : l'espace partagé s'ouvre tout de suite.
        if (s.space) return switchSpace(s.space)
        const next = safePath(params.get('suite'))
        navigate(s.leaseId ? `/bienvenue/${s.leaseId}` : next ?? '/espace', { replace: true, state: { justCreated: Boolean(s.leaseId) } })
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Connexion impossible.'))
  }, [params, signIn, navigate])

  return (
    <AuthLayout>
      {error ? (
        <>
          <h1 style={display(40)}>Lien expiré.</h1>
          <Callout tone="warn">{error}</Callout>
          <Button onClick={() => navigate('/connexion')}>Recevoir un nouveau lien</Button>
        </>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 17 }}>
          <Spinner /> Connexion en cours…
        </div>
      )}
    </AuthLayout>
  )
}
