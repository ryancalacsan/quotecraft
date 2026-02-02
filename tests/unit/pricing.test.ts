import { describe, expect, it } from 'vitest';

import { calculateLineItemTotal, calculateQuotePricing, toStripeCents } from '@/lib/pricing';

describe('calculateLineItemTotal', () => {
  it('calculates fixed price with no discount', () => {
    expect(calculateLineItemTotal({ rate: '100.00', quantity: '1', discount: '0' })).toBe(100);
  });

  it('calculates hourly rate × quantity', () => {
    expect(calculateLineItemTotal({ rate: '150.00', quantity: '10', discount: '0' })).toBe(1500);
  });

  it('applies percentage discount', () => {
    expect(calculateLineItemTotal({ rate: '200.00', quantity: '1', discount: '10' })).toBe(180);
  });

  it('handles 100% discount', () => {
    expect(calculateLineItemTotal({ rate: '500.00', quantity: '3', discount: '100' })).toBe(0);
  });

  it('handles zero rate', () => {
    expect(calculateLineItemTotal({ rate: '0', quantity: '5', discount: '0' })).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    // 33.33 * 3 = 99.99, 10% off = 89.991 → should round to 89.99
    expect(calculateLineItemTotal({ rate: '33.33', quantity: '3', discount: '10' })).toBe(89.99);
  });

  it('handles fractional quantities', () => {
    expect(calculateLineItemTotal({ rate: '100.00', quantity: '1.5', discount: '0' })).toBe(150);
  });

  it('accepts numeric inputs (not just strings)', () => {
    expect(calculateLineItemTotal({ rate: 75, quantity: 2, discount: 5 })).toBe(142.5);
  });

  it('handles large values without floating-point errors', () => {
    // 99999.99 * 100 = 9999999, 0% discount
    expect(
      calculateLineItemTotal({ rate: '99999.99', quantity: '100', discount: '0' }),
    ).toBe(9999999);
  });
});

describe('calculateQuotePricing', () => {
  it('calculates subtotal from multiple line items', () => {
    const result = calculateQuotePricing(
      [
        { rate: '100', quantity: '1', discount: '0' },
        { rate: '200', quantity: '2', discount: '0' },
      ],
      0,
    );
    expect(result.subtotal).toBe(500);
    expect(result.total).toBe(500);
    expect(result.lineItemTotals).toEqual([100, 400]);
    expect(result.depositAmount).toBe(0);
  });

  it('calculates deposit amount', () => {
    const result = calculateQuotePricing(
      [{ rate: '1000', quantity: '1', discount: '0' }],
      25,
    );
    expect(result.subtotal).toBe(1000);
    expect(result.depositAmount).toBe(250);
  });

  it('handles 50% deposit', () => {
    const result = calculateQuotePricing(
      [{ rate: '500', quantity: '2', discount: '10' }],
      50,
    );
    // 500 * 2 = 1000, 10% off = 900
    expect(result.subtotal).toBe(900);
    expect(result.depositAmount).toBe(450);
  });

  it('handles empty line items array', () => {
    const result = calculateQuotePricing([], 0);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
    expect(result.lineItemTotals).toEqual([]);
    expect(result.depositAmount).toBe(0);
  });

  it('defaults depositPercent to 0', () => {
    const result = calculateQuotePricing([{ rate: '100', quantity: '1', discount: '0' }]);
    expect(result.depositAmount).toBe(0);
  });

  it('handles 100% deposit', () => {
    const result = calculateQuotePricing(
      [{ rate: '250', quantity: '4', discount: '0' }],
      100,
    );
    expect(result.depositAmount).toBe(1000);
  });
});

describe('toStripeCents', () => {
  it('converts dollars to cents', () => {
    expect(toStripeCents(10)).toBe(1000);
  });

  it('converts fractional dollars', () => {
    expect(toStripeCents(19.99)).toBe(1999);
  });

  it('rounds to nearest cent', () => {
    expect(toStripeCents(10.005)).toBe(1001);
    expect(toStripeCents(10.004)).toBe(1000);
  });

  it('handles zero', () => {
    expect(toStripeCents(0)).toBe(0);
  });

  it('handles large amounts', () => {
    expect(toStripeCents(99999.99)).toBe(9999999);
  });
});
