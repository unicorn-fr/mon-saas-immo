import { Document, Link, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { Contact, FilingGuide } from '../domain/taxFiling.js'
import { dateLong, euros } from './labels.js'
import { Bullet, Check, Footer, MUTED, P, Row, SIGN, Section, Sub, Table, Title, s } from './theme.js'

/**
 * Fiche « Préparer votre déclaration » : les montants calculés par Bailio pour l'année, puis, situation par situation,
 * les documents à réunir (cases à cocher), les étapes, les pièges, les liens officiels (cliquables) et les contacts.
 */
export interface TaxFilingInput {
  year: number
  owner: string
  empty: null | { grossRentCents: number; microAllowed: boolean; microTaxableCents: number; realResultCents: number; better: 'MICRO' | 'REAL' | null }
  furnished: null | { receiptsCents: number; microAllowed: boolean; microTaxableCents: number }
  lmnp: null | { taxableCents: number; better: 'MICRO' | 'REAL' }
  properties: Array<{ name: string; furnished: boolean; lines: Array<{ line: string; label: string; cents: number }>; resultCents: number }>
  structures: Array<{ name: string; properties: string[]; sheet: null | { title: string; steps: Array<{ title: string; form?: string; lines: Array<{ label: string; cents?: number; text?: string }> }>; shares: Array<{ name: string; pct: number; resultCents: number }> } }>
  guides: FilingGuide[]
  contacts: Contact[]
}

const eur = (c: number) => euros(c)
/** Adresse courte affichée (le lien complet reste cliquable) : une longue URL déborderait de la page. */
const host = (url: string) => new URL(url).hostname.replace(/^www\./, '')

const Url = ({ label, url }: { label: string; url: string }) => (
  <View style={s.bullet} wrap={false}>
    <Text style={{ width: 12 }}>–</Text>
    <Text style={{ flex: 1, fontSize: 9.5, lineHeight: 1.45 }}>
      <Link src={url} style={{ color: SIGN }}>
        {label}
      </Link>
      <Text style={{ color: MUTED, fontSize: 8.5 }}>{` (${host(url)})`}</Text>
    </Text>
  </View>
)

export function TaxFilingDocument(i: TaxFilingInput) {
  const empty = i.properties.filter((p) => !p.furnished)
  return (
    <Document title={`Préparer votre déclaration, revenus ${i.year}`} author={i.owner || 'Bailio'} creator="Bailio" language="fr-FR">
      <Page size="A4" style={s.page}>
        <Title subtitle={`Revenus ${i.year}`} intro={`Fiche préparée par Bailio le ${dateLong(new Date().toISOString().slice(0, 10))}${i.owner ? ` pour ${i.owner}` : ''}. C’est une aide à vérifier : Bailio ne dépose rien, vous restez responsable des montants déclarés.`}>
          Préparer votre déclaration
        </Title>

        <Section>Vos montants</Section>
        {!i.empty && !i.furnished && !i.structures.length ? <P>Aucun loyer encaissé en {i.year} n’est enregistré dans Bailio.</P> : null}
        {i.empty ? (
          <>
            <Sub>Location vide en votre nom (revenus fonciers)</Sub>
            {i.empty.microAllowed ? <Row label="Micro-foncier, case 4BE">{`${eur(i.empty.grossRentCents)} (imposé sur ${eur(i.empty.microTaxableCents)} après 30 %)`}</Row> : <Row label="Micro-foncier">Non disponible : plus de 15 000 € de loyers</Row>}
            <Row label={i.empty.realResultCents >= 0 ? 'Régime réel, revenu net (2044)' : 'Régime réel, déficit (2044)'}>{eur(Math.abs(i.empty.realResultCents))}</Row>
            {i.empty.better ? <Row label="Le plus avantageux d’après Bailio">{i.empty.better === 'MICRO' ? 'Micro-foncier' : 'Régime réel'}</Row> : null}
            {empty.map((p) => (
              <View key={p.name}>
                <Text style={[s.small, { marginTop: 6, marginBottom: 2, fontWeight: 600, color: '#1a1a2e' }]}>{p.name} : lignes de la 2044</Text>
                <Table columns={['Ligne', 'Libellé', 'Montant']} widths={[12, 63, 25]} rows={[...p.lines.map((l) => [l.line, l.label, eur(l.cents)]), ['', p.resultCents >= 0 ? 'Revenu net' : 'Déficit', eur(Math.abs(p.resultCents))]]} />
              </View>
            ))}
          </>
        ) : null}
        {i.furnished ? (
          <>
            <Sub>Location meublée en votre nom (LMNP)</Sub>
            {i.furnished.microAllowed ? <Row label="Micro-BIC, case 5NI (2042-C-PRO)">{`${eur(i.furnished.receiptsCents)} (imposé sur ${eur(i.furnished.microTaxableCents)} après 50 %)`}</Row> : <Row label="Micro-BIC">Non disponible : plus de 77 700 € de recettes</Row>}
            {i.lmnp ? <Row label="Régime réel, résultat estimé">{eur(i.lmnp.taxableCents)}</Row> : null}
            {i.lmnp ? <Row label="Le plus avantageux d’après Bailio">{i.lmnp.better === 'MICRO' ? 'Micro-BIC' : 'Régime réel'}</Row> : null}
          </>
        ) : null}
        {i.structures.map((st) =>
          st.sheet ? (
            <View key={st.name}>
              <Sub>{`${st.name} : ${st.sheet.title}`}</Sub>
              {st.sheet.steps[0]?.lines.map((l) => (
                <Row key={l.label} label={l.label}>
                  {l.cents !== undefined ? eur(l.cents) : (l.text ?? '')}
                </Row>
              ))}
              {st.sheet.shares.map((a) => (
                <Row key={a.name} label={`Part de ${a.name} (${a.pct.toLocaleString('fr-FR')} %)`}>
                  {a.resultCents ? eur(a.resultCents) : '—'}
                </Row>
              ))}
            </View>
          ) : null,
        )}

        {i.guides.map((g) => (
          <View key={g.id + (g.structure ?? '')} break={false}>
            <Section>{g.alternative ? `${g.title} (si vous avez choisi ce régime)` : g.title}</Section>
            <P>{g.summary}</P>
            {g.deadline ? <Row label="Date limite">{g.deadline}</Row> : null}
            <Sub>Documents à réunir</Sub>
            {g.documents.map((d) => (
              <Check key={d.label} on={false}>
                {d.label}
                {d.detail ? <Text style={{ color: MUTED }}>{` : ${d.detail}`}</Text> : null}
              </Check>
            ))}
            <Sub>Étapes</Sub>
            {g.steps.map((st, k) => (
              <View key={st.title} style={s.bullet} wrap={false}>
                <Text style={{ width: 14, fontWeight: 700 }}>{k + 1}.</Text>
                <Text style={{ flex: 1, fontSize: 9.5, lineHeight: 1.45 }}>
                  <Text style={{ fontWeight: 600 }}>{st.title}</Text>
                  {st.detail ? ` : ${st.detail}` : ''}
                  {st.link ? (
                    <Link src={st.link.url} style={{ color: SIGN }}>
                      {` (${host(st.link.url)})`}
                    </Link>
                  ) : null}
                </Text>
              </View>
            ))}
            {g.watch.length ? <Sub>À savoir</Sub> : null}
            {g.watch.map((w) => (
              <Bullet key={w}>{w}</Bullet>
            ))}
            <Sub>Liens officiels</Sub>
            {g.links.map((l) => (
              <Url key={l.url} {...l} />
            ))}
          </View>
        ))}

        <Section>Qui contacter</Section>
        {i.contacts.map((c) => (
          <View key={c.label} style={{ marginBottom: 5 }} wrap={false}>
            <Row label={c.label}>{c.value}</Row>
            <Text style={[s.small, { marginLeft: '40%' }]}>{c.detail}</Text>
          </View>
        ))}
        <P small>Seuils, cases et dates relus sur impots.gouv.fr en octobre 2026 ; ils changent avec chaque loi de finances. En cas de doute, la notice officielle et votre centre des impôts font foi.</P>
        <Footer left={`Bailio · Préparer votre déclaration, revenus ${i.year}`} />
      </Page>
    </Document>
  )
}

export const renderTaxFilingPdf = (i: TaxFilingInput) => renderToBuffer(<TaxFilingDocument {...i} />)
