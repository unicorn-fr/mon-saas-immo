import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface ReceiptData {
  receiptNumber: string
  month: string
  year: number
  landlord: { firstName: string; lastName: string; address: string }
  tenant: { firstName: string; lastName: string }
  property: { address: string; city: string; postalCode: string }
  rentAmount: number
  charges: number
  paidDate: Date
}

const INK     = rgb(0.051, 0.047, 0.039)  // #0d0c0a
const INK_MID = rgb(0.353, 0.341, 0.329)  // #5a5754
const NIGHT   = rgb(0.102, 0.102, 0.173)  // #1a1a2e
const BORDER  = rgb(0.894, 0.882, 0.859)  // #e4e1db
const BLUE_LT = rgb(0.918, 0.941, 0.984)  // #eaf0fb

export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  const doc  = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  const total = data.rentAmount + data.charges

  let y = height - 60

  // ── TITRE ───────────────────────────────────────────────────────────
  page.drawText('QUITTANCE DE LOYER', { x: 50, y, font: bold, size: 20, color: NIGHT })
  y -= 22
  page.drawText(`N° ${data.receiptNumber} · ${data.month} ${data.year}`, {
    x: 50, y, font: regular, size: 11, color: INK_MID,
  })
  y -= 30

  // ── LIGNE SÉPARATRICE ────────────────────────────────────────────────
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: BORDER })
  y -= 24

  const drawSection = (title: string) => {
    page.drawText(title, { x: 50, y, font: bold, size: 11, color: INK })
    y -= 6
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: BORDER })
    y -= 16
  }

  const drawRow = (label: string, value: string) => {
    page.drawText(label, { x: 50,  y, font: regular, size: 10, color: INK_MID })
    page.drawText(value, { x: 220, y, font: regular, size: 10, color: INK     })
    y -= 16
  }

  // ── BAILLEUR ─────────────────────────────────────────────────────────
  drawSection('BAILLEUR')
  drawRow('Nom :', `${data.landlord.firstName} ${data.landlord.lastName}`)
  drawRow('Adresse :', data.landlord.address)
  y -= 8

  // ── LOCATAIRE ────────────────────────────────────────────────────────
  drawSection('LOCATAIRE')
  drawRow('Nom :', `${data.tenant.firstName} ${data.tenant.lastName}`)
  y -= 8

  // ── BIEN LOUÉ ────────────────────────────────────────────────────────
  drawSection('BIEN LOUÉ')
  drawRow('Adresse :', `${data.property.address}, ${data.property.postalCode} ${data.property.city}`)
  y -= 16

  // ── MONTANTS — encadré bleu ───────────────────────────────────────────
  const boxH = 110
  page.drawRectangle({ x: 50, y: y - boxH, width: width - 100, height: boxH,
    color: BLUE_LT, borderColor: BORDER, borderWidth: 1, borderOpacity: 1 })

  const boxY = y - 22
  page.drawText('Je soussigné(e), bailleur, reconnais avoir reçu la somme de :', {
    x: 62, y: boxY, font: regular, size: 10, color: NIGHT,
  })
  page.drawText(`${total.toFixed(2)} €`, {
    x: 62, y: boxY - 22, font: bold, size: 22, color: NIGHT,
  })
  page.drawText(`Loyer : ${data.rentAmount.toFixed(2)} €`, {
    x: 62, y: boxY - 50, font: regular, size: 10, color: INK,
  })
  page.drawText(`Charges : ${data.charges.toFixed(2)} €`, {
    x: 62, y: boxY - 64, font: regular, size: 10, color: INK,
  })
  page.drawText(`Période : ${data.month} ${data.year}  ·  Paiement reçu le : ${data.paidDate.toLocaleDateString('fr-FR')}`, {
    x: 62, y: boxY - 78, font: regular, size: 10, color: INK,
  })

  y -= boxH + 24

  // ── MENTION LÉGALE ───────────────────────────────────────────────────
  const legal = 'Quittance émise conformément à l\'article 21 de la loi n°89-462 du 6 juillet 1989. ' +
    'Cette quittance est délivrée sans préjudice de tous droits et actions du bailleur. ' +
    'Document généré par Bailio · bailio.fr'

  page.drawText(legal, { x: 50, y, font: regular, size: 8, color: INK_MID,
    maxWidth: width - 100, lineHeight: 13 })

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}
