/**
 * Animation utilities for the Refined Finance UI
 * Provides consistent animation delays and keyframe configurations
 */

// Stagger delay for list items (in ms)
export const STAGGER_DELAY = 50;

// Base animation durations
export const DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// CSS class generators for staggered animations
export function getStaggerDelay(index: number, baseDelay = 0): string {
  const delay = baseDelay + index * STAGGER_DELAY;
  return `${delay}ms`;
}

// Animation style object for inline styles
export function getStaggerStyle(index: number, baseDelay = 0): React.CSSProperties {
  return {
    animationDelay: getStaggerDelay(index, baseDelay),
  };
}
