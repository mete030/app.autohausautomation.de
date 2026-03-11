'use client'

import { useState, useEffect, useRef } from 'react'

interface CountdownResult {
  minutes: number
  seconds: number
  totalSeconds: number
  isOverdue: boolean
  percentRemaining: number
  formatted: string
}

export function useCountdown(targetDate: string, totalDurationMinutes?: number): CountdownResult {
  const [now, setNow] = useState(() => Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const target = new Date(targetDate).getTime()
  const diff = target - now
  const isOverdue = diff <= 0
  const absDiff = Math.abs(diff)
  const totalSeconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  const totalDurationMs = (totalDurationMinutes ?? 30) * 60 * 1000
  const elapsed = totalDurationMs - diff
  const percentRemaining = isOverdue ? 0 : Math.max(0, Math.min(100, (diff / totalDurationMs) * 100))

  const pad = (n: number) => n.toString().padStart(2, '0')
  const formatted = isOverdue
    ? `+${minutes}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`

  return { minutes, seconds, totalSeconds, isOverdue, percentRemaining, formatted }
}
