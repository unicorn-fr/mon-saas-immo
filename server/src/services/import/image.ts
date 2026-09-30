import sharp from 'sharp'

/** Au-delà, l'image est refusée (protection mémoire du serveur). */
const MAX_INPUT_PIXELS = 60_000_000

/** Espacement des lignes visé (en pixels) : c'est la taille de texte que Tesseract lit le mieux. */
const TARGET_LINE_PITCH = 50
const ANALYSIS_WIDTH = 900

/**
 * Analyse une page photographiée :
 * - inclinaison en degrés (entre -8 et 8), par la méthode du profil de projection : on fait « tourner »
 *   les pixels sombres et l'on garde l'angle pour lequel les lignes de texte sont les plus nettes ;
 * - espacement des lignes (en pixels de l'image reçue), par autocorrélation de ce profil,
 *   pour agrandir les petits textes et réduire les photos trop grandes.
 */
export async function analysePage(input: Buffer): Promise<{ skew: number; linePitch: number | null }> {
  const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .grayscale()
    .resize({ width: ANALYSIS_WIDTH, withoutEnlargement: false })
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const meta = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata()
  const scale = (meta.width ?? ANALYSIS_WIDTH) / info.width

  // Pixels d'encre (seuil à 55 % du blanc), en ignorant les bords où traînent les ombres de la photo.
  const xs: number[] = []
  const ys: number[] = []
  const marginX = Math.round(info.width * 0.04)
  const marginY = Math.round(info.height * 0.04)
  for (let y = marginY; y < info.height - marginY; y += 1) {
    for (let x = marginX; x < info.width - marginX; x += 1) {
      if (data[y * info.width + x] < 140) {
        xs.push(x - info.width / 2)
        ys.push(y)
      }
    }
  }
  if (xs.length < 500) return { skew: 0, linePitch: null }

  const profile = (deg: number): Float64Array => {
    const t = Math.tan((deg * Math.PI) / 180)
    const bins = new Float64Array(info.height * 2)
    for (let i = 0; i < xs.length; i += 1) {
      const row = Math.round(ys[i] - xs[i] * t + info.height / 2)
      if (row >= 0 && row < bins.length) bins[row] += 1
    }
    return bins
  }
  const score = (deg: number): number => {
    const bins = profile(deg)
    let sum = 0
    for (let i = 1; i < bins.length; i += 1) sum += (bins[i] - bins[i - 1]) ** 2
    return sum
  }

  // Recherche grossière puis fine.
  let best = 0
  let bestScore = -1
  for (let a = -8; a <= 8; a += 0.5) {
    const sc = score(a)
    if (sc > bestScore) [best, bestScore] = [a, sc]
  }
  const center = best
  for (let a = center - 0.5; a <= center + 0.5; a += 0.1) {
    const sc = score(a)
    if (sc > bestScore) [best, bestScore] = [a, sc]
  }

  // Période dominante du profil = espacement des lignes.
  const bins = profile(best)
  const mean = bins.reduce((a, b) => a + b, 0) / bins.length
  const centered = bins.map((v) => v - mean)
  const ac = (lag: number) => {
    let sum = 0
    for (let i = 0; i + lag < centered.length; i += 1) sum += centered[i] * centered[i + lag]
    return sum
  }
  let lag = 3
  while (lag < 150 && ac(lag) > 0) lag += 1
  let pitch: number | null = null
  let peak = 0
  for (; lag < 150; lag += 1) {
    const v = ac(lag)
    if (v > peak) [pitch, peak] = [lag, v]
  }
  return { skew: Math.round(best * 10) / 10, linePitch: pitch && peak > 0 ? pitch * scale : null }
}

/** Inclinaison seule (voir analysePage). */
export async function estimateSkew(input: Buffer): Promise<number> {
  return (await analysePage(input)).skew
}

/**
 * Prépare une photo de page pour la reconnaissance de texte : orientation (EXIF, puis quart de tour
 * demandé), niveaux de gris, taille de texte ramenée à celle d'un scan à 300 dpi, redressement,
 * contraste étiré, léger renforcement.
 */
export async function preparePage(input: Buffer, extraRotation = 0): Promise<Buffer> {
  let oriented = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).rotate().grayscale().toBuffer()
  if (extraRotation) oriented = await sharp(oriented).rotate(extraRotation).toBuffer()
  const meta = await sharp(oriented).metadata()
  const width = meta.width ?? 0
  const long = Math.max(width, meta.height ?? 0)
  const { skew, linePitch } = await analysePage(oriented)
  let factor = linePitch ? TARGET_LINE_PITCH / linePitch : 3300 / long
  // Bornes : pas plus de 3 fois, et jamais plus de 7 000 px de côté (mémoire du serveur).
  factor = Math.max(0.4, Math.min(3, factor, 7000 / long))
  let img = sharp(oriented)
  if (Math.abs(factor - 1) > 0.05) img = img.resize({ width: Math.round(width * factor) })
  const resized = await img.toBuffer()
  let straight = sharp(resized)
  if (Math.abs(skew) >= 0.2) straight = straight.rotate(-skew, { background: '#ffffff' })
  const page = await straight.grayscale().png().toBuffer()
  return flattenLighting(page)
}

/**
 * Corrige l'éclairage : ombre du téléphone, papier grisé, coin plus sombre. On estime le fond
 * (image très floutée) puis on divise la page par ce fond : le papier devient blanc partout
 * et l'encre reste noire, ce qui évite qu'un seuil global noircisse toute une zone.
 */
async function flattenLighting(page: Buffer): Promise<Buffer> {
  const meta = await sharp(page).metadata()
  const w = meta.width ?? 0
  const h = meta.height ?? 0
  const background = await sharp(page)
    .resize({ width: Math.max(1, Math.round(w / 8)) })
    .blur(10)
    .resize({ width: w, height: h, fit: 'fill' })
    .negate({ alpha: false })
    .toBuffer()
  // « colour-dodge » avec le fond inversé = division de la page par son fond.
  return sharp(page)
    .composite([{ input: background, blend: 'colour-dodge' }])
    .grayscale()
    .normalise()
    .sharpen({ sigma: 1 })
    .png()
    .toBuffer()
}
