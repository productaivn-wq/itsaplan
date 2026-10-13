# Micro-UTOP Specification: ItsAPlan Feature Navigation Optimization & Database Wiring Verification

`[CANARY:GEMINI.md:GOVERNED]` · **Spec ID**: `SPEC-53.ACT.ITP_NAV` · **Status**: ACTIVE · **Date**: 2026-10-13  
`Governing Standards: 53.REF.107 (AI-Native Content Standard), 53.REF.07 (Two-Tier UTOP Taxonomy), 53.REF.100, Gate GW-UTOP-01, Gate GW-HEADLESS-01, Gate GW-QG-01`  
`Assigned Actor: AGT` · `Classification: Tier 1 Micro-UTOP (<= 30m / <= 3 files)`

```json-ld
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "@id": "urn:antigravity:53pm:spec:53.ACT.ITP_NAV",
  "identifier": "SPEC-53.ACT.ITP_NAV",
  "name": "ItsAPlan Feature Navigation Optimization & Database Wiring Verification",
  "version": "1.0.0",
  "dateCreated": "2026-10-13",
  "author": {
    "@type": "SoftwareAgent",
    "name": "AGT"
  },
  "programmingLanguage": "TypeScript/Python",
  "queriesAnswered": [
    "Why does navigating between features in ItsAPlan experience high latency?",
    "Why is data visualization missing and how is ItsAPlan wired to the database?",
    "What optimizations eliminate navigation lag and restore instant board and feature rendering?"
  ]
}
```

---

## 1. Context & Task Invariants
> **BLUF**: Diagnoses and eliminates the root causes of navigation latency and missing data visualization in ItsAPlan (`http://localhost:3001`): (1) TurboPack on-demand compilation and un-prefetched Next.js navigation links, (2) aggressive 2-second background sync polling thread starvation, and (3) proxy session gating and route pre-warming.

- **Target Initiative / Task**: `53.ACT.ITP_NAV` — ItsAPlan Navigation Latency Elimination and DB Wiring Verification
- **Primary Invariants**:
  - Gate GW-UTOP-01 (Upstream specs precede code)
  - Gate GW-HEADLESS-01 (Headless execution)
  - Gate GW-QG-01 (Quality Gate verification EAI >= 0.98)
  - Gate GW-PROOF-01 (Fresh terminal execution proof)

- **Target Implementation Files**:
  - `apps/web/src/components/layout/SidebarNavItem.tsx` (`SidebarNavItem.tsx`, `SidebarNavItem`, `d:\WORK\01_PROJECTS\58_ITSAPLAN\apps\web\src\components\layout\SidebarNavItem.tsx`)
  - `apps/web/src/components/layout/SidebarNavSubmenuCollapsible.tsx` (`SidebarNavSubmenuCollapsible.tsx`, `SidebarNavSubmenuCollapsible`, `d:\WORK\01_PROJECTS\58_ITSAPLAN\apps\web\src\components\layout\SidebarNavSubmenuCollapsible.tsx`)
  - `apps/web/src/components/layout/SidebarNavSubmenuMenu.tsx` (`SidebarNavSubmenuMenu.tsx`, `SidebarNavSubmenuMenu`, `d:\WORK\01_PROJECTS\58_ITSAPLAN\apps\web\src\components\layout\SidebarNavSubmenuMenu.tsx`)
  - `apps/web/src/context/syncContext.tsx` (`syncContext.tsx`, `syncContext`, `d:\WORK\01_PROJECTS\58_ITSAPLAN\apps\web\src\context\syncContext.tsx`)
  - `apps/web/src/proxy.ts` (`proxy.ts`, `proxy`, `d:\WORK\01_PROJECTS\58_ITSAPLAN\apps\web\src\proxy.ts`)
  - `apps/api/src/modules/issues/service.ts` (`service.ts`, `issues/service.ts`, `d:\WORK\01_PROJECTS\58_ITSAPLAN\apps\api\src\modules\issues\service.ts`)

---

## 2. Functional Requirements Catalog

### `FR-53.ACT.ITP_NAV-01`: Sidebar Navigation Link Prefetching
Next.js `<Link>` components in `SidebarNavItem.tsx`, `SidebarNavSubmenuCollapsible.tsx`, and `SidebarNavSubmenuMenu.tsx` shall explicitly set `prefetch={true}`. In development mode with Turbopack, this ensures routes and page chunks are pre-compiled and cached before the user clicks, transforming 15-30s cold compilation delays into instantaneous transitions.

