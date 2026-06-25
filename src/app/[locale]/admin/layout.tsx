import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: "Admin — The Canteen's",
  robots: 'noindex, nofollow',
  // Manifest dédié : « Ajouter à l'écran d'accueil » ouvrira /fr/admin
  manifest: '/admin.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TC Admin',
  },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#0A0A0A]">{children}</div>
}
