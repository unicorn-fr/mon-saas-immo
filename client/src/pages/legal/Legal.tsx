import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { SimplePage } from '../../components/SiteChrome'
import { CONTACT_EMAIL, EDITOR, FOUNDER_LINKEDIN, LAUNCH_OFFER, MEDIATOR, priceLabel } from '../../config'

/** Date de la dernière mise à jour des pages légales (affichée en tête de chacune). */
const UPDATED = '3 octobre 2026'

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 style={{ margin: '36px 0 12px', fontSize: 20, fontWeight: 700, color: BAI.ink }}>{children}</h2>
)
const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
const Updated = () => <p>Mise à jour le {UPDATED}.</p>

/** Tableau simple, lisible au lecteur d'écran (en-têtes de colonnes). */
function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  const cell = { padding: '10px 12px', borderBottom: `1px solid ${BAI.divider}`, textAlign: 'left' as const, verticalAlign: 'top' as const }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 15, background: BAI.surface }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" style={{ ...cell, color: BAI.ink, fontWeight: 700 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={cell}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function MentionsLegales() {
  return (
    <SimplePage title="Mentions légales">
      <Updated />
      <H2>Éditeur du site</H2>
      <p>
        {EDITOR.company ? (
          <>
            Bailio est édité par {EDITOR.company}
            {EDITOR.registration ? `, ${EDITOR.registration}` : ''}
            {EDITOR.address ? `, ${EDITOR.address}` : ''}.
          </>
        ) : (
          <>
            Bailio est édité par Enzo Mercier, personne physique, fondateur du service
            {EDITOR.address ? `, ${EDITOR.address}` : ', à Montpellier'}.
          </>
        )}{' '}
        {EDITOR.phone ? <>Téléphone : {EDITOR.phone}. </> : null}
        Email : <Mail />. Profil professionnel : <a href={FOUNDER_LINKEDIN} rel="noopener">linkedin.com/in/enzo-mercier</a>.
      </p>
      {EDITOR.vat ? <p>Numéro de TVA intracommunautaire : {EDITOR.vat}.</p> : null}
      {EDITOR.company ? null : (
        <p>
          L'entreprise qui exploitera Bailio est en cours de création. Sa dénomination, son siège et son numéro
          d'immatriculation figureront ici dès qu'elle sera immatriculée.
        </p>
      )}
      <p>Directeur de la publication : Enzo Mercier.</p>
      <H2>Hébergement</H2>
      <p>
        L'application et la base de données sont hébergées en Suisse par Infomaniak Network SA, rue Eugène-Marziano 25,
        1227 Les Acacias (Genève), Suisse, téléphone +41 22 820 35 44 (infomaniak.com). La Suisse est reconnue par la
        Commission européenne comme offrant un niveau de protection des données adéquat.
      </p>
      <p>Les pages du site sont servies par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis (vercel.com).</p>
      <H2>Propriété intellectuelle</H2>
      <p>
        La marque Bailio, le site, ses textes et sa présentation sont protégés. Les modèles de documents suivent les contrats types
        et les textes publiés par l'État, qui restent libres. Les documents que vous créez avec Bailio vous appartiennent.
      </p>
      <H2>Information importante</H2>
      <p>
        Bailio fournit des documents conformes aux modèles officiels, des calculs et des rappels. Bailio n'est pas un avocat et
        ne donne pas de conseil juridique ou fiscal personnalisé.
      </p>
      <H2>Pour aller plus loin</H2>
      <ul>
        <li>
          <Link to="/conditions">Conditions d'utilisation</Link>
        </li>
        <li>
          <Link to="/confidentialite">Confidentialité et données personnelles</Link>
        </li>
        <li>
          <Link to="/cookies">Cookies et stockage dans le navigateur</Link>
        </li>
        <li>
          <Link to="/prix-et-remboursement">Prix, rétractation et remboursement</Link>
        </li>
        <li>
          <Link to="/accessibilite">Accessibilité</Link>
        </li>
      </ul>
    </SimplePage>
  )
}

