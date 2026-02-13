# 🏠 Property Management API Documentation

Base URL: `http://localhost:5000/api/v1`

## Property Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Get All Properties

**GET** `/properties`

Get list of properties with optional filters and pagination.

**Query Parameters:**
```
city          - Filter by city (string)
type          - Filter by type: APARTMENT, HOUSE, STUDIO, DUPLEX, LOFT
status        - Filter by status: AVAILABLE, OCCUPIED, RESERVED, DRAFT
minPrice      - Minimum price (number)
maxPrice      - Maximum price (number)
minSurface    - Minimum surface in m² (number)
maxSurface    - Maximum surface in m² (number)
bedrooms      - Minimum number of bedrooms (number)
bathrooms     - Minimum number of bathrooms (number)
furnished     - Furnished (true/false)
hasParking    - Has parking (true/false)
hasBalcony    - Has balcony (true/false)
hasElevator   - Has elevator (true/false)
hasGarden     - Has garden (true/false)
amenities     - Array of amenities (can repeat: amenities=wifi&amenities=ac)
page          - Page number (default: 1)
limit         - Items per page (default: 20)
sortBy        - Sort field (default: createdAt)
sortOrder     - Sort direction: asc or desc (default: desc)
```

**Example:**
```
GET /properties?city=Montpellier&type=APARTMENT&minPrice=800&maxPrice=1500&bedrooms=2&page=1&limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "uuid",
        "title": "Appartement 3P Centre-Ville",
        "description": "...",
        "type": "APARTMENT",
        "status": "AVAILABLE",
        "address": "15 Rue...",
        "city": "Montpellier",
        "postalCode": "34000",
        "price": 1200,
        "surface": 75,
        "bedrooms": 2,
        "bathrooms": 1,
        "images": ["url1", "url2"],
        "hasParking": false,
        "hasBalcony": true,
        "owner": {
          "id": "uuid",
          "firstName": "Jean",
          "lastName": "Dupont"
        },
        "_count": {
          "bookings": 5,
          "favorites": 12
        }
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasMore": true
    }
  }
}
```

---

#### 2. Search Properties

**GET** `/properties/search`

Search properties by text (title, description, address, city).

**Query Parameters:**
```
q             - Search query (required)
page          - Page number
limit         - Items per page
sortBy        - Sort field
sortOrder     - Sort direction
```

**Example:**
```
GET /properties/search?q=Montpellier centre&page=1&limit=10
```

---

#### 3. Get Property by ID

**GET** `/properties/:id`

Get detailed information about a specific property.

**Query Parameters:**
```
includeOwner  - Include owner details (true/false, default: false)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "property": {
      "id": "uuid",
      "title": "Appartement 3P Centre-Ville",
      "description": "Description complète...",
      "type": "APARTMENT",
      "status": "AVAILABLE",
      "address": "15 Rue de la Loge",
      "city": "Montpellier",
      "postalCode": "34000",
      "latitude": 43.6108,
      "longitude": 3.8767,
      "bedrooms": 2,
      "bathrooms": 1,
      "surface": 75,
      "floor": 3,
      "totalFloors": 5,
      "furnished": true,
      "price": 1200,
      "charges": 150,
      "deposit": 2400,
      "images": ["url1", "url2"],
      "virtualTour": "url",
      "hasParking": false,
      "hasBalcony": true,
      "hasElevator": true,
      "hasGarden": false,
      "amenities": ["wifi", "dishwasher", "ac"],
      "availableFrom": "2026-03-01T00:00:00.000Z",
      "views": 156,
      "contactCount": 23,
      "createdAt": "2026-02-10T10:00:00.000Z",
      "publishedAt": "2026-02-10T12:00:00.000Z",
      "owner": {
        "id": "uuid",
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean@example.com",
        "phone": "+33612345678"
      },
      "_count": {
        "bookings": 5,
        "favorites": 12
      }
    }
  }
}
```

**Note:** View count is automatically incremented on each request.

---

### Owner-Only Endpoints (Authentication + OWNER role required)

#### 4. Create Property

**POST** `/properties`

Create a new property listing.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "title": "Appartement 3P Centre-Ville Montpellier",
  "description": "Description complète...",
  "type": "APARTMENT",
  "address": "15 Rue de la Loge",
  "city": "Montpellier",
  "postalCode": "34000",
  "country": "France",
  "latitude": 43.6108,
  "longitude": 3.8767,
  "bedrooms": 2,
  "bathrooms": 1,
  "surface": 75,
  "floor": 3,
  "totalFloors": 5,
  "furnished": true,
  "price": 1200,
  "charges": 150,
  "deposit": 2400,
  "images": ["url1", "url2"],
  "virtualTour": "url",
  "hasParking": false,
  "hasBalcony": true,
  "hasElevator": true,
  "hasGarden": false,
  "amenities": ["wifi", "dishwasher", "washing_machine", "ac"],
  "availableFrom": "2026-03-01T00:00:00.000Z"
}
```

**Required Fields:**
- title, description, type, address, city, postalCode
- bedrooms, bathrooms, surface, price

**Success Response (201):**
```json
{
  "success": true,
  "message": "Property created successfully",
  "data": {
    "property": { /* property object */ }
  }
}
```

**Note:** Property is created with status `DRAFT` by default.

---

#### 5. Get My Properties

**GET** `/properties/owner/me`

Get all properties owned by authenticated user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
```
page, limit, sortBy, sortOrder
```

---

#### 6. Get My Statistics

**GET** `/properties/owner/me/statistics`

Get statistics for owner's properties.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalProperties": 8,
      "availableProperties": 5,
      "occupiedProperties": 2,
      "draftProperties": 1,
      "totalViews": 1250,
      "totalContacts": 87
    }
  }
}
```

