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
    <div className="border-border/60 bg-card/50 ml-auto w-72 rounded-lg border p-4">
      {/* Receipt header */}
      <p className="text-muted-foreground mb-3 text-center text-sm font-medium">Quote Summary</p>

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
              <span className="text-gold font-mono font-medium tabular-nums">
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
          <span className="text-base font-semibold">Total</span>
          <span className="font-mono text-xl font-semibold tabular-nums">
            {formatCurrency(subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
