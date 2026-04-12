/**
 * DossierReviewModal — Popup A4 (portrait) de revue du dossier locataire
 *
 * Appelé depuis ApplicationManagement lors du clic "Dossier" sur un candidat.
 * Affiche le profil + les documents groupés par catégorie.
 * Chaque document s'ouvre dans WatermarkedViewer (fetch authentifié + filigrane).
 *
 * Accès autorisé si :
 *  • Le locataire a partagé son dossier (DossierShare actif), OU
 *  • Il existe une candidature active de ce locataire sur un des biens du propriétaire
 *    (backend gère l'autorisation — cf. dossier.controller.ts)
 */
import { useEffect, useState } from 'react'
import {
  X, Shield, User, Briefcase, FileText, Home, Loader2,
  CalendarDays, MapPin, Globe, Mail, Phone, ShieldOff,
  ChevronDown, ChevronRight, Lock,
} from 'lucide-react'
import { dossierService, TenantDossierProfile, TenantDocument } from '../../services/dossier.service'
import { WatermarkedViewer } from './WatermarkedViewer'

// ── Maison tokens ──────────────────────────────────────────────────────────────
const M = {
  bg:          '#fafaf8',
  surface:     '#ffffff',
  muted:       '#f4f2ee',
  ink:         '#0d0c0a',
  inkMid:      '#5a5754',
  inkFaint:    '#9e9b96',
  owner:       '#1a3270',
  ownerLight:  '#eaf0fb',
  ownerBorder: '#b8ccf0',
  border:      '#e4e1db',
  borderMid:   '#ccc9c3',
  caramel:     '#c4976a',
  caramelLight:'#fdf5ec',
  body:        "'DM Sans', system-ui, sans-serif",
  display:     "'Cormorant Garamond', Georgia, serif",
}

// ── Catégories de documents ────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  IDENTITE:  { label: 'Identité',   color: M.owner,    bg: M.ownerLight,  border: M.ownerBorder, icon: <User  style={{ width: 14, height: 14 }} /> },
  EMPLOI:    { label: 'Emploi',     color: '#0369a1',  bg: '#f0f9ff',     border: '#bae6fd',     icon: <Briefcase style={{ width: 14, height: 14 }} /> },
  REVENUS:   { label: 'Revenus',    color: '#1b5e3b',  bg: '#edf7f2',     border: '#9fd4ba',     icon: <FileText  style={{ width: 14, height: 14 }} /> },
  DOMICILE:  { label: 'Domicile',   color: '#92400e',  bg: '#fdf5ec',     border: '#f3c99a',     icon: <Home  style={{ width: 14, height: 14 }} /> },
  GARANTIES: { label: 'Garanties',  color: '#6d28d9',  bg: '#f5f3ff',     border: '#ddd6fe',     icon: <Shield style={{ width: 14, height: 14 }} /> },
}

