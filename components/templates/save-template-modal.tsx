'use client';

import { useState, useTransition, useId } from 'react';
import { FolderPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveAsTemplate } from '@/app/actions/templates';

interface SaveTemplateModalProps {
  quoteId: string;
  quoteTitle: string;
}

type FieldErrors = Record<string, string[]>;

export function SaveTemplateModal({ quoteId, quoteTitle }: SaveTemplateModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const formId = useId();

  function handleSubmit(formData: FormData) {
    setError(null);
    setFieldErrors(null);
    startTransition(async () => {
      const result = await saveAsTemplate(quoteId, formData);

      if (result.error) {
        if (typeof result.error === 'string') {
          setError(result.error);
        } else {
          // Field-level validation errors
          setFieldErrors(result.error as FieldErrors);
        }
        return;
      }

      setOpen(false);
      toast.success('Template saved successfully');
    });
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset errors when dialog closes
      setError(null);
      setFieldErrors(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderPlus className="mr-2 h-4 w-4" />
          Save as Template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Create a reusable template from this quote. Line items, notes, and settings will be
            preserved.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-name`}>
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${formId}-name`}
              name="name"
              placeholder="e.g., Standard Web Project"
              defaultValue={quoteTitle}
              aria-invalid={!!fieldErrors?.name}
              aria-describedby={fieldErrors?.name ? `${formId}-name-error` : undefined}
            />
            {fieldErrors?.name && (
              <p id={`${formId}-name-error`} className="text-destructive text-sm" role="alert">
                {fieldErrors.name[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-description`}>Description</Label>
            <Textarea
              id={`${formId}-description`}
              name="description"
              placeholder="Brief description of when to use this template..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-defaultValidDays`}>Default Valid Days</Label>
            <Input
              id={`${formId}-defaultValidDays`}
              name="defaultValidDays"
              type="number"
              min="1"
              max="365"
              placeholder="e.g., 30"
              aria-invalid={!!fieldErrors?.defaultValidDays}
              aria-describedby={
                fieldErrors?.defaultValidDays ? `${formId}-defaultValidDays-error` : undefined
              }
            />
            {fieldErrors?.defaultValidDays && (
              <p
                id={`${formId}-defaultValidDays-error`}
                className="text-destructive text-sm"
                role="alert"
              >
                {fieldErrors.defaultValidDays[0]}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Quotes created from this template will be valid for this many days.
            </p>
          </div>

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
