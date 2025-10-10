"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { addMinutes } from "date-fns";

import {
  CalendarEvent,
  Conflict,
  StudyPlanResult,
  StudyRequest,
  detectConflicts,
  ensureChronological,
  normalizeEvent,
  planStudyBlocks,
  resolveConflicts,
} from "@/lib/calendar";

type EventInput = Omit<CalendarEvent, "id"> & { id?: string };

interface EventContextValue {
  events: CalendarEvent[];
  conflicts: Conflict[];
  warnings: string[];
  lastPlan: { request: StudyRequest; result: StudyPlanResult } | null;
  addEvent: (input: EventInput) => CalendarEvent;
  importEvents: (items: EventInput[]) => void;
  removeEvent: (id: string) => void;
  toggleLock: (id: string) => void;
  updateEventTime: (id: string, start: Date, end: Date) => void;
  planStudyRequest: (request: StudyRequest) => StudyPlanResult;
  resolveCurrentConflicts: () => void;
  clearWarnings: () => void;
}

const EventContext = createContext<EventContextValue | undefined>(undefined);

const initialEvents: CalendarEvent[] = [
  normalizeEvent({
    id: "lesson-1",
    title: "Communicatie 101 – College",
    start: addMinutes(new Date(), -90),
    end: addMinutes(new Date(), -30),
    type: "lesson",
    source: "csv",
    locked: true,
    location: "Lokaal B2.10",
  }),
  normalizeEvent({
    id: "lesson-2",
    title: "Projectgroep Marketing",
    start: addMinutes(new Date(), 120),
    end: addMinutes(new Date(), 210),
    type: "lesson",
    source: "csv",
    locked: true,
    location: "Projectruimte 4",
  }),
  normalizeEvent({
    id: "exam-1",
    title: "Marketing – Tussentoets",
    start: addMinutes(new Date(), 9 * 24 * 60),
    end: addMinutes(new Date(), 9 * 24 * 60 + 120),
    type: "exam",
    locked: true,
    source: "manual",
  }),
];

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastPlan, setLastPlan] = useState<{
    request: StudyRequest;
    result: StudyPlanResult;
  } | null>(null);

  const conflicts = useMemo(() => detectConflicts(events), [events]);

  const addEvent = (input: EventInput): CalendarEvent => {
    const normalized = normalizeEvent(input);
    const { start, end } = ensureChronological(normalized.start, normalized.end);
    const event: CalendarEvent = { ...normalized, start, end };

    setEvents((prev) => [...prev, event]);
    return event;
  };

  const importEvents = (items: EventInput[]) => {
    const normalized = items.map((item) => normalizeEvent(item));
    setEvents((prev) => [...prev, ...normalized]);
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const toggleLock = (id: string) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id
          ? {
              ...event,
              locked: !event.locked,
            }
          : event
      )
    );
  };

  const updateEventTime = (id: string, start: Date, end: Date) => {
    const { start: safeStart, end: safeEnd } = ensureChronological(start, end);
    setEvents((prev) =>
      prev.map((event) => (event.id === id ? { ...event, start: safeStart, end: safeEnd } : event))
    );
  };

  const planStudyRequest = (request: StudyRequest) => {
    const result = planStudyBlocks(request, events);
    if (result.plannedEvents.length > 0) {
      setEvents((prev) => [...prev, ...result.plannedEvents]);
    }

    setWarnings(result.warnings);
    setLastPlan({ request, result });
    return result;
  };

  const resolveCurrentConflicts = () => {
    const { events: resolved, unresolved } = resolveConflicts(events);
    setEvents(resolved);

    if (unresolved.length) {
      setWarnings(
        unresolved.map(
          (conflict) =>
            `Conflicten blijven bestaan tussen ${conflict.eventId} en ${conflict.conflictingWithId} (${conflict.overlapMinutes} min).`
        )
      );
    } else {
      setWarnings([]);
    }
  };

  const clearWarnings = () => setWarnings([]);

  const value: EventContextValue = {
    events,
    conflicts,
    warnings,
    lastPlan,
    addEvent,
    importEvents,
    removeEvent,
    toggleLock,
    updateEventTime,
    planStudyRequest,
    resolveCurrentConflicts,
    clearWarnings,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventContext);

  if (!context) {
    throw new Error("useEvents moet binnen een EventProvider worden gebruikt");
  }

  return context;
}
