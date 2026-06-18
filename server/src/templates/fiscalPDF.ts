import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface FiscalPDFData {
  year: number
  ownerName: string
  generatedDate: string
  regime: string
  summary: {
    totalRevenusBruts: number
    totalChargesDeductibles: number
    totalInteretsEmprunt: number
    revenuNetFoncier: number
  }
  properties: Array<{ title: string; address: string; revenus: number; charges: number }>
  form2044: { ligne110: number; ligne220: number; ligne420: number; ligne430: number; ligne440: number; ligne240: number }
  form2042: { case4BA: number; case4BC: number; case4BE: number }
  loans: Array<{ bankName: string; totalAmount: number; interestRate: number; annualInterests: number }>
}

const INK     = rgb(0.051, 0.047, 0.039)   // #0d0c0a
const INK_MID = rgb(0.353, 0.341, 0.329)   // #5a5754
const OWNER   = rgb(0.102, 0.196, 0.439)   // #1a3270
const CARAMEL = rgb(0.769, 0.592, 0.416)   // #c4976a
const TENANT  = rgb(0.106, 0.369, 0.231)   // #1b5e3b
const ERROR   = rgb(0.608, 0.110, 0.110)   // #9b1c1c
const BORDER  = rgb(0.600, 0.600, 0.600)
const BLACK   = rgb(0, 0, 0)

