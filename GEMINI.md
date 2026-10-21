# ItsAPlan Sovereign AI Agent Platform Workspace Harness (`58_ITSAPLAN`)

`[CANARY:GEMINI.md:GOVERNED]` · **Version**: 3.1.0 · **Status**: ACTIVE · **Effective**: 2026-10-18  
`Inherits: ~/.gemini/config/GEMINI.md (53.REF.100 Three-Node Socio-Technical Architecture, 53.REF.28 v3.1.0)`

---

## 1. Domain Scope, Identity & Inheritance

- **Global Inheritance**: Fully inherits the Three-Node Socio-Technical Model (`HUM` [Phương Võ], `DET` P=1, `AGT`), universal CI/CD pipeline (`GW-SEMVER-01`, `GW-DEPLOY-07`, `GW-CANARY-01`), FinOps limits (`GW-COMPACT-01`, `GW-POLL-01`, `GW-TOKEN-FINOPS-01`), workspace isolation (`GW-FS-ISOLATION-01`), and presentation protocol (`GW-OUTPUT-KISS-01`) from `~/.gemini/config/GEMINI.md`.
- **Domain Scope**: Enterprise AI Agent & Project Management Platform, multi-tenant agent execution, workflows, and task queues.
- **Substrates & Storage**: PostgreSQL, SQLite, Next.js / Fastify microservices.

---

## 2. Domain-Specific Quality Gates (Enforced by `DET` $P=1$)

*Note: Universal runtime, CI/CD, and FinOps gates are inherited directly from Global GEMINI.md.*

The following domain-specific gates govern workspace lifecycle transitions and deliverables:

| Gate | Invariant Summary | Authoritative SSOT / Executor |
| :--- | :--- | :--- |
| **`GW-AUTHZ-01`** | Multi-tenant workspace isolation & cryptographically signed agent run tokens. | `SSOT Standard` |
| **`GW-PROOF-01`** | Agent workflow claims require verified API run telemetry (✓✓). | `SSOT Standard` |

---

## 3. MECE Deliverable Routing & Zero-Desktop Invariant

All workspace deliverables MUST reside strictly within designated MECE zones:
- `00_INBOX/`: Raw intake, external data files, temporary ingestion queue.
- `10_ACTIVE_TIMEBOUND/`: Active sprint deliverables, milestone plans, time-boxed artifacts.
- `20_ACTIVE_CONTINUOUS/`: Operational boards, standing templates, continuous configurations.
- `30_REFERENCE/`: Domain contracts, schemas, architecture specs, and standards.
- `40_ARCHIVE/`: Closed sprints, superseded assets, and historical records (modifications require Tier 2 HITL).
- **Zero-Desktop Invariant**: Writing or copying artifacts outside the workspace root is strictly prohibited.

---

## 4. Domain Authority & Escalation Limits

- **Autonomous Execution (Tier 0 & 1)**: All domain engineering, testing, and validation execute autonomously under `GW-AUTONOMY-01` without pre-completion checks.
- **Mandatory Escalation (Tier 2: Phương Võ, `HITL`)**: Triggered exclusively for:
  1. Scope alterations exceeding 30% of approved baseline.
  2. Irreversible data loss (`DROP`, unbacked destructive schema migrations, broad record deletions).
  3. Real-world outbound communications, financial commitments, or cross-workspace file access.

---

## 5. Working Memory & Audit SSOT

- **Active Focus Cache (`hot.md`)**: Read at session start; maintain active focus ($\le 500$ words, `GW-CACHE-01`).
- **Append-Only Audit Log (`log.md`)**: Append timestamped records for mutations and decisions (`AUD`).
