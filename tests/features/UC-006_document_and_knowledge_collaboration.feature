@UC-006 @CAP-DOC
Feature: Document and Knowledge Collaboration
  As a team collaborator
  I want collaborative documents with optimistic locking and automatic version history
  So that concurrent edits do not overwrite each other and revision history is preserved

  Background:
    Given a project "ENG" exists
    And a document "Architecture Overview" at version 2

  @FR-028 @Locking
  Scenario: Optimistic concurrency control prevents stale overwrites
    When Author A updates "Architecture Overview" with version 2
    Then the update succeeds and version becomes 3
    But when Author B attempts to update with stale version 2
    Then the request is rejected with HTTP 409 Conflict

  @FR-029 @Revision
  Scenario: Automatic document revision snapshots
    When a document is updated from version 2 to 3
    Then a snapshot of version 2 is automatically inserted into document revisions table
    And the revision contains the author ID and complete markdown body
