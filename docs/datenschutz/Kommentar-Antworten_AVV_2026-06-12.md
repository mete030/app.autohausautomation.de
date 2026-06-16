# Antworten auf die Kommentare im AVV-Entwurf v2.0 (Stand 10.06.2026)

Bezugsdokument: `AVV_AutohausAutomation_Wackenhut_finaler_Entwurf_2026-06-10.docx`
Neue Version: `AVV_AutohausAutomation_Wackenhut_v3.0_2026-06-12.docx`

Legende: ✏️ = in v3.0 umgesetzt · ✅ = Klausel bleibt bewusst unverändert · ⚠️ = Handlungspunkt außerhalb des AVV

---

## Kommentar 1 — Präambel, Negativliste der Module ✏️

> „Sollten wir das nicht etwas offener formulieren? … ein AVV für alle Module …"

**Antwort:** Ja, eure Intuition ist richtig. Die Negativliste („Nicht Gegenstand sind KI-Telefonie, KYC, KI-Bildgenerierung …") hat zwei Nachteile: Sie verrät eure Produkt-Roadmap an den Kunden-DSB, und sie zwingt euch bei jedem neuen Modul zu einer AVV-Änderung mit erneuter Verhandlung. Der saubere Mechanismus ist eine **positive, dynamische Geltungsklausel**: Der AVV gilt für die Anwendung *einschließlich aller Module, die im Hauptvertrag oder einem Leistungsabruf vereinbart werden*; bei Aufnahme neuer Module werden nur Anlage 1 (Verarbeitungsbeschreibung) und Anlage 3 (Subunternehmer) ergänzt — dafür gibt es bereits den Mechanismus in § 6 und § 16. So bleibt es bei **einem** AVV für die gesamte Kundenbeziehung. Genau so in v3.0 umgesetzt (Präambel Abs. 2). Spiegelbildlich wurde die Zeile „Nicht enthaltene Funktionen" in Anlage 1 ersetzt (siehe Kommentar 28).

## Kommentar 4 — § 1 Abs. 5, „TOM" und Betriebsstätten ✏️

**Zu 1 (TOM mit Fundstelle):** „TOM" war an dieser Stelle tatsächlich die erste Verwendung der Abkürzung ohne Definition. In v3.0 wird sie dort eingeführt: „technische und organisatorische Maßnahmen (nachfolgend „TOM", **Anlage 2**)".

**Zu 2 (Betriebsstätten):** Richtig erkannt — bei SaaS kommt es auf Nutzer und Mandanten an, nicht auf Standorte. Die Klausel hat aber einen anderen, für euch wichtigen Zweck: Sie verhindert, dass **andere Gesellschaften der Wackenhut-Gruppe** (das ist eine Gruppe mit mehreren Standorten/Gesellschaften) ohne neue Vereinbarung „mitfahren" und ihr plötzlich Auftragsverarbeiter für Rechtsträger seid, mit denen ihr keinen Vertrag habt. Deshalb bleibt der Kern erhalten, aber „Betriebsstätten" wurde gestrichen (datenschutzrechtlich irrelevant, da keine eigenen Rechtsträger). **Nutzerzahlen und kommerzieller Umfang gehören in den Hauptvertrag** — der AVV regelt nur, *wer Vertragspartei der Datenverarbeitung* ist. Genau so steht es jetzt da.

## Kommentar 5 — § 2 Abs. 4, „Training von KI-Modellen" ✅

**Antwort: Nicht rausnehmen.** Drei Gründe: (1) Die Zusage kostet euch nichts — ihr trainiert keine Modelle, und auf Anthropic-Commercial-Tiers (siehe Kommentar 35/40) trainiert auch Anthropic nicht auf euren Daten. (2) Für den Wackenhut-DSB ist genau dieser Satz 2026 ein Standard-Prüfpunkt; fehlt er, gibt es Rückfragen. (3) Die Klausel verbietet nicht die *Nutzung* von KI-Tools beim Entwickeln — sie verbietet nur, Kundendaten zum *Training* zu verwenden. Das ist eine eurer stärksten vertrauensbildenden Klauseln. Bleibt unverändert.

## Kommentar 6 — § 3 Abs. 2, Bestätigungsverfahren für Weisungen ✏️

**Antwort:** Ein generelles „Weisungen gelten erst nach unserer Zustimmung" ist nicht möglich — das Weisungsrecht des Verantwortlichen ist der Kern von Art. 28 Abs. 3 lit. a DSGVO; ein Zustimmungsvorbehalt würde den AVV unwirksam machen und jeder DSB würde ihn streichen. Was rechtlich **zulässig und in v3.0 umgesetzt** ist:
1. Weisungen müssen in Textform **an die in Anlage 4 benannten Weisungsempfänger** gerichtet werden (keine Zuruf-Weisungen an beliebige Adressen).
2. Ihr **bestätigt den Empfang** von Weisungen, die über die laufende Nutzung hinausgehen, in Textform — damit gibt es nie eine Weisung, die euch „unbemerkt" bindet.
3. Der entscheidende Schutz: **Weisungen, die den Leistungsumfang ändern oder über ihn hinausgehen, gelten als Änderungsverlangen nach § 16 Abs. 4** — sie sind erst nach eurer Bestätigung umzusetzen und können gesondert vergütet werden. Zusätzlich habt ihr weiterhin das Aussetzungsrecht aus § 3 Abs. 3 bei rechtswidrigen Weisungen.
Damit ist euer eigentliches Anliegen (keine ungeprüfte Umsetzungspflicht per E-Mail) vollständig abgedeckt, ohne den AVV angreifbar zu machen.

