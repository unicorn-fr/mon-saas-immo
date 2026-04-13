/**
 * PrivacyCenter — Centre de confidentialité RGPD pour le locataire.
 *
 * Sections :
 *   1. Bannière de sécurité (chiffrement, suppression auto)
 *   2. Télécharger mes données (Art. 20 RGPD — portabilité)
 *   3. Journal d'accès — qui a consulté mon dossier et quand
 *   4. Supprimer mon compte (Art. 17 RGPD — droit à l'oubli)
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Download, Eye, Trash2, AlertTriangle, Clock,
  Lock, FileText, User, ChevronRight, Loader2, CheckCircle2,
  X, Mail,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { privacyApi, DossierAccessLog } from '../../services/dossier.service'
import toast from 'react-hot-toast'
import { BAI } from '../../constants/bailio-tokens'

// ── Maison design tokens ──────────────────────────────────────────────────────

// ── Section card wrapper ──────────────────────────────────────────────────────
function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        background: BAI.bgSurface,
        border: `1px solid ${BAI.border}`,
        borderRadius: 12,
        boxShadow: BAI.shadowMd,
      }}
    >
      {children}
    </div>
  )
}

// ── Access log row ────────────────────────────────────────────────────────────
function AccessLogRow({ log, index }: { log: DossierAccessLog; index: number }) {
  const dt = new Date(log.createdAt)
  const dateStr = dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 px-5 py-3.5 border-b last:border-0"
      style={{ borderColor: BAI.border }}
    >
      {/* Avatar initials */}
      <div
        className="w-9 h-9 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
        style={{ background: BAI.tenant, borderRadius: 10 }}
      >
        {(log.viewerName || log.viewerEmail)[0]?.toUpperCase() ?? '?'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: BAI.ink, fontFamily: BAI.fontBody }}>
          {log.viewerName || 'Propriétaire'}
        </p>
        <p className="text-[11px] truncate" style={{ color: BAI.inkFaint, fontFamily: BAI.fontBody }}>
          {log.viewerEmail}
          {log.propertyTitle && <span style={{ color: BAI.inkMid }}> · {log.propertyTitle}</span>}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-[12px] font-medium" style={{ color: BAI.inkMid, fontFamily: BAI.fontBody }}>{dateStr}</p>
        <p className="text-[11px]" style={{ color: BAI.inkFaint, fontFamily: BAI.fontBody }}>{timeStr}</p>
      </div>
    </motion.div>
  )
}

