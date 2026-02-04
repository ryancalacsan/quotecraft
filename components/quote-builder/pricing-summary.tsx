import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';

interface PricingSummaryProps {
  subtotal: number;
  depositPercent: number;
  depositAmount: number;
}

export function PricingSummary({ subtotal, depositPercent, depositAmount }: PricingSummaryProps) {
  const balanceDue = subtotal - depositAmount;

  return (
    <div className="ml-auto w-72 rounded-lg border border-border/60 bg-card/50 p-4 paper-texture">
      {/* Receipt header */}
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Quote Summary
      </p>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-mono tabular-nums">{formatCurrency(subtotal)}</span>
        </div>

        {depositPercent > 0 && (
          <>
            <Separator className="my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Deposit ({depositPercent}%)</span>
              <span className="font-mono tabular-nums text-gold font-medium">
                {formatCurrency(depositAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance Due</span>
              <span className="font-mono tabular-nums">{formatCurrency(balanceDue)}</span>
            </div>
          </>
        )}

        <Separator className="my-2" />

        {/* Total - prominent */}
        <div className="flex items-baseline justify-between pt-1">
          <span className="font-display text-base">Total</span>
          <span className="font-mono tabular-nums text-xl font-semibold">
            {formatCurrency(subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
