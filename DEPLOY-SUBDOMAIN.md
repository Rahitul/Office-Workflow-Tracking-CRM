# Deploy Next.js App at `app.iomltd.com` (Subdomain)

## Overview

This guide covers deploying the Next.js (iomdaily) project alongside the existing WordPress site at `www.iomltd.com`. The app will be accessible at `app.iomltd.com` via reverse proxy.

**Architecture:**
```
www.iomltd.com          → WordPress (port 80/443)
app.iomltd.com          → Next.js app (reverse proxy → 192.168.100.3:4001)
```

**Current Setup:**
- Local Server IP: `192.168.100.3` (internal network)
- Public/Shared IP: `182.160.108.210` (accessible from other networks)
- Local Port: `4001` (PM2 running Next.js)
- Public Port: `4002` (port forwarding from local 4001)
- Deploy path: `C:\iomdaily`
- Domain: `www.iomltd.com`

**Port Forwarding:**
```
182.160.108.210:4002  →  192.168.100.3:4001  (PM2 Next.js app)
```

---

## Step 1: Add DNS Record

Log into your domain registrar (where you bought `iomltd.com`) or your hosting control panel (cPanel/Plesk/etc.).

Add this DNS record:

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| **A** | `app` | `182.160.108.210` | 300 |

This makes `app.iomltd.com` point to your public server IP.

**Wait 5-10 minutes** for DNS propagation. Verify with:

```bash
ping app.iomltd.com
```

It should return `182.160.108.210`.

---

## Step 2: Verify PM2 is Running

On your server (`192.168.100.3`), confirm the app is running on port 4001:

```bash
pm2 list
```

Should show `iomdaily` with status `online`.

---

## Step 3: Verify Port Forwarding

The port forwarding from `182.160.108.210:4002` to `192.168.100.3:4001` must be configured on your router.

**To verify**, from an external network (not your local network):

```
http://182.160.108.210:4002/login
```

If this loads your login page, port forwarding is working.

**If not working**, check your router settings:
1. Login to router admin (usually `192.168.100.1` or `192.168.1.1`)
2. Find "Port Forwarding" / "Virtual Server" / "NAT"
3. Add rule:

| External Port | Internal IP | Internal Port | Protocol |
|---------------|-------------|---------------|----------|
| 4002 | 192.168.100.3 | 4001 | TCP |

---

## Step 4: Open Port 4001 on Server Firewall

On the server (`192.168.100.3`), allow inbound traffic on port 4001:

```powershell
# PowerShell (Run as Admin)
netsh advfirewall firewall add rule name="Next.js App 4001" dir=in action=allow protocol=tcp localport=4001
```

Or via Windows Defender Firewall GUI:

1. Windows Defender Firewall with Advanced Security
2. Inbound Rules → New Rule
3. Port → TCP → 4001 → Allow the connection

---

## Step 5: Test Direct Access

Before configuring anything, test that the app is reachable.

### From Local Network (same network as server):
```
http://192.168.100.3:4001/login
```

### From External Network (other networks):
```
http://182.160.108.210:4002/login
```

If both load your login page, the DNS + firewall + port forwarding are working.

---

## Step 6: Set Up Reverse Proxy (Clean URL — No Port)

To make `http://app.iomltd.com` work (without `:4002`), you need a reverse proxy on the server.

### Option A: nginx on Windows (Recommended)

1. Download nginx for Windows: http://nginx.org/en/download.html
2. Extract to `C:\nginx`
3. Edit `C:\nginx\conf\nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    # App subdomain
    server {
        listen 80;
        server_name app.iomltd.com;

        location / {
            proxy_pass http://127.0.0.1:4001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /_next/static {
            proxy_pass http://127.0.0.1:4001;
            proxy_cache_valid 200 365d;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
    }
}
```

4. Start nginx:

```bash
C:\nginx\nginx.exe
```

5. Add to PM2 so it auto-starts:

```bash
pm2 start C:\nginx\nginx.exe --name nginx
pm2 save
```

6. Open port 80 on server firewall:

```powershell
netsh advfirewall firewall add rule name="Nginx Port 80" dir=in action=allow protocol=tcp localport=80
```

7. Add port forwarding on router for port 80:

| External Port | Internal IP | Internal Port | Protocol |
|---------------|-------------|---------------|----------|
| 80 | 192.168.100.3 | 80 | TCP |

### Option B: IIS Reverse Proxy (if IIS is installed)

1. Install URL Rewrite + Application Request Routing
   - Download from Microsoft: IIS URL Rewrite and ARR
   - Or via Web Platform Installer

2. Open IIS Manager → Server node → URL Rewrite → Add Rule(s) → Reverse Proxy

3. Enter `localhost:4001` as the backend, enable SSL offloading

---

## Step 7: SSL Certificate (HTTPS)

### Option A: Cloudflare (Free, Easiest)

1. Move DNS to Cloudflare (free plan)
2. Change nameservers at your domain registrar to Cloudflare's
3. Add A record `app` → `182.160.108.210` in Cloudflare dashboard
4. Enable "Full (Strict)" SSL in Cloudflare → SSL/TLS
5. SSL works instantly, no cert installation needed

