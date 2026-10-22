# Rapport de test par personas — Bailio

22 octobre 2026. Test mené dans un vrai navigateur (Chromium piloté par Playwright), en local, sur une base de test, en 1440 px (ordinateur), 820 px (tablette) et 375 px (téléphone). Aucun fichier de code n'a été modifié. Aucun email réel n'est parti : sans serveur d'envoi, les liens de connexion sont restés dans le journal de l'API.

**Limites :** le site en ligne (bailio.fr) n'est pas joignable depuis cet environnement : c'est la même version du code qui a été testée en local. La recherche d'adresse (Géoplateforme), l'indice IRL (Insee) et la lecture automatique des baux (Tesseract, installé en production mais pas ici) ne fonctionnent pas dans ce conteneur. Les constats qui en dépendent sont signalés. Les captures sont dans `rapport-captures/`.

---

## 1. Résumé exécutif

**Points forts**
1. **Le fond juridique est sérieux :** bail calqué sur le contrat type (rubriques I à XI, notice jointe, 24 pages propres), pièces interdites rappelées aux candidats, parcours d'impayé complet (relance, mise en demeure, caution, commissaire de justice, FSL).
2. **Le tunnel de création est simple et rassurant :** 5 écrans, gros champs, enregistrement automatique, aucune carte bancaire demandée, retour arrière et rechargement sans perte.
3. **Les données sont bien protégées :** aucun cookie ni traceur, accès aux données d'un autre compte refusé, fichiers piégés refusés, information RGPD présente sur chaque formulaire public.

**Problèmes**
1. **La quittance automatique est active par défaut** : sans réaction du propriétaire, une quittance (preuve de paiement) part même si le loyer n'est pas arrivé. Risque juridique réel, et contraire à ce qu'attendent Nadia et Marc.
2. **Promesse et réalité ne collent pas :** « 5 minutes, un bail prêt à signer » se termine par « la loi impose encore 12 mentions » (IRL, numéro ADEME, identifiant fiscal…). Plusieurs écrans se contredisent aussi : « Bail en cours » pour un brouillon, « loyers à jour » sur le tableau de bord quand la page Logements affiche 2 retards.
3. **La crédibilité ne suit pas pour les profils exigeants :** mentions légales sans adresse ni téléphone (société « en cours de création »), aucune page sécurité, aucun support humain joignable. Rien non plus pour un locataire qui cherche un logement.

---

## 2. Les personas

### 2.1 Jeanne, 72 ans, retraitée, tablette

**Parcours :** accueil (tablette) → « Créer mon bail gratuit » → 5 écrans du tunnel → email → lien reçu → « Votre bail est enregistré » → « Compléter mon bail » → page du logement → fiche du logement → conditions du bail.

| | |
|---|---|
| Compréhension (5 s) | Moyenne. Sur tablette, la photo de l'Arbre Blanc occupe tout le premier écran : le titre et le bouton n'apparaissent qu'après avoir fait défiler (`00-accueil-tab.jpg`). « Le bail juste » est un jeu de mots qu'elle ne comprend pas. |
| Parcours | Le tunnel lui va : une question par bloc, de gros boutons, « Enregistré » en haut, « Gratuit, sans carte bancaire » au moment de l'email. Ensuite, elle se perd. |
| UI | Textes de 18 px sur l'accueil, mais 45 éléments en 14 px. Champs de 60 px, bons pour la tablette. |
| Wording | Elle bloque sur « trimestre de référence de l'IRL », « numéro ADEME du DPE », « identifiant fiscal du logement », « classe climat (GES) ». |
| Fonctionnalités | Après le tunnel, elle lit trois chiffres qui se contredisent : « 12 mentions » (page de bienvenue), « Il manque : la classe énergie du DPE » (page du logement), « Fiche 25 % » et « Diagnostics : **4 à refaire** ». Elle n'a jamais fait de diagnostic : « à refaire » l'inquiète (`01-jeanne-9-logement.jpg`). Sur « Aujourd'hui », son logement est marqué « **Bail en cours** » alors que rien n'est signé (`01-jeanne-10-aujourdhui.jpg`). « Voir le brouillon » télécharge un fichier sans rien afficher : sur tablette, elle croit que rien ne s'est passé. |
| Valeur | Elle ne paierait rien seule. Avec l'aide d'un proche, un bail gratuit et conforme lui suffit. |
| Confiance | Rassurée : pas de carte, « offert », serveur en Suisse. |

