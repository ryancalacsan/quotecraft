import Link from 'next/link';
import { FileText, FolderOpen, LayoutDashboard, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import { UserMenu } from '@/components/shared/user-menu';
import { ThemeToggle } from '@/components/shared/theme-toggle';

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
          <Link href="/templates">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <FolderOpen className="h-4 w-4" />
              Templates
            </Button>
          </Link>
        </nav>
        <div className="flex items-center justify-between border-t p-4">
          <UserMenu />
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-3">
            <MobileNav />
            <UserMenu />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/quotes/new">
              <Button size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">New Quote</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
