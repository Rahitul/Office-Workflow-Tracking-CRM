@echo off
REM ============================================
REM iomdaily Server Setup & Deployment Script
REM ============================================

echo.
echo ============================================
echo   IOMDAILY - Server Setup & Deploy
echo ============================================
echo.

REM Check if MongoDB is installed as a service
sc query MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo [Step 1] MongoDB not found as service.
    echo Installing MongoDB as Windows Service...
    
    REM Check if mongod.exe exists
    where mongod >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: MongoDB is not installed on this system.
        echo Please install MongoDB from: https://www.mongodb.com/try/download/community
        echo Choose: Windows, MSI, Version 8.0+
        pause
        exit /b 1
    )
    
    REM Get MongoDB installation path
    for /f "delims=" %%i in ('where mongod') do set MONGODB_PATH=%%i
    echo Found MongoDB at: %MONGODB_PATH%
    
    REM Create data directories
    if not exist "C:\data\db" mkdir "C:\data\db"
    if not exist "C:\data\log" mkdir "C:\data\log"
    
    REM Install MongoDB as service
    "%MONGODB_PATH%" --config "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg" --install
    
    echo MongoDB service installed.
) else (
    echo [Step 1] MongoDB service already installed.
)

REM Start MongoDB service
echo [Step 2] Starting MongoDB service...
net start MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo   MongoDB: Started
) else (
    echo   MongoDB: Already running or starting...
)

REM Wait for MongoDB to be ready
timeout /t 3 /nobreak >nul

REM Set working directory
set WORKDIR=H:\iomdaily
cd /d %WORKDIR%
echo Working directory set to: %CD%

echo [Step 3] Stopping PM2 app (if running)...
pm2 stop iomdaily 2>nul
echo   Stopped

echo [Step 4] Installing dependencies...
call npm install 2>nul
echo   Done

echo [Step 5] Building Next.js application...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed!
    pause
    exit /b 1
)
echo   Build: OK

echo [6/7] Copying static files...
if exist ".next\static" (
    if not exist ".next\standalone\.next\static" mkdir ".next\standalone\.next\static" 2>nul
    robocopy ".next\static" ".next\standalone\.next\static" /E /IS /IT /NFL /NDL /NJH /NJS
    echo   Static files: OK
) else (
    echo   Static files: Skipped
)

echo [7/7] Starting PM2 app...
pm2 start ecosystem.config.js
pm2 save

echo.
echo ============================================
echo   Deployment Complete!
echo.
echo   URLs:
echo   - Local:    http://localhost:4001
echo   - Network: http://192.168.100.3:4001
echo.
echo   Credentials:
echo   - Admin: admin@iomdaily.com / admin123
echo   - User:  user@iomdaily.com / user123
echo   - ESBD:  (create via admin panel with role "esbd")
echo ============================================
echo.

REM Test the server
echo Testing server...
powershell -Command "Start-Sleep -Seconds 5; try { $r = Invoke-WebRequest -Uri 'http://localhost:4001/login' -UseBasicParsing -TimeoutSec 10; if($r.StatusCode -eq 200){Write-Host 'Server: OK'} else {Write-Host 'Server: FAILED'} } catch { Write-Host 'Server: FAILED - ' $_.Exception.Message }"

pause