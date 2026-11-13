import { useEffect, useState, type ReactNode } from 'react'
import { Cite } from '../../components/Sources'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { TenantDossier } from '../../components/TenantDossier'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { PaymentModal } from '../../components/PaymentModal'
import { UploadModal } from '../../components/UploadModal'
import { Avatar, Btn, Callout, Card, Crumbs, Line, LoadError, Loader, Pill, Tabs, TextLink, useLoad, useToast } from '../../components/kit'
import { display } from '../../components/ui'
import { Book, Check, Circle, DocIcon, Euro, Home, Mail, Page, People, Signpost, Upload } from '../../components/Icons'
import { RentAutomations } from '../../components/RentAutomations'
import { api } from '../../lib/api'
import { KIND_LABEL, TENANT_DOCUMENTS, fullName, type TenantDocKey } from '../../lib/contract'
import { documentPath, openDoc } from '../../lib/docs'
import { dateFr, dateNum, dateShort, euros, eurosCents, periodLabel } from '../../lib/format'
import type { LeaseView, TenantView } from '../../lib/space'

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
  // Une partie à la fois, gardée dans l'adresse (?onglet=).
  const [params, setParams] = useSearchParams()
  const { hash } = useLocation()
  const asked = params.get('onglet')
  const tab: TenantTab = TENANT_TABS.some((x) => x.value === asked) ? (asked as TenantTab) : 'general'
  const pickTab = (v: TenantTab) => setParams(v === 'general' ? {} : { onglet: v }, { replace: true })
  // Un lien d'« Actions » peut viser un bloc de « Général » (#dossier).
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash, tab])
  const f = t.file
  const lease = t.lease
  // Le bail en détail (documents, réglages), seulement s'il y a un bail.
  const detail = useLoad(() => (t.lease ? api<LeaseView>(`/leases/${t.lease.id}`) : Promise.resolve(null)), [t.lease?.id, t.payments.length])
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
            <h1 style={display('clamp(26px, 3.2vw, 34px)', { overflowWrap: 'anywhere' })}>{t.name || 'Locataire'}</h1>
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

      <Tabs label="Parties de la fiche du locataire" tabs={TENANT_TABS} value={tab} onChange={pickTab} />
      {tab === 'general' ? (
      <div className="split-aside panel-in" style={{ gap: 28 }}>
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
          <div id="dossier" style={{ scrollMarginTop: 90 }}>
            <TenantDossier tenantId={t.id} email={f.email} />
          </div>
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
            <Card title={<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 12 }}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Son bail</h2><Pill tone={lease.status === 'DRAFT' ? 'accent' : lease.status === 'ENDED' ? 'muted' : 'green'}>{lease.status === 'DRAFT' ? 'En préparation' : lease.status === 'ENDED' ? 'Terminé' : 'En cours'}</Pill></div>}>
              <Line label="Type" value={KIND_LABEL[lease.kind]} />
              <Line label="Période" value={`${dateNum(lease.startDate)} au ${dateNum(lease.endDate)}`} />
              <Line label="Loyer" value={`${euros(lease.rentCents)} + ${euros(lease.chargesCents)} de charges`} />
              {lease.kind !== 'MOBILITE' ? <Line label="Dépôt de garantie" value={euros(lease.depositCents)} /> : null}
              <div className="col-md" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
                <Btn size="sm" variant="outline" to={`/espace/baux/${lease.id}`}>
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
                <Btn size="sm" variant="outline" to={`/espace/baux/nouveau?locataire=${t.id}${t.propertyId ? `&logement=${t.propertyId}` : ''}`}>
                  Créer son bail
                </Btn>
              </div>
            </Card>
          )}
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
      ) : null}
      {tab === 'paiements' ? <PaymentsTab t={t} onPay={() => setPayOpen(true)} /> : null}
      {tab === 'documents' ? (
        <div className="panel-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
          <LeaseDocs lease={detail.data} loading={detail.loading} hasLease={Boolean(lease)} />
        </div>
      ) : null}
      {tab === 'actions' ? <ActionsTab t={t} detail={detail.data} reload={() => { reload(); detail.reload() }} /> : null}
      {lease ? <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} onSaved={() => { reload(); detail.reload() }} leaseId={lease.id} dueCents={lease.rentCents + lease.chargesCents} tenantEmail={f.email} /> : null}
      <UploadModal open={upload} onClose={() => setUpload(false)} onSaved={reload} tenantId={t.id} />
    </>
  )
}

