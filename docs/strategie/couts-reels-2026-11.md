# Coûts réels de Bailio et marge par logement (15 novembre 2026)

Suite de `prix-2026-11.md`. [Vérifié] = page officielle lue ; [Estimation] = ordre de grandeur, à remplacer par la facture réelle.

## 1. Le prix de Qalimo (qalimo.fr/tarif, page « mise à jour le 25 octobre 2026 », relue le 15 novembre 2026) [Vérifié]

| Formule | Prix TTC |
|---|---|
| 1 à 7 biens, à l'unité | 4,90 € par bien et par mois, ou 49 € par bien et par an |
| 7 à 40 biens, forfait pour tout le parc | 34,30 € par mois, ou 343 € par an |
| Plus de 40 biens | Sur devis |
| Pro (agences) | À partir de 50 € HT par mois |

En plus, à l'usage : signature électronique 2,90 € le document (packs de 3 à 7,80 €, de 5 à 11,50 €, de 10 à 20 €), recommandé avec AR 8,50 €, liasse fiscale 399 € le premier bien puis 149 €, GLI 2,75 % du loyer charges comprises, protection juridique 69 € par an. Satisfait ou remboursé 6 mois.

## 2. Le prix de Bailio, toujours sous Qalimo (décidé le 15 novembre 2026)

- 3,49 € par logement et par mois, ou 34,90 € par an (2 mois offerts) ; garage seul 1,49 € par mois.
- **Plafond : jamais plus de 29,90 € par mois ou 299 € par an, dès 9 biens et jusqu'à 40.** Au-delà de 40 biens : sur devis, comme Qalimo.
- Premier mois offert, sans carte bancaire (un mois entier d'essai).
- Vérifié par un test (`client/src/config.test.ts`) : pour 1 à 40 biens, au mois et à l'année, Bailio coûte toujours moins que Qalimo, signature comprise chez nous et payante chez eux.

| Biens | Bailio par mois | Qalimo par mois | Bailio par an | Qalimo par an |
|---|---|---|---|---|
| 1 | 3,49 € | 4,90 € | 34,90 € | 49 € |
| 3 | 10,47 € | 14,70 € | 104,70 € | 147 € |
| 7 | 24,43 € | 34,30 € | 244,30 € | 343 € |
| 8 | 27,92 € | 34,30 € | 279,20 € | 343 € |
| 9 à 40 | 29,90 € | 34,30 € | 299 € | 343 € |

## 3. Ce que coûte Bailio chaque mois

### Coûts fixes : environ 235 € par mois (de 190 à 330 €), sans salaire

Repris de `prix-2026-11.md` : serveur VPS Infomaniak (≈ 9 €, [Vérifié]), messagerie (≈ 3 €, [Vérifié]), Swiss Backup (≈ 5 €, [Vérifié]), domaines, outils, expert-comptable (≈ 133 €), création de la SASU étalée (≈ 27 €), banque pro et RC pro (≈ 33 €), médiateur de la consommation (≈ 6 €). Seuls les trois premiers sont des prix lus ; le reste est [Estimation].

### Coûts par logement

| Poste | Par logement et par mois | Source |
|---|---|---|
| Paiement par carte (Stripe : 1,5 % + 0,25 €, Billing 0,7 %) | 0,33 € au mois pour un seul logement, 0,03 € pour 8 ; 0,08 € à l'année | [Vérifié] stripe.com/fr/pricing, une transaction par client |
| Emails (quittance, rappels, liens) | moins de 0,01 € | Infomaniak déjà payé jusqu'à 200 envois par jour et par adresse [Vérifié], puis Scaleway TEM ≈ 0,25 € les 1 000 [Vérifié dans fournisseurs-2026-11.md] |
| Stockage et sauvegarde (photos, PDF, pièces) | moins de 0,01 € | [Estimation] 100 Mo par logement et par an ; Swiss Backup 1 To ≈ 5 € par mois |
| **Total retenu, avec une large marge** | **0,05 € + les frais de carte** | |

Le seul vrai coût par logement, aujourd'hui, ce sont les frais de carte. D'où l'intérêt du paiement à l'année : une seule transaction.

### La TVA

Franchise en base jusqu'à 37 500 € de recettes par an [Vérifié, F21746], soit environ 900 logements payés au mois ou 1 070 à l'année. Au-delà, le prix affiché comprend la TVA : 3,49 € TTC = 2,91 € HT. C'est le coût le plus lourd à venir.

## 4. Ce qu'il reste par logement (avant coûts fixes)

| Biens du propriétaire | Prix par logement | Reste, payé au mois | Reste, payé à l'année | Reste après TVA (à l'année) |
|---|---|---|---|---|
| 1 | 3,49 € | 3,11 € | 2,77 € | 2,29 € |
| 3 | 3,49 € | 3,28 € | 2,79 € | 2,30 € |
| 8 | 3,49 € | 3,33 € | 2,79 € | 2,31 € |
| 9 (plafond) | 3,32 € | 3,17 € | 2,66 € | 2,19 € |
| 12 | 2,49 € | 2,37 € | 1,98 € | 1,63 € |
| 20 | 1,49 € | 1,40 € | 1,17 € | 0,96 € |
| 40 | 0,75 € | 0,67 € | 0,56 € | 0,45 € |

