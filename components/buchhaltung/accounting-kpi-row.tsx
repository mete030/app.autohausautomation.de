'use client'

import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2, Clock3, PackageCheck } from 'lucide-react'

interface AccountingKpiRowProps {
  offen: number
  kritisch: number
  freigegeben: number
  exportbereit: number
}

export function AccountingKpiRow({
  offen,
  kritisch,
  freigegeben,
  exportbereit,
}: AccountingKpiRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="border-border/60">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <Clock3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold leading-none">{offen}</p>
            <p className="text-xs text-muted-foreground mt-1">Offen</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xl font-bold leading-none">{kritisch}</p>
            <p className="text-xs text-muted-foreground mt-1">Kritisch</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-bold leading-none">{freigegeben}</p>
            <p className="text-xs text-muted-foreground mt-1">Freigegeben</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
            <PackageCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xl font-bold leading-none">{exportbereit}</p>
            <p className="text-xs text-muted-foreground mt-1">Exportbereit</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
