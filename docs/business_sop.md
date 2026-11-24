# ItsAPlan Layer-0 Business Standard Operating Procedures (`business_sop.md`)

- **identifier**: `[CANARY:AGENTS.md:GOVERNED]`
- **version**: `3.3.0`
- **status**: `ACTIVE`

## 1. Three-Node Socio-Technical Governance (`HUM` / `DET P=1` / `AGT`)
| SOP ID | Use Case | Human Node (`HUM`) | Agent Node (`AGT`) | Deterministic Code Node (`DET P=1`) |
|:---|:---|:---|:---|:---|
| `SOP-ITP-001` | `UC-001` Project & Board Lifecycle | Approves portfolio charter & archive | Synthesizes 7-Horizon WBS & board columns | Enforces schema constraints & RBAC |
| `SOP-ITP-002` | `UC-002` Issue & Worklog Tracking | Assigns priority & reviews blockers | Triages issues & drafts subtasks | Enforces optimistic concurrency & worklog sums |
| `SOP-ITP-003` | `UC-003` AI Agent Runtime & MCP Tools | Sets Tier-2 escalation policy | Executes bounded MCP tool workflows | Validates tool schemas & lease locks |
| `SOP-ITP-004` | `UC-004` Realtime Revision Sync | Resolves semantic conflicts | Broadcasts delta notifications | Enforces monotonic revision numbers |
| `SOP-ITP-005` | `UC-005` Initiative & Cycle Management | Signs off sprint cycle goals | Forecasts velocity & active cycle rollup | Filters active-only initiatives/cycles (`SPEC-284`) |
| `SOP-ITP-006` | `UC-006` Document & Knowledge Collab | Reviews specs & notes | Consolidates Vibe Working Canvas docs | Enforces OT revision consistency (`SPEC-278`) |
| `SOP-ITP-007` | `UC-007` Vibe Working Canvas Native Merge | Selects canvas view & approves merge | Orchestrates inline canvas + chat image paste | Enforces `<150ms` instant nav & asset sanitization |
| `SOP-ITP-008` | `UC-008` H1-H7 Multi-Branch & i18n Governance | Oversees 60-project portfolio (40 active) WBS | Synchronizes H1-H7 multi-branch tasks/subtasks | Enforces 33-namespace Vietnamese UTF-8 & ACCORD tokens |

<!-- UTOP_53_ACT_505_HARNESS_V320_ZERO_DUP_JTBD -->
## Agentic OS Constitutional Harness v3.2.0 & Sub-3-Step Executive Delegation SOP (`SPEC-53.ACT.505`)
- **Three-Node Boundary (`53.REF.100`)**: `HUM` (Ph??ng V? ? intent, consent, Tier-2/SoD sign-off), `DET` (`P=1` ? PostgreSQL/SQLite state, `GW-SOD-01`, `0` `delete_*` agent grants), `AGT` (`6` Sovereign Agents `@antigravity`, `@claude`, `@codex`, `@orchestrator`, `@research`, `@qualitygate` mounted with `37` Sovereign Skills).
- **Friction Budget Mandate**: Every executive delegation, steering, SoD acceptance, and agent skill/model adjustment completes in `<= 2` steps (`< 3` steps) at `0px` scroll with zero duplicated UI chrome.