// ── Delete account modal ──────────────────────────────────────────────────────
function DeleteAccountModal({ onClose, onConfirm, loading }: {
  onClose: () => void
  onConfirm: (email: string) => void
  loading: boolean
}) {
  const { user } = useAuth()
  const [step, setStep] = useState<1 | 2>(1)
  const [inputEmail, setInputEmail] = useState('')

  const emailMatch = inputEmail.trim().toLowerCase() === user?.email?.toLowerCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-full max-w-md overflow-hidden"
        style={{ background: BAI.bgSurface, boxShadow: '0 20px 60px rgba(13,12,10,0.18)', borderRadius: 16 }}
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: BAI.border }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0"
              style={{ background: BAI.errorLight, borderRadius: 10 }}>
              <Trash2 className="w-5 h-5" style={{ color: '#9b1c1c' }} />
            </div>
            <div>
              <p className="font-bold text-[15px]" style={{ color: BAI.ink, fontFamily: BAI.fontBody }}>
                Supprimer mon compte
              </p>
              <p className="text-[12px]" style={{ color: BAI.inkFaint, fontFamily: BAI.fontBody }}>
                Étape {step}/2 — Irréversible
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 transition-colors"
            style={{ color: BAI.inkFaint, borderRadius: 8 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = BAI.bgMuted }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 1 ? (
            <>
              <div className="p-4 space-y-2"
                style={{ background: BAI.errorLight, border: `1px solid #fca5a5`, borderRadius: 10 }}>
                <p className="text-[13px] font-semibold" style={{ color: '#9b1c1c', fontFamily: BAI.fontBody }}>
                  Vous êtes sur le point de supprimer définitivement votre compte.
                </p>
                <p className="text-[12px]" style={{ color: '#b91c1c', fontFamily: BAI.fontBody }}>
                  Cette action supprimera immédiatement et de façon permanente :
                </p>
                <ul className="text-[12px] space-y-1 mt-1" style={{ color: '#b91c1c', fontFamily: BAI.fontBody }}>
                  {['Votre profil et informations personnelles',
                    'Tous vos documents déposés',
                    'Votre historique de candidatures',
                    'Vos messages et conversations',
                    'Vos contrats en cours'].map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-current flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 flex items-start gap-2"
                style={{ background: BAI.warningLight, border: `1px solid #fde68a`, borderRadius: 10 }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                <p className="text-[12px]" style={{ color: BAI.warning, fontFamily: BAI.fontBody }}>
                  Conformément à l'article 17 du RGPD, certaines données peuvent être conservées
                  jusqu'à 3 ans pour répondre à des obligations légales (litiges en cours, obligations fiscales).
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 text-[13px] font-medium transition-colors"
                  style={{
                    background: BAI.bgMuted, border: `1px solid ${BAI.border}`, color: BAI.inkMid,
                    borderRadius: 8, cursor: 'pointer', fontFamily: BAI.fontBody,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = BAI.borderStrong }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = BAI.bgMuted }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 text-[13px] font-semibold text-white transition-colors"
                  style={{ background: '#9b1c1c', borderRadius: 8, cursor: 'pointer', border: 'none', fontFamily: BAI.fontBody }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  Je comprends, continuer
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[13px]" style={{ color: BAI.inkMid, fontFamily: BAI.fontBody }}>
                Pour confirmer, saisissez votre adresse e-mail :
                <span className="font-semibold" style={{ color: BAI.ink }}> {user?.email}</span>
              </p>
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="Votre adresse e-mail"
                className="w-full px-4 py-2.5 text-[13px] outline-none transition-all"
                style={{
                  background: BAI.bgInput,
                  border: `1px solid ${inputEmail && !emailMatch ? '#fca5a5' : BAI.border}`,
                  borderRadius: 8,
                  color: BAI.ink,
                  fontFamily: BAI.fontBody,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = emailMatch ? BAI.tenant : '#fca5a5'
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${emailMatch ? BAI.tenantLight : BAI.errorLight}`
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = BAI.border
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              {inputEmail && !emailMatch && (
                <p className="text-[11px]" style={{ color: '#9b1c1c', fontFamily: BAI.fontBody }}>
                  L'adresse ne correspond pas.
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 text-[13px] font-medium transition-colors"
                  style={{
                    background: BAI.bgMuted, border: `1px solid ${BAI.border}`, color: BAI.inkMid,
                    borderRadius: 8, cursor: 'pointer', fontFamily: BAI.fontBody,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = BAI.borderStrong }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = BAI.bgMuted }}
                >
                  Retour
                </button>
                <button
                  onClick={() => onConfirm(inputEmail)}
                  disabled={!emailMatch || loading}
                  className="flex-1 py-2.5 text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#9b1c1c', borderRadius: 8, cursor: 'pointer', border: 'none', fontFamily: BAI.fontBody }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Supprimer définitivement
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function PrivacyCenter() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [accessLogs, setAccessLogs]     = useState<DossierAccessLog[]>([])
  const [logsLoading, setLogsLoading]   = useState(true)
  const [exporting, setExporting]       = useState(false)
  const [showDelete, setShowDelete]     = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [showAllLogs, setShowAllLogs]   = useState(false)

  useEffect(() => {
    privacyApi.getAccessLog()
      .then(setAccessLogs)
      .catch(() => toast.error("Impossible de charger le journal d'accès"))
      .finally(() => setLogsLoading(false))
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      await privacyApi.exportData()
      toast.success('Export téléchargé avec succès')
    } catch {
      toast.error('Erreur lors de l\'export')
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async (email: string) => {
    setDeleting(true)
    try {
      await privacyApi.deleteAccount(email)
      toast.success('Compte supprimé. À bientôt.')
      await logout()
      navigate('/')
    } catch {
      toast.error('Erreur lors de la suppression du compte')
    } finally {
      setDeleting(false)
    }
  }

  const visibleLogs = showAllLogs ? accessLogs : accessLogs.slice(0, 5)

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}>
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

          {/* Page header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkFaint,
              marginBottom: 6,
            }}>
              RGPD &amp; Confidentialité
            </p>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-11 h-11 flex items-center justify-center flex-shrink-0"
                style={{ background: BAI.tenantLight, borderRadius: 12, border: `1px solid ${BAI.tenantBorder}` }}>
                <ShieldCheck className="w-5 h-5" style={{ color: BAI.tenant }} />
              </div>
              <div>
                <h1 style={{
                  fontFamily: BAI.fontDisplay, fontWeight: 700, fontStyle: 'italic',
                  fontSize: 36, color: BAI.ink, lineHeight: 1.1,
                }}>
                  Mes données &amp; RGPD
                </h1>
                <p style={{ color: BAI.inkMid, fontSize: 14, fontFamily: BAI.fontBody }}>
                  Contrôlez vos données personnelles — droits d'accès, portabilité et effacement
                </p>
              </div>
            </div>
          </motion.div>

          {/* Info banner — tenant green left-border */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="p-5"
            style={{
              background: BAI.tenantLight,
              borderLeft: `3px solid ${BAI.tenant}`,
              borderRadius: '0 12px 12px 0',
              border: `1px solid ${BAI.tenantBorder}`,
              borderLeftWidth: 3,
              borderLeftColor: BAI.tenant,
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Lock,        color: BAI.tenant,    label: 'Chiffrement TLS',   desc: 'Toutes vos données sont chiffrées en transit et au repos.' },
                { icon: Clock,       color: '#2e7d32',   label: 'Suppression auto',  desc: 'Vos documents sont supprimés automatiquement à l\'échéance.' },
                { icon: ShieldCheck, color: BAI.inkMid,    label: 'Conformité RGPD',   desc: 'Droit d\'accès, rectification, portabilité et effacement.' },
              ].map(({ icon: Icon, color, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18`, borderRadius: 8 }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: BAI.ink, fontFamily: BAI.fontBody }}>{label}</p>
                    <p className="text-[11px] leading-snug" style={{ color: BAI.inkMid, fontFamily: BAI.fontBody }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Section: Télécharger mes données */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <SectionCard>
              <div className="flex items-start gap-4 p-5">
                <div className="w-11 h-11 flex items-center justify-center flex-shrink-0"
                  style={{ background: BAI.tenantLight, borderRadius: 12 }}>
                  <Download className="w-5 h-5" style={{ color: BAI.tenant }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-[15px] font-bold" style={{ color: BAI.ink, fontFamily: BAI.fontBody }}>
                        Télécharger mes données
                      </h2>
                      <p className="text-[12px] mt-0.5" style={{ color: BAI.inkMid, fontFamily: BAI.fontBody }}>
                        Recevez un fichier JSON contenant toutes vos données personnelles (profil, documents, candidatures, contrats…)
                      </p>
                      <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: BAI.tenantLight, color: BAI.tenant, borderRadius: 20, border: `1px solid ${BAI.tenantBorder}` }}>
                        <FileText className="w-3 h-3" />
                        Art. 20 RGPD — Droit à la portabilité
                      </span>
                    </div>
                    <button
                      onClick={handleExport}
                      disabled={exporting}
                      className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white transition-all disabled:opacity-60 flex-shrink-0"
                      style={{ background: BAI.tenant, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: BAI.fontBody }}
                      onMouseEnter={(e) => { if (!exporting) e.currentTarget.style.opacity = '0.88' }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                    >
                      {exporting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération…</>
                        : <><Download className="w-4 h-4" /> Télécharger</>}
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* Section: Journal d'accès */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
            <SectionCard>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BAI.border }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center"
                    style={{ background: BAI.bgMuted, borderRadius: 10 }}>
                    <Eye className="w-4 h-4" style={{ color: BAI.inkMid }} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold" style={{ color: BAI.ink, fontFamily: BAI.fontBody }}>
                      Journal d'accès à mon dossier
                    </h2>
                    <p className="text-[12px]" style={{ color: BAI.inkFaint, fontFamily: BAI.fontBody }}>
                      Propriétaires ayant consulté votre dossier locatif
                    </p>
                  </div>
                </div>
                {accessLogs.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5"
                    style={{ background: BAI.bgMuted, color: BAI.inkMid, borderRadius: 20, border: `1px solid ${BAI.border}` }}>
                    {accessLogs.length}
                  </span>
                )}
              </div>

              {/* Body */}
              {logsLoading ? (
                <div className="flex items-center justify-center py-12 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: BAI.inkFaint }} />
                  <span className="text-[13px]" style={{ color: BAI.inkFaint, fontFamily: BAI.fontBody }}>Chargement…</span>
                </div>
              ) : accessLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center"
                    style={{ background: BAI.bgMuted, borderRadius: 12 }}>
                    <Eye className="w-6 h-6" style={{ color: BAI.inkFaint }} />
                  </div>
                  <p className="text-[14px] font-semibold" style={{ color: BAI.inkMid, fontFamily: BAI.fontBody }}>
                    Aucune consultation
                  </p>
                  <p className="text-[12px] max-w-xs leading-relaxed" style={{ color: BAI.inkFaint, fontFamily: BAI.fontBody }}>
                    Votre dossier n'a pas encore été consulté par un propriétaire. Chaque accès sera enregistré ici.
                  </p>
                </div>
              ) : (
                <>
                  {visibleLogs.map((log, i) => (
                    <AccessLogRow key={log.id} log={log} index={i} />
                  ))}
                  {accessLogs.length > 5 && (
                    <div className="px-5 py-3 border-t" style={{ borderColor: BAI.border }}>
                      <button
                        onClick={() => setShowAllLogs(!showAllLogs)}
                        className="text-[12px] font-medium flex items-center gap-1 transition-colors"
                        style={{ color: BAI.tenant, background: 'none', border: 'none', cursor: 'pointer', fontFamily: BAI.fontBody }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                      >
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAllLogs ? 'rotate-90' : ''}`} />
                        {showAllLogs ? 'Voir moins' : `Voir les ${accessLogs.length - 5} accès précédents`}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Footer info */}
              <div className="px-5 py-3 border-t flex items-start gap-2"
                style={{ borderColor: BAI.border, background: BAI.bgMuted }}>
                <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: BAI.inkFaint }} />
                <p className="text-[11px] leading-relaxed" style={{ color: BAI.inkFaint, fontFamily: BAI.fontBody }}>
                  Seuls les propriétaires ayant reçu une candidature de votre part peuvent accéder à votre dossier.
                  Chaque accès est tracé et conservé 12 mois.
                </p>
              </div>
            </SectionCard>
          </motion.div>

          {/* Section: Informations du compte */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <SectionCard>
              <div className="px-5 py-4 border-b" style={{ borderColor: BAI.border }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center"
                    style={{ background: BAI.bgMuted, borderRadius: 10 }}>
                    <User className="w-4 h-4" style={{ color: BAI.inkMid }} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold" style={{ color: BAI.ink, fontFamily: BAI.fontBody }}>Mon compte</h2>
                    <p className="text-[12px]" style={{ color: BAI.inkFaint, fontFamily: BAI.fontBody }}>Informations enregistrées</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { icon: User, label: 'Nom complet', value: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || '—' },
                  { icon: Mail, label: 'Adresse e-mail', value: user?.email ?? '—' },
                  { icon: CheckCircle2, label: 'E-mail vérifié', value: user?.emailVerified ? 'Oui ✓' : 'Non — vérification requise' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: BAI.inkFaint }} />
                    <span className="text-[12px] flex-shrink-0 w-36" style={{ color: BAI.inkMid, fontFamily: BAI.fontBody }}>{label}</span>
                    <span className="text-[13px] font-medium truncate" style={{ color: BAI.ink, fontFamily: BAI.fontBody }}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-4">
                <button
                  onClick={() => navigate('/profile')}
                  className="text-[12px] font-medium flex items-center gap-1 transition-opacity"
                  style={{ color: BAI.tenant, background: 'none', border: 'none', cursor: 'pointer', fontFamily: BAI.fontBody }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  Modifier mes informations
                </button>
              </div>
            </SectionCard>
          </motion.div>

          {/* Section: Droits RGPD */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
            <SectionCard>
              <div className="px-5 py-4 border-b" style={{ borderColor: BAI.border }}>
                <h2 className="text-[15px] font-bold" style={{ color: BAI.ink, fontFamily: BAI.fontBody }}>Vos droits RGPD</h2>
                <p className="text-[12px]" style={{ color: BAI.inkFaint, fontFamily: BAI.fontBody }}>
                  Conformément au Règlement (UE) 2016/679
                </p>
              </div>
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { art: 'Art. 15', label: 'Droit d\'accès',        desc: 'Accédez à toutes vos données via le téléchargement.' },
                  { art: 'Art. 16', label: 'Droit de rectification', desc: 'Modifiez vos informations depuis votre profil.' },
                  { art: 'Art. 17', label: 'Droit à l\'effacement',  desc: 'Supprimez définitivement votre compte ci-dessous.' },
                  { art: 'Art. 20', label: 'Droit à la portabilité', desc: 'Téléchargez l\'intégralité de vos données en JSON.' },
                ].map(({ art, label, desc }) => (
                  <div key={art} className="p-3 space-y-1"
                    style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 10 }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5"
                        style={{ background: BAI.tenantLight, color: BAI.tenant, borderRadius: 20 }}>
                        {art}
                      </span>
                      <span className="text-[12px] font-semibold" style={{ color: BAI.ink, fontFamily: BAI.fontBody }}>{label}</span>
                    </div>
                    <p className="text-[11px] leading-snug" style={{ color: BAI.inkMid, fontFamily: BAI.fontBody }}>{desc}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-4">
                <a
                  href="mailto:dpo@bailio.fr"
                  className="text-[12px] font-medium flex items-center gap-1.5 transition-opacity"
                  style={{ color: BAI.tenant, fontFamily: BAI.fontBody, textDecoration: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contacter notre DPO — dpo@bailio.fr
                </a>
              </div>
            </SectionCard>
          </motion.div>

          {/* Section: Danger zone */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <SectionCard>
              <div className="px-5 py-4 border-b flex items-center gap-2"
                style={{ borderColor: '#fca5a5', background: BAI.errorLight }}>
                <AlertTriangle className="w-4 h-4" style={{ color: '#9b1c1c' }} />
                <h2 className="text-[14px] font-bold" style={{ color: '#9b1c1c', fontFamily: BAI.fontBody }}>Zone de danger</h2>
              </div>
              <div className="flex items-start justify-between gap-4 p-5 flex-wrap">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                    style={{ background: BAI.errorLight, borderRadius: 10 }}>
                    <Trash2 className="w-5 h-5" style={{ color: '#9b1c1c' }} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold" style={{ color: BAI.ink, fontFamily: BAI.fontBody }}>
                      Supprimer mon compte
                    </h3>
                    <p className="text-[12px] mt-0.5" style={{ color: BAI.inkMid, fontFamily: BAI.fontBody }}>
                      Supprime définitivement votre compte et toutes vos données personnelles.
                      Cette action est <strong>irréversible</strong>.
                    </p>
                    <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 text-[11px]"
                      style={{ background: BAI.errorLight, color: '#9b1c1c', border: `1px solid #fca5a5`, borderRadius: 20 }}>
                      <FileText className="w-3 h-3" />
                      Art. 17 RGPD — Droit à l'effacement
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDelete(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition-all flex-shrink-0"
                  style={{
                    background: BAI.errorLight, border: `1px solid #fca5a5`, color: '#9b1c1c',
                    borderRadius: 8, cursor: 'pointer', fontFamily: BAI.fontBody,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = BAI.errorLight }}
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer mon compte
                </button>
              </div>
            </SectionCard>
          </motion.div>

        </div>
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {showDelete && (
          <DeleteAccountModal
            onClose={() => setShowDelete(false)}
            onConfirm={handleDeleteAccount}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}
