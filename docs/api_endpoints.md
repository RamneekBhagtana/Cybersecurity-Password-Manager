# SecureVault API Documentation

# Overview
This document defines the REST API endpoints for the SecureVault password manager backend.  
These endpoints allow the frontend applications to interact with the backend service for vault management, password generation, password strength analysis, and security reports.

The backend will be implemented using Flask and PostgreSQL.
Authentication is handled through Supabase JWT tokens.

# Notes

- All secure endpoints require Supabase JWT authentication.
- Vault credentials should be encrypted before storage.
- Backend implementation will use Flask and PostgreSQL.
  
--------------------
# Authentication

Authentication is handled through Supabase. When a user logs in through Supabase, the client receives a **JWT access token**.

All protected API endpoints require this token.

Example header:

Authorization: Bearer <JWT_TOKEN>

Endpoints such as vault management, reports, and password generators require authentication.

----------------------

# Error Response Format

All API endpoints will return errors in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

Common error codes:

| Code | Meaning |
|-----|------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

--------------------------

# Authentication Endpoint

### GET /auth/me

Returns information about the currently authenticated user.

Authentication: Required (Supabase JWT)

Response:

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "email_verified": true,
  "created_at": "2026-03-15T12:00:00Z"
}
```

Status Codes:

200 OK  
401 Unauthorized

-------------------------

# Vault Endpoints

These endpoints manage password entries stored in the user’s vault.

---

### GET /vault

Returns all vault entries belonging to the authenticated user.

Authentication: Required

Response:

```json
{
  "entries": [
    {
      "id": 1,
      "site_name": "github.com",
      "username": "user123",
      "tags": ["work"],
      "created_at": "2026-03-15T12:00:00Z",
      "updated_at": "2026-03-15T12:00:00Z"
    }
  ]
}
```

Status Codes:

200 OK  
401 Unauthorized

--------------------------

### POST /vault

Creates a new password entry.

Authentication: Required

Request Body:

```json
{
  "site_name": "github.com",
  "username": "user123",
  "password_ciphertext": "encrypted_password_here",
  "notes": "optional notes",
  "tags": ["work"]
}
```

Response:

```json
{
  "id": 21,
  "site_name": "github.com",
  "username": "user123",
  "created_at": "2026-03-15T12:00:00Z"
}
```

Status Codes:

201 Created  
400 Bad Request  
401 Unauthorized

---------------------

### GET /vault/{id}

Returns a specific vault entry.

Authentication: Required

Response:

```json
{
  "id": 21,
  "site_name": "github.com",
  "username": "user123",
  "password_ciphertext": "encrypted_password_here",
  "tags": ["work"],
  "notes": "optional notes",
  "created_at": "2026-03-15T12:00:00Z"
}
```

Status Codes:

200 OK  
401 Unauthorized  
404 Not Found

----------------------------

### PUT /vault/{id}

Updates an existing vault entry.

Authentication: Required

Request Body:

```json
{
  "site_name": "github.com",
  "username": "new_username",
  "password_ciphertext": "updated_encrypted_password",
  "tags": ["work"],
  "notes": "updated notes"
}
```

Response:

```json
{
  "updated": true
}
```

Status Codes:

200 OK  
400 Bad Request  
401 Unauthorized  
404 Not Found

-------------------------

### DELETE /vault/{id}

Deletes a vault entry.

Authentication: Required

Response:

```json
{
  "deleted": true
}
```

Status Codes:

200 OK  
401 Unauthorized  
404 Not Found

----------------------

# Password Generator Endpoints

These endpoints generate secure passwords and passphrases.

---

### POST /generator/password

Generates a random password based on user preferences.

Authentication: Optional

Request Body:

```json
{
  "length": 16,
  "include_uppercase": true,
  "include_lowercase": true,
  "include_numbers": true,
  "include_symbols": true
}
```

Response:

```json
{
  "password": "X8@pL9!Q2$M",
  "strength": "Strong"
}
```

Status Codes:

200 OK  
400 Bad Request

--------------------------

### POST /generator/passphrase

Generates a random passphrase.

Request Body:

```json
{
  "words": 4,
  "separator": "-",
  "capitalize": false
}
```

Response:

```json
{
  "passphrase": "green-planet-dance-sun"
}
```

Status Codes:

200 OK  
400 Bad Request

------------------------

# Password Strength Endpoint

### POST /password/strength

Checks the strength of a password.

Request Body:

```json
{
  "password": "Example123!"
}
```

Response:

```json
{
  "score": 4,
  "strength": "Strong",
  "suggestions": []
}
```

Status Codes:

200 OK  
400 Bad Request

-------------------

# Security Reports Endpoints

These endpoints provide security analysis of stored passwords.

---

### GET /reports/weak-passwords

Returns vault entries that contain weak passwords.

Authentication: Required

Response:

```json
{
  "weak_passwords": [
    {
      "id": 4,
      "site_name": "example.com",
      "reason": "Weak password detected"
    }
  ]
}
```

Status Codes:

200 OK  
401 Unauthorized

------------------------

### GET /reports/reused-passwords

Returns passwords that are reused across multiple sites.

Authentication: Required

Response:

```json
{
  "reused_password_groups": [
    {
      "entries": [
        { "id": 1, "site_name": "siteA.com" },
        { "id": 2, "site_name": "siteB.com" }
      ]
    }
  ]
}
```

Status Codes:

200 OK  
401 Unauthorized

-----------------------------

# Tags Endpoints

Tags help organize vault entries.

---

### GET /tags

Returns all tags belonging to the user.

Authentication: Required

Response:

```json
{
  "tags": [
    {
      "id": 1,
      "name": "work"
    }
  ]
}
```

-------------------------------

### POST /tags

Creates a new tag.

Request Body:

```json
{
  "name": "shopping"
}
```

Response:

```json
{
  "id": 7,
  "name": "shopping"
}
```

-----------------------------

### DELETE /tags/{id}

Deletes a tag.

Response:

```json
{
  "deleted": true
}
```

---

# Health Endpoint

### GET /health

Checks if the backend server is running.

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-03-15T12:00:00Z"
}
```

Status Codes:

200 OK

---------------------------
