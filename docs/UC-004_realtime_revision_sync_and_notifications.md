# UC-004: Realtime Revision Sync and Notification Delivery

| Attribute | Specification |
| :--- | :--- |
| **UC ID** | `UC-004` |
| **Title** | Synchronize Realtime Revisions and Deliver Notifications |
| **Primary Actor** | End User / Background Delivery Worker |
| **Goal** | Ensure all active client views receive instant query cache invalidation on backend changes, and deliver out-of-band notifications (Email/Telegram) and webhooks reliably. |
| **Scope** | System (`apps/api`, `apps/web`, `apps/worker`, `packages/mailer`) |
| **Level** | 🌊 User Goal |
| **Preconditions** | PostgreSQL triggers are installed (migration 0070); user has configured notification preferences. |
| **Success Guarantee** | Client query caches invalidate within 2000ms of any database mutation; queued notifications and webhooks deliver successfully with HMAC verification. |
| **Minimum Guarantee** | Failed webhook endpoints or offline mailers do not block database transactions; delivery records track retry counts with exponential backoff. |

---

## 1. Sizing & Splitting Decision (Phase 0)
- **Primary Pattern Applied**: Pattern 1 (Workflow Steps) & Pattern 8 (Defer Performance / Delivery).
- **Rationale**: Separates immediate in-app revision polling (low-overhead counter polling) from asynchronous external notification and webhook delivery pipelines.

---

## 2. Basic Flow (Main Scenario)
1. **Trigger Change Marker**: Any database mutation on issues, columns, comments, or initiatives triggers PostgreSQL trigger `bump_revision()`, incrementing `revision.rev` for the respective scope (e.g., `board:<projectId>`).
2. **Poll Change Markers**: The browser's `SyncProvider` (`syncContext.tsx`) polls `GET /sync/rev?scopes=board:123` every 2000ms (`POLL_MS = 2000`).
3. **Invalidate Client Queries**: When `data.revs[scope]` differs from `seen[scope]`, `SyncProvider` calls `qc.invalidateQueries({ queryKey: ['issues', projectId] })`, triggering an automatic background refetch.
4. **Enqueue Notifications**: The triggering action creates an in-app `notification` row for target users (`type = 'assigned' | 'mentioned' | 'commented' | 'state_changed'`).
5. **Enqueue Webhook Deliveries**: For projects with active webhooks subscribed to the event type, the system inserts an outbox record in `webhook_delivery` (`status = 'pending'`).
6. **Worker Delivery Sweep**: The background worker daemon (`apps/worker/src/worker.ts`) claims due `webhook_delivery` rows, signs the JSON payload using HMAC-SHA256 with the webhook secret, and dispatches HTTP POST.
7. **External Notifications**: The worker checks `user_notification_preference`, dispatches formatted HTML emails via SMTP/Resend, and sends Telegram alerts to linked Telegram accounts.

---

## 3. Alternate & Exception Flows
- **A1 — Webhook Delivery Failure & Backoff**:
  - *Condition*: The subscriber's server returns 5xx or times out.
  - *System Response*: The worker increments `attempts`, sets `next_attempt_at` using exponential backoff, and records `last_error`. After crossing consecutive failure thresholds, the webhook is auto-disabled (`isActive = false`).
- **A2 — Background Tab Polling Pause**:
  - *Condition*: The user minimizes or switches browser tabs.
  - *System Response*: TanStack Query pauses active polling; upon refocus, `SyncProvider` immediately fires a catch-up poll and invalidates stale caches.
- **A3 — Unlinked Telegram Account**:
  - *Condition*: Notification preference enables Telegram delivery, but `user_telegram_account` is unlinked.
  - *System Response*: Delivery gracefully falls back to email or stays in-app without raising an unhandled exception.

---

## 4. Use-Case Slices
- **Slice S01: Lightweight Revision Polling & Query Invalidation**  
  *Scope*: PostgreSQL trigger increments, `/sync/rev` route, TanStack `SyncProvider` lifecycle.  
  *Traceability*: → TC: `TC-UC-004 Scenario G01` (Mutate issue and verify client cache invalidation).
- **Slice S02: Transactional Webhook Outbox Delivery**  
  *Scope*: Webhook subscription, HMAC-SHA256 signature, retry queue with exponential backoff.  
  *Traceability*: → TC: `TC-UC-004 Scenario G02` (Emit webhook event and verify HMAC signature).
- **Slice S03: Multi-Channel User Notifications**  
  *Scope*: In-app notifications, email notifications via Resend/SMTP, Telegram bot dispatch.  
  *Traceability*: → TC: `TC-UC-004 Scenario G03` (Deliver mention notification to email and inbox).

---

## 5. Revision History
- **2026-09-21**: Version 1.0.0 — Aligned with `apps/web/src/context/syncContext.tsx`, `apps/api/src/modules/sync`, and `apps/worker/src`.
