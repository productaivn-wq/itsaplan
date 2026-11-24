# Use Case Specification: UC-014 — Đại Sảnh Chung — Truthful Standby Lounge, Project Backlog Intake & Instant Idle Agent Dispatch

`[CANARY:AGENTS.md:GOVERNED]` · **Version**: 2.1.0 · **Status**: ACTIVE (`53.ACT.500`) · **Effective**: 2026-11-09  
`Implements: UC-014, SPEC-53.ACT.500, UC-010`  
`Traces: FR-064, FR-053, FR-059, FR-060`  
`Verifies: TC-UC014-01..TC-UC014-04`  
`Governing Reference: 30_REFERENCE/53.REF.112 (Use-Case 3.0 Definitive Guide & Slicing Standard), 30_REFERENCE/53.REF.07 (Two-Tier UTOP Taxonomy)`

---

## 1. Use-Case 3.0 Identification & Dual Lifecycle State Card

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-014` |
| **Title** | Đại Sảnh Chung — Truthful Standby Lounge, Project Backlog Intake & Instant Idle Agent Dispatch |
| **Department Room** | `Đại Sảnh Chung` (`zone_id = 'central_lobby'`) |
| **Primary Actor** | Currently `IDLE` Real Agents, Mascots (`Cậu Vàng` & `Tiểu Thư`), and `HUM` Dispatcher |
| **Goal** | Provide a truthful central plaza where agents with zero active runs visibly relax (with next-schedule countdowns), surface unassigned `Todo`/`Backlog` project issues, and enable 1-click assignment to idle agents. |
| **Scope** | System (`apps/itsaplan` — `PixelOfficeCanvas.tsx`, `OpenOfficeWorkspaceView.tsx`, `OpenOfficeContractEngine`, & PostgreSQL `ITSAPLAN_DB_URL`: `itsaplan.issue` (`Todo`/`Backlog` unassigned), `itsaplan.ai_agent`, `itsaplan.agent_schedule`, `itsaplan.notification`) |
| **Level** | 🌊 User Goal |
| **UC Lifecycle State** | `All Flows Fulfilled` (`Goal Established` → `Flow Structure Understood` → `Basic Flow Enabled` → `Sufficient Flows Fulfilled` → `All Flows Fulfilled`) |
| **Slice Lifecycle State** | `Verified` (`Identified` → `Defined` → `Analyzed` → `Prepared` → `Implemented` → `Verified`) |

---

## 2. Phase 0 Story & Slice Splitting Decision (`53.REF.112 §5`)

- **Applied Splitting Pattern**: **Pattern 1 (Workflow Steps: Department Floorplan Click → Live Project-Filtered Telemetry → Departmental Action Dispatch → Cross-Module Portal Navigation)** & **Pattern 3 (Business Rule Variations: Single-Project Filter vs. 30-Project Portfolio Scope & Fail-Closed Governance Guards)**.
- **Slicing Meta-Pattern Rationale**: Separates truthful PostgreSQL department telemetry (`UC-014.S01`), departmental task execution & doorway routing (`UC-014.S02`), and verified cross-module ItsAPlan deep-linking & fail-closed guards (`UC-014.S03`).

---

## 3. Preconditions & Testable Guarantees

### Preconditions
1. PostgreSQL `ITSAPLAN_DB_URL` (`ai_agent`, `project`, `issue`, `agent_run`, `agent_schedule`) and SQLite `OpenOfficeContractEngine` tables are online.
2. Authenticated user opens Open Office (`/{teamRef}/{projectKey}/open-office` or `AI Agents -> Open Office`) with a selected `project_key` (`PM`..30 projects or `ALL`).

### Success Guarantee (Observable Post-Condition)
- Clicking `Đại Sảnh Chung` (`central_lobby`) opens the live Department Dossier displaying real PostgreSQL-backed KPIs scoped to the active Project Filter, agents currently working in `Đại Sảnh Chung` with `[PROJECT_KEY]` badges, primary CTA (`Giao Việc Tồn đọng cho Agent Đang Rảnh`), and verified 1-click deep links:
  - **Project Inbox**: `/{teamRef}/{projectKey}/inbox`
  - **Unstarted Work Items**: `/{teamRef}/{projectKey}`
  - **Direct 1:1 Agent Chat**: `#shell-chat-panel`
  - **Notification Rules**: `/{teamRef}/{projectKey}/notifications`

