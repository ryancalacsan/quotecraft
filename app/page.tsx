'use client';

import { useEffect, useState } from 'react';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame to defer state update and satisfy lint rule
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="bg-foreground flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-background -translate-x-px font-serif text-lg font-semibold italic">
                Q
              </span>
            </div>
            <span className="text-xl font-bold tracking-tight">QuoteCraft</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DemoLoginButton />
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-24 text-center md:py-32">
          {/* Decorative background elements */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Subtle radial gradient */}
            <div className="bg-gold/5 absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-3xl" />
            {/* Decorative diagonal line */}
            <div className="bg-gold/20 absolute top-20 -right-20 h-px w-96 rotate-45" />
            <div className="bg-gold/10 absolute bottom-32 -left-20 h-px w-64 -rotate-45" />
          </div>

          <div className="relative mx-auto max-w-3xl space-y-8">
            {/* Headline with staggered animation */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span
                className={`inline-block transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              >
                Professional <span className="font-serif italic">quotes</span>
              </span>
              <br />
              <span
                className={`text-muted-foreground inline-block transition-all delay-150 duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              >
                in minutes, not hours
              </span>
            </h1>

            {/* Gold accent line */}
            <div
              className={`bg-gold mx-auto h-1 w-16 rounded-full transition-all delay-300 duration-700 ${mounted ? 'w-16 opacity-100' : 'w-0 opacity-0'}`}
            />

            <p
              className={`text-muted-foreground mx-auto max-w-xl text-lg transition-all delay-300 duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
              Create polished quotes with real-time pricing, save templates for repeat clients,
              export to PDF, and get paid via Stripe — all in one place.
            </p>

            <div
              className={`flex flex-col items-center justify-center gap-4 transition-all delay-500 duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
              <DemoLoginButton size="lg" />
              <p className="text-muted-foreground text-sm">
                Portfolio demo — explore the full app instantly
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="relative border-t px-6 py-24">
          {/* Subtle background texture */}
          <div className="bg-muted/30 absolute inset-0" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
                Everything you need to quote with confidence
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                From quick estimates to detailed proposals, QuoteCraft handles the entire workflow.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={index * 75}
                  mounted={mounted}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative px-6 py-24 text-center">
          {/* Decorative elements */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="bg-gold/5 absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-2xl space-y-6">
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
              className="hover:text-foreground underline underline-offset-4 transition-colors"
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

const features = [
  {
    icon: <FileText className="h-5 w-5" />,
    title: 'Quote Builder',
    description:
      'Add line items with hourly, fixed, or per-unit pricing. Real-time totals with precise decimal math.',
  },
  {
    icon: <FolderOpen className="h-5 w-5" />,
    title: 'Quote Templates',
    description:
      'Save quotes as reusable templates. Start new projects in seconds with pre-filled line items.',
  },
  {
    icon: <Share2 className="h-5 w-5" />,
    title: 'Shareable Links',
    description:
      'Send a link to your client. They can view, accept, or decline — no account needed.',
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: 'Stripe Payments',
    description:
      'Collect deposits or full payments via Stripe Checkout. Status updates automatically.',
  },
  {
    icon: <FileDown className="h-5 w-5" />,
    title: 'PDF Export',
    description:
      'Download professional PDF quotes to attach to emails or print for in-person meetings.',
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Dashboard Analytics',
    description: 'Track revenue trends, quote status breakdown, and conversion rates at a glance.',
  },
  {
    icon: <GripVertical className="h-5 w-5" />,
    title: 'Drag & Drop',
    description:
      'Reorder line items with intuitive drag-and-drop. Keyboard accessible for all users.',
  },
  {
    icon: <Moon className="h-5 w-5" />,
    title: 'Dark Mode',
    description:
      'Easy on the eyes with system-aware dark mode. Toggle manually or follow your device.',
  },
];

function FeatureCard({
  icon,
  title,
  description,
  delay,
  mounted,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  mounted: boolean;
}) {
  return (
    <article
      className={`bg-background space-y-3 rounded-lg border p-5 transition-all duration-500 ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
      style={{ transitionDelay: mounted ? `${delay}ms` : '0ms' }}
    >
      <div className="text-gold mb-3">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
    </article>
  );
}
