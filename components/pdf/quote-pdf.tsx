import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import Decimal from 'decimal.js';

import { QUOTE_STATUS_LABELS, PRICING_TYPE_LABELS, type PricingType } from '@/lib/constants';
import type { Quote, LineItem, User } from '@/lib/db/schema';
import type { QuotePricing } from '@/lib/pricing';

// Using built-in PDF fonts: Helvetica for body, Courier for monospace
// These are always available in @react-pdf/renderer without registration

// Color palette matching the app theme
const colors = {
  foreground: '#1c1917', // stone-900
  mutedForeground: '#78716c', // stone-500
  border: '#e7e5e4', // stone-200
  background: '#ffffff',
  cardBackground: '#fafaf9', // stone-50
  gold: '#ca8a04', // yellow-600
  jade: '#059669', // emerald-600
  ember: '#dc2626', // red-600
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  // Header
  header: {
    textAlign: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  businessName: {
    fontSize: 9,
    fontWeight: 'normal',
    color: colors.mutedForeground,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  quoteLabel: {
    fontSize: 8,
    fontWeight: 'normal',
    color: colors.mutedForeground,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  quoteNumber: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: colors.mutedForeground,
    marginBottom: 12,
  },
  headerMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  headerDate: {
    fontSize: 9,
    color: colors.mutedForeground,
  },
  statusBadge: {
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  // Cards
  card: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    marginBottom: 16,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: 'normal',
    color: colors.mutedForeground,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // Client info
  clientGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  clientItem: {
    flex: 1,
  },
  clientLabel: {
    fontSize: 8,
    color: colors.mutedForeground,
    marginBottom: 2,
  },
  clientValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  clientValueNormal: {
    fontSize: 10,
    fontWeight: 'normal',
  },
  // Line items table
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'normal',
    color: colors.mutedForeground,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  colDescription: { flex: 3 },
  colType: { flex: 1.5 },
  colRate: { flex: 1.2, textAlign: 'right' },
  colQty: { flex: 0.7, textAlign: 'right' },
  colDiscount: { flex: 0.8, textAlign: 'right' },
  colTotal: { flex: 1.3, textAlign: 'right' },
  cellText: {
    fontSize: 9,
  },
  cellTextMuted: {
    fontSize: 9,
    color: colors.mutedForeground,
  },
  cellTextMono: {
    fontFamily: 'Courier',
    fontSize: 9,
  },
  cellTextBold: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  // Pricing summary
  summaryContainer: {
    marginTop: 12,
    marginLeft: 'auto',
    width: 200,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
  },
  summaryTitle: {
    fontSize: 9,
    fontWeight: 'normal',
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 9,
    color: colors.mutedForeground,
  },
  summaryValue: {
    fontFamily: 'Courier',
    fontSize: 9,
  },
  summaryValueGold: {
    fontFamily: 'Courier',
    fontSize: 9,
    fontWeight: 'normal',
    color: colors.gold,
  },
  summaryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 6,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    fontFamily: 'Courier',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Notes
  notesText: {
    fontSize: 9,
    color: colors.mutedForeground,
    lineHeight: 1.6,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: colors.mutedForeground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  // Paid watermark
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-15deg)',
    fontSize: 80,
    fontWeight: 'bold',
    color: colors.jade,
    opacity: 0.08,
    letterSpacing: 20,
    textTransform: 'uppercase',
  },
});

// Status badge colors
const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#f5f5f4', text: '#78716c' },
  sent: { bg: '#dbeafe', text: '#2563eb' },
  accepted: { bg: '#d1fae5', text: '#059669' },
  declined: { bg: '#fee2e2', text: '#dc2626' },
  paid: { bg: '#d1fae5', text: '#059669' },
};

interface QuotePDFProps {
  quote: Quote;
  lineItems: LineItem[];
  pricing: QuotePricing;
  user: User | null;
}

