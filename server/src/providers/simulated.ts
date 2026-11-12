/**
 * Versions simulées des services tiers : rien ne sort du serveur, données visiblement fictives (noms inventés,
 * IBAN de test FR76 3000 6000 0112 3456 7890 189, montants ronds). Utilisées en développement, dans les tests et par
 * défaut tant qu'aucun fournisseur n'est branché (providers/index.ts).
 */
import { createHash } from 'node:crypto'
import type { ProviderMap } from './index.js'

const id = (prefix: string, seed: string) => `${prefix}_sim_${createHash('sha256').update(seed).digest('hex').slice(0, 12)}`

export const simulated: ProviderMap = {
  bank: {
    name: 'Banque simulée',
    async connectUrl(_userId, returnUrl) {
      const u = new URL(returnUrl)
      u.searchParams.set('banque', 'simulee')
      return u.toString()
    },
    async listAccounts(userId) {
      return [{ id: id('acc', userId), label: 'Compte courant (exemple)', iban: 'FR76 3000 6000 0112 3456 7890 189' }]
    },
    async listTransactions(_userId, _accountId, sinceIso) {
      const d = new Date(`${sinceIso}T00:00:00Z`)
      const day = (n: number) => new Date(d.getTime() + n * 86_400_000).toISOString().slice(0, 10)
      return [
        { date: day(2), amountCents: 78000, label: 'VIR SEPA M. EXEMPLE LOCATAIRE LOYER' },
        { date: day(4), amountCents: -4590, label: 'PRLV ASSURANCE PNO EXEMPLE' },
        { date: day(6), amountCents: 52000, label: 'VIR MME FICTIVE LOYER' },
      ]
    },
  },
  esign: {
    name: 'Signature simulée',
    async createRequest({ title, signers }) {
      const rid = id('sig', title + signers.map((s) => s.email).join())
      return { id: rid, signUrls: signers.map((_, i) => `https://exemple.invalid/signature/${rid}/${i}`) }
    },
    async status() {
      return 'PENDING'
    },
  },
  registered: {
    name: 'Recommandé simulé',
    async send({ to, subject }) {
      return { id: id('lre', to.email + subject), costCents: 0 }
    },
    async status() {
      return 'SENT'
    },
  },
  payment: {
    name: 'Paiement simulé',
    async checkoutUrl({ returnUrl, units, period }) {
      const u = new URL(returnUrl)
      u.searchParams.set('paiement', `simule-${units}-${period.toLowerCase()}`)
      return u.toString()
    },
    async portalUrl(_userId, returnUrl) {
      return returnUrl
    },
  },
  listing: {
    name: 'Diffusion simulée',
    async publish({ propertyId }) {
      return { id: id('ad', propertyId), portals: [] }
    },
    async withdraw() {},
  },
}
