/**
 * Gemini Vision — extraction CNI / Permis / Passeport
 * Gratuit : gemini-2.0-flash-exp = 1500 req/jour, 0 €
 * Env : GEMINI_API_KEY
 */

export interface GeminiStructuredFields {
  lastName?: string
  firstName?: string
  birthDate?: string
  birthPlace?: string
  documentNumber?: string
  documentExpiry?: string
  issuedDate?: string
  nationality?: string
  sex?: 'M' | 'F'
  mrzLine1?: string
  mrzLine2?: string
  mrzLine3?: string
  confidence: number
}

const MODELS = ['gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash']
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const PROMPT = `Tu es un expert en lecture de documents d'identité français.
Regarde ce document et retourne un objet JSON avec les champs que tu vois clairement.

Champs attendus :
- lastName : NOM DE FAMILLE en majuscules (ex: "DUPONT")
- firstName : premier prénom seulement, 1 mot (ex: "Jean")
- birthDate : date de naissance au format YYYY-MM-DD (ex: "1985-03-15")
- birthPlace : ville de naissance (ex: "PARIS")
- documentNumber : numéro du document
- documentExpiry : date d'expiration au format YYYY-MM-DD
- sex : "M" ou "F"

Règles absolues :
- lastName et firstName sont deux champs SÉPARÉS, ne jamais les mélanger
- firstName = 1 seul mot (si "JEAN PIERRE" → retourner "Jean")
- birthDate est la date de NAISSANCE (généralement entre 1940 et 2005)
- documentExpiry est la date d'EXPIRATION (généralement après 2020)
- Si un champ n'est pas lisible, ne pas l'inclure
- Répondre UNIQUEMENT avec le JSON, sans texte autour

Exemple de réponse :
{"lastName":"DUPONT","firstName":"Jean","birthDate":"1985-03-15","birthPlace":"PARIS","documentNumber":"880123456789","documentExpiry":"2030-03-14","sex":"M"}`

function toDate(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{1,2})[.\/\-](\d{2})[.\/\-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return undefined
}

function toStr(v: unknown): string | undefined {
  if (typeof v !== 'string' || !v.trim()) return undefined
  return v.trim()
}

export async function analyzeWithGemini(
  imageBuffer: Buffer,
  _docType: 'CNI' | 'PERMIS_CONDUIRE' | 'PASSEPORT',
): Promise<GeminiStructuredFields | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  const b64 = imageBuffer.toString('base64')

  for (const model of MODELS) {
    try {
      const res = await fetch(`${BASE}/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { inlineData: { mimeType: 'image/jpeg', data: b64 } },
            { text: PROMPT },
          ]}],
          generationConfig: { temperature: 0, maxOutputTokens: 256 },
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.warn(`[Gemini] ${model} → ${res.status}: ${err.slice(0, 100)}`)
        continue
      }

      const data = await res.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
        error?: { message?: string }
      }

      if (data.error) { console.warn(`[Gemini] ${model} erreur: ${data.error.message}`); continue }

      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      if (!raw) { console.warn(`[Gemini] ${model} réponse vide`); continue }

      console.info(`[Gemini] ${model} réponse: ${raw.slice(0, 200)}`)

      // Extraire le JSON — Gemini peut parfois ajouter du texte autour
      let parsed: Record<string, unknown> | null = null
      try { parsed = JSON.parse(raw.trim()) } catch { /* continue */ }
      if (!parsed) {
        const m = raw.match(/\{[\s\S]*\}/)
        if (m) try { parsed = JSON.parse(m[0]) } catch { /* continue */ }
      }
      if (!parsed) { console.warn(`[Gemini] ${model} JSON introuvable`); continue }

      const rawFirst = toStr(parsed.firstName)
      const firstName = rawFirst
        ? (s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())(rawFirst.split(/\s+/)[0] ?? '')
        : undefined

      let birthDate = toDate(parsed.birthDate)
      let documentExpiry = toDate(parsed.documentExpiry)

      // Garde-fou : si les deux dates sont identiques ou inversées
      if (birthDate && documentExpiry) {
        if (birthDate === documentExpiry) {
          const yr = parseInt(birthDate.slice(0, 4))
          if (yr >= 2020) birthDate = undefined
          else documentExpiry = undefined
        }
        // Expiry avant 2010 = probablement la date de naissance
        if (documentExpiry && parseInt(documentExpiry.slice(0, 4)) < 2010) {
          if (!birthDate) birthDate = documentExpiry
          documentExpiry = undefined
        }
      }

      const fields: GeminiStructuredFields = {
        lastName: toStr(parsed.lastName)?.toUpperCase(),
        firstName,
        birthDate,
        birthPlace: toStr(parsed.birthPlace),
        documentNumber: toStr(parsed.documentNumber),
        documentExpiry,
        issuedDate: toDate(parsed.issuedDate),
        nationality: toStr(parsed.nationality)?.toUpperCase(),
        sex: toStr(parsed.sex) === 'M' ? 'M' : toStr(parsed.sex) === 'F' ? 'F' : undefined,
        confidence: 95,
      }

      if (!fields.lastName && !fields.firstName && !fields.birthDate) {
        console.warn(`[Gemini] ${model} aucun champ critique`)
        continue
      }

      console.info(`[Gemini] ${model} ✓ lastName=${fields.lastName} firstName=${fields.firstName} birthDate=${fields.birthDate}`)
      return fields

    } catch (e) {
      console.warn(`[Gemini] ${model} exception: ${(e as Error)?.message}`)
    }
  }

  return null
}