## Kommentar 7 — § 4, Datenschutzbeauftragter: „kann ich das einfach sein?" ✅

**Antwort: Nein, du selbst kannst es nicht sein.** Inhaber/Geschäftsführer können nicht ihr eigener DSB sein — der DSB überwacht die Geschäftsleitung, das wäre ein Interessenkonflikt (Art. 38 Abs. 6 DSGVO, ständige Aufsichtsbehörden-Praxis). Aber: Ihr braucht voraussichtlich gar keinen (siehe Kommentar 8). Die Klausel ist mit „soweit gesetzlich verpflichtet" bereits perfekt formuliert — sie verpflichtet euch zu nichts, was das Gesetz nicht ohnehin verlangt. In Anlage 4 tragt ihr einfach „Datenschutzkontakt: Metehan Kartal" ein (Kontakt ≠ benannter DSB, das ist zulässig).

## Kommentar 8 — § 4, DSB-Pflicht abhängig von Firmengröße? ✅

**Antwort:** Nein, nicht jede Firma. In Deutschland (§ 38 BDSG) ist ein DSB erst Pflicht, wenn **mindestens 20 Personen** ständig mit automatisierter Verarbeitung personenbezogener Daten beschäftigt sind, oder wenn ihr Verarbeitungen mit Pflicht zur Datenschutz-Folgenabschätzung als Kerntätigkeit betreibt oder geschäftsmäßig Daten zur Übermittlung/Markt­forschung verarbeitet. Als Ein-Personen-Unternehmen mit Rückruf-Software: **keine Benennungspflicht**. Die Klausel bleibt unverändert — sie sagt genau das („soweit gesetzlich verpflichtet").

## Kommentar 9 — § 5 Abs. 2, Produktivdaten nur in Produktivumgebung ✅

**Antwort, was das konkret für euch heißt:**
- **a) Datenbanken:** Echte Wackenhut-Daten existieren nur im Supabase-Produktionsprojekt (Frankfurt). Entwicklungs-/Testumgebungen laufen mit synthetischen Daten oder Seed-Daten. Keine Dumps der Produktions-DB auf den lokalen Rechner oder in Dev-Projekte; wenn ein Export im Einzelfall nötig ist, gelten die Bedingungen aus Anlage 2 Ziff. 4 (verschlüsselt, dokumentiert, befristet, danach löschen).
- **b) KI-Nutzung:** Code, Schema, Konfiguration und synthetische Daten dürfen jederzeit in Claude Code verarbeitet werden — das sind keine personenbezogenen Daten des Verantwortlichen. Echte Kundendaten (z. B. ein echter Rückruf-Datensatz zum Debuggen) dürfen nur dann in ein KI-Tool, wenn der Anbieter in Anlage 3 als Subunternehmer genehmigt ist — was mit der Anthropic-Aufnahme in v3.0 unter den dort genannten Bedingungen (Commercial Terms!) der Fall ist. Siehe Kommentare 15, 34, 35.
Die Klausel ist für euch erfüllbar und bleibt.

## Kommentare 10 + 11 — § 5 Abs. 5, regelmäßige TOM-Überprüfung ✏️

**Was es konkret bedeutet:** Art. 32 Abs. 1 lit. d DSGVO verlangt wörtlich ein „Verfahren zur regelmäßigen Überprüfung, Bewertung und Evaluierung" — die Klausel ist also Pflicht und kann nicht raus. Für ein Ein-Personen-Unternehmen genügt in der Praxis ein **jährlicher dokumentierter Selbst-Check** plus anlassbezogene Prüfung (nach Incidents, größeren Releases): Admin-Zugänge & MFA prüfen, Dependencies aktualisiert, RLS-Policies getestet, Backup-Restore einmal probiert, Secrets rotiert — als datiertes Protokoll (eine Markdown-Datei im internen Repo reicht).
**Wie man es nachweist (K11):** Genau mit diesem datierten Protokoll; auf Anfrage stellt ihr es nach § 12 als Selbstauskunft bereit, ergänzt um die SOC-2/ISO-Zertifikate von Supabase/Vercel für die Infrastrukturebene. In v3.0 konkretisiert zu: „regelmäßig, **mindestens einmal jährlich sowie anlassbezogen**, und dokumentiert die Ergebnisse in geeigneter Form. Der Nachweis … erfolgt nach Maßgabe des § 12." Damit ist die Pflicht messbar, aber bewusst niedrigschwellig.

## Kommentar 12 — § 6 Abs. 4, Haftung für Subunternehmer ✅

**Antwort:** Der Satz ist **wörtlich Art. 28 Abs. 4 Satz 2 DSGVO** — diese Haftung trifft euch kraft Gesetzes, völlig unabhängig davon, ob der Satz im Vertrag steht. Weglassen würde also nichts ersparen, aber beim DSB den Eindruck erwecken, ihr wollt etwas verstecken. Erfahrungsgemäß ist genau dieser Satz ein Akzeptanz-Pflichtpunkt in jeder DSB-Prüfung. Bleibt drin.

