# Use Case Specification: UC-011 — Phòng Điều Hành — Portfolio Steering, 30-Project Resource Filter & Tier-2 SoD Governance

`[CANARY:AGENTS.md:GOVERNED]` · **Version**: 2.1.0 · **Status**: ACTIVE (`53.ACT.500`) · **Effective**: 2026-11-09  
`Implements: UC-011, SPEC-53.ACT.500, UC-010`  
`Traces: FR-061, FR-053, FR-059, FR-060`  
`Verifies: TC-UC011-01..TC-UC011-04`  
`Governing Reference: 30_REFERENCE/53.REF.112 (Use-Case 3.0 Definitive Guide & Slicing Standard), 30_REFERENCE/53.REF.07 (Two-Tier UTOP Taxonomy)`

---

## 1. Use-Case 3.0 Identification & Dual Lifecycle State Card

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-011` |
| **Title** | Phòng Điều Hành — Portfolio Steering, 30-Project Resource Filter & Tier-2 SoD Governance |
| **Department Room** | `Phòng Điều Hành` (`zone_id = 'exec_hq'`) |
| **Primary Actor** | Executive Operator (`HUM` — Project Owner) & `@orchestrator` (`Task Orchestrator`) |
| **Goal** | Filter Open Office across all 30 real portfolio projects (`PM`, `JH`, `GSA`, `ASM`, `MHR`, `MISA`, `CANH`, `VER`, etc.), inspect cross-project agent allocation (`[PROJECT_KEY]` badges), steer WBS priorities, and enforce Tier-2 `GW-SOD-01` approval over `Hộp Cần tôi xử lý`. |
| **Scope** | System (`apps/itsaplan` — `PixelOfficeCanvas.tsx`, `OpenOfficeWorkspaceView.tsx`, `OpenOfficeContractEngine`, & PostgreSQL `ITSAPLAN_DB_URL`: `itsaplan.project`, `itsaplan.issue`, `itsaplan.initiative`, `itsaplan.cycle`, `open_office_contracts`, `open_office_event_log`) |
| **Level** | 🌊 User Goal |
| **UC Lifecycle State** | `All Flows Fulfilled` (`Goal Established` → `Flow Structure Understood` → `Basic Flow Enabled` → `Sufficient Flows Fulfilled` → `All Flows Fulfilled`) |
| **Slice Lifecycle State** | `Verified` (`Identified` → `Defined` → `Analyzed` → `Prepared` → `Implemented` → `Verified`) |

---

## 2. Phase 0 Story & Slice Splitting Decision (`53.REF.112 §5`)

- **Applied Splitting Pattern**: **Pattern 1 (Workflow Steps: Department Floorplan Click → Live Project-Filtered Telemetry → Departmental Action Dispatch → Cross-Module Portal Navigation)** & **Pattern 3 (Business Rule Variations: Single-Project Filter vs. 30-Project Portfolio Scope & Fail-Closed Governance Guards)**.
- **Slicing Meta-Pattern Rationale**: Separates truthful PostgreSQL department telemetry (`UC-011.S01`), departmental task execution & doorway routing (`UC-011.S02`), and verified cross-module ItsAPlan deep-linking & fail-closed guards (`UC-011.S03`).

---

## 3. Preconditions & Testable Guarantees

### Preconditions
1. PostgreSQL `ITSAPLAN_DB_URL` (`ai_agent`, `project`, `issue`, `agent_run`, `agent_schedule`) and SQLite `OpenOfficeContractEngine` tables are online.
2. Authenticated user opens Open Office (`/{teamRef}/{projectKey}/open-office` or `AI Agents -> Open Office`) with a selected `project_key` (`PM`..30 projects or `ALL`).

### Success Guarantee (Observable Post-Condition)
- Clicking `Phòng Điều Hành` (`exec_hq`) opens the live Department Dossier displaying real PostgreSQL-backed KPIs scoped to the active Project Filter, agents currently working in `Phòng Điều Hành` with `[PROJECT_KEY]` badges, primary CTA (`Duyệt Hộp Cần tôi xử lý & Điều phối Danh mục`), and verified 1-click deep links:
  - **Initiatives Roadmap**: `/{teamRef}/{projectKey}/initiatives`
  - **Sprint Cycles**: `/{teamRef}/{projectKey}/cycles`
  - **Executive Dashboards**: `/{teamRef}/{projectKey}/dashboards`
  - **Inbox & Approvals**: `/{teamRef}/{projectKey}/inbox`

### Minimum Guarantee (Failure / Rollback Safety Invariant)
- Zero fake hardcoded agent names or synthetic metrics are ever rendered; any invalid input or unauthorized action fails closed (`P=1`) while keeping the SHA-256 event chain intact.

---

## 4. Flow of Events — Basic Flow

### Basic Flow (Main Success Scenario)
1. Operator selects a specific project (e.g. `PM`, `MHR`, `JH`) or `ALL` (`Toàn bộ 30 dự án`) in the top-bar Project Filter (`GET /api/vibe/open-office/state?project_key=...`).
2. System queries real `itsaplan.project`, `issue`, `agent_run`, and `agent_schedule` records in PostgreSQL and projects `[PROJECT_KEY]` badges onto every agent station and roster card.
3. Operator clicks `Phòng Điều Hành` on the 960x560 Virtual Office floorplan to open the Executive Department Inspector (`UC-011`).
4. System displays cross-project active run distribution, `AWAITING_HITL` approval queue (`Hộp Cần tôi xử lý`), and 1-click portals to `Initiatives`, `Cycles`, `Dashboards`, and `Inbox`.
5. Operator approves a verified deliverable (`approver_id != lead_agent_id`, `GW-SOD-01`) or steers project priority; system moves the linked `itsaplan.issue` to `Done` and seals Committed vs. Actual variance.

---

## 5. Alternate & Exception Flows

- **A1 — Self-Approval Violation (`GW-SOD-01`)**:
  - *Condition*: Caller attempts `APPROVE` where `approver_id == lead_agent_id`.
  - *System Response*: System rejects with HTTP 403 `SOD_VIOLATION` and keeps contract in `AWAITING_HITL`.
  - *Traceability*: → `@TC-UC011-S02` (`TC-UC011-03`)
- **A2 — Unknown Project Filter Key**:
  - *Condition*: Caller passes a non-existent `project_key` filter.
  - *System Response*: System safely falls back to empty project-scoped list with zero fake placeholder tasks and preserves valid `projects` selector metadata.
  - *Traceability*: → `@TC-UC011-S03` (`TC-UC011-04`)

---

## 6. Use-Case Slices (`53.REF.112 §3.1 & Principle 10`)

| Slice ID | Slice Name & Delivery Increment Scope | Covered Flows | Slice State | Traceability (`FR` / `TC`) | Priority |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Slice S01** | **`Phòng Điều Hành` Live Project-Filtered Telemetry & `[PROJECT_KEY]` Attribution** | `Basic Flow (Steps 1–3)` | `Verified` | `FR-061` · `→ TC: TC-UC011-01` (`@TC-UC011-S01`) | `Must-Pass` |
| **Slice S02** | **`Phòng Điều Hành` Primary Workflow CTA (`Duyệt Hộp Cần tôi xử lý & Điều phối Danh mục`) & Guardrails** | `Basic Flow (Step 4)`, `A1` | `Verified` | `FR-061` · `→ TC: TC-UC011-02, 03` (`@TC-UC011-S02`) | `Must-Pass` |
| **Slice S03** | **`Phòng Điều Hành` Cross-Module ItsAPlan Portals & Boundary Resilience** | `Basic Flow (Step 5)`, `A2` | `Verified` | `FR-061` · `→ TC: TC-UC011-04` (`@TC-UC011-S03`) | `Must-Pass` |
| **Slice S04** | **DB-Persisted Department Positions, AI Seat Assignments (`open_office_org_governance`), `S7` `10s` Undo & `/agents` `JTBD-4` Parity** | `Department Seat Governance & S7 Undo` | `Active` | `FR-075` · `→ TC: TC-UC010-26..28` (`@TC-UC010-S09`) | `Must-Pass` |
