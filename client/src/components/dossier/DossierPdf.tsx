/**
 * DossierPdf — Composant React-PDF pour le dossier locatif
 * Génère un PDF A4 professionnel avec identité, score et documents fournis.
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer'
import type { TenantDocument } from '../../services/dossier.service'

// ── Palette (hex uniquement, sans référence BAI — React-PDF ne supporte pas les tokens runtime) ──
const C = {
  night:      '#1a1a2e',
  caramel:    '#c4976a',
  ink:        '#0d0c0a',
  inkMid:     '#5a5754',
  inkFaint:   '#9e9b96',
  muted:      '#f4f2ee',
  border:     '#e4e1db',
  surface:    '#ffffff',
  tenant:     '#1b5e3b',
  tenantLight:'#edf7f2',
  owner:      '#1a3270',
  danger:     '#9b1c1c',
  dangerLight:'#fef2f2',
} as const

// ── Styles PDF ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: C.surface,
    paddingBottom: 48,
  },

  // Header band
  header: {
    backgroundColor: C.night,
    paddingHorizontal: 36,
    paddingTop: 28,
    paddingBottom: 22,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  logo: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: C.surface,
    letterSpacing: 1,
  },
  logoAccent: {
    color: C.caramel,
  },
  headerMeta: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 10,
  },
  headerConfidential: {
    fontSize: 8,
    color: C.caramel,
    letterSpacing: 1,
    marginTop: 4,
  },

  // Body
  body: {
    paddingHorizontal: 36,
    paddingTop: 28,
  },

  // Section
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.caramel,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  sectionBlock: {
    marginBottom: 22,
  },

  // Grid rows
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },

  // Info cell
  cell: {
    flex: 1,
    backgroundColor: C.muted,
    borderRadius: 4,
    padding: '8 10',
  },
  cellLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.inkFaint,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  cellValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.ink,
  },
  cellValueFaint: {
    fontSize: 10,
    color: C.inkFaint,
    fontStyle: 'italic',
  },

  // Score block
  scoreBlock: {
    backgroundColor: C.muted,
    borderRadius: 6,
    padding: '14 16',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreNumber: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: C.night,
    lineHeight: 1,
    minWidth: 52,
  },
  scoreRight: {
    flex: 1,
  },
  scoreBarBg: {
    height: 6,
    backgroundColor: C.border,
    borderRadius: 3,
    marginBottom: 6,
  },
  scoreVerdict: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  scoreSubtext: {
    fontSize: 8,
    color: C.inkMid,
    marginTop: 2,
  },

  // Doc category row
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginBottom: 5,
  },
  catBadge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    textTransform: 'uppercase',
  },
  catName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  catCount: {
    fontSize: 9,
    color: C.inkMid,
  },

  // Doc item line
  docLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
    gap: 8,
  },
  docDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.tenant,
  },
  docName: {
    fontSize: 9,
    color: C.ink,
    flex: 1,
  },
  docDate: {
    fontSize: 8,
    color: C.inkFaint,
  },
  docStatus: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  // Footer band
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.muted,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: 'solid',
    paddingHorizontal: 36,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: C.inkFaint,
  },
  footerPage: {
    fontSize: 7,
    color: C.inkFaint,
  },

  // Confidential banner (page 2 bottom)
  confidentialBanner: {
    backgroundColor: '#fdf5ec',
    borderWidth: 1,
    borderColor: '#e8ccaa',
    borderStyle: 'solid',
    borderRadius: 5,
    padding: '10 14',
    marginTop: 20,
  },
  confidentialText: {
    fontSize: 8,
    color: '#92400e',
    lineHeight: 1.5,
    textAlign: 'center',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 16,
  },

  // Page number
  pageNumber: {
    position: 'absolute',
    bottom: 48,
    right: 36,
    fontSize: 7,
    color: C.inkFaint,
  },
})

// ── Types ──────────────────────────────────────────────────────────────────────
export interface DossierPdfUser {
  firstName?: string | null
  lastName?:  string | null
  email?:     string | null
  birthDate?: string | null
  birthCity?: string | null
  nationality?: string | null
  profileMeta?: Record<string, unknown> | null
}

export interface DossierPdfProps {
  user:      DossierPdfUser
  documents: TenantDocument[]
  score:     number
}

// ── Category metadata ──────────────────────────────────────────────────────────
const CAT_META: Record<string, { label: string; order: number }> = {
  IDENTITE:  { label: "Pièce d'identité", order: 1 },
  EMPLOI:    { label: 'Situation professionnelle', order: 2 },
  REVENUS:   { label: 'Revenus', order: 3 },
  DOMICILE:  { label: 'Justificatif de domicile', order: 4 },
  GARANTIES: { label: 'Garanties / Garant', order: 5 },
}

const DOC_TYPE_LABELS: Record<string, string> = {
  CNI_RECTO:             'CNI recto',
  CNI_VERSO:             'CNI verso',
  PASSEPORT:             'Passeport',
  TITRE_SEJOUR:          'Titre de séjour',
  PERMIS_RECTO:          'Permis recto',
  PERMIS_VERSO:          'Permis verso',
  CONTRAT_TRAVAIL:       'Contrat de travail',
  PROMESSE_EMBAUCHE:     "Promesse d'embauche",
  KBIS_EXTRAIT:          'Extrait KBIS',
  JUSTIFICATIF_RETRAITE: 'Justificatif de retraite',
  BULLETIN_PAIE_1:       'Bulletin de salaire M-1',
  BULLETIN_PAIE_2:       'Bulletin de salaire M-2',
  BULLETIN_PAIE_3:       'Bulletin de salaire M-3',
  AVIS_IMPOSITION:       "Avis d'imposition N-1",
  AVIS_IMPOSITION_N2:    "Avis d'imposition N-2",
  QUITTANCE_LOYER:       'Quittance de loyer',
  TAXE_FONCIERE:         'Taxe foncière',
  FACTURE_EDF:           'Facture énergie / eau',
  JUSTIFICATIF_DOMICILE: 'Justificatif de domicile',
  GARANT_CNI:            'CNI du garant',
  GARANT_CONTRAT:        'Contrat de travail garant',
  GARANT_PAIE:           'Bulletins de salaire garant',
  GARANT_IMPOSITION:     "Avis d'imposition garant",
  LETTRE_GARANT:         "Lettre d'engagement",
  GARANT_VISALE:         'Attestation Visale / CLé',
}

// ── Score helpers ──────────────────────────────────────────────────────────────
function scoreVerdict(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'ELIGIBLE', color: C.tenant }
  if (score >= 40) return { label: 'PARTIEL', color: '#92400e' }
  return { label: 'INCOMPLET', color: C.danger }
}

function scoreBarFill(score: number): string {
  if (score >= 70) return C.tenant
  if (score >= 40) return C.caramel
  return C.danger
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}

// ── PDF Document ───────────────────────────────────────────────────────────────
function DossierDocument({ user, documents, score }: DossierPdfProps) {
  const now   = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const fullName = [user.firstName, user.lastName?.toUpperCase()].filter(Boolean).join(' ') || 'Locataire'
  const { label: verdictLabel, color: verdictColor } = scoreVerdict(score)
  const barFill = scoreBarFill(score)

  // Group documents by category, ordered
  const grouped = Object.entries(CAT_META)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([catId, meta]) => ({
      catId,
      label: meta.label,
      docs: documents.filter(d => d.category === catId),
    }))

  const questionnaire = (user.profileMeta as Record<string, Record<string, string>> | null)?._questionnaire
  const emploiLabels: Record<string, string> = {
    cdi: 'Salarié·e CDI', cdd_embauche: 'CDD / En cours d\'embauche',
    independant: 'Indépendant·e / Auto-entrepreneur',
    etudiant: 'Étudiant·e', retraite: 'Retraité·e', sans_emploi: 'Sans activité',
  }
  const garantLabels: Record<string, string> = {
    oui_physique: 'Garant personnel', oui_visale: 'Visale / CLé',
    oui_les_deux: 'Garant personnel + Visale', non: 'Pas de garant',
  }
  const emploiLabel = questionnaire?.emploiType ? (emploiLabels[questionnaire.emploiType] ?? questionnaire.emploiType) : null
  const garantLabel = questionnaire?.hasGarant   ? (garantLabels[questionnaire.hasGarant]  ?? questionnaire.hasGarant) : null

  return (
    <Document
      title={`Dossier locatif — ${fullName}`}
      author="Bailio"
      subject="Dossier locatif confidentiel"
      keywords="dossier locatif bailio"
    >
      {/* ── PAGE 1 — Identité & Score ─────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <Text style={s.logo}>
              BAI<Text style={s.logoAccent}>LIO</Text>
            </Text>
            <Text style={s.headerMeta}>Généré le {now}</Text>
          </View>
          <Text style={s.headerTitle}>Dossier Locatif</Text>
          <Text style={s.headerConfidential}>CONFIDENTIEL — Usage strictement personnel</Text>
        </View>

        <View style={s.body}>
          {/* Section : Informations personnelles */}
          <View style={s.sectionBlock}>
            <Text style={s.sectionTitle}>Informations personnelles</Text>

            <View style={s.row}>
              <View style={s.cell}>
                <Text style={s.cellLabel}>Prénom</Text>
                <Text style={s.cellValue}>{user.firstName || '—'}</Text>
              </View>
              <View style={s.cell}>
                <Text style={s.cellLabel}>Nom</Text>
                <Text style={s.cellValue}>{user.lastName?.toUpperCase() || '—'}</Text>
              </View>
            </View>

            <View style={s.row}>
              <View style={s.cell}>
                <Text style={s.cellLabel}>Email</Text>
                <Text style={[s.cellValue, { fontSize: 9 }]}>{user.email || '—'}</Text>
              </View>
              <View style={s.cell}>
                <Text style={s.cellLabel}>Date de naissance</Text>
                <Text style={s.cellValue}>
                  {user.birthDate ? fmtDate(user.birthDate) : '—'}
                  {user.birthCity ? ` à ${user.birthCity}` : ''}
                </Text>
              </View>
            </View>

            {(user.nationality || emploiLabel || garantLabel) && (
              <View style={s.row}>
                {user.nationality && (
                  <View style={s.cell}>
                    <Text style={s.cellLabel}>Nationalité</Text>
                    <Text style={s.cellValue}>{user.nationality}</Text>
                  </View>
                )}
                {emploiLabel && (
                  <View style={s.cell}>
                    <Text style={s.cellLabel}>Situation professionnelle</Text>
                    <Text style={s.cellValue}>{emploiLabel}</Text>
                  </View>
                )}
                {garantLabel && (
                  <View style={s.cell}>
                    <Text style={s.cellLabel}>Garant</Text>
                    <Text style={s.cellValue}>{garantLabel}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Section : Score dossier */}
          <View style={s.sectionBlock}>
            <Text style={s.sectionTitle}>Score du dossier</Text>

            <View style={s.scoreBlock}>
              <Text style={[s.scoreNumber, { color: verdictColor }]}>{score}</Text>
              <View style={s.scoreRight}>
                {/* Progress bar */}
                <View style={s.scoreBarBg}>
                  <View style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: barFill,
                    width: `${Math.min(100, score)}%`,
                  }} />
                </View>
                <Text style={[s.scoreVerdict, { color: verdictColor }]}>
                  {verdictLabel}
                </Text>
                <Text style={s.scoreSubtext}>
                  {score >= 70
                    ? 'Dossier solide — éligible à la plupart des locations.'
                    : score >= 40
                    ? 'Dossier partiel — des pièces complémentaires sont conseillées.'
                    : 'Dossier incomplet — veuillez ajouter les documents manquants.'}
                </Text>
              </View>
            </View>
          </View>

          {/* Section : Documents fournis (résumé catégories) */}
          <View style={s.sectionBlock}>
            <Text style={s.sectionTitle}>Catégories de documents</Text>
            {grouped.map(({ catId, label, docs }) => {
              const hasAny = docs.length > 0
              return (
                <View
                  key={catId}
                  style={[
                    s.catRow,
                    {
                      backgroundColor: hasAny ? '#edf7f2' : C.muted,
                      borderWidth: 1,
                      borderColor: hasAny ? '#9fd4ba' : C.border,
                      borderStyle: 'solid',
                    },
                  ]}
                >
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: hasAny ? C.tenant : C.inkFaint,
                  }} />
                  <Text style={[s.catName, { color: hasAny ? C.tenant : C.inkMid }]}>
                    {label}
                  </Text>
                  {hasAny ? (
                    <Text style={[s.catBadge, {
                      backgroundColor: '#edf7f2',
                      color: C.tenant,
                      borderWidth: 1,
                      borderColor: '#9fd4ba',
                      borderStyle: 'solid',
                    }]}>
                      {docs.length} doc{docs.length > 1 ? 's' : ''}
                    </Text>
                  ) : (
                    <Text style={[s.catBadge, {
                      backgroundColor: C.muted,
                      color: C.inkFaint,
                      borderWidth: 1,
                      borderColor: C.border,
                      borderStyle: 'solid',
                    }]}>
                      Absent
                    </Text>
                  )}
                </View>
              )
            })}
          </View>
        </View>

        {/* Footer page 1 */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Bailio — Plateforme de gestion locative</Text>
          <Text style={s.footerPage}>Page 1 / 2</Text>
        </View>
      </Page>

      {/* ── PAGE 2 — Liste détaillée des documents ────────────────────────────── */}
      <Page size="A4" style={s.page}>
        {/* Header compact */}
        <View style={[s.header, { paddingTop: 18, paddingBottom: 16 }]}>
          <View style={s.headerTop}>
            <Text style={s.logo}>
              BAI<Text style={s.logoAccent}>LIO</Text>
            </Text>
            <Text style={s.headerMeta}>{fullName} — Documents fournis</Text>
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.sectionTitle}>Documents fournis — Détail</Text>

          {grouped.map(({ catId, label, docs }) => {
            if (docs.length === 0) return null
            return (
              <View key={catId} style={{ marginBottom: 14 }}>
                {/* Category heading */}
                <View style={{
                  backgroundColor: C.night,
                  borderRadius: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  marginBottom: 4,
                }}>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.surface, letterSpacing: 0.5 }}>
                    {label}
                  </Text>
                </View>

                {/* Doc rows */}
                {docs.map((doc) => {
                  const isValidated = doc.status === 'VALIDATED'
                  const isRejected  = doc.status === 'REJECTED'
                  const statusColor = isValidated ? C.tenant : isRejected ? C.danger : '#92400e'
                  const statusBg    = isValidated ? '#edf7f2' : isRejected ? C.dangerLight : '#fef9ec'
                  const statusLabel = isValidated ? 'Vérifié' : isRejected ? 'Refusé' : 'En attente'

                  return (
                    <View key={doc.id} style={s.docLine}>
                      <View style={[s.docDot, { backgroundColor: statusColor }]} />
                      <Text style={s.docName}>
                        {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
                      </Text>
                      <Text style={s.docDate}>{fmtDate(doc.createdAt)}</Text>
                      <Text style={[s.docStatus, {
                        backgroundColor: statusBg,
                        color: statusColor,
                        borderWidth: 1,
                        borderColor: isValidated ? '#9fd4ba' : isRejected ? '#fca5a5' : '#e8c98b',
                        borderStyle: 'solid',
                      }]}>
                        {statusLabel}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )
          })}

          {documents.length === 0 && (
            <View style={[s.cell, { marginTop: 10 }]}>
              <Text style={s.cellValueFaint}>Aucun document ajouté pour l'instant.</Text>
            </View>
          )}

          {/* Confidential banner */}
          <View style={s.confidentialBanner}>
            <Text style={s.confidentialText}>
              Ce document est confidentiel et destiné uniquement à la personne ou l'organisme auquel il est adressé.
              Il ne peut être reproduit, distribué ou utilisé sans l'autorisation expresse de son auteur.
              Toute utilisation frauduleuse est passible de sanctions légales conformément au droit français.
            </Text>
          </View>
        </View>

        {/* Footer page 2 */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Bailio — Plateforme de gestion locative</Text>
          <Text style={s.footerPage}>Page 2 / 2</Text>
        </View>
      </Page>
    </Document>
  )
}

// ── Public export: Ready-to-use download button ───────────────────────────────
export function DossierPdfDownloadButton({
  user,
  documents,
  score,
  fileName,
}: DossierPdfProps & { fileName?: string }) {
  const safeName = [user.firstName, user.lastName].filter(Boolean).join('_') || 'locataire'
  const pdfName  = fileName ?? `dossier_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`

  return (
    <PDFDownloadLink
      document={<DossierDocument user={user} documents={documents} score={score} />}
      fileName={pdfName}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', borderRadius: 9,
          background: '#ffffff', border: '1px solid #e4e1db', color: '#0d0c0a',
          fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
          userSelect: 'none',
        }}>
          {loading ? '⏳ Préparation…' : '↓ Télécharger mon dossier (PDF)'}
        </span>
      )}
    </PDFDownloadLink>
  )
}

// Export the document itself for cases where only the Document node is needed
export { DossierDocument }
