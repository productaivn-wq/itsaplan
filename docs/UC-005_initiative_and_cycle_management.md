# UC-005: Manage Initiatives, Cycles, and Progress Rollups

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-005` |
| **Title** | Manage Strategic Initiatives and Sprint Cycles |
| **Primary Actor** | Product Manager / Scrum Master |
| **Goal** | Organize long-term initiatives, plan time-boxed sprint cycles, track automated completion rollups, and rollover incomplete cycle scope. |
| **Scope** | System (`apps/api`, `apps/web`, `packages/db`) |
| **Level** | 🌊 User Goal |
| **Preconditions** | `initiativesEnabled` and `cyclesEnabled` are active in project settings; the actor has planning permissions. |
| **Success Guarantee** | Initiative health and cycle burndown are dynamically aggregated; non-overlapping cycle invariants are strictly enforced. |
| **Minimum Guarantee** | Deleting an initiative or cycle unlinks assigned issues (`ON DELETE SET NULL`) without deleting the underlying work items. |

---

## 1. Sizing & Splitting Decision (Phase 0)
- **Primary Pattern Applied**: Pattern 1 (Workflow Steps) & Pattern 2 (Operations / CRUD).
- **Rationale**: Decouples continuous strategic initiatives (open-ended timeline, health computation) from rigid sprint cycles (strict non-overlapping time windows and scope transfer).

---

## 2. Basic Flow (Main Scenario)
1. **Create Initiative**: The Product Manager creates an `initiative` with `title`, `description`, `status` (`proposed`, `planned`, `active`, `completed`, `canceled`), `startDate`, `targetDate`, and `ownerUserId`.
2. **Link Issues to Initiative**: Issues are associated via `issue.initiativeId`. The system dynamically computes initiative health and completion percentage by rolling up child issue statuses.
3. **Plan Sprint Cycle**: The Scrum Master provisions a `cycle` specifying `name`, `goal`, `startDate`, and `endDate`.
4. **Validate Non-Overlap**: The system verifies that `endDate >= startDate` and that no existing cycle in the project overlaps with the selected date range.
5. **Assign Issues to Cycle**: The team assigns issues to `cycle.id`. The system records an active stretch in `issue_cycle` for historical velocity tracking.
6. **Complete Cycle Early or on Schedule**: Upon sprint conclusion or early finish (`completedAt = now()`), the system locks the cycle.
7. **Transfer Incomplete Scope**: The Scrum Master invokes scope rollover (`transfer_cycle_issues`), atomically migrating unfinished issues to the next upcoming cycle or the backlog.

---

## 3. Alternate & Exception Flows
- **A1 — Overlapping Cycle Rejection**:
  - *Condition*: A new cycle's date interval intersects with an existing cycle in the same project.
  - *System Response*: The system rejects creation with HTTP 400 Bad Request, enforcing that at most one cycle can be active at any time.
- **A2 — Initiative Cascade Safety**:
  - *Condition*: A Product Manager deletes an initiative with 50 linked issues.
  - *System Response*: The initiative row is removed, and foreign keys on `issue.initiative_id` are set to `NULL` via `ON DELETE SET NULL`. Zero issues are deleted.
- **A3 — Incomplete Scope Rollback Failure**:
  - *Condition*: Scope transfer targets a non-existent cycle ID.
  - *System Response*: The transfer transaction rolls back entirely, leaving all issue cycle assignments untouched.

---

## 4. Use-Case Slices
- **Slice S01: Initiative Lifecycle & Health Rollup**  
  *Scope*: Initiative CRUD, dynamic completion rate aggregation, timeline tracking.  
  *Traceability*: → TC: `TC-UC-005 Scenario G01` (Create initiative and verify completion status rollup).
- **Slice S02: Non-Overlapping Cycle Governance**  
  *Scope*: Sprint cycle provisioning, date validation, overlap prevention invariants.  
  *Traceability*: → TC: `TC-UC-005 Scenario G02` (Verify overlapping sprint cycle creation is rejected).
- **Slice S03: Sprint Scope Transfer & Historical Tracking**  
  *Scope*: Cycle finish override, issue transfer, `issue_cycle` stretch auditing.  
  *Traceability*: → TC: `TC-UC-005 Scenario G03` (Transfer unfinished issues to next cycle).

---

## 5. Revision History
- **2026-09-21**: Version 1.0.0 — Derived from `apps/api/src/modules/initiatives`, `cycles`, and `packages/db/src/schema/app.ts`.
