# Offene To-Dos vor Unterzeichnung des AVV (Wackenhut)

> **Single Source of Truth.** Diese Datei ist die maßgebliche, kanonische Liste der offenen Punkte, die **vor Unterzeichnung des AVV** (bzw. vor Go-live mit echten Wackenhut-Daten) zu erledigen sind. Wird nach „den offenen AVV-To-Dos" gefragt, ist **diese Datei** zu lesen und daraus zu antworten. Statusänderungen bitte **hier** pflegen, nicht an anderer Stelle duplizieren.

- **Aktueller Vertragsstand:** `AVV_AutohausAutomation_Wackenhut_v3.1_2026-06-16.docx`
- **Vertragsparteien:** AutohausAutomation (Auftragsverarbeiter) ↔ Wackenhut Autohaus GmbH (Verantwortlicher)
- **Tech-Stack (Subunternehmer):** Supabase (DB, Frankfurt) · Vercel (Hosting/Compute, fra1) · Brevo/Sendinblue (E-Mail) · Anthropic/Claude (KI-Entwicklung) · OpenAI (genehmigter Ausweich-Anbieter)
- **Letzte Aktualisierung:** 2026-06-16

Status-Legende: `[ ]` offen · `[~]` in Arbeit / entschieden, Ausführung ausstehend · `[x]` erledigt

---

## Benötigte Pläne/Tiers je Subunternehmer

Diese Pläne sind nötig, damit die Zusagen in Anlage 2 (TOM) und Anlage 3 (Subunternehmer/Garantien) belastbar sind. **Kein Enterprise-Tier und keine API-Token-Abrechnung für Anthropic erforderlich.**

| Subunternehmer | Benötigter Plan | ~Kosten | Liefert (TOM-/DSGVO-relevant) | DPA-Mechanismus |
|---|---|---|---|---|
| **Supabase** | **Pro** | ~€25–30/M | tägl. Backups (7 T Aufbewahrung), AES-256 + TLS, 7 T Log-Retention, Frankfurt/eu-central-1; **PITR optional** (kostenpfl. Add-on, falls besseres RPO als 24 h gewünscht) | Dashboard → Organization → Legal Documents (PandaDoc) |
| **Vercel** | **Pro** | ~€20/M | fra1-Region-Pinning, AES-256 + TLS, **DPF-zertifiziert**, 1 T Log-Retention (30 T mit Observability Plus) | **automatisch** mit Vertragsschluss (gilt auf Pro/Enterprise) |
| **Anthropic (Claude)** | **Team + Premium-Platz** | Team min. 5 Plätze; Premium ~€90/M (jährl.) bzw. ~€105/M (monatl.); Standard ~€18/€21 | Commercial Terms = **DPA + EU-SCC**, kein Training, 30 T Retention, SOC 2 / ISO 27001 / ISO 42001; Premium-Platz für Claude-Code-Volumen | in Commercial Terms inkorporiert (mit Vertragsschluss). **Consumer Max/Pro reicht NICHT** (kein DPA) |
| **OpenAI (ChatGPT/Codex)** | **API – Pay-as-you-go auf bezahltem Org-Account** (günstigste DPA-Variante); *alternativ* **ChatGPT Business**, wenn der **Codex**-Agent als Claude-Code-Pendant aktiv genutzt werden soll | API: nur Token-Kosten, **kein Seat-Minimum**; Business: ~$25/Platz, **min. 2 Plätze** | DPA, Vertragspartner **OpenAI Ireland Ltd**, EU-SCC, kein Training by default, 30 T Retention (ZDR auf Antrag); **kein DPF** | API: DPA **automatisch** mit Vertragsschluss. **ChatGPT Plus/Pro (Consumer) reicht NICHT** und deckt API/Codex nicht ab |

Hinweise: (1) Supabase liefert die **SOC-2-/ISO-Berichte** erst ab Team — **nicht nötig**: der AVV stützt sich auf öffentlich verfügbare Zertifizierungs-/Trust-Center-Nachweise. (2) Für Anthropic und OpenAI gibt es **keine EU-Daten-Residency** auf den genannten Plänen — US-Verarbeitung über EU-SCC; in Anlage 3 transparent offengelegt; Datenminimierung/Pseudonymisierung bleibt Pflicht. (3) OpenAI nur erforderlich, **wenn** der Ausweich-Anbieter aktiviert wird (siehe B).

---

## A. Vertragsinhalt im AVV finalisieren
- [ ] **Firmierungen einsetzen:** eigene Gesellschaft auf Seite 1 (Rubrum) + **exakte Wackenhut-Firmierung laut Handelsregister** verifizieren.
- [ ] **Anlage 4 ausfüllen:** Weisungsberechtigte/-empfänger, Sicherheitskontakt (= wir), Support-/Technikkontakt; **DSB-/Datenschutzkontakt von Wackenhut erfragen** und eintragen.
- [x] **C2 — § 1 Abs. 3 (Definitionsklausel) bleibt** (Standardklausel, kein KI-Artefakt). Entschieden.
- [x] CKa-Kommentare beantwortet/umgesetzt, Markierungen entfernt (v3.1).

