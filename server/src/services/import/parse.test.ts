import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseLease } from './parse.js'
import { amountsIn, firstDate, fold, splitName, wordsToNumber } from './text.js'

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')

test('bail agence rédigé en phrases (vide, deux preneurs, caution en fin de bail)', () => {
  const x = parseLease(fixture('agence-vide.txt'))
  assert.equal(x.isLease, true)
  assert.equal(x.type, 'UNFURNISHED')
  assert.deepEqual(x.landlord, { firstName: 'Pierre', lastName: 'Durand', address: '45 boulevard des Belges, 69006 Lyon' })
  assert.deepEqual(x.tenants, [
    { firstName: 'Sophie', lastName: 'Lefebvre', email: 'sophie.lefebvre@gmail.com' },
    { firstName: 'Julien', lastName: 'Moreau', email: null },
  ])
  assert.deepEqual(x.guarantor, { firstName: 'Hélène', lastName: 'Lefebvre', address: '9 allée des Tilleuls 49000 Angers' })
  assert.deepEqual(x.property, { address: '18 rue Paul Bert, 69003 Lyon', surface: 64.2, rooms: 3, dpeClass: 'C' })
  // Le « loyer de référence majoré » (16,20 €/m²) ne doit pas être pris pour le loyer.
  assert.deepEqual(x.rent, { rentEuros: 1050, chargesEuros: 85, depositEuros: 1050, startDate: '2024-02-01', paymentDay: 1 })
})

test('bail étudiant meublé avec libellés en capitales et garant', () => {
  const x = parseLease(fixture('etudiant-meuble.txt'))
  assert.equal(x.type, 'FURNISHED')
  assert.deepEqual(x.landlord, { firstName: 'Claire', lastName: 'Roussel', address: '27, avenue Jean Médecin 06000 Nice' })
  assert.deepEqual(x.tenants, [{ firstName: 'Lucas', lastName: 'Petit', email: 'lucas.petit@etu.univ-cotedazur.fr' }])
  assert.deepEqual(x.guarantor, { firstName: 'Bernard', lastName: 'Petit', address: '14 chemin des Vignes 13100 Aix-en-Provence' })
  assert.deepEqual(x.property, { address: '5 rue de France, 06000 Nice', surface: 19, rooms: 1, dpeClass: 'E' })
  assert.deepEqual(x.rent, { rentEuros: 520, chargesEuros: 40, depositEuros: 1040, startDate: '2025-09-01', paymentDay: 5 })
})

test('texte réellement produit par la reconnaissance de caractères sur des photos (« m° », tirets, coupures)', () => {
  const x = parseLease(fixture('ocr-photos-vide.txt'))
  assert.equal(x.type, 'UNFURNISHED')
  assert.equal(x.landlord.lastName, 'Dupont')
  assert.equal(x.tenants.length, 2)
  assert.deepEqual(x.property, { address: '12 Rue de la Loge 34000 Montpellier', surface: 42.5, rooms: 2, dpeClass: 'D' })
  assert.deepEqual(x.rent, { rentEuros: 780, chargesEuros: 60, depositEuros: 780, startDate: '2026-10-01', paymentDay: 5 })
})

test('dépôt exprimé en mois de loyer, loyer annuel, jour de paiement en lettres', () => {
  const x = parseLease(`CONTRAT DE LOCATION
Entre Madame Anne LEROY, demeurant 3 place du Marché 35000 Rennes, ci-après dénommée le bailleur,
et Monsieur Hugo FAURE, ci-après dénommé le locataire.
Il a été convenu ce qui suit.
Le logement, un appartement T2 situé 7 rue Saint-Malo 35000 Rennes, est loué vide.
Le loyer annuel est de 7 800 euros, payable le dix de chaque mois.
Un dépôt de garantie correspondant à un mois de loyer hors charges est versé à la signature.
Le bail prend effet le 15/03/2025 pour une durée de trois ans.`)
  assert.equal(x.type, 'UNFURNISHED')
  assert.equal(x.landlord.lastName, 'Leroy')
  assert.equal(x.tenants[0].lastName, 'Faure')
  assert.equal(x.property.rooms, 2)
  assert.equal(x.property.address, '7 rue Saint-Malo 35000 Rennes')
  assert.equal(x.rent.rentEuros, 650)
  assert.equal(x.rent.depositEuros, 650)
  assert.equal(x.rent.paymentDay, 10)
  assert.equal(x.rent.startDate, '2025-03-15')
})

test("un document qui n'est pas un bail est reconnu comme tel", () => {
  assert.equal(parseLease('Facture EDF n° 1234. Montant à payer : 84,20 €. Échéance le 12/10/2026.').isLease, false)
})

test('montants : séparateurs, décimales, symbole, pas de confusion avec les articles de loi', () => {
  assert.deepEqual(amountsIn(fold('1 250,00 € et 1.250 EUR et 780€ puis 85 euros')).map((a) => a.value), [1250, 1250, 780, 85])
  assert.deepEqual(amountsIn(fold('loi n° 89-462, article 25')).length, 0)
})

test('dates : chiffres, lettres, abréviations et « 1er » mal lu', () => {
  assert.equal(firstDate(fold('le 1er octobre 2026'))?.iso, '2026-10-01')
  assert.equal(firstDate(fold('le ler févr. 2025'))?.iso, '2025-02-01')
  assert.equal(firstDate(fold('à compter du 01/09/25'))?.iso, '2025-09-01')
  assert.equal(firstDate(fold('le 31/02/2025')), null)
})

test('noms : capitales, ordre « Nom et prénom », prénoms composés', () => {
  assert.deepEqual(splitName('DUPONT Jean'), { firstName: 'Jean', lastName: 'Dupont' })
  assert.deepEqual(splitName('Marie-Claire LE GALL'), { firstName: 'Marie-Claire', lastName: 'Le Gall' })
  assert.deepEqual(splitName('Martin Sophie', true), { firstName: 'Sophie', lastName: 'Martin' })
  assert.deepEqual(splitName('Kevin Durand'), { firstName: 'Kevin', lastName: 'Durand' })
  assert.equal(splitName('le bailleur'), null)
})

test('nombres en lettres', () => {
  assert.equal(wordsToNumber('vingt-huit'), 28)
  assert.equal(wordsToNumber('trois'), 3)
  assert.equal(wordsToNumber('premier'), 1)
})
