import ReservationView from '@/components/reservation/ReservationView'

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <ReservationView locale={locale} />
}
