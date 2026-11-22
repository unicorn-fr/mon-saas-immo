window.SPEC = {
  name: 'notice', look: 'journal', duration: 24.8, end: 19.2, guideAt: 20.2,
  source: 'Source : service-public.fr, actualité A19067 · arrêté du 29 mai 2015 modifié le 9 octobre 2026',
  scenes: [
    { kind: 'obj', at: 0, model: 'doc', arg: 'NOTICE', kicker: 'Depuis le 18 octobre 2026', title: 'La notice du bail *a changé*' },
    { kind: 'clip', at: 3.5, clip: 6964257, from: 2, top: 'Le locataire qui lit *enfin* la notice', bottom: { t: 'Vos droits et les siens, résumés', at: 5.9 } },
    { kind: 'obj', at: 8.0, model: 'envelope', bg: 'night', title: '*Obligatoire* avec chaque bail', items: [{ t: 'signé', at: 9.7 }, { t: 'ou renouvelé', at: 10.4 }] },
    { kind: 'obj', at: 11.2, model: 'house', title: 'Ce qu’elle *explique*', items: [{ t: 'le loyer', at: 12.4 }, { t: 'le dépôt de garantie', at: 13.5 }, { t: 'les impayés', at: 14.3 }, { t: 'le congé et les litiges', at: 15.1 }] },
    { kind: 'clip', at: 16.3, clip: 7688636, from: 0.5, top: 'Vous avez joint *l’ancienne* notice ?', bottom: { t: 'Mettez-la à jour', at: 18.3 } },
  ],
}
