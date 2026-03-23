# FinEra Backend - Setup Scripts

Windows-compatible scripts for PostgreSQL setup and secure configuration.

## Quick Start (Docker)

```powershell
# 1. Start PostgreSQL + Redis
.\scripts\setup-postgres-windows.ps1 -UseDocker

# 2. Apply schema
npx prisma db push

# 3. Seed data
npm run db:seed

# 4. Start backend
npm run dev
```

## Native PostgreSQL (Windows)

### 1. Install PostgreSQL 15

**Option A - Chocolatey:**
```powershell
choco install postgresql15 --params '/Password:YourSecurePassword12!'
```

**Option B - Official installer:**
- Download from https://www.postgresql.org/download/windows/
- Run installer, set password for `postgres` user
- Add `C:\Program Files\PostgreSQL\15\bin` to PATH

### 2. Create Database

```powershell
# Connect and create
psql -U postgres -c "CREATE DATABASE finera_db;"

# Or run full setup
psql -U postgres -f scripts\create-finera-db.sql
```

### 3. Secure .env

```powershell
# Interactive (generates secure JWT secrets)
.\scripts\secure-env-setup.ps1

# Or with password
.\scripts\secure-env-setup.ps1 -DbPassword "YourPassword"
```

### 4. Apply Schema & Start

```powershell
npx prisma db push
npm run db:seed
npm run dev
```

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `setup-postgres-windows.ps1` | Start Docker PostgreSQL or show install options |
| `create-finera-db.sql` | Create finera_db with extensions |
| `fintech-hardening.sql` | Apply security timeouts (run after migrations) |
| `secure-env-setup.ps1` | Generate secure .env with strong JWT secrets |
| `verify-stack.ps1` | Verify PostgreSQL, .env, and backend |

## Verification

```powershell
# Check status
.\scripts\setup-postgres-windows.ps1 -CheckOnly

# Full verification
.\scripts\verify-stack.ps1

# Quick (skip backend check)
.\scripts\verify-stack.ps1 -Quick
```

## Troubleshooting

**Authentication failed:**
- Ensure PostgreSQL is running
- Verify password in DATABASE_URL matches postgres user
- For Docker: use `finera:finera_secure`

**Port 5432 in use:**
- Another PostgreSQL instance may be running
- Check: `Get-NetTCPConnection -LocalPort 5432`

**psql not found:**
- Add PostgreSQL bin to PATH
- Or use full path: `& "C:\Program Files\PostgreSQL\15\bin\psql.exe"`
