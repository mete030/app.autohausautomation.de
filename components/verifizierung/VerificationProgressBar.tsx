'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { CheckCircle, Clock } from 'lucide-react'

interface VerificationProgressBarProps {
  total: number
  verified: number
  failed: number
}

export function VerificationProgressBar({ total, verified, failed }: VerificationProgressBarProps) {
  const percentage = total > 0 ? Math.round((verified / total) * 100) : 0
  const allDone = verified === total && total > 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1.5">
          {allDone
            ? <><CheckCircle className="h-3.5 w-3.5 text-emerald-500" />Alle Dokumente verifiziert</>
            : <><Clock className="h-3.5 w-3.5" />{verified} von {total} verifiziert</>}
        </span>
        <span className={cn(
          'font-bold tabular-nums',
          allDone ? 'text-emerald-600' : 'text-foreground'
        )}>{percentage}%</span>
      </div>
      <Progress
        value={percentage}
        className={cn(
          'h-2',
          allDone && '[&>[data-slot=progress-indicator]]:bg-emerald-500'
        )}
      />
      {failed > 0 && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {failed} Dokument{failed > 1 ? 'e' : ''} abgelehnt &ndash; bitte erneut einreichen
        </p>
      )}
    </div>
  )
}
