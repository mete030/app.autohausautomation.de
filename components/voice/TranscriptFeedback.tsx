'use client'

import { AlertTriangle, ArrowRight, Car, CheckCircle2, FileText, MapPin, Route, ShieldCheck, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CallbackStatus, KYCStatus, ListingStatus, VehicleLocation, VehicleStatus } from '@/lib/types'
import type { ParsedVoiceIntent } from '@/hooks/useVoiceIntentParser'

interface TranscriptFeedbackProps {
  intent: ParsedVoiceIntent | null
  onConfirm: () => void
  onCancel: () => void
}

const vehicleStatusLabels: Record<VehicleStatus, string> = {
  eingang: 'Eingang',
  inspektion: 'Inspektion',
  werkstatt: 'Werkstatt',
  aufbereitung: 'Aufbereitung',
  verkaufsbereit: 'Verkaufsbereit',
  verkauft: 'Verkauft',
}

const locationLabels: Record<VehicleLocation, string> = {
  'Hof A': 'Hof A',
  'Hof B': 'Hof B',
  Werkstatt: 'Werkstatt',
  Showroom: 'Showroom',
}

const callbackStatusLabels: Record<CallbackStatus, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  erledigt: 'Erledigt',
  ueberfaellig: 'Überfällig',
}

const listingStatusLabels: Record<ListingStatus, string> = {
  entwurf: 'Entwurf',
  live: 'Live',
  archiviert: 'Archiviert',
}

const kycStatusLabels: Record<KYCStatus, string> = {
  eingereicht: 'Eingereicht',
  in_pruefung: 'In Prüfung',
  verifiziert: 'Verifiziert',
  abgelehnt: 'Abgelehnt',
  manuell_pruefen: 'Manuell prüfen',
}

function renderIntentDetails(intent: ParsedVoiceIntent) {
  if (intent.type === 'vehicle_update') {
    return (
      <div className="space-y-2.5 rounded-lg border border-border/60 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Car className="h-3.5 w-3.5" />
            Fahrzeug
          </span>
          <span className="text-sm text-right font-medium">
            {intent.vehicle ? `${intent.vehicle.make} ${intent.vehicle.model}` : 'Nicht erkannt'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Status</span>
          <Badge variant="secondary">{intent.status ? vehicleStatusLabels[intent.status] : 'Unverändert'}</Badge>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            Standort
          </span>
          <Badge variant="outline">{intent.location ? locationLabels[intent.location] : 'Unverändert'}</Badge>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Route className="h-3.5 w-3.5" />
            Nächster Schritt
          </span>
          <p className="text-sm">{intent.nextStep || 'Nicht erkannt'}</p>
        </div>
      </div>
    )
  }

  if (intent.type === 'callback_update') {
    return (
      <div className="space-y-2.5 rounded-lg border border-border/60 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            Rückruf
          </span>
          <span className="text-sm text-right font-medium">{intent.callback?.customerName || 'Nicht erkannt'}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Neuer Status</span>
          <Badge variant="secondary">{intent.status ? callbackStatusLabels[intent.status] : 'Nicht erkannt'}</Badge>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Abschlussnotiz</span>
          <p className="text-sm">{intent.completionNotes || 'Keine Notiz'}</p>
        </div>
      </div>
    )
  }

  if (intent.type === 'listing_update') {
    return (
      <div className="space-y-2.5 rounded-lg border border-border/60 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Inserat
          </span>
          <span className="text-sm text-right font-medium line-clamp-2">{intent.listing?.title || 'Nicht erkannt'}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Neuer Status</span>
          <Badge variant="secondary">{intent.status ? listingStatusLabels[intent.status] : 'Nicht erkannt'}</Badge>
        </div>
      </div>
    )
  }

  if (intent.type === 'kyc_update') {
    return (
      <div className="space-y-2.5 rounded-lg border border-border/60 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verifizierung
          </span>
          <span className="text-sm text-right font-medium">{intent.submission?.customerName || 'Nicht erkannt'}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Neuer Status</span>
          <Badge variant="secondary">{intent.status ? kycStatusLabels[intent.status] : 'Nicht erkannt'}</Badge>
        </div>
      </div>
    )
  }

  if (intent.type === 'navigate') {
    return (
      <div className="space-y-2.5 rounded-lg border border-border/60 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Aktion</span>
          <span className="text-sm font-medium flex items-center gap-1">
            Navigation <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Ziel</span>
          <Badge variant="secondary">{intent.routeLabel}</Badge>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 rounded-lg border border-border/60 p-3">
      <p className="text-sm text-muted-foreground">Kein umsetzbarer Intent erkannt.</p>
    </div>
  )
}

export function TranscriptFeedback({ intent, onConfirm, onCancel }: TranscriptFeedbackProps) {
  if (!intent) return null

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[min(430px,calc(100vw-3rem))] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card className="border-border/60 shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-2 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Transkript bestätigen
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Prüfe den erkannten Intent, bevor der lokale State aktualisiert wird.
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="rounded-lg bg-muted/70 px-3 py-2 text-sm leading-relaxed">
            &quot;{intent.transcript}&quot;
          </div>

          {renderIntentDetails(intent)}

          <div className="rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground">
            {intent.summary}
          </div>

          {!intent.canApply && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{intent.issues.join(' ')}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Verwerfen
            </Button>
            <Button size="sm" onClick={onConfirm} disabled={!intent.canApply}>
              Bestätigen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
