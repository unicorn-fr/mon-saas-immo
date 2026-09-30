import { execFile } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { HttpError } from '../../lib/http.js'
import { preparePage } from './image.js'

/**
 * Obtention du texte d'un bail, entièrement sur le serveur :
 * - PDF avec texte (bail tapé à l'ordinateur) : texte lu directement (pdftotext) ;
 * - PDF scanné ou photos : chaque page est redressée puis lue par Tesseract (français).
 * Les fichiers de travail sont écrits dans un dossier temporaire privé, supprimé à la fin.
 */

export interface UploadedFile {
  buffer: Buffer
  mimetype: string
  originalname: string
}

const MAX_PAGES = 15
const TOOL_TIMEOUT = 120_000

function run(cmd: string, args: string[], timeout = TOOL_TIMEOUT): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      // Un seul cœur par lecture : le serveur reste disponible pour les autres visiteurs.
      { timeout, maxBuffer: 32 * 1024 * 1024, env: { ...process.env, OMP_THREAD_LIMIT: '1' } },
      (err, stdout) => (err ? reject(err) : resolve(stdout)),
    )
  })
}

let availability: Promise<boolean> | null = null

/** Tesseract (avec le français) et les outils PDF sont-ils installés ? */
export function ocrAvailable(): Promise<boolean> {
  const installed = (cmd: string, args: string[]) => run(cmd, args, 10_000).then(() => true, (e: NodeJS.ErrnoException) => e.code !== 'ENOENT')
  availability ??= (async () => {
    try {
      const langs = await run('tesseract', ['--list-langs'], 10_000)
      return /\bfra\b/.test(langs) && (await installed('pdftotext', ['-v'])) && (await installed('pdftoppm', ['-v']))
    } catch {
      return false
    }
  })()
  return availability
}

// ── File d'attente : une lecture à la fois ───────────────────────────────────

const MAX_WAITING = 8
let running = 0
const waiting: (() => void)[] = []

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= 1) {
    if (waiting.length >= MAX_WAITING) throw new HttpError(503, 'Beaucoup de baux sont en cours de lecture. Réessayez dans une minute.')
    // La place est transmise directement par la lecture qui se termine (running reste à 1).
    await new Promise<void>((resolve) => waiting.push(resolve))
  } else {
    running = 1
  }
  try {
    return await fn()
  } finally {
    const next = waiting.shift()
    if (next) next()
    else running = 0
  }
}

// ── Qualité de lecture ───────────────────────────────────────────────────────

const COMMON = new Set('le la les de du des et a au en un une pour par sur dans est sont que qui ce cette il elle bail loyer locataire bailleur contrat logement mois charges date montant garantie depot presente conditions ne pas'.split(' '))

/** Part des mots courants du français : proche de 0 si la page est à l'envers ou illisible. */
export function readability(text: string): number {
  const words = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 1)
  if (words.length < 15) return 0
  return words.filter((w) => COMMON.has(w)).length / words.length
}

async function tesseract(file: string): Promise<string> {
  return run('tesseract', [file, 'stdout', '-l', 'fra', '--oem', '1', '--psm', '4', '-c', 'preserve_interword_spaces=1'])
}

/** Orientation de la page (0, 90, 180, 270) selon Tesseract, si elle est déterminable. */
async function orientation(file: string): Promise<number | null> {
  try {
    const out = await run('tesseract', [file, 'stdout', '--psm', '0', '-l', 'osd'], 30_000)
    const m = /Rotate:\s*(\d+)/.exec(out)
    const conf = Number(/Orientation confidence:\s*([\d.]+)/.exec(out)?.[1] ?? 0)
    return m && conf >= 1 ? Number(m[1]) : null
  } catch {
    return null
  }
}

/** Lit une photo de page. Si le texte obtenu est illisible, la page est retournée (photo prise de travers). */
async function readPhoto(image: Buffer, dir: string, index: number): Promise<string> {
  const file = join(dir, `page-${index}.png`)
  await writeFile(file, await preparePage(image), { mode: 0o600 })
  let text = await tesseract(file)
  if (readability(text) >= 0.12) return text

  const tried = new Set<number>([0])
  const detected = await orientation(file)
  const candidates = [detected, 90, 270, 180].filter((r): r is number => r !== null && !tried.has(r))
  for (const rotation of candidates) {
    if (tried.has(rotation)) continue
    tried.add(rotation)
    await writeFile(file, await preparePage(image, rotation), { mode: 0o600 })
    const attempt = await tesseract(file)
    if (readability(attempt) > readability(text)) text = attempt
    if (readability(text) >= 0.12) break
  }
  return text
}

async function pageCount(pdf: string): Promise<number> {
  try {
    const info = await run('pdfinfo', [pdf], 20_000)
    return Number(/Pages:\s*(\d+)/.exec(info)?.[1] ?? 1)
  } catch {
    throw new HttpError(422, "Ce PDF ne s'ouvre pas. Il est peut-être protégé par un mot de passe ou abîmé.")
  }
}

export interface DocumentText {
  text: string
  pages: number
  /** true si la reconnaissance de caractères a été nécessaire (photos, scan). */
  scanned: boolean
}

export async function documentText(files: UploadedFile[]): Promise<DocumentText> {
  if (!(await ocrAvailable())) throw new HttpError(503, "La lecture automatique n'est pas disponible pour le moment.")
  return withSlot(async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bailio-import-'))
    try {
      if (files.length === 1 && files[0].mimetype === 'application/pdf') {
        const pdf = join(dir, 'bail.pdf')
        await writeFile(pdf, files[0].buffer, { mode: 0o600 })
        const pages = Math.min(await pageCount(pdf), MAX_PAGES)
        const text = await run('pdftotext', ['-layout', '-enc', 'UTF-8', '-l', String(pages), pdf, '-'])
        // Un PDF tapé contient du texte sur chaque page ; un scan n'en contient pas (ou presque).
        if (text.replace(/\s/g, '').length >= 250 * pages) return { text, pages, scanned: false }

        await run('pdftoppm', ['-r', '300', '-gray', '-png', '-l', String(pages), pdf, join(dir, 'scan')])
        const images = (await readdir(dir)).filter((f) => f.startsWith('scan')).sort()
        const texts: string[] = []
        for (const [i, name] of images.entries()) texts.push(await readPhoto(await readFile(join(dir, name)), dir, i))
        return { text: texts.join('\n\n'), pages: images.length, scanned: true }
      }

      const texts: string[] = []
      for (const [i, f] of files.slice(0, MAX_PAGES).entries()) texts.push(await readPhoto(f.buffer, dir, i))
      return { text: texts.join('\n\n'), pages: texts.length, scanned: true }
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
}
