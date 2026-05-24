'use client'

// Segment-level error boundary for the Callcenter module. Without this, any
// client-side exception (including environment-specific ones we can't easily
// reproduce — e.g. a browser blocking storage/APIs) crashes the whole view
// to a blank screen with no diagnostics. This contains the failure to the
// page content (sidebar/navigation survive), offers a recovery, and surfaces
// the real error message so it can be reported.

import { useEffect, useState } from 'react'
import { AlertTriangle, RotateCw, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CallcenterError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Surface in the browser console for anyone inspecting via F12.
    console.error('Callcenter view crashed:', error)
  }, [error])

  const details = [
    `Fehler: ${error.message || 'Unbekannter Fehler'}`,
    error.digest ? `Digest: ${error.digest}` : null,
    `Browser: ${typeof navigator !== 'undefined' ? navigator.userAgent : '—'}`,
    `URL: ${typeof window !== 'undefined' ? window.location.href : '—'}`,
  ]
    .filter(Boolean)
    .join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(details)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard may be blocked; the text is visible below regardless.
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Diese Ansicht konnte nicht geladen werden</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Beim Öffnen der Callcenter-Ansicht ist ein Fehler aufgetreten. Die übrige
            Anwendung funktioniert weiter — bitte versuche es erneut. Falls der Fehler
            bestehen bleibt, sende die folgenden Details an die IT.
          </p>

          <div className="rounded-md border bg-muted/40 p-3">
            <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-muted-foreground">
              {details}
            </pre>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={reset}>
              <RotateCw className="mr-1 h-4 w-4" />
              Erneut versuchen
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              {copied ? 'Kopiert' : 'Details kopieren'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
