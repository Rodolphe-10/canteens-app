import ReservationView from '@/components/reservation/ReservationView'

export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ espace?: string }>
}) {
  const { locale } = await params
  const { espace } = await searchParams
  return <ReservationView locale={locale} defaultEspace={espace} />
}
