import { createRequire } from 'node:module'
import type { ReactNode } from 'react'
import { Font, Image, StyleSheet, Text, View } from '@react-pdf/renderer'

/**
 * Charte des documents Bailio (maquette « Bail, page 1 », « Quittance », « État des lieux ») :
 * DM Sans, titres en capitales espacées, rubriques soulignées, lignes « libellé / valeur », pied de page
 * avec la version, les cases de paraphe et la pagination. Noir sur blanc, lisible une fois imprimé.
 */

const require = createRequire(import.meta.url)
const dm = (w: number) => require.resolve(`@fontsource/dm-sans/files/dm-sans-latin-${w}-normal.woff`)
Font.register({
  family: 'DM Sans',
  fonts: [
    { src: dm(400), fontWeight: 400 },
    { src: dm(500), fontWeight: 500 },
    { src: dm(600), fontWeight: 600 },
    { src: dm(700), fontWeight: 700 },
    { src: require.resolve('@fontsource/dm-sans/files/dm-sans-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
  ],
})
Font.register({
  family: 'Cormorant',
  fonts: [{ src: require.resolve('@fontsource/cormorant-garamond/files/cormorant-garamond-latin-700-italic.woff'), fontWeight: 700, fontStyle: 'italic' }],
})
// Pas de césure automatique : les mots français restent entiers.
Font.registerHyphenationCallback((word) => [word])

export const INK = '#1a1a2e'
export const MUTED = '#55556a'
export const RULE = '#c9c3b8'
export const SOFT = '#efe9df'
export const SIGN = '#1a3270'

export const s = StyleSheet.create({
  page: { paddingTop: 52, paddingBottom: 78, paddingHorizontal: 54, fontFamily: 'DM Sans', fontSize: 9.5, color: INK },
  // lineHeight sur la page casse les textes dynamiques (pagination) : il est porté par chaque bloc de texte.
  title: { fontSize: 16, fontWeight: 700, letterSpacing: 1.6, textAlign: 'center', textTransform: 'uppercase' },
  subtitle: { fontSize: 11, fontWeight: 500, textAlign: 'center', marginTop: 6 },
  intro: { fontSize: 7.8, color: MUTED, textAlign: 'center', marginTop: 6, marginBottom: 14 },
  section: { fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: INK, marginBottom: 8 },
  sub: { fontSize: 9.5, fontWeight: 700, marginTop: 8, marginBottom: 4 },
  row: { flexDirection: 'row', paddingVertical: 3.5 },
  label: { width: '40%', color: MUTED, paddingRight: 10, fontSize: 9.5, lineHeight: 1.4 },
  value: { width: '60%', fontWeight: 600, fontSize: 9.5, lineHeight: 1.4 },
  p: { marginTop: 3, marginBottom: 3, textAlign: 'justify', fontSize: 9.5, lineHeight: 1.45 },
  small: { fontSize: 7.8, color: MUTED, lineHeight: 1.4 },
  box: { borderWidth: 0.8, borderColor: RULE, backgroundColor: '#faf8f4', padding: 9, marginTop: 4, marginBottom: 8 },
  bullet: { flexDirection: 'row', marginTop: 2 },
  table: { borderWidth: 0.8, borderColor: RULE, marginTop: 4, marginBottom: 6 },
  th: { flexDirection: 'row', backgroundColor: SOFT, borderBottomWidth: 0.8, borderBottomColor: RULE },
  tr: { flexDirection: 'row', borderBottomWidth: 0.8, borderBottomColor: RULE },
  cell: { padding: 5, borderRightWidth: 0.8, borderRightColor: RULE, fontSize: 9, lineHeight: 1.35 },
  footer: { position: 'absolute', left: 54, right: 54, bottom: 26, borderTopWidth: 0.8, borderTopColor: RULE, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', fontSize: 7.5, color: MUTED },
  paraphBox: { width: 34, height: 22, borderWidth: 0.8, borderColor: RULE, marginLeft: 6 },
  signBox: { flexGrow: 1, flexBasis: 0, minWidth: 150, height: 96, borderWidth: 0.8, borderColor: RULE, padding: 7 },
})

/** Valeur inconnue : une ligne à compléter à la main. */
export const BLANK = '__________________________'
export const orBlank = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? BLANK : String(v))

export function Title({ children, subtitle, intro }: { children: ReactNode; subtitle?: ReactNode; intro?: ReactNode }) {
  return (
    <View>
      <Text style={s.title}>{children}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      {intro ? <Text style={s.intro}>{intro}</Text> : <View style={{ height: 12 }} />}
    </View>
  )
}

export const Section = ({ children }: { children: ReactNode }) => (
  <Text style={s.section} minPresenceAhead={70}>
    {children}
  </Text>
)
export const Sub = ({ children }: { children: ReactNode }) => (
  <Text style={s.sub} minPresenceAhead={40}>
    {children}
  </Text>
)
export const P = ({ children, small }: { children: ReactNode; small?: boolean }) => <Text style={small ? [s.p, s.small] : s.p}>{children}</Text>

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={s.row} wrap={false}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{children}</Text>
    </View>
  )
}

