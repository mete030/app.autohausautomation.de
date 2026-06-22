import { NextRequest, NextResponse } from 'next/server'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'
import { getKiReceptionCallById } from '@/lib/server/ki-reception-records'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Endung aus dem Content-Type ableiten (für einen sinnvollen Dateinamen). */
function extensionFor(contentType: string | null): string {
  if (!contentType) return 'mp3'
  if (contentType.includes('wav')) return 'wav'
  if (contentType.includes('ogg')) return 'ogg'
  if (contentType.includes('mp4') || contentType.includes('m4a')) return 'm4a'
  if (contentType.includes('webm')) return 'webm'
  return 'mp3'
}

/**
 * Proxy-Download der Anruf-Aufnahme.
 *
 * Die `recordingUrl` liegt extern (Famulor/Provider). Würde der Browser direkt
 * darauf zeigen, ließe sich `download` bei Cross-Origin nicht erzwingen. Daher
 * holen wir die Datei serverseitig und liefern sie same-origin mit
 * `Content-Disposition: attachment` zurück — garantierter Download.
 *
 * Sicherheit: Der Client übergibt NUR die Call-ID; die URL stammt
 * ausschließlich aus unserem Datensatz (kein frei wählbares Ziel → kein SSRF).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json({ error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE }, { status: 503 })
  }

  const { id } = await params
  const call = await getKiReceptionCallById(id)
  if (!call) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })
  if (!call.recordingUrl) {
    return NextResponse.json({ error: 'Keine Aufnahme vorhanden.' }, { status: 404 })
  }

  let upstream: Response
  try {
    upstream = await fetch(call.recordingUrl, { cache: 'no-store' })
  } catch {
    return NextResponse.json({ error: 'Aufnahme nicht erreichbar.' }, { status: 502 })
  }
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Aufnahme nicht erreichbar.' }, { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') ?? 'audio/mpeg'
  const ext = extensionFor(contentType)
  const safeName = (call.customerName || 'anruf').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '')
  const filename = `Aufnahme_${safeName || 'anruf'}.${ext}`

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
