# QuoteCraft — Project Kickoff Brief

## Overview

**Project:** QuoteCraft — A modern quote builder for freelancers and contractors

**Purpose:** Portfolio project to demonstrate full-stack skills, specifically:

- Complex form state and real-time pricing logic (mirrors CPQ experience)
- Stripe payment integration
- Auth with public/private routes
- Testing and CI/CD (filling resume gaps)

**Timeline:** 4 weeks to deployed MVP

**Live Demo Required:** Recruiters will visit this — needs a "Try Demo" button that works without sign-up.

---

## Tech Stack (Locked In)

| Layer        | Technology                      | Notes                                                                                           |
| ------------ | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| Framework    | Next.js 15.2.3+ (App Router)    | Pin to 15.2.3+ (CVE-2025-29927 middleware bypass patched). Use Server Components where possible |
| Language     | TypeScript                      | Strict mode                                                                                     |
| Styling      | Tailwind CSS + shadcn/ui        | Use pnpm to avoid React 19 peer dep conflicts with npm                                          |
| Database     | Supabase (PostgreSQL)           | Free tier (500MB)                                                                               |
| ORM          | Drizzle ORM                     | Type-safe. Use `prepare: false` if using Supabase Transaction pool mode                         |
| Auth         | Clerk                           | Free tier (10K MAU). Defense-in-depth: check auth at data layer, not just middleware            |
| Payments     | Stripe Checkout                 | Test mode for demo                                                                              |
| Pricing Math | Decimal.js                      | Avoid JavaScript floating-point errors in all pricing calculations                              |
| Testing      | Vitest (unit), Playwright (e2e) | Vitest cannot test async Server Components — use Playwright for those                           |
| CI/CD        | GitHub Actions                  | Run tests on PR                                                                                 |
| Deployment   | Vercel                          | Free tier                                                                                       |

---

## Core Features (MVP Only)

### 1. Quote Builder

- Add/remove/reorder line items
- Three pricing types: hourly, fixed, per-unit (with unit label)
- Quantity and optional discount per line
- Real-time total calculation (using Decimal.js)
- Auto-generated quote number (QC-2026-0001 format)
- Notes field for terms/payment instructions
- Save as draft or mark as sent
- Quotes freeze on send (status must be reverted to draft to edit)

### 2. Dashboard

- List all quotes with status filter (draft, sent, accepted, paid)
- Quick actions: edit, duplicate, delete, copy share link

### 3. Shareable Quote Links

- Public URL for each quote (no auth required to view)
- Professional quote view with business branding
- Enforce expiration: block accept/pay after `validUntil` with "This quote has expired" message
- Accept/decline buttons for client
- Stripe Checkout for deposit payment

### 4. Demo Mode

- "Try Demo" button on landing page
- Signs into pre-seeded demo account via Clerk Sign-In Tokens
- Shows sample quotes in various states
- Demo banner displayed throughout
- Test card info shown on payment screen

---

## Architectural Decisions

### Quote Locking on Send

When a quote's status changes from `draft` to `sent`, it becomes read-only. To edit, the user must explicitly revert it to `draft` status. This prevents confusing the client with a moving target after they've received the link. The `version` field increments on every save for optimistic concurrency control.

### Email Notifications — Deferred to Phase 2

MVP uses manual share link copy/paste. No automated email delivery. The schema includes `clientEmail` for Phase 2 integration with Resend or similar. This keeps MVP scope tight and avoids adding another external service.

### PDF Export — Deferred to Phase 2

Common request from clients, but not required for portfolio demo. The public quote view serves as the "printable" format for MVP. Phase 2 can add server-side PDF generation via `@react-pdf/renderer`.

### Currency — USD Only, Schema-Ready

MVP displays USD only. Schema includes a `currency` field defaulting to `'USD'` so no migration is needed when multi-currency is added later. All display uses `Intl.NumberFormat('en-US', { style: 'currency', currency })`.

### Quote Expiration — Enforced

Public quote view checks `validUntil`. If expired, accept/pay buttons are disabled and a clear "This quote expired on [date]" message is shown. The quote is still viewable for reference.

### Server Actions over API Routes for Mutations

