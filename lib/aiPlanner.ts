import { addDays, addMinutes, startOfDay } from "date-fns";

import { hasConflict } from "./eventUtils";
import { CalendarEvent } from "./types";

interface StudyPlanRequest {
  totalHours: number;
  blockMinutes: number;
  avoidDays: number[];
  latestEndHour: number;
  earliestStartHour: number;
  examDate?: Date;
  course?: string;
}

export interface PlannedStudyBlocks {
  events: Array<Omit<CalendarEvent, "id">>;
  warnings: string[];
  request: StudyPlanRequest;
}

const DAY_NAMES: Record<string, number> = {
  zondag: 0,
  maandag: 1,
  dinsdag: 2,
  woensdag: 3,
  donderdag: 4,
  vrijdag: 5,
  zaterdag: 6,
};

const DEFAULT_TOTAL_HOURS = 4;
const DEFAULT_BLOCK_MINUTES = 120;
const DEFAULT_EARLIEST_HOUR = 8;
const DEFAULT_LATEST_HOUR = 22;
const SEARCH_WINDOW_DAYS = 21;
const STEP_MINUTES = 30;

export function planStudyBlocks(description: string, existingEvents: CalendarEvent[]): PlannedStudyBlocks {
  const request = parseStudyRequest(description);
  const warnings: string[] = [];

  const totalMinutes = Math.max(Math.round(request.totalHours * 60), 30);
  const planned: Array<Omit<CalendarEvent, "id">> = [];
  const plannedForCheck: CalendarEvent[] = [];

  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    warnings.push("Kon geen studie-uren vinden in je beschrijving.");
    return { events: [], warnings, request };
  }

  const now = new Date();
  if (request.examDate && request.examDate <= now) {
    warnings.push("De opgegeven examendatum ligt in het verleden. Pas je beschrijving aan.");
    return { events: [], warnings, request };
  }

  const searchStart = roundUpToStep(now, STEP_MINUTES);
  const deadline = request.examDate ? startOfDay(request.examDate) : addDays(startOfDay(now), SEARCH_WINDOW_DAYS);

  let remaining = totalMinutes;
  let pointer = new Date(searchStart);

  while (remaining > 0) {
    const duration = Math.min(request.blockMinutes, remaining);
    const slot = findNextSlot({
      startSearch: pointer,
      durationMinutes: duration,
      request,
      existing: existingEvents,
      planned: plannedForCheck,
      deadline,
    });

    if (!slot) {
      warnings.push("Niet genoeg vrije tijd gevonden om alle studieblokken te plannen vóór de deadline.");
      break;
    }

    const eventTitle = request.course ? `Studie: ${request.course}` : "Studieblok";
    const notes = "Gepland via AI-planner";
    const plannedEvent: Omit<CalendarEvent, "id"> = {
      title: eventTitle,
      type: "study",
      start: slot.start,
      end: slot.end,
      locked: false,
      notes,
    };

    planned.push(plannedEvent);
    plannedForCheck.push({ ...plannedEvent, id: `plan-${plannedForCheck.length}` });

    remaining -= duration;
    pointer = new Date(slot.end.getTime());
  }

  if (planned.length === 0 && warnings.length === 0) {
    warnings.push("Geen geschikte momenten gevonden voor studieblokken.");
  }

  return { events: planned, warnings, request };
}

