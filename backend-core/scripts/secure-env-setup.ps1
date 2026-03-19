# FinEra - Secure Environment Configuration
# Generates secure .env with strong credentials

param(
    [string]$DbPassword = "",
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path (Split-Path -Parent $scriptDir) ".env"

if ((Test-Path $envPath) -and -not $Force) {
    Write-Host "`.env exists. Use -Force to overwrite." -ForegroundColor Yellow
    exit 1
}

function New-SecureRandom {
    param([int]$Bytes = 32)
    $bytes = New-Object byte[] $Bytes
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    [Convert]::ToBase64String($bytes) -replace '[/+=]', '' | Select-Object -First 1
}

Write-Host "`nFinEra Secure .env Setup`n" -ForegroundColor Cyan

# Database password (default: postgres for Docker/local dev)
if ([string]::IsNullOrEmpty($DbPassword)) {
    $input = Read-Host "Enter PostgreSQL password (or press Enter for 'postgres')"
    $DbPassword = if ([string]::IsNullOrWhiteSpace($input)) { "postgres" } else { $input }
}

# Generate secrets (min 32 chars for JWT)
$JwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
$JwtRefresh = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })

# URL-encode password for connection string
$DbPasswordEncoded = [Uri]::EscapeDataString($DbPassword)

$envContent = @"
# FinEra Backend - Environment Configuration
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm")

NODE_ENV=development
PORT=4000

# Database (update password if different)
DATABASE_URL="postgresql://postgres:${DbPasswordEncoded}@localhost:5432/finera_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT (auto-generated - rotate in production)
JWT_SECRET=$JwtSecret
JWT_REFRESH_SECRET=$JwtRefresh
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_SALT_ROUNDS=12

# CORS
FRONTEND_URL=http://localhost:5175

# Rate Limits
RATE_LIMIT_AUTH=5
RATE_LIMIT_GENERAL=100
"@

Set-Content -Path $envPath -Value $envContent -NoNewline
Write-Host "Created .env at $envPath" -ForegroundColor Green
Write-Host "Ensure DATABASE_URL password matches your PostgreSQL postgres user.`n" -ForegroundColor Yellow
