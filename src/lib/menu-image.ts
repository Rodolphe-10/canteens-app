/**
 * Visuels menu (93 webp Supabase) : 100 % carrés, majorité 800×800.
 */
export const MENU_CARD_IMAGE_WIDTH = 800
export const MENU_CARD_IMAGE_HEIGHT = 800

/** Cadre carré fixe — pb-[100%] garantit la hauteur (aspect-ratio seul échoue en flex) */
export const menuCardImageFrameClass =
  'relative w-full shrink-0 overflow-hidden bg-black/20'

export const menuCardImageSquareClass = 'relative h-0 w-full pb-[100%]'

export const menuCardImageInnerClass = 'absolute inset-0'