### `FR-53.ACT.ITP_NAV-02`: Background Sync Polling De-escalation
In `syncContext.tsx`, `refetchIntervalInBackground` shall be disabled (`false`) and polling interval throttled to 5,000ms (`POLL_MS = 5000`) so background tabs and idle instances do not continuously saturate Elysia API and worker event loops with `OPTIONS` and `GET /sync/rev` calls.

### `FR-53.ACT.ITP_NAV-03`: Dev Session & Open Path Resilience
In `proxy.ts`, ensure that Vibe Canvas and localhost inspection routes can resolve without deadlocking on missing cookies, and verify that the default account session for `thanb` (Project Owner, `VxJcAy4J57iGevrv2az46E0rFp6oGnXK`) is active and accessible.

### `FR-53.ACT.ITP_NAV-04`: Database Ground-Truth Verification
Verify that `itsaplan` DB contains all 27 projects, valid Kanban columns, and synced issues from `task_manager.tasks` and markdown files, ensuring zero unassigned column IDs for Kanban display.

### `FR-53.ACT.ITP_NAV-05`: Board Issues Query Protection (listIssues Sane Limit)
In `apps/api/src/modules/issues/service.ts`, `listIssues(project)` shall apply a protective ceiling (e.g. limit 200 per column or 1000 total active issues) on board reads so massive historical logs (>10,000 issues) do not cause 25MB payload serialization and freeze browser DOM rendering.

---

## 3. Declarative BDD Gherkin Specifications

```gherkin
Feature: ItsAPlan Feature Navigation Optimization & Database Wiring Verification
  As AGT
  I want ItsAPlan feature navigation and database wiring optimized
  So that platform invariants and quality gates are satisfied.

  Scenario: Execute ItsAPlan Feature Navigation Optimization successfully
    Given the component is in valid initial state
    When the execution triggers with verified inputs
    Then the expected deterministic outcome is achieved with mathematical certainty
```

---

## 4. Test Case Specifications (TC-SPECS) & MinTC Boundary Data

| Test Case ID | Traced FR ID | Expected Verdict | Boundary / Edge Condition |
| :--- | :--- | :---: | :--- |
| `TC-53.ACT.ITP_NAV-01` | `FR-53.ACT.ITP_NAV-01` | PASS | Nominal valid parameters |
| `TC-53.ACT.ITP_NAV-02` | `FR-53.ACT.ITP_NAV-02` | PASS | Polling interval >= 5000ms |
| `TC-53.ACT.ITP_NAV-03` | `FR-53.ACT.ITP_NAV-03` | PASS | Session resilience verified |
| `TC-53.ACT.ITP_NAV-04` | `FR-53.ACT.ITP_NAV-04` | PASS | 27 projects DB ground-truth |
| `TC-53.ACT.ITP_NAV-05` | `FR-53.ACT.ITP_NAV-05` | PASS | Board query returns < 100ms |

---

## 5. Scope Cutlines & Non-Goals Fences

### Priority Cutlines
- **P0**: Core functional delivery of navigation prefetching and sync throttling with test coverage
- **P1**: Diagnostic error messages and edge-case hardening
- **P2**: Telemetry dashboard visualization and long-term analytics

### Explicit Non-Goals (Boundary Fences)
- [NON-GOAL] Will NOT refactor or touch files outside the explicit task scope.
- [NON-GOAL] Will NOT replace deterministic code assertions with synthetic mocks.
- [NON-GOAL] Will NOT alter database schemas or perform destructive DDL/DML without Tier 2 authorization.

---

## 6. Metrics Duality Hierarchy

| Metric Type | Metric Name | Target / Guardrail | Description |
| :--- | :--- | :--- | :--- |
| **Leading Indicator** | Diagnostic Performance | 100% test pass rate with execution runtime < 5s | Short-term fast feedback loop |
| **Lagging Indicator** | Business Outcome | Zero regressions or unhandled errors in production | Long-term value and stability |

---
*Micro-UTOP Specification for 53.ACT.ITP_NAV sealed with P=1 determinism.*
