# UC-003: AI Agent Runtime, MCP Tools, and Runner Queue

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-003` |
| **Title** | Execute Autonomous AI Agent Workflows and MCP Tools |
| **Primary Actor** | AI Agent Operator / Autonomous Coding Agent |
| **Goal** | Provision internal Mastra agents or external runner agents, attach skills and credentials, trigger autonomous runs via mentions/delegation/schedules, and execute MCP tools. |
| **Scope** | System (`apps/api`, `packages/agent-tools`, `packages/runner`, `apps/worker`) |
| **Level** | 🌊 User Goal |
| **Preconditions** | AI agent is provisioned with a linked bot user; integration credentials (LLM / Tool) are encrypted at rest with AES-256-GCM. |
| **Success Guarantee** | The agent claims runs, executes authorized MCP tools, streams token events, and posts final outputs back to the issue activity feed or chat thread. |
| **Minimum Guarantee** | If an agent crashes or loses connection mid-execution, its leased run expires and returns to the pending queue; sensitive API keys are never leaked in plain text. |

---

## 1. Sizing & Splitting Decision (Phase 0)
- **Primary Pattern Applied**: Pattern 7 (Simple / Complex) & Pattern 9 (Spike / Isolation).
- **Rationale**: Cleanly segregates internal agents (in-process Mastra LLM execution) from external agents (external CLI runner polling `/agent-runs/claim`) while unifying them over the identical MCP tool surface (`apps/api/src/mcp`).

---

## 2. Basic Flow (Main Scenario)
1. **Agent Setup**: The Operator registers an `ai_agent` (`kind = 'internal'` or `'external'`), assigning system instructions, skills (`agent_skill`), and configured tools (`agent_tool`).
2. **Trigger Autonomous Run**: A human user delegates an issue to the agent (`delegateUserId`) or mentions the agent (`@username`) in an issue comment.
3. **Queue Agent Run**: The system enqueues an `agent_run` record with `status = 'pending'`, calculating `next_attempt_at` according to `delegationDelaySec`.
4. **Claim Run Lease**:
   - *Internal*: The internal worker claims the run in-process using decryptable integration credentials.
   - *External*: The external runner CLI (`@itsaplan/runner`) calls `POST /agent-runs/claim` authenticating via `x-api-key`. The system leases the run, setting a renewal heartbeat window.
5. **Execute MCP Tools**: The agent invokes authorized MCP tools (e.g., `create_issue`, `update_issue`, `search_issues`, `link_issues`) exposed via `POST /mcp` or in-process Elysia dispatch.
6. **Stream Events & Heartbeat**: The runner emits real-time deltas and tool-call events to `agent_chat_event` and periodically calls `POST /agent-runs/:runId/heartbeat`.
7. **Complete Run**: The runner posts the final output to `POST /agent-runs/:runId/result`. The system marks `status = 'success'`, updates `issue_activity` with the agent's findings, and bumps revision counters.

---

## 3. Alternate & Exception Flows
- **A1 — Runner Crash / Lease Timeout**:
  - *Condition*: A claimed external run fails to emit a heartbeat before `next_attempt_at` elapses.
  - *System Response*: The worker resets the run status back to `pending`, allowing another active runner to reclaim the workload.
- **A2 — MCP Tool Permission Violation**:
  - *Condition*: An agent attempts to invoke an MCP tool for a resource outside its assigned `project_member` role permissions or when MCP is disabled for the project.
  - *System Response*: The MCP dispatcher intercepts the request in `assertMcpEnabled` and rejects the tool invocation with HTTP 403 Forbidden.
- **A3 — Malformed Tool Configuration**:
  - *Condition*: Decrypted integration credential fails schema coercion (`ToolConfigError`).
  - *System Response*: The execution fails fast, recording `last_error` on `agent_run` without leaking the decrypted secret.

---

## 4. Use-Case Slices
- **Slice S01: Internal Agent & Skill Ingestion**  
  *Scope*: Provisioning, SKILL.md storage in S3, Mastra LLM execution loop.  
  *Traceability*: → TC: `TC-UC-003 Scenario G01` (Attach skill to internal agent and trigger run).
- **Slice S02: External Runner Queue Protocol**  
  *Scope*: Claiming runs, leasing with heartbeats, result submission via `@itsaplan/runner`.  
  *Traceability*: → TC: `TC-UC-003 Scenario G02` (External runner claim-heartbeat-result lifecycle).
- **Slice S03: Unified MCP Tool Dispatch**  
  *Scope*: Schema-validated tool generation and execution over JSON-RPC `/mcp`.  
  *Traceability*: → TC: `TC-UC-003 Scenario G03` (Execute `update_issue` tool via MCP protocol).

---

## 5. Revision History
- **2026-09-21**: Version 1.0.0 — Aligned with `apps/api/src/modules/agents`, `apps/api/src/mcp`, `packages/runner`, and `packages/agent-tools`.

---

## Use-Case 3.0 Governance, Slicing & Lifecycle Specification (`53.REF.112` — `UC-003`)

### Use-Case 3.0 Identification & Dual Lifecycle State Card

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-003` |
| **Title** | AI Agent Runtime, MCP Tools, and Runner Queue |
| **Primary Actor** | Human Node (`HUM` — Project Owner), Deterministic Code Node (`DET`, $P=1$), Autonomous Agent Node (`AGT`) |
| **Goal** | Execute and verify **AI Agent Runtime, MCP Tools, and Runner Queue** with deterministic $P=1$ state guarantees across all Use-Case Slices (`UC-003`). |
| **Scope** | Enterprise System (`53_PROJECT_MANAGEMENT` / Sovereign Agentic OS) |
| **Level** | 🌊 User Goal |
| **UC Lifecycle State** | `All Flows Fulfilled` (`Goal Established` → `Flow Structure Understood` → `Basic Flow Enabled` → `Sufficient Flows Fulfilled` → `All Flows Fulfilled`) |
| **Slice Lifecycle State** | `Verified` (`Identified` → `Defined` → `Analyzed` → `Prepared` → `Implemented` → `Verified`) |
| **Governing Standard** | `30_REFERENCE/53.REF.112` (*USE-CASE 3.0: The Definitive Guide — Refreshed*, Jacobson et al., May 2024) |

