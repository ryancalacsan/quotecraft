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
