"use client";

import { FormEvent, useMemo, useState } from "react";
import { addHours } from "date-fns";

import { useEvents } from "./EventProvider";

const eventTypes = [
  { value: "lesson", label: "Les" },
  { value: "study", label: "Studie" },
  { value: "exam", label: "Toets" },
  { value: "task", label: "Taak" },
];

export function QuickAddForm() {
  const { addEvent } = useEvents();
  const defaultStart = useMemo(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.toISOString().slice(0, 16);
  }, []);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("lesson");
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(addHours(new Date(defaultStart), 1).toISOString().slice(0, 16));
  const [locked, setLocked] = useState(type === "lesson");

  const reset = () => {
    setTitle("");
    setType("lesson");
    const nextStart = new Date();
    nextStart.setMinutes(0, 0, 0);
    setStart(nextStart.toISOString().slice(0, 16));
    setEnd(addHours(nextStart, 1).toISOString().slice(0, 16));
    setLocked(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const startDate = new Date(start);
    const endDate = new Date(end);

    addEvent({
      title: title || "Nieuw event",
      type,
      start: startDate,
      end: endDate,
      locked,
      source: "manual",
    });

    reset();
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Snel toevoegen</h2>
          <p className="text-xs text-slate-500">Maak een les, studieblok of taak rechtstreeks vanuit de agenda.</p>
        </div>
      </header>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="quick-title">
            Titel
          </label>
          <input
            id="quick-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Bijv. Werkgroep of Studieblok"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600" htmlFor="quick-type">
              Type
            </label>
            <select
              id="quick-type"
              value={type}
              onChange={(event) => {
                const newType = event.target.value;
                setType(newType);
                if (newType === "lesson" || newType === "exam") {
                  setLocked(true);
                } else {
                  setLocked(false);
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {eventTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600" htmlFor="quick-locked">
              Vergrendeld
            </label>
            <button
              id="quick-locked"
              type="button"
              onClick={() => setLocked((prev) => !prev)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm shadow-inner transition ${
                locked
                  ? "border-brand bg-brand text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand"
              }`}
            >
              <span>{locked ? "Ja, houdt vast" : "Nee, mag verschuiven"}</span>
              <span className="text-xs uppercase">{locked ? "LOCKED" : "FLEX"}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600" htmlFor="quick-start">
              Start
            </label>
            <input
              id="quick-start"
              type="datetime-local"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600" htmlFor="quick-end">
              Einde
            </label>
            <input
              id="quick-end"
              type="datetime-local"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-hover"
        >
          Opslaan in agenda
        </button>
      </form>
    </section>
  );
}
