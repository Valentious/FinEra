# One-shot: stage, commit, rebase on main, push to origin.
# Run from repo root:  powershell -ExecutionPolicy Bypass -File .\scripts\push-dashboard-updates.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$log = Join-Path (Get-Location) "git-push-last-run.txt"
function Log($m) { $m | Tee-Object -FilePath $log -Append }

"" | Out-File -FilePath $log -Encoding utf8
Log "=== $(Get-Date -Format o) ==="
Log (Get-Location).Path

git add -A
Log (git status --short 2>&1 | Out-String)

$commitMsg = @"
Dashboard: responsive layout, wallet cards, shield icon sizing

- DashboardV2: fluid grid gaps, rem-based radii, clamp padding and balance type
- Wallet/active loan: overflow-safe cards, mt-auto balance, no Cash In/Out row
- FinEraShieldIcon: optional dimensionClassName for responsive rem sizing
- Dashboard: align welcome/currency tweaks with V2 where applicable
"@

git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Log "Nothing staged to commit (working tree clean or no changes)."
} else {
  git commit -m $commitMsg
  Log (git log -1 --oneline 2>&1 | Out-String)
}

git pull --rebase origin main
Log "pull --rebase exit: $LASTEXITCODE"

git push origin main
Log "push exit: $LASTEXITCODE"
Log "Done. See git-push-last-run.txt in repo root."
