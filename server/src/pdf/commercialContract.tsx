import type { ReactNode } from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { ContractInput, LandlordProfile, PartyName, TenantFile } from '../domain/contract.js'
import { contractEndDate, leaseDurationMonths } from '../domain/rules.js'
import { eurosInWords } from '../domain/words.js'
import { dateLong, durationText, euros, landlordName, originalsCount, personName, propertyAddress } from './labels.js'
import { CertificatePage } from './certificate.js'
import type { SignatureMark, SignedLease } from './contract.js'
import { BLANK, Footer, INK, MUTED, SignatureBoxes, s } from './theme.js'

/**
 * Bail commercial (Code de commerce, art. L145-1 et suivants). Pas la loi du 6 juillet 1989. Chaque règle reprise ici
 * vient d'une page de Service Public Entreprendre lue le 14 novembre 2026 (docs/legal/bail-commercial.md) :
 * durée de 9 ans au moins (F22854), résiliation triennale du locataire et congé du bailleur (F31707, F36537), dépôt et
 * restitution (F36538), révision triennale par l'ILC ou l'ILAT (F31925), charges et inventaire (F32336), mentions et
 * annexes (F23927). Modèle à faire relire par un avocat avant d'être proposé.
 */

const st = {
  p: { fontSize: 10, lineHeight: 1.5, textAlign: 'justify' as const, marginBottom: 5 },
  article: { fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.4 },
}
const P = ({ children }: { children: ReactNode }) => <Text style={st.p}>{children}</Text>
const B = ({ children }: { children: ReactNode }) => <Text style={{ fontWeight: 700 }}>{children}</Text>
function Article({ n, title }: { n: number; title: string }) {
  return (
    <View minPresenceAhead={80} style={{ marginTop: 14, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 0.8, borderBottomColor: INK }}>
      <Text style={st.article}>
        Article {n}. {title}
      </Text>
    </View>
  )
}

const upper = (v?: string | null) => (v ? v.toLocaleUpperCase('fr-FR') : '')
const formal = (p: PartyName & { usageName?: string | null }) => [p.civility === 'MADAME' ? 'Madame' : p.civility === 'MONSIEUR' ? 'Monsieur' : '', p.firstNames, upper(p.usageName || p.lastName)].filter(Boolean).join(' ') || BLANK

function landlordLine(l: LandlordProfile): string {
  if ((l.kind === 'SCI' || l.kind === 'COMPANY') && l.company) {
    const c = l.company
    return `La société ${[c.form, c.name ? upper(c.name) : BLANK].filter(Boolean).join(' ')}${c.siren ? `, SIREN ${c.siren}` : ''}, dont le siège est situé ${c.seat || BLANK}, représentée par ${c.representedBy || BLANK}`
  }
  const others = (l.coOwners ?? []).map((o) => formal(o)).filter((x) => x !== BLANK)
  const address = l.address ? [l.address, [l.postalCode, l.city ? upper(l.city) : ''].filter(Boolean).join(' ')].filter(Boolean).join(', ') : BLANK
  return `${others.length ? `${formal(l)} et ${others.join(', ')}` : formal(l)}, demeurant ${address}${l.email ? ` (${l.email})` : ''}`
}
const tenantLine = (t: TenantFile & PartyName) => `${formal(t)}${t.currentAddress ? `, demeurant ${t.currentAddress}` : ''}${t.email ? ` (${t.email})` : ''}`

const signedHint = (m?: SignatureMark) =>
  m ? `${m.mention ? `« ${m.mention} » · ` : ''}Signé électroniquement le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(m.signedAt))}` : 'Mention manuscrite « Lu et approuvé », puis signature'

const METHOD: Record<string, string> = { TRANSFER: 'virement bancaire', CHEQUE: 'chèque', CASH: 'espèces, contre quittance', OTHER: 'moyen convenu entre les parties' }
const FREQUENCY = { MONTHLY: { months: 1, label: 'chaque mois', term: 'mensuel' }, QUARTERLY: { months: 3, label: 'par trimestre', term: 'trimestriel' }, YEARLY: { months: 12, label: 'chaque année', term: 'annuel' } } as const
const USE = { RETAIL: 'commerce ou artisanat', OFFICE: 'bureaux', STORAGE: 'entrepôt ou stockage', OTHER: 'activité professionnelle' } as const

