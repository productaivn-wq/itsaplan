import { db, agentChatUsage, agentUsageLedger, teamBudgetPolicy } from '@repo/db';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';

export interface ModelRateMicrosPerMillion {
  inputMicrosPerMillion: number;
  outputMicrosPerMillion: number;
}

const MODEL_RATE_TABLE: Array<[RegExp, ModelRateMicrosPerMillion]> = [
  [/flash|gemini-2\.5-flash|gemini-2\.0-flash/i, { inputMicrosPerMillion: 150_000, outputMicrosPerMillion: 600_000 }],
  [/gemini-2\.5-pro|gemini-pro/i, { inputMicrosPerMillion: 1_250_000, outputMicrosPerMillion: 10_000_000 }],
  [/gpt-5-mini|gpt-4o-mini|haiku/i, { inputMicrosPerMillion: 250_000, outputMicrosPerMillion: 1_250_000 }],
  [/opus|claude-opus/i, { inputMicrosPerMillion: 15_000_000, outputMicrosPerMillion: 75_000_000 }],
  [/gpt-5|gpt-4o|sonnet|claude-sonnet/i, { inputMicrosPerMillion: 3_000_000, outputMicrosPerMillion: 15_000_000 }],
];

const DEFAULT_MODEL_RATE: ModelRateMicrosPerMillion = {
  inputMicrosPerMillion: 1_000_000,
  outputMicrosPerMillion: 4_000_000,
};

export function resolveModelRates(model: string): ModelRateMicrosPerMillion {
  for (const [pattern, rate] of MODEL_RATE_TABLE) {
    if (pattern.test(model)) return rate;
  }
  return DEFAULT_MODEL_RATE;
}

export function estimateCostUsdMicros(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const safeIn = Math.max(0, Number.isFinite(inputTokens) ? inputTokens : 0);
  const safeOut = Math.max(0, Number.isFinite(outputTokens) ? outputTokens : 0);
  const { inputMicrosPerMillion, outputMicrosPerMillion } = resolveModelRates(model);
  return Math.round(
    (safeIn * inputMicrosPerMillion + safeOut * outputMicrosPerMillion) / 1_000_000,
  );
}

export interface BudgetAllowanceResult {
  allowed: boolean;
  spentMicros: number;
  capMicros: number;
  spentTokens: number;
  tokenCap: number;
  utilizationPct: number;
  softAlertTriggered: boolean;
  hardStopped: boolean;
  reason?: string;
}

export function checkTeamBudgetAllowance(
  spentMicros: number,
  capMicros: number,
  hardStopEnabled: boolean,
  spentTokens = 0,
  tokenCap = 0,
  softAlertPct = 80,
): BudgetAllowanceResult {
  const usdRatio = capMicros > 0 ? (spentMicros / capMicros) * 100 : 0;
  const tokRatio = tokenCap > 0 ? (spentTokens / tokenCap) * 100 : 0;
  const utilizationPct = Number(Math.max(usdRatio, tokRatio).toFixed(2));
  const softAlertTriggered =
    (capMicros > 0 || tokenCap > 0) && utilizationPct >= Math.max(1, softAlertPct);
  const overCap =
    (capMicros > 0 && spentMicros >= capMicros) || (tokenCap > 0 && spentTokens >= tokenCap);
  const hardStopped = Boolean(hardStopEnabled && overCap);

  return {
    allowed: !hardStopped,
    spentMicros,
    capMicros,
    spentTokens,
    tokenCap,
    utilizationPct,
    softAlertTriggered,
    hardStopped,
    ...(hardStopped
      ? {
          reason:
            capMicros > 0 && spentMicros >= capMicros
              ? 'Team monthly USD budget ceiling reached'
              : 'Team monthly token budget reached',
        }
      : {}),
  };
}

export interface UsageLedgerEntryInput {
  teamId: number;
  projectId?: number | null;
  agentId: number;
  threadId?: string | null;
  userId?: string | null;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsdMicros?: number;
}

