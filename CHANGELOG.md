# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.3.9](https://github.com/DhairyaSehgal07/neel-inventory-mgmt-module/compare/v0.3.8...v0.3.9) (2026-03-02)

### Changed

* **Fabrics table** – First column shows Fabric Code instead of ID. Pagination: default page size 50, "Rows per page" selector (10, 50, 100) and clearer "Showing X to Y of Z fabrics" in the footer.
* **Single-fabric PDF** – Larger font sizes for fabric code, labels, values, and status badge; label "FABRIC LENGTH" shortened to "LENGTH" for layout.

### [0.3.8](https://github.com/DhairyaSehgal07/neel-inventory-mgmt-module/compare/v0.3.7...v0.3.8) (2026-03-02)

### Changed

* **Fabric code format** – Fabric codes now include fabric id and sequence for uniqueness: format is `{id}-{typeName}-{strengthName}-{widthValue}-{vendor}-{sequence}-{dateStr}`. Create flow uses a temporary code on insert, then updates with the final fabric code and product URL after the record exists.

### [0.3.7](https://github.com/DhairyaSehgal07/neel-inventory-mgmt-module/compare/v0.3.6...v0.3.7) (2026-02-24)

### Features

* **Assign fabric** – Optional `assignTo` field on Fabric model. Assign-fabric dialog on fabric detail page: select process (e.g. Calendaring 1–4, Rejection, Trading) and POST `/api/fabrics/[id]/assign`. Requires FABRIC_UPDATE.
* **Update fabric balance** – Update-balance dialog on fabric detail page: set closing balance (quantity). POST `/api/fabrics/[id]/update-fabric-quantity` updates `fabricLengthCurrent` and sets status to OPEN if quantity > 0, CLOSED if 0. Requires FABRIC_UPDATE.

### Changed

* **Fabric detail** – Assign fabric and Update balance actions on fabric detail page.
* **Fabrics list** – Columns and filters updated for assign/balance flows.

### Fixed

* **Update fabric quantity API** – Zod 4: use `message` for `z.coerce.number()` validation (replaced `required_error` / `invalid_type_error`).

### [0.3.6](https://github.com/DhairyaSehgal07/neel-inventory-mgmt-module/compare/v0.3.5...v0.3.6) (2026-02-24)

### Features

* **Single-fabric PDF** – New `Single-Fabric-Roll-Pdf` component using `@react-pdf/renderer`: generates A4 PDF with QR code (product URL) and fabric code for a fabric roll. `getSingleFabricPdfBlob()` builds the PDF client-side for download or print.
* **Print fabric** – Fabrics table row actions: added Print button (Printer icon) that opens the single-fabric PDF in a new tab. Row actions refactored into `FabricRowActions` with tooltips (View, Print, Edit, Delete) and loading state while generating PDF.

### Changed

* **Fabric form labels** – New fabric form: Width label "Width (m)" → "Width (cm)"; GSM labels "GSM (observed)" → "GSM (observed Kg)", "GSM (calculated)" → "GSM (calculated Kg)".
* **Dependencies** – Added `@react-pdf/renderer` for PDF generation.

### [0.3.5](https://github.com/DhairyaSehgal07/neel-inventory-mgmt-module/compare/v0.3.4...v0.3.5) (2026-02-24)

### Features

* **Badge component** – New `Badge` UI component (shadcn-style) for status and labels.

### Changed

* **Fabric type/strength forms** – First-letter capitalisation on name fields in settings forms (fabric type, fabric strength).

### [0.3.4](///compare/v0.3.3...v0.3.4) (2026-02-24)

### Features

* **Fabric status** – Added optional `status` field to Fabric model. New fabrics are created with status "READY TO USE". Status is shown in the fabrics list table and on the fabric detail page.
* **Fabrics list order** – GET /api/fabrics now returns fabrics sorted by id ascending (oldest to latest); list page displays in that order.
* **Belt code frequency** – Fabric/belt code frequency in generated codes now starts from 1 (was 0) for both create and update.
* **Truncate fabrics script** – New `pnpm run truncate-fabrics` script and `scripts/truncate-fabrics.ts` to truncate the fabrics table and restart identity.

### Changed

* **Fabric width in API** – Create and update fabric APIs now use `fabricWidthValue` only (find-or-create by value); removed `fabricWidthId` from schema and routes.
* **Fabric schema** – Create fabric schema uses `fabricWidthValue`; PATCH resolves width by value and find-or-create.

### [0.3.3](///compare/v0.3.2...v0.3.3) (2026-02-13)

### Features

* **Fabrics list** – New `/fabrics` page with shadcn + TanStack table: search, pagination, view (eye), edit, delete. GET /api/fabrics to list fabrics; PATCH/DELETE /api/fabrics/[id] for update and delete.
* **Fabric detail** – Detail page at `/fabrics/[id]` with product info and fabric code; back link to list.
* **Fabric edit** – Edit page at `/fabrics/[id]/edit` with form and PATCH integration.
* **Fabric code in detail** – Fabric code shown in fabric detail view.
* **QR code URL** – New fabrics get `qrCode` pointing to `/fabrics/[id]` (was `/products/[id]`). Add-fabric form and dashboard link to `/fabrics/new`; redirect to `/fabrics/[id]` after create.

