import { useState } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Wizard } from '../../components/Wizard'
import { Btn, Callout, Card, Check, ChoiceCard, Crumbs, Input, LoadError, Loader, PageHead, Pill, TextLink, useLoad, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { getSpace, switchSpace, type SharedSpace } from '../../lib/shared'
import type { PropertySummary } from '../../lib/space'

interface AccessRow {
  id: string
  email: string
  role: SharedSpace['role']
  roleLabel: string
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED'
  properties: Array<{ id: string; name: string }>
}
interface SpaceRow {
  id: string
  role: SharedSpace['role']
  roleLabel: string
  ownerName: string
  count: number
}

const ROLE_CHOICES: Array<{ value: SharedSpace['role']; title: string; sub: string }> = [
  { value: 'ASSOCIATE', title: 'Un associé ou un co-propriétaire', sub: 'Gère les logements avec vous : baux, loyers, courriers, dépenses. Il ne peut rien supprimer.' },
  { value: 'ACCOUNTANT', title: 'Votre comptable', sub: 'Consulte les loyers, les dépenses et l’aide à la déclaration. Il ne modifie rien.' },
  { value: 'CONTRACTOR', title: 'Un intervenant', sub: 'Artisan ou gestionnaire de travaux : l’adresse, le contact du locataire et les interventions d’un seul logement.' },
]

const INVITE_TEXT: Record<SharedSpace['role'], string> = {
  ASSOCIATE: 'Cette personne pourra tout faire sur ces logements, sauf supprimer.',
  ACCOUNTANT: 'Cette personne pourra tout consulter sur ces logements, sans rien modifier.',
  CONTRACTOR: 'Cette personne verra seulement l’adresse, le contact du locataire et les interventions.',
}

/** Accès partagés : les personnes que vous invitez, et les espaces que d'autres partagent avec vous. */
export default function AccesPartages() {
  const toast = useToast()
  const access = useLoad(() => api<AccessRow[]>('/access'))
  const spaces = useLoad(() => api<SpaceRow[]>('/spaces'))
  const [inviting, setInviting] = useState(false)
  const current = getSpace()

  const revoke = async (a: AccessRow) => {
    if (!window.confirm(`Retirer l’accès de ${a.email} ? Il cesse tout de suite.`)) return
    try {
      await api(`/access/${a.id}`, { method: 'DELETE' })
      toast.show('Accès retiré.')
      access.reload()
    } catch (e) {
      toast.error(e)
    }
  }
  const leave = async (s: SpaceRow) => {
    if (!window.confirm(`Quitter l’espace de ${s.ownerName} ?`)) return
    try {
      await api(`/spaces/${s.id}/leave`, { method: 'POST' })
      if (current?.id === s.id) return switchSpace(null)
      spaces.reload()
    } catch (e) {
      toast.error(e)
    }
  }

  return (
    <AppShell>
      <Crumbs items={[{ label: 'Mon compte', to: '/espace/compte' }, { label: 'Accès partagés' }]} />
      <PageHead title="Accès partagés" sub="Invitez un associé, votre comptable ou un artisan, seulement sur les logements que vous choisissez." actions={!inviting ? <Btn onClick={() => setInviting(true)}>Inviter quelqu’un</Btn> : undefined} />

      {inviting ? (
        <Card pad={28}>
          <InviteWizard
            onDone={() => {
              setInviting(false)
              toast.show('Invitation envoyée.')
              access.reload()
            }}
            onCancel={() => setInviting(false)}
          />
        </Card>
      ) : null}

      <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Les personnes que vous avez invitées</h2>} style={{ gap: 0 }}>
        {access.loading && !access.data ? (
          <Loader />
        ) : access.error ? (
          <LoadError message={access.error} retry={access.reload} />
        ) : !access.data?.length ? (
          <span style={{ fontSize: 15, color: BAI.inkMid, paddingTop: 8 }}>Personne pour l’instant.</span>
        ) : (
          access.data.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '14px 0', borderTop: `1px solid ${BAI.dividerSoft}` }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 16 }}>{a.email}</strong>
                  <Pill tone={a.status === 'ACTIVE' ? 'green' : 'caramel'}>{a.status === 'ACTIVE' ? 'Actif' : a.status === 'PENDING' ? 'Invitation envoyée' : 'Invitation expirée'}</Pill>
                </span>
                <span style={{ fontSize: 14, color: BAI.inkMid }}>
                  {a.roleLabel} · {a.properties.map((p) => p.name).join(', ')}
                </span>
              </span>
              <TextLink onClick={() => void revoke(a)} style={{ color: BAI.error, fontSize: 14 }}>
                Retirer l’accès
              </TextLink>
            </div>
          ))
        )}
      </Card>

      {spaces.data?.length ? (
        <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Espaces partagés avec vous</h2>} style={{ gap: 0 }}>
          {spaces.data.map((s) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '14px 0', borderTop: `1px solid ${BAI.dividerSoft}` }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <strong style={{ fontSize: 16 }}>{s.ownerName}</strong>
                <span style={{ fontSize: 14, color: BAI.inkMid }}>
                  {s.roleLabel} · {s.count} logement{s.count > 1 ? 's' : ''}
                </span>
              </span>
              <span style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <TextLink onClick={() => void leave(s)} style={{ fontSize: 14 }}>
                  Quitter
                </TextLink>
                <Btn variant="outline" size="sm" onClick={() => switchSpace({ id: s.id, role: s.role, ownerName: s.ownerName })}>
                  Ouvrir
                </Btn>
              </span>
            </div>
          ))}
        </Card>
      ) : null}

      <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>Vous restez responsable des informations de vos logements et de vos locataires : ne partagez qu’avec des personnes de confiance, et seulement ce dont elles ont besoin. Un accès retiré cesse immédiatement.</span>
    </AppShell>
  )
}

