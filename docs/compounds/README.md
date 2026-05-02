# Compound module

This document describes how the **compound** feature works end to end: database fields, validation (Zod), HTTP APIs, UI surfaces, permissions, and the weight / status lifecycle.

Compounds represent **batch records** for compound inventory: production metadata, calendaring assignment, and tracked weight (produced, consumed, remaining).

---

## 1. Data model (Prisma)

### `Compound` (`compounds` table)

| Field | Type | Meaning |
|-------|------|---------|
| `id` | `Int` | Primary key (auto-increment). |
| `compoundCode` | `String` | Unique business identifier for the batch. |
| `dateOfProduction` | `DateTime` | Production date. |
| `createdBy` | `String` | Who registered the batch (free text from the form). |
| `compoundName` | `String` | Display name of the compound. |
| `batch` | `String` | Batch / lot label. |
| `assignTo` | `String?` | Calendaring line or disposition label; cleared when status is **REJECTED** or **TRADED**, and cleared when balance update sets **PACKED**. |
| `batchCount` | `Float` | Number of batches; used with `weightPerBatchKg` to derive total produced weight. |
| `weightPerBatchKg` | `Float` | Kilograms per batch. |
| `totalWeightProducedKg` | `Float` | Total produced weight. Application rule: **`batchCount × weightPerBatchKg`** (optional explicit `totalWeightProducedKg` on create must match within tolerance). |
| `weightConsumedKg` | `Float` | Cumulative consumed weight (kg); default `0` on create. |
| `weightRemainingKg` | `Float` | **`totalWeightProducedKg − weightConsumedKg`** (maintained by the app; clamped to ≥ 0 where applicable). |
| `location` | `String` | Storage / site label. |
| `status` | `CompoundStatus?` | Workflow state (see below). |
| `createdAt` / `updatedAt` | `DateTime` | Audit timestamps. |

**Relation:** `history` → `CompoundHistory[]` (cascade delete with compound).

### `CompoundStatus`

| Value | Typical meaning in this app |
|-------|------------------------------|
| `IN_USE` | After assigning to a calendaring line (not rejection/trading). |
| `PACKED` | After “Update balance” when remaining quantity **> 0**. |
| `ASSIGNED` | Enum exists for schema consistency; assignment flow sets `IN_USE` for calendaring lines. |
| `CONSUMED` | After balance update when remaining quantity **=== 0**. |
| `TRADED` | Assign action chose **Trading**; `assignTo` cleared. |
| `REJECTED` | Assign action chose **Rejection**; `assignTo` cleared. |

### `CompoundHistory` (`compound_histories`)

Each row logs an action performed by a user (`performedById` → `User`).

| Field | Usage |
|-------|--------|
| `actionType` | `ASSIGN`, `BALANCE_UPDATE`, or `STATUS_CHANGE` (UI can render all; APIs currently create **ASSIGN** and **BALANCE_UPDATE**). |
| `assignToBefore` / `assignToAfter` | Snapshot for assign flows. |
| `statusBefore` / `statusAfter` | Status before and after the action. |
| `assignedQtyKg`, `assignedMachinery`, `beltNumber` | **ASSIGN:** machinery mapping uses calendaring label → `CAL_1`…`CAL_4`; qty set to remaining weight for normal calendaring assign. |
| `weightRemainingBeforeKg` / `After`, `weightConsumedBeforeKg` / `After` | **BALANCE_UPDATE:** weights before/after the closing balance update. |

### `CompoundMachinery`

Maps calendaring labels **Calendaring 1–4** to `CAL_1` … `CAL_4` in history (rejection/trading do not set machinery).

---

## 2. Validation (Zod) — `src/schemas/compoundSchema.ts`

Shared shapes for create and update:

- **`createCompoundSchema`**
  - Required strings (trimmed, non-empty): `compoundCode`, `dateOfProduction` (ISO string), `createdBy`, `compoundName`, `batch`, `location`.
  - `batchCount`: positive number.
  - `weightPerBatchKg`: ≥ 0.
  - `totalWeightProducedKg`: optional; if sent, must equal `batchCount × weightPerBatchKg` (enforced again in the API with a small float tolerance).
  - `weightConsumedKg`: optional, default `0`, ≥ 0.
  - `status`: optional nullable native enum `CompoundStatus`.

- **`updateCompoundSchema`**
  - Same fields as partial (any subset allowed).
  - API rejects empty PATCH bodies (“No fields to update”).

Route-specific Zod (not in `compoundSchema.ts`):

- **Assign:** `{ assignTo: string (min length 1) }` — must be one of the UI options (server interprets **Rejection**, **Trading**, **Calendaring 1–4**).
- **Update quantity / balance:** `{ quantity: non-negative number }` — interpreted as **closing remaining kg** (see API section).

---

## 3. Weight rules (server)

Implemented in `POST /api/compounds` and `PATCH /api/compounds/[id]`:

1. **Computed total:** `batchCount × weightPerBatchKg`.
2. If the client sends `totalWeightProducedKg`, it must match the computed total within **`1e-6`** tolerance.
3. **`weightRemainingKg = totalWeightProducedKg - weightConsumedKg`**, with validation that consumed does not exceed total; remaining is stored with **`Math.max(0, …)`** where the API applies the clamp.

Create additionally runs this logic once; PATCH merges partial updates with the existing row, then recomputes total/remaining when batch or weight fields change.

---

## 4. HTTP API

All compound batch routes are wrapped with **RBAC** (`withRBAC`). Typical permissions:

