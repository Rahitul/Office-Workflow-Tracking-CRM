# iomdaily

Next.js 16 (App Router), React 19, MongoDB (mongoose 9), Tailwind v4, Zod 4, Zustand 5, Recharts, Leaflet.
`@/*` → `./*`.

## Commands
- `npm run build` — `output: "standalone"`; TS errors fail build. `npx tsc --noEmit` for faster check.
- `npm run lint` — ESLint 9 flat config (`eslint.config.mjs`). **Slow (minutes) and currently surfaces pre-existing `@typescript-eslint/no-explicit-any` errors** (e.g. in `app/service/machine-list/page.tsx`) — lint only changed files via `npx eslint <paths>` for fast feedback; don't "fix" unrelated pre-existing errors.
- `npm run dev` — auto-port.
- Ad-hoc tests (`test-api.js`, `test-admin.js`, `test-full.js`) — `node` against a running server on port **4001** (standalone/prod). The dev server runs on port 3000 — point test scripts at the right port.

## Auth & Middleware
- Middleware is `proxy.ts` (not `middleware.ts`); Next.js 16 loads it anyway. Every page/API route path must be registered in its role's array inside `proxy.ts`.
- `proxy.ts` has its own inline **sync** `verifyAccessToken` (separate from the **async** one in `lib/auth.ts`).
- Per-handler auth in API routes: `const cookieStore = await cookies()` then `await verifyAccessToken(token)` from `lib/auth.ts`. Client-side: `checkAuth()` in layout `useEffect`.
- JWT access 7d, refresh 30d (hashed via `RefreshToken` model; rotation on refresh).
- Login redirects in `app/login/page.tsx` — all 26 roles mapped to their default route.
- `apiBranchPaths` = admin-only; `apiEsbdPaths` = esbd/service/admin; `apiAccountsPaths` = accounts/admin; `apiAllAuthPaths` = any authenticated role.
- **Some API routes are NOT in `proxy.ts` path arrays** (e.g. `/api/kpi-targets`, `/api/kpi-targets/*`, `/api/static-form/*`, `/api/images/*`) — they bypass middleware auth and rely solely on per-handler `verifyAccessToken`. If adding a new API route, decide whether to add it to `proxy.ts` or let handler-level auth suffice.
- All proxy matching is `pathname.startsWith(path)` — a listed path automatically covers its sub-routes (e.g. `/api/project-tender` also matches `/api/project-tender/xyz`). `apiAllAuthPaths` only checks authentication, not role — per-handler role whitelists are the real gate.
- Root `app/page.tsx` simply redirects to `/login`.

## Role Union — 4 Files Must Stay in Sync
`TokenPayload` in `proxy.ts` + `lib/auth.ts`; `UserRole` in `types/index.ts` + `models/User.ts`. Adding/changing a role: update all 4 + `proxy.ts` path arrays + layout navItems + login redirect + model `enum`.

## Routing
- New page route for non-branch roles → register in BOTH `proxy.ts` AND `app/{role}/layout.tsx` `navItems`.
- New page route for branch roles → register in `proxy.ts` AND `components/branch-layout.tsx` `navItems` (branch layouts delegate to shared `BranchLayout` component).
- `[id]` API routes: `params: Promise<{ id: string }>` — must `await params`. The destructured key must match the folder name (e.g. `app/api/card/[machineId]/route.ts` → `{ params }: { params: Promise<{ machineId: string }> }`), else the Next.js-generated `.next/dev/types/validator.ts` type-check fails.
- 10 branch role apps (`app/branch_*/tracking/page.tsx`) share `@/components/branch-tracking-page`.
- `manage-quotation` routes for `service`, `service_juniors`, `esbd`, `esbd_juniors`, `branch_manager`, `branch_manager_juniors`.
- `machine-list` routes for `service`, `service_juniors`, `esbd`, `esbd_juniors` (juniors show info tab only).
- `project-tender` routes for `admin` (custom page), plus `user`/`user_juniors`/`consumable`/`consumable_juniors`/`service`/`service_juniors`/`esbd`/`esbd_juniors` (shared `@/components/project-tender-page`).
- KPI dashboards: `user`/`user_juniors` use `@/components/kpi-dashboard-sales-view`; `consumable`/`consumable_juniors` use `@/components/kpi-dashboard-consumable-view`.
- `consumable`/`consumable_juniors` daily-activity page (`daily-activity/page.tsx`) is duplicated inline across both roles — edit both in parallel.

