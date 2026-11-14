import { useRef, useState } from 'react'
import { BAI } from '../constants/bailio-tokens'

/**
 * Logo du bailleur : choisi une fois, réduit sur l'appareil (600 × 240 au plus, PNG) et gardé dans le profil ou la
 * structure. Chaque document le relit au moment où il est produit : changer de logo ici suffit.
 */
export function LogoPicker({ value, onChange, hint }: { value: string | null | undefined; onChange: (v: string) => void; hint?: string }) {
  const input = useRef<HTMLInputElement | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const pick = async (file: File | undefined) => {
    setErr(null)
    if (!file) return
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setErr('Choisissez une image PNG ou JPEG.')
    try {
      const url = URL.createObjectURL(file)
      const img = await new Promise<HTMLImageElement>((ok, ko) => {
        const i = new Image()
        i.onload = () => ok(i)
        i.onerror = ko
        i.src = url
      })
      const ratio = Math.min(1, 600 / img.width, 240 / img.height)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * ratio))
      canvas.height = Math.max(1, Math.round(img.height * ratio))
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      const data = canvas.toDataURL('image/png')
      if (data.length > 600_000) return setErr('Cette image est trop lourde, même réduite. Essayez un fichier plus simple.')
      onChange(data)
    } catch {
      setErr('Cette image ne s’ouvre pas. Essayez un autre fichier.')
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ width: 180, height: 72, borderRadius: 12, border: `1.5px dashed ${BAI.borderStrong}`, background: BAI.surface, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          {value ? <img src={value} alt="Votre logo" style={{ maxWidth: '90%', maxHeight: '80%', objectFit: 'contain' }} /> : <span style={{ fontSize: 13, color: BAI.inkSoft }}>Aucun logo</span>}
        </span>
        <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="logo-btn" onClick={() => input.current?.click()}>
            {value ? 'Changer le logo' : 'Ajouter un logo'}
          </button>
          {value ? (
            <button type="button" className="logo-btn" onClick={() => onChange('')}>
              Retirer
            </button>
          ) : null}
        </span>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Fichier du logo" onChange={(e) => void pick(e.target.files?.[0])} />
      </div>
      <span style={{ fontSize: 14, color: BAI.inkMid }}>{hint ?? 'Facultatif. Il apparaît en tête de vos quittances, avis d’échéance et courriers.'}</span>
      {err ? (
        <span role="alert" style={{ fontSize: 14, color: BAI.error }}>
          {err}
        </span>
      ) : null}
    </div>
  )
}
