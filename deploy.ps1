# ============================================
# iomdaily Server Setup & Deployment Script
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  IOMDAILY - Server Setup & Deploy" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check and start MongoDB
Write-Host "[Step 1] Checking MongoDB..." -ForegroundColor Yellow

try {
    $mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    if ($mongoService) {
        if ($mongoService.Status -ne "Running") {
            Start-Service -Name "MongoDB"
            Write-Host "  MongoDB: Started" -ForegroundColor Green
        } else {
            Write-Host "  MongoDB: Already running" -ForegroundColor Green
        }
    } else {
        Write-Host "  MongoDB service not found. Checking for MongoDB executable..." -ForegroundColor Yellow
        
        $mongod = Get-Command mongod -ErrorAction SilentlyContinue
        if ($mongod) {
            Write-Host "  MongoDB found at: $($mongod.Source)" -ForegroundColor Green
            Write-Host "  Creating data directories..." -ForegroundColor Yellow
            
            New-Item -ItemType Directory -Force -Path "C:\data\db" | Out-Null
            New-Item -ItemType Directory -Force -Path "C:\data\log" | Out-Null
            
            Write-Host "  To install MongoDB as service, run as Administrator:" -ForegroundColor Red
            Write-Host "  mongod --install --dbpath C:\data\db --logpath C:\data\log\mongod.log" -ForegroundColor Gray
        } else {
            Write-Host "  ERROR: MongoDB is not installed!" -ForegroundColor Red
            Write-Host "  Please install from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  MongoDB check failed: $_" -ForegroundColor Red
}

# Wait for MongoDB
Start-Sleep -Seconds 2

# Step 2: Stop existing PM2 app
Write-Host ""
Write-Host "[Step 2] Stopping existing PM2 app..." -ForegroundColor Yellow
pm2 stop iomdaily 2>$null
Write-Host "  Stopped" -ForegroundColor Green

# Step 3: Install dependencies
Write-Host ""
Write-Host "[Step 3] Installing dependencies..." -ForegroundColor Yellow
Set-Location "H:\iomdaily"
npm install 2>$null
Write-Host "  Done" -ForegroundColor Green

# Step 4: Build
Write-Host ""
Write-Host "[Step 4] Building Next.js application..." -ForegroundColor Yellow
npm run build 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Build: OK" -ForegroundColor Green
} else {
    Write-Host "  Build: FAILED!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 5: Copy static files
Write-Host ""
Write-Host "[Step 5] Copying static files..." -ForegroundColor Yellow
if (Test-Path ".next\static") {
    if (-not (Test-Path ".next\standalone\.next\static")) {
        New-Item -ItemType Directory -Force -Path ".next\standalone\.next\static" | Out-Null
    }
    robocopy ".next\static" ".next\standalone\.next\static" /E /IS /IT /NFL /NDL /NJH /NJS 2>$null
    Write-Host "  Static files: OK" -ForegroundColor Green
} else {
    Write-Host "  Static files: Skipped" -ForegroundColor Yellow
}

# Step 6: Start PM2
Write-Host ""
Write-Host "[Step 6] Starting PM2 app..." -ForegroundColor Yellow
pm2 start ecosystem.config.js
pm2 save

# Step 7: Test
Write-Host ""
Write-Host "[Step 7] Testing server..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "http://localhost:4001/login" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "  Server: OK" -ForegroundColor Green
    } else {
        Write-Host "  Server: Response $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Server: FAILED - $_" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  URLs:" -ForegroundColor White
Write-Host "  - Local:    http://localhost:4001" -ForegroundColor Gray
Write-Host "  - Network:  http://192.168.100.3:4001" -ForegroundColor Gray
Write-Host ""
Write-Host "  Credentials:" -ForegroundColor White
Write-Host "  - Admin: admin@iomdaily.com / admin123" -ForegroundColor Gray
Write-Host "  - User:  user@iomdaily.com / user123" -ForegroundColor Gray
Write-Host ""
Write-Host "  MongoDB: mongodb://localhost:27017/iomdaily" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"