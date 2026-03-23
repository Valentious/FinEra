# Fintech Identity vs Credential Architecture

**Golden Thread**: Identity (Who you are) and Credentials (How you prove it) must be decoupled at the logic and schema layer.

## Normalization: User vs UserAuth

| Table     | Role              | Fields                                      |
|----------|-------------------|---------------------------------------------|
| **User** | Identity only     | user_id, email, fullName, status, profile   |
| **UserAuth** | Credentials only | user_id (FK), password_hash, failed_login_attempts, locked_until |

- **User**: Single responsibility – identity. No password_hash.
- **UserAuth**: 1:1 with User. password_hash depends on user_id, not email. Proper 3NF.
- **email** = UNIQUE secondary key (lookup)
- **created_at** / **updated_at** – required for auditability
- **status** enum: `active` | `suspended` | `pending_verification`

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
4. **3NF**: UserAuth separates credentials; supports MFA, password reset, session tokens.

## Migration (Existing Databases)

If you have existing `User` rows with `password_hash`:

1. Create `UserAuth` table.
2. Migrate: `INSERT INTO user_auth (user_id, password_hash, ...) SELECT id, password_hash, ... FROM users`.
3. Drop `password_hash`, `login_attempts`, `locked_until`, etc. from `users`.
4. Run `npx prisma migrate dev` or apply schema manually.
