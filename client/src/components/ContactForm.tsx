import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import { Choices, QuestionScreen, useQuestion } from './Questions'
import { TextField, display } from './ui'

// Mêmes clés et mêmes libellés que CONTACT_NEEDS (server/src/domain/contact.ts) : le serveur refuse une autre clé.
const NEEDS = [
  { value: 'LEASE', label: 'Faire mon bail' },
  { value: 'QUESTION', label: 'Une question sur Bailio' },
  { value: 'PROBLEM', label: 'Un souci avec un document' },
  { value: 'OTHER', label: 'Autre chose' },
] as const
type Need = (typeof NEEDS)[number]['value']

/**
 * Être rappelé, en deux questions : de quoi avez-vous besoin, à quel numéro. La demande arrive aussitôt sur le
 * téléphone de l'équipe (email avec un bouton « Appeler »). Rien n'est enregistré.
 */
export function ContactForm() {
  const { q, go } = useQuestion(3)
  const [need, setNeed] = useState<Need | null>(null)
  const [byEmail, setByEmail] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const send = async () => {
    const value = byEmail ? email.trim() : phone.trim()
    if (!value) return setError(byEmail ? 'Indiquez votre email.' : 'Indiquez votre numéro.')
    setBusy(true)
    setError(null)
    try {
      await api('/contact', { method: 'POST', body: { need, phone: byEmail ? null : value, email: byEmail ? value : null, website, page: '/contact' } })
      go(3)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'L’envoi n’a pas abouti. Réessayez dans un instant.')
    } finally {
      setBusy(false)
    }
  }

  if (q === 3 && need)
    return (
      <div data-question style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 tabIndex={-1} style={display('clamp(28px, 4.4vw, 38px)', { outline: 'none' })}>
          C’est noté, <em>merci</em>.
        </h2>
        <p style={{ margin: 0, fontSize: 16, color: BAI.inkMid, lineHeight: 1.6 }}>
          {byEmail ? 'Nous vous répondons par email' : 'Nous vous rappelons'} au plus vite, le jour même pendant les jours ouvrés.
        </p>
      </div>
    )

  if (q === 1 || !need)
    return (
      <QuestionScreen q={1} count={2} title="De quoi avez-vous besoin ?" hideNext>
        <Choices
          legend="De quoi avez-vous besoin ?"
          columns
          value={need}
          options={NEEDS.map((n) => ({ value: n.value, label: n.label }))}
          onPick={(v) => {
            setNeed(v)
            go(2)
          }}
        />
      </QuestionScreen>
    )

  return (
    <QuestionScreen
      q={2}
      count={2}
      title={byEmail ? 'À quelle adresse vous répondre ?' : 'À quel numéro vous rappeler ?'}
      onBack={() => go(1)}
      onNext={() => void send()}
      nextLabel={byEmail ? 'Être recontacté' : 'Être rappelé'}
      busy={busy}
      footer={
        <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>
          {byEmail ? 'Votre email sert' : 'Votre numéro sert'} seulement à vous répondre. Il n’est pas gardé (<Link to="/confidentialite">confidentialité</Link>).
        </span>
      }
    >
      {byEmail ? (
        <TextField label="Votre email" name="contact-email" type="email" autoComplete="email" inputMode="email" value={email} error={error ?? undefined} onChange={(e) => {
            setEmail(e.target.value)
            setError(null)
          }} />
      ) : (
        <TextField label="Votre numéro de téléphone" name="contact-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="06 12 34 56 78" value={phone} error={error ?? undefined} onChange={(e) => {
            setPhone(e.target.value)
            setError(null)
          }} />
      )}
      <button
        type="button"
        onClick={() => {
          setByEmail(!byEmail)
          setError(null)
        }}
        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, fontSize: 15, fontWeight: 600, color: BAI.owner, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        {byEmail ? 'Plutôt par téléphone' : 'Plutôt par email'}
      </button>
      {/* Champ invisible : les robots le remplissent, pas les personnes. */}
      <input tabIndex={-1} autoComplete="off" aria-hidden value={website} onChange={(e) => setWebsite(e.target.value)} style={{ position: 'absolute', left: -9999, width: 1, height: 1 }} />
    </QuestionScreen>
  )
}
