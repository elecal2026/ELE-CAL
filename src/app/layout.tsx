import type { Metadata } from 'next'
import { Barlow } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { jaJP } from '@clerk/localizations'
import './globals.css'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-barlow',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ELE-CAL | 電気工事 計算・参照ツール',
  description: '電気工事 計算・参照ツール',
  icons: {
    icon: '/ELE-CAL.png',
    apple: '/ELE-CAL.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider localization={jaJP}>
      <html lang="ja" className={barlow.variable}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