✅ Tunnel court, gros champs, aucun paiement, rien de perdu.
❌ Le premier écran sur tablette ; le jargon de la fiche ; les chiffres contradictoires ; « Bail en cours » et « 4 à refaire ».

> « Au début c'était facile, comme un formulaire de la mairie. Et puis on me demande un numéro ADEME… Je vais attendre que mon neveu passe. »

**Note : 5/10**

### 2.2 Karim, 34 ans, technicien, studio meublé

**Parcours :** compte → accueil en 3 questions → « Ajouter un logement » (9 étapes, téléphone) → annonce → candidats → lien de candidature.

✅ L'annonce sort avec toutes les mentions obligatoires (loyer charges comprises, dépôt, DPE, dépenses d'énergie, « pas de frais d'agence ») et des liens vers Leboncoin, SeLoger, PAP et Facebook (`02-karim-3-annonce.jpg`). Il choisit les pièces demandées parmi celles que la loi autorise, voit la liste des pièces interdites, reçoit des candidatures notées sur des critères non discriminatoires. Le dépôt de 2 mois en meublé est calculé tout seul.
❌ Aucune photo dans l'annonce (« Ajoutez vos photos sur le site ») et aucune diffusion automatique : il recopie l'annonce sur chaque site. Pas d'agenda de visites. Contradiction sur la page Candidats : « **Aucune pièce jointe ne circule** » juste au-dessus de « Pièces demandées aux candidats » (`02-karim-4-candidats.jpg`). La garantie Visale n'est qu'évoquée, pas intégrée.

- Valeur : il gagne du temps sur l'annonce et le tri. Il paierait **5 à 10 € par mois**.
- Confiance : bonne.

> « L'annonce toute prête avec les mentions légales, franchement top. Mais je dois quand même tout recopier sur Leboncoin avec mes photos. »

**Note : 7/10**

### 2.3 Sophie, 45 ans, infirmière, veut UNIQUEMENT un bail

**Parcours :** tunnel en 1440 px → email → espace → brouillon PDF → (bail complet, données de test) → page « Prêt à signer ».

✅ Le PDF final est propre et conforme : 24 à 25 pages, rubriques I à XI du contrat type dans l'ordre, notice d'information jointe, paraphes en pied de page (`03-sophie-complet-page-01.jpg`). Il se signe au choix en ligne ou sur papier, avec une explication claire de la valeur de la signature électronique.
❌ Elle doit créer un compte. Le « suivi » est activé d'office (« Le suivi est activé. Vous recevrez un email avant chaque échéance ») alors qu'elle ne voulait rien configurer. Le **brouillon PDF n'est marqué nulle part comme brouillon** : 12 lignes « ________ », aucune mention « projet, non signable ». Elle pourrait l'imprimer et le faire signer incomplet. Les « 5 minutes » deviennent une demi-heure de fiche.

- Valeur : le bail gratuit et conforme la satisfait. Elle ne s'abonnera pas.
- Confiance : bonne, grâce aux références juridiques et au contrat type.

> « Le bail est nickel, je l'aurais payé 15 euros. Par contre je n'ai rien demandé, moi, pour les rappels par email. »

**Note : 6/10**

### 2.4 Marc, 52 ans, 8 logements dont une SCI

**Parcours :** 3 baux signés, 5 lots dans une SCI familiale (données de test) → Aujourd'hui → Logements → Tableau de bord → Argent → Structures → export comptable.

