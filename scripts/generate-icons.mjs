import sharp from 'sharp'

const SRC = 'public/logo-canteens.png'
// Fond sombre cohérent avec le thème et background_color des manifests
const BG = { r: 10, g: 10, b: 10, alpha: 1 }

async function makeIcon(size, out) {
  const pad = Math.round(size * 0.12)
  const inner = size - pad * 2

  const logo = await sharp(SRC)
    // Retire la marge transparente autour du logo pour qu'il remplisse mieux l'icône
    .trim()
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(out)

  console.log(`✓ ${out} (${size}x${size})`)
}

await makeIcon(192, 'public/icon-192.png')
await makeIcon(512, 'public/icon-512.png')
