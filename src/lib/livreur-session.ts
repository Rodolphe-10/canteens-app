export const TC_LIVREUR_KEY = 'tc_livreur'

export type LivreurSession = {
  id: string
  nom: string
  telephone: string
  photo_url?: string
  moto_immatriculation: string
  moto_modele?: string
}

export function getLivreurSession(): LivreurSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(TC_LIVREUR_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LivreurSession
  } catch {
    return null
  }
}

export function setLivreurSession(session: LivreurSession): void {
  localStorage.setItem(TC_LIVREUR_KEY, JSON.stringify(session))
}

export function clearLivreurSession(): void {
  localStorage.removeItem(TC_LIVREUR_KEY)
}
