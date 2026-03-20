/**
 * ContractPDF — Bail d'habitation Loi ALUR
 * DA Maison · nuit #1a1a2e · caramel #c4976a
 * Refonte juriste : compact, lisible, valide devant juridiction française
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

  // Bande caramel "accord des parties"
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

  // Tableau récapitulatif des conditions convenues
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
  tableValNote: {
    flex: 1,
    padding: '5 8',
    fontSize: 8,
    color: C.inkMid,
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
      <Text style={{ fontSize: 72, fontFamily: 'Helvetica-Bold', color: C.night, transform: 'rotate(-35deg)' }}>
        BAILIO
      </Text>
    </View>
  )

  return (
    <Document
      title={`Bail – ${contract.property?.title ?? ''}`}
      author="Bailio – Plateforme de gestion locative"
      subject="Contrat de location Loi ALUR"
      keywords="bail, location, ALUR, contrat"
    >

      {/* ═══ PAGE 1 — Parties & Récapitulatif convenu ═════════════════════ */}
      <Page size="A4" style={s.page}>
        <BailioWatermark />

        {/* En-tête */}
        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>CONTRAT DE LOCATION — {isMeuble ? 'MEUBLÉ' : 'VIDE'}</Text>
            <Text style={s.mastheadSub}>Résidence principale · {typeLabel} · Loi n°89-462 du 6 juillet 1989 modifiée par la Loi ALUR du 24 mars 2014</Text>
            <Text style={s.mastheadLegal}>Décret n°2015-587 du 29 mai 2015 relatif aux contrats types de location</Text>
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

        {/* Tableau récapitulatif des conditions */}
        <View style={s.tableWrap}>
          {[
            { l: 'Adresse du bien', v: `${contract.property?.address ?? '—'}, ${contract.property?.postalCode ?? ''} ${contract.property?.city ?? ''}` },
            { l: 'Surface habitable (Loi Boutin)', v: `${contract.property?.surface ?? '—'} m²` },
            { l: 'Type de bail', v: typeLabel },
            { l: 'Durée légale', v: dureeLegale },
            { l: 'Prise d\'effet', v: fmtDate(contract.startDate) },
            { l: 'Échéance', v: fmtDate(contract.endDate) },
            { l: 'Loyer mensuel hors charges', v: fmtEUR(contract.monthlyRent) },
            { l: 'Provisions pour charges', v: contract.charges != null ? fmtEUR(contract.charges) : 'Sans charges' },
            { l: 'Total mensuel TTC', v: fmtEUR(total) },
            { l: 'Dépôt de garantie', v: contract.deposit != null ? fmtEUR(contract.deposit) + (isMeuble ? '  (max 2 mois HC)' : '  (max 1 mois HC)') : '—' },
            { l: 'Modalité de paiement', v: `${payMethod} — le ${cnt.paymentDay || '5'} de chaque mois` },
            { l: 'Révision annuelle (IRL)', v: `${cnt.irlTrimestre || '2ème trimestre'} ${cnt.irlAnnee || new Date().getFullYear()}` },
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
            <Text style={s.finLbl}>Loyer HC</Text>
          </View>
          {contract.charges != null && (
            <View style={s.finCell}>
              <Text style={s.finAmt}>{fmtEUR(contract.charges)}</Text>
              <Text style={s.finLbl}>Charges</Text>
            </View>
          )}
          <View style={s.finCell}>
            <Text style={s.finAmt}>{fmtEUR(total)}</Text>
            <Text style={s.finLbl}>Total / mois</Text>
          </View>
          {contract.deposit != null && (
            <View style={s.finCellLast}>
              <Text style={s.finAmt}>{fmtEUR(contract.deposit)}</Text>
              <Text style={s.finLbl}>Dépôt garantie</Text>
            </View>
          )}
        </View>

        {/* Parties */}
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
            </View>
          </View>
        </View>

        {/* Bien loué */}
        <Art num="ART. 2" title="Désignation du logement loué" />
        <View style={s.infoBox}>
          <Text style={s.bodyBold}>{contract.property?.title}</Text>
          <Text style={s.body}>{contract.property?.address}, {contract.property?.postalCode} {contract.property?.city}</Text>
        </View>
        <View style={s.row2}>
          <View style={s.col2}>
            <F label="Type de logement" value={cnt.typeLogement || contract.property?.type || '—'} />
            <F label="Surface (Loi Boutin)" value={`${contract.property?.surface ?? '—'} m²`} bold />
            <F label="Nbre pièces principales" value={String(contract.property?.bedrooms != null ? contract.property.bedrooms + 1 : '—')} />
          </View>
          <View style={s.col2L}>
            <F label="Étage" value={cnt.etage || 'Non précisé'} />
            <F label="Régime juridique" value={cnt.regimeJuridique || 'Copropriété'} />
            <F label="DPE / GES" value={`${dpe || 'NC'} / ${cnt.ges || 'NC'}`} bold />
          </View>
        </View>
        {cnt.annexes ? <F label="Annexes" value={cnt.annexes} /> : null}
        {cnt.equipements ? <F label="Équipements" value={cnt.equipements} /> : null}
        {dpeWarn && (
          <View style={s.warnBox}>
            <Text style={s.warnTitle}>⚠ Logement classé {dpe} — Passoire thermique</Text>
            <Text style={s.warnTxt}>Restrictions de hausse de loyer applicables (Loi Climat et Résilience du 22 août 2021). Travaux de rénovation à planifier.</Text>
          </View>
        )}

        <Footer docRef={docRef} page="1" />
      </Page>

      {/* ═══ PAGE 2 — Durée, finances, obligations ════════════════════════ */}
      <Page size="A4" style={s.page}>
        <BailioWatermark />

        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>CONDITIONS DU BAIL — Réf. {docRef}</Text>
            <Text style={s.mastheadSub}>{contract.property?.address}, {contract.property?.city} · {isMeuble ? 'Meublé' : 'Vide'}</Text>
          </View>
          <View style={s.mastheadRight}>
            <Text style={s.mastheadRef}>{fmtDateS(contract.startDate)} → {fmtDateS(contract.endDate)}</Text>
          </View>
        </View>

        {/* Art 3 — Durée */}
        <Art num="ART. 3" title="Durée et prise d'effet" />
        <View style={s.row2}>
          <View style={s.col2}>
            <F label="Prise d'effet" value={fmtDate(contract.startDate)} bold />
            <F label="Échéance contractuelle" value={fmtDate(contract.endDate)} bold />
            <F label="Durée effective" value={getDuration(contract.startDate, contract.endDate)} />
          </View>
          <View style={s.col2L}>
            <F label="Durée légale minimale" value={dureeLegale} />
            <F label="Reconduction" value="Tacite, à l'expiration, pour même durée" />
          </View>
        </View>
        <View style={s.infoBox}>
          <Text style={s.bodyBold}>Préavis locataire (art. 15 loi 89-462) :</Text>
          <Li>{isMeuble ? '1 mois — logement meublé' : '3 mois — logement vide (droit commun)'}</Li>
          {!isMeuble && <Li>1 mois en zone tendue, mutation, perte d'emploi, premier emploi, raisons médicales, bénéficiaire RSA/AAH</Li>}
          <Text style={[s.bodyBold, { marginTop: 3 }]}>Préavis bailleur :</Text>
          <Li>6 mois avant l'échéance — motifs limitatifs : reprise pour habiter, vente, motif légitime et sérieux</Li>
        </View>
        <Text style={s.body}>
          Congé par lettre recommandée avec AR, acte de commissaire de justice, ou remise en main propre contre récépissé.
        </Text>

        <View style={s.divider} />

        {/* Art 4 — Finances */}
        <Art num="ART. 4" title="Conditions financières convenues" />
        <View style={s.row2}>
          <View style={s.col2}>
            <F label="Loyer mensuel HC (convenu)" value={fmtEUR(contract.monthlyRent)} bold />
            <F label="Provisions charges" value={contract.charges != null ? fmtEUR(contract.charges) + ' / mois (régul. annuelle)' : 'Sans charges récupérables'} />
            <F label="Total mensuel TCC" value={fmtEUR(total)} bold />
          </View>
          <View style={s.col2L}>
            <F label="Dépôt de garantie" value={contract.deposit != null ? fmtEUR(contract.deposit) : '—'} bold />
            <F label="Plafond légal" value={isMeuble ? '2 mois HC' : '1 mois HC'} />
            <F label="Échéance paiement" value={`Le ${cnt.paymentDay || '5'} de chaque mois (terme à échoir)`} />
          </View>
        </View>
        <F label="Modalité de paiement" value={payMethod} />

        {zoneTendue && (
          <View style={s.warnBox}>
            <Text style={s.warnTitle}>Zone soumise à l'encadrement des loyers (art. 17 loi 89-462)</Text>
            <Text style={s.warnTxt}>
              Loyer de référence : {cnt.loyerReference || 'voir arrêté préfectoral'} €/m²/mois
              {cnt.loyerReferenceMajore ? ` · Majoré (+20 %) : ${cnt.loyerReferenceMajore} €/m²/mois` : ''}
              {cnt.complementLoyer ? ` · Complément de loyer justifié : ${cnt.complementLoyer} €` : ''}
            </Text>
          </View>
        )}

        <Text style={s.subTitle}>Révision annuelle — IRL (art. 17-1 loi 89-462)</Text>
        <Text style={s.body}>
          À chaque date anniversaire selon variation de l'IRL publié par l'INSEE. Indice de référence : {cnt.irlTrimestre || '2ème trimestre'} {cnt.irlAnnee || new Date().getFullYear()}{cnt.irlValeur ? ` (valeur : ${cnt.irlValeur})` : ''}.
          Formule : Loyer révisé = Loyer actuel × (Nouvel IRL / Ancien IRL). La révision n'est pas automatique. Pas d'effet rétroactif au-delà d'un an.
        </Text>

        <Text style={s.subTitle}>Dépôt de garantie (art. 22 loi 89-462)</Text>
        <Text style={s.body}>
          Restitution : 1 mois si état des lieux conforme ; 2 mois en cas de différences. Retard : majoration de 10 % du loyer HC par mois commencé. Ne produit pas d'intérêts.
        </Text>

        <Text style={s.subTitle}>Charges récupérables (décret n°87-713)</Text>
        <Text style={s.body}>
          Provisions de {contract.charges != null ? fmtEUR(contract.charges) : '0 €'}/mois. Régularisation annuelle sur justificatifs. Décompte par nature transmis au locataire au moins 1 mois avant. Justificatifs disponibles 6 mois.
        </Text>

        <View style={s.divider} />

        {/* Art 5 — Obligations condensées */}
        <Art num="ART. 5" title="Clause résolutoire (art. 24 loi 89-462)" />
        <Text style={s.body}>Le bail est résilié de plein droit, après constatation par le juge, en cas de :</Text>
        <Li>Défaut de paiement du loyer ou des charges, 2 mois après commandement infructueux</Li>
        <Li>Défaut de paiement du dépôt de garantie à la remise des clés</Li>
        <Li>Défaut d'assurance habitation, 1 mois après mise en demeure</Li>
        <Li>Troubles de voisinage constatés par décision de justice passée en force de chose jugée</Li>

        <View style={s.divider} />

        <Art num="ART. 6" title="Obligations du bailleur (art. 6, 6-1 loi 89-462)" />
        <Li>Délivrer un logement décent conforme au décret n°2002-120 (surface min. 9 m², hauteur 2,20 m)</Li>
        <Li>Garantir la jouissance paisible et l'absence de vices cachés</Li>
        <Li>Effectuer les réparations autres que locatives nécessaires au maintien en état</Li>
        <Li>Remettre gratuitement une quittance de loyer sur demande (art. 21)</Li>
        <Li>Respecter la procédure légale pour toute récupération du logement</Li>

        <View style={s.divider} />

        <Art num="ART. 7" title="Obligations du locataire (art. 7, 7-1 loi 89-462)" />
        <Li>Payer le loyer et les charges aux termes et conditions convenus</Li>
        <Li>User paisiblement des locaux selon la destination (résidence principale)</Li>
        <Li>Prendre en charge l'entretien courant et les réparations locatives (décret n°87-712)</Li>
        <Li>Souscrire et maintenir une assurance habitation (risques locatifs) — justifier annuellement</Li>
        <Li>Ne pas transformer les locaux sans accord écrit du bailleur</Li>
        <Li>Ne pas céder le bail ni sous-louer sans accord écrit du bailleur</Li>

        <Footer docRef={docRef} page="2" />
      </Page>

      {/* ═══ PAGE 3 — Annexes obligatoires & clauses interdites ══════════ */}
      <Page size="A4" style={s.page}>
        <BailioWatermark />

        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>ANNEXES LÉGALES & CLAUSES INTERDITES — Réf. {docRef}</Text>
          </View>
        </View>

        <Art num="ART. 8" title="Annexes obligatoires (art. 3 loi 89-462)" />
        <Text style={s.body}>Documents devant impérativement être annexés au bail :</Text>
        <Text style={s.subTitle}>Pour tous les baux :</Text>
        <Check text="Notice d'information — droits et obligations des locataires et des bailleurs" note="Arrêté du 29 mai 2015 — Obligatoire depuis le 1er août 2015" />
        <Check text="État des lieux d'entrée contradictoire" note="Décret n°2016-382 — Signé par les deux parties — Annexé au bail" />
        <Check text="État des risques et pollutions (ERP)" note="Valable 6 mois — Zones PPR, sols pollués, radon, sismicité" />
        <Check text="Diagnostic de performance énergétique (DPE)" note="Valable 10 ans — Obligatoire depuis le 1er juillet 2007" />

        <Text style={s.subTitle}>Selon l'âge et les caractéristiques du bien :</Text>
        <Check text="Constat de risque d'exposition au plomb (CREP)" note="Immeubles avant le 1er janvier 1949 — 1 an si positif, illimité si négatif" />
        <Check text="Diagnostic électricité" note="Installations > 15 ans — Valable 6 ans" />
        <Check text="Diagnostic gaz" note="Installations > 15 ans — Valable 6 ans" />
        <Check text="Diagnostic amiante" note="Permis de construire antérieur au 1er juillet 1997" />
        <Check text="Diagnostic bruit" note="Zones de bruit (aéroports, grandes infrastructures)" />
        {isMeuble && <Check text="Inventaire et état du mobilier" note="Contradictoire, signé — Obligatoire pour les baux meublés" />}
        {zoneTendue && <Check text="Loyer de référence et loyer de référence majoré" note="Arrêté préfectoral en vigueur dans la commune" />}

        <View style={s.divider} />

        <Art num="ART. 9" title="État des lieux (décret n°2016-382 du 30 mars 2016)" />
        <Text style={s.body}>
          État des lieux contradictoire établi lors de la remise des clés (entrée) et de la restitution (sortie), selon le modèle réglementaire, signé par les deux parties et annexé au bail. Les différences imputables au locataire peuvent être déduites du dépôt de garantie après application de la grille de vétusté. L'usure normale n'est pas imputable.
        </Text>

        <View style={s.divider} />

        <Art num="ART. 10" title="Clauses réputées non écrites (art. 4 loi 89-462)" />
        <View style={s.errBox}>
          <Text style={s.errTitle}>AVERTISSEMENT — Ces clauses sont nulles de plein droit si elles figurent au bail</Text>
        </View>
        <Li>Interdire d'héberger des personnes ne vivant pas habituellement avec le locataire</Li>
        <Li>Imposer la souscription d'une assurance auprès d'une compagnie désignée</Li>
        <Li>Facturer des frais d'établissement de quittance, d'état des lieux ou d'encaissement</Li>
        <Li>Prévoir des frais de relance ou de mise en demeure</Li>
        <Li>Interdire la détention d'animaux de compagnie (hors dangereux — loi du 6 janvier 1999)</Li>
        <Li>Prévoir la responsabilité collective des locataires pour dégradation de parties communes</Li>
        <Li>Imposer le paiement exclusivement par prélèvement automatique</Li>
        <Li>Interdire les travaux d'adaptation au handicap ou à la perte d'autonomie</Li>
        <Li>Fixer un dépôt de garantie supérieur aux plafonds légaux (1 ou 2 mois HC)</Li>
        <Li>Mettre à la charge du locataire des charges non récupérables (taxe foncière, honoraires de gestion...)</Li>
        <Li>Exiger des documents personnels non autorisés (chèques en blanc, photocopie ID conservée...)</Li>

        <View style={s.divider} />

        <Art num="ART. 11" title="Solidarité et cession de bail (art. 8, 8-1 loi 89-462)" />
        <Text style={s.body}>
          En cas de pluralité de locataires : solidarité et indivisibilité de toutes les obligations. La solidarité d'un locataire sortant cesse à l'entrée d'un nouveau ou au plus tard 6 mois après son congé. Toute cession de bail ou sous-location est interdite sans accord écrit et préalable du bailleur. Le loyer de sous-location ne peut excéder le loyer principal.
        </Text>

        <Footer docRef={docRef} page="3" />
      </Page>

      {/* ═══ PAGE 4 (optionnelle) — Clauses spécifiques ═════════════════ */}
      {hasClausesPage && (
        <Page size="A4" style={s.page}>
          <BailioWatermark />

          <View style={s.masthead}>
            <View style={s.mastheadLeft}>
              <Text style={s.mastheadTitle}>CLAUSES SPÉCIFIQUES CONVENUES — Réf. {docRef}</Text>
              <Text style={s.mastheadSub}>Clauses librement négociées et acceptées par les deux parties</Text>
            </View>
          </View>

          {enabled.length > 0 && (
            <>
              <Art num="ART. 12" title="Clauses spécifiques convenues entre les parties" />
              <Text style={s.body}>
                Les clauses ci-après ont été librement négociées et acceptées d'un commun accord. Elles complètent les dispositions légales sans pouvoir y déroger au détriment du locataire (art. 4 loi 89-462).
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
                        <Text style={s.clauseBadgeTx}>Personnalisée</Text>
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
              <Art num={enabled.length > 0 ? 'ART. 13' : 'ART. 12'} title="Conditions particulières" />
              <View style={s.clauseBox}>
                <Text style={s.clauseBody}>{contract.terms}</Text>
              </View>
            </>
          )}

          <Footer docRef={docRef} page="4" />
        </Page>
      )}

      {/* ═══ DERNIÈRE PAGE — Signatures ═══════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <BailioWatermark />

        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={s.mastheadTitle}>SIGNATURES — Réf. {docRef}</Text>
            <Text style={s.mastheadSub}>Consentement des parties et valeur juridique de la signature électronique</Text>
          </View>
        </View>

        {/* Base légale signature électronique */}
        <View style={s.infoBox}>
          <Text style={s.bodyBold}>Valeur juridique des signatures électroniques :</Text>
          <Text style={s.body}>
            Conformes à l'article 1367 du Code civil et au règlement eIDAS (UE n°910/2014). Chaque signature est horodatée et associée à une empreinte SHA-256 du document, constituant une preuve électronique opposable aux tiers avec la même valeur probante qu'un écrit sur support papier (art. 1366 C. civ.).
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
          </Text>
          <Text style={{ fontSize: 8, color: C.inkFaint, marginTop: 3 }}>
            En deux exemplaires originaux, dont un remis à chacune des parties
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
                      {sigMeta.owner.ip && <Text style={s.sigMeta}>IP : {sigMeta.owner.ip}</Text>}
                      {sigMeta.owner.contentHash && (
                        <Text style={s.sigMeta}>SHA-256 : {sigMeta.owner.contentHash.substring(0, 20)}…</Text>
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
                      {sigMeta.tenant.ip && <Text style={s.sigMeta}>IP : {sigMeta.tenant.ip}</Text>}
                      {sigMeta.tenant.contentHash && (
                        <Text style={s.sigMeta}>SHA-256 : {sigMeta.tenant.contentHash.substring(0, 20)}…</Text>
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

        {/* Clause de consentement */}
        <View style={{ marginTop: 14, padding: 8, backgroundColor: C.muted, borderRadius: 4 }}>
          <Text style={{ fontSize: 7.5, color: C.inkMid, textAlign: 'justify' }}>
            Les soussignés déclarent avoir pris connaissance de l'intégralité du présent contrat et de ses annexes, et l'accepter sans réserve. Chaque partie reconnaît avoir reçu un exemplaire original du présent acte. La signature électronique apposée ci-dessus vaut consentement exprès et irrévocable aux termes du présent contrat conformément aux articles 1366 et 1367 du Code civil français et au règlement eIDAS (UE n°910/2014).
          </Text>
        </View>

        <Footer docRef={docRef} page="Fin" />
      </Page>
    </Document>
  )
}
