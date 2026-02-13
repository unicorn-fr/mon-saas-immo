# 🏠 Plateforme de Gestion Locative

Plateforme web moderne de gestion locative permettant la mise en relation directe entre propriétaires et locataires, sans frais d'agence.

## ✨ Fonctionnalités

### Pour les Propriétaires
- 📝 Publication illimitée d'annonces
- 📊 Tableau de bord avec statistiques
- 📅 Gestion des visites (calendrier intégré)
- 👥 Gestion des locataires
- 📋 Gestion des contrats
- 💬 Messagerie avec les locataires
- 🔔 Notifications en temps réel

### Pour les Locataires
- 🔍 Recherche avancée de biens
- 🗺️ Recherche géographique sur carte
- ❤️ Système de favoris
- 📅 Réservation de visites en ligne
- 💬 Messagerie avec les propriétaires
- 🔔 Alertes et notifications

## 🏗️ Architecture Technique

### Stack Frontend
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **TailwindCSS** (styling)
- **Zustand** (state management)
- **React Query** (data fetching)
- **React Router** (routing)
- **Socket.io Client** (real-time)
- **Leaflet** (maps)
- **PWA** (Progressive Web App)

### Stack Backend
- **Node.js 20** + **TypeScript**
- **Express** (API framework)
- **PostgreSQL 15** (database)
- **Prisma** (ORM)
- **Redis** (cache & sessions)
- **Socket.io** (WebSocket)
- **JWT** (authentication)
- **Nodemailer** (emails)

### Infrastructure
- **Docker** + **Docker Compose**
- **Nginx** (reverse proxy)
- **GitHub Actions** (CI/CD ready)

## 🚀 Installation

### Prérequis
- Node.js 20+
- Docker & Docker Compose
- Git

### 1. Cloner le projet

\`\`\`bash
git clone <repo-url>
cd plateforme-gestion-locative
\`\`\`

### 2. Configuration de l'environnement

**Client :**
\`\`\`bash
cd client
cp .env.example .env
\`\`\`

**Server :**
\`\`\`bash
cd server
cp .env.example .env
# Modifiez les variables d'environnement selon vos besoins
\`\`\`

### 3. Démarrer les services Docker

\`\`\`bash
# À la racine du projet
docker-compose up -d
\`\`\`

Cela démarre :
- PostgreSQL sur le port 5432
- Redis sur le port 6379
- pgAdmin sur le port 5050 (optionnel)

### 4. Installation des dépendances

**Client :**
\`\`\`bash
cd client
npm install
\`\`\`

**Server :**
\`\`\`bash
cd server
npm install
\`\`\`

### 5. Configuration de la base de données

\`\`\`bash
cd server

# Générer le client Prisma
npm run prisma:generate

# Créer la base de données
npm run prisma:push

# Peupler avec des données de test (optionnel)
npm run prisma:seed
\`\`\`

### 6. Lancer l'application

**Terminal 1 - Server :**
\`\`\`bash
cd server
npm run dev
\`\`\`
Le serveur démarre sur http://localhost:5000

**Terminal 2 - Client :**
\`\`\`bash
cd client
npm run dev
\`\`\`
Le client démarre sur http://localhost:3000

## 📁 Structure du Projet

\`\`\`
plateforme-gestion-locative/
├── client/                 # Frontend React
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── store/         # State management
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utilities
│   └── package.json
│
├── server/                # Backend Node.js
│   ├── prisma/           # Database schema & migrations
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middlewares/  # Express middlewares
│   │   ├── config/       # Configuration
│   │   └── utils/        # Utilities
│   └── package.json
│
├── docker/               # Docker configuration
├── docs/                 # Documentation
└── docker-compose.yml    # Docker Compose config
\`\`\`

## 🔑 Utilisateurs de Test

Après avoir exécuté `npm run prisma:seed` :

**Propriétaire :**
- Email: `owner1@test.com`
- Mot de passe: `password123`

**Locataire :**
- Email: `tenant1@test.com`
- Mot de passe: `password123`

## 📊 Base de Données

Accéder à pgAdmin pour gérer la base de données :
- URL: http://localhost:5050
- Email: admin@immoparticuliers.fr
- Mot de passe: admin

Prisma Studio (interface graphique) :
\`\`\`bash
cd server
npm run prisma:studio
\`\`\`

## 🔧 Scripts Disponibles

### Client
- `npm run dev` - Démarre le serveur de développement
- `npm run build` - Build pour production
- `npm run preview` - Prévisualise le build
- `npm run lint` - Linte le code

### Server
- `npm run dev` - Démarre le serveur en mode développement
- `npm run build` - Compile TypeScript
- `npm start` - Démarre le serveur en production
- `npm run prisma:generate` - Génère le client Prisma
- `npm run prisma:push` - Synchronise le schéma avec la DB
- `npm run prisma:migrate` - Crée une migration
- `npm run prisma:studio` - Ouvre Prisma Studio
- `npm run prisma:seed` - Peuple la DB avec des données de test

## 🌐 Endpoints API

L'API est disponible à `http://localhost:5000/api/v1`

**Endpoints principaux :**
- `/auth` - Authentification
- `/users` - Gestion utilisateurs
- `/properties` - Gestion des biens
- `/bookings` - Gestion des visites
- `/messages` - Messagerie
- `/contracts` - Gestion des contrats
- `/favorites` - Favoris
- `/notifications` - Notifications

Documentation complète : voir `docs/API.md`

## 📱 Progressive Web App

L'application est une PWA installable :
- Fonctionne hors ligne
- Installable sur mobile et desktop
- Notifications push (à venir)
- Synchronisation en arrière-plan

## 🚢 Déploiement

Voir la documentation complète dans `docs/DEPLOYMENT.md`

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT.

## 👨‍💻 Auteur

Développé avec ❤️ par [Votre Nom]

---

**🎯 Prochaines étapes :**
1. Implémentation de l'authentification complète
2. Module de gestion des biens
3. Calendrier des visites
4. Messagerie en temps réel
5. Système de contrats
