import type { ReactNode } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartHost from '@/components/restauration/CartHost'
import ChatBot from '@/components/ui/ChatBot'

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <>
      <Navbar locale={locale} />
      <CartHost locale={locale} />
      <main>{children}</main>
      <Footer locale={locale} />
      <ChatBot locale={locale} />
    </>
  )
}
