import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { JsonLd } from '@/components/json-ld'
import { generateOrganizationSchema } from '@/lib/structured-data'
import { PwaRegister } from '@/components/pwa-register'
import { LocaleProvider } from '@/components/i18n/locale-provider'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'
import { CookieConsent } from '@/components/cookie-consent'
import { FeedbackWidget } from '@/components/feedback/feedback-widget'
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
      <head>
        {/*
          Marks the document as JavaScript-capable before first paint, so CSS can
          scope JS-dependent hidden states to `.js` (see `.js .sr-reveal` in
          globals.css). Without it, ScrollReveal's server-rendered markup is
          invisible, and a blocked or failed bundle leaves the page blank rather
          than merely unanimated. Inline and synchronous on purpose: it must run
          before paint or the reveal animations flash.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
      </head>
      <PHProvider>
        <StatsigClientProvider>
        <body className={`${dmSans.variable} ${lora.variable} bg-white font-sans antialiased`}>
          {/*
            First focusable element on every page. Without it the only way past
            the header and its mega-menu is to tab through all of it, on all 236
            routes. Visually hidden until focused.
          */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:border focus:border-border focus:bg-background focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-icon-green"
          >
            Skip to main content
          </a>
          <Suspense fallback={null}>
            <PostHogPageview />
          </Suspense>
          <JsonLd data={generateOrganizationSchema()} />
          <Nav />
          <LocaleProvider>
            <main id="main" tabIndex={-1}>{children}</main>
          </LocaleProvider>
          <Footer />
          <Analytics />
          <Toaster position="bottom-center" richColors />
          <PwaRegister />
          <PwaInstallPrompt />
          <CookieConsent />
          <FeedbackWidget />
        </body>
        </StatsigClientProvider>
      </PHProvider>
    </html>
  )
}
