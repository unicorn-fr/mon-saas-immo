import { useCallback, useEffect, useRef, useState } from 'react'
import type { SaveState } from '../components/FlowLayout'
import { errorMessage } from '../components/kit'

/**
 * Enregistrement automatique d'une fiche : chaque modification part après une courte pause.
 * « Enregistrer » envoie tout de suite. En cas d'échec, l'erreur est affichée et rien n'est perdu :
 * la prochaine modification (ou le bouton) renvoie l'ensemble.
 */
export function useAutosave<T>(save: (value: T) => Promise<void>, delay = 900) {
  const [state, setState] = useState<SaveState>('idle')
  const [error, setError] = useState<string | null>(null)
  const pending = useRef<T | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const saveRef = useRef(save)
  saveRef.current = save
  const running = useRef<Promise<void> | null>(null)

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current)
    if (running.current) await running.current.catch(() => undefined)
    const value = pending.current
    if (value === null) return
    pending.current = null
    setState('saving')
    const p = saveRef
      .current(value)
      .then(() => {
        setError(null)
        setState(pending.current === null ? 'saved' : 'saving')
      })
      .catch((e) => {
        pending.current = pending.current ?? value
        setError(errorMessage(e))
        setState('error')
        throw e
      })
    running.current = p
    try {
      await p
    } finally {
      running.current = null
    }
  }, [])

  const queue = useCallback(
    (value: T) => {
      pending.current = value
      setState('saving')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => void flush().catch(() => undefined), delay)
    },
    [delay, flush],
  )

  // Avant de quitter la page, ce qui reste part tout de suite.
  useEffect(() => {
    const onHide = () => {
      if (pending.current !== null) void flush().catch(() => undefined)
    }
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      onHide()
    }
  }, [flush])

  return { state, error, queue, flush }
}
