import { Document, Image, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { LandlordProfile, PartyName } from '../domain/contract.js'
import type { DamageLine } from '../domain/damage.js'
import { dateLong, landlordName, personName } from './labels.js'
import { BLANK, Footer, MUTED, P, Row, Section, Table, Title, s } from './theme.js'

/**
 * Récapitulatif des dégradations : éléments plus abîmés qu'à l'entrée, décision et commentaire du bailleur, coût,
 * part d'usure et retenue, avec les photos d'entrée et de sortie. Il justifie les retenues du solde de tout compte.
 */
export interface DamageInput {
  landlord: LandlordProfile
  tenants: PartyName[]
  propertyAddress: string
  exitDate: string | null
  lines: DamageLine[]
  entryPhotos: Record<string, string[]>
  photos: Record<string, string>
  photoDates: Record<string, string>
}

const eur = (c: number) => `${(c / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

export function DamageDocument(i: DamageInput) {
  const tenants = i.tenants.map((t) => personName(t)).join(' et ') || BLANK
  const total = i.lines.reduce((a, l) => a + l.retainedCents, 0)
  const annex: { id: string; caption: string }[] = []
  const ref = (id: string, caption: string) => {
    if (!i.photos[id]) return null
    let n = annex.findIndex((p) => p.id === id)
    if (n < 0) {
      annex.push({ id, caption })
      n = annex.length - 1
    }
    return `Photo ${n + 1}`
  }
  const rows = i.lines.map((l) => {
    const before = (i.entryPhotos[l.key] ?? []).map((p) => ref(p, `${l.room}, ${l.label} : à l’entrée`)).filter(Boolean)
    const after = l.exitPhotoIds.map((p) => ref(p, `${l.room}, ${l.label} : à la sortie`)).filter(Boolean)
    return [
      `${l.room}, ${l.label}`,
      l.entryState ?? '',
      l.exitState ?? '',
      l.decision === 'WEAR' ? 'Usure normale' : l.decision === 'DAMAGE' ? 'Dégradation' : 'À décider',
      [l.comment, l.exitNote, l.justification ? `Justificatif : ${l.justification}` : null, [...before, ...after].length ? [...before, ...after].join(', ') : null].filter(Boolean).join(' · '),
      l.decision === 'DAMAGE' ? `${eur(l.costCents ?? 0)}${l.wearPct ? `, usure ${l.wearPct} %` : ''}` : '',
      l.decision === 'DAMAGE' ? eur(l.retainedCents) : '',
    ]
  })
  return (
    <Document title="Récapitulatif des dégradations" author={landlordName(i.landlord)} creator="Bailio" language="fr-FR">
      <Page size="A4" style={s.page}>
        <Title intro={i.exitDate ? `D’après l’état des lieux de sortie du ${dateLong(i.exitDate)}` : undefined}>Récapitulatif des dégradations</Title>
        <Row label="Logement">{i.propertyAddress || BLANK}</Row>
        <Row label="Bailleur">{landlordName(i.landlord) || BLANK}</Row>
        <Row label={i.tenants.length > 1 ? 'Locataires' : 'Locataire'}>{tenants}</Row>

        <Section>Éléments en moins bon état qu’à l’entrée</Section>
        {rows.length ? (
          <Table columns={['Élément', 'Entrée', 'Sortie', 'Constat', 'Commentaire du bailleur', 'Coût, usure', 'Retenue']} widths={[17, 9, 9, 12, 28, 13, 12]} rows={rows} />
        ) : (
          <P>Aucun élément n’est en moins bon état qu’à l’entrée.</P>
        )}
        <Row label="Total retenu pour dégradations">{eur(total)}</Row>
        <P small>
          Le locataire ne répond pas de l’usure normale ni de la vétusté (article 7 de la loi du 6 juillet 1989). Chaque retenue sur le dépôt de garantie est justifiée par la pièce indiquée (article 22). Elle est reprise dans le solde de tout compte.
        </P>

        {annex.length ? (
          <View break>
            <Section>Annexe : photos</Section>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {annex.map((p, n) => (
                <View key={p.id} style={{ width: '48%', marginBottom: 8 }} wrap={false}>
                  <Image src={i.photos[p.id]} style={{ width: '100%', height: 170, objectFit: 'cover' }} />
                  <Text style={{ fontSize: 7.8, color: MUTED, marginTop: 3 }}>{`Photo ${n + 1} · ${p.caption}${i.photoDates[p.id] ? ` · ajoutée le ${new Date(i.photoDates[p.id]).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}` : ''}`}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        <Footer left="Document établi avec Bailio" />
      </Page>
    </Document>
  )
}

export const renderDamagePdf = (input: DamageInput): Promise<Buffer> => renderToBuffer(<DamageDocument {...input} />)
