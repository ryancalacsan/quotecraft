import { describe, expect, it } from 'vitest';

import { cn, formatCurrency, formatDate } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'included', false && 'excluded')).toBe('base included');
  });

  it('merges Tailwind classes intelligently', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('formatCurrency', () => {
  it('formats USD amount with dollar sign', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });

  it('formats decimal amounts', () => {
    expect(formatCurrency(19.99)).toBe('$19.99');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats large amounts with comma separators', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
  });

  it('defaults to USD', () => {
    expect(formatCurrency(50)).toBe('$50.00');
  });

  it('formats EUR when specified', () => {
    const result = formatCurrency(50, 'EUR');
    expect(result).toContain('50.00');
  });
});

describe('formatDate', () => {
  it('formats a Date object', () => {
    // Use noon UTC to avoid timezone-related date shifts
    const result = formatDate(new Date('2026-01-15T12:00:00Z'));
    expect(result).toBe('Jan 15, 2026');
  });

  it('formats an ISO date string', () => {
    const result = formatDate('2026-06-01T12:00:00Z');
    expect(result).toBe('Jun 1, 2026');
  });

  it('formats a recent date', () => {
    const result = formatDate(new Date('2026-12-25T12:00:00Z'));
    expect(result).toBe('Dec 25, 2026');
  });
});
