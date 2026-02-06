import { describe, expect, it } from 'vitest';

import { quoteFormSchema } from '@/lib/validations/quote';
import { lineItemSchema } from '@/lib/validations/line-item';
import { templateFormSchema } from '@/lib/validations/template';

describe('quoteFormSchema', () => {
  const validQuote = {
    title: 'Web Design Project',
    clientName: 'Acme Corp',
    clientEmail: 'john@acme.com',
    notes: 'Payment due in 30 days',
    depositPercent: 25,
  };

  it('accepts valid quote data', () => {
    const result = quoteFormSchema.safeParse(validQuote);
    expect(result.success).toBe(true);
  });

  it('requires title', () => {
    const result = quoteFormSchema.safeParse({ ...validQuote, title: '' });
    expect(result.success).toBe(false);
  });

  it('requires client name', () => {
    const result = quoteFormSchema.safeParse({ ...validQuote, clientName: '' });
    expect(result.success).toBe(false);
  });

  it('validates email format', () => {
    const result = quoteFormSchema.safeParse({ ...validQuote, clientEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('allows empty email', () => {
    const result = quoteFormSchema.safeParse({ ...validQuote, clientEmail: '' });
    expect(result.success).toBe(true);
  });

  it('allows missing email', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { clientEmail, ...noEmail } = validQuote;
    const result = quoteFormSchema.safeParse(noEmail);
    expect(result.success).toBe(true);
  });

  it('enforces deposit percent 0-100', () => {
    expect(quoteFormSchema.safeParse({ ...validQuote, depositPercent: -1 }).success).toBe(false);
    expect(quoteFormSchema.safeParse({ ...validQuote, depositPercent: 101 }).success).toBe(false);
    expect(quoteFormSchema.safeParse({ ...validQuote, depositPercent: 0 }).success).toBe(true);
    expect(quoteFormSchema.safeParse({ ...validQuote, depositPercent: 100 }).success).toBe(true);
  });

  it('coerces deposit percent from string', () => {
    const result = quoteFormSchema.safeParse({ ...validQuote, depositPercent: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.depositPercent).toBe(50);
    }
  });

  it('enforces title max length', () => {
    const result = quoteFormSchema.safeParse({ ...validQuote, title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('enforces notes max length', () => {
    const result = quoteFormSchema.safeParse({ ...validQuote, notes: 'a'.repeat(5001) });
    expect(result.success).toBe(false);
  });
});

describe('lineItemSchema', () => {
  const validItem = {
    description: 'Design work',
    pricingType: 'fixed' as const,
    rate: 100,
    quantity: 1,
    discount: 0,
    sortOrder: 0,
  };

  it('accepts valid fixed-price item', () => {
    const result = lineItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('accepts valid hourly item', () => {
    const result = lineItemSchema.safeParse({
      ...validItem,
      pricingType: 'hourly',
      unit: 'hours',
      rate: 150,
      quantity: 10,
    });
    expect(result.success).toBe(true);
  });

  it('requires unit for per_unit pricing', () => {
    const result = lineItemSchema.safeParse({
      ...validItem,
      pricingType: 'per_unit',
      unit: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts per_unit with unit provided', () => {
    const result = lineItemSchema.safeParse({
      ...validItem,
      pricingType: 'per_unit',
      unit: 'pages',
    });
    expect(result.success).toBe(true);
  });

  it('does not require unit for fixed pricing', () => {
    const result = lineItemSchema.safeParse({ ...validItem, pricingType: 'fixed' });
    expect(result.success).toBe(true);
  });

  it('requires description', () => {
    const result = lineItemSchema.safeParse({ ...validItem, description: '' });
    expect(result.success).toBe(false);
  });

  it('enforces rate >= 0', () => {
    expect(lineItemSchema.safeParse({ ...validItem, rate: -1 }).success).toBe(false);
    expect(lineItemSchema.safeParse({ ...validItem, rate: 0 }).success).toBe(true);
  });

  it('enforces quantity > 0', () => {
    expect(lineItemSchema.safeParse({ ...validItem, quantity: 0 }).success).toBe(false);
    expect(lineItemSchema.safeParse({ ...validItem, quantity: -1 }).success).toBe(false);
    expect(lineItemSchema.safeParse({ ...validItem, quantity: 0.5 }).success).toBe(true);
  });

  it('enforces discount 0-100', () => {
    expect(lineItemSchema.safeParse({ ...validItem, discount: -1 }).success).toBe(false);
    expect(lineItemSchema.safeParse({ ...validItem, discount: 101 }).success).toBe(false);
    expect(lineItemSchema.safeParse({ ...validItem, discount: 50 }).success).toBe(true);
  });

  it('rejects invalid pricing type', () => {
    const result = lineItemSchema.safeParse({ ...validItem, pricingType: 'monthly' });
    expect(result.success).toBe(false);
  });

  it('coerces string numbers', () => {
    const result = lineItemSchema.safeParse({
      ...validItem,
      rate: '99.99',
      quantity: '5',
      discount: '10',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rate).toBe(99.99);
      expect(result.data.quantity).toBe(5);
      expect(result.data.discount).toBe(10);
    }
  });
});

describe('templateFormSchema', () => {
  const validTemplate = {
    name: 'Standard Web Project',
    description: 'Template for standard web development projects',
    defaultTitle: 'Web Development',
    defaultNotes: 'Payment terms apply',
    defaultValidDays: 30,
    defaultDepositPercent: 25,
  };

  it('accepts valid template data', () => {
    const result = templateFormSchema.safeParse(validTemplate);
    expect(result.success).toBe(true);
  });

  it('requires name', () => {
    const result = templateFormSchema.safeParse({ ...validTemplate, name: '' });
    expect(result.success).toBe(false);
  });

  it('enforces name max length', () => {
    const result = templateFormSchema.safeParse({ ...validTemplate, name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('allows empty description', () => {
    const result = templateFormSchema.safeParse({ ...validTemplate, description: '' });
    expect(result.success).toBe(true);
  });

  it('enforces description max length', () => {
    const result = templateFormSchema.safeParse({ ...validTemplate, description: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('allows empty defaultTitle', () => {
    const result = templateFormSchema.safeParse({ ...validTemplate, defaultTitle: '' });
    expect(result.success).toBe(true);
  });

  it('enforces defaultTitle max length', () => {
    const result = templateFormSchema.safeParse({
      ...validTemplate,
      defaultTitle: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('enforces defaultNotes max length', () => {
    const result = templateFormSchema.safeParse({
      ...validTemplate,
      defaultNotes: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('enforces defaultValidDays range', () => {
    expect(templateFormSchema.safeParse({ ...validTemplate, defaultValidDays: 0 }).success).toBe(
      false,
    );
    expect(templateFormSchema.safeParse({ ...validTemplate, defaultValidDays: 366 }).success).toBe(
      false,
    );
    expect(templateFormSchema.safeParse({ ...validTemplate, defaultValidDays: 1 }).success).toBe(
      true,
    );
    expect(templateFormSchema.safeParse({ ...validTemplate, defaultValidDays: 365 }).success).toBe(
      true,
    );
  });

  it('allows null defaultValidDays', () => {
    const result = templateFormSchema.safeParse({ ...validTemplate, defaultValidDays: null });
    expect(result.success).toBe(true);
  });

  it('enforces defaultDepositPercent range', () => {
    expect(
      templateFormSchema.safeParse({ ...validTemplate, defaultDepositPercent: -1 }).success,
    ).toBe(false);
    expect(
      templateFormSchema.safeParse({ ...validTemplate, defaultDepositPercent: 101 }).success,
    ).toBe(false);
    expect(
      templateFormSchema.safeParse({ ...validTemplate, defaultDepositPercent: 0 }).success,
    ).toBe(true);
    expect(
      templateFormSchema.safeParse({ ...validTemplate, defaultDepositPercent: 100 }).success,
    ).toBe(true);
  });

  it('coerces string numbers', () => {
    const result = templateFormSchema.safeParse({
      ...validTemplate,
      defaultValidDays: '30',
      defaultDepositPercent: '25',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defaultValidDays).toBe(30);
      expect(result.data.defaultDepositPercent).toBe(25);
    }
  });

  it('accepts minimal template with only name', () => {
    const result = templateFormSchema.safeParse({ name: 'Minimal Template' });
    expect(result.success).toBe(true);
  });
});
