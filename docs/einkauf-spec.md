# SPEC & AGENT-AUFTRAG — Einkaufs-Modul (Einkaufsentscheidungs-Assistent), klickbarer Demo-Prototyp

> **Single Source of Truth.** Die Akzeptanzkriterien-Checkliste (Abschnitt 5) wird hier gepflegt. Status pro Kriterium dort abhaken (`- [x]`) und mit Einzeiler-Notiz versehen.

---

## Current State (Gap-Analyse, Stand 2026-06-25)

Es existiert bereits ein substanzielles Einkaufs-Modul. Diese Spec wird **additiv** umgesetzt — bestehende Strukturen erweitern, **kein Rewrite**.

**Bestehende Struktur (Ist-Stand):**

- **Route:** `app/(dashboard)/einkauf/page.tsx` — 1315-Zeilen-Orchestrator, Single-URL-Wizard mit 4 Eingabemodi (VIN / HSN-TSN / Manuell / **Paket**) und Step-Maschine `identify → vehicle_confirm → computing → results`. Gesamter State in lokalem `useState` (kein zustand).
- **Paket-Flow:** `_components/PaketIdentify.tsx` (Texteingabe/Voice/Fake-Screenshot-OCR), `PaketConfirm.tsx` (editierbare Fahrzeugliste), `PaketResult.tsx` (Aggregat + Drill-down + „Lohnt sich das Paket?"-Rechner).
- **Einzelfahrzeug:** `_components/SingleVehicleResult.tsx` (Hero-EK-Karte, 3 Quellenkarten, recharts-**Balken**chart, Detail-Tabellen). `RoutingBanner.tsx` (Kanal Endkunde/Auktion). `ListenplatzRechner.tsx` (mobile.de-Listenplatz + Abpreisungsstrategie).
- **Zentrale Mockdaten:** `lib/mock-data-einkauf.ts` (`EinkaufPricingResult` = Master-Shape pro Fahrzeug; `evaluateChannel`), `lib/mock-data-paket.ts` (`makeQuickDetail`, `buildPackageTotals`, `evaluatePackageBundle`, 4 Demo-GLC), `lib/listenplatz-einkauf.ts` (Listenplatz-Pool + `marginOf`/`marginPctOf`).
- **Konventionen (siehe Memory `einkauf-feature-conventions`):** Marge-% immer auf **VK** (`margin/salePrice`); Kanal-Typ `'endkunde' | 'auktion'`; emerald=positiv/Endkunde, slate=Auktion, amber=Warnung/Override, rot=Verlust.

**Höchste Hebel-Stelle:** Neue optionale Felder **einmal** an `EinkaufPricingResult` (mock-data-einkauf.ts) hängen und in `makeQuickDetail()` (mock-data-paket.ts) default-befüllen → Einzel- und Paketfahrzeuge erben sie. Jedes neue Feld optional + Fallback, damit der Build grün bleibt (Q1).

### Gap-Tabelle

| Krit. | Status (Ist) | Additive Umsetzung (Plan) |
|---|---|---|
| A1 | teilweise | Transcript wird verworfen (immer 4 Fixe). `parsePaketTranscript()` in mock-data-paket.ts; in `handleResolvePaket` einlesen, Fallback = Demo. |
| A2 | teilweise | Fake-Upload füllt Textarea, aber kein „aus Paket identifiziert"-Label. `origin`-Feld + Badge. |
| A3 | teilweise | Count vorhanden, aber Fix=4. Count aus tatsächlicher N (via A1); Paket-Header-Anzahl. |
| A4 | teilweise | `SingleVehicleResult` zeigt keine Stammdaten. Optionaler `vehicle`-Prop + kompakte Stammdaten-Karte; EZ in PaketConfirm. |
| B1 | fehlt | `region`-Block + Radius-Control (50/100 km) + `regionalMarket()`-Helper; Default-Standort Nagold. |
| B2 | teilweise | `regionalMobile`-Subblock (Ø/Range, Anzahl in Region, Ø Standtage), aus mobileDe abgeleitet. |
| B3 | fehlt | `KbaDemand`-Feld (Besitzumschreibungen 8 Wo. + Trend + %) + UI mit Trendpfeil, gelabelt „Nachfrage-Indikator". |
| B4 | fehlt | `DATA_WINDOW_LABEL = 'Letzte 8 Wochen'` first-class; DAT/historisch visuell ausgrauen + „Referenz, nicht tagesaktuell". |
| C1 | teilweise | `recommendedEk(regionalVk, targetMarginPct)` + `DEFAULT_TARGET_MARGIN_PCT=9`; Zielmarge-Control in page.tsx. |
| C2 | teilweise | Marge €/% aus targetMargin ableiten; bestehende `pct()`-Logik wiederverwenden. |
| D1 | fehlt | `trend: TrendPoint[]` (8 Wo.) + `Area/AreaChart` in recharts-Import; grün ↑ / rot ↓. |
| D2 | fehlt | `trendChangePercent` + `computeTrendSignal({standtage, regionalPrice, besitzumschreibungen})`. |
| E1 | fehlt | `recommendation: 'kaufen'|'pruefen'|'ablehnen'` + Ampel-Badge (emerald/amber/rot). |
| E2 | fehlt | `reasoningType: 'preis_marge'|'verkaufsgeschwindigkeit'` + Badge. |
| E3 | fehlt | `PackageRole 'treiber'|'mitnahme'` + `classifyDriver()`; visuelle Unterscheidung in PaketResult. |
| F1 | **existiert** | `totals.ekRecommendation` (Hero) + per-Fahrzeug `sweetSpot` (Tabelle). |
| F2 | **existiert** | `totals.expectedMarginTotal` + `expectedMarginPercent`; Bundle-Rechner. |
| F3 | teilweise | `roleSplit {treiber, mitnahme}` + „X Treiber tragen Y Mitnahme"-Zeile + Verdict als Netto-Empfehlung. |
| G1 | fehlt | `VehicleType 'pkw'|'transporter'` + Header-Toggle (Segment-Pattern wiederverwenden). |
| G2 | fehlt | Transporter-Mock (`mock-data-einkauf-transporter.ts`) mit `seasonalTrend {summer, winter}`. |
| G3 | fehlt | `equipmentCoverage[]` (Feature, Anzahl in Region, Rarität „einzigartig/selten/verbreitet"). |
| G4 | fehlt | `vorratskauf`-Flag; Standtage im Transporter-Modus nicht negativ werten. |
| G5 | fehlt | `DealerBuyingSignal[]` Panel „was andere Mercedes-Händler EINKAUFEN" (nur Beobachtung). |
| H1 | fehlt | `kiSummary`-Feld + „KI-Empfehlung"-Karte; `// TODO[real-backend]: KI`. |
| H2 | fehlt | `buildPackageVerdictText()` + Paket-KI-Karte; `// TODO[real-backend]: KI`. |
| Q1 | laufend | Build/Lint nach jeder Änderung grün. |
| Q2 | **existiert** | Mockdaten zentral; Muster beibehalten. |
| Q3 | fehlt | `// TODO[real-backend]: …` an allen Backend-Nahtstellen. |
| Q4 | **existiert** | de-UI / en-Code beibehalten. |
| Q5 | **existiert** | Nur @/components/ui + lucide; Palette beibehalten. |

---

## 0. Auftrag

Kein neues Produkt von Grund auf. Bestehenden Einkaufs-Code erkennen, Differenz zu Abschnitt 5 ermitteln, fehlende Anforderungen **additiv** einbauen. Ergebnis = klickbarer Demo-Prototyp für zwei Pilot-Nutzer (Einkaufsleiter + neuer Mitarbeiter, Mercedes-Autohaus). Es muss aussehen, als ob das Backend funktioniert — echte Funktionalität ist nicht gefordert.

## 1. Arbeitsprotokoll — DIE LOOP

- **Phase 0** Orientierung: Stack/Repo-Struktur, bestehenden Einkaufs-Teil lokalisieren, Gap-Tabelle. Kein Rewrite. ✅ (siehe Current State)
- **Phase 1** Spec ins Repo (diese Datei), Checkliste als SSOT pflegen. ✅
- **Phase 2** Implementierungs-Loop: oberstes offenes Kriterium → relevanten Code finden → minimal additiv implementieren (nur zentrale Mockdaten) → verifizieren (Build grün, Route rendert, Interaktion klickbar, nichts gebrochen) → abhaken + Notiz + atomarer Commit.
- **Phase 3** End-to-End-Klick-Durchlauf + Abschlussbericht (Abschnitt 7).

**Loop-Regeln:** Ein Kriterium nach dem anderen. Nie weiter bei rotem Build. Keine Gold-Plating — einfachste klickbare Umsetzung gewinnt. Bei Unklarheit plausible Demo-Entscheidung treffen und notieren.

## 2. Produkt-Kontext

- Fahrzeuge meist in **Paketen** („Züge", je 8) über Mercedes-Plattform („Drehscheibe") — selten einzeln (oft 8 oder 16 auf einmal).
- Paketkauf = **Arbitrage**: 3–4 schwächere Fahrzeuge in Kauf nehmen, um an die 7–8 starken zu kommen. Tool muss diese Abwägung sichtbar machen.
- Einkaufsentscheidung ist **regional & hochaktuell**: maßgeblich Marktdaten der **letzten ~8 Wochen** im Standort-Umkreis (50–100 km). Ältere/träge Quellen (DAT, historische VK) nachrangig.
- Guter EK wird **rückwärts** aus regionalem Marktpreis gerechnet (Zielmarge ~8–10 %).
- **PKW (~80 %)** = Paket-/Margenlogik. **Transporter (~20 %)** = nachfragegetriebene Nischenlogik (Saison, Ausstattung, Vorratskauf, Auktions-Beobachtung).

## 3. Globale Constraints (Demo / Dummy)

- Alles Mock (kein echtes Scraping/KBA/DAT/OCR/Auktion/KI). Nur suggerieren.
- Auf Bestehendem aufbauen; keine neue UI-Lib.
- UI-Texte Deutsch; Code-Identifier/Kommentare Englisch (Repo-Konvention).
- Nichts Bestehendes kaputt machen.
- Nahtstellen mit `// TODO[real-backend]: <Quelle>` markieren (mobile.de, KBA, DAT, OCR, Auktionen, KI).

## 4. Mock-Datenmodell

Alle Mock-Daten zentral (`lib/mock-data-einkauf*.ts`, `lib/mock-data-paket.ts`, `lib/listenplatz-einkauf.ts`), getrennt von UI, 1:1 gegen echte Quellen tauschbar. Realistisch: echte Mercedes-Modelle, deutsche PLZ/Region (Demo-Standort Nagold), plausible Preise/Standtage/KBA-Zahlen.

Pro **Fahrzeug** (Felder auf `EinkaufPricingResult` / `EinkaufVehicleData`): VIN, Marke/Modell/Variante, EZ/Baujahr, km, Ausstattung, `vehicleType` (pkw|transporter); regionaler mobile-Preis (Ø+Range), Anzahl Modell in Region, Ø Standtage; KBA-Besitzumschreibungen (8 Wo.) + Trend + %; DAT-Wert + historischer VK (nachrangig); empfohlener EK, erwartete Marge (€/%), Empfehlung (kaufen/nicht), Begründungstyp (preis_marge|geschwindigkeit), Rolle (treiber|mitnahme); Trend-Serie; KI-Text.

**KBA-/Nachfrage-Signale (Erweiterung 1):**
- `regionalerBestand` — zugelassene Fahrzeuge dieses Modells in der Region (KBA, Stichtag) [Mock]
- `umschlagsrate` — = Besitzumschreibungen ÷ `regionalerBestand` [abgeleitet]
- `segment`, `kraftstoffart` (`diesel` | `benzin` | `hybrid` | `bev`)
- `segmentTrend` — Trend des Segments/der Kraftstoffart (z. B. „Diesel −12 % / Hybrid +18 % im Quartal") [Mock]
- `neuzulassungsTrend` *(optional)* — Neuzulassungs-Trend des Modells [Mock]

Pro **Paket** („Zug"): Fahrzeugliste, Anzahl, Gesamt-EK, Gesamt-Marge, Gesamt-Gewinn/-Verlust, Treiber vs. Mitnahme, Netto-Empfehlung, KI-Gesamteinschätzung.

### 4.1 Empfehlungs-Logik (Kopplung der Signale)

Die Kauf-/Nicht-Kauf-Empfehlung (E1) und ihr Begründungstyp (E2) sowie das Trend-Signal (D2) speisen sich **nachvollziehbar** aus den Mock-Signalen — nicht als isolierte Deko:
- Hohe **Umschlagsrate** (B5) → Tendenz „dreht schnell" → Begründungstyp `verkaufsgeschwindigkeit`, stärkt „kaufen".
- Unterangebot/gute Marge + Übernachfrage → Begründungstyp `preis_marge`.
- Negativer **Segment-/Kraftstoff-Trend** (B6) → sichtbares **Vorsicht-Flag** an der Empfehlung, selbst wenn die Einzelwerte gut aussehen.
- **Neuzulassungs-Schwemme** (B7) → künftiger Preisdruck → Warnhinweis (v. a. Transporter/Vorratskauf).

**Backend-Naht KBA:** modellscharfe, regionale 8-Wochen-Granularität liefert das KBA roh vermutlich nicht (offizielle Reihen meist monatlich, Marken-/Segmentebene). Real kommt diese Sicht wahrscheinlich über einen **Marktdaten-Anbieter, der KBA-Daten anreichert** → Codestellen mit `// TODO[real-backend]: KBA-Signale via Marktdaten-Anbieter (nicht roh vom KBA)` markieren.

## 5. Akzeptanzkriterien — Checkliste (SSOT)

### Epic A — Paket-Eingabe & Fahrzeug-Identifikation
- [x] **A1** Eingabemaske akzeptiert 1–16 VINs (mehrzeilig/komma-separiert); Submit erzeugt pro VIN eine Fahrzeugkarte aus Mock-Daten. — *`parsePaketTranscript()` in mock-data-paket.ts (Modell/EZ/km/Ausstattung aus Freitext, VK rückwärts, Kanal nach Alter/km); `handleResolvePaket` liest Transcript ein, Fallback = Demo. Cap 16.*
- [x] **A2** Alternativer Eingabeweg „Paket-Screenshot hochladen": Datei-Upload; nach (Mock-)Verarbeitung Liste von N identifizierten Fahrzeugen (gemocktes OCR), gelabelt „aus Paket identifiziert". — *Echtes `<input type=file>` in PaketIdentify; `origin`-Feld → Badge „aus Paket identifiziert" / „aus Paket-Screenshot (OCR)" in PaketConfirm.*
- [x] **A3** Eingegebene Fahrzeuge als „Zug/Paket" gruppiert; Paket-Header zeigt Anzahl (z. B. 8 oder 16). — *Demo-Zug = 8 Fahrzeuge; PaketConfirm-Header „Zug / Paket — N Fahrzeuge" + Badge „N im Paket"; PaketResult zeigt `vehicles.length`.*
- [x] **A4** Jede Fahrzeugkarte zeigt Stammdaten (Marke/Modell/Variante, EZ, km, Ausstattungs-Highlights). — *PaketConfirm-Zeile zeigt jetzt EZ + Kraftstoff (Modell/km/Ausstattung waren bereits da); Drill-down-Header zeigt EZ/km/Ausstattung.*

### Epic B — Regionale Marktanalyse pro Fahrzeug
- [x] **B1** Standort + einstellbarer Radius (50/100 km), Default Demo-Standort; Radius-Änderung aktualisiert sichtbar die Mock-Marktdaten. — *Radius-Umschalter (50/100 km) in SingleVehicleResult; `regionalMarketFor()` skaliert Anzahl/Ø-Preis/Standtage sichtbar; Default-Standort Nagold.*
- [x] **B2** Pro Fahrzeug regionale mobile.de-Marktdaten (Mock): Ø/Range Angebotspreis, Anzahl gleicher Modelle in Region, Ø Standtage. — *Regional-Karte mit Ø Angebotspreis, Preis-Range, Anzahl im Umkreis, Ø Standtage; `RegionalMarket`-Feld.*
- [x] **B3** KBA-Besitzumschreibungen des Modells in der Region, letzte 8 Wochen, als Zahl + Trendpfeil (↑/↓), klar als **Nachfrage-Indikator** gelabelt. — *`KbaDemand` mit Umschreibungszahl + `TrendArrow`; gelabelt „Nachfrage-Indikator (KBA · Besitzumschreibungen)".*
- [x] **B4** Datenfenster „letzte 8 Wochen / 1–2 Monate" sichtbar erste Klasse (Label/Filter). DAT-Wert + historischer VK gezeigt, aber **visuell nachrangig** (ausgegraut / „Referenz, nicht tagesaktuell"), nie als Primäranker. — *Regional-Karte trägt „Letzte 8 Wochen"-Badge; DAT- & Historisch-Karten `opacity-80` + Caption „Referenz, nicht tagesaktuell".*

### Epic C — Preis-/Margenlogik pro Fahrzeug
- [x] **C1** Empfohlener EK = regionaler mobile-VK − Zielmarge; Zielmarge einstellbar, Default 8–10 %. — *`recommendedEk(regionalVk, targetMarginPct)` + `DEFAULT_TARGET_MARGIN_PCT=9`; Zielmarge-Slider (5–15 %) in „Preis- & Margenkalkulation"; Ziel-EK rückwärts aus regionalem VK.*
- [x] **C2** Erwartete Marge (€ und %) pro Fahrzeug; passt sich an bei Änderung von Zielmarge/Mock-Marktpreis. — *Erwartete Marge €/% reagiert live auf Zielmarge-Slider UND Radius (regionaler VK ändert sich mit dem Umkreis).*

### Epic D — Trendanzeige (Trade-Republic-Stil) pro Fahrzeug
- [x] **D1** Pro Fahrzeug minimalistischer Chart im Trade-Republic-Stil (Linie/Fläche, grün bei ↑ / rot bei ↓) für den Mock-Verlauf. — *recharts `AreaChart` (achsenlos, Gradient-Fill), Farbe grün/rot/neutral nach `trend.direction`.*
- [x] **D2** Chart zeigt Trendrichtung + %-Veränderung über das Datenfenster; Mock-Signal kombiniert Standtage, Regionalpreis und Besitzumschreibungen. — *`computeTrendSignal()` blendet KBA-Trend + Umschlagsrate + Standtage; `TrendArrow` zeigt Richtung+% , Caption listet die Signaltreiber.*

### Epic E — Kauf/Nicht-Kauf-Empfehlung pro Fahrzeug
- [x] **E1** Pro Fahrzeug klare Kaufen/Nicht-kaufen-Empfehlung (Badge/Ampel) aus Mock-Logik. — *`buildRecommendation()` → `BuyDecision`; Ampel-Badge (kaufen/prüfen/nicht kaufen) im Hero via `buyRecommendationConfig`. §4.1: Segment-Caution stuft „kaufen"→„prüfen" ab.*
- [x] **E2** Begründungstyp sichtbar: „Preis/Marge" oder „Verkaufsgeschwindigkeit". — *`reasoningType` aus Umschlagsrate/Marktposition; Badge + Begründungstext im Hero.*
- [x] **E3** Treiber-Fahrzeuge vs. schwächere „Mitnahme"-Fahrzeuge visuell unterscheidbar markiert. — *`classifyRole()` + `packageRole`; Badge im Hero (Drill-down) und in jeder PaketResult-Tabellenzeile (emerald=Treiber / slate=Mitnahme).*

### Epic F — Paket-/Zug-Bewertung (Aggregat)
- [x] **F1** Paket-Ansicht zeigt empfohlenen **Gesamt-EK** zusätzlich zum EK pro Fahrzeug. — *Ist bereits vorhanden (`PaketResult` Hero `totals.ekRecommendation` + Σ-Footer).*
- [x] **F2** Erwartete **Gesamt-Marge** + **Gesamt-Gewinn/-Verlust** dargestellt. — *Ist bereits vorhanden (`totals.expectedMarginTotal`/`%` + Bundle-Rechner).*
- [x] **F3** **Arbitrage-Sicht**: starke + schwache Fahrzeuge gemeinsam gekauft sichtbar („X Treiber, Y Mitnahme") inkl. Netto-Empfehlung. — *`roleSplit` in den Totals; Hero-Badge „X Treiber · Y Mitnahme"; Arbitrage-Banner im Bundle-Rechner „X Treiber tragen Y Mitnahme-Fahrzeuge" + Netto-Verdict (reagiert auf Paketpreis).*

### Epic G — Transporter-Modus (~20 %)
- [x] **G1** Umschalter PKW ⇄ Transporter; im Transporter-Modus abweichende Mock-Logik/Darstellung. — *Header-Toggle (`vehicleType`); paralleler Mock `mock-data-einkauf-transporter.ts` (Sprinter 317 CDI Kühlkoffer); VIN-Demo-Pill + Ergebnis-Panels schalten um; Listenplatz-Rechner (GLC-spezifisch) im Transporter-Modus ausgeblendet.*
- [x] **G2** Saisonale Trend-Darstellung (Sommer/Winter) pro Region für Transporter. — *`SeasonalTrend` (12-Monats-`BarChart`, Sommer-Balken hervorgehoben) + Sommer-/Winter-Index + Note.*
- [x] **G3** Nischen-/Ausstattungsabdeckung (z. B. Kühlbox): wie viele vergleichbare in der Region (Mock) + ob man „einer von wenigen/einziger" wäre. — *`EquipmentCoverage[]` Karte: Feature + „N× in Region" + Rarität-Badge (einzigartig/selten/verbreitet).*
- [x] **G4** Längere Standtage im Transporter-Modus nicht negativ gewertet; **Vorratskauf** als Option dargestellt. — *`vorratskauf`-Karte (empfohlen-Badge + antizyklische Note) + expliziter Hinweis „lange Standzeit wird nicht negativ gewertet".*
- [x] **G5** Auktions-Insights für Transporter: Panel mit Mock-Signal „was andere Mercedes-Händler aktuell EINKAUFEN" (Nachfrage-Frühindikator); nur Beobachtung, kein Bieten. — *`DealerBuyingSignal[]` Panel mit Händler-Anzahl + Trendpfeil + „nur Beobachtung, kein automatisches Bieten".*

### Epic H — KI-Schicht
- [x] **H1** Pro Fahrzeug „KI-Empfehlung"-Bereich mit Mock-Begründungstext (Trends + sekundär historische Zahlen), begründet die Kaufempfehlung. — *`buildKiSummary()` (Trend + KBA-Nachfrage primär, Historie nachrangig); „KI-Empfehlung"-Karte in SingleVehicleResult. Kuratiierte Texte für Hero/Auktion/Transporter. `// TODO[real-backend]: KI`.*
- [x] **H2** Auf Paketebene KI-Gesamteinschätzung („Paket lohnt/lohnt nicht, weil …", Mock); Codestelle mit `// TODO[real-backend]: KI` markiert. — *`buildPackageVerdictText()` (reagiert auf Paketpreis, nutzt roleSplit + Verdict); „KI-Gesamteinschätzung"-Karte in PaketResult. `// TODO[real-backend]: KI`.*

### Querschnitt — Qualität
- [ ] **Q1** Build/Dev-Server nach jeder Änderung fehlerfrei; nichts Bestehendes bricht.
- [x] **Q2** Alle Mock-Daten zentral, realistisch, leicht austauschbar. — *Ist bereits gegeben; Muster beibehalten.*
- [x] **Q3** Alle künftigen Backend-Nahtstellen mit `// TODO[real-backend]: …` markiert. — *21 Marker: mobile.de (Umkreissuche), KBA (Marktdaten-Anbieter), DAT/Schwacke, OCR (Paket-Screenshot), VIN-/HSN-Decode, Auktionen (B2B + Händler-Einkaufssignale), KI (pro Fahrzeug + Paket + Scoring).*
- [x] **Q4** UI-Texte Deutsch; Code in Repo-Konvention. — *Ist bereits gegeben; beibehalten.*
- [x] **Q5** Bestehende Design-Sprache/Komponenten wiederverwendet; keine fremde UI-Lib. — *Ist bereits gegeben; beibehalten.*

### Erweiterung 1 — KBA-/Nachfrage-Signale (Amendment, koppelt an 4.1)
- [x] **B5** Pro Fahrzeug **Umschlagsrate** (Besitzumschreibungen ÷ regionaler Bestand) als **hervorgehobene** Nachfragekennzahl. Verfeinert B3: rohe Umschreibungszahl bleibt sichtbar, aber **sekundär**. Rate fließt nachvollziehbar in die Empfehlungs-Logik (4.1) ein (hohe Rate → „dreht schnell"). — *`umschlagsrate` als 3xl-Zahl + Label „Dreht schnell/Mittel/Träge"; rohe Umschreibungen ÷ Bestand als kleine Caption. Speist E1/E2 (folgt).*
- [x] **B6** Über dem Einzelfahrzeug ein **Makro-Badge** mit Segment-/Kraftstoffart-Trend (z. B. „Diesel −12 % / Hybrid +18 %", Mock). Gute Einzelwerte + negativer Segment-/Kraftstoff-Trend → sichtbares **Vorsicht-Flag** an der Empfehlung (Kopplung 4.1). — *`SegmentSignal` Makro-Badge über dem Hero; Diesel → `caution` → amber Vorsicht-Flag „Empfehlung kritisch prüfen".*
- [x] **B7** *(optional — v. a. Transporter & Vorratskauf)* **Neuzulassungs-Frühindikator**: heutige Neuzulassungs-Schwemme → künftiges Gebrauchtangebot/Preisdruck als Warnhinweis. Für PKW-Schnelldreher ausblendbar/nachrangig. — *Im Transporter-Modus amber Warnhinweis „Neuzulassungs-Frühindikator" (eSprinter +19 % → künftiger Preisdruck) aus `segmentSignal.neuzulassungsHinweis`; bei PKW-Schnelldrehern nicht gesetzt → nachrangig/ausgeblendet.*

## 6. Definition of Done
- Alle Boxen in Abschnitt 5 abgehakt + Notiz.
- Durchgehender klickbarer Flow: Eingabe (VINs/Screenshot) → Paket → pro-Fahrzeug-Analyse (Markt, KBA, Trend, EK, Empfehlung) → Paket-Bewertung → Transporter-Modus → KI-Einschätzung.
- Build grün, keine Regression.
- Mock-Daten zentral & glaubwürdig; alle Nahtstellen markiert.

## 7. Abschlussbericht (am Ende)
1. Current State vs. Umgesetzt. 2. Geänderte/neue Dateien (je 1 Satz). 3. Gemockte Nahtstellen (je Fundort `TODO[real-backend]`). 4. Bekannte Lücken / Demo-Vereinfachungen.
