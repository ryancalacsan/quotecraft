/**
 * Test fixtures for QuoteCraft
 *
 * Provides reusable test data factories for quotes, line items, users, and templates.
 * Uses TypeScript types from the schema for type safety.
 */

import type { Quote, LineItem, Template, TemplateItem, User } from '@/lib/db/schema';

// =============================================================================
// USERS
// =============================================================================

export const testUser: User = {
  id: 'test-user-123',
  email: 'test@example.com',
  businessName: 'Test Business',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const demoUser: User = {
  id: 'demo-user-456',
  email: 'demo@quotecraft.app',
  businessName: 'Demo User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// =============================================================================
// QUOTES
// =============================================================================

export const draftQuote: Quote = {
  id: 'quote-uuid-draft',
  userId: testUser.id,
  quoteNumber: 'QC-2024-0001',
  title: 'Test Quote',
  clientName: 'Test Client',
  clientEmail: 'client@example.com',
  status: 'draft',
  notes: 'Test notes',
  currency: 'USD',
  version: 1,
  validUntil: new Date('2030-12-31'), // Far future date for testing
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  depositPercent: 25,
  stripeSessionId: null,
  stripePaymentIntentId: null,
  paidAt: null,
  shareToken: 'abc123XYZ',
  demoSessionId: null,
};

export const sentQuote: Quote = {
  ...draftQuote,
  id: 'quote-uuid-sent',
  quoteNumber: 'QC-2024-0002',
  status: 'sent',
  shareToken: 'sent123XYZ',
};

export const acceptedQuote: Quote = {
  ...draftQuote,
  id: 'quote-uuid-accepted',
  quoteNumber: 'QC-2024-0003',
  status: 'accepted',
  shareToken: 'accepted123',
};

export const declinedQuote: Quote = {
  ...draftQuote,
  id: 'quote-uuid-declined',
  quoteNumber: 'QC-2024-0004',
  status: 'declined',
  shareToken: 'declined123',
};

export const paidQuote: Quote = {
  ...draftQuote,
  id: 'quote-uuid-paid',
  quoteNumber: 'QC-2024-0005',
  status: 'paid',
  shareToken: 'paid123XYZ',
  stripeSessionId: 'cs_test_123',
  stripePaymentIntentId: 'pi_test_123',
  paidAt: new Date('2024-06-15'),
};

export const expiredQuote: Quote = {
  ...sentQuote,
  id: 'quote-uuid-expired',
  quoteNumber: 'QC-2024-0006',
  shareToken: 'expired123',
  validUntil: new Date('2020-01-01'), // In the past
};

export const demoQuote: Quote = {
  ...draftQuote,
  id: 'quote-uuid-demo',
  quoteNumber: 'DEMO-abc123-2024-0001',
  demoSessionId: 'demo-session-abc123',
  shareToken: 'demo123XYZ',
};

// =============================================================================
// LINE ITEMS
// =============================================================================

export const fixedLineItem: LineItem = {
  id: 'line-item-fixed',
  quoteId: draftQuote.id,
  description: 'Website Design',
  pricingType: 'fixed',
  unit: null,
  rate: '1500.00',
  quantity: '1',
  discount: '0',
  sortOrder: 0,
  createdAt: new Date('2024-01-01'),
};

export const hourlyLineItem: LineItem = {
  id: 'line-item-hourly',
  quoteId: draftQuote.id,
  description: 'Development Work',
  pricingType: 'hourly',
  unit: null,
  rate: '100.00',
  quantity: '40',
  discount: '0',
  sortOrder: 1,
  createdAt: new Date('2024-01-01'),
};

export const perUnitLineItem: LineItem = {
  id: 'line-item-per-unit',
  quoteId: draftQuote.id,
  description: 'Additional Pages',
  pricingType: 'per_unit',
  unit: 'pages',
  rate: '75.00',
  quantity: '5',
  discount: '10',
  sortOrder: 2,
  createdAt: new Date('2024-01-01'),
};

export const discountedLineItem: LineItem = {
  ...fixedLineItem,
  id: 'line-item-discounted',
  description: 'Discounted Service',
  discount: '20',
  sortOrder: 3,
};

// =============================================================================
// TEMPLATES
// =============================================================================

export const testTemplate: Template = {
  id: 'template-uuid-1',
  userId: testUser.id,
  name: 'Web Development Package',
  description: 'Standard web development template',
  defaultTitle: 'Web Development Project',
  defaultNotes: 'Thank you for your business!',
  defaultValidDays: 30,
  defaultDepositPercent: 25,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const minimalTemplate: Template = {
  id: 'template-uuid-2',
  userId: testUser.id,
  name: 'Minimal Template',
  description: null,
  defaultTitle: null,
  defaultNotes: null,
  defaultValidDays: null,
  defaultDepositPercent: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// =============================================================================
// TEMPLATE ITEMS
// =============================================================================

export const testTemplateItem: TemplateItem = {
  id: 'template-item-1',
  templateId: testTemplate.id,
  description: 'Website Design',
  pricingType: 'fixed',
  unit: null,
  rate: '1500.00',
  quantity: '1',
  discount: '0',
  sortOrder: 0,
};

export const hourlyTemplateItem: TemplateItem = {
  id: 'template-item-2',
  templateId: testTemplate.id,
  description: 'Development Hours',
  pricingType: 'hourly',
  unit: null,
  rate: '100.00',
  quantity: '20',
  discount: '0',
  sortOrder: 1,
};

// =============================================================================
// FORM DATA HELPERS
// =============================================================================

/**
 * Creates a FormData object from a plain object.
 * Useful for testing Server Actions that accept FormData.
 */
export function createFormData(data: Record<string, string | number | null | undefined>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      formData.set(key, String(value));
    }
  }
  return formData;
}

/**
 * Valid quote form data for creating/updating quotes
 */
export const validQuoteFormData = {
  title: 'Test Quote',
  clientName: 'Test Client',
  clientEmail: 'client@example.com',
  notes: 'Test notes',
  validUntil: '2025-12-31',
  depositPercent: '25',
};

/**
 * Valid line item form data
 */
export const validLineItemFormData = {
  description: 'Test Service',
  pricingType: 'fixed',
  unit: '',
  rate: '100.00',
  quantity: '1',
  discount: '0',
  sortOrder: '0',
};

/**
 * Valid hourly line item form data
 */
export const validHourlyLineItemFormData = {
  description: 'Development Work',
  pricingType: 'hourly',
  unit: '',
  rate: '150.00',
  quantity: '10',
  discount: '5',
  sortOrder: '0',
};

/**
 * Valid per-unit line item form data
 */
export const validPerUnitLineItemFormData = {
  description: 'Additional Pages',
  pricingType: 'per_unit',
  unit: 'pages',
  rate: '50.00',
  quantity: '3',
  discount: '0',
  sortOrder: '0',
};

/**
 * Valid template form data
 */
export const validTemplateFormData = {
  name: 'Test Template',
  description: 'A test template',
  defaultTitle: 'Default Title',
  defaultNotes: 'Default notes',
  defaultValidDays: '30',
  defaultDepositPercent: '25',
};

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Creates a quote with custom overrides
 */
export function createQuote(overrides: Partial<Quote> = {}): Quote {
  return { ...draftQuote, ...overrides };
}

/**
 * Creates a line item with custom overrides
 */
export function createLineItem(overrides: Partial<LineItem> = {}): LineItem {
  return { ...fixedLineItem, ...overrides };
}

/**
 * Creates a template with custom overrides
 */
export function createTemplate(overrides: Partial<Template> = {}): Template {
  return { ...testTemplate, ...overrides };
}

/**
 * Creates a template item with custom overrides
 */
export function createTemplateItem(overrides: Partial<TemplateItem> = {}): TemplateItem {
  return { ...testTemplateItem, ...overrides };
}
