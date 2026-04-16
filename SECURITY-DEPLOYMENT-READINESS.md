# Security & Deployment Readiness

Stand: 16. April 2026

## Executive Summary

Mit dem aktuellen Stand ist die Anwendung **verkaufsfähig als Demo/Prototype**, aber **nicht freigabefähig für produktive Verarbeitung echter Kunden- und Mitarbeiterdaten eines großen deutschen Autohauses**.

Der Hauptgrund ist nicht Supabase in Frankfurt, sondern die Gesamtkette:

- Die App läuft aktuell auf Vercel, und Vercel selbst sagt öffentlich, dass **keine Daten dauerhaft in EU-Regionen gespeichert werden**.
- Im Repo gibt es derzeit **keine echte serverseitige Authentifizierung/Autorisierung**.
- Mehrere API-Endpunkte mit personenbezogenen Daten sind aktuell **ohne Login-Schutz** erreichbar.
- Datei-Uploads werden lokal im Dateisystem gespeichert, was auf Vercel so **nicht tragfähig** ist.
- Personenbezogene Daten gehen je nach Funktion zusätzlich an **Brevo** und **NLPearl**.

Für einen großen Vertragshändler würde ich daher zwei Modi unterscheiden:

1. `Demo / Pilot ohne echte Kundendaten`: Vercel kann für eine schnelle Pilotphase funktionieren.
2. `Enterprise Production mit echten Kundendaten`: Ich würde die App **nicht als reine Vercel/Supabase-Standardinstallation verkaufen**, sondern als dediziertes Enterprise-Deployment in Deutschland.

## Verifizierte Anbieter-Fakten

### Vercel

- Vercel Functions können in konkrete Regionen gelegt werden; die Dokumentation nennt Regionskontrolle und Region-Pinning.
- Vercel dokumentiert außerdem ein **read-only filesystem** mit nur `/tmp` als temporär beschreibbarem Speicher.
- Vercel nennt auf der Security-Seite: **SOC 2 Type 2**, **ISO 27001**, **GDPR** und **TISAX Assessment Level 2**.
- Gleichzeitig sagt Vercel öffentlich: **"No data is stored permanently inside EU regions."**
- SSO-Schutz für Deployments ist laut Vercel-Doku nur im **Enterprise-Plan** verfügbar.

Praktische Folge:

- Mit Vercel kann man argumentieren: "Compute kann in Frankfurt laufen."
- Man kann **nicht** ehrlich sagen: "Die gesamte Lösung ist vollständig in Deutschland gehostet."

### Supabase

- Supabase bietet als Region explizit **`Central EU (Frankfurt)`** bzw. `eu-central-1`.
- Supabase dokumentiert **IP-basierte Network Restrictions** für Postgres.
- Supabase empfiehlt für Datensicherheit ausdrücklich **RLS** und warnt, dass der **service role key nie im Frontend** liegen darf.
- Supabase bietet DPA-Unterlagen; im DPA steht u. a., dass **Backups in transit und at rest verschlüsselt** sind.
- Supabase dokumentiert zusätzliche Plattform-Sicherheitskontrollen wie **MFA** und **SSO** für Organisationen.

Praktische Folge:

- Die Datenbankseite ist grundsätzlich enterprise-tauglich aufsetzbar.
- Das gilt aber nur, wenn Auth, Policies, Netzrestriktionen und Betriebsmodell sauber umgesetzt werden.

### Brevo

- Brevo dokumentiert GDPR-Unterstützung.
- Die Help-Dokumentation beschreibt, dass SMTP-Traffic in Europa über europäische Relays läuft und in europäische Rechenzentren transportiert wird.

Praktische Folge:

- Brevo ist eher ein **EU-/GDPR-kompatibler** Subprozessor als ein **Deutschland-only** Subprozessor.
- Wenn ihr Kundendaten per E-Mail übertragt, muss Brevo in das Verzeichnis der Auftragsverarbeiter aufgenommen und vertraglich abgedeckt werden.

### NLPearl

- NLPearl nennt öffentlich eine Privacy Policy.
- NLPearl wirbt öffentlich mit **SOC 2**, **HIPAA** und **GDPR**.

Praktische Folge:

- Für einen Enterprise-Verkauf reicht Marketing-Sprache allein nicht.
- Vor Produktivbetrieb mit echten Kundendaten würde ich von NLPearl mindestens verlangen:
  - DPA/AVV
  - Subprozessorliste
  - Informationen zu Datenresidenz
  - Retention-/Deletion-Modell
  - technische Sicherheitsdokumentation

