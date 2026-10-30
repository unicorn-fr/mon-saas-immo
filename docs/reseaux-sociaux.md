# Publier les vidéos de Bailio sur les réseaux sociaux

Claude rédige la description et les tags de chaque vidéo, adaptés à chaque réseau. **n8n** publie la vidéo et son
texte. n8n est un outil d'automatisation libre et gratuit, installé sur le serveur de Bailio
(`deploy/vps/reseaux.sh`). Les accès aux réseaux restent sur ce serveur. Aucun abonnement n'est nécessaire.

**Ne communiquez jamais un mot de passe ou un code dans une conversation.** Chaque réseau se branche dans n8n
avec le bouton « Connect » (ou « Se connecter »), qui ouvre la page officielle du réseau.

## 1. Activer n8n sur le serveur (10 minutes, une seule fois)

1. **DNS.** Manager Infomaniak, puis Domaines, bailio.fr, Zone DNS, Ajouter un enregistrement :
   - type **A** ;
   - nom **reseaux** ;
   - valeur : la même adresse IP que « @ » (179.237.104.243).

   Ajoutez aussi un **AAAA** si « @ » en a un. Attendez 5 minutes.
2. **Activation.** Sur le serveur (Manager Infomaniak, votre VPS, **Console**), tapez :
   ```bash
   sudo /opt/bailio/deploy/vps/reseaux.sh reseaux.bailio.fr
   ```
   Le script affiche une adresse, l'identifiant `bailio` et un mot de passe. Notez le mot de passe dans votre
   gestionnaire de mots de passe.
3. **Premier compte.** Ouvrez https://reseaux.bailio.fr, entrez l'identifiant et le mot de passe affichés, puis créez
   votre compte n8n. Prenez votre adresse email et un **autre** mot de passe.

Pour arrêter : `sudo /opt/bailio/deploy/vps/reseaux.sh --off`. Le site Bailio n'est jamais touché : n8n tourne à
part, avec une mémoire limitée, et n'a accès ni à la base ni aux documents des propriétaires.

## 2. Brancher chaque réseau

Chaque réseau demande de créer une « application » gratuite sur son site pour développeurs. Elle donne deux codes
(identifiant et secret), **à coller directement dans n8n**, jamais ailleurs. Partout, l'adresse de retour à indiquer
est la même :

```
https://reseaux.bailio.fr/rest/oauth2-credential/callback
```

Les pages demandées lors de la création d'une application :
- règles de confidentialité : https://bailio.fr/confidentialite ;
- conditions d'utilisation : https://bailio.fr/conditions ;
- site : https://bailio.fr.

| Réseau | Où créer l'application | À savoir |
|---|---|---|
| **YouTube et Shorts** | console.cloud.google.com : nouveau projet, activer « YouTube Data API v3 », identifiants OAuth « Application Web » | Un Short est une vidéo verticale de 3 minutes au plus. Tant que Google n'a pas validé l'application (formulaire d'audit de l'API YouTube), les vidéos envoyées restent privées. Quelques envois par jour avec le quota gratuit. |
| **Facebook (page Bailio)** | developers.facebook.com : application de type « Entreprise », produit « Connexion Facebook » | Publication sur une **page**, pas sur un profil personnel. |
| **Instagram (Reels)** | Même application Meta que Facebook | Compte Instagram **professionnel** relié à la page Facebook. La vérification de l'application par Meta est nécessaire pour publier pour de bon. |
| **TikTok** | developers.tiktok.com : application, produit « Content Posting API » | Tant que TikTok n'a pas validé l'application, les vidéos sont publiées en privé (visibles par vous seul). La validation prend quelques jours à quelques semaines. |
| **LinkedIn (page Bailio)** | linkedin.com/developers : application liée à la page Bailio | Publier sur la page demande le produit « Community Management API », accordé après une demande. Sur un profil personnel, « Share on LinkedIn » suffit. |
| **X (Twitter)** | developer.x.com : projet et application, OAuth 2.0 | Le niveau gratuit permet peu de publications par mois, et ses règles changent souvent : à vérifier au moment de l'inscription. |
| **Pinterest** | developers.pinterest.com : application, accès « Trial » puis « Standard » | Épingles vidéo avec un lien vers le guide écrit de bailio.fr. Les gens y cherchent « bail », « état des lieux », « investissement locatif ». |
| **Fiche Google de Bailio (Google Business Profile)** | business.google.com : créer la fiche, puis dans le projet Google Cloud de YouTube, demander l'accès à l'API Business Profile (formulaire Google) | Visible dans Google et Maps. Une publication par vidéo, avec le lien du guide. L'accès à l'API est accordé par Google sur demande. |

Dans n8n, menu « Credentials », puis « Add credential » : choisissez le réseau, collez l'identifiant et le secret,
cliquez sur « Connect » et acceptez sur la page du réseau.

## 3. Laisser Claude publier

Une fois les réseaux branchés, Claude construit dans n8n le circuit de publication (une vidéo, un texte par réseau)
et le teste par une publication privée sur chaque réseau. Pour que Claude puisse l'appeler, ajoutez le mot de passe
de l'étape 1 dans les réglages de l'environnement Claude (menu de l'environnement dans la barre de titre de la
session, « Modifier », puis secrets ou variables d'environnement), sous le nom `BAILIO_RESEAUX_PASSWORD`. Ne le
collez jamais dans la conversation.

Choix retenu : **automatique**. Chaque jour, Claude prend les nouvelles vidéos d'un dossier Google Drive, écrit
pour chacune la description et les tags propres à chaque réseau, publie, et écrit le guide qui l'accompagne sur
bailio.fr.

## Guides écrits sur bailio.fr

Chaque vidéo devient un guide écrit sur https://bailio.fr/guides (`client/src/content/guides.ts`), bien placé dans
Google : c'est le canal qui rapporte le plus à long terme. Les règles citées sont vérifiées sur une source officielle
(service-public.fr, Légifrance), indiquée en fin d'article avec sa date de vérification. Le plan du site et
`llms.txt` reprennent chaque guide automatiquement.

## À faire à la main

Groupes Facebook de propriétaires et Reddit (r/immobilier, r/vosfinances) : aucune publication automatique possible
ni souhaitable (règles des groupes). Répondre aux questions des propriétaires, sans publicité directe, avec le lien
du guide qui répond quand il existe.

## Autres canaux à envisager

| Canal | Pourquoi | Automatisable gratuitement |
|---|---|---|
| **Threads** | Même application Meta qu'Instagram, audience proche | Oui (API Threads) |
| **Bluesky** | Inscription simple, aucune validation | Oui, avec un mot de passe d'application |

## Méthode de Claude

- `.agents/product-marketing.md` : produit, public, voix de Bailio (lu par toutes les skills marketing).
- `.claude/skills/bailio-marketing/SKILL.md` : règles (exactitude juridique, musique libre de droits, aucun faux
  témoignage), lignes éditoriales, textes par réseau, boucle quotidienne et revue hebdomadaire.
- `.claude/skills/` : méthodes générales (réseaux, vidéo, contenu, référencement, statistiques…), reprises du dépôt
  coreyhaines31/marketingskills (licence MIT, `LICENSE-marketingskills`).
