import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// Users table (synced from Clerk via webhook)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull(),
  businessName: text('business_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Quotes table
export const quotes = pgTable(
  'quotes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),

    // Quote metadata
    quoteNumber: text('quote_number').notNull().unique(),
    title: text('title').notNull(),
    clientName: text('client_name').notNull(),
    clientEmail: text('client_email'),
    status: text('status', {
      enum: ['draft', 'sent', 'accepted', 'declined', 'paid'],
    })
      .default('draft')
      .notNull(),
    notes: text('notes'),
    currency: text('currency').default('USD').notNull(),

    // Versioning
    version: integer('version').default(1).notNull(),

    // Dates
    validUntil: timestamp('valid_until'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),

    // Payment
    depositPercent: integer('deposit_percent').default(0).notNull(),
    stripeSessionId: text('stripe_session_id'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    paidAt: timestamp('paid_at'),

    // Public sharing
    shareToken: text('share_token').unique().notNull(),

    // Demo session isolation (null for real users)
    demoSessionId: text('demo_session_id'),
  },
  (table) => [
    check(
      'deposit_percent_range',
      sql`${table.depositPercent} >= 0 AND ${table.depositPercent} <= 100`,
    ),
    index('quotes_user_id_idx').on(table.userId),
    index('quotes_share_token_idx').on(table.shareToken),
    index('quotes_status_idx').on(table.status),
    index('quotes_demo_session_idx').on(table.demoSessionId),
  ],
);

// Line items table
export const lineItems = pgTable(
  'line_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quoteId: uuid('quote_id')
      .notNull()
      .references(() => quotes.id, { onDelete: 'cascade' }),

    description: text('description').notNull(),
    pricingType: text('pricing_type', {
      enum: ['hourly', 'fixed', 'per_unit'],
    }).notNull(),
    unit: text('unit'), // e.g., "hours", "pages", "widgets" — required for per_unit type

    rate: numeric('rate', { precision: 10, scale: 2 }).notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).default('1').notNull(),
    discount: numeric('discount', { precision: 5, scale: 2 }).default('0').notNull(),

    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    check('discount_range', sql`${table.discount} >= 0 AND ${table.discount} <= 100`),
    check('quantity_positive', sql`${table.quantity} > 0`),
    check('rate_non_negative', sql`${table.rate} >= 0`),
    index('line_items_quote_id_idx').on(table.quoteId),
  ],
);

// Templates table
export const templates = pgTable(
  'templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),

    name: text('name').notNull(),
    description: text('description'),

    // Default values for quotes created from this template
    defaultTitle: text('default_title'),
    defaultNotes: text('default_notes'),
    defaultValidDays: integer('default_valid_days'),
    defaultDepositPercent: integer('default_deposit_percent').default(0),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    check(
      'template_deposit_percent_range',
      sql`${table.defaultDepositPercent} >= 0 AND ${table.defaultDepositPercent} <= 100`,
    ),
    index('templates_user_id_idx').on(table.userId),
  ],
);

// Template line items table
export const templateItems = pgTable(
  'template_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    templateId: uuid('template_id')
      .notNull()
      .references(() => templates.id, { onDelete: 'cascade' }),

    description: text('description').notNull(),
    pricingType: text('pricing_type', {
      enum: ['hourly', 'fixed', 'per_unit'],
    }).notNull(),
    unit: text('unit'),

    rate: numeric('rate', { precision: 10, scale: 2 }).notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).default('1').notNull(),
    discount: numeric('discount', { precision: 5, scale: 2 }).default('0').notNull(),

    sortOrder: integer('sort_order').default(0).notNull(),
  },
  (table) => [
    check('template_item_discount_range', sql`${table.discount} >= 0 AND ${table.discount} <= 100`),
    check('template_item_quantity_positive', sql`${table.quantity} > 0`),
    check('template_item_rate_non_negative', sql`${table.rate} >= 0`),
    index('template_items_template_id_idx').on(table.templateId),
  ],
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type QuoteStatus = Quote['status'];

export type LineItem = typeof lineItems.$inferSelect;
export type NewLineItem = typeof lineItems.$inferInsert;
export type PricingType = LineItem['pricingType'];

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;

export type TemplateItem = typeof templateItems.$inferSelect;
export type NewTemplateItem = typeof templateItems.$inferInsert;
