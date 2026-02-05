import { describe, it, expect } from 'vitest';
import { STAGGER_DELAY, DURATION, getStaggerDelay, getStaggerStyle } from '@/lib/animations';

describe('animations', () => {
  describe('constants', () => {
    it('should have correct STAGGER_DELAY value', () => {
      expect(STAGGER_DELAY).toBe(50);
    });

    it('should have correct DURATION values', () => {
      expect(DURATION.fast).toBe(150);
      expect(DURATION.normal).toBe(300);
      expect(DURATION.slow).toBe(500);
    });
  });

  describe('getStaggerDelay', () => {
    it('should return delay string for index 0 with no base delay', () => {
      expect(getStaggerDelay(0)).toBe('0ms');
    });

    it('should return delay string for index 1 with no base delay', () => {
      expect(getStaggerDelay(1)).toBe('50ms');
    });

    it('should return delay string for index 3 with no base delay', () => {
      expect(getStaggerDelay(3)).toBe('150ms');
    });

    it('should add base delay to calculated delay', () => {
      expect(getStaggerDelay(0, 100)).toBe('100ms');
      expect(getStaggerDelay(1, 100)).toBe('150ms');
      expect(getStaggerDelay(2, 100)).toBe('200ms');
    });

    it('should handle large indices', () => {
      expect(getStaggerDelay(10)).toBe('500ms');
      expect(getStaggerDelay(20, 50)).toBe('1050ms');
    });
  });

  describe('getStaggerStyle', () => {
    it('should return style object with animationDelay', () => {
      const style = getStaggerStyle(0);
      expect(style).toEqual({ animationDelay: '0ms' });
    });

    it('should calculate correct delay for index', () => {
      const style = getStaggerStyle(2);
      expect(style).toEqual({ animationDelay: '100ms' });
    });

    it('should include base delay in calculation', () => {
      const style = getStaggerStyle(1, 200);
      expect(style).toEqual({ animationDelay: '250ms' });
    });

    it('should return React.CSSProperties compatible object', () => {
      const style = getStaggerStyle(0);
      expect(style).toHaveProperty('animationDelay');
      expect(typeof style.animationDelay).toBe('string');
    });
  });
});
