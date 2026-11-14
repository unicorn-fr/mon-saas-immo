import { useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import { dateNum } from '../lib/format'
import { Btn, Callout, Card, Input, Modal, TextLink, useLoad, useToast } from './kit'

interface AiKey {
  id: string
  name: string
  createdAt: string
  lastUsedAt: string | null
}

/**
 * « Connexion aux IA » de Mon compte : une clé par IA (Claude, ChatGPT…), en lecture seule (routes/mcp.ts,
 * domain/aiAccess.ts). La clé n'est montrée qu'une fois ; seule son empreinte est gardée ; on la retire quand on veut.
 */
export function AiConnect() {
  const toast = useToast()
  const { data, reload } = useLoad(() => api<AiKey[]>('/account/ai-keys'), [], { cache: false })
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<string | null>(null)
  const server = `${window.location.origin}/api/mcp`

  const create = async () => {
    setBusy(true)
    try {
      const k = await api<AiKey & { key: string }>('/account/ai-keys', { method: 'POST', body: { name: name.trim() || 'Mon IA' } })
      setCreated(k.key)
      setName('')
      reload()
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  const remove = async (k: AiKey) => {
    try {
      await api(`/account/ai-keys/${k.id}`, { method: 'DELETE' })
      toast.show(`Connexion « ${k.name} » retirée.`)
      reload()
    } catch (e) {
      toast.error(e)
    }
  }
  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text).then(() => toast.show('Copié.'))
  }

  return (
    <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
      <Card title="Connecter une IA">
        <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Demandez à Claude, ChatGPT ou une autre IA : « Qui est en retard de loyer ? ». Elle lit vos données, sans rien pouvoir modifier ni envoyer.</span>
        <Input label="Nom de la connexion" value={name} placeholder="Par exemple : Claude" maxLength={60} onChange={setName} />
        <div>
          <Btn variant="outline" loading={busy} onClick={() => void create()}>
            Créer une clé
          </Btn>
        </div>
        <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>Vos données partent vers l’IA que vous connectez, selon ses propres conditions. Les liens privés, signatures et coordonnées bancaires ne sont jamais transmis.</span>
      </Card>
      <Card title="Vos connexions">
        {!data ? (
          <span style={{ fontSize: 14, color: BAI.inkSoft }}>Chargement…</span>
        ) : !data.length ? (
          <span style={{ fontSize: 14, color: BAI.inkSoft }}>Aucune IA connectée.</span>
        ) : (
          data.map((k) => (
            <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{k.name}</span>
                <span style={{ fontSize: 13, color: BAI.inkSoft }}>
                  Créée le {dateNum(k.createdAt)}
                  {k.lastUsedAt ? `, utilisée le ${dateNum(k.lastUsedAt)}` : ', jamais utilisée'}
                </span>
              </span>
              <TextLink style={{ fontSize: 13, color: BAI.error }} onClick={() => void remove(k)}>
                Retirer
              </TextLink>
            </div>
          ))
        )}
      </Card>
      <Modal
        open={Boolean(created)}
        onClose={() => setCreated(null)}
        title="Votre clé de connexion"
        actions={
          <Btn variant="outline" onClick={() => setCreated(null)}>
            J’ai copié ma clé
          </Btn>
        }
      >
        {created ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Callout tone="warn" title="Montrée une seule fois">
              Copiez-la maintenant. Ne la partagez avec personne : elle donne accès à vos données.
            </Callout>
            <Copyable label="Adresse pour Claude.ai ou ChatGPT (connecteur personnalisé)" value={`${server}/${created}`} onCopy={copy} />
            <Copyable label="Ou adresse du serveur MCP" value={server} onCopy={copy} />
            <Copyable label="avec l’en-tête Authorization" value={`Bearer ${created}`} onCopy={copy} />
            <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>Claude Code : claude mcp add --transport http bailio {server} --header "Authorization: Bearer …"</span>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function Copyable({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: BAI.inkMid }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <code style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', fontSize: 13, background: BAI.bg, border: `1px solid ${BAI.divider}`, borderRadius: 10, padding: '10px 12px', color: BAI.ink }}>{value}</code>
        <Btn variant="outline" size="sm" onClick={() => onCopy(value)}>
          Copier
        </Btn>
      </div>
    </div>
  )
}
