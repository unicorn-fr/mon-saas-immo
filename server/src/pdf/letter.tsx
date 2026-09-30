import { Document, Image, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { LandlordProfile } from '../domain/contract.js'
import { formatDateFr } from '../domain/lease.js'
import type { LetterContent } from '../domain/letters.js'
import { landlordAddress, landlordName } from './labels.js'
import { BLANK, MUTED, P, RULE, ScriptName, Table, s } from './theme.js'

/** Courrier au locataire : expéditeur, destinataire, lieu et date, objet, texte, signature. */
export interface LetterRender {
  content: LetterContent
  landlord: LandlordProfile
  recipient: { name: string; address: string }
  date?: Date
}

export function LetterDocument({ content, landlord, recipient, date = new Date() }: LetterRender) {
  const name = landlordName(landlord) || BLANK
  return (
    <Document title={content.subject} author={name} creator="Bailio" language="fr-FR">
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ maxWidth: '48%' }}>
            <Text style={{ fontWeight: 700 }}>{name}</Text>
            <Text style={{ fontSize: 9.5, lineHeight: 1.5 }}>{landlordAddress(landlord)}</Text>
            {landlord.email ? <Text style={{ fontSize: 9.5, lineHeight: 1.5 }}>{landlord.email}</Text> : null}
            {landlord.phone ? <Text style={{ fontSize: 9.5, lineHeight: 1.5 }}>{landlord.phone}</Text> : null}
          </View>
          <View style={{ maxWidth: '46%', marginTop: 70 }}>
            <Text style={{ fontWeight: 700 }}>{recipient.name}</Text>
            <Text style={{ fontSize: 9.5, lineHeight: 1.5 }}>{recipient.address}</Text>
          </View>
        </View>

        <Text style={{ marginTop: 34, textAlign: 'right', fontSize: 10 }}>
          {landlord.city ? `À ${landlord.city}, le ` : 'Le '}
          {formatDateFr(date)}
        </Text>
        {content.recommended ? <Text style={{ marginTop: 18, fontSize: 9.5, fontWeight: 700 }}>Lettre recommandée avec avis de réception</Text> : null}
        <Text style={{ marginTop: content.recommended ? 4 : 18, fontSize: 10.5 }}>
          <Text style={{ fontWeight: 700 }}>Objet : </Text>
          {content.subject}
        </Text>

        <Text style={{ marginTop: 22, fontSize: 10.5 }}>Madame, Monsieur,</Text>
        <View style={{ marginTop: 8 }}>
          {content.paragraphs.map((p, i) => (
            <Text key={i} style={{ fontSize: 10.5, lineHeight: 1.55, textAlign: 'justify', marginBottom: 8 }}>
              {p}
            </Text>
          ))}
        </View>
        {content.table ? <Table columns={content.table.columns} widths={content.table.widths} rows={content.table.rows} /> : null}
        <Text style={{ fontSize: 10.5, lineHeight: 1.55, marginTop: 10 }}>Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.</Text>

        <View style={{ alignItems: 'flex-end', marginTop: 26 }}>
          <Text style={{ fontSize: 10 }}>{name}</Text>
          {landlord.signature ? <Image src={landlord.signature} style={{ height: 46, marginTop: 6, objectFit: 'contain' }} /> : <View style={{ marginTop: 8 }}><ScriptName>{landlord.lastName ?? name}</ScriptName></View>}
        </View>

        {content.annexes?.length ? (
          <View style={{ marginTop: 26, borderTopWidth: 0.8, borderTopColor: RULE, paddingTop: 8 }}>
            <Text style={{ fontSize: 8.5, fontWeight: 700 }}>Pièce jointe</Text>
            {content.annexes.map((a) => (
              <P key={a} small>
                {a}
              </P>
            ))}
          </View>
        ) : null}
        <Text style={{ position: 'absolute', bottom: 30, left: 54, right: 54, fontSize: 7.5, color: MUTED }} fixed>
          Courrier préparé avec Bailio
        </Text>
      </Page>
    </Document>
  )
}

export function renderLetterPdf(input: LetterRender): Promise<Buffer> {
  return renderToBuffer(<LetterDocument {...input} />)
}