---

#### 7. Update Property

**PUT** `/properties/:id`

Update property information.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:** (all fields optional)
```json
{
  "title": "Updated title",
  "price": 1250,
  "description": "Updated description",
  "status": "AVAILABLE",
  "images": ["new-url1", "new-url2"]
}
```

---

#### 8. Publish Property

**PUT** `/properties/:id/publish`

Change property status from DRAFT to AVAILABLE.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Property published successfully",
  "data": {
    "property": { /* updated property */ }
  }
}
```

---

#### 9. Mark Property as Occupied

**PUT** `/properties/:id/occupy`

Change property status to OCCUPIED.

**Headers:**
```
Authorization: Bearer <accessToken>
```

---

#### 10. Delete Property

**DELETE** `/properties/:id`

Delete a property (owner must be the property owner).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Property deleted successfully"
}
```

---

### Authenticated User Endpoints

#### 11. Contact Property Owner

**POST** `/properties/:id/contact`

Increment contact count when a user contacts the owner.

**Headers:**
```
Authorization: Bearer <accessToken>
```

---

## Property Types

```typescript
enum PropertyType {
  APARTMENT   // Appartement
  HOUSE       // Maison
  STUDIO      // Studio
  DUPLEX      // Duplex
  LOFT        // Loft
}
```

## Property Status

```typescript
enum PropertyStatus {
  AVAILABLE   // Disponible
  OCCUPIED    // Occupé
  RESERVED    // Réservé
  DRAFT       // Brouillon
}
```

## Common Amenities

```
wifi, fiber, dishwasher, washing_machine, dryer, oven, microwave,
ac, heating, fireplace, garage, cellar, terrace, garden, pool,
security_door, intercom, video_intercom, alarm, parking
```

---

## Upload Endpoints

### Upload Single Image

**POST** `/upload/image`

Upload a single image for property listing.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Form Data:**
```
image: <file> (JPEG, PNG, WebP, max 5MB)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "/uploads/1707562800000-image.jpg"
  }
}
```

---

### Upload Multiple Images

**POST** `/upload/images`

Upload multiple images (max 10).

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Form Data:**
```
images: <file[]> (max 10 files)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "5 images uploaded successfully",
  "data": {
    "urls": [
      "/uploads/1707562800000-image1.jpg",
      "/uploads/1707562800001-image2.jpg"
    ]
  }
}
```

**Image Processing:**
- Automatic resize (max 1200x800px)
- JPEG compression (quality 80%)
- Optimized for web

---

## Error Responses

**400 - Bad Request:**
```json
{
  "success": false,
  "message": "Missing required fields"
}
```

**401 - Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**403 - Forbidden:**
```json
{
  "success": false,
  "message": "Only owners can create properties"
}
```

**404 - Not Found:**
```json
{
  "success": false,
  "message": "Property not found"
}
```

---

## Usage Examples

### Complete Property Creation Flow

1. **Login as Owner**
```bash
POST /auth/login
```

2. **Upload Images**
```bash
POST /upload/images
# Get URLs: ["/uploads/img1.jpg", "/uploads/img2.jpg"]
```

3. **Create Property**
```bash
POST /properties
Body: { title, description, images: ["url1", "url2"], ... }
# Property created with status DRAFT
```

4. **Publish Property**
```bash
PUT /properties/{id}/publish
# Status changes to AVAILABLE
```

### Search Flow (Tenant)

1. **Search Properties**
```bash
GET /properties?city=Montpellier&type=APARTMENT&maxPrice=1500
```

2. **View Property Details**
```bash
GET /properties/{id}?includeOwner=true
```

3. **Contact Owner**
```bash
POST /properties/{id}/contact
```

---

## Best Practices

1. **Images:**
   - Upload images first, get URLs
   - Store URLs in property `images` array
   - Maximum 10 images per property recommended

2. **Status Workflow:**
   - DRAFT → AVAILABLE (publish)
   - AVAILABLE → RESERVED (booking confirmed)
   - RESERVED → OCCUPIED (lease signed)

3. **Filtering:**
   - Combine multiple filters for precise search
   - Use pagination for large result sets
   - Cache frequently accessed properties

4. **Performance:**
   - Use `includeOwner=true` only when necessary
   - Implement client-side caching
   - Lazy load images

---

## Testing

Use the provided `property.test.http` file with REST Client extension in VS Code for easy API testing.
