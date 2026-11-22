window.SPEC = {
  name: 'cfe', look: 'journal', duration: 24.8, end: 19.9, guideAt: 21.0,
  source: 'Source : service-public.fr (Entreprendre), fiche F23547',
  scenes: [
    { kind: 'clip', at: 0, clip: 7710747, from: 2, top: 'Moi en décembre avec *ma location meublée*', bottom: { t: 'Une taxe arrive', at: 1.3 } },
    { kind: 'obj', at: 2.0, model: 'coin', bg: 'night', kicker: 'Avant le 15 décembre', title: 'La *CFE*', titleAt: 3.3 },
    { kind: 'obj', at: 4.3, model: 'stack', title: 'Due si vos recettes dépassent', big: { t: '5 000 €/an', at: 5.9 } },
    { kind: 'obj', at: 7.0, model: 'house', bg: 'sun', title: '*Pas due*', items: [{ t: 'pour une partie de votre résidence principale', at: 8.0 }] },
    { kind: 'obj', at: 10.0, model: 'doc', arg: '1447-C', bg: 'night', title: '1re année : *exonération*', items: [{ t: 'à condition de la *demander*', at: 12.4 }] },
    { kind: 'clip', at: 13.4, clip: 12908869, from: 4, top: 'Vous attendez l’avis *dans la boîte aux lettres* ?', bottom: { t: 'Il est sur impots.gouv.fr', at: 15.6 } },
  ],
}
