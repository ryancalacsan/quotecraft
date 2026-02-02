import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { FileText, LayoutDashboard, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MobileNav } from '@/components/dashboard/mobile-nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="bg-muted/40 hidden w-64 flex-col border-r md:flex">
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard" className="text-xl font-bold">
            QuoteCraft
          </Link>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/quotes/new">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Plus className="h-4 w-4" />
              New Quote
            </Button>
          </Link>
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <UserButton />
            <span className="text-muted-foreground text-sm">Account</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-3">
            <MobileNav />
            <UserButton />
          </div>
          <Link href="/quotes/new">
            <Button size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">New Quote</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
