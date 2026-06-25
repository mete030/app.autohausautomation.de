/**
 * Generate Einkauf demo vehicle images via fal.ai (fal-ai/gpt-image-2,
 * "ChatGPT Images 2"). Output: public/einkauf-demo/*.png + manifest.json
 *
 * Bilder passend zu den Einkauf-Dummy-Daten (lib/mock-data-einkauf*.ts,
 * lib/mock-data-paket.ts): 1 Transporter + 5 GLC-Varianten. Unterschiedliche
 * Farben, damit die Paket-Karten visuell unterscheidbar sind.
 *
 * Manifest cached: bereits erzeugte Keys werden beim erneuten Lauf übersprungen.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'einkauf-demo')
const MANIFEST = join(OUT_DIR, 'manifest.json')

const env = readFileSync(join(ROOT, '.env.local'), 'utf8')
const FAL_KEY = env.match(/^FAL_AI_KEY=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '')
if (!FAL_KEY) { console.error('FAL_AI_KEY missing'); process.exit(1) }

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}

const MODEL = 'fal-ai/gpt-image-2'

async function falSync(model, body) {
  const r = await fetch(`https://fal.run/${model}`, {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`${model} ${r.status}: ${text.slice(0, 600)}`)
  try { return JSON.parse(text) } catch { throw new Error(`bad json from ${model}: ${text.slice(0, 200)}`) }
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
  writeFileSync(join(OUT_DIR, filename), Buffer.from(await r.arrayBuffer()))
}

async function generate(key, prompt) {
  if (manifest[key]?.file && existsSync(join(OUT_DIR, manifest[key].file))) {
    console.log(`✓ cached ${key}`)
    return
  }
  console.log(`→ ${key} …`)
  const t0 = Date.now()
  // fal gpt-image-2: prompt + image_size (OpenAI-Größen) + num_images.
  const result = await falSync(MODEL, { prompt, image_size: 'landscape_4_3', num_images: 1 })
  const url = pickImageUrl(result)
  const file = `${key}.png`
  await downloadTo(url, file)
  manifest[key] = { file, url, model: MODEL, ts: new Date().toISOString() }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))
  console.log(`✓ ${key} (${((Date.now() - t0) / 1000).toFixed(1)}s) → ${file}`)
}

const LOT =
  'Photorealistic dealership photograph, parked on the asphalt of a real Mercedes-Benz dealership lot, glass showroom and a few parked cars softly out of focus in the background, sharp overcast daylight, gentle reflections on the paint, three-quarter FRONT-LEFT view, eye-level 50mm-lens look, full vehicle in frame, photorealism (not a render, not studio).'

const VEHICLES = [
  {
    key: 'transporter_sprinter_kuehlkoffer',
    prompt:
      'A 2021 Mercedes-Benz Sprinter 317 CDI panel van with a white refrigerated box body (Kühlkoffer, FRC), in Arktikweiß (arctic white). Tall boxy refrigerated cargo van with a cooling unit on the front roof of the box, commercial vehicle, twin rear doors. ' + LOT,
  },
  {
    key: 'glc_300_spektralblau',
    prompt:
      'A 2023 Mercedes-Benz GLC 300 4MATIC AMG Line SUV (X254 generation) in Spektralblau metallic with the Night Package: gloss-black grille and trim, black AMG 20-inch wheels, panoramic roof. Premium, near-new condition. ' + LOT,
  },
  {
    key: 'glc_250_obsidianschwarz',
    prompt:
      'An older 2017 Mercedes-Benz GLC 250 4MATIC SUV (X253 previous generation) in Obsidianschwarz metallic (black), standard chrome trim, 18-inch wheels, used condition with high mileage, slightly weathered but clean. ' + LOT,
  },
  {
    key: 'glc_200_polarweiss',
    prompt:
      'A 2023 Mercedes-Benz GLC 200 4MATIC AMG Line SUV (X254 generation) in Polarweiß (solid white), AMG Line body styling, 19-inch wheels, LED headlights, near-new condition. ' + LOT,
  },
  {
    key: 'glc_220d_selenitgrau_2022',
    prompt:
      'A 2022 Mercedes-Benz GLC 220 d 4MATIC SUV (X254 generation) in Selenitgrau metallic (grey) with the Night Package (black trim), tow bar, 19-inch wheels, good used condition. ' + LOT,
  },
  {
    key: 'glc_220d_iridiumsilber_2019',
    prompt:
      'An older 2019 Mercedes-Benz GLC 220 d 4MATIC SUV (X253 previous generation) in Iridiumsilber metallic (silver), base trim with chrome accents, 17-inch wheels, higher-mileage used condition, clean but not premium. ' + LOT,
  },

  // ── Mehr Modell-Vielfalt: häufig an Endkunden verkaufte MB-Baureihen ──
  {
    key: 'mb_a_klasse',
    prompt:
      'A 2022 Mercedes-Benz A 200 (W177), a compact 5-door hatchback in Jupiterrot (red) with AMG Line styling, 18-inch wheels, LED headlights, sporty compact car. ' + LOT,
  },
  {
    key: 'mb_b_klasse',
    prompt:
      'A 2021 Mercedes-Benz B-Klasse B 180 compact MPV / sports tourer (W247) in Iridiumsilber metallic (silver), a tall practical compact van-like body, chrome trim, 17-inch wheels. ' + LOT,
  },
  {
    key: 'mb_c_klasse',
    prompt:
      'A 2021 Mercedes-Benz C 220 d (W206) executive sedan in Selenitgrau metallic (grey) with AMG Line, 18-inch wheels, sleek four-door saloon. ' + LOT,
  },
  {
    key: 'mb_e_klasse',
    prompt:
      'A 2020 Mercedes-Benz E 220 d (W213) executive sedan in Obsidianschwarz metallic (black) with Avantgarde trim, chrome accents, 18-inch wheels, large business saloon. ' + LOT,
  },
  {
    key: 'mb_cla',
    prompt:
      'A 2021 Mercedes-Benz CLA 200 four-door coupé (C118) in Denimblau metallic (blue) with AMG Line, frameless doors, 18-inch wheels, sporty low coupé silhouette. ' + LOT,
  },
  {
    key: 'mb_gla',
    prompt:
      'A 2022 Mercedes-Benz GLA 200 (H247) compact crossover SUV in Polarweiß (white) with Progressive Line, 18-inch wheels, raised compact SUV body. ' + LOT,
  },
  {
    key: 'mb_glb',
    prompt:
      'A 2021 Mercedes-Benz GLB 200 (X247) boxy compact 7-seat SUV in Bergkristallweiß (white) with chrome trim, roof rails, 18-inch wheels, upright squared-off SUV body. ' + LOT,
  },
  {
    key: 'mb_gle',
    prompt:
      'A 2020 Mercedes-Benz GLE 350 d 4MATIC (V167) large luxury SUV in Cavansitblau metallic (dark blue), AMG Line, 20-inch wheels, big premium SUV. ' + LOT,
  },
]

async function main() {
  const only = process.argv[2] // optional: nur einen key erzeugen (zum Schema-Probing)
  const list = only ? VEHICLES.filter((v) => v.key === only) : VEHICLES
  for (const v of list) await generate(v.key, v.prompt)
  console.log('\nFertig. Manifest:', MANIFEST)
}

main().catch((e) => { console.error('\n✗', e.message); process.exit(1) })
