import { useEffect, useRef, useState } from 'react'
import { CreditCard, CheckCircle, Clock, AlertCircle, Trash2, Building2, Banknote, CalendarDays, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { loadStripe } from '@stripe/stripe-js'
import { BAI } from '../../constants/bailio-tokens'
import { Layout } from '../../components/layout/Layout'
import { connectService, type WalletPayment, type SepaMandate } from '../../services/connect.service'
import { apiClient } from '../../services/api.service'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')

const stripeErrorToFR = (code?: string, message?: string): string => {
  const map: Record<string, string> = {
    'invalid_bank_account_iban': 'IBAN invalide. Vérifiez votre numéro de compte.',
    'payment_method_invalid_parameter': 'Paramètre de paiement invalide.',
    'sepa_unsupported_account': 'Ce compte SEPA n\'est pas supporté.',
    'insufficient_funds': 'Fonds insuffisants.',
    'bank_account_declined': 'La banque a refusé l\'opération.',
    'debit_not_authorized': 'Débit non autorisé par votre banque.',
    'mandate_reference_invalid': 'Référence de mandat invalide.',
  }
  if (code && map[code]) return map[code]
  if (message?.toLowerCase().includes('iban')) return 'IBAN invalide. Vérifiez votre numéro de compte.'
  if (message?.toLowerCase().includes('invalid')) return 'Données invalides. Vérifiez vos informations.'
  return 'Une erreur est survenue. Veuillez réessayer ou contacter le support.'
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function formatEuro(cents: number) {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

interface ContractInfo {
  id: string
  property: { title: string; address: string; city: string }
  monthlyRent: number
  status: string
}

// Prochain jour de prélèvement (1er du mois suivant)
function nextDebitDate(): string {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return next.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function TenantAccountCard({ contracts, mandates, totalPaid }: {
  contracts: ContractInfo[]
  mandates: Record<string, SepaMandate | null>
  totalPaid: number
}) {
  const activeCount = contracts.filter(c => mandates[c.id]?.isActive).length
  const totalMonthly = contracts.reduce((s, c) => s + c.monthlyRent, 0)

  return (
    <div style={{
      background: BAI.night, borderRadius: 20, padding: 'clamp(24px,4vw,36px)',
      marginBottom: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Motif décoratif */}
      <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(27,94,59,0.12)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(196,151,106,0.06)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(196,151,106,0.15)', border: '1px solid rgba(196,151,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote style={{ width: 20, height: 20, color: BAI.caramel }} />
            </div>
            <div>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Compte Bailio
              </p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                Locataire · Prélèvements SEPA
              </p>
            </div>
          </div>
          {activeCount > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', color: '#4ade80', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600 }}>
              <ShieldCheck style={{ width: 13, height: 13 }} /> {activeCount} mandat{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {contracts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
            <div>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Loyer mensuel
              </p>
              <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(30px,5vw,44px)', fontWeight: 700, fontStyle: 'italic', color: BAI.caramel, margin: 0, lineHeight: 1.1 }}>
                {formatEuro(totalMonthly * 100)}
              </p>
            </div>
            {activeCount > 0 && (
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <CalendarDays style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.35)' }} />
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    Prochain prélèvement
                  </p>
                </div>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: '0 0 3px' }}>
                  {nextDebitDate()}
                </p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                  Automatique · aucune action requise
                </p>
              </div>
            )}
            {totalPaid > 0 && (
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 20 }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                  Total payé
                </p>
                <p style={{ fontFamily: BAI.fontDisplay, fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                  {formatEuro(totalPaid)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            Aucun bail actif pour le moment. Le prélèvement automatique sera disponible dès que votre bail sera signé.
          </p>
        )}
      </div>
    </div>
  )
}

function MandateCard({
  contract,
  mandate,
  onSetup,
  onRevoke,
}: {
  contract: ContractInfo
  mandate: SepaMandate | null
  onSetup: () => void
  onRevoke: () => void
}) {
  return (
    <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: '22px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: BAI.ink, margin: '0 0 3px' }}>
            {contract.property.title}
          </p>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '0 0 12px' }}>
            {contract.property.address}, {contract.property.city}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <p style={{ fontFamily: BAI.fontDisplay, fontSize: 24, fontWeight: 700, color: BAI.ink, margin: 0 }}>
              {formatEuro(contract.monthlyRent * 100)}
            </p>
            <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint }}>/mois</span>
          </div>
        </div>

        {mandate?.isActive ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, background: '#f0fdf4', color: '#16a34a', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600 }}>
              <CheckCircle style={{ width: 13, height: 13 }} /> Prélèvement actif
            </span>
            <p style={{ fontFamily: 'monospace', fontSize: 13, color: BAI.inkMid, margin: 0, background: BAI.bgMuted, padding: '4px 10px', borderRadius: 6 }}>
              ···· {mandate.ibanLast4}
            </p>
            {mandate.holderName && (
              <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0 }}>{mandate.holderName}</p>
            )}
            <button
              onClick={onRevoke}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 8, border: `1px solid #fca5a5`, background: BAI.errorLight, color: BAI.error, fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <Trash2 style={{ width: 12, height: 12 }} /> Révoquer
            </button>
          </div>
        ) : (
          <button
            onClick={onSetup}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 10, border: 'none', background: BAI.night, color: '#fff', fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <CreditCard style={{ width: 14, height: 14 }} />
            Configurer le prélèvement
          </button>
        )}
      </div>
    </div>
  )
}

