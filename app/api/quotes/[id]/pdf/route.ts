import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { quotes } from '@/lib/db/schema';
import { getLineItemsByQuoteId, getUserById } from '@/lib/db/queries';
import { calculateQuotePricing } from '@/lib/pricing';
import { QuotePDF } from '@/components/pdf/quote-pdf';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: quoteId } = await params;

    // Check for share token in query params (for public access)
    const shareToken = request.nextUrl.searchParams.get('token');

    // Fetch the quote directly (authorization checked separately)
    const quote = await db.query.quotes.findFirst({
      where: eq(quotes.id, quoteId),
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Authorization: either authenticated owner or valid share token
    if (shareToken) {
      // Validate share token
      if (quote.shareToken !== shareToken) {
        return NextResponse.json({ error: 'Invalid share token' }, { status: 403 });
      }
    } else {
      // Require authentication
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (quote.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch related data
    const [lineItems, user] = await Promise.all([
      getLineItemsByQuoteId(quoteId),
      getUserById(quote.userId),
    ]);

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
    // Convert Buffer to Uint8Array for NextResponse compatibility
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
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
