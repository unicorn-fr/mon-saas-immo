window.SPEC = {
  name: 'impayes', look: 'soleil', duration: 23.8, end: 18.8, guideAt: 20.0,
  source: 'Sources : service-public.fr, fiches F31272 et F2889',
  scenes: [
    { kind: 'obj', at: 0, model: 'coin', kicker: 'Loyer impayé', title: 'Que faire, *dans l’ordre* ?' },
    { kind: 'obj', at: 2.2, model: 'envelope', bg: 'linen', title: 'D’abord, *des lettres*', items: [{ t: '① lettre simple', at: 2.4 }, { t: '② mise en demeure en *recommandé*', at: 4.7 }] },
    { kind: 'obj', at: 7.0, model: 'doc', arg: 'ACTE', bg: 'night', title: '③ Commandement *de payer*', items: [{ t: 'par un commissaire de justice', at: 9.4 }], big: { t: '6 semaines', at: 11.6 } },
    { kind: 'obj', at: 12.5, model: 'gavel', title: '④ Sans paiement :', big: { t: 'le juge', at: 14.5 } },
    { kind: 'clip', at: 15.2, clip: 6974189, from: 3, top: 'Et la *pénalité de retard* ?', bottom: { t: 'Interdite, tout du long', at: 18.0 } },
  ],
}