## Repo-Befunde zum aktuellen Stand

### 1. Keine echte serverseitige Zugriffskontrolle

- Die Dashboard-Layout-Struktur zeigt keinen Login-Schutz oder Middleware-Schutz in [`app/(dashboard)/layout.tsx`](./app/(dashboard)/layout.tsx).
- In [`package.json`](./package.json) ist aktuell auch kein Auth-Stack wie `next-auth`, `auth.js`, `@supabase/supabase-js` oder ähnliches als Runtime-Schutz erkennbar.
- Die Projektplanung in [`PLAN.md`](./PLAN.md) nennt zwar `NextAuth.js`, im aktuellen Code ist das aber nicht umgesetzt.

### 2. Rollen sind aktuell UI-seitig, nicht sicherheitsseitig

- Im Callcenter wird die Rolle rein clientseitig über State gesetzt:
  [`app/(dashboard)/callcenter/callcenter-page-client.tsx`](./app/(dashboard)/callcenter/callcenter-page-client.tsx)
- Beispiel:
  - `role` wird per `useState` gehalten.
  - `currentUser` wird daraus abgeleitet.
  - Filterung erfolgt im Client.

Das ist für Demos okay, aber für echte Kundendaten keine belastbare Autorisierung.

### 3. Sensible API-Endpunkte sind ungeschützt

- Callbacks lesen/anlegen:
  [`app/api/callbacks/route.ts`](./app/api/callbacks/route.ts)
- Callback löschen:
  [`app/api/callbacks/[id]/route.ts`](./app/api/callbacks/%5Bid%5D/route.ts)
- Attachments lesen/anlegen:
  [`app/api/callbacks/[id]/attachments/route.ts`](./app/api/callbacks/%5Bid%5D/attachments/route.ts)
- Einzelne Attachments lesen/löschen:
  [`app/api/callback-attachments/[id]/route.ts`](./app/api/callback-attachments/%5Bid%5D/route.ts)
- E-Mail-Versand:
  [`app/api/email/send-callback-notification/route.ts`](./app/api/email/send-callback-notification/route.ts)
- Voice-Call-Auslösung:
  [`app/api/nlpearl/make-call/route.ts`](./app/api/nlpearl/make-call/route.ts)

Aktuell sehe ich dort weder:

- Session-Prüfung
- Rollenprüfung
- Tenant-/Mandantenprüfung
- CSRF-Schutz
- Rate Limiting
- IP Allowlisting

### 4. Datei-Uploads sind für Vercel falsch abgelegt

- Anhänge werden lokal nach `storage/callback-attachments` geschrieben:
  [`lib/server/callback-attachments.ts`](./lib/server/callback-attachments.ts)
- Vercel dokumentiert aber ein **read-only filesystem** mit nur temporärem `/tmp`.

Das ist gleich doppelt problematisch:

- technisch unzuverlässig auf Vercel
- aus Enterprise-Sicht kein geeignetes Modell für revisionsfähige Dokumentablage

### 5. Attachments sind ohne Zugriffsschutz abrufbar

- Attachment-Download erfolgt direkt per ID in:
  [`app/api/callback-attachments/[id]/route.ts`](./app/api/callback-attachments/%5Bid%5D/route.ts)

Wer die ID kennt und den Endpunkt erreicht, bekommt aktuell keine zusätzliche Berechtigungsprüfung entgegengestellt.

### 6. Secrets- und Betriebsmodell sind noch prototypisch

- In [`./.env.local`](./.env.local) liegen produktionsnahe Zugangsdaten für DB, Brevo und NLPearl.

Für ein Enterprise-Setup braucht ihr stattdessen:

- Secret Manager / KMS
- Rotation
- getrennte Umgebungen
- Break-glass-Prozess
- dokumentierte Verantwortlichkeiten

### 7. Keine erkennbaren Security-Header / Edge-Absicherung

- In [`next.config.ts`](./next.config.ts) sind aktuell keine Security-Header wie CSP, HSTS, `X-Frame-Options`, `Referrer-Policy` oder `Permissions-Policy` konfiguriert.

### 8. Demo-Dokumente liegen öffentlich auslieferbar im Web-Root

- In `public/demo-docs/` liegen PDF-, CSV- und ZIP-Dateien, die über Mock-Daten referenziert werden.
- Verweise finden sich z. B. in [`lib/mock-data.ts`](./lib/mock-data.ts).

Für Demo okay, für Produktion mit echten Belegen absolut zu vermeiden.

## Antworten auf die drei typischen IT-Leiter-Fragen

