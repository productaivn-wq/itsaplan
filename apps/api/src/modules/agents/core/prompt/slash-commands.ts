export type SlashCommandName = 'plan' | 'compact' | 'goal' | 'review';

export interface ResolvedSlashCommand {
  command: SlashCommandName | null;
  args: string;
  systemPreamble: string;
  enrichedPrompt: string;
}

const SLASH_DIRECTIVES: Record<
  SlashCommandName,
  {
    banner: string;
    systemPreamble: string;
  }
> = {
  plan: {
    banner:
      'Execute in structured /plan mode: analyze project state read-only first using your tools, resolve the applicable 7-phase SOP, design a numbered plan with priorities, dependencies, Kahn waves, and DoD verification steps, emit a markdown plan artifact, and request approval before mutating project data.',
    systemPreamble: [
      '## Active Mode: /plan (Architecture & 7-Phase Delivery Planning)',
      'The requester invoked `/plan`. Follow this protocol strictly:',
      '1. Perform real read-only inspection first using your tools (`get_project`, `list_issues`, `task_manager_query_tasks`, `sop_list_and_resolve`, `search_project_knowledge`). NEVER fabricate or print unexecuted SQL blocks.',
      '2. Resolve the applicable 7-phase SOP (`SOP-GENERIC-7P`, `SOP-CODING-01`, `SOP-STRATEGY-01`, etc.) via `sop_list_and_resolve` and structure the plan across phases (`P1..P7`) with priorities, Kahn wave dependencies, owners/risks, and numbered Definition of Done (`DoD-1..N`) verification steps.',
      '3. Emit a structured markdown artifact via `emit_artifact` (`kind: "markdown"`) summarizing the complete plan.',
      '4. Do NOT mutate issues or dispatch tasks directly before calling `request_human_approval` (`toolName: "plan_proposal"`).',
      '',
      '',
    ].join('\n'),
  },
  compact: {
    banner:
      'Execute in /compact mode: synthesize a concise (<400 words) executive handoff covering Goals, Decisions Made, Completed Work, Open Blockers, and Next Actions.',
    systemPreamble: [
      '## Active Mode: /compact (Executive State Distillation)',
      'The requester invoked `/compact`. Compress the active context into <400 words using exactly these sections:',
      '- **Goals**',
      '- **Decisions Made**',
      '- **Completed Work**',
      '- **Open Blockers**',
      '- **Next Actions**',
      'Avoid filler; preserve concrete issue keys, dates, metrics, and owners.',
      '',
      '',
    ].join('\n'),
  },
  goal: {
    banner:
      'Execute in /goal mode: define measurable OKRs, numbered Definition of Done (DoD-1..N), key milestones, and explicit risks.',
    systemPreamble: [
      '## Active Mode: /goal (Measurable Outcomes & DoD Framing)',
      'The requester invoked `/goal`. Structure your response with:',
      '1. **Objective & Key Results (OKRs)** with quantifiable target thresholds.',
      '2. **Numbered Definition of Done (`DoD-1`..`DoD-N`)** with objective verification checks.',
      '3. **Milestones & Top Risks** with concrete mitigations.',
      '',
      '',
    ].join('\n'),
  },
  review: {
    banner:
      'Execute in /review mode: perform an adversarial P0/P1/P2 audit of recent work, open risks, and deliverables with concrete fixes.',
    systemPreamble: [
      '## Active Mode: /review (Adversarial Quality & Risk Audit)',
      'The requester invoked `/review`. Audit the relevant project items, specs, diffs, or deliverables and classify findings strictly by severity (`P0 Critical`, `P1 High`, `P2 Medium`) with concrete remediation steps.',
      '',
      '',
    ].join('\n'),
  },
};

const SLASH_PATTERN = /^\/(plan|compact|goal|review)(?:\s+([\s\S]*))?$/i;

export function resolveSlashCommand(prompt: string): ResolvedSlashCommand {
  const trimmed = prompt.trim();
  const match = SLASH_PATTERN.exec(trimmed);
  if (!match) {
    return {
      command: null,
      args: trimmed,
      systemPreamble: '',
      enrichedPrompt: prompt,
    };
  }
  const command = match[1].toLowerCase() as SlashCommandName;
  const args = (match[2] ?? '').trim();
  const directive = SLASH_DIRECTIVES[command];
  const enrichedPrompt = `[Mode: /${command} — ${directive.banner}]\n\n${args || prompt}`;
  return {
    command,
    args,
    systemPreamble: directive.systemPreamble,
    enrichedPrompt,
  };
}