Use Next.js Server Actions (`'use server'`) for all CRUD operations (create, update, delete, duplicate quotes). This keeps auth context automatically available and reduces boilerplate vs. API routes. Reserve API routes for webhooks and Stripe checkout session creation (which need raw request access).

---

## Database Schema (Drizzle + Supabase)

```typescript
// lib/db/schema.ts

import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  integer,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table (synced from Clerk via webhook)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull(),
  businessName: text('business_name'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
    quoteNumber: text('quote_number').notNull().unique(), // e.g., "QC-2026-0001"
    title: text('title').notNull(),
    clientName: text('client_name').notNull(),
    clientEmail: text('client_email'),
    status: text('status', {
      enum: ['draft', 'sent', 'accepted', 'declined', 'paid'],
    })
      .default('draft')
      .notNull(),
    notes: text('notes'), // Terms, payment instructions, internal notes
    currency: text('currency').default('USD').notNull(),

    // Versioning
    version: integer('version').default(1).notNull(), // Optimistic concurrency control

    // Dates
    validUntil: timestamp('valid_until'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),

    // Payment
    depositPercent: integer('deposit_percent').default(0).notNull(), // 0-100
    stripeSessionId: text('stripe_session_id'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    paidAt: timestamp('paid_at'),

    // Public sharing
    shareToken: text('share_token').unique().notNull(), // Generated via nanoid()
  },
  (table) => [
    check(
      'deposit_percent_range',
      sql`${table.depositPercent} >= 0 AND ${table.depositPercent} <= 100`,
    ),
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

    rate: numeric('rate', { precision: 10, scale: 2 }).notNull(), // Price per unit/hour or fixed price
    quantity: numeric('quantity', { precision: 10, scale: 2 }).default('1').notNull(),
    discount: numeric('discount', { precision: 5, scale: 2 }).default('0').notNull(), // Percentage

    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    check('discount_range', sql`${table.discount} >= 0 AND ${table.discount} <= 100`),
    check('quantity_positive', sql`${table.quantity} > 0`),
    check('rate_non_negative', sql`${table.rate} >= 0`),
  ],
);

// Indexes
export const quotesUserIdIdx = index('quotes_user_id_idx').on(quotes.userId);
export const quotesShareTokenIdx = index('quotes_share_token_idx').on(quotes.shareToken);
export const quotesStatusIdx = index('quotes_status_idx').on(quotes.status);
export const lineItemsQuoteIdIdx = index('line_items_quote_id_idx').on(lineItems.quoteId);
```

### Database Triggers (apply via Drizzle migration SQL)

