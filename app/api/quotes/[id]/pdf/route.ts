import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import {
  getQuoteById,
  getLineItemsByQuoteId,
  getUserById,
  getQuoteByShareToken,
} from '@/lib/db/queries';
import { getDemoSessionId } from '@/lib/demo-session';
import { calculateQuotePricing } from '@/lib/pricing';
import { QuotePDF } from '@/components/pdf/quote-pdf';

// Validation schemas
const uuidSchema = z.string().uuid();
const shareTokenSchema = z
  .string()
  .min(1)
  .max(30)
  .regex(/^[A-Za-z0-9_-]+$/);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: quoteId } = await params;

    // Validate quote ID format
    const idResult = uuidSchema.safeParse(quoteId);
    if (!idResult.success) {
      return NextResponse.json({ error: 'Invalid quote ID' }, { status: 400 });
    }

    // Check for share token in query params (for public access)
    const tokenParam = request.nextUrl.searchParams.get('token');

    let quote;

    if (tokenParam) {
      // Validate share token format
      const tokenResult = shareTokenSchema.safeParse(tokenParam);
      if (!tokenResult.success) {
        return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
      }

      // Public access via share token
      quote = await getQuoteByShareToken(tokenResult.data);
      if (!quote || quote.id !== quoteId) {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
      }
    } else {
      // Authenticated access - require login and demo session isolation
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const demoSessionId = await getDemoSessionId(userId);
      quote = await getQuoteById(quoteId, userId, demoSessionId);
      if (!quote) {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
      }
    }

    // Fetch related data
    const [lineItems, user] = await Promise.all([
      getLineItemsByQuoteId(quote.id),
      getUserById(quote.userId),
    ]);

    // Validate quote has line items
    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Cannot generate PDF for quote with no line items' },
        { status: 400 },
      );
    }

    // Calculate pricing
    const pricing = calculateQuotePricing(
      lineItems.map((item) => ({
        rate: item.rate,
        quantity: item.quantity,
        discount: item.discount,
      })),
      quote.depositPercent,
    );

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      QuotePDF({ quote, lineItems, pricing, user: user ?? null }),
    );

    // Create filename from quote number
    const filename = `QuoteCraft-${quote.quoteNumber}.pdf`;

    // Return PDF with proper headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
