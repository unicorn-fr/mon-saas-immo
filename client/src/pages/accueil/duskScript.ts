// @ts-nocheck
// Généré par scripts/accueil-dusk.py depuis la maquette : ne pas modifier à la main.
// Les animations de la maquette, telles quelles, avec GSAP installé dans le projet. Tout s'arrête au départ de la page :
// minuteurs, observateurs, défilements épinglés (gsap.context).
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { DuskPrices } from './duskMain'

gsap.registerPlugin(ScrollTrigger)

export function mountDusk(root: HTMLElement, P: DuskPrices): () => void {
  let alive = true
  const timers = new Set<number>()
  const cleanups: Array<() => void> = []
  const setTimeout = (f: () => void, ms?: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id)
      if (alive) f()
    }, ms)
    timers.add(id)
    return id
  }
  const clearTimeout = (id: number) => {
    window.clearTimeout(id)
    timers.delete(id)
  }
  const observers: Array<{ disconnect(): void }> = []
  class IO extends IntersectionObserver {
    constructor(cb: IntersectionObserverCallback, o?: IntersectionObserverInit) {
      super(cb, o)
      observers.push(this)
    }
  }
  class MO extends MutationObserver {
    constructor(cb: MutationCallback) {
      super(cb)
      observers.push(this)
    }
  }
  const refresh = () => alive && ScrollTrigger.refresh()
  const ctx = gsap.context(() => {

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) root.classList.add('scene');

  /* Façade : tout est éteint, puis une fenêtre s'allume ; au-delà de trois, la plus ancienne s'éteint */
  const villes = { a1:'Lyon 3e', a2:'Nantes', a3:'Paris 11e', a4:'Lille', b1:'Bordeaux', b2:'Rennes', b3:'Lyon 7e', b4:'Toulouse', c1:'Paris 18e', c2:'Nantes', c3:'Lille', c4:'Marseille', d1:'Grenoble', d2:'Montpellier', d3:'Strasbourg' };
  const vitres = [...document.querySelectorAll('#vitres .vitre')];
  const cnt = document.getElementById('cnt'), feed = document.getElementById('feed');
  const allumees = [];
  let zoomEnCours = false;
  let recus = 0, derniere = null;
  const dire = (k) => { const li = document.createElement('li'); li.className = 'new'; li.innerHTML = '<b></b>Loyer reçu, ' + villes[k]; feed.prepend(li); while (feed.children.length > 3) feed.lastChild.remove(); };
  const allume = (v) => {
    if (allumees.length >= 3) allumees.shift().classList.remove('on');
    allumees.push(v); derniere = v;
    v.classList.remove('flick'); void v.getBBox(); v.classList.add('on', 'flick');
    recus = recus >= 13 ? 1 : recus + 1; cnt.textContent = recus; dire(v.dataset.k);
  };
  if (reduce) {
    vitres.filter(v => ['a3','b2','c1'].includes(v.dataset.k)).forEach(v => { v.classList.add('on'); allumees.push(v); });
    recus = 3; cnt.textContent = 3;
    feed.innerHTML = '<li><b></b>Loyer reçu, Paris 18e</li><li><b></b>Loyer reçu, Rennes</li><li><b></b>Loyer reçu, Paris 11e</li>';
  } else {
    const tour = () => {
      if (zoomEnCours) { setTimeout(tour, 500); return; }
      const libres = vitres.filter(v => !allumees.includes(v) && v !== derniere);
      allume(libres[Math.floor(Math.random() * libres.length)]);
      setTimeout(tour, 1500 + Math.random() * 1300);
    };
    setTimeout(tour, 1400);
  }

  const $ = (id) => document.getElementById(id);
  /* Cadrage de la façade : sur un écran plus étroit que la photo, on la décale pour garder la fenêtre a3 (centre x = 514)
     aux trois cinquièmes de la largeur, au lieu de la couper au milieu. */
  const waEl = document.querySelector('.wa');
  let vb = { x: 0, w: 1500 };
  const cadrer = () => {
    const W = waEl.clientWidth, H = waEl.clientHeight, a = W / H;
    if (a >= 1.5) vb = { x: 0, w: 1500 };
    else { const w = 1000 * a; vb = { x: Math.max(0, Math.min(1500 - w, 514.5 - .6 * w)), w }; }
    waEl.querySelectorAll('svg.cadre').forEach(sv => sv.setAttribute('viewBox', vb.x + ' 0 ' + vb.w + ' 1000'));
    const t = document.getElementById('facade-trou');
    if (t) t.style.objectPosition = (vb.w < 1500 ? vb.x / (1500 - vb.w) * 100 : 50) + '% 50%';
  };
  cadrer();
  addEventListener('resize', cadrer);
  const eur = (v, dec) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
  const tween = (el, from, to, fmt, ms = 900) => {
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const f = (t) => { const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };

  /* ========== Apparitions : titres mot à mot, blocs qui montent ========== */
  document.querySelectorAll('.mots').forEach(h => {
    const mots = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = mots.map((m, i) => '<span class="m" aria-hidden="true"><span style="--i:' + i + '">' + m + '</span></span>').join(' ');
  });
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IO(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } }), { threshold: .2, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.mots,.monte').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add('vu'); else io.observe(el); });
    root.classList.add('anime');
  }

  /* ========== Le tableau de bord : une journée rejouée ========== */
  const app = $('app'), cur = $('curseur');
  const boutons = [...document.querySelectorAll('#etapes button')];
  let minuteurs = [], tourne = false;
  const plus = (ms, fn) => minuteurs.push(setTimeout(fn, ms * (typeof vite === 'number' ? vite : 1)));
  const stop = () => { minuteurs.forEach(clearTimeout); minuteurs = []; };
  const etat = (id, cls, txt) => { const e = $(id).querySelector('.etat'); e.className = 'etat ' + cls; e.textContent = txt; };
  const pulse = (id) => { $(id).classList.add('pulse'); plus(700, () => $(id).classList.remove('pulse')); };
  const vif = (id, cls = 'vif') => { $(id).classList.add(cls); plus(1400, () => $(id).classList.remove(cls)); };
  const toast = (t) => { $('toast-t').textContent = t; $('toast').hidden = false; plus(2300, () => { $('toast').hidden = true; }); };
  const saute = () => { const s = $('k-todo'); s.classList.add('saute'); plus(300, () => s.classList.remove('saute')); };
  const vers = (el) => { const a = app.getBoundingClientRect(), r = el.getBoundingClientRect(); cur.style.left = (r.left - a.left + r.width * .55) + 'px'; cur.style.top = (r.top - a.top + r.height * .6) + 'px'; };
  const repos = () => { cur.style.left = '86%'; cur.style.top = '104%'; };
  const clic = (el) => { cur.classList.add('clic'); el.classList.add('clic'); plus(170, () => { cur.classList.remove('clic'); el.classList.remove('clic'); }); };
  const allumeEtape = (i, duree) => boutons.forEach((b, j) => {
    b.classList.toggle('fait', j < i);
    if (j === i) { b.classList.remove('on'); void b.offsetWidth; b.style.setProperty('--duree', (duree || 3000) + 'ms'); b.classList.add('on'); } else b.classList.remove('on');
  });
  const depart = () => {
    $('d-date').textContent = 'Mercredi 1er octobre'; $('d-date').classList.remove('change');
    $('k-recu').textContent = eur(520, 0); $('k-bar').style.width = '23%';
    $('k-retard').textContent = '0'; $('k-retard').classList.remove('dette');
    $('k-impaye').textContent = eur(0, 0); $('k-impaye').classList.remove('dette');
    $('k-todo').textContent = '2';
    etat('b-camille', 'attendu', 'Attendu'); etat('b-ines', 'attendu', 'Attendu');
    ['tache', 'notif', 'quit', 'lettre', 'toast'].forEach(id => { $(id).hidden = true; });
    $('tache').classList.remove('fait'); $('t-btn').textContent = 'Relire la relance'; $('t-btn').classList.remove('ok');
    repos();
  };
  const ETAPES = [
    [3200, (vite) => {
      const f = () => { etat('b-camille', 'paye', 'Payé'); $('k-bar').style.width = '57%'; };
      if (vite) { f(); $('k-recu').textContent = eur(1300, 0); return; }
      plus(300, () => { $('notif').hidden = false; });
      plus(1600, () => { $('notif').hidden = true; f(); pulse('b-camille'); vif('t-recu'); tween($('k-recu'), 520, 1300, v => eur(Math.round(v), 0)); });
    }],
    [3600, (vite) => {
      if (vite) return;
      plus(200, () => {
        const q = $('quit'), b = $('b-camille').getBoundingClientRect(), a = app.getBoundingClientRect();
        q.style.transition = 'none'; q.style.left = (b.left - a.left + 30) + 'px'; q.style.top = (b.top - a.top - 40) + 'px'; q.style.transform = 'scale(.6) rotate(-4deg)'; q.style.opacity = '0'; q.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => { q.style.transition = ''; q.style.opacity = '1'; q.style.transform = 'scale(1) rotate(-2deg) translateY(-40px)'; }));
      });
      plus(1300, () => { const q = $('quit'); q.style.transform = 'translate(' + Math.round(app.clientWidth * .3) + 'px,-220px) scale(.35) rotate(10deg)'; q.style.opacity = '0'; });
      plus(2100, () => { $('quit').hidden = true; toast('Quittance envoyée à Camille Martin'); });
    }],
    [3600, (vite) => {
      const date = () => { $('d-date').textContent = 'Lundi 6 octobre'; $('d-date').classList.add('change'); };
      const retard = () => { etat('b-ines', 'retard', 'En retard'); $('k-retard').textContent = '1'; $('k-retard').classList.add('dette'); $('k-impaye').textContent = eur(970, 0); $('k-impaye').classList.add('dette'); };
      const tache = () => { $('tache').hidden = false; $('k-todo').textContent = '3'; };
      if (vite) { date(); retard(); tache(); return; }
      plus(300, date);
      plus(1000, () => { retard(); pulse('b-ines'); vif('t-retard', 'rouge'); vif('t-impaye', 'rouge'); });
      plus(2000, () => { tache(); saute(); });
    }],
    [6600, (vite) => {
      const fin = () => { $('lettre').hidden = true; $('tache').classList.add('fait'); $('t-btn').textContent = 'Envoyée'; $('t-btn').classList.add('ok'); $('k-todo').textContent = '2'; };
      if (vite) { fin(); return; }
      plus(200, () => vers($('t-btn')));
      plus(1250, () => clic($('t-btn')));
      plus(1500, () => { $('lettre').hidden = false; });
      plus(3300, () => vers($('l-btn')));
      plus(4350, () => clic($('l-btn')));
      plus(4600, () => { fin(); saute(); toast('Relance envoyée à Inès Moreau'); repos(); });
    }]
  ];
  const joue = (i) => {
    stop(); depart();
    for (let j = 0; j < i; j++) ETAPES[j][1](true);
    const suite = (k) => {
      if (k >= ETAPES.length) { plus(1800, () => joue(0)); return; }
      allumeEtape(k, ETAPES[k][0]); ETAPES[k][1](false);
      plus(ETAPES[k][0], () => suite(k + 1));
    };
    suite(i);
  };
  const demarre = () => { if (!tourne && !reduce) { tourne = true; joue(0); } };
  /* Avec le défilement : l'étape affichée suit la position, jouée tout de suite et en accéléré */
  let etapeVue = -1;
  const montreEtape = (k) => {
    if (k === etapeVue) return; etapeVue = k;
    stop(); depart();
    for (let j = 0; j < k; j++) ETAPES[j][1](true);
    allumeEtape(k, 1);
    vite = .5; ETAPES[k][1](false); vite = 1;
  };
  let vite = 1, histoireActive = false;
  const arrete = () => { if (tourne) { tourne = false; stop(); } };
  depart();
  if (reduce) {
    for (let j = 0; j < 3; j++) ETAPES[j][1](true);
    boutons.forEach((b, j) => b.classList.toggle('fait', j < 3));
    boutons.forEach((b, j) => b.addEventListener('click', () => { depart(); for (let k = 0; k <= j; k++) ETAPES[k][1](true); boutons.forEach((x, k) => { x.classList.toggle('fait', k < j); x.classList.toggle('on', k === j); }); }));
  } else boutons.forEach(b => b.addEventListener('click', () => { if (histoireActive) return; tourne = true; joue(+b.dataset.s); }));

  /* ========== Tout ce que fait Bailio : sept moments de la location ========== */
  const OK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2 8.8-9.2"/></svg>';
  const V = {
    coches: (l) => '<ul class="v-coches">' + l.map((t, i) => '<li style="--i:' + i + '">' + OK + '<span>' + t + '</span></li>').join('') + '</ul>',
    puces: (l) => '<div class="v-puces">' + l.map((t, i) => '<span style="--i:' + i + ';--n:' + l.length + '">' + t + '</span>').join('') + '</div>',
    lien: (t) => '<div class="v-lien"><span class="url"><b>' + t + '</b><i class="caret"></i></span><span class="copie">' + OK + 'Copié</span></div>',
    doc: (t) => '<div class="v-doc"><i></i><i></i><i class="c"></i><i></i><span class="marque">' + t + '</span></div>',
    notes: (n) => '<div class="v-notes" aria-label="' + n + ' sur 5">' + [0, 1, 2, 3, 4].map(i => '<i class="' + (i < n ? 'on' : '') + '" style="--i:' + i + '"></i>').join('') + '<b>' + n + '/5</b></div>',
    trait: () => '<svg class="v-trait" viewBox="0 0 220 60" aria-hidden="true"><path pathLength="1" d="M8 44c14-3 18-30 30-30 11 0-2 32 10 32 10 0 12-22 24-22 10 0 5 16 16 16 9 0 13-14 22-14 8 0 5 12 14 12 12 0 30-10 44-12"/><path class="ligne" d="M8 54h204"/></svg>',
    compare: (l) => '<div class="v-compare"><span class="t">Entrée</span><span class="t">Sortie</span>' + l.map((r, i) => '<span style="--i:' + i + '">' + r[0] + '</span><em class="' + r[2] + '" style="--i:' + i + '">' + r[1] + '</em>').join('') + '</div>',
    compte: (de, a, lib, dec) => '<div class="v-compte"><b class="num" data-de="' + de + '" data-a="' + a + '" data-dec="' + (dec || 0) + '">' + eur(de, dec || 0) + '</b><span>' + lib + '</span></div>',
    frise: (l) => '<div class="v-frise" style="--n:' + l.length + '"><i class="fil"></i>' + l.map((t, i) => '<span style="--i:' + i + '"><i></i>' + t + '</span>').join('') + '</div>',
    barres: (l) => '<div class="v-barres">' + l.map((r, i) => '<span style="--h:' + r[1] + ';--i:' + i + '"><i class="' + (r[2] || '') + '"></i><small>' + r[0] + '</small></span>').join('') + '</div>',
    alerte: (t, b) => '<div class="v-alerte"><span class="goutte"></span><div><b>' + t + '</b><span>Photos jointes</span></div><em>' + b + '</em></div>',
    interrupteur: (t) => '<div class="v-inter"><span>' + t + '</span><i></i></div>',
    gens: (l) => '<div class="v-gens">' + l.map((p, i) => '<span style="--i:' + i + '"><i>' + p[0] + '</i><small>' + p[1] + '</small></span>').join('') + '</div>',
    discussion: (q, r) => '<div class="v-chat"><span class="q">' + q + '</span><span class="tape"><i></i><i></i><i></i></span><span class="r">' + r + '</span></div>',
    corbeille: (t) => '<div class="v-corb"><span class="ligne">' + t + '</span><span class="bouton">Restaurer</span></div>'
  };
  const C = [
    { nom: 'Mettre en location', photo: 'visite', puce: '<b>5 candidatures</b> reçues', titre: 'Trouvez le bon locataire.',
      cases: [['Lien de candidature', V.lien('bailio.fr/candidature/t2-lyon')], ['Pièces protégées', V.doc('Uniquement pour louer à Lyon'), 'sombre'], ['Dossiers notés', V.notes(4)], ['Annonce conforme', V.coches(['Loyer', 'Dépôt', 'Classe énergie']), 'soleil']] },
    { nom: 'Bail et signature', photo: 'bail', puce: '<b>Bail signé</b> en ligne', titre: 'Un bail juste, signé au doigt.',
      cases: [['Règles vérifiées', V.coches(['Durée', 'Dépôt', 'Plafond de loyer']), 'soleil'], ['Signature en ligne', V.trait()], ['Tous les baux', V.puces(['Vide', 'Meublé', 'Étudiant', 'Colocation', 'Garage', 'Commerce'])], ['Annexes jointes', V.puces(['Notice', 'Diagnostics', 'Charges']), 'sombre']] },
    { nom: 'État des lieux', photo: 'edl', puce: '<b>Séjour</b> identique', titre: 'L’état des lieux sur votre téléphone.',
      cases: [['Entrée et sortie comparées', V.compare([['Parquet', 'Identique', 'ok'], ['Peinture', 'À regarder', 'av']]), 'soleil'], ['Retenues justifiées', V.compte(780, 700, 'rendus')], ['Signé sur place', V.trait(), 'sombre'], ['Oublis signalés', V.frise(['J1', 'J5', 'J10'])]] },
    { nom: 'Loyers et quittances', photo: 'matin', puce: '<b>Quittance</b> partie à 8&#8239;h&#8239;02', titre: 'Le loyer arrive, la quittance part.',
      cases: [['Relevé lu', V.coches(['780,00 €', '520,00 €'])], ['Relances automatiques', V.frise(['J+3', 'J+8', 'J+15']), 'sombre'], ['Loyer révisé', V.compte(720, 735.4, 'nouveau loyer', 2), 'soleil'], ['Charges régularisées', V.barres([['Provisions', 72], ['Réel', 64, 'clair']])]] },
    { nom: 'Côté locataire', photo: 'cles', puce: '<b>Assurance</b> reçue', titre: 'Un lien, sans compte.',
      cases: [['Assurance suivie', V.coches(['Reçue', 'Rappel prévu'])], ['Fuite signalée', V.alerte('Fuite', 'Urgent'), 'soleil'], ['Préavis calculé', V.frise(['Lettre', '1 mois', 'Départ'])], ['Quittance par email', V.interrupteur('Accord'), 'sombre']] },
    { nom: 'Impôts', photo: 'impots', puce: '<b>Case 4BE</b> prête', titre: 'Vos impôts, en cases à recopier.',
      cases: [['2044 remplie', V.coches(['Ligne 211', 'Ligne 221', 'Ligne 250']), 'soleil'], ['Micro ou réel', V.barres([['Micro', 80], ['Réel', 46, 'clair']])], ['Bonnes dates', V.puces(['Déclaration', 'Occupation', 'CFE']), 'sombre'], ['SCI incluses', V.gens([['CD', '50 %'], ['MD', '50 %']])]] },
    { nom: 'Gestion et comptes', photo: 'cartons', puce: '<b>5,8&#8239;%</b> de rendement', titre: 'Votre patrimoine, bien rangé.',
      cases: [['Pilotage', V.barres([['Lyon', 84], ['Nantes', 58], ['Sète', 70]]), 'sombre'], ['Comptable invité', V.gens([['AS', 'Associé'], ['EC', 'Comptable'], ['PL', 'Artisan']])], ['IA en lecture', V.discussion('Qui est en retard ?', 'Inès, 970 €.'), 'soleil'], ['Corbeille 30 jours', V.corbeille('Plombier, 180 €')]] }
  ];
  const piste = $('fx-piste'), nav = $('fx-nav');
  piste.innerHTML = C.map((c, i) =>
    '<article class="fx-panneau" aria-label="' + c.nom + '">' +
      '<figure class="fx-photo" style="margin:0"><img src="/accueil/img/' + c.photo + '.jpg" alt="" loading="lazy"><span class="puce">' + c.puce + '</span></figure>' +
      '<div><p class="fx-moment">' + (i + 1) + ' sur ' + C.length + ', ' + c.nom.toLowerCase() + '</p><h3 class="fx-titre">' + c.titre + '</h3>' +
      '<div class="fx-cases">' + c.cases.map((x, j) => '<div class="case ' + (x[2] || '') + '" style="--i:' + j + '"><div class="vis">' + x[1] + '</div><h3>' + x[0] + '</h3></div>').join('') + '</div></div>' +
    '</article>').join('');
  nav.innerHTML = C.map((c, i) => '<button type="button" data-i="' + i + '">' + c.nom + '</button>').join('') + '<span class="barre" aria-hidden="true"></span>';
  const navB = [...nav.querySelectorAll('button')], barre = nav.querySelector('.barre');
  let allerA = null, actif = -1;
  const marque = (i) => {
    if (i === actif) return; actif = i;
    navB.forEach((b, j) => b.classList.toggle('on', j === i));
    const b = navB[i]; barre.style.width = b.offsetWidth + 'px'; barre.style.transform = 'translateX(' + b.offsetLeft + 'px)';
  };
  navB.forEach((b, i) => b.addEventListener('click', () => { if (allerA) allerA(i); }));
  /* compteurs des petites scènes : quand leur panneau joue */
  const compte = new MO((ms) => ms.forEach(m => { if (m.target.classList.contains('joue') && !m.target.dataset.compte) { m.target.dataset.compte = 1; m.target.querySelectorAll('[data-a]').forEach(el => setTimeout(() => tween(el, +el.dataset.de, +el.dataset.a, v => eur(v, +el.dataset.dec), 1400), 500)); } }));
  piste.querySelectorAll('.fx-panneau').forEach(p => compte.observe(p, { attributes: true, attributeFilter: ['class'] }));

  /* Carte de Genève : courbes de niveau */
  const g = document.querySelector('.cf-geneve .courbes');
  if (g) {
    let d = '';
    for (let k = 1; k <= 16; k++) {
      d += 'M';
      for (let a = 0; a <= Math.PI * 2 + .01; a += .05) {
        const r = k * 13 + 6 * Math.sin(a * 3 + k * .4) + 4 * Math.cos(a * 5 - k * .3);
        d += (196 + Math.cos(a) * r * 1.5).toFixed(1) + ' ' + (118 + Math.sin(a) * r * .9).toFixed(1) + ' ';
      }
    }
    g.innerHTML = '<path d="' + d + '"/>';
  }

  /* ========== Le prix : chaque maison se dessine trait par trait, puis s'allume ========== */
  const n = $('n-range'), out = $('n-out'), mais = $('maisons');
  const LOYER = 750, TAUX = 0.07;
  const TRAITS = [
    'M5 20 L20 6', 'M20 6 L35 20',             /* le toit, versant gauche puis droit */
    'M5 20 V40', 'M35 20 V40', 'M5 40 H35',    /* les murs puis le sol */
    'M10 22 h6 v7 h-6 z', 'M24 22 h6 v7 h-6 z', /* les fenêtres */
    'M17 40 v-8 h6 v8'                         /* la porte */
  ];
  const traits = (cls) => TRAITS.map((d, i) => '<path class="' + cls + '" d="' + d + '" pathLength="1" style="--k:' + i + '"/>').join('');
  mais.innerHTML = Array.from({ length: 20 }, () =>
    '<svg class="maison" viewBox="0 0 40 44"><path class="mur" d="M5 20L20 6l15 14v20H5z"/>' +
    '<path class="vitre-m" d="M10 22h6v7h-6zM24 22h6v7h-6z"/><path class="porte-m" d="M17 40v-8h6v8z"/>' +
    '<g class="eteint">' + traits('t0') + '</g><g class="allume">' + traits('t1') + '</g></svg>').join('');
  const maisons = [...mais.children];
  /* une seule file d'attente : le nombre allumé rejoint toujours exactement le nombre choisi, une maison à la fois */
  let visibles = 0, cible = 0, pas = null, prixVu = reduce;
  const avance = () => {
    if (visibles < cible) maisons[visibles++].classList.add('on');
    else if (visibles > cible) maisons[--visibles].classList.remove('on');
    pas = visibles !== cible ? setTimeout(avance, reduce ? 0 : 140) : null;
  };
  const vise = (k) => { cible = k; if (reduce) { maisons.forEach((m, i) => m.classList.toggle('on', i < k)); visibles = k; return; } if (!pas) avance(); };
  let periode = 'an';
  const prec = { b: 0, q: 0, a: 0, g: 0 };
  const calc = () => {
    const k = +n.value, an = periode === 'an';
    if (out.textContent !== String(k)) { out.textContent = k; out.classList.remove('tic'); void out.offsetWidth; out.classList.add('tic'); }
    n.style.setProperty('--pc', ((k - 1) / 19 * 100) + '%');
    if (prixVu) vise(k);
    const b = an ? Math.min(k * P.yearly, P.capYearly) : Math.min(k * P.monthly, P.capMonthly);   /* plafond : toujours sous Qalimo */
    const q = an ? (k > 7 ? 343 : k * 49) : (k > 7 ? 34.30 : k * 4.90);
    const a = k * LOYER * TAUX * (an ? 12 : 1);
    $('forfait').classList.toggle('on', k > 7);
    const max = Math.max(b, q, a);
    $('bar-bailio').style.width = Math.max(1.5, b / max * 100) + '%';
    $('bar-qalimo').style.width = Math.max(1.5, q / max * 100) + '%';
    $('bar-agence').style.width = Math.max(1.5, a / max * 100) + '%';
    const dec = (v) => v < 1000 ? 2 : 0, u = an ? ' par an' : ' par mois';
    tween($('v-bailio'), prec.b, b, v => eur(v, dec(b)), 650);
    tween($('v-qalimo'), prec.q, q, v => eur(v, dec(q)), 650);
    tween($('v-agence'), prec.a, a, v => eur(v, dec(a)), 650);
    tween($('g-agence'), prec.g, a - b, v => eur(v, 0), 900);
    $('g-per').textContent = an ? 'par an' : 'par mois';
    $('g-pct').textContent = Math.round((1 - P.monthly / (LOYER * TAUX)) * 100) + '\u202F% moins cher';
    const ge = $('g-agence'); ge.classList.remove('boum'); void ge.offsetWidth; ge.classList.add('boum');
    Object.assign(prec, { b, q, a, g: a - b });
  };
  n.addEventListener('input', calc);
  $('n-moins').addEventListener('click', () => { n.value = Math.max(1, +n.value - 1); calc(); });
  $('n-plus').addEventListener('click', () => { n.value = Math.min(20, +n.value + 1); calc(); });
  document.querySelectorAll('.bascule button').forEach(bt => bt.addEventListener('click', () => {
    periode = bt.dataset.p;
    document.querySelectorAll('.bascule button').forEach(x => x.setAttribute('aria-checked', String(x === bt)));
    calc();
  }));
  calc();
  if (!prixVu) new IO((es, o) => es.forEach(e => { if (e.isIntersecting) { prixVu = true; calc(); o.disconnect(); } }), { threshold: .4 }).observe(mais);

  /* ========== Mise en scène au défilement (GSAP, tous navigateurs) ========== */
  if (!reduce) {
    
    const wa = document.querySelector('.wa'), cadres = wa.querySelectorAll('.cadre'), portail = $('portail');
    const cible3 = document.querySelector('#vitres .vitre[data-k="a3"]');
    /* Géométrie exacte de la fenêtre a3 (472,482 → 557,630 sur la photo de 1500 × 1000, cadrée en « cover ») */
    const geo = () => {
      const W = wa.clientWidth, H = wa.clientHeight, k = Math.max(W / vb.w, H / 1000);
      const ox = (W - vb.w * k) / 2 - vb.x * k, oy = (H - 1000 * k) / 2;
      const x = ox + 472 * k, y = oy + 482 * k, w = 85 * k, h = 148 * k;
      return { W, H, x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
    };
    ScrollTrigger.addEventListener('refreshInit', cadrer);
    /* Échelle où la vitre couvre tout l'écran, puis un peu plus : la façade sort de l'écran de tous côtés. */
    const plein = () => { const g = geo(); return Math.max(g.W / g.w, g.H / g.h) * 1.7; };
    const vers = () => { const g = geo(); return { x: g.W / 2 - g.cx, y: g.H / 2 - g.cy }; };

    /* 1. On entre par la fenêtre : elle glisse au centre, la lumière de la vitre s'efface,
          l'appartement apparaît derrière le verre, la façade passe devant et disparaît */
    const entree = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: wa, start: 'top top', end: () => (innerWidth < 760 ? '+=120%' : '+=200%'), pin: true, scrub: innerWidth < 760 ? .7 : 1.6, invalidateOnRefresh: true,
        onUpdate: (st) => { zoomEnCours = st.progress > .01; },
        onLeaveBack: () => { zoomEnCours = false; gsap.set(cible3, { clearProps: 'opacity' }); } }
    });
    entree
      .set(cadres, { transformOrigin: () => { const g = geo(); return g.cx + 'px ' + g.cy + 'px'; }, force3D: true }, 0)
      .to('.wa h1, .wa .sub, .wa .acts', { y: -40, opacity: 0, ease: 'power2.in', duration: .16, stagger: .02 }, 0)
      .to('.wa .counter', { y: 40, opacity: 0, ease: 'power2.in', duration: .16 }, 0)
      .to('.wa .nav', { y: -30, opacity: 0, duration: .14 }, 0)
      .to('.wa .indice', { opacity: 0, duration: .05 }, 0)
      .fromTo(cible3, { opacity: 1 }, { opacity: 0, ease: 'power2.out', duration: .1 }, .01)
      .to('#vitres', { autoAlpha: 0, ease: 'power1.out', duration: .14 }, .02)
      .to('.wa .dusk', { opacity: .1, ease: 'power1.inOut', duration: .6 }, 0)
      .to(cadres, { x: () => vers().x, y: () => vers().y, ease: 'sine.inOut', duration: .62 }, 0)
      .to(cadres, { scale: () => plein(), ease: 'power3.in', duration: .86 }, 0)
      .to(cadres, { opacity: 0, ease: 'power1.in', duration: .14 }, .72)
      .fromTo('#portail img', { scale: 1.45, filter: 'brightness(.5) saturate(.8)' }, { scale: 1, filter: 'brightness(1) saturate(1)', ease: 'power2.out', duration: .9 }, 0)
      .fromTo('.portail-t', { y: 30, opacity: 0 }, { y: 0, opacity: 1, ease: 'power2.out', duration: .1 }, .86)
      .to({}, { duration: .04 });

    /* 2. Le tableau de bord se forme : ses pièces arrivent éclatées en 3D et s'emboîtent */
    const pieces = gsap.utils.toArray('#app .piece');
    const rnd = gsap.utils.random;
    gsap.timeline({ scrollTrigger: { trigger: '#tb-scene', start: 'top 88%', toggleActions: 'play none none reverse' }, defaults: { duration: 1.4 } })
      .from('.a2-fond', { opacity: 0, scale: .94, duration: .8, ease: 'power2.out' }, .2)
      .from(pieces, {
        x: (i) => (i % 2 ? 1 : -1) * rnd(80, 260), y: () => rnd(-160, 220), z: () => rnd(-500, 120),
        rotateX: () => rnd(-28, 28), rotateY: () => rnd(-30, 30), rotateZ: () => rnd(-6, 6),
        opacity: 0, duration: 1.3, ease: 'expo.out', stagger: { each: .035, from: 'random' }
      }, 0);
    /* Le tableau de bord se fige et la journée avance avec le défilement, une étape par quart : seulement quand il tient
       dans l'écran (ordinateur). Sur téléphone et tablette, il défile normalement et la journée se joue seule quand il
       est visible ; les quatre étapes restent cliquables. */
    const mmTb = gsap.matchMedia();
    mmTb.add('(min-width: 1000px) and (min-height: 700px)', () => {
      histoireActive = true;
      const histoire = ScrollTrigger.create({ trigger: '#tb-pin', start: 'top 4%', end: '+=260%', pin: true,
        onUpdate: (st) => {
          const p = st.progress * 4, k = Math.min(3, Math.floor(p));
          montreEtape(k);
          boutons.forEach((b, j) => b.style.setProperty('--p', j < k ? 1 : j === k ? Math.min(1, p - k) : 0));
        },
        onLeaveBack: () => { etapeVue = -1; stop(); depart(); boutons.forEach(b => { b.classList.remove('on', 'fait'); b.style.setProperty('--p', 0); }); } });
      boutons.forEach((b, i) => { b.onclick = (e) => { e.stopImmediatePropagation(); scrollTo({ top: histoire.start + (histoire.end - histoire.start) * (i + .15) / 4, behavior: 'smooth' }); }; });
      return () => { histoireActive = false; etapeVue = -1; boutons.forEach(b => { b.onclick = null; }); };
    });
    mmTb.add('(max-width: 999px), (max-height: 699px)', () => {
      const vu = ScrollTrigger.create({ trigger: '#app', start: 'top 70%', end: 'bottom 20%', onToggle: (st) => (st.isActive ? demarre() : arrete()) });
      return () => { vu.kill(); arrete(); };
    });

    /* Les trois chiffres-chocs montent quand ils arrivent */
    gsap.utils.toArray('[data-choc]').forEach((el) => {
      const fin = +el.dataset.choc, dec = +(el.dataset.dec || 0);
      ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => tween(el, fin === 0 ? 9 : 0, fin, v => v.toFixed(dec).replace('.', ','), 1600) });
    });
    gsap.from('.choc-l', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.choc', start: 'top 85%' } });
    ScrollTrigger.batch('.cf-t', { start: 'top 90%', once: true, onEnter: (els) => {
      gsap.from(els, { y: 40, opacity: 0, scale: .96, duration: 1, ease: 'expo.out', stagger: .08 });
      els.forEach(t => { const b = t.querySelector('[data-n]'); if (b) tween(b, 0, +b.dataset.n, v => String(Math.round(v)), 1200); });
    } });

    /* 3. Le parcours défile à l'horizontale (ordinateur) */
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px) and (min-height: 700px)', () => {
      const fx = document.querySelector('.fx'), piste = $('fx-piste');
      fx.classList.add('horizontal');
      const panneaux = gsap.utils.toArray('.fx-panneau');
      const dist = () => piste.scrollWidth - innerWidth;
      const tween = gsap.to(piste, { x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '#fx-pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .6, invalidateOnRefresh: true,
          onUpdate: (st) => marque(Math.round(st.progress * (panneaux.length - 1))) } });
      panneaux.forEach((p) => {
        ScrollTrigger.create({ trigger: p, containerAnimation: tween, start: 'left 70%', end: 'right 30%', toggleClass: 'joue' });
        gsap.from(p.querySelectorAll('.fx-moment, .fx-titre, .fx-texte, .fx-cases .case'), { y: 40, opacity: 0, stagger: .06, ease: 'power2.out',
          scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 85%', end: 'left 35%', scrub: true } });
        gsap.fromTo(p.querySelector('.fx-photo'), { clipPath: 'inset(12% 14% 12% 14% round 26px)' }, { clipPath: 'inset(0% 0% 0% 0% round 26px)', ease: 'none',
          scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 100%', end: 'left 40%', scrub: true } });
      });
      allerA = (i) => { const st = tween.scrollTrigger; scrollTo({ top: st.start + (st.end - st.start) * i / (panneaux.length - 1), behavior: 'smooth' }); };
      return () => { fx.classList.remove('horizontal'); allerA = null; };
    });

    mm.add('(max-width: 999px), (max-height: 699px)', () => {
      gsap.utils.toArray('.fx-panneau').forEach(p => ScrollTrigger.create({ trigger: p, start: 'top 75%', end: 'bottom 25%', toggleClass: 'joue' }));
    });

    /* 4. Les garanties : le trait se tire, le chiffre monte */
    const courbe = document.querySelector('.cf-geneve .courbes path');
    if (courbe) {
      const L = courbe.getTotalLength();
      gsap.fromTo(courbe, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.cf', start: 'top 80%', end: 'center center', scrub: 1 } });
    }

    /* 5. La nuit retombe sur le prix */
    gsap.fromTo('.prix-s', { backgroundColor: '#E9E1D5', borderTopLeftRadius: '50% 120px', borderTopRightRadius: '50% 120px' },
      { backgroundColor: '#1D2433', borderTopLeftRadius: '36px 36px', borderTopRightRadius: '36px 36px', ease: 'none', scrollTrigger: { trigger: '.prix-s', start: 'top bottom', end: 'top 45%', scrub: true } });
    gsap.from('.fin .btn', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.fin', start: 'top 75%' } });
    window.addEventListener('load', refresh); cleanups.push(() => window.removeEventListener('load', refresh));
    if (document.fonts) document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh() });
  } else {
    /* Sans GSAP ou avec moins d'animations : l'histoire démarre quand l'écran est visible */
    new IO((es) => es.forEach(e => { e.isIntersecting ? demarre() : arrete(); }), { threshold: .4 }).observe($('app'));
    document.querySelectorAll('.fx-panneau').forEach(p => p.classList.add('joue'));
  }

  }, root)
  return () => {
    alive = false
    timers.forEach((id) => window.clearTimeout(id))
    observers.forEach((o) => o.disconnect())
    cleanups.forEach((f) => f())
    ctx.revert()
  }
}