```sql
-- Auto-update updatedAt on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Quote Number Generation

Quote numbers are generated application-side using a deterministic format:

```typescript
// lib/quote-number.ts
// Format: QC-YYYY-NNNN (e.g., QC-2026-0042)
// Query max existing number for user, increment by 1
```

### Share Token Generation

```typescript
// Using nanoid for URL-safe, high-entropy tokens
import { nanoid } from 'nanoid';
const shareToken = nanoid(); // 21 chars, ~126 bits entropy, URL-safe
```

---

## Folder Structure

```
quotecraft/
├── middleware.ts                    # Clerk auth middleware (REQUIRED)
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Auth required, sidebar
│   │   ├── dashboard/page.tsx      # Quote list
│   │   └── quotes/
│   │       ├── new/page.tsx        # Create quote
│   │       └── [id]/
│   │           ├── page.tsx        # View quote (read-only for sent+)
│   │           └── edit/page.tsx   # Edit mode (draft only)
│   ├── q/[shareToken]/             # Public quote view (top-level, no layout group needed)
│   │   ├── page.tsx
│   │   └── success/page.tsx        # Post-payment
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── clerk/route.ts      # Clerk user sync
│   │   │   └── stripe/route.ts     # Payment confirmation (checkout.session.completed)
│   │   ├── checkout/route.ts       # Create Stripe session (server-side amount calc)
│   │   └── demo/
│   │       └── login/route.ts      # Generate Clerk Sign-In Token
│   ├── actions/
│   │   ├── quotes.ts               # Server Actions: create, update, delete, duplicate
│   │   └── line-items.ts           # Server Actions: add, update, remove, reorder
│   ├── layout.tsx
│   └── page.tsx                    # Landing page with "Try Demo" + "Sign Up"
├── components/
│   ├── ui/                         # shadcn components
│   ├── quote-builder/
│   │   ├── quote-form.tsx
│   │   ├── line-item-row.tsx
│   │   └── pricing-summary.tsx
│   ├── dashboard/
│   │   ├── quote-list.tsx
│   │   └── quote-card.tsx
│   └── shared/
│       ├── demo-banner.tsx
│       └── header.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts                # Drizzle client
│   │   ├── schema.ts               # Schema definitions
│   │   └── queries.ts              # Reusable query functions
│   ├── validations/
│   │   ├── quote.ts                # Zod schemas for quote forms + API input
│   │   └── line-item.ts            # Zod schemas for line item validation
│   ├── stripe.ts                   # Stripe client config
│   ├── pricing.ts                  # Calculation logic (uses Decimal.js)
│   ├── quote-number.ts             # Quote number generation
│   ├── constants.ts                # Shared enums, status labels, pricing types
│   └── utils.ts                    # General utilities, formatters
├── tests/
│   ├── unit/
│   │   ├── pricing.test.ts
│   │   └── quote-number.test.ts
│   └── e2e/
│       └── quote-flow.spec.ts
├── .env.local.example
├── drizzle.config.ts
└── package.json
```

---

## Demo Mode Architecture

### How It Works

1. **Landing page** has two CTAs: "Try Demo" and "Sign Up"

2. **"Try Demo" flow (uses Clerk Sign-In Tokens):**
   - Frontend calls `POST /api/demo/login`
   - API route generates a one-time sign-in token:
     ```typescript
     const signInToken = await clerkClient.signInTokens.createSignInToken({
       userId: process.env.DEMO_USER_ID,
       expiresInSeconds: 3600,
     });
     return NextResponse.json({ token: signInToken.token });
     ```
   - Frontend consumes the token client-side:
     ```typescript
     const { signIn, setActive } = useSignIn();
     const res = await fetch('/api/demo/login', { method: 'POST' });
     const { token } = await res.json();
     const attempt = await signIn.create({ strategy: 'ticket', ticket: token });
     if (attempt.status === 'complete') {
       await setActive({ session: attempt.createdSessionId });
       document.cookie = 'demo_mode=true; path=/; max-age=86400';
       router.push('/dashboard');
     }
     ```
   - **MAU impact:** 1 shared demo account = 1 MAU regardless of traffic

3. **Demo account:**
   - Email: `demo@quotecraft.app`
   - Pre-seeded with 4 quotes:
     - Draft quote (editable)
     - Sent quote (awaiting response)
     - Accepted quote (ready for payment)
     - Paid quote (completed)

4. **Demo banner:**
   - Shown when `demo_mode=true` cookie exists
   - "You're in demo mode. Data resets nightly. [Sign up for free →]"

5. **Stripe test mode:**
   - Demo always uses test keys
   - Show test card number on checkout: `4242 4242 4242 4242`

6. **Rate limiting:**
   - `/api/demo/login` limited to 10 requests per IP per hour
   - Prevents abuse of sign-in token generation

### Demo Reset Strategy

Nightly cron job resets demo account data:

- Vercel Cron triggers `POST /api/cron/reset-demo` at 2:00 AM UTC
- Deletes all quotes for demo user
- Re-seeds the 4 sample quotes with line items
- Simple, predictable, no user confusion

---

## Environment Variables

```env
# .env.local.example

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
DATABASE_URL=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Demo
DEMO_USER_ID=user_xxx
```

---

## Week 1 Tasks

### Day 1-2: Project Setup

- [ ] Create GitHub repo (private initially)
- [ ] Initialize Next.js 15.2.3+ with TypeScript (pnpm)
- [ ] Set up Tailwind CSS + shadcn/ui
- [ ] Configure ESLint + Prettier
- [ ] Install Decimal.js, nanoid, zod
- [ ] Create Supabase project
- [ ] Set up Drizzle ORM with schema (including CHECK constraints and triggers)
- [ ] Run initial migration
- [ ] Set up environment variable validation with Zod

### Day 3-4: Auth Setup

- [ ] Create Clerk application
- [ ] Add `middleware.ts` with `clerkMiddleware()` and explicit route protection
- [ ] Implement Clerk provider in root layout
- [ ] Create sign-in/sign-up pages
- [ ] Set up Clerk webhook for user sync (`/api/webhooks/clerk`)
- [ ] Add data-layer auth checks in query functions (defense-in-depth)
- [ ] Test auth flow end-to-end

### Day 5-7: Basic Quote CRUD

- [ ] Create dashboard layout with sidebar
- [ ] Build quote list page (empty state first)
- [ ] Create "New Quote" form with Zod validation
- [ ] Implement Server Actions for quote CRUD
- [ ] Auto-generate quote numbers and share tokens on create
- [ ] Display quotes on dashboard with status filter
- [ ] Add edit (draft only), duplicate, and delete functionality

**End of Week 1:** User can sign up, create a quote with line items, see it on dashboard, and duplicate/delete quotes.

---

## Pricing Calculation Logic

```typescript
// lib/pricing.ts
import Decimal from 'decimal.js';

