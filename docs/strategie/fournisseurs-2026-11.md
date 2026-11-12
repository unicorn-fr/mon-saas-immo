# Fournisseurs tiers de Bailio : étude du 12 novembre 2026

Étude en lecture seule. Aucun compte créé, aucun devis demandé, aucun message envoyé.
Toutes les pages ont été consultées le 12 novembre 2026.

Règles de lecture :
- Un prix suivi d'une adresse vient de la page du fournisseur lue ce jour.
- « Sur devis, non public » : le fournisseur ne publie pas le prix. Rien n'est deviné.
- « Source tierce » : chiffre vu seulement sur un site de comparaison. À confirmer avant toute décision.
- « Non vérifié » : je n'ai pas pu lire la page officielle (page absente, PDF illisible ou accès refusé).
- Prix HT sauf mention contraire. Les livres sterling ne sont pas converties dans les sources ; dans le calcul final j'utilise 1 £ = 1,15 €, **taux supposé** à vérifier.

## Tableau récapitulatif

| Besoin | Fournisseur recommandé | Prix pour 100 logements | Ce qu'Enzo doit souscrire |
|---|---|---|---|
| 1. Agrégation bancaire DSP2 | Aucun pour l'instant (garder l'import CSV/OFX). Plus tard : Powens ou Bridge | Sur devis, non public (les six fournisseurs) | Rien maintenant. Quand la société existe : demander un devis à Powens et à Bridge (volume 50 à 150 comptes connectés) |
| 2. Signature électronique | Garder la signature en ligne de Bailio (simple). Si une signature avancée devient nécessaire : Yousign (devenu Youtrust) | Signature maison : 0 €. Docusign API Starter : 41 £/mois soit 492 £/an (≈ 566 €) ; Yousign API : sur devis, non public | Rien. Option : bac à sable gratuit de Yousign/Youtrust pour tester |
| 3. Recommandé électronique | AR24 | 20 envois par an × 3,99 € HT = 79,80 € HT par an | Compte AR24 à l'envoi, sans abonnement. Demander les conditions de l'API |
| 4. Emails transactionnels | Rester sur Infomaniak. Réserve prête : Scaleway TEM | Infomaniak : déjà payé. Scaleway TEM : 3 000 emails par an ≈ 0,75 € | Rien. Demander à Infomaniak de relever la limite (par écrit) ou ouvrir un compte TEM si les envois dépassent 200 ou 500 par 24 h |
| 5. Paiement de l'abonnement | Stripe (Mollie en second) | Stripe, carte EEE, 3,49 € : 0,30 € + 0,024 € de Billing par paiement, soit 32,65 €/mois pour 100 abonnements | Compte Stripe (SIRET exigé). Prélèvement SEPA à tester seulement pour l'offre annuelle |
| 6. Multidiffusion d'annonces | Rien : impossible sans statut professionnel | Sans objet | Rien. Garder « annonce prête à copier » et les liens de dépôt |
| 7. Assurance loyers impayés | Aucun courtage. Au mieux un lien d'information sans rémunération | Sans objet | Rien. Inscription ORIAS seulement si Enzo veut être payé pour une mise en relation |

Conclusion en trois lignes :
1. Bailio n'a rien à souscrire avant la création de la société, sauf Stripe (obligatoire pour encaisser) et, si besoin, AR24 à l'envoi.
2. Le gros poste futur est la banque DSP2, dont le prix n'est public chez personne.
3. Les achats d'abonnements « signature » et « multidiffusion » ne se justifient pas à ce stade.

---

## 1. Agrégation bancaire DSP2 (accès aux comptes, lecture seule)

### Comparatif

