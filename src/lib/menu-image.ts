/**
 * Dimensions standard des visuels menu (analyse de 93 webp Supabase) :
 * - 100 % carrées (ratio 1:1)
 * - 46 × 800×800, le reste entre ~209 et 800 px de côté
 * - moyenne ~659×659
 */
export const MENU_CARD_IMAGE_WIDTH = 800
export const MENU_CARD_IMAGE_HEIGHT = 800

/** Cadre fixe : carré pleine largeur de carte, même hauteur partout dans la grille */
export const menuCardImageFrameClass =
  'relative aspect-square w-full overflow-hidden bg-black/20'
