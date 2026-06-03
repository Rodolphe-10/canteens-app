import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: "Staff — The Canteen's",
  robots: 'noindex, nofollow',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#0A0A0A]">{children}</div>
}