<!-- UTOP_53_ACT_505_HARNESS_V320_ZERO_DUP_JTBD -->
### Slice S04 ? Sovereign Harness v3.2.0 Sync & 2-Step In-Place `380px` `AgentSheet` (`SPEC-53.ACT.505`)
- **Scope**: Synchronizes all `6` Sovereign Harness Agents (`@antigravity`, `@claude`, `@codex`, `@orchestrator`, `@research`, `@qualitygate`), `37` Sovereign Skills (`agent_skill` + `.local_storage`), and MCP/configured tools (`agent_tool`) with Tier-2 safe actions (`0` `delete_*` grants). Deduplicates `/[teamRef]/[projectKey]/agents` to a single-line Harness v3.2.0 status bar (`0` `text-[11px]`), concise 1-line role summaries, canonical 1-click `/open-office` link, and clickable rows opening the `380px` `AgentSheet` directly in-place (`<= 2` steps).
- **Traceability**: `FR-062`, `FR-063`, `FR-064` -> `TC: TC-UC-003 Scenario G04, G05` (`SPEC-53.ACT.505`).

### Slice S05 — Unified Global Chat Task Intake, Analytics & Live Agent Runner Bridge (`SPEC-53.ACT.627`)
- **Scope**: Unifies global `ChatPanel` (`AI Chat` | `Live Agents` | `Memory`) so natural-language English/Vietnamese task/instruction inputs (`create task`, `tạo việc`, `@agent ...`, `/task`, `/hud`, `/done`, `/approve`) sent to `POST /api/vibe/chat` route deterministically through `UniversalBridge` (`scripts/antigravity_to_itsaplan_bridge.py`) with active `project_key` and `agent_username` (`delegate_user_id`), while preserving 1-click access to multi-tab SSE `Live Agents` (`ChatPanelBody`).
- **Traceability**: `FR-592-13`, `FR-627-01`, `FR-627-04` -> `TC: TC-627-03, TC-627-04, TC-627-06, TC-627-07, TC-627-12` (`SPEC-53.ACT.627`).

<!-- AUTO_SYNC_SWP_CAPABILITIES_START -->
## Auto-Synced SWP Capabilities & Use-Case Deltas (`GW-SWP-REGISTRY-UC-SYNC-01`)
- **Control-Tower Task**: `53.ACT.668` (`10_SPECS/SPEC-PORTFOLIO-ITP.md`)
- **Source Repositories**: `titanwings/distilly`
- **Impact Tier**: `TIER_1` | **Mapped SWP IDs**: `SWP-DST-01, SWP-DST-02, SWP-DST-03, SWP-DST-04, SWP-DST-05, SWP-DST-07, SWP-DST-10, SWP-DST-13, SWP-DST-14, SWP-DST-16, SWP-DST-17, SWP-DST-19, SWP-DST-21, SWP-DST-22`
- **Adoption Rationale**: Isolated MCP env, read-only MCP fixture, skill memory append-only merge + frontmatter safety, OpenJev risk gate & Decree 13 HR roster.
- **Capability Requirement (`CAP-ITP-DISTILLY`)**: Enforce SWP-DST-01, SWP-DST-02, SWP-DST-03, SWP-DST-04, SWP-DST-05, SWP-DST-07, SWP-DST-10, SWP-DST-13, SWP-DST-14, SWP-DST-16, SWP-DST-17, SWP-DST-19, SWP-DST-21, SWP-DST-22 deterministic invariants in this spoke's UCs and automated regression tests.
<!-- AUTO_SYNC_SWP_CAPABILITIES_END -->
