# Fintech Identity vs Credential Architecture

**Golden Thread**: Identity (Who you are) and Credentials (How you prove it) must be decoupled at the logic layer.

## Schema Rules

| Field           | Role                       | Constraint      |
|----------------|----------------------------|-----------------|
| `user_id` (id) | PRIMARY KEY – identity anchor | Only one per user |
| `email`        | Secondary key – lookup     | UNIQUE          |
| `phone`        | Secondary key – lookup     | UNIQUE (optional) |
| `password_hash`| Belongs to USER (user_id)  | Required, never to email |

- **created_at** / **updated_at** – required for auditability
- **status** enum: `active` | `suspended` | `pending_verification`
- **lockedUntil** / **loginAttempts** – for brute-force protection

## 2-Step Authentication Flow

```
1. IDENTIFY   → SELECT * FROM users WHERE email = normalized_email
               If null: 404 "User not found"

2. AUTHENTICATE → bcrypt.compare(inputPassword, user.password_hash)
               If mismatch: 401 "Invalid credentials"

3. AUTHORIZE  → JWT/Session using user_id (sub) – only after Step 2 succeeds
```

## Pre-Validation (before bcrypt)

Before running CPU-heavy bcrypt:

- Is `status !== ACTIVE`? → 403 "Account is not active"
- Is `lockedUntil > now`? → 423 "Account temporarily locked"

## Security

- **Normalization**: All emails `.toLowerCase().trim()` before DB operations
- **Hashing**: bcrypt cost factor 12 (or argon2)
- **Errors**: `{ success: false, error: { code: string, message: string } }`
- Never query `email AND password` together

## Layering

- **UserRepository**: Pure DB queries (no password comparison)
- **AuthService**: Business logic and hashing
- **AuthController**: Request/response only

## Why This Matters

1. **Primary vs secondary keys**: `user_id` stays stable; email/phone can change without breaking identity.
2. **Audit clarity**: 404 vs 401 differentiates email probing from password attempts.
3. **Pre-validation**: Check status and lockout before expensive bcrypt.
