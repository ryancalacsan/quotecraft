'use client';

import {
  FileText,
  Share2,
  CreditCard,
  Moon,
  FolderOpen,
  FileDown,
  BarChart3,
  GripVertical,
} from 'lucide-react';

import { DemoLoginButton } from '@/components/shared/demo-login-button';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="bg-foreground flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-background font-serif text-lg font-semibold italic">Q</span>
            </div>
            <span className="text-xl font-bold">QuoteCraft</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DemoLoginButton />
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Professional quotes
              <br />
              <span className="text-muted-foreground">in minutes, not hours</span>
            </h1>
            <p className="text-muted-foreground mx-auto max-w-xl text-lg">
              Create polished quotes with real-time pricing, save templates for repeat clients,
              export to PDF, and get paid via Stripe — all in one place.
            </p>
            <div className="flex flex-col items-center justify-center gap-4">
              <DemoLoginButton size="lg" />
              <p className="text-muted-foreground text-sm">
                This is a portfolio demo — explore the full app instantly
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted/30 border-t px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need to quote with confidence
            </h2>
            <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-center">
              From quick estimates to detailed proposals, QuoteCraft handles the entire workflow.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<FileText className="h-5 w-5" />}
                title="Quote Builder"
                description="Add line items with hourly, fixed, or per-unit pricing. Real-time totals with precise decimal math."
              />
              <FeatureCard
                icon={<FolderOpen className="h-5 w-5" />}
                title="Quote Templates"
                description="Save quotes as reusable templates. Start new projects in seconds with pre-filled line items."
              />
              <FeatureCard
                icon={<Share2 className="h-5 w-5" />}
                title="Shareable Links"
                description="Send a link to your client. They can view, accept, or decline — no account needed."
              />
              <FeatureCard
                icon={<CreditCard className="h-5 w-5" />}
                title="Stripe Payments"
                description="Collect deposits or full payments via Stripe Checkout. Status updates automatically."
              />
              <FeatureCard
                icon={<FileDown className="h-5 w-5" />}
                title="PDF Export"
                description="Download professional PDF quotes to attach to emails or print for in-person meetings."
              />
              <FeatureCard
                icon={<BarChart3 className="h-5 w-5" />}
                title="Dashboard Analytics"
                description="Track revenue trends, quote status breakdown, and conversion rates at a glance."
              />
              <FeatureCard
                icon={<GripVertical className="h-5 w-5" />}
                title="Drag & Drop"
                description="Reorder line items with intuitive drag-and-drop. Keyboard accessible for all users."
              />
              <FeatureCard
                icon={<Moon className="h-5 w-5" />}
                title="Dark Mode"
                description="Easy on the eyes with system-aware dark mode. Toggle manually or follow your device."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-24 text-center">
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to see it in action?
            </h2>
            <p className="text-muted-foreground">
              Try the interactive demo to explore quote creation, templates, PDF export, and Stripe
              payments.
            </p>
            <DemoLoginButton size="lg" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-center px-6">
          <p className="text-muted-foreground text-sm">
            Built by{' '}
            <a
              href="https://github.com/ryancalacsan"
              className="hover:text-foreground underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ryan Calacsan
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="bg-background space-y-3 rounded-lg border p-5 transition-shadow duration-200 hover:shadow-md">
      <div className="text-gold">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </article>
  );
}
