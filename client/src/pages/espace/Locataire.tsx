import { useState } from 'react'
import { Cite } from '../../components/Sources'
import { useNavigate, useParams } from 'react-router-dom'
import { TenantDossier } from '../../components/TenantDossier'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { PaymentModal } from '../../components/PaymentModal'
import { UploadModal } from '../../components/UploadModal'
import { Avatar, Btn, Callout, Card, Crumbs, Line, LoadError, Loader, Pill, TextLink, useLoad, useToast } from '../../components/kit'
import { display } from '../../components/ui'
import { Check, Circle } from '../../components/Icons'
import { api } from '../../lib/api'
import { KIND_LABEL, TENANT_DOCUMENTS, fullName, type TenantDocKey } from '../../lib/contract'
import { openDoc } from '../../lib/docs'
import { dateFr, dateNum, dateShort, euros, eurosCents, periodLabel } from '../../lib/format'
import type { TenantView } from '../../lib/space'

/** Fiche d'un locataire. Maquette « Fiche locataire ». */
export default function Locataire() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useLoad(() => api<TenantView>(`/tenants/${id}`), [id])
  return (
    <AppShell>
      {loading && !data ? <Loader /> : error || !data ? <LoadError message={error ?? ''} retry={reload} /> : <TenantPage t={data} reload={reload} />}
    </AppShell>
  )
}

const LINKS: Record<string, string> = { parent: 'son parent' }

