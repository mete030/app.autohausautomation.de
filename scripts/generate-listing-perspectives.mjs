/**
 * Generate the 4 missing perspectives (front-right, rear-left, rear-right,
 * Kofferraum) for the CLA, EQE and E-Class listings, so each detail page
 * shows 5 distinct angles of the SAME vehicle.
 *
 * Each vehicle's existing front-left image is used as the reference.
 * For the rotation that historically failed (front-right, which Nano Banana
 * tends to copy from front-left), we use rear-right as the reference instead.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'inserate-demo')
const MANIFEST = join(OUT_DIR, 'manifest.json')

const env = readFileSync(join(ROOT, '.env.local'), 'utf8')
const FAL_KEY = env.match(/^FAL_AI_KEY=(.+)$/m)?.[1]?.trim()

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))

async function falSync(model, body) {
  const r = await fetch(`https://fal.run/${model}`, {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`${model} ${r.status}: ${text.slice(0, 400)}`)
  return JSON.parse(text)
}

async function downloadTo(url, filename) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`download ${url}: ${r.status}`)
  writeFileSync(join(OUT_DIR, filename), Buffer.from(await r.arrayBuffer()))
}

async function generate({ key, model, body }) {
  if (manifest[key]?.file && existsSync(join(OUT_DIR, manifest[key].file))) {
    console.log(`✓ cached ${key}`)
    return manifest[key]
  }
  console.log(`→ ${key} via ${model}…`)
  const t0 = Date.now()
  const result = await falSync(model, body)
  const url = result.images?.[0]?.url
  if (!url) throw new Error('no url in result')
  const file = `${key}.png`
  await downloadTo(url, file)
  manifest[key] = { file, url, model, ts: new Date().toISOString() }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))
  console.log(`✓ ${key} (${((Date.now() - t0) / 1000).toFixed(1)}s)`)
  return manifest[key]
}

const NB2_EDIT = 'fal-ai/nano-banana-2/edit'

const vehicles = [
  {
    code: 'cla',
    baseKey: 'thumb_l1_cla_250e', // front-left, used for rear views
    description:
      '2025 Mercedes-Benz CLA 250 e Coupé in Kosmosschwarz metallic with AMG Line and Night-Paket (gloss black trim, black AMG wheels). Compact 4-door coupé silhouette with sloping roofline.',
    cargoDescription:
      'reveal the empty clean trunk / Kofferraum of the CLA Coupé sedan with neutral grey carpet and the trunk lid lifted',
  },
  {
    code: 'eqe',
    baseKey: 'thumb_l2_eqe_350',
    description:
      '2025 Mercedes-Benz EQE 350+ electric saloon in Hightech-Silber metallic. Aerodynamic 4-door electric saloon, smooth front fascia without grille (closed nose typical of EQE), full-width LED taillights at the rear.',
    cargoDescription:
      'show the EQE saloon from the rear with the trunk lid lifted, revealing the empty clean trunk / Kofferraum with grey carpet',
  },
  {
    code: 'eclass',
    baseKey: 'thumb_l4_e220d_estate',
    description:
      '2024 Mercedes-Benz E 220 d T-Modell estate / station wagon in Cavansitblau metallic with Avantgarde line and chrome trim. Long-roofed estate / wagon body style with extended cargo area at the rear.',
    cargoDescription:
      'show the E-Class T-Modell estate from the rear with the TAILGATE FULLY OPEN (large rear hatch), revealing the long flat empty cargo bay / Kofferraum with neutral carpet typical of an estate wagon',
  },
]

async function generateForVehicle(v) {
  const base = manifest[v.baseKey]
  if (!base) throw new Error(`base ${v.baseKey} not in manifest`)

  const sharedSetting =
    'parked on the asphalt of a Mercedes-Benz dealership car lot, glass showroom blurred in the background, soft natural daylight, headlights off, eye-level camera, full vehicle in frame, photorealistic dealership photograph, 4:3.'

  // Front-right — keep the historical fix: use a NON-front-left reference if
  // we already have a rear view, otherwise mirror the prompt strongly.
  const frontRight = await generate({
    key: `${v.code}_front_right_lot`,
    model: NB2_EDIT,
    body: {
      prompt:
        `The reference image shows a ${v.description}. Render the EXACT same vehicle (same color, same wheels, same trim, same dealership setting and lighting) but rotated so the camera now sees the vehicle from a FRONT-RIGHT three-quarter view (passenger side). Show the front bumper, headlights, Mercedes star, and the right-side wing mirror. Vehicle's nose pointing toward the camera-right diagonal. ${sharedSetting}`,
      image_urls: [base.url],
      num_images: 1,
      aspect_ratio: '4:3',
    },
  })

  const rearLeft = await generate({
    key: `${v.code}_rear_left_lot`,
    model: NB2_EDIT,
    body: {
      prompt:
        `The reference image shows a ${v.description}. Render the EXACT same vehicle (same color, same wheels, same trim, same dealership setting and lighting) from a REAR-LEFT three-quarter view (driver side, viewed from behind-left). Show the taillights, rear emblem and exhaust/diffuser. ${sharedSetting}`,
      image_urls: [base.url],
      num_images: 1,
      aspect_ratio: '4:3',
    },
  })

  const rearRight = await generate({
    key: `${v.code}_rear_right_lot`,
    model: NB2_EDIT,
    body: {
      prompt:
        `The reference image shows a ${v.description}. Render the EXACT same vehicle (same color, same wheels, same trim, same dealership setting and lighting) from a REAR-RIGHT three-quarter view (passenger side, viewed from behind-right). Show the taillights, rear emblem and exhaust/diffuser. ${sharedSetting}`,
      image_urls: [base.url],
      num_images: 1,
      aspect_ratio: '4:3',
    },
  })

  const kofferraum = await generate({
    key: `${v.code}_kofferraum_lot`,
    model: NB2_EDIT,
    body: {
      prompt:
        `The reference image shows a ${v.description}. Show the EXACT same vehicle from directly behind: ${v.cargoDescription}. Camera centered, slightly low, full open trunk/tailgate visible. Same dealership car lot, same lighting and backdrop as reference. Photorealistic, 4:3.`,
      image_urls: [base.url],
      num_images: 1,
      aspect_ratio: '4:3',
    },
  })

  return { frontRight, rearLeft, rearRight, kofferraum }
}

for (const v of vehicles) {
  console.log(`\n=== ${v.code.toUpperCase()} ===`)
  await generateForVehicle(v)
}

console.log('\nDone.')