export type PricingType = 'hourly' | 'fixed' | 'per_unit';

export interface LineItem {
  description: string;
  pricingType: PricingType;
  rate: number;
  quantity: number;
  discount: number; // Percentage (0-100)
}

export interface QuotePricing {
  subtotal: number;
  lineItemTotals: number[];
  depositAmount: number;
  total: number;
}

export function calculateLineItemTotal(item: LineItem): number {
  const rate = new Decimal(item.rate);
  const quantity = new Decimal(item.quantity);
  const discount = new Decimal(item.discount);

  const baseTotal = rate.times(quantity);
  const discountAmount = baseTotal.times(discount.dividedBy(100));
  return baseTotal.minus(discountAmount).toDecimalPlaces(2).toNumber();
}

export function calculateQuotePricing(
  lineItems: LineItem[],
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

/** Convert dollar amount to Stripe cents (integer) */
export function toStripeCents(amount: number): number {
  return new Decimal(amount).times(100).round().toNumber();
}
```

---

## Stripe Webhook Handler

The `/api/webhooks/stripe` route handles payment confirmation:

```typescript
// app/api/webhooks/stripe/route.ts
// 1. Verify webhook signature using STRIPE_WEBHOOK_SECRET
// 2. Use req.text() to get raw body (prevents Next.js auto-parsing)
// 3. Handle event: checkout.session.completed
//    - Extract quoteId from session.metadata
//    - Update quote: status = 'paid', paidAt = now(), stripePaymentIntentId = session.payment_intent
// 4. Return 200 OK
//
// Stripe Checkout session creation (/api/checkout) MUST:
//    - Calculate deposit amount server-side (never trust client amount)
//    - Include metadata: { quoteId, userId }
//    - Use toStripeCents() for amount conversion
```

---

## Testing Strategy

### Unit Tests (Vitest)

- Pricing calculation logic with Decimal.js (critical path)
- Quote number generation
- Zod validation schemas
- Utility/formatter functions

### E2E Tests (Playwright)

- Full quote creation flow
- Quote status transitions (draft → sent → accepted)
- Public quote view and accept/decline
- Quote expiration enforcement
- Stripe checkout flow (test mode)

### CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

---

## Success Criteria

By end of Week 4, the project should:

1. **Work end-to-end:** Create quote → Share link → Client accepts → Pays deposit → Status updates
2. **Demo mode:** Recruiter clicks "Try Demo" and sees it work in <30 seconds
3. **Test coverage:** Unit tests for pricing + validation, e2e for critical path
4. **CI/CD:** Tests run on every PR, auto-deploy to Vercel on merge
5. **Professional UI:** Clean, polished, responsive
6. **Documentation:** README with screenshots, local setup instructions

---

## Phase 2 Backlog (Post-MVP)

1. **Email notifications** — Send quote via email using Resend, payment receipts
2. **PDF export** — Downloadable quote PDFs via `@react-pdf/renderer`
3. **Quote templates** — Pre-built templates for common services
4. **Branding customization** — Logo upload, color scheme (Supabase Storage)
5. **Multi-currency** — Schema already supports `currency` field
6. **Quote view analytics** — Track when clients view shared links
7. **Search** — Full-text search across quotes by title/client name

---

## Getting Started

Begin with Week 1, Day 1-2 tasks: project setup.

> "Let's begin with Week 1, Day 1-2 tasks: project setup."
