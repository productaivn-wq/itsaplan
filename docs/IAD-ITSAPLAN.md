<!-- UTOP_53_ACT_505_HARNESS_V320_ZERO_DUP_JTBD -->
# Master IAD Specification (`IAD-ITSAPLAN.md` v4.0.0): ItsAPlan / ACCORD Unified Workspace

> **Governance Identity**: `SPEC-53.ACT.505` · `SPEC-53.ACT.549` · `SPEC-53.ACT.550` (`Artifact #18`, `STATUS: LOCKED`, `version: 4.0.0`)  
> **Mental Model & Connected Architecture**: Built around **6-JTBD** (`JTBD-1 Triage` -> `JTBD-2 Deliver` -> `JTBD-3 Knowledge` -> `JTBD-4 Supervise` -> `JTBD-5 Configure` -> `JTBD-6 Govern`) + Contextual Copilot & Guide Utilities (`2.1`–`2.3`). Follows 3NF modularity: this Master Hub connects the canonical WBS tree in [iad.md](./iad.md), the **5 connected `.md`/`.csv` catalogs** (`25` core WBS Views / `58` Active App Views, `19` Forms, `47` Buttons, `21` Filters, `44` Notices = **209 WBS nodes**), and the **6 governed IAD authoring prompts**.

---

## 1. Identity, Scope & Master Cross-Document Traceability Map

- **Specification ID**: `IAD-ITSAPLAN` (`v4.0.0`)
- **Primary Actors & Section 1.0.1 Landing Routes**:
  - `Owner` -> `/[teamRef]/[projectKey]/open-office` (`1.4`, `1.6`)
  - `Admin / Project Manager` -> `/[teamRef]/[projectKey]/dashboards` (`1.2`, `1.5`)
  - `Member` -> `/[teamRef]/[projectKey]` (`1.2.1` Board, `1.3` Docs, `2.1` Copilot)
  - `Viewer` -> `/[teamRef]/[projectKey]/inbox` (`1.1` Read-only Triage & Dashboards)
  - `AI Agent` -> Runner Queue & Open Office (`1.4.2`, `1.5.2`)
