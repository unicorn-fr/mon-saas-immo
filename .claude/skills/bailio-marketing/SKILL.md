---
name: bailio-marketing
description: "Marketing de Bailio en autonomie : publier les vidéos sur les réseaux (n8n), écrire leur guide sur bailio.fr, relever les statistiques et ajuster la stratégie chaque semaine. Utiliser pour toute tâche « publier », « réseaux sociaux », « vidéo », « statistiques », « abonnés », « idées de contenu », « tendances », ou pour la tâche programmée quotidienne."
---

# Marketing de Bailio

Lire d'abord `.agents/product-marketing.md` (produit, public, voix) et `docs/reseaux-sociaux.md` (outillage). Les skills
générales (`social`, `video`, `content-strategy`, `copywriting`, `ai-seo`, `analytics`, `marketing-psychology`…, licence
MIT, `LICENSE-marketingskills`) donnent les méthodes ; ce fichier dit comment les appliquer à Bailio.

## Règles qui ne se discutent pas

1. **Exactitude juridique.** Toute règle citée (montant, délai, article) est vérifiée sur service-public.fr ou Légifrance
   le jour même, comme pour les guides (CLAUDE.md). En cas de doute : ne pas publier la phrase.
2. **Musique.** Bailio est un compte d'entreprise : seulement des sons libres de droits pour usage commercial
   (bibliothèques commerciales des plateformes, musique libre de droits). Jamais un titre populaire protégé.
3. **Honnêteté.** Aucun faux témoignage, aucun chiffre inventé, aucune promesse de résultat (« zéro impayé »),
   aucune comparaison nominative non sourcée. Pas d'achat d'abonnés ni de faux engagement.
4. **Voix.** Français, vouvoiement, phrases courtes, un terme juridique = une ligne d'explication.
5. **Données.** Jamais d'information sur un vrai locataire ou un vrai propriétaire. Pas de capture d'écran d'un
   compte réel.
6. **Secrets.** Clé n8n et mot de passe d'accès seulement dans l'environnement (`BAILIO_N8N_API_KEY`,
   `BAILIO_RESEAUX_PASSWORD`), jamais dans le dépôt ni dans un message.

## Lignes éditoriales (4 piliers, en rotation)

| Pilier | Part | Exemples |
|---|---|---|
| La règle qu'il faut connaître | 40 % | dépôt de garantie, préavis, DPE interdit, révision IRL, encadrement |
| L'erreur qui coûte cher | 25 % | congé envoyé trop tard, retenue sans justificatif, bail sans état des lieux |
| Le geste qui fait gagner du temps | 20 % | quittance automatique, relevé bancaire, déclaration en 10 cases |
| L'actualité du bailleur | 15 % | nouvelle loi, date limite fiscale, IRL du trimestre |

Calendrier saisonnier : déclaration des revenus (avril à juin), IRL publié chaque trimestre, CFE du meublé
(décembre), fin de l'encadrement des loyers le 24 novembre 2026 sauf prolongation (vérifier), rentrée étudiante
(août, septembre : baux meublés).

## Format d'une vidéo courte (15 à 45 secondes, verticale)

- Accroche dans les 2 premières secondes, en texte à l'écran ET à l'oral : une question ou une erreur
  (« Votre locataire part : vous avez combien de temps pour rendre le dépôt de garantie ? »).
- Une seule idée, la réponse exacte, un exemple chiffré.
- Fin : « Le guide complet est sur bailio.fr » (lien dans la bio ou la description).
- Sous-titres toujours (beaucoup regardent sans le son).

## Texte de chaque publication

Un texte propre à chaque réseau, jamais le même copié partout :
- **TikTok, Reels, Shorts** : 1 à 2 phrases + 3 à 5 hashtags précis (#proprietaire #locationmeublee #bail
  #immobilier #investissementlocatif), pas de mur de hashtags.
- **YouTube** : titre cherchable (« Dépôt de garantie : délai pour le rendre au locataire (2026) »), description avec
  le lien du guide.
- **LinkedIn** : angle investisseur ou gestion, 3 à 6 lignes aérées, lien en fin.
- **Facebook** : ton conversationnel, question en fin pour les commentaires.
- **Pinterest** : titre et description cherchables, lien direct vers le guide.
- **X** : une phrase forte + lien.

Lien vers bailio.fr toujours marqué : `?utm_source=<reseau>&utm_medium=social&utm_campaign=<slug-de-la-video>`
(la mesure d'audience de Bailio le lit, page Pilotage).

## Boucle quotidienne (tâche programmée)

1. Lire le dossier Drive « Bailio - Vidéos à publier » (`1DISJFU3dsfYF59vJ-TGfbxbxuvO-jT5U`). Pour chaque nouvelle
   vidéo : comprendre le sujet (nom du fichier, note jointe, images extraites avec ffmpeg si besoin).
2. Vérifier la règle sur la source officielle ; écrire les textes par réseau ; écrire le guide correspondant dans
   `client/src/content/guides.ts` (PR, tests, fusion, mise en ligne selon CLAUDE.md).
3. Publier par le circuit n8n « Bailio : publier une vidéo » (seulement les réseaux branchés) ; ranger la vidéo dans
   « Bailio - Vidéos publiées » (`1KC_ZBaGUbfxyo4rYTUlQCcpN8UaJGks3`).
4. Sans nouvelle vidéo : proposer 3 idées de vidéos (scripts prêts) dans le compte rendu, sans rien publier.
5. Ne jamais publier deux fois la même vidéo (journal des publications dans n8n).

## Revue hebdomadaire (lundi)

- Relever par réseau : abonnés, vues, partages, enregistrements, commentaires ; visites de bailio.fr par
  `utm_source`, comptes créés.
- Comparer à la trajectoire de l'objectif (1 000 abonnés par réseau fin janvier 2027) : en avance, à l'heure, en
  retard.
- Garder les 3 meilleures et 3 moins bonnes vidéos, en tirer une hypothèse (accroche, sujet, durée, heure) et la
  tester la semaine suivante. Noter l'apprentissage dans « Learnings » de `.agents/product-marketing.md`.
- Repérer les tendances (formats, sujets, sons libres de droits qui montent) et les proposer.
- Envoyer un résumé court au propriétaire du compte.