## Kommentar 13 — § 6 Abs. 5, Unter-Unterauftragsverarbeiter (AWS, Google & Co.) ✏️

**Antwort:** Die gesetzliche Einstandspflicht (Art. 28 Abs. 4) für die Kette könnt ihr vertraglich gegenüber Wackenhut nicht abbedingen — sie steht im Gesetz, nicht in dieser Klausel. Aber die Klausel selbst ist bereits euer **Schutz**: Sie holt die Pauschalgenehmigung für die gesamte Kette (AWS unter Supabase, Cloudflare unter Brevo etc.) ein, sodass ihr nicht jede AWS-Änderung einzeln anzeigen müsst. In v3.0 zusätzlich zu euren Gunsten ergänzt: Eure Pflichten bezüglich der Unterkette sind **ausdrücklich beschränkt auf sorgfältige Auswahl und vertragliche Verpflichtung der direkten Subunternehmer sowie Prüfung von deren Nachweisen (DPA, Zertifizierungen, Subprocessor-Listen)** — ihr schuldet also kein eigenes Audit von AWS-Rechenzentren. Mehr Entlastung ist rechtlich nicht erreichbar, und das ist auch die marktübliche Lösung.

## Kommentar 15 — § 6 Abs. 7, KI-Tools / „DPA mit ChatGPT und Claude"? ✏️

**Antwort:** Ja, das lässt sich DSGVO-konform absichern, und „DPA" heißt hier genau das, was ihr vermutet: ein Auftragsverarbeitungsvertrag (Data Processing Addendum) mit dem KI-Anbieter — das Gegenstück zu eurem AVV mit Wackenhut, eine Stufe tiefer.
- **Anthropic:** Ein DPA gibt es **nur auf Commercial-Tiers** (Claude Team / Enterprise / API — die „Commercial Terms" inkludieren das DPA mit EU-Standardvertragsklauseln automatisch, kein Training auf euren Daten). Euer aktueller **Max-Plan ist Consumer-Tier: kein DPA**, und nach den Consumer-Terms (Update Aug. 2025) ggf. sogar Training auf euren Inhalten, je nach Einstellung. Konsequenz und Empfehlung in Kommentar 35/41.
- **OpenAI/ChatGPT:** Hätte auf Business/Enterprise/API ebenfalls ein DPA — aber ihr nutzt es nicht produktiv; **nicht aufnehmen** (jeder zusätzliche Subunternehmer ist eine Angriffsfläche in der DSB-Prüfung).
§ 6 Abs. 7 wurde in v3.0 entsprechend umgebaut: KI-Tools ohne Personenbezug (Code, Schema, synthetische Daten) sind ausdrücklich **außerhalb** der Auftragsverarbeitung; mit Personenbezug **nur** über die in Anlage 3 genannten Subunternehmer (jetzt: Anthropic) mit Datenminimierung/Pseudonymisierung.

## Kommentar 16 — § 7 Abs. 2, Vercel „zu konfigurieren" ✏️⚠️

**Antwort:** Berechtigte Frage mit unbequemer Antwort: Es war **nicht** konfiguriert. Im Repo existierte keine `vercel.json` und keine Region-Einstellung — Vercel deployt Functions dann standardmäßig nach `iad1` (Washington D.C.). Ich habe das jetzt behoben: Es gibt eine `vercel.json` mit `"regions": ["fra1"]` (Frankfurt, auf eurem Pro-Plan zulässig). Der AVV formuliert es in v3.0 als Fakt: „Die Vercel-Functions **sind** auf die EU-Region Frankfurt (fra1) konfiguriert", plus ehrlicher Hinweis, dass CDN-Auslieferung statischer Inhalte über globale Edge-Standorte laufen kann. **⚠️ Beim nächsten Deploy verifizieren** (Vercel-Dashboard → Project → Functions → Region = fra1).

## Kommentar 17 — § 7 Abs. 5, Vollmacht für Vertragsabschlüsse ✏️

**Antwort:** Gemeint sind ausschließlich **EU-Standardvertragsklauseln (SCC)** — von der EU-Kommission vorformulierte Datenschutz-Klauselwerke für Drittlandtransfers, keine kommerziellen Verträge. Die Vollmacht ist marktüblicher Standard (Controller-Vollmacht für SCC Modul 3 in der Unterauftragskette), weil sonst Wackenhut theoretisch selbst mit jedem Sub-Sub-Anbieter SCC schließen müsste. Euer Punkt, dass das deutlich werden muss, ist trotzdem richtig — in v3.0 ausdrücklich klargestellt: „Diese Vollmacht ist auf den Abschluss von Standardvertragsklauseln und vergleichbaren datenschutzrechtlichen Garantien i. S. d. Art. 44 ff. DSGVO beschränkt; **zum Abschluss sonstiger Rechtsgeschäfte im Namen des Verantwortlichen ist der Auftragsverarbeiter nicht befugt**."

## Kommentar 18 — § 9 Abs. 2, Stundensätze im Hauptvertrag ⚠️

**Antwort:** Korrekt, das ist ein Merkposten für den Hauptvertrag: Dort einen Satz aufnehmen wie „Unterstützungsleistungen nach § 9 AVV, die über den Standardumfang hinausgehen, werden mit [●] €/Stunde vergütet." Ohne Satz im Hauptvertrag greift die Auffangregel „marktübliche Stundensätze" — funktioniert auch, ist aber streitanfälliger. Keine AVV-Änderung nötig.

## Kommentar 19 — § 11 Abs. 2, Vertraulichkeitsverpflichtung bei Einstellungen ✅

**Antwort:** Eine allgemeine arbeitsvertragliche Verschwiegenheitsklausel reicht **nicht automatisch** — die Klausel (und Art. 28 Abs. 3 lit. b DSGVO) verlangt eine Verpflichtung **in nachweisbarer Form**, die Datenschutz abdeckt und das Vertragsende überdauert. Praktische Konsequenz fürs Einstellen (auch Freelancer!): Bei Onboarding ein einseitiges Standardformular „Verpflichtung auf Vertraulichkeit und Datenschutz" unterschreiben lassen (Muster gibt es von den Landesdatenschutzbehörden, z. B. LfDI Baden-Württemberg) und die unterschriebene Kopie ablegen — das ist der Nachweis. Aufwand: 10 Minuten pro Person. Klausel bleibt unverändert, sie ist Pflichtbestandteil.

## Kommentare 20 + 21 — § 12 Abs. 1, Nachweispflichten ✏️/✅

**K20 (Form/Kadenz):** Es gibt bewusst keine feste Kadenz — die Pflicht ist **anlassbezogen auf Anfrage**, und die Absätze 2–7 kanalisieren sie bereits stark zu euren Gunsten (vorrangig dokumentenbasiert/remote, Vor-Ort max. 1×/Jahr mit 14 Tagen Vorlauf, Kostenerstattung). In v3.0 ergänzt: „Die Bereitstellung erfolgt **auf Anfrage** des Verantwortlichen **in Textform**." Mehr Einschränkung (z. B. „max. 1 Anfrage/Jahr") würde gegen Art. 28 Abs. 3 lit. h verstoßen.
**K21 („alle erforderlichen" → „alle ihm vorliegenden"):** **Nicht ändern.** „Alle erforderlichen Informationen" ist der Gesetzeswortlaut von Art. 28 Abs. 3 lit. h DSGVO. Eine Abschwächung unter das gesetzliche Minimum wäre unwirksam und ein rotes Tuch für den DSB. Euer Schutz vor Überdehnung steckt bereits in Abs. 5 und 6 (Anbieter-Nachweise genügen, kein Zugang zu Quellcode/Secrets).