- **Hard Architectural Invariants**:
  - **Rule of 6 (Miller's Law)**: Max children under any WBS node = **`6` (`< 7`)**; all Views/Forms show **`<= 6`** attributes.
  - **Chat Stream Isolation (`UCBDDManager:iad_generator`)**: Layout `2.1` omits nested `Navigations`, `Features`, and `Tabs`.
  - **Zero-Duplication & Zero-Jargon Chrome (`SPEC-53.ACT.505` + `SPEC-53.ACT.550`)**: Single spatial floor surface (`PixelOfficeCanvas` docked with `>=32px` hit targets, `<=1.5px` header/sidebar divider offset), zero raw `AWAITING_HITL`/`needs_my_action`/`GW-SOD-01` tokens in primary UI chrome.

| Layer / Artifact Family | Markdown Deliverable | Machine-Readable / Schema Counterpart | Authoring Prompt & Cross-Reference |
| :--- | :--- | :--- | :--- |
| **General WBS IAD (3NF Spine)** | [iad.md](./iad.md) (`209` nodes) | [utop_state.json](./utop_state.json) · [traceability.db](../.agent/traceability.db) | [IAD_AUTHORING_PROMPT.md](./IAD_AUTHORING_PROMPT.md) |
| **1. Views Catalog (`Views`)** | [iad_views.md](./iad_views.md) (`25` views) | [iad_views.csv](./iad_views.csv) | [IAD_VIEW_LIST_PROMPT.md](./IAD_VIEW_LIST_PROMPT.md) -> [erd.md](./erd.md) |
| **2. Forms Catalog (`Forms`)** | [iad_forms.md](./iad_forms.md) (`19` forms) | [iad_forms.csv](./iad_forms.csv) | [IAD_FORM_LIST_PROMPT.md](./IAD_FORM_LIST_PROMPT.md) -> [FIELD_PERMISSION_MATRIX.md](./FIELD_PERMISSION_MATRIX.md) |
| **3. Buttons Catalog (`Buttons`)** | [iad_buttons.md](./iad_buttons.md) (`47` actions) | [iad_buttons.csv](./iad_buttons.csv) | [IAD_BUTTON_LIST_PROMPT.md](./IAD_BUTTON_LIST_PROMPT.md) -> [STATUS_ACTION_MATRIX.md](./STATUS_ACTION_MATRIX.md) & [function_list.md](./function_list.md) |
| **4. Filters Catalog (`Filters`)** | [iad_filters.md](./iad_filters.md) (`21` filters) | [iad_filters.csv](./iad_filters.csv) | [IAD_FILTER_LIST_PROMPT.md](./IAD_FILTER_LIST_PROMPT.md) -> [iad_views.md](./iad_views.md) |
| **5. Notices Catalog (`Notices`)** | [iad_notices.md](./iad_notices.md) (`44` notices) | [iad_notices.csv](./iad_notices.csv) | [IAD_NOTICE_LIST_PROMPT.md](./IAD_NOTICE_LIST_PROMPT.md) -> [function_rules.md](./function_rules.md) |
| **Upstream UTOP Specifications** | [UC-001](./UC-001_project_and_board_lifecycle.md)..[UC-018](./UC-018_dept_commercial_value_streams_sla_and_webhooks.md) | [functional_requirements.md](./functional_requirements.md) (`FR-001..FR-076`) | [traceability_matrix.md](./traceability_matrix.md) · [TC-SPECS.md](./TC-SPECS.md) |

---

## 2. Canonical WBS Navigation & Component Tree (Synchronized with `iad.md`)

Root `1.` structures the **6-JTBD** left sidebar inside `/[teamRef]/[projectKey]/*`; Root `2.` structures contextual AI Chat, Progressive Workflow Guide, and Authentication/Preferences:

```text
1. / (Navigations - Sidebar Navigation) / ACCORD Daily Workspace Navigation / 1. Guides operators chronologically through all 6 Jobs-to-be-Done (JTBD-1 Triage through JTBD-6 Govern) inside /[teamRef]/[projectKey]; 2. Triggered by the persistent left sidebar paired with Section 1.0.1 Role-Based Landing Route Resolution under FR-001, FR-061..FR-066; 3. Select any active step group (Workspace or AI Operations) to open the single canonical destination surface.
  1.1. / (Features - Functional Feature Module) / JTBD-1 Triage & Notifications Hub / 1. Aggregates unread mentions, agent handoffs, and items awaiting approval so operators decide before acting; 2. Triggered via Sidebar Inbox (/[teamRef]/[projectKey]/inbox) or Viewer default landing under UC-004, UC-014, FR-004, FR-061; 3. Inspect prioritized items, mark read or snooze in <= 2 steps, and resolve pending reviews cleanly.
    1.1.1. / (Tabs - Navigation Tabs) / Unified Triage Inbox Tab / 1. Presents the primary actionable inbox feed alongside a contextual Open Office handoff bridge banner; 2. Activated on initial Inbox entry under FR-004 and SPEC-53.ACT.550 plain-language copy rules; 3. Triage each feed item in place or jump to waiting approvals.
      1.1.1.1. / (Layouts - Workspace Layout (Main + Detail)) / Triage Split-Pane Layout / 1. Pairs the scrollable notification feed on the left with a contextual inspector pane and waiting-approval bridge bar above the fold; 2. Enforces zero raw enum leaks (no AWAITING_HITL or needs_my_action strings); 3. Select any row to preview payload and execute triage actions.
        1.1.1.1.1. / (Views - Feed View) / Prioritized Triage Queue View / 1. Lists unread notifications and agent handoffs with <= 6 concise attributes (strictly Rule of 6); 2. Loaded from GET /notifications and GET /notifications/unread under FR-004; 3. Filter urgent approvals, read context, or mark resolved.
          1.1.1.1.1.1. / (Filters - Quick Filter) / Approval & Mention Scope Filter / 1. One-click scope pills separating unread items from awaiting approvals and snoozed threads; 2. Updates query filter against GET /notifications; 3. Click a pill to refocus the triage feed.
          1.1.1.1.1.2. / (Filters - Search Bar Filter) / Triage Keyword Search / 1. Inline keyword filter matching actor name, project ref, or issue reference; 2. Debounced client/API query over notification records; 3. Type query or clear input to restore full feed.
          1.1.1.1.1.3. / (Buttons - Top Button) / Mark All Read Action / 1. Header bulk action clearing read badges across active notifications; 2. Calls POST /notifications/read-all under UC-004; 3. Click once to zero unread counters safely.
          1.1.1.1.1.4. / (Buttons - Inline Button) / Snooze or Resolve Item Action / 1. Per-row inline control to acknowledge or snooze a notification until later; 2. Invokes POST /notifications/:id/read or /snooze; 3. Click icon button or press Undo toast within 10s.
          1.1.1.1.1.5. / (Notices - Warning Banner) / Pending Approvals Waiting Notice / 1. Top bridge banner (`inbox-hitl-bridge-bar`) alerting operators to open approval items in plain language; 2. Rendered automatically when pending approval contracts > 0 under SPEC-53.ACT.550; 3. Click the CTA to review in Open Office.
        1.1.1.1.2. / (Views - Detail View) / Triage Handoff Context Inspector / 1. Right-hand detail preview displaying linked agent contract or issue summary; 2. Populated from selected notification issueId/contract reference; 3. Read confidence and evidence summary, then act or escalate.
          1.1.1.1.2.1. / (Buttons - Redirect Button) / Open Open-Office Review Queue Button / 1. Direct bridge CTA navigating from Inbox approvals banner to the Open Office contracts review tab; 2. Routes via openOfficePath(ref) with sub-150ms navigation; 3. Click to inspect proof links and approve or request rework.
          1.1.1.1.2.3. / (Notices - Action Confirmation Notice) / Triage Action Confirmed Notice / 1. Non-blocking S7 confirmation toast with 10s undo buffer after triage actions; 2. Triggered on HTTP 200 response from notification endpoints; 3. Dismiss automatically or click Undo.
    1.1.2. / (Tabs - Navigation Tabs) / Notification Channels & Digests Tab / 1. Manages outbound Telegram/Email delivery preferences and inspects dispatch audit history; 2. Accessed via Notifications & Channel settings tab under UC-004; 3. Toggle per-channel events and inspect delivery errors.
      1.1.2.1. / (Layouts - Single Column Layout) / Channel Delivery Layout / 1. Stacks preference toggles above the bounded delivery log table for clear cause-effect inspection; 2. Preserves single-column responsive geometry; 3. Save channel toggles and verify delivery rows.
        1.1.2.1.1. / (Views - Table View) / Notification Delivery Log View / 1. Read-only operational table tracking channel dispatches, retry counts, and failures; 2. Reads notification_delivery rows per project under UC-004; 3. Inspect failed deliveries or filter by channel.
          1.1.2.1.1.1. / (Filters - Standard Filter) / Channel & Delivery Status Filter / 1. Dropdown selectors filtering delivery logs by channel and delivery state; 2. Refines table rows deterministically; 3. Select Failed to audit retry queue.
          1.1.2.1.1.2. / (Notices - Error Toast) / Channel or Inbox Sync Failure Notice / 1. Explicit S6 recovery toast shown when notification sync or external channel dispatch errors; 2. Triggered on API error or exhausted retry attempts; 3. Click Retry or fix Telegram credential.
        1.1.2.1.2. / (Forms - Standard Form) / Notification Preference Form / 1. Compact 3-field preference editor controlling per-project Email and Telegram alert subscriptions; 2. Syncs via PUT /projects/:projectKey/notification-preferences; 3. Toggle desired channels and click Save.
          1.1.2.1.2.1. / (Buttons - CTA Button) / Save Channel Preferences Button / 1. Primary save CTA committing channel notification rules; 2. Dispatches PUT /projects/:projectKey/notification-preferences with disabled state during S4 in-flight; 3. Click to apply changes.
  1.2. / (Features - Functional Feature Module) / JTBD-2 Work Items Delivery & Planning / 1. Coordinates backlog execution, Kanban boards, H1-H7 Timeline dependencies, sprint cycles, initiatives, and telemetry dashboards; 2. Accessed via Workspace group routes (/[teamRef]/[projectKey]/*) under UC-001, UC-002, UC-005, UC-008, FR-001..FR-015, FR-037..FR-048; 3. Switch seamlessly between Board, Timeline, Cycles, Initiatives, and Dashboards in <150ms.
    1.2.1. / (Tabs - Navigation Tabs) / Board & Work Items Tab / 1. Primary execution surface displaying issues across Kanban columns, table rows, or calendar dates; 2. Default Member landing route (/[teamRef]/[projectKey]) under Section 1.0.1 and UC-001/UC-002; 3. Create items, drag across states, or open detail drawers.
      1.2.1.1. / (Layouts - Kanban Workspace Layout) / Issue Delivery Layout / 1. Combines filter toolbar, multi-column board/table canvas, and collapsible 380px issue detail drawer; 2. Obeys SwarmHitlGovernanceBar plain-language & >=32px hit-target floor; 3. Select any card to edit without losing scroll position.
        1.2.1.1.1. / (Views - Board View) / Active Work Items Board & List View / 1. Displays project work items grouped by workflow status column with <= 6 summary attributes per card; 2. Queries GET /projects/:projectKey/issues/board under FR-001; 3. Filter backlog, drag cards across columns, or open create stepper.
          1.2.1.1.1.1. / (Filters - Drawer Filter) / Work Item Priority & Assignee Filter / 1. Composable attribute filter synced to saved project views and query string; 2. Applies predicates over issue board columns; 3. Pick 1-5 attributes or reset filters.
          1.2.1.1.1.2. / (Filters - Search Bar Filter) / Work Item Title & ID Search / 1. Top toolbar instant search bar matching issue sequenceNumber and title; 2. Calls GET /projects/:projectKey/issues/search; 3. Type issue identifier or phrase.
          1.2.1.1.1.3. / (Buttons - CTA Button) / Create Work Item Button / 1. Primary creation CTA (and keyboard shortcut N) launching the structured issue creation dialog; 2. Mounted in board header with >=32px height; 3. Click to enter core issue details.
            1.2.1.1.1.3.1. / (Forms - Modal Form) / Create Work Item Form / 1. Focused 6-field modal dialog collecting only essential launch fields per Rule of 6 (<= 6 fields); 2. Validates and posts to POST /projects/:projectKey/issues under FR-002; 3. Enter title, assignee, and submit.
              1.2.1.1.1.3.1.1. / (Buttons - CTA Button) / Submit Work Item Button / 1. Form submit button creating the issue record and closing modal on HTTP 201; 2. Disables while S4 request is in-flight to prevent duplicates; 3. Click to create card.
              1.2.1.1.1.3.1.2. / (Notices - Error Toast) / Work Item Validation Error Notice / 1. Inline field validation banner + S6 error toast blocking invalid issue creation; 2. Fires before submission or on HTTP 422 response; 3. Fix invalid input and retry.
          1.2.1.1.1.4. / (Buttons - Inline Button) / Quick Status & WIP Transition Button / 1. Inline status pill / drag handle moving a work item across workflow states; 2. Calls PATCH /issues/:issueId enforcing STATUS_ACTION_MATRIX WIP guards; 3. Drag card or pick target column.
          1.2.1.1.1.5. / (Notices - Warning Banner) / WIP Column Limit Reached Banner / 1. Column header warning indicator enforced when column occupancy reaches wipLimit; 2. Driven by project_column.wipLimit and wipMode under STATUS_ACTION_MATRIX; 3. Unblock active items first.
          1.2.1.1.1.6. / (Notices - Action Confirmation Notice) / Issue Status Updated With Undo Notice / 1. Transient S7 toast confirming mutation with reversible 10s Undo CTA; 2. Shown immediately upon HTTP 200/201; 3. Click Undo if accidental move occurred.
        1.2.1.1.2. / (Views - Table View) / Work Item Side Drawer View / 1. Slide-over 380px detail drawer presenting description, checklists, and logged time entries (<= 6 summary fields); 2. Syncs via GET /issues/:issueId/worklogs and /feed under FR-047; 3. Inspect history or click + Log Time.
          1.2.1.1.2.1. / (Buttons - Top Button) / Log Time & Checklist Button / 1. Drawer header trigger launching the worklog entry dialog; 2. Opens 1.2.1.1.2.1.1 inline or modal cleanly; 3. Click to record minutes spent.
            1.2.1.1.2.1.1. / (Forms - Modal Form) / Log Issue Worklog Form / 1. Minimal 3-field time logging modal recording effort against an issue; 2. Submits to POST /issues/:issueId/worklogs; 3. Enter minutes and note, then click Save.
              1.2.1.1.2.1.1.1. / (Buttons - CTA Button) / Save Worklog Entry Button / 1. Primary submit action inside the Worklog modal; 2. Calls POST /issues/:issueId/worklogs; 3. Click to append entry.
              1.2.1.1.2.1.1.2. / (Notices - Error Toast) / Worklog Duration Validation Notice / 1. Input guard notice preventing zero or negative worklog durations; 2. Triggered on client schema validation or HTTP 400; 3. Enter valid duration.
          1.2.1.1.2.2. / (Notices - System Notification) / Live Revision Conflict Refreshed Notice / 1. Realtime sync banner triggered by revision polling / SSE update when concurrent edits occur; 2. Synchronized via GET /sync/rev under UC-004; 3. Verify latest status before editing.
    1.2.2. / (Tabs - Navigation Tabs) / H1-H7 Timeline Schedule Tab / 1. Displays the 7-Horizon portfolio Gantt schedule with orthogonal Finish-to-Start dependency paths and dark precision milestones; 2. Routed at /[teamRef]/[projectKey]/timeline under UC-008 and FR-037..FR-048; 3. Filter horizon branches, inspect task drawers, and verify dependency health.
      1.2.2.1. / (Layouts - Timeline Grid Layout) / Portfolio Gantt Layout / 1. Aligns collapsible WBS tree labels on the left with a synchronized date grid on the right; 2. Enforces orthogonal routing (FR-038) and summary-row arrow isolation (FR-039); 3. Pan/zoom horizon spans cleanly.
        1.2.2.1.1. / (Views - Timeline View) / H1-H7 Dependency Timeline View / 1. Synchronized Gantt timeline showing <= 6 scheduling attributes per item row; 2. Uses startDate/dueDate/parentId plus issue_link dependencies under FR-037..FR-039; 3. Click any bar to inspect decision brief.
          1.2.2.1.1.1. / (Filters - Quick Filter) / Horizon Level & Milestone Filter / 1. Quick-filter pills scoping Gantt density to active initiatives or milestones; 2. Filters timeline groups deterministically; 3. Select Milestones Only for executive view.
          1.2.2.1.1.2. / (Buttons - Toggle Button) / Toggle Orthogonal Dependency Arrows Button / 1. Toolbar toggle switching orthogonal Finish-to-Start SVG lines without rendering noise on summary rows; 2. Controlled via FR-038/FR-039 isolation logic; 3. Toggle to inspect dependencies.
          1.2.2.1.1.3. / (Notices - Warning Banner) / Invalid Dependency Cycle Guard Notice / 1. Guard alert explaining why summary rows or cyclic FS dependency edges are blocked; 2. Fires on invalid link creation or graph sanitization; 3. Select acyclic leaf task link.
    1.2.3. / (Tabs - Navigation Tabs) / Cycles & Sprints Tab / 1. Manages time-boxed execution sprints, active cycle wiring, and incomplete-issue rollovers; 2. Routed at /[teamRef]/[projectKey]/cycles under UC-005 and FR-045; 3. Start, monitor, or complete sprint cycles cleanly.
      1.2.3.1. / (Layouts - Single Column Layout) / Active Cycle Planning Layout / 1. Places active cycle scope pills and table/timeline switch cleanly above cycle cards; 2. Separates active vs planned cycles per FR-045; 3. Open a cycle or create the next sprint.
        1.2.3.1.1. / (Views - Table View) / Active & Planned Cycles View / 1. Concise sprint ledger displaying cycle goal, window dates, and completion status (<= 6 fields); 2. Reads GET /projects/:projectKey/cycles under UC-005; 3. Filter active cycles or launch creation form.
          1.2.3.1.1.1. / (Filters - Quick Filter) / Active vs Planned Cycle Scope Filter / 1. Lifecycle scope filter toggling active, upcoming, and completed cycles; 2. Matches FR-045 Active Cycle Wiring contract; 3. Click Completed to audit closed sprints.
          1.2.3.1.1.2. / (Buttons - CTA Button) / New Sprint Cycle Button / 1. Header CTA opening the sprint definition dialog; 2. Triggered by Admin/Owner/Member with cycle permission; 3. Click to set name, goal, and dates.
            1.2.3.1.1.2.1. / (Forms - Modal Form) / Create Sprint Cycle Form / 1. Clean 4-field dialog defining cycle identity, goal, and non-overlapping window; 2. Submits to POST /projects/:projectKey/cycles; 3. Fill goal/dates and save.
              1.2.3.1.1.2.1.1. / (Buttons - CTA Button) / Save Cycle Button / 1. Submit button inside Create Sprint Cycle Form; 2. Calls POST /projects/:projectKey/cycles; 3. Click to publish sprint.
              1.2.3.1.1.2.1.2. / (Notices - Error Toast) / Cycle Date Range Overlap Notice / 1. Deterministic date guard preventing ambiguous overlapping sprints; 2. Fires on API 400/409 date conflict; 3. Select non-overlapping dates.
          1.2.3.1.1.3. / (Notices - Action Confirmation Notice) / Cycle Completed & Rollup Notice / 1. Confirmation banner upon saving or completing a sprint with automatic unfinished-item rollup summary; 2. Emitted on HTTP 200; 3. Proceed to next sprint.
    1.2.4. / (Tabs - Navigation Tabs) / Strategic Initiatives Tab / 1. Organizes multi-sprint strategic initiatives (H1/H3 bets) across proposed, planned, active, and completed states; 2. Routed at /[teamRef]/[projectKey]/initiatives/[tab] under UC-005 and FR-012, FR-045; 3. Track owner progress and linked issues.
      1.2.4.1. / (Layouts - Master-Detail Layout) / Initiative Tracking Layout / 1. Displays status-scoped URL tabs at top with clean 6-column table below; 2. Syncs tab state to /initiatives/[tab] URL paths; 3. Switch status tabs or create a new initiative.
        1.2.4.1.1. / (Views - Table View) / Active Initiatives List View / 1. Tabular initiative overview exposing title, lifecycle status, owner, priority, and target date; 2. Queries GET /projects/:projectKey/initiatives; 3. Open row for progress and linked issue tabs.
          1.2.4.1.1.1. / (Filters - Standard Filter) / Initiative Status & Owner Filter / 1. URL-synced status tab bar and owner dropdown; 2. Routes between /initiatives/all, /planned, /active, /completed; 3. Click desired tab.
          1.2.4.1.1.2. / (Buttons - CTA Button) / New Initiative Button / 1. Primary CTA launching the Initiative creation modal; 2. Respects Admin/Member permissions under FIELD_PERMISSION_MATRIX; 3. Click to create initiative.
            1.2.4.1.1.2.1. / (Forms - Modal Form) / Create Initiative Form / 1. 6-field initiative definition modal within Rule of 6 ceiling; 2. Posts to POST /projects/:projectKey/initiatives; 3. Complete fields and publish.
              1.2.4.1.1.2.1.1. / (Buttons - CTA Button) / Publish Initiative Button / 1. Submit CTA creating the initiative record cleanly; 2. Dispatches POST /projects/:projectKey/initiatives; 3. Click to create.
              1.2.4.1.1.2.1.2. / (Notices - Error Toast) / Initiative Date Validation Notice / 1. Form validation alert guarding chronological integrity on strategic roadmaps; 2. Shown on validation mismatch; 3. Correct date order.
          1.2.4.1.1.3. / (Notices - System Notification) / Empty Proposed Initiatives Guidance / 1. Self-explaining S5 empty state explaining why linking issues under an initiative unlocks progress rollups; 2. Rendered when list length == 0; 3. Follow primary button CTA.
    1.2.5. / (Tabs - Navigation Tabs) / Project Dashboards Tab / 1. Aggregates burnup, throughput, breakdown, and agent workload charts in customizable cards; 2. Routed at /[teamRef]/[projectKey]/dashboards under UC-005 and FR-014; 3. Review delivery health or configure widgets.
      1.2.5.1. / (Layouts - Grid Dashboard Layout) / Delivery Telemetry Layout / 1. Renders responsive card widgets with finite zero-NaN numeric formatting and empty fallback states; 2. Queries /analytics/* endpoints atomically; 3. Switch dashboards or adjust date filter.
        1.2.5.1.1. / (Views - Board View) / Velocity & Issue Metrics Dashboard / 1. Analytics grid presenting throughput, burnup, breakdown, and agent stats using 6 metadata/layout attributes; 2. Backed by GET /projects/:projectKey/dashboards & /analytics/*; 3. Inspect KPIs or create custom layout.
          1.2.5.1.1.1. / (Filters - Quick Filter) / Saved View & Date Window Filter / 1. Time-window quick pills recalculating dashboard chart series consistently; 2. Re-queries analytics endpoints with window param; 3. Pick timeframe.
          1.2.5.1.1.2. / (Buttons - CTA Button) / Create Custom Dashboard Button / 1. Top action button launching the dashboard creation dialog; 2. Opens 1.2.5.1.1.2.1 cleanly; 3. Click to name and save dashboard.
            1.2.5.1.1.2.1. / (Forms - Modal Form) / Dashboard Config Form / 1. Concise 3-field modal configuring dashboard title, icon, and JSON widget grid; 2. Posts to POST /projects/:projectKey/dashboards; 3. Submit to persist.
              1.2.5.1.1.2.1.1. / (Buttons - CTA Button) / Save Dashboard Layout Button / 1. Form submit button persisting custom dashboard cards; 2. Calls POST /projects/:projectKey/dashboards; 3. Click to create.
              1.2.5.1.1.2.1.2. / (Notices - Error Toast) / Dashboard Configuration Error Notice / 1. Validation toast blocking malformed dashboard JSON payloads; 2. Shown on client check or HTTP 400; 3. Fix fields and retry.
          1.2.5.1.1.3. / (Notices - Warning Banner) / Metrics Unavailable Offline Notice / 1. Zero-NaN protection notice clarifying fallback 0 values if partial metrics fail to load; 2. Driven by sanitizeAnalyticsMetric guard (SPEC-53.ACT.505); 3. Click Retry when API recovers.
  1.3. / (Features - Functional Feature Module) / JTBD-3 Docs, Notes & Knowledge Galaxy / 1. Unifies collaborative specifications, workspace file exploration, UTOP Knowledge Galaxy graphs, and sticky note / Kara meeting boards; 2. Accessed via /[teamRef]/[projectKey]/{docs,notes,vibe} and /kara under UC-006, UC-007, FR-016..FR-036; 3. Author specs, verify evidence slices, or capture meeting actions.
    1.3.1. / (Tabs - Navigation Tabs) / Project Docs & Specs Tab / 1. Hosts rich collaborative document trees, inline comments, lock controls, and revision history; 2. Routed at /[teamRef]/[projectKey]/docs under UC-006; 3. Search docs, co-edit content, and manage locks.
      1.3.1.1. / (Layouts - Workspace Layout (Main + Detail)) / Collaborative Docs Layout / 1. Pairs hierarchical document tree sidebar with full-bleed or centered rich editor canvas; 2. Syncs operational steps via document_collaboration & document_step; 3. Select document to read or edit.
        1.3.1.1.1. / (Views - Detail View) / Rich Collaborative Document Editor View / 1. Collaborative spec editor showing title, version lock state, owner, and live body; 2. Backed by GET /projects/:projectKey/documents/:documentId and OT collaboration routes; 3. Edit markdown/rich blocks or inspect revision history.
          1.3.1.1.1.1. / (Filters - Search Bar Filter) / Document Title & Tree Filter / 1. Sidebar doc search input filtering document nodes by title; 2. Matches client-cached doc tree from GET /projects/:projectKey/documents; 3. Type title fragment to focus tree.
          1.3.1.1.1.2. / (Buttons - Top Button) / New Document Button / 1. Doc tree header button creating a child or root specification page; 2. Reveals 1.3.1.1.1.2.1 inline title prompt; 3. Click and name the page.
            1.3.1.1.1.2.1. / (Forms - Inline Form) / Create Document Title Form / 1. Minimal 3-field inline creation form initializing title, parent folder, and privacy bit; 2. Submits to POST /projects/:projectKey/documents; 3. Enter title and click Save.
              1.3.1.1.1.2.1.1. / (Buttons - CTA Button) / Save Document Draft Button / 1. Save CTA initializing document revision 1 cleanly; 2. Posts to POST /projects/:projectKey/documents; 3. Click to open new editor.
              1.3.1.1.1.2.1.2. / (Notices - Error Toast) / Document Lock Conflict Notice / 1. Protection toast shown when attempting writes against an isLocked specification; 2. Triggered on HTTP 423 or missing title; 3. Duplicate doc or request owner unlock.
          1.3.1.1.1.3. / (Buttons - Toggle Button) / Toggle Full-Width & Lock Button / 1. Document header toggles for comfortable table viewing width and owner lock state; 2. Dispatches lock/unlock endpoint; 3. Click lock icon once sealed.
          1.3.1.1.1.4. / (Notices - System Notification) / Operational Revision Synced Notice / 1. Subtle status indicator verifying collaborative edits are checkpointed without drift; 2. Updated via /documents/:documentId/steps responses; 3. Continue editing confidently.
    1.3.2. / (Tabs - Navigation Tabs) / Vibe Spatial Workspace & Finder Tab / 1. Unifies 5-zone MECE file browsing (00_INBOX through 40_ARCHIVE), clipboard paste previews, and grounded slice reader; 2. Accessed on /[teamRef]/[projectKey]/vibe under UC-007 and FR-034..FR-036; 3. Browse workspace zones or preview artifact slices safely.
      1.3.2.1. / (Layouts - Single Column Layout) / MECE Spatial Finder Layout / 1. Displays 5-zone filter tabs paired with bounded artifact reader pane (<= 200 line chunks per GW-EFF-01); 2. Backed by /api/vibe/zones and /api/aos/onboarding; 3. Filter zone and preview file.
        1.3.2.1.1. / (Views - Canvas View) / 5-Zone Workspace Finder & Reader View / 1. File finder + grounded reader exposing filename, type, size, and storage key (<= 6 columns); 2. Reads bounded slices via /api/vibe/* under FR-035/FR-036; 3. Select zone and click file to inspect.
          1.3.2.1.1.1. / (Filters - Quick Filter) / MECE Lifecycle Zone Filter (00..40) / 1. Zone chip selector filtering artifacts cleanly by lifecycle folder; 2. Queries /api/vibe/zones; 3. Click a zone pill to focus.
          1.3.2.1.1.2. / (Buttons - Inline Button) / Inspect Bounded Artifact Slice Button / 1. Row action opening GroundedReaderView with syntax highlighting and line anchors; 2. Respects >=32px toolbar floor (FR-036); 3. Click any file item.
          1.3.2.1.1.3. / (Notices - Error Toast) / Path Traversal or Read Error Notice / 1. Security & size guard notification rejecting non-workspace paths or >10MB clipboard uploads; 2. Enforced server-side before returning bytes; 3. Pick valid artifact.
    1.3.3. / (Tabs - Navigation Tabs) / Knowledge Galaxy Graph Tab / 1. Renders visual traceability constellation connecting UTOP Specs, Use Cases, Code Modules, Tests, and IADs; 2. Accessible under Vibe Canvas / Galaxy view; 3. Filter node types and jump to linked artifacts.
      1.3.3.1. / (Layouts - Fullscreen Canvas Layout) / Traceability Graph Layout / 1. Maximizes node-graph exploration canvas with crisp >=12px Layer-0 labels (`text-xs`); 2. Obeys UIUXProMax Layer-0 typography ceiling (0 sub-12px literals); 3. Inspect links and filter nodes.
        1.3.3.1.1. / (Views - Graph View) / UTOP Knowledge Galaxy Graph View / 1. Interactive constellation view mapping doc-to-issue-to-code UTOP edges; 2. Reads linked documents, issues, and traceability edges using >=12px font tokens (SPEC-53.ACT.550); 3. Select node to open source artifact.
          1.3.3.1.1.1. / (Filters - Standard Filter) / Artifact Node Type Filter / 1. Category pills isolating Use Cases, IADs, or Work Items on the graph canvas; 2. Filters graph layers cleanly in client memory; 3. Toggle desired artifact types.
          1.3.3.1.1.2. / (Buttons - Redirect Button) / Jump to Source UTOP Doc Button / 1. Contextual node button linking graph inspection straight to underlying UTOP spec or doc; 2. Uses documentPath / reader route; 3. Click to inspect full artifact.
          1.3.3.1.1.3. / (Notices - Warning Banner) / Zero-Orphan Alignment Status Banner / 1. Live UTOP governance indicator confirming zero orphan slices (or flagging broken links); 2. Evaluates GW-UTOP-01 invariant on load; 3. Remediate any flagged orphan node.
    1.3.4. / (Tabs - Navigation Tabs) / Sticky Notes & Kara Meetings Tab / 1. Captures freeform visual sticky note boards and structured Kara meeting action items; 2. Routed at /[teamRef]/[projectKey]/notes and /kara under UC-006, UC-016; 3. Create note cards or sync meeting action items.
      1.3.4.1. / (Layouts - Grid Dashboard Layout) / Notes & Meeting Sync Layout / 1. Organizes sticky note boards and meeting transcripts side by side without visual clutter; 2. Backed by note-boards API and document_comment annotations; 3. Add note or push to War Room.
        1.3.4.1.1. / (Views - Board View) / Sticky Note Boards & Kara Action View / 1. Lightweight card board showing author notes, meeting comments, and resolution timestamps (6 fields); 2. Syncs via GET /projects/:projectKey/note-boards & comments endpoints; 3. Add card or resolve action.
          1.3.4.1.1.1. / (Buttons - CTA Button) / New Sticky Note or Sync Action Button / 1. One-click note creation and Kara action sync CTA; 2. Dispatches POST /projects/:projectKey/note-boards; 3. Click to add card.
          1.3.4.1.1.2. / (Notices - Action Confirmation Notice) / Note Board Saved Notice / 1. Non-blocking S7 feedback toast after creating or updating sticky notes; 2. Emitted on HTTP 200/201; 3. Continue ideating.
  1.4. / (Features - Functional Feature Module) / JTBD-4 Open Office AI Operations Floor / 1. Visualizes the 8 live AI departments, contract execution telemetry, cognitive agent streams, and human approval queue with zero-duplication docking; 2. Routed at /[teamRef]/[projectKey]/open-office under UC-010..UC-018, FR-053..FR-065; 3. Dispatch task contracts in <=2 steps and approve/rework deliverables under SoD.
    1.4.1. / (Tabs - Navigation Tabs) / 8-Department Spatial Floorplan Tab / 1. Single canonical isometric 8-department room surface paired with an above-the-fold right-rail inspector (`SPEC-53.ACT.505` zero-dup invariant); 2. Active on initial /open-office entry under FR-053..FR-055, FR-063; 3. Inspect department rooms or dispatch a contract immediately.
      1.4.1.1. / (Layouts - Split Canvas + Right Rail Layout) / Open Office Cockpit Layout / 1. Docks PixelOfficeCanvas cleanly alongside the 380px above-the-fold quick dispatch & cognitive rail (0px scroll tax, 0px overlap); 2. Prohibits duplicate department pill rows or secondary room grids; 3. Select room and dispatch in <=2 clicks.
        1.4.1.1.1. / (Views - Canvas View) / Live 8-Department Pixel Floor View / 1. Canonical 8-room spatial canvas displaying live agent desk status and room metadata (<= 6 schema fields); 2. Synchronized via Open Office API + override table under UC-010..UC-018; 3. Click any room plaque or sprite to steer.
          1.4.1.1.1.1. / (Filters - Quick Filter) / Department Room & Project Status Filter / 1. Single unified status & zone focus control above the canvas; 2. Filters active visual highlights without adding duplicate PM pills; 3. Click status chip to inspect.
          1.4.1.1.1.2. / (Buttons - Inline Button) / Select Room or Inspect Agent Button / 1. Interactive room plaque & agent sprite selection target inside the pixel floor canvas; 2. Hydrates quick dispatch form in right rail above the fold (0px scroll tax); 3. Click room to target.
          1.4.1.1.1.3. / (Notices - System Notification) / Live Room Occupancy Telemetry Notice / 1. Truthful operational banner verifying live database-backed occupancy metrics (zero fake progress indicators); 2. Driven by real contract state under UC-014; 3. Observe or assign tasks.
        1.4.1.1.2. / (Forms - Inline Form) / Quick 2-Click Contract Dispatch Form / 1. Above-the-fold 6-field inline dispatch form in the Open Office right rail (0px scroll tax); 2. Submits to POST /api/vibe/open-office/contracts under SPEC-53.ACT.505 JTBD-1; 3. Type title and click Assign Work.
          1.4.1.1.2.1. / (Buttons - CTA Button) / Dispatch Task Contract Button / 1. Primary dispatch submit CTA (btn-quick-dispatch-submit) committing a tracked task contract; 2. Dispatches HTTP POST to /api/vibe/open-office/contracts; 3. Click after entering contract title.
          1.4.1.1.2.2. / (Notices - Action Confirmation Notice) / Contract Dispatched Successfully Notice / 1. Immediate confirmation toast verifying contract ID issuance and live run start; 2. Triggered on POST 201 response; 3. Track progress or clear input.
          1.4.1.1.2.3. / (Notices - Error Toast) / Dispatch Missing Title or Lead Agent Notice / 1. Validation banner blocking blank or unowned AI task contracts; 2. Fires cleanly inside open-office-error-banner; 3. Provide title/agent and retry.
        1.4.1.1.3. / (Forms - Progressive Panel Form) / Bulk Dry-Run Dispatch Form / 1. Progressive V48 bulk dry-run dispatch form collapsed by default behind btn-toggle-bulk-dispatch; 2. Expands on focus and validates rows prior to batch submission; 3. Review dry-run counts then dispatch.
          1.4.1.1.3.1. / (Buttons - Progressive Action Button) / Toggle & Dispatch Bulk Batch CTA / 1. Dual-phase progressive disclosure and batch dispatch trigger (btn-toggle-bulk-dispatch); 2. Prevents viewport clutter while enabling high-throughput delegation; 3. Click to expand, dry-run, and dispatch.
          1.4.1.1.3.2. / (Notices - Toast Notification) / Bulk Dry-Run Validation & Dispatch Notice / 1. Clear progressive batch status feedback showing dry-run pass counts or dispatch completion; 2. Prevents blind batch errors; 3. Review summary and proceed.
    1.4.2. / (Tabs - Navigation Tabs) / Task Contracts & Approval Queue Tab / 1. Reviews structured task contracts, submitted run evidence, and Segregation of Duties (SoD) human sign-off controls in <= 2 steps; 2. Activated via tab-open-office-contracts under UC-010, UC-011, FR-056, FR-064; 3. Inspect proof links and click Approve or Request Rework.
      1.4.2.1. / (Layouts - Workspace Layout (Main + Detail)) / Contract & SoD Review Layout / 1. Stacks filterable contracts list alongside pre-selected pending review proof card; 2. Uses plain-language labels ('Waiting for approval', 'Independent Review Policy') with zero raw enum exposure in primary chrome; 3. Verify evidence and decide.
        1.4.2.1.1. / (Views - Table View) / Active Contracts & Pending Approval View / 1. Approval queue listing contracts with plain-language status badges and auto-selected first awaiting review item; 2. Driven by GET /api/vibe/open-office/contracts under FR-064; 3. Inspect proof and choose Approve or Request Rework.
          1.4.2.1.1.1. / (Filters - Quick Filter) / Contract Status & Approver Queue Filter / 1. Quick-filter pills spotlighting items waiting for human approval in plain English/Vietnamese; 2. Filters contract rows atomically; 3. Pick Waiting Approval first.
          1.4.2.1.1.2. / (Buttons - CTA Button) / Approve Contract Completion Button / 1. Primary review CTA (btn-approve-review) enforcing approver_id != lead_agent_id server-side; 2. Calls POST /api/vibe/open-office/review; 3. Click after inspecting proof URLs.
          1.4.2.1.1.3. / (Buttons - Inline Button) / Request Rework Form Trigger / 1. Review rejection action launching structured rework feedback & Academy crystallization; 2. Opens 1.4.2.1.1.3.1; 3. Click when submitted proof misses acceptance criteria.
            1.4.2.1.1.3.1. / (Forms - Modal Form) / Contract Rework Reason Form / 1. 3-field rework modal capturing exact failure reason for UC-015 Academy skill distillation; 2. Posts decision=REWORK to POST /api/vibe/open-office/review; 3. Enter reason and submit.
              1.4.2.1.1.3.1.1. / (Buttons - CTA Button) / Submit Rework Feedback Button / 1. Modal submit button sending rework instructions back to the lead agent; 2. Increments run_number and appends open_office_lessons; 3. Click after typing failure details.
              1.4.2.1.1.3.1.2. / (Notices - Warning Banner) / Mandatory Rework Lesson Logged Banner / 1. Confirmation banner noting that rework reasoning was crystallized into agent memory; 2. Triggered on REWORK HTTP 200; 3. Monitor upcoming run.
          1.4.2.1.1.4. / (Notices - Exception Modal) / Segregation of Duties Block Notice / 1. Hard fail-closed error banner (`open-office-error-banner`) triggered when self-approval is attempted; 2. Enforced by backend SegregationOfDutiesError (HTTP 403/409); 3. Reassign review to another approver.
    1.4.3. / (Tabs - Navigation Tabs) / Operations Analytics & Event Ledger Tab / 1. Tracks cross-department SLA throughput, rework counts, and SHA-256 hash-chained audit logs cleanly; 2. Routed at tab-open-office-analytics under UC-010, UC-015, UC-018, FR-058; 3. Monitor KPIs without NaN leakage.
      1.4.3.1. / (Layouts - Grid Dashboard Layout) / Telemetry & Lessons Layout / 1. Groups finite department progress bars above chronological hash-chained event records; 2. Applies sanitizeAnalyticsMetric against NaN/Infinity; 3. Filter domain trends cleanly.
        1.4.3.1.1. / (Views - Dashboard View) / SLA, Rework & Chain Hash Telemetry View / 1. Immutable audit trail & KPI summary displaying 6 forensic ledger columns; 2. Reads open_office_event_log and open_office_lessons with sanitizeAnalyticsMetric guard; 3. Audit completion rates and event digests.
          1.4.3.1.1.1. / (Filters - Standard Filter) / Department Domain & Time Range Filter / 1. Department & event-type selectors narrowing operational ledger entries; 2. Filters event stream deterministically; 3. Inspect targeted room health.
          1.4.3.1.1.2. / (Notices - System Notification) / Zero-NaN Metric Sanitization Notice / 1. Informational safeguard note assuring clean finite telemetry display during cold start; 2. Driven by sanitize_analytics_metric / sanitizeAnalyticsMetric; 3. Review counts normally.
    1.4.4. / (Tabs - Navigation Tabs) / Department Positions & Seat Setup Tab / 1. Configures 8 department position catalogs and AI agent seat assignments persisted in open_office_org_governance with S7 10s Undo; 2. Activated via V62 OfficeSubTabs under UC-010.S09, UC-011..018.S04, FR-075; 3. Edit positions, bind seats, or undo within 10s.
      1.4.4.1. / (Layouts - Workspace Layout (Main + Detail)) / Department Positions & AI Seating Layout / 1. Organizes canonical department missions, role positions, and station seat bindings with /agents JTBD-4 parity; 2. Enforces SQLite open_office_org_governance SSOT persistence; 3. Select a department or unseat an agent with 10s Undo protection.
        1.4.4.1.1. / (Views - Table View) / Department Positions & Seat Map View / 1. Unified department position and seat occupancy roster backed by open_office_org_governance; 2. Driven by GET /api/vibe/open-office/governance; 3. Inspect seat occupancy or edit positions.
          1.4.4.1.1.1. / (Filters - Quick Filter) / Department Zone & Occupancy Filter / 1. Quick selector isolating any canonical department or unseated AI stations; 2. Deterministic local filtering over governance snapshot; 3. Pick a department tab or clear filter.
        1.4.4.1.2. / (Forms - Inline Form) / Department Position & Seat Assignment Form / 1. Inline governance editor persisting department positions and AI seat assignments to SQLite; 2. Calls POST /api/vibe/open-office/dept-positions and /seat-assignments; 3. Edit and save or undo.
          1.4.4.1.2.1. / (Buttons - Action Button) / Save Position / Unseat Agent CTA / 1. Saves department position or seat binding mutations to open_office_org_governance; 2. Destructive remove/unseat triggers S7 10s Undo latch; 3. Confirm change or click Undo.
          1.4.4.1.2.2. / (Notices - Toast Notification) / Position & Seat S7 10s Undo Notice / 1. Non-blocking S7 confirmation toast offering a 10s Undo latch after removing a position or unseating an AI agent; 2. Wired via showUndoToast(..., { durationMs: 10_000 }); 3. Click Undo to restore.
  1.5. / (Features - Functional Feature Module) / JTBD-5 AI Agents, Schedules & Tool Integrations / 1. Configures the hybrid AI agent workforce, recurring cron schedules, modular skills, tool credentials, MCP server endpoints, and REST/OpenAPI reference; 2. Routed at /[teamRef]/[projectKey]/{agents,agents/schedules,mcp,api} under UC-003, UC-013, FR-008..FR-011, FR-062; 3. Inspect agent sheets in place, launch Open Office, or manage autonomous schedules.
    1.5.1. / (Tabs - Navigation Tabs) / Team AI Agent Roster Tab / 1. Lists configured AI agents paired with an in-place 380px AgentSheet and compact top harness link bar to Open Office (`<=76px` banner under SPEC-53.ACT.505); 2. Routed at /[teamRef]/[projectKey]/agents under UC-003, FR-062; 3. Click any row to edit agent instructions or jump to Open Office.
      1.5.1.1. / (Layouts - Workspace Layout (Main + Detail)) / Agent Roster & Sheet Layout / 1. Pairs clean 6-column roster table with slim Open Office navigation bar and slide-over 380px AgentSheet (strictly no duplicate embedded pixel canvas on /agents); 2. Enforces `<=76px` banner ceiling (SPEC-53.ACT.505); 3. Click row to open AgentSheet in-place.
        1.5.1.1.1. / (Views - Table View) / AI Agents Roster View / 1. Tabular roster showing username, runtime kind, model, runner scope, and heartbeat timestamp (6 columns); 2. Backed by GET /teams/:teamId/ai-agents under FR-008; 3. Click row to open AgentSheet without route jitter.
          1.5.1.1.1.1. / (Filters - Search Bar Filter) / Agent Username & Model Filter / 1. Roster search input filtering agents by @username, model ID, or runner scope; 2. Filters fetched agent list immediately; 3. Type @handle to narrow table.
          1.5.1.1.1.2. / (Buttons - Redirect Button) / Open In-Place Agent Sheet or Floor View / 1. Dual action: clicking table row opens 380px AgentSheet on /agents, while btn-mode-open-office links directly to /open-office; 2. Enforces zero-dup non-embedded canvas policy; 3. Click row to configure or button to supervise floor.
          1.5.1.1.1.3. / (Buttons - CTA Button) / Provision New AI Agent Button / 1. Header CTA opening the 380px Agent configuration drawer; 2. Restricted to Owner/Admin roles under FIELD_PERMISSION_MATRIX; 3. Click to onboard agent.
            1.5.1.1.1.3.1. / (Forms - Drawer Form) / Configure AI Agent Drawer Form / 1. 6-field Agent configuration drawer keeping advanced temperature/maxSteps toggles inside secondary accordion; 2. Submits to POST /teams/:teamId/ai-agents; 3. Configure role and save.
              1.5.1.1.1.3.1.1. / (Buttons - CTA Button) / Save Agent Configuration Button / 1. Primary submit action inside the AgentSheet drawer; 2. Persists model/instructions while protecting masked secrets; 3. Click to save.
              1.5.1.1.1.3.1.2. / (Notices - Error Toast) / Missing Model Credential Notice / 1. Validation banner blocking unauthenticated or duplicate AI agent registrations; 2. Fires on API 400/409; 3. Resolve username or credential.
          1.5.1.1.1.4. / (Notices - System Notification) / Harness Banner Link Readiness Notice / 1. Compact <=76px navigation strip guiding operators seamlessly between /agents config and /open-office live ops; 2. Permanent architectural landmark under SPEC-53.ACT.505; 3. Click button to open floor.
    1.5.2. / (Tabs - Navigation Tabs) / Agent Cron Schedules Tab / 1. Schedules autonomous recurring cron prompts per agent and inspects run execution queues; 2. Routed at /[teamRef]/[projectKey]/agents/schedules under UC-003, UC-013, FR-010; 3. Create schedules, run ad-hoc triggers, or cancel hung runs.
      1.5.2.1. / (Layouts - Single Column Layout) / Autonomous Schedule Layout / 1. Displays cron schedule table with next/last run timestamps and clear Pause/Run controls; 2. Maps cleanly to agent_schedule endpoints; 3. Filter active schedules or add cron job.
        1.5.2.1.1. / (Views - Table View) / Scheduled Agent Runs View / 1. Schedule roster displaying job name, agent handle, cron expression, status, and next trigger (6 fields); 2. Reads GET /projects/:projectKey/agent-schedules; 3. Toggle status or click + Create Schedule.
          1.5.2.1.1.1. / (Filters - Quick Filter) / Schedule Active vs Paused Filter / 1. Status quick-filter toggle separating running crons from paused templates; 2. Refines table rows smoothly; 3. Switch filter pills.
          1.5.2.1.1.2. / (Buttons - CTA Button) / Create Cron Schedule Button / 1. Header CTA opening the cron schedule definition form; 2. Opens 1.5.2.1.1.2.1 modal cleanly; 3. Click to schedule recurring work.
            1.5.2.1.1.2.1. / (Forms - Modal Form) / Agent Schedule Definition Form / 1. 6-field modal defining schedule name, assigned agent, 5-field cron, timezone, prompt, and initial status; 2. Submits to POST /projects/:projectKey/agent-schedules; 3. Define cadence and save.
              1.5.2.1.1.2.1.1. / (Buttons - CTA Button) / Activate Schedule Button / 1. Form submit button storing the schedule and computing nextRunAt; 2. Dispatches POST /projects/:projectKey/agent-schedules; 3. Click to save.
              1.5.2.1.1.2.1.2. / (Notices - Error Toast) / Invalid Cron Expression Notice / 1. Immediate cron parser feedback preventing unschedulable triggers; 2. Validates before HTTP POST; 3. Adjust cron fields and save.
          1.5.2.1.1.3. / (Notices - Action Confirmation Notice) / Schedule Trigger Dispatched Notice / 1. S7 toast confirming schedule creation or manual Run Now dispatch; 2. Triggered on HTTP 200/201; 3. Track output run.
    1.5.3. / (Tabs - Navigation Tabs) / MCP Servers & API Reference Tab / 1. Connects reusable agent skills, external MCP servers, and Scalar interactive OpenAPI docs; 2. Routed at /[teamRef]/[projectKey]/mcp and /api under UC-003, FR-011; 3. Copy MCP config or inspect API endpoints.
      1.5.3.1. / (Layouts - Single Column Layout) / Tool Connectivity Layout / 1. Presents connected MCP capabilities, reusable agent tools, and embedded OpenAPI schema cleanly; 2. Masks credential ciphertext via Vault rules; 3. Copy endpoint snippets safely.
        1.5.3.1.1. / (Views - Detail View) / Connected Skills, MCP & Scalar API View / 1. Tool & MCP connectivity inspector surfacing active tool keys and credential links (<= 5 schema fields); 2. Queries GET /teams/:teamId/agent-tools & /api/v1/openapi; 3. Copy snippet or link credentials.
          1.5.3.1.1.1. / (Buttons - Top Button) / Copy MCP Config or Endpoint Token Button / 1. Toolbar copy CTA producing ready-to-paste client MCP configuration with placeholder token hints; 2. Uses navigator.clipboard safely; 3. Paste into IDE MCP client.
          1.5.3.1.1.2. / (Notices - Warning Banner) / Scoped Credential Redaction Notice / 1. Security hygiene banner preventing accidental secret leakage when sharing MCP snippets; 2. Always rendered cleanly in tool header; 3. Manage real tokens in Vault.
  1.6. / (Features - Functional Feature Module) / JTBD-6 Secret Vault, Access Roles & Org Governance / 1. Governs encrypted hardware-bound API keys, custom RBAC role permissions, member invitations, company defaults, and outbound webhooks without cluttering daily work views; 2. Routed at /[teamRef]/[projectKey]/vault, /members, /[teamRef]/settings/*, and /account/company under UC-009, UC-017, UC-018, FR-024..FR-030, FR-066; 3. Audit permissions, safeguard credentials, and maintain org coherence.
    1.6.1. / (Tabs - Navigation Tabs) / Secret Vault Custody Tab / 1. Stores AES-256-GCM encrypted credentials with HWID-bound custody, redacted display by default, and audited explicit reveal; 2. Routed at /[teamRef]/[projectKey]/vault and backed by /api/vault-bridge (port 8765) under UC-017, FR-066; 3. Store, rotate, or audit secret access.
      1.6.1.1. / (Layouts - Single Column Layout) / Encrypted Vault Layout / 1. Lists masked secret entries alongside explicit Reveal and Rotate actions guarded by Owner/Admin custody checks; 2. Bridges cleanly to app_secret / integration_credential and Vault daemon; 3. Reveal only when needed.
        1.6.1.1.1. / (Views - Table View) / Encrypted Project & Team Secrets View / 1. Custody table displaying secret key name, redacted badge, IV/authTag status, and updated timestamp (5 schema fields); 2. Queries /api/vault-bridge & team integrations under FR-066; 3. Reveal authorized keys or add new secret.
          1.6.1.1.1.1. / (Filters - Search Bar Filter) / Integration Key & Secret Filter / 1. Search box filtering masked secret keys in client state; 2. Never queries plaintext values; 3. Filter by provider prefix.
          1.6.1.1.1.2. / (Buttons - Inline Button) / Reveal Hardware-Bound Secret Button / 1. Explicit eye-reveal inline button gated strictly to Owner/Admin roles per FIELD_PERMISSION_MATRIX; 2. Hits /api/vault-bridge with reveal parameter; 3. Click to inspect and auto-re-mask.
          1.6.1.1.1.3. / (Buttons - CTA Button) / Rotate or Store Secret Button / 1. Primary CTA launching the encrypted secret storage dialog; 2. Opens 1.6.1.1.1.3.1; 3. Click to store or rotate provider secret.
            1.6.1.1.1.3.1. / (Forms - Modal Form) / Store Encrypted Secret Form / 1. Minimal 4-field metadata + masked secret dialog storing encrypted team credentials; 2. Posts to POST /teams/:teamId/integrations or Vault bridge; 3. Submit to encrypt.
              1.6.1.1.1.3.1.1. / (Buttons - CTA Button) / Encrypt & Save Secret Button / 1. Modal submit action executing server-side encryption and audit logging; 2. Dispatches POST /teams/:teamId/integrations; 3. Click to seal secret.
              1.6.1.1.1.3.1.2. / (Notices - Error Toast) / Vault Daemon Unreachable Notice / 1. Actionable connectivity banner triggered when local Vault HTTP 503 fires; 2. Diagnoses /api/vault-bridge upstream failure cleanly; 3. Start Vault bridge and retry.
          1.6.1.1.1.4. / (Notices - Exception Modal) / Unauthorized Reveal Denied Notice / 1. Fail-closed permission denial preventing unprivileged decryption; 2. Matches FIELD_PERMISSION_MATRIX Secret/Vault custody rows; 3. Escalate to Team Owner.
    1.6.2. / (Tabs - Navigation Tabs) / Team Members & RBAC Roles Tab / 1. Governs project members, SCIM-synced accounts, pending email invitations, and custom role permission matrices; 2. Routed at /[teamRef]/[projectKey]/members and /[teamRef]/settings/roles under UC-017, FR-024..FR-027; 3. Invite teammates and inspect authorization checks.
      1.6.2.1. / (Layouts - Workspace Layout (Main + Detail)) / Roster & Permission Matrix Layout / 1. Displays unified roster table paired with plain-language role permission matrix cards (`gov-authorization-matrix`); 2. Separates human & agent scopes cleanly; 3. Invite members or verify grant checks.
        1.6.2.1.1. / (Views - Table View) / Members & Custom Role Permissions View / 1. RBAC matrix & team roster exposing custom role definitions and effective grants (6 fields); 2. Reads GET /teams/:teamId/roles & /projects/:projectKey/members; 3. Audit permissions or invite new member.
          1.6.2.1.1.1. / (Filters - Quick Filter) / Human vs AI Agent Role Filter / 1. Role scope quick filter isolating standard vs custom authorization profiles; 2. Filters role cards cleanly; 3. Toggle Standard/Custom.
          1.6.2.1.1.2. / (Buttons - CTA Button) / Invite Team Member Button / 1. Primary header CTA launching teammate email invite modal; 2. Respects Owner/Admin gate under FIELD_PERMISSION_MATRIX; 3. Click to invite collaborator.
            1.6.2.1.1.2.1. / (Forms - Modal Form) / Invite Workspace Member Form / 1. Clean 6-field teammate invite form assigning initial team & project authorization role; 2. Dispatches POST /teams/:teamId/invites; 3. Enter email, pick role, and send.
              1.6.2.1.1.2.1.1. / (Buttons - CTA Button) / Send Workspace Invite Button / 1. Form submit button generating the tokenized invite link; 2. Calls POST /teams/:teamId/invites; 3. Click to send.
              1.6.2.1.1.2.1.2. / (Notices - Error Toast) / Duplicate Invite Email Notice / 1. Duplicate guard toast preventing redundant invite tokens; 2. Fires on HTTP 409 conflict; 3. Resend existing invite instead.
          1.6.2.1.1.3. / (Notices - Action Confirmation Notice) / Role Permission Grant Saved Notice / 1. Confirmation toast verifying RBAC/invite changes saved cleanly; 2. Triggered on HTTP 200/201; 3. Continue governing workspace.
    1.6.3. / (Tabs - Navigation Tabs) / Company & Project Defaults Tab / 1. Centralizes top-level organization profile, workspace tier summaries (with zero leaked GW-SOD-01 code tokens), project feature switches, and outbound webhook reliability logs; 2. Routed at /account/company & /[teamRef]/[projectKey]/settings/webhooks under UC-009, UC-018, FR-044, FR-066; 3. Save company defaults or audit failing webhooks.
      1.6.3.1. / (Layouts - Single Column Layout) / Organization Governance Layout / 1. Stacks Organization Governance Form cleanly above Outbound Webhook Delivery Health (keeping cut settings clutter retired per SPEC-284); 2. Enforces plain-language tier copy per SPEC-53.ACT.550; 3. Save defaults cleanly.
        1.6.3.1.1. / (Forms - Standard Form) / Organization Profile & Governance Form / 1. 4-field organization governance card managing workspace name, slug, MCP default, and default agent list; 2. Syncs via GET/PUT /settings/company & PATCH /teams/:teamId; 3. Edit and save.
          1.6.3.1.1.1. / (Buttons - CTA Button) / Save Organization Settings Button / 1. Primary Save CTA persisting company identity and default AI policies; 2. Dispatches PUT /settings/company; 3. Click to apply.
          1.6.3.1.1.2. / (Notices - Action Confirmation Notice) / Company Governance Updated Notice / 1. Clean S7 confirmation notice verifying governance settings saved without jargon; 2. Triggered on HTTP 200; 3. Return to daily workflow.
        1.6.3.1.2. / (Views - Detail View) / Inbound Webhooks & Delivery Health View / 1. Operational health view exposing webhook target URL, subscribed events, active state, and failure counter (6 schema fields); 2. Queries GET /projects/:projectKey/webhooks & /deliveries; 3. Inspect failing endpoint or retry.
          1.6.3.1.2.1. / (Buttons - Inline Button) / Retry Failed Webhook Delivery Button / 1. Inline health action resetting or testing paused commercial webhook endpoints; 2. Dispatches PATCH /webhooks/:webhookId; 3. Click after endpoint recovers.
          1.6.3.1.2.2. / (Notices - Warning Banner) / Consecutive Webhook Failure Warning / 1. Delivery circuit-breaker warning flagging offline client webhook listeners; 2. Triggered by consecutiveFailures counter increment; 3. Fix downstream receiver and reactivate.
2. / (Navigations - Drawer/Modal Trigger Navigation) / ACCORD Contextual Copilot & Shell Utility / 1. Provides persistent AI chat assistance, plain-language progressive JTBD workflow guidance, and authentication entry across any workspace page; 2. Triggered via aligned AppHeader controls (<=1.5px divider match), shortcut Cmd+K, or /login under FR-001, FR-036, FR-061..FR-066; 3. Open side chat, follow highlighted workflow guide step, or configure session preferences.
  2.1. / (Layouts - Chat Stream Layout) / Contextual AI Agent Chat Panel / 1. Persistent right-hand AI conversation panel usable from any active project route without navigation jumps; 2. Triggered via AppHeader Chat Toggle or /[teamRef]/[projectKey]/agents/chat obeying UCBDDManager Chat Layout Constraint (zero internal Navigations, Features, or Tabs); 3. Pick active agent, inspect streaming output cards, and send follow-up prompts.
    2.1.1. / (Views - Table View) / Live Streaming Agent Conversation View / 1. Focused conversational timeline showing role bubbles, stream status, and concise response content (6 fields); 2. Streams via GET /projects/:projectKey/ai-agents/:agentId/chat/:messageId/stream; 3. Read replies or switch pinned thread.
      2.1.1.1. / (Filters - Quick Filter) / Pinned & Recent Threads Filter / 1. Compact popover thread selector inside the chat header; 2. Reads GET /projects/:projectKey/ai-agents/:agentId/threads; 3. Pick pinned thread to resume context.
      2.1.1.2. / (Buttons - Top Button) / Switch Active Agent or Toggle History Button / 1. Chat header dropdown switching between @antigravity, reviewer, or coder personas; 2. Hydrates thread history via /threads endpoint; 3. Select persona and continue chatting.
      2.1.1.3. / (Notices - Error Toast) / Agent Stream Interrupted With Retry Notice / 1. Non-destructive recovery card appended when SSE token stream breaks mid-turn; 2. Reads lastError from agent_chat_message; 3. Retry cleanly without retyping prompt.
    2.1.2. / (Forms - Inline Form) / Natural-Language Prompt Composer / 1. Streamlined bottom composer initiating or continuing a thread (zero multi-field clutter inside chat); 2. Posts to POST /projects/:projectKey/ai-agents/:agentId/chat; 3. Type request and click Send.
      2.1.2.1. / (Buttons - CTA Button) / Send Prompt or Cancel Stream Button / 1. Dynamic composer CTA switching cleanly between Send (S1) and Stop Streaming (S4); 2. Dispatches chat or cancel HTTP endpoints; 3. Click to send or stop.
      2.1.2.2. / (Notices - System Notification) / Token Usage & Cost Budget Notice / 1. Compact token telemetry line beneath replies promoting FinOps awareness without interrupting flow; 2. Driven by agent_chat_usage inputTokens/outputTokens; 3. Continue or open new chat.
  2.2. / (Layouts - Drawer/Overlay Layout) / Progressive JTBD Workflow Guide & Command Palette / 1. Explains ACCORD's 6 Jobs-to-be-Done in plain human language with current-step highlighting and an Org Settings shortcut; 2. Triggered by labeled Header CTA `[data-testid='btn-global-jtbd-guide']` or `?`/`Cmd+K` under SPEC-53.ACT.549 & SPEC-53.ACT.550; 3. Inspect active workflow stage and jump straight to next surface.
    2.2.1. / (Views - Table View) / Active 6-JTBD Orientation List View / 1. 6-card orientation list grouped into Daily Delivery, AI Operations, and Governance with active-route border highlighting; 2. Uses localized nav.json strings and jtbdRegistry across 10 languages; 3. Click any step card or Org Settings.
      2.2.1.1. / (Buttons - Redirect Button) / Jump to Active JTBD Step or Org Settings Button / 1. Actionable step links and dedicated Org Settings shortcut (`jtbd-guide-org-settings`) inside JtbdWorkflowGuideDrawer; 2. Closes drawer cleanly on navigation without viewport overflow; 3. Click step to navigate.
      2.2.1.2. / (Notices - System Notification) / Current Workflow Position Indicator / 1. Contextual orientation pill showing exact active step on current URL route without jargon; 2. Computed deterministically via useShellRoute inside JtbdWorkflowGuideDrawer; 3. Confirms current context immediately.
  2.3. / (Layouts - Centered Auth Card Layout) / Session Authentication & User Preferences / 1. Handles sign-in, password reset, passkeys, and personal EN/VI locale + dark/light theme preferences; 2. Routed on /login, /register, and /account/* under UC-001, UC-008, FR-001, FR-042; 3. Authenticate securely and customize workspace defaults.
    2.3.1. / (Forms - Authentication Form) / Workspace Login & Passkey Form / 1. Clean centered login card validating session credentials before entering workspace shell; 2. Integrates Better-Auth session endpoints & role landing redirect; 3. Sign in cleanly.
      2.3.1.1. / (Buttons - CTA Button) / Sign In or Unlock Session Button / 1. Auth submission CTA establishing signed session cookie and resolving startPage; 2. Guards against double clicks in S4 in-flight state; 3. Click Sign In.
      2.3.1.2. / (Notices - Error Toast) / Invalid Credentials or Locked Account Notice / 1. Clear S6 authentication feedback avoiding enumeration leakage while guiding recovery; 2. Shown on HTTP 401/403 login error; 3. Retry or reset password.
    2.3.2. / (Forms - Standard Form) / User Locale, Theme & Start Page Form / 1. 6-field personal UX customization form wiring locale, dual theme, landing page, and default chat state; 2. Syncs via PATCH /account/preferences under FR-042/FR-043; 3. Save changes and observe immediate reload.
      2.3.2.1. / (Buttons - CTA Button) / Save Personal Preferences Button / 1. Submit CTA persisting user preferences to Postgres user_preference; 2. Calls PATCH /account/preferences; 3. Click to apply theme/language immediately.
      2.3.2.2. / (Notices - Action Confirmation Notice) / Locale & Start Page Updated Notice / 1. Non-blocking confirmation toast acknowledging immediate UI preference update; 2. Triggered on HTTP 200; 3. Continue working in chosen language/theme.
```

---

## 3. Connected Catalog Summaries (`iad_views`, `iad_forms`, `iad_buttons`, `iad_filters`, `iad_notices`)

### 3.1 Representative Views (`<= 6` Visible Schema Columns — Full `25` in [iad_views.md](./iad_views.md))

| WBS ID | View Name | Primary DB Table | Exposed Fields (`<= 6`) | Linked UCs |
| :--- | :--- | :--- | :--- | :--- |
| `1.1.1.1.1` | Prioritized Triage Queue View | `notification` | `id, type, actorName, issueId, readAt, createdAt` | UC-004, UC-014 |
| `1.1.1.1.2` | Triage Handoff Context Inspector | `open_office_contracts` | `id, title, lead_agent_id, status, confidence_pct, updated_at` | UC-010, UC-014 |
| `1.1.2.1.1` | Notification Delivery Log View | `notification_delivery` | `id, channel, recipient, status, attempts, createdAt` | UC-004 |
| `1.2.1.1.1` | Active Work Items Board & List View | `issue` | `sequenceNumber, title, columnId, priority, assigneeUserId, dueDate` | UC-001, UC-002 |
| `1.2.1.1.2` | Work Item Side Drawer View | `issue_worklog` | `issueId, userId, minutes, spentOn, note, createdAt` | UC-002 |
| `1.2.2.1.1` | H1-H7 Dependency Timeline View | `issue` | `sequenceNumber, title, startDate, dueDate, parentId, columnId` | UC-008 |
| `1.2.3.1.1` | Active & Planned Cycles View | `cycle` | `id, name, goal, startDate, endDate, completedAt` | UC-005, UC-008 |
| `1.2.4.1.1` | Active Initiatives List View | `initiative` | `id, title, status, ownerUserId, priority, targetDate` | UC-005 |
| `1.2.5.1.1` | Velocity & Issue Metrics Dashboard | `project_dashboard` | `id, projectId, name, icon, layout, createdAt` | UC-005 |
| `1.3.1.1.1` | Rich Collaborative Document Editor View | `project_document` | `id, title, version, isLocked, ownerUserId, updatedAt` | UC-006 |
| `1.3.2.1.1` | 5-Zone Workspace Finder & Reader View | `document_asset` | `id, filename, contentType, sizeBytes, s3Key, createdAt` | UC-007 |
| `1.3.3.1.1` | UTOP Knowledge Galaxy Graph View | `project_document_issue` | `documentId, issueId, createdByUserId, createdAt` | UC-007, UC-012 |
| `1.3.4.1.1` | Sticky Note Boards & Kara Action View | `document_comment` | `id, documentId, authorId, body, resolvedAt, createdAt` | UC-006, UC-016 |
| `1.4.1.1.1` | Live 8-Department Pixel Floor View | `open_office_departments_override` | `zone_id, name, subtitle, default_template_id, recommended_agent_ids, updated_at` | UC-010, UC-011..UC-018 |
| `1.4.2.1.1` | Active Contracts & Pending Approval View | `open_office_contracts` | `id, title, lead_agent_id, status, confidence_pct, current_run_number` | UC-010, UC-011, UC-012 |
| `1.4.3.1.1` | SLA, Rework & Chain Hash Telemetry View | `open_office_event_log` | `event_id, contract_id, event_type, actor_id, event_hash, created_at` | UC-010, UC-015, UC-018 |
| `1.4.4.1.1` | Department Positions & Seat Map View | `open_office_org_governance` | `key, value_json, updated_at` | UC-010.S09, UC-011..018.S04 |
| `1.5.1.1.1` | AI Agents Roster View | `ai_agent` | `id, username, kind, model, runnerScope, lastSeenAt` | UC-003, UC-013 |
| `1.5.2.1.1` | Scheduled Agent Runs View | `agent_schedule` | `id, agentId, name, cron, status, nextRunAt` | UC-003, UC-013 |
| `1.5.3.1.1` | Connected Skills, MCP & Scalar API View | `agent_tool` | `id, teamId, toolKey, credentialId, createdAt` | UC-003 |
| `1.6.1.1.1` | Encrypted Project & Team Secrets View | `app_secret` | `key, redacted, iv, authTag, updatedAt` | UC-017 |
| `1.6.2.1.1` | Members & Custom Role Permissions View | `team_role` | `id, teamId, name, isDefault, permissions, createdAt` | UC-017 |
| `1.6.3.1.2` | Inbound Webhooks & Delivery Health View | `webhook` | `id, projectId, url, events, isActive, consecutiveFailures` | UC-018 |
| `2.1.1` | Live Streaming Agent Conversation View | `agent_chat_message` | `id, threadId, agentId, role, content, status` | UC-003 |
| `2.2.1` | Active 6-JTBD Orientation List View | `user_preference` | `userId, locale, startPage, lastProjectId` | UC-001..UC-018 |

### 3.2 Representative Forms (`<= 6` Inputs — Full `19` in [iad_forms.md](./iad_forms.md))

| WBS ID | Form Name | Type | Target DB Table & Input Count | Linked UCs |
| :--- | :--- | :--- | :--- | :--- |
| `1.1.2.1.2` | Notification Preference Form | Standard Form | `user_notification_preference` (3 fields) | UC-004 |
| `1.2.1.1.1.3.1` | Create Work Item Form | Modal Form | `issue` (6 fields) | UC-002 |
| `1.2.1.1.2.1.1` | Log Issue Worklog Form | Modal Form | `issue_worklog` (3 fields) | UC-002 |
| `1.2.3.1.1.2.1` | Create Sprint Cycle Form | Modal Form | `cycle` (4 fields) | UC-005 |
| `1.2.4.1.1.2.1` | Create Initiative Form | Modal Form | `initiative` (6 fields) | UC-005 |
| `1.2.5.1.1.2.1` | Dashboard Config Form | Modal Form | `project_dashboard` (3 fields) | UC-005 |
| `1.3.1.1.1.2.1` | Create Document Title Form | Inline Form | `project_document` (3 fields) | UC-006 |
| `1.4.1.1.2` | Quick 2-Click Contract Dispatch Form | Inline Form | `open_office_contracts` (6 fields) | UC-010, UC-013, UC-014 |
| `1.4.1.1.3` | Bulk Dry-Run Dispatch Form | Progressive Panel Form | `open_office_contracts` (6 fields) | UC-010.S08 |
| `1.4.2.1.1.3.1` | Contract Rework Reason Form | Modal Form | `open_office_task_runs` (3 fields) | UC-015 |
| `1.4.4.1.2` | Department Position & Seat Assignment Form | Inline Form | `open_office_org_governance` (3 fields) | UC-010.S09, UC-011..018.S04 |
| `1.5.1.1.1.3.1` | Configure AI Agent Drawer Form | Drawer Form | `ai_agent` (6 fields) | UC-003 |
| `1.5.2.1.1.2.1` | Agent Schedule Definition Form | Modal Form | `agent_schedule` (6 fields) | UC-013 |
| `1.6.1.1.1.3.1` | Store Encrypted Secret Form | Modal Form | `integration_credential` (4 fields) | UC-017 |
| `1.6.2.1.1.2.1` | Invite Workspace Member Form | Modal Form | `team_invite` (6 fields) | UC-017 |
| `1.6.3.1.1` | Organization Profile & Governance Form | Standard Form | `team` (4 fields) | UC-009, UC-011 |
| `2.1.2` | Natural-Language Prompt Composer | Inline Form | `agent_chat_thread` (3 fields) | UC-003 |
| `2.3.1` | Workspace Login & Passkey Form | Authentication Form | `user` (3 fields) | UC-001 |
| `2.3.2` | User Locale, Theme & Start Page Form | Standard Form | `user_preference` (6 fields) | UC-001, UC-008 |

> Full `47` action triggers in [iad_buttons.md](./iad_buttons.md), `21` search/filter controls in [iad_filters.md](./iad_filters.md), and `44` S5/S6/S7 guard notices in [iad_notices.md](./iad_notices.md).

---

## 4. Spatial Zoning, 8pt Grid & Canonical Wireframes (`+---`)

### 4.1 Desktop Shell (`1440x900`) — `AppHeader` (`48px`) + `Sidebar` (`240px`) + `Open Office` (`1.4`)

```text
+---------------------------------------------------------------------------------------------------+
| Top Header Bar (48px, aligned divider <= 1.5px): Project Switcher | Route Title | Guide | Search  |
+----------------------+----------------------------------------------------------------------------+
| Sidebar (240px snap) | Workspace Main Header: Tab Strip (Floorplan | Contracts & Approvals | Metrics) |
|                      +----------------------------------------------------------------------------+
| [Workspace]          | Primary Canvas (Z-Pattern):                  | Right Context Rail (380px)  |
| - Inbox       (1.1)  | +------------------------------------------+ | +-------------------------+ |
| - Work items  (1.2)  | | 8-Dept PixelOfficeCanvas (Single Floor)  | | | Quick Dispatch (<=2 step) | |
| - Timeline    (1.2.2)| | Exec HQ | BA-Tester | AI-Dev | Academy   | | | Title + Lead Agent + CTA  | |
| - Docs & Vibe (1.3)  | | Lobby   | War Room  | HR Ops | Commercial| | | Live Run Evidence & SoD | |
| [AI Operations]      | +------------------------------------------+ | +-------------------------+ |
| - Open Office (1.4)  | +------------------------------------------------------------------------+ |
| - AI Agents   (1.5)  | | Bottom Toast / Undo Latch (10s window): Work saved · Click Undo (Hoan tac)| |
| [Governance]         +----------------------------------------------------------------------------+
| - Vault/Org   (1.6)  | Sliding Overlay Drawers (380px): Chat Panel (2.1) / Workflow Guide (2.2)   |
+----------------------+----------------------------------------------------------------------------+
```

### 4.2 Responsive Breakpoint Grid & Touch Floors
- **Desktop (`1440x900`)**: Fixed `240px` sidebar + synchronized `48px` header (`<= 1.5px` horizontal divider alignment), `>= 32px` compact toolbar buttons, `0px` horizontal bleed (`scrollWidth <= innerWidth`).
- **Tablet (`768x1024`) & Mobile (`390x844` / `360x800`)**: Collapsible sheet sidebar, stacked right rail below canvas, `>= 44x44px` touch target floor, strictly `0px` viewport bleed.
- **Milled Carbon & Swiss Vellum Tokens**: 8-step type floor (`>= 12px`, zero `11px` literals), `>= 4.5:1` body contrast across Dark and Light themes.

---

## 5. UX Microcopy Glossary (`Bảng Thuật Ngữ / Plain-Language Mapping`)

All primary UI chrome across `InboxView`, `ShellHeaderTitle`, `JtbdWorkflowGuideDrawer`, `CompanySetupSection`, `SwarmHitlGovernanceBar`, and `OpenOfficeWorkspaceView` translates internal system tokens into clear human language across all 10 `messages/*/nav.json` locales:

| Internal API / Gate Symbol | Plain-Language UI Copy (English) | Plain-Language UI Copy (Tiếng Việt) | Connected WBS / Notice |
| :--- | :--- | :--- | :--- |
| `AWAITING_HITL` | Waiting for approval | Chờ bạn phê duyệt | `1.1.1.1.1.5`, `1.4.2.1.1` |
| `needs_my_action` | Waiting for you | Cần bạn xử lý | `1.1.1.1.1.1`, `1.4.2.1.1.1` |
| `GW-SOD-01` | Independent Review Policy | Chính sách duyệt độc lập | `1.4.2.1.1.4`, `1.6.3.1.1` |
| `JTBD N · <Title>` | Clean step title (`1. Triage & Decide` / `Workspace Guide`) | Tiêu đề rõ ràng (`1. Phân loại & Quyết định`) | `2.2.1`, `2.2.1.2` |
| `RETURNED_FOR_REWORK` | Changes requested | Yêu cầu chỉnh sửa | `1.4.2.1.1.3.1.2` |
| `STRAT-GOAL` | Strategic Goal | Mục tiêu chiến lược | `53.REF.111`, `2.1.1` |
| `INV-TAX` | Deliverable Category | Danh mục sản phẩm bàn giao | `53.REF.111`, `2.1.2` |
| `SOP-GENERIC-7P` | Standard 7-Step Workflow | Quy trình chuẩn 7 bước | `1.2.1`, `2.2.1` |
| `SOP-CODING-01` | Software Delivery Workflow | Quy trình phát triển phần mềm | `1.2.2`, `2.2.2` |
| `GW-QG-01` | Quality Check Gate | Cổng kiểm tra chất lượng | `1.5.1`, `1.6.1` |
| `GW-UTOP-01` | Spec & Test Baseline | Chuẩn đặc tả & kiểm thử | `1.2.3`, `2.3.1` |
| `GW-UBIQ-01` | Shared Language Check | Kiểm tra thuật ngữ thống nhất | `53.ACT.721`, `2.4.1` |
| `GW-KNOW-01` | Verified Definition Pin | Gắn kết định nghĩa đã duyệt | `53.ACT.723`, `2.4.2` |
| `GW-GIT-BRANCH-01` | Isolated Work Branch | Nhánh làm việc tách biệt | `1.3.1`, `2.5.1` |
| `GW-HEADLESS-01` | Background Verification | Kiểm thử tự động chạy ngầm | `1.5.2`, `2.5.2` |
| `GW-VISUAL-PROOF-01` | Visual Evidence Proof | Bằng chứng hình ảnh xác thực | `1.5.3`, `2.5.3` |
| `INBOX_TRIAGE` | Incoming Requests | Yêu cầu mới cần phân loại | `1.1.1.1`, `2.1.3` |
| `IN_PROGRESS` | Currently in work | Đang thực hiện | `1.4.1.1`, `2.1.4` |
| `COMPLETED` | Finished & verified | Đã hoàn tất & xác thực | `1.6.1.1`, `2.1.5` |
| `BLOCKED` | Needs attention to unblock | Đang bị chặn, cần gỡ vướng | `1.4.3.1`, `2.1.6` |
| `Kahn DAG` | Ordered task sequence | Thứ tự công việc phụ thuộc | `1.3.2`, `2.2.3` |
| `WBS` | Work Breakdown List | Danh sách phân rã công việc | `1.2.4`, `2.2.4` |
| `EAI` | Evidence Accuracy Score | Điểm chính xác bằng chứng | `1.5.4`, `2.6.1` |
| `HITL` | Human Approval Checkpoint | Điểm cần người dùng duyệt | `1.1.1.2`, `2.6.2` |
| `TRI_SYNC` | Encrypted Triple Backup | Sao lưu mã hóa 3 bản | `1.7.1`, `2.7.1` |
| `CANONICAL_TERM` | Official Term | Thuật ngữ chính thức | `53.ACT.721`, `2.4.3` |

---

## 6. Bilingual `S0`–`S7` Micro-State, Empty, Error & Undo Matrix

| State | English Treatment | Tiếng Việt Treatment | Interaction & Recovery Rule |
| :---: | :--- | :--- | :--- |
| **S0** | Skeleton shimmer matching exact card/table geometry (`0` CLS) | Khung chờ mô phỏng đúng kích thước bảng/thẻ | Mutations disabled until hydration finishes |
| **S1** | Clean Swiss Vellum / Milled Carbon borders with grouped labels | Giao diện tĩnh rõ nhãn `Không gian làm việc` / `Vận hành AI` | Interactive focus & keyboard shortcuts ready |
| **S2** | Subtle accent tint hover + `2px` high-contrast focus ring | Đổi nền nhẹ khi trỏ chuột + viền focus rõ ràng | Full `Tab` / `Shift+Tab` keyboard reachability |
| **S3** | Instant button press feedback (`scale(0.98)` / `< 50ms`) | Phản hồi nhấn tức thì dưới `50ms` | Optimistic transition dispatched immediately |
| **S4** | Inline spinner preserving label while preventing double-submit | Vòng xoay tại chỗ giữ nguyên nhãn nút | CTA disabled during async request |
| **S5** | Helpful empty state + direct primary action CTA | Trạng thái trống thân thiện kèm nút tạo mới | Zero dead ends; links directly to creation form |
| **S6** | Soft error banner + clear human explanation + Retry action | Thẻ báo lỗi dễ hiểu kèm nút Thử lại | Never show raw stack trace or `NaN` |
| **S7** | Non-blocking confirmation toast with 10s **Undo** action | Thông báo thành công kèm **Hoàn tác** trong `10s` | Reverts optimistic mutation cleanly if undone |

---

## 7. Cognitive Friction Budget

| Surface / Flow (`6-JTBD`) | Max Clicks to Goal | Scroll Tax Budget | Max Items per Group (Rule of 6) | Target Route |
| :--- | :---: | :---: | :---: | :--- |
| `1.1` Inbox Triage & Handoff Bridge | `<= 2` clicks | `0px` above fold | `5` children (`< 7`) | `/[teamRef]/[projectKey]/inbox` |
| `1.2` Work Item Create / Move | `<= 2` clicks | `0px` above fold | `6` card fields (`< 7`) | `/[teamRef]/[projectKey]` |
| `1.3` Docs & Vibe Finder Slice Inspect | `<= 2` clicks | `0px` sidebar/reader | `5` MECE zones (`< 7`) | `/[teamRef]/[projectKey]/vibe` |
| `1.4` Open Office Contract Dispatch / Approve | `<= 2` clicks | `0px` docked right rail | `4` controls (`< 7`) | `/[teamRef]/[projectKey]/open-office` |
| `1.5` Agent Sheet Edit / Schedule | `<= 2` clicks | `0px` slide-over drawer | `6` fields (`< 7`) | `/[teamRef]/[projectKey]/agents` |
| `1.6` Secret Reveal / Org Settings | `<= 2` clicks | `0px` table view | `6` controls (`< 7`) | `/[teamRef]/[projectKey]/vault` |
| `2.1` Contextual Copilot Chat Reply | `<= 2` clicks | Sticky composer | `2` child groups (`0` Tabs) | Any route (Header Chat drawer) |

---

<!-- AST-GEN:NEXTJS-ROUTES:START -->
## 7.5 Complete Next.js App Router Inventory (79/79 Pages), Post-`53.ACT.592` Modules & Live UI Contracts

### Registered App Router Pages (`apps/web/src/app/**/page.tsx`)

| Normalized Route | Kind | Source File |
| :--- | :--- | :--- |
| `/[teamRef]/[projectKey]/agents/chat` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/agents/chat/page.tsx` |
| `/[teamRef]/[projectKey]/agents` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/agents/page.tsx` |
| `/[teamRef]/[projectKey]/agents/schedules` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/agents/schedules/page.tsx` |
| `/[teamRef]/[projectKey]/api` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/api/page.tsx` |
| `/[teamRef]/[projectKey]/cycles/[cycle]` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/cycles/[cycle]/page.tsx` |
| `/[teamRef]/[projectKey]/cycles` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/cycles/page.tsx` |
| `/[teamRef]/[projectKey]/dashboards/[dashboardId]` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/dashboards/[dashboardId]/page.tsx` |
| `/[teamRef]/[projectKey]/dashboards` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/dashboards/page.tsx` |
| `/[teamRef]/[projectKey]/dashboards/watched` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/dashboards/watched/page.tsx` |
| `/[teamRef]/[projectKey]/directory` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/directory/page.tsx` |
| `/[teamRef]/[projectKey]/docs/[documentId]` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/docs/[documentId]/page.tsx` |
| `/[teamRef]/[projectKey]/docs` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/docs/page.tsx` |
| `/[teamRef]/[projectKey]/inbox` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/inbox/page.tsx` |
| `/[teamRef]/[projectKey]/initiatives/[initiative]/issues` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/initiatives/[initiative]/issues/page.tsx` |
| `/[teamRef]/[projectKey]/initiatives/[initiative]` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/initiatives/[initiative]/page.tsx` |
| `/[teamRef]/[projectKey]/initiatives/[initiative]/progress` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/initiatives/[initiative]/progress/page.tsx` |
| `/[teamRef]/[projectKey]/initiatives` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/initiatives/page.tsx` |
| `/[teamRef]/[projectKey]/mcp` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/mcp/page.tsx` |
| `/[teamRef]/[projectKey]/members` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/members/page.tsx` |
| `/[teamRef]/[projectKey]/notes/[boardId]` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/notes/[boardId]/page.tsx` |
| `/[teamRef]/[projectKey]/notes` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/notes/page.tsx` |
| `/[teamRef]/[projectKey]/notifications` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/notifications/page.tsx` |
| `/[teamRef]/[projectKey]/onboarding` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/onboarding/page.tsx` |
| `/[teamRef]/[projectKey]/open-office` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/open-office/page.tsx` |
| `/[teamRef]/[projectKey]` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/page.tsx` |
| `/[teamRef]/[projectKey]/settings/actions` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/settings/actions/page.tsx` |
| `/[teamRef]/[projectKey]/settings/configuration` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/settings/configuration/page.tsx` |
| `/[teamRef]/[projectKey]/settings/custom-fields` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/settings/custom-fields/page.tsx` |
| `/[teamRef]/[projectKey]/settings/general` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/settings/general/page.tsx` |
| `/[teamRef]/[projectKey]/settings/git` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/settings/git/page.tsx` |
| `/[teamRef]/[projectKey]/settings/import-export` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/settings/import-export/page.tsx` |
| `/[teamRef]/[projectKey]/settings/issue-templates` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/settings/issue-templates/page.tsx` |
| `/[teamRef]/[projectKey]/settings/issue-types` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/settings/issue-types/page.tsx` |
| `/[teamRef]/[projectKey]/settings/labels` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/settings/labels/page.tsx` |
| `/[teamRef]/[projectKey]/settings` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/settings/page.tsx` |
| `/[teamRef]/[projectKey]/settings/states` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/settings/states/page.tsx` |
| `/[teamRef]/[projectKey]/settings/webhooks` | Cut / Redirect Stub | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/settings/webhooks/page.tsx` |
| `/[teamRef]/[projectKey]/timeline` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/timeline/page.tsx` |
| `/[teamRef]/[projectKey]/vault` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/vault/page.tsx` |
| `/[teamRef]/[projectKey]/vibe` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/vibe/page.tsx` |
| `/[teamRef]/[projectKey]/view/[viewId]` | Active Page | `apps/web/src/app/[teamRef]/(shell)/[projectKey]/view/[viewId]/page.tsx` |
| `/[teamRef]/issue/[identifier]` | Active Page | `apps/web/src/app/[teamRef]/(shell)/issue/[identifier]/page.tsx` |
| `/[teamRef]` | Active Page | `apps/web/src/app/[teamRef]/page.tsx` |
| `/[teamRef]/settings/agent-skills` | Active Page | `apps/web/src/app/[teamRef]/settings/agent-skills/page.tsx` |
| `/[teamRef]/settings/agent-tools` | Active Page | `apps/web/src/app/[teamRef]/settings/agent-tools/page.tsx` |
| `/[teamRef]/settings/ai-agents` | Active Page | `apps/web/src/app/[teamRef]/settings/ai-agents/page.tsx` |
| `/[teamRef]/settings/capabilities` | Active Page | `apps/web/src/app/[teamRef]/settings/capabilities/page.tsx` |
| `/[teamRef]/settings/git` | Active Page | `apps/web/src/app/[teamRef]/settings/git/page.tsx` |
| `/[teamRef]/settings/integrations` | Active Page | `apps/web/src/app/[teamRef]/settings/integrations/page.tsx` |
| `/[teamRef]/settings/llm-router` | Active Page | `apps/web/src/app/[teamRef]/settings/llm-router/page.tsx` |
| `/[teamRef]/settings/mcp` | Active Page | `apps/web/src/app/[teamRef]/settings/mcp/page.tsx` |
| `/[teamRef]/settings/members` | Active Page | `apps/web/src/app/[teamRef]/settings/members/page.tsx` |
| `/[teamRef]/settings/notifications` | Active Page | `apps/web/src/app/[teamRef]/settings/notifications/page.tsx` |
| `/[teamRef]/settings/org-chart` | Active Page | `apps/web/src/app/[teamRef]/settings/org-chart/page.tsx` |
| `/[teamRef]/settings` | Active Page | `apps/web/src/app/[teamRef]/settings/page.tsx` |
| `/[teamRef]/settings/projects` | Active Page | `apps/web/src/app/[teamRef]/settings/projects/page.tsx` |
| `/[teamRef]/settings/roles` | Active Page | `apps/web/src/app/[teamRef]/settings/roles/page.tsx` |
| `/account/accounts` | Active Page | `apps/web/src/app/account/accounts/page.tsx` |
| `/account/api-keys` | Active Page | `apps/web/src/app/account/api-keys/page.tsx` |
| `/account/company` | Active Page | `apps/web/src/app/account/company/page.tsx` |
| `/account/preferences` | Active Page | `apps/web/src/app/account/preferences/page.tsx` |
| `/account/profile` | Active Page | `apps/web/src/app/account/profile/page.tsx` |
| `/account/security` | Active Page | `apps/web/src/app/account/security/page.tsx` |
| `/account/teams/[teamId]/[[...section]]` | Cut / Redirect Stub | `apps/web/src/app/account/teams/[teamId]/[[...section]]/page.tsx` |
| `/account/teams` | Active Page | `apps/web/src/app/account/teams/page.tsx` |
| `/forgot-password` | Active Page | `apps/web/src/app/forgot-password/page.tsx` |
| `/god` | Cut / Redirect Stub | `apps/web/src/app/god/page.tsx` |
| `/invite/[token]` | Active Page | `apps/web/src/app/invite/[token]/page.tsx` |
| `/issue/[issueId]` | Active Page | `apps/web/src/app/issue/[issueId]/page.tsx` |
| `/kara` | Active Page | `apps/web/src/app/kara/page.tsx` |
| `/login` | Active Page | `apps/web/src/app/login/page.tsx` |
| `/oauth/consent` | Active Page | `apps/web/src/app/oauth/consent/page.tsx` |
| `/onboarding` | Active Page | `apps/web/src/app/onboarding/page.tsx` |
| `/page.tsx` | Active Page | `apps/web/src/app/page.tsx` |
| `/project/[projectKey]/[[...rest]]` | Active Page | `apps/web/src/app/project/[projectKey]/[[...rest]]/page.tsx` |
| `/register` | Active Page | `apps/web/src/app/register/page.tsx` |
| `/reset-password` | Active Page | `apps/web/src/app/reset-password/page.tsx` |
| `/share/issue/[token]` | Active Page | `apps/web/src/app/share/issue/[token]/page.tsx` |
| `/share/view/[token]` | Active Page | `apps/web/src/app/share/view/[token]/page.tsx` |

### Post-`53.ACT.592` Frontend Modules & Live Production Contracts (`53.ANA.629` / `53.ACT.633` / `53.ACT.645`)

- **Org Chart & Team Shell**: `/[teamRef]/settings/org-chart` (`OrgTeamsBody`, `TeamOrgChartSection`, `OrgChartInspectorDrawer`), `WorkDeliverySubBar`, `ChatPanel`, and `WeKnoraCopilotDock`.
- **Open Office Dual-Canvas & Command Layer**: `BeehiveColonyLens`, `pixelBeehiveEngine`, `limezuAtlasEngine` (`public/open-office/atlas.png`), `OfficeBulkDispatchPanel`, `OfficeDeptPositionsTab`, `OfficeStaffSetupTab`, `OfficeSubTabs`, `OpenOfficeCommandPalette`, and `EvidenceFullscreenReader`.
- **Live API / UI Sync Boundaries (`53.ACT.645`)**: `apps/api/src/modules/issues/service.ts` (`listBoardIssuesWithMeta`) applies column-fair `ROW_NUMBER()` loading (`200` per active column, `100` per terminal column) returning `{ issues, totalCount, truncated, columnTotals }` without column starvation; `StatWidget` queries server-side `GET /projects/:projectKey/analytics/stats` and `POST /projects/:projectKey/analytics/stat-count` (`archived_at IS NULL` enforced across all 8 `analytics/service.ts` issue-domain functions); standalone `/[teamRef]/timeline` passes `liveIssues=[]` unless scoped inside `[projectKey]/timeline`; cross-widget refresh dispatches `itsaplan:work-items-updated` from `WeKnoraCopilotDock`.
<!-- AST-GEN:NEXTJS-ROUTES:END -->

## 8. YAML Lock Manifest (`sha256_spec_seal`)

```yaml
iad_specification_metadata:
  document_id: "IAD-ITSAPLAN"
  version: "4.0.0"
  status: "LOCKED"
  utop_artifact_number: 18
  seal_scope: "SHA-256 of canonical Markdown body preceding Section 8 YAML Lock Manifest"
  sha256_spec_seal: "691f2a4db032d464de346e73f1d7dea16ca5c8056f811461a51e0ddd396a09c3"
  wbs_node_count: 212
  connected_catalogs:
    views: "docs/iad_views.md (58)"
    forms: "docs/iad_forms.md (19)"
    buttons: "docs/iad_buttons.md (47)"
    filters: "docs/iad_filters.md (21)"
    notices: "docs/iad_notices.md (44)"
  generated_at_utc: "2026-11-24T14:45:01Z"
```

<!-- CACHE_BOUNDARY_COLD_START -->

```json-ld
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "@id": "urn:antigravity:itsaplan:iad:v4",
  "identifier": "IAD-ITSAPLAN",
  "name": "ItsAPlan / ACCORD Master Information Architecture & Interaction Design Specification (v4.0.0)",
  "version": "4.0.0",
  "headline": "6-JTBD Connected WBS Information Architecture, 5 Companion CSV/MD Catalogs & Plain-Language UX Contract",
  "datePublished": "2026-11-15",
  "inLanguage": ["en", "vi"],
  "isPartOf": ["UC-001", "UC-002", "UC-003", "UC-004", "UC-005", "UC-006", "UC-007", "UC-008", "UC-009", "UC-010", "UC-011", "UC-012", "UC-013", "UC-014", "UC-015", "UC-016", "UC-017", "UC-018"],
  "hasPart": [
    "docs/iad.md",
    "docs/iad_views.md",
    "docs/iad_forms.md",
    "docs/iad_buttons.md",
    "docs/iad_filters.md",
    "docs/iad_notices.md",
    "docs/IAD_AUTHORING_PROMPT.md",
    "docs/IAD_VIEW_LIST_PROMPT.md",
    "docs/IAD_FORM_LIST_PROMPT.md",
    "docs/IAD_BUTTON_LIST_PROMPT.md",
    "docs/IAD_FILTER_LIST_PROMPT.md",
    "docs/IAD_NOTICE_LIST_PROMPT.md"
  ]
}
```
