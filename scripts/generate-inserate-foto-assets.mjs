/**
 * Generate the additional fal.ai demo assets for the new Inserate "Fotos"
 * workflow (Daten/Fotos tabs + Autofox-style gallery + mobile capture wizard):
 *
 *   1. Two branded studio backdrops (Smart, Mercedes) derived from the existing
 *      wackenhut_backdrop, for the mobile "Hintergrund wählen" step.
 *   2. Extra GLC exterior angles (Seite links/rechts, Front, Heck) as lot+studio.
 *   3. GLC AMG-Line interior/detail shots (Cockpit, Lenkrad, Sitze vorne,
 *      Rückbank, Mittelkonsole, Einstieg) — so the gallery has ~14 beauty tiles.
 *
 * Output: public/inserate-demo/*.png (+ manifest.json). Resilient: a failure on
 * one asset is logged and skipped — the UI falls back to existing images.
 *
 * Run:  node scripts/generate-inserate-foto-assets.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'inserate-demo')
const MANIFEST = join(OUT_DIR, 'manifest.json')

const env = readFileSync(join(ROOT, '.env.local'), 'utf8')
const FAL_KEY = env.match(/^FAL_AI_KEY=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '')
if (!FAL_KEY) { console.error('FAL_AI_KEY missing'); process.exit(1) }

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}

const NB2 = 'fal-ai/nano-banana-2'
const NB2_EDIT = 'fal-ai/nano-banana-2/edit'

async function falSync(model, body) {
  const r = await fetch(`https://fal.run/${model}`, {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`${model} ${r.status}: ${text.slice(0, 300)}`)
  return JSON.parse(text)
}

function pickImageUrl(result) {
  if (result.images?.[0]?.url) return result.images[0].url
  if (result.image?.url) return result.image.url
  if (result.data?.images?.[0]?.url) return result.data.images[0].url
  throw new Error('could not extract image url')
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
  const url = pickImageUrl(result)
  const file = `${key}.png`
  await downloadTo(url, file)
  manifest[key] = { file, url, model, ts: new Date().toISOString() }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))
  console.log(`✓ ${key} (${((Date.now() - t0) / 1000).toFixed(1)}s)`)
  return manifest[key]
}

// Wrap so one failure doesn't abort the whole run.
async function safe(task) {
  try { return await generate(task) } catch (e) { console.error(`✗ ${task.key}: ${e.message}`); return null }
}

const baseUrl = manifest['glc_front_left_lot']?.url
const backdropUrl = manifest['wackenhut_backdrop']?.url
if (!baseUrl) { console.error('base glc_front_left_lot missing from manifest'); process.exit(1) }

const GLC = '2025 Mercedes-Benz GLC 300 4MATIC AMG Line SUV in Spektralblau metallic with Night Package (gloss black trim, black AMG 20-inch wheels, black grille)'
const LOT = 'parked on the asphalt of a real Mercedes-Benz dealership lot, glass showroom blurred in the background, soft natural daylight, headlights off, eye-level camera, full vehicle in frame, photorealistic dealership photograph, not a render, 4:3.'

async function main() {
  // ── 1) Branded backdrops (edit the existing studio backdrop) ───────────────
  if (backdropUrl) {
    await safe({
      key: 'backdrop_smart',
      model: NB2_EDIT,
      body: {
        prompt:
          'Keep this exact seamless grey automotive studio backdrop with its glossy reflective floor and lighting. On the back wall, replace/add the brand mark: a large modern "smart" logo (the smart automobile brand wordmark in lowercase with its arrow/swirl emblem) centered and subtly integrated in dark anthracite, plus a small "WACKENHUT" dealer logo lettering beneath it. No car, no people, no props. Premium showroom feel, 4:3.',
        image_urls: [backdropUrl], num_images: 1, aspect_ratio: '4:3',
      },
    })
    await safe({
      key: 'backdrop_mercedes',
      model: NB2_EDIT,
      body: {
        prompt:
          'Keep this exact seamless grey automotive studio backdrop with its glossy reflective floor and lighting. On the back wall, add the Mercedes-Benz three-pointed star emblem (clean ring-and-star logo) centered and subtly integrated in dark anthracite, plus a small "WACKENHUT" dealer logo lettering beneath it. No car, no people, no props. Premium showroom feel, 4:3.',
        image_urls: [backdropUrl], num_images: 1, aspect_ratio: '4:3',
      },
    })
  }

  // ── 2) Extra exterior angles (lot), edited from the base front-left ─────────
  const exterior = [
    { key: 'glc_seite_links_lot', view: 'a pure SIDE PROFILE from the LEFT (driver side), the full side of the SUV parallel to the camera, both left wheels visible, doors and side sill in view' },
    { key: 'glc_seite_rechts_lot', view: 'a pure SIDE PROFILE from the RIGHT (passenger side), the full side of the SUV parallel to the camera, both right wheels visible' },
    { key: 'glc_front_lot', view: 'a straight FRONT view (head-on), grille, both headlights and the Mercedes star centered, bumper symmetric' },
    { key: 'glc_heck_lot', view: 'a straight REAR view (head-on from behind), both taillights, GLC badge and AMG diffuser centered, tailgate closed' },
  ]
  for (const e of exterior) {
    await safe({
      key: e.key,
      model: NB2_EDIT,
      body: {
        prompt: `The reference shows a ${GLC}. Render the EXACT same vehicle (identical color, wheels, trim, lighting) seen as ${e.view}. Same dealership setting, ${LOT}`,
        image_urls: [baseUrl], num_images: 1, aspect_ratio: '4:3',
      },
    })
  }

  // ── 3) Studio (freigestellt) versions for the new exterior angles ──────────
  if (backdropUrl) {
    for (const e of exterior) {
      const angle = manifest[e.key]?.url
      if (!angle) continue
      await safe({
        key: e.key.replace('_lot', '_studio'),
        model: NB2_EDIT,
        body: {
          prompt:
            'Place the EXACT vehicle from the FIRST reference image, in the EXACT same pose, angle and orientation, into the studio environment from the SECOND reference image. Keep the seamless grey backdrop, wall lettering, lighting and floor reflection of the second image exactly. Cleanly remove the original outdoor background. Photorealistic professional automotive studio photograph, 4:3, full vehicle in frame.',
          image_urls: [angle, backdropUrl], num_images: 1, aspect_ratio: '4:3',
        },
      })
    }
  }

  // ── 4) Interior / detail shots (text-to-image; interior can't be derived) ──
  const INT = 'Interior of a 2025 Mercedes-Benz GLC AMG Line, black ARTICO/MICROCUT leather with red contrast stitching, AMG flat-bottom multifunction steering wheel, MBUX twin digital displays, ambient lighting, immaculate near-new condition. Photorealistic dealership detail photo, soft even light, 4:3.'
  const interior = [
    { key: 'glc_cockpit_lot', shot: `${INT} Wide dashboard/cockpit view from the rear seat looking forward, showing the full dashboard, central MBUX touchscreen and digital instrument cluster.` },
    { key: 'glc_lenkrad_lot', shot: `${INT} Close-up of the AMG steering wheel and the digital instrument cluster behind it.` },
    { key: 'glc_sitze_vorne_lot', shot: `${INT} The two front seats viewed from the open driver door, showing seat bolsters, headrests and red stitching.` },
    { key: 'glc_ruckbank_lot', shot: `${INT} The rear bench seats viewed through the open rear door, clean and unused.` },
    { key: 'glc_mittelkonsole_lot', shot: `${INT} Top-down view of the center console: gear/drive controls, cupholders, MBUX touchpad and start button.` },
    { key: 'glc_einstieg_fahrer_lot', shot: `${INT} Driver entry view through the wide-open driver door, showing the sill, seat and door panel with AMG badging.` },
  ]
  for (const i of interior) {
    await safe({ key: i.key, model: NB2, body: { prompt: i.shot, num_images: 1, aspect_ratio: '4:3' } })
  }

  console.log('\nDone. Generated/skipped assets recorded in manifest.json')
}

main().catch(e => { console.error(e); process.exit(1) })