✅ La SCI est gérée (associés, parts, régime fiscal, chaque logement rattaché, durée et congé adaptés). Il trouve les immeubles regroupés, la répartition d'une dépense, la déclaration par structure, l'accès lecture seule pour le comptable, les actions groupées.
❌ **Indicateurs contradictoires :** la page Logements affiche « 2 loyers en retard » et « En retard de 18 jours », mais le Tableau de bord dit « Rien à signaler : **loyers à jour** » (`04-marc-patrimoine.jpg`, `04-marc-logements.jpg`). « Il vous reste 1 680 € » additionne des loyers attendus, pas encaissés. « Aujourd'hui » affiche **31 tâches** sur un compte neuf : il décroche. L'export comptable est un CSV de 7 colonnes, sans structure (SCI ou nom propre), sans locataire, sans séparation loyer et charges (`04-marc-export.csv`). Pas de synchronisation bancaire : il dépose ses relevés à la main.

- Valeur : réelle, mais trop de saisie pour 8 lots. Il paierait **15 à 25 € par mois** si l'export et la banque suivaient.

> « Le tableau de bord me dit que tout va bien et la page d'à côté que deux loyers manquent. Lequel je crois ? »

**Note : 6/10**

### 2.5 Patrick, 63 ans, plus de 20 lots, passe par une agence

**Parcours (2 minutes) :** accueil → Tarif → Mentions légales → Contact → Prix et remboursement → Confidentialité.

✅ Le ton est sobre, les références juridiques sont précises, la confidentialité est détaillée (10 900 caractères), et Infomaniak à Genève est cité comme hébergeur.
❌ **Mentions légales :** éditeur personne physique, sans adresse ni téléphone, « L'entreprise… est en cours de création » (`05-patrick-mentions-legales.jpg`). Pas de SIRET, pas d'assurance professionnelle, pas de médiateur. La page Contact se résume à un email, avec réponse « sous deux jours ouvrés ». Aucune page sécurité : sauvegardes, chiffrement, double authentification (la connexion se fait seulement par lien email). Bailio n'encaisse pas les loyers, ne gère pas les sinistres, ne propose pas d'assurance loyers impayés : il ne remplace pas une agence. « 9,99 € par mois » ne dit pas si c'est par compte ou par logement.

- Valeur : aucune pour lui aujourd'hui.

> « Une entreprise qui n'existe pas encore, sans adresse ni téléphone, pour mes vingt lots ? Non merci. Revenez me voir avec un Kbis. »

**Note : 3/10**

### 2.6 Laura, 29 ans, colocation de 3 chambres, téléphone

**Parcours (375 px) :** Aujourd'hui → logement → bail → locataires → nouveau bail. Test d'un second bail sur le même logement.

✅ Pages légères (environ 1 s, 1 à 3 écrans de haut), barre du bas claire avec le bouton « + », signalements et quittances depuis le téléphone.
❌ **La colocation se limite à un seul bail pour tous** (avec la clause de solidarité). Un second bail sur le même logement est accepté (une chambre par bail), mais la page du logement les mélange : le parcours de mise en location repart à « Terminer le bail » alors que le premier est signé. Rien n'existe sur les chambres (surface, loyer par chambre, parties communes). La fiche du logement et la création de bail sont longues à remplir au pouce.

- Valeur : utile pour les quittances. Elle paierait **5 €** si les chambres étaient gérées.

> « C'est joli et ça va vite, mais Bailio ne sait pas ce qu'est une chambre. Avec trois colocs qui arrivent à des dates différentes, je bricole. »

**Note : 5/10**

### 2.7 Nadia, 41 ans, locataire qui ne paie plus

**Parcours :** bail commencé en juillet, rien payé (données de test) → Aujourd'hui → « Que se passe-t-il ? » → « Mon locataire ne paie pas ».

✅ C'est le meilleur parcours du site (`07-nadia-3-parcours-impaye.jpg`) : « Loyers non réglés : juillet, août, septembre, octobre 2026 », puis cinq étapes dans l'ordre (relance amiable, mise en demeure pour 2 240 €, appel à la caution, commandement de payer avec le délai de six semaines, FSL, ADIL et CCAPEX). Les documents sont pré-remplis.
❌ **« Aujourd'hui » minimise la dette :** il annonce « Le loyer n'est pas arrivé (attendu le 4 oct.) » et « 0 reçu sur 1 », sans parler des trois mois précédents (`07-nadia-1-aujourdhui.jpg`). Faute de français : « Loyers **de octobre** ». Pas d'annuaire de commissaires de justice, ni d'explication de la suite (injonction de payer, résiliation, expulsion, trêve hivernale). Pas de lien vers une assurance loyers impayés. Enfin, la quittance automatique par défaut est dangereuse dans son cas (voir les sections 3 et 5).

