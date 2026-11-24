import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { isPrivateIp } from '@repo/net';
import { HttpError } from '#shared/lib';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata',
  '169.254.169.254',
  '100.100.100.200',
  '::1',
  '0.0.0.0',
]);

const BLOCKED_SUFFIXES = ['.local', '.localhost', '.internal', '.lan', '.home.arpa'];

export class OutboundMcpSsrfError extends HttpError {
  constructor(message: string) {
    super(400, message, 'MCP_SSRF_BLOCKED');
  }
}

export function isBlockedHostnameOrLiteralIp(rawHostname: string): boolean {
  const hostname = rawHostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!hostname) return true;
  if (BLOCKED_HOSTNAMES.has(hostname)) return true;
  if (BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) return true;
  if (hostname === '169.254.169.254') return true;
  if (isIP(hostname) !== 0 && isPrivateIp(hostname)) return true;
  return false;
}

/**
 * Validates outbound MCP server URL syntax synchronously against HTTPS requirement,
 * credential smuggling in URL userinfo, localhost/internal suffixes, and private IP literals.
 */
export function assertOutboundMcpUrlSyntax(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new OutboundMcpSsrfError('Invalid MCP endpoint URL.');
  }

  if (parsed.protocol !== 'https:') {
    throw new OutboundMcpSsrfError('Outbound MCP endpoint must use https://.');
  }
  if (parsed.username || parsed.password) {
    throw new OutboundMcpSsrfError('MCP endpoint URL must not embed credentials.');
  }
  if (isBlockedHostnameOrLiteralIp(parsed.hostname)) {
    throw new OutboundMcpSsrfError(
      `Blocked private or internal MCP endpoint host: ${parsed.hostname}`,
    );
  }
  return parsed;
}

/**
 * Full async SSRF guard: validates URL syntax and resolves DNS records to ensure
 * every A/AAAA target routes exclusively to public Internet address space.
 */
export async function validateOutboundMcpUrl(rawUrl: string): Promise<URL> {
  const parsed = assertOutboundMcpUrlSyntax(rawUrl);
  const cleanHost = parsed.hostname.replace(/^\[|\]$/g, '');
  if (isIP(cleanHost) !== 0) {
    if (isPrivateIp(cleanHost)) {
      throw new OutboundMcpSsrfError(`Blocked private IP MCP host: ${cleanHost}`);
    }
    return parsed;
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(cleanHost, { all: true });
  } catch {
    throw new OutboundMcpSsrfError(`Unable to resolve MCP endpoint host: ${cleanHost}`);
  }
  if (addresses.length === 0) {
    throw new OutboundMcpSsrfError(`MCP endpoint host resolved zero addresses: ${cleanHost}`);
  }
  for (const record of addresses) {
    if (isPrivateIp(record.address)) {
      throw new OutboundMcpSsrfError(
        `Blocked MCP host resolving to private address ${record.address}`,
      );
    }
  }
  return parsed;
}
