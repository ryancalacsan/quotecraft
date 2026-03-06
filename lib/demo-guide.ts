export const DEMO_STEPS_KEY = 'demo_guide_steps';
export const DEMO_GUIDE_OPEN_KEY = 'demo_guide_open';
export const DEMO_STEP_COUNT = 5;

/**
 * Marks a demo step as complete. Writes to localStorage (persists across
 * redirects and tabs) and fires a custom event (updates the same-tab widget).
 */
export function completeDemoStep(step: number) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DEMO_STEPS_KEY);
    const steps: boolean[] = raw ? JSON.parse(raw) : Array(DEMO_STEP_COUNT).fill(false);
    if (!steps[step]) {
      steps[step] = true;
      localStorage.setItem(DEMO_STEPS_KEY, JSON.stringify(steps));
    }
  } catch {
    // Silently fail if localStorage is unavailable
  }
  window.dispatchEvent(new CustomEvent('demo-step-complete', { detail: { step } }));
}

export function loadDemoSteps(): boolean[] {
  try {
    const raw = localStorage.getItem(DEMO_STEPS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === DEMO_STEP_COUNT) {
        return parsed as boolean[];
      }
    }
  } catch {
    // Silently fail
  }
  return Array(DEMO_STEP_COUNT).fill(false);
}
