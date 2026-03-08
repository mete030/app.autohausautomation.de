'use client'

import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

interface VoiceButtonProps {
  onTranscript: (transcript: string) => void | Promise<void>
  disabled?: boolean
}

export function VoiceButton({ onTranscript, disabled = false }: VoiceButtonProps) {
  const { state, previewTranscript, errorMessage, toggleListening } = useSpeechRecognition({
    onTranscript,
    disabled,
  })

  return (
    <>
      {(state === 'listening' || state === 'processing' || errorMessage) && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-3 z-50 w-[min(340px,calc(100vw-1.25rem))] animate-in fade-in slide-in-from-bottom-4 duration-300 sm:right-6 sm:max-w-xs">
          <div className="rounded-2xl bg-card border border-border/60 shadow-xl px-4 py-3 backdrop-blur-sm">
            {state === 'listening' && (
              <div className="flex items-center gap-2.5">
                <div className="flex gap-[3px] items-end h-4">
                  <span className="w-[3px] h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="w-[3px] h-3.5 bg-red-500 rounded-full animate-pulse [animation-delay:75ms]" />
                  <span className="w-[3px] h-2.5 bg-red-500 rounded-full animate-pulse [animation-delay:150ms]" />
                  <span className="w-[3px] h-1.5 bg-red-500 rounded-full animate-pulse [animation-delay:225ms]" />
                </div>
                <span className="text-sm">{previewTranscript || 'Ich höre zu...'}</span>
              </div>
            )}

            {state === 'processing' && (
              <div className="flex items-center gap-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Verarbeite: &quot;{previewTranscript}&quot;
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">{errorMessage}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={toggleListening}
        disabled={disabled || state === 'processing'}
        className={cn(
          'fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] right-3 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:bottom-6 sm:right-6',
          state === 'idle' && 'bg-primary text-primary-foreground hover:shadow-xl hover:scale-105 active:scale-95',
          state === 'listening' && 'bg-red-500 text-white shadow-red-500/20 shadow-xl scale-110',
          state === 'processing' && 'bg-primary/80 text-primary-foreground'
        )}
        aria-label="Voice Assistant"
      >
        {state === 'idle' && <Mic className="h-5 w-5" />}
        {state === 'listening' && <MicOff className="h-5 w-5" />}
        {state === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
      </button>
    </>
  )
}