export function CommercialContractDocument({ c, signed }: { c: ContractInput; signed?: SignedLease }) {
  const t = c.terms
  const p = c.property
  const l = c.landlord
  const months = leaseDurationMonths('COMMERCIAL', l, t)
  const end = t.startDate ? contractEndDate(t.startDate, months) : null
  const rent = t.rentCents ?? null
  const charges = t.chargesCents ?? 0
  const deposit = t.depositCents ?? null
  const freq = FREQUENCY[t.paymentFrequency ?? 'QUARTERLY']
  const vat = Boolean(t.commercial?.vat)
  const index = t.commercial?.index ?? 'ILC'
  const tenants = c.tenants.length ? c.tenants : [{} as TenantFile & PartyName]
  const plural = tenants.length > 1
  const where = [propertyAddress(p), [p.postalCode, p.city ? upper(p.city) : ''].filter(Boolean).join(' ')].filter(Boolean).join(', ') || BLANK
  const lastNames = c.tenants.map((x) => x.lastName).filter(Boolean).join(', ')
  const version = c.version ? ` · version ${c.version.number} du ${c.version.date}` : ''
  const paraphs = 1 + Math.max(1, c.tenants.length)
  const activity = p.commercial?.activity?.trim()
  let n = 0
  const next = () => ++n

  return (
    <Document title="Bail commercial" author={landlordName(l)} creator="Bailio" language="fr-FR">
      <Page size="A4" style={s.page}>
        <View style={{ borderBottomWidth: 1.5, borderColor: INK, paddingBottom: 10, marginBottom: 10 }}>
          <Text style={{ fontSize: 8, color: MUTED, letterSpacing: 1, textTransform: 'uppercase' }}>Code de commerce, articles L145-1 et suivants</Text>
          <Text style={{ fontSize: 16, fontWeight: 700, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>Bail commercial</Text>
          <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 6, lineHeight: 1.45 }}>
            Location d’un local où le Preneur exploite son activité. Ce bail relève du statut des baux commerciaux, pas de la loi n° 89-462 du 6 juillet 1989.
          </Text>
        </View>

        <Article n={next()} title="Les parties" />
        <P>
          <B>Le Bailleur : </B>
          {landlordLine(l)}.
        </P>
        {tenants.map((tn, i) => (
          <P key={i}>
            <B>{plural ? `Preneur ${i + 1} : ` : 'Le Preneur : '}</B>
            {tenantLine(tn)}.
          </P>
        ))}
        {plural ? <P>Les Preneurs sont tenus solidairement de toutes les obligations du présent bail.</P> : null}

        <Article n={next()} title="Désignation des locaux" />
        <P>
          Le Bailleur donne à bail au Preneur, qui l’accepte, un local à usage de <B>{USE[p.commercial?.use ?? 'RETAIL']}</B> situé {where}
          {p.lotNumber ? ` (lot de copropriété n° ${p.lotNumber})` : ''}
          {p.surface ? `, d’une surface d’environ ${p.surface} m²` : ''}
          {p.commercial?.equipped ? ', équipé du mobilier et du matériel nécessaires à l’activité' : ''}.
        </P>
        <P>Moyens d’accès remis au Preneur : {p.keys || BLANK}.</P>

        <Article n={next()} title="Destination" />
        <P>
          Les locaux sont destinés exclusivement à l’activité suivante : <B>{activity || BLANK}</B>. Le Preneur ne peut y exercer une autre activité sans l’accord écrit du Bailleur.
        </P>

        <Article n={next()} title="Durée" />
        <P>
          Le bail prend effet le <B>{t.startDate ? dateLong(t.startDate) : BLANK}</B> pour une durée de <B>{durationText(months)}</B>
          {end ? `, soit jusqu’au ${dateLong(end.toISOString().slice(0, 10))}` : ''}.
        </P>
        {t.commercial?.noTriennial ? (
          <P>Les parties conviennent d’écarter la faculté pour le Preneur de donner congé à l’expiration de chaque période de trois ans, comme la loi le permet pour ces locaux ou cette durée.</P>
        ) : (
          <P>
            Le Preneur peut donner congé à l’expiration de chaque période de trois ans, au moins six mois à l’avance, par lettre recommandée avec avis de réception ou par acte de commissaire de justice, sans avoir
            à en donner le motif.
          </P>
        )}
        <P>
          Le Bailleur qui ne souhaite pas renouveler le bail donne congé au moins six mois avant son échéance, par acte de commissaire de justice. Sans congé ni demande de renouvellement, le bail se poursuit
          aux mêmes conditions pour une durée indéterminée.
        </P>

        <Article n={next()} title="Loyer" />
        <P>
          Loyer annuel : <B>{rent !== null ? `${euros(rent * 12)} (${eurosInWords(rent * 12)})${vat ? ' hors taxes' : ''}` : BLANK}</B>, payable {freq.label}, {t.paymentTerm === 'ARREARS' ? 'à terme échu' : 'd’avance'},
          soit <B>{rent !== null ? `${euros(rent * freq.months)}${vat ? ' hors taxes' : ''}` : BLANK}</B> par échéance{charges ? `, auxquels s’ajoutent ${euros(charges * freq.months)} de provision pour charges` : ''}.
        </P>
        <P>
          Échéance : le <B>{(t.paymentDay ?? 1) === 1 ? '1er' : t.paymentDay}</B> {freq.months === 1 ? 'de chaque mois' : freq.months === 3 ? 'du premier mois de chaque trimestre du bail' : 'du premier mois de chaque année du bail'}, par{' '}
          {METHOD[t.paymentMethod ?? 'TRANSFER']}
          {t.paymentMethod === 'TRANSFER' || !t.paymentMethod ? (l.payment?.iban ? ` sur le compte ${l.payment.iban}` : '') : ''}.
        </P>
        <P>{vat ? 'Le loyer et les charges sont soumis à la taxe sur la valeur ajoutée au taux de 20 %, que le Preneur paie en plus.' : 'Le loyer est stipulé hors taxe sur la valeur ajoutée, le Bailleur n’ayant pas opté pour la TVA.'}</P>

        <Article n={next()} title="Révision du loyer" />
        <P>
          Le loyer peut être révisé à la demande de l’une des parties tous les trois ans, selon la variation de l’indice {index === 'ILC' ? 'des loyers commerciaux (ILC)' : 'des loyers des activités tertiaires (ILAT)'} publié
          par l’INSEE, dans les conditions de l’article L145-38 du Code de commerce. Indice de référence : celui du dernier trimestre publié à la date de prise d’effet du bail.
        </P>

        <Article n={next()} title="Charges, impôts et taxes" />
        {t.commercial?.chargesInventory?.trim() ? (
          <>
            <P>Seules les charges, impôts, taxes et redevances figurant à l’inventaire précis et limitatif annexé au bail sont refacturés au Preneur :</P>
            <P>{t.commercial.chargesInventory.trim()}</P>
          </>
        ) : (
          <P>Aucune charge, aucun impôt ni aucune taxe n’est refacturé au Preneur : le bail ne comporte pas d’inventaire des charges.</P>
        )}
        <P>
          Restent toujours à la charge du Bailleur : les grosses réparations, les travaux liés à la vétusté ou à la mise en conformité lorsqu’ils relèvent des grosses réparations, ses honoraires de gestion
          locative et, dans un ensemble immobilier, les charges des locaux vacants ou imputables à d’autres locataires. Le Bailleur adresse chaque année au Preneur, au plus tard le 30 septembre, l’état
          récapitulatif des charges de l’année précédente.
        </P>

        <Article n={next()} title="Travaux" />
        <P>
          {t.commercial?.works?.trim()
            ? `Travaux réalisés au cours des trois dernières années et travaux prévus pour les trois années à venir, avec leur budget : ${t.commercial.works.trim()}`
            : `Travaux réalisés au cours des trois dernières années et travaux prévus pour les trois années à venir, avec leur budget : ${BLANK}`}
        </P>

        <Article n={next()} title="Dépôt de garantie" />
        <P>
          {deposit ? (
            <>
              Le Preneur verse un dépôt de garantie de <B>{euros(deposit)}</B> ({eurosInWords(deposit)}), sans TVA. Il ne porte pas intérêt et sera restitué au plus tard trois mois après la remise des clés,
              déduction faite des sommes restant dues.
            </>
          ) : (
            'Aucun dépôt de garantie n’est demandé.'
          )}
        </P>

        <Article n={next()} title="Obligations des parties" />
        <P>
          Le Preneur paie le loyer et les charges aux échéances convenues, exploite les locaux conformément à leur destination, les entretient, ne les transforme pas sans l’accord écrit du Bailleur, ne sous-loue
          pas sans son accord, et s’assure pour les risques liés à son activité et à l’occupation des locaux ; il en justifie chaque année.
        </P>
        <P>Le Bailleur délivre les locaux en bon état d’usage, en assure la jouissance paisible et réalise les grosses réparations.</P>

        <Article n={next()} title="Clause résolutoire" />
        <P>
          À défaut de paiement d’un seul terme de loyer ou de charges, ou de justification de l’assurance, le bail sera résilié de plein droit un mois après un commandement délivré par commissaire de justice
          et resté sans effet.
        </P>

        {c.guarantors.length ? (
          <>
            <Article n={next()} title="Caution" />
            <P>
              {c.guarantors.map((g) => personName({ civility: g.civility, firstNames: g.firstNames, lastName: g.lastName })).join(' et ')} se porte{c.guarantors.length > 1 ? 'nt' : ''} caution des engagements du
              Preneur, par acte séparé.
            </P>
          </>
        ) : null}

        {t.clauses?.custom?.length ? (
          <>
            <Article n={next()} title="Conditions particulières" />
            {t.clauses.custom.map((x, i) => (
              <P key={i}>{x}</P>
            ))}
          </>
        ) : null}

        <Article n={next()} title="Annexes" />
        <P>
          Sont annexés au bail : l’état des lieux établi à l’entrée ; l’inventaire des charges, impôts, taxes et redevances ; l’état des travaux des trois dernières et des trois prochaines années ; le
          diagnostic de performance énergétique ; l’état des risques de moins de six mois si le local est situé dans une zone concernée
          {p.surface && p.surface >= 2000 ? ' ; l’annexe environnementale, le local dépassant 2 000 m²' : ''}.
        </P>

        <View wrap={false} style={{ marginTop: 14 }}>
          {t.signature?.mode === 'ELECTRONIC' ? (
            <P>
              Le <B>{t.signature?.date ? dateLong(t.signature.date) : BLANK}</B>, à <B>{t.signature?.place || (p.city ? upper(p.city) : BLANK)}</B>, par voie électronique. Chacune des parties reçoit un
              exemplaire numérique signé, qui vaut original (articles 1366, 1367 et 1375 du Code civil).{signed?.certificate ? ' Le certificat de signature est joint en dernière page.' : ''}
            </P>
          ) : (
            <P>
              Le <B>{t.signature?.date ? dateLong(t.signature.date) : BLANK}</B>, à <B>{t.signature?.place || (p.city ? upper(p.city) : BLANK)}</B>, en {originalsCount(c)} exemplaires originaux dont un remis à chacune
              des parties{c.guarantors.length ? ' et un à la caution' : ''}.
            </P>
          )}
          <SignatureBoxes
            boxes={[
              { label: 'Signature du bailleur', name: l.kind === 'SCI' || l.kind === 'COMPANY' ? landlordName(l) : formal(l), image: signed?.landlord?.image, hint: signedHint(signed?.landlord) },
              ...tenants.map((tn, i) => ({ label: plural ? `Signature du preneur ${i + 1}` : 'Signature du preneur', name: formal(tn), image: signed?.tenants?.[i]?.image, hint: signedHint(signed?.tenants?.[i]) })),
            ]}
          />
        </View>

        <Footer left={`Bail commercial ${lastNames || ''}${version}${signed?.certificate ? ` · signé électroniquement, réf. ${signed.certificate.requestId.slice(0, 8)}` : ''}`} paraphs={signed?.certificate ? 0 : paraphs} />
      </Page>
      {signed?.certificate ? <CertificatePage data={signed.certificate} /> : null}
    </Document>
  )
}
