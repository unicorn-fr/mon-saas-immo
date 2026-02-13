# 🚀 Guide de Démarrage Rapide

## Installation en 5 minutes

### 1️⃣ Démarrer Docker
\`\`\`bash
docker-compose up -d
\`\`\`
✅ PostgreSQL, Redis et pgAdmin sont maintenant lancés

### 2️⃣ Installer le Server
\`\`\`bash
cd server
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
\`\`\`
✅ Le serveur tourne sur http://localhost:5000

### 3️⃣ Installer le Client (nouveau terminal)
\`\`\`bash
cd client
npm install
cp .env.example .env
npm run dev
\`\`\`
✅ L'application tourne sur http://localhost:3000

### 4️⃣ Tester l'application

Ouvrez http://localhost:3000 et connectez-vous avec :
- **Propriétaire :** `owner1@test.com` / `password123`
- **Locataire :** `tenant1@test.com` / `password123`

---

## Commandes Utiles

### Base de données
\`\`\`bash
# Ouvrir Prisma Studio
cd server && npm run prisma:studio

# Réinitialiser la DB
cd server && npm run prisma:push && npm run prisma:seed
\`\`\`

### Développement
\`\`\`bash
# Voir les logs Docker
docker-compose logs -f

# Arrêter Docker
docker-compose down

# Nettoyer complètement
docker-compose down -v
\`\`\`

---

## Prochaines Étapes

1. ✅ Infrastructure mise en place
2. 🔄 Implémenter l'authentification
3. 🔄 Module gestion des biens
4. 🔄 Calendrier des visites
5. 🔄 Messagerie temps réel

Voir le README.md complet pour plus de détails !
