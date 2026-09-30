import { Document, Image, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { LandlordProfile, PartyName } from '../domain/contract.js'
import type { InventoryData } from '../domain/inventory.js'
import { dateLong, landlordAddress, landlordName, personName } from './labels.js'
import { BLANK, Footer, MUTED, P, Row, Section, SignatureBoxes, Table, Title, s } from './theme.js'

/** État des lieux d'entrée ou de sortie (décret n° 2016-382 du 30 mars 2016), photos en annexe. */
export interface InventoryInput {
  kind: 'ENTRY' | 'EXIT'
  data: InventoryData
  landlord: LandlordProfile
  tenants: PartyName[]
  propertyAddress: string
  furnished: boolean
  /** Photos (data URL) indexées par identifiant de fichier. */
  photos: Record<string, string>
}

export function InventoryDocument(i: InventoryInput) {
  const d = i.data
  const exit = i.kind === 'EXIT'
  const tenants = i.tenants.map((t) => personName(t)).join(' et ') || BLANK
  // Numérotation des photos dans l'ordre d'apparition, pour les renvois « Annexe n ».
  const photoOrder: { id: string; caption: string }[] = []
  const ref = (id: string | null | undefined, caption: string) => {
    if (!id || !i.photos[id]) return ''
    let n = photoOrder.findIndex((p) => p.id === id)
    if (n < 0) {
      photoOrder.push({ id, caption })
      n = photoOrder.length - 1
    }
    return `Photo ${n + 1}`
  }
  const when = [d.date ? dateLong(d.date) : BLANK, d.time ? `à ${d.time.replace(':', ' h ')}` : ''].filter(Boolean).join(' ')
  const meterRows = (d.meters ?? []).map((m) => [m.label, m.number || '', m.notApplicable ? 'Sans objet' : m.index || '', ref(m.photoId, `Compteur ${m.label}`)])
  const roomTables = (d.rooms ?? []).map((r) => ({
    name: r.name,
    note: r.note,
    rows: r.items.map((it) => [it.label, it.state ?? '', it.note ?? '', (it.photoIds ?? []).map((pid) => ref(pid, `${r.name} : ${it.label}`)).filter(Boolean).join(', ')]),
  }))

  return (
    <Document title={`État des lieux ${exit ? 'de sortie' : 'd’entrée'}`} author={landlordName(i.landlord)} creator="Bailio" language="fr-FR">
      <Page size="A4" style={s.page}>
        <Title intro={`Établi contradictoirement le ${when}`}>{exit ? 'État des lieux de sortie' : 'État des lieux d’entrée'}</Title>

        <Section>Le logement et les parties</Section>
        <Row label="Adresse">{i.propertyAddress || BLANK}</Row>
        <Row label="Bailleur">{`${landlordName(i.landlord) || BLANK}, ${landlordAddress(i.landlord) || BLANK}`}</Row>
        <Row label={i.tenants.length > 1 ? 'Locataires' : 'Locataire'}>{tenants}</Row>
        {d.present ? <Row label="Personnes présentes">{d.present}</Row> : null}
        {d.agent ? <Row label="Mandataire">{d.agent}</Row> : null}
        {exit ? (
          <>
            <Row label="Date de l’état des lieux d’entrée">{d.entryDate ? dateLong(d.entryDate) : BLANK}</Row>
            <Row label="Nouvelle adresse du locataire">{d.newAddress || BLANK}</Row>
          </>
        ) : null}

        <Section>Relevés des compteurs</Section>
        {meterRows.length ? <Table columns={['Compteur', 'Numéro', 'Index', 'Photo']} widths={[30, 25, 25, 20]} rows={meterRows} /> : <P>Aucun compteur relevé.</P>}

        {d.heating ? (
          <>
            <Section>Chauffage et eau chaude</Section>
            <Row label="État de l’installation">{[d.heating.state, d.heating.note].filter(Boolean).join(', ') || BLANK}</Row>
            {d.heating.lastMaintenance ? <Row label="Dernier entretien">{dateLong(d.heating.lastMaintenance)}</Row> : null}
            {!exit ? <P small>Le locataire peut demander à compléter l’état des lieux pour le chauffage pendant le premier mois de la période de chauffe.</P> : null}
          </>
        ) : null}

        {roomTables.map((r) => (
          <View key={r.name}>
            <Section>{r.name}</Section>
            <Table columns={['Élément', 'État', 'Observations', 'Photos']} widths={[26, 12, 44, 18]} rows={r.rows} />
            {r.note ? <P small>{r.note}</P> : null}
          </View>
        ))}

        {i.furnished && d.furniture?.length ? (
          <>
            <Section>Inventaire du mobilier</Section>
            <Table columns={['Élément', 'Nombre', 'État', 'Observations']} widths={[40, 12, 16, 32]} rows={d.furniture.map((f) => [f.item, f.count, f.state ?? '', f.note ?? ''])} />
          </>
        ) : null}

        <Section>Clés remises</Section>
        <P>{(d.keys ?? []).map((k) => `${k.type}${k.destination ? ` (${k.destination})` : ''} : ${k.count}`).join(' · ') || BLANK}</P>

        {d.notes ? (
          <>
            <Section>Observations</Section>
            <P>{d.notes}</P>
          </>
        ) : null}
        {d.vetusteGrid ? <P small>Une grille de vétusté est annexée : elle fixe la durée de vie des revêtements et équipements pour le calcul des éventuelles retenues à la sortie.</P> : null}

        <View wrap={false}>
          <P small>
            {exit
              ? 'Chaque partie reçoit un exemplaire. Les différences avec l’état des lieux d’entrée, hors usure normale et vétusté, peuvent justifier des retenues sur le dépôt de garantie.'
              : 'Le locataire dispose de 10 jours pour demander à compléter l’état des lieux d’entrée (article 3-2 de la loi du 6 juillet 1989). Chaque partie reçoit un exemplaire.'}
          </P>
          <SignatureBoxes
            boxes={[
              { label: 'Le bailleur', name: landlordName(i.landlord), image: d.signatures?.landlord },
              { label: i.tenants.length > 1 ? 'Les locataires' : 'Le locataire', name: tenants, image: d.signatures?.tenant },
            ]}
          />
        </View>

        {photoOrder.length ? (
          <View break>
            <Section>Annexe : photos</Section>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {photoOrder.map((p, n) => (
                <View key={p.id} style={{ width: '48%', marginBottom: 8 }} wrap={false}>
                  <Image src={i.photos[p.id]} style={{ width: '100%', height: 170, objectFit: 'cover' }} />
                  <Text style={{ fontSize: 7.8, color: MUTED, marginTop: 3 }}>{`Photo ${n + 1} · ${p.caption}`}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Footer left={`Document établi avec Bailio${photoOrder.length ? ` · ${photoOrder.length} photo${photoOrder.length > 1 ? 's' : ''} en annexe` : ''}`} />
      </Page>
    </Document>
  )
}

export function renderInventoryPdf(input: InventoryInput): Promise<Buffer> {
  return renderToBuffer(<InventoryDocument {...input} />)
}
