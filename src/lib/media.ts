export const SUPABASE_MEDIA_BASE =
  'https://cqatekwthaiwvdabtfth.supabase.co/storage/v1/object/public/media'

const m = (path: string) => `${SUPABASE_MEDIA_BASE}/${path}`

export const mediaUrls = {
  logos: {
    gameroom1: m('logo_gameroom1-removebg-preview.png'),
    gameroom2: m('logo_gameroom2-removebg-preview.png'),
    restaurant1: m('logo_restaurant1-removebg-preview.png'),
    restaurant2: m('logo_restaurant2-removebg-preview.png'),
  },
  lounge: {
    lounge1: m('lounge/lounge1.jpg'),
    lounge2: m('lounge/lounge2.jpg'),
    photoBar1: m('lounge/photo_bar1.jpg'),
    photoBar2: m('lounge/photo_bar2.jpg'),
    photoBar3: m('lounge/photo_bar3.jpg'),
  },
  restaurant: {
    restaurant: m('restaurant/restaurant.jpg'),
  },
  terrasse: {
    /** terrasse1 locale → fichier terrasse3 sur Supabase */
    terrasse1: m('terrasse/terrasse3.jpg'),
    terrasse2: m('terrasse/terrasse2.jpg'),
    terrasse3: m('terrasse/terrasse3.jpg'),
  },
  gameRoom: {
    gameroom1: m('game-room/gameroom1.jpg'),
    gameroom2: m('game-room/gameroom2.jpg'),
  },
  flyers: {
    brunch1: m('flyers/brunch1.jpg'),
    brunch2: m('flyers/brunch2.jpg'),
    brunch3: m('flyers/brunch3.jpg'),
    packAfterwork: m('flyers/pack_afterwork.jpg'),
    packDimanche: m('flyers/pack_diamnche.jpg'),
    flyerGameroom: m('flyers/flyer_gameroom.jpg'),
  },
} as const