// Helper to format currency (can't use Intl in PDF)
function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper to format date
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function QuotePDF({ quote, lineItems, pricing, user }: QuotePDFProps) {
  const isPaid = quote.status === 'paid';
  const statusColor = statusColors[quote.status] || statusColors.draft;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Paid watermark */}
        {isPaid && <Text style={styles.watermark}>Paid</Text>}

        {/* Header */}
        <View style={styles.header}>
          {user?.businessName && <Text style={styles.businessName}>{user.businessName}</Text>}
          <Text style={styles.quoteLabel}>Quote</Text>
          <Text style={styles.title}>{quote.title}</Text>
          <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerDate}>Issued {formatDate(quote.createdAt)}</Text>
            <Text
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor.bg, color: statusColor.text },
              ]}
            >
              {QUOTE_STATUS_LABELS[quote.status]}
            </Text>
          </View>
        </View>

        {/* Client info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Prepared For</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.clientGrid}>
              <View style={styles.clientItem}>
                <Text style={styles.clientLabel}>Client</Text>
                <Text style={styles.clientValue}>{quote.clientName}</Text>
              </View>
              {quote.clientEmail && (
                <View style={styles.clientItem}>
                  <Text style={styles.clientLabel}>Email</Text>
                  <Text style={styles.clientValueNormal}>{quote.clientEmail}</Text>
                </View>
              )}
              {quote.validUntil && (
                <View style={styles.clientItem}>
                  <Text style={styles.clientLabel}>Valid Until</Text>
                  <Text style={[styles.clientValueNormal, { fontFamily: 'Courier' }]}>
                    {formatDate(quote.validUntil)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Line items */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Line Items</Text>
          </View>
          <View style={styles.cardContent}>
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.colType]}>Type</Text>
              <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.colDiscount]}>Disc</Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
            </View>

            {/* Table rows */}
            {lineItems.map((item, index) => (
              <View
                key={item.id}
                style={
                  index === lineItems.length - 1
                    ? [styles.tableRow, styles.tableRowLast]
                    : styles.tableRow
                }
              >
                <Text style={[styles.cellText, styles.colDescription]}>{item.description}</Text>
                <Text style={[styles.cellTextMuted, styles.colType]}>
                  {PRICING_TYPE_LABELS[item.pricingType as PricingType]}
                  {item.unit ? ` (${item.unit})` : ''}
                </Text>
                <Text style={[styles.cellTextMono, styles.colRate]}>
                  {formatCurrency(Number(item.rate))}
                </Text>
                <Text style={[styles.cellTextMono, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.cellTextMuted, styles.colDiscount]}>
                  {Number(item.discount) > 0 ? `${item.discount}%` : '\u2014'}
                </Text>
                <Text style={[styles.cellTextBold, styles.cellTextMono, styles.colTotal]}>
                  {formatCurrency(pricing.lineItemTotals[index])}
                </Text>
              </View>
            ))}

            {/* Pricing summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Quote Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatCurrency(pricing.subtotal)}</Text>
              </View>

              {quote.depositPercent > 0 && (
                <>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Deposit ({quote.depositPercent}%)</Text>
                    <Text style={styles.summaryValueGold}>
                      {formatCurrency(pricing.depositAmount)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Balance Due</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(
                        new Decimal(pricing.subtotal).minus(pricing.depositAmount).toNumber(),
                      )}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.summaryDivider} />
              <View style={styles.summaryTotal}>
                <Text style={styles.summaryTotalLabel}>
                  {quote.depositPercent > 0 ? 'Amount Due' : 'Total'}
                </Text>
                <Text style={styles.summaryTotalValue}>
                  {formatCurrency(
                    quote.depositPercent > 0 ? pricing.depositAmount : pricing.subtotal,
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notes */}
        {quote.notes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Notes & Terms</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.notesText}>{quote.notes}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>Generated by QuoteCraft • {formatDate(new Date())}</Text>
      </Page>
    </Document>
  );
}
