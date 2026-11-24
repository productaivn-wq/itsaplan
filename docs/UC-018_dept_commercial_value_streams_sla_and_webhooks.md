# Use Case Specification: UC-018 — Phòng Kinh Doanh — Portfolio Client Delivery SLA, Value-Stream Dashboards & Outbound Webhooks/API

`[CANARY:AGENTS.md:GOVERNED]` · **Version**: 2.1.0 · **Status**: ACTIVE (`53.ACT.500`) · **Effective**: 2026-11-09  
`Implements: UC-018, SPEC-53.ACT.500, UC-010`  
`Traces: FR-068, FR-053, FR-059, FR-060`  
`Verifies: TC-UC018-01..TC-UC018-04`  
`Governing Reference: 30_REFERENCE/53.REF.112 (Use-Case 3.0 Definitive Guide & Slicing Standard), 30_REFERENCE/53.REF.07 (Two-Tier UTOP Taxonomy)`

---

## 1. Use-Case 3.0 Identification & Dual Lifecycle State Card

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-018` |
| **Title** | Phòng Kinh Doanh — Portfolio Client Delivery SLA, Value-Stream Dashboards & Outbound Webhooks/API |
| **Department Room** | `Kinh Doanh` (`zone_id = 'commercial'`) |
| **Primary Actor** | `@research` (`Market/CRM Intelligence`), `@orchestrator` (`Delivery SLA`), and `HUM` Product Owner |
| **Goal** | Track external client and commercial project delivery across the 30-project portfolio (`MHR`, `MISA`, `JH`, `ASM`, `VER`, `CANH`, `ALM`), monitor milestone SLA health, and link directly to `Dashboards`, `Initiatives`, `Webhooks`, and `API Docs`. |
| **Scope** | System (`apps/itsaplan` — `PixelOfficeCanvas.tsx`, `OpenOfficeWorkspaceView.tsx`, `OpenOfficeContractEngine`, & PostgreSQL `ITSAPLAN_DB_URL`: `itsaplan.project`, `itsaplan.issue` (`due_date`, `priority`), `itsaplan.initiative`, `itsaplan.webhook`) |
| **Level** | 🌊 User Goal |
| **UC Lifecycle State** | `All Flows Fulfilled` (`Goal Established` → `Flow Structure Understood` → `Basic Flow Enabled` → `Sufficient Flows Fulfilled` → `All Flows Fulfilled`) |
| **Slice Lifecycle State** | `Verified` (`Identified` → `Defined` → `Analyzed` → `Prepared` → `Implemented` → `Verified`) |

---

## 2. Phase 0 Story & Slice Splitting Decision (`53.REF.112 §5`)

- **Applied Splitting Pattern**: **Pattern 1 (Workflow Steps: Department Floorplan Click → Live Project-Filtered Telemetry → Departmental Action Dispatch → Cross-Module Portal Navigation)** & **Pattern 3 (Business Rule Variations: Single-Project Filter vs. 30-Project Portfolio Scope & Fail-Closed Governance Guards)**.
- **Slicing Meta-Pattern Rationale**: Separates truthful PostgreSQL department telemetry (`UC-018.S01`), departmental task execution & doorway routing (`UC-018.S02`), and verified cross-module ItsAPlan deep-linking & fail-closed guards (`UC-018.S03`).

---

## 3. Preconditions & Testable Guarantees

### Preconditions
1. PostgreSQL `ITSAPLAN_DB_URL` (`ai_agent`, `project`, `issue`, `agent_run`, `agent_schedule`) and SQLite `OpenOfficeContractEngine` tables are online.
2. Authenticated user opens Open Office (`/{teamRef}/{projectKey}/open-office` or `AI Agents -> Open Office`) with a selected `project_key` (`PM`..30 projects or `ALL`).

### Success Guarantee (Observable Post-Condition)
- Clicking `Kinh Doanh` (`commercial`) opens the live Department Dossier displaying real PostgreSQL-backed KPIs scoped to the active Project Filter, agents currently working in `Kinh Doanh` with `[PROJECT_KEY]` badges, primary CTA (`Theo dõi SLA Dự án Khách hàng & Báo cáo Kinh doanh`), and verified 1-click deep links:
  - **Delivery Dashboards**: `/{teamRef}/{projectKey}/dashboards`
  - **Client Initiatives**: `/{teamRef}/{projectKey}/initiatives`
  - **Outbound Webhooks**: `/{teamRef}/{projectKey}/settings/webhooks`
  - **REST & MCP API Docs**: `/{teamRef}/{projectKey}/api`

### Minimum Guarantee (Failure / Rollback Safety Invariant)
- Zero fake hardcoded agent names or synthetic metrics are ever rendered; any invalid input or unauthorized action fails closed (`P=1`) while keeping the SHA-256 event chain intact.

---

## 4. Flow of Events — Basic Flow

### Basic Flow (Main Success Scenario)
1. Operator clicks `Kinh Doanh` room (`x=88%, y=65%` doorway) on the Virtual Office floorplan or filters to a client delivery project (e.g. `MHR`, `MISA`, `ASM`, `VER`, `CANH`).
2. System aggregates open vs. completed `itsaplan.issue` counts, high-priority SLA items, and active automation runs for the selected project or across all 30 portfolio projects.
3. Department Inspector presents commercial delivery KPIs and allows 1-click dispatch of Market/Client Intelligence synthesis tasks.
4. Operator navigates via 1-click portals to `Dashboards`, `Client Initiatives`, `Webhooks`, or `API Docs`.

---

## 5. Alternate & Exception Flows

- **A1 — Overdue High-Priority Client Issue Detected**:
  - *Condition*: Filtered project contains uncompleted `urgent`/`high` issues past `due_date`.
  - *System Response*: `Kinh Doanh` dossier highlights overdue count so operator can immediately dispatch an agent from Open Office.
  - *Traceability*: → `@TC-UC018-S02` (`TC-UC018-03`)
- **A2 — Portfolio-Wide Aggregation Mode (`project_key=ALL`)**:
  - *Condition*: Operator views `Kinh Doanh` under `ALL` 30 projects.
  - *System Response*: System ranks top active projects by open issue & active agent run volume for instant executive triage.
  - *Traceability*: → `@TC-UC018-S03` (`TC-UC018-04`)

---

## 6. Use-Case Slices (`53.REF.112 §3.1 & Principle 10`)

| Slice ID | Slice Name & Delivery Increment Scope | Covered Flows | Slice State | Traceability (`FR` / `TC`) | Priority |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Slice S01** | **`Kinh Doanh` Live Project-Filtered Telemetry & `[PROJECT_KEY]` Attribution** | `Basic Flow (Steps 1–3)` | `Verified` | `FR-068` · `→ TC: TC-UC018-01` (`@TC-UC018-S01`) | `Must-Pass` |
| **Slice S02** | **`Kinh Doanh` Primary Workflow CTA (`Theo dõi SLA Dự án Khách hàng & Báo cáo Kinh doanh`) & Guardrails** | `Basic Flow (Step 4)`, `A1` | `Verified` | `FR-068` · `→ TC: TC-UC018-02, 03` (`@TC-UC018-S02`) | `Must-Pass` |
| **Slice S03** | **`Kinh Doanh` Cross-Module ItsAPlan Portals & Boundary Resilience** | `Basic Flow (Step 5)`, `A2` | `Verified` | `FR-068` · `→ TC: TC-UC018-04` (`@TC-UC018-S03`) | `Must-Pass` |
| **Slice S04** | **DB-Persisted Department Positions, AI Seat Assignments (`open_office_org_governance`), `S7` `10s` Undo & `/agents` `JTBD-4` Parity** | `Department Seat Governance & S7 Undo` | `Active` | `FR-075` · `→ TC: TC-UC010-26..28` (`@TC-UC010-S09`) | `Must-Pass` |