type TenantTab = 'general' | 'paiements' | 'documents' | 'actions'
const TENANT_TABS: Array<{ value: TenantTab; label: string }> = [
  { value: 'general', label: 'Général' },
  { value: 'paiements', label: 'Paiements' },
  { value: 'documents', label: 'Documents' },
  { value: 'actions', label: 'Actions' },
]

const MONTH_STATE = {
  PAID: { label: 'Reçu', tone: 'green' },
  PARTIAL: { label: 'Partiel', tone: 'accent' },
  LATE: { label: 'En retard', tone: 'error' },
  UPCOMING: { label: 'À venir', tone: 'muted' },
  FIRST: { label: 'Au prorata', tone: 'muted' },
} as const

/** Loyers du bail en cours, mois par mois. Les retards et la dette viennent de `rentStatus` (serveur), comme partout. */
function PaymentsTab({ t, onPay }: { t: TenantView; onPay: () => void }) {
  const toast = useToast()
  const [all, setAll] = useState(false)
  const lease = t.lease
  if (!lease || lease.status === 'DRAFT') {
    return (
      <Card title="Loyers" style={{ marginTop: 8 }}>
        <span style={{ fontSize: 15, color: BAI.inkMid }}>{lease ? 'Le bail n’est pas encore signé : les loyers apparaîtront ici dès sa signature.' : 'Pas de bail signé : les loyers apparaîtront ici dès sa signature.'}</span>
        {lease ? (
          <div>
            <Btn size="sm" variant="outline" to={`/espace/baux/${lease.id}`}>
              Voir le bail
            </Btn>
          </div>
        ) : null}
      </Card>
    )
  }
  const debt = t.rent?.unpaidCents ?? 0
  const rows = all ? t.schedule : t.schedule.slice(0, 6)
  return (
    <div className="panel-in" style={{ marginTop: 8 }}>
      <Card
        title="Loyers"
        action={
          <span style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {lease.status !== 'ENDED' ? (
              <TextLink onClick={onPay} style={{ fontSize: 14 }}>
                Noter un paiement
              </TextLink>
            ) : null}
            <TextLink to={`/espace/baux/${lease.id}#paiements`} style={{ fontSize: 14 }}>
              Page du bail
            </TextLink>
          </span>
        }
      >
        {debt > 0 ? <Line label="Total dû" value={`${euros(debt)} (${t.rent?.label ?? ''})`} tone="error" /> : <Line label="Situation" value={t.rent?.label === 'Payé' ? 'À jour' : t.rent?.label ?? 'À jour'} tone="green" />}
        {rows.map((m) => (
          <div key={m.period} className="col-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 15, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
            <span style={{ fontWeight: 600, minWidth: 130 }}>{periodLabel(m.period, true)}</span>
            <span style={{ color: BAI.inkMid, flex: 1 }}>
              {m.state === 'PAID' ? `${eurosCents(m.paidCents)} reçus${m.receivedAt ? ` le ${dateShort(m.receivedAt)}` : ''}` : m.state === 'PARTIAL' ? `${eurosCents(m.paidCents)} reçus sur ${eurosCents(m.dueCents)}` : `${eurosCents(m.dueCents)} attendus`}
            </span>
            <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <Pill tone={MONTH_STATE[m.state].tone}>{MONTH_STATE[m.state].label}</Pill>
              {m.paidCents > 0 ? (
                <TextLink onClick={() => openDoc(`/leases/${lease.id}/receipts/${m.period}.pdf`).catch(toast.error)} style={{ fontSize: 14 }}>
                  {m.state === 'PAID' ? 'Quittance' : 'Reçu'}
                </TextLink>
              ) : null}
            </span>
          </div>
        ))}
        {t.schedule.length > 6 ? (
          <TextLink onClick={() => setAll(!all)} style={{ fontSize: 14 }}>
            {all ? 'Voir moins' : `Voir les ${t.schedule.length} mois`}
          </TextLink>
        ) : null}
      </Card>
    </div>
  )
}

