# Product Requirements Document & System Design
## Role-Based Dynamic Form Builder with Analytics Dashboard

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [User Personas](#3-user-personas)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [User Stories](#6-user-stories)
7. [System Architecture](#7-system-architecture)
8. [Database Design](#8-database-design)
9. [API Design](#9-api-design)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Data Flow Diagrams](#12-data-flow-diagrams)
13. [Component Breakdown](#13-component-breakdown)
14. [Project Structure](#14-project-structure)
15. [Tech Stack Summary](#15-tech-stack-summary)
16. [Implementation Roadmap](#16-implementation-roadmap)
17. [Security Considerations](#17-security-considerations)
18. [Scalability Considerations](#18-scalability-considerations)

---

## 1. Product Overview

### 1.1 Summary

A full-stack web application that enables **Admins** to build dynamic forms (similar to Google Forms), distribute them to **Users**, and visualize collected response data through an interactive analytics dashboard — with role-based access control enforced via JWT authentication.

### 1.2 Problem Statement

Organizations need a lightweight internal tool to:
- Collect structured data from users via custom forms
- Visualize aggregate responses in real time
- Filter, search, and export individual submissions
- Control who can build forms vs. who can fill them

### 1.3 Scope

| In Scope | Out of Scope |
|---|---|
| Role-based auth (Admin / User) | Third-party OAuth login |
| Dynamic form builder (Admin) | File upload fields |
| Form submission (User) | Email/SMS delivery |
| Analytics dashboard with charts | Real-time WebSocket updates (v2) |
| Filterable, searchable response table | Multi-tenant organizations (v2) |
| JWT authentication | Audit logs (v2) |

---

## 2. Goals & Success Metrics

### 2.1 Business Goals

- Reduce manual data collection overhead by providing a self-serve form platform.
- Give admins instant, visual insight into collected responses without external BI tools.

### 2.2 Key Performance Indicators (KPIs)

| Metric | Target |
|---|---|
| Form creation time | < 3 minutes for a 10-field form |
| Response submission latency | < 500 ms (p95) |
| Dashboard load time | < 2 seconds for 10,000 responses |
| Auth token refresh reliability | 99.9% success rate |

---

## 3. User Personas

### 3.1 Admin

- **Role:** Creates and manages forms; monitors response data.
- **Technical level:** Non-technical to moderately technical.
- **Primary actions:** Build form → Assign to users → View dashboard → Filter responses.

### 3.2 User (Respondent)

- **Role:** Receives and fills out forms.
- **Technical level:** Non-technical.
- **Primary actions:** Log in → View assigned forms → Submit responses.

---

## 4. Functional Requirements

### 4.1 Authentication Module

| ID | Requirement |
|---|---|
| AUTH-01 | Users register with name, email, and password. |
| AUTH-02 | Login returns a signed JWT access token (15 min expiry) and refresh token (7 days). |
| AUTH-03 | Refresh token endpoint issues a new access token silently. |
| AUTH-04 | Role is embedded in the JWT payload (`role: "admin" \| "user"`). |
| AUTH-05 | Logout invalidates the refresh token server-side. |
| AUTH-06 | Protected routes validate the JWT on every request. |

### 4.2 Admin — Form Builder

| ID | Requirement |
|---|---|
| FORM-01 | Admin can create a new form with a title and description. |
| FORM-02 | Admin can add, reorder, and delete fields in any form. |
| FORM-03 | Supported field types: Text, Textarea, Number, Date, Dropdown (single select), Checkbox (multi-select), Radio (single choice), Rating (1–5 stars), Email. |
| FORM-04 | Each field has: label, placeholder, required toggle, and type-specific options (e.g., choices for dropdown/radio/checkbox). |
| FORM-05 | Admin can save a form as Draft or Publish it. |
| FORM-06 | Admin can assign a published form to specific users or all users. |
| FORM-07 | Admin can edit or delete an existing form. |
| FORM-08 | Admin can set a form deadline (optional). |

### 4.3 User — Form Submission

| ID | Requirement |
|---|---|
| SUB-01 | User sees only forms assigned to them on their dashboard. |
| SUB-02 | User can open a form and fill it out. |
| SUB-03 | Client-side validation enforces required fields and field types before submission. |
| SUB-04 | A submitted form is marked as completed; users cannot resubmit (unless admin enables it). |
| SUB-05 | User can see submission status (Pending / Completed) per form. |

### 4.4 Admin — Analytics Dashboard

| ID | Requirement |
|---|---|
| DASH-01 | Admin selects a form to view its analytics. |
| DASH-02 | Summary cards: Total responses, Completion rate, Average time to complete. |
| DASH-03 | Each field is visualized with an appropriate chart: Bar chart (dropdown/radio/checkbox), Pie chart (boolean/rating), Histogram (number), Word cloud or text list (text/textarea), Timeline (date). |
| DASH-04 | All charts update when a filter is applied. |
| DASH-05 | A response table displays one row per submission with all field values as columns. |
| DASH-06 | Table supports: full-text search, per-column filtering, sortable columns, and pagination. |
| DASH-07 | Filters applied to the table also update the charts. |
| DASH-08 | Admin can export filtered data as CSV. |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | API responses < 300 ms for typical queries. |
| Security | Passwords hashed with bcrypt (salt rounds ≥ 12). JWTs signed with RS256 or HS256 with a strong secret. |
| Availability | Stateless API supports horizontal scaling behind a load balancer. |
| Maintainability | Codebase follows feature-based folder structure; all API routes documented with JSDoc/OpenAPI comments. |
| Accessibility | UI meets WCAG 2.1 AA for contrast and keyboard navigation. |
| Browser Support | Latest two versions of Chrome, Firefox, Safari, Edge. |

---

## 6. User Stories

### Admin Stories

```
AS AN admin
I WANT TO drag-and-drop fields into a form builder
SO THAT I can create structured forms without writing code.

AS AN admin
I WANT TO see a bar chart for every dropdown/radio field
SO THAT I can understand how respondents answered at a glance.

AS AN admin
I WANT TO filter the response table by any field value and date range
SO THAT I can segment and analyze specific user groups.

AS AN admin
I WANT TO export the filtered table to CSV
SO THAT I can share data with stakeholders outside the app.
```

### User Stories

```
AS A user
I WANT TO see a list of forms assigned to me
SO THAT I know what I need to complete.

AS A user
I WANT TO be warned about required fields before submission
SO THAT my submission is not rejected.

AS A user
I WANT TO see a confirmation screen after submitting
SO THAT I know my response was recorded.
```

---

## 7. System Architecture

### 7.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│                                                                  │
│   Next.js App Router  ──  React Components  ──  Zustand Store   │
│         │                                              │         │
│   Auth Pages      Admin Pages         User Pages      │         │
│  /login /register  /admin/forms       /user/forms      │         │
│                    /admin/dashboard                    │         │
└────────────────────────────┬─────────────────────────-┘         │
                             │ HTTPS / REST                        │
                             ▼                                     │
┌──────────────────────────────────────────────────────────────────┐
│                     Next.js API Routes (Backend)                 │
│                                                                  │
│  Route Handlers in /app/api/                                     │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  /auth   │  │  /forms  │  │/responses│  │   /analytics   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
│                                                                  │
│  Middleware: JWT Verification → Role Guard → Request Handler     │
└────────────────────────────┬─────────────────────────────────────┘
                             │ Mongoose ODM
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                         MongoDB Atlas                            │
│                                                                  │
│  Collections:  users │ forms │ responses │ refreshTokens         │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Deployment Architecture

```
Internet → CDN (Vercel Edge) → Next.js (Vercel Serverless)
                                        │
                               MongoDB Atlas (Cloud)
```

---

## 8. Database Design

### 8.1 Collection: `users`

```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique, indexed)",
  "passwordHash": "string",
  "role": "enum: ['admin', 'user']",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Indexes:** `{ email: 1 }` unique

---

### 8.2 Collection: `refreshTokens`

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "token": "string (hashed, indexed)",
  "expiresAt": "Date",
  "createdAt": "Date"
}
```

**Indexes:** `{ token: 1 }`, `{ expiresAt: 1 }` TTL index for auto-expiry

---

### 8.3 Collection: `forms`

```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string",
  "createdBy": "ObjectId (ref: users)",
  "status": "enum: ['draft', 'published']",
  "assignedTo": ["ObjectId (ref: users)"] ,
  "allowResubmission": "boolean (default: false)",
  "deadline": "Date | null",
  "fields": [
    {
      "fieldId": "string (uuid)",
      "type": "enum: ['text','textarea','number','date','dropdown','checkbox','radio','rating','email']",
      "label": "string",
      "placeholder": "string",
      "required": "boolean",
      "order": "number",
      "options": ["string"]
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Indexes:** `{ createdBy: 1 }`, `{ status: 1 }`, `{ assignedTo: 1 }`

---

### 8.4 Collection: `responses`

```json
{
  "_id": "ObjectId",
  "formId": "ObjectId (ref: forms)",
  "userId": "ObjectId (ref: users)",
  "submittedAt": "Date",
  "completionTimeSeconds": "number",
  "answers": [
    {
      "fieldId": "string",
      "label": "string",
      "value": "string | number | string[]"
    }
  ]
}
```

**Indexes:** `{ formId: 1 }`, `{ userId: 1 }`, `{ formId: 1, userId: 1 }` unique (unless resubmission enabled), `{ submittedAt: 1 }`

---

### 8.5 Entity Relationship Diagram

```
users ──(creates)──► forms ──(has many)──► responses
  │                    │                       │
  └──(assigned to)─────┘        └──(submitted by)── users
```

---

## 9. API Design

### Base URL: `/api/v1`

### 9.1 Auth Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login, returns tokens |
| POST | `/auth/refresh` | Public (refresh token) | Issue new access token |
| POST | `/auth/logout` | Bearer | Invalidate refresh token |
| GET | `/auth/me` | Bearer | Get current user profile |

**POST /auth/login — Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "_id": "...",
    "name": "John",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

---

### 9.2 Form Routes (Admin only except GET assigned)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/forms` | Admin | Create new form |
| GET | `/forms` | Admin | List all forms (admin's) |
| GET | `/forms/:id` | Bearer | Get single form |
| PUT | `/forms/:id` | Admin | Update form |
| DELETE | `/forms/:id` | Admin | Delete form |
| PATCH | `/forms/:id/publish` | Admin | Publish a draft form |
| POST | `/forms/:id/assign` | Admin | Assign form to users |

---

### 9.3 Response Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/responses` | User | Submit a response |
| GET | `/responses/my` | User | Get user's own submissions |
| GET | `/responses/form/:formId` | Admin | Get all responses for a form |
| GET | `/responses/form/:formId/analytics` | Admin | Aggregated analytics per field |

**GET /responses/form/:formId — Query Parameters:**
```
?page=1
&limit=25
&search=john
&sortBy=submittedAt
&sortOrder=desc
&filter[fieldId_abc]=optionValue
&from=2024-01-01
&to=2024-12-31
```

---

### 9.4 User Management (Admin)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | Admin | List all users |
| PATCH | `/users/:id/role` | Admin | Change user role |

---

### 9.5 Analytics Response Schema

```json
{
  "formId": "...",
  "totalResponses": 142,
  "completionRate": 0.87,
  "avgCompletionTime": 183,
  "fields": [
    {
      "fieldId": "uuid-1",
      "label": "What is your age group?",
      "type": "radio",
      "aggregation": {
        "18-24": 34,
        "25-34": 61,
        "35-44": 28,
        "45+": 19
      }
    },
    {
      "fieldId": "uuid-2",
      "label": "Satisfaction score",
      "type": "rating",
      "aggregation": {
        "1": 5, "2": 8, "3": 22, "4": 55, "5": 52
      }
    }
  ]
}
```

---

## 10. Authentication & Authorization

### 10.1 JWT Strategy

```
Access Token:
  - Payload: { userId, email, role }
  - Expiry: 15 minutes
  - Stored: Memory (React state / Zustand) — NOT localStorage

Refresh Token:
  - Payload: { userId, tokenId }
  - Expiry: 7 days
  - Stored: HttpOnly secure cookie
  - Server-side: Hashed token stored in refreshTokens collection
```

### 10.2 Middleware Flow

```
Incoming Request
      │
      ▼
Extract Bearer token from Authorization header
      │
      ├─ Missing/expired ──► 401 Unauthorized
      │
      ▼
Verify JWT signature (jsonwebtoken.verify)
      │
      ▼
Attach decoded payload to req.user
      │
      ▼
Role Guard (if route requires specific role)
      │
      ├─ Role mismatch ──► 403 Forbidden
      │
      ▼
Route Handler
```

### 10.3 Next.js Middleware (middleware.ts)

```typescript
// Protects all /api/* and /admin/* routes
// Pattern:
// /admin/* → role must be "admin"
// /user/*  → role must be "user" or "admin"
// /api/forms POST/PUT/DELETE → role must be "admin"
// /api/responses POST → role must be "user"
```

### 10.4 Role Matrix

| Action | Admin | User |
|---|---|---|
| Create/Edit/Delete form | ✅ | ❌ |
| View all responses | ✅ | ❌ |
| View analytics dashboard | ✅ | ❌ |
| Submit a response | ❌ | ✅ |
| View own submissions | ❌ | ✅ |
| View assigned forms | ✅ | ✅ |

---

## 11. Frontend Architecture

### 11.1 Routing Structure (Next.js App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
│
├── (admin)/
│   ├── layout.tsx              ← AdminLayout with sidebar
│   ├── dashboard/page.tsx      ← Overview + form list
│   ├── forms/
│   │   ├── page.tsx            ← All forms list
│   │   ├── new/page.tsx        ← Form builder
│   │   └── [id]/
│   │       ├── edit/page.tsx   ← Edit form builder
│   │       └── analytics/page.tsx ← Analytics dashboard
│   └── users/page.tsx          ← Manage users
│
├── (user)/
│   ├── layout.tsx              ← UserLayout
│   ├── dashboard/page.tsx      ← Assigned forms list
│   └── forms/
│       ├── [id]/page.tsx       ← Fill out form
│       └── [id]/submitted/page.tsx ← Confirmation
│
└── api/
    ├── auth/
    │   ├── register/route.ts
    │   ├── login/route.ts
    │   ├── refresh/route.ts
    │   ├── logout/route.ts
    │   └── me/route.ts
    ├── forms/
    │   ├── route.ts
    │   └── [id]/
    │       ├── route.ts
    │       ├── publish/route.ts
    │       └── assign/route.ts
    ├── responses/
    │   ├── route.ts
    │   ├── my/route.ts
    │   └── form/[formId]/
    │       ├── route.ts
    │       └── analytics/route.ts
    └── users/
        └── route.ts
```

### 11.2 State Management (Zustand)

```typescript
// authStore
{
  user: User | null,
  accessToken: string | null,
  login: (credentials) => Promise<void>,
  logout: () => void,
  refreshAccessToken: () => Promise<void>
}

// formBuilderStore
{
  fields: Field[],
  addField: (type: FieldType) => void,
  updateField: (id, updates) => void,
  removeField: (id) => void,
  reorderFields: (fromIndex, toIndex) => void
}

// dashboardStore
{
  selectedFormId: string | null,
  filters: FilterState,
  searchQuery: string,
  setFilter: (fieldId, value) => void,
  clearFilters: () => void
}
```

### 11.3 Data Fetching Strategy

- **Server Components** for initial page loads (forms list, analytics)
- **TanStack Query (React Query)** for client-side data that needs refetching (live dashboard, paginated tables)
- Axios instance with interceptor for automatic token refresh on 401

---

## 12. Data Flow Diagrams

### 12.1 Form Submission Flow

```
User fills form (React state)
        │
        ▼
Client validation (Zod schema)
        │
        ├─ Fails → Show inline errors
        │
        ▼
POST /api/responses
        │
        ▼
JWT Middleware verifies token
        │
        ▼
Check: form assigned to this user?
Check: already submitted? (if no resubmission)
        │
        ├─ Fails → 400 / 409 error
        │
        ▼
Save Response document to MongoDB
        │
        ▼
Return 201 → Redirect to /forms/:id/submitted
```

### 12.2 Dashboard Filter Flow

```
Admin changes filter / search
        │
        ▼
Update dashboardStore (Zustand)
        │
        ▼
TanStack Query re-fetches with new params:
  GET /responses/form/:id?search=...&filter[x]=y
        │
        ▼
MongoDB:
  1. Text search on answers
  2. Match filter conditions
  3. Aggregate field stats from filtered set
        │
        ▼
Returns: { rows: [...], analytics: {...} }
        │
        ├─ Table renders with new rows
        └─ Charts re-render with filtered analytics
```

### 12.3 Token Refresh Flow

```
API call made with access token
        │
        ▼
Server returns 401 (token expired)
        │
        ▼
Axios interceptor catches 401
        │
        ▼
POST /api/auth/refresh (sends HttpOnly cookie)
        │
        ├─ Success → Update accessToken in Zustand → Retry original request
        └─ Failure → Clear auth state → Redirect to /login
```

---

## 13. Component Breakdown

### 13.1 Form Builder Components

```
<FormBuilder>
  ├── <FormMetaEditor>          (title, description, deadline)
  ├── <FieldList>               (drag-and-drop with dnd-kit)
  │   └── <FieldCard>           (per field, shows label + type)
  │       └── <FieldEditor>     (inline edit panel)
  │           ├── <FieldTypeSelector>
  │           ├── <OptionsEditor>  (for dropdown/radio/checkbox)
  │           └── <RequiredToggle>
  ├── <AddFieldButton>          (type picker popover)
  └── <FormActions>             (Save Draft / Publish)
```

### 13.2 Analytics Dashboard Components

```
<AnalyticsDashboard>
  ├── <SummaryCards>             (Total, Completion Rate, Avg Time)
  ├── <FilterBar>
  │   ├── <SearchInput>
  │   ├── <DateRangePicker>
  │   └── <FieldFilterChips>
  ├── <ChartsGrid>
  │   ├── <BarChartWidget>       (dropdown/radio/checkbox fields)
  │   ├── <PieChartWidget>       (rating fields)
  │   ├── <HistogramWidget>      (number fields)
  │   └── <TextResponseList>     (text/textarea fields)
  └── <ResponseTable>
      ├── <TableHeader>          (sortable columns)
      ├── <TableBody>            (paginated rows)
      └── <Pagination>
```

### 13.3 User Form Components

```
<FormView>
  ├── <FormHeader>               (title, description, deadline warning)
  ├── <FormField> (rendered per field type)
  │   ├── <TextField>
  │   ├── <TextareaField>
  │   ├── <NumberField>
  │   ├── <DateField>
  │   ├── <DropdownField>
  │   ├── <CheckboxGroupField>
  │   ├── <RadioGroupField>
  │   ├── <RatingField>
  │   └── <EmailField>
  └── <SubmitButton>
```

---

## 14. Project Structure

```
project-root/
├── app/
│   ├── (auth)/
│   ├── (admin)/
│   ├── (user)/
│   ├── api/
│   └── layout.tsx
│
├── components/
│   ├── ui/                      ← shadcn/ui primitives
│   ├── forms/                   ← Form builder components
│   ├── dashboard/               ← Analytics components
│   ├── charts/                  ← Recharts wrappers
│   └── shared/                  ← Navbar, Sidebar, etc.
│
├── lib/
│   ├── db.ts                    ← MongoDB connection (mongoose)
│   ├── auth.ts                  ← JWT sign/verify helpers
│   ├── middleware.ts             ← Auth + role middleware factories
│   └── validations/             ← Zod schemas
│
├── models/
│   ├── User.ts
│   ├── Form.ts
│   ├── Response.ts
│   └── RefreshToken.ts
│
├── store/
│   ├── authStore.ts
│   ├── formBuilderStore.ts
│   └── dashboardStore.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── useForms.ts
│   └── useAnalytics.ts
│
├── types/
│   └── index.ts
│
├── .env.local
├── middleware.ts                ← Next.js edge middleware
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 15. Tech Stack Summary

| Layer | Technology | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack, SSR, API routes in one repo |
| Language | TypeScript | Type safety across frontend + backend |
| Database | MongoDB Atlas + Mongoose | Flexible schema for dynamic form fields |
| Auth | JSON Web Tokens (jsonwebtoken) | Stateless, role-embeddable, scalable |
| State Management | Zustand | Lightweight, minimal boilerplate |
| Data Fetching | TanStack Query (React Query) | Caching, pagination, optimistic updates |
| UI Library | shadcn/ui + Tailwind CSS | Accessible, customizable, modern |
| Charts | Recharts | Composable, React-native chart library |
| Drag & Drop | dnd-kit | Accessible, performant drag-and-drop |
| Form Validation | Zod + React Hook Form | End-to-end schema validation |
| Password Hashing | bcryptjs | Industry-standard hashing |
| HTTP Client | Axios | Interceptors for token refresh |
| CSV Export | Papa Parse | Client-side CSV generation |

---

## 16. Implementation Roadmap

### Phase 1 — Foundation (Week 1–2)

- [ ] Set up Next.js project with TypeScript + Tailwind + shadcn/ui
- [ ] Configure MongoDB connection and Mongoose models
- [ ] Implement register, login, logout, refresh token API routes
- [ ] Build login/register pages with form validation
- [ ] Implement Next.js middleware for route protection
- [ ] Role-based layout shells (AdminLayout, UserLayout)

### Phase 2 — Form Builder (Week 3–4)

- [ ] Form Builder page with drag-and-drop field ordering (dnd-kit)
- [ ] All 9 field types with their config panels
- [ ] Save as Draft / Publish functionality
- [ ] Assign form to users (multi-select)
- [ ] Admin: Forms list with status and actions

### Phase 3 — User Submission (Week 5)

- [ ] User dashboard with assigned forms list + status
- [ ] Dynamic form renderer (maps field types to components)
- [ ] Client-side validation with Zod
- [ ] Submit response API + duplicate prevention
- [ ] Submission confirmation screen

### Phase 4 — Analytics Dashboard (Week 6–7)

- [ ] Response table with search, sort, filter, pagination
- [ ] Analytics API with MongoDB aggregation pipelines
- [ ] Chart components per field type (Recharts)
- [ ] Filter bar that syncs table + charts
- [ ] Summary stat cards
- [ ] CSV export of filtered data

### Phase 5 — Polish & QA (Week 8)

- [ ] Mobile responsiveness audit
- [ ] Error boundary and empty state handling
- [ ] Loading skeletons for all async states
- [ ] Security review (rate limiting, input sanitization)
- [ ] End-to-end testing with Playwright
- [ ] Deployment to Vercel + MongoDB Atlas

---

## 17. Security Considerations

| Concern | Mitigation |
|---|---|
| JWT secret leak | Store in environment variable; rotate periodically |
| Token theft (XSS) | Access token in memory only; refresh token in HttpOnly cookie |
| CSRF on refresh | Validate Origin header; use SameSite=Strict on cookie |
| Brute-force login | Rate limit `/api/auth/login` (e.g., 5 attempts / 15 min) |
| MongoDB injection | Mongoose ODM sanitizes inputs; validate all IDs are valid ObjectIds |
| Privilege escalation | Role checked server-side on every protected route |
| Sensitive data exposure | Never return passwordHash in API responses |
| Admin data isolation | Every admin query scoped to `createdBy: req.user.userId` |

---

## 18. Scalability Considerations

### 18.1 Database

- **Indexes** on `formId`, `userId`, `submittedAt` in `responses` collection ensure fast dashboard queries even with millions of rows.
- Use **MongoDB Aggregation Pipeline** for analytics (server-side grouping) rather than fetching all documents to the app server.
- Consider **caching analytics results** in Redis (e.g., 60-second TTL) for high-traffic forms.

### 18.2 API

- Next.js API routes are **stateless** — horizontal scaling via Vercel serverless is automatic.
- Refresh token lookup uses a **hashed token** as the lookup key (indexed), not the raw JWT.

### 18.3 Frontend

- TanStack Query handles **pagination and caching** to avoid re-fetching unchanged data.
- Charts only re-render when their data changes (memoized with `useMemo`).
- Large response tables use **virtual scrolling** (e.g., TanStack Table + Virtual) for 10,000+ rows.

---

*Document Version: 1.0*
*Last Updated: April 2026*
*Author: System Design Team*