# Use Case Specification: UC-016 — Phòng Họp — Multi-Agent Swarm Collaboration, Blocker Escalation & Kara Meeting Action Sync

`[CANARY:AGENTS.md:GOVERNED]` · **Version**: 2.1.0 · **Status**: ACTIVE (`53.ACT.500`) · **Effective**: 2026-11-09  
`Implements: UC-016, SPEC-53.ACT.500, UC-010`  
`Traces: FR-066, FR-053, FR-059, FR-060`  
`Verifies: TC-UC016-01..TC-UC016-04`  
`Governing Reference: 30_REFERENCE/53.REF.112 (Use-Case 3.0 Definitive Guide & Slicing Standard), 30_REFERENCE/53.REF.07 (Two-Tier UTOP Taxonomy)`

---

## 1. Use-Case 3.0 Identification & Dual Lifecycle State Card

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-016` |
| **Title** | Phòng Họp — Multi-Agent Swarm Collaboration, Blocker Escalation & Kara Meeting Action Sync |
| **Department Room** | `Phòng Họp` (`zone_id = 'war_room'`) |
| **Primary Actor** | Multi-Agent Task Teams (`lead_agent` + `support_agent_ids`), `@qualitygate`, and `HUM` Chair |
| **Goal** | Coordinate multi-agent tasks (`>=2` collaborating real agents), host high-priority War Room reviews, and connect Open Office directly with `Kara` Meeting Notes, `Vibe Canvas`, and live Agent Chat. |
| **Scope** | System (`apps/itsaplan` — `PixelOfficeCanvas.tsx`, `OpenOfficeWorkspaceView.tsx`, `OpenOfficeContractEngine`, & PostgreSQL `ITSAPLAN_DB_URL`: `open_office_contracts` (`support_agent_ids`), `itsaplan.issue`, `itsaplan.issue_activity`, `itsaplan.agent_chat_thread`) |
| **Level** | 🌊 User Goal |
| **UC Lifecycle State** | `All Flows Fulfilled` (`Goal Established` → `Flow Structure Understood` → `Basic Flow Enabled` → `Sufficient Flows Fulfilled` → `All Flows Fulfilled`) |
| **Slice Lifecycle State** | `Verified` (`Identified` → `Defined` → `Analyzed` → `Prepared` → `Implemented` → `Verified`) |

---

## 2. Phase 0 Story & Slice Splitting Decision (`53.REF.112 §5`)

- **Applied Splitting Pattern**: **Pattern 1 (Workflow Steps: Department Floorplan Click → Live Project-Filtered Telemetry → Departmental Action Dispatch → Cross-Module Portal Navigation)** & **Pattern 3 (Business Rule Variations: Single-Project Filter vs. 30-Project Portfolio Scope & Fail-Closed Governance Guards)**.
- **Slicing Meta-Pattern Rationale**: Separates truthful PostgreSQL department telemetry (`UC-016.S01`), departmental task execution & doorway routing (`UC-016.S02`), and verified cross-module ItsAPlan deep-linking & fail-closed guards (`UC-016.S03`).

---

## 3. Preconditions & Testable Guarantees

### Preconditions
1. PostgreSQL `ITSAPLAN_DB_URL` (`ai_agent`, `project`, `issue`, `agent_run`, `agent_schedule`) and SQLite `OpenOfficeContractEngine` tables are online.
2. Authenticated user opens Open Office (`/{teamRef}/{projectKey}/open-office` or `AI Agents -> Open Office`) with a selected `project_key` (`PM`..30 projects or `ALL`).

### Success Guarantee (Observable Post-Condition)
- Clicking `Phòng Họp` (`war_room`) opens the live Department Dossier displaying real PostgreSQL-backed KPIs scoped to the active Project Filter, agents currently working in `Phòng Họp` with `[PROJECT_KEY]` badges, primary CTA (`Triệu tập Nhóm Đa Agent (Phòng Họp)`), and verified 1-click deep links:
  - **Notes & Kara Meetings**: `/{teamRef}/{projectKey}/notes`
  - **Vibe Collaborative Canvas**: `/{teamRef}/{projectKey}/vibe`
  - **1:1 & Swarm Chat**: `#shell-chat-panel`
  - **Escalated Inbox**: `/{teamRef}/{projectKey}/inbox`

### Minimum Guarantee (Failure / Rollback Safety Invariant)
- Zero fake hardcoded agent names or synthetic metrics are ever rendered; any invalid input or unauthorized action fails closed (`P=1`) while keeping the SHA-256 event chain intact.

---

## 4. Flow of Events — Basic Flow

### Basic Flow (Main Success Scenario)
1. Operator selects `>=2` real agents (e.g. `@orchestrator` + `@antigravity` + `@qualitygate`) in the 1-Card Delegation composer or clicks `Phòng Họp` CTA.
2. System creates a collaborative contract + linked `itsaplan.issue` and routes participating agents through the `war_room` doorway (`x=39%, y=65%`) around the conference table.
3. Collaborating agents execute coordinated verification steps and log joint `issue_activity` updates.
4. Operator clicks `Phòng Họp` on the floorplan to view active multi-agent sessions, escalated `URGENT` items, and 1-click portals to `Notes / Kara Meetings` and `Vibe Canvas`.

---

## 5. Alternate & Exception Flows

- **A1 — Duplicate Lead & Support Agent Selection**:
  - *Condition*: Caller includes `lead_agent_id` inside `support_agent_ids`.
  - *System Response*: Engine deduplicates `support_agent_ids` deterministically so agent counts and seat assignments remain exact.
  - *Traceability*: → `@TC-UC016-S02` (`TC-UC016-03`)
- **A2 — Escalated Blocker Requires Human Input**:
  - *Condition*: War room run hits a Tier-2 policy boundary.
  - *System Response*: Contract transitions to `AWAITING_HITL` with `⚠️ Chờ duyệt` badge and surfaces at top of `Hộp Cần tôi xử lý`.
  - *Traceability*: → `@TC-UC016-S03` (`TC-UC016-04`)

---

## 6. Use-Case Slices (`53.REF.112 §3.1 & Principle 10`)

| Slice ID | Slice Name & Delivery Increment Scope | Covered Flows | Slice State | Traceability (`FR` / `TC`) | Priority |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Slice S01** | **`Phòng Họp` Live Project-Filtered Telemetry & `[PROJECT_KEY]` Attribution** | `Basic Flow (Steps 1–3)` | `Verified` | `FR-066` · `→ TC: TC-UC016-01` (`@TC-UC016-S01`) | `Must-Pass` |
| **Slice S02** | **`Phòng Họp` Primary Workflow CTA (`Triệu tập Nhóm Đa Agent (Phòng Họp)`) & Guardrails** | `Basic Flow (Step 4)`, `A1` | `Verified` | `FR-066` · `→ TC: TC-UC016-02, 03` (`@TC-UC016-S02`) | `Must-Pass` |
| **Slice S03** | **`Phòng Họp` Cross-Module ItsAPlan Portals & Boundary Resilience** | `Basic Flow (Step 5)`, `A2` | `Verified` | `FR-066` · `→ TC: TC-UC016-04` (`@TC-UC016-S03`) | `Must-Pass` |
| **Slice S04** | **DB-Persisted Department Positions, AI Seat Assignments (`open_office_org_governance`), `S7` `10s` Undo & `/agents` `JTBD-4` Parity** | `Department Seat Governance & S7 Undo` | `Active` | `FR-075` · `→ TC: TC-UC010-26..28` (`@TC-UC010-S09`) | `Must-Pass` |