/** Documents du bail (quittances, courriers, états des lieux, attestations) : la liste de la page du bail. */
function LeaseDocs({ lease, loading, hasLease }: { lease: LeaseView | null; loading: boolean; hasLease: boolean }) {
  const toast = useToast()
  const [all, setAll] = useState(false)
  if (!hasLease) {
    return (
      <Card title="Documents du bail">
        <span style={{ fontSize: 15, color: BAI.inkMid }}>Pas encore de bail : ses documents apparaîtront ici.</span>
      </Card>
    )
  }
  if (loading || !lease) return null
  const docs = lease.documents
  return (
    <Card title="Documents du bail" action={<TextLink to="/espace/documents" style={{ fontSize: 14 }}>Tous les documents</TextLink>}>
      {docs.length ? (
        <>
          {(all ? docs : docs.slice(0, 5)).map((d) => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
              <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{d.title}</span>
              <span style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                <span className="hide-sm" style={{ fontSize: 13, color: BAI.inkSoft }}>
                  {dateNum(d.createdAt)}
                </span>
                <TextLink style={{ fontSize: 14 }} onClick={() => openDoc(documentPath(d.id)).catch(toast.error)}>
                  Ouvrir
                </TextLink>
              </span>
            </div>
          ))}
          {docs.length > 5 ? (
            <TextLink onClick={() => setAll(!all)} style={{ fontSize: 14 }}>
              {all ? 'Voir moins' : `Voir les ${docs.length} documents`}
            </TextLink>
          ) : null}
        </>
      ) : (
        <span style={{ fontSize: 15, color: BAI.inkMid }}>Aucun document pour l’instant.</span>
      )}
    </Card>
  )
}

interface ActionDef {
  key: string
  icon: ReactNode
  title: string
  text: string
  to: string
  /** Raison de l'impossibilité : la carte reste visible, désactivée. */
  why?: string
}

