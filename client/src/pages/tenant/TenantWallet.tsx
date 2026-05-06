import { useEffect, useRef, useState } from 'react'
import { CreditCard, CheckCircle, Clock, AlertCircle, Trash2, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { loadStripe } from '@stripe/stripe-js'
import { BAI } from '../../constants/bailio-tokens'
import { Layout } from '../../components/layout/Layout'
import { connectService, type WalletPayment, type SepaMandate } from '../../services/connect.service'
import { apiClient } from '../../services/api.service'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')

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
    <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.ink, margin: '0 0 3px' }}>
            {contract.property.title}
          </p>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '0 0 10px' }}>
            {contract.property.address}, {contract.property.city}
          </p>
          <p style={{ fontFamily: BAI.fontDisplay, fontSize: 20, fontWeight: 700, color: BAI.owner, margin: 0 }}>
            {formatEuro(contract.monthlyRent * 100)} <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, fontWeight: 400 }}>/mois</span>
          </p>
        </div>

        {mandate?.isActive ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 99, background: '#f0fdf4', color: '#16a34a', fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600 }}>
              <CheckCircle style={{ width: 12, height: 12 }} /> Prélèvement actif
            </span>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: 0 }}>
              IBAN se terminant par ···{mandate.ibanLast4}
            </p>
            {mandate.holderName && (
              <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0 }}>{mandate.holderName}</p>
            )}
            <button
              onClick={onRevoke}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid #fca5a5`, background: BAI.errorLight, color: BAI.error, fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <Trash2 style={{ width: 12, height: 12 }} /> Révoquer
            </button>
          </div>
        ) : (
          <button
            onClick={onSetup}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, border: 'none', background: BAI.tenant, color: '#fff', fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <CreditCard style={{ width: 14, height: 14 }} />
            Configurer le prélèvement automatique
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '14px 20px', borderBottom: `1px solid ${BAI.border}`, gap: 12 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink }}>
            {MONTHS[p.periodMonth - 1]} {p.periodYear}
          </span>
          <span style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, color: statusColors[p.status], background: p.status === 'SUCCEEDED' ? '#f0fdf4' : BAI.bgMuted, padding: '2px 7px', borderRadius: 99 }}>
            {statusLabels[p.status]}
          </span>
        </div>
        <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
          {p.contract.property.title}
        </span>
        {p.failureReason && (
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.error, margin: '2px 0 0' }}>{p.failureReason}</p>
        )}
      </div>
      <p style={{ fontFamily: BAI.fontDisplay, fontSize: 18, fontWeight: 700, color: BAI.ink, margin: 0, textAlign: 'right' }}>
        {formatEuro(p.totalAmountCents)}
      </p>
    </div>
  )
}

// ─── Modal Setup SEPA — flow Stripe.js officiel ───────────────────────────────
// Flow :
// 1. Backend crée un SetupIntent → retourne clientSecret + setupIntentId
// 2. Stripe.js confirme le SetupIntent avec l'IBAN (sécurisé, jamais envoyé au backend)
// 3. Backend met à jour la DB avec le mandat confirmé (/mandate/confirm)
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

      // Confirmer le SetupIntent avec l'IBAN directement via Stripe.js
      // L'IBAN ne transite JAMAIS par nos serveurs — PCI compliant
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

      if (stripeError) throw new Error(stripeError.message ?? 'Erreur Stripe')
      if (setupIntent?.status !== 'processing' && setupIntent?.status !== 'succeeded') {
        throw new Error(`Statut inattendu : ${setupIntent?.status}`)
      }

      // Informer le backend que le mandat est confirmé (mise à jour DB)
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(13,12,10,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 20, padding: '32px 28px', maxWidth: 460, width: '100%', boxShadow: '0 8px 40px rgba(13,12,10,0.15)' }}>

        {(step === 'loading' || step === 'confirming') && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${BAI.border}`, borderTopColor: BAI.tenant, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid }}>
              {step === 'loading' ? 'Initialisation...' : 'Confirmation en cours...'}
            </p>
          </div>
        )}

        {step === 'form' && (
          <>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 6px' }}>
              Prélèvement automatique
            </p>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: BAI.ink, margin: '0 0 8px' }}>
              Configurer mon IBAN
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, lineHeight: 1.6, margin: '0 0 22px' }}>
              Votre loyer sera prélevé automatiquement chaque mois. Vous pouvez révoquer ce mandat à tout moment.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>
                  Titulaire du compte *
                </label>
                <input
                  type="text"
                  value={holderName}
                  onChange={e => setHolderName(e.target.value)}
                  placeholder="Prénom Nom"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgMuted, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, display: 'block', marginBottom: 6 }}>
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={holderEmail}
                  onChange={e => setHolderEmail(e.target.value)}
                  placeholder="prenom@exemple.fr"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgMuted, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, outline: 'none', boxSizing: 'border-box' }}
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
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `1px solid ${ibanError ? BAI.error : BAI.border}`, background: BAI.bgMuted, fontFamily: 'monospace', fontSize: 14, color: BAI.ink, outline: 'none', letterSpacing: '0.05em', boxSizing: 'border-box' }}
                />
                {ibanError && <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.error, margin: '4px 0 0' }}>{ibanError}</p>}
              </div>
            </div>

            <div style={{ marginTop: 16, padding: '12px 14px', background: BAI.bgMuted, borderRadius: 8, fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, lineHeight: 1.5 }}>
              En confirmant, vous autorisez Bailio et Stripe à initier des débits SEPA. Votre IBAN est transmis directement à Stripe de manière sécurisée et ne transite pas par nos serveurs. Droit de remboursement sous 8 semaines.
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${BAI.border}`, background: 'transparent', color: BAI.inkMid, fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: BAI.tenant, color: '#fff', fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Confirmer le mandat SEPA
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle style={{ width: 48, height: 48, color: '#16a34a', margin: '0 auto 16px' }} />
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: BAI.ink, margin: '0 0 8px' }}>Mandat configuré !</h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid }}>Votre loyer sera prélevé automatiquement chaque mois.</p>
          </div>
        )}

        {step === 'error' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <AlertCircle style={{ width: 40, height: 40, color: BAI.error, margin: '0 auto 12px' }} />
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.error }}>{errorMsg}</p>
            <button onClick={onClose} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: 'transparent', color: BAI.inkMid, fontFamily: BAI.fontBody, fontSize: 13, cursor: 'pointer' }}>
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

      // Charger les mandats de chaque contrat
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

  return (
    <Layout>
      <div style={{ maxWidth: 840, margin: '0 auto', padding: 'clamp(20px,5vw,40px)' }}>

        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 4px' }}>
            Mes paiements
          </p>
          <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,40px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 8px' }}>
            Payer mon loyer
          </h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
            Configurez un prélèvement automatique mensuel. Plus de virement à faire — votre loyer est prélevé le même jour chaque mois.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 64 }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${BAI.border}`, borderTopColor: BAI.tenant, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : (
          <>
            {/* Contrats actifs */}
            {contracts.length === 0 ? (
              <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
                <Building2 style={{ width: 32, height: 32, color: BAI.inkFaint, margin: '0 auto 12px' }} />
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint }}>Aucun bail actif. Le prélèvement automatique sera disponible une fois votre bail signé.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
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
              <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock style={{ width: 16, height: 16, color: BAI.tenant }} />
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink, margin: 0 }}>Historique des prélèvements</p>
              </div>
              {payments.length === 0 ? (
                <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint }}>Aucun prélèvement enregistré.</p>
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
