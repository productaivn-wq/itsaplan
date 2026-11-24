@UC-003 @CAP-AGENT @CAP-RUNNER @CAP-MCP
Feature: AI Agent Runtime and MCP Tools
  As an AI agent operator
  I want agents to claim runs, execute sandboxed MCP tools, and stream progress
  So that autonomous development workflows run safely and reliably

  Background:
    Given an AI agent "BugFixer" configured in project "ENG"
    And a queued agent run with status "pending"

  @FR-019 @Lease
  Scenario: Exclusive runner lease claim
    When runner "runner-node-1" claims the next pending run
    Then the run status becomes "running"
    And the lease expiration is set to 60 seconds from now
    And concurrent claim attempts by "runner-node-2" return HTTP 204

  @FR-020 @MCP @Auth
  Scenario: MCP tool authorization enforcement
    Given project "ENG" has mcpEnabled set to true
    When an authenticated member invokes MCP tool "search_issues"
    Then the MCP tool executes successfully and returns structured JSON
    But when an unauthenticated caller invokes "search_issues"
    Then the request is rejected with HTTP 401 Unauthorized

  @TC-UC003-04 @TC-UC003-05 @SPEC-53.ACT.505
  Scenario: Inspect and edit Sovereign Harness v3.2.0 agent in 2 steps directly on /agents without duplicated jargon
    Given "/thanb/PM/agents" renders a single-line Harness v3.2.0 status bar with zero "text-[11px]" classes
    When the operator clicks the "@antigravity" agent row
    Then the 380px AgentSheet drawer opens in-place on "/thanb/PM/agents" showing Model, Actions, 37 Skills, and Tools