### Minimum Guarantee (Failure / Rollback Safety Invariant)
- Zero fake hardcoded agent names or synthetic metrics are ever rendered; any invalid input or unauthorized action fails closed (`P=1`) while keeping the SHA-256 event chain intact.

---

## 4. Flow of Events — Basic Flow

### Basic Flow (Main Success Scenario)
1. When any of the 6 real team agents has zero active `IN_PROGRESS` runs, system places that agent in `Đại Sảnh Chung` (`y=35..65%`) with truthful `IDLE` bubble and next `agent_schedule` time.
2. Mascots `Cậu Vàng` and `Tiểu Thư` display live dynamic bubbles reflecting actual `AWAITING_HITL` review count and active project run count.
3. Operator clicks `Đại Sảnh Chung` to open the Central Intake & Triage Department Inspector (`UC-014`).
4. Inspector lists real unassigned `Todo`/`Backlog` issues for the selected project alongside currently `IDLE` agents.
5. Operator clicks `Giao ngay` on a backlog issue to bind an `IDLE` agent; the agent immediately walks from `Đại Sảnh Chung` through the target department's wooden doorway.

---

## 5. Alternate & Exception Flows

- **A1 — All Agents Currently Busy**:
  - *Condition*: Every real agent has an active run.
  - *System Response*: `Đại Sảnh Chung` displays `0` idle agents truthfully (never inventing fake `CROWD_EXTRA_STATIONS` sprites) and queues new tasks into the selected agent's `NEXT` queue.
  - *Traceability*: → `@TC-UC014-S02` (`TC-UC014-03`)
- **A2 — Zero Unassigned Backlog Issues in Filtered Project**:
  - *Condition*: Selected project has `0` unassigned `Todo` issues.
  - *System Response*: Inspector shows clean zero-backlog state with a 1-click button to create a new Work Item or switch project filter.
  - *Traceability*: → `@TC-UC014-S03` (`TC-UC014-04`)

---

## 6. Use-Case Slices (`53.REF.112 §3.1 & Principle 10`)

| Slice ID | Slice Name & Delivery Increment Scope | Covered Flows | Slice State | Traceability (`FR` / `TC`) | Priority |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Slice S01** | **`Đại Sảnh Chung` Live Project-Filtered Telemetry & `[PROJECT_KEY]` Attribution** | `Basic Flow (Steps 1–3)` | `Verified` | `FR-064` · `→ TC: TC-UC014-01` (`@TC-UC014-S01`) | `Must-Pass` |
| **Slice S02** | **`Đại Sảnh Chung` Primary Workflow CTA (`Giao Việc Tồn đọng cho Agent Đang Rảnh`) & Guardrails** | `Basic Flow (Step 4)`, `A1` | `Verified` | `FR-064` · `→ TC: TC-UC014-02, 03` (`@TC-UC014-S02`) | `Must-Pass` |
| **Slice S03** | **`Đại Sảnh Chung` Cross-Module ItsAPlan Portals & Boundary Resilience** | `Basic Flow (Step 5)`, `A2` | `Verified` | `FR-064` · `→ TC: TC-UC014-04` (`@TC-UC014-S03`) | `Must-Pass` |
| **Slice S04** | **DB-Persisted Department Positions, AI Seat Assignments (`open_office_org_governance`), `S7` `10s` Undo & `/agents` `JTBD-4` Parity** | `Department Seat Governance & S7 Undo` | `Active` | `FR-075` · `→ TC: TC-UC010-26..28` (`@TC-UC010-S09`) | `Must-Pass` |
