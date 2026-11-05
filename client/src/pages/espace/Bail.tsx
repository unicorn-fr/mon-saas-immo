import { useEffect, useState } from 'react'
import { MissingList } from '../../components/Missing'
import { ESignCard } from './ESign'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { TenantLink } from '../../components/TenantLink'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { PaymentModal } from '../../components/PaymentModal'
import { display } from '../../components/ui'
import { Check, Circle } from '../../components/Icons'
import { Btn, Callout, Card, Crumbs, Input, Line, LoadError, Loader, Modal, Pill, Tabs, TextLink, Toggle, btnStyle, useLoad, useToast, useConfirm } from '../../components/kit'
import { api } from '../../lib/api'
import { KIND_LABEL } from '../../lib/contract'
import { documentPath, downloadDoc, openDoc, printDoc } from '../../lib/docs'
import { currentPeriod, dateFr, dateNum, dateShort, euros, eurosCents, periodLabel, todayIso } from '../../lib/format'
import type { LeaseView } from '../../lib/space'

/** Page d'un bail. Maquette « Page d'un bail ». */
export default function Bail() {
  const { id = '' } = useParams()
  const { data, error, loading, reload, setData } = useLoad(() => api<LeaseView>(`/leases/${id}`), [id])
  return (
    <AppShell>
      {loading && !data ? <Loader /> : error || !data ? <LoadError message={error ?? ''} retry={reload} /> : <LeasePage l={data} reload={reload} setLease={setData} />}
    </AppShell>
  )
}

type LeaseTab = 'loyers' | 'bail' | 'locataire'

const STATUS: Record<string, { label: string; tone: 'owner' | 'green' | 'accent' | 'muted' }> = {
  READY: { label: 'Prêt à signer', tone: 'owner' },
  DRAFT: { label: 'En préparation', tone: 'accent' },
  ACTIVE: { label: 'Signé', tone: 'green' },
  IMPORTED: { label: 'Signé, importé', tone: 'green' },
  ENDED: { label: 'Terminé', tone: 'muted' },
}

