import { z } from 'zod';

import { QUOTE_STATUSES } from '@/lib/constants';

export const quoteFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  clientName: z.string().min(1, 'Client name is required').max(200),
  clientEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  notes: z.string().max(5000).optional(),
  validUntil: z.string().optional(), // ISO date string from form input
  depositPercent: z.coerce.number().int().min(0).max(100).default(0),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export const quoteStatusSchema = z.enum(QUOTE_STATUSES);