function formatEur(amount: number): string {
  return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export async function generateFiscalPDF(data: FiscalPDFData): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  const W = 595
  const H = 842
  const ML = 50   // margin left
  const MR = 50   // margin right
  const contentW = W - ML - MR

  // ════════════════════════════════════════════════════════════════
  //  PAGE 1
  // ════════════════════════════════════════════════════════════════
  const page1 = doc.addPage([W, H])
  let y = H - 30

  // bailio.fr — top right
  page1.drawText('bailio.fr', {
    x: W - 100, y, font: regular, size: 8, color: INK_MID,
  })

  y = H - 55

  // Caramel overline
  page1.drawText('Rapport Fiscal · Bailio', {
    x: ML, y, font: bold, size: 10, color: CARAMEL,
  })
  y -= 20

  // Main title
  page1.drawText(`RAPPORT FISCAL ${data.year}`, {
    x: ML, y, font: bold, size: 18, color: BLACK,
  })
  y -= 16

  // Subtitle
  page1.drawText(`Généré le ${data.generatedDate} · ${data.ownerName}`, {
    x: ML, y, font: regular, size: 10, color: INK_MID,
  })
  y -= 18

  // Horizontal separator
  page1.drawLine({ start: { x: ML, y }, end: { x: W - MR, y }, thickness: 0.75, color: BLACK })
  y -= 22

  // ── Section helper ──────────────────────────────────────────────
  const drawSectionTitle = (page: ReturnType<typeof doc.addPage>, title: string, yPos: number): number => {
    page.drawText(title, { x: ML, y: yPos, font: bold, size: 10, color: BLACK })
    yPos -= 6
    page.drawLine({ start: { x: ML, y: yPos }, end: { x: W - MR, y: yPos }, thickness: 0.5, color: BORDER })
    return yPos - 14
  }

  // ── SYNTHÈSE FINANCIÈRE ─────────────────────────────────────────
  y = drawSectionTitle(page1, 'SYNTHÈSE FINANCIÈRE', y)

  const synthRows: Array<{ label: string; value: string; color: ReturnType<typeof rgb> }> = [
    { label: 'Revenus fonciers bruts', value: formatEur(data.summary.totalRevenusBruts), color: OWNER },
    { label: 'Charges déductibles', value: '-' + formatEur(data.summary.totalChargesDeductibles), color: INK },
    { label: "dont Intérêts d'emprunt", value: formatEur(data.summary.totalInteretsEmprunt), color: INK_MID },
    {
      label: 'Revenu net foncier',
      value: formatEur(data.summary.revenuNetFoncier),
      color: data.summary.revenuNetFoncier >= 0 ? TENANT : ERROR,
    },
  ]

  for (const row of synthRows) {
    page1.drawText(row.label, { x: ML + 8, y, font: regular, size: 10, color: INK_MID })
    page1.drawText(row.value, { x: W - MR - 120, y, font: bold, size: 10, color: row.color })
    y -= 16
  }
  y -= 8

  // ── RÉGIME FISCAL APPLICABLE ────────────────────────────────────
  y = drawSectionTitle(page1, 'RÉGIME FISCAL APPLICABLE', y)

  // Badge-style: rect behind text
  const badgeText = data.regime
  const badgeTextWidth = bold.widthOfTextAtSize(badgeText, 10)
  const badgePadH = 10
  const badgePadV = 6
  page1.drawRectangle({
    x: ML, y: y - badgePadV,
    width: badgeTextWidth + badgePadH * 2,
    height: 10 + badgePadV * 2,
    color: rgb(0.918, 0.941, 0.980),  // ownerLight approx
    borderColor: OWNER,
    borderWidth: 0.75,
  })
  page1.drawText(badgeText, { x: ML + badgePadH, y, font: bold, size: 10, color: OWNER })
  y -= 10 + badgePadV * 2 + 16

  // ── FORMULAIRE 2044 ─────────────────────────────────────────────
  y = drawSectionTitle(page1, 'FORMULAIRE 2044 — REVENUS FONCIERS', y)

  const form2044Rows = [
    { ligne: '110', label: 'Loyers encaissés', amount: data.form2044.ligne110 },
    { ligne: '220', label: 'Total charges déductibles', amount: data.form2044.ligne220 },
    { ligne: '420', label: "Intérêts d'emprunt", amount: data.form2044.ligne420 },
    { ligne: '430', label: 'Primes d\'assurance', amount: data.form2044.ligne430 },
    { ligne: '440', label: 'Frais de gestion & divers', amount: data.form2044.ligne440 },
    { ligne: '240', label: 'Revenu net foncier', amount: data.form2044.ligne240 },
  ]

  // Table header
  page1.drawRectangle({
    x: ML, y: y - 2, width: contentW, height: 14,
    color: rgb(0.965, 0.961, 0.953),
  })
  page1.drawText('Ligne', { x: ML + 4, y, font: bold, size: 8, color: INK_MID })
  page1.drawText('Libellé', { x: ML + 60, y, font: bold, size: 8, color: INK_MID })
  page1.drawText('Montant', { x: W - MR - 80, y, font: bold, size: 8, color: INK_MID })
  y -= 16

  for (const row of form2044Rows) {
    const isNet = row.ligne === '240'
    page1.drawText(`Ligne ${row.ligne}`, { x: ML + 4, y, font: isNet ? bold : regular, size: 9, color: INK_MID })
    page1.drawText(row.label, { x: ML + 60, y, font: isNet ? bold : regular, size: 9, color: INK })
    page1.drawText(formatEur(row.amount), {
      x: W - MR - 80, y,
      font: bold, size: 9,
      color: isNet ? (row.amount >= 0 ? TENANT : ERROR) : INK,
    })
    // thin separator
    page1.drawLine({
      start: { x: ML, y: y - 4 }, end: { x: W - MR, y: y - 4 },
      thickness: 0.3, color: rgb(0.878, 0.875, 0.863),
    })
    y -= 16
  }
  y -= 8

  // ── FORMULAIRE 2042 ─────────────────────────────────────────────
  y = drawSectionTitle(page1, 'FORMULAIRE 2042 — DÉCLARATION PRINCIPALE', y)

  const form2042Rows = [
    { case: '4BA', label: 'Revenu net foncier', amount: data.form2042.case4BA },
    { case: '4BE', label: 'Revenus bruts', amount: data.form2042.case4BE },
  ]

  for (const row of form2042Rows) {
    page1.drawText(`Case ${row.case}`, { x: ML + 4, y, font: bold, size: 9, color: OWNER })
    page1.drawText(row.label, { x: ML + 70, y, font: regular, size: 9, color: INK })
    page1.drawText(formatEur(row.amount), { x: W - MR - 80, y, font: bold, size: 9, color: INK })
    y -= 16
  }

  // ════════════════════════════════════════════════════════════════
  //  PAGE 2
  // ════════════════════════════════════════════════════════════════
  const page2 = doc.addPage([W, H])
  y = H - 30

  // bailio.fr — top right
  page2.drawText('bailio.fr', {
    x: W - 100, y, font: regular, size: 8, color: INK_MID,
  })

  y = H - 55

  // ── DÉTAIL PAR BIEN ─────────────────────────────────────────────
  y = drawSectionTitle(page2, 'DÉTAIL PAR BIEN IMMOBILIER', y)

  // Table header
  page2.drawRectangle({
    x: ML, y: y - 2, width: contentW, height: 14,
    color: rgb(0.965, 0.961, 0.953),
  })
  const colBien = ML + 4
  const colAdresse = ML + 130
  const colRevenus = ML + 310
  const colCharges = ML + 380
  const colNet     = W - MR - 60

  page2.drawText('Bien', { x: colBien, y, font: bold, size: 8, color: INK_MID })
  page2.drawText('Adresse', { x: colAdresse, y, font: bold, size: 8, color: INK_MID })
  page2.drawText('Revenus', { x: colRevenus, y, font: bold, size: 8, color: INK_MID })
  page2.drawText('Charges', { x: colCharges, y, font: bold, size: 8, color: INK_MID })
  page2.drawText('Net', { x: colNet, y, font: bold, size: 8, color: INK_MID })
  y -= 16

  if (data.properties.length === 0) {
    page2.drawText('Aucun bien pour cette période.', { x: ML + 4, y, font: regular, size: 9, color: INK_MID })
    y -= 16
  } else {
    for (const prop of data.properties) {
      const net = prop.revenus - prop.charges
      // Truncate long strings to avoid overflow
      const titleTrunc = prop.title.length > 20 ? prop.title.slice(0, 18) + '…' : prop.title
      const addrTrunc  = prop.address.length > 28 ? prop.address.slice(0, 26) + '…' : prop.address

      page2.drawText(titleTrunc, { x: colBien, y, font: regular, size: 8.5, color: INK })
      page2.drawText(addrTrunc,  { x: colAdresse, y, font: regular, size: 8.5, color: INK_MID })
      page2.drawText(formatEur(prop.revenus), { x: colRevenus, y, font: regular, size: 8.5, color: OWNER })
      page2.drawText(formatEur(prop.charges), { x: colCharges, y, font: regular, size: 8.5, color: INK })
      page2.drawText(formatEur(net), { x: colNet, y, font: bold, size: 8.5, color: net >= 0 ? TENANT : ERROR })

      page2.drawLine({
        start: { x: ML, y: y - 4 }, end: { x: W - MR, y: y - 4 },
        thickness: 0.3, color: rgb(0.878, 0.875, 0.863),
      })
      y -= 16
    }
  }
  y -= 8

  // ── EMPRUNTS IMMOBILIERS ────────────────────────────────────────
  if (data.loans.length > 0) {
    y = drawSectionTitle(page2, 'EMPRUNTS IMMOBILIERS', y)

    // Table header
    page2.drawRectangle({
      x: ML, y: y - 2, width: contentW, height: 14,
      color: rgb(0.965, 0.961, 0.953),
    })
    const colBank      = ML + 4
    const colMontant   = ML + 140
    const colTaux      = ML + 260
    const colInterets  = ML + 340

    page2.drawText('Établissement', { x: colBank,     y, font: bold, size: 8, color: INK_MID })
    page2.drawText('Montant total', { x: colMontant,  y, font: bold, size: 8, color: INK_MID })
    page2.drawText('Taux',          { x: colTaux,     y, font: bold, size: 8, color: INK_MID })
    page2.drawText('Intérêts annuels', { x: colInterets, y, font: bold, size: 8, color: INK_MID })
    y -= 16

    for (const loan of data.loans) {
      const bankTrunc = loan.bankName.length > 22 ? loan.bankName.slice(0, 20) + '…' : loan.bankName
      page2.drawText(bankTrunc, { x: colBank, y, font: regular, size: 8.5, color: INK })
      page2.drawText(formatEur(loan.totalAmount), { x: colMontant, y, font: regular, size: 8.5, color: INK })
      page2.drawText(`${loan.interestRate.toFixed(2)} %`, { x: colTaux, y, font: regular, size: 8.5, color: INK })
      page2.drawText(formatEur(loan.annualInterests), { x: colInterets, y, font: bold, size: 8.5, color: OWNER })

      page2.drawLine({
        start: { x: ML, y: y - 4 }, end: { x: W - MR, y: y - 4 },
        thickness: 0.3, color: rgb(0.878, 0.875, 0.863),
      })
      y -= 16
    }
    y -= 8
  }

  // ── Footer separator ───────────────────────────────────────────
  const footerY = 100
  page2.drawLine({
    start: { x: ML, y: footerY }, end: { x: W - MR, y: footerY },
    thickness: 0.5, color: BORDER,
  })

  // ── Disclaimer ─────────────────────────────────────────────────
  const disclaimer =
    'Ce rapport est généré automatiquement à partir des données Bailio. Il ne constitue pas un conseil fiscal. ' +
    'Consultez votre expert-comptable pour votre situation personnelle. ' +
    'Données issues de la plateforme Bailio — bailio.fr'

  page2.drawText(disclaimer, {
    x: ML, y: footerY - 16,
    font: regular, size: 7.5, color: INK_MID,
    maxWidth: contentW, lineHeight: 11,
  })

  // ── Legal reference ────────────────────────────────────────────
  const legal =
    'Formulaires conformes à : Loi n°89-462 du 6 juillet 1989 · Art. 31 CGI (charges déductibles) · Art. 12 CGI (revenus fonciers)'

  page2.drawText(legal, {
    x: ML, y: footerY - 48,
    font: regular, size: 7.5, color: INK_MID,
    maxWidth: contentW, lineHeight: 11,
  })

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}
