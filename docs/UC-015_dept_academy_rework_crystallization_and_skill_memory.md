# Use Case Specification: UC-015 — Phòng Đào Tạo — "unverified stub" Rework Lesson Crystallization, WeKnora Memory & Agent Skill Evolution

`[CANARY:AGENTS.md:GOVERNED]` · **Version**: 2.1.0 · **Status**: ACTIVE (`53.ACT.500`) · **Effective**: 2026-11-09  
`Implements: UC-015, SPEC-53.ACT.500, UC-010`  
`Traces: FR-065, FR-053, FR-059, FR-060`  
`Verifies: TC-UC015-01..TC-UC015-04`  
`Governing Reference: 30_REFERENCE/53.REF.112 (Use-Case 3.0 Definitive Guide & Slicing Standard), 30_REFERENCE/53.REF.07 (Two-Tier UTOP Taxonomy)`

---

## 1. Use-Case 3.0 Identification & Dual Lifecycle State Card

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-015` |
| **Title** | Phòng Đào Tạo — "unverified stub" Rework Lesson Crystallization, WeKnora Memory & Agent Skill Evolution |
| **Department Room** | `Đào Tạo` (`zone_id = 'academy'`) |
| **Primary Actor** | `@research` (`Research Agent`), Reworking Agents, and `HUM` Coach |
| **Goal** | Automatically crystallize every human rework critique (`RETURN_FOR_REWORK` / *"unverified stub"*) into persistent structured lessons (`open_office_lessons`), inject learned rules into subsequent `TaskRun #(N+1)` attempts, and link directly to `Docs`, `WeKnora Memory`, and `Agent Skills`. |
| **Scope** | System (`apps/itsaplan` — `PixelOfficeCanvas.tsx`, `OpenOfficeWorkspaceView.tsx`, `OpenOfficeContractEngine`, & PostgreSQL `ITSAPLAN_DB_URL`: `open_office_lessons`, `open_office_task_runs`, `itsaplan.project_document`, `itsaplan.agent_skill`, `itsaplan.agent_skill_link`) |
| **Level** | 🌊 User Goal |
| **UC Lifecycle State** | `All Flows Fulfilled` (`Goal Established` → `Flow Structure Understood` → `Basic Flow Enabled` → `Sufficient Flows Fulfilled` → `All Flows Fulfilled`) |
| **Slice Lifecycle State** | `Verified` (`Identified` → `Defined` → `Analyzed` → `Prepared` → `Implemented` → `Verified`) |

---

## 2. Phase 0 Story & Slice Splitting Decision (`53.REF.112 §5`)

- **Applied Splitting Pattern**: **Pattern 1 (Workflow Steps: Department Floorplan Click → Live Project-Filtered Telemetry → Departmental Action Dispatch → Cross-Module Portal Navigation)** & **Pattern 3 (Business Rule Variations: Single-Project Filter vs. 30-Project Portfolio Scope & Fail-Closed Governance Guards)**.
- **Slicing Meta-Pattern Rationale**: Separates truthful PostgreSQL department telemetry (`UC-015.S01`), departmental task execution & doorway routing (`UC-015.S02`), and verified cross-module ItsAPlan deep-linking & fail-closed guards (`UC-015.S03`).

---

## 3. Preconditions & Testable Guarantees

### Preconditions
1. PostgreSQL `ITSAPLAN_DB_URL` (`ai_agent`, `project`, `issue`, `agent_run`, `agent_schedule`) and SQLite `OpenOfficeContractEngine` tables are online.
2. Authenticated user opens Open Office (`/{teamRef}/{projectKey}/open-office` or `AI Agents -> Open Office`) with a selected `project_key` (`PM`..30 projects or `ALL`).

### Success Guarantee (Observable Post-Condition)
- Clicking `Đào Tạo` (`academy`) opens the live Department Dossier displaying real PostgreSQL-backed KPIs scoped to the active Project Filter, agents currently working in `Đào Tạo` with `[PROJECT_KEY]` badges, primary CTA (`Xem Bài học Đúc kết & Nâng cấp Kỹ năng`), and verified 1-click deep links:
  - **Knowledge Docs**: `/{teamRef}/{projectKey}/docs`
  - **WeKnora Memory Panel**: `#weknora-memory`
  - **Team Agent Skills**: `/{teamRef}/settings/agent-skills`
  - **Project Onboarding**: `/{teamRef}/{projectKey}/onboarding`

### Minimum Guarantee (Failure / Rollback Safety Invariant)
- Zero fake hardcoded agent names or synthetic metrics are ever rendered; any invalid input or unauthorized action fails closed (`P=1`) while keeping the SHA-256 event chain intact.

---

## 4. Flow of Events — Basic Flow

