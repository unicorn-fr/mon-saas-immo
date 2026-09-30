import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage, useToast } from '../components/kit'
import type { Completion } from './contract'
import { useAutosave } from './autosave'

/**
 * État d'une fiche détaillée : chargée une fois, modifiée localement, enregistrée toute seule
 * (la fiche complète est envoyée ; le serveur recalcule l'avancement).
 */
export function useFiche<F extends object>(load: () => Promise<{ file: F; completion: Completion }>, put: (file: F) => Promise<{ completion: Completion }>, deps: unknown[] = []) {
  const toast = useToast()
  const [file, setFile] = useState<F | null>(null)
  const [completion, setCompletion] = useState<Completion | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const current = useRef<F | null>(null)
  const putRef = useRef(put)
  putRef.current = put

  const reload = useCallback(() => {
    setLoadError(null)
    load()
      .then((v) => {
        current.current = v.file
        setFile(v.file)
        setCompletion(v.completion)
      })
      .catch((e) => setLoadError(errorMessage(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(reload, [reload])

  const auto = useAutosave<F>(async (f) => {
    const r = await putRef.current(f)
    setCompletion(r.completion)
  })

  const set = useCallback(
    (patch: Partial<F>) => {
      const next = { ...(current.current as F), ...patch }
      current.current = next
      setFile(next)
      auto.queue(next)
    },
    [auto],
  )

  const saveNow = useCallback(async () => {
    if (current.current) auto.queue(current.current)
    try {
      await auto.flush()
      toast.show('Enregistré.')
    } catch (e) {
      toast.error(e)
    }
  }, [auto, toast])

  useEffect(() => {
    if (auto.error) toast.show(auto.error, 'error')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto.error])

  return { file, set, completion, save: auto.state, saveNow, flush: auto.flush, loadError, reload }
}
