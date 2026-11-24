import { createTool } from '@mastra/core/tools';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { z } from 'zod';
import { loadEnabledAgentMcpConfigs, type DecryptedAgentMcpConfig } from '#modules/mcp-client/service';
import { validateOutboundMcpUrl } from '#modules/mcp-client/ssrf-guard';

const MCP_CALL_TIMEOUT_MS = 15_000;
const MAX_EXTERNAL_TOOLS_PER_CONNECTION = 30;

async function connectMcpClient(cfg: DecryptedAgentMcpConfig): Promise<Client> {
  const url = await validateOutboundMcpUrl(cfg.endpointUrl);
  const client = new Client({ name: 'itsaplan-agent-runtime', version: '1.0.0' });
  const headers = Object.keys(cfg.headers).length > 0 ? cfg.headers : undefined;
  const transport =
    cfg.transport === 'sse'
      ? new SSEClientTransport(url, headers ? { requestInit: { headers } } : undefined)
      : new StreamableHTTPClientTransport(url, headers ? { requestInit: { headers } } : undefined);

  await Promise.race([
    client.connect(transport),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('MCP connection timeout')), MCP_CALL_TIMEOUT_MS),
    ),
  ]);
  return client;
}

function sanitizeToolId(connectionName: string, toolName: string): string {
  const prefix = connectionName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const cleanTool = toolName.replace(/[^a-zA-Z0-9_]+/g, '_');
  return `mcp_${prefix || 'ext'}_${cleanTool}`.slice(0, 64);
}

/**
 * Discovers and adapts outbound team MCP tools for an internal agent runtime.
 * Every connection URL is re-validated via the SSRF guard prior to handshake and invocation.
 */
export async function buildOutboundMcpTools(
  agentId: number,
  teamId: number,
): Promise<Record<string, ReturnType<typeof createTool>>> {
  const configs = await loadEnabledAgentMcpConfigs(agentId, teamId);
  if (configs.length === 0) return {};

  const assembled: Record<string, ReturnType<typeof createTool>> = {};

  for (const cfg of configs) {
    let client: Client | null = null;
    try {
      client = await connectMcpClient(cfg);
      const listed = await client.listTools();
      const allowSet =
        cfg.allowedTools.length > 0 ? new Set(cfg.allowedTools) : null;
      const tools = (listed.tools ?? [])
        .filter((tool) => !allowSet || allowSet.has(tool.name))
        .slice(0, MAX_EXTERNAL_TOOLS_PER_CONNECTION);

      for (const remoteTool of tools) {
        const id = sanitizeToolId(cfg.name, remoteTool.name);
        assembled[id] = createTool({
          id,
          description:
            remoteTool.description ??
            `External MCP tool '${remoteTool.name}' from connection '${cfg.name}'.`,
          inputSchema: z.record(z.string(), z.unknown()),
          execute: async (input) => {
            let execClient: Client | null = null;
            try {
              execClient = await connectMcpClient(cfg);
              const result = await Promise.race([
                execClient.callTool({
                  name: remoteTool.name,
                  arguments: (input && typeof input === 'object' ? input : {}) as Record<
                    string,
                    unknown
                  >,
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(
                    () => reject(new Error('Outbound MCP tool call timed out')),
                    MCP_CALL_TIMEOUT_MS,
                  ),
                ),
              ]);
              return result;
            } catch (err) {
              return {
                error: err instanceof Error ? err.message : 'Outbound MCP call failed',
              };
            } finally {
              await execClient?.close().catch(() => {});
            }
          },
        });
      }
    } catch {
      // Failing closed for one unreachable external MCP server must not break built-in agent tools.
    } finally {
      await client?.close().catch(() => {});
    }
  }

  return assembled;
}
