import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';

import { Toaster } from '@/components/ui/sonner';

import { DemoBanner } from '@/components/shared/demo-banner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <DemoBanner />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
