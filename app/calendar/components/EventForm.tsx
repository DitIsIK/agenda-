"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import { CalendarEvent, EventType } from "@/lib/types";

type FormMode = "create" | "edit";

type EventDraft = {
  id?: string;
  title: string;
  type: EventType;
  start: Date;
  end: Date;
  location?: string;
  locked: boolean;
  notes?: string;
};

interface EventFormProps {
  open: boolean;
  mode: FormMode;
  initialEvent?: Partial<CalendarEvent>;
  onClose: () => void;
  onSubmit: (event: EventDraft) => void;
  onDelete?: (id: string) => void;
}

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "lesson", label: "Les" },
  { value: "study", label: "Studie" },
  { value: "task", label: "Taak" },
  { value: "exam", label: "Toets" },
];

export function EventForm({ open, mode, initialEvent, onClose, onSubmit, onDelete }: EventFormProps) {
  const [draft, setDraft] = useState<EventDraft>(() => buildInitialDraft(initialEvent));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(buildInitialDraft(initialEvent));
    setError(null);
  }, [initialEvent, open]);

  const title = mode === "create" ? "Nieuw event" : "Event bewerken";
  const deleteEnabled = mode === "edit" && Boolean(draft.id) && typeof onDelete === "function";

  const startValue = useMemo(() => formatLocalInput(draft.start), [draft.start]);
  const endValue = useMemo(() => formatLocalInput(draft.end), [draft.end]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft.end <= draft.start) {
      setError("Eindtijd moet later zijn dan starttijd.");
      return;
    }

    onSubmit({ ...draft });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="event-title">
              Titel
            </label>
            <input
              id="event-title"
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="Bijv. Marketing college"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="event-type">
                Type
              </label>
              <select
                id="event-type"
                value={draft.type}
                onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value as EventType }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="event-location">
                Locatie
              </label>
              <input
                id="event-location"
                value={draft.location ?? ""}
                onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                placeholder="Bijv. Lokaal B2.10"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="event-start">
                Start
              </label>
              <input
                id="event-start"
                type="datetime-local"
                value={startValue}
                onChange={(event) => {
                  const next = event.target.value ? new Date(event.target.value) : new Date();
                  setDraft((prev) => ({ ...prev, start: next }));
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="event-end">
                Einde
              </label>
              <input
                id="event-end"
                type="datetime-local"
                value={endValue}
                onChange={(event) => {
                  const next = event.target.value ? new Date(event.target.value) : new Date();
                  setDraft((prev) => ({ ...prev, end: next }));
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="event-notes">
              Notities
            </label>
            <textarea
              id="event-notes"
              value={draft.notes ?? ""}
              onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="Optioneel"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draft.locked}
              onChange={(event) => setDraft((prev) => ({ ...prev, locked: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
            Vergrendeld (niet verplaatsen)
          </label>

          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

          <div className="flex items-center justify-between pt-2">
            {deleteEnabled ? (
              <button
                type="button"
                onClick={() => draft.id && onDelete?.(draft.id)}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Verwijderen
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
              >
                Opslaan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function buildInitialDraft(event?: Partial<CalendarEvent>): EventDraft {
  const start = event?.start ?? new Date();
  const end = event?.end ?? new Date(start.getTime() + 60 * 60 * 1000);

  return {
    id: event?.id,
    title: event?.title ?? "",
    type: event?.type ?? "lesson",
    start,
    end,
    location: event?.location,
    locked: event?.locked ?? false,
    notes: event?.notes,
  };
}

function formatLocalInput(date: Date) {
  try {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  }
}

export type { EventDraft };
