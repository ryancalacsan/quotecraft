'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { quotes, lineItems } from '@/lib/db/schema';
import { lineItemSchema } from '@/lib/validations/line-item';

async function verifyQuoteOwnership(quoteId: string, userId: string) {
  const quote = await db.query.quotes.findFirst({
    where: and(eq(quotes.id, quoteId), eq(quotes.userId, userId)),
  });
  if (!quote) throw new Error('Quote not found');
  if (quote.status !== 'draft') throw new Error('Only draft quotes can be edited');
  return quote;
}

async function bumpQuoteVersion(quoteId: string, currentVersion: number) {
  await db
    .update(quotes)
    .set({ version: currentVersion + 1 })
    .where(eq(quotes.id, quoteId));
}

export async function addLineItem(quoteId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const quote = await verifyQuoteOwnership(quoteId, userId);

  const raw = {
    description: formData.get('description'),
    pricingType: formData.get('pricingType'),
    unit: formData.get('unit'),
    rate: formData.get('rate'),
    quantity: formData.get('quantity'),
    discount: formData.get('discount'),
    sortOrder: formData.get('sortOrder'),
  };

  const parsed = lineItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await db.insert(lineItems).values({
    quoteId,
    description: parsed.data.description,
    pricingType: parsed.data.pricingType,
    unit: parsed.data.unit || null,
    rate: String(parsed.data.rate),
    quantity: String(parsed.data.quantity),
    discount: String(parsed.data.discount),
    sortOrder: parsed.data.sortOrder,
  });

  await bumpQuoteVersion(quoteId, quote.version);
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath(`/quotes/${quoteId}/edit`);
}

export async function updateLineItem(lineItemId: string, quoteId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const quote = await verifyQuoteOwnership(quoteId, userId);

  const raw = {
    description: formData.get('description'),
    pricingType: formData.get('pricingType'),
    unit: formData.get('unit'),
    rate: formData.get('rate'),
    quantity: formData.get('quantity'),
    discount: formData.get('discount'),
    sortOrder: formData.get('sortOrder'),
  };

  const parsed = lineItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(lineItems)
    .set({
      description: parsed.data.description,
      pricingType: parsed.data.pricingType,
      unit: parsed.data.unit || null,
      rate: String(parsed.data.rate),
      quantity: String(parsed.data.quantity),
      discount: String(parsed.data.discount),
      sortOrder: parsed.data.sortOrder,
    })
    .where(and(eq(lineItems.id, lineItemId), eq(lineItems.quoteId, quoteId)));

  await bumpQuoteVersion(quoteId, quote.version);
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath(`/quotes/${quoteId}/edit`);
}

export async function removeLineItem(lineItemId: string, quoteId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const quote = await verifyQuoteOwnership(quoteId, userId);

  await db
    .delete(lineItems)
    .where(and(eq(lineItems.id, lineItemId), eq(lineItems.quoteId, quoteId)));

  await bumpQuoteVersion(quoteId, quote.version);
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath(`/quotes/${quoteId}/edit`);
}
