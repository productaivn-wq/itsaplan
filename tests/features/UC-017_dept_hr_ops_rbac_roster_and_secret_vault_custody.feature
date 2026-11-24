@UC-017 @SPEC-53.ACT.500 @FR-067
Feature: UC-017 — Phòng HCNS — Hybrid Human-AI Roster Telemetry, RBAC Governance, FinOps & Secret Vault Custody

  @TC-UC017-S01 @TC-UC017-01
  Scenario: Inspect HCNS live telemetry with Multi-Project Filter and [PROJECT_KEY] badges
    Given Open Office is hydrated from PostgreSQL ITSAPLAN_DB_URL with project filter "PM" or "ALL"
    When the operator clicks department room "hr_ops" ("HCNS")
    Then the Department Inspector displays live metrics for "HCNS" and per-agent [PROJECT_KEY] badges with zero fake sprites

  @TC-UC017-S02 @TC-UC017-02
  Scenario: Trigger HCNS primary department workflow "Kiểm tra Sức khỏe Đội ngũ, Quyền & Secret Vault"
    Given the Department Inspector for "hr_ops" is open
    When the operator invokes "Kiểm tra Sức khỏe Đội ngũ, Quyền & Secret Vault" using template "ops_reconciliation"
    Then the receiving real agent walks through the "hr_ops" doorway and binds a real ItsAPlan issue and run

  @TC-UC017-S02 @TC-UC017-03
  Scenario: Enforce fail-closed departmental boundary guard (Stale Agent Runner Heartbeat)
    Given department "hr_ops" enforces deterministic P=1 invariants
    When an invalid or unauthorized request occurs matching "Stale Agent Runner Heartbeat"
    Then the engine rejects the mutation fail-closed and preserves SHA-256 event log integrity

  @TC-UC017-S03 @TC-UC017-04
  Scenario: Navigate from HCNS to native ItsAPlan modules
    Given the Department Inspector for "hr_ops" is open for project "owner.PM"
    Then 1-click module portals resolve cleanly to /{teamRef}/{projectKey}/members, /{teamRef}/{projectKey}/vault, /{teamRef}/settings/roles, /{teamRef}/settings/ai-agents
