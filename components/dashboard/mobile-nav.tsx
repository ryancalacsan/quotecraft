'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FolderOpen, LayoutDashboard, Menu, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation links for QuoteCraft
        </SheetDescription>
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard" className="text-xl font-bold" onClick={() => setOpen(false)}>
            QuoteCraft
          </Link>
        </div>
        <nav className="space-y-1 px-3 py-4">
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/quotes/new" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Plus className="h-4 w-4" />
              New Quote
            </Button>
          </Link>
          <Link href="/templates" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <FolderOpen className="h-4 w-4" />
              Templates
            </Button>
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
