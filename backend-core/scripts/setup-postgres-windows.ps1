# FinEra - PostgreSQL Setup for Windows
# Run as Administrator for full install, or use Docker alternative

param(
    [switch]$UseDocker,
    [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [!] $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  [X] $msg" -ForegroundColor Red }

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "  FinEra PostgreSQL Setup (Windows)" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

if ($CheckOnly) {
    Write-Step "Checking PostgreSQL status..."
    
    # Check if psql exists
    $psql = Get-Command psql -ErrorAction SilentlyContinue
    if ($psql) {
        Write-Ok "psql found: $($psql.Source)"
        & psql --version
    } else {
        Write-Warn "psql not in PATH"
    }
    
    # Check port 5432
    $port = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
    if ($port) {
        Write-Ok "Port 5432 in use (PostgreSQL likely running)"
    } else {
        Write-Warn "Port 5432 not in use"
    }
    
    # Check Docker
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
        Write-Ok "Docker available - use -UseDocker for containerized setup"
    } else {
        Write-Warn "Docker not found"
    }
    exit 0
}

if ($UseDocker) {
    Write-Step "Starting PostgreSQL via Docker..."
    
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $docker) {
        Write-Fail "Docker not found. Install Docker Desktop from https://docker.com"
        exit 1
    }
    
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptDir
    
    Push-Location $projectRoot
    try {
        docker compose up -d postgres
        Start-Sleep -Seconds 5
        Write-Ok "PostgreSQL container started (postgres:postgres@localhost:5432/finera_db)"
    } finally {
        Pop-Location
    }
    exit 0
}

# Native Windows installation instructions
Write-Step "Native PostgreSQL Installation Options"
Write-Host @"

  Option A - Chocolatey (recommended):
    choco install postgresql15 --params '/Password:YourSecurePassword12!'

  Option B - Official installer:
    Download: https://www.postgresql.org/download/windows/
    Run installer, set password for 'postgres' user

  Option C - Docker (easiest):
    .\setup-postgres-windows.ps1 -UseDocker

  After installation:
    1. Ensure PostgreSQL service is running
    2. Create database: psql -U postgres -c "CREATE DATABASE finera_db;"
    3. Run: .\scripts\create-finera-db.sql (or use Prisma)
    4. Update .env with your DATABASE_URL

  Check status: .\setup-postgres-windows.ps1 -CheckOnly

"@ -ForegroundColor White
