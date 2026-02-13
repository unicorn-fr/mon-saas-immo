# 🔐 Authentication API Documentation

Base URL: `http://localhost:5000/api/v1`

## Authentication Endpoints

### 1. Register New User

**POST** `/auth/register`

Create a new user account (Owner or Tenant).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "TENANT",  // or "OWNER"
  "phone": "+33612345678"  // Optional
}
```

**Password Requirements:**
- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "TENANT",
      "avatar": null,
      "emailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses:**
- **400** - Validation error (missing fields, weak password)
- **409** - User already exists

---

### 2. Login

**POST** `/auth/login`

Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "TENANT",
      "avatar": null,
      "emailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses:**
- **400** - Missing email or password
- **401** - Invalid credentials

---

### 3. Refresh Token

**POST** `/auth/refresh`

Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses:**
- **400** - Missing refresh token
- **401** - Invalid or expired refresh token

---

### 4. Logout

**POST** `/auth/logout`

Invalidate refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 5. Get Current User Profile

**GET** `/auth/me`

Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "TENANT",
      "avatar": null,
      "phone": "+33612345678",
      "bio": null,
      "emailVerified": false,
      "phoneVerified": false,
      "createdAt": "2026-02-10T12:00:00Z",
      "updatedAt": "2026-02-10T12:00:00Z"
    }
  }
}
```

**Error Responses:**
- **401** - Unauthorized (missing or invalid token)

---

### 6. Change Password

**POST** `/auth/change-password`

Change password for authenticated user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- **400** - Validation error
- **401** - Current password incorrect

**Note:** After password change, all refresh tokens are invalidated (user is logged out from all devices).

---

### 7. Logout from All Devices

**POST** `/auth/logout-all`

Invalidate all refresh tokens for the user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

---

### 8. Forgot Password

**POST** `/auth/forgot-password`

Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent"
}
```

**Note:** Response is always 200 to prevent email enumeration.

---

### 9. Verify Email

**POST** `/auth/verify-email`

Verify user's email address.

**Request Body:**
```json
{
  "token": "verification-token"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Note:** Email verification system to be fully implemented with token generation.

---

## Token Management

### Access Token
- **Lifetime:** 15 minutes
- **Purpose:** API authentication
- **Storage:** Memory or secure HTTP-only cookie
- **Header:** `Authorization: Bearer <token>`

### Refresh Token
- **Lifetime:** 7 days
- **Purpose:** Obtain new access tokens
- **Storage:** Secure HTTP-only cookie (recommended) or secure storage
- **Rotation:** New refresh token issued on each refresh

---

## Error Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Additional error details"]  // Optional
}
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User",
    "role": "TENANT"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Security Best Practices

1. **Never expose secrets** in client-side code
2. **Store refresh tokens securely** (HTTP-only cookies preferred)
3. **Validate all inputs** on both client and server
4. **Use HTTPS** in production
5. **Implement rate limiting** (already configured)
6. **Monitor failed login attempts**
7. **Regular token rotation**
8. **Short access token lifetime**
