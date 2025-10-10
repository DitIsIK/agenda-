import { addHours, isValid } from "date-fns";

import { CalendarEvent } from "./types";

export function isOverlapping(a: CalendarEvent, b: CalendarEvent): boolean {
  return a.start < b.end && b.start < a.end;
}

export function hasConflict(
  events: CalendarEvent[],
  candidate: CalendarEvent,
  options: { ignoreId?: string } = {}
): boolean {
  const { ignoreId } = options;

  return events.some((event) => {
    if (event.id === candidate.id) {
      return false;
    }

    if (ignoreId && event.id === ignoreId) {
      return false;
    }

    return isOverlapping(event, candidate);
  });
}

export function normalizeRange(startInput: Date, endInput: Date): { start: Date; end: Date } {
  const start = cloneDate(startInput);
  const end = cloneDate(endInput);

  if (!isValid(start)) {
    const now = new Date();
    return { start: now, end: addHours(now, 1) };
  }

  if (!isValid(end)) {
    return { start, end: addHours(start, 1) };
  }

  if (end <= start) {
    return { start, end: addHours(start, 1) };
  }

  return { start, end };
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}
