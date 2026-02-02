import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Demo
  DEMO_USER_ID: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
});

// Validate at import time — will throw if required vars are missing
export const env = envSchema.parse(process.env);
