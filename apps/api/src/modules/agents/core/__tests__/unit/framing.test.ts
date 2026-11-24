import { describe, it, expect } from 'bun:test';
import {
  multiProjectDirectoryPreamble,
  projectDirectoryPreamble,
  projectPreamble,
} from '../../prompt/framing';
import { PROJECT_DESCRIPTION_LIMIT } from '#modules/projects/model';

describe('projectPreamble', () => {
  it('adds the description as its own paragraph', () => {
    const text = projectPreamble({ key: 'MKT', name: 'Marketing', description: 'Growth work' });
    expect(text).toContain('\n\nGrowth work\n');
  });

  it('adds nothing when the description is empty', () => {
    const text = projectPreamble({ key: 'MKT', name: 'Marketing', description: '  ' });
    expect(text.endsWith('-123.\n\n')).toBe(true);
  });

  it('cuts a description longer than the limit', () => {
    const description = 'x'.repeat(PROJECT_DESCRIPTION_LIMIT + 100);
    const text = projectPreamble({ key: 'MKT', name: 'Marketing', description });
    expect(text).toContain('x'.repeat(PROJECT_DESCRIPTION_LIMIT));
    expect(text).not.toContain('x'.repeat(PROJECT_DESCRIPTION_LIMIT + 1));
  });
});

describe('projectDirectoryPreamble', () => {
  it('returns empty string when all directory collections are empty', () => {
    expect(
      projectDirectoryPreamble({ contacts: [], channels: [], storageLocations: [] }),
    ).toBe('');
    expect(projectDirectoryPreamble(null)).toBe('');
  });

  it('formats storing locations, groups/channels, and contacts with vault pointers', () => {
    const text = projectDirectoryPreamble({
      storageLocations: [
        {
          kind: 'local_folder',
          label: 'Workspace Root',
          uriOrPath: '~/workspace',
          accessScope: 'read_write',
          isPrimary: true,
          description: 'Specs and deliverables',
        },
      ],
      channels: [
        {
          platform: 'zalo',
          threadType: 'GROUP',
          displayName: 'Nhóm Marketing',
          targetId: 'zalo-grp-1',
          aliases: ['MKT Ops'],
          status: 'ACTIVE',
        },
      ],
      contacts: [
        {
          name: 'Project Owner',
          role: 'Sponsor',
          raciRole: 'ACCOUNTABLE',
          primaryEmail: 'vault://itsaplan/CONTACTS_REGISTRY_JSON#CON-001.primary_email',
          phone: '',
          channelHandles: { telegram: { direct: '@thanb' } },
        },
      ],
    });

    expect(text).toContain('## Project Directory & Information Sources');
    expect(text).toContain('[PRIMARY] [local_folder | read_write] Workspace Root');
    expect(text).toContain('[GROUP] Nhóm Marketing (zalo, ACTIVE)');
    expect(text).toContain('Project Owner [ACCOUNTABLE] — Sponsor');
    expect(text).toContain('vault://itsaplan/CONTACTS_REGISTRY_JSON#CON-001.primary_email');
    expect(text).toContain('telegram: @thanb');
  });

  it('summarizes multiple projects for runner chat sessions', () => {
    const text = multiProjectDirectoryPreamble([
      {
        key: 'MKT',
        name: 'Marketing',
        directory: {
          storageLocations: [
            {
              kind: 'local_folder',
              label: 'MKT Root',
              uriOrPath: '~/workspace',
              accessScope: 'read_write',
              isPrimary: true,
              description: '',
            },
          ],
          channels: [],
          contacts: [],
        },
      },
      {
        key: 'OPS',
        name: 'Operations',
        directory: {
          storageLocations: [],
          channels: [
            {
              platform: 'telegram',
              threadType: 'GROUP',
              displayName: 'Ops Alerts',
              targetId: '-100123',
              aliases: [],
              status: 'ACTIVE',
            },
          ],
          contacts: [],
        },
      },
    ]);
    expect(text).toContain('## Project Directories & Information Sources');
    expect(text).toContain('**MKT** (Marketing)');
    expect(text).toContain('**OPS** (Operations)');
  });
});
