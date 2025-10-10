"use client";

import { useState } from "react";

import { requestPlannerEvents, type PlannerAPIEvent } from "@/lib/aiPlanner";
import { hasConflict } from "@/lib/eventUtils";
import { CalendarEvent, EventType } from "@/lib/types";
import { useEventsStore } from "@/lib/useEventsStore";

type PlannerState =
  | { kind: "idle" }
  | { kind: "error"; message: string; warnings: string[] }
  | { kind: "success"; summary: string; planned: Array<Pick<CalendarEvent, "title" | "start" | "end">>; warnings: string[] };

const ALLOWED_TYPES: EventType[] = ["lesson", "study", "task", "exam"];

function parsePlannerEvents(events: PlannerAPIEvent[]): {
  parsed: Array<Omit<CalendarEvent, "id">>;
  warnings: string[];
} {
  const warnings: string[] = [];
  const parsed: Array<Omit<CalendarEvent, "id">> = [];

  for (const [index, event] of events.entries()) {
    if (!event || typeof event !== "object") {
      warnings.push(`Event ${index + 1} heeft geen geldig formaat.`);
      continue;
    }

    const title = typeof event.title === "string" && event.title.trim().length > 0 ? event.title.trim() : null;
    const typeCandidate = typeof event.type === "string" ? (event.type.trim().toLowerCase() as EventType) : undefined;
    const type = typeCandidate && ALLOWED_TYPES.includes(typeCandidate) ? typeCandidate : "study";
    const start = new Date(event.start ?? "");
    const end = new Date(event.end ?? "");

    if (!title) {
      warnings.push(`Event ${index + 1} mist een titel.`);
      continue;
    }

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      warnings.push(`Event "${title}" bevat ongeldige datums.`);
      continue;
    }

    if (end.getTime() <= start.getTime()) {
      warnings.push(`Event "${title}" heeft een eindtijd vóór of gelijk aan de starttijd.`);
      continue;
    }

    parsed.push({
      title,
      type,
      start,
      end,
      location: typeof event.location === "string" ? event.location : undefined,
      locked: Boolean(event.locked),
      notes: typeof event.description === "string" ? event.description : undefined,
    });
  }

  return { parsed, warnings };
}

export function AIPlanner() {
  const events = useEventsStore((store) => store.events);
  const add = useEventsStore((store) => store.add);

  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [feedback, setFeedback] = useState<PlannerState>({ kind: "idle" });

  const handlePlan = async () => {
    if (!prompt.trim()) {
      setFeedback({ kind: "error", message: "Beschrijf wat je wilt plannen.", warnings: [] });
      return;
    }

    setStatus("loading");
    setFeedback({ kind: "idle" });

    try {
      const apiEvents = await requestPlannerEvents(prompt);
      const { parsed, warnings } = parsePlannerEvents(apiEvents);

      if (!parsed.length) {
        setFeedback({
          kind: "error",
          message: "Geen geldige studieblokken ontvangen van de planner.",
          warnings,
        });
        return;
      }

      const added: Array<Pick<CalendarEvent, "title" | "start" | "end">> = [];
      const accepted: CalendarEvent[] = [];
      const conflicts: string[] = [];

      for (const event of parsed) {
        const candidate: CalendarEvent = { ...event, id: `candidate-${event.start.getTime()}` };
        const conflict = hasConflict([...events, ...accepted], candidate);
        if (conflict) {
          conflicts.push(`Event "${event.title}" overlapt met een bestaand item.`);
          continue;
        }

        const created = add({
          title: event.title,
          type: event.type,
          start: event.start,
          end: event.end,
          location: event.location,
          locked: event.locked,
          notes: event.notes,
        });
        added.push({ title: created.title, start: created.start, end: created.end });
        accepted.push(created);
      }

      if (!added.length) {
        setFeedback({
          kind: "error",
          message: "Alle blokken botsten met bestaande events of waren ongeldig.",
          warnings: [...warnings, ...conflicts],
        });
        return;
      }

      const totalHours = added.reduce((acc, item) => acc + (item.end.getTime() - item.start.getTime()) / 3_600_000, 0);
      setFeedback({
        kind: "success",
        summary: `Gepland ${added.length} blokken (${totalHours.toFixed(1)} uur).`,
        planned: added,
        warnings: [...warnings, ...conflicts],
      });
      setPrompt("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message || "Onbekende fout bij het aanroepen van de planner."
          : "Onbekende fout bij het aanroepen van de planner.";
      setFeedback({ kind: "error", message, warnings: [] });
    } finally {
      setStatus("idle");
    }
  };

  return (
    <section className="flex h-full flex-col gap-4 rounded-2xl bg-white p-4 text-sm shadow-sm">
      <header className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">AI-planner</h2>
        <p className="text-sm text-slate-600">
          Beschrijf je studie-opdracht. Voorbeeld: “Over 10 dagen toets Marketing. 8 uur leren. Niet na 22:00. Zondag vrij.”
        </p>
      </header>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={5}
        className="min-h-[140px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        placeholder="Beschrijf wat je wilt plannen"
      />

      <button
        type="button"
        onClick={handlePlan}
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
      >
        {status === "loading" ? "Plannen…" : "Plan studieblokken"}
      </button>

      {feedback.kind === "error" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p className="font-medium">{feedback.message}</p>
          {feedback.warnings.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {feedback.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {feedback.kind === "success" ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <p className="font-medium">{feedback.summary}</p>
            {feedback.warnings.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-emerald-800">
                {feedback.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <ul className="space-y-2 text-sm text-slate-700">
            {feedback.planned.map((event, index) => (
              <li key={`${event.start.getTime()}-${index}`} className="rounded-xl bg-slate-100 px-3 py-2">
                <p className="font-medium">{event.title}</p>
                <p className="text-xs text-slate-500">
                  {event.start.toLocaleString("nl-NL", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" – "}
                  {event.end.toLocaleString("nl-NL", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
