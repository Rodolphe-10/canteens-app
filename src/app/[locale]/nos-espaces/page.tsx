import NosEspacesView from '@/components/nos-espaces/NosEspacesView'

export default async function NosEspacesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <NosEspacesView locale={locale} />
}
