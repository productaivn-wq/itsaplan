import { PRESETS, type Preset, type PresetName } from './presets';

export interface RunnerPolicyInput {
  preset: Preset;
  extraArgs?: string[];
  allowUnsafeAutoApprove?: boolean;
  tenantIsolated?: boolean;
}

export class RunnerPolicyError extends Error {
  readonly code = 'UNATTENDED_HITL_BYPASS_FORBIDDEN';
}

const UNSAFE_EXTRA_FLAGS = new Set([
  '--dangerously-skip-permissions',
  '--yolo',
  '--allow-dangerously-skip-permissions',
  '--no-sandbox',
  '--allow-all-tools',
  '--no-ask-user',
]);

const STRIPPED_PRESET_FLAGS = new Set([
  '--auto-approve',
  '--dangerously-skip-permissions',
  '--allow-all-tools',
  '--no-ask-user',
]);

/**
 * Enforces cloud/tenant-safe runner preset policies:
 * - Blocks unattended HITL bypass flags in operator extra arguments when tenantIsolated=true.
 * - Strips `--auto-approve` / unattended bypass flags from preset `head()` unless explicitly opted in.
 */
export function assertRunnerPresetPolicy(input: RunnerPolicyInput): Preset {
  const tenantIsolated = input.tenantIsolated ?? true;
  const extra = input.extraArgs ?? [];

  if (tenantIsolated) {
    for (const arg of extra) {
      const normalized = arg.trim().toLowerCase();
      if (UNSAFE_EXTRA_FLAGS.has(normalized)) {
        throw new RunnerPolicyError(
          `Blocked unattended bypass runner argument '${arg}' under enterprise HITL policy.`,
        );
      }
    }
    if (!input.allowUnsafeAutoApprove) {
      const origHead = input.preset.head;
      return {
        ...input.preset,
        head: (sessionId) =>
          origHead(sessionId).filter((flag) => !STRIPPED_PRESET_FLAGS.has(flag)),
      };
    }
  }

  return input.preset;
}

export function resolveGovernedPreset(
  name: PresetName,
  options?: Omit<RunnerPolicyInput, 'preset'>,
): Preset {
  return assertRunnerPresetPolicy({
    preset: PRESETS[name],
    ...options,
  });
}
