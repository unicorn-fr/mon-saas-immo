// Généré par scripts/accueil-dusk.py depuis la maquette : ne pas modifier à la main.
export interface DuskPrices {
  monthly: number
  monthlyText: string
  yearly: number
  capMonthly: number
  capYearly: number
  trial: string
}

export const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="i-ok" viewBox="0 0 24 24"><path d="M5.5 12.5l4.2 4.2 8.8-9.2"/></symbol>
    <symbol id="i-quit" viewBox="0 0 24 24"><path d="M6.5 3.5h11v17l-2.75-1.6-2.75 1.6-2.75-1.6-2.75 1.6z"/><path d="M9.25 8.25h5.5M9.25 11.75h5.5M9.25 15.25h3"/></symbol>
    <symbol id="i-sign" viewBox="0 0 24 24"><path d="M3.5 17.5c2.6-.9 3.6-7.5 5.4-7.5 1.7 0 0 6.6 1.8 6.6 1.6 0 1.8-3.6 3.6-3.6 1.6 0 1 2.7 2.7 2.7 1.1 0 2-.7 3.5-.9"/><path d="M3.5 20.5h17"/></symbol>
    <symbol id="i-photo" viewBox="0 0 24 24"><rect x="3.5" y="6.5" width="17" height="13" rx="2.5"/><path d="M9 6.5l1.4-2h3.2l1.4 2"/><circle cx="12" cy="13" r="3.3"/></symbol>
    <symbol id="i-cle" viewBox="0 0 24 24"><circle cx="7.5" cy="12" r="3.8"/><path d="M11.3 12H20.5M17.6 12v2.6M15 12v1.8"/></symbol>
    <symbol id="i-dossier" viewBox="0 0 24 24"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></symbol>
    <symbol id="i-calc" viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/></symbol>
    <symbol id="i-play" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></symbol>
  </defs>