- Valeur : forte, elle évite un rendez-vous chez l'avocat pour les premières étapes. Elle paierait **sans hésiter**.

> « Enfin quelqu'un qui me dit quoi faire et dans quel ordre. Mais sur l'accueil on dirait qu'il me doit un mois, alors que c'est quatre ! »

**Note : 7/10**

### 2.8 Thomas, 23 ans, étudiant, cherche un logement

**Parcours :** accueil en mobile → rien pour lui ; puis le lien de candidature qu'un propriétaire lui envoie.

✅ Le formulaire de candidature est excellent (`08-thomas-1-candidature.jpg`) : l'annonce est rappelée, aucun compte n'est demandé, le lien DossierFacile est mis en avant, les pièces que le propriétaire n'a pas le droit de demander sont listées, et le traitement de ses données est expliqué.
❌ **Bailio n'a rien pour un locataire qui cherche :** pas d'annonces, pas de recherche, pas de dossier réutilisable, aucune entrée « Vous êtes locataire ? » sur l'accueil. Il compare avec Leboncoin, SeLoger et DossierFacile, et repart. Petit défaut aussi : le formulaire parle de « **votre** propriétaire » alors qu'il n'est que candidat.

> « Je suis tombé sur le site, c'est que pour les proprios. Par contre le formulaire envoyé par la proprio du T2, propre et rapide. »

**Note : 2/10** en arrivant seul sur le site, **8/10** pour le formulaire de candidature.

### 2.9 La famille Benali, locataires, fuite sous l'évier

**Parcours (téléphone) :** lien du locataire envoyé par le propriétaire → « Signaler un problème » → « Fuite ou dégât des eaux » → description.

✅ Trois écrans simples. Le geste à faire s'affiche tout de suite (« Coupez l'arrivée d'eau… prévenez aussi votre assurance »), une fuite est toujours traitée comme urgente, les photos sont facultatives, et l'avancement se suit ensuite sur le lien (`09-benali-3-fuite.jpg`).
❌ **Nulle part on ne leur dit qui paie** (réparation locative à leur charge selon le décret 87-712, ou au propriétaire). C'était pourtant leur question. Pas de téléphone du propriétaire pour une urgence. Sans le lien, ils ne peuvent rien faire : impossible de retrouver Bailio par eux-mêmes.

> « C'était simple pour prévenir, mais on ne sait toujours pas si le plombier c'est pour nous ou pour lui. »

**Note : 6/10**

### 2.10 Hugo, 31 ans, développeur sceptique

**Tests :** pages privées sans session, email en majuscules, déconnexion pendant un formulaire, fichiers piégés, fichier trop gros, valeurs absurdes, liens devinés, données d'un autre compte, double clic, retour arrière (en partie lors de l'audit du 20 octobre).

✅ Une page privée sans session renvoie vers `/connexion`. Un email en majuscules mène au même compte. Le bail d'un autre compte renvoie 404, une API sans jeton 401, un lien de locataire inventé 404. Un faux PDF, un fichier HTML ou un .exe sont refusés avec un message clair. La déconnexion à distance affiche « Votre session a expiré. Reconnectez-vous. ». Le double clic et le retour arrière ne cassent rien, et le XSS n'est pas exécuté.
❌ Un fichier de 16 Mo envoyé au lien du locataire provoque une **erreur 500** au lieu d'un message « trop volumineux ». Le tunnel accepte une **date d'entrée en 1990**, un **loyer de 0,01 €** ou de **99 999 €**. L'API renvoie parfois des messages techniques (« Entrée invalide : booléen attendu, indéfini reçu »). Le premier loyer d'un bail commencé après le jour de paiement est daté avant le début du bail (voir la section 4).

