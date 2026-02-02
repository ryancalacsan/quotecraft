import { UserButton } from '@clerk/nextjs';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">QuoteCraft</h1>
          <UserButton />
        </div>
      </header>
      <main className="container mx-auto flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
