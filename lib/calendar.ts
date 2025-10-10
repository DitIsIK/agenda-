import { addDays, addMinutes, isAfter, isBefore, isEqual, set, startOfDay, subHours } from "date-fns";

export type EventType = "lesson" | "study" | "exam" | "task" | string;

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: EventType;
  description?: string;
  location?: string;
  source?: "csv" | "manual" | "ai" | string;
  locked?: boolean;
  meta?: Record<string, unknown>;
}

export interface Conflict {
  eventId: string;
  conflictingWithId: string;
  overlapMinutes: number;
}

export interface StudyRequest {
  course: string;
  examDate: Date;
  estimatedHours: number;
  chapters?: string[];
  avoidDays?: number[];
  avoidLateHours?: boolean;
  earliestStartHour?: number;
  latestEndHour?: number;
  blockMinutes?: number;
  reviewWithinHours?: number;
}

export interface StudyPlanResult {
  plannedEvents: CalendarEvent[];
  warnings: string[];
}

const DEFAULT_BLOCK_MINUTES = 50;
const DEFAULT_REVIEW_WINDOW_HOURS = 48;

const randomId = () => `evt-${Math.random().toString(36).slice(2, 10)}`;

const toDate = (value: Date | string | number): Date => {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  return new Date(value);
};

export function detectConflicts(events: CalendarEvent[]): Conflict[] {
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const conflicts: Conflict[] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const first = sorted[i];
      const second = sorted[j];

      if (first.end <= second.start) {
        break;
      }

      const overlapStart = first.start > second.start ? first.start : second.start;
      const overlapEnd = first.end < second.end ? first.end : second.end;
      const overlapMinutes = Math.max(0, Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 60000));

      if (overlapMinutes > 0) {
        conflicts.push({
          eventId: first.id,
          conflictingWithId: second.id,
          overlapMinutes,
        });
      }
    }
  }

  return conflicts;
}

const withinWorkingHours = (date: Date, earliest: number, latest: number) => {
  const hours = date.getHours() + date.getMinutes() / 60;
  return hours >= earliest && hours <= latest;
};

const isSlotAvailable = (events: CalendarEvent[], candidateStart: Date, candidateEnd: Date): boolean => {
  return events.every((event) => event.end <= candidateStart || event.start >= candidateEnd);
};

interface ResolveOptions {
  earliestStartHour?: number;
  latestEndHour?: number;
  stepMinutes?: number;
}

export function resolveConflicts(
  events: CalendarEvent[],
  options: ResolveOptions = {}
): { events: CalendarEvent[]; unresolved: Conflict[] } {
  const earliestStartHour = options.earliestStartHour ?? 8;
  const latestEndHour = options.latestEndHour ?? 22;
  const stepMinutes = options.stepMinutes ?? 30;

  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const adjusted: CalendarEvent[] = [];

  sorted.forEach((event) => {
    if (event.locked) {
      adjusted.push(event);
      return;
    }

    let candidateStart = new Date(event.start.getTime());
    let candidateEnd = new Date(event.end.getTime());
    let moved = false;
    const originalDuration = event.end.getTime() - event.start.getTime();
    const maxIterations = 500;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations += 1;

      if (
        withinWorkingHours(candidateStart, earliestStartHour, latestEndHour) &&
        withinWorkingHours(new Date(candidateEnd.getTime() - 1), earliestStartHour, latestEndHour) &&
        isSlotAvailable(adjusted, candidateStart, candidateEnd)
      ) {
        adjusted.push({ ...event, start: candidateStart, end: candidateEnd });
        moved = true;
        break;
      }

      candidateStart = addMinutes(candidateStart, stepMinutes);
      candidateEnd = new Date(candidateStart.getTime() + originalDuration);

      if (!withinWorkingHours(candidateStart, earliestStartHour, latestEndHour)) {
        const nextDay = addDays(startOfDay(addMinutes(candidateStart, stepMinutes)), 1);
        candidateStart = set(nextDay, { hours: earliestStartHour, minutes: 0, seconds: 0, milliseconds: 0 });
        candidateEnd = new Date(candidateStart.getTime() + originalDuration);
      }
    }

    if (!moved) {
      adjusted.push(event);
    }
  });

  return { events: adjusted, unresolved: detectConflicts(adjusted) };
}

