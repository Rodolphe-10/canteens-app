/**
 * Dimensions standard des visuels menu (analyse de 93 webp Supabase) :
 * - 100 % carrées (ratio 1:1)
 * - 46 × 800×800, le reste entre ~209 et 800 px de côté
 * - moyenne ~659×659
 */
export const MENU_CARD_IMAGE_WIDTH = 800
export const MENU_CARD_IMAGE_HEIGHT = 800

/** Cadre fixe carré — sur un div (pas un button) pour que aspect-ratio calcule la hauteur avec fill */
export const menuCardImageFrameClass =
  'relative aspect-square w-full shrink-0 overflow-hidden bg-black/20'
