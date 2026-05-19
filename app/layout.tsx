import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { JsonLd } from '@/components/json-ld'
import { generateOrganizationSchema } from '@/lib/structured-data'
import { PwaRegister } from '@/components/pwa-register'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'
import { CookieConsent } from '@/components/cookie-consent'
import { Toaster } from 'sonner'
import { PHProvider } from '@/components/providers/posthog-provider'
import { PostHogPageview } from '@/components/providers/posthog-pageview'
import { StatsigClientProvider } from '@/components/providers/statsig-provider'
import { Suspense } from 'react'
import './globals.css'

const dmSans = localFont({
  src: [
    { path: '../public/fonts/DMSans.ttf', weight: '400 700', style: 'normal' },
    { path: '../public/fonts/DMSans-Italic.ttf', weight: '400 700', style: 'italic' },
  ],
  variable: '--font-dm-sans',
  display: 'swap',
})

const lora = localFont({
  src: [
    { path: '../public/fonts/Lora.ttf', weight: '400 700', style: 'normal' },
    { path: '../public/fonts/Lora-Italic.ttf', weight: '400 700', style: 'italic' },
  ],
  variable: '--font-lora',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://eatobiotics.com'),
  title: {
    default: 'EatoBiotics — The Food System Inside You',
    template: '%s | EatoBiotics',
  },
  description:
    'A practical guide to the foods that strengthen your microbiome and improve how you feel day to day — digestion, immunity, energy, mood, and recovery.',
  icons: {
    icon: '/favicon.webp',
    apple: '/apple-icon.png',
  },
  openGraph: {
    siteName: 'EatoBiotics',
    type: 'website',
    locale: 'en_IE',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@eatobiotics',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EatoBiotics',
  },
}

export const viewport: Viewport = {
  themeColor: '#56C135',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" style={{ backgroundColor: "#FFFFFF" }}>
      <PHProvider>
        <StatsigClientProvider>
        <body className={`${dmSans.variable} ${lora.variable} bg-white font-sans antialiased`}>
          <Suspense fallback={null}>
            <PostHogPageview />
          </Suspense>
          <JsonLd data={generateOrganizationSchema()} />
          <Nav />
          <main>{children}</main>
          <Footer />
          <Analytics />
          <Toaster position="bottom-center" richColors />
          <PwaRegister />
          <PwaInstallPrompt />
          <CookieConsent />
        </body>
        </StatsigClientProvider>
      </PHProvider>
    </html>
  )
}
