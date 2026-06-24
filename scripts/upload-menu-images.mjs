import { createClient } from '@supabase/supabase-js'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://cqatekwthaiwvdabtfth.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? ''
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const IMAGES_DIR = './livrable_canteens/images'

function sanitizeFilename(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[°§]/g, '')
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9._\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+(?=\.[^.]+$)/g, '')
    .toLowerCase()
}

const files = await readdir(IMAGES_DIR)
console.log(`\nUpload de ${files.length} images...\n`)

const mapping = {}
let ok = 0, fail = 0

for (const file of files) {
  const sanitized = sanitizeFilename(file)
  mapping[file] = sanitized
  const buffer = await readFile(join(IMAGES_DIR, file))
  const { error } = await supabase.storage
    .from('media')
    .upload(`menu/${sanitized}`, buffer, { contentType: 'image/webp', upsert: true })
  if (error) { console.error(`FAIL ${file} -> ${sanitized}: ${error.message}`); fail++ }
  else { console.log(`OK ${file} -> ${sanitized}`); ok++ }
}

console.log(`\n${ok} OK | ${fail} erreurs`)

import { writeFile } from 'fs/promises'
await writeFile('./scripts/filename-mapping.json', JSON.stringify(mapping, null, 2))
console.log('Mapping sauvegarde dans scripts/filename-mapping.json')
