import { redirect } from 'next/navigation'

export default function MenuRedirect() {
  redirect('/fr/menu?source=qr-restaurant')
}
