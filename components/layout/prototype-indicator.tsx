export function PrototypeIndicator() {
  return (
    <>
      {/* Top banner — fixed, full-width */}
      <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-amber-500 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-black select-none sm:text-xs">
        <span className="hidden sm:inline" aria-hidden="true">⚠</span>
        <span>Prototyp · Clickable Dummy · Keine echten Daten oder Funktionen</span>
        <span className="hidden sm:inline" aria-hidden="true">⚠</span>
      </div>

      {/* Diagonal watermark — pointer-events-none, sits over content */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden select-none"
        style={{
          background:
            'repeating-linear-gradient(-35deg, transparent, transparent 180px, rgba(245, 158, 11, 0.04) 180px, rgba(245, 158, 11, 0.04) 182px)',
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            width: '200%',
            height: '200%',
            top: '-50%',
            left: '-50%',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(6, 1fr)',
            transform: 'rotate(-25deg)',
            gap: '40px',
          }}
        >
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="whitespace-nowrap text-center text-xl font-black uppercase tracking-[0.2em] text-amber-500/[0.06] sm:text-2xl"
            >
              PROTOTYP
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
