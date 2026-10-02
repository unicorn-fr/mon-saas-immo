import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Btn, Card, LoadError, Loader, PageHead, TextLink, useLoad, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { dateNum } from '../../lib/format'

interface TrashRow {
  id: string
  kind: string
  label: string
  deletedAt: string
  expiresAt: string
}

/** Corbeille : ce qui a été supprimé reste récupérable 30 jours, à l'identique. */
export default function Corbeille() {
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api<TrashRow[]>('/trash'))
  const restore = async (r: TrashRow) => {
    try {
      await api(`/trash/${r.id}/restore`, { method: 'POST' })
      toast.show('Élément restauré.')
      reload()
    } catch (e) {
      toast.error(e)
    }
  }
  const erase = async (r: TrashRow) => {
    if (!window.confirm('Effacer définitivement ? Cette action ne peut pas être annulée.')) return
    try {
      await api(`/trash/${r.id}`, { method: 'DELETE' })
      reload()
    } catch (e) {
      toast.error(e)
    }
  }
  return (
    <AppShell>
      <PageHead title="Corbeille" sub="Ce que vous supprimez reste ici 30 jours : vous pouvez le restaurer tel quel." />
      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : !data.length ? (
        <Card>
          <span style={{ fontSize: 17, fontWeight: 600 }}>La corbeille est vide.</span>
        </Card>
      ) : (
        <Card>
          {data.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontSize: 13, color: BAI.inkSoft }}>
                  Supprimé le {dateNum(r.deletedAt)} · effacé pour de bon le {dateNum(r.expiresAt)}
                </span>
              </span>
              <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <Btn size="sm" variant="outline" onClick={() => void restore(r)}>
                  Restaurer
                </Btn>
                <TextLink style={{ fontSize: 13, color: BAI.error }} onClick={() => void erase(r)}>
                  Effacer
                </TextLink>
              </span>
            </div>
          ))}
        </Card>
      )}
    </AppShell>
  )
}
