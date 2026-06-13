/**
 * Wallet — Page portefeuille financier propriétaire.
 * Design Bailio "Maison" : hero sombre #0a0d1a + glass cards + contenu light bgBase
 */
import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { apiClient } from '../../services/api.service'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  category?: string
}

interface WalletData {
  balance: number
  monthlyIn: number
  pending: number
  iban?: string
  transactions: Transaction[]
}

function formatEuro(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Wallet() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<WalletData | null>(null)
  const [tab, setTab] = useState<'all' | 'credit' | 'debit'>('all')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await apiClient.get('/finance/wallet')
        setData(res.data.data as WalletData)
      } catch {
        setData({ balance: 0, monthlyIn: 0, pending: 0, iban: undefined, transactions: [] })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = (data?.transactions ?? []).filter(t =>
    tab === 'all' ? true : t.type === tab
  )

  return (
    <Layout>
      <div>
        {/* ── DARK HERO ── */}
        <div style={{
          background: '#0a0d1a',
          padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px) clamp(32px,5vw,56px)',
        }}>
          <p style={{
            fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: BAI.caramel, margin: 0,
          }}>FINANCES</p>
          <h1 style={{
            fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,42px)',
            fontWeight: 700, fontStyle: 'italic', color: '#ffffff',
            margin: '6px 0 8px', lineHeight: 1.1,
          }}>Mon Portefeuille</h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Suivez vos encaissements, retraits et solde disponible
          </p>

          {loading ? (
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Loader2 style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.4)', animation: 'wspin 1s linear infinite' }} />
              <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Chargement…</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3" style={{ marginTop: 28 }}>
              {/* Solde total */}
              <div style={{
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.13)', borderRadius: 16, padding: '20px 28px', minWidth: 160,
              }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>SOLDE</p>
                <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(32px,5vw,54px)', fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1 }}>
                  {formatEuro(data?.balance ?? 0)}
                </p>
              </div>

              {/* Encaissé ce mois */}
              <div style={{
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.13)', borderRadius: 16, padding: '20px 24px', minWidth: 140,
              }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>ENCAISSÉ CE MOIS</p>
                <p style={{ fontFamily: BAI.fontDisplay, fontSize: 36, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1 }}>
                  {formatEuro(data?.monthlyIn ?? 0)}
                </p>
              </div>

              {/* En attente */}
              <div style={{
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.13)', borderRadius: 16, padding: '20px 24px', minWidth: 140,
              }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>EN ATTENTE</p>
                <p style={{
                  fontFamily: BAI.fontDisplay, fontSize: 36, fontWeight: 700, fontStyle: 'italic',
                  color: (data?.pending ?? 0) > 0 ? BAI.caramel : 'rgba(255,255,255,0.45)',
                  margin: 0, lineHeight: 1,
                }}>
                  {formatEuro(data?.pending ?? 0)}
                </p>
              </div>
            </div>
          )}

          {/* CTA + IBAN badge */}
          <div className="flex flex-wrap items-center gap-3" style={{ marginTop: 24 }}>
            <button
              onClick={() => toast.success('Fonctionnalité bientôt disponible')}
              style={{
                background: BAI.caramel, color: '#fff', border: 'none', borderRadius: 8,
                padding: '11px 22px', fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Retirer des fonds
            </button>
            {data?.iban ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20,
                background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.15)',
                fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
              }}>IBAN configuré</span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
                fontFamily: BAI.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.40)',
              }}>Aucun IBAN renseigné</span>
            )}
          </div>
        </div>

        {/* ── CONTENU LIGHT ── */}
        <div style={{ background: BAI.bgBase, minHeight: '60vh', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,48px)' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>

            <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginBottom: 20 }}>
              <h2 style={{
                fontFamily: BAI.fontDisplay, fontSize: 'clamp(20px,3vw,28px)',
                fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0,
              }}>Transactions récentes</h2>

              <div className="flex" style={{
                background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                borderRadius: 8, padding: 3, gap: 3,
              }}>
                {([
                  { k: 'all', l: 'Toutes' },
                  { k: 'credit', l: 'Entrants' },
                  { k: 'debit', l: 'Sortants' },
                ] as const).map(({ k, l }) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: 'none',
                      background: tab === k ? BAI.bgSurface : 'transparent',
                      color: tab === k ? BAI.ink : BAI.inkFaint,
                      fontFamily: BAI.fontBody, fontSize: 13,
                      fontWeight: tab === k ? 600 : 400,
                      cursor: 'pointer',
                      boxShadow: tab === k ? BAI.shadowSm : 'none',
                    }}
                  >{l}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{
                background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
                borderRadius: 12, padding: '40px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <Loader2 style={{ width: 20, height: 20, color: BAI.inkFaint, animation: 'wspin 1s linear infinite' }} />
                <span style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint }}>Chargement…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{
                background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
                borderRadius: 12, padding: '48px 24px', textAlign: 'center',
              }}>
                <p style={{ fontFamily: BAI.fontDisplay, fontSize: 22, fontStyle: 'italic', color: BAI.inkFaint, margin: '0 0 6px' }}>
                  Aucune transaction
                </p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint, margin: 0 }}>
                  Les transactions apparaîtront ici dès que des paiements seront enregistrés.
                </p>
              </div>
            ) : (
              <div style={{
                background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
                borderRadius: 12, overflow: 'hidden', boxShadow: BAI.shadowSm,
              }}>
                {filtered.map((tx, i) => (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                      borderBottom: i < filtered.length - 1 ? `1px solid ${BAI.border}` : 'none',
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: tx.type === 'credit' ? BAI.tenant : BAI.error }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.description}
                      </p>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: 0 }}>
                        {formatDate(tx.date)}{tx.category ? ` · ${tx.category}` : ''}
                      </p>
                    </div>
                    <p style={{
                      fontFamily: BAI.fontDisplay, fontSize: 18, fontWeight: 700, fontStyle: 'italic',
                      color: tx.type === 'credit' ? BAI.tenant : BAI.error, margin: 0, flexShrink: 0,
                    }}>
                      {tx.type === 'credit' ? '+' : '−'}{formatEuro(Math.abs(tx.amount))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes wspin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </Layout>
  )
}
