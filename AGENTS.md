# iomdaily

## Project
Full-stack Next.js 16 (App Router), React 19, MongoDB, Tailwind 4.

## Commands
- Dev: `npm run dev` (localhost:3000)
- Build: `npm run build`
- Start: `npm run start` (production)
- Lint: `npm run lint` (no typecheck script)

## Deployment (192.168.100.3:4001)
```bash
pm2 stop iomdaily
npm run build
robocopy .next\static .next\standalone\.next\static /E /IS /IT
pm2 start ecosystem.config.js
pm2 save
```

## Env (.env.local)
- `MONGODB_URI=mongodb://localhost:27017/iomdaily`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`

## Auth
- JWT tokens in HttpOnly cookies
- Middleware: `middleware.ts` (runtime: nodejs)
- Middleware excludes `/api/auth/*`, `/forgot-password`, `/reset-password`, `/login`, `/register`

## Credentials (Register these in the app)
- **Admin:** admin@iomdaily.com / admin123
- **User:** user@iomdaily.com / user123

## Key Files
- Models: `models/` (User, Form, Response, Activity, KpiTarget)
- Validations: `lib/validations/` (Zod schemas)
- API: `app/api/` (NextResponse, connectDB)
- Forms: `components/forms/` (dnd-kit + React Hook Form)
- Charts: Recharts direct import

## Gotchas
- NextResponse (not res.json())
- Tailwind 4: no tailwind.config.js, uses `@tailwindcss/postcss`
- ESLint 9: flat config in eslint.config.mjs
- Zod 4: z.infer, not z.infer<>
- useSearchParams needs Suspense boundary
- Role middleware: admin paths blocked for user role