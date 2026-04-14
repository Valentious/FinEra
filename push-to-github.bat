@echo off
setlocal
cd /d "%~dp0"

git config --get user.email >nul 2>&1
if errorlevel 1 goto :noidentity
git config --get user.name >nul 2>&1
if errorlevel 1 goto :noidentity
goto :haveidentity

:noidentity
echo ERROR: Git user.name and user.email are not set.
echo Run once, then re-run this script:
echo   git config --global user.name "Your Name"
echo   git config --global user.email "you@example.com"
exit /b 1

:haveidentity
echo === git add -A ===
git add -A
if errorlevel 1 goto :err

echo === git status ===
git status
if errorlevel 1 goto :err

echo === git commit ===
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Dashboard: responsive layout, wallet cards, shield icon sizing" -m "DashboardV2: fluid grid gaps, rem-based radii, clamp padding and balance type" -m "Wallet/active loan: overflow-safe cards, mt-auto balance, no Cash In/Out row" -m "FinEraShieldIcon: optional dimensionClassName for responsive rem sizing" -m "Dashboard: align welcome/currency tweaks with V2 where applicable"
  if errorlevel 1 goto :err
) else (
  echo Nothing staged - skipping commit.
)

echo === git pull --rebase origin main ===
git pull --rebase origin main
if errorlevel 1 goto :err

echo === git push origin main ===
git push origin main
if errorlevel 1 goto :err

echo === done ===
git log -1 --oneline
goto :eof

:err
echo FAILED - see messages above.
exit /b 1