const findSlot = (
  events: CalendarEvent[],
  searchStart: Date,
  searchEnd: Date,
  durationMinutes: number,
  avoidDays: Set<number>,
  earliestStartHour: number,
  latestEndHour: number
): Date | null => {
  let cursor = startOfDay(searchStart);

  while (!isAfter(cursor, searchEnd)) {
    if (avoidDays.has(cursor.getDay())) {
      cursor = addDays(cursor, 1);
      continue;
    }

    const dayStart = set(startOfDay(cursor), { hours: earliestStartHour, minutes: 0, seconds: 0, milliseconds: 0 });
    const dayEnd = set(startOfDay(cursor), { hours: latestEndHour, minutes: 0, seconds: 0, milliseconds: 0 });
    const lastPossibleStart = addMinutes(dayEnd, -durationMinutes);

    if (lastPossibleStart < dayStart) {
      cursor = addDays(cursor, 1);
      continue;
    }

    let candidate = dayStart < searchStart ? set(searchStart, { seconds: 0, milliseconds: 0 }) : dayStart;

    while (candidate <= lastPossibleStart) {
      const candidateEnd = addMinutes(candidate, durationMinutes);

      if (isSlotAvailable(events, candidate, candidateEnd)) {
        return candidate;
      }

      candidate = addMinutes(candidate, durationMinutes + 10);
    }

    cursor = addDays(cursor, 1);
  }

  return null;
};

export function planStudyBlocks(
  request: StudyRequest,
  existingEvents: CalendarEvent[]
): StudyPlanResult {
  const warnings: string[] = [];
  const planned: CalendarEvent[] = [];

  const estimatedMinutes = Math.max(1, Math.round(request.estimatedHours * 60));
  const blockMinutes = request.blockMinutes ?? DEFAULT_BLOCK_MINUTES;
  const blockCount = Math.max(1, Math.ceil(estimatedMinutes / blockMinutes));
  const avoidDays = new Set(request.avoidDays ?? []);
  const earliestStartHour = request.earliestStartHour ?? 8;
  const latestEndHour = request.latestEndHour ?? (request.avoidLateHours ? 21 : 22);
  const reviewWindow = request.reviewWithinHours ?? DEFAULT_REVIEW_WINDOW_HOURS;

  const combinedEvents = existingEvents.map((event) => ({ ...event }));
  let searchStart = new Date();
  const examDate = toDate(request.examDate);
  const reviewSearchStart = subHours(examDate, reviewWindow);
  const reviewSearchEnd = subHours(examDate, 1);

  const scheduleBlock = (title: string, meta: Record<string, unknown>, startFrom: Date, hardDeadline: Date) => {
    const slotStart = findSlot(
      [...combinedEvents, ...planned],
      startFrom,
      hardDeadline,
      blockMinutes,
      avoidDays,
      earliestStartHour,
      latestEndHour
    );

    if (!slotStart) {
      warnings.push(
        `Geen vrije plek gevonden voor "${title}" vóór ${hardDeadline.toLocaleString("nl-NL")}.`
      );
      return null;
    }

    const slotEnd = addMinutes(slotStart, blockMinutes);
    const event: CalendarEvent = {
      id: randomId(),
      title,
      type: "study",
      start: slotStart,
      end: slotEnd,
      source: "ai",
      locked: false,
      meta,
    };

    planned.push(event);
    return event;
  };

  for (let index = 0; index < blockCount - 1; index += 1) {
    const blockTitle = `${request.course} — studieblok ${index + 1}`;
    const deadline = subHours(examDate, reviewWindow + 1);
    scheduleBlock(blockTitle, { blockIndex: index + 1 }, searchStart, deadline);
    searchStart = addMinutes(searchStart, blockMinutes);
  }

  const reviewTitle = `${request.course} — review`; // ensure review scheduled near exam
  scheduleBlock(reviewTitle, { review: true }, reviewSearchStart, reviewSearchEnd);

  return { plannedEvents: planned, warnings };
}

export const parseChapters = (input?: string): string[] => {
  if (!input) {
    return [];
  }

  return input
    .split(/[;,]/)
    .map((chapter) => chapter.trim())
    .filter(Boolean);
};

export const normalizeEvent = (event: Omit<CalendarEvent, "id"> & { id?: string }): CalendarEvent => ({
  ...event,
  id: event.id ?? randomId(),
  start: toDate(event.start),
  end: toDate(event.end),
});

export const ensureChronological = (start: Date, end: Date): { start: Date; end: Date } => {
  if (isBefore(end, start) || isEqual(end, start)) {
    const adjustedEnd = addMinutes(start, 30);
    return { start, end: adjustedEnd };
  }

  return { start, end };
};
