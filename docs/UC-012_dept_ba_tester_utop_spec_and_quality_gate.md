# Use Case Specification: UC-012 — Phòng BA-Tester — UTOP Specification Authoring, MinTC Verification & QualityGate (`EAI >= 0.98`)

`[CANARY:AGENTS.md:GOVERNED]` · **Version**: 2.1.0 · **Status**: ACTIVE (`53.ACT.500`) · **Effective**: 2026-11-09  
`Implements: UC-012, SPEC-53.ACT.500, UC-010`  
`Traces: FR-062, FR-053, FR-059, FR-060`  
`Verifies: TC-UC012-01..TC-UC012-04`  
`Governing Reference: 30_REFERENCE/53.REF.112 (Use-Case 3.0 Definitive Guide & Slicing Standard), 30_REFERENCE/53.REF.07 (Two-Tier UTOP Taxonomy)`

---

## 1. Use-Case 3.0 Identification & Dual Lifecycle State Card

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-012` |
| **Title** | Phòng BA-Tester — UTOP Specification Authoring, MinTC Verification & QualityGate (`EAI >= 0.98`) |
| **Department Room** | `BA-Tester` (`zone_id = 'ba_tester'`) |
| **Primary Actor** | `@research` (`Research Agent`), `@qualitygate` (`QualityGate Evaluator`), and `HUM` Reviewer |
| **Goal** | Author and audit Use-Case 3.0 specifications (`SPEC-*`, `UC-*`), validate Acceptance Criteria and empirical test suites (`pytest`, `bun test`), and verify cryptographic `ev_<sha256>` proofs before deliverables enter `Hộp Cần tôi xử lý`. |
| **Scope** | System (`apps/itsaplan` — `PixelOfficeCanvas.tsx`, `OpenOfficeWorkspaceView.tsx`, `OpenOfficeContractEngine`, & PostgreSQL `ITSAPLAN_DB_URL`: `itsaplan.issue` (`Review`/`In Progress`), `itsaplan.project_document`, `itsaplan.agent_run`, `chom_evidence_ledger`, `open_office_task_runs`) |
| **Level** | 🌊 User Goal |
| **UC Lifecycle State** | `All Flows Fulfilled` (`Goal Established` → `Flow Structure Understood` → `Basic Flow Enabled` → `Sufficient Flows Fulfilled` → `All Flows Fulfilled`) |
| **Slice Lifecycle State** | `Verified` (`Identified` → `Defined` → `Analyzed` → `Prepared` → `Implemented` → `Verified`) |

---

## 2. Phase 0 Story & Slice Splitting Decision (`53.REF.112 §5`)

- **Applied Splitting Pattern**: **Pattern 1 (Workflow Steps: Department Floorplan Click → Live Project-Filtered Telemetry → Departmental Action Dispatch → Cross-Module Portal Navigation)** & **Pattern 3 (Business Rule Variations: Single-Project Filter vs. 30-Project Portfolio Scope & Fail-Closed Governance Guards)**.
- **Slicing Meta-Pattern Rationale**: Separates truthful PostgreSQL department telemetry (`UC-012.S01`), departmental task execution & doorway routing (`UC-012.S02`), and verified cross-module ItsAPlan deep-linking & fail-closed guards (`UC-012.S03`).

---

## 3. Preconditions & Testable Guarantees

### Preconditions
1. PostgreSQL `ITSAPLAN_DB_URL` (`ai_agent`, `project`, `issue`, `agent_run`, `agent_schedule`) and SQLite `OpenOfficeContractEngine` tables are online.
2. Authenticated user opens Open Office (`/{teamRef}/{projectKey}/open-office` or `AI Agents -> Open Office`) with a selected `project_key` (`PM`..30 projects or `ALL`).

### Success Guarantee (Observable Post-Condition)
- Clicking `BA-Tester` (`ba_tester`) opens the live Department Dossier displaying real PostgreSQL-backed KPIs scoped to the active Project Filter, agents currently working in `BA-Tester` with `[PROJECT_KEY]` badges, primary CTA (`Giao Rà soát Spec / Kiểm thử QualityGate`), and verified 1-click deep links:
  - **Project Specs & Docs**: `/{teamRef}/{projectKey}/docs`
  - **Work Items (Review/QA)**: `/{teamRef}/{projectKey}`
  - **Issue Templates**: `/{teamRef}/{projectKey}/settings/issue-templates`
  - **Issue Types**: `/{teamRef}/{projectKey}/settings/issue-types`

### Minimum Guarantee (Failure / Rollback Safety Invariant)
- Zero fake hardcoded agent names or synthetic metrics are ever rendered; any invalid input or unauthorized action fails closed (`P=1`) while keeping the SHA-256 event chain intact.

---

## 4. Flow of Events — Basic Flow

### Basic Flow (Main Success Scenario)
1. Operator clicks `BA-Tester` room on the Virtual Office floorplan or assigns a Spec/QA goal to `@research` or `@qualitygate`.
2. Receiving agent walks from `Đại Sảnh Chung` through the `ba_tester` doorway (`x=14%, y=35%`) to its workstation with `🔎 Search` / `📄 Spec` tool micro-badge.
3. Agent auto-drafts testable Acceptance Criteria (if `auto_draft_criteria=true`), links/creates a real `itsaplan.issue`, and executes spec/regression verification.
4. System attaches structured verification summary and `ev_<sha256>` proof to both `itsaplan.issue_activity` and `open_office_task_runs`, transitioning status to `AWAITING_HITL`.
5. Operator clicks the linked `Docs` or `Issue` portal from `BA-Tester` Department Inspector to inspect the specification or test report directly in ItsAPlan.

---

## 5. Alternate & Exception Flows

- **A1 — Missing Verification Proof (`EVIDENCE_REQUIRED`)**:
  - *Condition*: QA run attempts transition to `AWAITING_HITL` with empty `evidence_summary` and `evidence_links`.
  - *System Response*: Engine blocks transition with HTTP 400 `EVIDENCE_REQUIRED`.
  - *Traceability*: → `@TC-UC012-S02` (`TC-UC012-03`)
- **A2 — Explicit Empty Acceptance Criteria (`auto_draft_criteria=false`)**:
  - *Condition*: Caller submits empty `acceptance_criteria` with `auto_draft_criteria=false`.
  - *System Response*: Engine rejects creation with HTTP 400 `ACCEPTANCE_CRITERIA_REQUIRED`.
  - *Traceability*: → `@TC-UC012-S03` (`TC-UC012-04`)

---

## 6. Use-Case Slices (`53.REF.112 §3.1 & Principle 10`)

| Slice ID | Slice Name & Delivery Increment Scope | Covered Flows | Slice State | Traceability (`FR` / `TC`) | Priority |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Slice S01** | **`BA-Tester` Live Project-Filtered Telemetry & `[PROJECT_KEY]` Attribution** | `Basic Flow (Steps 1–3)` | `Verified` | `FR-062` · `→ TC: TC-UC012-01` (`@TC-UC012-S01`) | `Must-Pass` |
| **Slice S02** | **`BA-Tester` Primary Workflow CTA (`Giao Rà soát Spec / Kiểm thử QualityGate`) & Guardrails** | `Basic Flow (Step 4)`, `A1` | `Verified` | `FR-062` · `→ TC: TC-UC012-02, 03` (`@TC-UC012-S02`) | `Must-Pass` |
| **Slice S03** | **`BA-Tester` Cross-Module ItsAPlan Portals & Boundary Resilience** | `Basic Flow (Step 5)`, `A2` | `Verified` | `FR-062` · `→ TC: TC-UC012-04` (`@TC-UC012-S03`) | `Must-Pass` |
| **Slice S04** | **DB-Persisted Department Positions, AI Seat Assignments (`open_office_org_governance`), `S7` `10s` Undo & `/agents` `JTBD-4` Parity** | `Department Seat Governance & S7 Undo` | `Active` | `FR-075` · `→ TC: TC-UC010-26..28` (`@TC-UC010-S09`) | `Must-Pass` |
