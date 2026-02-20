import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import {
  EtatDesLieux,
  ETAT_LABELS,
} from '../../data/etatDesLieuxTemplate'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#f3f4f6',
    padding: 6,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  colLabel: {
    flex: 3,
    fontSize: 8,
  },
  colEtat: {
    flex: 2,
    fontSize: 8,
    textAlign: 'center',
  },
  colObs: {
    flex: 3,
    fontSize: 8,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  infoItem: {
    width: '50%',
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    marginTop: 20,
  },
  signatureArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  signatureBox: {
    width: '45%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 10,
    minHeight: 80,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 4,
  },
  legalText: {
    fontSize: 7,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 15,
  },
  compteurRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  compteurCol: {
    flex: 1,
    fontSize: 8,
  },
  cleRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  cleCol: {
    flex: 1,
    fontSize: 8,
  },
  emptyLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    borderBottomStyle: 'dotted',
    height: 16,
  },
})

interface EDLPDFProps {
  edl: EtatDesLieux
  blank?: boolean // If true, show empty fields for manual fill
}

export function EDLPDF({ edl, blank = false }: EDLPDFProps) {
  const typeLabel = edl.type === 'ENTREE' ? "d'entree" : 'de sortie'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            ETAT DES LIEUX {typeLabel.toUpperCase()}
          </Text>
          <Text style={styles.subtitle}>
            Conforme au decret n 2016-382 du 30 mars 2016
          </Text>
          <Text style={styles.subtitle}>Date : {edl.date || '____/____/________'}</Text>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARTIES</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Bailleur</Text>
              <Text style={styles.infoValue}>
                {blank ? '________________________________' : `${edl.bailleur.prenom} ${edl.bailleur.nom}`}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Locataire</Text>
              <Text style={styles.infoValue}>
                {blank ? '________________________________' : `${edl.locataire.prenom} ${edl.locataire.nom}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LOGEMENT</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Adresse</Text>
              <Text style={styles.infoValue}>
                {blank ? '________________________________' : edl.adresse}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ville</Text>
              <Text style={styles.infoValue}>
                {blank ? '________________________________' : `${edl.codePostal} ${edl.ville}`}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>
                {blank ? '________________' : edl.typeLogement}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Surface</Text>
              <Text style={styles.infoValue}>
                {blank ? '__________ m2' : `${edl.surface} m2`}
              </Text>
            </View>
          </View>
        </View>

        {/* Room-by-room inspection */}
        {edl.rooms.map((room) => (
          <View key={room.id} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{room.name.toUpperCase()}</Text>
            {/* Table header */}
            <View style={styles.rowHeader}>
              <Text style={[styles.colLabel, styles.bold]}>Element</Text>
              <Text style={[styles.colEtat, styles.bold]}>Etat</Text>
              <Text style={[styles.colObs, styles.bold]}>Observation</Text>
            </View>
            {/* Table rows */}
            {room.elements.map((element) => (
              <View key={element.id} style={styles.row}>
                <Text style={styles.colLabel}>{element.label}</Text>
                <Text style={styles.colEtat}>
                  {blank ? '' : ETAT_LABELS[element.etat]}
                </Text>
                <Text style={styles.colObs}>
                  {blank ? '' : element.observation}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </Page>

      {/* Page 2: Compteurs, Cles, Signatures */}
      <Page size="A4" style={styles.page}>
        {/* Compteurs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RELEVES DES COMPTEURS</Text>
          <View style={styles.rowHeader}>
            <Text style={[styles.compteurCol, styles.bold]}>Type</Text>
            <Text style={[styles.compteurCol, styles.bold]}>N compteur</Text>
            <Text style={[styles.compteurCol, styles.bold]}>Releve (index)</Text>
          </View>
          {edl.compteurs.map((compteur) => (
            <View key={compteur.type} style={styles.compteurRow}>
              <Text style={styles.compteurCol}>{compteur.label}</Text>
              <Text style={styles.compteurCol}>
                {blank ? '' : compteur.numero}
              </Text>
              <Text style={styles.compteurCol}>
                {blank ? '' : compteur.releve}
              </Text>
            </View>
          ))}
        </View>

        {/* Cles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REMISE DES CLES</Text>
          <View style={styles.rowHeader}>
            <Text style={[styles.cleCol, styles.bold]}>Type</Text>
            <Text style={[styles.cleCol, styles.bold]}>Quantite</Text>
            <Text style={[styles.cleCol, styles.bold]}>Description</Text>
          </View>
          {edl.cles.map((cle) => (
            <View key={cle.type} style={styles.cleRow}>
              <Text style={styles.cleCol}>{cle.type}</Text>
              <Text style={styles.cleCol}>
                {blank ? '' : (cle.quantite > 0 ? cle.quantite.toString() : '')}
              </Text>
              <Text style={styles.cleCol}>
                {blank ? '' : cle.description}
              </Text>
            </View>
          ))}
        </View>

        {/* Observations generales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OBSERVATIONS GENERALES</Text>
          {blank ? (
            <View>
              <View style={styles.emptyLine} />
              <View style={styles.emptyLine} />
              <View style={styles.emptyLine} />
              <View style={styles.emptyLine} />
              <View style={styles.emptyLine} />
            </View>
          ) : (
            <Text style={{ fontSize: 9, padding: 4 }}>
              {edl.observationsGenerales || 'Neant'}
            </Text>
          )}
        </View>

        {/* Signatures */}
        <View style={styles.footer}>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
            SIGNATURES
          </Text>
          <Text style={{ fontSize: 8, color: '#6b7280', marginBottom: 8 }}>
            Les soussignes reconnaissent exact le present etat des lieux, etabli contradictoirement et de bonne foi.
          </Text>
          <View style={styles.signatureArea}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Le Bailleur</Text>
              <Text style={styles.signatureLabel}>
                Fait a ____________, le ____/____/________
              </Text>
              <Text style={[styles.signatureLabel, { marginTop: 6 }]}>
                Signature precedee de la mention "Lu et approuve" :
              </Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Le Locataire</Text>
              <Text style={styles.signatureLabel}>
                Fait a ____________, le ____/____/________
              </Text>
              <Text style={[styles.signatureLabel, { marginTop: 6 }]}>
                Signature precedee de la mention "Lu et approuve" :
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.legalText}>
          Etat des lieux etabli conformement a la loi n 89-462 du 6 juillet 1989
          et au decret n 2016-382 du 30 mars 2016
        </Text>
      </Page>
    </Document>
  )
}
