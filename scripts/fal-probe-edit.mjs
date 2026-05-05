import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const FAL_KEY = env.match(/^FAL_AI_KEY=(.+)$/m)?.[1]?.trim()

const candidates = [
  'fal-ai/nano-banana-2/edit',
  'fal-ai/nano-banana/edit',
  'fal-ai/gpt-image-2/edit-image',
  'fal-ai/gpt-image-2/edit',
  'fal-ai/gemini-3-pro-image-preview/edit',
]

for (const model of candidates) {
  const res = await fetch(`https://queue.fal.run/${model}`, {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'test',
      image_urls: ['https://images.unsplash.com/photo-1519681393784-d120267933ba?w=512'],
      num_images: 1,
    }),
  })
  const text = await res.text()
  console.log(model, '→', res.status, text.slice(0, 240))
}
