import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { GoogleButton } from '../components/GoogleButton'
import { SimplePage } from '../components/SiteChrome'
import { Button, Notice, Spinner, TextField } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { User } from '../lib/types'

interface Session {
  sessionToken: string
  user: User
  leaseId: string | null
}

export default function Connexion() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleAvailable, setGoogleAvailable] = useState(false)

  useEffect(() => {
    if (user) navigate('/espace', { replace: true })
  }, [user, navigate])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api('/auth/magic-link', { method: 'POST', body: { email } })
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Envoi impossible.')
    } finally {
      setLoading(false)
    }
  }

  async function google(credential: string) {
    try {
      const s = await api<Session>('/auth/google', { method: 'POST', body: { credential } })
      signIn(s.sessionToken, s.user)
      navigate('/espace', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion Google impossible.')
    }
  }

  return (
    <SimplePage title="Se connecter">
      <div className="stack" style={{ gap: 24, maxWidth: 480 }}>
        {sent ? (
          <Notice tone="success">
            <strong>Regardez vos emails.</strong> Si un espace Bailio existe avec {email}, vous venez de recevoir un lien de connexion, valable 30 minutes.
          </Notice>
        ) : (
          <>
            <p style={{ margin: 0 }}>Pas de mot de passe : nous vous envoyons un lien de connexion par email.</p>
            <GoogleButton onCredential={google} onReady={setGoogleAvailable} />
            {googleAvailable ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 14, color: BAI.inkSoft }}>
                <div style={{ flexGrow: 1, height: 1, background: BAI.rule }} />
                ou
                <div style={{ flexGrow: 1, height: 1, background: BAI.rule }} />
              </div>
            ) : null}
            <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
              <TextField label="Votre email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit" full loading={loading}>
                Recevoir mon lien de connexion
              </Button>
            </form>
          </>
        )}
        {error ? <Notice tone="warning">{error}</Notice> : null}
      </div>
    </SimplePage>
  )
}

/** Arrivée depuis le lien reçu par email. */
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
        navigate(s.leaseId ? `/bienvenue/${s.leaseId}` : '/espace', { replace: true, state: { justCreated: Boolean(s.leaseId) } })
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Connexion impossible.'))
  }, [params, signIn, navigate])

  return (
    <SimplePage title="Connexion">
      {error ? (
        <div className="stack" style={{ gap: 16, maxWidth: 480 }}>
          <Notice tone="warning">{error}</Notice>
          <Button onClick={() => navigate('/connexion')}>Recevoir un nouveau lien</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Spinner /> Connexion en cours…
        </div>
      )}
    </SimplePage>
  )
}
