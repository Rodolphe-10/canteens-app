import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "The Canteen's",
  description: "The Canteen's — Restaurant · Bar · Lounge · Game Room",
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
