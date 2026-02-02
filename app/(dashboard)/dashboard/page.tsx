import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <p className="text-muted-foreground mt-2">Your quotes will appear here.</p>
    </div>
  );
}