## Models (Mongoose 9)
- **Hot-reload** (25 of the 44 model files, incl. `ProjectTender`, `DropdownOption`, `EngineerInfo`): `delete mongoose.models.<Name>` before `mongoose.model()`. Others (incl. `Machine`, `ServiceHistory`, `LeadTransfer`) cache via `mongoose.models.<Name> || mongoose.model(...)` — edits need server restart.
- `new mongoose.Types.ObjectId(string)` — never plain strings.
- `.populate()` needs ObjectId ref type. TS quirk: after `.populate("userId", "name")`, TS still sees `ObjectId` — cast `t.userId as any` to access `.name`.
- `connectDB()` in `lib/db.ts`: global singleton — call once per API route.
- **Field clash**: `model` conflicts with `Document.model()` (TS2611) — renamed to `deviceModel` in `ServiceTask.ts`.
- **Branch model** has `users: ObjectId[]` — dual reference with `User.branch`. Creating/removing a branch user updates both.
- Compound unique indexes: `{ branchId, userId, month, year }` on branch target models.

## Checklist Photos
- Captured via `components/checklist-form.tsx` camera → base64 → `POST /api/upload` → saved to `D:\iomdailychecklistedphotos\{timestamp}-{uuid}.{ext}` on server disk → URL `/api/images/{filename}` stored in `Checklist.image` field.
- `GET /api/images/[name]` reads from disk and returns the file with proper Content-Type.
- `image` field in the Checklist model is a plain string (stores the URL path). No changes needed to the model or `/api/checklists` route.

## Camera Gotchas (`checklist-form.tsx`)
- `<video>` **must have `muted`** attribute — Chrome blocks unmuted autoplay even for camera streams.
- **Do not** assign `videoRef.current.srcObject` synchronously after `getUserMedia()` — the video element isn't in the DOM yet because `setCameraActive(true)` only schedules a re-render. Instead, save the stream in `streamRef.current` and assign `srcObject` in a `useEffect` that depends on `cameraActive`.
- `facingMode: "environment"` fails on laptops (no rear camera). Always use a fallback chain: `"environment"` → `"user"` → no constraint.

## Machine List / Service Card (`service` + `esbd`)
- Page `app/service/machine-list/page.tsx` = three tabs (Form + Machine info + Machine list) in one component. Detail page `app/service/machine-list/[id]/page.tsx` duplicates the info-card + warranty + service-history UI — **keep both in sync** when editing.
- **Auto machine ID**: `getNextMachineId()` in `/api/machines` route — max numeric `machineId` in DB + 1 (regex `/^\d+$/`), NOT `countDocuments()`, so deleted rows don't repeat IDs. GET returns `{ machines, nextId }`; POST sets `machineId: String(nextId)`.
- Machine model is **cached** (schema edits need server restart). `machineId` is a plain `String`, not a number.
- **Machine info tab shows a details card, not a table** (table moved to a separate Machine list tab). Its filter card has only **3 fields (ID, Customer, Serial No)**; `selectedMachine` = `filteredMachines[0]` when ANY of the 8 filter states is non-empty, else `machines[0]` (newest, since GET sorts `createdAt: -1`) — so all filters actually drive the displayed machine. No match → empty state. The **Machine list tab** keeps the **full 8-filter card (ID/Customer/Serial No as plain inputs; Brand/Model/Product Category/Department/Location as editable `<input list>` datalist dropdowns populated from `filterBrandOptions`/`filterModelOptions`/`filterProductCategoryOptions`/`filterDepartmentOptions`/`filterLocationOptions` — distinct non-empty DB values derived client-side from the loaded `machines` array, alphabetical)** PLUS a free-text search; the 14-column table renders `displayedMachines` = `filteredMachines` (all 8 filters, each case-insensitive substring match) further narrowed by `machineListSearch` across customerName/machineId/brandName/modelName/serialNumber/location/department; clicking a row sets `filterMachineId` to its `machineId` and switches to the Machine info tab.
- **ID filter field auto-focuses on Machine info tab open** and accepts **digits only** (`onChange` strips `\D`, `inputMode="numeric"`).
- **Machine info card** is compact: outer `p-4`, grid `gap-2`, white info boxes `min-h-[32px]` / `px-2.5 py-1.5`, labels `text-xs mb-0.5`.
- **Warranty Period** is a separate card (`mt-4` gap from info card) with conditional background: `bg-green-50 border-green-200` when active, `bg-red-50 border-red-200` when expired. Headings match the card color. Same `dayDiff()` + `formatPeriod()` display; Active/Expired badge on Days Remaining field.
- **Service History** is per-machine (`/api/machines/[id]/service-history`): GET populates `engineerId` with `name email`; POST requires `callDate` + `engineerId`. `ewTaka` falsy/"0" → stored as string `"Not Applicable"`. List page fetches records whenever `selectedMachine._id` changes; both pages have the same Add dialog (engineer search filtered to `service`/`service_juniors`/`esbd_juniors`).
- **Add Service History dialog fields** (both pages): Call Date, E/W Taka, BW Meter Reading, Color Meter Reading, Scan Meter Reading, read-only Total = BW + Color, Printer Head Life (KM), Attend/End time, Problem, Solution, User Comments, Engineer. `copyBW`/`printBW` were REMOVED from the form but still exist in the model (default `0`) for old-record backward compat; POST computes `total = bwMeterReading + colorMeterReading`. Table columns are Date/Engineer/Problem/Solution/E-W/BW Meter/Color Meter/Scan Meter/Total/Printer Head Life/Attend/End/Comments.
- API roles: `/api/machines`, `/api/machines/[id]`, `/api/machines/[id]/service-history`, `/api/machines/[id]/share-link` all allow `service` + `esbd` + `admin` + `service_juniors` + `esbd_juniors`.

