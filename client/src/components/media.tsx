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

/**
 * Photo de couverture (fichier protégé, chargé avec la session) qui remplit son cadre, recadrée sans déformation.
 * `children` se pose par-dessus (étiquette « Loué », par exemple).
 */
export function CoverPhoto({ id, alt, style, children }: { id: string; alt: string; style?: React.CSSProperties; children?: React.ReactNode }) {
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
    <div style={{ position: 'relative', overflow: 'hidden', background: BAI.skeleton, ...style }}>
      {url ? <img src={url} alt={alt} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
      {children ? <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', padding: 14, boxSizing: 'border-box' }}>{children}</div> : null}
    </div>
  )
}

/**
 * Photo principale d'un logement sur une page publique (candidat, locataire), servie par l'API sans session.
 * Masquée si elle ne charge pas, pour ne jamais laisser un cadre vide.
 */
export function PublicPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return <img src={src} alt={alt} onError={() => setFailed(true)} style={{ width: '100%', height: 'clamp(180px, 34vw, 300px)', objectFit: 'cover', borderRadius: 24, display: 'block', background: BAI.skeleton }} />
}

/** Bouton appareil photo : ouvre la caméra arrière sur téléphone, la galerie sinon. */
export function PhotoButton({ onPhotos, label = 'Photo', count = 0, dark = true }: { onPhotos: (ids: string[]) => void; label?: string; count?: number; dark?: boolean }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  return (
    <label aria-label={label} title={label} style={{ position: 'relative', width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${BAI.borderStrong}`, background: dark ? BAI.night : BAI.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
      {busy ? <Spinner size={16} color={dark ? BAI.surface : BAI.owner} /> : <Camera size={20} color={dark ? BAI.surface : BAI.owner} />}
      {count ? <span style={{ position: 'absolute', top: -6, right: -6, background: BAI.accent, color: BAI.night, fontSize: 13, fontWeight: 700, borderRadius: 999, padding: '1px 6px' }}>{count}</span> : null}
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
export function AuthImage({ id, size = 72, onRemove, alt = 'Photo' }: { id: string; size?: number; onRemove?: () => void; alt?: string }) {
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
      {url ? <img src={url} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
      {onRemove ? (
        <button type="button" aria-label="Retirer la photo" onClick={onRemove} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, border: 'none', background: BAI.night, color: BAI.surface, fontSize: 14, lineHeight: 1, cursor: 'pointer' }}>
          ×
        </button>
      ) : null}
    </span>
  )
}

type PadMode = 'PRESS' | 'TRACKPAD_ARMED' | 'TRACKPAD' | 'PHONE'

/**
 * Zone de signature. Trois façons de signer :
 * - au doigt sur un écran tactile, ou à la souris en gardant le bouton appuyé ;
 * - au pavé tactile, sans cliquer (comme Aperçu sur Mac) : un clic dans le cadre pour commencer, le doigt glisse sur le
 *   pavé et trace la signature, un clic ou une touche pour terminer ;
 * - avec son téléphone : un QR code ouvre une page où l'on signe au doigt, la signature revient ici toute seule
 *   (relais de 10 minutes, `routes/signatureRelay.ts`).
 */
export function SignaturePad({ value, onChange, height = 150, label = 'Signez avec le doigt' }: { value: string | null | undefined; onChange: (dataUrl: string | null) => void; height?: number; label?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const dirty = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  // Pavé tactile : le tracé est relevé sans limite (déplacements relatifs), puis recadré dans le cadre.
  const strokes = useRef<Array<Array<{ x: number; y: number }>>>([])
  const pen = useRef({ x: 0, y: 0 })
  const frame = useRef(0)
  const startedAt = useRef(0)
  const [mode, setMode] = useState<PadMode>('PRESS')
  const modeRef = useRef<PadMode>('PRESS')
  modeRef.current = mode
  // Pavé tactile et téléphone : proposés sur un ordinateur (pointeur précis qui survole).
  const [desktop] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches)

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
    if (value) paint(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height])

  /** Dessine une image de signature dans le cadre, sans la déformer. */
  const paint = (dataUrl: string) => {
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      const w = c.clientWidth
      const scale = Math.min(w / img.width, height / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.drawImage(img, (w - dw) / 2, (height - dh) / 2, dw, dh)
    }
    img.src = dataUrl
  }

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const line = (p: { x: number; y: number }) => {
    if (!last.current) {
      last.current = p
      return
    }
    const ctx = canvas.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    dirty.current = true
  }
  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    if (dirty.current) onChange(canvas.current!.toDataURL('image/png'))
  }
  /**
   * Pavé tactile : la signature entière, où que le doigt soit allé, est mise à l'échelle et centrée dans le cadre
   * (sans déformation, marge de 16 px), à chaque mouvement.
   */
  const renderFitted = () => {
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const w = c.clientWidth
    ctx.clearRect(0, 0, c.width, c.height)
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const st of strokes.current)
      for (const p of st) {
        minX = Math.min(minX, p.x)
        minY = Math.min(minY, p.y)
        maxX = Math.max(maxX, p.x)
        maxY = Math.max(maxY, p.y)
      }
    if (!Number.isFinite(minX)) return
    const pad = 16
    const scale = Math.min((w - 2 * pad) / Math.max(1, maxX - minX), (height - 2 * pad) / Math.max(1, maxY - minY), 2)
    const ox = (w - (maxX - minX) * scale) / 2 - minX * scale
    const oy = (height - (maxY - minY) * scale) / 2 - minY * scale
    for (const st of strokes.current) {
      if (st.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(st[0].x * scale + ox, st[0].y * scale + oy)
      for (const p of st.slice(1)) ctx.lineTo(p.x * scale + ox, p.y * scale + oy)
      ctx.stroke()
    }
  }
  const finishTrackpad = () => {
    if (modeRef.current !== 'TRACKPAD' && modeRef.current !== 'TRACKPAD_ARMED') return
    modeRef.current = 'PRESS'
    if (document.pointerLockElement) document.exitPointerLock()
    window.cancelAnimationFrame(frame.current)
    if (dirty.current && strokes.current.some((st) => st.length > 1)) {
      renderFitted()
      onChange(canvas.current!.toDataURL('image/png'))
    }
    strokes.current = []
    setMode('PRESS')
  }
  const clear = () => {
    const c = canvas.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    dirty.current = false
    onChange(null)
  }

  // Pavé tactile : le curseur est retenu par le cadre (il disparaît) ; chaque déplacement du doigt prolonge le tracé,
  // sans bord. Un clic, une touche ou Échap termine.
  useEffect(() => {
    if (mode !== 'TRACKPAD') return
    const onMove = (e: MouseEvent) => {
      pen.current = { x: pen.current.x + e.movementX, y: pen.current.y + e.movementY }
      strokes.current[strokes.current.length - 1]?.push(pen.current)
      dirty.current = true
      window.cancelAnimationFrame(frame.current)
      frame.current = window.requestAnimationFrame(renderFitted)
    }
    const onDown = (e: MouseEvent) => {
      // Le clic qui a lancé la signature arrive ici aussi : il ne la termine pas.
      if (e.timeStamp - startedAt.current < 300) return
      e.preventDefault()
      finishTrackpad()
    }
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      finishTrackpad()
    }
    let locked = false
    const onLock = () => {
      if (document.pointerLockElement === canvas.current) locked = true
      else if (locked) finishTrackpad()
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('pointerlockchange', onLock)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('pointerlockchange', onLock)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const startTrackpad = () => {
    clear()
    setMode('TRACKPAD_ARMED')
  }

  // Dans le cadre : l'invitation à signer, ou au pavé tactile le clic pour commencer. Pendant le tracé, la consigne
  // passe sous le cadre pour ne pas gêner la signature.
  const hint = mode === 'TRACKPAD_ARMED' ? 'Cliquez une fois dans ce cadre pour commencer' : mode === 'PRESS' && !value ? label : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvas}
          aria-label={label}
          style={{ width: '100%', height, display: 'block', background: BAI.surface, border: `1.5px ${mode === 'PRESS' || mode === 'PHONE' ? 'dashed' : 'solid'} ${mode === 'PRESS' || mode === 'PHONE' ? BAI.dashed : BAI.owner}`, borderRadius: 14, touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={(e) => {
            const m = modeRef.current
            if (m === 'TRACKPAD_ARMED') {
              // Premier clic : le cadre retient le curseur, la signature commence, sans garder le bouton appuyé.
              startedAt.current = e.timeStamp
              strokes.current = [[{ x: 0, y: 0 }]]
              pen.current = { x: 0, y: 0 }
              dirty.current = false
              modeRef.current = 'TRACKPAD'
              setMode('TRACKPAD')
              try {
                void (canvas.current?.requestPointerLock() as unknown as Promise<void> | undefined)?.catch?.(() => undefined)
              } catch {
                /* sans verrouillage, le tracé suit le curseur jusqu'au bord de l'écran */
              }
              return
            }
            if (m === 'TRACKPAD') return
            ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
            drawing.current = true
            last.current = pos(e)
          }}
          onPointerMove={(e) => {
            if (!drawing.current || modeRef.current !== 'PRESS') return
            line(pos(e))
          }}
          onPointerUp={() => {
            if (modeRef.current === 'PRESS') end()
          }}
          onPointerCancel={end}
          onPointerLeave={() => {
            if (modeRef.current === 'PRESS') end()
          }}
        />
        {hint ? (
          <span aria-live="polite" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 16px', fontSize: 14, color: mode === 'PRESS' ? BAI.inkSoft : BAI.owner, fontWeight: mode === 'PRESS' ? 400 : 600, pointerEvents: 'none' }}>
            {hint}
          </span>
        ) : null}
      </div>
      {mode === 'TRACKPAD' ? (
        <span aria-live="polite" style={{ fontSize: 14, color: BAI.owner, fontWeight: 600, lineHeight: 1.5 }}>
          Écrivez votre signature en glissant le doigt sur le pavé tactile, sans appuyer, aussi grand que vous voulez : elle se cadre toute seule. Pour finir, cliquez ou appuyez sur une touche.
        </span>
      ) : null}
      <div style={{ display: 'flex', gap: '6px 18px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
        {desktop && mode === 'PRESS' ? (
          <>
            <PadLink onClick={startTrackpad}>Signer au pavé tactile, sans cliquer</PadLink>
            <PadLink onClick={() => setMode('PHONE')}>Signer avec mon téléphone</PadLink>
          </>
        ) : null}
        {mode === 'TRACKPAD' || mode === 'TRACKPAD_ARMED' ? <PadLink onClick={finishTrackpad}>Terminé</PadLink> : null}
        {value && mode === 'PRESS' ? <PadLink onClick={clear}>Effacer</PadLink> : null}
      </div>
      {mode === 'PHONE' ? (
        <PhoneSignature
          onImage={(img) => {
            paint(img)
            dirty.current = true
            onChange(img)
            setMode('PRESS')
          }}
          onCancel={() => setMode('PRESS')}
        />
      ) : null}
    </div>
  )
}

/** Signature recadrée sur le tracé (marge de 12 px) : elle remplit ensuite tout le cadre où on l'affiche. */
export function cropToInk(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height)
      let minX = width
      let minY = height
      let maxX = -1
      let maxY = -1
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++)
          if (data[(y * width + x) * 4 + 3] > 16) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
      if (maxX < 0) return resolve(dataUrl)
      const m = 12
      const out = document.createElement('canvas')
      out.width = maxX - minX + 1 + 2 * m
      out.height = maxY - minY + 1 + 2 * m
      out.getContext('2d')!.drawImage(c, minX, minY, maxX - minX + 1, maxY - minY + 1, m, m, maxX - minX + 1, maxY - minY + 1)
      resolve(out.toDataURL('image/png'))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

function PadLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ background: 'none', border: 'none', color: BAI.owner, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '4px 0', minHeight: 32 }}>
      {children}
    </button>
  )
}

/** Signer avec son téléphone : QR code et lien, puis la signature arrive ici dès qu'elle est envoyée. */
function PhoneSignature({ onImage, onCancel }: { onImage: (dataUrl: string) => void; onCancel: () => void }) {
  const [code, setCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const asked = useRef(false)
  const done = useRef(onImage)
  done.current = onImage
  // Un seul relais par ouverture (même si l'écran se monte deux fois), puis on attend la signature toutes les 2 s.
  useEffect(() => {
    if (asked.current) return
    asked.current = true
    api<{ code: string }>('/signature-relay', { method: 'POST' })
      .then((r) => setCode(r.code))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])
  useEffect(() => {
    if (!code) return
    let stop = false
    let timer = 0
    const poll = () =>
      api<{ image: string | null }>(`/signature-relay/${code}`)
        .then((r) => {
          if (stop) return
          if (r.image) done.current(r.image)
          else timer = window.setTimeout(poll, 2000)
        })
        .catch((e) => !stop && setError(e instanceof Error ? e.message : String(e)))
    timer = window.setTimeout(poll, 2000)
    return () => {
      stop = true
      window.clearTimeout(timer)
    }
  }, [code])
  const link = code ? `${window.location.origin}/signature/${code}` : ''
  return (
    <div style={{ border: `1px solid ${BAI.divider}`, borderRadius: 16, padding: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      {code ? <QrCode text={link} size={150} /> : <Spinner />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
        <strong style={{ fontSize: 16 }}>Scannez ce code avec l’appareil photo de votre téléphone</strong>
        <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Signez au doigt sur le téléphone, puis touchez « Envoyer ». La signature apparaît ici toute seule. Le lien sert une seule fois et expire dans 10 minutes.</span>
        {error ? <span role="alert" style={{ fontSize: 14, color: BAI.error }}>{error}</span> : code ? <span style={{ fontSize: 14, color: BAI.owner, fontWeight: 600 }}>En attente de votre signature…</span> : null}
        <span style={{ alignSelf: 'flex-start' }}>
          <PadLink onClick={onCancel}>Annuler</PadLink>
        </span>
      </div>
    </div>
  )
}

/** Photo réduite (1 024 px au plus) en data URL JPEG, depuis un fichier ou une image de la caméra. */
async function toJpegDataUrl(source: CanvasImageSource & { width: number; height: number }): Promise<string> {
  const scale = Math.min(1, 1024 / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(source.width * scale)
  canvas.height = Math.round(source.height * scale)
  canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85)
}

/**
 * Photo du signataire au moment de signer : caméra de l'ordinateur si elle existe, sinon l'appareil photo
 * du téléphone (caméra avant). La photo est horodatée par le serveur et jointe au certificat de preuve.
 */
export function SelfieCapture({ value, onPhoto, disabled }: { value: string | null; onPhoto: (dataUrl: string) => Promise<void>; disabled?: boolean }) {
  const toast = useToast()
  const video = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [busy, setBusy] = useState(false)
  const canLive = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
  useEffect(() => {
    if (video.current && stream) {
      video.current.srcObject = stream
      void video.current.play().catch(() => undefined)
    }
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [stream])
  const send = async (dataUrl: string) => {
    setBusy(true)
    try {
      await onPhoto(dataUrl)
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  const openCamera = async () => {
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }))
    } catch {
      toast.show('La caméra n’est pas accessible. Utilisez le bouton « Prendre une photo ».', 'error')
    }
  }
  const snap = async () => {
    const v = video.current
    if (!v || !v.videoWidth) return
    const frame = Object.assign(v, { width: v.videoWidth, height: v.videoHeight })
    const dataUrl = await toJpegDataUrl(frame)
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    await send(dataUrl)
  }
  const fromFile = async (file: File) => {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      const dataUrl = await toJpegDataUrl(bitmap)
      bitmap.close()
      await send(dataUrl)
    } catch {
      toast.show('Cette image ne peut pas être lue. Reprenez la photo.', 'error')
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {stream ? (
        <video ref={video} muted playsInline aria-label="Aperçu de la caméra" style={{ width: '100%', maxWidth: 360, borderRadius: 14, background: BAI.night, transform: 'scaleX(-1)' }} />
      ) : value ? (
        <img src={value} alt="Votre photo" style={{ width: 150, height: 200, objectFit: 'cover', borderRadius: 14, border: `1px solid ${BAI.divider}` }} />
      ) : null}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {stream ? (
          <button type="button" onClick={() => void snap()} style={selfieBtn(true)}>
            Prendre la photo
          </button>
        ) : (
          <>
            <label style={{ ...selfieBtn(!value), opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
              {busy ? <Spinner size={14} /> : <Camera size={18} color={value ? BAI.owner : BAI.surface} />}
              {value ? 'Reprendre la photo' : 'Prendre une photo'}
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="sr-only"
                aria-label="Prendre une photo de vous"
                disabled={disabled}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (f) void fromFile(f)
                }}
              />
            </label>
            {canLive ? (
              <button type="button" onClick={() => void openCamera()} disabled={disabled} className="hide-md" style={selfieBtn(false)}>
                Utiliser la caméra de l’ordinateur
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

const selfieBtn = (primary: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 48,
  padding: '0 18px',
  borderRadius: 12,
  border: primary ? 'none' : `1.5px solid ${BAI.owner}`,
  background: primary ? BAI.owner : BAI.surface,
  color: primary ? BAI.surface : BAI.owner,
  fontFamily: 'inherit',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
})
