import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface ReceiptData {
  receiptNumber: string
  month: string          // ex: "Mai"
  monthNumber: number    // ex: 5
  year: number           // ex: 2026
  landlord: { firstName: string; lastName: string; address: string; phone?: string; email?: string }
  tenant: { firstName: string; lastName: string }
  property: { address: string; city: string; postalCode: string }
  rentAmount: number
  charges: number
  paidDate: Date
}

const INK     = rgb(0.051, 0.047, 0.039)  // #0d0c0a
const INK_MID = rgb(0.353, 0.341, 0.329)  // #5a5754
const BORDER  = rgb(0.600, 0.600, 0.600)  // gris neutre
const BLACK   = rgb(0, 0, 0)

/** Retourne le dernier jour du mois (ex: 31 pour mai) */
function lastDayOfMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

/** Format date en français : "1er mai 2026" */
function formatDateFR(day: number, month: string, year: number, ordinal = false): string {
  const suffix = ordinal && day === 1 ? 'er' : ''
  return `${day}${suffix} ${month.toLowerCase()} ${year}`
}

export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  const doc  = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  const total = data.rentAmount + data.charges
  const lastDay = lastDayOfMonth(data.monthNumber, data.year)

  let y = height - 55

  // ── bailio.fr — mention discrète haut droite ─────────────────────────────
  page.drawText('bailio.fr', {
    x: width - 100, y: height - 28, font: regular, size: 8, color: INK_MID,
  })

  // ── TITRE ────────────────────────────────────────────────────────────────
  page.drawText('QUITTANCE DE LOYER', { x: 50, y, font: bold, size: 18, color: BLACK })
  y -= 20
  page.drawText(`N° ${data.receiptNumber} · ${data.month} ${data.year}`, {
    x: 50, y, font: regular, size: 10, color: INK_MID,
  })
  y -= 28

  // ── LIGNE SÉPARATRICE ────────────────────────────────────────────────────
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.75, color: BLACK })
  y -= 22

  const drawSection = (title: string) => {
    page.drawText(title, { x: 50, y, font: bold, size: 10, color: BLACK })
    y -= 5
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: BORDER })
    y -= 14
  }

  const drawRow = (label: string, value: string) => {
    page.drawText(label, { x: 50,  y, font: regular, size: 10, color: INK_MID })
    page.drawText(value, { x: 220, y, font: regular, size: 10, color: BLACK   })
    y -= 15
  }

  // ── BAILLEUR ─────────────────────────────────────────────────────────────
  drawSection('BAILLEUR')
  drawRow('Nom :', `${data.landlord.firstName} ${data.landlord.lastName}`)
  drawRow('Adresse :', data.landlord.address)
  if (data.landlord.phone) drawRow('Téléphone :', data.landlord.phone)
  if (data.landlord.email) drawRow('Email :', data.landlord.email)
  y -= 8

  // ── LOCATAIRE ────────────────────────────────────────────────────────────
  drawSection('LOCATAIRE')
  drawRow('Nom :', `${data.tenant.firstName} ${data.tenant.lastName}`)
  y -= 8

  // ── BIEN LOUÉ ────────────────────────────────────────────────────────────
  drawSection('BIEN LOUÉ')
  drawRow('Adresse :', `${data.property.address}, ${data.property.postalCode} ${data.property.city}`)
  y -= 16

  // ── MONTANTS — encadré sobre (bordure noire, fond blanc) ─────────────────
  const boxH = 128
  page.drawRectangle({ x: 50, y: y - boxH, width: width - 100, height: boxH,
    color: rgb(1, 1, 1), borderColor: BLACK, borderWidth: 0.75 })

  const boxY = y - 22
  page.drawText('Je soussigné(e), bailleur, reconnais avoir reçu la somme de :', {
    x: 62, y: boxY, font: regular, size: 10, color: BLACK,
  })
  page.drawText(`${total.toFixed(2)} €`, {
    x: 62, y: boxY - 22, font: bold, size: 22, color: BLACK,
  })
  page.drawText(`Loyer : ${data.rentAmount.toFixed(2)} €`, {
    x: 62, y: boxY - 50, font: regular, size: 10, color: BLACK,
  })
  page.drawText(`Charges : ${data.charges.toFixed(2)} €`, {
    x: 62, y: boxY - 64, font: regular, size: 10, color: BLACK,
  })

  // Période explicite du 1er au dernier jour du mois (exigence art. 21 loi 89-462)
  const periodStart = formatDateFR(1, data.month, data.year, true)
  const periodEnd   = formatDateFR(lastDay, data.month, data.year)
  page.drawText(`Période : du ${periodStart} au ${periodEnd}`, {
    x: 62, y: boxY - 80, font: regular, size: 10, color: BLACK,
  })
  page.drawText(`Paiement reçu le : ${data.paidDate.toLocaleDateString('fr-FR')}`, {
    x: 62, y: boxY - 94, font: regular, size: 10, color: BLACK,
  })

  y -= boxH + 24

  // ── LIGNE BAS ────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: BORDER })
  y -= 12

  // ── MENTION LÉGALE ───────────────────────────────────────────────────────
  const legal = 'Quittance émise conformément à l\'article 21 de la loi n°89-462 du 6 juillet 1989 modifiée par la loi ALUR n°2014-366 du 24 mars 2014. ' +
    'Cette quittance est délivrée sans préjudice de tous droits et actions du bailleur. ' +
    'La présente quittance ne vaut que pour les sommes effectivement encaissées.'

  page.drawText(legal, { x: 50, y, font: regular, size: 7.5, color: INK_MID,
    maxWidth: width - 100, lineHeight: 12 })

  // ── bailio.fr — bas droite ───────────────────────────────────────────────
  page.drawText('bailio.fr', {
    x: width - 100, y: 28, font: regular, size: 8, color: INK_MID,
  })

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}
