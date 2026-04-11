# iomdaily

Full-stack Next.js 16 (App Router), React 19, MongoDB, Tailwind 4.

## Commands
- `npm run dev` - Dev server (localhost:3000)
- `npm run build` - Production build
- `npm run lint` - ESLint (no typecheck)

## Deployment (192.168.100.3:4001)
```powershell
pm2 stop iomdaily
npm run build
robocopy .next\static .next\standalone\.next\static /E /IS /IT
pm2 start ecosystem.config.js
pm2 save
```

## Auth
- JWT in HttpOnly cookies via `middleware.ts` (runtime: nodejs)
- Excludes: `/api/auth/*`, `/forgot-password`, `/reset-password`, `/login`, `/register`
- **CRITICAL**: New `/user/*` routes must be added to `middleware.ts` userPaths array

## Key Files
- Models: `models/` (User, Form, Response, Activity, KpiTarget)
- API: `app/api/` (use NextResponse, not res.json())
- Navigation: Hardcoded in `app/*/layout.tsx` navItems arrays
- UI: `components/ui/` (Button, Card, Input, Select, etc.)
- Activity form: `app/user/activity/page.tsx` - PRODUCT_OPTIONS array used in multiple sections

## Gotchas
- Adding a new page = update route file + layout.tsx navItems + middleware.ts userPaths
- Adding new product options = update PRODUCT_OPTIONS in `app/user/activity/page.tsx`
- NextResponse (not res.json())
- Tailwind 4: no tailwind.config.js
- Zod 4: z.infer (not z.infer<>)
- useSearchParams requires Suspense boundary
- Admin role blocked from `/user/*` paths

## Credentials
- Admin: admin@iomdaily.com / admin123
- User: user@iomdaily.com / user123

## Docs
- `MONGODB-SETUP.md` - MongoDB install guide
- `deploy.ps1` - PowerShell deployment script