## Machine List / Service Card — Juniors (`esbd_juniors` + `service_juniors`)
- Pages `app/esbd_juniors/machine-list/page.tsx` and `app/service_juniors/machine-list/page.tsx` show **Machine info tab only** (no Form or Machine list tabs). Detail pages `[id]/page.tsx` show the same info-card + warranty + service-history UI.
- **Auto-select engineer**: when the Add Service History dialog opens, the logged-in user is pre-selected as engineer (if their ID matches the fetched engineers list). This applies both on initial users fetch and on dialog open.
- These pages do NOT fetch brands, dropdowns, or companies (dead code removed). They only fetch `/api/machines`, `/api/users`, and service-history.
- Nav items registered in both layouts and `proxy.ts` (`esbdJuniorsPaths` + `serviceJuniorsPaths`).
- **Compact card styling** matches the `service`/`esbd` pages: `p-4` outer padding, `gap-2` grids, `min-h-[32px]` info boxes, `text-xs mb-0.5` labels.

## Engineer's Info (creates login accounts)
- Page `app/service/engineer-info/page.tsx`; `app/esbd/engineer-info/page.tsx` re-exports it (single-file edit covers both). API `/api/engineer-info` (+ `[id]`) sits in `proxy.ts` `apiAllAuthPaths`; both handlers whitelist roles `service`/`esbd`/`admin`.
- The Add tab **creates a real User account** (login-able), not just an info record: POST body is `{ name, email, password, role, designation, nationalId, mobileNumber, altMobileNumber, presentAddress, permanentAddress, joiningDate, bloodGroup, image }`. Server validates min-6 password + role against `ENGINEER_ROLES` (`service`, `service_juniors`, `esbd`, `esbd_juniors`, `branch_service`, `branch_service_juniors` — prevents creating admin accounts), rejects duplicate emails (409, plus a code-11000 catch), bcrypt-hashes (12 rounds), creates the `User`, then links `EngineerInfo.engineerId`. The old `engineerId` selection and `?view=eligible` GET are gone.
- PATCH `/api/engineer-info/[id]` updates info fields AND the linked account: whitelists `name`, `email` (duplicate-checked excluding this user), optional `password` (bcrypt-hashed only when non-empty; blank = keep current). Role is NOT changeable after creation.
- Edit-mode UI: Name/Email editable + prefilled, Password placeholder "Leave blank to keep current password", Role select disabled showing current role.
- Engineer's List tab has NO sort controls; filters are free-text search (name/mobile/national ID), a Name editable `<input list>` datalist populated from distinct non-empty DB names (alphabetical, same pattern as machine-list filters), and the Designation Select from unique designations.

## Warranty Expiry Email Notifications
- Auto-run daily: `instrumentation.ts` (repo root) calls `runWarrantyCheck()` from `lib/warranty-notifier.ts` on server start + every 24h (PM2 keeps the standalone server up). Manual trigger: `POST /api/warranty-check` (role `service`/`admin`, registered in `proxy.ts` `apiAllAuthPaths`) + "Check Warranty Now" button in the Machine list tab header.
- Window: `warrantyExpired` within **0–15 days from today (UTC)** and `email != ""`. Emails once per machine — `Machine.warrantyNotified` (default `false`) is set `true` only after a successful send; failures retry next run. Query uses `warrantyNotified: { $ne: true }` so pre-flag records (field absent) still match. **Cached model — schema edits need a server restart.**
- Sender: `sendWarrantyExpiryEmail()` in `lib/email.ts` (same nodemailer transporter as `sendTrainingAssignedEmail`), subject `Warranty Expiring Soon: {brand} {model} ({machineId})`; body carries necessary machine info only (machineId, customer, brand, model, serial, product category, department, location, contact, bill date, expiry date, days left).

