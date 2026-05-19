export function cn(
  ...classes: (string | undefined | null | false)[]
): string {
  return classes.filter(Boolean).join(' ')
}

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} F`
}