## Kommentar 22 — § 12 Abs. 3, Kontrollen/Inspektionen ✅

**Antwort:** Kann nicht raus. Art. 28 Abs. 3 lit. h DSGVO verlangt ausdrücklich, dass der Auftragsverarbeiter „Überprüfungen **– einschließlich Inspektionen –** ermöglicht und dazu beiträgt". Ein AVV ohne Auditrecht ist nicht Art.-28-konform und würde von jedem DSB zurückgewiesen. Die Formulierung ist bereits maximal entschärft: Audits erst, wenn Zertifikate/Selbstauskünfte **nicht ausreichen**, Prüfer muss verschwiegen und kein Wettbewerber sein, Abs. 4 deckelt auf 1×/Jahr remote-first, Abs. 7 gibt euch Kostenerstattung. Bleibt.

## Kommentar 23 — § 12 Abs. 6, Ersatznachweise spezifizieren ✏️

**Antwort:** Ja, sinnvoll — und zwar so, dass die **Wahl bei euch** liegt. In v3.0: „Der Auftragsverarbeiter darf insoweit geeignete Ersatznachweise **nach seiner Wahl** bereitstellen, insbesondere Testate, zusammenfassende Berichte, Konfigurationsnachweise oder Bestätigungen in Textform." Damit könnt ihr z. B. einen Screenshot der RLS-Konfiguration oder eine Eigenbestätigung liefern, statt Systemzugang zu geben.

## Kommentar 24 — § 14 Abs. 3, „sicherstellen/gewährleisten" ✅

**Antwort:** Der Absatz ist **stark in eurem Sinne** — einer der wichtigsten Schutzabsätze des Vertrags. Ohne ihn könnte ein Gericht Formulierungen wie „der AV gewährleistet …" als **verschuldensunabhängige Garantie** lesen: Ihr würdet dann auch ohne eigenes Verschulden haften (z. B. wenn Supabase ausfällt, obwohl ihr alles richtig gemacht habt). Der Absatz stellt klar: Solche Wörter beschreiben nur die normalen vertraglichen Pflichten (Haftung nur bei Verschulden), keine Garantie im Rechtssinne. Unbedingt behalten.

## Kommentar 25 — Generalfrage: Geht ein kürzerer AVV für Kleinstunternehmen? ✅

**Antwort:** Der Pflichtinhalt aus Art. 28 Abs. 3 DSGVO ist **größenunabhängig** — Weisungsbindung, Vertraulichkeit, TOM, Subunternehmer, Betroffenenrechte, Unterstützung Art. 32–36, Löschung, Nachweis/Audit müssen *immer* drin sein, ob Ein-Personen-UG oder Konzern. „Kleine" AVVs sind nur sprachlich knapper, nicht inhaltlich. Euer Dokument ist mit 17 Paragrafen + 4 Anlagen bereits am unteren Rand dessen, was ein DSB eines Unternehmens dieser Größe akzeptiert — Kürzen würde mehr Rückfragen erzeugen, nicht weniger (jede fehlende Pflichtklausel wird als Lücke moniert und nachverhandelt). Die richtige Vereinfachungsstrategie für euch: **diesen einen AVV als Standard für alle Autohaus-Kunden** verwenden und je Kunde nur Anlagen 1/3/4 anpassen. Das Verhandlungs-Asset ist Wiederverwendung, nicht Kürze.

