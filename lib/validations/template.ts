import { z } from 'zod';

export const templateFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  defaultTitle: z.string().max(100, 'Title must be 100 characters or less').optional(),
  defaultNotes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
  defaultValidDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
  defaultDepositPercent: z.coerce.number().int().min(0).max(100).default(0),
});

export type TemplateFormData = z.infer<typeof templateFormSchema>;

// Validation schema for template items (used in updateTemplateItems)
export const templateItemSchema = z
  .object({
    description: z.string().min(1, 'Description is required').max(500),
    pricingType: z.enum(['hourly', 'fixed', 'per_unit']),
    unit: z.string().max(50).optional().nullable(),
    rate: z.coerce.number().min(0, 'Rate must be 0 or greater'),
    quantity: z.coerce.number().positive('Quantity must be greater than 0'),
    discount: z.coerce.number().min(0).max(100, 'Discount must be between 0 and 100'),
  })
  .refine((data) => data.pricingType !== 'per_unit' || (data.unit && data.unit.length > 0), {
    message: 'Unit is required for per-unit pricing',
    path: ['unit'],
  });

export type TemplateItemData = z.infer<typeof templateItemSchema>;