/** Grille d'actions : chaque carte mène à un écran existant pour ce locataire et son bail. */
function ActionsTab({ t, detail, reload }: { t: TenantView; detail: LeaseView | null; reload: () => void }) {
  const lease = t.lease
  const signed = Boolean(lease && lease.status !== 'DRAFT')
  const running = Boolean(lease && (lease.status === 'ACTIVE' || lease.status === 'IMPORTED'))
  const lid = lease?.id ?? ''
  const noSigned = lease ? 'Disponible une fois le bail signé.' : 'Pas de bail : créez-le d’abord.'
  const g = t.file.guarantor
  const icon = (n: ReactNode) => <span aria-hidden="true" style={{ display: 'inline-flex' }}>{n}</span>
  const actions: ActionDef[] = [
    { key: 'quittance', icon: icon(<DocIcon size={22} />), title: 'Quittance', text: 'Éditer ou envoyer une quittance de loyer.', to: `/espace/baux/${lid}/courriers?type=RECEIPT`, why: signed ? undefined : noSigned },
    { key: 'revision', icon: icon(<Euro size={22} color={BAI.owner} />), title: 'Révision du loyer', text: 'Appliquer l’IRL à la date anniversaire.', to: `/espace/baux/${lid}/courriers?type=REVISION`, why: !running ? (lease?.status === 'ENDED' ? 'Le bail est terminé.' : noSigned) : undefined },
    { key: 'charges', icon: icon(<Book size={22} color={BAI.owner} />), title: 'Régularisation des charges', text: 'Comparer les provisions aux charges réelles.', to: `/espace/baux/${lid}/courriers?type=CHARGES`, why: !signed ? noSigned : lease?.chargesMode === 'FORFAIT' ? 'Charges au forfait : pas de régularisation.' : undefined },
    { key: 'edl', icon: icon(<Home size={22} color={BAI.owner} />), title: 'État des lieux', text: 'Entrée ou sortie, avec photos et signatures.', to: `/espace/baux/${lid}/etat-des-lieux`, why: signed ? undefined : noSigned },
    { key: 'caution', icon: icon(<People size={22} color={BAI.owner} />), title: 'Acte de caution', text: 'Faire signer l’engagement du garant.', to: `/espace/locataires/${t.id}/caution`, why: t.file.guarantee === 'CAUTION' && g ? (lease ? undefined : 'Créez d’abord le bail.') : 'Aucun garant en caution sur sa fiche.' },
    { key: 'depart', icon: icon(<Signpost size={22} color={BAI.owner} />), title: 'Congé ou départ', text: 'Les étapes pas à pas, de l’annonce au solde.', to: `/espace/baux/${lid}/parcours/DEPARTURE`, why: signed ? undefined : noSigned },
    { key: 'courrier', icon: icon(<Mail size={22} color={BAI.owner} />), title: 'Courrier', text: 'Relance, attestation, avis… tous les courriers.', to: `/espace/baux/${lid}/courriers`, why: signed ? undefined : noSigned },
    { key: 'pieces', icon: icon(<Upload size={22} color={BAI.owner} />), title: 'Demander des pièces', text: 'Ce qui manque à son dossier, par email ou courrier.', to: `/espace/locataires/${t.id}#dossier` },
    { key: 'lien', icon: icon(<Page size={22} color={BAI.owner} />), title: 'Lien du locataire', text: 'Assurance, chaudière, signalement, sans compte.', to: `/espace/baux/${lid}?onglet=locataire#locataire`, why: running ? undefined : lease?.status === 'ENDED' ? 'Le bail est terminé.' : noSigned },
  ]
  return (
    <div className="panel-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 8 }}>
      <ul aria-label="Actions" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 16 }}>
        {actions.map((a) => {
          const body = (
            <>
              <span style={{ width: 44, height: 44, borderRadius: 999, background: a.why ? BAI.dividerSoft : BAI.sky, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{a.icon}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: a.why ? BAI.inkMid : BAI.ink }}>{a.title}</span>
                <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.4 }}>{a.why ?? a.text}</span>
              </span>
            </>
          )
          const box = { display: 'flex', gap: 14, alignItems: 'flex-start', padding: 18, borderRadius: BAI.radius, height: '100%', boxSizing: 'border-box' as const, textDecoration: 'none', color: BAI.ink }
          return (
            <li key={a.key}>
              {a.why ? (
                <div aria-disabled="true" style={{ ...box, background: BAI.bg, border: `1.5px dashed ${BAI.dashed}`, cursor: 'not-allowed' }}>
                  {body}
                </div>
              ) : (
                <Link to={a.to} className="tap" style={{ ...box, background: BAI.surface, border: `1px solid ${BAI.divider}` }}>
                  {body}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
      <Card title="Automatismes" action={lease ? <TextLink to={`/espace/baux/${lease.id}#paiements`} style={{ fontSize: 14 }}>Page du bail</TextLink> : null}>
        {running && detail ? <RentAutomations l={detail} reload={reload} /> : <span style={{ fontSize: 15, color: BAI.inkMid }}>{lease?.status === 'ENDED' ? 'Le bail est terminé.' : 'Quittance automatique et relances : disponibles une fois le bail signé.'}</span>}
      </Card>
    </div>
  )
}
