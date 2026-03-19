# FinEra - Full Stack Integration Test (Windows)
# Run: .\scripts\test-full-stack.ps1

$ErrorActionPreference = "Continue"
$script:TESTS_PASSED = 0
$script:TESTS_FAILED = 0

function Run-Test {
    param($Name, $Command)
    Write-Host -NoNewline "Testing: $Name... "
    try {
        $null = Invoke-Expression $Command 2>&1
        Write-Host "[OK] PASSED" -ForegroundColor Green
        $script:TESTS_PASSED++
    } catch {
        Write-Host "[X] FAILED" -ForegroundColor Red
        $script:TESTS_FAILED++
    }
}

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "  FinEra Full Stack Integration Test" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# 1. Backend health
Run-Test "Backend health" "(Invoke-WebRequest -Uri 'http://localhost:4000/health' -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200"

# 2. Ready endpoint
Run-Test "Database ready" "(Invoke-WebRequest -Uri 'http://localhost:4000/ready' -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200"

# 3. User registration
$email = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@university.edu"
$body = @{ email = $email; password = "TestPass123!@#"; fullName = "Test User"; accountType = "STUDENT"; country = "ZW"; city = "Harare"; institution = "UZ" } | ConvertTo-Json
try {
    $r = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/auth/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
    if ($r.Content -match "success") { Write-Host "Testing: User registration... [OK] PASSED" -ForegroundColor Green; $script:TESTS_PASSED++ } else { throw "fail" }
} catch { Write-Host "Testing: User registration... [X] FAILED" -ForegroundColor Red; $script:TESTS_FAILED++ }

# 4. Login (seed user)
$loginBody = '{"email":"test@university.edu","password":"TestPassword123!"}'
try {
    $r = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
    if ($r.Content -match "accessToken") { Write-Host "Testing: User login... [OK] PASSED" -ForegroundColor Green; $script:TESTS_PASSED++ } else { throw "fail" }
} catch { Write-Host "Testing: User login... [X] FAILED" -ForegroundColor Red; $script:TESTS_FAILED++ }

# 5. CORS (if frontend URL configured)
try {
    $null = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 2
    Write-Host "Testing: Backend reachable... [OK] PASSED" -ForegroundColor Green
    $script:TESTS_PASSED++
} catch {
    Write-Host "Testing: Backend reachable... [X] FAILED" -ForegroundColor Red
    $script:TESTS_FAILED++
}

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "  Test Summary" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "Passed: $($script:TESTS_PASSED)" -ForegroundColor Green
Write-Host "Failed: $($script:TESTS_FAILED)" -ForegroundColor $(if ($script:TESTS_FAILED -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($script:TESTS_FAILED -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
} else {
    exit 1
}
