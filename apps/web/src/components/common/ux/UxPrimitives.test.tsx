import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { act, useState } from 'react';
import type { Root } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { GuidedStepper, type GuidedStepDef } from './GuidedStepper';
import { ProgressiveDisclosure } from './ProgressiveDisclosure';
import { StepSectionTabs, type StepSectionTabItem } from './StepSectionTabs';

describe('UX Primitives', () => {
  let dom: JSDOM | null = null;
  let root: Root | null = null;
  let originalGlobals: Map<string, PropertyDescriptor | undefined> | null = null;

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
      root = null;
    }
    if (originalGlobals) {
      for (const [k, d] of originalGlobals) {
        if (d) Object.defineProperty(globalThis, k, d);
        else delete (globalThis as Record<string, unknown>)[k];
      }
      originalGlobals = null;
    }
    dom?.window.close();
    dom = null;
  });

  async function setupDom() {
    dom = new JSDOM('<div id="root"></div>', { url: 'https://itsaplan.test/thanb/PM' });
    const globals = {
      window: dom.window,
      document: dom.window.document,
      navigator: dom.window.navigator,
      localStorage: dom.window.localStorage,
      Node: dom.window.Node,
      Element: dom.window.Element,
      HTMLElement: dom.window.HTMLElement,
      HTMLInputElement: dom.window.HTMLInputElement,
      Event: dom.window.Event,
      InputEvent: dom.window.InputEvent,
      MouseEvent: dom.window.MouseEvent,
      IS_REACT_ACT_ENVIRONMENT: true,
    };
    originalGlobals = new Map(
      Object.keys(globals).map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]),
    );
    for (const [k, v] of Object.entries(globals)) {
      Object.defineProperty(globalThis, k, { configurable: true, value: v });
    }
    const { createRoot } = await import('react-dom/client');
    root = createRoot(dom.window.document.getElementById('root')!);
    return dom.window.document;
  }

  it('ProgressiveDisclosure collapses by default, displays summary & count, toggles visibility, and updates aria-expanded', async () => {
    const doc = await setupDom();

    await act(async () => {
      root!.render(
        <ProgressiveDisclosure
          label="Advanced options"
          expandedLabel="Hide advanced options"
          summary="3 active"
          count={4}
          triggerTestId="pd-trigger"
          contentTestId="pd-content"
        >
          <p data-testid="pd-child">Secondary controls</p>
        </ProgressiveDisclosure>,
      );
    });

    const trigger = doc.querySelector<HTMLButtonElement>('[data-testid="pd-trigger"]');
    assert.ok(trigger);
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    assert.ok(trigger.textContent?.includes('Advanced options'));
    assert.ok(trigger.textContent?.includes('3 active'));
    assert.ok(trigger.textContent?.includes('4'));
    assert.equal(doc.querySelector('[data-testid="pd-content"]'), null);
    assert.equal(doc.querySelector('[data-testid="pd-child"]'), null);

    await act(async () => {
      trigger.click();
    });

    assert.equal(trigger.getAttribute('aria-expanded'), 'true');
    assert.ok(trigger.textContent?.includes('Hide advanced options'));
    assert.equal(trigger.textContent?.includes('3 active'), false);
    const content = doc.querySelector<HTMLElement>('[data-testid="pd-content"]');
    assert.ok(content);
    assert.equal(content.classList.contains('hidden'), false);
    assert.ok(doc.querySelector('[data-testid="pd-child"]'));

    await act(async () => {
      trigger.click();
    });

    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(doc.querySelector('[data-testid="pd-content"]'), null);
  });

  it('ProgressiveDisclosure preserves mounted children when keepMounted={true}', async () => {
    const doc = await setupDom();

    function KeepMountedChild() {
      const [clicks, setClicks] = useState(0);
      return (
        <div>
          <input data-testid="pd-km-input" defaultValue="" />
          <button
            type="button"
            data-testid="pd-km-inc"
            onClick={() => setClicks((c) => c + 1)}
          >
            {clicks}
          </button>
        </div>
      );
    }

    await act(async () => {
      root!.render(
        <ProgressiveDisclosure
          label="Filters"
          summary="Optional"
          count={2}
          keepMounted={true}
          triggerTestId="pd-km-trigger"
          contentTestId="pd-km-content"
        >
          <KeepMountedChild />
        </ProgressiveDisclosure>,
      );
    });

    const trigger = doc.querySelector<HTMLButtonElement>('[data-testid="pd-km-trigger"]');
    const content = doc.querySelector<HTMLElement>('[data-testid="pd-km-content"]');
    const input = doc.querySelector<HTMLInputElement>('[data-testid="pd-km-input"]');
    const incBtn = doc.querySelector<HTMLButtonElement>('[data-testid="pd-km-inc"]');
    assert.ok(trigger && content && input && incBtn);

    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(content.classList.contains('hidden'), true);
    assert.equal(content.getAttribute('aria-hidden'), 'true');

    await act(async () => {
      trigger.click();
    });
    assert.equal(trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(content.classList.contains('hidden'), false);
    assert.equal(content.getAttribute('aria-hidden'), 'false');

    await act(async () => {
      input.value = 'preserved-query';
      incBtn.click();
    });
    assert.equal(input.value, 'preserved-query');
    assert.equal(incBtn.textContent, '1');

    // Collapse and re-expand; same DOM node, input value, and React state must remain mounted
    await act(async () => {
      trigger.click();
    });
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(content.classList.contains('hidden'), true);
    assert.equal(doc.querySelector<HTMLInputElement>('[data-testid="pd-km-input"]'), input);
    assert.equal(input.value, 'preserved-query');
    assert.equal(incBtn.textContent, '1');

    await act(async () => {
      trigger.click();
    });
    assert.equal(trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(content.classList.contains('hidden'), false);
    assert.equal(
      doc.querySelector<HTMLInputElement>('[data-testid="pd-km-input"]')?.value,
      'preserved-query',
    );
    assert.equal(doc.querySelector<HTMLButtonElement>('[data-testid="pd-km-inc"]')?.textContent, '1');
  });

  it('GuidedStepper shows only active step panel, updates aria-current="step", and preserves inputs across Step 1 -> 2 -> 3 -> 2', async () => {
    const doc = await setupDom();

    const steps: GuidedStepDef[] = [
      { id: 'step-1', label: 'Scope', description: 'Define scope', testId: 'tab-step-1' },
      { id: 'step-2', label: 'Details', description: 'Fill details', testId: 'tab-step-2' },
      { id: 'step-3', label: 'Review', description: 'Confirm launch', testId: 'tab-step-3' },
    ];

    function StepTwoForm() {
      const [counter, setCounter] = useState(0);
      return (
        <div>
          <input data-testid="step-2-input" defaultValue="" />
          <button
            type="button"
            data-testid="step-2-inc"
            onClick={() => setCounter((c) => c + 1)}
          >
            {counter}
          </button>
        </div>
      );
    }

    function StepperHarness() {
      const [activeStepId, setActiveStepId] = useState('step-1');
      return (
        <GuidedStepper
          testId="guided-stepper"
          steps={steps}
          activeStepId={activeStepId}
          onStepChange={setActiveStepId}
          keepMounted={true}
          renderStep={(stepId) => {
            if (stepId === 'step-1') return <div data-testid="panel-1-body">Step 1 content</div>;
            if (stepId === 'step-2') return <StepTwoForm />;
            return <div data-testid="panel-3-body">Step 3 content</div>;
          }}
        />
      );
    }

    await act(async () => {
      root!.render(<StepperHarness />);
    });

    const tab1 = doc.querySelector<HTMLButtonElement>('[data-testid="tab-step-1"]');
    const tab2 = doc.querySelector<HTMLButtonElement>('[data-testid="tab-step-2"]');
    const tab3 = doc.querySelector<HTMLButtonElement>('[data-testid="tab-step-3"]');
    const panel1 = doc.querySelector<HTMLElement>('[data-step-id="step-1"]');
    const panel2 = doc.querySelector<HTMLElement>('[data-step-id="step-2"]');
    const panel3 = doc.querySelector<HTMLElement>('[data-step-id="step-3"]');

    assert.ok(tab1 && tab2 && tab3);
    assert.ok(panel1 && panel2 && panel3);

    // Initially on Step 1
    assert.equal(tab1.getAttribute('aria-current'), 'step');
    assert.equal(tab2.getAttribute('aria-current'), null);
    assert.equal(tab3.getAttribute('aria-current'), null);
    assert.equal(panel1.getAttribute('data-active'), 'true');
    assert.equal(panel1.classList.contains('hidden'), false);
    assert.equal(panel2.getAttribute('data-active'), 'false');
    assert.equal(panel2.classList.contains('hidden'), true);
    assert.equal(panel3.getAttribute('data-active'), 'false');
    assert.equal(panel3.classList.contains('hidden'), true);

    // Step 1 -> Step 2
    await act(async () => {
      tab2.click();
    });
    assert.equal(tab1.getAttribute('aria-current'), null);
    assert.equal(tab2.getAttribute('aria-current'), 'step');
    assert.equal(tab3.getAttribute('aria-current'), null);
    assert.equal(panel1.getAttribute('data-active'), 'false');
    assert.equal(panel1.classList.contains('hidden'), true);
    assert.equal(panel2.getAttribute('data-active'), 'true');
    assert.equal(panel2.classList.contains('hidden'), false);
    assert.equal(panel3.getAttribute('data-active'), 'false');
    assert.equal(panel3.classList.contains('hidden'), true);

    const step2Input = doc.querySelector<HTMLInputElement>('[data-testid="step-2-input"]');
    const step2Inc = doc.querySelector<HTMLButtonElement>('[data-testid="step-2-inc"]');
    assert.ok(step2Input && step2Inc);
    await act(async () => {
      step2Input.value = 'calm-first-workflow';
      step2Inc.click();
      step2Inc.click();
    });
    assert.equal(step2Input.value, 'calm-first-workflow');
    assert.equal(step2Inc.textContent, '2');

    // Step 2 -> Step 3
    await act(async () => {
      tab3.click();
    });
    assert.equal(tab2.getAttribute('aria-current'), null);
    assert.equal(tab3.getAttribute('aria-current'), 'step');
    assert.equal(panel2.getAttribute('data-active'), 'false');
    assert.equal(panel2.classList.contains('hidden'), true);
    assert.equal(panel3.getAttribute('data-active'), 'true');
    assert.equal(panel3.classList.contains('hidden'), false);

    // Step 3 -> Step 2: input value, DOM node, and React state remain preserved
    await act(async () => {
      tab2.click();
    });
    assert.equal(tab2.getAttribute('aria-current'), 'step');
    assert.equal(tab3.getAttribute('aria-current'), null);
    assert.equal(panel2.getAttribute('data-active'), 'true');
    assert.equal(panel2.classList.contains('hidden'), false);
    assert.equal(panel3.getAttribute('data-active'), 'false');
    assert.equal(panel3.classList.contains('hidden'), true);
    const restoredInput = doc.querySelector<HTMLInputElement>('[data-testid="step-2-input"]');
    const restoredInc = doc.querySelector<HTMLButtonElement>('[data-testid="step-2-inc"]');
    assert.equal(restoredInput, step2Input);
    assert.equal(restoredInput?.value, 'calm-first-workflow');
    assert.equal(restoredInc?.textContent, '2');
  });

  it('StepSectionTabs switches active tab with aria-selected="true"', async () => {
    const doc = await setupDom();

    const tabs: StepSectionTabItem[] = [
      { id: 'overview', label: 'Overview', count: 3, testId: 'section-tab-overview' },
      { id: 'activity', label: 'Activity', count: 8, testId: 'section-tab-activity' },
      { id: 'audit', label: 'Audit', testId: 'section-tab-audit' },
    ];

    function TabsHarness() {
      const [activeTabId, setActiveTabId] = useState('overview');
      return (
        <StepSectionTabs
          testId="section-tabs"
          ariaLabel="Section switcher"
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
        />
      );
    }

    await act(async () => {
      root!.render(<TabsHarness />);
    });

    const overviewTab = doc.querySelector<HTMLButtonElement>('[data-testid="section-tab-overview"]');
    const activityTab = doc.querySelector<HTMLButtonElement>('[data-testid="section-tab-activity"]');
    const auditTab = doc.querySelector<HTMLButtonElement>('[data-testid="section-tab-audit"]');
    assert.ok(overviewTab && activityTab && auditTab);

    assert.equal(overviewTab.getAttribute('aria-selected'), 'true');
    assert.equal(activityTab.getAttribute('aria-selected'), 'false');
    assert.equal(auditTab.getAttribute('aria-selected'), 'false');

    await act(async () => {
      activityTab.click();
    });
    assert.equal(overviewTab.getAttribute('aria-selected'), 'false');
    assert.equal(activityTab.getAttribute('aria-selected'), 'true');
    assert.equal(auditTab.getAttribute('aria-selected'), 'false');

    await act(async () => {
      auditTab.click();
    });
    assert.equal(overviewTab.getAttribute('aria-selected'), 'false');
    assert.equal(activityTab.getAttribute('aria-selected'), 'false');
    assert.equal(auditTab.getAttribute('aria-selected'), 'true');
  });
});
