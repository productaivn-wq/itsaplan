import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Elysia, t } from 'elysia';

describe('Bun 1.4.x + Elysia t.Numeric() params regression', () => {
  it('handles t.Numeric() route params over HTTP without throwing 500', async () => {
    const server = new Elysia({ systemRouter: false })
      .get(
        '/teams/:teamId/ai-agents',
        ({ params, query }) => ({
          teamId: params.teamId,
          teamIdType: typeof params.teamId,
          projectId: query.projectId ?? null,
        }),
        {
          params: t.Object({ teamId: t.Numeric() }),
          query: t.Object({ projectId: t.Optional(t.Numeric()) }),
        },
      )
      .listen(0);

    try {
      const port = server.server?.port;
      expect(port).toBeTruthy();
      const res = await fetch(`http://127.0.0.1:${port}/teams/1/ai-agents?projectId=1`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        teamId: number;
        teamIdType: string;
        projectId: number | null;
      };
      expect(body.teamId).toBe(1);
      expect(body.teamIdType).toBe('number');
      expect(body.projectId).toBe(1);
    } finally {
      await server.stop(true);
    }
  });

  it('configures main app.ts with systemRouter: false', () => {
    const appPath = resolve(import.meta.dirname, '../../../../../app.ts');
    const src = readFileSync(appPath, 'utf8');
    expect(src).toContain('new Elysia({ systemRouter: false })');
  });
});
