import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readPhone } from './contact.js'

test('numéro lu comme on le tape', () => {
  assert.deepEqual(readPhone('06 12 34 56 78'), { display: '06 12 34 56 78', tel: 'tel:+33612345678' })
  assert.deepEqual(readPhone('0612345678'), { display: '06 12 34 56 78', tel: 'tel:+33612345678' })
  assert.deepEqual(readPhone('+33 6.12.34.56.78'), { display: '06 12 34 56 78', tel: 'tel:+33612345678' })
  assert.deepEqual(readPhone('0033612345678'), { display: '06 12 34 56 78', tel: 'tel:+33612345678' })
  assert.deepEqual(readPhone('+33 (0)6 12 34 56 78'), { display: '06 12 34 56 78', tel: 'tel:+33612345678' })
  assert.deepEqual(readPhone('0033 06 12 34 56 78'), { display: '06 12 34 56 78', tel: 'tel:+33612345678' })
  assert.deepEqual(readPhone('+44 7700 900123'), { display: '+447700900123', tel: 'tel:+447700900123' })
})

test('ce qui n’est pas un numéro est refusé', () => {
  for (const bad of ['', '123', '06 12 34', 'appelez-moi', '0012', '+33 6 12', '06 12 34 56 78 90']) assert.equal(readPhone(bad), null, bad)
})
