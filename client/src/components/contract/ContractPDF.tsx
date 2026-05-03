/**
 * ContractPDF — Bail d'habitation Loi ALUR
 * Conforme au Décret n°2015-587 du 29 mai 2015 (modèle type de bail)
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

// ─── Palette Maison ────────────────────────────────────────────────────────
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

// ─── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: C.ink,
    lineHeight: 1.5,
    backgroundColor: C.surface,
  },

  // En-tête principal
  masthead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: C.night,
  },
  mastheadLeft: { flex: 1 },
  mastheadTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.night, letterSpacing: 0.8 },
  mastheadSub: { fontSize: 8, color: C.inkMid, marginTop: 2 },
  mastheadLegal: { fontSize: 7, color: C.inkFaint, marginTop: 1 },
  mastheadRight: { alignItems: 'flex-end' },
  mastheadRef: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.caramel },
  mastheadDate: { fontSize: 7, color: C.inkFaint, marginTop: 2 },

  // Bande "accord des parties"
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
  accordSub: { fontSize: 7, color: '#9ca3af', marginTop: 1 },

  // Tableau récapitulatif
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  tableRowLast: { flexDirection: 'row' },
  tableLbl: {
    width: '40%',
    padding: '5 8',
    fontSize: 8,
    color: C.inkMid,
    backgroundColor: C.muted,
    fontFamily: 'Helvetica-Bold',
  },
  tableVal: {
    flex: 1,
    padding: '5 8',
    fontSize: 9,
    color: C.ink,
    fontFamily: 'Helvetica-Bold',
  },
  tableWrap: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },

  // Cartes parties
  partiesRow: { flexDirection: 'row', marginBottom: 10 },
  partyCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  partyCardRight: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  partyHead: { paddingVertical: 5, paddingHorizontal: 8 },
  partyHeadOwner: { backgroundColor: C.owner },
  partyHeadTenant: { backgroundColor: C.tenant },
  partyHeadTx: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.surface },
  partyBody: { padding: 8 },
  partyName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 2 },
  partyDetail: { fontSize: 7.5, color: C.inkMid, marginBottom: 1 },

  // Titre d'article
  artHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: C.caramel,
    paddingLeft: 7,
  },
  artNum: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.caramel, marginRight: 5 },
  artTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.night },

  // Corps de texte
  body: { fontSize: 8.5, color: C.ink, marginBottom: 3, textAlign: 'justify' },
  bodyBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 3 },
  bodySmall: { fontSize: 7.5, color: C.inkMid, marginBottom: 2, textAlign: 'justify' },
  li: { fontSize: 8.5, color: C.ink, marginBottom: 2, paddingLeft: 10 },

  // Boîtes info / warn / error
  infoBox: {
    backgroundColor: C.ownerL,
    borderLeftWidth: 2.5,
    borderLeftColor: C.owner,
    borderRadius: 3,
    padding: 7,
    marginBottom: 6,
    marginTop: 2,
  },
  tenantBox: {
    backgroundColor: C.tenantL,
    borderLeftWidth: 2.5,
    borderLeftColor: C.tenant,
    borderRadius: 3,
    padding: 7,
    marginBottom: 6,
    marginTop: 2,
  },
  warnBox: {
    backgroundColor: C.warnBg,
    borderLeftWidth: 2.5,
    borderLeftColor: C.warnBdr,
    borderRadius: 3,
    padding: 7,
    marginBottom: 6,
    marginTop: 2,
  },
  warnTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.warnTx, marginBottom: 2 },
  warnTxt: { fontSize: 7.5, color: C.warnTx },
  errBox: {
    backgroundColor: C.errBg,
    borderLeftWidth: 2.5,
    borderLeftColor: C.errBdr,
    borderRadius: 3,
    padding: 7,
    marginBottom: 6,
  },
  errTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.errTx, marginBottom: 2 },
  errTxt: { fontSize: 7.5, color: C.errTx },

  // Grille financière
  finGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: C.caramelB,
    borderRadius: 4,
    backgroundColor: C.caramelL,
    marginBottom: 8,
    overflow: 'hidden',
  },
  finCell: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: C.caramelB,
  },
  finCellLast: { flex: 1, padding: 8, alignItems: 'center' },
  finAmt: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.night },
  finLbl: { fontSize: 7, color: C.inkMid, marginTop: 2 },
  finSub: { fontSize: 6.5, color: C.inkFaint, marginTop: 1 },

  // Cases à cocher annexes
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 },
  checkBox: { width: 10, height: 10, borderWidth: 1, borderColor: C.border, borderRadius: 2, marginRight: 6, marginTop: 0.5 },
  checkTx: { fontSize: 8, color: C.ink, flex: 1 },
  checkNote: { fontSize: 7, color: C.inkFaint, paddingLeft: 16, marginBottom: 3 },

  // Clauses
  clauseBox: { borderWidth: 1, borderColor: C.border, borderRadius: 3, marginBottom: 6 },
  clauseHead: { backgroundColor: C.muted, paddingVertical: 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  clauseBadge: { backgroundColor: C.night, borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1, marginRight: 5 },
  clauseBadgeTx: { fontSize: 6, color: C.surface, fontFamily: 'Helvetica-Bold' },
  clauseCustomBadge: { backgroundColor: C.caramel, borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1, marginLeft: 5 },
  clauseTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.ink },
  clauseBody: { padding: 7, fontSize: 8, color: C.inkMid, textAlign: 'justify' },

  // Séparateur
  divider: { borderTopWidth: 0.5, borderTopColor: C.border, marginVertical: 7 },

  // Signatures
  sigSection: { marginTop: 14, flexDirection: 'row' },
  sigBox: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, marginRight: 12, overflow: 'hidden' },
  sigBoxLast: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden' },
  sigHeadOwner: { backgroundColor: C.owner, padding: 7 },
  sigHeadTenant: { backgroundColor: C.tenant, padding: 7 },
  sigHeadTx: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.surface },
  sigBody: { padding: 10, minHeight: 120 },
  sigName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 1 },
  sigEmail: { fontSize: 7, color: C.inkFaint, marginBottom: 6 },
  sigDate: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.tenant, marginBottom: 3 },
  sigImg: { width: 150, height: 55, objectFit: 'contain', marginBottom: 5 },
  sigEmpty: { fontSize: 7.5, color: C.inkFaint, fontStyle: 'italic', marginTop: 14, borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 5 },
  sigMeta: { fontSize: 6, color: C.inkFaint, marginTop: 1 },
  sigMetaOk: { fontSize: 6, color: C.tenant, marginTop: 1 },

  // Pied de page
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerTx: { fontSize: 6, color: C.inkFaint },
  footerAccent: { fontSize: 6, color: C.caramel },

  // Sous-titre de section
  subTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.night,
    marginTop: 5,
    marginBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingBottom: 2,
  },

  // Champs F
  fp: { marginBottom: 4 },
  fLbl: { fontSize: 7, color: C.inkFaint, marginBottom: 0.5 },
  fVal: { fontSize: 9, color: C.ink },
  fValBold: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.ink },
  row2: { flexDirection: 'row', marginBottom: 4 },
  col2: { flex: 1, marginRight: 8 },
  col2L: { flex: 1 },
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

// ─── Sous-composants ───────────────────────────────────────────────────────
const Art = ({ num, title }: { num: string; title: string }) => (
  <View style={s.artHeader}>
    <Text style={s.artNum}>{num}</Text>
    <Text style={s.artTitle}>{title}</Text>
  </View>
)

const F = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View style={s.fp}>
    <Text style={s.fLbl}>{label}</Text>
    <Text style={bold ? s.fValBold : s.fVal}>{value || '—'}</Text>
  </View>
)

const Li = ({ children }: { children: string }) => (
  <View style={{ flexDirection: 'row', marginBottom: 2, paddingLeft: 8 }}>
    <Text style={{ fontSize: 8.5, color: C.caramel, marginRight: 4 }}>–</Text>
    <Text style={{ fontSize: 8.5, color: C.ink, flex: 1 }}>{children}</Text>
  </View>
)

const LiSmall = ({ children }: { children: string }) => (
  <View style={{ flexDirection: 'row', marginBottom: 2, paddingLeft: 8 }}>
    <Text style={{ fontSize: 7.5, color: C.caramel, marginRight: 4 }}>–</Text>
    <Text style={{ fontSize: 7.5, color: C.inkMid, flex: 1 }}>{children}</Text>
  </View>
)

const Check = ({ text, note }: { text: string; note?: string }) => (
  <View>
    <View style={s.checkRow}>
      <View style={s.checkBox} />
      <Text style={s.checkTx}>{text}</Text>
    </View>
    {note ? <Text style={s.checkNote}>{note}</Text> : null}
  </View>
)

const Footer = ({ docRef, page }: { docRef: string; page: string }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerTx}>Bail d'habitation · Loi n°89-462 · Loi ALUR du 24 mars 2014 · Décret n°2015-587 · Réf. {docRef}</Text>
    <Text style={s.footerAccent}>p. {page}</Text>
  </View>
)

// ─── Composant principal ────────────────────────────────────────────────────
interface ContractPDFProps {
  contract: Contract
  clauses?: ContractClause[]
}

export const ContractPDF = ({ contract, clauses }: ContractPDFProps) => {
  const enabled    = (clauses ?? []).filter((c) => c.enabled)
  const cnt        = (contract.content as Record<string, any>) || {}
  const sigMeta    = cnt.signatureMetadata || {}
  const docRef     = (contract.id ?? '').substring(0, 8).toUpperCase() || 'BROUILLON'
  const total      = contract.monthlyRent + (contract.charges ?? 0)
  const isMeuble   = cnt.meuble === 'Meuble'
  const zoneTendue = cnt.zoneTendue === 'Oui'
  const dpe        = cnt.classeEnergie || ''
  const dpeWarn    = dpe === 'F' || dpe === 'G'

  const payLabel: Record<string, string> = {
    virement: 'Virement bancaire', Virement_bancaire: 'Virement bancaire',
    prelevement: 'Prélèvement automatique', cheque: 'Chèque bancaire', especes: 'Espèces',
  }
  const payMethod   = payLabel[cnt.paymentMethod] || cnt.paymentMethod || 'Virement bancaire'
  const dureeLegale = isMeuble ? '1 an renouvelable (art. 25-7 loi 89-462)' : '3 ans renouvelable (art. 10 loi 89-462)'
  const typeLabel   = isMeuble ? 'Bail meublé (art. 25-4)' : 'Bail vide (art. 10)'
  const hasClausesPage = enabled.length > 0 || !!contract.terms

  const BailioWatermark = () => (
    <View style={{ position: 'absolute', top: '40%', left: '10%', opacity: 0.04 }}>
      <Text style={{ fontSize: 72, fontFamily: 'Helvetica-Bold', color: C.night }}>
        BAILIO
      </Text>
    </View>
  )

  return (
    <Document
      title={`Bail – ${contract.property?.title ?? ''}`}
      author="Bailio – Plateforme de gestion locative"
      subject="Contrat de location Loi ALUR – Décret n°2015-587"
      keywords="bail, location, ALUR, contrat, loi 89-462"
    >

      {/* ═══ PAGE 1 — Parties & Récapitulatif ═════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <BailioWatermark />

        {/* En-tête */}
        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>CONTRAT DE LOCATION — {isMeuble ? 'MEUBLÉ' : 'VIDE'}</Text>
            <Text style={s.mastheadSub}>Résidence principale · {typeLabel} · Loi n°89-462 du 6 juillet 1989 modifiée par la Loi ALUR du 24 mars 2014</Text>
            <Text style={s.mastheadLegal}>Décret n°2015-587 du 29 mai 2015 relatif aux contrats types de location de logement à usage de résidence principale</Text>
          </View>
          <View style={s.mastheadRight}>
            <Text style={s.mastheadRef}>Réf. {docRef}</Text>
            <Text style={s.mastheadDate}>Généré le {new Date().toLocaleDateString('fr-FR')}</Text>
          </View>
        </View>

        {/* Bande "Conditions convenues entre les parties" */}
        <View style={s.accordBand}>
          <View>
            <Text style={s.accordTitle}>CONDITIONS CONVENUES ENTRE LES PARTIES</Text>
            <Text style={s.accordSub}>Récapitulatif des termes acceptés et signés par le bailleur et le locataire</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 7, color: '#9ca3af' }}>{fmtDateS(contract.startDate)} → {fmtDateS(contract.endDate)}</Text>
            <Text style={{ fontSize: 7, color: C.caramel, marginTop: 2 }}>{getDuration(contract.startDate, contract.endDate)}</Text>
          </View>
        </View>

        {/* Tableau récapitulatif */}
        <View style={s.tableWrap}>
          {[
            { l: 'Adresse du bien', v: `${contract.property?.address ?? '—'}, ${contract.property?.postalCode ?? ''} ${contract.property?.city ?? ''}` },
            { l: 'Surface habitable (Loi Boutin)', v: `${contract.property?.surface ?? '—'} m²` },
            { l: 'Type de bail', v: typeLabel },
            { l: 'Durée légale', v: dureeLegale },
            { l: 'Prise d\'effet', v: fmtDate(contract.startDate) },
            { l: 'Échéance contractuelle', v: fmtDate(contract.endDate) },
            { l: 'Loyer mensuel hors charges', v: fmtEUR(contract.monthlyRent) },
            { l: 'Provisions pour charges', v: contract.charges != null ? fmtEUR(contract.charges) : 'Sans charges récupérables' },
            { l: 'Total mensuel TCC', v: fmtEUR(total) },
            { l: 'Dépôt de garantie', v: contract.deposit != null ? fmtEUR(contract.deposit) + (isMeuble ? '  (max 2 mois HC)' : '  (max 1 mois HC)') : '—' },
            { l: 'Mode de paiement', v: `${payMethod} — le ${cnt.paymentDay || '5'} de chaque mois (terme à échoir)` },
            { l: 'Révision annuelle (IRL)', v: `${cnt.irlTrimestre || '2ème trimestre'} ${cnt.irlAnnee || new Date().getFullYear()}${cnt.irlValeur ? ` — valeur : ${cnt.irlValeur}` : ''}` },
          ].map((r, i, arr) => (
            <View key={i} style={i < arr.length - 1 ? s.tableRow : s.tableRowLast}>
              <Text style={s.tableLbl}>{r.l}</Text>
              <Text style={s.tableVal}>{r.v}</Text>
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
              <Text style={s.finSub}>{isMeuble ? 'max 2 mois HC' : 'max 1 mois HC'}</Text>
            </View>
          )}
        </View>

        {/* ART. 1 — Parties */}
        <Art num="ART. 1" title="Désignation des parties" />
        <View style={s.partiesRow}>
          <View style={s.partyCard}>
            <View style={[s.partyHead, s.partyHeadOwner]}>
              <Text style={s.partyHeadTx}>LE BAILLEUR (Propriétaire)</Text>
            </View>
            <View style={s.partyBody}>
              <Text style={s.partyName}>{contract.owner?.firstName} {contract.owner?.lastName}</Text>
              <Text style={s.partyDetail}>{contract.owner?.email}</Text>
              {contract.owner?.phone ? <Text style={s.partyDetail}>Tél. {contract.owner.phone}</Text> : null}
              <Text style={s.partyDetail}>Qualité : {cnt.qualiteBailleur || 'Propriétaire bailleur'}</Text>
              {cnt.siret ? <Text style={s.partyDetail}>SIRET : {cnt.siret}</Text> : null}
            </View>
          </View>
          <View style={s.partyCardRight}>
            <View style={[s.partyHead, s.partyHeadTenant]}>
              <Text style={s.partyHeadTx}>LE LOCATAIRE</Text>
            </View>
            <View style={s.partyBody}>
              <Text style={s.partyName}>{contract.tenant?.firstName} {contract.tenant?.lastName}</Text>
              <Text style={s.partyDetail}>{contract.tenant?.email}</Text>
              {contract.tenant?.phone ? <Text style={s.partyDetail}>Tél. {contract.tenant.phone}</Text> : null}
              {cnt.adresseLocataire ? <Text style={s.partyDetail}>Adresse actuelle : {cnt.adresseLocataire}</Text> : null}
              {cnt.professionLocataire ? <Text style={s.partyDetail}>Profession : {cnt.professionLocataire}</Text> : null}
            </View>
          </View>
        </View>

        {/* ART. 2 — Bien loué */}
        <Art num="ART. 2" title="Désignation du logement loué" />
        <View style={s.infoBox}>
          <Text style={s.bodyBold}>{contract.property?.title}</Text>
          <Text style={s.body}>{contract.property?.address}, {contract.property?.postalCode} {contract.property?.city}</Text>
        </View>
        <View style={s.row2}>
          <View style={s.col2}>
            <F label="Type de logement" value={cnt.typeLogement || contract.property?.type || '—'} />
            <F label="Surface habitable (Loi Boutin)" value={`${contract.property?.surface ?? '—'} m²`} bold />
            <F label="Nbre pièces principales" value={String(contract.property?.bedrooms != null ? contract.property.bedrooms + 1 : '—')} />
            <F label="Étage" value={cnt.etage || 'Non précisé'} />
          </View>
          <View style={s.col2L}>
            <F label="Régime juridique de l'immeuble" value={cnt.regimeJuridique || 'Copropriété'} />
            <F label="Classement énergétique (DPE)" value={`${dpe || 'NC'} — Émissions GES : ${cnt.ges || 'NC'}`} bold />
            {cnt.annexes ? <F label="Locaux et annexes" value={cnt.annexes} /> : null}
            {cnt.equipements ? <F label="Équipements fournis" value={cnt.equipements} /> : null}
          </View>
        </View>
        {dpeWarn && (
          <View style={s.warnBox}>
            <Text style={s.warnTitle}>⚠ Logement classé {dpe} — Passoire thermique (Loi Climat et Résilience du 22 août 2021)</Text>
            <Text style={s.warnTxt}>Ce logement est soumis à une restriction de hausse de loyer. Des travaux de rénovation énergétique doivent être planifiés. À compter du 1er janvier 2025, les logements G sont interdits à la location pour de nouveaux baux.</Text>
          </View>
        )}

        <Footer docRef={docRef} page="1" />
      </Page>

      {/* ═══ PAGE 2 — Durée, Finances, IRL, Dépôt ════════════════════════ */}
      <Page size="A4" style={s.page}>
        <BailioWatermark />

        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>DURÉE ET CONDITIONS FINANCIÈRES — Réf. {docRef}</Text>
            <Text style={s.mastheadSub}>{contract.property?.address}, {contract.property?.city} · {isMeuble ? 'Bail meublé' : 'Bail vide'}</Text>
          </View>
          <View style={s.mastheadRight}>
            <Text style={s.mastheadRef}>{fmtDateS(contract.startDate)} → {fmtDateS(contract.endDate)}</Text>
          </View>
        </View>

        {/* ART. 3 — Durée */}
        <Art num="ART. 3" title="Durée du contrat et prise d'effet" />
        <View style={s.row2}>
          <View style={s.col2}>
            <F label="Prise d'effet" value={fmtDate(contract.startDate)} bold />
            <F label="Échéance contractuelle" value={fmtDate(contract.endDate)} bold />
            <F label="Durée effective" value={getDuration(contract.startDate, contract.endDate)} />
          </View>
          <View style={s.col2L}>
            <F label="Durée légale minimale" value={dureeLegale} />
            <F label="Reconduction" value="Tacite, à l'expiration, par périodes identiques" />
          </View>
        </View>
        <Text style={s.body}>
          Le présent contrat est conclu pour une durée de {getDuration(contract.startDate, contract.endDate)}, prenant effet le {fmtDate(contract.startDate)}. À l'échéance, il est reconduit tacitement pour des périodes de même durée, sauf congé donné dans les formes et délais légaux.
        </Text>

        <Text style={s.subTitle}>Congé du locataire (art. 15 loi 89-462)</Text>
        <Text style={s.body}>
          Le locataire peut donner congé à tout moment, sous réserve du respect d'un préavis de :
        </Text>
        {isMeuble ? (
          <Li>1 mois pour les logements meublés</Li>
        ) : (
          <>
            <Li>3 mois en droit commun, par lettre recommandée avec avis de réception ou par acte de commissaire de justice</Li>
            <Li>1 mois dans les zones d'urbanisation continue de plus de 50 000 habitants (zone tendue), ou en cas de mutation professionnelle, perte d'emploi involontaire, obtention du premier emploi, état de santé justifié par certificat médical, perception du RSA ou de l'AAH</Li>
          </>
        )}

        <Text style={s.subTitle}>Congé du bailleur (art. 15 loi 89-462)</Text>
        <Text style={s.body}>
          Le bailleur peut donner congé 6 mois avant l'échéance du bail pour trois motifs exclusifs : reprise du logement pour l'habiter personnellement ou pour un proche, vente du logement, ou motif légitime et sérieux (notamment inexécution des obligations du locataire). Le congé est donné par lettre recommandée avec avis de réception ou acte de commissaire de justice.
        </Text>

        {!isMeuble && (
          <View style={s.infoBox}>
            <Text style={s.bodyBold}>Droit de préemption du locataire en cas de vente (art. 15-II loi 89-462) :</Text>
            <Text style={s.bodySmall}>Lorsque le congé est donné pour vendre le logement, le locataire bénéficie d'un droit de préemption pendant les deux premiers mois du délai de préavis.</Text>
          </View>
        )}

        <View style={s.divider} />

        {/* ART. 4 — Conditions financières */}
        <Art num="ART. 4" title="Loyer et conditions financières" />
        <View style={s.row2}>
          <View style={s.col2}>
            <F label="Loyer mensuel hors charges (convenu)" value={fmtEUR(contract.monthlyRent)} bold />
            <F label="Provisions pour charges récupérables" value={contract.charges != null ? fmtEUR(contract.charges) + ' / mois' : 'Sans charges — forfait ou nul'} />
            <F label="Total mensuel toutes charges comprises" value={fmtEUR(total)} bold />
          </View>
          <View style={s.col2L}>
            <F label="Dépôt de garantie" value={contract.deposit != null ? fmtEUR(contract.deposit) : 'Aucun'} bold />
            <F label="Plafond légal du dépôt" value={isMeuble ? '2 mois de loyer HC' : '1 mois de loyer HC'} />
            <F label="Terme du paiement" value={`Le ${cnt.paymentDay || '5'} de chaque mois — terme à échoir`} />
          </View>
        </View>
        <F label="Modalité de paiement" value={payMethod} />

        {zoneTendue && (
          <View style={s.warnBox}>
            <Text style={s.warnTitle}>Zone soumise à l'encadrement des loyers (art. 17 loi 89-462)</Text>
            <Text style={s.warnTxt}>
              Loyer de référence applicable : {cnt.loyerReference || 'voir arrêté préfectoral en vigueur'} €/m²/mois
              {cnt.loyerReferenceMajore ? ` · Loyer de référence majoré (+20 %) : ${cnt.loyerReferenceMajore} €/m²/mois` : ''}
              {cnt.complementLoyer ? ` · Complément de loyer librement convenu et justifié : ${cnt.complementLoyer} €/mois` : ''}
            </Text>
          </View>
        )}

        <Text style={s.body}>
          Le loyer est payable par {payMethod} le {cnt.paymentDay || '5'} de chaque mois à terme à échoir. Le bailleur est tenu de délivrer quittance au locataire qui en fait la demande, sans frais (art. 21 loi 89-462).
        </Text>

        <Text style={s.subTitle}>Révision annuelle du loyer — Indice de Référence des Loyers (art. 17-1 loi 89-462)</Text>
        <Text style={s.body}>
          Le loyer est révisé une fois par an, à chaque date anniversaire du bail, selon la variation de l'Indice de Référence des Loyers (IRL) publié par l'INSEE. L'indice de référence retenu est celui du {cnt.irlTrimestre || '2ème trimestre'} {cnt.irlAnnee || new Date().getFullYear()}{cnt.irlValeur ? ` (valeur : ${cnt.irlValeur})` : ''}.
        </Text>
        <Text style={s.body}>
          Formule légale : <Text style={{ fontFamily: 'Helvetica-Bold' }}>Loyer révisé = Loyer actuel × (Dernier IRL publié / IRL de référence)</Text>. La révision n'est pas automatique : elle doit être demandée par le bailleur. Elle ne peut avoir d'effet rétroactif sur plus d'une année.
        </Text>

        <Text style={s.subTitle}>Dépôt de garantie (art. 22 loi 89-462)</Text>
        <Text style={s.body}>
          Le dépôt de garantie de {contract.deposit != null ? fmtEUR(contract.deposit) : '—'} est versé à la signature. Il sera restitué dans un délai d'un mois (état des lieux de sortie conforme à l'entrée) ou de deux mois (différences imputables au locataire) à compter de la remise des clés. Tout retard au-delà de ces délais entraîne une majoration de 10 % du loyer mensuel HC par mois commencé (art. 22 al. 8 loi 89-462). Le dépôt de garantie ne produit pas d'intérêts au profit du locataire.
        </Text>

        <Text style={s.subTitle}>Charges récupérables (décret n°87-713 du 26 août 1987)</Text>
        <Text style={s.body}>
          Les provisions pour charges de {contract.charges != null ? fmtEUR(contract.charges) : '0 €'}/mois font l'objet d'une régularisation annuelle sur justificatifs. Le bailleur communique au locataire, au moins un mois avant la date de régularisation, le décompte des charges par nature, le montant des réparations effectuées dans les parties communes et le cas échéant les éléments de calcul du chauffage collectif. Les justificatifs sont tenus à la disposition du locataire pendant six mois après envoi du décompte.
        </Text>

        <Footer docRef={docRef} page="2" />
      </Page>

      {/* ═══ PAGE 3 — Destination, Obligations, Assurance ════════════════ */}
      <Page size="A4" style={s.page}>
        <BailioWatermark />

        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>OBLIGATIONS DES PARTIES — Réf. {docRef}</Text>
            <Text style={s.mastheadSub}>Usage, entretien, assurance et obligations légales réciproques</Text>
          </View>
        </View>

        {/* ART. 5 — Destination des locaux */}
        <Art num="ART. 5" title="Destination et usage des locaux loués" />
        <Text style={s.body}>
          Le présent logement est loué exclusivement à usage de résidence principale du locataire et de sa famille, au sens de l'article 2 de la loi n°89-462. Le locataire s'interdit d'y exercer toute activité commerciale, artisanale, libérale ou de quelque nature professionnelle que ce soit, sans accord écrit préalable du bailleur.
        </Text>
        <Text style={s.body}>
          Le locataire peut héberger toute personne de son choix, sous réserve que cet hébergement ne constitue pas une sous-location déguisée. Il peut également exercer une activité professionnelle au domicile dès lors qu'elle n'engendre pas de réception de clientèle ni de livraison de marchandises, et sous réserve de l'accord du bailleur et du règlement de copropriété.
        </Text>
        <View style={s.infoBox}>
          <Text style={s.bodyBold}>Droit à la tranquillité et à la jouissance paisible :</Text>
          <Text style={s.bodySmall}>Le locataire bénéficie d'un droit à la jouissance paisible du logement, garanti par le bailleur. En contrepartie, il s'oblige à ne pas troubler la tranquillité du voisinage et à respecter les règles de copropriété ou du règlement intérieur de l'immeuble.</Text>
        </View>

        <View style={s.divider} />

        {/* ART. 6 — Obligations du bailleur */}
        <Art num="ART. 6" title="Obligations du bailleur (art. 6 et 6-1 loi 89-462)" />
        <Text style={s.body}>
          Le bailleur est tenu de remettre au locataire un logement décent, ne laissant pas apparaître de risques manifestes pouvant porter atteinte à la sécurité physique ou à la santé, répondant à un critère de performance énergétique minimale et doté des éléments le rendant conforme à l'usage d'habitation (décret n°2002-120 du 30 janvier 2002 : surface ≥ 9 m², hauteur ≥ 2,20 m, installations de chauffage, eau courante, évacuation des eaux usées, aération, éclairage naturel).
        </Text>
        <Text style={s.subTitle}>Obligations principales :</Text>
        <Li>Garantir au locataire la jouissance paisible du logement pendant toute la durée du bail</Li>
        <Li>Garantir les vices ou défauts cachés de nature à empêcher l'usage normal du logement</Li>
        <Li>Effectuer toutes les réparations autres que locatives nécessaires au maintien en état et à l'entretien normal des locaux (art. 1720 C. civ.), notamment les grosses réparations au sens de l'article 606 du Code civil (gros murs, voûtes, poutres, toitures, murs de soutènement, clôtures)</Li>
        <Li>Remettre gratuitement quittance au locataire qui en fait la demande (art. 21 loi 89-462)</Li>
        <Li>Ne pas s'opposer aux aménagements réalisés par le locataire dès lors qu'ils ne constituent pas une transformation de la chose louée</Li>
        <Li>Respecter la procédure légale d'information en cas de vente du bien (droit de préemption, préavis)</Li>
        <Li>En cas de travaux imposés par l'état du bien et excédant 21 jours, verser une indemnité au locataire (art. 1724 C. civ.)</Li>

        <View style={s.divider} />

        {/* ART. 7 — Obligations du locataire */}
        <Art num="ART. 7" title="Obligations du locataire (art. 7 et 7-1 loi 89-462)" />
        <Text style={s.body}>
          Le locataire est tenu des obligations légales suivantes, dont le non-respect peut entraîner la résiliation judiciaire du bail :
        </Text>
        <Text style={s.subTitle}>Obligations principales :</Text>
        <Li>Payer le loyer et les charges aux termes convenus dans le présent bail</Li>
        <Li>User paisiblement des locaux loués selon leur destination</Li>
        <Li>Répondre des dégradations et pertes survenues pendant la durée du bail, à moins de prouver qu'elles ont eu lieu par cas de force majeure, faute du bailleur ou fait d'un tiers</Li>
        <Li>Prendre en charge l'entretien courant du logement, des équipements mentionnés au bail et les menues réparations (décret n°87-712 du 26 août 1987)</Li>
        <Li>Laisser exécuter dans les lieux loués les travaux d'amélioration des parties communes ou privatives et les travaux nécessaires au maintien en état des locaux</Li>
        <Li>Ne pas transformer les locaux et équipements loués sans l'accord écrit du bailleur</Li>
        <Li>Permettre l'accès au logement pour les travaux urgents ou nécessaires, après information préalable d'au moins 24 heures, sauf urgence</Li>
        <Li>Justifier annuellement d'une assurance couvrant les risques locatifs</Li>
        <Li>Ne pas céder le contrat de location ni sous-louer le logement sans l'accord écrit et préalable du bailleur</Li>

        <Text style={s.subTitle}>Travaux d'adaptation au handicap (art. 7-1 loi 89-462) :</Text>
        <Text style={s.body}>
          Le locataire peut demander au bailleur l'autorisation d'effectuer à ses frais des travaux d'adaptation du logement liés à une perte d'autonomie ou à un handicap. Sauf motif sérieux et légitime, le bailleur ne peut s'y opposer. À l'issue du bail, le locataire n'est pas tenu de remettre les lieux en état si les travaux ont été régulièrement effectués.
        </Text>

        <View style={s.divider} />

        {/* ART. 8 — Assurance */}
        <Art num="ART. 8" title="Assurance habitation (art. 7 g) et art. 7-3 loi 89-462)" />
        <Text style={s.body}>
          Le locataire est tenu de s'assurer contre les risques dont il doit répondre en sa qualité de locataire (risques locatifs : incendie, explosion, dégâts des eaux) et d'en justifier lors de la remise des clés puis à chaque renouvellement annuel du bail, par la remise d'une attestation d'assurance.
        </Text>
        <Text style={s.body}>
          À défaut de production de l'attestation dans un délai d'un mois suivant une mise en demeure, le bailleur peut contracter une assurance pour le compte du locataire. Les primes correspondantes sont récupérables auprès du locataire par dixièmes dans les mêmes conditions que le loyer.
        </Text>
        <View style={s.tenantBox}>
          <Text style={s.bodyBold}>En cas de sinistre :</Text>
          <Text style={s.bodySmall}>Le locataire doit déclarer tout sinistre à son assureur dans les délais contractuels et informer immédiatement le bailleur. Le bailleur peut, en cas de défaillance du locataire, exercer un recours subrogatoire contre l'assureur du locataire (art. L. 121-12 Code des assurances).</Text>
        </View>

        <Footer docRef={docRef} page="3" />
      </Page>

      {/* ═══ PAGE 4 — Travaux, Clause résolutoire, Sous-location ════════ */}
      <Page size="A4" style={s.page}>
        <BailioWatermark />

        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>TRAVAUX, RÉSILIATION ET DISPOSITIONS DIVERSES — Réf. {docRef}</Text>
          </View>
        </View>

        {/* ART. 9 — Travaux */}
        <Art num="ART. 9" title="Travaux (art. 1724, 6, 7 loi 89-462 et décrets 87-712, 87-713)" />
        <Text style={s.subTitle}>Travaux à la charge du bailleur :</Text>
        <Text style={s.body}>
          Sont à la charge exclusive du bailleur les travaux et réparations autres que locatifs : grosses réparations (art. 606 C. civ. : gros murs, voûtes, poutres, toitures entières, murs de soutènement), mise aux normes de décence, remplacement de chaudière, de tableau électrique vétuste, ravalement de façade. Ces travaux ne peuvent entraîner de majoration de loyer que dans les conditions prévues par l'article 17-1 loi 89-462 (travaux d'économie d'énergie dans les logements classés E, F ou G).
        </Text>
        <Text style={s.body}>
          Si les travaux du bailleur durent plus de 21 jours, le locataire a droit à une réduction du loyer proportionnelle à la durée et à la surface privée d'usage (art. 1724 C. civ.).
        </Text>

        <Text style={s.subTitle}>Travaux à la charge du locataire (décret n°87-712) :</Text>
        <Text style={s.body}>
          Sont à la charge du locataire les réparations locatives et l'entretien courant : entretien des revêtements de sol et murs (petites réparations), nettoyage et entretien des installations sanitaires (remplacement des joints, abattants de WC, flexibles de douche), entretien de la robinetterie, graissage des serrures et paumelles, remplacement des ampoules, fusibles, piles et petits équipements. Le locataire supporte également les dégâts causés par son défaut d'entretien.
        </Text>
        <Text style={s.body}>
          Tout travaux de transformation des lieux nécessite l'accord préalable et écrit du bailleur. À défaut, le bailleur peut exiger la remise en état à la charge du locataire ou, à son choix, conserver les transformations sans indemnité.
        </Text>

        <View style={s.divider} />

        {/* ART. 10 — Clause résolutoire */}
        <Art num="ART. 10" title="Clause résolutoire de plein droit (art. 24 loi 89-462)" />
        <View style={s.errBox}>
          <Text style={s.errTitle}>CLAUSE RÉSOLUTOIRE — RÉSILIATION DE PLEIN DROIT</Text>
          <Text style={s.errTxt}>Le présent bail est résilié de plein droit, après constatation judiciaire, dans les cas suivants :</Text>
        </View>
        <Li>Non-paiement du loyer ou des charges à leur terme, après commandement de payer demeuré infructueux pendant au moins deux mois (art. 24 al. 1 loi 89-462)</Li>
        <Li>Non-paiement du dépôt de garantie lors de la remise des clés</Li>
        <Li>Défaut d'assurance habitation, un mois après mise en demeure restée sans effet</Li>
        <Li>Troubles de voisinage constatés par décision de justice définitive passée en force de chose jugée</Li>
        <Text style={s.body}>
          La résiliation est constatée par le tribunal judiciaire, qui peut accorder des délais de paiement au locataire (art. 24 al. 6 loi 89-462). La commission de coordination des actions de prévention des expulsions locatives (CCAPEX) est informée par le bailleur dès le premier impayé. En cas de résiliation, les frais d'huissier et de procédure sont à la charge du locataire défaillant.
        </Text>

        <View style={s.divider} />

        {/* ART. 11 — Sous-location */}
        <Art num="ART. 11" title="Sous-location et cession de bail (art. 8 et 8-1 loi 89-462)" />
        <Text style={s.body}>
          Toute sous-location, totale ou partielle, est strictement interdite sans accord préalable et écrit du bailleur sur le principe et le montant du loyer. En cas de sous-location autorisée, le loyer appliqué au sous-locataire ne peut excéder le loyer principal. La cession du bail est également soumise à l'accord écrit du bailleur.
        </Text>
        <Text style={s.body}>
          Le locataire peut cependant héberger librement toute personne de son choix (famille, amis) dès lors que cet hébergement ne constitue pas une sous-location déguisée (absence de rémunération). La sous-location via des plateformes de location saisonnière (type Airbnb) est formellement interdite sans accord écrit du bailleur et, pour les résidences principales, dans la limite maximale de 120 nuits par an (art. L. 631-7 CCH).
        </Text>

        <View style={s.divider} />

        {/* ART. 12 — Solidarité */}
        <Art num="ART. 12" title="Solidarité et indivisibilité (art. 8-1 et 22-1 loi 89-462)" />
        <Text style={s.body}>
          En cas de pluralité de locataires co-signataires du présent bail, ceux-ci sont tenus solidairement et indivisiblement de l'ensemble des obligations locatives (paiement du loyer, des charges, restitution du logement en bon état). La solidarité d'un colocataire sortant cesse à la date d'entrée de son remplaçant ou, à défaut, six mois après la date d'effet de son congé.
        </Text>
        {cnt.caution && (
          <>
            <Text style={s.subTitle}>Cautionnement (art. 22-1 loi 89-462) :</Text>
            <Text style={s.body}>
              Un acte de cautionnement {cnt.typeCaution === 'solidaire' ? 'solidaire' : 'simple'} est annexé au présent bail. La caution s'engage à rembourser au bailleur les sommes dues par le locataire en cas de défaillance de ce dernier, dans les conditions définies dans ledit acte.
            </Text>
          </>
        )}

        <View style={s.divider} />

        {/* ART. 13 — Élection de domicile */}
        <Art num="ART. 13" title="Élection de domicile et juridiction compétente" />
        <Text style={s.body}>
          Pour l'exécution des présentes et de leurs suites, les parties font élection de domicile : le bailleur en son adresse déclarée ci-dessus, le locataire dans le logement objet du présent bail. Tout litige relatif à l'exécution du présent contrat relève de la compétence exclusive du Tribunal judiciaire du lieu de situation du bien loué.
        </Text>

        <Footer docRef={docRef} page="4" />
      </Page>

      {/* ═══ PAGE 5 — Annexes légales & Clauses interdites ══════════════ */}
      <Page size="A4" style={s.page}>
        <BailioWatermark />

        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>ANNEXES OBLIGATOIRES & CLAUSES INTERDITES — Réf. {docRef}</Text>
          </View>
        </View>

        <Art num="ART. 14" title="Annexes obligatoires devant être jointes au bail (art. 3 loi 89-462)" />
        <Text style={s.body}>Les documents suivants doivent impérativement être annexés au présent contrat de location, à peine d'inopposabilité des clauses correspondantes :</Text>

        <Text style={s.subTitle}>Documents obligatoires pour tous les baux :</Text>
        <Check text="Notice d'information relative aux droits et obligations des locataires et des bailleurs" note="Arrêté du 29 mai 2015 — Obligatoire depuis le 1er août 2015 — Modèle officiel DGALN" />
        <Check text="État des lieux d'entrée contradictoire (modèle réglementaire, décret n°2016-382)" note="Signé par les deux parties ou établi par huissier en cas de désaccord — Frais partagés par moitié" />
        <Check text="État des risques et pollutions (ERP)" note="Informations relatives aux risques naturels et technologiques — Valable 6 mois — Art. L. 125-5 C. envir." />
        <Check text="Diagnostic de performance énergétique (DPE)" note="Valable 10 ans — Obligatoire depuis le 1er juillet 2007 — Art. L. 134-1 CCH" />
        <Check text="Attestation d'assurance habitation du locataire" note="Risques locatifs couverts — Obligatoire à la remise des clés, puis annuellement" />

        <Text style={s.subTitle}>Documents complémentaires selon les caractéristiques du bien :</Text>
        <Check text="Constat de risque d'exposition au plomb (CREP)" note="Immeubles construits avant le 1er janvier 1949 — Durée : 1 an si positif, illimitée si négatif" />
        <Check text="Diagnostic amiante" note="Permis de construire antérieur au 1er juillet 1997 — Parties privatives" />
        <Check text="Diagnostic des installations électriques" note="Installations intérieures de plus de 15 ans — Valable 6 ans" />
        <Check text="Diagnostic des installations de gaz naturel" note="Installations de plus de 15 ans — Valable 6 ans" />
        <Check text="Information sur la nuisance sonore aérienne (arrêté préfectoral)" note="Zones de bruit définies autour des aérodromes" />
        {isMeuble && <Check text="Inventaire détaillé et état du mobilier (contradictoire, signé par les deux parties)" note="Obligatoire pour les baux meublés — Décret n°2015-587, annexe II" />}
        {zoneTendue && <Check text="Arrêté préfectoral fixant les loyers de référence et les loyers de référence majorés" note="Zone d'encadrement des loyers applicable sur la commune" />}
        {cnt.caution && <Check text="Acte de cautionnement solidaire ou simple" note="Si garant : acte séparé signé par la caution, avec mentions manuscrites obligatoires (art. 22-1 loi 89-462)" />}

        <View style={s.divider} />

        <Art num="ART. 15" title="État des lieux (décret n°2016-382 du 30 mars 2016)" />
        <Text style={s.body}>
          Un état des lieux est établi contradictoirement et amiablement à la remise des clés (entrée) et à leur restitution (sortie), selon le modèle réglementaire défini par le décret n°2016-382, signé par les deux parties et annexé au présent bail. En cas de désaccord, il peut être établi par un huissier de justice dont les frais sont partagés par moitié entre le bailleur et le locataire.
        </Text>
        <Text style={s.body}>
          L'état des lieux de sortie est comparé à l'état des lieux d'entrée. Seules les dégradations au-delà de la vétusté normale (grille de vétusté applicable) peuvent être imputées au locataire et déduites du dépôt de garantie. L'usure normale des matériaux n'est jamais à la charge du locataire.
        </Text>

        <View style={s.divider} />

        <Art num="ART. 16" title="Clauses réputées non écrites (art. 4 loi 89-462)" />
        <View style={s.errBox}>
          <Text style={s.errTitle}>AVERTISSEMENT LÉGAL — Les clauses suivantes sont nulles de plein droit si elles figurent au bail</Text>
          <Text style={s.errTxt}>Leur présence au contrat ne lie pas le locataire et peut engager la responsabilité du bailleur.</Text>
        </View>
        <LiSmall>Interdire d'héberger des personnes ne vivant pas habituellement avec le locataire</LiSmall>
        <LiSmall>Imposer la souscription d'une assurance auprès d'une compagnie désignée par le bailleur</LiSmall>
        <LiSmall>Prévoir le paiement de frais d'établissement de quittance, de rédaction d'état des lieux ou d'encaissement de loyer</LiSmall>
        <LiSmall>Mettre à la charge du locataire des frais de relance ou de mise en demeure</LiSmall>
        <LiSmall>Interdire la détention d'animaux de compagnie (hors animaux dangereux — loi du 6 janvier 1999)</LiSmall>
        <LiSmall>Prévoir la responsabilité collective des locataires en cas de dégradation des parties communes</LiSmall>
        <LiSmall>Imposer le paiement du loyer exclusivement par prélèvement automatique</LiSmall>
        <LiSmall>Interdire les travaux d'adaptation du logement au handicap ou à la perte d'autonomie</LiSmall>
        <LiSmall>Fixer un dépôt de garantie supérieur aux plafonds légaux (1 ou 2 mois HC selon le type)</LiSmall>
        <LiSmall>Mettre à la charge du locataire la taxe foncière, les honoraires de gestion locative ou d'autres charges non récupérables</LiSmall>
        <LiSmall>Exiger des documents personnels non autorisés par l'article 22-2 (chèques en blanc, documents discriminatoires)</LiSmall>
        <LiSmall>Prévoir une clause de solidarité entre des locataires successifs pour des dettes antérieures à leur entrée</LiSmall>

        <Footer docRef={docRef} page="5" />
      </Page>

      {/* ═══ PAGE 6 (optionnelle) — Clauses spécifiques ═════════════════ */}
      {hasClausesPage && (
        <Page size="A4" style={s.page}>
          <BailioWatermark />

          <View style={s.masthead}>
            <View style={s.mastheadLeft}>
              <Text style={s.mastheadTitle}>CLAUSES SPÉCIFIQUES CONVENUES — Réf. {docRef}</Text>
              <Text style={s.mastheadSub}>Clauses librement négociées, acceptées par les deux parties — art. 4 loi 89-462</Text>
            </View>
          </View>

          {enabled.length > 0 && (
            <>
              <Art num="ART. 17" title="Clauses spécifiques convenues entre les parties" />
              <Text style={s.body}>
                Les clauses ci-après ont été librement négociées et acceptées d'un commun accord par le bailleur et le locataire. Elles complètent les dispositions légales sans pouvoir y déroger au détriment du locataire (art. 4 loi 89-462). Elles sont réputées non écrites si elles contreviennent à l'ordre public locatif.
              </Text>
              {enabled.map((clause, i) => (
                <View key={clause.id} style={s.clauseBox}>
                  <View style={s.clauseHead}>
                    <View style={s.clauseBadge}>
                      <Text style={s.clauseBadgeTx}>{i + 1}</Text>
                    </View>
                    <Text style={s.clauseTitle}>{clause.title}</Text>
                    {clause.isCustom && (
                      <View style={s.clauseCustomBadge}>
                        <Text style={s.clauseBadgeTx}>Clause personnalisée</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.clauseBody}>{clause.description}</Text>
                </View>
              ))}
            </>
          )}

          {contract.terms && (
            <>
              <Art num={enabled.length > 0 ? 'ART. 18' : 'ART. 17'} title="Conditions particulières" />
              <View style={s.clauseBox}>
                <Text style={s.clauseBody}>{contract.terms}</Text>
              </View>
            </>
          )}

          <Footer docRef={docRef} page="6" />
        </Page>
      )}

      {/* ═══ DERNIÈRE PAGE — Signatures ═══════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <BailioWatermark />

        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>SIGNATURES ET CONSENTEMENT DES PARTIES — Réf. {docRef}</Text>
            <Text style={s.mastheadSub}>Valeur juridique des signatures — art. 1366 et 1367 C. civ. — Règlement eIDAS n°910/2014</Text>
          </View>
        </View>

        {/* Base légale signature électronique */}
        <View style={s.infoBox}>
          <Text style={s.bodyBold}>Valeur probante des signatures électroniques :</Text>
          <Text style={s.body}>
            Conformément aux articles 1366 et 1367 du Code civil et au règlement européen eIDAS (UE n°910/2014), les signatures électroniques apposées ci-après ont la même valeur probante qu'une signature manuscrite. Chaque signature est horodatée, associée à une empreinte cryptographique SHA-256 du document signé, et constitue une preuve électronique opposable aux tiers.
          </Text>
        </View>

        {/* Déclaration de connaissance */}
        <View style={{ marginBottom: 10, padding: 8, backgroundColor: C.muted, borderRadius: 4 }}>
          <Text style={{ fontSize: 8, color: C.inkMid, textAlign: 'justify' }}>
            Les soussignés déclarent avoir pris connaissance de l'intégralité du présent contrat de location (pages 1 à {hasClausesPage ? '6' : '5'}) et de toutes ses annexes légales, et l'accepter sans réserve. Chaque partie reconnaît avoir reçu un exemplaire du présent acte. En apposant leur signature ci-dessous, les parties expriment leur consentement exprès, libre, éclairé et irrévocable aux termes du présent contrat, conformément aux articles 1366 et 1367 du Code civil français.
          </Text>
        </View>

        {/* Lieu et date */}
        <View style={{ marginVertical: 10, alignItems: 'center' }}>
          <Text style={{ fontSize: 9.5, color: C.inkMid }}>
            Fait à{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>
              {contract.property?.city || '___________'}
            </Text>
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
        <View style={s.sigSection}>
          {/* Bailleur */}
          <View style={s.sigBox}>
            <View style={s.sigHeadOwner}>
              <Text style={s.sigHeadTx}>LE BAILLEUR — Propriétaire</Text>
            </View>
            <View style={s.sigBody}>
              <Text style={s.sigName}>{contract.owner?.firstName} {contract.owner?.lastName}</Text>
              <Text style={s.sigEmail}>{contract.owner?.email}</Text>
              {contract.signedByOwner ? (
                <>
                  <Text style={s.sigDate}>✓ Signé électroniquement le {fmtDate(contract.signedByOwner)}</Text>
                  {contract.ownerSignature && (
                    <Image style={s.sigImg} src={contract.ownerSignature} />
                  )}
                  {sigMeta.owner && (
                    <>
                      <Text style={s.sigMetaOk}>Horodatage : {new Date(sigMeta.owner.timestamp).toLocaleString('fr-FR')}</Text>
                      {sigMeta.owner.ip && <Text style={s.sigMeta}>Adresse IP : {sigMeta.owner.ip}</Text>}
                      {sigMeta.owner.contentHash && (
                        <Text style={s.sigMeta}>Empreinte SHA-256 : {sigMeta.owner.contentHash.substring(0, 24)}…</Text>
                      )}
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
            <View style={s.sigHeadTenant}>
              <Text style={s.sigHeadTx}>LE LOCATAIRE</Text>
            </View>
            <View style={s.sigBody}>
              <Text style={s.sigName}>{contract.tenant?.firstName} {contract.tenant?.lastName}</Text>
              <Text style={s.sigEmail}>{contract.tenant?.email}</Text>
              {contract.signedByTenant ? (
                <>
                  <Text style={s.sigDate}>✓ Signé électroniquement le {fmtDate(contract.signedByTenant)}</Text>
                  {contract.tenantSignature && (
                    <Image style={s.sigImg} src={contract.tenantSignature} />
                  )}
                  {sigMeta.tenant && (
                    <>
                      <Text style={s.sigMetaOk}>Horodatage : {new Date(sigMeta.tenant.timestamp).toLocaleString('fr-FR')}</Text>
                      {sigMeta.tenant.ip && <Text style={s.sigMeta}>Adresse IP : {sigMeta.tenant.ip}</Text>}
                      {sigMeta.tenant.contentHash && (
                        <Text style={s.sigMeta}>Empreinte SHA-256 : {sigMeta.tenant.contentHash.substring(0, 24)}…</Text>
                      )}
                    </>
                  )}
                </>
              ) : (
                <Text style={s.sigEmpty}>En attente de signature du locataire</Text>
              )}
            </View>
          </View>
        </View>

        {/* Mention légale finale */}
        <View style={{ marginTop: 16, padding: 7, borderWidth: 1, borderColor: C.border, borderRadius: 4 }}>
          <Text style={{ fontSize: 7, color: C.inkFaint, textAlign: 'justify', lineHeight: 1.6 }}>
            Document généré par Bailio (bailio.fr) — Plateforme de gestion locative. Ce bail a été établi conformément au modèle type défini par le Décret n°2015-587 du 29 mai 2015 pris en application de la Loi n°89-462 du 6 juillet 1989 tendant à améliorer les rapports locatifs, modifiée par la Loi ALUR du 24 mars 2014. Référence interne : {docRef}. Les parties sont invitées à conserver ce document pendant toute la durée du bail et pendant trois ans après son terme.
          </Text>
        </View>

        <Footer docRef={docRef} page="Fin" />
      </Page>
    </Document>
  )
}
