"use client";

import { FormEvent, useMemo, useState } from "react";
import { addDays, format } from "date-fns";

import { parseChapters, StudyRequest } from "@/lib/calendar";

import { useEvents } from "./EventProvider";

const dayMap: Record<string, number> = {
  zondag: 0,
  maandag: 1,
  dinsdag: 2,
  woensdag: 3,
  donderdag: 4,
  vrijdag: 5,
  zaterdag: 6,
};

const monthMap: Record<string, number> = {
  januari: 0,
  februari: 1,
  maart: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  augustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  december: 11,
};

const monthRegex = new RegExp(Object.keys(monthMap).join("|"), "i");

interface ParsedPrompt {
  course?: string;
  examDate?: Date;
  estimatedHours?: number;
  chapters?: string[];
  avoidDays?: number[];
  avoidLateHours?: boolean;
}

const parseStudyPrompt = (input: string): ParsedPrompt => {
  const normalized = input.toLowerCase();
  const result: ParsedPrompt = {};

  const hoursMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*uur/);
  if (hoursMatch) {
    result.estimatedHours = parseFloat(hoursMatch[1].replace(",", "."));
  }

  const daysMatch = normalized.match(/over\s+(\d+)\s+dagen?/);
  if (daysMatch) {
    result.examDate = addDays(new Date(), Number.parseInt(daysMatch[1], 10));
  }

  const dateMatch = normalized.match(/(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/);
  if (dateMatch) {
    const day = Number.parseInt(dateMatch[1], 10);
    const month = Number.parseInt(dateMatch[2], 10) - 1;
    const year = dateMatch[3] ? Number.parseInt(dateMatch[3], 10) : new Date().getFullYear();
    result.examDate = new Date(year, month, day, 9, 0, 0, 0);
  }

  const monthNameMatch = normalized.match(new RegExp(`(\d{1,2})\s*(${monthRegex.source})`, "i"));
  if (monthNameMatch) {
    const day = Number.parseInt(monthNameMatch[1], 10);
    const monthName = monthNameMatch[2].toLowerCase();
    const monthIndex = monthMap[monthName];
    const currentYear = new Date().getFullYear();
    result.examDate = new Date(currentYear, monthIndex, day, 9, 0, 0, 0);
  }

  const courseMatch = input.match(/toets\s+([A-Za-zÀ-ÿ0-9&\- ]+)/i) ?? input.match(/voor\s+([A-Za-zÀ-ÿ0-9&\- ]+)\s+examen/i);
  if (courseMatch) {
    result.course = courseMatch[1].trim();
  }

  const chaptersMatch = input.match(/hoofdstukken?\s+([0-9,\- en]+)/i);
  if (chaptersMatch) {
    result.chapters = parseChapters(chaptersMatch[1]);
  }

  const avoidDays: number[] = [];
  Object.entries(dayMap).forEach(([label, index]) => {
    if (new RegExp(`geen\s+${label}|vermijd\s+${label}`, "i").test(input)) {
      avoidDays.push(index);
    }
  });

  if (/zondag\s+vrij/.test(normalized) && !avoidDays.includes(0)) {
    avoidDays.push(0);
  }

  if (avoidDays.length > 0) {
    result.avoidDays = Array.from(new Set(avoidDays));
  }

  if (/niet\s+na|na\s+22|geen\s+late/.test(normalized)) {
    result.avoidLateHours = true;
  }

  return result;
};

