# iomdaily Deployment Guide

## Server Information
- **Server IP**: 192.168.100.3
- **Port**: 4001
- **External Access**: http://192.168.100.3:4001

---

## Required Software & Libraries

### 1. Node.js (Required)
- **Version**: 20.x LTS or 22.x
- **Download**: https://nodejs.org/
- **Installation**: Use Windows MSI installer

### 2. MongoDB (Required - Database)
- **Version**: 8.0+ (recommended)
- **Download**: https://www.mongodb.com/try/download/community
- **Installation**: 
  - Choose: Windows, MSI, Version 8.0+
  - Install as Windows Service (recommended)
- **Data Directory**: `C:\data\db`
- **Log Directory**: `C:\data\log`

### 3. PM2 (Required - Process Manager)
```bash
npm install -g pm2
```
- Keeps the app running in background
- Auto-restarts on crashes
- Manages logs

### 4. Git (Optional - for cloning repo)
- **Download**: https://git-scm.com/

---

## Quick Start (Fresh Server)

### Step 1: Install Prerequisites
1. Install Node.js 20.x from https://nodejs.org/
2. Install MongoDB 8.0+ from https://www.mongodb.com/try/download/community
3. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

### Step 2: Setup MongoDB
```powershell
# Create data directories (if not created by installer)
mkdir C:\data\db
mkdir C:\data\log

# Start MongoDB service
net start MongoDB
```

### Step 3: Deploy Application
```powershell
# Clone or copy the project to the server
# Then run deployment script

powershell -ExecutionPolicy Bypass -File deploy.ps1
```

Or manually:
```bash
# Install dependencies
npm install

# Build
npm run build

# Copy static files (for standalone mode)
robocopy .next\static .next\standalone\.next\static /E

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

---

## Environment Variables

The app uses these environment variables (configured in `ecosystem.config.js`):

| Variable | Description | Default (Dev) |
|----------|-------------|---------------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `4001` |
| `HOST` | Bind address | `0.0.0.0` |
| `MONGODB_URI` | MongoDB connection | `mongodb://localhost:27017/iomdaily` |
| `JWT_SECRET` | JWT signing key | (change in production!) |
| `JWT_REFRESH_SECRET` | Refresh token key | (change in production!) |

### Changing Environment Variables
Edit `ecosystem.config.js` and restart:
```bash
pm2 restart iomdaily
pm2 save
```

---

## Network & Firewall Configuration

### For Local Network Access
The app binds to `0.0.0.0` (all interfaces), so it's automatically accessible on the local network at:
- http://192.168.100.3:4001

### For External/Internet Access

#### Option 1: Port Forwarding (Router)
1. Access your router admin panel
2. Forward external port 4001 to 192.168.100.3:4001
3. Access via your public IP/domain

#### Option 2: VPN
Connect to the server's VPN to access the internal network

#### Option 3: Reverse Proxy (nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://192.168.100.3:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Windows Firewall
If accessing remotely, allow the port:
```powershell
netsh advfirewall firewall add rule name="iomdaily" dir=in action=allow protocol=tcp localport=4001
```

---

## PM2 Commands

```bash
# View running processes
pm2 list

# View logs
pm2 logs iomdaily

# Restart app
pm2 restart iomdaily

# Stop app
pm2 stop iomdaily

# Start app
pm2 start iomdaily

# Persist PM2 state (run after any changes)
pm2 save

# Monitor in real-time
pm2 monit
```

---

## Troubleshooting

### MongoDB Connection Failed
```powershell
# Check MongoDB service
net start MongoDB

# Test connection
mongosh
```

### Port Already in Use
```powershell
# Find process using port 4001
netstat -ano | findstr :4001

# Kill if needed
taskkill /PID <PID> /F
```

### App Won't Start
```bash
# Check logs
pm2 logs iomdaily --lines 100

# Check build output
npm run build
```

---

## Default Credentials

- **Admin**: admin@iomdaily.com / admin123
- **User**: user@iomdaily.com / user123
- **Accounts**: accounts@iomdaily.com / accounts123

---

## File Structure on Server

```
H:\iomdaily\
├── .next\                  # Build output
│   └── standalone\         # Standalone app
├── models\                 # MongoDB models
├── app\                    # Next.js app router
├── logs\                   # PM2 logs
│   ├── error.log
│   └── combined.log
├── ecosystem.config.js     # PM2 config
├── deploy.ps1              # PowerShell deploy script
└── deploy.bat              # Batch deploy script
```
