// Regenerate glc_front_right_lot + studio.
// First attempt copied front-left almost verbatim because nano-banana-2/edit
// stuck too close to the reference. Use rear-right as reference instead and
// flip to a front view, OR use text-only first to guarantee a different pose.

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
  const buf = Buffer.from(await r.arrayBuffer())
  writeFileSync(join(OUT_DIR, filename), buf)
}

async function generate({ key, model, body }) {
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

const NB2 = 'fal-ai/nano-banana-2'
const NB2_EDIT = 'fal-ai/nano-banana-2/edit'

// Use rear-right as reference (it's already clearly the right side of the
// vehicle from a different angle) and pull it forward to a front-right view.
const rearRight = manifest['glc_rear_right_lot']
const backdrop = manifest['wackenhut_backdrop']
if (!rearRight) throw new Error('rear-right not in manifest')

const newLot = await generate({
  key: 'glc_front_right_lot',
  model: NB2_EDIT,
  body: {
    prompt:
      'The reference image shows a 2025 Mercedes-Benz GLC 300 4MATIC AMG Line in Spektralblau metallic with Night Package and 20-inch black AMG wheels, parked at a Mercedes-Benz dealership car lot. Render the EXACT same vehicle (same color, same wheels, same trim, same dealership setting and lighting) but rotated so the camera now sees the vehicle from a FRONT-RIGHT three-quarter view (passenger side). Show the front bumper, headlights, Mercedes star grille, AMG body skirts, and the right-side wing mirror. The vehicle\'s nose should point toward the camera-right diagonal. Eye-level camera, full vehicle in frame, photorealistic, natural daylight, 4:3.',
    image_urls: [rearRight.url],
    num_images: 1,
    aspect_ratio: '4:3',
  },
})

await generate({
  key: 'glc_front_right_studio',
  model: NB2_EDIT,
  body: {
    prompt:
      'Place the EXACT vehicle from the FIRST reference image, in the EXACT same pose, angle and orientation, into the studio environment from the SECOND reference image. Keep the second image\'s seamless grey backdrop and the "WACKENHUT" wall lettering exactly as shown — do not change the backdrop, lighting setup, or floor reflection. Cleanly remove the original outdoor background. Soft, even studio lighting matching the backdrop. Photorealistic professional automotive studio photograph, 4:3, full vehicle in frame.',
    image_urls: [newLot.url, backdrop.url],
    num_images: 1,
    aspect_ratio: '4:3',
  },
})

console.log('Done.')
