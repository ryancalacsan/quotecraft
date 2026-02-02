import Link from 'next/link';

import { Separator } from '@/components/ui/separator';

export default function PublicQuoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-6">
          <Link href="/" className="text-lg font-semibold">
            QuoteCraft
          </Link>
        </div>
      </header>
      <main className="flex-1 py-8">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-center px-6">
          <p className="text-muted-foreground text-sm">
            Powered by{' '}
            <Link href="/" className="hover:text-foreground underline underline-offset-4">
              QuoteCraft
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
