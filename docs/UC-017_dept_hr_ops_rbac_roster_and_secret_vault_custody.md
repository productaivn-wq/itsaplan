# Use Case Specification: UC-017 — Phòng HCNS — Hybrid Human-AI Roster Telemetry, RBAC Governance, FinOps & Secret Vault Custody

`[CANARY:AGENTS.md:GOVERNED]` · **Version**: 2.1.0 · **Status**: ACTIVE (`53.ACT.500`) · **Effective**: 2026-11-09  
`Implements: UC-017, SPEC-53.ACT.500, UC-010`  
`Traces: FR-067, FR-053, FR-059, FR-060`  
`Verifies: TC-UC017-01..TC-UC017-04`  
`Governing Reference: 30_REFERENCE/53.REF.112 (Use-Case 3.0 Definitive Guide & Slicing Standard), 30_REFERENCE/53.REF.07 (Two-Tier UTOP Taxonomy)`

---

## 1. Use-Case 3.0 Identification & Dual Lifecycle State Card

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-017` |
| **Title** | Phòng HCNS — Hybrid Human-AI Roster Telemetry, RBAC Governance, FinOps & Secret Vault Custody |
| **Department Room** | `HCNS` (`zone_id = 'hr_ops'`) |
| **Primary Actor** | `HUM` Owner/Admin, `@orchestrator`, and `@qualitygate` |
| **Goal** | Monitor real-time heartbeat health (`last_seen_at`), capabilities, workload balance, and token/time FinOps variance of all team AI agents alongside direct custody links to `Members`, `Roles`, `Secret Vault`, and `Team AI Settings`. |
| **Scope** | System (`apps/itsaplan` — `PixelOfficeCanvas.tsx`, `OpenOfficeWorkspaceView.tsx`, `OpenOfficeContractEngine`, & PostgreSQL `ITSAPLAN_DB_URL`: `itsaplan.ai_agent`, `itsaplan.user`, `itsaplan.agent_tool_link`, `open_office_contracts` (`estimated_tokens`, `actual_tokens`)) |
| **Level** | 🌊 User Goal |
| **UC Lifecycle State** | `All Flows Fulfilled` (`Goal Established` → `Flow Structure Understood` → `Basic Flow Enabled` → `Sufficient Flows Fulfilled` → `All Flows Fulfilled`) |
| **Slice Lifecycle State** | `Verified` (`Identified` → `Defined` → `Analyzed` → `Prepared` → `Implemented` → `Verified`) |

---

## 2. Phase 0 Story & Slice Splitting Decision (`53.REF.112 §5`)

- **Applied Splitting Pattern**: **Pattern 1 (Workflow Steps: Department Floorplan Click → Live Project-Filtered Telemetry → Departmental Action Dispatch → Cross-Module Portal Navigation)** & **Pattern 3 (Business Rule Variations: Single-Project Filter vs. 30-Project Portfolio Scope & Fail-Closed Governance Guards)**.
- **Slicing Meta-Pattern Rationale**: Separates truthful PostgreSQL department telemetry (`UC-017.S01`), departmental task execution & doorway routing (`UC-017.S02`), and verified cross-module ItsAPlan deep-linking & fail-closed guards (`UC-017.S03`).

---

## 3. Preconditions & Testable Guarantees

### Preconditions
1. PostgreSQL `ITSAPLAN_DB_URL` (`ai_agent`, `project`, `issue`, `agent_run`, `agent_schedule`) and SQLite `OpenOfficeContractEngine` tables are online.
2. Authenticated user opens Open Office (`/{teamRef}/{projectKey}/open-office` or `AI Agents -> Open Office`) with a selected `project_key` (`PM`..30 projects or `ALL`).

### Success Guarantee (Observable Post-Condition)
- Clicking `HCNS` (`hr_ops`) opens the live Department Dossier displaying real PostgreSQL-backed KPIs scoped to the active Project Filter, agents currently working in `HCNS` with `[PROJECT_KEY]` badges, primary CTA (`Kiểm tra Sức khỏe Đội ngũ, Quyền & Secret Vault`), and verified 1-click deep links:
  - **Project Members**: `/{teamRef}/{projectKey}/members`
  - **Secret Vault (AES-256)**: `/{teamRef}/{projectKey}/vault`
  - **Team Roles & RBAC**: `/{teamRef}/settings/roles`
  - **Team AI Agents Config**: `/{teamRef}/settings/ai-agents`

### Minimum Guarantee (Failure / Rollback Safety Invariant)
- Zero fake hardcoded agent names or synthetic metrics are ever rendered; any invalid input or unauthorized action fails closed (`P=1`) while keeping the SHA-256 event chain intact.

---

## 4. Flow of Events — Basic Flow

### Basic Flow (Main Success Scenario)
1. Operator clicks `HCNS` room (`x=64%, y=65%` doorway) on the Virtual Office floorplan.
2. System queries `itsaplan.ai_agent` (`last_seen_at`, `kind`, `runner_scope`) and `open_office_contracts` FinOps metrics (`estimated_tokens` vs `actual_tokens`, completion rate).
3. Department Inspector displays live online status of all 6 sovereign agents (`@antigravity`, `@research`, `@orchestrator`, `@qualitygate`, `@claude`, `@codex`), workload distribution, and Vault/RBAC readiness.
4. Operator clicks `Secret Vault`, `Members`, `Team Roles`, or `Team AI Agents Config` portals to manage credentials and permissions without leaving the unified planner shell.

---

## 5. Alternate & Exception Flows

- **A1 — Stale Agent Runner Heartbeat**:
  - *Condition*: An external agent's `last_seen_at` exceeds heartbeat threshold.
  - *System Response*: `HCNS` dossier flags the agent as `OFFLINE / STALE HEARTBEAT` truthfully instead of faking `ACTIVE` status.
  - *Traceability*: → `@TC-UC017-S02` (`TC-UC017-03`)
- **A2 — Zero Plaintext Secret Exposure**:
  - *Condition*: Any Open Office API endpoint serializes agent metadata.
  - *System Response*: Ciphertext/API keys (`api_key_ciphertext`) are strictly excluded from JSON payloads (`GW-SEC-01`).
  - *Traceability*: → `@TC-UC017-S03` (`TC-UC017-04`)

---

## 6. Use-Case Slices (`53.REF.112 §3.1 & Principle 10`)

| Slice ID | Slice Name & Delivery Increment Scope | Covered Flows | Slice State | Traceability (`FR` / `TC`) | Priority |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Slice S01** | **`HCNS` Live Project-Filtered Telemetry & `[PROJECT_KEY]` Attribution** | `Basic Flow (Steps 1–3)` | `Verified` | `FR-067` · `→ TC: TC-UC017-01` (`@TC-UC017-S01`) | `Must-Pass` |
| **Slice S02** | **`HCNS` Primary Workflow CTA (`Kiểm tra Sức khỏe Đội ngũ, Quyền & Secret Vault`) & Guardrails** | `Basic Flow (Step 4)`, `A1` | `Verified` | `FR-067` · `→ TC: TC-UC017-02, 03` (`@TC-UC017-S02`) | `Must-Pass` |
| **Slice S03** | **`HCNS` Cross-Module ItsAPlan Portals & Boundary Resilience** | `Basic Flow (Step 5)`, `A2` | `Verified` | `FR-067` · `→ TC: TC-UC017-04` (`@TC-UC017-S03`) | `Must-Pass` |
| **Slice S04** | **DB-Persisted Department Positions, AI Seat Assignments (`open_office_org_governance`), `S7` `10s` Undo & `/agents` `JTBD-4` Parity** | `Department Seat Governance & S7 Undo` | `Active` | `FR-075` · `→ TC: TC-UC010-26..28` (`@TC-UC010-S09`) | `Must-Pass` |

<!-- AUTO_SYNC_SWP_CAPABILITIES_START -->
## Auto-Synced SWP Capabilities & Use-Case Deltas (`GW-SWP-REGISTRY-UC-SYNC-01`)
- **Control-Tower Task**: `53.ACT.668` (`10_SPECS/SPEC-PORTFOLIO-ITP.md`)
- **Source Repositories**: `titanwings/distilly`
- **Impact Tier**: `TIER_1` | **Mapped SWP IDs**: `SWP-DST-01, SWP-DST-02, SWP-DST-03, SWP-DST-04, SWP-DST-05, SWP-DST-07, SWP-DST-10, SWP-DST-13, SWP-DST-14, SWP-DST-16, SWP-DST-17, SWP-DST-19, SWP-DST-21, SWP-DST-22`
- **Adoption Rationale**: Isolated MCP env, read-only MCP fixture, skill memory append-only merge + frontmatter safety, OpenJev risk gate & Decree 13 HR roster.
- **Capability Requirement (`CAP-ITP-DISTILLY`)**: Enforce SWP-DST-01, SWP-DST-02, SWP-DST-03, SWP-DST-04, SWP-DST-05, SWP-DST-07, SWP-DST-10, SWP-DST-13, SWP-DST-14, SWP-DST-16, SWP-DST-17, SWP-DST-19, SWP-DST-21, SWP-DST-22 deterministic invariants in this spoke's UCs and automated regression tests.
<!-- AUTO_SYNC_SWP_CAPABILITIES_END -->
