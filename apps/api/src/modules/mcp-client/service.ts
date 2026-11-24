import { db, mcpServerConnection, agentMcpLink, aiAgent } from '@repo/db';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { encryptSecret, decryptSecret, type EncryptedSecret } from '@repo/crypto';
import { HttpError, iso } from '#shared/lib';
import { validateOutboundMcpUrl } from './ssrf-guard';

export type McpTransportKind = 'streamable-http' | 'sse';

export interface McpConnectionRow {
  id: number;
  teamId: number;
  name: string;
  transport: McpTransportKind;
  endpointUrl: string;
  hasHeaders: boolean;
  enabled: boolean;
  allowedTools: string[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMcpLinkRow {
  agentId: number;
  connectionId: number;
  connectionName: string;
  endpointUrl: string;
  transport: McpTransportKind;
  connectionEnabled: boolean;
  enabledTools: string[];
}

export interface DecryptedAgentMcpConfig {
  connectionId: number;
  name: string;
  transport: McpTransportKind;
  endpointUrl: string;
  headers: Record<string, string>;
  allowedTools: string[];
}

function mapConnection(row: typeof mcpServerConnection.$inferSelect): McpConnectionRow {
  return {
    id: row.id,
    teamId: row.teamId,
    name: row.name,
    transport: (row.transport === 'sse' ? 'sse' : 'streamable-http') as McpTransportKind,
    endpointUrl: row.endpointUrl,
    hasHeaders: Boolean(row.encryptedHeaders),
    enabled: row.enabled,
    allowedTools: Array.isArray(row.allowedTools) ? row.allowedTools : [],
    createdBy: row.createdBy,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function serializeHeaders(headers?: Record<string, string> | null): string | null {
  if (!headers || Object.keys(headers).length === 0) return null;
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    const key = k.trim();
    if (key && typeof v === 'string') clean[key] = v;
  }
  if (Object.keys(clean).length === 0) return null;
  return JSON.stringify(encryptSecret(JSON.stringify(clean)));
}

function parseEncryptedHeaders(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const envelope = JSON.parse(raw) as EncryptedSecret;
    const decrypted = JSON.parse(decryptSecret(envelope)) as Record<string, string>;
    return decrypted && typeof decrypted === 'object' ? decrypted : {};
  } catch {
    return {};
  }
}

export async function listTeamMcpConnections(teamId: number): Promise<McpConnectionRow[]> {
  const rows = await db
    .select()
    .from(mcpServerConnection)
    .where(eq(mcpServerConnection.teamId, teamId))
    .orderBy(asc(mcpServerConnection.name));
  return rows.map(mapConnection);
}

export interface CreateMcpConnectionInput {
  name: string;
  transport?: McpTransportKind;
  endpointUrl: string;
  headers?: Record<string, string>;
  enabled?: boolean;
  allowedTools?: string[];
}

export async function createMcpConnection(
  teamId: number,
  userId: string,
  input: CreateMcpConnectionInput,
): Promise<McpConnectionRow> {
  const validated = await validateOutboundMcpUrl(input.endpointUrl);
  const [created] = await db
    .insert(mcpServerConnection)
    .values({
      teamId,
      name: input.name.trim(),
      transport: input.transport ?? 'streamable-http',
      endpointUrl: validated.toString(),
      encryptedHeaders: serializeHeaders(input.headers),
      enabled: input.enabled ?? true,
      allowedTools: input.allowedTools ?? [],
      createdBy: userId,
    })
    .returning();
  return mapConnection(created);
}

export interface UpdateMcpConnectionInput {
  name?: string;
  transport?: McpTransportKind;
  endpointUrl?: string;
  headers?: Record<string, string> | null;
  enabled?: boolean;
  allowedTools?: string[];
}

export async function updateMcpConnection(
  teamId: number,
  connectionId: number,
  patch: UpdateMcpConnectionInput,
): Promise<McpConnectionRow | null> {
  const [existing] = await db
    .select()
    .from(mcpServerConnection)
    .where(
      and(eq(mcpServerConnection.id, connectionId), eq(mcpServerConnection.teamId, teamId)),
    )
    .limit(1);
  if (!existing) return null;

  const set: Partial<typeof mcpServerConnection.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.name !== undefined) set.name = patch.name.trim();
  if (patch.transport !== undefined) set.transport = patch.transport;
  if (patch.endpointUrl !== undefined) {
    const validated = await validateOutboundMcpUrl(patch.endpointUrl);
    set.endpointUrl = validated.toString();
  }
  if (patch.headers !== undefined) {
    set.encryptedHeaders = serializeHeaders(patch.headers);
  }
  if (patch.enabled !== undefined) set.enabled = patch.enabled;
  if (patch.allowedTools !== undefined) set.allowedTools = patch.allowedTools;

  const [updated] = await db
    .update(mcpServerConnection)
    .set(set)
    .where(eq(mcpServerConnection.id, existing.id))
    .returning();
  return updated ? mapConnection(updated) : null;
}

export async function deleteMcpConnection(
  teamId: number,
  connectionId: number,
): Promise<boolean> {
  const deleted = await db
    .delete(mcpServerConnection)
    .where(
      and(eq(mcpServerConnection.id, connectionId), eq(mcpServerConnection.teamId, teamId)),
    )
    .returning({ id: mcpServerConnection.id });
  return deleted.length > 0;
}

export async function listAgentMcpLinks(
  teamId: number,
  agentId: number,
): Promise<AgentMcpLinkRow[]> {
  const rows = await db
    .select({
      agentId: agentMcpLink.agentId,
      connectionId: agentMcpLink.connectionId,
      connectionName: mcpServerConnection.name,
      endpointUrl: mcpServerConnection.endpointUrl,
      transport: mcpServerConnection.transport,
      connectionEnabled: mcpServerConnection.enabled,
      enabledTools: agentMcpLink.enabledTools,
    })
    .from(agentMcpLink)
    .innerJoin(
      mcpServerConnection,
      eq(mcpServerConnection.id, agentMcpLink.connectionId),
    )
    .where(and(eq(agentMcpLink.agentId, agentId), eq(mcpServerConnection.teamId, teamId)))
    .orderBy(asc(mcpServerConnection.name));

  return rows.map((r) => ({
    agentId: r.agentId,
    connectionId: r.connectionId,
    connectionName: r.connectionName,
    endpointUrl: r.endpointUrl,
    transport: (r.transport === 'sse' ? 'sse' : 'streamable-http') as McpTransportKind,
    connectionEnabled: r.connectionEnabled,
    enabledTools: Array.isArray(r.enabledTools) ? r.enabledTools : [],
  }));
}

export async function setAgentMcpLinks(
  teamId: number,
  agentId: number,
  links: Array<{ connectionId: number; enabledTools?: string[] }>,
): Promise<AgentMcpLinkRow[]> {
  const [agentRow] = await db
    .select({ id: aiAgent.id })
    .from(aiAgent)
    .where(and(eq(aiAgent.id, agentId), eq(aiAgent.teamId, teamId)))
    .limit(1);
  if (!agentRow) throw new HttpError(404, 'Agent not found');

  const ids = [...new Set(links.map((l) => l.connectionId))];
  if (ids.length > 0) {
    const valid = await db
      .select({ id: mcpServerConnection.id })
      .from(mcpServerConnection)
      .where(
        and(eq(mcpServerConnection.teamId, teamId), inArray(mcpServerConnection.id, ids)),
      );
    const validIds = new Set(valid.map((v) => v.id));
    for (const id of ids) {
      if (!validIds.has(id)) {
        throw new HttpError(400, `MCP connection ${id} does not belong to this team`);
      }
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(agentMcpLink).where(eq(agentMcpLink.agentId, agentId));
    if (links.length > 0) {
      const dedup = new Map<number, string[]>();
      for (const link of links) {
        dedup.set(link.connectionId, link.enabledTools ?? []);
      }
      await tx.insert(agentMcpLink).values(
        [...dedup.entries()].map(([connectionId, enabledTools]) => ({
          agentId,
          connectionId,
          enabledTools,
        })),
      );
    }
  });

  return listAgentMcpLinks(teamId, agentId);
}

export async function loadEnabledAgentMcpConfigs(
  agentId: number,
  teamId: number,
): Promise<DecryptedAgentMcpConfig[]> {
  const rows = await db
    .select({
      connectionId: mcpServerConnection.id,
      name: mcpServerConnection.name,
      transport: mcpServerConnection.transport,
      endpointUrl: mcpServerConnection.endpointUrl,
      encryptedHeaders: mcpServerConnection.encryptedHeaders,
      connectionAllowed: mcpServerConnection.allowedTools,
      linkEnabled: agentMcpLink.enabledTools,
    })
    .from(agentMcpLink)
    .innerJoin(
      mcpServerConnection,
      eq(mcpServerConnection.id, agentMcpLink.connectionId),
    )
    .where(
      and(
        eq(agentMcpLink.agentId, agentId),
        eq(mcpServerConnection.teamId, teamId),
        eq(mcpServerConnection.enabled, true),
      ),
    );

  return rows.map((row) => {
    const linkTools = Array.isArray(row.linkEnabled) ? row.linkEnabled : [];
    const connTools = Array.isArray(row.connectionAllowed) ? row.connectionAllowed : [];
    const allowedTools = linkTools.length > 0 ? linkTools : connTools;
    return {
      connectionId: row.connectionId,
      name: row.name,
      transport: (row.transport === 'sse' ? 'sse' : 'streamable-http') as McpTransportKind,
      endpointUrl: row.endpointUrl,
      headers: parseEncryptedHeaders(row.encryptedHeaders),
      allowedTools,
    };
  });
}
