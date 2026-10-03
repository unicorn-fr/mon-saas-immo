import { useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { Btn, Card, LoadError, Loader, Pill, TextLink, useLoad, useToast } from './kit'
import { Spinner } from './ui'
import { api } from '../lib/api'
import { openDoc } from '../lib/docs'

interface BinderItem {
  key: string
  label: string
  why: string
  keep: string
  state: 'OK' | 'MISSING' | 'AUTO' | 'LATER'
  docId?: string | null
  upload?: string
  diagnostic?: string
  to?: string
  optional?: boolean
}
interface BinderView {
  sections: Array<{ key: string; title: string; items: BinderItem[] }>
  missing: number
}

const STATE: Record<BinderItem['state'], { label: string; tone: 'green' | 'caramel' | 'muted' | 'owner' }> = {
  OK: { label: 'Rangé', tone: 'green' },
  AUTO: { label: 'Fait par Bailio', tone: 'green' },
  MISSING: { label: 'À ajouter', tone: 'caramel' },
  LATER: { label: 'Plus tard', tone: 'muted' },
}

/**
 * Dossier du logement : tous les documents à avoir et à garder, rubrique par rubrique, avec ce qui manque
 * et la durée de conservation. Un document s'ajoute ici en une photo ou un PDF.
 */
export function Binder({ propertyId }: { propertyId: string }) {
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api<BinderView>(`/properties/${propertyId}/binder`), [propertyId])
  const [busy, setBusy] = useState<string | null>(null)
  if (loading && !data) return <Loader />
  if (error || !data) return <LoadError message={error ?? ''} retry={reload} />

  const send = async (it: BinderItem, file: File) => {
    const form = new FormData()
    form.append('file', file)
    form.append('kind', it.upload === 'diagnostic' ? 'DIAGNOSTIC' : 'OTHER')
    form.append('title', it.label)
    form.append('propertyId', propertyId)
    if (it.upload === 'diagnostic' && it.diagnostic) form.append('diagnostic', it.diagnostic)
    else if (it.upload) form.append('binder', it.upload)
    setBusy(it.key)
    try {
      await api('/documents', { method: 'POST', form, timeout: 90_000 })
      toast.show('Document rangé dans le dossier du logement.')
      reload()
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.55 }}>
        {data.missing ? `Il manque ${data.missing} document${data.missing > 1 ? 's' : ''} important${data.missing > 1 ? 's' : ''}.` : 'Tout ce qui est important est rangé.'} Pour chaque document : pourquoi il compte et combien de temps le garder.
      </span>
      {data.sections.map((s) => (
        <Card key={s.key} title={s.title} style={{ gap: 0 }}>
          {s.items.map((it, i) => (
            <div key={it.key} className="col-md" style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '14px 0', borderTop: i ? `1px solid ${BAI.dividerSoft}` : 'none' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{it.label}</span>
                  <Pill tone={STATE[it.state].tone}>{STATE[it.state].label}</Pill>
                  {it.optional && it.state === 'MISSING' ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>facultatif</span> : null}
                </span>
                <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{it.why}</span>
                <span style={{ fontSize: 13, color: BAI.inkSoft }}>À garder : {it.keep.charAt(0).toLowerCase() + it.keep.slice(1)}</span>
              </span>
              <span style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                {it.docId ? <TextLink onClick={() => openDoc(`/documents/${it.docId}/file`).catch(toast.error)} style={{ fontSize: 14 }}>Ouvrir</TextLink> : null}
                {it.upload ? (
                  <label style={{ color: BAI.owner, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
                    {busy === it.key ? <Spinner size={14} /> : null}
                    {it.docId ? 'Remplacer' : 'Ajouter'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="sr-only"
                      aria-label={`Ajouter : ${it.label}`}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        e.target.value = ''
                        if (f) void send(it, f)
                      }}
                    />
                  </label>
                ) : null}
                {it.to && it.state !== 'OK' && it.state !== 'AUTO' && !it.upload ? (
                  <Btn size="sm" variant="outline" to={it.to}>
                    {it.state === 'LATER' ? 'Voir' : 'Le faire'}
                  </Btn>
                ) : null}
              </span>
            </div>
          ))}
        </Card>
      ))}
    </div>
  )
}
