import { Document, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import {
  durationMonths,
  formatDateFr,
  formatEuros,
  fullName,
  leaseEndDate,
  maxDepositCents,
  parseIsoDate,
  type LeaseInput,
} from '../domain/lease.js'
import { quarterLabel } from '../lib/irl.js'
import { BLANK, Bullet, Field, Footer, H1, H2, P, orBlank, styles } from './components.js'

/**
 * Contrat de location conforme aux contrats types du décret n° 2015-587 du 29 mai 2015
 * (annexe 1 : logement nu ; annexe 2 : logement meublé), loi n° 89-462 du 6 juillet 1989.
 * Les informations inconnues sont laissées en blanc pour être complétées à la main.
 */
export function LeaseDocument({ lease }: { lease: LeaseInput }) {
  const furnished = lease.type === 'FURNISHED'
  const start = parseIsoDate(lease.rent.startDate)
  const months = durationMonths(lease.type)
  const end = leaseEndDate(start, months)
  const durationLabel = furnished ? 'un (1) an' : 'trois (3) ans'
  const tenants = lease.tenants
  const plural = tenants.length > 1
  const total = lease.rent.rentCents + lease.rent.chargesCents
  const deposit = lease.rent.depositCents ?? maxDepositCents(lease.type, lease.rent.rentCents)
  const p = lease.property
  const footer = `Contrat de location ${furnished ? 'meublée' : 'vide'} · ${p.address}`

  return (
    <Document title={`Bail — ${p.address}`} author={fullName(lease.landlord)} creator="Bailio" language="fr-FR">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>CONTRAT DE LOCATION</Text>
        <Text style={styles.subtitle}>
          {furnished ? 'Logement meublé' : 'Logement nu (location vide)'} à usage de résidence principale
        </Text>
        <Text style={styles.intro}>
          Soumis au titre I{furnished ? 'er bis' : 'er'} de la loi n° 89-462 du 6 juillet 1989 tendant à améliorer les
          rapports locatifs et portant modification de la loi n° 86-1290 du 23 décembre 1986.{'\n'}
          Établi conformément au contrat type défini par le décret n° 2015-587 du 29 mai 2015 (annexe {furnished ? '2' : '1'}).
        </Text>

        <View style={styles.box}>
          <Text style={{ fontSize: 8.5, textAlign: 'justify' }}>
            Le régime de droit commun en matière de baux d'habitation est défini principalement par la loi n° 89-462 du
            6 juillet 1989. L'ensemble de ces dispositions étant d'ordre public, elles s'imposent aux parties qui, en
            principe, ne peuvent pas y renoncer. Une notice d'information relative aux droits et obligations des
            locataires et des bailleurs est annexée au présent contrat.
          </Text>
        </View>

        <H1>I. Désignation des parties</H1>
        <P>Le présent contrat est conclu entre les soussignés :</P>
        <H2>Le bailleur</H2>
        <Field label="Nom et prénom" value={fullName(lease.landlord)} />
        <Field label="Qualité" value="Personne physique" />
        <Field label="Domicile" value={lease.landlord.address} />
        <P>désigné ci-après « le bailleur ». Le bailleur n'est pas représenté par un mandataire.</P>
        <H2>{plural ? 'Les locataires' : 'Le locataire'}</H2>
        {tenants.map((t, i) => (
          <View key={i} wrap={false}>
            <Field label={plural ? `Locataire ${i + 1}` : 'Nom et prénom'} value={fullName(t)} />
            {t.email ? <Field label="Adresse électronique" value={t.email} /> : null}
          </View>
        ))}
        <P>désigné{plural ? 's' : ''} ci-après « le locataire ».</P>
        <P>Il a été convenu ce qui suit :</P>

        <H1>II. Objet du contrat</H1>
        <P>Le présent contrat a pour objet la location d'un logement ainsi déterminé :</P>
        <H2>A. Consistance du logement</H2>
        <Field label="Localisation du logement" value={p.address} />
        <Field label="Type d'habitat" value={BLANK} hint="immeuble collectif / individuel" />
        <Field label="Régime juridique de l'immeuble" value={BLANK} hint="copropriété / monopropriété" />
        <Field label="Période de construction" value={BLANK} />
        <Field label="Surface habitable" value={`${p.surface.toLocaleString('fr-FR').replace(/\s/g, ' ')} m²`} />
        <Field label="Nombre de pièces principales" value={String(p.rooms)} />
        <Field label="Autres parties du logement" value={BLANK} hint="grenier, terrasse, balcon, jardin…" />
        <Field label="Éléments d'équipement du logement" value={BLANK} hint="cuisine équipée, sanitaires…" />
        <Field label="Production de chauffage" value={BLANK} hint="individuel / collectif" />
        <Field label="Production d'eau chaude sanitaire" value={BLANK} hint="individuelle / collective" />
        <Field
          label="Niveau de performance énergétique"
          value={p.dpeClass ? `Classe ${p.dpeClass}${p.dpeNumber ? ` (DPE n° ${p.dpeNumber})` : ''}` : BLANK}
        />
        {furnished ? (
          <P>
            Le logement est loué meublé. Il comporte au minimum les éléments de mobilier définis par le décret
            n° 2015-981 du 31 juillet 2015, dont la liste figure à l'inventaire annexé au présent contrat.
          </P>
        ) : null}
        <H2>B. Destination des locaux</H2>
        <P>Usage d'habitation. Le logement constitue la résidence principale du locataire.</P>
        <H2>C. Locaux et équipements accessoires à usage privatif du locataire</H2>
        <P>{BLANK} (cave, parking, garage…)</P>
        <H2>D. Locaux, parties, équipements et accessoires de l'immeuble à usage commun</H2>
        <P>{BLANK} (garage à vélo, ascenseur, espaces verts, aires et équipements de jeux, laverie, local poubelle, gardiennage…)</P>
        <H2>E. Équipement d'accès aux technologies de l'information et de la communication</H2>
        <P>{BLANK} (modalités de réception de la télévision, raccordement internet…)</P>

        <H1>III. Date de prise d'effet et durée du contrat</H1>
        <Field label="Date de prise d'effet" value={formatDateFr(start)} />
        <Field label="Durée du contrat" value={`${durationLabel}, soit jusqu'au ${formatDateFr(end)}`} />
        <P>
          En l'absence de proposition de renouvellement du contrat, celui-ci est, à son terme, reconduit tacitement pour
          une durée de {durationLabel} et dans les mêmes conditions.
        </P>
        <P>
          Le locataire peut mettre fin au bail à tout moment, après avoir donné congé dans les conditions prévues par la
          loi. Le bailleur peut mettre fin au bail à son échéance et après avoir donné congé, soit pour reprendre le
          logement en vue de l'occuper lui-même ou une personne de sa famille, soit pour le vendre, soit pour un motif
          sérieux et légitime.
        </P>

        <H1>IV. Conditions financières</H1>
        <H2>A. Loyer</H2>
        <Field label="Montant du loyer mensuel" value={`${formatEuros(lease.rent.rentCents)} hors charges`} />
        <P>
          Modalités particulières de fixation initiale du loyer applicables dans certaines zones tendues : le loyer du
          logement est soumis au décret fixant annuellement le montant maximum d'évolution des loyers à la relocation :
          {' '}{BLANK} (oui / non). Le loyer est soumis au loyer de référence majoré fixé par arrêté préfectoral :
          {' '}{BLANK} (oui / non). Le cas échéant : loyer de référence {BLANK} €/m², loyer de référence majoré {BLANK}{' '}
          €/m², complément de loyer {BLANK} €.
        </P>
        <P>
          Le cas échéant, informations relatives au loyer du dernier locataire (si ce dernier a quitté le logement moins
          de dix-huit mois avant la signature du présent contrat) : montant du dernier loyer acquitté {BLANK}, date de
          versement {BLANK}, date de la dernière révision {BLANK}.
        </P>
        <P>
          Révision du loyer : le loyer est révisé chaque année à la date anniversaire du contrat, en fonction de la
          variation de l'indice de référence des loyers (IRL) publié par l'INSEE.
        </P>
        <Field
          label="Trimestre de référence de l'IRL"
          value={lease.irl ? `${quarterLabel(lease.irl.quarter)} (valeur ${String(lease.irl.value).replace('.', ',')})` : BLANK}
        />
        <H2>B. Charges récupérables</H2>
        <Field label="Modalité de règlement" value="Provisions sur charges, avec régularisation annuelle" />
        <Field label="Montant des provisions sur charges" value={`${formatEuros(lease.rent.chargesCents)} par mois`} />
        <H2>C. Modalités de paiement</H2>
        <Field label="Périodicité du paiement" value="Mensuelle" />
        <Field label="Paiement" value="À échoir (en début de période)" />
        <Field label="Date de paiement" value={`Le ${lease.rent.paymentDay} de chaque mois`} />
        <Field label="Lieu et mode de paiement" value={BLANK} hint="virement bancaire…" />
        <P>Montant total dû à la première échéance de paiement pour une période complète de location :</P>
        <Field label="Loyer" value={formatEuros(lease.rent.rentCents)} />
        <Field label="Provisions sur charges" value={formatEuros(lease.rent.chargesCents)} />
        <Field label="Total" value={formatEuros(total)} />

        <H1>V. Travaux</H1>
        <P>
          Montant et nature des travaux d'amélioration ou de mise en conformité avec les caractéristiques de décence
          effectués depuis la fin du dernier contrat de location ou depuis le dernier renouvellement : {BLANK}
        </P>
        <P>Majoration du loyer en cours de bail consécutive à des travaux d'amélioration entrepris par le bailleur : néant.</P>
        <P>Diminution de loyer en cours de bail consécutive à des travaux entrepris par le locataire : néant.</P>

        <H1>VI. Garanties</H1>
        <Field label="Montant du dépôt de garantie" value={formatEuros(deposit)} />
        <P>
          Le dépôt de garantie ne peut excéder {furnished ? 'deux mois' : 'un mois'} de loyer en principal, hors charges.
          Il est restitué dans un délai maximal d'un mois à compter de la remise des clés par le locataire lorsque l'état
          des lieux de sortie est conforme à l'état des lieux d'entrée, et de deux mois dans le cas contraire, déduction
          faite, le cas échéant, des sommes restant dues au bailleur et des sommes dont celui-ci pourrait être tenu en
          lieu et place du locataire, sous réserve qu'elles soient dûment justifiées.
        </P>
        {lease.guarantor ? (
          <P>
            Le présent contrat est garanti par l'engagement de caution solidaire de {fullName(lease.guarantor)},
            demeurant {lease.guarantor.address}, formalisé dans un acte de cautionnement annexé au présent contrat.
          </P>
        ) : null}

        {plural ? (
          <>
            <H1>VII. Clause de solidarité</H1>
            <P>
              En cas de pluralité de locataires, ceux-ci sont tenus solidairement et indivisiblement de l'ensemble des
              obligations résultant du présent contrat, notamment du paiement du loyer et des charges.
            </P>
          </>
        ) : null}

        <H1>{plural ? 'VIII' : 'VII'}. Clause résolutoire</H1>
        <P>
          Le présent contrat sera résilié immédiatement et de plein droit, sans qu'il soit besoin de faire ordonner cette
          résolution en justice :
        </P>
        <Bullet>
          six semaines après un commandement de payer demeuré infructueux, à défaut de paiement aux termes convenus de
          tout ou partie du loyer et des charges dûment justifiées, ou en cas de non-versement du dépôt de garantie ;
        </Bullet>
        <Bullet>
          un mois après un commandement demeuré infructueux, à défaut d'assurance du locataire contre les risques
          locatifs ;
        </Bullet>
        <Bullet>
          en cas de manquement du locataire à l'obligation d'user paisiblement des locaux loués, résultant de troubles
          de voisinage constatés par une décision de justice passée en force de chose jugée.
        </Bullet>

        <H1>{plural ? 'IX' : 'VIII'}. Honoraires de location</H1>
        <P>Néant. Le présent contrat est conclu directement entre le bailleur et le locataire, sans intermédiaire.</P>

        <H1>{plural ? 'X' : 'IX'}. Autres conditions particulières</H1>
        <P>{BLANK}</P>
        <P>{BLANK}</P>

        <H1>{plural ? 'XI' : 'X'}. Annexes</H1>
        <P>Sont annexées et jointes au contrat de location les pièces suivantes :</P>
        <Bullet>
          le cas échéant, un extrait du règlement de copropriété concernant la destination de l'immeuble, la jouissance
          et l'usage des parties privatives et communes, et précisant la quote-part afférente au lot loué dans chacune
          des catégories de charges ;
        </Bullet>
        <Bullet>
          un dossier de diagnostic technique comprenant : le diagnostic de performance énergétique ; le constat de risque
          d'exposition au plomb pour les immeubles construits avant le 1er janvier 1949 ; une copie de l'état mentionnant
          l'absence ou la présence de matériaux ou produits contenant de l'amiante ; l'état de l'installation intérieure
          d'électricité et de gaz lorsqu'elle a plus de quinze ans ; l'état des risques ; le cas échéant, le diagnostic
          bruit ;
        </Bullet>
        <Bullet>la notice d'information relative aux droits et obligations des locataires et des bailleurs ;</Bullet>
        <Bullet>
          l'état des lieux d'entrée{furnished ? ", ainsi que l'inventaire et l'état détaillé du mobilier" : ''} ;
        </Bullet>
        <Bullet>le cas échéant, l'autorisation préalable de mise en location ;</Bullet>
        {lease.guarantor ? <Bullet>l'acte de cautionnement solidaire.</Bullet> : null}

        <View wrap={false}>
          <P>
            {'\n'}Fait et signé à {orBlank(null)}, le {orBlank(null)}, en {tenants.length + 1} originaux dont un remis à
            chacune des parties qui le reconnaît.
          </P>
          <View style={styles.signatures}>
            <View style={styles.signatureBox}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Le bailleur</Text>
              <Text style={{ fontSize: 8.5 }}>{fullName(lease.landlord)}</Text>
              <Text style={{ fontSize: 8, color: '#555555' }}>Signature précédée de « lu et approuvé »</Text>
            </View>
            {tenants.map((t, i) => (
              <View key={i} style={styles.signatureBox}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>{plural ? `Locataire ${i + 1}` : 'Le locataire'}</Text>
                <Text style={{ fontSize: 8.5 }}>{fullName(t)}</Text>
                <Text style={{ fontSize: 8, color: '#555555' }}>Signature précédée de « lu et approuvé »</Text>
              </View>
            ))}
          </View>
        </View>

        <Footer left={footer} />
      </Page>
    </Document>
  )
}

export function renderLeasePdf(lease: LeaseInput): Promise<Buffer> {
  return renderToBuffer(<LeaseDocument lease={lease} />)
}
