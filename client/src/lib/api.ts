import { DRAFT_KEY, SESSION_KEY, storage } from './storage'

// URL de l'API, avec ou sans « /api » ou « /api/v1 » à la fin (ancien format accepté).
export const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/+$/, '').replace(/\/api(\/v\d+)?$/, '')
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
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method: opts.method ?? 'GET',
      headers: headers(opts),
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      signal: opts.signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError('Connexion impossible. Vérifiez votre accès à internet.', 0)
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
