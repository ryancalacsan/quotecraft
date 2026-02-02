import { z } from 'zod';

import { PRICING_TYPES } from '@/lib/constants';

export const lineItemSchema = z
  .object({
    description: z.string().min(1, 'Description is required').max(500),
    pricingType: z.enum(PRICING_TYPES),
    unit: z.string().max(50).optional(),
    rate: z.coerce.number().min(0, 'Rate must be non-negative'),
    quantity: z.coerce.number().positive('Quantity must be greater than 0').default(1),
    discount: z.coerce.number().min(0).max(100, 'Discount must be 0-100%').default(0),
    sortOrder: z.coerce.number().int().min(0).default(0),
  })
  .refine((data) => data.pricingType !== 'per_unit' || (data.unit && data.unit.length > 0), {
    message: 'Unit is required for per-unit pricing',
    path: ['unit'],
  });

export type LineItemFormValues = z.infer<typeof lineItemSchema>;