## Kommentar 26 — Anlage 1, Überschrift „Beschreibung der Verarbeitung" ✏️

**Antwort:** Anlage 1 muss genau die Pflichtangaben aus Art. 28 Abs. 3 Satz 1 DSGVO enthalten: Gegenstand, Art, Zweck der Verarbeitung **personenbezogener Daten**, Datenarten, Betroffenenkategorien, Dauer. Es ist also keine allgemeine Leistungsbeschreibung (die gehört in den Hauptvertrag), sondern die datenschutzspezifische. Der Inhalt war bereits korrekt zugeschnitten; zur Klarstellung heißt die Überschrift in v3.0 jetzt „Anlage 1 – Beschreibung der Verarbeitung **personenbezogener Daten**".

## Kommentar 27 — Anlage 1, Zweck „Betrieb, Sicherheit und Support" ✅

**Antwort:** Ja, nötig — und zwar in **eurem** Interesse. Logs, Fehleranalyse und Missbrauchsprävention verarbeiten IP-Adressen und Nutzer-IDs, also personenbezogene Daten. Stünde der Zweck nicht in Anlage 1, wäre euer Security-Logging formal eine **weisungswidrige Verarbeitung** — genau das Szenario, in dem ihr nach Art. 28 Abs. 10 DSGVO selbst zum Verantwortlichen würdet. Die Zeile legalisiert euren technischen Betrieb. Bleibt.

## Kommentar 29 — Anlage 1, „Aktionslinks/Token" — haben wir das wirklich? ✅

**Antwort:** Ja, und die Beschreibung stimmt exakt mit dem Code überein. Das sind die „Als erledigt markieren"-Links in den Rückruf-Benachrichtigungsmails: `lib/server/callback-records.ts` erzeugt Tokens mit `randomBytes(32)` (kryptografisch zufällig, Zeile 259), speichert **nur den SHA-256-Hash** (`tokenHash` in `CallbackEmailActionRecord`, Zeile 260/280 f.), Standard-Gültigkeit **14 Tage** (Zeile 261), abgelaufene Tokens werden abgewiesen (Zeile 373 f.). Der AVV-Text („Gültigkeit maximal 14 Tage; Token nur gehasht gespeichert") ist also wahr und sogar ein Vorzeige-TOM. Unverändert gelassen. Einziger Hinweis: Die 14 Tage sind ein Default-Parameter (`expiresInDays ?? 14`) — nirgends im Code mit mehr als 14 aufrufen, sonst bricht die Vertragszusage.

## Kommentar 30 — Anlage 1, Log-Aufbewahrung „[● z. B. 90] Tage" ✏️⚠️

**Antwort:** Euer Verdacht ist goldrichtig — **90 Tage sind auf euren Plänen nicht darstellbar**: Supabase-Plattformlogs: Free 1 Tag, **Pro 7 Tage**, Team 28, Enterprise 90. Vercel-Runtime-Logs: **Pro 1 Tag** (mit „Observability Plus"-Add-on 30 Tage). Aber: Eure App führt einen **eigenen Audit-Trail in der Datenbank** (`CallbackActivityRecord`: Erstellung, E-Mail-Versand, Abschluss, Eskalation — mit Zeitstempel, Akteur, Metadaten), und der lebt so lange wie der Vorgang. In v3.0 deshalb zweistufig und ehrlich formuliert: **anwendungsseitige Ereignis-/Aktivitätsprotokolle** für die Speicherdauer des Vorgangs; **Infrastruktur-/Plattformlogs** der Subunternehmer gemäß deren Fristen („derzeit je nach Anbieter und Plan zwischen einem Tag und 30 Tagen"). Das ist zusagefest, ohne Upgrade-Zwang auf Supabase Team ($599/Monat).

## Kommentar 31 — Anlage 1, Backups ✏️(teilweise)⚠️

**Antwort:** Die Formulierung („Überschreibung nach regulären Backup-Zyklen der eingesetzten Anbieter") ist korrekt und bleibt — aber sie setzt voraus, dass es Backups **gibt**: **Supabase Free hat keine automatischen Backups.** Erst Pro ($25/Monat) liefert tägliche Backups mit 7 Tagen Aufbewahrung (optional PITR als Add-on). Vercel ist stateless (kein Backup-Thema), Brevo betrifft nur Versanddaten. **⚠️ Vor Go-live mit Echtdaten ist das Supabase-Upgrade auf Pro zwingend** — sonst ist auch die neue RPO/RTO-Zusage (24 h/48 h, ehemals der „[● MVP-Empfehlung]"-Platzhalter) ungedeckt. Siehe Tier-Übersicht in Kommentar 41.

## Kommentar 32 — Anlage 2 Ziff. 1, „zu viel versprochen?" / physische Zugangskontrollen ✏️

