import GameRoomHero from '@/components/game-room/GameRoomHero'
import GamesGrid from '@/components/game-room/GamesGrid'
import PacksSection from '@/components/game-room/PacksSection'
import GalleryStrip from '@/components/game-room/GalleryStrip'

export default async function GameRoomPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="bg-tc-black">
      <GameRoomHero locale={locale} />
      <GamesGrid locale={locale} />
      <GalleryStrip />
      <PacksSection locale={locale} />
    </div>
  )
}
