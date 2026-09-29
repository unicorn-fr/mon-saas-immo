import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, ApiError } from './api'
import { DRAFT_KEY, storage } from './storage'
import type { Draft, DraftData } from './types'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface DraftState {
  data: DraftData
  step: string
  ready: boolean
  status: SaveStatus
  hasImportFile: boolean
  /** Fusionne des réponses et les enregistre automatiquement (avec un léger délai). */
  update: (patch: Partial<DraftData> | ((prev: DraftData) => Partial<DraftData>), step?: string) => void
  /** Enregistre immédiatement (avant de changer d'étape). */
  flush: () => Promise<void>
  ensure: () => Promise<void>
  replace: (draft: Draft) => void
  reset: () => void
  adopt: (token: string) => Promise<Draft | null>
}

const DraftContext = createContext<DraftState | null>(null)

export function DraftProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DraftData>({})
  const [step, setStep] = useState('type')
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [hasImportFile, setHasImportFile] = useState(false)
  const pending = useRef<{ data: DraftData; step: string } | null>(null)
  const timer = useRef<number | null>(null)
  const creating = useRef<Promise<void> | null>(null)

  const replace = useCallback((d: Draft) => {
    setData(d.data ?? {})
    setStep(d.step)
    setHasImportFile(d.hasImportFile)
  }, [])

  const reset = useCallback(() => {
    storage.set(DRAFT_KEY, null)
    setData({})
    setStep('type')
    setHasImportFile(false)
    setStatus('idle')
  }, [])

  const load = useCallback(async (): Promise<Draft | null> => {
    if (!storage.get(DRAFT_KEY)) return null
    try {
      const d = await api<Draft>('/drafts/current', { draft: true })
      if (d.leaseId) {
        reset()
        return null
      }
      replace(d)
      return d
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0) reset()
      return null
    }
  }, [replace, reset])

  useEffect(() => {
    load().finally(() => setReady(true))
  }, [load])

  const ensure = useCallback(async () => {
    if (storage.get(DRAFT_KEY)) return
    if (!creating.current) {
      creating.current = api<{ token: string; draft: Draft }>('/drafts', { method: 'POST' })
        .then(({ token }) => storage.set(DRAFT_KEY, token))
        .finally(() => {
          creating.current = null
        })
    }
    await creating.current
  }, [])

  const save = useCallback(async () => {
    const job = pending.current
    if (!job) return
    pending.current = null
    setStatus('saving')
    try {
      await ensure()
      await api('/drafts/current', { method: 'PUT', body: job, draft: true })
      setStatus(pending.current ? 'saving' : 'saved')
    } catch {
      setStatus('error')
    }
  }, [ensure])

  const update = useCallback(
    (patch: Partial<DraftData> | ((prev: DraftData) => Partial<DraftData>), nextStep?: string) => {
      setData((prev) => {
        const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }
        pending.current = { data: next, step: nextStep ?? pending.current?.step ?? step }
        return next
      })
      if (nextStep) setStep(nextStep)
      setStatus('saving')
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => void save(), 600)
    },
    [save, step],
  )

  const flush = useCallback(async () => {
    if (timer.current) window.clearTimeout(timer.current)
    await save()
  }, [save])

  const adopt = useCallback(
    async (token: string) => {
      storage.set(DRAFT_KEY, token)
      return load()
    },
    [load],
  )

  const value = useMemo(
    () => ({ data, step, ready, status, hasImportFile, update, flush, ensure, replace, reset, adopt }),
    [data, step, ready, status, hasImportFile, update, flush, ensure, replace, reset, adopt],
  )
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
}

export function useDraft(): DraftState {
  const ctx = useContext(DraftContext)
  if (!ctx) throw new Error('useDraft hors DraftProvider')
  return ctx
}
