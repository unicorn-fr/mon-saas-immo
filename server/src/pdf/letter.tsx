import { Document, Image, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { LandlordProfile } from '../domain/contract.js'
import { formatDateFr } from '../domain/lease.js'
import type { LetterContent } from '../domain/letters.js'
import { landlordAddress, landlordName } from './labels.js'
import { CONGE_NOTICE, NoticePages } from './notice.js'
import { BLANK, MUTED, P, RULE, ScriptName, SignatureBoxes, Table, s } from './theme.js'

/** Courrier au locataire : expéditeur, destinataire, lieu et date, objet, texte, signature. */
export interface LetterRender {
  content: LetterContent
  landlord: LandlordProfile
  recipient: { name: string; address: string }
  date?: Date
}

export function LetterDocument({ content, landlord, recipient, date = new Date() }: LetterRender) {
  const name = landlordName(landlord) || BLANK
  const place = landlord.city ? `À ${landlord.city}, le ` : 'Le '
  const signature = (
    <View style={{ alignItems: 'flex-end', marginTop: 26 }} wrap={false}>
      <Text style={{ fontSize: 10 }}>{name}</Text>
      {landlord.signature ? <Image src={landlord.signature} style={{ height: 46, marginTop: 6, objectFit: 'contain' }} /> : <View style={{ marginTop: 8 }}><ScriptName>{landlord.lastName ?? name}</ScriptName></View>}
    </View>
  )
  const body = content.paragraphs.map((p, i) => (
    <Text key={i} style={{ fontSize: 10.5, lineHeight: 1.55, textAlign: 'justify', marginBottom: 8 }}>
      {p}
    </Text>
  ))
  const footer = (
    <Text style={{ position: 'absolute', bottom: 30, left: 54, right: 54, fontSize: 7.5, color: MUTED }} fixed>
      Document préparé avec Bailio
    </Text>
  )

  // Attestation signée par le bailleur, ou formulaire à faire signer par le locataire.
  if (content.form) {
    const tenantForm = content.form === 'TENANT_FORM'
    return (
      <Document title={content.subject} author={name} creator="Bailio" language="fr-FR">
        <Page size="A4" style={s.page}>
          {tenantForm ? null : (
            <View style={{ maxWidth: '55%' }}>
              <Text style={{ fontWeight: 700 }}>{name}</Text>
              <Text style={{ fontSize: 9.5, lineHeight: 1.5 }}>{landlordAddress(landlord)}</Text>
            </View>
          )}
          <Text style={[s.title, { marginTop: tenantForm ? 20 : 48, marginBottom: 28 }]}>{content.subject}</Text>
          <View>{body}</View>
          {content.table ? <Table columns={content.table.columns} widths={content.table.widths} rows={content.table.rows} /> : null}
          {tenantForm ? (
            <>
              <Text style={{ marginTop: 22, fontSize: 10.5 }}>Fait à {BLANK}, le {BLANK}</Text>
              <SignatureBoxes boxes={[{ label: 'Le locataire, signature précédée de la mention « Bon pour accord »', name: recipient.name }]} />
            </>
          ) : (
            <>
              <Text style={{ marginTop: 22, textAlign: 'right', fontSize: 10.5 }}>
                {landlord.city ? `Fait à ${landlord.city}, le ` : 'Fait le '}
                {formatDateFr(date)}
              </Text>
              {signature}
            </>
          )}
          {footer}
        </Page>
      </Document>
    )
  }

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
          {place}
          {formatDateFr(date)}
        </Text>
        {content.recommended ? <Text style={{ marginTop: 18, fontSize: 9.5, fontWeight: 700 }}>Lettre recommandée avec avis de réception</Text> : null}
        <Text style={{ marginTop: content.recommended ? 4 : 18, fontSize: 10.5 }}>
          <Text style={{ fontWeight: 700 }}>Objet : </Text>
          {content.subject}
        </Text>

        <Text style={{ marginTop: 22, fontSize: 10.5 }}>Madame, Monsieur,</Text>
        <View style={{ marginTop: 8 }}>{body}</View>
        {content.table ? <Table columns={content.table.columns} widths={content.table.widths} rows={content.table.rows} /> : null}
        {content.quote ? (
          <View style={[s.box, { marginTop: 4 }]}>
            <Text style={{ fontSize: 9, fontWeight: 700, marginBottom: 4 }}>{content.quote.title}</Text>
            {content.quote.paragraphs.map((q, i) => (
              <Text key={i} style={{ fontSize: 9, lineHeight: 1.45, textAlign: 'justify', marginBottom: 4 }}>
                « {q} »
              </Text>
            ))}
          </View>
        ) : null}
        <Text style={{ fontSize: 10.5, lineHeight: 1.55, marginTop: 10 }}>Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.</Text>
        {signature}

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
        {footer}
      </Page>
      {content.appendNotice === 'CONGE' ? <NoticePages notice={CONGE_NOTICE} footer="Annexe au congé · notice d’information (arrêté du 13 décembre 2017)" /> : null}
    </Document>
  )
}

export function renderLetterPdf(input: LetterRender): Promise<Buffer> {
  return renderToBuffer(<LetterDocument {...input} />)
}
