import type { Metadata } from 'next'
import { Geist, Geist_Mono, Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _poppins = Poppins({ weight: ["600", "700"], subsets: ["latin"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: 'TodoWallet - 한 일은 사라지지 않는다',
  description: '당신의 할 일을 카드처럼 관리하세요',
  generator: 'v0.app',
  manifest: '/site.webmanifest',
  icons: {
    icon: [{ url: "/todowallet-logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`font-sans antialiased ${_poppins.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
