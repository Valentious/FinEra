# FinEra RBAC - Role-Based Access Control

## Roles

| Role | DB Mapping | Access |
|------|------------|--------|
| USER | STUDENT, STAFF, ALUMNI | Own profile, wallet, credit score, notifications |
| ADMIN | ADMIN | All USER + admin stats, audit logs |
| SUPER_ADMIN | SYSTEM | Full access + role management |

## Permission Matrix

- **USER:** `/api/v1/users/*`, `/api/v1/ledger/wallets/*`, `/api/v1/credit/score/*`, `/api/v1/notifications`
- **ADMIN:** All USER + `/api/v1/admin/*`
- **SUPER_ADMIN:** `*` (full access)

## Rate Limits (per 15 min)

- Anonymous: 30
- USER: 100
- ADMIN: 500
- SUPER_ADMIN: 2000

## Endpoints

| Endpoint | Auth | Roles |
|----------|------|-------|
| `GET /api/v1/auth/me/permissions` | Yes | All |
| `GET /api/v1/admin/roles` | Yes | SUPER_ADMIN only |

## Testing RBAC

```bash
# Register as USER (STUDENT) - via finera-system gateway (port 5000)
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test@123","firstName":"Test","lastName":"User","userType":"STUDENT"}' \
  | jq -r '.data.token')

# Get permissions (200 OK)
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/v1/auth/me/permissions

# Try admin roles (403 Forbidden - USER cannot access)
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/v1/admin/roles

# Login as admin (admin@finera.com / Admin@123456)
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finera.com","password":"Admin@123456"}' \
  | jq -r '.data.token')

# Admin can access admin routes (200 OK)
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:5000/api/v1/admin/stats
```

## Audit Logging

Sensitive paths (`/api/v1/admin/*`, etc.) are logged to the admin service audit endpoint.
