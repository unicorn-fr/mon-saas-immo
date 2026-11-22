window.SPEC = {
  name: 'depot', look: 'nuit', duration: 21.0, end: 16.6, guideAt: 17.8,
  source: 'Source : service-public.fr, fiche F31269 · loi du 6 juillet 1989, art. 22',
  scenes: [
    { kind: 'clip', at: 0, clip: 7817154, from: 2, top: 'Remise des clés : *combien* de dépôt de garantie ?' },
    { kind: 'obj', at: 2.9, model: 'stack', bg: 'linen', title: 'Location *vide*', big: { t: '1 mois', at: 4.1 }, items: [{ t: 'de loyer hors charges', at: 4.4 }] },
    { kind: 'obj', at: 5.4, model: 'key', bg: 'sun', title: 'Location *meublée*', big: { t: '2 mois', at: 6.3 } },
    { kind: 'obj', at: 7.0, model: 'calendar', arg: 'T1', title: 'Vide, loyer payé *par trimestre d’avance*', big: { t: 'Pas de dépôt', at: 11.5 } },
    { kind: 'clip', at: 12.5, clip: 7688636, from: 3, top: 'L’augmenter *au renouvellement* ?', bottom: { t: 'Jamais, même en cours de bail', at: 14.3 } },
  ],
}