### 1. "Ist das Ganze sicher in Deutschland gehostet?"

**Ehrliche Antwort heute: nein, nicht vollständig.**

Was heute stimmt:

- Die Datenbank kann in Frankfurt laufen.
- Vercel-Compute kann regionsnah konfiguriert werden.

Was heute nicht sauber behauptet werden kann:

- Dass die **gesamte Lösung ausschließlich in Deutschland** gehostet wird.
- Dass keine Metadaten, Logs, Caches oder Subprozessoren außerhalb Deutschlands/EU beteiligt sind.

**Empfohlene Vertriebsantwort:**

> Im aktuellen Demo-Setup liegt die Datenbank bereits in Frankfurt. Für ein produktives Enterprise-Deployment für Ihr Autohaus würden wir die produktive Laufzeitumgebung, Dateispeicherung, Backups und Betriebsprozesse in einer dedizierten deutschen Zielarchitektur bereitstellen. Das Demo-Setup auf Vercel ist für eine Vorführung geeignet, aber nicht das Betriebsmodell, das wir Ihnen für echte Kundendaten empfehlen.

### 2. "Ist das Ganze DSGVO-konform?"

**Ehrliche Antwort heute: noch nicht belastbar nachweisbar.**

Warum nicht:

- DSGVO-Konformität ist keine Eigenschaft des Codes allein, sondern des gesamten Betriebsmodells.
- Es fehlen aktuell nachweisbare Kontrollen für:
  - Zugriffskonzepte
  - Lösch- und Aufbewahrungsregeln
  - Auditierbarkeit
  - AVV/DPA-Kette aller Subprozessoren
  - technische und organisatorische Maßnahmen
  - Datenschutz-Folgenabschätzung je nach Verarbeitung

**Empfohlene Vertriebsantwort:**

> Die Anwendung ist so aufgebaut, dass sie DSGVO-konform betrieben werden kann. Das aktuelle Demo-System ist jedoch noch kein finaler DSGVO-Produktivbetrieb. Für den Produktivrollout liefern wir eine vollständige Datenschutz- und Sicherheitsumsetzung mit AVV/DPA-Kette, Rollen- und Rechtekonzept, Löschkonzept, Verzeichnis der Verarbeitungstätigkeiten, technischen und organisatorischen Maßnahmen sowie einem dedizierten Deutschland-/EU-Betriebsmodell.

### 3. "Das muss höchsten Sicherheitsanforderungen genügen, wenn wir echte Kundendaten laden."

**Ehrliche Antwort heute: im aktuellen Repo-Stand nein.**

Die größten Gaps:

- keine echte Authentifizierung
- keine serverseitige Autorisierung
- ungeschützte APIs
- ungeeignetes Attachment-Storage-Modell
- keine harten Tenant-/Mandanten-Grenzen
- keine Enterprise-Identity-Integration
- keine sichtbare Audit-/SIEM-/Incident-Struktur

**Empfohlene Vertriebsantwort:**

> Für produktive Kundendaten liefern wir nicht einfach das Demo-Setup aus, sondern eine gehärtete Enterprise-Version. Dazu gehören SSO über Ihre bestehende Unternehmens-Identität, rollenbasierte serverseitige Autorisierung, verschlüsselte Dokumentablage in Deutschland, WAF, Audit-Logging, Backup- und Restore-Prozesse, IP-/Netzrestriktionen, Penetrationstest und ein dokumentierter Secure-SDLC-Prozess.

## Meine Empfehlung für die Zielarchitektur

## Empfohlenes Zielbild für Enterprise Production

Für ein großes deutsches Autohaus würde ich die App so shippen:

- `App Runtime`: Next.js als Docker-Container, nicht als Standard-Vercel-Deployment
- `Hosting`: Deutschland-Region, bevorzugt dediziert und vertraglich sauber
- `Compute-Optionen`:
  - AWS `eu-central-1` (Frankfurt) mit ECS/Fargate oder EKS
  - alternativ ein deutscher souveräner Provider wie STACKIT / Open Telekom Cloud, wenn Deutschland-Souveränität im Einkauf stark gewichtet wird
- `Datenbank`: PostgreSQL in Frankfurt
  - entweder Supabase Enterprise / dediziert sauber gehärtet
  - oder eigener gemanagter Postgres-Cluster in Deutschland
