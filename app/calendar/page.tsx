import type { Metadata } from "next";

import WeekView from "@/components/calendar/WeekView";

export const metadata: Metadata = {
  title: "Agenda | Slimme AI Agenda",
  description:
    "Bekijk je lessen, studieblokken en toetsen in één overzichtelijke weekweergave.",
};

export default function CalendarPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand shadow-soft">
          Agenda
        </span>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Jouw week in beeld</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Dit is een demo-weergave van de Slimme AI Agenda. Binnenkort zie je hier je geïmporteerde lessen,
          studieplannen en toetsen overzichtelijk naast elkaar.
        </p>
      </header>
      <WeekView />
    </main>
  );
}
