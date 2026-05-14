import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import type { DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import './onboarding.css'
import { useAuth } from '../../hooks/useAuth'

const OWNER_STEPS: DriveStep[] = [
  {
    popover: {
      title: 'Bienvenue sur Bailio',
      description: 'En quelques étapes, découvrez comment gérer vos locations sereinement. Vous pouvez ignorer ce guide à tout moment.',
      showButtons: ['next', 'close'],
    },
  },
  {
    element: '#tour-owner-dashboard',
    popover: {
      title: 'Tableau de bord',
      description: "Votre vue d'ensemble : biens actifs, candidatures en attente, loyers du mois et activité récente.",
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-properties',
    popover: {
      title: 'Mes biens',
      description: 'Ajoutez et gérez vos propriétés. Publiez une annonce en quelques clics avec photos, description et loyer.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-applications',
    popover: {
      title: 'Candidatures',
      description: "Recevez les dossiers des locataires. L'IA analyse automatiquement chaque dossier et calcule un score de fiabilité.",
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-visits',
    popover: {
      title: 'Visites',
      description: 'Planifiez et gérez vos visites directement depuis la plateforme. Les locataires reçoivent une confirmation automatique.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-contracts',
    popover: {
      title: 'Contrats',
      description: 'Rédigez des baux conformes à la loi ALUR. Faites signer électroniquement propriétaire et locataire sans impression.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-quittances',
    popover: {
      title: 'Quittances de loyer',
      description: 'Générez les quittances en un clic chaque mois. Le PDF est automatiquement envoyé au locataire par email.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-messages',
    popover: {
      title: 'Messagerie',
      description: 'Communiquez en toute sérénité avec vos locataires. Toutes les conversations sont archivées et horodatées.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-finances',
    popover: {
      title: 'Finances & Rentabilité',
      description: 'Suivez vos revenus locatifs, calculez votre rentabilité et préparez votre déclaration fiscale.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-owner-subscription',
    popover: {
      title: 'Passez au plan Pro',
      description: 'Le plan gratuit vous permet de publier 1 bien. Avec le plan Pro (9,90 €/mois) : biens illimités, bail ALUR, signature électronique et bien plus.',
      side: 'top',
      align: 'start',
    },
  },
]

const TENANT_STEPS: DriveStep[] = [
  {
    popover: {
      title: 'Bienvenue sur Bailio',
      description: 'Votre plateforme pour trouver et gérer votre location en toute simplicité. Voici un guide rapide.',
      showButtons: ['next', 'close'],
    },
  },
  {
    element: '#tour-tenant-search',
    popover: {
      title: 'Rechercher un logement',
      description: 'Parcourez les biens disponibles, filtrez par ville, loyer, surface. Contactez directement le propriétaire.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-tenant-applications',
    popover: {
      title: 'Mes candidatures',
      description: "Suivez l'état de vos candidatures en temps réel : en attente, acceptée ou refusée. Vous êtes notifié à chaque changement.",
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-tenant-dossier',
    popover: {
      title: 'Dossier locatif',
      description: "Constituez votre dossier une seule fois : pièce d'identité, bulletins de salaire, avis d'imposition. Plus votre dossier est complet, plus vous avez de chances.",
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-tenant-contracts',
    popover: {
      title: 'Mon contrat',
      description: 'Consultez et signez votre bail électroniquement. Toutes vos pièces contractuelles sont archivées ici.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-tenant-payments',
    popover: {
      title: 'Paiements & Quittances',
      description: 'Suivez vos loyers mois par mois. Téléchargez vos quittances en PDF et consultez les coordonnées bancaires de votre bailleur pour vos virements.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-tenant-messages',
    popover: {
      title: 'Messagerie',
      description: 'Échangez directement avec votre bailleur. Toutes vos communications sont conservées et datées.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-tenant-settings',
    popover: {
      title: 'Paramètres & Compte bancaire',
      description: 'Renseignez vos coordonnées bancaires (IBAN/BIC) pour que votre bailleur puisse vous rembourser le dépôt de garantie facilement.',
      side: 'right',
      align: 'start',
    },
  },
]

export default function OnboardingTour({ role }: { role: 'OWNER' | 'TENANT' }) {
  const { user } = useAuth()
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)

  useEffect(() => {
    if (!user) return
    const key = `bailio_tour_done_v1_${user.id}`
    if (localStorage.getItem(key)) return

    // Small delay so DOM is ready
    const timer = setTimeout(() => {
      const steps = role === 'OWNER' ? OWNER_STEPS : TENANT_STEPS

      driverRef.current = driver({
        showProgress: true,
        progressText: '{{current}} / {{total}}',
        steps,
        nextBtnText: 'Suivant →',
        prevBtnText: '← Précédent',
        doneBtnText: 'Terminer',
        showButtons: ['next', 'previous', 'close'],
        allowClose: true,
        overlayOpacity: 0.55,
        smoothScroll: true,
        onDestroyStarted: () => {
          localStorage.setItem(key, '1')
          driverRef.current?.destroy()
        },
      })

      driverRef.current.drive()
    }, 800)

    return () => clearTimeout(timer)
  }, [user, role])

  return null
}
