import { sortAlphaWithLast } from '@/lib/sort'

const QUARTIERS_BASE = [
  'Ahala',
  'Bastos',
  'Biyem-Assi',
  'Briqueterie',
  'Centre-ville',
  'Cité Verte',
  'Djoungolo',
  'Ekounou',
  'Ekoudou',
  'Elig-Essono',
  'Essos',
  'Etoudi',
  'Jouvence',
  'Lac Municipal',
  'Melen',
  'Mendong',
  'Mimboman',
  'Mokolo',
  'Mvog-Ada',
  'Mvog-Betsi',
  'Mvog-Mbi',
  'Mvan',
  'Ngousso',
  'Nkolfoulou',
  'Nkol-Eton',
  'Nlongkak',
  'Nsam',
  'Obili',
  'Odza',
  'Omnisport',
  'Santa Barbara',
  'Tsinga',
] as const

/** Quartiers en ordre alphabétique, « Autre quartier » en dernier. */
export const deliveryQuartiers = sortAlphaWithLast(
  [...QUARTIERS_BASE],
  'Autre quartier',
)
