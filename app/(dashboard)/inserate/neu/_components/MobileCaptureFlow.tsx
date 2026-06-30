'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  backdropOptions,
  beautyPositions,
  CAPTURE_VIN,
  CAPTURE_VEHICLE,
  POSITION_COUNT,
  fahrzeugscheinImg,
  type BackdropOption,
  type BeautyPosition,
} from '@/lib/inserate-foto-mock'
import {
  X, Check, Camera, ChevronLeft, ChevronRight, ScanLine,
  Loader2, CheckCircle2, UploadCloud, RotateCcw, Images, RotateCw,
} from 'lucide-react'

// ─── Brand emblems (rendered on backdrop cards, not baked into the image) ─────

function MercedesStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="5" />
      <g stroke="currentColor" strokeWidth="5" strokeLinecap="round">
        <line x1="50" y1="50" x2="50" y2="10" />
        <line x1="50" y1="50" x2="16" y2="70" />
        <line x1="50" y1="50" x2="84" y2="70" />
      </g>
    </svg>
  )
}

function BackdropEmblem({ emblem }: { emblem: BackdropOption['emblem'] }) {
  if (emblem === 'mercedes') {
    return (
      <MercedesStar className="h-12 w-12 text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]" />
    )
  }
  if (emblem === 'smart') {
    return (
      <span className="rounded-md bg-white/90 px-2.5 py-1 text-base font-bold lowercase tracking-tight text-neutral-900 shadow-sm">
        smart
      </span>
    )
  }
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
      Wackenhut
    </span>
  )
}

// ─── Step machine ─────────────────────────────────────────────────────────────

type Step = 'backdrop' | 'vin' | 'positions' | 'camera' | 'upload' | 'done'

const STEP_ORDER: Step[] = ['backdrop', 'vin', 'positions', 'upload']

const STEP_META: Record<Step, { index: number; label: string }> = {
  backdrop: { index: 0, label: 'Hintergrund' },
  vin: { index: 1, label: 'VIN' },
  positions: { index: 2, label: 'Aufnahmen' },
  camera: { index: 2, label: 'Aufnahmen' },
  upload: { index: 3, label: 'Upload' },
  done: { index: 3, label: 'Upload' },
}

// Reusable scoped <img> with fallback handling (assets may still be generating).
function CaptureImg({
  src,
  alt,
  className,
  style,
}: {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        const img = e.currentTarget
        if (!img.dataset.fellback) {
          img.dataset.fellback = '1'
          img.src = '/inserate-demo/glc_front_left_lot.png'
        }
      }}
    />
  )
}

