import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { ensureUserExists } from '@/lib/db/queries';
import { getTemplatesByUserId } from '@/lib/db/queries/templates';
import { TemplateList } from '@/components/templates/template-list';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

export const metadata = {
  title: 'Templates',
};

export default async function TemplatesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Ensure user exists in DB before querying
  await ensureUserExists(userId);

  const templates = await getTemplatesByUserId(userId);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Templates' }]} />

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h2 className="font-display text-2xl tracking-tight">Templates</h2>
        <p className="text-muted-foreground">
          Save and reuse quote templates to speed up your workflow.
        </p>
      </div>

      <TemplateList templates={templates} />
    </div>
  );
}
