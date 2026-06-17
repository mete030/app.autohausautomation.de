// ─────────────────────────────────────────────────────────────────────────────
// mobile.de Listenplatz-Modell für den Einkauf-Tab (Feature 1).
//
// Reines, abhängigkeitsfreies Modell + Helper. Alle Zahlen sind Dummy-Data,
// aber intern kohärent: der bundesweite Vergleichspool (~142 GLC 300 4MATIC) ist
// auf die 7 echten mobile.de-Vergleichsangebote aus mock-data-einkauf kalibriert.
// Sortierung = "Preis aufsteigend" (mobile.de-Default). Marge wird — wie im
// Rest der App — auf den Verkaufspreis bezogen (Marge / VK).
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SWEET_SPOT = 43200 // empfohlener EK des Demo-GLC
export const PAGE_SIZE = 20 // mobile.de: 20 Inserate pro Seite

export interface ListenplatzModel {
  poolSize: number
  pageSize: number
  sortLabel: string
  filterLabel: string
  prices: number[] // aufsteigend sortierte Listenpreise (€)
  realComparableRanks: { id: string; price: number; rank: number }[]
}

export interface Slot {
  rank: number
  seite: number
  platz: number
  beyond: boolean // teurer als alle Angebote im Pool
}

export interface PriceRange {
  min: number
  max: number | null // null => "teurer als alle"
  beyond: boolean
}

export interface LadderRung {
  price: number
  label: string
  seite: number
  platz: number
  rank: number
  margin: number
  marginPct: number
}

export interface RepricingStep {
  day: number
  trigger: string
  title: string
  price: number
  seite: number
  platz: number
  margin: number
  marginPct: number
}

export interface RepricingStrategy {
  title: string
  expectedSaleDay: number
  steps: RepricingStep[]
}

export interface RepricingRule {
  active: boolean
  deltaEuro: number // z.B. 50
  refSeite: number // z.B. 1
  refPlatz: number // z.B. 3
  reevalDays: number // z.B. 30
}

// ─── Pool-Generator ──────────────────────────────────────────────────────────
// Stückweise-lineare Interpolation zwischen (Rang, Preis)-Ankern. Die 7 echten
// Vergleichsangebote sitzen exakt auf ihren Ankerrängen, sodass slotForPrice()
// für sie die dokumentierten Plätze liefert. 52.400 € landet auf Rang 51
// (Seite 3 · Platz 11) ≈ Perzentil 35 → konsistent mit "Unter Markt".

const ANCHORS: [number, number][] = [
  [1, 44900],
  [4, 46900], // mde-4
  [17, 48500], // mde-2
  [41, 51200], // mde-7
  [51, 52400], // mde-5 (= mobile.de Median)
  [78, 53900], // mde-1
  [101, 55200], // mde-3 (≈)
  [124, 57800], // mde-6
  [142, 61800],
]

function buildGlcPricePool(): number[] {
  const prices: number[] = []
  for (let seg = 0; seg < ANCHORS.length - 1; seg++) {
    const [r0, p0] = ANCHORS[seg]
    const [r1, p1] = ANCHORS[seg + 1]
    for (let r = r0; r < r1; r++) {
      const t = (r - r0) / (r1 - r0)
      prices[r - 1] = Math.round(p0 + (p1 - p0) * t)
    }
  }
  const [lastRank, lastPrice] = ANCHORS[ANCHORS.length - 1]
  prices[lastRank - 1] = lastPrice
  // Strikt monoton steigend erzwingen (keine Duplikate → eindeutige Ränge).
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] <= prices[i - 1]) prices[i] = prices[i - 1] + 1
  }
  return prices
}

const GLC_POOL = buildGlcPricePool()

export const GLC_COMPARABLE_PRICES = [46900, 48500, 51200, 52400, 53900, 55200, 57800]

// ─── Reine Helper ──────────────────────────────────────────────────────────

export function slotForPrice(price: number, m: ListenplatzModel = GLC_LISTENPLATZ): Slot {
  const below = m.prices.filter((p) => p < price).length
  const rank = below + 1
  const beyond = rank > m.prices.length
  const seite = Math.ceil(rank / m.pageSize)
  const platz = ((rank - 1) % m.pageSize) + 1
  return { rank, seite, platz, beyond }
}

export function rankForSlot(seite: number, platz: number, pageSize: number = PAGE_SIZE): number {
  return (seite - 1) * pageSize + platz
}

