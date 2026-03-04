# Wackenhut - AI-Native Autohaus Management Platform

## Context

Die Wackenhut Autohaus-Gruppe hat 5 zentrale Probleme identifiziert, die alle manuell, ineffizient und fehleranfallig sind. Diese Software lost alle 5 Probleme in einer einzigen, modernen, KI-nativen Plattform mit Voice-Steuerung. Das Ziel: Weg von Zettel & Stift, hin zu einer intelligenten, automatisierten Losung auf Stripe/Apple-Niveau.

## Bestatigte Entscheidungen
- **Daten**: Mock-Daten (Frontend-only), Backend spater anschliessbar
- **Sprache**: Komplett deutsche UI (alle Labels, Buttons, Texte)
- **Umfang**: Alle 5 Module + Dashboard in einer Session

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router, Server Components)
- **Language**: TypeScript
- **UI**: shadcn/ui + Tailwind CSS + Radix UI
- **State**: TanStack React Query (server) + Zustand (client)
- **Drag & Drop**: @dnd-kit (Kanban boards)
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Anthropic Claude API (Beschreibungen, Bildanalyse, Voice-Verarbeitung)
- **Voice**: Web Speech API (Browser-nativ)
- **Auth**: NextAuth.js
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React

---

## Project Structure

```
app/
├── layout.tsx                     # Root Layout (Fonts, Providers)
├── globals.css                    # Tailwind + Design Tokens
├── page.tsx                       # Redirect to /dashboard
├── (auth)/
│   └── login/page.tsx
├── (dashboard)/
│   ├── layout.tsx                 # Sidebar + Header + Voice Button
│   ├── page.tsx                   # Dashboard Overview
│   ├── fahrzeuge/                 # Problem 1: Fahrzeuge & Werkstatt
│   │   ├── page.tsx               # Fahrzeug-Inventar (Grid/Liste)
│   │   ├── werkstatt/page.tsx     # Werkstatt-Kanban
│   │   └── [id]/page.tsx          # Fahrzeug-Detail
│   ├── callcenter/                # Problem 2: Ruckruf-Tracking
│   │   └── page.tsx               # Ruckruf-Queue & Tracking
│   ├── inserate/                  # Problem 3: KI-Inserate
│   │   ├── page.tsx               # Inserat-Ubersicht
│   │   ├── neu/page.tsx           # Neues Inserat erstellen (KI)
│   │   └── [id]/page.tsx          # Inserat bearbeiten
│   ├── nachrichten/               # Problem 4: Unified Inbox
│   │   ├── page.tsx               # Nachrichten-Zentrale
│   │   └── [id]/page.tsx          # Konversations-Detail
│   └── verifizierung/            # Problem 5: KYC
│       └── page.tsx               # Verifizierungs-Dashboard
├── api/
│   ├── vehicles/route.ts
│   ├── callbacks/route.ts
│   ├── listings/route.ts
│   ├── messages/route.ts
│   ├── kyc/route.ts
│   └── ai/
│       ├── generate-description/route.ts
│       ├── analyze-price/route.ts
│       └── voice-command/route.ts
components/
├── ui/                            # shadcn/ui (Button, Card, Badge, etc.)
├── layout/
│   ├── sidebar.tsx                # Haupt-Navigation
│   ├── header.tsx                 # Top Bar mit Suche
│   └── mobile-nav.tsx
├── voice/
│   └── voice-control.tsx          # Floating Voice Button
├── dashboard/
│   └── overview-cards.tsx
├── fahrzeuge/
│   ├── vehicle-card.tsx
│   ├── vehicle-table.tsx
│   ├── kanban-board.tsx
│   ├── kanban-column.tsx
│   ├── kanban-card.tsx
│   └── escalation-badge.tsx
├── callcenter/
│   ├── callback-queue.tsx
│   ├── callback-card.tsx
│   ├── advisor-status.tsx
│   └── callback-timer.tsx
├── inserate/
│   ├── listing-form.tsx
│   ├── ai-copilot-panel.tsx
│   ├── price-analyzer.tsx
│   ├── image-uploader.tsx
│   └── listing-preview.tsx
├── nachrichten/
│   ├── inbox-list.tsx
│   ├── conversation-view.tsx
│   ├── message-input.tsx
│   └── channel-badge.tsx
└── verifizierung/
    ├── kyc-pipeline.tsx
    ├── document-upload.tsx
    └── verification-status.tsx
lib/
├── utils.ts                       # cn() helper, formatters
├── mock-data.ts                   # All mock data in one file
├── types.ts                       # All TypeScript types
└── constants.ts                   # Navigation config, design tokens
hooks/
├── use-voice-control.ts
└── use-mock-data.ts
```

