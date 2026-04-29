# iomdaily

Next.js 16.2.2 (App Router), React 19.2.4, MongoDB, Tailwind 4, Zod 4.3.6, Zustand.

## Dev Commands
- `npm run dev` - Dev server (auto-selects available port: 3000, 3001, etc.)
- If port in use, run `taskkill /PID <pid> /F` to stop conflicting process, or just wait for Next.js to pick next port
- `npm run build` - Production build (standalone output: `.next/standalone/`)
- `npm run start` - Production server (after build)
- `npm run lint` - ESLint only (no separate typecheck - types validated during build)

## Common Dev Issues
- **Turbopack junction point errors**: Run `Remove-Item -Recurse -Force .next` to clean corrupted `.next` folder
- **Port in use**: Kill process or let Next.js auto-select next available port
- **Post-deploy 404s**: Browser cache holds old hashes - hard refresh with Ctrl+Shift+R

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
- 7 roles: `admin`, `user`, `accounts`, `esbd`, `service`, `marketing`, `consumable`, `logistics`
- Public: login, register, forgot-password, reset-password, /api/auth/*, /api/static-form/*

### Role Access (middleware.ts)
- `/admin/*` - admin only
- `/user/dashboard`, `/user/forms`, `/user/activity`, `/user/kpi`, `/user/profile`, `/user/next-day-plan`, `/user/appointment-request`, `/user/trainings`, `/user/lead-transfer**` - user only
- `/accounts/target-setting`, `/accounts/daily-sales`, `/accounts/lead-transfer**` - accounts + admin
- `/esbd/dashboard`, `/esbd/brands`, `/esbd/products`, `/esbd/trainings`, `/esbd/assign-training`, `/esbd/profile`, `/esbd/lead-transfer**` - esbd + admin
- `/admin/assigned-training` - admin only (view all ESBD training assignments)
- `/service/dashboard`, `/service/trainings`, `/service/profile`, `/service/lead-transfer**` - service + admin
- `/marketing/dashboard`, `/marketing/trainings`, `/marketing/profile`, `/marketing/lead-transfer**` - marketing + admin
- `/consumable/dashboard`, `/consumable/lead-transfer**`, `/consumable/profile` - consumable + admin
- `/logistics/dashboard`, `/logistics/lead-transfer**`, `/logistics/profile` - logistics + admin
- ** includes /received and /sent sub-paths
- API: `/api/forms`, `/api/users`, `/api/responses`, `/api/appointments` - admin only
- API: `/api/sales-targets`, `/api/daily-sales` - accounts + admin
- API: `/api/companies`, `/api/products`, `/api/trainings` - esbd + admin
- API: `/api/lead-transfers`, `/api/training-assignments` - all authenticated users

## Critical Gotchas
1. **New /user/* routes**: Add to BOTH `middleware.ts` userPaths array AND `app/user/layout.tsx` navItems
2. **Lead Transfer**: Non-admin roles use unified page at `app/consumable/lead-transfer/page.tsx` with tabs (Transfer/Received/Sent). Just update navItems in `app/{role}/layout.tsx`. Admin has separate page at `app/admin/lead-transfer/page.tsx`
3. **Login redirects**: Update `app/login/page.tsx` handleSubmit with new role redirects
4. **Role layout redirects**: Update role redirect logic in all `app/{role}/layout.tsx` files
5. **Product options differ by page**:
   - Activity: `["MFP / Printer", "MDS", "Barcode", "POS", "IT / Infrastructure", "AMC / Consumables", "Paper Shredder", "Duplicator", "Solutions", "Others"]`
   - Appointment request: `["Toshiba MFP", "MDS", "Auto ID / Barcode", "IT Infrastructure", ...]`
6. **Tailwind 4**: No tailwind.config.js - config via CSS in `app/globals.css`
7. **Zod 4**: Use `z.infer<typeof schema>` (no generic syntax)
8. **useSearchParams**: Requires Suspense boundary in parent
9. **Post-deploy 404s**: Browser cache holds old hashes. Hard refresh (Ctrl+Shift+R)
10. **Select component**: Uses native `<select>` with `options: { value, label }[]` prop - NOT Radix
11. **API fetch calls**: Add `credentials: "include"` for cookies
12. **ESBD Brands**: Renamed from "Companies" - use `/esbd/brands` route, update middleware paths, navItems in layout
13. **API [id] routes**: Next.js 16 requires `params: Promise<{ id: string }>` pattern, NOT `searchParams`
14. **isProtected field**: Brands and Products have `isProtected` boolean - protected items cannot be deleted/modified
15. **Training Priority**: TrainingAssignment has `priority` field ("high", "medium", "low") - defaults to "medium"
16. **Training Month**: TrainingAssignment has `month` field (YYYY-MM format) for tracking assignment month
17. **Training Filters**: Service, Marketing, Usertrainings pages have filters for month, priority, and training name
18. **Admin Assigned Training**: `/admin/assigned-training` shows all training assignments grouped by status (pending/in_progress/completed) with filters for user, status, priority, training, month

## Models
`models/` - User, Form, Response, Activity, KpiTarget, Appointment, DailySalesEntry, SalesTarget, RefreshToken, AppointmentForm, Company (has isProtected), Product (has isProtected), Training, TrainingAssignment (has priority), LeadTransfer. User role includes: admin, user, accounts, esbd, service, marketing, consumable, logistics

## API
- Use `NextResponse`, NOT `res.json()`
- UI components: `components/ui/`

## Credentials
- Admin: admin@iomdaily.com / admin123
- User: user@iomdaily.com / user123

## Setup
- MongoDB required: connection string `mongodb://localhost:27017/iomdaily`
- See `MONGODB-SETUP.md` for installation
- JWT_SECRET env var (defaults to insecure dev key in middleware.ts)

## References
- `opencode.json` - references: deploy.ps1, MONGODB-SETUP.md
- `CLAUDE.md` - alias to this file