function PaymentRow({ p }: { p: WalletPayment }) {
  const statusColors: Record<string, string> = {
    SUCCEEDED: '#16a34a', PROCESSING: '#92400e', PENDING: BAI.inkFaint, FAILED: BAI.error, REFUNDED: BAI.inkMid,
  }
  const statusLabels: Record<string, string> = {
    SUCCEEDED: 'Prélevé', PROCESSING: 'En cours', PENDING: 'Prévu', FAILED: 'Échoué', REFUNDED: 'Remboursé',
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '16px 22px', borderBottom: `1px solid ${BAI.border}`, gap: 12 }}
      onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink }}>
            {MONTHS[p.periodMonth - 1]} {p.periodYear}
          </span>
          <span style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, color: statusColors[p.status], background: p.status === 'SUCCEEDED' ? '#f0fdf4' : BAI.bgMuted, padding: '2px 8px', borderRadius: 99 }}>
            {statusLabels[p.status]}
          </span>
        </div>
        <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
          {p.contract.property.title}
        </span>
        {p.failureReason && (
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.error, margin: '3px 0 0' }}>{p.failureReason}</p>
        )}
      </div>
      <p style={{ fontFamily: BAI.fontDisplay, fontSize: 20, fontWeight: 700, color: BAI.ink, margin: 0, textAlign: 'right' }}>
        {formatEuro(p.totalAmountCents)}
      </p>
    </div>
  )
}

