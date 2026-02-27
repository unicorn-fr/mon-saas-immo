/**
 * progressState.ts
 * Persistent dossier progress tracker using localStorage.
 * The JSON structure is documented below — mirrors what progress_state.json would contain
 * if written to disk.
 *
 * Schema:
 * {
 *   "version": 1,
 *   "updatedAt": "2026-02-27T18:00:00Z",
 *   "currentStep": 3,
 *   "documents": {
 *     "BULLETIN_1": { "uploaded": true, "trustScore": 85, "fraudSignalCount": 0 },
 *     "CNI":        { "uploaded": true, "trustScore": 40, "fraudSignalCount": 2 }
 *   },
 *   "stepsCompleted": [true, true, false, false, false],
 *   "globalScore": 52,
 *   "confirmed": false
 * }
 */

const STORAGE_KEY = 'immo_dossier_progress'

export interface DocProgress {
  uploaded: boolean
  trustScore: number
  fraudSignalCount: number
  detectedDocType?: string | null
  hasProofOfLife?: boolean
}

export interface ProgressState {
  version: number
  updatedAt: string
  currentStep: number
  documents: Record<string, DocProgress>
  stepsCompleted: boolean[]
  globalScore: number
  confirmed: boolean
  crossDocWarnings: string[]
}

function defaultState(): ProgressState {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    currentStep: 1,
    documents: {},
    stepsCompleted: [false, false, false, false, false],
    globalScore: 0,
    confirmed: false,
    crossDocWarnings: [],
  }
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as ProgressState
    if (parsed.version !== 1) return defaultState()
    return parsed
  } catch {
    return defaultState()
  }
}

export function saveProgress(state: Partial<ProgressState>): void {
  try {
    const current = loadProgress()
    const next: ProgressState = {
      ...current,
      ...state,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage unavailable — silently skip
  }
}

export function updateDocProgress(docType: string, progress: Partial<DocProgress>): void {
  const current = loadProgress()
  const existing = current.documents[docType] ?? { uploaded: false, trustScore: 0, fraudSignalCount: 0 }
  current.documents[docType] = { ...existing, ...progress }
  saveProgress(current)
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Serialize the current state to a JSON string suitable for download.
 * This is the "progress_state.json" content.
 */
export function exportProgressJson(): string {
  return JSON.stringify(loadProgress(), null, 2)
}