- `Objektspeicher`: S3-kompatibler Storage in Deutschland für Anhänge und Belege
- `Identity`: Entra ID / Okta / Keycloak via SAML oder OIDC
- `Ingress`: WAF + Reverse Proxy + Rate Limiting + optional VPN / IP Allowlisting
- `Logging`: zentrales Audit- und Security-Logging
- `Backups`: verschlüsselt, getestet, dokumentierter Restore
- `Environments`: getrennt in Demo, Staging, Produktion

## Was ich Vercel noch zutrauen würde

Vercel ist weiter nutzbar für:

- Demo-Systeme
- interne Preview-Umgebungen
- Pilotphasen ohne hochsensible Produktionsdaten
- eventuell kontrollierte Frontend-Schicht, wenn Backend und Datenhaltung separat gehärtet sind

Für einen Vertragshändler mit strikter Frage "alles sicher in Deutschland gehostet?" würde ich Vercel aber **nicht** als primäres Verkaufsnarrativ wählen.

## Mindest-Backlog vor einem Enterprise-Verkauf

1. Echte Auth einführen: SSO/OIDC/SAML, keine UI-Rollen-Simulation mehr.
2. Alle API-Routen serverseitig absichern.
3. Mandantenmodell definieren, falls mehrere Händler/Standorte bedient werden.
4. Attachment-Storage auf deutschen Object Storage umstellen.
5. Download-Links nur signiert und berechtigt ausgeben.
6. Security-Header, CSP, HSTS und harte Cookie-/Session-Policies ergänzen.
7. Rate Limiting und WAF aktivieren.
8. Secrets aus lokaler `.env`-Denke in Secret Manager/KMS überführen.
9. Audit-Logging für Ansehen, Download, Änderung und Löschung personenbezogener Daten einbauen.
10. Lösch-, Aufbewahrungs- und Backup-Konzept schriftlich definieren.
11. Subprozessoren prüfen: Vercel, Supabase, Brevo, NLPearl, später ggf. OpenAI/Anthropic.
12. Penetrationstest, Dependency-Scanning, License-Scan, SBOM und Release-Gates etablieren.

## Einordnung des AI-generierten Codes

Dass Teile des Codes mit Opus/Codex erstellt wurden, ist **für sich genommen kein Ausschlusskriterium**.

Für Enterprise-Kunden zählt stattdessen:

- menschliche Code-Reviews
- dokumentierter Secure SDLC
- SAST/SCA
- Secrets Scanning
- Dependency- und Lizenzprüfung
- nachvollziehbare Freigaben
- Test- und Release-Prozess

Die richtige Aussage ist also nicht:

> "Der Code wurde mit KI erstellt."

Sondern:

> "Der Code unterliegt einem kontrollierten Entwicklungs- und Freigabeprozess mit Sicherheitsprüfungen, unabhängig davon, welches Assistenzwerkzeug beim Entwickeln verwendet wurde."

## Kurzfazit

Wenn ihr das Produkt **schnell verkaufen** wollt, dann verkauft nicht das heutige Demo-Deployment als produktives Sicherheitszielbild.

Verkauft stattdessen:

- die **fachliche Lösung**
- plus eine **dedizierte Enterprise-Betriebsarchitektur in Deutschland**
- plus eine **klare Security-Roadmap vor Go-Live**

Das ist ehrlich, technisch sauber und deutlich glaubwürdiger gegenüber einem IT-Leiter.

## Quellen

- Vercel Functions / Runtime / Regionen: https://vercel.com/docs/functions/regions
- Vercel Runtime-Dateisystem: https://vercel.com/docs/functions/runtimes
- Vercel Security: https://vercel.com/security
- Vercel Access Control: https://vercel.com/docs/security/access-control
- Vercel DPA: https://vercel.com/legal/dpa
- Supabase Regionen: https://supabase.com/docs/guides/platform/regions
- Supabase Network Restrictions: https://supabase.com/docs/guides/platform/network-restrictions
- Supabase Secure Data / RLS: https://supabase.com/docs/guides/database/secure-data
- Supabase Access Control: https://supabase.com/docs/guides/platform/access-control
- Supabase Platform Security: https://supabase.com/docs/guides/security/platform-security
- Supabase DPA: https://supabase.com/downloads/docs/Supabase%2BDPA%2B260317.pdf
- Brevo GDPR / SMTP / EU-Datenpfad: https://help.brevo.com/hc/es/articles/360001258744--C%C3%B3mo-cumple-Brevo-el-RGPD und https://help.brevo.com/hc/pt/articles/360001005870-Rel%C3%A9-SMTP
- NLPearl Privacy Policy: https://nlpearl.ai/privacy-policy/
- NLPearl Security Claim / API Page: https://nlpearl.ai/api-integration/
