"use client";

import { useMemo, useState } from "react";

import { planStudyBlocks } from "@/lib/aiPlanner";
import { useEventsStore } from "@/lib/useEventsStore";

type PlannerFeedback =
  | { kind: "idle" }
  | { kind: "error"; message: string; warnings: string[] }
  | {
      kind: "success";
      summary: string;
      warnings: string[];
      events: Array<{ title: string; start: Date; end: Date }>;
    };

type TabKey = "ai";

const tabs: Array<{ id: TabKey; label: string }> = [{ id: "ai", label: "AI-planner" }];

export function RightDock() {
  const events = useEventsStore((store) => store.events);
  const add = useEventsStore((store) => store.add);

  const [activeTab, setActiveTab] = useState<TabKey>("ai");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState<PlannerFeedback>({ kind: "idle" });
  const [isPlanning, setIsPlanning] = useState(false);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("nl-NL", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const handlePlan = () => {
    if (!description.trim()) {
      setFeedback({ kind: "error", message: "Beschrijf wat je wilt plannen.", warnings: [] });
      return;
    }

    setIsPlanning(true);
    try {
      const result = planStudyBlocks(description, events);

      if (result.events.length === 0) {
        const message =
          result.warnings[0] ?? "Geen studieblokken gepland. Controleer je beschrijving en probeer het opnieuw.";
        setFeedback({ kind: "error", message, warnings: result.warnings.slice(1) });
        return;
      }

      result.events.forEach((event) => {
        add({
          title: event.title,
          type: event.type,
          start: event.start,
          end: event.end,
          location: event.location,
          locked: event.locked,
          notes: event.notes,
        });
      });

      const totalHours = result.events.reduce((sum, event) => sum + (event.end.getTime() - event.start.getTime()) / 3_600_000, 0);
      const summary = `Gepland ${result.events.length} blokken (${totalHours.toFixed(1)} uur).`;
      setFeedback({
        kind: "success",
        summary,
        warnings: result.warnings,
        events: result.events.map((event) => ({ title: event.title, start: event.start, end: event.end })),
      });
      setDescription("");
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <aside className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-3 py-1 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "ai" ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Plan studieblokken</h2>
            <p className="mt-1 text-sm text-slate-600">
              Beschrijf wat je moet leren, hoeveel uur en eventuele voorkeuren. Voorbeeld: “Over 10 dagen toets Marketing. 8 uur
              leren. Niet na 22:00. Zondag vrij.”
            </p>
          </div>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            placeholder="Beschrijf hier je opdracht"
          />

          <button
            type="button"
            onClick={handlePlan}
            disabled={isPlanning}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {isPlanning ? "Bezig met plannen…" : "Plan studieblokken"}
          </button>

          {feedback.kind === "error" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <p>{feedback.message}</p>
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
                {feedback.events.map((event, index) => (
                  <li key={`${event.start.getTime()}-${index}`} className="rounded-xl bg-slate-100 px-3 py-2">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-slate-500">
                      {formatter.format(event.start)} – {formatter.format(event.end)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
