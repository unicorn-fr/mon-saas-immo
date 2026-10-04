import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseAmount, parseDate, parseStatement } from './bankStatement.js'
import { matchRents, nameInLabel, type ExpectedRent } from './rentMatch.js'

test('montants et dates des relevés français', () => {
  assert.equal(parseAmount('1 234,56'), 123456)
  assert.equal(parseAmount('-56,10 €'), -5610)
  assert.equal(parseAmount('+850,00'), 85000)
  assert.equal(parseAmount('1.234,56'), 123456)
  assert.equal(parseAmount('1,234.56'), 123456)
  assert.equal(parseAmount('560'), 56000)
  assert.equal(parseAmount('abc'), null)
  assert.equal(parseDate('05/10/2026'), '2026-10-05')
  assert.equal(parseDate('5-10-26'), '2026-10-05')
  assert.equal(parseDate('2026-10-05'), '2026-10-05')
  assert.equal(parseDate('20261005120000[0:GMT]'), '2026-10-05')
  assert.equal(parseDate('32/13/2026'), null)
})

test('CSV avec colonnes Débit et Crédit et lignes d’en-tête de la banque', () => {
  const csv = ['Compte courant n° 0000123;;;', 'Solde au 31/10/2026;1 234,00;;', '', 'Date opération;Date valeur;Libellé;Débit;Crédit', '04/10/2026;04/10/2026;VIR SEPA RECU /DE M LUCAS GARNIER /MOTIF LOYER OCT;;560,00', '06/10/2026;06/10/2026;PRLV SEPA EDF;45,20;'].join('\n')
  const tx = parseStatement(Buffer.from(csv, 'latin1'))
  assert.deepEqual(tx, [
    { date: '2026-10-04', amountCents: 56000, label: 'VIR SEPA RECU /DE M LUCAS GARNIER /MOTIF LOYER OCT' },
    { date: '2026-10-06', amountCents: -4520, label: 'PRLV SEPA EDF' },
  ])
})

test('CSV avec une colonne Montant signée, séparateur virgule et guillemets', () => {
  const csv = 'Date,Description,Amount\n"2026-10-03","Virement de Mme Claire Martin, loyer","650.00"\n"2026-10-05","Carte Monoprix","-23.10"'
  const tx = parseStatement(Buffer.from(csv))
  assert.equal(tx.length, 2)
  assert.equal(tx[0].amountCents, 65000)
  assert.equal(tx[0].label, 'Virement de Mme Claire Martin, loyer')
})

test('OFX', () => {
  const ofx = '<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST><STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261004<TRNAMT>560.00<NAME>VIR LUCAS GARNIER<MEMO>LOYER</STMTTRN><STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261006<TRNAMT>-45.20<NAME>EDF</STMTTRN></BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>'
  assert.deepEqual(parseStatement(Buffer.from(ofx)), [
    { date: '2026-10-04', amountCents: 56000, label: 'VIR LUCAS GARNIER LOYER' },
    { date: '2026-10-06', amountCents: -4520, label: 'EDF' },
  ])
})

test('fichier illisible : message clair', () => {
  assert.throws(() => parseStatement(Buffer.from('bonjour')), /CSV ou OFX/)
})

const exp = (over: Partial<ExpectedRent>): ExpectedRent => ({ leaseId: 'l1', label: 'Studio', names: ['Lucas Garnier'], period: '2026-10', dueDate: '2026-10-05', dueCents: 56000, ...over })

test('nom du locataire dans le libellé, sans les mots trop courts', () => {
  assert.equal(nameInLabel('VIR SEPA DE M. LUCAS GARNIER', ['Lucas Garnier']), true)
  assert.equal(nameInLabel('VIR SEPA GARNIERE SA', ['Lucas Garnier']), false)
  assert.equal(nameInLabel('VIR DE M LE', ['Jo Le']), false)
  assert.equal(nameInLabel('VIR CHLOÉ DUPRÉ', ['Chloe Dupre']), true)
})

test('rapprochement : sûr, probable, partiel, hors fenêtre, ambigu', () => {
  const tx = [
    { date: '2026-10-04', amountCents: 56000, label: 'VIR LUCAS GARNIER' },
    { date: '2026-10-06', amountCents: 70000, label: 'VIREMENT RECU' },
    { date: '2026-10-07', amountCents: 30000, label: 'VIR CLAIRE MARTIN' },
    { date: '2026-12-30', amountCents: 56000, label: 'VIR LUCAS GARNIER' },
    { date: '2026-10-08', amountCents: -56000, label: 'VIR LUCAS GARNIER' },
  ]
  const m = matchRents(tx, [
    exp({}),
    exp({ leaseId: 'l2', label: 'T2', names: ['Paul Roux'], dueCents: 70000 }),
    exp({ leaseId: 'l3', label: 'T3', names: ['Claire Martin'], dueCents: 65000 }),
  ])
  assert.deepEqual(
    m.map((x) => [x.leaseId, x.level, x.amountCents, x.partial]),
    [
      ['l1', 'SURE', 56000, false],
      ['l2', 'LIKELY', 70000, false],
      ['l3', 'CHECK', 30000, true],
    ],
  )
})

test('deux loyers du même montant sans nom : à vérifier ; un mois ne sert qu’une fois', () => {
  const m = matchRents([{ date: '2026-10-04', amountCents: 56000, label: 'VIREMENT RECU' }], [exp({}), exp({ leaseId: 'l2', names: ['Paul Roux'] })])
  assert.equal(m.length, 1)
  assert.equal(m[0].level, 'CHECK')
  const twice = matchRents(
    [
      { date: '2026-10-04', amountCents: 56000, label: 'VIR LUCAS GARNIER' },
      { date: '2026-10-05', amountCents: 56000, label: 'VIR LUCAS GARNIER' },
      { date: '2026-11-03', amountCents: 56000, label: 'VIR LUCAS GARNIER' },
    ],
    [exp({}), exp({ period: '2026-11', dueDate: '2026-11-05' })],
  )
  assert.deepEqual(twice.map((x) => [x.period, x.receivedAt]), [['2026-10', '2026-10-05'], ['2026-11', '2026-11-03']], 'le virement le plus proche de l’échéance')
})
