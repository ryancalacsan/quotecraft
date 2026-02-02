import Link from 'next/link';
import { FileText, Share2, CreditCard, Zap, Shield, BarChart3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DemoLoginButton } from '@/components/shared/demo-login-button';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-bold">QuoteCraft</span>
          <div className="flex items-center gap-3">
            <DemoLoginButton variant="outline" />
            <Link href="/sign-up">
              <Button>Sign Up Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Professional quotes
            <br />
            <span className="text-muted-foreground">in minutes, not hours</span>
          </h1>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            Create polished quotes with real-time pricing, share them with a link, and get paid
            — all in one place. Built for freelancers and contractors.
          </p>
          <div className="flex items-center justify-center gap-4">
            <DemoLoginButton size="lg" />
            <Link href="/sign-up">
              <Button variant="outline" size="lg">
                Sign Up Free
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground text-xs">No credit card required</p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Everything you need to quote with confidence
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Quote Builder"
              description="Add line items with hourly, fixed, or per-unit pricing. Real-time totals powered by precise decimal math."
            />
            <FeatureCard
              icon={<Share2 className="h-6 w-6" />}
              title="Shareable Links"
              description="Send a link to your client. They can view, accept, or decline — no account needed."
            />
            <FeatureCard
              icon={<CreditCard className="h-6 w-6" />}
              title="Stripe Payments"
              description="Collect deposits or full payments via Stripe Checkout. Status updates automatically on payment."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Real-Time Pricing"
              description="Subtotals, discounts, and deposits calculated instantly as you build your quote."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Quote Locking"
              description="Quotes freeze when sent so clients see a consistent proposal. Revert to draft to make changes."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Status Tracking"
              description="Track quotes through draft, sent, accepted, and paid stages with a clear dashboard."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to streamline your quoting?
          </h2>
          <p className="text-muted-foreground">
            Try the demo to see QuoteCraft in action, or sign up to start creating quotes today.
          </p>
          <div className="flex items-center justify-center gap-4">
            <DemoLoginButton size="lg" />
            <Link href="/sign-up">
              <Button variant="outline" size="lg">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
    <div className="space-y-3 rounded-lg border p-6">
      <div className="text-foreground">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
