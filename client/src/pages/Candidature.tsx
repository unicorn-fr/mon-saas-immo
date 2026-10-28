import { ThirdPartyNotice } from '../components/DataNotice'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Logo } from '../components/Logo'
import { Fields } from '../components/FlowLayout'
import { Btn, Callout, Card, Check, Chips, Input, LoadError, Loader, Money, TextArea, useLoad, useToast, AddressInput } from '../components/kit'
import { display } from '../components/ui'
import { api } from '../lib/api'
import { PublicPhoto } from '../components/media'
import { DocFilesRow } from '../components/DocFiles'
import { SafetyNote } from './SuiviCandidature'
import { Choices, QuestionScreen, useQuestion } from '../components/Questions'

interface Offer {
  title: string
  text: string
  rentWithChargesCents: number | null
  allowedDocuments: Array<{ title: string; items: string[] }>
  requestedDocs: Array<{ key: string; label: string; suggested?: number | null }>
  guarantorDocs: boolean
  city?: string | null
  hasPhoto?: boolean
}

type Situation = 'EMPLOYEE' | 'SELF_EMPLOYED' | 'STUDENT' | 'APPRENTICE' | 'RETIRED' | 'OTHER'
type Guarantee = 'CAUTION' | 'VISALE' | 'GLI' | 'NONE'

/**
 * Candidature à un logement, depuis le lien partagé par le propriétaire. Sans compte et sans pièce jointe :
 * les justificatifs restent dans DossierFacile, le dossier de location de l'État.
 */
export default function Candidature() {
  const { code = '' } = useParams()
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api<Offer>(`/candidature/${encodeURIComponent(code)}`), [code])
  const [f, setF] = useState({
    civility: null as 'MADAME' | 'MONSIEUR' | null,
    firstNames: '',
    lastName: '',
    email: '',
    phone: '',
    currentAddress: '',
    situation: null as Situation | null,
    monthlyIncomeCents: null as number | null,
    occupants: 1 as number | null,
    guarantee: null as Guarantee | null,
    guarantor: { firstNames: '', lastName: '', email: '' },
    moveInDate: '',
    dossierFacileUrl: '',
    message: '',
    consent: false,
    website: '',
  })
  const [sent, setSent] = useState(false)
  // L'annonce d'abord, puis les questions une à une.
  const [started, setStarted] = useState(false)
  // « Postuler » commence toujours à la première question, même après un rechargement de la page (?q= dans l'adresse).
  const [, setParams] = useSearchParams()
  const start = () => {
    setParams({}, { replace: true })
    setStarted(true)
  }
  // Après l'envoi : dépôt des pièces demandées, avec le jeton remis par le serveur.
  const [upload, setUpload] = useState<{ candidateId: string; uploadToken: string } | null>(null)
  // Lien de suivi (aussi envoyé par email) : confirmer la visite, retirer la candidature.
  const [follow, setFollow] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (patch: Partial<typeof f>) => setF({ ...f, ...patch })

  const send = async () => {
    if (!f.firstNames.trim() || !f.lastName.trim() || !f.email.trim()) return toast.show('Indiquez vos nom, prénom et email.', 'error')
    if (!f.situation || !f.guarantee || f.monthlyIncomeCents === null) return toast.show('Indiquez votre situation, vos revenus et votre garantie.', 'error')
    if (!f.consent) return toast.show('Cochez la case pour envoyer votre candidature.', 'error')
    setBusy(true)
    try {
      const r = await api<{ candidateId?: string; uploadToken?: string; followToken?: string }>(`/candidature/${encodeURIComponent(code)}`, {
        method: 'POST',
        body: { ...f, guarantor: f.guarantee === 'CAUTION' ? f.guarantor : null, moveInDate: f.moveInDate || null, dossierFacileUrl: f.dossierFacileUrl.trim() || null },
      })
      if (r.followToken) setFollow(r.followToken)
      if (r.candidateId && r.uploadToken && data?.requestedDocs.length) setUpload({ candidateId: r.candidateId, uploadToken: r.uploadToken })
      else setSent(true)
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink }}>
      <header style={{ padding: '20px clamp(16px, 4vw, 40px)', borderBottom: `1px solid ${BAI.divider}`, background: BAI.surface }}>
        <Logo />
      </header>
      <main style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) 16px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading && !data ? (
          <Loader />
        ) : error || !data ? (
          <LoadError message={error ?? 'Ce lien de candidature n’est plus actif.'} retry={reload} />
        ) : upload && !sent ? (
          <UploadDocs code={code} upload={upload} docs={data.requestedDocs} guarantor={f.guarantee === 'CAUTION' && data.guarantorDocs} onDone={() => setSent(true)} />
        ) : sent ? (
          <Card>
            <h1 style={display('clamp(32px, 5vw, 44px)')}>Candidature envoyée.</h1>
            <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>Le propriétaire a bien reçu votre candidature. S’il la retient, il vous contactera directement par email ou par téléphone.</span>
            <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>
              Vos pièces restent cachées au propriétaire jusqu’à ce que vous confirmiez avoir visité le logement. Le lien pour le faire vous a été envoyé par email.
            </span>
            {follow ? (
              <div>
                <Link to={`/suivi-candidature/${follow}`} style={{ fontSize: 15, fontWeight: 600, color: BAI.owner }}>
                  Suivre ma candidature
                </Link>
              </div>
            ) : null}
          </Card>
        ) : !started ? (
          <>
            {data.hasPhoto ? <PublicPhoto src={`/api/candidature/${encodeURIComponent(code)}/photo`} alt={`Photo du logement : ${data.title}`} /> : null}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, color: BAI.inkSoft }}>Candidature</span>
              <h1 style={display('clamp(32px, 5vw, 46px)')}>{data.title}</h1>
            </div>
            <Card title="L’annonce">
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.6, color: BAI.inkMid }}>{data.text}</div>
            </Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Btn onClick={start}>Postuler</Btn>
              <span style={{ fontSize: 14, color: BAI.inkSoft }}>Quelques questions courtes, une à la fois. Sans compte.</span>
            </div>
            <SafetyNote />
          </>
        ) : (
          <CandidateQuestions
            offer={data}
            f={f}
            set={set}
            busy={busy}
            onSend={() => void send()}
            onExit={() => setStarted(false)}
          />
        )}
      </main>
    </div>
  )
}

