import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-muted/30 flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center',
        className,
      )}
    >
      <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <div className="text-muted-foreground [&>svg]:h-8 [&>svg]:w-8">{icon}</div>
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm text-sm">{description}</p>
      {action}
    </div>
  );
}