function TenantPage({ t, reload }: { t: TenantView; reload: () => void }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [payOpen, setPayOpen] = useState(false)
  const [upload, setUpload] = useState(false)
  const f = t.file
  const lease = t.lease
  const g = f.guarantor
  const since = lease && lease.status !== 'DRAFT' ? `Locataire ${lease.property.name ? `de ${lease.property.name}` : ''} depuis le ${dateFr(lease.startDate)}` : lease ? `Bail en préparation pour ${lease.property.name}` : t.property ? `Rattaché à ${t.property.name}` : 'Sans bail pour l’instant'

  const remove = async () => {
    if (!window.confirm('Supprimer ce locataire et sa fiche ?')) return
    try {
      await api(`/tenants/${t.id}`, { method: 'DELETE' })
      toast.show('Locataire supprimé.')
      navigate('/espace/locataires')
    } catch (e) {
      toast.error(e)
    }
  }

  const docs = Object.keys(TENANT_DOCUMENTS) as TenantDocKey[]
  const received = new Map((f.documents ?? []).map((d) => [d.category, d.received]))
  const insuranceOk = f.insurance?.expiresAt && new Date(`${f.insurance.expiresAt}T00:00:00`) > new Date()

  return (
    <>
      <Crumbs items={[{ label: 'Locataires', to: '/espace/locataires' }, { label: t.name || 'Locataire' }]} />
      <div className="col-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
          <Avatar text={t.initials} size={64} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <h1 style={display('clamp(36px, 5vw, 48px)', { overflowWrap: 'anywhere' })}>{t.name || 'Locataire'}</h1>
            <span style={{ fontSize: 16, color: BAI.inkMid }}>{since}</span>
          </div>
        </div>
        <div className="wrap-md" style={{ display: 'flex', gap: 10 }}>
          {lease ? (
            <Btn variant="outline" to={`/espace/baux/${lease.id}/courriers`}>
              Envoyer un document
            </Btn>
          ) : null}
          {lease && lease.status !== 'DRAFT' && lease.status !== 'ENDED' ? <Btn onClick={() => setPayOpen(true)}>Loyer reçu</Btn> : !lease ? <Btn to={`/espace/baux/nouveau?locataire=${t.id}${t.propertyId ? `&logement=${t.propertyId}` : ''}`}>Créer son bail</Btn> : null}
        </div>
      </div>

      <div className="split-aside" style={{ gap: 28 }}>
        <div className="aside-wide">
          <Card title="Coordonnées" action={<TextLink to={`/espace/locataires/${t.id}/fiche`} style={{ fontSize: 14 }}>Modifier</TextLink>}>
            <Line label="Email" value={f.email || 'À compléter'} />
            <Line label="Téléphone" value={f.phone || 'À compléter'} />
            <Line label={f.civility === 'MADAME' ? 'Née le' : 'Né le'} value={f.birthDate ? `${dateFr(f.birthDate)}${f.birthPlace ? ` à ${f.birthPlace}` : ''}` : 'À compléter'} />
            {f.newAddress ? <Line label="Nouvelle adresse" value={f.newAddress} /> : null}
            {f.dossierFacileUrl ? (
              <Line
                label="DossierFacile"
                value={
                  <a href={f.dossierFacileUrl} target="_blank" rel="noreferrer" style={{ color: BAI.owner, fontWeight: 600 }}>
                    Ouvrir son dossier
                  </a>
                }
              />
            ) : null}
            <span style={{ fontSize: 13, color: BAI.inkSoft }}>Fiche complétée à {t.completion.percent} %</span>
          </Card>
          <Card title="Garantie" action={g ? <TextLink to={`/espace/locataires/${t.id}/caution`} style={{ fontSize: 14 }}>Acte de caution</TextLink> : null}>
            {f.guarantee === 'CAUTION' && g ? (
              <>
                <Line label="Garant" value={`${fullName(g)}${g.link ? `, ${LINKS[g.link] ?? g.link}` : ''}`} />
                <Line label="Engagement" value={g.engagement === 'SIMPLE' ? 'Caution simple' : 'Caution solidaire'} />
                <Line label="Durée" value={g.duration === 'FIXED' && g.until ? `Jusqu’au ${dateNum(g.until)}` : 'Durée du bail et renouvellements'} />
                <Line label="Acte de caution" value={g.signedAt ? `Signé le ${dateNum(g.signedAt)}` : 'À signer'} tone={g.signedAt ? 'green' : undefined} />
              </>
            ) : f.guarantee === 'VISALE' ? (
              <Line label="Visale" value={f.visaleNumber || 'Numéro à compléter'} />
            ) : f.guarantee === 'GLI' ? (
              <Line label="Assurance loyers impayés" value="Souscrite" />
            ) : f.guarantee === 'NONE' ? (
              <span style={{ fontSize: 15, color: BAI.inkMid }}>Aucune garantie.</span>
            ) : (
              <TextLink to={`/espace/locataires/${t.id}/fiche#guarantee`}>Indiquer la garantie</TextLink>
            )}
          </Card>
          <TenantDossier tenantId={t.id} email={f.email} />
          <Card title="Justificatifs" action={<TextLink onClick={() => setUpload(true)} style={{ fontSize: 14 }}>Ajouter</TextLink>}>
            {docs.map((k) => (
              <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15 }}>
                {received.get(k) ? <Check /> : <Circle />}
                <span style={{ color: received.get(k) ? BAI.ink : BAI.inkSoft }}>{TENANT_DOCUMENTS[k]}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15 }}>
              {insuranceOk ? <Check /> : <Circle />}
              <span style={{ color: insuranceOk ? BAI.ink : BAI.error }}>{f.insurance?.expiresAt ? `Attestation d’assurance, valable jusqu’au ${dateNum(f.insurance.expiresAt)}` : 'Attestation d’assurance, à demander'}</span>
            </div>
            <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>Seules les pièces autorisées par le <Cite reference="décret n° 2015-1437" /> peuvent être demandées.</span>
          </Card>
          <div>
            <Btn variant="danger" size="sm" onClick={remove}>
              Supprimer ce locataire
            </Btn>
          </div>
        </div>

        <div className="grow">
          {t.homes.length ? (
            <Card title={t.homes.length > 1 ? 'Ses logements' : 'Son logement'}>
              {t.homes.map((h) => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10 }}>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextLink to={`/espace/logements/${h.id}`}>{h.name}</TextLink>
                    <span style={{ fontSize: 13, color: BAI.inkSoft }}>
                      {!h.leaseId ? 'Pas encore de bail' : h.status === 'DRAFT' ? 'Bail en préparation' : h.status === 'ENDED' ? `Bail terminé${h.endDate ? ` le ${dateFr(h.endDate)}` : ''}` : `Bail depuis le ${dateFr(h.startDate!)}`}
                    </span>
                  </span>
                  {h.leaseId ? (
                    <TextLink to={`/espace/baux/${h.leaseId}`} style={{ fontSize: 14 }}>
                      Voir le bail
                    </TextLink>
                  ) : null}
                </div>
              ))}
            </Card>
          ) : null}
          {lease ? (
            <Card title={<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 12 }}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Son bail</h2><Pill tone={lease.status === 'DRAFT' ? 'caramel' : lease.status === 'ENDED' ? 'muted' : 'green'}>{lease.status === 'DRAFT' ? 'En préparation' : lease.status === 'ENDED' ? 'Terminé' : 'En cours'}</Pill></div>}>
              <Line label="Type" value={KIND_LABEL[lease.kind]} />
              <Line label="Période" value={`${dateNum(lease.startDate)} au ${dateNum(lease.endDate)}`} />
              <Line label="Loyer" value={`${euros(lease.rentCents)} + ${euros(lease.chargesCents)} de charges`} />
              {lease.kind !== 'MOBILITE' ? <Line label="Dépôt de garantie" value={euros(lease.depositCents)} /> : null}
              <div className="col-md" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
                <Btn size="sm" to={`/espace/baux/${lease.id}`}>
                  Voir le bail
                </Btn>
                {lease.status !== 'DRAFT' ? (
                  <Btn size="sm" variant="outline" to={`/espace/baux/${lease.id}/etat-des-lieux`}>
                    État des lieux
                  </Btn>
                ) : null}
              </div>
            </Card>
          ) : (
            <Card title="Son bail">
              <span style={{ fontSize: 15, color: BAI.inkMid }}>Pas encore de bail.</span>
              <div>
                <Btn size="sm" to={`/espace/baux/nouveau?locataire=${t.id}${t.propertyId ? `&logement=${t.propertyId}` : ''}`}>
                  Créer son bail
                </Btn>
              </div>
            </Card>
          )}
          {lease && lease.status !== 'DRAFT' ? (
            <Card title="Paiements" action={<TextLink to={`/espace/baux/${lease.id}#paiements`} style={{ fontSize: 14 }}>Tout voir</TextLink>}>
              {t.payments.length ? (
                t.payments.slice(0, 6).map((p) => (
                  <div key={p.period} className="col-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 15, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
                    <span style={{ fontWeight: 600 }}>{periodLabel(p.period, true)}</span>
                    <span style={{ color: BAI.inkMid }}>
                      {eurosCents(p.amountCents)} reçus le {dateShort(p.receivedAt)}
                    </span>
                    <TextLink onClick={() => openDoc(`/leases/${lease.id}/receipts/${p.period}.pdf`).catch(toast.error)} style={{ fontSize: 14 }}>
                      {p.full ? 'Quittance' : 'Reçu'}
                    </TextLink>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: 15, color: BAI.inkMid }}>Aucun loyer enregistré pour l’instant.</span>
              )}
            </Card>
          ) : null}
          {t.completion.percent < 100 ? (
            <Callout tone="tip" title="Fiche à compléter">
              Il manque : {t.completion.steps.filter((s) => s.applicable && !s.done).map((s) => s.label.toLowerCase()).join(', ')}.{' '}
              <TextLink to={`/espace/locataires/${t.id}/fiche`} style={{ fontSize: 13 }}>
                Compléter la fiche
              </TextLink>
            </Callout>
          ) : null}
        </div>
      </div>
      {lease ? <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} onSaved={reload} leaseId={lease.id} dueCents={lease.rentCents + lease.chargesCents} tenantEmail={f.email} /> : null}
      <UploadModal open={upload} onClose={() => setUpload(false)} onSaved={reload} tenantId={t.id} />
    </>
  )
}