type Form = {
  civility: 'MADAME' | 'MONSIEUR' | null
  firstNames: string
  lastName: string
  email: string
  phone: string
  currentAddress: string
  situation: Situation | null
  monthlyIncomeCents: number | null
  occupants: number | null
  guarantee: Guarantee | null
  guarantor: { firstNames: string; lastName: string; email: string }
  moveInDate: string
  dossierFacileUrl: string
  message: string
  consent: boolean
  website: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Les questions de la candidature, une par écran. Un choix passe tout seul à la suivante. */
function CandidateQuestions({ offer, f, set, busy, onSend, onExit }: { offer: Offer; f: Form; set: (p: Partial<Form>) => void; busy: boolean; onSend: () => void; onExit: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const ids = ['name', 'email', 'phone', 'situation', 'income', 'occupants', 'guarantee', ...(f.guarantee === 'CAUTION' ? ['guarantor'] : []), 'moveIn', 'address', 'dossierFacile', 'send'] as const
  const { q, go } = useQuestion(ids.length)
  const id = ids[q - 1]
  const count = ids.length
  const forward = () => {
    setError(null)
    go(q + 1)
  }
  const back = () => {
    setError(null)
    if (q === 1) onExit()
    else go(q - 1)
  }
  const check = (msg: string | null) => {
    if (msg) setError(msg)
    else forward()
  }
  const base = { q, count, onBack: back, page: true }
  switch (id) {
    case 'name':
      return (
        <QuestionScreen {...base} title="Comment vous appelez-vous ?" onNext={() => check(!f.firstNames.trim() || !f.lastName.trim() ? 'Indiquez votre prénom et votre nom.' : null)}>
          <Chips legend="Civilité" value={f.civility} onChange={(v) => set({ civility: v })} options={[{ value: 'MADAME', label: 'Madame' }, { value: 'MONSIEUR', label: 'Monsieur' }]} />
          <Fields>
            <Input label="Prénom" value={f.firstNames} onChange={(v) => set({ firstNames: v })} autoComplete="given-name" error={error && !f.firstNames.trim() ? error : undefined} />
            <Input label="Nom" value={f.lastName} onChange={(v) => set({ lastName: v })} autoComplete="family-name" error={error && f.firstNames.trim() && !f.lastName.trim() ? error : undefined} />
          </Fields>
        </QuestionScreen>
      )
    case 'email':
      return (
        <QuestionScreen {...base} title="Votre email ?" hint="Le propriétaire vous répond à cette adresse." onNext={() => check(EMAIL_RE.test(f.email.trim()) ? null : 'Indiquez un email valide.')}>
          <Input label="Email" type="email" value={f.email} onChange={(v) => set({ email: v })} autoComplete="email" inputMode="email" error={error ?? undefined} />
        </QuestionScreen>
      )
    case 'phone':
      return (
        <QuestionScreen {...base} title="Votre téléphone ?" hint="Facultatif : pour organiser la visite plus vite." onNext={forward} skip={forward}>
          <Input label="Téléphone" hint="Facultatif." value={f.phone} onChange={(v) => set({ phone: v })} autoComplete="tel" inputMode="tel" />
        </QuestionScreen>
      )
    case 'situation':
      return (
        <QuestionScreen {...base} title="Votre situation professionnelle ?" hideNext={!f.situation} onNext={forward}>
          <Choices
            legend="Situation professionnelle"
            value={f.situation}
            onPick={(v) => {
              set({ situation: v })
              forward()
            }}
            options={[
              { value: 'EMPLOYEE', label: 'Salarié' },
              { value: 'SELF_EMPLOYED', label: 'Indépendant' },
              { value: 'STUDENT', label: 'Étudiant' },
              { value: 'APPRENTICE', label: 'Apprenti ou alternant' },
              { value: 'RETIRED', label: 'Retraité' },
              { value: 'OTHER', label: 'Autre situation' },
            ]}
          />
        </QuestionScreen>
      )
    case 'income':
      return (
        <QuestionScreen {...base} title="Combien gagne votre foyer par mois ?" hint="Revenus nets, toutes ressources comprises (salaires, aides, pensions…)." onNext={() => check(f.monthlyIncomeCents === null ? 'Indiquez vos revenus, même approximatifs.' : null)}>
          <Money label="Revenus nets du foyer, par mois" cents={f.monthlyIncomeCents} onChange={(c) => set({ monthlyIncomeCents: c })} error={error ?? undefined} />
        </QuestionScreen>
      )
    case 'occupants':
      return (
        <QuestionScreen {...base} title="Combien de personnes vivront dans le logement ?" hideNext={!f.occupants} onNext={forward}>
          <Choices
            legend="Personnes qui vivront dans le logement"
            value={f.occupants}
            onPick={(v) => {
              set({ occupants: v })
              forward()
            }}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: n === 5 ? '5 ou plus' : String(n) }))}
          />
        </QuestionScreen>
      )
    case 'guarantee':
      return (
        <QuestionScreen {...base} title="Quelle garantie proposez-vous ?" hint={f.guarantee === 'VISALE' ? 'Visale est une garantie gratuite d’Action Logement, pour les moins de 31 ans et de nombreux salariés : visale.fr.' : undefined} hideNext={!f.guarantee} onNext={forward}>
          <Choices
            legend="Garantie"
            columns
            value={f.guarantee}
            onPick={(v) => {
              set({ guarantee: v })
              go(q + 1)
            }}
            options={[
              { value: 'CAUTION', label: 'Une personne se porte caution' },
              { value: 'VISALE', label: 'Garantie Visale' },
              { value: 'GLI', label: 'Assurance loyers impayés' },
              { value: 'NONE', label: 'Pas de garant' },
            ]}
          />
        </QuestionScreen>
      )
    case 'guarantor':
      return (
        <QuestionScreen {...base} title="Qui se porte caution ?" onNext={() => check(!f.guarantor.firstNames.trim() || !f.guarantor.lastName.trim() ? 'Indiquez le prénom et le nom de votre garant.' : null)}>
          <Fields>
            <Input label="Prénom du garant" value={f.guarantor.firstNames} onChange={(v) => set({ guarantor: { ...f.guarantor, firstNames: v } })} error={error && !f.guarantor.firstNames.trim() ? error : undefined} />
            <Input label="Nom du garant" value={f.guarantor.lastName} onChange={(v) => set({ guarantor: { ...f.guarantor, lastName: v } })} error={error && f.guarantor.firstNames.trim() && !f.guarantor.lastName.trim() ? error : undefined} />
          </Fields>
        </QuestionScreen>
      )
    case 'moveIn':
      return (
        <QuestionScreen {...base} title="Quand souhaitez-vous entrer ?" hint="Facultatif." onNext={forward} skip={forward}>
          <Input label="Date d’entrée souhaitée" hint="Facultatif." type="date" value={f.moveInDate} onChange={(v) => set({ moveInDate: v })} />
        </QuestionScreen>
      )
    case 'address':
      return (
        <QuestionScreen {...base} title="Où habitez-vous aujourd’hui ?" hint="Facultatif." onNext={forward} skip={forward}>
          <AddressInput label="Adresse actuelle" hint="Facultatif." value={f.currentAddress} onChange={(v) => set({ currentAddress: v })} />
        </QuestionScreen>
      )
    case 'dossierFacile':
      return (
        <QuestionScreen
          {...base}
          title="Avez-vous un DossierFacile ?"
          hint={
            <>
              Le dossier gratuit de l’État : vos pièces y sont vérifiées une fois pour toutes. Facultatif, mais il accélère beaucoup la réponse.{' '}
              <a href="https://www.dossierfacile.logement.gouv.fr/" target="_blank" rel="noreferrer" style={{ color: BAI.owner, fontWeight: 600 }}>
                Créer mon DossierFacile
              </a>
            </>
          }
          onNext={forward}
          skip={forward}
        >
          <Input label="Lien de votre DossierFacile" value={f.dossierFacileUrl} onChange={(v) => set({ dossierFacileUrl: v })} placeholder="https://locataire.dossierfacile.logement.gouv.fr/…" hint="Facultatif." />
          {offer.requestedDocs.length ? (
            <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Juste après l’envoi, vous pourrez aussi déposer les pièces demandées : {offer.requestedDocs.map((d) => d.label.toLowerCase()).join(', ')}.</span>
          ) : null}
        </QuestionScreen>
      )
    case 'send':
    default:
      return (
        <QuestionScreen
          {...base}
          title="Un mot pour le propriétaire ?"
          hint="Facultatif. Puis envoyez votre candidature."
          nextLabel="Envoyer ma candidature"
          busy={busy}
          onNext={() => (f.consent ? onSend() : setError('Cochez la case pour envoyer votre candidature.'))}
          footer={
            <>
              <ThirdPartyNotice purpose="étudier votre candidature à la location de ce logement (Bailio l’aide à trier les dossiers sur vos ressources, votre garantie, vos pièces et votre date d’entrée ; il décide lui-même)" keep="Si votre candidature n’est pas retenue, elles sont effacées, pièces comprises, au plus tard trois mois après leur envoi." />
              <Callout tone="tip">Le propriétaire ne peut pas vous demander de photo, de relevés bancaires, de carte Vitale ni de chèque de réservation. La loi interdit aussi toute discrimination.</Callout>
              <details style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.55 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: BAI.ink, padding: '10px 0' }}>Les seules pièces qu’un propriétaire peut vous demander</summary>
                {offer.allowedDocuments.map((g) => (
                  <div key={g.title} style={{ marginTop: 10 }}>
                    <strong>{g.title}</strong>
                    <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                      {g.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </details>
            </>
          }
        >
          <TextArea label="Message" value={f.message} onChange={(v) => set({ message: v })} rows={4} hint="Facultatif." />
          {/* Champ invisible : les robots le remplissent, pas les personnes. */}
          <input tabIndex={-1} autoComplete="off" aria-hidden value={f.website} onChange={(e) => set({ website: e.target.value })} style={{ position: 'absolute', left: -9999, width: 1, height: 1 }} />
          <Check checked={f.consent} onChange={(v) => { set({ consent: v }); if (v) setError(null) }} label="J’ai compris que ces informations sont transmises au propriétaire pour étudier ma candidature." />
          {error ? <span role="alert" style={{ fontSize: 14, color: BAI.error }}>{error}</span> : null}
        </QuestionScreen>
      )
  }
}

