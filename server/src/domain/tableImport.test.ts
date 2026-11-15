import assert from 'node:assert/strict'
import { test } from 'node:test'
import { strToU8, zipSync } from 'fflate'
import { currentTermEnd, excelDate, leasePlan, parseTable, splitName } from './tableImport.js'

const QALIMO = [
  'Nom du bien;Adresse;Code postal;Ville;Type;Surface (m²);Pièces;Loyer HC;Charges;Dépôt de garantie;Jour de paiement;Date d\'entrée;Locataire;Email;Téléphone;Référence interne',
  'Studio Foch;12 rue Foch;69003;Lyon;Meublé;21,5;1;"1 234,50 €";60,00;"2 469,00 €";5;06/10/2026;DUPONT Jean;jean.dupont@exemple.fr;612345678;A1',
  'Garage Foch;12 rue Foch;69003;Lyon;Garage;;;90;;90;1;2026-10-06;Claire Martin;;06 11 22 33 44;A2',
  'T2 Vieux Port;8 quai du Port;13002;Marseille;Vide;42;2;abc;;;;;;;;A3',
  ';;;;;;;;;;;;;;;',
  'Studio Foch;12 rue Foch;69003;Lyon;Meublé;;;;;;;;Mme Léa Roux;lea@exemple.fr;;A4',
  ';Rue sans nom;;;;;;1000;;;;;;;;',
].join('\n')

test('export « à la Qalimo » : en-têtes français, point-virgule, montants et dates', () => {
  const { rows, columns } = parseTable(Buffer.from(QALIMO))
  assert.equal(rows.length, 4)
  const [studio, garage, t2] = rows
  assert.equal(studio.line, 2)
  assert.deepEqual(studio.property, {
    label: 'Studio Foch',
    address: '12 rue Foch',
    postalCode: '69003',
    city: 'Lyon',
    kind: 'MEUBLE',
    surface: 21.5,
    rooms: 1,
    rentCents: 123450,
    chargesCents: 6000,
    depositCents: 246900,
    paymentDay: 5,
  })
  assert.deepEqual(studio.tenants[0], { lastName: 'DUPONT', firstNames: 'Jean', email: 'jean.dupont@exemple.fr', phone: '0612345678', entryDate: '2026-10-06' })
  assert.deepEqual(studio.issues, [])
  assert.equal(garage.property.kind, 'PARKING')
  assert.equal(garage.property.parkingType, 'GARAGE')
  assert.deepEqual(garage.tenants[0], { firstNames: 'Claire', lastName: 'Martin', phone: '06 11 22 33 44', entryDate: '2026-10-06' })
  assert.equal(t2.property.rentCents, undefined)
  assert.deepEqual(t2.issues, ['loyer illisible'])
  assert.equal(t2.blocking, false)
  assert.equal(t2.tenants.length, 0)
  // Colonne inconnue ignorée, colonnes reconnues nommées.
  assert.deepEqual(columns.ignored, ['Référence interne'])
  assert.ok(columns.detected.some((c) => c.header === 'Loyer HC' && c.field === 'rent'))
})

test('lignes de même adresse et même libellé regroupées, locataires ajoutés', () => {
  const csv = ['Libellé;Adresse;Loyer;Nom;Prénom', 'Appt 3;5 rue A;700;Haddad;Karim', 'Appt 3;5 RUE A;;Haddad;Sara', 'Appt 3;5 rue A;;Haddad;Karim', 'Appt 4;5 rue A;650;;'].join('\n')
  const { rows } = parseTable(Buffer.from(csv))
  assert.equal(rows.length, 2)
  assert.deepEqual(rows[0].lines, [2, 3, 4])
  assert.equal(rows[0].property.rentCents, 70000)
  assert.deepEqual(rows[0].tenants.map((t) => t.firstNames), ['Karim', 'Sara'])
  assert.equal(rows[1].property.label, 'Appt 4')
})

test('adresse manquante : problème bloquant ; adresse avec code postal et ville', () => {
  const csv = ['Adresse,Loyer,Email', ',500,a@b.fr', '"12 rue Foch, 69003 Lyon",500,pas-un-email'].join('\n')
  const { rows } = parseTable(Buffer.from(csv))
  assert.deepEqual(rows[0].issues, ['adresse manquante'])
  assert.equal(rows[0].blocking, true)
  assert.deepEqual([rows[1].property.address, rows[1].property.postalCode, rows[1].property.city], ['12 rue Foch', '69003', 'Lyon'])
  assert.deepEqual(rows[1].issues, ['email illisible'])
  assert.equal(rows[1].blocking, false)
})

