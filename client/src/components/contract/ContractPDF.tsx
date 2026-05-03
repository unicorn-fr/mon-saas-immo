/**
 * ContractPDF — Bail d'habitation Loi ALUR
 * Structure conforme au modèle type du Décret n°2015-587 du 29 mai 2015
 * Sections I à XI avec sous-sections A/B/C, style Smartloc
 * DA Maison · nuit #1a1a2e · caramel #c4976a
 */
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
  night:    '#1a1a2e',
  caramel:  '#c4976a',
  caramelL: '#fdf5ec',
  caramelB: '#e8c9a0',
  tenant:   '#1b5e3b',
  tenantL:  '#edf7f2',
  tenantB:  '#9fd4ba',
  owner:    '#1a3270',
  ownerL:   '#eaf0fb',
  ink:      '#0d0c0a',
  inkMid:   '#5a5754',
  inkFaint: '#9e9b96',
  border:   '#e4e1db',
  muted:    '#f4f2ee',
  surface:  '#ffffff',
  warnBg:   '#fdf5ec',
  warnBdr:  '#c4976a',
  warnTx:   '#92400e',
  errBg:    '#fef2f2',
  errBdr:   '#fca5a5',
  errTx:    '#9b1c1c',
}

const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 50,
    paddingHorizontal: 42,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: C.ink,
    lineHeight: 1.55,
    backgroundColor: C.surface,
  },

  // ── En-tête ──────────────────────────────────────────────────────────────
  masthead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: C.night,
  },
  mastheadLeft: { flex: 1 },
  mastheadTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.night, letterSpacing: 0.6, textTransform: 'uppercase' },
  mastheadSub:   { fontSize: 8, color: C.inkMid, marginTop: 2 },
  mastheadLegal: { fontSize: 6.5, color: C.inkFaint, marginTop: 1 },
  mastheadRight: { alignItems: 'flex-end', minWidth: 90 },
  mastheadRef:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.caramel },
  mastheadDate:  { fontSize: 6.5, color: C.inkFaint, marginTop: 2 },

  // ── Bande accord ─────────────────────────────────────────────────────────
  accordBand: {
    backgroundColor: C.night,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.surface },
  accordSub:   { fontSize: 7, color: '#9ca3af', marginTop: 1 },

  // ── Tableau récap ─────────────────────────────────────────────────────────
  tableWrap: { borderWidth: 1, borderColor: C.border, borderRadius: 4, marginBottom: 10, overflow: 'hidden' },
  tableRow:  { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border },
  tableRowL: { flexDirection: 'row' },
  tableLbl:  { width: '42%', padding: '5 8', fontSize: 7.5, color: C.inkMid, backgroundColor: C.muted, fontFamily: 'Helvetica-Bold' },
  tableVal:  { flex: 1, padding: '5 8', fontSize: 8.5, color: C.ink, fontFamily: 'Helvetica-Bold' },

  // ── Grille financière ─────────────────────────────────────────────────────
  finGrid:     { flexDirection: 'row', borderWidth: 1, borderColor: C.caramelB, borderRadius: 4, backgroundColor: C.caramelL, marginBottom: 10, overflow: 'hidden' },
  finCell:     { flex: 1, padding: '8 10', alignItems: 'center', borderRightWidth: 1, borderRightColor: C.caramelB },
  finCellLast: { flex: 1, padding: '8 10', alignItems: 'center' },
  finAmt:      { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.night },
  finLbl:      { fontSize: 7, color: C.inkMid, marginTop: 2, textAlign: 'center' },
  finSub:      { fontSize: 6, color: C.inkFaint, marginTop: 1 },

  // ── Cartes parties ────────────────────────────────────────────────────────
  partiesRow:    { flexDirection: 'row', marginBottom: 8 },
  partyCard:     { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden', marginRight: 8 },
  partyCardLast: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden' },
  partyHeadO:    { paddingVertical: 5, paddingHorizontal: 8, backgroundColor: C.owner },
  partyHeadT:    { paddingVertical: 5, paddingHorizontal: 8, backgroundColor: C.tenant },
  partyHeadTx:   { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.surface },
  partyBody:     { padding: 8 },
  partyName:     { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 2 },
  partyDetail:   { fontSize: 7.5, color: C.inkMid, marginBottom: 1 },

  // ── Section principale (I, II, III…) ─────────────────────────────────────
  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: C.night,
    borderRadius: 3,
  },
  secNum:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.caramel, marginRight: 6 },
  secTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.surface, flex: 1 },

  // ── Sous-section (A, B, C…) ───────────────────────────────────────────────
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 3,
    borderLeftWidth: 2.5,
    borderLeftColor: C.caramel,
    paddingLeft: 7,
  },
  subLetter: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.caramel, marginRight: 5 },
  subTitle:  { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.night },

  // ── Corps ────────────────────────────────────────────────────────────────
  body:      { fontSize: 8.5, color: C.ink, marginBottom: 3, textAlign: 'justify' },
  bodyBold:  { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 3 },
  bodySmall: { fontSize: 7.5, color: C.inkMid, marginBottom: 2, textAlign: 'justify' },

  // ── Listes ────────────────────────────────────────────────────────────────
  li:      { fontSize: 8.5, color: C.ink, marginBottom: 2 },
  liSmall: { fontSize: 7.5, color: C.inkMid, marginBottom: 2 },

  // ── Points numérotés (1°, 2°…) ───────────────────────────────────────────
  numRow:   { flexDirection: 'row', marginBottom: 4 },
  numLabel: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.caramel, width: 22 },
  numBody:  { flex: 1, fontSize: 8.5, color: C.ink, textAlign: 'justify' },

  // ── Boîtes ────────────────────────────────────────────────────────────────
  infoBox: { backgroundColor: C.ownerL, borderLeftWidth: 2.5, borderLeftColor: C.owner, borderRadius: 3, padding: 7, marginBottom: 6, marginTop: 2 },
  warnBox: { backgroundColor: C.warnBg, borderLeftWidth: 2.5, borderLeftColor: C.warnBdr, borderRadius: 3, padding: 7, marginBottom: 6, marginTop: 2 },
  warnTx:  { fontSize: 7.5, color: C.warnTx },
  warnTit: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.warnTx, marginBottom: 2 },
  errBox:  { backgroundColor: C.errBg, borderLeftWidth: 2.5, borderLeftColor: C.errBdr, borderRadius: 3, padding: 7, marginBottom: 6 },
  errTit:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.errTx, marginBottom: 2 },
  errTx:   { fontSize: 7.5, color: C.errTx },

  // ── Cases à cocher ────────────────────────────────────────────────────────
  checkRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 },
  checkBox:  { width: 10, height: 10, borderWidth: 1, borderColor: C.border, borderRadius: 2, marginRight: 6, marginTop: 0.5 },
  checkTx:   { fontSize: 8, color: C.ink, flex: 1 },
  checkNote: { fontSize: 7, color: C.inkFaint, paddingLeft: 16, marginBottom: 3 },

  // ── Clauses personnalisées ────────────────────────────────────────────────
  clauseBox:   { borderWidth: 1, borderColor: C.border, borderRadius: 3, marginBottom: 6 },
  clauseHead:  { backgroundColor: C.muted, paddingVertical: 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  clauseBadge: { backgroundColor: C.night, borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1, marginRight: 5 },
  clauseBadgeTx: { fontSize: 6, color: C.surface, fontFamily: 'Helvetica-Bold' },
  clauseCustom:  { backgroundColor: C.caramel, borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1, marginLeft: 5 },
  clauseTitle:   { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.ink },
  clauseBody:    { padding: 7, fontSize: 8, color: C.inkMid, textAlign: 'justify' },

  // ── Signatures ────────────────────────────────────────────────────────────
  sigRow:       { flexDirection: 'row', marginTop: 14 },
  sigBox:       { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, marginRight: 12, overflow: 'hidden' },
  sigBoxLast:   { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden' },
  sigHeadO:     { backgroundColor: C.owner, padding: 7 },
  sigHeadT:     { backgroundColor: C.tenant, padding: 7 },
  sigHeadTx:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.surface },
  sigBody:      { padding: 10, minHeight: 110 },
  sigName:      { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 1 },
  sigEmail:     { fontSize: 7, color: C.inkFaint, marginBottom: 6 },
  sigDate:      { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.tenant, marginBottom: 3 },
  sigImg:       { width: 150, height: 55, objectFit: 'contain', marginBottom: 4 },
  sigEmpty:     { fontSize: 7.5, color: C.inkFaint, fontStyle: 'italic', marginTop: 12, borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 5 },
  sigMeta:      { fontSize: 6, color: C.inkFaint, marginTop: 1 },
  sigMetaOk:    { fontSize: 6, color: C.tenant, marginTop: 1 },

  // ── Séparateur & divers ───────────────────────────────────────────────────
  divider: { borderTopWidth: 0.5, borderTopColor: C.border, marginVertical: 6 },
  row2:    { flexDirection: 'row', marginBottom: 4 },
  col2:    { flex: 1, marginRight: 8 },
  col2L:   { flex: 1 },
  fp:      { marginBottom: 4 },
  fLbl:    { fontSize: 7, color: C.inkFaint, marginBottom: 0.5 },
  fVal:    { fontSize: 8.5, color: C.ink },
  fValB:   { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.ink },

  // ── Pied de page ─────────────────────────────────────────────────────────
  footer: {
    position: 'absolute', bottom: 18, left: 42, right: 42,
    borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 4,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerTx:     { fontSize: 6, color: C.inkFaint },
  footerAccent: { fontSize: 6, color: C.caramel },
})

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtDateS = (d: string) => new Date(d).toLocaleDateString('fr-FR')
const fmtEUR = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
const getDuration = (s: string, e: string) => {
  const m = Math.round((new Date(e).getTime() - new Date(s).getTime()) / (30.44 * 86400000))
  const y = Math.floor(m / 12), mo = m % 12
  if (y > 0 && mo > 0) return `${y} an${y > 1 ? 's' : ''} et ${mo} mois`
  if (y > 0) return `${y} an${y > 1 ? 's' : ''}`
  return `${m} mois`
}

