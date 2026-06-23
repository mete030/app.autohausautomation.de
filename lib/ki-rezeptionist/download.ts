/** Dateinamen-tauglicher Slug aus dem Kundennamen. */
export function slugifyName(name: string): string {
  return name.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '') || 'anruf'
}

/** Löst einen Client-seitigen Datei-Download aus (Blob → temporärer Link). */
export function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
