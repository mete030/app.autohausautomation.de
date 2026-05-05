/**
 * Generate demo car images via fal.ai for the Wackenhut listings demo.
 *
 * Output: public/inserate-demo/*.jpg + manifest.json
 *
 * Strategy:
 *  - Use nano-banana-2 to make a base GLC photo, then nano-banana-2/edit
 *    with the base as reference to get 4 more angles of the SAME vehicle.
 *  - Generate one Wackenhut studio backdrop, then for each angle use
 *    /edit with [vehicle, backdrop] to produce the "freigestellt" variant.
 *  - Use nano-banana-2 for the 3 standalone listing thumbnails.
 *
 * Uses fal.ai sync endpoint (https://fal.run/{model}) — keeps the script flat.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'inserate-demo')
const MANIFEST = join(OUT_DIR, 'manifest.json')

const env = readFileSync(join(ROOT, '.env.local'), 'utf8')
const FAL_KEY = env.match(/^FAL_AI_KEY=(.+)$/m)?.[1]?.trim()
if (!FAL_KEY) { console.error('FAL_AI_KEY missing'); process.exit(1) }

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}

async function falSync(model, body) {
  const r = await fetch(`https://fal.run/${model}`, {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`${model} ${r.status}: ${text.slice(0, 400)}`)
  let json
  try { json = JSON.parse(text) } catch { throw new Error(`bad json from ${model}: ${text.slice(0, 200)}`) }
  return json
}

function pickImageUrl(result) {
  if (result.images?.[0]?.url) return result.images[0].url
  if (result.image?.url) return result.image.url
  if (result.data?.images?.[0]?.url) return result.data.images[0].url
  if (Array.isArray(result.images) && typeof result.images[0] === 'string') return result.images[0]
  console.error('Unexpected fal result:', JSON.stringify(result).slice(0, 800))
  throw new Error('could not extract image url')
}

async function downloadTo(url, filename) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`download ${url}: ${r.status}`)
  const buf = Buffer.from(await r.arrayBuffer())
  writeFileSync(join(OUT_DIR, filename), buf)
}

async function generate({ key, model, body, ext = 'png' }) {
  if (manifest[key]?.file && existsSync(join(OUT_DIR, manifest[key].file))) {
    console.log(`✓ cached ${key}`)
    return manifest[key]
  }
  console.log(`→ ${key} via ${model}…`)
  const t0 = Date.now()
  const result = await falSync(model, body)
  const url = pickImageUrl(result)
  const file = `${key}.${ext}`
  await downloadTo(url, file)
  manifest[key] = { file, url, model, ts: new Date().toISOString() }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))
  console.log(`✓ ${key} (${((Date.now() - t0) / 1000).toFixed(1)}s) → ${file}`)
  return manifest[key]
}

const NB2 = 'fal-ai/nano-banana-2'
const NB2_EDIT = 'fal-ai/nano-banana-2/edit'
const GPT2 = 'fal-ai/gpt-image-2'

async function main() {
  // 1) Base GLC, front-left, dealership car lot.
  const base = await generate({
    key: 'glc_front_left_lot',
    model: NB2,
    body: {
      prompt:
        'Photorealistic dealership photograph of a brand-new 2025 Mercedes-Benz GLC 300 4MATIC AMG Line SUV in Spektralblau metallic with the Night Package (gloss black trim, black AMG 20-inch wheels, black grille). Vehicle parked on the asphalt of a real Mercedes-Benz dealership lot, several other parked cars and a glass showroom out of focus in the background. Sharp daylight with soft cloud cover, gentle reflections on the paint, headlights off. Three-quarter view from the FRONT-LEFT, eye-level camera, 50mm lens look, full vehicle in frame, 4:3 aspect ratio. Photorealism, not a render, not studio.',
      num_images: 1,
      aspect_ratio: '4:3',
    },
  })

  // 2) Wackenhut studio backdrop (no car).
  const backdrop = await generate({
    key: 'wackenhut_backdrop',
    model: NB2,
    body: {
      prompt:
        'Empty professional automotive photo studio: seamless backdrop in cool neutral grey, gradient from warm white at the top to medium grey at the bottom. Polished glossy reflective dark grey floor that creates a soft mirror reflection. On the back wall, in a clean modern thin sans-serif font, the word "WACKENHUT" appears in dark anthracite letters, perfectly centered horizontally, integrated subtly. Soft, even, top-down studio lighting, no visible light sources, no people, no car, no props. Cinematic, premium, automotive showroom feel. 4:3.',
      num_images: 1,
      aspect_ratio: '4:3',
    },
  })

  // 3) Other 4 angles of the same GLC, using base as reference.
  const angles = [
    {
      key: 'glc_front_right_lot',
      prompt:
        'Take the EXACT same Mercedes-Benz GLC 300 4MATIC AMG Line in Spektralblau metallic from the reference image (same color, same wheels, same trim, same generation X254). Render it from a FRONT-RIGHT three-quarter view at the same dealership car lot. Keep the lighting, weather, asphalt and dealership backdrop visually consistent with the reference. Photorealistic, eye-level, 4:3, full vehicle in frame.',
    },
    {
      key: 'glc_rear_left_lot',
      prompt:
        'Take the EXACT same Mercedes-Benz GLC 300 4MATIC AMG Line in Spektralblau metallic from the reference image (same vehicle, identical wheels, identical trim). Render it from a REAR-LEFT three-quarter view at the same dealership car lot. Show rear lights, GLC badge, AMG diffuser. Keep lighting, weather and dealership backdrop visually consistent with the reference. Photorealistic, eye-level, 4:3.',
    },
    {
      key: 'glc_rear_right_lot',
      prompt:
        'Take the EXACT same Mercedes-Benz GLC 300 4MATIC AMG Line in Spektralblau metallic from the reference image (same vehicle, identical wheels, identical trim). Render it from a REAR-RIGHT three-quarter view at the same dealership car lot. Show rear lights, badge, exhaust diffuser. Keep lighting, weather and dealership backdrop visually consistent with the reference. Photorealistic, eye-level, 4:3.',
    },
    {
      key: 'glc_kofferraum_lot',
      prompt:
        'Take the EXACT same Mercedes-Benz GLC 300 4MATIC AMG Line in Spektralblau metallic from the reference image. Show it from directly BEHIND with the TAILGATE FULLY OPEN, revealing the empty clean cargo area / Kofferraum with neutral light grey leather trim and the loading sill. Camera centered, slightly low, full open tailgate visible. Same dealership car lot, same lighting and backdrop as reference. Photorealistic, 4:3.',
    },
  ]

  const angleKeys = ['glc_front_left_lot']
  for (const a of angles) {
    await generate({
      key: a.key,
      model: NB2_EDIT,
      body: {
        prompt: a.prompt,
        image_urls: [base.url],
        num_images: 1,
        aspect_ratio: '4:3',
      },
    })
    angleKeys.push(a.key)
  }

  // 4) Wackenhut studio variant for each angle, using
  //    [angle_image, backdrop] as references.
  const studioMap = {
    glc_front_left_lot: 'glc_front_left_studio',
    glc_front_right_lot: 'glc_front_right_studio',
    glc_rear_left_lot: 'glc_rear_left_studio',
    glc_rear_right_lot: 'glc_rear_right_studio',
    glc_kofferraum_lot: 'glc_kofferraum_studio',
  }
  for (const fromKey of angleKeys) {
    const toKey = studioMap[fromKey]
    await generate({
      key: toKey,
      model: NB2_EDIT,
      body: {
        prompt:
          'Place the EXACT vehicle from the FIRST reference image, in the EXACT same pose, angle and orientation, into the studio environment from the SECOND reference image. Keep the second image\'s seamless grey backdrop and the "WACKENHUT" wall lettering exactly as shown — do not change the backdrop, lighting setup, or floor reflection. Cleanly remove the original outdoor background. Soft, even studio lighting matching the backdrop. Photorealistic professional automotive studio photograph, 4:3, full vehicle in frame.',
        image_urls: [manifest[fromKey].url, backdrop.url],
        num_images: 1,
        aspect_ratio: '4:3',
      },
    })
  }

  // 5) Standalone listing thumbnails.
  const thumbs = [
    {
      key: 'thumb_l1_cla_250e',
      prompt:
        'Photorealistic dealership photograph of a 2025 Mercedes-Benz CLA 250 e Coupé in Kosmosschwarz metallic with AMG Line and Night-Paket (gloss black trim, black AMG wheels). Front-three-quarter view from the front-left, eye level, parked on the asphalt of a Mercedes-Benz dealership lot, glass showroom blurred in the background, soft natural daylight. 4:3, full vehicle in frame.',
    },
    {
      key: 'thumb_l2_eqe_350',
      prompt:
        'Photorealistic dealership photograph of a 2025 Mercedes-Benz EQE 350+ electric saloon in Hightech-Silber metallic. Front-three-quarter view from the front-left, eye level, parked at the entrance of a Mercedes-Benz dealership, soft cloudy daylight. 4:3, full vehicle in frame, headlights off.',
    },
    {
      key: 'thumb_l4_e220d_estate',
      prompt:
        'Photorealistic dealership photograph of a 2024 Mercedes-Benz E 220 d T-Modell (estate / station wagon) Avantgarde in Cavansitblau metallic with chrome trim. Side-front three-quarter view from the front-left, eye level, parked on a Mercedes-Benz dealership car lot, glass showroom blurred behind, soft daylight. 4:3, full estate vehicle in frame.',
    },
  ]
  for (const t of thumbs) {
    await generate({
      key: t.key,
      model: NB2,
      body: { prompt: t.prompt, num_images: 1, aspect_ratio: '4:3' },
    })
  }

  console.log('\nDone. Manifest at', MANIFEST)
}

main().catch(e => { console.error(e); process.exit(1) })
