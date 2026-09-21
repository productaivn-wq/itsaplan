# Bidirectional Traceability Matrix (docs/traceability_matrix.md)

**Document ID**: `58.DOC.TRACE.001`  
**Classification**: Enterprise Traceability Matrix (IEEE 829 / ISO 29119)  
**Standard**: 14-Artifact UTOP Full Lineage Standard  
**Status**: ACTIVE & SYNCHRONIZED  

---

## 1. Traceability Architecture

The UTOP framework enforces strict end-to-end forward and backward traceability across the 6 architectural tiers:
$$\text{BMC} \xrightarrow{} \text{Capability} \xrightarrow{} \text{BPMN} \xrightarrow{} \text{Use Case 3.0} \xrightarrow{} \text{FR/NFR} \xrightarrow{} \text{Code Node} \xrightarrow{} \text{Test Spec} \xrightarrow{} \text{Test Data}$$

---

## 2. Master Bidirectional Traceability Table

| Cap ID | Use Case | FR / NFR | Code Implementation File | Test Case ID | Declarative Test Data Record |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CAP-PROJ** | `UC-001` | **FR-001** | [`apps/api/src/modules/projects/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L45) | `TC-UC001-01` | `TC-001-FR001-POSITIVE`, `NEGATIVE` |
| **CAP-PROJ** | `UC-001` | **FR-002** | [`apps/api/src/modules/issues/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L76) | `TC-UC001-02` | `TC-001-FR002-STATEFUL` |
| **CAP-PROJ** | `UC-001` | **FR-003** | [`apps/api/src/shared/guards.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/shared/guards.ts#L30) | `TC-UC001-03` | `TC-001-FR003-POSITIVE`, `NEGATIVE` |
| **CAP-AUTH** | `UC-001` | **FR-004** | [`apps/api/src/shared/access.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/shared/access.ts#L45) | `TC-UC001-04` | `TC-001-FR004-UNAUTHORIZED` |
| **CAP-AUTH** | `UC-001` | **FR-005** | [`apps/api/src/shared/access.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/shared/access.ts#L60) | `TC-UC001-04` | `TC-001-FR005-POSITIVE` |
| **CAP-BOARD**| `UC-001` | **FR-006** | [`apps/api/src/modules/columns/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/columns/service.ts#L25) | `TC-UC001-05` | `TC-001-FR006-POSITIVE`, `NEGATIVE` |
| **CAP-BOARD**| `UC-001` | **FR-007** | [`apps/api/src/modules/columns/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/columns/service.ts#L80) | `TC-UC001-05` | `TC-001-FR007-BOUNDARY-HIGH`, `OVERFLOW` |
| **CAP-BOARD**| `UC-001` | **FR-008** | [`apps/api/src/modules/columns/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/columns/service.ts#L95) | `TC-UC001-05` | `TC-001-FR008-POSITIVE`, `NEGATIVE` |
| **CAP-BOARD**| `UC-001` | **FR-009** | [`apps/api/src/modules/columns/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/columns/service.ts#L110)| `TC-UC001-05` | `TC-001-FR009-STATEFUL` |
| **CAP-ISSUE**| `UC-002` | **FR-010** | [`apps/api/src/modules/issues/subtasks.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/subtasks.ts#L15) | `TC-UC002-01` | `TC-002-FR010-POSITIVE`, `NEGATIVE` |
| **CAP-ISSUE**| `UC-002` | **FR-011** | [`apps/api/src/modules/issues/model.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/model.ts#L45) | `TC-UC002-02` | `TC-002-FR011-BOUNDARY-LOW`, `UNDERFLOW` |
| **CAP-ISSUE**| `UC-002` | **FR-012** | [`apps/api/src/modules/issues/status-history.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/status-history.ts#L20) | `TC-UC002-04` | `TC-002-FR012-STATEFUL` |
| **CAP-ISSUE**| `UC-002` | **FR-013** | [`apps/api/src/modules/issues/activity.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L30) | `TC-UC002-04` | `TC-002-FR013-STATEFUL` |
| **CAP-ISSUE**| `UC-002` | **FR-014** | [`apps/api/src/modules/issues/watchers.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/watchers.ts#L25) | `TC-UC002-04` | `TC-002-FR014-STATEFUL` |
| **CAP-ISSUE**| `UC-002` | **FR-015** | [`apps/api/src/modules/issues/worklogs.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/worklogs.ts#L18) | `TC-UC002-03` | `TC-002-FR015-BOUNDARY-LOW`, `UNDERFLOW` |
| **CAP-ISSUE**| `UC-002` | **FR-016** | [`apps/api/src/modules/issues/checklists.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/checklists.ts#L20) | `TC-UC002-03` | `TC-002-FR016-STATEFUL` |
| **CAP-ISSUE**| `UC-002` | **FR-017** | [`apps/api/src/modules/issues/worklogs.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/worklogs.ts#L45) | `TC-UC002-03` | `TC-002-FR017-BOUNDARY-LOW` |
| **CAP-AGENT**| `UC-003` | **FR-018** | [`packages/crypto/src/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/packages/crypto/src/index.ts#L20) | `TC-UC003-01` | `TC-003-FR018-POSITIVE`, `NEGATIVE` |
| **CAP-RUNNER**| `UC-003`| **FR-019** | [`apps/api/src/modules/agents/runner/`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/runner/) | `TC-UC003-02` | `TC-003-FR019-STATEFUL` |
| **CAP-MCP**  | `UC-003` | **FR-020** | [`apps/api/src/mcp/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/mcp/index.ts#L30) | `TC-UC003-03` | `TC-003-FR020-UNAUTHORIZED` |
| **CAP-RUNNER**| `UC-003`| **FR-021** | [`apps/api/src/modules/agents/chat-parts.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-parts.ts#L15)| `TC-UC003-04` | `TC-003-FR021-STATEFUL` |
| **CAP-NOTIF**| `UC-004` | **FR-022** | [`packages/db/src/schema/app.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/packages/db/src/schema/app.ts#L120) | `TC-UC004-01` | `TC-004-FR022-STATEFUL` |
| **CAP-NOTIF**| `UC-004` | **FR-023** | [`apps/worker/src/signature.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/worker/src/signature.ts#L10) | `TC-UC004-02` | `TC-004-FR023-POSITIVE`, `NEGATIVE` |
| **CAP-NOTIF**| `UC-004` | **FR-024** | [`apps/worker/src/backoff.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/worker/src/backoff.ts#L12) | `TC-UC004-02` | `TC-004-FR024-BOUNDARY-HIGH` |
| **CAP-PROJ** | `UC-005` | **FR-025** | [`apps/api/src/modules/cycles/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L30) | `TC-UC005-01` | `TC-005-FR025-POSITIVE`, `NEGATIVE` |
| **CAP-PROJ** | `UC-005` | **FR-026** | [`apps/api/src/modules/cycles/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L85) | `TC-UC005-02` | `TC-005-FR026-STATEFUL` |
| **CAP-PROJ** | `UC-005` | **FR-027** | [`apps/api/src/modules/initiatives/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/service.ts#L50)| `TC-UC005-03` | `TC-005-FR027-BOUNDARY-LOW` |
| **CAP-DOC**  | `UC-006` | **FR-028** | [`apps/api/src/modules/documents/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L60) | `TC-UC006-01` | `TC-006-FR028-STATEFUL` |
| **CAP-DOC**  | `UC-006` | **FR-029** | [`packages/db/src/schema/app.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/packages/db/src/schema/app.ts#L250) | `TC-UC006-02` | `TC-006-FR029-STATEFUL` |
| **CAP-DOC**  | `UC-006` | **FR-030** | [`apps/api/src/modules/documents/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L110)| `TC-UC006-03` | `TC-006-FR030-UNAUTHORIZED` |
