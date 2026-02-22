import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import { Contract, ContractClause } from '../../types/contract.types'

// ─── Palette ───────────────────────────────────────────────────────────────
const C = {
  primary:   '#1e3a5f',
  accent:    '#2563eb',
  light:     '#eff6ff',
  lightBdr:  '#bfdbfe',
  border:    '#d1d5db',
  muted:     '#6b7280',
  text:      '#111827',
  warn:      '#92400e',
  warnBg:    '#fef3c7',
  warnBdr:   '#d97706',
  errorBg:   '#fef2f2',
  errorText: '#991b1b',
  errorBdr:  '#dc2626',
  successTx: '#166534',
  white:     '#ffffff',
  gray50:    '#f9fafb',
  gray100:   '#f3f4f6',
  purple:    '#7c3aed',
}

const s = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 52,
    paddingHorizontal: 44,
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: C.text,
    lineHeight: 1.55,
    backgroundColor: C.white,
  },

  // Header band
  headerBar: {
    backgroundColor: C.primary,
    borderRadius: 4,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end' },
  headerTitle:  { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.white },
  headerSub:    { fontSize: 9,  color: '#93c5fd', marginTop: 2 },
  headerLegal:  { fontSize: 7,  color: '#bfdbfe', marginTop: 3 },
  headerRef:    { fontSize: 7,  color: '#93c5fd', marginBottom: 1 },

  // Section header
  sectionHeader: {
    backgroundColor: C.primary,
    borderRadius: 3,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionNum:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#93c5fd', marginRight: 6, minWidth: 22 },
  sectionTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.white },

  // Sub-section title
  subsectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginTop: 7,
    marginBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingBottom: 2,
  },

  // Sections
  section: { marginBottom: 13 },

  // Rows / cols
  row:  { flexDirection: 'row', marginBottom: 6 },
  col:  { flex: 1, marginRight: 10 },
  colL: { flex: 1 },   // last col — no right margin

  // Party cards
  partyCard: {
    flex: 1,
    backgroundColor: C.gray50,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 10,
    marginRight: 10,
  },
  partyCardLast: {
    flex: 1,
    backgroundColor: C.gray50,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 10,
  },
  partyLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.accent,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingBottom: 3,
  },
  partyName:   { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 2 },
  partyDetail: { fontSize: 8.5,  color: C.muted, marginBottom: 1.5 },
  partyNote:   { fontSize: 8,    color: C.muted, fontStyle: 'italic', marginTop: 3 },

  // Field pairs
  fieldPair:   { marginBottom: 5 },
  fieldLabel:  { fontSize: 7.5, color: C.muted, marginBottom: 1 },
  fieldValue:  { fontSize: 9.5, color: C.text },
  fieldBold:   { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.text },

  // Financial grid
  finGrid: {
    flexDirection: 'row',
    backgroundColor: C.light,
    borderWidth: 1,
    borderColor: C.lightBdr,
    borderRadius: 4,
    marginBottom: 10,
  },
  finCell: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: C.lightBdr,
  },
  finCellLast: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  finAmount:  { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.accent },
  finLabel:   { fontSize: 7.5, color: C.muted, marginTop: 2 },
  finSub:     { fontSize: 7,   color: C.muted, marginTop: 1 },

  // Info / warn / error boxes
  infoBox: {
    backgroundColor: C.light,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
    borderRadius: 3,
    padding: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  warnBox: {
    backgroundColor: C.warnBg,
    borderLeftWidth: 3,
    borderLeftColor: C.warnBdr,
    borderRadius: 3,
    padding: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  warnTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.warn, marginBottom: 3 },
  warnText:  { fontSize: 8,   color: C.warn, marginBottom: 2 },
  errorBox:  {
    backgroundColor: C.errorBg,
    borderLeftWidth: 3,
    borderLeftColor: C.errorBdr,
    borderRadius: 3,
    padding: 8,
    marginBottom: 8,
  },
  errorTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.errorText, marginBottom: 3 },
  errorText:  { fontSize: 8,   color: C.errorText, marginBottom: 2 },

  // Text styles
  body:      { fontSize: 9,  color: C.text, marginBottom: 4, textAlign: 'justify' },
  bodyBold:  { fontSize: 9,  fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 4 },
  listItem:  { fontSize: 9,  color: C.text, marginBottom: 2.5, paddingLeft: 12 },

  // Annexe checklist
  annexeRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  annexeBox:   { width: 11, height: 11, borderWidth: 1, borderColor: C.border, borderRadius: 2, marginRight: 7, marginTop: 0.5 },
  annexeText:  { fontSize: 8.5, color: C.text, flex: 1 },
  annexeNote:  { fontSize: 7.5, color: C.muted, paddingLeft: 18, marginBottom: 4 },

  // Clause boxes
  clauseBox:    { borderWidth: 1, borderColor: C.border, borderRadius: 3, marginBottom: 8 },
  clauseHead:   { backgroundColor: C.gray100, paddingVertical: 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  clauseBadge:  { backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, marginRight: 6 },
  clauseBadgeTx:{ fontSize: 6.5, color: C.white, fontFamily: 'Helvetica-Bold' },
  clauseTitle:  { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.text },
  clauseBody:   { padding: 8, fontSize: 8.5, color: '#374151', textAlign: 'justify' },

  // Signatures
  sigSection: { marginTop: 18, flexDirection: 'row' },
  sigBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    marginRight: 14,
  },
  sigBoxLast: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
  },
  sigHead:    { backgroundColor: C.primary, padding: 8 },
  sigHeadTx:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white },
  sigBody:    { padding: 10, minHeight: 130 },
  sigName:    { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 2 },
  sigEmail:   { fontSize: 7.5, color: C.muted, marginBottom: 8 },
  sigDate:    { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.successTx, marginBottom: 4 },
  sigImg:     { width: 160, height: 60, objectFit: 'contain', marginBottom: 6 },
  sigEmpty:   { fontSize: 8, color: '#9ca3af', fontStyle: 'italic', marginTop: 18, borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 6 },
  sigMeta:    { fontSize: 6.5, color: C.muted, marginTop: 1.5 },
  sigMetaOk:  { fontSize: 6.5, color: C.successTx, marginTop: 1.5 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 44,
    right: 44,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerTx: { fontSize: 6.5, color: '#9ca3af' },

  // Divider
  divider: { borderTopWidth: 0.5, borderTopColor: C.border, marginVertical: 9 },
})

