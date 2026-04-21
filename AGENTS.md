# iomdaily

Next.js 16.2.2 (App Router), React 19.2.4, MongoDB, Tailwind 4, Zod 4.3.6, Zustand.

## Dev Commands
- `npm run dev` - Dev server (localhost:3000)
- `npm run build` - Production build (standalone output: `.next/standalone/`)
- `npm run lint` - ESLint only (no separate typecheck - types validated during build)

## Deployment
Server: 192.168.100.3:4001

```powershell
# PowerShell (recommended)
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

```batch
# Or batch script
deploy.bat
```

## PM2
- `pm2 list` - Running processes
- `pm2 logs iomdaily --lines 50` - Recent logs
- `pm2 stop iomdaily` / `pm2 start iomdaily` - Stop/start
- `pm2 save` - Persist state

## Auth & Roles
- JWT in HttpOnly cookies via `middleware.ts` (runtime: nodejs)
- 3 roles: `admin`, `user`, `accounts`
- Public paths: `/api/auth/*`, `/forgot-password`, `/reset-password`, `/login`, `/register`, `/api/static-form/*`

### Role Access (middleware.ts)
- `/admin/*` - admin only
- `/user/*` - user only
- `/accounts/*` - accounts + admin

## Critical Gotchas
1. **New /user/* routes**: Add to BOTH `middleware.ts` userPaths array AND `app/user/layout.tsx` navItems
2. **Product options**: Update PRODUCT_OPTIONS in BOTH `app/user/activity/page.tsx` AND `app/user/appointment-request/page.tsx` (different values!)
3. **Tailwind 4**: No tailwind.config.js - uses CSS-based config in `app/globals.css`
4. **Zod 4**: Use `z.infer<typeof schema>`, NOT `z.infer<>` (no generic syntax)
5. **useSearchParams**: Requires Suspense boundary (see `app/reset-password/page.tsx` for example)
6. **Post-deploy 404s**: Browser cache holds old hashes. Hard refresh (Ctrl+Shift+R) or incognito

## Models
`models/` - User, Form, Response, Activity, KpiTarget, Appointment, DailySalesEntry, SalesTarget, RefreshToken, AppointmentForm

## API
- Use `NextResponse`, NOT `res.json()`
- UI components: `components/ui/`

## Credentials
- Admin: admin@iomdaily.com / admin123
- User: user@iomdaily.com / user123

## Setup
- MongoDB required: connection string `mongodb://localhost:27017/iomdaily`
- See `MONGODB-SETUP.md` for installation guide
- JWT_SECRET env var (defaults to insecure dev key in middleware.ts)