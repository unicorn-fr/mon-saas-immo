import { useState } from 'react'
import { LAUNCH_OFFER, priceLabel } from '../../config'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Fields } from '../../components/FlowLayout'
import { SignaturePad } from '../../components/media'
import { Btn, Card, Input, Line, LoadError, Loader, Modal, PageHead, Pill, Progress, TextLink, Toggle, useLoad, useToast } from '../../components/kit'
import { api, downloadPdf, pdfUrl } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { dateNum } from '../../lib/format'
import type { LandlordProfile } from '../../lib/contract'
import { useFiche } from '../../lib/fiche'
import type { ProfileView } from '../../lib/space'
import type { User } from '../../lib/types'

/** Mon compte. Maquette « Mon compte ». */
export default function Compte() {
  const { user, setUser, signOut } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [action, setAction] = useState<Purpose | null>(null)
  const { file: p, set, completion, loadError, reload } = useFiche<LandlordProfile>(
    () => api<ProfileView>('/profile').then((v) => ({ file: v.profile, completion: v.completion })),
    async (f) => {
      const v = await api<ProfileView>('/profile', { method: 'PUT', body: f })
      if (v.user) setUser(v.user)
      return { completion: v.completion }
    },
  )
  if (!user) return null

  const follow = user.followUpActive
  const weekly = follow && user.notifyWeekly !== false
  const urgent = follow && user.notifyUrgent !== false
  const prefs = async (body: { notifyWeekly?: boolean; notifyUrgent?: boolean }) => {
    const w = body.notifyWeekly ?? weekly
    const u = body.notifyUrgent ?? urgent
    try {
      setUser(await api<User>('/account', { method: 'PATCH', body: { ...body, followUp: w || u } }))
      toast.show('Préférences enregistrées.')
    } catch (e) {
      toast.error(e)
    }
  }
  return (
    <AppShell>
      <PageHead title="Mon compte" sub={`Connecté avec ${user.email}`} />
      {loadError ? (
        <LoadError message={loadError} retry={reload} />
      ) : !p || !completion ? (
        <Loader />
      ) : (
        <div className="split-aside" style={{ gap: 24 }}>
          <div className="grow">
            <Card title="Vous, en tant que bailleur" action={<TextLink to="/espace/compte/profil" style={{ fontSize: 14 }}>Profil complet</TextLink>}>
              <Fields>
                <Input label="Prénom" value={p.firstNames} onChange={(v) => set({ firstNames: v })} />
                <Input label="Nom" value={p.lastName} onChange={(v) => set({ lastName: v })} />
              </Fields>
              <Input label="Adresse" value={p.address} onChange={(v) => set({ address: v })} hint="Obligatoire dans le bail : c’est là que votre locataire peut vous écrire." />
              <Fields>
                <Input label="Code postal" value={p.postalCode} inputMode="numeric" maxLength={5} onChange={(v) => set({ postalCode: v })} />
                <Input label="Ville" value={p.city} onChange={(v) => set({ city: v })} />
              </Fields>
              <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>
                Vos logements sont détenus en votre nom, à plusieurs, par une SCI ou une société ?{' '}
                <TextLink to="/espace/structures" style={{ fontSize: 15 }}>
                  Vos structures
                </TextLink>
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: BAI.inkSoft }}>Profil complété</span>
                  <span style={{ fontWeight: 700, color: BAI.owner }}>{completion.percent} %</span>
                </div>
                <Progress percent={completion.percent} />
              </div>
            </Card>
            <Card title="Votre signature">
              <SignaturePad value={p.signature} onChange={(v) => set({ signature: v ?? '' })} label="Signez ici avec la souris ou le doigt" />
              <span style={{ fontSize: 13, color: BAI.inkSoft }}>Ajoutée sur vos quittances. Jamais sur un bail sans votre accord.</span>
            </Card>
          </div>
          <aside className="aside" style={{ width: 400 }}>
            <Card title="Abonnement">
              <Line label="Formule" value="Bailio, tout inclus" />
              <Line label="Prix" value={`${priceLabel()} par mois, ${LAUNCH_OFFER.charAt(0).toLowerCase()}${LAUNCH_OFFER.slice(1)}`} />
              <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>Rien ne vous sera prélevé sans votre accord. Vous serez prévenu par email avant toute mise en place d’un abonnement.</span>
            </Card>
            <Card title="Emails de Bailio" style={{ gap: 0 }}>
              <Toggle border={false} checked={weekly} onChange={(v) => prefs({ notifyWeekly: v })} label="Récapitulatif du lundi" sub="Ce qui arrive dans la semaine : loyers, révisions, attestations." />
              <Toggle checked={urgent} onChange={(v) => prefs({ notifyUrgent: v })} label="Alertes urgentes" sub="Loyer en retard, échéance dans les trois jours." />
            </Card>
            <Card title="Accès partagés" action={<TextLink to="/espace/compte/acces" style={{ fontSize: 14 }}>Gérer</TextLink>}>
              <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Invitez un associé, votre comptable ou un artisan sur certains logements, ou ouvrez un espace partagé avec vous.</span>
            </Card>
            <Card title="Vos données">
              <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Vos données sont hébergées en Suisse, chez Infomaniak, et ne sont jamais revendues.</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                <TextLink onClick={() => setAction('EXPORT')}>Tout exporter</TextLink>
                <TextLink to="/espace/corbeille">Corbeille</TextLink>
                <TextLink onClick={() => setAction('DELETE')} style={{ color: BAI.error }}>
                  Supprimer mon compte
                </TextLink>
                <TextLink onClick={() => void signOut().then(() => navigate('/'))}>Se déconnecter</TextLink>
              </div>
            </Card>
            <Devices />
          </aside>
        </div>
      )}
      {action && (
        <ConfirmByCode
          purpose={action}
          onClose={() => setAction(null)}
          onDeleted={async () => {
            await signOut()
            navigate('/', { replace: true })
          }}
        />
      )}
    </AppShell>
  )
}

