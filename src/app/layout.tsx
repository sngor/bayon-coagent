
import type { Metadata } from 'next';
import { PT_Sans, Playfair_Display } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { AWSClientProvider } from '@/aws/client-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { PerformanceMonitor } from '@/components/performance-monitor';
import { PWAInstallPrompt } from '@/components/mobile/pwa-install-prompt';
import { OfflineIndicator } from '@/components/mobile/offline-indicator';

// Optimize font loading with Next.js font optimization
const ptSans = PT_Sans({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pt-sans',
});

const playfairDisplay = Playfair_Display({
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: {
    default: 'Bayon Coagent - AI-Powered Success Platform for Real Estate Agents',
    template: '%s | Bayon Coagent',
  },
  description: 'The AI-powered platform that helps real estate agents create content, research markets, and build their brand—all in one place.',
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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Bayon Coagent - AI-Powered Success Platform for Real Estate Agents',
    description: 'The AI-powered platform that helps real estate agents create content, research markets, and build their brand—all in one place.',
    url: '/',
    siteName: 'Bayon Coagent',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bayon Coagent - AI-Powered Success Platform for Real Estate Agents',
    description: 'The AI-powered platform that helps real estate agents create content, research markets, and build their brand—all in one place.',
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
    <html lang="en" suppressHydrationWarning className={`${ptSans.variable} ${playfairDisplay.variable}`}>
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
          <PWAInstallPrompt />
          <OfflineIndicator />
        </ThemeProvider>
        {process.env.NODE_ENV === 'development' && <PerformanceMonitor />}
      </body>
    </html>
  );
}
