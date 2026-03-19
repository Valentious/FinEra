# FinEra Inclusive Credit - Setup Guide

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

| Check | Command |
|-------|---------|
| Backend healthy | `curl http://localhost:4000/health` |
| Database ready | `curl http://localhost:4000/ready` |
| Full stack test | `node test-connection.js` |

---

## Troubleshooting

| Issue | Solution |
|------|----------|
| `P1000: Authentication failed` | Update `DATABASE_URL` in `.env` with correct postgres password |
| Port 5432 not listening | Start PostgreSQL: `net start postgresql` (admin) or Docker |
| CORS errors | Ensure `FRONTEND_URL` in `.env` matches frontend origin (e.g. `http://localhost:5173`) |
| `JWT_SECRET` too short | Must be ≥32 characters |

---

## Ports Reference

| Service | Port |
|---------|------|
| Backend API | 4000 |
| Frontend (Vite) | 5173 |
| PostgreSQL | 5432 |
| Redis | 6379 |
