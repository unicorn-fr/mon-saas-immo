import { useState, useEffect, useRef, useCallback, useId } from 'react'
import {
  User, Briefcase, TrendingUp, Home, Shield,
  Upload, Eye, Trash2, CheckCircle2, Loader2, BookOpen, Star,
  ArrowRight, ArrowLeft, HelpCircle, CreditCard,
  LayoutGrid, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { useAuth } from '../../hooks/useAuth'
import { dossierService, TenantDocument } from '../../services/dossier.service'
import { DocumentViewerModal } from '../../components/document/DocumentViewerModal'
import toast from 'react-hot-toast'
import { BAI } from '../../constants/bailio-tokens'

// ── Design tokens ──────────────────────────────────────────────────────────────

// ── Types ──────────────────────────────────────────────────────────────────────
interface Slot {
  docType:  string
  label:    string
  required: boolean
  help:     string
}
interface Category {
  id:    string
  label: string
  hint:  string
  icon:  React.ElementType
  slots: Slot[]
}

// ── Stepper steps ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'identity',  label: 'Identité',   icon: User,       description: 'Vos informations personnelles' },
  { id: 'IDENTITE',  label: 'Pièce d\'ID', icon: CreditCard, description: 'CNI ou passeport' },
  { id: 'EMPLOI',    label: 'Emploi',     icon: Briefcase,  description: 'Contrat de travail' },
  { id: 'REVENUS',   label: 'Revenus',    icon: TrendingUp, description: 'Bulletins de salaire' },
  { id: 'DOMICILE',  label: 'Domicile',   icon: Home,       description: 'Justificatif d\'adresse' },
  { id: 'GARANTIES', label: 'Garant',     icon: Shield,     description: 'Documents garant (optionnel)' },
] as const

const STORAGE_KEY = 'dossier_stepper_v1'
const GUIDE_DONE_KEY = 'dossier_guide_done_v1'
const TOTAL_STEPS = STEPS.length // 6

