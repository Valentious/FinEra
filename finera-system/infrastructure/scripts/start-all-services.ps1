# FinEra - Start all backend services in dependency order (PowerShell)
# Run from project root: .\finera-system\infrastructure\scripts\start-all-services.ps1
# Or from finera-system: .\infrastructure\scripts\start-all-services.ps1

$root = if (Test-Path "backend") { Get-Location } else { Join-Path (Get-Location) "finera-system" }
if (-not (Test-Path "$root\backend")) {
    Write-Error "Run from project root or finera-system folder"
    exit 1
}

# Order: downstream services first, then auth (orchestrator), then gateway
# Gateway uses port 5000 to avoid conflict with main backend-core (4000)
$services = @(
    @{ Name = "user-service"; Port = 4002 },
    @{ Name = "ledger-service"; Port = 4004 },
    @{ Name = "credit-engine"; Port = 4003 },
    @{ Name = "admin-service"; Port = 4006 },
    @{ Name = "notification-service"; Port = 4005 },
    @{ Name = "auth-service"; Port = 4001 },
    @{ Name = "api-gateway"; Port = 5000 }
)

Write-Host "FinEra System - Starting services from $root" -ForegroundColor Cyan
Write-Host ""

foreach ($svc in $services) {
    Write-Host "Starting $($svc.Name) on port $($svc.Port)..." -ForegroundColor Green
    $cmd = "cd `"$root\backend\$($svc.Name)`"; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "All services started." -ForegroundColor Cyan
Write-Host "  API Gateway:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "  Auth:        http://localhost:4001" -ForegroundColor Yellow
Write-Host "  User:        http://localhost:4002" -ForegroundColor Yellow
Write-Host "  Credit:      http://localhost:4003" -ForegroundColor Yellow
Write-Host "  Ledger:      http://localhost:4004" -ForegroundColor Yellow
Write-Host "  Admin:       http://localhost:4006" -ForegroundColor Yellow
Write-Host ""
Write-Host "Test: curl http://localhost:5000/health" -ForegroundColor Gray
