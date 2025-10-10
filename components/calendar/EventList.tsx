"use client";

import { format } from "date-fns";
import { nl } from "date-fns/locale";

import { useEvents } from "./EventProvider";

export function EventList() {
  const { events, toggleLock, removeEvent } = useEvents();
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, 10);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <h2 className="text-sm font-semibold text-slate-900">Agenda items</h2>
      <p className="text-xs text-slate-500">Klik om te vergrendelen of verwijder studieblokken.</p>
      <ul className="mt-3 space-y-2 text-xs text-slate-600">
        {sorted.map((event) => (
          <li
            key={event.id}
            className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"
          >
            <div>
              <p className="font-semibold text-slate-800">{event.title}</p>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                {format(event.start, "EEE dd MMM HH:mm", { locale: nl })} – {format(event.end, "HH:mm", { locale: nl })}
              </p>
              <p className="text-[11px] text-slate-400">{event.type.toUpperCase()}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={() => toggleLock(event.id)}
                className={`rounded-xl border px-2 py-1 text-[11px] font-semibold transition ${
                  event.locked ? "border-slate-300 bg-white text-slate-600" : "border-brand bg-brand/10 text-brand"
                }`}
              >
                {event.locked ? "Unlock" : "Lock"}
              </button>
              {event.source === "ai" || event.type === "study" ? (
                <button
                  type="button"
                  onClick={() => removeEvent(event.id)}
                  className="rounded-xl border border-destructive px-2 py-1 text-[11px] font-semibold text-destructive transition hover:bg-destructive/10"
                >
                  Verwijder
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
