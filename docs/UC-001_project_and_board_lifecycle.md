# UC-001: Manage Project and Board Lifecycle

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-001` |
| **Title** | Manage Project and Board Lifecycle |
| **Primary Actor** | Project Lead / Workspace Administrator |
| **Goal** | Provision, configure, and govern projects, workflow status columns, WIP limits, and team access matrices. |
| **Scope** | System (`apps/api`, `apps/web`, `packages/db`) |
| **Level** | 🌊 User Goal |
| **Preconditions** | The actor possesses an active, authenticated session with project owner or team manager privileges. |
| **Success Guarantee** | Project metadata, configurable feature toggles, column states, and role-based access rules are persistently committed and reflected live across client boards. |
| **Minimum Guarantee** | In the event of a validation or permission failure, no settings or column definitions are partially committed; database transactions roll back atomically. |

---

## 1. Sizing & Splitting Decision (Phase 0)
- **Primary Pattern Applied**: Pattern 2 (Operations / CRUD) & Pattern 3 (Business Rule Variations).
- **Rationale**: Project governance naturally decouples into project provisioning, board workflow column lifecycle (with state type semantics and WIP limits), and role-based permission management.

---

## 2. Basic Flow (Main Scenario)
1. **Initiate Creation**: The Project Lead submits a project creation request specifying `key` (e.g., `PRJ`), `name`, and optional `description`.
2. **Key Validation & Sequence Minting**: The system asserts that `key` is globally unique and initializes `next_sequence = 1`.
3. **Seed Default Schema**: The system automatically provisions the project with the team's default workflow columns (`Backlog`, `To Do`, `In Progress`, `Done`, `Canceled`), default issue types, and binds the creator as an `owner` in `project_member`.
4. **Customize Workflow Columns**: The Project Lead modifies column definitions, assigning `state_type` (`backlog`, `unstarted`, `started`, `completed`, `canceled`), custom display color, fractional display position, optional `wip_limit`, `wip_mode` (`soft` vs `hard`), and optional `auto_assign_user_id`.
5. **Adjust Feature Toggles**: The Project Lead toggles modular subsystem flags in `project` (`initiativesEnabled`, `cyclesEnabled`, `documentsEnabled`, `notesEnabled`, `timeLoggingEnabled`, `pointsEstimateEnabled`, `mcpEnabled`).
6. **Assign Role Permissions**: The Project Lead defines custom team roles with granular CRUD resource matrices (`team_role.permissions`) and assigns project members to designated roles.
7. **Broadcast State**: The system records the configuration, increments the project revision counter, and reflects the updated board topology to all connected clients.

---

## 3. Alternate & Exception Flows
- **A1 — Duplicate Project Key**:
  - *Condition*: The submitted project key already exists in `project.key`.
  - *System Response*: The system aborts creation, rejects the request with HTTP 409 Conflict, and indicates that the key is already claimed.
- **A2 — Non-Contiguous or Invalid Column Reordering**:
  - *Condition*: Reordering columns violates unique position constraints or attempts to delete a column currently holding active issues.
  - *System Response*: The API rejects the deletion with HTTP 400 Bad Request, instructing the user to transfer or archive existing issues before removing the column.
- **A3 — Hard WIP Limit Breach on Drag-and-Drop**:
  - *Condition*: A user attempts to transition an issue into a column whose current issue count equals or exceeds `wip_limit` when `wip_mode = 'hard'`.
  - *System Response*: The system blocks the movement, returns HTTP 400 with a localized WIP limit violation message, and snaps the issue card back to its originating column.
- **A4 — Unauthorized Role Escalation**:
  - *Condition*: A non-owner member attempts to modify `team_role` or promote a member to `owner`.
  - *System Response*: The system checks `requireProjectOwner` / `assertProjectAdmin`, aborts execution, and returns HTTP 403 Forbidden.

---

## 4. Use-Case Slices
- **Slice S01: Project Provisioning & Feature Configuration**  
  *Scope*: Create project, set sequence, toggle optional modules (initiatives, cycles, docs, time logging).  
  *Traceability*: → TC: `TC-UC-001 Scenario G01` (Create project with custom key and feature toggles).
- **Slice S02: Workflow Column Topology & WIP Enforcement**  
  *Scope*: Column CRUD, state type mapping, position reordering, soft and hard WIP limit checks.  
  *Traceability*: → TC: `TC-UC-001 Scenario G02` (Configure workflow columns and verify hard WIP rejection).
- **Slice S03: Role Matrix & Membership Access Control**  
  *Scope*: Custom role permission matrix assignment and membership authorization guards.  
  *Traceability*: → TC: `TC-UC-001 Scenario G03` (Verify member permissions against restricted resources).

---

## 5. Revision History
- **2026-09-21**: Version 1.0.0 — Initial baseline aligned with `apps/api/src/modules/projects`, `columns`, `roles`, and `packages/db/src/schema/app.ts`.
