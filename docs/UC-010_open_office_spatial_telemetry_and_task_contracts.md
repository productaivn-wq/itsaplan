# Use Case Specification: UC-010 — Open Office Spatial Telemetry, Task Contracts, Live Cognitive Inspector & Real Closed-Loop Execution

`[CANARY:AGENTS.md:GOVERNED]` · **Version**: 2.0.0 · **Status**: ACTIVE / RUNNABLE MVP (`53.ACT.500`) · **Effective**: 2026-11-09  
`Implements: UC-010, SPEC-53.ACT.499, SPEC-53.ACT.500`  
`Traces: FR-053, FR-054, FR-055, FR-056, FR-057, FR-058, FR-059, FR-060`  
`Verifies: TC-UC010-01..TC-UC010-20`  
`REA Evidence: ev_35fccd6f72cef02c38def8dcaf83cf510aad654b80e817508ca67713e5086a12 (pablodelucca/pixel-agents, a16z/ai-town, OpenBMB/ChatDev, Gather.town, SoWork, Cursor/Claude Agent View)`  
`Governing Reference: 53.REF.112 (Use-Case 3.0 Definitive Guide & Slicing Standard), 53.REF.07 (Two-Tier UTOP Taxonomy), 53.REF.100, 53.REF.109`

---

## 1. Use-Case 3.0 Identification & Dual Lifecycle State Card

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-010` |
| **Title** | Orchestrate Multi-Agent Open Office Spatial Telemetry, Task Contracts, Live Cognitive Inspector & Real Closed-Loop Execution |
| **Primary Actor** | Executive / Portfolio Operator (`HUM` — Project Owner) & Sovereign AOP Agent Fleet (`AGT`) |
| **Goal** | Monitor live multi-agent spatial status across 8 architectural rooms connected by wooden doorways and a central corridor waypoint graph, backed 100% by real PostgreSQL `itsaplan.ai_agent` and active subagents; inspect live agent cognition via a 4-tab Inspector (`NOW / NEXT / MEMORY / MODULES`); dispatch 1-card multi-agent task assignments with auto-drafted acceptance criteria; bridge headless execution to real `itsaplan.issue` + `agent_run` records; and enforce independent `GW-SOD-01` review with *"unverified stub"* rework lineage captured in `open_office_lessons`. |
| **Scope** | System (`apps/itsaplan` — `OpenOfficeWorkspaceView.tsx`, `ProjectAiAgentsSection.tsx`, `/api/vibe/open-office/*`, `OpenOfficeContractEngine` & PostgreSQL SSOT `itsaplan.ai_agent`, `issue`, `agent_run`, `agent_schedule`) |
| **Level** | 🌊 User Goal |
| **UC Lifecycle State** | `All Flows Fulfilled` (`Goal Established` → `Flow Structure Understood` → `Basic Flow Enabled` → `Sufficient Flows Fulfilled` → `All Flows Fulfilled`) |
| **Slice Lifecycle State** | `Verified` (`Identified` → `Defined` → `Analyzed` → `Prepared` → `Implemented` → `Verified`) |

---

## 2. Phase 0 Story & Slice Splitting Decision (`53.REF.112 §5`)

- **Applied Splitting Patterns**:
  - **Pattern 1 (Workflow Steps)**: Spatial Telemetry & PostgreSQL Agent Binding (`S01`) → 8-Room Causal State Machine & Waypoints (`S02`) → 4-Tab Live Cognitive Inspector (`S03`) → 1-Card Multi-Agent Assignment & Auto-Draft Criteria (`S04`) → Headless Closed-Loop Execution & Deliverable Proof (`S05`) → Independent SoD Gate & "unverified stub" Lessons Crystallization (`S06`).
  - **Pattern 3 (Business Rule Variations)**: Approval to `DONE` with `GW-SOD-01` (`approver_id != lead_agent_id`) vs. Return-for-Rework spawning `TaskRun #(N+1)` and recording lessons in `open_office_lessons`.
  - **Pattern 4 (Data Variations / Scope)**: Single project (`?project_key=PM`) vs. full 30-project portfolio scope (`scope=portfolio`).
- **Slicing Rationale**: Decouples real PostgreSQL database agent querying from 2D pixel canvas rendering, live cognitive inspection, task delegation, execution outbox workers, and immutable audit trailing, while preserving canonical work-item tracking in `WorkItemsPage.tsx` (`UNIFIED_WORK_ITEMS_SWARM_DEDUP_362`).

---

## 3. Preconditions & Testable Guarantees

### Preconditions
1. **PostgreSQL Database SSOT (`ITSAPLAN_DB_URL`)**: Connected with real `itsaplan.ai_agent` rows joined with `public.user` (`id=1` `@antigravity`, `id=2` `@research`, `id=3` `@orchestrator`, `id=4` `@qualitygate`, `id=11` `@claude`, `id=12` `@codex`, plus registered team AI agents) and live active subagents in `~/.gemini/antigravity/brain/`.
2. **Deterministic Contract & Event Engine**: SQLite backing tables (`open_office_contracts`, `open_office_task_runs`, `open_office_event_log`, `open_office_lessons`) initialized with `BEFORE UPDATE` and `BEFORE DELETE` immutability triggers active.
3. **Session Authentication**: Authenticated Project / Team member accesses **AI Agents → Open Office** with `ai_agents:read` permission.

### Success Guarantee (Observable Post-Condition)
- **Zero Fake Agents**: 100% of rendered agents correspond to real registered AI agents and active subagents. Zero hardcoded placeholder rosters.
- **Intrinsic Canvas Dimensions**: Pixel canvas mounts with an intrinsic `960x560` resolution (`60x35` tiles, 16px/tile), guaranteeing non-zero bounding box across all viewport states.
- **8 Causal Rooms & Wooden Doorways**: Top rooms (`ba_tester` x=14%, `exec_hq` x=50%, `ai_dev` x=84% at y=35%) and bottom rooms (`academy` x=13%, `war_room` x=39%, `hr_ops` x=64%, `commercial` x=88% at y=65%) connect via visible wooden doorways into `central_lobby` (y=35..65%).
- **Causal State Placement**: `IDLE` agents relax in `central_lobby` (`Đại Sảnh Chung`); active agents walk along the corridor Waypoint Graph through the doorway to their causal room with desk tool micro-badges (`💻 Code`, `🔎 Search`, `📄 Doc`, `⚠️ Chờ duyệt`).
- **4-Tab Live Cognitive Inspector**: Clicking any sprite opens the Inspector with `<=6` controls per tab across `NOW`, `NEXT`, `MEMORY`, and `MODULES`.
- **Closed-Loop Execution & Delivery**: Dispatching a contract creates real `itsaplan.issue` + `agent_run`, emits live step events, produces deliverable markdown + `ev_<sha256>`, and surfaces in `"Hộp Cần tôi xử lý"`.
- **Audit & Lessons Preservation**: `APPROVE` moves issue to `Done` under `GW-SOD-01`; `RETURN_FOR_REWORK` (*"unverified stub"*) seals `TaskRun #N`, appends a lesson row to `open_office_lessons` (`room = 'academy'`), and spawns `TaskRun #(N+1)`.

### Minimum Guarantee (Failure / Rollback Safety Invariant)
- If `auto_draft_criteria=false` and criteria is empty, request fails closed with `ACCEPTANCE_CRITERIA_REQUIRED` (`HTTP 400`).
- Confidence outside `[0, 100]`, empty evidence submissions, self-approvals (`approver_id == lead_agent_id`), unverified criteria, or direct SQL tampering against `open_office_event_log` fail closed atomically with 0 state corruption.

---

## 4. Flow of Events — Basic Flow

### Basic Flow (Main Success Scenario)
1. **Mount Spatial Open Office & Query Real SSOT State**:
   - Operator navigates to **AI Agents → Open Office**.
   - Client sends `GET /api/vibe/open-office/state?project_key=PM&scope=project`.
   - Backend queries PostgreSQL SSOT (`itsaplan.ai_agent` JOIN `public.user`) and checks `~/.gemini/antigravity/brain/` for active subagents.
   - Client mounts the `960x560` canvas with 8 architectural rooms, wooden doorways, and active roster.
2. **Causal Room Placement & Corridor Waypoint Navigation**:
   - Backend evaluates active tasks/runs for each agent:
     - If `active_runs == 0`, agent is assigned `status = 'IDLE'` and positioned at a relaxation spot in `central_lobby` (`Đại Sảnh Chung`).
     - If `active_runs > 0`, agent is assigned causal room based on task domain: `ba_tester` (Spec/QA), `exec_hq` (Orchestration/Review), `ai_dev` (Coding), `war_room` (collaboration `>=2` agents or QualityGate), `academy` (Docs/Memory crystallization), `hr_ops` (Ops/Vault), or `commercial` (Analytics/CRM).
   - Sprites follow the corridor Waypoint Graph through the corresponding wooden doorway to their designated desk station, displaying appropriate desk micro-badges (`💻 Code`, `🔎 Search`, `📄 Doc`, `⚠️ Chờ duyệt`).
3. **Inspect Agent via 4-Tab Live Cognitive Inspector**:
   - Operator clicks any agent sprite on the canvas or card in the roster panel.
   - Live Cognitive Inspector slides open displaying 4 progressive tabs (`<=6` controls/tab):
     1. **`Đang làm (NOW)`**: Current status, room, active issue (`PM-xxxx`), live streaming steps/activity, elapsed time, and inline **Quick Steer (`POST /api/vibe/open-office/steer`)**.
     2. **`Sắp làm (NEXT)`**: Remaining WBS steps (`Step k..N`), queued `Todo`/`Backlog` issues, pending agent runs, upcoming `agent_schedule` cron entries, and 1-click **"Giao thêm việc"**.
     3. **`Đúc kết (MEMORY)`**: Total runs executed, rework lineage, committed vs. actual variance, and crystallized lessons from `open_office_lessons`.
     4. **`Liên kết phân hệ (MODULES)`**: 1-click verified portals to Work Items (`ShellCtx.onOpenIssue`), Direct 1:1 Chat (`ShellCtx.onChatWithAgent`), Docs/WeKnora (`ShellCtx.onOpenWeKnoraChat`), Inbox, Schedules, and Skills/MCP/Vault.
4. **Effortless 1-Card Multi-Agent Assignment & Auto-Draft Criteria**:
   - Operator clicks **"Giao việc mới"** or uses the inline quick-assign card.
   - Operator selects `1..N` target agents and inputs a natural goal (or links an existing `Todo` issue).
   - System invokes receiving agent capability to auto-draft testable `acceptance_criteria` (`auto_draft_criteria=true`) and self-commit `confidence_pct` (e.g., `94%`), `estimated_minutes` (`25`), and `estimated_tokens` (`12000`).
   - Operator clicks **"Phát lệnh thực hiện"** (`POST /api/vibe/open-office/contracts`).
5. **Real Closed-Loop Headless Execution & Deliverable Proof**:
   - Backend atomically creates/updates `itsaplan.issue` (`column = 'In Progress'`, `delegate_user_id = agent.user_id`), enqueues `itsaplan.agent_run`, and creates `open_office_contracts` (`status = 'IN_PROGRESS'`) + `open_office_task_runs` (`run_number = 1`).
   - Headless execution worker claims the run, emits live step events to `issue_activity` and `agent_chat_event`, and renders agent walking to causal room.
   - Upon completion, worker attaches deliverable markdown + evidence hash (`ev_<sha256>`) via `POST /api/vibe/open-office/evidence`.
   - Contract and run transition to `AWAITING_HITL`, moving the real issue to `Review` and immediately surfacing the card in `"Hộp Cần tôi xử lý"`.
6. **Review Awaiting-HITL Deliverable in "Hộp Cần tôi xử lý"**:
   - Operator opens `"Hộp Cần tôi xử lý"`, clicks the pending contract card, and inspects the attached markdown deliverable, acceptance criteria checklist, and evidence links.
7. **Independent SoD Approval (`GW-SOD-01`) & Variance Rollup**:
   - Independent approver (`approver_id != lead_agent_id`) checks off acceptance criteria (`acceptance_verified = true`), inputs actual minutes/tokens, and clicks **"Phê duyệt nghiệm thu"** (`POST /api/vibe/open-office/review` with `decision = 'APPROVE'`).
   - Backend validates `GW-SOD-01`, moves real `itsaplan.issue` to `Done`, sets contract to `DONE`, seals `TaskRun #1` (`APPROVED`), computes `committed_vs_actual` variance, appends `CONTRACT_APPROVED` event, and returns agent to `central_lobby`.

---

## 5. Alternate & Exception Flows

- **A1 — Missing Mandatory Acceptance Criteria & Confidence Out of Bounds (Step 4)**:
  - *Condition*: Caller submits contract with `auto_draft_criteria=false` and empty/whitespace `acceptance_criteria`, or `confidence_pct` not in `[0, 100]`.
  - *System Response*: Backend rejects with `ACCEPTANCE_CRITERIA_REQUIRED` or `INVALID_CONFIDENCE_PCT` (`HTTP 400`). Real issue and contract creation roll back atomically.
  - *Traceability*: → `@TC-UC010-S04` (`TC-UC010-10`, `TC-UC010-11`)
- **A2 — "unverified stub" Return-for-Rework Spawning `TaskRun #(N+1)` & Crystallizing Lessons (Step 7)**:
  - *Condition*: Approver finds hallucinated claims, missing proof, or unsatisfied criteria and submits `decision = 'RETURN_FOR_REWORK'` with explicit `reason`.
  - *System Response*: Backend marks `TaskRun #N` as `RETURNED_FOR_REWORK` preserving exact timestamp and reason; inserts a new row into `open_office_lessons` (`room = 'academy'`, `mistake_pattern`, `corrective_instruction`); spawns `TaskRun #(N+1)` (`IN_PROGRESS`); resets contract to `IN_PROGRESS`; transitions real issue back to `In Progress`; and appends `CONTRACT_RETURNED` + `RUN_STARTED` events.
  - *Traceability*: → `@TC-UC010-S06` (`TC-UC010-05`, `TC-UC010-17`)
- **A3 — Evidence Gate Block on Empty Proof Submission (Step 5)**:
  - *Condition*: Caller invokes `/api/vibe/open-office/evidence` with both `evidence_summary` and `evidence_links` empty or whitespace.
  - *System Response*: Backend fails closed with `EVIDENCE_REQUIRED` (`HTTP 400`). Run remains in `IN_PROGRESS` and cannot enter `AWAITING_HITL`.
  - *Traceability*: → `@TC-UC010-S05` (`TC-UC010-12`)
- **A4 — Segregation of Duties (`GW-SOD-01`) Self-Approval or Unverified Criteria Block (Step 7)**:
  - *Condition*: Review submitted where `approver_id == lead_agent_id` or `acceptance_verified == false`.
  - *System Response*: Backend raises `SegregationOfDutiesError` (`SOD_VIOLATION`, `HTTP 403`) or `ACCEPTANCE_NOT_VERIFIED` (`HTTP 400`). Contract remains in `AWAITING_HITL` with 0 state transition.
  - *Traceability*: → `@TC-UC010-S06` (`TC-UC010-13`, `TC-UC010-14`)
- **A5 — Direct SQL Tampering Against Append-Only Event Log (Any Step)**:
  - *Condition*: Any query attempts an `UPDATE` or `DELETE` on `open_office_event_log`.
  - *System Response*: SQLite triggers `trg_oo_event_no_update` and `trg_oo_event_no_delete` immediately raise `ABORT` with `APPEND_ONLY_VIOLATION`.
  - *Traceability*: → `@TC-UC010-S05` (`TC-UC010-15`)
- **A6 — Inactive Agent Selection or Unregistered Subagent (Step 1, 4)**:
  - *Condition*: Caller attempts to assign a task to an agent ID not present in `itsaplan.ai_agent` or whose user account is deactivated (`active = false`).
  - *System Response*: Backend rejects with `AGENT_NOT_FOUND_OR_INACTIVE` (`HTTP 404`).
  - *Traceability*: → `@TC-UC010-S01` (`TC-UC010-18`)
- **A7 — Live Quick Steer Intervention During Execution (Step 3, 5)**:
  - *Condition*: Operator notices divergent tool calls in the live step stream and posts a steering instruction via `POST /api/vibe/open-office/steer`.
  - *System Response*: Backend injects high-priority steer message into active runner context, records an `INLINE_STEER` event in `open_office_event_log`, appends an activity note to `issue_activity`, and updates agent thought bubble on canvas.
  - *Traceability*: → `@TC-UC010-S03` (`TC-UC010-19`, `TC-UC010-20`)

---

## 6. Use-Case Slices (`53.REF.112 §3.1 & Principle 10`)

| Slice ID | Slice Name & Delivery Increment Scope | Covered Flows | Slice State | Traceability (`FR` / `TC`) | Priority |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Slice S01** | **Real PostgreSQL SSOT Agent Binding & Scope Parameter (`?project_key=PM&scope=project\|portfolio`)** | `Basic Flow (Step 1)`, `A6` | `Verified` | `FR-053` · `→ TC: TC-UC010-01, 18` (`@TC-UC010-S01`) | `Must-Pass` |
| **Slice S02** | **8-Room Causal Floorplan, Wooden Doorways & Waypoint Graph (`960x560`, IDLE in Central Lobby, Causal Routing)** | `Basic Flow (Step 1, 2)` | `Verified` | `FR-053, FR-054` · `→ TC: TC-UC010-02, 16` (`@TC-UC010-S02`) | `Must-Pass` |
| **Slice S03** | **Click-on-Agent 4-Tab Live Cognitive Inspector (`NOW / NEXT / MEMORY / MODULES`) & Quick Steer** | `Basic Flow (Step 3)`, `A7` | `Verified` | `FR-055, FR-060` · `→ TC: TC-UC010-03, 19, 20` (`@TC-UC010-S03`) | `Must-Pass` |
| **Slice S04** | **Effortless 1-Card Multi-Agent Assignment, Auto-Draft Criteria & Real Issue/Run Bridge** | `Basic Flow (Step 4)`, `A1` | `Verified` | `FR-056` · `→ TC: TC-UC010-04, 10, 11` (`@TC-UC010-S04`) | `Must-Pass` |
| **Slice S05** | **Real Closed-Loop Headless Execution, Deliverables, `AWAITING_HITL` Inbox & Merkle Audit** | `Basic Flow (Step 5, 6)`, `A3, A5` | `Verified` | `FR-057, FR-060` · `→ TC: TC-UC010-06, 12, 15` (`@TC-UC010-S05`) | `Must-Pass` |
| **Slice S06** | **Independent SoD Review (`GW-SOD-01`), "unverified stub" Rework & `open_office_lessons` Crystallization** | `Basic Flow (Step 7)`, `A2, A4` | `Verified` | `FR-058, FR-059` · `→ TC: TC-UC010-05, 07, 13, 14, 17` (`@TC-UC010-S06`) | `Must-Pass` |
| **Slice S07** | **Zero-Duplication 3-in-1 Right Context Rail & `<= 2`-Step Executive JTBDs (`SPEC-53.ACT.505`)** | `Basic Flow (Steps 1–7)` | `Verified` | `FR-069..FR-074` · `→ TC: TC-UC010-21..24` (`@TC-UC010-S07`) | `Must-Pass` |
| **Slice S08** | **V62 3-Mode Spatial Sub-Tabs & Progressive V48 Bulk Dry-Run Dispatch (`btn-toggle-bulk-dispatch`)** | `Extended Spatial & Batch Flow` | `Active` | `FR-076` · `→ TC: TC-UC010-25, 29` (`@TC-UC010-S08`) | `Must-Pass` |
| **Slice S09** | **DB-Persisted Department Positions, Seat Assignments (`open_office_org_governance`), `S7` `10s` Undo & `/agents` `JTBD-4` Parity** | `Department Seat Governance & S7 Undo` | `Active` | `FR-075` · `→ TC: TC-UC010-26..28` (`@TC-UC010-S09`) | `Must-Pass` |
| **Slice S10** | **V45 Fullscreen Evidence Reader, V61 Interactive Criteria Ticking, Copy Slip & V43 8-Stage Badges** | `Extended Evidence & Contract Verification` | `Active` | `FR-076` · `→ TC: TC-UC010-30` (`@TC-UC010-S10`) | `Must-Pass` |

---

## 7. Concrete Test Case Mapping (`TC-UC010-01` .. `TC-UC010-30`)

| TC ID | Category | Target Component | Verification Summary | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| `TC-UC010-01` | Positive | `OpenOfficeContractEngine` | Query real PostgreSQL agents (`id=1, 2, 3, 4, 11, 12`) with `scope=project` | Returns real agents; 0 fake hardcoded stations |
| `TC-UC010-02` | Positive | `OpenOfficeWorkspaceView` | Canvas intrinsic dimensions check on mount | Dimension exactly `960x560` (`60x35` tiles); 8 rooms + wooden doorways |
| `TC-UC010-03` | Positive | `LiveInspector` | Open 4-tab Live Inspector on agent click | Tabs `NOW`, `NEXT`, `MEMORY`, `MODULES` mount with `<=6` controls/tab |
| `TC-UC010-04` | Positive | `OpenOfficeContractEngine` | 1-Card assignment with `auto_draft_criteria=true` | Real `itsaplan.issue` created + `agent_run` enqueued + criteria populated |
| `TC-UC010-05` | Positive | `OpenOfficeContractEngine` | Return for Rework (*"unverified stub"*) flow | Marks Run #1 `RETURNED_FOR_REWORK`, spawns Run #2, inserts `open_office_lessons` |
| `TC-UC010-06` | Positive | `OpenOfficeContractEngine` | Submit evidence and inspect `"Hộp Cần tôi xử lý"` | Contract transitions to `AWAITING_HITL` and surfaces in needs-my-action inbox |
| `TC-UC010-07` | Positive | `OpenOfficeContractEngine` | Independent SoD Approval (`approver_id != lead_agent_id`) | Real issue moves to `Done`, run marked `APPROVED`, variance computed |
| `TC-UC010-08` | Positive | `OpenOfficeContractEngine` | Event-log-reconciled analytics query | Returns aggregated metrics with `event_log_reconciled = true` |
| `TC-UC010-09` | Positive | `OpenOfficeContractEngine` | Scope parameter toggle `scope=portfolio` | Returns cross-project agent telemetry across all 30 portfolio projects |
| `TC-UC010-10` | Adversarial | `OpenOfficeContractEngine` | Create contract with `auto_draft_criteria=false` & empty criteria | Fails closed with `ACCEPTANCE_CRITERIA_REQUIRED` (`HTTP 400`) |
| `TC-UC010-11` | Adversarial | `OpenOfficeContractEngine` | Create contract with `confidence_pct = 105` or `-5` | Fails closed with `INVALID_CONFIDENCE_PCT` (`HTTP 400`) |
| `TC-UC010-12` | Adversarial | `OpenOfficeContractEngine` | Submit empty evidence summary and empty links | Fails closed with `EVIDENCE_REQUIRED` (`HTTP 400`) |
| `TC-UC010-13` | Adversarial | `OpenOfficeContractEngine` | Attempt self-approval (`approver_id == lead_agent_id`) | Raises `SegregationOfDutiesError` (`SOD_VIOLATION`, `HTTP 403`) |
| `TC-UC010-14` | Adversarial | `OpenOfficeContractEngine` | Approve with `acceptance_verified = false` | Fails closed with `ACCEPTANCE_NOT_VERIFIED` (`HTTP 400`) |
| `TC-UC010-15` | Adversarial | `OpenOfficeContractEngine` | Attempt direct SQL `DELETE` or `UPDATE` on `open_office_event_log` | SQLite trigger aborts with `APPEND_ONLY_VIOLATION` |
| `TC-UC010-16` | Positive | `OpenOfficeWorkspaceView` | Deterministic causal room placement logic | `IDLE` agents placed in `central_lobby`; active coding agents in `ai_dev` |
| `TC-UC010-17` | Positive | `OpenOfficeContractEngine` | Verify `open_office_lessons` schema and query in Academy room | Lesson row queryable by agent ID with `room = 'academy'` |
| `TC-UC010-18` | Adversarial | `OpenOfficeContractEngine` | Assign task to inactive or non-existent agent ID | Fails closed with `AGENT_NOT_FOUND_OR_INACTIVE` (`HTTP 404`) |
| `TC-UC010-19` | Positive | `OpenOfficeContractEngine` | Quick Steer dispatch during active execution | Injects steer message into runner context + appends `INLINE_STEER` event |
| `TC-UC010-20` | Positive | `LiveInspector` | Verified 1-click cross-module navigation portals in tab 4 | Portals trigger correct shell navigation hooks (`onOpenIssue`, `onChatWithAgent`) |

---

## 8. Revision History
- **2026-11-09 (`53.ACT.499`)**: Version 1.0.0 — Initial Use Case 3.0 specification from `ChomSkill` REA decompilation (`ev_a05c5e4f...`) of *Phòng làm việc mở V30* and verified across `64/64` Python `pytest` + `3/3` Bun unit tests + Layer 0 `GW-UIUX-01` (`1.00`).
- **2026-11-09 (`53.ACT.500`)**: Version 2.0.0 — Exhaustive Runnable MVP specification: Bound 100% to real PostgreSQL SSOT (`itsaplan.ai_agent` joined with `public.user` and active subagents; zero fake hardcoded stations); 8-room causal state machine with wooden doorways and corridor waypoint graph; click-on-agent 4-tab Live Cognitive Inspector (`NOW / NEXT / MEMORY / MODULES`); effortless 1-card multi-agent assignment with auto-drafted criteria; real closed-loop execution linking `itsaplan.issue` + `agent_run`; and independent `GW-SOD-01` review with *"unverified stub"* rework lineage recorded in `open_office_lessons` (`Đào Tạo`).

---

## 8. Multi-Project Filter (`30 Projects`) & Linked Department Use Cases (`UC-011..UC-018`)

- **Multi-Project Filter & Per-Agent `[PROJECT_KEY]` Attribution (`FR-053`, `FR-061`)**: Operator filters Open Office by `ALL` (`Toàn bộ 30 dự án`) or any specific `itsaplan.project` (`PM`, `JH`, `GSA`, `ASM`, `MHR`, `MISA`, `VER`, `CANH`, `ALM`, etc.). Every agent sprite pill and inspector tab (`NOW` / `NEXT`) displays exact `[PROJECT_KEY]` badges showing which project(s) each agent is actively executing or scheduled/queued on.
- **Clickable Department Rooms (`UC-011..UC-018`)**:
  - `UC-011` (`Phòng Điều Hành` / `exec_hq` — `FR-061`): Phòng Điều Hành — Portfolio Steering, 30-Project Resource Filter & Tier-2 SoD Governance -> Portals: `/{teamRef}/{projectKey}/initiatives`, `/{teamRef}/{projectKey}/cycles`, `/{teamRef}/{projectKey}/dashboards`, `/{teamRef}/{projectKey}/inbox`
  - `UC-012` (`BA-Tester` / `ba_tester` — `FR-062`): Phòng BA-Tester — UTOP Specification Authoring, MinTC Verification & QualityGate (`EAI >= 0.98`) -> Portals: `/{teamRef}/{projectKey}/docs`, `/{teamRef}/{projectKey}`, `/{teamRef}/{projectKey}/settings/issue-templates`, `/{teamRef}/{projectKey}/settings/issue-types`
  - `UC-013` (`AI-Dev` / `ai_dev` — `FR-063`): Phòng AI-Dev — Autonomous TDD Engineering, Live Run Streaming & Cron Schedule Execution -> Portals: `/{teamRef}/{projectKey}`, `/{teamRef}/{projectKey}/agents`, `/{teamRef}/{projectKey}/agents/schedules`, `/{teamRef}/{projectKey}/mcp`
  - `UC-014` (`Đại Sảnh Chung` / `central_lobby` — `FR-064`): Đại Sảnh Chung — Truthful Standby Lounge, Project Backlog Intake & Instant Idle Agent Dispatch -> Portals: `/{teamRef}/{projectKey}/inbox`, `/{teamRef}/{projectKey}`, `#shell-chat-panel`, `/{teamRef}/{projectKey}/notifications`
  - `UC-015` (`Đào Tạo` / `academy` — `FR-065`): Phòng Đào Tạo — "unverified stub" Rework Lesson Crystallization, WeKnora Memory & Agent Skill Evolution -> Portals: `/{teamRef}/{projectKey}/docs`, `#weknora-memory`, `/{teamRef}/settings/agent-skills`, `/{teamRef}/{projectKey}/onboarding`
  - `UC-016` (`Phòng Họp` / `war_room` — `FR-066`): Phòng Họp — Multi-Agent Swarm Collaboration, Blocker Escalation & Kara Meeting Action Sync -> Portals: `/{teamRef}/{projectKey}/notes`, `/{teamRef}/{projectKey}/vibe`, `#shell-chat-panel`, `/{teamRef}/{projectKey}/inbox`
  - `UC-017` (`HCNS` / `hr_ops` — `FR-067`): Phòng HCNS — Hybrid Human-AI Roster Telemetry, RBAC Governance, FinOps & Secret Vault Custody -> Portals: `/{teamRef}/{projectKey}/members`, `/{teamRef}/{projectKey}/vault`, `/{teamRef}/settings/roles`, `/{teamRef}/settings/ai-agents`
  - `UC-018` (`Kinh Doanh` / `commercial` — `FR-068`): Phòng Kinh Doanh — Portfolio Client Delivery SLA, Value-Stream Dashboards & Outbound Webhooks/API -> Portals: `/{teamRef}/{projectKey}/dashboards`, `/{teamRef}/{projectKey}/initiatives`, `/{teamRef}/{projectKey}/settings/webhooks`, `/{teamRef}/{projectKey}/api`

---

## 9. Gather.town (`https://www.gather.town/`) Spatial Design System (`v2.2` — `53.ACT.501`)
- **Cryptographic REA Provenance (`VERIFIED_GROUND_TRUTH`)**: `ev_25ddf4c794acb3f6e10c3cf1511b49d3d60b53449e8631324c030af49d58afbd` (`app.gather.town/main.c54d7ddf0f090979362a.js` 3.61MB bundle + `main.98114bf45cfa25c7d4cf.css` + 2190×1873 Gather HQ floorplan + `gathertown/mapmaking`).
- **Architectural & Surface Parity**:
  1. **Warm Birch Open-Plan Floor & `DeskIsland` Pods**: Open Scandinavian birch plank floor (`#EFE4D9`) with mint-sage exterior garden courtyard (`#D9EFDA`), open `DeskIsland` woven slate carpets (`#94A3A8`) with frosted rounded-full pod headers, periwinkle-violet social lounge rugs (`#8E9EDB`) + ice-lattice cafe tile (`#DCE4F2`) with peach tufted couches (`#F4CAAC`) & ping-pong table (`#58B07D`), and 3/4 periwinkle-slate enclosed focus suites (`#7A7DB2` / `#5F6772`).
  2. **Compact Single-Line Gather Nametags (`#27262A`) & Chibi 32×48 Outlined Avatars**: Unobstructive single-line `#27262A` rounded-full nametags with Gather 3-state presence grammar (`🎧 Busy` `#D97724` focus border, `🟠 Away` `#E07A22` hollow ring, `🟢 Active` `#17B26A` solid dot) and hover/selected `💡 Deep focus` status popover.
  3. **Gather 2.0 Chrome & Spatial Controls**: Floating `#202540` Bottom `ActionBar` dock (`gather-bottom-action-bar`), `Pixel Art` ↔ `Simplified Radar` floorplan switcher (`gather-view-mode-toggle`), live corner `MiniMap` (`gather-minimap-overlay`), `PrivateSpace` spotlight dimming on active zone, and collapsible Left `People & Spaces` directory (`gather-people-sidebar`) with 1-click `🎯 Locate`.

<!-- UTOP_53_ACT_505_HARNESS_V320_ZERO_DUP_JTBD -->
## 8. Version 2.4.0 Upgrade ? Zero-Duplication Split-Shell Cockpit & Sub-3-Step (`<= 2`-Step) JTBD (`SPEC-53.ACT.505`)
- **Slice S07 (`Zero-Duplication 3-in-1 Right Context Rail & <= 2-Step Executive JTBDs`)**:
  - Eliminates duplicate `department-pills-row`, duplicate `8 KHU V?C` sidebar grid, duplicate `[PM]` filter button, duplicate composer project dropdown, and duplicate `Giao vi?c nhanh` dock button.
  - Unifies `gather-people-sidebar` (`6`-agent roster pills), Dual-Mode 4-Tab Live Inspector, and 2-Step Inline Quick Dispatch (`input-contract-title` + `btn-submit-open-office-contract` above the fold at `0px` scroll) in a non-overlapping Right Context Rail preserving `canvas_height / vh >= 0.56` and 4-quadrant unoccluded pixel art.
  - Reconciles `get_analytics_v2()` (`0` `NaN`), enforces fail-closed `open-office-error-banner` on `GW-SOD-01` HTTP `400/403`, and achieves `WCAG >= 4.5:1` across Light & Dark themes.
  - **Traceability**: `FR-061`, `FR-064`, `FR-065`, `FR-066` -> `TC: TC-UC010-21..TC-UC010-24`.

---

## 10. Version 2.5.0 Upgrade — Slices S08..S10, DB Seat Persistence, S7 10s Undo & Progressive V45/V48/V61/V62 Workflows (SPEC-53.ACT.604)

- **Slice S08 (`FR-076` — V62 3-Mode Spatial Sub-Tabs & V48 Bulk Dry-Run Dispatch)**: Introduces `OfficeSubTabs` (`Bản đồ`, `Vị trí Phòng ban`, `Thiết lập Nhân sự`) and `OfficeBulkDispatchPanel` (`btn-toggle-bulk-dispatch` collapsed by default, auto-expands on focus, runs dry-run preview & batch contract issuance via `dispatchContractPayload`).
- **Slice S09 (`FR-075` — DB-Persisted Department Positions, AI Seat Assignments & `S7` `10s` Undo)**: Persists department positions and seat bindings in `open_office_org_governance` (`POST /api/vibe/open-office/dept-positions`, `POST /api/vibe/open-office/seat-assignments`, `GET /api/vibe/open-office/governance`), enforces `/agents` `JTBD-4` seat-chip parity (`<= 76px` banner), and wires `showUndoToast(..., { durationMs: 10_000 })` on `handleRemovePosition` and `handleUnseatAgent`.
- **Slice S10 (`FR-076` — V45 Fullscreen Evidence Reader, V61 Interactive Criteria Ticking, Copy Slip & V43 8-Stage Badges)**: Adds `EvidenceFullscreenReader`, interactive per-criterion checkboxes (`checkedCriteriaMap`), 1-click `handleCopyContractSlip`, and 8-stage `DETAILED_STAGE_META` badges across Open Office cards.

<!-- AST-GEN:POST592-OPENOFFICE:START -->
## 11. Version 2.6.0 Convergence — Dual Beehive/Atlas Canvas, Command Palette, Org Chart & Copilot Dock (`53.ACT.633`)

- **Visual Spatial Lenses (`WBS 1.4.5`)**: `BeehiveColonyLens`, `pixelBeehiveEngine`, and `limezuAtlasEngine` render live agent activity over `public/open-office/atlas.png` alongside `OfficeSubTabs`, `OfficeBulkDispatchPanel`, `OfficeDeptPositionsTab`, `OfficeStaffSetupTab`, and `EvidenceFullscreenReader`.
- **Global Command & Org Hierarchy (`WBS 1.6.2.2`, `WBS 2.2.2`)**: `OpenOfficeCommandPalette`, `GlobalQuickActions`, `WeKnoraCopilotDock` (`itsaplan:work-items-updated`), `ChatPanel`, and `/[teamRef]/settings/org-chart` (`OrgTeamsBody`, `TeamOrgChartSection`, `OrgChartInspectorDrawer`).
- **UI Truncation & Analytics Contract (`53.ACT.645`)**: Board API uses column-fair `ROW_NUMBER()` caps (`200`/active col, `100`/terminal col) returning `{ issues, totalCount, truncated, columnTotals }`; `StatWidget` queries server-side `/analytics/stats` & `POST /analytics/stat-count` (`archived_at IS NULL`); standalone `/[teamRef]/timeline` uses `liveIssues=[]` outside project scope.
<!-- AST-GEN:POST592-OPENOFFICE:END -->
