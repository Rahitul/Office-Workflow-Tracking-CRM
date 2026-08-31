@echo off
REM ============================================
REM iomdaily Remote Deployment Script
REM Run this on YOUR PC to deploy to the server
REM ============================================

set SERVERIP=192.168.100.3

echo.
echo ============================================
echo   IOMDAILY - Remote Deployment
echo ============================================
echo.
echo   Server: %SERVERIP%:4001
echo.

REM Connect to server
echo [Step 0] Connecting to server...
net use \\%SERVERIP%\c$ /user:Administrator Open123 >nul 2>&1
echo   Connected: OK

REM Step 1: Build locally
echo.
echo [Step 1] Building Next.js application locally...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed!
    pause
    exit /b 1
)
echo   Build: OK

REM Step 2: Copy essential files
echo.
echo [Step 2] Copying files to server...
copy /Y "package.json" "\\%SERVERIP%\c$\iomdaily\" >nul
copy /Y "package-lock.json" "\\%SERVERIP%\c$\iomdaily\" >nul
copy /Y "ecosystem.config.js" "\\%SERVERIP%\c$\iomdaily\" >nul
echo   Config files: OK

if exist ".env" (
    copy /Y ".env" "\\%SERVERIP%\c$\iomdaily\" >nul
    echo   .env copied: OK
)

REM Step 3: Copy standalone build
echo.
echo [Step 3] Copying build files...
robocopy ".next\standalone" "\\%SERVERIP%\c$\iomdaily\.next\standalone" /E /IS /IT /NFL /NDL /NJH /NJS >nul
echo   Build files: OK

if exist ".next\static" (
    if not exist ".next\standalone\.next\static" mkdir ".next\standalone\.next\static" 2>nul
    robocopy ".next\static" "\\%SERVERIP%\c$\iomdaily\.next\standalone\.next\static" /E /IS /IT /NFL /NDL /NJH /NJS >nul
    echo   Static files: OK
)

REM Step 4: Test server
echo.
echo [Step 4] Testing server...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://%SERVERIP%:4001/login' -UseBasicParsing -TimeoutSec 5; if($r.StatusCode -eq 200){Write-Host '  Server: OK (already running)'} } catch { Write-Host '  Server not running' }"

echo.
echo ============================================
echo   Deployment Complete!
echo ============================================
echo.
echo   Files copied to: C:\iomdaily
echo   Server URL: http://%SERVERIP%:4001
echo.
echo   IMPORTANT: Restart PM2 on server to apply changes:
echo     pm2 restart iomdaily
echo ============================================
echo.

pause