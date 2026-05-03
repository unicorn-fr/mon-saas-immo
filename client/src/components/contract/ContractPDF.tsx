/**
 * ContractPDF — Bail d'habitation conforme Loi n°89-462 du 6 juillet 1989
 * Modèle type annexe 1 du décret n°2015-587 du 29 mai 2015 (logement nu)
 * Style : rédaction notariale — noir sur blanc, aucune couleur décorative
 */
import type { ReactNode } from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { Contract, ContractClause } from '../../types/contract.types'

// ─── Typographie & mise en page ───────────────────────────────────────────────
const FONT  = 'Times-Roman'
const FONTB = 'Times-Bold'
const FONTI = 'Times-Italic'

const s = StyleSheet.create({
  page: {
    paddingTop: 55,
    paddingBottom: 65,
    paddingHorizontal: 65,
    fontSize: 9.5,
    fontFamily: FONT,
    color: '#000000',
    lineHeight: 1.55,
    backgroundColor: '#ffffff',
  },

  // ── En-tête ──────────────────────────────────────────────────────────────────
  headerCenter: {
    textAlign: 'center',
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 12,
    fontFamily: FONTB,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  subTitle: {
    fontSize: 8.5,
    fontFamily: FONTI,
    textAlign: 'center',
    marginBottom: 2,
  },
  refLine: {
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 2,
  },
  hRule: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginVertical: 10,
  },
  hRuleThin: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#000000',
    marginVertical: 6,
  },

  // ── Section (I. TITRE) ────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 10,
    fontFamily: FONTB,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 5,
    letterSpacing: 0.3,
  },

  // ── Sous-section (A. Titre) ────────────────────────────────────────────────────
  subTitle2: {
    fontSize: 9.5,
    fontFamily: FONTB,
    marginTop: 8,
    marginBottom: 3,
    paddingLeft: 0,
    textDecoration: 'underline',
  },

  // ── Corps ─────────────────────────────────────────────────────────────────────
  p: {
    fontSize: 9.5,
    textAlign: 'justify',
    marginBottom: 5,
    fontFamily: FONT,
  },
  pBold: {
    fontSize: 9.5,
    fontFamily: FONTB,
    marginBottom: 4,
  },
  pItalic: {
    fontSize: 8.5,
    fontFamily: FONTI,
    marginBottom: 4,
    color: '#333333',
  },
  pIndent: {
    fontSize: 9.5,
    textAlign: 'justify',
    marginBottom: 4,
    paddingLeft: 20,
    fontFamily: FONT,
  },

  // ── Ligne de données (label : valeur) ─────────────────────────────────────────
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 9.5,
    fontFamily: FONTB,
    width: 200,
    flexShrink: 0,
  },
  fieldValue: {
    fontSize: 9.5,
    fontFamily: FONT,
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: '#666666',
    paddingBottom: 1,
  },

  // ── Tableau financier ──────────────────────────────────────────────────────────
  table: {
    borderWidth: 0.75,
    borderColor: '#000000',
    marginVertical: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000000',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.75,
    borderBottomColor: '#000000',
    backgroundColor: '#f0f0f0',
  },
  tableCell: {
    flex: 1,
    padding: '4 8',
    fontSize: 9,
    fontFamily: FONT,
    borderRightWidth: 0.5,
    borderRightColor: '#000000',
  },
  tableCellLast: {
    flex: 1,
    padding: '4 8',
    fontSize: 9,
    fontFamily: FONT,
  },
  tableCellBold: {
    flex: 1,
    padding: '4 8',
    fontSize: 9,
    fontFamily: FONTB,
    borderRightWidth: 0.5,
    borderRightColor: '#000000',
  },
  tableCellBoldLast: {
    flex: 1,
    padding: '4 8',
    fontSize: 9,
    fontFamily: FONTB,
  },
  tableHeader: {
    flex: 1,
    padding: '4 8',
    fontSize: 9,
    fontFamily: FONTB,
    borderRightWidth: 0.5,
    borderRightColor: '#000000',
    textTransform: 'uppercase',
  },
  tableHeaderLast: {
    flex: 1,
    padding: '4 8',
    fontSize: 9,
    fontFamily: FONTB,
    textTransform: 'uppercase',
  },

  // ── Encart légal (clause résolutoire etc.) ────────────────────────────────────
  legalBox: {
    borderWidth: 0.75,
    borderColor: '#000000',
    padding: '8 10',
    marginVertical: 6,
  },
  legalBoxTitle: {
    fontSize: 9.5,
    fontFamily: FONTB,
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'center',
  },

  // ── Signatures ────────────────────────────────────────────────────────────────
  sigSection: {
    marginTop: 20,
  },
  sigRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  sigBlock: {
    flex: 1,
    marginRight: 20,
  },
  sigBlockLast: {
    flex: 1,
  },
  sigLabel: {
    fontSize: 9,
    fontFamily: FONTB,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sigLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#000000',
    marginBottom: 4,
    height: 16,
  },
  sigImg: {
    width: 140,
    height: 50,
    objectFit: 'contain',
    marginBottom: 4,
  },
  sigMeta: {
    fontSize: 7.5,
    fontFamily: FONTI,
    color: '#555555',
    marginBottom: 2,
  },

  // ── Pied de page fixe ────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 65,
    right: 65,
    borderTopWidth: 0.5,
    borderTopColor: '#000000',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    fontFamily: FONTI,
    color: '#444444',
  },
  pageNum: {
    fontSize: 7,
    fontFamily: FONT,
    color: '#444444',
  },
})