// ─── Micro-composants ──────────────────────────────────────────────────────
/** Section principale I, II, III… */
const Sec = ({ num, title }: { num: string; title: string }) => (
  <View style={s.secHeader}>
    <Text style={s.secNum}>{num}</Text>
    <Text style={s.secTitle}>{title.toUpperCase()}</Text>
  </View>
)

/** Sous-section A, B, C… */
const Sub = ({ letter, title }: { letter: string; title: string }) => (
  <View style={s.subHeader}>
    <Text style={s.subLetter}>{letter}.</Text>
    <Text style={s.subTitle}>{title}</Text>
  </View>
)

/** Champ label / valeur */
const F = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View style={s.fp}>
    <Text style={s.fLbl}>{label}</Text>
    <Text style={bold ? s.fValB : s.fVal}>{value || '—'}</Text>
  </View>
)

/** Point numéroté 1°, 2°… */
const Pt = ({ num, children }: { num: string; children: string }) => (
  <View style={s.numRow}>
    <Text style={s.numLabel}>{num}</Text>
    <Text style={s.numBody}>{children}</Text>
  </View>
)

/** Puce tiret */
const Li = ({ children, small }: { children: string; small?: boolean }) => (
  <View style={{ flexDirection: 'row', marginBottom: 2, paddingLeft: 8 }}>
    <Text style={{ fontSize: small ? 7.5 : 8.5, color: C.caramel, marginRight: 4 }}>–</Text>
    <Text style={{ fontSize: small ? 7.5 : 8.5, color: small ? C.inkMid : C.ink, flex: 1 }}>{children}</Text>
  </View>
)

/** Case à cocher */
const Check = ({ text, note }: { text: string; note?: string }) => (
  <View>
    <View style={s.checkRow}><View style={s.checkBox} /><Text style={s.checkTx}>{text}</Text></View>
    {note ? <Text style={s.checkNote}>{note}</Text> : null}
  </View>
)

/** Pied de page fixe */
const Footer = ({ ref: docRef, page }: { ref: string; page: string }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerTx}>Bail d'habitation · Loi n°89-462 · Loi ALUR 24 mars 2014 · Décret n°2015-587 · Réf. {docRef}</Text>
    <Text style={s.footerAccent}>{page}</Text>
  </View>
)

// ─── Composant principal ────────────────────────────────────────────────────
interface ContractPDFProps {
  contract: Contract
  clauses?: ContractClause[]
}

