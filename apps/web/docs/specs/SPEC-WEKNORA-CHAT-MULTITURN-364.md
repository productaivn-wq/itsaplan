# SPEC-WEKNORA-CHAT-MULTITURN-364: Unified AI Chat Multi-Turn History, Clean Thread Sessions & Intent-Aware Task Grounding

- **Spec ID**: `SPEC-WEKNORA-CHAT-MULTITURN-364`
- **Status**: `APPROVED`
- **Date**: `2026-10-28`
- **Governing Standards**: `53.REF.100`, `53.REF.28`, `GW-UTOP-01/02`, `GW-DOD-LOOP-01`, `GW-P2-STRESS-360-01`
- **Target Files**:
  - `scripts/vibe_canvas_api_bridge.py`
  - `apps/itsaplan/apps/web/src/features/vibe-canvas/components/WeKnoraCopilotDock.tsx`
  - `apps/itsaplan/apps/web/src/features/vibe-canvas/VibeCanvasPage.tsx`
  - `apps/itsaplan/apps/web/src/features/vibe-canvas/types.ts`

## 1. 4-Block Task Goal & DoD-1..4 Contract
- **Target & Scope**: Remediate three user-reported defects in the Unified AI Chat (`WeKnoraCopilotDock` & `VibeCanvasService`).
- **Expected Output**: `DoD-1`..`DoD-4` (`FR-CHAT-364-01`..`FR-CHAT-364-04`, `TC-CHAT-364-01`..`TC-CHAT-364-12`).

```gherkin
Feature: Unified AI Chat Multi-Turn Conversation & Intent-Aware Task Grounding
  Scenario: TC-CHAT-364-01 Multi-turn chat feed and thread session persistence
    Given WeKnoraCopilotDock is mounted
    When the user submits multiple questions in a thread
    Then each question and grounded response is appended chronologically to the thread
```
