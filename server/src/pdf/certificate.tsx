import { Image, Page, Text, View } from '@react-pdf/renderer'
import { INK, MUTED, RULE, s } from './theme.js'

/**
 * Certificat de signature électronique, joint en dernière page du document signé :
 * qui a signé, quand, comment l'identité a été vérifiée, et l'empreinte du document présenté.
 * C'est le fichier de preuve prévu par l'article 1367 du Code civil (fiabilité du procédé).
 */

export interface CertificateSigner {
  role: string
  name: string
  email: string
  codeVerifiedAt: string | null
  signedAt: string | null
  ip: string | null
  userAgent: string | null
  mention: string | null
  /** Photo prise au moment de signer (JPEG en data URL), horodatée par le serveur, et son empreinte SHA-256. */
  photo?: string | null
  photoAt?: string | null
  photoHash?: string | null
}

export interface CertificateData {
  requestId: string
  documentTitle: string
  /** Empreinte SHA-256 du document présenté aux signataires, avant signature. */
  documentHash: string
  createdAt: string
  completedAt: string
  signers: CertificateSigner[]
}

const when = (isoDate: string | null) => {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  const paris = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'medium', timeZone: 'Europe/Paris' }).format(d)
  return `${paris} (heure de Paris) · ${d.toISOString()}`
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 2.5 }} wrap={false}>
      <Text style={{ width: '36%', fontSize: 8.5, color: MUTED, paddingRight: 6 }}>{label}</Text>
      <Text style={{ width: '64%', fontSize: 8.5, lineHeight: 1.4 }}>{value}</Text>
    </View>
  )
}

export function CertificatePage({ data }: { data: CertificateData }) {
  return (
    <Page size="A4" style={s.page}>
      <View style={{ borderTopWidth: 2, borderBottomWidth: 2, borderColor: INK, paddingVertical: 11, marginBottom: 12 }}>
        <Text style={s.title}>Certificat de signature électronique</Text>
        <Text style={s.subtitle}>{data.documentTitle}</Text>
      </View>
      <Text style={{ fontSize: 8.5, lineHeight: 1.5, textAlign: 'justify', marginBottom: 10 }}>
        Le présent document a été signé électroniquement au moyen de la plateforme Bailio. Chaque signataire a reçu un lien personnel à son adresse électronique, puis un code à usage
        unique envoyé à cette même adresse, qu’il a saisi avant de signer, puis s’est pris en photo ; la photo est horodatée par le serveur et identifiée par son empreinte. Le document présenté est identifié par son empreinte numérique : toute modification, même d’un caractère,
        changerait cette empreinte. Ce procédé constitue une signature électronique au sens de l’article 1367 du Code civil et de l’article 25 du règlement (UE) n° 910/2014 dit
        « eIDAS ». L’écrit électronique a la même force probante que l’écrit sur support papier (article 1366 du Code civil).
      </Text>

      <Text style={s.section}>Document</Text>
      <Line label="Référence de la signature" value={data.requestId} />
      <Line label="Empreinte SHA-256 du document présenté" value={data.documentHash} />
      <Line label="Signature lancée le" value={when(data.createdAt)} />
      <Line label="Signature terminée le" value={when(data.completedAt)} />

      <Text style={s.section}>Signataires</Text>
      {data.signers.map((x, i) => (
        <View key={i} style={{ borderWidth: 0.8, borderColor: RULE, padding: 8, marginBottom: 8 }} wrap={false}>
          <Text style={{ fontSize: 9.5, fontWeight: 700, marginBottom: 4 }}>
            {x.role} : {x.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flexGrow: 1, flexBasis: 0 }}>
              <Line label="Adresse électronique" value={x.email} />
              <Line label="Code à usage unique vérifié le" value={when(x.codeVerifiedAt)} />
              {x.photoAt ? <Line label="Photo prise le" value={when(x.photoAt)} /> : null}
              <Line label="Signé le" value={when(x.signedAt)} />
              <Line label="Adresse IP" value={x.ip ?? '—'} />
              <Line label="Appareil" value={(x.userAgent ?? '—').slice(0, 160)} />
              {x.photoHash ? <Line label="Empreinte SHA-256 de la photo" value={x.photoHash} /> : null}
              {x.mention ? <Line label="Mention recopiée" value={`« ${x.mention} »`} /> : null}
            </View>
            {x.photo ? <Image src={x.photo} style={{ width: 78, height: 104, objectFit: 'cover', borderWidth: 0.8, borderColor: RULE }} /> : null}
          </View>
        </View>
      ))}
      <Text style={{ fontSize: 7.5, color: MUTED, lineHeight: 1.45, marginTop: 6 }}>
        Bailio conserve ce certificat et le document signé dans l’espace du bailleur. Chaque signataire en a reçu un exemplaire par email, qui vaut original (article 1375 du Code civil).
      </Text>
    </Page>
  )
}
