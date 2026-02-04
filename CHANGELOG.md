# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
