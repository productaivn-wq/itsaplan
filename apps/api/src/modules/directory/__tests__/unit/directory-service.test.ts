import { describe, expect, it } from 'bun:test';
import {
  assertNoPlaintextSecret,
  normalizeChannelId,
  normalizeExternalKey,
  normalizeLocationId,
} from '../../service';

describe('directory service helpers', () => {
  it('blocks plaintext tokens and API keys in directory payloads', () => {
    expect(() =>
      assertNoPlaintextSecret({ name: 'Alice', notes: 'sk-proj-1234567890abcdef' }),
    ).toThrow(/Plaintext secret/i);
    expect(() =>
      assertNoPlaintextSecret({ targetId: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' }),
    ).toThrow(/Plaintext secret/i);
    expect(() =>
      assertNoPlaintextSecret({
        primaryEmail: 'vault://itsaplan/CONTACTS_REGISTRY_JSON#CON-001.primary_email',
        uriOrPath: '~/workspace',
      }),
    ).not.toThrow();
  });

  it('normalizes deterministic external keys, channel IDs, and location IDs', () => {
    expect(normalizeExternalKey('Project Owner')).toBe('CON-PROJECT-OWNER');
    expect(normalizeExternalKey('Project Owner', 'CON-CUSTOM')).toBe('CON-CUSTOM');
    expect(normalizeChannelId('zalo', 'Nhóm Dự Án Alpha')).toBe('zalo-nhom-du-an-alpha');
    expect(normalizeLocationId('google_drive', 'Shared Specs')).toBe('google-drive-shared-specs');
  });
});
