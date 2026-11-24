import { db, aiAgent, teamRole, defaultMemberPermissions } from '@repo/db';
import { and, eq, inArray } from 'drizzle-orm';
import { listAllCredentials, createCredential, updateCredential } from '../src/modules/agents/integrations/service';
import { getAgentById, getInternalAgentApiKey } from '../src/modules/agents/core/service';
import { ensureMemoryStoreInitialized } from '../src/modules/agents/core/runtime/memory';
import { assertLoopbackGatewayUrl } from '../src/modules/agents/core/runtime/tools/sovereign-harness';

const TEAM_ID = 1;
const GATEWAY_CRED_LABEL = 'Agentic OS LLMProviderRouter Gateway';
const CANONICAL_AGENTS = [
  'antigravity',
  'research',
  'orchestrator',
  'qualitygate',
  'claude',
  'codex',
] as const;

async function main() {
  const rawGatewayUrl = process.env.ITSAPLAN_LLM_GATEWAY_URL || 'http://127.0.0.1:18766';
  const gatewayRoot = assertLoopbackGatewayUrl(rawGatewayUrl);
  const gatewayBaseUrl = gatewayRoot.endsWith('/v1') ? gatewayRoot : `${gatewayRoot}/v1`;
  const token = (process.env.ITSAPLAN_LLM_GATEWAY_TOKEN || '').trim();
  if (!token) {
    throw new Error('ITSAPLAN_LLM_GATEWAY_TOKEN is required to provision gateway credentials.');
  }

  await ensureMemoryStoreInitialized();

  const [memberRole] = await db
    .select({ id: teamRole.id, permissions: teamRole.permissions })
    .from(teamRole)
    .where(and(eq(teamRole.teamId, TEAM_ID), eq(teamRole.name, 'Member')))
    .limit(1);

  let memberRoleRepaired = false;
  if (memberRole) {
    const perms = (memberRole.permissions ?? {}) as Record<string, Record<string, boolean> | undefined>;
    if (perms.work_items?.read !== true) {
      await db
        .update(teamRole)
        .set({ permissions: defaultMemberPermissions() })
        .where(eq(teamRole.id, memberRole.id));
      memberRoleRepaired = true;
    }
  }

  const existingCreds = await listAllCredentials(TEAM_ID);
  const matchedCred = existingCreds.find(
    (c) => c.integrationKey === 'openai-compatible' && c.label === GATEWAY_CRED_LABEL,
  );
  const cred = matchedCred
    ? await updateCredential(matchedCred.id, TEAM_ID, {
        label: GATEWAY_CRED_LABEL,
        credential: { apiKey: token, baseUrl: gatewayBaseUrl },
      })
    : await createCredential(TEAM_ID, {
        integrationKey: 'openai-compatible',
        label: GATEWAY_CRED_LABEL,
        credential: { apiKey: token, baseUrl: gatewayBaseUrl },
      });

  if (!cred) {
    throw new Error('Failed to create or update openai-compatible gateway credential.');
  }

  const rows = await db
    .select({ id: aiAgent.id, username: aiAgent.username })
    .from(aiAgent)
    .where(inArray(aiAgent.username, [...CANONICAL_AGENTS]));

  const updatedAgents: Array<{ id: number; username: string; model: string; keyProvisioned: boolean }> = [];
  for (const r of rows) {
    if (!CANONICAL_AGENTS.includes(r.username as (typeof CANONICAL_AGENTS)[number])) continue;
    const modelId = `agentic-os/${r.username}`;
    await db
      .update(aiAgent)
      .set({
        kind: 'internal',
        modelCredentialId: cred.id,
        model: modelId,
        maxSteps: 16,
        memoryEnabled: true,
        memoryLastMessages: 24,
      })
      .where(eq(aiAgent.id, r.id));

    const agentRow = await getAgentById(r.id, TEAM_ID);
    let keyProvisioned = false;
    if (agentRow) {
      const key = await getInternalAgentApiKey(agentRow);
      keyProvisioned = Boolean(key);
    }
    updatedAgents.push({
      id: r.id,
      username: r.username,
      model: modelId,
      keyProvisioned,
    });
  }

  console.log(
    JSON.stringify(
      {
        status: 'OK',
        teamId: TEAM_ID,
        credentialId: cred.id,
        gatewayBaseUrl,
        memoryStoreInitialized: true,
        memberRoleRepaired,
        agentsProvisioned: updatedAgents,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