export function Bullet({ children }: { children: ReactNode }) {
  return (
    <View style={s.bullet}>
      <Text style={{ width: 12 }}>–</Text>
      <Text style={{ flex: 1, textAlign: 'justify', fontSize: 9.5, lineHeight: 1.45 }}>{children}</Text>
    </View>
  )
}

/** Case cochée ou non (annexes, options). */
export function Check({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <View style={s.bullet} wrap={false}>
      <View style={{ width: 9, height: 9, borderWidth: 0.8, borderColor: INK, marginRight: 7, marginTop: 2.5, alignItems: 'center', justifyContent: 'center' }}>
        {on ? <View style={{ width: 5, height: 5, backgroundColor: INK }} /> : null}
      </View>
      <Text style={{ flex: 1, fontSize: 9.5, lineHeight: 1.45 }}>{children}</Text>
    </View>
  )
}

export function Table({ columns, rows, widths }: { columns: string[]; rows: (string | number | null | undefined)[][]; widths: number[] }) {
  return (
    <View style={s.table}>
      <View style={s.th} fixed={false}>
        {columns.map((c, i) => (
          <Text key={c} style={[s.cell, { width: `${widths[i]}%`, fontWeight: 700, borderRightWidth: i === columns.length - 1 ? 0 : 0.8 }]}>
            {c}
          </Text>
        ))}
      </View>
      {rows.map((r, j) => (
        <View key={j} style={[s.tr, j === rows.length - 1 ? { borderBottomWidth: 0 } : {}]} wrap={false}>
          {r.map((v, i) => (
            <Text key={i} style={[s.cell, { width: `${widths[i]}%`, borderRightWidth: i === r.length - 1 ? 0 : 0.8 }]}>
              {v === null || v === undefined ? '' : String(v)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}

/** Pied de page fixe : référence du document, cases de paraphe (bail), pagination. */
export function Footer({ left, paraphs = 0 }: { left: string; paraphs?: number }) {
  return (
    <View style={s.footer} fixed>
      <Text style={{ width: '42%' }}>{left}</Text>
      {paraphs > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text>Paraphes</Text>
          {Array.from({ length: paraphs }, (_, i) => (
            <View key={i} style={s.paraphBox} />
          ))}
        </View>
      ) : (
        <View />
      )}
      <Text style={{ width: '20%', textAlign: 'right' }} render={({ pageNumber, totalPages }) => `Page ${pageNumber} sur ${totalPages}`} />
    </View>
  )
}

/** Cadres de signature ; la signature enregistrée du bailleur est apposée si elle est fournie. */
export function SignatureBoxes({ boxes }: { boxes: { label: string; name?: string; image?: string | null; hint?: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }} wrap={false}>
      {boxes.map((b) => (
        <View key={b.label + (b.name ?? '')} style={s.signBox}>
          <Text style={{ fontSize: 7.8, color: MUTED }}>{b.label}</Text>
          {b.name ? <Text style={{ fontSize: 8.5, fontWeight: 600, marginTop: 2 }}>{b.name}</Text> : null}
          {b.image ? <Image src={b.image} style={{ height: 44, objectFit: 'contain', marginTop: 4, alignSelf: 'flex-start' }} /> : null}
          {b.hint ? <Text style={{ fontSize: 7, color: MUTED, marginTop: 'auto' }}>{b.hint}</Text> : null}
        </View>
      ))}
    </View>
  )
}

/** Signature manuscrite stylisée (quittance) quand aucune signature dessinée n'est enregistrée. */
export const ScriptName = ({ children }: { children: ReactNode }) => (
  <Text style={{ fontFamily: 'Cormorant', fontStyle: 'italic', fontWeight: 700, fontSize: 18, color: SIGN }}>{children}</Text>
)
