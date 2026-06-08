import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "The Canteen's",
  description: "The Canteen's — Restaurant · Bar · Lounge · Game Room",
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className="bg-tc-black text-tc-cream antialiased">{children}</body>
    </html>
  )
}