// ─── Modal Setup SEPA ────────────────────────────────────────────────────────
function SepaSetupModal({ contractId, onSuccess, onClose }: {
  contractId: string
  onSuccess: () => void
  onClose: () => void
}) {
  const [step, setStep] = useState<'loading' | 'form' | 'confirming' | 'done' | 'error'>('loading')
  const [holderName, setHolderName] = useState('')
  const [holderEmail, setHolderEmail] = useState('')
  const [iban, setIban] = useState('')
  const [ibanError, setIbanError] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const clientSecretRef = useRef('')
  const setupIntentIdRef = useRef('')

  useEffect(() => {
    connectService.setupMandate(contractId)
      .then(({ clientSecret, setupIntentId }) => {
        clientSecretRef.current = clientSecret
        setupIntentIdRef.current = setupIntentId
        setStep('form')
      })
      .catch(err => { setErrorMsg(err.message); setStep('error') })
  }, [contractId])

  function validateIban(value: string) {
    const clean = value.replace(/\s/g, '').toUpperCase()
    if (clean.length < 14 || clean.length > 34) return 'IBAN invalide (longueur incorrecte)'
    if (!/^[A-Z]{2}[0-9]{2}/.test(clean)) return 'IBAN invalide (doit commencer par 2 lettres + 2 chiffres)'
    return ''
  }

  async function handleSubmit() {
    const cleanIban = iban.replace(/\s/g, '').toUpperCase()
    const err = validateIban(cleanIban)
    if (err) { setIbanError(err); return }
    if (!holderName.trim()) { toast.error('Veuillez saisir le nom du titulaire'); return }

    setStep('confirming')
    try {
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe non disponible — vérifiez VITE_STRIPE_PUBLISHABLE_KEY')

      const { error: stripeError, setupIntent } = await stripe.confirmSepaDebitSetup(
        clientSecretRef.current,
        {
          payment_method: {
            sepa_debit: { iban: cleanIban },
            billing_details: {
              name: holderName.trim(),
              email: holderEmail.trim(),
            },
          },
        }
      )

      if (stripeError) throw new Error(stripeErrorToFR(stripeError.code, stripeError.message))
      if (setupIntent?.status !== 'processing' && setupIntent?.status !== 'succeeded') {
        throw new Error(`Statut inattendu : ${setupIntent?.status}`)
      }

      await connectService.confirmMandate(setupIntentIdRef.current)
      setStep('done')
      setTimeout(() => { onSuccess(); onClose() }, 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la configuration'
      toast.error(msg)
      setStep('form')
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(13,12,10,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 20, padding: '32px 30px', maxWidth: 480, width: '100%', boxShadow: '0 12px 48px rgba(13,12,10,0.18)' }}>

        {(step === 'loading' || step === 'confirming') && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${BAI.border}`, borderTopColor: BAI.night, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid }}>
              {step === 'loading' ? 'Préparation du mandat...' : 'Validation en cours...'}
            </p>
          </div>
        )}

        {step === 'form' && (
          <>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 6px' }}>
              Prélèvement automatique
            </p>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 24, color: BAI.ink, margin: '0 0 8px' }}>
              Configurer mon IBAN
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, lineHeight: 1.6, margin: '0 0 24px' }}>
              Votre loyer sera prélevé automatiquement le 1er de chaque mois. Ce mandat est révocable à tout moment.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>
                  Titulaire du compte *
                </label>
                <input
                  type="text"
                  value={holderName}
                  onChange={e => setHolderName(e.target.value)}
                  placeholder="Prénom Nom"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: `1px solid ${BAI.border}`, background: BAI.bgMuted, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>
                  Email <span style={{ color: BAI.inkFaint, fontWeight: 400 }}>(optionnel)</span>
                </label>
                <input
                  type="email"
                  value={holderEmail}
                  onChange={e => setHolderEmail(e.target.value)}
                  placeholder="prenom@exemple.fr"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: `1px solid ${BAI.border}`, background: BAI.bgMuted, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>
                  IBAN *
                </label>
                <input
                  type="text"
                  value={iban}
                  onChange={e => { setIban(e.target.value.toUpperCase()); setIbanError('') }}
                  placeholder="FR76 3000 4000 0500 0000 0000 000"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: `1px solid ${ibanError ? BAI.error : BAI.border}`, background: BAI.bgMuted, fontFamily: 'monospace', fontSize: 14, color: BAI.ink, outline: 'none', letterSpacing: '0.06em', boxSizing: 'border-box' }}
                />
                {ibanError && <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.error, margin: '5px 0 0' }}>{ibanError}</p>}
              </div>
            </div>

            <div style={{ marginTop: 18, padding: '12px 14px', background: BAI.bgMuted, borderRadius: 9, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <ShieldCheck style={{ width: 14, height: 14, color: BAI.inkFaint, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, lineHeight: 1.5, margin: 0 }}>
                En confirmant, vous autorisez Bailio et Stripe à initier des débits SEPA sur ce compte. Votre IBAN est transmis directement à Stripe — il ne transite jamais par nos serveurs. Remboursement possible sous 8 semaines.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: `1px solid ${BAI.border}`, background: 'transparent', color: BAI.inkMid, fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: BAI.night, color: '#fff', fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Confirmer le mandat SEPA
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle style={{ width: 28, height: 28, color: '#16a34a' }} />
            </div>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 24, color: BAI.ink, margin: '0 0 8px' }}>Mandat configuré !</h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>Votre loyer sera prélevé automatiquement le 1er de chaque mois.</p>
          </div>
        )}

        {step === 'error' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: BAI.errorLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertCircle style={{ width: 26, height: 26, color: BAI.error }} />
            </div>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.error, marginBottom: 20 }}>{errorMsg}</p>
            <button onClick={onClose} style={{ padding: '10px 28px', borderRadius: 9, border: `1px solid ${BAI.border}`, background: 'transparent', color: BAI.inkMid, fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function TenantWallet() {
  const [contracts, setContracts] = useState<ContractInfo[]>([])
  const [mandates, setMandates] = useState<Record<string, SepaMandate | null>>({})
  const [payments, setPayments] = useState<WalletPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [setupContractId, setSetupContractId] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [contractsRes, paymentsData] = await Promise.all([
        apiClient.get<{ success: boolean; data: { contracts: ContractInfo[] } }>('/contracts?role=tenant'),
        connectService.getTenantPayments().catch(() => []),
      ])

      const activeContracts = (contractsRes.data.data?.contracts ?? []).filter((c: ContractInfo) => c.status === 'ACTIVE')
      setContracts(activeContracts)
      setPayments(paymentsData)

      const mandateResults = await Promise.all(
        activeContracts.map(async (c: ContractInfo) => {
          const m = await connectService.getMandate(c.id).catch(() => null)
          return [c.id, m] as [string, SepaMandate | null]
        })
      )
      setMandates(Object.fromEntries(mandateResults))
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke(contractId: string) {
    if (!confirm('Révoquer le mandat SEPA ? Le prélèvement automatique sera désactivé.')) return
    try {
      await connectService.revokeMandate(contractId)
      setMandates(prev => ({ ...prev, [contractId]: null }))
      toast.success('Mandat révoqué')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const totalPaid = payments.filter(p => p.status === 'SUCCEEDED').reduce((s, p) => s + p.totalAmountCents, 0)

  return (
    <Layout>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(20px,5vw,40px)' }}>

        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 4px' }}>
            Mon espace paiement
          </p>
          <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,40px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 8px' }}>
            Payer mon loyer
          </h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
            Prélèvement automatique SEPA — votre loyer est prélevé le 1er de chaque mois, sans action de votre part.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${BAI.border}`, borderTopColor: BAI.night, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : (
          <>
            {/* Carte compte Bailio */}
            <TenantAccountCard contracts={contracts} mandates={mandates} totalPaid={totalPaid} />

            {/* Baux actifs */}
            {contracts.length === 0 ? (
              <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: '52px 24px', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Building2 style={{ width: 24, height: 24, color: BAI.inkFaint }} />
                </div>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: '0 0 8px', fontWeight: 600 }}>Aucun bail actif</p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, margin: 0 }}>
                  Le prélèvement automatique est disponible dès que votre bail est signé.{' '}
                  <Link to="/contracts" style={{ color: BAI.caramel, fontWeight: 600, textDecoration: 'none' }}>
                    Voir mes contrats →
                  </Link>
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {contracts.map(c => (
                  <MandateCard
                    key={c.id}
                    contract={c}
                    mandate={mandates[c.id] ?? null}
                    onSetup={() => setSetupContractId(c.id)}
                    onRevoke={() => handleRevoke(c.id)}
                  />
                ))}
              </div>
            )}

            {/* Historique */}
            <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock style={{ width: 15, height: 15, color: BAI.inkMid }} />
                  </div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink, margin: 0 }}>
                    Historique des prélèvements
                  </p>
                </div>
                {payments.length > 0 && (
                  <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>{payments.length} transaction{payments.length > 1 ? 's' : ''}</span>
                )}
              </div>
              {payments.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint }}>Aucun prélèvement enregistré pour le moment.</p>
                </div>
              ) : (
                payments.map(p => <PaymentRow key={p.id} p={p} />)
              )}
            </div>
          </>
        )}
      </div>

      {setupContractId && (
        <SepaSetupModal
          contractId={setupContractId}
          onSuccess={() => { setSetupContractId(null); loadData() }}
          onClose={() => setSetupContractId(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
