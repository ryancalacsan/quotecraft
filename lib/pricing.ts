import Decimal from 'decimal.js';

export interface LineItemInput {
  rate: number | string; // Drizzle returns numeric columns as strings
  quantity: number | string;
  discount: number | string; // Percentage (0-100)
}

export interface QuotePricing {
  subtotal: number;
  lineItemTotals: number[];
  depositAmount: number;
  total: number;
}

export function calculateLineItemTotal(item: LineItemInput): number {
  const rate = new Decimal(item.rate);
  const quantity = new Decimal(item.quantity);
  const discount = new Decimal(item.discount);

  const baseTotal = rate.times(quantity);
  const discountAmount = baseTotal.times(discount.dividedBy(100));
  return baseTotal.minus(discountAmount).toDecimalPlaces(2).toNumber();
}

export function calculateQuotePricing(
  lineItems: LineItemInput[],
  depositPercent: number = 0,
): QuotePricing {
  const lineItemTotals = lineItems.map(calculateLineItemTotal);
  const subtotal = lineItemTotals
    .reduce((sum, total) => new Decimal(sum).plus(total), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();
  const depositAmount = new Decimal(subtotal)
    .times(new Decimal(depositPercent).dividedBy(100))
    .toDecimalPlaces(2)
    .toNumber();

  return {
    subtotal,
    lineItemTotals,
    depositAmount,
    total: subtotal,
  };
}

/** Convert dollar amount to Stripe cents (integer). */
export function toStripeCents(amount: number): number {
  return new Decimal(amount).times(100).round().toNumber();
}
