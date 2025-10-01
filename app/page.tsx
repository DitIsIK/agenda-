import Link from "next/link";

import { CalendarCheck, Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

const actions = [
  {
    title: "Importeer je rooster",
    description:
      "Upload een CSV-bestand met colleges, werkgroepen en practica om je basisagenda te vullen.",
    icon: Upload,
  },
  {
    title: "Plan je studies",
    description:
      "Vertaal natuurlijke taal naar concrete studieblokken met slimme defaults en duidelijke doelen.",
    icon: Sparkles,
  },
  {
    title: "Blijf in controle",
    description:
      "Versleep events direct in de weekview en los conflicten op zonder je vaste verplichtingen te breken.",
    icon: CalendarCheck,
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-slate-50 to-white px-6 py-16 text-center">
      <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand shadow-soft">
        Slimme AI Agenda
      </span>
      <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
        Bouw een agenda die met je meebeweegt — lessen, studieblokken en toetsen in één strak overzicht.
      </h1>
      <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
        Deze MVP richt zich op een betrouwbare basis: CSV-import voor je lesrooster, handmatige events, en een
        AI-gestuurde planner die rekening houdt met je grenzen.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button className="shadow-soft">Projectstructuur bekijken</Button>
        <Button variant="outline">Volgende stap voorbereiden</Button>
        <Button asChild className="shadow-soft">
          <Link href="/calendar">Open agenda</Link>
        </Button>
      </div>
      <div className="mt-12 grid w-full max-w-5xl gap-6 md:grid-cols-3">
        {actions.map((action) => (
          <article
            key={action.title}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-soft transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <action.icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">{action.title}</h2>
            <p className="text-sm text-slate-600">{action.description}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
