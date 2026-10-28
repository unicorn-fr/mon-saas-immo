import { useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { Pill, TextLink } from './kit'
import { Spinner } from './ui'

export interface DocFile {
  id: string
  name: string
  /** Peut être retiré d'ici (fichier envoyé par la personne elle-même). */
  removable?: boolean
}

/**
 * Une pièce justificative et ses fichiers : plusieurs par pièce (trois bulletins de salaire, recto et verso d'une
 * carte…). Chaque fichier ajouté s'ajoute aux précédents ; « Retirer » enlève un mauvais fichier. Le même bloc sert
 * au locataire, au candidat et au propriétaire.
 */
export function DocFilesRow({
  label,
  hint,
  files,
  suggested,
  received,
  inputLabel,
  onAdd,
  onRemove,
  onView,
  max = 6,
  extra,
}: {
  label: string
  hint?: string
  files: DocFile[]
  /** Nombre de fichiers attendu d'habitude (3 bulletins de salaire). */
  suggested?: number | null
  /** Pièce notée reçue sans fichier (remise en main propre). */
  received?: boolean
  inputLabel: string
  onAdd: (files: File[]) => Promise<void>
  onRemove?: (file: DocFile) => Promise<void>
  onView?: (file: DocFile) => void
  max?: number
  extra?: React.ReactNode
}) {
  const [busy, setBusy] = useState(false)
  const n = files.length
  const short = suggested && n > 0 && n < suggested
  const status = n ? (short ? <Pill tone="accent">{`${n} sur ${suggested}`}</Pill> : <Pill tone="green">{n > 1 ? `Reçu, ${n} fichiers` : 'Reçu'}</Pill>) : received ? <Pill tone="green">Reçu</Pill> : null
  const add = async (list: File[]) => {
    if (!list.length) return
    setBusy(true)
    try {
      await onAdd(list.slice(0, Math.max(0, max - n)))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span>
          {hint ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>{hint}</span> : null}
        </span>
        {status}
      </div>
      {n ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map((f) => (
            <li key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, background: BAI.bg, borderRadius: 12, padding: '8px 12px' }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              {onView ? (
                <TextLink style={{ fontSize: 14 }} onClick={() => onView(f)}>
                  Voir
                </TextLink>
              ) : null}
              {onRemove && f.removable !== false ? (
                <TextLink
                  style={{ fontSize: 14 }}
                  onClick={() => {
                    setBusy(true)
                    void onRemove(f).finally(() => setBusy(false))
                  }}
                >
                  Retirer<span className="sr-only"> {f.name}</span>
                </TextLink>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {short ? <span style={{ fontSize: 13, color: BAI.accentInk }}>Ajoutez {suggested! - n === 1 ? 'le dernier' : `les ${suggested! - n} autres`}, un par un ou tous ensemble.</span> : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {n < max ? (
          <label style={{ color: BAI.owner, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
            {busy ? <Spinner size={14} /> : null}
            {n ? 'Ajouter un autre fichier' : 'Ajouter'}
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="sr-only"
              aria-label={inputLabel}
              disabled={busy}
              onChange={(e) => {
                const list = Array.from(e.target.files ?? [])
                e.target.value = ''
                void add(list)
              }}
            />
          </label>
        ) : (
          <span style={{ fontSize: 13, color: BAI.inkSoft }}>{max} fichiers au plus : retirez-en un pour en ajouter un autre.</span>
        )}
        {extra}
      </div>
    </div>
  )
}

type OwnerDoc = { category: string; label?: string | null; received: boolean; fileId?: string | null; source?: 'OWNER' | 'TENANT' | null }

/**
 * Pièces d'une fiche de locataire, côté propriétaire : plusieurs fichiers par pièce, chacun visible et retirable.
 * `paper` : une pièce remise sur papier peut être notée « Reçu » sans fichier, avec une précision.
 */
export function OwnerDocList<T extends OwnerDoc>({
  docs,
  onChange,
  labels,
  hints,
  suggested,
  upload,
  view,
  paper,
  who,
  renderNote,
}: {
  docs: T[]
  onChange: (d: T[]) => void
  labels: Record<string, string>
  hints?: Record<string, string>
  suggested?: Record<string, number>
  upload: (files: File[]) => Promise<string[]>
  view?: (fileId: string) => void
  paper?: boolean
  who?: string
  renderNote?: (k: string, entry: T | undefined, setNote: (label: string) => void) => React.ReactNode
}) {
  const of = (k: string) => docs.filter((d) => d.category === k && d.fileId)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Object.keys(labels).map((k) => {
        const files = of(k)
        const paperEntry = docs.find((d) => d.category === k && !d.fileId)
        const received = docs.some((d) => d.category === k && d.received)
        return (
          <DocFilesRow
            key={k}
            label={labels[k]}
            hint={hints?.[k]}
            files={files.map((d) => ({ id: d.fileId!, name: d.label || 'Fichier' }))}
            suggested={suggested?.[k]}
            received={received}
            inputLabel={`Ajouter : ${labels[k]}${who ? ` (${who})` : ''}`}
            onAdd={async (list) => {
              const ids = await upload(list)
              const added = ids.map((fileId, i) => ({ category: k, received: true, fileId, label: list[i]?.name.slice(0, 150) ?? 'Fichier' }) as T)
              onChange([...docs.filter((d) => !(d.category === k && !d.fileId)), ...added])
            }}
            onRemove={async (f) => onChange(docs.filter((d) => d.fileId !== f.id))}
            onView={view ? (f) => view(f.id) : undefined}
            extra={
              paper && !files.length ? (
                <>
                  <button
                    type="button"
                    className="tap"
                    aria-pressed={received}
                    onClick={() => onChange([...docs.filter((d) => d.category !== k), { ...(paperEntry ?? { category: k }), received: !received } as T])}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <Pill tone={received ? 'green' : 'muted'}>{received ? 'Reçu sur papier' : 'Reçu sur papier ?'}</Pill>
                  </button>
                  {renderNote?.(k, paperEntry, (label) => onChange([...docs.filter((d) => !(d.category === k && !d.fileId)), { ...(paperEntry ?? { category: k, received: false }), label } as T]))}
                </>
              ) : null
            }
          />
        )
      })}
    </div>
  )
}