// ─── Helpers ───────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const fmtDateShort = (d: string) => new Date(d).toLocaleDateString('fr-FR')

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const getDuration = (start: string, end: string) => {
  const months = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / (30.44 * 86400000)
  )
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y > 0 && m > 0) return `${y} an${y > 1 ? 's' : ''} et ${m} mois`
  if (y > 0) return `${y} an${y > 1 ? 's' : ''}`
  return `${months} mois`
}

// ─── Sub-components ────────────────────────────────────────────────────────

const SecHead = ({ num, title }: { num: string; title: string }) => (
  <View style={s.sectionHeader}>
    <Text style={s.sectionNum}>{num}</Text>
    <Text style={s.sectionTitle}>{title}</Text>
  </View>
)

const Fld = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View style={s.fieldPair}>
    <Text style={s.fieldLabel}>{label}</Text>
    <Text style={bold ? s.fieldBold : s.fieldValue}>{value || '—'}</Text>
  </View>
)

const Li = ({ children }: { children: string }) => (
  <View style={{ flexDirection: 'row', marginBottom: 2.5, paddingLeft: 10 }}>
    <Text style={{ fontSize: 9, color: C.accent, marginRight: 5 }}>{'•'}</Text>
    <Text style={{ fontSize: 9, color: C.text, flex: 1 }}>{children}</Text>
  </View>
)

const Annexe = ({ text, note }: { text: string; note?: string }) => (
  <View>
    <View style={s.annexeRow}>
      <View style={s.annexeBox} />
      <Text style={s.annexeText}>{text}</Text>
    </View>
    {note ? <Text style={s.annexeNote}>{note}</Text> : null}
  </View>
)

const Footer = ({ docRef, page }: { docRef: string; page: string }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerTx}>Ref. {docRef} — Bail d'habitation Loi ALUR — p. {page}</Text>
    <Text style={s.footerTx}>Genere le {new Date().toLocaleDateString('fr-FR')} — Decret n°2015-587</Text>
  </View>
)

// ─── Main ──────────────────────────────────────────────────────────────────

interface ContractPDFProps {
  contract: Contract
  clauses?: ContractClause[]
}

