# AGENTS.md - iomdaily

## Project Type
Full-stack Next.js 16.2.2 (App Router) with React 19.2.4, MongoDB, and Tailwind 4.

## Key Commands
- **Dev:** `npm run dev` (http://localhost:3000)
- **Build:** `npm run build`
- **Start:** `npm run start`
- **Lint:** `npm run lint`
- **Note:** No test/typecheck scripts

## Environment Setup
Create `.env.local` with:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Access token secret
- `JWT_REFRESH_SECRET` - Refresh token secret

## Framework & Toolchain Quirks
- **Next.js 16:** App Router only; breaking changes from v13-15. Read docs before writing code.
- **Tailwind 4:** CSS-based config (`postcss.config.mjs`), no `tailwind.config.js`
- **ESLint 9:** Flat config (`eslint.config.mjs`), not `.eslintrc`
- **Zod 4:** Uses v4 (`z.infer`, `z.object`), not v3

## Architecture Essentials
- **Route Groups:** `(user)/`, `(admin)/` for role-based layouts
- **API Routes:** `app/api/` using `NextResponse` + `connectDB` helper
- **Auth:** JWT access/refresh tokens in HttpOnly cookies; middleware in `middleware.ts`
- **State:** Zustand (global UI), TanStack Query (server state)
- **Models:** Mongoose in `models/` (User, Form, Response, RefreshToken, Activity, KpiTarget)
- **Validation:** Zod schemas in `lib/validations/` for requests/forms
- **Forms:** React Hook Form + dnd-kit for drag-and-drop builder

## Development Workflow
1. Always validate request bodies with Zod schemas from `lib/validations/`
2. Use `connectDB()` helper in API routes for MongoDB connections
3. Protect routes via middleware (`middleware.ts`) and server-side role checks
4. For form builder: use `dnd-kit` with React Hook Form
5. For charts: use Recharts wrappers in `components/charts/`

## File Conventions
- **Components:** `components/ui/` (shadcn/ui base), `components/forms/`, `components/dashboard/`
- **Lib:** `lib/auth/` (helpers), `lib/validations/` (Zod), `lib/utils/`
- **Store:** Zustand stores in `store/` (auth, form builder, dashboard)
- **Hooks:** Custom React hooks in `hooks/` for data fetching and auth
- **Types:** TypeScript definitions in `types/`

## Gotchas
- ESLint uses flat config; extends `eslint-config-next` implicitly
- Tailwind 4 requires `@tailwindcss/postcss` in devDependencies
- API route handlers must use `NextResponse` (not `res.status().json()`)
- Middleware protects paths; login/register are public under `/api/auth`
- Middleware must use `nodejs` runtime (not edge) - add `export const runtime = 'nodejs'`
- **Cookie network issue:** Cookies require `sameSite: "lax"` for cross-origin network access
- **Role-based middleware:** Admin paths (`/admin/*`) blocked for user role; user paths blocked for admin role

## Deployment (PM2)
- **Port:** 4001
- **Config:** `ecosystem.config.js`
- **Build:** `npm run build` (requires standalone output in `next.config.ts`)
- **Static files:** Copy `.next/static` to `.next/standalone/.next/static`

### Deployment Scripts (run to deploy)
- **Windows:** `deploy.bat` - Run to build & deploy
- **PowerShell:** `deploy.ps1` - Recommended script

### Manual Commands:
```bash
pm2 stop iomdaily
npm run build
robocopy .next\static .next\standalone\.next\static /E /IS /IT
pm2 start ecosystem.config.js
pm2 save
```

### URL: http://192.168.100.3:4001

## Credentials (Database)
- **Admin:** admin@iomdaily.com / admin123
- **User:** user@iomdaily.com / user123