export function Conditions() {
  return (
    <SimplePage title="Conditions d'utilisation">
      <Updated />
      <p>
        Ces conditions forment le contrat entre vous et l'éditeur de Bailio (voir les <Link to="/mentions-legales">mentions légales</Link>).
        Vous les acceptez en créant votre espace. Elles restent consultables à tout moment sur cette page.
      </p>
      <H2>1. Le service</H2>
      <p>
        Bailio aide les propriétaires bailleurs particuliers à louer leur logement en résidence principale (location vide ou meublée) :
        bail sur le modèle officiel, signature en ligne, états des lieux, quittances, courriers, révision du loyer, aide à la
        déclaration des revenus et rappels des échéances. Le service s'adresse aux personnes majeures. Il n'est pas conçu pour les
        locations saisonnières, commerciales ou professionnelles.
      </p>
      <H2>2. Votre espace</H2>
      <p>
        Votre espace est créé avec votre adresse email. Il n'y a pas de mot de passe : la connexion se fait par un lien envoyé à cette
        adresse, valable 30 minutes. Gardez votre messagerie protégée : quiconque y accède peut se connecter à votre espace. Vous voyez
        les appareils connectés dans « Mon compte » et pouvez les déconnecter.
      </p>
      <H2>3. Vos engagements</H2>
      <ul>
        <li>Saisir des informations exactes : elles sont reprises telles quelles dans vos documents ;</li>
        <li>
          N'enregistrer les informations de vos locataires, candidats et garants que pour gérer la location, ne demander que les pièces
          autorisées (décret n° 2015-1437) et informer ces personnes que vous utilisez Bailio ;
        </li>
        <li>Ne pas déposer de contenu illicite, ni utiliser Bailio pour un usage contraire à la loi ou pour nuire au service.</li>
      </ul>
      <H2>4. Les documents</H2>
      <p>
        Les baux suivent les contrats types du décret n° 2015-587 du 29 mai 2015. Bailio contrôle les règles de la loi du
        6 juillet 1989 qu'il connaît (dépôt de garantie, durée, plafonds du loyer, diagnostics…), mais ne peut pas connaître toute
        votre situation. Relisez chaque document avant de le signer ou de l'envoyer. En cas de doute ou de litige, adressez-vous à
        l'ADIL de votre département (conseil gratuit) ou à un professionnel du droit.
      </p>
      <H2>5. Signature en ligne</H2>
      <p>
        La signature en ligne de Bailio est une signature électronique simple (Code civil, article 1367) : chaque signataire confirme
        son identité par un code reçu par email ; la date, l'heure, l'adresse IP, l'empreinte du document et, s'il l'accepte, une photo
        prise au moment de signer sont réunies dans un certificat joint au bail signé.
      </p>
      <H2>6. Lecture automatique des documents</H2>
      <p>
        Lorsque vous importez un bail ou une facture, il est lu automatiquement sur nos propres serveurs, sans être transmis à un
        autre service, pour remplir les informations à votre place. Vous vérifiez toujours le résultat avant de l'enregistrer.
      </p>
      <H2>7. Prix</H2>
      <p>
        Le premier bail est gratuit. L'offre « Bailio, tout inclus » est affichée à {priceLabel()} par mois, toutes taxes comprises,
        sans engagement. {LAUNCH_OFFER} : aucun paiement n'est demandé aujourd'hui et aucune carte bancaire n'est enregistrée. Avant tout
        paiement, vous serez prévenu par email et votre accord exprès vous sera demandé. Le détail, la rétractation et les
        remboursements sont expliqués sur la page <Link to="/prix-et-remboursement">Prix, rétractation et remboursement</Link>.
      </p>
      <H2>8. Disponibilité</H2>
      <p>
        Nous faisons le nécessaire pour que Bailio reste accessible et que vos données soient sauvegardées. Le service peut être
        interrompu pour maintenance ou en cas de panne. Vos documents restent téléchargeables en PDF : gardez une copie de vos baux
        signés.
      </p>
      <H2>9. Responsabilité</H2>
      <p>
        L'éditeur répond des dommages causés par un manquement à ses obligations, dans les conditions du droit commun. Il ne répond
        pas des conséquences d'informations inexactes que vous avez saisies, ni de l'usage que vous faites des documents. Rien dans
        ces conditions ne limite les droits que la loi vous reconnaît en tant que consommateur.
      </p>
      <H2>10. Données personnelles</H2>
      <p>
        Ce que nous conservons, pourquoi, combien de temps et vos droits : voir la page <Link to="/confidentialite">Confidentialité</Link>.
        Pour les données de vos locataires, Bailio agit comme sous-traitant (article 28 du RGPD) : ces conditions valent contrat de
        sous-traitance, selon les engagements décrits sur cette page.
      </p>
      <H2>11. Fin du contrat</H2>
      <p>
        Vous pouvez supprimer votre espace à tout moment depuis « Mon compte », après confirmation par un code envoyé par email.
        Toutes vos données sont alors effacées. Téléchargez avant vos documents et l'export de vos données. Nous pouvons suspendre
        un espace utilisé contrairement à la loi ou à ces conditions, après vous avoir prévenu par email, sauf urgence.
      </p>
      <H2>12. Modification des conditions</H2>
      <p>
        Si ces conditions changent, vous êtes prévenu par email au moins 30 jours avant. Si vous n'êtes pas d'accord, vous pouvez
        supprimer votre espace sans frais avant cette date.
      </p>
      <H2>13. Réclamation, médiation et droit applicable</H2>
      <p>
        Pour toute réclamation, écrivez à <Mail /> : nous répondons sous deux jours ouvrés.{' '}
        {MEDIATOR ? (
          <>
            Si le désaccord persiste, vous pouvez saisir gratuitement le médiateur de la consommation : {MEDIATOR.name}, {MEDIATOR.address},{' '}
            <a href={MEDIATOR.url} rel="noopener">
              {MEDIATOR.url.replace(/^https?:\/\//, '')}
            </a>
            , dans un délai d'un an après votre réclamation écrite.
          </>
        ) : (
          <>Le médiateur de la consommation auquel vous pourrez recourir gratuitement sera indiqué ici avant la mise en place de toute offre payante.</>
        )}
      </p>
      <p>
        Ces conditions sont soumises au droit français. En cas de litige, et si vous êtes consommateur, vous pouvez saisir le tribunal
        du lieu où vous demeuriez au moment de la conclusion du contrat ou de la survenance du fait dommageable.
      </p>
    </SimplePage>
  )
}

export function Confidentialite() {
  return (
    <SimplePage title="Confidentialité">
      <Updated />
      <p>Vos locations contiennent des informations personnelles, les vôtres et celles de vos locataires. Voici ce que nous en faisons, simplement.</p>
      <H2>Qui est responsable</H2>
      <p>
        Pour vos propres données (votre compte, votre profil) : l'éditeur de Bailio, Enzo Mercier (voir les <Link to="/mentions-legales">mentions
        légales</Link>), joignable à <Mail />. Pour les données de vos locataires, candidats et garants, c'est vous, le propriétaire, qui
        êtes responsable : Bailio agit pour votre compte (voir plus bas).
      </p>
      <H2>Ce que nous conservons</H2>
      <ul>
        <li>Votre email, votre identité et votre adresse de bailleur, votre signature et, si vous l'indiquez, votre IBAN (affiché seulement sur les avis d'échéance) ;</li>
        <li>Vos logements : adresse, description, diagnostics et photos ;</li>
        <li>Vos locataires et leurs garants : identité, date et lieu de naissance, coordonnées, justificatifs que vous déposez, attestation d'assurance ;</li>
        <li>Vos baux, loyers reçus, quittances, courriers, états des lieux (photos et signatures comprises), dépenses et factures ;</li>
        <li>
          Pour un bail signé en ligne, la preuve de chaque signature : nom, email, date et heure, adresse IP, type d'appareil, mention recopiée, signature dessinée et, s'il l'accepte, photo du signataire prise au moment de signer (facultative, réencodée sans données de localisation, datée par notre serveur). Elle figure
          dans le certificat joint au bail signé et sert à prouver la signature en cas de désaccord (Code civil, article 1367) ;
        </li>
        <li>Les candidatures reçues par le lien de candidature d'un logement : identité, coordonnées, situation, revenus, garantie, lien DossierFacile et, si le propriétaire les demande, les justificatifs que la loi autorise (décret n° 2015-1437). Elles ne sont visibles que du propriétaire ;</li>
        <li>Ce que le locataire complète lui-même par le lien « Votre dossier de location » envoyé par son futur bailleur : identité, naissance, coordonnées, situation et revenus, ceux de son garant, et les justificatifs que la loi autorise à demander (décret n° 2015-1437). Ils rejoignent sa fiche et ne sont visibles que du propriétaire. Le lien expire après 30 jours ;</li>
        <li>Ce que le locataire envoie par le lien « Documents du locataire » que lui remet son propriétaire : attestation d'assurance habitation, attestation d'entretien de la chaudière, accord (ou retrait de l'accord) pour recevoir les quittances par email, avec sa date. Ces éléments sont rangés avec le bail et ne sont visibles que du propriétaire ;</li>
        <li>Pour votre sécurité, chaque appareil connecté à votre compte : type d'appareil et de navigateur, adresse IP, date de connexion et de dernière visite. Vous les voyez dans « Mon compte » et pouvez les déconnecter.</li>
      </ul>
      <p>
        Nous ne demandons jamais de pièces que la loi interdit d'exiger d'un locataire (article 22-2 de la loi du 6 juillet 1989). Les
        champs marqués « facultatif » peuvent rester vides ; les autres sont nécessaires pour établir un bail conforme ou vous rappeler
        vos échéances : sans eux, le document ne peut pas être fait.
      </p>
      <H2>Pourquoi, et sur quelle base</H2>
      <Table
        head={['Ce que nous faisons', 'Base légale (RGPD, art. 6)']}
        rows={[
          ['Créer votre espace, préparer vos documents, envoyer vos rappels et les emails du service', 'Exécution du contrat (conditions d’utilisation)'],
          ['Garder la preuve des signatures en ligne', 'Intérêt légitime : pouvoir prouver la signature en cas de désaccord'],
          ['Photo du signataire au moment de signer', 'Consentement du signataire, libre : il peut signer sans photo'],
          ['Relever les appareils connectés et limiter les tentatives de connexion', 'Intérêt légitime : la sécurité de votre compte'],
          ['Données de vos locataires, candidats et garants', 'Traitées pour votre compte, sur la base qui vous revient (préparation et exécution du bail)'],
          ['Conserver les factures, si une offre payante est un jour souscrite', 'Obligation légale (10 ans, Code de commerce, art. L123-22)'],
        ]}
      />
      <p>
        Nous ne revendons aucune donnée, n'affichons aucune publicité et n'envoyons pas d'emails commerciaux. Aucune décision n'est prise
        automatiquement à votre sujet : les calculs et contrôles de Bailio vous informent, vous décidez.
      </p>
      <H2>Où sont vos données</H2>
      <p>
        En Suisse, sur un serveur qui nous est dédié chez Infomaniak (Genève). La Suisse fait l'objet d'une décision d'adéquation de la
        Commission européenne : ses règles de protection sont reconnues équivalentes à celles de l'Union européenne. Les échanges avec
        le site sont chiffrés (HTTPS) et la base de données n'est pas accessible depuis internet. Rien n'est conservé ailleurs.
      </p>
      <H2>Qui y a accès</H2>
      <p>
        Vous seul, et les personnes à qui vous envoyez un document ou un lien. Les baux et les factures que vous importez sont lus sur
        notre serveur : ils ne sont transmis à aucun service d'intelligence artificielle ni à aucun autre tiers. Seule l'adresse du
        logement que vous tapez est envoyée, depuis notre serveur, au service public de recherche d'adresses de l'IGN (Géoplateforme,
        à partir de la Base Adresse Nationale), pour la compléter. Si vous utilisez un assistant d'IA pour rédiger votre annonce, c'est
        vous qui y copiez la consigne préparée par Bailio : elle décrit le logement, sans adresse exacte ni nom, et Bailio ne l'envoie nulle part.
      </p>
      <p>Prestataires techniques qui interviennent pour notre compte :</p>
      <Table
        head={['Prestataire', 'Rôle', 'Lieu et garanties']}
        rows={[
          ['Infomaniak Network SA', 'Serveur et base de données', 'Suisse (décision d’adéquation)'],
          ['Vercel Inc.', 'Sert les pages du site et relaie, chiffrés, les échanges avec notre serveur ; peut garder quelques jours des journaux techniques (adresse IP, page demandée) pour la sécurité de son réseau', 'États-Unis : certifié Data Privacy Framework UE–États-Unis (décision d’adéquation du 10 juillet 2023)'],
          ['IONOS SE', 'Envoi des emails (liens de connexion, rappels, documents)', 'Allemagne'],
          ['Resend, Inc.', 'Envoi des emails, en secours seulement', 'États-Unis : clauses contractuelles types de la Commission européenne'],
        ]}
      />
      <H2>Les données de vos locataires</H2>
      <p>
        Pour les informations de vos locataires, candidats et garants, c'est vous qui êtes responsable du traitement ; Bailio agit comme
        sous-traitant, uniquement sur vos instructions (article 28 du RGPD). Bailio s'engage à : ne les utiliser que pour vous rendre le
        service ; les garder confidentielles ; les protéger (chiffrement des échanges, accès limité, sauvegardes) ; ne faire appel qu'aux
        prestataires listés ci-dessus ; vous aider à répondre aux demandes de ces personnes ; vous prévenir sans tarder en cas de fuite
        de données ; les effacer à la suppression de votre compte ou aux échéances ci-dessous. Pensez à informer vos locataires et
        candidats que vous utilisez Bailio pour gérer la location.
      </p>
      <H2>Combien de temps</H2>
      <ul>
        <li>Un bail commencé sans compte : 30 jours, puis il est effacé ;</li>
        <li>Votre compte et vos documents : tant que vous gardez votre compte. Supprimer le compte efface immédiatement toutes vos données ;</li>
        <li>Les liens de connexion : 30 minutes, puis ils ne servent plus. Un appareil inutilisé pendant 30 jours est déconnecté et son relevé effacé. Les codes de confirmation : 10 minutes ;</li>
        <li>Les candidatures : trois mois au plus après leur envoi, pièces comprises. Celle que le propriétaire retient devient la fiche du locataire ;</li>
        <li>Le dossier d'un locataire et de son garant : gardé pendant la location, puis trois ans après la fin du dernier bail (délai pendant lequel une action liée au bail reste possible, comme le recommande la CNIL). Ensuite, les justificatifs et les informations devenues inutiles (revenus, situation, naissance, téléphone, garant) sont effacés ; restent le nom et l'email, qui figurent dans les quittances et le bail ;</li>
        <li>La photo prise à la signature : effacée trois ans après la fin du bail. La date, l'heure et l'empreinte de la photo restent dans le certificat de signature ;</li>
        <li>Les éléments supprimés vont dans la corbeille : effacés définitivement après 30 jours.</li>
      </ul>
      <H2>Vos droits</H2>
      <p>
        Vous pouvez accéder à vos données, les corriger, les faire effacer, en limiter l'usage, vous opposer à un traitement fondé sur
        l'intérêt légitime, retirer à tout moment un consentement donné (sans effet sur ce qui a été fait avant), récupérer vos données
        dans un format réutilisable, et indiquer ce que vous souhaitez qu'il en soit fait après votre décès (loi du 6 janvier 1978, article 85).
      </p>
      <p>
        Le téléchargement de toutes vos données et la suppression du compte se font directement depuis « Mon compte ». Pour toute autre
        demande : <Mail />. Nous répondons dans un délai d'un mois. Un locataire, un candidat ou un garant peut s'adresser à son propriétaire,
        ou à nous : nous transmettrons. Vous pouvez aussi adresser une réclamation à la CNIL (cnil.fr, 3 place de Fontenoy, TSA 80715,
        75334 Paris Cedex 07).
      </p>
      <H2>Cookies</H2>
      <p>
        Bailio ne dépose aucun cookie et ne contient aucun traceur publicitaire ni outil de mesure d'audience. Les seules informations
        gardées dans votre navigateur sont nécessaires au service : voir la page <Link to="/cookies">Cookies et stockage dans le navigateur</Link>.
      </p>
    </SimplePage>
  )
}

export function Cookies() {
  return (
    <SimplePage title="Cookies">
      <Updated />
      <p>
        Bailio ne dépose aucun cookie. Aucun outil de mesure d'audience, aucune publicité, aucun bouton de réseau social, aucune police
        ou script chargé depuis un autre site : tout est servi par Bailio.
      </p>
      <H2>Ce qui est gardé dans votre navigateur</H2>
      <p>Quelques informations restent sur votre appareil, dans le stockage du navigateur, parce que le service ne fonctionne pas sans elles :</p>
      <Table
        head={['Nom', 'À quoi il sert', 'Durée']}
        rows={[
          ['bailio.session', 'Vous garder connecté à votre espace (jeton de session aléatoire)', 'Jusqu’à la déconnexion, ou 30 jours sans visite'],
          ['bailio.draft', 'Retrouver le bail commencé sans compte, si vous fermez la page', '30 jours, ou jusqu’à la création de votre espace'],
          ['bailio.boot, bailio.recover', 'Recharger une seule fois la page si elle s’est mal chargée', 'Le temps de l’onglet ouvert'],
          ['Service de mise à jour du site', 'Vider l’ancienne version du site après une mise à jour', 'Aucune donnée personnelle'],
        ]}
      />
      <H2>Faut-il votre accord ?</H2>
      <p>
        Non. La loi (article 82 de la loi du 6 janvier 1978, qui transpose la directive « vie privée et communications électroniques »)
        dispense d'accord les informations strictement nécessaires au service que vous demandez, comme la connexion à votre compte. C'est
        pourquoi Bailio n'affiche pas de bandeau de consentement. Si un jour un outil soumis à votre accord était ajouté, il ne serait
        activé qu'après votre accord explicite, aussi simple à refuser qu'à accepter.
      </p>
      <H2>Effacer ces informations</H2>
      <p>
        Le bouton « Se déconnecter » efface votre session. Vous pouvez aussi tout effacer depuis les réglages de votre navigateur
        (données des sites) : vous serez simplement déconnecté.
      </p>
    </SimplePage>
  )
}

export function PrixRemboursement() {
  return (
    <SimplePage title="Prix et remboursement">
      <Updated />
      <H2>Aujourd'hui : rien à payer</H2>
      <p>
        {LAUNCH_OFFER}. Bailio ne demande aucun paiement et n'enregistre aucune carte bancaire. Il n'y a donc rien à rembourser.
        Le premier bail restera gratuit.
      </p>
      <H2>L'offre « Bailio, tout inclus »</H2>
      <p>Ce qui suit s'appliquera dès qu'une offre payante sera ouverte.</p>
      <p>
        Prix affiché : {priceLabel()} par mois, toutes taxes comprises, sans engagement. Avant le premier paiement, vous serez prévenu par
        email, le prix et ce qu'il comprend vous seront rappelés, et votre accord exprès vous sera demandé. Sans votre accord, rien ne
        sera prélevé et vous gardez votre espace et vos documents.
      </p>
      <H2>Droit de rétractation : 14 jours</H2>
      <p>
        Après avoir souscrit une offre payante, vous disposez de 14 jours pour changer d'avis, sans avoir à vous justifier (Code de la
        consommation, article L221-18). Il suffira d'écrire à <Mail /> ou d'utiliser le bouton qui sera prévu dans « Mon compte ». Si vous avez
        demandé à profiter du service tout de suite, seule la part correspondant aux jours déjà utilisés reste due (article L221-25).
      </p>
      <H2>Remboursement</H2>
      <p>
        En cas de rétractation, vous serez remboursé dans les 14 jours, par le même moyen de paiement (article L221-24). Une somme prélevée
        par erreur sera remboursée en totalité.
      </p>
      <H2>Arrêter l'abonnement</H2>
      <p>
        L'abonnement est sans engagement : vous pourrez l'arrêter à tout moment, en ligne, en quelques clics depuis « Mon compte »
        (article L215-1-1). Il prendra fin à la fin du mois déjà payé ; aucun nouveau prélèvement n'aura lieu ensuite.
      </p>
      <H2>Réclamation et médiation</H2>
      <p>
        Écrivez à <Mail />.{' '}
        {MEDIATOR ? (
          <>
            Si le désaccord persiste, vous pouvez saisir gratuitement le médiateur de la consommation : {MEDIATOR.name},{' '}
            <a href={MEDIATOR.url} rel="noopener">
              {MEDIATOR.url.replace(/^https?:\/\//, '')}
            </a>
            .
          </>
        ) : (
          <>Le médiateur de la consommation que vous pourrez saisir gratuitement sera indiqué ici avant tout paiement.</>
        )}
      </p>
    </SimplePage>
  )
}

export function Accessibilite() {
  return (
    <SimplePage title="Accessibilité">
      <Updated />
      <p>Bailio doit pouvoir être utilisé par tous, y compris au clavier, avec un lecteur d'écran ou un agrandissement de l'affichage.</p>
      <H2>Ce qui est fait</H2>
      <ul>
        <li>Toutes les pages sont contrôlées automatiquement selon les critères WCAG 2.1, niveau AA, à chaque mise à jour du site ;</li>
        <li>Contrastes des textes d'au moins 4,5 pour 1, bords des champs et contours de sélection visibles ;</li>
        <li>Chaque champ a un intitulé, chaque image un texte de remplacement, chaque page un titre ;</li>
        <li>Un lien « Aller au contenu » permet de passer le menu au clavier ;</li>
        <li>Les animations sont réduites si vous l'avez demandé dans les réglages de votre appareil.</li>
      </ul>
      <H2>État de conformité</H2>
      <p>
        Bailio n'a pas encore fait l'objet d'un audit complet selon le référentiel général d'amélioration de l'accessibilité (RGAA 4.1).
        Les contrôles automatiques ne détectent pas tout : la signature dessinée et la prise de photo, par exemple, peuvent être difficiles
        à utiliser sans la vue. Dans ces cas, le bail peut être imprimé et signé à la main.
      </p>
      <H2>Signaler un problème</H2>
      <p>
        Si un contenu ou une fonction vous est inaccessible, écrivez à <Mail /> : nous vous apporterons une solution ou l'information
        sous une autre forme. Si vous n'obtenez pas de réponse satisfaisante, vous pouvez saisir le Défenseur des droits
        (defenseurdesdroits.fr).
      </p>
    </SimplePage>
  )
}

export function Contact() {
  return (
    <SimplePage title="Contact">
      <p>
        Une question, un souci avec un document ? Écrivez-nous à <Mail />.
        Nous répondons sous deux jours ouvrés.
      </p>
      <p>
        Bailio a été fondé à Montpellier par{' '}
        <a href={FOUNDER_LINKEDIN} rel="noopener">
          Enzo Mercier
        </a>
        .
      </p>
    </SimplePage>
  )
}

export function NotFound() {
  return (
    <SimplePage title="Page introuvable">
      <p>Cette page n'existe pas ou n'existe plus.</p>
      <p>
        <Link to="/">Retour à l'accueil</Link>
      </p>
    </SimplePage>
  )
}
