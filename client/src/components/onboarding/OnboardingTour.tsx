import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import type { DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import './onboarding.css'
import { useAuth } from '../../hooks/useAuth'

const OWNER_STEPS: DriveStep[] = [
  {
    popover: {
      title: 'Bienvenue sur Bailio 🏡',
      description: `<p>Ce guide interactif vous présente toutes les fonctionnalités disponibles étape par étape.</p>
<p style="margin-top:8px;color:#9e9b96;font-size:12px">Vous pouvez le passer maintenant et le relancer depuis <strong>Paramètres → Aide</strong> à tout moment.</p>`,
      showButtons: ['next', 'close'],
    },
  },
  {
    element: '#tour-owner-dashboard',
    popover: {
      title: 'Tableau de bord',
      description: `Votre centre de contrôle : retrouvez d'un coup d'œil vos biens actifs, les candidatures en attente de traitement, les loyers du mois en cours et les dernières activités de vos locataires. Tout est mis à jour en temps réel.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-properties',
    popover: {
      title: 'Mes biens',
      description: `Gérez l'intégralité de votre patrimoine locatif. Ajoutez un nouveau bien en moins de 10 minutes (photos, description, loyer, charges), publiez ou dépubliez une annonce, et suivez les statistiques de visibilité de chaque bien.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-applications',
    popover: {
      title: 'Candidatures',
      description: `Recevez et comparez les dossiers des candidats. Notre IA analyse automatiquement chaque pièce justificative (revenus, identité, historique) et génère un <strong>score de fiabilité</strong> sur 100. Vous acceptez ou refusez en un clic, le candidat est notifié instantanément.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-visits',
    popover: {
      title: 'Visites',
      description: `Planifiez les visites de vos biens directement depuis Bailio. Définissez vos créneaux de disponibilité une fois pour toutes, les locataires réservent en autonomie. Vous recevez une notification et un rappel automatique 24h avant chaque visite.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-contracts',
    popover: {
      title: 'Contrats de bail',
      description: `Rédigez des baux conformes à la <strong>loi ALUR</strong> grâce à notre assistant de rédaction guidé. Le contrat est pré-rempli avec les données du locataire. Signature électronique eIDAS pour les deux parties — aucune impression, aucun déplacement.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-quittances',
    popover: {
      title: 'Quittances de loyer',
      description: `Générez les quittances de loyer en un clic pour chaque mois. Le PDF est conforme à la loi et inclut toutes les mentions obligatoires. Il est automatiquement envoyé par email au locataire et archivé dans son espace personnel.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-messages',
    popover: {
      title: 'Messagerie',
      description: `Centralisez toutes vos communications avec vos locataires dans une boîte de dialogue sécurisée. Les messages sont horodatés et archivés — utile en cas de litige. Vous recevez une notification push ou email à chaque nouveau message.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-finances',
    popover: {
      title: 'Finances & Rentabilité',
      description: `Suivez vos flux financiers : loyers encaissés, charges, travaux, rentabilité nette par bien. Visualisez vos revenus mois par mois et exportez un rapport comptable pour faciliter votre déclaration fiscale (revenus fonciers, LMNP...).`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-subscription',
    popover: {
      title: 'Plan Pro — tout inclus',
      description: `Le plan gratuit vous permet de publier <strong>1 bien</strong>. Passez au <strong>Plan Pro à 9,90 €/mois</strong> pour débloquer : biens illimités, rédaction de bail ALUR, signature électronique eIDAS, quittances automatiques, analyse IA des dossiers, relances automatiques et bien plus.`,
      side: 'top',
      align: 'start',
    },
  },
]

const TENANT_STEPS: DriveStep[] = [
  {
    popover: {
      title: 'Bienvenue sur Bailio 🏡',
      description: `<p>Ce guide vous présente toutes les fonctionnalités à votre disposition pour trouver et gérer votre location.</p>
<p style="margin-top:8px;color:#9e9b96;font-size:12px">Vous pouvez le passer maintenant et le relancer depuis <strong>Paramètres → Aide</strong> à tout moment.</p>`,
      showButtons: ['next', 'close'],
    },
  },
  {
    element: '#tour-tenant-search',
    popover: {
      title: 'Rechercher un logement',
      description: `Parcourez toutes les annonces disponibles. Filtrez par ville, loyer maximum, surface, type de bien. Chaque annonce inclut les photos, le descriptif complet et les disponibilités de visite. Ajoutez vos coups de cœur en favoris pour les retrouver facilement.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-tenant-applications',
    popover: {
      title: 'Mes candidatures',
      description: `Suivez l'état de toutes vos candidatures en temps réel : <strong>en attente, acceptée ou refusée</strong>. Vous êtes notifié immédiatement à chaque changement de statut. Si vous êtes refusé, vous pouvez repostuler ou postuler à d'autres biens sans perdre votre dossier.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-tenant-dossier',
    popover: {
      title: 'Dossier locatif',
      description: `Constituez votre dossier <strong>une seule fois</strong> et réutilisez-le pour toutes vos candidatures. Uploadez pièce d'identité, bulletins de salaire, avis d'imposition. Notre IA vérifie l'authenticité des documents et calcule un score de solvabilité. Un dossier complet augmente considérablement vos chances.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-tenant-contracts',
    popover: {
      title: 'Mon contrat',
      description: `Consultez votre bail en ligne à tout moment. Lorsque le propriétaire vous envoie le contrat, vous recevez un email avec un lien pour le relire et le <strong>signer électroniquement</strong> (eIDAS) depuis n'importe quel appareil. Le PDF signé est archivé dans votre espace.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-tenant-payments',
    popover: {
      title: 'Paiements & Quittances',
      description: `Suivez l'historique de vos loyers mois par mois. Consultez les <strong>coordonnées bancaires de votre bailleur</strong> pour effectuer vos virements (IBAN, BIC, titulaire). Téléchargez vos quittances en PDF dès qu'elles sont disponibles — utile pour vos démarches administratives.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-tenant-messages',
    popover: {
      title: 'Messagerie',
      description: `Échangez directement avec votre propriétaire de manière sécurisée. Toutes les conversations sont conservées et horodatées — un avantage en cas de litige. Vous recevez une notification à chaque nouveau message.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-tenant-settings',
    popover: {
      title: 'Paramètres & Compte bancaire',
      description: `Complétez votre profil et renseignez vos <strong>coordonnées bancaires (IBAN/BIC)</strong> dans l'onglet "Compte bancaire". Votre bailleur pourra ainsi vous rembourser le dépôt de garantie à la fin du bail sans échange d'informations supplémentaires.`,
      side: 'right',
      align: 'start',
    },
  },
]

const TOUR_KEY = (userId: string) => `bailio_tour_done_v1_${userId}`

export function startTour(userId: string, _role?: 'OWNER' | 'TENANT') {
  localStorage.removeItem(TOUR_KEY(userId))
  window.location.reload()
}

export default function OnboardingTour({ role }: { role: 'OWNER' | 'TENANT' }) {
  const { user } = useAuth()
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)

  useEffect(() => {
    if (!user) return
    const key = TOUR_KEY(user.id)
    if (localStorage.getItem(key)) return

    const timer = setTimeout(() => {
      const steps = role === 'OWNER' ? OWNER_STEPS : TENANT_STEPS

      driverRef.current = driver({
        showProgress: true,
        progressText: 'Étape {{current}} sur {{total}}',
        steps,
        nextBtnText: 'Suivant →',
        prevBtnText: '← Précédent',
        doneBtnText: '✓ Terminer',
        // closeBtnText not supported in this version — close button uses driver default
        showButtons: ['next', 'previous', 'close'],
        allowClose: true,
        overlayOpacity: 0.6,
        smoothScroll: true,
        popoverClass: 'bailio-popover',
        onDestroyStarted: () => {
          localStorage.setItem(key, '1')
          driverRef.current?.destroy()
        },
      })

      driverRef.current.drive()
    }, 900)

    return () => clearTimeout(timer)
  }, [user, role])

  return null
}
