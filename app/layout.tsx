import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

import { DemoBanner } from '@/components/shared/demo-banner';
import { ThemeProvider } from '@/components/shared/theme-provider';
import './globals.css';

// Primary font - modern, geometric, highly legible
// Use weight variations for hierarchy (400, 500, 600, 700)
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

// Monospace font - strictly for financial numbers and quote IDs
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://quotecraft.vercel.app'),
  title: {
    default: 'QuoteCraft — Quote Builder for Freelancers',
    template: '%s | QuoteCraft',
  },
  description:
    'Create professional quotes, share them with clients, and accept payments. A modern quote builder for freelancers and contractors.',
  keywords: ['quote builder', 'freelancer', 'contractor', 'invoicing', 'payments', 'stripe'],
  authors: [{ name: 'Ryan Calacsan' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'QuoteCraft',
    title: 'QuoteCraft — Quote Builder for Freelancers',
    description:
      'Create professional quotes, share them with clients, and accept payments. A modern quote builder for freelancers and contractors.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuoteCraft — Quote Builder for Freelancers',
    description:
      'Create professional quotes, share them with clients, and accept payments. A modern quote builder for freelancers and contractors.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${dmSans.variable} ${jetbrainsMono.variable} font-body antialiased`}>
          <ThemeProvider>
            <TooltipProvider>
              <DemoBanner />
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