---

## Implementation Phases

### Phase 1: Foundation (~40 files)

**Goal**: Next.js scaffold, design system, layout shell, navigation, voice control button, mock data layer.

**Steps**:
1. `npx create-next-app@latest . --typescript --tailwind --eslint --app --import-alias="@/*"`
2. Install deps: `npm install @tanstack/react-query zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-hook-form zod @hookform/resolvers recharts lucide-react clsx tailwind-merge class-variance-authority date-fns`
3. `npx shadcn@latest init` then add: button, card, input, label, select, tabs, badge, avatar, dialog, dropdown-menu, separator, sheet, tooltip, popover, table, textarea, scroll-area, skeleton, switch, progress
4. Create design tokens in `globals.css` (Trust-Blue primary, warm neutrals, dark mode)
5. Create `lib/types.ts` - all TypeScript interfaces (Vehicle, Callback, Listing, Message, KYCSubmission)
6. Create `lib/mock-data.ts` - realistic German mock data for all 5 modules
7. Create `lib/constants.ts` - navigation config with German labels + Lucide icons
8. Create `lib/utils.ts` - cn() helper + German date/currency formatters
9. Create `components/layout/sidebar.tsx` - Collapsible sidebar with 5 module sections + icons
10. Create `components/layout/header.tsx` - Top bar with search, user avatar, notifications
11. Create `components/voice/voice-control.tsx` - Floating mic button (bottom-right), pulsing animation when active, transcription toast
12. Create `app/(dashboard)/layout.tsx` - Sidebar + Header + Voice Button shell
13. Create `app/(dashboard)/page.tsx` - Dashboard overview with KPI cards
14. Create `app/layout.tsx` - Root layout with fonts (Inter), providers
15. Create `app/globals.css` - Custom CSS variables for the design system

**Key Design Decisions**:
- German route names (fahrzeuge, werkstatt, nachrichten, etc.)
- Color palette: Primary #0ea5e9 (Trust Blue), Accent #ff6b5b (Warm Coral), Neutrals
- Voice button: Fixed position bottom-right, 56px, prominent but non-intrusive
- Sidebar: 256px wide, collapsible to icons on smaller screens
- All data from mock layer initially - easy to swap for real API later

---

### Phase 2: Fahrzeugverwaltung & Werkstatt (Problem 1)

**Goal**: Vehicle inventory + Workshop Kanban board with escalation system.

**Files**:
- `app/(dashboard)/fahrzeuge/page.tsx` - Vehicle inventory with grid/list toggle, filters (status, type, location)
- `app/(dashboard)/fahrzeuge/werkstatt/page.tsx` - Workshop Kanban page
- `app/(dashboard)/fahrzeuge/[id]/page.tsx` - Vehicle detail page with history timeline
- `components/fahrzeuge/vehicle-card.tsx` - Card with image, make/model, status badge, days-on-lot counter
- `components/fahrzeuge/vehicle-table.tsx` - Data table view with sorting
- `components/fahrzeuge/kanban-board.tsx` - 5 columns: Eingang → Inspektion → Werkstatt → Aufbereitung → Bereit
- `components/fahrzeuge/kanban-column.tsx` - Droppable column with count badge
- `components/fahrzeuge/kanban-card.tsx` - Draggable card with vehicle info + escalation indicator
- `components/fahrzeuge/escalation-badge.tsx` - Color-coded urgency (Grun: >5 Tage, Gelb: 3-5 Tage, Rot: <3 Tage, Dunkelrot: uberfällig)

**Kanban Columns**:
```
Eingang (3) → Inspektion (2) → Werkstatt (5) → Aufbereitung (2) → Verkaufsbereit (8)
```

**Escalation Logic**:
- Each vehicle has a `deadline` (10 days from intake)
- Badge colors: Green (>5 days left), Yellow (3-5 days), Red (<3 days), Dark Red (overdue)
- Overdue vehicles float to top of each column
- Header shows total overdue count as alert

**Vehicle Location Feature**:
- Simple status indicator: "Hof A", "Hof B", "Werkstatt", "Showroom"
- Filterable by location

---

### Phase 3: Callcenter-Tracking (Problem 2)

**Goal**: Callback tracking dashboard so call center can verify service advisor follow-through.

