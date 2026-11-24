# UC-006: Document and Knowledge Collaboration

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-006` |
| **Title** | Author Collaborative Knowledge Documents and Link Assets |
| **Primary Actor** | Technical Writer / Software Architect |
| **Goal** | Create hierarchical knowledge documents, collaborate concurrently via OT steps, link documents to issues and initiatives, and manage revisions. |
| **Scope** | System (`apps/api`, `apps/web`, `packages/db`) |
| **Level** | 🌊 User Goal |
| **Preconditions** | `documentsEnabled` is active; the user has `documents:create` and `documents:edit` permissions. |
| **Success Guarantee** | Document tree hierarchy is maintained, ProseMirror OT steps are rebased atomically, revision snapshots are permanently recorded, and asset attachments are securely accessible. |
| **Minimum Guarantee** | Out-of-order edits trigger optimistic locking rejections; private pages remain invisible to unauthorized project members. |

---

## 1. Sizing & Splitting Decision (Phase 0)
- **Primary Pattern Applied**: Pattern 1 (Workflow Steps) & Pattern 5 (Data Entry Methods).
- **Rationale**: Separates document tree hierarchy and metadata from real-time collaborative ProseMirror step rebasing and versioned history snapshots.

---

## 2. Basic Flow (Main Scenario)
1. **Create Document**: The Author creates a `project_document` specifying `title`, `parentId` (for nested hierarchy), `fullWidth`, and optional `isPrivate = true`.
2. **Open Collaborative Session**: The Author's editor connects to `POST /projects/:projectKey/documents/:documentId/session`, receiving the current `epoch`, `version`, and ProseMirror AST `contentJson`.
3. **Dispatch Realtime Steps**: As users type, the editor submits incremental operational transformation changes via `POST /steps`.
4. **Rebase and Increment Version**: The system applies steps in `document_step`, increments document `version`, and updates `document_collaboration`.
5. **Trigger Automatic Revision Snapshot**: A database trigger copies the updated document state into `project_document_revision`, preserving an immutable audit trail.
6. **Cross-Link Entities**: The Author links the document to relevant issues (`project_document_issue`) and initiatives (`project_document_initiative`).
7. **Embed Secure Assets**: The Author uploads media or architectural diagrams to `document_asset`, stored in S3 and gated behind project document authentication.

---

## 3. Alternate & Exception Flows
- **A1 — Concurrent Version Desynchronization (409 Conflict)**:
  - *Condition*: A client submits OT steps based on an outdated document version.
  - *System Response*: The API responds with HTTP 409 Conflict. The client calls `GET /steps` to fetch intermediary steps, rebases its local model, and resubmits.
- **A2 — Unauthorized Access to Private Document**:
  - *Condition*: A non-owner project member attempts to access a document where `isPrivate = true` and `ownerUserId != currentUser.id`.
  - *System Response*: The system filters out the document from tree queries and returns HTTP 404/403 on direct URL access.
- **A3 — Revision Rollback**:
  - *Condition*: An author restores an earlier revision (`restore_document_revision`).
  - *System Response*: The system reads the target revision snapshot, increments the document version, writes the reverted content, and records a fresh revision snapshot.

---

## 4. Use-Case Slices
- **Slice S01: Hierarchical Document Tree & Privacy Controls**  
  *Scope*: Tree hierarchy, private page isolation, locking.  
  *Traceability*: → TC: `TC-UC-006 Scenario G01` (Create nested document and enforce privacy bounds).
- **Slice S02: Realtime Collaborative Step Rebasing**  
  *Scope*: Collaborative session handshake, ProseMirror step rebasing, conflict detection.  
  *Traceability*: → TC: `TC-UC-006 Scenario G02` (Submit concurrent OT steps and verify rebasing).
- **Slice S03: Entity Linking, Assets, and Revision Rollback**  
  *Scope*: Bi-directional issue/initiative links, secure asset hosting, revision rollback.  
  *Traceability*: → TC: `TC-UC-006 Scenario G03` (Link document to issue and rollback revision).

---

## 5. Revision History
- **2026-09-21**: Version 1.0.0 — Aligned with `apps/api/src/modules/documents`, `packages/db/src/schema/app.ts`, and ProseMirror collaboration engine.

---

## Use-Case 3.0 Governance, Slicing & Lifecycle Specification (`53.REF.112` — `UC-006`)

### Use-Case 3.0 Identification & Dual Lifecycle State Card

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-006` |
| **Title** | Document and Knowledge Collaboration |
| **Primary Actor** | Human Node (`HUM` — Project Owner), Deterministic Code Node (`DET`, $P=1$), Autonomous Agent Node (`AGT`) |
| **Goal** | Execute and verify **Document and Knowledge Collaboration** with deterministic $P=1$ state guarantees across all Use-Case Slices (`UC-006`). |
| **Scope** | Enterprise System (`53_PROJECT_MANAGEMENT` / Sovereign Agentic OS) |
| **Level** | 🌊 User Goal |
| **UC Lifecycle State** | `All Flows Fulfilled` (`Goal Established` → `Flow Structure Understood` → `Basic Flow Enabled` → `Sufficient Flows Fulfilled` → `All Flows Fulfilled`) |
| **Slice Lifecycle State** | `Verified` (`Identified` → `Defined` → `Analyzed` → `Prepared` → `Implemented` → `Verified`) |
| **Governing Standard** | `30_REFERENCE/53.REF.112` (*USE-CASE 3.0: The Definitive Guide — Refreshed*, Jacobson et al., May 2024) |

<!-- AUTO_SYNC_SWP_CAPABILITIES_START -->
## Auto-Synced SWP Capabilities & Use-Case Deltas (`GW-SWP-REGISTRY-UC-SYNC-01`)
- **Control-Tower Task**: `53.ACT.668` (`10_SPECS/SPEC-PORTFOLIO-ITP.md`)
- **Source Repositories**: `titanwings/distilly`
- **Impact Tier**: `TIER_1` | **Mapped SWP IDs**: `SWP-DST-01, SWP-DST-02, SWP-DST-03, SWP-DST-04, SWP-DST-05, SWP-DST-07, SWP-DST-10, SWP-DST-13, SWP-DST-14, SWP-DST-16, SWP-DST-17, SWP-DST-19, SWP-DST-21, SWP-DST-22`
- **Adoption Rationale**: Isolated MCP env, read-only MCP fixture, skill memory append-only merge + frontmatter safety, OpenJev risk gate & Decree 13 HR roster.
- **Capability Requirement (`CAP-ITP-DISTILLY`)**: Enforce SWP-DST-01, SWP-DST-02, SWP-DST-03, SWP-DST-04, SWP-DST-05, SWP-DST-07, SWP-DST-10, SWP-DST-13, SWP-DST-14, SWP-DST-16, SWP-DST-17, SWP-DST-19, SWP-DST-21, SWP-DST-22 deterministic invariants in this spoke's UCs and automated regression tests.
<!-- AUTO_SYNC_SWP_CAPABILITIES_END -->
