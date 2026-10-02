import { useNavigate, useParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { display } from '../../components/ui'
import { Btn, Callout, Card, Crumbs, LoadError, Loader, Pill, TextLink, useLoad, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { dateNum, eurosCents } from '../../lib/format'

interface CandidateRow {
  id: string
  status: 'NEW' | 'SHORTLIST' | 'REJECTED'
  receivedAt: string
  name: string
  email: string
  phone: string | null
  situation: string
  guarantee: string
  guarantorName: string | null
  monthlyIncomeCents: number
  occupants: number | null
  moveInDate: string | null
  dossierFacileUrl: string | null
  message: string | null
  rentShare: number | null
}
interface CandidatesView {
  applyCode: string | null
  offer: { title: string; rentWithChargesCents: number | null }
  forbiddenDocuments: string[]
  keepDays: number
  candidates: CandidateRow[]
}

const ORDER = { SHORTLIST: 0, NEW: 1, REJECTED: 2 }

/**
 * Candidats d'un logement : lien de candidature à partager, candidatures reçues, et « Choisir » qui crée
 * la fiche du locataire déjà remplie puis ouvre la création du bail.
 */
export default function Candidats() {
  const { id = '' } = useParams()
  const toast = useToast()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useLoad(() => api<CandidatesView>(`/properties/${id}/candidates`), [id])
  const link = data?.applyCode ? `${window.location.origin}/candidature/${data.applyCode}` : null

  const act = async (fn: () => Promise<unknown>, done?: string) => {
    try {
      await fn()
      if (done) toast.show(done)
      reload()
    } catch (e) {
      toast.error(e)
    }
  }
  const toggleLink = (open: boolean) => act(() => api(`/properties/${id}/apply-link`, { method: 'POST', body: { open } }), open ? 'Lien de candidature prêt.' : 'Lien fermé : plus personne ne peut candidater.')
  const copy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      toast.show('Lien copié. Ajoutez-le à votre annonce.')
    } catch {
      toast.show(link)
    }
  }
  const choose = async (c: CandidateRow) => {
    if (!window.confirm(`Choisir ${c.name} ? Sa fiche de locataire est créée avec ses informations, puis vous passez au bail.`)) return
    try {
      const r = await api<{ tenantId: string; propertyId: string }>(`/candidates/${c.id}/choose`, { method: 'POST' })
      navigate(`/espace/baux/nouveau?logement=${r.propertyId}&locataire=${r.tenantId}`)
    } catch (e) {
      toast.error(e)
    }
  }

  return (
    <AppShell>
      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : (
        <>
          <Crumbs items={[{ label: 'Logements', to: '/espace/logements' }, { label: 'Le logement', to: `/espace/logements/${id}` }, { label: 'Candidats' }]} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 style={display('clamp(34px, 5vw, 48px)')}>Candidats</h1>
            <span style={{ fontSize: 16, color: BAI.inkMid }}>{data.offer.title}</span>
          </div>
          <div className="split-aside" style={{ gap: 24 }}>
            <div className="grow">
              {data.candidates.length ? (
                [...data.candidates]
                  .sort((a, b) => ORDER[a.status] - ORDER[b.status])
                  .map((c) => (
                    <Card key={c.id} style={{ opacity: c.status === 'REJECTED' ? 0.6 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>{c.name}</span>
                        {c.status === 'SHORTLIST' ? <Pill tone="green">Retenu</Pill> : c.status === 'REJECTED' ? <Pill tone="muted">Écarté</Pill> : <Pill tone="owner">Reçue le {dateNum(c.receivedAt)}</Pill>}
                      </div>
                      <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.55 }}>
                        {c.situation} · revenus {eurosCents(c.monthlyIncomeCents)} par mois{c.occupants ? ` · ${c.occupants} personne${c.occupants > 1 ? 's' : ''}` : ''}
                        <br />
                        {c.guarantee}
                        {c.guarantorName ? ` : ${c.guarantorName}` : ''}
                        {c.moveInDate ? ` · entrée souhaitée le ${dateNum(c.moveInDate)}` : ''}
                      </span>
                      {c.rentShare !== null ? (
                        <span style={{ fontSize: 14, color: c.rentShare > 33 ? BAI.caramelInk : BAI.inkSoft }}>
                          Le loyer représente {c.rentShare} % de ses revenus{c.rentShare > 33 ? ' : au-delà d’un tiers, une garantie est d’autant plus utile.' : '.'}
                        </span>
                      ) : null}
                      {c.message ? <span style={{ fontSize: 14, color: BAI.inkMid, fontStyle: 'italic', lineHeight: 1.5 }}>« {c.message} »</span> : null}
                      <span style={{ fontSize: 14, color: BAI.inkSoft }}>
                        {c.email}
                        {c.phone ? ` · ${c.phone}` : ''}
                      </span>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        {c.dossierFacileUrl ? (
                          <a href={c.dossierFacileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, color: BAI.owner }}>
                            Voir son DossierFacile
                          </a>
                        ) : (
                          <span style={{ fontSize: 14, color: BAI.inkSoft }}>Pas de DossierFacile</span>
                        )}
                      </div>
                      <div className="col-md" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Btn size="sm" onClick={() => void choose(c)}>
                          Choisir ce candidat
                        </Btn>
                        {c.status !== 'SHORTLIST' ? (
                          <Btn size="sm" variant="outline" onClick={() => void act(() => api(`/candidates/${c.id}`, { method: 'PATCH', body: { status: 'SHORTLIST' } }))}>
                            Retenir
                          </Btn>
                        ) : null}
                        {c.status !== 'REJECTED' ? (
                          <Btn size="sm" variant="ghost" onClick={() => void act(() => api(`/candidates/${c.id}`, { method: 'PATCH', body: { status: 'REJECTED' } }))}>
                            Écarter
                          </Btn>
                        ) : (
                          <Btn size="sm" variant="ghost" onClick={() => void act(() => api(`/candidates/${c.id}`, { method: 'DELETE' }), 'Candidature effacée.')}>
                            Effacer
                          </Btn>
                        )}
                      </div>
                    </Card>
                  ))
              ) : (
                <Card>
                  <span style={{ fontSize: 17, fontWeight: 600 }}>Aucune candidature pour l’instant.</span>
                  <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Partagez le lien de candidature dans votre annonce : les candidatures arrivent ici, et vous êtes prévenu par email.</span>
                </Card>
              )}
            </div>
            <aside className="aside">
              <Card title="Lien de candidature">
                {link ? (
                  <>
                    <span style={{ fontSize: 14, color: BAI.inkMid, wordBreak: 'break-all' }}>{link}</span>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <Btn size="sm" onClick={() => void copy()}>
                        Copier le lien
                      </Btn>
                      <Btn size="sm" variant="ghost" onClick={() => void toggleLink(false)}>
                        Fermer le lien
                      </Btn>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Un formulaire simple, sans compte : identité, situation, revenus, garantie et lien DossierFacile. Aucune pièce jointe ne circule.</span>
                    <div>
                      <Btn size="sm" onClick={() => void toggleLink(true)}>
                        Créer le lien
                      </Btn>
                    </div>
                  </>
                )}
                <TextLink to={`/espace/logements/${id}/annonce`} style={{ fontSize: 14 }}>
                  Rédiger l’annonce
                </TextLink>
              </Card>
              <Card title="Ce que vous ne pouvez pas demander">
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: BAI.inkMid, lineHeight: 1.55 }}>
                  {data.forbiddenDocuments.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>Loi du 6 juillet 1989, article 22-2. Le choix ne peut reposer sur aucun critère discriminatoire.</span>
              </Card>
              <Callout tone="tip">Les candidatures sont effacées automatiquement {Math.round(data.keepDays / 30)} mois après leur réception. Celle que vous choisissez devient la fiche du locataire.</Callout>
            </aside>
          </div>
        </>
      )}
    </AppShell>
  )
}