**Antwort:** Fast alles ist nachweisbar wahr (serverseitige Auth, RLS per Migration `20260602120000_enable_rls` auf allen vier Callback-Tabellen, Secrets nur in Env-Mechanismen, TLS, gehashte Tokens — alles im Code verifiziert). Zwei Stellen wurden angepasst:
1. **Physische Zugangskontrollen:** Stimmt, das wisst ihr nicht aus eigener Anschauung — aber ihr müsst es auch nicht: Supabase/Vercel laufen auf AWS, deren physische Sicherheit durch ISO 27001/SOC 2 zertifiziert ist. In v3.0 umformuliert auf das, was ihr tatsächlich nachweisen könnt: „physische Sicherheitsmaßnahmen sind **durch anerkannte Zertifizierungen der Anbieter (insbesondere ISO 27001, SOC 2) nachgewiesen**".
2. **E-Mail-Minimierung:** Der alte Text versprach „möglichst keine Telefonnummern im E-Mail-Body" — eure Mails enthalten aber Kundenname, **Telefonnummer**, Rückrufgrund und ggf. Anhänge (das ist fachlich gewollt: der Berater soll zurückrufen können). Das wäre im Audit ein Eigentor gewesen. Neu: „nur die für die Bearbeitung des Vorgangs erforderlichen Angaben; **Öffnungs- und Klick-Tracking ist deaktiviert**" (stimmt: `X-Mailin-Track: 0` ist im Code gesetzt). ⚠️ Bitte MFA auf den Admin-Konten Vercel/Supabase/Brevo/GitHub wirklich aktivieren — das sagt die Klausel zu.

## Kommentar 33 — Anlage 2 Ziff. 2, Eingabekontrolle — „macht Supabase das?" ✅

**Antwort:** Nein, Supabase macht das nicht für euch — Postgres protokolliert keine fachlichen Änderungen von selbst. **Aber eure App macht es bereits selbst**: Die Tabelle `CallbackActivityRecord` protokolliert Erstellung, Statuswechsel, E-Mail-Versand, Abschluss (auch per E-Mail-CTA) und Eskalationen, jeweils mit `performedBy`, `performedAt`, Typ und Metadaten. Die Klausel ist außerdem auf „wesentliche" Vorgänge und „soweit für Nachvollziehbarkeit erforderlich" begrenzt — genau euer Ist-Zustand. Nichts zu implementieren, nichts zu ändern.

## Kommentar 34 — Anlage 2, Weitergabekontrolle vs. „jede Zeile Code mit Claude geschrieben" ✏️

**Antwort:** Ja, das ist zumutbar — weil die Klausel etwas anderes verbietet, als ihr tut. Verboten ist die Verarbeitung von **personenbezogenen Produktionsdaten** (echte Kundendatensätze) in KI-Tools. **Code schreiben mit Claude ist davon nicht erfasst**: Quellcode, Schemata, Konfigurationen und synthetische Testdaten sind keine personenbezogenen Daten des Verantwortlichen — das stellt § 6 Abs. 7 in v3.0 jetzt ausdrücklich klar. Ihr könnt also weiterhin jede Zeile mit Claude schreiben. Die einzige echte Disziplinregel: niemals echte Kundendaten (Namen, Telefonnummern aus der Produktiv-DB, Produktions-Logauszüge) in den Prompt — es sei denn über den in Anlage 3 genehmigten Weg (Anthropic, Commercial Terms, minimiert/pseudonymisiert). Die Klausel verweist in v3.0 statt auf ein Pauschalverbot auf „außerhalb der in Anlage 3 genehmigten Subunternehmer".

## Kommentar 35 — Claude Code als Subunternehmer aufnehmen? ✏️⚠️

**Antwort:** Ja — in v3.0 ist **Anthropic, PBC als Subunternehmer Nr. 4 in Anlage 3** aufgenommen (Zweck: KI-gestützte Entwicklungs-, Fehleranalyse- und Supportleistungen; Daten: grundsätzlich keine, im Einzelfall minimiert/pseudonymisiert; Garantien: Commercial Terms inkl. DPA und EU-SCC, kein Training). **Wichtige Bedingung:** Diese Garantien existieren nur auf Anthropic-**Commercial**-Tiers. Euer Max-Plan (Consumer) hat kein DPA — solange ihr auf Max seid, gilt strikt: keine personenbezogenen Wackenhut-Daten in Claude (Code ist okay, siehe K34). Vor Unterzeichnung des AVV solltet ihr auf den **Team-Plan** wechseln (Details und Kosten in Kommentar 41 — er ist mit 5 Standard-Seats sogar günstiger als euer Max-Plan, mit der Einschränkung niedrigerer Nutzungslimits pro Seat).

## Kommentar 36 — Anlage 2 Ziff. 3, Incident-Verfahren — wer ist gemeint? ✏️

**Antwort:** Gemeint seid **ihr** — eure internen Prozesse Richtung Wackenhut: euer Sicherheitskontakt (der in Anlage 4 benannt wird), eure Eskalations- und Kommunikationswege für den Fall einer Datenpanne (§ 10: Meldung binnen 72 h an Wackenhut), eure Wiederherstellungsschritte (gestützt auf Supabase-Backups und die Status-Seiten/Support-Kanäle der Anbieter). Nicht gemeint: Verfahren zwischen euch und Supabase/Vercel — deren Incident-Pflichten euch gegenüber stehen in deren DPAs. In v3.0 klargestellt: „definierter Sicherheitskontakt **des Auftragsverarbeiters (Anlage 4)**, dokumentierte Eskalations-, Wiederherstellungs- und Kommunikationsprozesse **gegenüber dem Verantwortlichen nach Maßgabe des § 10**." Praktisch reicht ein einseitiges internes Incident-Runbook (wer merkt es → was prüfen → wann/wie Wackenhut informieren).

