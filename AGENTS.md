# agents.md — Slimme AI Agenda

## Verhaal

Je opent de app. Eerst importeer je je lesrooster via CSV. De app zet elk college, werkgroep en practicum strak in je agenda. Dat is je **basislaag**.

Dan zeg je:  
“Over 12 dagen toets Marketing. 8 uur leren. Hoofdstukken 1–6. Niet na 22:00. Zondag vrij.”

De **NLP-router** vertaalt dat naar een gestructureerde opdracht: vak = Marketing, deadline = 12 dagen vanaf nu, studie-uren = 8, hoofdstukken = H1–H6, constraints = geen zondag, geen late uren.

De **Planning Agent** bekijkt je bestaande events (lessen, werk, sport), berekent vrije blokken, hakt 8 uur in happen van ~50 minuten, en plant die slim vóór de toets. Altijd met minimaal één reviewblok in de laatste 48 uur. Alles komt terug in je agenda:
- Blauw = lessen  
- Groen = studeren  
- Rood = toetsen  
- Grijs = overige taken

Verandert er iets (docent dropt een gastcollege)? De **Conflict Resolver** verschuift je studieblokken zonder je vaste dingen te slopen. Locked blijft locked.

Kort: jij praat, de app plant — **rond** je leven, niet erdoorheen.

---

## Wat de AI moet bouwen

1. **CSV-import lesrooster**
   - Leest kolommen `title,start,end,location,type,description,rrule,course_code`.
   - Minimaal nodig: `title,start,end`.
   - RRULE ondersteunen (wekelijks, BYDAY, COUNT/UNTIL).
   - Events opslaan met `type=lesson`, `source=csv`.

2. **Handmatige events & taken**
   - Quick Add formulier en drag & drop in weekview.
   - `locked=true` = niet herplannen.

3. **NLP → StudyRequest**
   - Vrije tekst → JSON (`course`, `exam_date`, `estimated_hours`, `chapters[]`, `avoid_days[]`, `avoid_hours`, …).
   - Defaults: blok 50 min, max 180 min/dag, zondag vrij? user setting.

4. **Planning Engine**
   - Berekent vrije blokken, splitst uren in blokken, plant slim vóór deadline.
   - Altijd review in laatste 48u.
   - Output → draft events → na confirm opslaan.

5. **Conflict Resolver**
   - Botsingen oplossen, study blokken verplaatsen, locked respecteren.
   - Bij tekort aan tijd: status `needs_attention`.

6. **UI**
   - Week/maand-view met kleurcodes.
   - CSV import wizard (upload → mappen → preview).
   - “Plan Studie” drawer met heatmap en live blokken.
   - Conflict badges + herplan-knop.

---

## Techstack

**Frontend**
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui + lucide-react
- react-hook-form + zod
- date-fns, rrule, papaparse
- react-big-calendar of FullCalendar (drag&drop kalender)

**Backend**
- Next.js API Routes (Edge waar kan)
- Supabase (Postgres + RLS) voor DB & Auth
- OpenAI Responses API (NLP + Planner)
- ICS export voor sync

**Infra**
- Deploy: Vercel
- Supabase Cloud
- Sentry (frontend + server)
- Vercel Cron / Supabase Jobs voor replan

**Testing**
- Vitest (unit)
- Playwright (E2E: CSV import, planner, DnD)
- Schema validatie met zod

**Lint/Format**
- ESLint (next/core-web-vitals), Prettier, Husky

**Env Vars**
```

NEXT_PUBLIC_APP_URL=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE=
SENTRY_DSN=

```

---

## Data Model

**events**
- id, user_id, title, description, type (`lesson|study|task|exam|other`)
- start, end, location, source (`csv|ai|manual`)
- recurrence_rule?, priority?, locked?, meta jsonb

**study_requests**
- id, user_id, course, exam_date, estimated_hours
- chapters[], deadline_buffer_days, preferred_block_minutes, max_daily_minutes
- avoid_days[], avoid_hours, status (`draft|planned|completed|cancelled`)

**constraints**
- user_id, timezone, earliest_start, latest_end
- min_block_minutes, max_block_minutes
- break_minutes, default_padding_minutes

---

## API Endpoints

