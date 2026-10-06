import { Document, Image, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { LandlordProfile, PartyName } from '../domain/contract.js'
import type { InventoryData } from '../domain/inventory.js'
import { CHANGE_LABEL, compareWithEntry, itemKey, meterComparison, worseItems } from '../domain/inventoryCompare.js'
import { dateLong, landlordAddress, landlordName, personName } from './labels.js'
import { BLANK, Footer, MUTED, P, Row, Section, SignatureBoxes, Table, Title, s } from './theme.js'

/** État des lieux d'entrée ou de sortie (décret n° 2016-382 du 30 mars 2016), photos en annexe. */
export interface InventoryInput {
  kind: 'ENTRY' | 'EXIT'
  data: InventoryData
  /** Sortie : état des lieux d'entrée, pour la comparaison pièce par pièce. */
  entry?: InventoryData | null
  landlord: LandlordProfile
  tenants: PartyName[]
  propertyAddress: string
  furnished: boolean
  /** Photos (data URL) indexées par identifiant de fichier. */
  photos: Record<string, string>
  /** Date d'ajout de chaque photo sur le serveur (ISO), imprimée sous la photo. */
  photoDates?: Record<string, string>
}

/** « 6 oct. 2026 à 14 h 32 », heure de Paris. */
const stamp = (isoDate: string) => {
  const d = new Date(isoDate)
  const day = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' })
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).replace(':', ' h ')
  return `${day} à ${time}`
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
  // Sortie : même présentation que l'entrée, avec l'état d'entrée et l'évolution (décret n° 2016-382, art. 3).
  const compare = exit && i.entry ? compareWithEntry(i.entry, d) : null
  const meters = exit && i.entry ? meterComparison(i.entry, d) : null
  const meterRows = (d.meters ?? []).map((m) => {
    const index = m.notApplicable ? 'Sans objet' : m.index || ''
    const photo = ref(m.photoId, `Compteur ${m.label}`)
    if (!meters) return [m.label, m.number || '', index, photo]
    const c = meters[m.key]
    return [m.label, c?.entryIndex ?? '', index, c?.consumption != null ? String(c.consumption).replace('.', ',') : '', photo]
  })
  const roomTables = (d.rooms ?? []).map((r) => ({
    name: r.name,
    note: r.note,
    overview: (r.photoIds ?? []).map((pid) => ref(pid, `${r.name} : vue d’ensemble`)).filter(Boolean).join(', '),
    rows: r.items.map((it) => {
      const photos = (it.photoIds ?? []).map((pid) => ref(pid, `${r.name} : ${it.label}`)).filter(Boolean).join(', ')
      if (!compare) return [it.label, it.state ?? 'Non vérifié', it.note ?? '', photos]
      const c = compare[itemKey(r.name, it.label)]
      return [it.label, c?.entryState ?? '', it.state ?? 'Non vérifié', c ? CHANGE_LABEL[c.change] : '', it.note ?? '', photos]
    }),
  }))
  const worse = exit && i.entry ? worseItems(i.entry, d) : []

  const accepted = (d.complements ?? [])
    .filter((c) => c.status === 'ACCEPTED')
    .map((c) => ({ ...c, refs: c.photoIds.map((pid) => ref(pid, `Complément du ${dateLong(c.at.slice(0, 10))}`)).filter(Boolean).join(', ') }))

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
        {meterRows.length ? (
          meters ? (
            <Table columns={['Compteur', 'Index d’entrée', 'Index de sortie', 'Consommation', 'Photo']} widths={[24, 20, 20, 18, 18]} rows={meterRows} />
          ) : (
            <Table columns={['Compteur', 'Numéro', 'Index', 'Photo']} widths={[30, 25, 25, 20]} rows={meterRows} />
          )
        ) : (
          <P>Aucun compteur relevé.</P>
        )}

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
            {compare ? (
              <Table columns={['Élément', 'Entrée', 'Sortie', 'Évolution', 'Observations', 'Photos']} widths={[21, 11, 11, 12, 30, 15]} rows={r.rows} />
            ) : (
              <Table columns={['Élément', 'État', 'Observations', 'Photos']} widths={[26, 12, 44, 18]} rows={r.rows} />
            )}
            {r.overview ? <P small>{`Vue d’ensemble de la pièce : ${r.overview}.`}</P> : null}
            {r.note ? <P small>{r.note}</P> : null}
          </View>
        ))}

        {i.furnished && d.furniture?.length ? (
          <>
            <Section>Inventaire du mobilier</Section>
            <Table columns={['Élément', 'Nombre', 'État', 'Observations']} widths={[40, 12, 16, 32]} rows={d.furniture.map((f) => [f.item, f.count, f.state ?? '', f.note ?? ''])} />
          </>
        ) : null}

        {exit ? (
          <>
            <Section>Évolutions depuis l’entrée</Section>
            {!i.entry ? (
              <P>Aucun état des lieux d’entrée n’est enregistré dans Bailio : la comparaison se fait avec l’exemplaire papier.</P>
            ) : worse.length ? (
              <>
                <P>{`${worse.length} élément${worse.length > 1 ? 's sont' : ' est'} en moins bon état qu’à l’entrée :`}</P>
                {worse.map((w, n) => (
                  <P key={n} small>{`${w.room}, ${w.label} : ${w.entryState ?? BLANK} à l’entrée, ${w.exitState ?? BLANK} à la sortie${w.note ? `. ${w.note}` : ''}`}</P>
                ))}
                <P small>Un état moins bon n’est pas forcément une dégradation à la charge du locataire : l’usure normale et la vétusté restent à la charge du bailleur.</P>
              </>
            ) : (
              <P>Aucun élément n’est en moins bon état qu’à l’entrée.</P>
            )}
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
        <P small>L’usure normale et la vétusté ne sont pas à la charge du locataire. Si les parties ont convenu d’une grille de vétusté, elle est jointe au bail.</P>

        {accepted.length ? (
          <>
            <Section>Compléments demandés par le locataire</Section>
            <P small>Ajoutés à la demande du locataire (article 3-2 de la loi du 6 juillet 1989) et acceptés par le bailleur. Ils font partie de l’état des lieux d’entrée.</P>
            {accepted.map((c) => (
              <View key={c.id} wrap={false} style={{ marginBottom: 6 }}>
                <Row label={`${c.heating ? 'Chauffage, demande' : 'Demande'} du ${dateLong(c.at.slice(0, 10))}`}>{`Acceptée le ${c.decidedAt ? dateLong(c.decidedAt.slice(0, 10)) : BLANK}${c.refs ? ` · ${c.refs}` : ''}`}</Row>
                <P>{c.text}</P>
              </View>
            ))}
          </>
        ) : null}

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
                  <Text style={{ fontSize: 7.8, color: MUTED, marginTop: 3 }}>{`Photo ${n + 1} · ${p.caption}${i.photoDates?.[p.id] ? ` · ajoutée le ${stamp(i.photoDates[p.id])}` : ''}`}</Text>
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
