/**
 * TenantProfile — Owner full-page view of a tenant's dossier.
 * Accessible at /owner/tenants/:tenantId
 * Shows profile info + documents grouped by category (watermarked).
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Briefcase, FileText, Home, Shield,
  Loader2, ExternalLink, CalendarDays, MapPin, Globe,
  Mail, ShieldOff, Phone,
} from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { dossierService, TenantDossierProfile, TenantDocument } from '../../services/dossier.service'
import { apiClient as api } from '../../services/api.service'
import toast from 'react-hot-toast'
import { BAI } from '../../constants/bailio-tokens'

// ── Maison tokens ─────────────────────────────────────────────────────────────


// ── Category config ───────────────────────────────────────────────────────────

interface CategoryMeta { label: string; icon: React.ReactNode; color: string; bg: string }

const CATEGORY_META: Record<string, CategoryMeta> = {
  IDENTITE:  { label: 'Identité',   icon: <User      className="w-4 h-4" />, color: '#1a1a2e', bg: '#eaf0fb' },
  EMPLOI:    { label: 'Emploi',     icon: <Briefcase className="w-4 h-4" />, color: '#0ea5e9', bg: '#f0f9ff' },
  REVENUS:   { label: 'Revenus',    icon: <FileText  className="w-4 h-4" />, color: '#10b981', bg: '#ecfdf5' },
  DOMICILE:  { label: 'Domicile',   icon: <Home      className="w-4 h-4" />, color: '#f59e0b', bg: '#fffbeb' },
  GARANTIES: { label: 'Garanties',  icon: <Shield    className="w-4 h-4" />, color: '#8b5cf6', bg: '#f5f3ff' },
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

// ── Doc item (authenticated blob fetch) ───────────────────────────────────────

function DocItem({ doc }: { doc: TenantDocument }) {
  const [loading, setLoading] = useState(false)
  const sizeKB = Math.round(doc.fileSize / 1024)

  async function open() {
    if (loading) return
    setLoading(true)
    try {
      const resp = await api.get(`/dossier/docs/${doc.id}/view`, { responseType: 'blob' })
      const blobUrl = URL.createObjectURL(resp.data)
      window.open(blobUrl, '_blank')
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
    } catch {
      toast.error("Impossible d'ouvrir ce document")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={open}
      disabled={loading}
      className="w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all group"
      style={{ border: `1px solid ${BAI.border}`, background: BAI.bgSurface }}
      onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.borderColor = BAI.borderStrong; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' } }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = BAI.border; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: BAI.bgMuted }}>
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: BAI.owner }} />
          : <FileText className="w-4 h-4" style={{ color: BAI.owner }} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate" style={{ color: BAI.ink }}>
          {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
        </p>
        <p className="text-[11px]" style={{ color: BAI.inkFaint }}>
          {doc.fileName} · {sizeKB} KB · filigrané
        </p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: BAI.owner }} />
    </button>
  )
}

// ── Category section ──────────────────────────────────────────────────────────

function CategorySection({ category, docs }: { category: string; docs: TenantDocument[] }) {
  const meta = CATEGORY_META[category] ?? { label: category, icon: <FileText className="w-4 h-4" />, color: BAI.inkMid, bg: BAI.bgMuted }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: meta.bg, color: meta.color }}>
          {meta.icon}
        </div>
        <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: BAI.inkMid }}>
          {meta.label}
        </span>
        <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: meta.bg, color: meta.color }}>
          {docs.length}
        </span>
      </div>
      <div className="space-y-2 pl-9">
        {docs.map((doc) => <DocItem key={doc.id} doc={doc} />)}
      </div>
    </div>
  )
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px]" style={{ color: BAI.inkMid }}>
      <span style={{ color: BAI.inkFaint }}>{icon}</span>
      {value}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TenantProfile() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<TenantDossierProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareRequired, setShareRequired] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    dossierService.getTenantDossier(tenantId)
      .then(setProfile)
      .catch((err) => {
        const msg: string = err?.response?.data?.message ?? err?.message ?? ''
        if (msg.includes('SHARE_REQUIRED') || msg.includes('pas partagé')) {
          setShareRequired(true)
        } else {
          toast.error('Impossible de charger le dossier')
        }
      })
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
  const fullName = profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : ''

  return (
    <Layout>
      <div className="min-h-screen p-6 lg:p-8" style={{ background: BAI.bgBase, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="max-w-5xl mx-auto">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium mb-6 transition-opacity hover:opacity-70"
            style={{ color: BAI.inkMid }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>

          {/* Page header */}
          <div className="mb-8">
            <p className="uppercase tracking-widest mb-1" style={{ fontSize: 10, color: BAI.inkFaint, letterSpacing: '0.12em' }}>
              Propriétaire · Dossier locataire
            </p>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 700,
              fontStyle: 'italic',
              fontSize: 40,
              color: BAI.ink,
              lineHeight: 1.1,
              margin: 0,
            }}>
              {loading ? 'Chargement…' : fullName || 'Locataire'}
            </h1>
            {profile?.email && (
              <p className="mt-1.5" style={{ fontSize: 14, color: BAI.inkMid }}>{profile.email}</p>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3"
              style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12 }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: BAI.owner }} />
              <p className="text-sm" style={{ color: BAI.inkFaint }}>Chargement du dossier…</p>
            </div>
          ) : shareRequired ? (
            <div className="rounded-2xl p-12 flex flex-col items-center text-center gap-4"
              style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}` }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: BAI.bgMuted }}>
                <ShieldOff className="w-8 h-8" style={{ color: BAI.inkFaint }} />
              </div>
              <div>
                <p className="font-semibold text-base mb-2" style={{ color: BAI.ink }}>
                  Dossier non encore partagé
                </p>
                <p className="text-sm max-w-sm mx-auto" style={{ color: BAI.inkMid }}>
                  Le locataire n'a pas encore partagé son dossier avec vous.
                  Il sera automatiquement partagé lorsqu'il vous enverra un message ou postera une candidature.
                </p>
              </div>
            </div>
          ) : profile ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left — Profile info */}
              <div className="space-y-4">
                {/* Avatar + name card */}
                <div className="rounded-2xl p-5" style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ background: BAI.owner }}>
                      {(profile.firstName?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-base" style={{ color: BAI.ink }}>{fullName || 'Locataire'}</p>
                      {profile.email && (
                        <p className="text-[12px] truncate" style={{ color: BAI.inkFaint }}>{profile.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {profile.email && <InfoRow icon={<Mail className="w-3.5 h-3.5" />} value={profile.email} />}
                    {profile.phone && <InfoRow icon={<Phone className="w-3.5 h-3.5" />} value={profile.phone} />}
                    {profile.birthDate && (
                      <InfoRow icon={<CalendarDays className="w-3.5 h-3.5" />}
                        value={new Date(profile.birthDate).toLocaleDateString('fr-FR')} />
                    )}
                    {profile.birthCity && <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} value={profile.birthCity} />}
                    {profile.nationality && <InfoRow icon={<Globe className="w-3.5 h-3.5" />} value={profile.nationality} />}
                  </div>
                </div>

                {/* Employment info */}
                {!!(composed?.employerName || composed?.contractType || composed?.netSalary) && (
                  <div className="rounded-2xl p-5" style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}` }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: BAI.inkFaint }}>
                      Situation professionnelle
                    </p>
                    <div className="space-y-2.5">
                      {!!composed.employerName && (
                        <InfoRow icon={<Briefcase className="w-3.5 h-3.5" />} value={String(composed.employerName)} />
                      )}
                      {!!composed.contractType && (
                        <InfoRow icon={<FileText className="w-3.5 h-3.5" />} value={String(composed.contractType)} />
                      )}
                      {!!composed.netSalary && (
                        <div className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: BAI.ink }}>
                          <span className="text-[11px]" style={{ color: BAI.inkFaint }}>€</span>
                          {Number(composed.netSalary).toLocaleString('fr-FR')} €/mois net
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Access notice */}
                <div className="rounded-2xl p-4 flex gap-3"
                  style={{ background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}` }}>
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: BAI.owner }} />
                  <p className="text-[12px]" style={{ color: BAI.owner }}>
                    Documents intégralement filigrainés. Consultation uniquement — téléchargement impossible.
                    Accès valable 30 jours depuis le partage.
                  </p>
                </div>
              </div>

              {/* Right — Documents */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl p-5" style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}` }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-4" style={{ color: BAI.inkFaint }}>
                    Documents · {profile.tenantDocuments.length} fichier{profile.tenantDocuments.length !== 1 ? 's' : ''}
                  </p>
                  {grouped.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-sm" style={{ color: BAI.inkFaint }}>Aucun document déposé</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {grouped.map(([cat, docs]) => (
                        <CategorySection key={cat} category={cat} docs={docs} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="rounded-2xl p-6 text-center" style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}` }}>
              <p className="text-sm" style={{ color: '#9b1c1c' }}>Impossible de charger le dossier.</p>
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}
