# 📡 Documentation API

Base URL: `http://localhost:5000/api/v1`

## 🔐 Authentification

Toutes les routes protégées nécessitent un token JWT dans le header :
\`\`\`
Authorization: Bearer <token>
\`\`\`

### POST /auth/register
Inscription d'un nouvel utilisateur

**Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "TENANT" // ou "OWNER"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
\`\`\`

### POST /auth/login
Connexion

**Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

### POST /auth/refresh
Rafraîchir le token d'accès

**Body:**
\`\`\`json
{
  "refreshToken": "..."
}
\`\`\`

---

## 👤 Utilisateurs

### GET /users/me
Récupérer le profil de l'utilisateur connecté

### PUT /users/me
Mettre à jour son profil

**Body:**
\`\`\`json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+33612345678",
  "bio": "..."
}
\`\`\`

---

## 🏠 Propriétés

### GET /properties
Liste des propriétés avec filtres

**Query params:**
- `city` - Ville
- `type` - Type (APARTMENT, HOUSE, STUDIO...)
- `minPrice` - Prix minimum
- `maxPrice` - Prix maximum
- `bedrooms` - Nombre de chambres
- `status` - Statut (AVAILABLE, OCCUPIED...)
- `page` - Page (défaut: 1)
- `limit` - Limite par page (défaut: 20)

### GET /properties/:id
Détails d'une propriété

### POST /properties
Créer une propriété (OWNER uniquement)

**Body:**
\`\`\`json
{
  "title": "Appartement 3P centre-ville",
  "description": "...",
  "type": "APARTMENT",
  "address": "123 Rue...",
  "city": "Montpellier",
  "postalCode": "34000",
  "bedrooms": 2,
  "bathrooms": 1,
  "surface": 70,
  "price": 1200,
  "charges": 150,
  "deposit": 2400,
  "amenities": ["wifi", "dishwasher"],
  ...
}
\`\`\`

### PUT /properties/:id
Modifier une propriété

### DELETE /properties/:id
Supprimer une propriété

---

## 📅 Réservations (Visites)

### GET /bookings
Mes réservations

### POST /bookings
Créer une réservation

**Body:**
\`\`\`json
{
  "propertyId": "...",
  "visitDate": "2026-03-15",
  "visitTime": "14:00",
  "tenantNotes": "..."
}
\`\`\`

### PUT /bookings/:id/confirm
Confirmer une visite (OWNER)

### PUT /bookings/:id/cancel
Annuler une visite

---

## 💬 Messages

### GET /messages
Conversations

### GET /messages/:userId
Messages avec un utilisateur

### POST /messages
Envoyer un message

**Body:**
\`\`\`json
{
  "receiverId": "...",
  "content": "Message...",
  "attachments": ["url1", "url2"]
}
\`\`\`

### PUT /messages/:id/read
Marquer comme lu

---

## ❤️ Favoris

### GET /favorites
Mes favoris

### POST /favorites
Ajouter aux favoris

**Body:**
\`\`\`json
{
  "propertyId": "..."
}
\`\`\`

### DELETE /favorites/:propertyId
Retirer des favoris

---

## 🔔 Notifications

### GET /notifications
Mes notifications

### PUT /notifications/:id/read
Marquer comme lue

### PUT /notifications/read-all
Marquer toutes comme lues

---

## 📄 Contrats

### GET /contracts
Mes contrats

### GET /contracts/:id
Détail d'un contrat

### POST /contracts
Créer un contrat (OWNER)

**Body:**
\`\`\`json
{
  "propertyId": "...",
  "tenantId": "...",
  "startDate": "2026-04-01",
  "endDate": "2027-03-31",
  "monthlyRent": 1200,
  "charges": 150,
  "deposit": 2400
}
\`\`\`

---

## 📤 Upload

### POST /upload/image
Upload d'image

**Body:** FormData avec clé `image`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "url": "https://..."
  }
}
\`\`\`

---

## ⚠️ Codes d'erreur

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

**Format d'erreur:**
\`\`\`json
{
  "success": false,
  "message": "Error message",
  "errors": [...]
}
\`\`\`
