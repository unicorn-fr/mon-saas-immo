import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Fields } from '../../components/FlowLayout'
import { SignaturePad } from '../../components/media'
import { Btn, Card, ChipButton, Input, Line, LoadError, Loader, Modal, PageHead, Progress, TextLink, Toggle, useToast } from '../../components/kit'
import { api, downloadPdf, pdfUrl } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import type { LandlordProfile } from '../../lib/contract'
import { useFiche } from '../../lib/fiche'
import type { ProfileView } from '../../lib/space'
import type { User } from '../../lib/types'

/** Mon compte. Maquette « Mon compte ». */
export default function Compte() {
  const { user, setUser, signOut } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
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
  const exportData = async () => {
    try {
      downloadPdf(await pdfUrl('/account/export', { timeout: 60_000 }), 'bailio-mes-donnees.json')
    } catch (e) {
      toast.error(e)
    }
  }
  const remove = async () => {
    try {
      await api('/account', { method: 'DELETE' })
      await signOut()
      navigate('/', { replace: true })
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
              <fieldset style={{ margin: 0, padding: 0, border: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Vous louez</legend>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <ChipButton pressed={p.kind !== 'SCI' && p.kind !== 'COMPANY'} onClick={() => set({ kind: p.kind === 'COUPLE' ? 'COUPLE' : 'PERSON' })}>
                    En mon nom
                  </ChipButton>
                  <ChipButton pressed={p.kind === 'SCI'} onClick={() => set({ kind: 'SCI' })}>
                    Via une SCI
                  </ChipButton>
                </div>
              </fieldset>
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
              <Line label="Prix" value="Offert pendant le lancement" />
              <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>Rien ne vous sera prélevé sans votre accord. Vous serez prévenu par email avant toute mise en place d’un abonnement.</span>
            </Card>
            <Card title="Emails de Bailio" style={{ gap: 0 }}>
              <Toggle border={false} checked={weekly} onChange={(v) => prefs({ notifyWeekly: v })} label="Récapitulatif du lundi" sub="Ce qui arrive dans la semaine : loyers, révisions, attestations." />
              <Toggle checked={urgent} onChange={(v) => prefs({ notifyUrgent: v })} label="Alertes urgentes" sub="Loyer en retard, échéance dans les trois jours." />
            </Card>
            <Card title="Vos données">
              <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Vos données sont hébergées en Suisse, chez Infomaniak, et ne sont jamais revendues.</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                <TextLink onClick={exportData}>Tout exporter</TextLink>
                <TextLink onClick={() => setConfirm(true)} style={{ color: BAI.error }}>
                  Supprimer mon compte
                </TextLink>
                <TextLink onClick={() => void signOut().then(() => navigate('/'))}>Se déconnecter</TextLink>
              </div>
            </Card>
          </aside>
        </div>
      )}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Supprimer votre compte ?"
        actions={
          <>
            <Btn variant="outline" onClick={() => setConfirm(false)}>
              Annuler
            </Btn>
            <Btn onClick={remove} style={{ background: BAI.error, borderColor: BAI.error }}>
              Oui, tout supprimer
            </Btn>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>Vos logements, vos locataires, vos baux et tous vos documents seront effacés définitivement. Pensez à tout exporter avant.</p>
      </Modal>
    </AppShell>
  )
}
