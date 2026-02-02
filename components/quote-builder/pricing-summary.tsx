import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';

interface PricingSummaryProps {
  subtotal: number;
  depositPercent: number;
  depositAmount: number;
}

export function PricingSummary({ subtotal, depositPercent, depositAmount }: PricingSummaryProps) {
  return (
    <div className="ml-auto w-64 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium">{formatCurrency(subtotal)}</span>
      </div>
      {depositPercent > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Deposit ({depositPercent}%)</span>
          <span className="font-medium">{formatCurrency(depositAmount)}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
    </div>
  );
}
