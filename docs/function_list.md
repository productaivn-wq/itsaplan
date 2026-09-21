# Universal Function & Endpoint Catalog (docs/function_list.md)

> **Document ID:** `58.DOC.FUNC.001`  
> **Specification Standard:** UTOP 14-Artifact Lineage Standard (IEEE 829 / ISO 29119)  
> **Total Cataloged Functions & Endpoints:** 712  
> **Governance State:** `SEALED & SYNCHRONIZED`  

---

## 1. Executive Summary & Architecture Lineage

This document serves as the physical **Single Source of Truth (SSOT)** for all callable API endpoints, service methods, and controller handlers across `apps/api/src/modules`. It fulfills **Gate GW-UTOP-02** by mapping physical code locations to UTOP Use Cases.

---

## 2. Catalog by Domain Module

### Module: [`apps/api/src/modules/actions/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/actions/service.ts)
*Total Functions & Endpoints:* 6

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listActions`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/actions/service.ts#L34) | `34` | `function` | Domain Service Function |
| [`createAction`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/actions/service.ts#L45) | `45` | `function` | Domain Service Function |
| [`getAction`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/actions/service.ts#L70) | `70` | `function` | Domain Service Function |
| [`updateAction`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/actions/service.ts#L77) | `77` | `function` | Domain Service Function |
| [`deleteAction`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/actions/service.ts#L91) | `91` | `function` | Domain Service Function |
| [`reorderActions`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/actions/service.ts#L97) | `97` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/chat-favorites.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-favorites.ts)
*Total Functions & Endpoints:* 5

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`readFavorites`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-favorites.ts#L14) | `14` | `function` | Domain Service Function |
| [`favoriteThreadIds`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-favorites.ts#L28) | `28` | `function` | Domain Service Function |
| [`addFavorite`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-favorites.ts#L38) | `38` | `function` | Domain Service Function |
| [`removeFavorite`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-favorites.ts#L46) | `46` | `function` | Domain Service Function |
| [`deleteFavorite`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-favorites.ts#L53) | `53` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/chat-history.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-history.ts)
*Total Functions & Endpoints:* 4

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`searchTerm`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-history.ts#L43) | `43` | `function` | Domain Service Function |
| [`likePattern`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-history.ts#L50) | `50` | `function` | Domain Service Function |
| [`snippetOf`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-history.ts#L56) | `56` | `function` | Domain Service Function |
| [`summarize`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-history.ts#L76) | `76` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/chat-parts.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-parts.ts)
*Total Functions & Endpoints:* 3

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`toolArgsText`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-parts.ts#L14) | `14` | `function` | Domain Service Function |
| [`toolText`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-parts.ts#L23) | `23` | `function` | Domain Service Function |
| [`appendTextPart`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-parts.ts#L32) | `32` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/chat-usage.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-usage.ts)
*Total Functions & Endpoints:* 4

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`recordContextUsage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-usage.ts#L20) | `20` | `function` | Domain Service Function |
| [`readContextSizes`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-usage.ts#L40) | `40` | `function` | Domain Service Function |
| [`contextField`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-usage.ts#L56) | `56` | `function` | Domain Service Function |
| [`deleteContextUsage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat-usage.ts#L64) | `64` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/chat/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/index.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`POST /agent-chats/claim`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/index.ts#L174) | `174` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/agents/chat/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts)
*Total Functions & Endpoints:* 13

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listThreads`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts#L62) | `62` | `function` | Domain Service Function |
| [`ownsThread`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts#L184) | `184` | `function` | Domain Service Function |
| [`getThreadMessages`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts#L206) | `206` | `function` | Domain Service Function |
| [`renameThread`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts#L310) | `310` | `function` | Domain Service Function |
| [`deleteThread`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts#L323) | `323` | `function` | Domain Service Function |
| [`sendMessage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts#L337) | `337` | `function` | Domain Service Function |
| [`claimNextMessage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts#L423) | `423` | `function` | Domain Service Function |
| [`setThreadSession`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts#L493) | `493` | `function` | Domain Service Function |
| [`appendEvents`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts#L607) | `607` | `function` | Domain Service Function |
| [`heartbeatMessage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts#L629) | `629` | `function` | Domain Service Function |
| [`cancelMessage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts#L648) | `648` | `function` | Domain Service Function |
| [`finishMessage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts#L675) | `675` | `function` | Domain Service Function |
| [`readEvents`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/chat/service.ts#L725) | `725` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/helpers/backoff.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/helpers/backoff.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`equalJitterBackoffMs`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/helpers/backoff.ts#L4) | `4` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/helpers/dates.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/helpers/dates.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`toIso`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/helpers/dates.ts#L3) | `3` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/helpers/errors.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/helpers/errors.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`errorMessage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/helpers/errors.ts#L3) | `3` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/prompt/framing.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/prompt/framing.ts)
*Total Functions & Endpoints:* 7

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`runModePreamble`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/prompt/framing.ts#L40) | `40` | `function` | Domain Service Function |
| [`framePrompt`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/prompt/framing.ts#L58) | `58` | `function` | Domain Service Function |
| [`projectPreamble`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/prompt/framing.ts#L132) | `132` | `function` | Domain Service Function |
| [`projectsPreamble`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/prompt/framing.ts#L152) | `152` | `function` | Domain Service Function |
| [`chartPreamble`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/prompt/framing.ts#L181) | `181` | `function` | Domain Service Function |
| [`attachmentPreamble`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/prompt/framing.ts#L200) | `200` | `function` | Domain Service Function |
| [`peopleContext`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/prompt/framing.ts#L210) | `210` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/prompt/run-context.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/prompt/run-context.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`peoplePreamble`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/prompt/run-context.ts#L31) | `31` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/run-activity.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-activity.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`recordAgentRunStarted`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-activity.ts#L5) | `5` | `function` | Domain Service Function |
| [`recordAgentRunFinished`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-activity.ts#L15) | `15` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/run-poller.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-poller.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`processAgentRuns`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-poller.ts#L30) | `30` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/run-queue.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-queue.ts)
*Total Functions & Endpoints:* 10

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`countRunsAhead`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-queue.ts#L25) | `25` | `function` | Domain Service Function |
| [`enqueueAgentRun`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-queue.ts#L42) | `42` | `function` | Domain Service Function |
| [`claimDueRuns`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-queue.ts#L109) | `109` | `function` | Domain Service Function |
| [`loadThreadContext`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-queue.ts#L169) | `169` | `function` | Domain Service Function |
| [`markRunSuccess`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-queue.ts#L194) | `194` | `function` | Domain Service Function |
| [`scheduleRunRetry`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-queue.ts#L212) | `212` | `function` | Domain Service Function |
| [`markRunFailed`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-queue.ts#L224) | `224` | `function` | Domain Service Function |
| [`deferRun`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-queue.ts#L235) | `235` | `function` | Domain Service Function |
| [`contextTokensOf`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-queue.ts#L268) | `268` | `function` | Domain Service Function |
| [`listAgentRuns`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/run-queue.ts#L288) | `288` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/runtime/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/index.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`runAgent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/index.ts#L121) | `121` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/runtime/memory.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/memory.ts)
*Total Functions & Endpoints:* 8

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`buildMemory`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/memory.ts#L57) | `57` | `function` | Domain Service Function |
| [`ensureThread`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/memory.ts#L88) | `88` | `function` | Domain Service Function |
| [`renameChatThread`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/memory.ts#L107) | `107` | `function` | Domain Service Function |
| [`deleteChatThread`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/memory.ts#L121) | `121` | `function` | Domain Service Function |
| [`deleteThreadsWhere`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/memory.ts#L133) | `133` | `function` | Domain Service Function |
| [`listChatThreads`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/memory.ts#L149) | `149` | `function` | Domain Service Function |
| [`ownsChatThread`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/memory.ts#L270) | `270` | `function` | Domain Service Function |
| [`getChatThreadMessages`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/memory.ts#L282) | `282` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/runtime/skill-runtime.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/skill-runtime.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`skillsPreamble`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/skill-runtime.ts#L13) | `13` | `function` | Domain Service Function |
| [`buildSkillTool`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/skill-runtime.ts#L34) | `34` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/runtime/thread-ids.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/thread-ids.ts)
*Total Functions & Endpoints:* 4

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`newChatThreadId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/thread-ids.ts#L7) | `7` | `function` | Domain Service Function |
| [`isChatThreadId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/thread-ids.ts#L11) | `11` | `function` | Domain Service Function |
| [`isOwnChatThread`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/thread-ids.ts#L18) | `18` | `function` | Domain Service Function |
| [`runThreadId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/thread-ids.ts#L27) | `27` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/runtime/tools/catalog.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/tools/catalog.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`toolMeta`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/tools/catalog.ts#L407) | `407` | `function` | Domain Service Function |
| [`normalizeToolKeys`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/tools/catalog.ts#L413) | `413` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/runtime/tools/custom-tools.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/tools/custom-tools.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`buildCustomTools`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/tools/custom-tools.ts#L10) | `10` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/runtime/tools/local.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/tools/local.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`buildLocalTools`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/tools/local.ts#L15) | `15` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/runtime/tools/route-tools.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/tools/route-tools.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`actionCatalog`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/tools/route-tools.ts#L62) | `62` | `function` | Domain Service Function |
| [`buildRouteTools`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/runtime/tools/route-tools.ts#L73) | `73` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/core/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts)
*Total Functions & Endpoints:* 20

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`agentScopeOf`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L249) | `249` | `function` | Domain Service Function |
| [`memberProjectIds`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L259) | `259` | `function` | Domain Service Function |
| [`listAgents`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L278) | `278` | `function` | Domain Service Function |
| [`getAgentById`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L297) | `297` | `function` | Domain Service Function |
| [`getAgentInProject`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L315) | `315` | `function` | Domain Service Function |
| [`isTriggerableBy`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L325) | `325` | `function` | Domain Service Function |
| [`canTriggerAgent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L342) | `342` | `function` | Domain Service Function |
| [`listMentionTriggerAgents`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L356) | `356` | `function` | Domain Service Function |
| [`getAssignTriggerAgent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L380) | `380` | `function` | Domain Service Function |
| [`getFieldTriggerAgent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L402) | `402` | `function` | Domain Service Function |
| [`isProjectAgent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L450) | `450` | `function` | Domain Service Function |
| [`agentTeam`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L461) | `461` | `function` | Domain Service Function |
| [`isAgentUser`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L471) | `471` | `function` | Domain Service Function |
| [`createAgent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L581) | `581` | `function` | Domain Service Function |
| [`getInternalAgentApiKey`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L734) | `734` | `function` | Domain Service Function |
| [`updateAgent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L779) | `779` | `function` | Domain Service Function |
| [`regenerateKey`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L845) | `845` | `function` | Domain Service Function |
| [`deleteAgent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L858) | `858` | `function` | Domain Service Function |
| [`agentInTeam`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L868) | `868` | `function` | Domain Service Function |
| [`agentWorksInProject`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/core/service.ts#L888) | `888` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/integrations/catalog.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/catalog.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`credentialSchemaFor`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/catalog.ts#L68) | `68` | `function` | Domain Service Function |
| [`integrationKind`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/catalog.ts#L73) | `73` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/integrations/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/index.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`GET /teams/:teamId/integrations/catalog`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/index.ts#L50) | `50` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/agents/integrations/provider-models.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/provider-models.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listModelsForProvider`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/provider-models.ts#L65) | `65` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/integrations/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/service.ts)
*Total Functions & Endpoints:* 7

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listCredentials`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/service.ts#L73) | `73` | `function` | Domain Service Function |
| [`listAllCredentials`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/service.ts#L96) | `96` | `function` | Domain Service Function |
| [`getCredentialById`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/service.ts#L105) | `105` | `function` | Domain Service Function |
| [`createCredential`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/service.ts#L133) | `133` | `function` | Domain Service Function |
| [`updateCredential`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/service.ts#L162) | `162` | `function` | Domain Service Function |
| [`deleteCredential`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/service.ts#L196) | `196` | `function` | Domain Service Function |
| [`getCredentialSecret`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/integrations/service.ts#L207) | `207` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/runner/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/runner/index.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`POST /agent-runs/claim`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/runner/index.ts#L17) | `17` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/agents/runner/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/runner/service.ts)
*Total Functions & Endpoints:* 5

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`getRunnerAgent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/runner/service.ts#L49) | `49` | `function` | Domain Service Function |
| [`touchRunner`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/runner/service.ts#L106) | `106` | `function` | Domain Service Function |
| [`claimRunnerRun`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/runner/service.ts#L133) | `133` | `function` | Domain Service Function |
| [`heartbeatRun`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/runner/service.ts#L218) | `218` | `function` | Domain Service Function |
| [`finishRun`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/runner/service.ts#L233) | `233` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/schedules/cron.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/cron.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`nextCronRun`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/cron.ts#L12) | `12` | `function` | Domain Service Function |
| [`minCronIntervalSeconds`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/cron.ts#L20) | `20` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/schedules/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/service.ts)
*Total Functions & Endpoints:* 10

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listAgentSchedules`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/service.ts#L86) | `86` | `function` | Domain Service Function |
| [`listAllAgentSchedules`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/service.ts#L110) | `110` | `function` | Domain Service Function |
| [`getAgentSchedule`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/service.ts#L120) | `120` | `function` | Domain Service Function |
| [`assertScheduleInterval`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/service.ts#L141) | `141` | `function` | Domain Service Function |
| [`createAgentSchedule`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/service.ts#L150) | `150` | `function` | Domain Service Function |
| [`updateAgentSchedule`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/service.ts#L179) | `179` | `function` | Domain Service Function |
| [`deleteAgentSchedule`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/service.ts#L208) | `208` | `function` | Domain Service Function |
| [`enqueueManualScheduleRun`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/service.ts#L220) | `220` | `function` | Domain Service Function |
| [`cancelPendingScheduleRuns`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/service.ts#L245) | `245` | `function` | Domain Service Function |
| [`listScheduleRuns`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/schedules/service.ts#L286) | `286` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/skills/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts)
*Total Functions & Endpoints:* 14

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listSkills`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L70) | `70` | `function` | Domain Service Function |
| [`listSkillOptions`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L92) | `92` | `function` | Domain Service Function |
| [`getSkill`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L101) | `101` | `function` | Domain Service Function |
| [`getSkillMarkdown`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L110) | `110` | `function` | Domain Service Function |
| [`getSkillRefContent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L116) | `116` | `function` | Domain Service Function |
| [`createSkill`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L150) | `150` | `function` | Domain Service Function |
| [`createSkillFromFiles`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L179) | `179` | `function` | Domain Service Function |
| [`updateSkill`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L233) | `233` | `function` | Domain Service Function |
| [`addReference`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L265) | `265` | `function` | Domain Service Function |
| [`updateReference`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L289) | `289` | `function` | Domain Service Function |
| [`deleteReference`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L306) | `306` | `function` | Domain Service Function |
| [`deleteSkill`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L322) | `322` | `function` | Domain Service Function |
| [`listAgentSkills`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L336) | `336` | `function` | Domain Service Function |
| [`setAgentSkills`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/service.ts#L348) | `348` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/skills/skill-format.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/skill-format.ts)
*Total Functions & Endpoints:* 5

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`parseFrontmatter`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/skill-format.ts#L18) | `18` | `function` | Domain Service Function |
| [`isDisallowedRef`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/skill-format.ts#L88) | `88` | `function` | Domain Service Function |
| [`parseGithubSkillUrl`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/skill-format.ts#L130) | `130` | `function` | Domain Service Function |
| [`importGithubSkill`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/skill-format.ts#L258) | `258` | `function` | Domain Service Function |
| [`discoverGithubSkills`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/skills/skill-format.ts#L304) | `304` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/agents/tools/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/tools/index.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`GET /teams/:teamId/ai-agents/tools`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/tools/index.ts#L49) | `49` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/agents/tools/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/tools/service.ts)
*Total Functions & Endpoints:* 7

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listAgentTools`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/tools/service.ts#L47) | `47` | `function` | Domain Service Function |
| [`listAgentToolOptions`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/tools/service.ts#L64) | `64` | `function` | Domain Service Function |
| [`createAgentTool`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/tools/service.ts#L79) | `79` | `function` | Domain Service Function |
| [`deleteAgentTool`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/tools/service.ts#L105) | `105` | `function` | Domain Service Function |
| [`listAgentToolLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/tools/service.ts#L115) | `115` | `function` | Domain Service Function |
| [`listAgentToolsForRun`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/tools/service.ts#L128) | `128` | `function` | Domain Service Function |
| [`setAgentTools`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/agents/tools/service.ts#L153) | `153` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/analytics/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/analytics/service.ts)
*Total Functions & Endpoints:* 10

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`getStats`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/analytics/service.ts#L57) | `57` | `function` | Domain Service Function |
| [`getBreakdown`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/analytics/service.ts#L116) | `116` | `function` | Domain Service Function |
| [`pulseRows`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/analytics/service.ts#L259) | `259` | `function` | Domain Service Function |
| [`getPulse`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/analytics/service.ts#L269) | `269` | `function` | Domain Service Function |
| [`getThroughput`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/analytics/service.ts#L315) | `315` | `function` | Domain Service Function |
| [`listActivity`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/analytics/service.ts#L369) | `369` | `function` | Domain Service Function |
| [`listAgentRunFeed`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/analytics/service.ts#L454) | `454` | `function` | Domain Service Function |
| [`getAgentRunStats`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/analytics/service.ts#L505) | `505` | `function` | Domain Service Function |
| [`getWebhookStats`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/analytics/service.ts#L541) | `541` | `function` | Domain Service Function |
| [`getAgentWorkload`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/analytics/service.ts#L596) | `596` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/attachments/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/index.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`GET content-length`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/index.ts#L160) | `160` | `endpoint` | Elysia API Route Handler |
| [`GET content-type`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/index.ts#L167) | `167` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/attachments/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/service.ts)
*Total Functions & Endpoints:* 8

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`mapAttachment`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/service.ts#L25) | `25` | `function` | Domain Service Function |
| [`createAttachment`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/service.ts#L38) | `38` | `function` | Domain Service Function |
| [`listAttachments`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/service.ts#L63) | `63` | `function` | Domain Service Function |
| [`getProjectAttachmentBytes`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/service.ts#L74) | `74` | `function` | Domain Service Function |
| [`getAttachmentByPublicId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/service.ts#L83) | `83` | `function` | Domain Service Function |
| [`replaceAttachmentContent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/service.ts#L94) | `94` | `function` | Domain Service Function |
| [`deleteAttachmentByPublicId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/service.ts#L128) | `128` | `function` | Domain Service Function |
| [`removeAttachmentEmbeds`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/service.ts#L139) | `139` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/attachments/storage.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts)
*Total Functions & Endpoints:* 14

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`assertAttachmentStorageCapacity`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L92) | `92` | `function` | Domain Service Function |
| [`lockAttachmentStorage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L129) | `129` | `function` | Domain Service Function |
| [`assertAttachmentUploadAllowed`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L138) | `138` | `function` | Domain Service Function |
| [`assertAttachmentFileAllowed`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L148) | `148` | `function` | Domain Service Function |
| [`safeAttachmentFilename`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L161) | `161` | `function` | Domain Service Function |
| [`attachmentObjectKey`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L174) | `174` | `function` | Domain Service Function |
| [`storeAttachmentObject`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L187) | `187` | `function` | Domain Service Function |
| [`cloneAttachmentObject`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L204) | `204` | `function` | Domain Service Function |
| [`deleteAttachmentObject`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L219) | `219` | `function` | Domain Service Function |
| [`attachmentEtag`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L228) | `228` | `function` | Domain Service Function |
| [`attachmentResponseHeaders`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L232) | `232` | `function` | Domain Service Function |
| [`stripAttachmentEmbeds`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L259) | `259` | `function` | Domain Service Function |
| [`attachmentObjectResponse`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L278) | `278` | `function` | Domain Service Function |
| [`GET if-none-match`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/attachments/storage.ts#L286) | `286` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/avatars/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/avatars/service.ts)
*Total Functions & Endpoints:* 3

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`replaceAvatar`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/avatars/service.ts#L48) | `48` | `function` | Domain Service Function |
| [`clearAvatar`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/avatars/service.ts#L82) | `82` | `function` | Domain Service Function |
| [`readAvatar`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/avatars/service.ts#L90) | `90` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/charts/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/charts/index.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`POST /projects/:projectKey/charts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/charts/index.ts#L21) | `21` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/chat-attachments/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/index.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`GET if-none-match`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/index.ts#L177) | `177` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/chat-attachments/parse.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/parse.ts)
*Total Functions & Endpoints:* 3

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`isTableFilename`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/parse.ts#L28) | `28` | `function` | Domain Service Function |
| [`parseCsv`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/parse.ts#L69) | `69` | `function` | Domain Service Function |
| [`parseImportFile`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/parse.ts#L230) | `230` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/chat-attachments/pdf.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/pdf.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`stripPdfImagePlaceholders`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/pdf.ts#L6) | `6` | `function` | Domain Service Function |
| [`pdfToMarkdown`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/pdf.ts#L19) | `19` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/chat-attachments/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/service.ts)
*Total Functions & Endpoints:* 6

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`createChatAttachment`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/service.ts#L42) | `42` | `function` | Domain Service Function |
| [`getChatAttachmentByPublicId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/service.ts#L58) | `58` | `function` | Domain Service Function |
| [`getChatAttachmentProjectId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/service.ts#L65) | `65` | `function` | Domain Service Function |
| [`getProjectChatAttachmentBytes`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/service.ts#L75) | `75` | `function` | Domain Service Function |
| [`readAttachmentBytes`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/service.ts#L83) | `83` | `function` | Domain Service Function |
| [`readChatAttachmentContent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/chat-attachments/service.ts#L104) | `104` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/columns/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/columns/service.ts)
*Total Functions & Endpoints:* 8

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`columnAutoAssignee`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/columns/service.ts#L40) | `40` | `function` | Domain Service Function |
| [`wipLimitBreach`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/columns/service.ts#L65) | `65` | `function` | Domain Service Function |
| [`assertWipLimit`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/columns/service.ts#L91) | `91` | `function` | Domain Service Function |
| [`listColumns`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/columns/service.ts#L107) | `107` | `function` | Domain Service Function |
| [`createColumn`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/columns/service.ts#L116) | `116` | `function` | Domain Service Function |
| [`updateColumn`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/columns/service.ts#L153) | `153` | `function` | Domain Service Function |
| [`reorderColumns`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/columns/service.ts#L187) | `187` | `function` | Domain Service Function |
| [`deleteColumn`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/columns/service.ts#L212) | `212` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/custom-fields/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/custom-fields/service.ts)
*Total Functions & Endpoints:* 6

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listCustomFields`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/custom-fields/service.ts#L92) | `92` | `function` | Domain Service Function |
| [`listAgentMemberFieldIds`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/custom-fields/service.ts#L117) | `117` | `function` | Domain Service Function |
| [`getCustomFieldById`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/custom-fields/service.ts#L134) | `134` | `function` | Domain Service Function |
| [`createCustomField`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/custom-fields/service.ts#L147) | `147` | `function` | Domain Service Function |
| [`updateCustomField`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/custom-fields/service.ts#L266) | `266` | `function` | Domain Service Function |
| [`deleteCustomField`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/custom-fields/service.ts#L324) | `324` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/cycles/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts)
*Total Functions & Endpoints:* 12

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`cycleStatus`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L37) | `37` | `function` | Domain Service Function |
| [`listCycles`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L110) | `110` | `function` | Domain Service Function |
| [`listPlannedCycles`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L121) | `121` | `function` | Domain Service Function |
| [`listCompletedCycles`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L135) | `135` | `function` | Domain Service Function |
| [`getCycle`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L153) | `153` | `function` | Domain Service Function |
| [`getCycleRef`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L160) | `160` | `function` | Domain Service Function |
| [`getCycleProjectId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L182) | `182` | `function` | Domain Service Function |
| [`createCycle`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L219) | `219` | `function` | Domain Service Function |
| [`updateCycle`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L256) | `256` | `function` | Domain Service Function |
| [`deleteCycle`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L290) | `290` | `function` | Domain Service Function |
| [`finishCycle`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L314) | `314` | `function` | Domain Service Function |
| [`startNextCycle`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/cycles/service.ts#L325) | `325` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/dashboards/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/dashboards/service.ts)
*Total Functions & Endpoints:* 6

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listDashboards`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/dashboards/service.ts#L31) | `31` | `function` | Domain Service Function |
| [`createDashboard`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/dashboards/service.ts#L42) | `42` | `function` | Domain Service Function |
| [`getDashboard`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/dashboards/service.ts#L65) | `65` | `function` | Domain Service Function |
| [`updateDashboard`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/dashboards/service.ts#L72) | `72` | `function` | Domain Service Function |
| [`deleteDashboard`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/dashboards/service.ts#L89) | `89` | `function` | Domain Service Function |
| [`reorderDashboards`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/dashboards/service.ts#L95) | `95` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/documents/collaboration.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/collaboration.ts)
*Total Functions & Endpoints:* 4

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`lockVisibleDocument`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/collaboration.ts#L15) | `15` | `function` | Domain Service Function |
| [`openDocumentSession`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/collaboration.ts#L39) | `39` | `function` | Domain Service Function |
| [`getDocumentSteps`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/collaboration.ts#L114) | `114` | `function` | Domain Service Function |
| [`saveDocumentSteps`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/collaboration.ts#L156) | `156` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/documents/comments.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/comments.ts)
*Total Functions & Endpoints:* 3

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listDocumentComments`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/comments.ts#L8) | `8` | `function` | Domain Service Function |
| [`addDocumentComment`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/comments.ts#L27) | `27` | `function` | Domain Service Function |
| [`updateDocumentComment`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/comments.ts#L85) | `85` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/documents/links.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/links.ts)
*Total Functions & Endpoints:* 7

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listDocumentIssueLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/links.ts#L79) | `79` | `function` | Domain Service Function |
| [`listIssueDocumentLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/links.ts#L108) | `108` | `function` | Domain Service Function |
| [`addDocumentIssueLink`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/links.ts#L142) | `142` | `function` | Domain Service Function |
| [`removeDocumentIssueLink`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/links.ts#L189) | `189` | `function` | Domain Service Function |
| [`listInitiativeDocumentLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/links.ts#L218) | `218` | `function` | Domain Service Function |
| [`addDocumentInitiativeLink`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/links.ts#L252) | `252` | `function` | Domain Service Function |
| [`removeDocumentInitiativeLink`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/links.ts#L286) | `286` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/documents/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts)
*Total Functions & Endpoints:* 23

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`replaceAssetReferences`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L161) | `161` | `function` | Domain Service Function |
| [`listDocuments`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L243) | `243` | `function` | Domain Service Function |
| [`getDocument`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L300) | `300` | `function` | Domain Service Function |
| [`listDocumentAssets`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L310) | `310` | `function` | Domain Service Function |
| [`assertDocumentAssetUploadTarget`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L324) | `324` | `function` | Domain Service Function |
| [`createDocumentAsset`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L336) | `336` | `function` | Domain Service Function |
| [`getDocumentAsset`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L374) | `374` | `function` | Domain Service Function |
| [`deleteDocumentAsset`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L388) | `388` | `function` | Domain Service Function |
| [`createDocument`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L577) | `577` | `function` | Domain Service Function |
| [`assertValidDocumentContentJson`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L952) | `952` | `function` | Domain Service Function |
| [`updateDocument`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L969) | `969` | `function` | Domain Service Function |
| [`setDocumentAccess`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L1108) | `1108` | `function` | Domain Service Function |
| [`transferDocumentOwnership`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L1144) | `1144` | `function` | Domain Service Function |
| [`setDocumentLocked`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L1182) | `1182` | `function` | Domain Service Function |
| [`archiveDocument`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L1240) | `1240` | `function` | Domain Service Function |
| [`restoreDocument`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L1298) | `1298` | `function` | Domain Service Function |
| [`duplicateDocument`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L1373) | `1373` | `function` | Domain Service Function |
| [`setDocumentPreference`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L1487) | `1487` | `function` | Domain Service Function |
| [`listDocumentRevisions`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L1504) | `1504` | `function` | Domain Service Function |
| [`getDocumentRevision`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L1527) | `1527` | `function` | Domain Service Function |
| [`restoreDocumentRevision`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L1570) | `1570` | `function` | Domain Service Function |
| [`exportDocument`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L1648) | `1648` | `function` | Domain Service Function |
| [`deleteDocument`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/documents/service.ts#L1677) | `1677` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/git/connections-provider.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts)
*Total Functions & Endpoints:* 22

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`normalizeProviderBaseUrl`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L89) | `89` | `function` | Domain Service Function |
| [`providerErrorMessage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L147) | `147` | `function` | Domain Service Function |
| [`GET x-ratelimit-remaining`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L220) | `220` | `endpoint` | Elysia API Route Handler |
| [`getProviderAccount`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L227) | `227` | `function` | Domain Service Function |
| [`githubRepository`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L238) | `238` | `function` | Domain Service Function |
| [`gitlabRepository`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L256) | `256` | `function` | Domain Service Function |
| [`giteaRepository`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L272) | `272` | `function` | Domain Service Function |
| [`bitbucketRepository`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L276) | `276` | `function` | Domain Service Function |
| [`listProviderRepositories`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L341) | `341` | `function` | Domain Service Function |
| [`GET x-next-page`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L387) | `387` | `endpoint` | Elysia API Route Handler |
| [`getProviderRepository`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L396) | `396` | `function` | Domain Service Function |
| [`githubPullRequest`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L440) | `440` | `function` | Domain Service Function |
| [`gitlabPullRequest`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L462) | `462` | `function` | Domain Service Function |
| [`listProviderPullRequests`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L556) | `556` | `function` | Domain Service Function |
| [`GET x-next-page`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L590) | `590` | `endpoint` | Elysia API Route Handler |
| [`getProviderPullRequest`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L601) | `601` | `function` | Domain Service Function |
| [`listProviderBranches`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L642) | `642` | `function` | Domain Service Function |
| [`GET x-next-page`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L662) | `662` | `endpoint` | Elysia API Route Handler |
| [`createProviderPullRequest`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L674) | `674` | `function` | Domain Service Function |
| [`installProviderWebhook`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L724) | `724` | `function` | Domain Service Function |
| [`deleteProviderWebhook`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L843) | `843` | `function` | Domain Service Function |
| [`createPullRequestComment`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-provider.ts#L859) | `859` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/git/connections-service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts)
*Total Functions & Endpoints:* 13

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listDevelopmentRepositories`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts#L126) | `126` | `function` | Domain Service Function |
| [`listManagedPullRequests`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts#L152) | `152` | `function` | Domain Service Function |
| [`getManagedPullRequest`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts#L166) | `166` | `function` | Domain Service Function |
| [`listManagedBranches`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts#L178) | `178` | `function` | Domain Service Function |
| [`createManagedPullRequest`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts#L187) | `187` | `function` | Domain Service Function |
| [`listGitProviderConnections`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts#L217) | `217` | `function` | Domain Service Function |
| [`connectGitProvider`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts#L270) | `270` | `function` | Domain Service Function |
| [`listAvailableRepositories`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts#L298) | `298` | `function` | Domain Service Function |
| [`connectRepositories`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts#L326) | `326` | `function` | Domain Service Function |
| [`disconnectRepository`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts#L374) | `374` | `function` | Domain Service Function |
| [`disconnectGitProvider`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts#L400) | `400` | `function` | Domain Service Function |
| [`reconcileManagedWebhooks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts#L431) | `431` | `function` | Domain Service Function |
| [`postPullRequestLinkback`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/connections-service.ts#L467) | `467` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/git/development.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts)
*Total Functions & Endpoints:* 14

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listIssueDevelopmentLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L84) | `84` | `function` | Domain Service Function |
| [`listLinkablePullRequests`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L125) | `125` | `function` | Domain Service Function |
| [`linkExistingPullRequest`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L178) | `178` | `function` | Domain Service Function |
| [`createAndLinkPullRequest`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L188) | `188` | `function` | Domain Service Function |
| [`hasOpenDevelopmentLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L198) | `198` | `function` | Domain Service Function |
| [`removeIssueDevelopmentLink`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L213) | `213` | `function` | Domain Service Function |
| [`updatePullRequestLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L254) | `254` | `function` | Domain Service Function |
| [`upsertPullRequestLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L272) | `272` | `function` | Domain Service Function |
| [`removePullRequestLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L314) | `314` | `function` | Domain Service Function |
| [`upsertBranchLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L332) | `332` | `function` | Domain Service Function |
| [`removeBranchLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L376) | `376` | `function` | Domain Service Function |
| [`promoteBranchLinksToPullRequest`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L400) | `400` | `function` | Domain Service Function |
| [`updatePipelineLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L454) | `454` | `function` | Domain Service Function |
| [`updateCheckLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/development.ts#L487) | `487` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/git/handler.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/handler.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`handleGitEvent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/handler.ts#L58) | `58` | `function` | Domain Service Function |
| [`handlePullRequestEvent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/handler.ts#L155) | `155` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/git/magic-words.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/magic-words.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`parseIssueIdentifiers`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/magic-words.ts#L88) | `88` | `function` | Domain Service Function |
| [`parseMagicWords`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/magic-words.ts#L100) | `100` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/git/providers.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/providers.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`pipelineStatus`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/providers.ts#L147) | `147` | `function` | Domain Service Function |
| [`detectProvider`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/providers.ts#L480) | `480` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/git/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/service.ts)
*Total Functions & Endpoints:* 8

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`getOrCreateGitSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/service.ts#L69) | `69` | `function` | Domain Service Function |
| [`updateGitSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/service.ts#L107) | `107` | `function` | Domain Service Function |
| [`regenerateGitSecret`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/service.ts#L128) | `128` | `function` | Domain Service Function |
| [`findProjectByGitWebhookId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/service.ts#L136) | `136` | `function` | Domain Service Function |
| [`claimGitDelivery`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/service.ts#L162) | `162` | `function` | Domain Service Function |
| [`recordGitEvent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/service.ts#L197) | `197` | `function` | Domain Service Function |
| [`firstCompletedColumnId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/service.ts#L235) | `235` | `function` | Domain Service Function |
| [`columnStateTypes`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/service.ts#L247) | `247` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/git/webhook.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/webhook.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`POST /webhooks/git/:webhookId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/webhook.ts#L73) | `73` | `endpoint` | Elysia API Route Handler |
| [`POST /webhooks/github/:webhookId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/git/webhook.ts#L76) | `76` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/god/email-test.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/email-test.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`emailTestError`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/email-test.ts#L4) | `4` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/god/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts)
*Total Functions & Endpoints:* 14

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`GET /god/email-settings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L176) | `176` | `endpoint` | Elysia API Route Handler |
| [`PUT /god/email-settings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L184) | `184` | `endpoint` | Elysia API Route Handler |
| [`POST /god/scim-settings/token`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L348) | `348` | `endpoint` | Elysia API Route Handler |
| [`GET /god/scim-groups`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L358) | `358` | `endpoint` | Elysia API Route Handler |
| [`GET /god/storage-settings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L384) | `384` | `endpoint` | Elysia API Route Handler |
| [`PUT /god/storage-settings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L392) | `392` | `endpoint` | Elysia API Route Handler |
| [`GET /god/project-defaults`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L402) | `402` | `endpoint` | Elysia API Route Handler |
| [`PUT /god/project-defaults`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L410) | `410` | `endpoint` | Elysia API Route Handler |
| [`GET /god/hotkey-settings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L420) | `420` | `endpoint` | Elysia API Route Handler |
| [`PUT /god/hotkey-settings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L429) | `429` | `endpoint` | Elysia API Route Handler |
| [`GET /god/updates`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L443) | `443` | `endpoint` | Elysia API Route Handler |
| [`POST /god/updates/check`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L452) | `452` | `endpoint` | Elysia API Route Handler |
| [`GET /god/telegram-settings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L461) | `461` | `endpoint` | Elysia API Route Handler |
| [`GET /god/projects/options`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/index.ts#L606) | `606` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/god/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts)
*Total Functions & Endpoints:* 13

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listInstanceUsers`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts#L195) | `195` | `function` | Domain Service Function |
| [`getInstanceUser`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts#L234) | `234` | `function` | Domain Service Function |
| [`deleteInstanceUser`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts#L294) | `294` | `function` | Domain Service Function |
| [`listInstanceProjects`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts#L491) | `491` | `function` | Domain Service Function |
| [`listInstanceProjectOptions`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts#L522) | `522` | `function` | Domain Service Function |
| [`getInstanceProject`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts#L533) | `533` | `function` | Domain Service Function |
| [`listInstanceTeams`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts#L692) | `692` | `function` | Domain Service Function |
| [`getInstanceTeam`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts#L720) | `720` | `function` | Domain Service Function |
| [`listInstanceTeamProjects`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts#L730) | `730` | `function` | Domain Service Function |
| [`listInstanceTeamMembers`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts#L773) | `773` | `function` | Domain Service Function |
| [`verifyInstanceUserEmail`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts#L824) | `824` | `function` | Domain Service Function |
| [`listScimGroups`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts#L855) | `855` | `function` | Domain Service Function |
| [`setScimGroupMappings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/god/service.ts#L897) | `897` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/imports/mapping.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/mapping.ts)
*Total Functions & Endpoints:* 6

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`titleKey`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/mapping.ts#L43) | `43` | `function` | Domain Service Function |
| [`titleKeys`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/mapping.ts#L52) | `52` | `function` | Domain Service Function |
| [`duplicateTitle`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/mapping.ts#L64) | `64` | `function` | Domain Service Function |
| [`previewTable`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/mapping.ts#L80) | `80` | `function` | Domain Service Function |
| [`validateMapping`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/mapping.ts#L124) | `124` | `function` | Domain Service Function |
| [`applyMapping`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/mapping.ts#L143) | `143` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/imports/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/service.ts)
*Total Functions & Endpoints:* 7

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`getImport`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/service.ts#L73) | `73` | `function` | Domain Service Function |
| [`createMappedImport`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/service.ts#L87) | `87` | `function` | Domain Service Function |
| [`readImportTable`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/service.ts#L115) | `115` | `function` | Domain Service Function |
| [`existingTitles`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/service.ts#L124) | `124` | `function` | Domain Service Function |
| [`confirmImport`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/service.ts#L143) | `143` | `function` | Domain Service Function |
| [`cancelImport`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/service.ts#L201) | `201` | `function` | Domain Service Function |
| [`getImportProjectId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/imports/service.ts#L209) | `209` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/initiatives/activity.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/activity.ts)
*Total Functions & Endpoints:* 3

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listFeed`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/activity.ts#L44) | `44` | `function` | Domain Service Function |
| [`recordActivity`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/activity.ts#L112) | `112` | `function` | Domain Service Function |
| [`logInitiativeUpdate`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/activity.ts#L148) | `148` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/initiatives/attachments.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/attachments.ts)
*Total Functions & Endpoints:* 7

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`createInitiativeAttachment`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/attachments.ts#L35) | `35` | `function` | Domain Service Function |
| [`listInitiativeAttachments`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/attachments.ts#L60) | `60` | `function` | Domain Service Function |
| [`getInitiativeAttachment`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/attachments.ts#L71) | `71` | `function` | Domain Service Function |
| [`getInitiativeAttachmentProjectId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/attachments.ts#L82) | `82` | `function` | Domain Service Function |
| [`deleteInitiativeAttachment`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/attachments.ts#L93) | `93` | `function` | Domain Service Function |
| [`removeInitiativeAttachmentEmbeds`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/attachments.ts#L104) | `104` | `function` | Domain Service Function |
| [`initiativeAttachmentKeys`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/attachments.ts#L123) | `123` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/initiatives/health.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/health.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`computeHealth`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/health.ts#L32) | `32` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/initiatives/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/service.ts)
*Total Functions & Endpoints:* 8

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listInitiatives`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/service.ts#L149) | `149` | `function` | Domain Service Function |
| [`listInitiativeOptions`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/service.ts#L205) | `205` | `function` | Domain Service Function |
| [`initiativeStatusCounts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/service.ts#L242) | `242` | `function` | Domain Service Function |
| [`getInitiative`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/service.ts#L268) | `268` | `function` | Domain Service Function |
| [`getInitiativeProjectId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/service.ts#L277) | `277` | `function` | Domain Service Function |
| [`createInitiative`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/service.ts#L335) | `335` | `function` | Domain Service Function |
| [`updateInitiative`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/service.ts#L393) | `393` | `function` | Domain Service Function |
| [`deleteInitiative`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/initiatives/service.ts#L431) | `431` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/invites/email.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/email.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`enqueueInviteEmail`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/email.ts#L18) | `18` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/invites/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/service.ts)
*Total Functions & Endpoints:* 11

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`mayGrantInviteRanks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/service.ts#L189) | `189` | `function` | Domain Service Function |
| [`createInvite`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/service.ts#L211) | `211` | `function` | Domain Service Function |
| [`getInviteById`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/service.ts#L243) | `243` | `function` | Domain Service Function |
| [`listProjectInvites`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/service.ts#L248) | `248` | `function` | Domain Service Function |
| [`listTeamInvites`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/service.ts#L257) | `257` | `function` | Domain Service Function |
| [`deleteProjectInvite`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/service.ts#L266) | `266` | `function` | Domain Service Function |
| [`deleteTeamInvite`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/service.ts#L274) | `274` | `function` | Domain Service Function |
| [`getInviteByToken`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/service.ts#L284) | `284` | `function` | Domain Service Function |
| [`getInviteRowByToken`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/service.ts#L324) | `324` | `function` | Domain Service Function |
| [`acceptInvite`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/service.ts#L345) | `345` | `function` | Domain Service Function |
| [`rejectInvite`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/invites/service.ts#L436) | `436` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/issue-templates/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issue-templates/service.ts)
*Total Functions & Endpoints:* 4

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listIssueTemplates`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issue-templates/service.ts#L56) | `56` | `function` | Domain Service Function |
| [`createIssueTemplate`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issue-templates/service.ts#L135) | `135` | `function` | Domain Service Function |
| [`updateIssueTemplate`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issue-templates/service.ts#L160) | `160` | `function` | Domain Service Function |
| [`deleteIssueTemplate`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issue-templates/service.ts#L187) | `187` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/issue-types/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issue-types/service.ts)
*Total Functions & Endpoints:* 5

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listIssueTypes`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issue-types/service.ts#L31) | `31` | `function` | Domain Service Function |
| [`createIssueType`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issue-types/service.ts#L40) | `40` | `function` | Domain Service Function |
| [`getIssueTypeById`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issue-types/service.ts#L65) | `65` | `function` | Domain Service Function |
| [`updateIssueType`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issue-types/service.ts#L72) | `72` | `function` | Domain Service Function |
| [`deleteIssueType`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issue-types/service.ts#L91) | `91` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/issues/activity.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts)
*Total Functions & Endpoints:* 22

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listFeed`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L100) | `100` | `function` | Domain Service Function |
| [`listFeedRange`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L169) | `169` | `function` | Domain Service Function |
| [`listGroupedFeed`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L215) | `215` | `function` | Domain Service Function |
| [`createComment`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L261) | `261` | `function` | Domain Service Function |
| [`getCommentRef`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L315) | `315` | `function` | Domain Service Function |
| [`updateComment`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L338) | `338` | `function` | Domain Service Function |
| [`deleteComment`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L375) | `375` | `function` | Domain Service Function |
| [`textSide`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L441) | `441` | `function` | Domain Service Function |
| [`rowSide`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L448) | `448` | `function` | Domain Service Function |
| [`statusSide`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L457) | `457` | `function` | Domain Service Function |
| [`actorId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L472) | `472` | `function` | Domain Service Function |
| [`recordActivity`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L481) | `481` | `function` | Domain Service Function |
| [`recordActivityForIssues`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L495) | `495` | `function` | Domain Service Function |
| [`recordActivityEntries`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L510) | `510` | `function` | Domain Service Function |
| [`userSide`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L570) | `570` | `function` | Domain Service Function |
| [`userName`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L573) | `573` | `function` | Domain Service Function |
| [`labelNames`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L581) | `581` | `function` | Domain Service Function |
| [`timeText`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L612) | `612` | `function` | Domain Service Function |
| [`logIssueUpdate`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L628) | `628` | `function` | Domain Service Function |
| [`GET assignee`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L728) | `728` | `endpoint` | Elysia API Route Handler |
| [`GET status`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L730) | `730` | `endpoint` | Elysia API Route Handler |
| [`GET description`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/activity.ts#L738) | `738` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/issues/auto-archive.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/auto-archive.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`sweepStaleIssues`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/auto-archive.ts#L9) | `9` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/issues/automation.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/automation.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`applySubtaskAutomation`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/automation.ts#L20) | `20` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/issues/checklists.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/checklists.ts)
*Total Functions & Endpoints:* 11

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`getChecklistIssueId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/checklists.ts#L55) | `55` | `function` | Domain Service Function |
| [`getChecklistItemIssueId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/checklists.ts#L64) | `64` | `function` | Domain Service Function |
| [`listChecklists`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/checklists.ts#L76) | `76` | `function` | Domain Service Function |
| [`createChecklist`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/checklists.ts#L110) | `110` | `function` | Domain Service Function |
| [`renameChecklist`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/checklists.ts#L133) | `133` | `function` | Domain Service Function |
| [`deleteChecklist`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/checklists.ts#L164) | `164` | `function` | Domain Service Function |
| [`reorderChecklists`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/checklists.ts#L185) | `185` | `function` | Domain Service Function |
| [`createChecklistItem`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/checklists.ts#L208) | `208` | `function` | Domain Service Function |
| [`updateChecklistItem`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/checklists.ts#L237) | `237` | `function` | Domain Service Function |
| [`deleteChecklistItem`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/checklists.ts#L261) | `261` | `function` | Domain Service Function |
| [`reorderChecklistItems`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/checklists.ts#L291) | `291` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/issues/cycle-history.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/cycle-history.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`recordCycleChange`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/cycle-history.ts#L24) | `24` | `function` | Domain Service Function |
| [`listIssueCycles`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/cycle-history.ts#L54) | `54` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/issues/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/index.ts)
*Total Functions & Endpoints:* 4

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`GET /issues/:issueId/checklists`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/index.ts#L890) | `890` | `endpoint` | Elysia API Route Handler |
| [`GET /issues/:issueId/worklogs`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/index.ts#L1049) | `1049` | `endpoint` | Elysia API Route Handler |
| [`GET /issues/:issueId/timeline`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/index.ts#L1259) | `1259` | `endpoint` | Elysia API Route Handler |
| [`GET /issues/:issueId/cycles`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/index.ts#L1288) | `1288` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/issues/links.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/links.ts)
*Total Functions & Endpoints:* 4

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listIssueLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/links.ts#L72) | `72` | `function` | Domain Service Function |
| [`attachBoardLinks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/links.ts#L128) | `128` | `function` | Domain Service Function |
| [`addIssueLink`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/links.ts#L227) | `227` | `function` | Domain Service Function |
| [`removeIssueLink`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/links.ts#L320) | `320` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/issues/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts)
*Total Functions & Endpoints:* 20

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listIssues`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L223) | `223` | `function` | Domain Service Function |
| [`listArchivedIssues`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L240) | `240` | `function` | Domain Service Function |
| [`searchIssues`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L290) | `290` | `function` | Domain Service Function |
| [`archiveIssue`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L441) | `441` | `function` | Domain Service Function |
| [`restoreIssue`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L460) | `460` | `function` | Domain Service Function |
| [`getIssue`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L635) | `635` | `function` | Domain Service Function |
| [`getIssues`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L642) | `642` | `function` | Domain Service Function |
| [`getIssueBySequence`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L660) | `660` | `function` | Domain Service Function |
| [`getIssueProjectId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L680) | `680` | `function` | Domain Service Function |
| [`createIssue`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L835) | `835` | `function` | Domain Service Function |
| [`updateIssue`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L1003) | `1003` | `function` | Domain Service Function |
| [`deleteIssue`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L1116) | `1116` | `function` | Domain Service Function |
| [`setIssueLabels`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L1146) | `1146` | `function` | Domain Service Function |
| [`transferCycleIssues`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L1218) | `1218` | `function` | Domain Service Function |
| [`bulkUpdateIssues`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L1243) | `1243` | `function` | Domain Service Function |
| [`bulkAddLabels`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L1277) | `1277` | `function` | Domain Service Function |
| [`bulkArchiveIssues`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L1312) | `1312` | `function` | Domain Service Function |
| [`bulkDeleteIssues`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L1324) | `1324` | `function` | Domain Service Function |
| [`getIssueFieldValues`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L1369) | `1369` | `function` | Domain Service Function |
| [`setIssueFieldValue`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/service.ts#L1541) | `1541` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/issues/status-history.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/status-history.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`recordStatusChange`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/status-history.ts#L15) | `15` | `function` | Domain Service Function |
| [`listStatusTimeline`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/status-history.ts#L61) | `61` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/issues/subtasks.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/subtasks.ts)
*Total Functions & Endpoints:* 5

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listSubtasks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/subtasks.ts#L52) | `52` | `function` | Domain Service Function |
| [`getParentRef`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/subtasks.ts#L57) | `57` | `function` | Domain Service Function |
| [`attachSubtaskCounts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/subtasks.ts#L66) | `66` | `function` | Domain Service Function |
| [`restoreSubtasksOf`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/subtasks.ts#L84) | `84` | `function` | Domain Service Function |
| [`disposeSubtasksOf`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/subtasks.ts#L111) | `111` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/issues/watchers.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/watchers.ts)
*Total Functions & Endpoints:* 5

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listIssueWatchers`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/watchers.ts#L30) | `30` | `function` | Domain Service Function |
| [`watcherUserIds`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/watchers.ts#L51) | `51` | `function` | Domain Service Function |
| [`isEligibleIssueWatcher`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/watchers.ts#L59) | `59` | `function` | Domain Service Function |
| [`setIssueWatching`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/watchers.ts#L78) | `78` | `function` | Domain Service Function |
| [`autoWatchIssue`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/watchers.ts#L97) | `97` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/issues/worklogs.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/worklogs.ts)
*Total Functions & Endpoints:* 6

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listWorklogs`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/worklogs.ts#L57) | `57` | `function` | Domain Service Function |
| [`attachLoggedMinutes`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/worklogs.ts#L70) | `70` | `function` | Domain Service Function |
| [`getWorklogRef`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/worklogs.ts#L94) | `94` | `function` | Domain Service Function |
| [`createWorklog`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/worklogs.ts#L109) | `109` | `function` | Domain Service Function |
| [`updateWorklog`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/worklogs.ts#L147) | `147` | `function` | Domain Service Function |
| [`deleteWorklog`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/issues/worklogs.ts#L192) | `192` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/labels/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/labels/service.ts)
*Total Functions & Endpoints:* 8

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listLabels`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/labels/service.ts#L30) | `30` | `function` | Domain Service Function |
| [`createLabel`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/labels/service.ts#L50) | `50` | `function` | Domain Service Function |
| [`updateLabel`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/labels/service.ts#L71) | `71` | `function` | Domain Service Function |
| [`deleteLabel`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/labels/service.ts#L91) | `91` | `function` | Domain Service Function |
| [`listLabelGroups`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/labels/service.ts#L108) | `108` | `function` | Domain Service Function |
| [`createLabelGroup`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/labels/service.ts#L117) | `117` | `function` | Domain Service Function |
| [`updateLabelGroup`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/labels/service.ts#L131) | `131` | `function` | Domain Service Function |
| [`deleteLabelGroup`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/labels/service.ts#L149) | `149` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/link-previews/metadata.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/metadata.ts)
*Total Functions & Endpoints:* 9

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`parseLinkMetadata`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/metadata.ts#L23) | `23` | `function` | Domain Service Function |
| [`GET og:image:secure_url`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/metadata.ts#L45) | `45` | `endpoint` | Elysia API Route Handler |
| [`GET og:image`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/metadata.ts#L46) | `46` | `endpoint` | Elysia API Route Handler |
| [`GET twitter:image`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/metadata.ts#L47) | `47` | `endpoint` | Elysia API Route Handler |
| [`GET og:title`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/metadata.ts#L65) | `65` | `endpoint` | Elysia API Route Handler |
| [`GET og:description`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/metadata.ts#L67) | `67` | `endpoint` | Elysia API Route Handler |
| [`GET twitter:description`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/metadata.ts#L68) | `68` | `endpoint` | Elysia API Route Handler |
| [`GET description`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/metadata.ts#L69) | `69` | `endpoint` | Elysia API Route Handler |
| [`GET og:site_name`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/metadata.ts#L73) | `73` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/link-previews/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/service.ts)
*Total Functions & Endpoints:* 3

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`GET location`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/service.ts#L23) | `23` | `endpoint` | Elysia API Route Handler |
| [`getLinkPreview`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/service.ts#L56) | `56` | `function` | Domain Service Function |
| [`GET content-type`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/link-previews/service.ts#L83) | `83` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/members/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts)
*Total Functions & Endpoints:* 16

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`getMembershipSource`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L86) | `86` | `function` | Domain Service Function |
| [`getMembership`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L98) | `98` | `function` | Domain Service Function |
| [`toMemberContext`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L106) | `106` | `function` | Domain Service Function |
| [`getMemberContext`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L118) | `118` | `function` | Domain Service Function |
| [`getTeamPermissions`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L140) | `140` | `function` | Domain Service Function |
| [`listMemberContexts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L162) | `162` | `function` | Domain Service Function |
| [`listAssigneeCandidates`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L197) | `197` | `function` | Domain Service Function |
| [`matchesFilters`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L283) | `283` | `function` | Domain Service Function |
| [`listMembersPage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L371) | `371` | `function` | Domain Service Function |
| [`listAllMembers`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L386) | `386` | `function` | Domain Service Function |
| [`setMemberDescription`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L392) | `392` | `function` | Domain Service Function |
| [`addMember`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L408) | `408` | `function` | Domain Service Function |
| [`listMemberCandidates`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L424) | `424` | `function` | Domain Service Function |
| [`setMembership`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L472) | `472` | `function` | Domain Service Function |
| [`removeMember`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L486) | `486` | `function` | Domain Service Function |
| [`countOwners`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/members/service.ts#L502) | `502` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/note-boards/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/note-boards/service.ts)
*Total Functions & Endpoints:* 6

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listNoteBoards`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/note-boards/service.ts#L66) | `66` | `function` | Domain Service Function |
| [`getNoteBoard`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/note-boards/service.ts#L124) | `124` | `function` | Domain Service Function |
| [`createNoteBoard`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/note-boards/service.ts#L129) | `129` | `function` | Domain Service Function |
| [`updateNoteBoard`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/note-boards/service.ts#L152) | `152` | `function` | Domain Service Function |
| [`deleteNoteBoard`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/note-boards/service.ts#L181) | `181` | `function` | Domain Service Function |
| [`listNoteBoardAccessCandidates`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/note-boards/service.ts#L198) | `198` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/notification-preferences/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notification-preferences/service.ts)
*Total Functions & Endpoints:* 3

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`getPreferences`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notification-preferences/service.ts#L45) | `45` | `function` | Domain Service Function |
| [`setPreferences`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notification-preferences/service.ts#L65) | `65` | `function` | Domain Service Function |
| [`getPreferencesForUsers`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notification-preferences/service.ts#L84) | `84` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/notification-settings/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notification-settings/service.ts)
*Total Functions & Endpoints:* 3

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`getNotificationSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notification-settings/service.ts#L146) | `146` | `function` | Domain Service Function |
| [`setNotificationSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notification-settings/service.ts#L152) | `152` | `function` | Domain Service Function |
| [`readRedactedSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notification-settings/service.ts#L187) | `187` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/notifications/outbound.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/outbound.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`enqueueOutbound`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/outbound.ts#L135) | `135` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/notifications/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/service.ts)
*Total Functions & Endpoints:* 11

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`notifyComment`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/service.ts#L73) | `73` | `function` | Domain Service Function |
| [`notifyEditedCommentMentions`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/service.ts#L113) | `113` | `function` | Domain Service Function |
| [`notifyTextMentions`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/service.ts#L141) | `141` | `function` | Domain Service Function |
| [`notifyIssueChange`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/service.ts#L174) | `174` | `function` | Domain Service Function |
| [`listNotifications`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/service.ts#L309) | `309` | `function` | Domain Service Function |
| [`unreadCount`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/service.ts#L371) | `371` | `function` | Domain Service Function |
| [`setNotificationRead`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/service.ts#L391) | `391` | `function` | Domain Service Function |
| [`markAllRead`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/service.ts#L406) | `406` | `function` | Domain Service Function |
| [`snoozeNotification`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/service.ts#L419) | `419` | `function` | Domain Service Function |
| [`deleteNotification`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/service.ts#L434) | `434` | `function` | Domain Service Function |
| [`deleteNotifications`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/notifications/service.ts#L447) | `447` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/projects/copy.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/copy.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`copyProject`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/copy.ts#L226) | `226` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/projects/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts)
*Total Functions & Endpoints:* 16

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`mapProject`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L108) | `108` | `function` | Domain Service Function |
| [`listProjects`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L137) | `137` | `function` | Domain Service Function |
| [`getProjectByKey`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L225) | `225` | `function` | Domain Service Function |
| [`getProjectById`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L234) | `234` | `function` | Domain Service Function |
| [`getProjectTeamId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L246) | `246` | `function` | Domain Service Function |
| [`targetTeam`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L257) | `257` | `function` | Domain Service Function |
| [`createProject`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L367) | `367` | `function` | Domain Service Function |
| [`updateProject`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L422) | `422` | `function` | Domain Service Function |
| [`projectFeatures`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L435) | `435` | `function` | Domain Service Function |
| [`setProjectFeatures`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L450) | `450` | `function` | Domain Service Function |
| [`setEstimateSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L486) | `486` | `function` | Domain Service Function |
| [`getAutoArchiveSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L533) | `533` | `function` | Domain Service Function |
| [`setAutoArchiveSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L541) | `541` | `function` | Domain Service Function |
| [`getSubtaskAutomationSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L565) | `565` | `function` | Domain Service Function |
| [`setSubtaskAutomationSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L578) | `578` | `function` | Domain Service Function |
| [`deleteProject`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/projects/service.ts#L599) | `599` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/roles/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/roles/index.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`GET /teams/:teamId/roles/options`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/roles/index.ts#L86) | `86` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/roles/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/roles/service.ts)
*Total Functions & Endpoints:* 9

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listRolesPage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/roles/service.ts#L36) | `36` | `function` | Domain Service Function |
| [`listRoles`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/roles/service.ts#L63) | `63` | `function` | Domain Service Function |
| [`getRole`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/roles/service.ts#L72) | `72` | `function` | Domain Service Function |
| [`getDefaultRoleId`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/roles/service.ts#L82) | `82` | `function` | Domain Service Function |
| [`createRole`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/roles/service.ts#L90) | `90` | `function` | Domain Service Function |
| [`updateRole`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/roles/service.ts#L106) | `106` | `function` | Domain Service Function |
| [`getRoleUsage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/roles/service.ts#L134) | `134` | `function` | Domain Service Function |
| [`isRoleInUse`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/roles/service.ts#L162) | `162` | `function` | Domain Service Function |
| [`deleteRole`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/roles/service.ts#L172) | `172` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/scim/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/index.ts)
*Total Functions & Endpoints:* 5

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`GET /ServiceProviderConfig`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/index.ts#L110) | `110` | `endpoint` | Elysia API Route Handler |
| [`GET /ResourceTypes`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/index.ts#L115) | `115` | `endpoint` | Elysia API Route Handler |
| [`GET /Schemas`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/index.ts#L134) | `134` | `endpoint` | Elysia API Route Handler |
| [`GET /Users/:id`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/index.ts#L194) | `194` | `endpoint` | Elysia API Route Handler |
| [`GET /Groups/:id`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/index.ts#L319) | `319` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/scim/oidc-sync.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/oidc-sync.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`decodeJwtPayload`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/oidc-sync.ts#L20) | `20` | `function` | Domain Service Function |
| [`syncOidcGroupsAfterCallback`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/oidc-sync.ts#L37) | `37` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/scim/reconcile.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/reconcile.ts)
*Total Functions & Endpoints:* 3

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`reconcileProjects`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/reconcile.ts#L26) | `26` | `function` | Domain Service Function |
| [`dropUnusedTeamMembership`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/reconcile.ts#L133) | `133` | `function` | Domain Service Function |
| [`mappedProjectIds`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/reconcile.ts#L155) | `155` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/scim/resource.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts)
*Total Functions & Endpoints:* 15

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`scimErrorBody`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L38) | `38` | `function` | Domain Service Function |
| [`splitName`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L63) | `63` | `function` | Domain Service Function |
| [`joinName`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L70) | `70` | `function` | Domain Service Function |
| [`readAccountEmail`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L87) | `87` | `function` | Domain Service Function |
| [`readEmail`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L101) | `101` | `function` | Domain Service Function |
| [`toScimUser`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L112) | `112` | `function` | Domain Service Function |
| [`toScimGroup`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L142) | `142` | `function` | Domain Service Function |
| [`toListResponse`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L164) | `164` | `function` | Domain Service Function |
| [`parseFilter`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L187) | `187` | `function` | Domain Service Function |
| [`parsePatch`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L219) | `219` | `function` | Domain Service Function |
| [`asBoolean`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L250) | `250` | `function` | Domain Service Function |
| [`asString`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L256) | `256` | `function` | Domain Service Function |
| [`memberIds`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L262) | `262` | `function` | Domain Service Function |
| [`memberFilterIds`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L278) | `278` | `function` | Domain Service Function |
| [`groupDisplayNames`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/resource.ts#L291) | `291` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/scim/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/service.ts)
*Total Functions & Endpoints:* 11

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listScimUsers`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/service.ts#L88) | `88` | `function` | Domain Service Function |
| [`getScimUser`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/service.ts#L110) | `110` | `function` | Domain Service Function |
| [`createScimUser`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/service.ts#L118) | `118` | `function` | Domain Service Function |
| [`updateScimUser`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/service.ts#L186) | `186` | `function` | Domain Service Function |
| [`syncEmbeddedGroups`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/service.ts#L240) | `240` | `function` | Domain Service Function |
| [`deleteScimUser`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/service.ts#L270) | `270` | `function` | Domain Service Function |
| [`listScimGroups`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/service.ts#L353) | `353` | `function` | Domain Service Function |
| [`getScimGroup`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/service.ts#L375) | `375` | `function` | Domain Service Function |
| [`createScimGroup`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/service.ts#L381) | `381` | `function` | Domain Service Function |
| [`updateScimGroup`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/service.ts#L419) | `419` | `function` | Domain Service Function |
| [`deleteScimGroup`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/scim/service.ts#L469) | `469` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/settings/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/index.ts)
*Total Functions & Endpoints:* 4

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`GET /settings/storage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/index.ts#L25) | `25` | `endpoint` | Elysia API Route Handler |
| [`GET /settings/hotkeys`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/index.ts#L33) | `33` | `endpoint` | Elysia API Route Handler |
| [`GET /settings/version`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/index.ts#L46) | `46` | `endpoint` | Elysia API Route Handler |
| [`GET /settings/whats-new`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/index.ts#L58) | `58` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/settings/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/service.ts)
*Total Functions & Endpoints:* 7

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`getStorageSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/service.ts#L61) | `61` | `function` | Domain Service Function |
| [`setStorageSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/service.ts#L67) | `67` | `function` | Domain Service Function |
| [`mimeAllowed`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/service.ts#L82) | `82` | `function` | Domain Service Function |
| [`getProjectDefaults`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/service.ts#L109) | `109` | `function` | Domain Service Function |
| [`setProjectDefaults`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/service.ts#L115) | `115` | `function` | Domain Service Function |
| [`getHotkeySettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/service.ts#L132) | `132` | `function` | Domain Service Function |
| [`setHotkeySettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/service.ts#L138) | `138` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/settings/updates.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/updates.ts)
*Total Functions & Endpoints:* 8

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`getAppVersion`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/updates.ts#L47) | `47` | `function` | Domain Service Function |
| [`parseVersion`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/updates.ts#L53) | `53` | `function` | Domain Service Function |
| [`compareVersions`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/updates.ts#L60) | `60` | `function` | Domain Service Function |
| [`parseReleasesAtom`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/updates.ts#L83) | `83` | `function` | Domain Service Function |
| [`parseChangelog`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/updates.ts#L107) | `107` | `function` | Domain Service Function |
| [`mergeHistory`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/updates.ts#L170) | `170` | `function` | Domain Service Function |
| [`getUpdateStatus`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/updates.ts#L181) | `181` | `function` | Domain Service Function |
| [`releasesSince`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/updates.ts#L199) | `199` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/settings/whats-new.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/whats-new.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`getWhatsNew`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/whats-new.ts#L58) | `58` | `function` | Domain Service Function |
| [`markWhatsNewSeen`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/settings/whats-new.ts#L89) | `89` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/share/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/share/service.ts)
*Total Functions & Endpoints:* 7

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`enableIssueShare`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/share/service.ts#L173) | `173` | `function` | Domain Service Function |
| [`disableIssueShare`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/share/service.ts#L191) | `191` | `function` | Domain Service Function |
| [`enableViewShare`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/share/service.ts#L201) | `201` | `function` | Domain Service Function |
| [`disableViewShare`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/share/service.ts#L215) | `215` | `function` | Domain Service Function |
| [`getSharedIssue`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/share/service.ts#L227) | `227` | `function` | Domain Service Function |
| [`getSharedView`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/share/service.ts#L237) | `237` | `function` | Domain Service Function |
| [`getSharedViewIssue`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/share/service.ts#L286) | `286` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/sync/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/sync/service.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`readRevs`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/sync/service.ts#L46) | `46` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/teams/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/index.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`PATCH /teams/:teamId/mcp`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/index.ts#L230) | `230` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/teams/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts)
*Total Functions & Endpoints:* 20

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`runsTeam`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L44) | `44` | `function` | Domain Service Function |
| [`listTeams`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L302) | `302` | `function` | Domain Service Function |
| [`teamMcpEnabled`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L311) | `311` | `function` | Domain Service Function |
| [`setTeamMcp`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L341) | `341` | `function` | Domain Service Function |
| [`getTeamMembership`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L361) | `361` | `function` | Domain Service Function |
| [`getTeam`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L375) | `375` | `function` | Domain Service Function |
| [`listTeamMembers`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L413) | `413` | `function` | Domain Service Function |
| [`listTeamProjects`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L484) | `484` | `function` | Domain Service Function |
| [`listTeamProjectOptions`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L563) | `563` | `function` | Domain Service Function |
| [`teamOwnsProject`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L595) | `595` | `function` | Domain Service Function |
| [`getTeamProject`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L607) | `607` | `function` | Domain Service Function |
| [`listTeamProjectMembers`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L636) | `636` | `function` | Domain Service Function |
| [`insertOwnedTeam`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L673) | `673` | `function` | Domain Service Function |
| [`listTeamMemberIds`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L699) | `699` | `function` | Domain Service Function |
| [`assertTeamSeatFree`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L709) | `709` | `function` | Domain Service Function |
| [`createTeam`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L719) | `719` | `function` | Domain Service Function |
| [`renameTeam`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L746) | `746` | `function` | Domain Service Function |
| [`setTeamMemberRole`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L768) | `768` | `function` | Domain Service Function |
| [`removeTeamMember`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L874) | `874` | `function` | Domain Service Function |
| [`leaveTeam`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/teams/service.ts#L900) | `900` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/telegram/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/telegram/service.ts)
*Total Functions & Endpoints:* 8

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`hasUsableInstanceBot`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/telegram/service.ts#L30) | `30` | `function` | Domain Service Function |
| [`getInstanceBotSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/telegram/service.ts#L57) | `57` | `function` | Domain Service Function |
| [`fetchBotUsername`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/telegram/service.ts#L64) | `64` | `function` | Domain Service Function |
| [`setInstanceBotSettings`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/telegram/service.ts#L83) | `83` | `function` | Domain Service Function |
| [`getTelegramLink`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/telegram/service.ts#L113) | `113` | `function` | Domain Service Function |
| [`getTelegramChatIds`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/telegram/service.ts#L135) | `135` | `function` | Domain Service Function |
| [`startTelegramLink`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/telegram/service.ts#L151) | `151` | `function` | Domain Service Function |
| [`unlinkTelegram`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/telegram/service.ts#L168) | `168` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/user-preferences/index.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/user-preferences/index.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`GET accept-language`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/user-preferences/index.ts#L29) | `29` | `endpoint` | Elysia API Route Handler |
| [`GET accept-language`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/user-preferences/index.ts#L56) | `56` | `endpoint` | Elysia API Route Handler |

### Module: [`apps/api/src/modules/user-preferences/locale.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/user-preferences/locale.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`localeFromAcceptLanguage`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/user-preferences/locale.ts#L9) | `9` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/user-preferences/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/user-preferences/service.ts)
*Total Functions & Endpoints:* 4

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`defaults`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/user-preferences/service.ts#L54) | `54` | `function` | Domain Service Function |
| [`isValidTimezone`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/user-preferences/service.ts#L73) | `73` | `function` | Domain Service Function |
| [`getPreferences`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/user-preferences/service.ts#L113) | `113` | `function` | Domain Service Function |
| [`updatePreferences`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/user-preferences/service.ts#L139) | `139` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/views/filters.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/views/filters.ts)
*Total Functions & Endpoints:* 1

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`applyFilters`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/views/filters.ts#L180) | `180` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/views/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/views/service.ts)
*Total Functions & Endpoints:* 9

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`listViews`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/views/service.ts#L42) | `42` | `function` | Domain Service Function |
| [`isFavoriteView`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/views/service.ts#L58) | `58` | `function` | Domain Service Function |
| [`addFavoriteView`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/views/service.ts#L66) | `66` | `function` | Domain Service Function |
| [`removeFavoriteView`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/views/service.ts#L70) | `70` | `function` | Domain Service Function |
| [`createView`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/views/service.ts#L76) | `76` | `function` | Domain Service Function |
| [`getView`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/views/service.ts#L101) | `101` | `function` | Domain Service Function |
| [`updateView`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/views/service.ts#L106) | `106` | `function` | Domain Service Function |
| [`deleteView`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/views/service.ts#L120) | `120` | `function` | Domain Service Function |
| [`reorderViews`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/views/service.ts#L124) | `124` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/webhooks/emit.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/webhooks/emit.ts)
*Total Functions & Endpoints:* 2

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`emitWebhookEvent`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/webhooks/emit.ts#L36) | `36` | `function` | Domain Service Function |
| [`emitWebhookEvents`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/webhooks/emit.ts#L49) | `49` | `function` | Domain Service Function |

### Module: [`apps/api/src/modules/webhooks/service.ts`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/webhooks/service.ts)
*Total Functions & Endpoints:* 7

| Function / Endpoint | Line | Type | Summary / Lineage |
|:---|:---:|:---:|:---|
| [`generateSecret`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/webhooks/service.ts#L62) | `62` | `function` | Domain Service Function |
| [`listWebhooks`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/webhooks/service.ts#L66) | `66` | `function` | Domain Service Function |
| [`createWebhook`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/webhooks/service.ts#L75) | `75` | `function` | Domain Service Function |
| [`getWebhook`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/webhooks/service.ts#L94) | `94` | `function` | Domain Service Function |
| [`updateWebhook`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/webhooks/service.ts#L100) | `100` | `function` | Domain Service Function |
| [`deleteWebhook`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/webhooks/service.ts#L118) | `118` | `function` | Domain Service Function |
| [`listWebhookDeliveries`](file:///d:/WORK/01_PROJECTS/58_ITSAPLAN/apps/api/src/modules/webhooks/service.ts#L164) | `164` | `function` | Domain Service Function |

