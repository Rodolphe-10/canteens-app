/** Tri alphabétique insensible à la casse (accents pris en charge). */
export function sortAlpha(
  a: string,
  b: string,
  locale: string = 'fr',
): number {
  return a.localeCompare(b, locale, { sensitivity: 'base' })
}

export function sortAlphaStrings(
  items: readonly string[],
  locale: string = 'fr',
): string[] {
  return [...items].sort((a, b) => sortAlpha(a, b, locale))
}

export function sortAlphaBy<T>(
  items: readonly T[],
  getLabel: (item: T) => string,
  locale: string = 'fr',
): T[] {
  return [...items].sort((a, b) => sortAlpha(getLabel(a), getLabel(b), locale))
}

/** Garde `lastItem` en dernière position, trie le reste alphabétiquement. */
export function sortAlphaWithLast(
  items: readonly string[],
  lastItem: string,
  locale: string = 'fr',
): string[] {
  const rest = items.filter((i) => i !== lastItem)
  return [...sortAlphaStrings(rest, locale), lastItem]
}
