/**
 * Gemini Vision OCR — extraction structurée NOM / PRÉNOM / DATE
 *
 * Utilise Gemini 2.5 Flash (vision LLM) pour extraire les champs directement
 * depuis l'image, sans regex ni règles spatiales.
 *
 * Résultats benchmark 2025 :
 *   - 97-98% précision sur l'extraction de champs de documents
 *   - Coût ~0,001$ par scan (100 scans = 0,10€)
 *   - Bien meilleur que les approches OCR + regex traditionnelles
 *
 * Activation : définir GEMINI_API_KEY dans les variables d'environnement.
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
  confidence: number      // 0-100
}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const PROMPT_CNI = `Tu es un système OCR expert en documents d'identité français.
Analyse cette image d'une Carte Nationale d'Identité française (recto).

Extrais les champs suivants avec précision maximale :
- lastName : nom de famille (MAJUSCULES, sans prénom)
- firstName : PREMIER prénom uniquement (pas les prénoms secondaires)
- birthDate : date de naissance au format YYYY-MM-DD
- birthPlace : ville de naissance (optionnel)
- documentNumber : numéro de la carte (12 chiffres ou format alphanumérique)
- documentExpiry : date d'expiration au format YYYY-MM-DD (optionnel)
- nationality : nationalité (FRA pour français)
- sex : M ou F

Règles importantes :
- firstName = UNIQUEMENT le premier prénom (si "JEAN PIERRE", retourner "Jean")
- birthDate depuis la MRZ si visible (format YYMMDD → convertir en YYYY-MM-DD)
- lastName depuis la zone visuelle ET la MRZ (prendre la source la plus lisible)
- Si un champ n'est pas visible, omets-le (ne pas inventer)

Réponds UNIQUEMENT avec un objet JSON valide, sans explication ni markdown.`

const PROMPT_PERMIS = `Tu es un système OCR expert en documents d'identité européens.
Analyse cette image d'un permis de conduire français (directive EU 2006/126/CE).

Les champs sont numérotés sur le document :
1. = nom de famille
2. = prénom(s)
3. = date et lieu de naissance (format DD.MM.YYYY VILLE)
4a. = date de délivrance
4b. = date d'expiration
5. = numéro du permis

Extrais les champs suivants :
- lastName : champ 1 (nom de famille, MAJUSCULES)
- firstName : champ 2 → PREMIER prénom UNIQUEMENT (si "JEAN PIERRE", retourner "Jean")
- birthDate : date de naissance du champ 3, format YYYY-MM-DD
- birthPlace : lieu de naissance du champ 3 (la ville, après la date)
- documentNumber : champ 5
- issuedDate : champ 4a, format YYYY-MM-DD
- documentExpiry : champ 4b, format YYYY-MM-DD

Règles importantes :
- firstName = UNIQUEMENT le premier prénom
- Ne pas inclure les catégories (AM, B, etc.)
- Si un champ n'est pas visible, omets-le

Réponds UNIQUEMENT avec un objet JSON valide, sans explication ni markdown.`

export async function analyzeWithGemini(
  imageBuffer: Buffer,
  docType: 'CNI' | 'PERMIS_CONDUIRE'
): Promise<GeminiStructuredFields | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  try {
    const base64 = imageBuffer.toString('base64')
    const prompt = docType === 'CNI' ? PROMPT_CNI : PROMPT_PERMIS

    const res = await fetch(`${GEMINI_ENDPOINT}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64,
              },
            },
            { text: prompt },
          ],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0,       // déterministe — pas de créativité pour l'OCR
          maxOutputTokens: 512,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.warn('[Gemini OCR] Erreur API:', res.status, err.substring(0, 200))
      return null
    }

    const data = await res.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> }
        finishReason?: string
      }>
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) return null

    // Parse le JSON retourné par Gemini
    let parsed: Record<string, unknown>
    try {
      // Gemini peut parfois wrapper le JSON dans ```json ... ```
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      console.warn('[Gemini OCR] JSON invalide:', rawText.substring(0, 200))
      return null
    }

    // Normalise les champs
    const normalize = (v: unknown): string | undefined => {
      if (typeof v !== 'string' || !v.trim()) return undefined
      return v.trim()
    }

    const normalizeDate = (v: unknown): string | undefined => {
      const s = normalize(v)
      if (!s) return undefined
      // Accepte YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
      const m = s.match(/^(\d{2})[./](\d{2})[./](\d{4})$/)
      if (m) return `${m[3]}-${m[2]}-${m[1]}`
      return undefined
    }

    const normalizeSex = (v: unknown): 'M' | 'F' | undefined => {
      const s = normalize(v)?.toUpperCase()
      if (s === 'M' || s === 'MALE' || s === 'MASCULIN') return 'M'
      if (s === 'F' || s === 'FEMALE' || s === 'FEMININ' || s === 'FÉMININ') return 'F'
      return undefined
    }

    const fields: GeminiStructuredFields = {
      lastName:       normalize(parsed.lastName)?.toUpperCase(),
      firstName:      normalize(parsed.firstName),
      birthDate:      normalizeDate(parsed.birthDate),
      birthPlace:     normalize(parsed.birthPlace),
      documentNumber: normalize(parsed.documentNumber),
      documentExpiry: normalizeDate(parsed.documentExpiry),
      issuedDate:     normalizeDate(parsed.issuedDate),
      nationality:    normalize(parsed.nationality)?.toUpperCase(),
      sex:            normalizeSex(parsed.sex),
      mrzLine1:       normalize(parsed.mrzLine1),
      mrzLine2:       normalize(parsed.mrzLine2),
      mrzLine3:       normalize(parsed.mrzLine3),
      confidence:     97,  // Gemini Vision = très haute confiance par défaut
    }

    // Validation minimale : au moins un champ critique trouvé
    if (!fields.lastName && !fields.firstName && !fields.birthDate) {
      console.warn('[Gemini OCR] Aucun champ critique extrait')
      return null
    }

    return fields
  } catch (e) {
    console.warn('[Gemini OCR] Erreur:', (e as Error)?.message)
    return null
  }
}