## Customer Service Card — Shareable Link (no login)
- Customers view their machine/service card via a link with **no login**; the link itself is the credential.
- `Machine.customerShareToken` (string, default `""`) is the per-card secret. **Cached model — the field won't exist until the server restarts**, and Mongoose `strict` mode then silently drops it on `save()`: the copied link appears valid but `GET /api/card/[machineId]` returns 404 "Invalid link". Restarting the server + clicking "Copy Customer Link" again fixes it.
- Generate: `POST /api/machines/[id]/share-link` (`?action=regenerate` rotates the token, invalidating old links). Returns `{ url }` = `<origin>/card/{machineId}?token=...`.
- Public read: `GET /api/card/[machineId]?token=...` validates via `crypto.timingSafeEqual` (SHA-256 of both sides), returns `{ machine, records }` — card fields (via `CARD_FIELDS` whitelist, excludes `customerShareToken`/`createdBy`) + service history populated with engineer.
- Public surface: page `app/card/[machineId]/page.tsx` + route `app/api/card/[machineId]/route.ts` are **NOT registered in `proxy.ts`** — public by design; the handler's token check is the only gate. Customer sees the full info card + warranty + service history (no fields hidden).
- "Copy Customer Link" + "Regenerate" buttons are duplicated on BOTH `app/service/machine-list/page.tsx` (Machine info-tab details-card header) and `[id]/page.tsx` (next to Add Service History) — keep in sync; both use the same `handleCopyLink` + `navigator.clipboard.writeText` pattern.

## Manage Dropdowns (Machine Form Autocomplete Sources)
- `models/DropdownOption.ts` (hot-reload) — `kind` enum `product_category | product_type | model_name | department | option | sla | customer_category | call_type | company_category | quotation_type | designation | problem`; unique index `{ kind, label, parent }`. **No `brand_name` kind** — Brand Name in the machine form still comes from `/api/companies`; don't add a brand_name dropdown. `quotation_type` and `designation` are top-level kinds (no `parent`). `quotation_type` feeds the Quotation Type select in `components/manage-quotation.tsx` (service/esbd/branch_manager).
- API `/api/dropdowns` (+ `[id]`) allows roles `service`/`esbd`/`admin`/`branch_manager`/`branch_manager_juniors` (branch roles needed by the branch_manager task-assign form). GET `?kind=`/`?parent=`; POST requires `parent` for `product_type` AND `model_name`, empty for top-level kinds.
- Page `app/service/manage-dropdowns/page.tsx` = four banded sections: "Service Card Form Dropdowns" (6 cards, 3×2): Product Categories, Product Types (under category), Model Names (under product type), Departments, Options, SLA Values; "Task Assign Form Dropdowns" (3 cards): Customer Categories, Call Types, Problem; "Company List Dropdowns" (1 card): Company Categories; and "Quotation Section" (1 card): Quotation Types. `app/esbd/manage-dropdowns/page.tsx` re-exports it.
- Machine form autocompletes (Department/Model/Option) source suggestions from `/api/dropdowns`, NOT `distinct` on the machines API. Model suggestions filter by `parent === productType`; changing Product Type/Category clears modelName. The `distinct` param still exists in `/api/machines` GET but is unused by the form.
- Task-assign form + Queue filters (`app/service/task-assign/page.tsx`, byte-identical copies `app/branch_manager/task-assign/page.tsx` and `app/esbd/task-assign/page.tsx`) source Customer Category / Call Type / Problem / Department from `/api/dropdowns?kind=customer_category` / `?kind=call_type` / `?kind=problem` / `?kind=department` — **no hardcoded arrays**. Free-text still allowed; empty DB shows "No options found". All four use the searchable dropdown pattern (Search icon + Input + filtered dropdown + clear button + click-outside close).
- Task-assign form also uses **cascading Product Category → Product Type Selects + Model combobox** fed from `product_category` / `product_type` / `model_name` dropdowns (same machine-form pattern: Type filters by `parent === category`, Model suggestions filter by `parent === type`). Stored on `ServiceTask.productCategory` / `productType` (schema `default: ""`, **not required** so old tasks re-save safely). `ServiceTask` is a **cached** model — schema edits need a server restart.
- **UI label convention**: All user-facing text in task-assign pages uses "Call/Case" (not "Task") — tabs are "Call/Case Queue" / "Assign Call/Case" / "Call/Case List", headings say "Call/Case Assign", alerts say "Failed to assign call/case", etc. The file paths remain `task-assign/`.

