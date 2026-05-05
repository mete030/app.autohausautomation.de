// Probe fal.ai endpoints to see which image models respond.
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const FAL_KEY = env.match(/^FAL_AI_KEY=(.+)$/m)?.[1]?.trim()
if (!FAL_KEY) { console.error('FAL_AI_KEY missing'); process.exit(1) }

const candidates = [
  'fal-ai/nano-banana-2/text-to-image',
  'fal-ai/nano-banana-2',
  'fal-ai/gemini-3-pro-image-preview',
  'fal-ai/gemini-3-image-preview',
  'fal-ai/nano-banana',
  'fal-ai/gpt-image-2/text-to-image',
  'fal-ai/gpt-image-1/text-to-image',
]

for (const model of candidates) {
  try {
    const res = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: 'red apple, simple test', num_images: 1 }),
    })
    const text = await res.text()
    console.log(model, '→', res.status, text.slice(0, 200))
  } catch (e) {
    console.log(model, '→ ERR', e.message)
  }
}
