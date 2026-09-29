import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { SimplePage } from '../../components/SiteChrome'

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 style={{ margin: '36px 0 12px', fontSize: 20, fontWeight: 700, color: BAI.ink }}>{children}</h2>
)
const Todo = ({ children }: { children: ReactNode }) => <mark style={{ background: BAI.caramelLight, color: BAI.caramelDark, padding: '0 4px' }}>{children}</mark>

export function MentionsLegales() {
  return (
    <SimplePage title="Mentions légales">
      <H2>Éditeur du site</H2>
      <p>
        Le site bailio.fr est édité par <Todo>[dénomination et forme juridique]</Todo>, <Todo>[adresse du siège]</Todo>,
        immatriculée sous le numéro <Todo>[SIREN]</Todo>. Directeur de la publication : Enzo Mercier.
        Contact : <a href="mailto:contact@bailio.fr">contact@bailio.fr</a>.
      </p>
      <H2>Hébergement</H2>
      <p>
        Site : Vercel Inc. (États-Unis). Application et base de données : Railway Corporation (États-Unis).
        Emails : Resend (États-Unis). <Todo>[adresses postales des hébergeurs à compléter]</Todo>
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
      <p>En vigueur au 29 septembre 2026.</p>
      <H2>1. Le service</H2>
      <p>
        Bailio aide les propriétaires bailleurs particuliers à préparer leurs baux d'habitation (location vide ou meublée,
        résidence principale), leurs quittances et à suivre les échéances de leurs locations.
      </p>
      <H2>2. Votre compte</H2>
      <p>
        Votre espace est créé avec votre adresse email. La connexion se fait par un lien envoyé par email ou avec Google.
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
        Lorsque vous importez un bail, son contenu est lu par un service d'intelligence artificielle pour remplir les
        informations à votre place. Vous vérifiez toujours le résultat avant de l'enregistrer.
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
        <li>Votre email, votre nom et votre adresse ;</li>
        <li>Les informations de vos logements et de vos baux : noms et emails des locataires et du garant, loyers, dates ;</li>
        <li>Les documents que vous importez (bail signé).</li>
      </ul>
      <p>Nous ne demandons jamais de pièces que la loi interdit d'exiger d'un locataire.</p>
      <H2>Pourquoi</H2>
      <p>Uniquement pour préparer vos documents et vous rappeler vos échéances (exécution du service). Nous ne revendons aucune donnée et n'affichons aucune publicité.</p>
      <H2>Qui y a accès</H2>
      <p>
        Vous seul. Nos prestataires techniques traitent les données pour notre compte : Vercel et Railway (hébergement),
        Resend (envoi des emails), Google (si vous vous connectez avec Google) et Anthropic (lecture automatique des baux
        importés, uniquement lorsque vous l'utilisez). Ces prestataires sont situés aux États-Unis ; les transferts sont
        encadrés par les clauses contractuelles types de la Commission européenne.
      </p>
      <H2>Combien de temps</H2>
      <ul>
        <li>Un bail commencé sans compte : 30 jours, puis il est effacé ;</li>
        <li>Votre compte et vos documents : tant que vous gardez votre compte.</li>
      </ul>
      <H2>Vos droits</H2>
      <p>
        Vous pouvez télécharger toutes vos données ou supprimer votre compte depuis « Mon compte ». Pour toute autre
        demande (rectification, opposition, limitation) : <a href="mailto:contact@bailio.fr">contact@bailio.fr</a>. Vous
        pouvez aussi saisir la CNIL (cnil.fr).
      </p>
      <H2>Cookies</H2>
      <p>Bailio n'utilise pas de cookie publicitaire ni de mesure d'audience. Votre session est gardée dans votre navigateur, sur votre appareil.</p>
    </SimplePage>
  )
}

export function Contact() {
  return (
    <SimplePage title="Contact">
      <p>
        Une question, un souci avec un document ? Écrivez-nous à <a href="mailto:contact@bailio.fr">contact@bailio.fr</a>.
        Nous répondons sous deux jours ouvrés.
      </p>
      <p>
        Bailio a été fondé à Montpellier par <a href="https://enzomercier.fr">Enzo Mercier</a>.
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
