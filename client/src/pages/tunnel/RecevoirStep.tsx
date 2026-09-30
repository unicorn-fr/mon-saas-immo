import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { Check } from '../../components/Icons'
import { Logo } from '../../components/Logo'
import { Button, Notice, TextField, display } from '../../components/ui'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useDraft } from '../../lib/draft'
import type { User } from '../../lib/types'
import { missingFields } from './RelectureStep'

interface FinishResult {
  status: 'created' | 'check_email'
  leaseId?: string
  sessionToken?: string
  user?: User
  email?: string
}

const fullName = (p?: { firstName?: string; lastName?: string } | null) => [p?.firstName, p?.lastName].filter(Boolean).join(' ')

export default function RecevoirStep() {
  const { data, ready, reset, flush } = useDraft()
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState<string | null>(null)
  const imported = data.source === 'import'
  // Une fois le bail créé, le brouillon est vidé : il ne faut plus renvoyer vers la relecture.
  const finished = useRef(false)

  useEffect(() => {
    if (ready && !finished.current && missingFields(data).length) navigate('/commencer/relecture', { replace: true })
  }, [ready, data, navigate])

  function done(res: { leaseId?: string | null; sessionToken?: string; user?: User }) {
    finished.current = true
    if (res.sessionToken && res.user) signIn(res.sessionToken, res.user)
    reset()
    navigate(res.leaseId ? `/bienvenue/${res.leaseId}` : '/espace', { replace: true, state: { justCreated: true } })
  }

  async function finish(e?: FormEvent) {
    e?.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await flush()
      const res = await api<FinishResult>('/auth/finish-draft', { method: 'POST', body: user ? {} : { email }, draft: true })
      if (res.status === 'check_email') setCheckEmail(res.email ?? email)
      else done(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const tenants = (data.tenants ?? []).map(fullName).filter(Boolean).join(', ')

  return (
    <div className="col-md" style={{ minHeight: '100vh', display: 'flex', background: BAI.bg }}>
      <div className="stack hide-lg" style={{ width: '47%', maxWidth: 680, background: BAI.night, padding: '48px 72px', gap: 40 }}>
        <Logo size={28} color={BAI.caramel} />
        <div aria-hidden className="stack" style={{ alignSelf: 'center', position: 'relative', width: 400, maxWidth: '100%', height: 520, background: BAI.surface, borderRadius: 6, padding: '40px 36px', gap: 12, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkSoft, textAlign: 'center' }}>{imported ? 'Bail signé' : 'Contrat de location'}</div>
          <div style={{ fontFamily: BAI.fontDisplay, fontWeight: 700, fontSize: 24, textAlign: 'center', lineHeight: 1.1 }}>
            Logement {data.type === 'FURNISHED' ? 'meublé' : 'vide'} à usage de résidence principale
          </div>
          <div style={{ height: 1, background: BAI.rule, margin: '6px 0' }} />
          <div style={{ fontSize: 12, fontWeight: 700 }}>I. Les parties</div>
          <div style={{ fontSize: 12, color: BAI.inkMid }}>
            Le bailleur : {fullName(data.landlord)}. {(data.tenants?.length ?? 0) > 1 ? 'Les locataires' : 'Le locataire'} : {tenants}.
          </div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>II. Le logement</div>
          <div style={{ height: 8, background: BAI.skeleton, borderRadius: 2 }} />
          <div style={{ height: 8, background: BAI.skeleton, borderRadius: 2, width: '85%' }} />
          <div style={{ fontSize: 12, fontWeight: 700 }}>III. Durée</div>
          <div style={{ height: 8, background: BAI.skeleton, borderRadius: 2, width: '70%' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 260, background: `linear-gradient(to bottom, rgba(255,255,255,0), ${BAI.surface} 60%)`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 36 }}>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 15, fontWeight: 600 }}>
              <Check />
              {imported ? 'Lu et vérifié' : 'Prêt à imprimer'}
            </span>
          </div>
        </div>
      </div>

      <main className="stack" style={{ flex: 1, padding: 'clamp(40px, 6vw, 72px) clamp(20px, 8vw, 120px)', justifyContent: 'center', gap: 28, maxWidth: 760 }}>
        <div className="only-md" style={{ marginBottom: 8 }}>
          <Logo size={26} />
        </div>
        <h1 style={display('clamp(44px, 5vw, 60px)', { lineHeight: 1 })}>{imported ? 'Votre bail est lu.' : 'Votre bail est prêt.'}</h1>

        {checkEmail ? (
          <Notice tone="success">
            <strong>Regardez vos emails.</strong> Vous avez déjà un espace Bailio avec {checkEmail}. Nous venons de vous envoyer un lien : cliquez dessus pour y ajouter ce bail.
          </Notice>
        ) : user ? (
          <>
            <p style={{ margin: 0, fontSize: 19, color: BAI.inkMid }}>Il sera rangé dans votre espace, avec le compte {user.email}.</p>
            <Button full loading={loading} onClick={() => void finish()}>
              {imported ? 'Enregistrer dans mon espace' : 'Télécharger mon bail'}
            </Button>
          </>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 19, color: BAI.inkMid }}>{imported ? 'Où voulez-vous le ranger ?' : 'Où voulez-vous le recevoir ?'}</p>
            <form onSubmit={finish} className="stack" style={{ gap: 14 }}>
              <TextField label="Votre email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.fr" />
              <Button type="submit" full loading={loading}>
                {imported ? 'Enregistrer mon bail' : 'Télécharger mon bail'}
              </Button>
            </form>
            <div style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.6 }}>
              Gratuit, sans carte bancaire. Votre espace est créé avec cet email : pas de mot de passe, vous vous connecterez avec un lien reçu par email.
            </div>
          </>
        )}
        {error ? <Notice tone="warning">{error}</Notice> : null}
      </main>
    </div>
  )
}
