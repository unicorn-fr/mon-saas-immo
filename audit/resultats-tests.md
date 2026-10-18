# Résultats des tests automatiques

Généré par `tests/audit/rapport.mjs` le 18/10/2026 13:29:00.

**16062 vérifications** : 15581 OK, 3 KO, 478 à améliorer.

## Par appareil

| Appareil | Moteur utilisé | Vérifications | KO | À améliorer |
|---|---|---|---|---|
| iPhone portrait (Safari/WebKit) | moteur chromium (émulation de l’appareil, webkit non installé) | 1526 | 1 | 87 |
| iPhone paysage (Safari/WebKit) | moteur chromium (émulation de l’appareil, webkit non installé) | 1511 | 1 | 88 |
| Android portrait (Chrome) | moteur chromium | 1513 | 0 | 87 |
| Android paysage (Chrome) | moteur chromium | 1537 | 1 | 96 |
| iPad portrait (Safari/WebKit) | moteur chromium (émulation de l’appareil, webkit non installé) | 1389 | 0 | 52 |
| iPad paysage (Safari/WebKit) | moteur chromium (émulation de l’appareil, webkit non installé) | 1447 | 0 | 60 |
| Chrome 1366 px | moteur chromium | 1219 | 0 | 0 |
| Chrome 1920 px | moteur chromium | 1209 | 0 | 0 |
| Firefox 1366 px | moteur chromium (émulation de l’appareil, firefox non installé) | 1177 | 0 | 2 |
| Firefox 1920 px | moteur chromium (émulation de l’appareil, firefox non installé) | 1177 | 0 | 2 |
| Safari 1366 px (WebKit) | moteur chromium (émulation de l’appareil, webkit non installé) | 1177 | 0 | 2 |
| Safari 1920 px (WebKit) | moteur chromium (émulation de l’appareil, webkit non installé) | 1180 | 0 | 2 |

## Par gravité (KO et à améliorer)

| Gravité | Nombre |
|---|---|
| Bloquant | 0 |
| Majeur | 0 |
| Mineur | 300 |
| Cosmétique | 181 |

## Anomalies et points à améliorer (167 constats distincts)

