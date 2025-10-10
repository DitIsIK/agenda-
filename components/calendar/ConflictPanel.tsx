"use client";

import { useMemo } from "react";

import { useEvents } from "./EventProvider";

export function ConflictPanel() {
  const { events, conflicts, resolveCurrentConflicts } = useEvents();
  const hasConflicts = conflicts.length > 0;

  const conflictDetails = useMemo(() => {
    const map = new Map(events.map((event) => [event.id, event]));
    return conflicts.map((conflict) => ({
      ...conflict,
      first: map.get(conflict.eventId),
      second: map.get(conflict.conflictingWithId),
    }));
  }, [events, conflicts]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Conflicten</h2>
          <p className="text-xs text-slate-500">Detecteer botsingen en los ze automatisch op.</p>
        </div>
        <button
          type="button"
          onClick={resolveCurrentConflicts}
          className="rounded-xl border border-destructive px-3 py-1 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
        >
          Herplan
        </button>
      </div>

      {hasConflicts ? (
        <ul className="mt-3 space-y-2 text-xs text-slate-600">
          {conflictDetails.map((conflict) => (
            <li key={`${conflict.eventId}-${conflict.conflictingWithId}`} className="rounded-xl bg-destructive/5 p-2">
              <p className="font-semibold text-destructive">
                {conflict.first?.title ?? conflict.eventId} ↔ {conflict.second?.title ?? conflict.conflictingWithId}
              </p>
              <p>{conflict.overlapMinutes} minuten overlap</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-xl bg-slate-50 p-2 text-xs text-slate-500">Geen conflicten gevonden.</p>
      )}
    </section>
  );
}
