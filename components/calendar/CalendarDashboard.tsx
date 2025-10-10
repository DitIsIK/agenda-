"use client";

import { format } from "date-fns";
import { nl } from "date-fns/locale";

import WeekView from "./WeekView";
import { ConflictPanel } from "./ConflictPanel";
import { CsvImportWizard } from "./CsvImportWizard";
import { EventList } from "./EventList";
import { QuickAddForm } from "./QuickAddForm";
import { StudyPlanner } from "./StudyPlanner";
import { useEvents } from "./EventProvider";

export function CalendarDashboard() {
  const { events, conflicts } = useEvents();

  const upcomingExam = events
    .filter((event) => event.type === "exam")
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

  const studyBlocks = events.filter((event) => event.type === "study");

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-brand to-brand-hover px-6 py-8 text-white shadow-soft">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.2em]">Slimme AI Agenda</span>
            <h1 className="text-3xl font-semibold">Je week op orde</h1>
            <p className="max-w-2xl text-sm text-white/80">
              Importeer je lessen, voeg taken toe en laat de planner slimme studieblokken creëren met een reviewmoment in de laatste 48 uur.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/15 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">Events totaal</p>
              <p className="text-2xl font-semibold">{events.length}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">Studieblokken</p>
              <p className="text-2xl font-semibold">{studyBlocks.length}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">Conflicten</p>
              <p className="text-2xl font-semibold">{conflicts.length}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">Volgende toets</p>
              <p className="text-base font-semibold">
                {upcomingExam ? format(upcomingExam.start, "dd MMM HH:mm", { locale: nl }) : "Nog niet gepland"}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <WeekView />
            <ConflictPanel />
          </div>
          <aside className="space-y-6">
            <QuickAddForm />
            <CsvImportWizard />
            <StudyPlanner />
            <EventList />
          </aside>
        </div>
      </div>
    </main>
  );
}
