@echo off
setlocal
cd /d "%~dp0"

echo === git add -A ===
git add -A
if errorlevel 1 goto :err

echo === git status ===
git status
if errorlevel 1 goto :err

echo === git commit ===
git commit -m "Dashboard: responsive layout, wallet cards, shield icon sizing" -m "DashboardV2: fluid grid gaps, rem-based radii, clamp padding and balance type" -m "Wallet/active loan: overflow-safe cards, mt-auto balance, no Cash In/Out row" -m "FinEraShieldIcon: optional dimensionClassName for responsive rem sizing" -m "Dashboard: align welcome/currency tweaks with V2 where applicable"
REM Exit code 1 means nothing to commit — still pull/push

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
echo FAILED — see messages above.
exit /b 1
