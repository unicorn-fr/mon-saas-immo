import { downloadPdf, openPdfFrom, pdfUrl, printPdf } from './api'

/** Actions sur un PDF protégé par la session : ouvrir, imprimer, télécharger. */

export function openDoc(path: string, opts: { method?: 'POST'; body?: unknown } = {}): Promise<void> {
  return openPdfFrom(() => pdfUrl(path, { ...opts, timeout: 60_000 }))
}

export async function printDoc(path: string, opts: { method?: 'POST'; body?: unknown } = {}): Promise<void> {
  printPdf(await pdfUrl(path, { ...opts, timeout: 60_000 }))
}

export async function downloadDoc(path: string, filename: string): Promise<void> {
  const sep = path.includes('?') ? '&' : '?'
  downloadPdf(await pdfUrl(`${path}${sep}download=1`, { timeout: 60_000 }), filename)
}

export const documentPath = (id: string) => `/documents/${id}/file`

export function slug(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'document'
  )
}
