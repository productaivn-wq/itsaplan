# Use Case Specification: UC-009 — Autonomous Portfolio Directory Reconciliation, Archive Vault Routing & 7-Horizon Auto-Provisioning

`[CANARY:AGENTS.md:GOVERNED]` · **Version**: 1.0.0 · **Status**: VERIFIED (`53.ACT.321`, `53.ACT.322`) · **Effective**: 2026-10-25  
`Implements: UC-009, UC-001.S04, SPEC-ITSAPLAN-PORTFOLIO-AUTOSYNC-321`  
`Traces: FR-049, FR-050, FR-051, FR-052`  
`Verifies: TC-UC009-01..TC-UC009-12`  
`Governing Reference: 30_REFERENCE/53.REF.112 (Use-Case 3.0 Definitive Guide & Slicing Standard), 53_PROJECT_MANAGEMENT/docs/UC-048`

---

## 1. Use-Case 3.0 Identification & Dual Lifecycle State Card

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-009` |
| **Title** | Autonomous Portfolio Directory Reconciliation, Archive Vault Routing & 7-Horizon Auto-Provisioning |
| **Primary Actor** | External Portfolio Reconciler Daemon (`DET`, $P=1$ — `PortfolioTopologyReconciler` per `53_PM` `UC-048`) / Portfolio Director (`HUM` — Project Owner) |
| **Goal** | Automatically provision, rename-sync, archive, and unarchive `public.project` boards, 5 canonical workflow columns, `project_member` sidebar visibility, and net-new `H1..H7` governance skeletons in ItsAPlan from the workspace portfolio SSOT with `< 2.0s` UI revision invalidation. |
| **Scope** | System (`apps/itsaplan` — `packages/db`, `apps/api/src/modules/projects`, `SyncProvider`, & Bridge CDC) |
| **Level** | 🌊 User Goal |
| **UC Lifecycle State** | `All Flows Fulfilled` (`Goal Established` → `Flow Structure Understood` → `Basic Flow Enabled` → `Sufficient Flows Fulfilled` → `All Flows Fulfilled`) |
| **Slice Lifecycle State** | `Verified` (`Identified` → `Defined` → `Analyzed` → `Prepared` → `Implemented` → `Verified`) |

---

## 2. Phase 0 Story & Slice Splitting Decision (`53.REF.112 §5`)

- **Applied Splitting Pattern**: **Pattern 2 (Operations: Provision / Rename / Archive / Unarchive)** & **Pattern 3 (Business Rule Variations: Net-New Empty Board vs. Existing Populated Board)**.
- **Slicing Meta-Pattern Rationale**: Separates interactive single-project human UI creation (`UC-001.S01..S03`) from continuous deterministic portfolio SSOT reconciliation (`UC-009.S01..S04`), preventing hardcoded allowlists from demoting active projects (such as `ESR` / `55_EUREKA_SCIENTIFIC_RESEARCH`) into `archived_vault` (`team_id = 3`).

---

## 3. Preconditions & Testable Guarantees

### Preconditions
1. PostgreSQL `itsaplan` schema is online with primary workspace team (`team_id = 1`, `slug = 'thanb'`) and archive team (`team_id = 3`, `archived_vault`) provisioned.
2. External `PortfolioTopologyReconciler` (`53_PM` `UC-048`) holds authenticated PostgreSQL or API credentials via `SecretVault` (`FR-018`).

### Success Guarantee (Observable Post-Condition)
- `100%` of active portfolio directories (`status = "active"` in `portfolio_projects_ssot.json`) exist in `public.project` under `team_id = 1` with immutable uppercase `key` (`FR-001`), 5 valid `state_type` columns (`FR-006`), `project_member` (`is_favorite = true, is_hidden = false`), starter `H1..H7` / `T1.1..T7.1` hierarchy when `issue_count == 0`, and incremented `revision.rev` (`projects:<teamId>`) so the ItsAPlan sidebar updates live within `< 2.0s`.
- `100%` of archived portfolio directories (`status = "archived"`) reside non-destructively in `team_id = 3` (`archived_vault`, `is_hidden = true`) with zero deleted issues, subtasks, worklogs, initiatives, cycles, or documents.

### Minimum Guarantee (Failure / Rollback Safety Invariant)
- Any per-project schema or constraint violation rolls back atomically without corrupting sibling `public.project` boards, resetting `next_sequence`, or deleting historical `issue` / `project_member` records.

---

## 4. Flow of Events — Basic Flow

### Basic Flow (Main Success Scenario)
1. **Ingest Portfolio Topology Delta**: System receives the dynamically derived portfolio project set (`active`, `archived`, `renamed`, `newly_discovered`) from `UC-048`.
2. **Idempotent `public.project` Upsert**: System upserts `public.project` by immutable `key` (`FR-001`), setting `next_sequence = 1` strictly on initial `INSERT` and updating `name`, `description`, and `updated_at` on `ON CONFLICT (key) DO UPDATE`.
3. **5-State Workflow Column Verification**: System verifies and idempotently seeds any missing required `state_type` columns (`backlog`, `unstarted`, `started`, `completed`, `canceled`) (`FR-006`).
4. **Team & Sidebar Membership Routing**: For `active` projects, system assigns `team_id = 1` and upserts `project_member` (`role = 'owner'`, `is_favorite = true`, `is_hidden = false`); for `archived` projects, system assigns `team_id = 3` (`archived_vault`) and sets `is_hidden = true` non-destructively.
5. **7-Horizon Starter Seeding (`UC-008` Alignment)**: For net-new active projects with `0` existing issues, system seeds canonical `T1.1..T7.1` / `H1..H7` governance parent structures.
6. **Reactive Sidebar & Board Cache Invalidation**: System bumps `revision.rev` for `projects:1`, `projects:3`, and affected `board:<projectId>` scopes so connected `SyncProvider` clients refresh project navigation without page reload.

---

## 5. Alternate & Exception Flows

- **A1 — Derived Key Collision on Net-New Folder Slug (Step 2)**:
  - *Condition*: Newly discovered folder `NN_<SLUG>` generates a candidate initials key already claimed by another project.
  - *System Response*: Deterministic key allocator appends numeric prefix (`<KEY><NN>`) prior to `INSERT`, preserving `FR-001` global uniqueness.
  - *Traceability*: → `@TC-UC009-S01`
- **A2 — Unarchival from `_archive` Back to Active Workspace (Step 4)**:
  - *Condition*: Previously archived project (`team_id = 3`) reappears as an active directory in `~/workspace`.
  - *System Response*: System moves `public.project.team_id` back to `1`, restores `project_member` (`is_hidden = false, is_favorite = true`), preserves `next_sequence` and all historical issues intact, and bumps `projects:1` revision.
  - *Traceability*: → `@TC-UC009-S02`
- **A3 — Existing Custom Workflow Columns Present (Step 3)**:
  - *Condition*: Project board already contains user-customized columns satisfying all 5 `state_type` values.
  - *System Response*: System preserves existing column names, colors, positions, and WIP limits untouched.
  - *Traceability*: → `@TC-UC009-S01`
- **A4 — Transient Database Lock or Connection Fault (Steps 2–6)**:
  - *Condition*: PostgreSQL transaction encounters serialization/lock timeout.
  - *System Response*: Transaction rolls back cleanly and returns retryable status so `UC-048` retries on the next `60s` hash-gated heartbeat.
  - *Traceability*: → `@TC-UC009-S04`

---

## 6. Use-Case Slices (`53.REF.112 §3.1 & Principle 10`)

| Slice ID | Slice Name & Delivery Increment Scope | Covered Flows | Slice State | Traceability (`FR` / `TC`) | Priority |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Slice S01** | **Idempotent External SSOT `public.project` & 5-Column Auto-Provisioning** | `Basic Flow (Steps 1–3)`, `A1`, `A3` | `Defined` | `FR-049` · `→ TC: TC-UC009-01..03` (`@TC-UC009-S01`) | `Must-Pass` |
| **Slice S02** | **Non-Destructive `archived_vault` Routing & Unarchive Restoration** | `Basic Flow (Step 4)`, `A2` | `Defined` | `FR-050` · `→ TC: TC-UC009-04..06` (`@TC-UC009-S02`) | `Must-Pass` |
| **Slice S03** | **Net-New Project `H1..H7` / `T1.1..T7.1` Governance Skeleton Seeding** | `Basic Flow (Step 5)` | `Defined` | `FR-051` · `→ TC: TC-UC009-07..09` (`@TC-UC009-S03`) | `Should-Pass` |
| **Slice S04** | **Sidebar Project-Catalog `revision.rev` Invalidation (`projects:<teamId>`)** | `Basic Flow (Step 6)`, `A4` | `Defined` | `FR-052` · `→ TC: TC-UC009-10..12` (`@TC-UC009-S04`) | `Must-Pass` |

---

## 7. Revision History
- **2026-10-25 (`53.ACT.321`)**: Version 1.0.0 — Authored missing Use Case 3.0 specification following multi-kit root-cause audit (`DataAnalysisKit`, `EngineeringForensicsKit`, `BusinessAnalyticsKit`).
