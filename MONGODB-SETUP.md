# MongoDB Installation & Setup Guide for iomdaily

## Quick Install (If MongoDB Not Installed)

### Option 1: Download and Install MongoDB
1. Go to: https://www.mongodb.com/try/download/community
2. Choose:
   - Version: 8.0 (or latest)
   - Package: MSI
   - Platform: Windows
3. Run the installer
4. During installation, choose "Complete" setup
5. Don't install MongoDB Compass (optional)

### Option 2: Using Chocolatey
```powershell
# If you have Chocolatey installed
choco install mongodb -y
```

### Option 3: Manual Setup
```powershell
# Download MongoDB binary from:
# https://www.mongodb.com/try/download/community?t集群=8.0&platform=windows

# Extract to C:\mongodb
# Create folders:
mkdir C:\data\db
mkdir C:\data\log

# Run MongoDB:
C:\mongodb\bin\mongod.exe --dbpath C:\data\db --logpath C:\data\log\mongod.log --install
net start MongoDB
```

---

## Verify MongoDB Installation

```powershell
# Check if MongoDB service exists
Get-Service MongoDB

# Or check if mongod is running
netstat -an | findstr "27017"
```

---

## MongoDB Connection Info (iomdaily)

- **Connection String:** `mongodb://localhost:27017/iomdaily`
- **Port:** 27017
- **Database Name:** iomdaily
- **Data Path:** C:\data\db

---

## MongoDB Service Commands

```powershell
# Start MongoDB
net start MongoDB

# Stop MongoDB
net stop MongoDB

# Check status
sc query MongoDB

# Remove service (if needed)
C:\mongodb\bin\mongod.exe --remove
```

---

## Troubleshooting

### Issue: "MongoDB not found"
**Solution:** Install MongoDB from https://www.mongodb.com/try/download/community

### Issue: "Port 27017 already in use"
**Solution:** Another MongoDB instance is running. Check with: `netstat -an | findstr "27017"`

### Issue: "Failed to connect to database"
**Solution:** 
1. Check MongoDB is running: `net start MongoDB`
2. Verify connection: `mongosh` (if installed)
3. Check firewall rules

### Issue: "Access denied" when starting service
**Solution:** Run PowerShell as Administrator

---

## MongoDB Compass (Optional GUI)

Download from: https://www.mongodb.com/products/compass

Connection string:
```
mongodb://localhost:27017/iomdaily
```