export async function appendUsageLedger(entry: UsageLedgerEntryInput): Promise<void> {
  const costUsdMicros =
    entry.costUsdMicros ?? estimateCostUsdMicros(entry.model, entry.inputTokens, entry.outputTokens);
  await db.insert(agentUsageLedger).values({
    teamId: entry.teamId,
    projectId: entry.projectId ?? null,
    agentId: entry.agentId,
    threadId: entry.threadId ?? null,
    userId: entry.userId ?? null,
    provider: entry.provider,
    model: entry.model,
    inputTokens: Math.max(0, entry.inputTokens),
    outputTokens: Math.max(0, entry.outputTokens),
    costUsdMicros: Math.max(0, costUsdMicros),
  });
}

export async function evaluateTeamBudget(teamId: number): Promise<BudgetAllowanceResult> {
  const [policy] = await db
    .select()
    .from(teamBudgetPolicy)
    .where(eq(teamBudgetPolicy.teamId, teamId))
    .limit(1);

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [totals] = await db
    .select({
      spentMicros: sql<number>`coalesce(sum(${agentUsageLedger.costUsdMicros}), 0)::bigint`,
      spentTokens: sql<number>`coalesce(sum(${agentUsageLedger.inputTokens} + ${agentUsageLedger.outputTokens}), 0)::bigint`,
    })
    .from(agentUsageLedger)
    .where(and(eq(agentUsageLedger.teamId, teamId), gte(agentUsageLedger.createdAt, monthStart)));

  const spentMicros = Number(totals?.spentMicros ?? 0);
  const spentTokens = Number(totals?.spentTokens ?? 0);
  if (!policy) {
    return checkTeamBudgetAllowance(spentMicros, 0, false, spentTokens, 0);
  }
  return checkTeamBudgetAllowance(
    spentMicros,
    Number(policy.monthlyUsdCeilingMicros ?? 0),
    policy.hardStopEnabled,
    spentTokens,
    Number(policy.monthlyTokenBudget ?? 0),
    policy.softAlertPct,
  );
}

// The context size of a chat thread (see the agent_chat_usage comment in the schema).
// Both kinds of agent report it — an external one through its runner, an internal one
// from the model call itself. It answers how close the conversation is to the agent's
// context limit, so it is measured on the last model call of an answer, not summed over
// the calls the answer took.

// The counts of one model call, normalised: everything that call read, cache included,
// and everything it wrote.
export interface ContextUsage {
  inputTokens: number;
  outputTokens: number;
}

// Records the counts of a completed answer, replacing the thread's previous ones. Null
// is an agent that reports nothing a context size can be read from, which is a fact
// about the agent and is shown as a dash.
export async function recordContextUsage(
  threadId: string,
  agentId: number,
  usage: ContextUsage | null,
): Promise<void> {
  const counts = {
    inputTokens: usage?.inputTokens ?? null,
    outputTokens: usage?.outputTokens ?? null,
  };
  await db
    .insert(agentChatUsage)
    .values({ threadId, agentId, ...counts })
    .onConflictDoUpdate({
      target: agentChatUsage.threadId,
      set: { ...counts, updatedAt: new Date() },
    });
}

// The context size of each of the given threads. A thread with no completed answer is
// absent from the map; one whose agent reports no usable counts maps to null.
export async function readContextSizes(threadIds: string[]): Promise<Map<string, number | null>> {
  const sizes = new Map<string, number | null>();
  if (threadIds.length === 0) return sizes;
  const rows = await db
    .select()
    .from(agentChatUsage)
    .where(inArray(agentChatUsage.threadId, threadIds));
  for (const row of rows) {
    const read = row.inputTokens;
    sizes.set(row.threadId, read == null ? null : read + (row.outputTokens ?? 0));
  }
  return sizes;
}

// The size as a thread DTO carries it. A thread absent from the map leaves the field
// out, which is what tells "no answer yet" apart from "no counts to report".
export function contextField(
  sizes: Map<string, number | null>,
  threadId: string,
): { contextTokens?: number | null } {
  return sizes.has(threadId) ? { contextTokens: sizes.get(threadId) } : {};
}

// The row has no foreign key to the thread, so deleting the thread has to take it along.
export async function deleteContextUsage(threadId: string): Promise<void> {
  await db.delete(agentChatUsage).where(eq(agentChatUsage.threadId, threadId));
}
