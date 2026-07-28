import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import { Corinthia } from 'next/font/google'
import './globals.css'

const corinthia = Corinthia({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-corinthia',
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
    <html lang="vi" className={corinthia.variable}>
      <body className="antialiased font-[family-name:var(--font-corinthia)]">
        <AuthProvider>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  )
}