**Files**:
- `app/(dashboard)/callcenter/page.tsx` - Main callback tracking dashboard
- `components/callcenter/callback-queue.tsx` - List of pending, completed, overdue callbacks
- `components/callcenter/callback-card.tsx` - Card: customer name, reason, assigned advisor, created time, status, action buttons
- `components/callcenter/advisor-status.tsx` - Sidebar showing each advisor's callback stats (open/completed/overdue)
- `components/callcenter/callback-timer.tsx` - Time since callback was assigned (turns red after SLA)

**Status Flow**: Offen → In Bearbeitung → Erledigt / Uberfällig

**Key Features**:
- Tab filters: Alle | Offen | In Bearbeitung | Erledigt | Uberfällig
- SLA timer: callbacks should be completed within 2 hours
- Advisor performance cards showing completion rate
- Escalation: auto-flag after SLA breach, notify manager
- One-click "Als erledigt markieren" with required notes field
- Daily summary stats at top: created today, completed today, overdue total

---

### Phase 4: KI-Inserate (Problem 3)

**Goal**: AI-powered vehicle listing creation with description generation, image enhancement hints, and mobile.de price analysis.

**Files**:
- `app/(dashboard)/inserate/page.tsx` - All listings overview (Draft/Live/Archiviert)
- `app/(dashboard)/inserate/neu/page.tsx` - New listing creation with AI copilot
- `app/(dashboard)/inserate/[id]/page.tsx` - Edit existing listing
- `components/inserate/listing-form.tsx` - Left side: vehicle data input form
- `components/inserate/ai-copilot-panel.tsx` - Right side: AI-generated title, description, price suggestion with confidence scores
- `components/inserate/price-analyzer.tsx` - mobile.de price category display (Sehr gut / Gut / Zufriedenstellend / Erhöht / Stark erhöht) with threshold values
- `components/inserate/image-uploader.tsx` - Multi-image upload with drag-reorder
- `components/inserate/listing-preview.tsx` - Preview as it would appear on mobile.de

**AI Copilot Panel Layout**:
```
┌─────────────────────┐
│ KI-Assistent        │
│                     │
│ Generierter Titel   │
│ ★★★★☆ Konfidenz 85% │
│                     │
│ Beschreibung        │
│ [AI-generated text] │
│ [Ubernehmen][Neu]   │
│                     │
│ Preisanalyse        │
│ €24.500 → "Sehr gut"│
│ €25.200 → "Gut"     │
│ Schwelle: €24.800   │
│                     │
│ [Inserat erstellen] │
└─────────────────────┘
```

**Price Categories** (mobile.de mapping):
- Sehr gut (green) - significantly below market
- Gut (light green) - below market
- Zufriedenstellend (yellow) - at market
- Erhöht (orange) - above market
- Stark erhöht (red) - significantly above market

---

### Phase 5: Nachrichten-Zentrale (Problem 4)

**Goal**: Unified inbox for all customer communication channels.

**Files**:
- `app/(dashboard)/nachrichten/page.tsx` - Unified inbox with channel filters
- `app/(dashboard)/nachrichten/[id]/page.tsx` - Full conversation view
- `components/nachrichten/inbox-list.tsx` - Message list with channel icons, unread badges, last message preview
- `components/nachrichten/conversation-view.tsx` - Chat-style thread view
- `components/nachrichten/message-input.tsx` - Reply input with channel selector + AI quick-reply suggestions
- `components/nachrichten/channel-badge.tsx` - Color-coded badges: WhatsApp (green), Email (blue), SMS (purple), mobile.de (orange)

**Layout** (Split View):
```
┌────────────────┬──────────────────────────────┐
│ Kanale         │ Konversation                 │
│ ○ Alle (47)    │                              │
│ ○ WhatsApp (12)│ Max Mustermann               │
│ ○ E-Mail (20)  │ via WhatsApp                 │
│ ○ SMS (8)      │                              │
│ ○ mobile.de (7)│ [Message bubbles]            │
│                │                              │
│ [Inbox List]   │ [Reply Input]                │
│                │ KI-Vorschlage: [Quick Reply] │
└────────────────┴──────────────────────────────┘
```

**Key Features**:
- Real-time message list (mock with simulated updates)
- Channel filter chips at top
- Unread count per channel
- Customer context sidebar (name, vehicle interest, last visit)
- AI-suggested quick replies (3 suggestions per message)
- "Zugewiesen an" field - assign conversations to team members