export function MobileCaptureFlow({
  open,
  onClose,
  onComplete,
}: {
  open: boolean
  onClose: () => void
  onComplete: () => void
}) {
  const [step, setStep] = useState<Step>('backdrop')
  const [backdrop, setBackdrop] = useState<BackdropOption['id']>('mercedes')

  // VIN
  const [vinScanning, setVinScanning] = useState(false)
  const [vinSheet, setVinSheet] = useState(false)
  const [vinValue, setVinValue] = useState(CAPTURE_VIN)
  const [scanChars, setScanChars] = useState(0) // progressive OCR reveal

  // Positions
  const [captured, setCaptured] = useState<Set<string>>(new Set())
  const [activePos, setActivePos] = useState<BeautyPosition | null>(null)

  // Camera
  const [flash, setFlash] = useState(false)
  const [shooting, setShooting] = useState(false)
  const [shotReady, setShotReady] = useState(false)

  // Upload
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const after = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms)
    timers.current.push(t)
  }

  // Mounted fresh each time the overlay opens (FotosTab gates on `open`), so the
  // initial useState values already are the reset. Only clear timers on unmount.
  useEffect(() => {
    const list = timers.current
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      list.forEach(clearTimeout)
      timers.current = []
    }
  }, [onClose])

  if (!open) return null

  const capturedCount = captured.size

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const startVinScan = () => {
    setVinScanning(true)
    setScanChars(0)
    // OCR reveals the VIN character by character as the scan line sweeps.
    for (let i = 1; i <= CAPTURE_VIN.length; i++) {
      after(150 + i * 75, () => setScanChars(i))
    }
    after(150 + CAPTURE_VIN.length * 75 + 250, () => {
      setVinScanning(false)
      setVinSheet(true)
    })
  }

  const openCamera = (pos: BeautyPosition) => {
    setActivePos(pos)
    setShooting(false)
    setShotReady(false)
    setFlash(false)
    setStep('camera')
  }

  const triggerShutter = () => {
    if (shooting || shotReady) return
    setShooting(true)
    setFlash(true)
    after(400, () => setFlash(false))
    after(700, () => {
      setShooting(false)
      setShotReady(true)
    })
  }

  const retakeShot = () => {
    setShotReady(false)
    setShooting(false)
    setFlash(false)
  }

  const acceptShot = () => {
    if (!activePos) return
    const next = new Set(captured)
    next.add(activePos.id)
    setCaptured(next)
    setShotReady(false)
    setShooting(false)
    setFlash(false)
    // Autofox-style: stay in the camera and jump straight to the next open
    // position so the user can shoot the whole set without leaving capture mode.
    const order = beautyPositions
    const curIdx = order.findIndex((p) => p.id === activePos.id)
    const nextPos =
      order.slice(curIdx + 1).find((p) => !next.has(p.id)) ??
      order.find((p) => !next.has(p.id))
    if (nextPos) {
      setActivePos(nextPos)
    } else {
      setActivePos(null)
      setStep('positions')
    }
  }

  const startUpload = () => {
    setUploading(true)
    setUploadProgress(0)
    const steps = [14, 32, 51, 68, 84, 95, 100]
    steps.forEach((value, i) => {
      after(Math.round((2000 / steps.length) * (i + 1)), () => setUploadProgress(value))
    })
    after(2100, () => {
      setUploading(false)
      setStep('done')
      onComplete()
    })
  }

  // ─── Step header (progress) ───────────────────────────────────────────────

  const activeIdx = STEP_META[step].index

  const Header = (
    <div className="shrink-0 px-4 pt-2 pb-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Foto-Aufnahme
        </p>
        <p className="text-[10px] font-medium tabular-nums text-muted-foreground">
          Schritt {activeIdx + 1}/{STEP_ORDER.length}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {STEP_ORDER.map((s, i) => (
          <div
            key={s}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-500',
              i <= activeIdx ? 'bg-primary' : 'bg-muted',
            )}
          />
        ))}
      </div>
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-0 backdrop-blur sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Foto-Aufnahme"
    >
      {/* Phone frame — rotates to landscape automatically for the camera step */}
      <PhoneShell
        key={step === 'camera' ? 'landscape' : 'portrait'}
        landscape={step === 'camera'}
        onClose={onClose}
      >
        {Header}

        {/* ─── Step body ─────────────────────────────────────────────────── */}
        <div className="relative min-h-0 flex-1">
          {/* 1) BACKDROP */}
          {step === 'backdrop' && (
            <div className="flex h-full flex-col px-4 pb-4 animate-in fade-in slide-in-from-right-3 duration-300">
              <h2 className="text-base font-bold leading-tight">Hintergrund wählen</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Studio-Hintergrund für die Freistellung.
              </p>

              <div className="mt-4 grid flex-1 content-start gap-3 overflow-y-auto pb-2">
                {backdropOptions.map((opt) => {
                  const selected = backdrop === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setBackdrop(opt.id)}
                      aria-pressed={selected}
                      aria-label={`${opt.label} – ${opt.hint}${selected ? ', ausgewählt' : ''}`}
                      className={cn(
                        'group relative h-24 w-full overflow-hidden rounded-xl text-left ring-2 transition-all active:scale-[0.98]',
                        selected
                          ? 'ring-primary'
                          : 'ring-transparent hover:ring-border',
                      )}
                    >
                      <CaptureImg
                        src={opt.image}
                        alt={opt.label}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BackdropEmblem emblem={opt.emblem} />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-2.5">
                        <p className="text-xs font-semibold text-white drop-shadow">{opt.label}</p>
                        <p className="text-[10px] leading-tight text-white/75 drop-shadow">{opt.hint}</p>
                      </div>
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow animate-in zoom-in">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <Button
                className="mt-3 h-11 w-full rounded-xl text-sm active:scale-[0.98]"
                onClick={() => setStep('vin')}
              >
                Weiter
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* 2) VIN */}
          {step === 'vin' && (
            <div className="flex h-full flex-col px-4 pb-4 animate-in fade-in slide-in-from-right-3 duration-300">
              <h2 className="text-base font-bold leading-tight">VIN scannen</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Fahrgestellnummer in den Rahmen halten.
              </p>

              {/* Camera viewport — scanning a real registration document */}
              <div className="relative mt-4 flex-1 overflow-hidden rounded-2xl bg-neutral-950">
                {/* The Fahrzeugschein, zoomed onto the FIN row (field E) and gently
                    floating like a handheld camera. The img is centred then shifted
                    by translate(-47%,-39%): the FIN sits at ~39% height / ~47% width
                    of the source, so this lands it exactly in the centred frame,
                    independent of the viewport's aspect ratio. */}
                <div className="absolute inset-0 motion-safe:animate-[finbreathe_7s_ease-in-out_infinite]">
                  <CaptureImg
                    src={fahrzeugscheinImg}
                    alt="Fahrzeugschein"
                    className="absolute left-1/2 top-1/2 w-[172%] max-w-none brightness-[0.82]"
                    style={{ transform: 'translate(-47%, -39%)' }}
                  />
                </div>
                {/* camera vignette dimming everything but the target */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_22%,rgba(0,0,0,0.66)_80%)]" />

                {/* field label tag pointing at the VIN row */}
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[3.35rem] whitespace-nowrap rounded-md bg-black/55 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/85 backdrop-blur-sm">
                  Feld E · Fahrzeug-Ident.-Nr.
                </span>

                {/* OCR target frame */}
                <div className="absolute left-1/2 top-1/2 h-14 w-[88%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border-2 border-white/85 bg-black/70 backdrop-blur-[2px]">
                  {/* corner accents */}
                  {(['-left-0.5 -top-0.5 border-l-2 border-t-2', '-right-0.5 -top-0.5 border-r-2 border-t-2', '-left-0.5 -bottom-0.5 border-l-2 border-b-2', '-right-0.5 -bottom-0.5 border-r-2 border-b-2'] as const).map((p) => (
                    <span key={p} className={cn('absolute h-3.5 w-3.5 border-primary', p)} />
                  ))}
                  {/* animated scan line while scanning */}
                  {vinScanning && (
                    <div className="absolute inset-x-1.5 top-1.5 h-0.5 rounded-full bg-primary shadow-[0_0_12px_2px] shadow-primary/70 motion-safe:animate-[scanline_1.2s_ease-in-out_infinite]" />
                  )}
                  {/* detected VIN — reveals character by character */}
                  <div className="flex h-full items-center justify-center px-2">
                    <span className="font-mono text-[13px] font-semibold tracking-[0.14em] text-white">
                      {vinScanning || vinSheet
                        ? CAPTURE_VIN.slice(0, vinSheet ? CAPTURE_VIN.length : scanChars).padEnd(CAPTURE_VIN.length, '·')
                        : 'FIN scannen'}
                    </span>
                  </div>
                </div>

                <p className="absolute inset-x-0 bottom-3 text-center text-[11px] font-medium text-white/70">
                  {vinScanning ? 'Erkenne Fahrgestellnummer…' : 'Fahrzeugschein in den Rahmen halten'}
                </p>
              </div>

              {!vinSheet ? (
                <Button
                  className="mt-3 h-11 w-full rounded-xl text-sm active:scale-[0.98]"
                  onClick={startVinScan}
                  disabled={vinScanning}
                >
                  {vinScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanne…
                    </>
                  ) : (
                    <>
                      <ScanLine className="h-4 w-4" />
                      VIN scannen
                    </>
                  )}
                </Button>
              ) : (
                <div className="mt-3 rounded-2xl border bg-card p-3.5 shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <p className="text-sm font-semibold">VIN bestätigen</p>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Erkannt: <span className="font-medium text-foreground">{CAPTURE_VEHICLE}</span>
                  </p>
                  <input
                    value={vinValue}
                    onChange={(e) => setVinValue(e.target.value.toUpperCase())}
                    maxLength={17}
                    className="mt-2.5 w-full rounded-lg border bg-background px-3 py-2 text-center font-mono text-sm tracking-[0.18em] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      className="h-10 flex-1 rounded-xl text-xs active:scale-[0.98]"
                      onClick={() => {
                        setVinSheet(false)
                        setVinValue(CAPTURE_VIN)
                        setScanChars(0)
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Erneut scannen
                    </Button>
                    <Button
                      className="h-10 flex-1 rounded-xl text-xs active:scale-[0.98]"
                      onClick={() => setStep('positions')}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Bestätigen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3) POSITIONS */}
          {step === 'positions' && (
            <div className="flex h-full flex-col px-4 pb-4 animate-in fade-in slide-in-from-right-3 duration-300">
              <h2 className="text-base font-bold leading-tight">
                Beauty-Aufnahmen ({capturedCount}/{POSITION_COUNT})
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tippen Sie eine Position zum Aufnehmen.
              </p>

              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(capturedCount / POSITION_COUNT) * 100}%` }}
                />
              </div>

              <div className="mt-3 grid flex-1 grid-cols-3 content-start gap-2 overflow-y-auto pb-2">
                {beautyPositions.map((pos) => {
                  const isCaptured = captured.has(pos.id)
                  return (
                    <button
                      key={pos.id}
                      onClick={() => !isCaptured && openCamera(pos)}
                      disabled={isCaptured}
                      aria-label={`${pos.label}${isCaptured ? ' – aufgenommen' : ' – aufnehmen'}`}
                      className={cn(
                        'group relative aspect-square overflow-hidden rounded-xl border text-left transition-all active:scale-[0.96]',
                        isCaptured
                          ? 'border-emerald-300 dark:border-emerald-800'
                          : 'border-border bg-muted hover:border-primary/50',
                      )}
                    >
                      {isCaptured ? (
                        <>
                          <CaptureImg
                            src={pos.lot}
                            alt={pos.label}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow animate-in zoom-in">
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          </span>
                          <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3 text-[9px] font-medium text-white">
                            {pos.label}
                          </span>
                        </>
                      ) : (
                        <>
                          {/* Line-art overlay preview of the target angle */}
                          <CaptureImg
                            src={pos.overlay}
                            alt=""
                            className="absolute inset-0 h-full w-full object-contain p-1.5 opacity-75 mix-blend-multiply dark:opacity-90 dark:mix-blend-screen dark:invert"
                          />
                          <Camera className="absolute right-1 top-1 h-3 w-3 text-muted-foreground/50" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent px-1.5 pb-1 pt-3">
                            <span className="block truncate text-center text-[9px] font-medium leading-tight text-foreground/80">
                              {pos.label}
                            </span>
                          </div>
                        </>
                      )}
                    </button>
                  )
                })}
              </div>

              <Button
                className="mt-3 h-11 w-full rounded-xl text-sm active:scale-[0.98]"
                onClick={() => setStep('upload')}
                disabled={capturedCount === 0}
              >
                <UploadCloud className="h-4 w-4" />
                Fertig{capturedCount > 0 ? ` · ${capturedCount} Fotos` : ''}
              </Button>
            </div>
          )}

          {/* 4) CAMERA — auto landscape (Querformat), Autofox-style live capture */}
          {step === 'camera' && activePos && (
            <div className="absolute inset-0 flex gap-1.5 bg-neutral-950 p-1.5 animate-in fade-in duration-200">
              {/* Left rail: jump between positions without leaving the camera */}
              <div className="flex w-[52px] shrink-0 flex-col gap-1.5 overflow-y-auto py-0.5 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {beautyPositions.map((pos) => {
                  const isCap = captured.has(pos.id)
                  const isActive = activePos.id === pos.id
                  return (
                    <button
                      key={pos.id}
                      onClick={() => openCamera(pos)}
                      aria-label={`${pos.label}${isCap ? ' – aufgenommen' : ''}${isActive ? ' – aktiv' : ''}`}
                      aria-current={isActive}
                      className={cn(
                        'relative aspect-square w-full shrink-0 overflow-hidden rounded-lg border bg-black transition-all active:scale-95',
                        isActive
                          ? 'border-sky-400 ring-2 ring-sky-400/80'
                          : isCap
                            ? 'border-emerald-400/60'
                            : 'border-white/15 hover:border-white/35',
                      )}
                    >
                      {isCap ? (
                        <CaptureImg src={pos.lot} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <CaptureImg
                          src={pos.overlay}
                          alt=""
                          className="absolute inset-0 h-full w-full object-contain p-1 opacity-70 invert mix-blend-screen"
                        />
                      )}
                      {isCap && (
                        <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                          <Check className="h-2 w-2" strokeWidth={3.5} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Center viewport — neon wireframe over the live viewfinder */}
              <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-black">
                {!shotReady ? (
                  <>
                    {/* Simulated live camera feed: the framed vehicle, softly out of focus */}
                    <CaptureImg
                      src={activePos.lot}
                      alt=""
                      className="absolute inset-0 h-full w-full scale-[1.08] object-cover blur-[2px] brightness-[0.55] saturate-[0.85]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45" />
                    {/* faint AR grid */}
                    <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:30px_30px]" />
                    {/* Neon alignment wireframe (Autofox guide) */}
                    <CaptureImg
                      src={activePos.overlay}
                      alt="Aufnahmewinkel"
                      className="absolute inset-0 h-full w-full object-contain p-3 opacity-95 invert mix-blend-screen drop-shadow-[0_0_10px_rgba(56,189,248,0.6)] motion-safe:animate-[wirepulse_2.6s_ease-in-out_infinite]"
                    />
                    {/* neon framing brackets */}
                    {(
                      [
                        'left-2 top-2 border-l-2 border-t-2',
                        'right-2 top-2 border-r-2 border-t-2',
                        'left-2 bottom-2 border-l-2 border-b-2',
                        'right-2 bottom-2 border-r-2 border-b-2',
                      ] as const
                    ).map((p) => (
                      <span key={p} className={cn('absolute h-5 w-5 rounded-[2px] border-sky-300/90', p)} />
                    ))}
                    {/* REC HUD */}
                    <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                      REC
                    </span>
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-2.5 py-1 text-center text-[10px] font-medium text-white/85 backdrop-blur-sm">
                      Fahrzeug an der Silhouette ausrichten
                    </span>
                  </>
                ) : (
                  <CaptureImg
                    src={activePos.lot}
                    alt={activePos.label}
                    className="absolute inset-0 h-full w-full object-cover animate-in fade-in zoom-in-95 duration-300"
                  />
                )}

                {/* Back + label + progress overlaid */}
                <button
                  onClick={() => {
                    setActivePos(null)
                    setStep('positions')
                  }}
                  className="absolute left-2 bottom-2 z-10 inline-flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/65 active:scale-95"
                  style={shotReady ? undefined : { display: 'none' }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Galerie
                </button>
                <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-lg bg-black/50 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {activePos.label}
                  <span className="text-white/55 tabular-nums">{capturedCount}/{POSITION_COUNT}</span>
                </span>

                {/* Flash overlay */}
                {flash && (
                  <div className="absolute inset-0 z-20 bg-white animate-out fade-out duration-[400ms] fill-mode-forwards" />
                )}
              </div>

              {/* Right rail: shutter / actions */}
              <div className="flex w-[64px] shrink-0 flex-col items-center justify-center gap-3">
                {!shotReady ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-white/55">
                      <RotateCw className="h-3 w-3" />
                      Quer
                    </span>
                    <button
                      onClick={triggerShutter}
                      disabled={shooting}
                      aria-label="Auslösen"
                      className={cn(
                        'flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full ring-4 ring-white/20 transition-transform active:scale-90',
                        shooting && 'scale-90',
                      )}
                    >
                      <span className="flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-full bg-white">
                        {shooting ? (
                          <Loader2 className="h-6 w-6 animate-spin text-neutral-900" />
                        ) : (
                          <Camera className="h-6 w-6 text-neutral-900" />
                        )}
                      </span>
                    </button>
                    <span className="text-[9px] font-medium text-white/40">Auslösen</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2.5 animate-in fade-in slide-in-from-right-2 duration-300">
                    <button
                      onClick={acceptShot}
                      aria-label="Übernehmen & weiter"
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform active:scale-90"
                    >
                      <Check className="h-6 w-6" />
                    </button>
                    <span className="text-[9px] font-medium text-white/55">Weiter</span>
                    <button
                      onClick={retakeShot}
                      aria-label="Erneut aufnehmen"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-transform active:scale-90"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5) UPLOAD */}
          {step === 'upload' && (
            <div className="flex h-full flex-col px-4 pb-4 animate-in fade-in slide-in-from-right-3 duration-300">
              <h2 className="text-base font-bold leading-tight">{capturedCount === 1 ? '1 Foto' : `${capturedCount} Fotos`} hochladen</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Vor dem Hochladen prüfen.
              </p>

              <div className="mt-4 flex-1 overflow-y-auto rounded-2xl border bg-card">
                {beautyPositions
                  .filter((p) => captured.has(p.id))
                  .map((pos) => (
                    <div key={pos.id} className="flex items-center gap-3 border-b border-border/50 px-3 py-2.5 last:border-0">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <CaptureImg src={pos.lot} alt={pos.label} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{pos.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {pos.group === 'exterior' ? 'Außenaufnahme' : 'Innenraum'}
                        </p>
                      </div>
                      {uploading ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      )}
                    </div>
                  ))}
              </div>

              {/* Backdrop summary */}
              <div className="mt-3 flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2">
                <Images className="h-4 w-4 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">
                  Hintergrund:{' '}
                  <span className="font-medium text-foreground">
                    {backdropOptions.find((b) => b.id === backdrop)?.label}
                  </span>
                </p>
              </div>

              {uploading && (
                <div className="mt-3 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <UploadCloud className="h-3.5 w-3.5" />
                      Wird hochgeladen…
                    </span>
                    <span className="tabular-nums">{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {!uploading && (
                <Button
                  className="mt-3 h-11 w-full rounded-xl text-sm active:scale-[0.98]"
                  onClick={startUpload}
                >
                  <UploadCloud className="h-4 w-4" />
                  Hochladen
                </Button>
              )}
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div className="flex h-full flex-col items-center justify-center px-6 pb-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg animate-in zoom-in duration-500">
                  <Check className="h-7 w-7" strokeWidth={3} />
                </span>
              </div>
              <h2 className="mt-5 text-xl font-bold">Hochgeladen!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {capturedCount === 1 ? '1 Foto wurde' : `${capturedCount} Fotos wurden`} übertragen und werden jetzt automatisch freigestellt.
              </p>
              <Button
                className="mt-6 h-11 w-full rounded-xl text-sm active:scale-[0.98]"
                onClick={onClose}
              >
                Zur Desktop-Ansicht
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </PhoneShell>

      {/* scan-line keyframes (scoped, no global CSS edit) */}
      <style>{`
        @keyframes scanline {
          0%   { transform: translateY(0); opacity: 0.4; }
          50%  { transform: translateY(56px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.4; }
        }
        @keyframes finbreathe {
          0%,100% { transform: scale(1.02) rotate(-0.4deg); }
          50%     { transform: scale(1.05) rotate(0.45deg); }
        }
        @keyframes rotateToLandscape {
          0%   { transform: rotate(-90deg) scale(0.70); opacity: 0; }
          55%  { opacity: 0.55; }
          100% { transform: rotate(0deg) scale(1); opacity: 1; }
        }
        @keyframes wirepulse {
          0%,100% { opacity: 0.78; }
          50%     { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Inlined phone shell with close button ────────────────────────────────────
// Mirrors PhoneFrame.tsx but adds the X close affordance the wizard owns.

function PhoneShell({
  children,
  onClose,
  landscape = false,
}: {
  children: React.ReactNode
  onClose: () => void
  landscape?: boolean
}) {
  return (
    <div
      className={cn(
        'relative shrink-0 bg-neutral-900 p-2.5 shadow-2xl shadow-black/60 ring-1 ring-white/10 duration-300 dark:bg-black',
        landscape
          ? 'h-[62svh] max-h-[420px] w-[94vw] max-w-[760px] rounded-[2rem] sm:h-[380px] sm:w-[760px] sm:p-3 motion-safe:animate-[rotateToLandscape_0.5s_cubic-bezier(0.22,1,0.36,1)]'
          : 'h-[100svh] w-full max-w-[380px] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 sm:h-[800px] sm:max-h-[92svh] sm:w-[380px] sm:rounded-[2.5rem] sm:p-3',
      )}
    >
      {/* Side buttons (decorative) */}
      <div className="absolute -left-0.5 top-32 hidden h-14 w-[3px] rounded-l-sm bg-neutral-700 sm:block" />
      <div className="absolute -left-0.5 top-48 hidden h-14 w-[3px] rounded-l-sm bg-neutral-700 sm:block" />
      <div className="absolute -right-0.5 top-44 hidden h-20 w-[3px] rounded-r-sm bg-neutral-700 sm:block" />

      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2rem] bg-background sm:rounded-[2rem]">
        {/* Status bar */}
        <div className="relative z-30 flex h-11 shrink-0 items-center justify-between px-6 pt-1 text-foreground">
          <span className="text-[13px] font-semibold tabular-nums tracking-tight">09:57</span>
          {/* Dynamic island */}
          <div className="absolute left-1/2 top-2 h-7 w-[7.5rem] -translate-x-1/2 rounded-full bg-black" />
          <div className="flex items-center gap-1.5">
            <SignalIcon />
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Schließen"
          className="absolute right-3 top-12 z-40 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground backdrop-blur transition-colors hover:bg-foreground/10 hover:text-foreground active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Body */}
        <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>

        {/* Home indicator */}
        <div className="flex h-4 shrink-0 items-center justify-center">
          <div className="h-1 w-32 rounded-full bg-foreground/25" />
        </div>
      </div>
    </div>
  )
}

function SignalIcon() {
  return (
    <span className="flex items-center gap-1.5">
      {/* lucide icons kept inline to avoid extra import churn */}
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 20V4" />
      </svg>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 20 0M12 20h.01" />
      </svg>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="7" width="16" height="10" rx="2" /><line x1="22" y1="11" x2="22" y2="13" /><rect x="4" y="9" width="11" height="6" rx="1" fill="currentColor" stroke="none" />
      </svg>
    </span>
  )
}
