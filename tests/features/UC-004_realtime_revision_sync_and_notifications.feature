@UC-004 @CAP-NOTIF
Feature: Realtime Revision Sync and Notifications
  As a connected client or external webhook consumer
  I want database triggers to bump revision counters and webhook events signed with HMAC
  So that UI views stay synchronized and webhooks are cryptographically authenticated

  Background:
    Given project "ENG" exists with initial revision 10

  @FR-022 @Stateful
  Scenario: Database trigger increments revision upon issue update
    When an issue in project "ENG" is moved to column "Done"
    Then the PostgreSQL revision counter for "ENG" increments to 11
    And polling clients receive the delta mutation payload

  @FR-023 @Security
  Scenario: Webhook HMAC-SHA256 signature verification
    Given a configured webhook with endpoint "https://example.com/hook"
    When event "issue.created" is triggered
    Then the worker dispatches an HTTP POST request
    And the headers include "X-ItsAPlan-Signature" matching HMAC-SHA256 of payload