export const ContractPDF = ({ contract, clauses }: ContractPDFProps) => {
  const enabled = (clauses ?? []).filter((c) => c.enabled)
  const cnt     = (contract.content as Record<string, any>) || {}
  const sigMeta = cnt.signatureMetadata || {}
  const docRef  = (contract.id ?? '').substring(0, 8).toUpperCase() || 'BROUILLON'
  const total   = contract.monthlyRent + (contract.charges ?? 0)
  const isMeuble   = cnt.meuble === 'Meuble'
  const zoneTendue = cnt.zoneTendue === 'Oui'
  const dureeLegale = isMeuble ? '1 an renouvelable' : '3 ans renouvelable'
  const typeLabel   = isMeuble ? 'Meuble (art. 25-4 loi 89-462)' : 'Non meuble / Vide (art. 10 loi 89-462)'

  const payLabel: Record<string, string> = {
    virement: 'Virement bancaire', Virement_bancaire: 'Virement bancaire',
    prelevement: 'Prelevement automatique', cheque: 'Cheque bancaire', especes: 'Especes',
  }
  const payMethod = payLabel[cnt.paymentMethod] || cnt.paymentMethod || 'Virement bancaire'

  const dpe = cnt.classeEnergie || ''
  const showDpeWarn = dpe === 'F' || dpe === 'G'

  const hasClausesPage = enabled.length > 0 || !!contract.terms

  return (
    <Document
      title={`Bail - ${contract.property?.title ?? ''}`}
      author="Plateforme Gestion Locative"
      subject="Contrat de location Loi ALUR"
    >

      {/* ── PAGE 1 : Parties & logement ────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.headerBar}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>CONTRAT DE LOCATION</Text>
            <Text style={s.headerSub}>
              {'Bail d\'habitation — Residence principale — ' + (isMeuble ? 'Meuble' : 'Non meuble (Vide)')}
            </Text>
            <Text style={s.headerLegal}>
              Loi n°89-462 du 6 juillet 1989 mod. Loi ALUR du 24 mars 2014 — Decret n°2015-587
            </Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerRef}>Ref. {docRef}</Text>
            <Text style={s.headerRef}>Du {fmtDateShort(contract.startDate)}</Text>
            <Text style={s.headerRef}>au {fmtDateShort(contract.endDate)}</Text>
          </View>
        </View>

        {/* ART 1 — Parties */}
        <View style={s.section}>
          <SecHead num="ART. 1" title="Designation des parties" />
          <View style={s.row}>
            <View style={s.partyCard}>
              <Text style={s.partyLabel}>Le Bailleur (Proprietaire)</Text>
              <Text style={s.partyName}>{contract.owner?.firstName} {contract.owner?.lastName}</Text>
              <Text style={s.partyDetail}>{contract.owner?.email}</Text>
              <Text style={s.partyDetail}>{contract.owner?.phone ? 'Tel : ' + contract.owner.phone : ''}</Text>
              <Text style={s.partyNote}>Qualite : {cnt.qualiteBailleur || 'Proprietaire'}</Text>
            </View>
            <View style={s.partyCardLast}>
              <Text style={s.partyLabel}>Le Locataire</Text>
              <Text style={s.partyName}>{contract.tenant?.firstName} {contract.tenant?.lastName}</Text>
              <Text style={s.partyDetail}>{contract.tenant?.email}</Text>
              <Text style={s.partyDetail}>{contract.tenant?.phone ? 'Tel : ' + contract.tenant.phone : ''}</Text>
              <Text style={s.partyNote}>{cnt.adresseLocataire ? 'Adresse actuelle : ' + cnt.adresseLocataire : ''}</Text>
            </View>
          </View>
        </View>

        {/* ART 2 — Bien */}
        <View style={s.section}>
          <SecHead num="ART. 2" title="Designation du logement" />
          <View style={s.infoBox}>
            <Text style={s.bodyBold}>{contract.property?.title}</Text>
            <Text style={s.body}>
              {contract.property?.address}{', '}{contract.property?.postalCode}{' '}{contract.property?.city}
            </Text>
          </View>
          <View style={s.row}>
            <View style={s.col}>
              <Fld label="Type d'habitat" value={cnt.typeLogement || contract.property?.type || '—'} />
              <Fld label="Surface habitable (loi Boutin)" value={(contract.property?.surface ?? '') + ' m²'} bold />
              <Fld label="Nombre de pieces principales" value={String(contract.property?.bedrooms != null ? contract.property.bedrooms + 1 : '—')} />
              <Fld label="Dont chambres" value={String(contract.property?.bedrooms ?? '—')} />
            </View>
            <View style={s.colL}>
              <Fld label="Etage" value={cnt.etage || 'Non precise'} />
              <Fld label="Regime juridique" value={cnt.regimeJuridique || 'Copropriete'} />
              <Fld label="Type de bail" value={typeLabel} bold />
              <Fld label="Duree legale minimale" value={dureeLegale} />
            </View>
          </View>
          {cnt.annexes ? <Fld label="Annexes et dependances" value={cnt.annexes} /> : null}
          {cnt.equipements ? <Fld label="Equipements" value={cnt.equipements} /> : null}

          <Text style={s.subsectionTitle}>Performance energetique (DPE — decret n°2002-120)</Text>
          <View style={s.row}>
            <View style={s.col}><Fld label="Classe energetique" value={dpe || 'Non communique'} bold /></View>
            <View style={s.colL}><Fld label="Classe GES" value={cnt.ges || 'Non communique'} bold /></View>
          </View>
          {showDpeWarn ? (
            <View style={s.warnBox}>
              <Text style={s.warnTitle}>Logement classe {dpe} — Passoire thermique</Text>
              <Text style={s.warnText}>
                Des restrictions de hausse de loyer s'appliquent (loi Climat et Resilience du 22 aout 2021).
              </Text>
            </View>
          ) : null}
        </View>

        <Footer docRef={docRef} page="1" />
      </Page>

      {/* ── PAGE 2 : Duree & conditions financieres ─────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.headerBar}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>CONDITIONS DU BAIL</Text>
            <Text style={s.headerSub}>Ref. {docRef}</Text>
          </View>
        </View>

        {/* ART 3 — Duree */}
        <View style={s.section}>
          <SecHead num="ART. 3" title="Duree et prise d'effet" />
          <View style={s.row}>
            <View style={s.col}>
              <Fld label="Prise d'effet" value={fmtDate(contract.startDate)} bold />
              <Fld label="Echeance" value={fmtDate(contract.endDate)} bold />
              <Fld label="Duree effective" value={getDuration(contract.startDate, contract.endDate)} />
            </View>
            <View style={s.colL}>
              <Fld label="Duree legale applicable" value={dureeLegale} />
              <Fld label="Reconduction" value="Tacite, pour la meme duree, a l'expiration" />
            </View>
          </View>
          <View style={s.infoBox}>
            <Text style={s.bodyBold}>Preavis de conge du locataire (art. 15 loi 89-462) :</Text>
            {isMeuble
              ? <Li>1 mois pour un logement meuble</Li>
              : <Li>3 mois pour un logement non meuble (droit commun)</Li>
            }
            {!isMeuble
              ? <Li>1 mois en zone tendue ou cas particuliers : mutation, perte d'emploi, premier emploi, sante, RSA, AAH</Li>
              : null
            }
            <Text style={[s.body, { marginTop: 4 }]}>
              Conge par LRAR, acte de commissaire de justice, ou remise en main propre contre recepisse.
            </Text>
            <Text style={s.bodyBold}>Preavis de conge du bailleur :</Text>
            <Li>6 mois avant l'echeance — motifs limites : reprise pour habiter, vente, motif legitime et serieux</Li>
          </View>
        </View>

        {/* ART 4 — Finances */}
        <View style={s.section}>
          <SecHead num="ART. 4" title="Conditions financieres" />

          <View style={s.finGrid}>
            <View style={s.finCell}>
              <Text style={s.finAmount}>{fmtCurrency(contract.monthlyRent)}</Text>
              <Text style={s.finLabel}>Loyer mensuel</Text>
              <Text style={s.finSub}>Hors charges</Text>
            </View>
            {contract.charges != null ? (
              <View style={s.finCell}>
                <Text style={s.finAmount}>{fmtCurrency(contract.charges)}</Text>
                <Text style={s.finLabel}>Provisions charges</Text>
                <Text style={s.finSub}>Regularisation annuelle</Text>
              </View>
            ) : null}
            <View style={s.finCell}>
              <Text style={s.finAmount}>{fmtCurrency(total)}</Text>
              <Text style={s.finLabel}>Total mensuel</Text>
              <Text style={s.finSub}>Charges comprises</Text>
            </View>
            {contract.deposit != null ? (
              <View style={s.finCellLast}>
                <Text style={s.finAmount}>{fmtCurrency(contract.deposit)}</Text>
                <Text style={s.finLabel}>Depot de garantie</Text>
                <Text style={s.finSub}>{isMeuble ? 'Max 2 mois HC' : 'Max 1 mois HC'}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.row}>
            <View style={s.col}><Fld label="Modalite de paiement" value={payMethod} /></View>
            <View style={s.colL}><Fld label="Echeance" value={'Le ' + (cnt.paymentDay || '5') + ' de chaque mois (terme a echoir)'} /></View>
          </View>

          {zoneTendue ? (
            <View style={s.warnBox}>
              <Text style={s.warnTitle}>Zone soumise a l'encadrement des loyers (art. 17 loi 89-462)</Text>
              <Li>{'Loyer de reference : ' + (cnt.loyerReference || 'voir arrete prefectoral') + ' / m² / mois'}</Li>
              <Li>{'Loyer de reference majore (+20%) : ' + (cnt.loyerReferenceMajore || 'voir arrete prefectoral') + ' / m² / mois'}</Li>
              {cnt.complementLoyer ? <Li>{'Complement de loyer : ' + cnt.complementLoyer + ' EUR'}</Li> : null}
            </View>
          ) : null}

          <Text style={s.subsectionTitle}>Revision annuelle — IRL (art. 17-1 loi 89-462)</Text>
          <Text style={s.body}>
            Revision chaque annee a la date anniversaire selon la variation de l'IRL publie par l'INSEE.
            Indice de reference : {cnt.irlTrimestre || '2eme trimestre'} {cnt.irlAnnee || new Date().getFullYear()} (valeur : {cnt.irlValeur || 'voir publication INSEE'}).
          </Text>
          <View style={s.infoBox}>
            <Text style={s.bodyBold}>Formule : Loyer renouvele = Loyer actuel x (Nouvel IRL / Ancien IRL)</Text>
            <Text style={s.body}>
              La revision n'est pas automatique : le bailleur doit en faire la demande. Pas d'effet retroactif au-dela d'un an.
            </Text>
          </View>

          <Text style={s.subsectionTitle}>Depot de garantie (art. 22 loi 89-462)</Text>
          <Text style={s.body}>
            {'Montant : ' + (contract.deposit != null ? fmtCurrency(contract.deposit) : '—') +
            ' — Plafond legal : ' + (isMeuble ? '2 mois HC' : '1 mois HC') +
            ' — Ne produit pas d\'interets.'}
          </Text>
          <Text style={s.body}>
            Restitution : 1 mois si etat des lieux de sortie conforme, 2 mois en cas de differences.
            Retard : majoration de 10% du loyer HC par mois commence.
          </Text>

          <Text style={s.subsectionTitle}>Charges recuperables (decret n°87-713 du 26 aout 1987)</Text>
          <Text style={s.body}>
            Provisions de {contract.charges != null ? fmtCurrency(contract.charges) : '0 EUR'}/mois. Regularisation annuelle sur justificatifs. Decompte par nature transmis au locataire au moins 1 mois avant. Justificatifs disponibles pendant 6 mois.
          </Text>
        </View>

        <Footer docRef={docRef} page="2" />
      </Page>

      {/* ── PAGE 3 : Obligations legales ────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.headerBar}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>OBLIGATIONS LEGALES</Text>
            <Text style={s.headerSub}>Ref. {docRef}</Text>
          </View>
        </View>

        <View style={s.section}>
          <SecHead num="ART. 5" title="Clause resolutoire (art. 24 loi 89-462)" />
          <Text style={s.body}>Le bail sera resilie de plein droit, apres constatation par le juge :</Text>
          <Li>Defaut de paiement du loyer ou des charges, 2 mois apres commandement infructueux</Li>
          <Li>Defaut de paiement du depot de garantie lors de la remise des cles</Li>
          <Li>Defaut d'assurance habitation, 1 mois apres mise en demeure infructueuse</Li>
          <Li>Troubles de voisinage constates par decision de justice passee en force de chose jugee</Li>
        </View>

        <View style={s.section}>
          <SecHead num="ART. 6" title="Obligations du bailleur (art. 6 et 6-1 loi 89-462)" />
          <Li>Delivrer un logement decent, conforme au decret n°2002-120 (surface min. 9 m², hauteur 2,20 m...)</Li>
          <Li>Garantir la jouissance paisible et les vices et defauts caches</Li>
          <Li>Effectuer les reparations autres que locatives necessaires au maintien en etat</Li>
          <Li>Ne pas s'opposer aux amenagements du locataire n'etant pas des transformations</Li>
          <Li>Remettre gratuitement une quittance de loyer sur demande (art. 21 loi 89-462)</Li>
          <Li>Communiquer les decomptes de charges et tenir les justificatifs disponibles 6 mois</Li>
          <Li>Informer le locataire de tout projet de vente ou de mise en copropriete</Li>
          <Li>Respecter la procedure legale pour toute recuperation du logement</Li>
        </View>

        <View style={s.section}>
          <SecHead num="ART. 7" title="Obligations du locataire (art. 7 et 7-1 loi 89-462)" />
          <Li>Payer le loyer et les charges aux termes et conditions convenus</Li>
          <Li>User paisiblement des locaux selon la destination prevue (habitation principale)</Li>
          <Li>Repondre des degradations et pertes survenant pendant le bail, hors force majeure ou vetuste</Li>
          <Li>Prendre en charge l'entretien courant et les menues reparations locatives (decret n°87-712)</Li>
          <Li>Souscrire et maintenir une assurance habitation (risques locatifs) et en justifier annuellement</Li>
          <Li>Ne pas transformer les locaux et equipements sans accord ecrit du bailleur</Li>
          <Li>Laisser executer les travaux d'amelioration, de mise en conformite ou d'urgence</Li>
          <Li>Ne pas ceder le bail ni sous-louer sans accord ecrit du bailleur</Li>
          <Li>Aviser immediatement le bailleur de tout sinistre ou deterioration</Li>
        </View>

        <View style={s.section}>
          <SecHead num="ART. 8" title="Assurance habitation obligatoire" />
          <Text style={s.body}>
            Le locataire doit souscrire une assurance habitation couvrant les risques locatifs (incendie, explosion, degats des eaux) et en justifier lors de la remise des cles, puis annuellement.
          </Text>
          <Text style={s.body}>
            A defaut (apres mise en demeure d'1 mois), le bailleur peut souscrire pour le compte du locataire et en recuperer le cout + 10% par voie de provisions.
          </Text>
        </View>

        <View style={s.section}>
          <SecHead num="ART. 9" title="Etat des lieux (decret n°2016-382 du 30 mars 2016)" />
          <Text style={s.body}>
            Un etat des lieux contradictoire est etabli lors de la remise des cles (entree) et de la restitution (sortie), selon le modele reglementaire, signe par les deux parties et annexe au bail.
          </Text>
          <Text style={s.body}>
            Les differences constatees, imputables au locataire, peuvent etre deduites du depot de garantie apres application de la grille de vetuste. L'usure normale n'est pas imputable au locataire.
          </Text>
        </View>

        <View style={s.section}>
          <SecHead num="ART. 10" title="Solidarite et cession de bail" />
          <Text style={s.body}>
            En cas de pluralite de locataires : solidarite et indivisibilite de toutes les obligations. La solidarite d'un locataire sortant cesse a l'entree d'un nouveau ou au plus tard 6 mois apres son conge (art. 8-1 loi 89-462).
          </Text>
          <Text style={s.body}>
            Toute cession de bail ou sous-location est interdite sans accord ecrit et prealable du bailleur. Le loyer de sous-location ne peut exceder le loyer principal.
          </Text>
        </View>

        <Footer docRef={docRef} page="3" />
      </Page>

      {/* ── PAGE 4 : Annexes obligatoires & clauses interdites ──── */}
      <Page size="A4" style={s.page}>
        <View style={s.headerBar}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>ANNEXES & CLAUSES INTERDITES</Text>
            <Text style={s.headerSub}>Ref. {docRef}</Text>
          </View>
        </View>

        <View style={s.section}>
          <SecHead num="ART. 11" title="Annexes obligatoires (art. 3 loi 89-462)" />
          <Text style={s.body}>
            Documents devant imperativement etre annexes au bail. Leur absence peut engager la responsabilite du bailleur.
          </Text>

          <Text style={s.bodyBold}>Pour tous les baux :</Text>
          <Annexe text="Notice d'information relative aux droits et obligations des locataires et des bailleurs" note="Arrete du 29 mai 2015 — Obligatoire depuis le 1er aout 2015" />
          <Annexe text="Etat des lieux d'entree contradictoire" note="Decret n°2016-382 — Signe par les deux parties" />
          <Annexe text="Etat des risques et pollutions (ERP)" note="Valable 6 mois — Obligatoire pour les zones a risques (PPR, sols pollues, radon...)" />
          <Annexe text="Diagnostic de performance energetique (DPE)" note="Valable 10 ans — Obligatoire depuis le 1er juillet 2007" />

          <Text style={s.bodyBold}>Selon l'age et les caracteristiques du bien :</Text>
          <Annexe text="Constat de risque d'exposition au plomb (CREP)" note="Immeubles avant le 1er janvier 1949 — Valable 1 an si positif, illimite si negatif" />
          <Annexe text="Diagnostic electricite" note="Installations electriques de plus de 15 ans — Valable 6 ans" />
          <Annexe text="Diagnostic gaz" note="Installations de gaz de plus de 15 ans — Valable 6 ans" />
          <Annexe text="Diagnostic amiante" note="Immeubles dont le permis de construire est anterieur au 1er juillet 1997" />
          <Annexe text="Diagnostic bruit" note="Logements proches d'un aeroport, port ou grande infrastructure de transport" />

          {isMeuble ? (
            <View>
              <Text style={s.bodyBold}>Pour les logements meubles :</Text>
              <Annexe text="Inventaire et etat du mobilier" note="Contradictoire, signe par les deux parties — Obligatoire pour les baux meubles" />
            </View>
          ) : null}

          {zoneTendue ? (
            <View>
              <Text style={s.bodyBold}>En zone soumise a l'encadrement des loyers :</Text>
              <Annexe text="Information sur le loyer de reference et le loyer de reference majore" note="Arrete prefectoral en vigueur" />
            </View>
          ) : null}
        </View>

        <View style={s.section}>
          <SecHead num="ART. 12" title="Clauses reputees non ecrites (art. 4 loi 89-462)" />
          <View style={s.errorBox}>
            <Text style={s.errorTitle}>AVERTISSEMENT — Ces clauses sont nulles de plein droit</Text>
            <Text style={s.errorText}>Toute clause ci-dessous inseree dans un bail est reputee non ecrite par la loi.</Text>
          </View>
          <Li>Interdire au locataire d'heberger des personnes ne vivant pas habituellement avec lui</Li>
          <Li>Imposer la souscription d'une assurance aupres d'une compagnie designee</Li>
          <Li>Facturer des frais d'etablissement de quittance, d'etat des lieux ou d'encaissement</Li>
          <Li>Prevoir des frais de relance ou de mise en demeure</Li>
          <Li>Interdire la detention d'animaux de compagnie (hors dangereux, loi du 6 janvier 1999)</Li>
          <Li>Prevoir la responsabilite collective des locataires pour degradation de parties communes</Li>
          <Li>Imposer le paiement du loyer exclusivement par prelevement automatique</Li>
          <Li>Interdire les travaux d'adaptation au handicap ou a la perte d'autonomie</Li>
          <Li>Fixer un depot de garantie superieur aux plafonds legaux (1 ou 2 mois HC)</Li>
          <Li>Mettre a la charge du locataire des charges non recuperables (taxe fonciere, honoraires de gestion...)</Li>
          <Li>Imposer l'accord prealable du bailleur pour recevoir des soins medicaux a domicile</Li>
          <Li>Exiger des documents personnels non autorises (cheques en blanc, photocopie ID conservee...)</Li>
        </View>

        <Footer docRef={docRef} page="4" />
      </Page>

      {/* ── PAGE 5 (optionnelle) : Clauses specifiques ──────────── */}
      {hasClausesPage ? (
        <Page size="A4" style={s.page}>
          <View style={s.headerBar}>
            <View style={s.headerLeft}>
              <Text style={s.headerTitle}>CLAUSES SPECIFIQUES</Text>
              <Text style={s.headerSub}>Ref. {docRef}</Text>
            </View>
          </View>

          {enabled.length > 0 ? (
            <View style={s.section}>
              <SecHead num="ART. 13" title="Clauses specifiques convenues entre les parties" />
              <Text style={s.body}>
                Les clauses suivantes ont ete convenues d'un commun accord. Elles completent les dispositions legales sans pouvoir y deroger au detriment du locataire.
              </Text>
              {enabled.map((clause, i) => (
                <View key={clause.id} style={s.clauseBox}>
                  <View style={s.clauseHead}>
                    <View style={s.clauseBadge}>
                      <Text style={s.clauseBadgeTx}>{i + 1}</Text>
                    </View>
                    <Text style={s.clauseTitle}>{clause.title}</Text>
                    {clause.isCustom ? (
                      <View style={[s.clauseBadge, { backgroundColor: C.purple, marginLeft: 6 }]}>
                        <Text style={s.clauseBadgeTx}>Personnalisee</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={s.clauseBody}>{clause.description}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {contract.terms ? (
            <View style={s.section}>
              <SecHead num={enabled.length > 0 ? 'ART. 14' : 'ART. 13'} title="Conditions particulieres" />
              <Text style={s.body}>{contract.terms}</Text>
            </View>
          ) : null}

          <Footer docRef={docRef} page="5" />
        </Page>
      ) : null}

      {/* ── DERNIERE PAGE : Signatures ──────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.headerBar}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>SIGNATURES</Text>
            <Text style={s.headerSub}>Ref. {docRef}</Text>
          </View>
        </View>

        <View style={s.section}>
          <SecHead num="ART." title="Consentement et signature electronique" />
          <Text style={s.body}>
            Les soussignes declarent avoir pris connaissance de l'integralite du present contrat et l'accepter sans reserve. Etabli en deux exemplaires originaux, dont un remis a chacune des parties.
          </Text>
          <View style={s.infoBox}>
            <Text style={s.bodyBold}>Valeur juridique de la signature electronique :</Text>
            <Text style={s.body}>
              Conforme a l'article 1367 du Code civil et au reglement eIDAS (UE n°910/2014). Chaque signature est horodatee et associee a un condensat SHA-256 du document, constituant une preuve electronique opposable aux tiers.
            </Text>
          </View>
        </View>

        <View style={{ marginVertical: 10 }}>
          <Text style={{ fontSize: 10, textAlign: 'center' }}>
            {'Fait a ' + (contract.property?.city || '___________') + ', le ' +
              (contract.signedAt
                ? fmtDate(contract.signedAt)
                : (contract.signedByOwner || contract.signedByTenant)
                  ? fmtDate(contract.signedByOwner || contract.signedByTenant || new Date().toISOString())
                  : '___________'
              )
            }
          </Text>
        </View>

        <View style={s.sigSection}>
          {/* Bailleur */}
          <View style={s.sigBox}>
            <View style={s.sigHead}>
              <Text style={s.sigHeadTx}>Le Bailleur (Proprietaire)</Text>
            </View>
            <View style={s.sigBody}>
              <Text style={s.sigName}>{contract.owner?.firstName} {contract.owner?.lastName}</Text>
              <Text style={s.sigEmail}>{contract.owner?.email}</Text>
              {contract.signedByOwner ? (
                <View>
                  <Text style={s.sigDate}>Signe le {fmtDate(contract.signedByOwner)}</Text>
                  {contract.ownerSignature ? (
                    <Image style={s.sigImg} src={contract.ownerSignature} />
                  ) : null}
                  {sigMeta.owner ? (
                    <View>
                      <Text style={s.sigMetaOk}>Horodatage : {new Date(sigMeta.owner.timestamp).toLocaleString('fr-FR')}</Text>
                      {sigMeta.owner.ip ? <Text style={s.sigMeta}>IP : {sigMeta.owner.ip}</Text> : null}
                      {sigMeta.owner.contentHash ? (
                        <Text style={s.sigMeta}>Hash SHA-256 : {sigMeta.owner.contentHash.substring(0, 24)}...</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text style={s.sigEmpty}>En attente de signature</Text>
              )}
            </View>
          </View>

          {/* Locataire */}
          <View style={s.sigBoxLast}>
            <View style={s.sigHead}>
              <Text style={s.sigHeadTx}>Le Locataire</Text>
            </View>
            <View style={s.sigBody}>
              <Text style={s.sigName}>{contract.tenant?.firstName} {contract.tenant?.lastName}</Text>
              <Text style={s.sigEmail}>{contract.tenant?.email}</Text>
              {contract.signedByTenant ? (
                <View>
                  <Text style={s.sigDate}>Signe le {fmtDate(contract.signedByTenant)}</Text>
                  {contract.tenantSignature ? (
                    <Image style={s.sigImg} src={contract.tenantSignature} />
                  ) : null}
                  {sigMeta.tenant ? (
                    <View>
                      <Text style={s.sigMetaOk}>Horodatage : {new Date(sigMeta.tenant.timestamp).toLocaleString('fr-FR')}</Text>
                      {sigMeta.tenant.ip ? <Text style={s.sigMeta}>IP : {sigMeta.tenant.ip}</Text> : null}
                      {sigMeta.tenant.contentHash ? (
                        <Text style={s.sigMeta}>Hash SHA-256 : {sigMeta.tenant.contentHash.substring(0, 24)}...</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text style={s.sigEmpty}>En attente de signature</Text>
              )}
            </View>
          </View>
        </View>

        <View style={[s.infoBox, { marginTop: 18 }]}>
          <Text style={{ fontSize: 7.5, color: C.muted, textAlign: 'center' }}>
            Signature electronique conforme au reglement eIDAS (UE n°910/2014) — Art. 1366 et 1367 du Code civil
          </Text>
          <Text style={{ fontSize: 7.5, color: C.muted, textAlign: 'center', marginTop: 2 }}>
            Ce document constitue un contrat electronique ayant la meme valeur probante qu'un ecrit sur support papier.
          </Text>
        </View>

        <Footer docRef={docRef} page="Fin" />
      </Page>
    </Document>
  )
}
