import { describe, it, expect, vi, beforeEach } from 'vitest';

import { completeDemoStep, loadDemoSteps, DEMO_STEPS_KEY, DEMO_STEP_COUNT } from '@/lib/demo-guide';

// Minimal localStorage mock
function makeLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

describe('demo-guide', () => {
  let ls: ReturnType<typeof makeLocalStorage>;
  let listeners: Array<(e: Event) => void>;

  beforeEach(() => {
    ls = makeLocalStorage();
    listeners = [];

    vi.stubGlobal('localStorage', ls);
    vi.stubGlobal('window', {
      dispatchEvent: (e: Event) => {
        listeners.forEach((fn) => fn(e));
      },
      addEventListener: (type: string, fn: (e: Event) => void) => {
        if (type === 'demo-step-complete') listeners.push(fn);
      },
      removeEventListener: (_type: string, fn: (e: Event) => void) => {
        listeners = listeners.filter((l) => l !== fn);
      },
    });
  });

  describe('loadDemoSteps', () => {
    it('returns all-false array when localStorage is empty', () => {
      expect(loadDemoSteps()).toEqual(Array(DEMO_STEP_COUNT).fill(false));
    });

    it('returns stored steps when valid data exists', () => {
      const stored = [true, false, true, false, false];
      ls.setItem(DEMO_STEPS_KEY, JSON.stringify(stored));
      expect(loadDemoSteps()).toEqual(stored);
    });

    it('returns all-false array when stored data has wrong length', () => {
      ls.setItem(DEMO_STEPS_KEY, JSON.stringify([true, false]));
      expect(loadDemoSteps()).toEqual(Array(DEMO_STEP_COUNT).fill(false));
    });

    it('returns all-false array when stored data is not an array', () => {
      ls.setItem(DEMO_STEPS_KEY, JSON.stringify({ step: 0 }));
      expect(loadDemoSteps()).toEqual(Array(DEMO_STEP_COUNT).fill(false));
    });

    it('returns all-false array when stored data is invalid JSON', () => {
      ls.setItem(DEMO_STEPS_KEY, 'not-json');
      expect(loadDemoSteps()).toEqual(Array(DEMO_STEP_COUNT).fill(false));
    });
  });

  describe('completeDemoStep', () => {
    it('marks the given step as complete in localStorage', () => {
      completeDemoStep(0);
      const steps = loadDemoSteps();
      expect(steps[0]).toBe(true);
      expect(steps.slice(1).every((s) => s === false)).toBe(true);
    });

    it('dispatches demo-step-complete event when step is newly completed', () => {
      const received: CustomEvent[] = [];
      window.addEventListener('demo-step-complete', (e) => received.push(e as CustomEvent));
      completeDemoStep(2);
      expect(received).toHaveLength(1);
      expect(received[0].detail).toEqual({ step: 2 });
    });

    it('does not dispatch event when step is already complete', () => {
      ls.setItem(DEMO_STEPS_KEY, JSON.stringify([false, false, true, false, false]));
      const received: CustomEvent[] = [];
      window.addEventListener('demo-step-complete', (e) => received.push(e as CustomEvent));
      completeDemoStep(2);
      expect(received).toHaveLength(0);
    });

    it('does not overwrite other steps when completing one', () => {
      ls.setItem(DEMO_STEPS_KEY, JSON.stringify([true, false, false, true, false]));
      completeDemoStep(1);
      expect(loadDemoSteps()).toEqual([true, true, false, true, false]);
    });

    it('does nothing when window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined);
      expect(() => completeDemoStep(0)).not.toThrow();
    });
  });
});