test('CSV en Windows-1252 avec BOM absent, tabulation et guillemets', () => {
  const csv = 'Adresse\tVille\tLoyer mensuel\tLocataire\n"3 rue de l\'Étoile"\tNîmes\t"850,00"\t"M. Élie Dupré"'
  const { rows } = parseTable(Buffer.from(csv, 'latin1'))
  assert.equal(rows[0].property.address, '3 rue de l’Étoile'.replace('’', "'"))
  assert.equal(rows[0].property.city, 'Nîmes')
  assert.equal(rows[0].property.rentCents, 85000)
  assert.deepEqual([rows[0].tenants[0].firstNames, rows[0].tenants[0].lastName], ['Élie', 'Dupré'])
  const bom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('Adresse,Surface\n1 rue X,30 m2')])
  assert.equal(parseTable(bom).rows[0].property.surface, 30)
})

test('lignes de titre avant les intitulés, fichier sans colonnes reconnues', () => {
  const csv = ['Export du 09/11/2026;;', ';;', 'Bien;Loyer;Locataire', '2 rue Y;500;Paul Durand'].join('\n')
  const { rows } = parseTable(Buffer.from(csv))
  assert.equal(rows[0].line, 4)
  assert.equal(rows[0].property.address, '2 rue Y')
  assert.throws(() => parseTable(Buffer.from('foo;bar\n1;2')), /Colonnes non reconnues/)
})

test('plus de 200 lignes refusé', () => {
  const csv = ['Adresse;Loyer', ...Array.from({ length: 201 }, (_, i) => `${i} rue Z;500`)].join('\n')
  assert.throws(() => parseTable(Buffer.from(csv)), /200 lignes/)
})

/** Petit classeur XLSX : chaînes partagées, nombres, date (style 1 = jj/mm/aaaa). */
function xlsx(rows: Array<Array<string | number | { date: number }>>): Buffer {
  const shared: string[] = []
  const col = (i: number) => String.fromCharCode(65 + i)
  const sheetRows = rows
    .map((r, y) => {
      const cells = r
        .map((v, x) => {
          const ref = `${col(x)}${y + 1}`
          if (typeof v === 'number') return `<c r="${ref}"><v>${v}</v></c>`
          if (typeof v === 'object') return `<c r="${ref}" s="1"><v>${v.date}</v></c>`
          shared.push(v)
          return `<c r="${ref}" t="s"><v>${shared.length - 1}</v></c>`
        })
        .join('')
      return `<row r="${y + 1}">${cells}</row>`
    })
    .join('')
  const files = {
    'xl/workbook.xml': strToU8('<workbook xmlns:r="r"><sheets><sheet name="Biens" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    'xl/_rels/workbook.xml.rels': strToU8('<Relationships><Relationship Id="rId1" Type="x" Target="worksheets/sheet1.xml"/></Relationships>'),
    'xl/sharedStrings.xml': strToU8(`<sst>${shared.map((s) => `<si><t>${s.replace(/&/g, '&amp;')}</t></si>`).join('')}</sst>`),
    'xl/styles.xml': strToU8('<styleSheet><cellXfs count="2"><xf numFmtId="0"/><xf numFmtId="14" applyNumberFormat="1"/></cellXfs></styleSheet>'),
    'xl/worksheets/sheet1.xml': strToU8(`<worksheet><sheetData>${sheetRows}</sheetData></worksheet>`),
  }
  return Buffer.from(zipSync(files))
}

test('XLSX : nombres, date Excel et textes', () => {
  const file = xlsx([
    ['Adresse', 'Code postal', 'Loyer HC', 'Provisions', 'Date d’entrée', 'Nom du locataire', 'Prénom du locataire', 'Mobile', 'Commentaire'],
    ['4 rue Dupont & fils', 6000, 735.5, 40, { date: 46301 }, 'Roux', 'Léa', 612345678, 'ok'],
  ])
  const { rows, columns } = parseTable(file)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].line, 2)
  assert.equal(rows[0].property.address, '4 rue Dupont & fils')
  assert.equal(rows[0].property.postalCode, '06000')
  assert.equal(rows[0].property.rentCents, 73550)
  assert.equal(rows[0].property.chargesCents, 4000)
  assert.deepEqual(rows[0].tenants[0], { lastName: 'Roux', firstNames: 'Léa', phone: '0612345678', entryDate: '2026-10-06' })
  assert.deepEqual(columns.ignored, ['Commentaire'])
  assert.deepEqual(rows[0].issues, [])
})

