/**
 * TenantDossierModal — Owner read-only view of a tenant's dossier.
 * Shows profile info + documents grouped by category with file links.
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, Briefcase, FileText, Home, Shield, Loader2,
  ExternalLink, CalendarDays, MapPin, Globe, Phone, Mail,
} from 'lucide-react'
import { dossierService, TenantDossierProfile, TenantDocument } from '../../services/dossierService'
import toast from 'react-hot-toast'

const SERVER_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ?? 'http://localhost:3000'

// ── Category config ─────────────────────────────────────────────────────────

interface CategoryMeta { label: string; icon: React.ReactNode; color: string; bg: string }

const CATEGORY_META: Record<string, CategoryMeta> = {
  IDENTITE:   { label: 'Identité',    icon: <User      className="w-4 h-4" />, color: '#6366f1', bg: '#eef2ff' },
  EMPLOI:     { label: 'Emploi',      icon: <Briefcase className="w-4 h-4" />, color: '#0ea5e9', bg: '#f0f9ff' },
  REVENUS:    { label: 'Revenus',     icon: <FileText  className="w-4 h-4" />, color: '#10b981', bg: '#ecfdf5' },
  DOMICILE:   { label: 'Domicile',    icon: <Home      className="w-4 h-4" />, color: '#f59e0b', bg: '#fffbeb' },
  GARANTIES:  { label: 'Garanties',   icon: <Shield    className="w-4 h-4" />, color: '#8b5cf6', bg: '#f5f3ff' },
}

const DOC_TYPE_LABELS: Record<string, string> = {
  CNI_RECTO: 'CNI recto', CNI_VERSO: 'CNI verso',
  PASSEPORT: 'Passeport', TITRE_SEJOUR: 'Titre de séjour',
  CONTRAT_TRAVAIL: 'Contrat de travail', BULLETIN_1: 'Bulletin de salaire 1',
  BULLETIN_2: 'Bulletin de salaire 2', BULLETIN_3: 'Bulletin de salaire 3',
  AVIS_IMPOSITION: "Avis d'imposition", RIB: 'RIB',
  JUSTIFICATIF_DOMICILE: 'Justificatif de domicile', QUITTANCE_LOYER: 'Quittance de loyer',
  VISALE: 'Visa VISALE', CAUTION_SOLIDAIRE: 'Caution solidaire',
  ASSURANCE_LOYER: 'Assurance loyer impayé',
}

// ── Doc file link ────────────────────────────────────────────────────────────

function DocItem({ doc }: { doc: TenantDocument }) {
  const url = doc.fileUrl.startsWith('http') ? doc.fileUrl : `${SERVER_BASE}${doc.fileUrl}`
  const isImage = doc.mimeType.startsWith('image/')
  const sizeKB = Math.round(doc.fileSize / 1024)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 rounded-xl p-3 transition-all group"
      style={{ border: '1px solid #e2e8f0', background: '#ffffff' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: isImage ? '#eff6ff' : '#fef2f2' }}
      >
        <FileText className="w-4 h-4" style={{ color: isImage ? '#3b82f6' : '#ef4444' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate" style={{ color: '#0f172a' }}>
          {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
        </p>
        <p className="text-[11px]" style={{ color: '#94a3b8' }}>
          {doc.fileName} · {sizeKB} KB
        </p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        style={{ color: '#6366f1' }} />
    </a>
  )
}

// ── Category section ─────────────────────────────────────────────────────────

function CategorySection({ category, docs }: { category: string; docs: TenantDocument[] }) {
  const meta = CATEGORY_META[category] ?? { label: category, icon: <FileText className="w-4 h-4" />, color: '#64748b', bg: '#f8fafc' }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.icon}
        </div>
        <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: '#475569' }}>
          {meta.label}
        </span>
        <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: meta.bg, color: meta.color }}
        >
          {docs.length}
        </span>
      </div>
      <div className="space-y-2 pl-8">
        {docs.map((doc) => <DocItem key={doc.id} doc={doc} />)}
      </div>
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────

interface TenantDossierModalProps {
  tenantId: string
  tenantName?: string
  onClose: () => void
}

export function TenantDossierModal({ tenantId, tenantName, onClose }: TenantDossierModalProps) {
  const [profile, setProfile] = useState<TenantDossierProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dossierService.getTenantDossier(tenantId)
      .then(setProfile)
      .catch(() => toast.error('Impossible de charger le dossier'))
      .finally(() => setLoading(false))
  }, [tenantId])

  const grouped = profile
    ? Object.entries(
        profile.tenantDocuments.reduce<Record<string, TenantDocument[]>>((acc, d) => {
          ;(acc[d.category] ??= []).push(d)
          return acc
        }, {})
      )
    : []

  const composed = (profile?.profileMeta as Record<string, Record<string, unknown>> | null)?._composed

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: '#f8fafc',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            maxHeight: '90vh',
          }}
          initial={{ scale: 0.95, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 16 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
            style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{ background: '#3b82f6' }}
              >
                {(profile?.firstName?.[0] ?? tenantName?.[0] ?? '?').toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[15px]" style={{ color: '#0f172a' }}>
                  {profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || tenantName || 'Locataire'
                    : tenantName || 'Dossier locataire'}
                </p>
                {profile?.email && (
                  <p className="text-[12px]" style={{ color: '#94a3b8' }}>{profile.email}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl transition-colors"
              style={{ color: '#94a3b8' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b82f6' }} />
                <p className="text-sm" style={{ color: '#94a3b8' }}>Chargement du dossier…</p>
              </div>
            ) : profile ? (
              <>
                {/* Profile info card */}
                <div className="rounded-xl p-4 space-y-2"
                  style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: '#94a3b8' }}>
                    Informations personnelles
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                    {profile.phone && (
                      <div className="flex items-center gap-1.5" style={{ color: '#475569' }}>
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                        {profile.phone}
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center gap-1.5" style={{ color: '#475569' }}>
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                        <span className="truncate">{profile.email}</span>
                      </div>
                    )}
                    {profile.birthDate && (
                      <div className="flex items-center gap-1.5" style={{ color: '#475569' }}>
                        <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                        {new Date(profile.birthDate).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    {profile.birthCity && (
                      <div className="flex items-center gap-1.5" style={{ color: '#475569' }}>
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                        {profile.birthCity}
                      </div>
                    )}
                    {profile.nationality && (
                      <div className="flex items-center gap-1.5" style={{ color: '#475569' }}>
                        <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                        {profile.nationality}
                      </div>
                    )}
                    {!!composed?.employerName && (
                      <div className="flex items-center gap-1.5" style={{ color: '#475569' }}>
                        <Briefcase className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                        {String(composed.employerName)}
                      </div>
                    )}
                    {!!composed?.contractType && (
                      <div className="flex items-center gap-1.5" style={{ color: '#475569' }}>
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
                        {String(composed.contractType)}
                      </div>
                    )}
                    {!!composed?.netSalary && (
                      <div className="flex items-center gap-1.5 font-semibold" style={{ color: '#0f172a' }}>
                        <span className="text-[11px] w-3.5 text-center flex-shrink-0" style={{ color: '#94a3b8' }}>€</span>
                        {Number(composed.netSalary).toLocaleString('fr-FR')} €/mois net
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents grouped by category */}
                {grouped.length === 0 ? (
                  <div className="rounded-xl p-6 text-center"
                    style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
                  >
                    <p className="text-sm" style={{ color: '#94a3b8' }}>Aucun document déposé</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {grouped.map(([cat, docs]) => (
                      <CategorySection key={cat} category={cat} docs={docs} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl p-6 text-center"
                style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
              >
                <p className="text-sm" style={{ color: '#ef4444' }}>Impossible de charger le dossier.</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
