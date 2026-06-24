/**
 * Upload des flyers d'événements vers Supabase Storage
 * Lancer : node scripts/upload-events-flyers.mjs
 */

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://cqatekwthaiwvdabtfth.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'REMPLACER_PAR_SERVICE_ROLE_KEY'

// Dossier source des flyers — ADAPTER CE CHEMIN SI BESOIN
const FLYERS_DIR = 'C:\\Users\\kevin\\Desktop\\New flyers'

// Mapping : fichier source → nom dans Supabase
const FLYERS = [
  { src: 'photo_1_2026-06-03_17-38-15.jpg',  dest: 'showcase_tenor_seppo.jpg' },
  { src: 'photo_2_2026-06-03_17-38-15.jpg',  dest: 'showcase_tenor_boissons.jpg' },
  { src: 'photo_3_2026-06-03_17-38-15.jpg',  dest: 'ramadan_careme.jpg' },
  { src: 'photo_4_2026-06-03_17-38-15.jpg',  dest: 'showcase_lady_ponce.jpg' },
  { src: 'photo_5_2026-06-03_17-38-15.jpg',  dest: 'showcase_lady_ponce_boissons.jpg' },
  { src: 'photo_6_2026-06-03_17-38-15.jpg',  dest: 'sunday_brunch_v1.jpg' },
  { src: 'photo_7_2026-06-03_17-38-15.jpg',  dest: 'ramadan_brunch.jpg' },
  { src: 'photo_8_2026-06-03_17-38-15.jpg',  dest: 'sunday_brunch_v2.jpg' },
  { src: 'photo_9_2026-06-03_17-38-15.jpg',  dest: 'sunday_brunch_v3.jpg' },
  { src: 'photo_10_2026-06-03_17-38-15.jpg', dest: 'sunday_brunch_v4.jpg' },
  { src: 'photo_11_2026-06-03_17-38-15.jpg', dest: 'brunch_1er_mai.jpg' },
  { src: 'photo_12_2026-06-03_17-38-15.jpg', dest: 'sunday_brunch_v5.jpg' },
  { src: 'photo_13_2026-06-03_17-38-15.jpg', dest: 'match_gala_2mai.jpg' },
  { src: 'photo_14_2026-06-03_17-38-16.jpg', dest: 'birthday_jaguar.jpg' },
  { src: 'photo_15_2026-06-03_17-38-16.jpg', dest: 'showcase_coco_argentee.jpg' },
  { src: 'photo_16_2026-06-03_17-38-16.jpg', dest: 'showcase_coco_boissons.jpg' },
  { src: 'photo_17_2026-06-03_17-38-16.jpg', dest: 'brunch_dimanche_recurrent.jpg' },
  { src: 'photo_18_2026-06-03_17-38-16.jpg', dest: 'celebration_20mai_soiree.jpg' },
  { src: 'photo_19_2026-06-03_17-38-16.jpg', dest: 'celebration_20mai_buffet.jpg' },
  { src: 'photo_20_2026-06-03_17-38-16.jpg', dest: 'sunday_brunch_24mai.jpg' },
  { src: 'photo_21_2026-06-03_17-38-16.jpg', dest: 'tabaski.jpg' },
  { src: 'photo_22_2026-06-03_17-38-16.jpg', dest: 'anniversary_turns2_v1.jpg' },
  { src: 'photo_23_2026-06-03_17-38-16.jpg', dest: 'anniversary_turns2_v2.jpg' },
  { src: 'photo_24_2026-06-03_17-38-16.jpg', dest: 'anniversary_turns2_boissons.jpg' },
]

function uploadToSupabase(filename, buffer, contentType) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/storage/v1/object/media/events/${filename}`)
    const req = https.request({
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': contentType,
        'Content-Length': buffer.length,
        'x-upsert': 'true',
      }
    }, res => {
      let body = ''
      res.on('data', c => body += c)
      res.on('end', () => resolve({ status: res.statusCode, body }))
    })
    req.on('error', reject)
    req.write(buffer)
    req.end()
  })
}

console.log(`\n🚀 Upload de ${FLYERS.length} flyers vers Supabase Storage (media/events/)...\n`)

let ok = 0, fail = 0
for (const f of FLYERS) {
  const srcPath = path.join(FLYERS_DIR, f.src)
  process.stdout.write(`  ⬆  ${f.dest.padEnd(45)} `)
  try {
    const buffer = fs.readFileSync(srcPath)
    const res = await uploadToSupabase(f.dest, buffer, 'image/jpeg')
    if (res.status >= 200 && res.status < 300) {
      console.log(`✅ (${(buffer.length / 1024).toFixed(0)} KB)`)
      ok++
    } else {
      console.log(`❌ HTTP ${res.status} — ${res.body.slice(0, 80)}`)
      fail++
    }
  } catch (e) {
    console.log(`❌ ${e.message}`)
    fail++
  }
}

console.log(`\n✅ ${ok} uploadés | ❌ ${fail} échoués\n`)

// Afficher les URLs générées
const BASE = `${SUPABASE_URL}/storage/v1/object/public/media/events/`
console.log('─── URLs Supabase ───────────────────────────────────────')
FLYERS.forEach(f => console.log(`${f.dest}: ${BASE}${f.dest}`))