| Permission | Use |
|------------|-----|
| `COMPOUND_BATCH_VIEW` | List / get one compound. |
| `COMPOUND_BATCH_CREATE` | Create compound. |
| `COMPOUND_BATCH_UPDATE` | PATCH compound, assign, update balance. |
| `COMPOUND_BATCH_DELETE` | DELETE compound. |

(Separate **compound_master:**\* permissions exist in `permissions.ts` for other master-data flows; batch APIs use **compound_batch:**\*.)

### `GET /api/compounds`

- Returns all compounds ordered by `dateOfProduction` descending.
- Includes `_count.history` only (not full history).

### `POST /api/compounds`

- Body must satisfy `createCompoundSchema`.
- Persists computed `totalWeightProducedKg` and `weightRemainingKg`.
- Unique `compoundCode` → **409** with a clear message.

### `GET /api/compounds/[id]`

- Full compound plus **`history`** (newest first), each history row includes `performedBy` (id, name, mobileNumber, role).

### `PATCH /api/compounds/[id]`

- Partial `updateCompoundSchema`; recomputes totals when `batchCount`, `weightPerBatchKg`, or `totalWeightProducedKg` participate in the update logic.
- Does **not** append history rows by itself (history is from assign / balance endpoints).

### `DELETE /api/compounds/[id]`

- Deletes compound; histories cascade.

### `POST /api/compounds/[id]/assign`

- Requires session user id for `performedById`.
- **`assignTo`** values:
  - **Calendaring 1–4:** sets `assignTo` to that string, `status` → **`IN_USE`**, writes **`ASSIGN`** history with `assignedQtyKg` = current `weightRemainingKg`, `assignedMachinery` = `CAL_1`…`CAL_4`.
  - **Rejection:** `status` → **`REJECTED`**, `assignTo` → `null`.
  - **Trading:** `status` → **`TRADED`**, `assignTo` → `null`.

### `POST /api/compounds/[id]/update-compound-quantity`

- Body: `{ quantity }` = **closing remaining weight (kg)**.
- `quantity` must be ≤ `totalWeightProducedKg`.
- Sets `weightRemainingKg = quantity`, `weightConsumedKg = totalWeightProducedKg - quantity`.
- If `quantity > 0`: `status` → **`PACKED`**, and **`assignTo`** is cleared.
- If `quantity === 0`: `status` → **`CONSUMED`**.
- Appends **`BALANCE_UPDATE`** history with before/after weights and status.

### `GET /api/compounds/[id]/qrcode`

- Public PNG QR for the compound detail URL (uses `NEXT_PUBLIC_API_URL` / app base + `/compounds/[id]`).
- Used on the detail page for scanning.

---

## 5. UI flow (App Router)

| Path | Role |
|------|------|
| `/compounds` | Client page: loads list from `GET /api/compounds`, search/filter, status tabs, links to new/edit/detail, delete via `DELETE`. |
| `/compounds/new` | **CompoundNewForm** → `POST /api/compounds`. |
| `/compounds/[id]` | Server-rendered detail: facts, QR, **Assign Compound** and **Update Balance** dialogs when status is not REJECTED/TRADED and (for balance) when assigned. |
| `/compounds/[id]/edit` | Loads `GET /api/compounds/[id]`, **CompoundEditForm** → `PATCH`. |
| `/settings/compounds` | Placeholder settings shell. |
| `/analytics/compounds` | Placeholder for future charts. |

**List columns** (`columns.tsx`): code, name, batch, dates, weights, location, status, history count, actions (view, print/PDF, edit, delete).

**Search** (`search-utils.ts`): matches code and name (and any fields wired in that util).

**Status badge colors** (`utils.ts`): `getCompoundStatusBadgeVariant` maps status → UI badge variant.

---

## 6. End-to-end lifecycle (conceptual)

1. **Create** a compound with production and batch info; system stores total and remaining from batch math (and optional initial consumed).
2. **Assign** to a calendaring line (or mark traded/rejected); history records the assignment and machinery when applicable.
3. **Update balance** after use: user enters **remaining kg**; system sets consumed = produced − remaining, sets **PACKED** or **CONSUMED**, clears assignee when packed.
4. **Edit** master-style fields via PATCH without necessarily touching history (unless assign/balance APIs run).
5. **Delete** removes the compound and its history.

---

## 7. File map (reference)

| Area | Main files |
|------|------------|
| Schema (DB) | `prisma/schema.prisma` (`Compound`, `CompoundHistory`, enums) |
| Zod | `src/schemas/compoundSchema.ts` |
| APIs | `src/app/api/compounds/route.ts`, `[id]/route.ts`, `[id]/assign/route.ts`, `[id]/update-compound-quantity/route.ts`, `[id]/qrcode/route.ts` |
| List / table | `src/app/(main-app)/compounds/page.tsx`, `data-table.tsx`, `columns.tsx`, `search-utils.ts`, `utils.ts` |
| Detail / dialogs | `src/app/(main-app)/compounds/[id]/page.tsx`, `assign-compound-dialog.tsx`, `update-compound-balance-dialog.tsx` |
| Forms | `src/components/forms/compound/new/index.tsx`, `edit/index.tsx` |
| PDF | `src/components/pdf/Single-Compound-Pdf.tsx` |

---

## 8. Operational notes

- After Prisma schema changes, run **`npx prisma generate`** (the assign route checks that `compoundHistory` exists on the client).
- Float weights use a tiny tolerance for “equals” checks; prefer consistent decimal entry in forms for predictable totals.

If you extend the module (e.g. **`STATUS_CHANGE`** history rows or **belt number** on assign), document new fields here and keep Zod + Prisma in sync.
