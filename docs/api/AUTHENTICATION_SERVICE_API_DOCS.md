# Authentication Service API - Technical Documentation

## Service Details
- **Base URL**: `https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/auth`
- **Local Dev URL**: `http://localhost:5000`
- **Provider**: AWS Cognito User Pool (`ap-southeast-1_XXXXX`)
- **Authentication**: JWT Bearer Tokens (ID Token / Access Token)

---

## API Endpoints

### 1. Register New User
**Registers a new customer account in AWS Cognito User Pool**

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "Password123!",
  "name": "Jane Doe"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for confirmation code.",
  "userSub": "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
}
```

---

### 2. Confirm Email Verification Code
**Confirms user registration using the emailed 6-digit confirmation code**

```http
POST /api/v1/auth/confirm
Content-Type: application/json

{
  "email": "customer@example.com",
  "code": "123456"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "User email confirmed successfully. You can now login."
}
```

---

### 3. User Login (Initiate Auth)
**Authenticates user with AWS Cognito and returns JWT Tokens**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "Password123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "tokens": {
    "idToken": "eyJraWQiOiJ...",
    "accessToken": "eyJraWQiOiJ...",
    "refreshToken": "eyJjdHkiOiJ..."
  },
  "user": {
    "email": "customer@example.com",
    "name": "Jane Doe",
    "sub": "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
  }
}
```

---

### 4. Verify Token Session
**Validates the current JWT ID / Access Token**

```http
GET /api/v1/auth/verify
Authorization: Bearer <ID_TOKEN>
```

**Response (200 OK)**:
```json
{
  "valid": true,
  "user": {
    "sub": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "email": "customer@example.com"
  }
}
```
