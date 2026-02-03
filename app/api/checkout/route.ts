import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { quotes, lineItems } from '@/lib/db/schema';
import { stripe } from '@/lib/stripe';
import { calculateQuotePricing, toStripeCents } from '@/lib/pricing';

const checkoutSchema = z.object({
  shareToken: z
    .string()
    .min(1)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.shareToken, parsed.data.shareToken),
  });

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  if (quote.status !== 'accepted') {
    return NextResponse.json({ error: 'Quote must be accepted before payment' }, { status: 400 });
  }

  const isExpired = quote.validUntil ? new Date(quote.validUntil) < new Date() : false;
  if (isExpired) {
    return NextResponse.json({ error: 'This quote has expired' }, { status: 400 });
  }

  const items = await db.query.lineItems.findMany({
    where: eq(lineItems.quoteId, quote.id),
  });

  if (items.length === 0) {
    return NextResponse.json({ error: 'Quote has no line items' }, { status: 400 });
  }

  const pricing = calculateQuotePricing(
    items.map((item) => ({
      rate: item.rate,
      quantity: item.quantity,
      discount: item.discount,
    })),
    quote.depositPercent,
  );

  // Charge deposit if set, otherwise full amount
  const chargeAmount = quote.depositPercent > 0 ? pricing.depositAmount : pricing.subtotal;
  const chargeLabel =
    quote.depositPercent > 0
      ? `${quote.title} — Deposit (${quote.depositPercent}%)`
      : `${quote.title} — Full Payment`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: quote.currency.toLowerCase(),
          product_data: { name: chargeLabel },
          unit_amount: toStripeCents(chargeAmount),
        },
        quantity: 1,
      },
    ],
    metadata: {
      quoteId: quote.id,
      userId: quote.userId,
    },
    success_url: `${appUrl}/q/${quote.shareToken}/success`,
    cancel_url: `${appUrl}/q/${quote.shareToken}`,
  });

  return NextResponse.json({ url: session.url });
}