### Option B: Win-ACME (Windows)

1. Download: https://www.win-acme.com/
2. Run: `wacs.exe`
3. Create certificate for `app.iomltd.com`
4. Choose manual mode or IIS integration

### Option C: Certbot (Linux)

```bash
sudo certbot --nginx -d app.iomltd.com
```

---

## Step 8: WordPress Button

Log into WordPress admin (`www.iomltd.com/wp-admin`).

Add a button anywhere (page, widget, or menu):

### Gutenberg Block

1. Add a "Buttons" block
2. Set link to: `https://app.iomltd.com/login`
3. Open in new tab: Yes

### HTML Widget

Go to Appearance → Widgets → add Custom HTML:

```html
<a href="https://app.iomltd.com/login" target="_blank"
   style="display:inline-block;padding:14px 28px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;margin:10px 0;">
   Open Project Dashboard
</a>
```

### Menu Item

Appearance → Menus → Add Custom Link:

- URL: `https://app.iomltd.com/login`
- Navigation Label: `Dashboard`

---

## Step 9: Update Environment Variables

In `.env.local` on the server (`C:\iomdaily\.env.local`), add or update:

```env
NEXTAUTH_URL=https://app.iomltd.com
NEXT_PUBLIC_BASE_URL=https://app.iomltd.com
```

Update any hardcoded `http://182.160.108.210:4002` references to `https://app.iomltd.com`.

---

## Step 10: Cookie Domain (Optional but Recommended)

For cross-subdomain auth (if WordPress and the app need to share auth), update cookie settings.

In `lib/auth.ts`, when setting cookies, add:

```ts
{
  domain: ".iomltd.com",  // leading dot = all subdomains
  // ... rest of cookie options
}
```

This makes cookies work on both `www.iomltd.com` and `app.iomltd.com`.

---

## Step 11: Deploy

```bash
# SSH into server (192.168.100.3)
cd C:\iomdaily
git pull origin main
npm run build

# Copy static files to standalone
xcopy /E /I /Y .next\static .next\standalone\_next\static
xcopy /E /I /Y public .next\standalone\public

# Restart
pm2 restart iomdaily
pm2 save
```

---

## Step 12: Test Everything

1. **Local direct**: `http://192.168.100.3:4001/login` — should work
2. **Public direct**: `http://182.160.108.210:4002/login` — should work
3. **Via proxy**: `http://app.iomltd.com/login` — should work
4. **With SSL**: `https://app.iomltd.com/login` — should work
5. **WordPress button**: Click it → opens app login in new tab
6. **Login**: Test full auth flow

---

## Direct IP Access After Setup

After adding the subdomain, `http://182.160.108.210:4002` **still works**. The subdomain setup is additive — it does not disable direct IP access.

- `http://192.168.100.3:4001/login` → still works (local network)
- `http://182.160.108.210:4002/login` → still works (public, port forwarding)
- `http://app.iomltd.com/login` → works (via reverse proxy)
- `https://app.iomltd.com/login` → works (via reverse proxy + SSL)

All URLs hit the same PM2 process on port 4001.

---

## Network Diagram

```
[External User]
    |
    v
182.160.108.210 (Public IP)
    |
    |-- Port 80   --> nginx (reverse proxy) --> 127.0.0.1:4001 --> PM2 (Next.js)
    |-- Port 443  --> nginx (SSL + reverse proxy) --> 127.0.0.1:4001 --> PM2 (Next.js)
    |-- Port 4002 --> Port Forwarding --> 192.168.100.3:4001 --> PM2 (Next.js)
    |
    v
[WordPress]
    |
    v
www.iomltd.com (Port 80/443)
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `app.iomltd.com` doesn't resolve | Wait for DNS propagation (up to 24h), or check A record |
| Connection refused (public) | Port forwarding not set up — check router config |
| Connection refused (local) | Port 4001 not open in firewall, or PM2 not running |
| 502 Bad Gateway | Nginx/IIS can't reach `localhost:4001` — check PM2 status |
| SSL error | Certificate not installed or expired — renew with Win-ACME |
| Cookies not persisting | Set cookie domain to `.iomltd.com` |
| WordPress button 404 | Check URL is `https://app.iomltd.com/login` (not `www`) |
| Next.js 404 on assets | Static files not copied — re-run build + copy commands |
| Port 4002 not accessible | Check router port forwarding + server firewall for 4002 |

---

## Quick Reference

| URL | Access From | Status |
|-----|-------------|--------|
| `http://192.168.100.3:4001/login` | Local network | Direct (always works) |
| `http://182.160.108.210:4002/login` | Any network | Port forwarding (needs Step 3) |
| `http://app.iomltd.com/login` | Any network | Reverse proxy (needs Step 6) |
| `https://app.iomltd.com/login` | Any network | Reverse proxy + SSL (needs Step 7) |
| `https://www.iomltd.com` | Any network | WordPress (unchanged) |