const DOC_TYPE_LABELS: Record<string, string> = {
  CNI_RECTO: 'CNI recto', CNI_VERSO: 'CNI verso',
  PASSEPORT: 'Passeport', TITRE_SEJOUR: 'Titre de séjour',
  CONTRAT_TRAVAIL: 'Contrat de travail',
  BULLETIN_1: 'Bulletin de salaire 1', BULLETIN_2: 'Bulletin de salaire 2', BULLETIN_3: 'Bulletin de salaire 3',
  AVIS_IMPOSITION: "Avis d'imposition", RIB: 'RIB',
  JUSTIFICATIF_DOMICILE: 'Justificatif de domicile',
  QUITTANCE_LOYER: 'Quittance de loyer',
  VISALE: 'Visa VISALE', CAUTION_SOLIDAIRE: 'Caution solidaire',
  ASSURANCE_LOYER: 'Assurance loyer impayé',
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface DossierReviewModalProps {
  tenantId: string
  tenantName: string
  onClose: () => void
}

// ── Composant document ────────────────────────────────────────────────────────
function DocButton({
  doc,
  onView,
}: {
  doc: TenantDocument
  onView: (doc: TenantDocument) => void
}) {
  const sizeKB = Math.round(doc.fileSize / 1024)
  const label  = DOC_TYPE_LABELS[doc.docType] ?? doc.docType

  return (
    <button
      onClick={() => onView(doc)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 10,
        border: `1px solid ${M.border}`, background: M.surface,
        cursor: 'pointer', width: '100%', textAlign: 'left',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = M.ownerBorder
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,50,112,0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = M.border
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: M.muted, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FileText style={{ width: 16, height: 16, color: M.owner }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: M.ink, margin: 0, fontFamily: M.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </p>
        <p style={{ fontSize: 11, color: M.inkFaint, margin: 0, fontFamily: M.body }}>
          {sizeKB} Ko · filigrané
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <Lock style={{ width: 12, height: 12, color: M.owner }} />
        <span style={{ fontSize: 11, color: M.owner, fontFamily: M.body, fontWeight: 600 }}>Voir</span>
        <ChevronRight style={{ width: 14, height: 14, color: M.inkFaint }} />
      </div>
    </button>
  )
}

// ── Composant section catégorie ───────────────────────────────────────────────
function CategorySection({
  category, docs, onView,
}: {
  category: string
  docs: TenantDocument[]
  onView: (doc: TenantDocument) => void
}) {
  const [open, setOpen] = useState(true)
  const meta = CATEGORY_META[category] ?? {
    label: category, color: M.inkMid, bg: M.muted, border: M.border,
    icon: <FileText style={{ width: 14, height: 14 }} />,
  }

  return (
    <div style={{
      border: `1px solid ${meta.border}`,
      borderRadius: 12, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '10px 14px',
          background: meta.bg, border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: 'rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: meta.color,
        }}>
          {meta.icon}
        </div>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: meta.color, fontFamily: M.body, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {meta.label}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, color: meta.color,
          background: 'rgba(255,255,255,0.7)', padding: '1px 8px', borderRadius: 20,
        }}>
          {docs.length}
        </span>
        {open
          ? <ChevronDown style={{ width: 14, height: 14, color: meta.color, flexShrink: 0 }} />
          : <ChevronRight style={{ width: 14, height: 14, color: meta.color, flexShrink: 0 }} />
        }
      </button>

      {open && (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, background: M.surface }}>
          {docs.map((doc) => (
            <DocButton key={doc.id} doc={doc} onView={onView} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export function DossierReviewModal({ tenantId, tenantName, onClose }: DossierReviewModalProps) {
  const [profile, setProfile]           = useState<TenantDossierProfile | null>(null)
  const [loading, setLoading]           = useState(true)
  const [shareRequired, setShareRequired] = useState(false)
  const [viewerDoc, setViewerDoc]       = useState<TenantDocument | null>(null)

  useEffect(() => {
    dossierService.getTenantDossier(tenantId)
      .then(setProfile)
      .catch((err) => {
        const msg: string = err?.response?.data?.message ?? err?.message ?? ''
        if (msg.includes('SHARE_REQUIRED') || msg.includes('pas partagé')) {
          setShareRequired(true)
        }
      })
      .finally(() => setLoading(false))
  }, [tenantId])

  // Fermeture sur Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !viewerDoc) onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose, viewerDoc])

  const grouped = profile
    ? Object.entries(
        profile.tenantDocuments.reduce<Record<string, TenantDocument[]>>((acc, d) => {
          ;(acc[d.category] ??= []).push(d)
          return acc
        }, {})
      )
    : []

  const composed = (profile?.profileMeta as Record<string, Record<string, unknown>> | null)?._composed
  const fullName = profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : tenantName

  return (
    <>
      {/* WatermarkedViewer (document individuel) */}
      {viewerDoc && (
        <WatermarkedViewer
          fileUrl={`/api/v1/dossier/docs/${viewerDoc.id}/view`}
          fileName={DOC_TYPE_LABELS[viewerDoc.docType] ?? viewerDoc.docType}
          contractRef=""
          tenantName={fullName}
          onClose={() => setViewerDoc(null)}
        />
      )}

      {/* Modal principale */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(13,12,10,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          fontFamily: M.body,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        {/* Conteneur A4 portrait-like */}
        <div
          className="w-full max-w-[820px]"
          style={{
          background: M.bg,
          border: `1px solid ${M.border}`,
          borderRadius: 16,
          boxShadow: '0 16px 56px rgba(13,12,10,0.3)',
          maxHeight: '94vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            background: M.owner,
            padding: '14px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield style={{ width: 18, height: 18, color: '#ffffff' }} />
              </div>
              <div>
                <p style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, margin: 0 }}>
                  Dossier locataire
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>
                  Accès propriétaire sécurisé · Documents filigrainés
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: 8, background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, cursor: 'pointer', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Bandeau sécurité */}
          <div style={{
            background: M.ownerLight,
            borderBottom: `1px solid ${M.ownerBorder}`,
            padding: '6px 20px',
            display: 'flex', alignItems: 'center', gap: 8,
            flexShrink: 0,
          }}>
            <Lock style={{ width: 12, height: 12, color: M.owner, flexShrink: 0 }} />
            <p style={{ fontSize: 11, color: M.owner, margin: 0 }}>
              Consultation uniquement — téléchargement et impression bloqués · Accès tracé
            </p>
          </div>

          {/* Corps scrollable */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 }}>
                <Loader2 style={{ width: 28, height: 28, color: M.owner }} className="animate-spin" />
                <p style={{ fontSize: 13, color: M.inkFaint }}>Chargement du dossier…</p>
              </div>

            ) : shareRequired ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 16, textAlign: 'center',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: M.muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ShieldOff style={{ width: 28, height: 28, color: M.inkFaint }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: M.ink }}>Dossier non encore partagé</p>
                <p style={{ fontSize: 13, color: M.inkMid, maxWidth: 380 }}>
                  Le locataire n'a pas encore partagé son dossier avec vous.
                  Il sera accessible automatiquement une fois la candidature traitée.
                </p>
              </div>

            ) : profile ? (
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]" style={{ gap: 20 }}>

                {/* Colonne gauche — Profil */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Avatar + identité */}
                  <div style={{
                    background: M.surface, border: `1px solid ${M.border}`, borderRadius: 12, padding: 16,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: M.owner, color: '#ffffff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: M.display, fontWeight: 700, fontSize: 18, fontStyle: 'italic',
                      }}>
                        {(profile.firstName?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: M.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fullName || 'Locataire'}
                        </p>
                        <p style={{ fontSize: 11, color: M.inkFaint, margin: 0 }}>Candidat</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {profile.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: M.inkMid }}>
                          <Mail style={{ width: 13, height: 13, color: M.inkFaint, flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</span>
                        </div>
                      )}
                      {profile.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: M.inkMid }}>
                          <Phone style={{ width: 13, height: 13, color: M.inkFaint, flexShrink: 0 }} />
                          {profile.phone}
                        </div>
                      )}
                      {profile.birthDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: M.inkMid }}>
                          <CalendarDays style={{ width: 13, height: 13, color: M.inkFaint, flexShrink: 0 }} />
                          {new Date(profile.birthDate).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                      {profile.birthCity && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: M.inkMid }}>
                          <MapPin style={{ width: 13, height: 13, color: M.inkFaint, flexShrink: 0 }} />
                          {profile.birthCity}
                        </div>
                      )}
                      {profile.nationality && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: M.inkMid }}>
                          <Globe style={{ width: 13, height: 13, color: M.inkFaint, flexShrink: 0 }} />
                          {profile.nationality}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Situation professionnelle */}
                  {!!(composed?.employerName || composed?.contractType || composed?.netSalary) && (
                    <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: 12, padding: 16 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: M.inkFaint, marginBottom: 10 }}>
                        Situation pro.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {!!composed.employerName && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: M.inkMid }}>
                            <Briefcase style={{ width: 13, height: 13, color: M.inkFaint, flexShrink: 0 }} />
                            {String(composed.employerName)}
                          </div>
                        )}
                        {!!composed.contractType && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: M.inkMid }}>
                            <FileText style={{ width: 13, height: 13, color: M.inkFaint, flexShrink: 0 }} />
                            {String(composed.contractType)}
                          </div>
                        )}
                        {!!composed.netSalary && (
                          <p style={{ fontSize: 15, fontWeight: 700, color: M.ink, margin: '4px 0 0', fontFamily: M.display }}>
                            {Number(composed.netSalary).toLocaleString('fr-FR')} €/mois
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notice de sécurité */}
                  <div style={{
                    background: M.ownerLight, border: `1px solid ${M.ownerBorder}`,
                    borderRadius: 10, padding: '10px 12px',
                    display: 'flex', gap: 8,
                  }}>
                    <Shield style={{ width: 14, height: 14, color: M.owner, flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: M.owner, margin: 0 }}>
                      Documents intégralement filigrainés. Consultation uniquement.
                    </p>
                  </div>
                </div>

                {/* Colonne droite — Documents */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: M.inkFaint, margin: 0 }}>
                      Documents · {profile.tenantDocuments.length} fichier{profile.tenantDocuments.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {grouped.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: M.surface, border: `1px solid ${M.border}`, borderRadius: 12 }}>
                      <p style={{ fontSize: 13, color: M.inkFaint }}>Aucun document déposé</p>
                    </div>
                  ) : (
                    grouped.map(([cat, docs]) => (
                      <CategorySection
                        key={cat}
                        category={cat}
                        docs={docs}
                        onView={setViewerDoc}
                      />
                    ))
                  )}
                </div>

              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ fontSize: 13, color: '#9b1c1c' }}>Impossible de charger le dossier.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
