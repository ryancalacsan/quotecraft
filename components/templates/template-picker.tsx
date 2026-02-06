'use client';

import { useState, useTransition } from 'react';
import { FileText, FolderOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createQuoteFromTemplate } from '@/app/actions/templates';
import type { Template } from '@/lib/db/schema';

interface TemplatePickerProps {
  templates: Template[];
}

export function TemplatePicker({ templates }: TemplatePickerProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSelectTemplate(templateId: string) {
    setSelectedId(templateId);
    startTransition(async () => {
      await createQuoteFromTemplate(templateId);
      // Redirect happens in the action
    });
  }

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FolderOpen className="text-muted-foreground h-5 w-5" />
        <h3 className="font-medium">Start from a Template</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.slice(0, 6).map((template) => (
          <Card
            key={template.id}
            className="card-hover hover:border-gold/50 cursor-pointer transition-colors"
            onClick={() => handleSelectTemplate(template.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                {isPending && selectedId === template.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="text-muted-foreground h-4 w-4" />
                )}
                {template.name}
              </CardTitle>
              {template.description && (
                <CardDescription className="line-clamp-2 text-xs">
                  {template.description}
                </CardDescription>
              )}
            </CardHeader>
            {template.defaultTitle && (
              <CardContent className="pt-0">
                <p className="text-muted-foreground truncate text-xs">
                  Default: {template.defaultTitle}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {templates.length > 6 && (
        <div className="text-center">
          <Link href="/templates">
            <Button variant="link" size="sm">
              View all {templates.length} templates
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