### Basic Flow (Main Success Scenario)
1. During review of an `AWAITING_HITL` deliverable, Operator enters a 1-line corrective critique (*"unverified stub"*) and triggers `RETURN_FOR_REWORK`.
2. Backend marks `TaskRun #N` as `RETURNED_FOR_REWORK`, extracts a structured lesson into `open_office_lessons` (`agent_id`, `project_key`, `feedback_reason`, `crystallized_rule`), and appends `LESSON_CRYSTALLIZED` to `open_office_event_log`.
3. Agent transitions through `Đào Tạo` (`x=13%, y=65%` doorway) to absorb the lesson and spawns `TaskRun #(N+1)` incorporating the crystallized rule into its execution prompt.
4. Operator clicks `Đào Tạo` room or the Agent Inspector's `Đúc kết (MEMORY)` tab to inspect all crystallized lessons per project and agent.
5. Operator uses 1-click portals to open `Docs`, `WeKnora Memory`, or `Team Agent Skills` (`/{teamRef}/settings/agent-skills`) to promote high-value lessons into permanent skills.

---

## 5. Alternate & Exception Flows

- **A1 — Return for Rework Without Critique Reason**:
  - *Condition*: Reviewer clicks `RETURN_FOR_REWORK` with blank `reason`.
  - *System Response*: Engine rejects request with HTTP 400 `REWORK_REASON_REQUIRED` so every rework produces an actionable lesson.
  - *Traceability*: → `@TC-UC015-S02` (`TC-UC015-03`)
- **A2 — Append-Only Tamper Attempt on Lesson Event**:
  - *Condition*: Caller attempts SQL `UPDATE` or `DELETE` on crystallized event history.
  - *System Response*: SQLite `ABORT` trigger blocks mutation with `APPEND_ONLY_VIOLATION`.
  - *Traceability*: → `@TC-UC015-S03` (`TC-UC015-04`)

---

## 6. Use-Case Slices (`53.REF.112 §3.1 & Principle 10`)

| Slice ID | Slice Name & Delivery Increment Scope | Covered Flows | Slice State | Traceability (`FR` / `TC`) | Priority |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Slice S01** | **`Đào Tạo` Live Project-Filtered Telemetry & `[PROJECT_KEY]` Attribution** | `Basic Flow (Steps 1–3)` | `Verified` | `FR-065` · `→ TC: TC-UC015-01` (`@TC-UC015-S01`) | `Must-Pass` |
| **Slice S02** | **`Đào Tạo` Primary Workflow CTA (`Xem Bài học Đúc kết & Nâng cấp Kỹ năng`) & Guardrails** | `Basic Flow (Step 4)`, `A1` | `Verified` | `FR-065` · `→ TC: TC-UC015-02, 03` (`@TC-UC015-S02`) | `Must-Pass` |
| **Slice S03** | **`Đào Tạo` Cross-Module ItsAPlan Portals & Boundary Resilience** | `Basic Flow (Step 5)`, `A2` | `Verified` | `FR-065` · `→ TC: TC-UC015-04` (`@TC-UC015-S03`) | `Must-Pass` |
| **Slice S04** | **DB-Persisted Department Positions, AI Seat Assignments (`open_office_org_governance`), `S7` `10s` Undo & `/agents` `JTBD-4` Parity** | `Department Seat Governance & S7 Undo` | `Active` | `FR-075` · `→ TC: TC-UC010-26..28` (`@TC-UC010-S09`) | `Must-Pass` |

<!-- AUTO_SYNC_SWP_CAPABILITIES_START -->
## Auto-Synced SWP Capabilities & Use-Case Deltas (`GW-SWP-REGISTRY-UC-SYNC-01`)
- **Control-Tower Task**: `53.ACT.668` (`10_SPECS/SPEC-PORTFOLIO-ITP.md`)
- **Source Repositories**: `titanwings/distilly`
- **Impact Tier**: `TIER_1` | **Mapped SWP IDs**: `SWP-DST-01, SWP-DST-02, SWP-DST-03, SWP-DST-04, SWP-DST-05, SWP-DST-07, SWP-DST-10, SWP-DST-13, SWP-DST-14, SWP-DST-16, SWP-DST-17, SWP-DST-19, SWP-DST-21, SWP-DST-22`
- **Adoption Rationale**: Isolated MCP env, read-only MCP fixture, skill memory append-only merge + frontmatter safety, OpenJev risk gate & Decree 13 HR roster.
- **Capability Requirement (`CAP-ITP-DISTILLY`)**: Enforce SWP-DST-01, SWP-DST-02, SWP-DST-03, SWP-DST-04, SWP-DST-05, SWP-DST-07, SWP-DST-10, SWP-DST-13, SWP-DST-14, SWP-DST-16, SWP-DST-17, SWP-DST-19, SWP-DST-21, SWP-DST-22 deterministic invariants in this spoke's UCs and automated regression tests.
<!-- AUTO_SYNC_SWP_CAPABILITIES_END -->
