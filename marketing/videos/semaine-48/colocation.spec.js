window.SPEC = {
  name: 'colocation', look: 'nuit', duration: 21.6, end: 17.3, guideAt: 18.4,
  source: 'Source : service-public.fr, fiche F2044 · loi du 6 juillet 1989, art. 8-1',
  scenes: [
    { kind: 'clip', at: 0, clip: 5836141, from: 1, top: 'Quand un colocataire annonce *qu’il part*', bottom: { t: 'Il paie encore ?', at: 1.2 } },
    { kind: 'obj', at: 2.1, model: 'key', title: 'Clause de *solidarité* ?', big: { t: 'Oui.', at: 3.8 } },
    { kind: 'obj', at: 4.4, model: 'stack', bg: 'linen', title: 'Chacun doit *tout* le loyer', items: [{ t: 'colocataire et caution', at: 5.4 }, { t: 'même la part des autres', at: 7.5 }] },
    { kind: 'obj', at: 8.7, model: 'calendar', arg: '6 mois', bg: 'sun', title: 'Celui qui part reste tenu', big: { t: '6 mois', at: 10.2 }, items: [{ t: 'après la fin du préavis', at: 10.8 }] },
    { kind: 'clip', at: 11.9, clip: 6574026, from: 1, top: 'Sauf si *un nouveau colocataire* arrive pendant le préavis', bottom: { t: 'Fin à la fin du préavis', at: 15.1 } },
  ],
}
