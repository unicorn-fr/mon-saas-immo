/**
 * ContractPDF — Bail d'habitation Loi ALUR
 * Structure fidèle au modèle type Smartloc / Décret n°2015-587 du 29 mai 2015
 * Sections I–XI avec sous-sections A/B/C, textes verbatim légaux
 * DA Maison · nuit #1a1a2e · caramel #c4976a
 */
import type { ReactNode } from 'react'
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
  owner:    '#1a3270',
  ownerL:   '#eaf0fb',
  ink:      '#0d0c0a',
  inkMid:   '#5a5754',
  inkFaint: '#9e9b96',
  border:   '#e4e1db',
  muted:    '#f4f2ee',
  surface:  '#ffffff',
  warnBg:   '#fdf5ec',
  warnTx:   '#92400e',
  errBg:    '#fef2f2',
  errTx:    '#9b1c1c',
}

const s = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingBottom: 52,
    paddingHorizontal: 45,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: C.ink,
    lineHeight: 1.6,
    backgroundColor: C.surface,
  },

  // ── En-tête ──────────────────────────────────────────────────────────────
  titleBlock: { marginBottom: 14, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: C.night },
  titleMain: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.night, textAlign: 'center', letterSpacing: 0.4, marginBottom: 4 },
  titleSub:  { fontSize: 7.5, color: C.inkMid, textAlign: 'center', marginBottom: 2 },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  refLeft: { fontSize: 7, color: C.inkFaint },
  refRight: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.caramel },

  // ── Intro légale ──────────────────────────────────────────────────────────
  introText: { fontSize: 8, color: C.inkMid, textAlign: 'justify', marginBottom: 5, lineHeight: 1.55 },

  // ── Section I/II/III…  header ─────────────────────────────────────────────
  secRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  secNum:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.night, width: 32 },
  secTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.night, flex: 1, borderBottomWidth: 1, borderBottomColor: C.caramel, paddingBottom: 2 },

  // ── Sous-section A/B/C… ───────────────────────────────────────────────────
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 3,
    paddingLeft: 8,
  },
  subLetter: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.inkMid, width: 28 },
  subTitle:  { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.inkMid, flex: 1 },

  // ── Corps de texte ────────────────────────────────────────────────────────
  p:     { fontSize: 9, color: C.ink, textAlign: 'justify', marginBottom: 4, paddingLeft: 8 },
  pBold: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 4, paddingLeft: 8 },
  pSmall: { fontSize: 8, color: C.inkMid, textAlign: 'justify', marginBottom: 3, paddingLeft: 8 },

  // ── Points a) b) / 1° 2° ─────────────────────────────────────────────────
  ptRow: { flexDirection: 'row', marginBottom: 3, paddingLeft: 16 },
  ptLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.caramel, width: 26 },
  ptBody: { fontSize: 9, color: C.ink, flex: 1, textAlign: 'justify' },
  ptBodyBold: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.ink, flex: 1 },

  // ── Table récapitulatif financier ─────────────────────────────────────────
  tableWrap: { marginLeft: 8, marginBottom: 6, borderWidth: 1, borderColor: C.border, borderRadius: 3, overflow: 'hidden' },
  tableHdr:  { backgroundColor: C.night, paddingVertical: 4, paddingHorizontal: 8 },
  tableHdrTx: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.surface },
  tableRow:  { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border },
  tableRowL: { flexDirection: 'row' },
  tableCell: { flex: 1, padding: '4 8', fontSize: 8.5, color: C.ink },
  tableCellB: { flex: 1, padding: '4 8', fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.ink },

  // ── Grille financière top ─────────────────────────────────────────────────
  finGrid: { flexDirection: 'row', borderWidth: 1, borderColor: C.caramelB, borderRadius: 4, backgroundColor: C.caramelL, marginBottom: 10, overflow: 'hidden' },
  finCell: { flex: 1, padding: '8 10', alignItems: 'center', borderRightWidth: 1, borderRightColor: C.caramelB },
  finCellL: { flex: 1, padding: '8 10', alignItems: 'center' },
  finAmt: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.night },
  finLbl: { fontSize: 7, color: C.inkMid, marginTop: 2, textAlign: 'center' },
  finSub: { fontSize: 6, color: C.inkFaint, marginTop: 1 },

  // ── Cartes parties ────────────────────────────────────────────────────────
  partiesRow: { flexDirection: 'row', marginBottom: 8 },
  partyCard: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden', marginRight: 8 },
  partyCardL: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden' },
  partyHeadO: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: C.owner },
  partyHeadT: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: C.tenant },
  partyHeadTx: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.surface },
  partyBody: { padding: 8 },
  partyName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 2 },
  partyDetail: { fontSize: 7.5, color: C.inkMid, marginBottom: 1 },

  // ── Boîtes ────────────────────────────────────────────────────────────────
  infoBox: { backgroundColor: C.ownerL, borderLeftWidth: 2.5, borderLeftColor: C.owner, borderRadius: 3, padding: 7, marginBottom: 5, marginLeft: 8 },
  warnBox: { backgroundColor: C.warnBg, borderLeftWidth: 2.5, borderLeftColor: C.caramel, borderRadius: 3, padding: 7, marginBottom: 5, marginLeft: 8 },
  errBox:  { backgroundColor: C.errBg,  borderLeftWidth: 2.5, borderLeftColor: '#fca5a5', borderRadius: 3, padding: 7, marginBottom: 5, marginLeft: 8 },

  // ── Liste à puces (XI Annexes) ────────────────────────────────────────────
  bulletRow: { flexDirection: 'row', marginBottom: 3, paddingLeft: 16 },
  bulletDot: { fontSize: 9, color: C.caramel, marginRight: 6 },
  bulletTx:  { fontSize: 9, color: C.ink, flex: 1 },

  // ── Clauses personnalisées ────────────────────────────────────────────────
  clauseBox:   { borderWidth: 1, borderColor: C.border, borderRadius: 3, marginBottom: 5 },
  clauseHead:  { backgroundColor: C.muted, paddingVertical: 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  clauseBadge: { backgroundColor: C.night, borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1, marginRight: 5 },
  clauseBadgeTx: { fontSize: 6, color: C.surface, fontFamily: 'Helvetica-Bold' },
  clauseCustom:  { backgroundColor: C.caramel, borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1, marginLeft: 5 },
  clauseTitle:   { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.ink },
  clauseBody:    { padding: 7, fontSize: 8.5, color: C.inkMid, textAlign: 'justify' },

  // ── Signatures (table 2 colonnes) ─────────────────────────────────────────
  sigRow:     { flexDirection: 'row', marginTop: 16 },
  sigBox:     { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, marginRight: 12, overflow: 'hidden' },
  sigBoxL:    { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden' },
  sigHeadO:   { backgroundColor: C.owner, padding: 7 },
  sigHeadT:   { backgroundColor: C.tenant, padding: 7 },
  sigHeadTx:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.surface },
  sigBody:    { padding: 10, minHeight: 100 },
  sigName:    { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 2 },
  sigEmail:   { fontSize: 7, color: C.inkFaint, marginBottom: 6 },
  sigDate:    { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.tenant, marginBottom: 3 },
  sigImg:     { width: 150, height: 55, objectFit: 'contain', marginBottom: 4 },
  sigEmpty:   { fontSize: 7.5, color: C.inkFaint, fontStyle: 'italic', marginTop: 10, borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 5 },
  sigMeta:    { fontSize: 6, color: C.inkFaint, marginTop: 1 },
  sigMetaOk:  { fontSize: 6, color: C.tenant, marginTop: 1 },

  // ── Séparateur & layout ───────────────────────────────────────────────────
  divider: { borderTopWidth: 0.5, borderTopColor: C.border, marginVertical: 6 },

  // ── Pied de page ─────────────────────────────────────────────────────────
  footer: {
    position: 'absolute', bottom: 18, left: 45, right: 45,
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
const Sec = ({ num, title }: { num: string; title: string }) => (
  <View style={s.secRow}>
    <Text style={s.secNum}>{num}</Text>
    <Text style={s.secTitle}>{title}</Text>
  </View>
)

const Sub = ({ letter, title }: { letter: string; title: string }) => (
  <View style={s.subRow}>
    <Text style={s.subLetter}>{letter}.</Text>
    <Text style={s.subTitle}>{title}</Text>
  </View>
)

const P = ({ children, bold, small }: { children: ReactNode; bold?: boolean; small?: boolean }) => (
  <Text style={bold ? s.pBold : small ? s.pSmall : s.p}>{children}</Text>
)

const Pt = ({ label, children, bold }: { label: string; children: ReactNode; bold?: boolean }) => (
  <View style={s.ptRow}>
    <Text style={s.ptLabel}>{label}</Text>
    <Text style={bold ? s.ptBodyBold : s.ptBody}>{children}</Text>
  </View>
)

const Bullet = ({ children }: { children: ReactNode }) => (
  <View style={s.bulletRow}>
    <Text style={s.bulletDot}>•</Text>
    <Text style={s.bulletTx}>{children}</Text>
  </View>
)

const Footer = ({ docRef, page }: { docRef: string; page: string }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerTx}>Bail habitation · Loi n°89-462 · Loi ALUR 24 mars 2014 · Décret n°2015-587 · Réf. {docRef}</Text>
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
  const zoneTendue     = cnt.zoneTendue === 'Oui'
  const encadrementLoyer = cnt.encadrementLoyer === 'Oui'
  const dpe        = cnt.classeEnergie || ''
  const dpeWarn    = dpe === 'F' || dpe === 'G'
  const dom        = cnt.territoireDom === 'Oui'

  const dureeAns   = isMeuble ? '1 an' : '3 ans'
  const depositMax = isMeuble ? '2 mois de loyer HC' : '1 mois de loyer HC'

  const payMode: Record<string, string> = {
    virement: 'virement bancaire', Virement_bancaire: 'virement bancaire',
    prelevement: 'prélèvement automatique', cheque: 'chèque bancaire', especes: 'espèces',
  }
  const payMethod = payMode[cnt.paymentMethod] || cnt.paymentMethod || 'virement ou prélèvement'
  const hasCustomPage = enabled.length > 0 || !!contract.terms

  const Watermark = () => (
    <View style={{ position: 'absolute', top: '40%', left: '8%', opacity: 0.03 }}>
      <Text style={{ fontSize: 72, fontFamily: 'Helvetica-Bold', color: C.night }}>BAILIO</Text>
    </View>
  )

  return (
    <Document
      title={`Bail – ${contract.property?.title ?? ''}`}
      author="Bailio – Plateforme de gestion locative"
      subject="Contrat de location – Modèle type Décret n°2015-587"
      keywords="bail, location, ALUR, décret 2015-587"
    >

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 1 — Titre · Intro · Section I (Parties) · Section II (Objet)
          ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Watermark />

        {/* Titre principal */}
        <View style={s.titleBlock}>
          <Text style={s.titleMain}>
            CONTRAT DE LOCATION {isMeuble ? 'OU DE COLOCATION — LOGEMENT MEUBLÉ' : 'OU DE COLOCATION — LOGEMENT NU'} EN RÉSIDENCE PRINCIPALE
          </Text>
          <Text style={s.titleSub}>Conforme au contrat type défini à l'annexe {isMeuble ? '2' : '1'} du décret n° 2015-587 du 29 mai 2015.</Text>
          <Text style={s.titleSub}>Soumis au titre I{isMeuble ? 'er bis' : 'er'} de la loi du 6 juillet 1989 tendant à améliorer les rapports locatifs.</Text>
          <View style={s.refRow}>
            <Text style={s.refLeft}>Généré le {new Date().toLocaleDateString('fr-FR')}</Text>
            <Text style={s.refRight}>Réf. {docRef}</Text>
          </View>
        </View>

        {/* Intro légale */}
        <Text style={s.introText}>
          Le présent contrat type de location contient uniquement les clauses essentielles dont la législation et la réglementation en vigueur au jour de sa publication imposent la mention par les parties. Il appartient cependant aux parties de s'assurer des dispositions applicables au jour de la conclusion du contrat.
        </Text>
        <Text style={s.introText}>
          Au-delà de ces clauses, les parties sont également soumises à l'ensemble des dispositions légales et réglementaires d'ordre public applicables aux baux d'habitation sans qu'il soit nécessaire de les faire figurer dans le contrat et qui sont rappelées utilement dans la notice d'information jointe.
        </Text>

        {/* Grille financière récap */}
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
            <Text style={s.finLbl}>Total mensuel</Text>
          </View>
          {contract.deposit != null && (
            <View style={s.finCellL}>
              <Text style={s.finAmt}>{fmtEUR(contract.deposit)}</Text>
              <Text style={s.finLbl}>Dépôt de garantie</Text>
              <Text style={s.finSub}>max {depositMax}</Text>
            </View>
          )}
        </View>

        {/* ─── I. DÉSIGNATION DES PARTIES ──────────────────────────────────── */}
        <Sec num="I." title="DÉSIGNATION DES PARTIES" />
        <P>Le présent contrat est conclu entre les soussignés :</P>
        <View style={s.partiesRow}>
          <View style={s.partyCard}>
            <View style={s.partyHeadO}><Text style={s.partyHeadTx}>Le bailleur</Text></View>
            <View style={s.partyBody}>
              <Text style={s.partyName}>{contract.owner?.firstName} {contract.owner?.lastName}</Text>
              <Text style={s.partyDetail}>Qualité : {cnt.qualiteBailleur || 'Propriétaire bailleur'}</Text>
              {cnt.adresseBailleur ? <Text style={s.partyDetail}>Adresse : {cnt.adresseBailleur}</Text> : null}
              <Text style={s.partyDetail}>{contract.owner?.email}</Text>
              {contract.owner?.phone ? <Text style={s.partyDetail}>Tél. {contract.owner.phone}</Text> : null}
              {cnt.siret ? <Text style={s.partyDetail}>SIRET : {cnt.siret}</Text> : null}
            </View>
          </View>
          <View style={s.partyCardL}>
            <View style={s.partyHeadT}><Text style={s.partyHeadTx}>Le(s) locataire(s)</Text></View>
            <View style={s.partyBody}>
              <Text style={s.partyName}>{contract.tenant?.firstName} {contract.tenant?.lastName}</Text>
              <Text style={s.partyDetail}>{contract.tenant?.email}</Text>
              {contract.tenant?.phone ? <Text style={s.partyDetail}>Tél. {contract.tenant.phone}</Text> : null}
              {cnt.adresseLocataire ? <Text style={s.partyDetail}>Adresse actuelle : {cnt.adresseLocataire}</Text> : null}
              {cnt.professionLocataire ? <Text style={s.partyDetail}>Profession : {cnt.professionLocataire}</Text> : null}
            </View>
          </View>
        </View>
        <P>Il a été convenu ce qui suit :</P>

        {/* ─── II. OBJET DU CONTRAT ─────────────────────────────────────────── */}
        <Sec num="II." title="Objet du contrat" />
        <P>Le présent contrat a pour objet la location d'un logement ainsi déterminé :</P>

        <Sub letter="A" title="Consistance du logement" />
        <P>Adresse du logement : {contract.property?.address ?? '—'}, {contract.property?.postalCode ?? ''} {contract.property?.city ?? ''}</P>
        <P>Identifiant fiscal du logement : {cnt.numeroFiscal || '________________________________________'}</P>
        <P>Type d'habitat : {cnt.typeHabitat || 'immeuble collectif'}</P>
        <P>Régime juridique de l'immeuble : {cnt.regimeJuridique || 'copropriété'}</P>
        <P>Période de construction : {cnt.periodeConstruction || '________________________________________'}</P>
        <P>Surface habitable : {contract.property?.surface ?? '____________________'} m²</P>
        <P>Nombre de pièces principales : {contract.property?.bedrooms != null ? contract.property.bedrooms + 1 : '____________________'}</P>
        <P>Autres parties du logement : {cnt.autresParties || '________________________________________'}</P>
        <P>Éléments d'équipements du logement : {cnt.equipements || '________________________________________'}</P>
        <P>Modalité de production de chauffage : {cnt.chauffage || 'individuel'}</P>
        <P>Modalité de production d'eau chaude sanitaire : {cnt.ecs || 'individuelle'}</P>

        {/* Rappel DPE avec calendrier légal */}
        <P>Rappel : un logement décent doit respecter les critères minimaux de performance suivants :</P>
        {!dom ? (
          <>
            <Pt label="a)" children="En France métropolitaine :" />
            <Pt label="i)" children="À compter du 1er janvier 2025, le niveau de performance minimal du logement correspond à la classe F du DPE ;" />
            <Pt label="ii)" children="À compter du 1er janvier 2028, le niveau de performance minimal du logement correspond à la classe E du DPE ;" />
            <Pt label="iii)" children="À compter du 1er janvier 2034, le niveau de performance minimal du logement correspond à la classe D du DPE." />
          </>
        ) : (
          <>
            <Pt label="b)" children="En Guadeloupe, Martinique, Guyane, La Réunion et Mayotte :" />
            <Pt label="i)" children="À compter du 1er janvier 2028, le niveau de performance minimal du logement correspond à la classe F du DPE ;" />
            <Pt label="ii)" children="À compter du 1er janvier 2031, le niveau de performance minimal du logement correspond à la classe E du DPE." />
          </>
        )}
        <P>Niveau de performance du logement : {dpe ? `Classe ${dpe} — GES : ${cnt.ges || 'NC'}` : '________________________________________'}</P>
        {dpeWarn && (
          <View style={s.warnBox}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.warnTx, marginBottom: 2 }}>⚠ Logement classé {dpe} — Passoire thermique</Text>
            <Text style={{ fontSize: 7.5, color: C.warnTx }}>Hausse de loyer interdite à la relocation (Loi Climat et Résilience du 22 août 2021). Ce logement sera soumis à l'interdiction de location progressive à partir du 1er janvier {dpe === 'G' ? '2025' : '2028'}.</Text>
          </View>
        )}

        <Sub letter="B" title="Destination des locaux" />
        <P>Les locaux sont loués pour un usage exclusif d'habitation à titre de résidence principale.</P>

        <Sub letter="C" title="Locaux et équipements accessoires de l'immeuble à usage privatif du locataire" />
        <P>{cnt.locauxPrivatifs || 'Néant'}</P>

        <Sub letter="D" title="Locaux, parties, équipements et accessoires de l'immeuble à usage commun" />
        <P>{cnt.locauxCommuns || 'Néant'}</P>

        <Sub letter="E" title="Équipement d'accès aux technologies de l'information et de la communication" />
        <P>{cnt.equipementsNumeriques || 'Raccordement TV · Raccordement ADSL'}</P>

        <Footer docRef={docRef} page="1 / Fin" />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 2 — Section III (Durée) · Section IV (Conditions financières)
          ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Watermark />
        <View style={{ marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.night }}>Réf. {docRef} — {contract.property?.address}, {contract.property?.city}</Text>
        </View>

        {/* ─── III. DATE ET DURÉE ───────────────────────────────────────────── */}
        <Sec num="III." title="Date de prise d'effet et durée du contrat" />
        <P>La durée du contrat et sa date de prise d'effet sont ainsi définies :</P>

        <Sub letter="A" title="Date de prise d'effet du contrat" />
        <P>Date de prise d'effet du contrat : {fmtDate(contract.startDate)}</P>

        <Sub letter="B" title="Durée du contrat" />
        <P>Durée du contrat : {getDuration(contract.startDate, contract.endDate)} ({dureeAns} conformément à l'{isMeuble ? 'art. 25-7' : 'art. 10'} loi 89-462)</P>
        <P>Date d'échéance contractuelle : {fmtDate(contract.endDate)}</P>
        <P>En l'absence de proposition de renouvellement du contrat, celui-ci est, à son terme, reconduit tacitement pour {isMeuble ? '1 an' : '3 ou 6 ans'} et dans les mêmes conditions. Le locataire peut mettre fin au bail à tout moment, après avoir donné congé. Le bailleur, quant à lui, peut mettre fin au bail à son échéance et après avoir donné congé, soit pour reprendre le logement en vue de l'occuper lui-même ou une personne de sa famille, soit pour le vendre, soit pour un motif sérieux et légitime.</P>

        <View style={s.divider} />

        {/* ─── IV. CONDITIONS FINANCIÈRES ──────────────────────────────────── */}
        <Sec num="IV." title="Conditions financières" />
        <P>Les parties conviennent des conditions financières suivantes :</P>

        <Sub letter="A" title="Loyer" />

        <Pt label="1°" children="Fixation du loyer initial" bold />
        <Pt label="a)" children={`Montant du loyer mensuel : ${fmtEUR(contract.monthlyRent)}`} />
        <Pt label="b)" children="Modalités particulières de fixation initiale du loyer applicables dans certaines zones tendues :" />
        <P>Le loyer du logement objet du présent contrat est soumis au décret fixant annuellement le montant maximum d'évolution des loyers à la relocation : {zoneTendue ? 'OUI' : 'NON'}</P>
        <P>Le loyer du logement objet du présent contrat est soumis au loyer de référence majoré fixé par arrêté préfectoral : {encadrementLoyer ? 'OUI' : 'NON'}</P>

        {(zoneTendue || encadrementLoyer) && (
          <View style={s.warnBox}>
            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.warnTx, marginBottom: 2 }}>Encadrement des loyers — mentions obligatoires (art. 17 loi 89-462)</Text>
            {cnt.loyerReference && <Text style={{ fontSize: 7.5, color: C.warnTx }}>Loyer de référence : {cnt.loyerReference} €/m²/mois</Text>}
            {cnt.loyerReferenceMajore && <Text style={{ fontSize: 7.5, color: C.warnTx }}>Loyer de référence majoré : {cnt.loyerReferenceMajore} €/m²/mois</Text>}
            {cnt.complementLoyer ? <Text style={{ fontSize: 7.5, color: C.warnTx }}>Complément de loyer : {cnt.complementLoyer} €/mois</Text> : <Text style={{ fontSize: 7.5, color: C.warnTx }}>Complément de loyer : Néant</Text>}
            {cnt.dernierLoyer && (
              <Text style={{ fontSize: 7.5, color: C.warnTx, marginTop: 3 }}>
                Loyer du dernier locataire : {cnt.dernierLoyer} €/mois{cnt.dernierLoyerDate ? ` (dernier versement : ${cnt.dernierLoyerDate})` : ''}{cnt.dernierIndexDate ? ` — Dernière révision IRL le : ${cnt.dernierIndexDate}` : ''}{cnt.dernierIrlValeur ? ` — Indice IRL alors appliqué : ${cnt.dernierIrlValeur}` : ''}
              </Text>
            )}
          </View>
        )}

        <Pt label="2°" children="Modalités de révision" bold />
        <Pt label="a)" children={`Date de révision : ${cnt.dateRevision || '1er du mois suivant l\'anniversaire'}`} />
        <Pt label="b)" children={`Date ou trimestre de référence de l'IRL : ${cnt.irlTrimestre || '2ème trimestre'} ${cnt.irlAnnee || new Date().getFullYear()}${cnt.irlValeur ? ` — valeur : ${cnt.irlValeur}` : ''}`} />
        <P>Le loyer sera révisé chaque année à la date indiquée précédemment, en comparant la variation annuelle du dernier indice IRL connu, ou de tout autre indice l'ayant remplacé.</P>

        <Sub letter="B" title="Charges récupérables" />
        <P>Modalité de règlement des charges récupérables : {cnt.typeCharges === 'forfait' ? 'forfait de charges (sans régularisation)' : 'provisions sur charges avec régularisation annuelle'}</P>
        <P>Montant de la provision sur charges : {contract.charges != null ? `${fmtEUR(contract.charges)} / mois` : 'Néant'}</P>
        {cnt.typeCharges !== 'forfait' && contract.charges != null && (
          <P>Cette provision pour charges pourra être réévaluée à chaque régularisation, à la hausse ou à la baisse, en fonction des charges réelles (décret n°87-713 du 26 août 1987).</P>
        )}

        <Sub letter="C" title="Souscription par le bailleur d'une assurance MRH pour le compte des colocataires" />
        <P>{cnt.assuranceBailleurColoc ? 'OUI — voir conditions jointes' : 'NON'}</P>

        <Sub letter="D" title="Souscription par le bailleur des abonnements privatifs" />
        <P>{cnt.abonnementsBailleur ? 'OUI — voir conditions jointes' : 'NON'}</P>

        <Sub letter="E" title="Modalités de paiement" />
        <P>Périodicité du paiement : mensuelle</P>
        <P>Paiement : à échoir</P>
        <P>Date ou période de paiement : au plus tard le {cnt.paymentDay || '5'} du mois</P>
        <P>Lieu de paiement : paiement reçu par le propriétaire ({payMethod})</P>

        {/* Table récapitulatif mensuel */}
        <View style={s.tableWrap}>
          <View style={s.tableHdr}>
            <Text style={s.tableHdrTx}>Récapitulatif des sommes dues chaque mois par le locataire à partir de la première échéance complète</Text>
          </View>
          <View style={s.tableRow}>
            <Text style={s.tableCell}>Loyer mensuel</Text>
            <Text style={s.tableCellB}>{fmtEUR(contract.monthlyRent)}</Text>
          </View>
          <View style={s.tableRow}>
            <Text style={s.tableCell}>Provision / forfait de charges</Text>
            <Text style={s.tableCellB}>{contract.charges != null ? fmtEUR(contract.charges) : '0,00 €'}</Text>
          </View>
          <View style={s.tableRowL}>
            <Text style={[s.tableCellB, { backgroundColor: C.muted }]}>Total</Text>
            <Text style={[s.tableCellB, { backgroundColor: C.muted }]}>{fmtEUR(total)}</Text>
          </View>
        </View>

        <Footer docRef={docRef} page="2 / Fin" />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 3 — V (Travaux) · VI (Garanties) · VII (Solidarité) · VIII (Clause résolutoire)
          ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Watermark />
        <View style={{ marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.night }}>Réf. {docRef} — Travaux · Garanties · Solidarité · Clause résolutoire</Text>
        </View>

        {/* ─── V. TRAVAUX ───────────────────────────────────────────────────── */}
        <Sec num="V." title="Travaux" />

        <Sub letter="A" title="Travaux bailleur entre deux locataires" />
        <P>Montant et nature des travaux d'amélioration ou de mise en conformité avec les caractéristiques de décence effectués depuis la fin du dernier contrat de location ou depuis le dernier renouvellement :</P>
        <P>{cnt.travauxBailleurEntreLocataires || 'NÉANT'}</P>
        {cnt.montantTravaux && <P>Montant total des travaux : {cnt.montantTravaux} €</P>}

        <Sub letter="B" title="Travaux bailleur en cours de bail" />
        <P>Majoration du loyer en cours de bail consécutive à des travaux d'amélioration entrepris par le bailleur :</P>
        <P>{cnt.travauxBailleurCoursDebail || 'NÉANT'}</P>

        <Sub letter="C" title="Travaux locataire en cours de bail" />
        <P>Diminution de loyer en cours de bail consécutive à des travaux entrepris par le locataire :</P>
        <P>{cnt.travauxLocataire || 'NÉANT'}</P>

        <View style={s.divider} />

        {/* ─── VI. GARANTIES ────────────────────────────────────────────────── */}
        <Sec num="VI." title="Garanties" />
        <P>Montant du dépôt de garantie de l'exécution des obligations du locataire : {contract.deposit != null ? fmtEUR(contract.deposit) : '____________________'}</P>
        <P>En cas de co-titularité du bail, le dépôt de garantie ne sera restitué en intégralité que lors de la résiliation du contrat, une fois les locaux libérés.</P>
        <P>Il est enfin rappelé que le dépôt de garantie ne pourra pas être utilisé par le locataire en déduction du dernier loyer.</P>
        {contract.deposit != null && (
          <P>Le dépôt de garantie sera restitué dans un délai de 1 mois (état des lieux de sortie conforme) ou 2 mois (différences imputables au locataire) à compter de la remise des clés (art. 22 loi 89-462). Tout retard entraîne une majoration de 10 % du loyer mensuel HC par mois commencé.</P>
        )}

        <View style={s.divider} />

        {/* ─── VII. CLAUSE DE SOLIDARITÉ ────────────────────────────────────── */}
        <Sec num="VII." title="Clause de solidarité" />
        <P>Modalités particulières des obligations en cas de pluralité de locataires :</P>
        {cnt.clauseSolidarite ? (
          <P>En cas de pluralité de locataires co-signataires, ceux-ci sont tenus solidairement et indivisiblement de l'ensemble des obligations locatives. La solidarité d'un colocataire sortant cesse à l'entrée de son remplaçant ou, à défaut, six mois après la prise d'effet de son congé (art. 8-1 loi 89-462).</P>
        ) : (
          <P>NÉANT</P>
        )}

        <View style={s.divider} />

        {/* ─── VIII. CLAUSE RÉSOLUTOIRE ─────────────────────────────────────── */}
        <Sec num="VIII." title="Clause résolutoire" />
        <P>Modalités de résiliation de plein droit du contrat :</P>
        <P>Il est prévu que le bail sera résilié immédiatement et de plein droit dans les cas suivants, si bon semble au bailleur :</P>
        <Pt label="1)" children="six semaines après un commandement demeuré infructueux à défaut de paiement du loyer ou des charges (qu'il s'agisse des provisions ou de la régularisation annuelle) aux termes convenus ou à défaut de versement du dépôt de garantie" />
        <Pt label="2)" children="un mois après un commandement demeuré infructueux à défaut d'assurance des risques locatifs par le locataire" />
        <Pt label="3)" children="troubles de voisinage constatés par une décision de justice passée en force de chose jugée." />
        <P>Une fois acquis au bailleur le bénéfice de la clause résolutoire, le locataire devra immédiatement quitter les lieux sans qu'aucune offre de paiement ou d'exécution de ses obligations ne puisse faire obstacle à la résiliation du contrat. Si le locataire refusait de quitter les locaux, il suffirait d'une simple ordonnance de référé pour constater la résiliation du bail et engager la procédure d'expulsion du locataire.</P>
        <P>Il est enfin précisé que le locataire est tenu des obligations du présent bail jusqu'à libération effective des lieux sans préjudice des dispositions de l'article 1760 du Code Civil, et ce nonobstant l'expulsion.</P>

        <Footer docRef={docRef} page="3 / Fin" />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 4 — Section IX (Honoraires) · X (Autres conditions particulières)
          ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Watermark />
        <View style={{ marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.night }}>Réf. {docRef} — Honoraires · Conditions particulières</Text>
        </View>

        {/* ─── IX. HONORAIRES ───────────────────────────────────────────────── */}
        <Sec num="IX." title="Honoraires" />
        {cnt.honoraires ? (
          <>
            <P>Honoraires à la charge du bailleur : {cnt.honorairesBailleur || '—'}</P>
            <P>Honoraires à la charge du locataire (plafonnés par l'art. 5 loi 89-462) :</P>
            <Pt label="–" children={`Visite, constitution dossier, rédaction bail : ${cnt.honorairesLocataire || '—'} (plafond : ${(contract.property?.surface ?? 0) * (zoneTendue ? 10 : 12)} €)`} />
            <Pt label="–" children={`État des lieux : ${cnt.honorairesEdl || '—'} (plafond : ${(contract.property?.surface ?? 0) * 3} €)`} />
          </>
        ) : (
          <P>NÉANT</P>
        )}

        <View style={s.divider} />

        {/* ─── X. AUTRES CONDITIONS PARTICULIÈRES ──────────────────────────── */}
        <Sec num="X." title="Autres conditions particulières" />

        {/* Droit de visite du bailleur */}
        <Sub letter="" title="Droit de visite du bailleur" />
        <P>Une fois le congé envoyé par l'une ou l'autre des parties, ou en cas de mise en vente du logement par le propriétaire sans congé donné au locataire, le locataire s'oblige à laisser visiter le bien en sa présence ou non, à raison de 5 créneaux par semaine, de 2 heures en jours ouvrables entre 8h et 20h. Pour chaque semaine, le locataire devra communiquer au bailleur, 2 jours à l'avance, les créneaux et les modalités de récupération des clefs en son absence le cas échéant.</P>

        {/* Modalités de paiement */}
        <Sub letter="" title="Modalités de paiement" />
        <P>Le paiement du loyer et des charges se fera par prélèvement ou virement. En cas de colocation via un bail unique avec clause de solidarité, le paiement de l'intégralité du loyer et des charges sera effectué par un des colocataires.</P>

        {/* Entretien des appareils */}
        <Sub letter="" title="Entretien des appareils de chauffage" />
        <P>Le locataire devra faire entretenir et nettoyer conformément à la législation en vigueur et au moins une fois l'an les appareils individuels de chauffage, de production d'eau chaude ou de froid (chaudière, chauffe-eau, pompe à chaleur, ballon d'eau chaude, climatisation etc.), à sa charge et à son initiative.</P>
        <P>Le locataire devra notamment faire procéder au moins une fois l'an à une visite de contrôle, par un professionnel agréé, des chaudières individuelles au fioul, gaz, bois, charbon ou tout autre combustible, dont la puissance est comprise entre 4 et 400 kilowatts. Le bailleur pourra s'il le souhaite demander au locataire de produire des justificatifs de ces visites de contrôle.</P>

        {/* Communication électronique */}
        <Sub letter="" title="Communication électronique" />
        <P>Les parties acceptent de communiquer par voie électronique pour les besoins de l'exécution du présent bail. Ce mode de communication s'applique notamment pour la transmission des quittances de loyer et des appels de charges, les échanges courants relatifs à la vie du bail, et tout autre document ne nécessitant pas de formalisme particulier.</P>
        <P>Les adresses électroniques des parties sont celles mentionnées dans le présent bail. Chaque partie s'engage à informer l'autre sans délai de tout changement d'adresse électronique. Pour les actes nécessitant un formalisme particulier (congés), les parties pourront recourir au courrier recommandé électronique qualifié ou postal.</P>

        {/* Dégradations et vétusté */}
        <Sub letter="" title="Dégradations du locataire et grille de vétusté" />
        <P>Le locataire sera tenu responsable de toutes dégradations, usure anormale, pertes ou pannes, concernant les équipements mobiliers ou immobiliers du logement pendant la durée de son occupation.</P>
        <P>Pour le calcul du préjudice et des dédommagements dus par le locataire au bailleur, les parties acceptent la grille de vétusté en pièce jointe et son principe de calcul. À défaut il sera retenu un coefficient de vétusté annuel de 7 % pour tous les équipements.</P>

        {/* Animaux */}
        <Sub letter="" title="Détention d'animaux" />
        <P>La détention d'animaux domestiques est autorisée par le bailleur, à condition qu'elle ne trouble pas la jouissance des voisins ni ne provoque de dégradations aux parties communes. De plus le bailleur interdit la détention dans les locaux loués de chiens de première catégorie telle que définie par l'article L211-12 et suivants du Code rural et de la pêche maritime.</P>

        {/* Assurance habitation */}
        <Sub letter="" title="Assurance habitation du locataire" />
        <P>Le bailleur rappelle au locataire qu'il est tenu de s'assurer contre les risques locatifs (notamment dégât des eaux, incendie, explosion) auprès d'une compagnie d'assurance lui proposant un contrat multi-risque habitation.</P>
        <P>Il devra fournir une attestation correspondante au bailleur lors de l'état des lieux d'entrée, puis à chaque date d'anniversaire du bail. En l'absence de transmission, le bailleur peut résilier le bail ou souscrire un contrat pour le compte du Locataire et lui refacturer les primes correspondantes (art. 7-3 loi 89-462).</P>

        <Footer docRef={docRef} page="4 / Fin" />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 5 — Section XI (Annexes)
          ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Watermark />
        <View style={{ marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.night }}>Réf. {docRef} — Annexes légales</Text>
        </View>

        {/* ─── XI. ANNEXES ──────────────────────────────────────────────────── */}
        <Sec num="XI." title="Annexes" />
        <P>Sont annexées et jointes au contrat de location les pièces suivantes :</P>

        <Bullet children="Une notice d'information relative aux droits et obligations des locataires et des bailleurs (arrêté du 29 mai 2015)" />
        <Bullet children="Un état des lieux d'entrée (décret n°2016-382 du 30 mars 2016)" />
        {isMeuble && <Bullet children="Un inventaire détaillé et état du mobilier, signé contradictoirement" />}
        <Bullet children="La liste des charges récupérables (décret n°87-713 du 26 août 1987)" />
        <Bullet children="La liste des réparations locatives (décret n°87-712 du 26 août 1987)" />
        <Bullet children="La grille de vétusté pour calcul des dégradations" />
        {cnt.caution && <Bullet children="L'acte de cautionnement solidaire avec mentions manuscrites (art. 22-1 loi 89-462)" />}
        {zoneTendue && <Bullet children="L'arrêté préfectoral fixant les loyers de référence sur la commune (zone d'encadrement des loyers)" />}
        <Bullet children="Le diagnostic de performance énergétique (DPE) — valable 10 ans" />
        <Bullet children="L'état des risques et pollutions (ERP) — valable 6 mois" />
        {cnt.diags?.plomb && <Bullet children="Le constat de risque d'exposition au plomb (CREP)" />}
        {cnt.diags?.electricite && <Bullet children="Le diagnostic des installations électriques" />}
        {cnt.diags?.gaz && <Bullet children="Le diagnostic des installations de gaz" />}
        {cnt.diags?.amiante && <Bullet children="Le diagnostic amiante" />}

        <View style={{ marginTop: 14, borderWidth: 1, borderColor: C.border, borderRadius: 3, padding: 7 }}>
          <Text style={{ fontSize: 7.5, color: C.inkMid, textAlign: 'justify', lineHeight: 1.6 }}>
            Rappel — Clauses réputées non écrites (art. 4 loi 89-462) : Sont nulles de plein droit les clauses qui imposent la souscription d'une assurance auprès d'une compagnie désignée, prévoient le paiement de frais de quittance, interdisent les animaux domestiques (hors dangereux), mettent à la charge du locataire des charges non récupérables (taxe foncière, honoraires de gestion), fixent un dépôt de garantie supérieur aux plafonds légaux, ou interdisent les travaux d'adaptation au handicap.
          </Text>
        </View>

        {/* Lieu et date de signature (avant la page de signatures) */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 9.5, color: C.inkMid, textAlign: 'center' }}>
            {'Le '}
            <Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>
              {contract.signedAt
                ? fmtDateS(contract.signedAt)
                : (contract.signedByOwner || contract.signedByTenant)
                  ? fmtDateS(contract.signedByOwner || contract.signedByTenant || new Date().toISOString())
                  : '________________________________'}
            </Text>
            {' à '}
            <Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>
              {contract.property?.city || '________________________________'}
            </Text>
          </Text>
        </View>

        <Footer docRef={docRef} page="5 / Fin" />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 6 optionnelle — Conditions particulières & clauses libres
          ══════════════════════════════════════════════════════════════════════ */}
      {hasCustomPage && (
        <Page size="A4" style={s.page}>
          <Watermark />
          <View style={{ marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.night }}>Réf. {docRef} — Clauses librement convenues</Text>
          </View>

          <Sec num="XII." title="Clauses spécifiques librement convenues (art. 4 loi 89-462)" />
          <P>Les clauses ci-après ont été librement négociées et acceptées d'un commun accord. Elles complètent les dispositions légales sans pouvoir y déroger au détriment du locataire.</P>

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
              <View style={s.clauseHead}><Text style={s.clauseTitle}>Conditions particulières additionnelles</Text></View>
              <Text style={s.clauseBody}>{contract.terms}</Text>
            </View>
          )}

          <Footer docRef={docRef} page="6 / Fin" />
        </Page>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DERNIÈRE PAGE — Signatures (table 2 colonnes)
          ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Watermark />
        <View style={{ marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: C.night }}>
          <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.night, textAlign: 'center' }}>SIGNATURES</Text>
          <Text style={{ fontSize: 8, color: C.inkMid, textAlign: 'center', marginTop: 4 }}>
            Réf. {docRef} — {contract.property?.address}, {contract.property?.city}
          </Text>
        </View>

        {/* Base légale signature électronique */}
        <View style={s.infoBox}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.owner, marginBottom: 2 }}>Valeur juridique des signatures électroniques :</Text>
          <Text style={{ fontSize: 8, color: C.inkMid, textAlign: 'justify', lineHeight: 1.55 }}>
            Conformément aux articles 1366 et 1367 du Code civil et au règlement européen eIDAS (UE n°910/2014), les signatures électroniques ci-dessous ont la même valeur probante qu'une signature manuscrite. Chaque signature est horodatée et associée à une empreinte SHA-256 du document signé.
          </Text>
        </View>

        {/* Consentement */}
        <View style={{ padding: 8, backgroundColor: C.muted, borderRadius: 4, marginBottom: 14 }}>
          <Text style={{ fontSize: 7.5, color: C.inkMid, textAlign: 'justify', lineHeight: 1.6 }}>
            Les soussignés déclarent avoir pris connaissance de l'intégralité du présent contrat ({hasCustomPage ? 'pages 1 à 6' : 'pages 1 à 5'}) et de la totalité de ses annexes légales, et l'accepter sans réserve. Chaque partie reconnaît avoir reçu un exemplaire du présent acte.
          </Text>
        </View>

        {/* Table signatures */}
        <View style={s.sigRow}>
          <View style={s.sigBox}>
            <View style={s.sigHeadO}><Text style={s.sigHeadTx}>Le bailleur — Signature et date</Text></View>
            <View style={s.sigBody}>
              <Text style={s.sigName}>{contract.owner?.firstName} {contract.owner?.lastName}</Text>
              <Text style={s.sigEmail}>{contract.owner?.email}</Text>
              {contract.signedByOwner ? (
                <>
                  <Text style={s.sigDate}>✓ Signé électroniquement le {fmtDate(contract.signedByOwner)}</Text>
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

          <View style={s.sigBoxL}>
            <View style={s.sigHeadT}><Text style={s.sigHeadTx}>Le(s) locataire(s) — Signature et date</Text></View>
            <View style={s.sigBody}>
              <Text style={s.sigName}>{contract.tenant?.firstName} {contract.tenant?.lastName}</Text>
              <Text style={s.sigEmail}>{contract.tenant?.email}</Text>
              {contract.signedByTenant ? (
                <>
                  <Text style={s.sigDate}>✓ Signé électroniquement le {fmtDate(contract.signedByTenant)}</Text>
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

        {/* Mention finale */}
        <View style={{ marginTop: 14, padding: 7, borderWidth: 1, borderColor: C.border, borderRadius: 4 }}>
          <Text style={{ fontSize: 6.5, color: C.inkFaint, textAlign: 'justify', lineHeight: 1.6 }}>
            Document généré par Bailio (bailio.fr). Ce bail est établi conformément au modèle type défini par le Décret n°2015-587 du 29 mai 2015. Réf. {docRef}. Les parties conservent ce document pendant toute la durée du bail et 3 ans après son terme. Bailio n'est pas un cabinet juridique ; en cas de litige, consultez un professionnel du droit.
          </Text>
        </View>

        <Footer docRef={docRef} page="Fin" />
      </Page>
    </Document>
  )
}
