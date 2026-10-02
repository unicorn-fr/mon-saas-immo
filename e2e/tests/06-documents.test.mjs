import assert from 'node:assert/strict'
import { test } from 'node:test'
import { API, api, completeLease, newAccount } from '../lib.mjs'

/** Documents officiels : la notice d'information suit le bail, le congé pour vendre porte sa notice et l'article 15. */
const pages = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length

async function pdf(path, { token, method = 'GET', body } = {}) {
  const r = await fetch(API + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const buf = Buffer.from(await r.arrayBuffer())
  return { status: r.status, type: r.headers.get('content-type'), buf, json: () => JSON.parse(buf.toString('utf8')) }
}

test('notice d’information : publique, et jointe au bail', async () => {
  const notice = await pdf('/notice-information.pdf')
  assert.equal(notice.status, 200)
  assert.match(notice.type, /pdf/)
  const n = pages(notice.buf)
  assert.ok(n >= 10, `notice trop courte (${n} pages)`)

  const { token } = await newAccount()
  const { leaseId } = await completeLease(token, { furnished: false })
  const lease = await pdf(`/leases/${leaseId}/lease.pdf`, { token })
  assert.equal(lease.status, 200)
  assert.ok(pages(lease.buf) >= n + 5, 'le bail contient la notice en annexe')
  const view = await api(`/leases/${leaseId}`, { token })
  assert.ok(view.annexes.some((a) => a.key === 'notice' && a.done))
})

test('congé pour vendre : notice jointe, prix et mentions obligatoires ; accusé de réception du congé du locataire', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token, { furnished: false })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const noPrice = await pdf(`/leases/${leaseId}/letters/preview`, { token, method: 'POST', body: { type: 'NOTICE_TO_LEAVE', reason: 'SALE', leaseEnd: '2029-10-05' } })
  assert.equal(noPrice.status, 400)
  assert.match(noPrice.json().message, /prix de vente/)
  const sale = await pdf(`/leases/${leaseId}/letters/preview`, { token, method: 'POST', body: { type: 'NOTICE_TO_LEAVE', reason: 'SALE', leaseEnd: '2029-10-05', priceCents: 24500000 } })
  assert.equal(sale.status, 200)
  assert.ok(pages(sale.buf) >= 6, 'la notice du congé est jointe')
  const resumption = await pdf(`/leases/${leaseId}/letters/preview`, { token, method: 'POST', body: { type: 'NOTICE_TO_LEAVE', reason: 'RESUMPTION', leaseEnd: '2029-10-05', justification: 'Ma fille vient étudier ici.' } })
  assert.equal(resumption.status, 400)

  const ack = await pdf(`/leases/${leaseId}/letters/preview`, { token, method: 'POST', body: { type: 'TENANT_NOTICE', receivedDate: '2026-11-03', reduced: true, reducedReason: 'logement situé en zone tendue' } })
  assert.equal(ack.status, 200)
  const defaults = await api(`/leases/${leaseId}/letters/defaults/TENANT_NOTICE`, { token })
  assert.equal(defaults.letter.reduced, true)
})
