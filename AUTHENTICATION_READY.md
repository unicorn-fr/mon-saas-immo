# 🎉 Système d'Authentification Opérationnel !

Le système d'authentification complet (Backend + Frontend) est maintenant **prêt à être testé** !

---

## 🚀 Démarrage Rapide (5 minutes)

### 1️⃣ Démarrer la base de données
```bash
docker-compose up -d
```
✅ PostgreSQL, Redis et pgAdmin sont maintenant lancés

### 2️⃣ Configurer et démarrer le backend
```bash
cd server

# Copier les variables d'environnement
cp .env.example .env

# Générer le client Prisma
npm run prisma:generate

# Créer les tables
npm run prisma:push

# Peupler avec des données de test
npm run prisma:seed

# Démarrer le serveur
npm run dev
```
✅ Backend API disponible sur http://localhost:5000

### 3️⃣ Démarrer le frontend (nouveau terminal)
```bash
cd client

# Copier les variables d'environnement
cp .env.example .env

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer l'application
npm run dev
```
✅ Application web disponible sur http://localhost:3000

---

## 🧪 Tester l'Authentification

### Option 1 : Interface Web (Recommandé)

1. **Ouvrir** http://localhost:3000
2. **Cliquer** sur "Se connecter"
3. **Utiliser un compte de test :**

```
👤 PROPRIÉTAIRE
Email: owner1@test.com
Mot de passe: password123

👤 LOCATAIRE
Email: tenant1@test.com
Mot de passe: password123
```

4. **Après connexion, vérifier :**
   - Le token est stocké dans localStorage
   - La page redirige vers l'accueil
   - L'utilisateur est connecté

### Option 2 : Créer un Nouveau Compte

1. **Cliquer** sur "S'inscrire"
2. **Choisir** le type : Propriétaire ou Locataire
3. **Remplir** le formulaire :
   - Prénom et Nom
   - Email valide
   - Téléphone (optionnel)
   - Mot de passe (critères : 8+ caractères, majuscule, minuscule, chiffre)
4. **Accepter** les CGU
5. **S'inscrire** → Connexion automatique !

### Option 3 : Tester l'API Directement

Avec **VS Code REST Client** ou **Postman**, utiliser le fichier :
```
server/auth.test.http
```

Ou avec **curl** :

```bash
# S'inscrire
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouveau@test.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User",
    "role": "TENANT"
  }'

# Se connecter
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner1@test.com",
    "password": "password123"
  }'

# Récupérer son profil (remplacer YOUR_TOKEN)
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ Fonctionnalités Disponibles

### Endpoints API (/api/v1/auth)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/register` | Inscription | ❌ |
| POST | `/login` | Connexion | ❌ |
| POST | `/refresh` | Rafraîchir le token | ❌ |
| POST | `/logout` | Déconnexion | ❌ |
| POST | `/forgot-password` | Demande reset password | ❌ |
| GET | `/me` | Profil utilisateur | ✅ |
| POST | `/change-password` | Changer mot de passe | ✅ |
| POST | `/logout-all` | Déconnexion tous appareils | ✅ |

### Features Frontend

- ✅ **Page Login** : Connexion avec comptes démo
- ✅ **Page Register** : Inscription multi-rôle (Owner/Tenant)
- ✅ **Validation** : Validation en temps réel des formulaires
- ✅ **Sécurité** : Tokens JWT avec refresh automatique
- ✅ **UX** : Loading states, messages d'erreur, indicateurs
- ✅ **Routes protégées** : Structure prête pour dashboards
- ✅ **RBAC** : Contrôle d'accès par rôle (Owner/Tenant/Admin)

---

## 🔐 Sécurité Implémentée

- ✅ **JWT** avec access token (15min) + refresh token (7 jours)
- ✅ **Rotation** des refresh tokens
- ✅ **Passwords** hashés avec bcrypt (12 rounds)
- ✅ **Validation** stricte (email, mot de passe fort)
- ✅ **Rate limiting** activé (100 req/15min)
- ✅ **CORS** configuré
- ✅ **Helmet.js** pour headers sécurisés
- ✅ **RBAC** (Role-Based Access Control)
- ✅ **Input sanitization**

