import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getProvider, providerStatus } from './index.js'

describe('services tiers interchangeables', () => {
  it('simulé par défaut, sans rien dans .env', async () => {
    assert.deepEqual(providerStatus('bank', {}), { kind: 'bank', mode: 'simulated', chosen: null, missing: [] })
    const bank = await getProvider('bank', {})
    assert.equal(bank.name, 'Banque simulée')
    const tx = await bank.listTransactions('u1', 'a1', '2026-11-01')
    assert.deepEqual(tx[0], { date: '2026-11-03', amountCents: 78000, label: 'VIR SEPA M. EXEMPLE LOCATAIRE LOYER' })
  })
  it('la banque ne propose que la lecture', async () => {
    const bank = await getProvider('bank', {})
    assert.deepEqual(Object.keys(bank).sort(), ['connectUrl', 'listAccounts', 'listTransactions', 'name'])
  })
  it('fournisseur choisi mais clés manquantes : reste simulé et nomme ce qui manque', () => {
    assert.deepEqual(providerStatus('bank', { BANK_PROVIDER: 'powens', POWENS_DOMAIN: 'x' }), { kind: 'bank', mode: 'simulated', chosen: 'powens', missing: ['POWENS_CLIENT_ID', 'POWENS_CLIENT_SECRET'] })
    assert.deepEqual(providerStatus('payment', { PAYMENT_PROVIDER: 'inconnu' }).missing, ['PAYMENT_PROVIDER inconnu'])
  })
  it('clés présentes mais adaptateur pas encore écrit : « à brancher », toujours simulé', async () => {
    const env = { REGISTERED_PROVIDER: 'ar24', AR24_TOKEN: 't', AR24_PRIVATE_KEY: 'k' }
    assert.equal(providerStatus('registered', env).mode, 'to_connect')
    assert.equal((await getProvider('registered', env)).name, 'Recommandé simulé')
  })
  it('paiement simulé : retour sur Bailio, sans prestataire', async () => {
    const pay = await getProvider('payment', {})
    assert.equal(await pay.checkoutUrl({ userId: 'u', email: 'a@exemple.fr', units: 3, period: 'YEAR', returnUrl: 'https://bailio.fr/espace/compte' }), 'https://bailio.fr/espace/compte?paiement=simule-3-year')
  })
})