// ── Document categories with per-slot help text ────────────────────────────────
const CATEGORIES: Category[] = [
  {
    id: 'IDENTITE', label: 'Pièce d\'identité', icon: CreditCard,
    hint: 'Carte nationale d\'identité ou passeport en cours de validité.',
    slots: [
      {
        docType: 'CNI_RECTO', label: 'CNI recto', required: true,
        help: 'Photographiez le recto de votre CNI en entier (4 coins visibles, texte lisible, sans reflets). Formats acceptés : JPG, PNG ou PDF.',
      },
      {
        docType: 'CNI_VERSO', label: 'CNI verso', required: false,
        help: 'Le verso n\'est pas toujours exigé mais renforce la crédibilité du dossier en confirmant la date d\'expiration et l\'adresse MRZ.',
      },
      {
        docType: 'PASSEPORT', label: 'Passeport', required: false,
        help: 'Page d\'identité principale (avec photo). Utile si votre CNI est expirée ou si vous n\'avez pas encore de CNI française.',
      },
      {
        docType: 'TITRE_SEJOUR', label: 'Titre de séjour', required: false,
        help: 'Titre de séjour en cours de validité. Obligatoire pour les ressortissants hors UE qui ne disposent pas d\'une CNI européenne.',
      },
    ],
  },
  {
    id: 'EMPLOI', label: 'Situation professionnelle', icon: Briefcase,
    hint: 'Contrat de travail ou équivalent prouvant votre activité.',
    slots: [
      {
        docType: 'CONTRAT_TRAVAIL', label: 'Contrat de travail', required: true,
        help: 'CDI, CDD ou contrat d\'apprentissage signé par les deux parties. C\'est le document le plus examiné — il doit mentionner le poste, l\'employeur et le salaire.',
      },
      {
        docType: 'PROMESSE_EMBAUCHE', label: 'Promesse d\'embauche', required: false,
        help: 'Valide si vous n\'avez pas encore commencé votre poste. Doit mentionner le salaire, la date d\'entrée en fonction et être signée par l\'employeur.',
      },
      {
        docType: 'KBIS_EXTRAIT', label: 'Extrait KBIS (indépendant)', required: false,
        help: 'Extrait Kbis de moins de 3 mois pour les auto-entrepreneurs, gérants ou dirigeants. Téléchargeable gratuitement sur infogreffe.fr.',
      },
      {
        docType: 'JUSTIFICATIF_RETRAITE', label: 'Justificatif de retraite', required: false,
        help: 'Notification de pension ou dernier avis de paiement de la CARSAT / Agirc-Arrco. Prouve la stabilité et le montant mensuel des revenus.',
      },
    ],
  },
  {
    id: 'REVENUS', label: 'Revenus', icon: TrendingUp,
    hint: 'Trois derniers bulletins de salaire + dernier avis d\'imposition.',
    slots: [
      {
        docType: 'BULLETIN_PAIE_1', label: 'Bulletin de salaire M-1', required: true,
        help: 'Dernier bulletin de paie (mois précédent). Le nom de l\'employeur, la période de paie et le net imposable doivent être parfaitement lisibles.',
      },
      {
        docType: 'BULLETIN_PAIE_2', label: 'Bulletin de salaire M-2', required: true,
        help: 'Avant-dernier bulletin. Les 3 fiches doivent idéalement provenir du même employeur, sauf si vous avez changé de poste récemment (indiquez-le dans votre lettre de motivation).',
      },
      {
        docType: 'BULLETIN_PAIE_3', label: 'Bulletin de salaire M-3', required: true,
        help: 'Bulletin M-3. Si vous êtes en CDD récent, 1 ou 2 bulletins suffisent accompagnés de la promesse d\'embauche ou du contrat signé.',
      },
      {
        docType: 'AVIS_IMPOSITION', label: 'Avis d\'imposition N-1', required: true,
        help: 'Votre dernier avis d\'imposition annuel. Téléchargeable en 30 secondes sur impots.gouv.fr (Espace particulier > Documents). Il confirme votre revenu fiscal de référence.',
      },
      {
        docType: 'AVIS_IMPOSITION_N2', label: 'Avis d\'imposition N-2', required: false,
        help: 'L\'avis N-2 renforce la stabilité financière perçue, surtout si vos revenus ont fluctué l\'an passé. Fortement recommandé si N-1 était une année atypique.',
      },
    ],
  },
  {
    id: 'DOMICILE', label: 'Justificatif de domicile', icon: Home,
    hint: 'Quittance de loyer, taxe foncière ou facture de moins de 3 mois.',
    slots: [
      {
        docType: 'QUITTANCE_LOYER', label: 'Quittance de loyer', required: false,
        help: 'Les 3 dernières quittances de loyer de votre logement actuel, délivrées par votre propriétaire ou agence. Preuve que vous payez votre loyer régulièrement.',
      },
      {
        docType: 'TAXE_FONCIERE', label: 'Taxe foncière', required: false,
        help: 'Uniquement si vous êtes propriétaire occupant de votre résidence principale. Téléchargeable sur impots.gouv.fr.',
      },
      {
        docType: 'FACTURE_EDF', label: 'Facture énergie / eau', required: false,
        help: 'Facture EDF/Enedis, eau, gaz ou internet de moins de 3 mois, à votre nom et à l\'adresse de votre domicile actuel.',
      },
      {
        docType: 'JUSTIFICATIF_DOMICILE', label: 'Autre justificatif', required: false,
        help: 'Si vous êtes hébergé chez quelqu\'un : attestation d\'hébergement manuscrite signée + copie CNI de l\'hébergeant + sa facture récente à son nom.',
      },
    ],
  },
  {
    id: 'GARANTIES', label: 'Garant', icon: Shield,
    hint: 'Documents du garant (facultatif mais valorisant si revenus < 3× loyer).',
    slots: [
      {
        docType: 'GARANT_CNI', label: 'CNI du garant', required: false,
        help: 'Pièce d\'identité valide du garant. Mêmes exigences que la vôtre : 4 coins visibles, texte lisible.',
      },
      {
        docType: 'GARANT_CONTRAT', label: 'Contrat de travail du garant', required: false,
        help: 'Idéalement un CDI confirmé. Un garant en CDI rassure fortement les propriétaires, même si son salaire n\'est que 2× le loyer.',
      },
      {
        docType: 'GARANT_PAIE', label: 'Bulletins de salaire garant', required: false,
        help: 'Les 3 derniers bulletins de paie du garant. Son revenu net devrait idéalement être ≥ 3× le loyer mensuel charges comprises.',
      },
      {
        docType: 'GARANT_IMPOSITION', label: 'Avis d\'imposition garant', required: false,
        help: 'Dernier avis d\'imposition du garant, téléchargeable sur impots.gouv.fr. Confirme le revenu annuel déclaré.',
      },
      {
        docType: 'LETTRE_GARANT', label: 'Lettre d\'engagement', required: false,
        help: 'Lettre signée par le garant indiquant explicitement son engagement à payer le loyer en cas de défaillance. Très appréciée par les propriétaires.',
      },
    ],
  },
]

