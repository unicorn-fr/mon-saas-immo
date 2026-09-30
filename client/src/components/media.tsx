import { useEffect, useRef, useState } from 'react'
import qrcode from 'qrcode-generator'
import { BAI } from '../constants/bailio-tokens'
import { api, pdfUrl } from '../lib/api'
import { compressImage } from '../lib/compressImage'
import { Camera } from './Icons'
import { Spinner } from './ui'
import { useToast } from './kit'

/** QR code dessiné en SVG (couleurs de la charte). */
export function QrCode({ text, size = 180 }: { text: string; size?: number }) {
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  const n = qr.getModuleCount()
  const cells: string[] = []
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) cells.push(`M${c} ${r}h1v1h-1z`)
  return (
    <svg role="img" aria-label="Code à scanner avec le téléphone" width={size} height={size} viewBox={`-2 -2 ${n + 4} ${n + 4}`} style={{ background: BAI.surface, borderRadius: 16, display: 'block' }} shapeRendering="crispEdges">
      <path d={cells.join('')} fill={BAI.night} />
    </svg>
  )
}

/** Envoie des photos au serveur (réduites avant l'envoi) et renvoie leurs identifiants. */
export async function uploadPhotos(files: File[]): Promise<string[]> {
  const form = new FormData()
  for (const f of files) form.append('files', await compressImage(f))
  const out = await api<Array<{ id: string }>>('/files', { method: 'POST', form, timeout: 120_000 })
  return out.map((x) => x.id)
}

/** Bouton appareil photo : ouvre la caméra arrière sur téléphone, la galerie sinon. */
export function PhotoButton({ onPhotos, label = 'Photo', count = 0, dark = true }: { onPhotos: (ids: string[]) => void; label?: string; count?: number; dark?: boolean }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  return (
    <label aria-label={label} title={label} style={{ position: 'relative', width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${BAI.borderStrong}`, background: dark ? BAI.night : BAI.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
      {busy ? <Spinner size={16} color={dark ? BAI.surface : BAI.owner} /> : <Camera size={20} color={dark ? BAI.surface : BAI.owner} />}
      {count ? <span style={{ position: 'absolute', top: -6, right: -6, background: BAI.caramel, color: BAI.night, fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '1px 6px' }}>{count}</span> : null}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={busy}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (!files.length) return
          setBusy(true)
          try {
            onPhotos(await uploadPhotos(files))
          } catch (err) {
            toast.error(err)
          } finally {
            setBusy(false)
          }
        }}
      />
    </label>
  )
}

/** Image protégée par la session (photo d'état des lieux, fichier joint). */
export function AuthImage({ id, size = 72, onRemove }: { id: string; size?: number; onRemove?: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let u: string | null = null
    pdfUrl(`/files/${id}`)
      .then((x) => {
        u = x
        setUrl(x)
      })
      .catch(() => undefined)
    return () => {
      if (u) URL.revokeObjectURL(u)
    }
  }, [id])
  return (
    <span style={{ position: 'relative', width: size, height: size, borderRadius: 10, overflow: 'hidden', background: BAI.skeleton, display: 'inline-flex', flexShrink: 0 }}>
      {url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
      {onRemove ? (
        <button type="button" aria-label="Retirer la photo" onClick={onRemove} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, border: 'none', background: BAI.night, color: BAI.surface, fontSize: 14, lineHeight: 1, cursor: 'pointer' }}>
          ×
        </button>
      ) : null}
    </span>
  )
}

/**
 * Zone de signature au doigt ou à la souris. Renvoie une image PNG (data URL), ou null si effacée.
 */
export function SignaturePad({ value, onChange, height = 150, label = 'Signez avec le doigt' }: { value: string | null | undefined; onChange: (dataUrl: string | null) => void; height?: number; label?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const dirty = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  // Taille réelle du canevas = taille affichée × densité de l'écran, pour un trait net.
  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const ratio = window.devicePixelRatio || 1
    const w = c.clientWidth
    c.width = w * ratio
    c.height = height * ratio
    const ctx = c.getContext('2d')!
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = BAI.night
    if (value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, w, height)
      img.src = value
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height])

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    if (dirty.current) onChange(canvas.current!.toDataURL('image/png'))
  }
  const clear = () => {
    const c = canvas.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    dirty.current = false
    onChange(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvas}
          aria-label={label}
          style={{ width: '100%', height, display: 'block', background: BAI.surface, border: `1.5px dashed ${BAI.dashed}`, borderRadius: 14, touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={(e) => {
            ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
            drawing.current = true
            last.current = pos(e)
          }}
          onPointerMove={(e) => {
            if (!drawing.current || !last.current) return
            const p = pos(e)
            const ctx = canvas.current!.getContext('2d')!
            ctx.beginPath()
            ctx.moveTo(last.current.x, last.current.y)
            ctx.lineTo(p.x, p.y)
            ctx.stroke()
            last.current = p
            dirty.current = true
          }}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
        />
        {!value ? <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: BAI.inkSoft, pointerEvents: 'none' }}>{label}</span> : null}
      </div>
      {value ? (
        <button type="button" onClick={clear} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: BAI.owner, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
          Effacer
        </button>
      ) : null}
    </div>
  )
}
