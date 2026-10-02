import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { SimplePage } from '../../components/SiteChrome'
import { CONTACT_EMAIL, FOUNDER_LINKEDIN } from '../../config'

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 style={{ margin: '36px 0 12px', fontSize: 20, fontWeight: 700, color: BAI.ink }}>{children}</h2>
)
const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>

export function MentionsLegales() {
  return (
    <SimplePage title="Mentions légales">
      <H2>Éditeur du site</H2>
      <p>
        Bailio est édité par Enzo Mercier, personne physique, fondateur du service, à Montpellier.
        Profil professionnel : <a href={FOUNDER_LINKEDIN} rel="noopener">linkedin.com/in/enzo-mercier</a>.
        Contact : <Mail />.
      </p>
      <p>
        L'entreprise qui exploitera Bailio est en cours de création. Sa dénomination, son adresse et son numéro
        d'immatriculation figureront ici dès qu'elle sera immatriculée.
      </p>
      <p>Directeur de la publication : Enzo Mercier.</p>
      <H2>Hébergement</H2>
      <p>
        L'application et la base de données sont hébergées en Suisse par Infomaniak Network SA,
        rue Eugène-Marziano 25, 1227 Les Acacias (Genève), Suisse (infomaniak.com). La Suisse est reconnue par la
        Commission européenne comme offrant un niveau de protection des données équivalent à celui de l'Union européenne.
        Les pages du site sont servies par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).
      </p>
      <H2>Propriété intellectuelle</H2>
      <p>La marque Bailio, le site et ses contenus sont protégés. Les modèles de documents suivent les contrats types publiés par l'État.</p>
      <H2>Information importante</H2>
      <p>Bailio fournit des documents conformes aux modèles officiels et des rappels. Bailio n'est pas un avocat et ne donne pas de conseil juridique personnalisé.</p>
    </SimplePage>
  )
}

export function Conditions() {
  return (
    <SimplePage title="Conditions d'utilisation">
      <p>En vigueur au 30 septembre 2026.</p>
      <H2>1. Le service</H2>
      <p>
        Bailio aide les propriétaires bailleurs particuliers à préparer leurs baux d'habitation (location vide ou meublée,
        résidence principale), leurs quittances et à suivre les échéances de leurs locations.
      </p>
      <H2>2. Votre compte</H2>
      <p>
        Votre espace est créé avec votre adresse email. Il n'y a pas de mot de passe : la connexion se fait par un lien envoyé à cette adresse.
        Vous êtes responsable des informations que vous saisissez : elles sont reprises telles quelles dans vos documents.
      </p>
      <H2>3. Les documents</H2>
      <p>
        Les baux suivent les contrats types du décret n° 2015-587 du 29 mai 2015. Certaines mentions sont laissées en blanc
        pour être complétées à la main. Relisez chaque document avant de le signer. Bailio ne remplace pas un conseil
        juridique : en cas de litige, adressez-vous à un professionnel du droit ou à l'ADIL de votre département.
      </p>
      <H2>4. Prix</H2>
      <p>Le premier bail est gratuit. Le prix de l'offre de suivi est indiqué sur la page d'accueil avant toute souscription.</p>
      <H2>5. Lecture automatique des documents</H2>
      <p>
        Lorsque vous importez un bail, il est lu automatiquement sur nos propres serveurs, sans être transmis à un
        autre service, pour remplir les informations à votre place. Vous vérifiez toujours le résultat avant de
        l'enregistrer.
      </p>
      <H2>6. Résiliation</H2>
      <p>Vous pouvez supprimer votre compte à tout moment depuis « Mon compte ». Toutes vos données sont alors effacées.</p>
      <H2>7. Droit applicable</H2>
      <p>Les présentes conditions sont soumises au droit français.</p>
    </SimplePage>
  )
}