/** Dépôt des pièces demandées par le propriétaire, après l'envoi de la candidature. Plusieurs fichiers par pièce. */
function UploadDocs({ code, upload, docs, guarantor, onDone }: { code: string; upload: { candidateId: string; uploadToken: string }; docs: Array<{ key: string; label: string; suggested?: number | null }>; guarantor: boolean; onDone: () => void }) {
  const toast = useToast()
  const [files, setFiles] = useState<Array<{ category: string; who: 'TENANT' | 'GUARANTOR'; fileId: string; name: string }>>([])
  const base = `/candidature/${encodeURIComponent(code)}/document`
  type Sent = { documents: Array<{ category: string; who: 'TENANT' | 'GUARANTOR'; fileId: string; name: string }> }
  // Chaque fichier choisi s'ajoute aux précédents (trois bulletins de salaire : un par un ou tous ensemble).
  const add = async (category: string, who: 'TENANT' | 'GUARANTOR', list: File[]) => {
    for (const file of list) {
      const form = new FormData()
      form.append('file', file)
      form.append('candidateId', upload.candidateId)
      form.append('token', upload.uploadToken)
      form.append('category', category)
      form.append('who', who)
      try {
        setFiles((await api<Sent>(base, { method: 'POST', form, timeout: 90_000 })).documents)
      } catch (e) {
        toast.error(e)
        break
      }
    }
  }
  const remove = async (fileId: string) => {
    try {
      setFiles((await api<Sent>(`${base}/remove`, { method: 'POST', body: { candidateId: upload.candidateId, token: upload.uploadToken, fileId } })).documents)
    } catch (e) {
      toast.error(e)
    }
  }
  const rows = (who: 'TENANT' | 'GUARANTOR') =>
    docs.map((d) => (
      <DocFilesRow
        key={`${who}-${d.key}`}
        label={d.label}
        files={files.filter((x) => x.who === who && x.category === d.key).map((x) => ({ id: x.fileId, name: x.name }))}
        suggested={d.suggested}
        inputLabel={`${d.label} (${who === 'GUARANTOR' ? 'garant' : 'vous'})`}
        onAdd={(list) => add(d.key, who, list)}
        onRemove={(f) => remove(f.id)}
      />
    ))
  const done = files.length
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(32px, 5vw, 44px)')}>Candidature envoyée.</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>Dernière étape : déposez les pièces demandées par le propriétaire (photo ou PDF). Vous pouvez masquer les informations inutiles à leur vérification.</span>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>
          Chaque pièce reçoit un filigrane (« Uniquement pour louer un logement à… », avec la date) : seule cette copie est gardée. Le propriétaire ne la voit qu’après votre confirmation de la visite.
        </span>
      </div>
      <Card title="Vos pièces">{rows('TENANT')}</Card>
      {guarantor ? <Card title="Les pièces de votre garant">{rows('GUARANTOR')}</Card> : null}
      <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>Elles ne sont visibles que du propriétaire, après la visite, et sont effacées au plus tard trois mois après votre candidature si elle n’est pas retenue.</span>
      <div>
        <Btn onClick={onDone}>{done ? 'Terminer' : 'Terminer sans pièce'}</Btn>
      </div>
    </>
  )
}
