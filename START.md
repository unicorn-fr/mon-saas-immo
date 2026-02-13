# 🚀 Guide de Démarrage Rapide

## Prérequis Installés ✅
- Node.js v22.14.0
- npm 10.9.2
- PostgreSQL 14.19

## Base de Données ✅
- Database: `immoparticuliers_dev`
- Migrations: Appliquées
- Données de test: Créées

## 📝 Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | admin@immoparticuliers.fr | admin123 |
| **Propriétaire** | owner@example.com | owner123 |
| **Locataire** | tenant@example.com | tenant123 |

## 🚀 Lancer l'Application

### Option 1: Lancement Manuel (2 terminaux)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Le serveur démarre sur **http://localhost:5000**

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
L'application démarre sur **http://localhost:5173**

### Option 2: Script de Lancement Automatique

Depuis la racine du projet:
```bash
npm start
```

## 🌐 URLs de l'Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/health

## 🧪 Test de l'Application

### 1. Tester en tant qu'Admin
1. Aller sur http://localhost:5173/login
2. Se connecter avec: `admin@immoparticuliers.fr` / `admin123`
3. Accéder au dashboard admin: `/admin`
4. Voir les statistiques et gérer les utilisateurs

### 2. Tester en tant que Propriétaire
1. Se connecter avec: `owner@example.com` / `owner123`
2. Voir le dashboard propriétaire: `/dashboard/owner`
3. Voir ses propriétés: `/properties/owner/me`
4. 3 propriétés de test sont déjà créées
5. Créer une nouvelle propriété: `/properties/new`
6. Gérer les visites: `/bookings/manage`
7. Voir les contrats: `/contracts`

### 3. Tester en tant que Locataire
1. Se connecter avec: `tenant@example.com` / `tenant123`
2. Voir le dashboard locataire: `/dashboard/tenant`
3. Rechercher des propriétés: `/search`
4. Tester la vue carte interactive
5. Ajouter des favoris
6. Demander des visites
7. Voir les messages: `/messages`

### 4. Tester les Fonctionnalités

#### Recherche Avancée
- Aller sur `/search`
- Utiliser les filtres (prix, type, équipements...)
- Tester les 3 vues: Grille, Liste, Carte
- Cliquer sur les marqueurs de la carte

#### Système de Visites
- En tant que locataire: demander une visite
- En tant que propriétaire: confirmer/annuler une visite

#### Messagerie
- Envoyer un message depuis une propriété
- Voir la conversation dans `/messages`
- Répondre aux messages

#### Notifications
- Cliquer sur la cloche en haut à droite
- Voir les notifications
- Accéder à `/notifications` pour la vue complète

#### Contrats (Propriétaire)
- Créer un contrat: `/contracts/new`
- Signer le contrat
- Activer après signature des 2 parties

#### PWA
- Sur mobile: voir le prompt d'installation
- Tester le mode hors ligne

## 📊 Endpoints API Disponibles

### Auth
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Déconnexion

### Properties
- `GET /properties` - Liste propriétés
- `GET /properties/search` - Recherche
- `GET /properties/advanced-search` - Recherche avancée
- `GET /properties/:id` - Détails propriété
- `POST /properties` - Créer (Owner)
- `PUT /properties/:id` - Modifier (Owner)
- `DELETE /properties/:id` - Supprimer (Owner)

### Bookings
- `GET /bookings` - Liste visites
- `POST /bookings` - Créer visite
- `PUT /bookings/:id` - Modifier visite
- `DELETE /bookings/:id` - Annuler visite

### Messages
- `GET /messages/conversations` - Liste conversations
- `GET /messages/conversations/:id` - Détails conversation
- `POST /messages` - Envoyer message

### Contracts
- `GET /contracts` - Liste contrats
- `POST /contracts` - Créer contrat (Owner)
- `PUT /contracts/:id/sign` - Signer contrat
- `PUT /contracts/:id/activate` - Activer (Owner)

### Admin
- `GET /admin/statistics` - Stats plateforme (Admin)
- `GET /admin/users` - Liste utilisateurs (Admin)
- `PUT /admin/users/:id/role` - Modifier rôle (Admin)

## 🐛 Dépannage

### Le backend ne démarre pas
```bash
cd server
rm -rf node_modules
npm install
npm run dev
```

### Le frontend ne démarre pas
```bash
cd client
rm -rf node_modules
npm install
npm run dev
```

### Erreur de connexion à la base de données
Vérifier que PostgreSQL est lancé:
```bash
brew services start postgresql@14
```

### Réinitialiser la base de données
```bash
cd server
npx prisma migrate reset
npx tsx prisma/seed.ts
```

## 📝 Prochaines Étapes

1. **Tester toutes les fonctionnalités** listées ci-dessus
2. **Noter les bugs ou améliorations** nécessaires
3. **Vérifier le responsive** sur mobile
4. **Tester les notifications** PWA
5. **Valider les workflows** complets (inscription → recherche → visite → contrat)

## 🎨 Personnalisation

### Changer les couleurs
Modifier `client/tailwind.config.js`:
```js
colors: {
  primary: { ... }
}
```

### Ajouter des images
Placer les images dans `server/uploads/`

### Modifier l'URL de l'API
Modifier `client/.env`:
```
VITE_API_URL=http://votre-api.com/api/v1
```

## 📚 Documentation Complète

Voir `PROGRESS.md` pour:
- Architecture détaillée
- Liste complète des fonctionnalités
- Diagrammes et explications techniques

---

**Bon test ! 🎉**
