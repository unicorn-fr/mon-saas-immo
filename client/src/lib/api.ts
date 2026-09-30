import { DRAFT_KEY, SESSION_KEY, storage } from './storage'

// L'API est toujours appelée sur la même adresse que le site (/api) : relayée par Vercel (vercel.json),
// par Caddy sur le serveur, ou par Vite en local. Le navigateur ne contacte donc jamais un autre domaine,
// ce qui évite les blocages (filtres réseau, bloqueurs, domaine récent) et les requêtes CORS.
export const API_BASE = ''
const BASE = API_BASE

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message)
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  form?: FormData
  draft?: boolean // envoie le jeton du brouillon
  signal?: AbortSignal
  /** Délai maximum en millisecondes (20 s par défaut) : au-delà, un message s'affiche au lieu d'une attente sans fin. */
  timeout?: number
}

function headers(opts: RequestOptions): Headers {
  const h = new Headers()
  const session = storage.get(SESSION_KEY)
  if (session) h.set('Authorization', `Bearer ${session}`)
  if (opts.draft) {
    const draft = storage.get(DRAFT_KEY)
    if (draft) h.set('X-Draft-Token', draft)
  }
  if (opts.body !== undefined) h.set('Content-Type', 'application/json')
  return h
}

async function raw(path: string, opts: RequestOptions = {}): Promise<Response> {
  let res: Response
  // AbortController + minuterie plutôt qu'AbortSignal.any/timeout, absents des iPhone plus anciens.
  const controller = new AbortController()
  let timedOut = false
  const timer = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, opts.timeout ?? 20_000)
  const forward = () => controller.abort()
  opts.signal?.addEventListener('abort', forward)
  const signal = controller.signal
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method: opts.method ?? 'GET',
      headers: headers(opts),
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      signal,
    })
  } catch (err) {
    if (opts.signal?.aborted) throw err
    if (timedOut) throw new ApiError('Le serveur met trop de temps à répondre. Réessayez dans un instant.', 0)
    throw new ApiError('Connexion impossible. Vérifiez votre accès à internet.', 0)
  } finally {
    window.clearTimeout(timer)
    opts.signal?.removeEventListener('abort', forward)
  }
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new ApiError(json?.message ?? 'Une erreur est survenue.', res.status, json?.details)
  }
  return res
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await raw(path, opts)
  const json = await res.json()
  return json.data as T
}

/** Récupère un PDF protégé (session ou brouillon) sous forme d'URL locale. */
export async function pdfUrl(path: string, opts: RequestOptions = {}): Promise<string> {
  const res = await raw(path, opts)
  return URL.createObjectURL(await res.blob())
}

/**
 * Ouvre un PDF dans un nouvel onglet. L'onglet est ouvert tout de suite (pendant le clic),
 * sinon le navigateur le bloquerait comme une fenêtre surgissante.
 */
export async function openPdfFrom(getUrl: () => Promise<string>): Promise<void> {
  const tab = window.open('about:blank', '_blank')
  try {
    const url = await getUrl()
    if (tab) tab.location.href = url
    else window.location.href = url
  } catch (err) {
    tab?.close()
    throw err
  }
}

export function downloadPdf(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Imprime un PDF sans quitter la page (repli : ouverture dans un nouvel onglet). */
export function printPdf(url: string): void {
  const frame = document.createElement('iframe')
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  frame.src = url
  frame.onload = () => {
    try {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    } catch {
      window.open(url, '_blank')
    }
    setTimeout(() => frame.remove(), 60_000)
  }
  document.body.appendChild(frame)
}
