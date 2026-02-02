import { eq, and } from 'drizzle-orm';

import { db } from '@/lib/db';
import { quotes } from '@/lib/db/schema';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook verification failed:', err);
    return new Response('Verification failed', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const quoteId = session.metadata?.quoteId;

    if (!quoteId) {
      console.error('No quoteId in session metadata');
      return new Response('Missing metadata', { status: 400 });
    }

    // Atomic update: only transition accepted → paid
    const [updated] = await db
      .update(quotes)
      .set({
        status: 'paid',
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === 'string' ? session.payment_intent : null,
        paidAt: new Date(),
      })
      .where(and(eq(quotes.id, quoteId), eq(quotes.status, 'accepted')))
      .returning({ id: quotes.id });

    if (!updated) {
      console.error(`Quote ${quoteId} not found or not in accepted status`);
    }
  }

  return new Response('OK', { status: 200 });
}
