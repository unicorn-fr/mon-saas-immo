import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

/**
 * Bulle de message de l'espace : un bouton rond en bas à droite ouvre une petite fenêtre. Le message part par email à
 * l'équipe (POST /support, FEEDBACK_TO) ; la réponse revient par email au propriétaire. Une personne de l'équipe
 * répond, 7 jours sur 7 (engagement d'Enzo, 14 novembre 2026). Une IA pourra répondre plus tard au même endroit.
 */
export function SupportChat() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const area = useRef<HTMLTextAreaElement | null>(null)
  const button = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    area.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const send = async () => {
    if (text.trim().length < 3 || busy) return
    setBusy(true)
    setErr(null)
    try {
      await api('/support', { method: 'POST', body: { message: text.trim(), page: pathname } })
      setSent(text.trim())
      setText('')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Le message n’est pas parti. Réessayez.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {open ? (
        <div role="dialog" aria-modal="false" aria-labelledby="chat-titre" className="chat-panel panel-in">
          <div className="chat-head">
            <p id="chat-titre" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Une question ? Discutons !
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>Une personne de l’équipe vous répond, 7 jours sur 7.</p>
          </div>
          <div className="chat-body" aria-live="polite">
            <p className="chat-msg">Bonjour{user?.firstName ? ` ${user.firstName}` : ''} ! Comment pouvons-nous vous aider ?</p>
            {sent ? (
              <>
                <p className="chat-msg chat-msg--me">{sent}</p>
                <p className="chat-msg">Message bien reçu. Nous vous répondons par email{user?.email ? ` à ${user.email}` : ''}.</p>
              </>
            ) : null}
          </div>
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
          >
            <label htmlFor="chat-texte" className="sr-only">
              Votre message
            </label>
            <textarea
              id="chat-texte"
              ref={area}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send()
                }
              }}
              placeholder="Entrez votre message…"
              rows={3}
              maxLength={3000}
            />
            {err ? (
              <p role="alert" style={{ margin: 0, fontSize: 13, color: BAI.error }}>
                {err}
              </p>
            ) : null}
            <button type="submit" disabled={busy || text.trim().length < 3}>
              {busy ? 'Envoi…' : 'Envoyer'}
            </button>
          </form>
        </div>
      ) : null}
      <button ref={button} type="button" className="chat-fab" aria-expanded={open} aria-label={open ? 'Fermer la discussion' : 'Écrire à l’équipe Bailio'} onClick={() => setOpen(!open)}>
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
            <path d="M4 5h16v11H9l-5 4z" />
          </svg>
        )}
      </button>
    </>
  )
}