### Removed

* **Products detail** – Removed `/products/[id]` page in favor of `/fabrics/[id]`.
* **Serial number column** – Removed S.No column from fabrics table; ID column serves as identifier.

### [0.3.2](///compare/v0.3.1...v0.3.2) (2026-02-08)

### Features

* **Fabric code** – Backend-generated `fabricCode` on fabric create (format: fabricType-fabricStrength-fabricWidth-supplier-netWeight-date). Added `fabricCode` and `fabricDate` to Prisma Fabric model.
* **Fabric types settings** – Full CRUD with API integration: list (GET), create (POST), update (PATCH), delete (DELETE). Data table with search, pagination, loaders (Spinner), toasts (Sonner), error state with retry. Form with Zod validation and first-letter capitalisation before submit. Delete confirmation via AlertDialog.
* **Fabric strengths settings** – Full CRUD page: table, form, API integration, loaders, toasts, error handling, AlertDialog delete confirmation. First-letter capitalisation on strength name in form.
* **Fabric widths settings** – Full CRUD page: table, form (numeric value), API integration, loaders, toasts, error handling, AlertDialog delete confirmation.
* **Toaster** – Sonner Toaster added to app Providers (richColors, top-right, closeButton) for global toast notifications.
* **Add Fabric form** – Fabric type, strength, and width dropdowns fetch options from `/api/fabric-types`, `/api/fabric-strengths`, and `/api/fabric-widths`. Loading state and disabled selects while fetching; error toasts on failed load.

### Changed

* **Delete confirmation** – Replaced native `confirm()` with AlertDialog on fabric types, strengths, and widths settings pages.
* **Fabric API** – POST create now validates and resolves type/strength/width, generates `fabricCode`, and persists `fabricDate`.

### [0.3.1](///compare/v0.3.0...v0.3.1) (2026-02-07)


### Features

* add Fabric model and CRUD APIs for fabric type, strength, width 2784f22

## [0.3.0] - 2026-02-04

### Features

* **Route group (main-app)** – App routes moved under `(main-app)` route group; dashboard, fabric, raw-materials, and settings live under shared layout
* **Fabric forms** – New and edit fabric forms (`components/forms/fabric/new`, `components/forms/fabric/edit`) with full create/update flows
* **Raw materials form** – New raw materials form (`components/forms/raw-materials/new`) for creating raw materials
* **Client-only wrapper** – `ClientOnly` component for hydrating client-only UI (e.g. forms, toasts)
* **UI components** – Added alert-dialog, calendar, input-group, item, popover, sonner (toast), textarea

### Changed

* **Sidebar** – `app-sidebar` updated for new route structure and navigation
* **Dashboard** – Dashboard component and page updated for (main-app) layout
* **Button** – Button component adjustments

### Removed

* **Legacy dashboard routes** – Removed `src/app/dashboard/` (layout, page, settings) in favor of `(main-app)/dashboard` and `(main-app)/settings`

## [0.2.0] - 2026-02-04

### Features

* **Users API** – REST endpoints for user management with RBAC:
  * `GET /api/users` – List users (requires `USER_VIEW`)
  * `POST /api/users` – Create user (requires `USER_CREATE`)
  * `GET /api/users/[id]` – Get user by ID (requires `USER_VIEW`)
  * `PATCH /api/users/[id]` – Update user (requires `USER_UPDATE`)
  * `DELETE /api/users/[id]` – Delete user (requires `USER_DELETE`)
* **User schema** – Zod schemas for create/update user validation (`createUserSchema`, `updateUserSchema`)
* **User API response** – Shared `toUserResponse` helper and API response types in `lib/api/user-response`
* **RBAC exports** – Central RBAC exports from `lib/rbac` (permissions, helpers, `withRBAC`, `withRBACParams`, role defaults)
* **Role defaults** – `DEFAULT_PERMISSIONS_BY_ROLE` and `getDefaultPermissionsForRole()` for seeding and new user creation
* **Permissions** – Extended permission set (user management, compound master/batch, rating, dashboard, reports)

### Changed

* **NextAuth types** – Extended session and user types in `next-auth.d.ts`
* **Seed** – Prisma seed updated to use RBAC permissions and shared patterns
* **RBAC permissions** – Permission groups and enum aligned with role defaults

## [0.1.0] - 2026-01-24

### Initial Release

* Initial project setup with Next.js 16
* Authentication system with NextAuth
* Dashboard layout with sidebar navigation
* Prisma database setup and configuration
* PostgreSQL database integration
* RBAC (Role-Based Access Control) system
* UI components with Radix UI and Tailwind CSS
* Commit conventions and changelog system
* Husky hooks for git workflow
