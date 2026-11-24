import { afterEach, describe, expect, it } from 'bun:test';
import {
  assertLoopbackGatewayUrl,
  buildSovereignHarnessTools,
  tryRunDeterministicSchedule,
} from '../../runtime/tools/sovereign-harness';

describe('sovereign-harness', () => {
  const origFetch = globalThis.fetch;
  const origUrl = process.env.ITSAPLAN_LLM_GATEWAY_URL;
  const origTok = process.env.ITSAPLAN_LLM_GATEWAY_TOKEN;

  afterEach(() => {
    globalThis.fetch = origFetch;
    if (origUrl === undefined) delete process.env.ITSAPLAN_LLM_GATEWAY_URL;
    else process.env.ITSAPLAN_LLM_GATEWAY_URL = origUrl;
    if (origTok === undefined) delete process.env.ITSAPLAN_LLM_GATEWAY_TOKEN;
    else process.env.ITSAPLAN_LLM_GATEWAY_TOKEN = origTok;
  });

  it('allows loopback gateway URLs and rejects external hosts', () => {
    expect(assertLoopbackGatewayUrl('http://127.0.0.1:18766/')).toBe('http://127.0.0.1:18766');
    expect(assertLoopbackGatewayUrl('http://localhost:18766')).toBe('http://localhost:18766');
    expect(() => assertLoopbackGatewayUrl('https://evil.example.com/v1')).toThrow(/loopback/i);
    expect(() => assertLoopbackGatewayUrl('http://169.254.169.254/latest')).toThrow(/loopback/i);
    expect(() => assertLoopbackGatewayUrl('ftp://127.0.0.1:18766')).toThrow(/protocol/i);
  });

  it('exports all 8 sovereign/TaskManager/SOP tools by default and 5 read-only tools when readOnly is true', () => {
    const full = buildSovereignHarnessTools({
      projectKey: 'PM',
      agentUsername: 'orchestrator',
      teamId: 1,
      agentId: 3,
    });
    expect(Object.keys(full).sort()).toEqual([
      'sop_list_and_resolve',
      'sop_run_lifecycle_phase',
      'sovereign_call_aos_tool',
      'sovereign_quality_gate_and_sod',
      'sovereign_query_memory',
      'task_manager_dispatch_kahn_wbs',
      'task_manager_query_tasks',
      'task_manager_sync_status',
    ]);

    const readOnly = buildSovereignHarnessTools({
      projectKey: 'PM',
      agentUsername: 'orchestrator',
      teamId: 1,
      agentId: 3,
      readOnly: true,
    });
    expect(Object.keys(readOnly).sort()).toEqual([
      'sop_list_and_resolve',
      'sovereign_call_aos_tool',
      'sovereign_quality_gate_and_sod',
      'sovereign_query_memory',
      'task_manager_query_tasks',
    ]);
  });

  it('tryRunDeterministicSchedule handles both handled=true and handled=false payloads', async () => {
    process.env.ITSAPLAN_LLM_GATEWAY_URL = 'http://127.0.0.1:18766';
    process.env.ITSAPLAN_LLM_GATEWAY_TOKEN = 'test-token';

    let nextPayload: Record<string, unknown> = {
      handled: true,
      status: 'success',
      output: '[DET P=1 VERIFIED PROBE]',
      input_tokens: 0,
      output_tokens: 0,
      provider: 'deterministic_verified_probe_det',
    };
    globalThis.fetch = (async () =>
      new Response(JSON.stringify(nextPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })) as unknown as typeof fetch;

    const handledRes = await tryRunDeterministicSchedule({
      prompt: 'Poll high-frequency system health',
      username: 'orchestrator',
      projectKey: 'PM',
    });
    expect(handledRes).toEqual({
      handled: true,
      status: 'success',
      output: '[DET P=1 VERIFIED PROBE]',
      input_tokens: 0,
      output_tokens: 0,
      provider: 'deterministic_verified_probe_det',
    });

    nextPayload = { handled: false };
    const unhandledRes = await tryRunDeterministicSchedule({
      prompt: 'Analyze sprint velocity trends',
      username: 'research',
      projectKey: 'PM',
    });
    expect(unhandledRes.handled).toBe(false);
  });
});