## B. Anbieter- und Account-Setup (damit Anlage 2/3 bei Unterschrift wahr ist)
- [x] **Supabase Pro** gebucht (tägliche Backups, 7 Tage Aufbewahrung, AES-256, Frankfurt/eu-central-1).
- [x] **Vercel Pro** vorhanden (fra1-Pinning, DPA auto-inkorporiert, DPF).
- [~] **Claude Team + Premium-Platz** (Commercial Terms = DPA + EU-SCC, kein Training, Claude Code) — Upgrade läuft.
- [ ] **Supabase-DPA unterzeichnen:** Dashboard → Organization → Legal Documents (PandaDoc).
- [ ] **OpenAI-API-Account einrichten** (bezahlt, Pay-as-you-go, **kein Seat-Minimum**) + API-Bedingungen akzeptieren → **DPA wird automatisch inkorporiert** (Vertragspartner EU: OpenAI Ireland Ltd; EU-SCC; kein Training by default; 30 Tage Retention). Optional **Zero-Data-Retention** via `api-compliance@openai.com` beantragen. **Erst danach ist die Anlage-3-OpenAI-Zeile bei Unterschrift wahr.** Achtung: ein ChatGPT-Consumer-Abo (Plus/Pro) liefert **kein** DPA und deckt die API nicht ab.
- [ ] **fra1 deployen** (`vercel.json` mit `"regions": ["fra1"]` liegt vor) und im **Vercel-Dashboard verifizieren** (Functions-Region = fra1; Default wäre iad1/USA).
- [ ] **MFA aktivieren** auf: Supabase, Vercel, Brevo, GitHub (wird in Anlage 2 zugesagt).
- [ ] **`FAL_AI_KEY` aus `.env.local` entfernen** (nur Demo-Altlast, kein Produktivbezug).

## C. Code/Architektur vor Go-live mit Echtdaten
- [ ] **NLPearl-Route entfernen oder hart deaktivieren** (`app/api/nlpearl/make-call/route.ts`): sendet Telefonnummern an `api.nlpearl.ai` (KI-Telefonie), die **weder in Anlage 1 noch in Anlage 3 vorgesehen** ist. Andernfalls müsste NLPearl als Subunternehmer aufgenommen werden.

## D. Vor Signatur extern live verifizieren
- [ ] **Vercel-DPF-Status „Active"** auf dataprivacyframework.gov (Teilnehmer-Suche) prüfen.
- [ ] **Anthropic NICHT auf der DPF-Liste** bestätigen (Transfer trägt nur über EU-SCC — so in Anlage 3 formuliert).
- [ ] **Supabase-DPA-Signaturweg auf Pro** verifizieren (Dashboard-Self-Service vs. Anfrage).
- [ ] *(Optional)* Falls 30-Tage-Vercel-Logs zugesagt werden sollen: **Observability Plus** auf Vercel prüfen/aktivieren.

## E. Im Hauptvertrag regeln (nicht im AVV)
- [ ] **Stundensätze** für Unterstützungsleistungen nach § 9 AVV aufnehmen.
- [ ] **Nutzerzahl / Module / Leistungsumfang** dort regeln (gehört nicht in den AVV).
- [ ] **Ausschluss Drittbereitstellung / Konzernausweitung** — Pendant zu § 1 Abs. 5 (Variante B): die Beschränkung auf die im Rubrum genannte Gesellschaft datenschutzseitig durch eine Lizenz-/Nutzungsklausel im Hauptvertrag flankieren.

## F. Wiederkehrend / operativ (nach Unterzeichnung)
- [ ] **Test-Restore einmal durchführen + dokumentieren** (empfohlen; nach v3.1 nicht mehr vertraglich gefordert, aber: ein nie zurückgespieltes Backup ist nur eine Hoffnung). ~30–60 Min: Backup in Wegwerf-Projekt zurückspielen, App dagegen prüfen, datierten Vermerk ablegen.
- [ ] **Jährlicher TOM-Selbst-Check** etablieren: Admin-Zugänge/MFA, Dependency-Updates, RLS-Test, Backup-Restore-Probe, Secrets-Rotation — als datiertes Protokoll (Nachweis nach § 12).

---

## Verwandte Dokumente
- **Aktueller AVV:** `AVV_AutohausAutomation_Wackenhut_v3.1_2026-06-16.docx`
- **Halluzinations-/Rechtsprüfung:** `Halluzinations-Audit_AVV_v3.0_2026-06-13.md`
- **Antworten auf die ersten Kommentare:** `Kommentar-Antworten_AVV_2026-06-12.md` (enthält u. a. die Tier-Übersicht zu Supabase/Vercel/Brevo/Anthropic)

> Hinweis: Die finale Freigabe vor Unterschrift sollte aus Haftungsgründen ein zugelassener Anwalt / externer DSB erteilen.
