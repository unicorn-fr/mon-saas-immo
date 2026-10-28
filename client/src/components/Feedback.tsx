import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import { Btn, Modal, TextArea, useToast } from './kit'
import { Choices } from './Questions'

type Rating = 'USEFUL' | 'OK' | 'NOT_YET'

/**
 * « Votre avis » : deux questions, envoyées par email à l'équipe de Bailio (rien n'est enregistré dans la base).
 * Sert aux entretiens et aux tests utilisateurs : ce qui aide, ce qui manque, ce qui gêne.
 */
export function FeedbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const { pathname } = useLocation()
  const [rating, setRating] = useState<Rating | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const ready = rating !== null || message.trim().length >= 3
  const send = async () => {
    setBusy(true)
    try {
      await api('/feedback', { method: 'POST', body: { rating, message, page: pathname } })
      toast.show('Merci, votre avis est bien arrivé. Nous vous répondons par email si besoin.')
      setRating(null)
      setMessage('')
      close()
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  // Une question à la fois : la note d'un clic, puis (si l'on veut) une phrase.
  const [step, setStep] = useState<1 | 2>(1)
  const close = () => {
    setStep(1)
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={close}
      title="Votre avis"
      actions={
        step === 2 ? (
          <>
            <Btn variant="ghost" onClick={() => setStep(1)}>
              Retour
            </Btn>
            <Btn onClick={send} loading={busy} disabled={!ready}>
              Envoyer mon avis
            </Btn>
          </>
        ) : null
      }
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: BAI.inkSoft }}>Question {step} sur 2</span>
      {step === 1 ? <span style={{ fontSize: 17, fontWeight: 600 }}>Pour l’instant, Bailio vous est…</span> : null}
      {step === 1 ? (
        <Choices<Rating>
          legend="Pour l’instant, Bailio vous est…"
          columns
          value={rating}
          onPick={(v) => {
            setRating(v)
            setStep(2)
          }}
          options={[
            { value: 'USEFUL', label: 'Très utile' },
            { value: 'OK', label: 'Utile, mais…' },
            { value: 'NOT_YET', label: 'Pas encore utile' },
          ]}
        />
      ) : (
        <TextArea label="Qu’est-ce qui vous manque ou vous a gêné ?" hint="Facultatif. Une phrase suffit." value={message} onChange={setMessage} rows={4} maxLength={2000} />
      )}
      <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>
        Votre réponse et votre adresse email sont envoyées par email à l’équipe de Bailio, pour améliorer le service et vous répondre. Rien n’est enregistré dans votre espace.
      </span>
    </Modal>
  )
}
