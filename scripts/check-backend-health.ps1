# FinEra - Startup health check for backend
# Waits for backend /health to respond before continuing
param(
    [string]$Url = "http://localhost:4000/health",
    [int]$MaxAttempts = 30,
    [int]$DelaySeconds = 2
)

$attempt = 0
while ($attempt -lt $MaxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "Backend is ready at $Url"
            exit 0
        }
    } catch {
        $attempt++
        Write-Host "Attempt $attempt/$MaxAttempts - Backend not ready: $($_.Exception.Message)"
        if ($attempt -ge $MaxAttempts) {
            Write-Host "Backend failed to become ready after $MaxAttempts attempts"
            exit 1
        }
        Start-Sleep -Seconds $DelaySeconds
    }
}
exit 1
