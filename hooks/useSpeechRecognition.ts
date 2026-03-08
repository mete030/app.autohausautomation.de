'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type VoiceButtonState = 'idle' | 'listening' | 'processing'

type SpeechRecognitionResultAlternative = {
  transcript: string
}

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionResultAlternative
  length: number
  isFinal: boolean
  [index: number]: SpeechRecognitionResultAlternative
}

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>
}

type SpeechRecognitionErrorLike = {
  error?: string
}

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

function getSpeechRecognition() {
  const scope = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return scope.SpeechRecognition || scope.webkitSpeechRecognition || null
}

interface UseSpeechRecognitionOptions {
  onTranscript: (transcript: string) => void | Promise<void>
  disabled?: boolean
}

export function useSpeechRecognition({ onTranscript, disabled = false }: UseSpeechRecognitionOptions) {
  const [state, setState] = useState<VoiceButtonState>('idle')
  const [previewTranscript, setPreviewTranscript] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const finalTranscriptRef = useRef('')
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      recognitionRef.current?.stop()
    }
  }, [])

  const startListening = useCallback(() => {
    if (disabled || state !== 'idle') return

    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      setErrorMessage('Spracherkennung ist nur in Chrome zuverlässig verfügbar.')
      return
    }

    setErrorMessage(null)
    setPreviewTranscript('')
    finalTranscriptRef.current = ''

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'de-DE'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setState('listening')
    }

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim()
      finalTranscriptRef.current = transcript
      setPreviewTranscript(transcript)
    }

    recognition.onerror = (event) => {
      setState('idle')
      setPreviewTranscript('')
      finalTranscriptRef.current = ''
      if (event?.error === 'not-allowed') {
        setErrorMessage('Mikrofonzugriff wurde blockiert.')
        return
      }
      setErrorMessage('Spracherkennung fehlgeschlagen. Bitte erneut versuchen.')
    }

    recognition.onend = async () => {
      recognitionRef.current = null

      const finalTranscript = finalTranscriptRef.current.trim()
      if (!finalTranscript) {
        setState('idle')
        setPreviewTranscript('')
        return
      }

      setState('processing')
      try {
        await onTranscript(finalTranscript)
      } finally {
        if (!mountedRef.current) return
        setState('idle')
        setPreviewTranscript('')
        finalTranscriptRef.current = ''
      }
    }

    recognition.start()
  }, [disabled, onTranscript, state])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const toggleListening = useCallback(() => {
    if (state === 'listening') {
      stopListening()
      return
    }

    if (state === 'idle') {
      startListening()
    }
  }, [startListening, state, stopListening])

  const clearError = useCallback(() => {
    setErrorMessage(null)
  }, [])

  return {
    state,
    previewTranscript,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
    clearError,
  }
}
