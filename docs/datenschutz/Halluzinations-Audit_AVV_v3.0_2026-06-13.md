# Halluzinations-Audit — AVV v3.0

**Geprüftes Dokument:** `AVV_AutohausAutomation_Wackenhut_v3.0_2026-06-12.docx`
**Datum des Audits:** 13.06.2026
**Prüfumfang:** Jede Rechtsnorm (DSGVO/BDSG), jeder EU-Rechtsakt, jeder SCC-/DPF-Begriff, jeder interne Querverweis (§/Anlage), jeder definierte Rechtsbegriff.
**Methode:** Deterministischer Regex-Vollscan aller Fundstellen → 5 unabhängige Fach-Prüfer (web-gestützt gegen dejure.org, gesetze-im-internet.de, eur-lex) → adversariale Gegenprüfung jeder Beanstandung durch separate Skeptiker. 62 Fundstellen geprüft.
**Hinweis:** Es wurde **nichts am AVV-Dokument geändert** — dies ist ein reiner Befundbericht.

---

## Gesamturteil

**Keine Halluzinationen.** Kein erfundener DSGVO-Artikel, keine falsche Artikel-/Absatz-/Buchstaben-Zuordnung, keine falsche EU-Rechtsakt-Nummer, kein falsches SCC-Modul, keine unzutreffende DPF-Aussage, kein toter oder falscher interner Querverweis, kein erfundener Rechtsbegriff, keine Rollenverwechslung.

| Dimension | geprüft | Fehler | Status |
|---|---|---|---|
| DSGVO-Artikelzitate | 22 | 0 | ✅ sauber |
| EU-Rechtsakte / SCC / DPF | 6 | 0 | ✅ sauber |
| Interne Querverweise (§/Anlage/Nummerierung) | 24 | 0 | ✅ sauber |
| Rechtsbegriffe / Terminologie | 6 | 0 | ✅ sauber |
| Querschnitt / Vollständigkeit Art. 28 Abs. 3 | 4 | 0 | ✅ sauber |
| **Summe** | **62** | **0 harte Fehler** | **✅** |

Drei Punkte wurden vom Erstprüfer als „ungenau" markiert; alle drei haben sich in der Gegenprüfung als **nicht-Fehler** bzw. **rein optionale Best-Practice-Feinschliffe** erwiesen (Details unten). Keiner ist ein Halluzinations- oder Korrektheitsfehler.

---

## Verifizierte Kern-Zitate (Auszug — alle korrekt)

**DSGVO-Artikel:**
- Art. 4 Nr. 7 = Verantwortlicher ✓ · Art. 4 Nr. 8 = Auftragsverarbeiter ✓ (§ 2)
- Art. 28 Abs. 2 = allgemeine Genehmigung weiterer AV ✓ · Art. 28 Abs. 3 = Pflichtinhalt AVV ✓ · Art. 28 Abs. 4 = Einstandspflicht für Subunternehmer ✓ (§ 6)
- Art. 30 Abs. 2 = Verzeichnis für Auftragsverarbeiter ✓ (§ 4)
- Art. 32 = Sicherheit der Verarbeitung ✓ · „Art. 32 bis 36" = Unterstützungspflichten (Sicherheit/Meldung/DSFA/Konsultation) ✓ (§ 4, § 9)
- Art. 9 = besondere Kategorien ✓ (Anlage 1)
- Art. 44 ff. = Drittlandtransfer ✓ · Art. 45 = Angemessenheitsbeschluss ✓ · Art. 46 = geeignete Garantien ✓ (§ 7)
- Art. 82 = Haftung/Schadensersatz ✓ (§ 14)
- Kapitel III = Betroffenenrechte ✓ (§ 8)
- Keine erfundenen Artikel; keine konkrete `§ … BDSG`-Fehlzitierung (BDSG nur als Definitionsbegriff genannt) ✓

**EU-Rechtsakte & Transfer:**
- „Verordnung (EU) 2016/679" = DSGVO ✓
- „Durchführungsbeschluss (EU) 2021/914" = EU-SCC-Beschluss vom 04.06.2021 ✓
- „Modul 3 (Processor-to-Processor)" = korrekt (Module: 1=C2C, 2=C2P, **3=P2P**, 4=P2C); für die Konstellation AV→Subunternehmer zutreffend ✓
- Anlage 3: Vercel als DPF-zertifiziert ✓ · Anthropic auf „DPA inkl. EU-SCC" (nicht DPF) gestützt ✓ — beides faktisch zutreffend

**Interne Struktur:**
- § 1–§ 17 lückenlos fortlaufend ✓ · Absatz-Nummerierung je Paragraf lückenlos ✓ · Anlagen 1–4 vollständig ✓
- Kritische editierte Verweise: § 3 Abs. 2 → § 16 Abs. 4 (Änderungsverlangen) ✓ · § 3 → Anlage 4 (Weisungsempfänger) ✓ · § 5 Abs. 5 → § 12 (Nachweis) ✓ · § 17 Abs. 1 → § 5 Abs. 3 existiert ✓
- „TOM" in § 1 Abs. 5 definiert, **bevor** erstmals abgekürzt verwendet (§ 5 Abs. 3) ✓ (Defined-before-use)

