# QuoteCraft

[![CI](https://github.com/ryancalacsan/quotecraft/actions/workflows/ci.yml/badge.svg)](https://github.com/ryancalacsan/quotecraft/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/ryancalacsan/quotecraft/graph/badge.svg)](https://codecov.io/gh/ryancalacsan/quotecraft)

A modern quote builder for freelancers and contractors. Create professional quotes, share them with clients via unique links, accept payments through Stripe, and track everything from a clean dashboard.

Built as a portfolio project demonstrating full-stack skills: complex form state, real-time pricing with Decimal.js, Stripe Checkout, Clerk auth, PDF generation, data visualization, and CI/CD.

**[Try the Live Demo](https://quotecraft-taupe.vercel.app)** — no signup required, explore instantly

![QuoteCraft Dashboard](./public/screenshot-dashboard.png)

## Features

### Core

- **Quote Builder** — Create quotes with multiple line items, pricing types (fixed, hourly, per-unit), discounts, and deposit percentages
- **Real-Time Pricing** — Live subtotal, deposit, and total calculations powered by Decimal.js (no floating-point errors)
- **Shareable Links** — Each quote gets a unique public URL for client review
- **Client Actions** — Clients can accept, decline, or pay quotes directly from the public link
- **Stripe Payments** — Secure checkout for deposits or full amounts via Stripe Checkout
- **Quote Lifecycle** — Draft, Sent, Accepted, Declined, Paid statuses with locking on send

### Advanced

- **PDF Export** — Download professional PDF versions of quotes for offline sharing
- **Dashboard Analytics** — Revenue charts, conversion rates, and quote status breakdown
- **Quote Templates** — Save and reuse quote templates to speed up your workflow
- **Drag-and-Drop** — Reorder line items with accessible drag-and-drop
- **Dark Mode** — System-aware theme with manual toggle

### Polish

- **Demo Mode** — Explore the full app instantly with pre-seeded data
- **Responsive Design** — Desktop sidebar + mobile slide-out nav
- **Accessibility** — ARIA labels, keyboard navigation, screen reader support

## Tech Stack

| Layer          | Technology               |
| -------------- | ------------------------ |
| Framework      | Next.js 16 (App Router)  |
| Language       | TypeScript (strict)      |
| Styling        | Tailwind CSS + shadcn/ui |
| Database       | Supabase (PostgreSQL)    |
| ORM            | Drizzle ORM              |
| Auth           | Clerk                    |
| Payments       | Stripe Checkout          |
| Pricing Math   | Decimal.js               |
| Validation     | Zod                      |
| PDF Generation | @react-pdf/renderer      |
| Charts         | Recharts                 |
| Drag & Drop    | @dnd-kit                 |
| Theming        | next-themes              |
| Unit Tests     | Vitest (95 tests)        |
| E2E Tests      | Playwright               |
| CI/CD          | GitHub Actions           |
| Deployment     | Vercel                   |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A Supabase project (free tier)
- A Clerk application (free tier)
- A Stripe account (test mode)

### Installation

```bash
git clone https://github.com/ryancalacsan/quotecraft.git
cd quotecraft
pnpm install
```

### Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
```

Required variables:

| Variable                             | Source                          |
| ------------------------------------ | ------------------------------- |
| `DATABASE_URL`                       | Supabase → Settings → Database  |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  | Clerk Dashboard                 |
| `CLERK_SECRET_KEY`                   | Clerk Dashboard                 |
| `STRIPE_SECRET_KEY`                  | Stripe Dashboard                |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard                |
| `STRIPE_WEBHOOK_SECRET`              | Stripe CLI or Dashboard         |
| `NEXT_PUBLIC_APP_URL`                | `http://localhost:3000` for dev |

### Database Setup

```bash
pnpm drizzle-kit push
```

Then apply the `updatedAt` trigger in your Supabase SQL editor (see `lib/db/schema.ts` for the SQL).

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

For Stripe webhooks in development:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Testing

```bash
# Unit tests
pnpm test

# Unit tests in watch mode
pnpm test:watch

# E2E tests (requires dev server)
pnpm test:e2e
```

## Project Structure

```
quotecraft/
├── proxy.ts                         # Clerk auth middleware (Next.js 16)
├── app/
│   ├── (auth)/                      # Sign-in / sign-up pages
│   ├── (dashboard)/                 # Protected: dashboard, quotes, templates
│   ├── q/[shareToken]/              # Public quote view + payment
│   ├── api/
│   │   ├── webhooks/{clerk,stripe}/ # Webhook handlers
│   │   ├── quotes/[id]/pdf/         # PDF generation endpoint
│   │   ├── checkout/                # Stripe session creation
│   │   ├── cron/reset-demo/         # Nightly demo data reset
│   │   └── demo/login/              # Demo sign-in token
│   └── actions/                     # Server Actions (quotes, templates)
├── components/
│   ├── ui/                          # shadcn/ui primitives
│   ├── pdf/                         # PDF document templates
│   ├── quote-builder/               # Quote form, line items, drag-drop
│   ├── dashboard/                   # Quote list, analytics, charts
│   ├── templates/                   # Template CRUD components
│   └── shared/                      # Theme toggle, demo banner
├── lib/
│   ├── db/                          # Drizzle client, schema, queries
│   ├── validations/                 # Zod schemas
│   ├── pricing.ts                   # Decimal.js calculations
│   ├── stripe.ts                    # Stripe client
│   └── utils.ts                     # Formatting helpers
└── tests/
    ├── unit/                        # Vitest (95 tests, 100% coverage)
    └── e2e/                         # Playwright (smoke tests)
```

## Note

This is a portfolio project demonstrating production-quality full-stack development. User registration is disabled — click **"Try Demo"** to explore the full application with pre-seeded sample data. Data resets nightly at 2am UTC.

### Skills Demonstrated

- **Frontend**: React Server Components, complex form state, drag-and-drop, data visualization, dark mode, responsive design
- **Backend**: Server Actions, webhook handling, PDF generation, SQL aggregation queries
- **Infrastructure**: CI/CD pipelines, automated testing, branch protection, Vercel deployment
- **Best Practices**: TypeScript strict mode, Zod validation, Decimal.js for money, accessible UI

## License

MIT
