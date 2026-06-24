import { createClient } from '@supabase/supabase-js'
import { readdir, readFile, stat } from 'fs/promises'
import { join, extname } from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://cqatekwthaiwvdabtfth.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? ''
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const BASE_DIR = './public/images'

function getMimeType(filename) {
  const ext = extname(filename).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'application/octet-stream'
}

async function uploadDir(dir, supabasePrefix) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await uploadDir(fullPath, `${supabasePrefix}/${entry.name}`)
    } else {
      const buffer = await readFile(fullPath)
      const key = `${supabasePrefix}/${entry.name}`
      const { error } = await supabase.storage
        .from('media')
        .upload(key, buffer, { contentType: getMimeType(entry.name), upsert: true })
      if (error) console.error(`FAIL ${key}: ${error.message}`)
      else console.log(`OK ${key}`)
    }
  }
}

console.log('Upload de public/images/ vers Supabase Storage...\n')
await uploadDir(BASE_DIR, '')
console.log('\nTerminé.')
