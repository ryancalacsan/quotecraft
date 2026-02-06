'use client';

import { FolderOpen } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';
import { TemplateCard } from './template-card';
import { STAGGER_DELAY } from '@/lib/animations';
import type { Template } from '@/lib/db/schema';

export function TemplateList({ templates }: { templates: Template[] }) {
  if (templates.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen />}
        title="No templates yet"
        description="Save a quote as a template to reuse it later. Templates preserve line items, notes, and default settings."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {templates.map((template, index) => (
        <div
          key={template.id}
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
          style={{
            animationDelay: `${200 + index * STAGGER_DELAY}ms`,
            animationDuration: '400ms',
          }}
        >
          <TemplateCard template={template} />
        </div>
      ))}
    </div>
  );
}
