import { useEffect, useState } from 'react'
import { MissingList } from '../../components/Missing'
import { ESignCard } from './ESign'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { PaymentModal } from '../../components/PaymentModal'
import { display } from '../../components/ui'
import { Check, Circle } from '../../components/Icons'
import { Btn, Callout, Card, Crumbs, Input, Line, LoadError, Loader, Modal, Pill, TextLink, btnStyle, useLoad, useToast } from '../../components/kit'
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

const STATUS: Record<string, { label: string; tone: 'owner' | 'green' | 'caramel' | 'muted' }> = {
  READY: { label: 'Prêt à signer', tone: 'owner' },
  DRAFT: { label: 'En préparation', tone: 'caramel' },
  ACTIVE: { label: 'Signé', tone: 'green' },
  IMPORTED: { label: 'Signé, importé', tone: 'green' },
  ENDED: { label: 'Terminé', tone: 'muted' },
}

function LeasePage({ l, reload, setLease }: { l: LeaseView; reload: () => void; setLease: (v: LeaseView) => void }) {
  const { hash } = useLocation()
  // « Tout voir » depuis la page du locataire : on amène les paiements à l'écran.
  useEffect(() => {
    if (hash === '#paiements') document.getElementById('paiements')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])
  const toast = useToast()
  const navigate = useNavigate()
  const [payOpen, setPayOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)
  const [signOpen, setSignOpen] = useState(false)
  const status = STATUS[l.status === 'DRAFT' && l.ready ? 'READY' : l.status]
  const first = l.tenants[0]?.name.split(' ')[0] || 'votre locataire'
  const pdf = `/leases/${l.id}/lease.pdf`
  const t = l.terms
  const editable = l.status === 'DRAFT' || l.status === 'ACTIVE'
  const missing = l.completion.steps.filter((s) => s.applicable && !s.done)
  const annexDone = l.annexes.filter((a) => a.done).length
  const guard = (fn: () => Promise<unknown>) => () => fn().catch(toast.error)

  const send = guard(async () => {
    const r = await api<{ sentTo: string[] }>(`/leases/${l.id}/send`, { method: 'POST' })
    toast.show(`Bail envoyé à ${r.sentTo.join(', ')}.`)
  })
  const sign = guard(async () => {
    const v = await api<LeaseView>(`/leases/${l.id}/sign`, { method: 'POST' })
    setLease(v)
    setSignOpen(false)
    toast.show(l.status === 'DRAFT' ? 'Bail signé : les loyers, quittances et rappels démarrent.' : 'Nouvelle version enregistrée.')
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
    if (key === 'notice') return null
    if (key === 'copro' || key === 'furniture') return { label: 'Compléter', to: `/espace/logements/${l.property.id}/fiche#${key === 'copro' ? 'copro' : 'furniture'}` }
    return { label: 'L’ajouter', to: `/espace/logements/${l.property.id}?onglet=diagnostics` }
  }

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
          {l.status === 'ACTIVE' && l.dirty ? (
            <Callout tone="warn" title="Le bail a changé depuis la signature">
              Faites signer la nouvelle version par les deux parties (c’est un avenant), puis indiquez-le ici. La version signée précédente reste conservée.
            </Callout>
          ) : null}
          {l.computed.energyWarning ? <Callout tone="warn">{l.computed.energyWarning}</Callout> : null}

          {l.status === 'DRAFT' || (l.status === 'ACTIVE' && l.dirty) ? <ESignCard leaseId={l.id} ready={l.status === 'DRAFT' ? l.ready : true} amendment={l.status === 'ACTIVE'} onChange={reload} /> : null}

          <Card title="Que voulez-vous faire ?">
            <div className="grid-2" style={{ gap: 12 }}>
              <Btn size="lg" variant={l.status === 'DRAFT' ? 'outline' : 'primary'} onClick={guard(() => printDoc(pdf))} style={{ fontSize: 15, padding: '0 16px' }}>
                {l.status === 'DRAFT' ? 'Imprimer pour signer à la main' : 'Imprimer'}
              </Btn>
              <Btn size="lg" variant="outline" onClick={guard(() => downloadDoc(pdf, 'bail.pdf'))} style={{ fontSize: 15, padding: '0 16px' }}>
                Télécharger le PDF
              </Btn>
              <Btn size="lg" variant="outline" onClick={send} disabled={!l.tenants.some((x) => x.email)} title={l.tenants.some((x) => x.email) ? undefined : 'Ajoutez l’email du locataire dans sa fiche'} style={{ fontSize: 15, padding: '0 16px' }}>
                L’envoyer à {first} par email
              </Btn>
              {editable ? (
                <Btn size="lg" variant="outline" to={`/espace/baux/${l.id}/contrat`} style={{ fontSize: 15, padding: '0 16px' }}>
                  Modifier une information
                </Btn>
              ) : (
                <Btn size="lg" variant="outline" onClick={guard(() => openDoc(pdf))} style={{ fontSize: 15, padding: '0 16px' }}>
                  Ouvrir le bail
                </Btn>
              )}
            </div>
            {l.status === 'DRAFT' || (l.status === 'ACTIVE' && l.dirty) ? (
              <div style={{ borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>{l.status === 'DRAFT' ? 'Signé sur papier par vous et votre locataire ? Indiquez-le : Bailio lance les quittances, les rappels et prépare l’état des lieux.' : 'Quand la nouvelle version est signée, indiquez-le pour la conserver.'}</span>
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

          <Card title={<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 12, paddingBottom: 8 }}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Pièces à joindre au bail</h2><span style={{ fontSize: 14, color: BAI.inkSoft }}>{annexDone} sur {l.annexes.length}</span></div>} style={{ gap: 0 }}>
            {l.annexes.map((a) => {
              const act = a.done && !a.key.startsWith('caution-') ? null : annexAction(a.key)
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
          </Card>

          {l.status !== 'DRAFT' ? (
            <Card id="paiements" title="Loyers et quittances" action={l.status !== 'ENDED' ? <Btn size="sm" onClick={() => setPayOpen(true)}>Loyer reçu</Btn> : null}>
              <Line label="Ce mois-ci" value={l.rent.label} tone={l.rent.key === 'PAID' ? 'green' : l.rent.key === 'LATE' ? 'error' : undefined} />
              {l.payments.length ? (
                l.payments.map((p) => (
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
              {l.status !== 'ENDED' ? (
                <TextLink style={{ fontSize: 14 }} onClick={guard(() => openDoc(`/leases/${l.id}/notice/${nextPeriod()}.pdf`))}>
                  Avis d’échéance de {periodLabel(nextPeriod())}
                </TextLink>
              ) : null}
            </Card>
          ) : null}

          {l.documents.length ? (
            <Card title="Documents de ce bail">
              {l.documents.map((d) => (
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
            </Card>
          ) : null}
        </div>

        <aside className="aside" style={{ width: 380 }}>
          <Card title="En résumé">
            <Line label="Loyer" value={euros(l.columns.rentCents)} />
            <Line label="Charges" value={`${euros(l.columns.chargesCents)}, ${t.chargesMode === 'FORFAIT' ? 'forfait' : t.chargesMode === 'PERIODIC' ? 'provision' : 'provision'}`} />
            {l.kind !== 'MOBILITE' ? <Line label="Dépôt de garantie" value={euros(l.columns.depositCents)} /> : null}
            <Line label="Paiement" value={`le ${l.columns.paymentDay === 1 ? '1er' : l.columns.paymentDay} du mois`} />
            <Line label="Révision" value={t.revision?.enabled === false || !l.computed.revisionAllowed ? 'aucune' : `chaque ${dateFr(`2000-${t.revision?.date ?? l.columns.startDate.slice(5)}`, false)}`} />
            <Line label="Durée" value={`${l.computed.durationMonths >= 12 && l.computed.durationMonths % 12 === 0 ? `${l.computed.durationMonths / 12} an${l.computed.durationMonths > 12 ? 's' : ''}` : `${l.computed.durationMonths} mois`}`} />
            <span style={{ fontSize: 13, color: BAI.inkSoft }}>{l.computed.renewal}.</span>
          </Card>
          <Card dark title="Plus tard" style={{ gap: 12 }}>
            {l.status === 'ACTIVE' ? (
              <Link to={`/espace/baux/${l.id}/contrat`} style={darkLink}>
                Créer un avenant
              </Link>
            ) : null}
            {l.status !== 'DRAFT' && l.status !== 'ENDED' ? (
              <>
                <Link to={`/espace/baux/${l.id}/courriers`} style={darkLink}>
                  Quittances et courriers
                </Link>
                {l.computed.noticeMonths ? (
                  <Link to={`/espace/baux/${l.id}/courriers?type=NOTICE_TO_LEAVE`} style={darkLink}>
                    Donner congé
                  </Link>
                ) : null}
                <button type="button" onClick={() => setEndOpen(true)} style={{ ...darkLink, background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                  Enregistrer le départ du locataire
                </button>
              </>
            ) : null}
            {l.status === 'ENDED' ? (
              <Link to={`/espace/baux/${l.id}/courriers?type=DEPOSIT_RETURN`} style={darkLink}>
                Restituer le dépôt de garantie
              </Link>
            ) : null}
            {l.status === 'DRAFT' ? (
              <button type="button" onClick={removeDraft} style={{ ...darkLink, background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                Supprimer ce bail en préparation
              </button>
            ) : null}
          </Card>
          <Card title="Personnes">
            {l.tenants.map((x) => (
              <Line key={x.id} label="Locataire" value={<Link to={`/espace/locataires/${x.id}`} style={{ textDecoration: 'none' }}>{x.name}</Link>} />
            ))}
            {l.guarantors.map((g) => (
              <Line key={g.tenantId} label="Garant" value={<Link to={`/espace/locataires/${g.tenantId}/caution`} style={{ textDecoration: 'none' }}>{g.name}</Link>} />
            ))}
          </Card>
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
            ? 'Bailio conserve cette version du bail telle quelle, avec les actes de caution. Les loyers, les quittances et les rappels (révision, assurance, fin du bail) démarrent.'
            : 'Bailio conserve cette nouvelle version, en plus de la précédente. Les loyers suivants tiennent compte des changements.'}
        </p>
        <span style={{ fontSize: 13, color: BAI.inkSoft }}>Chaque partie garde un exemplaire original signé, avec ses annexes.</span>
      </Modal>
      <EndModal open={endOpen} onClose={() => setEndOpen(false)} lease={l} onDone={setLease} />
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} onSaved={reload} leaseId={l.id} dueCents={l.columns.rentCents + l.columns.chargesCents} tenantEmail={l.tenants.find((x) => x.email)?.email} />
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
  const [keysDate, setKeysDate] = useState(todayIso())
  const [newAddress, setNewAddress] = useState('')
  const exit = lease.inventories.find((i) => i.kind === 'EXIT')
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
      <Input label="Nouvelle adresse du locataire" value={newAddress} onChange={setNewAddress} hint="Obligatoire pour lui restituer le dépôt de garantie et lui envoyer le décompte." />
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
      <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>Le dépôt de garantie doit être restitué dans un mois si l’état des lieux de sortie est conforme à l’entrée, deux mois sinon (article 22 de la loi du 6 juillet 1989).</span>
    </Modal>
  )
}