> « Sécurité propre, ça m'a surpris. Par contre un bail qui commence en 1990 pour un centime, et une 500 sur un gros fichier : ça se valide. »

**Note : 7/10**

---

## 3. Synthèse transversale

| Problème | Personas |
|---|---|
| Le jargon après le tunnel (IRL, ADEME, GES, identifiant fiscal, zone tendue) et des étapes « à compléter » qui s'enchaînent | Jeanne, Sophie, Laura, Karim |
| Des chiffres ou statuts contradictoires d'un écran à l'autre (12 mentions, « il manque le DPE » ou 25 % ; « Bail en cours » pour un brouillon ; retards ou « loyers à jour » ; un mois de retard ou quatre) | Jeanne, Marc, Nadia |
| La quittance automatique active par défaut, qui part sans paiement constaté | Nadia, Marc, Sophie |
| Crédibilité de l'éditeur : pas d'adresse, de société, de téléphone, de page sécurité ni de support humain | Patrick, Marc, Jeanne |
| Ce qui se fait encore à la main : diffusion de l'annonce et photos, rapprochement bancaire, export comptable incomplet | Karim, Marc, Laura, Patrick |
| Rien pour les locataires en dehors des liens envoyés par le propriétaire | Thomas, Benali |
| Inscription et suivi imposés à qui ne veut qu'un bail | Sophie, Jeanne |
| Deux identités visuelles : accueil en serif noir et gris, espace en crème et bleu nuit, avec Cormorant | Patrick, Laura |

---

## 4. Bugs techniques

| # | Gravité | Bug | Reproduire |
|---|---|---|---|
| B1 | Haute | « Bail en cours » affiché pour un bail en préparation | Tunnel → lien email → `/espace` : bloc « Vos logements » (`01-jeanne-10-aujourdhui.jpg`) |
| B2 | Haute | Le Tableau de bord dit « loyers à jour » quand Logements et Aujourd'hui affichent des retards | Bail du 6 octobre, jour de paiement le 4, signé, rien encaissé → `/espace/logements` (« En retard de 18 jours ») puis `/espace/patrimoine` (« Rien à signaler ») |
| B3 | Haute | Le premier loyer d'un bail commencé après le jour de paiement est « attendu le 4 oct. », avant le début du bail (6 oct.), et compté en retard dès la signature | Même bail que B2 → Aujourd'hui : « Le loyer de … n'est pas arrivé (attendu le 4 oct.) » ; page du bail signé le jour même : « En retard de 18 jours » |
| B4 | Moyenne | « Aujourd'hui » ne montre que le dernier mois impayé (« 0 reçu sur 1 ») alors que 4 mois sont dus | Bail commencé en juillet, rien encaissé → `/espace` puis `/espace/baux/:id/parcours/UNPAID` |
| B5 | Moyenne | Erreur 500 (« Une erreur est survenue ») pour un fichier de plus de 15 Mo, au lieu d'un message clair (`LIMIT_FILE_SIZE` de multer non traité) | `POST /api/locataire/:code/insurance` avec un PDF de 16 Mo |
| B6 | Moyenne | Le tunnel accepte une date d'entrée en 1990 (bail déjà expiré) et un loyer de 0,01 € ou 99 999 € | `/commencer/loyer` : date 1990-01-01, loyer 0,01 → la relecture et l'email passent |
| B7 | Faible | Élision manquante : « Loyers de octobre » | `/espace` d'un compte avec un bail signé, carte du mois |
| B8 | Faible | « Diagnostics : 4 à refaire » pour des diagnostics jamais fournis | Page du logement après le tunnel (`01-jeanne-9-logement.jpg`) |
| B9 | Faible | Avec deux baux sur le même logement (colocation par chambre), le parcours de mise en location revient à l'étape du bail en préparation | Bail signé + second bail sur le même logement → page du logement |
| B10 | Faible | « Voir le brouillon » télécharge sans retour visible (tablette, téléphone) | Page de bienvenue → « Voir le brouillon » |
| B11 | Faible | Messages techniques de l'API (« Entrée invalide : booléen attendu, indéfini reçu ») | `POST /api/properties/:id/apply-link` sans `open` (pas atteignable depuis l'interface) |