## Kommentar 37 — Anlage 2 Ziff. 5, TOM-Überprüfung — nötig? ✏️

**Antwort:** Nötig (gleiche Rechtsgrundlage wie § 5 Abs. 5: Art. 32 Abs. 1 lit. d DSGVO — siehe Kommentar 10/11). Statt zu streichen wurde der Punkt in v3.0 mit § 5 Abs. 5 synchronisiert: „Regelmäßige, **mindestens jährliche sowie anlassbezogene** Überprüfung … **mit Dokumentation der Ergebnisse**." Damit sagen Hauptteil und Anlage dasselbe und der jährliche Selbst-Check (K10) deckt beides ab.

## Kommentar 38 — Anlage 2 Ziff. 5, Patch-/Update-Management ✅

**Antwort:** Gemeint sind zwei Ebenen: (1) **Eure** Ebene: npm-Dependencies, Next.js, Prisma aktuell halten — Nachweis über Lockfile-Historie/Git, ideal mit Dependabot/Renovate im Repo. (2) **Anbieter**-Ebene: OS-/Datenbank-/Infrastruktur-Patches machen Supabase/Vercel als Managed Service selbst; deren „Aussagen und Updates" dazu sind die Trust-/Security-Center und SOC-2-Berichte — das deckt der letzte Aufzählungspunkt der Anlage 2 („Prüfung verfügbarer Zertifikate oder Trust-Center-Unterlagen") bereits ab. Regelmäßige aktive Statusmeldungen der Lieferanten an euch gibt es nicht und müsst ihr auch nicht zusagen. Klausel bleibt unverändert.

## Kommentar 39 — Anlage 3, „Stand 08.06.2026" + Verifizierungs-Hinweis ✏️

