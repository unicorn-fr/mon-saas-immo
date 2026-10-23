// Données de test de l'audit, créées sur l'API LOCALE (jamais la production) : un propriétaire avec un bail signé,
// un bail en signature, un dossier locataire à compléter, une annonce avec candidat, une invitation, et un compte vide.
// Écrit tests/audit/resultats/seed.json. Usage : node tests/audit/seed.mjs
import fs from 'node:fs'
import { API, BASE, RESULTS, api, completeLease, fromLog, logSize, newAccount, pw, signAs } from './lib.mjs'

if (!/localhost|127\.0\.0\.1/.test(API) || !/localhost|127\.0\.0\.1/.test(BASE)) throw new Error('L’audit ne tourne que sur une API et un site locaux.')

const toBase = (u) => u.replace(/^https?:\/\/[^/]+/, BASE)
// L'INSEE n'est pas joignable depuis l'environnement de test : l'IRL de référence est indiqué à la main (valeur de test).
const IRL = { revision: { enabled: true, irlQuarter: '2026-Q2', irlValue: 146.68 } }
const fullLease = async (opts) => {
  const l = await completeLease(token, opts)
  await api(`/leases/${l.leaseId}/terms`, { method: 'PUT', token, body: IRL })
  return l
}
const owner = await newAccount()
const { token } = owner

// 1. Bail complet, signé en ligne par le locataire, le garant et le propriétaire.
const signed = await fullLease({ furnished: true })
let before = logSize()
const esign = await api(`/leases/${signed.leaseId}/esign`, { method: 'POST', token })
const links = await fromLog(/Relire et signer : (http:\/\/[^\s]+\/signer\/[^\s]+)/g, before)
const browser = await pw.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
for (const [, url] of links) await signAs(browser, toBase(url))
await signAs(browser, BASE + esign.landlordUrl)
const lease = await api(`/leases/${signed.leaseId}`, { token })
if (lease.status !== 'ACTIVE') throw new Error(`Bail non signé (${lease.status})`)

// Lien du locataire, état des lieux d'entrée, loyer reçu, dépense, contact.
const link = await api(`/leases/${signed.leaseId}/tenant-link`, { method: 'POST', token, body: { open: true } })
const tenantCode = link.code ?? link.url?.split('/').pop()
const inventory = await api(`/leases/${signed.leaseId}/inventories`, { method: 'POST', token, body: { kind: 'ENTRY' } })
await api('/expenses', { method: 'POST', token, body: { propertyId: signed.propertyId, vendor: 'Plomberie Martin', amountCents: 12000, date: '2026-10-10', category: 'REPAIR', description: 'Fuite sous l’évier' } }).catch((e) => console.warn('dépense', e.message))
await api('/contacts', { method: 'POST', token, body: { kind: 'ARTISAN', name: 'Plomberie Martin', trade: 'Plombier', phone: '04 67 00 00 00', email: 'plombier@example.fr' } }).catch((e) => console.warn('contact', e.message))

// 2. Deuxième bail, en signature : le lien du locataire reste ouvert (page /signer/:jeton).
const pending = await fullLease({ furnished: false })
before = logSize()
await api(`/leases/${pending.leaseId}/esign`, { method: 'POST', token })
const [[, signUrl]] = await fromLog(/Relire et signer : (http:\/\/[^\s]+\/signer\/[^\s]+)/g, before)

// 3. Locataire dont le dossier est à compléter (lien /dossier/:code).
const t2 = await api('/tenants', { method: 'POST', token, body: { propertyId: pending.propertyId, email: `dossier+${Date.now()}@example.fr` } })
const request = await api(`/tenants/${t2.id}/request`, { method: 'POST', token, body: { send: false } })

// 4. Annonce : lien de candidature et un candidat.
const apply = await api(`/properties/${pending.propertyId}/apply-link`, { method: 'POST', token, body: { open: true } })
await api(`/candidature/${apply.applyCode}`, { method: 'POST', body: { civility: 'MADAME', firstNames: 'Inès', lastName: 'Morel', email: 'ines.morel@example.fr', situation: 'EMPLOYEE', monthlyIncomeCents: 260000, occupants: 1, guarantee: 'VISALE', moveInDate: '2026-11-15', consent: true } })

// 5. Invitation d'un associé (lien /invitation/:jeton, lu dans le journal).
before = logSize()
await api('/access', { method: 'POST', token, body: { email: `associe+${Date.now()}@example.fr`, role: 'ASSOCIATE', propertyIds: [signed.propertyId] } })
const [[, invite]] = await fromLog(/invitation\/([^\s)"]+)/g, before)

// 6. Compte vide (états « rien encore »).
const empty = await newAccount()

await browser.close()
const seed = {
  createdAt: new Date().toISOString(),
  owner: { email: owner.email, token },
  empty: { email: empty.email, token: empty.token },
  propertyId: signed.propertyId,
  tenantId: signed.tenantId,
  leaseId: signed.leaseId,
  inventoryId: inventory.id,
  pendingLeaseId: pending.leaseId,
  pendingPropertyId: pending.propertyId,
  dossierTenantId: t2.id,
  public: {
    locataire: `/locataire/${tenantCode}`,
    dossier: new URL(request.url).pathname,
    candidature: `/candidature/${apply.applyCode}`,
    signer: new URL(signUrl).pathname,
    invitation: `/invitation/${invite}`,
  },
}
fs.writeFileSync(`${RESULTS}seed.json`, JSON.stringify(seed, null, 1))
console.log(JSON.stringify(seed.public, null, 1))
