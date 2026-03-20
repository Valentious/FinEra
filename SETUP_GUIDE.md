# FinEra Inclusive Credit - Setup Guide

> **FinEra uses port 4000** (not 5000). All API URLs use `http://localhost:4000`.

## Quick Start Checklist

### Step 1: Environment Configuration ✅

- **Backend** `.env` created at `backend-core/.env`
- **Frontend** `.env` created at project root (Vite uses `VITE_API_URL`)

**If you need different database credentials**, edit `backend-core/.env`:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/finera_db"
```

### Step 2: PostgreSQL

**Option A - Docker (recommended):**

```powershell
cd backend-core
docker compose up -d postgres
```

Uses `postgres:postgres` credentials. Wait ~5 seconds, then continue.

**Option B - Native PostgreSQL:**

1. Ensure PostgreSQL is running (port 5432)
2. Create database: `psql -U postgres -c "CREATE DATABASE finera_db;"`
3. Update `backend-core/.env` with your actual `postgres` password

**Check status:** `.\backend-core\scripts\setup-postgres-windows.ps1 -CheckOnly`

### Step 3: Database Setup

```powershell
cd backend-core
npx prisma generate
npx prisma db push
npm run db:seed
```

### Step 4: Start Backend

```powershell
cd backend-core
npm run dev
```

Expected: `Server running on http://localhost:4000`

### Step 5: Start Frontend

In a **new terminal**:

```powershell
cd "c:\Users\shiel\Downloads\FinEra Inclusive Credit"
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** (Vite default).

### Step 6: Test Connection

```powershell
node test-connection.js
```

### VS Code Debugging

Use **Run > Start Debugging** and select **"Launch Backend"** from the dropdown.  
Configuration loads `.env` from `backend-core/`.

---

## Success Criteria

| Check | Command / URL |
|-------|---------------|
| Backend healthy | Open: http://localhost:4000/health |
| Registration data | Open: http://localhost:4000/api/v1/reference/registration-data |
| Database ready | Open: http://localhost:4000/ready |
| Full stack test | `node test-connection.js` |

**Verify backend is alive:** Open http://localhost:4000/api/v1/reference/registration-data in your browser. You should see JSON with `countries`, `cities`, `institutions`. If it fails, the backend is not running.

---

## Troubleshooting

| Issue | Solution |
|------|----------|
| `ERR_CONNECTION_REFUSED` | Backend not running → `cd backend-core && npm run dev` |
| `P1000: Authentication failed` | Update `DATABASE_URL` in `.env` with correct postgres password |
| Port 5432 not listening | Start PostgreSQL: `net start postgresql` (admin) or Docker |
| CORS / "Failed to fetch" | Ensure `VITE_API_URL=http://localhost:4000/api/v1` in frontend `.env` |
| CORS (backend) | Backend allows 5173, 5174, 5175, 3000. Check `backend-core/.env` FRONTEND_URL |
| `JWT_SECRET` too short | Must be ≥32 characters |
| 404 on /api/register | FinEra uses `/api/v1/auth/register` (not `/api/register`) |

---

## Ports Reference

| Service | Port |
|---------|------|
| Backend API | 4000 |
| Frontend (Vite) | 5173 |
| PostgreSQL | 5432 |
| Redis | 6379 |
