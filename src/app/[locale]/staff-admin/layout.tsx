import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: "Staff — The Canteen's",
  robots: 'noindex, nofollow',
  // Manifest dédié : « Ajouter à l'écran d'accueil » ouvrira /fr/staff-admin
  manifest: '/staff.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TC Staff',
  },
}

export default function StaffAdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
