import React from "react"
import type { Metadata } from 'next'

import { Analytics } from '@vercel/analytics/next'
import './globals.css'

import { Geist_Mono, Bebas_Neue as V0_Font_Bebas_Neue, Geist_Mono as V0_Font_Geist_Mono, Crimson_Text as V0_Font_Crimson_Text } from 'next/font/google'

// Initialize fonts
const _bebasNeue = V0_Font_Bebas_Neue({ subsets: ['latin'], weight: ["400"] })
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _crimsonText = V0_Font_Crimson_Text({ subsets: ['latin'], weight: ["400","600","700"] })

export const metadata: Metadata = {
  title: 'OptiMelon - High-Signal LLM Wrapper',
  description: 'A clean, provider-agnostic LLM chat interface designed for productive technical work.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
