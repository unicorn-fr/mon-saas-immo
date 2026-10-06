import type { ReactNode } from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { ContractInput, LandlordProfile, PartyName, TenantFile } from '../domain/contract.js'
import { contractEndDate, landlordNoticeMonthsFor, leaseDurationMonths } from '../domain/rules.js'
import { eurosInWords } from '../domain/words.js'
import { quarterLabel } from '../lib/irl.js'
import { dateLong, durationText, euros, landlordName, originalsCount, parkingLabel, personName, propertyAddress } from './labels.js'
import { CertificatePage } from './certificate.js'
import type { SignatureMark, SignedLease } from './contract.js'
import { BLANK, Footer, INK, MUTED, SignatureBoxes, s } from './theme.js'

/**
 * Contrat de location d'un garage, d'un box ou d'une place de stationnement loué seul, sans logement. Ce n'est pas un
 * bail d'habitation : la loi du 6 juillet 1989 ne s'applique pas, seulement le Code civil (louage de choses,
 * art. 1709 et suivants). Durée, dépôt, préavis et révision sont ceux convenus ici (service-public.fr, F14747).
 * Location soumise à la TVA par principe (CGI, art. 261 D 2°), sauf franchise en base (art. 293 B), mentionnée.
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

export function ParkingContractDocument({ c, signed }: { c: ContractInput; signed?: SignedLease }) {
  const t = c.terms
  const p = c.property
  const l = c.landlord
  const months = leaseDurationMonths('PARKING', l, t)
  const notice = landlordNoticeMonthsFor('PARKING', t) ?? 1
  const end = t.startDate ? contractEndDate(t.startDate, months) : null
  const rent = t.rentCents ?? null
  const charges = t.chargesCents ?? 0
  const deposit = t.depositCents ?? null
  const tenants = c.tenants.length ? c.tenants : [{} as TenantFile & PartyName]
  const plural = tenants.length > 1
  const theTenant = plural ? 'les Locataires' : 'le Locataire'
  const TheTenant = plural ? 'Les Locataires' : 'Le Locataire'
  const where = [propertyAddress(p), [p.postalCode, p.city ? upper(p.city) : ''].filter(Boolean).join(' ')].filter(Boolean).join(', ') || BLANK
  const lastNames = c.tenants.map((x) => x.lastName).filter(Boolean).join(', ')
  const version = c.version ? ` · version ${c.version.number} du ${c.version.date}` : ''
  const paraphs = 1 + Math.max(1, c.tenants.length)
  const revision = t.revision?.enabled !== false
  let n = 0
  const next = () => ++n

  return (
    <Document title={`Contrat de location, ${parkingLabel(p)}`} author={landlordName(l)} creator="Bailio" language="fr-FR">
      <Page size="A4" style={s.page}>
        <View style={{ borderBottomWidth: 1.5, borderColor: INK, paddingBottom: 10, marginBottom: 10 }}>
          <Text style={{ fontSize: 8, color: MUTED, letterSpacing: 1, textTransform: 'uppercase' }}>Code civil, articles 1709 et suivants</Text>
          <Text style={{ fontSize: 16, fontWeight: 700, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>Contrat de location d’un emplacement de stationnement</Text>
          <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 6, lineHeight: 1.45 }}>
            Location d’un garage, d’un box ou d’une place loué indépendamment de tout logement. Elle n’est pas soumise à la loi n° 89-462 du 6 juillet 1989 : les parties fixent librement ses conditions, dans le
            respect du Code civil.
          </Text>
        </View>

        <Article n={next()} title="Les parties" />
        <P>
          <B>Le Bailleur : </B>
          {landlordLine(l)}.
        </P>
        {tenants.map((tn, i) => (
          <P key={i}>
            <B>{plural ? `Locataire ${i + 1} : ` : 'Le Locataire : '}</B>
            {tenantLine(tn)}.
          </P>
        ))}
        {plural ? <P>Les Locataires sont tenus solidairement de toutes les obligations du présent contrat.</P> : null}

        <Article n={next()} title="L’emplacement loué" />
        <P>
          Le Bailleur donne en location à {theTenant}, qui l’accepte{plural ? 'nt' : ''} : <B>{parkingLabel(p)}</B>
          {p.parking?.covered === true ? ', couvert' : p.parking?.covered === false ? ', non couvert' : ''}, situé {where}
          {p.lotNumber ? ` (lot de copropriété n° ${p.lotNumber})` : ''}
          {p.surface ? `, d’une surface d’environ ${p.surface} m²` : ''}.
        </P>
        {p.parking?.access ? <P>Accès : {p.parking.access}.</P> : null}
        <P>Moyens d’accès remis au Locataire : {p.keys || BLANK}. Ils seront restitués à la fin de la location ; leur perte ou leur remplacement est à la charge du Locataire.</P>

        <Article n={next()} title="Usage" />
        <P>
          L’emplacement est loué exclusivement pour le stationnement d’un véhicule et, le cas échéant, le rangement d’effets personnels sans danger. Il ne peut servir ni d’habitation,
          ni d’atelier, ni à une activité commerciale. Il est interdit d’y entreposer des produits inflammables, explosifs ou dangereux, en dehors du carburant contenu dans le réservoir du véhicule.
        </P>

        <Article n={next()} title="Durée" />
        <P>
          Le contrat prend effet le <B>{t.startDate ? dateLong(t.startDate) : BLANK}</B> pour une durée de <B>{durationText(months)}</B>
          {end ? `, soit jusqu’au ${dateLong(end.toISOString().slice(0, 10))}` : ''}. À son terme, il est reconduit tacitement pour la même durée, sauf congé de l’une des parties.
        </P>
        <P>
          {TheTenant} peu{plural ? 'vent' : 't'} donner congé à tout moment, en respectant un préavis de <B>{notice} mois</B>. Le Bailleur peut donner congé pour la fin du contrat ou de chaque période de reconduction, en
          respectant le même préavis. Le congé est donné par lettre recommandée avec avis de réception, par acte de commissaire de justice ou par remise en main propre contre récépissé ; le préavis court à
          compter de sa réception.
        </P>

        <Article n={next()} title="Loyer et charges" />
        <P>
          Loyer mensuel : <B>{rent !== null ? `${euros(rent)} (${eurosInWords(rent)})` : BLANK}</B>
          {charges ? (
            <>
              , auquel s’ajoutent <B>{euros(charges)}</B> de charges{t.chargesMode === 'FORFAIT' ? ' forfaitaires, sans régularisation' : ' versées en provision, régularisées chaque année sur justificatifs'}
            </>
          ) : (
            ', charges comprises'
          )}
          .
        </P>
        <P>
          Il est payable {t.paymentTerm === 'ARREARS' ? 'à terme échu' : 'd’avance'}, le <B>{t.paymentDay ?? 5}</B> de chaque mois, par {METHOD[t.paymentMethod ?? 'TRANSFER']}
          {t.paymentMethod === 'TRANSFER' || !t.paymentMethod ? (l.payment?.iban ? ` sur le compte ${l.payment.iban}` : '') : ''}. Une quittance est remise au Locataire qui en fait la demande.
        </P>
        <P>TVA non applicable, article 293 B du code général des impôts.</P>
        {revision ? (
          <P>
            Le loyer est révisé chaque année à la date anniversaire du contrat{t.revision?.date ? ` (le ${t.revision.date.split('-').reverse().join('/')})` : ''}, selon la variation de l’indice de référence des
            loyers (IRL) publié par l’INSEE. Indice de référence : {t.revision?.irlQuarter ? `${quarterLabel(t.revision.irlQuarter)}${t.revision.irlValue ? ` (${String(t.revision.irlValue).replace('.', ',')})` : ''}` : BLANK}.
          </P>
        ) : (
          <P>Le loyer n’est pas révisé pendant la durée du contrat.</P>
        )}

        <Article n={next()} title="Dépôt de garantie" />
        <P>
          {deposit ? (
            <>
              {TheTenant} verse{plural ? 'nt' : ''} un dépôt de garantie de <B>{euros(deposit)}</B> ({eurosInWords(deposit)}). Il ne porte pas intérêt et sera restitué dans le mois qui suit la remise des moyens
              d’accès, déduction faite des sommes restant dues et du coût des dégradations justifiées.
            </>
          ) : (
            'Aucun dépôt de garantie n’est demandé.'
          )}
        </P>

        <Article n={next()} title="Obligations du Locataire" />
        <P>
          {TheTenant} s’engage{plural ? 'nt' : ''} à : payer le loyer et les charges aux termes convenus ; user de l’emplacement en bon père de famille et suivant l’usage prévu (article 1728 du Code civil) ; le
          maintenir propre et en bon état, sans y faire de modification ni de percement sans l’accord écrit du Bailleur ; répondre des dégradations et des pertes survenues pendant la location, à moins de prouver
          qu’elles ont eu lieu sans sa faute (article 1732) ; respecter le règlement de l’immeuble ou de la copropriété ; ne pas sous-louer ni céder le contrat sans l’accord écrit du Bailleur.
        </P>
        <P>
          Il s’assure pour sa responsabilité civile et les risques liés à l’occupation de l’emplacement (incendie, dégât des eaux), et en justifie au Bailleur à la signature puis chaque année à sa demande. Le
          Bailleur n’est pas responsable des vols ou dégradations commis par des tiers sur le véhicule ou les objets entreposés.
        </P>

        <Article n={next()} title="Obligations du Bailleur" />
        <P>
          Le Bailleur délivre l’emplacement en bon état d’usage, en assure la jouissance paisible pendant la durée du contrat et y fait les réparations autres que locatives (articles 1719 et 1720 du Code civil).
        </P>

        <Article n={next()} title="Clause résolutoire" />
        <P>
          À défaut de paiement d’un seul terme de loyer ou de charges à son échéance, ou de justification de l’assurance, et un mois après une mise en demeure restée sans effet, le contrat sera résilié de plein
          droit si le Bailleur le souhaite. {TheTenant} devr{plural ? 'ont' : 'a'} alors libérer l’emplacement et restituer les moyens d’accès.
        </P>

        {c.guarantors.length ? (
          <>
            <Article n={next()} title="Caution" />
            <P>
              {c.guarantors.map((g) => personName({ civility: g.civility, firstNames: g.firstNames, lastName: g.lastName })).join(' et ')} se porte{c.guarantors.length > 1 ? 'nt' : ''} caution des engagements du
              Locataire, par acte séparé.
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

        <Article n={next()} title="État des lieux" />
        <P>Un état des lieux est établi contradictoirement à la remise et à la restitution des moyens d’accès.</P>

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
              ...tenants.map((tn, i) => ({ label: plural ? `Signature du locataire ${i + 1}` : 'Signature du locataire', name: formal(tn), image: signed?.tenants?.[i]?.image, hint: signedHint(signed?.tenants?.[i]) })),
            ]}
          />
        </View>

        <Footer left={`Location ${lastNames || ''}${version}${signed?.certificate ? ` · signé électroniquement, réf. ${signed.certificate.requestId.slice(0, 8)}` : ''}`} paraphs={signed?.certificate ? 0 : paraphs} />
      </Page>
      {signed?.certificate ? <CertificatePage data={signed.certificate} /> : null}
    </Document>
  )
}
