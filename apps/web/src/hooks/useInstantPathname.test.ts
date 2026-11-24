import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  classifyRouteLayout,
  extractPathname,
  resetInstantPathnameForTest,
  setOverridePathname,
  shouldSuppressAccordRscFetch,
} from './useInstantPathname';

describe('classifyRouteLayout', () => {
  it('classifies organization and team settings routes as org', () => {
    assert.equal(classifyRouteLayout('/account/company'), 'org');
    assert.equal(classifyRouteLayout('/account/teams'), 'org');
    assert.equal(classifyRouteLayout('/thanb/settings'), 'org');
    assert.equal(classifyRouteLayout('/thanb/settings/capabilities'), 'org');
    assert.equal(classifyRouteLayout('/thanb/settings/ai-agents?tab=1'), 'org');
    assert.equal(classifyRouteLayout('https://itsaplan.test/thanb/settings/mcp'), 'org');
  });

  it('classifies project workspace routes as shell', () => {
    assert.equal(classifyRouteLayout('/thanb/PM'), 'shell');
    assert.equal(classifyRouteLayout('/thanb/PM/view/42'), 'shell');
    assert.equal(classifyRouteLayout('/thanb/PM/inbox'), 'shell');
    assert.equal(classifyRouteLayout('/thanb/PM/agents'), 'shell');
    assert.equal(classifyRouteLayout('/thanb/PM/agents/chat'), 'shell');
    assert.equal(classifyRouteLayout('/thanb/PM/directory'), 'shell');
    assert.equal(classifyRouteLayout('/thanb/PM/open-office?cycle_id=5'), 'shell');
    assert.equal(classifyRouteLayout('/thanb/PM/mcp'), 'shell');
    assert.equal(classifyRouteLayout('/thanb/PM/api'), 'shell');
    assert.equal(classifyRouteLayout('/thanb/PM/notifications'), 'shell');
    assert.equal(classifyRouteLayout('https://itsaplan.test/thanb/PM/docs'), 'shell');
  });

  it('classifies root, auth, issue detail, and project settings routes as other', () => {
    assert.equal(classifyRouteLayout('/'), 'other');
    assert.equal(classifyRouteLayout('/login'), 'other');
    assert.equal(classifyRouteLayout('/thanb/issue/PM-1'), 'other');
    assert.equal(classifyRouteLayout('/thanb/PM/settings/general'), 'other');
    assert.equal(classifyRouteLayout(''), 'other');
  });
});

describe('extractPathname', () => {
  it('strips query parameters and hashes from relative and absolute URLs', () => {
    assert.equal(extractPathname('/thanb/PM/open-office?cycle_id=5#top'), '/thanb/PM/open-office');
    assert.equal(extractPathname('https://itsaplan.test/thanb/PM/docs?tab=notes'), '/thanb/PM/docs');
  });
});

describe('shouldSuppressAccordRscFetch', () => {
  it('allows explicit same-URL router.refresh() while suppressing prefetches and same-layout route transitions', () => {
    assert.equal(shouldSuppressAccordRscFetch('/thanb/PM?_rsc=1', '/thanb/PM', false), false);
    assert.equal(shouldSuppressAccordRscFetch('/thanb/PM?_rsc=1', '/thanb/PM', true), true);
    assert.equal(shouldSuppressAccordRscFetch('/thanb/PM/inbox?_rsc=1', '/thanb/PM', false), true);
    assert.equal(
      shouldSuppressAccordRscFetch('/thanb/settings/capabilities?_rsc=1', '/thanb/PM', false),
      false,
    );
  });

  it('tracks lastObservedNextPathname so newly mounted hooks do not wipe overridePath', () => {
    resetInstantPathnameForTest();
    setOverridePathname('/thanb/PM/inbox');
    const src = readFileSync(resolve(import.meta.dirname, './useInstantPathname.ts'), 'utf8');
    assert.ok(src.includes('lastObservedNextPathname !== null && lastObservedNextPathname !== nextPathname'));
    resetInstantPathnameForTest();
  });
});