</svg>`

export const MAIN = (P: DuskPrices) => `
  <section class="choc in" aria-label="Pourquoi Bailio">
    <div class="choc-l"><strong class="num"><span data-choc="${P.monthly}" data-dec="2">${P.monthlyText}</span>&#8239;€</strong><span>par logement et par mois.<br>Tout compris.</span></div>
    <div class="choc-l fort"><strong class="num"><span data-choc="93">93</span>&#8239;%</strong><span>moins cher<br>qu’une agence.</span></div>
  </section>

  
  <section class="tb in" aria-labelledby="tb-t">
    <div class="tete-s">
      <h2 id="tb-t" class="mots">Votre tableau de bord.</h2>
      <p class="monte">Bailio s’en occupe. Vous validez.</p>
    </div>
    <div class="tb-pin" id="tb-pin">
    <ol class="tb-etapes" id="etapes">
      <li><button type="button" data-s="0"><b>1</b><strong>Loyer reçu</strong><i class="fil"></i></button></li>
      <li><button type="button" data-s="1"><b>2</b><strong>Quittance envoyée</strong><i class="fil"></i></button></li>
      <li><button type="button" data-s="2"><b>3</b><strong>Retard repéré</strong><i class="fil"></i></button></li>
      <li><button type="button" data-s="3"><b>4</b><strong>Relance validée</strong><i class="fil"></i></button></li>
    </ol>
    <div class="tb-scene" id="tb-scene">
      <div class="app2" id="app" aria-label="Démonstration du tableau de bord, données fictives">
        <div class="a2-fond" aria-hidden="true"></div>
        <aside class="a2-side piece" aria-hidden="true">
          <span class="plaque mini" aria-label="bailio"><svg viewBox="0 0 598 727" aria-hidden="true"><path d="M51 727V67L195 0V727Z"/><path d="M120 727H298A270 270 0 0 0 298 187H120Z"/><rect x="195" y="329" width="229" height="256" rx="26" fill="#F2B45C"/><path d="M309.5 329V585M195 457H424" stroke="currentColor" stroke-width="34"/></svg>ailio</span>
          <ul>
            <li class="on"><svg viewBox="0 0 24 24"><path d="M4 11l8-6.5 8 6.5M6 10v9.5h12V10"/></svg>Tableau de bord</li>
            <li><svg viewBox="0 0 24 24"><rect x="4.5" y="4.5" width="15" height="15" rx="3"/><path d="M9 4.5v15"/></svg>Bailleurs</li>
            <li><svg viewBox="0 0 24 24"><path d="M5 20V10.2a7 7 0 0 1 14 0V20M3.5 20h17"/></svg>Biens</li>
            <li><svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1.2-3.6 4-5.2 7-5.2s5.8 1.6 7 5.2"/></svg>Locataires</li>
            <li><svg viewBox="0 0 24 24"><path d="M6.5 3.5h11v17l-2.75-1.6-2.75 1.6-2.75-1.6-2.75 1.6z"/></svg>Candidats</li>
            <li><svg viewBox="0 0 24 24"><path d="M4 19.5h16M7 16V11M12 16V6M17 16v-3"/></svg>Pilotage</li>
            <li><svg viewBox="0 0 24 24"><path d="M3.5 9.5L12 5l8.5 4.5M5.5 10v7M10 10v7M14 10v7M18.5 10v7M3.5 19.5h17"/></svg>Banques</li>
            <li><svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/></svg>Fiscalité</li>
            <li><svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2.5"/><circle cx="12" cy="10" r="2.5"/><path d="M8.5 16.5c.8-1.8 2-2.6 3.5-2.6s2.7.8 3.5 2.6"/></svg>Carnet</li>
          </ul>
          <span class="profil"><i>CD</i>Claire Dubois</span>
        </aside>
        <div class="a2-main">
          <header class="a2-tete piece">
            <div><h3>Bonjour Claire.</h3><span class="date num" id="d-date">Mercredi 1er&#8239;octobre</span></div>
            <span class="vue" aria-hidden="true">Vue : 4 logements</span>
            <span class="a2-ajout" aria-hidden="true">+ Ajouter</span>
          </header>
          <div class="a2-tuiles">
            <div class="a2-tuile piece"><small>Logements loués</small><strong class="num">3</strong><em>sur 4</em></div>
            <div class="a2-tuile piece"><small>Candidatures</small><strong class="num">5</strong><em>à regarder</em></div>
            <div class="a2-tuile piece" id="t-recu"><small>Loyers perçus</small><strong class="num" id="k-recu">520&#8239;€</strong><em class="num">sur 2&#8239;270&#8239;€</em><div class="jauge"><i id="k-bar" style="width:23%"></i></div></div>
            <div class="a2-tuile piece" id="t-retard"><small>Retards</small><strong class="num" id="k-retard">0</strong><em>loyer</em></div>
            <div class="a2-tuile piece"><small>Dépôts non reçus</small><strong class="num">0</strong><em>tout est reçu</em></div>
            <div class="a2-tuile piece" id="t-impaye"><small>Impayés</small><strong class="num" id="k-impaye">0&#8239;€</strong><em>ce mois-ci</em></div>
          </div>
          <div class="a2-grille">
            <section class="a2-bloc piece">
              <div class="a2-bloc-t"><h4>Mes actions prioritaires</h4><span class="compteur num" id="k-todo">2</span></div>
              <div class="cat"><span class="cat-n">Paiements</span>
                <div class="action nouvelle" id="tache" hidden>
                  <span class="a-ic retard" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="12.5" rx="2"/><path d="M4 7l8 6 8-6"/></svg></span>
                  <div><b>Relancer Inès Moreau</b><span class="num">970&#8239;€ attendus le 1er&#8239;octobre</span></div>
                  <button type="button" class="mini-btn" id="t-btn" tabindex="-1">Relire la relance</button>
                </div>
                <div class="action"><span class="a-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/></svg></span><div><b>Réviser le loyer du studio</b><span>Anniversaire du bail le 15&#8239;octobre</span></div><span class="mini-btn calme">Préparer</span></div>
              </div>
              <div class="cat"><span class="cat-n">Documents</span>
                <div class="action"><span class="a-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.5l7 3v5.5c0 4.2-2.9 7.3-7 8.5-4.1-1.2-7-4.3-7-8.5V6.5z"/></svg></span><div><b>Demander l’attestation d’assurance</b><span>Hugo Lefèvre, expire le 31&#8239;octobre</span></div><span class="mini-btn calme">Demander</span></div>
              </div>
            </section>
            <div class="a2-col">
              <section class="a2-bloc piece">
                <div class="a2-bloc-t"><h4>Mon agenda</h4></div>
                <ul class="agenda num">
                  <li><span><b>15</b>oct.</span>Révision du loyer, Nantes</li>
                  <li><span><b>31</b>oct.</span>Assurance d’Hugo à renouveler</li>
                  <li><span><b>15</b>déc.</span>CFE du studio meublé</li>
                </ul>
              </section>
              <section class="a2-bloc piece">
                <div class="a2-bloc-t"><h4>Mes raccourcis</h4></div>
                <ul class="a2-racc">
                  <li>Noter un loyer reçu</li><li>Envoyer une quittance</li><li>Écrire un courrier</li><li>Faire un état des lieux</li><li>Ajouter une dépense</li><li>Ajouter un bien</li>
                </ul>
              </section>
            </div>
          </div>
          <section class="a2-bloc a2-biens piece">
            <div class="a2-bloc-t"><h4>Mes biens</h4><span class="lien-voir">Voir les 4 biens</span></div>
            <div class="biens">
              <article class="bien" id="b-camille"><img src="/accueil/img/salon-mini.webp" width="60" height="50" alt="" loading="lazy"><div><b>T2, Lyon 3e</b><span>Camille Martin, <span class="num">780&#8239;€</span></span></div><em class="etat attendu">Attendu</em></article>
              <article class="bien" id="b-hugo"><img src="/accueil/img/fauteuil-mini.webp" width="60" height="50" alt="" loading="lazy"><div><b>Studio, Nantes</b><span>Hugo Lefèvre, <span class="num">520&#8239;€</span></span></div><em class="etat paye">Payé</em></article>
              <article class="bien" id="b-ines"><img src="/accueil/img/edl-mini.webp" width="60" height="50" alt="" loading="lazy"><div><b>T3, Montpellier</b><span>Inès Moreau, <span class="num">970&#8239;€</span></span></div><em class="etat attendu">Attendu</em></article>
            </div>
          </section>
        </div>
        <div class="notif" id="notif" hidden><span class="notif-ic" aria-hidden="true">€</span><div><b>Virement reçu</b><span class="num">C. Martin, 780,00&#8239;€</span></div></div>
        <div class="quit" id="quit" hidden><b>Quittance</b><span>Octobre 2026</span><i></i><i></i><i class="court"></i></div>
        <div class="lettre" id="lettre" hidden>
          <div class="lettre-feuille">
            <p class="lettre-objet">Objet : loyer d’octobre</p>
            <p>Madame Moreau,</p>
            <p>Sauf erreur de ma part, le loyer d’octobre de 970,00&#8239;€ ne m’est pas encore parvenu. Pourriez-vous vérifier votre virement ?</p>
            <p>Bien cordialement,<br><span class="sig">Claire Dubois</span></p>
          </div>
          <div class="lettre-acts"><span class="lettre-a">Par email à Inès Moreau</span><button type="button" class="mini-btn plein" id="l-btn" tabindex="-1">Envoyer</button></div>
        </div>
        <div class="toast" id="toast" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2 8.8-9.2"/></svg><span id="toast-t"></span></div>
        <svg class="curseur" id="curseur" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 8.2-6.3 1.3 3.6 6.9-2.6 1.3-3.6-6.9L5 18z" fill="#1D2433" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>
      </div>
    </div>
  </div>
  </section>

  
  <section class="fx" aria-labelledby="fx-t">
    <div class="fx-pin" id="fx-pin">
      <div class="in fx-haut">
        <h2 id="fx-t" class="mots">Tout Bailio, en sept moments.</h2>
        <nav class="fx-nav" id="fx-nav" aria-label="Moments de la location"></nav>
      </div>
      <div class="fx-piste" id="fx-piste"></div>
    </div>
  </section>

  
  <section class="cf" aria-labelledby="cf-t">
    <div class="in">
      <div class="tete-s">
        <h2 id="cf-t" class="mots">Vos données dorment en Suisse.</h2>
        <p class="monte">Chez Infomaniak, hébergeur suisse indépendant.</p>
      </div>
      <div class="cf-grille2">
        <article class="cf-geneve">
          <div class="suisse-carte" aria-hidden="true">
            <svg viewBox="0 0 320 200"><g class="courbes" fill="none" stroke="rgba(238,233,224,.16)" stroke-width="1"></g><circle class="onde o1" cx="196" cy="118" r="6"/><circle class="onde o2" cx="196" cy="118" r="6"/><circle cx="196" cy="118" r="5" fill="#F2B45C"/></svg>
          </div>
          <div class="cf-geneve-t">
            <h3>En Suisse.</h3>
            <p>Droit suisse, protection reconnue par l’Union européenne. La chaleur des serveurs chauffe des foyers.</p>
            <span class="infk">Hébergé par Infomaniak</span>
          </div>
        </article>
        <div class="cf-tuiles">
          <div class="cf-t"><b class="num">100&#8239;%</b><span>électricité<br>renouvelable</span></div>
          <div class="cf-t"><b class="num">0</b><span>donnée revendue,<br>jamais</span></div>
          <div class="cf-t"><b class="num">ISO</b><span>14001 et 50001,<br>certifié</span></div>
          <div class="cf-t"><b class="num">0&#8239;€</b><span>de vos loyers<br>ne passe par nous</span></div>
          <div class="cf-t large"><b class="num">7j/7</b><span>une vraie personne vous répond</span></div>
        </div>
        <p class="cf-source">Engagements publiés par Infomaniak (infomaniak.com, novembre 2026) : électricité renouvelable certifiée, chaleur des centres de données réutilisée, aucun accès aux données des clients sans demande explicite.</p>
      </div>
      </div>
    </div>
  </section>

  
  <section class="prix-s" id="tarifs" aria-labelledby="prix-t">
    <div class="in">
      <div class="tete-s">
        <h2 id="prix-t" class="mots">Combien vous économisez ?</h2>
        <p class="monte">Choisissez votre nombre de logements. ${P.trial}, sans carte bancaire.</p>
      </div>
      <div class="prix-grille">
        <div class="reglages monte">
          <label for="n-range" class="lab">Combien de logements louez-vous ?</label>
          <div class="stepper">
            <button type="button" id="n-moins" aria-label="Un logement de moins">−</button>
            <output id="n-out" class="num" for="n-range" aria-live="polite">3</output>
            <button type="button" id="n-plus" aria-label="Un logement de plus">+</button>
          </div>
          <div class="maisons" id="maisons" aria-hidden="true"></div>
          <input type="range" id="n-range" min="1" max="20" value="3" step="1">
          <div class="bascule" role="radiogroup" aria-label="Paiement">
            <button type="button" role="radio" aria-checked="false" data-p="mois">Au mois</button>
            <button type="button" role="radio" aria-checked="true" data-p="an">À l’année</button>
          </div>
        </div>
        <div class="resultats monte" aria-live="polite">
          <div class="ligne bailio"><b>Bailio</b><strong class="val num" id="v-bailio">0&#8239;€</strong><div class="piste"><i id="bar-bailio"></i></div></div>
          <div class="ligne qalimo"><b>Qalimo<span class="forfait" id="forfait">Forfait de 7 à 40 biens</span></b><strong class="val num" id="v-qalimo">0&#8239;€</strong><div class="piste"><i id="bar-qalimo"></i></div></div>
          <div class="ligne agence"><b>Une agence</b><strong class="val num" id="v-agence">0&#8239;€</strong><div class="piste"><i id="bar-agence"></i></div></div>
          <div class="gain2"><span class="g-lab">Vous économisez</span><strong class="num" id="g-agence">0&#8239;€</strong><span class="g-sous"><span id="g-per">par an</span>, face à une agence.</span><span class="g-pct num" id="g-pct">93&#8239;% moins cher</span></div>
        </div>
      </div>
      <p class="sources">Agence : 7&#8239;% d’un loyer de 750&#8239;€ par mois, dans la fourchette courante de 4 à 10&#8239;%. Qalimo : tarif public du 25&#8239;octobre 2026.</p>
    </div>
  </section>
<section class="fin" aria-label="Commencer">
    <div class="in fin-in">
      <h2 class="mots">Votre premier bail est prêt en dix minutes.</h2>
      <a class="btn soleil" href="/commencer">Créer mon bail</a>
      
    </div>
  </section>`
