# Use Case Specification: UC-013 — Phòng AI-Dev — Autonomous TDD Engineering, Live Run Streaming & Cron Schedule Execution

`[CANARY:AGENTS.md:GOVERNED]` · **Version**: 2.1.0 · **Status**: ACTIVE (`53.ACT.500`) · **Effective**: 2026-11-09  
`Implements: UC-013, SPEC-53.ACT.500, UC-010`  
`Traces: FR-063, FR-053, FR-059, FR-060`  
`Verifies: TC-UC013-01..TC-UC013-04`  
`Governing Reference: 30_REFERENCE/53.REF.112 (Use-Case 3.0 Definitive Guide & Slicing Standard), 30_REFERENCE/53.REF.07 (Two-Tier UTOP Taxonomy)`

---

## 1. Use-Case 3.0 Identification & Dual Lifecycle State Card

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-013` |
| **Title** | Phòng AI-Dev — Autonomous TDD Engineering, Live Run Streaming & Cron Schedule Execution |
| **Department Room** | `AI-Dev` (`zone_id = 'ai_dev'`) |
| **Primary Actor** | `@antigravity` (`Antigravity Agent`), `@claude` (`Claude Cowork Agent`), `@codex` (`Codex Agent`), and `HUM` |
| **Goal** | Execute autonomous coding, bug-fixing, and scheduled automation runs (`itsaplan.agent_run` & `agent_schedule`) across target projects with live step telemetry (`NOW`), queued backlog visibility (`NEXT`), inline Quick Steer, and MCP/Git integration. |
| **Scope** | System (`apps/itsaplan` — `PixelOfficeCanvas.tsx`, `OpenOfficeWorkspaceView.tsx`, `OpenOfficeContractEngine`, & PostgreSQL `ITSAPLAN_DB_URL`: `itsaplan.ai_agent`, `itsaplan.agent_run`, `itsaplan.agent_schedule`, `itsaplan.issue`, `itsaplan.issue_activity`) |
| **Level** | 🌊 User Goal |
| **UC Lifecycle State** | `All Flows Fulfilled` (`Goal Established` → `Flow Structure Understood` → `Basic Flow Enabled` → `Sufficient Flows Fulfilled` → `All Flows Fulfilled`) |
| **Slice Lifecycle State** | `Verified` (`Identified` → `Defined` → `Analyzed` → `Prepared` → `Implemented` → `Verified`) |

---

## 2. Phase 0 Story & Slice Splitting Decision (`53.REF.112 §5`)

- **Applied Splitting Pattern**: **Pattern 1 (Workflow Steps: Department Floorplan Click → Live Project-Filtered Telemetry → Departmental Action Dispatch → Cross-Module Portal Navigation)** & **Pattern 3 (Business Rule Variations: Single-Project Filter vs. 30-Project Portfolio Scope & Fail-Closed Governance Guards)**.
- **Slicing Meta-Pattern Rationale**: Separates truthful PostgreSQL department telemetry (`UC-013.S01`), departmental task execution & doorway routing (`UC-013.S02`), and verified cross-module ItsAPlan deep-linking & fail-closed guards (`UC-013.S03`).

---

## 3. Preconditions & Testable Guarantees

### Preconditions
1. PostgreSQL `ITSAPLAN_DB_URL` (`ai_agent`, `project`, `issue`, `agent_run`, `agent_schedule`) and SQLite `OpenOfficeContractEngine` tables are online.
2. Authenticated user opens Open Office (`/{teamRef}/{projectKey}/open-office` or `AI Agents -> Open Office`) with a selected `project_key` (`PM`..30 projects or `ALL`).

### Success Guarantee (Observable Post-Condition)
- Clicking `AI-Dev` (`ai_dev`) opens the live Department Dossier displaying real PostgreSQL-backed KPIs scoped to the active Project Filter, agents currently working in `AI-Dev` with `[PROJECT_KEY]` badges, primary CTA (`Giao Lập trình TDD / Chạy Việc Kỹ thuật`), and verified 1-click deep links:
  - **Work Items Board**: `/{teamRef}/{projectKey}`
  - **AI Agents Fleet**: `/{teamRef}/{projectKey}/agents`
  - **Automated Schedules**: `/{teamRef}/{projectKey}/agents/schedules`
  - **MCP Server & Tools**: `/{teamRef}/{projectKey}/mcp`

### Minimum Guarantee (Failure / Rollback Safety Invariant)
- Zero fake hardcoded agent names or synthetic metrics are ever rendered; any invalid input or unauthorized action fails closed (`P=1`) while keeping the SHA-256 event chain intact.

---

## 4. Flow of Events — Basic Flow

### Basic Flow (Main Success Scenario)
1. Operator clicks `AI-Dev` room or clicks `@antigravity` / `@claude` / `@codex` sprite to inspect live `Đang làm (NOW)` coding runs and `Sắp làm (NEXT)` cron schedules (`agent_schedule`).
2. Operator dispatches a coding task via 1-Card Delegation (or clicks `Chạy ngay` on a queued project issue).
3. Assigned coding agent walks through the `ai_dev` doorway (`x=84%, y=35%`) to its workstation displaying `💻 Code` micro-badge and `[PROJECT_KEY]` pill.
4. Headless execution worker streams step progression to `issue_activity` and `open_office_event_log`; operator optionally sends an inline Quick Steer (`POST /api/vibe/open-office/steer`).
5. Upon completion, worker attaches deliverable proof and transitions the real `itsaplan.issue` to `Review` / `AWAITING_HITL`, with 1-click links to `Work Items`, `Schedules`, and `MCP`.

---

## 5. Alternate & Exception Flows

- **A1 — Quick Steer on Non-Existent Agent/Contract**:
  - *Condition*: Caller sends empty steer message or invalid target.
  - *System Response*: System rejects with HTTP 400 validation error without corrupting active run state.
  - *Traceability*: → `@TC-UC013-S02` (`TC-UC013-03`)
- **A2 — External Runner Busy on Another Project**:
  - *Condition*: Agent already has pending `agent_run` items on other projects.
  - *System Response*: Inspector surfaces exact `[PROJECT_KEY]` queue order in `Sắp làm (NEXT)` so operator sees full cross-project load.
  - *Traceability*: → `@TC-UC013-S03` (`TC-UC013-04`)

---

## 6. Use-Case Slices (`53.REF.112 §3.1 & Principle 10`)

| Slice ID | Slice Name & Delivery Increment Scope | Covered Flows | Slice State | Traceability (`FR` / `TC`) | Priority |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Slice S01** | **`AI-Dev` Live Project-Filtered Telemetry & `[PROJECT_KEY]` Attribution** | `Basic Flow (Steps 1–3)` | `Verified` | `FR-063` · `→ TC: TC-UC013-01` (`@TC-UC013-S01`) | `Must-Pass` |
| **Slice S02** | **`AI-Dev` Primary Workflow CTA (`Giao Lập trình TDD / Chạy Việc Kỹ thuật`) & Guardrails** | `Basic Flow (Step 4)`, `A1` | `Verified` | `FR-063` · `→ TC: TC-UC013-02, 03` (`@TC-UC013-S02`) | `Must-Pass` |
| **Slice S03** | **`AI-Dev` Cross-Module ItsAPlan Portals & Boundary Resilience** | `Basic Flow (Step 5)`, `A2` | `Verified` | `FR-063` · `→ TC: TC-UC013-04` (`@TC-UC013-S03`) | `Must-Pass` |
| **Slice S04** | **DB-Persisted Department Positions, AI Seat Assignments (`open_office_org_governance`), `S7` `10s` Undo & `/agents` `JTBD-4` Parity** | `Department Seat Governance & S7 Undo` | `Active` | `FR-075` · `→ TC: TC-UC010-26..28` (`@TC-UC010-S09`) | `Must-Pass` |