Non reproduits ici à cause du réseau : la zone tendue et le DPE automatiques (la recherche d'adresse est bloquée, donc Bailio demande « Si la commune est en zone tendue »), l'IRL pré-rempli et la lecture automatique des baux.

---

## 5. Points juridiques et de conformité à vérifier

1. **Quittance automatique par défaut** (`receiptAutoOn`) : la quittance est la preuve du paiement, et elle n'est due que pour un loyer payé en totalité ; en cas de paiement partiel, c'est un simple reçu. En émettre une sans paiement constaté peut se retourner contre le bailleur dans un impayé. À faire valider par un juriste. Recommandation : désactivée par défaut, ou envoyée seulement après un loyer enregistré (à la main ou depuis le relevé). Sources : [Leocare](https://leocare.eu/fr/assurance-habitation-en-ligne/conseils/guide/quittance-loyer/), [LegalPlace](https://www.legalplace.fr/guides/demande-quittance-loyer/), [La Fabrique du Net](https://www.lafabriquedunet.fr/logiciels/tendances/quittance-de-loyer-modele).
2. **Mentions légales (LCEN, art. 6-III) :** pour une personne physique, elles exigent les nom, prénoms, domicile et téléphone ; pour une société, la dénomination, le siège, le capital et l'immatriculation. Aujourd'hui, ni adresse ni téléphone. À régler avant le lancement, de toute façon avant la première facture (avec le médiateur de la consommation, L612-1).
3. **Brouillon PDF sans mention « projet »** : un bail avec 12 blancs peut être imprimé et signé tel quel. Ajouter un filigrane « Projet, non signable » tant que des mentions essentielles manquent.
4. **Promesse publicitaire** « Cinq minutes de questions, et vous repartez avec un bail prêt à signer » et « Le bail est-il valable ? Oui » : à nuancer (les mentions manquantes, le DPE et les diagnostics restent à fournir), au regard des pratiques commerciales trompeuses (Code de la consommation, L121-2).
5. **Garde-fous des valeurs** : un bail avec une entrée dans le passé lointain ou un loyer dérisoire produit un document juridiquement absurde. Prévoir des alertes.
6. **Colocation par chambre** : deux baux sur le même logement sont acceptés sans les règles de la colocation à baux multiples (surface et décence par chambre, parties communes, assurance). À cadrer ou à bloquer.
7. **Information du locataire sur les réparations** : quand il signale un problème, lui indiquer la règle (décret 87-712, réparations locatives ; vétusté, malfaçon et force majeure à la charge du bailleur). Ce texte est déjà dans Bailio.
8. **Suivi activé d'office** (emails de rappel) : base légale à préciser dans `/confidentialite` (exécution du service), avec un réglage visible dès la page de bienvenue.
9. **RGPD :** RAS sur le fond (aucun traceur, information à la collecte, durées). Le chiffrement et les sauvegardes, qui existent (`deploy/vps/backup.sh`), ne sont décrits nulle part pour l'utilisateur.

---

## 6. Plan d'action priorisé

### P0 — à faire avant tout
1. Quittance automatique : désactivée par défaut, ou soumise à un loyer enregistré (point juridique 1).
2. Mentions légales complètes : adresse ou domiciliation, téléphone, puis la société dès son immatriculation (point juridique 2).
3. Corriger les indicateurs contradictoires sur les loyers (B2, B3, B4) : un seul calcul des retards pour Aujourd'hui, Logements et le Tableau de bord, et la dette totale affichée.

### P1 — fort impact utilisateur
1. « Bail en cours » réservé aux baux signés (B1).
2. Filigrane « Projet » sur le brouillon PDF tant que des mentions essentielles manquent.
3. Après le tunnel, un seul compteur cohérent (« Il reste N informations ») et une aide en une ligne sur chaque terme technique (où trouver le numéro ADEME, l'identifiant fiscal ; IRL pré-rempli).
4. Revoir la promesse « 5 minutes » de l'accueil et de la fin de page.
5. Garde-fous dans le tunnel : date d'entrée dans le passé, loyer hors de 50 à 10 000 € (B6).
6. Export comptable enrichi : structure, locataire, loyer hors charges et provisions séparés, une ligne par période.
7. « Aujourd'hui » plus lisible au-delà de 3 logements : regrouper les tâches (31 tâches → quelques groupes).
8. Première vue sur tablette : le message et le bouton avant la photo.
9. Une page « Sécurité et sérieux » (hébergement, sauvegardes, chiffrement, qui est derrière, comment nous joindre).

### P2 — amélioration et confort
1. Erreur 500 sur fichier trop gros → message clair (B5).
2. Colocation par chambre : soit la modéliser (chambres, baux multiples), soit l'interdire proprement (B9).
3. Réparations : « Qui paie ? » dans le signalement du locataire.
4. Harmoniser l'identité visuelle de l'accueil et de l'espace.
5. « Voir le brouillon » : ouvrir le PDF plutôt que le télécharger sur tablette et téléphone (B10).
6. Messages de l'API toujours en français courant (B11).
7. Annuaire et suite de la procédure d'impayé (commissaire de justice, injonction de payer, trêve hivernale).

### Quick wins (moins de 30 minutes chacun)
1. « Loyers d'octobre » : élision devant une voyelle (B7).
2. « Diagnostics : 4 à fournir » au lieu de « à refaire » quand rien n'a jamais été déposé (B8).
3. Supprimer « Aucune pièce jointe ne circule » de la page Candidats.
4. « 9,99 € par mois, par compte » (ou par logement) : préciser sur l'accueil.
5. Une ligne sur l'accueil : « Vous êtes locataire ? Constituez votre dossier sur DossierFacile » (lien de l'État).
6. « Votre propriétaire » → « le propriétaire » sur le formulaire de candidature.
7. Sur la page de bienvenue, un lien « Ne pas recevoir de rappels » à côté de « Le suivi est activé ».
8. Sous-titre de l'accueil : « Pour les propriétaires qui louent eux-mêmes ».

---

## 7. Fonctionnalités manquantes demandées

| Fonctionnalité | Personas | Nombre |
|---|---|---|
| Encaissement ou synchronisation bancaire automatique des loyers | Marc, Patrick, Laura, Nadia | 4 |
| Support humain joignable (téléphone, chat, rendez-vous) | Jeanne, Patrick, Nadia | 3 |
| Export comptable complet, par structure | Marc, Patrick | 2 |
| Assurance loyers impayés ou Visale intégrée | Karim, Nadia, Patrick | 3 |
| Diffusion de l'annonce avec photos, agenda de visites | Karim, Laura | 2 |
| Colocation par chambre | Laura, Karim | 2 |
| « Qui paie quoi » pour les réparations | Benali, Nadia | 2 |
| Espace ou entrée pour les locataires (dossier, suivi) | Thomas, Benali | 2 |
| Bail seul, sans compte ni suivi | Sophie, Jeanne | 2 |
| Double authentification, page sécurité | Patrick, Hugo | 2 |
| Mandat de gestion, gestion des sinistres (remplacer l'agence) | Patrick | 1 |
| Annuaire de commissaires de justice, suite de la procédure | Nadia | 1 |

**Repère de prix** (comparatifs éditoriaux de 2026, à revérifier) : Rentila a une formule gratuite et des offres à 4,90 € puis 9,90 € par mois pour un nombre illimité de biens ; BailFacile coûte environ 10 € par bien et par mois, 29 € par mois au-delà de 10 biens (avec support téléphonique). À 9,99 € par mois, Bailio se place dans la moyenne. Sa vraie différence, c'est le fond juridique, pas le prix. Sources : [BailFacile, comparatif](https://www.bailfacile.fr/comparatif-logiciel-gestion-locative), [Gérer seul, comparatif 2026](https://gererseul.com/quel-est-le-meilleur-logiciel-de-gestion-locative-pour-particulier-en-2026), [Investissement locatif avis, comparatif 2026](https://investissement-locatif-avis.fr/meilleurs-logiciels-gestion-locative-2026/), [bailpdf.com, Rentila](https://bailpdf.com/gestion-locative/rentila).