function LeasePage({ l, reload, setLease }: { l: LeaseView; reload: () => void; setLease: (v: LeaseView) => void }) {
  const { hash, search } = useLocation()
  // « Tout voir » depuis la page du locataire : on amène les paiements à l'écran.
  useEffect(() => {
    if (hash === '#paiements') document.getElementById('paiements')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])
  const toast = useToast()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [payOpen, setPayOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(new URLSearchParams(search).get('depart') === '1')
  const [signOpen, setSignOpen] = useState(false)
  const [showAnnexes, setShowAnnexes] = useState(false)
  const [allDocs, setAllDocs] = useState(false)
  const [allPays, setAllPays] = useState(false)
  const status = STATUS[l.status === 'DRAFT' && l.ready ? 'READY' : l.status]
  const first = l.tenants[0]?.name.split(' ')[0] || 'votre locataire'
  const pdf = `/leases/${l.id}/lease.pdf`
  const t = l.terms
  const editable = l.status === 'DRAFT' || l.status === 'ACTIVE'
  const missing = l.completion.steps.filter((s) => s.applicable && !s.done)
  const annexDone = l.annexes.filter((a) => a.done).length
  const guard = (fn: () => Promise<unknown>) => () => fn().catch(toast.error)

  const send = guard(async () => {
    if (!(await confirm({ title: 'Envoyer le bail ?', text: `Le bail part par email à ${l.tenantName || 'votre locataire'}.` }))) return
    const r = await api<{ sentTo: string[] }>(`/leases/${l.id}/send`, { method: 'POST' })
    toast.show(`Bail envoyé à ${r.sentTo.join(', ')}.`)
  })
  const sign = guard(async () => {
    const v = await api<LeaseView>(`/leases/${l.id}/sign`, { method: 'POST' })
    setLease(v)
    setSignOpen(false)
    toast.show(l.status === 'DRAFT' ? 'Bail signé : les loyers, quittances et rappels démarrent.' : 'Nouvelle version enregistrée.')
  })
  const reopen = guard(async () => {
    if (!window.confirm('Repasser ce bail en préparation ? À faire seulement s’il n’a pas encore été signé.')) return
    setLease(await api<LeaseView>(`/leases/${l.id}/reopen`, { method: 'POST' }))
    toast.show('Bail repassé en préparation. Complétez les mentions manquantes, puis faites-le signer.')
  })
  const removeDraft = guard(async () => {
    if (!window.confirm('Supprimer ce bail en préparation ?')) return
    await api(`/leases/${l.id}`, { method: 'DELETE' })
    toast.show('Bail supprimé.')
    navigate(`/espace/logements/${l.property.id}`)
  })

  const annexAction = (key: string): { label: string; onClick?: () => void; to?: string } | null => {
    if (key.startsWith('caution-')) return { label: 'Ouvrir', onClick: guard(() => openDoc(`/leases/${l.id}/guarantee/${key.slice(8)}.pdf`)) }
    if (key === 'inventory') return { label: l.status === 'DRAFT' ? 'Après signature' : 'Le faire', to: l.status === 'DRAFT' ? undefined : `/espace/baux/${l.id}/etat-des-lieux` }
    if (key === 'notice') return { label: 'Ouvrir', onClick: guard(() => openDoc('/notice-information.pdf')) }
    if (key === 'repairs') return { label: 'Ouvrir', onClick: guard(() => openDoc('/reparations-locatives.pdf')) }
    if (key === 'charges') return { label: 'Ouvrir', onClick: guard(() => openDoc('/charges-recuperables.pdf')) }
    if (key === 'copro' || key === 'furniture') return { label: 'Compléter', to: `/espace/logements/${l.property.id}/fiche#${key === 'copro' ? 'copro' : 'furniture'}` }
    return { label: 'L’ajouter', to: `/espace/logements/${l.property.id}?onglet=diagnostics` }
  }

  // Bail signé : trois onglets plutôt qu'une longue page (loyers d'abord, c'est ce qu'on vient voir le plus souvent).
  const signed = !(l.status === 'DRAFT' || (l.status === 'ACTIVE' && l.dirty))
  const tabs: Array<{ value: LeaseTab; label: string }> = [
    { value: 'loyers', label: 'Loyers' },
    { value: 'bail', label: 'Le bail' },
    { value: 'locataire', label: l.tenants.length > 1 ? 'Locataires' : 'Locataire' },
  ]
  const fromUrl = new URLSearchParams(search).get('onglet') ?? (hash === '#locataire' ? 'locataire' : hash === '#paiements' ? 'loyers' : null)
  const [tab, setTab] = useState<LeaseTab>(tabs.some((x) => x.value === fromUrl) ? (fromUrl as LeaseTab) : 'loyers')
  useEffect(() => {
    if (fromUrl && tabs.some((x) => x.value === fromUrl)) setTab(fromUrl as LeaseTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromUrl])
  const pickTab = (v: LeaseTab) => {
    setTab(v)
    navigate({ search: v === 'loyers' ? '' : `?onglet=${v}` }, { replace: true })
  }

  const annexCard = (
    <>
          <Card title={<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 12, paddingBottom: 8 }}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Pièces à joindre au bail</h2><span style={{ fontSize: 14, color: BAI.inkSoft }}>{annexDone} sur {l.annexes.length}</span></div>} style={{ gap: 0 }}>
            {(showAnnexes ? l.annexes : l.annexes.filter((a) => !a.done)).map((a) => {
              const act = a.done && !a.key.startsWith('caution-') && !['notice', 'repairs', 'charges'].includes(a.key) ? null : annexAction(a.key)
              return (
                <div key={a.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: `1px solid ${BAI.dividerSoft}` }}>
                  <span style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15 }}>
                    {a.done ? <Check /> : <Circle color={BAI.error} />}
                    {a.label}
                  </span>
                  {act ? (
                    act.to ? (
                      <TextLink to={act.to}>{a.key === 'inventory' && l.terms.startDate && l.status !== 'DRAFT' ? `Le faire le ${dateFr(l.terms.startDate, false)}` : act.label}</TextLink>
                    ) : act.onClick ? (
                      <TextLink onClick={act.onClick}>{act.label}</TextLink>
                    ) : (
                      <span style={{ fontSize: 14, color: BAI.inkSoft }}>{a.status}</span>
                    )
                  ) : (
                    <span style={{ fontSize: 15, fontWeight: 600, color: a.done ? BAI.green : BAI.inkSoft }}>{a.status}</span>
                  )}
                </div>
              )
            })}
            <div style={{ borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
              {annexDone === l.annexes.length && !showAnnexes ? <span style={{ fontSize: 15, color: BAI.green, fontWeight: 600, marginRight: 16 }}>Toutes les pièces sont prêtes.</span> : null}
              <TextLink onClick={() => setShowAnnexes(!showAnnexes)} style={{ fontSize: 14 }}>
                {showAnnexes ? 'Ne voir que ce qui manque' : `Voir les ${l.annexes.length} pièces`}
              </TextLink>
            </div>
          </Card>
    </>
  )
  const payCard = (
    <>
          {l.status !== 'DRAFT' ? (
            <Card id="paiements" title="Loyers et quittances" action={l.status !== 'ENDED' ? <Btn size="sm" onClick={() => setPayOpen(true)}>Loyer reçu</Btn> : null}>
              <Line label={(l.rent.unpaidPeriods?.length ?? 0) > 1 ? "Loyers" : "Ce mois-ci"} value={l.rent.label} tone={l.rent.key === 'PAID' ? 'green' : l.rent.key === 'LATE' ? 'error' : undefined} />
              {l.status !== 'ENDED' ? (
                <>
                  <Toggle
                    checked={Boolean(l.facts?.receiptAuto)}
                    onChange={(v) =>
                      void api(`/leases/${l.id}/receipt-auto`, { method: 'PUT', body: { auto: v } })
                        .then(() => {
                          toast.show(v ? 'La quittance partira dès que vous notez le loyer reçu.' : 'Envoi des quittances par email arrêté.')
                          reload()
                        })
                        .catch(toast.error)
                    }
                    label="Quittance par email dès que le loyer est noté reçu"
                    sub={
                      l.facts?.eReceiptConsent || l.tenants.some((x) => x.email)
                        ? 'La quittance part tout de suite au locataire.'
                        : 'Ajoutez l’email du locataire dans sa fiche pour l’activer.'
                    }
                  />
                  {l.facts?.receiptAuto ? (
                    <Toggle
                      checked={Boolean(l.facts?.receiptAssume)}
                      onChange={(v) =>
                        void api(`/leases/${l.id}/receipt-auto`, { method: 'PUT', body: { assume: v } })
                          .then(() => {
                            toast.show(v ? 'Sans nouvelle de votre part, le loyer sera noté reçu 7 jours après l’échéance.' : 'Bailio attendra que vous notiez le loyer reçu.')
                            reload()
                          })
                          .catch(toast.error)
                      }
                      label="Sans nouvelle de moi, noter le loyer reçu 7 jours après l’échéance"
                      sub="Facultatif. La quittance prouve le paiement : activez-le seulement si votre locataire paie toujours à l’heure. Vous êtes prévenu 3 jours avant et pouvez l’arrêter d’un clic."
                    />
                  ) : null}
                </>
              ) : null}
              {l.facts?.autoReceipt ? (
                l.facts.autoReceipt.held ? (
                  <Callout tone="warn" title={`Quittance de ${periodLabel(l.facts.autoReceipt.period)} : envoi annulé`}>
                    Elle ne part pas tant que le loyer n’est pas reçu.{' '}
                    <TextLink to={`/espace/baux/${l.id}/courriers?type=REMINDER`} style={{ fontSize: 14 }}>
                      Envoyer une demande de paiement
                    </TextLink>
                    {' · '}
                    <TextLink
                      style={{ fontSize: 14 }}
                      onClick={guard(async () => {
                        await api(`/leases/${l.id}/receipt-hold`, { method: 'POST', body: { period: l.facts!.autoReceipt!.period, hold: false } })
                        reload()
                      })}
                    >
                      Rétablir l’envoi
                    </TextLink>
                  </Callout>
                ) : (
                  <Callout tone="info" title={`Quittance de ${periodLabel(l.facts.autoReceipt.period)} : envoi automatique le ${dateShort(l.facts.autoReceipt.sendOn)}`}>
                    Rien à faire si le loyer arrive.{' '}
                    <TextLink
                      style={{ fontSize: 14 }}
                      onClick={guard(async () => {
                        await api(`/leases/${l.id}/receipt-hold`, { method: 'POST', body: { period: l.facts!.autoReceipt!.period, hold: true } })
                        toast.show('Envoi annulé.')
                        reload()
                      })}
                    >
                      Le loyer n’est pas arrivé
                    </TextLink>
                  </Callout>
                )
              ) : null}
              {l.payments.length ? (
                (allPays ? l.payments : l.payments.slice(0, 3)).map((p) => (
                  <div key={p.period} className="col-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 15, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
                    <span style={{ fontWeight: 600, minWidth: 140 }}>{periodLabel(p.period, true)}</span>
                    <span style={{ color: BAI.inkMid, flex: 1 }}>
                      {eurosCents(p.amountCents)} reçus le {dateShort(p.receivedAt)}
                      {p.full ? '' : ' · paiement partiel'}
                    </span>
                    <span style={{ display: 'flex', gap: 12 }}>
                      <TextLink style={{ fontSize: 14 }} onClick={guard(() => openDoc(`/leases/${l.id}/receipts/${p.period}.pdf`))}>
                        {p.full ? 'Quittance' : 'Reçu'}
                      </TextLink>
                      <TextLink
                        style={{ fontSize: 14 }}
                        onClick={guard(async () => {
                          if (!(await confirm({ title: `Envoyer ${p.full ? 'la quittance' : 'le reçu'} ?`, text: `Celui de ${periodLabel(p.period)} part par email à ${l.tenantName || 'votre locataire'}.` }))) return
                          const r = await api<{ sentTo: string[] }>(`/leases/${l.id}/receipts/${p.period}/send`, { method: 'POST' })
                          toast.show(`Envoyé à ${r.sentTo.join(', ')}.`)
                        })}
                      >
                        Envoyer
                      </TextLink>
                      <TextLink
                        style={{ fontSize: 14, color: BAI.error }}
                        onClick={guard(async () => {
                          if (!window.confirm(`Annuler le loyer de ${periodLabel(p.period)} ? La quittance sera retirée.`)) return
                          await api(`/leases/${l.id}/payments/${p.period}`, { method: 'DELETE' })
                          reload()
                        })}
                      >
                        Annuler
                      </TextLink>
                    </span>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: 15, color: BAI.inkMid }}>Aucun loyer enregistré pour l’instant.</span>
              )}
              {l.payments.length > 3 ? (
                <TextLink onClick={() => setAllPays(!allPays)} style={{ fontSize: 14 }}>
                  {allPays ? 'Voir moins' : `Voir les ${l.payments.length} loyers`}
                </TextLink>
              ) : null}
              {l.status !== 'ENDED' ? (
                <TextLink style={{ fontSize: 14 }} onClick={guard(() => openDoc(`/leases/${l.id}/notice/${nextPeriod()}.pdf`))}>
                  Avis d’échéance de {periodLabel(nextPeriod())}
                </TextLink>
              ) : null}
            </Card>
          ) : null}
    </>
  )
  const taxCard = (
    <>
          {l.status !== 'DRAFT' && l.kind !== 'PARKING' ? (
            <Card title="Impôts">
              <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>{l.status === 'ENDED' ? 'Le départ du locataire se signale aux impôts.' : 'L’arrivée du locataire se signale aux impôts, et une première location meublée s’enregistre. Tout est prêt à copier.'}</span>
              <TextLink to={`/espace/baux/${l.id}/impots`}>Déclarer ce bail aux impôts</TextLink>
            </Card>
          ) : null}
    </>
  )
  const docsCard = (
    <>
          {l.documents.length ? (
            <Card title="Documents de ce bail">
              {(allDocs ? l.documents : l.documents.slice(0, 3)).map((d) => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
                  <span>
                    {d.title}
                    {d.kind === 'LEASE' ? <span style={{ color: BAI.inkSoft }}> · version {d.version}</span> : null}
                  </span>
                  <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className="hide-sm" style={{ fontSize: 13, color: BAI.inkSoft }}>
                      {dateNum(d.createdAt)}
                    </span>
                    <TextLink style={{ fontSize: 14 }} onClick={guard(() => openDoc(documentPath(d.id)))}>
                      Ouvrir
                    </TextLink>
                  </span>
                </div>
              ))}
              {l.documents.length > 3 ? (
                <TextLink onClick={() => setAllDocs(!allDocs)} style={{ fontSize: 14 }}>
                  {allDocs ? 'Voir moins' : `Voir les ${l.documents.length} documents`}
                </TextLink>
              ) : null}
            </Card>
          ) : null}
    </>
  )
  const summaryCard = (
    <>
          <Card title="En résumé">
            <Line label="Loyer" value={`${euros(l.columns.rentCents)} + ${euros(l.columns.chargesCents)} de charges (${t.chargesMode === 'FORFAIT' ? 'forfait' : 'provision'})`} />
            {l.kind !== 'MOBILITE' ? <Line label="Dépôt de garantie" value={euros(l.columns.depositCents)} /> : null}
            <Line label="Paiement" value={`le ${l.columns.paymentDay === 1 ? '1er' : l.columns.paymentDay} du mois`} />
            <Line label="Révision" value={t.revision?.enabled === false || !l.computed.revisionAllowed ? 'aucune' : `chaque ${dateFr(`2000-${t.revision?.date ?? l.columns.startDate.slice(5)}`, false)}`} />
            <Line label="Durée" value={`${l.computed.durationMonths >= 12 && l.computed.durationMonths % 12 === 0 ? `${l.computed.durationMonths / 12} an${l.computed.durationMonths > 12 ? 's' : ''}` : `${l.computed.durationMonths} mois`}`} />
            <span style={{ fontSize: 13, color: BAI.inkSoft }}>{l.computed.renewal}.</span>
            {signed ? (
              <div style={{ display: 'flex', gap: '10px 22px', flexWrap: 'wrap', borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 14 }}>
                <TextLink onClick={guard(() => openDoc(pdf))}>Ouvrir le bail</TextLink>
                <TextLink onClick={guard(() => printDoc(pdf))}>Imprimer</TextLink>
                <TextLink onClick={guard(() => downloadDoc(pdf, 'bail.pdf'))}>Télécharger</TextLink>
                {l.tenants.some((x) => x.email) ? <TextLink onClick={send}>L’envoyer à {first} par email</TextLink> : null}
                {editable ? <TextLink to={`/espace/baux/${l.id}/contrat`}>Modifier une information</TextLink> : null}
              </div>
            ) : null}
          </Card>
    </>
  )
  const peopleCard = (
    <>
          <Card title="Personnes">
            {l.tenants.map((x) => (
              <Line key={x.id} label="Locataire" value={<Link to={`/espace/locataires/${x.id}`} className="tap" style={{ textDecoration: 'none' }}>{x.name}</Link>} />
            ))}
            {l.guarantors.map((g) => (
              <Line key={g.tenantId} label="Garant" value={<Link to={`/espace/locataires/${g.tenantId}/caution`} className="tap" style={{ textDecoration: 'none' }}>{g.name}</Link>} />
            ))}
          </Card>
    </>
  )
  const tenantLinkCard = (
    <>
          <div id="locataire">{l.status === 'ACTIVE' || l.status === 'IMPORTED' ? <TenantLink leaseId={l.id} tenantEmail={l.tenants.find((x) => x.email)?.email} /> : null}</div>
    </>
  )

  return (
    <>
      <Crumbs items={[{ label: 'Logements', to: '/espace/logements' }, { label: l.property.name, to: `/espace/logements/${l.property.id}` }, { label: 'Bail' }]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <h1 style={display('clamp(38px, 5vw, 52px)')}>Bail de {l.tenantName || 'votre locataire'}</h1>
          <Pill tone={status.tone}>{status.label}</Pill>
        </div>
        <span style={{ fontSize: 16, color: BAI.inkMid }}>
          {KIND_LABEL[l.kind]} · {l.property.address} · du {dateFr(l.columns.startDate)} au {dateFr(l.columns.endDate)}
          {signed && l.signedAt ? ` · signé le ${dateNum(l.signedAt)}` : ''}
        </span>
      </div>

      <div className="split-aside" style={{ gap: 24 }}>
        <div className="grow">
          {l.status === 'DRAFT' && l.checklist?.length ? <MissingList items={l.checklist} /> : null}
          {l.status === 'DRAFT' && !l.ready && !l.checklist?.length && missing.length ? (
            <Callout tone="tip" title="Encore quelques informations avant la signature">
              Il manque : {missing.map((s) => s.label.toLowerCase()).join(', ')}.{' '}
              <TextLink to={`/espace/baux/${l.id}/contrat`} style={{ fontSize: 13 }}>
                Compléter le bail
              </TextLink>
            </Callout>
          ) : null}
          {l.status === 'ACTIVE' && l.reopen ? (
            <Callout tone="warn" title={`Ce bail est incomplet : il manque ${l.reopen.missing} mention${l.reopen.missing > 1 ? 's' : ''} obligatoire${l.reopen.missing > 1 ? 's' : ''}`}>
              Il a été créé avant que Bailio vérifie toutes les mentions légales.{' '}
              {l.reopen.allowed ? (
                <>
                  S’il n’est pas signé, repassez-le en préparation : Bailio vous demandera ce qui manque.{' '}
                  <TextLink style={{ fontSize: 13 }} onClick={reopen}>
                    Repasser en préparation
                  </TextLink>
                </>
              ) : (
                'Des loyers ou un état des lieux sont déjà enregistrés : pour corriger le bail, modifiez-le puis faites signer un avenant.'
              )}
            </Callout>
          ) : null}
          {l.status === 'ACTIVE' && l.dirty ? (
            <Callout tone="warn" title="Le bail a changé depuis la signature">
              Faites signer la nouvelle version (un avenant) par les deux parties, puis indiquez-le ici. La précédente reste conservée.
            </Callout>
          ) : null}
          {l.computed.energyWarning ? <Callout tone="warn">{l.computed.energyWarning}</Callout> : null}
          {l.status === 'DRAFT' && l.computed.rentIssues?.length ? (
            <Callout tone="warn" title="Le loyer dépasse ce que la loi permet">
              {l.computed.rentIssues.map((i) => i.message).join(' ')}{' '}
              <TextLink to={`/espace/baux/${l.id}/contrat#rent`} style={{ fontSize: 13 }}>
                Corriger le loyer
              </TextLink>
            </Callout>
          ) : null}

          {l.status === 'DRAFT' && l.ready && !l.checkedAt ? (
            <Card title="Relisez le bail avant de l’envoyer">
              <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.55 }}>
                Vérifiez les noms, l’adresse, le loyer, les charges, le dépôt et les dates. Une erreur ? Corrigez la fiche : le bail se met à jour tout seul.
              </span>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Btn variant="outline" onClick={guard(() => openDoc(pdf))}>
                  Ouvrir le bail
                </Btn>
                <Btn onClick={guard(async () => setLease(await api<LeaseView>(`/leases/${l.id}/checked`, { method: 'POST' })))}>J’ai relu, tout est juste</Btn>
              </div>
            </Card>
          ) : null}
          <div id="signature">{l.status === 'DRAFT' || (l.status === 'ACTIVE' && l.dirty) ? <ESignCard leaseId={l.id} ready={l.status === 'DRAFT' ? l.ready : true} amendment={l.status === 'ACTIVE'} onChange={reload} secondary={l.status === 'DRAFT' && l.ready && !l.checkedAt} /> : null}</div>

          {l.status === 'DRAFT' || (l.status === 'ACTIVE' && l.dirty) ? (
            <Card title="Que voulez-vous faire ?">
              {/* Liens simples plutôt que quatre gros boutons : l'action principale de l'écran reste la signature. */}
              <div style={{ display: 'flex', gap: '10px 22px', flexWrap: 'wrap' }}>
                <TextLink onClick={guard(() => printDoc(pdf))}>{l.status === 'DRAFT' ? 'Imprimer pour signer à la main' : 'Imprimer'}</TextLink>
                <TextLink onClick={guard(() => downloadDoc(pdf, 'bail.pdf'))}>Télécharger le PDF</TextLink>
                {l.tenants.some((x) => x.email) ? <TextLink onClick={send}>L’envoyer à {first} par email</TextLink> : null}
                {editable ? <TextLink to={`/espace/baux/${l.id}/contrat`}>Modifier une information</TextLink> : <TextLink onClick={guard(() => openDoc(pdf))}>Ouvrir le bail</TextLink>}
              </div>
              {l.tenants.some((x) => x.email) ? null : <span style={{ fontSize: 13, color: BAI.inkSoft }}>Pour l’envoyer par email, ajoutez l’adresse du locataire dans sa fiche.</span>}
              {l.status === 'DRAFT' || (l.status === 'ACTIVE' && l.dirty) ? (
                <div style={{ borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{l.status === 'DRAFT' ? 'Signé sur papier ? Indiquez-le : Bailio lance les quittances et les rappels.' : 'Une fois signée, indiquez-le pour la conserver.'}</span>
                  <div>
                    <Btn variant="dark" onClick={() => setSignOpen(true)} disabled={l.status === 'DRAFT' && !l.ready}>
                      {l.status === 'DRAFT' ? 'Le bail est signé sur papier' : 'La nouvelle version est signée'}
                    </Btn>
                  </div>
                </div>
              ) : l.signedAt ? (
                <span style={{ fontSize: 14, color: BAI.inkSoft }}>Signé le {dateNum(l.signedAt)}.</span>
              ) : null}
            </Card>
          ) : null}

          {signed ? (
            <>
              <Tabs label="Sections du bail" tabs={tabs} value={tab} onChange={pickTab} />
              <div key={tab} role="tabpanel" aria-label={tabs.find((x) => x.value === tab)!.label} className="panel-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {tab === 'loyers' ? payCard : null}
                {tab === 'bail' ? (
                  <>
                    {summaryCard}
                    {annexCard}
                    {docsCard}
                  </>
                ) : null}
                {tab === 'locataire' ? (
                  <>
                    {tenantLinkCard}
                    {peopleCard}
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {annexCard}
              {payCard}
              {taxCard}
              {docsCard}
            </>
          )}
        </div>

        <aside className="aside" style={{ width: 380 }}>
          {signed ? null : summaryCard}
          {l.status !== 'DRAFT' ? (
          <Card dark title="Plus tard" style={{ gap: 12 }}>
            {l.status === 'ACTIVE' ? (
              <Link to={`/espace/baux/${l.id}/contrat`} className="tap" style={darkLink}>
                Créer un avenant
              </Link>
            ) : null}
            {l.status !== 'ENDED' ? (
              <>
                <Link to={`/espace/baux/${l.id}/courriers`} className="tap" style={darkLink}>
                  Quittances et courriers
                </Link>
                <Link to="/espace/situations" className="tap" style={darkLink}>
                  Que se passe-t-il ?
                </Link>
                {l.computed.noticeMonths ? (
                  <Link to={`/espace/baux/${l.id}/courriers?type=NOTICE_TO_LEAVE`} className="tap" style={darkLink}>
                    Donner congé
                  </Link>
                ) : null}
                <button type="button" className="tap" onClick={() => setEndOpen(true)} style={{ ...darkLink, background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                  Enregistrer le départ du locataire
                </button>
              </>
            ) : null}
            {l.status === 'ENDED' ? (
              <Link to={`/espace/baux/${l.id}/courriers?type=DEPOSIT_RETURN`} className="tap" style={darkLink}>
                Restituer le dépôt de garantie
              </Link>
            ) : null}
            {signed && l.kind !== 'PARKING' ? (
              <Link to={`/espace/baux/${l.id}/impots`} className="tap" style={darkLink}>
                {l.status === 'ENDED' ? 'Signaler le départ aux impôts' : 'Déclarer ce bail aux impôts'}
              </Link>
            ) : null}
          </Card>
          ) : null}
          {signed ? null : peopleCard}
          {/* Suppression discrète : une action rare et irréversible ne mérite pas un bloc sombre en évidence. */}
          {l.status === 'DRAFT' ? (
            <TextLink onClick={removeDraft} style={{ fontSize: 14, color: BAI.error, alignSelf: 'flex-start' }}>
              Supprimer ce bail en préparation
            </TextLink>
          ) : null}
          {signed ? null : tenantLinkCard}
        </aside>
      </div>

      <Modal
        open={signOpen}
        onClose={() => setSignOpen(false)}
        title={l.status === 'DRAFT' ? 'Le bail est signé ?' : 'Nouvelle version signée ?'}
        actions={
          <>
            <Btn variant="outline" onClick={() => setSignOpen(false)}>
              Pas encore
            </Btn>
            <Btn onClick={sign}>Oui, c’est signé</Btn>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>
          {l.status === 'DRAFT'
            ? 'Bailio conserve cette version telle quelle, avec les actes de caution. Loyers, quittances et rappels démarrent.'
            : 'Bailio conserve cette version en plus de la précédente. Les loyers suivants en tiennent compte.'}
        </p>
      </Modal>
      <EndModal open={endOpen} onClose={() => setEndOpen(false)} lease={l} onDone={setLease} />
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} onSaved={reload} leaseId={l.id} dueCents={l.columns.rentCents + l.columns.chargesCents} tenantEmail={l.tenants.find((x) => x.email)?.email} emailConsent={Boolean(l.facts?.eReceiptConsent)} />
    </>
  )
}

const darkLink = { color: BAI.surface, textDecoration: 'none', fontSize: 15 } as const

function nextPeriod(): string {
  const d = new Date()
  return currentPeriod(new Date(d.getFullYear(), d.getMonth() + 1, 1))
}

function EndModal({ open, onClose, lease, onDone }: { open: boolean; onClose: () => void; lease: LeaseView; onDone: (v: LeaseView) => void }) {
  const toast = useToast()
  const navigate = useNavigate()
  const exit = lease.inventories.find((i) => i.kind === 'EXIT')
  // Déjà connus : remise des clés (état des lieux de sortie), fin du préavis, nouvelle adresse.
  const [keysDate, setKeysDate] = useState(lease.facts?.keysDate ?? (exit?.status === 'SIGNED' ? exit.date : null) ?? lease.facts?.tenantNotice?.endDate ?? todayIso())
  const [newAddress, setNewAddress] = useState(lease.contract.tenants[0]?.newAddress ?? '')
  const save = async () => {
    if (!keysDate) return toast.show('Indiquez la date de remise des clés.', 'error')
    try {
      const v = await api<LeaseView>(`/leases/${lease.id}/end`, { method: 'POST', body: { keysDate, newAddress: newAddress || undefined } })
      onDone(v)
      onClose()
      toast.show('Départ enregistré. Il reste à restituer le dépôt de garantie.')
    } catch (e) {
      toast.error(e)
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Départ du locataire"
      actions={
        <>
          <Btn variant="outline" onClick={onClose}>
            Annuler
          </Btn>
          <Btn onClick={save}>Enregistrer le départ</Btn>
        </>
      }
    >
      <Input label="Date de remise des clés" type="date" value={keysDate} onChange={setKeysDate} />
      <Input label="Nouvelle adresse du locataire" value={newAddress} onChange={setNewAddress} hint="Obligatoire pour restituer le dépôt de garantie." />
      {!exit || exit.status !== 'SIGNED' ? (
        <Callout tone="tip">
          Pensez à l’état des lieux de sortie avant la remise des clés.{' '}
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate(`/espace/baux/${lease.id}/etat-des-lieux?type=EXIT`)
            }}
            style={{ ...btnStyle('ghost', 'sm'), height: 'auto', padding: 0, color: BAI.owner }}
          >
            Le préparer
          </button>
        </Callout>
      ) : null}
      <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>{lease.kind === 'PARKING' ? 'Le dépôt de garantie est à restituer dans le mois qui suit la remise des clés.' : 'Le dépôt de garantie doit être restitué dans un mois si l’état des lieux de sortie est conforme à l’entrée, deux mois sinon (article 22 de la loi du 6 juillet 1989).'}</span>
    </Modal>
  )
}
