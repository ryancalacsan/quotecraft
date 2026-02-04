import { z } from 'zod';

import { PRICING_TYPES } from '@/lib/constants';

export const lineItemSchema = z
  .object({
    description: z
      .string()
      .min(1, 'Description is required')
      .max(500, 'Description must be 500 characters or less'),
    pricingType: z.enum(PRICING_TYPES, 'Please select a pricing type'),
    unit: z.string().max(50, 'Unit must be 50 characters or less').optional(),
    rate: z.coerce.number().min(0, 'Rate cannot be negative'),
    quantity: z.coerce.number().positive('Quantity must be greater than 0').default(1),
    discount: z.coerce
      .number()
      .min(0, 'Discount cannot be negative')
      .max(100, 'Discount cannot exceed 100%')
      .default(0),
    sortOrder: z.coerce.number().int().min(0).default(0),
  })
  .refine((data) => data.pricingType !== 'per_unit' || (data.unit && data.unit.length > 0), {
    message: 'Unit is required for per-unit pricing',
    path: ['unit'],
  });

export type LineItemFormValues = z.infer<typeof lineItemSchema>;
