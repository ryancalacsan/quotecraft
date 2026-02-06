'use client';

import { useState, useTransition } from 'react';
import { Copy, Loader2, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { deleteTemplate, createQuoteFromTemplate } from '@/app/actions/templates';
import type { Template } from '@/lib/db/schema';

export function TemplateCard({ template }: { template: Template }) {
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<'create' | 'delete' | null>(null);

  function handleCreateQuote() {
    setPendingAction('create');
    startTransition(async () => {
      await createQuoteFromTemplate(template.id);
      // Redirect happens in the action, but just in case:
      setPendingAction(null);
    });
  }

  function handleDelete() {
    if (!confirm('Are you sure you want to delete this template?')) return;
    setPendingAction('delete');
    startTransition(async () => {
      await deleteTemplate(template.id);
      toast.success('Template deleted');
      setPendingAction(null);
    });
  }

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{template.name}</CardTitle>
          {template.description && (
            <p className="text-muted-foreground line-clamp-1 text-sm">{template.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="gold" size="sm" onClick={handleCreateQuote} disabled={isPending}>
            {pendingAction === 'create' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Use Template
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Actions for ${template.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCreateQuote} disabled={isPending}>
                {pendingAction === 'create' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {pendingAction === 'create' ? 'Creating...' : 'Create Quote from Template'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isPending}
                className="text-destructive"
              >
                {pendingAction === 'delete' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {pendingAction === 'delete' ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          {template.defaultTitle && (
            <span className="truncate">Default title: {template.defaultTitle}</span>
          )}
          <span className="shrink-0">{formatDate(template.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
