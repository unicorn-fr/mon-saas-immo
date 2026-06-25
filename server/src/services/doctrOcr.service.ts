/**
 * Wrapper Node.js pour le subprocess Python doctr.
 *
 * doctr (github.com/mindee/doctr) est le modèle open source de Mindee — MIT License.
 * C'est exactement le même moteur que l'API Mindee payante.
 *
 * Architecture : subprocess persistant (chargement une fois au démarrage)
 *   Node.js → stdin  JSON : { image: "<base64>", docType: "CNI" }
 *   Node.js ← stdout JSON : { fullText, textZoneText, mrzText, confidence, engine }
 *
 * Activation : pip install "python-doctr[torch]"
 * Si Python/doctr non disponible → retourne null → fallback Google Vision / Tesseract
 */

import { spawn, ChildProcess } from 'child_process'
import { createInterface, Interface as ReadlineInterface } from 'readline'
import path from 'path'

// Chemin absolu vers le script Python (indépendant du répertoire courant)
// En développement : process.cwd() = project root
// En production Railway : idem
const SCRIPT_PATH = path.join(process.cwd(), 'server', 'scripts', 'doctr_ocr.py')

interface PendingRequest {
  resolve: (result: DoctrResult | null) => void
  timer: ReturnType<typeof setTimeout>
}

interface DoctrFieldValue {
  value: string | string[]
  confidence: number
}

export interface DoctrFields {
  lastName?:        DoctrFieldValue
  firstName?:       DoctrFieldValue
  birthDate?:       DoctrFieldValue
  birthPlace?:      DoctrFieldValue
  documentNumber?:  DoctrFieldValue
  documentExpiry?:  DoctrFieldValue
  issueDate?:       DoctrFieldValue
  authority?:       DoctrFieldValue
  sex?:             DoctrFieldValue
  nationality?:     DoctrFieldValue
  categories?:      DoctrFieldValue
}

interface DoctrResult {
  fullText: string
  textZoneText: string
  mrzText: string
  confidence: number
  fields?: DoctrFields  // champs structurés extraits spatialement
}

interface DoctrWorker {
  proc: ChildProcess
  rl: ReadlineInterface
  ready: boolean
  queue: PendingRequest[]
}

let _worker: DoctrWorker | null = null
let _available: boolean | null = null  // null = pas encore vérifié
let _initPromise: Promise<DoctrWorker | null> | null = null

const REQUEST_TIMEOUT_MS = 45_000   // 45s max par image
const INIT_TIMEOUT_MS    = 90_000   // 90s pour charger le modèle (1er téléchargement ~500MB)

// ─── Initialisation du subprocess ─────────────────────────────────────────────

function initDoctrWorker(): Promise<DoctrWorker | null> {
  if (_initPromise) return _initPromise

  _initPromise = new Promise<DoctrWorker | null>((resolve) => {
    let proc: ChildProcess
    try {
      proc = spawn('python3', [SCRIPT_PATH], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      })
    } catch {
      _available = false
      _initPromise = null
      return resolve(null)
    }

    const rl = createInterface({ input: proc.stdout! })
    const worker: DoctrWorker = { proc, rl, ready: false, queue: [] }

    let firstLine = true
    let initTimer: ReturnType<typeof setTimeout>

    // Timeout démarrage (téléchargement modèle peut prendre du temps)
    initTimer = setTimeout(() => {
      if (!worker.ready) {
        console.warn('[doctr] Timeout démarrage — doctr non disponible')
        _available = false
        _initPromise = null
        proc.kill()
        resolve(null)
      }
    }, INIT_TIMEOUT_MS)

    rl.on('line', (line) => {
      if (firstLine) {
        firstLine = false
        clearTimeout(initTimer)
        try {
          const msg = JSON.parse(line)
          if (msg.ready) {
            worker.ready = true
            _worker = worker
            _available = true
            console.info('[doctr] Worker prêt — modèle db_resnet50 + crnn_mobilenet_v3_large')
            resolve(worker)
          } else {
            console.warn('[doctr] Non disponible:', msg.error, msg.message ?? '')
            _available = false
            _initPromise = null
            proc.kill()
            resolve(null)
          }
        } catch {
          _available = false
          _initPromise = null
          proc.kill()
          resolve(null)
        }
        return
      }

      // Lignes suivantes = résultats OCR
      const pending = worker.queue.shift()
      if (!pending) return
      clearTimeout(pending.timer)
      try {
        const result = JSON.parse(line)
        if (result.error) {
          console.warn('[doctr] Erreur traitement:', result.message)
          pending.resolve(null)
        } else {
          pending.resolve({
            fullText:      result.fullText      ?? '',
            textZoneText:  result.textZoneText  ?? '',
            mrzText:       result.mrzText       ?? '',
            confidence:    result.confidence    ?? 0,
            fields:        result.fields,        // extraction spatiale
          })
        }
      } catch {
        pending.resolve(null)
      }
    })

    proc.stderr?.on('data', (d: Buffer) => {
      const msg = d.toString().trim()
      // Filtre les logs PyTorch/TF normaux (UserWarning, DeprecationWarning, etc.)
      if (msg && !msg.includes('Warning') && !msg.includes('FutureWarning') && !msg.includes('DeprecationWarning')) {
        console.warn('[doctr stderr]', msg.substring(0, 200))
      }
    })

    proc.on('error', (e) => {
      console.warn('[doctr] Erreur process:', e.message)
      _available = false
      _worker = null
      _initPromise = null
      // Résout les requêtes en attente
      worker.queue.forEach(p => { clearTimeout(p.timer); p.resolve(null) })
      worker.queue.length = 0
    })

    proc.on('exit', (code) => {
      if (worker.ready) {
        console.warn(`[doctr] Process terminé (code ${code}) — reset`)
        _available = false
        _worker = null
        _initPromise = null
        worker.queue.forEach(p => { clearTimeout(p.timer); p.resolve(null) })
        worker.queue.length = 0
      }
    })
  })

  return _initPromise
}

// ─── Pré-chauffe au démarrage du serveur ──────────────────────────────────────

export function preloadDoctrWorker(): void {
  initDoctrWorker().catch(() => {})
}

// ─── Fonction principale ──────────────────────────────────────────────────────

/**
 * Lance une analyse OCR via doctr.
 * Retourne null si doctr n'est pas installé ou si le traitement échoue.
 */
export async function ocrWithDoctr(
  imageBuffer: Buffer,
  docType: 'CNI' | 'PERMIS_CONDUIRE'
): Promise<DoctrResult | null> {
  if (_available === false) return null

  const worker = await initDoctrWorker()
  if (!worker) return null

  return new Promise<DoctrResult | null>((resolve) => {
    const timer = setTimeout(() => {
      const idx = worker.queue.findIndex(p => p.resolve === resolve)
      if (idx >= 0) worker.queue.splice(idx, 1)
      console.warn('[doctr] Timeout requête')
      resolve(null)
    }, REQUEST_TIMEOUT_MS)

    worker.queue.push({ resolve, timer })

    const payload = JSON.stringify({
      image: imageBuffer.toString('base64'),
      docType,
    })

    try {
      worker.proc.stdin!.write(payload + '\n')
    } catch {
      clearTimeout(timer)
      const idx = worker.queue.findIndex(p => p.resolve === resolve)
      if (idx >= 0) worker.queue.splice(idx, 1)
      resolve(null)
    }
  })
}
