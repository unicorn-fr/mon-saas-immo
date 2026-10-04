/**
 * Lecture d'un relevé de compte téléchargé depuis l'espace en ligne de la banque, sur notre serveur uniquement.
 * Formats : CSV (export « tableur » des banques françaises : séparateur ; ou , ou tabulation, dates JJ/MM/AAAA ou
 * AAAA-MM-JJ, montants à virgule, colonne « Montant » signée ou colonnes « Débit » / « Crédit ») et OFX/QIF-OFX
 * (« Money », « Quicken »). Seuls les crédits servent : rien n'est conservé après le rapprochement.
 */

export interface BankTransaction {
  /** AAAA-MM-JJ */
  date: string
  /** Positif pour un crédit, négatif pour un débit. */
  amountCents: number
  label: string
}

const strip = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/** « 1 234,56 », « -1234.56 », « 1.234,56 € », « +850,00 » → centimes. */
export function parseAmount(raw: string): number | null {
  let s = raw.replace(/[\s  €]|EUR/gi, '').replace(/^\+/, '')
  if (!s) return null
  const neg = /^-|^\(.*\)$|-$/.test(s)
  s = s.replace(/[()\-]/g, '')
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.')
  else if (lastDot > lastComma && lastComma >= 0) s = s.replace(/,/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  const cents = Math.round(Number(s) * 100)
  return neg ? -cents : cents
}

/** « 05/10/2026 », « 05-10-26 », « 2026-10-05 », « 20261005 » → AAAA-MM-JJ. */
export function parseDate(raw: string): string | null {
  const s = raw.trim()
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3]
    const d = Number(m[1])
    const mo = Number(m[2])
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  m = s.match(/^(\d{4})(\d{2})(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  return null
}

function splitLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"'
        i++
      } else quoted = !quoted
    } else if (ch === sep && !quoted) {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  out.push(cur.trim())
  return out
}

function parseCsv(text: string): BankTransaction[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  const sep = [';', '\t', ','].map((c) => ({ c, n: lines.slice(0, 20).reduce((a, l) => a + l.split(c).length - 1, 0) })).sort((a, b) => b.n - a.n)[0].c
  const rows = lines.map((l) => splitLine(l, sep))
  // Ligne d'en-tête : la première qui nomme une date et un montant (les banques ajoutent souvent quelques lignes avant).
  const headerAt = rows.findIndex((r) => r.some((c) => /date/.test(strip(c))) && r.some((c) => /montant|credit|debit|amount/.test(strip(c))))
  const header = headerAt >= 0 ? rows[headerAt].map(strip) : []
  const find = (re: RegExp, not?: RegExp) => header.findIndex((h) => re.test(h) && !(not && not.test(h)))
  let iDate = find(/date (de )?(l.)?operation|^date$|date op|date comptable|booking date|^date/, /valeur/)
  if (iDate < 0) iDate = find(/date/)
  const iCredit = find(/credit/)
  const iDebit = find(/debit/)
  const iAmount = find(/montant|amount|somme/)
  const iLabel = (() => {
    const all = header.map((h, i) => (/libelle|label|description|intitule|detail|operation|nature|tiers|beneficiaire|motif|information/.test(h) && !/date/.test(h) ? i : -1)).filter((i) => i >= 0)
    return all
  })()
  const body = headerAt >= 0 ? rows.slice(headerAt + 1) : rows
  const out: BankTransaction[] = []
  for (const r of body) {
    const date = parseDate(r[iDate >= 0 ? iDate : 0] ?? '')
    if (!date) continue
    let amount: number | null = null
    if (iCredit >= 0 || iDebit >= 0) {
      const cr = iCredit >= 0 ? parseAmount(r[iCredit] ?? '') : null
      const db = iDebit >= 0 ? parseAmount(r[iDebit] ?? '') : null
      if (cr) amount = Math.abs(cr)
      else if (db) amount = -Math.abs(db)
    } else if (iAmount >= 0) amount = parseAmount(r[iAmount] ?? '')
    else {
      // Sans en-tête : la dernière colonne qui ressemble à un montant.
      for (let i = r.length - 1; i > 0 && amount === null; i--) amount = parseAmount(r[i])
    }
    if (amount === null || amount === 0) continue
    const label = (iLabel.length ? iLabel.map((i) => r[i] ?? '') : r.filter((_, i) => i !== iDate)).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
    out.push({ date, amountCents: amount, label })
  }
  return out
}

function parseOfx(text: string): BankTransaction[] {
  const out: BankTransaction[] = []
  const tag = (block: string, name: string) => block.match(new RegExp(`<${name}>([^<\\r\\n]*)`, 'i'))?.[1]?.trim() ?? ''
  for (const block of text.split(/<STMTTRN>/i).slice(1)) {
    const date = parseDate(tag(block, 'DTPOSTED'))
    const amount = parseAmount(tag(block, 'TRNAMT'))
    if (!date || amount === null || amount === 0) continue
    out.push({ date, amountCents: amount, label: [tag(block, 'NAME'), tag(block, 'MEMO')].filter(Boolean).join(' ').replace(/\s+/g, ' ') })
  }
  return out
}

/** Relevé lu, quel que soit son format ; une erreur claire si rien n'est reconnu. */
export function parseStatement(buf: Buffer): BankTransaction[] {
  // Les exports des banques françaises sont en UTF-8 ou en Windows-1252.
  let text = buf.toString('utf8')
  if (text.includes('�')) text = buf.toString('latin1')
  text = text.replace(/^﻿/, '')
  const tx = /<OFX>|<STMTTRN>/i.test(text) ? parseOfx(text) : parseCsv(text)
  if (!tx.length) throw new Error('Aucune opération reconnue dans ce fichier. Téléchargez le relevé au format CSV ou OFX depuis l’espace en ligne de votre banque.')
  return tx
}
