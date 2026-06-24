/**
 * Mindee Document AI — OCR enterprise pour pièces d'identité françaises
 *
 * Mindee est la startup française utilisée par Pennylane, Alan, Luko, etc.
 * Contrairement à Tesseract, c'est un modèle de deep learning entraîné
 * spécifiquement sur des centaines de milliers de CNI et permis français.
 *
 * Modèles utilisés :
 *   CNI      → /products/mindee/idcard_fr/v2   (CNI française, champs structurés)
 *   Permis   → /products/mindee/driver_license/v1 (permis EU, champs numérotés)
 *
 * Réponse directe : lastName, firstName, birthDate, documentNumber, etc.
 * → Aucune regex requise, le modèle connaît la structure du document.
 *
 * Pour obtenir une clé : https://platform.mindee.com (free tier : 500/mois)
 * Env : MINDEE_API_KEY=your_key
 */

const MINDEE_BASE = 'https://api.mindee.net/v1'

export interface MindeeStructuredFields {
  lastName?: string
  firstName?: string
  birthDate?: string       // YYYY-MM-DD
  birthPlace?: string
  documentNumber?: string
  documentExpiry?: string  // YYYY-MM-DD
  nationality?: string
  sex?: 'M' | 'F'
  issuedDate?: string
  issuingAuthority?: string
  licenseCategories?: string[]
  mrzLine1?: string
  mrzLine2?: string
  mrzLine3?: string
  confidence: number       // 0-100 (confiance moyenne des champs trouvés)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Valeur Mindee → string nettoyée, null si vide/N/A */
function val(field: unknown): string | null {
  if (!field || typeof field !== 'object') return null
  const f = field as { value?: string | null }
  const v = f.value ?? null
  if (!v || v === 'N/A' || v.trim() === '') return null
  return v.trim()
}

/** Confiance Mindee (0-1) → 0-100 */
function conf(field: unknown): number {
  if (!field || typeof field !== 'object') return 0
  const f = field as { confidence?: number }
  return Math.round((f.confidence ?? 0) * 100)
}

/** Convertit une date Mindee (YYYY-MM-DD ou DD/MM/YYYY) → YYYY-MM-DD */
function normalizeDate(raw: string | null): string | undefined {
  if (!raw) return undefined
  // Déjà au bon format
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  // Format DD/MM/YYYY ou DD.MM.YYYY
  const m = raw.match(/(\d{2})[\/.-](\d{2})[\/.-](\d{4})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return undefined
}

/** Convertit le genre Mindee (Male/Female/M/F/H) → M|F */
function normalizeGender(raw: string | null): 'M' | 'F' | undefined {
  if (!raw) return undefined
  const r = raw.toUpperCase()
  if (r === 'M' || r === 'MALE' || r === 'H' || r === 'HOMME') return 'M'
  if (r === 'F' || r === 'FEMALE' || r === 'FEMME') return 'F'
  return undefined
}

// ─── CNI française (idcard_fr v2) ─────────────────────────────────────────────

interface MindeeCNIResponse {
  document?: {
    inference?: {
      prediction?: {
        given_names?: Array<{ value?: string; confidence?: number }>
        surname?: { value?: string; confidence?: number }
        birth_date?: { value?: string; confidence?: number }
        birth_place?: { value?: string; confidence?: number }
        id_number?: { value?: string; confidence?: number }
        expiry_date?: { value?: string; confidence?: number }
        gender?: { value?: string; confidence?: number }
        mrz1?: { value?: string; confidence?: number }
        mrz2?: { value?: string; confidence?: number }
        mrz3?: { value?: string; confidence?: number }
        nationality?: { value?: string; confidence?: number }
        country_of_issue?: { value?: string; confidence?: number }
      }
    }
  }
}

function parseCNIResponse(data: MindeeCNIResponse): MindeeStructuredFields | null {
  const pred = data?.document?.inference?.prediction
  if (!pred) return null

  const fields: MindeeStructuredFields = { confidence: 0 }
  const confs: number[] = []

  const surname = val(pred.surname)
  if (surname) { fields.lastName = surname.toUpperCase(); confs.push(conf(pred.surname)) }

  // given_names est un tableau (plusieurs prénoms)
  const givenNames = pred.given_names
  if (givenNames?.length) {
    const names = givenNames.map(n => val(n)).filter(Boolean).join(' ')
    if (names) { fields.firstName = names; confs.push(conf(givenNames[0])) }
  }

  const bd = normalizeDate(val(pred.birth_date))
  if (bd) { fields.birthDate = bd; confs.push(conf(pred.birth_date)) }

  const bp = val(pred.birth_place)
  if (bp) { fields.birthPlace = bp; confs.push(conf(pred.birth_place)) }

  const idNum = val(pred.id_number)
  if (idNum) { fields.documentNumber = idNum.replace(/\s/g, ''); confs.push(conf(pred.id_number)) }

  const exp = normalizeDate(val(pred.expiry_date))
  if (exp) { fields.documentExpiry = exp; confs.push(conf(pred.expiry_date)) }

  const gender = normalizeGender(val(pred.gender))
  if (gender) { fields.sex = gender; confs.push(conf(pred.gender)) }

  const nat = val(pred.nationality) ?? val(pred.country_of_issue)
  if (nat) { fields.nationality = nat.toUpperCase().substring(0, 3); confs.push(conf(pred.nationality)) }

  const mrz1 = val(pred.mrz1); if (mrz1) fields.mrzLine1 = mrz1
  const mrz2 = val(pred.mrz2); if (mrz2) fields.mrzLine2 = mrz2
  const mrz3 = val(pred.mrz3); if (mrz3) fields.mrzLine3 = mrz3

  if (confs.length === 0) return null
  fields.confidence = Math.round(confs.reduce((a, b) => a + b, 0) / confs.length)

  return fields
}

// ─── Permis de conduire (driver_license v1) ───────────────────────────────────

interface MindeeDriverLicenseResponse {
  document?: {
    inference?: {
      prediction?: {
        last_name?: { value?: string; confidence?: number }
        first_name?: { value?: string; confidence?: number }
        birth_date?: { value?: string; confidence?: number }
        birth_place?: { value?: string; confidence?: number }
        id_number?: { value?: string; confidence?: number }
        expiry_date?: { value?: string; confidence?: number }
        issue_date?: { value?: string; confidence?: number }
        issued_date?: { value?: string; confidence?: number }
        authority?: { value?: string; confidence?: number }
        category?: { value?: string; confidence?: number }
        categories?: Array<{ value?: string; confidence?: number }>
        mrz?: { value?: string; confidence?: number }
      }
    }
  }
}

function parseDriverLicenseResponse(data: MindeeDriverLicenseResponse): MindeeStructuredFields | null {
  const pred = data?.document?.inference?.prediction
  if (!pred) return null

  const fields: MindeeStructuredFields = { confidence: 0 }
  const confs: number[] = []

  const surname = val(pred.last_name)
  if (surname) { fields.lastName = surname.toUpperCase(); confs.push(conf(pred.last_name)) }

  const firstName = val(pred.first_name)
  if (firstName) { fields.firstName = firstName; confs.push(conf(pred.first_name)) }

  const bd = normalizeDate(val(pred.birth_date))
  if (bd) { fields.birthDate = bd; confs.push(conf(pred.birth_date)) }

  const bp = val(pred.birth_place)
  if (bp) { fields.birthPlace = bp; confs.push(conf(pred.birth_place)) }

  const idNum = val(pred.id_number)
  if (idNum) { fields.documentNumber = idNum.replace(/\s/g, ''); confs.push(conf(pred.id_number)) }

  const exp = normalizeDate(val(pred.expiry_date))
  if (exp) { fields.documentExpiry = exp; confs.push(conf(pred.expiry_date)) }

  const issued = normalizeDate(val(pred.issue_date) ?? val(pred.issued_date))
  if (issued) { fields.issuedDate = issued; confs.push(conf(pred.issue_date ?? pred.issued_date)) }

  const auth = val(pred.authority)
  if (auth) { fields.issuingAuthority = auth }

  // Catégories : champ simple ou tableau
  const catField = val(pred.category)
  if (catField) {
    fields.licenseCategories = catField.split(/[,;/\s]+/).filter(c => /^[A-D]/.test(c))
  } else if (pred.categories?.length) {
    fields.licenseCategories = pred.categories.map(c => val(c)).filter(Boolean) as string[]
  }

  if (confs.length === 0) return null
  fields.confidence = Math.round(confs.reduce((a, b) => a + b, 0) / confs.length)

  return fields
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Analyse un document d'identité avec l'API Mindee.
 * Retourne les champs structurés directement — aucune regex requise.
 * Retourne null si MINDEE_API_KEY n'est pas défini ou si l'API échoue.
 */
export async function analyzeWithMindee(
  imageBuffer: Buffer,
  docType: 'CNI' | 'PERMIS_CONDUIRE'
): Promise<MindeeStructuredFields | null> {
  const key = process.env.MINDEE_API_KEY
  if (!key) return null

  const endpoint = docType === 'CNI'
    ? `${MINDEE_BASE}/products/mindee/idcard_fr/v2/predict`
    : `${MINDEE_BASE}/products/mindee/driver_license/v1/predict`

  try {
    const formData = new FormData()
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' })
    formData.append('document', blob, 'document.jpg')

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Token ${key}` },
      body: formData,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.warn(`[Mindee] HTTP ${res.status}:`, errText.substring(0, 200))
      return null
    }

    const data = await res.json()

    const fields = docType === 'CNI'
      ? parseCNIResponse(data as MindeeCNIResponse)
      : parseDriverLicenseResponse(data as MindeeDriverLicenseResponse)

    if (!fields) {
      console.warn('[Mindee] Réponse vide ou champs non trouvés')
      return null
    }

    console.info(`[Mindee] ${docType} — confiance ${fields.confidence}% — ${Object.keys(fields).length - 1} champs`)
    return fields

  } catch (e) {
    console.warn('[Mindee] Erreur réseau:', (e as Error)?.message)
    return null
  }
}
