
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { AWSClientProvider } from '@/aws/client-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { PerformanceMonitor } from '@/components/performance-monitor';

export const metadata: Metadata = {
  title: {
    default: 'Bayon Coagent - AI-Powered Success Platform for Real Estate Agents',
    template: '%s | Bayon Coagent',
  },
  description: 'The integrated success platform for real estate agents. AI-powered content creation, market research, and brand management tools.',
  manifest: '/manifest.json',
  keywords: ['real estate', 'AI', 'marketing', 'content creation', 'market research', 'brand management'],
  authors: [{ name: 'Bayon Coagent' }],
  creator: 'Bayon Coagent',
  publisher: 'Bayon Coagent',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Bayon Coagent - AI-Powered Success Platform for Real Estate Agents',
    description: 'The integrated success platform for real estate agents. AI-powered content creation, market research, and brand management tools.',
    url: '/',
    siteName: 'Bayon Coagent',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bayon Coagent - AI-Powered Success Platform for Real Estate Agents',
    description: 'The integrated success platform for real estate agents. AI-powered content creation, market research, and brand management tools.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

/**
 * The root layout for the entire application.
 * It sets up the HTML structure, includes global styles, fonts, and providers.
 * Optimized for fast initial page load (< 2 seconds target)
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme color for browser chrome */}
        <meta name="theme-color" content="#3B82F6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1E293B" media="(prefers-color-scheme: dark)" />

        {/* Viewport optimization for mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

        {/* Load fonts with display=swap to prevent blocking */}
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />

        {/* Favicon and app icons */}
        <link rel="icon" href="/icon-192x192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AWSClientProvider>
            {children}
          </AWSClientProvider>
          <Toaster />
        </ThemeProvider>
        {/* Performance monitoring in development */}
        <PerformanceMonitor />
      </body>
    </html>
  );
}
