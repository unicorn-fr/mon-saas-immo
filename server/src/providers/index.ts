/**
 * Services tiers derrière des interfaces interchangeables (PLAN.md, partie 7 ; étude : docs/strategie/fournisseurs-2026-11.md).
 *
 * Chaque besoin a une interface, une version simulée (développement, tests, démo : rien ne sort du serveur) et la liste
 * des variables à renseigner pour un vrai fournisseur. Le vrai fournisseur ne s'active que si son nom est choisi dans
 * `.env` (ex. BANK_PROVIDER=powens) ET que toutes ses variables sont présentes ; sinon, le mode simulé reste actif et
 * `/admin/providers` le dit. Aucune clé dans le code ni dans git.
 *
 * Les adaptateurs réels ne sont pas encore écrits : ils le seront avec la documentation du fournisseur retenu, une fois
 * le contrat signé par Enzo (aucun compte créé, aucune clé saisie). Tant qu'ils manquent, `realAdapters` est vide et
 * le choix d'un fournisseur est signalé comme « à brancher ».
 */
import type { BankTransaction } from '../domain/bankStatement.js'

export type ProviderKind = 'bank' | 'esign' | 'registered' | 'payment' | 'listing'

/** Banque (DSP2, lecture seule) : l'interface n'expose aucune opération d'écriture (ni virement, ni paiement). */
export interface BankProvider {
  readonly name: string
  /** Adresse où le propriétaire autorise la lecture de ses comptes chez sa banque (consentement DSP2, 180 jours). */
  connectUrl(userId: string, returnUrl: string): Promise<string>
  listAccounts(userId: string): Promise<Array<{ id: string; label: string; iban: string }>>
  listTransactions(userId: string, accountId: string, sinceIso: string): Promise<BankTransaction[]>
}

/** Signature électronique avancée ou simple, envoyée par le fournisseur. Bailio a aussi sa signature maison (esign). */
export interface ESignProvider {
  readonly name: string
  createRequest(input: { title: string; pdf: Buffer; signers: Array<{ name: string; email: string }> }): Promise<{ id: string; signUrls: string[] }>
  status(id: string): Promise<'PENDING' | 'SIGNED' | 'DECLINED' | 'EXPIRED'>
}

/** Lettre recommandée électronique (art. L100 du code des postes et des communications électroniques). */
export interface RegisteredMailProvider {
  readonly name: string
  send(input: { to: { name: string; email: string }; subject: string; pdf: Buffer }): Promise<{ id: string; costCents: number }>
  status(id: string): Promise<'SENT' | 'DELIVERED' | 'REFUSED' | 'NEGLECTED'>
}

/** Paiement de l'abonnement Bailio (pas les loyers : Bailio n'encaisse jamais l'argent des locataires). */
export interface PaymentProvider {
  readonly name: string
  checkoutUrl(input: { userId: string; email: string; units: number; period: 'MONTH' | 'YEAR'; returnUrl: string }): Promise<string>
  portalUrl(userId: string, returnUrl: string): Promise<string>
}

/** Diffusion d'annonces : réservée aux professionnels chez les portails (voir l'étude) ; par défaut, annonce à copier. */
export interface ListingProvider {
  readonly name: string
  publish(input: { propertyId: string; title: string; text: string; rentCents: number; photos: Buffer[] }): Promise<{ id: string; portals: string[] }>
  withdraw(id: string): Promise<void>
}

export interface ProviderMap {
  bank: BankProvider
  esign: ESignProvider
  registered: RegisteredMailProvider
  payment: PaymentProvider
  listing: ListingProvider
}

/** Fournisseurs étudiés et variables à renseigner dans `.env` sur le serveur pour les activer. */
export const PROVIDER_CATALOG: Record<ProviderKind, { envChoice: string; options: Record<string, { label: string; env: string[]; site: string }> }> = {
  bank: {
    envChoice: 'BANK_PROVIDER',
    options: {
      powens: { label: 'Powens (agréé ACPR)', env: ['POWENS_DOMAIN', 'POWENS_CLIENT_ID', 'POWENS_CLIENT_SECRET'], site: 'https://www.powens.com' },
      bridge: { label: 'Bridge (agréé ACPR)', env: ['BRIDGE_CLIENT_ID', 'BRIDGE_CLIENT_SECRET'], site: 'https://bridgeapi.io' },
    },
  },
  esign: {
    envChoice: 'ESIGN_PROVIDER',
    options: {
      docusign: { label: 'Docusign API', env: ['DOCUSIGN_ACCOUNT_ID', 'DOCUSIGN_INTEGRATION_KEY', 'DOCUSIGN_PRIVATE_KEY'], site: 'https://developers.docusign.com' },
      yousign: { label: 'Yousign', env: ['YOUSIGN_API_KEY'], site: 'https://developers.yousign.com' },
    },
  },
  registered: {
    envChoice: 'REGISTERED_PROVIDER',
    options: {
      ar24: { label: 'AR24', env: ['AR24_TOKEN', 'AR24_PRIVATE_KEY'], site: 'https://www.ar24.fr' },
    },
  },
  payment: {
    envChoice: 'PAYMENT_PROVIDER',
    options: {
      stripe: { label: 'Stripe Billing', env: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_MONTH', 'STRIPE_PRICE_YEAR'], site: 'https://stripe.com/fr' },
    },
  },
  listing: {
    envChoice: 'LISTING_PROVIDER',
    options: {},
  },
}

export type ProviderStatus = { kind: ProviderKind; mode: 'simulated' | 'real' | 'to_connect'; chosen: string | null; missing: string[] }

/** Adaptateurs réels disponibles (vide tant qu'aucun contrat n'est signé : voir l'en-tête). */
const realAdapters: Partial<{ [K in ProviderKind]: Record<string, (env: NodeJS.ProcessEnv) => ProviderMap[K]> }> = {}

export function providerStatus(kind: ProviderKind, env: NodeJS.ProcessEnv = process.env): ProviderStatus {
  const cat = PROVIDER_CATALOG[kind]
  const chosen = env[cat.envChoice]?.trim().toLowerCase() || null
  if (!chosen) return { kind, mode: 'simulated', chosen: null, missing: [] }
  const option = cat.options[chosen]
  if (!option) return { kind, mode: 'simulated', chosen, missing: [`${cat.envChoice} inconnu`] }
  const missing = option.env.filter((k) => !env[k])
  if (missing.length) return { kind, mode: 'simulated', chosen, missing }
  return { kind, mode: realAdapters[kind]?.[chosen] ? 'real' : 'to_connect', chosen, missing: [] }
}

export async function getProvider<K extends ProviderKind>(kind: K, env: NodeJS.ProcessEnv = process.env): Promise<ProviderMap[K]> {
  const st = providerStatus(kind, env)
  if (st.mode === 'real' && st.chosen) return (realAdapters[kind] as Record<string, (e: NodeJS.ProcessEnv) => ProviderMap[K]>)[st.chosen](env)
  const { simulated } = await import('./simulated.js')
  return simulated[kind] as ProviderMap[K]
}