**Antwort:** Das war zweierlei: Der Satz „Firmierungen … sind vor Unterzeichnung … zu verifizieren" war ein **interner Bearbeitungshinweis von Claude an euch** — der darf auf keinen Fall im Kundendokument bleiben (er sagt dem DSB: „wir haben unsere eigene Liste nicht geprüft"). In v3.0 gestrichen; die Verifizierung ist jetzt tatsächlich erfolgt (Supabase, Inc.; Vercel Inc.; Sendinblue SAS handelnd als „Brevo", Paris — die Firma heißt rechtlich weiterhin Sendinblue SAS). Der **Stand-Vermerk bleibt bewusst drin** (aktualisiert auf 12.06.2026): Bei einer dynamischen Subprozessorenliste mit Widerspruchsrecht ist ein Versionsdatum Best Practice und kein Makel. ⚠️ Bitte noch extern verifizieren: die exakte Wackenhut-Firmierung (Handelsregister) und eure eigene Firmierung auf Seite 1.

## Kommentar 40 — Anthropic in Anlage 3 aufnehmen (ChatGPT-Vorschlag) ✏️

**Antwort:** Umgesetzt als Zeile 4 — inhaltlich nah am ChatGPT-Vorschlag, aber in drei Punkten korrigiert:
1. **Entität:** „Anthropic, PBC (USA)" — eine Anthropic Ireland Ltd. als Vertragspartner ließ sich nicht belegen; Vertragsgrundlage sind die Anthropic Commercial Terms. Lieber nur behaupten, was belegbar ist.
2. **Garantie:** DPA + EU-SCC ✓ (in den Commercial Terms inkorporiert, inkl. „kein Training auf Customer Content"). **Aber kein DPF**: Anthropic ist — anders als Vercel — nach allen offiziellen Quellen *nicht* unter dem EU-US Data Privacy Framework zertifiziert; die ChatGPT-Formulierung hätte das offen gelassen. v3.0 stützt sich nur auf DPA/SCC.
3. **Datenkategorien enger gefasst:** Statt „personenbezogene Daten des Verantwortlichen, soweit erforderlich" heißt es „**grundsätzlich keine** personenbezogenen Daten; im Einzelfall … nur minimiert und, soweit möglich, pseudonymisiert" — das ist die Position, die ein DSB ohne Diskussion durchwinkt.
Ort der Verarbeitung ehrlich benannt: USA möglich (Claude.ai verarbeitet in den USA; EU-Inferenz gibt es derzeit nur über AWS Bedrock/Vertex per API, was ihr nicht wollt).

## Kommentar 41 — Tier-Übersicht: Was müssen wir wo buchen? ⚠️

**Antwort — benötigte Pläne für EU-Hosting + DPA-Absicherung (verifiziert 12.06.2026):**

| Anbieter | Benötigter Plan | Kosten | Was er liefert | DPA-Mechanismus |
|---|---|---|---|---|
| **Supabase** | **Pro** (Upgrade von Free **zwingend vor Go-live**) | $25/Monat | Tägliche Backups (7 Tage Aufbewahrung; PITR als Add-on), 7 Tage Log-Retention, Frankfurt eu-central-1 (bereits euer Projekt-Standort, im Code verifiziert) | DPA self-service: Dashboard → Organization → Legal Documents, Unterzeichnung via PandaDoc |
| **Vercel** | **Pro** (habt ihr ✓) | $20/Monat | fra1-Region-Pinning (jetzt per `vercel.json` gesetzt), 1 Tag Log-Retention (optional Observability Plus → 30 Tage), DPF-zertifiziert | DPA gilt auf Pro/Enterprise automatisch als Vertragsbestandteil — nichts zu unterschreiben |
| **Brevo** | Jeder Plan (auch Free) | — | EU-Hosting (Frankreich/Belgien), Tracking habt ihr im Code deaktiviert | DPA ist Appendix 3 der Brevo-AGB — gilt automatisch für jeden Account |
| **Anthropic** | **Claude Team** (Consumer Max reicht NICHT — kein DPA, Trainings-Thematik) | Min. 5 Seats. 5× Standard = $125/Monat (monatlich) bzw. $100/Monat (jährlich). Standard-Seats **enthalten Claude Code**; für mehr Volumen 1 Premium-Seat: 4×$25 + $125 = $225/Monat | Commercial Terms: kein Training auf euren Inhalten, 30-Tage-Retention | DPA (inkl. EU-SCC) ist in die Commercial Terms inkorporiert — gilt mit Vertragsschluss |

Anmerkungen: (1) Kein Enterprise-Tier und keine API-Kosten nötig — der Team-Plan erfüllt euren Wunsch exakt; das 5-Seat-Minimum ist der „Preis" für das DPA, selbst wenn 4 Seats ungenutzt bleiben. Achtung: Ein Standard-/Premium-Seat hat niedrigere Nutzungslimits als euer Max 20x — wenn euch das Volumen nicht reicht, ist die saubere Zwischenlösung: Team-Account (mit DPA) für alles mit Kundenbezug, Max-Account weiter für reines Coden ohne Personenbezug. (2) **EU-/Deutschland-gehostete Claude-Modelle gibt es auf claude.ai nicht** — EU-Inferenz nur via AWS Bedrock (eu-central-1)/Vertex über API. Da Anthropic in v3.0 nur für minimierte Einzelfälle vorgesehen ist, tragen DPA + SCC das rechtlich; US-Verarbeitung ist in Anlage 3 transparent offengelegt. (3) Supabase SOC-2-Report gibt's erst ab Team ($599/Monat) — braucht ihr nicht; § 12 Abs. 2 akzeptiert auch „vergleichbare Nachweise", und die öffentlichen Trust-Center-Angaben reichen für die DSB-Prüfung üblicherweise aus. (4) Gesamtkosten der Compliance-Grundausstattung: ~$170/Monat (Supabase Pro + Vercel Pro + Claude Team 5×Standard) zzgl. eures bisherigen Max-Plans, falls ihr ihn behaltet.

## Kommentar 42 — Anlage 3, „Nicht genehmigt: Anthropic, OpenAI, fal.ai, NLPearl …" ✏️⚠️

**Antwort:** Einverstanden — die Liste wurde ersetzt durch einen neutralen Satz: „Weitere Dienste werden nur nach Maßgabe des § 6 … als Subunternehmer eingesetzt." Gründe: Sie verriet eure Tool-/Roadmap-Interna, und mit Anthropic jetzt in der Liste war sie obendrein widersprüchlich. Der Schutzgehalt (nichts außerhalb von Anlage 3 ist genehmigt) folgt bereits aus § 6 Abs. 1.
**⚠️ Aber ein wichtiger Befund aus dem Code-Check:** Im Repo existiert eine **aktive NLPearl-Route** (`app/api/nlpearl/make-call/route.ts`), die Telefonnummern an `api.nlpearl.ai` sendet — das ist KI-Telefonie, die weder in Anlage 1 noch in Anlage 3 vorgesehen ist. Vor dem Go-live für Wackenhut muss diese Route entfernt oder hart deaktiviert werden (Feature-Flag/Env-Gate reicht nicht ohne Dokumentation); andernfalls müsste NLPearl als Subunternehmer in Anlage 3 aufgenommen werden. fal.ai wurde nur für Demo-Bilder zur Entwicklungszeit genutzt und ist unkritisch (der `FAL_AI_KEY` in `.env.local` kann weg).

---

## Offene Handlungspunkte (außerhalb des Dokuments)

1. **Supabase auf Pro upgraden** (Backups!) und DPA via Dashboard/PandaDoc unterzeichnen — vor Echtdaten-Go-live.
2. **Claude Team-Plan abschließen** (5 Seats) — vor AVV-Unterzeichnung, sonst Anthropic-Zeile aus Anlage 3 streichen.
3. **`vercel.json` (fra1) deployen** und Region im Vercel-Dashboard verifizieren.
4. **NLPearl-Route entfernen/deaktivieren** für das Wackenhut-Deployment.
5. **MFA aktivieren** auf Vercel, Supabase, Brevo, GitHub (wird in Anlage 2 zugesagt).
6. **Firmierungen einsetzen**: eigene Firma (Seite 1) und exakte Wackenhut-Firmierung laut Handelsregister.
7. **Hauptvertrag**: Stundensätze für Unterstützungsleistungen (§ 9 AVV) aufnehmen; Nutzerzahl/Module dort regeln.
8. **Anlage 4 ausfüllen** (Weisungsempfänger, Sicherheitskontakt = ihr; DSB-Kontakt Wackenhut erfragen).
9. **Jährlichen TOM-Selbst-Check** als wiederkehrenden Termin einrichten und Protokoll ablegen.
