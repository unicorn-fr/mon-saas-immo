import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Check } from '../components/Icons'
import { Logo } from '../components/Logo'
import { Button, Notice, Spinner, display, overline } from '../components/ui'
import { api, ApiError, downloadPdf, pdfUrl, printPdf } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useDraft } from '../lib/draft'
import { addMonths, dateFr, parseIso } from '../lib/lease'
import type { User } from '../lib/types'
import type { LeaseView } from '../lib/space'
import { priceLabel } from '../config'

export default function Bienvenue() {
  const { leaseId } = useParams()
  const { state } = useLocation() as { state: { justCreated?: boolean } | null }
  const { user, setUser } = useAuth()
  const { reset } = useDraft()
  const navigate = useNavigate()
  const [lease, setLease] = useState<LeaseView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'print' | 'download' | 'followup' | null>(null)
  const url = useRef<string | null>(null)
  const downloaded = useRef(false)

  const getPdf = async () => (url.current ??= await pdfUrl(`/leases/${leaseId}/lease.pdf`))

  useEffect(() => {
    api<LeaseView>(`/leases/${leaseId}`)
      .then((l) => {
        setLease(l)
        // Juste après la création : le bail est téléchargé automatiquement.
        if (state?.justCreated && l.status !== 'IMPORTED' && !downloaded.current) {
          downloaded.current = true
          getPdf().then((u) => downloadPdf(u, 'bail.pdf')).catch(() => undefined)
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Bail introuvable.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaseId])

  async function act(kind: 'print' | 'download') {
    setBusy(kind)
    try {
      const u = await getPdf()
      if (kind === 'print') printPdf(u)
      else downloadPdf(u, 'bail.pdf')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Document indisponible.')
    } finally {
      setBusy(null)
    }
  }

  async function activate() {
    setBusy('followup')
    try {
      setUser(await api<User>('/account/follow-up', { method: 'POST' }))
      navigate('/espace')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Activation impossible.')
      setBusy(null)
    }
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 80 }}>
        <Notice tone="warning">{error}</Notice>
        <p><Link to="/espace">Aller à mon espace</Link></p>
      </div>
    )
  }
  if (!lease) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={28} />
      </div>
    )
  }

  const imported = lease.status === 'IMPORTED'
  const start = parseIso(lease.columns.startDate)
  const revision = addMonths(start, 12)
  const notice = lease.computed.noticeMonths
  const firstName = user?.firstName ?? lease.contract.landlord.firstNames?.split(' ')[0]
  const inventoryFuture = !imported && start.getTime() >= Date.now() - 86_400_000
  const followUpActive = user?.followUpActive

  const care = [
    { title: 'Quittance chaque mois', text: 'Préparée dès que le loyer arrive' },
    { title: 'Assurance du locataire', text: 'Demande préparée chaque année' },
    { title: 'Révision du loyer', text: `Calculée le ${dateFr(revision)}` },
    { title: 'Fin du bail', text: notice ? `Rappel ${notice + 1} mois avant, pour donner congé à temps` : 'Rappel avant la date de fin' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BAI.bg }}>
      <header style={{ height: 72, padding: '0 clamp(20px, 3.3vw, 48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: BAI.surface }}>
        <Logo size={28} to={null} />
        <Link to="/espace" style={{ fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
          Aller à mon espace
        </Link>
      </header>
      <main className="split container" style={{ flex: 1, padding: 'clamp(40px, 5vw, 72px) clamp(20px, 8.3vw, 120px)', gap: 72, maxWidth: 1440 }}>
        <div className="stack" style={{ flex: 1, gap: 28, minWidth: 0 }}>
          <h1 style={display('clamp(46px, 5vw, 64px)', { lineHeight: 1 })}>C'est fait{firstName ? `, ${firstName}` : ''}.</h1>
          <p style={{ margin: 0, fontSize: 19, color: BAI.inkMid }}>
            {imported ? 'Votre bail signé est rangé dans votre espace.' : 'Votre bail est téléchargé et envoyé par email.'}
          </p>
          <div className="col-md" style={{ display: 'flex', gap: 12 }}>
            <Button height={56} loading={busy === 'print'} onClick={() => void act('print')}>
              Imprimer le bail
            </Button>
            <Button height={56} variant="outline" loading={busy === 'download'} onClick={() => void act('download')}>
              {imported ? 'Télécharger' : 'Télécharger à nouveau'}
            </Button>
          </div>
          <div className="stack" style={{ gap: 14, paddingTop: 20 }}>
            <span style={overline}>Et maintenant</span>
            {inventoryFuture ? (
              <Link to={`/espace/baux/${lease.id}/etat-des-lieux`} style={{ textDecoration: 'none', color: BAI.ink, background: BAI.surface, border: `2px solid ${BAI.owner}`, borderRadius: 18, padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <span className="stack" style={{ gap: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>Préparer l'état des lieux d'entrée</span>
                  <span style={{ fontSize: 15, color: BAI.inkMid }}>À faire le {dateFr(start, false)}, avec votre locataire</span>
                </span>
                <span aria-hidden style={{ fontSize: 22, color: BAI.owner }}>→</span>
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => {
                reset()
                navigate('/espace/logements/nouveau')
              }}
              style={{ textAlign: 'left', color: BAI.ink, background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 18, padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}
            >
              <span className="stack" style={{ gap: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>Ajouter un autre logement</span>
                <span style={{ fontSize: 15, color: BAI.inkMid }}>Ou importer un bail déjà signé, en photo</span>
              </span>
              <span aria-hidden style={{ fontSize: 22, color: BAI.owner }}>→</span>
            </button>
          </div>
        </div>

        <aside className="stack full-md" style={{ width: 460, flexShrink: 0, alignSelf: 'flex-start', background: BAI.night, borderRadius: 24, padding: 32 }}>
          <h2 style={display(32, { margin: '0 0 16px', color: BAI.surface })}>Bailio s'en occupe</h2>
          {care.map((c) => (
            <div key={c.title} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '16px 0', borderTop: `1px solid ${BAI.nightLine}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 16, background: BAI.greenDarkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check color={BAI.greenOnDark} strokeWidth={2.6} />
              </div>
              <div className="stack" style={{ gap: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: BAI.surface }}>{c.title}</span>
                <span style={{ fontSize: 14, color: BAI.onDarkMuted }}>{c.text}</span>
              </div>
            </div>
          ))}
          <div className="stack" style={{ marginTop: 20, background: BAI.caramel, borderRadius: 18, padding: 22, gap: 12 }}>
            {followUpActive ? (
              <span style={{ fontSize: 17, fontWeight: 700, color: BAI.night }}>Le suivi est activé. Vous recevrez un email avant chaque échéance.</span>
            ) : (
              <>
                <span style={{ fontSize: 17, fontWeight: 700, color: BAI.night }}>Votre bail est gratuit. Le suivi, c'est l'offre complète.</span>
                <span style={{ fontSize: 14, color: BAI.night, lineHeight: 1.5 }}>
                  {priceLabel()}{priceLabel() === 'Prix à venir' ? '' : ' par mois'}, sans engagement. Les rappels ci-dessus démarrent dès l'activation.
                </span>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Button variant="dark" height={46} loading={busy === 'followup'} onClick={() => void activate()} style={{ padding: '0 18px', fontSize: 15 }}>
                    Activer le suivi
                  </Button>
                  <Link to="/espace" style={{ textDecoration: 'none', color: BAI.night, height: 46, padding: '0 10px', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center' }}>
                    Plus tard
                  </Link>
                </div>
              </>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}