/** Inviter, une question à la fois : qui, quel rôle, quels logements. */
function InviteWizard({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const props = useLoad(() => api<PropertySummary[]>('/properties'))
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<SharedSpace['role'] | null>(null)
  const [ids, setIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const list = props.data ?? []
  const one = role === 'CONTRACTOR'

  const send = async () => {
    setBusy(true)
    setError(null)
    try {
      await api('/access', { method: 'POST', body: { email: email.trim(), role, propertyIds: ids } })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Wizard
      onCancel={onCancel}
      busy={busy}
      error={error}
      finishLabel="Envoyer l’invitation"
      onFinish={send}
      steps={[
        {
          key: 'role',
          title: 'Qui voulez-vous inviter ?',
          validate: () => (role ? null : 'Choisissez une réponse.'),
          content: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROLE_CHOICES.map((c) => (
                <ChoiceCard
                  key={c.value}
                  selected={role === c.value}
                  onClick={() => {
                    setRole(c.value)
                    if (c.value === 'CONTRACTOR' && ids.length > 1) setIds(ids.slice(0, 1))
                  }}
                  title={c.title}
                  sub={c.sub}
                />
              ))}
            </div>
          ),
        },
        {
          key: 'properties',
          title: one ? 'Pour quel logement ?' : 'Quels logements partager ?',
          note: 'La personne ne verra rien d’autre.',
          validate: () => (!ids.length ? 'Choisissez au moins un logement.' : null),
          content: props.loading ? (
            <Loader />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {list.map((p) => (
                <Check
                  key={p.id}
                  checked={ids.includes(p.id)}
                  onChange={(v) => setIds(one ? (v ? [p.id] : []) : v ? [...ids, p.id] : ids.filter((x) => x !== p.id))}
                  label={p.name}
                  sub={p.address}
                />
              ))}
            </div>
          ),
        },
        {
          key: 'email',
          title: 'Son adresse email',
          note: 'Elle recevra un lien pour accepter. Pas de mot de passe.',
          validate: () => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : 'Indiquez une adresse email valide.'),
          content: (
            <>
              <Input big label="Email" type="email" value={email} onChange={setEmail} autoComplete="off" />
              {role ? <Callout tone="tip">{INVITE_TEXT[role]}</Callout> : null}
            </>
          ),
        },
      ]}
    />
  )
}
