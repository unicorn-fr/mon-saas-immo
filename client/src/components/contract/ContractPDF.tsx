import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import { Contract, ContractClause } from '../../types/contract.types'

// Register a clean font (optional - falls back to Helvetica)
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#555',
    marginBottom: 3,
  },
  legalRef: {
    fontSize: 8,
    color: '#888',
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  label: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  col: {
    flex: 1,
  },
  clauseTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  clauseText: {
    fontSize: 9,
    color: '#333',
    marginBottom: 10,
    textAlign: 'justify',
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    minHeight: 120,
  },
  signatureLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  signatureDate: {
    fontSize: 8,
    color: '#666',
    marginBottom: 8,
  },
  signatureImage: {
    width: 150,
    height: 60,
    objectFit: 'contain',
  },
  signaturePlaceholder: {
    fontSize: 8,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 7,
    color: '#aaa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 5,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  financialGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  financialItem: {
    flex: 1,
    textAlign: 'center',
  },
  financialAmount: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
  },
  financialLabel: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
})

interface ContractPDFProps {
  contract: Contract
  clauses?: ContractClause[]
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

export const ContractPDF = ({ contract, clauses }: ContractPDFProps) => {
  const enabledClauses = clauses?.filter((c) => c.enabled) ?? []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CONTRAT DE LOCATION</Text>
          <Text style={styles.subtitle}>Bail d'habitation - Residence principale</Text>
          <Text style={styles.legalRef}>
            Loi n 89-462 du 6 juillet 1989 modifiee par la Loi ALUR du 24 mars 2014
          </Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ARTICLE 1 - LES PARTIES</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>LE BAILLEUR (Proprietaire)</Text>
              <Text style={styles.value}>
                {contract.owner?.firstName} {contract.owner?.lastName}
              </Text>
              <Text style={{ ...styles.value, fontSize: 9, color: '#555' }}>
                {contract.owner?.email}
              </Text>
              {contract.owner?.phone && (
                <Text style={{ ...styles.value, fontSize: 9, color: '#555' }}>
                  Tel: {contract.owner.phone}
                </Text>
              )}
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>LE LOCATAIRE</Text>
              <Text style={styles.value}>
                {contract.tenant?.firstName} {contract.tenant?.lastName}
              </Text>
              <Text style={{ ...styles.value, fontSize: 9, color: '#555' }}>
                {contract.tenant?.email}
              </Text>
              {contract.tenant?.phone && (
                <Text style={{ ...styles.value, fontSize: 9, color: '#555' }}>
                  Tel: {contract.tenant.phone}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Property */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ARTICLE 2 - DESIGNATION DES LIEUX</Text>
          <Text style={styles.value}>
            <Text style={styles.bold}>{contract.property?.title}</Text>
          </Text>
          <Text style={styles.value}>
            {contract.property?.address}, {contract.property?.postalCode} {contract.property?.city}
          </Text>
          <View style={styles.row}>
            {contract.property?.type && (
              <View style={styles.col}>
                <Text style={styles.label}>Type</Text>
                <Text style={styles.value}>{contract.property.type}</Text>
              </View>
            )}
            {contract.property?.surface && (
              <View style={styles.col}>
                <Text style={styles.label}>Surface habitable</Text>
                <Text style={styles.value}>{contract.property.surface} m2</Text>
              </View>
            )}
            {contract.property?.bedrooms != null && (
              <View style={styles.col}>
                <Text style={styles.label}>Nombre de pieces</Text>
                <Text style={styles.value}>
                  {contract.property.bedrooms} chambre(s), {contract.property.bathrooms} SDB
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ARTICLE 3 - DUREE ET DATES</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Date de prise d'effet</Text>
              <Text style={styles.value}>{formatDate(contract.startDate)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Date de fin</Text>
              <Text style={styles.value}>{formatDate(contract.endDate)}</Text>
            </View>
          </View>
        </View>

        {/* Financial Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ARTICLE 4 - CONDITIONS FINANCIERES</Text>
          <View style={styles.financialGrid}>
            <View style={styles.financialItem}>
              <Text style={styles.financialAmount}>{formatCurrency(contract.monthlyRent)}</Text>
              <Text style={styles.financialLabel}>Loyer mensuel</Text>
            </View>
            {contract.charges != null && (
              <View style={styles.financialItem}>
                <Text style={styles.financialAmount}>{formatCurrency(contract.charges)}</Text>
                <Text style={styles.financialLabel}>Charges mensuelles</Text>
              </View>
            )}
            {contract.deposit != null && (
              <View style={styles.financialItem}>
                <Text style={styles.financialAmount}>{formatCurrency(contract.deposit)}</Text>
                <Text style={styles.financialLabel}>Depot de garantie</Text>
              </View>
            )}
          </View>
          {contract.charges != null && (
            <Text style={styles.value}>
              Total mensuel : {formatCurrency(contract.monthlyRent + (contract.charges || 0))}
            </Text>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document genere le {new Date().toLocaleDateString('fr-FR')} - Contrat de location - Loi ALUR
        </Text>
      </Page>

      {/* Page 2: Clauses */}
      {enabledClauses.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CLAUSES ET CONDITIONS</Text>
            {enabledClauses.map((clause, index) => (
              <View key={clause.id} style={{ marginBottom: 12 }}>
                <Text style={styles.clauseTitle}>
                  {index + 1}. {clause.title}
                </Text>
                <Text style={styles.clauseText}>{clause.description}</Text>
              </View>
            ))}
          </View>

          {/* Custom terms */}
          {contract.terms && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CONDITIONS PARTICULIERES</Text>
              <Text style={styles.clauseText}>{contract.terms}</Text>
            </View>
          )}

          <Text style={styles.footer}>
            Document genere le {new Date().toLocaleDateString('fr-FR')} - Contrat de location - Loi ALUR
          </Text>
        </Page>
      )}

      {/* Page 3: Signatures */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SIGNATURES</Text>
          <Text style={{ ...styles.value, marginBottom: 15 }}>
            Les parties declarent avoir pris connaissance de l'ensemble des clauses du present contrat
            et les accepter sans reserve. Le present bail est etabli en deux exemplaires originaux.
          </Text>
        </View>

        <View style={styles.signatureSection}>
          {/* Owner Signature */}
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le Bailleur</Text>
            <Text style={styles.value}>
              {contract.owner?.firstName} {contract.owner?.lastName}
            </Text>
            {contract.signedByOwner && (
              <Text style={styles.signatureDate}>
                Signe le {formatDate(contract.signedByOwner)}
              </Text>
            )}
            {contract.ownerSignature ? (
              <Image style={styles.signatureImage} src={contract.ownerSignature} />
            ) : (
              <Text style={styles.signaturePlaceholder}>En attente de signature</Text>
            )}
          </View>

          {/* Tenant Signature */}
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le Locataire</Text>
            <Text style={styles.value}>
              {contract.tenant?.firstName} {contract.tenant?.lastName}
            </Text>
            {contract.signedByTenant && (
              <Text style={styles.signatureDate}>
                Signe le {formatDate(contract.signedByTenant)}
              </Text>
            )}
            {contract.tenantSignature ? (
              <Image style={styles.signatureImage} src={contract.tenantSignature} />
            ) : (
              <Text style={styles.signaturePlaceholder}>En attente de signature</Text>
            )}
          </View>
        </View>

        <Text style={styles.footer}>
          Document genere le {new Date().toLocaleDateString('fr-FR')} - Contrat de location - Loi ALUR
        </Text>
      </Page>
    </Document>
  )
}
