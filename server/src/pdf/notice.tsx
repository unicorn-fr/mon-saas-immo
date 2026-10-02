import { Document, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { CONGE_NOTICE_BLOCKS, CONGE_NOTICE_FOOTNOTES, CONGE_NOTICE_REFERENCE, CONGE_NOTICE_TITLE, CONGE_NOTICE_URL } from './notice-conge-text.js'
import { NOTICE_BLOCKS, NOTICE_DPE_TABLE, NOTICE_FOOTNOTES, NOTICE_REFERENCE, NOTICE_TITLE, NOTICE_URL, type NoticeBlock } from './notice-text.js'
import { CHARGES_BLOCKS, REPAIRS_BLOCKS } from './annexes-text.js'
import { Footer, INK, MUTED, Table, s } from './theme.js'

/**
 * Notices d'information officielles, reproduites à l'identique ; Bailio n'en change que la mise en page :
 * - notice jointe au bail (loi du 6 juillet 1989, art. 3 ; arrêté du 29 mai 2015 modifié), dans les mêmes pages que le bail ;
 * - notice jointe au congé pour vendre ou pour reprise d'un logement vide (art. 15 ; arrêté du 13 décembre 2017).
 */

interface OfficialNotice {
  heading: string
  title: string
  reference: string
  url: string
  blocks: NoticeBlock[]
  footnotes: [string, string][]
}

export const LEASE_NOTICE: OfficialNotice = { heading: 'Notice d’information', title: NOTICE_TITLE, reference: NOTICE_REFERENCE, url: NOTICE_URL, blocks: NOTICE_BLOCKS, footnotes: NOTICE_FOOTNOTES }
export const REPAIRS_LIST: OfficialNotice = {
  heading: 'Réparations locatives',
  title: 'Liste des réparations ayant le caractère de réparations locatives',
  reference: 'Annexe du décret n° 87-712 du 26 août 1987',
  url: 'https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006066148',
  blocks: REPAIRS_BLOCKS,
  footnotes: [],
}
export const CHARGES_LIST: OfficialNotice = {
  heading: 'Charges récupérables',
  title: 'Liste des charges récupérables',
  reference: 'Annexe du décret n° 87-713 du 26 août 1987',
  url: 'https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006066149',
  blocks: CHARGES_BLOCKS,
  footnotes: [['*', 'Note de Bailio : le droit de bail, cité par le texte, a été supprimé depuis.']],
}
export const CONGE_NOTICE: OfficialNotice = { heading: 'Notice d’information', title: CONGE_NOTICE_TITLE, reference: CONGE_NOTICE_REFERENCE, url: CONGE_NOTICE_URL, blocks: CONGE_NOTICE_BLOCKS, footnotes: CONGE_NOTICE_FOOTNOTES }

const st = {
  h1: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 12, paddingBottom: 4, borderBottomWidth: 0.8, borderBottomColor: INK, marginBottom: 5 },
  h2: { fontSize: 9.2, fontWeight: 700, marginTop: 8, marginBottom: 3 },
  h3: { fontSize: 8.8, fontWeight: 600, marginTop: 6, marginBottom: 2 },
  p: { fontSize: 8.6, lineHeight: 1.42, textAlign: 'justify', marginTop: 2, marginBottom: 2 },
  sub: { fontSize: 8.6, fontWeight: 600, lineHeight: 1.42, marginTop: 4, marginBottom: 1 },
} as const

function Blocks({ notice }: { notice: OfficialNotice }) {
  const sep = notice === CONGE_NOTICE ? ' - ' : '. '
  return (
    <>
      {notice.blocks.map((b, i) => {
        if (b.t === 'h') {
          const style = b.lvl === 1 ? st.h1 : b.lvl === 2 ? st.h2 : st.h3
          return (
            <Text key={i} style={style} minPresenceAhead={40}>
              {b.n ? `${b.n}${sep}${b.x}` : b.x}
            </Text>
          )
        }
        if (b.t === 'table') return <Table key={i} columns={NOTICE_DPE_TABLE.columns} widths={[16, 22, 36, 26]} rows={NOTICE_DPE_TABLE.rows} />
        if (b.t === 'sub')
          return (
            <Text key={i} style={st.sub} minPresenceAhead={24}>
              {b.x}
            </Text>
          )
        if (b.t === 'li')
          return (
            <View key={i} style={{ flexDirection: 'row', marginTop: 1 }}>
              <Text style={[st.p, { width: 10 }]}>–</Text>
              <Text style={[st.p, { flex: 1 }]}>{b.x}</Text>
            </View>
          )
        return (
          <Text key={i} style={st.p}>
            {b.x}
          </Text>
        )
      })}
      {notice.footnotes.length ? <Text style={[st.h2, { marginTop: 12 }]}>Notes</Text> : null}
      {notice.footnotes.map(([n, x]) => (
        <Text key={n} style={[st.p, { fontSize: 7.6, color: MUTED }]}>
          ({n}) {x}
        </Text>
      ))}
    </>
  )
}

/** Pages d'une notice, à placer dans un document (bail, congé) ou seules. */
export function NoticePages({ notice = LEASE_NOTICE, footer, paraphs = 0 }: { notice?: OfficialNotice; footer?: string; paraphs?: number }) {
  return (
    <Page size="A4" style={s.page}>
      <Text style={[s.title, { fontSize: 13 }]}>{notice.heading}</Text>
      <Text style={[s.subtitle, { fontSize: 9.5, lineHeight: 1.4 }]}>{notice.title === notice.heading ? '' : notice.title.replace(/^Notice d’information /, '').replace(/^./, (c) => c.toUpperCase())}</Text>
      <Text style={s.intro}>
        {notice.reference}. Texte officiel reproduit à l’identique ({notice.url}).
      </Text>
      <Blocks notice={notice} />
      <Footer left={footer ?? `${notice.heading} · ${notice.reference.split(',')[0]}`} paraphs={paraphs} />
    </Page>
  )
}

export function renderNoticePdf(notice: OfficialNotice = LEASE_NOTICE): Promise<Buffer> {
  return renderToBuffer(
    <Document title={notice.heading} author="Bailio" language="fr-FR">
      <NoticePages notice={notice} />
    </Document>,
  )
}
