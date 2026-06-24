const base = 'https://canteens-app.vercel.app'

const pageRes = await fetch(`${base}/fr/restauration`)
const html = await pageRes.text()

console.log('Page status:', pageRes.status)
console.log('Carpaccio (ancien menu):', html.includes('Carpaccio'))
console.log('Margarita (catalogue Ola):', html.includes('Margarita'))
console.log('Nems Croustillants (ancien):', html.includes('Nems'))

const chunkPaths = [...new Set(html.match(/\/_next\/static\/chunks\/[^"']+\.js/g) ?? [])]

let grid2 = false
let grid1gap4 = false
let pb75 = false
let pb100 = false

for (const path of chunkPaths) {
  const js = await (await fetch(`${base}${path}`)).text()
  if (js.includes('grid-cols-2')) grid2 = true
  if (js.includes('grid-cols-1 gap-4')) grid1gap4 = true
  if (js.includes('pb-[75%]')) pb75 = true
  if (js.includes('pb-[100%]')) pb100 = true
}

console.log('\nDans les bundles JS:')
console.log('  grid-cols-2 gap-3:', grid2)
console.log('  ancienne grille grid-cols-1 gap-4:', grid1gap4)
console.log('  cadre pb-[75%] (4:3):', pb75)
console.log('  ancien cadre pb-[100%]:', pb100)

const imgRes = await fetch(
  `${base}/_next/image?url=${encodeURIComponent('https://cqatekwthaiwvdabtfth.supabase.co/storage/v1/object/public/media/menu/margarita.webp')}&w=640&q=75`,
)
console.log('\nImage optimizer margarita:', imgRes.status, imgRes.headers.get('content-type'))

let margaritaInBundle = false
let oldItemsMerge = false
for (const path of chunkPaths) {
  const js = await (await fetch(`${base}${path}`)).text()
  if (js.includes('Margarita') || js.includes('margarita.webp')) margaritaInBundle = true
  if (js.includes('oldItems')) oldItemsMerge = true
}
console.log('\nCatalogue Ola dans bundles:', margaritaInBundle)
console.log('Ancienne fusion oldItems:', oldItemsMerge)
