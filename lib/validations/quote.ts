import { z } from 'zod';

import { QUOTE_STATUSES } from '@/lib/constants';

export const quoteFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  clientName: z
    .string()
    .min(1, 'Client name is required')
    .max(200, 'Client name must be 200 characters or less'),
  clientEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').optional(),
  validUntil: z.string().optional(), // ISO date string from form input
  depositPercent: z.coerce
    .number()
    .int('Deposit must be a whole number')
    .min(0, 'Deposit cannot be negative')
    .max(100, 'Deposit cannot exceed 100%')
    .default(0),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export const quoteStatusSchema = z.enum(QUOTE_STATUSES);
