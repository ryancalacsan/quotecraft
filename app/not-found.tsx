import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="bg-muted mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <FileQuestion className="text-muted-foreground h-8 w-8" />
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