---

### Phase 6: KYC & Verifizierung (Problem 5)

**Goal**: Automated customer verification pipeline.

**Files**:
- `app/(dashboard)/verifizierung/page.tsx` - KYC dashboard with pipeline view
- `components/verifizierung/kyc-pipeline.tsx` - Status pipeline: Eingereicht → In Prufung → Verifiziert / Abgelehnt
- `components/verifizierung/document-upload.tsx` - Document upload area with type selection
- `components/verifizierung/verification-status.tsx` - Status card with check results

**Two Flows**:

**Privatkunde** (ID-Check):
- Document upload (Personalausweis / Reisepass)
- AI reads document data (mock)
- Auto-fill customer data
- Status: Verifiziert / Manuell prufen / Abgelehnt

**Gewerbekunde** (Business Check):
- Handelsregisternummer eingeben
- USt-IdNr. eingeben
- Auto-check against registry (mock)
- Status: Verifiziert / Manuell prufen / Abgelehnt

**Dashboard Stats**: Heute eingereicht | In Prufung | Verifiziert | Abgelehnt

---

### Phase 7: Dashboard & Polish

**Goal**: Overview dashboard connecting all 5 modules with KPIs, activity feed.

**Files**:
- `app/(dashboard)/page.tsx` - Enhanced dashboard with:
  - 5 KPI cards (one per module)
  - Werkstatt-Auslastung chart (Recharts bar chart)
  - Offene Ruckrufe counter with trend
  - Inserate-Performance (live vs draft count)
  - Ungelesene Nachrichten counter
  - Ausstehende Verifizierungen counter
- `components/dashboard/overview-cards.tsx` - KPI cards grid
- `components/dashboard/activity-feed.tsx` - Recent activity across all modules
- `components/dashboard/quick-actions.tsx` - Common quick-action buttons

**Dashboard KPI Cards**:
```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│Werkstatt │Ruckrufe  │Inserate  │Nachrichten│KYC      │
│12 aktiv  │5 offen   │34 live   │8 ungelesen│3 offen  │
│2 uberfäl.│2 uberfäl.│3 Entwurfe│+12 heute  │1 prüfen │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## Voice Control System

The voice button is a **persistent floating action button** in the bottom-right corner of every page.

**States**:
1. **Idle**: Blue circle with mic icon, subtle shadow
2. **Listening**: Red/pulsing circle, "Ich höre zu..." toast
3. **Processing**: Spinner, "Verarbeite..." toast
4. **Result**: Checkmark with action confirmation toast

**Voice Commands** (examples):
- "Zeige mir alle uberfälligen Fahrzeuge" → navigate to Werkstatt, filter overdue
- "Erstelle ein Inserat fur den BMW 320d" → navigate to inserate/neu, pre-fill
- "Wie viele offene Ruckrufe gibt es?" → show count in toast
- "Gehe zu Nachrichten" → navigate to /nachrichten

**Implementation**: Web Speech API for recognition → send transcript to `/api/ai/voice-command` → AI parses intent → execute action (navigate, filter, create)

---

## Design System

**Colors** (CSS Variables in globals.css):
- `--primary`: 199 89% 48% (Trust Blue #0ea5e9)
- `--accent`: 6 100% 68% (Warm Coral #ff6b5b)
- `--success`: 160 84% 39% (Green)
- `--warning`: 38 92% 50% (Amber)
- `--destructive`: 0 84% 60% (Red)
- Dark mode fully supported

**Typography**: Inter font, German UI labels

**Spacing**: 8px grid system

**Border Radius**: 8px standard, 12px cards, 16px dialogs

---

## Verification / Testing

1. **Run dev server**: `npm run dev` → verify http://localhost:3007/ loads
2. **Navigation**: Click each sidebar item → all 5 module pages render
3. **Werkstatt Kanban**: Drag vehicle cards between columns → state updates
4. **Callcenter**: Click "Als erledigt markieren" → status changes, timer stops
5. **KI-Inserate**: Click "KI-Beschreibung generieren" → mock AI text appears in copilot panel
6. **Nachrichten**: Click conversation → thread view opens, channel badge matches
7. **KYC**: Toggle between Privat/Gewerbe → correct form fields appear
8. **Voice Button**: Click mic → browser asks for mic permission → listening state appears
9. **Responsive**: Resize browser → sidebar collapses, mobile nav appears
10. **Dark Mode**: Toggle → all components adapt correctly
