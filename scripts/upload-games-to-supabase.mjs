import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://cqatekwthaiwvdabtfth.supabase.co'
// Utilise la service key pour uploader (bypass RLS Storage)
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_KEY) {
  console.error('❌ Lance avec : $env:SUPABASE_SERVICE_KEY="ta_clé"; node scripts/upload-games-to-supabase.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const files = [
  { local: 'billard.jpg',          remote: 'games/billard.jpg' },
  { local: 'vr-power.jpg',         remote: 'games/vr-power.jpg' },
  { local: 'vr-infinite-battle.jpg', remote: 'games/vr-infinite-battle.jpg' },
  { local: 'boxer-darts.jpg',      remote: 'games/boxer-darts.jpg' },
  { local: 'energy-flipper.jpg',   remote: 'games/energy-flipper.jpg' },
  { local: 'big-buck-hunters.jpg', remote: 'games/big-buck-hunters.jpg' },
  { local: 'babyfoot.jpg',         remote: 'games/babyfoot.jpg' },
  { local: 'simulateur.jpg',       remote: 'games/simulateur.jpg' },
]

console.log('🚀 Upload des photos de jeux vers Supabase Storage...\n')

for (const { local, remote } of files) {
  const filePath = join(__dirname, '..', 'public', 'games', local)
  try {
    const buffer = readFileSync(filePath)
    const { error } = await supabase.storage
      .from('media')
      .upload(remote, buffer, { upsert: true, contentType: 'image/jpeg' })

    if (error) {
      console.error(`  ❌ ${local} — ${error.message}`)
    } else {
      const { data } = supabase.storage.from('media').getPublicUrl(remote)
      console.log(`  ✅ ${local}`)
      console.log(`     ${data.publicUrl}`)
    }
  } catch (e) {
    console.error(`  ❌ ${local} — fichier introuvable`)
  }
}

console.log('\n✅ Upload terminé. Lance maintenant le SQL dans Supabase.')
