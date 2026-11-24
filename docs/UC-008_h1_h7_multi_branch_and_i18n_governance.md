# UC-008: H1-H7 Multi-Branch WBS Timeline, Active Cycle Wiring & Vietnamese i18n Governance

- **UC ID**: `UC-008`
- **Title**: Orchestrate H1-H7 Multi-Branch Tasks/Subtasks Timeline, ACCORD Brand System & Vietnamese UTF-8 Localization
- **Primary Actor**: Portfolio Director / Autonomous PM Agent (`HUM` & `AGT`)
- **Goal**: Visualize and govern the complete 7-Horizon (`H1` Initiatives -> `H7` Work Packages -> Tasks -> Subtasks) multi-branch hierarchy on a human-centric Gantt timeline with 100% Vietnamese UTF-8 fidelity and streamlined navigation.
- **Scope**: `System` (`apps/itsaplan` — `SPEC-ITSAPLAN-243`, `249`, `277..285`)
- **Level**: `User Goal`
- **Preconditions**: SQLite/PostgreSQL portfolio database synchronized; `vi` and `en` locale bundles loaded.
- **Success Guarantee**: Multi-branch H1-H7 WBS renders with orthogonal dependency connectors, active-only Initiatives/Cycles filtering, zero God Mode / redundant Project Settings clutter, `<150ms` instant feature menu switching, and zero mojibake across all 33 i18n namespaces.
- **Minimum Guarantee**: Read-only fallback snapshot rendered if backend sync is in flight.

## Basic Flow
1. Actor switches between Feature Menu tabs (`Board`, `Timeline`, `Initiatives`, `Cycles`, `Docs`) in `<150ms` (`SPEC-285`).
2. System renders the consolidated Timeline Gantt (`SPEC-277`, `SPEC-278`, `SPEC-280`, `SPEC-281`) displaying `3 H1 -> 4 H2..H7 -> 7 Tasks -> 14 Subtasks` with expand/collapse and orthogonal `FS` dependency arrows.
3. Actor filters `Initiatives` or `Cycles`; system queries and displays strictly active initiatives and cycles wired to live task progress (`SPEC-284`).
4. Actor toggles Vietnamese (`vi-VN`) locale; system renders all 33 namespaces with verified NFC UTF-8 encoding (`SPEC-279`, `SPEC-283`) and ACCORD Milled Carbon & Swiss Vellum tokens (`SPEC-282`).
5. System enforces streamlined UI governance with God Mode (`SPEC-283`) and legacy Project Settings (`SPEC-284`) removed from navigation.

## Alternate & Exception Flows
- **A1 — Mojibake / Non-NFC String Detected**: Deterministic sanitizer normalizes to Unicode NFC and rejects corrupted sequences.
- **A2 — Deprecated God Mode or Project Settings Route Accessed**: Router redirects cleanly to governed Workspace Board (`HTTP 302` / SPA replace).

## Use-Case Slices
- `UC-008.S01`: H1-H7 Multi-Branch WBS & Timeline Gantt Consolidation (`→ TC: TC-UC-008 Scenario G01..G04`)
- `UC-008.S02`: Vietnamese 33-Namespace UTF-8 & ACCORD Brand Token Enforcement (`→ TC: TC-UC-008 Scenario G05..G08`)
- `UC-008.S03`: Active Initiatives/Cycles Wiring, Instant Nav & UI De-Cluttering (`→ TC: TC-UC-008 Scenario G09..G14`)

---

## Use-Case 3.0 Governance, Slicing & Lifecycle Specification (`53.REF.112` — `UC-008`)

### Use-Case 3.0 Identification & Dual Lifecycle State Card

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-008` |
| **Title** | H1-H7 Multi-Branch WBS Timeline, Active Cycle Wiring & Vietnamese i18n Governance |
| **Primary Actor** | Human Node (`HUM` — Project Owner), Deterministic Code Node (`DET`, $P=1$), Autonomous Agent Node (`AGT`) |
| **Goal** | Execute and verify **H1-H7 Multi-Branch WBS Timeline, Active Cycle Wiring & Vietnamese i18n Governance** with deterministic $P=1$ state guarantees across all Use-Case Slices (`UC-008`). |
| **Scope** | Enterprise System (`53_PROJECT_MANAGEMENT` / Sovereign Agentic OS) |
| **Level** | 🌊 User Goal |
| **UC Lifecycle State** | `All Flows Fulfilled` (`Goal Established` → `Flow Structure Understood` → `Basic Flow Enabled` → `Sufficient Flows Fulfilled` → `All Flows Fulfilled`) |
| **Slice Lifecycle State** | `Verified` (`Identified` → `Defined` → `Analyzed` → `Prepared` → `Implemented` → `Verified`) |
| **Governing Standard** | `30_REFERENCE/53.REF.112` (*USE-CASE 3.0: The Definitive Guide — Refreshed*, Jacobson et al., May 2024) |

### Phase 0 Story & Slice Splitting Decision (`53.REF.112 §5`)

- **Splitting Pattern Applied**: **Pattern 1 (Workflow Steps)** & **Pattern 7 (Simple/Complex — Core vs. Variations)** combined with Jacobson Principle 10 (*Build the System in Slices*).
- **Slicing Meta-Pattern Rationale**: Isolates the core happy-path value delivery of `UC-008` (H1-H7 Multi-Branch WBS Timeline, Active Cycle Wiring & Vietnamese i18n Governance) into `Slice S01`, separates precondition/schema boundary validation into `Slice S02`, and isolates fault-recovery / Minimum Guarantee enforcement into `Slice S03`.

### Use-Case Slices (`53.REF.112 Principle 10`)

| Slice ID | Slice Name & Delivery Increment Scope | Covered Flows | Slice State | Traceability (`FR` / `TC` / Modules) | Priority |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Slice S01** | **Core Value Path — H1-H7 Multi-Branch WBS Timeline, Active Cycle Wiring & Vietnamese i18n Governance** | `Basic Flow (Steps 1–4)` | `Verified` | `FR-UC-008-01`, `FR-UC-008-02` · `→ TC: TC-UC-008` · `docs/UC-008.md` | `Must-Pass` |
| **Slice S02** | **Boundary & Precondition Guardrails** | `Alternate Flow A1` | `Verified` | `FR-UC-008-01`, `FR-UC-008-02` · `→ TC: TC-UC-008-S02` | `Must-Pass` |
| **Slice S03** | **Fault Recovery & Minimum Guarantee** | `Alternate Flow A2` | `Verified` | `FR-UC-008-01`, `FR-UC-008-02` · `→ TC: TC-UC-008-S03` | `Should-Pass` |
