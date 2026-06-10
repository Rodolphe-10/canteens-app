const PENDING_ASSIGN_KEY = 'tc_pending_assign'

export function buildStaffAssignUrl(origin: string, locale: string, assignToken: string) {
  return `${origin}/${locale}/admin?assign=${assignToken}`
}

export function storePendingAssignToken(token: string) {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(PENDING_ASSIGN_KEY, token)
}

export function consumePendingAssignToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  const token = sessionStorage.getItem(PENDING_ASSIGN_KEY)
  if (token) sessionStorage.removeItem(PENDING_ASSIGN_KEY)
  return token
}

export function peekPendingAssignToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem(PENDING_ASSIGN_KEY)
}
