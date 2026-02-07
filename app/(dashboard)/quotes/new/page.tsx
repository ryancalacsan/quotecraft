import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { getTemplatesByUserId } from '@/lib/db/queries/templates';
import { QuoteForm } from '@/components/quote-builder/quote-form';
import { TemplatePicker } from '@/components/templates/template-picker';
import { Separator } from '@/components/ui/separator';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

export const metadata = {
  title: 'New Quote',
};

export default async function NewQuotePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const templates = await getTemplatesByUserId(userId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'New Quote' }]} />

      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">New Quote</h2>
        <div className="bg-gold mt-2 h-1 w-12 rounded-full" />
        <p className="text-muted-foreground mt-3">
          Enter the basic details first. You&apos;ll add line items in the next step.
        </p>
      </div>

      {templates.length > 0 && (
        <>
          <TemplatePicker templates={templates} />
          <div className="relative">
            <Separator />
            <span className="bg-background text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-sm">
              or start from scratch
            </span>
          </div>
        </>
      )}

      <QuoteForm />
    </div>
  );
}
