import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { db } from './db';
import { quotes, lineItems, templates, templateItems } from './db/schema';

/**
 * Seeds demo data for a specific session.
 * Optimized to use batched inserts for better performance.
 * Deletes any existing data first, then creates sample quotes and templates.
 */
export async function seedDemoData(demoUserId: string, demoSessionId: string) {
  const year = new Date().getFullYear();
  const sessionSnippet = demoSessionId.slice(0, 6);
  const prefix = `DEMO-${sessionSnippet}-${year}`;

  // Generate all quote IDs upfront for batched inserts
  const quoteIds = {
    draft: crypto.randomUUID(),
    sent: crypto.randomUUID(),
    accepted: crypto.randomUUID(),
    paid1: crypto.randomUUID(),
    paid2: crypto.randomUUID(),
    paid3: crypto.randomUUID(),
    paid4: crypto.randomUUID(),
    declined: crypto.randomUUID(),
  };

  // Generate all template IDs upfront
  const templateIds = {
    webDev: crypto.randomUUID(),
    brand: crypto.randomUUID(),
    consulting: crypto.randomUUID(),
  };

  // Delete existing data in parallel
  await Promise.all([
    db
      .delete(quotes)
      .where(and(eq(quotes.userId, demoUserId), eq(quotes.demoSessionId, demoSessionId))),
    db.delete(templates).where(eq(templates.userId, demoUserId)),
  ]);

  // Batch insert all quotes at once
  const allQuotes = [
    {
      id: quoteIds.draft,
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0001`,
      shareToken: nanoid(),
      title: 'Brand Identity Package',
      clientName: 'Sunrise Coffee Co.',
      clientEmail: 'hello@sunrisecoffee.com',
      status: 'draft' as const,
      notes: 'Includes 2 rounds of revisions. Additional revisions at $150/hr.',
      depositPercent: 50,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: quoteIds.sent,
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0002`,
      shareToken: nanoid(),
      title: 'Website Redesign',
      clientName: 'TechVenture Labs',
      clientEmail: 'projects@techventure.io',
      status: 'sent' as const,
      notes: 'Payment due within 30 days of invoice. Hosting not included.',
      depositPercent: 25,
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      id: quoteIds.accepted,
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0003`,
      shareToken: nanoid(),
      title: 'E-Commerce Integration',
      clientName: 'GreenLeaf Organics',
      clientEmail: 'admin@greenleaf.com',
      status: 'accepted' as const,
      notes: 'Stripe + Shopify integration. Includes 30 days of post-launch support.',
      depositPercent: 30,
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      id: quoteIds.paid1,
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0004`,
      shareToken: nanoid(),
      title: 'SEO Audit & Optimization',
      clientName: 'Metro Dental Group',
      clientEmail: 'marketing@metrodental.com',
      status: 'paid' as const,
      notes: 'Monthly SEO reporting included for 3 months.',
      depositPercent: 0,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: quoteIds.paid2,
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0005`,
      shareToken: nanoid(),
      title: 'Mobile App UI Design',
      clientName: 'FitTrack Health',
      clientEmail: 'design@fittrack.io',
      status: 'paid' as const,
      notes: 'iOS and Android designs included.',
      depositPercent: 50,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: quoteIds.paid3,
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0006`,
      shareToken: nanoid(),
      title: 'Landing Page Development',
      clientName: 'CloudSync Solutions',
      clientEmail: 'web@cloudsync.com',
      status: 'paid' as const,
      notes: 'Includes responsive design and contact form.',
      depositPercent: 25,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      id: quoteIds.paid4,
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0007`,
      shareToken: nanoid(),
      title: 'Email Marketing Setup',
      clientName: 'Artisan Bakery Co.',
      clientEmail: 'info@artisanbakery.com',
      status: 'paid' as const,
      notes: 'Mailchimp integration with 3 email templates.',
      depositPercent: 0,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    },
    {
      id: quoteIds.declined,
      userId: demoUserId,
      demoSessionId,
      quoteNumber: `${prefix}-0008`,
      shareToken: nanoid(),
      title: 'Corporate Video Production',
      clientName: 'Nexus Financial',
      clientEmail: 'marketing@nexusfinancial.com',
      status: 'declined' as const,
      notes: 'Full production including scripting, filming, and editing.',
      depositPercent: 50,
      validUntil: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ];

  // Batch insert all line items at once
  const allLineItems = [
    // Draft quote items
    {
      quoteId: quoteIds.draft,
      description: 'Logo Design',
      pricingType: 'fixed' as const,
      rate: '1500.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: quoteIds.draft,
      description: 'Brand Guidelines Document',
      pricingType: 'fixed' as const,
      rate: '800.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
    {
      quoteId: quoteIds.draft,
      description: 'Social Media Kit',
      pricingType: 'fixed' as const,
      rate: '600.00',
      quantity: '1',
      discount: '10',
      sortOrder: 2,
    },
    // Sent quote items
    {
      quoteId: quoteIds.sent,
      description: 'UX Research & Wireframing',
      pricingType: 'hourly' as const,
      unit: 'hours',
      rate: '125.00',
      quantity: '20',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: quoteIds.sent,
      description: 'UI Design (5 pages)',
      pricingType: 'fixed' as const,
      rate: '4000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
    {
      quoteId: quoteIds.sent,
      description: 'Frontend Development',
      pricingType: 'hourly' as const,
      unit: 'hours',
      rate: '150.00',
      quantity: '40',
      discount: '5',
      sortOrder: 2,
    },
    // Accepted quote items
    {
      quoteId: quoteIds.accepted,
      description: 'Shopify Store Setup',
      pricingType: 'fixed' as const,
      rate: '3000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: quoteIds.accepted,
      description: 'Payment Gateway Integration',
      pricingType: 'fixed' as const,
      rate: '2000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
    {
      quoteId: quoteIds.accepted,
      description: 'Product Data Migration',
      pricingType: 'per_unit' as const,
      unit: 'products',
      rate: '5.00',
      quantity: '200',
      discount: '0',
      sortOrder: 2,
    },
    // Paid quote 1 items
    {
      quoteId: quoteIds.paid1,
      description: 'Technical SEO Audit',
      pricingType: 'fixed' as const,
      rate: '1200.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: quoteIds.paid1,
      description: 'On-Page Optimization',
      pricingType: 'per_unit' as const,
      unit: 'pages',
      rate: '75.00',
      quantity: '15',
      discount: '0',
      sortOrder: 1,
    },
    {
      quoteId: quoteIds.paid1,
      description: 'Keyword Research',
      pricingType: 'hourly' as const,
      unit: 'hours',
      rate: '100.00',
      quantity: '8',
      discount: '0',
      sortOrder: 2,
    },
    // Paid quote 2 items
    {
      quoteId: quoteIds.paid2,
      description: 'UI/UX Design - 12 Screens',
      pricingType: 'fixed' as const,
      rate: '4800.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: quoteIds.paid2,
      description: 'Interactive Prototype',
      pricingType: 'fixed' as const,
      rate: '1200.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
    // Paid quote 3 items
    {
      quoteId: quoteIds.paid3,
      description: 'Landing Page Design & Development',
      pricingType: 'fixed' as const,
      rate: '2500.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: quoteIds.paid3,
      description: 'SEO Setup',
      pricingType: 'fixed' as const,
      rate: '500.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
    // Paid quote 4 items
    {
      quoteId: quoteIds.paid4,
      description: 'Mailchimp Account Setup',
      pricingType: 'fixed' as const,
      rate: '400.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      quoteId: quoteIds.paid4,
      description: 'Email Template Design',
      pricingType: 'fixed' as const,
      rate: '350.00',
      quantity: '3',
      discount: '0',
      sortOrder: 1,
    },
    // Declined quote items
    {
      quoteId: quoteIds.declined,
      description: 'Video Production (2 min)',
      pricingType: 'fixed' as const,
      rate: '8000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
  ];

  // Batch insert all templates at once
  const allTemplates = [
    {
      id: templateIds.webDev,
      userId: demoUserId,
      name: 'Web Development Project',
      description:
        'Standard template for website development projects with design, development, and testing phases.',
      defaultTitle: 'Website Development',
      defaultNotes:
        'Payment terms: 50% deposit, 50% upon completion. Includes 30 days of post-launch support.',
      defaultValidDays: 30,
      defaultDepositPercent: 50,
    },
    {
      id: templateIds.brand,
      userId: demoUserId,
      name: 'Brand Identity Package',
      description:
        'Complete branding package including logo, guidelines, and marketing collateral.',
      defaultTitle: 'Brand Identity Design',
      defaultNotes:
        'Includes 3 initial concepts and 2 rounds of revisions. Additional revisions billed at hourly rate.',
      defaultValidDays: 14,
      defaultDepositPercent: 50,
    },
    {
      id: templateIds.consulting,
      userId: demoUserId,
      name: 'Monthly Consulting Retainer',
      description: 'Ongoing consulting services billed monthly with dedicated hours.',
      defaultTitle: 'Consulting Services',
      defaultNotes:
        'Monthly retainer. Unused hours do not roll over. Additional hours billed at standard rate.',
      defaultValidDays: 7,
      defaultDepositPercent: 100,
    },
  ];

  // Batch insert all template items at once
  const allTemplateItems = [
    // Web dev template items
    {
      templateId: templateIds.webDev,
      description: 'Discovery & Planning',
      pricingType: 'fixed' as const,
      rate: '1500.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      templateId: templateIds.webDev,
      description: 'UI/UX Design',
      pricingType: 'fixed' as const,
      rate: '3000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
    {
      templateId: templateIds.webDev,
      description: 'Frontend Development',
      pricingType: 'hourly' as const,
      unit: 'hours',
      rate: '150.00',
      quantity: '40',
      discount: '0',
      sortOrder: 2,
    },
    {
      templateId: templateIds.webDev,
      description: 'Testing & QA',
      pricingType: 'hourly' as const,
      unit: 'hours',
      rate: '100.00',
      quantity: '10',
      discount: '0',
      sortOrder: 3,
    },
    // Brand template items
    {
      templateId: templateIds.brand,
      description: 'Logo Design',
      pricingType: 'fixed' as const,
      rate: '2000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 0,
    },
    {
      templateId: templateIds.brand,
      description: 'Brand Guidelines Document',
      pricingType: 'fixed' as const,
      rate: '1000.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
    {
      templateId: templateIds.brand,
      description: 'Business Card Design',
      pricingType: 'fixed' as const,
      rate: '300.00',
      quantity: '1',
      discount: '0',
      sortOrder: 2,
    },
    {
      templateId: templateIds.brand,
      description: 'Social Media Templates',
      pricingType: 'fixed' as const,
      rate: '500.00',
      quantity: '1',
      discount: '0',
      sortOrder: 3,
    },
    // Consulting template items
    {
      templateId: templateIds.consulting,
      description: 'Strategy Consulting',
      pricingType: 'hourly' as const,
      unit: 'hours',
      rate: '200.00',
      quantity: '10',
      discount: '0',
      sortOrder: 0,
    },
    {
      templateId: templateIds.consulting,
      description: 'Weekly Check-in Calls',
      pricingType: 'fixed' as const,
      rate: '400.00',
      quantity: '1',
      discount: '0',
      sortOrder: 1,
    },
  ];

  // Execute all inserts in parallel (quotes+templates first, then items)
  await Promise.all([
    db.insert(quotes).values(allQuotes),
    db.insert(templates).values(allTemplates),
  ]);

  await Promise.all([
    db.insert(lineItems).values(allLineItems),
    db.insert(templateItems).values(allTemplateItems),
  ]);

  return {
    draftQuote: { id: quoteIds.draft },
    sentQuote: { id: quoteIds.sent },
    acceptedQuote: { id: quoteIds.accepted },
    paidQuote: { id: quoteIds.paid1 },
    declinedQuote: { id: quoteIds.declined },
  };
}