// ── Tips ───────────────────────────────────────────────────────────────────────
const TIPS = [
  { icon: Star,     title: 'Complétez au maximum',  body: 'Un dossier complet est traité en priorité. Même sans garant, joindre tous vos justificatifs rassure immédiatement le propriétaire.' },
  { icon: Eye,      title: 'Lisibilité avant tout',  body: 'Scannez en haute résolution ou photographiez à plat, avec un éclairage uniforme. Un document flou ou coupé est souvent refusé sans être lu.' },
  { icon: Shield,   title: 'Un garant augmente vos chances', body: 'Si vos revenus sont < 3× le loyer, joindre un garant solide (parent, employeur, Visale) peut être décisif.' },
  { icon: BookOpen, title: 'Cohérence des données',  body: 'Nom, adresse et revenus doivent être cohérents entre tous vos documents. Les incohérences créent des doutes immédiats.' },
]

// ── HelpTooltip component ──────────────────────────────────────────────────────
function HelpTooltip({ content }: { content: string }) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        type="button"
        aria-label="Aide sur ce document"
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen(o => !o)}
        style={{
          width: 20, height: 20, borderRadius: '50%', border: `1px solid ${BAI.borderStrong}`,
          background: open ? BAI.bgMuted : BAI.bgSurface,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0, flexShrink: 0,
          color: open ? BAI.inkMid : BAI.inkFaint,
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        <HelpCircle style={{ width: 11, height: 11 }} />
      </button>
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
            transform: 'translateX(-50%)',
            width: 260, padding: '10px 12px', borderRadius: 10,
            background: BAI.ink, color: '#ffffff',
            fontSize: 12, fontFamily: BAI.fontBody, lineHeight: 1.55,
            boxShadow: '0 8px 24px rgba(13,12,10,0.25)',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {content}
          {/* Arrow */}
          <div style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
            width: 10, height: 6,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `6px solid ${BAI.ink}`,
          }} />
        </div>
      )}
    </div>
  )
}

// ── DocSlot ────────────────────────────────────────────────────────────────────
function DocSlot({
  slot, doc,
  onUpload, onDelete, onView,
}: {
  slot: Slot
  doc: TenantDocument | undefined
  onUpload: (file: File, docType: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onView: (doc: TenantDocument) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting]   = useState(false)

  const handleFile = async (file: File) => {
    setUploading(true)
    try { await onUpload(file, slot.docType) } finally { setUploading(false) }
  }

  const handleDelete = async () => {
    if (!doc) return
    setDeleting(true)
    try { await onDelete(doc.id) } finally { setDeleting(false) }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      border: `1px solid ${doc ? BAI.tenantBorder : BAI.border}`,
      borderRadius: 10,
      background: doc ? BAI.tenantLight : BAI.bgSurface,
      transition: 'background 0.15s, border-color 0.15s',
    }}>
      {/* Status dot */}
      {doc
        ? <CheckCircle2 style={{ width: 15, height: 15, color: BAI.tenant, flexShrink: 0 }} />
        : <div style={{
            width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
            border: `2px solid ${slot.required ? BAI.caramel : BAI.borderStrong}`,
          }} />
      }

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontFamily: BAI.fontBody, margin: 0,
          color: doc ? BAI.tenant : BAI.ink,
          fontWeight: doc ? 600 : slot.required ? 500 : 400,
        }}>
          {slot.label}
          {slot.required && !doc && (
            <span style={{ marginLeft: 5, fontSize: 10, color: BAI.caramel, fontWeight: 500 }}>requis</span>
          )}
        </p>
        {doc && (
          <p style={{
            fontSize: 11, color: BAI.inkFaint, fontFamily: BAI.fontBody,
            margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240,
          }}>
            {doc.fileName}
          </p>
        )}
      </div>

      {/* Help */}
      <HelpTooltip content={slot.help} />

      {/* Actions */}
      {doc ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <button
            onClick={() => onView(doc)}
            style={{
              padding: '4px 10px', borderRadius: 7, border: `1px solid ${BAI.tenantBorder}`,
              background: BAI.bgSurface, color: BAI.tenant,
              fontSize: 12, fontFamily: BAI.fontBody, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Eye style={{ width: 12, height: 12 }} /> Voir
          </button>
          <button
            onClick={handleDelete} disabled={deleting}
            style={{
              padding: '4px 8px', borderRadius: 7, border: `1px solid ${BAI.border}`,
              background: BAI.bgSurface, color: deleting ? BAI.inkFaint : '#9b1c1c',
              fontSize: 12, cursor: deleting ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            {deleting
              ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
              : <Trash2 style={{ width: 12, height: 12 }} />
            }
          </button>
        </div>
      ) : (
        <>
          <input
            ref={inputRef} type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) { handleFile(f); e.target.value = '' }
            }}
          />
          <button
            onClick={() => inputRef.current?.click()} disabled={uploading}
            style={{
              padding: '4px 12px', borderRadius: 7, border: `1px solid ${BAI.borderStrong}`,
              background: uploading ? BAI.bgMuted : BAI.bgSurface,
              color: uploading ? BAI.inkFaint : BAI.inkMid,
              fontSize: 12, fontFamily: BAI.fontBody, cursor: uploading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
            }}
          >
            {uploading
              ? <><Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />Envoi…</>
              : <><Upload style={{ width: 11, height: 11 }} />Ajouter</>
            }
          </button>
        </>
      )}
    </div>
  )
}