export function StudyPlanner() {
  const { planStudyRequest, lastPlan, warnings, clearWarnings } = useEvents();
  const [prompt, setPrompt] = useState("Over 12 dagen toets Marketing. 8 uur leren. Hoofdstukken 1-6. Niet na 22:00. Zondag vrij.");
  const defaultExamDate = useMemo(() => addDays(new Date(), 14).toISOString().slice(0, 10), []);
  const [course, setCourse] = useState("Marketing");
  const [examDate, setExamDate] = useState(defaultExamDate);
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [chapters, setChapters] = useState("1-6");
  const [avoidSunday, setAvoidSunday] = useState(true);
  const [avoidLate, setAvoidLate] = useState(true);
  const [additionalAvoidDays, setAdditionalAvoidDays] = useState<number[]>([]);

  const handleParse = () => {
    const parsed = parseStudyPrompt(prompt);
    if (parsed.course) setCourse(parsed.course);
    if (parsed.examDate) setExamDate(parsed.examDate.toISOString().slice(0, 10));
    if (parsed.estimatedHours) setEstimatedHours(parsed.estimatedHours);
    if (parsed.chapters) setChapters(parsed.chapters.join(","));
    if (parsed.avoidDays) {
      setAvoidSunday(parsed.avoidDays.includes(0));
      setAdditionalAvoidDays(parsed.avoidDays.filter((day) => day !== 0));
    }
    if (parsed.avoidLateHours) setAvoidLate(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const request: StudyRequest = {
      course: course || "Studie",
      examDate: new Date(examDate),
      estimatedHours: Number(estimatedHours),
      chapters: parseChapters(chapters),
      avoidDays: Array.from(
        new Set([
          ...(avoidSunday ? [0] : []),
          ...additionalAvoidDays,
        ])
      ),
      avoidLateHours: avoidLate,
    };

    planStudyRequest(request);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">AI Studieplanner</h2>
          <p className="text-xs text-slate-500">Analyseer een vrije tekst en plan blokken automatisch in de agenda.</p>
        </div>
        <button
          type="button"
          onClick={handleParse}
          className="rounded-xl border border-brand px-3 py-1 text-xs font-semibold text-brand transition hover:bg-brand/10"
        >
          Analyseer
        </button>
      </header>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="study-prompt">
            Opdracht
          </label>
          <textarea
            id="study-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600" htmlFor="study-course">
              Vak
            </label>
            <input
              id="study-course"
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600" htmlFor="study-exam-date">
              Examendatum
            </label>
            <input
              id="study-exam-date"
              type="date"
              value={examDate}
              onChange={(event) => setExamDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600" htmlFor="study-hours">
              Uren
            </label>
            <input
              id="study-hours"
              type="number"
              min={1}
              value={estimatedHours}
              onChange={(event) => setEstimatedHours(Number(event.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600" htmlFor="study-chapters">
              Hoofdstukken
            </label>
            <input
              id="study-chapters"
              value={chapters}
              onChange={(event) => setChapters(event.target.value)}
              placeholder="Bijv. 1-6 of 1,2,3"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setAvoidSunday((prev) => !prev)}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm shadow-inner transition ${
              avoidSunday
                ? "border-brand bg-brand/10 text-brand"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand"
            }`}
          >
            <span>Zondag vrijhouden</span>
            <span className="text-xs uppercase">{avoidSunday ? "AAN" : "UIT"}</span>
          </button>
          <button
            type="button"
            onClick={() => setAvoidLate((prev) => !prev)}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm shadow-inner transition ${
              avoidLate
                ? "border-brand bg-brand/10 text-brand"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand"
            }`}
          >
            <span>Niet na 22:00</span>
            <span className="text-xs uppercase">{avoidLate ? "AAN" : "UIT"}</span>
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {Object.entries(dayMap)
            .filter(([, index]) => index !== 0)
            .map(([label, index]) => {
              const active = additionalAvoidDays.includes(index);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setAdditionalAvoidDays((prev) =>
                      prev.includes(index)
                        ? prev.filter((value) => value !== index)
                        : [...prev, index]
                    )
                  }
                  className={`rounded-xl border px-3 py-2 text-xs font-medium capitalize transition ${
                    active ? "border-brand bg-brand/10 text-brand" : "border-slate-200 text-slate-500 hover:border-brand"
                  }`}
                >
                  Vermijd {label}
                </button>
              );
            })}
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-study px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-study/90"
        >
          Plan studieblokken
        </button>
      </form>

      {lastPlan ? (
        <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Nieuw studieplan</p>
          <ul className="space-y-1">
            <li>Vak: {lastPlan.request.course}</li>
            <li>Blokken: {lastPlan.result.plannedEvents.length}</li>
            <li>
              Examendatum: {format(lastPlan.request.examDate, "dd MMM yyyy")}
            </li>
          </ul>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="mt-3 space-y-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Waarschuwingen</span>
            <button type="button" className="underline" onClick={clearWarnings}>
              Verberg
            </button>
          </div>
          <ul className="list-disc space-y-1 pl-5">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