export function Confidentialite() {
  return (
    <SimplePage title="Confidentialité">
      <p>Vos locations contiennent des informations personnelles, les vôtres et celles de vos locataires. Voici ce que nous en faisons, simplement.</p>
      <H2>Ce que nous conservons</H2>
      <ul>
        <li>Votre email, votre identité et votre adresse de bailleur, votre signature et, si vous l'indiquez, votre IBAN (affiché seulement sur les avis d'échéance) ;</li>
        <li>Vos logements : adresse, description, diagnostics et photos ;</li>
        <li>Vos locataires et leurs garants : identité, date et lieu de naissance, coordonnées, justificatifs que vous déposez, attestation d'assurance ;</li>
        <li>Vos baux, loyers reçus, quittances, courriers, états des lieux (photos et signatures comprises), dépenses et factures ;</li>
        <li>
          Pour un bail signé en ligne, la preuve de chaque signature : nom, email, date et heure, adresse IP, type d'appareil, mention recopiée et signature dessinée. Elle figure
          dans le certificat joint au bail signé et sert à prouver la signature en cas de désaccord (Code civil, article 1367). Elle est conservée aussi longtemps que le bail.
        </li>
        <li>Pour votre sécurité, chaque appareil connecté à votre compte : type d'appareil et de navigateur, adresse IP, date de connexion et de dernière visite. Vous les voyez dans « Mon compte » et pouvez les déconnecter.</li>
      </ul>
      <p>Nous ne demandons jamais de pièces que la loi interdit d'exiger d'un locataire.</p>
      <H2>Pourquoi</H2>
      <p>Uniquement pour préparer vos documents et vous rappeler vos échéances (exécution du service). Nous ne revendons aucune donnée et n'affichons aucune publicité.</p>
      <H2>Où sont vos données</H2>
      <p>
        En Suisse, sur un serveur qui nous est dédié chez Infomaniak (Genève). La Suisse offre un niveau de protection
        reconnu équivalent à celui de l'Union européenne. Les échanges avec le site sont chiffrés (HTTPS) et la base de
        données n'est pas accessible depuis internet. Rien n'est conservé ailleurs.
      </p>
      <H2>Qui y a accès</H2>
      <p>
        Vous seul. Les baux et les factures que vous importez sont lus sur notre serveur : ils ne sont transmis à aucun
        service d'intelligence artificielle ni à aucun autre tiers. Seule l'adresse du logement est vérifiée auprès de la Base
        Adresse Nationale, un service public français.
      </p>
      <p>
        Deux prestataires techniques interviennent pour notre compte. Vercel sert les pages du site et transmet, chiffrés,
        les échanges entre votre navigateur et notre serveur, sans les conserver. Les emails de Bailio (liens de connexion,
        rappels, documents envoyés à vos locataires) partent par la messagerie d'Ionos, en Allemagne, ou en secours par
        Resend. Vercel et Resend sont situés aux États-Unis ; ces transferts sont encadrés par les clauses contractuelles
        types de la Commission européenne.
      </p>
      <H2>Les données de vos locataires</H2>
      <p>
        Pour les informations de vos locataires et de leurs garants, c'est vous qui êtes responsable du traitement ;
        Bailio agit comme sous-traitant, uniquement sur vos instructions (article 28 du RGPD). Pensez à informer vos
        locataires que vous utilisez Bailio pour gérer la location. Ne gardez que les justificatifs utiles : ceux d'un
        candidat non retenu doivent être supprimés, et ceux de votre locataire ne se conservent pas au-delà de la location.
      </p>
      <H2>Combien de temps</H2>
      <ul>
        <li>Un bail commencé sans compte : 30 jours, puis il est effacé ;</li>
        <li>Votre compte et vos documents : tant que vous gardez votre compte. Supprimer le compte efface immédiatement toutes vos données ;</li>
        <li>Les liens de connexion : 30 minutes, puis ils ne servent plus. Un appareil inutilisé pendant 30 jours est déconnecté et son relevé effacé. Les codes de confirmation : 10 minutes.</li>
      </ul>
      <H2>Vos droits</H2>
      <p>
        Vous pouvez télécharger toutes vos données ou supprimer votre compte depuis « Mon compte ». Pour toute autre
        demande (rectification, opposition, limitation) : <Mail />. Vous
        pouvez aussi saisir la CNIL (cnil.fr).
      </p>
      <H2>Cookies</H2>
      <p>
        Bailio n'utilise aucun cookie : ni publicité, ni mesure d'audience, ni service tiers chargé dans vos pages (les
        polices de caractères sont servies par notre propre site). Deux informations seulement sont gardées dans votre
        navigateur, sur votre appareil, parce que le service ne fonctionne pas sans elles : votre session de connexion et
        le brouillon du bail en cours. Aucun bandeau de consentement n'est donc nécessaire.
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
