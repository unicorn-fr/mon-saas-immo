import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from '@react-pdf/renderer'

// Mise en page papier : A4, noir et blanc, lisible une fois imprimé.
export const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 56,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.45,
    color: '#111111',
  },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 15, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 9.5, textAlign: 'center', marginBottom: 2 },
  intro: { fontSize: 8.5, textAlign: 'center', color: '#444444', marginBottom: 18 },
  h1: { fontFamily: 'Helvetica-Bold', fontSize: 11.5, marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  h2: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginTop: 8, marginBottom: 3 },
  p: { marginBottom: 4, textAlign: 'justify' },
  bullet: { flexDirection: 'row', marginBottom: 3, paddingLeft: 8 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1, textAlign: 'justify' },
  field: { flexDirection: 'row', marginBottom: 3 },
  fieldLabel: { width: 190, color: '#333333' },
  fieldValue: { flex: 1, fontFamily: 'Helvetica-Bold' },
  box: { borderWidth: 1, borderColor: '#111111', padding: 10, marginTop: 6, marginBottom: 6 },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 56,
    right: 56,
    fontSize: 8,
    color: '#555555',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatures: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 16 },
  signatureBox: { width: '47%', borderWidth: 1, borderColor: '#111111', height: 110, padding: 8 },
})

/** Valeur à compléter à la main si elle n'est pas connue. */
export const BLANK = '____________________________'

export function orBlank(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === '' ? BLANK : String(value)
}

export function H1({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.h1} minPresenceAhead={60}>
      {children}
    </Text>
  )
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.h2} minPresenceAhead={40}>
      {children}
    </Text>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <Text style={styles.p}>{children}</Text>
}

export function Bullet({ children }: { children: ReactNode }) {
  return (
    <View style={styles.bullet} wrap={false}>
      <Text style={styles.bulletDot}>–</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  )
}

export function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.field} wrap={false}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>
        {value}
        {hint ? <Text style={{ fontFamily: 'Helvetica', color: '#555555', fontSize: 8.5 }}>{`\n${hint}`}</Text> : null}
      </Text>
    </View>
  )
}

export function Footer({ left }: { left: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{left}</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} sur ${totalPages}`} />
    </View>
  )
}
