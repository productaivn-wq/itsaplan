@UC-009
Feature: Autonomous Portfolio Directory Reconciliation, Archive Vault Routing & 7-Horizon Auto-Provisioning
  As the Deterministic Portfolio Topology Reconciler (DET P=1) and Portfolio Director (HUM)
  I want active and archived workspace project directories synchronized idempotently with ItsAPlan (ACCORD)
  So that all active projects expose 5 canonical workflow columns, H1..H7 governance skeletons, and sub-2s sidebar updates without destructive deletions.

  @TC-UC009-S01 @FR-049 @Positive
  Scenario: Idempotently provision net-new portfolio project with 5 required workflow state columns
    Given an active portfolio directory "55_EUREKA_SCIENTIFIC_RESEARCH" with derived key "ESR" exists in the portfolio SSOT
    When the PortfolioTopologyReconciler executes a reconciliation pass
    Then project "ESR" exists in "public.project" under primary team 1 preserving contiguous "next_sequence"
    And project "ESR" contains workflow columns covering "backlog", "unstarted", "started", "completed", and "canceled"

  @TC-UC009-S02 @FR-050 @Stateful
  Scenario: Non-destructively route archived workspace project to archived_vault and restore on unarchive
    Given active project "LEG" has 12 historical issues and 3 documents in "public.project"
    When workspace directory for "LEG" moves to "_archive" and reconciliation runs
    Then project "LEG" transitions to "archived_vault" team 3 with "project_member.is_hidden" set to true and 12 issues preserved
    When workspace directory for "LEG" is restored from "_archive" and reconciliation runs
    Then project "LEG" returns to primary team 1 with "project_member.is_hidden" set to false

  @TC-UC009-S03 @FR-051 @Governance
  Scenario: Seed H1 through H7 governance parent skeleton only on net-new empty projects
    Given newly provisioned project "NEWP" has 0 existing issues
    When 7-Horizon skeleton seeding executes for "NEWP"
    Then canonical H1 through H7 governance parent items are created without duplicating existing project issues

  @TC-UC009-S04 @FR-052 @Realtime
  Scenario: Bump projects revision counter upon portfolio topology mutation
    Given connected SyncProvider clients poll "/sync/rev" for scope "projects:1"
    When the reconciler provisions or archives a project in team 1
    Then "revision.rev" for scope "projects:1" increments atomically so clients invalidate sidebar project cache within 2000ms
