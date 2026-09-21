@UC-001 @CAP-PROJ @CAP-BOARD @CAP-AUTH
Feature: Project and Board Lifecycle Management
  As a workspace owner or team lead
  I want to create, configure, and manage projects and board columns
  So that our team can organize and track work items with enforced workflow invariants

  Background:
    Given an authenticated user with owner role in the organization
    And a clean database state

  @FR-001 @Positive
  Scenario: Successfully create a project with valid key and default columns
    When the user submits a project creation request:
      | key  | name              |
      | CORE | Core Platform Dev |
    Then the response status should be 201
    And the project should be created with key "CORE"
    And the project sequence should be initialized to 1
    And the project should contain the default columns:
      | name        | stateType |
      | Backlog     | backlog   |
      | Todo        | unstarted |
      | In Progress | started   |
      | Done        | completed |
      | Canceled    | canceled  |

  @FR-001 @Negative
  Scenario Outline: Reject invalid project keys
    When the user submits a project creation request with key "<key>" and name "Test Project"
    Then the response status should be 422
    And the error reason should be "INVALID_PROJECT_KEY"

    Examples:
      | key         | reason          |
      | core        | Lowercase       |
      | C           | Too short (< 2) |
      | TOOLONGKEYX | Too long (> 10) |
      | CO RE       | Contains space  |
      | CO#E        | Special char    |

  @FR-007 @FR-008 @WIP
  Scenario: Enforce WIP limit in hard mode
    Given a column "In Progress" with wipMode "hard" and wipLimit 2
    And 2 active issues already reside in "In Progress"
    When a member attempts to transition another issue into "In Progress"
    Then the response status should be 422
    And the transition should be rejected with code "WIP_LIMIT_EXCEEDED"

  @FR-009 @AutoAssign
  Scenario: Auto-assign user upon entering configured column
    Given a column "Review" with autoAssignUserId "user-reviewer-123"
    And an issue currently assigned to "user-dev-456"
    When the issue is moved to "Review"
    Then the issue assignee should automatically update to "user-reviewer-123"
