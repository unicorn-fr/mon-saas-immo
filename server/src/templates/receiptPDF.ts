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
const BORDER  = rgb(0.600, 0.600, 0.600)  // gris neutre
const BLACK   = rgb(0, 0, 0)

export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  const doc  = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  const total = data.rentAmount + data.charges

  let y = height - 55

  // ── BAILIO — mention discrète haut droite ────────────────────────────
  page.drawText('bailio.fr', {
    x: width - 100, y: height - 28, font: regular, size: 8, color: INK_MID,
  })

  // ── TITRE ───────────────────────────────────────────────────────────
  page.drawText('QUITTANCE DE LOYER', { x: 50, y, font: bold, size: 18, color: BLACK })
  y -= 20
  page.drawText(`N° ${data.receiptNumber} · ${data.month} ${data.year}`, {
    x: 50, y, font: regular, size: 10, color: INK_MID,
  })
  y -= 28

  // ── LIGNE SÉPARATRICE ────────────────────────────────────────────────
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

  // ── MONTANTS — encadré sobre (bordure noire, fond blanc) ─────────────
  const boxH = 110
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
  page.drawText(`Période : ${data.month} ${data.year}  ·  Paiement reçu le : ${data.paidDate.toLocaleDateString('fr-FR')}`, {
    x: 62, y: boxY - 78, font: regular, size: 10, color: BLACK,
  })

  y -= boxH + 24

  // ── LIGNE BAS ────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: BORDER })
  y -= 12

  // ── MENTION LÉGALE ───────────────────────────────────────────────────
  const legal = 'Quittance émise conformément à l\'article 21 de la loi n°89-462 du 6 juillet 1989. ' +
    'Cette quittance est délivrée sans préjudice de tous droits et actions du bailleur.'

  page.drawText(legal, { x: 50, y, font: regular, size: 8, color: INK_MID,
    maxWidth: width - 150, lineHeight: 13 })

  // ── BAILIO — bas droite ──────────────────────────────────────────────
  page.drawText('bailio.fr', {
    x: width - 100, y: 28, font: regular, size: 8, color: INK_MID,
  })

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}