test('date Excel et nom complet', () => {
  assert.equal(excelDate(46301), '2026-10-06')
  assert.deepEqual(splitName('DUPONT Jean-Pierre'), { lastName: 'DUPONT', firstNames: 'Jean-Pierre' })
  assert.deepEqual(splitName('Mme Claire Martin'), { firstNames: 'Claire', lastName: 'Martin' })
  assert.deepEqual(splitName('Martin'), { lastName: 'Martin' })
})

test('ancien format .xls refusé avec un message clair', () => {
  assert.throws(() => parseTable(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0, 0, 0, 0])), /\.xlsx ou en CSV/)
})

test('« Bien » et « Adresse » : l’adresse gagne, « Bien » devient le nom du bien', () => {
  const p = parseTable(Buffer.from('Bien;Adresse;Code postal;Ville;Loyer HC\nT2 Croix-Rousse;12 rue des Lilas;69004;Lyon;780'))
  assert.equal(p.rows[0].property.address, '12 rue des Lilas')
  assert.equal(p.rows[0].property.label, 'T2 Croix-Rousse')
  assert.ok(!p.columns.ignored.includes('Adresse'))
})

test('« Nom, Prénom », colocataires dans une même case, DPE et jour 31 signalé', () => {
  assert.deepEqual(splitName('Leroy, Tom'), { lastName: 'Leroy', firstNames: 'Tom' })
  const p = parseTable(Buffer.from('Adresse;Locataire;Email;Classe DPE;GES;Jour d’échéance\n27 avenue de Toulouse;Paul Girard et Nora Benali;paul@example.fr;C;D;31'))
  const r = p.rows[0]
  assert.equal(r.tenants.length, 2)
  assert.deepEqual([r.tenants[0].firstNames, r.tenants[0].lastName, r.tenants[0].email], ['Paul', 'Girard', 'paul@example.fr'])
  assert.deepEqual([r.tenants[1].firstNames, r.tenants[1].lastName, r.tenants[1].email], ['Nora', 'Benali', undefined])
  assert.equal(r.property.dpeClass, 'C')
  assert.equal(r.property.gesClass, 'D')
  assert.equal(r.property.paymentDay, undefined)
  assert.ok(r.issues.some((i) => i.includes('jour de paiement 31')))
})

test('bail en cours : repris avec locataire, date d’entrée et loyer ; fin passée ou loyer manquant écartés', () => {
  const p = parseTable(Buffer.from('Adresse;Locataire;Loyer;Date d’entrée;Date de fin du bail\n1 rue A;Jean Roux;700;15/03/2020;\n2 rue B;Léa Bon;650;01/09/2019;31/08/2022\n3 rue C;Tom Gris;;01/01/2024;\n4 rue D;;500;01/01/2024;'))
  assert.equal(p.columns.detected.find((c) => c.field === 'leaseEnd')?.header, 'Date de fin du bail')
  assert.deepEqual(p.rows[0].lease, { create: true, startDate: '2020-03-15' })
  assert.deepEqual(p.rows[1].lease, { create: false, reason: 'bail terminé le 31/08/2022, non repris' })
  assert.equal(p.rows[2].lease?.create, false)
  assert.equal(p.rows[3].lease, undefined)
  assert.equal(leasePlan({ rentCents: 50000 }, [{ lastName: 'X' }], '2026-11-15')?.create, false)
  assert.deepEqual(leasePlan({ rentCents: 50000 }, [{ lastName: 'X', entryDate: '2026-01-01', leaseEnd: '2027-12-31' }], '2026-11-15'), { create: true, startDate: '2026-01-01', endDate: '2027-12-31' })
})

test('fin de la période en cours : tacite reconduction pour la même durée', () => {
  // Vide, 3 ans depuis le 15 mars 2020 : 1re période jusqu'au 14 mars 2023, 2e jusqu'au 14 mars 2026, 3e jusqu'au 14 mars 2029.
  assert.equal(currentTermEnd('2020-03-15', 36, '2026-11-15'), '2029-03-14')
  assert.equal(currentTermEnd('2025-10-01', 12, '2026-11-15'), '2027-09-30')
  assert.equal(currentTermEnd('2026-11-15', 12, '2026-11-15'), '2027-11-14')
})
