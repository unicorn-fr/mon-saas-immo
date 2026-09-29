import { useState, type FormEvent } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { api, ApiError } from '../lib/api'
import { useDraft } from '../lib/draft'
import { Button, inputStyle } from './ui'

/** « Enregistrer et terminer plus tard » : un lien de reprise est envoyé par email. */
export function SaveLater() {
  const { flush } = useDraft()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setState('sending')
    try {
      await flush()
      await api('/drafts/current/resume-link', { method: 'POST', body: { email }, draft: true })
      setState('sent')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Envoi impossible.')
      setState('idle')
    }
  }

  if (state === 'sent') {
    return (
      <p role="status" style={{ margin: 0, fontSize: 15, color: BAI.green, textAlign: 'center' }}>
        C'est envoyé. Le lien pour reprendre votre bail est dans votre boîte mail.
      </p>
    )
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={{ alignSelf: 'center', background: 'none', border: 'none', color: BAI.inkSoft, fontSize: 15, textDecoration: 'underline', textUnderlineOffset: 3, padding: 8 }}>
        Enregistrer et terminer plus tard
      </button>
    )
  }
  return (
    <form onSubmit={submit} className="stack" style={{ gap: 12, background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: 20 }}>
      <label htmlFor="resume-email" style={{ fontSize: 15, fontWeight: 600 }}>
        Recevez un lien pour reprendre plus tard
      </label>
      <div className="col-md" style={{ display: 'flex', gap: 10 }}>
        <input id="resume-email" type="email" required autoComplete="email" placeholder="votre@email.fr" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle(Boolean(error)), height: 52, fontSize: 16 }} />
        <Button type="submit" height={52} loading={state === 'sending'}>
          Envoyer le lien
        </Button>
      </div>
      {error ? <span role="alert" style={{ color: BAI.error, fontSize: 14 }}>{error}</span> : <span style={{ fontSize: 14, color: BAI.inkSoft }}>Tout ce que vous avez saisi est conservé 30 jours.</span>}
    </form>
  )
}
