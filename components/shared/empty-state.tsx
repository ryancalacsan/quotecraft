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
        'animate-in fade-in duration-500 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 px-6 py-20 text-center paper-texture',
        className,
      )}
    >
      {/* Icon with subtle gradient background */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/50 shadow-inner">
        <div className="text-muted-foreground/70 [&>svg]:h-10 [&>svg]:w-10">{icon}</div>
      </div>

      {/* Title with display font */}
      <h3 className="font-display mb-3 text-xl">{title}</h3>

      {/* Description */}
      <p className="text-muted-foreground mb-8 max-w-md text-sm leading-relaxed">{description}</p>

      {/* Action button */}
      {action}
    </div>
  );
}
