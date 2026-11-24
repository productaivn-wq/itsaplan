@UC-010
Feature: Open Office Spatial Telemetry, Task Contract Composer & Immutable Evidence Gate
  As the Executive Operator (HUM) and Sovereign AOP Agent Fleet (AGT)
  I want an 8-zone spatial Open Office floorplan backed by deterministic SQLite Task Contracts, 1:N TaskRuns, an immutable SHA-256 Event Log, and an independent SoD Evidence Gate
  So that multi-agent delegation achieves live situational awareness and P=1 execution accountability without duplicating canonical Kanban boards.

  Background:
    Given OpenOfficeContractEngine SQLite tables and append-only triggers are initialized
    And the operator opens the ACCORD "Open Office" mode in ProjectAiAgentsSection

  @TC-UC010-S01 @FR-053 @Positive
  Scenario: Project 8 spatial office zones, fixed and reserve agent stations, and office mascots
    When the client requests "/api/vibe/open-office/state"
    Then 8 architectural office zones from "Phòng Điều Hành" to "Kinh Doanh" are returned with station coordinates
    And ambient office mascots "Cậu Vàng" and "Tiểu Thư" are projected in "Đại Sảnh Chung"

  @TC-UC010-S02 @FR-054 @Positive @Negative
  Scenario Outline: Enforce mandatory acceptance criteria and confidence bounds on Task Contract creation
    When an operator submits a Task Contract with template "<template_id>", criteria "<criteria>", and confidence <confidence_pct>
    Then the contract creation outcome is "<outcome>" with status or error code "<code_or_status>"

    Examples:
      | template_id       | criteria                                  | confidence_pct | outcome | code_or_status               |
      | research_citation | Đủ trích dẫn mã bằng chứng ev_<sha256>     | 92             | PASS    | IN_PROGRESS                  |
      | code_tdd_delivery |                                           | 85             | REJECT  | ACCEPTANCE_CRITERIA_REQUIRED |
      | doc_synthesis     | Đạt chuẩn Layer 0 GW-UIUX-01 = 1.00       | 135            | REJECT  | INVALID_CONFIDENCE_PCT       |

  @TC-UC010-S03 @FR-055 @FR-056 @Stateful @Adversarial
  Scenario: Preserve 3 chronological TaskRuns across rework returns and block event log mutation
    Given valid Task Contract "OOC-0001" is active on TaskRun 1
    When execution proof is submitted and HUM returns "OOC-0001" for rework twice with explicit return reasons
    Then contract detail preserves 3 ordered TaskRuns (1 RETURNED_FOR_REWORK, 2 RETURNED_FOR_REWORK, 3 IN_PROGRESS)
    And the SHA-256 event hash chain validates intact ("is_chain_valid" = true)
    And any direct SQL UPDATE or DELETE on "open_office_event_log" aborts with "APPEND_ONLY_VIOLATION"

  @TC-UC010-S04 @FR-057 @Governance @Security
  Scenario: Surface AWAITING_HITL contracts in Needs-My-Action and enforce Evidence Gate plus GW-SOD-01
    Given contract "OOC-0002" assigned to "@research" submits non-empty proof artifacts
    Then "OOC-0002" appears in "Hộp Cần tôi xử lý" ("needs_my_action") with status "AWAITING_HITL"
    When "@research" attempts to self-approve "OOC-0002"
    Then review fails closed with SegregationOfDutiesError "SOD_VIOLATION"
    When independent approver "hum-phuong-vo" approves with "acceptance_verified" = true and actual effort metrics
    Then "OOC-0002" transitions to "DONE" with "committed_vs_actual" variance computed

  @TC-UC010-S05 @FR-058 @Analytics
  Scenario: Reconcile Performance Analytics v2 100 percent against the append-only event log
    When the client queries "/api/vibe/open-office/analytics"
    Then "event_log_reconciled" is true and total event counts match "open_office_event_log" exactly

  @TC-UC010-S06 @FR-059 @Positive
  Scenario: Project real sovereign agent fleet with zero fake sprites and scope toggling
    When the client requests "/api/vibe/open-office/state" in "PM" project scope
    Then exactly real sovereign agents "@antigravity", "@research", "@orchestrator", "@qualitygate", "@claude", "@codex" and live brain subagents are projected
    And zero fake crowd sprites or CROWD_EXTRA_STATIONS are present on the 960x560 canvas
    And the operator can toggle scope between "PM" project and portfolio "30 projects"

  @TC-UC010-S06 @FR-059 @Positive
  Scenario: Open 4-Tab Click-on-Agent Live Inspector with Layer 0 Rule-of-6 bounds
    When the operator clicks on agent station for "@orchestrator"
    Then the 4-Tab Live Inspector opens with tabs "Đang làm (NOW)", "Sắp làm (NEXT)", "Đúc kết (MEMORY)", and "Liên kết phân hệ (MODULES)"
    And each tab renders at most 6 items obeying Layer 0 Rule-of-6
    And "Đang làm" surfaces the active issue, agent run, live activity status, and Quick Steer action
    And "Sắp làm" surfaces ordered WBS steps, queued issues, and agent_schedule cron jobs

  @TC-UC010-S06 @FR-059 @Navigation
  Scenario: Resolve Cross-Module Hub deep links to verified live ItsAPlan routes
    Given the 4-Tab Live Inspector is open on tab "Liên kết phân hệ (MODULES)"
    Then all cross-module actions link to verified live ItsAPlan routes:
      | Module Name          | Target Route / Action                                   |
      | Work Items Board     | /:teamRef/:projectKey                                   |
      | Issue Detail         | /:teamRef/issue/:identifier & ShellCtx.onOpenIssue      |
      | 1:1 Direct Chat      | ShellCtx.onChatWithAgent(:agentId)                      |
      | Docs & WeKnora       | /:teamRef/:projectKey/docs & ShellCtx.onOpenWeKnoraChat |
      | Inbox                | /:teamRef/:projectKey/inbox                             |
      | Schedules            | /:teamRef/:projectKey/agents/schedules                  |
      | Skills / MCP / Vault | /:teamRef/settings/agent-skills, /mcp, /vault           |
    And zero dead links or unmounted routes are present

  @TC-UC010-S06 @FR-060 @Workflow
  Scenario: Dispatch 1-Card Multi-Agent Delegation with auto-drafted criteria and headless execution
    When the operator inputs goal intent "Triển khai gateway kiểm tra AST Scion Ledger" to "@codex" via 1-Card Delegation
    Then "@codex" auto-drafts 3 acceptance criteria, computes confidence 95 percent, estimated 25 minutes, and 8500 tokens
    And a canonical itsaplan.issue and agent_run are created atomically in PostgreSQL SSOT
    And the headless runner claims and executes the run, transitioning to "AWAITING_HITL"

  @TC-UC010-S06 @FR-060 @Rework
  Scenario: Execute 1-Line "Fix mõm" rework, crystallize lesson in Đào Tạo, and route via Doorway Waypoint Graph
    Given contract "OOC-0003" is in "AWAITING_HITL"
    When the approver inputs 1-line rework directive "Fix mõm: Luôn kiểm tra bounds GW-EFF-01 trước khi parse AST"
    Then a reusable lesson is crystallized in "open_office_lessons" under zone "Đào Tạo"
    And contract "OOC-0003" spawns TaskRun 2 in "IN_PROGRESS"
    And the Wooden Doorway & Corridor Waypoint Graph routes agent movement to "Đào Tạo" with zero (0,0) canvas collapse

  @language
  Scenario: All Open Office governance labels render clean NFC Vietnamese text
    Given OpenOfficeWorkspaceView is mounted in ACCORD v3.3.0
    Then all visible Vietnamese governance labels render in valid UTF-8 NFC with zero mojibake sequences

  @responsive
  Scenario: Progressive 3-Step Contract Composer obeys Layer 0 Rule-of-6 and responsive viewport bounds
    Given the viewport is 375x667
    When the operator steps through the 3-Step Contract Composer
    Then each step renders at most 4 form controls with minimum 12px typography and zero horizontal overflow

  @TC-UC010-21 @TC-UC010-22 @SPEC-53.ACT.505
  Scenario: Dispatch task in at most 2 steps at 0px scroll in the Zero-Duplication Split-Shell Cockpit
    Given "/thanb/PM/open-office" mounts the non-overlapping 3-in-1 Right Context Rail without "department-pills-row"
    When the operator enters a goal in above-the-fold "input-contract-title" and clicks "btn-submit-open-office-contract"
    Then the contract transitions to "IN_PROGRESS" in at most 2 steps with 0px vertical scroll

  @TC-UC010-25 @TC-UC010-29 @TC-UC010-S08 @SPEC-53.ACT.604
  Scenario: V62 3-mode spatial sub-tabs and progressive V48 bulk dry-run dispatch
    Given "/thanb/PM/open-office" mounts "OfficeSubTabs" and "OfficeBulkDispatchPanel" collapsed by default
    When the operator opens "btn-toggle-bulk-dispatch", previews dry-run validation, and dispatches valid batch tasks
    Then valid batch contracts enter "IN_PROGRESS" while invalid zone or blank position payloads fail closed with HTTP 400

  @TC-UC010-26 @TC-UC010-27 @TC-UC010-28 @TC-UC010-S09 @SPEC-53.ACT.604
  Scenario: Persist department positions and AI seat assignments in DB with S7 10s Undo and /agents parity
    Given "open_office_org_governance" stores department positions and AI station seat bindings
    When the operator edits a position, assigns a seat, or triggers "handleRemovePosition" / "handleUnseatAgent"
    Then changes persist across reloads, sync seat chips on "/agents", and arm a 10s Undo toast via "showUndoToast"

  @TC-UC010-30 @TC-UC010-S10 @SPEC-53.ACT.604
  Scenario: V45 fullscreen evidence inspection, V61 interactive criteria ticking, copy slip, and V43 8-stage badges
    Given a contract in "SUB-VIEW 2" includes acceptance criteria and submitted proof artifacts
    When the operator ticks criteria checkboxes, copies the contract slip, and opens "EvidenceFullscreenReader"
    Then the contract slip is copied cleanly, 8-stage badges render accurately, and evidence opens in fullscreen
