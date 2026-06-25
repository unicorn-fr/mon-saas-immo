/**
 * Gemini Vision OCR — extraction structurée NOM / PRÉNOM / DATE
 * Gratuit : 1500 requêtes/jour sur gemini-1.5-flash (Google AI Free Tier)
 * Activation : GEMINI_API_KEY dans les variables d'environnement
 */

export interface GeminiStructuredFields {
  lastName?: string
  firstName?: string
  birthDate?: string      // YYYY-MM-DD
  birthPlace?: string
  documentNumber?: string
  documentExpiry?: string // YYYY-MM-DD
  issuedDate?: string     // YYYY-MM-DD
  nationality?: string
  sex?: 'M' | 'F'
  mrzLine1?: string
  mrzLine2?: string
  mrzLine3?: string
  confidence: number
}

// Modèles ordonnés du plus récent au plus stable
// gemini-1.5-flash = gratuit 1500 req/jour, always-on
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.5-flash',
]
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Prompt intentionnellement court : Gemini comprend les docs d'identité sans verbosité
const PROMPT_CNI = `Regarde cette carte d'identité française et extrait ces champs en JSON :
- lastName : nom de famille (MAJUSCULES uniquement, PAS les prénoms)
- firstName : PREMIER prénom seulement (1 seul mot, ex "Jean" pas "Jean Pierre")
- birthDate : date de naissance format YYYY-MM-DD (ex 1985-03-12)
- birthPlace : ville de naissance
- documentNumber : numéro de la carte
- documentExpiry : date d'expiration format YYYY-MM-DD

IMPORTANT : birthDate (naissance, genre 1970-2005) ≠ documentExpiry (expiration, genre 2025-2035)
Si tu ne vois pas un champ, ne l'inclus pas.
Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.`

const PROMPT_PERMIS = `Regarde ce permis de conduire français et extrait ces champs en JSON :
- lastName : champ "1." = nom de famille
- firstName : champ "2." = PREMIER prénom seulement (1 mot)
- birthDate : champ "3." = date de naissance format YYYY-MM-DD
- birthPlace : champ "3." = ville de naissance (après la date)
- documentNumber : champ "5." = numéro
- issuedDate : champ "4a." format YYYY-MM-DD
- documentExpiry : champ "4b." format YYYY-MM-DD

IMPORTANT : birthDate (naissance) ≠ documentExpiry (expiration du permis)
Si tu ne vois pas un champ, ne l'inclus pas.
Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.`

/**
 * Extrait du JSON valide depuis une réponse texte libre de Gemini.
 * Gemini retourne parfois du texte autour du JSON — on cherche la première paire {}.
 */
function extractJsonFromText(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim()

  // Tentative directe
  try { return JSON.parse(cleaned) } catch { /* continue */ }

  // Cherche un objet JSON dans le texte (entre { et })
  const match = text.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch { /* continue */ }
  }

  return null
}

export async function analyzeWithGemini(
  imageBuffer: Buffer,
  docType: 'CNI' | 'PERMIS_CONDUIRE'
): Promise<GeminiStructuredFields | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    console.info('[Gemini OCR] Pas de clé API — ignoré')
    return null
  }

  const base64 = imageBuffer.toString('base64')
  const prompt = docType === 'CNI' ? PROMPT_CNI : PROMPT_PERMIS

  // Pas de responseMimeType — certains modèles rejettent ce paramètre avec 400
  const body = JSON.stringify({
    contents: [{
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64 } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 256,
    },
  })

  for (const model of GEMINI_MODELS) {
    let rawText: string | undefined
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (!res.ok) {
        const err = await res.text()
        console.warn(`[Gemini OCR] ${model} HTTP ${res.status}: ${err.substring(0, 150)}`)
        continue
      }

      const data = await res.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>
        error?: { message?: string }
      }

      if (data.error) {
        console.warn(`[Gemini OCR] ${model} erreur API: ${data.error.message}`)
        continue
      }

      rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawText) {
        console.warn(`[Gemini OCR] ${model} réponse vide (finishReason: ${data.candidates?.[0]?.finishReason})`)
        continue
      }

      console.info(`[Gemini OCR] ${model} réponse brute: ${rawText.substring(0, 300)}`)
    } catch (e) {
      console.warn(`[Gemini OCR] ${model} exception: ${(e as Error)?.message}`)
      continue
    }

    const parsed = extractJsonFromText(rawText)
    if (!parsed) {
      console.warn(`[Gemini OCR] ${model} JSON introuvable dans: ${rawText.substring(0, 200)}`)
      continue
    }

    // Normalisation
    const str = (v: unknown): string | undefined => {
      if (typeof v !== 'string' || !v.trim()) return undefined
      return v.trim()
    }

    const date = (v: unknown): string | undefined => {
      const s = str(v)
      if (!s) return undefined
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
      const m = s.match(/^(\d{1,2})[./\-](\d{2})[./\-](\d{4})$/)
      if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
      return undefined
    }

    const sex = (v: unknown): 'M' | 'F' | undefined => {
      const s = str(v)?.toUpperCase()
      if (s === 'M' || s === 'MALE' || s === 'MASCULIN') return 'M'
      if (s === 'F' || s === 'FEMALE' || s === 'FEMININ' || s === 'FÉMININ') return 'F'
      return undefined
    }

    // Premier token du prénom seulement
    const rawFirst = str(parsed.firstName)
    const firstName = rawFirst
      ? rawFirst.split(/[\s,;]+/)[0]
      : undefined
    const firstNameClean = firstName
      ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
      : undefined

    let birthDate  = date(parsed.birthDate)
    let expiry     = date(parsed.documentExpiry)

    // Garde-fou : si les deux dates sont identiques → on garde la plus cohérente
    if (birthDate && expiry && birthDate === expiry) {
      const yr = parseInt(birthDate.slice(0, 4), 10)
      if (yr >= 2020) birthDate = undefined
      else expiry = undefined
    }
    // Si documentExpiry est avant 2010, c'est probablement la date de naissance
    if (expiry && parseInt(expiry.slice(0, 4), 10) < 2010 && !birthDate) {
      birthDate = expiry
      expiry = undefined
    }

    const fields: GeminiStructuredFields = {
      lastName:       str(parsed.lastName)?.toUpperCase(),
      firstName:      firstNameClean,
      birthDate,
      birthPlace:     str(parsed.birthPlace),
      documentNumber: str(parsed.documentNumber),
      documentExpiry: expiry,
      issuedDate:     date(parsed.issuedDate),
      nationality:    str(parsed.nationality)?.toUpperCase(),
      sex:            sex(parsed.sex),
      confidence:     97,
    }

    if (!fields.lastName && !fields.firstName && !fields.birthDate) {
      console.warn(`[Gemini OCR] ${model} aucun champ critique dans: ${JSON.stringify(parsed)}`)
      continue
    }

    console.info(`[Gemini OCR] ${model} ✓ → lastName=${fields.lastName} firstName=${fields.firstName} birthDate=${fields.birthDate}`)
    return fields
  }

  console.warn('[Gemini OCR] Tous les modèles ont échoué')
  return null
}