## Quotation Status Transitions
- Initial: `"Pending"`. Dropdown available while Pending or `"Follow Up N"`.
- "Follow Up" → stored as `"Follow Up N"` (N = `followUpAt.length + 1`). Appends date to `followUpAt: [Date]` array. `followUpLogs` subdocs store `{ date, userId, userName, remarks }`.
- Terminal statuses (`Approved`, `Cancelled`, `Revised`, `Lost`) set a timestamp field (`approvedAt`, etc.) and remove the dropdown.
- "Lost" optionally stores `lostRemarks` string. "Approved" shows Bill Date input; after bill date, a "Bill Completed" tag appears.
- Amount is editable in the list view unless status is `"Approved"`. PATCH `/api/quotations/[id]` must include `amount` in `updateData`.
- Quotation has both `engineerName` (string) and `engineer` (optional ObjectId ref). The service branch-dashboard API groups by `engineer` (not `createdBy`) for monetary attribution — adding/editing quotations must save the `engineer` ObjectId.

## Quotation Categories & Products
- Quotation model has `category` (`"sales" | "service" | "consumable"`, default `"service"`), `department` (optional string, default `""`, sourced from `/api/dropdowns?kind=department`), and `products: [{ productName, models: [{ modelName, quantity, unitPrice, totalPrice }] }]`.
- POST `/api/quotations` recomputes `amount` from `products` (sum of each model's `totalPrice`) — the client-sent `amount` is overridden when products are present. GET supports `?category=` and `?billable=true` (requires `billDate`).
- Quotation ID: non-service → `${seq}-${Cat}-${year}`; service for branch roles embeds branch name (`${seq}-${branchName}-${Cat}-${year}`), else `${seq}-HO-${Cat}-${year}`.
- POST and GET have DIFFERENT role whitelists in `/api/quotations`: POST excludes `branch_accounts`/`branch_accounts_juniors`, GET includes them.
- Two quotation components (don't mix them up): `components/manage-quotation.tsx` = full create/edit flow with engineer selection + **Department searchable dropdown** (sourced from `/api/dropdowns?kind=department`) + 5-filter list bar (Customer, Department, Engineer, Date Range, Status) + 3-filter total bill bar (Engineer, Department, Date Range) (used by `service`, `esbd`, `branch_manager` manage-quotation pages); `components/manage-quotation-junior.tsx` = list + total-bill with matching filter bars, exports `QuotationsListTab`, accepts `category`/`showAll`/`engineerFilter` (used by `*_juniors` pages, branch apps via `branch-tracking-page.tsx`, and the admin Details tab).
- Quotation Type select in `manage-quotation.tsx` is sourced from `/api/dropdowns?kind=quotation_type` (not hardcoded). The branch-tracking `ProductCreateForm` Quotation Type selects (Sales/Consumable) are separate and still hardcoded via `SALES_TYPE_OPTIONS`/`CONSUMABLE_TYPE_OPTIONS`.
- Per-category UI in `components/branch-tracking-page.tsx`: Sales/Consumable tabs each use `ProductCreateForm` + `QuotationsListTab` + `CategoryTotalBillTab` (all category-prop'd); Service tab uses `<ManageQuotationJunior category="service" />`. Admin branch-tracking Details tab shows per-category lists via `<ManageQuotationJunior showAll category="sales|consumable|service" />`.

## Company List (Quotation Customer Dropdown)
- Quotation create forms fetch `/api/companiesforservice` for customer search. CRUD company-list pages exist for `service`, `esbd`, `branch_manager`, `branch_manager_juniors` — the 4 files are **byte-identical** (MD5-verified): edit `app/service/company-list/page.tsx` once, then copy to the other three.
- The page is a 2-tab layout (`activeTab: "add" | "list"`): Add Company form + per-company cards with hover-reveal Edit/Delete, plus **Export**/**Import** buttons via `exceljs@4.4.0` (`dynamic import("exceljs")` keeps it out of the main client bundle). Import skips companies whose name already exists (server unique index is `{ name, location }`), POSTs each new company to `/api/companiesforservice`, then refetches. **Category** (company-level, optional, default `""`): a `Select` fed from `/api/dropdowns?kind=company_category` in Add + Edit forms, shown as a badge in the list, and exported/imported as the **last Excel column (10)** so old exported files still import correctly.
- The list-tab toolbar has a **searchable category filter** (same custom combobox pattern as the Group filter: `categoryFilter`/`categoryFilterInput`/`categoryFilterDropdownOpen` + a click-outside `ref`), options sourced from the DB dropdowns (`companyCategories`, fetched once from `/api/dropdowns?kind=company_category`) — not hardcoded; exact-match filters `c.category`.
- `CompanyForService.category` (schema `default: ""`, optional — old records unaffected). **Cached model** — schema edits need a dev/prod server restart, else Mongoose strict mode silently drops the field on save.
- `/api/companiesforservice` (+ `groups/` and `[id]/`) are in `proxy.ts` `apiAllAuthPaths` (any authenticated role passes middleware), but EACH handler keeps its own stricter role whitelist — a role missing from the handler list gets 403. Currently allows `service`, `esbd`, `admin`, and all `branch_*` roles; when adding a role, update all 3 handlers.

## Lead Transfer
- **UI duplication**: `app/consumable/lead-transfer/{page,received,sent}` is the MASTER (3-tab Transfer/Received/Sent page + separate received/sent pages). `user`/`service`/`esbd`/`accounts`/`marketing` re-export it via `export { default } from "@/app/consumable/..."`. `app/logistics/lead-transfer/*` is byte-identical to the master (MD5-verified) — edit the master then replicate. The 7 `app/{*_juniors}/lead-transfer/page.tsx` are byte-identical to each other but currently DIVERGE from the master (older `<Suspense>`-wrapped version; the master moved to `useRouter` and dropped `Suspense`) and are untracked in git — sync them manually after editing the master; never patch a single copy.
- All 10 `app/branch_*/lead-transfer/page.tsx` render shared `@/components/branch-lead-transfer` (button UI: Accept/Rejected/Lost + required-remarks prompt; wraps `useSearchParams` in `<Suspense>`).
- `app/admin/lead-transfer/page.tsx` is fully self-contained (status summary cards incl. Lost, status filter, remarks shown on Lost/Rejected cards) — kept in sync manually, no shared component.
- `LeadStatus` = `"Pending" | "Accepted" | "Working" | "Rejected" | "Lost" | "Successfully Closed"`; `remarks?: string` stores Lost/Rejected reasons. Badge colors: Lost = orange, Rejected = red, Successfully Closed = green. Received-tab: selecting Rejected/Lost opens a required-remarks Textarea + Submit/Cancel; other statuses PATCH instantly without remarks.
- `models/LeadTransfer.ts` uses the **cached** pattern (`mongoose.models.LeadTransfer ||`) — schema edits need a dev/prod server restart, else Mongoose `strict` mode silently drops new fields on the stale cached schema.
- API: `/api/lead-transfers` (+ `[id]`) in `proxy.ts` `apiAllAuthPaths` (auth-only). **PATCH has NO per-handler role whitelist** — any authenticated user can change any lead. GET: `?type=received` → `toSalesPerson: userId`, `?type=sent` → `fromUser: userId`, no type → all leads (admin). POST creates a `Notification` (`type: "lead_transfer"`) for the recipient.

## Project / Tender
- 8 role apps (`user`, `user_juniors`, `consumable`, `consumable_juniors`, `service`, `service_juniors`, `esbd`, `esbd_juniors`) share `@/components/project-tender-page`; admin uses its own `app/admin/project-tender/page.tsx`. **The admin page re-implements the detail popup, filters, and status timeline independently — keep both in sync when editing project-tender UI.**
- Form fields: `category` (7-option dropdown: Machine, Consumable, Solution, Machine + Consumable, Machine + Solution, Consumable + Solution, All), `address`, `locationDistrict` (editable `<input list>` of all 64 Bangladesh districts), `tentativeCloseDate`. **Required**: category, locationDistrict, tentativeCloseDate (address optional).
- `PROJECT_TENDER_CATEGORIES` + `BANGLADESH_DISTRICTS` live in `lib/project-tender-constants.ts` — both pages import from there; don't inline district/category lists.
- **Status tracking**: model has `statusHistory: [{ status, changedAt, byName, remarks }]`. POST seeds `pending`/"Submitted"; PATCH `/api/project-tender/[id]` appends entries on resubmit, admin approve/revise/price-approve/price-revise, and every workflow status change (only when the value actually changes). Actor name resolved server-side from the `User` model (JWT payload has no name). Popups render a chronological "Status Tracking" timeline; records without history fall back to a single entry from `createdAt`.
- `tentativeCloseDate` (like `date` and `billDate`) must be parsed with `Date.UTC()` in POST and PATCH resubmit handlers.
- `/api/project-tender` and `[id]` sit in `proxy.ts` `apiAllAuthPaths` (prefix-matched, auth-only); both route files keep their own `ALLOWED_ROLES` whitelist (9 roles: the 8 shared-app roles + admin).

## Date Handling (MongoDB & Bangladesh Timezone, UTC+6)
- **Never** use `new Date(string)` + `setHours()` — it runs in local/server TZ and shifts the stored date by -6h.
- Always use `Date.UTC()`: `const [y, m, d] = dateStr.split("-").map(Number); new Date(Date.UTC(y, m-1, d))` for start, add `23,59,59,999` for end-of-day.
- Apply this in both API POST handlers (storing `activityDate`) and GET handlers (filter query construction).

## Admin KPI Targets — Bulk Copy
- `app/admin/kpi/page.tsx` has a **"Set target as like previous"** button in the Configure Target card header.
- Clicking fetches the most recent month that has target data (`GET /api/kpi-targets/previous`), opens a modal with all users' targets as editable inputs, then bulk-saves to the currently selected month (`POST /api/kpi-targets/bulk`).
- Order Value and Bill Value fields are read-only (auto-calculated from product-wise inputs).

## Admin KPI — Member Dropdowns (user/user_juniors only)
- `app/admin/kpi/page.tsx` ("Select User" + the "All Members" filter on Existing Targets) and `app/admin/kpi/dashboard/page.tsx` ("Team member") both fetch `GET /api/static-form/users` then **client-side filter to `role === "user" || role === "user_juniors"`** in the fetch handler. The endpoint returns service/consumable/branch roles too — the client filter is what scopes the dropdowns. If the KPI role set changes, update both fetch sites; both pages have `role?: string` on their `User` interface.
- `/api/static-form/users` has **NO auth** — no `proxy.ts` entry and no per-handler token check (fully public). It returns `_id name email role` for a fixed 12-role set (`user|user_juniors|service|service_juniors|consumable|consumable_juniors|branch_sales|branch_sales_juniors|branch_service|branch_service_juniors|branch_consumable|branch_consumable_juniors`), sorted by `name`. Do not add sensitive fields to its `.select()`.
- Contrast: `/api/static-form/activity` GET **is** auth'd and role-scoped — `user`/`user_juniors` callers only ever get their own activities; other roles can pass `?userId=`. Shared by the same consumer set; don't relax that.

## Admin Branch Tracking — Dashboard "All Branches"
- In `app/admin/branch-tracking/page.tsx`, the dashboard filter dropdown includes `"All Branches"` (value `"all"`) as default.
- When `"all"` is selected, the 3 API routes (`/api/branch-dashboard/{sales,service,consumable}`) query users **and targets** across **all branches** by omitting the `branchId` filter.
- Targets are summed across all branches; the warning about no target is suppressed; all users appear in the individual performance section.
- The 3 routes share the same pattern: `if (month && year) { filter = { month, year }; if (branchId && branchId !== "all") filter.branchId = branchId }`.

## Admin KPI Dashboard — Person Filter Gotcha
- The team overview section uses `buildMetrics(activities, target, factor)`. When a specific person is selected (`selectedUser !== "all"`), **both** targets and activities must be filtered to that user — otherwise achieved values show the combined team total against an individual target.

## Budget VS Actual (accounts + admin)
- **Field lists duplicated in 3 files**: `app/accounts/budget-vs-actual-setting/page.tsx`, `app/accounts/budget-vs-actual-submission/page.tsx`, `app/admin/budget-vs-actual-dashboard/page.tsx` each have their own `FIELDS` (dropdown options) and `OUTFLOW_FIELDS` (expense fields counted in Total Outflow/Surplus) arrays. Adding a field = edit BOTH arrays in all 3 files. `field` is a free string in the models (no enum) — no model/API change needed. The admin page is a tab inside `app/admin/accounts-analysis/page.tsx`.
- API routes `/api/budget-actual`, `/api/budget-actual/[id]`, `/api/budget-actual-entries`, `/api/budget-actual-entries/[id]` are **NOT in `proxy.ts`** — handler-level auth only. GET = any authenticated role; POST/PUT/DELETE = `accounts`/`admin` only.
- `BudgetActual` has unique index `{ field, month, year }` — a duplicate POST **overwrites** the amount in place (keeps the original `setByUserId`). Both `BudgetActual` and `BudgetActualEntry` are hot-reload models.
- `POST /api/budget-actual-entries` requires a matching budget first (404 `No budget set for {field} in this month/year`). Entries have **no unique index** — actuals accumulate, so progress = sum of entries for the field+month+year.
- **Deleting a budget does NOT cascade** to its entries; orphaned entries still display because progress/summary match on the entry's own `field`+`month`+`year`, not via `budgetActualId`.
- `budgetAmount` value `0` is rejected by `if (!budgetAmount)` guards on both POST and PUT.
- Summary trio (Total Inflow = `Collection/Fund Inflow` actuals; Total Outflow = `OUTFLOW_FIELDS` actuals; Surplus = Inflow − Outflow) is recomputed client-side in all 3 pages. `Sales` counts toward neither.
- Submission page quirks: the progress-card "Edit" button is **dead code** (sets `editingId = _id + "-budget"` but renders no input/save handler); "Recent Entries" shows the global top-10 by `entryDate`, NOT filtered to the selected month/year. Default `entryDate` uses `new Date().toISOString()` (UTC) — for UTC+6 users it defaults to *yesterday* in the first 6h of the day.

## Tailwind v4
- No `tailwind.config.js` — CSS-first via `@import "tailwindcss"` + `@theme` in `app/globals.css`. PostCSS: `@tailwindcss/postcss` in `postcss.config.mjs`.
- `cn()` in `lib/utils.ts` (clsx + tailwind-merge). UI primitives in `components/ui/` (shadcn-style). `Select` component wraps native `<select>` with custom styling.

## Leaflet
- `leaflet@1.9.4` is a **runtime dependency** (not just `@types/leaflet`) — `location-map.tsx` imports `leaflet/dist/leaflet.css`; removing it breaks `npm run build` ("Can't resolve 'leaflet'").
- Dynamic import: `next/dynamic(() => import("@/components/location-map"), { ssr: false })`.
- `lucide-react` `Map` shadows native `Map()` — import as `MapIcon`.
- Pin markers via `L.divIcon` (CSS circle) avoids Leaflet CDN image failures.

## Deployment
- `next.config.ts`: `output: "standalone"`. Must copy `.next/static` into `.next/standalone/` post-build.
- `deploy.ps1` / `deploy.bat` (local, paths `H:\iomdaily`); `deploy-remote.ps1` / `deploy-remote.bat` (SMB to `\\server\c$`, paths `C:\iomdaily`, `pm2 restart`).
- Server `PM2` cwd is `C:\iomdaily` running `.next/standalone/server.js` on port 4001.
- `ecosystem.config.js` and `lib/email.ts` contain hardcoded secrets — do not commit.
- Hard refresh (Ctrl+Shift+R) post-deploy to clear stale hash cache.

## API Route PATCH Patterns
- When adding a new updatable field to a PATCH handler, you MUST add the corresponding `if (body.X !== undefined) updateData.X = body.X` line — it's easy to forget because each route has its own explicit field-by-field whitelist.
- `/api/quotations/[id]` PATCH: whitelists `amount`, `billDate`, `engineer`, `department`, `status` (with special handling for Follow Up/Approved/Cancelled/Revised/Lost), `lostRemarks`, `followUpUser`, `followUpRemarks`.
- `/api/lead-transfers/[id]` PATCH: NO role whitelist; body is `{ status, ...(remarks !== undefined ? { remarks } : {}) }` — `status` is set unconditionally (unlike the field-by-field whitelist pattern), `remarks` optional.
- `/api/service-tasks/[id]` PATCH: whitelists `status`, `assignedEngineer`, `receivedBy`, `priority`, `department`, `fromLocation`, `toLocation`, `vehicleType`, gap fields, geolocation lat/lng per status, `resetTimestamps`.
- `/api/project-tender/[id]` PATCH: whitelists `resubmit` (full payload reset), admin fields (`adminStatus`, `adminRemarks`, `priceRevision`, `negotiablePriceApproved`), user workflow fields (`status`, `negotiablePrice`, `billNumber`, `billDate`, `lostRemarks`).

## Env Vars
`.env*` gitignored: `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `HOST`, `NODE_ENV`, `SMTP_*`.

## Client-Side Gotchas
- `cookies()` from `next/headers` is async — always `await cookies()`.
- `useSearchParams` requires `<Suspense>` boundary in parent.
- `useState`/`useRef` hooks must be placed at the top of the component before any computed values or function expressions — otherwise Turbopack may throw "Cannot access X before initialization" (TDZ).
- When getting "defined multiple times" errors after editing, clear `.next` cache: `Remove-Item -Recurse -Force ".next"` — stale compiled output can conflict with updated source.

## Misc
- Validation: `react-hook-form` + `@hookform/resolvers` + Zod schemas in `lib/validations/`.
- Auth state: `store/authStore.ts` (Zustand + axios, `withCredentials: true`).
- Migrations in `migrations/`: `node` against running DB.
- `MONGODB-SETUP.md` at root documents MongoDB install and setup.
