import { execFile } from 'node:child_process'
import { HttpError } from '../lib/http.js'

/** Plus grand côté accepté pour une page (en points PDF, 1 pt = 1/72 de pouce) : 3 000 pt ≈ 1,06 m. */
const MAX_SIDE = 3000
/** Plus grande surface acceptée (≈ format A1) : au-delà, la page dessinée en image saturerait la mémoire du serveur. */
const MAX_AREA = 4_500_000

/** Dimensions des pages 1 à `lastPage`, lues par pdfinfo (poppler) sans dessiner la page. */
async function pageSizes(pdf: string, lastPage: number): Promise<{ w: number; h: number }[]> {
  const out = await new Promise<string>((resolve, reject) =>
    execFile('pdfinfo', ['-f', '1', '-l', String(lastPage), pdf], { timeout: 20_000, maxBuffer: 1024 * 1024 }, (err, stdout) => (err ? reject(err) : resolve(stdout))),
  )
  return [...out.matchAll(/Page\s+\d+\s+size:\s*([\d.]+)\s*x\s*([\d.]+)/g)].map((m) => ({ w: Number(m[1]), h: Number(m[2]) }))
}

/**
 * Refuse un PDF dont une page est démesurée avant de la dessiner : un fichier de quelques centaines d'octets peut
 * déclarer une page de plusieurs mètres de côté, et sa conversion en image demanderait des gigaoctets de mémoire.
 * Un PDF illisible n'est pas refusé ici : l'étape suivante le signale avec son propre message.
 */
export async function assertReasonablePages(pdf: string, lastPage: number): Promise<void> {
  let sizes: { w: number; h: number }[]
  try {
    sizes = await pageSizes(pdf, lastPage)
  } catch {
    return
  }
  if (sizes.some((s) => s.w > MAX_SIDE || s.h > MAX_SIDE || s.w * s.h > MAX_AREA)) {
    throw new HttpError(400, 'Une page de ce PDF est beaucoup trop grande. Envoyez plutôt une photo ou un scan au format A4.')
  }
}
