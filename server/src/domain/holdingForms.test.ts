import assert from 'node:assert/strict'
import { test } from 'node:test'
import { HOLDING_ORDER, HOLDING_RULES, holdingForm } from './holdingForms.js'

test('forme de détention : déduite de la structure (nature, régime, forme de la société)', () => {
  assert.equal(holdingForm({ kind: 'PERSON' }), 'PERSON')
  assert.equal(holdingForm({}), 'PERSON')
  assert.equal(holdingForm({ kind: 'COUPLE' }), 'COUPLE')
  assert.equal(holdingForm({ kind: 'SCI', taxRegime: 'IR' }), 'SCI_IR')
  assert.equal(holdingForm({ kind: 'SCI', taxRegime: 'IS' }), 'SCI_IS')
  assert.equal(holdingForm({ kind: 'COMPANY', companyForm: 'SARL de famille', taxRegime: 'IR' }), 'SARL_FAMILLE')
  assert.equal(holdingForm({ kind: 'COMPANY', companyForm: 'EURL', taxRegime: 'IR' }), 'EURL_IR')
  assert.equal(holdingForm({ kind: 'COMPANY', companyForm: 'SASU' }), 'COMPANY_IS')
  assert.equal(holdingForm({ kind: 'COMPANY', companyForm: 'SAS', taxRegime: 'IR' }), 'COMPANY_IR')
  assert.equal(holdingForm({ kind: 'COMPANY', companyForm: 'EURL', taxRegime: 'IS' }), 'COMPANY_IS')
})

test('micro seulement en nom propre, à plusieurs, ou en EURL sous conditions ; jamais à l’IS', () => {
  assert.deepEqual(HOLDING_ORDER.map((f) => [f, HOLDING_RULES[f].micro]), [['PERSON', 'YES'], ['COUPLE', 'YES'], ['SCI_IR', 'NO'], ['SCI_IS', 'NO'], ['SARL_FAMILLE', 'NO'], ['EURL_IR', 'CONDITIONS'], ['COMPANY_IS', 'NO']])
  for (const f of HOLDING_ORDER) if (HOLDING_RULES[f].tax === 'IS') assert.equal(HOLDING_RULES[f].micro, 'NO')
})
