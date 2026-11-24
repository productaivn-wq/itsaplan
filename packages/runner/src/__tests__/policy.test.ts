import { describe, expect, it } from 'bun:test';
import {
  assertRunnerPresetPolicy,
  PRESETS,
  presetArgv,
  resolveGovernedPreset,
  RunnerPolicyError,
} from '../presets';

describe('enterprise HITL runner preset policy', () => {
  it('strips --auto-approve from preset head under tenant-isolated HITL mode', () => {
    const governed = resolveGovernedPreset('omp', {
      tenantIsolated: true,
      allowUnsafeAutoApprove: false,
    });
    const argv = presetArgv(governed, null, 'ctx', [], 'solve issue');
    expect(argv).not.toContain('--auto-approve');
  });

  it('throws RunnerPolicyError when extra args pass unattended HITL bypass flags', () => {
    expect(() =>
      assertRunnerPresetPolicy({
        preset: PRESETS.antigravity,
        extraArgs: ['--dangerously-skip-permissions'],
        tenantIsolated: true,
      }),
    ).toThrow(RunnerPolicyError);
  });

  it('preserves flags when explicit allowUnsafeAutoApprove opt-in is passed', () => {
    const optedIn = resolveGovernedPreset('omp', {
      tenantIsolated: true,
      allowUnsafeAutoApprove: true,
    });
    const argv = presetArgv(optedIn, null, '', [], 'task');
    expect(argv).toContain('--auto-approve');
  });
});
