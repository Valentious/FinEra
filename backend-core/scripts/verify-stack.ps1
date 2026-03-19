# FinEra - Stack Verification Script
# Checks PostgreSQL, backend, and configuration

param(
    [switch]$Quick,
    [int]$BackendPort = 4000
)

$ErrorActionPreference = "Continue"

function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [!] $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  [X] $msg" -ForegroundColor Red }

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "  FinEra Stack Verification" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

$allOk = $true

# 1. PostgreSQL
Write-Step "PostgreSQL"
try {
    $psql = Get-Command psql -ErrorAction Stop
    Write-Ok "psql found"
    
    $env:PGPASSWORD = $env:PGPASSWORD
    $result = & psql -h localhost -U postgres -d finera_db -t -c "SELECT 1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Database connection successful"
    } else {
        Write-Fail "Cannot connect to finera_db"
        Write-Host "  Run: psql -U postgres -c `"CREATE DATABASE finera_db;`""
        $allOk = $false
    }
} catch {
    Write-Fail "psql not found or PostgreSQL not running"
    Write-Host "  Install PostgreSQL or use: .\setup-postgres-windows.ps1 -UseDocker"
    $allOk = $false
}

# 2. Port 5432
Write-Step "Port 5432"
$conn = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    Write-Ok "PostgreSQL listening on 5432"
} else {
    Write-Warn "Port 5432 not listening - PostgreSQL may not be running"
}

# 3. .env
Write-Step "Configuration"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$envPath = Join-Path $projectRoot ".env"

if (Test-Path $envPath) {
    Write-Ok ".env exists"
    $content = Get-Content $envPath -Raw
    if ($content -match 'DATABASE_URL="postgresql://') {
        Write-Ok "DATABASE_URL configured"
    } else {
        Write-Warn "DATABASE_URL may be missing or invalid"
    }
    if ($content -match 'JWT_SECRET=.{32,}') {
        Write-Ok "JWT_SECRET configured"
    } else {
        Write-Warn "JWT_SECRET should be at least 32 characters"
    }
} else {
    Write-Fail ".env not found"
    Write-Host "  Run: .\scripts\secure-env-setup.ps1"
    $allOk = $false
}

# 4. Prisma schema
if (Test-Path (Join-Path $projectRoot "prisma\schema.prisma")) {
    Write-Ok "Prisma schema present"
}

# 5. Backend (if not quick)
if (-not $Quick) {
    Write-Step "Backend API"
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$BackendPort/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Ok "Backend healthy (port $BackendPort)"
        } else {
            Write-Warn "Backend returned HTTP $($response.StatusCode)"
        }
    } catch {
        Write-Warn "Backend not responding on port $BackendPort"
        Write-Host "  Start with: npm run dev"
    }
}

Write-Host ""
if ($allOk) {
    Write-Host "Verification complete. Run 'npx prisma db push' then 'npm run db:seed' and 'npm run dev'" -ForegroundColor Green
} else {
    Write-Host "Some checks failed. Fix issues above before starting." -ForegroundColor Yellow
}
Write-Host ""
