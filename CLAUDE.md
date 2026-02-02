# QuoteCraft — Project Memory

> This file is read by Claude Code at the start of every session.
> It is the source of truth for conventions, decisions, and current state.
> The full project brief lives in `QuoteCraft-Project-Brief.md`.

## Project

QuoteCraft — A modern quote builder for freelancers and contractors.
Portfolio project demonstrating full-stack skills: complex form state, real-time pricing, Stripe payments, auth, testing, CI/CD.

## Tech Stack

| Layer           | Technology               | Version/Notes                                                  |
| --------------- | ------------------------ | -------------------------------------------------------------- |
| Framework       | Next.js (App Router)     | v16.1.6 (upgraded from planned 15.2.3+)                        |
| Language        | TypeScript               | Strict mode                                                    |
| Package Manager | pnpm                     | Required — avoids React 19 peer dep issues with shadcn/ui      |
| Styling         | Tailwind CSS + shadcn/ui |                                                                |
| Database        | Supabase (PostgreSQL)    | Free tier                                                      |
| ORM             | Drizzle ORM              | `prepare: false` if using Supabase Transaction pool mode       |
| Auth            | Clerk                    | Free tier (10K MAU)                                            |
| Payments        | Stripe Checkout          | Test mode for demo                                             |
| Pricing Math    | Decimal.js               | All monetary calculations — never use native JS math for money |
| Validation      | Zod                      | Forms + API input                                              |
| Share Tokens    | nanoid                   | 21 chars, ~126 bits entropy, URL-safe                          |
| Unit Tests      | Vitest                   | Cannot test async Server Components — use Playwright for those |
| E2E Tests       | Playwright               |                                                                |
| CI/CD           | GitHub Actions           | pnpm, Node 20                                                  |
| Deployment      | Vercel                   | Free tier                                                      |

## Conventions

### Code Style

- TypeScript strict mode, no `any`
- pnpm for all package operations
- Prefer Server Components; add `'use client'` only when needed
- Use Server Actions (`'use server'`) for all CRUD mutations (quotes, line items)
- Reserve API routes (`app/api/`) only for: webhooks (Clerk, Stripe), Stripe checkout session creation, demo login
- Zod schemas in `lib/validations/` for all form and API input validation
- Currency display: `Intl.NumberFormat('en-US', { style: 'currency', currency })`
- All pricing math uses `Decimal.js` — convert to Stripe cents with `toStripeCents()`

### Auth

- Clerk middleware in `proxy.ts` at project root (Next.js 16 convention, replaces `middleware.ts`)
- `clerkMiddleware()` does NOT protect routes by default — explicitly opt in
- Defense-in-depth: always verify auth at the data layer (in queries/actions), not just middleware
- Demo mode uses Clerk Sign-In Tokens (`strategy: 'ticket'`), not server-side session creation

### Database

