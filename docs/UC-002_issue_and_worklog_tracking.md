# UC-002: Track Issues, Checklists, and Worklogs

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-002` |
| **Title** | Track Issues, Checklists, and Worklogs |
| **Primary Actor** | Software Engineer / Contributor |
| **Goal** | Create, assign, estimate, transition issues across workflow columns, maintain checklists, log spent time, and monitor issue updates via subscriptions. |
| **Scope** | System (`apps/api`, `apps/web`, `packages/db`) |
| **Level** | 🌊 User Goal |
| **Preconditions** | The user has read and edit permissions on `work_items` within the target project. |
| **Success Guarantee** | Issue properties are persisted, activity history is recorded, time tracking aggregates are recalculated, and watchers receive notifications. |
| **Minimum Guarantee** | Invalid state transitions, invalid worklog minutes, or cyclic parent-child links are rejected without corrupting issue data. |

---

## 1. Sizing & Splitting Decision (Phase 0)
- **Primary Pattern Applied**: Pattern 1 (Workflow Steps) & Pattern 4 (Variations in Data).
- **Rationale**: Issue tracking encompasses core card state transitions, subtask trees, discrete checklist completion, and time tracking worklogs.

---

## 2. Basic Flow (Main Scenario)
1. **Create Issue**: The Contributor creates an issue by specifying `title`, optional `description`, `typeId`, `priority`, optional `assigneeUserId`, `estimatePoints`, and `estimateMinutes`.
2. **Sequence Numbering**: The system atomically increments `project.next_sequence` and assigns a canonical sequence identifier (`${project.key}-${sequenceNumber}`).
3. **Move Card Across Columns**: The Contributor drags the issue card to a target workflow column.
4. **Enforce Column Policies**: The system checks column WIP limit rules. If valid, updates `column_id`, adjusts fractional `position`, executes `auto_assign_user_id` if defined, closes the preceding `issue_status` duration record, and opens a new active status record.
5. **Manage Checklists**: The Contributor adds an `issue_checklist`, populates `issue_checklist_item` rows, and toggles items to `done = true`.
6. **Log Work Time**: The Contributor logs an `issue_worklog` entry with `minutes > 0`, `spentOn` date, and optional notes. The system computes remaining time as `estimateMinutes - sum(minutes)`.
7. **Record Activity & Trigger Watchers**: The system writes an `issue_activity` log entry (`kind = 'activity'`), auto-subscribes actors if `user_preference.autoWatch = true`, bumps the `board:<projectId>` and `issue:<issueId>` revision counters, and emits `notification` rows for all active watchers.

---

## 3. Alternate & Exception Flows
- **A1 — Invalid Subtask Nesting**:
  - *Condition*: The user attempts to set `parentId` to an issue that already has a `parentId` (2-level hierarchy limit).
  - *System Response*: The system throws HTTP 400 Bad Request: "An issue with a parent cannot itself be a parent."
- **A2 — Non-Positive Worklog Entry**:
  - *Condition*: The user submits an `issue_worklog` with `minutes <= 0`.
  - *System Response*: The database check constraint `issue_worklog_minutes_check` or API schema validator rejects the payload with HTTP 400.
- **A3 — Soft WIP Limit Warning**:
  - *Condition*: The destination column has `wip_mode = 'soft'` and issue count exceeds `wip_limit`.
  - *System Response*: The card transition succeeds, but the UI surfaces a visual soft-cap warning indicator.
- **A4 — Concurrent Move Conflict**:
  - *Condition*: Two users reorder or move the same card concurrently.
  - *System Response*: The system reconciles positions using floating-point fractional indices; if identical, the latest timestamp wins without data loss.

---

## 4. Use-Case Slices
- **Slice S01: Issue Creation, Estimation, and Hierarchy**  
  *Scope*: Sequence generation, field attribution, single-level subtask nesting.  
  *Traceability*: → TC: `TC-UC-002 Scenario G01` (Create issue and attach subtask).
- **Slice S02: Kanban Transition & Status Accounting**  
  *Scope*: Column state updates, auto-assignment, duration tracking in `issue_status`.  
  *Traceability*: → TC: `TC-UC-002 Scenario G02` (Drag-and-drop issue and verify status timestamp logging).
- **Slice S03: Checklists & Atomic Worklog Logging**  
  *Scope*: Checklist item completion, worklog aggregation, remaining estimate derivation.  
  *Traceability*: → TC: `TC-UC-002 Scenario G03` (Log worklog minutes and verify remaining time computation).

---

## 5. Revision History
- **2026-09-21**: Version 1.0.0 — Derived from `apps/api/src/modules/issues`, `checklists`, `worklogs`, and `packages/db/src/schema/app.ts`.
