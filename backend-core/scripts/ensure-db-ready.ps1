# FinEra - Ensure Database Ready
# Verifies: PostgreSQL running, .env DATABASE_URL, finera_db exists

$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Join-Path $scriptDir ".."
$envPath = Join-Path $projectRoot ".env"
$examplePath = Join-Path $projectRoot ".env.example"

function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [!] $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  [X] $msg" -ForegroundColor Red }

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "  Ensure Database Ready" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

$allOk = $true

# 1. PostgreSQL running (port 5432)
Write-Step "1. PostgreSQL"
$conn = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    Write-Ok "PostgreSQL listening on port 5432"
} else {
    Write-Fail "PostgreSQL not running on port 5432"
    Write-Host "  Start with Docker: cd backend-core; docker compose up -d postgres" -ForegroundColor Gray
    Write-Host "  Or run: .\scripts\setup-postgres-windows.ps1 -UseDocker" -ForegroundColor Gray
    $allOk = $false
}

# 2. .env exists
Write-Step "2. .env file"
if (-not (Test-Path $envPath)) {
    if (Test-Path $examplePath) {
        Copy-Item $examplePath $envPath
        Write-Ok "Created .env from .env.example - review and set your postgres password"
    } else {
        Write-Fail ".env not found and no .env.example to copy"
        $allOk = $false
    }
} else {
    Write-Ok ".env exists"
}

# 3. DATABASE_URL configured
if (Test-Path $envPath) {
    $content = Get-Content $envPath -Raw
    if ($content -match 'DATABASE_URL.*postgresql://') {
        if ($content -match 'finera_db') {
            Write-Ok "DATABASE_URL configured (postgresql://.../finera_db)"
        } else {
            Write-Warn "DATABASE_URL set but database may not be finera_db"
        }
    } else {
        Write-Fail "DATABASE_URL missing or invalid in .env"
        Write-Host "  Expected: DATABASE_URL=`"postgresql://postgres:YOUR_PASSWORD@localhost:5432/finera_db`"" -ForegroundColor Gray
        $allOk = $false
    }
}

# 4. Test connection (Prisma)
Write-Step "3. Connection test"
Push-Location $projectRoot
try {
    $null = & npx prisma migrate status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Database connection successful"
    } else {
        Write-Fail "Could not connect to database"
        Write-Host "  Check: DATABASE_URL password matches your PostgreSQL postgres user" -ForegroundColor Gray
        Write-Host "  Create DB: psql -U postgres -c `"CREATE DATABASE finera_db;`"" -ForegroundColor Gray
        $allOk = $false
    }
} catch {
    Write-Fail "Connection test failed"
    $allOk = $false
} finally {
    Pop-Location
}

Write-Host ""
if ($allOk) {
    Write-Host "All checks passed. You can run:" -ForegroundColor Green
    Write-Host "  npx prisma migrate dev" -ForegroundColor Gray
    Write-Host "  npm run db:seed" -ForegroundColor Gray
    Write-Host "  npm run db:truncate   (to clear data)" -ForegroundColor Gray
} else {
    Write-Host "Fix the issues above, then re-run this script" -ForegroundColor Yellow
}
Write-Host ""