export function priceRangeForSlot(
  seite: number,
  platz: number,
  m: ListenplatzModel = GLC_LISTENPLATZ,
): PriceRange {
  const rank = rankForSlot(seite, platz, m.pageSize)
  const n = m.prices.length
  if (rank <= 1) {
    // Günstiger als / gleich dem günstigsten Angebot → Platz 1.
    return { min: m.prices[0], max: m.prices[0], beyond: false }
  }
  if (rank > n) {
    // Teurer als alle Angebote im Pool.
    return { min: m.prices[n - 1] + 1, max: null, beyond: true }
  }
  // Rang R: genau R-1 Angebote günstiger → Preis in (prices[R-2], prices[R-1]].
  return { min: m.prices[rank - 2] + 1, max: m.prices[rank - 1], beyond: false }
}

export function priceForRank(rank: number, m: ListenplatzModel = GLC_LISTENPLATZ): number {
  const clamped = Math.max(1, Math.min(rank, m.prices.length))
  return m.prices[clamped - 1]
}

export function marginOf(price: number, sweetSpot: number = DEFAULT_SWEET_SPOT): number {
  return price - sweetSpot
}

/** Marge in Prozent — auf den Verkaufspreis bezogen (App-Konvention). */
export function marginPctOf(price: number, sweetSpot: number = DEFAULT_SWEET_SPOT): number {
  if (!price) return 0
  return (marginOf(price, sweetSpot) / price) * 100
}

// ─── Modell-Metadaten ─────────────────────────────────────────────────────

export const GLC_LISTENPLATZ: ListenplatzModel = {
  poolSize: GLC_POOL.length,
  pageSize: PAGE_SIZE,
  sortLabel: 'Preis aufsteigend',
  filterLabel: 'GLC 300 4MATIC · EZ 2022–2024 · 15.000–55.000 km · bundesweit',
  prices: GLC_POOL,
  realComparableRanks: GLC_COMPARABLE_PRICES.map((price, i) => ({
    id: `mde-real-${i + 1}`,
    price,
    rank: GLC_POOL.filter((p) => p < price).length + 1,
  })),
}

// ─── Staffelung (Leiter) — Slots/Margen zur Laufzeit abgeleitet (kein Drift) ──

function makeRung(price: number, label: string, sweetSpot = DEFAULT_SWEET_SPOT): LadderRung {
  const s = slotForPrice(price)
  return {
    price,
    label,
    seite: s.seite,
    platz: s.platz,
    rank: s.rank,
    margin: marginOf(price, sweetSpot),
    marginPct: marginPctOf(price, sweetSpot),
  }
}

export const GLC_LADDER: LadderRung[] = [
  makeRung(47500, 'Aggressiv'),
  makeRung(48800, 'Seite-1-Grenze'),
  makeRung(50700, 'Sichtbarkeits-Push'),
  makeRung(51600, 'DAT-Marktwert'),
  makeRung(52400, 'mobile.de Median'),
  makeRung(53900, 'Premium'),
]

// ─── KI-Abpreisungsstrategie — Slots/Margen zur Laufzeit abgeleitet ───────────

function makeStep(day: number, title: string, trigger: string, price: number): RepricingStep {
  const s = slotForPrice(price)
  return {
    day,
    trigger,
    title,
    price,
    seite: s.seite,
    platz: s.platz,
    margin: marginOf(price),
    marginPct: marginPctOf(price),
  }
}

export const GLC_REPRICING_STRATEGY: RepricingStrategy = {
  title: 'KI-Abpreisungsstrategie · GLC 300 4MATIC',
  expectedSaleDay: 34, // angelehnt an Ø Standzeit 22,6 Tage
  steps: [
    makeStep(0, 'Premium-Start', 'Sofort inserieren · maximale Marge testen', 53900),
    makeStep(30, 'Markt-Median', '0 Verkauf nach 30 Tagen → auf Median ziehen', 52400),
    makeStep(45, 'Sichtbarkeits-Push', 'Standzeit über Ø → unter Median, Richtung Seite 1', 50700),
  ],
}

export const GLC_DEFAULT_RULE: RepricingRule = {
  active: false,
  deltaEuro: 50,
  refSeite: 1,
  refPlatz: 3,
  reevalDays: 30,
}

/** Live-Auswertung der Automatik-Regel: Referenzpreis am Ziel-Slot − Delta. */
export function evaluateRule(rule: RepricingRule, m: ListenplatzModel = GLC_LISTENPLATZ) {
  const refRank = rankForSlot(rule.refSeite, rule.refPlatz, m.pageSize)
  const refPrice = priceForRank(refRank, m)
  const price = Math.max(0, refPrice - rule.deltaEuro)
  const slot = slotForPrice(price, m)
  return { refPrice, price, slot, margin: marginOf(price), marginPct: marginPctOf(price) }
}