// ─── Utilitaires ──────────────────────────────────────────────────────────────
const fmtDate = (d?: string | null): string => {
  if (!d) return '___________________'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '___________________'
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const fmtEUR = (n?: number | null): string => {
  if (n == null || isNaN(n)) return '___________________'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

const blank = (label?: string | null, fallback = '___________________'): string =>
  label?.trim() ? label.trim() : fallback

const getDuration = (s?: string | null, e?: string | null): string => {
  if (!s || !e) return '___________________'
  const ms = new Date(e).getTime() - new Date(s).getTime()
  if (isNaN(ms) || ms <= 0) return '___________________'
  const totalMonths = Math.round(ms / (30.44 * 86400000))
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  const parts: string[] = []
  if (y > 0) parts.push(`${y} an${y > 1 ? 's' : ''}`)
  if (m > 0) parts.push(`${m} mois`)
  return parts.join(' et ') || '___________________'
}

// ─── Micro-composants ─────────────────────────────────────────────────────────
const Field = ({ label, value }: { label: string; value: ReactNode }) => (
  <View style={s.fieldRow}>
    <Text style={s.fieldLabel}>{label} :</Text>
    <Text style={s.fieldValue}>{value}</Text>
  </View>
)

const Footer = ({ docRef }: { docRef: string }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerText}>
      Bail habitation — Loi n°89-462 du 6 juillet 1989 — Loi ALUR du 24 mars 2014 — Décret n°2015-587 — Réf. {docRef}
    </Text>
    <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </View>
)

// ─── Composant principal ──────────────────────────────────────────────────────
interface ContractPDFProps {
  contract: Contract
  clauses?: ContractClause[]
}

export const ContractPDF = ({ contract, clauses }: ContractPDFProps) => {
  const enabled = (clauses ?? []).filter(c => c.enabled)
  const cnt     = (contract.content as Record<string, any>) || {}
  const docRef  = (contract.id ?? '').substring(0, 8).toUpperCase() || 'BROUILLON'

  const isMeuble        = cnt.meuble === 'Meuble'
  const zoneTendue      = cnt.zoneTendue === 'Oui'
  const encadrementLoyer = cnt.encadrementLoyer === 'Oui'
  const dpe             = cnt.classeEnergie || ''
  const dpeWarn         = dpe === 'F' || dpe === 'G'
  const dom             = cnt.territoireDom === 'Oui'
  const dureeRef        = isMeuble ? '1 an' : '3 ans'
  const depositMax      = isMeuble ? 'deux (2) mois de loyer hors charges' : 'un (1) mois de loyer hors charges'
  const annexeRef       = isMeuble ? '2' : '1'

  const payModes: Record<string, string> = {
    virement: 'virement bancaire',
    Virement_bancaire: 'virement bancaire',
    prelevement: 'prélèvement automatique',
    cheque: 'chèque bancaire',
    especes: 'espèces (reçu obligatoire)',
  }
  const payMethod = payModes[cnt.paymentMethod] || cnt.paymentMethod || 'virement bancaire'

  const ownerName  = `${blank(contract.owner?.firstName)} ${blank(contract.owner?.lastName)}`
  const tenantName = `${blank(contract.tenant?.firstName)} ${blank(contract.tenant?.lastName)}`
  const rent       = contract.monthlyRent ?? 0
  const charges    = contract.charges ?? 0
  const deposit    = contract.deposit
  const totalMens  = rent + charges

  const sigMeta = (cnt.signatureMetadata as Record<string, any>) || {}
  const hasCustom = enabled.length > 0 || !!contract.terms

  return (
    <Document
      title={`Bail de location — ${contract.property?.address ?? ''} — ${tenantName}`}
      author="Bailio — Gestion locative"
      subject="Contrat de location à usage d'habitation principale"
      keywords="bail, location, loi ALUR, décret 2015-587"
    >

      {/* ════════════════════════════════════════════════════════════════════════
          PAGE 1 — En-tête · Parties · Objet
          ════════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Footer docRef={docRef} />

        {/* ── En-tête ─────────────────────────────────────────────────────── */}
        <Text style={s.mainTitle}>
          CONTRAT DE LOCATION {isMeuble ? '— LOGEMENT MEUBLÉ' : '— LOGEMENT NU'}{'\n'}À USAGE DE RÉSIDENCE PRINCIPALE
        </Text>
        <Text style={s.subTitle}>
          Conforme au modèle type défini à l'annexe {annexeRef} du décret n°2015-587 du 29 mai 2015{'\n'}
          Soumis aux dispositions du titre I{isMeuble ? 'er bis' : 'er'} de la loi n°89-462 du 6 juillet 1989
        </Text>
        <View style={s.hRule} />
        <Text style={s.refLine}>Référence : {docRef} — Établi le {new Date().toLocaleDateString('fr-FR')}</Text>
        <View style={s.hRuleThin} />

        {/* ── Préambule ───────────────────────────────────────────────────── */}
        <Text style={s.pItalic}>
          Le présent contrat type de location est conforme aux dispositions légales et réglementaires en vigueur. Il
          contient les clauses essentielles imposées par la loi. Au-delà de ces clauses, les parties sont soumises à
          l'ensemble des dispositions d'ordre public applicables aux baux d'habitation, rappelées dans la notice
          d'information jointe en annexe.
        </Text>

        {/* ── I. DÉSIGNATION DES PARTIES ─────────────────────────────────── */}
        <Text style={s.sectionTitle}>I. — Désignation des parties</Text>
        <Text style={s.p}>Entre les soussignés :</Text>

        <Text style={s.subTitle2}>Le bailleur</Text>
        <Field label="Nom et prénom" value={ownerName} />
        <Field label="Qualité" value={blank(cnt.qualiteBailleur, 'Propriétaire bailleur')} />
        {cnt.adresseBailleur && <Field label="Domicile" value={cnt.adresseBailleur} />}
        <Field label="Adresse électronique" value={blank(contract.owner?.email)} />
        {contract.owner?.phone && <Field label="Téléphone" value={contract.owner.phone} />}
        {cnt.siret && <Field label="N° SIRET" value={cnt.siret} />}
        <Text style={s.p}> </Text>

        <Text style={s.subTitle2}>Le(s) locataire(s)</Text>
        <Field label="Nom et prénom" value={tenantName} />
        {cnt.adresseLocataire && <Field label="Domicile actuel" value={cnt.adresseLocataire} />}
        <Field label="Adresse électronique" value={blank(contract.tenant?.email)} />
        {contract.tenant?.phone && <Field label="Téléphone" value={contract.tenant.phone} />}
        {cnt.professionLocataire && <Field label="Profession" value={cnt.professionLocataire} />}
        <Text style={s.p}> </Text>

        <Text style={s.p}>Il a été convenu et arrêté ce qui suit :</Text>

        {/* ── II. OBJET DU CONTRAT ────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>II. — Objet du contrat</Text>
        <Text style={s.p}>
          Le présent contrat a pour objet la location du logement dont les caractéristiques sont définies ci-après,
          à usage exclusif d'habitation à titre de résidence principale du locataire.
        </Text>

        <Text style={s.subTitle2}>A. Consistance du logement</Text>
        <Field label="Adresse" value={`${blank(contract.property?.address)}, ${blank(contract.property?.postalCode)} ${blank(contract.property?.city)}`} />
        <Field label="Identifiant fiscal" value={blank(cnt.numeroFiscal)} />
        <Field label="Type d'habitat" value={blank(cnt.typeHabitat, 'Immeuble collectif')} />
        <Field label="Régime juridique" value={blank(cnt.regimeJuridique, 'Copropriété')} />
        <Field label="Période de construction" value={blank(cnt.periodeConstruction)} />
        <Field label="Surface habitable" value={contract.property?.surface ? `${contract.property.surface} m²` : '___________________'} />
        <Field label="Nombre de pièces principales" value={contract.property?.bedrooms != null ? String(contract.property.bedrooms + 1) : '___________________'} />
        <Field label="Autres parties du logement" value={blank(cnt.autresParties, 'Néant')} />
        <Field label="Éléments d'équipement" value={blank(cnt.equipements)} />
        <Field label="Mode de chauffage" value={blank(cnt.chauffage, 'Individuel')} />
        <Field label="Production d'eau chaude sanitaire" value={blank(cnt.ecs, 'Individuelle')} />

        <Text style={s.subTitle2}>B. Destination des locaux</Text>
        <Text style={s.p}>
          Les locaux sont loués à usage exclusif d'habitation à titre de résidence principale du locataire, conformément
          à l'article 2 de la loi n°89-462 du 6 juillet 1989.
        </Text>

        <Text style={s.subTitle2}>C. Locaux à usage privatif du locataire</Text>
        <Text style={s.p}>{blank(cnt.locauxPrivatifs, 'Néant')}</Text>

        <Text style={s.subTitle2}>D. Parties communes et équipements collectifs</Text>
        <Text style={s.p}>{blank(cnt.locauxCommuns, 'Néant')}</Text>

        <Text style={s.subTitle2}>E. Équipement numérique</Text>
        <Text style={s.p}>{blank(cnt.equipementsNumeriques, 'Raccordement télévision — Raccordement ADSL')}</Text>

        <Text style={s.subTitle2}>F. Performance énergétique (DPE)</Text>
        <Field label="Classe énergie" value={dpe ? `Classe ${dpe}` : '___________________'} />
        <Field label="Émissions de gaz à effet de serre" value={cnt.ges ? `Classe ${cnt.ges}` : '___________________'} />
        {dpeWarn && (
          <View style={s.legalBox}>
            <Text style={s.pBold}>
              AVERTISSEMENT — Logement classé {dpe} (passoire thermique)
            </Text>
            <Text style={s.p}>
              En application de la loi n°2021-1104 du 22 août 2021 portant lutte contre le dérèglement climatique,
              le présent logement est soumis à une interdiction progressive de location :
              {dpe === 'G' ? ' à compter du 1er janvier 2025 pour les logements classés G, puis' : ''} à compter du
              1er janvier {dpe === 'G' ? '2028' : '2028'} pour les logements classés F. Aucune hausse de loyer ne
              peut être appliquée à la relocation.
            </Text>
          </View>
        )}

        <Text style={s.p}>
          Calendrier légal de performance minimale (France métropolitaine) :
        </Text>
        {!dom ? (
          <>
            <Text style={s.pIndent}>— À compter du 1er janvier 2025 : classe F du DPE ;</Text>
            <Text style={s.pIndent}>— À compter du 1er janvier 2028 : classe E du DPE ;</Text>
            <Text style={s.pIndent}>— À compter du 1er janvier 2034 : classe D du DPE.</Text>
          </>
        ) : (
          <>
            <Text style={s.pIndent}>— À compter du 1er janvier 2028 : classe F du DPE (DOM) ;</Text>
            <Text style={s.pIndent}>— À compter du 1er janvier 2031 : classe E du DPE (DOM).</Text>
          </>
        )}
      </Page>

      {/* ════════════════════════════════════════════════════════════════════════
          PAGE 2 — Durée · Conditions financières
          ════════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Footer docRef={docRef} />

        {/* ── III. DATE ET DURÉE ──────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>III. — Date de prise d'effet et durée du contrat</Text>

        <Text style={s.subTitle2}>A. Date de prise d'effet</Text>
        <Field label="Date de prise d'effet" value={fmtDate(contract.startDate)} />

        <Text style={s.subTitle2}>B. Durée du contrat</Text>
        <Field label="Durée du contrat" value={`${getDuration(contract.startDate, contract.endDate)} (${dureeRef} — art. ${isMeuble ? '25-7' : '10'} loi 89-462)`} />
        <Field label="Date d'échéance" value={fmtDate(contract.endDate)} />

        <Text style={s.pIndent}>
          À défaut de congé donné dans les délais légaux, le contrat est reconduit tacitement aux mêmes conditions.
          Le locataire peut résilier le bail à tout moment sous réserve du préavis légal. Le bailleur ne peut donner
          congé qu'à l'échéance du bail et dans les conditions prévues aux articles 15 et suivants de la loi du
          6 juillet 1989.
        </Text>

        {/* ── IV. CONDITIONS FINANCIÈRES ──────────────────────────────────── */}
        <Text style={s.sectionTitle}>IV. — Conditions financières</Text>

        <Text style={s.subTitle2}>A. Loyer</Text>

        <Text style={s.pBold}>1° Fixation du loyer initial</Text>
        <Field label="Montant du loyer mensuel" value={`${fmtEUR(rent)} hors charges`} />

        <Text style={s.p}>
          Fixation du loyer en zone soumise au décret plafonnant les loyers à la relocation :{' '}
          <Text style={{ fontFamily: FONTB }}>{zoneTendue ? 'OUI' : 'NON'}</Text>
        </Text>
        <Text style={s.p}>
          Loyer soumis à l'encadrement par loyer de référence majoré (arrêté préfectoral) :{' '}
          <Text style={{ fontFamily: FONTB }}>{encadrementLoyer ? 'OUI' : 'NON'}</Text>
        </Text>

        {(zoneTendue || encadrementLoyer) && (
          <View style={s.legalBox}>
            <Text style={s.legalBoxTitle}>Mentions obligatoires — Encadrement des loyers (art. 17 loi 89-462)</Text>
            <Field label="Loyer de référence" value={cnt.loyerReference ? `${cnt.loyerReference} €/m²/mois` : '___________________'} />
            <Field label="Loyer de référence majoré" value={cnt.loyerReferenceMajore ? `${cnt.loyerReferenceMajore} €/m²/mois` : '___________________'} />
            <Field label="Complément de loyer" value={cnt.complementLoyer ? `${cnt.complementLoyer} €/mois` : 'Néant'} />
            {cnt.complementLoyerJustif && <Field label="Justification du complément" value={cnt.complementLoyerJustif} />}
            {cnt.dernierLoyer && (
              <>
                <Field label="Loyer du dernier locataire" value={`${cnt.dernierLoyer} €/mois`} />
                {cnt.dernierLoyerDate && <Field label="Date du dernier versement" value={cnt.dernierLoyerDate} />}
                {cnt.dernierIndexDate && <Field label="Date de dernière révision IRL" value={cnt.dernierIndexDate} />}
                {cnt.dernierIrlValeur && <Field label="Valeur IRL à cette date" value={cnt.dernierIrlValeur} />}
              </>
            )}
          </View>
        )}

        <Text style={s.pBold}>2° Révision du loyer</Text>
        <Text style={s.p}>
          En application de l'article 17-1 de la loi du 6 juillet 1989, le loyer pourra être révisé chaque année
          à la date anniversaire du contrat en fonction de la variation de l'Indice de Référence des Loyers (IRL)
          publié trimestriellement par l'INSEE (indice de référence : {blank(cnt.irlTrimestre, 'dernier IRL publié à la date de signature')}).
        </Text>

        <Text style={s.pBold}>3° Mode de paiement</Text>
        <Field label="Mode de paiement" value={payMethod} />
        <Field label="Échéance de paiement" value={`Le ${blank(cnt.paymentDay, '5')} de chaque mois`} />
        <Field label="Lieu de paiement" value={blank(cnt.lieuPaiement, 'Virement au compte du bailleur')} />

        <Text style={s.subTitle2}>B. Charges récupérables</Text>
        <Field label="Régime des charges" value={isMeuble ? 'Forfait de charges — non révisable en cours de bail' : 'Provisions sur charges avec régularisation annuelle'} />
        <Field label="Montant des charges" value={charges > 0 ? `${fmtEUR(charges)} / mois` : 'Néant'} />
        {!isMeuble && charges > 0 && (
          <Text style={s.pIndent}>
            Une régularisation annuelle des charges sera effectuée sur la base des dépenses réelles. Le bailleur
            adressera le décompte des charges au locataire dans le délai d'un mois avant la date de régularisation.
          </Text>
        )}

        <Text style={s.subTitle2}>C. Dépôt de garantie</Text>
        <Field label="Montant du dépôt de garantie" value={deposit != null ? fmtEUR(deposit) : 'Néant'} />
        {deposit != null && (
          <Text style={s.pIndent}>
            Le dépôt de garantie, d'un montant maximal de {depositMax}, est versé à la signature du présent contrat.
            Il sera restitué dans un délai d'un (1) mois à compter de la remise des clés si l'état des lieux de
            sortie est conforme à l'état des lieux d'entrée, ou de deux (2) mois dans le cas contraire
            (art. 22 loi 89-462).
          </Text>
        )}

        <Text style={s.subTitle2}>D. Récapitulatif financier mensuel</Text>
        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={s.tableHeader}>Désignation</Text>
            <Text style={s.tableHeaderLast}>Montant mensuel</Text>
          </View>
          <View style={s.tableRow}>
            <Text style={s.tableCell}>Loyer hors charges</Text>
            <Text style={s.tableCellLast}>{fmtEUR(rent)}</Text>
          </View>
          <View style={s.tableRow}>
            <Text style={s.tableCell}>Charges récupérables</Text>
            <Text style={s.tableCellLast}>{charges > 0 ? fmtEUR(charges) : 'Néant'}</Text>
          </View>
          <View style={s.tableRowLast}>
            <Text style={s.tableCellBold}>TOTAL MENSUEL (charges comprises)</Text>
            <Text style={s.tableCellBoldLast}>{fmtEUR(totalMens)}</Text>
          </View>
        </View>

        {deposit != null && (
          <View style={s.table}>
            <View style={s.tableRowLast}>
              <Text style={s.tableCell}>Dépôt de garantie (versé à la signature)</Text>
              <Text style={s.tableCellLast}>{fmtEUR(deposit)}</Text>
            </View>
          </View>
        )}
      </Page>

      {/* ════════════════════════════════════════════════════════════════════════
          PAGE 3 — Travaux · Garanties · Clause résolutoire
          ════════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Footer docRef={docRef} />

        {/* ── V. TRAVAUX ───────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>V. — Travaux</Text>

        <Text style={s.subTitle2}>A. Travaux effectués depuis le dernier contrat</Text>
        <Field label="Travaux réalisés par le bailleur" value={blank(cnt.travauxBailleur, 'Néant')} />
        {cnt.montantTravauxBailleur && <Field label="Montant des travaux" value={`${cnt.montantTravauxBailleur} €`} />}
        <Field label="Travaux réalisés par le locataire" value={blank(cnt.travauxLocataire, 'Néant')} />

        <Text style={s.subTitle2}>B. Travaux envisagés au cours du bail</Text>
        <Text style={s.p}>{blank(cnt.travauxEnvisages, 'Aucun travaux n\'est prévu au cours du bail.')}</Text>

        <Text style={s.subTitle2}>C. Franchise de loyer</Text>
        <Text style={s.p}>{blank(cnt.franchiseLoyer, 'Aucune franchise de loyer n\'est accordée.')}</Text>

        {/* ── VI. CAUTIONNEMENT ────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>VI. — Cautionnement</Text>
        <Text style={s.p}>
          {cnt.caution
            ? `Une caution solidaire est fournie par ${blank(cnt.cautionNom)}. L'acte de cautionnement est annexé au présent contrat.`
            : 'Aucun acte de cautionnement solidaire n\'est prévu au présent contrat.'}
        </Text>

        {/* ── VII. CLAUSE DE SOLIDARITÉ ────────────────────────────────────── */}
        <Text style={s.sectionTitle}>VII. — Solidarité entre colocataires</Text>
        <Text style={s.p}>
          En cas de colocation, les colocataires et leur(s) caution(s) sont tenus solidairement au paiement du loyer
          et des charges dans les conditions prévues à l'article 8-1 de la loi du 6 juillet 1989.
        </Text>

        {/* ── VIII. CLAUSE RÉSOLUTOIRE ─────────────────────────────────────── */}
        <Text style={s.sectionTitle}>VIII. — Clause résolutoire</Text>
        <View style={s.legalBox}>
          <Text style={s.legalBoxTitle}>Clause résolutoire de plein droit — Article 24 de la loi n°89-462</Text>
          <Text style={s.p}>
            Il est expressément convenu que le présent bail sera résilié de plein droit, si bon semble au bailleur,
            et sans qu'il soit besoin de faire ordonner cette résiliation en justice, dans les cas suivants :
          </Text>
          <Text style={s.pIndent}>
            1° Deux (2) mois après un commandement de payer demeuré infructueux, en cas de non-paiement aux termes
            convenus de tout ou partie du loyer, des charges récupérables ou du dépôt de garantie ;
          </Text>
          <Text style={s.pIndent}>
            2° Un (1) mois après un commandement demeuré infructueux, en cas de non-souscription par le locataire
            d'une assurance contre les risques locatifs dans les conditions fixées par les articles L.7-1 et suivants
            de la loi du 6 juillet 1989 ;
          </Text>
          <Text style={s.pIndent}>
            3° Dès que le trouble de voisinage causé par le locataire a fait l'objet d'une décision de justice
            passée en force de chose jugée.
          </Text>
          <Text style={s.p}>
            La résiliation du bail est constatée par ordonnance de référé rendue par le juge des contentieux de la
            protection. Une fois acquis au bailleur le bénéfice de la clause résolutoire, le locataire devra
            immédiatement quitter les lieux. Dans le cas où il ne satisferait pas à cette obligation, il pourra
            être contraint de le faire par voie d'huissier.
          </Text>
          <Text style={s.p}>
            Il est précisé que le locataire est tenu au respect de toutes les obligations du présent bail jusqu'à
            libération effective des lieux, nonobstant l'exécution de la procédure d'expulsion.
          </Text>
        </View>

        {/* ── IX. HONORAIRES ───────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>IX. — Honoraires de location</Text>
        {cnt.honorairesLocataire || cnt.honorairesEdl ? (
          <>
            <Text style={s.pIndent}>
              — Visite, constitution du dossier et rédaction du bail :{' '}
              {cnt.honorairesLocataire ? `${cnt.honorairesLocataire} €` : '___________________'}
              {contract.property?.surface && ` (plafond légal : ${(contract.property.surface * (zoneTendue ? 10 : 12)).toFixed(2)} €)`}
            </Text>
            <Text style={s.pIndent}>
              — État des lieux :{' '}
              {cnt.honorairesEdl ? `${cnt.honorairesEdl} €` : '___________________'}
              {contract.property?.surface && ` (plafond légal : ${(contract.property.surface * 3).toFixed(2)} €)`}
            </Text>
          </>
        ) : (
          <Text style={s.p}>
            Le présent contrat est conclu sans honoraires à la charge du locataire.
          </Text>
        )}
      </Page>

      {/* ════════════════════════════════════════════════════════════════════════
          PAGE 4 — Conditions particulières · Annexes
          ════════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Footer docRef={docRef} />

        {/* ── X. CONDITIONS PARTICULIÈRES ──────────────────────────────────── */}
        <Text style={s.sectionTitle}>X. — Conditions particulières</Text>

        <Text style={s.subTitle2}>A. Droit de visite</Text>
        <Text style={s.p}>
          Le bailleur ou son mandataire peut accéder aux locaux loués aux jours et heures convenus d'un commun
          accord avec le locataire, dans la limite de deux heures par visite, cinq jours par semaine entre 8h00
          et 20h00, hors jours fériés, et uniquement dans les cas suivants : réalisation de travaux, vente du bien,
          relocation à l'expiration du bail.
        </Text>

        <Text style={s.subTitle2}>B. Entretien de l'installation de chauffage</Text>
        <Text style={s.p}>
          Le locataire est tenu de faire procéder annuellement, par un professionnel qualifié, à l'entretien
          des installations de chauffage individuel relevant de sa responsabilité (chaudière d'une puissance
          comprise entre 4 et 400 kW), conformément à l'article R.224-41-11 du Code de l'environnement. Une
          attestation d'entretien est remise au bailleur sur demande.
        </Text>

        <Text style={s.subTitle2}>C. Communication électronique</Text>
        <Text style={s.p}>
          Conformément à l'article 3 de la loi du 6 juillet 1989, le bailleur et le locataire conviennent
          que les documents visés par le présent contrat (quittances de loyer, avis d'échéance, état des
          comptes de charges) pourront être adressés au locataire par voie électronique à l'adresse communiquée
          ci-dessus. Les actes de procédure demeurent soumis aux règles de signification applicables.
        </Text>

        <Text style={s.subTitle2}>D. Grille de vétusté</Text>
        <Text style={s.p}>
          Les parties conviennent d'appliquer la grille de vétusté établie conformément aux dispositions du
          décret n°2016-382 du 30 mars 2016. Le coefficient annuel de vétusté retenu est de sept pour cent (7 %)
          par an à compter de la date de remise en état ou de mise en service des équipements.
        </Text>

        <Text style={s.subTitle2}>E. Animaux domestiques</Text>
        <Text style={s.p}>
          La détention d'animaux domestiques est autorisée dans les locaux, à l'exception des chiens appartenant
          à la première catégorie au sens de l'article L.211-12 du Code rural et de la pêche maritime.
          Le locataire demeure responsable de tout dommage causé par son animal.
        </Text>

        <Text style={s.subTitle2}>F. Assurance multirisque habitation</Text>
        <Text style={s.p}>
          Le locataire est tenu de souscrire et de maintenir en vigueur, pendant toute la durée du bail, une
          assurance multirisque habitation couvrant au minimum les risques locatifs (incendie, dégâts des eaux,
          explosion), conformément à l'article 7 (g) de la loi du 6 juillet 1989. Une attestation d'assurance
          est remise au bailleur lors de la remise des clés, puis chaque année à la date anniversaire du contrat
          sur simple demande. À défaut, le bailleur peut souscrire cette assurance pour le compte du locataire,
          dont le coût sera récupérable par douzièmes avec le loyer.
        </Text>

        {contract.terms && (
          <>
            <Text style={s.subTitle2}>G. Clauses complémentaires</Text>
            <Text style={s.p}>{contract.terms}</Text>
          </>
        )}

        {/* ── XI. ANNEXES ──────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>XI. — Documents annexés au présent contrat</Text>
        <Text style={s.pIndent}>— Notice d'information relative aux droits et obligations des locataires et des bailleurs ;</Text>
        <Text style={s.pIndent}>— État des lieux d'entrée ;</Text>
        <Text style={s.pIndent}>— Diagnostic de performance énergétique (DPE) ;</Text>
        <Text style={s.pIndent}>— Constat de risque d'exposition au plomb (CREP) si applicable ;</Text>
        <Text style={s.pIndent}>— État des risques naturels et technologiques (ERP) ;</Text>
        {!isMeuble && <Text style={s.pIndent}>— Extraits des règlements de copropriété relatifs à la destination de l'immeuble ;</Text>}
        {cnt.caution && <Text style={s.pIndent}>— Acte de cautionnement solidaire ;</Text>}
        <Text style={s.pIndent}>— Grille de vétusté applicable aux relations bailleurs-locataires.</Text>

        {/* ── Lieu et date de signature ─────────────────────────────────────── */}
        <View style={s.hRuleThin} />
        <Text style={s.p}>
          Fait à {blank(cnt.lieuSignature, '_____________________')}, le {new Date().toLocaleDateString('fr-FR')},
          en deux (2) exemplaires originaux, dont un remis à chacune des parties.
        </Text>
      </Page>

      {/* ════════════════════════════════════════════════════════════════════════
          PAGE CLAUSES PERSONNALISÉES (optionnelle)
          ════════════════════════════════════════════════════════════════════════ */}
      {hasCustom && (
        <Page size="A4" style={s.page}>
          <Footer docRef={docRef} />
          <Text style={s.sectionTitle}>XII. — Clauses particulières supplémentaires</Text>
          <Text style={s.pItalic}>
            Les clauses suivantes ont été librement négociées et convenues entre les parties. Elles ne peuvent
            déroger aux dispositions d'ordre public de la loi du 6 juillet 1989.
          </Text>
          {enabled.map((clause, i) => (
            <View key={clause.id} style={{ marginBottom: 10 }}>
              <Text style={s.subTitle2}>{i + 1}. {clause.title}</Text>
              <Text style={s.p}>{clause.description}</Text>
            </View>
          ))}
        </Page>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          PAGE SIGNATURES
          ════════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Footer docRef={docRef} />

        <Text style={s.sectionTitle}>Signatures des parties</Text>
        <Text style={s.pItalic}>
          En signant le présent contrat, chaque partie reconnaît en avoir pris connaissance dans son intégralité
          et en accepter toutes les clauses et conditions.
        </Text>
        <View style={s.hRuleThin} />

        <View style={s.sigRow}>
          {/* Bailleur */}
          <View style={s.sigBlock}>
            <Text style={s.sigLabel}>Le bailleur</Text>
            <Field label="Nom et prénom" value={ownerName} />
            {contract.signedByOwner ? (
              <>
                <Text style={s.sigMeta}>
                  Signé électroniquement le {fmtDate(contract.signedByOwner)}
                </Text>
                {sigMeta.owner?.ip && <Text style={s.sigMeta}>Adresse IP : {sigMeta.owner.ip}</Text>}
                {sigMeta.owner?.userAgent && <Text style={s.sigMeta}>Navigateur : {sigMeta.owner.userAgent.substring(0, 60)}</Text>}
                {contract.ownerSignature && (
                  <Image src={contract.ownerSignature} style={s.sigImg} />
                )}
              </>
            ) : (
              <>
                <Text style={s.sigMeta}>Signature précédée de la mention « Lu et approuvé » :</Text>
                <View style={s.sigLine} />
                <View style={s.sigLine} />
                <View style={s.sigLine} />
              </>
            )}
          </View>

          {/* Locataire */}
          <View style={s.sigBlockLast}>
            <Text style={s.sigLabel}>Le(s) locataire(s)</Text>
            <Field label="Nom et prénom" value={tenantName} />
            {contract.signedByTenant ? (
              <>
                <Text style={s.sigMeta}>
                  Signé électroniquement le {fmtDate(contract.signedByTenant)}
                </Text>
                {sigMeta.tenant?.ip && <Text style={s.sigMeta}>Adresse IP : {sigMeta.tenant.ip}</Text>}
                {sigMeta.tenant?.userAgent && <Text style={s.sigMeta}>Navigateur : {sigMeta.tenant.userAgent.substring(0, 60)}</Text>}
                {contract.tenantSignature && (
                  <Image src={contract.tenantSignature} style={s.sigImg} />
                )}
              </>
            ) : (
              <>
                <Text style={s.sigMeta}>Signature précédée de la mention « Lu et approuvé » :</Text>
                <View style={s.sigLine} />
                <View style={s.sigLine} />
                <View style={s.sigLine} />
              </>
            )}
          </View>
        </View>

        <View style={{ ...s.hRuleThin, marginTop: 30 }} />
        <Text style={{ ...s.pItalic, textAlign: 'center', marginTop: 8 }}>
          Document généré par la plateforme Bailio — bailio.fr{'\n'}
          Réf. {docRef} — Ce document a valeur contractuelle entre les signataires.
        </Text>
      </Page>

    </Document>
  )
}
