
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { AWSClientProvider } from '@/aws/client-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { PerformanceMonitor } from '@/components/performance-monitor';

export const metadata: Metadata = {
  title: 'Co-agent Marketer',
  description: 'The integrated success platform for real estate agents.',
  manifest: '/manifest.json',
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
        <meta name="theme-color" content="#3B82F6" />
        {/* Preconnect to external domains for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Load fonts with display=swap to prevent blocking */}
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
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