// ── CategoryAccordion (used in overview) ───────────────────────────────────────
function CategoryAccordion({
  cat, documents, onUpload, onDelete, onView,
}: {
  cat: Category
  documents: TenantDocument[]
  onUpload: (file: File, category: string, docType: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onView: (doc: TenantDocument) => void
}) {
  const [open, setOpen] = useState(true)
  const CatIcon = cat.icon
  const filled   = cat.slots.filter(s => documents.find(d => d.docType === s.docType)).length
  const total    = cat.slots.length
  const allDone  = filled === total
  const hasDocs  = filled > 0

  return (
    <div style={{
      border: `1px solid ${BAI.border}`, borderRadius: 12,
      overflow: 'hidden', background: BAI.bgSurface, boxShadow: BAI.shadowMd,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: hasDocs ? BAI.tenantLight : BAI.bgMuted,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <CatIcon style={{ width: 16, height: 16, color: hasDocs ? BAI.tenant : BAI.inkFaint }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: BAI.fontBody, color: BAI.ink }}>
              {cat.label}
            </p>
            <p style={{ margin: 0, fontSize: 11, fontFamily: BAI.fontBody, color: BAI.inkFaint, marginTop: 1 }}>
              {filled}/{total} document{total > 1 ? 's' : ''} · {cat.hint}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {allDone && (
            <span style={{
              fontSize: 11, fontFamily: BAI.fontBody, color: BAI.tenant, fontWeight: 600,
              background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
              borderRadius: 20, padding: '2px 8px',
            }}>
              Complet
            </span>
          )}
          {open
            ? <ChevronUp style={{ width: 16, height: 16, color: BAI.inkFaint }} />
            : <ChevronDown style={{ width: 16, height: 16, color: BAI.inkFaint }} />
          }
        </div>
      </button>
      {open && (
        <div style={{
          padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8,
          borderTop: `1px solid ${BAI.border}`,
        }}>
          <div style={{ height: 8 }} />
          {cat.slots.map(slot => (
            <DocSlot
              key={slot.docType}
              slot={slot}
              doc={documents.find(d => d.docType === slot.docType)}
              onUpload={(file, docType) => onUpload(file, cat.id, docType)}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Stepper header ─────────────────────────────────────────────────────────────
function StepperHeader({ current }: { current: number }) {
  const pct = Math.round((current / TOTAL_STEPS) * 100)

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Mobile: compact label */}
      <div className="sm:hidden" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: BAI.inkFaint, fontFamily: BAI.fontBody, margin: '0 0 2px' }}>
          Étape {current + 1} sur {TOTAL_STEPS}
        </p>
        <p style={{ fontSize: 15, fontWeight: 700, fontFamily: BAI.fontBody, color: BAI.ink, margin: 0 }}>
          {STEPS[current]?.label ?? 'Récapitulatif'}
        </p>
      </div>

      {/* Desktop: step pills */}
      <div className="hidden sm:flex" style={{ alignItems: 'flex-start', gap: 0, marginBottom: 16 }}>
        {STEPS.map((step, i) => {
          const done   = i < current
          const active = i === current
          const StepIcon = step.icon
          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: done ? BAI.tenant : active ? BAI.tenantLight : BAI.bgMuted,
                  border: `2px solid ${done ? BAI.tenant : active ? BAI.tenant : BAI.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.25s',
                }}>
                  {done
                    ? <CheckCircle2 style={{ width: 16, height: 16, color: '#ffffff' }} />
                    : <StepIcon style={{ width: 14, height: 14, color: active ? BAI.tenant : BAI.inkFaint }} />
                  }
                </div>
                <span style={{
                  fontSize: 10, fontFamily: BAI.fontBody,
                  fontWeight: active ? 700 : 500,
                  color: active ? BAI.tenant : done ? BAI.inkMid : BAI.inkFaint,
                  whiteSpace: 'nowrap', textAlign: 'center',
                }}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, margin: '0 6px',
                  marginBottom: 24,
                  background: i < current ? BAI.tenant : BAI.border,
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 99, background: BAI.border }}>
        <div style={{
          height: '100%', borderRadius: 99, background: BAI.tenant,
          width: `${pct}%`, transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}

// ── Step nav buttons ───────────────────────────────────────────────────────────
function StepNav({
  onBack, onContinue, onSkip, isFirst, isLast, saving, continueLabel,
}: {
  onBack:        () => void
  onContinue:    () => void
  onSkip?:       () => void
  isFirst:       boolean
  isLast:        boolean
  saving?:       boolean
  continueLabel?: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 28, paddingTop: 20, borderTop: `1px solid ${BAI.border}`,
      flexWrap: 'wrap', gap: 10,
    }}>
      <button
        onClick={onBack} disabled={isFirst}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 18px', borderRadius: 9,
          border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
          color: isFirst ? BAI.inkFaint : BAI.inkMid,
          fontSize: 13, fontFamily: BAI.fontBody, fontWeight: 500,
          cursor: isFirst ? 'default' : 'pointer',
        }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        Retour
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              padding: '10px 16px', borderRadius: 9,
              border: 'none', background: 'none',
              color: BAI.inkFaint, fontSize: 13, fontFamily: BAI.fontBody,
              cursor: 'pointer',
            }}
          >
            Passer
          </button>
        )}
        <button
          onClick={onContinue} disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 22px', borderRadius: 9,
            border: 'none',
            background: saving ? BAI.inkFaint : BAI.tenant,
            color: '#ffffff',
            fontSize: 13, fontFamily: BAI.fontBody, fontWeight: 700,
            cursor: saving ? 'default' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {saving
            ? <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />Enregistrement…</>
            : <>{continueLabel ?? (isLast ? 'Terminer' : 'Continuer')}<ArrowRight style={{ width: 14, height: 14 }} /></>
          }
        </button>
      </div>
    </div>
  )
}

// ── FormField — must live outside the page component to keep stable identity ──
// Defining a component inside another component causes React to remount it on
// every render (new function reference = new type), which drops focus mid-typing.
function FormField({
  value, onChange, label, type = 'text', placeholder = '', required = false,
}: {
  value: string
  onChange: (val: string) => void
  label: string
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, fontFamily: BAI.fontBody, color: BAI.inkMid }}>
        {label}
        {required && <span style={{ color: BAI.caramel, marginLeft: 3 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '9px 12px', borderRadius: 8, border: `1px solid ${BAI.border}`,
          background: BAI.bgInput, fontSize: 16, fontFamily: BAI.fontBody, color: BAI.ink,
          outline: 'none',
        }}
      />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DossierLocatif() {
  const { user, updateProfile } = useAuth()

  // ── Stepper state (persisted) ───────────────────────────────────────────────
  // Si le guide a déjà été terminé, on va directement en mode vue d'ensemble.
  const guideDone = (() => { try { return localStorage.getItem(GUIDE_DONE_KEY) === '1' } catch { return false } })()
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (guideDone) return 0
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) return Number(saved)
    } catch { /* ignore */ }
    return 0
  })
  const [showOverview, setShowOverview] = useState<boolean>(() => {
    // Si guide déjà fait → vue d'ensemble directement
    if (guideDone) return true
    try { return localStorage.getItem(STORAGE_KEY) === String(TOTAL_STEPS) } catch { return false }
  })

  const goToStep = (n: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_STEPS, n))
    setCurrentStep(clamped)
    if (clamped >= TOTAL_STEPS) {
      setShowOverview(true)
      try {
        localStorage.setItem(STORAGE_KEY, String(TOTAL_STEPS))
        localStorage.setItem(GUIDE_DONE_KEY, '1') // ne plus jamais montrer le guide
      } catch { /* ignore */ }
    } else {
      setShowOverview(false)
      try { localStorage.setItem(STORAGE_KEY, String(clamped)) } catch { /* ignore */ }
    }
  }

  // ── Documents ──────────────────────────────────────────────────────────────
  const [documents,  setDocuments]  = useState<TenantDocument[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [viewerDoc,  setViewerDoc]  = useState<TenantDocument | null>(null)

  useEffect(() => {
    dossierService.getDocuments()
      .then(setDocuments)
      .catch(() => toast.error('Impossible de charger vos documents'))
      .finally(() => setLoadingDocs(false))
  }, [])

  const handleUpload = useCallback(async (file: File, category: string, docType: string) => {
    const doc = await dossierService.uploadDocument(category, docType, file)
    setDocuments(prev => {
      const filtered = prev.filter(d => !(d.category === category && d.docType === docType))
      return [doc, ...filtered]
    })
    toast.success('Document ajouté')
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    await dossierService.deleteDocument(id)
    setDocuments(prev => prev.filter(d => d.id !== id))
    toast.success('Document supprimé')
  }, [])

  // ── Profile form ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    firstName:   user?.firstName   ?? '',
    lastName:    user?.lastName    ?? '',
    birthDate:   user?.birthDate   ? user.birthDate.slice(0, 10) : '',
    birthCity:   user?.birthCity   ?? '',
    nationality: user?.nationality ?? '',
  })
  const [saving,     setSaving]     = useState(false)
  const [formError,  setFormError]  = useState('')

  useEffect(() => {
    if (user) setForm({
      firstName:   user.firstName   ?? '',
      lastName:    user.lastName    ?? '',
      birthDate:   user.birthDate   ? user.birthDate.slice(0, 10) : '',
      birthCity:   user.birthCity   ?? '',
      nationality: user.nationality ?? '',
    })
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveProfile = async (): Promise<boolean> => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError('Le prénom et le nom sont obligatoires.')
      return false
    }
    setFormError('')
    setSaving(true)
    try {
      await updateProfile({
        firstName:   form.firstName.trim(),
        lastName:    form.lastName.trim(),
        birthDate:   form.birthDate  || undefined,
        birthCity:   form.birthCity.trim()  || undefined,
        nationality: form.nationality.trim() || undefined,
      })
      toast.success('Informations enregistrées')
      return true
    } catch {
      toast.error('Erreur lors de la sauvegarde')
      return false
    } finally {
      setSaving(false)
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalDocs  = CATEGORIES.reduce((n, c) => n + c.slots.length, 0)
  const filledDocs = CATEGORIES.reduce(
    (n, c) => n + c.slots.filter(s => documents.find(d => d.docType === s.docType)).length, 0,
  )
  const pct = totalDocs ? Math.round((filledDocs / totalDocs) * 100) : 0

  // ── Card wrapper ───────────────────────────────────────────────────────────
  const stepCard = (children: React.ReactNode) => (
    <div style={{
      background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
      borderRadius: 16, padding: '28px 28px 24px',
      boxShadow: BAI.shadowLg,
    }}>
      {children}
    </div>
  )

  // ── OVERVIEW MODE ──────────────────────────────────────────────────────────
  if (showOverview) {
    return (
      <Layout>
        <div style={{ minHeight: '100vh', background: BAI.bgBase, padding: '32px 0 64px', fontFamily: BAI.fontBody }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.tenant, margin: '0 0 6px' }}>
                  Locataire
                </p>
                <h1 style={{ fontFamily: BAI.fontDisplay, fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(30px,5vw,42px)', color: BAI.ink, margin: '0 0 6px', lineHeight: 1.1 }}>
                  Mon Dossier Locatif
                </h1>
                <p style={{ fontSize: 13, color: BAI.inkFaint, margin: 0 }}>
                  {filledDocs}/{totalDocs} documents · {pct}% complété
                </p>
              </div>
              <button
                onClick={() => goToStep(0)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 9,
                  border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
                  color: BAI.inkMid, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}
              >
                Reprendre le guide
              </button>
            </div>

            {/* Progress bar */}
            {!loadingDocs && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ height: 5, borderRadius: 99, background: BAI.border }}>
                  <div style={{ height: '100%', borderRadius: 99, background: BAI.tenant, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )}

            {/* Profile summary */}
            <div style={{
              background: BAI.bgSurface, border: `1px solid ${BAI.tenantBorder}`,
              borderRadius: 12, padding: '18px 20px',
              boxShadow: BAI.shadowMd, marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: BAI.tenantLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <User style={{ width: 18, height: 18, color: BAI.tenant }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: BAI.ink }}>
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: BAI.inkFaint, marginTop: 2 }}>
                    {user?.birthDate ? `Né·e le ${new Date(user.birthDate).toLocaleDateString('fr-FR')}` : ''}
                    {user?.birthCity ? ` · ${user.birthCity}` : ''}
                    {user?.nationality ? ` · ${user.nationality}` : ''}
                  </p>
                </div>
              </div>
              <a href="/settings" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, color: BAI.tenant, textDecoration: 'none', fontWeight: 500, flexShrink: 0,
              }}>
                Modifier <ArrowRight style={{ width: 13, height: 13 }} />
              </a>
            </div>

            {/* Documents grid */}
            {loadingDocs ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10 }}>
                <Loader2 style={{ width: 22, height: 22, color: BAI.tenant }} className="animate-spin" />
                <span style={{ fontSize: 13, color: BAI.inkFaint }}>Chargement…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {CATEGORIES.map(cat => (
                  <CategoryAccordion
                    key={cat.id}
                    cat={cat}
                    documents={documents.filter(d => d.category === cat.id)}
                    onUpload={handleUpload}
                    onDelete={handleDelete}
                    onView={setViewerDoc}
                  />
                ))}
              </div>
            )}

            {/* Tips */}
            <div style={{
              background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
              borderRadius: 14, padding: '24px', boxShadow: BAI.shadowMd, marginTop: 28,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <BookOpen style={{ width: 18, height: 18, color: BAI.caramel }} />
                <h2 style={{ margin: 0, fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 22, fontWeight: 700, color: BAI.ink }}>
                  Constituer un dossier solide
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {TIPS.map(tip => {
                  const TipIcon = tip.icon
                  return (
                    <div key={tip.title} style={{ padding: '14px 16px', borderRadius: 10, background: BAI.bgMuted, border: `1px solid ${BAI.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <TipIcon style={{ width: 13, height: 13, color: BAI.caramel, flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: BAI.fontBody, color: BAI.ink }}>{tip.title}</p>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: BAI.inkMid, lineHeight: 1.6 }}>{tip.body}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        {viewerDoc && (
          <DocumentViewerModal
            fileUrl={viewerDoc.fileUrl}
            fileName={viewerDoc.fileName}
            onClose={() => setViewerDoc(null)}
          />
        )}
      </Layout>
    )
  }

  // ── STEPPER MODE ───────────────────────────────────────────────────────────
  const catIndex   = currentStep - 1 // steps 1-5 map to CATEGORIES[0-4]
  const currentCat = catIndex >= 0 && catIndex < CATEGORIES.length ? CATEGORIES[catIndex] : null
  const CatIcon    = currentCat?.icon

  return (
    <Layout>
      <div style={{ minHeight: '100vh', background: BAI.bgBase, padding: '32px 0 64px', fontFamily: BAI.fontBody }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.tenant, margin: '0 0 6px' }}>
              Locataire
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: BAI.fontDisplay, fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(28px,5vw,40px)', color: BAI.ink, margin: 0, lineHeight: 1.1 }}>
                Mon Dossier Locatif
              </h1>
              <button
                onClick={() => goToStep(TOTAL_STEPS)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
                  color: BAI.inkMid, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}
              >
                <LayoutGrid style={{ width: 13, height: 13 }} />
                Voir tout
              </button>
            </div>
          </div>

          {/* Stepper header */}
          <StepperHeader current={currentStep} />

          {/* ── Step 0: Identity ──────────────────────────────────────────── */}
          {currentStep === 0 && stepCard(
            <>
              <div style={{ marginBottom: 22 }}>
                <h2 style={{ margin: '0 0 4px', fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 26, fontWeight: 700, color: BAI.ink }}>
                  Qui êtes-vous ?
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: BAI.inkFaint }}>
                  Commençons par vos informations personnelles. Ces données ne vous seront demandées qu'une fois.
                </p>
              </div>

              {/* Priority: Prénom + Nom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: 20 }}>
                <FormField
                  label="Prénom" value={form.firstName} required placeholder="Marie"
                  onChange={v => setForm(p => ({ ...p, firstName: v }))}
                />
                <FormField
                  label="Nom de famille" value={form.lastName} required placeholder="Martin"
                  onChange={v => setForm(p => ({ ...p, lastName: v }))}
                />
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: BAI.border, margin: '4px 0 20px' }} />
              <p style={{ fontSize: 12, color: BAI.inkFaint, margin: '0 0 16px', fontStyle: 'italic' }}>
                Informations complémentaires (recommandées pour un dossier complet)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  label="Date de naissance" type="date" value={form.birthDate}
                  onChange={v => setForm(p => ({ ...p, birthDate: v }))}
                />
                <FormField
                  label="Ville de naissance" placeholder="Paris" value={form.birthCity}
                  onChange={v => setForm(p => ({ ...p, birthCity: v }))}
                />
                <FormField
                  label="Nationalité" placeholder="Française" value={form.nationality}
                  onChange={v => setForm(p => ({ ...p, nationality: v }))}
                />
              </div>

              {formError && (
                <p style={{ marginTop: 12, fontSize: 12, color: '#9b1c1c' }}>{formError}</p>
              )}

              <StepNav
                isFirst={true}
                isLast={false}
                saving={saving}
                onBack={() => {}}
                onContinue={async () => {
                  const ok = await handleSaveProfile()
                  if (ok) goToStep(1)
                }}
              />
            </>,
          )}

          {/* ── Steps 1-5: Document categories ───────────────────────────── */}
          {currentStep >= 1 && currentStep <= CATEGORIES.length && currentCat && stepCard(
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
                {CatIcon && (
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: BAI.tenantLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CatIcon style={{ width: 20, height: 20, color: BAI.tenant }} />
                  </div>
                )}
                <div>
                  <h2 style={{ margin: '0 0 4px', fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 26, fontWeight: 700, color: BAI.ink }}>
                    {currentCat.label}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: BAI.inkFaint }}>
                    {currentCat.hint}
                  </p>
                </div>
              </div>

              {loadingDocs ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
                  <Loader2 style={{ width: 20, height: 20, color: BAI.tenant }} className="animate-spin" />
                  <span style={{ fontSize: 13, color: BAI.inkFaint }}>Chargement…</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {currentCat.slots.map(slot => (
                    <DocSlot
                      key={slot.docType}
                      slot={slot}
                      doc={documents.find(d => d.docType === slot.docType)}
                      onUpload={(file, docType) => handleUpload(file, currentCat.id, docType)}
                      onDelete={handleDelete}
                      onView={setViewerDoc}
                    />
                  ))}
                </div>
              )}

              {/* Optional badge for GARANTIES */}
              {currentCat.id === 'GARANTIES' && (
                <div style={{
                  marginTop: 16, padding: '10px 14px', borderRadius: 9,
                  background: BAI.caramelLight, border: `1px solid #e8c9a0`,
                  fontSize: 12, color: BAI.caramel, fontWeight: 500,
                }}>
                  Cette étape est optionnelle. Un garant est conseillé si vos revenus mensuels sont inférieurs à 3× le montant du loyer.
                </div>
              )}

              <StepNav
                isFirst={currentStep === 0}
                isLast={currentStep === TOTAL_STEPS - 1}
                onBack={() => goToStep(currentStep - 1)}
                onContinue={() => goToStep(currentStep + 1)}
                onSkip={currentCat.id === 'GARANTIES' ? () => goToStep(currentStep + 1) : undefined}
              />
            </>,
          )}

          {/* Footer hint */}
          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: BAI.inkFaint }}>
            Vous pouvez revenir à tout moment compléter ou modifier votre dossier.
          </p>
        </div>
      </div>

      {viewerDoc && (
        <DocumentViewerModal
          fileUrl={viewerDoc.fileUrl}
          fileName={viewerDoc.fileName}
          onClose={() => setViewerDoc(null)}
        />
      )}
    </Layout>
  )
}
