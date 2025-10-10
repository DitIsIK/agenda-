"use client";

import { ChangeEvent, useState } from "react";
import Papa from "papaparse";
import { addMinutes, addWeeks } from "date-fns";
import { rrulestr } from "rrule";

import { useEvents } from "./EventProvider";

interface CsvRow {
  title?: string;
  start?: string;
  end?: string;
  location?: string;
  type?: string;
  description?: string;
  rrule?: string;
  course_code?: string;
  locked?: string;
}

const parseBoolean = (value?: string) => {
  if (!value) return false;
  return ["true", "1", "yes", "locked"].includes(value.toLowerCase());
};

export function CsvImportWizard() {
  const { importEvents } = useEvents();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus(null);
    setError(null);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV bevat ${results.errors.length} fouten. Controleer de opmaak.`);
          return;
        }

        try {
          const parsedEvents = results.data.flatMap((row) => {
            if (!row.start || !row.title) {
              return [];
            }

            const startDate = new Date(row.start);
            if (Number.isNaN(startDate.getTime())) {
              return [];
            }

            const endDate = row.end ? new Date(row.end) : addMinutes(startDate, 60);
            const locked = row.type?.toLowerCase() === "lesson" || parseBoolean(row.locked);

            const baseEvent = {
              title: row.title,
              start: startDate,
              end: Number.isNaN(endDate.getTime()) ? addMinutes(startDate, 60) : endDate,
              type: (row.type ?? "lesson").toLowerCase(),
              location: row.location,
              description: row.description,
              locked,
              source: "csv" as const,
              meta: row.course_code ? { courseCode: row.course_code } : undefined,
            };

            if (!row.rrule) {
              return [baseEvent];
            }

            try {
              const rule = rrulestr(row.rrule, {
                dtstart: startDate,
              });

              const until = addWeeks(startDate, 12);
              const duration = baseEvent.end.getTime() - baseEvent.start.getTime();

              const occurrences = rule.between(startDate, until, true);

              if (occurrences.length === 0) {
                return [baseEvent];
              }

              return occurrences.map((date) => ({
                ...baseEvent,
                start: date,
                end: new Date(date.getTime() + duration),
              }));
            } catch (rruleError) {
              console.error("RRULE fout", rruleError);
              return [baseEvent];
            }
          });

          if (parsedEvents.length === 0) {
            setError("Geen geldige regels gevonden in het CSV-bestand.");
            return;
          }

          importEvents(parsedEvents);
          setStatus(`${parsedEvents.length} events succesvol geïmporteerd.`);
        } catch (importError) {
          console.error(importError);
          setError("Er is iets misgegaan bij het importeren. Probeer opnieuw.");
        }
      },
    });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">CSV-import</h2>
        <p className="text-xs text-slate-500">Upload een CSV met kolommen title,start,end,type,location,rrule.</p>
      </header>
      <div className="space-y-3">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 transition hover:border-brand hover:bg-brand/5">
          <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
          <span className="font-medium text-brand">Kies CSV-bestand</span>
          <span className="text-xs text-slate-500">Ondersteunt terugkerende lessen via RRULE.</span>
        </label>
        {status ? <p className="rounded-xl bg-study/10 px-3 py-2 text-xs text-study">{status}</p> : null}
        {error ? <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p> : null}
      </div>
      <footer className="mt-4 space-y-2 text-xs text-slate-500">
        <p>Voorbeeldregel:</p>
        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-slate-100">
title,start,end,type,location,rrule
Marketing College,"2024-09-02T10:00:00","2024-09-02T12:00:00",lesson,Aula,"FREQ=WEEKLY;BYDAY=MO;COUNT=10"
        </pre>
      </footer>
    </section>
  );
}