type Purpose = 'EXPORT' | 'DELETE'

/**
 * Double vérification : l'export de toutes les données et la suppression du compte
 * demandent un code à 6 chiffres envoyé par email, valable 10 minutes.
 */
function ConfirmByCode({ purpose, onClose, onDeleted }: { purpose: Purpose; onClose: () => void; onDeleted: () => Promise<void> }) {
  const toast = useToast()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const del = purpose === 'DELETE'

  const send = async () => {
    setBusy(true)
    try {
      const r = await api<{ sentTo: string }>('/account/confirm-code', { method: 'POST', body: { purpose } })
      setSentTo(r.sentTo)
      setCode('')
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  const confirm = async () => {
    setBusy(true)
    try {
      if (del) {
        await api('/account', { method: 'DELETE', body: { code } })
        await onDeleted()
      } else {
        downloadPdf(await pdfUrl('/account/export', { method: 'POST', body: { code }, timeout: 60_000 }), 'bailio-mes-donnees.json')
        toast.show('Vos données sont téléchargées.')
        onClose()
      }
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={del ? 'Supprimer votre compte ?' : 'Exporter vos données'}
      actions={
        <>
          <Btn variant="outline" onClick={onClose}>
            Annuler
          </Btn>
          {sentTo ? (
            <Btn onClick={confirm} disabled={busy || !/^\d{6}$/.test(code)} style={del ? { background: BAI.error, borderColor: BAI.error } : undefined}>
              {del ? 'Oui, tout supprimer' : 'Télécharger'}
            </Btn>
          ) : (
            <Btn onClick={send} disabled={busy}>
              Recevoir mon code
            </Btn>
          )}
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>
        {del ? 'Vos logements, vos locataires, vos baux et tous vos documents seront effacés définitivement. Pensez à tout exporter avant.' : 'Vous allez télécharger toutes les informations enregistrées dans votre compte, dans un fichier lisible par un autre logiciel.'}
      </p>
      <p style={{ margin: 0, fontSize: 14, color: BAI.inkSoft, lineHeight: 1.5 }}>Par sécurité, nous vérifions que c’est bien vous : un code à 6 chiffres vous est envoyé par email.</p>
      {sentTo && (
        <>
          <Input label="Code reçu par email" value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus hint={`Envoyé à ${sentTo}. Valable 10 minutes.`} />
          <div>
            <TextLink style={{ fontSize: 13 }} onClick={() => void send()}>
              Renvoyer un code
            </TextLink>
          </div>
        </>
      )}
    </Modal>
  )
}

interface DeviceSession {
  id: string
  device: string
  ip: string | null
  createdAt: string
  lastSeenAt: string | null
  current: boolean
}

/** Journal des connexions : chaque appareil connecté, avec la possibilité de le déconnecter. */
function Devices() {
  const toast = useToast()
  const { data, reload } = useLoad(() => api<DeviceSession[]>('/account/sessions'), [])
  const others = (data ?? []).filter((s) => !s.current).length
  const revoke = async (id: string) => {
    try {
      await api(`/account/sessions/${id}`, { method: 'DELETE' })
      toast.show('Appareil déconnecté.')
      reload()
    } catch (e) {
      toast.error(e)
    }
  }
  const revokeOthers = async () => {
    try {
      await api('/account/sessions/revoke-others', { method: 'POST' })
      toast.show('Les autres appareils sont déconnectés.')
      reload()
    } catch (e) {
      toast.error(e)
    }
  }
  return (
    <Card title="Appareils connectés">
      {!data ? (
        <span style={{ fontSize: 14, color: BAI.inkSoft }}>Chargement…</span>
      ) : (
        data.map((s) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{s.device}</span>
              <span style={{ fontSize: 13, color: BAI.inkSoft }}>
                Connecté le {dateNum(s.createdAt)}
                {s.lastSeenAt ? `, vu le ${dateNum(s.lastSeenAt)}` : ''}
                {s.ip ? ` · ${s.ip}` : ''}
              </span>
            </span>
            {s.current ? (
              <Pill tone="green">Cet appareil</Pill>
            ) : (
              <TextLink style={{ fontSize: 13 }} onClick={() => void revoke(s.id)}>
                Déconnecter
              </TextLink>
            )}
          </div>
        ))
      )}
      {others > 0 && (
        <div>
          <TextLink style={{ fontSize: 13, color: BAI.error }} onClick={() => void revokeOthers()}>
            Déconnecter tous les autres appareils
          </TextLink>
        </div>
      )}
      <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>Un appareil inutilisé pendant 30 jours est déconnecté automatiquement. Un appareil que vous ne reconnaissez pas ? Déconnectez-le.</span>
    </Card>
  )
}
