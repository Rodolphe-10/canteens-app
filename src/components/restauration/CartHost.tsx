'use client'

import Cart from './Cart'

export default function CartHost({ locale }: { locale: string }) {
  return <Cart locale={locale} />
}