function parseStudyRequest(description: string): StudyPlanRequest {
  const normalized = description.toLowerCase();

  const hoursMatch = description.match(/(\d+(?:[.,]\d+)?)\s*(?:uur|u|hours?)/i);
  const totalHours = hoursMatch ? parseFloat(hoursMatch[1].replace(",", ".")) : DEFAULT_TOTAL_HOURS;

  const avoidDays = new Set<number>();
  for (const [name, index] of Object.entries(DAY_NAMES)) {
    if (normalized.includes(`${name} vrij`) || normalized.includes(`geen ${name}`) || normalized.includes(`vermijd ${name}`)) {
      avoidDays.add(index);
    }
  }

  if (normalized.includes("weekend vrij") || normalized.includes("geen weekend")) {
    avoidDays.add(DAY_NAMES.zaterdag);
    avoidDays.add(DAY_NAMES.zondag);
  }

  const latestMatch = normalized.match(/niet\s+na\s+(\d{1,2})(?::(\d{2}))?/);
  const latestEndHour = clampHour(latestMatch ? parseInt(latestMatch[1], 10) : DEFAULT_LATEST_HOUR);

  const examOffsetMatch = normalized.match(/over\s+(\d+)\s+dagen?/);
  let examDate: Date | undefined;
  if (examOffsetMatch) {
    const days = Number.parseInt(examOffsetMatch[1], 10);
    examDate = addDays(startOfDay(new Date()), days);
  }

  const courseMatch = description.match(/(?:toets|examen|tentamen)\s+([A-Za-zÀ-ÖØ-öø-ÿ0-9\s&-]+)/i);
  const course = courseMatch ? cleanupCourseName(courseMatch[1]) : extractCourseFallback(description);

  return {
    totalHours: totalHours > 0 ? totalHours : DEFAULT_TOTAL_HOURS,
    blockMinutes: DEFAULT_BLOCK_MINUTES,
    avoidDays: Array.from(avoidDays),
    latestEndHour,
    earliestStartHour: DEFAULT_EARLIEST_HOUR,
    examDate,
    course,
  };
}

function findNextSlot({
  startSearch,
  durationMinutes,
  request,
  existing,
  planned,
  deadline,
}: {
  startSearch: Date;
  durationMinutes: number;
  request: StudyPlanRequest;
  existing: CalendarEvent[];
  planned: CalendarEvent[];
  deadline: Date;
}): { start: Date; end: Date } | null {
  const step = STEP_MINUTES;
  const durationMs = durationMinutes * 60 * 1000;

  let dayCursor = startOfDay(startSearch);

  while (dayCursor <= deadline) {
    if (request.examDate && dayCursor >= request.examDate) {
      break;
    }

    const dayOfWeek = dayCursor.getDay();
    if (request.avoidDays.includes(dayOfWeek)) {
      dayCursor = addDays(dayCursor, 1);
      continue;
    }

    const dayStart = setTime(dayCursor, request.earliestStartHour, 0);
    const firstCandidate = dayCursor.getTime() === startOfDay(startSearch).getTime()
      ? maxDate(dayStart, startSearch)
      : dayStart;

    const dayEnd = setTime(dayCursor, request.latestEndHour, 0);

    let timeCursor = roundUpToStep(firstCandidate, step);

    while (timeCursor.getTime() + durationMs <= dayEnd.getTime()) {
      const candidateStart = new Date(timeCursor.getTime());
      const candidateEnd = addMinutes(candidateStart, durationMinutes);

      if (request.examDate && candidateEnd > request.examDate) {
        break;
      }

      const candidate: CalendarEvent = {
        id: `candidate-${candidateStart.getTime()}`,
        title: "Studieblok",
        start: candidateStart,
        end: candidateEnd,
        type: "study",
      };

      if (!hasConflict([...existing, ...planned], candidate)) {
        return { start: candidateStart, end: candidateEnd };
      }

      timeCursor = addMinutes(timeCursor, step);
    }

    dayCursor = addDays(dayCursor, 1);
  }

  return null;
}

function roundUpToStep(date: Date, stepMinutes: number): Date {
  const stepMs = stepMinutes * 60 * 1000;
  const rounded = Math.ceil(date.getTime() / stepMs) * stepMs;
  return new Date(rounded);
}

function maxDate(a: Date, b: Date): Date {
  return new Date(Math.max(a.getTime(), b.getTime()));
}

function setTime(date: Date, hours: number, minutes: number): Date {
  const result = new Date(date.getTime());
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function clampHour(hour: number): number {
  if (!Number.isFinite(hour)) {
    return DEFAULT_LATEST_HOUR;
  }
  return Math.min(23, Math.max(6, hour));
}

function cleanupCourseName(input: string): string {
  const trimmed = input.split(/[.,!]/)[0]?.trim();
  return trimmed.length ? capitaliseWords(trimmed) : "";
}

function extractCourseFallback(description: string): string | undefined {
  const match = description.match(/voor\s+([A-Za-zÀ-ÖØ-öø-ÿ0-9\s&-]+)/i);
  if (!match) {
    return undefined;
  }

  const cleaned = cleanupCourseName(match[1]);
  return cleaned || undefined;
}

function capitaliseWords(input: string): string {
  return input
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ""))
    .join(" ")
    .trim();
}
