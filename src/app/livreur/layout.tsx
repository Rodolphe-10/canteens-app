import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "The Canteen's — Livreur",
  // Manifest dédié : « Ajouter à l'écran d'accueil » ouvrira /livreur,
  // indépendamment de l'app menu (start_url /fr/menu)
  manifest: '/livreur.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TC Livreur',
  },
}

export default function LivreurLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
