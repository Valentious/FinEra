# FinEra - Switch to Docker PostgreSQL
# Run as Administrator: Right-click -> Run with PowerShell (as Admin)

param(
    [switch]$SkipStop  # Use if service already stopped
)

$ErrorActionPreference = "Stop"
$BackendDir = "$PSScriptRoot\.."

# Step 1: Stop Windows PostgreSQL to free port 5432
if (-not $SkipStop) {
    Write-Host "Stopping Windows PostgreSQL service..." -ForegroundColor Yellow
    try {
        Stop-Service -Name "postgresql-x64-18" -Force -ErrorAction Stop
        Write-Host "Stopped." -ForegroundColor Green
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "Failed to stop (may need Administrator): $_" -ForegroundColor Red
        Write-Host "Run this script as Administrator." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Skipping service stop (SkipStop flag)." -ForegroundColor Cyan
}

# Step 2: Ensure Docker PostgreSQL is running
Write-Host "`nChecking Docker stack..." -ForegroundColor Yellow
Set-Location $BackendDir
$ErrorActionPreference = "Continue"
docker compose up -d 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

# Step 3: Apply schema
Write-Host "`nApplying Prisma schema (db push)..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) { exit 1 }

# Step 4: Seed database
Write-Host "`nSeeding database..." -ForegroundColor Yellow
npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`nDone. Restart your backend: npm run dev" -ForegroundColor Green
