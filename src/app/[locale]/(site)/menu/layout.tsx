import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  // Manifest dédié : « Ajouter à l'écran d'accueil » ouvrira /fr/menu
  manifest: '/menu.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TC Menu',
  },
}

export default function MenuLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
