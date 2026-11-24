import { describe, expect, it } from 'bun:test';
import {
  assertOutboundMcpUrlSyntax,
  isBlockedHostnameOrLiteralIp,
  OutboundMcpSsrfError,
} from '../ssrf-guard';

describe('outbound MCP SSRF guard', () => {
  it('allows valid public HTTPS endpoints without credentials', () => {
    const parsed = assertOutboundMcpUrlSyntax('https://mcp.example.com/sse');
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe('mcp.example.com');
    expect(isBlockedHostnameOrLiteralIp('mcp.example.com')).toBe(false);
  });

  it('rejects non-HTTPS, metadata IPs, loopback, RFC1918, .internal, and userinfo URLs', () => {
    const blockedUrls = [
      'http://mcp.example.com/mcp',
      'https://169.254.169.254/latest/meta-data/',
      'http://169.254.169.254/latest/meta-data/',
      'https://127.0.0.1:8080/mcp',
      'https://localhost:3000/mcp',
      'https://10.0.0.12/mcp',
      'https://172.16.4.2/mcp',
      'https://192.168.1.50/mcp',
      'https://service.internal/mcp',
      'https://db.local/mcp',
      'https://user:secret@mcp.example.com/mcp',
      'javascript:alert(1)',
    ];
    for (const bad of blockedUrls) {
      expect(() => assertOutboundMcpUrlSyntax(bad)).toThrow(OutboundMcpSsrfError);
    }
  });
});
