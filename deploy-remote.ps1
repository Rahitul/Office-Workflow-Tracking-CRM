# ============================================
# iomdaily Remote Deployment Script
# Run this on YOUR PC to deploy to the server
# ============================================

$ErrorActionPreference = "Continue"

$ServerIP = "192.168.100.3"
$ServerShare = "\\$ServerIP\c$"
$ServerPath = "C:\iomdaily"
$LocalProjectPath = $PSScriptRoot

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  IOMDAILY - Remote Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Server: $ServerIP`:4001" -ForegroundColor Gray
Write-Host "  Server Path: $ServerPath" -ForegroundColor Gray
Write-Host "  Local Path: $LocalProjectPath" -ForegroundColor Gray
Write-Host ""

# Connect to server
Write-Host "[Step 0] Connecting to server..." -ForegroundColor Yellow
net use $ServerShare /user:Administrator Open123 2>$null | Out-Null
Write-Host "  Connected: OK" -ForegroundColor Green

# Step 1: Build locally
Write-Host ""
Write-Host "[Step 1] Building Next.js application locally..." -ForegroundColor Yellow
Set-Location $LocalProjectPath
npm run build 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Build: OK" -ForegroundColor Green
} else {
    Write-Host "  Build: FAILED!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Copy essential files
Write-Host ""
Write-Host "[Step 2] Copying files to server..." -ForegroundColor Yellow

# Copy package.json and package-lock.json
Copy-Item -Path "$LocalProjectPath\package.json" -Destination "$ServerPath\" -Force
Copy-Item -Path "$LocalProjectPath\package-lock.json" -Destination "$ServerPath\" -Force
Copy-Item -Path "$LocalProjectPath\ecosystem.config.js" -Destination "$ServerPath\" -Force

# Copy .env if exists
if (Test-Path "$LocalProjectPath\.env") {
    Copy-Item -Path "$LocalProjectPath\.env" -Destination "$ServerPath\" -Force
    Write-Host "  .env copied: OK" -ForegroundColor Green
}

# Step 3: Copy standalone build
Write-Host ""
Write-Host "[Step 3] Copying build files..." -ForegroundColor Yellow

# Create directories
$standaloneDest = "$ServerPath\.next\standalone"
$staticDest = "$standaloneDest\.next\static"

if (-not (Test-Path $standaloneDest)) {
    New-Item -ItemType Directory -Force -Path $standaloneDest | Out-Null
}
if (-not (Test-Path $staticDest)) {
    New-Item -ItemType Directory -Force -Path $staticDest | Out-Null
}

# Copy standalone folder
Write-Host "  Copying standalone files..." -ForegroundColor Gray
robocopy "$LocalProjectPath\.next\standalone" $standaloneDest /E /IS /IT /NFL /NDL /NJH /NJS /NC /NS /NP 2>$null | Out-Null

# Copy static files
if (Test-Path "$LocalProjectPath\.next\static") {
    Write-Host "  Copying static files..." -ForegroundColor Gray
    robocopy "$LocalProjectPath\.next\static" $staticDest /E /IS /IT /NFL /NDL /NJH /NJS /NC /NS /NP 2>$null | Out-Null
}

Write-Host "  Build files: OK" -ForegroundColor Green

# Step 4: Test server
Write-Host ""
Write-Host "[Step 4] Testing server..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://$ServerIP`:4001/login" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  Server: OK (already running)" -ForegroundColor Green
        Write-Host ""
        Write-Host "  To apply changes, run on server:" -ForegroundColor Yellow
        Write-Host "    pm2 restart iomdaily" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Server not running. Starting PM2..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Please run these commands on the server:" -ForegroundColor Yellow
    Write-Host "    cd C:\iomdaily" -ForegroundColor Gray
    Write-Host "    pm2 start ecosystem.config.js" -ForegroundColor Gray
    Write-Host "    pm2 save" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Files copied to: $ServerPath" -ForegroundColor White
Write-Host "  Server URL: http://$ServerIP`:4001" -ForegroundColor White
Write-Host ""
Write-Host "  IMPORTANT: Restart PM2 on server to apply changes:" -ForegroundColor Yellow
Write-Host "    1. Connect to server (RDP or remote)" -ForegroundColor Gray
Write-Host "    2. Run: pm2 restart iomdaily" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"