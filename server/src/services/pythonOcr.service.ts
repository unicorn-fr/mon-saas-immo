/**
 * Python OCR Service — Client Node.js pour le service FastAPI ocr_api.py
 *
 * Lance uvicorn en subprocess au démarrage du serveur (si PYTHON_OCR_ENABLED != 'false').
 * Appelle http://127.0.0.1:5001/scan avec l'image en base64.
 * Retourne null si le service n'est pas disponible — jamais de crash.
 *
 * Cascade utilisée dans ocr_api.py :
 *   A. fastmrz (confidence 92)  — MRZ ICAO TD1/TD3
 *   B. pytesseract MRZ fallback — crop + upscale + whitelist
 *   C. PaddleOCR                — texte full + labels structurés
 */

import { spawn, ChildProcess } from 'child_process'
import path from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PythonOcrResult {
  lastName?: string
  firstName?: string
  birthDate?: string
  birthPlace?: string
  documentNumber?: string
  documentExpiry?: string
  nationality?: string
  sex?: 'M' | 'F'
  confidence: number
  engine: string
}

// ─── État interne ─────────────────────────────────────────────────────────────

const PYTHON_OCR_PORT = 5001
const PYTHON_OCR_BASE = `http://127.0.0.1:${PYTHON_OCR_PORT}`
const SCAN_TIMEOUT_MS = 15_000
const HEALTH_RETRY_INTERVAL_MS = 2_000
const HEALTH_MAX_WAIT_MS = 30_000

let _proc: ChildProcess | null = null
let _available: boolean | null = null  // null = pas encore connu
let _preloading = false

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForHealth(): Promise<boolean> {
  const deadline = Date.now() + HEALTH_MAX_WAIT_MS
  while (Date.now() < deadline) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 2_000)
      const res = await fetch(`${PYTHON_OCR_BASE}/health`, { signal: controller.signal })
      clearTimeout(timer)
      if (res.ok) return true
    } catch {
      // pas encore prêt
    }
    await sleep(HEALTH_RETRY_INTERVAL_MS)
  }
  return false
}

// ─── Lancement du subprocess ──────────────────────────────────────────────────

/**
 * Lance le service FastAPI Python en arrière-plan.
 * Appelé une seule fois au démarrage du serveur Node.js.
 * N'attend pas que le service soit prêt — non bloquant.
 */
export function preloadPythonOcrService(): void {
  const enabled = process.env.PYTHON_OCR_ENABLED
  if (enabled === 'false') {
    console.info('[pythonOcr] Désactivé via PYTHON_OCR_ENABLED=false')
    _available = false
    return
  }

  if (_preloading || _available === true) return
  _preloading = true

  const scriptPath = path.join(process.cwd(), 'server', 'scripts', 'ocr_api.py')

  try {
    _proc = spawn('python3', [scriptPath, String(PYTHON_OCR_PORT)], {
      detached: false,
      stdio: 'inherit',
    })

    _proc.on('error', (e) => {
      console.warn('[pythonOcr] Erreur process:', e.message)
      _available = false
      _proc = null
      _preloading = false
    })

    _proc.on('exit', (code) => {
      if (_available === true) {
        console.warn(`[pythonOcr] Service terminé (code ${code})`)
        _available = false
        _proc = null
        _preloading = false
      }
    })

    // Attend /health en arrière-plan
    waitForHealth().then((ok) => {
      _available = ok
      _preloading = false
      if (ok) {
        console.info('[pythonOcr] Service FastAPI prêt sur :5001 (fastmrz + PaddleOCR)')
      } else {
        console.warn('[pythonOcr] Service FastAPI non disponible après 30s')
        if (_proc) { _proc.kill(); _proc = null }
      }
    }).catch(() => {
      _available = false
      _preloading = false
    })

  } catch (e) {
    console.warn('[pythonOcr] Impossible de lancer python3:', (e as Error)?.message)
    _available = false
    _preloading = false
  }
}

// ─── Analyse principale ───────────────────────────────────────────────────────

/**
 * Envoie l'image au service FastAPI Python et retourne les champs extraits.
 * Retourne null si le service n'est pas disponible ou si le timeout expire.
 */
export async function analyzeWithPythonOcr(
  imageBuffer: Buffer,
  docType: 'CNI' | 'PERMIS_CONDUIRE' | 'PASSEPORT',
): Promise<PythonOcrResult | null> {
  // Vérifie disponibilité (null = en cours de démarrage → attendre un peu)
  if (_available === false) return null
  if (_available === null) {
    // Donne 5s supplémentaires si on est en phase de démarrage
    const waited = Date.now()
    while (_available === null && Date.now() - waited < 5_000) {
      await sleep(500)
    }
    if (_available !== true) return null
  }

  try {
    const base64Image = imageBuffer.toString('base64')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS)

    const res = await fetch(`${PYTHON_OCR_BASE}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image, docType }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!res.ok) {
      console.warn(`[pythonOcr] HTTP ${res.status}`)
      return null
    }

    const data = await res.json() as PythonOcrResult
    if (!data || typeof data.confidence !== 'number') return null

    console.info(
      `[pythonOcr] ${docType} — engine=${data.engine} conf=${data.confidence}%`,
      `lastName=${data.lastName} firstName=${data.firstName} birthDate=${data.birthDate}`,
    )

    return data

  } catch (e) {
    const msg = (e as Error)?.message ?? ''
    if (msg.includes('abort') || msg.includes('fetch')) {
      console.warn('[pythonOcr] Timeout ou réseau:', msg)
    } else {
      console.warn('[pythonOcr] Erreur:', msg)
    }
    return null
  }
}
