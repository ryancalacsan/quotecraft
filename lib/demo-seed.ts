import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { db } from './db';
import { quotes, lineItems } from './db/schema';

/**
 * Seeds demo data for a specific session.
 * Deletes any existing quotes for this session (cascade deletes line items),
 * then creates 4 sample quotes with realistic line items in various states.
 */
export async function seedDemoData(demoUserId: string, demoSessionId: string) {
  // Delete existing quotes for this session only (cascade deletes line items)
  await db
    .delete(quotes)
    .where(and(eq(quotes.userId, demoUserId), eq(quotes.demoSessionId, demoSessionId)));

  const year = new Date().getFullYear();
  // Use first 6 chars of session ID to make quote numbers unique per session
  const sessionSnippet = demoSessionId.slice(0, 6);
  const prefix = `DEMO-${sessionSnippet}-${year}`;

  // Quote 1: Draft — editable
  const [draftQuote] = await db
    .insert(quotes)
    .values({
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0001`,
      shareToken: nanoid(),
      title: 'Brand Identity Package',
      clientName: 'Sunrise Coffee Co.',
      clientEmail: 'hello@sunrisecoffee.com',
      status: 'draft',
      notes: 'Includes 2 rounds of revisions. Additional revisions at $150/hr.',
      depositPercent: 50,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })
    .returning();

  await db.insert(lineItems).values([
    {
      quoteId: draftQuote.id,
      description: 'Logo Design',
      pricingType: 'fixed' as const,
      rate: '1500.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: draftQuote.id,
      description: 'Brand Guidelines Document',
      pricingType: 'fixed' as const,
      rate: '800.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
    {
      quoteId: draftQuote.id,
      description: 'Social Media Kit',
      pricingType: 'fixed' as const,
      rate: '600.00',
      quantity: '1',
      discount: '10',
      sortOrder: 2,
    },
  ]);

  // Quote 2: Sent — awaiting response
  const [sentQuote] = await db
    .insert(quotes)
    .values({
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0002`,
      shareToken: nanoid(),
      title: 'Website Redesign',
      clientName: 'TechVenture Labs',
      clientEmail: 'projects@techventure.io',
      status: 'sent',
      notes: 'Payment due within 30 days of invoice. Hosting not included.',
      depositPercent: 25,
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    })
    .returning();

  await db.insert(lineItems).values([
    {
      quoteId: sentQuote.id,
      description: 'UX Research & Wireframing',
      pricingType: 'hourly' as const,
      unit: 'hours',
      rate: '125.00',
      quantity: '20',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: sentQuote.id,
      description: 'UI Design (5 pages)',
      pricingType: 'fixed' as const,
      rate: '4000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
    {
      quoteId: sentQuote.id,
      description: 'Frontend Development',
      pricingType: 'hourly' as const,
      unit: 'hours',
      rate: '150.00',
      quantity: '40',
      discount: '5',
      sortOrder: 2,
    },
  ]);

  // Quote 3: Accepted — ready for payment
  const [acceptedQuote] = await db
    .insert(quotes)
    .values({
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0003`,
      shareToken: nanoid(),
      title: 'E-Commerce Integration',
      clientName: 'GreenLeaf Organics',
      clientEmail: 'admin@greenleaf.com',
      status: 'accepted',
      notes: 'Stripe + Shopify integration. Includes 30 days of post-launch support.',
      depositPercent: 30,
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    })
    .returning();

  await db.insert(lineItems).values([
    {
      quoteId: acceptedQuote.id,
      description: 'Shopify Store Setup',
      pricingType: 'fixed' as const,
      rate: '3000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: acceptedQuote.id,
      description: 'Payment Gateway Integration',
      pricingType: 'fixed' as const,
      rate: '2000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
    {
      quoteId: acceptedQuote.id,
      description: 'Product Data Migration',
      pricingType: 'per_unit' as const,
      unit: 'products',
      rate: '5.00',
      quantity: '200',
      discount: '0',
      sortOrder: 2,
    },
  ]);

  // Quote 4: Paid — completed
  const [paidQuote] = await db
    .insert(quotes)
    .values({
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0004`,
      shareToken: nanoid(),
      title: 'SEO Audit & Optimization',
      clientName: 'Metro Dental Group',
      clientEmail: 'marketing@metrodental.com',
      status: 'paid',
      notes: 'Monthly SEO reporting included for 3 months.',
      depositPercent: 0,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Paid 7 days ago
    })
    .returning();

  await db.insert(lineItems).values([
    {
      quoteId: paidQuote.id,
      description: 'Technical SEO Audit',
      pricingType: 'fixed' as const,
      rate: '1200.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: paidQuote.id,
      description: 'On-Page Optimization',
      pricingType: 'per_unit' as const,
      unit: 'pages',
      rate: '75.00',
      quantity: '15',
      discount: '0',
      sortOrder: 1,
    },
    {
      quoteId: paidQuote.id,
      description: 'Keyword Research',
      pricingType: 'hourly' as const,
      unit: 'hours',
      rate: '100.00',
      quantity: '8',
      discount: '0',
      sortOrder: 2,
    },
  ]);

  return { draftQuote, sentQuote, acceptedQuote, paidQuote };
}