- `POST /api/import/csv` → events toevoegen
- `POST /api/study/request` → nieuwe StudyRequest opslaan + trigger plan
- `POST /api/study/plan/:id` → herplannen
- `POST /api/events` → handmatig event
- `GET /api/events?from&to` → lijst met events (RRULE expanded)

---

## Planner Prompt (OpenAI Responses API)

```

Je bent een strikte, minimalistische planner.
Maak een studieplanning in compacte blokken, binnen tijd/dag-constraints.
Verplaats nooit locked of bestaande les-events.
Reserveer minstens één reviewblok in de laatste 24–48 uur.
Output alleen JSON conform schema.

````

Schema:
```json
{
  "study_blocks": [
    {
      "title": "Marketing – Blok 1: H1–H2",
      "date": "2025-10-08",
      "start": "16:00",
      "end": "16:50",
      "notes": "Kernbegrippen + oefenvragen",
      "chapter_refs": ["H1","H2"]
    }
  ],
  "warnings": []
}
```

---

## Design & UX — Modern, Clean, Simpel

### Principes

* **Less, but better**: één primaire actie per scherm
* **Direct manipuleren**: drag & drop first
* **Sterke defaults**: minimale user input
* **Rust en focus**: witruimte, duidelijke typografie, weinig kleuren
* **Instant feedback**: subtiele toasts en badges
* **Toegankelijk**: AA contrast, focus states, toetsenbord support

### Visuele stijl

* Font: Inter of Geist, body 16px
* Kleuren:

  * Lesson = blauw, Study = groen, Exam = rood, Task = grijs
* Randen: rounded-2xl, shadow-md
* Animaties: 150–200ms ease-out
* Iconen: lucide-react (minimal)

### UI-flow

1. **Home (lege staat)**: CSV import of Toets plannen
2. **CSV Wizard**: upload → map → preview
3. **Calendar (week default)**: quick add bovenin, plan drawer rechts
4. **Conflicts**: badge + herplan
5. **Confirm drafts**: knop “Opslaan in agenda” + undo

### Componenten

* shadcn/ui: Button, Drawer, Card, Badge, Toast, Calendar
* Kalender: FullCalendar / react-big-calendar
* Quick Add: sticky bovenin, enter=submit

### Microcopy

* “Nog geen lessen. Importeer je CSV en we regelen de rest.”
* “Botsing met Gastcollege. Zal ik je studieblok verplaatsen?”
* “Planning aangemaakt: 8 blokken, review op 17 okt 16:00”

### Acceptatiecriteria UX

* ≤ 60s voor import of eerste planning
* ≤ 6 velden voor StudyRequest
* Drag & drop soepel
* Conflicts oplosbaar in ≤ 2 kliks
* Donker/licht thema beide clean

### Tailwind config snippet

```ts
colors: {
  brand: { DEFAULT: '#2563EB', hover: '#1D4ED8' },
  study: '#16A34A',
  exam: '#DC2626',
  lesson: '#2563EB',
  task: '#71717A'
},
borderRadius: { xl: '1rem', '2xl': '1.25rem' },
boxShadow: { soft: '0 8px 20px -8px rgba(0,0,0,0.12)' }
```

---

## File-structuur

```
app/
  api/
    import/csv/route.ts
    study/request/route.ts
    study/plan/[id]/route.ts
    events/route.ts
  (routes)/planner/page.tsx
  (routes)/calendar/page.tsx
components/
  calendar/WeekView.tsx
  import/CSVWizard.tsx
  study/PlanDrawer.tsx
lib/
  csv/parseCsv.ts
  time/availability.ts
  time/rrule.ts
  ai/router.ts
  ai/planner.ts
  db/client.ts
tests/
```

---

## Roadmap

* v0: CSV import + basisplanner + draft confirm
* v1: ICS export + drag&drop + conflict UI
* v2: Multi-toets planning + study velocity
* v3: Google/Apple Calendar sync
* v4: Team/klas-modus

---

## Acceptatiecriteria eindproduct

* CSV met lessen → direct zichtbaar in weekview
* NLP input → valide StudyRequest JSON
* Planner → verdeelt uren correct, reviewblok aanwezig
* Locked events onaangetast bij herplan
* Conflicts opgelost met 1 klik
* UI clean, snel, intuïtief

```
---


```
