'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { CallbackAttachmentUploader } from '@/components/callcenter/callback-attachment-uploader'
import { MIN_CALLBACK_COMPLETION_NOTE_LENGTH } from '@/lib/email/callback-email-config'
import { cn } from '@/lib/utils'
import type { CallbackAttachment, CallbackCompletionLinkViewModel } from '@/lib/types'

interface CallbackCompletionPageProps {
  token: string
  viewModel: CallbackCompletionLinkViewModel | null
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export function CallbackCompletionPage({ token, viewModel }: CallbackCompletionPageProps) {
  const [completionNotes, setCompletionNotes] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadedAttachments, setUploadedAttachments] = useState<CallbackAttachment[]>([])

  const isInvalidLink =
    !viewModel
    || viewModel.isInvalid
    || viewModel.isLinkExpired
    || viewModel.isLinkUsed
    || viewModel.isAlreadyCompleted

  const trimmedNotes = completionNotes.trim()
  const trimmedNotesLength = trimmedNotes.length
  const isNotesValid = trimmedNotesLength >= MIN_CALLBACK_COMPLETION_NOTE_LENGTH
  const remainingChars = Math.max(0, MIN_CALLBACK_COMPLETION_NOTE_LENGTH - trimmedNotesLength)

  const handleComplete = async () => {
    if (!viewModel || isInvalidLink || submitState === 'submitting') {
      return
    }

    if (!isNotesValid) {
      setSubmitState('error')
      setErrorMessage(
        `Bitte mindestens ${MIN_CALLBACK_COMPLETION_NOTE_LENGTH} Zeichen in die Notiz eintragen.`,
      )
      return
    }

    setSubmitState('submitting')
    setErrorMessage('')

    try {
      const response = await fetch('/api/callback-actions/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          completionNotes: trimmedNotes,
        }),
      })

      const data = await response.json() as { error?: string }
      if (!response.ok) {
        throw new Error(data.error ?? 'Rückruf konnte nicht als erledigt markiert werden.')
      }

      setSubmitState('success')
    } catch (error) {
      setSubmitState('error')
      setErrorMessage(error instanceof Error ? error.message : 'Rückruf konnte nicht als erledigt markiert werden.')
    }
  }

  const invalidDescription = !viewModel
    ? 'Dieser Link ist nicht gültig.'
    : viewModel.isAlreadyCompleted
      ? 'Dieser Rückruf ist bereits erledigt.'
      : viewModel.isLinkUsed
        ? 'Dieser Link wurde bereits verwendet.'
        : viewModel.isLinkExpired
          ? 'Dieser Link ist abgelaufen.'
          : 'Dieser Link ist nicht gültig.'

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10">
      <div className="mx-auto max-w-md">
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              {isInvalidLink ? <XCircle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
            </div>
            <div className="space-y-1">
              <CardTitle>Rückruf abschließen</CardTitle>
              <CardDescription>
                {isInvalidLink
                  ? invalidDescription
                  : 'Dokumentiere den Rückruf — eine Notiz ist Pflicht, Anhänge sind optional.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {viewModel && (
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
                <div className="space-y-1">
                  <p><span className="font-medium">Kunde:</span> {viewModel.customerName}</p>
                  <p><span className="font-medium">Anliegen:</span> {viewModel.reason}</p>
                  <p><span className="font-medium">Zuständig:</span> {viewModel.assignedAdvisor}</p>
                </div>
              </div>
            )}

            {submitState === 'success' ? (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="font-medium">Der Rückruf wurde als erledigt markiert.</p>
                <p>Deine Notiz wurde gespeichert.</p>
                {uploadedAttachments.length > 0 && (
                  <p>{uploadedAttachments.length} Anhang{uploadedAttachments.length === 1 ? '' : 'änge'} hochgeladen.</p>
                )}
              </div>
            ) : !isInvalidLink ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Notiz zum Abschluss
                      <span className="ml-1 text-destructive">*</span>
                    </label>
                    <span
                      className={cn(
                        'text-[11px] tabular-nums',
                        isNotesValid ? 'text-muted-foreground' : 'text-destructive',
                      )}
                    >
                      {trimmedNotesLength} / {MIN_CALLBACK_COMPLETION_NOTE_LENGTH}
                    </span>
                  </div>
                  <Textarea
                    rows={4}
                    value={completionNotes}
                    onChange={(event) => {
                      setCompletionNotes(event.target.value)
                      if (submitState === 'error' && errorMessage) {
                        setErrorMessage('')
                        setSubmitState('idle')
                      }
                    }}
                    placeholder="z. B. Kunde erreicht, Termin am Donnerstag 10:00 vereinbart."
                  />
                  {!isNotesValid && (
                    <p className="text-[11px] text-muted-foreground">
                      Bitte beschreibe in mindestens {MIN_CALLBACK_COMPLETION_NOTE_LENGTH} Zeichen, was passiert ist
                      ({remainingChars} fehlen).
                    </p>
                  )}
                </div>

                <CallbackAttachmentUploader
                  mode="token"
                  token={token}
                  stage="completion"
                  existing={uploadedAttachments}
                  onAttachmentUploaded={(att) =>
                    setUploadedAttachments((prev) => [...prev, att])
                  }
                  description="Optional: PDFs oder Bilder mit den Ergebnissen, max. 10 MB / 5 Dateien."
                />

                {submitState === 'error' && (
                  <p className="text-sm text-red-700">{errorMessage}</p>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleComplete}
                    disabled={submitState === 'submitting' || !isNotesValid}
                    className="flex-1"
                  >
                    {submitState === 'submitting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Jetzt als erledigt markieren
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/">Abbrechen</Link>
                  </Button>
                </div>
              </>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Zurück</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