---

## 📁 Fichiers Créés

### Backend (13 fichiers)
```
server/src/
├── utils/
│   ├── jwt.util.ts              # Gestion JWT
│   ├── password.util.ts          # Hashage/validation passwords
│   └── validation.util.ts        # Validation inputs
├── config/
│   └── database.ts               # Client Prisma
├── services/
│   └── auth.service.ts           # Logique métier auth
├── controllers/
│   └── auth.controller.ts        # Handlers HTTP
├── middlewares/
│   └── auth.middleware.ts        # Auth + RBAC middleware
└── routes/
    └── auth.routes.ts            # Routes API

server/
├── auth.test.http                # Tests HTTP
└── docs/
    └── AUTH_API.md               # Documentation API
```

### Frontend (9 fichiers)
```
client/src/
├── types/
│   └── auth.types.ts             # Interfaces TypeScript
├── services/
│   ├── api.service.ts            # Client Axios
│   └── auth.service.ts           # Appels API auth
├── store/
│   └── authStore.ts              # Zustand store
├── hooks/
│   └── useAuth.ts                # Hook personnalisé
├── components/auth/
│   └── ProtectedRoute.tsx        # Routes protégées
└── pages/
    ├── Login.tsx                 # Page connexion
    ├── Register.tsx              # Page inscription
    └── App.tsx                   # Routing (mis à jour)
```

---

## 🐛 Debugging

### Le serveur ne démarre pas
```bash
# Vérifier que Docker est lancé
docker ps

# Vérifier les logs
docker-compose logs

# Vérifier les variables d'environnement
cat server/.env
```

### Erreur de connexion à la DB
```bash
# Recréer la base
cd server
npm run prisma:push
npm run prisma:seed
```

### Token invalide / expiré
- Se déconnecter et se reconnecter
- Vider le localStorage du navigateur
- Vérifier que les secrets JWT dans `.env` sont bien configurés

### CORS Error
- Vérifier que `CORS_ORIGIN=http://localhost:3000` dans `server/.env`
- Vérifier que le frontend tourne bien sur le port 3000

---

## 📊 Outils de Développement

### Prisma Studio (Interface DB)
```bash
cd server
npm run prisma:studio
```
Ouvre http://localhost:5555 pour visualiser/éditer les données

### pgAdmin (PostgreSQL)
- URL: http://localhost:5050
- Email: admin@immoparticuliers.fr
- Password: admin

### Logs Backend
Les logs s'affichent dans le terminal où tourne `npm run dev`

---

## 📖 Documentation Complète

| Fichier | Description |
|---------|-------------|
| `README.md` | Vue d'ensemble du projet |
| `QUICKSTART.md` | Guide démarrage rapide |
| `docs/API.md` | Documentation API générale |
| `docs/AUTH_API.md` | Documentation authentification détaillée |
| `docs/PROGRESS.md` | État d'avancement complet |
| `server/auth.test.http` | Exemples de requêtes HTTP |

---

## 🎯 Prochaines Étapes

Une fois l'authentification testée et validée, voici les prochains modules à développer :

### 1. Module Propriétés (Backend)
- CRUD des biens immobiliers
- Upload d'images
- Filtrage et recherche

### 2. Module Propriétés (Frontend)
- Formulaire création propriété
- Liste et détails
- Gestion des images

### 3. Calendrier/Réservations ⭐ PRIORITÉ
- Système de réservation de visites
- Calendrier interactif
- Notifications

---

## ✨ Félicitations !

Vous disposez maintenant d'un système d'authentification complet, sécurisé et production-ready ! 🚀

**Le projet est prêt pour continuer avec les modules de gestion locative.**

---

**Questions ?** Consultez la documentation dans `docs/` ou les commentaires dans le code.

**Problème ?** Vérifiez que Docker, Node.js et npm sont bien installés et à jour.
