export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'declined', 'paid'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  paid: 'Paid',
};

export const PRICING_TYPES = ['hourly', 'fixed', 'per_unit'] as const;
export type PricingType = (typeof PRICING_TYPES)[number];

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  hourly: 'Hourly',
  fixed: 'Fixed Price',
  per_unit: 'Per Unit',
};

export const DEFAULT_CURRENCY = 'USD';
