import EvenementsView from '@/components/evenements/EvenementsView'

export default async function EvenementsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <EvenementsView locale={locale} />
}
