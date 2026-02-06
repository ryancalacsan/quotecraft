import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { db } from './db';
import { quotes, lineItems, templates, templateItems } from './db/schema';

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

  // Quote 4: Paid — completed (recent)
  const [paidQuote1] = await db
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
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Paid 2 days ago
    })
    .returning();

  await db.insert(lineItems).values([
    {
      quoteId: paidQuote1.id,
      description: 'Technical SEO Audit',
      pricingType: 'fixed' as const,
      rate: '1200.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: paidQuote1.id,
      description: 'On-Page Optimization',
      pricingType: 'per_unit' as const,
      unit: 'pages',
      rate: '75.00',
      quantity: '15',
      discount: '0',
      sortOrder: 1,
    },
    {
      quoteId: paidQuote1.id,
      description: 'Keyword Research',
      pricingType: 'hourly' as const,
      unit: 'hours',
      rate: '100.00',
      quantity: '8',
      discount: '0',
      sortOrder: 2,
    },
  ]);

  // Quote 5: Paid — completed (1 week ago)
  const [paidQuote2] = await db
    .insert(quotes)
    .values({
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0005`,
      shareToken: nanoid(),
      title: 'Mobile App UI Design',
      clientName: 'FitTrack Health',
      clientEmail: 'design@fittrack.io',
      status: 'paid',
      notes: 'iOS and Android designs included.',
      depositPercent: 50,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Paid 7 days ago
    })
    .returning();

  await db.insert(lineItems).values([
    {
      quoteId: paidQuote2.id,
      description: 'UI/UX Design - 12 Screens',
      pricingType: 'fixed' as const,
      rate: '4800.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: paidQuote2.id,
      description: 'Interactive Prototype',
      pricingType: 'fixed' as const,
      rate: '1200.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
  ]);

  // Quote 6: Paid — completed (2 weeks ago)
  const [paidQuote3] = await db
    .insert(quotes)
    .values({
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0006`,
      shareToken: nanoid(),
      title: 'Landing Page Development',
      clientName: 'CloudSync Solutions',
      clientEmail: 'web@cloudsync.com',
      status: 'paid',
      notes: 'Includes responsive design and contact form.',
      depositPercent: 25,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Paid 14 days ago
    })
    .returning();

  await db.insert(lineItems).values([
    {
      quoteId: paidQuote3.id,
      description: 'Landing Page Design & Development',
      pricingType: 'fixed' as const,
      rate: '2500.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: paidQuote3.id,
      description: 'SEO Setup',
      pricingType: 'fixed' as const,
      rate: '500.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
  ]);

  // Quote 7: Paid — completed (3 weeks ago)
  const [paidQuote4] = await db
    .insert(quotes)
    .values({
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0007`,
      shareToken: nanoid(),
      title: 'Email Marketing Setup',
      clientName: 'Artisan Bakery Co.',
      clientEmail: 'info@artisanbakery.com',
      status: 'paid',
      notes: 'Mailchimp integration with 3 email templates.',
      depositPercent: 0,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // Paid 21 days ago
    })
    .returning();

  await db.insert(lineItems).values([
    {
      quoteId: paidQuote4.id,
      description: 'Mailchimp Account Setup',
      pricingType: 'fixed' as const,
      rate: '400.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: paidQuote4.id,
      description: 'Email Template Design',
      pricingType: 'fixed' as const,
      rate: '350.00',
      quantity: '3',
      discount: '0',
      sortOrder: 1,
    },
  ]);

  // Quote 8: Declined — lost opportunity
  const [declinedQuote] = await db
    .insert(quotes)
    .values({
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0008`,
      shareToken: nanoid(),
      title: 'Corporate Video Production',
      clientName: 'Nexus Financial',
      clientEmail: 'marketing@nexusfinancial.com',
      status: 'declined',
      notes: 'Full production including scripting, filming, and editing.',
      depositPercent: 50,
      validUntil: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Expired
    })
    .returning();

  await db.insert(lineItems).values([
    {
      quoteId: declinedQuote.id,
      description: 'Video Production (2 min)',
      pricingType: 'fixed' as const,
      rate: '8000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
  ]);

  // Delete existing templates for this user (templates are not session-scoped)
  // Only delete if this is a demo user seeding
  await db.delete(templates).where(eq(templates.userId, demoUserId));

  // Template 1: Web Development Project
  const [webDevTemplate] = await db
    .insert(templates)
    .values({
      userId: demoUserId,
      name: 'Web Development Project',
      description:
        'Standard template for website development projects with design, development, and testing phases.',
      defaultTitle: 'Website Development',
      defaultNotes:
        'Payment terms: 50% deposit, 50% upon completion. Includes 30 days of post-launch support.',
      defaultValidDays: 30,
      defaultDepositPercent: 50,
    })
    .returning();

  await db.insert(templateItems).values([
    {
      templateId: webDevTemplate.id,
      description: 'Discovery & Planning',
      pricingType: 'fixed' as const,
      rate: '1500.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      templateId: webDevTemplate.id,
      description: 'UI/UX Design',
      pricingType: 'fixed' as const,
      rate: '3000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
    {
      templateId: webDevTemplate.id,
      description: 'Frontend Development',
      pricingType: 'hourly' as const,
      unit: 'hours',
      rate: '150.00',
      quantity: '40',
      discount: '0',
      sortOrder: 2,
    },
    {
      templateId: webDevTemplate.id,
      description: 'Testing & QA',
      pricingType: 'hourly' as const,
      unit: 'hours',
      rate: '100.00',
      quantity: '10',
      discount: '0',
      sortOrder: 3,
    },
  ]);

  // Template 2: Brand Identity Package
  const [brandTemplate] = await db
    .insert(templates)
    .values({
      userId: demoUserId,
      name: 'Brand Identity Package',
      description:
        'Complete branding package including logo, guidelines, and marketing collateral.',
      defaultTitle: 'Brand Identity Design',
      defaultNotes:
        'Includes 3 initial concepts and 2 rounds of revisions. Additional revisions billed at hourly rate.',
      defaultValidDays: 14,
      defaultDepositPercent: 50,
    })
    .returning();

  await db.insert(templateItems).values([
    {
      templateId: brandTemplate.id,
      description: 'Logo Design',
      pricingType: 'fixed' as const,
      rate: '2000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      templateId: brandTemplate.id,
      description: 'Brand Guidelines Document',
      pricingType: 'fixed' as const,
      rate: '1000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
    {
      templateId: brandTemplate.id,
      description: 'Business Card Design',
      pricingType: 'fixed' as const,
      rate: '300.00',
      quantity: '1',
      discount: '0',
      sortOrder: 2,
    },
    {
      templateId: brandTemplate.id,
      description: 'Social Media Templates',
      pricingType: 'fixed' as const,
      rate: '500.00',
      quantity: '1',
      discount: '0',
      sortOrder: 3,
    },
  ]);

  // Template 3: Consulting Retainer
  const [consultingTemplate] = await db
    .insert(templates)
    .values({
      userId: demoUserId,
      name: 'Monthly Consulting Retainer',
      description: 'Ongoing consulting services billed monthly with dedicated hours.',
      defaultTitle: 'Consulting Services',
      defaultNotes:
        'Monthly retainer. Unused hours do not roll over. Additional hours billed at standard rate.',
      defaultValidDays: 7,
      defaultDepositPercent: 100,
    })
    .returning();

  await db.insert(templateItems).values([
    {
      templateId: consultingTemplate.id,
      description: 'Strategy Consulting',
      pricingType: 'hourly' as const,
      unit: 'hours',
      rate: '200.00',
      quantity: '10',
      discount: '0',
      sortOrder: 0,
    },
    {
      templateId: consultingTemplate.id,
      description: 'Weekly Check-in Calls',
      pricingType: 'fixed' as const,
      rate: '400.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
  ]);

  return { draftQuote, sentQuote, acceptedQuote, paidQuote: paidQuote1, declinedQuote };
}