Le plafond garde chaque logement rentable, même à 40 biens. Mais pour ces grands comptes, il reste peu : un nouveau coût de plus de 0,45 € par logement les ferait passer à perte.

## 5. Seuils

- **Sans salaire** : environ 85 logements couvrent les 235 € de coûts fixes (marge moyenne de 2,80 €, paiement à l'année surtout).
- **Avec un salaire de 1 500 € net** (≈ 3 000 € de coût employeur) : environ **1 410 logements**, TVA comprise.
- **Serveur** : le VPS actuel suffit pour les premiers centaines de logements [Estimation] ; un serveur plus grand coûterait quelques dizaines d'euros par mois de plus, soit moins de 0,02 € par logement à 3 000 logements.

## 6. Jusqu'où peut-on ajouter des coûts sans être à perte

Marge restante par logement et par mois, après les coûts fixes de 235 € :

| Logements suivis | Marge par logement | Part des coûts fixes | **Nouveau coût possible par logement** |
|---|---|---|---|
| 100 | 2,80 € | 2,35 € | **0,45 €** |
| 300 | 2,80 € | 0,78 € | **2,02 €** |
| 1 000 (avec TVA) | 2,29 € | 0,24 € | **2,05 €** |
| 3 000 (avec TVA) | 2,29 € | 0,08 € | **2,21 €** |

Règle simple : **pas plus de 2 € de coût nouveau par logement et par mois**, et seulement une fois 300 logements atteints. Avant 100 logements, rien de plus de 0,45 €. Pour les comptes au plafond (20 à 40 biens), pas plus de 0,45 €.

### Ce que coûteraient les améliorations envisagées

| Amélioration | Coût | Par logement et par mois | Conseil |
|---|---|---|---|
| Recommandé électronique (AR24) | 3,99 € HT l'envoi [Vérifié] | ≈ 0,40 € pour un envoi par an | Le facturer à l'envoi, au prix coûtant : un compte au plafond ne le supporterait pas |
| Signature avancée (Yousign, Docusign) | Docusign API dès 41 £ par mois [Vérifié dans fournisseurs-2026-11.md] ; Yousign sur devis | quelques centimes dès 300 logements | Possible tout compris après 300 logements |
| Connexion bancaire DSP2 (Powens, Bridge) | Sur devis ; une estimation tierce de 200 à 500 £ par mois n'est pas confirmée | 0,80 à 1,90 € à 300 logements ; 0,25 à 0,60 € à 1 000 | Attendre 1 000 logements ou un devis au logement |
| Personne qui répond 7 jours sur 7 | Temps, pas d'argent tant qu'Enzo répond | | À chiffrer en salaire : voir le seuil de 1 410 logements |

## 7. À refaire

- Avec les vraies factures (comptable, banque, assurance) dès que la société existe.
- Après les 100 premiers clients : la vraie part de paiement à l'année, le vrai nombre de biens par propriétaire.
- À chaque changement de tarif de Qalimo : relire qalimo.fr/tarif et relancer `client/src/config.test.ts`.
