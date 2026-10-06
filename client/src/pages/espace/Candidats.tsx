import { useNavigate, useParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { display } from '../../components/ui'
import { Btn, Callout, Card, Check, Crumbs, LoadError, Loader, Pill, TextArea, TextLink, useLoad, useToast } from '../../components/kit'
import { openDoc } from '../../lib/docs'
import { TENANT_DOCUMENTS, type TenantDocKey } from '../../lib/contract'
import type { ProfileView, PropertyView } from '../../lib/space'
import { useEffect, useState } from 'react'
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
  /** Aide au tri : ressources, garantie, dossier, date d'entrée (server/src/domain/candidates.ts). */
  review: { level: 'SOLID' | 'CORRECT' | 'INCOMPLETE'; label: string; points: number; criteria: Array<{ key: string; mark: 'GOOD' | 'MEDIUM' | 'WEAK'; text: string }> }
  documents: Array<{ category: string; who: 'TENANT' | 'GUARANTOR'; fileId: string; label: string }>
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
  const { data: property, reload: reloadProperty } = useLoad(() => api<PropertyView>(`/properties/${id}`), [id])
  const { data: profile } = useLoad(() => api<ProfileView>('/profile'))
  const ad = property?.file.ad ?? {}
  const requested = (ad.requestedDocs?.length ? ad.requestedDocs : (Object.keys(TENANT_DOCUMENTS) as TenantDocKey[])) as TenantDocKey[]
  const guarantorDocs = ad.guarantorDocs !== false
  const firstName = profile?.profile.firstNames ?? ''
  const saveDocs = async (docs: TenantDocKey[], guarantor: boolean) => {
    if (!docs.length) return toast.show('Gardez au moins une pièce.', 'error')
    try {
      await api(`/properties/${id}`, { method: 'PUT', body: { ad: { ...ad, requestedDocs: docs, guarantorDocs: guarantor } } })
      reloadProperty()
    } catch (e) {
      toast.error(e)
    }
  }

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
              {link ? <ReplyMessage link={link} title={data.offer.title} docs={requested} landlord={firstName} /> : null}
              {data.candidates.length > 1 ? (
                <Callout tone="info" title="Les dossiers les plus complets d’abord">
                  Bailio les classe seulement sur les ressources, la garantie, les pièces déposées et la date d’entrée. C’est une aide : vous décidez. Refuser un candidat pour son âge, sa famille, son origine, sa santé ou un autre critère interdit est puni par la loi.
                </Callout>
              ) : null}
              {data.candidates.length ? (
                [...data.candidates]
                  .sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.review.points - a.review.points)
                  .map((c, i) => (
                    <Card key={c.id} style={c.status === 'REJECTED' ? { background: BAI.bg } : undefined}>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ alignSelf: 'flex-start' }}>
                          <Pill tone={c.review.level === 'SOLID' ? 'green' : c.review.level === 'CORRECT' ? 'owner' : 'caramel'}>{c.review.label}</Pill>
                        </span>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.55, color: BAI.inkMid }}>
                          {c.review.criteria.map((x) => (
                            <li key={x.key} style={{ color: x.mark === 'WEAK' ? BAI.caramelInk : undefined }}>
                              {x.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {c.message ? <span style={{ fontSize: 14, color: BAI.inkMid, fontStyle: 'italic', lineHeight: 1.5 }}>« {c.message} »</span> : null}
                      <span style={{ fontSize: 14, color: BAI.inkSoft }}>
                        {c.email}
                        {c.phone ? ` · ${c.phone}` : ''}
                      </span>
                      {c.documents.length ? (
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {c.documents.map((d) => (
                            <TextLink key={`${d.who}-${d.category}`} onClick={() => void openDoc(`/files/${d.fileId}`).catch(toast.error)} style={{ fontSize: 14 }}>
                              {d.label}
                            </TextLink>
                          ))}
                        </div>
                      ) : null}
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
                        <Btn size="sm" variant={i === 0 ? 'primary' : 'outline'} onClick={() => void choose(c)}>
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
              <Card title="Pièces demandées aux candidats">
                <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Seulement parmi celles que la loi autorise. Enregistré dans la fiche du logement.</span>
                {(Object.keys(TENANT_DOCUMENTS) as TenantDocKey[]).map((k) => (
                  <Check key={k} checked={requested.includes(k)} onChange={(v) => void saveDocs(v ? [...requested, k] : requested.filter((x) => x !== k), guarantorDocs)} label={TENANT_DOCUMENTS[k]} />
                ))}
                <Check checked={guarantorDocs} onChange={(v) => void saveDocs(requested, v)} label="Les mêmes pièces pour le garant" />
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

/**
 * Message à copier pour répondre aux personnes intéressées sur Leboncoin, SeLoger, PAP… : un mot aimable et le lien
 * pour déposer son dossier, avec les pièces demandées. Modifiable avant de le copier.
 */
function ReplyMessage({ link, title, docs, landlord }: { link: string; title: string; docs: TenantDocKey[]; landlord: string }) {
  const toast = useToast()
  const build = () =>
    [
      'Bonjour,',
      '',
      `Merci pour votre intérêt pour ${title.charAt(0).toLowerCase()}${title.slice(1)}.`,
      'Pour étudier votre candidature, je vous invite à compléter votre dossier en ligne. Cela prend quelques minutes et ne demande aucun compte :',
      link,
      '',
      `Vous pourrez y déposer : ${docs.map((d) => TENANT_DOCUMENTS[d].toLowerCase()).join(', ')}. Si vous avez un garant, les mêmes pièces le concernant.`,
      'Vos documents ne seront visibles que par moi. Ils sont effacés au plus tard trois mois après votre candidature si elle n’est pas retenue.',
      '',
      'Je reviens vers vous rapidement.',
      'Bien cordialement,',
      landlord,
    ]
      .join('\n')
      .trim()
  const [text, setText] = useState(build)
  // Le message suit les pièces choisies tant qu'il n'a pas été modifié à la main.
  const [edited, setEdited] = useState(false)
  useEffect(() => {
    if (!edited) setText(build())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs.join(','), landlord, link])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast.show('Message copié. Collez-le dans votre réponse.')
    } catch {
      window.prompt('Copiez le message :', text)
    }
  }
  return (
    <Card title="Répondre aux personnes intéressées">
      <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Sur Leboncoin, SeLoger, PAP ou ailleurs : copiez ce message et collez-le en réponse. Le candidat dépose son dossier ici, tout seul.</span>
      <TextArea
        label="Message"
        value={text}
        onChange={(v) => {
          setText(v)
          setEdited(true)
        }}
        rows={12}
      />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Btn onClick={() => void copy()}>Copier le message</Btn>
        {edited ? (
          <Btn
            variant="ghost"
            onClick={() => {
              setEdited(false)
              setText(build())
            }}
          >
            Revenir au message proposé
          </Btn>
        ) : null}
      </div>
    </Card>
  )
}