| Gravité | Statut | Page | Élément | Action | Attendu | Obtenu | Appareils | Capture |
|---|---|---|---|---|---|---|---|---|
| Mineur | À améliorer | Accès partagés (/espace/compte/acces) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 2 élément(s) entre 24 et 44 px : a « Mon compte » 85×32 ; button « Retirer l’accès » 96×32 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Accès partagés (/espace/compte/acces) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 3 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Mon compte » 85×32 ; button « Retirer l’accès » 96×32 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Accessibilité (/accessibilite) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 | Android paysage (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Accueil (/) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 17 élément(s) entre 24 et 44 px : a « J’ai déjà un bail » 105×42 ; a « Tarif » 36×42 ; a « Se connecter » 89×42 ; button « Vide » 39×43 ; button « Meublé » 64×43 | Android paysage (Chrome), Android portrait (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Acte de caution (/espace/locataires/:code/caution) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Retour » 48×34 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Acte de caution (/espace/locataires/:code/caution) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 6 élément(s) entre 24 et 44 px : a « Retour » 48×34 ; a « ✓ Garant » 278×40 ; a « ✓ Engagement » 278×40 ; a « ✓ Durée et plafond » 278×40 ; a « ✓ Mentions » 278×40 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Actions groupées (/espace/actions) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 3 élément(s) entre 24 et 44 px : a « Aujourd’hui » 77×32 ; button « Demander les attestations d’assurance 1 » 781×26 ; input « on » 222×41 | Android paysage (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Actions groupées (/espace/actions) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 2 élément(s) entre 24 et 44 px : a « Aujourd’hui » 77×32 ; input « on » 222×41 | Android portrait (Chrome), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Actions groupées (/espace/actions) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 4 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Aujourd’hui » 77×32 ; button « Demander les attestations d’assurance 1 » 670×26 ; input « on » 222×41 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Aides et dispositifs (/espace/logements/:code/aides) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 6 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Studio Sète » 78×32 ; button « Visale, la garantie gratuite contre les impayés Bon à savoir » 781×26 ; button « Rénovation énergétique : MaPrimeRénov’ et éco-prêt Bon à sav » 781×26 ; button « Aide au logement de votre locataire versée à vous Bon à savo » 781×26 | Android paysage (Chrome), iPad portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Aides et dispositifs (/espace/logements/:code/aides) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 2 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Studio Sète » 78×32 | Android portrait (Chrome), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Aides et dispositifs (/espace/logements/:code/aides) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 6 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Logements » 75×32 ; a « Studio Sète » 78×32 ; button « Visale, la garantie gratuite contre les impayés Bon à savoir » 670×26 ; button « Rénovation énergétique : MaPrimeRénov’ et éco-prêt Bon à sav » 670×26 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Aides et dispositifs (/espace/logements/:code/aides) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 5 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Studio Sète » 78×32 ; button « Visale, la garantie gratuite contre les impayés Bon à savoir » 671×26 ; button « Rénovation énergétique : MaPrimeRénov’ et éco-prêt Bon à sav » 671×26 ; button « Aide au logement de votre locataire versée à vous Bon à savo » 671×26 | iPhone paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Annonce (/espace/logements/:code/annonce) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 9 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Le logement » 83×32 ; button « Ouvrir » 45×34 ; button « Copier l’annonce » 144×38 ; a « Leboncoin » 101×38 | Android paysage (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Annonce (/espace/logements/:code/annonce) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 8 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Le logement » 83×32 ; button « Ouvrir » 45×34 ; button « Copier l’annonce » 144×38 ; a « Leboncoin » 101×38 | Android portrait (Chrome), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Annonce (/espace/logements/:code/annonce) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 10 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Logements » 75×32 ; a « Le logement » 83×32 ; button « Ouvrir » 45×34 ; button « Copier l’annonce » 144×38 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Argent (/espace/argent) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 3 élément(s) entre 24 et 44 px : button « Année précédente » 30×30 ; button « Année suivante » 30×30 ; a « Facture en photo » 115×32 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Argent (/espace/argent) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 4 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; button « Année précédente » 30×30 ; button « Année suivante » 30×30 ; a « Facture en photo » 115×32 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Aujourd’hui (/espace) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 6 élément(s) entre 24 et 44 px : button « Voir toutes les étapes » 157×34 ; button « Voir toutes les étapes » 157×34 ; button « Voir toutes les étapes » 157×34 ; a « Tout voir » 58×32 ; a « Studio Sète Payé » 781×34 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Aujourd’hui (/espace) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 7 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; button « Voir toutes les étapes » 157×34 ; button « Voir toutes les étapes » 157×34 ; button « Voir toutes les étapes » 157×34 ; a « Tout voir » 58×32 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Aujourd’hui (/espace) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 8 élément(s) entre 24 et 44 px : button « Que faire en cas d’impayé ? » 198×34 ; button « Le loyer est arrivé » 127×34 ; button « Voir toutes les étapes » 157×34 ; button « Voir toutes les étapes » 157×34 ; button « Voir toutes les étapes » 157×34 | iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Aujourd’hui (compte vide) (/espace) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Bail en signature (/espace/baux/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 10 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Studio Sète » 78×32 ; button « Signer maintenant » 154×38 ; button « Renvoyer le lien » 97×31 ; button « Renvoyer le lien » 97×31 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Bail en signature (/espace/baux/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 11 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Logements » 75×32 ; a « Studio Sète » 78×32 ; button « Signer maintenant » 154×38 ; button « Renvoyer le lien » 97×31 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Bail inexistant (/espace/baux/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Bail signé (/espace/baux/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 29 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Studio Sète » 78×32 ; a « Le faire le 6 octobre » 143×34 ; a « Compléter » 77×34 ; button « Voir les 9 pièces » 110×32 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Bail signé (/espace/baux/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 30 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Logements » 75×32 ; a « Studio Sète » 78×32 ; a « Le faire le 6 octobre » 143×34 ; a « Compléter » 77×34 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Bail signé (/espace/baux/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 28 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Studio Sète » 78×32 ; a « Compléter » 77×34 ; button « Voir les 9 pièces » 110×32 ; button « Loyer reçu » 101×38 | iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Bilan (/espace/argent/bilan) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Argent » 46×32 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Bilan (/espace/argent/bilan) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 2 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Argent » 46×32 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Candidats (/espace/logements/:code/candidats) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 19 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Le logement » 83×32 ; button « Choisir ce candidat » 161×38 ; button « Écarter » 80×38 ; button « Choisir ce candidat » 161×38 | Android paysage (Chrome) |  |
| Mineur | À améliorer | Candidats (/espace/logements/:code/candidats) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 13 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Le logement » 83×32 ; button « Choisir ce candidat » 342×38 ; button « Écarter » 342×38 ; button « Copier le lien » 118×38 | Android portrait (Chrome), iPhone paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Candidats (/espace/logements/:code/candidats) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 18 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Logements » 75×32 ; a « Le logement » 83×32 ; button « Choisir ce candidat » 161×38 ; button « Écarter » 80×38 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Candidats (/espace/logements/:code/candidats) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 18 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Le logement » 83×32 ; button « Choisir ce candidat » 161×38 ; button « Écarter » 80×38 ; button « Choisir ce candidat » 161×38 | iPad portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Candidats (/espace/logements/:code/candidats) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 14 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Le logement » 83×32 ; button « Choisir ce candidat » 320×38 ; button « Retenir » 320×38 ; button « Écarter » 320×38 | iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Candidature (/candidature/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 2 élément(s) entre 24 et 44 px : summary « Les seules pièces qu’un propriétaire peut vous demander » 678×42 ; input « on » 678×42 | Android paysage (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Carnet (/espace/carnet) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 3 élément(s) entre 24 et 44 px : a « Appeler » 54×32 ; button « Modifier » 56×32 ; button « Modifier » 56×32 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Carnet (/espace/carnet) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 4 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Appeler » 54×32 ; button « Modifier » 56×32 ; button « Modifier » 56×32 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Conditions (/conditions) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 | Android paysage (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Confidentialité (/confidentialite) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 | Android paysage (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Contact (/contact) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 | Android paysage (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Contrat (/espace/baux/:code/contrat) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Retour » 48×34 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Contrat (/espace/baux/:code/contrat) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 16 élément(s) entre 24 et 44 px : a « Retour » 48×34 ; a « ✓ Type » 278×40 ; a « ✓ Parties » 278×40 ; a « ✓ Logement » 278×40 ; a « ✓ Date et durée » 278×40 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Cookies (/cookies) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 | Android paysage (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Corbeille (/espace/corbeille) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Courriers (/espace/baux/:code/courriers) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 23 élément(s) entre 24 et 44 px : a « Retour » 48×34 ; a « Documents » 80×34 ; button « Quittance » 182×36 ; button « Révision » 182×36 ; button « Charges » 182×36 | Android paysage (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Courriers (/espace/baux/:code/courriers) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 3 élément(s) entre 24 et 44 px : a « Retour » 48×34 ; a « loi n° 89-462 du 6 juillet 1989, » 167×30 ; a « La quittance de loyer ↗ » 134×30 | Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Créer un bail (/espace/baux/nouveau) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « + Un autre logement » 660×34 | Android paysage (Chrome), Android portrait (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Déclaration des revenus (/espace/argent/declaration) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Argent » 46×32 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Déclaration des revenus (/espace/argent/declaration) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 2 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Argent » 46×32 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Dégradations (/espace/baux/:code/degradations) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Bail » 24×32 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Dégradations (/espace/baux/:code/degradations) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 2 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Bail » 24×32 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Documents (/espace/documents) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 20 élément(s) entre 24 et 44 px : button « Tous » 61×36 ; button « Baux » 63×36 ; button « Quittances » 105×36 ; button « États des lieux » 128×36 ; button « Factures » 89×36 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Documents (/espace/documents) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 21 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; button « Tous » 61×36 ; button « Baux » 63×36 ; button « Quittances » 105×36 ; button « États des lieux » 128×36 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Documents (compte vide) (/espace/documents) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 8 élément(s) entre 24 et 44 px : button « Tous » 61×36 ; button « Baux » 63×36 ; button « Quittances » 105×36 ; button « États des lieux » 128×36 ; button « Factures » 89×36 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Documents (compte vide) (/espace/documents) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 9 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; button « Tous » 61×36 ; button « Baux » 63×36 ; button « Quittances » 105×36 ; button « États des lieux » 128×36 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Emprunt (/espace/logements/:code/emprunt) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 2 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Studio Sète » 78×32 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Emprunt (/espace/logements/:code/emprunt) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 3 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Logements » 75×32 ; a « Studio Sète » 78×32 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | État des lieux (saisie) (/edl/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Quitter » 52×34 | Android paysage (Chrome), Android portrait (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 3 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Studio Sète » 78×32 ; a « Ou continuer sur cet appareil » 212×34 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 4 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Logements » 75×32 ; a « Studio Sète » 78×32 ; a « Ou continuer sur cet appareil » 212×34 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Fiche du locataire (/espace/locataires/:code/fiche) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 10 élément(s) entre 24 et 44 px : a « Retour » 48×34 ; button « À recevoir » 80×35 ; button « À recevoir » 80×35 ; button « À recevoir » 80×35 ; button « À recevoir » 80×35 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Fiche du locataire (/espace/locataires/:code/fiche) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 17 élément(s) entre 24 et 44 px : a « Retour » 48×34 ; a « ✓ Identité » 278×40 ; a « ✓ Coordonnées » 278×40 ; a « ✓ Situation » 278×40 ; a « ✓ Colocation » 278×40 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Fiche du logement (/espace/logements/:code/fiche) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Retour » 48×34 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Fiche du logement (/espace/logements/:code/fiche) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 15 élément(s) entre 24 et 44 px : a « Retour » 48×34 ; a « ✓ Adresse et identifiant fiscal » 278×40 ; a « ✓ Type et régime » 278×40 ; a « ✓ Copropriété » 278×40 ; a « ✓ Construction et surface » 278×40 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Importer un bail (/importer) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Saisir mon bail » 105×34 | Android paysage (Chrome), Android portrait (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Lien du locataire (/locataire/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : input « on » 638×24 | Android paysage (Chrome), Android portrait (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Locataire (/espace/locataires/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 14 élément(s) entre 24 et 44 px : a « Locataires » 71×32 ; a « Modifier » 56×32 ; a « Acte de caution » 107×32 ; button « Renvoyer par email » 158×38 ; button « Courrier à imprimer » 162×38 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Locataire (/espace/locataires/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 15 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Locataires » 71×32 ; a « Modifier » 56×32 ; a « Acte de caution » 107×32 ; button « Renvoyer par email » 158×38 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Locataire (/espace/locataires/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 13 élément(s) entre 24 et 44 px : a « Locataires » 71×32 ; a « Modifier » 56×32 ; a « Acte de caution » 107×32 ; button « Demander par email » 166×38 ; button « Courrier à imprimer » 162×38 | iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Locataire au dossier incomplet (/espace/locataires/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 11 élément(s) entre 24 et 44 px : a « Locataires » 71×32 ; a « Modifier » 56×32 ; a « Indiquer la garantie » 781×34 ; button « Vérifier maintenant » 121×34 ; button « Renvoyer par email » 158×38 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Locataire au dossier incomplet (/espace/locataires/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 12 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Locataires » 71×32 ; a « Modifier » 56×32 ; a « Indiquer la garantie » 670×34 ; button « Vérifier maintenant » 121×34 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Locataire au dossier incomplet (/espace/locataires/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 10 élément(s) entre 24 et 44 px : a « Locataires » 71×32 ; a « Modifier » 56×32 ; a « Indiquer la garantie » 671×34 ; button « Renvoyer par email » 158×38 ; button « Courrier à imprimer » 162×38 | iPhone paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Locataire au dossier incomplet (/espace/locataires/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 9 élément(s) entre 24 et 44 px : a « Locataires » 71×32 ; a « Modifier » 56×32 ; a « Indiquer la garantie » 320×34 ; button « Renvoyer par email » 158×38 ; button « Courrier à imprimer » 162×38 | iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Locataires (/espace/locataires) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Locataires (compte vide) (/espace/locataires) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Logement — dossier (/espace/logements/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 12 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; button « Vue d’ensemble » 114×34 ; button « Dossier du logement » 150×34 ; button « Bail et locataire » 109×34 ; button « Travaux et dépenses » 146×34 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Logement — dossier (/espace/logements/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 13 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Logements » 75×32 ; button « Vue d’ensemble » 114×34 ; button « Dossier du logement » 150×34 ; button « Bail et locataire » 109×34 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Logement — travaux et dépenses (/espace/logements/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 8 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; button « Vue d’ensemble » 114×34 ; button « Dossier du logement » 145×34 ; button « Bail et locataire » 109×34 ; button « Travaux et dépenses » 152×34 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Logement — travaux et dépenses (/espace/logements/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 9 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Logements » 75×32 ; button « Vue d’ensemble » 114×34 ; button « Dossier du logement » 145×34 ; button « Bail et locataire » 109×34 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Logement (/espace/logements/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 10 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Reprendre l’état des lieux » 202×38 ; button « Voir toutes les étapes » 147×32 ; button « Vue d’ensemble » 118×34 ; button « Dossier du logement » 145×34 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Logement (/espace/logements/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 11 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Logements » 75×32 ; a « Reprendre l’état des lieux » 202×38 ; button « Voir toutes les étapes » 147×32 ; button « Vue d’ensemble » 118×34 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Logement inexistant (/espace/logements/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Logements (/espace/logements) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 2 élément(s) entre 24 et 44 px : a « Tableau de bord : ce qu’il vous reste chaque mois, et ce qui » 532×34 ; a « Répartir une dépense de l’immeuble » 243×32 | Android paysage (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Logements (/espace/logements) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Répartir une dépense de l’immeuble » 243×32 | Android portrait (Chrome), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Logements (/espace/logements) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 3 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Tableau de bord : ce qu’il vous reste chaque mois, et ce qui » 532×34 ; a « Répartir une dépense de l’immeuble » 243×32 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Logements (compte vide) (/espace/logements) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Mentions légales (/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 6 élément(s) entre 24 et 44 px : a « Tarif » 35×46 ; a « Conditions d'utilisation » 180×36 ; a « Confidentialité et données personnelles » 313×36 ; a « Cookies et stockage dans le navigateur » 307×36 ; a « Prix, rétractation et remboursement » 282×36 | Android paysage (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Mentions légales (/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 5 élément(s) entre 24 et 44 px : a « Conditions d'utilisation » 180×36 ; a « Confidentialité et données personnelles » 313×36 ; a « Cookies et stockage dans le navigateur » 307×36 ; a « Prix, rétractation et remboursement » 282×36 ; a « Accessibilité » 100×36 | Android portrait (Chrome), iPhone paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Mentions légales (/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 3 élément(s) entre 24 et 44 px : a « Conditions d'utilisation » 180×36 ; a « Prix, rétractation et remboursement » 282×36 ; a « Accessibilité » 100×36 | iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Mon compte (/espace/compte) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 7 élément(s) entre 24 et 44 px : a « Profil complet » 94×32 ; a « Ouvrir » 42×32 ; a « Gérer » 38×32 ; button « Tout exporter » 98×34 ; a « Corbeille » 65×34 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Mon compte (/espace/compte) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 7 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Profil complet » 94×32 ; a « Gérer » 38×32 ; button « Tout exporter » 98×34 ; a « Corbeille » 65×34 | iPad paysage (Safari/WebKit) |  |
| Mineur | KO | P1 Découvrir le site | Action principale | Voir sans défiler | « Créer mon bail » visible dès l’arrivée | Bouton sous la ligne de flottaison (y = 537 px, écran 360 px) | Android paysage (Chrome) | [voir](anomalies/android-paysage--P1-D-couvrir-le-site-Action-principale.jpg) |
| Mineur | KO | P1 Découvrir le site | Action principale | Voir sans défiler | « Créer mon bail » visible dès l’arrivée | Bouton sous la ligne de flottaison (y = 467 px, écran 340 px) | iPhone paysage (Safari/WebKit) | [voir](anomalies/iphone-paysage--P1-D-couvrir-le-site-Action-principale.jpg) |
| Mineur | KO | P1 Découvrir le site | Action principale | Voir sans défiler | « Créer mon bail » visible dès l’arrivée | Bouton sous la ligne de flottaison (y = 677 px, écran 664 px) | iPhone portrait (Safari/WebKit) | [voir](anomalies/iphone-portrait--P1-D-couvrir-le-site-Action-principale.jpg) |
| Mineur | À améliorer | Page 404 (/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 2 élément(s) entre 24 et 44 px : a « Tarif » 35×46 ; a « Retour à l'accueil » 132×36 | Android paysage (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Page 404 (/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Retour à l'accueil » 132×36 | Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 6 élément(s) entre 24 et 44 px : a « Que se passe-t-il ? » 130×32 ; a « Monsieur Lucas Garnier » 160×32 ; button « Préparer le document » 177×38 ; button « Faire l’état des lieux » 164×38 ; button « Enregistrer le départ » 169×38 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 7 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Que se passe-t-il ? » 130×32 ; a « Monsieur Lucas Garnier » 160×32 ; button « Préparer le document » 177×38 ; button « Faire l’état des lieux » 164×38 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 5 élément(s) entre 24 et 44 px : a « Que se passe-t-il ? » 130×32 ; a « Monsieur Lucas Garnier » 160×32 ; button « Préparer le document » 177×38 ; button « Préparer le document » 177×38 ; button « Préparer le document » 177×38 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 6 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Que se passe-t-il ? » 130×32 ; a « Monsieur Lucas Garnier » 160×32 ; button « Préparer le document » 177×38 ; button « Préparer le document » 177×38 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Prix et remboursement (/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 | Android paysage (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Profil du bailleur (/espace/compte/profil) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Retour » 48×34 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Profil du bailleur (/espace/compte/profil) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 7 élément(s) entre 24 et 44 px : a « Retour » 48×34 ; a « ✓ Identité » 278×40 ; a « ✓ Adresse » 278×40 ; a « ✓ Contact » 278×40 ; a « ✓ Mandataire » 278×40 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Que se passe-t-il ? (/espace/situations) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Relevé bancaire (/espace/argent/releve) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Argent » 46×32 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Relevé bancaire (/espace/argent/releve) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 2 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Argent » 46×32 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Répartir une dépense (/espace/argent/repartir) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Argent » 46×32 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Répartir une dépense (/espace/argent/repartir) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 2 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Argent » 46×32 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Reprendre un brouillon (lien expiré) (/reprendre) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 | Android paysage (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Signature électronique (/signer/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 4 élément(s) entre 24 et 44 px : input « on » 674×24 ; a « La signature électronique (Code civil, art. 1367) ↗ » 306×31 ; a « Règlement européen eIDAS ↗ » 183×31 ; a « Rédaction du bail ↗ » 122×31 | Android paysage (Chrome), Android portrait (Chrome), iPad paysage (Safari/WebKit), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Structures (/espace/structures) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 4 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Modifier » 60×34 ; a « Studio Sète » 83×34 ; a « Studio Sète » 83×34 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Structures (/espace/structures) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 5 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Logements » 75×32 ; a « Modifier » 60×34 ; a « Studio Sète » 83×34 ; a « Studio Sète » 83×34 | iPad paysage (Safari/WebKit) |  |
| Mineur | À améliorer | Tableau de bord des logements (/espace/patrimoine) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 1 élément(s) entre 24 et 44 px : a « Logements » 75×32 | Android paysage (Chrome), Android portrait (Chrome), iPad portrait (Safari/WebKit), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Mineur | À améliorer | Tableau de bord des logements (/espace/patrimoine) | Cibles tactiles | Toucher au doigt | 44 × 44 px | 2 élément(s) entre 24 et 44 px : a « Bailio » 208×39 ; a « Logements » 75×32 | iPad paysage (Safari/WebKit) |  |
| Cosmétique | À améliorer | Accès partagés (/espace/compte/acces) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 5 texte(s) < 13 px : « Invitation envoyée » 12px ; « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Actions groupées (/espace/actions) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Aides et dispositifs (/espace/logements/:code/aides) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 6 texte(s) < 13 px : « Bon à savoir » 12px ; « Ne s’applique pas » 12px ; « Aujourd’hui » 12px ; « Logements » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Annonce (/espace/logements/:code/annonce) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Argent (/espace/argent) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 16 texte(s) < 13 px : « Janv. » 12px ; « Févr. » 12px ; « Mars » 12px ; « Avr. » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Aujourd’hui (/espace) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 6 texte(s) < 13 px : « Urgent, signalé par le locataire » 12px ; « Mise en location » 12px ; « Aujourd’hui » 12px ; « Logements » 12px | Android paysage (Chrome) |  |
| Cosmétique | À améliorer | Aujourd’hui (/espace) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 5 texte(s) < 13 px : « Mise en location » 12px ; « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px | Android portrait (Chrome), iPhone paysage (Safari/WebKit) |  |
| Cosmétique | À améliorer | Aujourd’hui (/espace) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 6 texte(s) < 13 px : « Loyer en retard » 12px ; « Mise en location » 12px ; « Aujourd’hui » 12px ; « Logements » 12px | iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Aujourd’hui (compte vide) (/espace) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Bail en signature (/espace/baux/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 6 texte(s) < 13 px : « Prêt à signer » 12px ; « En attente » 12px ; « Aujourd’hui » 12px ; « Logements » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Bail inexistant (/espace/baux/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Bail signé (/espace/baux/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 5 texte(s) < 13 px : « Signé » 12px ; « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Bilan (/espace/argent/bilan) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Candidats (/espace/logements/:code/candidats) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 8 texte(s) < 13 px : « Retenu » 12px ; « Dossier à compléter » 12px ; « Reçue le » 12px ; « 18/10/2026 » 12px | Android paysage (Chrome) |  |
| Cosmétique | À améliorer | Candidats (/espace/logements/:code/candidats) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 6 texte(s) < 13 px : « Retenu » 12px ; « Dossier à compléter » 12px ; « Aujourd’hui » 12px ; « Logements » 12px | Android portrait (Chrome), iPhone paysage (Safari/WebKit) |  |
| Cosmétique | À améliorer | Candidats (/espace/logements/:code/candidats) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 7 texte(s) < 13 px : « Reçue le » 12px ; « 18/10/2026 » 12px ; « Dossier à compléter » 12px ; « Aujourd’hui » 12px | iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Carnet (/espace/carnet) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Contact (/contact) | Lien externe « Enzo Mercier » | Clic | Ouvre un nouvel onglet (on garde Bailio ouvert) | Même onglet : https://www.linkedin.com/in/enzo-mercier/ | Firefox 1366 px, Firefox 1920 px, Safari 1366 px (WebKit), Safari 1920 px (WebKit) |  |
| Cosmétique | À améliorer | Corbeille (/espace/corbeille) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Courriers (/espace/baux/:code/courriers) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 10 texte(s) < 13 px : « Loyer » 12px ; « Pendant la location » 12px ; « Fin de location » 12px ; « Autres courriers » 12px | Android paysage (Chrome) |  |
| Cosmétique | À améliorer | Courriers (/espace/baux/:code/courriers) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 7 texte(s) < 13 px : « Loyer » 12px ; « Calculé par Bailio » 12px ; « Source : » 12px ; « loi n° 89-462 du 6 juillet 1989, » 12px | Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Créer un bail (/espace/baux/nouveau) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 1 texte(s) < 13 px : « Fiche à » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Déclaration des revenus (/espace/argent/declaration) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Dégradations (/espace/baux/:code/degradations) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Documents (/espace/documents) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Documents (compte vide) (/espace/documents) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Emprunt (/espace/logements/:code/emprunt) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Fiche du locataire (/espace/locataires/:code/fiche) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 11 texte(s) < 13 px : « Étape 6 » 12px ; « À recevoir » 12px ; « Source : » 12px ; « Décret n° 2015-1437 du 5 novembre 2015 » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Fiche du logement (/espace/logements/:code/fiche) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 6 texte(s) < 13 px : « Étape 12 » 12px ; « Source : » 12px ; « loi n° 89-462 du 6 juillet 1989, » 12px ; « art. » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Lien du locataire (/locataire/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 1 texte(s) < 13 px : « Reçu par votre bailleur » 12px | Android paysage (Chrome) |  |
| Cosmétique | À améliorer | Locataire (/espace/locataires/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 6 texte(s) < 13 px : « à compléter » 12px ; « En cours » 12px ; « Aujourd’hui » 12px ; « Logements » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Locataire au dossier incomplet (/espace/locataires/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 5 texte(s) < 13 px : « à compléter » 12px ; « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Locataires (/espace/locataires) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 7 texte(s) < 13 px : « À jour » 12px ; « Bail à signer » 12px ; « Sans bail » 12px ; « Aujourd’hui » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Locataires (compte vide) (/espace/locataires) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Logement — dossier (/espace/logements/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 7 texte(s) < 13 px : « À ajouter » 12px ; « Rangé » 12px ; « Fait par Bailio » 12px ; « Aujourd’hui » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Logement — travaux et dépenses (/espace/logements/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 5 texte(s) < 13 px : « Urgent » 12px ; « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px | Android paysage (Chrome) |  |
| Cosmétique | À améliorer | Logement — travaux et dépenses (/espace/logements/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Logement (/espace/logements/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 7 texte(s) < 13 px : « Loyer » 12px ; « Travaux » 12px ; « Bail » 12px ; « Aujourd’hui » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Logement inexistant (/espace/logements/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Logements (/espace/logements) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 6 texte(s) < 13 px : « Loué » 12px ; « Bail en préparation » 12px ; « Aujourd’hui » 12px ; « Logements » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Logements (compte vide) (/espace/logements) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Mentions légales (/:code) | Lien externe « linkedin.com/in/enzo-mercier » | Clic | Ouvre un nouvel onglet (on garde Bailio ouvert) | Même onglet : https://www.linkedin.com/in/enzo-mercier/ | Firefox 1366 px, Firefox 1920 px, Safari 1366 px (WebKit), Safari 1920 px (WebKit) |  |
| Cosmétique | À améliorer | Mon compte (/espace/compte) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 5 texte(s) < 13 px : « Cet appareil » 12px ; « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 7 texte(s) < 13 px : « À faire » 12px ; « Pas nécessaire » 12px ; « Plus tard » 12px ; « Aujourd’hui » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 6 texte(s) < 13 px : « Plus tard » 12px ; « Si besoin » 12px ; « Aujourd’hui » 12px ; « Logements » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Profil du bailleur (/espace/compte/profil) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 2 texte(s) < 13 px : « Étape 5 » 12px ; « Étape 6 » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Que se passe-t-il ? (/espace/situations) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Relevé bancaire (/espace/argent/releve) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Répartir une dépense (/espace/argent/repartir) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Structures (/espace/structures) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 6 texte(s) < 13 px : « En mon nom » 12px ; « Impôt sur le revenu » 12px ; « Aujourd’hui » 12px ; « Logements » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |
| Cosmétique | À améliorer | Tableau de bord des logements (/espace/patrimoine) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px | Android paysage (Chrome), Android portrait (Chrome), iPhone paysage (Safari/WebKit), iPhone portrait (Safari/WebKit) |  |

## Tous les éléments testés (1612 lignes, 16062 vérifications)

| Page | Élément | Action | Attendu | Statut | Appareils OK | Appareils KO / à améliorer | Obtenu (si KO) |
|---|---|---|---|---|---|---|---|
| Accès partagés (/espace/compte/acces) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Accès partagés (/espace/compte/acces) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Accès partagés (/espace/compte/acces) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Accès partagés (/espace/compte/acces) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Accès partagés (/espace/compte/acces) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Accès partagés (/espace/compte/acces) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Accès partagés (/espace/compte/acces) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 2 élément(s) entre 24 et 44 px : a « Mon compte » 85×32 ; button « Retirer l’accès » 96×32 |
| Accès partagés (/espace/compte/acces) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Accès partagés (/espace/compte/acces) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Accès partagés (/espace/compte/acces) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 5 texte(s) < 13 px : « Invitation envoyée » 12px ; « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px |
| Accès partagés (/espace/compte/acces) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Accès partagés (/espace/compte/acces) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Accès partagés (/espace/compte/acces) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Accès partagés (/espace/compte/acces) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Accès partagés (/espace/compte/acces) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Accès partagés (/espace/compte/acces) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Accès partagés (/espace/compte/acces) | Lien « Mon compte » | Clic | Ouvre /espace/compte | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Accessibilité (/accessibilite) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Accessibilité (/accessibilite) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Accessibilité (/accessibilite) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Accessibilité (/accessibilite) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Accessibilité (/accessibilite) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Accessibilité (/accessibilite) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Accessibilité (/accessibilite) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android portrait, iPhone paysage, iPhone portrait | Android paysage, iPad paysage, iPad portrait | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 |
| Accessibilité (/accessibilite) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Accessibilité (/accessibilite) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Accessibilité (/accessibilite) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Accessibilité (/accessibilite) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Accessibilité (/accessibilite) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Accessibilité (/accessibilite) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Accessibilité (/accessibilite) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Accessibilité (/accessibilite) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Accessibilité (/accessibilite) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Accessibilité (/accessibilite) | Lien « contact@bailio.fr » | Format du lien | Adresse ou numéro valide | OK | les 12 |  |  |
| Accueil (/) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Accueil (/) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Accueil (/) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Accueil (/) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Accueil (/) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Accueil (/) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Accueil (/) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 17 élément(s) entre 24 et 44 px : a « J’ai déjà un bail » 105×42 ; a « Tarif » 36×42 ; a « Se connecter » 89×42 ; button « Vide » 39×43 ; button « Meublé » 64×43 |
| Accueil (/) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Accueil (/) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Accueil (/) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Accueil (/) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Accueil (/) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Accueil (/) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Accueil (/) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Accueil (/) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Accueil (/) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Accueil (/) | Lien « Créer mon bail gratuit » | Clic | Ouvre /commencer | OK | les 12 |  |  |
| Accueil (/) | Lien « J’ai déjà un bail » | Clic | Ouvre /importer | OK | les 12 |  |  |
| Accueil (/) | Ancre « Tarif » | Cible de l’ancre | #tarifs existe | OK | les 12 |  |  |
| Accueil (/) | Lien « Se connecter » | Clic | Ouvre /connexion | OK | les 12 |  |  |
| Accueil (/) | Lien « Créer ce bail » | Clic | Ouvre /commencer | OK | les 12 |  |  |
| Accueil (/) | Lien « Importer le mien » | Clic | Ouvre /importer | OK | les 12 |  |  |
| Accueil (/) | Lien « Créer mon bail » | Clic | Ouvre /commencer | OK | les 12 |  |  |
| Accueil (/) | Lien « Essayer » | Clic | Ouvre /commencer | OK | les 12 |  |  |
| Accueil (/) | Lien « Bailio, accueil » | Clic | Ouvre / | OK | les 12 |  |  |
| Accueil (/) | Lien « Importer un bail » | Clic | Ouvre /importer | OK | les 12 |  |  |
| Accueil (/) | Lien « Contact » | Clic | Ouvre /contact | OK | les 12 |  |  |
| Accueil (/) | Lien « contact@bailio.fr » | Format du lien | Adresse ou numéro valide | OK | les 12 |  |  |
| Accueil (/) | Lien « Mentions légales » | Clic | Ouvre /mentions-legales | OK | les 12 |  |  |
| Accueil (/) | Lien « Conditions » | Clic | Ouvre /conditions | OK | les 12 |  |  |
| Accueil (/) | Lien « Confidentialité » | Clic | Ouvre /confidentialite | OK | les 12 |  |  |
| Accueil (/) | Lien « Cookies » | Clic | Ouvre /cookies | OK | les 12 |  |  |
| Accueil (/) | Lien « Prix et remboursement » | Clic | Ouvre /prix-et-remboursement | OK | les 12 |  |  |
| Accueil (/) | Lien « Accessibilité » | Clic | Ouvre /accessibilite | OK | les 12 |  |  |
| Accueil (/) | Bouton « Meublé » | Clic | Une réaction visible | OK | les 12 |  |  |
| Accueil (/) | Bouton « Garage » | Clic | Une réaction visible | OK | les 12 |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Retour » 48×34 |
| Acte de caution (/espace/locataires/:code/caution) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Ancre « ✓ Garant » | Cible de l’ancre | #guarantor existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Ancre « ✓ Engagement » | Cible de l’ancre | #engagement existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Ancre « ✓ Durée et plafond » | Cible de l’ancre | #duration existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Ancre « ✓ Mentions » | Cible de l’ancre | #mentions existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Acte de caution (/espace/locataires/:code/caution) | Ancre « ✓ Signature » | Cible de l’ancre | #signature existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Actions groupées (/espace/actions) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Actions groupées (/espace/actions) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Actions groupées (/espace/actions) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Actions groupées (/espace/actions) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Actions groupées (/espace/actions) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Actions groupées (/espace/actions) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Actions groupées (/espace/actions) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 2 élément(s) entre 24 et 44 px : a « Aujourd’hui » 77×32 ; input « on » 222×41 |
| Actions groupées (/espace/actions) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Actions groupées (/espace/actions) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Actions groupées (/espace/actions) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Actions groupées (/espace/actions) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Actions groupées (/espace/actions) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Actions groupées (/espace/actions) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Actions groupées (/espace/actions) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Actions groupées (/espace/actions) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Actions groupées (/espace/actions) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Actions groupées (/espace/actions) | Bouton « Demander les attestations d’assurance 1 » | Clic | Une réaction visible | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 2 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Studio Sète » 78×32 |
| Aides et dispositifs (/espace/logements/:code/aides) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 6 texte(s) < 13 px : « Bon à savoir » 12px ; « Ne s’applique pas » 12px ; « Aujourd’hui » 12px ; « Logements » 12px |
| Aides et dispositifs (/espace/logements/:code/aides) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Bouton « Visale, la garantie gratuite contre les impayés Bon à savoir » | Clic | Une réaction visible | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Bouton « Rénovation énergétique : MaPrimeRénov’ et éco-prêt Bon à savoir » | Clic | Une réaction visible | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Bouton « Aide au logement de votre locataire versée à vous Bon à savoir » | Clic | Une réaction visible | OK | les 12 |  |  |
| Aides et dispositifs (/espace/logements/:code/aides) | Bouton « Loc’Avantages, une réduction d’impôt contre un loyer modéré Ne s’applique pas » | Clic | Une réaction visible | OK | les 12 |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Ajouter un locataire (/espace/locataires/nouveau) | Lien « Fermer » | Clic | Ouvre /espace/locataires | OK | les 12 |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Ajouter un logement (/espace/logements/nouveau) | Lien « Fermer » | Clic | Ouvre /espace/logements | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 8 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Le logement » 83×32 ; button « Ouvrir » 45×34 ; button « Copier l’annonce » 144×38 ; a « Leboncoin » 101×38 |
| Annonce (/espace/logements/:code/annonce) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Annonce (/espace/logements/:code/annonce) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Annonce (/espace/logements/:code/annonce) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Annonce (/espace/logements/:code/annonce) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Annonce (/espace/logements/:code/annonce) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Lien « Le logement » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60 | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Lien « Ensuite : le message avec votre lien de candidature, à envoy » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60/candidats | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Bouton « Une provision, régularisée chaque année » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Annonce (/espace/logements/:code/annonce) | Bouton « Ouvrir » | Clic | Une réaction visible | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Bouton « Copier l’annonce » | Clic | Une réaction visible | OK | les 12 |  |  |
| Annonce (/espace/logements/:code/annonce) | Bouton « Un forfait » | Clic | Une réaction visible | OK | Android portrait, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Argent (/espace/argent) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Argent (/espace/argent) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Argent (/espace/argent) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Argent (/espace/argent) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Argent (/espace/argent) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Argent (/espace/argent) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Argent (/espace/argent) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 3 élément(s) entre 24 et 44 px : button « Année précédente » 30×30 ; button « Année suivante » 30×30 ; a « Facture en photo » 115×32 |
| Argent (/espace/argent) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Argent (/espace/argent) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Argent (/espace/argent) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 16 texte(s) < 13 px : « Janv. » 12px ; « Févr. » 12px ; « Mars » 12px ; « Avr. » 12px |
| Argent (/espace/argent) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Argent (/espace/argent) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Argent (/espace/argent) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Argent (/espace/argent) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Argent (/espace/argent) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Argent (/espace/argent) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Argent (/espace/argent) | Lien « Relevé bancaire Retrouver les loyers reçus » | Clic | Ouvre /espace/argent/releve | OK | les 12 |  |  |
| Argent (/espace/argent) | Lien « Déclaration Les montants à déclarer » | Clic | Ouvre /espace/argent/declaration | OK | les 12 |  |  |
| Argent (/espace/argent) | Lien « Bilan Résultat par logement » | Clic | Ouvre /espace/argent/bilan | OK | les 12 |  |  |
| Argent (/espace/argent) | Lien « Répartir Une dépense de l’immeuble » | Clic | Ouvre /espace/argent/repartir | OK | les 12 |  |  |
| Argent (/espace/argent) | Lien « Facture en photo » | Clic | Ouvre /espace/argent/facture | OK | les 12 |  |  |
| Argent (/espace/argent) | Bouton « Année précédente » | Clic | Une réaction visible | OK | les 12 |  |  |
| Argent (/espace/argent) | Bouton « Ajouter une dépense » | Clic | Une réaction visible | OK | les 12 |  |  |
| Argent (/espace/argent) | Fenêtre de « Ajouter une dépense » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Argent (/espace/argent) | Bouton « Exporter l’année Tableau pour votre comptable » | Clic | Une réaction visible | OK | les 12 |  |  |
| Argent (/espace/argent) | Bouton « Fuite sous l’évier Studio Sète · réparation 120,00 € » | Clic | Une réaction visible | OK | les 12 |  |  |
| Argent (/espace/argent) | Fenêtre de « Fuite sous l’évier Studio Sète · réparation 120,00 € » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Argent (/espace/argent) | Lien « Aujourd’hui 8 » | Clic | Ouvre /espace | OK | Safari 1920 px |  |  |
| Aujourd’hui (/espace) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 8 élément(s) entre 24 et 44 px : button « Que faire en cas d’impayé ? » 198×34 ; button « Le loyer est arrivé » 127×34 ; button « Voir toutes les étapes » 157×34 ; button « Voir toutes les étapes » 15 |
| Aujourd’hui (/espace) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Aujourd’hui (/espace) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Aujourd’hui (/espace) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 6 texte(s) < 13 px : « Loyer en retard » 12px ; « Mise en location » 12px ; « Aujourd’hui » 12px ; « Logements » 12px |
| Aujourd’hui (/espace) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Aujourd’hui (/espace) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Lien « Bailio » | Clic | Ouvre /espace | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Lien « Locataires » | Clic | Ouvre /espace/locataires | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Lien « Mon compte » | Clic | Ouvre /espace/compte | OK | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Aujourd’hui (/espace) | Lien « Que se passe-t-il ? » | Clic | Ouvre /espace/situations | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Lien « Tout voir » | Clic | Ouvre /espace/logements | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Lien « Studio Sète Payé » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60 | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, iPhone paysage, Safari 1366 px, Safari 1920 px |  |  |
| Aujourd’hui (/espace) | Lien « Studio Sète Bail en cours » | Clic | Ouvre /espace/logements/50ac5ac9-96a0-4710-bd2b-8a083cf3add7 | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Lien « Aujourd’hui » | Clic | Ouvre /espace | OK | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Aujourd’hui (/espace) | Lien « Logements » | Clic | Ouvre /espace/logements | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Lien « Documents » | Clic | Ouvre /espace/documents | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Lien « Argent » | Clic | Ouvre /espace/argent | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Bouton « Organiser l’intervention » | Clic | Une réaction visible | OK | Android paysage, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Aujourd’hui (/espace) | Fenêtre de « Organiser l’intervention » | Fermer avec Échap | La fenêtre se ferme | OK | Android paysage, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Aujourd’hui (/espace) | Bouton « Reprendre l’état des lieux » | Clic | Une réaction visible | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Bouton « Voir toutes les étapes » | Clic | Une réaction visible | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Bouton « Préparer le reçu » | Clic | Une réaction visible | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Bouton « Demander l’attestation » | Clic | Une réaction visible | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Bouton « Ajouter » | Clic | Une réaction visible | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Fenêtre de « Ajouter » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Aujourd’hui (/espace) | Lien « Aujourd’hui 3 » | Clic | Ouvre /espace | OK | Chrome 1366 px, Chrome 1920 px |  |  |
| Aujourd’hui (/espace) | Lien « Carnet » | Clic | Ouvre /espace/carnet | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Aujourd’hui (/espace) | Lien « CD Claire Dubois Mon compte » | Clic | Ouvre /espace/compte | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Aujourd’hui (/espace) | Lien « Aujourd’hui 7 » | Clic | Ouvre /espace | OK | Firefox 1366 px, Firefox 1920 px, Safari 1366 px, Safari 1920 px |  |  |
| Aujourd’hui (/espace) | Lien « Aujourd’hui 5 » | Clic | Ouvre /espace | OK | iPad paysage |  |  |
| Aujourd’hui (/espace) | Lien « Studio Sète En retard » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60 | OK | iPhone portrait |  |  |
| Aujourd’hui (/espace) | Bouton « Relire la relance » | Clic | Une réaction visible | OK | iPhone portrait |  |  |
| Aujourd’hui (/espace) | Bouton « Que faire en cas d’impayé ? » | Clic | Une réaction visible | OK | iPhone portrait |  |  |
| Aujourd’hui (/espace) | Bouton « Le loyer est arrivé » | Clic | Une réaction visible | OK | iPhone portrait |  |  |
| Aujourd’hui (compte vide) (/espace) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Aujourd’hui (compte vide) (/espace) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Aujourd’hui (compte vide) (/espace) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Aujourd’hui (compte vide) (/espace) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Aujourd’hui (compte vide) (/espace) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Aujourd’hui (compte vide) (/espace) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Aujourd’hui (compte vide) (/espace) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait | iPad paysage | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 |
| Aujourd’hui (compte vide) (/espace) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Aujourd’hui (compte vide) (/espace) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Aujourd’hui (compte vide) (/espace) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Aujourd’hui (compte vide) (/espace) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Aujourd’hui (compte vide) (/espace) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Aujourd’hui (compte vide) (/espace) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Aujourd’hui (compte vide) (/espace) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Aujourd’hui (compte vide) (/espace) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Aujourd’hui (compte vide) (/espace) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Aujourd’hui (compte vide) (/espace) | Lien « Ajouter un logement » | Clic | Ouvre /espace/logements/nouveau | OK | les 12 |  |  |
| Aujourd’hui (compte vide) (/espace) | Lien « J’ai déjà un bail signé Prenez-le en photo ou déposez le PDF » | Clic | Ouvre /importer | OK | les 12 |  |  |
| Aujourd’hui (compte vide) (/espace) | Lien « Aujourd’hui » | Clic | Ouvre /espace | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Aujourd’hui (compte vide) (/espace) | Lien « E e2e+1792317417006956@example.fr Mon compte » | Clic | Ouvre /espace/compte | OK | Chrome 1366 px, Chrome 1920 px, iPad paysage |  |  |
| Aujourd’hui (compte vide) (/espace) | Lien « E e2e+1792309156575455@example.fr Mon compte » | Clic | Ouvre /espace/compte | OK | Firefox 1366 px, Firefox 1920 px, Safari 1366 px, Safari 1920 px |  |  |
| Bail en signature (/espace/baux/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 10 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Studio Sète » 78×32 ; button « Signer maintenant » 154×38 ; button « Renvoyer le lien » 97×31 ; button « Renvoyer le lien » 97×31 |
| Bail en signature (/espace/baux/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Bail en signature (/espace/baux/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Bail en signature (/espace/baux/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 6 texte(s) < 13 px : « Prêt à signer » 12px ; « En attente » 12px ; « Aujourd’hui » 12px ; « Logements » 12px |
| Bail en signature (/espace/baux/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Bail en signature (/espace/baux/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Lien « Modifier une information » | Clic | Ouvre /espace/baux/628683b4-57f9-49dd-878b-3781595edcd8/contrat | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Lien « Lucas Garnier » | Clic | Ouvre /espace/locataires/7e55a59c-99b8-404a-a502-2bec38c0dc15 | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Lien « Monsieur Hervé Garnier » | Clic | Ouvre /espace/locataires/7e55a59c-99b8-404a-a502-2bec38c0dc15/caution | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Bouton « Ouvrir le bail » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Bouton « Télécharger le PDF » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Bouton « Le bail est signé sur papier » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Fenêtre de « Le bail est signé sur papier » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Bail en signature (/espace/baux/:code) | Bouton « Voir les 8 pièces » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bail inexistant (/espace/baux/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Bail inexistant (/espace/baux/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Bail inexistant (/espace/baux/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Bail inexistant (/espace/baux/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Bail inexistant (/espace/baux/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Bail inexistant (/espace/baux/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Bail inexistant (/espace/baux/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait | iPad paysage | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 |
| Bail inexistant (/espace/baux/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Bail inexistant (/espace/baux/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Bail inexistant (/espace/baux/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Bail inexistant (/espace/baux/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Bail inexistant (/espace/baux/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Bail inexistant (/espace/baux/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Bail inexistant (/espace/baux/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Bail inexistant (/espace/baux/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Bail inexistant (/espace/baux/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Bail inexistant (/espace/baux/:code) | Bouton « Réessayer » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 28 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Studio Sète » 78×32 ; a « Compléter » 77×34 ; button « Voir les 9 pièces » 110×32 ; button « Loyer reçu » 101×38 |
| Bail signé (/espace/baux/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Bail signé (/espace/baux/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Bail signé (/espace/baux/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 5 texte(s) < 13 px : « Signé » 12px ; « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px |
| Bail signé (/espace/baux/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Bail signé (/espace/baux/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Lien « Le faire le 6 octobre » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5/etat-des-lieux | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Lien « Compléter » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60/fiche#furniture | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Lien « Modifier une information » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5/contrat | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Lien « Créer un avenant » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5/contrat | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Lien « Quittances et courriers » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5/courriers | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Lien « Donner congé » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5/courriers | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Lien « Lucas Garnier » | Clic | Ouvre /espace/locataires/1025c24b-8e2b-4df3-b9ea-12f9b98bb5e9 | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Lien « Monsieur Hervé Garnier » | Clic | Ouvre /espace/locataires/1025c24b-8e2b-4df3-b9ea-12f9b98bb5e9/caution | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Bouton « Voir les 9 pièces » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Bouton « Loyer reçu » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Fenêtre de « Loyer reçu » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Bouton « Quittance » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Bouton « Annuler » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Bouton « Avis d’échéance de novembre 2026 » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Bouton « Ouvrir » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Bouton « Imprimer » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Bouton « Télécharger » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bail signé (/espace/baux/:code) | Bouton « Copier le lien » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bilan (/espace/argent/bilan) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Bilan (/espace/argent/bilan) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Bilan (/espace/argent/bilan) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Bilan (/espace/argent/bilan) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Bilan (/espace/argent/bilan) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Bilan (/espace/argent/bilan) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Bilan (/espace/argent/bilan) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Argent » 46×32 |
| Bilan (/espace/argent/bilan) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Bilan (/espace/argent/bilan) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Bilan (/espace/argent/bilan) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Bilan (/espace/argent/bilan) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Bilan (/espace/argent/bilan) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Bilan (/espace/argent/bilan) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Bilan (/espace/argent/bilan) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Bilan (/espace/argent/bilan) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Bilan (/espace/argent/bilan) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Bilan (/espace/argent/bilan) | Bouton « 2024 » | Clic | Une réaction visible | OK | les 12 |  |  |
| Bilan (/espace/argent/bilan) | Bouton « 2025 » | Clic | Une réaction visible | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 14 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Le logement » 83×32 ; button « Choisir ce candidat » 320×38 ; button « Retenir » 320×38 ; button « Écarter » 320×38 |
| Candidats (/espace/logements/:code/candidats) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Candidats (/espace/logements/:code/candidats) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Candidats (/espace/logements/:code/candidats) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 7 texte(s) < 13 px : « Reçue le » 12px ; « 18/10/2026 » 12px ; « Dossier à compléter » 12px ; « Aujourd’hui » 12px |
| Candidats (/espace/logements/:code/candidats) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Candidats (/espace/logements/:code/candidats) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Lien « Le logement » | Clic | Ouvre /espace/logements/50ac5ac9-96a0-4710-bd2b-8a083cf3add7 | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Lien « Rédiger l’annonce » | Clic | Ouvre /espace/logements/50ac5ac9-96a0-4710-bd2b-8a083cf3add7/annonce | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Bouton « Copier le message » | Clic | Une réaction visible | OK | les 12 |  |  |
| Candidats (/espace/logements/:code/candidats) | Bouton « Retenir » | Clic | Une réaction visible | OK | Android paysage, iPad portrait, iPhone portrait |  |  |
| Candidats (/espace/logements/:code/candidats) | Bouton « Copier le lien » | Clic | Une réaction visible | OK | les 12 |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Candidature — lien inconnu (/candidature/inconnu) | Bouton « Réessayer » | Clic | Une réaction visible | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android portrait, iPhone portrait | Android paysage, iPad paysage, iPad portrait, iPhone paysage | 2 élément(s) entre 24 et 44 px : summary « Les seules pièces qu’un propriétaire peut vous demander » 671×42 ; input « on » 671×42 |
| Candidature (/candidature/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Candidature (/candidature/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Candidature (/candidature/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Candidature (/candidature/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Candidature (/candidature/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Lien « contact@bailio.fr » | Format du lien | Adresse ou numéro valide | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Bouton « Madame » | Clic | Une réaction visible | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Bouton « Monsieur » | Clic | Une réaction visible | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Bouton « Une personne se porte caution » | Clic | Une réaction visible | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Bouton « Garantie Visale » | Clic | Une réaction visible | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Bouton « Assurance loyers impayés » | Clic | Une réaction visible | OK | les 12 |  |  |
| Candidature (/candidature/:code) | Bouton « Pas de garant » | Clic | Une réaction visible | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 3 élément(s) entre 24 et 44 px : a « Appeler » 54×32 ; button « Modifier » 56×32 ; button « Modifier » 56×32 |
| Carnet (/espace/carnet) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Carnet (/espace/carnet) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Carnet (/espace/carnet) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Carnet (/espace/carnet) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Carnet (/espace/carnet) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Lien « Appeler » | Format du lien | Adresse ou numéro valide | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Bouton « Ajouter un contact » | Clic | Une réaction visible | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Fenêtre de « Ajouter un contact » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Bouton « Modifier » | Clic | Une réaction visible | OK | les 12 |  |  |
| Carnet (/espace/carnet) | Fenêtre de « Modifier » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Conditions (/conditions) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Conditions (/conditions) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Conditions (/conditions) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Conditions (/conditions) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Conditions (/conditions) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Conditions (/conditions) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Conditions (/conditions) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android portrait, iPhone paysage, iPhone portrait | Android paysage, iPad paysage, iPad portrait | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 |
| Conditions (/conditions) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Conditions (/conditions) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Conditions (/conditions) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Conditions (/conditions) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Conditions (/conditions) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Conditions (/conditions) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Conditions (/conditions) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Conditions (/conditions) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Conditions (/conditions) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Conditions (/conditions) | Lien « mentions légales » | Clic | Ouvre /mentions-legales | OK | les 12 |  |  |
| Conditions (/conditions) | Lien « contact@bailio.fr » | Format du lien | Adresse ou numéro valide | OK | les 12 |  |  |
| Confidentialité (/confidentialite) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Confidentialité (/confidentialite) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Confidentialité (/confidentialite) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Confidentialité (/confidentialite) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Confidentialité (/confidentialite) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Confidentialité (/confidentialite) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Confidentialité (/confidentialite) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android portrait, iPhone paysage, iPhone portrait | Android paysage, iPad paysage, iPad portrait | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 |
| Confidentialité (/confidentialite) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Confidentialité (/confidentialite) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Confidentialité (/confidentialite) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Confidentialité (/confidentialite) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Confidentialité (/confidentialite) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Confidentialité (/confidentialite) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Confidentialité (/confidentialite) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Confidentialité (/confidentialite) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Confidentialité (/confidentialite) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Confidentialité (/confidentialite) | Lien « contact@bailio.fr » | Format du lien | Adresse ou numéro valide | OK | les 12 |  |  |
| Connexion (/connexion) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Connexion (/connexion) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Connexion (/connexion) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Connexion (/connexion) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Connexion (/connexion) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Connexion (/connexion) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Connexion (/connexion) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Connexion (/connexion) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Connexion (/connexion) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Connexion (/connexion) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Connexion (/connexion) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Connexion (/connexion) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Connexion (/connexion) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Connexion (/connexion) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Connexion (/connexion) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Connexion (/connexion) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Connexion (/connexion) | Lien « Bailio » | Clic | Ouvre / | OK | les 12 |  |  |
| Connexion (/connexion) | Lien « Créer mon espace » | Clic | Ouvre /inscription | OK | les 12 |  |  |
| Connexion (/connexion) | Bouton « Recevoir mon lien de connexion » | Clic | Une réaction visible | OK | les 12 |  |  |
| Contact (/contact) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Contact (/contact) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Contact (/contact) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Contact (/contact) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Contact (/contact) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Contact (/contact) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Contact (/contact) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android portrait, iPhone paysage, iPhone portrait | Android paysage, iPad paysage, iPad portrait | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 |
| Contact (/contact) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Contact (/contact) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Contact (/contact) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Contact (/contact) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Contact (/contact) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Contact (/contact) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Contact (/contact) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Contact (/contact) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Contact (/contact) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Contact (/contact) | Lien « contact@bailio.fr » | Format du lien | Adresse ou numéro valide | OK | les 12 |  |  |
| Contact (/contact) | Lien externe « Enzo Mercier » | Clic | Ouvre un nouvel onglet (on garde Bailio ouvert) | À améliorer |  | Firefox 1366 px, Firefox 1920 px, Safari 1366 px, Safari 1920 px | Même onglet : https://www.linkedin.com/in/enzo-mercier/ |
| Contrat (/espace/baux/:code/contrat) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Contrat (/espace/baux/:code/contrat) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Contrat (/espace/baux/:code/contrat) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Contrat (/espace/baux/:code/contrat) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Contrat (/espace/baux/:code/contrat) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Contrat (/espace/baux/:code/contrat) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Contrat (/espace/baux/:code/contrat) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Retour » 48×34 |
| Contrat (/espace/baux/:code/contrat) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Contrat (/espace/baux/:code/contrat) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Contrat (/espace/baux/:code/contrat) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Contrat (/espace/baux/:code/contrat) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Contrat (/espace/baux/:code/contrat) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Contrat (/espace/baux/:code/contrat) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Contrat (/espace/baux/:code/contrat) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Contrat (/espace/baux/:code/contrat) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Contrat (/espace/baux/:code/contrat) | Lien « Retour » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5 | OK | les 12 |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Type » | Cible de l’ancre | #type existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Parties » | Cible de l’ancre | #parties existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Logement » | Cible de l’ancre | #property existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Date et durée » | Cible de l’ancre | #dates existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Loyer » | Cible de l’ancre | #rent existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Encadrement » | Cible de l’ancre | #zone existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Locataire précédent » | Cible de l’ancre | #previous existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Révision » | Cible de l’ancre | #revision existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Charges » | Cible de l’ancre | #charges existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Première échéance » | Cible de l’ancre | #first existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Travaux » | Cible de l’ancre | #works existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Dépôt » | Cible de l’ancre | #deposit existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Clauses » | Cible de l’ancre | #clauses existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Annexes » | Cible de l’ancre | #annexes existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Contrat (/espace/baux/:code/contrat) | Ancre « ✓ Signature » | Cible de l’ancre | #signature existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Cookies (/cookies) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Cookies (/cookies) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Cookies (/cookies) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Cookies (/cookies) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Cookies (/cookies) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Cookies (/cookies) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Cookies (/cookies) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android portrait, iPhone paysage, iPhone portrait | Android paysage, iPad paysage, iPad portrait | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 |
| Cookies (/cookies) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Cookies (/cookies) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Cookies (/cookies) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Cookies (/cookies) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Cookies (/cookies) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Cookies (/cookies) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Cookies (/cookies) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Cookies (/cookies) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Cookies (/cookies) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Corbeille (/espace/corbeille) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Corbeille (/espace/corbeille) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Corbeille (/espace/corbeille) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Corbeille (/espace/corbeille) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Corbeille (/espace/corbeille) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Corbeille (/espace/corbeille) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Corbeille (/espace/corbeille) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait | iPad paysage | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 |
| Corbeille (/espace/corbeille) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Corbeille (/espace/corbeille) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Corbeille (/espace/corbeille) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Corbeille (/espace/corbeille) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Corbeille (/espace/corbeille) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Corbeille (/espace/corbeille) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Corbeille (/espace/corbeille) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Corbeille (/espace/corbeille) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Corbeille (/espace/corbeille) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Corbeille (/espace/corbeille) | Lien « Aujourd’hui 10 » | Clic | Ouvre /espace | OK | Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 3 élément(s) entre 24 et 44 px : a « Retour » 48×34 ; a « loi n° 89-462 du 6 juillet 1989, » 167×30 ; a « La quittance de loyer ↗ » 134×30 |
| Courriers (/espace/baux/:code/courriers) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Courriers (/espace/baux/:code/courriers) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Courriers (/espace/baux/:code/courriers) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 7 texte(s) < 13 px : « Loyer » 12px ; « Calculé par Bailio » 12px ; « Source : » 12px ; « loi n° 89-462 du 6 juillet 1989, » 12px |
| Courriers (/espace/baux/:code/courriers) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Courriers (/espace/baux/:code/courriers) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Révision » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Charges » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Attestation de loyer » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Quittance par email » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Impayés » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Assurance » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Entretien chaudière » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Dégradations » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Trouble de voisinage » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Détecteurs de fumée » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Reçu du dépôt » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Vente du logement loué » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Donner congé » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Congé du locataire » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Préavis d’un mois » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Solde de tout compte » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Sinistre : votre assureur » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Réclamation à un artisan » | Clic | Une réaction visible | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Reçu de paiement partiel » | Clic | Une réaction visible | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Avis d’échéance » | Clic | Une réaction visible | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Enregistrer le paiement » | Clic | Une réaction visible | OK | les 12 |  |  |
| Courriers (/espace/baux/:code/courriers) | Bouton « Voir la quittance » | Clic | Une réaction visible | OK | les 12 |  |  |
| Créer un bail (/espace/baux/nouveau) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Créer un bail (/espace/baux/nouveau) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Créer un bail (/espace/baux/nouveau) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Créer un bail (/espace/baux/nouveau) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Créer un bail (/espace/baux/nouveau) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Créer un bail (/espace/baux/nouveau) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Créer un bail (/espace/baux/nouveau) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « + Un autre logement » 358×34 |
| Créer un bail (/espace/baux/nouveau) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Créer un bail (/espace/baux/nouveau) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Créer un bail (/espace/baux/nouveau) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 1 texte(s) < 13 px : « Fiche à » 12px |
| Créer un bail (/espace/baux/nouveau) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Créer un bail (/espace/baux/nouveau) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Créer un bail (/espace/baux/nouveau) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Créer un bail (/espace/baux/nouveau) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Créer un bail (/espace/baux/nouveau) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Créer un bail (/espace/baux/nouveau) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Créer un bail (/espace/baux/nouveau) | Lien « Fermer » | Clic | Ouvre /espace | OK | les 12 |  |  |
| Créer un bail (/espace/baux/nouveau) | Lien « + Un autre logement » | Clic | Ouvre /espace/logements/nouveau | OK | les 12 |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Argent » 46×32 |
| Déclaration des revenus (/espace/argent/declaration) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Déclaration des revenus (/espace/argent/declaration) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Bouton « 2024 » | Clic | Une réaction visible | OK | les 12 |  |  |
| Déclaration des revenus (/espace/argent/declaration) | Bouton « 2026 » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dégradations (/espace/baux/:code/degradations) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Dégradations (/espace/baux/:code/degradations) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Dégradations (/espace/baux/:code/degradations) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Dégradations (/espace/baux/:code/degradations) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Dégradations (/espace/baux/:code/degradations) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Dégradations (/espace/baux/:code/degradations) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Dégradations (/espace/baux/:code/degradations) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Bail » 24×32 |
| Dégradations (/espace/baux/:code/degradations) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Dégradations (/espace/baux/:code/degradations) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Dégradations (/espace/baux/:code/degradations) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Dégradations (/espace/baux/:code/degradations) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Dégradations (/espace/baux/:code/degradations) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Dégradations (/espace/baux/:code/degradations) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Dégradations (/espace/baux/:code/degradations) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Dégradations (/espace/baux/:code/degradations) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Dégradations (/espace/baux/:code/degradations) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Dégradations (/espace/baux/:code/degradations) | Lien « Bail » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5 | OK | les 12 |  |  |
| Dégradations (/espace/baux/:code/degradations) | Bouton « Préparer l’état des lieux de sortie » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Documents (/espace/documents) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Documents (/espace/documents) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Documents (/espace/documents) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Documents (/espace/documents) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Documents (/espace/documents) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Documents (/espace/documents) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 20 élément(s) entre 24 et 44 px : button « Tous » 61×36 ; button « Baux » 63×36 ; button « Quittances » 105×36 ; button « États des lieux » 128×36 ; button « Factures » 89×36 |
| Documents (/espace/documents) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Documents (/espace/documents) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Documents (/espace/documents) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Documents (/espace/documents) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Documents (/espace/documents) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Documents (/espace/documents) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Documents (/espace/documents) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Documents (/espace/documents) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Documents (/espace/documents) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « Ajouter un document » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Fenêtre de « Ajouter un document » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « Bail Vide, meublé, étudiant ou mobilité, conforme au contrat type » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « Quittance Pour un mois, envoyée par email si vous le souhaitez » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Fenêtre de « Quittance Pour un mois, envoyée par email si vous le souhaitez » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « État des lieux D’entrée ou de sortie, sur téléphone » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Fenêtre de « État des lieux D’entrée ou de sortie, sur téléphone » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « Courrier Relance, révision, congé, dépôt de garantie » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Fenêtre de « Courrier Relance, révision, congé, dépôt de garantie » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « Baux » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « Quittances » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « États des lieux » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « Factures » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « Diagnostics » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « Courriers » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « Autres » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « Ouvrir » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « Télécharger » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (/espace/documents) | Bouton « Imprimer » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 8 élément(s) entre 24 et 44 px : button « Tous » 61×36 ; button « Baux » 63×36 ; button « Quittances » 105×36 ; button « États des lieux » 128×36 ; button « Factures » 89×36 |
| Documents (compte vide) (/espace/documents) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Documents (compte vide) (/espace/documents) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Documents (compte vide) (/espace/documents) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Documents (compte vide) (/espace/documents) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Documents (compte vide) (/espace/documents) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Bouton « Ajouter un document » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Fenêtre de « Ajouter un document » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Bouton « Bail Vide, meublé, étudiant ou mobilité, conforme au contrat type » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Bouton « Quittance Pour un mois, envoyée par email si vous le souhaitez » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Fenêtre de « Quittance Pour un mois, envoyée par email si vous le souhaitez » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Bouton « État des lieux D’entrée ou de sortie, sur téléphone » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Fenêtre de « État des lieux D’entrée ou de sortie, sur téléphone » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Bouton « Courrier Relance, révision, congé, dépôt de garantie » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Fenêtre de « Courrier Relance, révision, congé, dépôt de garantie » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Bouton « Baux » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Bouton « Quittances » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Bouton « États des lieux » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Bouton « Factures » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Bouton « Diagnostics » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Bouton « Courriers » | Clic | Une réaction visible | OK | les 12 |  |  |
| Documents (compte vide) (/espace/documents) | Bouton « Autres » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Dossier — lien inconnu (/dossier/inconnu) | Bouton « Réessayer » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « Madame » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « Monsieur » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « Salarié » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « Indépendant » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « Étudiant » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « Apprenti » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « Retraité » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « Autre » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « Seul » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « En couple ou en famille » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « En colocation » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « Une personne (parent, ami…) » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « Visale (garantie gratuite de l’État) » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « Pas de garant » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « Enregistrer » | Clic | Une réaction visible | OK | les 12 |  |  |
| Dossier à compléter par le locataire (/dossier/:code) | Bouton « J’ai terminé » | Clic | Une réaction visible | OK | les 12 |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 2 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Studio Sète » 78×32 |
| Emprunt (/espace/logements/:code/emprunt) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Emprunt (/espace/logements/:code/emprunt) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Lien « Studio Sète » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60 | OK | les 12 |  |  |
| Emprunt (/espace/logements/:code/emprunt) | Bouton « Ajouter mon emprunt » | Clic | Une réaction visible | OK | les 12 |  |  |
| État des lieux (saisie) (/edl/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| État des lieux (saisie) (/edl/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| État des lieux (saisie) (/edl/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| État des lieux (saisie) (/edl/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| État des lieux (saisie) (/edl/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| État des lieux (saisie) (/edl/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| État des lieux (saisie) (/edl/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Quitter » 52×34 |
| État des lieux (saisie) (/edl/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| État des lieux (saisie) (/edl/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| État des lieux (saisie) (/edl/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| État des lieux (saisie) (/edl/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| État des lieux (saisie) (/edl/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| État des lieux (saisie) (/edl/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| État des lieux (saisie) (/edl/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| État des lieux (saisie) (/edl/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| État des lieux (saisie) (/edl/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| État des lieux (saisie) (/edl/:code) | Lien « Quitter » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5 | OK | les 12 |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 3 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Studio Sète » 78×32 ; a « Ou continuer sur cet appareil » 212×34 |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Lien « Ou continuer sur cet appareil » | Clic | Ouvre /edl/beda5d97-6e58-48bf-807e-a22bfd409866 | OK | les 12 |  |  |
| États des lieux du bail (/espace/baux/:code/etat-des-lieux) | Bouton « Sortie Le locataire part, on compare avec l’entrée » | Clic | Une réaction visible | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Facture en photo (/espace/argent/facture) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Facture en photo (/espace/argent/facture) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Facture en photo (/espace/argent/facture) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Facture en photo (/espace/argent/facture) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Facture en photo (/espace/argent/facture) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Lien « Fermer » | Clic | Ouvre /espace/argent | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Bouton « Retour » | Clic | Une réaction visible | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Bouton « Saisir à la main » | Clic | Une réaction visible | OK | les 12 |  |  |
| Facture en photo (/espace/argent/facture) | Fenêtre de « Saisir à la main » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 10 élément(s) entre 24 et 44 px : a « Retour » 48×34 ; button « À recevoir » 320×35 ; button « À recevoir » 320×35 ; button « À recevoir » 320×35 ; button « À recevoir » 320×35 |
| Fiche du locataire (/espace/locataires/:code/fiche) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 11 texte(s) < 13 px : « Étape 6 » 12px ; « À recevoir » 12px ; « Source : » 12px ; « Décret n° 2015-1437 du 5 novembre 2015 » 12px |
| Fiche du locataire (/espace/locataires/:code/fiche) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Lien « Retour » | Clic | Ouvre /espace/locataires/1025c24b-8e2b-4df3-b9ea-12f9b98bb5e9 | OK | les 12 |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Ancre « ✓ Identité » | Cible de l’ancre | #identity existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Ancre « ✓ Coordonnées » | Cible de l’ancre | #contact existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Ancre « ✓ Situation » | Cible de l’ancre | #situation existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Ancre « ✓ Colocation » | Cible de l’ancre | #colocation existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Ancre « ✓ Garantie » | Cible de l’ancre | #guarantee existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Ancre « 6 Justificatifs » | Cible de l’ancre | #documents existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du locataire (/espace/locataires/:code/fiche) | Ancre « 7 Assurance » | Cible de l’ancre | #insurance existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Retour » 48×34 |
| Fiche du logement (/espace/logements/:code/fiche) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 6 texte(s) < 13 px : « Étape 12 » 12px ; « Source : » 12px ; « loi n° 89-462 du 6 juillet 1989, » 12px ; « art. » 12px |
| Fiche du logement (/espace/logements/:code/fiche) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Lien « Retour » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60 | OK | les 12 |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « ✓ Adresse et identifiant fiscal » | Cible de l’ancre | #address existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « ✓ Type et régime » | Cible de l’ancre | #type existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « ✓ Copropriété » | Cible de l’ancre | #copro existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « ✓ Construction et surface » | Cible de l’ancre | #size existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « ✓ Pièces » | Cible de l’ancre | #rooms existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « ✓ Chauffage » | Cible de l’ancre | #heating existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « ✓ Équipements » | Cible de l’ancre | #equipments existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « ✓ Annexes » | Cible de l’ancre | #annexes existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « ✓ Parties communes » | Cible de l’ancre | #common existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « ✓ TV et internet » | Cible de l’ancre | #tv existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « ✓ Diagnostics » | Cible de l’ancre | #diagnostics existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « ✓ Loyer de marché » | Cible de l’ancre | #market existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « ✓ Mobilier » | Cible de l’ancre | #furniture existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Fiche du logement (/espace/logements/:code/fiche) | Ancre « 14 Photos » | Cible de l’ancre | #photos existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Importer un bail (/importer) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Importer un bail (/importer) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Importer un bail (/importer) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Importer un bail (/importer) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Importer un bail (/importer) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Importer un bail (/importer) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Importer un bail (/importer) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Saisir mon bail » 105×34 |
| Importer un bail (/importer) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Importer un bail (/importer) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Importer un bail (/importer) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Importer un bail (/importer) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Importer un bail (/importer) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Importer un bail (/importer) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Importer un bail (/importer) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Importer un bail (/importer) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Importer un bail (/importer) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Importer un bail (/importer) | Lien « Saisir mon bail » | Clic | Ouvre /commencer | OK | les 12 |  |  |
| Inscription (/inscription) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Inscription (/inscription) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Inscription (/inscription) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Inscription (/inscription) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Inscription (/inscription) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Inscription (/inscription) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Inscription (/inscription) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Inscription (/inscription) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Inscription (/inscription) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Inscription (/inscription) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Inscription (/inscription) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Inscription (/inscription) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Inscription (/inscription) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Inscription (/inscription) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Inscription (/inscription) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Inscription (/inscription) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Inscription (/inscription) | Lien « conditions d’utilisation » | Clic | Ouvre /conditions | OK | les 12 |  |  |
| Inscription (/inscription) | Bouton « Créer mon espace » | Clic | Une réaction visible | OK | les 12 |  |  |
| Invitation (accès partagé) (/invitation/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Invitation (accès partagé) (/invitation/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Invitation (accès partagé) (/invitation/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Invitation (accès partagé) (/invitation/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Invitation (accès partagé) (/invitation/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Invitation (accès partagé) (/invitation/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Invitation (accès partagé) (/invitation/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Invitation (accès partagé) (/invitation/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Invitation (accès partagé) (/invitation/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Invitation (accès partagé) (/invitation/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Invitation (accès partagé) (/invitation/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Invitation (accès partagé) (/invitation/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Invitation (accès partagé) (/invitation/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Invitation (accès partagé) (/invitation/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Invitation (accès partagé) (/invitation/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Invitation (accès partagé) (/invitation/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Invitation (accès partagé) (/invitation/:code) | Bouton « Recevoir mon lien de connexion » | Clic | Une réaction visible | OK | les 12 |  |  |
| Lien de connexion invalide (/connexion/lien) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Lien de connexion invalide (/connexion/lien) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Lien de connexion invalide (/connexion/lien) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Lien de connexion invalide (/connexion/lien) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Lien de connexion invalide (/connexion/lien) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Lien de connexion invalide (/connexion/lien) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Lien de connexion invalide (/connexion/lien) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Lien de connexion invalide (/connexion/lien) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Lien de connexion invalide (/connexion/lien) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Lien de connexion invalide (/connexion/lien) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Lien de connexion invalide (/connexion/lien) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Lien de connexion invalide (/connexion/lien) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Lien de connexion invalide (/connexion/lien) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Lien de connexion invalide (/connexion/lien) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Lien de connexion invalide (/connexion/lien) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Lien de connexion invalide (/connexion/lien) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Lien de connexion invalide (/connexion/lien) | Bouton « Recevoir un nouveau lien » | Clic | Une réaction visible | OK | les 12 |  |  |
| Lien du locataire (/locataire/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Lien du locataire (/locataire/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Lien du locataire (/locataire/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Lien du locataire (/locataire/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Lien du locataire (/locataire/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Lien du locataire (/locataire/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Lien du locataire (/locataire/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : input « on » 320×42 |
| Lien du locataire (/locataire/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Lien du locataire (/locataire/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Lien du locataire (/locataire/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer | Android portrait, iPhone paysage, iPhone portrait | Android paysage | 1 texte(s) < 13 px : « Reçu par votre bailleur » 12px |
| Lien du locataire (/locataire/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Lien du locataire (/locataire/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Lien du locataire (/locataire/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Lien du locataire (/locataire/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Lien du locataire (/locataire/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Lien du locataire (/locataire/:code) | Bouton « Signaler un problème » | Clic | Une réaction visible | OK | les 12 |  |  |
| Lien du locataire (/locataire/:code) | Bouton « Donner mon accord » | Clic | Une réaction visible | OK | les 12 |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Lien du locataire inconnu (/locataire/inconnu) | Bouton « Réessayer » | Clic | Une réaction visible | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 13 élément(s) entre 24 et 44 px : a « Locataires » 71×32 ; a « Modifier » 56×32 ; a « Acte de caution » 107×32 ; button « Demander par email » 166×38 ; button « Courrier à imprimer » 162×38 |
| Locataire (/espace/locataires/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Locataire (/espace/locataires/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Locataire (/espace/locataires/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 6 texte(s) < 13 px : « à compléter » 12px ; « En cours » 12px ; « Aujourd’hui » 12px ; « Logements » 12px |
| Locataire (/espace/locataires/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Locataire (/espace/locataires/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Lien « Envoyer un document » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5/courriers | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Lien « Modifier » | Clic | Ouvre /espace/locataires/1025c24b-8e2b-4df3-b9ea-12f9b98bb5e9/fiche | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Lien « Acte de caution » | Clic | Ouvre /espace/locataires/1025c24b-8e2b-4df3-b9ea-12f9b98bb5e9/caution | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Lien « État des lieux » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5/etat-des-lieux | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Lien « Tout voir » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5#paiements | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Lien « Compléter la fiche » | Clic | Ouvre /espace/locataires/1025c24b-8e2b-4df3-b9ea-12f9b98bb5e9/fiche | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Bouton « Loyer reçu » | Clic | Une réaction visible | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Fenêtre de « Loyer reçu » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Bouton « Courrier à imprimer » | Clic | Une réaction visible | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Bouton « Quittance » | Clic | Une réaction visible | OK | les 12 |  |  |
| Locataire (/espace/locataires/:code) | Bouton « Demander par email » | Clic | Une réaction visible | OK | iPhone portrait |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 9 élément(s) entre 24 et 44 px : a « Locataires » 71×32 ; a « Modifier » 56×32 ; a « Indiquer la garantie » 320×34 ; button « Renvoyer par email » 158×38 ; button « Courrier à imprimer » 162×38 |
| Locataire au dossier incomplet (/espace/locataires/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 5 texte(s) < 13 px : « à compléter » 12px ; « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px |
| Locataire au dossier incomplet (/espace/locataires/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Lien « Créer son bail » | Clic | Ouvre /espace/baux/nouveau | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Lien « Modifier » | Clic | Ouvre /espace/locataires/04b40067-1dad-43e5-a3d5-cfb0e45d0fb8/fiche | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Lien « Indiquer la garantie » | Clic | Ouvre /espace/locataires/04b40067-1dad-43e5-a3d5-cfb0e45d0fb8/fiche#guarantee | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Lien « Studio Sète » | Clic | Ouvre /espace/logements/50ac5ac9-96a0-4710-bd2b-8a083cf3add7 | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Lien « Compléter la fiche » | Clic | Ouvre /espace/locataires/04b40067-1dad-43e5-a3d5-cfb0e45d0fb8/fiche | OK | les 12 |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Bouton « Vérifier maintenant » | Clic | Une réaction visible | OK | Android paysage, Android portrait, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Fenêtre de « Vérifier maintenant » | Fermer avec Échap | La fenêtre se ferme | OK | Android paysage, Android portrait, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Locataire au dossier incomplet (/espace/locataires/:code) | Bouton « Courrier à imprimer » | Clic | Une réaction visible | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait | iPad paysage | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 |
| Locataires (/espace/locataires) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Locataires (/espace/locataires) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Locataires (/espace/locataires) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 7 texte(s) < 13 px : « À jour » 12px ; « Bail à signer » 12px ; « Sans bail » 12px ; « Aujourd’hui » 12px |
| Locataires (/espace/locataires) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Locataires (/espace/locataires) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Lien « Ajouter un locataire » | Clic | Ouvre /espace/locataires/nouveau | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Lien « LG Lucas Garnier Studio Sète 560 € À jour » | Clic | Ouvre /espace/locataires/1025c24b-8e2b-4df3-b9ea-12f9b98bb5e9 | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Lien « LG Lucas Garnier Studio Sète 560 € Bail à signer » | Clic | Ouvre /espace/locataires/7e55a59c-99b8-404a-a502-2bec38c0dc15 | OK | les 12 |  |  |
| Locataires (/espace/locataires) | Lien « ZL Zoé-Anaïs Lefèvre Studio Sète Sans bail » | Clic | Ouvre /espace/locataires/04b40067-1dad-43e5-a3d5-cfb0e45d0fb8 | OK | Android paysage, Android portrait, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Locataires (/espace/locataires) | Lien « ? dossier+1792317416933@example.fr Studio Sète Sans bail » | Clic | Ouvre /espace/locataires/04b40067-1dad-43e5-a3d5-cfb0e45d0fb8 | OK | Chrome 1366 px, Chrome 1920 px, iPhone paysage, iPhone portrait |  |  |
| Locataires (compte vide) (/espace/locataires) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Locataires (compte vide) (/espace/locataires) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Locataires (compte vide) (/espace/locataires) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Locataires (compte vide) (/espace/locataires) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Locataires (compte vide) (/espace/locataires) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Locataires (compte vide) (/espace/locataires) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Locataires (compte vide) (/espace/locataires) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait | iPad paysage | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 |
| Locataires (compte vide) (/espace/locataires) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Locataires (compte vide) (/espace/locataires) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Locataires (compte vide) (/espace/locataires) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Locataires (compte vide) (/espace/locataires) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Locataires (compte vide) (/espace/locataires) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Locataires (compte vide) (/espace/locataires) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Locataires (compte vide) (/espace/locataires) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Locataires (compte vide) (/espace/locataires) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Locataires (compte vide) (/espace/locataires) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Logement — dossier (/espace/logements/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Logement — dossier (/espace/logements/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Logement — dossier (/espace/logements/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Logement — dossier (/espace/logements/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Logement — dossier (/espace/logements/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Logement — dossier (/espace/logements/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Logement — dossier (/espace/logements/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 12 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; button « Vue d’ensemble » 114×34 ; button « Dossier du logement » 150×34 ; button « Bail et locataire » 109×34 ; button « Travaux et dépenses  |
| Logement — dossier (/espace/logements/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Logement — dossier (/espace/logements/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Logement — dossier (/espace/logements/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 7 texte(s) < 13 px : « À ajouter » 12px ; « Rangé » 12px ; « Fait par Bailio » 12px ; « Aujourd’hui » 12px |
| Logement — dossier (/espace/logements/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Logement — dossier (/espace/logements/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Logement — dossier (/espace/logements/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Logement — dossier (/espace/logements/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Logement — dossier (/espace/logements/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Logement — dossier (/espace/logements/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Logement — dossier (/espace/logements/:code) | Lien « Le faire » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5/etat-des-lieux | OK | les 12 |  |  |
| Logement — dossier (/espace/logements/:code) | Bouton « Ouvrir » | Clic | Une réaction visible | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 8 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; button « Vue d’ensemble » 114×34 ; button « Dossier du logement » 145×34 ; button « Bail et locataire » 109×34 ; button « Travaux et dépenses » |
| Logement — travaux et dépenses (/espace/logements/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Logement — travaux et dépenses (/espace/logements/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Lien « Ajouter une facture en photo » | Clic | Ouvre /espace/argent/facture | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Bouton « Saisir une dépense » | Clic | Une réaction visible | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Fenêtre de « Saisir une dépense » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Bouton « + Nouvelle » | Clic | Une réaction visible | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Fenêtre de « + Nouvelle » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Bouton « Fuite ou dégât des eaux (Salle d’eau 🚿) Signalé par le locataire le 18/10/2026 Urgent » | Clic | Une réaction visible | OK | Android paysage, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Fenêtre de « Fuite ou dégât des eaux (Salle d’eau 🚿) Signalé par le locataire le 18/10/2026 Urgent » | Fermer avec Échap | La fenêtre se ferme | OK | Android paysage, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Bouton « Fuite sous l’évier 10/10/2026 · Plomberie Martin 120,00 € » | Clic | Une réaction visible | OK | les 12 |  |  |
| Logement — travaux et dépenses (/espace/logements/:code) | Fenêtre de « Fuite sous l’évier 10/10/2026 · Plomberie Martin 120,00 € » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 10 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Reprendre l’état des lieux » 202×38 ; button « Voir toutes les étapes » 147×32 ; button « Vue d’ensemble » 118×34 ; button « Dossier du lo |
| Logement (/espace/logements/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Logement (/espace/logements/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Logement (/espace/logements/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 7 texte(s) < 13 px : « Loyer » 12px ; « Travaux » 12px ; « Bail » 12px ; « Aujourd’hui » 12px |
| Logement (/espace/logements/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Logement (/espace/logements/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Lien « Reprendre l’état des lieux » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5/etat-des-lieux | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Lien « Voir le bail » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5 | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Lien « Fiche du logement 93 %, à compléter » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60/fiche | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Lien « Diagnostics À jour » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60 | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Lien « Annonce et candidats Ouvrir » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60/annonce | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Lien « Travaux et interventions Ouvrir » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60 | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Lien « Aides et dispositifs Voir » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60/aides | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Lien « Emprunt Ajouter » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60/emprunt | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Bouton « Créer un document » | Clic | Une réaction visible | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Fenêtre de « Créer un document » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Bouton « Voir toutes les étapes » | Clic | Une réaction visible | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Bouton « Propriétaire En mon nom » | Clic | Une réaction visible | OK | les 12 |  |  |
| Logement (/espace/logements/:code) | Fenêtre de « Propriétaire En mon nom » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Logement inexistant (/espace/logements/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Logement inexistant (/espace/logements/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Logement inexistant (/espace/logements/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Logement inexistant (/espace/logements/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Logement inexistant (/espace/logements/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Logement inexistant (/espace/logements/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Logement inexistant (/espace/logements/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait | iPad paysage | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 |
| Logement inexistant (/espace/logements/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Logement inexistant (/espace/logements/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Logement inexistant (/espace/logements/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Logement inexistant (/espace/logements/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Logement inexistant (/espace/logements/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Logement inexistant (/espace/logements/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Logement inexistant (/espace/logements/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Logement inexistant (/espace/logements/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Logement inexistant (/espace/logements/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Logement inexistant (/espace/logements/:code) | Bouton « Réessayer » | Clic | Une réaction visible | OK | les 12 |  |  |
| Logements (/espace/logements) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Logements (/espace/logements) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Logements (/espace/logements) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Logements (/espace/logements) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Logements (/espace/logements) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Logements (/espace/logements) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Logements (/espace/logements) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Répartir une dépense de l’immeuble » 243×32 |
| Logements (/espace/logements) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Logements (/espace/logements) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Logements (/espace/logements) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 6 texte(s) < 13 px : « Loué » 12px ; « Bail en préparation » 12px ; « Aujourd’hui » 12px ; « Logements » 12px |
| Logements (/espace/logements) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Logements (/espace/logements) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Logements (/espace/logements) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Logements (/espace/logements) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Logements (/espace/logements) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Logements (/espace/logements) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Logements (/espace/logements) | Lien « Vos structures » | Clic | Ouvre /espace/structures | OK | les 12 |  |  |
| Logements (/espace/logements) | Lien « Tableau de bord : ce qu’il vous reste chaque mois, et ce qui » | Clic | Ouvre /espace/patrimoine | OK | les 12 |  |  |
| Logements (/espace/logements) | Lien « Répartir une dépense de l’immeuble » | Clic | Ouvre /espace/argent/repartir | OK | les 12 |  |  |
| Logements (/espace/logements) | Lien « Loué Studio Sète Appartement T2 meublé · 37 m² · Sète Locata » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60 | OK | les 12 |  |  |
| Logements (/espace/logements) | Lien « Bail en préparation Studio Sète Appartement T2 vide · 37 m²  » | Clic | Ouvre /espace/logements/50ac5ac9-96a0-4710-bd2b-8a083cf3add7 | OK | les 12 |  |  |
| Logements (compte vide) (/espace/logements) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Logements (compte vide) (/espace/logements) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Logements (compte vide) (/espace/logements) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Logements (compte vide) (/espace/logements) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Logements (compte vide) (/espace/logements) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Logements (compte vide) (/espace/logements) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Logements (compte vide) (/espace/logements) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait | iPad paysage | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 |
| Logements (compte vide) (/espace/logements) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Logements (compte vide) (/espace/logements) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Logements (compte vide) (/espace/logements) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Logements (compte vide) (/espace/logements) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Logements (compte vide) (/espace/logements) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Logements (compte vide) (/espace/logements) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Logements (compte vide) (/espace/logements) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Logements (compte vide) (/espace/logements) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Logements (compte vide) (/espace/logements) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Mentions légales (/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Mentions légales (/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Mentions légales (/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Mentions légales (/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Mentions légales (/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Mentions légales (/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Mentions légales (/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 3 élément(s) entre 24 et 44 px : a « Conditions d'utilisation » 180×36 ; a « Prix, rétractation et remboursement » 282×36 ; a « Accessibilité » 100×36 |
| Mentions légales (/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Mentions légales (/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Mentions légales (/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Mentions légales (/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Mentions légales (/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Mentions légales (/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Mentions légales (/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Mentions légales (/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Mentions légales (/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Mentions légales (/:code) | Lien « contact@bailio.fr » | Format du lien | Adresse ou numéro valide | OK | les 12 |  |  |
| Mentions légales (/:code) | Lien « Conditions d'utilisation » | Clic | Ouvre /conditions | OK | les 12 |  |  |
| Mentions légales (/:code) | Lien « Confidentialité et données personnelles » | Clic | Ouvre /confidentialite | OK | les 12 |  |  |
| Mentions légales (/:code) | Lien « Cookies et stockage dans le navigateur » | Clic | Ouvre /cookies | OK | les 12 |  |  |
| Mentions légales (/:code) | Lien « Prix, rétractation et remboursement » | Clic | Ouvre /prix-et-remboursement | OK | les 12 |  |  |
| Mentions légales (/:code) | Lien externe « linkedin.com/in/enzo-mercier » | Clic | Ouvre un nouvel onglet (on garde Bailio ouvert) | À améliorer |  | Firefox 1366 px, Firefox 1920 px, Safari 1366 px, Safari 1920 px | Même onglet : https://www.linkedin.com/in/enzo-mercier/ |
| Mon compte (/espace/compte) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Mon compte (/espace/compte) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Mon compte (/espace/compte) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Mon compte (/espace/compte) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Mon compte (/espace/compte) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Mon compte (/espace/compte) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Mon compte (/espace/compte) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 7 élément(s) entre 24 et 44 px : a « Profil complet » 94×32 ; a « Ouvrir » 42×32 ; a « Gérer » 38×32 ; button « Tout exporter » 98×34 ; a « Corbeille » 65×34 |
| Mon compte (/espace/compte) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Mon compte (/espace/compte) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Mon compte (/espace/compte) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 5 texte(s) < 13 px : « Cet appareil » 12px ; « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px |
| Mon compte (/espace/compte) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Mon compte (/espace/compte) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Mon compte (/espace/compte) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Mon compte (/espace/compte) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Mon compte (/espace/compte) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Mon compte (/espace/compte) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Mon compte (/espace/compte) | Lien « Profil complet » | Clic | Ouvre /espace/compte/profil | OK | les 12 |  |  |
| Mon compte (/espace/compte) | Lien « Ouvrir » | Clic | Ouvre /espace/carnet | OK | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Mon compte (/espace/compte) | Lien « Gérer » | Clic | Ouvre /espace/compte/acces | OK | les 12 |  |  |
| Mon compte (/espace/compte) | Lien « Corbeille » | Clic | Ouvre /espace/corbeille | OK | les 12 |  |  |
| P1 Découvrir le site | Action principale | Voir sans défiler | « Créer mon bail » visible dès l’arrivée | KO | Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait | Android paysage, iPhone paysage, iPhone portrait | Bouton sous la ligne de flottaison (y = 677 px, écran 664 px) |
| P1 Découvrir le site | Lien « Tarif » | Clic | La section des tarifs s’affiche | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P1 Découvrir le site | FAQ | Ouvrir une question | La réponse s’affiche | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P1 Découvrir le site | Simulation du loyer | Choisir un type, saisir un loyer | Le calcul se met à jour | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P1 Découvrir le site | Erreurs | Parcours de l’accueil | Aucune erreur | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P13 Signalement du locataire | Assistant | Signaler un problème en 3 écrans | « Signalement envoyé à votre bailleur » | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P13 Signalement du locataire | Erreurs | Assistant | Aucune erreur | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Accueil → tunnel | Clic sur « Créer mon bail » | Étape 1 « Votre logement est… » | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Étape 1 Type | Choisir « Vide » | Étape 2 Logement | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Étape 2 — envoi vide | Clic « Continuer » sans rien remplir | Messages d’erreur, on reste sur l’étape | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Étape 2 — format invalide | Surface « abc » | Lettres refusées | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Étape 2 Logement | Remplir avec accents et apostrophes | Étape 3 Personnes | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Étape 3 — envoi vide | Clic « Continuer » sans rien remplir | Messages d’erreur | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Étape 3 Personnes | Prénom avec emoji, nom avec apostrophe, email invalide puis valide | Étape 4 Loyer | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Étape 4 — dépôt trop élevé | Loyer 780 €, dépôt modifié au-delà du plafond | Refus avec le plafond légal | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Étape 4 Loyer | Date d’entrée et continuer | Étape 5 Relecture | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Étape 5 Relecture | Les saisies sont reprises | Prénom avec emoji et apostrophes affichés tels quels | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Rafraîchissement du tunnel | Recharger l’étape 5 | Rien n’est perdu (brouillon enregistré) | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Retour du navigateur | Bouton retour depuis l’étape 5 | Étape 4 avec le loyer gardé | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Étape 5 Relecture | Clic « Mon bail est correct » | Étape « Recevoir » | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Recevoir — email invalide | Email « abc@ » | Message clair, saisie gardée | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Recevoir | Email valide | « Regardez vos emails. » (email simulé, écrit dans le journal de l’API) | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Lien reçu par email | Ouvrir le lien | Bail enregistré dans l’espace (/bienvenue) | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P2 Créer son bail (tunnel) | Erreurs | Tout le tunnel | Aucune erreur console ni réseau | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P5 Connexion et déconnexion | Email vide | Clic « Recevoir mon lien » | Message « Indiquez une adresse email valide. » | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P5 Connexion et déconnexion | Email très long avec emoji | Saisie | Refus clair, saisie gardée | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P5 Connexion et déconnexion | Email valide | Demander le lien | « Regardez vos emails. » et bouton vers la messagerie | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P5 Connexion et déconnexion | Lien reçu | Ouvrir le lien | Espace « Aujourd’hui » | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P5 Connexion et déconnexion | Barre du bas | Toucher « Logements » | Page Logements | OK | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P5 Connexion et déconnexion | Bouton « + » | Toucher puis fermer | La fenêtre « Ajouter » s’ouvre et se ferme | OK | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P5 Connexion et déconnexion | En-tête mobile | Toucher « Mon compte » | Page Mon compte | OK | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P5 Connexion et déconnexion | Carnet et « Que se passe-t-il ? » | Trouver ces pages sur téléphone | Carnet depuis Mon compte, situations depuis Aujourd’hui | OK | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P5 Connexion et déconnexion | Déconnexion | Mon compte → « Se déconnecter » | Retour à l’accueil, espace fermé | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P5 Connexion et déconnexion | Erreurs | Tout le parcours | Aucune erreur | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P5 Connexion et déconnexion | Menu latéral | Clic sur chaque entrée | Chaque page s’ouvre | OK | Chrome 1366 px, Chrome 1920 px, iPad paysage |  |  |
| P5 Connexion et déconnexion | Clavier | Tab au chargement | Premier arrêt « Aller au contenu », contour visible, Entrée → contenu | OK | Chrome 1366 px, Chrome 1920 px, iPad paysage |  |  |
| P5 Connexion et déconnexion | Clavier | Ouvrir et fermer « Ajouter » au clavier | Fenêtre ouverte par Entrée, fermée par Échap, focus rendu | OK | Chrome 1366 px, Chrome 1920 px, iPad paysage |  |  |
| P6 Page protégée | Redirection | Ouvrir /espace/argent sans session | Page de connexion | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P6 Page protégée | Retour après connexion | Lien reçu par email ouvert | Arrivée sur /espace/argent (la page demandée) | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P8 Dossier du locataire | Formulaire | Remplir l’identité avec accents et emoji, enregistrer | Saisie gardée après rechargement | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P8 Dossier du locataire | Erreurs | Formulaire | Aucune erreur | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P9 Candidature | Envoi vide | Clic « Envoyer ma candidature » | Message qui dit quoi remplir | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P9 Candidature | Envoi complet | Accents, apostrophes, emoji, message très long | Confirmation | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| P9 Candidature | Erreurs | Formulaire | Aucune erreur | OK | Android paysage, Android portrait, Chrome 1366 px, Chrome 1920 px, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Page 404 (/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Page 404 (/:code) | Page 404 | URL inconnue | Message « Page introuvable » et lien de retour | OK | les 12 |  |  |
| Page 404 (/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Page 404 (/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Page 404 (/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Page 404 (/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Page 404 (/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Page 404 (/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Retour à l'accueil » 132×36 |
| Page 404 (/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Page 404 (/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Page 404 (/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Page 404 (/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Page 404 (/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Page 404 (/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Page 404 (/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Page 404 (/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Page 404 (/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Page 404 (/:code) | Lien « Retour à l'accueil » | Clic | Ouvre / | OK | les 12 |  |  |
| Page protégée sans connexion (/espace/logements) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Page protégée sans connexion (/espace/logements) | Redirection | Ouvrir sans être connecté | Redirigé vers /connexion | OK | les 12 |  |  |
| Page protégée sans connexion (/espace/logements) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Page protégée sans connexion (/espace/logements) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Page protégée sans connexion (/espace/logements) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Page protégée sans connexion (/espace/logements) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Page protégée sans connexion (/espace/logements) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Page protégée sans connexion (/espace/logements) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Page protégée sans connexion (/espace/logements) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Page protégée sans connexion (/espace/logements) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Page protégée sans connexion (/espace/logements) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Page protégée sans connexion (/espace/logements) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Page protégée sans connexion (/espace/logements) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Page protégée sans connexion (/espace/logements) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Page protégée sans connexion (/espace/logements) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Page protégée sans connexion (/espace/logements) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Page protégée sans connexion (/espace/logements) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Page protégée sans connexion (/espace/logements) | Bouton « Recevoir mon lien de connexion » | Clic | Une réaction visible | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 6 élément(s) entre 24 et 44 px : a « Que se passe-t-il ? » 130×32 ; a « Monsieur Lucas Garnier » 160×32 ; button « Préparer le document » 177×38 ; button « Faire l’état des lieux » 164×38 ; button « E |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 7 texte(s) < 13 px : « À faire » 12px ; « Pas nécessaire » 12px ; « Plus tard » 12px ; « Aujourd’hui » 12px |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Lien « Monsieur Lucas Garnier » | Clic | Ouvre /espace/baux/25c06e02-6300-4b43-a12d-09bd469a2dd5 | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Bouton « Préparer le document » | Clic | Une réaction visible | OK | les 12 |  |  |
| Parcours — départ du locataire (/espace/baux/:code/parcours/DEPARTURE) | Bouton « Faire l’état des lieux » | Clic | Une réaction visible | OK | les 12 |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 5 élément(s) entre 24 et 44 px : a « Que se passe-t-il ? » 130×32 ; a « Monsieur Lucas Garnier » 160×32 ; button « Préparer le document » 177×38 ; button « Préparer le document » 177×38 ; button « Pré |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 6 texte(s) < 13 px : « Plus tard » 12px ; « Si besoin » 12px ; « Aujourd’hui » 12px ; « Logements » 12px |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Parcours — impayé (/espace/baux/:code/parcours/UNPAID) | Bouton « Préparer le document » | Clic | Une réaction visible | OK | les 12 |  |  |
| Prix et remboursement (/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Prix et remboursement (/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Prix et remboursement (/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Prix et remboursement (/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Prix et remboursement (/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Prix et remboursement (/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Prix et remboursement (/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android portrait, iPhone paysage, iPhone portrait | Android paysage, iPad paysage, iPad portrait | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 |
| Prix et remboursement (/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Prix et remboursement (/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Prix et remboursement (/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Prix et remboursement (/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Prix et remboursement (/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Prix et remboursement (/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Prix et remboursement (/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Prix et remboursement (/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Prix et remboursement (/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Prix et remboursement (/:code) | Lien « contact@bailio.fr » | Format du lien | Adresse ou numéro valide | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Retour » 48×34 |
| Profil du bailleur (/espace/compte/profil) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Profil du bailleur (/espace/compte/profil) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Profil du bailleur (/espace/compte/profil) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 2 texte(s) < 13 px : « Étape 5 » 12px ; « Étape 6 » 12px |
| Profil du bailleur (/espace/compte/profil) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Profil du bailleur (/espace/compte/profil) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Lien « Retour » | Clic | Ouvre /espace/compte | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Lien « Vos structures (1) » | Clic | Ouvre /espace/structures | OK | les 12 |  |  |
| Profil du bailleur (/espace/compte/profil) | Ancre « ✓ Identité » | Cible de l’ancre | #identity existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Profil du bailleur (/espace/compte/profil) | Ancre « ✓ Adresse » | Cible de l’ancre | #address existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Profil du bailleur (/espace/compte/profil) | Ancre « ✓ Contact » | Cible de l’ancre | #contact existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Profil du bailleur (/espace/compte/profil) | Ancre « ✓ Mandataire » | Cible de l’ancre | #agent existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Profil du bailleur (/espace/compte/profil) | Ancre « 5 Paiement » | Cible de l’ancre | #payment existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Profil du bailleur (/espace/compte/profil) | Ancre « 6 Signature » | Cible de l’ancre | #signature existe | OK | Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, Safari 1366 px, Safari 1920 px |  |  |
| Que se passe-t-il ? (/espace/situations) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android paysage, Android portrait, iPad portrait, iPhone paysage, iPhone portrait | iPad paysage | 1 élément(s) entre 24 et 44 px : a « Bailio » 208×39 |
| Que se passe-t-il ? (/espace/situations) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Que se passe-t-il ? (/espace/situations) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Que se passe-t-il ? (/espace/situations) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Que se passe-t-il ? (/espace/situations) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Que se passe-t-il ? (/espace/situations) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Bouton « Mon locataire part Congé reçu, état des lieux de sortie, départ, solde de tout compte. » | Clic | Une réaction visible | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Bouton « Mon locataire ne paie pas Relance, mise en demeure, garant, commissaire de justice. » | Clic | Une réaction visible | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Bouton « Je veux vendre ou reprendre La bonne date pour donner congé, ou vendre avec le locataire en place. » | Clic | Une réaction visible | OK | les 12 |  |  |
| Que se passe-t-il ? (/espace/situations) | Bouton « Un problème dans le logement Dégradations, voisinage, assurance, chaudière, détecteurs. » | Clic | Une réaction visible | OK | les 12 |  |  |
| Relevé bancaire (/espace/argent/releve) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Relevé bancaire (/espace/argent/releve) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Relevé bancaire (/espace/argent/releve) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Relevé bancaire (/espace/argent/releve) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Relevé bancaire (/espace/argent/releve) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Relevé bancaire (/espace/argent/releve) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Relevé bancaire (/espace/argent/releve) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Argent » 46×32 |
| Relevé bancaire (/espace/argent/releve) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Relevé bancaire (/espace/argent/releve) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Relevé bancaire (/espace/argent/releve) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Relevé bancaire (/espace/argent/releve) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Relevé bancaire (/espace/argent/releve) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Relevé bancaire (/espace/argent/releve) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Relevé bancaire (/espace/argent/releve) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Relevé bancaire (/espace/argent/releve) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Relevé bancaire (/espace/argent/releve) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Relevé bancaire (/espace/argent/releve) | Lien « Retour à l’argent » | Clic | Ouvre /espace/argent | OK | les 12 |  |  |
| Relevé bancaire (/espace/argent/releve) | Lien « Aujourd’hui 9 » | Clic | Ouvre /espace | OK | Safari 1920 px |  |  |
| Répartir une dépense (/espace/argent/repartir) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Répartir une dépense (/espace/argent/repartir) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Répartir une dépense (/espace/argent/repartir) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Répartir une dépense (/espace/argent/repartir) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Répartir une dépense (/espace/argent/repartir) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Répartir une dépense (/espace/argent/repartir) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Répartir une dépense (/espace/argent/repartir) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Argent » 46×32 |
| Répartir une dépense (/espace/argent/repartir) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Répartir une dépense (/espace/argent/repartir) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Répartir une dépense (/espace/argent/repartir) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Répartir une dépense (/espace/argent/repartir) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Répartir une dépense (/espace/argent/repartir) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Répartir une dépense (/espace/argent/repartir) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Répartir une dépense (/espace/argent/repartir) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Répartir une dépense (/espace/argent/repartir) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Répartir une dépense (/espace/argent/repartir) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer | Android portrait, iPhone paysage, iPhone portrait | Android paysage, iPad paysage, iPad portrait | 1 élément(s) entre 24 et 44 px : a « Tarif » 35×46 |
| Reprendre un brouillon (lien expiré) (/reprendre) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Lien « Tarif » | Clic | Ouvre /#tarifs | OK | Android paysage, Chrome 1366 px, Chrome 1920 px, Firefox 1366 px, Firefox 1920 px, iPad paysage, iPad portrait, Safari 1366 px, Safari 1920 px |  |  |
| Reprendre un brouillon (lien expiré) (/reprendre) | Lien « Recommencer mon bail » | Clic | Ouvre /commencer | OK | les 12 |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Signature — lien inconnu (/signer/lien-inconnu) | Bouton « Réessayer » | Clic | Une réaction visible | OK | les 12 |  |  |
| Signature électronique (/signer/:code) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Signature électronique (/signer/:code) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Signature électronique (/signer/:code) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Signature électronique (/signer/:code) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Signature électronique (/signer/:code) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Signature électronique (/signer/:code) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Signature électronique (/signer/:code) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 4 élément(s) entre 24 et 44 px : input « on » 320×24 ; a « La signature électronique (Code civil, art. 1367) ↗ » 306×31 ; a « Règlement européen eIDAS ↗ » 183×31 ; a « Rédaction du bail ↗ » 122×31 |
| Signature électronique (/signer/:code) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Signature électronique (/signer/:code) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Signature électronique (/signer/:code) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Signature électronique (/signer/:code) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Signature électronique (/signer/:code) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Signature électronique (/signer/:code) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Signature électronique (/signer/:code) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Signature électronique (/signer/:code) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Signature électronique (/signer/:code) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Signature électronique (/signer/:code) | Lien « contact@bailio.fr » | Format du lien | Adresse ou numéro valide | OK | les 12 |  |  |
| Structures (/espace/structures) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Structures (/espace/structures) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Structures (/espace/structures) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Structures (/espace/structures) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Structures (/espace/structures) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Structures (/espace/structures) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Structures (/espace/structures) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 4 élément(s) entre 24 et 44 px : a « Logements » 75×32 ; a « Modifier » 60×34 ; a « Studio Sète » 83×34 ; a « Studio Sète » 83×34 |
| Structures (/espace/structures) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Structures (/espace/structures) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Structures (/espace/structures) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 6 texte(s) < 13 px : « En mon nom » 12px ; « Impôt sur le revenu » 12px ; « Aujourd’hui » 12px ; « Logements » 12px |
| Structures (/espace/structures) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Structures (/espace/structures) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Structures (/espace/structures) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Structures (/espace/structures) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Structures (/espace/structures) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Structures (/espace/structures) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Structures (/espace/structures) | Lien « Modifier » | Clic | Ouvre /espace/structures/c10f3172-b49c-48ab-8fde-22ab8e09a85a | OK | les 12 |  |  |
| Structures (/espace/structures) | Bouton « Ajouter une structure » | Clic | Une réaction visible | OK | les 12 |  |  |
| Structures (/espace/structures) | Fenêtre de « Ajouter une structure » | Fermer avec Échap | La fenêtre se ferme | OK | les 12 |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Cibles tactiles | Toucher au doigt | 44 × 44 px | À améliorer |  | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait | 1 élément(s) entre 24 et 44 px : a « Logements » 75×32 |
| Tableau de bord des logements (/espace/patrimoine) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px (corps 16 px) | À améliorer |  | Android paysage, Android portrait, iPhone paysage, iPhone portrait | 4 texte(s) < 13 px : « Aujourd’hui » 12px ; « Logements » 12px ; « Documents » 12px ; « Argent » 12px |
| Tableau de bord des logements (/espace/patrimoine) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Lien « Studio Sète Loué à Lucas Garnier · En mon nom 560,00 € / moi » | Clic | Ouvre /espace/logements/bb5589b0-564e-4193-80b2-a45e01ea8f60 | OK | les 12 |  |  |
| Tableau de bord des logements (/espace/patrimoine) | Lien « Studio Sète Libre · En mon nom » | Clic | Ouvre /espace/logements/50ac5ac9-96a0-4710-bd2b-8a083cf3add7 | OK | les 12 |  |  |
| Tableau de bord manuel | Ouverture | Ouvrir le fichier sans serveur | Liste des tests affichée | OK | iPhone portrait, iPad paysage, Chrome 1366 px |  |  |
| Tableau de bord manuel | Mise en page | Largeur | Aucun défilement horizontal | OK | iPhone portrait, iPad paysage, Chrome 1366 px |  |  |
| Tableau de bord manuel | Statut | Marquer le test 1 « Bug », gravité, commentaire | Enregistré et gardé après rechargement | OK | iPhone portrait, iPad paysage, Chrome 1366 px |  |  |
| Tableau de bord manuel | Capture | Ajouter une image | Image affichée sous le test | OK | iPhone portrait, iPad paysage, Chrome 1366 px |  |  |
| Tableau de bord manuel | Filtres | Statut « Bug » | Seul le test en bug reste | OK | iPhone portrait, iPad paysage, Chrome 1366 px |  |  |
| Tableau de bord manuel | Progression | Barres | Un test compté pour l’appareil | OK | iPhone portrait, iPad paysage, Chrome 1366 px |  |  |
| Tableau de bord manuel | Remarque libre | Ajouter une remarque | Remarque listée | OK | iPhone portrait, iPad paysage, Chrome 1366 px |  |  |
| Tableau de bord manuel | Export | Exporter mes retours | retours-test.json et retours-test.md téléchargés | OK | iPhone portrait, iPad paysage, Chrome 1366 px |  |  |
| Tableau de bord manuel | Réinitialiser puis importer | Tout effacer, puis importer l’export | Les retours reviennent | OK | iPhone portrait, iPad paysage, Chrome 1366 px |  |  |
| Tableau de bord manuel | Erreurs | Toute la séquence | Aucune erreur JavaScript | OK | iPhone portrait, iPad paysage, Chrome 1366 px |  |  |
| Tunnel — type (/commencer) | Document | Accès direct par URL | HTTP 200 | OK | les 12 |  |  |
| Tunnel — type (/commencer) | Contenu | Affichage | Page remplie | OK | les 12 |  |  |
| Tunnel — type (/commencer) | Temps de chargement | Accès direct par URL | < 3 s (local) | OK | les 12 |  |  |
| Tunnel — type (/commencer) | Rafraîchissement | Recharger la page (F5) | La même page | OK | les 12 |  |  |
| Tunnel — type (/commencer) | Mise en page | Défilement horizontal | Aucun | OK | les 12 |  |  |
| Tunnel — type (/commencer) | Éléments coupés | Affichage | Tout dans l’écran | OK | les 12 |  |  |
| Tunnel — type (/commencer) | Cibles tactiles | Toucher au doigt | 44 × 44 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Tunnel — type (/commencer) | Taille des champs | Toucher un champ | ≥ 16 px | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Tunnel — type (/commencer) | Survol | Usage au doigt | Rien qui dépende du survol | OK | Android paysage, Android portrait, iPad paysage, iPad portrait, iPhone paysage, iPhone portrait |  |  |
| Tunnel — type (/commencer) | Lisibilité | Lire sans zoomer | Texte ≥ 13 px | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Tunnel — type (/commencer) | Clavier mobile | Saisie | Clavier adapté | OK | Android paysage, Android portrait, iPhone paysage, iPhone portrait |  |  |
| Tunnel — type (/commencer) | Textes oubliés | Lecture | Aucun | OK | les 12 |  |  |
| Tunnel — type (/commencer) | Images | Affichage | Toutes les images chargées | OK | les 12 |  |  |
| Tunnel — type (/commencer) | Accessibilité (axe-core) | Contrôle WCAG 2.1 AA | Aucune violation | OK | les 12 |  |  |
| Tunnel — type (/commencer) | Console et réseau | Chargement | Aucune erreur | OK | les 12 |  |  |
| Tunnel — type (/commencer) | Ancre « Aller au contenu » | Cible de l’ancre | #contenu existe | OK | les 12 |  |  |
| Tunnel — type (/commencer) | Lien « J'ai déjà un bail signé » | Clic | Ouvre /importer | OK | les 12 |  |  |
| Tunnel — type (/commencer) | Bouton « Vide Sans meubles · bail de 3 ans » | Clic | Une réaction visible | OK | les 12 |  |  |
| Tunnel — type (/commencer) | Bouton « Meublé Avec meubles · bail de 1 an » | Clic | Une réaction visible | OK | les 12 |  |  |
