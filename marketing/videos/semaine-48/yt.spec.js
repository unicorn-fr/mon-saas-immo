window.SPEC = {
  name: 'yt', format: 'paysage', look: 'nuit', duration: 101, end: 93.8, guideAt: 95.7,
  source: 'Sources : service-public.fr, actualité A19067, fiches F2889, F31269 et F31272 ; décret n° 2026-596',
  scenes: [
    { kind: 'clip', at: 0, clip: 27155332, from: 1, top: 'Votre bail, *fin 2026*', bottom: { t: '5 points à vérifier', at: 5.9 } },
    { kind: 'obj', at: 8.2, model: 'doc', arg: 'BAIL', bg: 'linen', kicker: 'Point n° 1', title: 'Le *modèle* de bail', items: [{ t: 'depuis le 1er octobre 2026', at: 10.8 }, { t: 'vide · meublé · colocation', at: 14.4 }] },
    { kind: 'obj', at: 17.7, model: 'house', title: 'La clause *résolutoire*', items: [{ t: 'loyer · charges · dépôt de garantie', at: 21.3 }, { t: 'après un commandement de payer', at: 25.4 }], big: { t: '6 semaines', at: 27.6 } },
    { kind: 'obj', at: 28.2, model: 'phone', bg: 'sun', title: 'Le *portable* des parties', big: { t: 'facultatif', at: 34.0 } },
    { kind: 'obj', at: 34.6, model: 'envelope', bg: 'linen', kicker: 'Point n° 2', title: 'La *notice* d’information', items: [{ t: 'nouvelle version : 18 octobre 2026', at: 41.3 }, { t: 'loyer · dépôt · impayés · congé · litiges', at: 47.1 }] },
    { kind: 'clip', at: 51.1, clip: 8627749, from: 0.5, top: 'Point n° 3 : *les pénalités de retard*', bottom: { t: 'Interdites', at: 53.9 } },
    { kind: 'obj', at: 54.9, model: 'ban', title: 'Une clause *abusive*', items: [{ t: 'elle ne s’applique pas', at: 57.4 }, { t: 'retards répétés : refus de *renouveler*', at: 59.7 }] },
    { kind: 'obj', at: 64.6, model: 'stack', bg: 'sun', kicker: 'Point n° 4', title: 'Le *dépôt* de garantie', items: [{ t: 'vide : 1 mois hors charges', at: 67.7 }, { t: 'meublé : 2 mois', at: 70.1 }, { t: 'vide + trimestre d’avance : *interdit*', at: 73.5 }] },
    { kind: 'obj', at: 75.8, model: 'gavel', kicker: 'Point n° 5', title: 'L’impayé, *dans l’ordre*', items: [{ t: '① lettre simple', at: 79.3 }, { t: '② mise en demeure', at: 80.6 }, { t: '③ commandement de payer', at: 82.7 }, { t: '④ le juge', at: 88.2 }] },
    { kind: 'obj', at: 89.0, model: 'logo', bg: 'linen', title: 'Sur *Bailio*', items: [{ t: 'le modèle officiel', at: 90.1 }, { t: 'la bonne notice', at: 91.4 }, { t: 'les relances', at: 92.8 }] },
  ],
}