export const ContractPDF = ({ contract, clauses }: ContractPDFProps) => {
  const enabled  = (clauses ?? []).filter(c => c.enabled)
  const cnt      = (contract.content as Record<string, any>) || {}
  const sigMeta  = cnt.signatureMetadata || {}
  const docRef   = (contract.id ?? '').substring(0, 8).toUpperCase() || 'BROUILLON'
  const total    = contract.monthlyRent + (contract.charges ?? 0)
  const isMeuble = cnt.meuble === 'Meuble'
  const zoneTendue = cnt.zoneTendue === 'Oui'
  const dpe        = cnt.classeEnergie || ''
  const dpeWarn    = dpe === 'F' || dpe === 'G'

  const dureeLabel  = isMeuble ? '1 an' : '3 ans'
  const dureeArt    = isMeuble ? 'art. 25-7 loi 89-462' : 'art. 10 loi 89-462'
  const typeLabel   = isMeuble ? 'Bail meublé (art. 25-4)' : 'Bail vide (art. 10)'
  const depositMax  = isMeuble ? '2 mois de loyer HC' : '1 mois de loyer HC'

  const payMode: Record<string, string> = {
    virement: 'Virement bancaire', Virement_bancaire: 'Virement bancaire',
    prelevement: 'Prélèvement automatique', cheque: 'Chèque bancaire', especes: 'Espèces',
  }
  const payMethod = payMode[cnt.paymentMethod] || cnt.paymentMethod || 'Virement bancaire'
  const hasCustomPage = enabled.length > 0 || !!contract.terms

  const Watermark = () => (
    <View style={{ position: 'absolute', top: '42%', left: '8%', opacity: 0.035 }}>
      <Text style={{ fontSize: 68, fontFamily: 'Helvetica-Bold', color: C.night }}>BAILIO</Text>
    </View>
  )

  return (
    <Document
      title={`Bail – ${contract.property?.title ?? ''}`}
      author="Bailio – Plateforme de gestion locative"
      subject="Contrat de location – Modèle type Décret n°2015-587"
      keywords="bail, location, ALUR, contrat, loi 89-462, décret 2015-587"
    >

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 1 — Récapitulatif · Section I (Parties) · Section II (Objet)
          ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Watermark />

        {/* En-tête */}
        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>Contrat de location — {isMeuble ? 'Logement meublé' : 'Logement vide'}</Text>
            <Text style={s.mastheadSub}>Usage exclusif de résidence principale · {typeLabel} · Loi n°89-462 du 6 juillet 1989 modifiée par la Loi ALUR du 24 mars 2014</Text>
            <Text style={s.mastheadLegal}>Établi conformément au modèle type — Décret n°2015-587 du 29 mai 2015</Text>
          </View>
          <View style={s.mastheadRight}>
            <Text style={s.mastheadRef}>Réf. {docRef}</Text>
            <Text style={s.mastheadDate}>Généré le {new Date().toLocaleDateString('fr-FR')}</Text>
          </View>
        </View>

        {/* Bande accord */}
        <View style={s.accordBand}>
          <View>
            <Text style={s.accordTitle}>CONDITIONS CONVENUES ENTRE LES PARTIES</Text>
            <Text style={s.accordSub}>Récapitulatif — termes acceptés par le bailleur et le(s) locataire(s)</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 7, color: '#9ca3af' }}>{fmtDateS(contract.startDate)} → {fmtDateS(contract.endDate)}</Text>
            <Text style={{ fontSize: 7, color: C.caramel, marginTop: 2 }}>{getDuration(contract.startDate, contract.endDate)}</Text>
          </View>
        </View>

        {/* Tableau récapitulatif */}
        <View style={s.tableWrap}>
          {[
            ['Adresse du bien', `${contract.property?.address ?? '—'}, ${contract.property?.postalCode ?? ''} ${contract.property?.city ?? ''}`],
            ['Surface habitable (Loi Boutin)', `${contract.property?.surface ?? '—'} m²`],
            ['Type de bail', typeLabel],
            ['Durée légale minimale', `${dureeLabel} renouvelable (${dureeArt})`],
            ['Prise d\'effet', fmtDate(contract.startDate)],
            ['Échéance contractuelle', fmtDate(contract.endDate)],
            ['Loyer mensuel hors charges', fmtEUR(contract.monthlyRent)],
            ['Provisions pour charges', contract.charges != null ? fmtEUR(contract.charges) : 'Sans charges récupérables'],
            ['Total mensuel TCC', fmtEUR(total)],
            ['Dépôt de garantie', contract.deposit != null ? `${fmtEUR(contract.deposit)}  (max ${depositMax})` : '—'],
            ['Modalité de paiement', `${payMethod} — le ${cnt.paymentDay || '5'} de chaque mois`],
            ['Révision IRL', `${cnt.irlTrimestre || '2ème trimestre'} ${cnt.irlAnnee || new Date().getFullYear()}${cnt.irlValeur ? ' — Indice : ' + cnt.irlValeur : ''}`],
          ].map(([l, v], i, arr) => (
            <View key={i} style={i < arr.length - 1 ? s.tableRow : s.tableRowL}>
              <Text style={s.tableLbl}>{l}</Text>
              <Text style={s.tableVal}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Grille financière */}
        <View style={s.finGrid}>
          <View style={s.finCell}>
            <Text style={s.finAmt}>{fmtEUR(contract.monthlyRent)}</Text>
            <Text style={s.finLbl}>Loyer HC / mois</Text>
          </View>
          {contract.charges != null && (
            <View style={s.finCell}>
              <Text style={s.finAmt}>{fmtEUR(contract.charges)}</Text>
              <Text style={s.finLbl}>Charges / mois</Text>
            </View>
          )}
          <View style={s.finCell}>
            <Text style={s.finAmt}>{fmtEUR(total)}</Text>
            <Text style={s.finLbl}>Total TCC / mois</Text>
          </View>
          {contract.deposit != null && (
            <View style={s.finCellLast}>
              <Text style={s.finAmt}>{fmtEUR(contract.deposit)}</Text>
              <Text style={s.finLbl}>Dépôt de garantie</Text>
              <Text style={s.finSub}>max {depositMax}</Text>
            </View>
          )}
        </View>

        {/* ─── I. DÉSIGNATION DES PARTIES ────────────────────────────────── */}
        <Sec num="I." title="Désignation des parties" />
        <View style={s.partiesRow}>
          <View style={s.partyCard}>
            <View style={s.partyHeadO}><Text style={s.partyHeadTx}>LE BAILLEUR</Text></View>
            <View style={s.partyBody}>
              <Text style={s.partyName}>{contract.owner?.firstName} {contract.owner?.lastName}</Text>
              <Text style={s.partyDetail}>Qualité : {cnt.qualiteBailleur || 'Propriétaire bailleur'}</Text>
              <Text style={s.partyDetail}>{contract.owner?.email}</Text>
              {contract.owner?.phone ? <Text style={s.partyDetail}>Tél. {contract.owner.phone}</Text> : null}
              {cnt.siret ? <Text style={s.partyDetail}>SIRET : {cnt.siret}</Text> : null}
              {cnt.adresseBailleur ? <Text style={s.partyDetail}>Adresse : {cnt.adresseBailleur}</Text> : null}
            </View>
          </View>
          <View style={s.partyCardLast}>
            <View style={s.partyHeadT}><Text style={s.partyHeadTx}>LE(S) LOCATAIRE(S)</Text></View>
            <View style={s.partyBody}>
              <Text style={s.partyName}>{contract.tenant?.firstName} {contract.tenant?.lastName}</Text>
              <Text style={s.partyDetail}>{contract.tenant?.email}</Text>
              {contract.tenant?.phone ? <Text style={s.partyDetail}>Tél. {contract.tenant.phone}</Text> : null}
              {cnt.adresseLocataire ? <Text style={s.partyDetail}>Adresse actuelle : {cnt.adresseLocataire}</Text> : null}
              {cnt.professionLocataire ? <Text style={s.partyDetail}>Profession : {cnt.professionLocataire}</Text> : null}
            </View>
          </View>
        </View>

        {/* ─── II. OBJET DU CONTRAT ──────────────────────────────────────── */}
        <Sec num="II." title="Objet du contrat" />

        <Sub letter="A" title="Consistance du logement" />
        <View style={s.infoBox}>
          <Text style={s.bodyBold}>{contract.property?.title}</Text>
          <Text style={s.body}>{contract.property?.address}, {contract.property?.postalCode} {contract.property?.city}</Text>
        </View>
        <View style={s.row2}>
          <View style={s.col2}>
            <F label="Type de logement" value={cnt.typeLogement || contract.property?.type || '—'} />
            <F label="Surface habitable (Loi Boutin)" value={`${contract.property?.surface ?? '—'} m²`} bold />
            <F label="Nbre de pièces principales" value={String(contract.property?.bedrooms != null ? contract.property.bedrooms + 1 : '—')} />
            <F label="Étage / Bâtiment" value={cnt.etage || 'Non précisé'} />
          </View>
          <View style={s.col2L}>
            <F label="Régime juridique" value={cnt.regimeJuridique || 'Copropriété'} />
            <F label="DPE (Diagnostic de Performance Énergétique)" value={`Classe ${dpe || 'NC'} — GES : ${cnt.ges || 'NC'}`} bold />
            <F label="Numéro fiscal du bien" value={cnt.numeroFiscal || 'Non renseigné'} />
          </View>
        </View>
        {dpeWarn && (
          <View style={s.warnBox}>
            <Text style={s.warnTit}>⚠ Logement classé {dpe} — Passoire thermique (Loi Climat et Résilience 22 août 2021)</Text>
            <Text style={s.warnTx}>Hausse de loyer interdite lors du renouvellement ou d'un nouveau bail. Les logements classés G sont progressivement interdits à la location (à partir du 1er janvier 2025 pour les nouvelles locations).</Text>
          </View>
        )}

        <Sub letter="B" title="Destination — Usage exclusif d'habitation à titre de résidence principale" />
        <Text style={s.body}>
          Le logement est loué pour usage exclusif d'habitation à titre de résidence principale du preneur au sens de l'article 2 de la loi du 6 juillet 1989. Le locataire s'engage à y établir sa résidence principale effective. Toute activité commerciale, artisanale ou professionnelle est interdite sans accord écrit préalable du bailleur.
        </Text>

        <Sub letter="C" title="Annexes privatives et locaux accessoires" />
        <Text style={s.body}>{cnt.annexes || 'Néant — aucune annexe privative attachée au logement.'}</Text>

        {isMeuble && (
          <>
            <Sub letter="D" title="Équipements du logement meublé (art. 25-4 loi 89-462)" />
            <Text style={s.body}>{cnt.equipements || 'Liste des meubles et équipements détaillée dans l\'inventaire joint en annexe obligatoire.'}</Text>
          </>
        )}

        <Sub letter={isMeuble ? 'E' : 'D'} title="Équipements d'accès aux technologies de l'information" />
        <Text style={s.body}>{cnt.equipementsNumeriques || 'Accès Internet : selon disponibilités du bien. Antenne TV collective ou individuelle : selon équipements en place.'}</Text>

        <Footer ref={docRef} page="1 / Fin" />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 2 — Section III (Durée) · Section IV (Conditions financières)
          ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Watermark />
        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>Durée & Conditions financières — Réf. {docRef}</Text>
            <Text style={s.mastheadSub}>{contract.property?.address}, {contract.property?.city}</Text>
          </View>
          <View style={s.mastheadRight}>
            <Text style={s.mastheadRef}>{fmtDateS(contract.startDate)} → {fmtDateS(contract.endDate)}</Text>
          </View>
        </View>

        {/* ─── III. DATE ET DURÉE ────────────────────────────────────────── */}
        <Sec num="III." title="Date de prise d'effet et durée du contrat" />
        <View style={s.row2}>
          <View style={s.col2}>
            <F label="Date de prise d'effet" value={fmtDate(contract.startDate)} bold />
            <F label="Durée légale minimale" value={`${dureeLabel} (${dureeArt})`} />
            <F label="Durée effective convenue" value={getDuration(contract.startDate, contract.endDate)} />
          </View>
          <View style={s.col2L}>
            <F label="Échéance contractuelle" value={fmtDate(contract.endDate)} bold />
            <F label="Reconduction" value="Tacite, par périodes de même durée" />
          </View>
        </View>
        <Text style={s.body}>
          Le présent contrat prend effet le {fmtDate(contract.startDate)} pour une durée de {getDuration(contract.startDate, contract.endDate)}. À l'échéance, il est reconduit tacitement par périodes de {dureeLabel}, sauf congé donné dans les formes et délais légaux.
        </Text>

        <Sub letter="A" title="Congé du locataire (art. 15 loi 89-462)" />
        <Text style={s.body}>
          Le locataire peut donner congé à tout moment. Préavis : {isMeuble ? '1 mois (bail meublé)' : '3 mois en droit commun ; 1 mois en zone tendue ou en cas de mutation professionnelle, perte d\'emploi involontaire, premier emploi, état de santé justifié, bénéficiaire RSA ou AAH'}. Congé par LRAR, acte de commissaire de justice ou remise contre récépissé.
        </Text>

        <Sub letter="B" title="Congé du bailleur (art. 15 loi 89-462)" />
        <Text style={s.body}>
          Le bailleur peut donner congé 6 mois avant l'échéance pour trois motifs exclusifs : (1) reprise pour habiter ou y loger un proche, (2) vente du logement — avec droit de préemption du locataire pendant les deux premiers mois —, (3) motif légitime et sérieux (notamment inexécution des obligations). Le congé pour vente doit contenir l'offre de vente dans les conditions prévues à l'article 15-II de la loi.
        </Text>

        <View style={s.divider} />

        {/* ─── IV. CONDITIONS FINANCIÈRES ───────────────────────────────── */}
        <Sec num="IV." title="Conditions financières" />

        <Sub letter="A" title="Fixation du loyer initial" />
        <Pt num="1°" children={`Montant du loyer mensuel hors charges : ${fmtEUR(contract.monthlyRent)}`} />
        {zoneTendue ? (
          <>
            <Pt num="2°" children={`Zone soumise à l'encadrement des loyers (art. 17 loi 89-462) :`} />
            <View style={s.warnBox}>
              <Text style={s.warnTit}>Encadrement des loyers — mentions obligatoires (art. 17 loi 89-462)</Text>
              <Text style={s.warnTx}>
                Loyer de référence applicable : {cnt.loyerReference || '— €/m²/mois (voir arrêté préfectoral)'}{'\n'}
                Loyer de référence majoré (+20 %) : {cnt.loyerReferenceMajore || '— €/m²/mois'}{'\n'}
                {cnt.complementLoyer ? `Complément de loyer librement convenu (caractéristiques déterminantes de localisation ou de confort) : ${cnt.complementLoyer} €/mois` : 'Complément de loyer : Néant'}
              </Text>
            </View>
            {cnt.dernierLoyer && (
              <View style={s.infoBox}>
                <Text style={s.bodyBold}>Loyer du locataire précédent (obligation légale en zone tendue) :</Text>
                <Text style={s.body}>
                  Le loyer appliqué lors du dernier contrat s'élevait à {cnt.dernierLoyer} €/mois.
                  {cnt.dernierLoyerDate ? ` Dernier versement : ${cnt.dernierLoyerDate}.` : ''}
                  {cnt.dernierIndexDate ? ` Dernière révision IRL le : ${cnt.dernierIndexDate}.` : ''}
                  {cnt.dernierIrlValeur ? ` Indice de référence alors appliqué : ${cnt.dernierIrlValeur}.` : ''}
                </Text>
              </View>
            )}
            {!cnt.dernierLoyer && (
              <View style={s.infoBox}>
                <Text style={s.bodyBold}>Loyer du locataire précédent :</Text>
                <Text style={s.bodySmall}>Première mise en location ou loyer du locataire précédent non renseigné. Le bailleur certifie que ce logement est mis en location pour la première fois ou que le loyer précédent est conforme aux plafonds en vigueur.</Text>
              </View>
            )}
          </>
        ) : (
          <Pt num="2°" children="Le bien n'est pas situé en zone d'encadrement des loyers — loyer librement fixé." />
        )}

        <Sub letter="B" title="Révision annuelle du loyer — IRL (art. 17-1 loi 89-462)" />
        <Text style={s.body}>
          Le loyer est révisé une fois par an, à chaque date anniversaire du bail, selon la variation de l'Indice de Référence des Loyers (IRL) publié trimestriellement par l'INSEE.
        </Text>
        <Pt num="1°" children={`Indice de référence retenu : ${cnt.irlTrimestre || '2ème trimestre'} ${cnt.irlAnnee || new Date().getFullYear()}${cnt.irlValeur ? ` — valeur : ${cnt.irlValeur}` : ''}`} />
        <Pt num="2°" children="Formule : Nouveau loyer = Loyer actuel × (Dernier IRL publié ÷ IRL de référence). La révision n'est pas automatique et ne peut avoir d'effet rétroactif sur plus d'une année. Le loyer gelé reste applicable si le bailleur ne demande pas la révision." />

        <Sub letter="C" title="Charges récupérables (décret n°87-713 du 26 août 1987)" />
        <Pt num="1°" children={`Provisions mensuelles sur charges : ${contract.charges != null ? fmtEUR(contract.charges) + '/mois' : 'Sans charges — loyer charges comprises non récupérables'}`} />
        <Pt num="2°" children="Régularisation annuelle sur présentation des justificatifs. Le décompte des charges par nature est transmis au locataire au moins 1 mois avant la date de régularisation. Les justificatifs sont tenus à disposition 6 mois après envoi du décompte." />
        {isMeuble && <Pt num="3°" children="Pour les baux meublés : les charges peuvent être fixées au forfait (pas de régularisation). Si forfait : le montant forfaitaire ne peut excéder les charges réelles." />}

        <Sub letter="D" title="Modalités de paiement" />
        <Pt num="1°" children={`Mode de paiement : ${payMethod}`} />
        <Pt num="2°" children={`Échéance : le ${cnt.paymentDay || '5'} de chaque mois — terme à échoir (paiement en début de mois pour le mois en cours)`} />
        <Pt num="3°" children="Le bailleur est tenu de délivrer quittance gratuitement au locataire qui en fait la demande (art. 21 loi 89-462). La quittance peut être transmise par voie dématérialisée avec l'accord du locataire." />

        <Footer ref={docRef} page="2 / Fin" />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 3 — Section V (Travaux) · VI (Garanties) · VII (Solidarité) · VIII (Clause résolutoire)
          ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Watermark />
        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>Travaux · Garanties · Solidarité · Résiliation — Réf. {docRef}</Text>
          </View>
        </View>

        {/* ─── V. TRAVAUX ────────────────────────────────────────────────── */}
        <Sec num="V." title="Travaux" />

        <Sub letter="A" title="Travaux réalisés par le bailleur entre deux locations (art. 17-1 loi 89-462)" />
        <Text style={s.body}>
          Le bailleur déclare avoir réalisé depuis la fin du précédent contrat de location les travaux d'amélioration, de mise en conformité avec les caractéristiques de décence ou d'économie d'énergie suivants :
        </Text>
        {cnt.travauxBailleur ? (
          <View style={s.infoBox}>
            <Text style={s.bodyBold}>Travaux déclarés :</Text>
            <Text style={s.body}>{cnt.travauxBailleur}</Text>
            {cnt.montantTravaux && <Text style={s.body}>Montant total : {cnt.montantTravaux} €</Text>}
          </View>
        ) : (
          <View style={{ padding: '6 8', borderWidth: 1, borderColor: C.border, borderRadius: 3, marginBottom: 6 }}>
            <Text style={s.bodySmall}>Néant — Aucun travaux réalisé depuis la fin du précédent contrat de location, ou première mise en location du bien.</Text>
          </View>
        )}
        <Text style={s.bodySmall}>
          Lorsque les travaux d'amélioration réalisés depuis la fin du dernier contrat représentent un montant ≥ une année de loyer (hors charges), le bailleur peut fixer librement le loyer (art. 17-1 II loi 89-462). Ce déplafonnement doit être justifié par les factures de travaux.
        </Text>

        <Sub letter="B" title="Travaux pouvant être réalisés par le locataire" />
        <Text style={s.body}>
          Le locataire peut effectuer des aménagements n'emportant pas transformation de la chose louée (peinture, pose de moquette amovible, cloisons légères démontables). Toute transformation nécessite l'accord écrit préalable du bailleur. À défaut, le bailleur peut exiger la remise en état à la charge du locataire, ou conserver les transformations sans indemnité (art. 1730 C. civ.).
        </Text>
        <Text style={s.body}>
          Par dérogation : le locataire en situation de handicap ou de perte d'autonomie peut effectuer des travaux d'adaptation du logement à ses frais, sans que le bailleur puisse s'y opposer sans motif sérieux et légitime (art. 7-1 loi 89-462). Ces travaux n'ont pas à être remis en état à la fin du bail.
        </Text>

        <Sub letter="C" title="Obligations d'entretien courant du locataire (décret n°87-712)" />
        <Text style={s.body}>
          Sont à la charge du locataire : le maintien en état de propreté des locaux et équipements, les menues réparations (remplacement des joints, ampoules, fusibles, piles, flexibles de douche, abattants WC), l'entretien des appareils (détartrage robinets, nettoyage grilles VMC), le graissage serrures et paumelles. Le locataire répond des dégradations par défaut d'entretien, à l'exclusion de la vétusté normale.
        </Text>

        <View style={s.divider} />

        {/* ─── VI. GARANTIES ─────────────────────────────────────────────── */}
        <Sec num="VI." title="Garanties" />

        <Sub letter="A" title="Dépôt de garantie (art. 22 loi 89-462)" />
        <Pt num="1°" children={`Montant : ${contract.deposit != null ? fmtEUR(contract.deposit) : 'Néant'} — Plafond légal : ${depositMax}.`} />
        <Pt num="2°" children="Versement : à la signature du bail. Ne produit pas d'intérêts au profit du locataire." />
        <Pt num="3°" children="Restitution dans un délai d'1 mois si l'état des lieux de sortie est conforme à l'état des lieux d'entrée, de 2 mois en cas de différences imputables au locataire. Ce délai court à compter de la remise des clés." />
        <Pt num="4°" children="Retard de restitution : majoration de 10 % du loyer mensuel HC par mois commencé de retard (art. 22 al. 8 loi 89-462). Seules les sommes réellement dues (dégradations au-delà de la vétusté, loyers impayés) peuvent être retenues." />

        {cnt.caution && (
          <>
            <Sub letter="B" title="Caution solidaire (art. 22-1 loi 89-462)" />
            <Text style={s.body}>
              Un acte de cautionnement {cnt.typeCaution === 'solidaire' ? 'solidaire' : 'simple'} est annexé au présent bail. La caution s'engage, dans les conditions et limites définies audit acte, à satisfaire aux obligations du locataire en cas de défaillance de ce dernier. Les mentions manuscrites obligatoires doivent figurer dans l'acte de caution (art. 22-1 al. 3 loi 89-462).
            </Text>
          </>
        )}

        <View style={s.divider} />

        {/* ─── VII. CLAUSE DE SOLIDARITÉ ─────────────────────────────────── */}
        <Sec num="VII." title="Clause de solidarité (art. 8-1 loi 89-462)" />
        <Text style={s.body}>
          En cas de pluralité de locataires co-signataires, ceux-ci sont tenus solidairement et indivisiblement à l'égard du bailleur de l'ensemble des obligations locatives : paiement du loyer, des charges, restitution du logement en bon état. La solidarité d'un colocataire sortant cesse à la date d'entrée de son remplaçant dans le bail, ou à défaut, six mois après la prise d'effet du congé qu'il a régulièrement donné.
        </Text>

        <View style={s.divider} />

        {/* ─── VIII. CLAUSE RÉSOLUTOIRE ──────────────────────────────────── */}
        <Sec num="VIII." title="Clause résolutoire de plein droit (art. 24 loi 89-462)" />
        <View style={s.errBox}>
          <Text style={s.errTit}>Résiliation judiciaire de plein droit — constatée par le tribunal judiciaire</Text>
          <Text style={s.errTx}>Le non-respect des obligations ci-dessous entraîne la résiliation du bail après procédure judiciaire.</Text>
        </View>
        <Pt num="1°" children="Non-paiement du loyer ou des charges aux termes convenus, deux mois après commandement de payer délivré par huissier (commissaire de justice) resté infructueux." />
        <Pt num="2°" children="Non-paiement du dépôt de garantie lors de la remise des clés, deux mois après commandement." />
        <Pt num="3°" children="Défaut d'assurance habitation, un mois après mise en demeure restée sans effet." />
        <Pt num="4°" children="Troubles de voisinage constatés par décision de justice définitive passée en force de chose jugée." />
        <Text style={s.bodySmall}>
          Le juge peut accorder des délais de grâce au locataire en cas de difficultés de paiement (art. 24 al. 6 loi 89-462). La commission de coordination des actions de prévention des expulsions (CCAPEX) est saisie par le bailleur dès les premiers impayés, conformément à la procédure de prévention des expulsions.
        </Text>

        <Footer ref={docRef} page="3 / Fin" />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 4 — Section IX (Honoraires) · X (Obligations & Assurance)
          ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Watermark />
        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>Honoraires · Obligations des parties — Réf. {docRef}</Text>
          </View>
        </View>

        {/* ─── IX. HONORAIRES ────────────────────────────────────────────── */}
        <Sec num="IX." title="Honoraires de location (loi n°70-9 du 2 janvier 1970)" />
        {cnt.honoraires ? (
          <>
            <Sub letter="A" title="Honoraires à la charge du bailleur" />
            <Pt num="1°" children={`Honoraires de rédaction du bail et de mise en location : ${cnt.honorairesBailleur || 'voir mandat'}`} />
            <Sub letter="B" title="Honoraires à la charge du locataire (art. 5 loi 89-462 — plafonnés)" />
            <Pt num="1°" children={`Honoraires de visite, constitution du dossier, rédaction du bail : ${cnt.honorairesLocataire || 'voir mandat'} — plafond légal : ${(contract.property?.surface ?? 1) * (zoneTendue ? 10 : 12)} €`} />
            <Pt num="2°" children={`État des lieux d'entrée : ${cnt.honorairesEdl || '3 €/m²'} — plafond légal : ${(contract.property?.surface ?? 1) * 3} €`} />
          </>
        ) : (
          <Text style={s.body}>
            <Text style={s.bodyBold}>NÉANT. </Text>
            Le présent bail est conclu directement entre le bailleur et le locataire, sans intermédiaire. Aucun honoraire d'agence n'est dû par l'une ou l'autre des parties.
          </Text>
        )}

        <View style={s.divider} />

        {/* ─── X. OBLIGATIONS DES PARTIES & CONDITIONS PARTICULIÈRES ─────── */}
        <Sec num="X." title="Obligations des parties et conditions particulières" />

        <Sub letter="A" title="Obligations du bailleur (art. 6 et 6-1 loi 89-462)" />
        <Text style={s.body}>
          Le bailleur est tenu de remettre au locataire un logement décent, en bon état d'usage et de réparation, conforme aux caractéristiques du décret de décence (n°2002-120 du 30 janvier 2002) : surface ≥ 9 m², hauteur sous plafond ≥ 2,20 m, équipements en état de fonctionnement, absence de risques manifestes pour la sécurité et la santé.
        </Text>
        <Li>Garantir la jouissance paisible et l'absence de vices cachés</Li>
        <Li>Effectuer toutes réparations autres que locatives nécessaires au maintien en état (y compris grosses réparations, art. 606 C. civ.)</Li>
        <Li>Remettre gratuitement une quittance sur demande (art. 21 loi 89-462)</Li>
        <Li>Respecter la procédure légale en cas de vente ou de reprise du logement</Li>
        <Li>En cas de travaux excédant 21 jours : indemniser le locataire proportionnellement à la privation de jouissance (art. 1724 C. civ.)</Li>

        <Sub letter="B" title="Obligations du locataire (art. 7 loi 89-462)" />
        <Li>Payer le loyer et les charges aux termes et conditions convenus</Li>
        <Li>User paisiblement du logement conformément à sa destination (résidence principale)</Li>
        <Li>Prendre en charge l'entretien courant et les réparations locatives (décret n°87-712)</Li>
        <Li>Répondre des dégradations survenues, sauf force majeure, faute du bailleur ou fait d'un tiers</Li>
        <Li>Laisser exécuter les travaux urgents sans indemnité inférieure à 21 jours</Li>
        <Li>Ne pas transformer les locaux sans accord écrit du bailleur</Li>
        <Li>Ne pas céder le bail ni sous-louer sans accord écrit du bailleur</Li>

        <Sub letter="C" title="Assurance habitation (art. 7 g) et 7-3 loi 89-462)" />
        <Text style={s.body}>
          Le locataire est tenu de s'assurer contre les risques locatifs (incendie, explosion, dégâts des eaux) et d'en justifier à la remise des clés, puis chaque année à la date anniversaire du bail par la production d'une attestation d'assurance. À défaut de production de l'attestation dans le délai d'un mois suivant mise en demeure, le bailleur peut souscrire une assurance pour le compte du locataire, dont les primes sont récupérées par dixièmes avec le loyer (art. 7-3 loi 89-462).
        </Text>

        <Sub letter="D" title="Sous-location et cession (art. 8 loi 89-462)" />
        <Text style={s.body}>
          Toute sous-location totale ou partielle est strictement interdite sans accord préalable et écrit du bailleur portant à la fois sur le principe et sur le montant du loyer. En cas d'autorisation, le loyer de sous-location ne peut excéder le loyer principal. Toute mise en location sur les plateformes de type Airbnb constitue une sous-location soumise à cet accord. La cession du bail est également soumise à l'accord écrit du bailleur.
        </Text>

        <Sub letter="E" title="Élection de domicile et juridiction compétente" />
        <Text style={s.body}>
          Pour l'exécution du présent contrat et de ses suites, les parties font élection de domicile respectivement aux adresses déclarées dans le présent acte. Tout litige relatif à l'interprétation ou à l'exécution du présent bail relève de la compétence exclusive du Tribunal judiciaire du lieu de situation de l'immeuble loué.
        </Text>

        <Footer ref={docRef} page="4 / Fin" />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 5 — Section XI (Annexes obligatoires) · Clauses interdites
          ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Watermark />
        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>Annexes obligatoires — Réf. {docRef}</Text>
          </View>
        </View>

        {/* ─── XI. ANNEXES ───────────────────────────────────────────────── */}
        <Sec num="XI." title="Annexes légales obligatoires (art. 3 loi 89-462)" />
        <Text style={s.body}>
          Les documents suivants doivent impérativement être annexés au présent bail. Leur absence ne rend pas le bail nul mais prive le bailleur de certains droits (notamment le droit d'invoquer certaines clauses ou de récupérer des charges spécifiques).
        </Text>

        <Sub letter="A" title="Documents obligatoires pour tous les baux" />
        <Check text="Notice d'information relative aux droits et obligations des locataires et des bailleurs" note="Arrêté du 29 mai 2015 — Modèle officiel DGALN — Obligatoire depuis le 1er août 2015" />
        <Check text="État des lieux d'entrée contradictoire (modèle réglementaire)" note="Décret n°2016-382 du 30 mars 2016 — Signé par les deux parties — Coût partagé si huissier" />
        <Check text="État des risques et pollutions (ERP)" note="Art. L. 125-5 C. envir. — Valable 6 mois — Risques naturels, technologiques, sismiques, sols pollués, radon" />
        <Check text="Diagnostic de Performance Énergétique (DPE)" note="Art. L. 134-1 CCH — Valable 10 ans — Obligatoire depuis le 1er juillet 2007" />
        <Check text="Attestation d'assurance habitation du locataire" note="Risques locatifs couverts — Fournie à la remise des clés, puis à chaque renouvellement annuel" />

        <Sub letter="B" title="Documents selon l'ancienneté et les caractéristiques du bien" />
        <Check text="Constat de risque d'exposition au plomb (CREP)" note="Immeubles construits avant le 1er janvier 1949 — Durée : 1 an si positif, illimitée si négatif" />
        <Check text="Diagnostic amiante (parties privatives)" note="Permis de construire antérieur au 1er juillet 1997 — Recommandé même si non systématiquement obligatoire" />
        <Check text="Diagnostic des installations électriques intérieures" note="Installations de plus de 15 ans — Valable 6 ans" />
        <Check text="Diagnostic des installations de gaz naturel" note="Installations de plus de 15 ans — Valable 6 ans" />
        <Check text="Information sur les nuisances sonores aériennes" note="Zones couvertes par un plan de gêne sonore (PGS) — Obligatoire dans les zones de bruit définies" />
        {isMeuble && <Check text="Inventaire détaillé et état du mobilier" note="Obligatoire pour tous les baux meublés — Contradictoire, signé par les deux parties — Annexe II décret 2015-587" />}
        {zoneTendue && <Check text="Arrêté préfectoral fixant les loyers de référence applicables sur la commune" note="Zone d'encadrement des loyers — À joindre obligatoirement en zone tendue" />}
        {cnt.caution && <Check text="Acte de cautionnement signé par la caution" note="Avec mentions manuscrites obligatoires (art. 22-1 loi 89-462) — Acte séparé du bail" />}

        <Sub letter="C" title="Documents complémentaires recommandés" />
        <Check text="Grille de vétusté applicable (accord collectif de location ou arrêté préfectoral)" note="Permet de distinguer l'usure normale des dégradations imputables au locataire lors de la restitution du dépôt" />
        <Check text="Liste des charges récupérables applicables" note="Décret n°87-713 du 26 août 1987 — Utile en cas de contestation lors de la régularisation annuelle" />
        <Check text="Règlement de copropriété (ou règlement intérieur)" note="Clauses relatives aux parties communes et à l'usage de l'immeuble opposables au locataire" />

        <View style={s.divider} />

        <Sub letter="D" title="Clauses réputées non écrites — nulles de plein droit (art. 4 loi 89-462)" />
        <View style={s.errBox}>
          <Text style={s.errTit}>Ces clauses sont nulles et réputées non écrites si elles figurent au bail — elles ne lient pas le locataire</Text>
        </View>
        <Li small>Interdire au locataire d'héberger des personnes ne vivant pas habituellement avec lui</Li>
        <Li small>Imposer la souscription d'une assurance auprès d'une compagnie désignée par le bailleur</Li>
        <Li small>Prévoir le paiement de frais de quittance, d'état des lieux ou d'encaissement</Li>
        <Li small>Facturer des frais de relance ou de mise en demeure</Li>
        <Li small>Interdire la détention d'animaux de compagnie (hors animaux dangereux)</Li>
        <Li small>Prévoir la responsabilité collective des locataires pour les parties communes</Li>
        <Li small>Imposer le paiement exclusivement par prélèvement automatique</Li>
        <Li small>Interdire les travaux d'adaptation au handicap autorisés par la loi</Li>
        <Li small>Fixer un dépôt de garantie supérieur aux plafonds légaux (1 ou 2 mois HC)</Li>
        <Li small>Mettre à la charge du locataire la taxe foncière ou les honoraires de gestion locative</Li>
        <Li small>Exiger des documents personnels non autorisés par l'art. 22-2 (chèques en blanc, photocopie carte bancaire)</Li>

        <Footer ref={docRef} page="5 / Fin" />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 6 (optionnelle) — Conditions particulières & clauses libres
          ══════════════════════════════════════════════════════════════════════ */}
      {hasCustomPage && (
        <Page size="A4" style={s.page}>
          <Watermark />
          <View style={s.masthead}>
            <View style={s.mastheadLeft}>
              <Text style={s.mastheadTitle}>Conditions particulières convenues — Réf. {docRef}</Text>
              <Text style={s.mastheadSub}>Clauses librement négociées et acceptées par les deux parties — art. 4 loi 89-462</Text>
            </View>
          </View>

          <Sec num="XII." title="Conditions particulières librement convenues (art. 4 loi 89-462)" />
          <Text style={s.body}>
            Les clauses ci-après ont été librement négociées et acceptées d'un commun accord. Elles complètent les dispositions légales sans pouvoir y déroger au détriment du locataire. Elles sont réputées non écrites si elles contreviennent à l'ordre public locatif.
          </Text>

          {enabled.map((clause, i) => (
            <View key={clause.id} style={s.clauseBox}>
              <View style={s.clauseHead}>
                <View style={s.clauseBadge}><Text style={s.clauseBadgeTx}>{i + 1}</Text></View>
                <Text style={s.clauseTitle}>{clause.title}</Text>
                {clause.isCustom && <View style={s.clauseCustom}><Text style={s.clauseBadgeTx}>Clause personnalisée</Text></View>}
              </View>
              <Text style={s.clauseBody}>{clause.description}</Text>
            </View>
          ))}

          {contract.terms && (
            <View style={s.clauseBox}>
              <View style={s.clauseHead}>
                <Text style={s.clauseTitle}>Conditions particulières additionnelles</Text>
              </View>
              <Text style={s.clauseBody}>{contract.terms}</Text>
            </View>
          )}

          <Footer ref={docRef} page="6 / Fin" />
        </Page>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DERNIÈRE PAGE — Signatures & consentement
          ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Watermark />
        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>Signatures — Réf. {docRef}</Text>
            <Text style={s.mastheadSub}>Consentement exprès des parties — art. 1366 et 1367 C. civ. — Règlement eIDAS n°910/2014</Text>
          </View>
        </View>

        {/* Base légale */}
        <View style={s.infoBox}>
          <Text style={s.bodyBold}>Valeur juridique des signatures électroniques :</Text>
          <Text style={s.body}>
            Conformément aux articles 1366 et 1367 du Code civil et au règlement européen eIDAS (UE n°910/2014), les signatures électroniques ci-dessous ont la même valeur probante qu'une signature manuscrite. Chaque signature est horodatée et associée à une empreinte cryptographique SHA-256 du document signé, constituant une preuve électronique opposable aux tiers.
          </Text>
        </View>

        {/* Déclaration de connaissance */}
        <View style={{ padding: 8, backgroundColor: C.muted, borderRadius: 4, marginBottom: 12 }}>
          <Text style={{ fontSize: 7.5, color: C.inkMid, textAlign: 'justify', lineHeight: 1.6 }}>
            Les soussignés déclarent avoir pris connaissance de l'intégralité du présent contrat (pages 1 à {hasCustomPage ? '6' : '5'}) et de la totalité de ses annexes légales, et l'accepter sans réserve. Chaque partie reconnaît avoir reçu un exemplaire du présent acte. En apposant leur signature ci-dessous, les parties expriment leur consentement exprès, libre, éclairé et irrévocable aux termes du présent bail, conformément aux articles 1366 et 1367 du Code civil français et au règlement eIDAS (UE n°910/2014).
          </Text>
        </View>

        {/* Lieu et date */}
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 9.5, color: C.inkMid }}>
            {'Fait à '}
            <Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>{contract.property?.city || '___________'}</Text>
            {', le '}
            <Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>
              {contract.signedAt
                ? fmtDate(contract.signedAt)
                : (contract.signedByOwner || contract.signedByTenant)
                  ? fmtDate(contract.signedByOwner || contract.signedByTenant || new Date().toISOString())
                  : '___________________________'}
            </Text>
            {', en deux exemplaires originaux'}
          </Text>
        </View>

        {/* Blocs signature */}
        <View style={s.sigRow}>
          {/* Bailleur */}
          <View style={s.sigBox}>
            <View style={s.sigHeadO}><Text style={s.sigHeadTx}>LE BAILLEUR — Propriétaire</Text></View>
            <View style={s.sigBody}>
              <Text style={s.sigName}>{contract.owner?.firstName} {contract.owner?.lastName}</Text>
              <Text style={s.sigEmail}>{contract.owner?.email}</Text>
              {contract.signedByOwner ? (
                <>
                  <Text style={s.sigDate}>✓ Signé le {fmtDate(contract.signedByOwner)}</Text>
                  {contract.ownerSignature && <Image style={s.sigImg} src={contract.ownerSignature} />}
                  {sigMeta.owner && (
                    <>
                      <Text style={s.sigMetaOk}>Horodatage : {new Date(sigMeta.owner.timestamp).toLocaleString('fr-FR')}</Text>
                      {sigMeta.owner.ip && <Text style={s.sigMeta}>IP : {sigMeta.owner.ip}</Text>}
                      {sigMeta.owner.contentHash && <Text style={s.sigMeta}>SHA-256 : {sigMeta.owner.contentHash.substring(0, 24)}…</Text>}
                    </>
                  )}
                </>
              ) : (
                <Text style={s.sigEmpty}>En attente de signature du bailleur</Text>
              )}
            </View>
          </View>

          {/* Locataire */}
          <View style={s.sigBoxLast}>
            <View style={s.sigHeadT}><Text style={s.sigHeadTx}>LE(S) LOCATAIRE(S)</Text></View>
            <View style={s.sigBody}>
              <Text style={s.sigName}>{contract.tenant?.firstName} {contract.tenant?.lastName}</Text>
              <Text style={s.sigEmail}>{contract.tenant?.email}</Text>
              {contract.signedByTenant ? (
                <>
                  <Text style={s.sigDate}>✓ Signé le {fmtDate(contract.signedByTenant)}</Text>
                  {contract.tenantSignature && <Image style={s.sigImg} src={contract.tenantSignature} />}
                  {sigMeta.tenant && (
                    <>
                      <Text style={s.sigMetaOk}>Horodatage : {new Date(sigMeta.tenant.timestamp).toLocaleString('fr-FR')}</Text>
                      {sigMeta.tenant.ip && <Text style={s.sigMeta}>IP : {sigMeta.tenant.ip}</Text>}
                      {sigMeta.tenant.contentHash && <Text style={s.sigMeta}>SHA-256 : {sigMeta.tenant.contentHash.substring(0, 24)}…</Text>}
                    </>
                  )}
                </>
              ) : (
                <Text style={s.sigEmpty}>En attente de signature du(des) locataire(s)</Text>
              )}
            </View>
          </View>
        </View>

        {/* Mention légale finale */}
        <View style={{ marginTop: 14, padding: 7, borderWidth: 1, borderColor: C.border, borderRadius: 4 }}>
          <Text style={{ fontSize: 6.5, color: C.inkFaint, textAlign: 'justify', lineHeight: 1.6 }}>
            Document généré par Bailio (bailio.fr) — Plateforme de gestion locative. Ce bail est établi conformément au modèle type défini par le Décret n°2015-587 du 29 mai 2015 pris en application de la Loi n°89-462 du 6 juillet 1989, modifiée par la Loi ALUR du 24 mars 2014. Sections I à {hasCustomPage ? 'XII' : 'XI'} — Réf. {docRef}. Les parties conservent ce document pendant toute la durée du bail et 3 ans après son terme. Bailio n'est pas un cabinet juridique ; ce document n'est pas un avis juridique. En cas de litige, consultez un professionnel du droit.
          </Text>
        </View>

        <Footer ref={docRef} page="Fin" />
      </Page>
    </Document>
  )
}
