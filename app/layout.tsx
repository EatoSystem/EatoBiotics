import type { Metadata, Viewport } from 'next'
import { DM_Sans, Instrument_Serif, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import './globals.css'

const _dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const _instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
})

const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
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
    <html lang="en">
      <body className="font-sans antialiased">
        <Nav />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
