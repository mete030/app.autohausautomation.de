import { differenceInDays } from 'date-fns'
import type {
  Listing,
  MarketAnalysis,
  MarketComparable,
  PriceCategory,
  PriceRecommendation,
  RecommendationAction,
} from '@/lib/types'

// ─── Deterministischer, seed-basierter Zufall ───────────────────────────────
// Gleicher Seed → gleiches Ergebnis. Damit ist der "tagesaktuelle" Abgleich
// pro Inserat und Tag stabil (kein Flackern bei jedem Render), variiert aber
// von Tag zu Tag und je Radius.

function hashString(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function round(value: number, step: number): number {
  return Math.round(value / step) * step
}

// ─── Preisbewertung (mobile.de-Logik) ───────────────────────────────────────
// Schwellen als Verhältnis Preis/Marktmedian. computePriceCategory und die
// Empfehlungslogik nutzen dieselben Grenzen, damit Empfehlung und Bewertung
// immer konsistent sind.

const TIER_UPPER_BOUND: Record<PriceCategory, number> = {
  sehr_gut: 0.93,
  gut: 0.985,
  zufriedenstellend: 1.03,
  erhoht: 1.1,
  stark_erhoht: 1.3,
}

const NEXT_BETTER_TIER: Record<PriceCategory, PriceCategory | null> = {
  sehr_gut: null,
  gut: 'sehr_gut',
  zufriedenstellend: 'gut',
  erhoht: 'zufriedenstellend',
  stark_erhoht: 'erhoht',
}

// Identisch zu priceCategoryConfig.label (mobile.de-Wording), damit Begründungs-
// Texte und Badges nie auseinanderlaufen.
const CATEGORY_LABEL: Record<PriceCategory, string> = {
  sehr_gut: 'Sehr guter Preis',
  gut: 'Guter Preis',
  zufriedenstellend: 'Fairer Preis',
  erhoht: 'Erhöhter Preis',
  stark_erhoht: 'Hoher Preis',
}

export function computePriceCategory(price: number, median: number): PriceCategory {
  const ratio = price / median
  if (ratio <= TIER_UPPER_BOUND.sehr_gut) return 'sehr_gut'
  if (ratio <= TIER_UPPER_BOUND.gut) return 'gut'
  if (ratio <= TIER_UPPER_BOUND.zufriedenstellend) return 'zufriedenstellend'
  if (ratio <= TIER_UPPER_BOUND.erhoht) return 'erhoht'
  return 'stark_erhoht'
}

// ─── Standorte im Umkreis von Nagold (Wackenhut-Stammsitz) ──────────────────

const ORTE: { stadt: string; distanz: number }[] = [
  { stadt: 'Nagold', distanz: 0 },
  { stadt: 'Calw', distanz: 13 },
  { stadt: 'Horb a.N.', distanz: 18 },
  { stadt: 'Herrenberg', distanz: 20 },
  { stadt: 'Pforzheim', distanz: 24 },
  { stadt: 'Rottenburg', distanz: 28 },
  { stadt: 'Böblingen', distanz: 30 },
  { stadt: 'Tübingen', distanz: 31 },
  { stadt: 'Sindelfingen', distanz: 33 },
  { stadt: 'Freudenstadt', distanz: 38 },
  { stadt: 'Reutlingen', distanz: 42 },
  { stadt: 'Stuttgart', distanz: 46 },
]

const HAENDLER = [
  'Sternauto',
  'Auto Maier',
  'Premium Cars',
  'Privatanbieter',
  'Autohaus Bauer',
  'MB Niederlassung',
  'Autopark Süd',
  'CarWelt',
]

function shortModel(title: string): string {
  return title.split(' - ')[0].trim()
}

function jitterErstzulassung(ez: string, rng: () => number): string {
  const [mm, yyyy] = ez.split('/').map(Number)
  if (!mm || !yyyy) return ez
  const year = yyyy - Math.floor(rng() * 2) // gleiches oder ein Jahr älter
  const month = 1 + Math.floor(rng() * 12)
  return `${String(month).padStart(2, '0')}/${year}`
}

export function categoryLabel(category: PriceCategory): string {
  return CATEGORY_LABEL[category]
}

// ─── Hauptfunktion ──────────────────────────────────────────────────────────

export function getMarketAnalysis(listing: Listing, radiusKm = 50): MarketAnalysis {
  const rng = mulberry32(hashString(`${listing.id}|${todayKey()}|${radiusKm}`))
  const price = listing.price
  const median = listing.marketPrice

  // Preisverteilung, um den Median verankert
  const min = round(median * (0.86 + rng() * 0.03), 100)
  const max = round(median * (1.18 + rng() * 0.06), 100)
  const avg = round((median + (min + max) / 2) / 2, 100)
  const range = Math.max(1, max - min)

  // Anzahl realer Vergleichsinserate — sanft (Wurzel) mit dem Radius skaliert
  // und gedeckelt, damit die Liste vollständig darstellbar bleibt.
  const radiusFactor = Math.sqrt(radiusKm / 50)
  const comparableCount = Math.max(5, Math.min(32, Math.round((10 + rng() * 6) * radiusFactor)))

  const avgStandzeitMarkt = Math.round(46 + rng() * 22)
  const standzeitTage = Math.max(1, differenceInDays(new Date(), new Date(listing.createdAt)))
  const standzeitRatio = standzeitTage / avgStandzeitMarkt
  const standzeitHigh = standzeitRatio >= 1.3

  const deltaZuMedian = price - median
  const belowMedian = price < median
  const priceCategory = computePriceCategory(price, median)

  // ─── EIN konkreter Satz Vergleichsinserate treibt ALLES ─────────────────
  // (Rang, Perzentil, Verteilungs-Strip, Leiter) — keine separat geschätzten
  // Werte mehr, damit sich nichts widersprechen kann.
  const baseKm = listing.dataSheet?.fahrzeugdaten.kilometerstand ?? 40000
  const baseEz = listing.dataSheet?.fahrzeugdaten.erstzulassung ?? '01/2023'
  const comparables: MarketComparable[] = Array.from({ length: comparableCount })
    .map((_, i) => {
      const ort = ORTE[Math.floor(rng() * ORTE.length)]
      const r = (rng() + rng()) / 2 // dreieckverteilt → Häufung um die Mitte
      const cprice = round(min + r * range, 50)
      const km = Math.max(1000, round(baseKm + (rng() - 0.5) * 24000, 500))
      return {
        id: `${listing.id}-cmp-${i}`,
        title: shortModel(listing.title),
        price: cprice,
        kilometerstand: km,
        erstzulassung: jitterErstzulassung(baseEz, rng),
        stadt: ort.stadt,
        // Wettbewerber haben Distanz > 0 (eigener Standort = 0)
        distanzKm: ort.distanz === 0 ? 2 + Math.round(rng() * 7) : ort.distanz,
        standzeitTage: Math.max(3, Math.round(avgStandzeitMarkt + (rng() - 0.5) * 40)),
        haendler: HAENDLER[Math.floor(rng() * HAENDLER.length)],
        deltaZuDir: cprice - price,
      }
    })
    .sort((a, b) => a.price - b.price)

  // Strip-Ticks = exakt die Preise der Vergleichsinserate
  const tickPrices = comparables.map((c) => c.price)
  const cheaperNearby = comparables.filter((c) => c.distanzKm <= 30 && c.price < price).length

  // Position im Markt → echtes Perzentil (Anteil teurerer Vergleichsfahrzeuge)
  const moreExpensiveThanMine = comparables.filter((c) => c.price > price).length
  const guenstigerAlsProzent = comparableCount > 0
    ? Math.round((moreExpensiveThanMine / comparableCount) * 100)
    : 0

  // ─── Empfehlung: an eine echte Schwelle gekoppelt ───────────────────────
  // Der empfohlene Preis ist kein Heuristik-Wert, sondern der Preis, um eine
  // bessere Preisbewertungs-Stufe zu erreichen (mobile.de-Logik). Bei hoher
  // Standzeit wird direkt auf "Sehr guter Preis" gezielt (ein klarer Impuls),
  // sonst auf die nächstbessere Stufe.
  let action: RecommendationAction
  let suggestedPrice: number
  let targetCategory: PriceCategory

  if (priceCategory === 'sehr_gut') {
    action = 'halten'
    suggestedPrice = price
    targetCategory = 'sehr_gut'
  } else {
    const targetTier: PriceCategory = standzeitHigh
      ? 'sehr_gut'
      : NEXT_BETTER_TIER[priceCategory] ?? priceCategory
    // knapp unter die Obergrenze der Zielstufe, damit der Preis sicher in der
    // Stufe landet
    const target = round(median * (TIER_UPPER_BOUND[targetTier] - 0.003), 50)
    const reduction = price - target

    // erst ab spürbarer Reduktion (≥ 0,5 %) wirklich empfehlen
    if (reduction <= price * 0.005 || (priceCategory === 'gut' && !standzeitHigh)) {
      action = 'halten'
      suggestedPrice = price
      targetCategory = priceCategory
    } else {
      suggestedPrice = target
      targetCategory = computePriceCategory(suggestedPrice, median)
      action = reduction > price * 0.02 ? 'senken' : 'leicht_senken'
    }
  }

  const deltaEuro = suggestedPrice - price

  // ─── Platzierung (Sortierung nach Preis, aufsteigend) ───────────────────
  // Aus DEMSELBEN Satz Vergleichsinserate wie Leiter & Perzentil → Hero-Platz,
  // „von N" und sichtbare Leiter-Position sind garantiert identisch.
  const totalListings = comparableCount + 1
  const currentRank = comparables.filter((c) => c.price < price).length + 1
  const projectedRank = comparables.filter((c) => c.price < suggestedPrice).length + 1

  // ─── Begründungen (das „Warum"): belegbare Fakten. Das Ergebnis (Platz +
  // Bewertung) wird im UI visuell gezeigt, nicht hier doppelt als Text. ─────
  const reasons: string[] = []
  if (action === 'halten') {
    reasons.push(`Bereits Bewertung „${CATEGORY_LABEL[priceCategory]}"`)
    if (belowMedian) reasons.push(`Günstiger als ${guenstigerAlsProzent} % der Vergleichsfahrzeuge`)
    else reasons.push('Kein akuter Abpreisungsdruck')
  } else {
    if (standzeitHigh) {
      reasons.push(
        `Standzeit ${standzeitRatio.toFixed(1).replace('.', ',')}× über Marktschnitt (${standzeitTage} statt Ø ${avgStandzeitMarkt} Tage)`,
      )
    }
    if (cheaperNearby > 0) reasons.push(`${cheaperNearby} günstigere Wettbewerber < 30 km`)
    if (price > median) reasons.push(`Aktuell ${Math.round((price / median - 1) * 100)} % über Marktmedian`)
    if (reasons.length === 0) reasons.push('Bessere Platzierung & Bewertung erreichbar')
  }

  const recommendation: PriceRecommendation = {
    action,
    suggestedPrice,
    deltaEuro,
    reasons,
    targetCategory,
  }

  const minute = Math.floor(rng() * 55)
  const aktualisiertUm = `06:${String(minute).padStart(2, '0')}`

  return {
    standort: 'Nagold',
    radiusKm,
    comparableCount,
    priceMin: min,
    priceMedian: median,
    priceMax: max,
    priceAvg: avg,
    guenstigerAlsProzent,
    standzeitTage,
    avgStandzeitMarkt,
    priceCategory,
    deltaZuMedian,
    totalListings,
    currentRank,
    projectedRank,
    recommendation,
    comparables,
    tickPrices,
    aktualisiertUm,
  }
}

// Leichtgewichtiges Signal für die Listenansicht.
export function getMarketSignal(listing: Listing): {
  action: RecommendationAction
  abpreisung: boolean
  deltaEuro: number
} {
  const { recommendation } = getMarketAnalysis(listing)
  return {
    action: recommendation.action,
    abpreisung: recommendation.action !== 'halten',
    deltaEuro: recommendation.deltaEuro,
  }
}
