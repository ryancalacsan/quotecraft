'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';

import { db } from '@/lib/db';
import { quotes, lineItems } from '@/lib/db/schema';
import { ensureUserExists } from '@/lib/db/queries';
import { generateQuoteNumber } from '@/lib/quote-number';
import { quoteFormSchema, quoteStatusSchema } from '@/lib/validations/quote';

export async function createQuote(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    return { error: { _form: ['You must be signed in to create a quote'] } };
  }

  await ensureUserExists(userId);

  const raw = {
    title: formData.get('title'),
    clientName: formData.get('clientName'),
    clientEmail: formData.get('clientEmail'),
    notes: formData.get('notes'),
    validUntil: formData.get('validUntil'),
    depositPercent: formData.get('depositPercent'),
  };

  const parsed = quoteFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    const quoteNumber = await generateQuoteNumber(userId);
    const shareToken = nanoid();

    const [quote] = await db
      .insert(quotes)
      .values({
        userId,
        quoteNumber,
        shareToken,
        title: parsed.data.title,
        clientName: parsed.data.clientName,
        clientEmail: parsed.data.clientEmail || null,
        notes: parsed.data.notes || null,
        validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
        depositPercent: parsed.data.depositPercent,
      })
      .returning({ id: quotes.id });

    revalidatePath('/dashboard');
    redirect(`/quotes/${quote.id}/edit`);
  } catch (error) {
    // Re-throw redirect errors (they're not actual errors)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Failed to create quote:', error);
    return { error: { _form: ['Failed to create quote. Please try again.'] } };
  }
}

export async function updateQuote(quoteId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    return { error: { _form: ['You must be signed in to update a quote'] } };
  }

  const existing = await db.query.quotes.findFirst({
    where: and(eq(quotes.id, quoteId), eq(quotes.userId, userId)),
  });

  if (!existing) {
    return { error: { _form: ['Quote not found'] } };
  }
  if (existing.status !== 'draft') {
    return { error: { _form: ['Only draft quotes can be edited'] } };
  }

  const raw = {
    title: formData.get('title'),
    clientName: formData.get('clientName'),
    clientEmail: formData.get('clientEmail'),
    notes: formData.get('notes'),
    validUntil: formData.get('validUntil'),
    depositPercent: formData.get('depositPercent'),
  };

  const parsed = quoteFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await db
      .update(quotes)
      .set({
        title: parsed.data.title,
        clientName: parsed.data.clientName,
        clientEmail: parsed.data.clientEmail || null,
        notes: parsed.data.notes || null,
        validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
        depositPercent: parsed.data.depositPercent,
        version: existing.version + 1,
      })
      .where(and(eq(quotes.id, quoteId), eq(quotes.userId, userId)));

    revalidatePath('/dashboard');
    revalidatePath(`/quotes/${quoteId}`);
  } catch (error) {
    console.error('Failed to update quote:', error);
    return { error: { _form: ['Failed to save changes. Please try again.'] } };
  }
}

export async function deleteQuote(quoteId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await db.delete(quotes).where(and(eq(quotes.id, quoteId), eq(quotes.userId, userId)));

  revalidatePath('/dashboard');
}

export async function duplicateQuote(quoteId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const existing = await db.query.quotes.findFirst({
    where: and(eq(quotes.id, quoteId), eq(quotes.userId, userId)),
  });

  if (!existing) throw new Error('Quote not found');

  const existingItems = await db.query.lineItems.findMany({
    where: eq(lineItems.quoteId, quoteId),
  });

  const quoteNumber = await generateQuoteNumber(userId);
  const shareToken = nanoid();

  const [newQuote] = await db
    .insert(quotes)
    .values({
      userId,
      quoteNumber,
      shareToken,
      title: `${existing.title} (Copy)`,
      clientName: existing.clientName,
      clientEmail: existing.clientEmail,
      notes: existing.notes,
      currency: existing.currency,
      validUntil: existing.validUntil,
      depositPercent: existing.depositPercent,
      status: 'draft',
    })
    .returning({ id: quotes.id });

  if (existingItems.length > 0) {
    await db.insert(lineItems).values(
      existingItems.map((item) => ({
        quoteId: newQuote.id,
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
  redirect(`/quotes/${newQuote.id}/edit`);
}

export async function updateQuoteStatus(quoteId: string, status: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const parsed = quoteStatusSchema.safeParse(status);
  if (!parsed.success) throw new Error('Invalid quote status');

  const existing = await db.query.quotes.findFirst({
    where: and(eq(quotes.id, quoteId), eq(quotes.userId, userId)),
  });

  if (!existing) throw new Error('Quote not found');

  await db
    .update(quotes)
    .set({ status: parsed.data })
    .where(and(eq(quotes.id, quoteId), eq(quotes.userId, userId)));

  revalidatePath('/dashboard');
  revalidatePath(`/quotes/${quoteId}`);
}
