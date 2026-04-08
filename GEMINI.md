# GEMINI.md - iomdaily Context

## Project Overview
**iomdaily** is a full-stack Next.js application designed as a **Role-Based Dynamic Form Builder with an Analytics Dashboard**. It allows Administrators to create complex, dynamic forms with various field types and visualize respondent data through interactive charts and filterable tables. Users can view and submit forms assigned to them.

### Core Features
- **Admin Role:** Build forms (drag-and-drop), manage users, and view real-time analytics.
- **User Role:** View assigned forms and submit responses.
- **Dynamic Form Builder:** Supports 9 field types (Text, Textarea, Number, Date, Dropdown, Checkbox, Radio, Rating, Email).
- **Analytics Dashboard:** Visualizes data using Bar charts, Pie charts, and Histograms (via Recharts).
- **Custom Auth:** JWT-based authentication with Access and Refresh tokens stored in HttpOnly cookies.

## Tech Stack
- **Framework:** Next.js 16 (App Router) with React 19.
- **Styling:** Tailwind CSS 4, Radix UI (shadcn/ui), Lucide React icons.
- **Database:** MongoDB Atlas with Mongoose ODM.
- **State Management:** Zustand.
- **Data Fetching:** TanStack Query (React Query) and Axios.
- **Form Handling:** React Hook Form + Zod for schema validation.
- **Utilities:** `dnd-kit` (drag-and-drop), `bcryptjs` (hashing), `jose`/`jsonwebtoken` (JWT), `papaparse` (CSV export).

## Directory Structure
- `app/`: Next.js App Router.
  - `(auth)/`: Login and registration routes.
  - `(admin)/`: Admin-only routes (Dashboard, Form Builder, User Management).
  - `(user)/`: User-specific routes (Assigned Forms, Submission).
  - `api/`: Backend API endpoints (Auth, Forms, Responses, Users).
- `components/`:
  - `ui/`: shadcn/ui base components.
  - `forms/`: Form builder and renderer components.
  - `dashboard/`: Analytics and reporting components.
  - `charts/`: Recharts wrappers.
- `lib/`: Core utilities (Auth helpers, DB connection, Middleware factories, Zod schemas).
- `models/`: Mongoose models (User, Form, Response, RefreshToken).
- `store/`: Zustand stores for Auth, Form Building, and Dashboard state.
- `hooks/`: Custom React hooks for data fetching and auth logic.
- `types/`: TypeScript definitions.

## Building and Running
### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- `.env.local` file with the following keys:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`

### Commands
- **Development:** `npm run dev` (Runs on `http://localhost:3000`)
- **Production Build:** `npm run build`
- **Start Production:** `npm run start`
- **Linting:** `npm run lint`

## Development Conventions
- **Routing:** Use App Router route groups `(auth)`, `(admin)`, `(user)` to separate concerns and layouts.
- **API Routes:** Use the `NextResponse` and `connectDB` helper for all backend handlers.
- **Validation:** Always define a Zod schema in `lib/validations/` for request bodies and form states.
- **Authentication:** Role-based access is enforced via Next.js Middleware and server-side role checks in API routes.
- **Styling:** Adhere to the `shadcn/ui` pattern and use Tailwind utility classes.
- **State:** Use Zustand for global UI state and TanStack Query for server-state caching.