| Fournisseur | Prix public | Conditions d'accès | Conformité | Intégration | Source |
|---|---|---|---|---|---|
| Powens (ex-Budget Insight) | Sur devis, non public. Modèle hybride accès plus usage (source tierce) | Société nécessaire (non vérifié pour le détail). Contrat commercial | Powens SAS, établissement de paiement agréé ACPR, CIB 16948, agrément AISP/PISP passeporté (source tierce, à contrôler dans REGAFI) | Bac à sable gratuit en libre-service, API, SDK, widget de connexion | https://www.powens.com/products/pricing/ (la page a répondu 404 le 12/11 ; recherche), https://docs.powens.com/ |
| Bridge (Bankin') | Sur devis, non public (source tierce) | Contrat de souscription (CGS publiées) | Bridge est agréé ACPR pour l'information sur les comptes et l'initiation de paiement (source tierce). Entité : Perspecteev | Bac à sable (source tierce) | https://connect.bridgeapi.io/pdf/cgs_FR.pdf |
| Enable Banking (Finlande) | Volume selon comptes et paiements par mois, avec un minimum mensuel. Montant sur devis, non public | Compte et KYB entreprise exigés pour passer en production ; contrat signé avant de rendre l'application publique. Mode « restreint » gratuit : seulement ses propres comptes, usage individuel non commercial | Peut fonctionner avec la licence d'un TPP agréé ou fournir le cadre réglementaire (déduction à confirmer auprès d'eux) | Bac à sable et production de test sans contrat, API REST | https://enablebanking.com/docs/faq, https://enablebanking.com/docs/api/linked-accounts/ |
| Yapily | Bac à sable gratuit. Production sur devis, non public (une estimation tierce de 200 à 500 £/mois n'est pas confirmée) | Contrat commercial | Non vérifié | Console développeur, bac à sable | https://openbankingtracker.com/guides/free-open-banking-apis (source tierce) |
| Tink (Visa) | Sur devis, non public | Passage par un compte Enterprise après le bac à sable | Non vérifié | Console gratuite avec données de test | https://tink.com/faq/ |
| GoCardless Bank Account Data | Autrefois gratuit | **Nouvelles inscriptions fermées** selon une source tierce (dev.to). La page officielle d'annonce n'est pas claire sur ce point : elle renvoie vers la page du produit ou le commerce | Non vérifié | Sans objet | https://gocardless.com/bank-account-data/announcement |

À retenir :
- GoCardless Bank Account Data : le fichier CLAUDE.md note déjà la fermeture (juillet 2025). Je n'ai pas pu la confirmer sur une page officielle datée. À ne plus compter comme option.
- Aucun des six ne publie de grille. Le prix réel viendra d'un devis.
- Enable Banking permet de tester gratuitement en vrai sur son propre compte. Ce mode interdit d'ouvrir le service à des clients.

### Faut-il devenir agent d'un prestataire agréé, ou utiliser son propre agrément ?

Règle (ACPR, FAQ « devenir agent de PSP ») : un établissement de paiement peut mandater un agent à condition de le déclarer à l'ACPR. L'agent n'a pas à être agréé lui-même, mais le mandant reste responsable de ses actes. Source : https://acpr.banque-france.fr/sites/default/files/20220106_faq_devenir_un_agent_de_psp.pdf (via recherche, document non relu en entier).

Exemple trouvé : Azopio se présente comme agent de Powens dans ses mentions légales (https://www.azopio.com/us/legal-notice/). Les conditions de vente de Powens parlent de « Partner » pour ses clients. Je n'ai pas pu établir si « Partner » veut dire « agent ». À demander à Powens.

Pour Bailio :
- Demander son propre agrément (AISP) : disproportionné pour une seule personne (capital, assurance, dossier ACPR). À écarter.
- Utiliser un agrégateur agréé qui porte la responsabilité réglementaire : voie normale. Le propriétaire donne son consentement dans l'écran de l'agrégateur.
- Devenir agent déclaré : possible mais alourdit Bailio (déclaration à l'ACPR par le mandant, contrôle). À ne choisir que si l'agrégateur l'exige.
- Vérifier chaque agrément dans le registre REGAFI (https://www.regafi.fr) avant signature. Je n'ai pas interrogé REGAFI dans cette étude.

### Recommandation

1. Ne rien brancher avant d'avoir la société et au moins 100 logements payants. L'import CSV/OFX de Bailio fait déjà le rapprochement sans coût.
2. Demander un devis à Powens et à Bridge (deux entreprises françaises agréées), avec les questions : prix par compte connecté et par mois, minimum mensuel, statut juridique de Bailio (client, partenaire ou agent), hébergement, durée d'engagement.
3. Seuil de décision : avec un abonnement de 3,49 € et une banque branchée pour 50 % des logements, un prix de **0,70 € par compte connecté et par mois** coûte 0,35 € par logement, soit 10 % du prix. Au-delà, ce n'est pas rentable.

---

## 2. Signature électronique (simple et avancée, eIDAS)

### Comparatif

| Fournisseur | Prix | Accès | Conformité | Intégration | Source |
|---|---|---|---|---|---|
| Yousign (devenu Youtrust, la page yousign.com redirige vers youtrust.com) | API : trois formules (Plus, Pro, Scale), montants **sur devis, non public**. Une source tierce cite 104 € HT/mois en entrée, non confirmé | Devis | Signatures simple, avancée et qualifiée. Infrastructure ISO 27001 hébergée en Europe (déclaré par le fournisseur) | Bac à sable gratuit (essai de 40 jours annoncé), webhooks illimités dès le plan Plus. Pas de SDK nommé, documentation multilingue | https://youtrust.com/fr-fr/api |
| Docusign | API Starter 41 £/mois (40 enveloppes par mois), Intermediate 244 £/mois (100 par mois), Advanced 390 £/mois (page britannique). Facturation annuelle ou mensuelle. Plan Enhanced sur devis | Compte développeur gratuit, valeur juridique nulle ; mise en production après validation Docusign | Non vérifié pour l'hébergement des données | SDK officiels, API REST, webhooks. Bac à sable gratuit permanent | https://ecom.docusign.com/en-GB/plans-and-pricing/developer |
| Universign | API sur devis, non public. Packs tiers : 49 € HT les 25 (une source) contre 119 € HT les 25 (autre source) : chiffres contradictoires | Devis | Non vérifié | Non vérifié | https://www.universign.com/en/prices |
| Docage, Oodrive Sign | Non étudiés (aucune page officielle consultée) | | | | |

### Ce que dit le droit
Pour un bail d'habitation, la signature électronique simple suffit si elle identifie le signataire et lie la signature à l'acte. Bailio en propose déjà une, avec certificat et empreinte. Une signature avancée ou qualifiée apporte une preuve plus forte, rarement nécessaire pour un bail. À faire confirmer par un juriste avant d'en faire un argument commercial. Je n'ai pas relu le texte du règlement eIDAS ni de l'article 1367 du code civil dans cette étude.

### Vérification eIDAS
Une signature qualifiée exige un prestataire inscrit sur la liste de confiance (en France, liste validée par l'ANSSI, relayée par l'UE). Yousign déclare y figurer. Je n'ai pas pu confirmer l'inscription de Universign ni de Docusign sur la liste. À contrôler sur la liste de confiance de l'UE avant signature d'un contrat.

### Coût à 100, 300 et 1 000 logements (1 bail signé par logement et par an)
| Logements | Signatures par an | Par mois (moyenne) | Docusign publié | Par logement et par mois |
|---|---|---|---|---|
| 100 | 100 | 8 | Starter : 492 £/an ≈ 566 € | 0,47 € |
| 300 | 300 | 25 | Starter : même prix (mais pic d'été au-dessus de 40 possible) | 0,16 € |
| 1 000 | 1 000 | 83 | Intermediate : 2 928 £/an ≈ 3 367 € | 0,28 € |

Yousign : coût sur devis, non calculable.

### Recommandation
Ne rien souscrire. Garder la signature maison (0 € de coût tiers). Si un client exige une signature avancée, demander un devis à Yousign/Youtrust (acteur français, bac à sable gratuit). Docusign est le seul à publier un prix mais les enveloppes sont plafonnées par mois, ce qui gêne les pics de rentrée.

---

## 3. Lettre recommandée électronique qualifiée et recommandé papier en ligne

### Comparatif

| Fournisseur | Prix par envoi | Abonnement | API | Source |
|---|---|---|---|---|
| AR24 | Recommandé électronique : **3,99 € HT** (4,79 € indiqué à côté, probablement TTC). Recommandé papier en ligne : à partir de **8,53 € HT**, preuve de réception en plus **0,45 € HT**, 44 pages au plus | Aucun (« sans engagement »), des « packs » existent, détail non lu | Oui (rubrique « Intégration API »), prix de l'API non public | https://www.ar24.fr/tarifs/ |
| Maileva (La Poste) | Sur devis, non public (téléphone commercial) | Non public | Oui (documentation API existe) | https://www.maileva.com/tarifs |
| Merci Facteur | Non public sur la page officielle (404). Source tierce : l'offre Pro contient API REST et webhooks. Tarifs de référence La Poste, source tierce : R1 20 g 6,11 €, avis de réception 1,45 € | Non vérifié | Oui (offre Pro, source tierce) | https://www.lafabriquedunet.fr/logiciel/merci-facteur |

### Règle
Le recommandé électronique qualifié est équivalent au recommandé papier (article L100 du code des postes et des communications électroniques, cité par Enzo). Je n'ai pas pu relire le texte sur Légifrance. Point d'attention juridique : l'équivalence suppose que le destinataire ait accepté de recevoir des courriers par voie électronique. Pour un congé ou une mise en demeure envoyés à un locataire, il faut son accord écrit préalable, sinon le recommandé papier reste la voie sûre. À faire valider par un juriste. La qualification d'AR24 comme prestataire qualifié n'a pas été contrôlée sur la liste de confiance (AR24 publie sa « Politique et pratiques du service de recommandé électronique » : https://www.ar24.fr/wp-content/uploads/2023/06/Politique-et-pratiques-du-service-de-recommande-electronique_v1.0.8.pdf).

### Coût (0,2 recommandé par logement et par an, AR24 à 3,99 € HT)
| Logements | Envois par an | Coût par an | Par logement et par mois |
|---|---|---|---|
| 100 | 20 | 79,80 € HT | 0,066 € |
| 300 | 60 | 239,40 € HT | 0,066 € |
| 1 000 | 200 | 798,00 € HT | 0,066 € |

Aucune remise de volume publique. Avec du papier à 8,53 € HT (+ 0,45 €) : environ 0,14 € par logement et par mois.

### Recommandation
AR24, payé à l'envoi, sans abonnement. Demander sa grille API et ses remises avant d'intégrer. Garder le recommandé papier en ligne pour les locataires qui n'ont pas accepté le numérique.

---

## 4. Emails transactionnels

### Comparatif

| Fournisseur | Prix | Limites | Remarques | Source |
|---|---|---|---|---|
| Infomaniak Service Mail (déjà utilisé) | Prix de l'offre : non vérifié (page de tarifs absente) | **200 envois par 24 h (Starter), 500 (Premium)**, par adresse, fenêtre glissante. Relèvement possible par demande écrite justifiée pour une adresse payante | SMTP authentifié. Pas de suivi des rebonds par webhook. Newsletter recommandée pour l'envoi en masse | https://www.infomaniak.com/en/support/faq/2065/understanding-the-limits-on-outgoing-emails-per-24-hours |
| Brevo (société française) | Gratuit : 300 emails par jour ; Starter à environ 9 $/mois pour 5 000 (sources tierces, la page officielle n'a pas pu être lue) | 300 par jour en gratuit, mention « Sent with Brevo » sur le gratuit (source tierce) | API et webhooks (non relus) | https://www.brevo.com/fr/pricing/ |
| Postmark (États-Unis) | Gratuit 100 emails par mois ; 10 000 : 15 $ (Basic) ; 50 000 : 87 $ ; 125 000 : 222 $ | Pas de dépassement sur le gratuit | Réputé pour la délivrabilité. Hébergement hors UE : contrat de transfert nécessaire | https://postmarkapp.com/pricing |
| Scaleway TEM | 0,25 € les 1 000 emails (formule Essential, 300 emails inclus). Formule Scale : 80 €/mois, 100 000 emails, IP dédiée | Chaque destinataire compte pour un envoi | Entreprise française. Région d'hébergement non vérifiée | https://www.scaleway.com/fr/transactional-email-tem/ (via recherche) |

### Volumes de Bailio (30 emails par logement et par an)
| Logements | Emails par an | Moyenne par jour |
|---|---|---|
| 100 | 3 000 | 8 |
| 300 | 9 000 | 25 |
| 1 000 | 30 000 | 82 |

La moyenne est sous la limite d'Infomaniak. Le risque vient des pointes : les quittances partent le jour où le loyer est noté reçu. À 1 000 logements, plus de 500 quittances le même jour dépassent la limite d'une adresse. Avec Scaleway TEM, 30 000 emails coûtent 7,50 € par an.

### Faut-il changer ?
Non, pas maintenant. Infomaniak suffit jusqu'à environ 300 logements si les envois sont étalés. Prévoir un second canal (Scaleway TEM : français, au volume, sans abonnement) avant 300 logements, ou demander à Infomaniak de relever la limite par écrit. Surveiller les refus dans les journaux (`[email] envoi refusé`).

Point à vérifier : l'offre Starter ou Premium souscrite par Bailio (200 ou 500 par jour).

---

## 5. Paiement de l'abonnement de Bailio

### Comparatif des frais

| Fournisseur | Carte (EEE standard) | Prélèvement SEPA | Abonnements | TVA et factures | Source |
|---|---|---|---|---|---|
| Stripe | 1,5 % + 0,25 € (cartes premium EEE : 2,8 % + 0,25 €) | 0,35 € | Billing : 0,7 % du volume (formule à l'usage) | Stripe Tax : 0,5 % par transaction (sans code) ; Invoicing Starter : 0,4 % par facture payée | https://stripe.com/fr/pricing |
| Mollie | 1,80 % + 0,25 € (cartes EEE grand public) | 0,35 € | Supplément éventuel non confirmé (source tierce : 0,5 %) | Non vérifié | https://www.mollie.com/pricing (lu via recherche) |
| GoCardless (paiements) | Prix non relevé dans cette étude (page non consultée) | Non relevé | Non relevé | Non relevé | https://gocardless.com |
| Paddle (marchand de référence) | 5 % + 0,50 € par transaction, tout compris (taxe, factures, fraude) | Inclus | Inclus | Paddle est le vendeur légal et gère la TVA mondiale | https://www.paddle.com/pricing |
| Lemon Squeezy (racheté par Stripe en juillet 2024) | 5 % + 0,50 € (source tierce) | Inclus | Inclus | Marchand de référence. « Stripe Managed Payments » annoncé en 2026, tarif contradictoire selon les sources | https://dodopayments.com/blogs/paddle-vs-lemon-squeezy/ (source tierce) |

### Frais sur un abonnement de 3,49 € et de 34,90 €
Calcul : pourcentage × montant + fixe. Stripe avec Billing = pourcentage carte + 0,7 %.

| Fournisseur et moyen | 3,49 € | Part du prix | 34,90 € | Part du prix |
|---|---|---|---|---|
| Stripe carte (sans Billing) | 0,302 € | 8,7 % | 0,774 € | 2,2 % |
| Stripe carte + Billing | 0,327 € | 9,4 % | 1,018 € | 2,9 % |
| Stripe SEPA (sans Billing) | 0,350 € | 10,0 % | 0,350 € | 1,0 % |
| Stripe SEPA + Billing | 0,374 € | 10,7 % | 0,594 € | 1,7 % |
| Mollie carte | 0,313 € | 9,0 % | 0,878 € | 2,5 % |
| Mollie SEPA | 0,350 € | 10,0 % | 0,350 € | 1,0 % |
| Paddle ou Lemon Squeezy | 0,675 € | 19,3 % | 2,245 € | 6,4 % |

### Lecture
- À 3,49 € par mois, le coût fixe pèse 9 à 11 %. Le paiement annuel à 34,90 € ramène les frais à 1 à 3 %. Pousser l'offre annuelle améliore la marge.
- Si un propriétaire de plusieurs logements paie en un seul prélèvement mensuel, le fixe de 0,25 à 0,35 € se partage.
- Paddle et Lemon Squeezy doublent le coût d'un petit abonnement. Leur avantage (TVA mondiale) ne sert pas : Bailio vend à des particuliers en France, la TVA française se gère avec Stripe ou en facturation simple. À écarter.
- Mollie et Stripe sont équivalents sur les prix publiés. Stripe a l'avantage de Billing, Tax, Invoicing et de la documentation Node. Mollie est néerlandais.
- Conditions d'accès (Stripe, Mollie) : société ou entreprise individuelle avec SIRET, pièce d'identité, IBAN. Non relu en détail.
- Factures conformes : à produire pour chaque abonnement. Stripe Invoicing ou Billing le fait.

### Recommandation
Stripe, paiement par carte pour le mensuel, offre annuelle mise en avant, prélèvement SEPA en option pour l'annuel (frais fixes de 0,35 € sans effet sur 34,90 €).

---

## 6. Multidiffusion d'annonces vers Leboncoin, SeLoger et Bien'ici

### Ce que j'ai trouvé
| Acteur | Constat | Source |
|---|---|---|
| Leboncoin | Offres de diffusion pour professionnels par logiciel d'import (PackPrivilège, PackImpact +, PackSmart, PackRéférence, lancées en septembre 2024). Détail des tarifs et conditions d'éligibilité **non trouvé**. Aucune API publique officielle trouvée (affirmation d'un vendeur de scraper, à confirmer) | https://www.mysweetimmo.com/2024/09/23/pros-de-limmo-leboncoin-propose-4-nouvelles-solutions-de-diffusion-dannonces/ |
| SeLoger (Groupe AVIV) | Conditions générales pour les particuliers : annonce d'un bien unique, pas de mention d'un flux automatique. Une « Carte de prospection » est réservée aux professionnels partenaires. Le PDF des conditions (daté du 3 novembre 2026 d'après son nom de fichier) n'a pas pu être lu : les clauses sur l'automatisation ne sont **pas vérifiées** | https://www.seloger.com/cgs-annonceurs-particuliers |
| Bien'ici | Présenté comme le portail créé pour les professionnels depuis 2015. Offre agence à 249 €/mois pour 100 annonces dans un article de 2022 (ancien) | https://www.observatoiredelafranchise.fr/dossier-franchise/bien-ici-quand-les-professionnels-de-l-immobilier-unissent-leurs-forces-1283.htm (source tierce) |
| Ubiflow | Environ 100 € par an pour 1 000 annonces par flux XML, d'après son site (lu via recherche) | https://www.ubiflow.net/diffusion-annonces-vers-immo-route-diff-2462.htm |
| Netty, Apimo | Tarif sur demande, non public | https://www.appvizer.fr/construction/agence-immobiliere/apimo |
| Immo-Facile / AC3 | Non étudié (aucune page consultée) | |

### Carte professionnelle T
Je n'ai trouvé aucune page qui dise que la carte T est exigée pour recevoir un flux. La loi Hoguet (loi du 2 janvier 1970) vise celui qui prête son concours, de façon habituelle, à des opérations sur les biens d'autrui. Je n'ai pas relu le texte. Un propriétaire qui loue son propre bien n'est pas concerné ; un logiciel qui publie à la place du propriétaire contre rémunération est dans une zone à faire valider par un avocat.

### Ce qui est possible pour Bailio sans être agence
- Possible : rédiger l'annonce, la mettre en forme avec les mentions obligatoires, fournir le lien et les consignes de dépôt (déjà fait : texte prêt à copier, liens Leboncoin, SeLoger, PAP, Marketplace), recevoir les candidatures par le lien public de Bailio.
- Probablement impossible : dépôt automatique sur Leboncoin, SeLoger ou Bien'ici. Les flux et logiciels d'import sont vendus à des professionnels ; les comptes particuliers sont limités à un bien et à la saisie à la main.
- À ne pas faire : scraper ou piloter les sites avec un robot (conditions d'utilisation non lues, risque de blocage du compte du propriétaire).
- Option à étudier plus tard : demander par écrit à Leboncoin, SeLoger et Ubiflow s'ils acceptent un éditeur de logiciel qui diffuse **pour des particuliers**. Réponse inconnue.

---

## 7. Assurance loyers impayés et protection juridique

### Règle
- Code des assurances, article L511-1 : est intermédiaire d'assurance la personne qui, **contre rémunération**, exerce une activité d'intermédiation (présenter, proposer, aider à conclure un contrat).
- Article L512-1 : tout intermédiaire d'assurance doit être inscrit au registre unique tenu par l'ORIAS, à renouveler chaque année. Source : https://french-business-law.com/french-legislation-art/article-l512-1-of-the-french-insurance-code (traduction non officielle ; texte Légifrance non lu).
- L'absence d'inscription ne fait pas disparaître la qualification : la jurisprudence retient la fonction, pas le titre du contrat (analyse : https://www.labase-lextenso.fr/l-essentiel-droit-des-assurances/2021-n10/criteres-et-preuve-de-la-qualification-d-intermediaire-d-assurance-DAS200i6).
- L'« indicateur » (simple mise en relation) est défini à l'article R511-3. Je n'ai pas pu lire cet article. Le simple fait d'appeler un contrat « apport d'affaires » ne suffit pas.
- Droit de percevoir des commissions subordonné à l'inscription : https://www.labase-lextenso.fr/l-essentiel-droit-des-assurances/2026-n5/l-immatriculation-a-l-orias-le-droit-de-percevoir-des-commissions-DAS203e7

### Réponse pour Bailio
- Marque blanche ou courtage (Bailio propose, présente ou fait souscrire une garantie loyers impayés ou une protection juridique) : **inscription ORIAS nécessaire**, via un statut de courtier, d'agent ou de mandataire d'intermédiaire d'assurance rattaché à un assureur ou à un courtier. Frais et conditions : non vérifiés (voir https://orias.fr).
- Lien d'information sans rémunération ni aide à la souscription : pas de commission, donc hors de la définition de l'article L511-1. Rester prudent sur la formulation, et éviter d'orienter vers un seul assureur.
- Recommandation : ne rien faire tant que Bailio n'a pas de société et une consultation juridique. Les pages Aides (Visale, gratuite) couvrent déjà le besoin sans statut.

---

## Coût réel des services tiers par logement et par mois

### Hypothèses
- 1 bail signé par logement et par an (signature).
- 0,2 recommandé par logement et par an (AR24 à 3,99 € HT).
- 30 emails par logement et par an.
- Agrégation bancaire pour 50 % des logements.
- Prix en euros HT. Docusign converti à 1,15 €/£ (taux supposé).

### Détail par poste
| Poste | 100 logements | 300 logements | 1 000 logements |
|---|---|---|---|
| Signature, version maison | 0,00 € | 0,00 € | 0,00 € |
| Signature, Docusign publié | 0,47 € | 0,16 € | 0,28 € |
| Recommandé AR24 | 0,07 € | 0,07 € | 0,07 € |
| Emails (Infomaniak + marge Scaleway TEM à 0,25 €/1 000) | ≈ 0,00 € | ≈ 0,00 € | ≈ 0,00 € |
| Agrégation bancaire | sur devis, non public | sur devis, non public | sur devis, non public |

### Total par logement et par mois (sans banque, sans frais de paiement)
| Scénario | 100 | 300 | 1 000 |
|---|---|---|---|
| Signature maison (recommandé retenu) | 0,07 € | 0,07 € | 0,07 € |
| Avec Docusign publié | 0,54 € | 0,22 € | 0,35 € |

Soit, en proportion de l'abonnement de 3,49 € : signature maison 1,9 % ; avec Docusign 15,4 %, 6,3 % et 10,0 %.

### Banque : formule, car aucun prix public
Coût par logement et par mois = 0,5 × prix par compte connecté et par mois.
- À 0,70 € le compte : 0,35 € par logement (10 % de l'abonnement). C'est le plafond conseillé.
- À 1,00 € le compte : 0,50 € par logement (14 %).
- Un minimum mensuel (annoncé par Enable Banking, probable chez les autres, non confirmé) pèse beaucoup à 100 logements. Exemple : un minimum de 300 € par mois reviendrait à 3 € par logement, plus que l'abonnement. À clarifier avant tout engagement. Ce montant est un exemple de calcul, pas un prix.

### Frais de paiement de l'abonnement (hors demande, mais à intégrer)
| Moyen | Par logement et par mois (offre mensuelle 3,49 €, un paiement par logement) |
|---|---|
| Stripe carte | 0,30 € (0,33 € avec Billing) |
| Stripe SEPA | 0,35 € (0,37 € avec Billing) |

À 100 logements payés par carte avec Billing : 32,65 € par mois de frais. Si un propriétaire regroupe plusieurs logements dans un seul paiement, le coût baisse. En offre annuelle (34,90 €) : 1,02 € par an et par logement, soit 0,08 € par mois.

### Total « tout compris » indicatif (sans banque)
Signature maison, recommandé, emails, Stripe carte avec Billing : environ 0,07 + 0,33 = **0,40 € par logement et par mois**, soit 11 % du prix de 3,49 €. Avec une banque à 0,35 € : environ 0,75 € (21 %).

---

## Limites de cette étude
- Plusieurs pages officielles étaient inaccessibles le 12 novembre 2026 : tarifs Powens, Infomaniak Service Mail, Brevo, Scaleway, Merci Facteur, Maileva. Les chiffres de ces fournisseurs viennent de résumés de recherche ou de sources tierces, signalées comme telles.
- Je n'ai pas interrogé REGAFI, la liste de confiance de l'UE, ni Légifrance. Les points de droit (L100 CPCE, eIDAS, loi Hoguet, L511-1, R511-3) sont cités d'après des sources secondaires et à valider par un juriste.
- Le renommage de Yousign en Youtrust est affiché sur le site du fournisseur ; les contrats existants seraient inchangés selon une source tierce.
- Le taux de 1,15 €/£ est supposé.
