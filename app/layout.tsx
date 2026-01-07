import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Hausverwaltung Boss - Moderne Immobilienverwaltung",
  description: "Die moderne Lösung für private Vermieter und WEG-Verwalter. Keine doppelte Buchführung nötig.",
  keywords: ["Hausverwaltung", "Immobilienverwaltung", "Vermieter", "WEG", "Nebenkostenabrechnung", "Mieterverwaltung"],
  authors: [{ name: "Hausverwaltung Boss" }],
  creator: "Hausverwaltung Boss",
  publisher: "Hausverwaltung Boss",
  metadataBase: new URL('https://hausverwaltung-boss.de'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://hausverwaltung-boss.de',
    title: 'Hausverwaltung Boss - Moderne Immobilienverwaltung',
    description: 'Die moderne Lösung für private Vermieter und WEG-Verwalter. Keine doppelte Buchführung nötig.',
    siteName: 'Hausverwaltung Boss',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hausverwaltung Boss - Moderne Immobilienverwaltung',
    description: 'Die moderne Lösung für private Vermieter und WEG-Verwalter. Keine doppelte Buchführung nötig.',
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
}

export const viewport: Viewport = {
  themeColor: "#0F172A",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
