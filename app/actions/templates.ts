'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';

import { db } from '@/lib/db';
import { quotes, lineItems } from '@/lib/db/schema';
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
  deleteTemplateItems,
} from '@/lib/db/queries/templates';
import { templateFormSchema } from '@/lib/validations/template';

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
  if (!userId) throw new Error('Unauthorized');

  await ensureUserExists(userId);

  const template = await getTemplateById(templateId, userId);
  if (!template) throw new Error('Template not found');

  const templateLineItems = await getTemplateItemsByTemplateId(templateId);
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
  if (!userId) throw new Error('Unauthorized');

  await deleteTemplateQuery(templateId, userId);
  revalidatePath('/templates');
}

export async function updateTemplateItems(
  templateId: string,
  items: Array<{
    description: string;
    pricingType: 'hourly' | 'fixed' | 'per_unit';
    unit?: string | null;
    rate: string;
    quantity: string;
    discount: string;
  }>,
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const template = await getTemplateById(templateId, userId);
  if (!template) throw new Error('Template not found');

  // Delete existing items and insert new ones
  await deleteTemplateItems(templateId);

  if (items.length > 0) {
    await createTemplateItems(
      items.map((item, index) => ({
        templateId,
        description: item.description,
        pricingType: item.pricingType,
        unit: item.unit || null,
        rate: item.rate,
        quantity: item.quantity,
        discount: item.discount,
        sortOrder: index,
      })),
    );
  }

  revalidatePath('/templates');
  revalidatePath(`/templates/${templateId}`);
}
