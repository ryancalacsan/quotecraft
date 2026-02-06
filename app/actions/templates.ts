'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';

import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { quotes, lineItems, templateItems } from '@/lib/db/schema';
import { ensureUserExists, getQuoteById, getLineItemsByQuoteId } from '@/lib/db/queries';
import { getDemoSessionId } from '@/lib/demo-session';
import { generateQuoteNumber } from '@/lib/quote-number';
import {
  getTemplateById,
  getTemplateItemsByTemplateId,
  createTemplate,
  createTemplateItems,
  updateTemplate as updateTemplateQuery,
  deleteTemplate as deleteTemplateQuery,
} from '@/lib/db/queries/templates';
import { templateFormSchema, templateItemSchema } from '@/lib/validations/template';
import { z } from 'zod';

export async function saveAsTemplate(quoteId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'You must be signed in to create a template' };
  }

  await ensureUserExists(userId);

  const demoSessionId = await getDemoSessionId(userId);
  const quote = await getQuoteById(quoteId, userId, demoSessionId);

  if (!quote) {
    return { error: 'Quote not found' };
  }

  const raw = {
    name: formData.get('name'),
    description: formData.get('description'),
    defaultTitle: quote.title,
    defaultNotes: quote.notes,
    defaultValidDays: formData.get('defaultValidDays'),
    defaultDepositPercent: quote.depositPercent,
  };

  const parsed = templateFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    const template = await createTemplate({
      userId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      defaultTitle: parsed.data.defaultTitle || null,
      defaultNotes: parsed.data.defaultNotes || null,
      defaultValidDays: parsed.data.defaultValidDays || null,
      defaultDepositPercent: parsed.data.defaultDepositPercent,
    });

    // Copy line items to template
    const quoteLineItems = await getLineItemsByQuoteId(quoteId);

    if (quoteLineItems.length > 0) {
      await createTemplateItems(
        quoteLineItems.map((item, index) => ({
          templateId: template.id,
          description: item.description,
          pricingType: item.pricingType,
          unit: item.unit,
          rate: item.rate,
          quantity: item.quantity,
          discount: item.discount,
          sortOrder: index,
        })),
      );
    }

    revalidatePath('/templates');
    return { success: true, templateId: template.id };
  } catch (error) {
    console.error('Failed to save template:', error);
    return { error: 'Failed to save template. Please try again.' };
  }
}

export async function createQuoteFromTemplate(templateId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'You must be signed in to create a quote' };
  }

  await ensureUserExists(userId);

  const template = await getTemplateById(templateId, userId);
  if (!template) {
    return { error: 'Template not found' };
  }

  try {
    const templateLineItems = await getTemplateItemsByTemplateId(templateId, userId);
    const demoSessionId = await getDemoSessionId(userId);
    const quoteNumber = await generateQuoteNumber(userId, demoSessionId);
    const shareToken = nanoid();

    // Calculate valid until date
    const validUntil = template.defaultValidDays
      ? new Date(Date.now() + template.defaultValidDays * 24 * 60 * 60 * 1000)
      : null;

    const [quote] = await db
      .insert(quotes)
      .values({
        userId,
        demoSessionId,
        quoteNumber,
        shareToken,
        title: template.defaultTitle || 'Untitled Quote',
        clientName: '',
        clientEmail: null,
        notes: template.defaultNotes || null,
        validUntil,
        depositPercent: template.defaultDepositPercent || 0,
        status: 'draft',
      })
      .returning({ id: quotes.id });

    // Copy template items to quote
    if (templateLineItems.length > 0) {
      await db.insert(lineItems).values(
        templateLineItems.map((item) => ({
          quoteId: quote.id,
          description: item.description,
          pricingType: item.pricingType,
          unit: item.unit,
          rate: item.rate,
          quantity: item.quantity,
          discount: item.discount,
          sortOrder: item.sortOrder,
        })),
      );
    }

    revalidatePath('/dashboard');
    redirect(`/quotes/${quote.id}/edit`);
  } catch (error) {
    // Re-throw redirect errors (they're not actual errors)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Failed to create quote from template:', error);
    return { error: 'Failed to create quote from template. Please try again.' };
  }
}

export async function updateTemplate(templateId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'You must be signed in to update a template' };
  }

  const template = await getTemplateById(templateId, userId);
  if (!template) {
    return { error: 'Template not found' };
  }

  const raw = {
    name: formData.get('name'),
    description: formData.get('description'),
    defaultTitle: formData.get('defaultTitle'),
    defaultNotes: formData.get('defaultNotes'),
    defaultValidDays: formData.get('defaultValidDays'),
    defaultDepositPercent: formData.get('defaultDepositPercent'),
  };

  const parsed = templateFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateTemplateQuery(templateId, userId, {
      name: parsed.data.name,
      description: parsed.data.description || null,
      defaultTitle: parsed.data.defaultTitle || null,
      defaultNotes: parsed.data.defaultNotes || null,
      defaultValidDays: parsed.data.defaultValidDays || null,
      defaultDepositPercent: parsed.data.defaultDepositPercent,
    });

    revalidatePath('/templates');
    revalidatePath(`/templates/${templateId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update template:', error);
    return { error: 'Failed to update template. Please try again.' };
  }
}

export async function deleteTemplate(templateId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'You must be signed in to delete a template' };
  }

  try {
    await deleteTemplateQuery(templateId, userId);
    revalidatePath('/templates');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete template:', error);
    return { error: 'Failed to delete template. Please try again.' };
  }
}

export async function updateTemplateItems(
  templateId: string,
  items: Array<{
    description: string;
    pricingType: 'hourly' | 'fixed' | 'per_unit';
    unit?: string | null;
    rate: string | number;
    quantity: string | number;
    discount: string | number;
  }>,
) {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'You must be signed in to update template items' };
  }

  const template = await getTemplateById(templateId, userId);
  if (!template) {
    return { error: 'Template not found' };
  }

  // Validate all items
  const itemsArraySchema = z.array(templateItemSchema);
  const parsed = itemsArraySchema.safeParse(items);
  if (!parsed.success) {
    return { error: 'Invalid template items: ' + parsed.error.message };
  }

  try {
    // Use transaction to ensure atomicity (delete + insert)
    await db.transaction(async (tx) => {
      await tx.delete(templateItems).where(eq(templateItems.templateId, templateId));

      if (parsed.data.length > 0) {
        await tx.insert(templateItems).values(
          parsed.data.map((item, index) => ({
            templateId,
            description: item.description,
            pricingType: item.pricingType,
            unit: item.unit || null,
            rate: String(item.rate),
            quantity: String(item.quantity),
            discount: String(item.discount),
            sortOrder: index,
          })),
        );
      }
    });

    revalidatePath('/templates');
    revalidatePath(`/templates/${templateId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update template items:', error);
    return { error: 'Failed to update template items. Please try again.' };
  }
}