- Schema in `lib/db/schema.ts`
- CHECK constraints enforced at DB level: discount 0-100, quantity > 0, rate >= 0, deposit_percent 0-100
- `updatedAt` columns use PostgreSQL triggers (Drizzle doesn't auto-update)
- Quote numbers generated application-side: `QC-YYYY-NNNN`
- Share tokens generated via `nanoid()` on quote creation
- Cascade delete: line items deleted when parent quote is deleted

### Stripe

- Checkout amounts calculated server-side — never trust client-provided amounts
- Webhook handler uses `req.text()` for raw body (prevents Next.js auto-parsing)
- Verify webhook signature with `STRIPE_WEBHOOK_SECRET`
- Store both `stripeSessionId` and `stripePaymentIntentId`
- Include `{ quoteId, userId }` in Stripe session metadata

### Quotes

- Quotes freeze when status leaves `draft` — must revert to `draft` to edit
- `version` field increments on every save (optimistic concurrency)
- Public view enforces `validUntil` expiration — disables accept/pay with clear message
- Duplication deep-copies all line items

## Architectural Decisions

| #   | Decision                                     | Rationale                                                                 |
| --- | -------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Server Actions over API routes for mutations | Simpler, auto-available auth context, less boilerplate                    |
| 2   | Quote locking on send                        | Prevents confusing clients with moving target after they receive the link |
| 3   | Decimal.js for pricing                       | JavaScript floating-point errors are unacceptable for money               |
| 4   | nanoid for share tokens                      | URL-safe, high entropy, no enumeration risk                               |
| 5   | Clerk Sign-In Tokens for demo                | Only viable programmatic sign-in method; 1 MAU regardless of traffic      |
| 6   | Nightly cron reset for demo data             | Simplest approach; Vercel Cron at 2am UTC                                 |
| 7   | USD only, schema-ready for multi-currency    | `currency` field defaults to `'USD'`; no migration needed later           |
| 8   | Email notifications deferred to Phase 2      | Keeps MVP scope tight; manual share link copy for now                     |
| 9   | PDF export deferred to Phase 2               | Public quote view serves as printable format for MVP                      |
| 10  | Quote expiration enforced on public view     | Expired quotes are viewable but accept/pay disabled                       |
| 11  | pnpm over npm                                | Avoids React 19 peer dependency conflicts with shadcn/ui                  |
| 12  | Next.js 16 instead of 15                     | Latest stable; same App Router patterns; all security patches included    |
| 13  | proxy.ts instead of middleware.ts             | Next.js 16 deprecates middleware.ts; Clerk SDK supports proxy.ts          |

## Project Structure

```
quotecraft/
├── proxy.ts                         # Clerk auth (Next.js 16 convention)
├── app/
│   ├── (auth)/                       # Sign-in/sign-up pages
│   ├── (dashboard)/                  # Protected routes: dashboard, quote CRUD
│   ├── q/[shareToken]/               # Public quote view + payment success
│   ├── api/
│   │   ├── webhooks/{clerk,stripe}/  # Webhook handlers
│   │   ├── checkout/                 # Stripe session creation
│   │   └── demo/login/              # Sign-In Token generation
│   └── actions/                      # Server Actions for CRUD
├── components/
│   ├── ui/                           # shadcn
│   ├── quote-builder/                # Quote form, line items, pricing summary
│   ├── dashboard/                    # Quote list, quote cards
│   └── shared/                       # Demo banner, header
├── lib/
│   ├── db/                           # Drizzle client, schema, queries
│   ├── validations/                  # Zod schemas
│   ├── pricing.ts                    # Decimal.js calculations
│   ├── quote-number.ts               # QC-YYYY-NNNN generation
│   ├── stripe.ts                     # Stripe client
│   ├── constants.ts                  # Enums, labels
│   └── utils.ts                      # General utilities
└── tests/
    ├── unit/                         # Vitest
    └── e2e/                          # Playwright
```

## Progress

### Current Phase: Week 2 — Quote Builder & Public View

- [x] Project brief finalized
- [x] Architectural decisions documented
- [x] Initialize Next.js 16 with TypeScript (pnpm)
- [x] Set up Tailwind CSS v4 + shadcn/ui (button, input, select, card, badge, table, dialog, dropdown-menu, label, textarea, separator, sonner)
- [x] Configure ESLint + Prettier (with tailwindcss plugin)
- [x] Install core deps (decimal.js, nanoid, zod)
- [x] Set up Drizzle ORM with full schema (CHECK constraints, indexes, triggers, type exports)
- [x] Create lib scaffolding (pricing.ts, quote-number.ts, constants.ts, validations/, env.ts, utils.ts)
- [x] Create .env.local.example
- [x] Supabase project created, schema pushed, triggers applied
- [x] Clerk application created, keys configured
- [x] proxy.ts with clerkMiddleware + public/protected route matching
- [x] ClerkProvider in root layout
- [x] Sign-in / sign-up pages
- [x] Dashboard layout with sidebar + UserButton
- [x] Dashboard page with server-side auth check
- [x] Clerk webhook route for user sync (user.created, user.updated, user.deleted)
- [x] Server Actions: createQuote, updateQuote, deleteQuote, duplicateQuote, updateQuoteStatus
- [x] Server Actions: addLineItem, updateLineItem, removeLineItem
- [x] Quote list with status filter tabs + empty state
- [x] QuoteCard with dropdown menu (edit, copy link, duplicate, delete)
- [x] New quote form page (/quotes/new)
- [x] Quote view page (/quotes/[id]) with client info, line items, pricing summary, status actions
- [x] Quote edit page (/quotes/[id]/edit) with client-side line item management
- [x] QuoteForm component (metadata fields + inline line item editing)
- [x] LineItemRow component (description, pricing type, rate, qty, discount, total)
- [x] PricingSummary component (subtotal, deposit, total)
- [x] QuoteStatusActions component (mark as sent, accept, decline)
- [ ] Set up Clerk webhook in dashboard (needs deployed URL or ngrok)
- [ ] Test full auth flow in browser (sign up → user synced to DB → dashboard)

### Week 1

- [x] Day 1-2: Project setup (Next.js, Tailwind, shadcn/ui, Drizzle, Supabase)
- [x] Day 3-4: Auth setup (Clerk, proxy.ts, webhook, protected routes)
- [x] Day 5-7: Basic quote CRUD (dashboard, Server Actions, quote form, view/edit pages)

### Week 2

- [x] Quote builder with line items and real-time pricing (completed in Week 1 Day 5-7)
- [x] Shareable quote links (public view at /q/[shareToken])
- [x] Public accept/decline with atomic status transitions and expiration enforcement
- [x] Share link card on authenticated quote view (copy to clipboard, open in new tab)
- [x] Quote status transitions and locking

### Week 3

- [ ] Stripe Checkout integration
- [ ] Stripe webhook handler
- [ ] Demo mode (Sign-In Tokens, seed data, reset cron, banner)

### Week 4

- [ ] Testing (Vitest unit tests, Playwright e2e)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Landing page, polish, responsive design
- [ ] Deploy to Vercel, README with screenshots

## Phase 2 Backlog

- Email notifications (Resend)
- PDF export (@react-pdf/renderer)
- Quote templates
- Branding customization (logo, colors)
- Multi-currency
- Quote view analytics
- Full-text search