**Vollständigkeit Art. 28 Abs. 3 lit. a–h:** Alle acht gesetzlichen Pflichtbestandteile sind abgebildet (a Weisung §3, b Vertraulichkeit §11, c Art. 32 §5/Anlage 2, d Subunternehmer §6, e Betroffenenrechte §8, f Art. 32–36 §9, g Löschung/Rückgabe §13, h Nachweis/Audit §12) ✓ — keine Lücke, kein Widerspruch zu zwingendem Recht.

---

## Die 3 markierten Punkte (alle unkritisch)

### 1. § 3 Abs. 2 — „Änderungsverlangen / Bestätigung / Vergütung" → geringfügig, optional
**Erst-Verdikt:** ungenau/mittel · **Gegenprüfung (web-gestützt):** *teilweise → gering.*
Die Klausel ist **rechtmäßig** und entspricht dem Branchen-/Aufsichtsbehörden-Standard (u. a. Bitkom-Bundesmuster). Der Bestätigungs-/Vergütungsvorbehalt greift textlich **nur** für Weisungen, die den *Leistungsumfang ändern oder überschreiten* (kommerzielle Change-Requests) — das ist zulässig, denn das Weisungsrecht aus Art. 28 Abs. 3 lit. a kann den Vertragsgegenstand nicht einseitig erweitern. Das **datenschutzrechtliche Kern-Weisungsrecht** (Löschen/Stoppen/Einschränken/Pseudonymisieren innerhalb des vereinbarten Rahmens) ist an anderer Stelle gewahrt und gerade **nicht** dem Vorbehalt unterworfen: § 3 Abs. 1, § 2 Abs. 2, § 3 Abs. 3, § 8 Abs. 3, § 13. Kein DSGVO-Verstoß, kein Halluzinationsfehler.
**Optionale Best-Practice (nicht erforderlich):** ein klarstellender Satz in § 3 Abs. 2, dass das Recht, die Verarbeitung jederzeit durch Weisung einzuschränken/zu ändern/zu untersagen (Art. 28 Abs. 3 lit. a), unberührt und nicht von Bestätigung/Vergütung abhängig ist; Vorbehalt nur für leistungsändernde Verlangen. Räumt einen möglichen DSB-Einwand präventiv aus.
*(Nebenbefund — betrifft NICHT das Dokument: Der Erstprüfer zitierte die Hinweispflicht als „Art. 28 Abs. 3 Satz 3"; korrekt ist Art. 28 Abs. 3 **UAbs. 2**. Das Dokument selbst zitiert diese Unternorm gar nicht, macht den Fehler also nicht.)*

### 2. Art. 28 Abs. 10 DSGVO „fehlt" in § 2 Abs. 3 → kein Fehler (verworfen)
**Erst-Verdikt:** ungenau/gering · **Gegenprüfung:** *kein-fehler.*
§ 2 Abs. 3 beschreibt die **legitime** Eigenzweckverarbeitung des AV (Abrechnung, Aufbewahrung, IT-Sicherheit …), bei der der AV nach Art. 4 Nr. 7 eigener Verantwortlicher ist. Art. 28 Abs. 10 regelt dagegen den **rechtswidrigen** Fall der Zweckanmaßung. Das sind verschiedene Konstellationen — ein Verweis auf Art. 28 Abs. 10 wäre hier sogar leicht unpassend. Keine Korrektur nötig.

### 3. Anlage 4 „Datenschutzkoordination / Datenschutzbeauftragter" → kein Fehler (verworfen)
**Erst-Verdikt:** ungenau/gering · **Gegenprüfung:** *kein-fehler.*
„Datenschutzbeauftragter" ist der gesetzliche Begriff (Art. 37–39 DSGVO, § 38 BDSG); „Datenschutzkoordination" ist kein gesetzlicher, aber ein zulässiger interner Funktionsbegriff. Die Zelle enthält bereits den Zusatz „[falls bestellt; sonst Datenschutzkontakt]", stellt also korrekt klar, dass ein DSB nur bei Bestellung existiert — im Einklang mit § 4. Reine Ausfüll-/Platzhalterzeile, kein materiell-rechtlicher Defekt.
**Optionale Kosmetik:** Zelle als „Datenschutzbeauftragter (falls bestellt) bzw. Datenschutzkontakt" fassen.

---

## Empfehlung
Das Dokument ist hinsichtlich Rechtsbegriffen, Paragrafen und Querverweisen **halluzinationsfrei und zitierkorrekt** und kann insoweit unverändert an den Kunden/DSB gehen. Die einzige sinnvolle (nicht zwingende) Verbesserung ist die einsatzige Klarstellung in § 3 Abs. 2 (Punkt 1). Eine finale Freigabe sollte aus Haftungsgründen ein zugelassener Anwalt/externer DSB erteilen — mit diesem Befund ist das ein kurzer Bestätigungs-, kein Korrektur-Review.
