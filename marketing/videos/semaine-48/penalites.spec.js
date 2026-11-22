window.SPEC = {
  name: 'penalites', look: 'soleil', duration: 21.8, end: 16.8, guideAt: 18.0,
  source: 'Source : service-public.fr, fiche F2889 · loi du 6 juillet 1989, art. 4',
  scenes: [
    { kind: 'clip', at: 0, clip: 8627749, from: 0.5, top: 'Une *pénalité de retard* dans votre bail ?', bottom: { t: 'Interdite.', at: 2.1 } },
    { kind: 'obj', at: 3.1, model: 'ban', title: 'Ni amende, *ni frais* de retard', items: [{ t: 'clause abusive', at: 6.8 }, { t: 'elle ne compte pas', at: 7.8 }] },
    { kind: 'clip', at: 8.7, clip: 8555709, from: 1, top: 'Mais il paie en retard *tous les mois*…' },
    { kind: 'obj', at: 11.0, model: 'calendar', arg: 'FIN', bg: 'night', title: 'Refus de *renouveler* le bail', items: [{ t: 'motif *légitime et sérieux*', at: 13.1 }] },
    { kind: 'obj', at: 14.9, model: 'envelope', bg: 'linen', title: 'Gardez une trace de *chaque retard*' },
  ],
}
