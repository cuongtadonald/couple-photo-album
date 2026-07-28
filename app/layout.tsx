import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import { Caveat, Quicksand } from 'next/font/google'
import './globals.css'

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
})

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-handwriting',
})

export const metadata: Metadata = {
  title: 'Cuong <3 Vy\'s Home',
  description: 'An app for couples to share memories, letters, and events',
  generator: 'v0.app',
  icons: {
    icon: '/cuongvynamtay.jpg',
    apple: '/cuongvynamtay.jpg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${quicksand.variable} ${caveat.variable}`}>
      <body className="antialiased font-[family-name:var(--font-body)]">
        <AuthProvider>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  )
}
